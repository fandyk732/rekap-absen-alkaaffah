import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import ExcelJS from 'exceljs';

function parseDateString(dateStr: string): Date {
  if (!dateStr) return new Date(0);
  const cleanStr = dateStr.trim();
  if (cleanStr.includes('-') || cleanStr.includes('/')) {
    const sep = cleanStr.includes('-') ? '-' : '/';
    const parts = cleanStr.split(sep);
    if (parts[0].length === 2 && parts[2].length === 4) {
      return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    }
    if (parts[0].length === 4) {
      return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }
  }
  return new Date(cleanStr);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1), 10);
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()), 10);

    const daysInMonth = new Date(year, month, 0).getDate();
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const monthName = monthNames[month - 1];

    const [employees, allLogs, permissions, holidays] = await Promise.all([
      prisma.employee.findMany({
        where: { status: 'Aktif' },
        include: { schedules: true },
        orderBy: { name: 'asc' },
      }),
      prisma.attendanceLog.findMany(),
      prisma.permission.findMany({
        where: { status: { in: ['Approved', 'APPROVED', 'approved', 'Disetujui', 'DISETUJUI'] } },
      }),
      prisma.holiday.findMany(),
    ]);

    const formattedMonth = String(month).padStart(2, '0');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Matriks Kehadiran');
    worksheet.views = [{ showGridLines: true }];

    // Header Judul Laporan
    worksheet.mergeCells('A1:AJ1');
    worksheet.getCell('A1').value = 'SMKS AL KAAFFAH - LAPORAN MATRIKS KEHADIRAN PEGAWAI';
    worksheet.getCell('A1').font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF1E3A8A' } };

    worksheet.mergeCells('A2:AJ2');
    worksheet.getCell('A2').value = `Periode: ${monthName} ${year} | Dicetak Pada: ${new Date().toLocaleDateString('id-ID')}`;
    worksheet.getCell('A2').font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF475569' } };

    worksheet.addRow([]); // Spacing

    // Header Tabel
    const headerRowValues = ['No', 'PIN', 'Nama Pegawai', 'Jabatan / Role'];
    for (let i = 1; i <= daysInMonth; i++) {
      headerRowValues.push(String(i));
    }
    headerRowValues.push('H', 'T', 'A', 'I');

    const headerRow = worksheet.addRow(headerRowValues);
    headerRow.height = 28;

    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
      cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      };
    });

    // Body
    employees.forEach((emp, index) => {
      let totalHadir = 0;
      let totalTerlambat = 0;
      let totalMangkir = 0;
      let totalIzin = 0;

      const scheduleMap: Record<number, boolean> = {};
      if (emp.schedules && Array.isArray(emp.schedules)) {
        emp.schedules.forEach((s: any) => {
          scheduleMap[s.dayOfWeek] = s.isWorking;
        });
      }

      const rowValues: (string | number)[] = [index + 1, emp.pin, emp.name, emp.role || 'Pegawai'];

      for (let day = 1; day <= daysInMonth; day++) {
        const dayStr = String(day).padStart(2, '0');
        const targetDateStr = `${dayStr}-${formattedMonth}-${year}`;
        const currentDateObj = new Date(year, month - 1, day);
        currentDateObj.setHours(0, 0, 0, 0);

        const dayOfWeek = currentDateObj.getDay();

        const dateIsoFormat = `${year}-${formattedMonth}-${dayStr}`;
        const dateLocalFormat = `${dayStr}-${formattedMonth}-${year}`;
        const dateSingleDigit = `${day}-${month}-${year}`;

        const record = allLogs.find(
          (l) => String(l.pin).trim() === String(emp.pin).trim() && (l.date === targetDateStr || l.date === dateSingleDigit || l.date === dateIsoFormat)
        );

        const approvedPermission = permissions.find((p) => {
          if (String(p.pin).trim() !== String(emp.pin).trim()) return false;
          const startDate = parseDateString(p.startDate);
          const endDate = parseDateString(p.endDate || p.startDate);
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          return currentDateObj >= startDate && currentDateObj <= endDate;
        });

        const isHolidaySetting = holidays.some((h) => {
          if (!h.date) return false;
          const cleanHDate = h.date.trim();
          return cleanHDate === dateIsoFormat || cleanHDate === dateLocalFormat || cleanHDate === dateSingleDigit;
        });

        const customWorking = scheduleMap[dayOfWeek];
        const isScheduledOff = customWorking !== undefined ? !customWorking : dayOfWeek === 0;
        const isWeekendOrHoliday = isHolidaySetting || isScheduledOff;

        if (approvedPermission) {
          totalIzin++;
          const pType = approvedPermission.type || 'Izin';
          rowValues.push(pType.includes('Sakit') ? 'S' : pType.includes('Cuti') ? 'C' : 'I');
        } else if (record) {
          if (record.flagColor === 'amber') {
            totalTerlambat++;
            rowValues.push('T');
          } else {
            totalHadir++;
            rowValues.push('H');
          }
        } else if (isWeekendOrHoliday) {
          rowValues.push('L');
        } else {
          totalMangkir++;
          rowValues.push('A');
        }
      }

      rowValues.push(totalHadir + totalTerlambat, totalTerlambat, totalMangkir, totalIzin);

      const dataRow = worksheet.addRow(rowValues);
      dataRow.height = 20;

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
          }
        } else {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.font = { name: 'Arial', size: 9, bold: true };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        }
      });
    });

    // Width
    worksheet.getColumn(1).width = 5;
    worksheet.getColumn(2).width = 12;
    worksheet.getColumn(3).width = 28;
    worksheet.getColumn(4).width = 14;

    for (let i = 5; i <= 4 + daysInMonth; i++) worksheet.getColumn(i).width = 4.5;
    for (let i = 5 + daysInMonth; i <= 8 + daysInMonth; i++) worksheet.getColumn(i).width = 6.5;

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