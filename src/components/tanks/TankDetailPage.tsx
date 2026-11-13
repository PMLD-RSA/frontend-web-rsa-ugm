"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { LuCircleCheck, LuTriangleAlert, LuCircleAlert } from "react-icons/lu";
import {
  LuBox as Box,
  LuChevronLeft as ChevronLeft,
  LuChevronRight as ChevronRight,
  LuDatabase as Database,
  LuDownload as Download,
  LuDroplets as Droplets,
  LuMapPin as MapPin,
  LuRadio as Radio,
  LuRefreshCw as RefreshCw,
} from "react-icons/lu";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  TankLevel,
  measurement,
  numeric,
  readingTime,
} from "@/components/dashboard/TankLevel";
import { downloadCsv } from "@/lib/downloadCsv";
import { getTankStatus } from "@/lib/dashboard";
import type { Alert, ApiResponse, Tank, WaterLevelReading } from "@/types";
import styles from "./TankDetailPage.module.css";

type Detail = Tank & {
  recentReadings?: WaterLevelReading[];
  recentAlerts?: Alert[];
};

function alertStatus(status: string | null | undefined) {
  const normalized = status?.trim().toLowerCase();
  if (normalized === "active") return "Aktif";
  if (normalized === "resolved") return "Selesai";
  return status?.trim() || "Tidak diketahui";
}

function activityDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime()))
    return { time: "—", date: "Tidak diketahui" };
  const today = new Date();
  return {
    time: date
      .toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
      .replace(".", ":"),
    date:
      date.toDateString() === today.toDateString()
        ? "Hari ini"
        : date.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
  };
}

