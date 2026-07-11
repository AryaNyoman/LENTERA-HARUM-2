import type { Metadata, Viewport } from "next";
import SwDaftar from "@/components/sw-daftar";
import "./globals.css";

export const metadata: Metadata = {
  title: "SIMPUS-POSYANDU — Puskesmas Cakranegara",
  description:
    "Portal terpadu kader posyandu & orang tua — imunisasi dan tumbuh kembang anak. Puskesmas Cakranegara, Mataram, NTB.",
  manifest: "/manifest.json",
  icons: { icon: "/icon-192.png", apple: "/icon-192.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2E9E8F",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>
        {children}
        <SwDaftar />
      </body>
    </html>
  );
}
