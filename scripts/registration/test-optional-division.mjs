import assert from 'node:assert/strict';
import fs from 'node:fs';
const html=fs.readFileSync('index.html','utf8');
const select=html.match(/<select\b[^>]*id="join-division"[^>]*>/)?.[0];
assert(select);
assert(!/\brequired\b/.test(select));
assert(select.includes('name="division"'));
assert(select.includes('aria-describedby="join-division-help"'));
assert(html.includes('Belum memilih bidang / lewati'));
assert(html.includes('DPC bukan bidang pergerakan'));
for(const id of ['join-nik','join-contact','join-pledge']) {
 assert(new RegExp(`<input\\b[^>]*id="${id}"[^>]*\\brequired\\b`).test(html));
}
console.log('PASS: division optional with empty option and explanation; required identity/contact/pledge retained.');
