// cobek.js — Domain Shop: etalase/stok produk, produsen, order pelanggan, laporan omzet, data pelanggan,
// widget dashboard "🤖 Rekomendasi Harga Jual AI" (PriceRekoWidget, kw73) & "📦 Rekomendasi Restock AI"
// (StockRekoWidget, kw74) — keduanya rule-based, tanpa panggil AI/web search.
// Dipisah dari: features-etalase-piutang-renovai.js, features-renovasi-pajak-aset-order.js,
// features-budget-laporan-carnotes-pelanggan.js, features-gaji-shop-tagihan.js (kini transaksi.js),
// features-aiwidget-reminder-gdrive-search.js, backup-restore.js, modules-render.js
// PENTING: harus dimuat SETELAH features-helpers-global-security.js tidak wajib (D dipakai di dalam method, bukan top-level),
// tapi tetap taruh di GROUP_A dekat modul lain yg saling terkait (lihat build.js).
// CATATAN: dispatcher form transaksi gabungan (updateTxVehiclePanels/saveTx di transaksi.js,
// dulu di features-gaji-shop-tagihan.js) TETAP terpisah karena juga menangani domain
// BBM/Sparepart (Car Notes) — lihat PEMISAHAN-FILE-ROADMAP.md.

const Etalase={
editIdx:null,
openModal(idx){
this.editIdx=(typeof idx==='number')?idx:null;
const isEdit=this.editIdx!==null;
document.getElementById('productModalTitle').textContent=isEdit?'Edit Produk':'Tambah Produk';
const p=isEdit?D.products[this.editIdx]:null;
document.getElementById('pName').value=p?p.name:'';
document.getElementById('pStock').value=p?p.stock:'';
document.getElementById('pKategori').value=p?shopKategoriName(p.kategoriId):'';
document.getElementById('pKategoriList').innerHTML=D.cobekKategori.map(k=>`<option value="${escapeHtml(k.name)}">`).join('');
const pProdusenEl=document.getElementById('pProdusen');
if(pProdusenEl){
pProdusenEl.innerHTML='<option value="">— Tanpa produsen —</option>'+D.produsen.map(pr=>`<option value="${pr.id}">${escapeHtml(pr.name)}</option>`).join('')+'<option value="__new__">➕ Produsen Baru</option>';
pProdusenEl.value=p&&p.produsenId?p.produsenId:'';
}
document.getElementById('pBeli').value=p?p.hargaBeli:'';
document.getElementById('pJual').value=p?p.hargaJual:'';
document.getElementById('pReseller').value=p&&p.hargaReseller?p.hargaReseller:'';
document.getElementById('pDiskon').value=p&&p.diskonPersen?p.diskonPersen:'';
const pAccEl=document.getElementById('pAcc');
if(pAccEl) pAccEl.innerHTML=D.accounts.map(a=>`<option value="${a.id}">${a.emoji} ${escapeHtml(a.name)}</option>`).join('');
const hint=document.getElementById('pAccHint');
if(hint) hint.textContent=isEdit?'Hanya dipakai kalau angka Stok di atas kamu naikkan (tambah stok) — selisihnya tercatat otomatis sebagai pengeluaran modal.':'Stok awal akan tercatat otomatis sebagai pengeluaran modal dari akun ini.';
PriceReko.reset();
openModal('productModal');
},
async onProdusenChange(){
const sel=document.getElementById('pProdusen');
if(!sel)return;
if(sel.value==='__new__'){
const name=await showPromptModal({title:'Produsen Baru',message:'Nama produsen baru:',icon:'🏭'});
if(name&&name.trim()){
const np={id:'prd_'+Date.now(),name:name.trim(),contact:'',note:''};
D.produsen.push(np);
save();
sel.innerHTML='<option value="">— Tanpa produsen —</option>'+D.produsen.map(pr=>`<option value="${pr.id}">${escapeHtml(pr.name)}</option>`).join('')+'<option value="__new__">➕ Produsen Baru</option>';
sel.value=np.id;
} else { sel.value=''; }
}
const isEdit=this.editIdx!==null;
if(isEdit&&sel.value){
const p=D.products[this.editIdx];
if(p&&p.hargaByProdusen&&p.hargaByProdusen[sel.value]){
document.getElementById('pBeli').value=p.hargaByProdusen[sel.value];
}
}
},
save(){
const name=document.getElementById('pName').value.trim();
const stock=parseInt(document.getElementById('pStock').value)||0;
const kategoriName=document.getElementById('pKategori').value.trim();
const produsenSel=document.getElementById('pProdusen');
const produsenId=produsenSel&&produsenSel.value!=='__new__'?produsenSel.value:'';
const hargaBeli=parseFloat(document.getElementById('pBeli').value)||0;
const hargaJual=parseFloat(document.getElementById('pJual').value)||0;
const hargaReseller=parseFloat(document.getElementById('pReseller').value)||null;
const diskonPersen=parseFloat(document.getElementById('pDiskon').value)||0;
if(!name||!hargaJual){toast('⚠️ Lengkapi nama & harga jual');return;}
const accId=document.getElementById('pAcc')?document.getElementById('pAcc').value:D.accounts[0]?.id;
const prevStock=this.editIdx!==null?(D.products[this.editIdx].stock||0):0;
const delta=stock-prevStock;
const kategoriId=resolveShopKategori(kategoriName);
let product;
if(this.editIdx!==null){
product=D.products[this.editIdx];
Object.assign(product,{name,stock,hargaBeli,hargaJual,hargaReseller,diskonPersen,kategoriId});
} else {
product={id:'prod_'+Date.now(),name,stock,hargaBeli,hargaJual,hargaReseller,diskonPersen,kategoriId,produsenId:'',hargaByProdusen:{}};
D.products.push(product);
}
if(!product.hargaByProdusen)product.hargaByProdusen={};
if(produsenId){
product.produsenId=produsenId;
if(hargaBeli>0)product.hargaByProdusen[produsenId]=hargaBeli;
}
const produsenName=produsenId?(D.produsen.find(pr=>pr.id===produsenId)||{}).name:'';
const kategoriLabel=kategoriName?` · kategori ${kategoriName}`:'';
const produsenLabel=produsenName?` · dari ${produsenName}`:'';
if(delta>0&&hargaBeli>0){
const cost=delta*hargaBeli;
const txId=uid();
D.transactions.push({id:txId,type:'expense',amount:cost,category:'Bisnis',subcategory:'Cobek',accountId:accId,payMethod:'tunai',note:`Beli stok ${name} x${delta}${kategoriLabel}${produsenLabel} (modal shop)`,date:new Date().toISOString().split('T')[0],stockProductId:product.id,stockQty:delta,produsenId:produsenId||undefined,kategoriId:kategoriId||undefined});
save();closeModal('productModal');this.renderList();renderDashboard();renderKeuangan();
toast(`✅ Produk disimpan, +${delta} stok tercatat sbg pengeluaran ${fmtFull(cost)}`);
return;
}
save();closeModal('productModal');this.renderList();toast('✅ Produk disimpan (hanya update, tanpa transaksi)');
},
async delete(i){
if(!await askConfirm('Hapus produk ini dari etalase?'))return;
D.products.splice(i,1);save();this.renderList();toast('🗑 Dihapus');
},
renderList(){
const el=document.getElementById('productList');
if(!el)return;
if(!D.products.length){el.innerHTML='<div class="empty"><div class="empty-icon">📦</div><div class="empty-text">Belum ada produk</div></div>';return;}
el.innerHTML=D.products.map((p,i)=>{
const margin=p.hargaJual-p.hargaBeli;
const marginPct=p.hargaBeli>0?Math.round((margin/p.hargaBeli)*100):0;
const stockCls=p.stock<=2?'low':(p.stock<=5?'mid':'ok');
const stockLbl=p.stock<=2?'Menipis':(p.stock<=5?'Terbatas':'Aman');
const kat=shopKategoriName(p.kategoriId);
const prod=p.produsenId?(D.produsen.find(pr=>pr.id===p.produsenId)||{}).name:'';
const hasDiskon=p.diskonPersen>0;
const finalHarga=hasDiskon?Math.round(p.hargaJual*(1-p.diskonPersen/100)):p.hargaJual;
const priceBlock=hasDiskon
?`<div class="shop-price-strike">${fmt(p.hargaJual)}</div><div class="shop-price-final discounted">${fmt(finalHarga)}<span class="shop-diskon-badge">-${p.diskonPersen}%</span></div>`
:`<div class="shop-price-final">${fmt(p.hargaJual)}</div>`;
return`<div class="shop-product-card stock-${stockCls}">
        <div class="shop-product-head">
          <div>
            <div class="shop-product-name">${escapeHtml(p.name)}</div>
            <div class="shop-product-tags">
              ${kat?`<span class="shop-tag cat">🏷️ ${escapeHtml(kat)}</span>`:''}
              ${prod?`<span class="shop-tag">🏭 ${escapeHtml(prod)}</span>`:''}
            </div>
          </div>
          <div class="shop-stock-pill ${stockCls}">${p.stock} pcs · ${stockLbl}</div>
        </div>
        <div class="shop-product-prices">
          <div>
            <div class="shop-price-label">Harga Jual</div>
            ${priceBlock}
            <div class="shop-price-sub">Modal ${fmt(p.hargaBeli)}${p.hargaReseller?' · Reseller '+fmt(p.hargaReseller):''}</div>
          </div>
          <div class="shop-product-right">
            <div class="shop-margin-badge">+${fmt(margin)} (${marginPct}%)</div>
            <div class="shop-product-actions">
              <button data-action="openProductModal" data-args="${escapeHtml(JSON.stringify([i]))}" aria-label="Edit/Buka">✏️</button>
              <button data-action="delProduct" data-args="${escapeHtml(JSON.stringify([i]))}" aria-label="Hapus">🗑</button>
            </div>
          </div>
        </div>
      </div>`;
}).join('');
}
};
// PriceReko — widget "Rekomendasi Harga Jual" di dalam productModal.
// Formula: (Harga Beli + Biaya Transport/unit) × (1 + Target Margin%), lalu dibulatkan ke kelipatan rapi.
// Sumber angka bantu: rata-rata margin produk lain di kategori sama (D.products), rata-rata harga/liter BBM
// terakhir (D.bbmLogs) sbg estimasi kasar biaya transport, & opsional cek kisaran harga pasar lewat AI+web search
// (pola sama seperti RefAI/EduFund.checkAI yg sudah ada — pakai D.profile.apiKey/apiProvider).
const PriceReko={
_result:0,
_marketMin:null,
_marketMax:null,
reset(){
this._result=0;this._marketMin=null;this._marketMax=null;
const panel=document.getElementById('priceRekoPanel');
if(panel)panel.classList.add('u-dnone');
const t=document.getElementById('prkTransport'); if(t)t.value='';
const m=document.getElementById('prkMargin'); if(m)m.value='';
const r=document.getElementById('prkResult'); if(r)r.textContent='Rp 0';
const b=document.getElementById('prkBreakdown'); if(b)b.textContent='';
const info=document.getElementById('prkMarketInfo'); if(info)info.textContent='';
},
toggle(){
const panel=document.getElementById('priceRekoPanel');
if(!panel)return;
const willOpen=panel.classList.contains('u-dnone');
panel.classList.toggle('u-dnone');
if(willOpen){this.prefill();this.calc();}
},
prefill(){
const marginEl=document.getElementById('prkMargin');
const kategoriName=(document.getElementById('pKategori')?.value||'').trim();
const kat=kategoriName?D.cobekKategori.find(k=>k.name.toLowerCase()===kategoriName.toLowerCase()):null;
const sejenis=kat?D.products.filter(p=>p.kategoriId===kat.id&&p.hargaBeli>0&&p.hargaJual>0):[];
let avgMargin=50;
if(sejenis.length){
const margins=sejenis.map(p=>((p.hargaJual-p.hargaBeli)/p.hargaBeli)*100).filter(m=>isFinite(m)&&m>0);
if(margins.length)avgMargin=Math.round(margins.reduce((a,b)=>a+b,0)/margins.length);
}
if(marginEl&&!marginEl.value)marginEl.value=avgMargin;
const info=document.getElementById('prkMarketInfo');
if(info&&!this._marketMin){
info.textContent=sejenis.length?`📊 ${sejenis.length} produk sejenis (${kategoriName}) dijual ${fmt(Math.min(...sejenis.map(p=>p.hargaJual)))}–${fmt(Math.max(...sejenis.map(p=>p.hargaJual)))}, rata-rata margin ${avgMargin}%.`:'';
}
},
autoFillTransport(){
const recent=(D.bbmLogs||[]).filter(b=>b.liter>0&&b.harga>0).slice(-10);
if(!recent.length){toast('⚠️ Belum ada catatan BBM yang bisa dipakai utk estimasi');return;}
const avgHarga=recent.reduce((s,b)=>s+b.harga,0)/recent.length;
const el=document.getElementById('prkTransport');
if(el)el.value=Math.round(avgHarga);
this.calc();
toast(`✅ Diisi dari rata-rata harga BBM/liter: ${fmtFull(Math.round(avgHarga))} — anggap 1 kali isi ≈ 1 kali angkut stok. Sesuaikan lagi kalau perlu, ini estimasi kasar.`,7000);
},
roundNice(v){
if(v<=0)return 0;
let step=500;
if(v>=1000000)step=50000;
else if(v>=100000)step=5000;
else if(v>=20000)step=1000;
return Math.round(v/step)*step;
},
calc(){
const modal=parseFloat(document.getElementById('pBeli')?.value)||0;
const transport=parseFloat(document.getElementById('prkTransport')?.value)||0;
const marginPct=parseFloat(document.getElementById('prkMargin')?.value)||0;
const base=modal+transport;
const result=this.roundNice(base*(1+marginPct/100));
this._result=result;
const resEl=document.getElementById('prkResult');
if(resEl)resEl.textContent=fmtFull(result);
const bdEl=document.getElementById('prkBreakdown');
if(bdEl)bdEl.textContent=base>0?`Modal ${fmt(modal)} + Transport ${fmt(transport)} = ${fmt(base)} × ${(1+marginPct/100).toFixed(2)} (margin ${marginPct||0}%)`:'Isi Harga Beli dulu di atas';
return result;
},
async checkMarketAI(){
const name=(document.getElementById('pName')?.value||'').trim();
if(!name){toast('⚠️ Isi nama produk dulu di atas');return;}
const apiKey=D.profile.apiKey;
const provider=D.profile.apiProvider||'claude';
if(!apiKey){toast('⚠️ Belum ada API Key. Isi dulu di Pengaturan → AI Asisten.');return;}
const info=document.getElementById('prkMarketInfo');
if(info)info.textContent='🔍 Mencari kisaran harga pasar via web search... (bisa 10-30 detik)';
// lint-ok-no-escape: sysPrompt ini teks prompt yang dikirim ke API AI (bukan di-render ke innerHTML), jadi tidak butuh escapeHtml(); "<angka ...>" di isi prompt cuma notasi placeholder JSON, bukan tag HTML sungguhan
const sysPrompt=`Kamu asisten riset harga pasar Indonesia. Cari kisaran HARGA JUAL ECERAN wajar (bukan harga grosir/pabrik) utk produk berikut lewat web search: "${name}". Balas HANYA JSON valid (tanpa teks lain, tanpa markdown fence):
{"hargaPasar":{"min": <angka Rp, atau null kalau tidak ketemu>, "max": <angka Rp, atau null>, "source":"<sumber & rincian singkat>"}}
Kalau tidak ketemu/tidak yakin, isi min & max dengan null dan jelaskan di source. JANGAN mengarang angka.`;
try{
const r=await callAIProviderRaw(sysPrompt,[{role:'user',content:'Cari kisaran harga jual pasar sesuai format JSON yang diminta.'}],{maxTokens:1024,webSearch:true});
if(!r.ok){
const label=provider==='gemini'?'Gemini':'Claude';
toast('❌ Gagal hubungi '+label+': '+(r.errMsg||'error tidak diketahui'));
if(info)info.textContent='';
return;
}
const textOut=r.text;
const parsed=RefAI._parseJSON(textOut);
const item=parsed&&parsed.hargaPasar;
if(!item||item.min===null||item.min===undefined||!isFinite(Number(item.min))||Number(item.min)<=0){
if(info)info.textContent='⚠️ AI tidak menemukan harga pasar yang cukup yakin utk produk ini'+(item&&item.source?': '+item.source:'')+'.';
return;
}
const min=Math.round(Number(item.min)),max=isFinite(Number(item.max))&&Number(item.max)>0?Math.round(Number(item.max)):min;
this._marketMin=min;this._marketMax=max;
if(info)info.textContent=`📊 Harga pasar sejenis (via AI): ${fmt(min)}–${fmt(max)} · 📌 ${item.source||'sumber tidak disebutkan'}. Cek ulang ke toko/marketplace ya, ini estimasi AI.`;
}catch(e){
if(info)info.textContent='⚠️ Gagal cek: '+(e.message||String(e));
}
},
apply(){
const result=this.calc();
if(!result){toast('⚠️ Isi Harga Beli/Modal dulu sebelum pakai rekomendasi');return;}
document.getElementById('pJual').value=result;
const resellerEl=document.getElementById('pReseller');
if(resellerEl&&!resellerEl.value){
const modal=parseFloat(document.getElementById('pBeli')?.value)||0;
const transport=parseFloat(document.getElementById('prkTransport')?.value)||0;
const marginPct=parseFloat(document.getElementById('prkMargin')?.value)||0;
const resellerMargin=marginPct*0.6;
resellerEl.value=this.roundNice((modal+transport)*(1+resellerMargin/100));
}
toast('✅ Harga Jual (& Reseller kalau kosong) terisi dari rekomendasi');
}
};
// PriceRekoWidget — widget dashboard "🤖 Rekomendasi Harga Jual AI" di tab Etalase (kartu di atas
// daftar produk). Beda dari PriceReko di atas (yang manual, per-produk, di dalam productModal):
// widget ini SCAN OTOMATIS semua produk yang sudah punya Harga Beli & Harga Jual, bandingkan Harga
// Jual sekarang dengan estimasi rule-based (margin rata-rata produk sejenis sekategori + rata-rata
// biaya transport dari BBM terakhir — formula sama seperti PriceReko.calc), lalu tandai produk yang
// harganya menyimpang >=THRESHOLD_PCT dari estimasi (kemahalan ATAU kemurahan).
// SENGAJA TIDAK memanggil AI/web search (gratis & instan, jalan tiap render tanpa kuota/API key) —
// kalau mau verifikasi ke harga pasar sungguhan, tombol "🔍" di tiap baris membuka productModal
// produk itu & otomatis buka panel PriceReko yang sudah ada, tinggal tap "🔍 Cek Harga Pasar via AI".
const PriceRekoWidget={
THRESHOLD_PCT:15,
avgTransport(){
const recent=(D.bbmLogs||[]).filter(b=>b.liter>0&&b.harga>0).slice(-10);
if(!recent.length)return 0;
return recent.reduce((s,b)=>s+b.harga,0)/recent.length;
},
avgMarginForKategori(kategoriId,excludeId){
const sejenis=(D.products||[]).filter(p=>p.kategoriId===kategoriId&&p.id!==excludeId&&p.hargaBeli>0&&p.hargaJual>0);
if(!sejenis.length)return 50;
const margins=sejenis.map(p=>((p.hargaJual-p.hargaBeli)/p.hargaBeli)*100).filter(m=>isFinite(m)&&m>0);
if(!margins.length)return 50;
return margins.reduce((a,b)=>a+b,0)/margins.length;
},
recommend(p){
const transport=this.avgTransport();
const marginPct=this.avgMarginForKategori(p.kategoriId,p.id);
const base=(p.hargaBeli||0)+transport;
return PriceReko.roundNice(base*(1+marginPct/100));
},
scan(){
return(D.products||[]).filter(p=>p.hargaBeli>0&&p.hargaJual>0).map(p=>{
const reko=this.recommend(p);
const diffPct=reko>0?((p.hargaJual-reko)/reko)*100:0;
return{product:p,reko,diffPct};
}).filter(x=>x.reko>0&&Math.abs(x.diffPct)>=this.THRESHOLD_PCT)
.sort((a,b)=>Math.abs(b.diffPct)-Math.abs(a.diffPct));
},
render(){
const card=document.getElementById('priceRekoWidgetCard');
const list=document.getElementById('priceRekoWidgetList');
if(!card||!list)return;
const flagged=this.scan();
if(!flagged.length){card.style.display='none';list.innerHTML='';return;}
card.style.display='';
list.innerHTML=flagged.map(({product,reko,diffPct})=>{
const under=diffPct<0;
const badgeColor=under?'var(--accent2)':'var(--accent4)';
const badgeText=under?`⬇️ ${Math.abs(Math.round(diffPct))}% di bawah estimasi`:`⬆️ ${Math.round(diffPct)}% di atas estimasi`;
return`<div class="tx-item">
        <div class="tx-icon u-bgaccsoft">🪨</div>
        <div class="tx-info"><div class="tx-name">${escapeHtml(product.name)}</div>
          <div class="tx-meta">Sekarang ${fmt(product.hargaJual)} → Estimasi ${fmt(reko)}</div>
          <div class="tx-meta u-mt2" style="color:${badgeColor};font-weight:700">${badgeText}</div>
        </div>
        <button class="tx-del u-bgaccsoft u-cacc" style="margin-right:6px" data-action="applyPriceRekoWidgetOne" data-args="${escapeHtml(JSON.stringify([product.id]))}" aria-label="Terapkan">✅</button>
        <button class="tx-del" data-action="openPriceRekoWidgetDetail" data-args="${escapeHtml(JSON.stringify([product.id]))}" aria-label="Detail">🔍</button>
      </div>`;
}).join('');
},
async applyOne(productId){
const idx=(D.products||[]).findIndex(p=>p.id===productId);
if(idx<0)return;
const p=D.products[idx];
const reko=this.recommend(p);
if(!reko){toast('⚠️ Tidak bisa hitung estimasi (isi dulu Harga Beli)');return;}
if(!await askConfirm(`Ubah Harga Jual "${p.name}" dari ${fmt(p.hargaJual)} jadi ${fmt(reko)}?`))return;
p.hargaJual=reko;
save();this.render();renderProductList();
toast(`✅ Harga Jual "${p.name}" diperbarui ke ${fmtFull(reko)}`);
},
openDetail(productId){
const idx=(D.products||[]).findIndex(p=>p.id===productId);
if(idx<0)return;
Etalase.openModal(idx);
// otomatis buka panel "Rekomendasi Harga Jual" yg sudah ada di productModal, biar tinggal tap
// "🔍 Cek Harga Pasar via AI" tanpa perlu cari-cari tombolnya lagi
setTimeout(()=>{const panel=document.getElementById('priceRekoPanel');if(panel&&panel.classList.contains('u-dnone'))PriceReko.toggle();},50);
}
};
// StockRekoWidget — widget dashboard "📦 Rekomendasi Restock AI" di tab Etalase, di bawah
// PriceRekoWidget. Sama-sama rule-based & gratis (tanpa panggil AI/web search): hitung kecepatan
// jual tiap produk dari histori Penjualan Shop (D.cobek, LOOKBACK_DAYS terakhir), lalu bandingkan
// sisa stok dgn kecepatan itu buat estimasi "berapa hari lagi stok habis" & "berapa unit perlu
// ditambah supaya cukup utk COVER_DAYS ke depan". Produk tanpa histori penjualan tapi stoknya sudah
// ≤2 tetap ditandai (mode "belum cukup data") supaya tidak lolos dari perhatian.
const StockRekoWidget={
LOOKBACK_DAYS:30,
COVER_DAYS:30,
URGENT_DAYS:14,
soldQty(productId,days){
const since=new Date();since.setDate(since.getDate()-days);
let qty=0;
(D.cobek||[]).forEach(c=>{
if(!c.items)return;
const d=new Date(c.date);
if(isNaN(d)||d<since)return;
c.items.forEach(it=>{if(it.productId===productId)qty+=(it.qty||0);});
});
return qty;
},
scan(){
return(D.products||[]).map(p=>{
const stock=p.stock||0;
const sold=this.soldQty(p.id,this.LOOKBACK_DAYS);
const velocity=sold/this.LOOKBACK_DAYS;
const hasHistory=sold>0;
const daysLeft=hasHistory?stock/velocity:(stock<=2?0:Infinity);
const restockQty=hasHistory?Math.max(0,Math.ceil(velocity*this.COVER_DAYS-stock)):(stock<=2?5:0);
return{product:p,sold,velocity,hasHistory,daysLeft,restockQty};
}).filter(x=>x.daysLeft<=this.URGENT_DAYS&&(x.hasHistory||x.product.stock<=2))
.sort((a,b)=>a.daysLeft-b.daysLeft);
},
render(){
const card=document.getElementById('stockRekoWidgetCard');
const list=document.getElementById('stockRekoWidgetList');
if(!card||!list)return;
const flagged=this.scan();
if(!flagged.length){card.style.display='none';list.innerHTML='';return;}
card.style.display='';
list.innerHTML=flagged.map(({product,hasHistory,velocity,daysLeft,restockQty})=>{
const badgeText=hasHistory
?`⏳ Estimasi ~${Math.max(0,Math.round(daysLeft))} hari lagi habis (rata-rata jual ${(velocity*7).toFixed(1)}/minggu)`
:'⚠️ Stok menipis, belum cukup data histori penjualan';
return`<div class="tx-item">
        <div class="tx-icon u-bgaccsoft">📦</div>
        <div class="tx-info"><div class="tx-name">${escapeHtml(product.name)}</div>
          <div class="tx-meta">Sisa stok: ${product.stock||0}${restockQty>0?` · Saran tambah ${restockQty} unit`:''}</div>
          <div class="tx-meta u-mt2" style="color:var(--accent2);font-weight:700">${badgeText}</div>
        </div>
        <button class="tx-del" data-action="openStockRekoWidgetDetail" data-args="${escapeHtml(JSON.stringify([product.id,restockQty]))}" aria-label="Detail">🔍</button>
      </div>`;
}).join('');
},
openDetail(productId,restockQty){
const idx=(D.products||[]).findIndex(p=>p.id===productId);
if(idx<0)return;
Etalase.openModal(idx);
// prefill kolom Stok dgn saran stok baru (stok sekarang + restockQty), user tetap pilih akun &
// bisa ubah angkanya sendiri sebelum simpan (sama seperti nambah stok manual biasa)
if(restockQty>0){
setTimeout(()=>{
const stockEl=document.getElementById('pStock');
if(stockEl)stockEl.value=(D.products[idx].stock||0)+restockQty;
},50);
}
}
};
const Produsen={
editId:null,
hargaEditId:null,
openModal(id){
this.editId=id||null;
const isEdit=!!this.editId;
const pr=isEdit?D.produsen.find(x=>x.id===this.editId):null;
document.getElementById('produsenModalTitle').textContent=isEdit?'Edit Produsen':'Tambah Produsen';
document.getElementById('prName').value=pr?pr.name:'';
document.getElementById('prContact').value=pr?(pr.contact||''):'';
document.getElementById('prNote').value=pr?(pr.note||''):'';
openModal('produsenModal');
},
save(){
const name=document.getElementById('prName').value.trim();
const contact=document.getElementById('prContact').value.trim();
const note=document.getElementById('prNote').value.trim();
if(!name){toast('⚠️ Nama produsen wajib diisi');return;}
if(this.editId){
const pr=D.produsen.find(x=>x.id===this.editId);
if(pr)Object.assign(pr,{name,contact,note});
} else {
D.produsen.push({id:'prd_'+Date.now(),name,contact,note});
}
this.editId=null;
save();closeModal('produsenModal');this.renderList();toast('✅ Produsen disimpan');
},
async delete(id){
if(!await askConfirm('Hapus produsen ini? Harga yang sudah tercatat di produk tidak akan terhapus otomatis.'))return;
D.produsen=D.produsen.filter(x=>x.id!==id);
D.products.forEach(p=>{if(p.produsenId===id)p.produsenId='';});
save();this.renderList();toast('🗑 Produsen dihapus');
},
renderList(){
const el=document.getElementById('produsenList');
if(!el)return;
if(!D.produsen.length){el.innerHTML='<div class="empty"><div class="empty-icon">🏭</div><div class="empty-text">Belum ada produsen</div></div>';return;}
el.innerHTML=D.produsen.map(pr=>{
const products=D.products.filter(p=>p.hargaByProdusen&&p.hargaByProdusen[pr.id]!==undefined);
const hargaInfo=products.length?products.map(p=>`${escapeHtml(p.name)}: ${fmt(p.hargaByProdusen[pr.id])}`).join(', '):'Belum ada harga produk';
return`<div class="tx-item">
        <div class="tx-icon" style="background:var(--accent2-soft)">🏭</div>
        <div class="tx-info"><div class="tx-name">${escapeHtml(pr.name)}</div><div class="tx-meta">${pr.contact?'📞 '+escapeHtml(pr.contact)+' · ':''}${escapeHtml(hargaInfo)}</div></div>
        <button class="tx-del u-cacc3" style="background:var(--accent3-soft);margin-right:6px" data-action="openProdusenHargaModal" data-args="${escapeHtml(JSON.stringify([pr.id]))}" aria-label="Edit/Buka">💰</button>
        <button class="tx-del u-bgaccsoft u-cacc" style="margin-right:6px" data-action="openProdusenModal" data-args="${escapeHtml(JSON.stringify([pr.id]))}" aria-label="Edit/Buka">✏️</button>
        <button class="tx-del" data-action="delProdusen" data-args="${escapeHtml(JSON.stringify([pr.id]))}" aria-label="Hapus">🗑</button>
      </div>`;
}).join('');
},
openHargaModal(produsenId){
this.hargaEditId=produsenId;
const pr=D.produsen.find(x=>x.id===produsenId);
if(!pr)return;
document.getElementById('produsenHargaTitle').textContent='Atur Harga — '+pr.name;
const el=document.getElementById('produsenHargaList');
if(!D.products.length){
el.innerHTML='<div class="empty"><div class="empty-text">Belum ada produk di Etalase</div></div>';
} else {
el.innerHTML=D.products.map(p=>{
const harga=(p.hargaByProdusen&&p.hargaByProdusen[produsenId]!==undefined)?p.hargaByProdusen[produsenId]:'';
return`<div class="fg"><label class="fl">${escapeHtml(p.name)} <span class="u-t2">(harga jual ${fmt(p.hargaJual)})</span></label><input type="number" class="fi" data-prod-id="${p.id}" placeholder="Harga beli dari ${escapeHtml(pr.name)}" value="${harga}"></div>`;
}).join('');
}
openModal('produsenHargaModal');
},
saveHarga(){
if(!this.hargaEditId)return;
const inputs=document.querySelectorAll('#produsenHargaList input[data-prod-id]');
inputs.forEach(inp=>{
const p=D.products.find(x=>x.id===inp.getAttribute('data-prod-id'));
if(!p)return;
if(!p.hargaByProdusen)p.hargaByProdusen={};
const val=parseFloat(inp.value);
if(val>0)p.hargaByProdusen[this.hargaEditId]=val;
else delete p.hargaByProdusen[this.hargaEditId];
});
save();closeModal('produsenHargaModal');this.renderList();renderProductList();toast('✅ Harga produsen disimpan');
}
};

