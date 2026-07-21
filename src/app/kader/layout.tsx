import NavBawah from "@/components/nav-bawah";
import { wajibUser } from "@/lib/sesi";

const NAV = [
  { href: "/kader", label: "Dashboard", ikon: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" },
  { href: "/kader/daftar-bayi", label: "Daftar Bayi", ikon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" },
  { href: "/kader/sweeping", label: "Sweeping", ikon: "M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" },
  { href: "/kader/kalkulator", label: "Kalkulator", ikon: "M4 2h16v20H4zM8 6h8M8 10h8M8 14h4" },
  { href: "/kader/panduan", label: "Panduan", ikon: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" },
];

export default async function KaderLayout({ children }: { children: React.ReactNode }) {
  await wajibUser("KADER", "ADMIN");
  return (
    <div className="bg-titik-kader min-h-dvh pb-20">
      {children}
      <NavBawah item={NAV} peran="kader" />
    </div>
  );
}
