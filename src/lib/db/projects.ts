import "server-only";
import { getDb } from "./index";
import type { ProjectFuel } from "@/lib/projects-seed";

export type Project = {
  id: number;
  location_pl: string;
  location_en: string;
  location_de: string;
  location_uk: string;
  power_mw: string;
  fuel: ProjectFuel;
  dryer: string;
  per_day: string;
  visible: boolean;
  sort: number;
};

export type ProjectInput = Omit<Project, "id">;

const COLUMNS = "id, location_pl, location_en, location_de, location_uk, power_mw, fuel, dryer, per_day, visible, sort";

export async function listAllProjects(): Promise<Project[]> {
  const db = await getDb();
  return db.query<Project>(`SELECT ${COLUMNS} FROM projects ORDER BY sort, id`);
}

export async function listVisibleProjects(): Promise<Project[]> {
  const db = await getDb();
  return db.query<Project>(`SELECT ${COLUMNS} FROM projects WHERE visible ORDER BY sort, id`);
}

const text = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

export function validateProject(i: Partial<Record<keyof ProjectInput, unknown>>): ProjectInput {
  const power = text(i.power_mw, 12).replace(".", ",");
  if (!/^\d{1,3}(,\d{1,2})?$/.test(power) || Number(power.replace(",", ".")) <= 0) throw new Error("Потужність: число в МВт, наприклад 5,0.");
  const pl = text(i.location_pl, 80);
  if (!pl) throw new Error("Вкажіть місце розташування польською (інші мови можна залишити порожніми).");
  const fuel = i.fuel === "moist" ? "moist" : "chips";
  const perDay = text(i.per_day, 20);
  if (perDay && !/^\d{1,5}([–-]\d{1,5})?$/.test(perDay)) throw new Error("Продуктивність: число або діапазон, наприклад 600 чи 350–400.");
  return {
    location_pl: pl,
    // An empty translation falls back to Polish on the site.
    location_en: text(i.location_en, 80),
    location_de: text(i.location_de, 80),
    location_uk: text(i.location_uk, 80),
    power_mw: power,
    fuel,
    dryer: text(i.dryer, 40),
    per_day: perDay.replace("-", "–"),
    visible: i.visible !== false,
    sort: Number.isFinite(Number(i.sort)) ? Math.trunc(Number(i.sort)) : 0,
  };
}

export async function saveProject(id: number | null, p: ProjectInput) {
  const db = await getDb();
  const v = [p.location_pl, p.location_en, p.location_de, p.location_uk, p.power_mw, p.fuel, p.dryer, p.per_day, p.visible, p.sort];
  if (id === null) {
    await db.query(
      "INSERT INTO projects (location_pl, location_en, location_de, location_uk, power_mw, fuel, dryer, per_day, visible, sort) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
      v,
    );
  } else {
    await db.query(
      "UPDATE projects SET location_pl=$2, location_en=$3, location_de=$4, location_uk=$5, power_mw=$6, fuel=$7, dryer=$8, per_day=$9, visible=$10, sort=$11 WHERE id=$1",
      [id, ...v],
    );
  }
}

export async function deleteProject(id: number) {
  const db = await getDb();
  await db.query("DELETE FROM projects WHERE id = $1", [id]);
}
