'use client';

import { useState } from 'react';
import {
  LayoutDashboard,
  Database,
  FileBarChart,
  BellRing,
  ClipboardList,
  Users,
  Radio,
  PanelLeftClose,
  PanelLeftOpen,
  Hexagon,
  User,
  LogOut,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore, isAdmin } from '@/stores/authStore';

interface MenuItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: boolean;
  adminOnly?: boolean;
}

const MENU_ITEMS: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard',   href: '/' },
  { icon: Database,        label: 'Tangki',      href: '/tanks' },
  { icon: BellRing,        label: 'Peringatan',  href: '/alerts', badge: true },
  { icon: Radio,           label: 'Perangkat',   href: '/devices' },
  { icon: FileBarChart,    label: 'Laporan',     href: '/reports' },
  { icon: ClipboardList,   label: 'Audit Log',   href: '/logs' },
  { icon: Users,           label: 'Pengguna',    href: '/users', adminOnly: true },
];

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isLoading } = useAuthStore();

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  // Role label yang ditampilkan
  const roleLabel: Record<string, string> = {
    admin: 'Administrator',
    operator: 'Operator',
    viewer: 'Viewer',
  };

  return (
    <aside
      className={`${isOpen ? 'w-64' : 'w-20'} bg-[#0a354c] flex flex-col h-screen transition-all duration-300 ease-in-out shrink-0 relative z-20 shadow-xl`}
    >
      {/* Header / Logo */}
      <div className={`p-4 flex items-center ${isOpen ? 'gap-3' : 'justify-center'} border-b border-white/10 h-20`}>
        <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
          <Hexagon className="w-6 h-6 text-yellow-500 fill-yellow-500/30" />
        </div>
        {isOpen && (
          <div className="overflow-hidden whitespace-nowrap">
            <h2 className="text-white font-bold text-lg leading-tight">RSA UGM</h2>
            <p className="text-blue-200/70 text-xs font-medium">SI-POTA v1.0</p>
          </div>
        )}
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-4 flex items-center text-slate-400 hover:text-white transition-colors ${isOpen ? 'justify-start' : 'justify-center'}`}
      >
        {isOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
      </button>

      {/* Navigation */}
      <nav className="flex-1 py-2 overflow-y-auto overflow-x-hidden">
        <ul className="space-y-1 px-3">
          {MENU_ITEMS.map((item) => {
            // Sembunyikan menu adminOnly jika user bukan admin
            if (item.adminOnly && !isAdmin(user)) return null;

            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center ${isOpen ? 'gap-4 px-4' : 'justify-center px-0'} py-3 rounded-lg transition-all relative ${
                    isActive
                      ? 'bg-black/20 text-white'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                  title={!isOpen ? item.label : undefined}
                >
                  <div className="relative">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-yellow-400' : 'text-yellow-500/70'}`} />
                    {item.badge && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-[#0a354c]"></span>
                    )}
                  </div>
                  {isOpen && (
                    <span className="font-medium whitespace-nowrap">{item.label}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer Profile + Logout */}
      <div className={`p-4 border-t border-white/10 space-y-2`}>
        {/* User info */}
        <div className={`${isOpen ? 'flex items-center gap-3' : 'flex justify-center'}`}>
          <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden shrink-0 border border-slate-500 flex items-center justify-center">
            <User className="text-slate-300 w-6 h-6" />
          </div>
          {isOpen && user && (
            <div className="overflow-hidden whitespace-nowrap flex-1">
              <h4 className="text-white text-sm font-semibold">{user.username}</h4>
              <p className="text-slate-400 text-xs capitalize">{roleLabel[user.role] || user.role}</p>
            </div>
          )}
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          disabled={isLoading}
          className={`w-full flex items-center ${isOpen ? 'gap-3 px-3' : 'justify-center'} py-2 rounded-lg text-slate-400 hover:bg-white/5 hover:text-rose-400 transition-colors text-sm`}
          title={!isOpen ? 'Keluar' : undefined}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <LogOut className="w-4 h-4 shrink-0" />
          )}
          {isOpen && <span className="font-medium">Keluar</span>}
        </button>
      </div>
    </aside>
  );
}
