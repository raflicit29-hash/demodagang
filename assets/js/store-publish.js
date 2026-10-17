/* MR ALL IN Business -> Store publishing bridge.
 * Publishes only selected catalog fields; no internal financial/snapshot data.
 */
(function () {
  'use strict';
  var ADMIN_EMAIL='raflicit29@gmail.com';
  var DB_KEY='mrall_business_cutover_20261014_v2';
  var SELECTION_KEY='mrall_business_store_publish_selection_v1';
  var items=[];
  var autoSyncTimer=null,autoSyncBusy=false,autoSyncPending=false;
  function byId(id){return document.getElementById(id)}
  function clean(v){return String(v==null?'':v).trim().replace(/\s+/g,' ')}
  function norm(v){return clean(v).toLowerCase()}
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]})}
  function hash(s){var h=2166136261;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0).toString(16).padStart(8,'0')}
  function sourceKey(type,fields){return type+':'+hash(JSON.stringify(fields.map(norm)))}
  async function requireAdmin(){
    if(typeof window.v2StorePublishAuth!=='function')throw new Error('Cloud Business belum siap. Refresh halaman lalu buka lagi menu Cloud.');
    var pair=await window.v2StorePublishAuth(),user=pair&&pair.user,client=pair&&pair.client;
    if(!user||!client)throw new Error('Masuk ke Cloud Business terlebih dahulu.');
    if(norm(user.email)!==ADMIN_EMAIL)throw new Error('Gunakan akun admin Store '+ADMIN_EMAIL+' pada Cloud Business. Data lokal tetap aman ketika akun cloud diganti.');
    return{client:client,user:user};
  }
  function readDb(){
    var raw=localStorage.getItem(DB_KEY);if(!raw)throw new Error('Data Business lokal tidak ditemukan.');
    var data=JSON.parse(raw);if(!data||!Array.isArray(data.cat))throw new Error('Format data Business lokal tidak valid.');
    if(!Array.isArray(data.bulk))data.bulk=[];return data;
  }
  function makeItems(data,existingKeys){
    var map=new Map(),allowed={Ready:true,'STOK RETUR':true,SOLD:true};
    (data.cat||[]).forEach(function(row){
      if(!row||!allowed[row.status]||!clean(row.model))return;
      var stableFields=[row.model,row.cap,row.brand,row.healthReturn||row.health,row.cat];
      var key=sourceKey('cat',stableFields);
      if(!map.has(key))map.set(key,{source_key:key,match_key:norm([row.brand,row.model,row.cap].map(clean).filter(Boolean).join(' ')),name:[row.brand,row.model,row.cap,row.healthReturn||row.health].map(clean).filter(Boolean).join(' '),price:0,category:clean(row.cat)||'Hardware',stock:0,latestDate:''});
      var g=map.get(key);
      if(row.status==='Ready'||row.status==='STOK RETUR')g.stock++;
      if(row.status==='Ready'||row.status==='STOK RETUR'){
        var date=clean(row.date);
        if(Number(row.sell)>0&&(!g.price||date>=g.latestDate)){g.price=Math.floor(Number(row.sell));g.latestDate=date}
      }
      if(row.status==='SOLD'&&Number(row.sell)>0&&!g.price)g.price=Math.floor(Number(row.sell));
    });
    var result=[];
    map.forEach(function(g){
      if(g.price<1)return;
      if(g.stock>0||existingKeys.has(g.source_key))result.push({source_key:g.source_key,match_key:g.match_key,name:g.name,price:g.price,stock:g.stock,category:g.category,image_url:null,product_status:g.stock>0?'ready':'sold',published:true});
    });
    (data.bulk||[]).forEach(function(row){
      if(!row||!clean(row.model))return;
      var batches=row.batches||[],stock=batches.reduce(function(sum,b){return sum+Math.max(0,Math.floor(Number(b.remaining)||0))},0);
      var available=batches.filter(function(b){return Math.max(0,Number(b.remaining)||0)>0});
      var price=available.length?Math.floor(Number(available[available.length-1].sellPer)||0):Math.floor(Number(row.defaultSell)||0);
      var key=sourceKey('bulk',[row.id||row.model,row.cap,row.cat]);
      if((stock<1&&!existingKeys.has(key))||price<1)return;
      result.push({source_key:key,match_key:norm([row.brand,row.model,row.cap].map(clean).filter(Boolean).join(' ')),name:[row.brand,row.model,row.cap,row.health||row.healthReturn].map(clean).filter(Boolean).join(' '),price:price,stock:stock,category:clean(row.cat)||'Hardware',image_url:null,product_status:stock>0?'ready':'sold',published:true});
    });
    return result.sort(function(a,b){return a.name.localeCompare(b.name)});
  }
  function message(text,good){var el=byId('v2StorePublishStatus');if(el){el.textContent=text;el.style.borderColor=good?'#238d60':'#6d5a36'}}
  function saveSelectedKeys(keys){try{localStorage.setItem(SELECTION_KEY,JSON.stringify(keys))}catch(_){}}
  function readSelectedKeys(){try{var keys=JSON.parse(localStorage.getItem(SELECTION_KEY)||'[]');return new Set(Array.isArray(keys)?keys:[])}catch(_){return new Set()}}
  function count(){var el=byId('v2StorePublishCount');if(el)el.textContent=items.filter(function(x){return!!x.selected}).length+' produk dipilih'}
  function render(){
    var root=byId('v2StorePublishList');if(!root)return;
    if(!items.length){root.innerHTML='<div class="small">Belum ada stok dengan harga jual. Isi harga jual di Business lalu muat ulang.</div>';count();return}
    root.innerHTML=items.map(function(item,i){return '<label style="display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.10)"><input type="checkbox" data-v2-pub="'+i+'"'+(item.selected?' checked':'')+' style="margin-top:4px"><span style="flex:1;min-width:0"><b>'+esc(item.name)+'</b><br><small>'+esc(item.category)+' • '+Number(item.stock).toLocaleString('id-ID')+' unit • Rp'+Number(item.price).toLocaleString('id-ID')+(item.stock?' • STOK ADA':' • HABIS')+'</small></span></label>'}).join('');
    root.querySelectorAll('input[data-v2-pub]').forEach(function(cb){cb.addEventListener('change',function(){var item=items[Number(cb.getAttribute('data-v2-pub'))];if(item)item.selected=cb.checked;count()})});
    count();
  }
  window.v2StoreLoadPublishList=async function(){
    try{
      message('Memuat daftar stok dan publikasi sebelumnya…',false);
      var auth=await requireAdmin();
      var q=await auth.client.from('mrall_store_inventory').select('source_key,published').eq('owner_id',auth.user.id);
      if(q.error)throw q.error;
      var old=q.data||[],keys=new Set(old.filter(function(x){return x.published}).map(function(x){return x.source_key}));
      items=makeItems(readDb(),keys).map(function(x){x.selected=keys.has(x.source_key);return x});
      render();message('Daftar siap: '+items.length+' grup stok. Centang barang yang boleh tampil di Store.',true);
    }catch(e){message('Gagal memuat katalog: '+(e&&e.message?e.message:String(e))+' Pastikan SQL bridge sudah dijalankan.',false)}
  };
  window.v2StoreSyncPublish=async function(){
    var button=byId('v2StorePublishButton');if(button)button.disabled=true;
    try{
      var auth=await requireAdmin();if(!items.length)throw new Error('Muat daftar produk terlebih dahulu.');
      var selected=items.filter(function(x){return!!x.selected}).map(function(x){return{owner_id:auth.user.id,source_key:x.source_key,match_key:x.match_key,name:x.name,price:x.price,stock:x.stock,category:x.category,image_url:x.image_url,product_status:x.product_status,published:true,updated_at:new Date().toISOString()}});
      if(selected.length===0&&!window.confirm('Tidak ada produk dipilih. Ini akan menghapus SEMUA produk yang sebelumnya diterbitkan dari Business ke Store. Produk toko manual tidak akan dihapus. Yakin melanjutkan?'))return;
      if(selected.length>0&&!window.confirm('Publikasikan '+selected.length+' grup produk ke Store? Yang dikirim hanya nama, kategori, harga jual, stok, dan status. Modal, supplier, profit, utang, kas, konsumen, dan snapshot tidak dikirim. Produk yang tidak dicentang akan dihapus dari katalog sinkron. Lanjutkan?'))return;
      message('Memperbarui katalog Store…',false);
      for(var i=0;i<selected.length;i+=100){var up=await auth.client.from('mrall_store_inventory').upsert(selected.slice(i,i+100),{onConflict:'owner_id,source_key'});if(up.error)throw up.error}
      var q=await auth.client.from('mrall_store_inventory').select('source_key').eq('owner_id',auth.user.id);if(q.error)throw q.error;
      var keep=new Set(selected.map(function(x){return x.source_key})),stale=(q.data||[]).filter(function(x){return!keep.has(x.source_key)});
      for(var j=0;j<stale.length;j++){var del=await auth.client.from('mrall_store_inventory').delete().eq('owner_id',auth.user.id).eq('source_key',stale[j].source_key);if(del.error)throw del.error}
      saveSelectedKeys(selected.map(function(x){return x.source_key}));
      message('Berhasil menerbitkan '+selected.length+' grup produk. Perubahan stok berikutnya akan disinkronkan otomatis dari perangkat ini saat data disimpan.',true);
      await window.v2StoreLoadPublishList();
    }catch(e){message('Sinkron gagal: '+(e&&e.message?e.message:String(e))+'. Data Business lokal tetap aman.',false)}
    finally{if(button)button.disabled=false}
  };

  // Debounced automatic stock refresh for already-published product keys only.
  // Network errors never block or roll back the local Business save.
  window.v2StoreAutoSync=async function(){
    if(autoSyncBusy){autoSyncPending=true;return}
    var keys=readSelectedKeys();
    if(!keys.size)return;
    autoSyncBusy=true;
    try{
      var auth=await requireAdmin();
      var db=readDb();
      var selected=makeItems(db,keys).filter(function(item){return keys.has(item.source_key)});
      if(!selected.length){message('Auto-sync ditunda: produk publik tidak ditemukan pada data lokal. Buka Muat daftar stok dan sinkronkan ulang untuk merapikan katalog.',false);return}
      var rows=selected.map(function(x){return{owner_id:auth.user.id,source_key:x.source_key,match_key:x.match_key,name:x.name,price:x.price,stock:x.stock,category:x.category,image_url:x.image_url,product_status:x.product_status,published:true,updated_at:new Date().toISOString()}});
      for(var i=0;i<rows.length;i+=100){
        var up=await auth.client.from('mrall_store_inventory').upsert(rows.slice(i,i+100),{onConflict:'owner_id,source_key'});
        if(up.error)throw up.error;
      }
      message('Auto-sync stok berhasil • '+new Date().toLocaleTimeString('id-ID')+'. Halaman Store memperbarui stok maksimal sekitar 30 detik.',true);
    }catch(e){
      message('Auto-sync belum berhasil: '+(e&&e.message?e.message:String(e))+'. Data lokal Business tetap tersimpan; coba sinkron manual saat online.',false);
    }finally{autoSyncBusy=false;if(autoSyncPending){autoSyncPending=false;window.v2StoreAutoScheduleSync()}}
  };
  window.v2StoreAutoScheduleSync=function(){
    if(autoSyncTimer)clearTimeout(autoSyncTimer);
    autoSyncTimer=setTimeout(function(){window.v2StoreAutoSync()},1800);
  };

  function install(){
    var page=byId('cloudsync');if(!page||byId('v2StorePublishPanel'))return;
    var panel=document.createElement('div');panel.className='card';panel.id='v2StorePublishPanel';
    panel.innerHTML='<div class="section">🛒 Publikasikan stok ke MR ALL IN Store</div><div class="small" style="margin-bottom:10px">Pilih barang yang memang boleh tampil di website. Harga dan stok mengikuti data Business saat sinkron ditekan. Ini sinkron terkontrol, bukan realtime otomatis; ulangi setelah transaksi/perubahan stok.</div><div class="actions"><button class="btn ghost" type="button" id="v2StoreLoadButton">Muat daftar stok</button><button class="btn primary" type="button" id="v2StorePublishButton">☁ Sinkronkan pilihan ke Store</button><span id="v2StorePublishCount" class="small">0 produk dipilih</span></div><div id="v2StorePublishStatus" class="alert" style="margin-top:9px">Jalankan SQL katalog Business → Store, lalu muat daftar stok.</div><div id="v2StorePublishList" style="margin-top:8px;max-height:420px;overflow:auto"></div>';
    page.appendChild(panel);
    byId('v2StoreLoadButton').addEventListener('click',window.v2StoreLoadPublishList);
    byId('v2StorePublishButton').addEventListener('click',window.v2StoreSyncPublish);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();