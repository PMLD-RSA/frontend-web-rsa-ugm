# 🌊 Sistem Informasi Pemantauan Level Air - Web Dashboard & BFF (RSA UGM)

Selamat datang di repositori resmi **Dashboard Web dan BFF (Backend-for-Frontend)** untuk proyek Work Package 4 (WP-4): Sistem Informasi Pemantauan dan Pengendalian Level Air Berbasis IoT di Rumah Sakit Akademik (RSA) UGM.

Repositori ini memuat kode sumber untuk aplikasi *browser* dan peladen perantara (BFF) yang menjadi otak komunikasi data ke aplikasi seluler.

---

## 📖 Gambaran Umum (Overview)

Sistem ini diciptakan untuk memantau ketinggian, suhu, dan kualitas air pada tangki-tangki penyediaan air di RSA UGM secara *real-time*. 

Dalam sistem ini, aplikasi web tidak hanya bertugas menampilkan grafik dan data kepada staf rumah sakit di layar besar (Desktop), tetapi juga bertugas sebagai **BFF (Backend-for-Frontend)**. Artinya, aplikasi ini menerima data dari sensor IoT (lewat *backend* inti), merapikannya, dan menyuapinya ke Aplikasi Mobile agar kinerja HP staf lapangan tidak berat.

### ✨ Fitur Utama
1. **📊 Dashboard Real-time:** Menampilkan visualisasi ketinggian air dan status sensor dalam bentuk grafik interaktif.
2. **🚨 Sistem Peringatan Dini (Alarms):** Memberikan notifikasi seketika jika air mencapai titik kritis (mau habis atau tumpah).
3. **🗄️ Manajemen Data:** Mencakup data Master Tangki (Tanks), Gateway IoT, Audit Log, Laporan berkala, dan Pengguna (Users).
4. **🔌 BFF API:** Menyediakan jalur komunikasi khusus yang super cepat dan ringan khusus untuk dibaca oleh Aplikasi Seluler (Mobile).

---

## 🛠️ Teknologi yang Digunakan (Tech Stack)

Aplikasi ini dibangun menggunakan teknologi modern yang sangat cepat dan handal:
- **[Next.js](https://nextjs.org/) (App Router):** Kerangka kerja utama (Framework) yang membuat web memuat lebih cepat.
- **[Tailwind CSS](https://tailwindcss.com/):** Alat desain yang membantu mempercantik tampilan antarmuka (UI) secara fleksibel sesuai desain Figma.
- **[Zustand](https://github.com/pmndrs/zustand):** Pengelola memori aplikasi (State Management) agar perpindahan data antar halaman terasa mulus.
- **[Recharts](https://recharts.org/):** Pembangun grafik interaktif untuk membaca tren level air.
- **Lucide React:** Perpustakaan ikon modern yang bersih dan jelas.

---

## ⚙️ Cara Kerja Integrasi BFF (Backend-for-Frontend)

Bagi orang awam, BFF ini ibarat **"Penerjemah sekaligus Pelayan Khusus"** untuk aplikasi seluler (HP) staf RSA UGM.

**Mengapa kita butuh BFF?**
Sensor IoT dan Backend Inti mengirimkan data mentah yang sangat besar dan rumit. Jika HP langsung mengambil data tersebut, internet HP akan boros dan baterai cepat habis. 
Oleh karena itu, Web ini memiliki rute API (contoh: `/api/tanks`) yang akan:
1. Membaca data besar dari sensor/backend utama.
2. Merangkum, menyaring, dan memotong bagian-bagian yang tidak penting.
3. Memberikan "paket data ukuran kecil" yang sudah rapi ke Aplikasi Mobile (HP).

Aplikasi Mobile RSA UGM (di repo terpisah) akan langsung "menelepon" rute API di web ini untuk memperbarui datanya seketika.

---

## 🚀 Panduan Instalasi (Untuk Developer)

Ikuti langkah berikut untuk menjalankan sistem ini di komputer Anda:

### Syarat Wajib (Prerequisites)
Pastikan komputer Anda sudah terpasang:
- **Node.js** (Minimal versi 18.x)
- **NPM** atau **Yarn**

### Langkah Instalasi
1. **Clone Repositori:**
   Buka terminal/CMD dan unduh kode ke laptop Anda.
   ```bash
   git clone https://github.com/PMLD-RSA/frontend-web-rsa-ugm.git
   cd frontend-web-rsa-ugm
   ```

2. **Install Dependensi:**
   Unduh semua bahan baku program.
   ```bash
   npm install
   ```
   *(Atau gunakan `yarn install`)*

3. **Jalankan Aplikasi (Mode Developer):**
   ```bash
   npm run dev
   ```

4. **Buka di Browser:**
   Buka aplikasi browser Anda (Chrome, Edge, dll) dan ketik:  
   👉 `http://localhost:3000`

---

## 📱 Cara Menghubungkan Aplikasi Mobile ke Web (BFF) Ini

Jika Anda sedang menguji Aplikasi Mobile RSA UGM dan ingin menyambungkannya ke Web ini:
1. Pastikan laptop yang menjalankan Web ini dan HP yang menjalankan Aplikasi Mobile berada di **jaringan Wi-Fi yang sama**.
2. Cari tahu IP Lokal laptop Anda (misal: `192.168.1.5`).
3. Di proyek Mobile, atur alamat `BFF_URL` menuju IP tersebut ditambah port 3000, contoh:  
   `http://192.168.1.5:3000`
4. Selesai! HP Anda kini akan menerima data sensor dari laptop.

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
