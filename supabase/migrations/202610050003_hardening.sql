-- Explicit grants: do not depend on the project's default privileges.
grant usage on schema public to anon, authenticated, service_role;
grant select on catalog_categories,catalog_items,ceramic_meta,cafe_meta,catalog_media,
 packages,faqs,testimonials,gallery_entries,site_settings to anon;
grant select on all tables in schema public to authenticated;
grant insert,update,delete on catalog_categories,catalog_items,ceramic_meta,cafe_meta,
 catalog_media,media_assets,gallery_entries,packages,faqs,testimonials,business_hours,
 schedule_exceptions,site_settings to authenticated;
revoke update on reservations,reservation_slots from authenticated;
grant update(status) on reservations to authenticated;
grant update(blocked) on reservation_slots to authenticated;
revoke all on notification_outbox,rate_limits from anon,authenticated;
grant all on all tables in schema public to service_role;
-- Team changes go through a serialized RPC; owners cannot lock themselves out.
revoke insert,update,delete on profiles from authenticated;
create function update_staff(p_id uuid,p_name text,p_role text,p_active boolean)
returns void language plpgsql security definer set search_path=public as $$
begin
 perform pg_advisory_xact_lock(hashtextextended('tantre-staff',0));
 if coalesce(staff_role(),'')<>'owner' then raise exception 'FORBIDDEN'; end if;
 if p_id=auth.uid() and (not p_active or p_role<>'owner') then raise exception 'KEEP_OWN_ACCESS'; end if;
 if p_role not in ('owner','manager','editor','viewer') or length(trim(p_name))<2 then raise exception 'INVALID_STAFF'; end if;
 insert into profiles(id,display_name,role,active) values(p_id,trim(p_name),p_role,p_active)
 on conflict(id) do update set display_name=excluded.display_name,role=excluded.role,active=excluded.active;
end $$;
revoke all on function update_staff(uuid,text,text,boolean) from public,anon;
grant execute on function update_staff(uuid,text,text,boolean) to authenticated;

-- Every cancellation, including an admin cancellation, creates one notification.
create function cancellation_notification() returns trigger language plpgsql security definer set search_path=public as $$
declare start_time timestamptz;
begin
 if new.status='cancelled' and old.status<>'cancelled' then
  select starts_at into start_time from reservation_slots where id=new.slot_id;
  insert into notification_outbox(reservation_id,kind,payload) values(new.id,'cancellation',
   jsonb_build_object('email',new.email,'public_code',new.public_code,'name',new.name,'starts_at',start_time,'party_size',new.party_size)) on conflict do nothing;
 end if;
 return new;
end $$;
create trigger cancellation_email after update on reservations for each row execute function cancellation_notification();

-- Guard against new durations creating overlapping sessions after slots exist.
-- Skipping an overlapping insert preserves existing reservations and their capacity.
create function prevent_slot_overlap() returns trigger language plpgsql set search_path=public as $$
begin
 perform pg_advisory_xact_lock(hashtextextended('slots:'||(new.starts_at at time zone 'America/Mexico_City')::date::text,0));
 if exists(select 1 from reservation_slots where starts_at<new.ends_at and ends_at>new.starts_at) then return null; end if;
 return new;
end $$;
create trigger slot_overlap before insert on reservation_slots for each row execute function prevent_slot_overlap();
create trigger audit after insert or update or delete on reservation_slots for each row execute function audit_change();
alter table catalog_media add constraint catalog_media_asset foreign key(storage_path) references media_assets(storage_path);

-- Unpublished categories also hide their children through direct REST access.
drop policy published_read on catalog_items;
create policy published_read on catalog_items for select to anon,authenticated using(
 (published and exists(select 1 from catalog_categories c where c.id=category_id and c.published))
 or staff_role() in ('owner','manager','editor','viewer'));

create function maintenance() returns void language plpgsql security definer set search_path=public as $$
begin
 delete from rate_limits where reset_at<now()-interval '1 day';
 -- Delivery tokens never remain in failed mail payloads indefinitely.
 update notification_outbox set payload=jsonb_build_object('public_code',payload->>'public_code'),last_error='expired',attempts=12
 where sent_at is null and created_at<now()-interval '7 days' and last_error is distinct from 'expired';
end $$;
revoke all on function maintenance() from public,anon,authenticated;
grant execute on function maintenance() to service_role;
