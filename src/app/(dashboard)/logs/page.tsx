"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  LuSearch as Search,
  LuDownload as Download,
  LuRefreshCw as RefreshCw,
  LuFileText as FileText,
} from "react-icons/lu";
import { AuditLog, ApiResponse } from "@/types";
import { downloadCsv } from "@/lib/downloadCsv";
import { isAdmin, useAuthStore } from "@/stores/authStore";
import { useTankStore } from "@/stores/tankStore";
import styles from "./logs.module.css";

export default function LogsPage() {
  const currentUser = useAuthStore((state) => state.user);
  const userLoaded = currentUser !== null;
  const canViewLogs = isAdmin(currentUser);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isForbidden, setIsForbidden] = useState(false);
  const tanks = useTankStore((state) => state.tanks);

  const [query, setQuery] = useState("");
  const [entityFilter, setEntityFilter] = useState("ALL");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [tankFilter, setTankFilter] = useState("ALL");
  const [page, setPage] = useState(0);
  const [showAll, setShowAll] = useState(false);

  async function loadLogs(selectedEntity = entityFilter, signal?: AbortSignal) {
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (selectedEntity !== "ALL") {
        params.set("entity", selectedEntity);
      }
      const response = await fetch(`/api/audit-logs?${params.toString()}`, { signal });
      if (response.status === 403) {
        setIsForbidden(true);
        setLogs([]);
        return;
      }
      setIsForbidden(false);
      const result: ApiResponse<AuditLog[]> = await response.json();
      if (response.ok && result.success && Array.isArray(result.data)) {
        setLogs(result.data);
      } else {
        setLogs([]);
      }
    } catch {
      if (!signal?.aborted) setLogs([]);
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }

  useEffect(() => {
    if (userLoaded && !canViewLogs) {
      setIsForbidden(true);
      setLogs([]);
      setIsLoading(false);
      return;
    }

    let ignore = false;
    const controller = new AbortController();

    async function fetchLogs() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({ limit: "100" });
        if (entityFilter !== "ALL") {
          params.set("entity", entityFilter);
        }
        const response = await fetch(`/api/audit-logs?${params.toString()}`, {
          signal: controller.signal,
        });
        if (response.status === 403) {
          if (!ignore) {
            setIsForbidden(true);
            setLogs([]);
          }
          return;
        }
        const result: ApiResponse<AuditLog[]> = await response.json();
        if (!ignore) {
          setIsForbidden(false);
          if (response.ok && result.success && Array.isArray(result.data)) {
            setLogs(result.data);
          } else {
            setLogs([]);
          }
        }
      } catch {
        if (!ignore) setLogs([]);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    void fetchLogs();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [entityFilter, userLoaded, canViewLogs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const username = log.username || log.user?.username || "";
      const detail = log.detail || "";
      const entity = log.entity || "";
      const matchesSearch =
        query.trim() === "" ||
        username.toLowerCase().includes(query.toLowerCase()) ||
        detail.toLowerCase().includes(query.toLowerCase()) ||
        log.action.toLowerCase().includes(query.toLowerCase());

      const matchesAction =
        actionFilter === "ALL" || log.action === actionFilter;

      const matchesTank =
        tankFilter === "ALL" || entity.toLowerCase().includes(tankFilter.toLowerCase()) || detail.toLowerCase().includes(tankFilter.toLowerCase());

      return matchesSearch && matchesAction && matchesTank;
    });
  }, [logs, query, actionFilter, tankFilter]);

  const pageSize = showAll ? Math.max(1, filteredLogs.length) : 8;
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const currentPage = Math.min(page, totalPages - 1);
  const paginatedLogs = filteredLogs.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
  );

  function handleExportCsv() {
    const rows = [
      ["No", "TIME", "EVENT", "USER", "RELATED TANK", "DETAILS", "STATUS"],
      ...filteredLogs.map((log, idx) => [
        idx + 1,
        new Date(log.createdAt).toISOString().replace("T", " ").slice(0, 19),
        log.action,
        log.username || log.user?.username || "admin",
        log.entity || "-",
        log.detail || "-",
        "Success",
      ]),
    ];
    downloadCsv("audit-logs.csv", rows);
  }

  return (
    <section className={styles.page}>
      <header className={styles.heading}>
        <h1>Audit Logs</h1>
        <button
          type="button"
          className={styles.download}
          onClick={handleExportCsv}
          disabled={!logs.length}
        >
          <Download size={18} />
          <span>Download All</span>
        </button>
      </header>

      <div className={styles.breadcrumb}>
        <span>
          <Link href="/">Dashboard</Link> &gt; Audit Logs
        </span>
        <span>
          Updated just now ·{" "}
          <button
            type="button"
            onClick={() => {
              setIsLoading(true);
              void loadLogs();
            }}
            disabled={isLoading}
          >
            <RefreshCw size={13} /> Reload
          </button>
        </span>
      </div>

      <div className={styles.logCard}>
        <div className={styles.cardHeader}>
          <FileText size={22} className={styles.cardIcon} />
          <h2>RIWAYAT AKTIVITAS SISTEM</h2>
        </div>

        <div className={styles.toolbar}>
          <div className={styles.search}>
            <Search size={16} color="#64748b" />
            <input
              type="text"
              placeholder="Search Logs"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className={styles.toolbarActions}>
            <button
              type="button"
              className={styles.exportBtn}
              onClick={handleExportCsv}
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>

            <select
              aria-label="Filter entitas"
              className={styles.selectInput}
              value={entityFilter}
              onChange={(e) => {
                setEntityFilter(e.target.value);
                setPage(0);
              }}
            >
              <option value="ALL">All Entities</option>
              <option value="auth">Auth</option>
              <option value="tanks">Tanks</option>
              <option value="alerts">Alerts</option>
              <option value="users">Users</option>
            </select>

            <select
              aria-label="Filter tipe aksi"
              className={styles.selectInput}
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(0);
              }}
            >
              <option value="ALL">All Types</option>
              <option value="LOGIN">Login</option>
              <option value="RESOLVE_ALERT">Resolve Alert</option>
              <option value="CREATE_TANK">Create Tank</option>
              <option value="UPDATE_TANK">Update Tank</option>
              <option value="DELETE_TANK">Delete Tank</option>
              <option value="CREATE_USER">Create User</option>
              <option value="UPDATE_USER">Update User</option>
              <option value="DELETE_USER">Delete User</option>
            </select>

            <select
              aria-label="Filter berdasarkan tangki"
              className={styles.selectInput}
              value={tankFilter}
              onChange={(e) => setTankFilter(e.target.value)}
            >
              <option value="ALL">All Tanks</option>
              {tanks.map((t) => (
                <option key={t.id} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>TIME</th>
                <th>EVENT</th>
                <th>USER</th>
                <th>RELATED TANK</th>
                <th>DETAILS</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.length > 0 ? (
                paginatedLogs.map((log) => {
                  const timeFormatted = new Date(log.createdAt)
                    .toISOString()
                    .replace("T", " ")
                    .slice(0, 19);
                  return (
                    <tr key={log.id}>
                      <td className={styles.timeCell}>{timeFormatted}</td>
                      <td style={{ fontWeight: 600 }}>{log.action}</td>
                      <td>
                        <div className={styles.userCell}>
                          <span className={styles.avatar} aria-hidden="true">
                            {(log.username || log.user?.username || "admin").slice(0, 2).toUpperCase()}
                          </span>
                          <strong>{log.username || log.user?.username || "admin"}</strong>
                        </div>
                      </td>
                      <td>{log.entity || "Tank"}</td>
                      <td style={{ maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis" }}>
                        {log.detail || "-"}
                      </td>
                      <td><span className={styles.statusSuccess}><i aria-hidden="true" />Success</span></td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className={styles.emptyMessage}>
                    {isLoading
                      ? "Memuat riwayat log..."
                      : isForbidden
                      ? "Akses terbatas: halaman Audit Logs hanya tersedia untuk role Admin."
                      : "Tidak ada catatan log aktivitas yang cocok."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className={styles.footer}>
          <div className={styles.pagination}>
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
            >
              &lt;
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                type="button"
                aria-current={currentPage === i ? "page" : undefined}
                onClick={() => setPage(i)}
              >
                {i + 1}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1}
            >
              &gt;
            </button>
          </div>

          <div className={styles.footerRight}>
            <span>
              Showing {filteredLogs.length === 0 ? 0 : currentPage * pageSize + 1} to{" "}
              {Math.min((currentPage + 1) * pageSize, filteredLogs.length)} of {filteredLogs.length} entries
            </span>
            <button
              type="button"
              className={styles.btnShowAll}
              onClick={() => setShowAll((prev) => !prev)}
            >
              {showAll ? "Paginate" : "Show All"}
            </button>
          </div>
        </footer>
      </div>
    </section>
  );
}
