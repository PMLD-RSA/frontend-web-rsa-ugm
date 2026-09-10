# 🌊 Web Dashboard WP-4: Sistem Pemantauan Level Air Berbasis IoT

Selamat datang di repositori Web Dashboard untuk proyek **Sistem Informasi Pemantauan dan Pengendalian Level Air Berbasis IoT di RSA UGM**. Repositori ini menaungi antarmuka berbasis *browser ultrawide* untuk pemantauan rumah sakit terpadu dan juga berperan esensial sebagai peladen **Backend-for-Frontend (BFF)**.

## 🌟 Tentang Proyek
Repositori ini adalah fondasi utama antarmuka bagi Work Package 4 (WP-4). Dashboard Web dioptimalkan untuk menyajikan data stasiun tangki, riwayat log, dan indikator kritis secara luas. Melalui infrastruktur Next.js, repositori ini menjalankan fungsi *Sweet Spot* BFF—menerima raw data dari WP-3, memproses logika secara terpusat, dan mendistribusikan JSON bersih ke klien Web maupun Mobile.

## ✨ Fitur Utama
- **Dashboard Monitoring Terpusat**: Visualisasi grid status semua tangki dengan penekanan warna indikator kritis (<30% Merah, 30-60% Kuning).
- **Log Histori 24 Jam**: Grafik analitik komprehensif.
- **Infrastruktur BFF**: API Routes yang menjembatani klien (Web & Mobile) dengan Core Backend secara mulus.
- **Single-lock UI**: Manajemen interaksi yang mencegah aksi ganda secara asinkron.

## 🛠️ Tech Stack & Arsitektur (Final)
- **Framework Utama**: Next.js (berfokus pada *Server-Side Rendering* & API Routes bawaan).
- **Styling**: Tailwind CSS v4 untuk desain *utility-first*.
- **State Management**: **Zustand** (untuk *caching* data *realtime* yang ringan).
- **Visualisasi Data**: **Recharts** (untuk kurva histori level air tangki 24 jam).
- **Topologi**: Repositori Web Dashboard menampung logika BFF. Komponen layouting bersifat modular (seperti `DashboardLayout` wrapper global).

## 🔒 Security & AAA (Autentikasi, Autorisasi, Akunting)
- **Authentication**: Validasi kredensial ke WP-3 via BFF. Token JWT disematkan ke dalam *cookies* (`HttpOnly`, `Secure`, `SameSite`) untuk mencegah celah XSS.
- **Authorization**: Penerapan *Role-Based Access Control* (RBAC) dinamis.
- **Accounting**: Pencatatan *Audit Trail* yang absolut.

## 🔀 Panduan Kontribusi & Konvensi Git
Untuk menjaga kerapian riwayat repositori, seluruh anggota tim diwajibkan mengikuti alur dan konvensi *commit* berikut:

**Alur Branching:**
1. **Buat Branch Fitur (`feat/...` atau `fix/...`)**: Setiap pengerjaan tugas baru **wajib** dilakukan di *branch* terpisah (misal: `feat/login-page` atau `fix/chart-bug`).
2. **Pull Request ke `dev`**: Setelah fitur selesai, ajukan *Pull Request* (PR) untuk digabungkan (*merge*) ke branch `dev`. Pastikan kode sudah teruji dan tidak ada konflik.
3. **Rilis ke `main`**: Branch `main` adalah versi produksi. Penggabungan ke `main` **hanya** dilakukan dari branch `dev` apabila keseluruhan fitur pada iterasi tersebut sudah stabil dan siap rilis.

**Format Pesan Commit:**
Gunakan format standar *Conventional Commits*:
- `feat: menambahkan grafik histori 24 jam` (Untuk fitur baru)
- `fix: memperbaiki error kalkulasi persentase tangki` (Untuk perbaikan *bug*)
- `docs: memperbarui spesifikasi API di README` (Untuk perubahan dokumentasi)
- `style: menyesuaikan warna indikator kritis Tailwind` (Untuk perbaikan UI/CSS)

## 🚀 Panduan Instalasi (Getting Started)
1. **Clone Repositori**:
   ```bash
   git clone https://github.com/Avin1731/frontend-web-rsa-ugm.git
   ```
2. **Instalasi Dependensi**:
   Pastikan Anda menggunakan `pnpm` sesuai konvensi tim:
   ```bash
   cd frontend-web-rsa-ugm
   pnpm install
   ```
3. **Menjalankan Server (Development)**:
   ```bash
   pnpm run dev
   ```

---
Untuk melihat prasyarat fungsional aplikasi ini secara detail, silakan merujuk pada file **[Kebutuhan Proyek (Requirements)](./requirements.md)** di repositori ini.

