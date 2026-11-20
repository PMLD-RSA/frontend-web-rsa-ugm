"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import localFont from "next/font/local";
import { LuCheck as Check } from "react-icons/lu";
import { useAlertStore } from "@/stores/alertStore";
import { useTankStore } from "@/stores/tankStore";
import { isOperator, useAuthStore } from "@/stores/authStore";
import type { Alert, ApiResponse, AuditLog, Tank } from "@/types";
import styles from "./alerts.module.css";

const alertHeadingFont = localFont({
  src: '../../../../assets/fonts/asap/Asap-Variable.ttf',
  variable: '--font-alert-heading',
  weight: '400 700',
  display: 'swap',
});
const alertButtonFont = localFont({
  src: '../../../../assets/fonts/inter/Inter-Variable.ttf',
  variable: '--font-alert-button',
  weight: '400 700',
  display: 'swap',
});

type ModalKind = "sensor" | "resolve" | "mark" | "pump";
type OpenModal = { kind: ModalKind; alert: Alert };

const timeFormatter = new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta",
  day: "numeric",
  month: "long",
  year: "numeric",
});

function formatTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const parts = timeFormatter.formatToParts(date);
  const hour = parts.find((part) => part.type === "hour")?.value;
  const minute = parts.find((part) => part.type === "minute")?.value;
  return `${hour}:${minute} WIB`;
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : dateFormatter.format(date);
}

function formatReading(value: string | number | null | undefined, unit: string) {
  if (value === null || value === undefined || value === "") return "—";
  const numeric = Number(value);
  return Number.isFinite(numeric)
    ? `${numeric.toLocaleString("id-ID", { maximumFractionDigits: 2 })}${unit}`
    : "—";
}

function alertName(alert: Alert, tank?: Tank) {
  return tank?.name || alert.tankName || `Tangki ${alert.tankId}`;
}

function AlertModal({
  kind,
  title,
  subtitle,
  onClose,
  children,
}: {
  kind: ModalKind | "sop";
  title: string;
  subtitle: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (dialogRef.current && !dialogRef.current.open) dialogRef.current.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className={`${styles.modalBox} ${kind === "resolve" ? styles.modalResolve : kind === "sensor" ? styles.modalSensor : kind === "sop" ? styles.modalSop : styles.modalConfirm}`}
      aria-labelledby="alert-dialog-title"
      aria-describedby={subtitle ? "alert-dialog-subtitle" : undefined}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) dialogRef.current?.close();
      }}
    >
      <button type="button" className={styles.modalCloseBtn} onClick={onClose} aria-label="Tutup dialog">
        <Image src="/images/alerts/close.svg" alt="" width={25} height={25} />
      </button>
      <header className={styles.modalHeader}>
        <h2 id="alert-dialog-title">{title}</h2>
        {subtitle && <p id="alert-dialog-subtitle" className={styles.modalSubtitle}>{subtitle}</p>}
      </header>
      {children}
    </dialog>
  );
}

