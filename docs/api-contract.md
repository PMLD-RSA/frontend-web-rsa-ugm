# Kesepakatan API (API Contract) - Backend WP-3

Dokumen ini memuat struktur Endpoint REST API dan WebSocket dari Core Backend yang merujuk pada spesifikasi resmi OpenAPI (Swagger).

## A. REST API Endpoints (Total: 18)

### 1. Kategori: Monitoring & Tangki
**1. `GET /health`**
- **Fungsi:** Mengecek status layanan (DB, Redis, WS Clients).
- **Response (200):** `{ "status": "healthy", "services": { "database": "up", "redis": "up" }, "websocketClients": 2, "timestamp": "..." }`

**2. `GET /api/tanks`**
- **Fungsi:** Mengambil daftar seluruh tangki beserta *latest reading*, status alert aktif, dan *nodes* yang terpasang.
- **Response (200):** `{ "success": true, "data": [ { "id": "uuid", "name": "string", "capacityLiters": "string", "latestReading": { ... }, "activeAlert": { ... }, "nodes": [ ... ] } ] }`

**3. `POST /api/tanks`**
- **Fungsi:** Menambahkan tangki baru.
- **Request Body:** `{ "name": "string (wajib)", "location": "string", "capacityLiters": "number (wajib)", "minThresholdPercent": "number (default: 30)", "maxThresholdPercent": "number (default: 90)" }`
- **Response (201):** Mengembalikan objek tangki yang baru dibuat. (Gagal 400 jika validasi salah).

**4. `GET /api/tanks/{id}`**
- **Fungsi:** Mengambil detail spesifik satu tangki. Mengembalikan data tangki ditambah `recentReadings` (50 terakhir) dan `recentAlerts` (10 terakhir).
- **Path Parameter:** `id` (UUID).

**5. `PATCH /api/tanks/{id}`**
- **Fungsi:** Memperbarui parameter tangki (misal: *threshold*).
- **Request Body:** Sama dengan POST, namun seluruh parameter opsional.

**6. `GET /api/tanks/{id}/readings`**
- **Fungsi:** Mengambil histori data *time-series* untuk *charting*.
- **Query Params:** `hours` (number, default 24), `limit` (number, default 1000).
- **Response (200):** `{ "success": true, "tankId": "uuid", "hours": 24, "count": 288, "data": [ ...array of readings... ] }`

### 2. Kategori: Manajemen Alert & Infrastruktur
**7. `GET /api/alerts`**
- **Fungsi:** Daftar riwayat peringatan darurat.
- **Query Params:** `status` (opsional: `active` atau `resolved`).
- **Response (200):** Array objek *Alert* (mencakup `tankName`, `tankLocation`, `level (WARNING/CRITICAL)`, `message`, `status`).

**8. `PATCH /api/alerts/{id}/resolve`**
- **Fungsi:** Mematikan/menyelesaikan *alert* secara manual. (Memicu siaran WebSocket `ALERT_RESOLVED`).
- **Path Parameter:** `id` (Integer ID Alert).

**9. `GET /api/gateways`**
- **Fungsi:** Mengambil status Gateway Raspberry Pi (LoRa).
- **Response (200):** Array objek *Gateway* beserta atribut `nodesCount` dan array `nodes` (Sensor STM32 yang terhubung ke gateway tersebut).

**10. `GET /api/nodes`**
- **Fungsi:** Mengambil status seluruh Node Sensor STM32.
- **Response (200):** Array objek *SensorNode* (dilengkapi atribut relasi `tankName` dan `gatewayCode`).

### 3. Kategori: Autentikasi & Manajemen Pengguna
*(Seluruh endpoint di bawah ini (kecuali Login) mewajibkan Authorization: Bearer Token JWT).*

**11. `POST /api/auth/login`**
- **Fungsi:** Autentikasi *user* untuk mendapatkan JWT token.
- **Request Body:** `{ "username": "string (min 3)", "password": "string (min 6)" }`
- **Response (200):** `{ "success": true, "message": "Login berhasil", "data": { "token": "JWT_TOKEN", "user": { "id": "...", "role": "admin" } } }`
- **Gagal (401):** Jika kredensial salah.

**12. `GET /api/auth/me`**
- **Fungsi:** Mengambil profil *user* yang sedang aktif berdasarkan token JWT.

**13. `GET /api/users`**
- **Fungsi:** Mengambil daftar seluruh *user* (Khusus Role: Admin).

**14. `POST /api/users`**
- **Fungsi:** Membuat akun operator/admin baru.
- **Request Body:** `{ "username": "string", "password": "string", "role": "admin|operator|viewer (default: operator)" }`

**15. `PATCH /api/users/{id}`**
- **Fungsi:** Mengubah *role* atau menonaktifkan akun (`isActive: false`).

**16. `GET /api/audit-logs`**
- **Fungsi:** Mengambil riwayat jejak audit (aktivitas sistem).
- **Query Params:** `page` (default 1), `limit` (default 50), `entity` (opsional, misal: 'tanks').
- **Response (200):** Format paginasi dengan atribut `total`, `page`, `limit`, dan array `data`.

### 4. Kategori: Ekspor Laporan
**17. `GET /api/reports/readings/export`**
- **Fungsi:** Mengunduh (download) data *time-series* sensor.
- **Query Params:** `tankId` (wajib), `startDate`, `endDate`, `format` (csv, xlsx, pdf | default: csv).
- **Response (200):** Binary stream file download.

**18. `GET /api/reports/alerts/export`**
- **Fungsi:** Mengunduh histori peringatan darurat.
- **Query Params:** `level` (WARNING/CRITICAL), `startDate`, `endDate`, `format`.

---

## B. Fitur Realtime WebSocket (`WS /ws`)

Server berjalan di `ws://<server-ip>:8000/ws`. Terdapat 5 jenis balasan *event* JSON yang dipancarkan oleh Backend:

1. **`CONNECTED`**: Event konfirmasi awal dengan payload info versi sistem saat koneksi WebSocket dari klien berhasil.
2. **`LEVEL_UPDATE`**: Dipancarkan setiap kali ada pembacaan sensor terbaru. *Payload* berisi baris terbaru dari tabel `waterLevelReadings`.
3. **`ALERT_TRIGGERED`**: Dipancarkan seketika jika ketinggian air menjebol batas *warning/critical*. *Payload* berisi baris baru tabel `alerts`.
4. **`ALERT_RESOLVED`**: Dipancarkan ketika *alert* ditutup secara otomatis (kondisi aman) atau manual via API.
5. **`NODE_STATUS`**: Dipancarkan jika terjadi perubahan status perangkat IoT (misal: *node offline*, baterai lemah, atau `lastHeartbeat` telat).