const SiapPulang={
toggleDeliveredField(){
const cb=document.getElementById('oDelivered');
const lbl=document.getElementById('oDeliveredLbl');
if(!cb||!lbl)return;
lbl.textContent=cb.checked?'✅ Sudah diserahkan ke pelanggan':'📦 Belum diserahkan (akan dibawa pulang)';
},
markDelivered(id){
const t=D.cobek.find(x=>x.id===id);
if(!t)return;
t.delivered=true;
save();this.render();renderShop();renderShopRecent();toast('✅ Ditandai sudah diserahkan');
},
render(){
const wrap=document.getElementById('siapPulangCard');
if(!wrap)return;
const pending=D.cobek.filter(c=>c.items && c.delivered===false);
if(!pending.length){wrap.style.display='none';wrap.innerHTML='';return;}
wrap.classList.remove('u-dnone');wrap.style.display='block';
const totalItems={};
pending.forEach(c=>c.items.forEach(i=>{totalItems[i.name]=(totalItems[i.name]||0)+i.qty;}));
const checklistHTML=Object.entries(totalItems).map(([name,qty])=>`<div class="siap-pulang-item"><span class="u-fs18">🪨</span><div class="u-flex1 u-fs13 u-fw600">${escapeHtml(name)}</div><span class="acc-chip">${qty}x</span></div>`).join('');
const ordersHTML=pending.map(c=>`
      <div class="siap-pulang-item">
        <div class="u-flex1">
          <div class="u-fs13 u-fw600">${c.customer&&c.customer.name?escapeHtml(c.customer.name):'Pelanggan'} · ${escapeHtml(c.items.map(i=>i.name+' x'+i.qty).join(', '))}</div>
          <div class="u-fs12t2">${c.date}${c.customer&&c.customer.phone?' · '+escapeHtml(c.customer.phone):''}</div>
        </div>
        <button class="btn btn-sm btn-primary" data-action="markShopDelivered" data-args="${escapeHtml(JSON.stringify([c.id]))}" aria-label="Hapus">✅ Sudah</button>
      </div>`).join('');
wrap.innerHTML=`
      <div class="card-title">📦 Siap Pulang — Barang Dibawa</div>
      <div class="u-fs12 u-t2 u-mb8">Pre-order pelanggan yang belum diserahkan. Pastikan dibawa pas pulang ke Pekalongan ya!</div>
      ${checklistHTML}
      <div class="div"></div>
      ${ordersHTML}
    `;
}
};

