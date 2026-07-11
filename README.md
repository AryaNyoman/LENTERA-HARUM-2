# SIMPUS-POSYANDU

Portal web terpadu **kader posyandu & orang tua** — imunisasi + tumbuh kembang anak.
Puskesmas Cakranegara, Mataram, NTB. **Satu website, tiga peran login:**

| Peran | Cara punya akun | Yang dilihat |
|---|---|---|
| **Admin** | dari seed / sesama admin | Kelola Akun, sinkron SIMPUS, semua data |
| **Kader** | dibuatkan admin (+ posyandu binaan) | Dashboard, Daftar Bayi, Kalkulator, Panduan, QR klaim, verifikasi centang, export |
| **Orang tua** | daftar mandiri (No HP + sandi) | Dashboard posyandu, Anakku, Jadwal, Tumbuh, Panduan |

Penerus gabungan *SIMPUS-IMUN Kader* dan *IMUN-KU*. **SIMPUS-IMUN petugas tetap sistem-of-record** —
website ini membaca salinannya (sinkron) dan menyetor anak baru lewat export Excel.

## Menjalankan (pengembangan)

```bash
npm install
cp .env.example .env    # isi KUNCI_SERVER (petunjuk di file)
npm run db:push         # buat database dev (SQLite)
npm run db:seed         # akun awal (sandi admin DITAMPILKAN SEKALI) + wilayah + contoh
npm run dev             # http://localhost:3000
```

Perintah lain: `npm test` (vitest) · `npm run db:studio` (lihat isi DB).

## Alur data dengan SIMPUS petugas

1. **Masuk** — kader/ortu mendaftarkan anak baru → tombol **Export SIMPUS** menghasilkan
   `.xlsx` berformat persis menu *Impor Data Anak (file lain)* → diimpor petugas di SIMPUS.
2. **Keluar** — tombol admin **Tarik sekarang** (atau cron mingguan `/api/sinkron?rahasia=CRON_SECRET`)
   menarik master wilayah, salinan anak (didekripsi *amplop layanan*, disegel ulang kunci
   website), cache statistik, dan **mencocokkan balik** anak yang sudah masuk SIMPUS.

Prasyarat sinkron (sekali saja, oleh pemilik):
- `SIMPUS_DATABASE_URL` = connection string Neon SIMPUS (pooled).
- `SIMPUS_DEK` = hasil `npx tsx scripts/export-dek-layanan.ts` **di repo Simpus-Imun**
  (diminta password admin). Tempel HANYA ke env — jangan pernah di-commit.

## Deploy ke Railway

1. Buat service dari repo ini + tambah **PostgreSQL** Railway (bukan Neon — Neon khusus SIMPUS).
2. Isi Variables: `DATABASE_URL` (dari Postgres Railway), `KUNCI_SERVER` (hex 32-byte baru),
   `SIMPUS_DATABASE_URL`, `SIMPUS_DEK`, `CRON_SECRET`.
3. Build & start otomatis pakai `railway.json` (`build:railway` menukar provider Prisma ke
   postgres; `start:railway` menjalankan `db push` lalu `next start`).
4. Produksi mulai KOSONG: jalankan **Tarik sekarang** dulu (mengisi wilayah + anak),
   baru buat akun kader. Jadwalkan cron mingguan Railway ke `/api/sinkron?rahasia=…`.
5. Tiap rilis: naikkan `CACHE_NAME` di `public/sw.js`.

## Keamanan (ringkas)

PII anak selalu terenkripsi at-rest (AES-256-GCM, `KUNCI_SERVER`); sandi di-hash bcrypt;
scope ketat per peran (kader = binaan, ortu = anak klaiman); centang ortu berstatus 🟡
sampai diverifikasi kader 🔵. Detail arsitektur & aturan medis: **`CLAUDE.md`**.
