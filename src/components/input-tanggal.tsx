"use client";

import { useState } from "react";

/** input[type=date] dengan placeholder ramah "hh-bb-tttt" saat kosong.
 *  Teks segmen native Chromium disembunyikan lewat CSS (.tgl-kosong) dan muncul
 *  lagi saat fokus/terisi; browser non-Chromium memakai tampilan native (overlay
 *  otomatis disembunyikan via @supports di globals.css). */
export default function InputTanggal({
  bungkus = "relative block",
  className,
  defaultValue,
  value,
  onChange,
  ...p
}: React.InputHTMLAttributes<HTMLInputElement> & { bungkus?: string }) {
  const [kosong, setKosong] = useState(!(defaultValue || value));
  return (
    <span className={bungkus}>
      <input
        type="date"
        className={`${className ?? ""}${kosong ? " tgl-kosong" : ""}`}
        defaultValue={defaultValue}
        value={value}
        onChange={(e) => {
          setKosong(!e.target.value);
          onChange?.(e);
        }}
        onBlur={(e) => setKosong(!e.currentTarget.value)}
        {...p}
      />
      <span aria-hidden className="tgl-ph pointer-events-none absolute inset-y-0 left-3 hidden items-center text-sm font-semibold text-[var(--abu)]">
        hh-bb-tttt
      </span>
    </span>
  );
}