const Order={
items:[],
populateProductSelect(){
const sel=document.getElementById('oProductSelect');
if(!sel)return;
sel.innerHTML=D.products.map(p=>`<option value="${p.id}">${escapeHtml(p.name)} (stok ${p.stock})</option>`).join('')||'<option value="">Belum ada produk di etalase</option>';
},
openModal(){
if(!D.products.length){toast('⚠️ Tambah produk di Etalase dulu');return;}
Order.items=[];
document.getElementById('oDate').value=new Date().toISOString().split('T')[0];
['oCustName','oCustPhone','oCustAddr','oNote'].forEach(id=>document.getElementById(id).value='');
document.getElementById('oDiskon').value='';
document.getElementById('oOngkir').value='';
document.getElementById('oPriceType').value='jual';
const oCustHintEl=document.getElementById('oCustHint'); if(oCustHintEl){oCustHintEl.style.display='none';oCustHintEl.innerHTML='';}
const oDeliveredEl=document.getElementById('oDelivered'); if(oDeliveredEl){oDeliveredEl.checked=true;toggleOrderDeliveredField();}
const oAccEl=document.getElementById('oAcc');
if(oAccEl) oAccEl.innerHTML=D.accounts.map(a=>`<option value="${a.id}">${a.emoji} ${escapeHtml(a.name)}</option>`).join('');
Order.populateProductSelect();
Order.renderItems();
openModal('orderModal');
},
addItem(){
const pid=document.getElementById('oProductSelect').value;
const product=D.products.find(p=>p.id===pid);
if(!product){toast('⚠️ Pilih produk');return;}
const existing=Order.items.find(i=>i.productId===pid);
if(existing)existing.qty+=1;
else Order.items.push({productId:pid,qty:1,hargaOverride:null});
Order.renderItems();
},
updateItemHarga(idx,val){
const h=parseFloat(val);
if(!Order.items[idx])return;
Order.items[idx].hargaOverride=(h>0)?h:null;
const{total,profit}=Order.computeTotals();
document.getElementById('oTotalDisplay').textContent=fmtFull(total);
document.getElementById('oProfitDisplay').textContent='Estimasi untung: '+fmtFull(profit);
},
changeQty(idx,delta){
Order.items[idx].qty+=delta;
if(Order.items[idx].qty<=0)Order.items.splice(idx,1);
Order.renderItems();
},
removeItem(idx){Order.items.splice(idx,1);Order.renderItems();},
computeTotals(){
const priceType=document.getElementById('oPriceType').value;
let subtotal=0,modal=0;
const lines=Order.items.map(it=>{
const p=D.products.find(x=>x.id===it.productId);
if(!p)return null;
let hargaDefault=priceType==='reseller'&&p.hargaReseller?p.hargaReseller:p.hargaJual;
if(p.diskonPersen)hargaDefault=hargaDefault-(hargaDefault*p.diskonPersen/100);
const harga=(it.hargaOverride!=null&&it.hargaOverride>0)?it.hargaOverride:hargaDefault;
const lineTotal=harga*it.qty;
subtotal+=lineTotal;modal+=p.hargaBeli*it.qty;
return{...it,product:p,harga,hargaDefault,lineTotal};
}).filter(Boolean);
const diskon=parseFloat(document.getElementById('oDiskon').value)||0;
const ongkir=parseFloat(document.getElementById('oOngkir').value)||0;
const total=Math.max(0,subtotal-diskon)+ongkir;
const profit=subtotal-modal-diskon;
return{lines,subtotal,modal,diskon,ongkir,total,profit};
},
renderItems(){
const{lines,total,profit}=Order.computeTotals();
const el=document.getElementById('orderItemList');
el.innerHTML=lines.length?lines.map((l,i)=>`
      <div class="tx-item">
        <div class="tx-icon u-bgaccsoft">🪨</div>
        <div class="tx-info">
          <div class="tx-name">${escapeHtml(l.product.name)}</div>
          <div class="tx-meta u-flex u-aic u-gap4" style="margin-top:3px">
            <input type="number" class="fi u-fs12" value="${l.harga}" oninput="updateOrderItemHarga(${i},this.value)" placeholder="${l.hargaDefault}" inputmode="numeric" style="width:90px;padding:5px 7px" title="Harga bisa diedit manual per transaksi (mis. nego/diskon)">
            <span>x ${l.qty}${l.hargaOverride!=null&&l.hargaOverride>0&&l.hargaOverride!==l.hargaDefault?' <span class="u-cacc4">(diedit, default '+fmt(l.hargaDefault)+')</span>':''}</span>
          </div>
        </div>
        <div class="u-flex u-aic u-gap6">
          <button class="btn btn-ghost btn-sm" style="padding:4px 10px" data-action="changeOrderQty" data-args="${escapeHtml(JSON.stringify([i, -1]))}" aria-label="Kurangi jumlah">−</button>
          <span class="u-fw700">${l.qty}</span>
          <button class="btn btn-ghost btn-sm" style="padding:4px 10px" data-action="changeOrderQty" data-args="${escapeHtml(JSON.stringify([i, 1]))}" aria-label="Tambah jumlah">+</button>
        </div>
        <button class="tx-del" data-action="removeOrderItem" data-args="${escapeHtml(JSON.stringify([i]))}" aria-label="Hapus">🗑</button>
      </div>`).join(''):'<div class="empty"><div class="empty-text">Keranjang masih kosong</div></div>';
document.getElementById('oTotalDisplay').textContent=fmtFull(total);
document.getElementById('oProfitDisplay').textContent='Estimasi untung: '+fmtFull(profit);
},
save(){return withSaveGuard('order','orderModal',Order._saveInner);},
_saveInner(){
if(!Order.items.length){toast('⚠️ Keranjang masih kosong');return;}
const{lines,subtotal,diskon,ongkir,total,profit}=Order.computeTotals();
const items=lines.map(l=>({productId:l.productId,name:l.product.name,qty:l.qty,harga:l.harga,lineTotal:l.lineTotal}));
const customer={name:document.getElementById('oCustName').value.trim(),phone:document.getElementById('oCustPhone').value.trim(),address:document.getElementById('oCustAddr').value.trim()};
const accId=document.getElementById('oAcc')?document.getElementById('oAcc').value:D.accounts[0]?.id;
const date=document.getElementById('oDate').value;
const priceType=document.getElementById('oPriceType').value;
const delivered=document.getElementById('oDelivered')?document.getElementById('oDelivered').checked:true;
const note=document.getElementById('oNote').value;
const txId=uid();
const result=recordShopSale({
items,subtotal,diskon,ongkir,total,profit,date,note,customer,priceType,delivered,
accountId:accId,txId,existingShopId:null
});
if(!result.ok){toast('⚠️ '+result.message);return;}
const itemSummary=items.map(it=>it.name+' x'+it.qty).join(', ');
D.transactions.push({id:txId,type:'income',amount:total,category:'Bisnis',subcategory:'Cobek',accountId:accId,payMethod:'tunai',note:(customer.name?customer.name+' - ':'')+itemSummary,date,cobekLinkId:result.shopId});
save();closeModal('orderModal');renderProductList();renderShop();Order.renderRecent();renderDashboard();renderKeuangan();renderSiapPulang();toast('✅ Transaksi tersimpan & tersinkron ke Keuangan');
},
renderRecent(){
const el=document.getElementById('shopRecentList');
if(!el)return;
const sorted=[...D.cobek].sort((a,b)=>(b.id||0)-(a.id||0)).slice(0,5);
el.innerHTML=sorted.length?sorted.map(t=>Order.rowHTML(t)).join(''):'<div class="empty"><div class="empty-icon">🪨</div><div class="empty-text">Belum ada transaksi</div></div>';
},
rowHTML(t){
if(t.items){
const itemSummary=t.items.map(i=>i.name+' x'+i.qty).join(', ');
const pendingBadge=t.delivered===false?' <span class="acc-chip u-cacc4" style="background:var(--accent4-soft)">📦 Belum diserahkan</span>':'';
return`<div class="tx-item">
        <div class="tx-icon u-bgaccsoft">🪨</div>
        <div class="tx-info"><div class="tx-name">${t.customer&&t.customer.name?escapeHtml(t.customer.name):'Transaksi'} · ${escapeHtml(itemSummary)}${pendingBadge}</div><div class="tx-meta">${t.date}${t.customer&&t.customer.phone?' · '+escapeHtml(t.customer.phone):''} ${t.note?'· '+escapeHtml(t.note):''}</div></div>
        <div class="tx-amount green">${fmt(t.total)}</div>
        <button class="tx-del" data-action="delShop" data-args="${escapeHtml(JSON.stringify([t.id]))}" aria-label="Hapus">🗑</button>
      </div>`;
}
return`<div class="tx-item">
      <div class="tx-icon u-bgaccsoft">🪨</div>
      <div class="tx-info"><div class="tx-name">${t.date} · ${t.sets} set (data lama)</div><div class="tx-meta">${escapeHtml(t.note||'Trip Shop')}</div></div>
      <div class="tx-amount green">+${fmt(t.profit)}</div>
      <button class="tx-del" data-action="delShop" data-args="${escapeHtml(JSON.stringify([t.id]))}" aria-label="Hapus">🗑</button>
    </div>`;
}
};

