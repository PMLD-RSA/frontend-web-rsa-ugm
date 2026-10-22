'use client';

import { Menu, Search, Bell, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/Card';
import Link from 'next/link';

interface HeaderProps {
  onToggleMobileMenu?: () => void;
}

export function Header({ onToggleMobileMenu }: HeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
      <div className="flex items-center gap-4">
        {onToggleMobileMenu && (
          <button 
            onClick={onToggleMobileMenu}
            className="md:hidden text-slate-500 hover:text-slate-700"
            aria-label="Open Menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        )}
        <div className="relative hidden sm:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari tangki, gedung, atau sensor..." 
            className="pl-9 pr-4 py-2 bg-slate-100 border-transparent rounded-full text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none w-64 md:w-80 text-slate-700"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Connection status */}
        <Badge variant="success">Sistem Online</Badge>

        {/* Quick notification icon */}
        <Link 
          href="/alerts"
          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-full transition-colors relative"
          aria-label="Lihat Peringatan"
        >
          <Bell className="w-5 h-5" />
          <span className="w-2 h-2 rounded-full bg-amber-500 absolute top-1.5 right-1.5" />
        </Link>

        {/* User profile avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-sm shadow-sm">
            A
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-bold text-slate-700 leading-none">Admin</p>
            <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
              <Shield className="w-3 h-3 text-blue-500" /> Super Admin
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
