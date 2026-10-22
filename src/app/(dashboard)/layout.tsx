import { ReactNode } from 'react';
import { Sidebar } from '@/components/ui/Sidebar';
import { Header } from '@/components/ui/Header';

/**
 * Dashboard Route Group Layout
 *
 * Membungkus seluruh halaman dalam grup (dashboard) secara otomatis.
 * Dengan App Router, setiap page.tsx di bawah (dashboard)/ akan
 * mewarisi Sidebar + Header ini tanpa perlu mengimpor ulang.
 *
 * Halaman yang tercakup:
 *  - / (Dashboard Overview)
 *  - /tanks, /tanks/[id]
 *  - /alerts
 *  - /devices
 *  - /users
 *  - /logs
 *  - /reports
 */
export default function DashboardRouteLayout({ children }: { children: ReactNode }) {
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
          {children}
        </main>
      </div>
    </div>
  );
}
