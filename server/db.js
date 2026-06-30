import pg from "pg";

const { Pool } = pg;

// Credentials come from environment only — never hardcoded.
// Local: `node --env-file=.env server/index.js` (see .env, gitignored)
// Render: set PGHOST/PGUSER/PGPASSWORD/PGDATABASE/PGPORT in dashboard.
// pg reads PG* env vars natively; DATABASE_URL (url-encoded) also supported.
const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 5 })
  : new Pool({ ssl: { rejectUnauthorized: false }, max: 5 });

// Query helper
export async function query(text, params) {
  return pool.query(text, params);
}

// Schema init — runs once at startup
export async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id          SERIAL PRIMARY KEY,
      email       TEXT UNIQUE NOT NULL,
      name        TEXT NOT NULL,
      pass_hash   TEXT NOT NULL,
      pass_salt   TEXT NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id           SERIAL PRIMARY KEY,
      user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      number       TEXT NOT NULL,
      client_name  TEXT NOT NULL,
      client_email TEXT,
      issue_date   TEXT NOT NULL,
      due_date     TEXT,
      items        JSONB NOT NULL DEFAULT '[]',
      notes        TEXT,
      currency     TEXT NOT NULL DEFAULT 'IDR',
      status       TEXT NOT NULL DEFAULT 'unpaid',
      created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS bio_pages (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      slug        TEXT UNIQUE NOT NULL,
      title       TEXT NOT NULL,
      bio         TEXT,
      theme       TEXT NOT NULL DEFAULT 'aurora',
      links       JSONB NOT NULL DEFAULT '[]',
      views       INTEGER NOT NULL DEFAULT 0,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS habits (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name        TEXT NOT NULL,
      color       TEXT NOT NULL DEFAULT 'violet',
      icon        TEXT NOT NULL DEFAULT 'target',
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS habit_logs (
      id          SERIAL PRIMARY KEY,
      habit_id    INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
      date        TEXT NOT NULL,
      UNIQUE(habit_id, date)
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token       TEXT PRIMARY KEY,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

export default { query, initSchema };
