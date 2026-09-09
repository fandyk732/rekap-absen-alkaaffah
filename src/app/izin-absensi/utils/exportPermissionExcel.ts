import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { formatDateDisplay } from './formatters';

interface ExportOptions {
  filteredData: any[];
  monthName: string;
  selectedYear: number;
}

export const exportPermissionsToExcel = ({
  filteredData,
  monthName,
  selectedYear,
}: ExportOptions) => {
  if (filteredData.length === 0) {
    toast.error('Tidak ada data untuk diunduh.');
    return;
  }

  const dataToExport = filteredData.map((item, index) => ({
    No: index + 1,
    'PIN Pegawai': item.pin,
    'Nama Pegawai': item.employeeName,
    'Tipe Izin': item.type,
    'Jam Pulang Awal':
      item.type === 'Pulang Awal' && item.earlyLeaveTime ? item.earlyLeaveTime : '-',
    'Tanggal Mulai': formatDateDisplay(item.startDate),
    'Tanggal Selesai': formatDateDisplay(item.endDate),
    'Keterangan / Alasan': item.reason || '-',
    Status:
      item.status === 'APPROVED' || item.status === 'Approved'
        ? 'Disetujui'
        : item.status === 'REJECTED' || item.status === 'Rejected'
        ? 'Ditolak'
        : 'Pending',
    'Tanggal Pengajuan': formatDateDisplay(item.createdAt),
  }));

  const worksheet = XLSX.utils.json_to_sheet(dataToExport);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan_Izin');

  const max_width = dataToExport.reduce(
    (w, r) => Math.max(w, String(r['Nama Pegawai']).length),
    10
  );
  worksheet['!cols'] = [
    { wch: 5 },
    { wch: 15 },
    { wch: max_width + 5 },
    { wch: 15 },
    { wch: 16 },
    { wch: 15 },
    { wch: 15 },
    { wch: 30 },
    { wch: 12 },
    { wch: 18 },
  ];

  XLSX.writeFile(workbook, `Laporan_Izin_Absensi_${monthName}_${selectedYear}.xlsx`);
  toast.success('Laporan berhasil diunduh!');
};