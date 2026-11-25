-- Public directory only: intentionally no link to confidential registrations.
begin;
create table public.dpc_members (
 id uuid primary key default gen_random_uuid(),
 district text not null check (district in ('Balongbendo','Buduran','Candi','Gedangan','Jabon','Krembung','Krian','Porong','Prambon','Sedati','Sidoarjo','Sukodono','Taman','Tanggulangin','Tarik','Tulangan','Waru','Wonoayu')),
 person_name text not null check (char_length(btrim(person_name)) between 2 and 120),
 jabatan text not null check (char_length(btrim(jabatan)) between 2 and 80),
 sort_order integer not null default 0 check (sort_order between 0 and 9999),
 published boolean not null default false
);
create index dpc_members_directory_idx on public.dpc_members(district,sort_order,id);
alter table public.dpc_members enable row level security;
revoke all on public.dpc_members from PUBLIC, anon, authenticated;
grant select on public.dpc_members to anon, authenticated;
grant insert,update,delete on public.dpc_members to authenticated;
grant all on public.dpc_members to service_role;
create policy "public published dpc" on public.dpc_members for select to anon,authenticated using(published);
create policy "editors manage dpc" on public.dpc_members for all to authenticated
using(public.has_admin_role(array['owner','content_editor']::text[]))
with check(public.has_admin_role(array['owner','content_editor']::text[]));
commit;
