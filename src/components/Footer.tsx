import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/app/[lang]/dictionaries";

export default function Footer({ dict }: { lang: Locale; dict: Dictionary }) {
  return (
    <footer className="print:hidden border-t border-line bg-soft">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-muted">
        <p className="font-semibold text-ink">GazDream · {dict.hero.badge}</p>
        <p>{dict.footer.legalName} · {dict.footer.address}</p>
        <p className="mt-2">© GazDream. {dict.footer.rights}.</p>
      </div>
    </footer>
  );
}
