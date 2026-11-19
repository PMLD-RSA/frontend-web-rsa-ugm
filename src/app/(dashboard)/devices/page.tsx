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

  async function loadData(signal?: AbortSignal) {
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
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();

    async function fetchData() {
      try {
        const [gwRes, nodeRes, tankRes] = await Promise.all([
          fetch("/api/gateways", { signal: controller.signal }),
          fetch("/api/nodes", { signal: controller.signal }),
          fetch("/api/tanks", { signal: controller.signal }),
        ]);

        const [gwData, nodeData, tankData] = await Promise.all([
          gwRes.json(),
          nodeRes.json(),
          tankRes.json(),
        ]);

        if (!ignore) {
          if (gwData.success && Array.isArray(gwData.data)) {
            setGateways(gwData.data);
          }
          if (nodeData.success && Array.isArray(nodeData.data)) {
            setNodes(nodeData.data);
          }
          if (tankData.success && Array.isArray(tankData.data)) {
            setTanks(tankData.data);
          }
        }
      } catch {
        // ignore
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void fetchData();

    return () => {
      ignore = true;
      controller.abort();
    };
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

      <div className={styles.breadcrumb}>
        <span>
          <Link href="/">Dashboard</Link> &gt; Devices
        </span>
        <span>
          Updated just now ·{" "}
          <button
            type="button"
            onClick={() => {
              setIsLoading(true);
              void loadData();
            }}
            disabled={isLoading}
          >
            <RefreshCw size={13} /> Reload
          </button>
        </span>
      </div>

      <h2 className={styles.sectionTitle}>
        <Radio size={18} /> Gateway Hub (Raspberry Pi &amp; Broker)
      </h2>
      <div className={styles.gatewayGrid}>
        {gateways.length > 0 ? (
          gateways.map((gw) => {
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
                    <h3>{gw.deviceCode || "Gateway Utama RSA UGM"}</h3>
                    <p>Atap Gedung Utama (Raspberry Pi 4)</p>
                  </div>
                  <span className={isOnline ? styles.badgeOnline : styles.badgeOffline}>
                    {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
                    {isOnline ? "Online" : "Offline"}
                  </span>
                </div>
                <div className={styles.gatewayDetails}>
                  <div>
                    <span>IP Address</span>
                    <strong>192.168.100.14</strong>
                  </div>
                  <div>
                    <span>Frekuensi LoRa</span>
                    <strong>915.0 MHz (SX1262)</strong>
                  </div>
                  <div>
                    <span>Terakhir Terhubung</span>
                    <strong>{lastSeen}</strong>
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <article className={styles.gatewayCard}>
            <div className={styles.gatewayHeader}>
              <div>
                <h3>Gateway Utama RSA UGM</h3>
                <p>Atap Gedung Utama (Raspberry Pi 4)</p>
              </div>
              <span className={styles.badgeOnline}>
                <Wifi size={12} /> Online
              </span>
            </div>
            <div className={styles.gatewayDetails}>
              <div>
                <span>IP Address</span>
                <strong>192.168.100.14</strong>
              </div>
              <div>
                <span>Frekuensi LoRa</span>
                <strong>915.0 MHz (SX1262)</strong>
              </div>
              <div>
                <span>Protokol</span>
                <strong>MQTT Mosquitto (Port 1883)</strong>
              </div>
            </div>
          </article>
        )}
      </div>

      <h2 className={styles.sectionTitle}>
        <Cpu size={18} /> Sensor Node Endpoints (STM32 + Ultrasonik)
      </h2>
      <div className={styles.tableCard}>
        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>KODE SENSOR</th>
                <th>TANGKI TERHUBUNG</th>
                <th>TIPE SENSOR</th>
                <th>STATUS</th>
                <th>PEMBACAAN TERAKHIR</th>
                <th>RSSI</th>
              </tr>
            </thead>
            <tbody>
              {nodes.length > 0 ? (
                nodes.map((node) => {
                  const isOnline = node.status === "active";
                  const tankName = node.tankId
                    ? tankNameMap.get(node.tankId) || `Tangki ${node.tankId}`
                    : "Belum dipetakan";
                  return (
                    <tr key={node.id}>
                      <td className={styles.deviceCode}>{node.deviceCode}</td>
                      <td style={{ fontWeight: 600 }}>{tankName}</td>
                      <td>Ultrasonic A02YYUW</td>
                      <td>
                        <span className={isOnline ? styles.badgeOnline : styles.badgeOffline}>
                          {isOnline ? "Aktif" : "Offline"}
                        </span>
                      </td>
                      <td>
                        {node.lastSeen
                          ? new Date(node.lastSeen).toLocaleString("id-ID", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-"}
                      </td>
                      <td style={{ fontWeight: 600, color: "#0284c7" }}>
                        {node.lastRssi != null ? `${node.lastRssi} dBm` : "-68 dBm"}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className={styles.emptyMessage}>
                    {isLoading ? "Memuat status node sensor..." : "Tidak ada sensor node terdaftar."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}