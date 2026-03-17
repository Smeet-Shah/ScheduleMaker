import { sql } from "@vercel/postgres";

export { sql };

// Ensure tables exist in the connected Postgres/Neon database.
async function ensureSchema() {
  // Required for gen_random_uuid() on Neon/Postgres
  await sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`;

  await sql`
    CREATE TABLE IF NOT EXISTS events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      description TEXT,
      host_email TEXT,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      day_start_time TIME NOT NULL,
      day_end_time TIME NOT NULL,
      slot_duration_minutes INTEGER NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS participants (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      timezone TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS availabilities (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
      slot_start TIMESTAMPTZ NOT NULL,
      slot_end TIMESTAMPTZ NOT NULL,
      UNIQUE (event_id, participant_id, slot_start)
    );
  `;
}

// Kick off schema creation once per serverless process.
// This runs on first import in each Vercel function instance.
// eslint-disable-next-line @typescript-eslint/no-floating-promises
ensureSchema();

