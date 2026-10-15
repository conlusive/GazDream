"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import type { Locale } from "@/i18n/config";
import { postLead } from "@/lib/lead-client";
import Select from "./Select";

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
      source: "quick",
    });
    setStatus(ok ? "ok" : "error");
  }

  return (
    <section className="section print:hidden" aria-labelledby="quick-title">
      <div className="container-x">
        <div className="reveal grid gap-10 rounded-3xl border border-line bg-white p-7 shadow-[0_30px_60px_-40px_rgba(11,42,22,0.35)] sm:p-12 lg:grid-cols-[1fr_1.5fr] lg:items-center">
          <div>
            <p className="eyebrow mb-3">{dict.title}</p>
            <h2 id="quick-title" className="display text-3xl sm:text-4xl">{dict.lead}</h2>
            <Link href={`/${lang}/calculator`} className="group mt-6 inline-flex items-center gap-2 text-sm font-bold text-brand-green">
              {dict.calc} → {calcLabel}
              <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </Link>
          </div>

          {status === "ok" ? (
            <p role="status" className="rounded-2xl bg-soft p-6 text-lg font-bold text-brand-green">{dict.ok}</p>
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
                <span className="mb-1.5 block text-sm font-bold">{dict.interest}</span>
                <Select name="interest" label={dict.interest} options={dict.options.map((o) => ({ value: o, label: o }))} />
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
