begin;
alter table public.activity_posts add column if not exists album_paths text[] not null default '{}';
create or replace function public.valid_activity_album(paths text[])
returns boolean language sql immutable set search_path = public as $$
 select paths is not null
 and cardinality(paths) <= 9
 and not exists (
  select 1 from unnest(paths) p
  where p is null or p !~ '^photos/[a-f0-9-]+\.(jpg|png|webp)$'
 );
$$;
alter table public.activity_posts drop constraint if exists activity_album_paths_valid;
alter table public.activity_posts add constraint activity_album_paths_valid
 check (public.valid_activity_album(album_paths));
-- Existing RLS and role restrictions apply to the new column as well.
notify pgrst, 'reload schema';
commit;
