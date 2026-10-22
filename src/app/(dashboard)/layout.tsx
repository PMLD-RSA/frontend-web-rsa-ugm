'use client';

import { useEffect } from 'react';
import { ReactNode } from 'react';
import { Sidebar } from '@/components/ui/Sidebar';
import { Header } from '@/components/ui/Header';
import { useAuthStore } from '@/stores/authStore';

/**
 * Dashboard Route Group Layout
 *
 * Membungkus seluruh halaman dalam grup (dashboard) secara otomatis.
 * Memanggil fetchMe() saat mount untuk restore sesi dari cookie.
 *
 * Halaman yang tercakup:
 *  - / (Dashboard Overview)
 *  - /tanks, /tanks/[id]
 *  - /alerts, /devices, /users, /logs, /reports
 */
export default function DashboardRouteLayout({ children }: { children: ReactNode }) {
  const { fetchMe, isLoading } = useAuthStore();

  // Restore sesi user dari cookie saat pertama kali layout dimuat
  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
      {/* Sidebar Navigasi */}
      <Sidebar />

      {/* Konten Utama */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header Topbar */}
        <Header />

        {/* Dynamic Content Viewport */}
        <main className="flex-1 overflow-auto p-6 md:p-8">
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
