import { changeRoleAction, createUserAction, resetPasswordAction, toggleUserAction } from "../actions";
import ActionForm from "@/components/admin/ActionForm";
import { PageHeader, Section } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin-session";
import { listUsers, MIN_PASSWORD } from "@/lib/db/users";

export default async function UsersPage() {
  const me = await requireAdmin();
  const users = await listUsers();

  return (
    <div className="space-y-6">
      <PageHeader title="Користувачі" subtitle="Адміністратор бачить усе й змінює налаштування. Менеджер бачить лише заявки: може змінювати статуси та додавати нотатки." />

      <ul className="card divide-y divide-line">
        {users.map((u) => (
          <li key={u.id} className="grid gap-3 p-4 sm:p-5 md:grid-cols-[1fr_auto] md:items-center">
            <div className="min-w-0">
              <p className="font-bold">
                {u.name} {u.id === me.id && <span className="text-xs font-normal text-muted">(ви)</span>}
                {!u.active && <span className="ml-2 rounded bg-line px-2 py-0.5 text-xs font-bold text-muted">вимкнено</span>}
              </p>
              <p className="truncate text-sm text-muted">{u.email}</p>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <form action={changeRoleAction} className="flex items-center gap-2">
                <input type="hidden" name="id" value={u.id} />
                <select name="role" defaultValue={u.role} aria-label={`Роль: ${u.name}`} className="field select !w-auto !py-1.5 !text-sm">
                  <option value="admin">Адміністратор</option>
                  <option value="manager">Менеджер</option>
                </select>
                <button className="text-sm font-bold text-brand-green hover:underline">Змінити</button>
              </form>
              {u.id !== me.id && (
                <form action={toggleUserAction}>
                  <input type="hidden" name="id" value={u.id} />
                  <input type="hidden" name="active" value={u.active ? "0" : "1"} />
                  <button className="text-sm font-bold text-brand-green hover:underline">{u.active ? "Вимкнути доступ" : "Увімкнути доступ"}</button>
                </form>
              )}
            </div>
            <details className="md:col-span-2">
              <summary className="cursor-pointer text-sm font-bold text-brand-green">Скинути пароль</summary>
              <ActionForm action={resetPasswordAction} submit="Змінити пароль" small className="mt-3 max-w-sm">
                <input type="hidden" name="id" value={u.id} />
                <input name="password" type="password" autoComplete="new-password" minLength={MIN_PASSWORD} required placeholder={`Новий пароль (від ${MIN_PASSWORD} символів)`} aria-label={`Новий пароль: ${u.name}`} className="field !py-2 text-sm" />
              </ActionForm>
            </details>
          </li>
        ))}
      </ul>

      <Section title="Додати користувача">
        <ActionForm action={createUserAction} submit="Створити" resetOnSuccess className="grid gap-4 sm:grid-cols-2">
          <div><label className="mb-1 block text-sm font-bold" htmlFor="u-name">Ім&apos;я</label><input id="u-name" name="name" required maxLength={80} className="field" /></div>
          <div><label className="mb-1 block text-sm font-bold" htmlFor="u-email">E-mail (логін)</label><input id="u-email" name="email" type="email" required className="field" /></div>
          <div>
            <label className="mb-1 block text-sm font-bold" htmlFor="u-role">Роль</label>
            <select id="u-role" name="role" defaultValue="manager" className="field select"><option value="manager">Менеджер</option><option value="admin">Адміністратор</option></select>
          </div>
          <div><label className="mb-1 block text-sm font-bold" htmlFor="u-pass">Початковий пароль</label><input id="u-pass" name="password" type="password" autoComplete="new-password" minLength={MIN_PASSWORD} required className="field" /><p className="mt-1 text-xs text-muted">Від {MIN_PASSWORD} символів, літери й цифри. Передайте його людині безпечним способом.</p></div>
        </ActionForm>
      </Section>
    </div>
  );
}
