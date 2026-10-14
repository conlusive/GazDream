"use client";

import { useActionState } from "react";
import { logout, savePrices, type FormState } from "@/app/admin/actions";
import type { Prices } from "@/lib/prices";

const FUEL_LABEL = {
  gas: "Природний газ (за 1000 м³)",
  chips: "Щепа (за тонну)",
  pellets: "Пелета (за тонну)",
} as const;

export default function PricesForm({ prices }: { prices: Prices }) {
  const [state, action, pending] = useActionState<FormState, FormData>(savePrices, {});

  return (
    <div className="space-y-4">
      <form action={action} className="space-y-6 rounded-lg bg-white p-6">
        <p className="text-sm text-muted">
          Ці ціни підставляються в калькулятор за замовчуванням. Клієнт може змінити їх сам. Остання зміна:{" "}
          <strong>{prices.updatedAt}</strong>.
        </p>
        {(["EUR", "PLN"] as const).map((currency) => (
          <fieldset key={currency} className="space-y-3">
            <legend className="font-bold">{currency}</legend>
            {(Object.keys(FUEL_LABEL) as (keyof typeof FUEL_LABEL)[]).map((fuel) => (
              <div key={fuel} className="flex items-center gap-3">
                <label htmlFor={`${currency}_${fuel}`} className="w-56 text-sm">{FUEL_LABEL[fuel]}</label>
                <input
                  id={`${currency}_${fuel}`}
                  name={`${currency}_${fuel}`}
                  inputMode="decimal"
                  required
                  defaultValue={prices.table[currency][fuel]}
                  className="w-32 rounded-md border border-line px-3 py-2"
                />
              </div>
            ))}
          </fieldset>
        ))}
        <button disabled={pending} className="rounded-md bg-brand-orange px-5 py-2 font-semibold text-white disabled:opacity-60">
          {pending ? "Збереження…" : "Зберегти"}
        </button>
        {state.ok && <p role="status" className="text-sm font-semibold text-brand-green">Збережено. Калькулятор оновлено.</p>}
        {state.error && <p role="alert" className="text-sm font-semibold text-red-700">{state.error}</p>}
      </form>
      <form action={logout}>
        <button className="text-sm text-muted underline">Вийти</button>
      </form>
    </div>
  );
}
