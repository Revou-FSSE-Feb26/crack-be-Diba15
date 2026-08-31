# 🧪 Daftar Skenario Pengujian API Backend (Postman & Unit Tests) TruBrush

Dokumen ini merinci daftar skenario pengujian REST API yang terdapat pada berkas **Postman Collection (v2.1.0)** dan rangkaian **Jest Unit Test** pada repositori backend **TruBrush** (`crack-be-diba15`).

> [!WARNING]
> **Peringatan Status Data (*Data State*) Sebelum Menjalankan Test Automation:**
> Jika Anda menjalankan pengujian otomatis (*Postman Collection Runner* atau *Automated API Test*), pastikan database berada dalam kondisi data awal (*fresh state*).
> Apabila pengujian otomatis dijalankan berulang kali pada database yang sudah termodifikasi tanpa di-*reset*, beberapa *request* yang menguji siklus hidup transaksional (seperti tanggapan komisi, mediasi sengketa, atau validasi duplikasi) dapat mengalami penolakan karena status entitas data terkait sudah pernah diubah pada putaran pengujian sebelumnya (*e.g. already responded / conflict*).
>
> 💡 **Solusi / Rekomendasi:**
> Selalu jalankan perintah *seeding* database di terminal backend sebelum memulai eksekusi pengujian otomatis menyeluruh:
> ```bash
> pnpm prisma db seed
> ```

---

## 📮 1. Matriks Pengujian API Postman Collection (47 Requests)

Seluruh pengujian API di bawah ini dapat dijalankan secara otomatis melalui Postman Collection Runner menggunakan berkas konfigurasi di folder [`docs/postman/`](./postman/):
- **Collection:** [`docs/postman/TruBrush_API.postman_collection.json`](./postman/TruBrush_API.postman_collection.json)
- **Environment:** [`docs/postman/TruBrush_Local.postman_environment.json`](./postman/TruBrush_Local.postman_environment.json)

---

### 🔐 01. Authentication & Sessions (7 Requests)

| ID | Nama Pengujian API | HTTP Method | Endpoint URL | Role Akses | Script Assertion & Validasi |
|---|---|---|---|---|---|
| **1.1** | **Login Admin (Auto Token)** | `POST` | `/api/auth/login` | Publik | Status `200 OK`, respon memuat `accessToken`, simpan otomatis ke `admin_token`. |
| **1.2** | **Login Curator (Auto Token)** | `POST` | `/api/auth/login` | Publik | Status `200 OK`, respon memuat `accessToken`, simpan otomatis ke `curator_token`. |
| **1.3** | **Login Artist (Auto Token)** | `POST` | `/api/auth/login` | Publik | Status `200 OK`, respon memuat `accessToken`, simpan otomatis ke `artist_token`. |
| **1.4** | **Login Client (Auto Token)** | `POST` | `/api/auth/login` | Publik | Status `200 OK`, respon memuat `accessToken`, simpan otomatis ke `client_token`. |
| **1.5** | **Register New Artist** | `POST` | `/api/auth/register` | Publik | Status `201 Created` / `200 OK`, buat akun artist baru dengan email dinamis `$timestamp`. |
| **1.6** | **Register New Client** | `POST` | `/api/auth/register` | Publik | Status `201 Created` / `200 OK`, buat akun client baru dengan email dinamis `$timestamp`. |
| **1.7** | **Get My Profile (/auth/me)** | `GET` | `/api/auth/me` | Bearer Token | Status `200 OK`, respon memuat properti identitas `id` dan `email`. |

---

### 👤 02. Users & Wallet Management (5 Requests)

