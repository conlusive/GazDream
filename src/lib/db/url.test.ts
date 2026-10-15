import { describe, expect, it } from "vitest";
import { normalizeDatabaseUrl } from "./url";

const GOOD = "postgresql://user:pass@ep-cool-123-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require";

describe("normalizeDatabaseUrl", () => {
  it("keeps a clean URL as is", () => expect(normalizeDatabaseUrl(GOOD)).toBe(GOOD));
  it("strips whitespace, quotes, a DATABASE_URL= prefix and a psql command", () => {
    expect(normalizeDatabaseUrl(`  ${GOOD}\n`)).toBe(GOOD);
    expect(normalizeDatabaseUrl(`'${GOOD}'`)).toBe(GOOD);
    expect(normalizeDatabaseUrl(`DATABASE_URL="${GOOD}"`)).toBe(GOOD);
    expect(normalizeDatabaseUrl(`psql '${GOOD}'`)).toBe(GOOD);
  });
  it("rejects values that are not a postgres URL with a readable message", () => {
    for (const bad of ["", "base", "https://example.com", "postgresql://", "postgresql://hostonly/db"]) {
      expect(() => normalizeDatabaseUrl(bad)).toThrow(/not a valid Postgres URL/);
    }
  });
});
