# 🌊 Sistem Informasi Pemantauan Level Air — Web Dashboard & BFF (RSA UGM)

[![CI Quality Gate](https://github.com/PMLD-RSA/frontend-web-rsa-ugm/actions/workflows/ci.yml/badge.svg)](https://github.com/PMLD-RSA/frontend-web-rsa-ugm/actions/workflows/ci.yml)

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
| [`docs/PRD-MFE.md`](docs/PRD-MFE.md) | Master Frontend PRD — arsitektur BFF, pemetaan fitur F-01–F-08 (Web & Mobile), kontrak rute BFF, WebSocket, dan RBAC |

> Dokumen di atas sudah disinkronkan dengan kontrak **Core Backend** (`backend-rsa-ugm`) dan menjadi acuan target untuk implementasi kode. Sumber utama dokumentasi ada di repo `frontend-documentation-rsa-ugm`.

---

## 🛠️ Teknologi yang Digunakan (Tech Stack)

| Kategori | Library / Tool |
|---|---|
| Framework | **Next.js 16.4.6** (App Router, Turbopack) |
| Library UI | **React 19.3.1** |
| Styling | **Tailwind CSS v4.3.5** |
| State Management | **Zustand ^5.1.0** |
| Charts | **Recharts ^3.11.1** |
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

Login dan pemeriksaan sesi harus terhubung ke Core Backend. Jika backend tidak tersedia, halaman login menampilkan pesan kesalahan koneksi. Beberapa endpoint data lain masih memiliki fallback data contoh, tetapi dashboard menolak hasil yang ditandai sebagai data contoh.

### Alamat backend dan protokol

`CORE_BACKEND_URL` diakses oleh proses Next.js, sehingga alamatnya bergantung pada lokasi frontend berjalan:

- Frontend di laptop, backend di VPS melalui jaringan UGM/VPN: `CORE_BACKEND_URL=http://10.33.102.140:8000`.
- Frontend dan backend berjalan pada VPS yang sama: `CORE_BACKEND_URL=http://127.0.0.1:8000`.

`127.0.0.1` selalu menunjuk ke mesin yang menjalankan proses Next.js. Setelah mengubah `.env.local`, mulai ulang frontend. `NEXT_PUBLIC_WS_URL` ditujukan ke browser dan harus dapat diakses dari perangkat pengguna. Koneksi WebSocket ke Core Backend **wajib** menyertakan token JWT (`ws://<host>:8000/ws?token=<jwt>`); tanpa token valid server menutup koneksi dengan kode `1008`. Browser mengambil token melalui `GET /api/auth/token` (BFF).

Pada akses HTTP internal saat ini, cookie login dipasang sesuai protokol HTTP. Untuk akses HTTPS, terminasi TLS dan header `X-Forwarded-Proto` perlu dikonfigurasi pada reverse proxy agar cookie diberi atribut `Secure`. `NODE_ENV` mengikuti perintah Next.js dan tidak perlu disetel ke `development` untuk menjalankan aplikasi melalui HTTP.

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
3. Di proyek Mobile, atur `EXPO_PUBLIC_BFF_URL=http://192.168.1.5:3000` (dan `EXPO_PUBLIC_WS_URL=ws://<IP_BACKEND>:8000/ws`).
4. HP kini langsung membaca data sensor dari laptop via BFF.

---

*Dikelola oleh Tim Pengembang WP-4 RSA UGM* 🏥


---

## 🤝 Untuk Web Team — Panduan Handoff

> Bagian ini ditulis untuk Web team yang akan melanjutkan pengembangan dari titik ini.

### ✅ Status Fase Pengembangan

| Fase | Scope | Status |
|------|-------|--------|
| **Fase 1** | TypeScript types, BFF proxy, API routes lengkap, Layout (Sidebar responsif + Header + favicon UGM `src/app/icon.png`) | ✅ Selesai |
| **Fase 2** | Auth/session (`login`, `me`, `logout`, `token`), cookie `1d`, auto-logout `401`, route protection (`proxy.ts` + CORS Expo Web) | ✅ Selesai |
| **Fase 3** | WebSocket real-time (`CONNECTED`, `LEVEL_UPDATE`, `ALERT_TRIGGERED`, `ALERT_RESOLVED`, `NODE_STATUS`, clean StrictMode close) | ✅ Selesai |
| **Fase 4** | Halaman lengkap (Dashboard, Tanks + Lat/Lng, Alerts, Devices, Reports, Logs Admin RBAC, Users CRUD Admin) | ✅ Selesai |
| **Fase 5** | CI/CD GitHub Actions single-pipeline (`.github/workflows/ci.yml`: lint, typecheck, `assets:audit`, build) | ✅ Selesai |

> **Sinkronisasi PRD & Core BE:** Seluruh rute BFF (`POST /api/users`, `PATCH|PUT|DELETE /api/users/[id]`, `PUT /api/tanks/[id]`), CRUD user di `/users`, pembatasan RBAC `/users` & `/logs` khusus `admin`, penanganan `NODE_STATUS`, serta dukungan CORS untuk klien Expo Web sudah terimplementasi dan selaras dengan [`docs/PRD-Web.md`](docs/PRD-Web.md) dan [`docs/PRD-MFE.md`](docs/PRD-MFE.md).

---

### 🗝️ Kredensial Development

Seed Core Backend (`npm run db:init` di `backend-rsa-ugm`) hanya membuat satu akun bawaan:

| Username | Password | Role |
|----------|----------|------|
| `admin` | `admin123` | Admin — akses penuh |

Akun `operator` dan `viewer` dibuat oleh Admin melalui `POST /api/users` (menu Users).

> **Catatan:** Login membutuhkan Core Backend yang aktif. Beberapa endpoint data masih memiliki fallback data contoh (`source: "mock"`), dan dashboard menolak hasil yang ditandai sebagai data contoh.

---

### 📂 Struktur Penting yang Sudah Ada

```
src/
├── types/index.ts          ← TypeScript interfaces (Tank, Alert, User, AuditLog, dll)
├── lib/
│   └── bffProxy.ts         ← forwardToBackend() (preserve HTTP status, tanpa mock pada mutasi/auth)
├── stores/authStore.ts     ← Zustand: user, isAdmin(), isOperator(), login/logout & auto-clear 401
├── proxy.ts                ← Route protection + CORS preflight handler untuk Expo Web
└── app/
    ├── icon.png            ← Favicon resmi lambang UGM
    ├── (auth)/login/       ← Halaman login pengguna
    ├── (dashboard)/        ← Layout dashboard (Sidebar + Header)
    │   ├── tanks/          ← Manajemen tangki, kalibrasi & koordinat Lat/Lng
    │   ├── alerts/         ← Peringatan dini & resolusi alert (Operator/Admin)
    │   ├── devices/        ← Monitoring Gateway & Sensor Node STM32
    │   ├── reports/        ← Grafik analitik historis & ekspor CSV
    │   ├── logs/           ← Timeline audit log (Admin only)
    │   └── users/          ← CRUD pengguna, toggle status & reset sandi (Admin only)
    └── api/                ← BFF Routes lengkap (auth, tanks, alerts, gateways, nodes, readings, users, audit-logs, reports)
```

---

### 🔌 BFF API yang Tersedia

Semua response menggunakan envelope: `{ success: boolean, data: T }`. Rute BFF memproksikan endpoint Core Backend; kontrak lengkap (parameter & response) ada di `docs/PRD-MFE.md` §5.1.

| Method | Endpoint BFF | Min. Role | Keterangan |
|--------|--------------|-----------|------------|
| GET | `/api/health` | Public | Health check BFF & Core BE |
| POST | `/api/auth/login` | Public | Login → set cookie `auth_token` + return JWT |
| GET | `/api/auth/me` | Viewer | Profil user dari cookie/token |
| GET | `/api/auth/token` | Viewer | Ambil JWT dari cookie untuk koneksi WebSocket browser |
| POST | `/api/auth/logout` | Viewer | Hapus cookie |
| GET | `/api/tanks` | Viewer | Daftar tangki (`latestReading`, `activeAlert`, `nodes`) |
| POST | `/api/tanks` | Admin | Tambah tangki |
| GET | `/api/tanks/:id` | Viewer | Detail tangki (`recentReadings`, `recentAlerts`) |
| PATCH / PUT | `/api/tanks/:id` | Admin | Ubah data / kalibrasi / threshold tangki |
| DELETE | `/api/tanks/:id` | Admin | Hapus tangki |
| GET | `/api/tanks/:id/readings` | Viewer | Riwayat sensor (`?hours=&limit=`) |
| GET | `/api/readings/latest` | Viewer | Pembacaan terbaru semua tangki |
| GET | `/api/readings/history` | Viewer | Riwayat multi-tangki (`?hours=`) |
| GET | `/api/alerts` | Viewer | Daftar alert (`?status=active\|resolved`) |
| PATCH / PUT | `/api/alerts/:id/resolve` | Operator | Resolve alert |
| GET | `/api/gateways` | Viewer | Daftar gateway IoT |
| GET | `/api/nodes` | Viewer | Daftar sensor node STM32 |
| GET | `/api/users` | Admin | Daftar pengguna |
| POST | `/api/users` | Admin | Tambah pengguna |
| PATCH / PUT | `/api/users/:id` | Admin | Ubah role / status aktif / reset password |
| DELETE | `/api/users/:id` | Admin | Hapus pengguna |
| GET | `/api/audit-logs` | Admin | Audit log (`?page=&limit=&entity=`) |
| GET | `/api/reports/readings/export` | Viewer | CSV pembacaan (`?tankId=&startDate=&endDate=`) |
| GET | `/api/reports/alerts/export` | Viewer | CSV alert (`?level=&startDate=&endDate=`) |

> Seluruh rute BFF di atas telah tersedia dan menjaga kode status asli Core Backend (termasuk `401` dan validasi error) serta meneruskan header CORS ke klien Web/Mobile.

---

### 📖 Panduan Pengembangan Lanjutan Web Team

1. **Baca PRD sebagai acuan kontrak:**
   - [`docs/PRD-Web.md`](docs/PRD-Web.md) — spesifikasi halaman Web & BFF
   - [`docs/PRD-MFE.md`](docs/PRD-MFE.md) — kontrak API bersama Web & Mobile

2. **WebSocket Real-time** (`src/hooks/useRealtimeSocket.ts`):
   - Terhubung ke `ws://<host>:8000/ws?token=<jwt>` (menggunakan token dari `GET /api/auth/token`)
   - Event: `CONNECTED`, `LEVEL_UPDATE`, `ALERT_TRIGGERED`, `ALERT_RESOLVED`, `NODE_STATUS`

3. **Alur kerja Git & Quality Gate:**
   ```bash
   git checkout dev
   git pull upstream dev
   git checkout -b feat/<nama-fitur>
   # ... kode ...
   git push upstream feat/<nama-fitur>
   # Buka PR ke dev — CI otomatis menjalankan lint, typecheck, assets:audit, & build
   ```

4. **CI otomatis berjalan** setiap push/PR ke `dev` atau `main` lewat [`.github/workflows/ci.yml`](.github/workflows/ci.yml). Pastikan `pnpm run lint`, `npx tsc --noEmit`, `pnpm run assets:audit`, dan `pnpm run build` lolos sebelum push.
