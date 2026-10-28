'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { Alert, Tank } from '@/types';
import { type DashboardFilters, type DashboardPeriod, filterDashboardTanks, periodRange } from '@/lib/dashboard';
import { DashboardDatePicker } from './DashboardCalendar';
import { DashboardIcon as Icon } from './DashboardIcon';
import styles from './DashboardPanels.module.css';

function dateLabel(value: string) {
  return value ? new Date(`${value}T12:00:00`).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Pilih tanggal';
}

export function DownloadReportDialog({ tanks, filters, onClose }: { tanks: Tank[]; filters: DashboardFilters; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const request = useRef<AbortController | null>(null);
  const titleId = useId();
  const [period, setPeriod] = useState<DashboardPeriod | 'Dashboard'>('Dashboard');
  const [startDate, setStartDate] = useState(filters.startDate);
  const [endDate, setEndDate] = useState(filters.endDate);
  const [tankId, setTankId] = useState(filters.tankId);
  const [format, setFormat] = useState<'pdf' | 'xlsx'>('pdf');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    dialog.current?.showModal();
    return () => request.current?.abort();
  }, []);

  function close() { request.current?.abort(); dialog.current?.close(); }

  async function download(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError('');
    if (startDate && endDate && startDate > endDate) {
      setError('Tanggal akhir harus sama dengan atau setelah tanggal mulai.');
      return;
    }
    const selectedTanks = filterDashboardTanks(tanks, '', { ...filters, tankId, statuses: [], startDate, endDate });
    if (!selectedTanks.length) {
      setError('Tidak ada pembacaan tangki pada periode ini. Pilih tangki atau periode lain.');
      return;
    }
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    try {
      const response = await fetch('/api/alerts', { signal: controller.signal });
      const result = await response.json();
      if (!response.ok || !result.success || !Array.isArray(result.data)) throw new Error('Riwayat peringatan belum dapat dimuat. Silakan coba lagi.');
      const { createTankReport } = await import('@/lib/dashboardReport');
      const file = await createTankReport({ tanks: selectedTanks, alerts: result.data as Alert[], startDate, endDate, format });
      if (controller.signal.aborted) return;
      const url = URL.createObjectURL(file.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      close();
    } catch (error) {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Laporan gagal diunduh. Silakan coba lagi.');
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  }

  return <dialog ref={dialog} className={styles.downloadDialog} aria-labelledby={titleId} onClose={onClose} onCancel={() => request.current?.abort()} onClick={(event) => {
    if (event.target !== event.currentTarget) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close();
  }}>
    <form onSubmit={download} aria-busy={busy}>
      <header className={styles.downloadHeader}>
        <h2 id={titleId}>Unduh Laporan</h2>
        <button type="button" className={styles.closeButton} aria-label="Tutup unduh laporan" onClick={close}><Icon name="close-download" width={25} /></button>
        <p>Laporan monitoring dengan tabel pemeriksaan dan area tanda tangan</p>
      </header>
      <div className={styles.downloadBody}>
        <label className={`${styles.reportLabel} ${styles.reportPeriod}`}>Periode laporan
          <span className={`${styles.selectField} ${styles.selectWithIcon}`}>
            <Icon name="report-calendar" width={28} />
            <select aria-label="Periode laporan" value={period} disabled={busy} onChange={(event) => {
              const next = event.target.value as typeof period;
              setPeriod(next);
              if (next === 'Custom') return;
              const range = next === 'Dashboard' ? filters : periodRange(next);
              setStartDate(range.startDate); setEndDate(range.endDate);
            }}>
              <option value="Dashboard">Periode dashboard</option>
              <option value="Daily">Hari ini</option>
              <option value="Weekly">7 hari terakhir</option>
              <option value="Monthly">Bulan ini</option>
              <option value="All">Semua tanggal</option>
              <option value="Custom">Pilih periode sendiri</option>
            </select>
            <Icon name="select-chevron" width={20} />
          </span>
        </label>
        <div className={styles.reportDates}>
          <div className={styles.reportDate}><span>Tanggal mulai</span>
            <DashboardDatePicker disabled={busy} mode="single" label="Pilih tanggal mulai laporan" triggerClassName={styles.dateField} value={{ startDate, endDate: startDate }} onChange={(value) => { setStartDate(value.startDate); setPeriod('Custom'); }}>
              <Icon name="report-date" width={23} height={25} /><span>{dateLabel(startDate)}</span><Icon name="select-chevron" width={20} />
            </DashboardDatePicker>
          </div>
          <div className={styles.reportDate}><span>Tanggal akhir</span>
            <DashboardDatePicker disabled={busy} mode="single" label="Pilih tanggal akhir laporan" triggerClassName={styles.dateField} value={{ startDate: endDate, endDate }} onChange={(value) => { setEndDate(value.endDate); setPeriod('Custom'); }}>
              <Icon name="report-date" width={23} height={25} /><span>{dateLabel(endDate)}</span><Icon name="select-chevron" width={20} />
            </DashboardDatePicker>
          </div>
        </div>
        <p className={styles.reportHint}>{period === 'Dashboard' ? 'Mengikuti periode yang dipilih di dashboard' : 'Menggunakan periode laporan yang Anda pilih'}</p>
        <label className={styles.reportLabel}>Tangki
          <span className={`${styles.selectField} ${styles.selectWithIcon}`}>
            <Icon name="report-tank" width={28} height={35} />
            <select aria-label="Pilih tangki untuk laporan" value={tankId} disabled={busy} onChange={(event) => setTankId(event.target.value)}>
              <option value="">Semua tangki</option>
              {tanks.map(tank => <option key={tank.id} value={tank.id}>{tank.name}</option>)}
            </select>
            <Icon name="report-tank-chevron" width={14} height={8} />
          </span>
        </label>
        <fieldset className={styles.reportFormat} disabled={busy}>
          <legend>Format file</legend>
          <div className={styles.formatOptions}>
            {([{ value: 'pdf', label: 'PDF', description: 'Laporan siap cetak', image: 'file-pdf', size: 44 }, { value: 'xlsx', label: 'Excel', description: 'Laporan dan data tabel', image: 'file-excel', size: 40 }] as const).map(option => <label key={option.value} className={styles.formatOption}>
              <input type="radio" name="reportFormat" value={option.value} checked={format === option.value} onChange={() => setFormat(option.value)} aria-label={option.label} />
              <span className={styles.radio}><Icon name="format-radio" width={21} /></span>
              <span className={styles.formatDescription}><Icon name={option.image} width={option.size} /><span><strong>{option.label}</strong><small>{option.description}</small></span></span>
            </label>)}
          </div>
        </fieldset>
        <section className={styles.reportContents} aria-label="Isi laporan">
          <h3>Isi laporan</h3>
          <ul>
            <li><Icon name="report-tick" width={18} /><span>Laporan per tangki, grafik level terakhir, dan area tanda tangan</span></li>
            <li data-unavailable="true"><Icon name="report-tick" width={18} /><span>Data air masuk dan keluar</span><small>Belum tersedia</small></li>
            <li><Icon name="report-tick" width={18} /><span>Riwayat peringatan dan kondisi kritis</span></li>
          </ul>
        </section>
        {error && <p className={styles.reportError} role="alert">{error}</p>}
        {busy && <p className={styles.reportBusy} role="status">Menyiapkan laporan…</p>}
      </div>
      <footer className={styles.downloadFooter}>
        <div className={styles.divider}><Icon name="report-divider" width={584} height={3} /></div>
        <div className={styles.downloadActions}>
          <p>File akan diunduh ke perangkat Anda</p>
          <button type="button" className={styles.cancelButton} onClick={close}>Batal</button>
          <button type="submit" className={styles.primaryButton} disabled={busy}><Icon name="download" width={24} /><span>{busy ? 'Menyiapkan…' : 'Download All'}</span></button>
        </div>
      </footer>
    </form>
  </dialog>;
}
