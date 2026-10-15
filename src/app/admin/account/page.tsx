import { changeOwnPasswordAction } from "../actions";
import ActionForm from "@/components/admin/ActionForm";
import { PageHeader, Section } from "@/components/admin/ui";
import { requireUser } from "@/lib/admin-session";
import { MIN_PASSWORD } from "@/lib/db/users";

export default async function AccountPage() {
  const user = await requireUser();
  return (
    <div className="max-w-xl space-y-6">
      <PageHeader title="Мій обліковий запис" subtitle={`${user.name} · ${user.email} · ${user.role === "admin" ? "Адміністратор" : "Менеджер"}`} />
      <Section title="Змінити пароль">
        <ActionForm action={changeOwnPasswordAction} submit="Змінити пароль" pendingLabel="Зміна…" className="space-y-4">
          <div><label className="mb-1 block text-sm font-bold" htmlFor="cur">Поточний пароль</label><input id="cur" name="current" type="password" autoComplete="current-password" required className="field" /></div>
          <div><label className="mb-1 block text-sm font-bold" htmlFor="new">Новий пароль</label><input id="new" name="password" type="password" autoComplete="new-password" minLength={MIN_PASSWORD} required className="field" /></div>
          <div><label className="mb-1 block text-sm font-bold" htmlFor="rep">Повторіть новий пароль</label><input id="rep" name="repeat" type="password" autoComplete="new-password" required className="field" /></div>
          <p className="text-xs text-muted">Після зміни вас буде виведено з усіх пристроїв, і потрібно увійти знову.</p>
        </ActionForm>
      </Section>
    </div>
  );
}
