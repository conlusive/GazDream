import type { LeadSource, LeadStatus } from "@/lib/db/leads";

export const STATUS_LABEL: Record<LeadStatus, string> = {
  new: "Нова",
  in_progress: "В роботі",
  closed: "Закрита",
  spam: "Спам",
};
export const STATUS_STYLE: Record<LeadStatus, string> = {
  new: "bg-brand-green text-white",
  in_progress: "bg-tint text-brand-green",
  closed: "bg-soft text-muted ring-1 ring-line",
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
