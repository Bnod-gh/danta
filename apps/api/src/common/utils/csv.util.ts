export function arrayToCsv<T>(data: T[], headers: string[]): string {
  const escape = (value: string): string => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };
  const headerRow = headers.map(escape).join(',');
  const rows = data.map((row) =>
    headers.map((header) => {
      const value = row[header as keyof T];
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return escape(JSON.stringify(value));
      return escape(String(value));
    }).join(','),
  );
  return [headerRow, ...rows].join('\n');
}

export function getCsvFilename(reportType: string): string {
  const date = new Date().toISOString().split('T')[0];
  return `${reportType}-${date}.csv`;
}
