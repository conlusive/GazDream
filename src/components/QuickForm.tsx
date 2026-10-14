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

  const field = "w-full min-w-0 rounded-md border border-white/30 bg-white px-3 py-2 text-base text-ink focus:outline-none focus:ring-2 focus:ring-brand-orange";

  return (
    <section className="bg-brand-green-dark text-white print:hidden" aria-labelledby="quick-title">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 lg:grid-cols-[1fr_2fr] lg:items-center">
        <div>
          <h2 id="quick-title" className="text-2xl font-bold">{dict.title}</h2>
          <p className="mt-2 text-white/85">{dict.lead}</p>
          <Link href={`/${lang}/calculator`} className="mt-3 inline-block text-sm font-semibold underline">
            {dict.calc} → {calcLabel}
          </Link>
        </div>

        {status === "ok" ? (
          <p role="status" className="rounded-lg bg-white/10 p-5 font-semibold">{dict.ok}</p>
        ) : (
          <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="qf-name" className="mb-1 block text-sm font-semibold">{dict.name}</label>
              <input id="qf-name" name="name" required maxLength={120} autoComplete="name" className={field} />
            </div>
            <div>
              <label htmlFor="qf-phone" className="mb-1 block text-sm font-semibold">{dict.phone}</label>
              <input id="qf-phone" name="phone" type="tel" required maxLength={160} autoComplete="tel" className={field} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="qf-interest" className="mb-1 block text-sm font-semibold">{dict.interest}</label>
              <select id="qf-interest" name="interest" className={field}>
                {dict.options.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
            <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={status === "sending"}
                className="rounded-md bg-brand-orange px-6 py-3 font-semibold text-white hover:bg-brand-orange-dark disabled:opacity-60"
              >
                {status === "sending" ? dict.sending : dict.send}
              </button>
              {status === "error" && <p role="alert" className="mt-2 text-sm font-semibold text-orange-200">{dict.error}</p>}
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
