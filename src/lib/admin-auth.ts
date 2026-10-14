import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "gd_admin";
const TTL_SECONDS = 8 * 60 * 60;

const secret = () => {
  const s = process.env.ADMIN_SESSION_SECRET;
  return s && s.length >= 32 ? s : null;
};

export const adminConfigured = () => Boolean(process.env.ADMIN_PASSWORD && secret());

const sign = (payload: string, key: string) => createHmac("sha256", key).update(payload).digest("hex");
const sha = (v: string) => createHash("sha256").update(v).digest();

const safeEqual = (a: Buffer, b: Buffer) => a.length === b.length && timingSafeEqual(a, b);

export function checkPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  return Boolean(expected) && safeEqual(sha(input), sha(expected as string));
}

const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/admin",
  maxAge,
});

export async function startSession(): Promise<void> {
  const key = secret();
  if (!key) throw new Error("ADMIN_SESSION_SECRET is not configured");
  const expires = String(Math.floor(Date.now() / 1000) + TTL_SECONDS);
  (await cookies()).set(COOKIE, `${expires}.${sign(expires, key)}`, cookieOptions(TTL_SECONDS));
}

export async function endSession(): Promise<void> {
  (await cookies()).set(COOKIE, "", cookieOptions(0));
}

export async function isAdmin(): Promise<boolean> {
  const key = secret();
  const value = (await cookies()).get(COOKIE)?.value;
  if (!key || !value) return false;
  const [expires, mac] = value.split(".");
  if (!expires || !mac) return false;
  if (!safeEqual(Buffer.from(mac), Buffer.from(sign(expires, key)))) return false;
  return Number(expires) > Math.floor(Date.now() / 1000);
}