const Laporan={
periode:'selamanya',
setPeriode(p,el){
this.periode=p;
document.querySelectorAll('#shopPeriodeChips .chip-btn').forEach(b=>b.classList.remove('active'));el.classList.add('active');
document.getElementById('shopCustomRange').classList.toggle('u-dnone', p!=='custom');
document.getElementById('shopCustomRange').style.display='';
this.render();
},
getRange(){
if(this.periode==='selamanya')return{from:new Date(0),to:new Date(8640000000000000)};
const now=new Date();now.setHours(23,59,59,999);let from;
if(this.periode==='hari'){from=new Date();from.setHours(0,0,0,0);}
else if(this.periode==='minggu'){from=new Date();from.setDate(from.getDate()-from.getDay());from.setHours(0,0,0,0);}
else if(this.periode==='bulan'){from=new Date(now.getFullYear(),now.getMonth(),1);}
else if(this.periode==='tahun'){from=new Date(now.getFullYear(),0,1);}
else{const f=document.getElementById('shopFrom').value,t2=document.getElementById('shopTo').value;return{from:f?new Date(f):new Date(0),to:t2?new Date(t2+'T23:59:59'):now};}
return{from,to:now};
},
render(){
const {from,to}=this.getRange();
const inRange=D.cobek.filter(t=>{const d=new Date(t.date);return d>=from&&d<=to;});
document.getElementById('cTrip').textContent=inRange.length;
const omzet=inRange.reduce((s,t)=>s+(t.total||0),0);
document.getElementById('cSet').textContent=fmt(omzet);
document.getElementById('cUntung').textContent=fmt(inRange.reduce((s,t)=>s+(t.profit||0),0));
const sorted=[...inRange].sort((a,b)=>(b.id||0)-(a.id||0));
const el=document.getElementById('shopList');
if(el)el.innerHTML=sorted.length?sorted.map(t=>shopOrderRowHTML(t)).join(''):'<div class="empty"><div class="empty-icon">🪨</div><div class="empty-text">Belum ada transaksi di periode ini</div></div>';
},
async delete(id){
if(!await askConfirm('Hapus transaksi ini? Stok produk akan dikembalikan & catatan keuangan terkait juga dihapus.'))return;
const t=D.cobek.find(x=>x.id===id);
if(t&&t.items){t.items.forEach(it=>{const p=D.products.find(x=>x.id===it.productId);if(p)p.stock+=it.qty;});}
if(t&&t.txLinkId)D.transactions=D.transactions.filter(tx=>tx.id!==t.txLinkId);
D.cobek=D.cobek.filter(t=>t.id!==id);
save();this.render();renderShopRecent();renderProductList();renderDashboard();renderKeuangan();toast('🗑 Dihapus, stok & catatan keuangan dikembalikan');
},
renderGrafik(){
const el=document.getElementById('shopGrafikBars');
if(!el)return;
const now=new Date();const bars=[];
for(let i=5;i>=0;i--){
const m=(now.getMonth()-i+12)%12,y=now.getFullYear()+(now.getMonth()-i<0?-1:0);
const cobM=D.cobek.filter(c=>{const d=new Date(c.date);return d.getMonth()===m&&d.getFullYear()===y;});
const setQty=cobM.reduce((s,c)=>s+(c.items?c.items.reduce((s2,i)=>s2+i.qty,0):(c.sets||0)),0);
const omzet=cobM.reduce((s,c)=>s+(c.total||0),0);
const profit=cobM.reduce((s,c)=>s+(c.profit||0),0);
const margin=omzet>0?Math.round((profit/omzet)*100):0;
bars.push({label:MONTHS[m],setQty,margin});
}
const maxV=Math.max(...bars.map(b=>b.setQty),1);
el.innerHTML=bars.map(b=>`<div class="grafik-col"><div class="grafik-bar-group"><div class="grafik-bar" style="background:var(--accent4);opacity:0.9;height:${Math.max(4,(b.setQty/maxV)*100)}%" title="${b.setQty} set"></div></div><div class="grafik-lbl">${b.label}</div><div class="u-fs12 u-t2 u-tac u-mt2">${b.setQty}set·${b.margin}%</div></div>`).join('');
}
};

