'use client';

import type { CSSProperties } from 'react';
import type { Tank } from '@/types';
import { getTankStatus } from '@/lib/dashboard';
import styles from './TankDashboard.module.css';

export function numeric(value: unknown): number | null {
  if (value == null || String(value).trim() === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function measurement(value: unknown, suffix = '') {
  const number = numeric(value);
  return number == null ? 'Belum tersedia' : `${number.toLocaleString('id-ID', { maximumFractionDigits: 1 })}${suffix}`;
}

export function readingTime(value?: string) {
  if (!value || Number.isNaN(new Date(value).getTime())) return 'Belum tersedia';
  return new Date(value).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export const statusLabels = { NORMAL: 'Normal', WARNING: 'Peringatan', CRITICAL: 'Kritis', UNKNOWN: 'Belum ada data' };

export function TankLevel({ tank, compact = false }: { tank: Tank; compact?: boolean }) {
  const raw = numeric(tank.latestReading?.levelPercent);
  const level = raw == null ? null : Math.max(0, Math.min(100, raw));
  const status = getTankStatus(tank) ?? 'UNKNOWN';
  return <div className={`${styles.gauge} ${compact ? styles.compactGauge : ''}`} data-status={status}
    role="img" aria-label={`${tank.name}: ${measurement(raw, '%')}`}>
    <div className={styles.scale} aria-hidden="true">{[100, 80, 60, 40, 20, 0].map(value => <span key={value}>{value}%</span>)}</div>
    <div className={styles.vessel}>
      {level != null && level > 0 && <div className={styles.water} style={{ height: `${level}%` } as CSSProperties}>
        {level < 100 && <>{[false, true].map(back => <svg key={String(back)} className={`${styles.wave} ${back ? styles.waveBack : ''}`} viewBox="0 0 400 20" preserveAspectRatio="none" aria-hidden="true"><path d="M0 10 Q25 0 50 10 T100 10 T150 10 T200 10 T250 10 T300 10 T350 10 T400 10 V20 H0Z" /></svg>)}</>}
      </div>}
      <div className={styles.gridLines} aria-hidden="true">{[100, 80, 60, 40, 20, 0].map(value => <span key={value} />)}</div>
      <strong className={styles.levelLabel}>{level == null ? '—' : `${Math.round(level)}%`}</strong>
    </div>
  </div>;
}

export function TankDetails({ tank }: { tank: Tank }) {
  const status = getTankStatus(tank) ?? 'UNKNOWN';
  const level = numeric(tank.latestReading?.levelPercent);
  return <div className={styles.tankDetails} data-status={status}>
    <div className={styles.detailHeading}><div><h3>{tank.name}</h3><span className={styles.badge}>{statusLabels[status]}</span><p>{tank.location || 'Lokasi belum tersedia'}</p></div><TankLevel tank={tank} compact /></div>
    <div className={styles.levelRow}><span>Level air</span><strong>{measurement(level, '%')}</strong></div>
    <div className={styles.progress}><span style={{ width: `${Math.max(0, Math.min(100, level ?? 0))}%` }} /></div>
    <dl className={styles.measurements}>
      <div><dt>Volume air</dt><dd>{measurement(tank.latestReading?.volumeLiters, ' L')}</dd></div>
      <div><dt>Kapasitas</dt><dd>{measurement(tank.capacityLiters, ' L')}</dd></div>
      <div><dt>Sensor</dt><dd>{tank.nodes?.[0]?.deviceCode || 'Belum tersedia'}</dd></div>
      <div><dt>Sinyal</dt><dd>{measurement(tank.latestReading?.rssi, ' dBm')}</dd></div>
      <div><dt>Terakhir diperbarui</dt><dd>{readingTime(tank.latestReading?.recordedAt)}</dd></div>
    </dl>
  </div>;
}
