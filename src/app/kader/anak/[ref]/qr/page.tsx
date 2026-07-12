import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { wajibUser } from "@/lib/sesi";
import { ambilAnak } from "@/lib/anak";
import { db } from "@/lib/db";
import { buatTokenKlaim } from "@/lib/klaim-actions";
import { fmtTglId } from "@/lib/anak";

export default async function QrKlaimPage({
  params,
}: {
  params: Promise<{ ref: string }>;
}) {
  const user = await wajibUser("KADER", "ADMIN");
  const { ref } = await params;
  const refA = decodeURIComponent(ref);
  const anak = await ambilAnak(refA, user);
  if (!anak) notFound();

  const m = /^([sb]):(\d+)$/.exec(refA)!;
  const aktif = await db.klaimToken.findMany({
    where: {
      ...(m[1] === "s" ? { anakSimpusId: Number(m[2]) } : { anakBaruId: Number(m[2]) }),
      dipakaiPada: null,
      kedaluwarsa: { gt: new Date() },
    },
    orderBy: { dibuatPada: "desc" },
  });

  const h = await headers();
  const basis = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host") ?? "localhost:3000"}`;

  const kartu: { token: string; kedaluwarsa: Date; qr: string }[] = [];
  for (const t of aktif.slice(0, 2)) {
    kartu.push({
      token: t.token,
      kedaluwarsa: t.kedaluwarsa,
      qr: await QRCode.toDataURL(`${basis}/ortu/klaim?kode=${t.token}`, { margin: 1, width: 240 }),
    });
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-5">
      <Link href={`/kader/anak/${refA}`} className="text-xs font-bold text-[var(--teks-sekunder)]">
        ← Detail anak
      </Link>
      <h1 className="font-judul mt-2 text-lg font-extrabold text-[var(--teal-tua)]">
        Hubungkan ke Orang Tua
      </h1>
      <p className="mt-1 text-xs leading-relaxed text-[var(--teks-sekunder)]">
        Anak: <b>{anak.isi.nama}</b>.
      </p>

      <div className="mt-4 space-y-2">
        {[
          { n: 1, t: "Minta orang tua buka Anakku → Hubungkan Anak" },
          { n: 2, t: "Pindai QR di bawah dengan kamera HP" },
          { n: 3, t: "Atau ketik kode 8 karakter secara manual" },
        ].map((s) => (
          <div key={s.n} className="flex items-center gap-3 rounded-xl border-2 border-[var(--coral-border)] bg-[var(--coral-muda)] px-3 py-2">
            <span className="font-judul flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--coral)] text-xs font-bold text-white">
              {s.n}
            </span>
            <span className="text-xs text-[var(--coral-gelap)]">{s.t}</span>
          </div>
        ))}
      </div>

      {kartu.length === 0 ? (
        <p className="pop mt-4 rounded-[var(--r-kartu)] border-2 border-dashed border-[var(--garis-kader)] bg-[var(--kartu)] p-6 text-center text-sm text-[var(--teks-sekunder)]">
          Belum ada kode aktif — buat dulu di bawah.
        </p>
      ) : (
        kartu.map((k) => (
          <div key={k.token} className="pop mt-4 rounded-[var(--r-kartu)] border-2 border-[var(--krem-border)] bg-[var(--kartu)] p-5 text-center">
            <div className="mx-auto w-fit rounded-2xl border-2 border-dashed border-[var(--teal-pastel)] p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={k.qr} alt={`QR kode klaim ${k.token}`} width={220} height={220} className="rounded-lg" />
            </div>
            <p className="font-judul mt-3 text-2xl font-extrabold tracking-[0.3em] text-[var(--teal-tua)]">
              {k.token}
            </p>
            <span className="stiker relative left-0 top-0 mt-2 inline-block" style={{ background: "var(--kuning-pastel)", color: "var(--kuning-teks)", transform: "none" }}>
              kode sekali pakai · 7 hari
            </span>
            <p className="mt-1 text-[11px] text-[var(--teks-sekunder)]">
              berlaku s.d. {fmtTglId(k.kedaluwarsa.toISOString().slice(0, 10))}
            </p>
          </div>
        ))
      )}

      <form action={buatTokenKlaim} className="mt-4">
        <input type="hidden" name="ref" value={refA} />
        <button className="btn3d btn3d-coral w-full py-3 text-sm">+ Buat kode baru</button>
      </form>
    </main>
  );
}
