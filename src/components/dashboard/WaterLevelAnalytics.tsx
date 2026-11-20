"use client";

import { useEffect, useMemo, useState } from "react";
import { LuDroplets as Droplets } from "react-icons/lu";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { WaterLevelReading, ApiResponse } from "@/types";
import { useTankStore } from "@/stores/tankStore";
import styles from "./WaterLevelAnalytics.module.css";

export function WaterLevelAnalytics() {
  const tanks = useTankStore(state => state.tanks);
  // Analytics Chart State
  const [chartTankId, setChartTankId] = useState<string>("ALL");
  const [chartPeriod, setChartPeriod] = useState<string>("24");
  const [readings, setReadings] = useState<WaterLevelReading[]>([]);
  const [isLoadingChart, setIsLoadingChart] = useState<boolean>(true);

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
  );
}
