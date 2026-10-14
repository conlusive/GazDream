"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

type Option = { value: string; label: string };
type Props = {
  options: Option[];
  label: string;
  /** Controlled value. Omit it (and use defaultValue) for uncontrolled use inside a <form>. */
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Adds a hidden input so the choice is submitted with the form. */
  name?: string;
  className?: string;
  compact?: boolean;
};

/** Custom dropdown in the site's style: keyboard accessible (arrows, Enter, Esc, Home/End) listbox. */
export default function Select({ options, label, value, defaultValue, onChange, name, className = "", compact = false }: Props) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const [inner, setInner] = useState(defaultValue ?? options[0]?.value ?? "");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);

  const current = value ?? inner;
  const selected = Math.max(0, options.findIndex((o) => o.value === current));

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  const choose = (i: number) => {
    const next = options[i].value;
    if (value === undefined) setInner(next);
    onChange?.(next);
    setOpen(false);
    button.current?.focus();
  };
  const openList = () => {
    setHighlight(selected);
    setOpen(true);
  };

  const onKey = (e: KeyboardEvent) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }
    if (e.key === "Escape") { e.preventDefault(); setOpen(false); }
    else if (e.key === "ArrowDown") { e.preventDefault(); setHighlight((h) => Math.min(options.length - 1, h + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHighlight((h) => Math.max(0, h - 1)); }
    else if (e.key === "Home") { e.preventDefault(); setHighlight(0); }
    else if (e.key === "End") { e.preventDefault(); setHighlight(options.length - 1); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choose(highlight); }
    else if (e.key === "Tab") setOpen(false);
  };

  return (
    <div ref={root} className={`relative ${className}`}>
      {name && <input type="hidden" name={name} value={options[selected]?.label ?? ""} />}
      <button
        ref={button}
        type="button"
        role="combobox"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKey}
        className={`flex w-full items-center justify-between gap-3 rounded-xl border bg-white text-left font-medium transition-colors duration-200 focus:outline-none focus-visible:border-brand-green focus-visible:ring-4 focus-visible:ring-brand-green/10 ${
          open ? "border-brand-green" : "border-line hover:border-ink/40"
        } ${compact ? "min-h-11 px-3 py-2 text-sm font-bold" : "px-4 py-3 text-base"}`}
      >
        <span className="truncate">{options[selected]?.label}</span>
        <svg aria-hidden="true" viewBox="0 0 20 20" className={`h-4 w-4 shrink-0 text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 8l5 5 5-5" />
        </svg>
      </button>

      {open && (
        <ul
          id={`${id}-list`}
          role="listbox"
          aria-label={label}
          className="rise absolute left-0 right-0 z-30 mt-2 max-h-64 min-w-max overflow-auto rounded-xl border border-line bg-white p-1.5 shadow-[0_18px_40px_-18px_rgba(11,42,22,0.35)]"
          style={{ animationDuration: "0.2s" }}
        >
          {options.map((o, i) => (
            <li
              key={o.value}
              role="option"
              aria-selected={i === selected}
              onPointerEnter={() => setHighlight(i)}
              onClick={() => choose(i)}
              className={`flex cursor-pointer items-center justify-between gap-4 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                i === highlight ? "bg-tint text-brand-green" : ""
              }`}
            >
              {o.label}
              {i === selected && (
                <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-brand-green" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10.5l4 4 8-9" /></svg>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
