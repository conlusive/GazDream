import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { Suspense, type ReactNode } from "react";
import "../globals.css";
import { logout } from "./actions";
import Link from "next/link";
import AdminNav, { type NavGroup } from "@/components/admin/AdminNav";
import LoginForm from "@/components/admin/LoginForm";
import { currentUser } from "@/lib/admin-session";
import { countUsers } from "@/lib/db/users";
import { databaseRequiredButMissing, storageIsDurable } from "@/lib/db";

const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin", "latin-ext", "cyrillic"], display: "swap" });

export const metadata: Metadata = {
  title: "Адмін-панель | Eco Straßmayr Energy",
  robots: { index: false, follow: false },
};

async function Shell({ children }: { children: ReactNode }) {
  if (databaseRequiredButMissing()) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16">
        <h1 className="text-2xl font-extrabold tracking-tight">Потрібна база даних</h1>
        <p className="mt-3 text-muted">
          Цей сервер не має постійного диска, тому для адмінки потрібна база Postgres. Створіть безкоштовну базу (Supabase чи Neon), додайте її адресу у змінну середовища <code>DATABASE_URL</code> і перезапустіть сайт. Докладно: <code>docs/DEPLOY.md</code>.
        </p>
      </main>
    );
  }
  const user = await currentUser();
  if (!user) {
    let firstRun = false;
    try {
      firstRun = (await countUsers()) === 0;
    } catch {
      /* database down: show the plain login screen */
    }
    return <LoginForm firstRun={firstRun} />;
  }

  const groups: NavGroup[] = [
    { items: [{ href: "/admin", label: "Огляд" }, { href: "/admin/leads", label: "Заявки" }] },
    ...(user.role === "admin"
      ? [
          { label: "Сайт", items: [{ href: "/admin/calculator", label: "Калькулятор" }, { href: "/admin/content", label: "Контакти й відгуки" }] },
          { label: "Система", items: [{ href: "/admin/users", label: "Користувачі" }, { href: "/admin/log", label: "Журнал дій" }] },
        ]
      : []),
  ];
  const roleLabel = user.role === "admin" ? "Адміністратор" : "Менеджер";

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="bg-forest px-4 pb-2 pt-4 text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:p-5">
        <div className="mb-3 flex items-center justify-between gap-3 lg:mb-8">
          <div>
            <p className="text-lg font-extrabold leading-tight tracking-tight">Eco Straßmayr</p>
            <p className="text-xs text-white/60">Адмін-панель</p>
          </div>
          <div className="flex items-center gap-3 text-sm lg:hidden">
            <Link href="/admin/account" className="font-semibold hover:underline">{user.name}</Link>
            <form action={logout}><button className="font-bold text-leaf hover:underline">Вийти</button></form>
          </div>
        </div>
        <div className="lg:flex-1 lg:overflow-y-auto"><AdminNav groups={groups} /></div>
        <div className="hidden border-t border-white/15 pt-4 text-sm lg:block">
          <Link href="/admin/account" className="block rounded-lg px-1 py-1 hover:bg-white/10">
            <span className="block font-semibold">{user.name}</span>
            <span className="block text-xs text-white/60">{roleLabel} · змінити пароль</span>
          </Link>
          <form action={logout} className="mt-2 px-1"><button className="text-xs font-bold text-leaf hover:underline">Вийти</button></form>
        </div>
      </aside>
      <main className="min-w-0 p-4 sm:p-8">
        {!storageIsDurable() && (
          <p role="note" className="mb-6 rounded-xl border border-brand-orange/50 bg-brand-orange/10 px-4 py-3 text-sm">
            <strong>Тимчасове сховище.</strong> Не задано <code>DATABASE_URL</code>: заявки, ціни й користувачі можуть зникнути після перезапуску сервера.
          </p>
        )}
        {children}
      </main>
    </div>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="uk" className={manrope.variable}>
      <body className="min-h-screen bg-soft">
        <Suspense fallback={<p className="p-8 text-muted">Завантаження…</p>}>
          <Shell>{children}</Shell>
        </Suspense>
      </body>
    </html>
  );
}
