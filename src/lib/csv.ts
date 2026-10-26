/**
 * Escape single CSV field value according to RFC 4180
 * Wrap in quotes if it contains commas, double quotes, or newlines
 */
export function escapeCsvField(val: unknown): string {
  if (val === null || val === undefined) {
    return '';
  }
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generate CSV string from headers and rows
 */
export function generateCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const headerLine = headers.map(escapeCsvField).join(',');
  const rowLines = rows.map((row) => row.map(escapeCsvField).join(','));
  return [headerLine, ...rowLines].join('\r\n');
}

/**
 * Trigger browser download of CSV file
 */
export function downloadCsv(filename: string, csvContent: string): void {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
