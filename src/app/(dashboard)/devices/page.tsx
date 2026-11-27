"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LuRadio as Radio,
  LuCpu as Cpu,
  LuRefreshCw as RefreshCw,
  LuSettings as BreadcrumbIcon,
  LuWifi as Wifi,
  LuWifiOff as WifiOff,
} from "react-icons/lu";
import type { ApiResponse, Gateway, SensorNode } from "@/types";
import {
  getSensorPresence,
  hasRecentContact,
  isNewerContact,
  mergeSensorStatus,
  sensorRealtimeEvent,
  type SensorContact,
  type SensorRealtimeEvent,
  type SensorStatusUpdate,
} from "@/lib/devicePresence";
import styles from "./devices.module.css";

async function fetchLiveList<T>(path: string, signal: AbortSignal): Promise<T[] | null> {
  try {
    const response = await fetch(path, { signal, cache: "no-store" });
    if (!response.ok) return null;
    const result: ApiResponse<T[]> = await response.json();
    return result.success && result.source !== "mock" && Array.isArray(result.data) ? result.data : null;
  } catch {
    return null;
  }
}

export default function DevicesPage() {
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [nodes, setNodes] = useState<SensorNode[]>([]);
  const [readingsBySensor, setReadingsBySensor] = useState(new Map<string, SensorContact>());
  const [liveReadings, setLiveReadings] = useState(new Map<string, SensorContact>());
  const [liveStatuses, setLiveStatuses] = useState(new Map<string, SensorStatusUpdate>());
  const [isLoading, setIsLoading] = useState(true);

  const [now, setNow] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    function receiveSensorUpdate(event: Event) {
      const update = (event as CustomEvent<SensorRealtimeEvent>).detail;
      if (update.type === "reading") {
        const reading = update.data;
        const id = reading.sensorNodeId;
        if (!id || !hasRecentContact(reading.recordedAt, Date.now())) return;
        setLiveReadings(previous => {
          if (!isNewerContact(reading.recordedAt, previous.get(id)?.recordedAt)) return previous;
          return new Map(previous).set(id, reading);
        });
      } else {
        const status = update.data;
        const key = status.identifier.toLowerCase();
        setLiveStatuses(previous => {
          if (!isNewerContact(status.lastSeen, previous.get(key)?.lastSeen)) return previous;
          return new Map(previous).set(key, status);
        });
      }
      setNow(Date.now());
    }

    window.addEventListener(sensorRealtimeEvent, receiveSensorUpdate);
    return () => window.removeEventListener(sensorRealtimeEvent, receiveSensorUpdate);
  }, []);

  const [reloadKey, setReloadKey] = useState(0);
  const [nodesUnavailable, setNodesUnavailable] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function fetchData() {
      try {
        const { signal } = controller;
        const [gatewayResult, nodeResult, readingResult] = await Promise.all([
          fetchLiveList<Gateway>("/api/gateways", signal),
          fetchLiveList<SensorNode>("/api/nodes", signal),
          fetchLiveList<{ reading: SensorContact | null }>("/api/readings/latest", signal),
        ]);
        if (controller.signal.aborted) return;
        setNow(Date.now());
        setGateways(gatewayResult ?? []);
        setNodes(nodeResult ?? []);
        setNodesUnavailable(nodeResult === null);
        const latest = new Map<string, SensorContact>();
        for (const { reading } of readingResult ?? []) {
          if (reading?.sensorNodeId) latest.set(reading.sensorNodeId, reading);
        }
        setReadingsBySensor(latest);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
          timer = setTimeout(fetchData, 15_000);
        }
      }
    }

    void fetchData();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [reloadKey]);

  return (
    <section className={styles.page}>
      <header className={styles.heading}>
        <h1>IoT Device Status</h1>
      </header>

      <div className={`${styles.breadcrumb} app-breadcrumb`}>
        <span>
          <BreadcrumbIcon size={16} aria-hidden="true" /><Link href="/">Dashboard</Link> &gt; Devices
        </span>
        <span>
          Updated just now ·{" "}
          <button
            type="button"
            onClick={() => {
              setIsLoading(true);
              setReloadKey(key => key + 1);
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
            const isOnline = gw.status === "online" && hasRecentContact(gw.lastHeartbeat, now);
            const lastSeen = gw.lastHeartbeat
              ? new Date(gw.lastHeartbeat).toLocaleString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Never active";

            return (
              <article key={gw.id} className={styles.gatewayCard}>
                <div className={styles.gatewayHeader}>
                  <div>
                    <h3>{gw.deviceCode || "RSA UGM Main Gateway"}</h3>
                    <p>DTEDI Building (Raspberry Pi 4)</p>
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
                    <span>LoRa Frequency</span>
                    <strong>915.0 MHz (SX1262)</strong>
                  </div>
                  <div>
                    <span>Last Connected</span>
                    <strong>{lastSeen}</strong>
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <p>{isLoading ? "Loading gateways..." : "No live gateway data."}</p>
        )}
      </div>

      <h2 className={styles.sectionTitle}>
        <Cpu size={18} /> Sensor Node Endpoints (STM32 + Ultrasonic)
      </h2>
      <div className={styles.tableCard}>
        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>SENSOR CODE</th>
                <th>CONNECTED TANK</th>
                <th>SENSOR TYPE</th>
                <th>STATUS</th>
                <th>LAST SEEN</th>
                <th>RSSI</th>
              </tr>
            </thead>
            <tbody>
              {nodes.length > 0 ? (
                nodes.map((node) => {
                  const updatedNode = mergeSensorStatus(
                    mergeSensorStatus(node, liveStatuses.get(node.id.toLowerCase())),
                    liveStatuses.get(node.deviceCode.toLowerCase()),
                  );
                  const storedReading = readingsBySensor.get(node.id);
                  const liveReading = liveReadings.get(node.id);
                  const reading = liveReading && liveReading.tankId === node.tankId &&
                    isNewerContact(liveReading.recordedAt, storedReading?.recordedAt)
                      ? liveReading
                      : storedReading;
                  const presence = getSensorPresence(updatedNode, reading, now);
                  const tankName = node.tankName || (node.tankId ? `Tank ${node.tankId}` : "Unassigned");
                  return (
                    <tr key={node.id}>
                      <td className={styles.deviceCode}>{node.deviceCode}</td>
                      <td style={{ fontWeight: 600 }}>{tankName}</td>
                      <td>{node.sensorType}</td>
                      <td>
                        <span className={presence.online ? styles.badgeOnline : styles.badgeOffline}>
                          {presence.label}
                        </span>
                      </td>
                      <td>
                        {presence.lastSeen
                          ? new Date(presence.lastSeen).toLocaleString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-"}
                      </td>
                      <td style={{ fontWeight: 600, color: "#0284c7" }}>
                        {presence.rssi != null ? `${presence.rssi} dBm` : "-"}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className={styles.emptyMessage}>
                    {isLoading ? "Loading sensor nodes..." : nodesUnavailable ? "Live sensor status unavailable." : "No sensor nodes registered."}
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
