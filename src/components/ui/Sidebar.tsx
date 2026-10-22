'use client';

import { useState } from 'react';
import { 
  LayoutDashboard, 
  Database, 
  FileBarChart, 
  BellRing, 
  ClipboardList, 
  Users, 
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Hexagon,
  User
} from 'lucide-react';

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', active: true },
    { icon: Database, label: 'Tanks' },
    { icon: FileBarChart, label: 'Reports' },
    { icon: BellRing, label: 'Alarms', badge: true },
    { icon: ClipboardList, label: 'Audit Logs' },
    { icon: Users, label: 'Users' },
    { icon: Settings, label: 'Settings' },
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
      >
        {isOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
      </button>

      {/* Navigation */}
      <nav className="flex-1 py-2 overflow-y-auto overflow-x-hidden">
        <ul className="space-y-1 px-3">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <li key={index}>
                <a 
                  href="#" 
                  className={`flex items-center ${isOpen ? 'gap-4 px-4' : 'justify-center px-0'} py-3 rounded-lg transition-all relative ${
                    item.active 
                      ? 'bg-black/20 text-white' 
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                  title={!isOpen ? item.label : undefined}
                >
                  <div className="relative">
                    <Icon className={`w-5 h-5 ${item.active ? 'text-yellow-400' : 'text-yellow-500'}`} />
                    {item.badge && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-[#0a354c]"></span>
                    )}
                  </div>
                  {isOpen && <span className="font-medium whitespace-nowrap">{item.label}</span>}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer Profile */}
      <div className={`p-4 border-t border-white/10 ${isOpen ? 'flex items-center gap-3' : 'flex justify-center'}`}>
        <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden shrink-0 border border-slate-500 flex items-center justify-center">
          <User className="text-slate-300 w-6 h-6" />
        </div>
        {isOpen && (
          <div className="overflow-hidden whitespace-nowrap flex-1">
            <h4 className="text-white text-sm font-semibold">John Smith</h4>
            <p className="text-slate-400 text-xs">Admin</p>
          </div>
        )}
      </div>
    </aside>
  );
}
