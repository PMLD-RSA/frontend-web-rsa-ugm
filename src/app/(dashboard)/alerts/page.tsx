"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  LuSearch as Search,
  LuDownload as Download,
  LuRefreshCw as RefreshCw,
  LuSlidersHorizontal as FilterIcon,
  LuCircleAlert as AlertCircle,
  LuTriangleAlert as AlertTriangle,
  LuCircleCheck as CheckCircle,
  LuBell as Bell,
} from "react-icons/lu";
import { useAlertStore } from "@/stores/alertStore";
import { useTankStore } from "@/stores/tankStore";
import { useAuthStore, isOperator } from "@/stores/authStore";
import { downloadCsv } from "@/lib/downloadCsv";
import { Alert } from "@/types";
import styles from "./alerts.module.css";

export default function AlertsPage() {
  const { alerts, isLoading, error, fetchAlerts, resolveAlert } = useAlertStore();
  const tanks = useTankStore((state) => state.tanks);
  const user = useAuthStore((state) => state.user);
  const canResolve = isOperator(user);

  const [query, setQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [resolvingAlert, setResolvingAlert] = useState<Alert | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const confirmDialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    void fetchAlerts(undefined, controller.signal);
    return () => controller.abort();
  }, [fetchAlerts]);

  // Map tank name lookup
  const tankNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of tanks) {
      map.set(t.id, t.name);
    }
    return map;
  }, [tanks]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      const tankName = a.tankName || tankNameMap.get(a.tankId) || a.tankId;
      const matchesSearch =
        query.trim() === "" ||
        tankName.toLowerCase().includes(query.toLowerCase()) ||
        a.message.toLowerCase().includes(query.toLowerCase());

      const matchesSeverity =
        severityFilter === "ALL" || a.level === severityFilter;

      const matchesStatus =
        statusFilter === "ALL" || a.status === statusFilter;

      return matchesSearch && matchesSeverity && matchesStatus;
    });
  }, [alerts, query, severityFilter, statusFilter, tankNameMap]);

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredAlerts.length / pageSize));
  const currentPage = Math.min(page, totalPages - 1);
  const paginatedAlerts = filteredAlerts.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
  );

  const counts = useMemo(() => {
    let active = 0;
    let critical = 0;
    let warning = 0;
    for (const a of alerts) {
      if (a.status === "active") active++;
      if (a.level === "CRITICAL") critical++;
      if (a.level === "WARNING") warning++;
    }
    return { total: alerts.length, active, critical, warning };
  }, [alerts]);

  function handleOpenResolveDialog(alert: Alert) {
    setResolvingAlert(alert);
    confirmDialogRef.current?.showModal();
  }

  function handleCloseResolveDialog() {
    confirmDialogRef.current?.close();
    setResolvingAlert(null);
  }

  async function handleConfirmResolve() {
    if (!resolvingAlert || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const success = await resolveAlert(resolvingAlert.id);
      if (success) {
        handleCloseResolveDialog();
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleExportCsv() {
    const rows = [
      ["No", "ID", "Waktu", "Tangki", "Level", "Pesan", "Status", "Waktu Selesai"],
      ...filteredAlerts.map((a, idx) => [
        idx + 1,
        a.id,
        a.createdAt,
        a.tankName || tankNameMap.get(a.tankId) || a.tankId,
        a.level,
        a.message,
        a.status,
        a.resolvedAt || "-",
      ]),
    ];
    downloadCsv(`riwayat-peringatan-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  }

  return (
    <section className={styles.page}>
      <header className={styles.heading}>
        <h1>Alarm & Events</h1>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.download}
            onClick={handleExportCsv}
            disabled={!filteredAlerts.length}
          >
            <Download size={18} />
            <span>Download All</span>
          </button>
        </div>
      </header>

      <div className={styles.meta}>
        <span>
          <Link href="/">Dashboard</Link> &gt; Alarms
        </span>
        <button
          type="button"
          onClick={() => void fetchAlerts()}
          disabled={isLoading}
        >
          <RefreshCw size={13} /> Muat Ulang
        </button>
      </div>

      <div className={styles.summary}>
        <div>
          <span>Total Alarms</span>
          <strong>{isLoading && !alerts.length ? "-" : counts.total}</strong>
          <small>Seluruh riwayat peringatan</small>
        </div>
        <div>
          <span>Active Alarms</span>
          <strong style={{ color: counts.active > 0 ? "#dc2626" : "#16a34a" }}>
            {isLoading && !alerts.length ? "-" : counts.active}
          </strong>
          <small>Memerlukan penanganan</small>
        </div>
        <div>
          <span>Critical Events</span>
          <strong style={{ color: "#b91c1c" }}>
            {isLoading && !alerts.length ? "-" : counts.critical}
          </strong>
          <small>Level air di bawah ambang batas</small>
        </div>
        <div>
          <span>Warning Events</span>
          <strong style={{ color: "#b45309" }}>
            {isLoading && !alerts.length ? "-" : counts.warning}
          </strong>
          <small>Level air dalam batas waspada</small>
        </div>
      </div>

      <div className={styles.toolbar}>
        <h2>Daftar Peringatan Sistem</h2>
        <div className={styles.actions}>
          <div className={styles.search}>
            <Search size={18} color="#64748b" />
            <input
              type="search"
              placeholder="Cari tangki atau pesan..."
              aria-label="Cari tangki atau pesan peringatan"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(0);
              }}
            />
          </div>
          <button
            type="button"
            className={styles.filter}
            aria-expanded={filterOpen}
            onClick={() => setFilterOpen(!filterOpen)}
          >
            <FilterIcon size={18} />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {filterOpen && (
        <div className={styles.filterOptions}>
          <label>
            Keparahan:{" "}
            <select
              value={severityFilter}
              onChange={(e) => {
                setSeverityFilter(e.target.value);
                setPage(0);
              }}
            >
              <option value="ALL">Semua Keparahan</option>
              <option value="CRITICAL">Critical</option>
              <option value="WARNING">Warning</option>
            </select>
          </label>
          <label>
            Status:{" "}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
            >
              <option value="ALL">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="resolved">Selesai</option>
            </select>
          </label>
        </div>
      )}

      <div
        tabIndex={0}
        role="region"
        aria-label="Tabel Riwayat Peringatan"
        className={styles.tableWrap}
      >
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Waktu</th>
              <th>Nama Tangki</th>
              <th>Tingkat Keparahan</th>
              <th>Pesan Deteksi</th>
              <th>Status</th>
              <th>Waktu Selesai</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {paginatedAlerts.map((alert, index) => {
              const tankName =
                alert.tankName ||
                tankNameMap.get(alert.tankId) ||
                `Tangki ${alert.tankId.slice(0, 8)}`;
              const timeDisplay = new Date(alert.createdAt).toLocaleString(
                "id-ID",
                {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }
              );
              const resolvedDisplay = alert.resolvedAt
                ? new Date(alert.resolvedAt).toLocaleString("id-ID", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "-";

              return (
                <tr key={alert.id}>
                  <td>
                    {String(currentPage * pageSize + index + 1).padStart(2, "0")}
                  </td>
                  <td>{timeDisplay}</td>
                  <td>
                    <strong>{tankName}</strong>
                  </td>
                  <td>
                    {alert.level === "CRITICAL" ? (
                      <span className={styles.badgeCritical}>
                        <AlertCircle size={14} />
                        CRITICAL
                      </span>
                    ) : (
                      <span className={styles.badgeWarning}>
                        <AlertTriangle size={14} />
                        WARNING
                      </span>
                    )}
                  </td>
                  <td>{alert.message}</td>
                  <td>
                    {alert.status === "active" ? (
                      <span className={styles.statusActive}>
                        <AlertCircle size={14} />
                        Aktif
                      </span>
                    ) : (
                      <span className={styles.statusResolved}>
                        <CheckCircle size={14} />
                        Selesai
                      </span>
                    )}
                  </td>
                  <td>{resolvedDisplay}</td>
                  <td>
                    {alert.status === "active" && canResolve ? (
                      <button
                        type="button"
                        className={styles.resolveBtn}
                        onClick={() => handleOpenResolveDialog(alert)}
                      >
                        Selesaikan
                      </button>
                    ) : (
                      <span style={{ color: "#94a3b8", fontSize: "12px" }}>
                        {alert.status === "resolved" ? "Terselesaikan" : "-"}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {!paginatedAlerts.length && (
          <div className={styles.emptyMessage}>
            <Bell size={36} color="#94a3b8" style={{ margin: "0 auto 12px" }} />
            <p>
              {isLoading
                ? "Memuat data peringatan..."
                : error
                ? error
                : "Tidak ada data peringatan yang cocok dengan filter."}
            </p>
          </div>
        )}
      </div>

      <footer className={styles.footer}>
        <span>
          Menampilkan {filteredAlerts.length ? currentPage * pageSize + 1 : 0}{" "}
          hingga{" "}
          {Math.min((currentPage + 1) * pageSize, filteredAlerts.length)} dari{" "}
          {filteredAlerts.length} peringatan
        </span>
        <nav className={styles.pagination} aria-label="Halaman tabel peringatan">
          <button
            type="button"
            disabled={currentPage === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            Sebelumnya
          </button>
          <span>
            Halaman {currentPage + 1} dari {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage + 1 >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Selanjutnya
          </button>
        </nav>
      </footer>

      {/* Modal Dialog Konfirmasi Resolve */}
      <dialog
        ref={confirmDialogRef}
        className={styles.dialog}
        aria-labelledby="confirm-resolve-title"
        onClose={handleCloseResolveDialog}
      >
        <h3 id="confirm-resolve-title">Konfirmasi Penyelesaian Alarm</h3>
        <p>
          Apakah Anda yakin ingin menandai peringatan pada{" "}
          <strong>
            {resolvingAlert?.tankName ||
              (resolvingAlert && tankNameMap.get(resolvingAlert.tankId)) ||
              "Tangki"}
          </strong>{" "}
          sebagai telah tertangani? Tindakan ini akan dicatat ke dalam audit log.
        </p>
        <div className={styles.dialogActions}>
          <button
            type="button"
            className={styles.dialogCancel}
            onClick={handleCloseResolveDialog}
            disabled={isSubmitting}
          >
            Batal
          </button>
          <button
            type="button"
            className={styles.dialogConfirm}
            onClick={handleConfirmResolve}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Memproses..." : "Ya, Selesaikan"}
          </button>
        </div>
      </dialog>
    </section>
  );
}
