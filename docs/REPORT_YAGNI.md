# 📑 LAPORAN AUDIT STRUKTUR BERKAS & ANALISIS PRINSIP YAGNI

## 1. Ringkasan Eksekutif & Pemetaan Struktur Proyek

Proyek **TruBrush** terbagi menjadi dua repositori independen:
- **Backend (`crack-be-diba15`)**: Dibangun dengan **NestJS**, **Prisma ORM 7**, **PostgreSQL (Supabase)**, didokumentasikan dengan **Swagger/Scalar**, dan divalidasi dengan **Biome**.
- **Frontend (`crack-fe-diba15`)**: Dibangun dengan **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4 + DaisyUI v5**, **TanStack Query v5**, dan **Zustand**.

---

### A. Struktur Folder Backend (`crack-be-diba15`)

```
crack-be-diba15/
├── db/                       # Skrip DDL SQL mentah manual
│   └── schema.sql
├── docs/                     # Dokumentasi alur bisnis, logic, postman, test
├── prisma/                   # Prisma schema, migrations, dan seed
│   ├── migrations/           # 8 migration step
│   ├── schema.prisma         # Single source of truth database
│   └── seed.ts
└── src/
    ├── main.ts               # Entry point, helmet, cookie, validation pipe, docs
    ├── app.module.ts         # Root module
    ├── app.controller.ts     # Default boilerplate NestJS (getHello)
    ├── app.service.ts        # Default boilerplate NestJS (getHello)
    ├── appeals/              # Modul banding akun kurasi/strikes
    ├── artworks/             # Modul karya & tag
    ├── audit-logs/           # Modul agregasi riwayat audit moderasi
    ├── auth/                 # Auth isolated module (JWT, guard, decorators)
    ├── commissions/          # Commission workflow & escrow
    ├── common/
    │   ├── interfaces/       # 17 berkas interface repository terpisah
    │   └── middleware/       # Logger dan Maintenance mode middleware
    ├── curator-performance/  # Metrik dan SLA kurator
    ├── disputes/             # Mediasi sengketa komisi
    ├── mail/                 # Integrasi Resend email
    ├── prisma/               # PrismaService & global exception filter
    ├── profiles/             # Update profil pengguna (tanpa file .spec.ts)
    ├── reports/              # Aduan pelanggaran artwork/profile
    ├── session/              # Refresh token session management
    ├── social/               # Favorite & Follow (2 repository dalam 1 modul)
    ├── transactions/         # Buku kas & mutasi dompet/escrow
    ├── upload/               # Integrasi upload Supabase Storage
    └── users/                # CRUD user & balance (topup, withdraw)
```

---

### B. Struktur Folder Frontend (`crack-fe-diba15`)

```
crack-fe-diba15/
├── docs/                     # Checklists, alur bisnis, logic docs
├── public/                   # Aset statis publik (termasuk 5 SVG bawaan template)
└── src/
    ├── proxy.ts              # Route guard middleware resmi Next.js 16
    ├── types/
    │   └── index.ts          # Monolith types (809 baris)
    ├── lib/                  # axiosClient, axiosServer, queryKeys, apiError
    ├── hooks/                # TanStack query hooks & form hooks
    ├── store/                # Zustand stores (UserStore, UserManagementStore, dll.)
    ├── utils/
    │   ├── validation/       # Validasi berkas
    │   ├── dashboard/        # Berkas .tsx column renderers di dalam folder utils
    │   └── index.ts          # Formatters mata uang & tanggal
    ├── components/           # Komponen UI atom, molekul, dan modul halaman
    └── app/                  # Next.js App Router
        ├── (auth)/           # Rute publik (login, signup, forgot/reset password)
        ├── (main)/           # Rute utama (feed, detail, commissions, profile, dll.)
        ├── dashboard/        # Rute panel admin/kurator (8 sub-halaman)
        └── api/              # ~40 Next.js Route Handlers (BFF pass-through ke NestJS)
```

---

## 2. Analisis Berdasarkan Prinsip YAGNI (*You Aren't Gonna Need It*)

