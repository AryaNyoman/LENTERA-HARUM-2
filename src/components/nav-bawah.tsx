"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface ItemNav {
  href: string;
  label: string;
  ikon: string; // path SVG sederhana (24x24, stroke)
}

/** Nav bawah: 4–5 tab, ikon aktif dalam pil pastel warna peran (mockup 1b). */
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
  const garis = peran === "ortu" ? "#f6ece2" : "#ecf3ef";
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t-2 bg-[var(--kartu)]/95 backdrop-blur"
      style={{ borderColor: garis }}
    >
      <div className="mx-auto flex max-w-md px-2 pb-2 pt-1.5">
        {item.map((it) => {
          const aktif = it.href === path || (it.href !== "/kader" && it.href !== "/ortu" && path.startsWith(it.href));
          return (
            <Link
              key={it.href}
              href={it.href}
              prefetch={false}
              className="font-judul flex min-h-[44px] flex-1 flex-col items-center justify-center gap-px py-1 text-[10px] font-bold"
              style={{ color: aktif ? gelap : "var(--abu)" }}
            >
              <span
                className="flex h-[30px] w-[42px] items-center justify-center rounded-full transition-colors"
                style={{ background: aktif ? pastel : "transparent", transitionDuration: "var(--t-normal)" }}
              >
                <svg
                  viewBox="0 0 24 24" width="18" height="18" fill="none"
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
