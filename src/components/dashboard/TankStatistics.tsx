'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import type { ApiResponse, Tank, WaterLevelReading } from '@/types';
import { numeric } from './TankLevel';
import { dateInputValue } from '@/lib/dashboard';
import { DashboardDatePicker, type DateRange } from './DashboardCalendar';
import { DashboardIcon } from './DashboardIcon';
import overviewStyles from './DashboardOverview.module.css';
import styles from './TankDashboard.module.css';

export const referenceTanks: Tank[] = ['A', 'B'].map(name => ({
  id: `reference-${name}`, name: `Tangki ${name}`, location: 'Lokasi belum dikonfirmasi',
  capacityLiters: '', minThresholdPercent: '', maxThresholdPercent: '',
}));
const categories = [
  { label: 'Normal', color: '#52c93f', icon: 'stat-normal.svg' },
  { label: 'Warning', color: '#006aff', icon: 'stat-warning.svg' },
  { label: 'Critical', color: '#ff2727', icon: 'stat-critical.svg' },
];

function Distribution({ tank, hours, range, unavailable, onDetail }: { tank: Tank; hours: number; range?: DateRange; unavailable: boolean; onDetail: () => void }) {
  const [result, setResult] = useState<{ key: string; values: number[]; count: number } | null>(null);
  const startDate = range?.startDate;
  const endDate = range?.endDate;
  const key = `${tank.id}:${hours}:${startDate}:${endDate}:${unavailable}`;
  useEffect(() => {
    if (unavailable) return;
    const controller = new AbortController();
    const now = Date.now();
    const start = startDate ? new Date(`${startDate}T00:00:00`).getTime() : now - hours * 3600000;
    const end = endDate ? new Date(`${endDate}T00:00:00`) : new Date(now);
    if (endDate) end.setDate(end.getDate() + 1);
    const requestedHours = startDate ? Math.max(1, Math.ceil((now - start) / 3600000)) : hours;
    fetch(`/api/tanks/${encodeURIComponent(tank.id)}/readings?hours=${requestedHours}&limit=1000`, { signal: controller.signal })
      .then(async response => {
        const body: ApiResponse<WaterLevelReading[]> = await response.json();
        if (!response.ok || !body.success || body.source === 'mock' || !Array.isArray(body.data)) throw Error();
        const counts = [0, 0, 0];
        for (const row of body.data) {
          const level = numeric(row.levelPercent);
          const time = Date.parse(row.recordedAt);
          if (row.tankId !== tank.id || level == null || level < 0 || level > 100 || !Number.isFinite(time) || time < start || time > now || (endDate ? time >= end.getTime() : time > end.getTime())) continue;
          counts[level < (numeric(tank.minThresholdPercent) ?? 30) ? 2 : level <= 60 ? 1 : 0]++;
        }
        const count = counts.reduce((a, b) => a + b, 0);
        setResult({ key, values: counts.map(value => count ? value / count * 100 : 0), count });
      }).catch(() => { if (!controller.signal.aborted) setResult({ key, values: [], count: 0 }); });
    return () => controller.abort();
  }, [tank.id, tank.minThresholdPercent, hours, startDate, endDate, unavailable, key]);
  const values = result?.key === key && result.count ? result.values : null;
  const background = values ? `conic-gradient(from -32deg, #52c93f 0% ${values[0]}%, #006aff ${values[0]}% ${values[0] + values[1]}%, #ff2727 ${values[0] + values[1]}% 100%)` : '#ececf2';
  return <article className={styles.statTank}>
    <button className={styles.statTankName} onClick={onDetail}>{tank.name}</button>
    <div className={styles.donut} style={{ background }} role="img" aria-label={`${tank.name}: ${values ? categories.map((category, index) => `${category.label} ${values[index].toFixed(1)}%`).join(', ') : 'statistik belum tersedia'}`}><span>{!values && '—'}</span></div>
    <dl className={styles.statLegend}>{categories.map((category, index) => <div key={category.label}><dt><Image src={`/images/dashboard/${category.icon}`} alt="" width={16} height={16} unoptimized />{category.label}</dt><dd>{values ? `${Math.round(values[index])}%` : '—'}</dd></div>)}</dl>
    <p className={styles.statHint}>{values ? `${result!.count} sampel pembacaan` : unavailable || result?.key === key ? 'Statistik belum tersedia' : 'Memuat statistik…'}</p>
  </article>;
}

