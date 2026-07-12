import type { Metadata, Viewport } from "next";
import { Baloo_2, Nunito } from "next/font/google";
import SwDaftar from "@/components/sw-daftar";
import "./globals.css";

// Baloo 2 = judul/angka/tombol (var(--font-judul)); Nunito = isi/label/paragraf (var(--font-isi)).
// Self-host via next/font: tidak ada request runtime ke fonts.googleapis.com (PWA offline aman).
const baloo = Baloo_2({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-judul",
  display: "swap",
});
const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-isi",
  display: "swap",
});

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
    <html lang="id" className={`${baloo.variable} ${nunito.variable}`}>
      <body>
        {children}
        <SwDaftar />
      </body>
    </html>
  );
}
