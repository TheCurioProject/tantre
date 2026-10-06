-- TANTRE V1. Apply in a new Supabase project. All sensitive RPCs are server-only.
create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default '', role text not null check (role in ('owner','manager','editor','viewer')), active boolean not null default true
);
create or replace function public.staff_role() returns text language sql stable security definer set search_path=public as $$ select role from profiles where id=auth.uid() and active $$;
create table public.catalog_categories (id uuid primary key default gen_random_uuid(), type text not null check(type in ('ceramic','cafe')), slug text not null, title text not null, sort_order integer not null default 0, published boolean not null default false, unique(type,slug), unique(id,type));
create table public.catalog_items (
 id uuid primary key default gen_random_uuid(), type text not null check(type in ('ceramic','cafe')), category_id uuid not null,
 slug text not null, name text not null, short_desc text not null default '', long_desc text not null default '', price_cents integer not null check(price_cents>=0),
 status text not null default 'available' check(status in ('available','low_stock','unavailable','seasonal')),
 published boolean not null default false, sort_order integer not null default 0, asset text not null,
 availability_updated_at timestamptz not null default now(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(type,slug), foreign key(category_id,type) references catalog_categories(id,type)
);
create table public.ceramic_meta(item_id uuid primary key references catalog_items on delete cascade, dimensions text not null default '', difficulty text not null default '', estimated_minutes integer check(estimated_minutes>0), shape_family text not null default '');
create table public.cafe_meta(item_id uuid primary key references catalog_items on delete cascade, temperature text not null default '', caffeine boolean not null default false, dietary_tags text[] not null default '{}', allergens text[] not null default '{}', alcohol_note text not null default '');
create table public.catalog_media(id uuid primary key default gen_random_uuid(), item_id uuid not null references catalog_items on delete cascade, storage_path text not null, alt text not null check(length(trim(alt))>0), width integer not null check(width>0), height integer not null check(height>0), sort_order integer not null default 0);
create table public.media_assets(id uuid primary key default gen_random_uuid(), storage_path text not null unique, alt text not null check(length(trim(alt))>0), width integer not null, height integer not null, mime text not null check(mime in ('image/webp','image/jpeg','image/png','image/avif')), bytes integer not null check(bytes<=2097152), created_at timestamptz not null default now());
create table public.gallery_entries(id uuid primary key default gen_random_uuid(), storage_path text not null references media_assets(storage_path), alt text not null check(length(trim(alt))>0), caption text not null default '', sort_order integer not null default 0, published boolean not null default false);
create table public.packages(id uuid primary key default gen_random_uuid(), slug text not null unique, title text not null, description text not null default '', min_people integer not null check(min_people>0), max_people integer not null, price_cents integer check(price_cents>=0), published boolean not null default false, check(max_people>=min_people));
create table public.faqs(id uuid primary key default gen_random_uuid(), category text not null default '', question text not null, answer text not null, sort_order integer not null default 0, published boolean not null default false);
create table public.testimonials(id uuid primary key default gen_random_uuid(), name text not null, handle text not null default '', quote text not null, consent_confirmed boolean not null default false, published boolean not null default false, check(not published or consent_confirmed));
create table public.business_hours(weekday integer primary key check(weekday between 0 and 6), open_time time not null, close_time time not null, pickup_close_time time not null, active boolean not null default false, check(close_time>open_time));
create table public.schedule_exceptions(date date primary key, closed boolean not null default true, open_time time, close_time time, reason text not null default '', check(closed or (open_time is not null and close_time is not null and close_time>open_time)));
create table public.site_settings(key text primary key, value_json jsonb not null, public boolean not null default false);
create table public.reservation_slots(id uuid primary key default gen_random_uuid(), starts_at timestamptz not null unique, ends_at timestamptz not null, capacity integer not null check(capacity>=0), blocked boolean not null default false, check(ends_at>starts_at));
create table public.reservations(
 id uuid primary key default gen_random_uuid(), public_code text not null unique,
 slot_id uuid not null references reservation_slots, name text not null, email text not null, phone text not null,
 party_size integer not null check(party_size>0 and party_size<=30), celebration text not null default '', notes text not null default '',
 status text not null default 'confirmed' check(status in ('pending','confirmed','cancelled','completed','no_show')),
 idempotency_key uuid not null unique, terms_version text not null, terms_accepted_at timestamptz not null default now(),
 cancellation_hash text not null, created_at timestamptz not null default now()
);
create table public.notification_outbox(id uuid primary key default gen_random_uuid(), reservation_id uuid not null references reservations on delete cascade, kind text not null, payload jsonb not null, attempts integer not null default 0, available_at timestamptz not null default now(), locked_until timestamptz, sent_at timestamptz, last_error text, created_at timestamptz not null default now(), unique(reservation_id,kind));
create table public.audit_log(id uuid primary key default gen_random_uuid(), actor_id uuid, action text not null, entity text not null, entity_id text, before_json jsonb, after_json jsonb, created_at timestamptz not null default now());
create table public.rate_limits(key text primary key, count integer not null, reset_at timestamptz not null);
create index on catalog_items(published,type,category_id,sort_order);
create index on reservations(slot_id,status);
create index on reservation_slots(starts_at);
create index on notification_outbox(available_at) where sent_at is null;

-- Permission checks are performed in DB as well as in the Worker.
alter table profiles enable row level security;
create policy self_profile on profiles for select to authenticated using (id=auth.uid() or staff_role()='owner');
create policy owner_profiles on profiles for all to authenticated using(staff_role()='owner') with check(staff_role()='owner');
do $$ declare t text; begin
 foreach t in array array['catalog_categories','catalog_items','packages','faqs','testimonials','gallery_entries'] loop
 execute format('alter table %I enable row level security',t);
 execute format('create policy published_read on %I for select to anon,authenticated using(published or staff_role() in (''owner'',''manager'',''editor'',''viewer''))',t);
 execute format('create policy content_write on %I for all to authenticated using(staff_role() in (''owner'',''manager'',''editor'')) with check(staff_role() in (''owner'',''manager'',''editor''))',t);
 end loop;
 foreach t in array array['ceramic_meta','cafe_meta','catalog_media'] loop
 execute format('alter table %I enable row level security',t);
 execute format('create policy related_read on %I for select to anon,authenticated using(exists(select 1 from catalog_items i where i.id=item_id and i.published) or staff_role() is not null)',t);
 execute format('create policy related_write on %I for all to authenticated using(staff_role() in (''owner'',''manager'',''editor'')) with check(staff_role() in (''owner'',''manager'',''editor''))',t);
 end loop;
 foreach t in array array['business_hours','schedule_exceptions','reservation_slots','reservations'] loop
 execute format('alter table %I enable row level security',t);
 execute format('create policy operations_read on %I for select to authenticated using(staff_role() in (''owner'',''manager'',''viewer''))',t);
 execute format('create policy operations_write on %I for all to authenticated using(staff_role() in (''owner'',''manager'')) with check(staff_role() in (''owner'',''manager''))',t);
 end loop;
end $$;
alter table media_assets enable row level security;
create policy staff_media on media_assets for all to authenticated using(staff_role() in ('owner','manager','editor')) with check(staff_role() in ('owner','manager','editor'));
alter table site_settings enable row level security;
create policy settings_read on site_settings for select to anon,authenticated using(public or staff_role() in ('owner','manager'));
create policy settings_write on site_settings for all to authenticated using(staff_role() in ('owner','manager')) with check(staff_role() in ('owner','manager'));
alter table audit_log enable row level security;
create policy audit_read on audit_log for select to authenticated using(staff_role() in ('owner','manager'));
alter table notification_outbox enable row level security;
alter table rate_limits enable row level security;

create or replace function audit_change() returns trigger language plpgsql security definer set search_path=public as $$
declare before_data jsonb; after_data jsonb; begin
 before_data:=case when TG_OP<>'INSERT' then to_jsonb(old) else null end;
 after_data:=case when TG_OP<>'DELETE' then to_jsonb(new) else null end;
 if TG_TABLE_NAME='reservations' then
 before_data:=before_data - array['name','email','phone','notes','celebration','cancellation_hash','idempotency_key'];
 after_data:=after_data - array['name','email','phone','notes','celebration','cancellation_hash','idempotency_key'];
 end if;
 insert into audit_log(actor_id,action,entity,entity_id,before_json,after_json) values(auth.uid(),TG_OP,TG_TABLE_NAME,coalesce(after_data->>'id',before_data->>'id',after_data->>'key',after_data->>'date'),before_data,after_data);
 return coalesce(new,old);
end $$;
do $$ declare t text; begin foreach t in array array['catalog_items','catalog_categories','business_hours','schedule_exceptions','site_settings','reservations','profiles'] loop execute format('create trigger audit after insert or update or delete on %I for each row execute function audit_change()',t); end loop; end $$;

create or replace function take_rate_limit(p_key text,p_limit integer,p_seconds integer) returns boolean language plpgsql security definer set search_path=public as $$
declare n integer; begin
 insert into rate_limits(key,count,reset_at) values(p_key,1,now()+make_interval(secs=>p_seconds))
 on conflict(key) do update set count=case when rate_limits.reset_at<=now() then 1 else rate_limits.count+1 end, reset_at=case when rate_limits.reset_at<=now() then now()+make_interval(secs=>p_seconds) else rate_limits.reset_at end returning count into n;
 return n<=p_limit;
end $$;

create or replace function get_availability(p_date date,p_party_size integer) returns jsonb language plpgsql security definer set search_path=public as $$
declare rules jsonb; h record; ex record; start_t time; end_t time; t timestamptz; ending timestamptz; duration integer; result jsonb;
begin
 select value_json into rules from site_settings where key='booking_rules';
 if not coalesce((rules->>'enabled')::boolean,false) or p_party_size<1 or p_party_size>(rules->>'max_party_size')::int then return '[]'::jsonb; end if;
 if p_date<(now() at time zone 'America/Mexico_City')::date or p_date>(now() at time zone 'America/Mexico_City')::date+(rules->>'horizon_days')::int then return '[]'::jsonb; end if;
 select * into h from business_hours where weekday=extract(dow from p_date)::int;
 select * into ex from schedule_exceptions where date=p_date;
 if ex.date is not null then
  if ex.closed then return '[]'::jsonb; end if;
  start_t:=ex.open_time;end_t:=ex.close_time;
 else
  if h.weekday is null or not h.active then return '[]'::jsonb; end if;
  start_t:=h.open_time;end_t:=h.close_time;
 end if;
 duration:=(rules->>'session_minutes')::int;
 t:=(p_date+start_t) at time zone 'America/Mexico_City';ending:=(p_date+end_t) at time zone 'America/Mexico_City';
 while t+make_interval(mins=>duration)<=ending loop
  insert into reservation_slots(starts_at,ends_at,capacity) values(t,t+make_interval(mins=>duration),(rules->>'capacity')::int) on conflict(starts_at) do nothing;
  t:=t+make_interval(mins=>duration);
 end loop;
 select coalesce(jsonb_agg(to_jsonb(x) order by x.starts_at),'[]'::jsonb) into result from (
 select s.id,s.starts_at,s.ends_at, s.capacity-coalesce((select sum(r.party_size) from reservations r where r.slot_id=s.id and r.status in ('pending','confirmed')),0)::int as remaining
 from reservation_slots s where (s.starts_at at time zone 'America/Mexico_City')::date=p_date and not s.blocked
 and s.starts_at>now()+make_interval(mins=>(rules->>'advance_minutes')::int)
 and s.starts_at>=(p_date+start_t) at time zone 'America/Mexico_City' and s.ends_at<=ending
 ) x where x.remaining>=p_party_size;
 return result;
end $$;

create or replace function create_reservation(p_payload jsonb) returns jsonb language plpgsql security definer set search_path=public as $$
declare rules jsonb; s reservation_slots; r reservations; used integer; token text; summary jsonb; valid_slots jsonb;
begin
 select value_json into rules from site_settings where key='booking_rules';
 if not coalesce((rules->>'enabled')::boolean,false) then raise exception 'BOOKING_DISABLED'; end if;
 if coalesce((p_payload->>'terms')::boolean,false) is not true or length(trim(coalesce(p_payload->>'name','')))<2 or coalesce(p_payload->>'email','') not like '%@%.%' or length(coalesce(p_payload->>'phone',''))<10 or length(coalesce(p_payload->>'notes',''))>600 then raise exception 'INVALID_RESERVATION'; end if;
 if (p_payload->>'party_size')::int<1 or (p_payload->>'party_size')::int>(rules->>'max_party_size')::int then raise exception 'INVALID_PARTY_SIZE'; end if;
 -- Serializes retries with the same key even if the caller changes the requested slot.
 perform pg_advisory_xact_lock(hashtextextended(p_payload->>'idempotency_key',0));
 select * into r from reservations where idempotency_key=(p_payload->>'idempotency_key')::uuid;
 if r.id is not null then
  if r.email<>p_payload->>'email' or r.slot_id<>(p_payload->>'slot_id')::uuid or r.party_size<>(p_payload->>'party_size')::int then raise exception 'IDEMPOTENCY_CONFLICT'; end if;
  select * into s from reservation_slots where id=r.slot_id;
  return jsonb_build_object('public_code',r.public_code,'name',r.name,'party_size',r.party_size,'starts_at',s.starts_at,'ends_at',s.ends_at,'status',r.status);
 end if;
 valid_slots:=get_availability((p_payload->>'date')::date,(p_payload->>'party_size')::int);
 if not exists(select 1 from jsonb_array_elements(valid_slots) v where v->>'id'=p_payload->>'slot_id') then raise exception 'CAPACITY_CHANGED'; end if;
 select * into s from reservation_slots where id=(p_payload->>'slot_id')::uuid for update;
 if s.id is null or s.blocked then raise exception 'CAPACITY_CHANGED'; end if;
 select coalesce(sum(party_size),0) into used from reservations where slot_id=s.id and status in ('pending','confirmed');
 if used+(p_payload->>'party_size')::int>s.capacity then raise exception 'CAPACITY_CHANGED'; end if;
 token:=replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','');
 insert into reservations(public_code,slot_id,name,email,phone,party_size,celebration,notes,idempotency_key,terms_version,cancellation_hash)
 values(upper(substr(replace(gen_random_uuid()::text,'-',''),1,12)),s.id,trim(p_payload->>'name'),lower(trim(p_payload->>'email')),p_payload->>'phone',(p_payload->>'party_size')::int,coalesce(p_payload->>'celebration',''),coalesce(p_payload->>'notes',''),(p_payload->>'idempotency_key')::uuid,rules->>'terms_version',encode(sha256(convert_to(token,'UTF8')),'hex')) returning * into r;
 summary:=jsonb_build_object('public_code',r.public_code,'name',r.name,'party_size',r.party_size,'starts_at',s.starts_at,'ends_at',s.ends_at,'status',r.status);
 insert into notification_outbox(reservation_id,kind,payload) values(r.id,'confirmation',summary||jsonb_build_object('email',r.email,'cancellation_token',token));
 return summary;
end $$;

create or replace function reservation_by_token(p_code text,p_token text,p_cancel boolean default false) returns jsonb language plpgsql security definer set search_path=public as $$
declare r reservations; s reservation_slots; hours integer; begin
 select * into r from reservations where public_code=p_code and cancellation_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex') for update;
 if r.id is null then raise exception 'INVALID_LINK'; end if;
 select * into s from reservation_slots where id=r.slot_id for update;
 select (value_json->>'cancellation_hours')::int into hours from site_settings where key='booking_rules';
 if p_cancel and r.status<>'cancelled' then
  if r.status not in ('confirmed','pending') or s.starts_at<now()+make_interval(hours=>hours) then raise exception 'CANCELLATION_CLOSED'; end if;
  update reservations set status='cancelled' where id=r.id;
  insert into notification_outbox(reservation_id,kind,payload) values(r.id,'cancellation',jsonb_build_object('email',r.email,'public_code',r.public_code,'name',r.name,'starts_at',s.starts_at,'party_size',r.party_size)) on conflict do nothing;
  r.status:='cancelled';
 end if;
 return jsonb_build_object('public_code',r.public_code,'name',r.name,'party_size',r.party_size,'starts_at',s.starts_at,'ends_at',s.ends_at,'status',r.status,'can_cancel',r.status in ('confirmed','pending') and s.starts_at>=now()+make_interval(hours=>hours));
end $$;

create or replace function protect_reservation_update() returns trigger language plpgsql set search_path=public as $$
begin
 if new.slot_id<>old.slot_id or new.party_size<>old.party_size then raise exception 'CREATE_NEW_RESERVATION_TO_CHANGE_SLOT'; end if;
 if old.status in ('cancelled','completed','no_show') and new.status<>old.status then raise exception 'FINAL_STATUS'; end if;
 perform 1 from reservation_slots where id=new.slot_id for update;
 return new;
end $$;
create trigger protect_reservation before update on reservations for each row execute function protect_reservation_update();

create or replace function claim_notifications() returns setof notification_outbox language plpgsql security definer set search_path=public as $$
begin return query update notification_outbox set locked_until=now()+interval '5 minutes',attempts=attempts+1 where id in(select id from notification_outbox where sent_at is null and available_at<=now() and (locked_until is null or locked_until<now()) and attempts<12 order by created_at for update skip locked limit 3) returning *; end $$;

create or replace function save_catalog_item(p_item jsonb,p_meta jsonb) returns uuid language plpgsql security invoker set search_path=public as $$
declare result uuid; begin
 if staff_role() not in ('owner','manager','editor') then raise exception 'FORBIDDEN'; end if;
 result:=coalesce((p_item->>'id')::uuid,gen_random_uuid());
 insert into catalog_items(id,type,category_id,slug,name,short_desc,long_desc,price_cents,status,published,sort_order,asset)
 values(result,p_item->>'type',(p_item->>'category_id')::uuid,p_item->>'slug',p_item->>'name',p_item->>'short_desc',p_item->>'long_desc',(p_item->>'price_cents')::int,p_item->>'status',(p_item->>'published')::boolean,(p_item->>'sort_order')::int,p_item->>'asset')
 on conflict(id) do update set type=excluded.type,category_id=excluded.category_id,slug=excluded.slug,name=excluded.name,short_desc=excluded.short_desc,long_desc=excluded.long_desc,price_cents=excluded.price_cents,status=excluded.status,published=excluded.published,sort_order=excluded.sort_order,asset=excluded.asset,availability_updated_at=now(),updated_at=now();
 if p_item->>'type'='ceramic' then
 delete from cafe_meta where item_id=result;
 insert into ceramic_meta(item_id,dimensions,difficulty,estimated_minutes,shape_family) values(result,coalesce(p_meta->>'dimensions',''),coalesce(p_meta->>'difficulty',''),nullif(p_meta->>'estimated_minutes','')::int,coalesce(p_meta->>'shape_family','')) on conflict(item_id) do update set dimensions=excluded.dimensions,difficulty=excluded.difficulty,estimated_minutes=excluded.estimated_minutes,shape_family=excluded.shape_family;
 else
 delete from ceramic_meta where item_id=result;
 insert into cafe_meta(item_id,temperature,caffeine,dietary_tags,allergens,alcohol_note) values(result,coalesce(p_meta->>'temperature',''),coalesce((p_meta->>'caffeine')::boolean,false),array(select jsonb_array_elements_text(coalesce(p_meta->'dietary_tags','[]'::jsonb))),array(select jsonb_array_elements_text(coalesce(p_meta->'allergens','[]'::jsonb))),coalesce(p_meta->>'alcohol_note','')) on conflict(item_id) do update set temperature=excluded.temperature,caffeine=excluded.caffeine,dietary_tags=excluded.dietary_tags,allergens=excluded.allergens,alcohol_note=excluded.alcohol_note;
 end if;
 return result;
end $$;

-- Authenticated clients cannot directly insert reservations or call protected RPCs.
revoke insert,delete on reservations from authenticated;
revoke all on notification_outbox,rate_limits from anon,authenticated;
revoke all on function get_availability(date,integer),create_reservation(jsonb),reservation_by_token(text,text,boolean),take_rate_limit(text,integer,integer),claim_notifications() from public,anon,authenticated;
grant execute on function get_availability(date,integer),create_reservation(jsonb),reservation_by_token(text,text,boolean),take_rate_limit(text,integer,integer),claim_notifications() to service_role;
revoke all on function save_catalog_item(jsonb,jsonb) from public,anon;
grant execute on function save_catalog_item(jsonb,jsonb) to authenticated;

insert into site_settings(key,value_json,public) values
 ('booking_rules','{"enabled":false,"capacity":0,"max_party_size":6,"session_minutes":120,"advance_minutes":120,"cancellation_hours":24,"horizon_days":60,"terms_version":"2026-10-draft"}',true),
 ('contact','{"address":"C. Reforma 464, Centro, Guadalajara, Jalisco","phone":"+523321583412","email":"hola@tantre.mx","instagram":"tantre_mx","verified":false}',true),
 ('availability_freshness_hours','6',true),('paint_enabled','true',true),('legal_published','false',true),('analytics_enabled','false',true);
insert into business_hours values(0,'11:00','19:00','18:00',true),(1,'11:00','19:00','18:00',false),(2,'11:00','19:00','18:00',false),(3,'11:00','19:00','18:00',false),(4,'11:00','19:00','18:00',true),(5,'11:00','19:00','18:00',true),(6,'11:00','19:00','18:00',true);
insert into catalog_categories(type,slug,title,sort_order,published) values('ceramic','tazas','Tazas',0,true),('ceramic','platos','Platos & bowls',1,true),('ceramic','objetos','Objetos',2,true),('cafe','calientes','Calientes',0,true),('cafe','frias','Frías',1,true),('cafe','snacks','Algo rico',2,true);
-- There are deliberately no invented inventory items, prices, reviews or allergens.
