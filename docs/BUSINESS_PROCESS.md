# 📖 Dokumentasi Lengkap Aplikasi & Proses Bisnis End-to-End TruBrush

Dokumen ini merangkum secara komprehensif **arsitektur sistem, hak akses pengguna, spesifikasi modul, dan seluruh proses bisnis *end-to-end* (E2E)** pada platform **TruBrush**.

---

## 📑 Daftar Isi
1. [Ringkasan Platform & Nilai Bisnis](#1-ringkasan-platform--nilai-bisnis)
2. [Aktor Sistem & Matriks Hak Akses (RBAC)](#2-aktor-sistem--matriks-hak-akses-rbac)
3. [Alur Proses Bisnis End-to-End (E2E Workflows)](#3-alur-proses-bisnis-end-to-end-e2e-workflows)
   - [3.1 Alur Registrasi, Otentikasi & Pengalihan Sesi](#31-alur-registrasi-otentikasi--pengalihan-sesi)
   - [3.2 Alur Unggah Karya Seni & Kurasi Anti-AI](#32-alur-unggah-karya-seni--kurasi-anti-ai)
   - [3.3 Alur Pesanan Komisi & Perlindungan Dana Escrow](#33-alur-pesanan-komisi--perlindungan-dana-escrow)
   - [3.4 Alur Dompet: Top Up Saldo & Penarikan Dana Artis (*Withdraw*)](#34-alur-dompet-top-up-saldo--penarikan-dana-artis-withdraw)
   - [3.5 Alur Pelaporan Karya, Penalti Strike & Banding Akun](#35-alur-pelaporan-karya-penalti-strike--banding-akun)
   - [3.6 Alur Interaksi Sosial & Pencarian Multi-Entitas](#36-alur-interaksi-sosial--pencarian-multi-entitas)
   - [3.7 Alur Dashboard Eksekutif & Manajemen Pengguna Admin](#37-alur-dashboard-eksekutif--manajemen-pengguna-admin)
4. [Mekanisme Keamanan Hak Cipta & Anti-Scraping AI](#4-mekanisme-keamanan-hak-cipta--anti-scraping-ai)
5. [Struktur Model Data Database (ERD Prisma)](#5-struktur-model-data-database-erd-prisma)

---

## 🌐 1. Ringkasan Platform & Nilai Bisnis

**TruBrush** lahir sebagai solusi ekosistem seni digital yang aman dan transparan di tengah maraknya konten buatan kecerdasan buatan (*generative AI*). 

### Nilai Utama Platform:
1. **Perlindungan Hak Cipta Seniman Manusia:** Menjamin bahwa seluruh karya yang berlabel terverifikasi di feed publik dibuat secara otentik oleh manusia melalui bukti alur kerja (*Proof of Work / Work In Progress*).
2. **Kurasi Independen & Transparan:** Komunitas kurator meninjau bukti sketsa, rekaman video proses, dan layer pengerjaan sebelum karya lolos verifikasi.
3. **Pasar Komisi Aman Berbasis Escrow:** Klien membayar di muka ke rekening *escrow* platform (dengan biaya admin 5%), dan dana baru dicairkan ke seniman setelah karya final disetujui tanpa risiko penipuan dari kedua belah pihak.
4. **Anti-Scraping & Copy Defense:** Fitur keamanan browser canggih yang menghalangi scraping bot AI, screenshot liar, dan pengunduhan deliverable tanpa izin.

---

## 👥 2. Aktor Sistem & Matriks Hak Akses (RBAC)

Platform TruBrush memiliki 4 peran pengguna (*Roles*) ditambah 1 status pengunjung umum:

```mermaid
graph TD
    User((Pengguna))
    User --> Guest["Tamu / Guest (Belum Login)"]
    User --> Client["Client (Klien / Pemesan)"]
    User --> Artist["Artist (Seniman / Illustrator)"]
    User --> Curator["Curator (Kurator Moderasi)"]
    User --> Admin["Admin (Super Administrator)"]
```

### Matriks Hak Akses Fitur:

| Fitur / Modul | Tamu (Guest) | Client | Artist | Curator | Admin |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Jelajah Feed & Portofolio Artis | ✅ | ✅ | ✅ | ✅ | ✅ |
| Pencarian Karya, Tag & Artis | ✅ | ✅ | ✅ | ✅ | ✅ |
| Like / Favorite Karya & Follow Artis | ❌ (Redirect Login) | ✅ | ✅ | ✅ | ✅ |
| Unggah Karya & Bukti WIP (`/post-art`) | ❌ | ❌ | ✅ | ❌ | ❌ |
| Memesan Komisi Seni (`Order Modal`) | ❌ (Redirect Login) | ✅ | ❌ | ❌ | ❌ |
| Bayar Komisi ke Escrow (`/payment`) | ❌ | ✅ | ❌ | ❌ | ❌ |
| Unggah Deliverables & Kirim Revisi | ❌ | ❌ | ✅ | ❌ | ❌ |
| Setujui Hasil Akhir & Release Escrow | ❌ | ✅ | ❌ | ❌ | ❌ |
| Ajukan Sengketa Komisi (*File Dispute*) | ❌ | ✅ | ❌ | ❌ | ❌ |
| Top Up Saldo Dompet (`/topup`) | ❌ | ✅ | ✅ | ❌ | ❌ |
| Penarikan Dana Artis (`/withdraw`) | ❌ | ❌ | ✅ | ❌ | ❌ |
| Ajukan Banding Akun (`ArtistAppealBox`) | ❌ | ❌ | ✅ (Jika Strike) | ❌ | ❌ |
| Lapor Karya Bermasalah (`Report Modal`)| ❌ (Redirect Login) | ✅ | ✅ | ✅ | ✅ |
| Review & Kurasi Karya Anti-AI | ❌ | ❌ | ❌ | ✅ | ✅ |
| Review Laporan Pengguna | ❌ | ❌ | ❌ | ✅ | ✅ |
| Resolusi Sengketa Komisi (*Dispute*) | ❌ | ❌ | ❌ | ❌ | ✅ |
| Resolusi Banding Artis (*Appeals*) | ❌ | ❌ | ❌ | ❌ | ✅ |
| Kelola Akun & Tambah Kurator Baru | ❌ | ❌ | ❌ | ❌ | ✅ |
| Monitoring Finansial & Fee 5% Platform | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 🔄 3. Alur Proses Bisnis End-to-End (E2E Workflows)

### 3.1 Alur Registrasi, Otentikasi & Pengalihan Sesi

```mermaid
sequenceDiagram
    autonumber
    actor User as Pengguna
    participant FE as Next.js Frontend
    participant Proxy as Next.js Middleware (proxy.ts)
    participant BFF as API Route (/api/auth)
    participant BE as NestJS Backend
    participant DB as Supabase PostgreSQL

    User->>FE: Isi form /signup (Pilih role: Artist / Client)
    FE->>BFF: POST /api/auth/register
    BFF->>BE: POST /api/auth/register
    BE->>DB: Simpan User (Password di-hash bcrypt) & Profile
    BE-->>BFF: Response { accessToken, set-cookie: refresh_token }
    BFF-->>FE: Token tersimpan di Memory RAM & HttpOnly Cookie
    FE-->>User: Berhasil daftar, diarahkan ke Login / Beranda

    User->>FE: Isi form /login (Email + Password)
    FE->>BFF: POST /api/auth/login
    BFF->>BE: POST /api/auth/login
    BE-->>BFF: Set Cookie refresh_token & return Access Token
    BFF-->>FE: Simpan sesi di Zustand (UserStore)
    alt Role adalah Admin atau Curator
        FE->>User: Auto-redirect ke /dashboard
    else Role adalah Artist atau Client
        FE->>User: Auto-redirect ke / (Beranda)
    end
```

---

### 3.2 Alur Unggah Karya Seni & Kurasi Anti-AI

```mermaid
sequenceDiagram
    autonumber
    actor Artist as Artist (Illustrator)
    participant FE as Frontend (/post-art)
    participant Curator as Kurator (/dashboard/review-artworks)
    participant BE as NestJS Backend
    participant Feed as Feed Publik (Beranda)

    Artist->>FE: Isi Judul, Deskripsi, Tag, Tipe Upload
    Artist->>FE: Unggah File Karya Utama (Gambar/Video)
    Artist->>FE: Unggah Bukti WIP (Sketsa, Layer, Timelapse)
    
    alt Opsi Kurasi Dicentang (is_curated_by_curator = true)
        Artist->>FE: Submit Form
        FE->>BE: POST /api/artwork (Status: pending)
        Note over BE,Feed: Karya TIDAK muncul di Feed Publik
        Curator->>BE: Buka /dashboard/review-artworks
        Curator->>Curator: Periksa bukti proses & layer pengerjaan
        alt Karya Lolos Verifikasi Manusia
            Curator->>BE: Klik Approve
            BE->>BE: Status karya -> 'approved'
            BE->>BE: approvedPortfolioCount artist bertambah (+1)
            opt Jika approvedPortfolioCount >= 5
                BE->>BE: Artist status -> 'is_verified = true'
            end
            BE-->>Feed: Karya otomatis TAMPIL di Feed Utama
        else Terdeteksi Buatan AI / Jiplakan
            Curator->>BE: Klik Reject + Masukkan Alasan Penolakan
            BE->>BE: Status karya -> 'rejected'
            Note over BE,Artist: Karya hanya tampil di /profile artis pribadi
        end
    else Opsi Kurasi Tidak Dicentang (is_curated_by_curator = false)
        Artist->>FE: Submit Form
        FE->>BE: POST /api/artwork (Status: unapproved)
        BE-->>Feed: Langsung TAMPIL di Feed Publik (Label: Unverified)
    end
```

---

### 3.3 Alur Pesanan Komisi & Perlindungan Dana Escrow

```mermaid
sequenceDiagram
    autonumber
    actor Client as Klien
    actor Artist as Seniman (Artist)
    participant Escrow as Rekening Escrow Platform
    participant Admin as Admin (/dashboard/review-disputes)

    Client->>Artist: Klik "Pesan Komisi" di detail karya / profil
    Client->>Artist: Isi Brief Komisi, Tenggat Waktu & Budget IDR (Status: pending)
    
    Artist->>Artist: Menerima notifikasi pesanan di /commissions
    alt Seniman Menerima
        Artist->>Client: Klik "Terima Pesanan" (Status: accepted)
        Client->>Escrow: Bayar via Saldo Dompet / Kartu Kredit di /commissions/[id]/payment
        Note over Client,Escrow: Total Bayar = Harga Komisi + Biaya Platform Fee 5%
        Escrow->>Escrow: Dana ditahan aman di Escrow (Status komisi: in_progress)
        
        loop Pengerjaan & Revisi Karya
            Artist->>Client: Unggah Bukti Progress / Sketsa WIP
            opt Klien Minta Perbaikan
                Client->>Artist: Ajukan Catatan Revisi (Status: revision)
                Artist->>Client: Unggah Ulang Revisi Deliverable
            end
        end

        Artist->>Client: Unggah Final Deliverable (Watermarked & Copy-Protected)
        Client->>Client: Memeriksa hasil karya
        
        alt Klien Puas & Setujui Pesanan
            Client->>Escrow: Klik "Selesaikan & Setujui Pesanan"
            Escrow->>Artist: Cairkan Net Payout (Harga Komisi) ke Saldo Dompet Artist
            Escrow->>Escrow: Platform Fee 5% dibukukan sebagai Pendapatan TruBrush
            Note over Client,Artist: Status komisi: completed
        else Terjadi Sengketa (Seniman Kabur / Tidak Sesuai Brief)
            Client->>Admin: Klik "Ajukan Sengketa" (Status: disputed)
            Admin->>Admin: Tinjau bukti chat & brief komisi di Dashboard
            alt Sengketa Dimenangkan Klien
                Admin->>Client: Refund Dana 100% ke Saldo Dompet Klien
            else Sengketa Dimenangkan Seniman
                Admin->>Artist: Release Dana Payout ke Saldo Dompet Seniman
            end
        end

    else Seniman Menolak
        Artist->>Client: Klik "Tolak Pesanan" (Status: cancelled)
    end
```

---

### 3.4 Alur Dompet: Top Up Saldo & Penarikan Dana Artis (*Withdraw*)

```mermaid
flowchart TD
    subgraph TopUp ["Top Up Saldo (Klien & Seniman)"]
        A1[Masuk ke /topup] --> A2[Pilih Nominal Preset / Input Custom]
        A2 --> A3[Pilih Metode: Virtual Account / Kartu Kredit]
        A3 --> A4[Konfirmasi Pembayaran]
        A4 --> A5[(Saldo User Bertambah)]
        A5 --> A6[Catat Mutasi di Riwayat Dompet]
    end

    subgraph Withdraw ["Penarikan Dana (Khusus Seniman)"]
        B1[Masuk ke /withdraw] --> B2[Validasi: Saldo Tersedia >= Rp 100.000]
        B2 -->|Tidak Cukup| B3[Tampilkan Error & Disable Tombol]
        B2 -->|Cukup| B4[Input Nominal Cair + Pilih Rekening Bank/E-Wallet]
        B4 --> B5[Kalkulasi Biaya Transfer Standar]
        B5 --> B6[Konfirmasi Pencairan Dana]
        B6 --> B7[(Saldo User Berkurang)]
        B7 --> B8[Dana Ditransfer ke Rekening Seniman & Catat Log Transaksi]
    end
```

---

### 3.5 Alur Pelaporan Karya, Penalti Strike & Banding Akun

```mermaid
sequenceDiagram
    autonumber
    actor Reporter as Pelapor (User)
    participant Curator as Kurator / Admin
    actor Violator as Seniman Pelanggar
    participant System as Sistem TruBrush

    Reporter->>Curator: Lapor Karya via "Report Art Modal" (Alasan: AI Art / Hak Cipta)
    Curator->>Curator: Tinjau Laporan di /dashboard/review-reports
    
    alt Laporan Terbukti Benar (Pelanggaran)
        Curator->>System: Klik "Resolve & Takedown Artwork"
        System->>System: Status karya -> 'flagged' (Ditarik dari publik)
        System->>Violator: strikeCount bertambah (+1 Strike)
        
        opt Jika strikeCount >= Batas Penalti
            System->>Violator: Akun Dibekukan / Diberi Penalti Moderasi
            Violator->>System: Mengisi Formulir Banding di /profile (ArtistAppealBox)
            Curator->>Curator: Review Banding di /dashboard/manage-users (ReviewAppealModal)
            alt Banding Diterima
                Curator->>System: Pulihkan Status Akun & Reset Strike
            else Banding Ditolak
                Curator->>System: Pertahankan Sanksi Akun
            end
        end
    else Laporan Tidak Valid / Palsu
        Curator->>System: Klik "Dismiss Report" (Karya tetap aktif)
    end
```

---

### 3.6 Alur Interaksi Sosial & Pencarian Multi-Entitas

1. **Follow Seniman:**
   - User mengklik tombol *Follow* di kartu karya atau header profil seniman.
   - Status tersinkronisasi instan via `useFollowArtist` (jika belum login, muncul modal login).
2. **Favorit Karya:**
   - User mengklik ikon hati (*Like/Favorite*) di kartu atau halaman detail karya.
   - Karya otomatis masuk ke galeri pribadi di halaman `/favorite`.
3. **Pencarian Cepat (*ModalSearch* & `/search/[param]`):**
   - Mendukung pencarian instan dengan *debouncing* 500ms.
   - Mendukung filter cerdas berdasarkan prefix:
     - `tags:"cyberpunk"` $\rightarrow$ Mencari seluruh karya dengan tag *cyberpunk*.
     - `artists:"diba"` $\rightarrow$ Mencari seluruh karya yang dibuat oleh artist *diba*.
     - Teks biasa $\rightarrow$ Mencari berdasarkan judul karya.

---

### 3.7 Alur Dashboard Eksekutif & Manajemen Pengguna Admin

1. **Ringkasan Finansial Eksekutif:**
   - Menghitung otomatis **Total Transaksi GMV** dari seluruh komisi yang berstatus `paid`, `in_progress`, dan `completed`.
   - Menghitung **Pendapatan Bersih Platform (5% Platform Fee)**.
   - Memonitor **Dana Tertahan di Escrow** (komisi aktif yang belum selesai).
   - Memonitor **Pesanan Komisi Aktif**.
2. **Manajemen Pengguna & Kurator (`/dashboard/manage-users`):**
   - Admin dapat menambahkan akun kurator baru (*Create Curator Modal*).
   - Admin dapat menyunting role, memperbarui data pengguna, serta menghapus (*delete*) akun yang melanggar ketentuan.

---

## 🛡️ 4. Mekanisme Keamanan Hak Cipta & Anti-Scraping AI

TruBrush menerapkan arsitektur keamanan bertingkat (*Defense in Depth*) pada sisi browser dan server:

| Mekanisme Keamanan | Implementasi Teknis | Tujuan Perlindungan |
| :--- | :--- | :--- |
| **Window Blur Defense** | `useCopyProtection.ts` | Mengaktifkan tirai blur saat pengguna berpindah tab atau membuka tools screenshot (Snipping Tool). |
| **DevTools & Shortcut Blocker** | `useCopyProtection.ts` | Memblokir tombol `F12`, `Ctrl+Shift+I`, `Ctrl+Shift+J`, dan `Ctrl+U`. |
| **Context Menu & Drag Shield** | `onContextMenu={(e) => e.preventDefault()}` | Mencegah klik kanan untuk menyimpan gambar (`Save Image As...`) dan dragging berkas. |
| **Media Stream Protection** | `controlsList="nodownload"` | Mencegah tombol download bawaan browser pada video timelapse WIP. |
| **RAM-Only Access Token** | `axiosClient.ts` (in-memory variable) | Mencegah pencurian token JWT melalui serangan XSS (tidak disimpan di localStorage). |
| **HttpOnly Refresh Cookie** | `axiosServer.ts` (`httpOnly: true, sameSite: lax`) | Mencegah akses script jahat ke cookie otentikasi jangka panjang. |

---

## 🗄️ 5. Struktur Model Data Database (ERD Prisma)

```
┌──────────────┐       1:1       ┌────────────────┐
│     User     ├─────────────────┤    Profile     │
│ (Auth & Role)│                 │ (Bio & Strikes)│
└──────┬───────┘                 └────────────────┘
       │ 1:N
       ├──────────────────────────────────────────┐
       │ 1:N                                      │ 1:N
┌──────▼───────┐ 1:N     N:1 ┌──────────────┐     │ 1:N (Client/Artist)
│   Artwork    ├─────────────┤  ArtworkTag  │     │
│ (WIP & Art)  │             └──────┬───────┘ ┌───▼────────────┐
└──────┬───────┘                    │ N:1     │   Commission   │
       │ 1:N                        │         │ (Milestone/Pay)│
       ├──────────────┐      ┌──────▼───────┐ └───┬────────────┘
┌──────▼───────┐┌─────▼─────┐│     Tag      │     │ 1:N
│    Report    ││  Favorite ││  (Catalog)   │ ┌───▼────────────┐
│ (Moderation) ││  (Social) │└──────────────┘ │Comm. Revision  │
└──────────────┘└───────────┘                 └────────────────┘
```

---

## 🚀 Kesimpulan & Pedoman Perawatan

Aplikasi TruBrush telah dirancang dengan kepatuhan penuh terhadap prinsip **SOLID, DRY, dan KISS**, arsitektur berbasis kontrak tipe data yang aman (*Type Safety*), serta pemisahan tanggung jawab yang jelas antara layer presentasi, proxy BFF Next.js, dan core engine NestJS.
