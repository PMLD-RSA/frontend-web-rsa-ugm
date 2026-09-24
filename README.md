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
