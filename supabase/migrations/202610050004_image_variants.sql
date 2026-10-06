create table image_variants(
 base_path text not null references media_assets(storage_path),
 variant_path text not null references media_assets(storage_path),
 width integer not null check(width>0),height integer not null check(height>0),
 primary key(base_path,width)
);
alter table image_variants enable row level security;
create policy media_editors on image_variants for all to authenticated
using(staff_role() in ('owner','manager','editor')) with check(staff_role() in ('owner','manager','editor'));
grant select,insert,update,delete on image_variants to authenticated;
grant all on image_variants to service_role;
