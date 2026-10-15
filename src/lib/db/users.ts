import "server-only";
import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { getDb } from "./index";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

export type Role = "admin" | "manager";
export type User = { id: number; email: string; name: string; role: Role; active: boolean; created_at: string };

export const MIN_PASSWORD = 10;
export const SESSION_DAYS = 7;
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOGIN_WINDOW_MINUTES = 15;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [kind, saltB64, hashB64] = stored.split("$");
  if (kind !== "scrypt" || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, "base64");
  const actual = await scrypt(password, Buffer.from(saltB64, "base64"), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export const normalizeEmail = (email: string) => email.trim().toLowerCase();
const isEmailLike = (v: string) => /^[^\s@]+@[^\s@]+$/.test(v) || v === "admin";

export function validatePassword(password: string): string | null {
  if (password.length < MIN_PASSWORD) return `Пароль має містити щонайменше ${MIN_PASSWORD} символів.`;
  if (!/[a-zA-Zа-яА-ЯіїєґІЇЄҐ]/.test(password) || !/\d/.test(password)) return "Пароль має містити літери та цифри.";
  return null;
}

export async function countUsers(): Promise<number> {
  const db = await getDb();
  return Number((await db.query<{ n: string }>("SELECT COUNT(*) AS n FROM users"))[0].n);
}

export async function listUsers(): Promise<User[]> {
  const db = await getDb();
  return db.query<User>("SELECT id, email, name, role, active, created_at FROM users ORDER BY id");
}

export async function createUser(input: { email: string; name: string; role: Role; password: string }): Promise<User> {
  const email = normalizeEmail(input.email);
  if (!isEmailLike(email)) throw new Error("Невірна адреса e-mail.");
  const problem = validatePassword(input.password);
  if (problem) throw new Error(problem);
  if (!input.name.trim()) throw new Error("Вкажіть ім'я.");
  const db = await getDb();
  const exists = await db.query("SELECT 1 FROM users WHERE email = $1", [email]);
  if (exists.length) throw new Error("Користувач із таким e-mail вже існує.");
  const rows = await db.query<User>(
    "INSERT INTO users (email, name, role, password_hash) VALUES ($1,$2,$3,$4) RETURNING id, email, name, role, active, created_at",
    [email, input.name.trim().slice(0, 80), input.role, await hashPassword(input.password)],
  );
  return rows[0];
}

export async function setUserActive(id: number, active: boolean) {
  const db = await getDb();
  if (!active) {
    const admins = await db.query<{ n: string }>("SELECT COUNT(*) AS n FROM users WHERE role='admin' AND active AND id <> $1", [id]);
    const target = await db.query<{ role: Role }>("SELECT role FROM users WHERE id = $1", [id]);
    if (target[0]?.role === "admin" && Number(admins[0].n) === 0) throw new Error("Не можна вимкнути останнього адміністратора.");
  }
  await db.query("UPDATE users SET active = $2 WHERE id = $1", [id, active]);
  if (!active) await db.query("DELETE FROM sessions WHERE user_id = $1", [id]);
}

export async function setUserPassword(id: number, password: string) {
  const problem = validatePassword(password);
  if (problem) throw new Error(problem);
  const db = await getDb();
  await db.query("UPDATE users SET password_hash = $2 WHERE id = $1", [id, await hashPassword(password)]);
  await db.query("DELETE FROM sessions WHERE user_id = $1", [id]); // sign out everywhere
}

export async function setUserRole(id: number, role: Role) {
  const db = await getDb();
  if (role !== "admin") {
    const admins = await db.query<{ n: string }>("SELECT COUNT(*) AS n FROM users WHERE role='admin' AND active AND id <> $1", [id]);
    if (Number(admins[0].n) === 0) throw new Error("Має лишитися хоча б один адміністратор.");
  }
  await db.query("UPDATE users SET role = $2 WHERE id = $1", [id, role]);
}

// ---- login rate limiting (stored in the database, so it holds across server instances)

export async function loginBlocked(keys: string[]): Promise<boolean> {
  const db = await getDb();
  for (const key of keys) {
    const rows = await db.query<{ n: string }>(
      `SELECT COUNT(*) AS n FROM login_attempts WHERE key = $1 AND at > now() - ($2 || ' minutes')::interval`,
      [key, String(LOGIN_WINDOW_MINUTES)],
    );
    if (Number(rows[0].n) >= MAX_LOGIN_ATTEMPTS) return true;
  }
  return false;
}

export async function recordFailedLogin(keys: string[]) {
  const db = await getDb();
  for (const key of keys) await db.query("INSERT INTO login_attempts (key) VALUES ($1)", [key]);
  await db.query("DELETE FROM login_attempts WHERE at < now() - interval '1 day'");
}

export async function clearFailedLogins(keys: string[]) {
  const db = await getDb();
  for (const key of keys) await db.query("DELETE FROM login_attempts WHERE key = $1", [key]);
}

// ---- credentials and sessions

/**
 * Checks e-mail and password. When there are no users yet, ADMIN_EMAIL/ADMIN_PASSWORD from the
 * environment can create the first administrator (this runs only while the users table is empty).
 */
export async function authenticate(emailInput: string, password: string, env: Record<string, string | undefined> = process.env): Promise<User | null> {
  const email = normalizeEmail(emailInput);
  const db = await getDb();

  if ((await countUsers()) === 0 && env.ADMIN_PASSWORD) {
    const bootEmail = normalizeEmail(env.ADMIN_EMAIL ?? "admin");
    if (email === bootEmail && password === env.ADMIN_PASSWORD) {
      const password0 = env.ADMIN_PASSWORD;
      const rows = await db.query<User>(
        "INSERT INTO users (email, name, role, password_hash) VALUES ($1,$2,'admin',$3) RETURNING id, email, name, role, active, created_at",
        [bootEmail, "Адміністратор", await hashPassword(password0)],
      );
      return rows[0];
    }
  }

  const rows = await db.query<User & { password_hash: string }>("SELECT * FROM users WHERE email = $1", [email]);
  const user = rows[0];
  // Always do the hashing work so timing does not reveal whether the e-mail exists.
  const ok = await verifyPassword(password, user?.password_hash ?? "scrypt$AAAAAAAAAAAAAAAAAAAAAA==$AAAA");
  if (!user || !ok || !user.active) return null;
  const { password_hash: _ignored, ...safe } = user;
  void _ignored;
  return safe;
}

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function createSession(userId: number): Promise<{ token: string; expires: Date }> {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const db = await getDb();
  await db.query("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1,$2,$3)", [hashToken(token), userId, expires.toISOString()]);
  await db.query("DELETE FROM sessions WHERE expires_at < now()");
  return { token, expires };
}

export async function userForSession(token: string): Promise<User | null> {
  if (!token || token.length > 200) return null;
  const db = await getDb();
  const rows = await db.query<User>(
    `SELECT u.id, u.email, u.name, u.role, u.active, u.created_at
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = $1 AND s.expires_at > now() AND u.active`,
    [hashToken(token)],
  );
  return rows[0] ?? null;
}

export async function destroySession(token: string) {
  const db = await getDb();
  await db.query("DELETE FROM sessions WHERE token_hash = $1", [hashToken(token)]);
}
