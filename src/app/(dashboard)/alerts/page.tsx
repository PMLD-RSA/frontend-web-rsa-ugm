import Link from 'next/link';
import { BellRing, ArrowRight, BookOpen } from 'lucide-react';

export const metadata = {
  title: 'Pusat Peringatan | RSA UGM Water Monitor',
};

export default function AlertsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center">
        <BellRing className="w-8 h-8 text-amber-500" />
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-800">Pusat Peringatan</h1>
        <p className="mt-2 text-slate-500 max-w-md">
          Halaman ini sedang dalam pengembangan. Web team dapat mengimplementasikan
          riwayat alert aktif dan tombol aksi Resolve untuk role Operator/Admin
          sesuai <strong>PRD-Web.md § 4.4</strong>.
        </p>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-6 py-4 text-sm text-amber-700 max-w-sm text-left">
        <p className="font-semibold mb-2">📋 Yang perlu diimplementasi:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Tabel alert aktif (<code>GET /api/alerts</code>)</li>
          <li>Tombol Resolve (<code>POST /api/alerts/:id/resolve</code>)</li>
          <li>Badge severity: LOW / MEDIUM / HIGH / CRITICAL</li>
          <li>Guard: tombol resolve hanya untuk Admin &amp; Operator</li>
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
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <BookOpen className="w-4 h-4" />
          Lihat PRD-Web (section 4.4)
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
