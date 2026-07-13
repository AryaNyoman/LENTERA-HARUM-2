import NavBawah from "@/components/nav-bawah";
import { wajibUser } from "@/lib/sesi";

const NAV = [
  { href: "/ortu", label: "Dashboard", ikon: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" },
  { href: "/ortu/anakku", label: "Anakku", ikon: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10" },
  { href: "/ortu/jadwal", label: "Jadwal", ikon: "M3 4h18v18H3zM16 2v4M8 2v4M3 10h18" },
  { href: "/ortu/kalkulator", label: "Kalkulator", ikon: "M4 2h16v20H4zM8 6h8M8 10h8M8 14h4" },
  { href: "/ortu/panduan", label: "Panduan", ikon: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" },
];

export default async function OrtuLayout({ children }: { children: React.ReactNode }) {
  await wajibUser("ORTU", "ADMIN");
  return (
    <div className="bg-titik-ortu min-h-dvh pb-20">
      {children}
      <NavBawah item={NAV} peran="ortu" />
    </div>
  );
}
