"use client";

import { useActionState } from "react";
import { login, type FormState } from "@/app/admin/actions";

export default function LoginForm({ firstRun }: { firstRun: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(login, {});

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <p className="text-sm font-bold text-brand-green">Eco Straßmayr Energy</p>
      <h1 className="mt-1 text-2xl font-extrabold tracking-tight">Вхід до адмін-панелі</h1>
      <form action={action} className="card mt-6 space-y-4 p-6">
        <div>
          <label className="mb-1.5 block text-sm font-bold" htmlFor="email">E-mail</label>
          <input id="email" name="email" autoComplete="username" required className="field" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-bold" htmlFor="password">Пароль</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required className="field" />
        </div>
        <button disabled={pending} className="btn btn-primary w-full disabled:opacity-60">{pending ? "Вхід…" : "Увійти"}</button>
        {state.error && <p role="alert" className="text-sm font-bold text-red-700">{state.error}</p>}
      </form>
      {firstRun && (
        <p className="mt-4 rounded-xl bg-soft p-4 text-sm text-muted">
          Це перший запуск: користувачів ще немає. Увійдіть даними з змінних середовища <code>ADMIN_EMAIL</code> (за замовчуванням <code>admin</code>) і{" "}
          <code>ADMIN_PASSWORD</code>, і буде створено першого адміністратора. Одразу змініть пароль у розділі «Мій обліковий запис».
        </p>
      )}
    </main>
  );
}
