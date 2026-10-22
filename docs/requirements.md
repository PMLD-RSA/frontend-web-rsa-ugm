# Kebutuhan Proyek (Requirements) - Web Dashboard

Dokumen ini merupakan penjabaran kebutuhan final untuk sub-tim Web (WP-4).

## 1. Lingkup Proyek (Project Scope)
Membangun antarmuka Web Dashboard berbasis Next.js (BFF) yang akan diakses melalui monitor *ultrawide* oleh pengawas di rumah sakit. Dashboard ini bertugas untuk memantau ketinggian level air pada berbagai tangki secara terpusat, mengolah logika data dari WP-3, dan bertindak sebagai peladen perantara (Backend-for-Frontend) untuk aplikasi klien.

## 2. Kebutuhan Fungsional (Functional Requirements)
- **Monitoring Real-time**: Menampilkan level air (persentase & estimasi volume) pada seluruh tangki.
- **Backend-for-Frontend (BFF)**: API Routes Next.js menerima payload mentah dari WP-3 (via REST & WebSocket), memformatnya menjadi JSON yang efisien, dan meneruskannya ke Web Dashboard dan Mobile App. Khusus untuk Mobile App, BFF juga meneruskan trigger untuk **Background Push Notifications**.
- **Manajemen Peringatan (Alarm)**: Menampilkan panel peringatan visual (merah/kuning) saat sensor mendeteksi batas kritis (<30%) atau *warning* (30-60%).
- **Visualisasi Histori**: Menyajikan grafik fluktuasi level air selama 24 jam terakhir.
- **Autentikasi (AAA)**: Memiliki halaman login dan validasi berbasis *Role-Based Access Control* (RBAC).

## 3. Keputusan Teknologi Khusus (Tech Stack Final)
- **State Management**: **Zustand** (dipilih karena sangat ringan, minim boilerplate, dan tangguh untuk handling data realtime dari WebSocket).
- **Library Grafik**: **Recharts** (mudah diintegrasikan dengan React, performa rendering mulus untuk histori 24 jam).

## 4. Kebutuhan Non-Fungsional
- **Keamanan**: Penggunaan HTTP-Only Cookies untuk penyimpanan token sesi di sisi BFF (kebal dari celah XSS).
- **Performa**: Grafik 24 jam dan *update* data tidak boleh membuat *browser lag* (hindari *rendering* berganda/animasi bertumpuk).
- **Resolusi**: Dioptimalkan untuk tampilan *ultrawide* di Control Room rumah sakit.

## 5. Rencana Opsional (Opsional/TBD)
*Status fitur otomasi/kontrol pompa saat ini masih dalam pertimbangan (Belum ada kepastian dari WP-3). Jika nanti di-approve, berikut fitur yang ditambahkan:*
- Kontrol aktuator pompa manual (ON/OFF switch) via API.
- Manajemen konfigurasi *threshold* batas bawah dan atas (Hysteresis rule form).
- Tombol *Emergency Stop*.
