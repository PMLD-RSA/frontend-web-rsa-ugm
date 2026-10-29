'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Clock3, Droplets, Info, X } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ApiResponse, AuditLog, Tank, TankHourlyAggregation } from '@/types';
import { TankStatistics, referenceTanks } from './TankStatistics';
import { TankMap } from './TankMap';
import { measurement, numeric, readingTime, TankDetails } from './TankLevel';
import styles from './TankDashboard.module.css';

export async function dashboardData<T>(url: string, signal?: AbortSignal): Promise<T[]> {
  const response = await fetch(url, { signal });
  const result: ApiResponse<T[]> = await response.json();
  if (!response.ok || !result.success || result.source === 'mock' || !Array.isArray(result.data)) throw new Error('Data belum tersedia');
  return result.data;
}

function DetailDialog({ tank, onClose }: { tank: Tank; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { dialog.current?.showModal(); }, []);
  return <dialog ref={dialog} className={styles.dialog} onClose={onClose} onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
    <div className={styles.dialogInner}><header className={styles.panelHeader}><h2>Detail Tangki</h2><button autoFocus aria-label="Tutup detail" onClick={() => dialog.current?.close()}><X size={20} /></button></header>
      <TankDetails tank={tank} />
      <dl className={styles.measurements}><div><dt>Batas minimum</dt><dd>{measurement(tank.minThresholdPercent, '%')}</dd></div><div><dt>Batas maksimum</dt><dd>{measurement(tank.maxThresholdPercent, '%')}</dd></div><div><dt>Status sensor</dt><dd>{tank.nodes?.[0]?.status || 'Belum tersedia'}</dd></div></dl>
      <p className={styles.helper}>Suhu, kelembapan, dan status pintu belum tersedia untuk tangki ini.</p>
      {tank.activeAlert?.status === 'active' && <p className={styles.notice}>{tank.activeAlert.message}</p>}
    </div>
  </dialog>;
}

function RecentLogins() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [state, setState] = useState('loading');
  useEffect(() => {
    const controller = new AbortController();
    dashboardData<AuditLog>('/api/audit-logs?action=LOGIN&limit=6', controller.signal)
      .then(data => { setLogs(data.filter(log => log.action === 'LOGIN').sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 6)); setState('ready'); })
      .catch(() => { if (!controller.signal.aborted) setState('unavailable'); });
    return () => controller.abort();
  }, []);
  return <section className={styles.panel}><header className={styles.panelHeader}><h2>Login Terakhir</h2><Link className={styles.detailLink} href="/logs">Lihat detail</Link></header>
    <div className={styles.tableScroll}><table className={styles.loginTable}><thead><tr><th>Pengguna</th><th>Role</th><th>Waktu Login</th></tr></thead><tbody>
      {logs.map(log => <tr key={log.id}><td><span className={styles.avatar}>{(log.username || '?').slice(0, 1).toUpperCase()}</span>{log.username || 'Pengguna'}</td><td><span className={styles.helper}>Belum tersedia</span></td><td><Clock3 size={14} />{readingTime(log.createdAt)}</td></tr>)}
    </tbody></table></div>
    {!logs.length && <div className={styles.empty}><Clock3 size={28} /><p>{state === 'loading' ? 'Memuat riwayat login…' : state === 'unavailable' ? 'Fitur riwayat login belum tersedia.' : 'Belum ada riwayat login.'}</p></div>}
  </section>;
}

function VolumeHistory({ tanks }: { tanks: Tank[] }) {
  const [history, setHistory] = useState<TankHourlyAggregation[]>([]);
  const [state, setState] = useState('loading');
  useEffect(() => {
    const controller = new AbortController();
    dashboardData<TankHourlyAggregation>('/api/readings/history?hours=24', controller.signal)
      .then(data => { setHistory(data); setState('ready'); })
      .catch(() => { if (!controller.signal.aborted) setState('unavailable'); });
    return () => controller.abort();
  }, []);
  const groups = new Map<string, { timestamp: number; [id: string]: number }>();
  for (const row of history) {
    const timestamp = Date.parse(row.timeBucket);
    const volume = numeric(row.avgVolume);
    if (!Number.isFinite(timestamp) || volume == null || !tanks.some(tank => tank.id === row.tankId)) continue;
    const group = groups.get(row.timeBucket) ?? { timestamp };
    group[row.tankId] = volume;
    groups.set(row.timeBucket, group);
  }
  const data = [...groups.values()].sort((a, b) => a.timestamp - b.timestamp);
  const colors = ['#0077b6', '#fecb28', '#42a132', '#8659ce'];
  return <section className={styles.panel}><header className={styles.panelHeader}><h2>Transaksi Debit Air Tangki (24 Jam)</h2></header>
    <p className={styles.helper}>Fitur debit masuk/keluar belum tersedia. {data.length ? 'Grafik menampilkan rata-rata volume air per jam (liter).' : 'Data debit belum disediakan oleh sistem.'}</p>
    {data.length ? <><div className={styles.chart} aria-label="Grafik rata-rata volume air per jam"><ResponsiveContainer width="100%" height="100%"><BarChart data={data}><CartesianGrid vertical={false} stroke="#eef1f5" /><XAxis dataKey="timestamp" tickFormatter={value => new Date(value).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} tick={{ fontSize: 11 }} minTickGap={24} /><YAxis tick={{ fontSize: 11 }} width={48} /><Tooltip labelFormatter={value => new Date(Number(value)).toLocaleString('id-ID')} />{tanks.map((tank, index) => <Bar key={tank.id} dataKey={tank.id} name={`${tank.name} (L)`} fill={colors[index % colors.length]} radius={[2, 2, 0, 0]} />)}</BarChart></ResponsiveContainer></div><div className={styles.legend}>{tanks.map((tank, index) => <span key={tank.id}><i style={{ background: colors[index % colors.length] }} />{tank.name}</span>)}</div></> : <div className={styles.empty}><Droplets size={30} /><p>{state === 'loading' ? 'Memuat riwayat volume…' : state === 'unavailable' ? 'Riwayat volume air belum tersedia.' : 'Tidak ada riwayat volume untuk tangki yang dipilih.'}</p></div>}
  </section>;
}

export function TankDashboard({ tanks, loading, unavailable, onRefresh }: { tanks: Tank[]; loading: boolean; unavailable: boolean; onRefresh: () => void }) {
  const [detail, setDetail] = useState<Tank | null>(null);
  return <>
    <div className={styles.dashboardGrid}>
      <div className={styles.dashboardColumn}>
      <TankMap tanks={unavailable ? referenceTanks : tanks} loading={loading} unavailable={unavailable} onDetail={setDetail} />
      <VolumeHistory tanks={tanks} />
      </div>
      <div className={styles.dashboardColumn}>
      <TankStatistics tanks={tanks} loading={loading} unavailable={unavailable} onDetail={setDetail} onRefresh={onRefresh} />
      <RecentLogins />
      </div>
    </div>
    <p className={styles.footnote}><Info size={14} />Data yang belum tersedia ditampilkan tanpa angka perkiraan.</p>
    {detail && <DetailDialog tank={detail} onClose={() => setDetail(null)} />}
  </>;
}
