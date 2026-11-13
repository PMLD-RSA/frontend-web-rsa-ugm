'use client';

import Image from 'next/image';
import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import type { Tank } from '@/types';
import { numeric, readingTime } from './TankLevel';
import styles from './TankDashboard.module.css';

export const referenceTanks: Tank[] = ['A', 'B'].map(name => ({
  id: `reference-${name}`, name: `Tank ${name}`, location: 'Location unconfirmed',
  capacityLiters: '', minThresholdPercent: '', maxThresholdPercent: '',
}));
const categories = [
  { label: 'Normal', color: '#52c93f', icon: 'stat-normal.svg', range: '>70%' },
  { label: 'Warning', color: '#fecb28', icon: 'stat-warning.svg', range: '30–70%' },
  { label: 'Critical', color: '#ff2727', icon: 'stat-critical.svg', range: '<30%' },
];

function TankFill({ tank, unavailable, loading, onDetail }: { tank: Tank; unavailable: boolean; loading: boolean; onDetail: () => void }) {
  const raw = numeric(tank.latestReading?.levelPercent);
  const level = !unavailable && !loading && raw != null && raw >= 0 && raw <= 100 ? raw : null;
  const category = level == null ? null : categories[level > 70 ? 0 : level >= 30 ? 1 : 2];
  const percentage = level == null ? '—' : `${level.toLocaleString('en-US', { maximumFractionDigits: 2 })}%`;
  const status = category?.label ?? (loading ? 'Loading…' : 'No data');
  const background = category ? `conic-gradient(${category.color} 0% ${level}%, #ececf2 ${level}% 100%)` : '#ececf2';

  return <article className={styles.statTank}>
    <button className={styles.statTankName} onClick={onDetail} disabled={unavailable || loading}>{tank.name}</button>
    <div className={styles.donut} style={{ background }} role="img" aria-label={`${tank.name}: ${level == null ? status : `isi ${percentage}, ${status}`}`}>
      <span><strong>{percentage}</strong><small style={{ color: category?.color }}>{status}</small></span>
    </div>
    <dl className={styles.statLegend}>{categories.map(item => <div key={item.label}>
      <dt><Image src={`/images/dashboard/${item.icon}`} alt="" width={16} height={16} unoptimized />{item.label}</dt><dd>{item.range}</dd>
    </div>)}</dl>
    <p className={styles.statHint}>{level == null ? (loading ? 'Loading water level…' : 'Water level unavailable') : `Last reading: ${readingTime(tank.latestReading?.recordedAt)}`}</p>
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
    {explain && <p className={styles.helper}>The arc shows the latest tank fill percentage: Normal &gt;70% (green), Warning 30–70% (yellow), and Critical &lt;30% (red). Gray indicates remaining capacity. Click a tank name for details.</p>}
    {unavailable && <p className={styles.helper}>Water level data is unavailable. Tanks A/B are temporary placeholders.</p>}
  </section>;
}
