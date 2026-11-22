-- Privacy and intake hardening. Apply manually in SQL Editor; atomic.
begin;

create or replace function public.dues_status(p_nomor text, p_nama text)
returns table (
  period text,
  months integer,
  periods text[],
  amount integer,
  status text,
  paid_at date,
  verified_at timestamptz,
  invoice_title text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_number text := upper(trim(coalesce(p_nomor, '')));
  v_name text := trim(coalesce(p_nama, ''));
  v_card public.member_cards;
begin
  if not public.has_admin_role(array['owner','registrar','bendahara']::text[]) then
    raise exception 'Rincian iuran hanya untuk pengurus berwenang.' using errcode = '42501';
  end if;
  if char_length(v_number) < 3 or char_length(v_number) > 40 then
    raise exception 'Nomor anggota belum diisi dengan benar.';
  end if;
  if char_length(v_name) < 2 then
    raise exception 'Nama anggota wajib diisi.';
  end if;

  select * into v_card
  from public.member_cards c
  where c.member_number = v_number
    and lower(c.full_name) = lower(v_name)
    and c.is_sample = false
  limit 1;

  if not found then
    raise exception 'Data tidak cocok. Periksa nomor anggota dan nama sesuai kartu anggota.';
  end if;

  return query
  select d.period,
         coalesce(d.months, 1),
         public.dues_payment_months(d.period, d.months, d.periods),
         d.amount,
         d.status,
         d.paid_at,
         d.verified_at,
         i.title
  from public.dues_payments d
  left join public.dues_invoices i on i.id = d.invoice_id
  where d.status <> 'ditolak'
    and (
      d.member_number = v_card.member_number
      or (d.member_number is null and lower(d.member_name) = lower(v_card.full_name))
    )
  order by d.period desc, d.created_at desc;
end;
$$;

revoke execute on function public.dues_status(text,text) from PUBLIC, anon;
grant execute on function public.dues_status(text,text) to authenticated, service_role;

create or replace function public.dues_report_member_detail(p_nomor text, p_nama text)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  v_number text := upper(trim(coalesce(p_nomor, '')));
  v_name text := trim(coalesce(p_nama, ''));
  v_card public.member_cards;
  v_report public.dues_reports;
  v_denied text := 'Data tidak cocok. Periksa nomor anggota dan nama sesuai kartu anggota.';
begin
  if not public.has_admin_role(array['owner','registrar','bendahara']::text[]) then
    raise exception 'Rincian iuran hanya untuk pengurus berwenang.' using errcode = '42501';
  end if;
  if char_length(v_number) < 3 or char_length(v_number) > 40 then
    raise exception '%', v_denied;
  end if;
  if char_length(v_name) < 2 then
    raise exception '%', v_denied;
  end if;

  select * into v_card
  from public.member_cards c
  where c.member_number = v_number
    and lower(c.full_name) = lower(v_name)
    and c.is_sample = false
    and c.status in ('aktif','nonaktif')
  limit 1;

  if not found then
    raise exception '%', v_denied;
  end if;

  select * into v_report
  from public.dues_reports r
  where r.status = 'diterbitkan'
  order by r.published_at desc nulls last
  limit 1;

  if not found then
    return jsonb_build_object('has_report', false);
  end if;

  return jsonb_build_object(
    'has_report', true,
    'report', jsonb_build_object(
      'title', v_report.title,
      'period', v_report.period,
      'months', v_report.months,
      'nominal', v_report.nominal,
      'due_date', v_report.due_date,
      'note', v_report.note,
      'published_at', v_report.published_at
    ),
    'verified_member', jsonb_build_object(
      'member_number', v_card.member_number,
      'full_name', v_card.full_name,
      'district', v_card.district
    ),
    'entries', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'member_name', d.member_name,
          'district', d.district,
          'periods', public.dues_payment_months(d.period, d.months, d.periods),
          'months', coalesce(d.months, 1),
          'amount', d.amount,
          'paid_at', d.paid_at,
          'verified_at', d.verified_at
        )
        order by lower(d.member_name), d.paid_at desc
      )
      from public.dues_payments d
      where d.status = 'terverifikasi'
        and (d.invoice_id = v_report.invoice_id
             or (d.invoice_id is null and d.period = v_report.period))
    ), '[]'::jsonb)
  );
end;
$function$;

revoke execute on function public.dues_report_member_detail(text,text) from PUBLIC, anon;
grant execute on function public.dues_report_member_detail(text,text) to authenticated, service_role;

-- Name-only public RSVP must never overwrite an existing answer.
create or replace function public.guard_rsvp_public_update()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not public.has_admin_role(array['owner']::text[]) then
    raise exception 'Nama sudah tercatat. Untuk koreksi atau nama yang sama, hubungi pengurus.' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_rsvp_public_update() from PUBLIC, anon, authenticated;
drop trigger if exists guard_rsvp_public_update on public.rsvp;
create trigger guard_rsvp_public_update before update on public.rsvp
for each row execute function public.guard_rsvp_public_update();

-- Serialize intake checks to close concurrent check/insert races.
-- Existing RPC validation remains intact; no historical records are modified.
create or replace function public.guard_public_intake()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('gmpi_intake_' || tg_table_name));
  if tg_table_name = 'dues_payments' then
    if public.has_admin_role(array['owner','registrar','bendahara']::text[]) then return new; end if;
    if new.status <> 'menunggu' then
      raise exception 'Pembayaran publik harus menunggu verifikasi.';
    end if;
    if (select count(*) from public.dues_payments where created_at > now() - interval '10 minutes') >= 60
       or (select count(*) from public.dues_payments where created_at > now() - interval '1 hour'
           and regexp_replace(phone, '\D', '', 'g') = regexp_replace(new.phone, '\D', '', 'g')) >= 5 then
      raise exception 'Terlalu banyak konfirmasi pembayaran. Hubungi Bendahara.';
    end if;
    if new.member_number is not null and not exists (
      select 1 from public.member_cards c where c.member_number = new.member_number
      and lower(trim(c.full_name)) = lower(trim(new.member_name)) and not c.is_sample
    ) then
      raise exception 'Nomor anggota dan nama tidak cocok.';
    end if;
  elsif tg_table_name = 'member_registrations' then
    if (select count(*) from public.member_registrations where created_at > now() - interval '10 minutes') >= 60 then
      raise exception 'Pendaftaran sedang sangat ramai. Hubungi pengurus.';
    end if;
    if exists (select 1 from public.member_registrations m where
      m.ktp_object_key in (new.ktp_object_key, new.profile_object_key)
      or m.profile_object_key in (new.ktp_object_key, new.profile_object_key)) then
      raise exception 'Berkas sudah digunakan. Unggah foto baru untuk pengajuan ini.';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.guard_public_intake() from PUBLIC, anon, authenticated;
drop trigger if exists guard_public_intake on public.dues_payments;
create trigger guard_public_intake before insert on public.dues_payments
for each row execute function public.guard_public_intake();
drop trigger if exists guard_public_intake on public.member_registrations;
create trigger guard_public_intake before insert on public.member_registrations
for each row execute function public.guard_public_intake();
commit;
