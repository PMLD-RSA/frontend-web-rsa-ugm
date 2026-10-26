import type { Tank, TankStatusCategory } from '@/types';

export type DashboardPeriod = 'Daily' | 'Weekly' | 'Monthly' | 'Custom' | 'All';

export interface DashboardFilters {
  tankId: string;
  statuses: TankStatusCategory[];
  startDate: string;
  endDate: string;
  period: DashboardPeriod;
}

export function dateInputValue(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function periodRange(period: DashboardPeriod, today = new Date()) {
  if (period === 'All') return { startDate: '', endDate: '' };
  const start = new Date(today);
  if (period === 'Weekly') start.setDate(start.getDate() - 6);
  if (period === 'Monthly') start.setDate(1);
  return { startDate: dateInputValue(start), endDate: dateInputValue(today) };
}

// Use one status calculation for the overview, filters, export, and tank list.
export function getTankStatus(tank: Tank): TankStatusCategory | null {
  if (tank.activeAlert?.status === 'active') return tank.activeAlert.level;
  const rawLevel = tank.latestReading?.levelPercent;
  if (rawLevel == null || String(rawLevel).trim() === '') return null;
  const level = Number(rawLevel);
  if (!Number.isFinite(level)) return null;
  const minimum = Number(tank.minThresholdPercent ?? 30);
  if (level < (Number.isFinite(minimum) ? minimum : 30)) return 'CRITICAL';
  if (level <= 60) return 'WARNING';
  return 'NORMAL';
}

export function filterDashboardTanks(tanks: Tank[], query: string, filters: DashboardFilters) {
  const search = query.trim().toLocaleLowerCase('id-ID');
  return tanks.filter((tank) => {
    const searchable = [tank.name, tank.location, ...(tank.nodes?.map((node) => node.deviceCode) ?? [])]
      .filter(Boolean).join(' ').toLocaleLowerCase('id-ID');
    if (search && !searchable.includes(search)) return false;
    if (filters.tankId && tank.id !== filters.tankId) return false;
    const status = getTankStatus(tank);
    if (filters.statuses.length && (!status || !filters.statuses.includes(status))) return false;
    if (filters.startDate || filters.endDate) {
      if (!tank.latestReading?.recordedAt) return false;
      const recordedAt = new Date(tank.latestReading.recordedAt);
      if (Number.isNaN(recordedAt.getTime())) return false;
      const date = dateInputValue(recordedAt);
      if (filters.startDate && date < filters.startDate) return false;
      if (filters.endDate && date > filters.endDate) return false;
    }
    return true;
  });
}

