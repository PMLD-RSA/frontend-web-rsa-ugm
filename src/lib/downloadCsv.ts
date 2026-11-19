type CsvValue = string | number | boolean | null | undefined;

/** Quote cells and prevent spreadsheet formulas in user-provided text. */
export function serializeCsv(rows: readonly (readonly CsvValue[])[]): string {
  return rows.map(row => row.map(value => {
    const text = String(value ?? '');
    const safe = typeof value === 'string' && /^[=+@\-\t\r]/.test(text) ? "'" + text : text;
    return `"${safe.replaceAll('"', '""')}"`;
  }).join(',')).join('\r\n');
}

/** Browser-only: call from a download button's event handler. */
export function downloadCsv(filename: string, rows: readonly (readonly CsvValue[])[]) {
  const url = URL.createObjectURL(new Blob(['\ufeff', serializeCsv(rows)], {
    type: 'text/csv;charset=utf-8',
  }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  // Let the browser start the download before releasing the blob.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
