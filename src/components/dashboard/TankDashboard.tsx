'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Clock3, Droplets, Info, X } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ApiResponse, AuditLog, Tank, WaterLevelReading } from '@/types';
import { TankStatistics, referenceTanks } from './TankStatistics';
import { TankMap } from './TankMap';
import { measurement, numeric, readingTime, TankDetails } from './TankLevel';
import styles from './TankDashboard.module.css';
import { useAuthStore } from '@/stores/authStore';

const HOUR_MS = 3_600_000;
const volumeColors = ['#0077b6', '#b87516', '#27806f', '#8062a8', '#bf5c63', '#526b94'];
const formatVolume = (value: number) => value.toLocaleString('en-US', { maximumFractionDigits: 1 });
type VolumePoint = { timestamp: number; [tankId: string]: number };

export async function dashboardData<T>(url: string, signal?: AbortSignal): Promise<T[]> {
  const response = await fetch(url, { signal });
  const result: ApiResponse<T[]> = await response.json();
  if (!response.ok || !result.success || result.source === 'mock' || !Array.isArray(result.data)) throw new Error('Data unavailable');
  return result.data;
}

function DetailDialog({ tank, onClose }: { tank: Tank; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { dialog.current?.showModal(); }, []);
  return <dialog ref={dialog} className={styles.dialog} onClose={onClose} onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
    <div className={styles.dialogInner}><header className={styles.panelHeader}><h2>Tank Details</h2><button autoFocus aria-label="Close details" onClick={() => dialog.current?.close()}><X size={20} /></button></header>
      <TankDetails tank={tank} />
      <dl className={styles.measurements}><div><dt>Minimum threshold</dt><dd>{measurement(tank.minThresholdPercent, '%')}</dd></div><div><dt>Maximum threshold</dt><dd>{measurement(tank.maxThresholdPercent, '%')}</dd></div><div><dt>Sensor status</dt><dd>{tank.nodes?.[0]?.status || 'Unavailable'}</dd></div></dl>
      <p className={styles.helper}>Temperature, humidity, and door status are unavailable for this tank.</p>
      {tank.activeAlert?.status === 'active' && <p className={styles.notice}>{tank.activeAlert.message}</p>}
    </div>
  </dialog>;
}

function RecentLogins() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [state, setState] = useState('loading');
  const [page, setPage] = useState(0);
  const user = useAuthStore(state => state.user);
  useEffect(() => {
    const controller = new AbortController();
    dashboardData<AuditLog>('/api/audit-logs?action=LOGIN&limit=100', controller.signal)
      .then(data => { setLogs(data.filter(log => log.action === 'LOGIN').sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))); setState('ready'); })
      .catch(() => { if (!controller.signal.aborted) setState('unavailable'); });
    return () => controller.abort();
  }, []);
  return <section className={`${styles.panel} ${styles.loginPanel}`}><header className={styles.panelHeader}><h2>Recent Logins</h2><Link className={styles.detailLink} href="/users">View details</Link></header>
    <div className={styles.tableScroll}><table className={styles.loginTable}><thead><tr><th>User</th><th>Role</th><th>Login Time</th></tr></thead><tbody>
      {logs.slice(page * 5, page * 5 + 5).map(log => { const matchingUser = user && log.userId && String(log.userId) === String(user.id) ? user : null; const username = log.username || log.user?.username || matchingUser?.username || 'Unknown user'; const role = log.role || log.user?.role || matchingUser?.role; const email = log.email || log.user?.email; return <tr key={log.id}><td><div className={styles.loginUser}><span className={styles.avatar}>{username.slice(0, 1).toUpperCase()}</span><span><strong>{username}</strong>{email && <small>{email}</small>}</span></div></td><td>{role ? <span className={styles.loginRole}>{role}</span> : <span className={styles.helper}>Unavailable</span>}</td><td><Image src="/images/dashboard/login-clock-figma.svg" width={16} height={16} alt="" />{readingTime(log.createdAt)}</td></tr>; })}
    </tbody></table></div>
    {!logs.length && <div className={styles.empty}><Clock3 size={28} /><p>{state === 'loading' ? 'Loading login history…' : state === 'unavailable' ? 'Login history is unavailable.' : 'No login history yet.'}</p></div>}
    {logs.length > 5 && <nav className={styles.loginPagination} aria-label="Login history pages"><button disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button><span>{page + 1} / {Math.ceil(logs.length / 5)}</span><button disabled={(page + 1) * 5 >= logs.length} onClick={() => setPage(page + 1)}>Next</button></nav>}
  </section>;
}

