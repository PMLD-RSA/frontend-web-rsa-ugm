import { WebSocketServer, WebSocket } from "ws";
import fs from "node:fs";
import path from "node:path";

// Muat .env.local jika ada
const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  try {
    process.loadEnvFile(envLocalPath);
  } catch {
    // Abaikan jika tidak didukung
  }
}

const isServerMode = process.argv.includes("--server") || process.argv.includes("-s");
const BACKEND_HTTP = process.env.CORE_BACKEND_URL || "http://localhost:8000";
const BACKEND_WS = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws";
const SIM_PORT = parseInt(process.env.SIM_PORT || "8001", 10);

if (isServerMode) {
  runMockServer();
} else {
  runClientSimulation();
}

// ==========================================
// 1. MOCK WEBSOCKET SERVER SIMULATION
// ==========================================
function runMockServer() {
  console.log("=== MEMULAI MOCK WEBSOCKET SERVER SIMULATOR ===");
  console.log(`Menjalankan WebSocket Server di port ${SIM_PORT}...`);
  console.log(`URL koneksi frontend: ws://localhost:${SIM_PORT}/ws\n`);

  const wss = new WebSocketServer({ port: SIM_PORT });

  const mockTanks = [
    {
      id: "TNK-01",
      name: "Tangki Atap Gedung Utama",
      level: 78.5,
      capacity: 10000,
      minDist: 30,
      maxDist: 350,
      trend: -1,
    },
    {
      id: "TNK-02",
      name: "Tangki Gedung Rawat Inap",
      level: 42.0,
      capacity: 8000,
      minDist: 30,
      maxDist: 300,
      trend: -1,
    },
    {
      id: "TNK-03",
      name: "Tangki Gedung Bedah Sentral",
      level: 88.0,
      capacity: 5000,
      minDist: 25,
      maxDist: 250,
      trend: 1,
    },
  ];

  wss.on("connection", (ws, req) => {
    const url = req.url || "";
    console.log(`[CLIENT CONNECTED] Klien terhubung dari: ${req.socket.remoteAddress}, URL: ${url}`);

    ws.on("close", (code, reason) => {
      console.log(`[CLIENT DISCONNECTED] Kode: ${code}, Alasan: ${reason.toString() || "Koneksi ditutup"}`);
    });

    ws.on("error", (err) => {
      console.error("[CLIENT ERROR]:", err.message);
    });
  });

  // Loop siaran data realtime setiap 3 detik
  let seq = 1;
  const interval = setInterval(() => {
    if (wss.clients.size === 0) return;

    mockTanks.forEach((tank) => {
      tank.level += (Math.random() * 2.5 - 1.1) * tank.trend;
      if (tank.level > 96) {
        tank.level = 96;
        tank.trend = -1;
      } else if (tank.level < 18) {
        tank.level = 18;
        tank.trend = 1;
      }

      const levelPercent = parseFloat(tank.level.toFixed(1));
      const volumeLiters = Math.round((levelPercent / 100) * tank.capacity);
      const distanceCm = parseFloat(
        (tank.maxDist - (levelPercent / 100) * (tank.maxDist - tank.minDist)).toFixed(1)
      );
      const rssi = Math.round(-65 - Math.random() * 15);

      const packet = {
        type: "LEVEL_UPDATE",
        data: {
          tank_id: tank.id,
          level_percent: levelPercent,
          volume_liters: volumeLiters,
          distance_cm: distanceCm,
          raw_value: distanceCm,
          rssi: rssi,
          sequence: seq++,
          timestamp: new Date().toISOString(),
        },
      };

      const payloadStr = JSON.stringify(packet);
      for (const client of wss.clients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(payloadStr);
        }
      }
    });

    // Simulasi alert sesekali (setiap 30 detik)
    if (seq % 10 === 0) {
      const isCritical = Math.random() > 0.5;
      const alertPacket = {
        type: "ALERT_TRIGGERED",
        data: {
          id: `ALT-SIM-${Date.now()}`,
          tank_id: "TNK-02",
          severity: isCritical ? "CRITICAL" : "WARNING",
          type: isCritical ? "CRITICAL_LOW" : "LOW_LEVEL",
          message: `Level air TNK-02 mencapai batas ${isCritical ? "kritis" : "peringatan"}`,
          created_at: new Date().toISOString(),
        },
      };

      const alertStr = JSON.stringify(alertPacket);
      for (const client of wss.clients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(alertStr);
        }
      }
      console.log(`[BROADCAST ALERT] Terkirim ke ${wss.clients.size} klien: ${alertPacket.data.message}`);
    }
  }, 3000);

  process.on("SIGINT", () => {
    console.log("\nMenutup mock WebSocket server...");
    clearInterval(interval);
    wss.close();
    process.exit(0);
  });
}

// ==========================================
// 2. CLIENT STREAM LISTENER SIMULATION
// ==========================================
async function runClientSimulation() {
  console.log("=== MEMULAI PENGUJIAN REALTIME STREAM WEBSOCKET (CLIENT) ===");
  console.log(`Backend HTTP: ${BACKEND_HTTP}`);
  console.log(`Backend WS  : ${BACKEND_WS}`);

  console.log("\n[1] Melakukan login untuk mendapatkan token JWT...");
  let token = "";
  try {
    const res = await fetch(`${BACKEND_HTTP}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: process.env.TEST_USERNAME || "admin",
        password: process.env.TEST_PASSWORD || "admin123",
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || `HTTP ${res.status}`);
    }

    token = data.data?.token || data.token;
    console.log(`[PASS] Berhasil login. Token didapatkan: ${token.slice(0, 16)}...`);
  } catch (err: unknown) {
    console.error("[FAIL] Gagal login ke backend:", err instanceof Error ? err.message : err);
    console.log("Tips: Jalankan 'pnpm run simulate:server' untuk menguji WebSocket secara lokal mandiri.");
    process.exit(1);
  }

  console.log("\n[2] Menghubungkan ke WebSocket via query parameter ?token=...");
  const wsUrl = `${BACKEND_WS}${BACKEND_WS.includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}`;

  const ws = new WebSocket(wsUrl);

  ws.on("open", () => {
    console.log("[PASS] WebSocket berhasil terhubung (Connection Established)!");
    console.log("Mendengarkan event LEVEL_UPDATE, ALERT_TRIGGERED, dan ALERT_RESOLVED selama 20 detik...\n");
  });

  ws.on("message", (data) => {
    try {
      const payload = JSON.parse(data.toString());
      console.log(`[EVENT MASUK] Tipe: ${payload.type || payload.event}`);
      console.log(JSON.stringify(payload.data, null, 2));
      console.log("-------------------------------------------------");
    } catch {
      console.log(`[RAW DATA]: ${data.toString()}`);
    }
  });

  ws.on("close", (code, reason) => {
    console.log(`[WebSocket Ditutup] Kode: ${code}, Alasan: ${reason.toString() || "Koneksi berakhir"}`);
  });

  ws.on("error", (err) => {
    console.error("[WebSocket Error]:", err.message);
  });

  setTimeout(() => {
    console.log("\n[Selesai] Waktu simulasi 20 detik berakhir. Menutup koneksi...");
    ws.close();
    process.exit(0);
  }, 20000);
}
