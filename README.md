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
