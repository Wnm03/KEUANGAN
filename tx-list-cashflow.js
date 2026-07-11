// tx-list-cashflow.js — domain "List Transaksi (kartu tx, hapus tx), filter
// periode Keuangan/Laporan, & Cashflow Forecast".
// Dipindah dari transaksi.js (lihat CLAUDE.md catatan kerja "split
// transaksi.js" bagian ke-11 -- lanjutan bagian ke-5/6/7/8/9). Semua tetap
// fungsi global verbatim (tidak ada perubahan logika sama sekali), dipanggil
// sama persis dari HTML (app_production.html/index.html: onclick
// changeMonth/setTxListPeriode/setPeriode/setKeuanganTab), dari
// modules-render.js (renderKeuangan/renderLaporan/renderCashflowForecast
// masing2 makai getTxListRange/getRange/computeCashflowForecast), dari
// backup-restore.js & cobek.js (getRange/txHTML/computeCashflowForecast utk
// ekspor & kartu shop), dan features-sheets-pwa-selftest.js (self-test
// makai setKeuanganTab).
//
// Variabel state `txListPeriode` (filter periode List Transaksi di tab
// Kelola) ikut dipindah ke sini karena cuma dipakai bareng
// setTxListPeriode/getTxListRange di bawah -- beda dari `filterPeriode`
// (filter Laporan) yang sudah dideklarasikan bareng variabel global lain di
// features-helpers-global-security.js sejak awal, jadi TIDAK ikut dipindah.
// `curMonth`/`curYear`/`txListPage` juga TIDAK dipindah -- sudah dipakai
// modul lain (features-helpers-global-security.js, filter-laporan.js)
// sebelum sesi ini, dibiarkan di tempat asalnya.
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
