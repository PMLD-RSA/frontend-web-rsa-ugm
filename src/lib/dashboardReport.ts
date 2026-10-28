import type { Alert, Tank } from '@/types';
import { dateInputValue } from './dashboard';

export interface TankReportOptions {
  tanks: Tank[];
  alerts: Alert[];
  startDate: string;
  endDate: string;
  format: 'pdf' | 'xlsx';
}

const numeric = (value: unknown) => value == null || String(value).trim() === '' || !Number.isFinite(Number(value)) ? null : Number(value);
const amount = (value: unknown, unit = '') => numeric(value)?.toLocaleString('id-ID', { maximumFractionDigits: 2 }) + unit;
const measurement = (value: unknown, unit = '') => numeric(value) == null ? 'Belum ada data' : amount(value, unit);
const time = (value?: string) => value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) + ' WIB' : 'Belum ada data';
const date = (value: string) => value ? new Date(`${value}T12:00:00`).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '';
const levelOf = (tank: Tank) => {
  const level = numeric(tank.latestReading?.levelPercent);
  return level != null && level >= 0 && level <= 100 ? level : null;
};
const statusOf = (tank: Tank) => {
  const level = levelOf(tank);
  return level == null ? 'Belum ada data' : level > 70 ? 'Normal' : level >= 30 ? 'Warning' : 'Critical';
};
const colorOf = (tank: Tank) => ({ Normal: '52C93F', Warning: 'FECB28', Critical: 'FF2727', 'Belum ada data': 'ECECF2' }[statusOf(tank)] ?? 'ECECF2');

async function asset(path: string) {
  const response = await fetch(path);
  if (!response.ok) throw new Error('Aset laporan gagal dimuat. Silakan coba lagi.');
  return new Uint8Array(await response.arrayBuffer());
}