| ID | Nama Pengujian API | HTTP Method | Endpoint URL | Role Akses | Script Assertion & Validasi |
|---|---|---|---|---|---|
| **2.1** | **Get All Users** | `GET` | `/api/users` | Admin Only | Status `200 OK`, respon berupa array daftar seluruh pengguna. |
| **2.2** | **Get User By ID** | `GET` | `/api/users/:id` | Admin / User | Status `200 OK`, detail profil pengguna termuat lengkap. |
| **2.3** | **Top Up Saldo Dompet** | `POST` | `/api/users/topup` | Client / Artist | Status `200/201`, saldo bertambah Rp 1.000.000 untuk pengujian pembayaran komisi. |
| **2.4** | **Withdraw Dana Artis (Min 100k)** | `POST` | `/api/users/withdraw` | Artist Only | Status `200 OK` (atau `400` jika saldo kurang), validasi `accountName`, `bankName`, `amount`. |
| **2.5** | **Create New Curator** | `POST` | `/api/users` | Admin Only | Status `201 Created`, berhasil mendaftarkan staf kurator baru secara manual. |

---

### 🎨 03. Artworks & Anti-AI Curation (9 Requests)

| ID | Nama Pengujian API | HTTP Method | Endpoint URL | Role Akses | Script Assertion & Validasi |
|---|---|---|---|---|---|
| **3.1** | **Post Artwork with WIP Proof** | `POST` | `/api/artworks` | Artist Only | Status `201 Created`, simpan `id` karya baru ke variabel `artwork_id`. |
| **3.2** | **Get Public Feed Artworks** | `GET` | `/api/artworks?page=1&limit=6` | Publik | Status `200 OK`, feed terpaginasi batch 6 item. |
| **3.3** | **Get Pending Curation Artworks** | `GET` | `/api/artworks/pending` | Curator / Admin | Status `200 OK`, memuat antrean karya berstatus `pending`. |
| **3.4** | **Get Artwork Detail By ID** | `GET` | `/api/artworks/:id` | Publik | Status `200 OK`, memuat detail karya seni berdasarkan `{{artwork_id}}`. |
| **3.5** | **Curate Artwork - Approve** | `PATCH` | `/api/artworks/:id/curate` | Curator / Admin | Status `200 OK`, kirim `{"curationStatus": "approved"}` $\rightarrow$ karya diverifikasi. |
| **3.6** | **Takedown Artwork** | `PATCH` | `/api/artworks/:id` | Admin Only | Status `200 OK`, kirim `{"isVisibleOnFeed": false}` $\rightarrow$ disembunyikan dari feed. |
| **3.7** | **Restore Artwork** | `PATCH` | `/api/artworks/:id` | Admin Only | Status `200 OK`, kirim `{"isVisibleOnFeed": true}` $\rightarrow$ dipulihkan ke feed publik. |
| **3.8** | **Get Master Tags List** | `GET` | `/api/artworks/tags` | Publik | Status `200 OK`, memuat daftar seluruh katalog tag. |
| **3.9** | **Create Master Tag** | `POST` | `/api/artworks/tags` | Admin Only | Status `201 Created`, simpan ID tag ke variabel `tag_id`. |

---

### 🤝 04. Commissions & Escrow Flow (9 Requests)

| ID | Nama Pengujian API | HTTP Method | Endpoint URL | Role Akses | Script Assertion & Validasi |
|---|---|---|---|---|---|
| **4.1** | **Order Commission** | `POST` | `/api/commissions` | Client | Status `201 Created`, buat pesanan komisi baru $\rightarrow$ simpan `commission_id`. |
| **4.2** | **Get My Commissions List** | `GET` | `/api/commissions` | Client / Artist | Status `200 OK`, memuat daftar komisi pengguna aktif. |
| **4.3** | **Respond Commission - Accept** | `PATCH` | `/api/commissions/:id/respond` | Artist | Status `200 OK`, kirim `{"status": "in_progress"}` $\rightarrow$ komisi diterima artis. |
| **4.4** | **Pay Commission to Escrow** | `PATCH` | `/api/commissions/:id/pay` | Client | Status `200 OK`, saldo klien dipotong dan dikunci di rekening escrow (`paid`). |
| **4.5** | **Upload Sketch Progress** | `PATCH` | `/api/commissions/:id/progress` | Artist | Status `200 OK`, kirim payload `{"sketch_url": "..."}` $\rightarrow$ sketsa terunggah. |
| **4.6** | **Approve Sketch** | `PATCH` | `/api/commissions/:id/approve` | Client | Status `200 OK`, kirim payload `{"step": "sketch"}` $\rightarrow$ sketsa disetujui klien. |
| **4.7** | **Upload Final Artwork** | `PATCH` | `/api/commissions/:id/progress` | Artist | Status `200 OK`, kirim `{"final_artwork_url": "...", "final_file_url": "..."}`. |
| **4.8** | **Approve Final Artwork** | `PATCH` | `/api/commissions/:id/approve` | Client | Status `200 OK`, kirim payload `{"step": "final"}` $\rightarrow$ hasil akhir disetujui. |
| **4.9** | **Complete Commission & Release** | `PATCH` | `/api/commissions/:id/complete` | Artist | Status `200 OK`, komisi berstatus `completed`, dana escrow cair (95% artis, 5% fee). |