Prinsip **YAGNI** menyatakan: **"Jangan menambahkan fitur, abstraksi, lapisan, atau berkas kode sebelum Anda benar-benar membutuhkannya saat ini."**

Berikut temuan evaluasi YAGNI yang dikelompokkan ke dalam kategori arsitektural:

---

### 🔍 TEMUAN 1: Dead Code, Empty Files & Sisa Boilerplate (Unused Code)

| Lokasi Berkas | Deskripsi Temuan | Mengapa Ini Pelanggaran YAGNI? |
| :--- | :--- | :--- |
| `src/users/entities/user.entity.ts` *(Backend)* | Berisi `export class UserEntity {}` (2 baris kosong). Sisa otomatis dari generator CLI `nest g resource users`. | **0 referensi** di seluruh repositori. Kelas kosong ini tidak melakukan apapun dan tidak pernah dipakai. |
| `src/app.controller.ts` & `src/app.service.ts` *(Backend)* | Endpoint `GET /api` yang hanya mengembalikan teks statis `"Hello World!"`. | Tidak difungsikan sebagai *health check probe* resmi (seperti `@nestjs/terminus` atau status koneksi DB/Redis). Ini murni artefak default NestJS. |
| `public/*.svg` (`file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`) *(Frontend)* | 5 berkas SVG bawaan template *create-next-app*. | Tidak ada satupun komponen di `src/` yang mengimpor atau menggunakan icon SVG ini. Membebani repositori dengan aset tidak terpakai. |
| `src/store/UserStore.ts` (L116–L135) *(Frontend)* | Logika fallback offline pada fungsi `login`: jika backend mati, sistem mencari akun di `useUserManagementStore.getState().users`. | State `users` di store tersebut selalu array kosong `[]` pada inisialisasi awal. Fallback ini **tidak akan pernah berhasil** dan merupakan sisa peninggalan prototipe mock data lama. |

---

### 🔍 TEMUAN 2: Premature Abstraction (Over-Engineering Layer Interface)

**Lokasi:** `src/common/interfaces/` *(Backend)*
- Terdapat **17 berkas interface terpisah** (`artworks.repository.interface.ts`, `users.repository.interface.ts`, `commissions.repository.interface.ts`, dll.).
- **Masalah Nyata:**
  1. Dalam ekosistem TypeScript dan NestJS, kelas repository konkret (`ArtworksRepository`, `UsersRepository`) sudah otomatis berfungsi ganda sebagai **type contract** sekaligus **DI token**.
  2. Dari 17 modul, **15 modul langsung menginjeksi kelas konkret** (contoh di `ArtworksService`: `constructor(private readonly artworksRepository: ArtworksRepository)`). Artinya, berkas interface di `common/interfaces` hanya menduplikasi signature fungsi tanpa pernah dijadikan dependency token pada DI container.
  3. Hanya 2 modul (`AppealsModule` & `TransactionsModule`) yang menggunakan token string seperti `@Inject('IAppealsRepository')`. Ini menciptakan **inkonsistensi arsitektur** (separuh pakai token string, separuh pakai kelas konkret).
- **Kacamata YAGNI:** Membuat 17 interface untuk 17 kelas repository yang implementasinya **hanya satu dan tidak pernah berganti** (yaitu Prisma ORM) adalah contoh klasik *speculative generality* / premature abstraction yang tidak memberikan manfaat nyata namun melipatgandakan beban sinkronisasi kode saat ada perubahan parameter atau method.

---

### 🔍 TEMUAN 3: Redundansi Sumber Kebenaran Basis Data (*Dual Source of Truth*)

**Lokasi:** `db/schema.sql` *(Backend)*
- Berkas DDL SQL mentah sepanjang 253 baris ini dibuat untuk inisialisasi basis data lokal.
- **Masalah:**
  - Proyek ini sudah mengadopsi **Prisma ORM** sebagai fondasi utama database, lengkap dengan `prisma/schema.prisma` dan 8 riwayat migrasi resmi di `prisma/migrations/`.
  - Menulis dan memelihara berkas SQL mentah secara paralel dengan schema Prisma menciptakan **Dual Source of Truth**. Setiap kali ada perubahan kolom (seperti penambahan `WalletTransaction`, `Appeal`, atau kolom baru), developer harus mengubah dua tempat secara manual.
