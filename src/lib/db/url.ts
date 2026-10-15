/**
 * Cleans up a DATABASE_URL pasted into a hosting dashboard: surrounding spaces/quotes, a leading
 * `DATABASE_URL=` or `psql ` (Neon's "connection string" tab copies it that way).
 * Throws a clear message when the result is still not a postgres URL. Without this, `pg` silently resolves
 * a malformed value against the host "base" and the only symptom is `getaddrinfo ENOTFOUND base`.
 */
export function normalizeDatabaseUrl(raw: string): string {
  let url = raw.trim();
  url = url.replace(/^(export\s+)?DATABASE_URL\s*=\s*/i, "").replace(/^psql\s+/i, "").trim();
  url = url.replace(/^(['"`])([\s\S]*)\1$/, "$2").trim();
  if (!/^postgres(ql)?:\/\/[^\s/]+@[^\s/]+/i.test(url)) {
    throw new Error("DATABASE_URL is not a valid Postgres URL: expected postgresql://user:password@host/dbname (check for extra text or quotes).");
  }
  return url;
}
