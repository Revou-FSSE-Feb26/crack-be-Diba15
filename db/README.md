# 🗄️ TruBrush Database Schema (Local Development)

Direktori ini berisi skrip SQL resmi untuk inisialisasi skema basis data (*DDL*) pada PostgreSQL yang dirancang khusus untuk kemudahan setup di lingkungan **pengembangan lokal (*local development*)**.

Skrip ini bersifat **idempoten dan aman dieksekusi berkali-kali** tanpa menimbulkan error duplikasi (*safe guards enabled*).

---

## 📁 Berkas SQL

| Nama Berkas | Fungsi & Deskripsi | Pengaman (*Guards*) |
|---|---|---|
| [`schema.sql`](./schema.sql) | Membuat seluruh **12 ENUM types**, **16 Tabel**, relasi Foreign Keys, dan Indeks performa. | `DO $$ ... EXCEPTION WHEN duplicate_object THEN null;` & `CREATE TABLE IF NOT EXISTS` |

---

## 🚀 Cara Menjalankan di Lokal

Pastikan file `.env` di root backend sudah terkonfigurasi dengan variabel `DATABASE_URL` database lokal Anda.

### Cara 1: Menggunakan Prisma CLI (Paling Mudah)
Anda dapat langsung mengeksekusi file SQL ini menggunakan Prisma CLI bawaan proyek:

```bash
# Menjalankan schema.sql langsung ke database yang tertera di .env
pnpm prisma db execute --file ./db/schema.sql
```

### Cara 2: Menggunakan Terminal `psql` Lokal
Jika Anda memiliki PostgreSQL client di terminal lokal:

```bash
# Eksekusi schema.sql ke PostgreSQL lokal
psql "$DATABASE_URL" -f db/schema.sql
```

### Cara 3: Menggunakan Database GUI (DBeaver, TablePlus, atau pgAdmin)
1. Buka aplikasi GUI database favorit Anda dan hubungkan ke database lokal.
2. Buka tab **SQL Query / SQL Editor**.
3. Salin dan tempel seluruh isi dari [`schema.sql`](./schema.sql).
4. Tekan tombol **Execute / Run**.

---

## 🌱 Seeding Data di Lokal

Untuk pengisian data awal (*seeding*) pada lingkungan lokal, gunakan skrip TypeScript resmi proyek yang sudah terintegrasi dengan Prisma:

```bash
# Jalankan seed data lengkap (Users, Profiles, Artworks, Commissions, Escrow Ledger)
pnpm prisma db seed
```
