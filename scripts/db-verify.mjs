import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs/promises";
import assert from "node:assert/strict";
const db = new PGlite();
await db.exec(
  `create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to anon,authenticated,service_role;`,
);
await db.exec(
  `create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;grant usage on schema storage to authenticated;grant select,insert,delete on storage.objects to authenticated;`,
);
await db.exec(
  await fs.readFile("supabase/migrations/202610050001_tantre.sql", "utf8"),
);
await db.exec(
  await fs.readFile("supabase/migrations/202610050002_storage.sql", "utf8"),
);
await db.exec(
  await fs.readFile("supabase/migrations/202610050003_hardening.sql", "utf8"),
);
await db.exec(
  await fs.readFile(
    "supabase/migrations/202610050004_image_variants.sql",
    "utf8",
  ),
);
await db.exec(
  await fs.readFile("supabase/migrations/202610050005_agenda.sql", "utf8"),
);
await db.exec(
  await fs.readFile("supabase/migrations/202610050006_menu_seed.sql", "utf8"),
);
await db.exec(
  `update site_settings set value_json=value_json||'{"enabled":true,"capacity":4,"max_party_size":4,"advance_minutes":0}'::jsonb where key='booking_rules';update business_hours set active=true;`,
);
const day = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
const available = (
  await db.query(`select get_availability($1::date,2) as slots`, [day])
).rows[0].slots;
assert.ok(available.length > 0, "Slots materialized from business hours");
const base = {
  name: "Prueba SQL",
  email: "sql@example.test",
  phone: "+523300000000",
  date: day,
  slot_id: available[0].id,
  party_size: 2,
  terms: true,
};
const first = { ...base, idempotency_key: crypto.randomUUID() };
const create = async (payload) =>
  (
    await db.query(`select create_reservation($1::jsonb) as result`, [
      JSON.stringify(payload),
    ])
  ).rows[0].result;
const r = await create(first);
assert.equal(r.status, "confirmed");
assert.equal(
  (await create(first)).public_code,
  r.public_code,
  "Retry returns same reservation",
);
await create({ ...base, idempotency_key: crypto.randomUUID() });
await assert.rejects(
  () => create({ ...base, idempotency_key: crypto.randomUUID() }),
  /CAPACITY_CHANGED/,
);
assert.equal(
  Number(
    (
      await db.query(
        `select sum(party_size) as n from reservations where slot_id=$1`,
        [available[0].id],
      )
    ).rows[0].n,
  ),
  4,
);
const outbox = (
  await db.query("select payload from notification_outbox order by created_at")
).rows[0].payload;
await assert.rejects(
  () =>
    db.query("select reservation_by_token($1,$2,true)", [
      r.public_code,
      "bad-token",
    ]),
  /INVALID_LINK/,
);
await db.query("select reservation_by_token($1,$2,true)", [
  r.public_code,
  outbox.cancellation_token,
]);
assert.ok(
  (
    await db.query("select get_availability($1,2) as slots", [day])
  ).rows[0].slots.find((s) => s.id === available[0].id),
);
assert.equal(
  (await db.query("select take_rate_limit('unit',1,60) as ok")).rows[0].ok,
  true,
);
assert.equal(
  (await db.query("select take_rate_limit('unit',1,60) as ok")).rows[0].ok,
  false,
);
await db.exec(
  `update site_settings set value_json=jsonb_set(value_json,'{session_minutes}','90') where key='booking_rules';`,
);
await db.query("select get_availability($1,1)", [day]);
assert.equal(
  (
    await db.query(
      "select count(*)::int as n from reservation_slots a join reservation_slots b on a.id<b.id and a.starts_at<b.ends_at and a.ends_at>b.starts_at",
    )
  ).rows[0].n,
  0,
  "Duration change cannot overlap existing sessions",
);
await db.exec(`set role anon;`);
assert.ok(
  (await db.query("select * from catalog_categories")).rows.length > 0,
  "Published categories accessible to anonymous users",
);
await assert.rejects(() => db.query("select * from reservations"));
await assert.rejects(() =>
  db.query("select create_reservation($1::jsonb)", [JSON.stringify(first)]),
);
await db.exec("reset role");
const owner = crypto.randomUUID(),
  editor = crypto.randomUUID();
await db.query("insert into auth.users(id) values($1),($2)", [owner, editor]);
await db.query(
  "insert into profiles(id,display_name,role) values($1,'QA Owner','owner'),($2,'QA Editor','editor')",
  [owner, editor],
);
await db.query("select set_config('request.jwt.claim.sub',$1,false)", [owner]);
await db.exec("set role authenticated");
const agenda = (
  await db.query("select admin_agenda($1,7,'all',1,false,0) as result", [day])
).rows[0].result;
assert.equal(agenda.total, 2);
assert.equal(agenda.metrics.confirmed, 1);
assert.equal(
  (await db.query("select admin_slots() as result")).rows[0].result.find(
    (s) => s.id === available[0].id,
  ).booked,
  2,
);
await assert.rejects(
  () => db.query("select update_staff($1,'QA Owner','viewer',true)", [owner]),
  /KEEP_OWN_ACCESS/,
);
await db.query("select set_config('request.jwt.claim.sub',$1,false)", [editor]);
assert.equal(
  (await db.query("select id from reservations")).rows.length,
  0,
  "Editors cannot read reservations through RLS",
);
await assert.rejects(
  () => db.query("select admin_agenda($1,1,'all',1,false,0)", [day]),
  /FORBIDDEN/,
);
await assert.rejects(
  () => db.query("select update_staff($1,'QA Editor','owner',true)", [editor]),
  /FORBIDDEN/,
);
const category = (
  await db.query(
    "select id from catalog_categories where type='ceramic' limit 1",
  )
).rows[0].id;
const saved = (
  await db.query("select save_catalog_item($1,$2) as id", [
    JSON.stringify({
      type: "ceramic",
      category_id: category,
      slug: "qa-item",
      name: "Solo QA",
      short_desc: "Prueba",
      long_desc: "Prueba de aislamiento",
      price_cents: 10000,
      status: "available",
      published: true,
      sort_order: 1,
      asset: "ceramic-taza-clasica",
    }),
    JSON.stringify({
      dimensions: "8 cm",
      difficulty: "Libre",
      estimated_minutes: 60,
      shape_family: "taza",
    }),
  ])
).rows[0].id;
assert.ok(saved, "Editor can save catalog and its metadata atomically");
await db.query(
  "insert into storage.objects(bucket_id,name) values('tantre-media','qa.webp')",
);
await assert.rejects(() =>
  db.query(
    "insert into storage.objects(bucket_id,name) values('another-bucket','qa.webp')",
  ),
);
await db.exec(
  "reset role;select set_config('request.jwt.claim.sub','',false);set role anon",
);
assert.equal(
  (await db.query("select id from catalog_items where id=$1", [saved])).rows
    .length,
  1,
);
await db.exec("reset role");
await db.query("update catalog_categories set published=false where id=$1", [
  category,
]);
await db.exec("set role anon");
assert.equal(
  (await db.query("select id from catalog_items where id=$1", [saved])).rows
    .length,
  0,
  "Unpublished categories hide their items through direct REST/RLS",
);
await db.exec("reset role");
console.log(
  "PASS: SQL migrations, capacity, idempotency, cancellation, outbox, rate limit, anonymous isolation.",
);
console.log(
  "PGlite is single-connection. Run db:concurrency against PostgreSQL for multi-connection lock verification; the CI workflow includes it.",
);
await db.close();
