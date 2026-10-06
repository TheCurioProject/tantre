insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('tantre-media','tantre-media',false,2097152,array['image/webp','image/jpeg','image/png','image/avif']) on conflict(id) do nothing;
-- Private bucket: media delivery is authorized by the API against published items/gallery.
create policy staff_media_read on storage.objects for select to authenticated using(bucket_id='tantre-media' and public.staff_role() in ('owner','manager','editor'));
create policy staff_media_insert on storage.objects for insert to authenticated with check(bucket_id='tantre-media' and public.staff_role() in ('owner','manager','editor'));
create policy staff_media_delete on storage.objects for delete to authenticated using(bucket_id='tantre-media' and public.staff_role() in ('owner','manager','editor'));
