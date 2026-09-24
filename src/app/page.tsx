'use client';

import { useEffect, useState } from 'react';
import { Card, Badge } from '@/components/ui/Card';
import { Activity, Droplets, AlertTriangle, LayoutDashboard, Settings, Bell, Search, Menu } from 'lucide-react';

export default function Dashboard() {
  const [tanks, setTanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/tanks')
      .then(res => res.json())
      .then(data => {
        setTanks(data.data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-blue-600 flex items-center gap-2">
            <Droplets className="w-6 h-6" />
            RSA UGM
          </h2>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <a href="#" className="flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg font-medium">
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-lg font-medium transition-colors">
            <Activity className="w-5 h-5" />
            Histori & Log
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-lg font-medium transition-colors">
            <Bell className="w-5 h-5" />
            Peringatan
          </a>
        </nav>
        <div className="p-4 border-t border-slate-100">
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-lg font-medium transition-colors">
            <Settings className="w-5 h-5" />
            Pengaturan
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-slate-500 hover:text-slate-700">
              <Menu className="w-6 h-6" />
            </button>
            <div className="relative hidden sm:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cari tangki atau node..." 
                className="pl-9 pr-4 py-2 bg-slate-100 border-transparent rounded-full text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none w-64"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="success">Sistem Online</Badge>
            <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold">
              A
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto p-6 md:p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-800">Pemantauan Level Air</h1>
            <p className="text-slate-500 mt-1">Status realtime tangki di seluruh area rumah sakit.</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {tanks.map(tank => (
                <Card key={tank.id} className="flex flex-col h-full hover:shadow-lg transition-shadow duration-300 border-slate-200/60">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-slate-800 leading-tight">{tank.name}</h3>
                      <p className="text-xs text-slate-500 mt-1">{tank.location}</p>
                    </div>
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Activity className="text-blue-500 w-4 h-4" />
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 flex flex-col items-center justify-center mb-4 flex-1 border border-slate-100/50">
                    <span className="text-4xl font-extrabold text-blue-600 tracking-tight">
                      75<span className="text-2xl text-blue-400">%</span>
                    </span>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-2">Level Air Aktual</p>
                  </div>

                  <div className="space-y-3 mt-auto">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">Kapasitas Maks</span>
                      <span className="font-medium text-slate-700">{(tank.capacityLiters / 1000).toFixed(1)}k Liter</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                    <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-100">
                      <span className="flex items-center gap-1 text-red-500 font-medium">
                        <AlertTriangle className="w-3 h-3" /> Bawah: {tank.minThresholdPercent}%
                      </span>
                      <span className="text-slate-400">ID: {tank.id.split('-')[0]}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
