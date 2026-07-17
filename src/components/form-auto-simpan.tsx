"use client";

import { useRef, type FormEvent, type FormHTMLAttributes } from "react";

/** Bungkus <form> yg auto-submit begitu input tanggal (name="tgl") di dalamnya
 *  diisi nilai lengkap — ortu tak perlu klik tombol simpan. Tombol simpan tetap
 *  berfungsi sbg fallback (no-JS, atau ortu ingin isi lokasi dulu baru simpan);
 *  requestSubmit() ikut kirim field lain (mis. lokasi) yg sudah terisi.
 *  Guard `terkirim` cegah requestSubmit ganda utk nilai tanggal yg sama persis. */
export default function FormAutoSimpan(props: FormHTMLAttributes<HTMLFormElement>) {
  const formRef = useRef<HTMLFormElement>(null);
  const terkirim = useRef<string | null>(null);

  function handleChange(e: FormEvent<HTMLFormElement>) {
    const target = e.target as HTMLInputElement;
    if (target.name !== "tgl") return;
    if (!target.value) {
      // Field dikosongkan: jangan submit, dan reset guard supaya memilih ulang
      // tanggal yang sama setelah clear tetap auto-submit.
      terkirim.current = null;
      return;
    }
    if (target.value === terkirim.current) return;
    terkirim.current = target.value;
    formRef.current?.requestSubmit();
  }

  return <form {...props} ref={formRef} onChange={handleChange} />;
}
