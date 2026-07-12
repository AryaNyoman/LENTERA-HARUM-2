"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface ItemNav {
  href: string;
  label: string;
  ikon: string; // path SVG sederhana (24x24, stroke)
}

/** Nav bawah gaya app KADER/IMUN-KU lama: 4–5 tombol, ikon aktif dalam pil warna peran. */
export default function NavBawah({
  item,
  peran = "kader",
}: {
  item: ItemNav[];
  peran?: "kader" | "ortu";
}) {
  const path = usePathname();
  const pastel = peran === "ortu" ? "var(--coral-pastel)" : "var(--teal-pastel)";
  const gelap = peran === "ortu" ? "var(--coral-gelap)" : "var(--teal-gelap)";
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 min-h-16 border-t-2 border-[var(--garis)] bg-[var(--kartu)]/95 backdrop-blur">
      <div className="mx-auto flex max-w-3xl">
        {item.map((it) => {
          const aktif = it.href === path || (it.href !== "/kader" && it.href !== "/ortu" && path.startsWith(it.href));
          return (
            <Link
              key={it.href}
              href={it.href}
              className="font-judul flex min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-bold"
              style={{ color: aktif ? gelap : "var(--teks-sekunder)" }}
            >
              <span
                className="flex h-7 w-9 items-center justify-center rounded-full transition-colors"
                style={{ background: aktif ? pastel : "transparent", transitionDuration: "var(--t-normal)" }}
              >
                <svg
                  viewBox="0 0 24 24" width="20" height="20" fill="none"
                  stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                >
                  <path d={it.ikon} />
                </svg>
              </span>
              {it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
