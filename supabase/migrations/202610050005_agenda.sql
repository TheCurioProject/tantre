create function admin_agenda(p_date date,p_days integer,p_status text,p_min_party integer,p_celebration boolean,p_offset integer)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare result jsonb;begin
 if coalesce(staff_role(),'') not in ('owner','manager','viewer') then raise exception 'FORBIDDEN';end if;
 if p_days not in (1,7) or p_offset<0 or p_offset>20000 then raise exception 'INVALID_RANGE';end if;
 with selection as (
  select r.id,r.public_code,r.name,r.email,r.phone,r.party_size,r.celebration,r.notes,r.status,r.slot_id,
   jsonb_build_object('starts_at',s.starts_at,'ends_at',s.ends_at) as reservation_slots,s.starts_at
  from reservations r join reservation_slots s on r.slot_id=s.id
  where (p_date is null or (s.starts_at>=p_date::timestamp at time zone 'America/Mexico_City' and s.starts_at<(p_date+p_days)::timestamp at time zone 'America/Mexico_City'))
  and (p_status='all' or r.status=p_status) and r.party_size>=p_min_party and (not p_celebration or length(r.celebration)>0)
 ), page as (select * from selection order by starts_at,id limit 100 offset p_offset)
 select jsonb_build_object('reservations',coalesce((select jsonb_agg(to_jsonb(page)-'starts_at') from page),'[]'::jsonb),'total',(select count(*) from selection),
 'metrics',jsonb_build_object('confirmed',(select count(*) from selection where status='confirmed'),'people',(select coalesce(sum(party_size),0) from selection where status='confirmed'),'cancelled',(select count(*) from selection where status='cancelled'))) into result;
 return result;
end $$;
revoke all on function admin_agenda(date,integer,text,integer,boolean,integer) from public,anon;
grant execute on function admin_agenda(date,integer,text,integer,boolean,integer) to authenticated;

create function admin_slots() returns jsonb language plpgsql stable security invoker set search_path=public as $$
declare result jsonb;begin
 if coalesce(staff_role(),'') not in ('owner','manager','viewer') then raise exception 'FORBIDDEN';end if;
 select coalesce(jsonb_agg(to_jsonb(s)),'[]'::jsonb) into result from (
  select s.id,s.starts_at,s.capacity,s.blocked,(select coalesce(sum(r.party_size),0) from reservations r where r.slot_id=s.id and r.status in ('pending','confirmed')) as booked
  from reservation_slots s where s.starts_at>=now() order by s.starts_at limit 100
 ) s;
 return result;
end $$;
revoke all on function admin_slots() from public,anon;
grant execute on function admin_slots() to authenticated;
