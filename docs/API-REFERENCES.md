# 📚 TruBrush Backend REST API References

Dokumentasi komprehensif seluruh endpoint REST API platform **TruBrush** (`crack-be-diba15`). Dokumen ini mencakup metode HTTP, path rute, hak akses (*Role-Based Access Control*), skema payload (*request body / query params*), format respons, dan fungsi bisnis masing-masing endpoint.

---

## 📑 Daftar Isi Modul API

1. [Health Check (`/api/health`)](#1-health-check-apihealth)
2. [Otentikasi & Sesi Pengguna (`/api/auth`)](#2-otentikasi--sesi-pengguna-apiauth)
3. [Manajemen Pengguna & Dompet (`/api/users`)](#3-manajemen-pengguna--dompet-apiusers)
4. [Profil Seniman & Klien (`/api/profiles`)](#4-profil-seniman--klien-apiprofiles)
5. [Karya Seni & Katalog Tag (`/api/artworks`)](#5-karya-seni--katalog-tag-apiartworks)
6. [Siklus Pesanan Komisi & Escrow (`/api/commissions`)](#6-siklus-pesanan-komisi--escrow-apicommissions)
7. [Mediasi Sengketa Komisi (`/api/disputes`)](#7-mediasi-sengketa-komisi-apidisputes)
8. [Laporan Pelanggaran Karya (`/api/reports`)](#8-laporan-pelanggaran-karya-apireports)
9. [Banding Akun Seniman (`/api/appeals`)](#9-banding-akun-seniman-apiappeals)
10. [Buku Kas & Laporan Finansial (`/api/transactions`)](#10-buku-kas--laporan-finansial-apitransactions)
11. [Kinerja & Metrik SLA Kurator (`/api/curator-performance`)](#11-kinerja--metrik-sla-kurator-apicurator-performance)
12. [Rekam Jejak Log Audit Kronologis (`/api/audit-logs`)](#12-rekam-jejak-log-audit-kronologis-apiaudit-logs)
13. [Interaksi Sosial: Favorit & Follow (`/api/social`)](#13-interaksi-sosial-favorit--follow-apisocial)
14. [Unggah Berkas & Media Storage (`/api/upload`)](#14-unggah-berkas--media-storage-apiupload)

---

## 1. Health Check (`/api/health`)

Menyediakan endpoint probe untuk monitoring ketersediaan server dan kesehatan koneksi basis data.

| Method | Endpoint | Hak Akses | Deskripsi & Fungsi |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | **Publik** | Menguji status sistem dan memastikan koneksi PostgreSQL via Prisma ORM aktif. Mengembalikan `{ status: 'ok', database: true }`. Status HTTP `200 OK` (atau `503 Service Unavailable` jika DB putus). |

---

## 2. Otentikasi & Sesi Pengguna (`/api/auth`)

Menangani pendaftaran, login berbasis JWT, rotasi refresh token via HttpOnly Cookie, dan pemulihan kata sandi.

| Method | Endpoint | Hak Akses | Payload / Parameter | Deskripsi & Fungsi |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | **Publik** | Body: `RegisterDto` (`email`, `password`, `name`, `role`) | Mendaftar akun baru (role: `artist` atau `client`), melakukan hash password (bcrypt), menghasilkan JWT access token, dan menyetel cookie `refresh_token`. |
| `POST` | `/api/auth/login` | **Publik** | Body: `LoginDto` (`email`, `password`) | Verifikasi kredensial pengguna, mengembalikan `{ accessToken }`, dan menyimpan `refresh_token` pada HttpOnly Cookie. |
| `POST` | `/api/auth/refresh` | **Refresh Cookie** | Cookie: `refresh_token` | Memvalidasi token refresh yang tersimpan di cookie, melakukan rotasi token, dan menerbitkan access token baru. |
| `POST` | `/api/auth/logout` | **Publik** | Cookie: `refresh_token` | Menghapus sesi refresh token dari database dan membersihkan cookie browser. |
| `POST` | `/api/auth/forgot-password` | **Publik** | Body: `ForgotPasswordDto` (`email`) | Membuat token reset kata sandi sementara dan mengirim tautan reset ke email pengguna (rate limited 3 req/menit). |
| `POST` | `/api/auth/reset-password` | **Publik** | Body: `ResetPasswordDto` (`token`, `newPassword`) | Memperbarui kata sandi pengguna dengan token reset yang valid. |
| `GET` | `/api/auth/me` | **Bearer Token** | Header: `Authorization: Bearer <token>` | Mengambil data profil dan identitas akun pengguna yang sedang login (`id`, `email`, `role`, `name`). |

---

## 3. Manajemen Pengguna & Dompet (`/api/users`)

Menangani mutasi saldo dompet, manajemen akun admin, dan data pengguna.

| Method | Endpoint | Hak Akses | Payload / Parameter | Deskripsi & Fungsi |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/users/balance` | **Bearer Token** | - | Melihat saldo dompet terkini (`balance`) dari pengguna yang sedang login. |
| `POST` | `/api/users/topup` | **Bearer Token** | Body: `TopUpDto` (`amount`, `paymentMethod`) | Menambahkan saldo dompet pengguna secara instan dan mencatat log mutasi `WalletTransaction` tipe `topup`. |
| `POST` | `/api/users/withdraw` | **Artist** | Body: `WithdrawDto` (`amount`, `bankName`, `accountNumber`, `accountName`) | Melakukan penarikan dana seniman ke rekening bank (minimal Rp 100.000). Saldo artis dipotong dan dicatat transaksi `withdraw`. |
| `POST` | `/api/users` | **Admin** | Body: `CreateUserDto` (`email`, `password`, `name`, `role`) | Mendaftarkan akun staf kurator atau admin baru secara manual dari panel admin. |
| `GET` | `/api/users` | **Admin** | - | Mengambil seluruh daftar pengguna platform untuk tabel `/dashboard/manage-users`. |
| `GET` | `/api/users/:id` | **Self / Admin** | Param: `id` (User ID) | Melihat rincian detail profil pengguna (user hanya bisa melihat profil sendiri, admin bisa melihat profil siapapun). |
| `PATCH` | `/api/users/:id` | **Self / Admin** | Param: `id`, Body: `UpdateUserDto` | Mengubah informasi profil user. Pengguna biasa dilarang mengubah kolom `role` dan `balance`. |
| `DELETE` | `/api/users/:id` | **Admin** | Param: `id` | Menghapus data akun pengguna dari sistem. |

---

## 4. Profil Seniman & Klien (`/api/profiles`)

Menangani kustomisasi profil lanjutan seperti bio, avatar, status komisi, dan harga dasar.

| Method | Endpoint | Hak Akses | Payload / Parameter | Deskripsi & Fungsi |
| :--- | :--- | :--- | :--- | :--- |
| `PATCH` | `/api/profiles` | **Bearer Token** | Body: `UpdateProfileDto` (`bio`, `avatarUrl`, `isOpenForCommission`, `basePriceIdr`, `socialLinks`) | Memperbarui atribut profil publik milik pengguna yang sedang login. |

---

## 5. Karya Seni & Katalog Tag (`/api/artworks`)

Menangani eksplorasi feed publik, pengunggahan karya & bukti WIP anti-AI, moderasi kuratorial, dan CRUD master tag.

| Method | Endpoint | Hak Akses | Payload / Parameter | Deskripsi & Fungsi |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/artworks` | **Publik** | Query: `search`, `tag`, `artistId`, `curationStatus`, `isVisibleOnFeed`, `page`, `limit` | Mengambil daftar karya seni publik dengan filter kategori tag, pencarian teks, dan paginasi (batch 6 item). |
| `GET` | `/api/artworks/tags/popular` | **Publik** | - | Mengambil daftar tag seni yang paling sering digunakan pada karya. |
| `GET` | `/api/artworks/artists/popular` | **Publik** | - | Mengambil daftar seniman terpopuler berdasarkan jumlah karya dan apresiasi favorit. |
| `GET` | `/api/artworks/artists` | **Publik** | - | Mengambil seluruh daftar profil seniman terdaftar. |
| `GET` | `/api/artworks/artists/:id` | **Publik** | Param: `id` (Artist ID) | Mengambil detail profil seniman spesifik beserta statistik karya dan tanggal bergabung. |
| `GET` | `/api/artworks/tags` | **Publik** | - | Mengambil seluruh katalog master tag global untuk autocomplete pencarian dan filter feed. |
| `POST` | `/api/artworks/tags` | **Admin** | Body: `CreateTagDto` (`name`) | Menambahkan master tag baru ke dalam sistem katalog. |
| `PATCH` | `/api/artworks/tags/:id` | **Admin** | Param: `id`, Body: `UpdateTagDto` (`name`) | Mengubah nama tag yang sudah ada. |
| `DELETE` | `/api/artworks/tags/:id` | **Admin** | Param: `id` | Menghapus tag master secara aman (melepaskan relasi dari karya tanpa menghapus karya seninya). |
| `GET` | `/api/artworks/pending` | **Curator / Admin**| - | Mengambil antrean karya seni berstatus `pending` kurasi untuk ditinjau bukti WIP-nya pada panel `/dashboard/review-artworks`. |
| `GET` | `/api/artworks/:id` | **Publik** | Param: `id` (Artwork ID) | Mengambil detail lengkap karya seni, termasuk media gambar utama, relasi tag, data seniman, dan panel bukti alur kerja (*WIP proof*). |
| `POST` | `/api/artworks` | **Artist** | Body: `CreateArtworkDto` (`title`, `description`, `images`, `wipFiles`, `tagNames`, `uploadType`) | Mengunggah karya baru. Jika `uploadType='curated'`, karya diset `pending` dan masuk antrean kurasi anti-AI; jika `'direct'`, langsung tayang di feed. |
| `PATCH` | `/api/artworks/:id` | **Owner / Admin** | Param: `id`, Body: `UpdateArtworkDto` (`title`, `description`, `isVisibleOnFeed`, dll.) | Mengubah data karya seni, atau melakukan **Takedown / Restore** visibilitas feed oleh Admin. |
| `PATCH` | `/api/artworks/:id/curate`| **Curator / Admin**| Param: `id`, Body: `CurateArtworkDto` (`curationStatus`: `'approved'\|'rejected'`, `rejectionReason`) | Melakukan verifikasi keaslian karya. Jika approved: karya diberi badge 'Verified' dan tayang di feed publik; jika rejected: hanya tampil di profil seniman. |
| `DELETE` | `/api/artworks/:id` | **Owner / Admin** | Param: `id` | Menghapus entitas karya seni beserta seluruh relasi tag dan bukti WIP-nya. |

---

## 6. Siklus Pesanan Komisi & Escrow (`/api/commissions`)

Menangani siklus komisi kustom dari penawaran, pembayaran rekening bersama (*Escrow Vault*), persetujuan bertahap sketsa, hingga pencairan dana (*payout* 95% artis, 5% fee platform).

| Method | Endpoint | Hak Akses | Payload / Parameter | Deskripsi & Fungsi |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/commissions` | **Client** | Body: `CreateCommissionDto` (`artistsId`, `commissionTitle`, `description`, `price`) | Klien membuat pesanan komisi kustom baru ke seniman. Pesanan berstatus awal `pending`. |
| `GET` | `/api/commissions` | **Bearer Token** | Query: `as` (`'client'\|'artist'`) | Melihat seluruh daftar pesanan komisi milik pengguna login (admin dapat melihat seluruh transaksi platform). |
| `GET` | `/api/commissions/:id` | **Participant / Admin** | Param: `id` (Commission ID) | Melihat detail pesanan komisi, riwayat revisi, bukti sketsa, deliverable akhir, dan status pembayaran escrow. |
| `PATCH` | `/api/commissions/:id/respond` | **Artist** | Param: `id`, Body: `RespondCommissionDto` (`status`: `'accepted'\|'cancelled'`) | Seniman menerima atau menolak pesanan komisi. Jika diterima, pesanan menunggu pembayaran dari klien. |
| `PATCH` | `/api/commissions/:id/pay` | **Client** | Param: `id`, Body: `{ paymentMethod, cardLastFour }` | Klien membayar nilai komisi (+ fee 5%). Dana dipotong dari saldo dompet klien dan **dikunci di rekening Escrow** (`in_progress`). |
| `PATCH` | `/api/commissions/:id/progress` | **Artist** | Param: `id`, Body: `UpdateProgressDto` (`sketchUrl`, `finalArtworkUrl`) | Seniman mengunggah bukti milestone (sketsa awal atau pratinjau hasil karya akhir). |
| `PATCH` | `/api/commissions/:id/approve` | **Client** | Param: `id`, Body: `{ step: 'sketch'\|'final' }` | Klien menyetujui tahapan sketsa atau menyetujui karya akhir untuk lanjut ke pencairan. |
| `PATCH` | `/api/commissions/:id/complete` | **Artist** | Param: `id` | Seniman menyelesaikan pesanan setelah hasil disetujui klien. Sistem otomatis **mencairkan 95% dana ke saldo seniman** dan membukukan **5% sebagai pendapatan fee platform**. |
| `POST` | `/api/commissions/:id/revisions` | **Participant** | Param: `id`, Body: `CreateRevisionDto` (`comment`) | Klien meminta revisi pada karya yang sedang dikerjakan (selama batas maksimal revisi belum terlampaui). |
| `PATCH` | `/api/commissions/:id/cancel` | **Client** | Param: `id` | Klien membatalkan pesanan yang belum disetujui dan menerima pengembalian dana escrow (*refund*). |

---

## 7. Mediasi Sengketa Komisi (`/api/disputes`)

Menangani sengketa bila terjadi ketidaksepakatan atau seniman mangkir dari pesanan komisi.

| Method | Endpoint | Hak Akses | Payload / Parameter | Deskripsi & Fungsi |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/disputes` | **Client / Artist**| Body: `CreateDisputeDto` (`commissionId`, `reason`) | Mengajukan sengketa komisi aktif. Komisi dibekukan (*disputed*) dan menunggu mediasi staf. |
| `GET` | `/api/disputes` | **Curator / Admin**| Query: `status` (`pending`, `resolved`, `dismissed`) | Melihat antrean daftar seluruh kasus sengketa komisi platform. |
| `GET` | `/api/disputes/:id` | **Participant / Admin** | Param: `id` (Dispute ID) | Melihat kronologi detail sengketa, alasan pelapor, dan catatan hasil mediasi. |
| `PATCH` | `/api/disputes/:id/resolve` | **Curator / Admin**| Param: `id`, Body: `ResolveDisputeDto` (`approved`: boolean, `resolutionNotes`) | Memutuskan sengketa: Jika approved: dana escrow 100% di-*refund* ke klien dan seniman dikenakan sanksi +1 strike; jika rejected: dana dicairkan ke seniman. |

---

## 8. Laporan Pelanggaran Karya (`/api/reports`)

Menangani aduan karya yang terindikasi buatan Generative AI liar, plagiarisme, atau pelanggaran hak cipta.

| Method | Endpoint | Hak Akses | Payload / Parameter | Deskripsi & Fungsi |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/reports` | **Bearer Token** | Body: `CreateReportDto` (`targetType`, `targetId`, `reason`) | Pengguna melaporkan karya seni yang terindikasi melanggar pedoman platform anti-AI (rate limited 3 req/menit). |
| `GET` | `/api/reports` | **Curator / Admin**| Query: `status` (`pending`, `resolved`, `dismissed`) | Melihat antrean seluruh aduan pengguna yang menunggu peninjauan kurator di `/dashboard/review-reports`. |
| `GET` | `/api/reports/:id` | **Bearer Token** | Param: `id` (Report ID) | Mengambil rincian detail aduan laporan pelanggaran karya. |
| `PATCH` | `/api/reports/:id/resolve` | **Curator / Admin**| Param: `id`, Body: `ResolveReportDto` (`status`: `'resolved'\|'dismissed'`, `resolutionNotes`) | Memutuskan aduan: Jika resolved (terbukti bersalah): karya otomatis disembunyikan dari feed publik (`isVisibleOnFeed: false`) dan seniman menerima **+1 Strike Point**. |

---

## 9. Banding Akun Seniman (`/api/appeals`)

Menangani permohonan pemulihan akun seniman yang dibekukan akibat akumulasi sanksi ($\ge 5$ strikes).

| Method | Endpoint | Hak Akses | Payload / Parameter | Deskripsi & Fungsi |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/appeals` | **Artist** | Body: `CreateAppealDto` (`reason`) | Seniman yang akunnya terkena sanksi mengajukan permohonan banding pemulihan akun beserta alasan dan bukti orisinalitas tambahan. |
| `GET` | `/api/appeals` | **Admin** | Query: `status` (`pending`, `approved`, `rejected`) | Admin melihat seluruh daftar permohonan banding pada halaman `/dashboard/manage-users`. |
| `GET` | `/api/appeals/my` | **Artist** | - | Seniman melihat riwayat dan status permohonan banding milik dirinya sendiri. |
| `GET` | `/api/appeals/:id` | **Admin / Artist** | Param: `id` (Appeal ID) | Mengambil rincian detail permohonan banding tertentu. |
| `PATCH` | `/api/appeals/:id/resolve` | **Admin** | Param: `id`, Body: `ResolveAppealDto` (`approved`: boolean, `resolutionNotes`?: string) | Admin memproses permohonan banding. Jika approved: status akun dipulihkan dan **jumlah strike seniman di-reset menjadi 0**; jika rejected: akun tetap dibekukan. |

---

## 10. Buku Kas & Laporan Finansial (`/api/transactions`)

Menyediakan audit buku kas mutasi dompet (`WalletTransaction`) dan kalkulasi ringkasan finansial eksekutif platform.

| Method | Endpoint | Hak Akses | Payload / Parameter | Deskripsi & Fungsi |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/transactions/my` | **Bearer Token** | - | Mengambil riwayat mutasi dompet pribadi pengguna login (`topup`, `withdraw`, `commission_payment`, `commission_payout`). |
| `GET` | `/api/transactions/summary` | **Admin** | - | Menghitung agregasi finansial platform: **Total GMV Transaksi**, **Saldo Tertahan di Escrow**, **Total Pendapatan Fee Platform (5%)**, dan **Total Pencairan Artis**. |
| `GET` | `/api/transactions` | **Admin** | Query: `FilterTransactionDto` (`type`, `search`, `startDate`, `endDate`, `page`, `limit`) | Mengambil seluruh catatan buku kas transaksi platform dengan filter rentang tanggal, jenis transaksi, dan fitur ekspor data. |
| `GET` | `/api/transactions/:id` | **Bearer Token** | Param: `id` (Transaction ID) | Mengambil rincian spesifik satu log mutasi transaksi. |

---

## 11. Kinerja & Metrik SLA Kurator (`/api/curator-performance`)

Menghitung performa kurasi tim kurator, kecepatan SLA respons peninjauan anti-AI, dan rasio persetujuan.

| Method | Endpoint | Hak Akses | Payload / Parameter | Deskripsi & Fungsi |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/curator-performance` | **Admin** | Query: `CuratorPerformanceQueryDto` (`startDate`, `endDate`) | Menghitung metrik SLA kurator: rata-rata waktu respons kurasi dalam menit (`reviewedAt - createdAt`), rasio kelolosan (*approval rate* anti-AI), total karya diperiksa, spotlight kurator terbaik, dan rincian beban kerja per kurator. |

---

## 12. Rekam Jejak Log Audit Kronologis (`/api/audit-logs`)

Mencatat seluruh keputusan moderasi dan tindakan administratif staf untuk transparansi dan kepatuhan audit.

| Method | Endpoint | Hak Akses | Payload / Parameter | Deskripsi & Fungsi |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/audit-logs` | **Curator / Admin**| Query: `AuditLogQueryDto` (`category`, `search`, `startDate`, `endDate`, `page`, `limit`) | Mengambil agregasi kronologis rekam jejak keputusan moderasi (kurasi karya seni, penyelesaian laporan aduan, mediasi sengketa komisi, dan persetujuan banding akun). |

---

## 13. Interaksi Sosial: Favorit & Follow (`/api/social`)

Menangani fitur sosial seperti menyukai karya (*favorite*) dan mengikuti seniman (*follow*).

| Method | Endpoint | Hak Akses | Payload / Parameter | Deskripsi & Fungsi |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/social/favorite/:artworkId` | **Bearer Token** | Param: `artworkId` | Melakukan toggle like/favorit pada karya seni. Jika sudah difavoritkan, aksi ini akan membatalkan status favorit (*unfavorite*). |
| `GET` | `/api/social/favorite` | **Bearer Token** | - | Mengambil daftar lengkap karya seni yang disukai oleh pengguna yang sedang login. |
| `GET` | `/api/social/favorite/ids` | **Bearer Token** | - | Mengambil array string ID karya seni favorit pengguna (untuk sinkronisasi status ikon hati di feed secara instan). |
| `POST` | `/api/social/follow/:artistId` | **Bearer Token** | Param: `artistId` | Melakukan toggle follow/unfollow pada seniman target. |
| `GET` | `/api/social/following` | **Bearer Token** | - | Mengambil daftar lengkap seniman yang sedang diikuti oleh pengguna login. |
| `GET` | `/api/social/following/ids` | **Bearer Token** | - | Mengambil array string ID seniman yang diikuti (untuk sinkronisasi tombol follow di UI feed). |

---

## 14. Unggah Berkas & Media Storage (`/api/upload`)

Menangani pengunggahan berkas media ke penyimpanan awan (*Supabase Storage*) dengan validasi ukuran dan tipe mime yang ketat.

| Method | Endpoint | Hak Akses | Payload / Batasan Berkas | Deskripsi & Fungsi |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/upload` | **Bearer Token** | Multipart: `file` (Maks 5MB, format: jpg/png/webp) | Mengunggah gambar avatar profil pengguna. Mengembalikan `{ url: string }`. |
| `POST` | `/api/upload/bulk` | **Bearer Token** | Multipart: `files` (Maks 5 file, maks 10MB gambar, maks 30MB video), Query: `folder` (`artworks`\|`wips`) | Mengunggah batch media karya seni dan video proses timelapse pengerjaan (bukti WIP anti-AI). Mengembalikan `{ urls: string[] }`. |
| `POST` | `/api/upload/commissions/:commissionId/wip` | **Bearer Token** | Multipart: `files` (Maks 5 file), Param: `commissionId` | Mengunggah berkas bukti progres pengerjaan komisi ke direktori komisi terkait. |
| `POST` | `/api/upload/commissions/:commissionId/sketch` | **Bearer Token** | Multipart: `file` (Maks 30MB), Param: `commissionId` | Mengunggah berkas gambar sketsa atau video WIP komisi untuk ditinjau klien. |
| `POST` | `/api/upload/commissions/:commissionId/preview` | **Bearer Token** | Multipart: `file` (Maks 15MB), Param: `commissionId` | Mengunggah gambar pratinjau hasil akhir komisi sebelum file master diserahkan. |
| `POST` | `/api/upload/commissions/:commissionId/final` | **Bearer Token** | Multipart: `file` (Maks 100MB, zip/rar/pdf/psd/gambar), Param: `commissionId` | Mengunggah berkas master deliverable akhir komisi ke direktori final dan memperbarui data progress di database. |
