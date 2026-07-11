export default function Home() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--garis)] bg-[var(--kartu)] p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--teal)] text-2xl font-bold text-white">
          SP
        </div>
        <h1 className="text-xl font-extrabold text-[var(--teal-tua)]">
          SIMPUS-POSYANDU
        </h1>
        <p className="mt-2 text-sm text-[var(--teks-sekunder)]">
          Portal terpadu kader &amp; orang tua
          <br />
          Puskesmas Cakranegara · Mataram, NTB
        </p>
        <p className="mt-6 rounded-lg bg-[var(--teal-muda)] px-3 py-2 text-xs font-semibold text-[var(--teal-tua)]">
          Fondasi terpasang — halaman login menyusul (Tahap 3)
        </p>
      </div>
    </main>
  );
}
