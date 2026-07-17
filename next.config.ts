import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // exceljs dipakai di server action (export Excel) — jangan di-bundle ulang oleh Next.
  serverExternalPackages: ["exceljs"],
  // Hemat operasi DB (lihat PLAN-2026-07-18): router cache klien default Next 15
  // (staleTimes.dynamic = 0) membuat SETIAP nav bolak-balik query ulang penuh, meski
  // baru dibuka beberapa detik lalu. Data boleh basi ≤60 dtk di sisi klien — server
  // action (redirect/revalidatePath) tetap menyegarkan cache setelah aksi tulis.
  experimental: {
    staleTimes: { dynamic: 60, static: 300 },
  },
};

export default nextConfig;
