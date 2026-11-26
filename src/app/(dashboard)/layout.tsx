'use client';

import { useEffect } from 'react';
import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/ui/Sidebar';
import { useAuthStore } from '@/stores/authStore';
import { useAlertStore } from '@/stores/alertStore';
import { useRealtimeSocket } from '@/hooks/useRealtimeSocket';

/**
 * Dashboard Route Group Layout
 *
 * Membungkus seluruh halaman dalam grup (dashboard) secara otomatis.
 * Memanggil fetchMe() dan fetchAlerts() saat mount.
 * Mengaktifkan useRealtimeSocket secara global untuk pembaruan realtime toren & alert.
 * Sesuai desain Figma, navbar topbar tidak digunakan pada halaman dashboard.
 */
export default function DashboardRouteLayout({ children }: { children: ReactNode }) {
  const { fetchMe, isLoading } = useAuthStore();
  const fetchAlerts = useAlertStore((state) => state.fetchAlerts);
  const pathname = usePathname();
  const isOverview = pathname === '/';

  // Restore sesi user dan muat data alert awal
  useEffect(() => {
    fetchMe();
    fetchAlerts();
  }, [fetchMe, fetchAlerts]);

  // WebSocket realtime aktif global
  useRealtimeSocket();

  return (
    <div lang="en" className="flex h-screen w-full bg-slate-50 overflow-hidden">
      {/* Sidebar Navigasi */}
      <Sidebar />

      {/* Konten Utama */}
      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        {/* Dynamic Content Viewport */}
        <main
          className={
            isOverview
              ? 'flex-1 overflow-auto bg-white dashboard-viewport pb-8'
              : 'flex-1 overflow-auto bg-[#ecf4f9] dashboard-viewport pb-8 pt-4'
          }
        >
          {isLoading ? (
            /* Skeleton saat sesi sedang di-restore dari cookie */
            <div className="animate-pulse space-y-6">
              <div className="h-8 w-64 bg-slate-200 rounded-xl" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-24 bg-slate-200 rounded-2xl" />
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-56 bg-slate-200 rounded-2xl" />
                ))}
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
