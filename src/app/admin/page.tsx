import { connection } from "next/server";
import { Suspense } from "react";
import LoginForm from "@/components/admin/LoginForm";
import PricesForm from "@/components/admin/PricesForm";
import { adminConfigured, isAdmin } from "@/lib/admin-auth";
import { readPrices } from "@/lib/prices";

async function AdminContent() {
  // Env vars must be read per request, not frozen into the build-time shell.
  await connection();
  if (!adminConfigured()) {
    return (
      <p className="rounded-lg bg-white p-6">
        Адмінку не налаштовано: задайте змінні середовища <code>ADMIN_PASSWORD</code> та{" "}
        <code>ADMIN_SESSION_SECRET</code> (мінімум 32 символи).
      </p>
    );
  }
  if (!(await isAdmin())) return <LoginForm />;
  return <PricesForm prices={await readPrices()} />;
}

export default function AdminPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">Ціни палива для калькулятора</h1>
      <Suspense fallback={<p>Завантаження…</p>}>
        <AdminContent />
      </Suspense>
    </main>
  );
}
