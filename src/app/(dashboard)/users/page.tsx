import Link from 'next/link';

export const metadata = {
  title: 'Manajemen User | RSA UGM Water Monitor',
};

export default function UsersPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
      <div className="rounded-full bg-purple-100 p-5">
        {/* Users icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 text-purple-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-4.13a4 4 0 11-8 0 4 4 0 018 0zm6 0a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-800">Manajemen User</h1>
        <p className="mt-2 text-gray-500 max-w-md">
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
        🔒 Pastikan halaman ini di-guard dengan pengecekan <code>isAdmin()</code> dari{' '}
        <code>useAuthStore</code> — non-admin harus di-redirect.
      </div>

      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-purple-700 transition-colors"
      >
        ← Kembali ke Dashboard
      </Link>
    </div>
  );
}
