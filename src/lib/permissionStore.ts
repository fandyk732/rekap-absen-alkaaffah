export interface PermissionRecord {
  id: string;
  pin: string;
  employeeName: string;
  type: 'Izin' | 'Sakit' | 'Cuti' | 'Dinas Luar';
  startDate: string; // Format YYYY-MM-DD atau DD-MM-YYYY
  endDate: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
}

// Memory store awal dengan beberapa dummy data pending
let globalPermissions: PermissionRecord[] = [
  {
    id: '1',
    pin: '2026122',
    employeeName: 'RAFIL',
    type: 'Sakit',
    startDate: '21-08-2026',
    endDate: '21-08-2026',
    reason: 'Demam tinggi & flu',
    status: 'Approved',
    createdAt: '2026-08-20',
  },
  {
    id: '2',
    pin: '201114',
    employeeName: 'SUTRISNO',
    type: 'Cuti',
    startDate: '03-08-2026',
    endDate: '07-08-2026',
    reason: 'Acara keluarga di luar kota',
    status: 'Pending',
    createdAt: '2026-08-01',
  },
];

export const getPermissions = () => globalPermissions;

export const addPermission = (permission: Omit<PermissionRecord, 'id' | 'createdAt' | 'status'>) => {
  const newRecord: PermissionRecord = {
    ...permission,
    id: String(Date.now()),
    status: 'Pending',
    createdAt: new Date().toISOString().split('T')[0],
  };
  globalPermissions.unshift(newRecord);
  return newRecord;
};

export const updatePermissionStatus = (id: string, status: 'Approved' | 'Rejected') => {
  const item = globalPermissions.find((p) => p.id === id);
  if (item) {
    item.status = status;
  }
  return item;
};