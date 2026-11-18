"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  LuSearch as Search,
  LuDownload as Download,
  LuRefreshCw as RefreshCw,
  LuSlidersHorizontal as FilterIcon,
  LuClipboardList as ClipboardList,
} from "react-icons/lu";
import { AuditLog, ApiResponse } from "@/types";
import { downloadCsv } from "@/lib/downloadCsv";
import styles from "./logs.module.css";

export default function LogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(0);

  async function loadLogs(signal?: AbortSignal) {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/audit-logs?limit=100", { signal });
      const result: ApiResponse<AuditLog[]> = await response.json();
      if (!response.ok || !result.success || !Array.isArray(result.data)) {
        throw new Error("Gagal memuat jejak audit sistem.");
      }
      setLogs(result.data);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError("Jejak audit tidak dapat diakses.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    void loadLogs(controller.signal);
    return () => controller.abort();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const username = log.username || log.user?.username || "";
      const detail = log.detail || "";
      const matchesSearch =
        query.trim() === "" ||
        username.toLowerCase().includes(query.toLowerCase()) ||
        detail.toLowerCase().includes(query.toLowerCase()) ||
        log.action.toLowerCase().includes(query.toLowerCase());

      const matchesAction =
        actionFilter === "ALL" || log.action === actionFilter;

      return matchesSearch && matchesAction;
    });
  }, [logs, query, actionFilter]);

  const pageSize = 15;
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const currentPage = Math.min(page, totalPages - 1);
  const paginatedLogs = filteredLogs.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
  );

  const counts = useMemo(() => {
    let logins = 0;
    let tankUpdates = 0;
    let resolves = 0;
    for (const l of logs) {
      if (l.action === "LOGIN") logins++;
      if (l.action.includes("TANK")) tankUpdates++;
      if (l.action === "RESOLVE_ALERT") resolves++;
    }
    return { total: logs.length, logins, tankUpdates, resolves };
  }, [logs]);

  function handleExportCsv() {
    const rows = [
      ["No", "Waktu", "Pengguna", "Role", "Aksi", "Entitas", "Detail", "IP Address"],
      ...filteredLogs.map((log, idx) => [
        idx + 1,
        log.createdAt,
        log.username || log.user?.username || "-",
        log.role || log.user?.role || "-",
        log.action,
        log.entity || "-",
        log.detail || "-",
        log.ipAddress || "-",
      ]),
    ];
    downloadCsv(`audit-logs-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  }

  function getActionClass(action: string) {
    if (action === "LOGIN") return styles.actionLogin;
    if (action.includes("UPDATE") || action.includes("EDIT")) return styles.actionUpdate;
    if (action.includes("RESOLVE")) return styles.actionResolve;
    if (action.includes("DELETE")) return styles.actionDelete;
    return styles.actionDefault;
  }

  return (
    <section className={styles.page}>
      <header className={styles.heading}>
        <h1>Audit Log Aktivitas</h1>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.download}
            onClick={handleExportCsv}
            disabled={!filteredLogs.length}
          >
            <Download size={18} />
            <span>Download All</span>
          </button>
        </div>
      </header>

      <div className={styles.meta}>
        <span>
          <Link href="/">Dashboard</Link> &gt; Logs
        </span>
        <button
          type="button"
          onClick={() => void loadLogs()}
          disabled={isLoading}
        >
          <RefreshCw size={13} /> Muat Ulang
        </button>
      </div>

      <div className={styles.summary}>
        <div>
          <span>Total Aktivitas</span>
          <strong>{isLoading && !logs.length ? "-" : counts.total}</strong>
          <small>Seluruh rekaman audit sistem</small>
        </div>
        <div>
          <span>Sesi Login</span>
          <strong style={{ color: "#0369a1" }}>
            {isLoading && !logs.length ? "-" : counts.logins}
          </strong>
          <small>Akses masuk pengguna</small>
        </div>
        <div>
          <span>Modifikasi Toren</span>
          <strong style={{ color: "#b45309" }}>
            {isLoading && !logs.length ? "-" : counts.tankUpdates}
          </strong>
          <small>Perubahan konfigurasi</small>
        </div>
        <div>
          <span>Penyelesaian Alarm</span>
          <strong style={{ color: "#15803d" }}>
            {isLoading && !logs.length ? "-" : counts.resolves}
          </strong>
          <small>Konfirmasi penanganan</small>
        </div>
      </div>

      <div className={styles.toolbar}>
        <h2>Jejak Rekam Pengguna &amp; Sistem</h2>
        <div className={styles.actions}>
          <div className={styles.search}>
            <Search size={18} color="#64748b" />
            <input
              type="search"
              placeholder="Cari user, aksi, atau detail..."
              aria-label="Cari jejak rekam audit"
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
            Jenis Aksi:{" "}
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(0);
              }}
            >
              <option value="ALL">Semua Aksi</option>
              <option value="LOGIN">LOGIN</option>
              <option value="UPDATE_TANK">UPDATE_TANK</option>
              <option value="RESOLVE_ALERT">RESOLVE_ALERT</option>
              <option value="CREATE_TANK">CREATE_TANK</option>
              <option value="DELETE_TANK">DELETE_TANK</option>
            </select>
          </label>
        </div>
      )}

      <div
        tabIndex={0}
        role="region"
        aria-label="Tabel Audit Log Aktivitas"
        className={styles.tableWrap}
      >
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Waktu</th>
              <th>Pengguna</th>
              <th>Jenis Aksi</th>
              <th>Entitas / Target</th>
              <th>Detail Catatan</th>
              <th>Alamat IP</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLogs.map((log, index) => {
              const username =
                log.username || log.user?.username || "Sistem";
              const role = log.role || log.user?.role || "System";
              const timeDisplay = new Date(log.createdAt).toLocaleString(
                "id-ID",
                {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                }
              );

              return (
                <tr key={log.id}>
                  <td>
                    {String(currentPage * pageSize + index + 1).padStart(2, "0")}
                  </td>
                  <td>{timeDisplay}</td>
                  <td>
                    <div className={styles.userCell}>
                      <span className={styles.avatar}>
                        {username.slice(0, 1).toUpperCase()}
                      </span>
                      <div>
                        <strong>{username}</strong>
                        <div style={{ fontSize: "11px", color: "#64748b" }}>
                          {role}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`${styles.badgeAction} ${getActionClass(
                        log.action
                      )}`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td>{log.entity || "-"}</td>
                  <td style={{ maxWidth: "340px", whiteSpace: "normal" }}>
                    {log.detail || "-"}
                  </td>
                  <td>{log.ipAddress || "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {!paginatedLogs.length && (
          <div className={styles.emptyMessage}>
            <ClipboardList
              size={36}
              color="#94a3b8"
              style={{ margin: "0 auto 12px" }}
            />
            <p>
              {isLoading
                ? "Memuat catatan audit log..."
                : error
                ? error
                : "Tidak ada catatan audit log yang cocok."}
            </p>
          </div>
        )}
      </div>

      <footer className={styles.footer}>
        <span>
          Menampilkan {filteredLogs.length ? currentPage * pageSize + 1 : 0}{" "}
          hingga{" "}
          {Math.min((currentPage + 1) * pageSize, filteredLogs.length)} dari{" "}
          {filteredLogs.length} aktivitas
        </span>
        <nav className={styles.pagination} aria-label="Halaman audit log">
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
    </section>
  );
}
