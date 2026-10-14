"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { login, type FormState } from "@/app/admin/actions";

export default function LoginForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState<FormState, FormData>(login, {});

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.ok, router]);

  return (
    <form action={action} className="space-y-4 rounded-lg bg-white p-6">
      <label className="block text-sm font-semibold" htmlFor="password">Пароль</label>
      <input
        id="password"
        name="password"
        type="password"
        required
        autoComplete="current-password"
        className="w-full rounded-md border border-line px-3 py-2"
      />
      <button disabled={pending} className="rounded-md bg-brand-green px-5 py-2 font-semibold text-white disabled:opacity-60">
        {pending ? "Вхід…" : "Увійти"}
      </button>
      {state.error && <p role="alert" className="text-sm font-semibold text-red-700">{state.error}</p>}
    </form>
  );
}
