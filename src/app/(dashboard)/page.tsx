'use client';

import { useEffect, useState } from 'react';
import { Card, Badge } from '@/components/ui/Card';
import { Tank } from '@/types';
import {
  Droplets,
  AlertTriangle,
  Radio,
  MapPin,
  ArrowUpRight,
  RefreshCw,
  Layers,
  DatabaseZap,
} from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const [tanks, setTanks] = useState<Tank[]>([]);
  // State awal loading=true agar tidak ada flash kosong saat pertama render
  const [loading, setLoading] = useState(true);

  // Fungsi refresh manual (dipanggil oleh tombol klik, bukan di dalam useEffect)
  function loadTanks() {
    setLoading(true);
    fetch('/api/tanks')
      .then((res) => res.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setTanks(res.data);
        }
      })
      .catch((err) => console.error('Gagal mengambil data tangki:', err))
      .finally(() => setLoading(false));
  }

  // Initial fetch: setState hanya dipanggil di dalam callback async (.then/.finally),
  // tidak secara sinkron, sehingga tidak melanggar react-hooks/set-state-in-effect
  useEffect(() => {
    fetch('/api/tanks')
      .then((res) => res.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setTanks(res.data);
        }
      })
      .catch((err) => console.error('Gagal mengambil data tangki:', err))
      .finally(() => setLoading(false));
  }, []);

  // Hitung ringkasan metrik
  const totalCapacity = tanks.reduce((acc, t) => acc + Number(t.capacityLiters || 0), 0);
  const totalCurrentWater = tanks.reduce((acc, t) => acc + Number(t.latestReading?.volumeLiters || 0), 0);
  const activeAlerts = tanks.filter((t) => t.activeAlert != null);
  const normalTanks = tanks.filter((t) => t.activeAlert == null).length;

  return (
    <>
      {/* Top Welcome & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pemantauan Level Air</h1>
          <p className="text-slate-500 mt-1">
            Status telemetri IoT tangki air terpadu Rumah Sakit Akademik UGM.
          </p>
        </div>
        <button
          onClick={loadTanks}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-sm font-medium transition-colors shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          Segarkan Data
        </button>
      </div>

      {/* Emergency Alert Banner (jika ada alert aktif) */}
      {activeAlerts.length > 0 && (
        <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start sm:items-center justify-between gap-4 shadow-sm animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h4 className="font-bold text-amber-900 text-sm">
                Perhatian: {activeAlerts.length} Peringatan Ketinggian Air Aktif
              </h4>
              <p className="text-amber-800/80 text-xs mt-0.5">
                {activeAlerts.map((t) => `${t.name} (${t.latestReading?.levelPercent}%)`).join(', ')}
              </p>
            </div>
          </div>
          <Link
            href="/alerts"
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shrink-0 transition-colors"
          >
            Tinjau Peringatan
          </Link>
        </div>
      )}

      {/* Quick Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Tangki</p>
            <h3 className="text-xl font-bold text-slate-800">{tanks.length} Tangki</h3>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <Droplets className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Air Tersimpan</p>
            <h3 className="text-xl font-bold text-slate-800">
              {totalCurrentWater.toLocaleString('id-ID')} L
            </h3>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <DatabaseZap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Kapasitas</p>
            <h3 className="text-xl font-bold text-slate-800">
              {totalCapacity.toLocaleString('id-ID')} L
            </h3>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Tangki Kondisi Aman</p>
            <h3 className="text-xl font-bold text-emerald-700">{normalTanks} / {tanks.length}</h3>
          </div>
        </Card>
      </div>

      {/* Tank Cards Grid */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Daftar Tangki Rumah Sakit</h2>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-slate-100">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
            <p className="text-xs text-slate-400">Memuat data sensor tangki...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tanks.map((tank) => {
              const level = Number(tank.latestReading?.levelPercent || 0);
              const volume = Number(tank.latestReading?.volumeLiters || 0);
              const capacity = Number(tank.capacityLiters || 0);

              // Tentukan status berdasarkan threshold PRD:
              // > 60% = Normal (Hijau), 30% - 60% = Warning (Kuning), < 30% = Critical (Merah)
              let statusVariant: 'success' | 'warning' | 'critical' = 'success';
              let statusLabel = 'NORMAL';
              let progressColor = 'bg-emerald-500';

              if (level < Number(tank.minThresholdPercent || 30)) {
                statusVariant = 'critical';
                statusLabel = 'CRITICAL';
                progressColor = 'bg-rose-500';
              } else if (level <= 60) {
                statusVariant = 'warning';
                statusLabel = 'WARNING';
                progressColor = 'bg-amber-500';
              }

              return (
                <div
                  key={tank.id}
                  className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between"
                >
                  {/* Top: Info Tangki */}
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h3 className="font-bold text-slate-800 text-base leading-snug">
                          {tank.name}
                        </h3>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          {tank.location || 'Lokasi tidak dispesifikasikan'}
                        </p>
                      </div>
                      <Badge variant={statusVariant}>{statusLabel}</Badge>
                    </div>

                    {/* Progress Bar & Persentase */}
                    <div className="my-6">
                      <div className="flex items-baseline justify-between mb-2">
                        <span className="text-3xl font-extrabold text-slate-800 tracking-tight">
                          {level.toFixed(1)}%
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          {volume.toLocaleString('id-ID')} / {capacity.toLocaleString('id-ID')} L
                        </span>
                      </div>

                      {/* Visual Level Bar (placeholder — akan diganti LiquidLevelGauge di Fase 3) */}
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${progressColor} transition-all duration-500 rounded-full`}
                          style={{ width: `${Math.min(100, Math.max(0, level))}%` }}
                        />
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1.5 font-medium">
                        <span>Batas Min: {tank.minThresholdPercent}%</span>
                        <span>Batas Max: {tank.maxThresholdPercent}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom: Info Node & Action Link */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Radio className="w-3.5 h-3.5 text-blue-500" />
                      {tank.nodes?.[0]?.deviceCode || 'STM32'} (RSSI: {tank.latestReading?.rssi ?? -70} dBm)
                    </span>

                    {/* FIX: link ke detail tangki individual, bukan list */}
                    <Link
                      href={`/tanks/${tank.id}`}
                      className="text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1 group"
                    >
                      Detail
                      <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
