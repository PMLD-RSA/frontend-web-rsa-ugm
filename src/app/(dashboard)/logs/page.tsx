import Link from 'next/link';
import { ClipboardList, ArrowRight, BookOpen } from 'lucide-react';

export const metadata = {
  title: 'Audit Log | RSA UGM Water Monitor',
};

export default function LogsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center">
        <ClipboardList className="w-8 h-8 text-amber-500" />
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-800">Audit Log</h1>
        <p className="mt-2 text-slate-500 max-w-md">
          Halaman ini sedang dalam pengembangan. Web team dapat mengimplementasikan
          tabel log aktivitas sistem sesuai <strong>PRD-Web.md § 4.6</strong>.
        </p>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-6 py-4 text-sm text-amber-700 max-w-sm text-left">
        <p className="font-semibold mb-2">📋 Yang perlu diimplementasi:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>
            Tabel log aktivitas (<code>GET /api/audit-logs?limit=20&amp;page=1</code>)
          </li>
          <li>Filter berdasarkan user, action, resource</li>
          <li>Pagination server-side</li>
          <li>Badge warna per action type</li>
        </ul>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 px-6 py-3 text-xs text-slate-500 max-w-sm">
        💡 BFF endpoint <code>GET /api/audit-logs</code> sudah tersedia — siap digunakan.
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
          Lihat PRD-Web (section 4.6)
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
