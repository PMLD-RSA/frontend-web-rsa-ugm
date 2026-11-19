"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  LuSearch as Search,
  LuRefreshCw as RefreshCw,
  LuShieldAlert as ShieldAlert,
  LuX as X,
  LuCheck as Check,
} from "react-icons/lu";
import { useAlertStore } from "@/stores/alertStore";
import { useTankStore } from "@/stores/tankStore";
import { useAuthStore, isOperator } from "@/stores/authStore";
import { Alert, Tank } from "@/types";
import styles from "./alerts.module.css";

export default function AlertsPage() {
  const { alerts, isLoading, fetchAlerts, resolveAlert } = useAlertStore();
  const tanks = useTankStore((state) => state.tanks);
  const user = useAuthStore((state) => state.user);
  const canResolve = isOperator(user);

  const [query, setQuery] = useState("");
  const [tabFilter, setTabFilter] = useState<"active" | "all" | "history">("active");
  const [selectedTankId, setSelectedTankId] = useState<string>("ALL");

  // Modals state
  const [viewSensorAlert, setViewSensorAlert] = useState<Alert | null>(null);
  const [resolveModalAlert, setResolveModalAlert] = useState<Alert | null>(null);
  const [markResolvedModalAlert, setMarkResolvedModalAlert] = useState<Alert | null>(null);
  const [pumpModalAlert, setPumpModalAlert] = useState<Alert | null>(null);

  const [actionNotes, setActionNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pumpActivated, setPumpActivated] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void fetchAlerts(undefined, controller.signal);
    return () => controller.abort();
  }, [fetchAlerts]);

  // Periodic polling every 5s
  useEffect(() => {
    const interval = setInterval(() => {
      void fetchAlerts();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  // Tank map for easy lookup
  const tankMap = useMemo(() => {
    const map = new Map<string, Tank>();
    for (const t of tanks) {
      map.set(t.id, t);
    }
    return map;
  }, [tanks]);

  // Counts
  const counts = useMemo(() => {
    let active = 0;
    let critical = 0;
    let warning = 0;
    for (const a of alerts) {
      if (a.status === "active") {
        active++;
        if (a.level === "CRITICAL") critical++;
        if (a.level === "WARNING") warning++;
      }
    }
    return {
      total: alerts.length,
      active,
      critical,
      warning,
      resolved: alerts.filter((a) => a.status === "resolved").length,
    };
  }, [alerts]);

  // Filtered alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      const tank = tankMap.get(a.tankId);
      const tankName = a.tankName || tank?.name || a.tankId;

      // Tab filter
      if (tabFilter === "active" && a.status !== "active") return false;
      if (tabFilter === "history" && a.status !== "resolved") return false;

      // Tank filter
      if (selectedTankId !== "ALL" && a.tankId !== selectedTankId) return false;

      // Search query
      if (query.trim()) {
        const q = query.toLowerCase();
        const matchesTank = tankName.toLowerCase().includes(q);
        const matchesMsg = a.message.toLowerCase().includes(q);
        const matchesCode = String(a.id).includes(q);
        if (!matchesTank && !matchesMsg && !matchesCode) return false;
      }

      return true;
    });
  }, [alerts, tabFilter, selectedTankId, query, tankMap]);

  // Action handlers
  async function handleConfirmResolve() {
    if (!resolveModalAlert && !markResolvedModalAlert) return;
    const alertToResolve = resolveModalAlert || markResolvedModalAlert;
    if (!alertToResolve) return;

    setIsSubmitting(true);
    try {
      await resolveAlert(alertToResolve.id);
      setResolveModalAlert(null);
      setMarkResolvedModalAlert(null);
      setActionNotes("");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleActivatePump() {
    setPumpActivated(true);
    setTimeout(() => {
      setPumpModalAlert(null);
      setPumpActivated(false);
    }, 1200);
  }

  return (
    <section className={styles.page}>
      <header className={styles.heading}>
        <h1>Alarm and Events</h1>
      </header>

      <div className={styles.breadcrumb}>
        <span>
          <Link href="/">Dashboard</Link> &gt; Alarm and Events
        </span>
        <span>
          Updated just now ·{" "}
          <button
            type="button"
            onClick={() => void fetchAlerts()}
            disabled={isLoading}
          >
            <RefreshCw size={13} /> Reload
          </button>
        </span>
      </div>

      {/* 3 Summary Metric Cards */}
      <div className={styles.summaryRow}>
        <div className={`${styles.summaryCard} ${styles.critical}`}>
          <h3>Critical</h3>
          <span className={styles.summaryNumber}>{counts.critical}</span>
        </div>
        <div className={`${styles.summaryCard} ${styles.warning}`}>
          <h3>Warning</h3>
          <span className={styles.summaryNumber}>{counts.warning}</span>
        </div>
        <div className={`${styles.summaryCard} ${styles.pending}`}>
          <h3>Pending</h3>
          <span className={styles.summaryNumber}>{counts.active}</span>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className={styles.contentGrid}>
        {/* Left Column: Filter Bar & Alerts List */}
        <div className={styles.leftCol}>
          <div className={styles.filterBar}>
            <div className={styles.search}>
              <Search size={16} color="#64748b" />
              <input
                type="text"
                placeholder="Search by tank, medical unit, incident code..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <div className={styles.pills}>
              <button
                type="button"
                className={`${styles.pill} ${tabFilter === "active" ? styles.active : ""}`}
                onClick={() => setTabFilter("active")}
              >
                Active ({counts.active})
              </button>
              <button
                type="button"
                className={`${styles.pill} ${tabFilter === "all" ? styles.active : ""}`}
                onClick={() => setTabFilter("all")}
              >
                All ({counts.total})
              </button>
              <button
                type="button"
                className={`${styles.pill} ${tabFilter === "history" ? styles.active : ""}`}
                onClick={() => setTabFilter("history")}
              >
                History
              </button>
            </div>

            <select
              aria-label="Filter berdasarkan tangki"
              className={styles.tankSelect}
              value={selectedTankId}
              onChange={(e) => setSelectedTankId(e.target.value)}
            >
              <option value="ALL">All Tanks</option>
              {tanks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.alertsBox}>
            <div className={styles.alertsHeader}>
              <h2>
                <span
                  className={
                    tabFilter === "history" ? styles.greenDot : styles.redDot
                  }
                />
                {tabFilter === "history"
                  ? "RESOLVED ALERTS HISTORY"
                  : tabFilter === "all"
                  ? "ALL SYSTEM ALERTS"
                  : "ACTIVE ALERTS REQUIRING RESPONSE"}
              </h2>
              <span className={styles.autoRefresh}>Auto-refresh 5s</span>
            </div>

            {filteredAlerts.length > 0 ? (
              filteredAlerts.map((a) => {
                const isCritical = a.level === "CRITICAL";
                const isResolved = a.status === "resolved";
                const tank = tankMap.get(a.tankId);
                const tankName = a.tankName || tank?.name || `Tangki ${a.tankId}`;
                const rawPercent = tank?.latestReading?.levelPercent;
                const percentStr =
                  rawPercent != null ? `${Math.round(Number(rawPercent))}%` : "-";

                return (
                  <article
                    key={a.id}
                    className={`${styles.alertCard} ${
                      isCritical ? styles.critical : styles.warning
                    }`}
                  >
                    <div className={styles.alertTop}>
                      <div className={styles.alertTitleRow}>
                        <span
                          className={
                            isCritical ? styles.badgeCritical : styles.badgeWarning
                          }
                        >
                          {a.level}
                        </span>
                        {isResolved && (
                          <span className={styles.badgeResolved}>Resolved</span>
                        )}
                        <h3>{tankName}</h3>
                      </div>
                      <span className={styles.timestamp}>
                        {new Date(a.createdAt).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        WIB
                      </span>
                    </div>

                    <div className={styles.metaText}>
                      ID: ALM-{new Date(a.createdAt).getFullYear()}-{String(a.id).padStart(4, "0")} · Unit:{" "}
                      {tank?.nodes?.[0]?.deviceCode || "STM32"}
                    </div>

                    <div
                      className={`${styles.msgBox} ${
                        isCritical ? styles.critical : styles.warning
                      }`}
                    >
                      <div className={styles.msgText}>{a.message}</div>
                      <div className={styles.levelBadge}>{percentStr}</div>
                    </div>

                    <div className={styles.actionsRow}>
                      {isResolved ? (
                        <>
                          <button
                            type="button"
                            className={styles.actionGray}
                            disabled
                            style={{ cursor: "not-allowed", opacity: 0.55 }}
                            title="Peringatan sudah diselesaikan"
                          >
                            {isCritical ? "View Sensor" : "Activate Backup Pump"}
                          </button>
                          <button
                            type="button"
                            className={styles.actionResolved}
                            disabled
                            title="Peringatan sudah diselesaikan"
                          >
                            <Check size={14} /> Resolved
                          </button>
                        </>
                      ) : isCritical ? (
                        <>
                          <button
                            type="button"
                            className={styles.actionGray}
                            onClick={() => setViewSensorAlert(a)}
                          >
                            View Sensor
                          </button>
                          <button
                            type="button"
                            className={styles.actionRed}
                            onClick={() => setResolveModalAlert(a)}
                            disabled={!canResolve || isSubmitting}
                            title={
                              !canResolve
                                ? "Hanya Operator/Admin yang dapat menyelesaikan alert"
                                : undefined
                            }
                          >
                            Resolve Alert
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className={styles.actionGray}
                            onClick={() => setPumpModalAlert(a)}
                          >
                            Activate Backup Pump
                          </button>
                          <button
                            type="button"
                            className={styles.actionOrange}
                            onClick={() => setMarkResolvedModalAlert(a)}
                            disabled={!canResolve || isSubmitting}
                            title={
                              !canResolve
                                ? "Hanya Operator/Admin yang dapat menyelesaikan alert"
                                : undefined
                            }
                          >
                            Mark as Resolved
                          </button>
                        </>
                      )}
                    </div>
                  </article>
                );
              })
            ) : (
              <div className={styles.emptyAlerts}>
                <Check size={36} color="#10b981" style={{ margin: "0 auto 10px" }} />
                <p>Tidak ada peringatan aktif yang membutuhkan penanganan saat ini.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Maintenance History & SOP */}
        <div className={styles.rightCol}>
          <div className={styles.historyCard}>
            <div className={styles.historyHeader}>
              <h3>Latest Maintenance History</h3>
              <p>Today, 19 Nov 2026</p>
            </div>

            <div className={styles.historyList}>
              <div className={styles.historyItem}>
                <div className={styles.dotGreen} />
                <div className={styles.historyContent}>
                  <div className={styles.historyTitleRow}>
                    <strong>Tangki Atap Gedung Utama</strong>
                    <span>05:12 WIB</span>
                  </div>
                  <span className={styles.tagGreen}>Auto-Normal</span>
                  <p className={styles.historyDesc}>
                    Water level has stabilized at 78% (7,800 L). Automatic pump cutoff activated.
                  </p>
                </div>
              </div>

              <div className={styles.historyItem}>
                <div className={styles.dotGray} />
                <div className={styles.historyContent}>
                  <div className={styles.historyTitleRow}>
                    <strong>Tangki Instalasi Bedah Sentral</strong>
                    <span>04:30 WIB</span>
                  </div>
                  <span className={styles.tagGray}>Manual ACK</span>
                  <p className={styles.historyDesc}>
                    Acknowledged by Operator budi_s via the Control Room Terminal.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.sopCard}>
            <div className={styles.sopHeader}>
              <div className={styles.sopIcon}>
                <ShieldAlert size={18} color="#38bdf8" />
              </div>
              <h4>Medical Water Crisis SOP RSA UGM</h4>
            </div>
            <p className={styles.sopBody}>
              Jika Tangki Gedung Bedah atau Penunjang Medik berada di bawah 20% selama lebih dari 15
              menit, segera aktifkan transfer bypass dari Tangki Utama dan hubungi Unit IPSRS.
            </p>
            <div className={styles.sopFooter}>
              <span className={styles.sopHotline}>Emergency Hotline: Ext 1109</span>
              <a
                href="#sop"
                className={styles.sopLink}
                onClick={(e) => {
                  e.preventDefault();
                  alert("Prosedur SOP Standar Pelayanan Air Medis RSA UGM aktif.");
                }}
              >
                View SOP Procedure &rarr;
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Modal 1: View Sensor (Frame 2147221019.png) */}
      {viewSensorAlert && (
        <div className={styles.modalBackdrop} onClick={() => setViewSensorAlert(null)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.modalCloseBtn}
              onClick={() => setViewSensorAlert(null)}
              aria-label="Tutup"
            >
              <X size={18} />
            </button>
            <h3>View Sensor</h3>
            <p className={styles.modalSubtitle}>
              {viewSensorAlert.tankName || `Tangki ${viewSensorAlert.tankId}`}
            </p>

            <div className={styles.modalContent}>
              <h4 style={{ fontSize: "14px", fontWeight: 700, margin: "0 0 12px", color: "#0f172a" }}>
                Sensor Information
              </h4>
              <dl>
                <div className={styles.sensorRow}>
                  <dt>Water Level</dt>
                  <dd style={{ color: viewSensorAlert.level === "CRITICAL" ? "#dc2626" : "#d97706" }}>
                    {tankMap.get(viewSensorAlert.tankId)?.latestReading?.levelPercent ?? "18"}% (
                    {tankMap.get(viewSensorAlert.tankId)?.latestReading?.volumeLiters ?? "360"} L)
                  </dd>
                </div>
                <div className={styles.sensorRow}>
                  <dt>Status</dt>
                  <dd>
                    <span
                      className={
                        viewSensorAlert.level === "CRITICAL"
                          ? styles.badgeCritical
                          : styles.badgeWarning
                      }
                    >
                      {viewSensorAlert.level}
                    </span>
                  </dd>
                </div>
                <div className={styles.sensorRow}>
                  <dt>Last Update</dt>
                  <dd>
                    {new Date(viewSensorAlert.createdAt).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    WIB
                  </dd>
                </div>
              </dl>
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.btnCancel}
                onClick={() => setViewSensorAlert(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Resolve Alert with Action Notes (Frame 2147221022.png) */}
      {resolveModalAlert && (
        <div className={styles.modalBackdrop} onClick={() => setResolveModalAlert(null)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.modalCloseBtn}
              onClick={() => setResolveModalAlert(null)}
              aria-label="Tutup"
            >
              <X size={18} />
            </button>
            <h3>Resolve Alert</h3>
            <p className={styles.modalSubtitle}>
              {resolveModalAlert.tankName || `Tangki ${resolveModalAlert.tankId}`}
            </p>

            <div className={styles.modalContent}>
              <label
                htmlFor="action-notes-input"
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#0f172a",
                  marginBottom: "8px",
                }}
              >
                Action Notes <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <textarea
                id="action-notes-input"
                rows={3}
                placeholder="e.g. Checked the tank, restarted pump..."
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  outline: "none",
                }}
              />
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.btnConfirmNavy}
                onClick={() => void handleConfirmResolve()}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Menyelesaikan..." : "Confirm Resolution"}
              </button>
              <button
                type="button"
                className={styles.btnCancel}
                onClick={() => setResolveModalAlert(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Mark as Resolved Confirmation (Frame 2147221023.png) */}
      {markResolvedModalAlert && (
        <div className={styles.modalBackdrop} onClick={() => setMarkResolvedModalAlert(null)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.modalCloseBtn}
              onClick={() => setMarkResolvedModalAlert(null)}
              aria-label="Tutup"
            >
              <X size={18} />
            </button>
            <h3>Mark as Resolved</h3>
            <p className={styles.modalSubtitle}>
              {markResolvedModalAlert.tankName || `Tangki ${markResolvedModalAlert.tankId}`}
            </p>

            <div className={styles.modalContent}>
              <p style={{ fontSize: "14px", color: "#334155", textAlign: "center", margin: "16px 0" }}>
                Are you sure you want to mark this alert as resolved?
              </p>
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.btnConfirmNavy}
                onClick={() => void handleConfirmResolve()}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Menyelesaikan..." : "Mark as Resolved"}
              </button>
              <button
                type="button"
                className={styles.btnCancel}
                onClick={() => setMarkResolvedModalAlert(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Activate Backup Pump (Frame 2147221024.png) */}
      {pumpModalAlert && (
        <div className={styles.modalBackdrop} onClick={() => setPumpModalAlert(null)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.modalCloseBtn}
              onClick={() => setPumpModalAlert(null)}
              aria-label="Tutup"
            >
              <X size={18} />
            </button>
            <h3>Active Backup Pump</h3>
            <p className={styles.modalSubtitle}>
              {pumpModalAlert.tankName || `Tangki ${pumpModalAlert.tankId}`}
            </p>

            <div className={styles.modalContent}>
              <p style={{ fontSize: "14px", color: "#334155", textAlign: "center", margin: "16px 0" }}>
                {pumpActivated
                  ? "Pompa cadangan berhasil diaktifkan!"
                  : `Are you sure you want to active the backup pump for ${
                      pumpModalAlert.tankName || "Tank"
                    }?`}
              </p>
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.btnConfirmNavy}
                onClick={handleActivatePump}
                disabled={pumpActivated}
              >
                {pumpActivated ? "Pump Active" : "Activate Pump"}
              </button>
              <button
                type="button"
                className={styles.btnCancel}
                onClick={() => setPumpModalAlert(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}