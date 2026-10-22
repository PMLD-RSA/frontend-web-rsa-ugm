import Link from 'next/link';
import { Radio, ArrowRight, BookOpen } from 'lucide-react';

export const metadata = {
  title: 'Status Perangkat | RSA UGM Water Monitor',
};

export default function DevicesPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center">
        <Radio className="w-8 h-8 text-indigo-500" />
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-800">Status Perangkat IoT</h1>
        <p className="mt-2 text-slate-500 max-w-md">
          Halaman ini sedang dalam pengembangan. Web team dapat mengimplementasikan
          status Gateway Raspberry Pi dan diagnostik sinyal LoRa RSSI setiap
          Sensor Node STM32 sesuai <strong>PRD-Web.md § 4.5</strong>.
        </p>
      </div>

      <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-6 py-4 text-sm text-indigo-700 max-w-sm text-left">
        <p className="font-semibold mb-2">📋 Yang perlu diimplementasi:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Kartu Gateway + status online/offline (<code>GET /api/gateways</code>)</li>
          <li>Tabel Sensor Node + RSSI signal (<code>GET /api/nodes</code>)</li>
          <li>Indikator last_seen timestamp per node</li>
          <li>Badge status: ACTIVE / INACTIVE / ERROR</li>
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
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <BookOpen className="w-4 h-4" />
          Lihat PRD-Web (section 4.5)
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
