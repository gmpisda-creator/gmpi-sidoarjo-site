/* Organization placement is independent of residential district. */
(function(root){
  const districts=['Balongbendo','Buduran','Candi','Gedangan','Jabon','Krembung','Krian','Porong','Prambon','Sedati','Sidoarjo','Sukodono','Taman','Tanggulangin','Tarik','Tulangan','Waru','Wonoayu'];
  function title(role,level,district){
    let base=String(role||'Anggota').trim().replace(/\s+(DPD|DPC)(\s+.*)?$/i,'');
    return level==='DPC'?`${base} DPC ${district}`:level==='DPD'?`${base} DPD`:String(role||'Anggota').trim();
  }
  function changed(card,payload){return (card.organization_level||null)!==(payload.organization_level||null)||(card.dpc_district||null)!==(payload.dpc_district||null);}
  root.GMPICardOrganization={districts,title,changed};
})(typeof window==='undefined'?globalThis:window);
