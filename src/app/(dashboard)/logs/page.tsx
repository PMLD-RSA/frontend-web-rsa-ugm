import Link from 'next/link';

export const metadata = {
  title: 'Audit Log | RSA UGM Water Monitor',
};

export default function LogsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
      <div className="rounded-full bg-amber-100 p-5">
        {/* ClipboardList icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 text-amber-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
          />
        </svg>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-800">Audit Log</h1>
        <p className="mt-2 text-gray-500 max-w-md">
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

      <div className="rounded-lg border border-gray-200 bg-gray-50 px-6 py-3 text-xs text-gray-500 max-w-sm">
        💡 BFF endpoint <code>GET /api/audit-logs</code> sudah tersedia — siap digunakan.
      </div>

      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-amber-700 transition-colors"
      >
        ← Kembali ke Dashboard
      </Link>
    </div>
  );
}
