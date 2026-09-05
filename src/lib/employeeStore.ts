export interface Employee {
  id: string;
  pin: string;
  name: string;
  nip?: string;
  role: string; // Misal: Guru, Staff IT, Tata Usaha, Kepala Sekolah
  gender: 'L' | 'P';
  phone?: string;
  status: 'Aktif' | 'Non-Aktif';
}

// Data awal (diambil dari daftar yang ada di Excel/Fingerprint)
let globalEmployees: Employee[] = [
  { id: '1', pin: '201012', name: 'EVA SWASTIKA SARI', role: 'Guru', gender: 'P', status: 'Aktif' },
  { id: '2', pin: '201114', name: 'SUTRISNO', role: 'Guru', gender: 'L', status: 'Aktif' },
  { id: '3', pin: '201214', name: 'YENY DWI AFRELIA', role: 'Guru', gender: 'P', status: 'Aktif' },
  { id: '4', pin: '201462', name: 'HARIADI', role: 'Guru', gender: 'L', status: 'Aktif' },
  { id: '5', pin: '201463', name: 'EKA DEVI VIDIAWATI NINGSIH', role: 'Guru', gender: 'P', status: 'Aktif' },
  { id: '6', pin: '201568', name: 'ARIF MAFATIA KARIM', role: 'Guru', gender: 'L', status: 'Aktif' },
  { id: '7', pin: '201777', name: 'LILIS ARMIATI', role: 'Guru', gender: 'P', status: 'Aktif' },
  { id: '8', pin: '201781', name: 'RUBIKA NASTITI', role: 'Guru', gender: 'P', status: 'Aktif' },
  { id: '9', pin: '201787', name: 'KHUSNUL HUDA', role: 'Guru', gender: 'L', status: 'Aktif' },
  { id: '10', pin: '201888', name: 'BUYUNG DAMARJATI', role: 'Guru', gender: 'L', status: 'Aktif' },
  { id: '11', pin: '202196', name: 'FAHRUN NISA', role: 'Guru', gender: 'P', status: 'Aktif' },
  { id: '12', pin: '2021104', name: 'FANDYK AZIZ LUKMANA', role: 'Guru', gender: 'L', status: 'Aktif' },
  { id: '13', pin: '2022108', name: 'IBNU AL HAFID', role: 'Guru', gender: 'L', status: 'Aktif' },
  { id: '14', pin: '2022110', name: 'KHUSNUL DEVI AINIA', role: 'Guru', gender: 'P', status: 'Aktif' },
  { id: '15', pin: '2026121', name: 'RATNA', role: 'Guru', gender: 'P', status: 'Aktif' },
  { id: '16', pin: '2026122', name: 'RAFIL', role: 'Staff IT', gender: 'L', status: 'Aktif' },
];

export const getEmployees = () => globalEmployees;

export const addEmployee = (emp: Omit<Employee, 'id'>) => {
  const newEmp = { ...emp, id: String(Date.now()) };
  globalEmployees.unshift(newEmp);
  return newEmp;
};

export const updateEmployee = (id: string, empData: Partial<Employee>) => {
  const index = globalEmployees.findIndex((e) => e.id === id);
  if (index !== -1) {
    globalEmployees[index] = { ...globalEmployees[index], ...empData };
    return globalEmployees[index];
  }
  return null;
};

export const deleteEmployee = (id: string) => {
  globalEmployees = globalEmployees.filter((e) => e.id !== id);
};