function VolumeDetailDialog({ tanks, data, endHour, onClose }: { tanks: Tank[]; data: VolumePoint[]; endHour: number; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [selectedTankId, setSelectedTankId] = useState(() => tanks.find(tank => data.some(point => point[tank.id] !== undefined))?.id ?? tanks[0]?.id ?? '');
  useEffect(() => { dialog.current?.showModal(); }, []);

  const selectedTank = tanks.find(tank => tank.id === selectedTankId);
  const color = volumeColors[Math.max(0, tanks.findIndex(tank => tank.id === selectedTankId)) % volumeColors.length];
  const startHour = endHour - 23 * HOUR_MS;
  const values = new Map(data.map(point => [point.timestamp, point[selectedTankId]]));
  const chartData = Array.from({ length: 24 }, (_, index) => {
    const timestamp = startHour + index * HOUR_MS;
    return { timestamp, volume: values.get(timestamp) ?? null };
  });
  const availableHours = chartData.filter(point => point.volume !== null).length;
  const axisTicks = chartData.filter((_, index) => index % 3 === 0 || index === 23).map(point => point.timestamp);

  return (
    <dialog
      ref={dialog}
      className={styles.volumeDialog}
      aria-labelledby="volume-detail-title"
      onClose={onClose}
      onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }}
    >
      <div className={styles.volumeDialogInner}>
        <header className={styles.volumeDialogHeader}>
          <div>
            <h2 id="volume-detail-title">Hourly Average Water Volume</h2>
            <p>Last 24 hours · {availableHours} hours with readings</p>
          </div>
          <button type="button" autoFocus aria-label="Close chart details" onClick={() => dialog.current?.close()}><X size={20} /></button>
        </header>

        <div className={styles.volumeDialogControls}>
          <label htmlFor="volume-detail-tank">Tank</label>
          <select id="volume-detail-tank" value={selectedTankId} onChange={event => setSelectedTankId(event.target.value)}>
            {tanks.map(tank => <option key={tank.id} value={tank.id}>{tank.name}</option>)}
          </select>
          <span>Volume in liters</span>
        </div>

        {availableHours > 0 ? (
          <div className={styles.volumeDialogScroll}>
            <div className={styles.volumeDialogChart} role="img" aria-label={`Average water volume chart for ${selectedTank?.name ?? 'tangki'} over 24 hours`}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 14, right: 18, bottom: 8, left: 4 }}>
                  <CartesianGrid stroke="#e8edf2" strokeDasharray="3 5" />
                  <XAxis dataKey="timestamp" type="number" scale="time" domain={[startHour, endHour]} ticks={axisTicks} tickFormatter={value => new Date(value).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} tick={{ fill: '#667587', fontSize: 11 }} tickLine={false} axisLine={false} tickMargin={12} />
                  <YAxis tickFormatter={value => formatVolume(Number(value))} tick={{ fill: '#667587', fontSize: 11 }} tickLine={false} axisLine={false} tickMargin={8} width={66} domain={['auto', 'auto']} />
                  <Tooltip cursor={{ stroke: '#9aabba', strokeDasharray: '4 4' }} labelFormatter={value => new Date(Number(value)).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })} formatter={value => `${formatVolume(Number(value))} L`} contentStyle={{ border: '1px solid #e4eaf0', borderRadius: 8, boxShadow: '0 8px 24px rgb(16 44 67 / 10%)', fontSize: 12 }} />
                  <Line dataKey="volume" name={selectedTank?.name ?? 'Tank'} type="linear" stroke={color} strokeWidth={2.5} dot={{ r: 3, fill: color, strokeWidth: 0 }} activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }} connectNulls={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className={styles.volumeDialogEmpty}>No readings for this tank in the last 24 hours.</div>
        )}
        <p className={styles.volumeDialogNote}>Each point shows the average reading for that hour. Hours without data are left empty.</p>
      </div>
    </dialog>
  );
}