export function TankStatistics({ tanks, loading, unavailable, onDetail, onRefresh }: { tanks: Tank[]; loading: boolean; unavailable: boolean; onDetail: (tank: Tank) => void; onRefresh: () => void }) {
  const [period, setPeriod] = useState<24 | 168 | 720 | 'custom'>(24);
  const [range, setRange] = useState<DateRange>(() => ({ startDate: dateInputValue(new Date()), endDate: dateInputValue(new Date()) }));
  const [dateError, setDateError] = useState('');
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  const [explain, setExplain] = useState(false);
  const list = unavailable || loading ? referenceTanks : tanks;
  const currentPage = Math.min(page, Math.max(0, Math.ceil(list.length / 2) - 1));
  return <section id="dashboard-tank-list" className={`${styles.panel} ${styles.statistics}`} aria-label="Statistik persentase tangki" aria-busy={loading}>
    <header className={styles.panelHeader}><h2>Presentase Tangki</h2><button className={styles.detailLink} onClick={() => setExplain(!explain)} aria-expanded={explain}>Lihat detail</button></header>
    <div className={styles.statTabs} aria-label="Periode statistik">{([{ label: 'Day', hours: 24 }, { label: 'Week', hours: 168 }, { label: 'Month', hours: 720 }] as const).map(item => <button key={item.hours} aria-pressed={period === item.hours} onClick={() => setPeriod(item.hours)}>{item.label}</button>)}<button aria-pressed={period === 'custom'} onClick={() => setPeriod('custom')}>Custom</button><button aria-label="Segarkan statistik" disabled={loading} onClick={() => { setRevision(revision + 1); onRefresh(); }}><RefreshCw size={16} /></button></div>
    {period === 'custom' && <div className={styles.statDateRange}>
      <DashboardDatePicker label="Pilih rentang tanggal statistik tangki" triggerClassName={`${overviewStyles.dateButton} ${styles.statDateButton}`} value={range} onChange={next => {
        if (next.endDate > dateInputValue(new Date())) {
          setDateError('Pilih rentang tanggal sampai hari ini.');
          return;
        }
        setDateError('');
        setRange(next);
      }}>
        <DashboardIcon name="calendar" width={16} />
        <span>{[range.startDate, range.endDate].map(date => new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })).join(' - ')}</span>
      </DashboardDatePicker>
      <p role="status">Rentang aktif: {range.startDate} ? {range.endDate} (termasuk tanggal akhir).</p>
      {dateError && <p role="alert">{dateError}</p>}
    </div>}
    <div className={styles.statGrid}>{list.slice(currentPage * 2, currentPage * 2 + 2).map(tank => <Distribution key={`${tank.id}:${revision}`} tank={tank} hours={period === 'custom' ? 24 : period} range={period === 'custom' ? range : undefined} unavailable={unavailable || loading} onDetail={() => onDetail(tank)} />)}</div>
    {!list.length && <p className={styles.helper}>Tidak ada tangki yang sesuai dengan filter.</p>}
    {list.length > 2 && <div className={styles.statPagination}><button disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Sebelumnya</button><span>{currentPage + 1} / {Math.ceil(list.length / 2)}</span><button disabled={(currentPage + 1) * 2 >= list.length} onClick={() => setPage(currentPage + 1)}>Berikutnya</button></div>}
    {explain && <p className={styles.helper}>Persentase dihitung dari maksimal 1.000 sampel pembacaan pada {period === 'custom' ? `${range.startDate} sampai ${range.endDate}` : `${period / 24} hari terakhir`}, bukan persentase volume air. Tren naik/turun belum tersedia. Klik nama tangki untuk melihat level air dan detailnya.</p>}
    {period === 'custom' && <p className={styles.helper}>Statistik memakai sampel dalam rentang pilihan dari maksimal 1.000 pembacaan terakhir yang dikembalikan server. Riwayat lama mungkin belum tersedia.</p>}
    {unavailable && <p className={styles.helper}>Data statistik belum tersedia dari server. Tangki A/B merupakan penanda tampilan sementara.</p>}
  </section>;
}
