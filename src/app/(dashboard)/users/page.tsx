import Link from 'next/link';
import { Users, ArrowRight, BookOpen } from 'lucide-react';

export const metadata = {
  title: 'Manajemen User | RSA UGM Water Monitor',
};

export default function UsersPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center">
        <Users className="w-8 h-8 text-purple-500" />
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-800">Manajemen User</h1>
        <p className="mt-2 text-slate-500 max-w-md">
          Halaman ini sedang dalam pengembangan. Hanya dapat diakses oleh{' '}
          <strong>Admin</strong>. Web team dapat mengimplementasikan CRUD user
          sesuai <strong>PRD-Web.md § 4.8</strong>.
        </p>
      </div>

      <div className="rounded-lg border border-purple-200 bg-purple-50 px-6 py-4 text-sm text-purple-700 max-w-sm text-left">
        <p className="font-semibold mb-2">📋 Yang perlu diimplementasi:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Tabel daftar user dengan role badge</li>
          <li>Form tambah user baru (admin only)</li>
          <li>Edit role / nonaktifkan user</li>
          <li>Guard: redirect jika bukan Admin</li>
        </ul>
      </div>

      <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-3 text-xs text-red-600 max-w-sm">
        🔒 Pastikan halaman ini di-guard dengan <code>isAdmin()</code> dari{' '}
        <code>useAuthStore</code> — non-admin harus di-redirect ke Dashboard.
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
          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <BookOpen className="w-4 h-4" />
          Lihat PRD-Web (section 4.8)
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