const Pelanggan={
key(cust){
let phone='',name='';
if(cust && typeof cust==='object'){phone=cust.phone||'';name=cust.name||'';}
phone=String(phone).replace(/[^0-9]/g,'');
if(phone.length>=8) return 'p_'+phone.replace(/^0/,'62');
name=String(name).trim().toLowerCase();
return name? 'n_'+name : '';
},
getOrders(cust){
const key=this.key(cust);
if(!key) return [];
return D.cobek.filter(c=>c.items && this.key(c.customer)===key).sort((a,b)=>(b.id||0)-(a.id||0));
},
aggregate(){
const map={};
D.cobek.forEach(c=>{
if(!c.items) return;
const key=this.key(c.customer);
if(!key) return;
if(!map[key]) map[key]={key,name:(c.customer&&c.customer.name)||'(Tanpa nama)',phone:(c.customer&&c.customer.phone)||'',address:(c.customer&&c.customer.address)||'',orders:[],totalOmzet:0,totalProfit:0};
map[key].orders.push(c);
map[key].totalOmzet+=c.total||0;
map[key].totalProfit+=c.profit||0;
if(c.customer&&c.customer.name) map[key].name=c.customer.name;
if(c.customer&&c.customer.phone) map[key].phone=c.customer.phone;
});
return Object.values(map).sort((a,b)=>b.orders.length-a.orders.length || b.totalOmzet-a.totalOmzet);
},
onInputChange(){
const name=document.getElementById('oCustName').value.trim();
const phone=document.getElementById('oCustPhone').value.trim();
const hintEl=document.getElementById('oCustHint');
if(!hintEl) return;
if(!name && !phone){hintEl.style.display='none';hintEl.innerHTML='';return;}
const orders=this.getOrders({name,phone});
if(!orders.length){hintEl.style.display='none';hintEl.innerHTML='';return;}
const isLangganan=orders.length>=3;
const lastOrder=orders[0];
const lastItemsTxt=lastOrder.items.map(i=>i.name+' @'+fmtFull(i.harga)).join(', ');
hintEl.style.display='block';
hintEl.innerHTML=`👤 Pelanggan lama${isLangganan?' <span class="langganan-badge">🌟 Langganan</span>':''} — sudah order ${orders.length}x.<br>Terakhir (${lastOrder.date}): ${escapeHtml(lastItemsTxt)} · total ${fmtFull(lastOrder.total)}`;
},
renderList(){
const el=document.getElementById('customerList');
if(!el) return;
const list=this.aggregate();
if(!list.length){el.innerHTML='<div class="empty"><div class="empty-icon">👤</div><div class="empty-text">Belum ada data pelanggan</div></div>';return;}
const CUSTOMER_SHOW_LIMIT=40;
const visible=list.slice(0,CUSTOMER_SHOW_LIMIT);
el.innerHTML=visible.map(c=>`
      <div class="customer-card" data-action="openCustomerDetail" data-args="${escapeHtml(JSON.stringify([c.key]))}">
        <div class="u-flex u-jcb u-aifs">
          <div>
            <div class="u-fw700 u-fs14">${escapeHtml(c.name)}${c.orders.length>=3?'<span class="langganan-badge">🌟 Langganan</span>':''}</div>
            <div class="u-fs12 u-t2 u-mt2">${c.phone?escapeHtml(c.phone)+' · ':''}${c.orders.length}x order</div>
          </div>
          <div class="u-tar">
            <div class="tx-amount green u-fs13">${fmt(c.totalOmzet)}</div>
            <div class="u-fs12t2">untung ${fmt(c.totalProfit)}</div>
          </div>
        </div>
      </div>`).join('')+(list.length>CUSTOMER_SHOW_LIMIT?`<div class="u-tac u-fs12 u-t2" style="padding:8px 0">+${list.length-CUSTOMER_SHOW_LIMIT} pelanggan lain (urutan terbawah, order lebih jarang) tidak ditampilkan</div>`:'');
},
openDetail(key){
const list=this.aggregate();
const c=list.find(x=>x.key===key);
if(!c)return;
const orders=c.orders.sort((a,b)=>(b.id||0)-(a.id||0));
const itemPriceMap={};
orders.forEach(o=>{o.items.forEach(i=>{if(!itemPriceMap[i.name])itemPriceMap[i.name]=[];itemPriceMap[i.name].push({date:o.date,harga:i.harga});});});
const priceHistHTML=Object.entries(itemPriceMap).map(([name,prices])=>{
const rows=prices.slice(0,5).map(p=>`<span class="u-fs12 u-r8" style="display:inline-block;margin:2px 6px 2px 0;background:var(--surface3);padding:3px 8px">${p.date}: ${fmtFull(p.harga)}</span>`).join('');
const consistent=new Set(prices.map(p=>p.harga)).size===1;
return `<div class="u-mb8"><div class="u-fs12 u-fw700 u-mb4">${escapeHtml(name)} ${consistent?'<span class="u-cacc3 u-fs12">✓ harga konsisten</span>':'<span class="u-cacc4 u-fs12">⚠ harga berubah</span>'}</div>${rows}</div>`;
}).join('');
const orderListHTML=orders.map(o=>shopOrderRowHTML(o)).join('');
const waMsg=`Halo ${c.name}, terima kasih sudah jadi pelanggan Shop kami ya! 🪨🙏`;
const waBtn=c.phone?`<button class="wa-btn" data-action="openWaShare" data-args="${escapeHtml(JSON.stringify([waMsg, c.phone]))}">💬 Chat WhatsApp</button>`:'';
const body=document.getElementById('customerDetailBody');
document.getElementById('customerDetailTitle').textContent=c.name+(c.orders.length>=3?' 🌟':'');
body.innerHTML=`
      <div class="u-fs12 u-t2 u-mb10">${c.phone?escapeHtml(c.phone):'Tanpa no. HP'}${c.address?' · '+escapeHtml(c.address):''}</div>
      <div class="u-flex u-gap8" style="margin-bottom:14px">${waBtn}</div>
      <div class="card-title u-p0 u-mb8">💰 Riwayat Harga per Produk</div>
      ${priceHistHTML||'<div class="u-fs12t2">Belum ada data</div>'}
      <div class="div"></div>
      <div class="card-title u-p0 u-mb8">📋 Semua Transaksi (${orders.length}x)</div>
      ${orderListHTML}
    `;
openModal('customerDetailModal');
},
_acList(){
const seen=new Set();const out=[];
for(let i=(D.cobek||[]).length-1;i>=0;i--){
const c=D.cobek[i].customer||{};
const name=(c.name||'').trim();
if(!name||seen.has(name.toLowerCase()))continue;
seen.add(name.toLowerCase());
out.push({name,phone:(c.phone||'').trim(),address:(c.address||'').trim()});
if(out.length>=50)break;
}
return out;
},
onFieldInput(field){
const idMap={name:'txShopSaleCustName',phone:'txShopSaleCustPhone',address:'txShopSaleCustAddr'};
const boxMap={name:'txShopSaleCustNameBox',phone:'txShopSaleCustPhoneBox',address:'txShopSaleCustAddrBox'};
const el=document.getElementById(idMap[field]);
const box=document.getElementById(boxMap[field]);
if(!el||!box)return;
const q=el.value.trim().toLowerCase();
const customers=this._acList();
const matches=(q?customers.filter(c=>(c[field]||'').toLowerCase().includes(q)):customers).slice(0,8);
if(!matches.length){box.style.display='none';box.innerHTML='';return;}
box.innerHTML=matches.map(c=>{
const label=field==='name'?c.name:(field==='phone'?(c.phone||'(tanpa HP)')+' — '+c.name:(c.address||'(tanpa alamat)')+' — '+c.name);
return `<div class="suggest-item" onmousedown="event.preventDefault();selectShopCustomer('${jsAttrEscape(c.name)}','${jsAttrEscape(c.phone)}','${jsAttrEscape(c.address)}')">${escapeHtml(label)}</div>`;
}).join('');
box.style.display='block';
},
select(name,phone,address){
const nameEl=document.getElementById('txShopSaleCustName');
const phoneEl=document.getElementById('txShopSaleCustPhone');
const addrEl=document.getElementById('txShopSaleCustAddr');
if(nameEl)nameEl.value=name;
if(phoneEl)phoneEl.value=phone;
if(addrEl)addrEl.value=address;
['txShopSaleCustNameBox','txShopSaleCustPhoneBox','txShopSaleCustAddrBox'].forEach(hideSuggestBox);
}
};

