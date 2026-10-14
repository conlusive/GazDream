"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import type { Locale } from "@/i18n/config";

type Status = "idle" | "sending" | "ok" | "error";
type Props = { lang: Locale; dict: Dictionary["calc"]; privacyLabel: string; input: unknown };

/** Lets the visitor e-mail themselves the result. The server recomputes it from `input`. */
export default function ReportForm({ lang, dict, privacyLabel, input }: Props) {
  const [status, setStatus] = useState<Status>("idle");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setStatus("sending");
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: String(form.get("email") ?? ""), consent: form.get("consent") === "on", website: String(form.get("website") ?? ""), lang, input }),
      });
      setStatus(res.ok ? "ok" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="card p-6 sm:p-8">
      <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-muted">{dict.emailTitle}</h2>
      <p className="mt-1 text-sm text-muted">{dict.emailText}</p>
      {status === "ok" ? (
        <p role="status" className="mt-5 rounded-xl bg-tint p-4 font-bold text-brand-green">{dict.emailOk}</p>
      ) : (
        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input name="email" type="email" required maxLength={160} autoComplete="email" placeholder={dict.emailPlaceholder} aria-label={dict.emailPlaceholder} className="field" />
            <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
            <button type="submit" disabled={status === "sending"} className="btn btn-primary shrink-0 disabled:opacity-60">
              {status === "sending" ? dict.emailSending : dict.emailSend}
            </button>
          </div>
          <label className="flex cursor-pointer items-start gap-3 text-sm">
            <input type="checkbox" name="consent" required className="mt-0.5 h-4 w-4 shrink-0 accent-brand-green" />
            <span>
              {dict.emailConsent}{" "}
              <Link href={`/${lang}/privacy`} target="_blank" className="font-bold text-brand-green hover:underline">{privacyLabel}</Link>
            </span>
          </label>
          {status === "error" && <p role="alert" className="text-sm font-bold text-red-700">{dict.emailError}</p>}
        </form>
      )}
    </div>
  );
}
