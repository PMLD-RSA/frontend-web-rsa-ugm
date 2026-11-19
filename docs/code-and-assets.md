# Panduan kode dan aset

## Ikon aplikasi

Gunakan named import dari `react-icons/lu` (koleksi Lucide) untuk ikon umum agar gaya garis konsisten. Contoh: `import { LuSearch } from 'react-icons/lu'`, lalu `<LuSearch size={20} aria-hidden="true" />`. Label aksesibilitas tetap diberikan pada tombol atau tautan induknya. Jangan mengunduh SVG baru untuk ikon yang tersedia di koleksi ini.

`DashboardIcon.tsx` memetakan nama ikon dashboard lama ke komponen React Icons; sidebar memiliki pemetaan menu sendiri. Keduanya hanya mengimpor ikon yang dipakai, tanpa memuat koleksi secara dinamis. Warna status dipertahankan, sedangkan ikon tombol mengikuti warna teks. Logo Google memakai `FcGoogle` dari `react-icons/fc`.

Logo UGM/RSA, ilustrasi tangki khusus (termasuk Vector), foto, dan peta tetap berupa aset lokal. Divider sederhana dirender dengan CSS. Daftar 77 aset ikon yang digantikan tercatat di `icon-migration.json`. Entri `supersededBy` pada manifest deduplikasi lama menunjukkan bahwa salinan yang dahulu dipertahankan kemudian diganti dengan komponen ikon.

Referensi koleksi dan penggunaan: https://react-icons.github.io/react-icons/

## Modul tangki

- `src/components/tanks/TanksPage.tsx`: daftar, pencarian, filter, dan pemilihan dialog.
- `TankDetailPage.tsx`: informasi tangki, grafik pembacaan, dan pagination aktivitas.
- `AddTankForm.tsx`: pendaftaran toren.
- `TankForm.tsx`: edit, riwayat perubahan, dan konfirmasi penyimpanan.
- `TankForm.module.css`: gaya bersama untuk dialog tambah dan edit; gaya khusus edit dan konfirmasi berada di modul masing-masing.
- `DeleteTankDialog.tsx`: konfirmasi penghapusan.
- `src/components/dashboard/TankLevel.tsx`: visual level tangki yang dipakai dashboard dan halaman tangki.
- `src/lib/downloadCsv.ts`: serialisasi dan pengunduhan CSV untuk tangki dan pengguna. Gunakan helper ini untuk ekspor CSV baru.

CSS Modules dibatasi per komponen. Nama selector yang sama pada modul berbeda bukan duplikasi global. Media query dan override berurutan dapat memiliki fungsi berbeda; jangan menggabungkannya tanpa memeriksa cascade.

## Aset

`public/images/` menyimpan aset runtime yang diakses melalui `/images/...`.
`assets/` menyimpan ekspor desain yang tersisa. Jangan menyalin seluruh ekspor desain ke public; pilih aset yang digunakan dan beri nama sesuai fungsi.

Struktur aset sumber sekarang:

```text
assets/
  design/                       # Ekspor SVG desain
  images/                       # Gambar sumber PNG/JPG
  fonts/plus-jakarta-sans/       # Font variabel, lisensi, dan README font
    static/                     # Varian font statis dari paket asli
```

Folder ekspor berulang `UI/UI`, `source/source`, dan folder kosong telah digabung atau dihapus. File berbeda tetap disimpan; nama ekspor dinormalisasi dan diberi akhiran unik jika bertabrakan. `asset-relocations.json` mencatat path sebelum/sesudah beserta hash isi setiap file. `src/app/layout.tsx` menggunakan font dari lokasi baru. Untuk ekspor berikutnya, gunakan kategori di atas tanpa membuat folder `UI` atau `source` bertingkat lagi.

Pembersihan memakai SHA-256 isi file, bukan kesamaan nama. Daftar file yang dihapus dan salinan identik yang dipertahankan tersimpan di `asset-deduplication.json`.

```sh
npm run assets:audit
npm run assets:audit -- --verbose
npm run assets:dedupe
```

Audit tidak mengubah file. Deduplikasi hanya menghapus salinan di `assets/` yang tidak dirujuk secara literal oleh source, setelah memastikan hash salinan yang dipertahankan sama. Symlink dilewati. Manifest dipertahankan antar-eksekusi.

File dalam `public/` sengaja dipertahankan: beberapa URL dibentuk secara dinamis. Sebelum menjalankan deduplikasi setelah perubahan struktur, periksa juga referensi di konfigurasi, dokumentasi, dan path yang dibentuk dinamis; pemeriksaan otomatis hanya mencakup referensi literal di `src/`.

Duplikasi ekspor desain menambah ukuran repository, tetapi tidak otomatis menyebabkan request browser berulang. Jumlah fetch API perlu diperiksa lewat Network saat aplikasi berjalan. Setiap halaman tetap mengambil data yang diperlukan sesuai lifecycle-nya.
