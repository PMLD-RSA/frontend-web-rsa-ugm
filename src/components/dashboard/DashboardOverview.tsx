'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef, useState } from 'react';
import type { Tank } from '@/types';
import { Card } from '@/components/ui/Card';
import {
  type DashboardFilters, type DashboardPeriod,
  getTankStatus, periodRange,
} from '@/lib/dashboard';
import { DashboardIcon as Icon } from './DashboardIcon';
import { DashboardDatePicker } from './DashboardCalendar';
import { DashboardFilter } from './DashboardFilter';
import { DownloadReportDialog } from './DownloadReportDialog';
import styles from './DashboardOverview.module.css';

const statuses = [
  { value: 'NORMAL', label: 'Normal', tone: 'normal', description: 'Safe Water Level', image: 'tank-normal.png', width: 107 },
  { value: 'WARNING', label: 'Warning', tone: 'warning', description: 'Monitoring Required', image: 'tank-warning.png', width: 108 },
  { value: 'CRITICAL', label: 'Critical', tone: 'critical', description: 'Action Required', image: 'tank-critical.png', width: 99 },
] as const;

interface Props {
  tanks: Tank[];
  allTanks: Tank[];
  loading: boolean;
  failed: boolean;
  query: string;
  onQueryChange: (query: string) => void;
  filters: DashboardFilters;
  onFiltersChange: (filters: DashboardFilters) => void;
}

function rangeLabel(start: string, end: string) {
  const format = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  if (!start && !end) return 'All dates';
  if (start === end) return format(start);
  return `${start ? format(start) : 'Start'} - ${end ? format(end) : 'Now'}`;
}

export function DashboardOverview({ tanks, allTanks, loading, failed, query, onQueryChange, filters, onFiltersChange }: Props) {
  const [downloadOpen, setDownloadOpen] = useState(false);
  const downloadButton = useRef<HTMLButtonElement>(null);
  const dateControl = useRef<HTMLDivElement>(null);
  const counts = { NORMAL: 0, WARNING: 0, CRITICAL: 0 };
  for (const tank of tanks) {
    const status = getTankStatus(tank);
    if (status) counts[status] += 1;
  }
  const unknownCount = tanks.length - counts.NORMAL - counts.WARNING - counts.CRITICAL;
  const count = (value: number) => loading || failed ? '—' : value;

  return (
    <section className={styles.overview} aria-label="Dashboard summary">
      <header className={styles.toolbar}>
        <div className={styles.search} role="search">
          <Icon name="search" width={24} />
          <input
            type="search" placeholder="Search" aria-label="Search tanks, locations, or sensors"
            value={query} onChange={(event) => onQueryChange(event.target.value)}
            aria-controls="dashboard-tank-list"
          />
        </div>
        <div className={styles.toolbarActions}>
          <Link className={styles.notification} href="/alerts" aria-label="View alert notifications" title="Alert notifications">
            <Icon name="notification" width={26} />
          </Link>
          <button ref={downloadButton} className={styles.download} type="button" onClick={() => setDownloadOpen(true)} disabled={loading || failed || !allTanks.length} title="Download PDF or Excel report" aria-haspopup="dialog">
            <Icon name="download" width={24} />
            <span>Download All</span>
          </button>
        </div>
      </header>

      <div className={styles.headingRow}>
        <h1>Dashboard</h1>
        <div className={styles.controls}>
          <div ref={dateControl} className={styles.dateControl}>
            <DashboardDatePicker label="Select latest reading date range" triggerClassName={styles.dateButton} value={filters} onChange={(range) => onFiltersChange({ ...filters, ...range, period: 'Custom' })}>
              <Icon name="calendar" width={16} />
              <span>{rangeLabel(filters.startDate, filters.endDate)}</span>
            </DashboardDatePicker>
            <div className={styles.period}>
              <select
                aria-label="Latest reading period" value={filters.period}
                onChange={(event) => {
                  const period = event.target.value as DashboardPeriod;
                  if (period === 'Custom') dateControl.current?.querySelector<HTMLButtonElement>('button[popovertarget]')?.click();
                  else onFiltersChange({ ...filters, ...periodRange(period), period });
                }}
              >
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Custom">Custom</option>
                <option value="All">All time</option>
              </select>
              <Icon name="chevron-down" width={13} />
            </div>
          </div>
          <DashboardFilter tanks={allTanks} filters={filters} onChange={onFiltersChange} triggerClassName={styles.filterButton} />
        </div>
      </div>

      {downloadOpen && <DownloadReportDialog tanks={allTanks} filters={filters} onClose={() => { setDownloadOpen(false); downloadButton.current?.focus(); }} />}

      <div className={styles.summaryGrid} aria-busy={loading} aria-label="Tank statistics">
        <Card className={styles.summaryCard}>
          <div className={styles.cardBody}>
            <h2>Total Tanks</h2>
            <div className={styles.metric}><strong>{count(tanks.length)}</strong><span>Tank</span></div>
            <div className={styles.totalIllustration}><Icon name="tank-total" width={81} height={63} /></div>
          </div>
          <div className={styles.cardFooter}>Registered in the system</div>
        </Card>
        {statuses.map((status) => (
          <Card key={status.value} className={`${styles.summaryCard} ${styles[status.tone]}`}>
            <div className={styles.cardBody}>
              <h2>{status.label}</h2>
              <div className={styles.metric}><strong>{count(counts[status.value])}</strong><span>Tank</span></div>
              <Image className={styles.illustration} src={`/images/dashboard/${status.image}`} alt="" width={status.width} height={106} unoptimized />
            </div>
            <div className={styles.cardFooter}>
              <Icon name={`dot-${status.tone}`} width={10} height={9} />
              <span>{status.description}</span>
            </div>
          </Card>
        ))}
      </div>
      {!loading && !failed && unknownCount > 0 && <p className={styles.note}>{unknownCount} tanks have no status data.</p>}
    </section>
  );
}
