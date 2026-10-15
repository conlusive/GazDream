import { savePricesAction, saveCalculatorAction } from "../actions";
import ActionForm from "@/components/admin/ActionForm";
import { PageHeader, Section } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin-session";
import { formatDate } from "@/lib/admin-format";
import { readPriceHistory, readSettings } from "@/lib/db/settings";
import { CROP_KEYS, CURRENCY_KEYS, FUELS, VAT_LANGS } from "@/lib/settings-schema";

const CROP_LABEL = { corn: "Кукурудза", soy: "Соя", rapeseed: "Ріпак" } as const;
const PRICE_LABEL = { gas: "Природний газ, за 1000 м³", chips: "Щепа, за тонну", pellets: "Пелета, за тонну" } as const;
const USE_LABEL = { gas: "Газ, м³", chips: "Щепа, кг", pellets: "Пелета, кг" } as const;
const VAT_LABEL = { pl: "Польща (PL)", de: "Німеччина (DE)", en: "Англійська версія (EN)", uk: "Українська версія (UK)" } as const;

export default async function CalculatorSettingsPage() {
  await requireAdmin();
  const [s, history] = await Promise.all([readSettings(), readPriceHistory(15)]);

  return (
    <div className="space-y-6">
      <PageHeader title="Калькулятор" subtitle="Ціни та параметри, за якими калькулятор на сайті рахує вигоду. Зміни з'являються одразу." />

      <Section title="Ціни палива" hint={<>Підставляються в калькулятор за замовчуванням, клієнт може змінити їх сам. Остання зміна: <strong>{s.prices.updatedAt}</strong>.</>}>
        <ActionForm action={savePricesAction} submit="Зберегти ціни">
          <div className="grid max-w-xl grid-cols-[1fr_6.5rem_6.5rem] items-center gap-x-3 gap-y-2 sm:grid-cols-[1fr_8rem_8rem]">
            <span />
            {CURRENCY_KEYS.map((c) => <span key={c} className="text-sm font-bold text-muted">{c}</span>)}
            {FUELS.map((fuel) => (
              <div key={fuel} className="contents">
                <span className="text-sm">{PRICE_LABEL[fuel]}</span>
                {CURRENCY_KEYS.map((currency) => (
                  <input key={currency} id={`${currency}_${fuel}`} name={`${currency}_${fuel}`} aria-label={`${PRICE_LABEL[fuel]}, ${currency}`} inputMode="decimal" required defaultValue={s.prices.table[currency][fuel]} className="field !py-2" />
                ))}
              </div>
            ))}
          </div>
        </ActionForm>
        <details className="mt-5 border-t border-line pt-4">
          <summary className="cursor-pointer text-sm font-bold text-brand-green">Історія змін цін</summary>
          <div className="mt-3 overflow-x-auto">
            <table className="tabular w-full min-w-[36rem] text-left text-sm">
              <thead className="text-muted">
                <tr><th className="py-2 pr-3 font-semibold">Коли</th><th className="py-2 pr-3 font-semibold">Хто</th><th className="py-2 pr-3 font-semibold">EUR: газ / щепа / пелета</th><th className="py-2 font-semibold">PLN: газ / щепа / пелета</th></tr>
              </thead>
              <tbody>
                {history.length === 0 && <tr><td colSpan={4} className="border-t border-line py-3 text-muted">Змін ще не було: діють стандартні значення.</td></tr>}
                {history.map((h) => (
                  <tr key={h.id} className="border-t border-line">
                    <td className="whitespace-nowrap py-2 pr-3">{formatDate(h.created_at)}</td>
                    <td className="py-2 pr-3">{h.author ?? "—"}</td>
                    <td className="py-2 pr-3">{h.prices.table.EUR.gas} / {h.prices.table.EUR.chips} / {h.prices.table.EUR.pellets}</td>
                    <td className="py-2">{h.prices.table.PLN.gas} / {h.prices.table.PLN.chips} / {h.prices.table.PLN.pellets}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </Section>

      <Section title="Параметри по культурах" hint="Витрата палива на зняття 1% вологи з 1 тонни зерна (дані технічного спеціаліста) і вологість за замовчуванням. Для сої та ріпаку поки ті самі значення, що й для кукурудзи (дані зі старого сайту, 2023): замініть їх, щойно отримаєте точні.">
        <ActionForm action={saveCalculatorAction} submit="Зберегти параметри">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[38rem] text-left text-sm">
              <thead className="text-muted">
                <tr>
                  <th className="py-2 pr-3 font-semibold">Культура</th>
                  {FUELS.map((f) => <th key={f} className="py-2 pr-3 font-semibold">{USE_LABEL[f]}</th>)}
                  <th className="py-2 pr-3 font-semibold">Вологість з, %</th>
                  <th className="py-2 font-semibold">до, %</th>
                </tr>
              </thead>
              <tbody>
                {CROP_KEYS.map((c) => (
                  <tr key={c} className="border-t border-line">
                    <th scope="row" className="py-3 pr-3 text-left font-bold">{CROP_LABEL[c]}</th>
                    {FUELS.map((f) => (
                      <td key={f} className="py-3 pr-3"><input name={`use_${c}_${f}`} aria-label={`${CROP_LABEL[c]}: ${USE_LABEL[f]}`} inputMode="decimal" required defaultValue={s.fuelUse[c][f]} className="field !py-2 w-24" /></td>
                    ))}
                    <td className="py-3 pr-3"><input name={`start_${c}`} aria-label={`${CROP_LABEL[c]}: початкова вологість`} inputMode="decimal" required defaultValue={s.crops[c].start} className="field !py-2 w-24" /></td>
                    <td className="py-3"><input name={`target_${c}`} aria-label={`${CROP_LABEL[c]}: цільова вологість`} inputMode="decimal" required defaultValue={s.crops[c].target} className="field !py-2 w-24" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="mt-6 text-sm font-extrabold">Ставка ПДВ, %</h3>
          <div className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {VAT_LANGS.map((l) => (
              <div key={l} className="grid grid-cols-[1fr_6rem] items-center gap-3">
                <label htmlFor={`vat_${l}`} className="text-sm">{VAT_LABEL[l]}</label>
                <input id={`vat_${l}`} name={`vat_${l}`} inputMode="decimal" required defaultValue={Math.round(s.vat[l] * 10000) / 100} className="field !py-2" />
              </div>
            ))}
          </div>
        </ActionForm>
      </Section>
    </div>
  );
}
