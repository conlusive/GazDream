// Ordered, append-only schema migrations. Never edit an applied migration: add a new one.
// All tables are only ever touched from the server with the application's own connection;
// nothing here is exposed through any public API (no anon/authenticated roles, RLS enabled as defence in depth).
export const MIGRATIONS: { id: number; name: string; sql: string }[] = [
  {
    id: 1,
    name: "initial schema",
    sql: `
      CREATE TABLE users (
        id            SERIAL PRIMARY KEY,
        email         TEXT NOT NULL UNIQUE,
        name          TEXT NOT NULL,
        role          TEXT NOT NULL CHECK (role IN ('admin','manager')),
        password_hash TEXT NOT NULL,
        active        BOOLEAN NOT NULL DEFAULT TRUE,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE sessions (
        token_hash TEXT PRIMARY KEY,
        user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX sessions_user_idx ON sessions(user_id);

      CREATE TABLE login_attempts (
        key TEXT NOT NULL,
        at  TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX login_attempts_key_idx ON login_attempts(key, at);

      CREATE TABLE leads (
        id         SERIAL PRIMARY KEY,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        name       TEXT NOT NULL,
        contact    TEXT NOT NULL,
        message    TEXT NOT NULL DEFAULT '',
        model      TEXT NOT NULL DEFAULT '',
        calc       TEXT NOT NULL DEFAULT '',
        lang       TEXT NOT NULL DEFAULT '',
        page       TEXT NOT NULL DEFAULT '',
        source     TEXT NOT NULL DEFAULT 'contact' CHECK (source IN ('contact','quick','report')),
        status     TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','in_progress','closed','spam')),
        mailed     BOOLEAN NOT NULL DEFAULT FALSE,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX leads_created_idx ON leads(created_at DESC);
      CREATE INDEX leads_status_idx ON leads(status);

      CREATE TABLE lead_notes (
        id         SERIAL PRIMARY KEY,
        lead_id    INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        user_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
        text       TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX lead_notes_lead_idx ON lead_notes(lead_id);

      CREATE TABLE settings (
        key        TEXT PRIMARY KEY,
        value      JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE price_history (
        id         SERIAL PRIMARY KEY,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        user_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
        prices     JSONB NOT NULL
      );

      CREATE TABLE testimonials (
        id         SERIAL PRIMARY KEY,
        lang       TEXT NOT NULL DEFAULT 'all',
        quote      TEXT NOT NULL,
        author     TEXT NOT NULL,
        role       TEXT NOT NULL DEFAULT '',
        location   TEXT NOT NULL DEFAULT '',
        visible    BOOLEAN NOT NULL DEFAULT TRUE,
        sort       INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE audit_log (
        id         SERIAL PRIMARY KEY,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        user_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
        user_email TEXT NOT NULL DEFAULT '',
        action     TEXT NOT NULL,
        details    TEXT NOT NULL DEFAULT ''
      );
      CREATE INDEX audit_created_idx ON audit_log(created_at DESC);
    `,
  },
  {
    id: 2,
    name: "row level security, no public roles",
    sql: `
      ALTER TABLE users          ENABLE ROW LEVEL SECURITY;
      ALTER TABLE sessions       ENABLE ROW LEVEL SECURITY;
      ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
      ALTER TABLE leads          ENABLE ROW LEVEL SECURITY;
      ALTER TABLE lead_notes     ENABLE ROW LEVEL SECURITY;
      ALTER TABLE settings       ENABLE ROW LEVEL SECURITY;
      ALTER TABLE price_history  ENABLE ROW LEVEL SECURITY;
      ALTER TABLE testimonials   ENABLE ROW LEVEL SECURITY;
      ALTER TABLE audit_log      ENABLE ROW LEVEL SECURITY;

      -- Supabase exposes the public schema through anon/authenticated roles; take everything away from them.
      DO $$
      DECLARE r TEXT;
      BEGIN
        FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP
          IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
            EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA public FROM %I', r);
            EXECUTE format('REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM %I', r);
          END IF;
        END LOOP;
      END $$;
    `,
  },
  {
    id: 3,
    name: "rate limit hits",
    sql: `
      CREATE TABLE rate_hits (
        key TEXT NOT NULL,
        at  TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX rate_hits_key_idx ON rate_hits(key, at);
      ALTER TABLE rate_hits ENABLE ROW LEVEL SECURITY;
      DO $$
      DECLARE r TEXT;
      BEGIN
        FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP
          IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
            EXECUTE format('REVOKE ALL ON rate_hits FROM %I', r);
          END IF;
        END LOOP;
      END $$;
    `,
  },
];
