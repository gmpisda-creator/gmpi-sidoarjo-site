-- Existing cards are left unassigned, not guessed from residential district.
begin;
alter table public.member_cards
 add column organization_level text,
 add column dpc_district text,
 add constraint member_cards_organization_check check (
   (organization_level is null and dpc_district is null)
   or (organization_level is not null and organization_level = 'DPD' and dpc_district is null)
   or (organization_level is not null and organization_level = 'DPC' and dpc_district is not null
     and dpc_district in ('Balongbendo','Buduran','Candi','Gedangan','Jabon','Krembung','Krian','Porong','Prambon','Sedati','Sidoarjo','Sukodono','Taman','Tanggulangin','Tarik','Tulangan','Waru','Wonoayu'))
 );
-- Extend the actual live approval guard, retaining all its other logic.
do $migration$
declare definition text;
begin
 definition := pg_get_functiondef('public.member_cards_guard()'::regprocedure);
 if position('(new.full_name, new.member_number, new.district, new.jabatan, new.issued_at, new.valid_until)' in definition) = 0
 or position('(old.full_name, old.member_number, old.district, old.jabatan, old.issued_at, old.valid_until)' in definition) = 0 then
   raise exception 'Format penjaga persetujuan berbeda. Perubahan dibatalkan; minta pemeriksaan kode live.';
 end if;
 definition := replace(definition,
 '(new.full_name, new.member_number, new.district, new.jabatan, new.issued_at, new.valid_until)',
 '(new.full_name, new.member_number, new.district, new.jabatan, new.issued_at, new.valid_until, new.organization_level, new.dpc_district)');
 definition := replace(definition,
 '(old.full_name, old.member_number, old.district, old.jabatan, old.issued_at, old.valid_until)',
 '(old.full_name, old.member_number, old.district, old.jabatan, old.issued_at, old.valid_until, old.organization_level, old.dpc_district)');
 execute definition;
end;
$migration$;
commit;
