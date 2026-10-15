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
  {
    id: 4,
    name: "projects (installations shown on the site)",
    sql: `
      CREATE TABLE projects (
        id          SERIAL PRIMARY KEY,
        location_pl TEXT NOT NULL DEFAULT '',
        location_en TEXT NOT NULL DEFAULT '',
        location_de TEXT NOT NULL DEFAULT '',
        location_uk TEXT NOT NULL DEFAULT '',
        power_mw    TEXT NOT NULL,
        fuel        TEXT NOT NULL DEFAULT 'chips' CHECK (fuel IN ('chips','moist')),
        dryer       TEXT NOT NULL DEFAULT '',
        per_day     TEXT NOT NULL DEFAULT '',
        visible     BOOLEAN NOT NULL DEFAULT TRUE,
        sort        INTEGER NOT NULL DEFAULT 0,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
      DO $$
      DECLARE r TEXT;
      BEGIN
        FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP
          IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
            EXECUTE format('REVOKE ALL ON projects FROM %I', r);
            EXECUTE format('REVOKE ALL ON SEQUENCE projects_id_seq FROM %I', r);
          END IF;
        END LOOP;
      END $$;
      INSERT INTO projects (location_pl, location_en, location_de, location_uk, power_mw, fuel, dryer, per_day, sort) VALUES
        ('Obwód sumski, Ukraina', 'Sumy region, Ukraine', 'Region Sumy, Ukraine', 'Сумська область, Україна', '5,0', 'moist', '', '180–240', 10),
        ('Obwód kijowski, Ukraina', 'Kyiv region, Ukraine', 'Region Kiew, Ukraine', 'Київська область, Україна', '5,0', 'chips', 'Comil', '350–400', 20),
        ('Obwód kijowski, Ukraina', 'Kyiv region, Ukraine', 'Region Kiew, Ukraine', 'Київська область, Україна', '6,0', 'chips', 'GSI-9000', '600', 30),
        ('Obwód czerniowiecki, Ukraina', 'Chernivtsi region, Ukraine', 'Region Czernowitz, Ukraine', 'Чернівецька область, Україна', '4,0', 'chips', 'Sukup', '400', 40),
        ('Katowice, Polska', 'Katowice, Poland', 'Kattowitz, Polen', 'Катовіце, Польща', '2,5', 'chips', '', '', 50),
        ('Obwód chmielnicki, Ukraina', 'Khmelnytskyi region, Ukraine', 'Region Chmelnyzkyj, Ukraine', 'Хмельницька область, Україна', '5,0', 'chips', '', '', 60);
    `,
  },
  {
    id: 5,
    name: "lead handling: assignee, next contact, outcome, history",
    sql: `
      -- 'closed' is replaced by the two outcomes a closed lead can have.
      ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;
      UPDATE leads SET status = 'lost' WHERE status = 'closed';
      ALTER TABLE leads ADD CONSTRAINT leads_status_check CHECK (status IN ('new','in_progress','won','lost','spam'));

      ALTER TABLE leads ADD COLUMN assignee_id   INTEGER REFERENCES users(id) ON DELETE SET NULL;
      ALTER TABLE leads ADD COLUMN next_contact  DATE;
      ALTER TABLE leads ADD COLUMN deal_value    NUMERIC(14,2) CHECK (deal_value IS NULL OR deal_value >= 0);
      ALTER TABLE leads ADD COLUMN deal_currency TEXT NOT NULL DEFAULT 'EUR' CHECK (deal_currency IN ('EUR','PLN'));
      ALTER TABLE leads ADD COLUMN lost_reason   TEXT NOT NULL DEFAULT '';
      CREATE INDEX leads_assignee_idx ON leads(assignee_id);
      CREATE INDEX leads_next_contact_idx ON leads(next_contact) WHERE next_contact IS NOT NULL;

      CREATE TABLE lead_events (
        id         SERIAL PRIMARY KEY,
        lead_id    INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        user_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
        kind       TEXT NOT NULL CHECK (kind IN ('status','assignee','followup','result')),
        from_value TEXT NOT NULL DEFAULT '',
        to_value   TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX lead_events_lead_idx ON lead_events(lead_id, created_at);
      ALTER TABLE lead_events ENABLE ROW LEVEL SECURITY;
      DO $$
      DECLARE r TEXT;
      BEGIN
        FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP
          IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
            EXECUTE format('REVOKE ALL ON lead_events FROM %I', r);
            EXECUTE format('REVOKE ALL ON SEQUENCE lead_events_id_seq FROM %I', r);
          END IF;
        END LOOP;
      END $$;
    `,
  },
];
