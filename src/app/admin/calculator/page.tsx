import { saveCalculatorAction } from "../actions";
import ActionForm from "@/components/admin/ActionForm";
import { requireAdmin } from "@/lib/admin-session";
import { readSettings } from "@/lib/db/settings";
import { CROP_KEYS, FUELS, VAT_LANGS } from "@/lib/settings-schema";

const CROP_LABEL = { corn: "Кукурудза", soy: "Соя", rapeseed: "Ріпак" } as const;
const FUEL_LABEL = { gas: "Газ, м³", chips: "Щепа, кг", pellets: "Пелета, кг" } as const;
const VAT_LABEL = { pl: "Польща (PL)", de: "Німеччина (DE)", en: "Англійська версія (EN)", uk: "Українська версія (UK)" } as const;

export default async function CalculatorSettingsPage() {
  await requireAdmin();
  const s = await readSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Параметри калькулятора</h1>
        <p className="text-muted">Дані технічного спеціаліста: скільки палива потрібно, щоб зняти 1% вологи з однієї тонни зерна.</p>
      </div>

      <ActionForm action={saveCalculatorAction} submit="Зберегти параметри" className="space-y-6">
        <section className="card overflow-x-auto p-5 sm:p-6">
          <h2 className="text-lg font-extrabold">Витрата палива на 1 т зерна на 1% вологи</h2>
          <p className="mt-1 text-sm text-muted">Для сої та ріпаку поки використані ті самі значення, що й для кукурудзи (дані зі старого сайту, 2023). Замініть їх, щойно отримаєте дані від технічного спеціаліста.</p>
          <table className="mt-4 w-full min-w-[32rem] text-left text-sm">
            <thead className="text-muted">
              <tr><th className="py-2 pr-3 font-semibold">Культура</th>{FUELS.map((f) => <th key={f} className="py-2 pr-3 font-semibold">{FUEL_LABEL[f]}</th>)}</tr>
            </thead>
            <tbody>
              {CROP_KEYS.map((c) => (
                <tr key={c} className="border-t border-line">
                  <th scope="row" className="py-3 pr-3 text-left font-bold">{CROP_LABEL[c]}</th>
                  {FUELS.map((f) => (
                    <td key={f} className="py-3 pr-3">
                      <input name={`use_${c}_${f}`} aria-label={`${CROP_LABEL[c]}: ${FUEL_LABEL[f]}`} inputMode="decimal" required defaultValue={s.fuelUse[c][f]} className="field !py-2 w-28" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="card overflow-x-auto p-5 sm:p-6">
          <h2 className="text-lg font-extrabold">Вологість за замовчуванням, %</h2>
          <table className="mt-4 w-full min-w-[24rem] text-left text-sm">
            <thead className="text-muted"><tr><th className="py-2 pr-3 font-semibold">Культура</th><th className="py-2 pr-3 font-semibold">Початкова</th><th className="py-2 font-semibold">Цільова</th></tr></thead>
            <tbody>
              {CROP_KEYS.map((c) => (
                <tr key={c} className="border-t border-line">
                  <th scope="row" className="py-3 pr-3 text-left font-bold">{CROP_LABEL[c]}</th>
                  <td className="py-3 pr-3"><input name={`start_${c}`} aria-label={`${CROP_LABEL[c]}: початкова`} inputMode="decimal" required defaultValue={s.crops[c].start} className="field !py-2 w-24" /></td>
                  <td className="py-3"><input name={`target_${c}`} aria-label={`${CROP_LABEL[c]}: цільова`} inputMode="decimal" required defaultValue={s.crops[c].target} className="field !py-2 w-24" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="card p-5 sm:p-6">
          <h2 className="text-lg font-extrabold">Ставка ПДВ, %</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {VAT_LANGS.map((l) => (
              <div key={l} className="grid items-center gap-2 sm:grid-cols-[14rem_6rem]">
                <label htmlFor={`vat_${l}`} className="text-sm">{VAT_LABEL[l]}</label>
                <input id={`vat_${l}`} name={`vat_${l}`} inputMode="decimal" required defaultValue={Math.round(s.vat[l] * 10000) / 100} className="field !py-2" />
              </div>
            ))}
          </div>
        </section>
      </ActionForm>
    </div>
  );
}
