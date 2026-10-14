"use client";

import { useState } from "react";
import Faq from "./Faq";

type Props = { items: { q: string; a: string }[]; placeholder: string; none: string };

export default function FaqList({ items, placeholder, none }: Props) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const shown = q ? items.filter((i) => `${i.q} ${i.a}`.toLowerCase().includes(q)) : items;

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="field mb-6"
      />
      {shown.length > 0 ? <Faq items={shown} /> : <p className="rounded-xl bg-soft p-5 text-muted">{none}</p>}
    </div>
  );
}
