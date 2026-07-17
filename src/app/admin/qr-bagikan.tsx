/* eslint-disable @next/next/no-img-element */
/** Kartu ringkas "Bagikan aplikasi" — QR ke URL_APLIKASI + tombol unduh PNG, dibungkus
 *  <details> tertutup default (pemilik minta minim scrolling). Pola QRCode.toDataURL sama
 *  dgn src/components/pojok-baca-konten.tsx. */
import QRCode from "qrcode";

export default async function QrBagikan({ url }: { url: string }) {
  const qr = await QRCode.toDataURL(url, { margin: 1, width: 240 });

  return (
    <details className="group mt-3">
      <summary className="pop flex cursor-pointer list-none items-center justify-between rounded-[18px] border-2 border-[var(--garis-kader)] bg-[var(--kartu)] px-4 py-3 text-[14px] font-bold text-[var(--teal-gelap)] [&::-webkit-details-marker]:hidden">
        <span>📲 Bagikan aplikasi</span>
        <span className="text-[11px] font-semibold text-[var(--abu)] group-open:hidden">▾ buka</span>
        <span className="hidden text-[11px] font-semibold text-[var(--abu)] group-open:inline">▴ tutup</span>
      </summary>
      <div className="mt-2 rounded-[18px] border-2 border-[var(--garis-kader)] bg-[var(--kartu)] p-4 text-center">
        <div className="inline-block rounded-[20px] border-[2.5px] border-dashed border-[var(--teal-pastel)] bg-[#fbfdfc] p-3">
          <img src={qr} alt="QR aplikasi Lentera Harum" width={216} height={216} className="block rounded-[10px]" />
        </div>
        <p className="mt-2 break-all text-[11px] font-semibold text-[var(--teks-sekunder)]">{url}</p>
        <a
          href={qr}
          download="qr-lentera-harum.png"
          className="btn3d btn3d-teal mt-2.5 inline-flex h-9 items-center px-4 text-xs"
        >
          Unduh PNG
        </a>
      </div>
    </details>
  );
}
