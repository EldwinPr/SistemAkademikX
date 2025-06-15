<div align="center">
  <h1 style="font-size: 2.5em; font-weight: bold;">Sistem Akademik Terenkripsi</h1>
  <p>
    Sebuah aplikasi web sistem akademik aman yang dibangun dengan SvelteKit dan Prisma, menerapkan kriptografi modern untuk melindungi data.
  </p>
  
  <p>
    <img src="https://img.shields.io/badge/SvelteKit-FF3E00?style=for-the-badge&logo=svelte&logoColor=white" alt="SvelteKit" />
    <img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" />
    <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  </p>
</div>

---

## 📜 Deskripsi Proyek

**Sistem Akademik Terenkripsi** adalah sebuah platform web yang dirancang untuk mengelola transkrip akademik mahasiswa dengan fokus utama pada keamanan dan integritas data. Aplikasi ini mengimplementasikan berbagai algoritma kriptografi untuk memastikan bahwa hanya pihak yang berwenang yang dapat mengakses dan memvalidasi informasi akademik. Dengan arsitektur modern berbasis **SvelteKit** dan **Prisma**, sistem ini menawarkan solusi yang cepat, andal, dan aman untuk kebutuhan institusi pendidikan.

## ✨ Fitur Utama

* 🔑 **Manajemen Pengguna Berbasis Peran**: Tiga peran pengguna (Mahasiswa, Dosen Wali, Kepala Program Studi) dengan hak akses yang terdefinisi dengan jelas.
* 🔒 **Enkripsi Data End-to-End**: Seluruh data transkrip dienkripsi di sisi klien dan server menggunakan **AES-256** untuk menjamin kerahasiaan.
* ✍️ **Tanda Tangan Digital**: Integritas dan keaslian transkrip dijamin melalui tanda tangan digital oleh Kepala Program Studi menggunakan algoritma **RSA-2048** dan **SHA3-256**.
* 🔐 **Sistem Kunci Ganda**:
    * **Akses Langsung**: Akses cepat dan aman bagi pengguna yang berwenang (mahasiswa, dosen wali, dan kaprodi) menggunakan kunci asimetris RSA.
    * **Akses Grup Kolaboratif**: Kunci enkripsi AES dibagi di antara Dosen Wali menggunakan **Shamir's Secret Sharing (SSS)**, memerlukan kuorum (minimal 3) untuk merekonstruksi kunci dan mengakses data, mencegah akses sepihak yang tidak sah.
* 📄 **Generasi PDF Aman**: Kemampuan untuk menghasilkan file PDF transkrip yang dapat dienkripsi secara opsional menggunakan **RC4** untuk distribusi yang aman.

## 🚀 Deployment

Aplikasi yang telah di-deploy dapat diakses melalui tautan berikut:

[**Live Deployment Aplikasi**](https://sistem-akademik-x.vercel.app)

## 👨‍💻 Identitas Pembuat

Proyek ini dibuat dan dikembangkan oleh:

1.  **Eldwin Pradipta**
    * NIM: `18222042`
    * Email: `eldwinpradipta670@gmail.com`
2.  **Christoper Daniel**
    * NIM: `18222034`
    * Email: `christoper.daniel04@gmail.com`

(Institut Teknkologi Bandung)

## 📂 Struktur Direktori

Berikut adalah penjelasan mengenai struktur direktori utama dalam proyek ini:

```
.
├── prisma/
│   ├── migrations/         # File migrasi skema database
│   ├── schema.prisma       # Definisi skema database Prisma
│   └── seed.ts             # Skrip untuk mengisi data awal (seeding)
├── src/
│   ├── components/
│   │   ├── dashboards/     # Komponen UI khusus untuk halaman dashboard
│   │   ├── modals/         # Komponen untuk dialog modal
│   │   └── shared/         # Komponen umum yang dipakai di banyak tempat
│   ├── lib/
│   │   ├── cryptography/   # Implementasi algoritma kriptografi
│   │   ├── server/         # Kode khusus server-side (e.g., koneksi DB)
│   │   ├── services/       # Logika bisnis aplikasi (Auth, PDF, dll.)
│   │   └── types/          # Definisi tipe data TypeScript
│   ├── routes/
│   │   ├── api/            # Endpoin API backend
│   │   ├── auth/           # Halaman dan logika terkait otentikasi
│   │   └── dashboard/      # Halaman dan logika utama setelah login
│   ├── app.css             # Konfigurasi global TailwindCSS
│   ├── app.d.ts            # Tipe global untuk SvelteKit
│   └── hooks.server.ts     # Middleware untuk otentikasi dan otorisasi
├── package.json            # Daftar dependensi dan skrip proyek
└── svelte.config.js        # Konfigurasi SvelteKit
```

## ⚙️ Tata Cara Menjalankan Program

Untuk menjalankan proyek ini di lingkungan lokal, ikuti langkah-langkah di bawah ini.

### 1. Prasyarat

Pastikan perangkat Anda telah terpasang:
* [Node.js](https://nodejs.org/) (v18 atau lebih baru)
* [pnpm](https://pnpm.io/) (atau npm/yarn)
* [PostgreSQL](https://www.postgresql.org/)

### 2. Instalasi & Konfigurasi

```bash
# 1. Clone repositori ini
git clone <URL_REPOSITORI_ANDA>
cd sistemakademikx

# 2. Install semua dependensi
npm install

# 3. Buat file .env dan atur koneksi database
#    (Salin dari .env.example jika ada)
echo 'DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"' > .env

# 4. Jalankan migrasi dan seeding database
npx prisma migrate dev
npx prisma db seed
```
> **Info**: Akun pengguna default yang dibuat oleh *seeder* memiliki *password*: `admin123`.

### 3. Menjalankan Server Development

```bash
# Jalankan server dalam mode development
npm run dev
```
Aplikasi akan dapat diakses melalui `http://localhost:5173`.

### 4. Perintah Lainnya

* **Membangun untuk Produksi**:
    ```bash
    npm run build
    ```

* **Menjalankan Preview Build Produksi**:
    ```bash
    npm run preview
    ```

* **Menjalankan Tes**:
    ```bash
    npm run test
    ```