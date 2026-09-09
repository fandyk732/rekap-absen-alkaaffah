export const formatDateDisplay = (dateStr: string) => {
  if (!dateStr) return '-';

  if (typeof dateStr === 'string' && (dateStr.includes('-') || dateStr.includes('/'))) {
    const separator = dateStr.includes('-') ? '-' : '/';
    const parts = dateStr.split(separator);

    if (parts.length === 3) {
      let day: number, month: number, year: number;

      if (parts[0].length === 4) {
        year = Number(parts[0]);
        month = Number(parts[1]);
        day = Number(parts[2]);
      } else {
        day = Number(parts[0]);
        month = Number(parts[1]);
        year = Number(parts[2]);
      }

      if (!isNaN(day) && !isNaN(month) && !isNaN(year) && year > 1000) {
        const d = new Date(year, month - 1, day);
        return d.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
      }
    }
  }

  const d = new Date(dateStr);
  return isNaN(d.getTime())
    ? dateStr
    : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const formatTimeString = (timeStr: string) => {
  if (!timeStr) return '-';

  const parts = timeStr.split(':');
  if (parts.length >= 2) {
    const hours = parts[0].padStart(2, '0');
    const minutes = parts[1].padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  return timeStr;
};