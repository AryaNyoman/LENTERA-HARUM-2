import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // exceljs dipakai di server action (export Excel) — jangan di-bundle ulang oleh Next.
  serverExternalPackages: ["exceljs"],
};

export default nextConfig;
