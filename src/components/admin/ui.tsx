import type { ReactNode } from "react";

/** Title block shared by every admin page, so they all start the same way. */
export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

/** One white card with an optional heading: the only container used on admin pages. */
export function Section({ title, hint, children, className = "" }: { title?: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`card p-5 sm:p-6 ${className}`}>
      {title && <h2 className="text-base font-extrabold">{title}</h2>}
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
      <div className={title || hint ? "mt-4" : ""}>{children}</div>
    </section>
  );
}
