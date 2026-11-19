'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { LuClock3 as Clock3, LuDroplets as Droplets, LuInfo as Info, LuX as X, LuRefreshCw as RefreshCw } from "react-icons/lu";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ApiResponse, AuditLog, Tank, WaterLevelReading } from '@/types';
import { TankStatistics, referenceTanks } from './TankStatistics';
import { TankMap } from './TankMap';
import { measurement, readingTime, TankDetails } from './TankLevel';
import styles from './TankDashboard.module.css';
import { useAuthStore } from '@/stores/authStore';

import { buildVolumeHistory, HOUR_MS, type VolumePoint } from '@/lib/volumeHistory';
const volumeColors = ['#0077b6', '#b87516', '#27806f', '#8062a8', '#bf5c63', '#526b94'];
const formatVolume = (value: number) => value.toLocaleString('en-US', { maximumFractionDigits: 1 });

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
      {logs.slice(page * 5, page * 5 + 5).map(log => { const matchingUser = user && log.userId && String(log.userId) === String(user.id) ? user : null; const username = log.username || log.user?.username || matchingUser?.username || 'Unknown user'; const role = log.role || log.user?.role || matchingUser?.role; const email = log.email || log.user?.email; return <tr key={log.id}><td><div className={styles.loginUser}><span className={styles.avatar}>{username.slice(0, 1).toUpperCase()}</span><span><strong>{username}</strong>{email && <small>{email}</small>}</span></div></td><td>{role ? <span className={styles.loginRole}>{role}</span> : <span className={styles.helper}>Unavailable</span>}</td><td><Clock3 size={16} aria-hidden="true" />{readingTime(log.createdAt)}</td></tr>; })}
    </tbody></table></div>
    {!logs.length && <div className={styles.empty}><Clock3 size={28} /><p>{state === 'loading' ? 'Loading login history…' : state === 'unavailable' ? 'Login history is unavailable.' : 'No login history yet.'}</p></div>}
    {logs.length > 5 && <nav className={styles.loginPagination} aria-label="Login history pages"><button disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button><span>{page + 1} / {Math.ceil(logs.length / 5)}</span><button disabled={(page + 1) * 5 >= logs.length} onClick={() => setPage(page + 1)}>Next</button></nav>}
  </section>;
}

