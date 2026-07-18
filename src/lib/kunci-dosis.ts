/** Gerbang server "kunci dosis" (keputusan pemilik 18 Jul 2026): tanggal vaksin TIDAK
 *  bisa diisi/diubah kader maupun ortu — hanya petugas (admin) di aplikasi ini, atau
 *  mengalir dari SIMPUS via tarikan. Dipakai `bacaFormAnak` (anak-actions.ts) saat
 *  `bolehUbahVaksin` false. Disabled di HTML hanya kosmetik — ini pengaman sesungguhnya.
 *
 *  Catatan penting: input HTML `disabled` TIDAK ikut ter-submit browser — jadi submit
 *  normal dari form terkunci selalu kirim `vaksin={}` walau anak sudah punya riwayat
 *  dosis (`vaksinLama` terisi). Karena itu gerbang ini HANYA memeriksa kode yang
 *  BENAR-BENAR ikut ter-submit (mis. field diaktifkan lagi lewat devtools/tamper);
 *  kode yang absen (form disabled apa adanya) dianggap tak berubah & tak dicek. Nilai
 *  akhir yang disimpan tetap `vaksinLama` sepenuhnya (lihat bacaFormAnak) — bukan hasil
 *  gabungan dgn submit — jadi field yang tak terkirim tak pernah menghapus riwayat. */
export function galatDosisTerkunci(
  vaksin: Record<string, string>,
  vaksinLama: Record<string, string> = {},
): string | null {
  for (const [kode, tgl] of Object.entries(vaksin)) {
    if (tgl !== (vaksinLama[kode] ?? "")) {
      return "Tanggal vaksin hanya dapat diisi/diubah oleh petugas puskesmas.";
    }
  }
  return null;
}
