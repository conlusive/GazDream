import type { LeadStatus } from "@/lib/db/leads";
import { STATUS_LABEL, STATUS_STYLE } from "@/lib/admin-format";

export default function StatusBadge({ status }: { status: LeadStatus }) {
  return <span className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLE[status]}`}>{STATUS_LABEL[status]}</span>;
}
