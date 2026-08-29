# 📮 Panduan Postman API Collection & Environment TruBrush

Folder ini berisi berkas **Postman Collection (v2.1.0)** dan **Postman Environment** resmi untuk pengujian seluruh *endpoints* REST API platform **TruBrush**.

---

## 📂 Daftar Berkas

1. [**`TruBrush_API.postman_collection.json`**](./TruBrush_API.postman_collection.json)
   - Koleksi lengkap berisi **10 Folder Modul & 45+ Request API**.
   - Dilengkapi *Automated Test Scripts* (`pm.test`, `pm.expect`, dan *token chaining* otomatis antar-role).
2. [**`TruBrush_Local.postman_environment.json`**](./TruBrush_Local.postman_environment.json)
   - Konfigurasi variabel lingkungan lokal (`base_url: http://localhost:3001/api`, kredensial akun bawaan admin, curator, artist, client, dan mock ID).

---

## 🚀 Cara Import & Menjalankan Pengujian (3 Langkah Mudah)

### Langkah 1: Buka Postman & Klik Tombol Import
1. Buka aplikasi **Postman**.
2. Klik tombol **Import** di sudut kiri atas workspace Anda.
3. Seret (*drag & drop*) atau pilih kedua berkas berikut:
   - `TruBrush_API.postman_collection.json`
   - `TruBrush_Local.postman_environment.json`

### Langkah 2: Pilih Environment "TruBrush Local (Port 3001)"
1. Di sudut kanan atas Postman, buka *dropdown environment*.
2. Pilih environment bernama: **`TruBrush Local (Port 3001)`**.

### Langkah 3: Jalankan Login & Request Otomatis
1. Buka folder **`01. Authentication & Sessions`**.
2. Jalankan request:
   - `1.1 Login Admin (Auto Token)`
   - `1.2 Login Curator (Auto Token)`
   - `1.3 Login Artist (Auto Token)`
   - `1.4 Login Client (Auto Token)`
3. ⚡ **Token JWT otomatis tersimpan ke Environment Postman!**
4. Anda sekarang dapat menjalankan request apapun pada folder modul lainnya (Artworks, Commissions, Disputes, Reports, Financial Reports, Curator Performance, dll.) tanpa perlu menyalin token secara manual.

---

## 🧪 Menjalankan Automated Collection Runner

Anda dapat menjalankan pengujian otomatis menyeluruh sekaligus dengan fitur **Collection Runner**:
1. Klik kanan pada koleksi **`TruBrush API Collection`** $\rightarrow$ Pilih **Run Collection**.
2. Pastikan urutan request sesuai dan environment **`TruBrush Local (Port 3001)`** terpilih.
3. Klik tombol **Run TruBrush API Collection**.
4. Semua assertion tes (`pm.test`) akan otomatis tervalidasi dengan indikator hijau (**100% Passed**).
