import "server-only";
import { cookies, headers } from "next/headers";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createSession, destroySession, userForSession, type User } from "@/lib/db/users";

export const ADMIN_COOKIE = "gd_admin";

export async function currentUser(): Promise<User | null> {
  await connection(); // always request-time: the session lookup must never be prerendered
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  try {
    return await userForSession(token);
  } catch (err) {
    console.error("Session lookup failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

/** For pages and actions that need a signed-in user. Pages send the visitor to the login screen. */
export async function requireUser(): Promise<User> {
  const user = await currentUser();
  if (!user) redirect("/admin");
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/admin");
  return user;
}

export async function startSession(userId: number) {
  const { token, expires } = await createSession(userId);
  (await cookies()).set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    expires,
  });
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (token) await destroySession(token).catch(() => {});
  jar.set(ADMIN_COOKIE, "", { httpOnly: true, sameSite: "strict", path: "/admin", maxAge: 0 });
}

export async function clientKey(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
