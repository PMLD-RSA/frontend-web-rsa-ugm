'use client';

import { useEffect, useState } from 'react';
import { Info } from 'lucide-react';
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import { dashboardData, TankDashboard } from '@/components/dashboard/TankDashboard';
import { type DashboardFilters, filterDashboardTanks } from '@/lib/dashboard';
import type { Tank } from '@/types';
import styles from '@/components/dashboard/TankDashboard.module.css';

export default function Dashboard() {
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<DashboardFilters>({
    tankId: '', statuses: [], startDate: '', endDate: '', period: 'All',
  });
  const [unavailable, setUnavailable] = useState(false);
  const [loading, setLoading] = useState(true);

  function loadTanks() {
    setLoading(true);
    dashboardData<Tank>('/api/tanks')
      .then(data => { setTanks(data); setUnavailable(false); })
      .catch(() => { setTanks([]); setUnavailable(true); })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const controller = new AbortController();
    dashboardData<Tank>('/api/tanks', controller.signal)
      .then(data => { setTanks(data); setUnavailable(false); })
      .catch(() => { if (!controller.signal.aborted) { setTanks([]); setUnavailable(true); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  const visibleTanks = filterDashboardTanks(tanks, query, filters);
  return <>
    <DashboardOverview tanks={visibleTanks} allTanks={tanks} loading={loading} failed={unavailable}
      query={query} onQueryChange={setQuery} filters={filters} onFiltersChange={setFilters} />
    {unavailable && <p role="status" className={styles.notice}><Info size={18} />Fitur pemantauan belum tersedia: server data tangki belum dapat diakses. Silakan gunakan tombol Segarkan untuk mencoba kembali.</p>}
    <TankDashboard tanks={visibleTanks} loading={loading} unavailable={unavailable} onRefresh={loadTanks} />
  </>;
}
