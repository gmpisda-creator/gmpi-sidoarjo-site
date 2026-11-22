import fs from 'node:fs';
import assert from 'node:assert/strict';
const sql=fs.readFileSync('supabase/migrations/202610310041_public_intake_privacy.sql','utf8');
for (const name of ['dues_status','dues_report_member_detail']) {
 const body=sql.split(`create or replace function public.${name}(`)[1].split('revoke execute')[0];
 assert(body.indexOf('has_admin_role') < body.indexOf('select * into'));
 assert(sql.includes(`revoke execute on function public.${name}(text,text) from PUBLIC, anon`));
}
assert(sql.includes('before update on public.rsvp'));
assert(sql.includes('pg_advisory_xact_lock'));
assert(sql.includes('before insert on public.dues_payments'));
assert(sql.includes('before insert on public.member_registrations'));
assert(!/delete from|truncate /i.test(sql));
const html=fs.readFileSync('iuran.html','utf8');
for (const id of ['dues-check-form','dues-report-form']) assert(html.includes(`id="${id}" hidden`));
console.log('PASS static privacy and intake checks (not live SQL integration tests).');
