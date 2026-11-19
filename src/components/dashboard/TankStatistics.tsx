'use client';

import { DashboardIcon } from './DashboardIcon';
import { useState } from 'react';
import { LuRefreshCw as RefreshCw } from "react-icons/lu";
import type { Tank } from '@/types';
import { getTankStatus } from '@/lib/dashboard';
import { VOKASI_LOCATIONS } from '@/lib/vokasiLocations';
import { numeric, readingTime } from './TankLevel';
import styles from './TankDashboard.module.css';

export const referenceTanks: Tank[] = VOKASI_LOCATIONS.map(({ name, latitude, longitude }) => ({
  id: `reference-${name}`, name: `Tangki ${name}`, location: `Gedung ${name}, Sekolah Vokasi UGM`,
  latitude: String(latitude), longitude: String(longitude),
  capacityLiters: '', minThresholdPercent: '', maxThresholdPercent: '',
}));
const categories: Record<string, { label: string; color: string; icon: string; range: string }> = {
  NORMAL: { label: 'Normal', color: '#52c93f', icon: 'stat-normal', range: '>60%' },
  WARNING: { label: 'Warning', color: '#fecb28', icon: 'stat-warning', range: '30%-60%' },
  CRITICAL: { label: 'Critical', color: '#ff2727', icon: 'stat-critical', range: '<30%' },
};

function TankFill({ tank, unavailable, loading, onDetail }: { tank: Tank; unavailable: boolean; loading: boolean; onDetail: () => void }) {
  const raw = numeric(tank.latestReading?.levelPercent);
  const level = !unavailable && !loading && raw != null && raw >= 0 && raw <= 100 ? raw : null;
  const statusKey = getTankStatus(tank) ?? (level == null ? null : level > 60 ? 'NORMAL' : level >= 30 ? 'WARNING' : 'CRITICAL');
  const category = statusKey ? categories[statusKey] : null;
  const percentage = level == null ? '-' : `${level.toLocaleString('en-US', { maximumFractionDigits: 2 })}%`;
  const status = category?.label ?? (loading ? 'Loading...' : 'No data');
  const background = category && level != null ? `conic-gradient(${category.color} 0% ${level}%, #ececf2 ${level}% 100%)` : '#ececf2';

  return <article className={styles.statTank}>
    <button className={styles.statTankName} onClick={onDetail} disabled={unavailable || loading}>{tank.name}</button>
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
  const list = unavailable || loading ? referenceTanks : tanks;
  const currentPage = Math.min(page, Math.max(0, Math.ceil(list.length / 2) - 1));

  return <section id="dashboard-tank-list" className={`${styles.panel} ${styles.statistics}`} aria-label="Tank fill percentage" aria-busy={loading}>
    <header className={styles.panelHeader}><h2>Tank Fill Levels</h2><button className={styles.detailLink} onClick={() => setExplain(!explain)} aria-expanded={explain}>View details</button></header>
    <div className={styles.statTabs}><span className={styles.statHint}>Latest water level</span><button aria-label="Refresh water levels" disabled={loading} onClick={onRefresh}><RefreshCw size={16} /></button></div>
    <div className={styles.statGrid}>{list.slice(currentPage * 2, currentPage * 2 + 2).map(tank => <TankFill key={tank.id} tank={tank} unavailable={unavailable} loading={loading} onDetail={() => onDetail(tank)} />)}</div>
    {!list.length && <p className={styles.helper}>No tanks match the selected filters.</p>}
    {list.length > 2 && <div className={styles.statPagination}><button disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Previous</button><span>{currentPage + 1} / {Math.ceil(list.length / 2)}</span><button disabled={(currentPage + 1) * 2 >= list.length} onClick={() => setPage(currentPage + 1)}>Next</button></div>}
    {explain && <p className={styles.helper}>The arc shows the latest tank fill percentage: Normal &gt;60% (green), Warning 30-60% (yellow), and Critical &lt;30% (red). Gray indicates remaining capacity. Click a tank name for details.</p>}
    {unavailable && <p className={styles.helper}>Water level data is unavailable. DTEDI, DTK, and DLIKES are location placeholders.</p>}
  </section>;
}
