import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import ExcelJS from 'exceljs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const month = parseInt(searchParams.get('month') || '8', 10);
    const year = parseInt(searchParams.get('year') || '2026', 10);

    const daysInMonth = new Date(year, month, 0).getDate();
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const monthName = monthNames[month - 1];

    // 1. Fetch Data dari Database
    const [employees, allLogs, permissions] = await Promise.all([
      prisma.employee.findMany({ where: { status: 'Aktif' }, orderBy: { name: 'asc' } }),
      prisma.attendanceLog.findMany(),
      prisma.permission.findMany({ where: { status: 'Approved' } }),
    ]);

    const formattedMonth = String(month).padStart(2, '0');

    // 2. Inisialisasi ExcelJS Workbook & Sheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Matriks Kehadiran');

    worksheet.views = [{ showGridLines: true }];

    // 3. Header Judul Laporan
    worksheet.mergeCells('A1:AJ1');
    worksheet.getCell('A1').value = 'SMKS AL KAAFFAH - LAPORAN MATRIKS KEHADIRAN PEGAWAI';
    worksheet.getCell('A1').font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF1E3A8A' } };

    worksheet.mergeCells('A2:AJ2');
    worksheet.getCell('A2').value = `Periode: ${monthName} ${year} | Dicetak Pada: ${new Date().toLocaleDateString('id-ID')}`;
    worksheet.getCell('A2').font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF475569' } };

    worksheet.addRow([]); // Baris kosong spacing

    // 4. Header Tabel (Baris 4)
    const headerRowValues = ['No', 'PIN', 'Nama Pegawai', 'Jabatan / Role'];
    for (let i = 1; i <= daysInMonth; i++) {
      headerRowValues.push(String(i));
    }
    headerRowValues.push('H', 'T', 'A', 'I');

    const headerRow = worksheet.addRow(headerRowValues);
    headerRow.height = 28;

    // Styling Header Tabel
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } }; // Dark Blue
      cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      };
    });

    // 5. Isi Data Pegawai & Status Harian
    employees.forEach((emp, index) => {
      let totalHadir = 0;
      let totalTerlambat = 0;
      let totalMangkir = 0;
      let totalIzin = 0;

      const rowValues: (string | number)[] = [index + 1, emp.pin, emp.name, emp.role];

      for (let day = 1; day <= daysInMonth; day++) {
        const dayStr = String(day).padStart(2, '0');
        const targetDate = `${dayStr}-${formattedMonth}-${year}`;
        const dateObj = new Date(year, month - 1, day);
        const dayOfWeek = dateObj.getDay();

        const record = allLogs.find(
          (l) => String(l.pin).trim() === String(emp.pin).trim() && (l.date === targetDate || l.date === `${day}-${month}-${year}`)
        );

        const approvedPermission = permissions.find(
          (p) => String(p.pin).trim() === String(emp.pin).trim() && targetDate >= p.startDate && targetDate <= p.endDate
        );

        if (approvedPermission) {
          totalIzin++;
          rowValues.push(approvedPermission.type === 'Sakit' ? 'S' : approvedPermission.type === 'Cuti' ? 'C' : 'I');
        } else if (record) {
          if (record.flagColor === 'amber') {
            totalTerlambat++;
            rowValues.push('T');
          } else if (record.flagColor === 'emerald') {
            totalHadir++;
            rowValues.push('H');
          } else if (record.flagColor === 'rose') {
            if (dayOfWeek === 0 || dayOfWeek === 6) {
              rowValues.push('L');
            } else {
              totalMangkir++;
              rowValues.push('A');
            }
          }
        } else {
          if (dayOfWeek === 0 || dayOfWeek === 6) {
            rowValues.push('L');
          } else {
            rowValues.push('-');
          }
        }
      }

      // Append Total Summary
      rowValues.push(totalHadir + totalTerlambat, totalTerlambat, totalMangkir, totalIzin);

      const dataRow = worksheet.addRow(rowValues);
      dataRow.height = 20;

      // Styling per Cell
      dataRow.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };

        if (colNumber === 1 || colNumber === 2 || colNumber === 4) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.font = { name: 'Arial', size: 9 };
        } else if (colNumber === 3) {
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
          cell.font = { name: 'Arial', size: 9, bold: true };
        } else if (colNumber > 4 && colNumber <= 4 + daysInMonth) {
          // Color Badge Harian
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          const val = String(cell.value);

          if (val === 'H') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
            cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF065F46' } };
          } else if (val === 'T') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
            cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF92400E' } };
          } else if (val === 'A') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE4E6' } };
            cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF9F1239' } };
          } else if (['I', 'S', 'C'].includes(val)) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3E8FF' } };
            cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF6B21A8' } };
          } else if (val === 'L') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
            cell.font = { name: 'Arial', size: 9, color: { argb: 'FF94A3B8' } };
          } else {
            cell.font = { name: 'Arial', size: 9, color: { argb: 'FFCBD5E1' } };
          }
        } else {
          // Rekap Columns
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.font = { name: 'Arial', size: 9, bold: true };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        }
      });
    });

    // 6. Set Width Kolom
    worksheet.getColumn(1).width = 5;  // No
    worksheet.getColumn(2).width = 12; // PIN
    worksheet.getColumn(3).width = 28; // Nama
    worksheet.getColumn(4).width = 14; // Jabatan

    for (let i = 5; i <= 4 + daysInMonth; i++) {
      worksheet.getColumn(i).width = 4.5;
    }
    for (let i = 5 + daysInMonth; i <= 8 + daysInMonth; i++) {
      worksheet.getColumn(i).width = 6.5;
    }

    // 7. Output Buffer untuk Download
    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Matriks_Kehadiran_AlKaaffah_${monthName}_${year}.xlsx"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}