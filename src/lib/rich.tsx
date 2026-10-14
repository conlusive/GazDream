import type { ReactNode } from "react";

/** Turns "Policz, ile *zaoszczędzisz*" into text with an accent-styled <em> for the starred part. */
export function rich(text: string): ReactNode {
  return text.split("*").map((part, i) => (i % 2 === 1 ? <em key={i} className="serif">{part}</em> : part));
}

/** Same text without the markers, for places that need plain strings (aria-labels, titles). */
export const plain = (text: string) => text.replace(/\*/g, "");
