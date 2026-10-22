import Link from 'next/link';
import { BarChart2, ArrowRight, BookOpen } from 'lucide-react';

export const metadata = {
  title: 'Laporan | RSA UGM Water Monitor',
};

export default function ReportsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
        <BarChart2 className="w-8 h-8 text-blue-500" />
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-800">Laporan &amp; Analitik</h1>
        <p className="mt-2 text-slate-500 max-w-md">
          Halaman ini sedang dalam pengembangan. Web team dapat mengimplementasikan
          grafik historis, ekspor PDF/CSV, dan rangkuman harian sesuai{' '}
          <strong>PRD-Web.md § 4.7</strong>.
        </p>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 px-6 py-4 text-sm text-blue-700 max-w-sm text-left">
        <p className="font-semibold mb-2">📋 Yang perlu diimplementasi:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Grafik level air 24 jam (<code>GET /api/readings/history</code>)</li>
          <li>Rangkuman statistik harian per tangki</li>
          <li>Ekspor laporan PDF / CSV</li>
          <li>Filter rentang tanggal</li>
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-sm font-medium transition-colors"
        >
          Kembali ke Dashboard
        </Link>
        <a
          href="https://github.com/PMLD-RSA/frontend-web-rsa-ugm/blob/dev/docs/PRD-Web.md"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <BookOpen className="w-4 h-4" />
          Lihat PRD-Web (section 4.7)
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
