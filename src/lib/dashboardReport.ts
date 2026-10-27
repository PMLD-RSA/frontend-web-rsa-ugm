import type { Alert, Tank } from '@/types';
import { dateInputValue, getTankStatus } from './dashboard';

export interface TankReportOptions {
  tanks: Tank[];
  alerts: Alert[];
  startDate: string;
  endDate: string;
  format: 'pdf' | 'xlsx';
}

const number = (value: unknown) => value == null || value === '' || !Number.isFinite(Number(value)) ? null : Number(value);
const displayNumber = (value: unknown) => number(value)?.toLocaleString('id-ID', { maximumFractionDigits: 2 }) ?? 'Belum ada data';
const displayTime = (value?: string) => value && !Number.isNaN(Date.parse(value)) ? new Date(value).toLocaleString('id-ID') : 'Belum ada data';
const statusLabel = (tank: Tank) => {
  const status = getTankStatus(tank);
  return status ? { NORMAL: 'Normal', WARNING: 'Peringatan', CRITICAL: 'Kritis' }[status] : 'Belum ada data';
};

export async function createTankReport(options: TankReportOptions): Promise<{ blob: Blob; filename: string }> {
  const { tanks, startDate, endDate, format } = options;
  const ids = new Set(tanks.map(tank => tank.id));
  const alerts = options.alerts.filter(alert => {
    if (!ids.has(alert.tankId)) return false;
    if (!startDate && !endDate) return true;
    const time = new Date(alert.createdAt);
    if (Number.isNaN(time.getTime())) return false;
    const date = dateInputValue(time);
    return (!startDate || date >= startDate) && (!endDate || date <= endDate);
  });
  const period = !startDate && !endDate ? 'Semua tanggal' : `${startDate || 'Awal'} - ${endDate || 'Sekarang'}`;
  const counts = { NORMAL: 0, WARNING: 0, CRITICAL: 0, UNKNOWN: 0 };
  tanks.forEach(tank => counts[getTankStatus(tank) ?? 'UNKNOWN']++);
  const name = `laporan-tangki-${dateInputValue(new Date())}.${format}`;

  if (format === 'xlsx') {
    const { default: ExcelJS } = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'RSA UGM';
    workbook.created = new Date();
    const summary = workbook.addWorksheet('Ringkasan');
    summary.columns = [{ width: 44 }, { width: 48 }];
    summary.addRows([
      ['Laporan Monitoring Tangki RSA UGM'], ['Periode', period],
      ['Sumber ringkasan', 'Pembacaan terakhir tangki pada periode terpilih'],
      ['Dibuat pada', new Date().toLocaleString('id-ID')], [],
      ['Total tangki', tanks.length], ['Normal', counts.NORMAL], ['Peringatan', counts.WARNING],
      ['Kritis', counts.CRITICAL], ['Belum ada status', counts.UNKNOWN], [],
      ['Data air masuk dan keluar', 'Belum tersedia pada sumber data'],
      ['Grafik level air', 'Lihat sheet Grafik Level Air; bukan riwayat time-series.'],
    ]);
    const data = workbook.addWorksheet('Data Tangki', { views: [{ state: 'frozen', ySplit: 1 }] });
    data.columns = [
      { header: 'Nama Tangki', width: 36 }, { header: 'Lokasi', width: 36 }, { header: 'Status', width: 20 },
      { header: 'Level (%)', width: 16 }, { header: 'Volume (L)', width: 20 }, { header: 'Kapasitas (L)', width: 20 }, { header: 'Pembacaan Terakhir', width: 30 },
    ];
    tanks.forEach(tank => data.addRow([tank.name, tank.location ?? '', getTankStatus(tank) ? statusLabel(tank) : 'Belum ada data', number(tank.latestReading?.levelPercent), number(tank.latestReading?.volumeLiters), number(tank.capacityLiters), displayTime(tank.latestReading?.recordedAt)]));
    data.autoFilter = { from: 'A1', to: 'G1' };
    const history = workbook.addWorksheet('Riwayat Peringatan', { views: [{ state: 'frozen', ySplit: 1 }] });
    history.columns = [{ header: 'Tangki', width: 36 }, { header: 'Level', width: 18 }, { header: 'Status', width: 16 }, { header: 'Pesan', width: 60 }, { header: 'Waktu', width: 30 }, { header: 'Diselesaikan', width: 30 }];
    alerts.forEach(alert => history.addRow([tanks.find(tank => tank.id === alert.tankId)?.name ?? alert.tankName ?? alert.tankId, alert.level, alert.status, alert.message, displayTime(alert.createdAt), alert.resolvedAt ? displayTime(alert.resolvedAt) : 'Belum diselesaikan']));
    if (!alerts.length) history.addRow(['Tidak ada peringatan pada periode terpilih.']);

    const chart = workbook.addWorksheet('Grafik Level Air');
    chart.columns = [{ width: 36 }, { width: 14 }, ...Array.from({ length: 20 }, () => ({ width: 3 }))];
    chart.addRow(['Level air terakhir', 'Level (%)', ...Array.from({ length: 20 }, (_, i) => (i + 1) * 5)]);
    tanks.forEach(tank => {
      const level = number(tank.latestReading?.levelPercent);
      const row = chart.addRow([tank.name, level]);
      if (level === null) return;
      const filled = Math.round(Math.min(100, Math.max(0, level)) / 5);
      const color = getTankStatus(tank) === 'CRITICAL' ? 'FFF21E1E' : getTankStatus(tank) === 'WARNING' ? 'FFFECB28' : 'FF42A132';
      for (let i = 0; i < 20; i++) row.getCell(i + 3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: i < filled ? color : 'FFF1F3F7' } };
    });
    for (const sheet of workbook.worksheets) {
      sheet.eachRow(row => { row.font = { name: 'Plus Jakarta Sans', size: 11 }; row.alignment = { vertical: 'middle', wrapText: true }; row.height = 32; });
      sheet.getRow(1).font = { name: 'Plus Jakarta Sans', bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF071551' } };
    }
    const bytes = await workbook.xlsx.writeBuffer();
    return { blob: new Blob([new Uint8Array(bytes)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), filename: name };
  }

  const [{ PDFDocument, rgb }, { default: fontkit }] = await Promise.all([import('pdf-lib'), import('@pdf-lib/fontkit')]);
  const fontFiles = await Promise.all(['Regular', 'SemiBold'].map(async weight => {
    const response = await fetch(`/fonts/dashboard/PlusJakartaSans-${weight}.ttf`);
    if (!response.ok) throw new Error('Font laporan gagal dimuat. Silakan coba lagi.');
    return response.arrayBuffer();
  }));
  const document = await PDFDocument.create();
  document.registerFontkit(fontkit);
  document.setTitle('Laporan Monitoring Tangki RSA UGM');
  document.setAuthor('RSA UGM');
  const regular = await document.embedFont(fontFiles[0], { subset: true });
  const bold = await document.embedFont(fontFiles[1], { subset: true });
  let page = document.addPage([595.28, 841.89]);
  let y = 795;
  const ink = rgb(7 / 255, 21 / 255, 81 / 255);
  function space(height: number) { if (y - height < 50) { page = document.addPage([595.28, 841.89]); y = 795; } }
  function text(value: string, size = 10, heavy = false) {
    const font = heavy ? bold : regular;
    // Wrap even long names/identifiers so no content runs off the page.
    const lines: string[] = [];
    let line = '';
    for (const word of value.replace(/\s+/g, ' ').split(' ')) {
      if (font.widthOfTextAtSize(`${line} ${word}`.trim(), size) <= 510) { line = `${line} ${word}`.trim(); continue; }
      if (line) lines.push(line);
      line = '';
      for (const character of word) {
        if (font.widthOfTextAtSize(line + character, size) > 510) { lines.push(line); line = ''; }
        line += character;
      }
    }
    if (line) lines.push(line);
    for (const line of lines) { space(size + 8); page.drawText(line, { x: 42, y, size, font, color: ink }); y -= size + 8; }
  }
  text('Laporan Monitoring Tangki', 22, true);
  text('Rumah Sakit Akademik UGM', 12);
  text(`Periode: ${period}`);
  text(`Dibuat: ${new Date().toLocaleString('id-ID')}`);
  text('Ringkasan menggunakan pembacaan terakhir tangki pada periode terpilih.');
  y -= 12;
  text('Ringkasan kondisi', 15, true);
  text(`Total: ${tanks.length} tangki | Normal: ${counts.NORMAL} | Peringatan: ${counts.WARNING} | Kritis: ${counts.CRITICAL}`);
  if (counts.UNKNOWN) text(`Belum memiliki status: ${counts.UNKNOWN} tangki`);
  y -= 12;
  text('Grafik level air terakhir per tangki', 15, true);
  for (const tank of tanks) {
    space(55);
    text(tank.name, 10, true);
    const level = number(tank.latestReading?.levelPercent);
    if (level === null) { text('Belum ada data'); continue; }
    space(34);
    page.drawRectangle({ x: 42, y: y - 12, width: 400, height: 12, color: rgb(0.94, 0.95, 0.97) });
    const color = getTankStatus(tank) === 'CRITICAL' ? rgb(0.95, 0.12, 0.12) : getTankStatus(tank) === 'WARNING' ? rgb(1, 0.8, 0.16) : rgb(0.26, 0.63, 0.2);
    page.drawRectangle({ x: 42, y: y - 12, width: Math.min(100, Math.max(0, level)) * 4, height: 12, color });
    page.drawText(`${displayNumber(level)}%`, { x: 455, y: y - 10, size: 10, font: regular, color: ink });
    y -= 34;
  }
  text('Detail tangki', 15, true);
  for (const tank of tanks) {
    space(120);
    text(tank.name, 11, true);
    text(`Lokasi: ${tank.location || '-'}`);
    text(`Status: ${getTankStatus(tank) ? statusLabel(tank) : 'Belum ada data'} | Level: ${displayNumber(tank.latestReading?.levelPercent)}%`);
    text(`Volume: ${displayNumber(tank.latestReading?.volumeLiters)} L | Kapasitas: ${displayNumber(tank.capacityLiters)} L`);
    text(`Pembacaan terakhir: ${displayTime(tank.latestReading?.recordedAt)}`);
    y -= 8;
  }
  text('Data air masuk dan keluar', 15, true);
  text('Belum tersedia pada sumber data. Nilai masuk/keluar tidak dihitung dari perubahan level.');
  y -= 12;
  text('Riwayat peringatan dan kondisi kritis', 15, true);
  if (!alerts.length) text('Tidak ada peringatan pada periode terpilih.');
  for (const alert of alerts) {
    space(80);
    text(`${tanks.find(tank => tank.id === alert.tankId)?.name ?? alert.tankName ?? alert.tankId} - ${alert.level}`, 10, true);
    text(`${displayTime(alert.createdAt)} | ${alert.status}`);
    text(alert.message);
    y -= 8;
  }
  const pages = document.getPages();
  pages.forEach((page, index) => page.drawText(`RSA UGM | ${index + 1} / ${pages.length}`, { x: 42, y: 25, size: 8, font: regular, color: ink }));
  const bytes = await document.save();
  return { blob: new Blob([new Uint8Array(bytes)], { type: 'application/pdf' }), filename: name };
}
