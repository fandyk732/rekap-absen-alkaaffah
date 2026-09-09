import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface ExportMatrixOptions {
  filteredData: any[];
  daysInMonth: number;
  selectedMonth: number;
  selectedYear: number;
  monthNames: string[];
}

export const exportMatrixToExcel = async ({
  filteredData,
  daysInMonth,
  selectedMonth,
  selectedYear,
  monthNames,
}: ExportMatrixOptions) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Matriks Kehadiran');

  // 1. Judul Header Laporan
  worksheet.mergeCells(1, 1, 1, daysInMonth + 8);
  const titleCell = worksheet.getCell(1, 1);
  titleCell.value = `MATRIKS KEHADIRAN PEGAWAI - ${monthNames[selectedMonth - 1].toUpperCase()} ${selectedYear}`;
  titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF1E293B' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

  worksheet.addRow([]);

  // 2. Header Tabel
  const headerRowValues: any[] = ['No', 'PIN', 'Nama Pegawai', 'Jabatan'];
  for (let day = 1; day <= daysInMonth; day++) {
    headerRowValues.push(day);
  }
  headerRowValues.push('H', 'T', 'I', 'S', 'A');

  const headerRow = worksheet.addRow(headerRowValues);
  headerRow.height = 26;

  headerRow.eachCell((cell, colNumber) => {
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };

    if (colNumber <= 4) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
    } else if (colNumber <= 4 + daysInMonth) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF475569' } };
    } else {
      const bgColors = ['FF059669', 'FFD97706', 'FF2563EB', 'FF9333EA', 'FFE11D48'];
      const idx = colNumber - (4 + daysInMonth) - 1;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColors[idx] || 'FF334155' } };
    }

    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    };
  });

  // 3. Data Pegawai
  filteredData.forEach((emp, index) => {
    const rowValues: any[] = [
      index + 1,
      emp.pin || '-',
      emp.name || '-',
      emp.role || 'Pegawai',
    ];

    for (let day = 1; day <= daysInMonth; day++) {
      const statusObj = emp.dailyStatus?.[String(day)];
      let cellText = '-';

      if (statusObj) {
        switch (statusObj.status) {
          case 'Hadir':
          case 'Terlambat': {
            const inTime = statusObj.checkIn || '-';
            const outTime = statusObj.checkOut || '?';
            cellText = `M: ${inTime}\nP: ${outTime}`;
            break;
          }
          case 'Izin':
            cellText = 'I';
            break;
          case 'Sakit':
            cellText = 'S';
            break;
          case 'Alpha':
            cellText = 'A';
            break;
        }
      }
      rowValues.push(cellText);
    }

    rowValues.push(
      emp.summary?.hadir || 0,
      emp.summary?.terlambat || 0,
      emp.summary?.izinSakit || 0,
      0,
      emp.summary?.alpha || 0
    );

    const dataRow = worksheet.addRow(rowValues);
    dataRow.height = 32;

    dataRow.eachCell((cell, colNumber) => {
      cell.font = { name: 'Arial', size: 8 };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

      if (colNumber === 3 || colNumber === 4) {
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      }

      if (colNumber > 4 && colNumber <= 4 + daysInMonth) {
        const dayNum = colNumber - 4;
        const statusObj = emp.dailyStatus?.[String(dayNum)];

        if (statusObj) {
          if (statusObj.status === 'Hadir') {
            if (statusObj.isEarlyLeave) {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEDD5' } };
              cell.font = { size: 8, bold: true, color: { argb: 'FFC2410C' } };
            } else {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
              cell.font = { size: 8, color: { argb: 'FF065F46' } };
            }
          } else if (statusObj.status === 'Terlambat') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
            cell.font = { size: 8, bold: true, color: { argb: 'FF92400E' } };
          } else if (statusObj.status === 'Izin') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };
            cell.font = { size: 9, bold: true, color: { argb: 'FF1E40AF' } };
          } else if (statusObj.status === 'Sakit') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3E8FF' } };
            cell.font = { size: 9, bold: true, color: { argb: 'FF6B21A8' } };
          } else if (statusObj.status === 'Alpha') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
            cell.font = { size: 9, bold: true, color: { argb: 'FF991B1B' } };
          }
        } else {
          cell.font = { size: 9, color: { argb: 'FF94A3B8' } };
        }
      }

      if (colNumber > 4 + daysInMonth) {
        cell.font = { size: 9, bold: true };
      }

      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
    });
  });

  // 4. Lebar Kolom
  worksheet.getColumn(1).width = 5;
  worksheet.getColumn(2).width = 12;
  worksheet.getColumn(3).width = 25;
  worksheet.getColumn(4).width = 18;

  for (let i = 5; i <= 4 + daysInMonth; i++) {
    worksheet.getColumn(i).width = 8.5;
  }

  for (let i = 5 + daysInMonth; i <= 9 + daysInMonth; i++) {
    worksheet.getColumn(i).width = 6;
  }

  // 5. Download Blob
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `Matriks_Kehadiran_${monthNames[selectedMonth - 1]}_${selectedYear}.xlsx`);
};