function VolumeDetailDialog({ tanks, data, endHour, hours, onClose }: { tanks: Tank[]; data: VolumePoint[]; endHour: number; hours: number; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [selectedTankId, setSelectedTankId] = useState(() => tanks.find(tank => data.some(point => point[tank.id] !== undefined))?.id ?? tanks[0]?.id ?? '');
  useEffect(() => { dialog.current?.showModal(); }, []);

  const selectedTank = tanks.find(tank => tank.id === selectedTankId);
  const color = volumeColors[Math.max(0, tanks.findIndex(tank => tank.id === selectedTankId)) % volumeColors.length];
  const startHour = endHour - (hours - 1) * HOUR_MS;
  const values = new Map(data.map(point => [point.timestamp, point[selectedTankId]]));
  const chartData = Array.from({ length: hours }, (_, index) => {
    const timestamp = startHour + index * HOUR_MS;
    return { timestamp, volume: values.get(timestamp) ?? null };
  });
  const availableHours = chartData.filter(point => point.volume !== null).length;
  const axisTicks = chartData.filter((_, index) => index % Math.max(1, Math.ceil(hours / 8)) === 0 || index === hours - 1).map(point => point.timestamp);

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
            <div className={styles.volumeDialogChart} role="img" aria-label={`Average water volume chart for ${selectedTank?.name ?? 'tangki'} over ${hours} hours`}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 14, right: 18, bottom: 8, left: 4 }}>
                  <CartesianGrid stroke="#e8edf2" strokeDasharray="3 5" />
                  <XAxis dataKey="timestamp" type="number" scale="time" domain={[startHour, endHour]} ticks={axisTicks} tickFormatter={value => new Date(value).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', ...(hours > 24 ? { month: 'short', day: 'numeric' } : {}) })} tick={{ fill: '#667587', fontSize: 11 }} tickLine={false} axisLine={false} tickMargin={12} />
                  <YAxis tickFormatter={value => formatVolume(Number(value))} tick={{ fill: '#667587', fontSize: 11 }} tickLine={false} axisLine={false} tickMargin={8} width={66} domain={['auto', 'auto']} />
                  <Tooltip cursor={{ stroke: '#9aabba', strokeDasharray: '4 4' }} labelFormatter={value => new Date(Number(value)).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })} formatter={value => `${formatVolume(Number(value))} L`} contentStyle={{ border: '1px solid #e4eaf0', borderRadius: 8, boxShadow: '0 8px 24px rgb(16 44 67 / 10%)', fontSize: 12 }} />
                  <Line dataKey="volume" name={selectedTank?.name ?? 'Tank'} type="linear" stroke={color} strokeWidth={2.5} dot={{ r: 3, fill: color, strokeWidth: 0 }} activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }} connectNulls={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className={styles.volumeDialogEmpty}>No readings for this tank in the selected period.</div>
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
  const [hours, setHours] = useState(24);
  const [reload, setReload] = useState(0);
  const [endHour, setEndHour] = useState(() => Math.floor(Date.now() / HOUR_MS) * HOUR_MS);
  useEffect(() => {
    const controller = new AbortController();
    dashboardData<WaterLevelReading>(`/api/readings/history?hours=${hours}`, controller.signal)
      .then(data => {
        if (controller.signal.aborted) return;
        setHistory(data);
        setEndHour(Math.floor(Date.now() / HOUR_MS) * HOUR_MS);
        setState('ready');
      })
      .catch(() => { if (!controller.signal.aborted) setState('unavailable'); });
    return () => controller.abort();
  }, [hours, reload]);
  const data = buildVolumeHistory(history, tanks.map(tank => tank.id), hours, endHour);
  return (
    <section className={`${styles.panel} ${styles.volumePanel}`} aria-labelledby="volume-history-title">
      <header className={styles.volumeHeader}>
        <div>
          <h2 id="volume-history-title">Average Tank Water Volume</h2>
          <p>Hourly averages over the last {hours} hours (liters)</p>
        </div>
        <button type="button" className={styles.detailLink} onClick={() => setDetailEndHour(endHour)} disabled={!tanks.length || state !== 'ready'} aria-haspopup="dialog">View details</button>
      </header>

      <div className={styles.volumeControls}>
        <label htmlFor="volume-period">Periode</label>
        <select id="volume-period" value={hours} onChange={event => { setState('loading'); setHistory([]); setHours(Number(event.target.value)); }}>
          <option value={24}>24 jam</option><option value={72}>3 hari</option><option value={168}>7 hari</option><option value={720}>30 hari</option>
        </select>
        <button type="button" disabled={state === 'loading'} onClick={() => { setState('loading'); setHistory([]); setReload(value => value + 1); }}><RefreshCw size={14} aria-hidden="true" /> Muat ulang</button>
      </div>
      {state === 'ready' ? (
        <>
          <div className={styles.volumeChart} role="img" aria-label="Hourly average water volume line chart for each tank">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 12, right: 12, bottom: 4, left: 0 }}>
                <CartesianGrid vertical={false} stroke="#e8edf2" strokeDasharray="3 5" />
                <XAxis
                  dataKey="timestamp"
                  type="number"
                  scale="time"
                  domain={[endHour - (hours - 1) * HOUR_MS, endHour]}
                  tickFormatter={value => new Date(value).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', ...(hours > 24 ? { month: 'short', day: 'numeric' } : {}) })}
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
                    dataKey={(point: VolumePoint) => point[tank.id]}
                    name={tank.name}
                    type="linear"
                    stroke={volumeColors[index % volumeColors.length]}
                    strokeWidth={2.5}
                    dot={{ r: 3, strokeWidth: 0, fill: volumeColors[index % volumeColors.length] }}
                    activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          {!data.some(point => tanks.some(tank => point[tank.id] !== undefined)) && <p className={styles.volumeDialogNote} role="status">{tanks.length ? 'Tidak ada pembacaan sensor pada periode ini. Coba pilih 7 atau 30 hari, lalu muat ulang setelah sensor mengirim data.' : 'Tidak ada tangki yang sesuai filter dashboard.'}</p>}
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
          <p>{state === 'loading' ? 'Loading volume history…' : state === 'unavailable' ? 'Riwayat volume gagal dimuat. Klik Muat ulang untuk mencoba lagi.' : 'Tidak ada pembacaan pada periode yang dipilih.'}</p>
        </div>
      )}
      {detailEndHour !== null && <VolumeDetailDialog tanks={tanks} data={data} endHour={detailEndHour} hours={hours} onClose={() => setDetailEndHour(null)} />}
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
