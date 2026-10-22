'use client';

import { Search, Bell, Shield, Wifi, WifiOff } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore, isAdmin, isOperator } from '@/stores/authStore';

/**
 * Header Topbar Dashboard
 * Menampilkan search, status koneksi, notifikasi peringatan, dan info user dari authStore.
 */
export function Header() {
  const { user } = useAuthStore();

  // Inisial avatar dari username
  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : '?';

  // Label role yang ditampilkan di header
  const roleDisplay = isAdmin(user)
    ? 'Administrator'
    : isOperator(user)
    ? 'Operator'
    : 'Viewer';

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
      {/* Kiri: Search */}
      <div className="flex items-center gap-4">
        <div className="relative hidden sm:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari tangki, gedung, atau sensor..."
            className="pl-9 pr-4 py-2 bg-slate-100 border-transparent rounded-full text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none w-64 md:w-80 text-slate-700"
          />
        </div>
      </div>

      {/* Kanan: Status + Notifikasi + Avatar */}
      <div className="flex items-center gap-3">
        {/* Connection status — akan terhubung ke WebSocket di Fase 3 */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
          <Wifi className="w-3.5 h-3.5" />
          <span>Sistem Online</span>
        </div>

        {/* Placeholder untuk status offline — tampil saat WS disconnect di Fase 3 */}
        <div className="hidden items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Offline</span>
        </div>

        {/* Notifikasi Peringatan */}
        <Link
          href="/alerts"
          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-full transition-colors relative"
          aria-label="Lihat Peringatan"
        >
          <Bell className="w-5 h-5" />
          <span className="w-2 h-2 rounded-full bg-amber-500 absolute top-1.5 right-1.5" />
        </Link>

        {/* User Profile */}
        <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-sm shadow-sm">
            {initials}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-bold text-slate-700 leading-none">
              {user?.username || '—'}
            </p>
            <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
              <Shield className="w-3 h-3 text-blue-500" />
              {roleDisplay}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
