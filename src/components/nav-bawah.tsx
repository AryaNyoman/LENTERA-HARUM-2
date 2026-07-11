"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface ItemNav {
  href: string;
  label: string;
  ikon: string; // path SVG sederhana (24x24, stroke)
}

/** Nav bawah gaya app KADER/IMUN-KU lama: 4–5 tombol, aktif = teal. */
export default function NavBawah({ item }: { item: ItemNav[] }) {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--garis)] bg-[var(--kartu)]/95 backdrop-blur">
      <div className="mx-auto flex max-w-3xl">
        {item.map((it) => {
          const aktif = it.href === path || (it.href !== "/kader" && it.href !== "/ortu" && path.startsWith(it.href));
          return (
            <Link
              key={it.href}
              href={it.href}
              className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-bold"
              style={{ color: aktif ? "var(--teal-tua)" : "var(--teks-sekunder)" }}
            >
              <svg
                viewBox="0 0 24 24" width="20" height="20" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              >
                <path d={it.ikon} />
              </svg>
              {it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
