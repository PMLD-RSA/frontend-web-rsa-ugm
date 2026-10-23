# 🌊 Sistem Informasi Pemantauan Level Air — Web Dashboard & BFF (RSA UGM)

Repositori resmi **Dashboard Web dan BFF (Backend-for-Frontend)** untuk proyek Work Package 4 (WP-4): Sistem Informasi Pemantauan dan Pengendalian Level Air Berbasis IoT di Rumah Sakit Akademik (RSA) UGM.

---

## 📖 Gambaran Umum (Overview)

Sistem ini memantau ketinggian air pada tangki-tangki penyediaan di RSA UGM secara *real-time*. Selain menampilkan dashboard ke staf rumah sakit di layar besar, aplikasi ini juga bertugas sebagai **BFF (Backend-for-Frontend)** — menerima data dari sensor IoT melalui backend inti, merapikannya, dan menyuapinya ke Aplikasi Mobile agar ringan di HP.

### ✨ Fitur Utama
1. **📊 Dashboard Real-time** — Visualisasi level air & status sensor, grafik tren 24 jam.
2. **🚨 Sistem Peringatan Dini** — Notifikasi seketika jika level air mencapai titik kritis.
3. **🗄️ Manajemen Data** — Master Tangki, Gateway IoT, Sensor Node, Audit Log, dan Pengguna.
4. **🔌 BFF API** — Endpoint terstandarisasi `{ success, data }` untuk konsumsi Web & Mobile.

### 📄 Dokumentasi Acuan

| Dokumen | Keterangan |
|---|---|
| [`docs/PRD-Web.md`](docs/PRD-Web.md) | Product Requirements Document — Web Dashboard & BFF |
| [`docs/PRD-MFE.md`](docs/PRD-MFE.md) | Product Requirements Document — Mobile Frontend (Expo) |

---

## 🛠️ Teknologi yang Digunakan (Tech Stack)

| Kategori | Library / Tool |
|---|---|
| Framework | **Next.js 16** (App Router, Turbopack) |
| Styling | **Tailwind CSS v4** |
| State Management | **Zustand** |
| Charts | **Recharts** |
| Icons | **Lucide React** |
| Package Manager | **pnpm** |
| Language | **TypeScript 5** |

---

## ⚙️ Cara Kerja Integrasi BFF

BFF ini ibarat **"Penerjemah sekaligus Pelayan Khusus"** untuk Aplikasi Mobile RSA UGM.

Alur data:
```
Sensor IoT → Core Backend (:8000) → BFF Next.js API Routes (:3000) → Web Browser / Mobile App
```

Jika Core Backend sedang offline (development), BFF otomatis menggunakan **mock data** yang skema-nya 100% sesuai PRD sehingga pengembangan UI tidak terhenti.

---

## 🚀 Panduan Instalasi (Untuk Developer)

### Syarat Wajib (Prerequisites)
- **Node.js** ≥ 20.x
- **pnpm** → `npm install -g pnpm`

### Langkah Instalasi

1. **Clone & checkout branch dev:**
   ```bash
   git clone https://github.com/PMLD-RSA/frontend-web-rsa-ugm.git
   cd frontend-web-rsa-ugm
   git checkout dev
   ```

2. **Salin konfigurasi environment:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local dan sesuaikan CORE_BACKEND_URL
   ```

3. **Install dependensi:**
   ```bash
   pnpm install
   ```

4. **Jalankan mode developer:**
   ```bash
   pnpm run dev
   ```

5. **Buka browser:** 👉 `http://localhost:3000`

---

## 📱 Menghubungkan Aplikasi Mobile ke BFF

1. Pastikan laptop (menjalankan Web) dan HP (menjalankan Expo) berada di **jaringan Wi-Fi yang sama**.
2. Cari IP lokal laptop Anda (contoh: `192.168.1.5`).
3. Di proyek Mobile, atur `BFF_BASE_URL=http://192.168.1.5:3000`.
4. HP kini langsung membaca data sensor dari laptop via BFF.

---

*Dikelola oleh Tim Pengembang WP-4 RSA UGM* 🏥


---

## 🤝 Untuk Web Team — Panduan Handoff

> Bagian ini ditulis untuk Web team yang akan melanjutkan pengembangan dari titik ini.

### ✅ Status Fase Pengembangan

| Fase | Scope | Status |
|------|-------|--------|
| **Fase 1** | TypeScript types, BFF proxy, 10 API routes, mock data, Layout (Sidebar + Header) | ✅ Selesai |
| **Fase 2** | Auth/session (login, me, logout), Zustand store, route protection (`proxy.ts`), Login page | ✅ Selesai |
| **Fase 3** | WebSocket real-time (LEVEL_UPDATE, ALERT_TRIGGERED, NODE_STATUS) | 🔜 Perlu diimplementasi |
| **Fase 4** | Halaman lengkap (Tanks detail, Alerts manage, Devices config, Reports, Logs, Users) | 🔜 Perlu diimplementasi |
| **Fase 5** | CI/CD GitHub Actions (`.github/workflows/ci.yml`) | ✅ Selesai |

