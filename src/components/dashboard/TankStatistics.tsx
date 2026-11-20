'use client';

import { DashboardIcon } from './DashboardIcon';
import { useState } from 'react';
import { LuRefreshCw as RefreshCw } from "react-icons/lu";
import type { Tank } from '@/types';
import { getTankStatus } from '@/lib/dashboard';
import { VOKASI_LOCATIONS, vokasiTankName } from '@/lib/vokasiLocations';
import { numeric, readingTime } from './TankLevel';
import styles from './TankDashboard.module.css';

const referenceTanks: Tank[] = ['DTK', 'DTEDI', 'DLIKES'].map(name => {
  const loc = VOKASI_LOCATIONS.find(l => l.name === name);
  return {
    id: 'reference-' + name,
    name,
    location: name,
    latitude: loc ? String(loc.latitude) : undefined,
    longitude: loc ? String(loc.longitude) : undefined,
    capacityLiters: '',
    minThresholdPercent: '',
    maxThresholdPercent: '',
  };
});

const locationOrder: Record<string, number> = { DTK: 0, DTEDI: 1, DLIKES: 2 };
const categories: Record<string, { label: string; color: string; icon: string; range: string }> = {
  NORMAL: { label: 'Normal', color: '#52c93f', icon: 'stat-normal', range: '>60%' },
  WARNING: { label: 'Warning', color: '#fecb28', icon: 'stat-warning', range: '30%-60%' },
  CRITICAL: { label: 'Critical', color: '#ff2727', icon: 'stat-critical', range: '<30%' },
};

function TankFill({ tank, unavailable, loading, onDetail }: { tank: Tank; unavailable: boolean; loading: boolean; onDetail: () => void }) {
  const isPlaceholder = tank.id.startsWith('reference-');
  const raw = numeric(tank.latestReading?.levelPercent);
  const level = !unavailable && !loading && raw != null && raw >= 0 && raw <= 100 ? raw : null;
  const statusKey = getTankStatus(tank) ?? (level == null ? null : level > 60 ? 'NORMAL' : level >= 30 ? 'WARNING' : 'CRITICAL');
  const category = statusKey ? categories[statusKey] : null;
  const percentage = level == null ? '-' : `${level.toLocaleString('en-US', { maximumFractionDigits: 2 })}%`;
  const status = category?.label ?? (loading ? 'Loading...' : 'No data');
  const background = category && level != null ? `conic-gradient(${category.color} 0% ${level}%, #ececf2 ${level}% 100%)` : '#ececf2';

  return <article className={styles.statTank}>
    <button className={styles.statTankName} onClick={onDetail} disabled={unavailable || loading || isPlaceholder}>{tank.name}</button>
    <div className={styles.donut} style={{ background }} role="img" aria-label={`${tank.name}: ${level == null ? status : `isi ${percentage}, ${status}`}`}>
      <span><strong>{percentage}</strong><small style={{ color: category?.color }}>{status}</small></span>
    </div>
    <dl className={styles.statLegend}>{Object.values(categories).map(item => <div key={item.label}>
      <dt><DashboardIcon name={item.icon} width={16} />{item.label}</dt><dd>{item.range}</dd>
    </div>)}</dl>
    <p className={styles.statHint}>{level == null ? (loading ? 'Loading water level...' : 'Water level unavailable') : `Last reading: ${readingTime(tank.latestReading?.recordedAt)}`}</p>
  </article>;
}

export function TankStatistics({ tanks, loading, unavailable, onDetail, onRefresh }: { tanks: Tank[]; loading: boolean; unavailable: boolean; onDetail: (tank: Tank) => void; onRefresh: () => void }) {
  const [page, setPage] = useState(0);
  const [explain, setExplain] = useState(false);
  const namedTanks = tanks.map(tank => ({
    ...tank,
    name: vokasiTankName(tank.name),
  })).sort((first, second) =>
    (locationOrder[first.name] ?? 3) - (locationOrder[second.name] ?? 3)
  );
  const showEmptyDlikes = namedTanks.some(tank => tank.name === 'DTK') &&
    namedTanks.some(tank => tank.name === 'DTEDI') &&
    !namedTanks.some(tank => tank.name === 'DLIKES');
  const list = unavailable || loading
    ? referenceTanks
    : showEmptyDlikes ? [...namedTanks, referenceTanks[2]] : namedTanks;
  const pageSize = 2;
  const pageCount = Math.ceil(list.length / pageSize);
  const currentPage = Math.min(page, Math.max(0, pageCount - 1));

  return <section id="dashboard-tank-list" className={`${styles.panel} ${styles.statistics}`} aria-label="Tank fill percentage" aria-busy={loading}>
    <header className={styles.panelHeader}><h2>Tank Fill Levels</h2><button className={styles.detailLink} onClick={() => setExplain(!explain)} aria-expanded={explain}>View details</button></header>
    <div className={styles.statTabs}><span className={styles.statHint}>Latest water level</span><button aria-label="Refresh water levels" disabled={loading} onClick={onRefresh}><RefreshCw size={16} /></button></div>
    <div className={styles.statGrid}>{list.slice(currentPage * pageSize, currentPage * pageSize + pageSize).map(tank => <TankFill key={tank.id} tank={tank} unavailable={unavailable} loading={loading} onDetail={() => onDetail(tank)} />)}</div>
    {!list.length && <p className={styles.helper}>No tanks match the selected filters.</p>}
    {pageCount > 1 && <nav className={styles.statPagination} aria-label="Halaman tingkat tangki"><button type="button" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Sebelumnya</button><span aria-live="polite" aria-label={`Halaman ${currentPage + 1} dari ${pageCount}`}>{currentPage + 1}/{pageCount}</span><button type="button" disabled={currentPage + 1 >= pageCount} onClick={() => setPage(currentPage + 1)}>Berikutnya</button></nav>}
    {explain && <p className={styles.helper}>The arc shows the latest tank fill percentage: Normal &gt;60% (green), Warning 30-60% (yellow), and Critical &lt;30% (red). Gray indicates remaining capacity. Click a tank name for details.</p>}
    {unavailable && <p className={styles.helper}>Water level data is unavailable. DTK, DTEDI, and DLIKES are shown as placeholders.</p>}
  </section>;
}
