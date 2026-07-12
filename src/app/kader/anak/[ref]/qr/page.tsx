/* eslint-disable @next/next/no-img-element */
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import QRCode from "qrcode";
import KepalaHalaman from "@/components/kepala-halaman";
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
    <main>
      <KepalaHalaman judul="Hubungkan ke Orang Tua" sub={anak.isi.nama} balik={`/kader/anak/${refA}`} />

      <div className="mx-auto max-w-md px-4 pt-4">
        <div className="pop flex gap-1.5">
          {[
            { n: 1, t: "Tunjukkan QR ke ortu" },
            { n: 2, t: "Ortu pindai dgn kamera HP" },
            { n: 3, t: "Anak terhubung 🎉" },
          ].map((s) => (
            <div key={s.n} className="flex-1 rounded-2xl border-2 border-[var(--garis-kader)] bg-[var(--kartu)] px-2 py-2.5 text-center">
              <p className="font-judul text-base font-bold text-[var(--teal-gelap)]">{s.n}</p>
              <p className="text-[10px] font-semibold leading-snug text-[var(--teks-sekunder)]">{s.t}</p>
            </div>
          ))}
        </div>

        {kartu.length === 0 ? (
          <div className="pop pop-1 mt-4 rounded-[26px] border-[2.5px] border-dashed border-[#cfe2da] p-6 text-center">
            <p className="text-2xl">🔑</p>
            <p className="mt-1.5 text-sm font-semibold text-[var(--teks-sekunder)]">
              Belum ada kode aktif — buat dulu lewat tombol di bawah.
            </p>
          </div>
        ) : (
          kartu.map((k) => (
            <div key={k.token} className="pop pop-1 relative mt-5 rounded-[26px] border-2 border-[var(--garis-kader)] bg-[var(--kartu)] px-4 pb-5 pt-6 text-center">
              <span
                className="font-judul absolute -top-[11px] left-1/2 whitespace-nowrap rounded-full bg-[var(--teal)] px-3 py-1 text-[10.5px] font-bold text-white"
                style={{ transform: "translateX(-50%) rotate(-1.5deg)" }}
              >
                kode sekali pakai · 7 hari
              </span>
              <div className="mx-auto mt-1 inline-block rounded-[20px] border-[2.5px] border-dashed border-[var(--teal-pastel)] bg-[#fbfdfc] p-3">
                <img src={k.qr} alt={`QR kode klaim ${k.token}`} width={216} height={216} className="block rounded-[10px]" />
              </div>
              <p className="font-judul mt-3 text-3xl font-bold text-[var(--teal-gelap)]" style={{ letterSpacing: ".28em", textIndent: ".28em" }}>
                {k.token}
              </p>
              <p className="mt-1 text-[11px] font-semibold leading-relaxed text-[var(--abu)]">
                atau ketik kode ini di menu <b>Anakku → Hubungkan Anak</b>
                <br />
                berlaku s.d. <b>{fmtTglId(k.kedaluwarsa.toISOString().slice(0, 10))}</b>
              </p>
            </div>
          ))
        )}

        <form action={buatTokenKlaim} className="mt-4">
          <input type="hidden" name="ref" value={refA} />
          <button className="btn3d btn3d-coral h-[52px] w-full text-[15px]">+ Buat kode baru</button>
        </form>
      </div>
    </main>
  );
}
