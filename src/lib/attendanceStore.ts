// Global store sementara di memori server
export interface AttendanceRecord {
  id: string;
  pin: string;
  name: string;
  date: string; // Format DD-MM-YYYY
  checkIn: string;
  checkOut: string;
  status: string;
  flagColor: string;
}

let globalAttendanceLogs: AttendanceRecord[] = [];

export const setAttendanceLogs = (logs: AttendanceRecord[]) => {
  // Merge / replace logs
  globalAttendanceLogs = logs;
};

export const getAttendanceLogs = () => {
  return globalAttendanceLogs;
};