function acShopCustomers(){return Pelanggan._acList();}
function onShopCustFieldInput(field){return Pelanggan.onFieldInput(field);}
function selectShopCustomer(name,phone,address){return Pelanggan.select(name,phone,address);}

function resolveShopKategori(name){
name=(name||'').trim();
if(!name)return '';
let cat=D.cobekKategori.find(c=>c.name.toLowerCase()===name.toLowerCase());
if(!cat){cat={id:'ck_'+Date.now()+'_'+uid(),name};D.cobekKategori.push(cat);}
return cat.id;
}
function shopKategoriName(id){const c=D.cobekKategori.find(x=>x.id===id);return c?c.name:'';}
let curShopStockCart=[];
function resetShopStockCart(){
curShopStockCart=[];
renderShopStockCartList();
}
function populateTxShopStockSelect(){
const sel=document.getElementById('txShopStockItem');
const prodSel=document.getElementById('txShopStockProdusen');
const katList=document.getElementById('txShopKategoriList');
if(!sel)return;
const cur=sel.value;
sel.innerHTML='<option value="__new__">➕ Produk Baru</option>'+D.products.map(p=>`<option value="${p.id}">${escapeHtml(p.name)} (stok ${p.stock})</option>`).join('');
sel.value=cur&&D.products.find(p=>p.id===cur)?cur:'__new__';
if(prodSel) prodSel.innerHTML='<option value="">— Tanpa produsen —</option>'+D.produsen.map(pr=>`<option value="${pr.id}">${escapeHtml(pr.name)}</option>`).join('')+'<option value="__new__">➕ Produsen Baru</option>';
if(katList) katList.innerHTML=D.cobekKategori.map(k=>`<option value="${escapeHtml(k.name)}">`).join('');
onTxShopStockItemChange();
renderShopStockCartList();
}
function onTxShopStockItemChange(){
const sel=document.getElementById('txShopStockItem');
const wrap=document.getElementById('txShopStockNewWrap');
const jualWrap=document.getElementById('txShopStockJualWrap');
if(!sel||!wrap)return;
const isNew=sel.value==='__new__';
wrap.style.display=isNew?'block':'none';
if(jualWrap) jualWrap.style.display=isNew?'block':'none';
if(isNew){
const noteVal=document.getElementById('txNote').value.trim();
const nameEl=document.getElementById('txShopStockNewName');
if(nameEl&&!nameEl.value) nameEl.value=noteVal;
document.getElementById('txShopStockKategori').value='';
document.getElementById('txShopStockHarga').value='';
} else {
const p=D.products.find(x=>x.id===sel.value);
if(p){
document.getElementById('txShopStockKategori').value=shopKategoriName(p.kategoriId);
const prodSel=document.getElementById('txShopStockProdusen');
const curProdusen=prodSel?prodSel.value:'';
if(curProdusen&&p.hargaByProdusen&&p.hargaByProdusen[curProdusen]){
document.getElementById('txShopStockHarga').value=p.hargaByProdusen[curProdusen];
} else {
document.getElementById('txShopStockHarga').value=p.hargaBeli||'';
}
}
}
}
async function onTxShopStockProdusenChange(){
const prodSel=document.getElementById('txShopStockProdusen');
if(!prodSel)return;
if(prodSel.value==='__new__'){
const name=await showPromptModal({title:'Produsen Baru',message:'Nama produsen baru:',icon:'🏭'});
if(name&&name.trim()){
const np={id:'prd_'+Date.now(),name:name.trim(),contact:'',note:''};
D.produsen.push(np);
populateTxShopStockSelect();
prodSel.value=np.id;
save();
} else {
prodSel.value='';
}
}
const itemSel=document.getElementById('txShopStockItem');
if(itemSel&&itemSel.value!=='__new__'){
const p=D.products.find(x=>x.id===itemSel.value);
if(p&&prodSel.value&&p.hargaByProdusen&&p.hargaByProdusen[prodSel.value]){
document.getElementById('txShopStockHarga').value=p.hargaByProdusen[prodSel.value];
}
}
}
function toggleTxShopStockFields(){
const chk=document.getElementById('txAddShopStock');
const fields=document.getElementById('txShopStockFields');
if(!chk||!fields)return;
fields.style.display=chk.checked?'block':'none';
if(chk.checked) populateTxShopStockSelect();
}
function addShopStockCartItem(){
const itemSel=document.getElementById('txShopStockItem');
const qty=parseFloat(document.getElementById('txShopStockQty').value)||0;
const hargaBeli=parseFloat(document.getElementById('txShopStockHarga').value)||0;
const produsenId=document.getElementById('txShopStockProdusen').value||'';
const kategoriInput=document.getElementById('txShopStockKategori').value.trim();
if(!itemSel||!itemSel.value){toast('⚠️ Pilih produk dulu');return;}
if(qty<=0){toast('⚠️ Jumlah harus lebih dari 0');return;}
const isNew=itemSel.value==='__new__';
let name,productId=null;
if(isNew){
name=(document.getElementById('txShopStockNewName').value.trim())||document.getElementById('txNote').value.trim()||'Produk Shop Baru';
} else {
const p=D.products.find(x=>x.id===itemSel.value);
if(!p){toast('⚠️ Produk tidak ditemukan');return;}
name=p.name;productId=p.id;
}
const hargaJual=parseFloat(document.getElementById('txShopStockJual').value)||0;
curShopStockCart.push({productId,isNew,name,qty,hargaBeli,produsenId:(produsenId&&produsenId!=='__new__')?produsenId:'',kategoriInput,hargaJual});
renderShopStockCartList();
syncTxShopStockAmt();
document.getElementById('txShopStockQty').value='1';
document.getElementById('txShopStockHarga').value='';
if(document.getElementById('txShopStockJual'))document.getElementById('txShopStockJual').value='';
if(document.getElementById('txShopStockNewName'))document.getElementById('txShopStockNewName').value='';
toast(`➕ "${name}" ditambahkan ke daftar (${qty}x)`);
}
function removeShopStockCartItem(idx){
curShopStockCart.splice(idx,1);
renderShopStockCartList();
syncTxShopStockAmt();
}
/* moved to modules-render.js: renderShopStockCartList */
function syncTxShopStockAmt(){
const chk=document.getElementById('txAddShopStock');
if(!chk||!chk.checked)return;
const cartTotal=curShopStockCart.reduce((s,it)=>s+(it.qty*it.hargaBeli),0);
if(cartTotal>0)document.getElementById('txAmt').value=Math.round(cartTotal);
}
function applyTxShopStockFromTx(txId,note,existingTx){
const chk=document.getElementById('txAddShopStock');
if(!chk||!chk.checked)return;
const panel=document.getElementById('txShopStockPanel');
if(!panel||panel.style.display==='none')return;
if(!curShopStockCart.length){toast('⚠️ Belum ada produk di daftar. Isi produk, lalu klik "Tambahkan Produk ke Daftar" dulu sebelum simpan');return;}
if(existingTx){
if(existingTx.stockItems&&existingTx.stockItems.length){
existingTx.stockItems.forEach(si=>{
const prevP=D.products.find(p=>p.id===si.productId);
if(prevP)prevP.stock=Math.max(0,(prevP.stock||0)-(si.qty||0));
});
} else if(existingTx.stockProductId){
const prevP=D.products.find(p=>p.id===existingTx.stockProductId);
if(prevP)prevP.stock=Math.max(0,(prevP.stock||0)-(existingTx.stockQty||0));
}
}
const resultItems=[];
let totalBelanja=0;
curShopStockCart.forEach(it=>{
let product;
if(it.isNew){
const kategoriId=resolveShopKategori(it.kategoriInput);
product=D.products.find(p=>p.name.toLowerCase()===it.name.toLowerCase());
if(!product){
product={id:'prod_'+Date.now()+'_'+uid(),name:it.name,stock:0,hargaBeli:it.hargaBeli,hargaJual:it.hargaJual,hargaReseller:null,diskonPersen:0,kategoriId,produsenId:it.produsenId,hargaByProdusen:{}};
D.products.push(product);
} else if(kategoriId){
product.kategoriId=kategoriId;
}
} else {
product=D.products.find(p=>p.id===it.productId);
if(product&&it.kategoriInput) product.kategoriId=resolveShopKategori(it.kategoriInput);
}
if(!product)return;
product.stock=(product.stock||0)+it.qty;
if(it.hargaBeli>0)product.hargaBeli=it.hargaBeli;
if(it.produsenId){
product.produsenId=it.produsenId;
if(!product.hargaByProdusen)product.hargaByProdusen={};
if(it.hargaBeli>0)product.hargaByProdusen[it.produsenId]=it.hargaBeli;
}
resultItems.push({productId:product.id,name:product.name,qty:it.qty,hargaBeli:it.hargaBeli,produsenId:it.produsenId||'',kategoriId:product.kategoriId||''});
totalBelanja+=it.qty*it.hargaBeli;
});
const tx=existingTx||D.transactions.find(t=>t.id===txId);
if(tx){
tx.stockItems=resultItems;
if(resultItems[0]){
tx.stockProductId=resultItems[0].productId;
tx.stockQty=resultItems[0].qty;
if(resultItems[0].produsenId)tx.produsenId=resultItems[0].produsenId;
tx.kategoriId=resultItems[0].kategoriId||'';
}
}
renderProductList();
const ringkasan=resultItems.map(it=>`${it.name} +${it.qty}`).join(', ');
toast(`📦 Stok bertambah: ${ringkasan} (total ${fmtFull(totalBelanja)})`);
}
let curTxShopSaleCart=[];
function resetTxShopSaleCart(){
curTxShopSaleCart=[];
renderTxShopSaleCartList();
}
function populateTxShopSaleSelect(){
const sel=document.getElementById('txShopSaleItem');
if(!sel)return;
const cur=sel.value;
if(!D.products.length){
sel.innerHTML='<option value="">— Belum ada produk di Etalase —</option>';
return;
}
sel.innerHTML=D.products.map(p=>`<option value="${p.id}">${escapeHtml(p.name)} (stok ${p.stock})</option>`).join('');
sel.value=cur&&D.products.find(p=>p.id===cur)?cur:D.products[0].id;
onTxShopSaleItemChange();
renderTxShopSaleCartList();
}
function onTxShopSaleItemChange(){
const sel=document.getElementById('txShopSaleItem');
if(!sel||!sel.value)return;
const p=D.products.find(x=>x.id===sel.value);
if(p) document.getElementById('txShopSaleHarga').value=p.hargaJual||'';
}
function computeTxShopSaleTotals(){
let subtotal=0,modal=0;
const lines=curTxShopSaleCart.map(it=>{
const p=D.products.find(x=>x.id===it.productId);
const lineTotal=it.harga*it.qty;
subtotal+=lineTotal;modal+=(p?(p.hargaBeli||0):0)*it.qty;
return{...it,lineTotal};
});
const diskon=parseFloat(document.getElementById('txShopSaleDiskon')?.value)||0;
const ongkir=parseFloat(document.getElementById('txShopSaleOngkir')?.value)||0;
const total=Math.max(0,subtotal-diskon)+ongkir;
const profit=subtotal-modal-diskon;
return{lines,subtotal,modal,diskon,ongkir,total,profit};
}
function addTxShopSaleCartItem(){
const sel=document.getElementById('txShopSaleItem');
const product=sel?D.products.find(p=>p.id===sel.value):null;
if(!product){toast('⚠️ Belum ada produk di Etalase — tambah produk dulu di tab Bisnis Shop');return;}
const qty=parseFloat(document.getElementById('txShopSaleQty').value)||0;
const harga=parseFloat(document.getElementById('txShopSaleHarga').value)||0;
if(qty<=0){toast('⚠️ Jumlah terjual harus lebih dari 0');return;}
if(harga<=0){toast('⚠️ Harga jual harus lebih dari 0');return;}
curTxShopSaleCart.push({productId:product.id,name:product.name,qty,harga});
renderTxShopSaleCartList();
syncTxShopSaleAmt();
document.getElementById('txShopSaleQty').value='1';
toast(`➕ "${escapeHtml(product.name)}" ditambahkan ke daftar (${qty}x)`);
}
function removeTxShopSaleCartItem(idx){
curTxShopSaleCart.splice(idx,1);
renderTxShopSaleCartList();
syncTxShopSaleAmt();
}
/* moved to modules-render.js: renderTxShopSaleCartList */
function syncTxShopSaleAmt(){
const chk=document.getElementById('txAddShopSale');
if(!chk||!chk.checked)return;
const{total}=computeTxShopSaleTotals();
if(total>0)document.getElementById('txAmt').value=Math.round(total);
}
function toggleTxShopSaleFields(){
const chk=document.getElementById('txAddShopSale');
const fields=document.getElementById('txShopSaleFields');
if(!chk||!fields)return;
fields.style.display=chk.checked?'block':'none';
if(chk.checked) populateTxShopSaleSelect();
}
function recordShopSale(opts){
const items=(opts.items||[]).filter(it=>it&&it.productId&&it.qty>0);
if(!items.length)return{ok:false,message:'Keranjang masih kosong'};
let prevShop=null;
if(opts.existingShopId){
prevShop=D.cobek.find(c=>c.id===opts.existingShopId);
if(prevShop&&prevShop.items){
prevShop.items.forEach(it=>{
const pp=D.products.find(x=>x.id===it.productId);
if(pp)pp.stock=(pp.stock||0)+it.qty;
});
}
}
for(const it of items){
const p=D.products.find(x=>x.id===it.productId);
if(!p){
if(prevShop&&prevShop.items)prevShop.items.forEach(pi=>{const pp=D.products.find(x=>x.id===pi.productId);if(pp)pp.stock=Math.max(0,(pp.stock||0)-pi.qty);});
return{ok:false,message:'Produk tidak ditemukan'};
}
if(it.qty>p.stock){
if(prevShop&&prevShop.items)prevShop.items.forEach(pi=>{const pp=D.products.find(x=>x.id===pi.productId);if(pp)pp.stock=Math.max(0,(pp.stock||0)-pi.qty);});
return{ok:false,message:'Stok '+p.name+' tidak cukup (sisa '+p.stock+')'};
}
}
items.forEach(it=>{const p=D.products.find(x=>x.id===it.productId);p.stock=(p.stock||0)-it.qty;});
const customer=opts.customer||{name:'',phone:'',address:''};
if(prevShop){
Object.assign(prevShop,{
date:opts.date,items,priceType:opts.priceType||prevShop.priceType||'normal',
customer,subtotal:opts.subtotal,diskon:opts.diskon||0,ongkir:opts.ongkir||0,
total:opts.total,profit:opts.profit,accountId:opts.accountId,
delivered:opts.delivered!==undefined?opts.delivered:prevShop.delivered,
note:opts.note!==undefined?(opts.note||prevShop.note):prevShop.note
});
return{ok:true,shopId:prevShop.id,isNew:false};
}
const shopId=uid();
D.cobek.push({
id:shopId,date:opts.date,items,priceType:opts.priceType||'normal',customer,
subtotal:opts.subtotal,diskon:opts.diskon||0,ongkir:opts.ongkir||0,total:opts.total,profit:opts.profit,
accountId:opts.accountId,txLinkId:opts.txId,delivered:opts.delivered!==undefined?opts.delivered:true,
note:opts.note||''
});
return{ok:true,shopId,isNew:true};
}
function applyTxShopSaleFromTx(txId,date,accId,note,existingTx){
const chk=document.getElementById('txAddShopSale');
if(!chk||!chk.checked)return;
const panel=document.getElementById('txShopSalePanel');
if(!panel||panel.style.display==='none')return;
if(!curTxShopSaleCart.length){toast('⚠️ Belum ada produk di daftar penjualan shop — tambahkan dulu');return;}
const{lines,subtotal,diskon,ongkir,total,profit}=computeTxShopSaleTotals();
const items=lines.map(l=>({productId:l.productId,name:l.name,qty:l.qty,harga:l.harga,lineTotal:l.lineTotal}));
const customer={
name:(document.getElementById('txShopSaleCustName')?.value||'').trim(),
phone:(document.getElementById('txShopSaleCustPhone')?.value||'').trim(),
address:(document.getElementById('txShopSaleCustAddr')?.value||'').trim()
};
const tx=existingTx||D.transactions.find(t=>t.id===txId);
const result=recordShopSale({
items,subtotal,diskon,ongkir,total,profit,date,note,customer,
priceType:'normal',delivered:true,accountId:accId,txId,
existingShopId:(existingTx&&existingTx.cobekLinkId)?existingTx.cobekLinkId:null
});
if(!result.ok){toast('⚠️ '+result.message);return;}
if(tx)tx.cobekLinkId=result.shopId;
renderProductList();renderShop();renderShopRecent();
const itemSummary=items.map(it=>it.name+' x'+it.qty).join(', ');
toast(`🪨 Penjualan tercatat: ${itemSummary}`);
}

