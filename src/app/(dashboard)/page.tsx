"use client";

import { useEffect, useState } from "react";
import { LuInfo as Info } from "react-icons/lu";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { TankDashboard } from "@/components/dashboard/TankDashboard";
import { type DashboardFilters, filterDashboardTanks } from "@/lib/dashboard";
import { useTankStore } from "@/stores/tankStore";
import styles from "@/components/dashboard/TankDashboard.module.css";

export default function Dashboard() {
  const { tanks, isLoading, error, fetchTanks } = useTankStore();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<DashboardFilters>({
    tankId: "",
    statuses: [],
    startDate: "",
    endDate: "",
    period: "All",
  });

  useEffect(() => {
    const controller = new AbortController();
    void fetchTanks(controller.signal);
    return () => controller.abort();
  }, [fetchTanks]);

  const unavailable = Boolean(error && !tanks.length);
  const visibleTanks = filterDashboardTanks(tanks, query, filters);

  return (
    <>
      <DashboardOverview
        tanks={visibleTanks}
        allTanks={tanks}
        loading={isLoading}
        failed={unavailable}
        query={query}
        onQueryChange={setQuery}
        filters={filters}
        onFiltersChange={setFilters}
      />
      {unavailable && (
        <p role="status" className={styles.notice}>
          <Info size={18} />
          Pemantauan tidak tersedia: server toren tidak dapat dijangkau. Gunakan Muat Ulang untuk mencoba kembali.
        </p>
      )}
      <TankDashboard
        tanks={visibleTanks}
        loading={isLoading}
        unavailable={unavailable}
        onRefresh={() => void fetchTanks()}
      />
    </>
  );
}
