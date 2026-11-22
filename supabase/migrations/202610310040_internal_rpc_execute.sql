-- Least-privilege hardening based on user-supplied live function definitions.
-- No data edits; no function body, RLS, or organization role changes.
-- Public intake, QR verification, SOS tracking and public dues endpoints stay untouched.
begin;
do $audit$
declare
  signature text;
  target regprocedure;
begin
  foreach signature in array array[
    'public.dues_close_invoice(uuid)',
    'public.dues_delete_invoice(uuid)',
    'public.dues_launch_invoice(uuid,timestamp with time zone)',
    'public.dues_members_ledger(text,text)',
    'public.dues_publish_report(uuid,text)',
    'public.dues_save_invoice(uuid,text,text,integer,integer,date,text,text,timestamp with time zone)',
    'public.dues_unpaid_members(text)',
    'public.dues_withdraw_report(uuid)',
    'public.verify_dues_payment(uuid,text,text)',
    'public.reset_rsvp()',
    'public.purge_old_sos()'
  ] loop
    -- Missing signatures abort the transaction, rather than silently skipping a control.
    target := signature::regprocedure;
    execute format('revoke execute on function %s from PUBLIC, anon', target);
    execute format('grant execute on function %s to authenticated, service_role', target);
    if has_function_privilege('anon', target::oid, 'EXECUTE') then
      raise exception 'Anonymous EXECUTE remains for %. Check inherited role grants.', signature;
    end if;
  end loop;
end;
$audit$;
commit;