function openProductModal(idx){return Etalase.openModal(idx);}
function onPProdusenChange(){return Etalase.onProdusenChange();}
function saveProduct(){return Etalase.save();}
function delProduct(i){return Etalase.delete(i);}
function applyPriceRekoWidgetOne(id){return PriceRekoWidget.applyOne(id);}
function openPriceRekoWidgetDetail(id){return PriceRekoWidget.openDetail(id);}
function openStockRekoWidgetDetail(id,restockQty){return StockRekoWidget.openDetail(id,restockQty);}
/* moved to modules-render.js: renderProductList */
function setShopTab(t,el){
document.querySelectorAll('#page-shop .cn-tab').forEach(b=>b.classList.remove('active'));
el.classList.add('active');
['kasir','jual','etalase','produsen','riwayat','pelanggan'].forEach(x=>{const elx=document.getElementById('shopTab-'+x);if(elx){elx.classList.toggle('u-dnone', x!==t);elx.style.display='';}});
if(t==='kasir')Kasir.render();
if(t==='etalase')renderProductList();
if(t==='produsen')renderProdusenList();
if(t==='riwayat'){renderShop();renderShopGrafik();}
if(t==='jual')renderShopRecent();
if(t==='pelanggan')renderCustomerList();
}
// BUGFIX (2026-07-11): alias kompatibilitas mundur. `setCobekTab` di-rename jadi `setShopTab`
// saat redesign Etalase (lihat CATATAN-CEK-CLAUDE.md), tapi PWA yang service worker-nya belum
// sempat ganti ke bundle baru (mis. buka app pas offline / cache belum ke-refresh) masih bisa
// menyimpan HTML LAMA dgn `data-action="setCobekTab"` di tombol tab Bisnis Shop, sehingga
// begitu bundle JS baru ini ter-load, tombol lama itu memanggil fungsi yang sudah tidak ada →
// muncul toast "Tombol ini belum berfungsi (setCobekTab)". Alias tipis ini membuat kombinasi
// HTML lama + JS baru tetap berfungsi sampai service worker sempat menyegarkan HTML-nya juga.
function setCobekTab(t,el){return setShopTab(t,el);}