---

### ⚖️ 05. Disputes & Mediasi (2 Requests)

| ID | Nama Pengujian API | HTTP Method | Endpoint URL | Role Akses | Script Assertion & Validasi |
|---|---|---|---|---|---|
| **5.1** | **File Commission Dispute** | `POST` | `/api/disputes` | Client / Artist | Status `201 Created`, ajukan komplain sengketa komisi aktif. |
| **5.2** | **Get All Disputes List** | `GET` | `/api/disputes` | Curator / Admin | Status `200 OK`, memuat daftar seluruh sengketa menunggu mediasi. |

---

### 🚨 06. Reports & Moderasi Aduan (2 Requests)

| ID | Nama Pengujian API | HTTP Method | Endpoint URL | Role Akses | Script Assertion & Validasi |
|---|---|---|---|---|---|
| **6.1** | **Report Artwork** | `POST` | `/api/reports` | Client / Artist | Status `201 Created`, kirim aduan karya seni terindikasi pelanggaran. |
| **6.2** | **Get Reports List** | `GET` | `/api/reports` | Curator / Admin | Status `200 OK`, memuat antrean laporan karya bermasalah. |

---

### 📜 07. Appeals & Banding Akun Seniman (3 Requests)

| ID | Nama Pengujian API | HTTP Method | Endpoint URL | Role Akses | Script Assertion & Validasi |
|---|---|---|---|---|---|
| **7.1** | **File Account Appeal** | `POST` | `/api/appeals` | Artist Only | Status `201 Created` / `400`, artis mengajukan bukti banding pemulihan akun. |
| **7.2** | **Get My Appeals** | `GET` | `/api/appeals/my` | Artist Only | Status `200 OK`, memuat riwayat pengajuan banding milik artis login. |
| **7.3** | **Get All Appeals** | `GET` | `/api/appeals` | Admin Only | Status `200 OK`, memuat seluruh permohonan banding untuk ditinjau admin. |

---

### 📊 08. Financial Reports & Buku Kas (3 Requests)

| ID | Nama Pengujian API | HTTP Method | Endpoint URL | Role Akses | Script Assertion & Validasi |
|---|---|---|---|---|---|
| **8.1** | **Get My Personal Transactions** | `GET` | `/api/transactions/my` | Authenticated | Status `200 OK`, memuat riwayat mutasi dompet pengguna yang sedang login. |
| **8.2** | **Get Global Financial Ledger** | `GET` | `/api/transactions` | Admin Only | Status `200 OK`, memuat audit buku kas transaksi seluruh platform. |
| **8.3** | **Get Executive Financial Summary** | `GET` | `/api/transactions/summary` | Admin Only | Status `200 OK`, respon memuat `total_gmv`, `escrow_balance`, dan `platform_fee_revenue`. |

---

### ⏱️ 09. Curator Performance & SLA (1 Request)

