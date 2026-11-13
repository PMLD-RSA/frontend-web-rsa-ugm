'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Eye, Plus, RefreshCw, X } from 'lucide-react';
import { DashboardIcon as Icon } from '@/components/dashboard/DashboardIcon';
import type { ApiResponse, User } from '@/types';
import { useAuthStore } from '@/stores/authStore';
import styles from './users.module.css';

export default function UsersPage() {
  const currentUser = useAuthStore(state => state.user);
  const [users, setUsers] = useState<User[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [all, setAll] = useState(false);
  const [reload, setReload] = useState(0);
  const [detail, setDetail] = useState<User | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/users', { signal: controller.signal }).then(async response => {
      const result: ApiResponse<User[]> = await response.json();
      if (!response.ok || !result.success || !Array.isArray(result.data)) throw new Error();
      setUsers(result.data); setState('ready');
    }).catch(() => { if (!controller.signal.aborted) setState('error'); });
    return () => controller.abort();
  }, [reload]);
  const filtered = useMemo(() => users.filter(user => user.username.toLowerCase().includes(query.toLowerCase()) && (!role || user.role === role)), [users, query, role]);
  const pages = Math.max(1, Math.ceil(filtered.length / 8));
  const rows = all ? filtered : filtered.slice(page * 8, page * 8 + 8);
  function download() {
    const cell = (value: string) => `"${(/^[=+@\-\t\r]/.test(value) ? "'" + value : value).replaceAll('"', '""')}"`;
    const csv = ['Username,Role,Status,Tanggal dibuat', ...users.map(user => [user.username, user.role, user.isActive ? 'Active' : 'Inactive', user.createdAt ?? ''].map(cell).join(','))].join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'users.csv'; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <section className={styles.page}>
    <header className={styles.heading}><h1>User roles</h1><div className={styles.actions}><Link href="/alerts" aria-label="Notifikasi"><Icon name="notification" width={20} /></Link><button className={styles.download} disabled={state !== 'ready' || !users.length} onClick={download}><Icon name="download" width={18} />Download All</button></div></header>
    <div className={styles.meta}><span><Link href="/">Dashboard</Link> &gt; Users</span><button onClick={() => { setState('loading'); setPage(0); setReload(reload + 1); }} disabled={state === 'loading'}><RefreshCw size={13} /> Reload</button></div>
    <div className={styles.toolbar}><h2>Quick Actions</h2><div className={styles.actions}><label className={styles.search}><Icon name="search" width={20} /><input aria-label="Cari pengguna" placeholder="Search" value={query} onChange={event => { setQuery(event.target.value); setPage(0); }} /></label><button className={styles.filter} aria-expanded={filterOpen} onClick={() => setFilterOpen(!filterOpen)}><Icon name="filter" width={18} />Filter</button><button className={styles.add} disabled title="Penambahan pengguna belum terhubung ke backend"><Plus size={18} />Add New User</button></div></div>
    {filterOpen && <label className={styles.filterOptions}>Role <select value={role} onChange={event => { setRole(event.target.value); setPage(0); }}><option value="">Semua role</option>{['admin', 'operator', 'viewer'].map(value => <option key={value}>{value}</option>)}</select></label>}
    <div className={styles.summary}>{[['All members', state === 'ready' ? users.length : '—', ''], ['Active members', state === 'ready' ? users.filter(user => user.isActive).length : '—', ''], ['Pending invitations', '—', 'Data undangan belum tersedia'], ['Expired invitations', '—', 'Data undangan belum tersedia']].map(([label, value, note]) => <div key={label}><span>{label}</span><strong>{value}</strong><small>{note || '\u00a0'}</small></div>)}</div>
    <div className={styles.tableWrap}><table><thead><tr><th>No</th><th>User</th><th>Role</th><th>Status</th><th>Last Activity</th><th>Action</th></tr></thead><tbody>{rows.map((user, index) => <tr key={user.id}><td>{String((all ? 0 : page * 8) + index + 1).padStart(3, '0')}</td><td><div className={styles.identity}><span className={styles.avatar}>{user.username.slice(0, 1).toUpperCase()}</span><strong>{user.username} {currentUser?.id === user.id && <small className={styles.you}>You</small>}</strong></div></td><td className={styles.role}>{user.role}</td><td><span className={user.isActive ? styles.active : styles.inactive}>{user.isActive ? 'Active' : 'Inactive'}</span></td><td className={styles.muted}>Belum tersedia</td><td><button className={styles.view} aria-label={`Detail ${user.username}`} onClick={() => setDetail(user)}><Eye size={20} /></button></td></tr>)}</tbody></table></div>
    {state === 'loading' && <p className={styles.message}>Memuat pengguna…</p>}{state === 'error' && <p className={styles.message} role="alert">Daftar pengguna tidak tersedia. Periksa akses akun dan koneksi backend.</p>}{state === 'ready' && !filtered.length && <p className={styles.message}>Tidak ada pengguna yang ditemukan.</p>}
    <footer className={styles.footer}><nav className={styles.pagination} aria-label="Halaman pengguna"><button disabled={!page || all} onClick={() => setPage(page - 1)} aria-label="Halaman sebelumnya">&lt;</button>{Array.from({ length: pages }, (_, i) => i).filter(i => Math.abs(i - page) <= 1).map(i => <button key={i} aria-current={page === i ? 'page' : undefined} disabled={all} onClick={() => setPage(i)}>{i + 1}</button>)}<button disabled={page + 1 >= pages || all} onClick={() => setPage(page + 1)} aria-label="Halaman berikutnya">&gt;</button></nav><span>Showing {rows.length ? (all ? 1 : page * 8 + 1) : 0} to {all ? filtered.length : Math.min((page + 1) * 8, filtered.length)} of {filtered.length} entries</span><button onClick={() => { setAll(!all); setPage(0); }}>{all ? 'Show pages' : 'Show All'}</button></footer>
    {detail && <div className={styles.overlay} onClick={() => setDetail(null)}><section className={styles.dialog} role="dialog" aria-modal="true" aria-label="Detail pengguna" onClick={event => event.stopPropagation()}><button autoFocus onClick={() => setDetail(null)} aria-label="Tutup detail"><X size={20} /></button><h2>{detail.username}</h2><p>Role: {detail.role}</p><p>Status: {detail.isActive ? 'Aktif' : 'Nonaktif'}</p><p>Dibuat: {detail.createdAt ? new Date(detail.createdAt).toLocaleString('id-ID') : 'Belum tersedia'}</p></section></div>}
  </section>;
}