function openProdusenModal(id){return Produsen.openModal(id);}
function saveProdusen(){return Produsen.save();}
function delProdusen(id){return Produsen.delete(id);}
/* moved to modules-render.js: renderProdusenList */
function openProdusenHargaModal(produsenId){return Produsen.openHargaModal(produsenId);}
function saveProdusenHarga(){return Produsen.saveHarga();}
function populateOrderProductSelect(){return Order.populateProductSelect();}
function openOrderModal(){return Order.openModal();}
function addOrderItem(){return Order.addItem();}
function updateOrderItemHarga(idx,val){return Order.updateItemHarga(idx,val);}
function changeOrderQty(idx,delta){return Order.changeQty(idx,delta);}
function removeOrderItem(idx){return Order.removeItem(idx);}
function computeOrderTotals(){return Order.computeTotals();}
/* moved to modules-render.js: renderOrderItems */
function saveOrder(){return Order.save();}
/* moved to modules-render.js: renderShopRecent */
function shopOrderRowHTML(t){return Order.rowHTML(t);}

function customerKey(cust){return Pelanggan.key(cust);}
function getCustomerOrders(cust){return Pelanggan.getOrders(cust);}
function aggregateCustomers(){return Pelanggan.aggregate();}
function onCustomerInputChange(){return Pelanggan.onInputChange();}
/* moved to modules-render.js: renderCustomerList */
function openCustomerDetail(key){return Pelanggan.openDetail(key);}
function toggleOrderDeliveredField(){return SiapPulang.toggleDeliveredField();}
function markShopDelivered(id){return SiapPulang.markDelivered(id);}
/* moved to modules-render.js: renderSiapPulang */

function setShopPeriode(p,el){return Laporan.setPeriode(p,el);}
function getShopRange(){return Laporan.getRange();}
/* moved to modules-render.js: renderShop */
function delShop(id){return Laporan.delete(id);}
/* moved to modules-render.js: renderShopGrafik */

function renderShopStockCartList(){
const el=document.getElementById('txShopStockCartList');
if(!el)return;
if(!curShopStockCart.length){el.innerHTML='';return;}
el.innerHTML=curShopStockCart.map((it,i)=>`
    <div class="u-flex u-aic u-gap8 u-r8 u-mb6" style="background:var(--surface2);padding:8px 10px">
      <div class="u-flex1 u-minw0">
        <div class="u-fs12 u-fw700" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(it.name)}${it.isNew?' <span class="u-cacc u-fw600">(baru)</span>':''}</div>
        <div class="u-fs12t2">${it.qty} x ${fmtFull(it.hargaBeli)} = ${fmtFull(it.qty*it.hargaBeli)}</div>
      </div>
      <button type="button" class="tx-del" data-action="removeShopStockCartItem" data-args="${escapeHtml(JSON.stringify([i]))}" aria-label="Hapus">🗑</button>
    </div>`).join('');
}

function renderTxShopSaleCartList(){
const el=document.getElementById('txShopSaleCartList');
if(!el)return;
if(!curTxShopSaleCart.length){el.innerHTML='';return;}
const{lines,total,profit}=computeTxShopSaleTotals();
el.innerHTML=lines.map((l,i)=>`
    <div class="u-flex u-aic u-gap8 u-r8 u-mb6" style="background:var(--surface2);padding:8px 10px">
      <div class="u-flex1 u-minw0">
        <div class="u-fs12 u-fw700" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(l.name)}</div>
        <div class="u-fs12t2">${l.qty} x ${fmtFull(l.harga)} = ${fmtFull(l.lineTotal)}</div>
      </div>
      <button type="button" class="tx-del" data-action="removeTxShopSaleCartItem" data-args="${escapeHtml(JSON.stringify([i]))}" aria-label="Hapus">🗑</button>
    </div>`).join('')+`<div class="u-fs12 u-t2 u-mt2 u-tar">Subtotal: ${fmtFull(total)} · Estimasi untung: ${fmtFull(profit)}</div>`;
}

function renderProductList(){Etalase.renderList();PriceRekoWidget.render();StockRekoWidget.render();}

function renderProdusenList(){return Produsen.renderList();}

function renderOrderItems(){return Order.renderItems();}

function renderShopRecent(){return Order.renderRecent();}

function renderShop(){return Laporan.render();}

function renderShopGrafik(){return Laporan.renderGrafik();}

function renderCustomerList(){return Pelanggan.renderList();}

function renderSiapPulang(){return SiapPulang.render();}
