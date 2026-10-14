"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import type { Locale } from "@/i18n/config";
import { postLead } from "@/lib/lead-client";

type Status = "idle" | "sending" | "ok" | "error";

export default function QuickForm({ lang, dict, calcLabel }: { lang: Locale; dict: Dictionary["quick"]; calcLabel: string }) {
  const pathname = usePathname();
  const [status, setStatus] = useState<Status>("idle");

  // The contact page already has the full form.
  if (pathname.endsWith("/contact")) return null;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setStatus("sending");
    const ok = await postLead({
      name: String(form.get("name") ?? ""),
      contact: String(form.get("phone") ?? ""),
      message: String(form.get("interest") ?? ""),
      website: String(form.get("website") ?? ""),
      lang,
      page: pathname,
    });
    setStatus(ok ? "ok" : "error");
  }

  return (
    <section className="section print:hidden" aria-labelledby="quick-title">
      <div className="container-x">
        <div className="reveal grid gap-10 border-y border-line py-12 lg:grid-cols-[1fr_1.5fr] lg:items-center">
          <div>
            <p className="eyebrow mb-3">{dict.title}</p>
            <h2 id="quick-title" className="display text-3xl sm:text-4xl">{dict.lead}</h2>
            <Link href={`/${lang}/calculator`} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-green hover:underline">
              {dict.calc} → {calcLabel}
            </Link>
          </div>

          {status === "ok" ? (
            <p role="status" className="rounded-lg bg-soft p-6 text-lg font-bold text-brand-green">{dict.ok}</p>
          ) : (
            <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="qf-name" className="mb-1.5 block text-sm font-bold">{dict.name}</label>
                <input id="qf-name" name="name" required maxLength={120} autoComplete="name" className="field" />
              </div>
              <div>
                <label htmlFor="qf-phone" className="mb-1.5 block text-sm font-bold">{dict.phone}</label>
                <input id="qf-phone" name="phone" type="tel" required maxLength={160} autoComplete="tel" className="field" />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="qf-interest" className="mb-1.5 block text-sm font-bold">{dict.interest}</label>
                <select id="qf-interest" name="interest" className="field">
                  {dict.options.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
              <div className="sm:col-span-2">
                <button type="submit" disabled={status === "sending"} className="btn btn-primary disabled:opacity-60">
                  {status === "sending" ? dict.sending : dict.send}
                </button>
                {status === "error" && <p role="alert" className="mt-3 text-sm font-bold text-red-700">{dict.error}</p>}
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