| ID | Nama Pengujian API | HTTP Method | Endpoint URL | Role Akses | Script Assertion & Validasi |
|---|---|---|---|---|---|
| **9.1** | **Get Curator Performance Metrics** | `GET` | `/api/curator-performance` | Admin Only | Status `200 OK`, memuat `average_response_time_minutes`, `approval_rate`, dan total tindakan. |

---

### ❤️ 10. Audit Logs & Social (6 Requests)

| ID | Nama Pengujian API | HTTP Method | Endpoint URL | Role Akses | Script Assertion & Validasi |
|---|---|---|---|---|---|
| **10.1** | **Get Chronological Audit Logs** | `GET` | `/api/audit-logs` | Admin Only | Status `200 OK`, memuat rekam jejak linimasa kronologis seluruh aksi moderasi/admin. |
| **10.2** | **Follow Artist** | `POST` | `/api/social/follow/:artistId` | Client / Artist | Status `200 OK`, menambahkan relasi follow ke artis. |
| **10.3** | **Unfollow Artist (Toggle)** | `POST` | `/api/social/follow/:artistId` | Client / Artist | Status `200 OK`, toggle membatalkan status follow. |
| **10.4** | **Favorite Artwork** | `POST` | `/api/social/favorite/:artworkId` | Client / Artist | Status `200 OK`, menambahkan karya ke daftar favorit. |
| **10.5** | **Unfavorite Artwork (Toggle)** | `POST` | `/api/social/favorite/:artworkId` | Client / Artist | Status `200 OK`, toggle membatalkan status favorit. |
| **10.6** | **Get My Favorite Artworks** | `GET` | `/api/social/favorite` | Client / Artist | Status `200 OK`, memuat daftar seluruh karya seni yang disukai user. |

---

## 🧪 2. Matriks Pengujian Unit Test NestJS (25 Test Suites, 173 Tests)

Backend TruBrush dilengkapi pengujian unit test menyeluruh (`.spec.ts`) pada setiap layer *Controller* dan *Service*:

```bash
# Jalankan seluruh unit test suite
pnpm test
```

### Rincian Cakupan Unit Test Suites:
1. `auth.controller.spec.ts` & `auth.service.spec.ts` (Login, Register, Refresh Token, JWT validation)
2. `users.controller.spec.ts` & `users.service.spec.ts` (Topup, Withdraw min 100k, Create Curator, RBAC)
3. `artworks.controller.spec.ts` & `artworks.service.spec.ts` (Post Art, Pagination Feed, Pending, Curate, Tags)
4. `commissions.controller.spec.ts` & `commissions.service.spec.ts` (Order, Accept, Pay Escrow, Sketch, Final, Escrow 95/5%)
5. `disputes.controller.spec.ts` & `disputes.service.spec.ts` (File Dispute, Refund 100%, Strike Penalty)
6. `reports.controller.spec.ts` & `reports.service.spec.ts` (Report Artwork, Takedown & +1 Strike)
7. `appeals.controller.spec.ts` & `appeals.service.spec.ts` (Appeal submission, Admin Review & Strike Reset)
8. `transactions.controller.spec.ts` & `transactions.service.spec.ts` (Personal Ledger, Global Ledger, Financial Summary 5%)
9. `curator-performance.controller.spec.ts` & `curator-performance.service.spec.ts` (SLA calculation, Approval rates)
10. `audit-logs.controller.spec.ts` & `audit-logs.service.spec.ts` (Chronological filtering)
11. `social.controller.spec.ts` & `social.service.spec.ts` (Follow/Unfollow Toggle, Favorite Toggle)
12. `profiles.controller.spec.ts` & `profiles.service.spec.ts` (Profile & Bio Updates)
13. `upload.controller.spec.ts` & `upload.service.spec.ts` (Single & Multi-file Upload Validation)
14. `app.controller.spec.ts` & `app.service.spec.ts` (Healthcheck & Root Routing)

**Status Hasil:** **100% Passed (25/25 Suites, 173/173 Tests, 0 Failed)**.
