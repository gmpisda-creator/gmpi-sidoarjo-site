-- Lensa Kegiatan: separate from news; existing static gallery is retained.
create table public.activity_posts (
 id uuid primary key default gen_random_uuid(),
 title text not null check (length(btrim(title)) between 1 and 160),
 description text not null default '' check (length(description) <= 12000),
 category text not null default 'aksi-sosial' check (category in ('aksi-sosial','sosial','koordinasi','warga')),
 event_date date,
 image_path text not null check (image_path ~ '^photos/[a-f0-9-]+\.(jpg|png|webp)$'),
 video_path text check (video_path ~ '^videos/[a-f0-9-]+\.mp4$'),
 status text not null default 'draft' check (status in ('draft','published','hidden')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.activity_posts enable row level security;
grant select on public.activity_posts to anon, authenticated;
grant insert, update, delete on public.activity_posts to authenticated;
create policy "visitors read published activities" on public.activity_posts for select to anon, authenticated using (status = 'published');
create policy "editors manage activities" on public.activity_posts for all to authenticated
using (public.has_admin_role(array['owner','content_editor']::text[]))
with check (public.has_admin_role(array['owner','content_editor']::text[]));
create index activity_posts_public_idx on public.activity_posts (created_at desc) where status = 'published';
-- Public media only: draft text is private but uploaded media URLs are public.
-- Never use this bucket for KTP, member documents or private photos.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('activity-media','activity-media',true,26214400,array['image/jpeg','image/png','image/webp','video/mp4']);
create policy "editors list activity media" on storage.objects for select to authenticated
using (bucket_id='activity-media' and public.has_admin_role(array['owner','content_editor']::text[]));
create policy "editors upload activity media" on storage.objects for insert to authenticated
with check (bucket_id='activity-media' and public.has_admin_role(array['owner','content_editor']::text[])
 and (name ~ '^photos/[a-f0-9-]+\.(jpg|png|webp)$' or name ~ '^videos/[a-f0-9-]+\.mp4$'));
create policy "editors remove activity media" on storage.objects for delete to authenticated
using (bucket_id='activity-media' and public.has_admin_role(array['owner','content_editor']::text[]));
