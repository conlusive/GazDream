import type { LeadEvent, LeadSource, LeadStatus } from "@/lib/db/leads";

export const STATUS_LABEL: Record<LeadStatus, string> = {
  new: "Нова",
  in_progress: "В роботі",
  won: "Угода",
  lost: "Відмова",
  spam: "Спам",
};
export const STATUS_STYLE: Record<LeadStatus, string> = {
  new: "bg-brand-green text-white",
  in_progress: "bg-tint text-brand-green",
  won: "bg-ink text-white",
  lost: "bg-soft text-muted ring-1 ring-line",
  spam: "bg-line text-muted",
};
export const SOURCE_LABEL: Record<LeadSource | string, string> = {
  contact: "Форма «Контакти»",
  quick: "Швидкий запит",
  report: "Звіт калькулятора",
};
export const LANG_LABEL: Record<string, string> = { pl: "Польська", en: "Англійська", de: "Німецька", uk: "Українська" };

/** Dates are shown in the company's time zone (Poland) regardless of where the server runs. */
export const formatDate = (d: Date | string) =>
  new Date(d).toLocaleString("uk-UA", { timeZone: "Europe/Warsaw", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
export const formatDay = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit" });

/** Today's date (YYYY-MM-DD) in the company's time zone. */
export const todayLocal = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Warsaw" });
/** 2026-10-20 -> 20.10.2026 */
export const formatDateOnly = (d: string) => d.split("-").reverse().join(".");

const dash = (v: string) => v || "—";
/** One line of the lead history. */
export function eventText(e: Pick<LeadEvent, "kind" | "from_value" | "to_value">): string {
  switch (e.kind) {
    case "status":
      return `Статус: ${STATUS_LABEL[e.from_value as LeadStatus] ?? e.from_value} → ${STATUS_LABEL[e.to_value as LeadStatus] ?? e.to_value}`;
    case "assignee":
      return e.to_value ? `Відповідальний: ${dash(e.from_value)} → ${e.to_value}` : `Знято відповідального (${dash(e.from_value)})`;
    case "followup":
      return e.to_value ? `Наступний контакт: ${e.from_value ? `${formatDateOnly(e.from_value)} → ` : ""}${formatDateOnly(e.to_value)}` : "Наступний контакт скасовано";
    case "result":
      return `Результат: ${dash(e.to_value)}`;
  }
}
