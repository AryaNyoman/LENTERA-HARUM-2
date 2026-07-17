import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // exceljs dipakai di server action (export Excel) — jangan di-bundle ulang oleh Next.
  serverExternalPackages: ["exceljs"],
  // Hemat operasi DB (lihat PLAN-2026-07-18): router cache klien default Next 15
  // (staleTimes.dynamic = 0) membuat SETIAP nav bolak-balik query ulang penuh, meski
  // baru dibuka beberapa detik lalu. 3600 dtk = keputusan pemilik 18 Jul (kader kerja
  // sendirian per kelurahan; perubahan lintas-user tidak mendesak). Aman karena tiap
  // server action (simpan/tandai/verifikasi) otomatis me-reset cache klien, dan
  // buka-ulang aplikasi selalu tembus cache — basi hanya saat murni melihat-lihat.
  experimental: {
    staleTimes: { dynamic: 3600, static: 3600 },
  },
};

export default nextConfig;
