"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  LuRefreshCw as RefreshCw,
  LuSearch as Search,
  LuDownload as Download,
  LuFileText as FileText,
  LuBell as Bell,
  LuSettings as Settings,
  LuChevronDown as ChevronDown,
} from "react-icons/lu";
import { AuditLog, ApiResponse } from "@/types";
import { downloadCsv } from "@/lib/downloadCsv";
import { useTankStore } from "@/stores/tankStore";
import styles from "./logs.module.css";

type FilterOption = { value: string; label: string };

function FilterMenu({ label, title, options, value, onChange, highlighted = false }: {
  label: string; title: string; options: FilterOption[]; value: string;
  onChange: (value: string) => void; highlighted?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function dismiss(event: MouseEvent) {
      if (event.target instanceof Node && !ref.current?.contains(event.target)) setOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") { setOpen(false); ref.current?.querySelector<HTMLButtonElement>("button")?.focus(); }
    }
    document.addEventListener("mousedown", dismiss);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("mousedown", dismiss); document.removeEventListener("keydown", escape); };
  }, [open]);
  return <div className={styles.filterMenu} ref={ref}>
    <button type="button" className={`${styles.filterTrigger} ${highlighted ? styles.filterTriggerTank : ""}`} aria-label={label} aria-expanded={open} onClick={() => setOpen(!open)}>
      <span>{value === "ALL" ? (highlighted ? "Filter Tanks" : "All Types") : options.find((option) => option.value === value)?.label}</span><ChevronDown size={14} aria-hidden="true" />
    </button>
    {open && <div className={styles.filterPopover} role="group" aria-label={title}>
      <h3>{title}</h3>
      {options.map((option) => <button type="button" key={option.value} aria-pressed={value === option.value} onClick={() => { onChange(option.value); setOpen(false); }}>{option.label}</button>)}
    </div>}
  </div>;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const tanks = useTankStore((state) => state.tanks);
  const fetchTanks = useTankStore((state) => state.fetchTanks);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [query, setQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [tankFilter, setTankFilter] = useState("ALL");
  const [page, setPage] = useState(0);
  const [showAll, setShowAll] = useState(false);

  async function loadLogs(signal?: AbortSignal) {
    try {
      const response = await fetch("/api/audit-logs?limit=100", { signal });
      const result: ApiResponse<AuditLog[]> = await response.json();
      if (response.ok && result.success && Array.isArray(result.data)) {
        setLogs(result.data);
        setLastUpdated(new Date());
        setLoadError(false);
      } else {
        setLogs([]);
        setLoadError(true);
      }
    } catch {
      setLogs([]);
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();

    async function fetchLogs() {
      try {
        const response = await fetch("/api/audit-logs?limit=100", {
          signal: controller.signal,
        });
        const result: ApiResponse<AuditLog[]> = await response.json();
        if (!ignore) {
          if (response.ok && result.success && Array.isArray(result.data)) {
            setLogs(result.data);
            setLastUpdated(new Date());
            setLoadError(false);
          } else {
            setLogs([]);
            setLoadError(true);
          }
        }
      } catch {
        if (!ignore) { setLogs([]); setLoadError(true); }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    void fetchLogs();
    void fetchTanks(controller.signal);

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [fetchTanks]);

  const eventGroups = useMemo(() => [
    { value: "LOGIN", label: "Login", actions: ["LOGIN"] },
    { value: "DATA_UPDATE", label: "Data Update", actions: ["DATA_UPDATE", "UPDATE_TANK"] },
    { value: "ALERT_TRIGGERED", label: "Alert Triggered", actions: ["ALERT_TRIGGERED", "TRIGGER_ALERT"] },
    { value: "PUMP_ACTIVATED", label: "Pump Activated", actions: ["PUMP_ACTIVATED", "ACTIVATE_PUMP"] },
    { value: "ALERT_RESOLVED", label: "Alert Resolved", actions: ["ALERT_RESOLVED", "RESOLVE_ALERT"] },
  ], []);
  const actionOptions = useMemo(() => [
    { value: "ALL", label: "All Types" }, ...eventGroups,
    ...Array.from(new Set(logs.map((log) => log.action))).filter((action) => !eventGroups.some((group) => group.actions.includes(action))).sort().map((action) => ({
      value: action, label: action.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()),
    })),
  ], [eventGroups, logs]);
  const tankOptions = useMemo(() => [{ value: "ALL", label: "All Tanks" }, ...tanks.map((tank) => ({ value: tank.id, label: tank.name }))], [tanks]);

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
        actionFilter === "ALL" || (eventGroups.find((group) => group.value === actionFilter)?.actions ?? [actionFilter]).includes(log.action);

      const selectedTank = tanks.find((tank) => tank.id === tankFilter);
      const matchesTank = tankFilter === "ALL" || Boolean(selectedTank && (
        log.entityId === selectedTank.id || entity.toLowerCase().includes(selectedTank.name.toLowerCase()) || detail.toLowerCase().includes(selectedTank.name.toLowerCase())
      ));

      return matchesSearch && matchesAction && matchesTank;
    });
  }, [logs, query, actionFilter, tankFilter, tanks, eventGroups]);

  const pageSize = showAll ? Math.max(1, filteredLogs.length) : 10;
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
        "-",
      ]),
    ];
    downloadCsv("audit-logs.csv", rows);
  }

  return (
    <section className={styles.page}>
      <div className={styles.summaryRow} aria-label="Activity summary">
        <div className={`${styles.summaryCard} ${styles.total}`}><h2>Total Activities</h2><strong>{isLoading || loadError ? "-" : logs.length}</strong></div>
        <div className={`${styles.summaryCard} ${styles.warning}`}><h2>Warning</h2><strong>-</strong></div>
        <div className={`${styles.summaryCard} ${styles.success}`}><h2>Success</h2><strong>-</strong></div>
      </div>
      <header className={styles.heading}>
        <h1>Audit Logs</h1>
        <div className={styles.headingActions}>
        <Link href="/alerts" className={styles.notification} aria-label="View alerts"><Bell size={22} /></Link>
        <button
          type="button"
          className={styles.download}
          onClick={handleExportCsv}
          disabled={!logs.length}
        >
          <Download size={24} aria-hidden="true" />
          <span>Download All</span>
        </button>
        </div>
      </header>

      <div className={`${styles.breadcrumb} app-breadcrumb`}>
        <span className={styles.crumbPath}>
          <Settings size={16} aria-hidden="true" /> <Link href="/">Dashboard</Link> &gt; Audit Logs
        </span>
        <span>
          {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}` : "Awaiting first update"} {" "}
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

      <div className={styles.toolbar}>
          <div className="app-search">
            <Search size={16} aria-hidden="true" />
            <input
              type="text"
              aria-label="Search activity history"
              placeholder="Search Logs"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(0); }}
            />
          </div>

          <div className={styles.toolbarActions}>
            <FilterMenu label="Filter by action type" title="Filter by Event Type" options={actionOptions} value={actionFilter} onChange={(value) => { setActionFilter(value); setPage(0); }} />
            <FilterMenu label="Filter by tank" title="Select Tank" options={tankOptions} value={tankFilter} highlighted onChange={(value) => { setTankFilter(value); setPage(0); }} />
          </div>
        </div>

      <div className={styles.logCard}>
        <div className={styles.cardHeader}>
          <FileText size={45} aria-hidden="true" />
          <h2>SYSTEM ACTIVITY HISTORY</h2>
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
                  const date = new Date(log.createdAt);
                  const timeFormatted = Number.isNaN(date.getTime()) ? "-" : date.toISOString().replace("T", " ").slice(0, 19);
                  const relatedTank = tanks.find((tank) => tank.id === log.entityId || (log.detail && log.detail.toLowerCase().includes(tank.name.toLowerCase())));
                  const eventLabel = eventGroups.find((group) => group.actions.includes(log.action))?.label ?? log.action.replaceAll("_", " ");
                  return (
                    <tr key={log.id}>
                      <td className={styles.timeCell}>{timeFormatted}</td>
                      <td>{eventLabel}</td>
                      <td>
                        {log.username || log.user?.username || "-"}
                      </td>
                      <td>{relatedTank?.name || "-"}</td>
                      <td style={{ maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis" }}>
                        {log.detail || "-"}
                      </td>
                      <td>-</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className={styles.emptyMessage}>
                    {isLoading ? "Loading activity logs..." : loadError ? "Activity history is unavailable. Please try again." : "No matching activity logs."}
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
