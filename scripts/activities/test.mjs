import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const js=fs.readFileSync('activities.js','utf8');
const sql=fs.readFileSync('supabase/migrations/202610310038_lensa_kegiatan.sql','utf8');
const admin=fs.readFileSync('admin.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const context={window:{},document:{querySelector:()=>null}};
vm.runInNewContext(js,context);
assert.equal(typeof context.window.GMPIActivities.admin,'function');
assert(!js.includes('innerHTML'));
assert(js.includes("status=eq.published"));
assert(js.includes("if(!r.ok)return"));
assert(js.includes("selected.click()"));
assert(sql.includes('enable row level security'));
assert(sql.includes("using (status = 'published')"));
assert(sql.includes("array['owner','content_editor']::text[]"));
assert(sql.includes('26214400'));
assert(admin.includes("if (canEditContent()) tabs.push(['activities'"));
assert(html.includes('assets/news/ntt/aksi.webp'),'Static NTT retained');
assert(html.indexOf('supabase-config.js')<html.indexOf('activities.js'));
assert(sql.includes("status in ('draft','published','hidden')"));
console.log('PASS: module initialization, text-only rendering guard, publication query, fallback, category refresh, RLS/roles and limits, preserved static gallery, script order');
const albumSql=fs.readFileSync('supabase/migrations/202610310039_activity_albums.sql','utf8');
assert(albumSql.includes('cardinality(paths) <= 9'));
assert(albumSql.includes('p is null or p !~'));
assert(js.includes('retained.length+photos.length>9'));
assert(js.includes('album.disabled=!albumReady'));
assert(!js.includes('select=*'));
// Exercise public fetch against old and new schemas, without real network or writes.
for(const oldSchema of [true,false]) {
 const calls=[];let inserted=false;
 const grid={prepend:()=>{inserted=true}};
 const sandbox={window:{GMPI_SUPABASE_CONFIG:{url:'https://test.invalid',publishableKey:'test'}},
 document:{querySelector:s=>s==='#lensa .masonry-grid'?grid:null,createDocumentFragment:()=>({append(){}})},
 fetch:async url=>{calls.push(url);return oldSchema&&calls.length===1
 ? {status:400,ok:false,clone:()=>({json:async()=>({code:'42703'})})}
 : {status:200,ok:true,json:async()=>[]};}};
 vm.runInNewContext(js,sandbox);
 await new Promise(resolve=>setImmediate(resolve));
 assert(inserted);assert.equal(calls.length,oldSchema?2:1);
 assert(calls[0].includes('album_paths'));
 if(oldSchema)assert(!calls[1].includes('album_paths'));
}
console.log('PASS: album constraints, upload guard, no wildcard, public old/new schema compatibility');
