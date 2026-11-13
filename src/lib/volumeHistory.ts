import type { WaterLevelReading } from '@/types';

export const HOUR_MS = 3_600_000;
export type VolumePoint = { timestamp: number; [tankId: string]: number };

/** Average each tank independently; missing hours stay empty instead of becoming zero. */
export function buildVolumeHistory(readings: WaterLevelReading[], tankIds: string[], hours: number, endHour: number): VolumePoint[] {
  const visible = new Set(tankIds);
  const groups = new Map<number, Map<string, { total: number; count: number }>>();
  for (const reading of readings) {
    const timestamp = Date.parse(reading.recordedAt);
    const volume = Number(reading.volumeLiters);
    if (!visible.has(reading.tankId) || !Number.isFinite(timestamp) || reading.volumeLiters == null || String(reading.volumeLiters).trim() === '' || !Number.isFinite(volume) || volume < 0) continue;
    const hour = Math.floor(timestamp / HOUR_MS) * HOUR_MS;
    const group = groups.get(hour) ?? new Map<string, { total: number; count: number }>();
    const current = group.get(reading.tankId) ?? { total: 0, count: 0 };
    group.set(reading.tankId, { total: current.total + volume, count: current.count + 1 });
    groups.set(hour, group);
  }
  return Array.from({ length: hours }, (_, index) => {
    const timestamp = endHour - (hours - 1 - index) * HOUR_MS;
    const point: VolumePoint = { timestamp };
    for (const [tankId, { total, count }] of groups.get(timestamp) ?? []) point[tankId] = total / count;
    return point;
  });
}
