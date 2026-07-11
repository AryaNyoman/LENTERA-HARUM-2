# SIMPUS-POSYANDU (untuk Claude & pengembang)

> **Untuk Claude:** baca dulu SEBELUM mengubah apa pun. Ada aturan medis & teknis di bawah.

## Apa ini
Portal web terpadu **kader posyandu + orang tua** di Puskesmas Cakranegara, Mataram, NTB —
penerus gabungan dua PWA lama: **SIMPUS-IMUN Kader** (repo `Kader`) & **IMUN-KU** (repo
`Masyarakat`). Satu website, peran login menentukan tampilan (ADMIN / KADER / ORTU).
Kakaknya: **SIMPUS-IMUN petugas** (repo `Simpus-Imun`, Next.js+Prisma, live di Railway+Neon)
— tetap sistem-of-record.

## Arsitektur
- **Next.js 15 (App Router) + TypeScript + Tailwind 4 + Prisma** — versi disamakan repo `Simpus-Imun`.
- **DB dev = SQLite** (`prisma/dev.db`); **deploy Railway = Postgres** (provider di-swap saat
  deploy, pola sama dgn Simpus-Imun). Karena itu skema TANPA enum & TANPA tipe Json.
- **SIMPUS = sumber kebenaran.** Website ini TIDAK menulis ke DB SIMPUS: baca via sync
  (mingguan + tombol manual admin) → `CacheDashboard`/`AnakSimpus`; setor via **export Excel**
  format persis "Impor Data Anak" SIMPUS.
- **PII anak selalu terenkripsi at-rest** (AES-256-GCM, pola iv/tag/data seperti brankas
  SIMPUS; kunci = env `KUNCI_SERVER`). Jangan pernah menambah kolom identitas anak terbuka.
- **Peran & scope:** kader hanya posyandu binaannya (`UserPosyandu`); ortu hanya anak
  klaimannya (`KlaimAnak`); admin semua. Semua query WAJIB difilter scope ini.

## ATURAN MEDIS (jangan diubah tanpa arahan pemilik/Aryawa)
- Kode vaksin kanonik = kode PWS SIMPUS di `src/lib/vaksin.ts` (`DOSIS_REGISTRY`).
  **Mengubah kode = memutus data & merusak impor SIMPUS.**
- **IDL 2026 (revisi Aryawa): TANPA PCV & Rotavirus** — HB0, BCG, Polio 1-4, DPT-HB-Hib 1-3
  (Penta/Hexa), IPV1, MR. **IBL: DPT lanjutan + MR lanjutan (tanpa PCV3).** (`SYARAT_IDL`/`SYARAT_IBL`)
- **Hexavalen mencakup IPV** → IPV1/IPV2 tak berlaku. **Rotarix hanya 2 dosis** → ROTA3 tak
  berlaku. (`dosisTakBerlaku`)
- Status gizi/tinggi memakai z-score **Kemenkes 2020** (di-port apa adanya dari repo
  `Masyarakat` saat Tahap 5) — logikanya sudah benar, jangan diubah.
- JE tidak gratis di NTB (tanda "SWASTA"); PCV/Rotavirus tetap DICATAT, hanya tak dihitung IDL/IBL.

## Perintah
`npm run dev` (dev, port 3000) · `npm test` (vitest) · `npm run db:push` / `db:seed` /
`db:studio`. Node.js portabel komputer puskesmas: `D:\nodejs` (sudah di PATH user).

## Export ke SIMPUS (jangan diubah sembarangan)
Sheet **"Data Anak"**, kolom: Nama, Tgl Lahir, JK (L/P), Nama Ortu, NIK, No HP, Alamat,
RT/RW, Posyandu, lalu 20 kolom dosis persis `DOSIS_REGISTRY[].nama`. Tanggal DD/MM/YYYY.
Kolom Posyandu = `Posyandu.nama` (persis master SIMPUS).

## Verifikasi sebelum "selesai"
`npm test` hijau; buka localhost:3000 tanpa error Console; alur peran (kader vs ortu) tak
bocor lintas scope; rapi di 320–390px (HP kader/ortu = prioritas utama).