- **Kacamata YAGNI:** Prisma CLI sudah memiliki perintah bawaan `pnpm prisma db push` atau `pnpm prisma migrate deploy` yang bersifat otomatis, idempoten, dan aman. Berkas `db/schema.sql` redundan dan melanggar prinsip *Single Source of Truth*.

---

### 🔍 TEMUAN 4: Over-Engineering Lapisan BFF (*Backend-For-Frontend*) di Frontend

**Lokasi:** `src/app/api/` *(Frontend)*
- Terdapat **sekitar 40 berkas `route.ts`** di dalam folder `src/app/api/` (misalnya: `api/curator-performance/route.ts`, `api/disputes/[id]/route.ts`, `api/reports/route.ts`, `api/upload/commissions/...`, dll.).
- **Karakteristik Kode:**
  90% dari berkas-berkas ini kodenya identik: membaca query/body → memanggil `axiosServer.get(...)` / `post(...)` ke NestJS → membungkusnya dengan `NextResponse.json(...)`.
- **Kacamata YAGNI:**
  - Pembuatan Route Handler manual per-endpoint masuk akal **hanya untuk endpoint autentikasi** (`/api/auth/*`) karena perlu menangani cookie `HttpOnly` secara langsung di browser origin.
  - Namun untuk seluruh endpoint CRUD lainnya, membuat ~35 berkas perantara yang hanya bertindak sebagai "tukang teruskan paket" (*dumb proxy*) adalah beban pemeliharaan yang sangat besar.
  - Kebutuhan reverse proxy ini sebenarnya dapat diselesaikan **hanya dengan 5 baris konfigurasi `rewrites()` di `next.config.ts`** atau dipanggil langsung menggunakan Client SDK tanpa perlu membuat puluhan file route handler manual.

---

### 🔍 TEMUAN 5: Dualitas Paradigma State Management di Frontend

**Lokasi:** `src/store/UserManagementStore.ts` *(Frontend)*
- Di halaman `/dashboard/manage-users`, pengambilan data dan mutasi user ditangani menggunakan store **Zustand** (`useUserManagementStore`).
- Sementara itu, seluruh halaman dashboard lainnya (seperti `/dashboard/financial-reports`, `/dashboard/audit-logs`, `/dashboard/curator-performance`, `/dashboard/review-disputes`, dan `/dashboard/manage-tags`) sudah menggunakan **TanStack React Query v5** (`useTransactionQueries`, `useAppealQueries`, `useCuratorPerformance`, dll.).
- **Kacamata YAGNI:** Mempertahankan Zustand store khusus untuk satu halaman CRUD sedangkan modul lainnya memakai React Query adalah inkonsistensi arsitektur. Anda harus mengelola caching, refetching, dan loading state secara manual di satu tempat, sementara tempat lain sudah otomatis ditangani oleh React Query cache.

---

### 🔍 TEMUAN 6: Unused / Phantom Dependencies di Backend

**Lokasi:** `package.json` *(Backend)*
1. `@nestjs/mapped-types` (`dependencies`):
   - Seluruh DTO proyek yang membutuhkan utility tipe parsial (seperti `update-artwork.dto.ts`) mengimpor `PartialType` dari `@nestjs/swagger`, bukan dari `@nestjs/mapped-types`.
   - Paket ini terpasang namun memiliki **0 impor** di seluruh kode.
2. `@sinonjs/commons` (`devDependencies`):
   - Paket `alpha` ini ada di daftar `devDependencies`, namun tidak ada satupun file spec/test maupun script yang memanggilnya.

---

### 🔍 TEMUAN 7: Salah Penempatan File UI & Deep Nesting di `utils/`

**Lokasi:** `src/utils/dashboard/` *(Frontend)*
- Folder `src/utils/` berisi berkas-berkas `.tsx` komponen React seperti:
  - `audit-logs/auditTableColumns.tsx`
  - `curator-performance/curatorPerformanceTableColumns.tsx`
  - `financial-reports/financialTableColumns.tsx`
  - `manage-tags/catalogTableColumns.tsx`
  - `review-disputes/disputesTableColumns.tsx`
