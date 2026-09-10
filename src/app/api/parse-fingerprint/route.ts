import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';

// Sebelumnya route ini baca file upload pakai 'xlsx' (SheetJS) versi 0.18.5,
// yang punya 2 CVE belum di-patch di npm: CVE-2023-30533 (Prototype Pollution)
// dan CVE-2024-22363 (ReDoS) — keduanya ke-trigger lewat file yang sengaja
// dicrafting jahat. Karena route ini fungsinya PERSIS "baca file upload dari
// user", ini titik yang paling relevan buat exploit itu. Diganti ke ExcelJS,
// yang nggak punya CVE itu.
//
// Cuma bagian "baca file jadi array baris" yang diganti — logic parsing
// header/data di bawah ini SAMA PERSIS kayak sebelumnya, cuma sumber
// `rawRows`-nya beda.

// Konversi satu cell ExcelJS jadi value mentah yang setara sama sheet_to_json({header:1})
// milik SheetJS: string/number polos, bukan objek RichText/Formula/Hyperlink/Date.
function cellToRawValue(cell: ExcelJS.Cell): any {
  const v = cell.value;
  if (v === null || v === undefined) return v;

  if (v instanceof Date) {
    // Excel nyimpen jam (mis. "07:48:03") sebagai Date dengan basis tanggal 1899/1900.
    // Kalau basisnya itu, berarti ini sebenernya cell JAM, bukan cell TANGGAL.
    const isTimeOnlyBase = v.getUTCFullYear() === 1899 || v.getUTCFullYear() === 1900;
    if (isTimeOnlyBase) {
      const hh = String(v.getUTCHours()).padStart(2, '0');
      const mm = String(v.getUTCMinutes()).padStart(2, '0');
      const ss = String(v.getUTCSeconds()).padStart(2, '0');
      return `${hh}:${mm}:${ss}`;
    }
    const dd = String(v.getDate()).padStart(2, '0');
    const mo = String(v.getMonth() + 1).padStart(2, '0');
    const yyyy = v.getFullYear();
    return `${dd}-${mo}-${yyyy}`;
  }

  if (typeof v === 'object') {
    const anyV = v as any;
    if (Array.isArray(anyV.richText)) {
      return anyV.richText.map((t: any) => t.text).join('');
    }
    if ('result' in anyV) return anyV.result; // formula cell
    if ('text' in anyV) return anyV.text; // hyperlink cell
  }

  return v;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'Tidak ada file yang diunggah' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Baca Excel File
    // Cast ke `any`: bentrok tipe kosmetik antara Buffer generik dari @types/node versi
    // project ini vs signature Buffer non-generik yang dipakai definisi tipe exceljs.
    // Nilai runtime-nya tetap Buffer asli, cuma declaration-nya yang beda.
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);
    const worksheet = workbook.worksheets[0];

    if (!worksheet) {
      return NextResponse.json({ success: false, error: 'File Excel kosong.' }, { status: 400 });
    }

    // Baca semua baris jadi array-of-arrays, sama kayak format lama
    const rawRows: any[][] = [];
    worksheet.eachRow({ includeEmpty: true }, (row) => {
      const values: any[] = [];
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        values[colNumber - 1] = cellToRawValue(cell);
      });
      rawRows.push(values);
    });

    if (!rawRows || rawRows.length === 0) {
      return NextResponse.json({ success: false, error: 'File Excel kosong.' }, { status: 400 });
    }

    // Cari baris mana yang berisi header "Tanggal" dan "PIN"
    let headerRowIndex = -1;
    let headers: string[] = [];

    for (let r = 0; r < Math.min(10, rawRows.length); r++) {
      const rowStr = (rawRows[r] || []).map((c) => String(c || '').trim().toLowerCase());
      if (rowStr.includes('tanggal') && rowStr.includes('pin')) {
        headerRowIndex = r;
        headers = rawRows[r].map((c) => String(c || '').trim());
        break;
      }
    }

    if (headerRowIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Struktur Excel tidak valid: Header Tanggal/PIN tidak ditemukan.' },
        { status: 400 }
      );
    }

    // Index mapping
    const idxTanggal = headers.indexOf('Tanggal');
    const idxPIN = headers.indexOf('PIN');
    const idxNama = headers.indexOf('Nama');
    const idxScanMasuk = headers.indexOf('Scan masuk');
    const idxScanPulang = headers.indexOf('Scan pulang');
    const idxTerlambat = headers.indexOf('Terlambat');
    const idxJadwal = headers.indexOf('Jadwal');

    const parsedData: any[] = [];

    // Format jam (07.48.03 -> 07:48)
    const formatTime = (timeStr: any) => {
      if (!timeStr || timeStr === 'NaN' || timeStr === '-' || timeStr === '00.00.00') return '--:--';
      const str = String(timeStr).trim().replace(/\./g, ':');
      const parts = str.split(':');
      return parts.length >= 2 ? `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}` : str;
    };

    // Loop data mulai dari baris setelah header
    for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
      const row = rawRows[i];
      if (!row || row.length === 0) continue;

      const tanggal = row[idxTanggal] || '';
      const pin = row[idxPIN] || '';
      const nama = row[idxNama] || '';
      const scanMasukRaw = row[idxScanMasuk];
      const scanPulangRaw = row[idxScanPulang];
      const terlambatMin = parseInt(row[idxTerlambat] || '0', 10);
      const jadwal = String(row[idxJadwal] || '');

      // Abaikan jika tidak ada nama/PIN
      if (!nama && !pin) continue;

      const checkIn = formatTime(scanMasukRaw);
      const checkOut = formatTime(scanPulangRaw);

      // Status Keterlambatan / Kehadiran
      let status = 'Valid';
      let flagColor = 'emerald';

      if (terlambatMin > 0) {
        status = `Terlambat (${terlambatMin} mnt)`;
        flagColor = 'amber';
      } else if (checkIn === '--:--' && !jadwal.toLowerCase().includes('libur')) {
        status = 'Tidak Scan (Mangkir/DL)';
        flagColor = 'rose';
      }

      parsedData.push({
        id: String(i),
        pin: String(pin),
        name: String(nama),
        date: String(tanggal),
        checkIn,
        checkOut,
        status,
        flagColor,
      });
    }

    return NextResponse.json({
      success: true,
      count: parsedData.length,
      data: parsedData,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Gagal di server: ' + error.message }, { status: 500 });
  }
}