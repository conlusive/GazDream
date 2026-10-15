import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { Suspense, type ReactNode } from "react";
import "../globals.css";
import { logout } from "./actions";
import AdminNav, { type NavItem } from "@/components/admin/AdminNav";
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

  const items: NavItem[] = [
    { href: "/admin", label: "Огляд" },
    { href: "/admin/leads", label: "Заявки" },
    ...(user.role === "admin"
      ? [
          { href: "/admin/prices", label: "Ціни палива" },
          { href: "/admin/calculator", label: "Калькулятор" },
          { href: "/admin/content", label: "Контакти й відгуки" },
          { href: "/admin/users", label: "Користувачі" },
          { href: "/admin/log", label: "Журнал дій" },
        ]
      : []),
    { href: "/admin/account", label: "Мій обліковий запис" },
  ];

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="bg-forest p-4 text-white lg:sticky lg:top-0 lg:h-screen lg:p-5">
        <p className="mb-1 text-lg font-extrabold tracking-tight">Eco Straßmayr</p>
        <p className="mb-4 text-xs text-white/60">Адмін-панель</p>
        <AdminNav items={items} />
        <div className="mt-4 border-t border-white/15 pt-4 text-sm lg:absolute lg:inset-x-5 lg:bottom-5">
          <p className="font-semibold">{user.name}</p>
          <p className="text-xs text-white/60">{user.role === "admin" ? "Адміністратор" : "Менеджер"}</p>
          <form action={logout} className="mt-2">
            <button className="text-xs font-bold text-leaf hover:underline">Вийти</button>
          </form>
        </div>
      </aside>
      <div className="min-w-0 p-4 sm:p-8">
        {!storageIsDurable() && (
          <p role="note" className="mb-6 rounded-xl border border-orange-300 bg-orange-50 p-4 text-sm text-orange-900">
            <strong>Тимчасове сховище.</strong> Не задано <code>DATABASE_URL</code>, тому дані (заявки, ціни, користувачі) можуть зникнути після перезапуску сервера. Підключіть базу Postgres (див. <code>docs/DEPLOY.md</code>).
          </p>
        )}
        {children}
      </div>
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
