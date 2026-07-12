"use client";

import { useState } from "react";

/** Input sandi dengan tombol "mata" untuk melihat sekilas yang diketik. */
export default function InputSandi({
  className,
  ...p
}: React.InputHTMLAttributes<HTMLInputElement>) {
  const [lihat, setLihat] = useState(false);
  return (
    <span className="relative mt-1.5 block">
      <input {...p} type={lihat ? "text" : "password"} className={`${className ?? ""} pr-12`} />
      <button
        type="button"
        aria-label={lihat ? "Sembunyikan sandi" : "Lihat sandi"}
        onClick={() => setLihat((v) => !v)}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-[var(--abu)] transition-transform active:scale-90"
      >
        {lihat ? (
          <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24" />
            <path d="M1 1l22 22" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </span>
  );
}
