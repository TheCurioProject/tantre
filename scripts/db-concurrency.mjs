import pg from "pg";
import fs from "node:fs/promises";
import assert from "node:assert/strict";
const connectionString = process.env.TEST_DATABASE_URL;
if (
  !connectionString ||
  !/_test$|_ci$/.test(new URL(connectionString).pathname)
)
  throw new Error(
    "Use TEST_DATABASE_URL pointing to a dedicated empty database ending in _test or _ci.",
  );
const pool = new pg.Pool({ connectionString, max: 20 });
try {
  const tables = await pool.query(
    "select tablename from pg_tables where schemaname='public'",
  );
  assert.equal(
    tables.rowCount,
    0,
    "Refusing to run against a nonempty database",
  );
  await pool.query(`create role anon;create role authenticated;create role service_role bypassrls;
 create schema auth;create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth to anon,authenticated,service_role;
 create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;`);
  for (const file of (await fs.readdir("supabase/migrations")).sort())
    await pool.query(await fs.readFile(`supabase/migrations/${file}`, "utf8"));
  await pool.query(
    `update site_settings set value_json=value_json||'{"enabled":true,"capacity":6,"max_party_size":6,"advance_minutes":0}'::jsonb where key='booking_rules';update business_hours set active=true;`,
  );
  const date = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
  const slots = (
    await pool.query("select get_availability($1,2) as slots", [date])
  ).rows[0].slots;
  const create = (slot, key = crypto.randomUUID()) =>
    pool.query("select create_reservation($1::jsonb) as reservation", [
      JSON.stringify({
        name: "Concurrent QA",
        email: "qa@example.test",
        phone: "+523300000000",
        date,
        slot_id: slot,
        party_size: 2,
        terms: true,
        idempotency_key: key,
      }),
    ]);
  const results = await Promise.allSettled(
    Array.from({ length: 20 }, () => create(slots[0].id)),
  );
  assert.equal(
    results.filter((r) => r.status === "fulfilled").length,
    3,
    "Only 3 groups of 2 fit",
  );
  assert.ok(
    results
      .filter((r) => r.status === "rejected")
      .every((r) => r.reason.message.includes("CAPACITY_CHANGED")),
  );
  const key = crypto.randomUUID();
  const retries = await Promise.all(
    Array.from({ length: 10 }, () => create(slots[1].id, key)),
  );
  assert.equal(
    new Set(retries.map((r) => r.rows[0].reservation.public_code)).size,
    1,
    "Concurrent retries share one reservation",
  );
  assert.equal(
    (
      await pool.query(
        "select count(*)::int as n from reservations where idempotency_key=$1",
        [key],
      )
    ).rows[0].n,
    1,
  );
  console.log(
    "PASS PostgreSQL: 20 simultaneous bookings respect capacity; 10 simultaneous retries create one reservation.",
  );
} finally {
  await pool.end();
}
