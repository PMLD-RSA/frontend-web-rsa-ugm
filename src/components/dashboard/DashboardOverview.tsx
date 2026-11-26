'use client';

import Image from 'next/image';
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
import { AnchoredPopover } from './AnchoredPopover';
import { DownloadReportDialog } from './DownloadReportDialog';
import { NotificationPopover } from './NotificationPopover';
import { LuSearch as Search } from "react-icons/lu";
import styles from './DashboardOverview.module.css';


const statuses = [
  { value: 'NORMAL', label: 'Normal', tone: 'normal', description: 'Safe Water Level', image: 'tank-normal.png', width: 107 },
  { value: 'WARNING', label: 'Warning', tone: 'warning', description: 'Monitoring Required', image: 'tank-warning.png', width: 108 },
  { value: 'CRITICAL', label: 'Critical', tone: 'critical', description: 'Action Required', image: 'tank-critical.png', width: 99 },
] as const;

const periods: { value: DashboardPeriod; label: string }[] = [
  { value: 'Daily', label: 'Daily' },
  { value: 'Weekly', label: 'Weekly' },
  { value: 'Monthly', label: 'Monthly' },
  { value: 'Custom', label: 'Custom' },
  { value: 'All', label: 'All Time' },
];

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
        <div className="app-search" role="search">
          <Search size={16} aria-hidden="true" />
          <input
            type="search" placeholder="Search tanks, locations, or sensors..." aria-label="Search tanks, locations, or sensors"
            value={query} onChange={(event) => onQueryChange(event.target.value)}
            aria-controls="dashboard-tank-list"
          />
        </div>
        <div className={styles.toolbarActions}>
          <NotificationPopover className={styles.notification} iconSize={24} />
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
              <Image src="/images/dashboard/date-range-calendar.svg" alt="" width={16} height={16} unoptimized />
              <span>{rangeLabel(filters.startDate, filters.endDate)}</span>
            </DashboardDatePicker>
            <AnchoredPopover
              label="Time Range"
              anchorRef={dateControl}
              triggerClassName={styles.period}
              trigger={<><span>{periods.find(period => period.value === filters.period)?.label}</span><Image src="/images/dashboard/date-range-chevron.svg" alt="" width={13} height={13} unoptimized /></>}
            >
              {(close) => (
                <div className={styles.timeRangePanel}>
                  <header className={styles.timeRangeHeader}>
                    <h2>Time Range</h2>
                    <button type="button" aria-label="Close time range" onClick={close}>
                      <Image src="/images/dashboard/time-range-close.svg" alt="" width={16} height={16} unoptimized />
                    </button>
                  </header>
                  <div className={styles.timeRangeOptions}>
                    {periods.map(period => (
                      <button
                        key={period.value}
                        type="button"
                        aria-pressed={filters.period === period.value}
                        data-popup-focus={filters.period === period.value ? '' : undefined}
                        onClick={() => {
                          close();
                          if (period.value === 'Custom') {
                            dateControl.current?.querySelector<HTMLButtonElement>('button[popovertarget]')?.click();
                          } else {
                            onFiltersChange({ ...filters, ...periodRange(period.value), period: period.value });
                          }
                        }}
                      >
                        {period.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </AnchoredPopover>
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
