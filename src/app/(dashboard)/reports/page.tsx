"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LuDownload as Download,
  LuFileSpreadsheet as FileSpreadsheet,
  LuFileText as FileText,
  LuRefreshCw as RefreshCw,
  LuInfo as Info,
  LuTriangleAlert as AlertTriangle,
} from "react-icons/lu";
import { useTankStore } from "@/stores/tankStore";
import styles from "./reports.module.css";

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
      } else if (tanks.length > 0) {
        // Jika ALL, ekspor tangki pertama atau keseluruhan
        params.set("tankId", tanks[0].id);
      }
      if (sensorStartDate) params.set("startDate", sensorStartDate);
      if (sensorEndDate) params.set("endDate", sensorEndDate);

      const url = `/api/reports/readings/export?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Gagal mengunduh CSV sensor.");

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `laporan-sensor-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch {
      alert("Gagal mengunduh berkas CSV telemetri sensor.");
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
      if (!response.ok) throw new Error("Gagal mengunduh CSV alert.");

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `rekap-insiden-alert-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch {
      alert("Gagal mengunduh berkas CSV rekap alert.");
    } finally {
      setIsExportingAlert(false);
    }
  }

  return (
    <section className={styles.page}>
      <header className={styles.heading}>
        <h1>Reports</h1>
      </header>

      <div className={styles.breadcrumb}>
        <span>
          <Link href="/">Dashboard</Link> &gt; Reports
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
                  Lihat dan unduh laporan pemantauan sistem air rumah sakit secara lengkap dan
                  rinci.
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
                <p>Histori ketinggian, volume, &amp; tekanan air</p>
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="sensor-tank-target">Target Tangki</label>
              <select
                id="sensor-tank-target"
                value={sensorTankId}
                onChange={(e) => setSensorTankId(e.target.value)}
              >
                <option value="ALL">
                  Semua Tangki ({tanks.map((t) => t.name).join(", ") || "Semua"})
                </option>
                {tanks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.rowFields}>
              <div className={styles.field}>
                <label htmlFor="sensor-start-date">Rentang Mulai</label>
                <input
                  id="sensor-start-date"
                  type="date"
                  value={sensorStartDate}
                  onChange={(e) => setSensorStartDate(e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="sensor-end-date">Rentang Selesai</label>
                <input
                  id="sensor-end-date"
                  type="date"
                  value={sensorEndDate}
                  onChange={(e) => setSensorEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.intervalGroup}>
              <label>Interval Pembacaan Telemetri</label>
              <div className={styles.intervalButtons}>
                <button
                  type="button"
                  className={`${styles.intervalBtn} ${sensorInterval === "10m" ? styles.active : ""}`}
                  onClick={() => setSensorInterval("10m")}
                >
                  10 Menit
                </button>
                <button
                  type="button"
                  className={`${styles.intervalBtn} ${sensorInterval === "1h" ? styles.active : ""}`}
                  onClick={() => setSensorInterval("1h")}
                >
                  1 Jam
                </button>
                <button
                  type="button"
                  className={`${styles.intervalBtn} ${sensorInterval === "daily" ? styles.active : ""}`}
                  onClick={() => setSensorInterval("daily")}
                >
                  Harian
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
              <span>{isExportingSensor ? "Mengunduh..." : "Download Sensor CSV"}</span>
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
                <p>Rekap gangguan sistem, critical low, &amp; trip motor</p>
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="alert-severity-target">Tingkat Keparahan (Severity)</label>
              <select
                id="alert-severity-target"
                value={alertSeverity}
                onChange={(e) => setAlertSeverity(e.target.value)}
              >
                <option value="ALL">Semua Level (Info, Warning, Critical)</option>
                <option value="CRITICAL">Critical</option>
                <option value="WARNING">Warning</option>
              </select>
            </div>

            <div className={styles.rowFields}>
              <div className={styles.field}>
                <label htmlFor="alert-start-date">Dari Tanggal</label>
                <input
                  id="alert-start-date"
                  type="date"
                  value={alertStartDate}
                  onChange={(e) => setAlertStartDate(e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="alert-end-date">Sampai Tanggal</label>
                <input
                  id="alert-end-date"
                  type="date"
                  value={alertEndDate}
                  onChange={(e) => setAlertEndDate(e.target.value)}
                />
              </div>
            </div>

            <button
              type="button"
              className={styles.downloadDarkBtn}
              onClick={() => void handleExportAlertCsv()}
              disabled={isExportingAlert}
            >
              <FileSpreadsheet size={16} />
              <span>{isExportingAlert ? "Mengunduh..." : "Download Alert CSV"}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Scheduled Archive & SOP Info */}
        <div className={styles.rightCol}>
          <div className={styles.archiveCard}>
            <div className={styles.archiveHeader}>
              <h3>Arsip Laporan Terjadwal</h3>
              <button type="button" onClick={() => void handleExportSensorCsv()}>
                Lihat Semua
              </button>
            </div>

            <div className={styles.archiveList}>
              <button
                type="button"
                className={styles.archiveItem}
                onClick={() => void handleExportSensorCsv()}
                title="Klik untuk unduh laporan mingguan"
              >
                <div className={styles.archiveLeft}>
                  <div className={styles.archiveFileIcon}>
                    <FileSpreadsheet size={16} />
                  </div>
                  <div className={styles.archiveMeta}>
                    <strong>Laporan_Sensor_Mingguan_W37_2026.csv</strong>
                    <span>
                      2.4 MB · Hari ini, 07:00 WIB · <span className={styles.readyBadge}>Ready</span>
                    </span>
                  </div>
                </div>
                <Download size={15} color="#94a3b8" />
              </button>

              <button
                type="button"
                className={styles.archiveItem}
                onClick={() => void handleExportAlertCsv("CRITICAL")}
                title="Klik untuk unduh rekap insiden kritis"
              >
                <div className={styles.archiveLeft}>
                  <div className={`${styles.archiveFileIcon} ${styles.warn}`}>
                    <AlertTriangle size={16} />
                  </div>
                  <div className={styles.archiveMeta}>
                    <strong>Rekap_Insiden_Kritis_Agustus_2026.csv</strong>
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
                title="Klik untuk unduh audit sterilisasi bedah"
              >
                <div className={styles.archiveLeft}>
                  <div className={`${styles.archiveFileIcon} ${styles.blue}`}>
                    <FileText size={16} />
                  </div>
                  <div className={styles.archiveMeta}>
                    <strong>Audit_Kepatuhan_Sterilisasi_Bedah_Q3.csv</strong>
                    <span>
                      1.1 MB · 28 Agu 2026 · <span className={styles.readyBadge}>Ready</span>
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
              <h4>Informasi</h4>
              <p>
                Seluruh ekspor data telemetri disimpan dan tercatat otomatis di Audit Logs sesuai
                standar akreditasi dan regulasi rekam medik RS.
              </p>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}