'use client';

import { useState } from 'react';
import type { Tank, TankStatusCategory } from '@/types';
import type { DashboardFilters } from '@/lib/dashboard';
import { AnchoredPopover } from './AnchoredPopover';
import { DashboardIcon as Icon } from './DashboardIcon';
import styles from './DashboardPanels.module.css';

const statuses = [
  { value: 'NORMAL', label: 'Normal', image: 'filter-normal' },
  { value: 'WARNING', label: 'Peringatan', image: 'filter-warning' },
  { value: 'CRITICAL', label: 'Kritis', image: 'filter-critical' },
] as const;

export function DashboardFilter({ tanks, filters, onChange, triggerClassName }: { tanks: Tank[]; filters: DashboardFilters; onChange: (filters: DashboardFilters) => void; triggerClassName: string }) {
  const [tankId, setTankId] = useState(filters.tankId);
  const [selected, setSelected] = useState<TankStatusCategory[]>(filters.statuses);
  const active = Boolean(filters.tankId || filters.statuses.length);
  return <AnchoredPopover label="Filter Dashboard" trigger={<><Icon name="filter" width={20} /><span>Filter</span>{active && <span className={styles.activeDot} aria-label="Filter aktif" />}</>} triggerClassName={triggerClassName} className={styles.filterPanel} active={active} onOpen={() => { setTankId(filters.tankId); setSelected(filters.statuses); }}>
    {(close) => <form onSubmit={(event) => { event.preventDefault(); onChange({ ...filters, tankId, statuses: selected }); close(); }}>
      <div className={styles.filterHeader}>
        <h2>Filter Dashboard</h2>
        <button type="button" className={styles.closeButton} onClick={close} aria-label="Tutup filter"><Icon name="close-filter" width={19} /></button>
        <p>Tampilkan tangki sesuai kondisi yang dipilih</p>
      </div>
      <div className={styles.divider}><Icon name="filter-divider" width={361} height={1} /></div>
      <label className={styles.filterTank}>Tangki
        <span className={styles.selectField}>
          <select data-popup-focus aria-label="Pilih tangki untuk filter" name="tankId" value={tankId} onChange={(event) => setTankId(event.target.value)}>
            <option value="">Pilih Tangki</option>
            {tanks.map(tank => <option key={tank.id} value={tank.id}>{tank.name}</option>)}
          </select>
          <Icon name="select-chevron" width={20} />
        </span>
      </label>
      <fieldset className={styles.statusField}>
        <legend>Status tangki</legend>
        <p>Bisa pilih lebih dari satu</p>
        <div className={styles.checkboxes}>
          {statuses.map(status => <label key={status.value}>
            <input type="checkbox" name="status" value={status.value} checked={selected.includes(status.value)} onChange={(event) => setSelected(current => event.target.checked ? [...current, status.value] : current.filter(value => value !== status.value))} />
            <Icon name={status.image} width={17} />
            <span>{status.label}</span>
          </label>)}
        </div>
      </fieldset>
      <p className={styles.filterNotice}>Filter diterapkan pada denah dan data tangki.</p>
      <div className={styles.divider}><Icon name="filter-divider" width={361} height={1} /></div>
      <div className={styles.filterFooter}>
        <button type="button" className={styles.resetButton} onClick={() => { setTankId(''); setSelected([]); }}>Reset</button>
        <button type="submit" className={styles.primaryButton}>Terapkan Filter</button>
      </div>
    </form>}
  </AnchoredPopover>;
}