export default function AlertsPage() {
  const alerts = useAlertStore((state) => state.alerts);
  const alertLoading = useAlertStore((state) => state.isLoading);
  const alertError = useAlertStore((state) => state.error);
  const fetchAlerts = useAlertStore((state) => state.fetchAlerts);
  const resolveAlert = useAlertStore((state) => state.resolveAlert);
  const tanks = useTankStore((state) => state.tanks);
  const tankError = useTankStore((state) => state.error);
  const fetchTanks = useTankStore((state) => state.fetchTanks);
  const user = useAuthStore((state) => state.user);
  const canResolve = isOperator(user);

  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"active" | "all" | "history">("active");
  const [selectedTankId, setSelectedTankId] = useState("ALL");
  const [modal, setModal] = useState<OpenModal | null>(null);
  const [sopOpen, setSopOpen] = useState(false);
  const [actionNotes, setActionNotes] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [historyState, setHistoryState] = useState<"loading" | "ready" | "unavailable">("loading");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadHistory = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch("/api/audit-logs?limit=100", { signal });
      const result: ApiResponse<AuditLog[]> = await response.json();
      if (!response.ok || !result.success || result.source === "mock" || !Array.isArray(result.data)) {
        throw new Error("Riwayat tidak tersedia");
      }
      setAuditLogs(result.data);
      setHistoryState("ready");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setAuditLogs([]);
      setHistoryState("unavailable");
    }
  }, []);

  const refreshAlerts = useCallback(async (signal?: AbortSignal) => {
    await fetchAlerts(undefined, signal);
    if (!signal?.aborted && !useAlertStore.getState().error) setLastUpdated(new Date());
  }, [fetchAlerts]);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => {
      if (controller.signal.aborted) return;
      void refreshAlerts(controller.signal);
      void fetchTanks(controller.signal);
      void loadHistory(controller.signal);
    });
    const interval = window.setInterval(() => void refreshAlerts(), 5000);
    return () => {
      controller.abort();
      window.clearInterval(interval);
    };
  }, [refreshAlerts, fetchTanks, loadHistory]);

  const tankMap = useMemo(() => new Map(tanks.map((tank) => [tank.id, tank])), [tanks]);
  const tankOptions = useMemo(() => {
    const options = new Map(tanks.map((tank) => [tank.id, tank.name]));
    for (const alert of alerts) {
      if (!options.has(alert.tankId)) options.set(alert.tankId, alertName(alert));
    }
    return [...options];
  }, [tanks, alerts]);

  const counts = useMemo(() => {
    const active = alerts.filter((alert) => alert.status === "active");
    return {
      active: active.length,
      critical: active.filter((alert) => alert.level === "CRITICAL").length,
      warning: active.filter((alert) => alert.level === "WARNING").length,
      total: alerts.length,
    };
  }, [alerts]);

  const filteredAlerts = useMemo(() => alerts
    .filter((alert) => {
      if (tab === "active" && alert.status !== "active") return false;
      if (tab === "history" && alert.status !== "resolved") return false;
      if (selectedTankId !== "ALL" && alert.tankId !== selectedTankId) return false;
      const search = query.trim().toLowerCase();
      if (!search) return true;
      const tank = tankMap.get(alert.tankId);
      return [alertName(alert, tank), tank?.location, alert.message, alert.id, tank?.nodes?.[0]?.deviceCode]
        .some((value) => String(value ?? "").toLowerCase().includes(search));
    })
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
  [alerts, tab, selectedTankId, query, tankMap]);

  const recentEvents = useMemo(() => auditLogs
    .filter((log) => /RESOLVE_ALERT|UPDATE_TANK|MAINTENANCE/i.test(log.action))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 3), [auditLogs]);
  const priorityAlert = alerts.find((alert) => alert.status === "active" && alert.level === "CRITICAL")
    ?? alerts.find((alert) => alert.status === "active");
  const priorityTank = priorityAlert ? tankMap.get(priorityAlert.tankId) : undefined;
  const guidance = priorityAlert
    ? `Periksa sensor dan kondisi ${alertName(priorityAlert, priorityTank)}${priorityTank?.minThresholdPercent ? ` saat level mendekati batas minimum ${formatReading(priorityTank.minThresholdPercent, "%")}` : ""}. Catat tindakan sebelum menyelesaikan peringatan.`
    : "Periksa status sensor dan kondisi tangki ketika peringatan muncul. Selesaikan peringatan setelah tindakan diverifikasi.";

  async function reload() {
    await Promise.all([refreshAlerts(), fetchTanks(), loadHistory()]);
  }

  function openModal(kind: ModalKind, alert: Alert) {
    setActionNotes("");
    setFormError("");
    setModal({ kind, alert });
  }

  async function confirmResolve() {
    if (!modal || (modal.kind !== "resolve" && modal.kind !== "mark")) return;
    if (modal.kind === "resolve" && !actionNotes.trim()) {
      setFormError("Catatan tindakan wajib diisi.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      const success = await resolveAlert(modal.alert.id);
      if (!success) {
        setFormError("Alert gagal diselesaikan. Coba lagi.");
        return;
      }
      setModal(null);
      void loadHistory();
    } finally {
      setSubmitting(false);
    }
  }

  const modalTank = modal ? tankMap.get(modal.alert.tankId) : undefined;
  const modalReading = modalTank?.latestReading;
  const modalTitle = modal?.kind === "sensor" ? "View Sensor"
    : modal?.kind === "resolve" ? "Resolve Alert"
    : modal?.kind === "mark" ? "Mark as Resolved" : "Active Backup Pump";

  return (
    <section className={`${styles.page} ${alertHeadingFont.variable} ${alertButtonFont.variable}`}>
      <header className={styles.heading}><h1>Alarm and Events</h1></header>

      <div className={styles.breadcrumb}>
        <span className={styles.crumbPath}>
          <Image src="/images/alerts/breadcrumb.svg" alt="" width={18.84} height={18.84} />
          <Link href="/">Dashboard</Link> &gt; Alarm and Events
        </span>
        <span className={styles.refreshInfo}>
          <Image src="/images/alerts/update.svg" alt="" width={11.9992} height={12} />
          {lastUpdated ? `Updated ${formatTime(lastUpdated.toISOString())}` : "Belum diperbarui"}
          <button type="button" onClick={() => void reload()} disabled={alertLoading}>
            <Image src="/images/alerts/reload.svg" alt="" width={10.8903} height={13} /> Reload
          </button>
        </span>
      </div>

      {tankError && <p className={styles.backendNotice} role="status">Data tangki tidak tersedia: {tankError}</p>}

      <div className={styles.contentGrid}>
        <div className={styles.leftCol}>
          <div className={styles.summaryRow} aria-label="Ringkasan alert">
            <div className={`${styles.summaryCard} ${styles.critical}`}><h2>Critical</h2><strong>{alertError || (alertLoading && !lastUpdated) ? "—" : counts.critical}</strong></div>
            <div className={`${styles.summaryCard} ${styles.warning}`}><h2>Warning</h2><strong>{alertError || (alertLoading && !lastUpdated) ? "—" : counts.warning}</strong></div>
            <div className={`${styles.summaryCard} ${styles.pending}`}><h2>Pending</h2><strong>{alertError || (alertLoading && !lastUpdated) ? "—" : counts.active}</strong></div>
          </div>

          <div className={styles.filterBar}>
            <label className={styles.search}>
              <Image src="/images/alerts/search.svg" alt="" width={16} height={16} />
              <input type="search" aria-label="Cari peringatan" placeholder="Search by tank, unit, incident code..." value={query} onChange={(event) => setQuery(event.target.value)} />
            </label>
            <div className={styles.filterControls}>
              <div className={styles.pills} role="group" aria-label="Status peringatan">
                <button type="button" className={`${styles.pill} ${tab === "active" ? styles.active : ""}`} aria-pressed={tab === "active"} onClick={() => setTab("active")}>Active ({counts.active})</button>
                <button type="button" className={`${styles.pill} ${tab === "all" ? styles.active : ""}`} aria-pressed={tab === "all"} onClick={() => setTab("all")}>All ({counts.total})</button>
                <button type="button" className={`${styles.pill} ${tab === "history" ? styles.active : ""}`} aria-pressed={tab === "history"} onClick={() => setTab("history")}>History</button>
              </div>
              <select className={styles.tankSelect} aria-label="Filter berdasarkan tangki" value={selectedTankId} onChange={(event) => setSelectedTankId(event.target.value)}>
                <option value="ALL">All Tanks</option>
                {tankOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
              </select>
            </div>
          </div>

          <div className={styles.alertsBox}>
            <div className={styles.alertsHeader}>
              <h2><span className={tab === "history" ? styles.greenDot : styles.redDot} />
                {tab === "history" ? "RESOLVED ALERTS HISTORY" : tab === "all" ? "ALL SYSTEM ALERTS" : "ACTIVE ALERTS REQUIRING RESPONSE"}
              </h2>
              <span>Auto-refresh 5s</span>
            </div>

            {alertError ? <p className={styles.emptyAlerts} role="status">{alertError}</p>
              : alertLoading && !lastUpdated ? <p className={styles.emptyAlerts}>Memuat peringatan...</p>
              : filteredAlerts.length === 0 ? <p className={styles.emptyAlerts}>{query || selectedTankId !== "ALL" ? "Tidak ada peringatan yang sesuai filter." : tab === "history" ? "Belum ada riwayat peringatan." : tab === "all" ? "Backend terhubung, tetapi belum ada alert yang tercatat." : "Backend terhubung. Alert akan muncul saat sensor memicu peringatan."}</p>
              : filteredAlerts.map((alert) => {
                const tank = tankMap.get(alert.tankId);
                const critical = alert.level === "CRITICAL";
                const resolved = alert.status === "resolved";
                const messagePercent = alert.message.match(/\d+(?:[.,]\d+)?\s*%/)?.[0];
                const level = messagePercent || (tank?.latestReading ? formatReading(tank.latestReading.levelPercent, "%") : null);
                return (
                  <article key={alert.id} className={`${styles.alertCard} ${critical ? styles.critical : styles.warning}`}>
                    <div className={styles.alertTop}>
                      <div className={styles.alertTitleRow}>
                        <span className={critical ? styles.badgeCritical : styles.badgeWarning}>{alert.level}</span>
                        {resolved && <span className={styles.badgeResolved}>Resolved</span>}
                        <h3>{alertName(alert, tank)}</h3>
                      </div>
                      <time className={styles.timestamp} dateTime={alert.createdAt}>{formatTime(alert.createdAt)}</time>
                    </div>
                    <p className={styles.metaText}>ID: ALM-{alert.id} · Unit: {tank?.nodes?.[0]?.deviceCode || "—"}</p>
                    <div className={`${styles.msgBox} ${critical ? styles.critical : styles.warning}`}>
                      <p>{alert.message.split(/(\d+(?:[.,]\d+)?\s*%(?:\s*\([^)]*\))?)/).map((part, index) =>
                        index === 1 ? <strong key={index}>{part}</strong> : part
                      )}</p>
                      {level && <strong className={styles.levelBadge}>{level}</strong>}
                    </div>
                    <div className={styles.actionsRow}>
                      <button type="button" className={styles.actionGray} onClick={() => openModal("sensor", alert)}>View Sensor</button>
                      {!resolved && !critical && <button type="button" className={styles.actionGray} onClick={() => openModal("pump", alert)}>Activate Backup Pump</button>}
                      {resolved ? <span className={styles.actionResolved}><Check size={14} /> Resolved</span>
                        : <button type="button" className={critical ? styles.actionRed : styles.actionOrange} onClick={() => openModal(critical ? "resolve" : "mark", alert)} disabled={!canResolve || submitting} title={!canResolve ? "Hanya operator atau admin yang dapat menyelesaikan alert" : undefined}>{critical ? "Resolve Alert" : "Mark as Resolved"}</button>}
                    </div>
                  </article>
                );
              })}
          </div>
        </div>

        <aside className={styles.rightCol}>
          <section className={styles.historyCard} aria-label="Riwayat aktivitas terbaru">
            <header className={styles.historyHeader}><h2>Latest Event History</h2><p>{formatDate(recentEvents[0]?.createdAt)}</p></header>
            {historyState === "loading" ? <p className={styles.historyEmpty}>Memuat riwayat...</p>
              : historyState === "unavailable" ? <p className={styles.historyEmpty}>Riwayat aktivitas tidak tersedia.</p>
              : recentEvents.length === 0 ? <p className={styles.historyEmpty}>Belum ada aktivitas terbaru.</p>
              : <div className={styles.historyList}>{recentEvents.map((log) => {
                const relatedAlert = alerts.find((alert) => String(alert.id) === log.entityId);
                const relatedTank = tanks.find((tank) => tank.id === log.entityId || tank.id === relatedAlert?.tankId);
                const isResolution = log.action.toUpperCase().includes("RESOLVE");
                return <article className={styles.historyItem} key={log.id}>
                  <span className={isResolution ? styles.dotGreen : styles.dotGray} aria-hidden="true" />
                  <div className={styles.historyContent}>
                    <div className={styles.historyTitleRow}><strong>{relatedTank?.name || relatedAlert?.tankName || log.entity || log.action}</strong><time dateTime={log.createdAt}>{formatTime(log.createdAt)}</time></div>
                    <span className={isResolution ? styles.tagGreen : styles.tagGray}>{isResolution ? "Resolved" : log.action.replaceAll("_", " ")}</span>
                    <p>{log.detail || `Dicatat oleh ${log.username || "operator"}.`}</p>
                  </div>
                </article>;
              })}</div>}
          </section>

          <section className={styles.sopCard} aria-label="Panduan penanganan peringatan">
            <div className={styles.sopHeader}>
              <span className={styles.sopIcon}><Image src="/images/alerts/sop.svg" alt="" width={20} height={20} /></span>
              <h2>Medical Water Crisis SOP RSA UGM</h2>
            </div>
            <p className={styles.sopBody}>{guidance}</p>
            <div className={styles.sopFooter}>
              <span>{counts.active} peringatan aktif</span>
              <button type="button" onClick={() => setSopOpen(true)}>View SOP Procedure &rarr;</button>
            </div>
          </section>
        </aside>
      </div>

      {sopOpen && <AlertModal kind="sop" title="Medical Water Crisis SOP - RSA UGM" subtitle="" onClose={() => setSopOpen(false)}>
        <div className={styles.sopDialogBody}>
          <p>{guidance}</p>
          <Link href="/devices">Lihat perangkat sensor &rarr;</Link>
        </div>
        <div className={styles.modalActions}><button type="button" className={styles.btnCancel} onClick={() => setSopOpen(false)}>Cancel</button></div>
      </AlertModal>}

      {modal && <AlertModal kind={modal.kind} title={modalTitle} subtitle={alertName(modal.alert, modalTank)} onClose={() => setModal(null)}>
        {modal.kind === "sensor" ? <>
          <div className={styles.modalContent}>
            <h3>Sensor Information</h3>
            <dl>
              <div className={styles.sensorRow}><dt>Water Level</dt><dd className={modal.alert.level === "CRITICAL" ? styles.criticalValue : styles.warningValue}>{modalReading ? `${formatReading(modalReading.levelPercent, "%")} (${formatReading(modalReading.volumeLiters, " L")})` : "Tidak tersedia"}</dd></div>
              <div className={styles.sensorRow}><dt>Status</dt><dd><span className={modal.alert.level === "CRITICAL" ? styles.badgeCritical : styles.badgeWarning}>{modal.alert.level}</span></dd></div>
              <div className={styles.sensorRow}><dt>Last Update</dt><dd>{formatTime(modalReading?.recordedAt)}</dd></div>
            </dl>
          </div>
          <div className={styles.modalActions}><button type="button" className={styles.btnCancel} onClick={() => setModal(null)}>Cancel</button></div>
        </> : modal.kind === "resolve" ? <>
          <div className={styles.modalContent}>
            <label className={styles.notesLabel} htmlFor="action-notes-input">Action Notes <span>*</span></label>
            <textarea id="action-notes-input" autoFocus rows={3} placeholder="e.g. Checked the tank, restarted pump..." value={actionNotes} onChange={(event) => { setActionNotes(event.target.value); setFormError(""); }} />
            <p className={styles.notesHint}>Catatan digunakan untuk konfirmasi; API saat ini belum menyimpan catatan tindakan.</p>
          </div>
          {formError && <p className={styles.formError} role="alert">{formError}</p>}
          <div className={styles.modalActions}><button type="button" className={styles.btnConfirmNavy} disabled={submitting} onClick={() => void confirmResolve()}>{submitting ? "Menyelesaikan..." : "Confirm Resolution"}</button><button type="button" className={styles.btnCancel} onClick={() => setModal(null)}>Cancel</button></div>
        </> : modal.kind === "mark" ? <>
          <p className={styles.confirmQuestion}>Are you sure you want to mark this alert as resolved?</p>
          {formError && <p className={styles.formError} role="alert">{formError}</p>}
          <div className={styles.modalActions}><button type="button" className={styles.btnConfirmNavy} disabled={submitting} onClick={() => void confirmResolve()}>{submitting ? "Menyelesaikan..." : "Mark as Resolved"}</button><button type="button" className={styles.btnCancel} onClick={() => setModal(null)}>Cancel</button></div>
        </> : <>
          <p className={styles.confirmQuestion}>Are you sure you want to activate the backup pump for {alertName(modal.alert, modalTank)}?</p>
          <p className={styles.notesHint}>Kontrol pompa cadangan belum tersedia melalui API saat ini.</p>
          <div className={styles.modalActions}><button type="button" className={styles.btnConfirmNavy} disabled>Activate Pump</button><button type="button" className={styles.btnCancel} onClick={() => setModal(null)}>Cancel</button></div>
        </>}
      </AlertModal>}
    </section>
  );
}
