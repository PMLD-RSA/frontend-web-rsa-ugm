import Link from 'next/link';
import { Database, ArrowRight, BookOpen } from 'lucide-react';

export default function TanksPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-6">
        <Database className="w-8 h-8 text-blue-500" />
      </div>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Manajemen Tangki Air</h1>
      <p className="text-slate-500 max-w-md mb-8">
        Halaman ini akan menampilkan daftar master tangki, pengaturan ambang batas, dan form penambahan tangki baru. Sedang dalam pengembangan oleh Web Team.
      </p>
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
          Lihat PRD-Web (section 4.3)
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
