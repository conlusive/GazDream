"use client";

import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import type { Locale } from "@/i18n/config";

type Status = "idle" | "sending" | "ok" | "error";

export default function ContactForm({ lang, dict }: { lang: Locale; dict: Dictionary["contact"] }) {
  const params = useSearchParams();
  const model = params.get("model") ?? "";
  const calc = params.get("calc") ?? "";
  const [status, setStatus] = useState<Status>("idle");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setStatus("sending");
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...Object.fromEntries(form), model, calc, lang }),
      });
      setStatus(res.ok ? "ok" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "ok") {
    return <p role="status" className="rounded-lg bg-green-100 p-5 font-semibold">{dict.ok}</p>;
  }

  const field = "w-full rounded-md border border-line px-3 py-2 text-base focus:border-brand-green focus:outline-none";
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {calc && (
        <p className="rounded bg-soft px-3 py-2 text-sm">
          {dict.calcNote} <strong>{calc}</strong>
        </p>
      )}
      {model && <p className="text-sm font-semibold">{model}</p>}
      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-semibold">{dict.name}</label>
        <input id="name" name="name" required maxLength={120} autoComplete="name" className={field} />
      </div>
      <div>
        <label htmlFor="contact" className="mb-1 block text-sm font-semibold">{dict.phone}</label>
        <input id="contact" name="contact" required maxLength={160} autoComplete="tel" className={field} />
      </div>
      <div>
        <label htmlFor="message" className="mb-1 block text-sm font-semibold">{dict.message}</label>
        <textarea id="message" name="message" rows={4} maxLength={2000} className={field} />
      </div>
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      <button
        type="submit"
        disabled={status === "sending"}
        className="rounded-md bg-brand-orange px-6 py-3 font-semibold text-white hover:bg-brand-orange-dark disabled:opacity-60"
      >
        {status === "sending" ? dict.sending : dict.send}
      </button>
      {status === "error" && <p role="alert" className="text-sm font-semibold text-red-700">{dict.error}</p>}
    </form>
  );
}
