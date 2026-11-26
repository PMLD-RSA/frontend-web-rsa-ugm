"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  LuDownload as Download,
  LuChevronDown as ChevronDown,
  LuCalendarDays as CalendarDays,
  LuFileSpreadsheet as FileSpreadsheet,
  LuFileText as FileText,
  LuRefreshCw as RefreshCw,
  LuSettings as BreadcrumbIcon,
  LuInfo as Info,
  LuTriangleAlert as AlertTriangle,
} from "react-icons/lu";
import { DashboardDatePicker } from "@/components/dashboard/DashboardCalendar";
import { useTankStore } from "@/stores/tankStore";
import styles from "./reports.module.css";

function ReportSelect({ id, value, options, onChange }: {
  id: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const dismiss = (event: MouseEvent) => {
      if (event.target instanceof Node && !container.current?.contains(event.target)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpen(false); container.current?.querySelector<HTMLButtonElement>("button")?.focus(); }
    };
    document.addEventListener("mousedown", dismiss);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("mousedown", dismiss); document.removeEventListener("keydown", escape); };
  }, [open]);
  return <div className={styles.selectContainer} ref={container}>
    <button id={id} type="button" className={styles.selectTrigger} aria-expanded={open} onClick={() => setOpen(!open)}>
      <span>{options.find((option) => option.value === value)?.label}</span><ChevronDown size={17} aria-hidden="true" />
    </button>
    {open && <div className={styles.selectMenu} role="group" aria-label={id === "sensor-tank-target" ? "Target tank" : "Severity"}>
      {options.map((option) => <button key={option.value} type="button" aria-pressed={value === option.value} onClick={() => { onChange(option.value); setOpen(false); }}>{option.label}</button>)}
    </div>}
  </div>;
}

