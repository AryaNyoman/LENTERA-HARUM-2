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
      <h1 className="mt-2 text-lg font-extrabold text-[var(--teal-tua)]">
        Hubungkan ke Orang Tua
      </h1>
      <p className="mt-1 text-xs leading-relaxed text-[var(--teks-sekunder)]">
        Anak: <b>{anak.isi.nama}</b>. Minta orang tua memindai QR dengan kamera HP
        (atau mengetik kode di menu <b>Anakku → Hubungkan Anak</b>). Kode sekali pakai,
        berlaku 7 hari.
      </p>

      {kartu.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-[var(--garis)] bg-[var(--kartu)] p-6 text-center text-sm text-[var(--teks-sekunder)]">
          Belum ada kode aktif — buat dulu di bawah.
        </p>
      ) : (
        kartu.map((k) => (
          <div key={k.token} className="mt-4 rounded-2xl border border-[var(--garis)] bg-[var(--kartu)] p-5 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={k.qr} alt={`QR kode klaim ${k.token}`} width={240} height={240} className="mx-auto rounded-xl" />
            <p className="mt-3 font-mono text-2xl font-extrabold tracking-[0.3em] text-[var(--teal-tua)]">
              {k.token}
            </p>
            <p className="mt-1 text-[11px] text-[var(--teks-sekunder)]">
              berlaku s.d. {fmtTglId(k.kedaluwarsa.toISOString().slice(0, 10))}
            </p>
          </div>
        ))
      )}

      <form action={buatTokenKlaim} className="mt-4">
        <input type="hidden" name="ref" value={refA} />
        <button className="w-full rounded-xl bg-[var(--coral)] py-2.5 text-sm font-bold text-white">
          + Buat kode baru
        </button>
      </form>
    </main>
  );
}
