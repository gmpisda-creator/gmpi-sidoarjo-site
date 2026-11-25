/* Public DPC directory is deliberately separate from private registration/KTA data. */
(() => {
  'use strict';
  const districts = ['Balongbendo','Buduran','Candi','Gedangan','Jabon','Krembung','Krian','Porong','Prambon','Sedati','Sidoarjo','Sukodono','Taman','Tanggulangin','Tarik','Tulangan','Waru','Wonoayu'];
  const node = (tag, text, cls) => { const n=document.createElement(tag); if(text)n.textContent=text; if(cls)n.className=cls; return n; };
  const columns='id,district,person_name,jabatan,sort_order,published';
  async function admin({client,workspace}) {
    const mount=node('div'); workspace.replaceChildren(mount);
    let page=0;
    async function load() {
      mount.replaceChildren(node('h2','DPC Kecamatan'),node('p','Kelola nama dan jabatan anggota/pengurus DPC. Data terbit bersifat publik. Jangan isi NIK, nomor HP, atau dokumen pribadi. Tidak mengubah data KTA/pendaftaran.'));
      const result=await client.from('dpc_members').select(columns).order('district').order('sort_order').order('id').range(page*100,page*100+99);
      if(result.error){mount.append(node('p','DPC belum dapat dimuat. Pastikan SQL 043 sudah diterapkan dan akun memiliki akses Pemilik/Editor Situs.'));return;}
      const add=node('button','Tambah anggota / pengurus DPC','admin-button');add.type='button';
      const editor=node('div');mount.append(add,editor); add.onclick=()=>edit({district:districts[0],sort_order:0,published:false});
      for(const row of result.data||[]) {
        const item=node('div',null,'dpc-admin-row'); const button=node('button','Ubah','admin-button admin-button-outline');button.type='button';button.onclick=()=>edit(row);
        item.append(node('strong',row.person_name),node('span',`DPC ${row.district} · ${row.jabatan} · ${row.published?'Terbit':'Draf'}`),button);mount.append(item);
      }
      if(!result.data.length)mount.append(node('p','Belum ada data pada halaman ini.'));
      const prev=node('button','Sebelumnya','admin-button'),next=node('button','Berikutnya','admin-button');prev.type=next.type='button';prev.disabled=page===0;next.disabled=result.data.length<100;
      prev.onclick=()=>{page--;load();};next.onclick=()=>{page++;load();};mount.append(prev,node('span',` Halaman ${page+1} `),next);
      function edit(row) {
        const form=node('form',null,'dpc-editor');editor.replaceChildren(form);
        function field(label,tag,value){const wrap=node('label',label);const input=node(tag);wrap.append(input);form.append(wrap);if(value!==undefined)input.value=value;return input;}
        const district=field('DPC Kecamatan','select');districts.forEach(d=>{const o=node('option',d);o.value=d;district.append(o);});district.value=row.district;
        const name=field('Nama anggota / pengurus','input',row.person_name||'');name.required=true;name.minLength=2;name.maxLength=120;
        const job=field('Jabatan di DPC (contoh: Ketua DPC, Sekretaris, Anggota)','input',row.jabatan||'');job.required=true;job.minLength=2;job.maxLength=80;
        const order=field('Urutan tampil','input',row.sort_order);order.type='number';order.min=0;order.max=9999;order.required=true;
        const published=field('Terbitkan nama dan jabatan ini untuk publik','input');published.type='checkbox';published.checked=!!row.published;
        const msg=node('p');msg.setAttribute('role','status');
        const save=node('button','Simpan','admin-button admin-button-red');save.type='submit';form.append(msg,save);
        const cancel=node('button','Batal','admin-button');cancel.type='button';cancel.onclick=()=>editor.replaceChildren();form.append(cancel);
        form.onsubmit=async e=>{e.preventDefault();if(!form.reportValidity())return;save.disabled=true;
          const payload={district:district.value,person_name:name.value.trim(),jabatan:job.value.trim(),sort_order:Number(order.value),published:published.checked};
          const q=row.id?client.from('dpc_members').update(payload).eq('id',row.id):client.from('dpc_members').insert(payload);
          try {const r=await q.select('id');if(r.error||!r.data?.length)throw Error(); await load();}catch{msg.textContent='Gagal menyimpan. Periksa koneksi dan hak akses; isian tetap tersedia.';save.disabled=false;}
        };
        if(row.id){const del=node('button','Hapus','admin-button');del.type='button';form.append(del);del.onclick=async()=>{if(!confirm(`Hapus ${row.person_name} dari direktori DPC? Data KTA tidak dihapus.`))return;del.disabled=true;try{const r=await client.from('dpc_members').delete().eq('id',row.id).select('id');if(r.error||!r.data?.length)throw Error();await load();}catch{msg.textContent='Gagal menghapus. Coba lagi setelah memeriksa koneksi/hak akses.';del.disabled=false;}};}
        name.focus();
      }
    }
    await load();
  }
  async function publicDirectory() {
    const mount=document.getElementById('dpc-directory');if(!mount)return;
    const cfg=window.GMPI_SUPABASE_CONFIG||{};const root=(cfg.url||'').replace(/\/$/,'');
    const label=node('label','Pilih DPC Kecamatan');const filter=node('select');filter.append(node('option','Semua kecamatan'));filter.options[0].value='';districts.forEach(d=>{const o=node('option',d);o.value=d;filter.append(o);});label.append(filter);
    const results=node('div',null,'dpc-grid'),status=node('p');status.setAttribute('role','status');const more=node('button','Muat berikutnya','button');more.type='button';mount.replaceChildren(label,status,results,more);
    let page=0,seq=0;
    async function load(reset) {
      const request=++seq;if(reset){page=0;results.replaceChildren();}filter.disabled=true;more.disabled=true;status.textContent='Memuat susunan DPC…';
      try {
        if(!root||!cfg.publishableKey)throw Error();
        const query=new URLSearchParams({select:'id,district,person_name,jabatan',published:'eq.true',order:'district.asc,sort_order.asc,id.asc',limit:'100',offset:String(page*100)});
        if(filter.value)query.set('district',`eq.${filter.value}`);
        const res=await fetch(`${root}/rest/v1/dpc_members?${query}`,{headers:{apikey:cfg.publishableKey,Authorization:`Bearer ${cfg.publishableKey}`}});if(!res.ok)throw Error();const rows=await res.json();if(!Array.isArray(rows))throw Error();if(request!==seq)return;
        rows.forEach(r=>{const card=node('article',null,'dpc-person');card.append(node('span',`DPC ${r.district}`),node('h3',r.person_name),node('p',r.jabatan));results.append(card);});
        status.textContent=results.children.length?'Susunan yang telah diterbitkan pengurus.':'Belum ada susunan DPC yang diterbitkan untuk pilihan ini.';more.hidden=rows.length<100;more.textContent='Muat berikutnya';page++;
      }catch{status.textContent='Informasi DPC belum dapat dimuat. Silakan coba lagi nanti.';more.hidden=false;more.textContent='Coba lagi';}
      finally{if(request===seq){filter.disabled=false;more.disabled=false;}}
    }
    filter.onchange=()=>load(true);more.onclick=()=>load(false);await load(true);
  }
  window.GMPIDpc={admin,districts}; publicDirectory();
})();