export default function ReportsPage() {
  const { tanks, fetchTanks } = useTankStore();

  // Export Sensor State
  const [sensorTankId, setSensorTankId] = useState<string>("ALL");
  const [sensorStartDate, setSensorStartDate] = useState<string>("");
  const [sensorEndDate, setSensorEndDate] = useState<string>("");
  const [sensorInterval, setSensorInterval] = useState<string>("10m");
  const [isExportingSensor, setIsExportingSensor] = useState<boolean>(false);

  // Export Alert State
  const [alertSeverity, setAlertSeverity] = useState<string>("ALL");
  const [alertStartDate, setAlertStartDate] = useState<string>("");
  const [alertEndDate, setAlertEndDate] = useState<string>("");
  const [isExportingAlert, setIsExportingAlert] = useState<boolean>(false);

  useEffect(() => {
    void fetchTanks();
  }, [fetchTanks]);

  // Export Sensor Readings CSV
  async function handleExportSensorCsv(overrideTankId?: string) {
    const targetTank = overrideTankId || sensorTankId;
    setIsExportingSensor(true);
    try {
      const params = new URLSearchParams();
      if (targetTank !== "ALL") {
        params.set("tankId", targetTank);
      }
      params.set("interval", sensorInterval);
      if (sensorStartDate) params.set("startDate", sensorStartDate);
      if (sensorEndDate) params.set("endDate", sensorEndDate);

      const url = `/api/reports/readings/export?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Could not download the sensor CSV.");

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `sensor-report-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch {
      alert("Could not download the sensor telemetry CSV.");
    } finally {
      setIsExportingSensor(false);
    }
  }

  // Export Alert Logs CSV
  async function handleExportAlertCsv(overrideLevel?: string) {
    const targetLevel = overrideLevel || alertSeverity;
    setIsExportingAlert(true);
    try {
      const params = new URLSearchParams();
      if (targetLevel !== "ALL") params.set("level", targetLevel);
      if (alertStartDate) params.set("startDate", alertStartDate);
      if (alertEndDate) params.set("endDate", alertEndDate);

      const url = `/api/reports/alerts/export?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Could not download the alert CSV.");

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `alert-incidents-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch {
      alert("Could not download the alert summary CSV.");
    } finally {
      setIsExportingAlert(false);
    }
  }

  return (
    <section className={styles.page}>
      <header className={styles.heading}>
        <h1>Reports</h1>
      </header>

      <div className={`${styles.breadcrumb} app-breadcrumb`}>
        <span>
          <BreadcrumbIcon size={16} aria-hidden="true" /><Link href="/">Dashboard</Link> &gt; Reports
        </span>
        <span>
          Updated just now ·{" "}
          <button
            type="button"
            onClick={() => {
              void fetchTanks();
            }}
          >
            <RefreshCw size={13} /> Reload
          </button>
        </span>
      </div>

      <div className={styles.contentGrid}>
        {/* Left Column: Hero & Forms */}
        <div className={styles.leftCol}>
          {/* Top Banner Hero Card */}
          <div className={styles.heroCard}>
            <div className={styles.heroContent}>
              <div className={styles.heroIconBox}>
                <FileText size={28} />
              </div>
              <div className={styles.heroText}>
                <h2>Water Monitoring Reports</h2>
                <p>
                  View and download monitoring reports for the hospital water system.
                </p>
              </div>
            </div>
            <div className={styles.heroGraphic} aria-hidden="true">
              <svg width="84" height="60" viewBox="0 0 84 60" fill="none">
                <rect x="2" y="16" width="36" height="40" rx="6" fill="#0077b6" opacity="0.85" />
                <rect x="46" y="10" width="36" height="46" rx="6" fill="#0284c7" opacity="0.95" />
                <path d="M38 32H46M38 42H46" stroke="#93c5fd" strokeWidth="3" strokeLinecap="round" />
                <line x1="20" y1="56" x2="20" y2="60" stroke="#0077b6" strokeWidth="4" />
                <line x1="64" y1="56" x2="64" y2="60" stroke="#0284c7" strokeWidth="4" />
              </svg>
            </div>
          </div>

          {/* Form 1: Sensor Readings Export */}
          <div className={styles.formCard}>
            <div className={styles.cardHeader}>
              <div className={`${styles.cardIconBox} ${styles.sensor}`}>
                <FileSpreadsheet size={20} />
              </div>
              <div>
                <h3>Sensor Readings Export (CSV)</h3>
                <p>Water level, volume, and pressure history</p>
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="sensor-tank-target">Target Tank</label>
              <ReportSelect id="sensor-tank-target" value={sensorTankId} onChange={setSensorTankId} options={[{ value: "ALL", label: "All Tanks" }, ...tanks.map((tank) => ({ value: tank.id, label: tank.name }))]} />
            </div>

            <div className={styles.rowFields}>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Start Date</span>
                <DashboardDatePicker label="Start Date" mode="single" value={{ startDate: sensorStartDate, endDate: sensorStartDate }} onChange={(range) => setSensorStartDate(range.startDate)} triggerClassName={styles.reportDateButton}>
                  <CalendarDays size={17} aria-hidden="true" />
                  <span>{sensorStartDate || "Select Date"}</span>
                  <ChevronDown size={16} aria-hidden="true" />
                </DashboardDatePicker>
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>End Date</span>
                <DashboardDatePicker label="End Date" mode="single" value={{ startDate: sensorEndDate, endDate: sensorEndDate }} onChange={(range) => setSensorEndDate(range.startDate)} triggerClassName={styles.reportDateButton}>
                  <CalendarDays size={17} aria-hidden="true" />
                  <span>{sensorEndDate || "Select Date"}</span>
                  <ChevronDown size={16} aria-hidden="true" />
                </DashboardDatePicker>
              </div>
            </div>

            <div className={styles.intervalGroup}>
              <label>Telemetry Reading Interval</label>
              <div className={styles.intervalButtons}>
                <button
                  type="button"
                  className={`${styles.intervalBtn} ${sensorInterval === "10m" ? styles.active : ""}`}
                  onClick={() => setSensorInterval("10m")}
                >
                  10 Minutes
                </button>
                <button
                  type="button"
                  className={`${styles.intervalBtn} ${sensorInterval === "1h" ? styles.active : ""}`}
                  onClick={() => setSensorInterval("1h")}
                >
                  1 Hour
                </button>
                <button
                  type="button"
                  className={`${styles.intervalBtn} ${sensorInterval === "daily" ? styles.active : ""}`}
                  onClick={() => setSensorInterval("daily")}
                >
                  Daily
                </button>
              </div>
            </div>

            <button
              type="button"
              className={styles.downloadDarkBtn}
              onClick={() => void handleExportSensorCsv()}
              disabled={isExportingSensor}
            >
              <Download size={16} />
              <span>{isExportingSensor ? "Downloading..." : "Download Sensor CSV"}</span>
            </button>
          </div>

          {/* Form 2: Incident & Alert Logs Export */}
          <div className={styles.formCard}>
            <div className={styles.cardHeader}>
              <div className={`${styles.cardIconBox} ${styles.alert}`}>
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3>Incident &amp; Alert Logs Export (CSV)</h3>
                <p>System faults, critical low levels, and motor trips</p>
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="alert-severity-target">Severity</label>
              <ReportSelect id="alert-severity-target" value={alertSeverity} onChange={setAlertSeverity} options={[{ value: "ALL", label: "All Levels (Info, Warning, Critical)" }, { value: "INFO", label: "Info" }, { value: "WARNING", label: "Warning" }, { value: "CRITICAL", label: "Critical" }]} />
            </div>

            <div className={styles.rowFields}>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Start Date</span>
                <DashboardDatePicker label="Start Date" mode="single" value={{ startDate: alertStartDate, endDate: alertStartDate }} onChange={(range) => setAlertStartDate(range.startDate)} triggerClassName={styles.reportDateButton}>
                  <CalendarDays size={17} aria-hidden="true" />
                  <span>{alertStartDate || "Select Date"}</span>
                  <ChevronDown size={16} aria-hidden="true" />
                </DashboardDatePicker>
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>End Date</span>
                <DashboardDatePicker label="End Date" mode="single" value={{ startDate: alertEndDate, endDate: alertEndDate }} onChange={(range) => setAlertEndDate(range.startDate)} triggerClassName={styles.reportDateButton}>
                  <CalendarDays size={17} aria-hidden="true" />
                  <span>{alertEndDate || "Select Date"}</span>
                  <ChevronDown size={16} aria-hidden="true" />
                </DashboardDatePicker>
              </div>
            </div>

            <button
              type="button"
              className={styles.downloadDarkBtn}
              onClick={() => void handleExportAlertCsv()}
              disabled={isExportingAlert}
            >
              <FileSpreadsheet size={16} />
              <span>{isExportingAlert ? "Downloading..." : "Download Alert CSV"}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Scheduled Archive & SOP Info */}
        <div className={styles.rightCol}>
          <div className={styles.archiveCard}>
            <div className={styles.archiveHeader}>
              <h3>Scheduled Report Archive</h3>
              <button type="button" onClick={() => void handleExportSensorCsv()}>
                View All
              </button>
            </div>

            <div className={styles.archiveList}>
              <button
                type="button"
                className={styles.archiveItem}
                onClick={() => void handleExportSensorCsv()}
                title="Download weekly report"
              >
                <div className={styles.archiveLeft}>
                  <div className={styles.archiveFileIcon}>
                    <FileSpreadsheet size={16} />
                  </div>
                  <div className={styles.archiveMeta}>
                    <strong>Weekly_Sensor_Report_W37_2026.csv</strong>
                    <span>
                      2.4 MB · Today, 07:00 WIB · <span className={styles.readyBadge}>Ready</span>
                    </span>
                  </div>
                </div>
                <Download size={15} color="#94a3b8" />
              </button>

              <button
                type="button"
                className={styles.archiveItem}
                onClick={() => void handleExportAlertCsv("CRITICAL")}
                title="Download critical incident summary"
              >
                <div className={styles.archiveLeft}>
                  <div className={`${styles.archiveFileIcon} ${styles.warn}`}>
                    <AlertTriangle size={16} />
                  </div>
                  <div className={styles.archiveMeta}>
                    <strong>Critical_Incident_Summary_August_2026.csv</strong>
                    <span>
                      840 KB · 01 Sep 2026 · <span className={styles.readyBadge}>Ready</span>
                    </span>
                  </div>
                </div>
                <Download size={15} color="#94a3b8" />
              </button>

              <button
                type="button"
                className={styles.archiveItem}
                onClick={() => void handleExportSensorCsv()}
                title="Download surgical sterilization audit"
              >
                <div className={styles.archiveLeft}>
                  <div className={`${styles.archiveFileIcon} ${styles.blue}`}>
                    <FileText size={16} />
                  </div>
                  <div className={styles.archiveMeta}>
                    <strong>Surgical_Sterilization_Compliance_Audit_Q3.csv</strong>
                    <span>
                      1.1 MB · 28 Aug 2026 · <span className={styles.readyBadge}>Ready</span>
                    </span>
                  </div>
                </div>
                <Download size={15} color="#94a3b8" />
              </button>
            </div>
          </div>

          <div className={styles.infoCard}>
            <Info size={20} className={styles.infoIcon} />
            <div className={styles.infoContent}>
              <h4>Information</h4>
              <p>
                Telemetry exports are automatically recorded in Audit Logs in accordance with hospital accreditation and medical record standards.
              </p>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}