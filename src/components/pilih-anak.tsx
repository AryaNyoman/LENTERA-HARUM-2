/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { AnakView } from "@/lib/anak";

/** Pil pemilih anak (ortu punya >1 anak): tautan ?anak=<ref> di halaman yang sama.
 *  Konten halaman cukup menampilkan SATU anak terpilih — UI tetap simpel. */
export default function PilihAnak({
  daftar,
  aktifRef,
  dasar,
}: {
  daftar: AnakView[];
  aktifRef: string;
  dasar: string;
}) {
  if (daftar.length < 2) return null;
  return (
    <div className="pop mb-3.5 flex gap-2 overflow-x-auto pb-1">
      {daftar.map((a) => {
        const aktif = a.ref === aktifRef;
        const nama = a.isi.nama.split(/\s+/).slice(0, 2).join(" ");
        return (
          <Link
            key={a.ref}
            href={`${dasar}?anak=${encodeURIComponent(a.ref)}`}
            className="font-judul flex h-10 shrink-0 items-center gap-1.5 rounded-full pl-1.5 pr-3.5 text-xs font-bold transition-transform active:scale-[.95]"
            style={
              aktif
                ? { background: "var(--coral)", color: "#fff", boxShadow: "0 3px 0 var(--coral-tua)" }
                : { background: "var(--kartu)", border: "2px solid var(--garis-ortu)", color: "var(--teks-sekunder)" }
            }
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white">
              <img src={a.isi.jk === "P" ? "/gambar/anak-perempuan.png" : "/gambar/anak-laki.png"} alt="" width={22} height={22} className="h-[22px] w-[22px] object-contain" />
            </span>
            {nama}
          </Link>
        );
      })}
    </div>
  );
}
