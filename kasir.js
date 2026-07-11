// kasir.js — Modul "🧠 Kasir AI" (v127, kw81-kasir-ai-pos):
// Tab checkout BARU utk halaman Bisnis Shop yang lebih cepat dari form "Transaksi Manual" (Order)
// lama: tap produk langsung dari grid (bukan pilih dari dropdown lalu klik "+ Tambah"), keranjang
// & total keliatan real-time di 1 layar yang sama, + 1 fitur AI (saran bundling/upsell dari isi
// keranjang, panggil callAIProviderRaw yang sama dipakai AIWidget/RenovAI/dst).
//
// PENTING: urutan load — taruh file ini SETELAH cobek.js di GROUP_A (lihat build.js). Kasir
// memakai fungsi/variabel dari cobek.js (recordShopSale, D.products, dst) & features-aiwidget-
// reminder-gdrive-search.js (callAIProviderRaw, aiErrorHint) — SEMUA dipanggil saat RUNTIME
// (di dalam method, bukan di top-level saat file di-load), jadi aman ditaruh di file terpisah
// selama file-file itu sudah lebih dulu ada & sudah selesai di-load duluan.
//
// TIDAK mengubah modul Order (form "🛒 Transaksi Manual" lama) sama sekali — Kasir cuma menambah
// TAB BARU di halaman Bisnis Shop yang jadi tab default, sementara "Transaksi Manual" tetap ada
// sbg cara lama/fallback (mis. kalau perlu edit harga per-line dari dropdown, dll). Kasir memakai
// fungsi recordShopSale() yang SAMA PERSIS dgn Order, jadi hasil transaksinya konsisten & tetap
// tersinkron ke Keuangan + stok Etalase seperti sebelumnya.
const Kasir={
cart:[], // {productId, qty, hargaOverride}
search:'',
priceType:'jual',
populateAccSelect(){
const el=document.getElementById('kasirAcc');
if(el)el.innerHTML=D.accounts.map(a=>`<option value="${a.id}">${a.emoji} ${escapeHtml(a.name)}</option>`).join('');
},
render(){
Kasir.populateAccSelect();
Kasir.renderGrid();
Kasir.renderCart();
},
reset(){
Kasir.cart=[];
Kasir.search='';
Kasir.priceType='jual';
const s=document.getElementById('kasirSearch');if(s)s.value='';
const d=document.getElementById('kasirDiskon');if(d)d.value='';
const o=document.getElementById('kasirOngkir');if(o)o.value='';
const cn=document.getElementById('kasirCustName');if(cn)cn.value='';
const cp=document.getElementById('kasirCustPhone');if(cp)cp.value='';
const nt=document.getElementById('kasirNote');if(nt)nt.value='';
document.querySelectorAll('#kasirPriceToggle .chip-btn').forEach((b,i)=>b.classList.toggle('active',i===0));
const aiCard=document.getElementById('kasirAiCard');if(aiCard)aiCard.style.display='none';
Kasir.render();
},
onSearch(v){
Kasir.search=(v||'').toLowerCase().trim();
Kasir.renderGrid();
},
setPriceType(type,el){
Kasir.priceType=type;
document.querySelectorAll('#kasirPriceToggle .chip-btn').forEach(b=>b.classList.remove('active'));
if(el)el.classList.add('active');
Kasir.renderGrid();
Kasir.renderCart();
},
filteredProducts(){
if(!Kasir.search)return D.products;
return D.products.filter(p=>p.name.toLowerCase().includes(Kasir.search));
},
renderGrid(){
const el=document.getElementById('kasirGrid');
if(!el)return;
if(!D.products.length){
el.innerHTML='<div class="empty"><div class="empty-icon">📦</div><div class="empty-text">Belum ada produk — tambah dulu di tab 📦 Etalase</div></div>';
return;
}
const list=Kasir.filteredProducts();
el.innerHTML=list.length?list.map(p=>{
const inCart=Kasir.cart.find(i=>i.productId===p.id);
const habis=(p.stock||0)<=0;
let harga=(Kasir.priceType==='reseller'&&p.hargaReseller)?p.hargaReseller:p.hargaJual;
if(p.diskonPersen)harga=harga-(harga*p.diskonPersen/100);
return`<div class="kasir-tile${habis?' kasir-tile-disabled':''}${inCart?' kasir-tile-active':''}"${habis?'':` data-action="Kasir.addToCart" data-args='["${p.id}"]'`}>
      <div class="kasir-tile-name">${escapeHtml(p.name)}</div>
      <div class="kasir-tile-price">${fmt(harga)}</div>
      <div class="kasir-tile-stock">${habis?'Stok habis':'Stok '+p.stock}</div>
      ${inCart?`<div class="kasir-tile-badge">${inCart.qty}</div>`:''}
    </div>`;
}).join(''):'<div class="empty"><div class="empty-text">Produk tidak ditemukan</div></div>';
},
addToCart(pid){
const p=D.products.find(x=>x.id===pid);
if(!p)return;
const existing=Kasir.cart.find(i=>i.productId===pid);
const qtyInCart=existing?existing.qty:0;
if(qtyInCart+1>(p.stock||0)){toast('⚠️ Stok "'+p.name+'" tidak cukup (sisa '+p.stock+')');return;}
if(existing)existing.qty+=1;
else Kasir.cart.push({productId:pid,qty:1,hargaOverride:null});
Kasir.renderGrid();
Kasir.renderCart();
},
changeQty(idx,delta){
const it=Kasir.cart[idx];
if(!it)return;
const p=D.products.find(x=>x.id===it.productId);
if(delta>0&&p&&it.qty+1>(p.stock||0)){toast('⚠️ Stok tidak cukup (sisa '+p.stock+')');return;}
it.qty+=delta;
if(it.qty<=0)Kasir.cart.splice(idx,1);
Kasir.renderGrid();
Kasir.renderCart();
},
removeItem(idx){
Kasir.cart.splice(idx,1);
Kasir.renderGrid();
Kasir.renderCart();
},
computeTotals(){
let subtotal=0,modal=0;
const lines=Kasir.cart.map(it=>{
const p=D.products.find(x=>x.id===it.productId);
if(!p)return null;
let hargaDefault=(Kasir.priceType==='reseller'&&p.hargaReseller)?p.hargaReseller:p.hargaJual;
if(p.diskonPersen)hargaDefault=hargaDefault-(hargaDefault*p.diskonPersen/100);
const harga=(it.hargaOverride!=null&&it.hargaOverride>0)?it.hargaOverride:hargaDefault;
const lineTotal=harga*it.qty;
subtotal+=lineTotal;modal+=(p.hargaBeli||0)*it.qty;
return{...it,product:p,harga,hargaDefault,lineTotal};
}).filter(Boolean);
const diskon=parseFloat(document.getElementById('kasirDiskon')?.value)||0;
const ongkir=parseFloat(document.getElementById('kasirOngkir')?.value)||0;
const total=Math.max(0,subtotal-diskon)+ongkir;
const profit=subtotal-modal-diskon;
return{lines,subtotal,modal,diskon,ongkir,total,profit};
},
renderCart(){
const{lines,total,profit}=Kasir.computeTotals();
const el=document.getElementById('kasirCartList');
if(el){
el.innerHTML=lines.length?lines.map((l,i)=>`
      <div class="tx-item">
        <div class="tx-icon u-bgaccsoft">🛒</div>
        <div class="tx-info">
          <div class="tx-name">${escapeHtml(l.product.name)}</div>
          <div class="tx-meta">${fmt(l.harga)} × ${l.qty} = ${fmt(l.lineTotal)}</div>
        </div>
        <div class="u-flex u-aic u-gap6">
          <button class="btn btn-ghost btn-sm" style="padding:4px 10px" data-action="Kasir.changeQty" data-args="${escapeHtml(JSON.stringify([i,-1]))}" aria-label="Kurangi jumlah">−</button>
          <span class="u-fw700">${l.qty}</span>
          <button class="btn btn-ghost btn-sm" style="padding:4px 10px" data-action="Kasir.changeQty" data-args="${escapeHtml(JSON.stringify([i,1]))}" aria-label="Tambah jumlah">+</button>
        </div>
        <button class="tx-del" data-action="Kasir.removeItem" data-args="${escapeHtml(JSON.stringify([i]))}" aria-label="Hapus">🗑</button>
      </div>`).join(''):'<div class="empty"><div class="empty-text">Keranjang kosong — tap produk di atas ⤴️</div></div>';
}
const totalEl=document.getElementById('kasirTotalDisplay');if(totalEl)totalEl.textContent=fmtFull(total);
const profitEl=document.getElementById('kasirProfitDisplay');if(profitEl)profitEl.textContent='Estimasi untung: '+fmtFull(profit);
const btn=document.getElementById('kasirCheckoutBtn');if(btn)btn.disabled=lines.length===0;
},
async aiSuggest(){
if(!D.profile.apiKey){
toast('⚠️ Isi dulu API Key AI di Pengaturan → AI Asisten');
showPage('settings',document.querySelectorAll('.nav-item')[6]);
return;
}
if(!Kasir.cart.length){toast('⚠️ Tambah produk ke keranjang dulu');return;}
const card=document.getElementById('kasirAiCard');
const body=document.getElementById('kasirAiBody');
if(card)card.style.display='block';
if(body)body.innerHTML='<div class="empty"><div class="empty-icon">🤖</div><div class="empty-text">Menyiapkan...</div></div>';
const{lines,total}=Kasir.computeTotals();
const cartSummary=lines.map(l=>`${l.product.name} x${l.qty} (sisa stok setelah ini: ${Math.max(0,l.product.stock-l.qty)})`).join(', ');
const catalog=D.products.map(p=>`${p.name} (stok ${p.stock}, harga jual ${p.hargaJual})`).join('; ')||'Tidak ada produk lain';
const systemPrompt=`Kamu asisten kasir toko kecil di Indonesia. Dari isi keranjang & katalog produk yang diberikan, beri 1-3 saran SINGKAT (maks 2 kalimat tiap saran): produk lain di katalog yang cocok ditawarkan sbg bundling/upsell ke pembeli ini, DAN/ATAU peringatan kalau ada produk di keranjang yang stoknya bakal hampir/benar-benar habis setelah transaksi ini selesai. JANGAN mengarang produk yang tidak ada di katalog. Kalau memang tidak ada saran relevan, jawab singkat saja: "Tidak ada saran khusus untuk keranjang ini." Format jawaban: bullet pendek pakai •, bahasa santai tapi sopan, TANPA kalimat pembuka/basa-basi.`;
const messages=[{role:'user',content:`Isi keranjang saat ini (total ${fmtFull(total)}): ${cartSummary}\n\nKatalog seluruh produk yang ada di etalase: ${catalog}`}];
const res=await callAIProviderRaw(systemPrompt,messages,{maxTokens:400});
if(!res.ok){
const provider=D.profile.apiProvider||'claude';
if(body)body.innerHTML=`<div class="empty"><div class="empty-text">⚠️ Gagal memuat saran${aiErrorHint(provider,res.status)}${res.errMsg?': '+escapeHtml(res.errMsg):''}</div></div>`;
return;
}
if(body)body.innerHTML=`<div style="font-size:12.5px;line-height:1.7;white-space:pre-wrap">${escapeHtml(res.text||'Tidak ada saran khusus untuk keranjang ini.')}</div>`;
},
buildReceiptText(){
const{lines,diskon,ongkir,total}=Kasir.computeTotals();
const namaToko=(D.profile&&(D.profile.namaBisnis||D.profile.nama))||'Toko';
let txt=`🧾 ${namaToko}\n${new Date().toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})}\n\n`;
lines.forEach(l=>{txt+=`${l.product.name} x${l.qty}  ${fmt(l.lineTotal)}\n`;});
if(diskon>0)txt+=`Diskon: -${fmt(diskon)}\n`;
if(ongkir>0)txt+=`Ongkir: +${fmt(ongkir)}\n`;
txt+=`\nTOTAL: ${fmt(total)}\n\nTerima kasih! 🙏`;
return txt;
},
async shareReceipt(){
if(!Kasir.cart.length){toast('⚠️ Keranjang masih kosong');return;}
const text=Kasir.buildReceiptText();
try{
if(navigator.share){await navigator.share({text});return;}
throw new Error('no_share_api');
}catch(e){
try{
await navigator.clipboard.writeText(text);
toast('📋 Struk disalin ke clipboard');
}catch(e2){
toast('⚠️ Gagal membuat struk — coba lagi');
}
}
},
checkout(){return withSaveGuard('kasir','',Kasir._checkoutInner);},
_checkoutInner(){
if(!Kasir.cart.length){toast('⚠️ Keranjang masih kosong');return;}
const{lines,subtotal,diskon,ongkir,total,profit}=Kasir.computeTotals();
const items=lines.map(l=>({productId:l.productId,name:l.product.name,qty:l.qty,harga:l.harga,lineTotal:l.lineTotal}));
const accId=document.getElementById('kasirAcc')?document.getElementById('kasirAcc').value:D.accounts[0]?.id;
const custName=(document.getElementById('kasirCustName')?.value||'').trim();
const custPhone=(document.getElementById('kasirCustPhone')?.value||'').trim();
const customer={name:custName,phone:custPhone,address:''};
const date=new Date().toISOString().split('T')[0];
const note=(document.getElementById('kasirNote')?.value||'').trim();
const txId=uid();
const result=recordShopSale({
items,subtotal,diskon,ongkir,total,profit,date,note,customer,priceType:Kasir.priceType,delivered:true,
accountId:accId,txId,existingShopId:null
});
if(!result.ok){toast('⚠️ '+result.message);return;}
const itemSummary=items.map(it=>it.name+' x'+it.qty).join(', ');
D.transactions.push({id:txId,type:'income',amount:total,category:'Bisnis',subcategory:'Cobek',accountId:accId,payMethod:'tunai',note:(customer.name?customer.name+' - ':'')+itemSummary,date,cobekLinkId:result.shopId});
save();
renderProductList();renderShop();Order.renderRecent();renderDashboard();renderKeuangan();renderSiapPulang();
toast('✅ Transaksi tersimpan & tersinkron ke Keuangan');
Kasir.reset();
}
};