- **Kacamata YAGNI & Clean Code:**
  - Folder `utils` sejatinya ditujukan untuk *pure utility functions* tanpa dependensi JSX/DOM (seperti formatting tanggal, kalkulasi mata uang, helper pagination).
  - Meletakkan komponen JSX tabel dengan kedalaman folder hingga 4 level (`src/utils/dashboard/sub-module/file.tsx`) melanggar *Separation of Concerns*. Kolom-kolom ini lebih cocok diletakkan dekat dengan komponen tabelnya (*colocated*) di `components/dashboard/` atau di folder halaman masing-masing.

---

### 🔍 TEMUAN 8: Monolithic Type Definitions di Frontend

**Lokasi:** `src/types/index.ts` *(Frontend)*
- Berkas ini memiliki **809 baris kode** dan menampung seluruh definisi tipe proyek (Database models, Enums, DTOs, API responses, Store states, UI props, KPI metrics).
- Walaupun aturan workspace frontend mewajibkan tipe terpusat di `types/`, menumpuk seluruh domain ke dalam 1 file raksasa membuat file ini rawan menampung definisi tipe usang (*stale types*) yang sudah tidak terpakai lagi karena sulit diaudit secara visual dibandingkan bila dipecah per domain (misal `types/auth.ts`, `types/commission.ts`, `types/artwork.ts`).

---

## 3. Matriks Evaluasi YAGNI (Ringkasan Komparatif)

| Komponen / Berkas | Status Saat Ini | Dampak Terhadap Proyek | Rekomendasi Pragmatis |
| :--- | :--- | :--- | :--- |
| **`UserEntity` (BE)** | Berkas kosong tak terpakai | Membingungkan developer baru | Hapus berkas & foldernya. |
| **`app.controller/service` (BE)** | Hanya return "Hello World!" | Boilerplate tidak berguna | Ubah jadi endpoint `/api/health` atau hapus. |
| **17 Repository Interfaces (BE)** | 15 tidak dipakai, 2 inkonsisten | Beban ganda saat edit method | Hapus interface; inject langsung class repo. |
| **`db/schema.sql` (BE)** | DDL duplikasi Prisma | Rawan desinkronisasi schema | Hapus; gunakan `prisma migrate` / `db push`. |
| **Dependencies Phantom (BE)** | `@nestjs/mapped-types`, `@sinonjs/commons` | Membengkakkan `node_modules` | Jalankan `pnpm remove <pkg>`. |
| **Public SVGs (FE)** | 5 SVG bawaan Next.js | Aset mati | Hapus berkas SVG yang tidak dipakai. |
| **Mock Login Fallback (FE)** | Dead code di `UserStore.ts` | Logika membingungkan | Bersihkan percabangan `if (!err.response)`. |
| **~40 API Route Handlers (FE)** | Dumb forwarding proxy | Puluhan file boilerplate redundant | Gantikan dengan Next.js `rewrites` di config. |
| **`UserManagementStore` (FE)** | Masih pakai Zustand sendiri | Inkonsisten dengan TanStack Query | Migrasi ke hook `useUserQueries` (React Query). |
| **`.tsx` di `utils/` (FE)** | UI ditaruh di helper utility | Melanggar *separation of concerns* | Pindahkan ke `components/dashboard/`. |

---

## 4. Kesimpulan

Secara fungsionalitas, fitur bisnis inti aplikasi **TruBrush** (alur kurasi anti-AI, sistem komisi bertahap/escrow, audit logging, penanganan dispute, dan laporan kurator) sudah berjalan dengan baik.

Namun dari sudut pandang **YAGNI** dan **efisiensi arsitektur**, codebase ini membawa beberapa beban over-engineering:
1. **Di Backend:** Terlalu banyak abstraksi formal (17 interface repository yang implementasinya cuma 1) dan duplikasi DDL database (`db/schema.sql` vs Prisma).
2. **Di Frontend:** Terlalu banyak berkas perantara manual (~40 Route Handlers yang fungsinya hanya meneruskan data) serta dualitas paradigma pengelolaan state (Zustand vs TanStack Query).
