'use client';

import { useEffect, useState } from 'react';
import { Card, Badge } from '@/components/ui/Card';
import { Activity, Droplets, AlertTriangle } from 'lucide-react';

export default function Dashboard() {
  const [tanks, setTanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch data from local BFF (which we created in the previous step)
    fetch('/api/tanks')
      .then(res => res.json())
      .then(data => {
        setTanks(data.data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Memuat data dari BFF...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto bg-slate-50 min-h-screen">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
            <Droplets className="text-blue-500" />
            RSA UGM Water Monitoring
          </h1>
          <p className="text-slate-500 mt-1">Realtime BFF Dashboard</p>
        </div>
        <Badge variant="success">Sistem Online</Badge>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tanks.map(tank => (
          <Card key={tank.id} className="flex flex-col gap-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg text-slate-800">{tank.name}</h3>
                <p className="text-sm text-slate-500">{tank.location}</p>
              </div>
              <Activity className="text-slate-400 w-5 h-5" />
            </div>
            
            <div className="bg-slate-100 rounded-lg p-4 flex items-center justify-center">
              <div className="text-center">
                <span className="text-3xl font-bold text-blue-600">
                  75%
                </span>
                <p className="text-xs text-slate-500 uppercase mt-1">Estimasi Aktual (Simulasi)</p>
              </div>
            </div>

            <div className="flex justify-between text-sm text-slate-600 mt-2 border-t pt-4">
              <span>Kapasitas: {(tank.capacityLiters / 1000).toFixed(1)}k L</span>
              <span className="flex items-center gap-1 text-yellow-600">
                <AlertTriangle className="w-4 h-4" /> Bawah: {tank.minThresholdPercent}%
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
