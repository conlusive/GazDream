import { changeRoleAction, createUserAction, resetPasswordAction, toggleUserAction } from "../actions";
import ActionForm from "@/components/admin/ActionForm";
import { requireAdmin } from "@/lib/admin-session";
import { formatDate } from "@/lib/admin-format";
import { listUsers, MIN_PASSWORD } from "@/lib/db/users";

export default async function UsersPage() {
  const me = await requireAdmin();
  const users = await listUsers();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Користувачі</h1>
        <p className="text-muted">Адміністратор бачить усе й змінює налаштування. Менеджер бачить лише заявки й може змінювати їхні статуси та додавати нотатки.</p>
      </div>

      <section className="card overflow-x-auto">
        <table className="w-full min-w-[44rem] text-left text-sm">
          <thead className="border-b border-line text-muted">
            <tr><th className="p-4 font-semibold">Користувач</th><th className="p-4 font-semibold">Роль</th><th className="p-4 font-semibold">Створено</th><th className="p-4 font-semibold">Дії</th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-line align-top last:border-0">
                <td className="p-4">
                  <strong>{u.name}</strong> {u.id === me.id && <span className="text-xs text-muted">(ви)</span>}
                  <span className="block text-xs text-muted">{u.email}</span>
                  {!u.active && <span className="mt-1 inline-block rounded bg-line px-2 py-0.5 text-xs font-bold">вимкнено</span>}
                </td>
                <td className="p-4">
                  <form action={changeRoleAction} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={u.id} />
                    <select name="role" defaultValue={u.role} aria-label={`Роль: ${u.name}`} className="field !py-1.5 !text-sm">
                      <option value="admin">Адміністратор</option>
                      <option value="manager">Менеджер</option>
                    </select>
                    <button className="text-xs font-bold text-brand-green hover:underline">Змінити</button>
                  </form>
                </td>
                <td className="tabular whitespace-nowrap p-4 text-muted">{formatDate(u.created_at)}</td>
                <td className="space-y-3 p-4">
                  {u.id !== me.id && (
                    <form action={toggleUserAction}>
                      <input type="hidden" name="id" value={u.id} />
                      <input type="hidden" name="active" value={u.active ? "0" : "1"} />
                      <button className="text-xs font-bold text-brand-green hover:underline">{u.active ? "Вимкнути доступ" : "Увімкнути доступ"}</button>
                    </form>
                  )}
                  <details>
                    <summary className="cursor-pointer text-xs font-bold text-brand-green">Скинути пароль</summary>
                    <ActionForm action={resetPasswordAction} submit="Змінити пароль" small className="mt-2">
                      <input type="hidden" name="id" value={u.id} />
                      <input name="password" type="password" autoComplete="new-password" minLength={MIN_PASSWORD} required placeholder={`Новий пароль (від ${MIN_PASSWORD} символів)`} aria-label={`Новий пароль: ${u.name}`} className="field !py-2 text-sm" />
                    </ActionForm>
                  </details>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="mb-4 text-lg font-extrabold">Додати користувача</h2>
        <ActionForm action={createUserAction} submit="Створити" resetOnSuccess className="grid gap-4 sm:grid-cols-2">
          <div><label className="mb-1 block text-sm font-bold" htmlFor="u-name">Ім&apos;я</label><input id="u-name" name="name" required maxLength={80} className="field" /></div>
          <div><label className="mb-1 block text-sm font-bold" htmlFor="u-email">E-mail (логін)</label><input id="u-email" name="email" type="email" required className="field" /></div>
          <div>
            <label className="mb-1 block text-sm font-bold" htmlFor="u-role">Роль</label>
            <select id="u-role" name="role" defaultValue="manager" className="field"><option value="manager">Менеджер</option><option value="admin">Адміністратор</option></select>
          </div>
          <div><label className="mb-1 block text-sm font-bold" htmlFor="u-pass">Початковий пароль</label><input id="u-pass" name="password" type="password" autoComplete="new-password" minLength={MIN_PASSWORD} required className="field" /><p className="mt-1 text-xs text-muted">Від {MIN_PASSWORD} символів, літери й цифри. Передайте його людині безпечним способом.</p></div>
        </ActionForm>
      </section>
    </div>
  );
}
