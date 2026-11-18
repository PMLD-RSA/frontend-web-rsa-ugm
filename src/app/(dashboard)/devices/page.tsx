"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LuRadio as Radio,
  LuCpu as Cpu,
  LuRefreshCw as RefreshCw,
  LuWifi as Wifi,
  LuWifiOff as WifiOff,
} from "react-icons/lu";
import { Gateway, SensorNode, Tank } from "@/types";
import styles from "./devices.module.css";

export default function DevicesPage() {
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [nodes, setNodes] = useState<SensorNode[]>([]);
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadData(signal?: AbortSignal) {
    setIsLoading(true);
    setError(null);
    try {
      const [gwRes, nodeRes, tankRes] = await Promise.all([
        fetch("/api/gateways", { signal }),
        fetch("/api/nodes", { signal }),
        fetch("/api/tanks", { signal }),
      ]);

      const [gwData, nodeData, tankData] = await Promise.all([
        gwRes.json(),
        nodeRes.json(),
        tankRes.json(),
      ]);

      if (gwData.success && Array.isArray(gwData.data)) {
        setGateways(gwData.data);
      }
      if (nodeData.success && Array.isArray(nodeData.data)) {
        setNodes(nodeData.data);
      }
      if (tankData.success && Array.isArray(tankData.data)) {
        setTanks(tankData.data);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError("Gagal memuat status perangkat IoT.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    void loadData(controller.signal);
    return () => controller.abort();
  }, []);

  const tankNameMap = new Map<string, string>();
  for (const t of tanks) {
    tankNameMap.set(t.id, t.name);
  }

  return (
    <section className={styles.page}>
      <header className={styles.heading}>
        <h1>Status Perangkat IoT</h1>
      </header>

      <div className={styles.meta}>
        <span>
          <Link href="/">Dashboard</Link> &gt; Devices
        </span>
        <button
          type="button"
          onClick={() => void loadData()}
          disabled={isLoading}
        >
          <RefreshCw size={13} /> Muat Ulang
        </button>
      </div>

      <h2 className={styles.sectionTitle}>Gateway Hub (Raspberry Pi)</h2>
      <div className={styles.gatewayGrid}>
        {gateways.map((gw) => {
          const isOnline = gw.status === "online";
          const lastSeen = gw.lastHeartbeat
            ? new Date(gw.lastHeartbeat).toLocaleString("id-ID", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "Belum pernah aktif";

          return (
            <article key={gw.id} className={styles.gatewayCard}>
              <div className={styles.gatewayHeader}>
                <div>
                  <h3>{gw.deviceCode}</h3>
                  <p>LoRa-to-MQTT Bridge Hub</p>
                </div>
                {isOnline ? (
                  <span className={styles.badgeOnline}>
                    <Wifi size={13} /> Online
                  </span>
                ) : (
                  <span className={styles.badgeOffline}>
                    <WifiOff size={13} /> Offline
                  </span>
                )}
              </div>
              <div className={styles.gatewayDetails}>
                <div>
                  <span>Node Terhubung</span>
                  <strong>{gw.nodes?.length ?? nodes.length} Node</strong>
                </div>
                <div>
                  <span>Heartbeat Terakhir</span>
                  <strong>{lastSeen}</strong>
                </div>
              </div>
            </article>
          );
        })}
        {!gateways.length && !isLoading && (
          <p className={styles.emptyMessage}>Tidak ada gateway yang terdaftar.</p>
        )}
      </div>

      <h2 className={styles.sectionTitle}>Modul Sensor Node (STM32 + LoRa)</h2>
      <div
        tabIndex={0}
        role="region"
        aria-label="Tabel Status Sensor Node"
        className={styles.tableWrap}
      >
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Kode Node</th>
              <th>Tipe Sensor</th>
              <th>Tangki Terpasang</th>
              <th>Status</th>
              <th>Kekuatan Sinyal (RSSI)</th>
              <th>Waktu Terakhir Dilihat</th>
            </tr>
          </thead>
          <tbody>
            {nodes.map((node, index) => {
              const tankName = node.tankId
                ? tankNameMap.get(node.tankId) || `Tangki ${node.tankId.slice(0, 8)}`
                : "Belum Ditautkan";
              const lastSeen = node.lastSeen
                ? new Date(node.lastSeen).toLocaleString("id-ID", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "-";

              const rssi = node.lastRssi ?? null;
              let signalColor = "#94a3b8";
              if (rssi !== null) {
                if (rssi >= -70) signalColor = "#16a34a"; // Kuat
                else if (rssi >= -90) signalColor = "#d97706"; // Sedang
                else signalColor = "#dc2626"; // Lemah
              }

              return (
                <tr key={node.id}>
                  <td>{String(index + 1).padStart(2, "0")}</td>
                  <td>
                    <strong>{node.deviceCode}</strong>
                  </td>
                  <td>
                    <span style={{ textTransform: "capitalize" }}>
                      {node.sensorType || "Ultrasonik"}
                    </span>
                  </td>
                  <td>{tankName}</td>
                  <td>
                    {node.status === "active" ? (
                      <span className={styles.badgeOnline}>Aktif</span>
                    ) : (
                      <span className={styles.badgeOffline}>{node.status}</span>
                    )}
                  </td>
                  <td>
                    <div className={styles.signalBar}>
                      <span style={{ color: signalColor, fontWeight: 600 }}>
                        {rssi !== null ? `${rssi} dBm` : "-"}
                      </span>
                    </div>
                  </td>
                  <td>{lastSeen}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!nodes.length && (
          <div className={styles.emptyMessage}>
            <Radio size={36} color="#94a3b8" style={{ margin: "0 auto 12px" }} />
            <p>
              {isLoading
                ? "Memuat data node sensor..."
                : error
                ? error
                : "Belum ada node sensor yang terhubung."}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
