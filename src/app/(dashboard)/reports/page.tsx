"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import {
  LuDownload as Download,
  LuFileSpreadsheet as FileSpreadsheet,
  LuFileText as FileText,
  LuRefreshCw as RefreshCw,
  LuDroplets as Droplets,
  LuInfo as Info,
  LuTriangleAlert as AlertTriangle,
} from "react-icons/lu";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useTankStore } from "@/stores/tankStore";
import { WaterLevelReading, ApiResponse } from "@/types";
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

  // Analytics Chart State
  const [chartTankId, setChartTankId] = useState<string>("ALL");
  const [chartPeriod, setChartPeriod] = useState<string>("24");
  const [readings, setReadings] = useState<WaterLevelReading[]>([]);
  const [isLoadingChart, setIsLoadingChart] = useState<boolean>(true);

  useEffect(() => {
    void fetchTanks();
  }, [fetchTanks]);

  const loadReportData = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const hours = chartPeriod;
        let url = `/api/readings/history?hours=${hours}`;
        if (chartTankId !== "ALL") {
          url = `/api/tanks/${encodeURIComponent(chartTankId)}/readings?hours=${hours}&limit=500`;
        }
        const res = await fetch(url, { signal });
        const result: ApiResponse<WaterLevelReading[]> = await res.json();
        if (res.ok && result.success && Array.isArray(result.data)) {
          setReadings(result.data);
        } else {
          setReadings([]);
        }
      } catch {
        setReadings([]);
      } finally {
        setIsLoadingChart(false);
      }
    },
    [chartPeriod, chartTankId]
  );

  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();

    async function fetchChartData() {
      try {
        const hours = chartPeriod;
        let url = `/api/readings/history?hours=${hours}`;
        if (chartTankId !== "ALL") {
          url = `/api/tanks/${encodeURIComponent(chartTankId)}/readings?hours=${hours}&limit=500`;
        }
        const res = await fetch(url, { signal: controller.signal });
        const result: ApiResponse<WaterLevelReading[]> = await res.json();
        if (!ignore) {
          if (res.ok && result.success && Array.isArray(result.data)) {
            setReadings(result.data);
          } else {
            setReadings([]);
          }
        }
      } catch {
        if (!ignore) setReadings([]);
      } finally {
        if (!ignore) setIsLoadingChart(false);
      }
    }

    void fetchChartData();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [chartPeriod, chartTankId]);

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

  // Process data for Recharts area chart
  const chartData = useMemo(() => {
    if (!readings.length) return [];

    const timeMap = new Map<number, { sumLevel: number; sumVolume: number; count: number }>();
    for (const r of readings) {
      const rawTime = new Date(r.recordedAt).getTime();
      const level = Number(r.levelPercent);
      const volume = Number(r.volumeLiters);
      if (Number.isFinite(rawTime) && Number.isFinite(level)) {
        const roundedTime = Math.floor(rawTime / 1000) * 1000;
        const existing = timeMap.get(roundedTime);
        if (existing) {
          existing.sumLevel += level;
          existing.sumVolume += Number.isFinite(volume) ? volume : 0;
          existing.count += 1;
        } else {
          timeMap.set(roundedTime, {
            sumLevel: level,
            sumVolume: Number.isFinite(volume) ? volume : 0,
            count: 1,
          });
        }
      }
    }

    return Array.from(timeMap.entries())
      .map(([time, data]) => ({
        time,
        level: Number((data.sumLevel / data.count).toFixed(1)),
        volume: Math.round(data.sumVolume / data.count),
      }))
      .sort((a, b) => a.time - b.time);
  }, [readings]);

  // Summary statistics
  const stats = useMemo(() => {
    if (!readings.length) {
      return { avgLevel: "-", avgVolume: "-", minLevel: "-", count: 0 };
    }
    let totalLevel = 0;
    let totalVolume = 0;
    let minL = 100;
    let validCount = 0;

    for (const r of readings) {
      const l = Number(r.levelPercent);
      const v = Number(r.volumeLiters);
      if (Number.isFinite(l) && Number.isFinite(v)) {
        totalLevel += l;
        totalVolume += v;
        if (l < minL) minL = l;
        validCount++;
      }
    }

    if (!validCount) {
      return { avgLevel: "-", avgVolume: "-", minLevel: "-", count: 0 };
    }

    return {
      avgLevel: `${(totalLevel / validCount).toFixed(1)}%`,
      avgVolume: `${Math.round(totalVolume / validCount).toLocaleString("id-ID")} L`,
      minLevel: `${minL.toFixed(1)}%`,
      count: validCount,
    };
  }, [readings]);

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
              setIsLoadingChart(true);
              void loadReportData();
            }}
            disabled={isLoadingChart}
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

      {/* Retained Analytics Section */}
      <div className={styles.analyticsSection}>
        <div className={styles.analyticsHeader}>
          <h2>Grafik Fluktuasi &amp; Analitik Ketinggian Air</h2>
          <div className={styles.analyticsControls}>
            <select
              aria-label="Pilih tangki untuk analitik"
              value={chartTankId}
              onChange={(e) => {
                setIsLoadingChart(true);
                setChartTankId(e.target.value);
              }}
            >
              <option value="ALL">Semua Tangki</option>
              {tanks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <select
              aria-label="Pilih periode riwayat"
              value={chartPeriod}
              onChange={(e) => {
                setIsLoadingChart(true);
                setChartPeriod(e.target.value);
              }}
            >
              <option value="24">24 Jam Terakhir</option>
              <option value="72">3 Hari Terakhir</option>
              <option value="168">7 Hari Terakhir</option>
              <option value="720">30 Hari Terakhir</option>
            </select>
          </div>
        </div>

        <div className={styles.summary}>
          <div>
            <span>Rata-rata Level</span>
            <strong>{stats.avgLevel}</strong>
            <small>Persentase ketinggian air</small>
          </div>
          <div>
            <span>Rata-rata Volume</span>
            <strong>{stats.avgVolume}</strong>
            <small>Kapasitas air tersimpan</small>
          </div>
          <div>
            <span>Titik Terendah</span>
            <strong style={{ color: "#b91c1c" }}>{stats.minLevel}</strong>
            <small>Level air minimum pada periode</small>
          </div>
          <div>
            <span>Total Titik Data</span>
            <strong>{stats.count}</strong>
            <small>Log pembacaan sensor</small>
          </div>
        </div>

        {chartData.length > 0 ? (
          <div className={styles.chartWrap}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="reportWaterGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0077b6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0077b6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="time"
                  type="number"
                  scale="time"
                  domain={["dataMin", "dataMax"]}
                  minTickGap={40}
                  interval="preserveStartEnd"
                  tickFormatter={(t) =>
                    new Date(t).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                      ...(Number(chartPeriod) > 24 ? { month: "short", day: "numeric" } : {}),
                    })
                  }
                  tick={{ fontSize: 11, fill: "#64748b" }}
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                />
                <Tooltip
                  labelFormatter={(t) =>
                    new Date(Number(t)).toLocaleString("id-ID", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  }
                  formatter={(v) => [`${Number(v).toFixed(1)}%`, "Level Air"]}
                />
                <Area
                  type="monotone"
                  dataKey="level"
                  stroke="#0077b6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#reportWaterGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className={styles.emptyMessage}>
            <Droplets size={36} color="#94a3b8" style={{ margin: "0 auto 12px" }} />
            <p>
              {isLoadingChart
                ? "Memuat visualisasi laporan..."
                : "Tidak ada data pembacaan sensor pada periode ini."}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}