export function TankDetailPage({ id }: { id: string }) {
  const [tank, setTank] = useState<Detail | null>(null);
  const [readings, setReadings] = useState<WaterLevelReading[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [historyState, setHistoryState] = useState<
    "loading" | "ready" | "error"
  >("loading");
  const [hours, setHours] = useState(24);
  const [activityPage, setActivityPage] = useState(0);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const response = await fetch(`/api/tanks/${encodeURIComponent(id)}`, {
          signal,
        });
        const result: ApiResponse<Detail> = await response.json();
        if (
          !response.ok ||
          !result.success ||
          result.source === "mock" ||
          !result.data
        )
          throw new Error();
        const data = result.data;
        const latestReading = data.recentReadings?.[0] ?? null;
        setTank({
          ...data,
          latestReading,
          activeAlert:
            data.recentAlerts?.find((alert) => alert.status === "active") ??
            null,
        });
        setActivityPage(0);
        setState("ready");
      } catch {
        if (!signal?.aborted) setState("error");
      }
    },
    [id],
  );

  const loadHistory = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const response = await fetch(
          `/api/tanks/${encodeURIComponent(id)}/readings?hours=${hours}&limit=1000`,
          { signal },
        );
        const result: ApiResponse<WaterLevelReading[]> = await response.json();
        if (
          !response.ok ||
          !result.success ||
          result.source === "mock" ||
          !Array.isArray(result.data)
        )
          throw new Error();
        setReadings(result.data);
        setHistoryState("ready");
      } catch {
        if (!signal?.aborted) {
          setReadings([]);
          setHistoryState("error");
        }
      }
    },
    [id, hours],
  );
  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => load(controller.signal));
    return () => controller.abort();
  }, [load]);
  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => loadHistory(controller.signal));
    return () => controller.abort();
  }, [loadHistory]);

  function download() {
    const rows = [
      ["Waktu", "Level (%)", "Volume (L)"],
      ...readings.map((reading) => [
        reading.recordedAt,
        reading.levelPercent,
        reading.volumeLiters,
      ]),
    ];
    downloadCsv(`tank-${id}-readings.csv`, rows);
  }

  const status = tank ? (getTankStatus(tank) ?? "UNKNOWN") : "UNKNOWN";
  const chart = readings
    .map((reading) => ({
      time: Date.parse(reading.recordedAt),
      level: numeric(reading.levelPercent),
    }))
    .filter((point) => Number.isFinite(point.time) && point.level !== null)
    .sort((a, b) => a.time - b.time);
  const chartDomain: [number | "dataMin", number | "dataMax"] =
    chart.length === 1
      ? [chart[0].time - 30 * 60_000, chart[0].time + 30 * 60_000]
      : ["dataMin", "dataMax"];
  const level = numeric(tank?.latestReading?.levelPercent);
  const minimum = numeric(tank?.minThresholdPercent);
  const alerts = tank?.recentAlerts ?? [];
  const activityPages = Math.max(1, Math.ceil(alerts.length / 3));
  const currentActivityPage = Math.min(activityPage, activityPages - 1);
  const visibleAlerts = alerts.slice(
    currentActivityPage * 3,
    currentActivityPage * 3 + 3,
  );
  const timeLabel = (timestamp: number) =>
    new Date(timestamp).toLocaleString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      ...(hours > 24 ? { day: "2-digit", month: "short" } : {}),
    });
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>{tank?.name ?? "Tank Details"}</h1>
        <button onClick={download} disabled={!readings.length}>
          <Download size={20} />
          Download All
        </button>
      </header>
      <div className={styles.breadcrumb}>
        <nav>
          <Link href="/">Dashboard</Link> &gt; <Link href="/tanks">Tanks</Link>{" "}
          &gt; {tank?.name ?? "Details"}
        </nav>
        <button
          onClick={() => {
            setState("loading");
            setHistoryState("loading");
            void load();
            void loadHistory();
          }}
        >
          <RefreshCw size={13} /> Reload
        </button>
      </div>
      {state === "loading" ? (
        <p className={styles.empty}>Loading tank details…</p>
      ) : state === "error" || !tank ? (
        <p className={styles.empty}>
          Tank data is unavailable. <Link href="/tanks">Back to tanks</Link>
        </p>
      ) : (
        <>
          <div className={styles.topGrid}>
            <section className={`${styles.panel} ${styles.pumpPanel}`}>
              <h2>Pump Status</h2>
              <div className={styles.pump}>
                <TankLevel tank={tank} flat />
                <div className={styles.pumpInfo}>
                  <strong className={styles.volume}>
                    {measurement(tank.latestReading?.volumeLiters, " L")}
                  </strong>
                  <p className={styles.capacity}>
                    of {measurement(tank.capacityLiters, " L")}
                  </p>
                  <span className={styles.badge} data-status={status}>
                    <i />
                    {status === "UNKNOWN" ? "NO DATA" : status}
                  </span>
                  <dl className={styles.statusLegend}>
                    <div>
                      <dt>
                        <LuCircleCheck
                          size={20}
                          color="#42a132"
                          aria-hidden="true"
                          focusable="false"
                        />
                        Normal
                      </dt>
                      <dd>
                        {minimum !== null && minimum > 60
                          ? `≥ ${measurement(minimum, "%")}`
                          : "> 60%"}
                      </dd>
                    </div>
                    <div>
                      <dt>
                        <LuTriangleAlert
                          size={20}
                          color="#eab308"
                          aria-hidden="true"
                          focusable="false"
                        />
                        Warning
                      </dt>
                      <dd>
                        {minimum === null
                          ? "Unavailable"
                          : minimum > 60
                            ? "—"
                            : `${measurement(minimum, "%")}–60%`}
                      </dd>
                    </div>
                    <div>
                      <dt>
                        <LuCircleAlert
                          size={20}
                          color="#ef4444"
                          aria-hidden="true"
                          focusable="false"
                        />
                        Critical
                      </dt>
                      <dd>&lt; {measurement(tank.minThresholdPercent, "%")}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </section>
            <section className={styles.panel}>
              <h2>Tank Information</h2>
              <div className={styles.infoGrid}>
                <div>
                  <Database size={17} />
                  <small>Tank name</small>
                  <strong>{tank.name}</strong>
                </div>
                <div>
                  <MapPin size={17} />
                  <small>Location</small>
                  <strong>{tank.location || "Unavailable"}</strong>
                </div>
                <div>
                  <Box size={17} />
                  <small>Capacity</small>
                  <strong>{measurement(tank.capacityLiters, " L")}</strong>
                </div>
                <div>
                  <Droplets size={17} />
                  <small>Volume</small>
                  <strong>
                    {measurement(tank.latestReading?.volumeLiters, " L")}
                  </strong>
                  <span className={styles.progress}>
                    <i
                      style={{
                        width: `${Math.max(0, Math.min(100, level ?? 0))}%`,
                      }}
                    />
                  </span>
                </div>
              </div>
              <div className={styles.sensor}>
                <span>
                  <Radio size={16} /> Sensor ultrasonik
                </span>
                <span>
                  Updated {readingTime(tank.latestReading?.recordedAt)}
                </span>
              </div>
            </section>
          </div>
          <div className={styles.bottomGrid}>
            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <h2>Water Level Tank</h2>
                <label>
                  Periode{" "}
                  <select
                    value={hours}
                    onChange={(event) => {
                      setHistoryState("loading");
                      setHours(Number(event.target.value));
                    }}
                  >
                    <option value={24}>24 jam</option>
                    <option value={72}>3 hari</option>
                    <option value={168}>7 hari</option>
                    <option value={720}>30 hari</option>
                  </select>
                </label>
              </div>
              {historyState === "loading" ? (
                <p className={styles.empty}>Memuat pembacaan sensor…</p>
              ) : historyState === "error" ? (
                <p className={styles.empty}>
                  Riwayat pembacaan tidak dapat dimuat. Periksa koneksi backend
                  lalu pilih Reload.
                </p>
              ) : !chart.length ? (
                <p className={styles.empty}>
                  Tidak ada pembacaan sensor pada periode ini.
                  {tank.latestReading?.recordedAt
                    ? ` Pembacaan terakhir: ${readingTime(tank.latestReading.recordedAt)}. Coba pilih periode yang lebih panjang.`
                    : " Pastikan sensor sudah mengirim data untuk tangki ini."}
                </p>
              ) : (
                <div className={styles.chart}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={chart}
                      margin={{ top: 15, right: 12, left: -20, bottom: 8 }}
                    >
                      <defs>
                        <linearGradient
                          id="tankWater"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#88c6e4"
                            stopOpacity={0.35}
                          />
                          <stop
                            offset="100%"
                            stopColor="#88c6e4"
                            stopOpacity={0.03}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#d8e0e7" strokeDasharray="2 3" />
                      <XAxis
                        dataKey="time"
                        type="number"
                        domain={chartDomain}
                        tickFormatter={timeLabel}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tickFormatter={(value) => `${value}%`}
                        tick={{ fontSize: 10 }}
                      />
                      <Tooltip
                        labelFormatter={(value) => timeLabel(Number(value))}
                        formatter={(value) => [`${value}%`, "Level"]}
                      />
                      <ReferenceLine
                        y={numeric(tank.minThresholdPercent) ?? undefined}
                        stroke="#ee5454"
                        strokeDasharray="4 3"
                      />
                      <Area
                        type="monotone"
                        dataKey="level"
                        stroke="#83bddb"
                        fill="url(#tankWater)"
                        strokeWidth={2}
                        dot={
                          chart.length === 1 ? { r: 5, fill: "#83bddb" } : false
                        }
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>
            <section className={`${styles.panel} ${styles.activityPanel}`}>
              <div className={styles.panelHeader}>
                <h2>Log Aktivitas Tangki</h2>
              </div>
              <div className={styles.activityHead}>
                <span>Waktu</span>
                <span>Aktivitas</span>
                <span>Level air</span>
              </div>
              {alerts.length ? (
                <>
                  <div className={styles.activityList} aria-live="polite">
                    {visibleAlerts.map((alert) => {
                      const date = activityDate(alert.createdAt);
                      return (
                        <div className={styles.activity} key={alert.id}>
                          <time dateTime={alert.createdAt}>
                            <strong>{date.time}</strong>
                            <small>{date.date}</small>
                          </time>
                          <div>
                            <span
                              className={styles.alertTag}
                              data-level={alert.level}
                            >
                              {alert.level === "CRITICAL"
                                ? "Kritis"
                                : "Peringatan"}
                            </span>
                            <strong className={styles.activityTitle}>
                              {alert.level === "CRITICAL"
                                ? "Peringatan Level Air Kritis"
                                : "Peringatan Level Air"}
                            </strong>
                            <p>{alert.message}</p>
                            <small className={styles.activityStatus}>
                              Status: {alertStatus(alert.status)}
                            </small>
                          </div>
                          <strong
                            className={styles.activityLevel}
                            aria-label="Level air tidak tersedia"
                          >
                            —
                          </strong>
                        </div>
                      );
                    })}
                  </div>
                  {activityPages > 1 && (
                    <nav
                      className={styles.activityPagination}
                      aria-label="Halaman riwayat peringatan"
                    >
                      <button
                        type="button"
                        aria-label="Halaman sebelumnya"
                        disabled={currentActivityPage === 0}
                        onClick={() => setActivityPage(currentActivityPage - 1)}
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <span>
                        Halaman {currentActivityPage + 1} dari {activityPages}
                      </span>
                      <button
                        type="button"
                        aria-label="Halaman berikutnya"
                        disabled={currentActivityPage >= activityPages - 1}
                        onClick={() => setActivityPage(currentActivityPage + 1)}
                      >
                        <ChevronRight size={18} />
                      </button>
                    </nav>
                  )}
                </>
              ) : (
                <p className={styles.empty}>
                  Belum ada riwayat peringatan untuk tangki ini.
                </p>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
