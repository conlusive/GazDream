"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { clientKey, endSession, requireAdmin, requireUser, startSession } from "@/lib/admin-session";
import { audit } from "@/lib/db/audit";
import { addNote, deleteLead, setLeadStatus, STATUSES, type LeadStatus } from "@/lib/db/leads";
import { deleteProject, saveProject, validateProject } from "@/lib/db/projects";
import { writePrices, writeSetting } from "@/lib/db/settings";
import { deleteTestimonial, saveTestimonial, validateTestimonial } from "@/lib/db/testimonials";
import {
  authenticate, clearFailedLogins, createUser, loginBlocked, normalizeEmail, recordFailedLogin, setUserActive,
  setUserPassword, setUserRole, verifyPassword, type Role,
} from "@/lib/db/users";
import { getDb } from "@/lib/db";
import { PROJECTS_TAG, SETTINGS_TAG, TESTIMONIALS_TAG } from "@/lib/settings";
import {
  CROP_KEYS, CURRENCY_KEYS, FUELS, VAT_LANGS, parseContacts, parseCrops, parseFuelUse, parsePrices, parseVat,
} from "@/lib/settings-schema";

export type FormState = { error?: string; ok?: string };

const num = (v: FormDataEntryValue | null) => (typeof v === "string" ? Number(v.trim().replace(",", ".")) : NaN);
const str = (v: FormDataEntryValue | null) => (typeof v === "string" ? v : "");
const fail = (err: unknown): FormState => ({ error: err instanceof Error ? err.message : "Не вдалося виконати дію." });

function publicChanged() {
  updateTag(SETTINGS_TAG);
  updateTag(TESTIMONIALS_TAG);
  updateTag(PROJECTS_TAG);
}

// ---------------------------------------------------------------- sign in / out

export async function login(_prev: FormState, form: FormData): Promise<FormState> {
  const email = normalizeEmail(str(form.get("email")));
  const password = str(form.get("password"));
  const keys = [`ip:${await clientKey()}`, `email:${email}`];
  try {
    if (await loginBlocked(keys)) return { error: "Забагато невдалих спроб. Спробуйте через 15 хвилин." };
    const user = email && password ? await authenticate(email, password) : null;
    if (!user) {
      await recordFailedLogin(keys);
      return { error: "Невірний e-mail або пароль." };
    }
    await clearFailedLogins(keys);
    await startSession(user.id);
    await audit(user, "Вхід");
  } catch (err) {
    console.error("login failed", err instanceof Error ? err.message : err);
    return { error: "Сервіс тимчасово недоступний. Спробуйте пізніше." };
  }
  redirect("/admin");
}

export async function logout(): Promise<void> {
  await endSession();
  redirect("/admin");
}

// ---------------------------------------------------------------- leads

export async function changeLeadStatus(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = Number(str(formData.get("id")));
  const status = str(formData.get("status")) as LeadStatus;
  if (!STATUSES.includes(status) || !Number.isInteger(id)) return;
  await setLeadStatus(id, status);
  await audit(user, "Статус заявки", `#${id} → ${status}`);
  revalidatePath("/admin", "layout");
}

export async function addLeadNote(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  try {
    await addNote(Number(str(form.get("id"))), user.id, str(form.get("text")));
    await audit(user, "Нотатка до заявки", `#${str(form.get("id"))}`);
    revalidatePath("/admin", "layout");
    return { ok: "Нотатку додано." };
  } catch (err) {
    return fail(err);
  }
}

export async function removeLead(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  const id = Number(str(formData.get("id")));
  if (!Number.isInteger(id)) return;
  await deleteLead(id);
  await audit(user, "Видалено заявку", `#${id}`);
  redirect("/admin/leads");
}

// ---------------------------------------------------------------- prices and calculator

export async function savePricesAction(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireAdmin();
  const table = { EUR: {}, PLN: {} } as Record<string, Record<string, number>>;
  for (const c of CURRENCY_KEYS) for (const f of FUELS) table[c][f] = num(form.get(`${c}_${f}`));
  const parsed = parsePrices(table);
  if (!parsed) return { error: "Усі ціни мають бути числами від 0,01 до 100 000." };
  try {
    await writePrices(parsed, user.id);
    await audit(user, "Змінено ціни", JSON.stringify(parsed));
    publicChanged();
    return { ok: "Ціни збережено. Калькулятор на сайті оновлено." };
  } catch (err) {
    return fail(err);
  }
}

export async function saveCalculatorAction(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireAdmin();
  const fuelUse: Record<string, Record<string, number>> = {};
  const crops: Record<string, { start: number; target: number }> = {};
  for (const c of CROP_KEYS) {
    fuelUse[c] = {};
    for (const f of FUELS) fuelUse[c][f] = num(form.get(`use_${c}_${f}`));
    crops[c] = { start: num(form.get(`start_${c}`)), target: num(form.get(`target_${c}`)) };
  }
  const vat: Record<string, number> = {};
  for (const l of VAT_LANGS) vat[l] = num(form.get(`vat_${l}`)) / 100;

  const use = parseFuelUse(fuelUse);
  if (!use) return { error: "Витрата палива: числа від 0,001 до 1000." };
  const cr = parseCrops(crops);
  if (!cr) return { error: "Вологість: початкова 1–40%, цільова 1–25% і нижча за початкову." };
  const v = parseVat(vat);
  if (!v) return { error: "ПДВ: від 0 до 50%." };
  try {
    await writeSetting("fuelUse", use);
    await writeSetting("crops", cr);
    await writeSetting("vat", v);
    await audit(user, "Змінено параметри калькулятора", JSON.stringify({ use, cr, v }));
    publicChanged();
    return { ok: "Параметри калькулятора збережено." };
  } catch (err) {
    return fail(err);
  }
}

