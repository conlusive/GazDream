"use client";

import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import type { Locale } from "@/i18n/config";
import { postLead } from "@/lib/lead-client";

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
    const ok = await postLead({
      name: String(form.get("name") ?? ""),
      contact: String(form.get("contact") ?? ""),
      message: String(form.get("message") ?? ""),
      website: String(form.get("website") ?? ""),
      model,
      calc,
      lang,
      page: "/contact",
    });
    setStatus(ok ? "ok" : "error");
  }

  if (status === "ok") {
    return <p role="status" className="rounded-lg bg-soft p-6 text-lg font-bold text-brand-green">{dict.ok}</p>;
  }

  const field = "field";
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {calc && (
        <p className="rounded-md bg-soft px-4 py-3 text-sm">
          {dict.calcNote} <strong>{calc}</strong>
        </p>
      )}
      {model && <p className="text-sm font-semibold">{model}</p>}
      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-bold">{dict.name}</label>
        <input id="name" name="name" required maxLength={120} autoComplete="name" className={field} />
      </div>
      <div>
        <label htmlFor="contact" className="mb-1.5 block text-sm font-bold">{dict.phone}</label>
        <input id="contact" name="contact" required maxLength={160} autoComplete="tel" className={field} />
      </div>
      <div>
        <label htmlFor="message" className="mb-1.5 block text-sm font-bold">{dict.message}</label>
        <textarea id="message" name="message" rows={5} maxLength={2000} className={`${field} resize-none`} />
      </div>
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      <button
        type="submit"
        disabled={status === "sending"}
        className="btn btn-primary disabled:opacity-60"
      >
        {status === "sending" ? dict.sending : dict.send}
      </button>
      {status === "error" && <p role="alert" className="text-sm font-semibold text-red-700">{dict.error}</p>}
    </form>
  );
}