export async function createTankReport(options: TankReportOptions): Promise<{ blob: Blob; filename: string }> {
  const { tanks, startDate, endDate, format } = options;
  if (!tanks.length) throw new Error('Tidak ada tangki untuk dilaporkan.');
  const created = new Date();
  const printed = time(created.toISOString());
  const period = !startDate && !endDate ? 'Semua tanggal' : `${date(startDate) || 'Awal'} – ${date(endDate) || 'Sekarang'}`;
  const ids = new Set(tanks.map(tank => tank.id));
  const alerts = options.alerts.filter(alert => {
    if (!ids.has(alert.tankId)) return false;
    if (!startDate && !endDate) return true;
    const recorded = new Date(alert.createdAt);
    if (!Number.isFinite(recorded.getTime())) return false;
    const day = dateInputValue(recorded);
    return (!startDate || day >= startDate) && (!endDate || day <= endDate);
  });
  const filename = `laporan-monitoring-tangki-${dateInputValue(created)}.${format}`;
  const logo = await asset('/images/login-rsa-logo.png');
  const tankAlerts = (tank: Tank) => alerts.filter(alert => alert.tankId === tank.id);
  const identity = (tank: Tank) => `${tank.name}\n\nLokasi\n${tank.location || 'Belum ada data'}\n\nKapasitas\n${measurement(tank.capacityLiters, ' L')}`;
  const details = (tank: Tank) => `DATA MONITORING\nLevel: ${measurement(levelOf(tank), '%')}\nVolume: ${measurement(tank.latestReading?.volumeLiters, ' L')}\nStatus level: ${statusOf(tank)}\n\nPEMBACAAN TERAKHIR\n${time(tank.latestReading?.recordedAt)}\n\nSENSOR\n${tank.nodes?.map(node => node.deviceCode).join(', ') || 'Belum ada data'}\n\nAIR MASUK / KELUAR\nBelum tersedia pada sumber data.`;
  const analysis = (tank: Tank) => {
    const rows = tankAlerts(tank);
    return `HASIL MONITORING\n${levelOf(tank) == null ? 'Level air belum tersedia atau tidak valid.' : `Level air ${measurement(levelOf(tank), '%')} berada pada kategori ${statusOf(tank)}.`}\n\nBATAS STATUS LEVEL\nNormal: >70%\nWarning: 30–70%\nCritical: <30%\n\nPERINGATAN\n${rows.length} peringatan pada data periode terpilih.\n${rows.filter(row => row.status === 'active').length} masih aktif saat ekspor.\n\nCATATAN\nAnalisa otomatis berdasarkan pembacaan terakhir. Verifikasi lapangan oleh petugas diperlukan.`;
  };

  if (format === 'xlsx') {
    const { default: ExcelJS } = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'RSA UGM';
    workbook.created = created;
    workbook.title = 'Laporan Monitoring Tangki';
    const logoId = workbook.addImage({ base64: `data:image/png;base64,${btoa(Array.from(logo, byte => String.fromCharCode(byte)).join(''))}`, extension: 'png' });
    tanks.forEach((tank, index) => {
      const sheet = workbook.addWorksheet(`Laporan ${index + 1}`, { pageSetup: {
        paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 1,
        margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.1, footer: 0.1 },
      } });
      sheet.columns = Array.from({ length: 22 }, () => ({ width: 4 }));
      for (let r = 1; r <= 39; r++) {
        sheet.getRow(r).height = 20;
        for (let c = 1; c <= 22; c++) {
          const cell = sheet.getCell(r, c);
          cell.font = { name: 'Arial', size: 10 };
          cell.alignment = { vertical: 'top', wrapText: true };
        }
      }
      function merge(range: string, value: string | number, bold = false, center = false) {
        sheet.mergeCells(range);
        const cell = sheet.getCell(range.split(':')[0]);
        cell.value = value;
        cell.font = { name: 'Arial', size: 10, bold };
        cell.alignment = { vertical: 'top', horizontal: center ? 'center' : 'left', wrapText: true };
      }
      sheet.addImage(logoId, { tl: { col: 0, row: 0.2 }, ext: { width: 100, height: 48 } });
      merge('E1:R2', 'LAPORAN MONITORING TANGKI', true, true);
      sheet.getCell('E1').font = { name: 'Arial', size: 14, bold: true };
      merge('E3:R3', 'Rumah Sakit Akademik Universitas Gadjah Mada', true, true);
      merge('S1:V3', `Dicetak:\n${printed}`);
      merge('A5:V5', `Periode: ${period}`);
      const columns = [['A7:A7', 'NO'], ['B7:D7', 'TANGKI'], ['E7:I7', 'KETERANGAN'], ['J7:Q7', 'URAIAN'], ['R7:V7', 'ANALISA']];
      columns.forEach(([range, label]) => merge(range, label, true, true));
      merge('A8:A29', index + 1, false, true);
      merge('B8:D29', identity(tank), true);
      merge('E8:I29', details(tank));
      merge('R8:V29', analysis(tank));
      merge('J8:Q9', 'PERSENTASE ISI TANGKI', true);
      merge('J10:Q11', measurement(levelOf(tank), '%'), true, true);
      sheet.getCell('J10').font = { name: 'Arial', size: 24, bold: true };
      merge('J12:Q12', levelOf(tank) ?? '');
      sheet.getCell('J12').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFECECF2' } };
      if (levelOf(tank) != null) {
        const rule: import('exceljs').DataBarRuleType & { color: { argb: string } } = {
          type: 'dataBar', priority: 1, cfvo: [{ type: 'num', value: 0 }, { type: 'num', value: 100 }],
          color: { argb: `FF${colorOf(tank)}` }, gradient: false, showValue: false,
          minLength: 0, maxLength: 100, axisPosition: 'none',
        };
        sheet.addConditionalFormatting({ ref: 'J12', rules: [rule] });
      }
      merge('J14:Q15', `Status level: ${statusOf(tank)}`, true, true);
      merge('J17:Q19', 'Grafik menunjukkan pembacaan terakhir, bukan riwayat perubahan level air.');
      merge('J21:Q23', `Volume air: ${measurement(tank.latestReading?.volumeLiters, ' L')}\nKapasitas: ${measurement(tank.capacityLiters, ' L')}`);
      merge('J25:Q29', 'Detail peringatan tersedia pada lembar Riwayat Peringatan. Data numerik tersedia pada lembar Data Tangki.');
      for (let r = 7; r <= 29; r++) for (let c = 1; c <= 22; c++) {
        const cell = sheet.getCell(r, c);
        // Only the outside of the Uraian column is bordered, preserving chart cells.
        if (r === 7 || c < 10 || c > 17) cell.border = Object.fromEntries(['top', 'left', 'bottom', 'right'].map(side => [side, { style: 'thin', color: { argb: 'FFB8B8B8' } }]));
        else cell.border = { ...(c === 10 ? { left: { style: 'thin', color: { argb: 'FFB8B8B8' } } } : {}), ...(c === 17 ? { right: { style: 'thin', color: { argb: 'FFB8B8B8' } } } : {}), ...(r === 29 ? { bottom: { style: 'thin', color: { argb: 'FFB8B8B8' } } } : {}) };
      }
      sheet.getRow(7).height = 24;
      sheet.getRow(7).eachCell(cell => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } }; });
      merge('A31:I31', 'Yang Membuat,');
      merge('N31:V32', `Yogyakarta, ${date(dateInputValue(created))}\nMengetahui,`, false, true);
      merge('A36:I37', '(____________________________)\nPetugas Monitoring Tangki');
      merge('N36:V37', '(____________________________)\nPenanggung Jawab', false, true);
      sheet.pageSetup.printArea = 'A1:V39';
      sheet.headerFooter.oddFooter = 'RSA UGM | Halaman &P dari &N';
    });
    function table(name: string, headings: string[], widths: number[]) {
      const sheet = workbook.addWorksheet(name, { views: [{ state: 'frozen', ySplit: 1 }], pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: '1:1' } });
      sheet.columns = headings.map((header, index) => ({ header, width: widths[index] }));
      sheet.getRow(1).font = { name: 'Arial', bold: true, size: 11 };
      sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFECECF2' } };
      sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: headings.length } };
      return sheet;
    }
    const data = table('Data Tangki', ['No', 'Tangki', 'Lokasi', 'Status Level', 'Level (%)', 'Volume (L)', 'Kapasitas (L)', 'Pembacaan Terakhir'], [8, 36, 36, 20, 16, 20, 20, 32]);
    tanks.forEach((tank, index) => data.addRow([index + 1, tank.name, tank.location ?? '', statusOf(tank), levelOf(tank), numeric(tank.latestReading?.volumeLiters), numeric(tank.capacityLiters), time(tank.latestReading?.recordedAt)]));
    [5, 6, 7].forEach(column => { data.getColumn(column).numFmt = '#,##0.00'; });
    const history = table('Riwayat Peringatan', ['Tangki', 'Level', 'Status', 'Pesan', 'Waktu', 'Diselesaikan'], [36, 18, 18, 70, 32, 32]);
    alerts.forEach(alert => history.addRow([tanks.find(tank => tank.id === alert.tankId)?.name ?? alert.tankName ?? alert.tankId, alert.level, alert.status, alert.message, time(alert.createdAt), alert.resolvedAt ? time(alert.resolvedAt) : 'Belum diselesaikan']));
    if (!alerts.length) history.addRow(['Tidak ada peringatan pada data periode terpilih.']);
    [data, history].forEach(sheet => sheet.eachRow(row => { row.height = 42; row.alignment = { vertical: 'top', wrapText: true }; }));
    const bytes = await workbook.xlsx.writeBuffer();
    return { blob: new Blob([new Uint8Array(bytes)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), filename };
  }

  const [{ PDFDocument, rgb }, { default: fontkit }] = await Promise.all([import('pdf-lib'), import('@pdf-lib/fontkit')]);
  const fonts = await Promise.all(['Regular', 'SemiBold'].map(weight => asset(`/fonts/dashboard/PlusJakartaSans-${weight}.ttf`)));
  const document = await PDFDocument.create();
  document.registerFontkit(fontkit);
  document.setTitle('Laporan Monitoring Tangki RSA UGM');
  document.setAuthor('RSA UGM');
  const regular = await document.embedFont(fonts[0], { subset: true });
  const bold = await document.embedFont(fonts[1], { subset: true });
  const mark = await document.embedPng(logo);
  const ink = rgb(0.12, 0.12, 0.12);
  const line = rgb(0.7, 0.7, 0.7);
  const gray = rgb(0.93, 0.93, 0.95);
  const width = 523;
  const left = 36;
  function wrap(value: string, size: number, maxWidth: number, heavy = false) {
    const font = heavy ? bold : regular;
    return value.split('\n').flatMap(paragraph => {
      if (!paragraph) return [''];
      const lines: string[] = [];
      let current = '';
      for (const word of paragraph.split(/\s+/)) {
        const next = current ? `${current} ${word}` : word;
        if (font.widthOfTextAtSize(next, size) <= maxWidth) { current = next; continue; }
        if (current) lines.push(current);
        current = '';
        for (const character of word) {
          if (font.widthOfTextAtSize(current + character, size) > maxWidth) { lines.push(current); current = ''; }
          current += character;
        }
      }
      if (current) lines.push(current);
      return lines;
    });
  }
  function newPage() {
    const page = document.addPage([595.28, 841.89]);
    const logoSize = mark.scaleToFit(85, 43);
    page.drawImage(mark, { x: left, y: 754, ...logoSize });
    const title = 'LAPORAN MONITORING TANGKI';
    page.drawText(title, { x: 297.64 - bold.widthOfTextAtSize(title, 12) / 2, y: 783, font: bold, size: 12, color: ink });
    const subtitle = 'Rumah Sakit Akademik Universitas Gadjah Mada';
    page.drawText(subtitle, { x: 297.64 - regular.widthOfTextAtSize(subtitle, 8) / 2, y: 768, font: regular, size: 8, color: ink });
    wrap(`Dicetak:\n${printed}`, 6, 85).forEach((value, i) => page.drawText(value, { x: 475, y: 789 - i * 9, font: regular, size: 6, color: ink }));
    page.drawLine({ start: { x: left, y: 743 }, end: { x: left + width, y: 743 }, color: ink, thickness: 1 });
    page.drawText(`Periode: ${period}`, { x: left, y: 726, font: regular, size: 8, color: ink });
    return page;
  }
  function write(page: ReturnType<typeof newPage>, value: string, x: number, y: number, maxWidth: number, size = 8, heavy = false) {
    const lines = wrap(value, size, maxWidth, heavy);
    lines.forEach((value, index) => page.drawText(value, { x, y: y - index * (size + 3), font: heavy ? bold : regular, size, color: ink }));
    return lines.length * (size + 3);
  }
  tanks.forEach((tank, index) => {
    const textColumns = [String(index + 1), identity(tank), details(tank), '', analysis(tank)];
    const widths = [23, 87, 120, 173, 120];
    const chunks = textColumns.map((value, column) => wrap(value, 7.5, widths[column] - 12));
    const rowsPerPage = 39;
    const pageCount = Math.max(1, ...chunks.map(lines => Math.ceil(lines.length / rowsPerPage)));
    for (let part = 0; part < pageCount; part++) {
      const page = newPage();
      let x = left;
      const top = 710;
      const bottom = 258;
      const headings = ['NO', 'TANGKI', 'KETERANGAN', 'URAIAN', 'ANALISA'];
      widths.forEach((columnWidth, column) => {
        page.drawRectangle({ x, y: top - 22, width: columnWidth, height: 22, color: gray, borderColor: line, borderWidth: 0.5 });
        page.drawText(headings[column], { x: x + (columnWidth - bold.widthOfTextAtSize(headings[column], 7)) / 2, y: top - 14, font: bold, size: 7, color: ink });
        page.drawRectangle({ x, y: bottom, width: columnWidth, height: top - 22 - bottom, borderColor: line, borderWidth: 0.5 });
        chunks[column].slice(part * rowsPerPage, (part + 1) * rowsPerPage).forEach((value, row) => page.drawText(value, { x: x + 6, y: top - 36 - row * 10.5, font: regular, size: 7.5, color: ink }));
        x += columnWidth;
      });
      const chartX = left + widths[0] + widths[1] + widths[2] + 10;
      const chartWidth = widths[3] - 20;
      write(page, 'PERSENTASE ISI TANGKI', chartX, 672, chartWidth, 8, true);
      write(page, measurement(levelOf(tank), '%'), chartX, 637, chartWidth, 20, true);
      page.drawRectangle({ x: chartX, y: 608, width: chartWidth, height: 16, color: gray });
      const level = levelOf(tank);
      if (level != null && level > 0) {
        const hex = colorOf(tank);
        page.drawRectangle({ x: chartX, y: 608, width: chartWidth * level / 100, height: 16, color: rgb(parseInt(hex.slice(0, 2), 16) / 255, parseInt(hex.slice(2, 4), 16) / 255, parseInt(hex.slice(4, 6), 16) / 255) });
      }
      write(page, `Status level: ${statusOf(tank)}`, chartX, 588, chartWidth, 9, true);
      write(page, 'Grafik menunjukkan pembacaan terakhir, bukan riwayat perubahan level air.', chartX, 552, chartWidth);
      write(page, `Volume air\n${measurement(tank.latestReading?.volumeLiters, ' L')}\n\nKapasitas\n${measurement(tank.capacityLiters, ' L')}`, chartX, 489, chartWidth);
      write(page, 'Detail peringatan tersedia pada lampiran laporan.', chartX, 380, chartWidth);
      if (part) write(page, `Lanjutan tangki ${index + 1} (${part + 1}/${pageCount})`, left, 244, width, 7);
      write(page, 'Yang Membuat,', left, 220, 200);
      write(page, `Yogyakarta, ${date(dateInputValue(created))}\nMengetahui,`, 370, 220, 189);
      page.drawLine({ start: { x: left, y: 143 }, end: { x: 220, y: 143 }, color: ink, thickness: 0.5 });
      page.drawLine({ start: { x: 370, y: 143 }, end: { x: 559, y: 143 }, color: ink, thickness: 0.5 });
      write(page, 'Petugas Monitoring Tangki', left, 130, 200, 8);
      write(page, 'Penanggung Jawab', 370, 130, 189, 8);
    }
  });
  let appendix = newPage();
  let y = 702;
  function appendixLine(value: string, heavy = false) {
    for (const row of wrap(value, 9, width, heavy)) {
      if (y < 55) { appendix = newPage(); y = 702; }
      appendix.drawText(row, { x: left, y, size: 9, font: heavy ? bold : regular, color: ink });
      y -= 14;
    }
  }
  appendixLine('LAMPIRAN — RIWAYAT PERINGATAN', true);
  y -= 10;
  if (!alerts.length) appendixLine('Tidak ada peringatan pada data periode terpilih.');
  alerts.forEach((alert, index) => {
    if (y < 130) { appendix = newPage(); y = 702; }
    appendixLine(`${index + 1}. ${tanks.find(tank => tank.id === alert.tankId)?.name ?? alert.tankName ?? alert.tankId}`, true);
    appendixLine(`${alert.level} | ${alert.status} | ${time(alert.createdAt)}`);
    appendixLine(alert.message);
    appendixLine(`Diselesaikan: ${alert.resolvedAt ? time(alert.resolvedAt) : 'Belum diselesaikan'}`);
    y -= 12;
  });
  const pages = document.getPages();
  pages.forEach((page, index) => page.drawText(`RSA UGM | ${index + 1} / ${pages.length}`, { x: left, y: 28, font: regular, size: 7, color: ink }));
  const bytes = await document.save();
  return { blob: new Blob([new Uint8Array(bytes)], { type: 'application/pdf' }), filename };
}
