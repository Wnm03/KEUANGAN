// transaksi.js — Form Tambah/Edit Transaksi Keuangan: autocomplete kategori/produk,
// panel kendaraan (BBM/sparepart/stok cobek), target Dana Darurat, catatan/reminder/
// transfer, dan simpan transaksi (saveTx) — mesin utama halaman Keuangan.
// (v92): ditambah domain "List Transaksi & Cashflow Forecast" (txHTML/delTx/changeMonth/
// setTxListPeriode/getTxListRange/setPeriode/getRange/computeCashflowForecast), dipindah dari
// backup-restore.js — domainnya sama-sama seputar data transaksi,
// lihat blok di akhir file & PEMISAHAN-FILE-ROADMAP.md.
// PENTING: file ini HARUS dimuat sesuai urutan build.js (GROUP_A/GROUP_B) karena beberapa modul saling referensi. Urutan grup ini: data-default.js, features-helpers-global-security.js, diagnostik-versi.js, format-tema.js, error-handler.js, helper-teks.js, keamanan-pin.js, modal-navigasi.js, reset-gaji-mingguan.js, debug-console.js, pengaturan-search.js, onboarding.js, kalkulator-input.js, scan-ocr.js, akun.js, gaji-calc.js, transaksi.js, profil-pengaturan.js, kategori.js, tagihan-kalender.js, backup-restore.js, payroll-absensi.js, features-tukang-kendaraan-storage.js, features-aiwidget-reminder-gdrive-search.js, features-sheets-pwa-selftest.js

