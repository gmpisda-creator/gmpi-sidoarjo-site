-- Explicit consent gateway; existing validation and expanded divisions preserved.
begin;
create or replace function public.submit_member_registration_consented(
  p_pledge_accepted boolean,
  p_privacy_acknowledged boolean,
  p_full_name text,
  p_nik text,
  p_birth_place text,
  p_birth_date date,
  p_gender text,
  p_phone text,
  p_district text,
  p_address_street text,
  p_kelurahan text,
  p_rt text,
  p_rw text,
  p_kode_pos text,
  p_kota_luar text,
  p_division text default null,
  p_jabatan text default null,
  p_ktp_key text default null,
  p_profile_key text default null
)
returns text language plpgsql security definer set search_path = '' as $$
begin
  if p_pledge_accepted is distinct from true or p_privacy_acknowledged is distinct from true then
    raise exception 'Persetujuan pernyataan dan privasi wajib diberikan.' using errcode = '22023';
  end if;
  return public.submit_member_registration(p_full_name, p_nik, p_birth_place, p_birth_date, p_gender, p_phone, p_district, p_address_street, p_kelurahan, p_rt, p_rw, p_kode_pos, p_kota_luar, p_division, p_jabatan, p_ktp_key, p_profile_key);
end;
$$;
revoke execute on function public.submit_member_registration(text,text,text,date,text,text,text,text,text,text,text,text,text,text,text,text,text) from PUBLIC, anon, authenticated;
revoke execute on function public.submit_member_registration_consented(boolean,boolean,text,text,text,date,text,text,text,text,text,text,text,text,text,text,text,text,text) from PUBLIC;
grant execute on function public.submit_member_registration_consented(boolean,boolean,text,text,text,date,text,text,text,text,text,text,text,text,text,text,text,text,text) to anon, authenticated;

-- Server-enforced per-file limits; not a quota or proof of image contents.
update storage.buckets
set public = false, file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg','image/png']
where id = 'member-documents';

create or replace function public.registration_security_ready()
returns boolean language sql stable set search_path = '' as $$ select true; $$;
revoke all on function public.registration_security_ready() from PUBLIC;
grant execute on function public.registration_security_ready() to anon, authenticated;

-- Align cancellation with the three-hour location update window.
create or replace function public.cancel_sos(p_id uuid, p_token text)
returns text language plpgsql security definer set search_path = '' as $$
declare v_status text;
begin
  update public.sos_alerts a
  set status = 'dibatalkan', handler_note = coalesce(a.handler_note, 'Anggota menyatakan sudah aman.')
  where a.id = p_id
    and a.token_hash = encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex')
    and a.created_at > now() - interval '3 hours'
    and a.status in ('baru','diterima','menuju')
  returning a.status into v_status;
  return v_status;
end;
$$;
do $checks$
begin
  if not exists (select 1 from storage.buckets where id = 'member-documents'
      and public = false and file_size_limit = 5242880) then
    raise exception 'Bucket member-documents belum siap; perubahan dibatalkan.';
  end if;
  if has_function_privilege('anon', 'public.submit_member_registration(text,text,text,date,text,text,text,text,text,text,text,text,text,text,text,text,text)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.submit_member_registration(text,text,text,date,text,text,text,text,text,text,text,text,text,text,text,text,text)', 'EXECUTE') then
    raise exception 'Akses fungsi lama masih aktif; perubahan dibatalkan.';
  end if;
end;
$checks$;
commit;
