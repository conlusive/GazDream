import { savePricesAction } from "../actions";
import ActionForm from "@/components/admin/ActionForm";
import { requireAdmin } from "@/lib/admin-session";
import { formatDate } from "@/lib/admin-format";
import { readPriceHistory, readSettings } from "@/lib/db/settings";
import { CURRENCY_KEYS, FUELS } from "@/lib/settings-schema";

const FUEL_LABEL = { gas: "Природний газ (за 1000 м³)", chips: "Щепа (за тонну)", pellets: "Пелета (за тонну)" } as const;

export default async function PricesPage() {
  await requireAdmin();
  const [settings, history] = await Promise.all([readSettings(), readPriceHistory(15)]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Ціни палива</h1>
        <p className="text-muted">Ці ціни підставляються в калькулятор за замовчуванням (клієнт може змінити їх сам). Остання зміна: <strong>{settings.prices.updatedAt}</strong>.</p>
      </div>

      <ActionForm action={savePricesAction} submit="Зберегти ціни" className="card space-y-8 p-5 sm:p-6">
        {CURRENCY_KEYS.map((currency) => (
          <fieldset key={currency} className="space-y-3">
            <legend className="mb-2 text-lg font-extrabold">{currency}</legend>
            {FUELS.map((fuel) => (
              <div key={fuel} className="grid items-center gap-2 sm:grid-cols-[18rem_10rem]">
                <label htmlFor={`${currency}_${fuel}`} className="text-sm">{FUEL_LABEL[fuel]}</label>
                <input id={`${currency}_${fuel}`} name={`${currency}_${fuel}`} inputMode="decimal" required defaultValue={settings.prices.table[currency][fuel]} className="field" />
              </div>
            ))}
          </fieldset>
        ))}
      </ActionForm>

      <section className="card overflow-x-auto">
        <h2 className="p-5 pb-3 text-sm font-bold uppercase tracking-[0.14em] text-muted">Історія змін</h2>
        <table className="tabular w-full min-w-[40rem] text-left text-sm">
          <thead className="border-y border-line text-muted">
            <tr>
              <th className="p-3 font-semibold">Коли</th>
              <th className="p-3 font-semibold">Хто</th>
              <th className="p-3 font-semibold">EUR: газ / щепа / пелета</th>
              <th className="p-3 font-semibold">PLN: газ / щепа / пелета</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 && <tr><td colSpan={4} className="p-5 text-muted">Змін ще не було: діють стандартні значення.</td></tr>}
            {history.map((h) => (
              <tr key={h.id} className="border-b border-line last:border-0">
                <td className="p-3 whitespace-nowrap">{formatDate(h.created_at)}</td>
                <td className="p-3">{h.author ?? "—"}</td>
                <td className="p-3">{h.prices.table.EUR.gas} / {h.prices.table.EUR.chips} / {h.prices.table.EUR.pellets}</td>
                <td className="p-3">{h.prices.table.PLN.gas} / {h.prices.table.PLN.chips} / {h.prices.table.PLN.pellets}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