function setTxType(t){
curTxType=t;
document.getElementById('btnI').className='type-btn'+(t==='income'?' ai':'');
document.getElementById('btnE').className='type-btn'+(t==='expense'?' ae':'');
hideSuggestBox('txCatSuggestBox');
hideSuggestBox('txSubCatSuggestBox');
updateTxVehiclePanels();
}
function updateSubCatOptions(){
updateTxVehiclePanels();
}
function jsAttrEscape(s){
return String(s).replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'&quot;');
}
function hideSuggestBox(id){
const box=document.getElementById(id);
if(box){box.style.display='none';box.innerHTML='';}
}
function onTxCatInput(){
const raw=document.getElementById('txCat').value;
const q=raw.trim().toLowerCase();
const cats=getCatsByType(curTxType);
const matches=cats.filter(c=>!q||c.name.toLowerCase().includes(q));
const box=document.getElementById('txCatSuggestBox');
let html=matches.map(c=>`<div class="suggest-item" onmousedown="event.preventDefault();selectTxCat('${jsAttrEscape(c.name)}')">${escapeHtml(c.emoji||'📦')} ${escapeHtml(c.name)}</div>`).join('');
if(q && !cats.some(c=>c.name.toLowerCase()===q)){
html+=`<div class="suggest-item suggest-add" onmousedown="event.preventDefault();addNewCatFromInput()">➕ Tambah kategori baru: "${escapeHtml(raw.trim())}"</div>`;
}
if(!html) html='<div class="suggest-empty">Belum ada kategori. Ketik nama baru lalu pilih "Tambah kategori baru".</div>';
box.innerHTML=html;
box.style.display='block';
}
function selectTxCat(name){
const prev=document.getElementById('txCat').value;
document.getElementById('txCat').value=name;
if(prev!==name) document.getElementById('txSubCat').value='';
hideSuggestBox('txCatSuggestBox');
updateTxVehiclePanels();
applyLastAccForCat(name);
}
function applyLastAccForCat(catName){
if(_txAccManuallySet)return;
if(!D.lastAccByCategory)return;
const accId=D.lastAccByCategory[catName];
if(!accId)return;
const accEl=document.getElementById('txAcc');
if(!accEl)return;
const exists=[...accEl.options].some(o=>o.value===accId);
if(exists){accEl.value=accId;}
}
function addNewCatFromInput(){
const q=document.getElementById('txCat').value.trim();
hideSuggestBox('txCatSuggestBox');
const prevType=curTxType;
openCatModal(undefined,prevType,(newName)=>{
curTxType=prevType;
document.getElementById('txCat').value=newName;
updateTxVehiclePanels();
});
setTimeout(()=>{const el=document.getElementById('catName'); if(el&&q)el.value=q;},50);
}
function onTxSubCatInput(){
const catName=document.getElementById('txCat').value.trim();
const box=document.getElementById('txSubCatSuggestBox');
if(!catName){
box.innerHTML='<div class="suggest-empty">Isi/pilih Kategori dulu di atas.</div>';
box.style.display='block';
return;
}
const cat=getCatByType(catName,curTxType);
const subs=(cat&&cat.subs)||[];
const q=document.getElementById('txSubCat').value.trim().toLowerCase();
const matches=subs.filter(s=>!q||s.name.toLowerCase().includes(q));
let html='<div class="suggest-item" onmousedown="event.preventDefault();selectTxSubCat(\'\')">— Tanpa subkategori —</div>';
html+=matches.map(s=>`<div class="suggest-item" onmousedown="event.preventDefault();selectTxSubCat('${jsAttrEscape(s.name)}')">${escapeHtml(s.name)}</div>`).join('');
if(!matches.length && q) html+='<div class="suggest-empty">Tidak ada subkategori cocok di kategori ini.</div>';
box.innerHTML=html;
box.style.display='block';
}
function selectTxSubCat(subName){
document.getElementById('txSubCat').value=subName;
hideSuggestBox('txSubCatSuggestBox');
updateTxVehiclePanels();
}
function recentUniqueStrings(list,getter,limit){
limit=limit||50;
const seen=new Set();const out=[];
for(let i=(list||[]).length-1;i>=0;i--){
const v=(getter(list[i])||'').trim();
if(v && !seen.has(v.toLowerCase())){seen.add(v.toLowerCase());out.push(v);}
if(out.length>=limit)break;
}
return out;
}
function simpleAutocompleteInput(inputId,boxId,sourceFn){
const el=document.getElementById(inputId);
const box=document.getElementById(boxId);
if(!el||!box)return;
const q=el.value.trim().toLowerCase();
let values=[];
try{values=sourceFn()||[];}catch(e){values=[];}
const matches=(q?values.filter(v=>v.toLowerCase().includes(q)):values).slice(0,8);
if(!matches.length){box.style.display='none';box.innerHTML='';return;}
box.innerHTML=matches.map(v=>`<div class="suggest-item" onmousedown="event.preventDefault();selectSimpleAutocomplete('${jsAttrEscape(inputId)}','${jsAttrEscape(boxId)}','${jsAttrEscape(v)}')">${escapeHtml(v)}</div>`).join('');
box.style.display='block';
}
function selectSimpleAutocomplete(inputId,boxId,value){
const el=document.getElementById(inputId);
if(el)el.value=value;
hideSuggestBox(boxId);
}
function acProductNames(){return recentUniqueStrings(D.products,p=>p.name);}
function acProdusenNames(){return recentUniqueStrings(D.produsen,p=>p.name);}
function acBillNames(){return recentUniqueStrings((D.bills||[]).concat(D.billsArchive||[]),b=>b.name);}
function acStockNames(){return recentUniqueStrings(D.partsStock,p=>p.name);}
function acStockCodes(){return recentUniqueStrings(D.partsStock,p=>p.code);}
function acSparepartCatNames(){return recentUniqueStrings(D.sparepartCats,c=>c.name);}
function acSparepartCatCodes(){return recentUniqueStrings(D.sparepartCats,c=>c.code);}
function acSpbuNames(){return recentUniqueStrings(D.bbmLogs,b=>b.spbu);}
function acTxNotes(){return recentUniqueStrings(D.transactions,t=>t.note);}
function isKendaraanCatName(catName){
return /kendaraan|transport|motor|vario|beat|grandmax/i.test(catName||'');
}
function resolveVehicleTxCategory(vehicle){
const vehName=vehicle&&vehicle.name?vehicle.name:'';
let cat=D.categories.expense.find(c=>c.name.trim().toLowerCase()===vehName.trim().toLowerCase());
if(!cat) cat=D.categories.expense.find(c=>/^transport$/i.test(c.name));
if(!cat){
cat={id:'cat_'+slugify('Transport')+'_'+uid(),name:'Transport',emoji:'🏍️',subs:[]};
D.categories.expense.push(cat);
}
if(!cat.subs)cat.subs=[];
['Bensin','Servis & Oli','Pajak'].forEach(subName=>{
if(!cat.subs.find(s=>s.name.trim().toLowerCase()===subName.toLowerCase())){
cat.subs.push({id:'sub_'+slugify(subName)+'_'+uid(),name:subName});
}
});
return cat.name;
}
function isBensinSubName(subName){
return /bensin|bbm|bahan bakar|pertalite|pertamax|solar/i.test(subName||'');
}
function isSparepartSubName(catName,subName){
if(!isKendaraanCatName(catName))return false;
if(isBensinSubName(subName))return false;
return true;
}
function isCobekStockCatName(catName,subName){
if(/cobek|shop/i.test(catName||'')||/cobek|shop/i.test(subName||''))return true;
// Fallback robust terhadap rename kategori/subkategori: cocokkan lewat ID internal
// yang tetap 'sub_cb_cobek'/'sub_cbb_cobek' walau nama tampilannya sudah diubah user
// (mis. dari "Cobek" jadi "Shop") -- ini yang bikin panel Stok/Penjualan Shop hilang
// kalau hanya mengandalkan cocokkan teks nama saja.
const allCats=[...(D.categories.income||[]),...(D.categories.expense||[])];
const cat=allCats.find(c=>c.name===catName);
if(cat){
const sub=(cat.subs||[]).find(s=>s.name===subName);
if(sub&&(sub.id==='sub_cb_cobek'||sub.id==='sub_cbb_cobek'))return true;
}
return false;
}
function updateTxVehiclePanels(){
const stockPanel=document.getElementById('txStockPanel');
const bbmPanel=document.getElementById('txBbmPanel');
const cobekPanel=document.getElementById('txCobekStockPanel');
const cobekSalePanel=document.getElementById('txCobekSalePanel');
if(!stockPanel||!bbmPanel)return;
const catName=document.getElementById('txCat').value;
const subName=document.getElementById('txSubCat')?document.getElementById('txSubCat').value:'';
const isExpense=curTxType==='expense';
const showBbm=isExpense&&isKendaraanCatName(catName)&&isBensinSubName(subName);
const showStock=isExpense&&!showBbm&&isSparepartSubName(catName,subName);
const showCobek=isExpense&&!showBbm&&!showStock&&isCobekStockCatName(catName,subName);
const showCobekSale=!isExpense&&isCobekStockCatName(catName,subName);
bbmPanel.style.display=showBbm?'block':'none';
stockPanel.style.display=showStock?'block':'none';
if(cobekPanel)cobekPanel.style.display=showCobek?'block':'none';
if(cobekSalePanel)cobekSalePanel.style.display=showCobekSale?'block':'none';
if(showBbm){
populateTxBbmVehicleSelect();
} else {
const chk=document.getElementById('txSyncBbm');
if(chk)chk.checked=false;
toggleTxBbmFields();
}
if(showStock){
populateTxStockSelect();
} else {
const chk=document.getElementById('txAddStock');
if(chk)chk.checked=false;
toggleTxStockFields();
}
if(showCobek){
populateTxCobekStockSelect();
} else {
const chk=document.getElementById('txAddCobekStock');
if(chk)chk.checked=false;
toggleTxCobekStockFields();
resetCobekStockCart();
}
if(showCobekSale){
populateTxCobekSaleSelect();
} else {
const chk=document.getElementById('txAddCobekSale');
if(chk)chk.checked=false;
toggleTxCobekSaleFields();
resetTxCobekSaleCart();
}
}
function populateTxBbmVehicleSelect(){
const sel=document.getElementById('txBbmVehicle');
if(!sel||!D.vehicles)return;
const cur=sel.value;
sel.innerHTML=D.vehicles.map(v=>`<option value="${v.id}">${v.emoji} ${escapeHtml(v.name)}</option>`).join('');
const fallback=(typeof curVehicleId!=='undefined'&&D.vehicles.find(v=>v.id===curVehicleId))?curVehicleId:(D.vehicles[0]&&D.vehicles[0].id);
sel.value=cur&&D.vehicles.find(v=>v.id===cur)?cur:fallback;
}
function toggleTxBbmFields(){
const chk=document.getElementById('txSyncBbm');
const fields=document.getElementById('txBbmFields');
if(!chk||!fields)return;
fields.style.display=chk.checked?'block':'none';
if(chk.checked)populateTxBbmVehicleSelect();
}
function syncTxBbmAmt(){
const liter=parseFloat(document.getElementById('txBbmLiter').value);
const harga=parseFloat(document.getElementById('txBbmHargaL').value);
if(liter&&harga){
document.getElementById('txAmt').value=Math.round(liter*harga);
}else{
syncTxAmtToLiterForce();
}
}
function syncTxAmtToLiter(){
const chk=document.getElementById('txSyncBbm');
if(!chk||!chk.checked)return;
syncTxAmtToLiterForce();
}
function syncTxAmtToLiterForce(){
const hargaEl=document.getElementById('txBbmHargaL');
const literEl=document.getElementById('txBbmLiter');
const harga=parseFloat(hargaEl.value);
const amt=parseFloat(document.getElementById('txAmt').value);
if(harga>0&&amt>0){
literEl.value=(amt/harga).toFixed(2);
}
}
function recordBbmLog(opts){
let harga=opts.harga;
if(!harga&&opts.liter)harga=Math.round(opts.cost/opts.liter);
if(!D.bbmLogs)D.bbmLogs=[];
if(opts.existingBbmId){
const b=D.bbmLogs.find(x=>x.id===opts.existingBbmId);
if(b){
Object.assign(b,{date:opts.date,km:opts.km,liter:opts.liter,harga,cost:opts.cost,spbu:opts.spbu,fullTank:opts.fullTank,note:opts.note,accountId:opts.accountId,vehicleId:opts.vehicleId||b.vehicleId});
return{bbmId:b.id,isNew:false,harga};
}
}
const bbmId=uid();
D.bbmLogs.push({id:bbmId,vehicleId:opts.vehicleId,date:opts.date,km:opts.km,liter:opts.liter,harga,cost:opts.cost,spbu:opts.spbu,fullTank:opts.fullTank,note:opts.note,accountId:opts.accountId,txLinkId:opts.txId});
return{bbmId,isNew:true,harga};
}
function applyTxBbmFromTx(txId,amt,date,accId,note,existingTx){
const chk=document.getElementById('txSyncBbm');
if(!chk||!chk.checked)return;
const panel=document.getElementById('txBbmPanel');
if(!panel||panel.style.display==='none')return;
const km=parseFloat(document.getElementById('txBbmKm').value);
const liter=parseFloat(document.getElementById('txBbmLiter').value);
const harga=parseFloat(document.getElementById('txBbmHargaL').value);
if(!km||!liter){toast('⚠️ Isi KM & Liter BBM dulu, atau hilangkan centang sinkron BBM');return;}
const spbu=document.getElementById('txBbmSpbu').value.trim();
const fullTank=document.getElementById('txBbmFull').checked;
const vehSel=document.getElementById('txBbmVehicle');
const vehicleId=vehSel&&vehSel.value?vehSel.value:((typeof curVehicleId!=='undefined'&&curVehicleId)||(D.vehicles[0]&&D.vehicles[0].id));
const result=recordBbmLog({
vehicleId,date,km,liter,harga,cost:amt,spbu,fullTank,note,accountId:accId,
txId,existingBbmId:(existingTx&&existingTx.bbmLinkId)?existingTx.bbmLinkId:null
});
if(!existingTx||!existingTx.bbmLinkId){
const tx=existingTx||D.transactions.find(t=>t.id===txId);
if(tx)tx.bbmLinkId=result.bbmId;
}
toast('⛽ Catatan BBM tersinkron ke Catatan Mobil');
}
function populateTxStockSelect(){
const sel=document.getElementById('txStockItem');
if(!sel)return;
const cur=sel.value;
sel.innerHTML='<option value="__new__">➕ Sparepart Baru</option>'+D.partsStock.map(p=>`<option value="${p.id}">${escapeHtml(p.name)} (stok ${p.qty}${p.unit?' '+p.unit:''})</option>`).join('');
sel.value=cur&&D.partsStock.find(p=>p.id===cur)?cur:'__new__';
onTxStockItemChange();
}
function onTxStockItemChange(){
const sel=document.getElementById('txStockItem');
const wrap=document.getElementById('txStockNewWrap');
if(!sel||!wrap)return;
const isNew=sel.value==='__new__';
wrap.style.display=isNew?'block':'none';
if(isNew){
const noteVal=document.getElementById('txNote').value.trim();
const nameEl=document.getElementById('txStockNewName');
if(nameEl&&!nameEl.value) nameEl.value=noteVal;
}
}
function toggleTxStockFields(){
const chk=document.getElementById('txAddStock');
const fields=document.getElementById('txStockFields');
if(!chk||!fields)return;
fields.style.display=chk.checked?'block':'none';
if(chk.checked) populateTxStockSelect();
}
function applyTxStockFromTx(note){
const chk=document.getElementById('txAddStock');
if(!chk||!chk.checked)return;
const panel=document.getElementById('txStockPanel');
if(!panel||panel.style.display==='none')return;
const itemSel=document.getElementById('txStockItem').value;
const qty=parseFloat(document.getElementById('txStockQty').value)||0;
const unit=document.getElementById('txStockUnit').value.trim()||'pcs';
if(qty<=0){toast('⚠️ Jumlah stok yang ditambah harus lebih dari 0');return;}
if(itemSel==='__new__'){
const name=(document.getElementById('txStockNewName').value.trim())||note||'Sparepart Baru';
let cat=D.sparepartCats.find(c=>c.name.toLowerCase()===name.toLowerCase());
if(!cat){
cat={id:'sp_'+Date.now(),name,code:codeFromName(name),intervalKm:0};
D.sparepartCats.push(cat);
}
const prefix=cat.code||codeFromName(name);
const seq=D.partsStock.filter(p=>p.code&&p.code.startsWith(prefix+'-')).length+1;
const code=prefix+'-'+String(seq).padStart(3,'0');
const existing=D.partsStock.find(p=>p.catId===cat.id&&p.name.toLowerCase()===name.toLowerCase());
if(existing){
existing.qty=(existing.qty||0)+qty;
} else {
D.partsStock.push({id:'st_'+Date.now(),name,catId:cat.id,code,qty,unit,minStock:1,price:0,note:'Otomatis dari transaksi keuangan'});
}
toast(`📦 Kategori & stok "${name}" otomatis dibuat (+${qty} ${unit})`);
} else {
const p=D.partsStock.find(x=>x.id===itemSel);
if(p){
p.qty=(p.qty||0)+qty;
toast(`📦 Stok "${escapeHtml(p.name)}" bertambah +${qty} ${unit}`);
}
}
renderStockList();
}
function openTargetModal(){
['tName','tAmt','tSaved'].forEach(id=>document.getElementById(id).value='');
document.getElementById('tEmoji').value='🎯';
document.getElementById('tDanaDarurat').checked=false;
document.getElementById('tDanaDaruratHint').style.display='none';
populateAccFilters();
document.getElementById('tAcc').value='';
document.getElementById('tSavedWrap').style.display='block';
openModal('targetModal');
}
function onTargetAccChange(){
const linked=!!document.getElementById('tAcc').value;
document.getElementById('tSavedWrap').style.display=linked?'none':'block';
}
function onTargetDanaDaruratToggle(){
const chk=document.getElementById('tDanaDarurat');
const hint=document.getElementById('tDanaDaruratHint');
if(!chk.checked){hint.style.display='none';return;}
const avgBulanan=(typeof FI!=='undefined')?FI.annualExpense()/12:0;
const rekom=Math.round((avgBulanan||0)*6);
if(!document.getElementById('tName').value.trim())document.getElementById('tName').value='Dana Darurat';
const emojiEl=document.getElementById('tEmoji');
if(!emojiEl.value.trim()||emojiEl.value==='🎯')emojiEl.value='🚨';
if(!document.getElementById('tAmt').value&&rekom>0)document.getElementById('tAmt').value=rekom;
const already=(D.targets||[]).find(t=>t.isDanaDarurat);
let html=avgBulanan>0
?`💡 Rekomendasi umum: <b>6× rata-rata pengeluaran bulanan</b> (≈${fmtFull(avgBulanan)}) = <b>${fmtFull(rekom)}</b>. Sudah diisi otomatis di kolom Target — sesuaikan lagi kalau perlu (kalau pemasukan gak tetap, biasanya lebih aman ke arah 9–12×).`
:`💡 Rekomendasi umum dana darurat: 3–6× pengeluaran bulanan (lebih aman 6–12× kalau pemasukan gak tetap). Belum cukup data transaksi utk hitung otomatis, isi manual dulu ya.`;
if(already)html+=`<br>⚠️ Target "<b>${escapeHtml(already.name)}</b>" saat ini juga ditandai Dana Darurat — kalau disimpan, tandanya pindah ke target ini.`;
hint.innerHTML=html;
hint.style.display='block';
}
function openCatatan(type){curCatatan=type;document.getElementById('catatanTitle').textContent='Catatan Anak';document.getElementById('catatanDate').value=new Date().toISOString().split('T')[0];document.getElementById('catatanText').value='';openModal('catatanModal');}
function openReminderModal(){['rTitle','rDesc'].forEach(id=>document.getElementById(id).value='');openModal('reminderModal');}
function openTransferModal(){
populateAccFilters();
document.getElementById('trAmt').value='';
document.getElementById('trNote').value='';
document.getElementById('trDate').value=new Date().toISOString().split('T')[0];
if(D.accounts.length>1) document.getElementById('trTo').selectedIndex=1;
openModal('transferModal');
}
function saveTransfer(){
const from=document.getElementById('trFrom').value;
const to=document.getElementById('trTo').value;
evalAmtExpr('trAmt');
const amt=parseFloat(document.getElementById('trAmt').value);
if(!amt||amt<=0){toast('⚠️ Masukkan jumlah valid');return;}
if(from===to){toast('⚠️ Akun asal dan tujuan harus berbeda');return;}
const date=document.getElementById('trDate').value;
const note=document.getElementById('trNote').value||'Transfer';
const fromAcc=D.accounts.find(a=>a.id===from), toAcc=D.accounts.find(a=>a.id===to);
D.transactions.push({id:uid(),type:'transfer_out',amount:amt,category:'Transfer',note:`${note} → ${escapeHtml(toAcc.name)}`,date,accountId:from});
D.transactions.push({id:uid(),type:'transfer_in',amount:amt,category:'Transfer',note:`${note} ← ${escapeHtml(fromAcc.name)}`,date,accountId:to});
save();closeModal('transferModal');renderDashboard();renderKeuangan();toast('✅ Transfer berhasil');
}
function setPayMethod(m){
curPayMethod=m;
['pmTunai','pmCicilan','pmLangganan'].forEach(id=>{
const el=document.getElementById(id); if(el) el.classList.remove('active');
});
const map={tunai:'pmTunai',cicilan:'pmCicilan',langganan:'pmLangganan'};
if(map[m]) document.getElementById(map[m]).classList.add('active');
document.getElementById('txCicilanPanel').style.display = m==='cicilan'?'block':'none';
document.getElementById('txLanggananPanel').style.display = m==='langganan'?'block':'none';
if(m==='cicilan'){syncCicilanDate('date');syncCicilanPreview();}
}
function validateCicilanFields(){
const totalEl=document.getElementById('txCicilanTotal');
const tenorEl=document.getElementById('txCicilanTenor');
const bungaEl=document.getElementById('txCicilanBunga');
const total=parseFloat(totalEl.value);
const tenor=parseInt(tenorEl.value);
const bungaRaw=bungaEl.value.trim();
const bunga=bungaRaw===''?0:parseFloat(bungaRaw);
if(!totalEl.value.trim()||isNaN(total)||total<=0){toast('⚠️ Total harga cicilan harus lebih dari 0');totalEl.focus();return false;}
if(isNaN(tenor)||tenor<=0){toast('⚠️ Tenor cicilan tidak valid');return false;}
if(isNaN(bunga)||bunga<0){toast('⚠️ Bunga/biaya cicilan tidak boleh negatif');bungaEl.focus();return false;}
return true;
}
// Logika hitung murni (tanpa sentuh DOM) -- dipakai oleh syncCicilanPreview() di bawah
// DAN oleh self-test (lihat features-sheets-pwa-selftest.js), supaya self-test cukup panggil fungsi
// ini langsung tanpa perlu buka txModal asli / mengganggu form yang sedang diisi user.
function calcCicilanPerBulanFromTotal(hargaPokok,tenor,bungaPct){
const totalBayar=hargaPokok*(1+bungaPct/100);
return{perBulan:Math.ceil(totalBayar/tenor),totalBayar};
}
function calcCicilanTotalFromPerBulan(perBulan,tenor,bungaPct){
const totalBayar=perBulan*tenor;
return{hargaPokok:Math.round(totalBayar/(1+bungaPct/100)),totalBayar};
}
function syncCicilanPreview(src){
if(src==='total'||src==='perbulan') cicilanLastInput=src;
if(src==='sharedPct'||src==='sharedNominal') cicilanSharedLastInput=src==='sharedPct'?'pct':'nominal';
const totalEl=document.getElementById('txCicilanTotal');
const perBulanEl=document.getElementById('txCicilanPerBulan');
const tenor=parseInt(document.getElementById('txCicilanTenor').value)||6;
const bunga=parseFloat(document.getElementById('txCicilanBunga').value)||0;
const prev=document.getElementById('txCicilanPreview');
let totalBayar, perBulan, hargaPokok;
if(cicilanLastInput==='perbulan'){
perBulan=parseFloat(perBulanEl.value)||0;
if(!perBulan||perBulan<=0){prev.style.display='none';document.getElementById('txAmt').value='';totalEl.value='';return;}
({hargaPokok,totalBayar}=calcCicilanTotalFromPerBulan(perBulan,tenor,bunga));
totalEl.value=hargaPokok;
} else {
hargaPokok=parseFloat(totalEl.value)||0;
if(!hargaPokok||hargaPokok<=0){prev.style.display='none';document.getElementById('txAmt').value='';perBulanEl.value='';return;}
({perBulan,totalBayar}=calcCicilanPerBulanFromTotal(hargaPokok,tenor,bunga));
perBulanEl.value=perBulan;
}
const sisaTenor=tenor-1;
document.getElementById('prevPerBulan').textContent=fmtFull(perBulan);
document.getElementById('prevTotal').textContent=fmtFull(totalBayar);
document.getElementById('prevSisa').textContent=sisaTenor>0?`${sisaTenor}x lagi (${fmtFull(perBulan*sisaTenor)})`: 'Lunas setelah ini';
prev.style.display='block';
const mineWrap=document.getElementById('prevMineRow');
const sharedPrevEl=document.getElementById('txCicilanSharedPreview');
const sh=getCicilanSharedMine(perBulan);
let perBulanMine=perBulan;
if(sh.shared){
perBulanMine=sh.mine;
if(cicilanSharedLastInput==='nominal'){document.getElementById('txCicilanSharedPct').value=sh.pct;}
else{document.getElementById('txCicilanSharedNominal').value=sh.mine;}
document.getElementById('prevPerBulanMine').textContent=fmtFull(perBulanMine);
mineWrap.style.display='block';
if(sharedPrevEl)sharedPrevEl.textContent=`👫 Porsi kamu: ${fmt(perBulanMine)}/bulan (${sh.pct}%) dari total ${fmt(perBulan)}/bulan (sisanya ${fmt(perBulan-perBulanMine)} ditanggung pihak lain)`;
} else {
mineWrap.style.display='none';
if(sharedPrevEl)sharedPrevEl.textContent='';
}
document.getElementById('txAmt').value=perBulanMine;
}
function getCicilanSharedMine(perBulanFull){
const chk=document.getElementById('txCicilanShared');
const shared=chk&&chk.checked;
if(!shared)return{shared:false,pct:null,mine:perBulanFull};
let pct,mine;
if(cicilanSharedLastInput==='nominal'){
mine=parseFloat(document.getElementById('txCicilanSharedNominal').value)||0;
mine=Math.min(Math.max(mine,0),perBulanFull);
pct=perBulanFull>0?Math.min(99,Math.max(1,Math.round((mine/perBulanFull*100)*10)/10)):50;
} else {
pct=Math.min(99,Math.max(1,parseFloat(document.getElementById('txCicilanSharedPct').value)||50));
mine=Math.round(perBulanFull*pct/100);
}
return{shared:true,pct,mine};
}
function toggleCicilanSharedFields(){
const shared=document.getElementById('txCicilanShared').checked;
document.getElementById('txCicilanSharedWrap').style.display=shared?'block':'none';
if(shared) cicilanSharedLastInput='pct';
syncCicilanPreview();
}
function syncCicilanDate(src){
if(curPayMethod!=='cicilan'||cicilanDateLinked)return;
const dateEl=document.getElementById('txDate');
const dueEl=document.getElementById('txCicilanDue');
if(!dateEl.value&&!dueEl.value)return;
if(src==='date') dueEl.value=dateEl.value;
else dateEl.value=dueEl.value;
}
function openTxModal(type){
txEditId=null;
if(typeof WorthIt!=='undefined')WorthIt.pendingBuyId=null;
_txAccManuallySet=false;
_txCatLearnSource=null;
document.getElementById('txModalTitle').textContent='Tambah Transaksi';
document.getElementById('txDelBtn').style.display='none';
resetPayMethodLock();
curTxType=type;
document.getElementById('txDate').value=new Date().toISOString().split('T')[0];
document.getElementById('txAmt').value='';
document.getElementById('txCat').value='';
document.getElementById('txSubCat').value='';
document.getElementById('txNote').value='';
const scanInsightEl=document.getElementById('txScanInsight'); if(scanInsightEl){scanInsightEl.style.display='none';scanInsightEl.innerHTML='';}
cicilanLastInput='total';
cicilanDateLinked=false;
txEditLinkedBillId=null;
document.getElementById('txCicilanDueLabel').textContent='Jatuh Tempo Pertama';
document.getElementById('txCicilanDueHint').style.display='none';
document.getElementById('txCicilanHistoryBtn').style.display='none';
['txCicilanNama','txCicilanTotal','txCicilanPerBulan','txCicilanBunga','txLanggananNama'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
document.getElementById('txCicilanTenor').value='6';
document.getElementById('txCicilanShared').checked=false;
document.getElementById('txCicilanSharedPct').value=50;
document.getElementById('txCicilanSharedNominal').value='';
cicilanSharedLastInput='pct';
document.getElementById('txCicilanSharedWrap').style.display='none';
const prevMineRowEl=document.getElementById('prevMineRow'); if(prevMineRowEl)prevMineRowEl.style.display='none';
document.getElementById('txCicilanDue').value=new Date().toISOString().split('T')[0];
document.getElementById('txLanggananDue').value=new Date().toISOString().split('T')[0];
document.getElementById('txCicilanPreview').style.display='none';
populateAccFilters();
setTxType(type);
setPayMethod('tunai');
const stockChk=document.getElementById('txAddStock');
if(stockChk)stockChk.checked=false;
['txStockNewName'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
const stockQtyEl=document.getElementById('txStockQty'); if(stockQtyEl)stockQtyEl.value='1';
const stockUnitEl=document.getElementById('txStockUnit'); if(stockUnitEl)stockUnitEl.value='pcs';
toggleTxStockFields();
const bbmChk=document.getElementById('txSyncBbm');
if(bbmChk)bbmChk.checked=false;
['txBbmKm','txBbmLiter','txBbmHargaL','txBbmSpbu'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
const bbmFullEl=document.getElementById('txBbmFull'); if(bbmFullEl)bbmFullEl.checked=true;
toggleTxBbmFields();
const cobekChk=document.getElementById('txAddCobekStock');
if(cobekChk)cobekChk.checked=false;
['txCobekStockNewName','txCobekStockKategori','txCobekStockHarga','txCobekStockJual'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
const cobekQtyEl=document.getElementById('txCobekStockQty'); if(cobekQtyEl)cobekQtyEl.value='1';
resetCobekStockCart();
toggleTxCobekStockFields();
const cobekSaleChk=document.getElementById('txAddCobekSale');
if(cobekSaleChk)cobekSaleChk.checked=false;
const cobekSaleQtyEl=document.getElementById('txCobekSaleQty'); if(cobekSaleQtyEl)cobekSaleQtyEl.value='1';
const cobekSaleHargaEl=document.getElementById('txCobekSaleHarga'); if(cobekSaleHargaEl)cobekSaleHargaEl.value='';
['txCobekSaleDiskon','txCobekSaleOngkir','txCobekSaleCustName','txCobekSaleCustPhone','txCobekSaleCustAddr'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
resetTxCobekSaleCart();
toggleTxCobekSaleFields();
openModal('txModal');
}
function resetPayMethodLock(){
['pmTunai','pmCicilan','pmLangganan'].forEach(id=>{const el=document.getElementById(id);if(el){el.style.pointerEvents='';el.style.opacity='';}});
}
function editTx(id){
const t=D.transactions.find(x=>x.id===id);
if(!t)return;
if(t.type==='transfer_in'||t.type==='transfer_out'){toast('⚠️ Transfer antar akun tidak bisa diedit di sini. Hapus & buat ulang kalau salah.');return;}
txEditId=id;
document.getElementById('txModalTitle').textContent='Edit Transaksi';
document.getElementById('txDelBtn').style.display='flex';
resetPayMethodLock();
const scanInsightElEdit=document.getElementById('txScanInsight'); if(scanInsightElEdit){scanInsightElEdit.style.display='none';scanInsightElEdit.innerHTML='';}
populateAccFilters();
curTxType=t.type;
document.getElementById('btnI').className='type-btn'+(t.type==='income'?' ai':'');
document.getElementById('btnE').className='type-btn'+(t.type==='expense'?' ae':'');
document.getElementById('txCat').value=t.category||'';
document.getElementById('txSubCat').value=t.subcategory||'';
document.getElementById('txAcc').value=t.accountId;
document.getElementById('txAmt').value=t.amount;
document.getElementById('txNote').value=t.note||'';
document.getElementById('txDate').value=t.date;
updateTxVehiclePanels();
const stockChk=document.getElementById('txAddStock');
if(stockChk)stockChk.checked=false;
toggleTxStockFields();
const cobekChk=document.getElementById('txAddCobekStock');
const hasCobekStock=(t.stockItems&&t.stockItems.length)||t.stockProductId;
if(hasCobekStock&&cobekChk){
cobekChk.checked=true;
toggleTxCobekStockFields();
if(t.stockItems&&t.stockItems.length){
curCobekStockCart=t.stockItems.map(si=>({
productId:si.productId,isNew:false,
name:(D.products.find(p=>p.id===si.productId)||{}).name||si.name||'Produk',
qty:si.qty,hargaBeli:si.hargaBeli||0,produsenId:si.produsenId||'',kategoriInput:'',hargaJual:0
}));
} else {
const legacyP=D.products.find(p=>p.id===t.stockProductId);
curCobekStockCart=[{
productId:t.stockProductId,isNew:false,
name:legacyP?legacyP.name:'Produk',
qty:t.stockQty||1,hargaBeli:legacyP?(legacyP.hargaBeli||0):0,produsenId:t.produsenId||'',kategoriInput:'',hargaJual:0
}];
}
renderCobekStockCartList();
if(t.produsenId){
const prodSel=document.getElementById('txCobekStockProdusen');
if(prodSel)prodSel.value=t.produsenId;
}
} else {
if(cobekChk)cobekChk.checked=false;
resetCobekStockCart();
toggleTxCobekStockFields();
}
const cobekSaleChk=document.getElementById('txAddCobekSale');
const linkedCobekSale=t.cobekLinkId?D.cobek.find(c=>c.id===t.cobekLinkId):null;
if(linkedCobekSale&&cobekSaleChk){
cobekSaleChk.checked=true;
toggleTxCobekSaleFields();
curTxCobekSaleCart=(linkedCobekSale.items||[]).map(it=>({
productId:it.productId,
name:(D.products.find(p=>p.id===it.productId)||{}).name||it.name||'Produk',
qty:it.qty,harga:it.harga
}));
renderTxCobekSaleCartList();
const diskonEl=document.getElementById('txCobekSaleDiskon'); if(diskonEl)diskonEl.value=linkedCobekSale.diskon||'';
const ongkirEl=document.getElementById('txCobekSaleOngkir'); if(ongkirEl)ongkirEl.value=linkedCobekSale.ongkir||'';
const cust=linkedCobekSale.customer||{};
const custNameEl=document.getElementById('txCobekSaleCustName'); if(custNameEl)custNameEl.value=cust.name||'';
const custPhoneEl=document.getElementById('txCobekSaleCustPhone'); if(custPhoneEl)custPhoneEl.value=cust.phone||'';
const custAddrEl=document.getElementById('txCobekSaleCustAddr'); if(custAddrEl)custAddrEl.value=cust.address||'';
} else {
if(cobekSaleChk)cobekSaleChk.checked=false;
resetTxCobekSaleCart();
toggleTxCobekSaleFields();
}
const bbmChk=document.getElementById('txSyncBbm');
const linkedBbm=t.bbmLinkId?(D.bbmLogs||[]).find(b=>b.id===t.bbmLinkId):null;
if(linkedBbm&&bbmChk){
bbmChk.checked=true;
toggleTxBbmFields();
const vehSel=document.getElementById('txBbmVehicle');
if(vehSel)vehSel.value=linkedBbm.vehicleId;
document.getElementById('txBbmKm').value=linkedBbm.km;
document.getElementById('txBbmLiter').value=linkedBbm.liter;
document.getElementById('txBbmHargaL').value=linkedBbm.harga||'';
document.getElementById('txBbmSpbu').value=linkedBbm.spbu||'';
document.getElementById('txBbmFull').checked=!!linkedBbm.fullTank;
} else {
if(bbmChk)bbmChk.checked=false;
toggleTxBbmFields();
}
const linkedBill=t.billLinkId?D.bills.find(b=>b.id===t.billLinkId):null;
cicilanDateLinked=!!(linkedBill&&linkedBill.kind==='cicilan');
txEditLinkedBillId=linkedBill?linkedBill.id:null;
if(linkedBill&&(linkedBill.kind==='cicilan'||linkedBill.kind==='langganan')){
setPayMethod(linkedBill.kind);
if(linkedBill.kind==='cicilan'){
cicilanLastInput='total';
document.getElementById('txCicilanNama').value=linkedBill.name;
document.getElementById('txCicilanTotal').value=linkedBill.totalHarga||t.amount;
document.getElementById('txCicilanTenor').value=linkedBill.tenor||6;
document.getElementById('txCicilanBunga').value=linkedBill.bunga||0;
document.getElementById('txCicilanDue').value=linkedBill.nextDue;
document.getElementById('txCicilanShared').checked=!!linkedBill.shared;
document.getElementById('txCicilanSharedPct').value=linkedBill.sharedPct||50;
document.getElementById('txCicilanSharedNominal').value=linkedBill.shared?linkedBill.amount:'';
document.getElementById('txCicilanSharedWrap').style.display=linkedBill.shared?'block':'none';
cicilanSharedLastInput='pct';
syncCicilanPreview();
document.getElementById('txCicilanDueLabel').textContent='Jatuh Tempo Berikutnya (Tagihan)';
document.getElementById('txCicilanDueHint').style.display='block';
document.getElementById('txCicilanHistoryBtn').style.display='block';
} else {
document.getElementById('txLanggananNama').value=linkedBill.name;
document.getElementById('txLanggananFreq').value=linkedBill.freq;
document.getElementById('txLanggananDue').value=linkedBill.nextDue;
}
const lockIds=['pmTunai','pmCicilan','pmLangganan'].filter(x=>x!==(linkedBill.kind==='cicilan'?'pmCicilan':'pmLangganan'));
lockIds.forEach(id=>{const el=document.getElementById(id);if(el){el.style.pointerEvents='none';el.style.opacity='0.4';}});
} else {
document.getElementById('txCicilanDue').value=t.date;
document.getElementById('txCicilanDueLabel').textContent='Jatuh Tempo Pertama';
document.getElementById('txCicilanDueHint').style.display='none';
document.getElementById('txCicilanHistoryBtn').style.display='none';
setPayMethod('tunai');
}
openModal('txModal');
}
function openCicilanHistoryFromTx(){
if(!txEditLinkedBillId)return;
closeModal('txModal');
openBillHistory(txEditLinkedBillId);
}
function deleteTxFromModal(){
if(!txEditId)return;
const id=txEditId;
closeModal('txModal');
delTx(id);
}
async function saveTx(){
if(_txSaving)return;
const modalEl=document.getElementById('txModal');
if(modalEl && !modalEl.classList.contains('open'))return;
_txSaving=true;
try{
await _saveTxInner();
} finally {
_txSaving=false;
}
}
async function _saveTxInner(){
evalAmtExpr('txAmt');
const amt=parseFloat(document.getElementById('txAmt').value);
if(!amt||amt<=0){toast('⚠️ Masukkan jumlah valid');return;}
const MAX_AMOUNT=999000000000;
if(amt>MAX_AMOUNT){toast('⚠️ Jumlah terlalu besar (maks Rp 999.000.000.000)');return;}
const subCat=document.getElementById('txSubCat')?document.getElementById('txSubCat').value:'';
const date=document.getElementById('txDate').value;
const note=document.getElementById('txNote').value;
const cat=document.getElementById('txCat').value;
const accId=document.getElementById('txAcc').value;
if(cat==='__add_new_cat__'){toast('⚠️ Pilih atau buat kategori dulu');return;}
if(curPayMethod==='cicilan'&&!validateCicilanFields())return;
if(!txEditId){
const dupe=findPossibleDuplicateTx(amt,date,note,curTxType);
if(dupe){
const ok=await askConfirm(
'Ada transaksi mirip: '+fmtFull(dupe.amount)+' pada '+dupe.date+(dupe.note?' ("'+dupe.note+'")':'')+'.\n\nKemungkinan ini transaksi yang sama (mis. ke-tap/ke-scan 2x). Tetap simpan sebagai transaksi baru?',
{title:'⚠️ Kemungkinan Duplikat',okText:'Ya, Simpan Juga',cancelText:'Batal'}
);
if(!ok)return;
}
}
const editingId=txEditId;
const existingTx=editingId?D.transactions.find(t=>t.id===editingId):null;
const existingBill=existingTx&&existingTx.billLinkId?D.bills.find(b=>b.id===existingTx.billLinkId):null;
if(existingTx&&(existingTx.stockProductId||(existingTx.stockItems&&existingTx.stockItems.length))){
const stillChecked=document.getElementById('txAddCobekStock')&&document.getElementById('txAddCobekStock').checked;
const panelVisible=document.getElementById('txCobekStockPanel')&&document.getElementById('txCobekStockPanel').style.display!=='none';
if(!stillChecked||!panelVisible){
if(existingTx.stockItems&&existingTx.stockItems.length){
existingTx.stockItems.forEach(si=>{
const prevP=D.products.find(p=>p.id===si.productId);
if(prevP)prevP.stock=Math.max(0,(prevP.stock||0)-(si.qty||0));
});
} else if(existingTx.stockProductId){
const prevP=D.products.find(p=>p.id===existingTx.stockProductId);
if(prevP)prevP.stock=Math.max(0,(prevP.stock||0)-(existingTx.stockQty||0));
}
delete existingTx.stockProductId;delete existingTx.stockQty;delete existingTx.stockItems;
renderProductList();
}
}
if(existingTx&&existingTx.cobekLinkId){
const stillChecked=document.getElementById('txAddCobekSale')&&document.getElementById('txAddCobekSale').checked;
const panelVisible=document.getElementById('txCobekSalePanel')&&document.getElementById('txCobekSalePanel').style.display!=='none';
if(!stillChecked||!panelVisible){
const prevCobek=D.cobek.find(c=>c.id===existingTx.cobekLinkId);
if(prevCobek&&prevCobek.items){
prevCobek.items.forEach(it=>{const pp=D.products.find(x=>x.id===it.productId);if(pp)pp.stock=(pp.stock||0)+it.qty;});
}
D.cobek=D.cobek.filter(c=>c.id!==existingTx.cobekLinkId);
delete existingTx.cobekLinkId;
renderProductList();renderCobek();renderCobekRecent();
}
}
if(existingBill && curPayMethod===existingBill.kind){
if(curPayMethod==='cicilan'){
const nama=document.getElementById('txCicilanNama').value.trim()||cat;
const total=parseFloat(document.getElementById('txCicilanTotal').value)||amt;
const tenor=parseInt(document.getElementById('txCicilanTenor').value)||6;
const bunga=parseFloat(document.getElementById('txCicilanBunga').value)||0;
const due=document.getElementById('txCicilanDue').value||date;
const totalBayar=total*(1+bunga/100);
const perBulan=Math.ceil(totalBayar/tenor);
const sh=getCicilanSharedMine(perBulan);
const cicilanShared=sh.shared;
const cicilanSharedPct=sh.pct;
const perBulanMine=sh.mine;
Object.assign(existingBill,{name:nama,amount:perBulanMine,nextDue:due,category:cat,accountId:accId,note,totalHarga:total,tenor,bunga,shared:cicilanShared,sharedPct:cicilanSharedPct,totalAmount:cicilanShared?total:null});
Object.assign(existingTx,{amount:perBulanMine,category:cat,subcategory:subCat,accountId:accId,date,note:nama+(note?' - '+note:'')});
} else {
const nama=document.getElementById('txLanggananNama').value.trim()||cat;
const freq=document.getElementById('txLanggananFreq').value;
const due=document.getElementById('txLanggananDue').value||date;
Object.assign(existingBill,{name:nama,amount:amt,freq,nextDue:due,category:cat,accountId:accId,note});
Object.assign(existingTx,{amount:amt,category:cat,subcategory:subCat,accountId:accId,date,note:nama+(note?' - '+note:'')});
}
txEditId=null;
rememberLastAccForCat(cat,accId);
if(_txCatLearnSource){learnCatFromItemName(_txCatLearnSource,cat);_txCatLearnSource=null;}
save();closeModal('txModal');renderDashboard();renderKeuangan();renderBillList();checkBills();
toast('✅ Cicilan/tagihan diperbarui');
return;
}
if(curPayMethod==='cicilan'){
const nama=document.getElementById('txCicilanNama').value.trim()||cat;
const total=parseFloat(document.getElementById('txCicilanTotal').value)||amt;
const tenor=parseInt(document.getElementById('txCicilanTenor').value)||6;
const bunga=parseFloat(document.getElementById('txCicilanBunga').value)||0;
const due=document.getElementById('txCicilanDue').value||date;
const totalBayar=total*(1+bunga/100);
const perBulan=Math.ceil(totalBayar/tenor);
const sh=getCicilanSharedMine(perBulan);
const cicilanShared=sh.shared;
const cicilanSharedPct=sh.pct;
const perBulanMine=sh.mine;
if(existingTx) D.transactions=D.transactions.filter(t=>t.id!==existingTx.id);
const billId=uid();
const sisaTenor=tenor-1;
if(sisaTenor>0){
const nextDueDate=new Date(due);
nextDueDate.setMonth(nextDueDate.getMonth()+1);
const nextDue=nextDueDate.toISOString().split('T')[0];
D.bills.push({id:billId,name:nama,amount:perBulanMine,nextDue,freq:'bulanan',sisaTenor,category:cat,subcategory:subCat,accountId:accId,note:note,kind:'cicilan',totalHarga:total,tenor,bunga,shared:cicilanShared,sharedPct:cicilanSharedPct,totalAmount:cicilanShared?total:null});
}
D.transactions.push({id:billId+1,type:'expense',amount:perBulanMine,category:cat,subcategory:subCat,accountId:accId,payMethod:'cicilan',billLinkId:sisaTenor>0?billId:null,note:nama+(note?' - '+note:''),date});
applyTxStockFromTx(nama);
applyTxCobekStockFromTx(billId+1,nama,null);
WorthIt.applyBuyLink(billId+1);
txEditId=null;
rememberLastAccForCat(cat,accId);
if(_txCatLearnSource){learnCatFromItemName(_txCatLearnSource,cat);_txCatLearnSource=null;}
save();closeModal('txModal');renderDashboard();renderKeuangan();renderBillList();checkBills();
toast(cicilanShared?`✅ Cicilan ${nama} ${tenor}x dimulai! Porsi kamu ${fmtFull(perBulanMine)}/bulan (total ${fmtFull(perBulan)}/bulan)`:`✅ Cicilan ${nama} ${tenor}x dimulai! ${fmtFull(perBulan)}/bulan`);
return;
}
if(curPayMethod==='langganan'){
const nama=document.getElementById('txLanggananNama').value.trim()||cat;
const freq=document.getElementById('txLanggananFreq').value;
const due=document.getElementById('txLanggananDue').value||date;
const dueNext=new Date(due);
if(freq==='bulanan')dueNext.setMonth(dueNext.getMonth()+1);
else if(freq==='mingguan')dueNext.setDate(dueNext.getDate()+7);
else if(freq==='tahunan')dueNext.setFullYear(dueNext.getFullYear()+1);
if(existingTx) D.transactions=D.transactions.filter(t=>t.id!==existingTx.id);
const billId=uid();
const alreadyExists=D.bills.find(b=>b.name===nama&&b.kind==='langganan');
if(!alreadyExists){
D.bills.push({id:billId,name:nama,amount:amt,nextDue:dueNext.toISOString().split('T')[0],freq,sisaTenor:null,category:cat,subcategory:subCat,accountId:accId,note:note,kind:'langganan'});
}
D.transactions.push({id:billId+1,type:'expense',amount:amt,category:cat,subcategory:subCat,accountId:accId,payMethod:'langganan',note:nama+(note?' - '+note:''),date});
applyTxStockFromTx(nama);
applyTxCobekStockFromTx(billId+1,nama,null);
WorthIt.applyBuyLink(billId+1);
txEditId=null;
rememberLastAccForCat(cat,accId);
if(_txCatLearnSource){learnCatFromItemName(_txCatLearnSource,cat);_txCatLearnSource=null;}
save();closeModal('txModal');renderDashboard();renderKeuangan();renderBillList();checkBills();
toast(`✅ ${nama} dicatat & dijadwalkan ${freq}`);
return;
}
let savedTxId;
if(existingTx){
Object.assign(existingTx,{type:curTxType,amount:amt,category:cat,subcategory:subCat,accountId:accId,payMethod:'tunai',note,date});
delete existingTx.billLinkId;
if(existingTx.servisLinkId&&D.servisLogs){
const linkedServis=D.servisLogs.find(s=>s.id===existingTx.servisLinkId);
if(linkedServis)Object.assign(linkedServis,{cost:amt,date,accountId:accId});
}
if(existingTx.renovItemLinkId){
Renov.onLinkedTxEdited(existingTx);
}
if(existingTx.wishlistLinkId){
WorthIt.onLinkedTxEdited(existingTx);
}
if(existingTx.sewaKiosLinkId){
SewaKios.onLinkedTxEdited(existingTx);
}
savedTxId=existingTx.id;
} else {
savedTxId=uid();
D.transactions.push({
id:savedTxId,type:curTxType,amount:amt,
category:cat,subcategory:subCat,
accountId:accId,payMethod:'tunai',
note:note,date
});
WorthIt.applyBuyLink(savedTxId);
SewaKios.applyPaymentLink(savedTxId);
Tukang.applyPendingPayment(savedTxId);
}
applyTxStockFromTx(note);
applyTxBbmFromTx(savedTxId,amt,date,accId,note,existingTx);
applyTxCobekStockFromTx(savedTxId,note,existingTx);
applyTxCobekSaleFromTx(savedTxId,date,accId,note,existingTx);
txEditId=null;
rememberLastAccForCat(cat,accId);
if(_txCatLearnSource){learnCatFromItemName(_txCatLearnSource,cat);_txCatLearnSource=null;}
save();closeModal('txModal');renderDashboard();renderKeuangan();renderCnTab();toast(existingTx?'✅ Transaksi diperbarui':'✅ Transaksi tersimpan');
}
function setKeuanganTab(t,el){
document.querySelectorAll('#page-keuangan .cn-tab').forEach(b=>b.classList.remove('active'));
if(el) el.classList.add('active');
else { const btn=document.querySelectorAll('#page-keuangan .cn-tab')[t==='laporan'?1:0]; if(btn) btn.classList.add('active'); }
document.getElementById('keuanganTab-kelola').classList.toggle('u-dnone', t!=='kelola');
document.getElementById('keuanganTab-kelola').style.display='';
document.getElementById('keuanganTab-laporan').classList.toggle('u-dnone', t!=='laporan');
document.getElementById('keuanganTab-laporan').style.display='';
if(t==='kelola'){populateKeuFilters();loadKeuFilterPrefsIntoDOM();renderKeuangan();renderBillList();}
if(t==='laporan'){populateCatFilter();populateAccFilters();renderLaporan();}
}
function saveTarget(){
const name=document.getElementById('tName').value;
const amt=parseFloat(document.getElementById('tAmt').value);
if(!name||!amt){toast('⚠️ Isi nama dan target');return;}
const accId=document.getElementById('tAcc').value||null;
const saved=accId?0:(parseFloat(document.getElementById('tSaved').value)||0);
const isDanaDarurat=document.getElementById('tDanaDarurat').checked;
if(isDanaDarurat)D.targets.forEach(t=>{t.isDanaDarurat=false;});
D.targets.push({id:uid(),name,amount:amt,saved,accountId:accId,emoji:document.getElementById('tEmoji').value||'🎯',isDanaDarurat});
save();closeModal('targetModal');renderSettings();
if(typeof AlokasiAset!=='undefined')AlokasiAset.renderAll();
toast(accId?'✅ Target tersimpan, tersambung ke akun (otomatis update)':'✅ Target tersimpan');
}
function saveCatatan(){
const text=document.getElementById('catatanText').value;
if(!text){toast('⚠️ Tulis catatan dulu');return;}
if(!D.catatan[curCatatan])D.catatan[curCatatan]=[];
D.catatan[curCatatan].push({id:uid(),date:document.getElementById('catatanDate').value,text});
save();closeModal('catatanModal');renderSettings();toast('✅ Catatan tersimpan');
}
function saveReminder(){
const title=document.getElementById('rTitle').value;
if(!title){toast('⚠️ Isi judul');return;}
D.reminders.push({id:uid(),title,desc:document.getElementById('rDesc').value,color:document.getElementById('rColor').value});
save();closeModal('reminderModal');renderSettings();toast('✅ Pengingat tersimpan');
}
function saveLDR(){D.nextPulang=document.getElementById('nextPulang').value;D.ldrCycleStart=new Date().toISOString().slice(0,10);save();renderLDR();}

// (v94): toggleMs/showTargetAccountTx/addTarget/delTarget/delReminder dipindah dari
// backup-restore.js (skrg backup-restore.js) — domain Target/Milestone/
// Reminder di Pengaturan, gabung bareng saveTarget/saveCatatan/saveReminder/saveLDR di atas yang sudah
// lebih dulu ada di sini sejak v83.
function toggleMs(i){D.milestones[i]=!D.milestones[i];save();renderMs();}
/* moved to modules-render.js: renderMs */
/* moved to modules-render.js: renderTarget */
function showTargetAccountTx(targetId){
const t=D.targets.find(x=>sameId(x.id,targetId));if(!t||!t.accountId)return;
const acc=D.accounts.find(a=>a.id===t.accountId);if(!acc)return;
const txs=D.transactions.filter(x=>x.accountId===acc.id).sort((a,b)=>new Date(b.date)-new Date(a.date));
const bal=recalcAccBalance(acc.id);
document.getElementById('filterTxTitle').textContent=`${t.emoji} ${t.name} (${acc.emoji} ${acc.name})`;
document.getElementById('filterTxSummary').textContent=`${txs.length} transaksi · Saldo saat ini ${fmtFull(bal)} dari target ${fmtFull(t.amount)}`;
document.getElementById('filterTxList').innerHTML=txs.length?txs.slice(0,100).map(txHTML).join(''):'<div class="empty"><div class="empty-icon">💸</div><div class="empty-text">Belum ada transaksi di akun ini</div></div>';
openModal('filterTxModal');
}
async function addTarget(i){const addStr=await showPromptModal({title:'Tambah Tabungan',message:'Tambah berapa? (Rp)',icon:'🎯',inputType:'number'});if(addStr===null)return;const add=parseFloat(addStr);if(!add||isNaN(add))return;D.targets[i].saved+=add;save();renderSettings();toast('✅ Target diperbarui');}
async function delTarget(i){if(!await askConfirm('Hapus target?'))return;D.targets.splice(i,1);save();renderSettings();toast('🗑 Target dihapus');}
/* moved to modules-render.js: renderReminder */
function delReminder(i){D.reminders.splice(i,1);save();renderSettings();}

// --- List Transaksi (kartu tx, hapus tx) & filter periode Keuangan/Laporan + Cashflow Forecast ---
// (v92): dipindah dari backup-restore.js — domainnya sama-sama seputar
// data transaksi (render kartu tx, hapus tx, filter rentang tanggal utk Keuangan/Laporan, proyeksi cashflow).
/* moved to modules-render.js: renderDashDanaDarurat */
function txHTML(t){
const cats=getAllCats();
let icon='💰', bg='var(--accent-soft)';
if(t.type==='transfer_out'||t.type==='transfer_in'){icon='⇄';bg='var(--accent-soft)';}
else { const cat=cats.find(c=>c.name===t.category); if(cat){icon=cat.emoji;} bg=t.type==='income'?'var(--accent3-soft)':'var(--accent2-soft)'; }
const sign=(t.type==='income'||t.type==='transfer_in')?'+':'-';
const cls=(t.type==='income'||t.type==='transfer_in')?'green':'red';
const acc=D.accounts.find(a=>a.id===t.accountId);
const subText=t.subcategory?(' · '+t.subcategory):'';
const pmIcons={cicilan:'💳',langganan:'🔁',tunai:''};
const pmBadge=(t.payMethod&&t.payMethod!=='tunai')?` <span class="acc-chip">${pmIcons[t.payMethod]||''} ${t.payMethod}</span>`:'';
return`<div class="tx-item u-pointer" data-action="editTx" data-args="${escapeHtml(JSON.stringify([t.id]))}">
    <div class="tx-icon" style="background:${bg}">${icon}</div>
    <div class="tx-info"><div class="tx-name">${escapeHtml(t.category)}${escapeHtml(subText)}</div><div class="tx-meta">${t.date}${t.note?' · '+escapeHtml(t.note):''}${acc?` <span class="acc-chip">${acc.emoji} ${escapeHtml(acc.name)}</span>`:''}${pmBadge}</div></div>
    <div class="u-flex u-aic u-gap6">
      <div class="tx-amount ${cls}">${sign}${fmt(t.amount)}</div>
      <button class="tx-del" data-stop="1" data-action="delTx" data-args="${escapeHtml(JSON.stringify([t.id]))}" aria-label="Hapus">🗑</button>
    </div>
  </div>`;
}
async function delTx(id){
if(!await askConfirm('Hapus transaksi ini?'))return;
const t=D.transactions.find(x=>x.id===id);
if(t&&t.bbmLinkId&&D.bbmLogs)D.bbmLogs=D.bbmLogs.filter(b=>b.id!==t.bbmLinkId);
if(t&&t.stockItems&&t.stockItems.length){
t.stockItems.forEach(si=>{
const p=D.products.find(x=>x.id===si.productId);
if(p)p.stock=Math.max(0,(p.stock||0)-(si.qty||0));
});
toast(`📦 Stok dikurangi (transaksi dihapus)`,2600);
} else if(t&&t.stockProductId){
const p=D.products.find(x=>x.id===t.stockProductId);
if(p){p.stock=Math.max(0,(p.stock||0)-(t.stockQty||0));toast(`📦 Stok "${p.name}" dikurangi ${t.stockQty} (transaksi dihapus)`,2600);}
}
if(t&&t.cobekLinkId){
const linkedCobek=D.cobek.find(c=>c.id===t.cobekLinkId);
if(linkedCobek&&linkedCobek.items){
linkedCobek.items.forEach(it=>{const p=D.products.find(x=>x.id===it.productId);if(p)p.stock=(p.stock||0)+it.qty;});
toast(`🪨 Stok dikembalikan, penjualan Shop terkait dihapus`,2600);
}
D.cobek=D.cobek.filter(c=>c.id!==t.cobekLinkId);
renderCobek();renderCobekRecent();
}
if(t&&t.servisLinkId&&D.servisLogs){
const linkedServis=D.servisLogs.find(s=>s.id===t.servisLinkId);
if(linkedServis){
if(linkedServis.usedPartId)revertStockUsage(linkedServis.usedPartId,linkedServis.usedPartQty);
toast(`🔧 Catatan servis terkait ikut dihapus`,2600);
}
D.servisLogs=D.servisLogs.filter(s=>s.id!==t.servisLinkId);
renderStockList();
}
if(t&&t.renovItemLinkId){
Renov.onLinkedTxDeleted(t);
}
if(t&&t.wishlistLinkId){
WorthIt.onLinkedTxDeleted(t);
}
if(t&&t.sewaKiosLinkId){
SewaKios.onLinkedTxDeleted(t);
}
if(t&&t.tukangPaymentEntryIds&&t.tukangPaymentEntryIds.length){
Tukang.unmarkPaidEntries(t.tukangPaymentEntryIds);
}
D.transactions=D.transactions.filter(t=>t.id!==id);
save();renderDashboard();renderKeuangan();renderCnTab();renderProductList();
if(!t||(!t.stockProductId&&!t.cobekLinkId&&!t.servisLinkId&&!(t.stockItems&&t.stockItems.length)))toast('🗑 Dihapus'+(t&&t.renovItemLinkId?' (status lunas di Proyek Renovasi dibatalkan)':(t&&t.wishlistLinkId?' (barang dikembalikan ke Prioritas Belanja)':(t&&t.tukangPaymentEntryIds&&t.tukangPaymentEntryIds.length?' (absensi tukang terkait dibuka kembali)':''))));
}
function changeMonth(dir){
curMonth+=dir;
if(curMonth>11){curMonth=0;curYear++;}
if(curMonth<0){curMonth=11;curYear--;}
closeModal('filterTxModal');
txListPage=1;
renderKeuangan();
}
let txListPeriode='bulan';
function setTxListPeriode(p,el){
txListPeriode=p;
document.querySelectorAll('#txListPeriodeChips .chip-btn').forEach(b=>b.classList.remove('active'));el.classList.add('active');
document.getElementById('txListCustomRange').classList.toggle('u-dnone', p!=='custom');
document.getElementById('txListCustomRange').style.display='';
resetTxPageAndRender();
}
function getTxListRange(){
if(txListPeriode==='selamanya')return{from:new Date(0),to:new Date(8640000000000000)};
const now=new Date();now.setHours(23,59,59,999);let from;
if(txListPeriode==='hari'){from=new Date();from.setHours(0,0,0,0);}
else if(txListPeriode==='minggu'){from=new Date();from.setDate(from.getDate()-from.getDay());from.setHours(0,0,0,0);}
else if(txListPeriode==='bulan'){from=new Date(curYear,curMonth,1);const to2=new Date(curYear,curMonth+1,0);to2.setHours(23,59,59,999);return{from,to:to2};}
else if(txListPeriode==='tahun'){from=new Date(now.getFullYear(),0,1);}
else{const f=document.getElementById('txListFrom').value,t2=document.getElementById('txListTo').value;return{from:f?new Date(f):new Date(0),to:t2?new Date(t2+'T23:59:59'):now};}
return{from,to:now};
}
/* moved to modules-render.js: renderKeuangan */
/* moved to modules-render.js: renderBudgets */
/* moved to modules-render.js: renderBudgetCatOptions */
function setPeriode(p,el){
filterPeriode=p;
document.querySelectorAll('#periodeChips .chip-btn').forEach(b=>b.classList.remove('active'));
if(el&&el.classList)el.classList.add('active');
document.getElementById('customRange').classList.toggle('u-dnone', p!=='custom');
document.getElementById('customRange').style.display='';
renderLaporan();
}
function getRange(){
if(filterPeriode==='selamanya')return{from:new Date(0),to:new Date(8640000000000000)};
const now=new Date();now.setHours(23,59,59,999);let from;
if(filterPeriode==='hari'){from=new Date();from.setHours(0,0,0,0);}
else if(filterPeriode==='minggu'){from=new Date();from.setDate(from.getDate()-from.getDay());from.setHours(0,0,0,0);}
else if(filterPeriode==='bulan'){from=new Date(now.getFullYear(),now.getMonth(),1);}
else if(filterPeriode==='tahun'){from=new Date(now.getFullYear(),0,1);}
else{const f=document.getElementById('fFrom').value,t2=document.getElementById('fTo').value;return{from:f?new Date(f):new Date(0),to:t2?new Date(t2+'T23:59:59'):now};}
return{from,to:now};
}
function computeCashflowForecast(){
const avail=(typeof BudgetReko!=='undefined')?BudgetReko.monthsAvailable():0;
const months=(typeof BudgetReko!=='undefined')?BudgetReko.effectiveMonths():3;
const from=(typeof BudgetReko!=='undefined')?BudgetReko.rangeFrom():(()=>{const n=new Date();return new Date(n.getFullYear(),n.getMonth()-2,1);})();
const now=new Date();
const txs=(D.transactions||[]).filter(t=>{const d=new Date(t.date);return d>=from&&d<=now;});
const incAvg=txs.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0)/months;
const expAvg=txs.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0)/months;
const saldoNow=totalSaldoAkun();
const in30=new Date(now);in30.setDate(in30.getDate()+30);
const upcoming=(D.bills||[]).filter(b=>{const d=new Date(b.nextDue);return d>=now&&d<=in30;});
const billsDue=upcoming.reduce((s,b)=>s+b.amount,0);
const projected=saldoNow+incAvg-expAvg-billsDue;
return{incAvg,expAvg,saldoNow,billsDue,upcoming,projected,months,avail};
}
/* moved to modules-render.js: renderCashflowForecast */
