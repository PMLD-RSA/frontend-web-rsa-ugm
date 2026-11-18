"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  LuDownload as Download,
  LuFileSpreadsheet as FileSpreadsheet,
  LuFileText as FileText,
  LuRefreshCw as RefreshCw,
  LuDroplets as Droplets,
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
  const [selectedTankId, setSelectedTankId] = useState<string>("ALL");
  const [period, setPeriod] = useState<string>("24");
  const [readings, setReadings] = useState<WaterLevelReading[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    void fetchTanks();
  }, [fetchTanks]);

  async function loadReportData(signal?: AbortSignal) {
    setIsLoading(true);
    try {
      const hours = period;
      let url = `/api/readings/history?hours=${hours}`;
      if (selectedTankId !== "ALL") {
        url = `/api/tanks/${encodeURIComponent(selectedTankId)}/readings?hours=${hours}&limit=500`;
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
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    void loadReportData(controller.signal);
    return () => controller.abort();
  }, [selectedTankId, period]);

  const chartData = useMemo(() => {
    return readings
      .map((r) => ({
        time: new Date(r.recordedAt).getTime(),
        level: Number(r.levelPercent),
        volume: Number(r.volumeLiters),
      }))
      .filter((p) => Number.isFinite(p.time) && Number.isFinite(p.level))
      .sort((a, b) => a.time - b.time);
  }, [readings]);

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

  async function handleExportCsv() {
    setIsExporting(true);
    try {
      const tankQuery = selectedTankId !== "ALL" ? `tankId=${encodeURIComponent(selectedTankId)}` : "";
      const url = `/api/reports/readings/export${tankQuery ? `?${tankQuery}` : ""}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Gagal mengunduh CSV");

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `laporan-sensor-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err: unknown) {
      alert("Gagal mengunduh berkas CSV laporan.");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <section className={styles.page}>
      <header className={styles.heading}>
        <h1>Laporan &amp; Analitik</h1>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.downloadPrimary}
            onClick={handleExportCsv}
            disabled={isExporting}
          >
            <FileSpreadsheet size={18} />
            <span>{isExporting ? "Mengunduh..." : "Download CSV Sensor"}</span>
          </button>
        </div>
      </header>

      <div className={styles.meta}>
        <span>
          <Link href="/">Dashboard</Link> &gt; Reports
        </span>
        <button
          type="button"
          onClick={() => void loadReportData()}
          disabled={isLoading}
        >
          <RefreshCw size={13} /> Muat Ulang
        </button>
      </div>

      <div className={styles.filterPanel}>
        <div className={styles.filterGrid}>
          <div className={styles.field}>
            <label htmlFor="tank-selector">Pilih Tangki</label>
            <select
              id="tank-selector"
              value={selectedTankId}
              onChange={(e) => setSelectedTankId(e.target.value)}
            >
              <option value="ALL">Semua Tangki</option>
              {tanks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="period-selector">Periode Riwayat</label>
            <select
              id="period-selector"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option value="24">24 Jam Terakhir</option>
              <option value="72">3 Hari Terakhir</option>
              <option value="168">7 Hari Terakhir</option>
              <option value="720">30 Hari Terakhir</option>
            </select>
          </div>
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

      <div className={styles.chartPanel}>
        <div className={styles.chartHeader}>
          <h2>Grafik Fluktuasi Ketinggian Air</h2>
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
                  tickFormatter={(t) =>
                    new Date(t).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                      ...(Number(period) > 24 ? { month: "short", day: "numeric" } : {}),
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
            <p>{isLoading ? "Memuat visualisasi laporan..." : "Tidak ada data pembacaan sensor pada periode ini."}</p>
          </div>
        )}
      </div>
    </section>
  );
}
