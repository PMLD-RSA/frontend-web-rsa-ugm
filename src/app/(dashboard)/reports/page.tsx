import Link from 'next/link';

export const metadata = {
  title: 'Laporan | RSA UGM Water Monitor',
};

export default function ReportsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
      <div className="rounded-full bg-blue-100 p-5">
        {/* BarChart2 icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 text-blue-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 3v18h18M9 17V9m4 8v-5m4 5V5"
          />
        </svg>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-800">Laporan &amp; Analitik</h1>
        <p className="mt-2 text-gray-500 max-w-md">
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

      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
      >
        ← Kembali ke Dashboard
      </Link>
    </div>
  );
}
