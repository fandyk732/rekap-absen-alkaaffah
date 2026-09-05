import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'Tidak ada file yang diunggah' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Read Excel File
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Read rows as array of arrays
    const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

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