---

### 🗝️ Kredensial Development

| Username | Password | Role |
|----------|----------|------|
| `admin` | `admin123` | Admin — akses penuh |
| `operator` | `op123` | Operator — lihat & resolve alert |
| `viewer` | `view123` | Viewer — baca saja |

> **Catatan:** Login tanpa Core Backend tetap bisa bekerja. BFF otomatis fallback ke mock data.

---

### 📂 Struktur Penting yang Sudah Ada

```
src/
├── types/index.ts          ← Semua TypeScript interface (Tank, Alert, User, dll)
├── lib/
│   ├── bffProxy.ts         ← forwardToBackend() dengan fallback mock otomatis
│   └── mockData.ts         ← Mock data realistis (3 tangki RSA UGM)
├── stores/authStore.ts     ← Zustand: user, isAdmin(), isOperator(), login/logout
├── proxy.ts                ← Route protection (middleware Next.js 16)
└── app/
    ├── (auth)/login/       ← Halaman login
    ├── (dashboard)/        ← Layout dashboard (Sidebar + Header)
    │   ├── tanks/          ← Stub — perlu implementasi
    │   ├── alerts/         ← Stub — perlu implementasi
    │   ├── devices/        ← Stub — perlu implementasi
    │   ├── reports/        ← Stub — perlu implementasi
    │   ├── logs/           ← Stub — perlu implementasi
    │   └── users/          ← Stub — perlu implementasi (admin only)
    └── api/                ← BFF Routes (berfungsi + fallback mock)
        ├── tanks/
        ├── alerts/
        ├── gateways/
        ├── nodes/
        ├── readings/
        ├── audit-logs/     ← Tersedia untuk Mobile & Web
        ├── auth/
        └── health/
```

---

### 🔌 BFF API yang Tersedia

Semua response menggunakan envelope: `{ success: boolean, data: T }`.

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/tanks` | Daftar semua tangki |
| GET | `/api/tanks/:id` | Detail 1 tangki |
| GET | `/api/tanks/:id/readings` | Riwayat pembacaan sensor tangki |
| GET | `/api/alerts` | Daftar alert aktif |
| POST | `/api/alerts/:id/resolve` | Resolve alert |
| GET | `/api/gateways` | Daftar gateway IoT |
| GET | `/api/nodes` | Daftar sensor node STM32 |
| GET | `/api/readings/latest` | Pembacaan terbaru semua tangki |
| GET | `/api/readings/history` | Riwayat historis (24 jam) |
| GET | `/api/audit-logs` | Log aktivitas sistem (`?limit=&page=`) |
| POST | `/api/auth/login` | Login → set cookie + return JWT |
| GET | `/api/auth/me` | Info user dari cookie/token |
| POST | `/api/auth/logout` | Hapus cookie |
| GET | `/api/health` | Health check BFF |

---

### 📖 Langkah Lanjutan untuk Web Team

1. **Baca PRD lebih dulu:**
   - [`docs/PRD-Web.md`](docs/PRD-Web.md) — spesifikasi lengkap semua halaman
   - [`docs/PRD-MFE.md`](docs/PRD-MFE.md) — kontrak API yang digunakan Mobile

2. **Implementasi Fase 3 — WebSocket Real-time** (PRD-Web § 3.3):
   - Buat `src/hooks/useWaterLevelWS.ts` — subscribe ke `ws://localhost:8000/ws/tanks`
   - Event: `LEVEL_UPDATE`, `ALERT_TRIGGERED`, `ALERT_RESOLVED`, `NODE_STATUS`

3. **Implementasi Fase 4 — Halaman Lengkap** (sesuai stub di `src/app/(dashboard)/*/page.tsx`):
   - Ganti placeholder dengan implementasi sebenarnya
   - Gunakan tipe dari `src/types/index.ts` dan auth dari `src/stores/authStore.ts`

4. **Alur kerja Git:**
   ```bash
   git checkout dev
   git pull upstream dev
   git checkout -b feat/<nama-fitur>
   # ... kode ...
   git push origin feat/<nama-fitur>
   # Buka PR ke dev — CI otomatis jalan
   ```

5. **CI otomatis jalan** setiap PR ke `dev` atau `main`.  
   Pastikan `pnpm run lint`, `tsc --noEmit`, dan `pnpm run build` lolos sebelum push.
