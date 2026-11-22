/* Lensa Kegiatan: textContent only, validated media paths, no HTML from database. */
(() => {
  const categories = {'aksi-sosial':'Aksi Sosial', sosial:'Silaturahmi', koordinasi:'Koordinasi', warga:'Tamu & warga'};
  const el = (tag, text, cls) => { const n=document.createElement(tag); if(text)n.textContent=text; if(cls)n.className=cls; return n; };
  const cfg=window.GMPI_SUPABASE_CONFIG||{};
  const root=(cfg.url||'').replace(/\/$/,'');
  function media(path) { return /^(photos\/[a-f0-9-]+\.(jpg|png|webp)|videos\/[a-f0-9-]+\.mp4)$/.test(path||'') ? `${root}/storage/v1/object/public/activity-media/${path}` : ''; }
  function show(post) {
    const dialog=el('dialog',null,'activity-dialog');
    const close=el('button','Tutup ×','activity-close'); close.type='button';
    dialog.setAttribute('aria-label',post.title);dialog.append(close,el('h2',post.title));
    const image=el('img');image.src=media(post.image_path);image.alt=post.title;dialog.append(image);
    if(post.event_date)dialog.append(el('p',`Tanggal kegiatan: ${post.event_date}`));
    dialog.append(el('p',post.description,'activity-description'));
    if(media(post.video_path)){const video=el('video');video.src=media(post.video_path);video.controls=true;video.playsInline=true;video.preload='none';dialog.append(video);}
    close.onclick=()=>dialog.close();dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
    dialog.addEventListener('close',()=>{dialog.querySelectorAll('video').forEach(v=>v.pause());dialog.remove();});
    document.body.append(dialog);dialog.showModal();close.focus();
  }
  async function admin({client,workspace,setMessage}) {
    workspace.replaceChildren(el('p','Memuat Lensa Kegiatan…'));
    const result=await client.from('activity_posts').select('*').order('created_at',{ascending:false}).limit(200);
    if(result.error){workspace.replaceChildren(el('h3','Lensa Kegiatan'),el('p','Modul belum dapat dimuat. Pastikan migrasi 202610310038_lensa_kegiatan.sql sudah dijalankan dan akun memiliki akses Pemilik/Editor Situs.'));return;}
    workspace.replaceChildren(el('h3','Lensa Kegiatan'),el('p','Kelola dokumentasi kegiatan. Teks draf tidak tampil di beranda. Foto/video yang diunggah memiliki URL publik, termasuk saat draf atau disembunyikan; jangan unggah KTP atau dokumen pribadi.'));
    const add=el('button','Tambah kegiatan','admin-button');add.type='button';
    const slot=el('div');const list=el('div');workspace.append(add,slot,list);
    add.onclick=()=>edit({category:'aksi-sosial',status:'draft'});
    for(const post of result.data||[]){const row=el('div',null,'activity-admin-row');const editBtn=el('button','Ubah','admin-button admin-button-outline');editBtn.type='button';editBtn.onclick=()=>edit(post);row.append(el('strong',post.title),el('span',`${categories[post.category]} · ${{draft:'Draf',published:'Tayang',hidden:'Disembunyikan'}[post.status]}`),editBtn);list.append(row);}
    function edit(post){
      slot.replaceChildren();const form=el('form',null,'activity-editor');slot.append(form);
      const fields={};
      function field(name,label,type,value){const wrap=el('label',label);const input=el(type==='textarea'?'textarea':type==='select'?'select':'input');if(!['textarea','select'].includes(type))input.type=type;input.name=name;input.value=value||'';wrap.append(input);form.append(wrap);fields[name]=input;return input;}
      const title=field('title','Judul kegiatan','text',post.title);title.required=true;title.maxLength=160;
      const desc=field('description','Keterangan kegiatan (hanya fakta yang sudah dipastikan)','textarea',post.description);desc.maxLength=12000;desc.rows=5;
      const category=field('category','Kategori','select');for(const [value,label]of Object.entries(categories))category.add(new Option(label,value));category.value=post.category;
      field('event_date','Tanggal kegiatan — boleh kosong jika belum diketahui','date',post.event_date);
      const image=field('image','Foto sampul — JPG/PNG/WebP, maksimal 5 MB','file');image.accept='image/jpeg,image/png,image/webp';image.required=!post.image_path;
      const video=field('video','Video opsional — MP4, maksimal 25 MB','file');video.accept='video/mp4';
      const removeVideo=field('remove_video','Hapus video dari kegiatan ini','checkbox');
      const status=field('status','Status','select');for(const [value,label]of Object.entries({draft:'Draf',published:'Tayang',hidden:'Disembunyikan'}))status.add(new Option(label,value));status.value=post.status;
      if(post.image_path){const preview=el('button','Lihat pratinjau tersimpan','admin-button admin-button-outline');preview.type='button';preview.onclick=()=>show(post);form.append(preview);}
      const save=el('button','Simpan kegiatan','admin-button');save.type='submit';
      const cancel=el('button','Batal','admin-button admin-button-outline');cancel.type='button';cancel.onclick=()=>slot.replaceChildren();
      form.append(save,cancel);let busy=false;
      form.onsubmit=async e=>{
        e.preventDefault();if(busy)return;if(!title.value.trim())return title.focus();
        const pic=image.files[0],clip=video.files[0];
        if(pic&&(!['image/jpeg','image/png','image/webp'].includes(pic.type)||!pic.size||pic.size>5242880))return setMessage('Foto harus JPG/PNG/WebP, maksimal 5 MB.','error');
        if(clip&&(clip.type!=='video/mp4'||!clip.size||clip.size>26214400))return setMessage('Video harus MP4, maksimal 25 MB.','error');
        busy=true;save.disabled=true;cancel.disabled=true;setMessage('Menyimpan dokumentasi…');
        async function upload(file,folder){const ext=file.type==='video/mp4'?'mp4':file.type==='image/jpeg'?'jpg':file.type.split('/')[1];const path=`${folder}/${crypto.randomUUID()}.${ext}`;const {error}=await client.storage.from('activity-media').upload(path,file,{upsert:false,contentType:file.type});if(error)throw Error('Unggah media gagal. Periksa koneksi, ukuran file, dan izin akses.');return path;}
        try{
          const payload={title:title.value.trim(),description:desc.value.trim(),category:category.value,event_date:fields.event_date.value||null,status:status.value,image_path:pic?await upload(pic,'photos'):post.image_path,video_path:clip?await upload(clip,'videos'):removeVideo.checked?null:post.video_path||null,updated_at:new Date().toISOString()};
          const q=post.id?client.from('activity_posts').update(payload).eq('id',post.id):client.from('activity_posts').insert(payload);
          const {error}=await q.select('id').single();if(error)throw Error('Penyimpanan belum berhasil dikonfirmasi. Muat ulang daftar sebelum mencoba lagi agar tidak membuat duplikat. Media mungkin sudah terunggah.');
          setMessage(payload.status==='published'?'Kegiatan tersimpan dan berstatus Tayang.':'Kegiatan tersimpan; tidak ditampilkan di beranda.');await admin({client,workspace,setMessage});
        }catch(err){setMessage(err.message||'Koneksi gagal. Muat ulang daftar untuk memastikan status penyimpanan sebelum mengulang.','error');}
        finally{busy=false;save.disabled=false;cancel.disabled=false;}
      };
      form.scrollIntoView({block:'nearest'});title.focus();
    }
  }
  window.GMPIActivities={admin};
  async function loadPublic(){
    const grid=document.querySelector('#lensa .masonry-grid');if(!grid||!root)return;
    try{
      const r=await fetch(`${root}/rest/v1/activity_posts?select=id,title,description,category,event_date,image_path,video_path&status=eq.published&order=created_at.desc&limit=100`,{headers:{apikey:cfg.publishableKey,Authorization:`Bearer ${cfg.publishableKey}`}});
      if(!r.ok)return;const rows=await r.json();const fragment=document.createDocumentFragment();
      for(const p of rows){if(!media(p.image_path)||!categories[p.category])continue;
        const tile=el('article',null,'gallery-tile tile-mid');tile.dataset.category=p.category;
        const button=el('button',null,'activity-open');button.type='button';button.setAttribute('aria-label',`Lihat dokumentasi: ${p.title}`);
        const photo=el('div',null,'photo-placeholder placeholder-red has-photo');const img=el('img',null,'gallery-photo');img.src=media(p.image_path);img.alt=p.title;img.loading='lazy';photo.append(img,el('span','DOKUMENTASI KEGIATAN','photo-label'));
        const caption=el('div',null,'tile-caption');caption.append(el('span',categories[p.category]),el('b',p.title),el('small',p.event_date||'Dokumentasi kegiatan'),el('small','Lihat foto & video →'));
        button.append(photo,caption);button.onclick=()=>show(p);tile.append(button);fragment.append(tile);
      }
      grid.prepend(fragment);const selected=document.querySelector('.filter-button.selected');if(selected)selected.click();
    }catch(_){/* Preserve existing static documentation if backend is not configured or offline. */}
  }
  loadPublic();
})();
