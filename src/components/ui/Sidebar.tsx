'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Database, 
  FileBarChart, 
  BellRing, 
  ClipboardList, 
  Users, 
  PanelLeftClose,
  PanelLeftOpen,
  Hexagon,
  Radio
} from 'lucide-react';

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const pathname = usePathname();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
    { icon: Database, label: 'Tanks', href: '/tanks' },
    { icon: BellRing, label: 'Alarms', href: '/alerts', badge: true },
    { icon: Radio, label: 'Devices', href: '/devices' },
    { icon: FileBarChart, label: 'Reports', href: '/reports' },
    { icon: ClipboardList, label: 'Audit Logs', href: '/logs' },
    { icon: Users, label: 'Users', href: '/users' },
  ];

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
        aria-label="Toggle Sidebar"
      >
        {isOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
      </button>

      {/* Navigation */}
      <nav className="flex-1 py-2 overflow-y-auto overflow-x-hidden">
        <ul className="space-y-1 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl font-medium text-sm transition-all relative ${
                    isActive 
                      ? 'bg-blue-600/30 text-white border border-blue-400/30 shadow-inner' 
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                  {isOpen && <span>{item.label}</span>}
                  {item.badge && (
                    <span className="w-2 h-2 rounded-full bg-red-500 absolute right-3 top-1/2 -translate-y-1/2 animate-pulse" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer Info */}
      {isOpen && (
        <div className="p-4 border-t border-white/10 text-xs text-slate-400 text-center">
          <p className="font-semibold text-slate-300">RS Akademik UGM</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Yogyakarta, Indonesia</p>
        </div>
      )}
    </aside>
  );
}