// ---------------------------------------------------------------- content

export async function saveContactsAction(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireAdmin();
  const parsed = parseContacts({
    phone: str(form.get("phone")),
    email: str(form.get("email")),
    officePhone: str(form.get("officePhone")),
    officeEmail: str(form.get("officeEmail")),
  });
  if (!parsed) return { error: "Перевірте телефони (цифри, +, пробіли) та адреси e-mail." };
  try {
    await writeSetting("contacts", parsed);
    await audit(user, "Змінено контакти", JSON.stringify(parsed));
    publicChanged();
    return { ok: "Контакти збережено." };
  } catch (err) {
    return fail(err);
  }
}

export async function saveTestimonialAction(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireAdmin();
  try {
    const idRaw = str(form.get("id"));
    const input = validateTestimonial({
      lang: str(form.get("lang")),
      quote: str(form.get("quote")),
      author: str(form.get("author")),
      role: str(form.get("role")),
      location: str(form.get("location")),
      visible: form.get("visible") === "on",
      sort: Number(str(form.get("sort")) || 0),
    });
    await saveTestimonial(idRaw ? Number(idRaw) : null, input);
    await audit(user, idRaw ? "Змінено відгук" : "Додано відгук", input.author);
    publicChanged();
    revalidatePath("/admin", "layout");
    return { ok: idRaw ? "Відгук збережено." : "Відгук додано." };
  } catch (err) {
    return fail(err);
  }
}

export async function removeTestimonial(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  const id = Number(str(formData.get("id")));
  if (!Number.isInteger(id)) return;
  await deleteTestimonial(id);
  await audit(user, "Видалено відгук", `#${id}`);
  publicChanged();
  revalidatePath("/admin", "layout");
}

export async function saveProjectAction(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireAdmin();
  try {
    const idRaw = str(form.get("id"));
    const input = validateProject({
      location_pl: str(form.get("location_pl")),
      location_en: str(form.get("location_en")),
      location_de: str(form.get("location_de")),
      location_uk: str(form.get("location_uk")),
      power_mw: str(form.get("power_mw")),
      fuel: str(form.get("fuel")),
      dryer: str(form.get("dryer")),
      per_day: str(form.get("per_day")),
      visible: form.get("visible") === "on",
      sort: Number(str(form.get("sort")) || 0),
    });
    await saveProject(idRaw ? Number(idRaw) : null, input);
    await audit(user, idRaw ? "Змінено проєкт" : "Додано проєкт", `${input.location_pl}, ${input.power_mw} МВт`);
    publicChanged();
    revalidatePath("/admin", "layout");
    return { ok: idRaw ? "Проєкт збережено." : "Проєкт додано." };
  } catch (err) {
    return fail(err);
  }
}

export async function removeProject(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  const id = Number(str(formData.get("id")));
  if (!Number.isInteger(id)) return;
  await deleteProject(id);
  await audit(user, "Видалено проєкт", `#${id}`);
  publicChanged();
  revalidatePath("/admin", "layout");
}

// ---------------------------------------------------------------- users

export async function createUserAction(_prev: FormState, form: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  try {
    const role = str(form.get("role")) === "admin" ? "admin" : "manager";
    const user = await createUser({ email: str(form.get("email")), name: str(form.get("name")), role, password: str(form.get("password")) });
    await audit(admin, "Створено користувача", `${user.email} (${role})`);
    revalidatePath("/admin", "layout");
    return { ok: `Користувача ${user.email} створено.` };
  } catch (err) {
    return fail(err);
  }
}

export async function toggleUserAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = Number(str(formData.get("id")));
  const active = str(formData.get("active")) === "1";
  if (!Number.isInteger(id)) return;
  if (id === admin.id && !active) return; // do not lock yourself out
  try {
    await setUserActive(id, active);
    await audit(admin, active ? "Увімкнено користувача" : "Вимкнено користувача", `#${id}`);
  } catch (err) {
    console.error(err);
  }
  revalidatePath("/admin", "layout");
}

export async function changeRoleAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = Number(str(formData.get("id")));
  const role = str(formData.get("role")) as Role;
  if (!Number.isInteger(id) || (role !== "admin" && role !== "manager")) return;
  try {
    await setUserRole(id, role);
    await audit(admin, "Змінено роль", `#${id} → ${role}`);
  } catch (err) {
    console.error(err);
  }
  revalidatePath("/admin", "layout");
}

export async function resetPasswordAction(_prev: FormState, form: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  try {
    await setUserPassword(Number(str(form.get("id"))), str(form.get("password")));
    await audit(admin, "Скинуто пароль", `#${str(form.get("id"))}`);
    return { ok: "Пароль змінено, користувача виведено з усіх пристроїв." };
  } catch (err) {
    return fail(err);
  }
}

export async function changeOwnPasswordAction(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  try {
    const db = await getDb();
    const rows = await db.query<{ password_hash: string }>("SELECT password_hash FROM users WHERE id = $1", [user.id]);
    if (!rows[0] || !(await verifyPassword(str(form.get("current")), rows[0].password_hash))) return { error: "Поточний пароль невірний." };
    if (str(form.get("password")) !== str(form.get("repeat"))) return { error: "Паролі не збігаються." };
    await setUserPassword(user.id, str(form.get("password")));
    await audit(user, "Змінено власний пароль");
  } catch (err) {
    return fail(err);
  }
  await endSession(); // every session, including this one, was invalidated
  redirect("/admin");
}
