// Util murni format tampilan kartu anak (kader/ortu) — TANPA "server-only" (dipakai jg di
// Client Component & harus testable; @/lib/anak tak bisa krn di-guard server-only).

/** Gabung "ortu: X · RT/RW Y" utk baris sekunder kartu anak — lewati segmen yg kosong,
 *  tanpa pemisah dobel/menggantung ("" jika keduanya kosong). */
export function labelOrtuRtRw(namaOrtu: string, rtRw: string): string {
  const bagian = [namaOrtu && `ortu: ${namaOrtu}`, rtRw && `RT/RW ${rtRw}`].filter(Boolean);
  return bagian.join(" · ");
}