function VolumeHistory({ tanks }: { tanks: Tank[] }) {
  const [history, setHistory] = useState<WaterLevelReading[]>([]);
  const [state, setState] = useState('loading');
  const [detailEndHour, setDetailEndHour] = useState<number | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    dashboardData<WaterLevelReading>('/api/readings/history?hours=24', controller.signal)
      .then(data => { setHistory(data); setState('ready'); })
      .catch(() => { if (!controller.signal.aborted) setState('unavailable'); });
    return () => controller.abort();
  }, []);
  const visibleTankIds = new Set(tanks.map(tank => tank.id));
  const groups = new Map<number, Map<string, { total: number; count: number }>>();
  for (const row of history) {
    const timestamp = Date.parse(row.recordedAt);
    const volume = numeric(row.volumeLiters);
    if (!Number.isFinite(timestamp) || volume == null || !row.tankId || !visibleTankIds.has(row.tankId)) continue;
    const hour = Math.floor(timestamp / HOUR_MS) * HOUR_MS;
    const group = groups.get(hour) ?? new Map<string, { total: number; count: number }>();
    const current = group.get(row.tankId) ?? { total: 0, count: 0 };
    group.set(row.tankId, { total: current.total + volume, count: current.count + 1 });
    groups.set(hour, group);
  }
  const data: VolumePoint[] = [...groups.entries()].sort(([a], [b]) => a - b).map(([timestamp, group]) => {
    const point: VolumePoint = { timestamp };
    for (const [tankId, { total, count }] of group) point[tankId] = total / count;
    return point;
  });
  return (
    <section className={`${styles.panel} ${styles.volumePanel}`} aria-labelledby="volume-history-title">
      <header className={styles.volumeHeader}>
        <div>
          <h2 id="volume-history-title">Average Tank Water Volume</h2>
          <p>Sensor reading history over the last 24 hours</p>
        </div>
        <button type="button" className={styles.detailLink} onClick={() => setDetailEndHour(Math.floor(Date.now() / HOUR_MS) * HOUR_MS)} disabled={!tanks.length} aria-haspopup="dialog">View details</button>
      </header>

      {data.length > 0 ? (
        <>
          <div className={styles.volumeChart} role="img" aria-label="Hourly average water volume line chart for each tank">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 12, right: 12, bottom: 4, left: 0 }}>
                <CartesianGrid vertical={false} stroke="#e8edf2" strokeDasharray="3 5" />
                <XAxis
                  dataKey="timestamp"
                  type="number"
                  scale="time"
                  domain={data.length === 1 ? [data[0].timestamp - 30 * 60_000, data[0].timestamp + 30 * 60_000] : ['dataMin', 'dataMax']}
                  tickFormatter={value => new Date(value).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  tick={{ fill: '#667587', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={12}
                  minTickGap={32}
                />
                <YAxis
                  tickFormatter={value => formatVolume(Number(value))}
                  tick={{ fill: '#667587', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  width={58}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  cursor={{ stroke: '#aab9c7', strokeDasharray: '3 4' }}
                  labelFormatter={value => new Date(Number(value)).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                  formatter={value => `${formatVolume(Number(value))} L`}
                  contentStyle={{ border: '1px solid #e4eaf0', borderRadius: 8, boxShadow: '0 8px 24px rgb(16 44 67 / 10%)', fontSize: 12 }}
                  labelStyle={{ color: '#344354', fontWeight: 600, marginBottom: 6 }}
                />
                {tanks.map((tank, index) => (
                  <Line
                    key={tank.id}
                    dataKey={tank.id}
                    name={tank.name}
                    type="linear"
                    stroke={volumeColors[index % volumeColors.length]}
                    strokeWidth={2.5}
                    dot={data.filter(point => point[tank.id] !== undefined).length === 1 ? { r: 4 } : false}
                    activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className={styles.volumeLegend} aria-label="Tanks in chart">
            {tanks.map((tank, index) => (
              <span key={tank.id} className={styles.volumeLegendItem}>
                <i style={{ backgroundColor: volumeColors[index % volumeColors.length] }} aria-hidden="true" />
                {tank.name}
              </span>
            ))}
          </div>
        </>
      ) : (
        <div className={styles.empty}>
          <Droplets size={30} />
          <p>{state === 'loading' ? 'Loading volume history…' : state === 'unavailable' ? 'Water volume history is unavailable.' : 'No sensor readings in the last 24 hours for the selected tanks.'}</p>
        </div>
      )}
      {detailEndHour !== null && <VolumeDetailDialog tanks={tanks} data={data} endHour={detailEndHour} onClose={() => setDetailEndHour(null)} />}
    </section>
  );
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
    <p className={styles.footnote}><Info size={14} />Unavailable data is shown without estimated values.</p>
    {detail && <DetailDialog tank={detail} onClose={() => setDetail(null)} />}
  </>;
}
