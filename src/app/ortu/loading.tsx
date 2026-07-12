/** Skeleton sisi ortu: 3 kartu pulse pastel + teks ramah. */
export default function LoadingOrtu() {
  return (
    <div className="mx-auto max-w-md px-4 pt-5">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="mb-3 h-24 animate-pulse rounded-[22px] border-2 border-[var(--garis-ortu)] bg-[var(--coral-muda)]/70"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
      <p className="mt-4 text-center text-xs font-semibold text-[var(--abu)]">Sebentar ya…</p>
    </div>
  );
}
