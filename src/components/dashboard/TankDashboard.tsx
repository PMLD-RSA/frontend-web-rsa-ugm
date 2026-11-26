'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { LuClock3 as Clock3, LuInfo as Info, LuX as X } from "react-icons/lu";
import type { ApiResponse, AuditLog, Tank } from '@/types';
import { TankStatistics } from './TankStatistics';
import { TankMap } from './TankMap';
import { measurement, readingTime, TankDetails } from './TankLevel';
import styles from './TankDashboard.module.css';
import loginStyles from './RecentLogins.module.css';
import { useAuthStore } from '@/stores/authStore';

import { WaterLevelAnalytics } from './WaterLevelAnalytics';

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
  const pageSize = 10;
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
  return (
    <section className={loginStyles.panel} aria-labelledby="recent-logins-title">
      <header className={loginStyles.header}>
        <h2 id="recent-logins-title">Recent Logins</h2>
        <Link className={loginStyles.detailLink} href="/logs">View details</Link>
      </header>
      <div className={loginStyles.tableWrap}>
        <table>
          <thead>
            <tr><th scope="col">User</th><th scope="col">Role</th><th scope="col">Login Time</th></tr>
          </thead>
          <tbody>
            {logs.slice(page * pageSize, (page + 1) * pageSize).map(log => {
              const matchingUser = user && log.userId && String(log.userId) === String(user.id) ? user : null;
              const username = log.username || log.user?.username || matchingUser?.username || 'Unknown user';
              const role = log.role || log.user?.role || matchingUser?.role;
              const email = log.email || log.user?.email;
              return (
                <tr key={log.id}>
                  <td>
                    <div className={loginStyles.userCell}>
                      <span className={loginStyles.avatar}>{username.slice(0, 1).toUpperCase()}</span>
                      <span className={loginStyles.userDetails}>
                        <strong>{username}</strong>
                        {email && <small>{email}</small>}
                        {log.detail && <span className={loginStyles.loginDetail}>{log.detail}</span>}
                      </span>
                    </div>
                  </td>
                  <td className={loginStyles.roleText}>{role || 'Unavailable'}</td>
                  <td className={loginStyles.timeText}>
                    <span><Clock3 size={16} aria-hidden="true" />{readingTime(log.createdAt)}</span>
                    {log.ipAddress && <small className={loginStyles.ipAddress}>IP: {log.ipAddress}</small>}
                  </td>
                </tr>
              );
            })}
            {!logs.length && (
              <tr>
                <td colSpan={3} className={loginStyles.emptyMessage}>
                  <Clock3 size={28} aria-hidden="true" />
                  <p>{state === 'loading' ? 'Loading login history...' : state === 'unavailable' ? 'Login history is unavailable.' : 'No login history yet.'}</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {logs.length > pageSize && (
        <nav className={loginStyles.footer} aria-label="Login history pages">
          <span>{page * pageSize + 1} - {Math.min((page + 1) * pageSize, logs.length)} of {logs.length}</span>
          <div className={loginStyles.pagination}>
            <button type="button" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button>
            <span aria-live="polite">{page + 1} / {Math.ceil(logs.length / pageSize)}</span>
            <button type="button" disabled={(page + 1) * pageSize >= logs.length} onClick={() => setPage(page + 1)}>Next</button>
          </div>
        </nav>
      )}
    </section>
  );
}

export function TankDashboard({ tanks, loading, unavailable, onRefresh }: { tanks: Tank[]; loading: boolean; unavailable: boolean; onRefresh: () => void }) {
  const [detail, setDetail] = useState<Tank | null>(null);
  return <>
    <div className={styles.dashboardGrid}>
      <div className={styles.dashboardColumn}>
      <TankMap tanks={unavailable ? [] : tanks} loading={loading} unavailable={unavailable} onDetail={setDetail} />
      <WaterLevelAnalytics />
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
