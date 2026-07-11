// app-bundle-a.min.js — DIBUAT OTOMATIS oleh build.js dari: modules-render.js, modals.js, modules-calc.js, cobek.js, kasir.js, piutang-utang.js, pajak-pbb-zakat.js, features-budget-laporan-carnotes-pelanggan.js, edukasi-dana.js, sewakios.js, hidup-seimbang.js, linktx.js, renovasi.js, aset.js, worthit.js
// JANGAN diedit manual — edit file source-nya lalu jalankan: node build.js
// Fungsi render (85 fungsi) dipisah dari app_production.html untuk pemerataan ukuran file.
// Semua fungsi ini murni definisi function global (bukan module), jadi tetap bisa dipanggil dari file manapun
// yang loadnya belakangan (sama seperti modules-calc.js/features-*.js).
const MODULE_RENDER_VERSION='kw81-rename-cobek-to-shop';

function renderPageContent(name){
if(name==='dashboard')renderDashboard();
if(name==='keuangan'){
populateKeuFilters();loadKeuFilterPrefsIntoDOM();renderKeuangan();renderBillList();
const lapTab=document.getElementById('keuanganTab-laporan');
if(lapTab&&lapTab.style.display!=='none'){populateCatFilter();populateAccFilters();renderLaporan();}
}
if(name==='shop'){renderShopRecent();renderProductList();renderShop();if(typeof Kasir!=='undefined')Kasir.render();}
if(name==='laporan'){populateCatFilter();populateAccFilters();renderLaporan();}
if(name==='carnotes'){renderVehicleSelect();renderCnTab();}
if(name==='ai')initChat();
if(name==='pajak')renderPajakZakat();
if(name==='settings'){renderSettings();renderBillList();}
}

function renderAccGrid(){
const el=document.getElementById('accGrid');
if(!el)return;
el.innerHTML=D.accounts.map((a,i)=>{
const bal=recalcAccBalance(a.id);
const off=a.includeInBalance===false;
const linked=!off&&isAccLinkedToAsset(a.id);
const badge=off?' <span class="u-fs12t2">(off)</span>':(linked?' <span class="u-fs12t2">(via Aset)</span>':'');
return`<div class="acc-card" style="${off||linked?'opacity:.55':''}" data-action="openAccModal" data-args="${escapeHtml(JSON.stringify([i]))}">
      <button class="acc-card-del" data-stop="1" data-action="delAcc" data-args="${escapeHtml(JSON.stringify([i]))}" aria-label="Hapus">🗑</button>
      <div class="acc-card-icon">${a.emoji}</div>
      <div class="acc-card-name">${escapeHtml(a.name)}${badge}</div>
      <div class="acc-card-bal ${bal<0?'red':'green'}">${bal<0?'-':''}${fmt(Math.abs(bal))}</div>
    </div>`;
}).join('');
}

function renderDashAccList(){
const el=document.getElementById('dashAccList');
if(!el)return;
if(!D.accounts.length){el.innerHTML='<div class="empty"><div class="empty-text">Belum ada akun</div></div>';return;}
const visible=D.accounts.filter(a=>a.includeInBalance!==false);
el.innerHTML=(visible.length?visible:D.accounts).map(a=>{
const bal=recalcAccBalance(a.id);
return`<div class="aset-item"><div class="tx-icon u-bgaccsoft">${a.emoji}</div><div class="tx-info"><div class="tx-name">${escapeHtml(a.name)}</div></div><div class="tx-amount ${bal<0?'red':'green'}">${bal<0?'-':''}${fmt(Math.abs(bal))}</div></div>`;
}).join('');
const tEl=document.getElementById('dashAccTotal');
if(tEl){const t=totalSaldoAkun();tEl.textContent=(t<0?'-':'')+fmt(Math.abs(t));tEl.className='stat-val '+(t<0?'red':'green');}
}

function renderLapAccList(){
const el=document.getElementById('lapAccList');
if(!el)return;
if(!D.accounts.length){el.innerHTML='<div class="empty"><div class="empty-text">Belum ada akun</div></div>';return;}
el.innerHTML=D.accounts.map(a=>{
const bal=recalcAccBalance(a.id);
const off=a.includeInBalance===false;
const linked=!off&&isAccLinkedToAsset(a.id);
const badge=off?' <span class="u-fs12t2">(tidak dihitung)</span>':(linked?' <span class="u-fs12t2">(sudah dihitung via 📋 Buku Aset)</span>':'');
return`<div class="aset-item" style="${off||linked?'opacity:.5':''};cursor:pointer" data-action="quickToggleInclude" data-args="${escapeHtml(JSON.stringify([a.id]))}">
      <div class="tx-icon u-bgaccsoft">${a.emoji}</div>
      <div class="tx-info"><div class="tx-name">${escapeHtml(a.name)}${badge}</div></div>
      <div class="tx-amount ${bal<0?'red':'green'}">${bal<0?'-':''}${fmt(Math.abs(bal))}</div>
    </div>`;
}).join('');
const tEl=document.getElementById('lapAccTotal');
if(tEl){const t=totalSaldoAkun();tEl.textContent=(t<0?'-':'')+fmt(Math.abs(t));tEl.className='stat-val '+(t<0?'red':'green');}
}

function renderReceiptInsight(amt,catName,guessedCat){
const el=document.getElementById('txScanInsight');
if(!el)return;
if(!amt||!catName){el.style.display='none';el.innerHTML='';return;}
const lines=[];
lines.push(`<div class="u-fw700 u-mb4">💡 Insight Otomatis</div>`);
lines.push(`<div>${guessedCat?guessedCat.emoji||'📦':'📦'} Kategori terdeteksi: <b>${escapeHtml(catName)}</b></div>`);
const hist=(D.transactions||[]).filter(t=>t.type==='expense'&&t.category&&t.category.trim().toLowerCase()===catName.trim().toLowerCase());
if(hist.length){
const avg=hist.reduce((s,t)=>s+t.amount,0)/hist.length;
const diffPct=avg>0?Math.round(((amt-avg)/avg)*100):0;
if(Math.abs(diffPct)<8){
lines.push(`<div>📊 Sekitar rata-rata belanja kategori ini (${fmt(avg)}/transaksi, dari ${hist.length}x catatan).</div>`);
}else if(diffPct>0){
lines.push(`<div>📈 <b>${diffPct}% lebih tinggi</b> dari rata-rata belanja kategori ini (${fmt(avg)}/transaksi, dari ${hist.length}x catatan).</div>`);
}else{
lines.push(`<div>📉 <b>${Math.abs(diffPct)}% lebih rendah</b> dari rata-rata belanja kategori ini (${fmt(avg)}/transaksi, dari ${hist.length}x catatan).</div>`);
}
}else{
lines.push(`<div>🆕 Ini catatan pertama untuk kategori ini.</div>`);
}
const fakeTx={type:'expense',category:catName,subcategory:(document.getElementById('txSubCat')?document.getElementById('txSubCat').value.trim():''),amount:amt};
const matchedBudgets=(D.budgets||[]).filter(b=>budgetMatchesTx(b,fakeTx));
matchedBudgets.forEach(b=>{
const used=getBudgetUsed(b);
const lim=getBudgetEffectiveLimit(b);
const projected=used+amt;
const sisaAfter=lim-projected;
const pctAfter=lim>0?Math.round((projected/lim)*100):0;
if(sisaAfter<0){
lines.push(`<div>🚨 Anggaran "<b>${escapeHtml(b.name)}</b>" akan <b>lewat ${fmt(Math.abs(sisaAfter))}</b> kalau transaksi ini disimpan (${pctAfter}% terpakai).</div>`);
}else if(pctAfter>=80){
lines.push(`<div>⚠️ Anggaran "<b>${escapeHtml(b.name)}</b>" akan terpakai <b>${pctAfter}%</b>, sisa ${fmt(sisaAfter)}.</div>`);
}else{
lines.push(`<div>✅ Anggaran "<b>${escapeHtml(b.name)}</b>" masih aman, sisa ${fmt(sisaAfter)} (${pctAfter}% terpakai).</div>`);
}
});
el.innerHTML=lines.join('');
el.style.display='block';
}


function renderPajakRekomendasi(applyOpen){
const card=document.getElementById('pajakRekomendasiCard'),txt=document.getElementById('pajakRekomendasiText');
if(!card||!txt)return;
const status=D.profile&&D.profile.statusPekerjaan;
const umkmDetails=document.getElementById('umkmDetails');
if(!status){card.style.display='none';return;}
card.classList.remove('u-dnone');card.style.display='block';
if(status==='karyawan'){
txt.innerHTML='💡 Status kerjamu <b>Karyawan</b> — pakai kalkulator <b>🧾 Estimasi PPh 21</b> di bawah. Kalkulator PPh Final UMKM bisa diabaikan kecuali ada usaha sampingan.';
if(applyOpen&&umkmDetails)umkmDetails.open=false;
} else if(status==='freelance'){
txt.innerHTML='💡 Status kerjamu <b>Freelance/UMKM</b> — pakai kalkulator <b>🏪 Pajak Bisnis Shop (UMKM)</b> di bawah (PPh Final 0,5% dari omzet). Kalkulator PPh 21 untuk skema karyawan bisa diabaikan.';
if(applyOpen&&umkmDetails)umkmDetails.open=true;
} else {
txt.innerHTML='💡 Kamu punya penghasilan <b>Karyawan & usaha sendiri</b> — cek dua-duanya: <b>PPh 21</b> untuk gaji, <b>PPh Final UMKM</b> untuk omzet usaha.';
if(applyOpen&&umkmDetails)umkmDetails.open=true;
}
}

function renderCatList(){
const el=document.getElementById('catList');if(!el)return;
let types=curCatFilter==='semua'?['income','expense']:[curCatFilter];
let html='';
types.forEach(type=>{
D.categories[type].forEach((c,idx)=>{
const hasSubs=c.subs&&c.subs.length>0;
html+=`<div class="cat-group">
        <div class="cat-group-head">
          ${hasSubs?`<span class="cat-group-toggle" id="arrow_${c.id}" data-action="toggleCatGroup" data-args="${escapeHtml(JSON.stringify([c.id]))}" role="button" tabindex="0" aria-label="Tampilkan/sembunyikan subkategori ${escapeHtml(c.name)}">▶</span>`:'<span style="width:11px;display:inline-block"></span>'}
          <div class="cat-emoji" data-action="openCatModal" data-args="${escapeHtml(JSON.stringify([idx, type]))}" aria-label="Edit kategori ${escapeHtml(c.name)}">${c.emoji}</div>
          <div class="cat-name" data-action="openCatModal" data-args="${escapeHtml(JSON.stringify([idx, type]))}">${escapeHtml(c.name)}</div>
          <span class="cat-type-badge ${type==='income'?'cat-type-in':'cat-type-out'}">${type==='income'?'Masuk':'Keluar'}</span>
          <button class="tx-del" data-action="openSubCatModal" data-args="${escapeHtml(JSON.stringify([c.id, type]))}" title="Tambah subkategori" aria-label="Tambah subkategori">➕</button>
          <button class="tx-del" data-action="delCat" data-args="${escapeHtml(JSON.stringify([c.id, type]))}" aria-label="Hapus">🗑</button>
        </div>
        ${hasSubs?`<div class="cat-sub-list" id="subs_${c.id}">${c.subs.map(s=>`<div class="cat-sub-item"><span class="u-fs12 u-ctext3">↳</span><div class="cat-sub-name u-pointer" data-action="openSubCatModal" data-args="${escapeHtml(JSON.stringify([c.id, type, s.id]))}" title="Edit subkategori" aria-label="Edit subkategori ${escapeHtml(s.name)}">${escapeHtml(s.name)}</div><button class="tx-del" data-action="delSubCat" data-args="${escapeHtml(JSON.stringify([c.id, type, s.id]))}" aria-label="Hapus">🗑</button></div>`).join('')}</div>`:''}
      </div>`;
});
});
el.innerHTML=html||'<div class="empty"><div class="empty-text">Belum ada kategori</div></div>';
}

function renderBillHistory(){
if(curBillHistoryId==null)return;
const modal=document.getElementById('billHistoryModal');
if(!modal||!modal.classList.contains('open'))return;
const b=D.bills.find(x=>x.id===curBillHistoryId)||(D.billsArchive||[]).find(x=>x.id===curBillHistoryId);
const subEl=document.getElementById('billHistorySub');
const listEl=document.getElementById('billHistoryList');
if(!listEl)return;
const rows=D.transactions.filter(t=>t.billLinkId===curBillHistoryId).sort((a,b2)=>new Date(b2.date)-new Date(a.date));
const lunasTag=D.bills.find(x=>x.id===curBillHistoryId)?'':' · ✅ Lunas';
if(subEl)subEl.textContent=b?`${b.name} · ${rows.length}x pembayaran tercatat${lunasTag}`:`${rows.length}x pembayaran tercatat`;
if(!rows.length){
listEl.innerHTML='<div class="empty"><div class="empty-icon">📋</div><div class="empty-text">Belum ada riwayat pembayaran</div></div>';
return;
}
listEl.innerHTML=rows.map(t=>{
const d=new Date(t.date);
return`<div class="bill-item">
      <div class="tx-icon u-bgaccsoft">💸</div>
      <div class="tx-info">
        <div class="tx-name">${d.toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})}</div>
        <div class="tx-meta">${escapeHtml(t.note||'-')}</div>
      </div>
      <div class="tx-amount red">${fmt(t.amount)}</div>
      <div class="u-flex u-fdcol u-gap4 u-ml4">
        <button class="tx-del u-cacc" data-action="editBillHistoryTx" data-args="${escapeHtml(JSON.stringify([t.id]))}" title="Edit" aria-label="Edit">✏️</button>
      </div>
    </div>`;
}).join('');
}

function renderBillArchive(){
const listEl=document.getElementById('billArchiveList');
if(!listEl)return;
const rows=[...(D.billsArchive||[])].sort((a,b)=>new Date(b.completedAt||0)-new Date(a.completedAt||0));
const icons={tagihan:'🧾',cicilan:'💳',langganan:'🔁'};
if(!rows.length){
listEl.innerHTML='<div class="empty"><div class="empty-icon">✅</div><div class="empty-text">Belum ada cicilan/tagihan yang lunas</div></div>';
return;
}
listEl.innerHTML=rows.map(b=>`<div class="bill-item">
    <div class="tx-icon u-bgaccsoft">${icons[b.kind]||'✅'}</div>
    <div class="tx-info">
      <div class="tx-name">${escapeHtml(b.name)}</div>
      <div class="tx-meta">Lunas ${b.completedAt?new Date(b.completedAt).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'}):'-'}${b.tenor?` · ${b.tenor}x cicilan`:''}</div>
    </div>
    <div class="u-flex u-fdcol u-gap4 u-ml4">
      <button class="tx-del u-cacc3" data-action="openBillHistory" data-args="${escapeHtml(JSON.stringify([b.id]))}" title="Riwayat Pembayaran" aria-label="Riwayat Pembayaran">📋</button>
    </div>
  </div>`).join('');
}

function renderBillList(){
const targets=['billList','billListKeu'].map(id=>document.getElementById(id)).filter(Boolean);
if(!targets.length)return;
populateBillFilterOptions();
const icons={tagihan:'🧾',cicilan:'💳',langganan:'🔁'};
const today=new Date();today.setHours(0,0,0,0);
let combined=[
...D.bills.map(b=>({...b,_lunas:false,_dateForFilter:b.nextDue})),
...(D.billsArchive||[]).map(b=>({...b,_lunas:true,_dateForFilter:b.completedAt||b.nextDue}))
];
const totalCount=combined.length;
combined=combined.filter(b=>{
if(billFilterStatus==='aktif'&&b._lunas)return false;
if(billFilterStatus==='lunas'&&!b._lunas)return false;
if(billFilterKategori!=='all'&&b.category!==billFilterKategori)return false;
const d=new Date(b._dateForFilter);
if(billFilterBulan!=='all'&&(isNaN(d)||d.getMonth()!==parseInt(billFilterBulan)))return false;
if(billFilterTahun!=='all'&&(isNaN(d)||d.getFullYear()!==parseInt(billFilterTahun)))return false;
return true;
});
const isFiltering=billFilterStatus!=='all'||billFilterKategori!=='all'||billFilterBulan!=='all'||billFilterTahun!=='all';
const countEl=document.getElementById('billFilterCount');
const resetBtn=document.getElementById('billFilterResetBtn');
if(countEl)countEl.textContent=isFiltering?`Menampilkan ${combined.length} dari ${totalCount} tagihan`:'';
if(resetBtn)resetBtn.style.display=isFiltering?'inline-block':'none';
const filterToggleBtn=document.getElementById('billFilterToggleBtn');
if(filterToggleBtn)filterToggleBtn.innerHTML=isFiltering?'🔍 Filter •':'🔍 Filter';
if(!combined.length){
const resetHtml=isFiltering?'<button class="btn btn-ghost btn-sm u-mt10" data-action="resetBillFilter">↺ Reset Filter</button>':'';
const msg=isFiltering?'Tidak ada tagihan yang cocok dengan filter':'Belum ada tagihan terjadwal';
targets.forEach(el=>el.innerHTML=`<div class="empty"><div class="empty-icon">🔔</div><div class="empty-text">${msg}</div>${resetHtml}</div>`);
updateBillStatGrid('keuBill');
return;
}
const sorted=combined.sort((a,b)=>{
if(a._lunas!==b._lunas)return a._lunas?1:-1;
return new Date(a._dateForFilter)-new Date(b._dateForFilter);
});
const html=sorted.map(b=>{
const due=new Date(b._dateForFilter);
const diff=Math.ceil((due-today)/(1000*60*60*24));
const soon=diff<=7;
let cicilanBar='';
if(b.kind==='cicilan'&&b.tenor&&b.sisaTenor!==null){
const sudah=b.tenor-b.sisaTenor;
const pct=Math.round((sudah/b.tenor)*100);
cicilanBar=`<div class="u-mt4"><div class="u-flex u-jcb u-fs12 u-t2 u-mb2"><span>Cicilan ke-${sudah} dari ${b.tenor}x</span><span>${pct}%</span></div><div class="prog-bar" style="height:4px"><div class="prog-fill purple" style="width:${pct}%"></div></div></div>`;
}
const statusBadge=b._lunas?`<span class="bill-due-badge bill-due-ok">✅ Lunas</span>`:`<span class="bill-due-badge ${soon?'bill-due-soon':'bill-due-ok'}">${diff<0?'Lewat':diff===0?'Hari ini':diff+' hari'}</span>`;
const anomaly=b._lunas?null:getBillAnomalyInfo(b.id,b.amount);
const anomalyNote=anomaly?`<div class="u-fs11 u-mt2 u-fw700" style="color:var(--accent4)">⚠️ Naik ${anomaly.pctChange}% dari rata-rata ${anomaly.count}x terakhir (${fmt(anomaly.avgPrev)}) — cek lagi sebelum bayar</div>`:'';
const actionBtns=b._lunas?
`<button class="tx-del u-cacc3" data-action="openBillHistory" data-args="${escapeHtml(JSON.stringify([b.id]))}" title="Riwayat Pembayaran" aria-label="Riwayat Pembayaran">📋</button>`:
`<button class="tx-del" data-action="markBillPaid" data-args="${escapeHtml(JSON.stringify([b.id]))}" title="Bayar sekarang" aria-label="Bayar sekarang">✅</button>
       <button class="bill-more-btn" data-action="openBillActionsMenu" data-args="${escapeHtml(JSON.stringify([b.id]))}" title="Opsi lainnya" aria-label="Opsi lainnya">⋮</button>`;
return`<div class="bill-item" style="flex-direction:column;align-items:stretch;gap:8px;${b._lunas?'opacity:0.75':''}">
      <div class="u-flex u-aic u-gap10">
        <div class="tx-icon u-bgaccsoft">${icons[b.kind]||'🔔'}</div>
        <div class="tx-info">
          <div class="tx-name">${escapeHtml(b.name)} ${b.category?`<span class="acc-chip">${b.category}</span>`:''} ${b.subcategory?`<span class="acc-chip">${b.subcategory}</span>`:''} ${b.shared?`<span class="acc-chip">👫 ${b.sharedPct}% dari ${fmt(b.totalAmount)}</span>`:''} ${!b._lunas&&b.sisaTenor!=null?`<span class="acc-chip">${b.sisaTenor}x lagi</span>`:''}</div>
          <div class="tx-meta">${b._lunas?'Lunas':'Jatuh tempo'} ${due.toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'})} · ${b.freq}</div>
        </div>
        <div class="u-flex u-fdcol u-gap4" style="align-items:flex-end">
          <div class="tx-amount red">${fmt(b.amount)}</div>
          ${statusBadge}
        </div>
      </div>
      ${cicilanBar}
      ${anomalyNote}
      <div class="u-flex u-gap6 u-fwrap" style="justify-content:flex-end">
        ${actionBtns}
      </div>
    </div>`;
}).join('');
targets.forEach(el=>el.innerHTML=html);
updateBillStatGrid('keuBill');
}

function renderDashCashflowForecast(){
const card=document.getElementById('cashflowForecastCard');
if(!card)return;
if(!D.bills||!D.bills.length){card.style.display='none';return;}
const today=new Date();today.setHours(0,0,0,0);
const rangeEnd=new Date(today);rangeEnd.setDate(rangeEnd.getDate()+30);
const curBalance=totalSaldoAkun();
let running=curBalance;
let dangerDate=null;
const events=[];
D.bills.forEach(b=>{
getBillOccurrencesInRange(b,today,rangeEnd).forEach(d=>events.push({date:d,amount:b.amount,name:b.name}));
});
events.sort((a,b)=>a.date-b.date);
events.forEach(e=>{
running-=e.amount;
if(running<0&&!dangerDate)dangerDate=e.date;
});
const total30=events.reduce((s,e)=>s+e.amount,0);
if(!events.length){card.style.display='none';return;}
card.classList.remove('u-dnone');card.style.display='block';
const safe=running>=0;
card.innerHTML=`
    <div class="card-title">📉 Proyeksi Arus Kas (30 Hari) <span class="card-collapse-toggle" id="cashflowForecastCard-chev" data-action="toggleCardCollapse" data-args='["cashflowForecastCard","$event"]' aria-label="Buka/tutup bagian">▾</span></div>
    <div class="card-collapse-body" id="cashflowForecastCard-cbody">
    <div class="u-fs12 u-t2 u-mb10">Saldo sekarang ${fmt(curBalance)} dikurangi ${events.length} tagihan/cicilan/langganan (total ${fmt(total30)}) yang jatuh tempo dalam 30 hari ke depan.</div>
    ${safe
?`<div class="u-r10 u-cacc3 u-fs13 u-fw600" style="padding:10px;background:var(--accent3-soft)">✅ Aman — proyeksi saldo tetap positif: ${fmt(running)}</div>`
:(()=>{
const daysToDanger=Math.max(1,Math.round((dangerDate-today)/86400000));
return `<div class="u-r10 u-cacc2 u-fs13 u-fw600" style="padding:10px;background:var(--accent2-soft)">⚠️ Berpotensi MINUS ${fmt(Math.abs(running))} sekitar ${dangerDate.toLocaleDateString('id-ID',{day:'numeric',month:'long'})} kalau tidak ada pemasukan tambahan.
        <div class="u-fw400 u-mt6 u-fs12">${cashflowActionSuggestion(Math.abs(running),daysToDanger)}</div></div>`;
})()}
    </div>
  `;
applyOneCardCollapsePref('cashflowForecastCard');
}

function renderBillCalendar(){
const labelEl=document.getElementById('billCalLabel');
const gridEl=document.getElementById('billCalGrid');
const totalEl=document.getElementById('billCalTotal');
const dayListEl=document.getElementById('billCalDayList');
if(!gridEl)return;
labelEl.textContent=MONTHS_FULL[billCalMonth]+' '+billCalYear;
const byDate={};
D.bills.forEach(b=>{
getBillOccurrencesInMonth(b,billCalYear,billCalMonth).forEach(d=>{
const key=d.toISOString().split('T')[0];
if(!byDate[key])byDate[key]=[];
byDate[key].push(b);
});
});
const monthTotal=Object.values(byDate).flat().reduce((s,b)=>s+(b.amount||0),0);
const totalCount=Object.values(byDate).flat().length;
totalEl.textContent=totalCount?`${totalCount} jatuh tempo bulan ini · Total ${fmt(monthTotal)}`:'Tidak ada tagihan jatuh tempo bulan ini';
const firstDow=new Date(billCalYear,billCalMonth,1).getDay();
const daysInMonth=new Date(billCalYear,billCalMonth+1,0).getDate();
const todayStr=new Date().toISOString().split('T')[0];
let html='';
for(let i=0;i<firstDow;i++)html+='<div class="billcal-day empty"></div>';
for(let day=1;day<=daysInMonth;day++){
const dateStr=`${billCalYear}-${String(billCalMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
const hasBill=!!byDate[dateStr];
const cls=['billcal-day'];
if(dateStr===todayStr)cls.push('today');
if(hasBill)cls.push('has-bill');
if(dateStr===billCalSelectedDate)cls.push('selected');
html+=`<div class="${cls.join(' ')}" data-action="selectBillCalDay" data-args="${escapeHtml(JSON.stringify([dateStr]))}">${day}${hasBill?'<div class="billcal-dot"></div>':''}</div>`;
}
gridEl.innerHTML=html;
const selList=billCalSelectedDate?(byDate[billCalSelectedDate]||[]):[];
if(!billCalSelectedDate){
dayListEl.innerHTML='';
} else if(!selList.length){
const dLabel=new Date(billCalSelectedDate).toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long'});
dayListEl.innerHTML=`<div class="u-fs12 u-t2 u-mb8">${dLabel}</div><div class="empty" style="padding:16px 0"><div class="empty-icon">📭</div><div class="empty-text">Tidak ada tagihan jatuh tempo</div></div>`;
} else {
const icons={tagihan:'🧾',cicilan:'💳',langganan:'🔁'};
const dLabel=new Date(billCalSelectedDate).toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long'});
dayListEl.innerHTML=`<div class="u-fs12 u-t2 u-mb8">${dLabel} · ${selList.length} tagihan</div>`
+selList.map(b=>`<div class="bill-item">
        <div class="tx-icon u-bgaccsoft">${icons[b.kind]||'🔔'}</div>
        <div class="tx-info">
          <div class="tx-name">${escapeHtml(b.name)} ${b.category?`<span class="acc-chip">${escapeHtml(b.category)}</span>`:''}</div>
          <div class="tx-meta">${b.freq}${b.sisaTenor!=null?` · sisa ${b.sisaTenor}x`:''}</div>
        </div>
        <div class="tx-amount red">${fmt(b.amount)}</div>
      </div>`).join('');
}
}

function renderDashboardBills(billStats){
const card=document.getElementById('dashBillCard');if(!card)return;
if(!D.bills.length){card.style.display='none';return;}
card.classList.remove('u-dnone');card.style.display='block';
const s=billStats||getBillStats();
document.getElementById('dashBillMonthTotal').textContent=fmt(s.monthTotal);
document.getElementById('dashBillUpcomingCount').textContent=s.soonCount;
document.getElementById('dashBillOutstanding').textContent=fmt(s.outstanding);
const badge=document.getElementById('dashBillOverdueBadge');
if(s.overdueCount>0){badge.classList.remove('u-dnone');badge.style.display='inline-block';badge.textContent=s.overdueCount+' Terlambat';}else{badge.style.display='none';}
const icons={tagihan:'🧾',cicilan:'💳',langganan:'🔁'};
document.getElementById('dashBillMiniList').innerHTML=s.nearest.map(({b,diff})=>`
    <div class="u-flex u-aic u-gap8" style="padding:8px 0;border-top:1px solid var(--border)">
      <div class="tx-icon u-bgaccsoft" style="width:32px;height:32px;font-size:15px">${icons[b.kind]||'🔔'}</div>
      <div class="tx-info"><div class="tx-name" style="font-size:var(--fs-body)">${escapeHtml(b.name)}</div><div class="tx-meta">${diff<0?'Lewat '+Math.abs(diff)+' hari':diff===0?'Hari ini':diff+' hari lagi'}</div></div>
      <div class="tx-amount red u-fs13">${fmt(b.amount)}</div>
      <button class="tx-del" data-stop="1" data-action="markBillPaid" data-args="${escapeHtml(JSON.stringify([b.id]))}" title="Bayar sekarang" aria-label="Bayar sekarang">✅</button>
    </div>`).join('');
}

function renderLDR(){
if(D.nextPulang)document.getElementById('nextPulang').value=D.nextPulang;
const now=new Date(),m=now.getMonth(),y=now.getFullYear();
const whThisMonth=D.workDays.filter(w=>{const d=new Date(w.date);return d.getMonth()===m&&d.getFullYear()===y;});
const cycleEl=document.getElementById('ldrCycle');
if(cycleEl) cycleEl.textContent=`📋 ${whThisMonth.length} hari kerja tercatat bulan ini`;
if(!D.nextPulang){document.getElementById('ldrNum').textContent='?';document.getElementById('ldrSub').textContent='Atur tanggal pulang berikutnya';return;}
const today=new Date();today.setHours(0,0,0,0);
const pulang=new Date(D.nextPulang);
const diff=Math.ceil((pulang-today)/(1000*60*60*24));
if(diff<=0){document.getElementById('ldrNum').textContent='🏠';document.getElementById('ldrUnit').textContent='';document.getElementById('ldrSub').textContent='Sudah pulang ke Pekalongan!';document.getElementById('ldrFill').style.width='100%';return;}
document.getElementById('ldrNum').textContent=diff;
document.getElementById('ldrUnit').textContent='hari';
document.getElementById('ldrSub').textContent='lagi pulang ke Pekalongan 💙';
const cycleStart=D.ldrCycleStart?new Date(D.ldrCycleStart):null;
let pct=0;
if(cycleStart && pulang>cycleStart){
const totalCycle=(pulang-cycleStart)/(1000*60*60*24);
const elapsed=(today-cycleStart)/(1000*60*60*24);
pct=(elapsed/totalCycle)*100;
} else {
pct=100-(diff/14)*100;
}
document.getElementById('ldrFill').style.width=Math.max(0,Math.min(100,pct))+'%';
document.getElementById('ldrDate').textContent=pulang.toLocaleDateString('id-ID',{day:'numeric',month:'short'});
}

function renderDashServisVehChips(){
if(dashServisVehFilter!=='semua'&&!D.vehicles.find(v=>v.id===dashServisVehFilter)){
dashServisVehFilter='semua';
safeSetItem('kw_dashServisVehFilter','semua');
}
if(D.vehicles.length<2)return'';
const chips=[{id:'semua',label:'Semua'},...D.vehicles.map(v=>({id:v.id,label:`${v.emoji||'🏍️'} ${escapeHtml(v.name)}`}))];
return `<div class="u-flex u-gap6 u-mb10" style="overflow-x:auto;padding-bottom:2px">`
+chips.map(c=>`<button class="chip-btn${dashServisVehFilter===c.id?' active':''}" data-action="setDashServisVehFilter" data-args="${escapeHtml(JSON.stringify([c.id]))}">${escapeHtml(c.label)}</button>`).join('')
+`</div>`;
}

function renderDashboardServisReminder(){
const card=document.getElementById('dashServisReminderCard');
if(!card)return;
if(!D.vehicles.length||!D.sparepartCats.length){card.style.display='none';return;}
const vehChipsHTML=renderDashServisVehChips();
const vehicles=dashServisVehFilter==='semua'?D.vehicles:D.vehicles.filter(v=>v.id===dashServisVehFilter);
const rows=[];
vehicles.forEach(veh=>{
const curKm=getVehicleKm(veh.id);
const kmPerDay=estimateKmPerDay(veh.id);
D.sparepartCats.forEach(cat=>{
const lastKm=getLastServiceKmForCat(veh.id,cat);
const intervalKm=getEffectiveIntervalKm(veh.id,cat);
const jarakTempuh=lastKm===null?curKm:curKm-lastKm;
const sisa=intervalKm-jarakTempuh;
const pct=Math.min(100,Math.max(0,Math.round((jarakTempuh/intervalKm)*100)));
let col=null;
if(sisa<=0)col='red';
else if(sisa<=intervalKm*0.15)col='orange';
if(!col)return;
const msg=sisa<=0?`⚠️ Lewat ${Math.abs(sisa).toLocaleString('id-ID')} km`:`🔔 Sisa ${sisa.toLocaleString('id-ID')} km`;
const estDateISO=estimateServiceDateISO(sisa,kmPerDay);
const estLabel=estDateISO?` · ~${fmtDateID(estDateISO)}`:'';
rows.push({veh,cat,sisa,pct,col,msg:msg+estLabel});
});
});
if(!rows.length){
if(dashServisVehFilter!=='semua'&&vehChipsHTML){
card.classList.remove('u-dnone');card.style.display='block';
card.innerHTML=`<div class="card-title">🔧 Pengingat Servis <span class="card-collapse-toggle" id="dashServisReminderCard-chev" data-action="toggleCardCollapse" data-args='["dashServisReminderCard","$event"]' aria-label="Buka/tutup bagian">▾</span></div><div class="card-collapse-body" id="dashServisReminderCard-cbody">`+vehChipsHTML+`<div class="u-fs12 u-t2 u-tac" style="padding:10px 0">✅ Aman, belum ada servis mendesak untuk kendaraan ini.</div></div>`;
applyOneCardCollapsePref('dashServisReminderCard');
}else{
card.style.display='none';
}
return;
}
rows.sort((a,b)=>a.sisa-b.sisa);
const top=rows.slice(0,3);
card.classList.remove('u-dnone');card.style.display='block';
card.innerHTML=`<div class="card-title">🔧 Pengingat Servis <span class="acc-chip u-cacc2" style="border-color:var(--accent2)">${rows.length}</span> <span class="card-collapse-toggle" id="dashServisReminderCard-chev" data-action="toggleCardCollapse" data-args='["dashServisReminderCard","$event"]' aria-label="Buka/tutup bagian">▾</span></div><div class="card-collapse-body" id="dashServisReminderCard-cbody">`
+vehChipsHTML
+top.map(r=>`
    <div class="u-mb10 u-pointer" data-action="goToServisFromDash" data-args="${escapeHtml(JSON.stringify([r.veh.id]))}">
      <div class="u-flex u-jcb u-aic u-fs12 u-mb4">
        <span class="u-fw700">${r.veh.emoji||'🏍️'} ${escapeHtml(r.veh.name)} · ${escapeHtml(r.cat.name)}</span>
        <span class="${r.col} u-fw700">${r.msg}</span>
      </div>
      <div class="prog-bar"><div class="prog-fill ${r.col}" style="width:${r.pct}%"></div></div>
    </div>`).join('')
+(rows.length>top.length?`<div class="u-fs12 u-cacc u-tar u-pointer" data-action="goToServisFromDash">Lihat semua (${rows.length}) →</div>`:'')
+`</div>`;
applyOneCardCollapsePref('dashServisReminderCard');
}

function renderDashboardSewaKiosReminder(){
const card=document.getElementById('dashSewaKiosReminderCard');
if(!card)return;
const units=(D.sewaKios&&D.sewaKios.units)||[];
const rows=units.map(u=>({u,nt:SewaKios.nextTagih(u)})).filter(r=>r.nt&&r.nt.diffDays<=5);
if(!rows.length){card.style.display='none';return;}
rows.sort((a,b)=>a.nt.diffDays-b.nt.diffDays);
const top=rows.slice(0,3);
card.classList.remove('u-dnone');card.style.display='block';
card.innerHTML=`<div class="card-title">🏠 Pengingat Tagih Sewa <span class="acc-chip u-cacc2" style="border-color:var(--accent2)">${rows.length}</span> <span class="card-collapse-toggle" id="dashSewaKiosReminderCard-chev" data-action="toggleCardCollapse" data-args='["dashSewaKiosReminderCard","$event"]' aria-label="Buka/tutup bagian">▾</span></div><div class="card-collapse-body" id="dashSewaKiosReminderCard-cbody">`
+top.map(r=>{
const col=r.nt.diffDays<0?'red':'orange';
const dueLabel=r.nt.due.toLocaleDateString('id-ID',{day:'numeric',month:'short'});
const msg=r.nt.diffDays<0?`⚠️ Telat ${Math.abs(r.nt.diffDays)} hari`:(r.nt.diffDays===0?'🔔 Jatuh tempo hari ini':`🔔 ${r.nt.diffDays} hari lagi (${dueLabel})`);
return `<div class="u-flex u-jcb u-aic u-mb8 u-pointer" data-action="SewaKios.catatSewa" data-args="${escapeHtml(JSON.stringify([r.u.id]))}">
        <span class="u-fs12 u-fw700">${escapeHtml(r.u.name)}${r.u.penyewa?' — '+escapeHtml(r.u.penyewa):''}</span>
        <span class="${col} u-fs12 u-fw700">${msg}</span>
      </div>`;
}).join('')
+(rows.length>top.length?`<div class="u-fs12 u-cacc u-tar u-pointer" data-action="showPage" data-args='["keuangan", "$nav:1"]'>Lihat semua (${rows.length}) →</div>`:'')
+`</div>`;
applyOneCardCollapsePref('dashSewaKiosReminderCard');
}

// Nudge sekali (bisa di-dismiss permanen) kalau user BELUM PERNAH sync ke Google Drive/Sheets
// sama sekali TAPI datanya sudah cukup banyak -- soalnya semua data cuma tersimpan lokal di HP
// (localStorage + IndexedDB mirror), kalau HP hilang/rusak/di-uninstall tanpa backup, data hilang
// total. Bukan wajib/blocking, cuma pengingat.
const BACKUP_REMINDER_DISMISS_KEY='kw_backup_reminder_dismissed';
const BACKUP_REMINDER_DATA_THRESHOLD=30; // total catatan (transaksi+bbm+servis+shop) sebelum dianggap "udah lumayan banyak"
function renderDashboardBackupReminder(){
const card=document.getElementById('dashBackupReminderCard');
if(!card)return;
if(localStorage.getItem(BACKUP_REMINDER_DISMISS_KEY)==='1'){card.style.display='none';return;}
const everSynced=!!(D.googleDrive&&D.googleDrive.lastSync)||!!(D.googleSheets&&D.googleSheets.lastSync);
if(everSynced){card.style.display='none';return;}
const totalCatatan=(D.transactions?D.transactions.length:0)+(D.bbmLogs?D.bbmLogs.length:0)+(D.servisLogs?D.servisLogs.length:0)+((D.cobek||[]).length);
if(totalCatatan<BACKUP_REMINDER_DATA_THRESHOLD){card.style.display='none';return;}
card.classList.remove('u-dnone');card.style.display='block';
card.innerHTML=`<div class="card-title">☁️ Backup Belum Aktif <span class="card-collapse-toggle" id="dashBackupReminderCard-chev" data-action="toggleCardCollapse" data-args='["dashBackupReminderCard","$event"]' aria-label="Buka/tutup bagian">▾</span></div><div class="card-collapse-body" id="dashBackupReminderCard-cbody">
  <div class="u-fs12 u-t2 u-lh15 u-mb10">Sudah ada <b>${totalCatatan} catatan</b> tersimpan, tapi semuanya cuma di penyimpanan lokal HP ini. Kalau HP hilang, rusak, atau app-nya ke-uninstall/data ke-clear tanpa backup, <b>semua data ini bisa hilang total</b> & tidak bisa dipulihkan.</div>
  <div class="u-flex u-gap8">
    <button class="btn btn-primary btn-sm u-flex1" data-action="showPage" data-args='["settings","$nav:6"]'>☁️ Aktifkan Backup</button>
    <button class="btn btn-ghost btn-sm" data-action="dismissBackupReminder">Sudah Paham</button>
  </div>
</div>`;
applyOneCardCollapsePref('dashBackupReminderCard');
}
function dismissBackupReminder(){
safeSetItem(BACKUP_REMINDER_DISMISS_KEY,'1');
const card=document.getElementById('dashBackupReminderCard');
if(card)card.style.display='none';
toast('Oke, tidak akan diingatkan lagi. Kamu tetap bisa aktifkan backup kapan saja lewat Pengaturan.');
}

// Daftar card Dashboard yang BOLEH disembunyikan user lewat Pengaturan → Tampilan → Kartu di
// Beranda. Ini satu-satunya sumber data buat checklist di Pengaturan (renderDashCardPrefsUI) DAN
// buat renderDashboard() memutuskan mana yang di-skip. Card "inti" (Penasihat, Skor Hidup
// Seimbang, saldo bulan ini, Saldo Akun, Transaksi Terakhir) sengaja TIDAK dimasukkan sini —
// selalu tampil karena jadi acuan utama tiap buka Beranda.
// Field `render(ctx)`: dipanggil renderDashboard() kalau card ini aktif (isDashCardOn). `ctx`
// berisi konteks bulan-berjalan yang sudah dihitung sekali di renderDashboard() (now/m/y/txM/
// inc/exp/billStats) — dipakai kalau card butuh (mis. laporanMini, zakatMini, bill), diabaikan
// kalau tidak. Urutan render sesungguhnya (beda dari urutan checklist Pengaturan di bawah, yang
// sengaja dikelompokkan per tema) diatur lewat DASH_RENDER_ORDER, bukan urutan array ini.
const DASH_CARD_DEFS=[
{key:'bill',label:'🔔 Tagihan & Cicilan',elId:'dashBillCard',render:(ctx)=>renderDashboardBills(ctx.billStats)},
{key:'servisReminder',label:'🔧 Pengingat Servis Kendaraan',elId:'dashServisReminderCard',render:()=>renderDashboardServisReminder()},
{key:'sewaKiosReminder',label:'🏠 Pengingat Tagih Sewa Kios',elId:'dashSewaKiosReminderCard',render:()=>renderDashboardSewaKiosReminder()},
{key:'backupReminder',label:'☁️ Pengingat Backup Belum Aktif',elId:'dashBackupReminderCard',render:()=>renderDashboardBackupReminder()},
{key:'danaDarurat',label:'🛟 Dana Darurat',elId:'dashDanaDaruratCard',render:()=>DanaDaruratAI.renderDash()},
{key:'cashflowForecast',label:'📉 Proyeksi Arus Kas',elId:'cashflowForecastCard',render:()=>renderDashCashflowForecast()},
{key:'timeline',label:'🗓️ Linimasa Prioritas Keuangan',elId:'timelineWCard',render:()=>TimelineW.render()},
{key:'budgetMini',label:'📊 Anggaran Bulan Ini',elId:'dashBudgetMiniCard',render:()=>renderDashBudgetMini()},
{key:'eduFund',label:'🎓 Dana Pendidikan',elId:'dashEduFundMiniCard',render:()=>EduFund.renderDashMini()},
{key:'zakatMini',label:'🕌 Zakat Penghasilan',elId:'dashZakatMiniCard',render:(ctx)=>renderDashZakatMini(ctx.inc)},
{key:'fi',label:'🎯 Kebebasan Finansial',elId:'dashFiCard',render:()=>renderFinancialFreedom()},
{key:'pensiun',label:'🏖️ Dana Pensiun',elId:'dashPensiunCard',render:()=>Pensiun.renderDashMini()},
{key:'absensi',label:'📅 Absensi Harian',elId:'dashAbsensiCard',render:()=>Payroll.renderDashMini()},
{key:'laporanMini',label:'📊 Ringkasan Laporan Bulan Ini',elId:'dashLaporanMiniCard',render:(ctx)=>renderDashLaporanMini(ctx.inc,ctx.exp,ctx.txM)},
{key:'refleksi',label:'🌱 Refleksi & Self-Care',elId:'refleksiCard',render:()=>Refleksi.renderDashCard()},
{key:'siapPulang',label:'🪨 Siap Pulang (Untung Shop)',elId:'siapPulangCard',render:()=>renderSiapPulang()},
{key:'ldr',label:'✈️ Siklus Kerja & Jadwal Pulang',elId:'ldrCard',render:()=>renderLDR()},
];
// Urutan render sesungguhnya di Beranda (beda dari urutan checklist Pengaturan di
// DASH_CARD_DEFS). Dipisah dari DASH_CARD_DEFS supaya menambah/menyusun ulang checklist
// Pengaturan tidak diam-diam mengubah urutan tampilan Beranda, begitu juga sebaliknya.
const DASH_RENDER_ORDER=['ldr','siapPulang','bill','servisReminder','sewaKiosReminder','backupReminder','danaDarurat','cashflowForecast','timeline','zakatMini','budgetMini','laporanMini','fi','pensiun','absensi','eduFund','refleksi'];
const DASH_CARD_BY_KEY={};
DASH_CARD_DEFS.forEach(c=>{DASH_CARD_BY_KEY[c.key]=c;});
function isDashCardOn(key){
return !(D.dashCardPrefs && D.dashCardPrefs[key]===false);
}
function hideDashCardEl(elId){
const el=document.getElementById(elId);
if(!el)return;
el.classList.add('u-dnone');
el.style.display='none';
}
function renderDashCardPrefsUI(){
const wrap=document.getElementById('dashCardPrefsList');
if(!wrap)return;
wrap.innerHTML=`<div class="u-flex u-gap8 u-mb10">
      <button type="button" class="btn btn-ghost btn-sm u-flex1" onclick="setAllDashCardPrefs(true)">✅ Aktifkan Semua</button>
      <button type="button" class="btn btn-ghost btn-sm u-flex1" onclick="setAllDashCardPrefs(false)">🚫 Matikan Semua</button>
    </div>`
+DASH_CARD_DEFS.map(c=>`
    <div class="setting-item">
      <div class="setting-label">${c.label}</div>
      <label class="tgl-switch"><input type="checkbox" ${isDashCardOn(c.key)?'checked':''} onchange="toggleDashCardPref('${c.key}',this.checked)"><span class="tgl-track"></span></label>
    </div>`).join('');
}
function setAllDashCardPrefs(on){
if(!D.dashCardPrefs)D.dashCardPrefs={};
DASH_CARD_DEFS.forEach(c=>{if(on)delete D.dashCardPrefs[c.key];else D.dashCardPrefs[c.key]=false;});
save();
renderDashCardPrefsUI();
if(document.getElementById('page-dashboard'))renderDashboard();
}
function toggleDashCardPref(key,checked){
if(!D.dashCardPrefs)D.dashCardPrefs={};
if(checked)delete D.dashCardPrefs[key]; else D.dashCardPrefs[key]=false;
save();
if(document.getElementById('page-dashboard'))renderDashboard();
}

function renderDashboard(){
LifeBalance.render();
// Konteks bulan-berjalan dihitung SEKALI di sini (dulu FinCoach & dashBillCard hitung
// txM/inc/exp/billStats sendiri-sendiri lagi walau datanya sama persis dengan yang dihitung di
// bawah buat statistik atas). Dioper ke widget yang butuh (billStatsShared->renderDashboardBills,
// dashCtx->FinCoach) supaya D.transactions/D.bills tidak di-scan ulang berkali-kali tiap 1x buka
// Dashboard. Widget lain di bawah (LifeBalance/AIWidget/dst) sengaja TIDAK diikutkan dulu — masing2
// hitung metrik yang beda (bukan cuma txM/inc/exp bulan ini), digabung nanti kalau memang kepakai bareng.
if(typeof Advisor!=='undefined')Advisor.render();
if(typeof AIWidget!=='undefined')AIWidget.render();
const now=new Date(),m=now.getMonth(),y=now.getFullYear();
const txM=D.transactions.filter(t=>{const d=new Date(t.date);return d.getMonth()===m&&d.getFullYear()===y;});
const inc=txM.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
const exp=txM.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
const billStatsShared=(typeof getBillStats==='function')?getBillStats():null;
const dashCtx={now,m,y,txM,inc,exp,billStats:billStatsShared};
if(typeof FinCoach!=='undefined')FinCoach.renderDash(dashCtx);
const cobM=D.cobek.filter(t=>{const d=new Date(t.date);return d.getMonth()===m&&d.getFullYear()===y;}).reduce((s,t)=>s+t.profit,0);
document.getElementById('dIncome').textContent=fmt(inc);
document.getElementById('dExpense').textContent=fmt(exp);
const bal=inc-exp,bEl=document.getElementById('dBalance');
bEl.textContent=(bal<0?'-':'')+fmt(bal);bEl.className='stat-val '+(bal>=0?'green':'red');
document.getElementById('dShop').textContent=fmt(cobM)+(cobM>0?' 📈':'');
const recent=[...D.transactions].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,5);
document.getElementById('recentTx').innerHTML=recent.length?recent.map(txHTML).join(''):'<div class="empty"><div class="empty-icon">💸</div><div class="empty-text">Belum ada transaksi</div><div class="u-mt10 u-flex u-gap8 u-jcc"><button class="btn btn-income btn-sm" data-action="openTxModal" data-args=\'["income"]\'>+ Catat Pemasukan</button><button class="btn btn-expense btn-sm" data-action="openTxModal" data-args=\'["expense"]\'>- Catat Pengeluaran</button></div></div>';
renderDashAccList();
// Card opsional lewat feature registry DASH_CARD_DEFS/DASH_RENDER_ORDER — tiap card dicek dulu ke
// isDashCardOn() sebelum dihitung/dirender: kalau user matikan lewat Pengaturan → Tampilan →
// Kartu di Beranda, elemennya disembunyikan DAN fungsi hitungnya SAMA SEKALI TIDAK dipanggil
// (bukan cuma disembunyikan lewat CSS), jadi fitur yang tidak dipakai (mis. SewaKios/Pensiun)
// tidak ikut nge-scan data tiap buka Beranda. Urutan render mengikuti DASH_RENDER_ORDER, BUKAN
// urutan DASH_CARD_DEFS (yang dipakai checklist Pengaturan) — lihat catatan di dekat DASH_CARD_DEFS.
for(const key of DASH_RENDER_ORDER){
const cardDef=DASH_CARD_BY_KEY[key];
if(isDashCardOn(key))cardDef.render(dashCtx);else hideDashCardEl(cardDef.elId);
}
}

function renderDashLaporanMini(inc,exp,txM){
const trendEl=document.getElementById('dashLapTrend');
const katEl=document.getElementById('dashLapKatMini');
if(!trendEl||!katEl)return;
const net=inc-exp;
const now=new Date();
const prevM=new Date(now.getFullYear(),now.getMonth()-1,1);
const txPrev=D.transactions.filter(t=>{const d=new Date(t.date);return d.getMonth()===prevM.getMonth()&&d.getFullYear()===prevM.getFullYear();});
const incPrev=txPrev.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
const expPrev=txPrev.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
const netPrev=incPrev-expPrev;
if(!txM.length&&!txPrev.length){
trendEl.innerHTML='Belum ada transaksi bulan ini.';
} else if(netPrev===0){
trendEl.innerHTML=`Saldo bersih bulan ini: <b style="color:${net>=0?'var(--accent3)':'var(--accent2)'}">${fmt(net)}</b> (belum ada data bulan lalu utk dibandingkan)`;
} else {
const selisih=net-netPrev;
const pct=Math.round((Math.abs(selisih)/Math.abs(netPrev))*100);
const naik=selisih>0;
trendEl.innerHTML=`Saldo bersih bulan ini: <b style="color:${net>=0?'var(--accent3)':'var(--accent2)'}">${fmt(net)}</b> — <span style="color:${naik?'var(--accent3)':'var(--accent2)'}">${naik?'▲':'▼'} ${pct}%</span> vs bulan lalu (${fmt(netPrev)})`;
}
const km={};
txM.forEach(t=>{if(t.type==='transfer_in'||t.type==='transfer_out')return;if(!km[t.category])km[t.category]={inc:0,exp:0,n:0};if(t.type==='income')km[t.category].inc+=t.amount;else km[t.category].exp+=t.amount;km[t.category].n++;});
const ks=Object.entries(km).sort((a,b)=>(b[1].inc+b[1].exp)-(a[1].inc+a[1].exp)).slice(0,3);
const maxV=Math.max(...ks.map(([,v])=>v.inc+v.exp),1);
katEl.innerHTML=ks.length?ks.map(([k,v])=>{
const val=v.inc+v.exp,pct=Math.round((val/maxV)*100);
const col=v.inc>v.exp?'var(--accent3)':'var(--accent2)';
return`<div class="cat-bar"><div class="cat-bar-head"><span style="font-weight:500">${escapeHtml(k)} <span class="u-ctext3 u-fs12">(${v.n}x)</span></span><span style="font-weight:700;color:${col}">${fmt(val)}</span></div><div class="prog-bar"><div class="prog-fill" style="width:${pct}%;background:${col}"></div></div></div>`;
}).join(''):'<div class="u-fs12t2">Belum ada transaksi bulan ini.</div>';
}

function renderDashBudgetMini(){return Budget.renderDashMini();}

function renderDashZakatMini(incomeBulan){return Zakat.renderDashMini(incomeBulan);}

function renderFiScenarios(){return FI.renderScenarios();}

function renderFinancialFreedom(){return FI.renderFinancialFreedom();}

function renderFiCatOptions(selected){return FI.renderCatOptions(selected);}

function renderDashDanaDarurat(){return DanaDaruratAI.renderDash();}

// Kartu ringkasan "Gaji minggu ini dari Absensi" di halaman Keuangan — dihitung fresh
// tiap kali renderKeuangan() jalan dari D.workDays minggu berjalan (sama kayak yg dipakai
// gajiSyncBox di modal Absensi), supaya user lihat totalnya juga tanpa perlu buka modal
// Absensi dulu. Disembunyikan (u-dnone) kalau belum ada absensi minggu ini.
function renderKeuAbsensiGajiCard(){
const cardEl=document.getElementById('keuAbsensiGajiCard');
if(!cardEl)return;
const {start,end}=getWeekRange(new Date());
const weekDays=(D.workDays||[]).filter(w=>{const d=new Date(w.date);return d>=start&&d<=end;});
if(weekDays.length){
const total=weekDays.reduce((s,w)=>s+w.total,0);
cardEl.classList.remove('u-dnone');cardEl.style.display='block';
document.getElementById('keuAbsensiGajiCount').textContent=weekDays.length;
document.getElementById('keuAbsensiGajiTotal').textContent=fmtFull(total);
} else {
cardEl.classList.add('u-dnone');cardEl.style.display='none';
}
}
function renderKeuangan(){
document.getElementById('monthLabel').textContent=MONTHS_FULL[curMonth]+' '+curYear;
renderKeuAbsensiGajiCard();
const txM=D.transactions.filter(t=>{const d=new Date(t.date);return d.getMonth()===curMonth&&d.getFullYear()===curYear;});
const inc=txM.filter(t=>t.type==='income'||t.type==='transfer_in').reduce((s,t)=>s+t.amount,0);
const exp=txM.filter(t=>t.type==='expense'||t.type==='transfer_out').reduce((s,t)=>s+t.amount,0);
const incReal=txM.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
const expReal=txM.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
const net=incReal-expReal;
document.getElementById('mIncome').textContent=fmtFull(incReal);
document.getElementById('mExpense').textContent=fmtFull(expReal);
const nEl=document.getElementById('mNet');nEl.textContent=(net<0?'-':'')+fmtFull(net);nEl.className='stat-val '+(net>=0?'green':'red');
const {from:txFrom,to:txTo}=getTxListRange();
const kf=getKeuFilters();
const txList=D.transactions.filter(t=>{const d=new Date(t.date);return d>=txFrom&&d<=txTo&&txMatchesFilters(t,kf)&&txMatchesSearch(t,kf.search);});
const sorted=[...txList].sort((a,b)=>new Date(b.date)-new Date(a.date));
const hasFilter=Object.values(kf).some(v=>v&&v!=='semua');
const visibleCount=Math.min(sorted.length,txListPage*TX_PAGE_SIZE);
const visible=sorted.slice(0,visibleCount);
document.getElementById('allTx').innerHTML=visible.length?visible.map(txHTML).join(''):`<div class="empty"><div class="empty-icon">💸</div><div class="empty-text">${hasFilter?'Tidak ada transaksi yang cocok dengan filter':'Belum ada transaksi di periode ini'}</div></div>`;
const moreWrap=document.getElementById('allTxLoadMoreWrap');
if(moreWrap){
if(visibleCount<sorted.length){
moreWrap.classList.remove('u-dnone');moreWrap.style.display='block';
moreWrap.querySelector('button').textContent=`⬇️ Tampilkan lebih banyak (${sorted.length-visibleCount} lagi)`;
} else moreWrap.style.display='none';
}
updateKfBadge();
renderBudgets();
BudgetReko.init();
Pensiun.render();
Renov.render();
SewaKios.render();
}

function renderBudgets(){return Budget.render();}

function renderBudgetCatOptions(selected){return Budget.renderCatOptions(selected);}


function renderCashflowForecast(){
const el=document.getElementById('cfIncAvg');
if(!el)return;
const r=computeCashflowForecast();
const emptyEl=document.getElementById('cfEmpty'),bodyEl=document.getElementById('cfBody');
if(r.avail<1){
if(emptyEl)emptyEl.classList.remove('u-dnone');emptyEl.style.display='block';
if(bodyEl)bodyEl.style.display='none';
return;
}
if(emptyEl)emptyEl.style.display='none';
if(bodyEl)bodyEl.style.display='block';
document.getElementById('cfIncAvg').textContent=fmtFull(r.incAvg);
document.getElementById('cfExpAvg').textContent=fmtFull(r.expAvg);
document.getElementById('cfBillsDue').textContent=fmtFull(r.billsDue);
document.getElementById('cfSaldoNow').textContent=fmtFull(r.saldoNow);
const pEl=document.getElementById('cfProjected');
pEl.textContent=fmtFullSigned(r.projected);
pEl.style.color=r.projected<0?'var(--accent2)':'';
document.getElementById('cfNote').textContent=`Berdasarkan rata-rata ${r.months} bulan terakhir. Proyeksi = saldo sekarang + rata-rata masuk − rata-rata keluar − tagihan terjadwal 30 hari ke depan.`+(r.avail<2?' ⚠️ Histori transaksi masih <2 bulan, jadi rata-rata di atas masih kasar.':'')+(r.projected<0?` ⚠️ Berpotensi minus ${fmtFull(Math.abs(r.projected))}. ${cashflowActionSuggestion(Math.abs(r.projected),30)}`:'');
const billEl=document.getElementById('cfBillList');
if(r.upcoming.length){
billEl.innerHTML='<div class="u-fs11 u-t2 u-mb6">🧾 Tagihan 30 hari ke depan:</div>'+r.upcoming.sort((a,b)=>new Date(a.nextDue)-new Date(b.nextDue)).map(b=>`<div class="u-flex u-jcb u-fs12" style="padding:4px 0;border-top:1px solid var(--border)"><span>${escapeHtml(b.name)} · ${new Date(b.nextDue).toLocaleDateString('id-ID')}</span><span class="u-fw700">${fmt(b.amount)}</span></div>`).join('');
} else {
billEl.innerHTML='';
}
}

function renderLaporan(){
const {from,to}=getRange();
const f=getLaporanFilters();
const filterSig=JSON.stringify({from:+from,to:+to,f});
if(filterSig!==_lapLastFilterSig){lapTxPage=1;_lapLastFilterSig=filterSig;}
const txs=D.transactions.filter(t=>{
const d=new Date(t.date);
if(d<from||d>to)return false;
if(t.type==='transfer_in'||t.type==='transfer_out')return false;
if(!txMatchesFilters(t,f))return false;
return true;
});
const inc=txs.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
const exp=txs.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
const net=inc-exp;
document.getElementById('lapIn').textContent=fmt(inc);
document.getElementById('lapOut').textContent=fmt(exp);
const nEl=document.getElementById('lapNet');nEl.textContent=(net<0?'-':'')+fmt(Math.abs(net));nEl.className='stat-val '+(net>=0?'green':'red');
document.getElementById('lapCount').textContent=txs.length;
document.getElementById('lapAvg').textContent=txs.length?fmt((inc+exp)/txs.length):'Rp 0';
document.getElementById('lapTxN').textContent='('+txs.length+')';
const nActive=Object.values(f).filter(v=>v&&v!=='semua').length;
const cntEl=document.getElementById('lapFilterCount');
if(cntEl)cntEl.textContent=nActive?`${nActive} filter aktif`:'';
renderGrafik();
renderLapAccList();
renderCashflowForecast();
const km={};
txs.forEach(t=>{if(!km[t.category])km[t.category]={inc:0,exp:0,n:0};if(t.type==='income')km[t.category].inc+=t.amount;else km[t.category].exp+=t.amount;km[t.category].n++;});
const ks=Object.entries(km).sort((a,b)=>(b[1].inc+b[1].exp)-(a[1].inc+a[1].exp));
const maxV=Math.max(...ks.map(([,v])=>v.inc+v.exp),1);
const showVsAvg=filterPeriode==='bulan'&&typeof BudgetReko!=='undefined';
const avgMap={};
if(showVsAvg){ BudgetReko.computeCategoryAverages().forEach(a=>{avgMap[a.name]=a.avgPerMonth;}); }
document.getElementById('lapKat').innerHTML=ks.length?ks.map(([k,v])=>{
const val=v.inc+v.exp,pct=Math.round((val/maxV)*100);
const col=v.inc>v.exp?'var(--accent3)':'var(--accent2)';
let vsAvgHtml='';
if(showVsAvg&&v.exp>v.inc&&avgMap[k]>0){
const avg=avgMap[k];
const selisihPct=Math.round(((v.exp-avg)/avg)*100);
const naik=selisihPct>10, turun=selisihPct<-10;
const badgeCol=naik?'var(--accent2)':(turun?'var(--accent3)':'var(--text2)');
const arrow=naik?'▲':(turun?'▼':'≈');
vsAvgHtml=`<div style="font-size:11px;color:${badgeCol};margin-top:2px">${arrow} ${selisihPct>0?'+':''}${selisihPct}% vs rata-rata bulanan (${fmt(avg)})</div>`;
}
return`<div class="cat-bar"><div class="cat-bar-head"><span style="font-weight:500">${k} <span class="u-ctext3 u-fs12">(${v.n}x)</span></span><span style="font-weight:700;color:${col}">${fmt(val)}</span></div><div class="prog-bar"><div class="prog-fill" style="width:${pct}%;background:${col}"></div></div>${vsAvgHtml}</div>`;
}).join(''):'<div class="empty"><div class="empty-icon">📊</div><div class="empty-text">Belum ada data</div></div>';
const sorted=[...txs].sort((a,b)=>new Date(b.date)-new Date(a.date));
const visibleCount=Math.min(sorted.length,lapTxPage*TX_PAGE_SIZE);
const visible=sorted.slice(0,visibleCount);
document.getElementById('lapTx').innerHTML=visible.length?visible.map(txHTML).join(''):'<div class="empty"><div class="empty-icon">💸</div><div class="empty-text">Tidak ada transaksi</div></div>';
let lapMoreWrap=document.getElementById('lapTxLoadMoreWrap');
if(!lapMoreWrap){
lapMoreWrap=document.createElement('div');
lapMoreWrap.id='lapTxLoadMoreWrap';
lapMoreWrap.style.cssText='text-align:center;margin-top:10px';
lapMoreWrap.innerHTML='<button class="btn btn-ghost btn-sm" data-action="loadMoreLapTx" aria-label="Tampilkan lebih banyak transaksi"></button>';
document.getElementById('lapTx').insertAdjacentElement('afterend',lapMoreWrap);
}
if(visibleCount<sorted.length){
lapMoreWrap.style.display='block';
{const lapMoreBtn=lapMoreWrap.querySelector('button');const lapMoreLabel=`⬇️ Tampilkan lebih banyak (${sorted.length-visibleCount} lagi)`;lapMoreBtn.textContent=lapMoreLabel;lapMoreBtn.setAttribute('aria-label',lapMoreLabel);}
} else lapMoreWrap.style.display='none';
}

function renderGrafik(){
const now=new Date();const bars=[];
for(let i=5;i>=0;i--){
const m=(now.getMonth()-i+12)%12,y=now.getFullYear()+(now.getMonth()-i<0?-1:0);
const txM=D.transactions.filter(t=>{const d=new Date(t.date);return d.getMonth()===m&&d.getFullYear()===y;});
bars.push({label:MONTHS[m],inc:txM.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0),exp:txM.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0)});
}
const maxV=Math.max(...bars.map(b=>Math.max(b.inc,b.exp)),1);
document.getElementById('grafikBars').innerHTML=bars.map(b=>`<div class="grafik-col"><div class="grafik-bar-group"><div class="grafik-bar" style="background:var(--accent3);opacity:0.85;height:${Math.max(4,(b.inc/maxV)*100)}%"></div><div class="grafik-bar" style="background:var(--accent2);opacity:0.85;height:${Math.max(4,(b.exp/maxV)*100)}%"></div></div><div class="grafik-lbl">${b.label}</div></div>`).join('');
}

function renderMs(){D.milestones.forEach((done,i)=>{const el=document.getElementById('ms'+i);if(el){el.classList.toggle('done',done);el.textContent=done?'✓':'';el.setAttribute('aria-checked',done?'true':'false');}})}

function renderTarget(){
const el=document.getElementById('targetList');
if(!el)return;
if(!D.targets.length){el.innerHTML='<div class="empty"><div class="empty-icon">🎯</div><div class="empty-text">Belum ada target</div></div>';return;}
el.innerHTML=D.targets.map((t,i)=>{
const acc=t.accountId?D.accounts.find(a=>a.id===t.accountId):null;
const saved=acc?recalcAccBalance(acc.id):t.saved;
const pct=Math.min(100,Math.round((saved/t.amount)*100));
const col=pct>=100?'green':pct>=50?'orange':'purple';
const linkTag=acc?`<span class="u-fs11 u-r99 u-cacc u-ml4" style="background:var(--surface);border:1px solid var(--border2);padding:2px 7px">🔗 ${escapeHtml(acc.name)}</span>`:'';
const daruratTag=t.isDanaDarurat?`<span class="u-fs10 u-fw700 u-cacc2 u-r99 u-ml4" style="background:var(--accent2-soft);padding:2px 7px">🚨 DARURAT</span>`:'';
const actionsHtml=acc?`<button class="btn btn-sm btn-ghost u-flex1" data-action="showTargetAccountTx" data-args="${escapeHtml(JSON.stringify([t.id]))}">📋 Lihat Transaksi</button><button class="btn btn-sm btn-danger" data-action="delTarget" data-args="${escapeHtml(JSON.stringify([i]))}" aria-label="Hapus">🗑</button>`
:`<button class="btn btn-sm btn-ghost u-flex1" data-action="addTarget" data-args="${escapeHtml(JSON.stringify([i]))}">+ Tambah</button><button class="btn btn-sm btn-danger" data-action="delTarget" data-args="${escapeHtml(JSON.stringify([i]))}" aria-label="Hapus">🗑</button>`;
let daruratInfo='';
if(t.isDanaDarurat&&typeof FI!=='undefined'){
const avgBulanan=FI.annualExpense()/12;
if(avgBulanan>0){
const bulanCover=(saved/avgBulanan).toFixed(1);
daruratInfo=`<div class="u-fs11 u-t2 u-mt6" style="padding-top:6px;border-top:1px dashed var(--border)">≈ <b>${bulanCover} bulan</b> pengeluaran ter-cover · lihat rincian di 🧭 Rekomendasi Alokasi Aset (halaman Pajak & Zakat)</div>`;
}
}
return`<div class="tgt-item">
      <div class="tgt-head"><div class="tgt-name">${t.emoji} ${escapeHtml(t.name)}${linkTag}${daruratTag}</div><div class="tgt-pct">${pct}%</div></div>
      <div class="prog-bar"><div class="prog-fill ${col}" style="width:${pct}%"></div></div>
      <div class="tgt-vals"><span>${fmtFull(saved)} terkumpul</span><span>Target ${fmtFull(t.amount)}</span></div>
      ${daruratInfo}
      <div class="tgt-actions">
        ${actionsHtml}
      </div>
    </div>`;
}).join('');
}

function renderReminder(){
const el=document.getElementById('reminderList');if(!el)return;
const defaults=[{title:'Bayar BPJS',desc:'Tiap bulan — Rp 85.000',color:'var(--accent2)'},{title:'Bayar Wifi Pekalongan',desc:'Tiap bulan — Rp 50.000',color:'var(--accent4)'},{title:'Konfirmasi order Shop',desc:'H-2 sebelum pulang',color:'var(--accent)'}];
const all=[...defaults,...D.reminders];
el.innerHTML=all.map((r,i)=>`<div class="reminder-item"><div class="reminder-dot" style="background:${r.color}"></div><div class="u-flex1"><div class="u-fs13 u-fw600">${escapeHtml(r.title)}</div><div class="u-fs12t2">${escapeHtml(r.desc)}</div></div>${i>=defaults.length?`<button class="tx-del" data-action="delReminder" data-args="${escapeHtml(JSON.stringify([i-defaults.length]))}" aria-label="Hapus">🗑</button>`:''}</div>`).join('');
}

function renderWorkDays(){return Payroll.renderWorkDays();}

function renderVehicleSelect(){
const el=document.getElementById('vehicleSelect');if(!el)return;
if(!D.vehicles.find(v=>v.id===curVehicleId)&&D.vehicles.length) curVehicleId=D.vehicles[0].id;
el.innerHTML=D.vehicles.map(v=>`<div class="vehicle-chip ${v.id===curVehicleId?'active':''}" data-action="selectVehicle" data-args="${escapeHtml(JSON.stringify([v.id]))}">${v.emoji} ${escapeHtml(v.name)}</div>`).join('');
renderVehicleSpecCard();
}

function renderCarImportVehicleSelect(){
const el=document.getElementById('carImportVehicle');if(!el)return;
if(!D.vehicles||!D.vehicles.length){el.innerHTML='<option value="">Belum ada kendaraan</option>';return;}
const prevVal=el.value;
el.innerHTML=D.vehicles.map(v=>`<option value="${v.id}">${v.emoji} ${escapeHtml(v.name)}</option>`).join('');
if(prevVal&&D.vehicles.find(v=>v.id===prevVal)) el.value=prevVal;
else if(D.vehicles.find(v=>v.id===curVehicleId)) el.value=curVehicleId;
}

function renderVehicleManageList(){
const el=document.getElementById('vehicleManageList');
el.innerHTML=D.vehicles.map((v,i)=>`<div class="tx-item"><div class="tx-icon u-bgaccsoft">${v.emoji}</div><div class="tx-info"><div class="tx-name">${escapeHtml(v.name)}</div><div class="tx-meta">Interval servis: ${(v.serviceIntervalKm||3000).toLocaleString('id-ID')} km</div></div><button class="tx-del u-bgaccsoft u-cacc" style="margin-right:6px" data-action="editVehicleInterval" data-args="${escapeHtml(JSON.stringify([i]))}" aria-label="Edit">✏️</button><button class="tx-del" data-action="delVehicle" data-args="${escapeHtml(JSON.stringify([i]))}" aria-label="Hapus">🗑</button></div>`).join('');
}

function renderSptLinkStatus(){
const el=document.getElementById('sptBillStatus');
if(!el)return;
const bill=D.bills.find(b=>b.taxLink&&b.taxLink.key==='spt');
el.innerHTML=bill?('🔔 Terikat ke Tagihan: batas lapor <b>'+bill.nextDue+'</b>. Setelah lapor &amp; di-tandai lunas di Tagihan, tap tombol ini lagi tahun depan.'):'Belum diikat ke Tagihan. Tap tombol di atas supaya batas lapor SPT muncul sebagai reminder di menu Tagihan.';
}

function renderVehTaxSim(){
renderVehTaxList();
renderSimList();
}

function renderVehTaxList(){
const el=document.getElementById('vehTaxList');
if(!el)return;
el.innerHTML=D.vehicles.map(v=>{
const rows=Object.entries(VEHTAX_ITEMS).map(([key,cfg])=>{
const st=dateStatusBadge(v[cfg.tglKey]);
const biaya=v[cfg.biayaKey]||0;
return `<div class="tx-meta u-flex u-jcb u-aic u-mt2">
        <span>${cfg.label}: <span class="${st.col} u-fw700">${st.label}</span></span>
        <button class="btn btn-ghost btn-sm u-fs11" style="padding:2px 8px" data-stop="1" data-action="bayarPajakKendaraan" data-args="${escapeHtml(JSON.stringify([v.id, key]))}" ${biaya<=0?'title="Isi dulu estimasi biaya lewat ✏️"':''} aria-label="Isi dulu estimasi biaya lewat ✏️">✅ Bayar</button>
      </div>`;
}).join('');
return `<div class="tx-item u-aifs u-pointer u-fdcol u-gap6" data-action="openVehTaxModal" data-args="${escapeHtml(JSON.stringify([v.id]))}">
      <div class="u-flex u-aic u-w100">
        <div class="tx-icon u-bgaccsoft">${v.emoji}</div>
        <div class="tx-info"><div class="tx-name">${escapeHtml(v.name)}</div></div>
        <button class="tx-del u-bgaccsoft u-cacc" data-stop="1" data-action="openVehTaxModal" data-args="${escapeHtml(JSON.stringify([v.id]))}" aria-label="Edit/Buka">✏️</button>
      </div>
      <div class="u-w100" style="padding-left:44px">${rows}</div>
    </div>`;
}).join('');
}

function renderVehTaxLinkStatus(){
const modalEl=document.getElementById('vehTaxModal');
const vehicleId=modalEl.dataset.vehicleId;
if(!vehicleId)return;
Object.keys(VEHTAX_ITEMS).forEach(jenis=>{
const el=document.getElementById('vehTaxLinkStatus_'+jenis);
if(!el)return;
const key='vehtax:'+vehicleId+':'+jenis;
const bill=D.bills.find(b=>b.taxLink&&b.taxLink.key===key);
el.innerHTML=bill?('🔔 Terikat ke Tagihan: jatuh tempo <b>'+bill.nextDue+'</b>, '+fmtFull(bill.amount)+'. Setelah lunas &amp; siklus baru dimulai, isi tanggal baru lalu tap tombol lagi.'):'Belum diikat ke Tagihan.';
});
}

function renderSimLinkStatus(){
const el=document.getElementById('simLinkStatus');
if(!el)return;
if(!editSimId){el.innerHTML='Simpan data SIM ini dulu untuk bisa diikat ke Tagihan.';return;}
const key='sim:'+editSimId;
const bill=D.bills.find(b=>b.taxLink&&b.taxLink.key===key);
el.innerHTML=bill?('🔔 Terikat ke Tagihan: jatuh tempo <b>'+bill.nextDue+'</b>, '+fmtFull(bill.amount)):'Belum diikat ke Tagihan. Tap tombol di atas supaya reminder aktif di menu Tagihan.';
}

function renderSimList(){
const el=document.getElementById('simList');
if(!el)return;
const list=(D.simList||[]).slice().sort((a,b)=>daysUntilDate(a.tglAkhir)-daysUntilDate(b.tglAkhir));
if(!list.length){el.innerHTML='<div class="empty"><div class="empty-icon">🪪</div><div class="empty-text">Belum ada data SIM</div></div>';return;}
el.innerHTML=list.map(s=>{
const st=dateStatusBadge(s.tglAkhir);
return `<div class="tx-item u-pointer" data-action="openSimModal" data-args="${escapeHtml(JSON.stringify([s.id]))}">
      <div class="tx-icon u-bgaccsoft">🪪</div>
      <div class="tx-info">
        <div class="tx-name">${escapeHtml(s.nama)} <span class="u-fs11 u-t2 u-fw400">· ${s.jenis}</span></div>
        <div class="tx-meta"><span class="${st.col} u-fw700">${st.label}</span></div>
      </div>
      <button class="tx-del" data-stop="1" data-action="delSim" data-args="${escapeHtml(JSON.stringify([s.id]))}" aria-label="Hapus">🗑</button>
    </div>`;
}).join('');
}

function renderCnTab(){
const curKmEl=document.getElementById('cnCurKm');
if(curKmEl&&!document.getElementById('cnCurKmInput'))curKmEl.textContent=getVehicleKm(curVehicleId).toLocaleString('id-ID')+' km';
renderCarImportVehicleSelect();
renderVehTaxSim();
if(curCnTab==='bbm')renderBbmList();
if(curCnTab==='servis')renderServisList();
}

function renderBbmList(){return BBM.renderList();}

function renderSparepartCatList(){return Sparepart.renderCatList();}

function renderStockList(){return Sparepart.renderStockList();}

function renderVehicleSpecCard(){
const el=document.getElementById('vehSpecCard');
if(!el)return;
const veh=D.vehicles&&D.vehicles.find(v=>v.id===curVehicleId);
const spec=veh?findVehicleSpec(veh.name):null;
if(!spec){ el.innerHTML=''; return; }
const umumRows=Object.entries(spec.umum).map(([k,v])=>`<div class="u-flex u-jcb u-gap10 u-fs12" style="padding:5px 0;border-bottom:1px solid var(--border)"><span class="u-t2">${escapeHtml(k)}</span><span class="u-fw600 u-tar">${escapeHtml(v)}</span></div>`).join('');
const banRows=['depan','belakang'].map(pos=>`
    <div class="u-flex u-jcb u-gap10 u-fs12" style="padding:5px 0;border-bottom:1px solid var(--border)">
      <span class="u-t2">Ban ${pos==='depan'?'Depan':'Belakang'}</span>
      <span class="u-fw600 u-tar">${escapeHtml(spec.ban[pos].ukuran)}</span>
    </div>
    <div class="u-flex u-jcb u-gap10" style="padding:5px 0 5px 12px;border-bottom:1px solid var(--border);font-size:11.5px">
      <span class="u-ctext3">🔧 Tekanan angin</span>
      <span class="u-t2 u-tar">${escapeHtml(spec.ban[pos].tekanan)}</span>
    </div>`).join('');
const bohlamRows=spec.kelistrikan.bohlam.map(([k,v])=>`<div class="u-flex u-jcb u-gap10 u-fs12" style="padding:4px 0"><span class="u-t2">${escapeHtml(k)}</span><span class="u-fw600 u-tar">${escapeHtml(v)}</span></div>`).join('');
const batasRows=spec.batasServis.map(([nama,standar,batas])=>`
    <div class="u-fs12" style="padding:6px 0;border-bottom:1px solid var(--border)">
      <div class="u-fw600 u-mb2">${escapeHtml(nama)}</div>
      <div class="u-flex u-jcb u-t2" style="font-size:11.5px"><span>Standar: ${escapeHtml(standar)}</span><span class="u-cacc2 u-fw700">Batas: ${escapeHtml(batas)}</span></div>
    </div>`).join('');
el.innerHTML=`
    <div class="card-title u-flex u-aic u-jcb">
      <span>📋 Spesifikasi Pabrik</span>
      <span class="card-collapse-toggle" id="vehSpecCard-chev" data-action="toggleCardCollapse" data-args='["vehSpecCard","$event"]' aria-label="Buka/tutup bagian">▾</span>
    </div>
    <div class="card-collapse-body" id="vehSpecCard-cbody">
      <details open class="u-mb8">
        <summary class="u-pointer u-fs13 u-fw700" style="padding:4px 0">⚙️ Umum & Kapasitas</summary>
        <div style="padding-top:4px">${umumRows}</div>
      </details>
      <details class="u-mb8">
        <summary class="u-pointer u-fs13 u-fw700" style="padding:4px 0">🛞 Ban & Tekanan Angin</summary>
        <div style="padding-top:4px">${banRows}</div>
      </details>
      <details class="u-mb8">
        <summary class="u-pointer u-fs13 u-fw700" style="padding:4px 0">🔌 Kelistrikan (Aki/Sekring/Bohlam)</summary>
        <div style="padding-top:4px">
          <div class="u-flex u-jcb u-gap10 u-fs12" style="padding:4px 0"><span class="u-t2">Aki (battery)</span><span class="u-fw600 u-tar">${escapeHtml(spec.kelistrikan.aki)}</span></div>
          <div class="u-flex u-jcb u-gap10 u-fs12" style="padding:4px 0 8px;border-bottom:1px solid var(--border)"><span class="u-t2">Sekring (fuse)</span><span class="u-fw600 u-tar">${escapeHtml(spec.kelistrikan.sekring)}</span></div>
          ${bohlamRows}
        </div>
      </details>
      <details>
        <summary class="u-pointer u-fs13 u-fw700" style="padding:4px 0">🛑 Batas Servis Rem (Keselamatan)</summary>
        <div style="padding-top:4px">${batasRows}
          <div class="u-fs11 u-t2 u-mt6 u-lh15">⚠️ Kalau ukuran sudah melewati batas ini, komponen wajib diganti — jangan ditunda demi keselamatan.</div>
        </div>
      </details>
      <div class="u-ctext3 u-mt8 u-lh15" style="font-size:10.5px">📘 Sumber: ${escapeHtml(spec.sourceNote)}</div>
    </div>`;
}

function renderServisReminder(){return Servis.renderReminder();}

function renderServisList(){return Servis.renderList();}

function renderStorageUsage(){
const barEl=document.getElementById('storageOverallBar');
const listEl=document.getElementById('storageBreakdown');
if(!barEl||!listEl)return;
const totalBytes=byteSize(D);
const pct=Math.min(100,Math.round((totalBytes/STORAGE_QUOTA_ESTIMATE)*100));
const barClass=pct>=90?'over':pct>=70?'warn':'ok';
barEl.innerHTML=`
    <div class="u-flex u-jcb u-fs12 u-t2 u-mb4">
      <span>${fmtBytes(totalBytes)} terpakai dari ±${fmtBytes(STORAGE_QUOTA_ESTIMATE)}</span>
      <span style="font-weight:700;color:${pct>=90?'var(--accent2)':pct>=70?'var(--accent4)':'var(--accent3)'}">${pct}%</span>
    </div>
    <div class="prog-bar" style="height:10px"><div class="prog-fill ${barClass}" style="width:${pct}%;background:${pct>=90?'var(--accent2)':pct>=70?'var(--accent4)':'var(--accent3)'}"></div></div>
    ${pct>=70?`<div style="font-size:12px;color:${pct>=90?'var(--accent2)':'var(--accent4)'};margin-top:6px;font-weight:600">${pct>=90?'⚠️ Penyimpanan hampir penuh! Segera backup & pertimbangkan hapus data lama.':'⚠️ Penyimpanan mulai penuh, mulai pertimbangkan backup rutin.'}</div>`:''}
  `;
const rows=STORAGE_BIG_MODULES.map(m=>{
const arr=D[m.key]||[];
const bytes=byteSize(arr);
return {label:m.label,count:arr.length,bytes};
});
const knownBytes=rows.reduce((s,r)=>s+r.bytes,0);
const otherBytes=Math.max(0,totalBytes-knownBytes);
rows.push({label:'⚙️ Lainnya (akun, kategori, kendaraan, profil, pengaturan, dll)',count:null,bytes:otherBytes});
rows.sort((a,b)=>b.bytes-a.bytes);
const maxBytes=Math.max(...rows.map(r=>r.bytes),1);
listEl.innerHTML=rows.filter(r=>r.count===null?r.bytes>0:r.count>0).map(r=>{
const p=Math.round((r.bytes/maxBytes)*100);
return `<div class="u-mb10">
      <div class="u-flex u-jcb u-fs13" style="margin-bottom:3px">
        <span>${r.label}${r.count!==null?` <span class="u-ctext3 u-fs12">(${r.count.toLocaleString('id-ID')} data)</span>`:''}</span>
        <span class="u-fw600 u-t2">${fmtBytes(r.bytes)}</span>
      </div>
      <div class="prog-bar" style="height:6px"><div class="prog-fill" style="width:${p}%;background:var(--accent)"></div></div>
    </div>`;
}).join('');
renderArchiveSuggestHint();
renderArchiveHistory();
renderActualStorageQuota();
}

async function renderActualStorageQuota(){
const el=document.getElementById('storageActualQuota');
if(!el)return;
el.textContent='';
try{
if(!navigator.storage||!navigator.storage.estimate)return;
const est=await navigator.storage.estimate();
if(el.isConnected===false)return;
if(typeof est.usage==='number'&&typeof est.quota==='number'&&est.quota>0){
el.textContent=`ℹ️ Kuota nyata dari browser ini: ${fmtBytes(est.usage)} terpakai dari ${fmtBytes(est.quota)} (mencakup SEMUA data situs ini, bukan cuma app ini kalau ada data lain).`;
}
}catch(e){ }
}

function renderArchiveSuggestHint(){
const el=document.getElementById('archiveSuggestHint');
if(!el)return;
const curYear=new Date().getFullYear();
const archivedYears=new Set((D.archiveHistory||[]).flatMap(h=>h.years||[]));
const oldUnarchived=archiveAvailableYears().filter(y=>y<=curYear-2 && !archivedYears.has(y));
if(!oldUnarchived.length){ el.innerHTML=''; return; }
el.innerHTML=`<div class="u-fs12 u-cacc4 u-r10 u-mt10 u-lh15" style="background:var(--accent4-soft);border:1px solid rgba(255,169,77,0.25);padding:10px 12px">📅 Ada data riwayat tahun ${oldUnarchived.sort().join(', ')} yang sudah lama & belum pernah diarsip. Pertimbangkan arsip supaya penyimpanan HP lebih lega.</div>`;
}

function renderArchiveHistory(){
const wrap=document.getElementById('archiveHistoryWrap');
if(!wrap)return;
const hist=D.archiveHistory||[];
if(!hist.length){ wrap.innerHTML=''; return; }
const rows=hist.slice(-5).reverse().map(h=>`
    <div class="u-flex u-jcb u-fs12" style="padding:8px 0;border-bottom:1px solid var(--border)">
      <span>Tahun ${(h.years||[]).join(', ')}</span>
      <span class="u-t2">${(h.totalItems||0).toLocaleString('id-ID')} data · ${new Date(h.date).toLocaleDateString('id-ID')}</span>
    </div>`).join('');
wrap.innerHTML=`<div class="card-title u-mb6">🗄️ Riwayat Arsip</div>${rows}`;
}

function renderSettings(){
const diagGroupEl=document.getElementById('stgGroup6');
if(diagGroupEl) diagGroupEl.style.display=''; // Diagnostik selalu tampil (dulu disembunyikan kalau bukan dev mode)
renderStorageUsage();
updateDebugConsoleBtn();
const abvEl=document.getElementById('aboutBuildVersion'); if(abvEl) abvEl.textContent=APP_BUILD_VERSION;
const asvEl=document.getElementById('aboutSchemaVersion'); if(asvEl) asvEl.textContent='v'+SCHEMA_VERSION;
const apsEl=document.getElementById('aboutProdSyncStatus'); if(apsEl){ const ps=computeProductionSyncStatus(); apsEl.textContent=ps.label; apsEl.style.color=ps.inSync?'var(--accent3)':'#e0a030'; }
const fsCurEl=document.getElementById('fileSizeCurrent'), fsStatEl=document.getElementById('fileSizeStatus');
if(fsCurEl&&fsStatEl){
const fs=computeFileSizeStatus();
fsCurEl.textContent=fmtBytes(fs.size);
fsStatEl.textContent=fs.label;
fsStatEl.style.color=fs.color;
}
document.getElementById('sNama').value=D.profile.nama||'W';
document.getElementById('sGaji').value=D.profile.gajiPokok||65000;
document.getElementById('sKirim').value=D.profile.kiriman||500000;
const sLemburMxEl=document.getElementById('sLemburMx'); if(sLemburMxEl) sLemburMxEl.value=D.profile.lemburMultiplier||1.5;
const sTarifMingguEl=document.getElementById('sTarifMinggu'); if(sTarifMingguEl) sTarifMingguEl.value=D.profile.tarifMinggu||139000;
const sTglLahirEl=document.getElementById('sTanggalLahir'); if(sTglLahirEl) sTglLahirEl.value=(D.profile&&D.profile.tanggalLahir)||'';
const kawinVal=!!(D.profile&&D.profile.statusKawin);
document.querySelectorAll('#sStatusKawinPicker .chip-btn').forEach(b=>b.classList.toggle('active',(b.dataset.val==='1')===kawinVal));
const tanggunganVal=Math.max(0,Math.min(3,parseInt((D.profile&&D.profile.tanggungan)||0)||0));
document.querySelectorAll('#sTanggunganPicker .chip-btn').forEach(b=>b.classList.toggle('active',parseInt(b.dataset.val)===tanggunganVal));
const pekerjaanVal=D.profile&&D.profile.statusPekerjaan;
document.querySelectorAll('#sPekerjaanPicker .chip-btn').forEach(b=>b.classList.toggle('active',b.dataset.val===pekerjaanVal));
updateProfilPTKPPreview();
updateUsiaPreview();
const apiKeyEl=document.getElementById('sApiKey'); if(apiKeyEl) apiKeyEl.value=D.profile.apiKey||'';
const providerEl=document.getElementById('sApiProvider'); if(providerEl){providerEl.value=D.profile.apiProvider||'claude';toggleApiKeyHint();}
const whG=document.getElementById('whGaji'); if(whG) whG.value=D.profile.gajiPokok||65000;
const whD=document.getElementById('whDate'); if(whD&&!whD.value) whD.value=new Date().toISOString().split('T')[0];
renderWorkDays();
document.querySelectorAll('.theme-card').forEach(c=>c.classList.toggle('active',c.dataset.t===(D.profile.theme||'dark')));
renderDashCardPrefsUI();
renderAccGrid();
renderCatList();
renderSparepartCatList();
renderStockList();
renderBillList();
renderTarget();
EduFund.render();
renderMs();
renderReminder();
renderNotifSettings();
renderGDriveSettings();
renderSheetsSettings();
setImportType(curImportType,document.querySelector('#importChips .chip-btn'));
const aEl=document.getElementById('anakList');
aEl.innerHTML=(D.catatan.anak||[]).slice(-3).reverse().map(c=>`<div class="tx-item"><div class="u-flex1"><div class="u-fs12t2">${c.date}</div><div class="u-fs13 u-mt2">${escapeHtml(c.text)}</div></div></div>`).join('');
renderSelfTestLastResult();
}

function renderChatActionBubble(actionId,type,data){
return `<div class="chat-bubble ai u-r12" id="chatAction_${actionId}" style="border:1px solid var(--accent)">${chatActionInnerHTML(actionId,type,data)}</div>`;
}

function renderNotifSettings(){
const el=document.getElementById('notifEnableToggle');
if(el) el.checked=!!(D.notifSettings.enabled && 'Notification' in window && Notification.permission==='granted');
const bd=document.getElementById('notifBillDays'); if(bd) bd.value=D.notifSettings.billDays||3;
const ld=document.getElementById('notifLdrDays'); if(ld) ld.value=D.notifSettings.ldrDays||3;
const statusEl=document.getElementById('notifStatus');
if(statusEl){
if(!('Notification' in window)) statusEl.textContent='⚠️ Browser ini tidak mendukung notifikasi';
else if(Notification.permission==='denied') statusEl.textContent='❌ Izin diblokir — aktifkan manual lewat pengaturan situs di browser';
else if(Notification.permission==='granted'&&D.notifSettings.enabled) statusEl.textContent='✅ Notifikasi aktif (aktif selama app ini dibuka/di-background)';
else statusEl.textContent='Belum aktif. Aktifkan dulu di atas.';
}
}


function renderGDriveSettings(){
const idEl=document.getElementById('gdClientId'); if(idEl) idEl.value=D.googleDrive.clientId||'';
const stEl=document.getElementById('gdStatus');
if(stEl){
const syncLabel=D.googleDrive.lastSync? 'terakhir sinkron '+new Date(D.googleDrive.lastSync).toLocaleString('id-ID') : 'belum pernah sinkron';
stEl.textContent=gdriveConnStatusLabel()+' · '+syncLabel;
}
const asEl=document.getElementById('gdAutoSync'); if(asEl) asEl.checked=!!D.googleDrive.autoSync;
const dcBtn=document.getElementById('gdDisconnectBtn'); if(dcBtn) dcBtn.style.display=gdriveAccessToken?'':'none';
}

function renderSheetsSettings(){
const idEl=document.getElementById('gsSpreadsheetId'); if(idEl) idEl.value=D.googleSheets.spreadsheetId||'';
const stEl=document.getElementById('gsStatus');
if(stEl){
const syncLabel=D.googleSheets.lastSync? 'terakhir sinkron '+new Date(D.googleSheets.lastSync).toLocaleString('id-ID') : 'belum pernah sinkron';
stEl.textContent=gdriveConnStatusLabel(true)+' · '+syncLabel;
}
const dcBtn=document.getElementById('gsDisconnectBtn'); if(dcBtn) dcBtn.style.display=gdriveAccessToken?'':'none';
const linkEl=document.getElementById('gsLink');
if(linkEl) linkEl.innerHTML=D.googleSheets.spreadsheetId? `<a class="u-cacc4" href="https://docs.google.com/spreadsheets/d/${D.googleSheets.spreadsheetId}" target="_blank">🔗 Buka Spreadsheet</a><br><span class="u-ctext3">🕘 Riwayat versi: di dalam Sheets, buka menu <b>File → Riwayat versi → Lihat riwayat versi</b> (atau tekan Ctrl+Alt+Shift+H)</span>` : '';
const cntEl=document.getElementById('gsLocalCount');
if(cntEl){
const perModul=SHEETS_MODULES.map(m=>`${m}:${(D[m]||[]).length}`).join(', ');
const total=SHEETS_MODULES.reduce((s,m)=>s+(D[m]||[]).length,0);
cntEl.textContent=`🔍 Debug (build ${APP_BUILD_VERSION}) — data lokal siap disync: ${total} item total (${perModul})`;
}
}

function renderSelfTestResults(data){
_lastSelfTestData=data;
const summaryEl=document.getElementById('selfTestSummary');
const resultsEl=document.getElementById('selfTestResults');
const copyBtn=document.getElementById('selfTestCopyBtn');
const when=new Date(data.ranAt).toLocaleString('id-ID');
if(summaryEl) summaryEl.innerHTML=(data.failCount===0?'✅ ':'⚠️ ')+'<b>'+data.passCount+'/'+data.total+'</b> tes berhasil'+(data.failCount>0?' · <span class="u-cacc2">'+data.failCount+' gagal</span>':'')+'<div class="u-ctext3 u-mt2">Terakhir dijalankan: '+when+'</div>';
if(resultsEl){
resultsEl.innerHTML=data.results.map(r=>`
      <div class="u-flex u-aifs u-gap8 u-fs12" style="padding:8px 0;border-top:1px solid var(--border)">
        <span>${r.pass?'✅':'❌'}</span>
        <div class="u-flex1">
          <div class="u-ctext">${escapeHtml(r.name)}</div>
          ${r.pass?'':'<div class="u-cacc2 u-mt2">'+escapeHtml(r.error)+'</div>'}
        </div>
      </div>`).join('');
}
if(copyBtn) copyBtn.style.display=data.results.length?'block':'none';
}

function renderSelfTestLastResult(){
const summaryEl=document.getElementById('selfTestSummary');
if(!summaryEl||_lastSelfTestData) return;
try{
const raw=localStorage.getItem('kw_selftest_last');
if(!raw) return;
const stored=JSON.parse(raw);
if(!stored||!Array.isArray(stored.results)) return;
renderSelfTestResults(stored);
}catch(e){ }
}

function renderNavSmokeResults(data){
_lastNavSmokeData=data;
const summaryEl=document.getElementById('navSmokeSummary');
const resultsEl=document.getElementById('navSmokeResults');
const copyBtn=document.getElementById('navSmokeCopyBtn');
if(summaryEl) summaryEl.innerHTML=(data.failCount===0?'✅ ':'⚠️ ')+'<b>'+data.passCount+'/'+data.total+'</b> halaman aman'+(data.failCount>0?' · <span class="u-cacc2">'+data.failCount+' bermasalah</span>':'')+'<div class="u-ctext3 u-mt2">Terakhir dijalankan: '+new Date(data.ranAt).toLocaleString('id-ID')+'</div>';
if(resultsEl){
resultsEl.innerHTML=data.results.filter(r=>!r.pass).map(r=>`
      <div class="u-flex u-aifs u-gap8 u-fs12" style="padding:8px 0;border-top:1px solid var(--border)">
        <span>❌</span>
        <div class="u-flex1">
          <div class="u-ctext">${escapeHtml(r.name)}</div>
          <div class="u-cacc2 u-mt2">${escapeHtml(r.error||'')}</div>
        </div>
      </div>`).join('');
}
if(copyBtn) copyBtn.style.display=data.results.length?'block':'none';
}

function renderModalSweepResults(data){
_lastModalSweepData=data;
const summaryEl=document.getElementById('modalSweepSummary');
const resultsEl=document.getElementById('modalSweepResults');
const copyBtn=document.getElementById('modalSweepCopyBtn');
if(summaryEl) summaryEl.innerHTML=(data.failCount===0?'✅ ':'⚠️ ')+'<b>'+data.passCount+'/'+data.total+'</b> modal aman'+(data.contextCount>0?' · <span class="u-ctext3">'+data.contextCount+' butuh konteks (wajar)</span>':'')+(data.failCount>0?' · <span class="u-cacc2">'+data.failCount+' bermasalah</span>':'')+'<div class="u-ctext3 u-mt2">Terakhir dijalankan: '+new Date(data.ranAt).toLocaleString('id-ID')+'</div>';
if(resultsEl){
resultsEl.innerHTML=data.results.filter(r=>!r.pass&&!r.needsContext).map(r=>`
      <div class="u-flex u-aifs u-gap8 u-fs12" style="padding:8px 0;border-top:1px solid var(--border)">
        <span>❌</span>
        <div class="u-flex1">
          <div class="u-ctext">${escapeHtml(r.fn)} <span class="u-ctext3">(#${escapeHtml(r.id)})</span></div>
          <div class="u-cacc2 u-mt2">${escapeHtml(r.error||'')}</div>
        </div>
      </div>`).join('');
}
if(copyBtn) copyBtn.style.display=data.results.length?'block':'none';
}

function renderPajakZakat(){
const pz=D.pajakZakat;
const elHE=document.getElementById('pzHargaEmas'); if(elHE&&!elHE.matches(':focus'))elHE.value=pz.hargaEmasPerGram;
const elNB=document.getElementById('pzNisabBulan'); if(elNB&&!elNB.matches(':focus'))elNB.value=pz.nisabPenghasilanBulan;
const elFJ=document.getElementById('pzFitrahJiwa'); if(elFJ&&!elFJ.matches(':focus'))elFJ.value=pz.zakatFitrahPerJiwa;
renderRefCheckReminder();
const elUT=document.getElementById('zmUtang'); if(elUT&&!elUT.matches(':focus'))elUT.value=pz.utangJT||'';
const elPphStatus=document.getElementById('pphStatus'); if(elPphStatus) elPphStatus.value=profilePTKPStatus();
const elZfJiwa=document.getElementById('zfJiwa'); if(elZfJiwa&&!elZfJiwa.matches(':focus'))elZfJiwa.value=profileJiwaKeluarga();
const elPphBruto=document.getElementById('pphBruto'); if(elPphBruto&&!elPphBruto.matches(':focus'))elPphBruto.value=pz.pphBrutoBulan||'';
const elPphIuran=document.getElementById('pphIuran'); if(elPphIuran&&!elPphIuran.matches(':focus'))elPphIuran.value=pz.pphIuranBulan||'';
const elSptBadge=document.getElementById('pphSptBadge'); if(elSptBadge){const st=sptStatusBadge();elSptBadge.textContent=st.label;elSptBadge.className=st.col;}
renderSptLinkStatus();
renderPajakRekomendasi();
renderAssetList();
renderPiutangList();
renderDebtList();
renderKekayaanBersih();
AlokasiAset.init();
hitungZakatPenghasilan();
hitungZakatMaal();
hitungZakatFitrah();
hitungPPh21();
renderUMKMPajak();
renderPBB();
renderZakatLog();
_pajakZakatRenderedOnce=true;
}

function renderRefCheckReminder(){
const el=document.getElementById('refCheckReminder');
const noteEl=document.getElementById('refCheckedNote');
if(!el||!noteEl)return;
const pz=D.pajakZakat;
if(!pz.refCheckedAt){
el.style.display='none';
noteEl.textContent='Belum pernah dicek via AI.';
return;
}
const days=Math.floor((new Date()-new Date(pz.refCheckedAt))/86400000);
noteEl.textContent=`Terakhir dicek via AI: ${new Date(pz.refCheckedAt).toLocaleDateString('id-ID')} (${days} hari lalu).`;
if(days>=180){
el.classList.remove('u-dnone');el.style.display='block';
el.style.background='var(--accent2-soft)';
el.style.color='var(--accent2)';
el.textContent=`⚠️ Sudah ${days} hari sejak terakhir dicek — harga emas & nisab kemungkinan sudah berubah. Cek ulang di bawah.`;
} else {
el.style.display='none';
}
}

function renderZakatLog(){return Zakat.renderLog();}

function renderUMKMPajak(){return PajakUMKM.render();}

function renderAssetList(){return Aset.renderList();}

function renderPiutangList(){return Piutang.renderList();}

function renderDebtList(){return Debt.renderList();}

function renderWealthSnapshots(){return Kekayaan.renderSnapshots();}

function renderKekayaanBersih(){return Kekayaan.renderBersih();}

function renderPBB(){return PBB.render();}

function renderPBBBillStatus(){return PBB.renderBillStatus();}
// Modal HTML dipisah dari app_production.html untuk pemerataan ukuran file.
// Setiap elemen array persis sama dengan blok <div class="overlay" id="...">...</div> aslinya,
// di-inject balik ke posisi yang sama persis via document.write saat HTML di-parse (lihat placeholder <script> di app_production.html).
// Urutan array WAJIB sama dengan urutan pemanggilan document.write(MODAL_HTML[i]) di app_production.html -- jangan diubah manual.
const MODAL_VERSION='kw81-rename-cobek-to-shop';
const MODAL_HTML = ["<div class=\"overlay\" id=\"refAiModal\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"refAiModal-title\">\n  <div class=\"modal\" style=\"display:flex;flex-direction:column;overflow-y:hidden\">\n    <div class=\"modal-handle\" style=\"flex-shrink:0\"></div>\n    <div class=\"modal-title\" id=\"refAiModal-title\" style=\"flex-shrink:0\"><span>🔍 Hasil Cek Referensi via AI</span><button class=\"modal-close\" data-action=\"closeModal\" data-args='[\"refAiModal\"]' aria-label=\"Tutup\">✕</button></div>\n    <!-- BUGFIX: tombol \"Terapkan\" dulu sempat \"tenggelam\"/ketutup krn position:sticky tidak selalu\n         reliable di semua WebView Android saat elemen sekaligus punya overflow-x:hidden (dari class\n         .modal bawaan) -- di beberapa WebView sticky jadi tidak nempel & tombol ke-scroll keluar area\n         kelihatan / ketiban elemen lain. Fix permanen: .modal diubah jadi flex column (lihat inline\n         style di atas, overflow-y:hidden supaya .modal sendiri TIDAK ikut scroll), konten (disclaimer +\n         hasil cek) dibungkus div scrollable TERPISAH di bawah ini (flex:1;min-height:0;overflow-y:auto),\n         & tombol jadi elemen flex biasa (bukan sticky) yg otomatis selalu berada di baris paling\n         bawah modal, kelihatan penuh tanpa perlu scroll & tanpa gantung ke quirk sticky. -->\n    <div style=\"flex:1;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch\">\n      <div style=\"font-size:11px;color:var(--text2);margin-bottom:10px;line-height:1.5\">AI mencari nilai terbaru lewat web search. <b>Belum ada yang tersimpan</b> — centang yang mau dipakai, lalu tap Terapkan. Selalu cek ulang sumbernya sebelum dipakai buat hitungan resmi.</div>\n      <div id=\"refAiBody\"><div class=\"empty\"><div class=\"empty-icon\">🔍</div><div class=\"empty-text\">Menyiapkan...</div></div></div>\n    </div>\n    <button class=\"btn btn-primary btn-full\" style=\"padding:14px;margin-top:12px;flex-shrink:0;background:var(--accent);border-top:1px solid var(--border2);box-shadow:0 -8px 16px -8px rgba(0,0,0,0.4)\" id=\"refAiApplyBtn\" data-action=\"RefAI.applySelected\" disabled>✅ Terapkan yang Dicentang</button>\n  </div>\n</div>", "<div class=\"overlay\" id=\"lbHistoryModal\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"lbHistoryModal-title\">\n  <div class=\"modal\">\n    <div class=\"modal-handle\"></div>\n    <div class=\"modal-title\" id=\"lbHistoryModal-title\"><span>📈 Riwayat Skor Hidup Seimbang</span><button class=\"modal-close\" data-action=\"closeModal\" data-args='[\"lbHistoryModal\"]' aria-label=\"Tutup\">✕</button></div>\n    <div class=\"u-hint10\">1 snapshot otomatis tercatat tiap bulan saat app dibuka, sama seperti Histori Kekayaan Bersih. Bisa juga catat manual kapan saja buat lihat progress setelah bikin perubahan (misal baru isi Dana Darurat).</div>\n    <div id=\"lbHistoryChart\" class=\"u-mb12\"></div>\n    <div id=\"lbHistoryList\"><div class=\"empty\"><div class=\"empty-icon\">📈</div><div class=\"empty-text\">Belum ada snapshot skor tercatat</div></div></div>\n    <button class=\"btn btn-primary btn-full\" style=\"padding:14px;margin-top:12px\" data-action=\"LifeBalance.saveSnapshot\" data-args='[true]'>📸 Catat Skor Sekarang</button>\n  </div>\n</div>", "<div class=\"overlay\" id=\"txModal\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"txModal-title\">\n  <div class=\"modal\">\n    <div class=\"modal-handle swipeable\"></div>\n    <div class=\"modal-title\" id=\"txModal-title\"><span id=\"txModalTitle\">Tambah Transaksi</span><button class=\"modal-close\" data-action=\"closeModal\" data-args='[\"txModal\"]' aria-label=\"Tutup\">✕</button></div>\n    <div class=\"type-toggle\"><button class=\"type-btn ai\" id=\"btnI\" data-action=\"setTxType\" data-args='[\"income\"]'>💚 Pemasukan</button><button class=\"type-btn\" id=\"btnE\" data-action=\"setTxType\" data-args='[\"expense\"]'>🔴 Pengeluaran</button></div>\n    <button class=\"btn btn-ghost btn-full btn-sm u-mb10\" data-action=\"scanReceiptBelanja\">📷 Scan Struk</button>\n    <div id=\"txScanInsight\" style=\"display:none;background:var(--accent-soft);border:1px solid var(--accent);border-radius:12px;padding:12px 14px;margin-bottom:10px;font-size:12.5px;line-height:1.6;color:var(--text)\"></div>\n    <div class=\"fg\"><label class=\"fl\">Jumlah (Rp)</label>\n      <div class=\"amt-wrap\">\n        <input type=\"text\" class=\"fi fi-calc-only\" id=\"txAmt\" placeholder=\"0 atau 1.500.000+250.000\" inputmode=\"decimal\" oninput=\"syncTxAmtToLiter();updateAmtPreview('txAmt','txAmtPreview')\" onblur=\"evalAmtExpr('txAmt')\">\n        <button type=\"button\" class=\"calc-trigger\" data-action=\"openCalc\" data-args='[\"txAmt\"]' title=\"Buka kalkulator\" aria-label=\"Buka kalkulator\">🧮</button>\n      </div>\n      <div id=\"txAmtPreview\" style=\"font-size:12px;color:var(--text3);margin-top:4px\"></div>\n    </div>\n    <div class=\"fg u-rel\"><label class=\"fl\">Kategori</label>\n      <input type=\"text\" class=\"fi\" id=\"txCat\" placeholder=\"Ketik utk cari kategori... (mis. belanja)\" autocomplete=\"off\" oninput=\"onTxCatInput()\" onfocus=\"onTxCatInput()\" onblur=\"setTimeout(()=>hideSuggestBox('txCatSuggestBox'),150)\">\n      <div id=\"txCatSuggestBox\" class=\"suggest-box\"></div>\n    </div>\n    <div class=\"fg u-rel\" id=\"txSubWrap\"><label class=\"fl\">Subkategori <span style=\"font-weight:400;text-transform:none;letter-spacing:0;color:var(--text3)\">(opsional, dari Kategori yang dipilih)</span></label>\n      <input type=\"text\" class=\"fi\" id=\"txSubCat\" placeholder=\"Ketik utk cari subkategori...\" autocomplete=\"off\" oninput=\"onTxSubCatInput()\" onfocus=\"onTxSubCatInput()\" onblur=\"setTimeout(()=>hideSuggestBox('txSubCatSuggestBox'),150)\">\n      <div id=\"txSubCatSuggestBox\" class=\"suggest-box\"></div>\n    </div>\n    <div class=\"fg\"><label class=\"fl\">Akun / Metode</label><select class=\"fs\" id=\"txAcc\" onchange=\"_txAccManuallySet=true\"></select></div>\n    <div class=\"fg\"><label class=\"fl\">Cara Bayar</label>\n      <div class=\"pm-grid\" style=\"grid-template-columns:repeat(3,1fr)\">\n        <div class=\"pm-btn active\" id=\"pmTunai\" data-action=\"setPayMethod\" data-args='[\"tunai\"]'><span class=\"pm-icon\">💵</span>Tunai</div>\n        <div class=\"pm-btn\" id=\"pmCicilan\" data-action=\"setPayMethod\" data-args='[\"cicilan\"]'><span class=\"pm-icon\">💳</span>Cicilan</div>\n        <div class=\"pm-btn\" id=\"pmLangganan\" data-action=\"setPayMethod\" data-args='[\"langganan\"]'><span class=\"pm-icon\">🔁</span>Rutin</div>\n      </div>\n    </div>\n\n    <!-- CICILAN PANEL -->\n    <div id=\"txCicilanPanel\" class=\"u-dnone\">\n      <div style=\"background:var(--accent-soft);border:1px solid var(--accent);border-radius:12px;padding:14px;margin-bottom:14px\">\n        <div style=\"font-size:12px;font-weight:700;color:var(--accent);letter-spacing:0.5px;margin-bottom:10px\">💳 DETAIL CICILAN</div>\n        <div class=\"fg u-mb10\">\n          <label class=\"fl\">Nama Tagihan/Cicilan</label>\n          <input type=\"text\" class=\"fi\" id=\"txCicilanNama\" placeholder=\"Cicilan motor, HP, dll...\" oninput=\"syncCicilanPreview()\">\n        </div>\n        <div style=\"display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:6px\">\n          <div>\n            <label class=\"fl\">Total Harga (Rp)</label>\n            <div class=\"amt-wrap\">\n              <input type=\"text\" class=\"fi fi-calc-only\" id=\"txCicilanTotal\" placeholder=\"6000000\" inputmode=\"decimal\" oninput=\"syncCicilanPreview('total')\" onblur=\"evalAmtExpr('txCicilanTotal');syncCicilanPreview('total')\">\n              <button type=\"button\" class=\"calc-trigger\" data-action=\"openCalc\" data-args='[\"txCicilanTotal\"]' title=\"Buka kalkulator\" aria-label=\"Buka kalkulator\">🧮</button>\n            </div>\n          </div>\n          <div>\n            <label class=\"fl\">Cicilan/Bulan (Rp)</label>\n            <div class=\"amt-wrap\">\n              <input type=\"text\" class=\"fi fi-calc-only\" id=\"txCicilanPerBulan\" placeholder=\"122000\" inputmode=\"decimal\" oninput=\"syncCicilanPreview('perbulan')\" onblur=\"evalAmtExpr('txCicilanPerBulan');syncCicilanPreview('perbulan')\">\n              <button type=\"button\" class=\"calc-trigger\" data-action=\"openCalc\" data-args='[\"txCicilanPerBulan\"]' title=\"Buka kalkulator\" aria-label=\"Buka kalkulator\">🧮</button>\n            </div>\n          </div>\n        </div>\n        <div style=\"font-size:11px;color:var(--text2);margin-bottom:10px\">💡 Isi salah satu saja (Total Harga ATAU Cicilan/Bulan) — yang satunya otomatis dihitung</div>\n        <div style=\"display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px\">\n          <div>\n            <label class=\"fl\">Tenor</label>\n            <select class=\"fs\" id=\"txCicilanTenor\" onchange=\"syncCicilanPreview()\">\n              <option value=\"1\">1x (jatuh tempo)</option>\n              <option value=\"3\">3x cicilan</option>\n              <option value=\"6\" selected>6x cicilan</option>\n              <option value=\"12\">12x cicilan</option>\n              <option value=\"18\">18x cicilan</option>\n              <option value=\"24\">24x cicilan</option>\n              <option value=\"36\">36x cicilan</option>\n            </select>\n          </div>\n          <div>\n            <label class=\"fl\">Bunga/Biaya % (opsional)</label>\n            <input type=\"number\" step=\"0.1\" class=\"fi\" id=\"txCicilanBunga\" placeholder=\"0\" inputmode=\"decimal\" min=\"0\" oninput=\"syncCicilanPreview()\">\n          </div>\n        </div>\n        <div class=\"fg\">\n          <div class=\"setting-item\" style=\"padding:0\">\n            <div><div class=\"setting-label\">👫 Ditanggung Bersama</div><div class=\"setting-sub\">Total Harga & Cicilan/Bulan di atas itu TOTAL penuh; porsi kamu dihitung otomatis, misal patungan beli barang sama pasangan</div></div>\n            <label class=\"tgl-switch\"><input type=\"checkbox\" id=\"txCicilanShared\" onchange=\"toggleCicilanSharedFields()\"><span class=\"tgl-track\"></span></label>\n          </div>\n        </div>\n        <div class=\"fg u-dnone\" id=\"txCicilanSharedWrap\">\n          <div class=\"u-grid2\">\n            <div>\n              <label class=\"fl\">Porsi Saya (%)</label>\n              <input type=\"number\" class=\"fi\" id=\"txCicilanSharedPct\" min=\"1\" max=\"99\" value=\"50\" inputmode=\"numeric\" oninput=\"syncCicilanPreview('sharedPct')\">\n            </div>\n            <div>\n              <label class=\"fl\">Porsi Saya (Rp)</label>\n              <div class=\"amt-wrap\">\n                <input type=\"text\" class=\"fi fi-calc-only\" id=\"txCicilanSharedNominal\" placeholder=\"0\" inputmode=\"decimal\" oninput=\"syncCicilanPreview('sharedNominal')\" onblur=\"evalAmtExpr('txCicilanSharedNominal');syncCicilanPreview('sharedNominal')\">\n                <button type=\"button\" class=\"calc-trigger\" data-action=\"openCalc\" data-args='[\"txCicilanSharedNominal\"]' title=\"Buka kalkulator\" aria-label=\"Buka kalkulator\">🧮</button>\n              </div>\n            </div>\n          </div>\n          <div style=\"font-size:11px;color:var(--text2);margin:6px 0 4px\">💡 Isi salah satu saja (% ATAU Rp) — yang satunya otomatis dihitung</div>\n          <div id=\"txCicilanSharedPreview\" style=\"font-size:12px;color:var(--accent);margin-top:2px;font-weight:600\"></div>\n        </div>\n        <div class=\"fg\" style=\"margin-bottom:6px\">\n          <label class=\"fl\" id=\"txCicilanDueLabel\">Jatuh Tempo Pertama</label>\n          <input type=\"date\" class=\"fi\" id=\"txCicilanDue\" oninput=\"syncCicilanPreview();syncCicilanDate('due')\">\n        </div>\n        <div id=\"txCicilanDueHint\" style=\"display:none;font-size:11px;color:var(--text2);margin-bottom:10px\">⚠️ Ini jatuh tempo cicilan BERIKUTNYA yang belum dibayar (bukan tanggal pembayaran transaksi ini). Ubah field ini hanya kalau memang mau menjadwalkan ulang cicilan berikutnya.</div>\n        <div id=\"txCicilanHistoryBtn\" style=\"display:none;margin-bottom:10px\">\n          <button type=\"button\" class=\"btn btn-ghost btn-full btn-sm\" data-action=\"openCicilanHistoryFromTx\">📋 Riwayat Pembayaran Cicilan Ini</button>\n        </div>\n        <!-- PREVIEW -->\n        <div id=\"txCicilanPreview\" style=\"background:var(--surface2);border-radius:10px;padding:10px 12px;font-size:12px;display:none\">\n          <div style=\"display:flex;justify-content:space-between;margin-bottom:4px\"><span class=\"u-t2\">Cicilan per bulan (total)</span><span style=\"font-weight:800;color:var(--accent3)\" id=\"prevPerBulan\">Rp 0</span></div>\n          <div style=\"display:flex;justify-content:space-between;margin-bottom:4px\"><span class=\"u-t2\">Total bayar (total)</span><span id=\"prevTotal\" class=\"u-fw700\">Rp 0</span></div>\n          <div style=\"display:flex;justify-content:space-between\" id=\"prevSisaRow\"><span class=\"u-t2\">Sisa setelah ini</span><span style=\"color:var(--accent2);font-weight:700\" id=\"prevSisa\">-</span></div>\n          <div id=\"prevMineRow\" style=\"display:none;margin-top:6px;padding-top:6px;border-top:1px dashed var(--border)\">\n            <div style=\"display:flex;justify-content:space-between\"><span class=\"u-t2\">👫 Porsi kamu / bulan</span><span style=\"font-weight:800;color:var(--accent)\" id=\"prevPerBulanMine\">Rp 0</span></div>\n          </div>\n        </div>\n        <div style=\"font-size:12px;color:var(--text2);margin-top:8px\">💡 Jumlah di atas (Jumlah Rp) akan diisi otomatis sesuai cicilan per bulan</div>\n      </div>\n    </div>\n\n    <!-- LANGGANAN / RUTIN PANEL -->\n    <div id=\"txLanggananPanel\" class=\"u-dnone\">\n      <div style=\"background:var(--accent3-soft);border:1px solid var(--accent3);border-radius:12px;padding:14px;margin-bottom:14px\">\n        <div style=\"font-size:12px;font-weight:700;color:var(--accent3);letter-spacing:0.5px;margin-bottom:10px\">🔁 TAGIHAN RUTIN</div>\n        <div class=\"fg u-mb10\">\n          <label class=\"fl\">Nama Tagihan</label>\n          <input type=\"text\" class=\"fi\" id=\"txLanggananNama\" placeholder=\"Listrik, WiFi, BPJS, Netflix...\">\n        </div>\n        <div class=\"u-grid2\">\n          <div>\n            <label class=\"fl\">Frekuensi</label>\n            <select class=\"fs\" id=\"txLanggananFreq\">\n              <option value=\"bulanan\">Bulanan</option>\n              <option value=\"mingguan\">Mingguan</option>\n              <option value=\"tahunan\">Tahunan</option>\n            </select>\n          </div>\n          <div>\n            <label class=\"fl\">Jatuh Tempo</label>\n            <input type=\"date\" class=\"fi\" id=\"txLanggananDue\">\n          </div>\n        </div>\n        <div style=\"font-size:12px;color:var(--accent3);margin-top:8px;font-weight:600\">✅ Tagihan rutin otomatis tersimpan & terjadwal</div>\n      </div>\n    </div>\n    <!-- STOK SPAREPART PANEL (otomatis muncul kalau kategori Kendaraan/Transport) -->\n    <div id=\"txStockPanel\" class=\"u-dnone\">\n      <div style=\"background:var(--accent3-soft);border:1px solid var(--accent3);border-radius:12px;padding:14px;margin-bottom:14px\">\n        <label style=\"display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;color:var(--accent3);cursor:pointer;margin:0\">\n          <input type=\"checkbox\" id=\"txAddStock\" onchange=\"toggleTxStockFields()\" style=\"width:16px;height:16px;accent-color:var(--accent3)\">\n          📦 Tambah ke Stok Sparepart juga?\n        </label>\n        <div id=\"txStockFields\" style=\"display:none;margin-top:12px\">\n          <div class=\"fg\"><label class=\"fl\">Pilih Sparepart</label>\n            <select class=\"fs\" id=\"txStockItem\" onchange=\"onTxStockItemChange()\"></select>\n          </div>\n          <div class=\"fg u-dnone\" id=\"txStockNewWrap\">\n            <label class=\"fl\">Nama Sparepart Baru</label>\n            <input type=\"text\" class=\"fi\" id=\"txStockNewName\" placeholder=\"Oli Mesin Yamalube 1L, dll\">\n          </div>\n          <div class=\"u-grid2\">\n            <div class=\"fg\"><label class=\"fl\">Jumlah Ditambah</label><input type=\"number\" class=\"fi\" id=\"txStockQty\" placeholder=\"1\" inputmode=\"numeric\" value=\"1\"></div>\n            <div class=\"fg u-mb0\"><label class=\"fl\">Satuan</label><input type=\"text\" class=\"fi\" id=\"txStockUnit\" placeholder=\"pcs, liter, set\" value=\"pcs\"></div>\n          </div>\n          <div style=\"font-size:12px;color:var(--text2);margin-top:6px\">💡 Kalau pilih \"Sparepart Baru\", kategori & kode sparepart dibuat otomatis sesuai nama yang diisi.</div>\n        </div>\n      </div>\n    </div>\n    <!-- STOK SHOP PANEL (otomatis muncul kalau kategori mengandung \"Shop\") -->\n    <div id=\"txShopStockPanel\" class=\"u-dnone\">\n      <div style=\"background:var(--accent-soft);border:1px solid var(--accent);border-radius:12px;padding:14px;margin-bottom:14px\">\n        <label style=\"display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;color:var(--accent);cursor:pointer;margin:0\">\n          <input type=\"checkbox\" id=\"txAddShopStock\" onchange=\"toggleTxShopStockFields()\" style=\"width:16px;height:16px;accent-color:var(--accent)\">\n          🪨 Tambah ke Stok Shop juga?\n        </label>\n        <div id=\"txShopStockFields\" style=\"display:none;margin-top:12px\">\n          <div id=\"txShopStockCartList\" class=\"u-mb10\"></div>\n          <div class=\"fg\"><label class=\"fl\">Pilih Produk</label>\n            <select class=\"fs\" id=\"txShopStockItem\" onchange=\"onTxShopStockItemChange()\"></select>\n          </div>\n          <div id=\"txShopStockNewWrap\" class=\"u-dnone\">\n            <div class=\"fg\"><label class=\"fl\">Nama Produk Baru</label>\n              <input type=\"text\" class=\"fi\" id=\"txShopStockNewName\" placeholder=\"Shop 21-22cm + muntu\">\n            </div>\n          </div>\n          <div class=\"fg\"><label class=\"fl\">Kategori Stok</label>\n            <input type=\"text\" class=\"fi\" id=\"txShopStockKategori\" list=\"txShopKategoriList\" placeholder=\"Shop Besar, Munthu, dll\">\n            <datalist id=\"txShopKategoriList\"></datalist>\n          </div>\n          <div class=\"fg\"><label class=\"fl\">Produsen / Supplier</label>\n            <select class=\"fs\" id=\"txShopStockProdusen\" onchange=\"onTxShopStockProdusenChange()\"></select>\n          </div>\n          <div class=\"u-grid2\">\n            <div class=\"fg\"><label class=\"fl\">Jumlah Ditambah</label><input type=\"number\" class=\"fi\" id=\"txShopStockQty\" placeholder=\"10\" inputmode=\"numeric\" value=\"1\"></div>\n            <div class=\"fg\"><label class=\"fl\">Harga Beli/pcs (Rp)</label><input type=\"number\" class=\"fi\" id=\"txShopStockHarga\" placeholder=\"20000\" inputmode=\"numeric\"></div>\n          </div>\n          <div class=\"fg\" id=\"txShopStockJualWrap\" style=\"display:none;margin-bottom:0\">\n            <label class=\"fl\">Harga Jual/pcs (Rp) — khusus produk baru</label>\n            <input type=\"number\" class=\"fi\" id=\"txShopStockJual\" placeholder=\"40000\" inputmode=\"numeric\">\n          </div>\n          <button type=\"button\" class=\"btn btn-ghost btn-sm\" style=\"margin-top:10px;width:100%\" data-action=\"addShopStockCartItem\">➕ Tambahkan Produk ke Daftar</button>\n          <div style=\"font-size:12px;color:var(--text2);margin-top:6px\">💡 Bisa tambah beberapa produk berbeda sekaligus dalam 1 transaksi belanja. Total semua produk di daftar otomatis mengisi Nominal transaksi di atas. Produsen beda bisa punya harga beli berbeda — harga otomatis terisi sesuai produsen yang dipilih kalau pernah dicatat sebelumnya.</div>\n        </div>\n      </div>\n    </div>\n    <!-- PENJUALAN SHOP PANEL (otomatis muncul kalau type=Pemasukan & kategori/subkategori mengandung \"Shop\") -->\n    <div id=\"txShopSalePanel\" class=\"u-dnone\">\n      <div style=\"background:var(--accent-soft);border:1px solid var(--accent);border-radius:12px;padding:14px;margin-bottom:14px\">\n        <label style=\"display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;color:var(--accent);cursor:pointer;margin:0\">\n          <input type=\"checkbox\" id=\"txAddShopSale\" onchange=\"toggleTxShopSaleFields()\" style=\"width:16px;height:16px;accent-color:var(--accent)\">\n          🪨 Catat juga sbg Penjualan Shop (kurangi stok)?\n        </label>\n        <div id=\"txShopSaleFields\" style=\"display:none;margin-top:12px\">\n          <div id=\"txShopSaleCartList\" class=\"u-mb10\"></div>\n          <div class=\"fg\"><label class=\"fl\">Pilih Produk</label>\n            <select class=\"fs\" id=\"txShopSaleItem\" onchange=\"onTxShopSaleItemChange()\"></select>\n          </div>\n          <div class=\"u-grid2\">\n            <div class=\"fg\"><label class=\"fl\">Jumlah Terjual</label><input type=\"number\" class=\"fi\" id=\"txShopSaleQty\" placeholder=\"1\" inputmode=\"numeric\" value=\"1\"></div>\n            <div class=\"fg u-mb0\"><label class=\"fl\">Harga Jual/pcs (Rp)</label><input type=\"number\" class=\"fi\" id=\"txShopSaleHarga\" placeholder=\"40000\" inputmode=\"numeric\"></div>\n          </div>\n          <button type=\"button\" class=\"btn btn-ghost btn-sm\" style=\"margin-top:10px;width:100%\" data-action=\"addTxShopSaleCartItem\">➕ Tambahkan Produk ke Daftar</button>\n          <div style=\"display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px\">\n            <div class=\"fg\"><label class=\"fl\">Diskon (Rp)</label><input type=\"number\" class=\"fi\" id=\"txShopSaleDiskon\" placeholder=\"0\" inputmode=\"numeric\" onchange=\"syncTxShopSaleAmt()\"></div>\n            <div class=\"fg u-mb0\"><label class=\"fl\">Ongkir (Rp)</label><input type=\"number\" class=\"fi\" id=\"txShopSaleOngkir\" placeholder=\"0\" inputmode=\"numeric\" onchange=\"syncTxShopSaleAmt()\"></div>\n          </div>\n          <div class=\"fg u-rel\"><label class=\"fl\">Nama Pembeli (opsional)</label><input type=\"text\" class=\"fi\" id=\"txShopSaleCustName\" placeholder=\"Bu Rina\" autocomplete=\"off\" oninput=\"onShopCustFieldInput('name')\" onfocus=\"onShopCustFieldInput('name')\" onblur=\"setTimeout(()=>hideSuggestBox('txShopSaleCustNameBox'),150)\">\n            <div id=\"txShopSaleCustNameBox\" class=\"suggest-box\"></div>\n          </div>\n          <div class=\"u-grid2\">\n            <div class=\"fg u-rel\"><label class=\"fl\">No. HP (opsional)</label><input type=\"text\" class=\"fi\" id=\"txShopSaleCustPhone\" placeholder=\"08xx\" autocomplete=\"off\" oninput=\"onShopCustFieldInput('phone')\" onfocus=\"onShopCustFieldInput('phone')\" onblur=\"setTimeout(()=>hideSuggestBox('txShopSaleCustPhoneBox'),150)\">\n              <div id=\"txShopSaleCustPhoneBox\" class=\"suggest-box\"></div>\n            </div>\n            <div class=\"fg\" style=\"margin-bottom:0;position:relative\"><label class=\"fl\">Alamat (opsional)</label><input type=\"text\" class=\"fi\" id=\"txShopSaleCustAddr\" placeholder=\"Alamat kirim\" autocomplete=\"off\" oninput=\"onShopCustFieldInput('address')\" onfocus=\"onShopCustFieldInput('address')\" onblur=\"setTimeout(()=>hideSuggestBox('txShopSaleCustAddrBox'),150)\">\n              <div id=\"txShopSaleCustAddrBox\" class=\"suggest-box\"></div>\n            </div>\n          </div>\n          <div style=\"font-size:12px;color:var(--text2);margin-top:6px\">💡 Bisa tambah beberapa produk berbeda sekaligus. Total semua produk (setelah diskon+ongkir) otomatis mengisi Nominal transaksi di atas. Stok produk otomatis berkurang & tersinkron ke tab Bisnis Shop.</div>\n        </div>\n      </div>\n    </div>\n    <!-- BBM SYNC PANEL (otomatis muncul kalau kategori Kendaraan + subkategori Bensin) -->\n    <div id=\"txBbmPanel\" class=\"u-dnone\">\n      <div style=\"background:var(--accent4-soft);border:1px solid var(--accent4);border-radius:12px;padding:14px;margin-bottom:14px\">\n        <label style=\"display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;color:var(--accent4);cursor:pointer;margin:0\">\n          <input type=\"checkbox\" id=\"txSyncBbm\" onchange=\"toggleTxBbmFields()\" style=\"width:16px;height:16px;accent-color:var(--accent4)\">\n          ⛽ Sinkron ke Catatan Mobil (BBM) juga?\n        </label>\n        <div id=\"txBbmFields\" style=\"display:none;margin-top:12px\">\n          <div class=\"fg\"><label class=\"fl\">Kendaraan</label>\n            <select class=\"fs\" id=\"txBbmVehicle\"></select>\n          </div>\n          <div class=\"u-grid2\">\n            <div class=\"fg\"><label class=\"fl\">KM Odometer</label><input type=\"number\" class=\"fi\" id=\"txBbmKm\" placeholder=\"12345\" inputmode=\"numeric\"></div>\n            <div class=\"fg\"><label class=\"fl\">Liter</label><input type=\"number\" class=\"fi\" id=\"txBbmLiter\" placeholder=\"2.5\" inputmode=\"decimal\" oninput=\"syncTxBbmAmt()\" step=\"0.01\"></div>\n          </div>\n          <div class=\"u-grid2\">\n            <div class=\"fg\"><label class=\"fl\">Harga/Liter (Rp)</label><input type=\"number\" class=\"fi\" id=\"txBbmHargaL\" placeholder=\"10000\" inputmode=\"numeric\" oninput=\"syncTxBbmAmt()\"></div>\n            <div class=\"fg u-rel\"><label class=\"fl\">SPBU</label><input type=\"text\" class=\"fi\" id=\"txBbmSpbu\" placeholder=\"Pertamina, dll\" autocomplete=\"off\" oninput=\"simpleAutocompleteInput('txBbmSpbu','txBbmSpbuBox',acSpbuNames)\" onfocus=\"simpleAutocompleteInput('txBbmSpbu','txBbmSpbuBox',acSpbuNames)\" onblur=\"setTimeout(()=>hideSuggestBox('txBbmSpbuBox'),150)\">\n              <div id=\"txBbmSpbuBox\" class=\"suggest-box\"></div>\n            </div>\n          </div>\n          <label style=\"display:flex;align-items:center;gap:8px;font-size:12px;cursor:pointer;margin-top:4px\">\n            <input type=\"checkbox\" id=\"txBbmFull\" checked style=\"width:16px;height:16px;accent-color:var(--accent4)\"> Isi Full Tank\n          </label>\n          <div style=\"font-size:12px;color:var(--text2);margin-top:6px\">💡 Jumlah Rp di atas otomatis dihitung dari Liter × Harga/Liter (masih bisa diedit manual).</div>\n        </div>\n      </div>\n    </div>\n    <div class=\"fg u-rel\"><label class=\"fl\">Keterangan</label><input type=\"text\" class=\"fi\" id=\"txNote\" placeholder=\"Catatan... (mis. bayar galon+beras warung)\" autocomplete=\"off\" oninput=\"simpleAutocompleteInput('txNote','txNoteBox',acTxNotes);AutoKat.onNoteInput()\" onfocus=\"simpleAutocompleteInput('txNote','txNoteBox',acTxNotes)\" onblur=\"setTimeout(()=>hideSuggestBox('txNoteBox'),150)\">\n      <div id=\"txNoteBox\" class=\"suggest-box\"></div>\n    </div>\n    <div id=\"txCatAiSuggest\" class=\"u-dnone\" style=\"background:var(--accent-soft);border:1px solid var(--accent);border-radius:12px;padding:10px 12px;margin:-4px 0 14px;font-size:12.5px;line-height:1.5\"></div>\n    <div class=\"fg\"><label class=\"fl\">Tanggal</label><input type=\"date\" class=\"fi\" id=\"txDate\" oninput=\"syncCicilanDate('date')\"></div>\n    <button class=\"btn btn-primary btn-full u-p14\" data-action=\"saveTx\">Simpan</button>\n    <button class=\"btn btn-danger btn-full\" id=\"txDelBtn\" style=\"display:none;padding:14px;margin-top:8px\" data-action=\"deleteTxFromModal\" aria-label=\"Hapus\">🗑 Hapus Transaksi</button>\n  </div>\n</div>", "<div class=\"overlay\" id=\"gajiCalcModal\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"gajiCalcModal-title\">\n  <div class=\"modal\">\n    <div class=\"modal-handle\"></div>\n    <div class=\"modal-title\" id=\"gajiCalcModal-title\"><span>🧮 Kalkulator Gaji</span><button class=\"modal-close\" data-action=\"closeModal\" data-args='[\"gajiCalcModal\"]' aria-label=\"Tutup\">✕</button></div>\n    <button class=\"btn btn-ghost btn-full btn-sm u-mb10\" data-action=\"scanReceipt\" data-args='[\"gcUpahJam\", null, null]'>📷 Scan Slip Gaji (isi Upah Pokok/Jam)</button>\n    <div style=\"font-size:11px;color:var(--text2);margin-bottom:10px;line-height:1.5\">💡 Upah/Jam & Jam Kerja di bawah otomatis terisi dari Gaji Pokok/Hari kamu di Absensi Harian (÷7 jam) — ubah bebas kalau mau simulasi tarif/jam lain, tidak akan mengubah data Absensi.</div>\n    <div class=\"grid2\">\n      <div class=\"fg\"><label class=\"fl\">Upah Pokok / Jam (Rp)</label><input type=\"number\" class=\"fi\" id=\"gcUpahJam\" placeholder=\"15000\" inputmode=\"numeric\" oninput=\"calcGaji()\"></div>\n      <div class=\"fg\"><label class=\"fl\">Jam Kerja</label><input type=\"number\" class=\"fi\" id=\"gcJamKerja\" placeholder=\"8\" inputmode=\"numeric\" oninput=\"calcGaji()\"></div>\n    </div>\n    <div class=\"grid2\">\n      <div class=\"fg\"><label class=\"fl\">Jam Lembur</label><input type=\"number\" class=\"fi\" id=\"gcLemburJam\" placeholder=\"0\" inputmode=\"numeric\" oninput=\"calcGaji()\"></div>\n      <div class=\"fg\"><label class=\"fl\">Rate Lembur/Jam (Rp)</label><input type=\"number\" class=\"fi\" id=\"gcLemburRate\" placeholder=\"0\" inputmode=\"numeric\" oninput=\"calcGaji()\"></div>\n    </div>\n    <div class=\"grid2\">\n      <div class=\"fg\"><label class=\"fl\">Bonus/Tunjangan (Rp)</label><input type=\"number\" class=\"fi\" id=\"gcBonus\" placeholder=\"0\" inputmode=\"numeric\" oninput=\"calcGaji()\"></div>\n      <div class=\"fg\"><label class=\"fl\">Potongan (Rp)</label><input type=\"number\" class=\"fi\" id=\"gcPotongan\" placeholder=\"0\" inputmode=\"numeric\" oninput=\"calcGaji()\"></div>\n    </div>\n    <div style=\"background:var(--surface3);border-radius:12px;padding:16px;margin:10px 0 14px;text-align:center\">\n      <div style=\"font-size:12px;color:var(--text2);text-transform:uppercase;letter-spacing:1px;font-weight:700\">Total Gaji Bersih</div>\n      <div style=\"font-family:'Space Grotesk',sans-serif;font-size:28px;font-weight:800;color:var(--accent3);margin-top:4px\" id=\"gcTotal\">Rp 0</div>\n      <div style=\"font-size:12px;color:var(--text2);margin-top:6px\" id=\"gcBreakdown\"></div>\n    </div>\n    <div style=\"font-size:11px;color:var(--text2);margin-bottom:8px;line-height:1.5\">☝️ Kalkulator di atas untuk simulasi/estimasi cepat saja. Kalau sudah rutin isi Absensi Harian, pakai tombol di bawah supaya nominalnya akurat dari data absensi asli.</div>\n    <button class=\"btn btn-income btn-full\" style=\"padding:14px;margin-bottom:8px\" id=\"gcSaveBtn\" data-action=\"saveGajiAsIncome\" disabled>+ Catat Estimasi sebagai Pemasukan</button>\n    <button class=\"btn btn-primary btn-full btn-sm u-mb8\" data-action=\"openWeeklyResetManual\">💰 Sudah Gajian? Catat dari Absensi Asli</button>\n    <button class=\"btn btn-ghost btn-full btn-sm\" data-onclick=\"closeModal('gajiCalcModal');openAbsensiModal()\">📅 Buka Absensi & Riwayat Harian →</button>\n  </div>\n</div>", "<div class=\"overlay\" id=\"absensiModal\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"absensiModal-title\">\n  <div class=\"modal\">\n    <div class=\"modal-handle\"></div>\n    <div class=\"modal-title\" id=\"absensiModal-title\"><span>📅 Absensi & Kalkulator Gaji Harian</span><button class=\"modal-close\" data-action=\"closeModal\" data-args='[\"absensiModal\"]' aria-label=\"Tutup\">✕</button></div>\n    <div style=\"display:flex;gap:6px;background:var(--surface3);padding:4px;border-radius:12px;margin-bottom:14px\">\n      <button type=\"button\" id=\"whTabAbsensiBtn\" data-action=\"Payroll.setWhTab\" data-args='[\"absensi\"]' style=\"flex:1;padding:9px 0;border:none;border-radius:9px;font-weight:700;font-size:12px;cursor:pointer;background:var(--accent);color:#fff\">📅 Absensi</button>\n      <button type=\"button\" id=\"whTabKalkulatorBtn\" data-action=\"Payroll.setWhTab\" data-args='[\"kalkulator\"]' style=\"flex:1;padding:9px 0;border:none;border-radius:9px;font-weight:700;font-size:12px;cursor:pointer;background:transparent;color:var(--text2)\">🧮 Kalkulator Gaji</button>\n    </div>\n    <div id=\"whTabAbsensiWrap\">\n    <div class=\"wh-row\">\n      <div class=\"fg u-mb0\"><label class=\"fl\">Tanggal</label><input class=\"fi\" type=\"date\" id=\"whDate\"></div>\n      <div class=\"fg u-mb0\" id=\"whGajiWrap\"><label class=\"fl\">Gaji Pokok/Hari (Rp)</label><input class=\"fi\" type=\"number\" id=\"whGaji\" inputmode=\"numeric\"></div>\n    </div>\n    <div class=\"fg\"><label class=\"fl\">Jenis Hari</label>\n      <select class=\"fs\" id=\"whJenisHari\" onchange=\"Payroll.onJenisHariChange()\">\n        <option value=\"biasa\">Hari Biasa</option>\n        <option value=\"minggu\" id=\"whJenisMingguOpt\">Hari Minggu (tarif khusus)</option>\n        <option value=\"borongan\">📦 Borongan/Per-Trip (nominal manual)</option>\n      </select>\n    </div>\n    <div id=\"whJamFieldsWrap\">\n    <div class=\"grid2\">\n      <div class=\"fg\"><label class=\"fl\">Jam Masuk</label><input class=\"fi\" type=\"time\" id=\"whMasuk\" value=\"07:00\"></div>\n      <div class=\"fg\"><label class=\"fl\">Jam Pulang</label><input class=\"fi\" type=\"time\" id=\"whPulang\" value=\"15:00\"></div>\n    </div>\n    <div class=\"grid2\">\n      <div class=\"fg\"><label class=\"fl\">Istirahat Mulai</label><input class=\"fi\" type=\"time\" id=\"whIstMulai\" value=\"12:00\"></div>\n      <div class=\"fg\"><label class=\"fl\">Istirahat Selesai</label><input class=\"fi\" type=\"time\" id=\"whIstSelesai\" value=\"13:00\"></div>\n    </div>\n    </div>\n    <div id=\"whBorFieldsWrap\" class=\"u-dnone\">\n      <div class=\"fg\"><label class=\"fl\">Total Upah Borongan/Trip (Rp)</label>\n        <div class=\"amt-wrap\">\n          <input type=\"text\" class=\"fi fi-calc-only\" id=\"whBorTotal\" placeholder=\"0 atau 150.000+50.000\" inputmode=\"decimal\" oninput=\"Payroll.onJenisHariChange()\" onblur=\"evalAmtExpr('whBorTotal');Payroll.onJenisHariChange()\">\n          <button type=\"button\" class=\"calc-trigger\" data-action=\"openCalc\" data-args='[\"whBorTotal\"]' title=\"Buka kalkulator\" aria-label=\"Buka kalkulator\">🧮</button>\n        </div>\n      </div>\n      <div class=\"fg\"><label class=\"fl\">Keterangan Trip/Borongan (opsional)</label><input type=\"text\" class=\"fi\" id=\"whBorNote\" placeholder=\"Antar barang Semarang, angkut pasir 1 rit, dll...\"></div>\n      <div style=\"font-size:11px;color:var(--text2);margin:-6px 0 12px;line-height:1.5\">💡 Buat kerja borongan/per-trip (bukan per jam) — isi langsung total upahnya, jam masuk/pulang tidak wajib diisi. Tetap tercatat rapi di Riwayat Absensi ini, bukan cuma di Keuangan.</div>\n    </div>\n    <div class=\"fg\"><label class=\"fl\">Tambahan Lain-lain (Rp) <span style=\"font-weight:400;text-transform:none;letter-spacing:0;color:var(--text3)\">(opsional, mis. bonus/uang makan)</span></label><input class=\"fi\" type=\"number\" id=\"whTambahan\" placeholder=\"0\" inputmode=\"numeric\"></div>\n    <div class=\"fg\"><label class=\"fl\">Potongan Lain-lain (Rp) <span style=\"font-weight:400;text-transform:none;letter-spacing:0;color:var(--text3)\">(opsional, mis. kasbon/telat)</span></label><input class=\"fi\" type=\"number\" id=\"whPotongan\" placeholder=\"0\" inputmode=\"numeric\"></div>\n    <div id=\"whEditHint\" style=\"display:none;font-size:12px;color:var(--accent4);font-weight:700;margin-bottom:8px\">✏️ Mengedit absensi tanggal <span id=\"whEditDateLabel\"></span> — <span style=\"text-decoration:underline;cursor:pointer\" data-action=\"cancelEditWorkDay\">Batal</span></div>\n    <button class=\"btn btn-primary btn-full btn-sm\" id=\"whSaveBtn\" data-action=\"addWorkDay\">+ Tambah ke Absensi Minggu Ini</button>\n    <div class=\"gaji-result u-dnone\" id=\"gajiResult\">\n      <div style=\"font-size:12px;color:var(--text2);margin-bottom:4px\">Total Estimasi Gaji Minggu Ini (<span id=\"whCount\">0</span> hari kerja)</div>\n      <div class=\"gaji-result-main\" id=\"gajiTotal\">Rp 0</div>\n      <div id=\"gajiDetail\"></div>\n      <div id=\"gajiSyncBox\" style=\"margin-top:10px;padding-top:10px;border-top:1px solid var(--border)\"></div>\n    </div>\n    <div class=\"div\"></div>\n    <div class=\"month-nav u-mb8\">\n      <button class=\"month-nav-btn\" data-action=\"changeAbsensiWeek\" data-args='[-1]' aria-label=\"Sebelumnya\">‹</button>\n      <div class=\"month-nav-label u-fs13\" id=\"absensiWeekLabel\">Minggu Ini</div>\n      <button class=\"month-nav-btn\" data-action=\"changeAbsensiWeek\" data-args='[1]' aria-label=\"Berikutnya\">›</button>\n    </div>\n    <div class=\"u-flex u-gap4 u-mb12\" id=\"whWeekGrid\"></div>\n    <div id=\"whPendingOldWeeksBox\"></div>\n    <div style=\"font-size:12px;color:var(--text2);font-weight:700;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px\">Riwayat Absensi</div>\n    <div id=\"whList\"><div class=\"empty\"><div class=\"empty-text\">Belum ada absensi dicatat</div></div></div>\n    </div>\n    <div id=\"whTabKalkulatorWrap\" class=\"u-dnone\">\n    <div style=\"font-size:12px;color:var(--text2);font-weight:700;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px\">🎯 Rekomendasi Tarif Ideal</div>\n    <div class=\"fg\"><label class=\"fl\">Target Pemasukan Bulanan dari Kerja Ini (Rp)</label>\n      <div class=\"amt-wrap\">\n        <input type=\"text\" class=\"fi fi-calc-only\" id=\"pyTargetBulanan\" placeholder=\"0 atau 3.000.000+500.000\" inputmode=\"decimal\" onblur=\"evalAmtExpr('pyTargetBulanan');Payroll.saveTargetBulanan()\">\n        <button type=\"button\" class=\"calc-trigger\" data-action=\"openCalc\" data-args='[\"pyTargetBulanan\"]' title=\"Buka kalkulator\" aria-label=\"Buka kalkulator\">🧮</button>\n      </div>\n      <div style=\"font-size:11px;color:var(--text2);margin-top:4px\">Dihitung berdasarkan rata-rata jam kerja/hari dari histori Absensi kamu, sambil tetap jaga ≥2 hari libur/minggu (biar komponen ⏰ Kerja vs Istirahat di Skor Hidup Seimbang tidak turun). Nilai ini otomatis tersimpan — kosongkan kolomnya kapan saja kalau mau berhenti pakai.</div>\n    </div>\n    <button class=\"btn btn-ghost btn-full btn-sm u-mb10\" data-action=\"Payroll.renderRateRecommendation\">🎯 Hitung Rekomendasi Tarif/Jam Ideal</button>\n    <div id=\"pyRateRekoBox\" style=\"display:none;margin-bottom:14px;padding:10px 12px;background:var(--surface2);border-radius:10px\"></div>\n    </div>\n  </div>\n</div>", "<div class=\"overlay\" id=\"weeklyResetModal\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"weeklyResetModal-title\">\n  <div class=\"modal\">\n    <div class=\"modal-handle\"></div>\n    <div class=\"modal-title\" id=\"weeklyResetModal-title\"><span>💰 Sabtu Gajian!</span></div>\n    <div class=\"card\" style=\"text-align:center;padding:20px 16px\">\n      <div style=\"font-size:12px;color:var(--text2);margin-bottom:10px\">Total absensi minggu ini (<span id=\"wrCount\">0</span> hari kerja)</div>\n      <div class=\"ldr-days\" style=\"font-size:30px\" id=\"wrTotal\">Rp 0</div>\n    </div>\n    <div style=\"font-size:12px;color:var(--text2);margin-bottom:14px;text-align:center;line-height:1.5\">Sudah terima uang gajinya? Kalau sudah, absensi minggu ini akan dihapus (dianggap sudah digajikan). Kalau belum diterima (misal masih di Pekalongan), pilih \"Belum, Tunda\" — data tidak akan hilang & tidak ada yang tercatat sampai kamu konfirmasi lagi nanti.</div>\n    <label style=\"display:flex;align-items:center;gap:8px;margin-bottom:10px;font-size:12px;color:var(--text2);cursor:pointer\">\n      <input type=\"checkbox\" id=\"wrAutoIncome\" checked style=\"width:16px;height:16px;accent-color:var(--accent)\">\n      Catat otomatis sebagai Pemasukan (kategori Gaji)\n    </label>\n    <div class=\"fg\" id=\"wrAccWrap\"><label class=\"fl\">Masuk ke Akun</label><select class=\"fs\" id=\"wrAcc\"></select></div>\n    <div class=\"btn-row\">\n      <button class=\"btn btn-ghost\" data-action=\"confirmWeeklyReset\" data-args='[false]'>Belum, Tunda</button>\n      <button class=\"btn btn-primary\" data-action=\"confirmWeeklyReset\" data-args='[true]'>✅ Sudah Terima, Reset</button>\n    </div>\n  </div>\n</div>", "<div class=\"overlay\" id=\"transferModal\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"transferModal-title\">\n  <div class=\"modal\">\n    <div class=\"modal-handle\"></div>\n    <div class=\"modal-title\" id=\"transferModal-title\"><span>⇄ Transfer Antar Akun</span><button class=\"modal-close\" data-action=\"closeModal\" data-args='[\"transferModal\"]' aria-label=\"Tutup\">✕</button></div>\n    <div class=\"acc-select-row\" style=\"margin-bottom:14px\">\n      <div class=\"u-flex1\"><label class=\"fl\">Dari Akun</label><select class=\"fs\" id=\"trFrom\"></select></div>\n      <div class=\"acc-arrow\">→</div>\n      <div class=\"u-flex1\"><label class=\"fl\">Ke Akun</label><select class=\"fs\" id=\"trTo\"></select></div>\n    </div>\n    <div class=\"fg\"><label class=\"fl\">Jumlah (Rp)</label>\n      <div class=\"amt-wrap\">\n        <input type=\"text\" class=\"fi fi-calc-only\" id=\"trAmt\" placeholder=\"0 atau 1.500.000+250.000\" inputmode=\"decimal\" onblur=\"evalAmtExpr('trAmt')\">\n        <button type=\"button\" class=\"calc-trigger\" data-action=\"openCalc\" data-args='[\"trAmt\"]' title=\"Buka kalkulator\" aria-label=\"Buka kalkulator\">🧮</button>\n      </div>\n    </div>\n    <div class=\"fg\"><label class=\"fl\">Keterangan</label><input type=\"text\" class=\"fi\" id=\"trNote\" placeholder=\"Transfer tabungan...\"></div>\n    <div class=\"fg\"><label class=\"fl\">Tanggal</label><input type=\"date\" class=\"fi\" id=\"trDate\"></div>\n    <button class=\"btn btn-primary btn-full u-p14\" data-action=\"saveTransfer\">Simpan Transfer</button>\n  </div>\n</div>", "<div class=\"overlay\" id=\"accModal\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"accModal-title\">\n  <div class=\"modal\">\n    <div class=\"modal-handle\"></div>\n    <div class=\"modal-title\" id=\"accModal-title\"><span id=\"accModalTitle\">Tambah Akun</span><button class=\"modal-close\" data-action=\"closeModal\" data-args='[\"accModal\"]' aria-label=\"Tutup\">✕</button></div>\n    <div class=\"fg\"><label class=\"fl\">Nama Akun</label><input type=\"text\" class=\"fi\" id=\"accName\" placeholder=\"Cash, BRI, Gopay, dll\"></div>\n    <div class=\"fg\"><label class=\"fl\">Emoji/Ikon</label><input type=\"text\" class=\"fi\" id=\"accEmoji\" placeholder=\"💵\" maxlength=\"2\"></div>\n    <div class=\"fg\"><label class=\"fl\" id=\"accBalanceLabel\">Saldo Awal (Rp)</label>\n      <div class=\"amt-wrap\">\n        <input type=\"text\" class=\"fi fi-calc-only\" id=\"accBalance\" placeholder=\"0 atau 1.500.000+250.000\" inputmode=\"decimal\" oninput=\"updateAmtPreview('accBalance','accBalancePreview')\" onblur=\"evalAmtExpr('accBalance')\">\n        <button type=\"button\" class=\"calc-trigger\" data-action=\"openCalc\" data-args='[\"accBalance\"]' title=\"Buka kalkulator\" aria-label=\"Buka kalkulator\">🧮</button>\n      </div>\n      <div id=\"accBalancePreview\" style=\"font-size:12px;color:var(--text3);margin-top:4px\"></div>\n    </div>\n    <div id=\"accBalanceHint\" style=\"font-size:12px;color:var(--text2);margin:-6px 0 12px;line-height:1.4;display:none\">Ubah angka ini untuk koreksi langsung nominal saldo akun sekarang (selisihnya otomatis disesuaikan, riwayat transaksi tidak diubah).</div>\n    <div id=\"accLinkedAssetHint\" style=\"display:none;font-size:11px;color:var(--text2);line-height:1.5;margin:-4px 0 12px;padding:8px 10px;background:var(--accent2-soft);border-radius:10px\">🔗 Akun ini ditautkan dari 📋 Buku Aset, jadi otomatis dikecualikan dari Saldo Akun walau toggle di bawah \"Aktif\" — lepas tautannya dulu di modal Aset kalau mau atur manual di sini.</div>\n    <div class=\"fg\" style=\"display:flex;align-items:center;justify-content:space-between;background:var(--surface2);border-radius:12px;padding:12px 14px;margin-bottom:14px\">\n      <div><div style=\"font-size:13px;font-weight:600\">Hitung di Total Saldo</div><div class=\"u-fs12t2\">Tampilkan & jumlahkan akun ini di Saldo Akun</div></div>\n      <button type=\"button\" class=\"chip-btn active\" id=\"accIncludeBtn\" style=\"white-space:nowrap\" data-action=\"toggleAccInclude\">✓ Aktif</button>\n    </div>\n    <button class=\"btn btn-primary btn-full u-p14\" data-action=\"saveAcc\">Simpan Akun</button>\n  </div>\n</div>", "<div class=\"overlay\" id=\"assetModal\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"assetModal-title\">\n  <div class=\"modal\">\n    <div class=\"modal-handle\"></div>\n    <div class=\"modal-title\" id=\"assetModal-title\"><span id=\"assetModalTitle\">Tambah Aset</span><button class=\"modal-close\" data-action=\"closeModal\" data-args='[\"assetModal\"]' aria-label=\"Tutup\">✕</button></div>\n    <div class=\"fg\"><label class=\"fl\">Nama Aset</label><input type=\"text\" class=\"fi\" id=\"assetName\" placeholder=\"Tanah Kavling Pekalongan\"></div>\n    <div class=\"fg\"><label class=\"fl\">Jenis</label>\n      <select class=\"fs\" id=\"assetJenis\">\n        <option value=\"Tanah\">🏞️ Tanah</option>\n        <option value=\"Rumah/Bangunan\">🏠 Rumah/Bangunan</option>\n        <option value=\"Kendaraan\">🏍️ Kendaraan</option>\n        <option value=\"Emas/Logam Mulia\">🥇 Emas/Logam Mulia</option>\n        <option value=\"Deposito/Investasi\">📈 Deposito/Investasi</option>\n        <option value=\"Saham\">📊 Saham</option>\n        <option value=\"Reksadana\">💹 Reksadana</option>\n        <option value=\"Kripto\">🪙 Kripto</option>\n        <option value=\"Lainnya\">📦 Lainnya</option>\n      </select>\n    </div>\n    <div class=\"fg\"><label class=\"fl\">Lokasi/Keterangan (opsional)</label><input type=\"text\" class=\"fi\" id=\"assetLokasi\" placeholder=\"Desa Sukorejo, 500 m²\"></div>\n    <button class=\"btn btn-ghost btn-full btn-sm u-mb10\" data-action=\"scanAssetPortfolio\">📷 Scan Portofolio</button>\n    <div id=\"assetScanCandidates\" style=\"display:none;background:var(--accent-soft);border:1px solid var(--accent);border-radius:12px;padding:10px 12px;margin-bottom:10px\"></div>\n    <div class=\"fg\"><label class=\"fl\">Estimasi Nilai Saat Ini (Rp)</label>\n      <div class=\"amt-wrap\">\n        <input type=\"text\" class=\"fi fi-calc-only\" id=\"assetNilai\" placeholder=\"0\" inputmode=\"decimal\" oninput=\"updateAmtPreview('assetNilai','assetNilaiPreview');Aset.updateProfitPreview()\" onblur=\"evalAmtExpr('assetNilai');Aset.updateProfitPreview()\">\n        <button type=\"button\" class=\"calc-trigger\" data-action=\"openCalc\" data-args='[\"assetNilai\"]' title=\"Buka kalkulator\" aria-label=\"Buka kalkulator\">🧮</button>\n      </div>\n      <div id=\"assetNilaiPreview\" style=\"font-size:12px;color:var(--text3);margin-top:4px\"></div>\n    </div>\n    <!-- Detail portofolio -- khusus reksadana/saham/kripto, dipakai juga buat isian otomatis dari Scan Portofolio -->\n    <div class=\"fg\"><label class=\"fl\">Modal Investasi (opsional)</label>\n      <div class=\"amt-wrap\">\n        <input type=\"text\" class=\"fi fi-calc-only\" id=\"assetModalInvestasi\" placeholder=\"0\" inputmode=\"decimal\" oninput=\"updateAmtPreview('assetModalInvestasi','assetModalInvestasiPreview');Aset.updateProfitPreview()\" onblur=\"evalAmtExpr('assetModalInvestasi');Aset.updateProfitPreview()\">\n        <button type=\"button\" class=\"calc-trigger\" data-action=\"openCalc\" data-args='[\"assetModalInvestasi\"]' title=\"Buka kalkulator\" aria-label=\"Buka kalkulator\">🧮</button>\n      </div>\n      <div id=\"assetModalInvestasiPreview\" style=\"font-size:12px;color:var(--text3);margin-top:4px\"></div>\n    </div>\n    <div class=\"grid2\">\n      <div class=\"fg\"><label class=\"fl\">Harga Beli/Unit (opsional)</label><input type=\"text\" class=\"fi\" id=\"assetHargaBeli\" placeholder=\"1465.4662\" inputmode=\"decimal\" onblur=\"Aset.updateProfitPreview()\"></div>\n      <div class=\"fg\"><label class=\"fl\">Jumlah Unit (opsional)</label><input type=\"text\" class=\"fi\" id=\"assetJumlahUnit\" placeholder=\"7574.3814\" inputmode=\"decimal\" onblur=\"Aset.updateProfitPreview()\"></div>\n    </div>\n    <div id=\"assetProfitInfo\" style=\"font-size:12px;color:var(--text2);margin:-6px 0 14px;line-height:1.4\"></div>\n    <div class=\"fg\"><label class=\"fl\">Tanggal Perolehan (opsional)</label><input type=\"date\" class=\"fi\" id=\"assetTanggal\"></div>\n    <div class=\"fg\"><label class=\"fl\">Tautkan ke Akun (opsional)</label>\n      <select class=\"fs\" id=\"assetAccId\">\n        <option value=\"\">— Tidak ditautkan —</option>\n      </select>\n      <div style=\"font-size:11px;color:var(--text2);margin-top:4px\">Kalau uang aset ini SAMA dgn saldo salah satu 🏦 Akun (mis. rekening reksadana/RDPU yang juga tercatat sebagai akun), tautkan di sini biar gak dobel dihitung di Kekayaan Bersih. Akun yang ditautkan otomatis dikecualikan dari Saldo Akun — nilai investasinya tetap dihitung lewat Buku Aset di sini (lebih akurat, karena ada untung/rugi).</div>\n    </div>\n    <div class=\"fg\" style=\"display:flex;align-items:center;justify-content:space-between;background:var(--surface2);border-radius:12px;padding:12px 14px;margin-bottom:14px\">\n      <div><div style=\"font-size:13px;font-weight:600\">Hitung ke Zakat Maal</div><div class=\"u-fs12t2\">Aktifkan untuk emas/deposito/tanah investasi, bukan aset pakai sendiri</div></div>\n      <button type=\"button\" class=\"chip-btn\" id=\"assetZakatableBtn\" style=\"white-space:nowrap\" data-action=\"toggleAssetZakatable\">Nonaktif</button>\n    </div>\n    <button class=\"btn btn-primary btn-full u-p14\" data-action=\"saveAsset\">Simpan Aset</button>\n  </div>\n</div>", "<div class=\"overlay\" id=\"quickScanModal\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"quickScanModal-title\">\n  <div class=\"modal\">\n    <div class=\"modal-handle\"></div>\n    <div class=\"modal-title\" id=\"quickScanModal-title\"><span>⚡ Update Nilai: <span id=\"quickScanAssetName\" style=\"color:var(--accent)\"></span></span><button class=\"modal-close\" data-action=\"closeModal\" data-args='[\"quickScanModal\"]' aria-label=\"Tutup\">✕</button></div>\n    <div id=\"quickScanBody\" class=\"u-mt8\"></div>\n  </div>\n</div>", "<div class=\"overlay\" id=\"piutangModal\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"piutangModal-title\">\n  <div class=\"modal\">\n    <div class=\"modal-handle\"></div>\n    <div class=\"modal-title\" id=\"piutangModal-title\"><span id=\"piutangModalTitle\">Tambah Piutang</span><button class=\"modal-close\" data-action=\"closeModal\" data-args='[\"piutangModal\"]' aria-label=\"Tutup\">✕</button></div>\n    <button class=\"btn btn-ghost btn-full btn-sm u-mb10\" data-action=\"scanBuktiTransfer\" data-args='[\"piutangName\",\"piutangNilai\",\"piutangTanggal\"]'>📷 Scan Bukti Transfer</button>\n    <div class=\"fg\"><label class=\"fl\">Nama Peminjam</label><input type=\"text\" class=\"fi\" id=\"piutangName\" placeholder=\"Budi Santoso\"></div>\n    <div class=\"fg\"><label class=\"fl\">Jumlah Dipinjamkan (Rp)</label>\n      <div class=\"amt-wrap\">\n        <input type=\"text\" class=\"fi fi-calc-only\" id=\"piutangNilai\" placeholder=\"0\" inputmode=\"decimal\" oninput=\"updateAmtPreview('piutangNilai','piutangNilaiPreview')\" onblur=\"evalAmtExpr('piutangNilai')\">\n        <button type=\"button\" class=\"calc-trigger\" data-action=\"openCalc\" data-args='[\"piutangNilai\"]' title=\"Buka kalkulator\" aria-label=\"Buka kalkulator\">🧮</button>\n      </div>\n      <div id=\"piutangNilaiPreview\" style=\"font-size:12px;color:var(--text3);margin-top:4px\"></div>\n    </div>\n    <div class=\"fg\"><label class=\"fl\">Tanggal Pinjam</label><input type=\"date\" class=\"fi\" id=\"piutangTanggal\"></div>\n    <div class=\"fg\"><label class=\"fl\">Perkiraan Jatuh Tempo (opsional)</label><input type=\"date\" class=\"fi\" id=\"piutangJatuhTempo\"></div>\n    <div class=\"fg\"><label class=\"fl\">Catatan (opsional)</label><input type=\"text\" class=\"fi\" id=\"piutangCatatan\" placeholder=\"Untuk modal warung, dll\"></div>\n    <div class=\"fg\" style=\"display:flex;align-items:center;justify-content:space-between;background:var(--surface2);border-radius:12px;padding:12px 14px;margin-bottom:14px\">\n      <div><div style=\"font-size:13px;font-weight:600\">Sudah Lunas</div><div class=\"u-fs12t2\">Aktifkan kalau piutang sudah dikembalikan — tidak lagi dihitung ke Kekayaan Bersih</div></div>\n      <button type=\"button\" class=\"chip-btn\" id=\"piutangLunasBtn\" style=\"white-space:nowrap\" data-action=\"togglePiutangLunas\">Belum Lunas</button>\n    </div>\n    <button class=\"btn btn-primary btn-full u-p14\" data-action=\"savePiutang\">Simpan Piutang</button>\n  </div>\n</div>", "<div class=\"overlay\" id=\"debtModal\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"debtModal-title\">\n  <div class=\"modal\">\n    <div class=\"modal-handle\"></div>\n    <div class=\"modal-title\" id=\"debtModal-title\"><span id=\"debtModalTitle\">Tambah Utang</span><button class=\"modal-close\" data-action=\"closeModal\" data-args='[\"debtModal\"]' aria-label=\"Tutup\">✕</button></div>\n    <button class=\"btn btn-ghost btn-full btn-sm u-mb10\" data-action=\"scanBuktiTransfer\" data-args='[\"debtName\",\"debtNilai\",\"debtTanggal\"]'>📷 Scan Bukti Transfer</button>\n    <div class=\"fg\"><label class=\"fl\">Pemberi Pinjaman</label><input type=\"text\" class=\"fi\" id=\"debtName\" placeholder=\"Bank ABC / Koperasi / Nama orang\"></div>\n    <div class=\"fg\"><label class=\"fl\">Sisa Pokok Utang (Rp)</label>\n      <div class=\"amt-wrap\">\n        <input type=\"text\" class=\"fi fi-calc-only\" id=\"debtNilai\" placeholder=\"0\" inputmode=\"decimal\" oninput=\"updateAmtPreview('debtNilai','debtNilaiPreview')\" onblur=\"evalAmtExpr('debtNilai')\">\n        <button type=\"button\" class=\"calc-trigger\" data-action=\"openCalc\" data-args='[\"debtNilai\"]' title=\"Buka kalkulator\" aria-label=\"Buka kalkulator\">🧮</button>\n      </div>\n      <div id=\"debtNilaiPreview\" style=\"font-size:12px;color:var(--text3);margin-top:4px\"></div>\n    </div>\n    <div class=\"grid2\" style=\"gap:8px\">\n      <div class=\"fg\"><label class=\"fl\">Bunga %/tahun (opsional)</label><input type=\"text\" inputmode=\"decimal\" class=\"fi\" id=\"debtBunga\" placeholder=\"0\"></div>\n      <div class=\"fg\"><label class=\"fl\">Cicilan/Bulan (opsional, Rp)</label>\n        <div class=\"amt-wrap\">\n          <input type=\"text\" class=\"fi fi-calc-only\" id=\"debtCicilan\" placeholder=\"0\" inputmode=\"decimal\" oninput=\"updateAmtPreview('debtCicilan','debtCicilanPreview')\" onblur=\"evalAmtExpr('debtCicilan')\">\n        </div>\n        <div id=\"debtCicilanPreview\" style=\"font-size:12px;color:var(--text3);margin-top:4px\"></div>\n      </div>\n    </div>\n    <div class=\"fg\"><label class=\"fl\">Tanggal Pinjam</label><input type=\"date\" class=\"fi\" id=\"debtTanggal\"></div>\n    <div class=\"fg\"><label class=\"fl\">Jatuh Tempo (opsional)</label><input type=\"date\" class=\"fi\" id=\"debtJatuhTempo\"></div>\n    <div class=\"fg\"><label class=\"fl\">Catatan (opsional)</label><input type=\"text\" class=\"fi\" id=\"debtCatatan\" placeholder=\"Untuk renovasi, modal usaha, dll\"></div>\n    <div class=\"fg\" style=\"display:flex;align-items:center;justify-content:space-between;background:var(--surface2);border-radius:12px;padding:12px 14px;margin-bottom:14px\">\n      <div><div style=\"font-size:13px;font-weight:600\">Sudah Lunas</div><div class=\"u-fs12t2\">Aktifkan kalau utang sudah dibayar penuh — tidak lagi dihitung ke Kekayaan Bersih</div></div>\n      <button type=\"button\" class=\"chip-btn\" id=\"debtLunasBtn\" style=\"white-space:nowrap\" data-action=\"toggleDebtLunas\">Belum Lunas</button>\n    </div>\n    <button class=\"btn btn-primary btn-full u-p14\" data-action=\"saveDebt\">Simpan Utang</button>\n  </div>\n</div>", "<div class=\"overlay\" id=\"productModal\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"productModal-title\">\n  <div class=\"modal\">\n    <div class=\"modal-handle\"></div>\n    <div class=\"modal-title\" id=\"productModal-title\"><span id=\"productModalTitle\">Tambah Produk</span><button class=\"modal-close\" data-action=\"closeModal\" data-args='[\"productModal\"]' aria-label=\"Tutup\">✕</button></div>\n    <div class=\"fg u-rel\"><label class=\"fl\">Nama Produk</label><input type=\"text\" class=\"fi\" id=\"pName\" placeholder=\"Shop 21-22cm + muntu\" autocomplete=\"off\" oninput=\"simpleAutocompleteInput('pName','pNameBox',acProductNames)\" onfocus=\"simpleAutocompleteInput('pName','pNameBox',acProductNames)\" onblur=\"setTimeout(()=>hideSuggestBox('pNameBox'),150)\">\n      <div id=\"pNameBox\" class=\"suggest-box\"></div>\n    </div>\n    <div class=\"fg\"><label class=\"fl\">Stok</label><input type=\"number\" class=\"fi\" id=\"pStock\" placeholder=\"10\" inputmode=\"numeric\"></div>\n    <div class=\"fg\"><label class=\"fl\">Kategori Stok</label>\n      <input type=\"text\" class=\"fi\" id=\"pKategori\" list=\"pKategoriList\" placeholder=\"Shop Besar, Munthu, dll\">\n      <datalist id=\"pKategoriList\"></datalist>\n    </div>\n    <div class=\"fg\"><label class=\"fl\">Produsen / Supplier (opsional)</label>\n      <select class=\"fs\" id=\"pProdusen\" onchange=\"onPProdusenChange()\"></select>\n    </div>\n    <div class=\"u-grid2\">\n      <div class=\"fg\"><label class=\"fl\">Harga Beli/Modal (Rp)</label><input type=\"number\" class=\"fi\" id=\"pBeli\" placeholder=\"20000\" inputmode=\"numeric\" oninput=\"PriceReko.calc()\"></div>\n      <div class=\"fg\"><label class=\"fl\">Harga Jual (Rp)</label><input type=\"number\" class=\"fi\" id=\"pJual\" placeholder=\"40000\" inputmode=\"numeric\"></div>\n    </div>\n    <div class=\"fg\" style=\"margin-bottom:10px\"><button type=\"button\" class=\"btn btn-ghost btn-full btn-sm\" data-action=\"PriceReko.toggle\">🎯 Rekomendasi Harga Jual</button></div>\n    <div id=\"priceRekoPanel\" class=\"u-dnone\" style=\"background:var(--accent-soft);border:1px solid var(--accent);border-radius:12px;padding:14px;margin-bottom:14px\">\n      <div class=\"u-grid2\">\n        <div class=\"fg u-mb8\"><label class=\"fl\">Biaya Transport/Unit (Rp)</label><input type=\"number\" class=\"fi\" id=\"prkTransport\" placeholder=\"0\" inputmode=\"numeric\" oninput=\"PriceReko.calc()\"></div>\n        <div class=\"fg u-mb8\"><label class=\"fl\">Target Margin (%)</label><input type=\"number\" class=\"fi\" id=\"prkMargin\" placeholder=\"50\" inputmode=\"numeric\" oninput=\"PriceReko.calc()\"></div>\n      </div>\n      <div style=\"text-align:right;margin:-4px 0 8px\"><span style=\"font-size:11px;color:var(--accent);cursor:pointer;font-weight:600\" data-action=\"PriceReko.autoFillTransport\">🔄 Isi dari rata-rata BBM</span></div>\n      <button type=\"button\" class=\"btn btn-ghost btn-full btn-sm u-mb8\" data-action=\"PriceReko.checkMarketAI\">🔍 Cek Harga Pasar via AI</button>\n      <div id=\"prkMarketInfo\" style=\"font-size:11px;color:var(--text2);margin-bottom:8px;line-height:1.5\"></div>\n      <div style=\"background:var(--surface2);border-radius:10px;padding:12px;text-align:center;margin-bottom:10px\">\n        <div style=\"font-size:11px;color:var(--text2);text-transform:uppercase;letter-spacing:.5px;font-weight:700\">Rekomendasi Harga Jual</div>\n        <div style=\"font-family:'Space Grotesk',sans-serif;font-size:22px;font-weight:800;color:var(--accent)\" id=\"prkResult\">Rp 0</div>\n        <div style=\"font-size:11px;color:var(--text2);margin-top:4px\" id=\"prkBreakdown\"></div>\n      </div>\n      <button type=\"button\" class=\"btn btn-primary btn-full btn-sm\" data-action=\"PriceReko.apply\">✅ Pakai Angka Ini</button>\n    </div>\n    <div class=\"u-grid2\">\n      <div class=\"fg\"><label class=\"fl\">Harga Reseller (opsional)</label><input type=\"number\" class=\"fi\" id=\"pReseller\" placeholder=\"35000\" inputmode=\"numeric\"></div>\n      <div class=\"fg\"><label class=\"fl\">Diskon Default % (opsional)</label><input type=\"number\" class=\"fi\" id=\"pDiskon\" placeholder=\"0\" inputmode=\"numeric\"></div>\n    </div>\n    <div class=\"fg\" id=\"pAccWrap\"><label class=\"fl\">Beli Stok dari Akun</label><select class=\"fs\" id=\"pAcc\"></select>\n      <div style=\"font-size:12px;color:var(--text2);margin-top:4px\" id=\"pAccHint\">Hanya dipakai kalau stok bertambah — tercatat otomatis sebagai pengeluaran modal.</div>\n    </div>\n    <button class=\"btn btn-primary btn-full u-p14\" data-action=\"saveProduct\">Simpan Produk</button>\n  </div>\n</div>", "<div class=\"overlay\" id=\"produsenModal\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"produsenModal-title\">\n  <div class=\"modal\">\n    <div class=\"modal-handle\"></div>\n    <div class=\"modal-title\" id=\"produsenModal-title\"><span id=\"produsenModalTitle\">Tambah Produsen</span><button class=\"modal-close\" data-action=\"closeModal\" data-args='[\"produsenModal\"]' aria-label=\"Tutup\">✕</button></div>\n    <div class=\"fg u-rel\"><label class=\"fl\">Nama Produsen</label><input type=\"text\" class=\"fi\" id=\"prName\" placeholder=\"UD Batu Alam Pekalongan\" autocomplete=\"off\" oninput=\"simpleAutocompleteInput('prName','prNameBox',acProdusenNames)\" onfocus=\"simpleAutocompleteInput('prName','prNameBox',acProdusenNames)\" onblur=\"setTimeout(()=>hideSuggestBox('prNameBox'),150)\">\n      <div id=\"prNameBox\" class=\"suggest-box\"></div>\n    </div>\n    <div class=\"fg\"><label class=\"fl\">Kontak (WA/Telp, opsional)</label><input type=\"text\" class=\"fi\" id=\"prContact\" placeholder=\"0812xxxxxxx\"></div>\n    <div class=\"fg\"><label class=\"fl\">Catatan (opsional)</label><input type=\"text\" class=\"fi\" id=\"prNote\" placeholder=\"Supplier batu shop ukuran besar\"></div>\n    <button class=\"btn btn-primary btn-full u-p14\" data-action=\"saveProdusen\">Simpan Produsen</button>\n  </div>\n</div>", "<div class=\"overlay\" id=\"produsenHargaModal\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"produsenHargaModal-title\">\n  <div class=\"modal\">\n    <div class=\"modal-handle\"></div>\n    <div class=\"modal-title\" id=\"produsenHargaModal-title\"><span id=\"produsenHargaTitle\">Atur Harga Produk</span><button class=\"modal-close\" data-action=\"closeModal\" data-args='[\"produsenHargaModal\"]' aria-label=\"Tutup\">✕</button></div>\n    <div style=\"font-size:12px;color:var(--text2);margin-bottom:10px\">Isi harga beli dari produsen ini untuk tiap produk. Kosongkan kalau produsen ini tidak menjual produk tsb.</div>\n    <div id=\"produsenHargaList\"></div>\n    <button class=\"btn btn-primary btn-full\" style=\"padding:14px;margin-top:8px\" data-action=\"saveProdusenHarga\">Simpan Harga</button>\n  </div>\n</div>", "<div class=\"overlay\" id=\"orderModal\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"orderModal-title\">\n  <div class=\"modal\">\n    <div class=\"modal-handle\"></div>\n    <div class=\"modal-title\" id=\"orderModal-title\"><span>Transaksi Baru</span><button class=\"modal-close\" data-action=\"closeModal\" data-args='[\"orderModal\"]' aria-label=\"Tutup\">✕</button></div>\n    <div class=\"fg\"><label class=\"fl\">Tanggal</label><input type=\"date\" class=\"fi\" id=\"oDate\"></div>\n    <div class=\"fg\"><label class=\"fl\">Tipe Harga</label>\n      <select class=\"fs\" id=\"oPriceType\" onchange=\"renderOrderItems()\">\n        <option value=\"jual\">Harga Jual (Normal)</option>\n        <option value=\"reseller\">Harga Reseller</option>\n      </select>\n    </div>\n    <div class=\"fg\"><label class=\"fl\">Tambah Produk</label>\n      <select class=\"fs\" id=\"oProductSelect\"></select>\n    </div>\n    <button class=\"btn btn-ghost btn-full btn-sm u-mb10\" data-action=\"addOrderItem\">+ Tambah ke Keranjang</button>\n    <div id=\"orderItemList\" class=\"u-mb10\"></div>\n    <div class=\"div\"></div>\n    <div style=\"font-size:12px;color:var(--text2);font-weight:700;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:8px\">Info Konsumen (opsional)</div>\n    <div class=\"fg\"><label class=\"fl\">Nama Konsumen</label><input type=\"text\" class=\"fi\" id=\"oCustName\" placeholder=\"Tidak wajib diisi\" oninput=\"onCustomerInputChange()\"></div>\n    <div class=\"fg\"><label class=\"fl\">No. HP</label><input type=\"text\" class=\"fi\" id=\"oCustPhone\" placeholder=\"08xxxxxxxxxx\" inputmode=\"tel\" oninput=\"onCustomerInputChange()\"></div>\n    <div class=\"fg\"><label class=\"fl\">Alamat</label><input type=\"text\" class=\"fi\" id=\"oCustAddr\" placeholder=\"Tidak wajib diisi\"></div>\n    <div id=\"oCustHint\" class=\"price-hint u-dnone\"></div>\n    <div class=\"setting-item\" style=\"padding:10px 0\">\n      <div id=\"oDeliveredLbl\" style=\"font-size:12px;font-weight:600\">✅ Sudah diserahkan ke pelanggan</div>\n      <label class=\"tgl-switch\"><input type=\"checkbox\" id=\"oDelivered\" checked onchange=\"toggleOrderDeliveredField()\"><span class=\"tgl-track\"></span></label>\n    </div>\n    <div class=\"div\"></div>\n    <div class=\"u-grid2\">\n      <div class=\"fg\"><label class=\"fl\">Diskon (Rp)</label><input type=\"number\" class=\"fi\" id=\"oDiskon\" placeholder=\"0\" inputmode=\"numeric\" oninput=\"renderOrderItems()\"></div>\n      <div class=\"fg\"><label class=\"fl\">Ongkos Kirim (Rp)</label><input type=\"number\" class=\"fi\" id=\"oOngkir\" placeholder=\"0\" inputmode=\"numeric\" oninput=\"renderOrderItems()\"></div>\n    </div>\n    <div class=\"fg\"><label class=\"fl\">Catatan</label><input type=\"text\" class=\"fi\" id=\"oNote\" placeholder=\"Catatan tambahan...\"></div>\n    <div class=\"fg\"><label class=\"fl\">Uang Masuk ke Akun</label><select class=\"fs\" id=\"oAcc\"></select></div>\n    <div class=\"gaji-result\" style=\"display:block;margin-bottom:14px\">\n      <div style=\"font-size:12px;color:var(--text2);margin-bottom:4px\">Total Tagihan</div>\n      <div class=\"gaji-result-main\" id=\"oTotalDisplay\">Rp 0</div>\n      <div id=\"oProfitDisplay\" style=\"font-size:12px;color:var(--text2);margin-top:4px\">Estimasi untung: Rp 0</div>\n    </div>\n    <button class=\"btn btn-primary btn-full u-p14\" data-action=\"saveOrder\">✅ Proses & Simpan Transaksi</button>\n  </div>\n</div>", "<div class=\"overlay\" id=\"customerDetailModal\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"customerDetailModal-title\">\n  <div class=\"modal\">\n    <div class=\"modal-handle\"></div>\n    <div class=\"modal-title\" id=\"customerDetailModal-title\"><span id=\"customerDetailTitle\">Pelanggan</span><button class=\"modal-close\" data-action=\"closeModal\" data-args='[\"customerDetailModal\"]' aria-label=\"Tutup\">✕</button></div>\n    <div id=\"customerDetailBody\"></div>\n  </div>\n</div>", "<div class=\"overlay\" id=\"targetModal\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"targetModal-title\">\n  <div class=\"modal\">\n    <div class=\"modal-handle\"></div>\n    <div class=\"modal-title\" id=\"targetModal-title\"><span>Tambah Target</span><button class=\"modal-close\" data-action=\"closeModal\" data-args='[\"targetModal\"]' aria-label=\"Tutup\">✕</button></div>\n    <div class=\"fg\"><label class=\"fl\">Nama Target</label><input type=\"text\" class=\"fi\" id=\"tName\" placeholder=\"Dana Pendidikan Anak...\"></div>\n    <div class=\"fg\" style=\"display:flex;align-items:center;gap:8px;background:var(--surface2);border:1px solid var(--border);border-radius:12px;padding:10px 12px;margin-bottom:8px\">\n      <input type=\"checkbox\" id=\"tDanaDarurat\" onchange=\"onTargetDanaDaruratToggle()\" style=\"width:18px;height:18px;flex-shrink:0;accent-color:var(--accent2)\">\n      <label for=\"tDanaDarurat\" style=\"font-size:12px;font-weight:600;flex:1;cursor:pointer\">🚨 Tandai sebagai Dana Darurat</label>\n    </div>\n    <div id=\"tDanaDaruratHint\" style=\"display:none;font-size:11px;color:var(--text2);line-height:1.5;margin:-4px 0 12px;padding:8px 10px;background:var(--accent2-soft);border-radius:10px\"></div>\n    <div class=\"fg\"><label class=\"fl\">Target (Rp)</label><input type=\"number\" class=\"fi\" id=\"tAmt\" placeholder=\"0\" inputmode=\"numeric\"></div>\n    <div class=\"fg\"><label class=\"fl\">Akun Terkait (opsional)</label>\n      <select class=\"fs\" id=\"tAcc\" onchange=\"onTargetAccChange()\">\n        <option value=\"\">— Tidak terkait akun, isi manual —</option>\n      </select>\n      <div style=\"font-size:11px;color:var(--text2);margin-top:4px;line-height:1.5\">Kalau dipilih, \"Terkumpul\" otomatis ambil saldo akun ini (selalu update tiap ada transaksi) — tidak perlu tambah manual lagi.</div>\n    </div>\n    <div class=\"fg\" id=\"tSavedWrap\"><label class=\"fl\">Sudah Terkumpul (Rp)</label><input type=\"number\" class=\"fi\" id=\"tSaved\" placeholder=\"0\" inputmode=\"numeric\"></div>\n    <div class=\"fg\"><label class=\"fl\">Emoji</label><input type=\"text\" class=\"fi\" id=\"tEmoji\" placeholder=\"🏠\" maxlength=\"2\"></div>\n    <button class=\"btn btn-primary btn-full u-p14\" data-action=\"saveTarget\">Simpan</button>\n  </div>\n</div>", "<div class=\"overlay\" id=\"eduFundModal\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"eduFundModal-title\">\n  <div class=\"modal\">\n    <div class=\"modal-handle\"></div>\n    <div class=\"modal-title\" id=\"eduFundModal-title\"><span id=\"eduFundModalTitle\">Tambah Dana Pendidikan</span><button class=\"modal-close\" data-action=\"closeModal\" data-args='[\"eduFundModal\"]' aria-label=\"Tutup\">✕</button></div>\n    <div class=\"u-hint10\">Hitung berapa nabung/bulan supaya biaya sekolah/kuliah di masa depan tetap kekejar, dgn asumsi inflasi biaya pendidikan (biasanya lebih tinggi dari inflasi umum).</div>\n    <div class=\"fg\"><label class=\"fl\">Nama Anak / Jenjang</label><input type=\"text\" class=\"fi\" id=\"eduName\" placeholder=\"Kayla — Masuk SD\"></div>\n    <div class=\"fg\"><label class=\"fl\">Biaya Total Hari Ini (Rp)</label><input type=\"text\" inputmode=\"numeric\" class=\"fi\" id=\"eduBiayaHariIni\" placeholder=\"0\"></div>\n    <button class=\"btn btn-ghost btn-full btn-sm u-mb10\" data-action=\"EduFund.checkAI\">🔍 Cek Estimasi Biaya via AI</button>\n    <div class=\"fg\"><label class=\"fl\">Tahun Target (masuk)</label><input type=\"number\" inputmode=\"numeric\" class=\"fi\" id=\"eduTahunTarget\" placeholder=\"2032\"></div>\n    <div class=\"fg\"><label class=\"fl\">Asumsi Inflasi Pendidikan (%/tahun)</label><input type=\"text\" inputmode=\"decimal\" class=\"fi\" id=\"eduInflasi\" placeholder=\"12\"></div>\n    <div class=\"fg\"><label class=\"fl\">Asumsi Return Investasi (%/tahun)</label><input type=\"text\" inputmode=\"decimal\" class=\"fi\" id=\"eduReturn\" placeholder=\"8\"></div>\n    <div class=\"fg\"><label class=\"fl\">Akun Terkait (opsional)</label>\n      <select class=\"fs\" id=\"eduAcc\" onchange=\"EduFund.updatePreview()\">\n        <option value=\"\">— Tidak terkait akun, isi manual —</option>\n      </select>\n    </div>\n    <div class=\"fg\" id=\"eduSavedWrap\"><label class=\"fl\">Sudah Terkumpul (Rp)</label><input type=\"text\" inputmode=\"numeric\" class=\"fi\" id=\"eduTerkumpul\" placeholder=\"0\" oninput=\"EduFund.updatePreview()\"></div>\n    <div id=\"eduFundPreview\" style=\"font-size:12px;line-height:1.6;background:var(--surface2);border-radius:10px;padding:10px 12px;margin-bottom:12px\"></div>\n    <button class=\"btn btn-primary btn-full u-p14\" data-action=\"EduFund.save\">Simpan</button>\n  </div>\n</div>", "<div class=\"overlay\" id=\"catatanModal\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"catatanModal-title\">\n  <div class=\"modal\">\n    <div class=\"modal-handle\"></div>\n    <div class=\"modal-title\" id=\"catatanModal-title\"><span id=\"catatanTitle\">Catatan</span><button class=\"modal-close\" data-action=\"closeModal\" data-args='[\"catatanModal\"]' aria-label=\"Tutup\">✕</button></div>\n    <div class=\"fg\"><label class=\"fl\">Tanggal</label><input type=\"date\" class=\"fi\" id=\"catatanDate\"></div>\n    <div class=\"fg\"><label class=\"fl\">Catatan</label><textarea class=\"fi\" id=\"catatanText\" placeholder=\"Tulis catatan...\"></textarea></div>\n    <button class=\"btn btn-primary btn-full u-p14\" data-action=\"saveCatatan\">Simpan</button>\n  </div>\n</div>", "<div class=\"overlay\" id=\"reminderModal\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"reminderModal-title\">\n  <div class=\"modal\">\n    <div class=\"modal-handle\"></div>\n    <div class=\"modal-title\" id=\"reminderModal-title\"><span>Tambah Pengingat</span><button class=\"modal-close\" data-action=\"closeModal\" data-args='[\"reminderModal\"]' aria-label=\"Tutup\">✕</button></div>\n    <div class=\"fg\"><label class=\"fl\">Judul</label><input type=\"text\" class=\"fi\" id=\"rTitle\" placeholder=\"Bayar listrik...\"></div>\n    <div class=\"fg\"><label class=\"fl\">Keterangan</label><input type=\"text\" class=\"fi\" id=\"rDesc\" placeholder=\"Tiap bulan...\"></div>\n    <div class=\"fg\"><label class=\"fl\">Warna</label><select class=\"fs\" id=\"rColor\"><option value=\"var(--accent2)\">🔴 Penting</option><option value=\"var(--accent4)\">🟠 Sedang</option><option value=\"var(--accent)\">🟣 Info</option><option value=\"var(--accent3)\">🟢 Ringan</option></select></div>\n    <button class=\"btn btn-primary btn-full u-p14\" data-action=\"saveReminder\">Simpan</button>\n  </div>\n</div>", "<div class=\"overlay\" id=\"catModal\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"catModal-title\">\n  <div class=\"modal\">\n    <div class=\"modal-handle\"></div>\n    <div class=\"modal-title\" id=\"catModal-title\"><span id=\"catModalTitle\">Tambah Kategori</span><button class=\"modal-close\" data-onclick=\"catModalCallback=null;closeModal('catModal')\" aria-label=\"Tutup\">✕</button></div>\n    <div class=\"type-toggle\">\n      <button class=\"type-btn ai\" id=\"catBtnI\" data-action=\"setCatModalType\" data-args='[\"income\"]'>💚 Pemasukan</button>\n      <button class=\"type-btn\" id=\"catBtnE\" data-action=\"setCatModalType\" data-args='[\"expense\"]'>🔴 Pengeluaran</button>\n    </div>\n    <div class=\"fg\"><label class=\"fl\">Nama Kategori</label><input type=\"text\" class=\"fi\" id=\"catName\" placeholder=\"Nama kategori...\"></div>\n    <div class=\"fg\"><label class=\"fl\">Emoji/Ikon</label><input type=\"text\" class=\"fi\" id=\"catEmoji\" placeholder=\"💰\" maxlength=\"2\"></div>\n    <button class=\"btn btn-primary btn-full u-p14\" data-action=\"saveCat\">Simpan Kategori</button>\n    <button class=\"btn btn-danger btn-full\" id=\"catDelBtn\" style=\"display:none;padding:14px;margin-top:8px\" data-action=\"delCatFromModal\" aria-label=\"Hapus\">🗑 Hapus Kategori</button>\n  </div>\n</div>", "<div class=\"overlay\" id=\"subCatModal\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"subCatModal-title\">\n  <div class=\"modal\">\n    <div class=\"modal-handle\"></div>\n    <div class=\"modal-title\" id=\"subCatModal-title\"><span id=\"subCatModalTitle\">Tambah Subkategori</span><button class=\"modal-close\" data-action=\"closeModal\" data-args='[\"subCatModal\"]' aria-label=\"Tutup\">✕</button></div>\n    <div class=\"fg\"><label class=\"fl\">Induk Kategori</label><div class=\"fi\" id=\"subCatParentLabel\" style=\"background:var(--surface3);color:var(--text2)\"></div></div>\n    <div class=\"fg\"><label class=\"fl\">Nama Subkategori</label><input type=\"text\" class=\"fi\" id=\"subCatName\" placeholder=\"Contoh: Bensin, Servis, dll\"></div>\n    <button class=\"btn btn-primary btn-full u-p14\" data-action=\"saveSubCat\">Simpan Subkategori</button>\n  </div>\n</div>", "<div class=\"overlay\" id=\"billModal\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"billModal-title\">\n  <div class=\"modal\">\n    <div class=\"modal-handle\"></div>\n    <div class=\"modal-title\" id=\"billModal-title\"><span id=\"billModalTitle\">Tambah Tagihan</span><button class=\"modal-close\" data-action=\"closeModal\" data-args='[\"billModal\"]' aria-label=\"Tutup\">✕</button></div>\n    <button class=\"btn btn-ghost btn-full btn-sm u-mb10\" data-action=\"scanReceipt\" data-args='[\"billAmt\",\"billDue\",\"billNote\"]'>📷 Scan Tagihan (Foto Struk/Bill)</button>\n    <div class=\"type-toggle3\">\n      <button class=\"type-btn at\" id=\"billBtnTagihan\" data-action=\"setBillType\" data-args='[\"tagihan\"]'>🧾 Tagihan</button>\n      <button class=\"type-btn\" id=\"billBtnLangganan\" data-action=\"setBillType\" data-args='[\"langganan\"]'>🔁 Langganan</button>\n    </div>\n    <div class=\"fg u-rel\"><label class=\"fl\">Nama</label><input type=\"text\" class=\"fi\" id=\"billName\" placeholder=\"Listrik, Cicilan motor, Netflix...\" autocomplete=\"off\" oninput=\"simpleAutocompleteInput('billName','billNameBox',acBillNames)\" onfocus=\"simpleAutocompleteInput('billName','billNameBox',acBillNames)\" onblur=\"setTimeout(()=>hideSuggestBox('billNameBox'),150)\">\n      <div id=\"billNameBox\" class=\"suggest-box\"></div>\n    </div>\n    <div class=\"fg\"><label class=\"fl\" id=\"billAmtLabel\">Jumlah per Periode (Rp)</label>\n      <div class=\"amt-wrap\">\n        <input type=\"text\" class=\"fi fi-calc-only\" id=\"billAmt\" placeholder=\"0 atau 1.500.000+250.000\" inputmode=\"decimal\" oninput=\"updateAmtPreview('billAmt','billAmtPreview');updateBillSharedPreview()\" onblur=\"evalAmtExpr('billAmt');updateBillSharedPreview()\">\n        <button type=\"button\" class=\"calc-trigger\" data-action=\"openCalc\" data-args='[\"billAmt\"]' title=\"Buka kalkulator\" aria-label=\"Buka kalkulator\">🧮</button>\n      </div>\n      <div id=\"billAmtPreview\" style=\"font-size:12px;color:var(--text3);margin-top:4px\"></div>\n    </div>\n    <div class=\"fg\">\n      <div class=\"setting-item\" style=\"padding:0\">\n        <div><div class=\"setting-label\">👫 Ditanggung Bersama</div><div class=\"setting-sub\">Jumlah di atas dibagi porsi, misal patungan sama pasangan</div></div>\n        <label class=\"tgl-switch\"><input type=\"checkbox\" id=\"billShared\" onchange=\"toggleBillSharedFields()\"><span class=\"tgl-track\"></span></label>\n      </div>\n    </div>\n    <div class=\"fg u-dnone\" id=\"billSharedWrap\">\n      <label class=\"fl\">Porsi Saya (%)</label>\n      <input type=\"number\" class=\"fi\" id=\"billSharedPct\" min=\"1\" max=\"99\" value=\"50\" inputmode=\"numeric\" oninput=\"updateBillSharedPreview()\">\n      <div id=\"billSharedPreview\" style=\"font-size:12px;color:var(--accent);margin-top:4px;font-weight:600\"></div>\n    </div>\n    <div class=\"fg\"><label class=\"fl\">Tanggal Jatuh Tempo Berikutnya</label><input type=\"date\" class=\"fi\" id=\"billDue\"></div>\n    <div class=\"fg\"><label class=\"fl\">Frekuensi</label>\n      <select class=\"fs\" id=\"billFreq\">\n        <option value=\"bulanan\">Bulanan</option>\n        <option value=\"mingguan\">Mingguan</option>\n        <option value=\"tahunan\">Tahunan</option>\n        <option value=\"sekali\">Sekali saja</option>\n      </select>\n    </div>\n    <div class=\"fg\"><label class=\"fl\">Kategori Terkait (opsional)</label><select class=\"fs\" id=\"billCat\" onchange=\"updateBillSubCatOptions()\"></select></div>\n    <div class=\"fg u-dnone\" id=\"billSubWrap\"><label class=\"fl\">Subkategori</label><select class=\"fs\" id=\"billSubCat\"></select></div>\n    <div class=\"fg\"><label class=\"fl\">Bayar dari Akun</label><select class=\"fs\" id=\"billAcc\"></select></div>\n    <div class=\"fg\"><label class=\"fl\">Catatan</label><input type=\"text\" class=\"fi\" id=\"billNote\" placeholder=\"Catatan tambahan...\"></div>\n    <button class=\"btn btn-primary btn-full u-p14\" data-action=\"saveBill\">Simpan</button>\n  </div>\n</div>", "<div class=\"overlay\" id=\"renovProjectModal\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"renovProjectModal-title\" style=\"z-index:300\">\n  <div class=\"modal\">\n    <div class=\"modal-handle\"></div>\n    <div class=\"modal-title\" id=\"renovProjectModal-title\"><span id=\"renovProjectModalTitle\">Proyek Renovasi Baru</span><button class=\"modal-close\" data-action=\"closeModal\" data-args='[\"renovProjectModal\"]' aria-label=\"Tutup\">✕</button></div>\n    <div class=\"fg\"><label class=\"fl\">Nama Proyek</label><input type=\"text\" class=\"fi\" id=\"renovProjName\" placeholder=\"Renovasi Kamar Mandi, Cat Ulang Rumah, dst\"></div>\n    <div class=\"fg\"><label class=\"fl\">Catatan (opsional)</label><input type=\"text\" class=\"fi\" id=\"renovProjNote\" placeholder=\"Catatan tambahan...\"></div>\n    <button class=\"btn btn-primary btn-full u-p14\" data-action=\"Renov.saveProject\">Simpan Proyek</button>\n  </div>\n</div>", "<div class=\"overlay\" id=\"sewaKiosUnitModal\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"sewaKiosUnitModal-title\" style=\"z-index:300\">\n  <div class=\"modal\">\n    <div class=\"modal-handle\"></div>\n    <div class=\"modal-title\" id=\"sewaKiosUnitModal-title\"><span id=\"sewaKiosUnitModalTitle\">Unit Kios Baru</span><button class=\"modal-close\" data-action=\"closeModal\" data-args='[\"sewaKiosUnitModal\"]' aria-label=\"Tutup\">✕</button></div>\n    <div class=\"fg\"><label class=\"fl\">Nama Unit</label><input type=\"text\" class=\"fi\" id=\"skName\" placeholder=\"Kios A, Lapak Depan Candi, dst\"></div>\n    <div class=\"fg\"><label class=\"fl\">Tautkan ke Proyek Renovasi (opsional)</label><select class=\"fi\" id=\"skRenovProject\"><option value=\"\">— Tidak ditautkan —</option></select></div>\n    <div class=\"fg\"><label class=\"fl\">Status</label><select class=\"fi\" id=\"skStatus\"><option value=\"kosong\">Kosong</option><option value=\"disewa\">Disewa</option></select></div>\n    <div class=\"fg\"><label class=\"fl\">Nama Penyewa (opsional)</label><input type=\"text\" class=\"fi\" id=\"skPenyewa\" placeholder=\"Nama penyewa\"></div>\n    <div class=\"fg\"><label class=\"fl\">Harga Sewa / Bulan</label><input type=\"text\" class=\"fi fi-calc-only\" id=\"skHarga\" placeholder=\"0\" inputmode=\"decimal\" onblur=\"evalAmtExpr('skHarga')\"></div>\n    <div class=\"fg\"><label class=\"fl\">Akun Tujuan Pembayaran Sewa</label><select class=\"fi\" id=\"skAccount\"></select></div>\n    <div class=\"fg\"><label class=\"fl\">Catatan (opsional)</label><input type=\"text\" class=\"fi\" id=\"skCatatan\" placeholder=\"Catatan tambahan...\"></div>\n    <button class=\"btn btn-primary btn-full u-p14\" data-action=\"SewaKios.saveUnit\">Simpan Unit</button>\n    <button class=\"btn btn-ghost btn-full\" style=\"padding:12px;margin-top:8px;display:none\" id=\"skDelBtn\" data-action=\"SewaKios.deleteUnitFromModal\" aria-label=\"Hapus\">🗑 Hapus Unit</button>\n  </div>\n</div>", "<div class=\"overlay\" id=\"renovDetailModal\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"renovDetailModal-title\">\n  <div class=\"modal\">\n    <div class=\"modal-handle\"></div>\n    <div class=\"modal-title\" id=\"renovDetailModal-title\"><span id=\"renovDetailTitle\">Proyek</span><span style=\"display:flex;gap:6px;align-items:center\">\n      <button class=\"card-setting-btn\" data-action=\"Renov.editCurrentProject\" aria-label=\"Edit\">✏️ Edit</button>\n      <button class=\"modal-close\" data-action=\"closeModal\" data-args='[\"renovDetailModal\"]' aria-label=\"Tutup\">✕</button>\n    </span></div>\n    <div id=\"renovDetailNote\" class=\"u-hint10\"></div>\n    <div class=\"budget-summary-grid\" style=\"margin-bottom:6px\">\n      <div class=\"budget-sum-box\"><div class=\"budget-sum-val purple\" id=\"renovDetTotal\">Rp 0</div><div class=\"budget-sum-lbl\">Total Rencana</div></div>\n      <div class=\"budget-sum-box\"><div class=\"budget-sum-val green\" id=\"renovDetPaid\">Rp 0</div><div class=\"budget-sum-lbl\">Sudah Bayar</div></div>\n      <div class=\"budget-sum-box\"><div class=\"budget-sum-val red\" id=\"renovDetSisa\">Rp 0</div><div class=\"budget-sum-lbl\">Sisa</div></div>\n    </div>\n    <div class=\"budget-bar-track\" style=\"height:10px\"><div class=\"budget-bar-fill\" id=\"renovDetBar\" style=\"width:0%;background:var(--accent3)\"></div></div>\n    <div class=\"budget-bar-label\" style=\"margin-bottom:14px\"><span id=\"renovDetPct\">0% selesai</span><span id=\"renovDetCount\" class=\"u-t2\"></span></div>\n    <div id=\"renovItemList\"></div>\n    <button class=\"btn btn-ghost btn-full\" style=\"margin-top:10px\" data-onclick=\"Renov.openItemModal(Renov.curId)\">＋ Tambah Item Biaya</button>\n    <button class=\"btn btn-ghost btn-full u-mt8\" data-onclick=\"RenovAI.suggest(Renov.curId)\">🤖 Saran AI: Kebutuhan &amp; Ukuran</button>\n    <button class=\"btn btn-danger btn-full u-mt8\" data-onclick=\"Renov.deleteProject(Renov.curId)\">🗑 Hapus Proyek Ini</button>\n  </div>\n</div>", "<div class=\"overlay\" id=\"renovAiModal\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"renovAiModal-title\" style=\"z-index:300\">\n  <div class=\"modal\">\n    <div class=\"modal-handle\"></div>\n    <div class=\"modal-title\" id=\"renovAiModal-title\"><span>🤖 Saran AI Proyek Renovasi</span><button class=\"modal-close\" data-action=\"closeModal\" data-args='[\"renovAiModal\"]' aria-label=\"Tutup\">✕</button></div>\n    <div class=\"u-hint12\">Saran ini dibuat oleh AI berdasarkan nama proyek & daftar item yang sudah kamu catat — bersifat perkiraan umum, bukan hitungan pasti. Selalu cek ulang ke tukang/toko bangunan sebelum belanja.</div>\n    <div id=\"renovAiBody\"><div class=\"empty\"><div class=\"empty-icon\">🤖</div><div class=\"empty-text\">Menyiapkan...</div></div></div>\n  </div>\n</div>", "<div class=\"overlay\" id=\"renovItemModal\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"renovItemModal-title\">\n  <div class=\"modal\">\n    <div class=\"modal-handle\"></div>\n    <div class=\"modal-title\" id=\"renovItemModal-title\"><span id=\"renovItemModalTitle\">Tambah Item Biaya</span><button class=\"modal-close\" data-action=\"closeModal\" data-args='[\"renovItemModal\"]' aria-label=\"Tutup\">✕</button></div>\n    <div id=\"renovItemLinkOldWrap\" style=\"margin-bottom:14px;background:var(--accent-soft);border:1px solid rgba(124,111,239,0.25);border-radius:10px;padding:10px 12px\">\n      <span style=\"font-size:12px;color:var(--accent);cursor:pointer;font-weight:600;line-height:1.5\" data-action=\"Renov.openLinkTxModal\">🔗 Transaksinya sudah ada di Keuangan (misal sebelum fitur ini dibuat)? Hubungkan di sini →</span>\n    </div>\n    <div class=\"fg\"><label class=\"fl\">Nama Item</label><input type=\"text\" class=\"fi\" id=\"renovItemName\" placeholder=\"Keran wastafel, Keramik lantai, Ongkos tukang...\"></div>\n    <div class=\"fg\"><label class=\"fl\">Ukuran / Kebutuhan (opsional)</label><input type=\"text\" class=\"fi\" id=\"renovItemUkuran\" placeholder=\"mis. 5 m², 10 buah, 2 dus\"></div>\n    <div class=\"fg\"><label class=\"fl\">Harga (Rp)</label>\n      <div class=\"amt-wrap\">\n        <input type=\"text\" class=\"fi fi-calc-only\" id=\"renovItemHarga\" placeholder=\"0\" inputmode=\"decimal\">\n        <button type=\"button\" class=\"calc-trigger\" data-action=\"openCalc\" data-args='[\"renovItemHarga\"]' title=\"Buka kalkulator\" aria-label=\"Buka kalkulator\">🧮</button>\n      </div>\n      <div style=\"text-align:right;margin-top:6px\"><span style=\"font-size:12px;color:var(--accent);cursor:pointer;font-weight:600\" data-onclick=\"RenovCalc.open(Renov._currentItemCalcDetail)\">📦 Bantu Hitung Material →</span></div>\n      <div style=\"text-align:right;margin-top:6px\"><span style=\"font-size:12px;color:var(--accent);cursor:pointer;font-weight:600\" data-action=\"Tukang.openModal\">👷 Hitung Upah dari Absensi Tukang →</span></div>\n      <div id=\"renovItemCalcSaved\" style=\"display:none;font-size:11px;color:var(--text2);margin-top:4px;line-height:1.5\"></div>\n    </div>\n    <div class=\"fg\"><label class=\"fl\">Kategori Terkait (opsional)</label><select class=\"fs\" id=\"renovItemCat\"></select></div>\n    <div class=\"fg\"><label class=\"fl\">Bayar dari Akun</label><select class=\"fs\" id=\"renovItemAcc\"></select></div>\n    <div class=\"fg\"><label class=\"fl\">Tanggal Bayar</label><input type=\"date\" class=\"fi\" id=\"renovItemTglBayar\"></div>\n    <div class=\"fg\"><label class=\"fl\">Catatan (opsional)</label><input type=\"text\" class=\"fi\" id=\"renovItemNote\" placeholder=\"Catatan tambahan...\"></div>\n    <div id=\"renovItemPaidNotice\" style=\"display:none;font-size:12px;color:var(--accent);margin-bottom:10px;line-height:1.5\">💡 Item ini sudah ditandai lunas — ubah di sini akan ikut memperbarui transaksi terkait di Keuangan.</div>\n    <button class=\"btn btn-primary btn-full u-p14\" data-action=\"Renov.saveItem\">Simpan Item</button>\n  </div>\n</div>", "<div class=\"overlay\" id=\"linkTxModal\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"linkTxModal-title\" style=\"z-index:300\">\n  <div class=\"modal\">\n    <div class=\"modal-handle\"></div>\n    <div class=\"modal-title\" id=\"linkTxModal-title\"><span id=\"linkTxModalTitle\">🔗 Hubungkan Transaksi Lama</span><button class=\"modal-close\" data-action=\"closeModal\" data-args='[\"linkTxModal\"]' aria-label=\"Tutup\">✕</button></div>\n\n    <div id=\"linkTxFilterBox\">\n      <div id=\"linkTxModalDesc\" class=\"u-hint12\"></div>\n      <div style=\"display:flex;gap:8px;margin-bottom:8px\">\n        <div class=\"fg\" style=\"flex:1;margin-bottom:0\"><label class=\"fl\">Kategori</label><select class=\"fs\" id=\"linkTxKat\" onchange=\"LinkTx.onKatChange()\"><option value=\"semua\">Semua</option></select></div>\n        <div class=\"fg\" style=\"flex:1;margin-bottom:0\"><label class=\"fl\">Sub Kategori</label><select class=\"fs\" id=\"linkTxSub\" onchange=\"LinkTx.renderList()\"><option value=\"semua\">Semua</option></select></div>\n      </div>\n      <div style=\"display:flex;gap:8px;margin-bottom:8px\">\n        <div class=\"fg\" style=\"flex:1;margin-bottom:0\"><label class=\"fl\">Dari Tanggal</label><input type=\"date\" class=\"fi\" id=\"linkTxDari\" onchange=\"LinkTx.renderList()\"></div>\n        <div class=\"fg\" style=\"flex:1;margin-bottom:0\"><label class=\"fl\">Sampai Tanggal</label><input type=\"date\" class=\"fi\" id=\"linkTxSampai\" onchange=\"LinkTx.renderList()\"></div>\n      </div>\n      <div class=\"fg\"><label class=\"fl\">Akun</label><select class=\"fs\" id=\"linkTxAkun\" onchange=\"LinkTx.renderList()\"><option value=\"semua\">Semua Akun</option></select></div>\n      <div class=\"fg\"><input type=\"text\" class=\"fi\" id=\"linkTxSearch\" placeholder=\"Cari nama/catatan/kategori/tanggal...\" oninput=\"LinkTx.renderList(this.value)\"></div>\n      <div style=\"display:flex;gap:8px;margin-bottom:8px\">\n        <button class=\"btn btn-ghost btn-sm u-flex1\" data-action=\"LinkTx.selectAllMatching\">☑️ Pilih Semua yg Cocok</button>\n        <button class=\"btn btn-ghost btn-sm u-flex1\" data-action=\"LinkTx.clearSelection\">✕ Kosongkan Pilihan</button>\n      </div>\n      <div id=\"linkTxList\"></div>\n      <div style=\"position:sticky;bottom:0;background:var(--surface);border-top:1px solid var(--border2);padding-top:10px;margin-top:10px;box-shadow:0 -8px 16px -8px rgba(0,0,0,0.4)\">\n        <div style=\"font-size:12px;color:var(--text2);text-align:center;margin-bottom:8px;font-weight:600\" id=\"linkTxPreviewText\">Belum ada transaksi dipilih</div>\n        <button class=\"btn btn-primary btn-full u-p14\" data-action=\"LinkTx.confirmBulk\" id=\"linkTxConfirmBtn\" disabled>🔗 Hubungkan Terpilih</button>\n      </div>\n    </div>\n\n    <div id=\"linkTxSuccessBox\" style=\"display:none;text-align:center;padding:10px 0\">\n      <div style=\"font-size:32px;margin-bottom:8px\">🔗</div>\n      <div style=\"font-size:14px;font-weight:700;margin-bottom:4px\" id=\"linkTxSuccessTitle\"></div>\n      <div style=\"font-size:12px;color:var(--text2);margin-bottom:16px;line-height:1.5\" id=\"linkTxSuccessSub\"></div>\n      <button class=\"btn btn-ghost btn-full u-mb8\" data-action=\"LinkTx.undo\">↺ Urungkan Semua</button>\n      <button class=\"btn btn-primary btn-full\" data-action=\"LinkTx.finish\">✅ Selesai</button>\n    </div>\n  </div>\n</div>", "<div class=\"overlay\" id=\"renovCalcModal\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"renovCalcModal-title\" style=\"z-index:300\">\n  <div class=\"modal\">\n    <div class=\"modal-handle\"></div>\n    <div class=\"modal-title\" id=\"renovCalcModal-title\"><span>📦 Kalkulator Bantu Material</span><button class=\"modal-close\" data-action=\"closeModal\" data-args='[\"renovCalcModal\"]' aria-label=\"Tutup\">✕</button></div>\n\n    <!-- MATERIAL PER SATUAN -->\n    <div id=\"renovCalcMaterial\">\n      <div class=\"fg\"><label class=\"fl\">Nama Material</label><input type=\"text\" class=\"fi\" id=\"rcMatNama\" placeholder=\"Semen, Pasir, Keramik, Besi, Kayu, dst\"></div>\n      <div class=\"fg\"><label class=\"fl\">Jenis Satuan</label>\n        <select class=\"fs\" id=\"rcMatSatuan\" onchange=\"RenovCalc.onMatSatuanChange()\">\n          <option value=\"m3\">m³ (Volume) — pasir, semen curah, cor beton</option>\n          <option value=\"m2\">m² (Luas) — keramik, plafon, cat</option>\n          <option value=\"meter\">Meter Lari (Panjang) — besi, kabel, list profil</option>\n          <option value=\"batang\">Batang/Pcs (Satuan) — kayu, bata, keramik, pipa</option>\n        </select>\n      </div>\n      <div class=\"fg\">\n        <div class=\"setting-item\" style=\"padding:0\">\n          <div><div class=\"setting-label\">📐 Hitung dari Ukuran</div><div class=\"setting-sub\">Otomatis hitung volume/luas/panjang dari dimensi ruangan</div></div>\n          <label class=\"tgl-switch\"><input type=\"checkbox\" id=\"rcMatHitungUkuran\" onchange=\"RenovCalc.toggleHitungUkuran()\"><span class=\"tgl-track\"></span></label>\n        </div>\n      </div>\n      <div id=\"rcMatUkuranWrap\" class=\"u-dnone\">\n        <div class=\"grid3\">\n          <div class=\"fg u-mb0\"><label class=\"fl\">Panjang (m)</label><input type=\"text\" class=\"fi\" id=\"rcMatP\" inputmode=\"numeric\" placeholder=\"0\" oninput=\"RenovCalc.calcMaterial()\"></div>\n          <div class=\"fg u-mb0\" id=\"rcMatLWrap\"><label class=\"fl\">Lebar (m)</label><input type=\"text\" class=\"fi\" id=\"rcMatL\" inputmode=\"numeric\" placeholder=\"0\" oninput=\"RenovCalc.calcMaterial()\"></div>\n          <div class=\"fg u-mb0\" id=\"rcMatTWrap\"><label class=\"fl\">Tinggi (m)</label><input type=\"text\" class=\"fi\" id=\"rcMatT\" inputmode=\"numeric\" placeholder=\"0\" oninput=\"RenovCalc.calcMaterial()\"></div>\n        </div>\n      </div>\n      <div class=\"fg\" id=\"rcMatLangsungWrap\">\n        <label class=\"fl\" id=\"rcMatLangsungLbl\">Jumlah Kebutuhan (m³)</label>\n        <input type=\"text\" class=\"fi\" id=\"rcMatLangsung\" inputmode=\"numeric\" placeholder=\"0\" oninput=\"RenovCalc.calcMaterial()\">\n      </div>\n      <div class=\"fg\" id=\"rcMatBuanganWrap\"><label class=\"fl\">Faktor Buangan/Susut (%)</label><input type=\"number\" class=\"fi\" id=\"rcMatBuangan\" inputmode=\"numeric\" placeholder=\"0\" value=\"0\" oninput=\"RenovCalc.calcMaterial()\"></div>\n      <div class=\"fg\"><label class=\"fl\" id=\"rcMatHargaLbl\">Harga per m³ (Rp)</label><input type=\"text\" class=\"fi\" id=\"rcMatHarga\" inputmode=\"numeric\" placeholder=\"0\" oninput=\"RenovCalc.calcMaterial()\" onblur=\"evalAmtExpr('rcMatHarga');RenovCalc.calcMaterial()\"></div>\n      <div style=\"padding:12px 14px;border-radius:12px;background:var(--surface2);margin-top:4px;margin-bottom:14px\">\n        <div style=\"display:flex;justify-content:space-between;align-items:center\"><span class=\"u-fs12t2\">Kebutuhan (dgn buangan)</span><span id=\"rcMatKebutuhan\" class=\"u-fw700\">0</span></div>\n        <div style=\"display:flex;justify-content:space-between;align-items:center;margin-top:6px\"><span class=\"u-fs12t2\">Total Biaya</span><span class=\"stat-val\" id=\"rcMatTotal\" style=\"font-size:17px\">Rp 0</span></div>\n      </div>\n      <button class=\"btn btn-primary btn-full u-p14\" data-action=\"RenovCalc.useMaterial\">✅ Pakai Hasil Ini</button>\n    </div>\n  </div>\n</div>", "<div class=\"overlay\" id=\"tukangModal\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"tukangModal-title\">\n  <div class=\"modal\">\n    <div class=\"modal-handle\"></div>\n    <div class=\"modal-title\" id=\"tukangModal-title\"><span>👷 Absensi Tukang (Banyak Orang)</span><button class=\"modal-close\" data-action=\"closeModal\" data-args='[\"tukangModal\"]' aria-label=\"Tutup\">✕</button></div>\n    <div class=\"u-hint12\">Kelola daftar tukang/laden & catat kehadiran harian tiap orang. Tap kotak hari di bawah nama untuk isi jam masuk–pulang hari itu (istirahat 12.00–13.00 otomatis dikurangi, bisa diedit). Gaji pokok dihitung dari 7 jam kerja, lebihnya otomatis jadi lembur. Absensi yang belum dipakai bisa langsung dihitung jadi total upah & dipakai ke item biaya Proyek Renovasi.</div>\n\n    <div class=\"card-title\">Tambah Pekerja</div>\n    <div class=\"fg\"><label class=\"fl\">Nama Tukang/Laden</label><input type=\"text\" class=\"fi\" id=\"tkNamaBaru\" placeholder=\"Nama tukang/laden\"></div>\n    <div class=\"grid2\">\n      <div class=\"fg\"><label class=\"fl\">Upah Pokok/Jam (Rp)</label><input type=\"text\" class=\"fi\" id=\"tkUpahJamBaru\" inputmode=\"numeric\" placeholder=\"15000\" onblur=\"evalAmtExpr('tkUpahJamBaru');Tukang.suggestLembur()\"></div>\n      <div class=\"fg\"><label class=\"fl\">Ambang Lembur (Jam/Hari)</label><input type=\"number\" class=\"fi\" id=\"tkJamKerjaBaru\" inputmode=\"numeric\" placeholder=\"7\" value=\"7\"></div>\n    </div>\n    <div class=\"fg\"><label class=\"fl\">Upah Lembur/Jam (Rp)</label><input type=\"text\" class=\"fi\" id=\"tkUpahLemburJamBaru\" inputmode=\"numeric\" placeholder=\"otomatis 1.5× upah pokok\" onblur=\"evalAmtExpr('tkUpahLemburJamBaru')\"></div>\n    <button class=\"btn btn-ghost btn-full btn-sm\" style=\"margin-bottom:14px\" data-action=\"Tukang.addWorker\">+ Tambah Pekerja</button>\n    <button class=\"btn btn-ghost btn-full btn-sm\" style=\"margin-bottom:14px\" data-action=\"Tukang.openSharedBorModal\">📦 Isi Borongan Bareng (Banyak Tukang)</button>\n    <button class=\"btn btn-ghost btn-full btn-sm\" style=\"margin-bottom:14px\" data-action=\"Tukang.openBorHistory\">📋 Riwayat & Rekap Borongan</button>\n    <button class=\"btn btn-ghost btn-full btn-sm\" style=\"margin-bottom:14px\" data-action=\"Tukang.openJamHistory\">📋 Riwayat & Rekap Absen Jam</button>\n\n    <div class=\"div\"></div>\n    <div class=\"month-nav u-mb10\">\n      <button class=\"month-nav-btn\" data-action=\"Tukang.changeWeek\" data-args='[-1]' aria-label=\"Sebelumnya\">‹</button>\n      <div class=\"month-nav-label u-fs13\" id=\"tkWeekLabel\">Minggu Ini</div>\n      <button class=\"month-nav-btn\" data-action=\"Tukang.changeWeek\" data-args='[1]' aria-label=\"Berikutnya\">›</button>\n    </div>\n    <div id=\"tkWorkerList\"></div>\n\n    <div class=\"div\"></div>\n    <div class=\"card-title\">Hitung Total & Pakai ke Item Renovasi</div>\n    <div style=\"display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px\">\n      <div class=\"fg u-mb0\"><label class=\"fl\">Dari Tanggal</label><input type=\"date\" class=\"fi\" id=\"tkRangeFrom\"></div>\n      <div class=\"fg u-mb0\"><label class=\"fl\">Sampai Tanggal</label><input type=\"date\" class=\"fi\" id=\"tkRangeTo\"></div>\n    </div>\n    <div style=\"padding:12px 14px;border-radius:12px;background:var(--surface2);margin:4px 0 10px\">\n      <div style=\"display:flex;justify-content:space-between;align-items:center\"><span class=\"u-fs12t2\">Total Upah (belum dipakai)</span><span class=\"stat-val\" id=\"tkRangeTotal\" style=\"font-size:17px\">Rp 0</span></div>\n      <div style=\"font-size:11px;color:var(--text3);margin-top:4px\" id=\"tkRangeDetail\"></div>\n    </div>\n    <button class=\"btn btn-ghost btn-full btn-sm u-mb8\" data-action=\"Tukang.calcRange\">🔄 Hitung Ulang Total Periode Ini</button>\n    <button class=\"btn btn-expense btn-full btn-sm\" style=\"margin-bottom:8px;padding:14px\" data-action=\"Tukang.payAsExpense\">💸 Sudah Dibayar? Catat sebagai Pengeluaran</button>\n    <button class=\"btn btn-primary btn-full u-p14\" data-action=\"Tukang.applyToItem\">✅ Pakai Total Ini ke Item Renovasi</button>\n    <div style=\"font-size:11px;color:var(--text2);margin-top:8px;line-height:1.5\">💡 Pakai salah satu saja: \"Sudah Dibayar\" kalau upah ini langsung dibayar tunai dari kantong (tercatat di Keuangan sbg pengeluaran biasa), atau \"Pakai ke Item Renovasi\" kalau upah ini jadi bagian biaya 1 item proyek renovasi.</div>\n  </div>\n</div>", "<div class=\"overlay\" id=\"tkDayModal\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"tkDayModal-title\">\n  <div class=\"modal\">\n    <div class=\"modal-handle\"></div>\n    <div class=\"modal-title\" id=\"tkDayModal-title\"><span>👷 Absen Harian</span><button class=\"modal-close\" data-action=\"closeModal\" data-args='[\"tkDayModal\"]' aria-label=\"Tutup\">✕</button></div>\n    <div style=\"font-size:14px;font-weight:700;margin-bottom:2px\" id=\"tkDayWorkerName\"></div>\n    <div style=\"font-size:12px;color:var(--text2);margin-bottom:12px\" id=\"tkDayDateLabel\"></div>\n    <div style=\"display:flex;gap:6px;background:var(--surface3);padding:4px;border-radius:12px;margin-bottom:14px\">\n      <button type=\"button\" id=\"tkDayModeJamBtn\" data-action=\"Tukang.setDayMode\" data-args='[\"jam\"]' style=\"flex:1;padding:9px 0;border:none;border-radius:9px;font-weight:700;font-size:12px;cursor:pointer;background:var(--accent);color:#fff\">⏱ Per Jam</button>\n      <button type=\"button\" id=\"tkDayModeBorBtn\" data-action=\"Tukang.setDayMode\" data-args='[\"borongan\"]' style=\"flex:1;padding:9px 0;border:none;border-radius:9px;font-weight:700;font-size:12px;cursor:pointer;background:transparent;color:var(--text2)\">📦 Borongan</button>\n    </div>\n    <div id=\"tkDayJamWrap\">\n    <div class=\"grid2\">\n      <div class=\"fg\"><label class=\"fl\">Jam Masuk</label><input type=\"time\" class=\"fi\" id=\"tkDayMasuk\" oninput=\"Tukang.calcDayUpah()\"></div>\n      <div class=\"fg\"><label class=\"fl\">Jam Pulang</label><input type=\"time\" class=\"fi\" id=\"tkDayPulang\" oninput=\"Tukang.calcDayUpah()\"></div>\n    </div>\n    <div class=\"grid2\">\n      <div class=\"fg\"><label class=\"fl\">Istirahat Mulai</label><input type=\"time\" class=\"fi\" id=\"tkDayIstMulai\" value=\"12:00\" oninput=\"Tukang.calcDayUpah()\"></div>\n      <div class=\"fg\"><label class=\"fl\">Istirahat Selesai</label><input type=\"time\" class=\"fi\" id=\"tkDayIstSelesai\" value=\"13:00\" oninput=\"Tukang.calcDayUpah()\"></div>\n    </div>\n    </div>\n    <div id=\"tkDayBorWrap\" class=\"u-dnone\">\n      <div class=\"fg\"><label class=\"fl\">Total Upah Borongan (Rp)</label><input type=\"text\" class=\"fi\" id=\"tkDayBorTotal\" inputmode=\"numeric\" placeholder=\"0\" oninput=\"Tukang.calcDayUpah()\" onblur=\"evalAmtExpr('tkDayBorTotal');Tukang.calcDayUpah()\">\n        <div style=\"text-align:right;margin-top:6px\"><span style=\"font-size:12px;color:var(--accent);cursor:pointer;font-weight:600\" data-action=\"Tukang.openBorCalc\" data-args='[\"day\"]'>🧮 Bantu Hitung dari Luas/Ukuran →</span></div>\n      </div>\n      <div class=\"fg\"><label class=\"fl\">Jumlah Tukang (dibagi rata)</label><input type=\"number\" class=\"fi\" id=\"tkDayBorJumlah\" inputmode=\"numeric\" placeholder=\"1\" value=\"1\" min=\"1\" oninput=\"Tukang.calcDayUpah()\"></div>\n      <div style=\"font-size:11px;color:var(--text2);margin-bottom:10px;line-height:1.5\">💡 Upah untuk <b id=\"tkDayBorWorkerNameInline\"></b> di hari ini = Total Upah Borongan ÷ Jumlah Tukang.</div>\n    </div>\n    <div style=\"background:var(--surface3);border-radius:12px;padding:14px;margin:8px 0 14px;text-align:center\">\n      <div style=\"font-size:11px;color:var(--text2);text-transform:uppercase;letter-spacing:0.8px;font-weight:700\">Upah Hari Ini</div>\n      <div style=\"font-family:'Space Grotesk',sans-serif;font-size:24px;font-weight:800;color:var(--accent3);margin-top:2px\" id=\"tkDayUpah\">Rp 0</div>\n      <div style=\"font-size:11px;color:var(--text2);margin-top:6px\" id=\"tkDayBreakdown\"></div>\n    </div>\n    <button class=\"btn btn-primary btn-full\" style=\"padding:14px;margin-bottom:8px\" data-action=\"Tukang.saveDayEntry\">💾 Simpan Absen</button>\n    <button class=\"btn btn-danger btn-full btn-sm u-dnone\" id=\"tkDayDelBtn\" data-action=\"Tukang.deleteDayEntry\" aria-label=\"Hapus\">🗑 Hapus Absen Hari Ini</button>\n  </div>\n</div>", "<div class=\"overlay\" id=\"tkBorSharedModal\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"tkBorSharedModal-title\" style=\"z-index:300\">\n  <div class=\"modal\">\n    <div class=\"modal-handle\"></div>\n    <div class=\"modal-title\" id=\"tkBorSharedModal-title\"><span>📦 Borongan Bareng</span><button class=\"modal-close\" data-action=\"closeModal\" data-args='[\"tkBorSharedModal\"]' aria-label=\"Tutup\">✕</button></div>\n    <div class=\"u-hint12\">Isi total nominal borongan sekali, centang tukang mana saja yang ikut kerja hari itu — upahnya otomatis kebagi rata ke semua yang dicentang.</div>\n    <div class=\"fg\"><label class=\"fl\">Tanggal</label><input type=\"date\" class=\"fi\" id=\"tkBorTanggal\" oninput=\"Tukang.renderSharedBorWorkerList();Tukang.calcSharedBorongan()\"></div>\n    <div class=\"fg\"><label class=\"fl\">Total Upah Borongan (Rp)</label><input type=\"text\" class=\"fi\" id=\"tkBorTotalShared\" inputmode=\"numeric\" placeholder=\"0\" oninput=\"Tukang.calcSharedBorongan()\" onblur=\"evalAmtExpr('tkBorTotalShared');Tukang.calcSharedBorongan()\">\n      <div style=\"text-align:right;margin-top:6px\"><span style=\"font-size:12px;color:var(--accent);cursor:pointer;font-weight:600\" data-action=\"Tukang.openBorCalc\" data-args='[\"shared\"]'>🧮 Bantu Hitung dari Luas/Ukuran →</span></div>\n    </div>\n    <div class=\"fg\"><label class=\"fl\">Tukang yang Ikut</label><div id=\"tkBorWorkerList\"></div></div>\n    <div style=\"background:var(--surface3);border-radius:12px;padding:14px;margin:8px 0 14px;text-align:center\">\n      <div style=\"font-size:11px;color:var(--text2);text-transform:uppercase;letter-spacing:0.8px;font-weight:700\">Upah per Orang</div>\n      <div style=\"font-family:'Space Grotesk',sans-serif;font-size:24px;font-weight:800;color:var(--accent3);margin-top:2px\" id=\"tkBorSharedPerOrang\">Rp 0</div>\n      <div style=\"font-size:11px;color:var(--text2);margin-top:6px\" id=\"tkBorSharedPreview\"></div>\n    </div>\n    <button class=\"btn btn-primary btn-full u-p14\" data-action=\"Tukang.saveSharedBorongan\">💾 Simpan Borongan Bareng</button>\n  </div>\n</div>", "<div class=\"overlay\" id=\"tkBorCalcModal\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"tkBorCalcModal-title\" style=\"z-index:400\">\n  <div class=\"modal\">\n    <div class=\"modal-handle\"></div>\n    <div class=\"modal-title\" id=\"tkBorCalcModal-title\"><span>🧮 Kalkulator Borongan</span><button class=\"modal-close\" data-action=\"closeModal\" data-args='[\"tkBorCalcModal\"]' aria-label=\"Tutup\">✕</button></div>\n    <div class=\"fg\"><label class=\"fl\">Jenis Pekerjaan</label>\n      <select class=\"fs\" id=\"tkBorCalcJenis\" onchange=\"Tukang.onBorCalcJenisChange()\">\n        <option value=\"keramik\">Pasang Keramik Lantai/Dinding (per m²)</option>\n        <option value=\"plester\">Plester Dinding (per m²)</option>\n        <option value=\"acian\">Acian Dinding (per m²)</option>\n        <option value=\"cat\">Pengecatan (per m²)</option>\n        <option value=\"bata\">Pasang Bata/Batako (per m²)</option>\n        <option value=\"bongkar\">Bongkar Bangunan (per m²)</option>\n        <option value=\"cor\">Cor Dak/Kolom Beton (per m³)</option>\n        <option value=\"listrik\">Instalasi Titik Listrik (per titik)</option>\n        <option value=\"kusen\">Pasang Kusen/Pintu/Jendela (per buah)</option>\n        <option value=\"pipa\">Pasang Pipa/Saluran (per meter)</option>\n        <option value=\"custom\">Lainnya (custom)</option>\n      </select>\n    </div>\n    <div class=\"fg u-dnone\" id=\"tkBorCalcCustomNameWrap\"><label class=\"fl\">Nama Pekerjaan</label><input type=\"text\" class=\"fi\" id=\"tkBorCalcCustomName\" placeholder=\"Nama pekerjaan borongan\" oninput=\"Tukang.onBorCalcCustomNameInput()\"></div>\n    <div class=\"fg u-dnone\" id=\"tkBorCalcSatuanWrap\"><label class=\"fl\">Satuan</label>\n      <select class=\"fs\" id=\"tkBorCalcSatuan\" onchange=\"Tukang.onBorCalcSatuanChange()\">\n        <option value=\"m2\">per m²</option>\n        <option value=\"m3\">per m³</option>\n        <option value=\"meter\">per meter</option>\n        <option value=\"buah\">per buah/titik</option>\n      </select>\n    </div>\n    <div class=\"fg\" id=\"tkBorCalcUkuranToggleWrap\">\n      <div class=\"setting-item\" style=\"padding:0\">\n        <div><div class=\"setting-label\">📐 Hitung dari Ukuran</div><div class=\"setting-sub\" id=\"tkBorCalcUkuranSub\">Otomatis hitung luas dari panjang × lebar ruangan/bidang</div></div>\n        <label class=\"tgl-switch\"><input type=\"checkbox\" id=\"tkBorCalcHitungUkuran\" onchange=\"Tukang.toggleBorCalcUkuran()\"><span class=\"tgl-track\"></span></label>\n      </div>\n    </div>\n    <div id=\"tkBorCalcUkuranWrap\" class=\"u-dnone\">\n      <div class=\"grid3\" id=\"tkBorCalcUkuranGrid\">\n        <div class=\"fg u-mb0\"><label class=\"fl\">Panjang (m)</label><input type=\"text\" class=\"fi\" id=\"tkBorCalcP\" inputmode=\"numeric\" placeholder=\"0\" oninput=\"Tukang.calcBorCalc()\"></div>\n        <div class=\"fg u-mb0\"><label class=\"fl\">Lebar (m)</label><input type=\"text\" class=\"fi\" id=\"tkBorCalcL\" inputmode=\"numeric\" placeholder=\"0\" oninput=\"Tukang.calcBorCalc()\"></div>\n        <div class=\"fg u-mb0\" id=\"tkBorCalcTWrap\"><label class=\"fl\">Tinggi (m)</label><input type=\"text\" class=\"fi\" id=\"tkBorCalcT\" inputmode=\"numeric\" placeholder=\"0\" oninput=\"Tukang.calcBorCalc()\"></div>\n      </div>\n    </div>\n    <div class=\"fg\" id=\"tkBorCalcLuasWrap\">\n      <label class=\"fl\" id=\"tkBorCalcLuasLbl\">Luas Pekerjaan (m²)</label>\n      <input type=\"text\" class=\"fi\" id=\"tkBorCalcLuas\" inputmode=\"numeric\" placeholder=\"0\" oninput=\"Tukang.calcBorCalc()\">\n    </div>\n    <div class=\"fg\"><label class=\"fl\" id=\"tkBorCalcHargaLbl\">Harga Borongan per m² (Rp)</label><input type=\"text\" class=\"fi\" id=\"tkBorCalcHarga\" inputmode=\"numeric\" placeholder=\"0\" oninput=\"Tukang.calcBorCalc()\" onblur=\"evalAmtExpr('tkBorCalcHarga');Tukang.calcBorCalc()\">\n      <div style=\"font-size:11px;color:var(--text2);margin-top:4px\" id=\"tkBorCalcHargaMemoryNote\"></div>\n    </div>\n    <div style=\"padding:12px 14px;border-radius:12px;background:var(--surface2);margin-top:4px;margin-bottom:14px\">\n      <div style=\"display:flex;justify-content:space-between;align-items:center\"><span id=\"tkBorCalcLuasOutLbl\" class=\"u-fs12t2\">Luas Dipakai</span><span id=\"tkBorCalcLuasOut\" class=\"u-fw700\">0 m²</span></div>\n      <div style=\"display:flex;justify-content:space-between;align-items:center;margin-top:6px\"><span class=\"u-fs12t2\">Total Borongan</span><span class=\"stat-val\" id=\"tkBorCalcTotal\" style=\"font-size:17px\">Rp 0</span></div>\n    </div>\n    <button class=\"btn btn-primary btn-full u-p14\" data-action=\"Tukang.useBorCalc\">✅ Pakai Hasil Ini</button>\n  </div>\n</div>", "<div class=\"overlay\" id=\"tkBorHistModal\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"tkBorHistModal-title\" style=\"z-index:300\">\n  <div class=\"modal\">\n    <div class=\"modal-handle\"></div>\n    <div class=\"modal-title\" id=\"tkBorHistModal-title\"><span>📋 Riwayat Borongan</span><button class=\"modal-close\" data-action=\"closeModal\" data-args='[\"tkBorHistModal\"]' aria-label=\"Tutup\">✕</button></div>\n    <div class=\"u-hint12\">Rekap khusus semua absensi mode borongan 📦 per bulan (terpisah dari absensi jam biasa), supaya gampang lihat total borongan bulan ini tanpa harus jumlah manual dari kotak-kotak hari.</div>\n    <div class=\"month-nav u-mb10\">\n      <button class=\"month-nav-btn\" data-action=\"Tukang.changeBorHistMonth\" data-args='[-1]' aria-label=\"Sebelumnya\">‹</button>\n      <div class=\"month-nav-label\" id=\"tkBorHistMonthLabel\">-</div>\n      <button class=\"month-nav-btn\" data-action=\"Tukang.changeBorHistMonth\" data-args='[1]' aria-label=\"Berikutnya\">›</button>\n    </div>\n    <div style=\"padding:14px;border-radius:12px;background:var(--surface2);margin-bottom:14px;text-align:center\">\n      <div style=\"font-size:11px;color:var(--text2);text-transform:uppercase;letter-spacing:0.8px;font-weight:700\">Total Borongan Bulan Ini</div>\n      <div style=\"font-family:'Space Grotesk',sans-serif;font-size:24px;font-weight:800;color:var(--accent2);margin-top:2px\" id=\"tkBorHistTotal\">Rp 0</div>\n      <div style=\"font-size:11px;color:var(--text2);margin-top:6px\" id=\"tkBorHistSub\"></div>\n    </div>\n    <button class=\"btn btn-expense btn-full btn-sm\" style=\"margin-bottom:14px;padding:14px\" data-action=\"Tukang.payBorHistoryAsExpense\">💸 Tandai Semua Borongan Bulan Ini Sudah Dibayar</button>\n    <div id=\"tkBorHistList\"></div>\n  </div>\n</div>", "<div class=\"overlay\" id=\"tkJamHistModal\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"tkJamHistModal-title\" style=\"z-index:300\">\n  <div class=\"modal\">\n    <div class=\"modal-handle\"></div>\n    <div class=\"modal-title\" id=\"tkJamHistModal-title\"><span>📋 Riwayat Absen Jam</span><button class=\"modal-close\" data-action=\"closeModal\" data-args='[\"tkJamHistModal\"]' aria-label=\"Tutup\">✕</button></div>\n    <div class=\"u-hint12\">Rekap khusus semua absensi ⏱ per jam (masuk-pulang) per bulan, terpisah dari absensi borongan 📦, lengkap dengan total jam kerja, jam lembur, dan total upahnya.</div>\n    <div class=\"month-nav u-mb10\">\n      <button class=\"month-nav-btn\" data-action=\"Tukang.changeJamHistMonth\" data-args='[-1]' aria-label=\"Sebelumnya\">‹</button>\n      <div class=\"month-nav-label\" id=\"tkJamHistMonthLabel\">-</div>\n      <button class=\"month-nav-btn\" data-action=\"Tukang.changeJamHistMonth\" data-args='[1]' aria-label=\"Berikutnya\">›</button>\n    </div>\n    <div style=\"padding:14px;border-radius:12px;background:var(--surface2);margin-bottom:14px;text-align:center\">\n      <div style=\"font-size:11px;color:var(--text2);text-transform:uppercase;letter-spacing:0.8px;font-weight:700\">Total Upah Jam Bulan Ini</div>\n      <div style=\"font-family:'Space Grotesk',sans-serif;font-size:24px;font-weight:800;color:var(--accent3);margin-top:2px\" id=\"tkJamHistTotal\">Rp 0</div>\n      <div style=\"font-size:11px;color:var(--text2);margin-top:6px\" id=\"tkJamHistSub\"></div>\n    </div>\n    <div id=\"tkJamHistList\"></div>\n  </div>\n</div>", "<div class=\"overlay\" id=\"billCalendarModal\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"billCalendarModal-title\">\n  <div class=\"modal\">\n    <div class=\"modal-handle\"></div>\n    <div class=\"modal-title\" id=\"billCalendarModal-title\"><span>📅 Kalender Tagihan</span><button class=\"modal-close\" data-action=\"closeModal\" data-args='[\"billCalendarModal\"]' aria-label=\"Tutup\">✕</button></div>\n    <div style=\"display:flex;align-items:center;justify-content:space-between;margin-bottom:10px\">\n      <button class=\"btn btn-ghost btn-sm\" data-action=\"navBillCalendar\" data-args='[-1]' aria-label=\"Bulan sebelumnya\">←</button>\n      <div style=\"font-weight:800;font-size:15px\" id=\"billCalLabel\">-</div>\n      <button class=\"btn btn-ghost btn-sm\" data-action=\"navBillCalendar\" data-args='[1]' aria-label=\"Bulan berikutnya\">→</button>\n    </div>\n    <div style=\"font-size:12px;color:var(--text2);text-align:center;margin-bottom:12px\" id=\"billCalTotal\">-</div>\n    <div class=\"billcal-dow\"><span>M</span><span>S</span><span>S</span><span>R</span><span>K</span><span>J</span><span>S</span></div>\n    <div class=\"billcal-grid\" id=\"billCalGrid\"></div>\n    <div style=\"margin-top:16px\" id=\"billCalDayList\"></div>\n  </div>\n</div>", "<div class=\"overlay\" id=\"billHistoryModal\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"billHistoryModal-title\">\n  <div class=\"modal\">\n    <div class=\"modal-handle\"></div>\n    <div class=\"modal-title\" id=\"billHistoryModal-title\"><span>📋 Riwayat Pembayaran</span><button class=\"modal-close\" data-action=\"closeModal\" data-args='[\"billHistoryModal\"]' aria-label=\"Tutup\">✕</button></div>\n    <div style=\"font-size:12px;color:var(--text2);margin-bottom:12px\" id=\"billHistorySub\">-</div>\n    <div style=\"margin-bottom:12px;background:var(--accent-soft);border:1px solid rgba(124,111,239,0.25);border-radius:10px;padding:10px 12px\">\n      <span style=\"font-size:12px;color:var(--accent);cursor:pointer;font-weight:600;line-height:1.5\" data-action=\"Bill.openLinkTxModal\">🔗 Ada pembayaran lama yang sudah tercatat di Keuangan tapi belum masuk riwayat ini? Hubungkan di sini →</span>\n    </div>\n    <div id=\"billHistoryList\"></div>\n  </div>\n</div>", "<div class=\"overlay\" id=\"billHistoryEditModal\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"billHistoryEditModal-title\">\n  <div class=\"modal\">\n    <div class=\"modal-handle\"></div>\n    <div class=\"modal-title\" id=\"billHistoryEditModal-title\"><span>✏️ Edit Pembayaran</span><button class=\"modal-close\" data-action=\"closeModal\" data-args='[\"billHistoryEditModal\"]' aria-label=\"Tutup\">✕</button></div>\n    <div class=\"fg\"><label class=\"fl\">Tanggal Bayar</label><input type=\"date\" class=\"fi\" id=\"bhTanggal\"></div>\n    <div class=\"fg\"><label class=\"fl\">Jumlah (Rp)</label><input type=\"number\" class=\"fi\" id=\"bhJumlah\" inputmode=\"numeric\" min=\"1\" step=\"1\"></div>\n    <div class=\"fg\"><label class=\"fl\">Catatan</label><input type=\"text\" class=\"fi\" id=\"bhCatatan\" placeholder=\"Catatan tambahan...\"></div>\n    <button class=\"btn btn-primary btn-full\" style=\"padding:14px;margin-bottom:8px\" data-action=\"saveBillHistoryEdit\">Simpan Perubahan</button>\n    <button class=\"btn btn-ghost btn-full btn-sm\" style=\"color:var(--accent2)\" data-action=\"deleteBillHistoryTx\" aria-label=\"Hapus\">🗑 Hapus Pembayaran Ini</button>\n  </div>\n</div>", "<div class=\"overlay\" id=\"billArchiveModal\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"billArchiveModal-title\">\n  <div class=\"modal\">\n    <div class=\"modal-handle\"></div>\n    <div class=\"modal-title\" id=\"billArchiveModal-title\"><span>✅ Cicilan/Tagihan Lunas</span><button class=\"modal-close\" data-action=\"closeModal\" data-args='[\"billArchiveModal\"]' aria-label=\"Tutup\">✕</button></div>\n    <div style=\"font-size:12px;color:var(--text2);margin-bottom:12px\">Tap 📋 untuk lihat riwayat pembayarannya, termasuk cicilan yang sudah dibayar bulan-bulan sebelumnya.</div>\n    <div id=\"billArchiveList\"></div>\n  </div>\n</div>", "<div class=\"overlay\" id=\"vehicleModal\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"vehicleModal-title\">\n  <div class=\"modal\">\n    <div class=\"modal-handle\"></div>\n    <div class=\"modal-title\" id=\"vehicleModal-title\"><span>Kelola Kendaraan</span><button class=\"modal-close\" data-action=\"closeModal\" data-args='[\"vehicleModal\"]' aria-label=\"Tutup\">✕</button></div>\n    <div id=\"vehicleManageList\" style=\"margin-bottom:14px\"></div>\n    <div class=\"div\"></div>\n    <div class=\"fg\"><label class=\"fl\">Nama Kendaraan Baru</label><input type=\"text\" class=\"fi\" id=\"vehName\" placeholder=\"Vario 125, Vario 110...\"></div>\n    <div class=\"fg\"><label class=\"fl\">Emoji</label><input type=\"text\" class=\"fi\" id=\"vehEmoji\" placeholder=\"🏍️\" maxlength=\"2\"></div>\n    <div class=\"fg\"><label class=\"fl\">Interval Servis (KM)</label><input type=\"number\" class=\"fi\" id=\"vehInterval\" placeholder=\"3000\" inputmode=\"numeric\"></div>\n    <div class=\"fg\"><label class=\"fl\">KM Awal (opsional)</label><input type=\"number\" class=\"fi\" id=\"vehKmAwal\" placeholder=\"Kosongkan kalau belum tahu, isi nanti juga bisa\" inputmode=\"numeric\"></div>\n    <button class=\"btn btn-primary btn-full u-p14\" data-action=\"saveVehicle\">+ Tambah Kendaraan</button>\n  </div>\n</div>", "<div class=\"overlay\" id=\"vehTaxModal\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"vehTaxModal-title\">\n  <div class=\"modal\">\n    <div class=\"modal-handle\"></div>\n    <div class=\"modal-title\" id=\"vehTaxModal-title\"><span>Pajak &amp; Uji Kelayakan — <span id=\"vehTaxVehName\"></span></span><button class=\"modal-close\" data-action=\"closeModal\" data-args='[\"vehTaxModal\"]' aria-label=\"Tutup\">✕</button></div>\n    <div class=\"u-hint10\">Isi tanggal jatuh tempo &amp; estimasi biaya. Tombol \"✅ Bayar\" nanti otomatis mencatat pengeluaran di Keuangan &amp; menjadwalkan ulang tanggalnya.</div>\n    <button class=\"btn btn-ghost btn-full btn-sm u-mb10\" data-action=\"scanTanggalDariFoto\" data-args='[\"vehTaxTahunan\"]'>📷 Scan Tanggal Pajak (Foto STNK)</button>\n\n    <div style=\"font-size:12px;font-weight:700;margin-bottom:6px\">🧾 STNK Tahunan</div>\n    <div class=\"fg\"><label class=\"fl\">Jatuh Tempo</label><input type=\"date\" class=\"fi\" id=\"vehTaxTahunan\"></div>\n    <div class=\"fg u-mb8\"><label class=\"fl\">Estimasi Biaya</label><input type=\"text\" inputmode=\"numeric\" class=\"fi\" id=\"vehBiayaTahunan\" placeholder=\"0\"></div>\n    <button class=\"btn btn-ghost btn-full btn-sm\" style=\"margin-bottom:4px\" data-action=\"ikatVehTaxTagihan\" data-args='[\"tahunan\"]'>🔔 Ikat ke Tagihan</button>\n    <div id=\"vehTaxLinkStatus_tahunan\" style=\"font-size:11px;color:var(--text2);margin-bottom:14px;line-height:1.5\"></div>\n\n    <div style=\"font-size:12px;font-weight:700;margin-bottom:6px\">🔄 Ganti Plat (5 Tahunan)</div>\n    <div class=\"fg\"><label class=\"fl\">Jatuh Tempo</label><input type=\"date\" class=\"fi\" id=\"vehTaxLimaTahun\"></div>\n    <div class=\"fg u-mb8\"><label class=\"fl\">Estimasi Biaya</label><input type=\"text\" inputmode=\"numeric\" class=\"fi\" id=\"vehBiayaLimaTahun\" placeholder=\"0\"></div>\n    <button class=\"btn btn-ghost btn-full btn-sm\" style=\"margin-bottom:4px\" data-action=\"ikatVehTaxTagihan\" data-args='[\"limaTahun\"]'>🔔 Ikat ke Tagihan</button>\n    <div id=\"vehTaxLinkStatus_limaTahun\" style=\"font-size:11px;color:var(--text2);margin-bottom:14px;line-height:1.5\"></div>\n\n    <div style=\"font-size:12px;font-weight:700;margin-bottom:6px\">🚗 Uji Kelayakan (6 Bulan Sekali)</div>\n    <div class=\"fg\"><label class=\"fl\">Jatuh Tempo Uji Berikutnya</label><input type=\"date\" class=\"fi\" id=\"vehTaxUji\"></div>\n    <div class=\"fg u-mb8\"><label class=\"fl\">Estimasi Biaya</label><input type=\"text\" inputmode=\"numeric\" class=\"fi\" id=\"vehBiayaUji\" placeholder=\"0\"></div>\n    <button class=\"btn btn-ghost btn-full btn-sm\" style=\"margin-bottom:4px\" data-action=\"ikatVehTaxTagihan\" data-args='[\"uji\"]'>🔔 Ikat ke Tagihan</button>\n    <div id=\"vehTaxLinkStatus_uji\" style=\"font-size:11px;color:var(--text2);margin-bottom:14px;line-height:1.5\"></div>\n\n    <button class=\"btn btn-primary btn-full u-p14\" data-action=\"saveVehTax\">Simpan</button>\n  </div>\n</div>", "<div class=\"overlay\" id=\"simModal\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"simModal-title\">\n  <div class=\"modal\">\n    <div class=\"modal-handle\"></div>\n    <div class=\"modal-title\" id=\"simModal-title\"><span id=\"simModalTitle\">Tambah SIM</span><button class=\"modal-close\" data-action=\"closeModal\" data-args='[\"simModal\"]' aria-label=\"Tutup\">✕</button></div>\n    <div class=\"fg\"><label class=\"fl\">Nama Pemilik</label><input type=\"text\" class=\"fi\" id=\"simNama\" placeholder=\"Nama\"></div>\n    <div class=\"fg\"><label class=\"fl\">Jenis SIM</label>\n      <select class=\"fs\" id=\"simJenis\">\n        <option value=\"SIM A\">SIM A (Mobil)</option>\n        <option value=\"SIM B1\">SIM B1 (Mobil Besar)</option>\n        <option value=\"SIM B2\">SIM B2 (Kendaraan Berat)</option>\n        <option value=\"SIM C\">SIM C (Motor ≤250cc)</option>\n        <option value=\"SIM C1\">SIM C1 (Motor 250–500cc)</option>\n        <option value=\"SIM C2\">SIM C2 (Motor &gt;500cc)</option>\n        <option value=\"SIM D\">SIM D (Disabilitas)</option>\n      </select>\n    </div>\n    <div class=\"fg\"><label class=\"fl\">Berlaku Sampai</label><input type=\"date\" class=\"fi\" id=\"simTglAkhir\"></div>\n    <div class=\"fg u-mb10\"><label class=\"fl\">Estimasi Biaya Perpanjangan (opsional)</label><input type=\"text\" inputmode=\"numeric\" class=\"fi\" id=\"simBiaya\" placeholder=\"0\"></div>\n    <button class=\"btn btn-primary btn-full\" style=\"padding:14px;margin-bottom:8px\" data-action=\"saveSim\">Simpan</button>\n    <button class=\"btn btn-ghost btn-full btn-sm\" style=\"margin-bottom:4px\" data-action=\"ikatSimTagihan\">🔔 Ikat ke Tagihan</button>\n    <div id=\"simLinkStatus\" style=\"font-size:11px;color:var(--text2);line-height:1.5\"></div>\n  </div>\n</div>", "<div class=\"overlay\" id=\"worthItModal\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"worthItModal-title\">\n  <div class=\"modal\">\n    <div class=\"modal-handle swipeable\"></div>\n    <div class=\"modal-title\" id=\"worthItModal-title\"><span>🧮 Worth It?</span><button class=\"modal-close\" data-action=\"closeModal\" data-args='[\"worthItModal\"]' aria-label=\"Tutup\">✕</button></div>\n\n    <div style=\"display:flex;gap:8px;margin-bottom:12px\">\n      <button class=\"chip-btn active u-flex1\" id=\"wiTabBtnSingle\" data-action=\"WorthIt.switchTab\" data-args='[\"single\"]'>🔍 Cek 1 Barang</button>\n      <button class=\"chip-btn u-flex1\" id=\"wiTabBtnList\" data-action=\"WorthIt.switchTab\" data-args='[\"list\"]'>📋 Prioritas Belanja</button>\n    </div>\n\n    <div id=\"wiTabSingle\">\n    <div class=\"u-hint12\">Cek kondisi keuanganmu dulu sebelum belanja — dibandingkan dengan dana darurat, cicilan aktif, & saldo sekarang.</div>\n\n    <button type=\"button\" class=\"btn btn-ghost btn-full btn-sm u-mb10\" data-action=\"scanWorthItCheckout\" data-args='[\"single\"]'>📷 Scan Screenshot Checkout</button>\n    <div class=\"fg u-mb8\"><label class=\"fl\">Nama Barang</label><input type=\"text\" class=\"fi\" id=\"wiName\" placeholder=\"HP baru, kulkas, dll...\"></div>\n    <div class=\"fg u-mb8\"><label class=\"fl\">Harga (yang akan dibayar)</label><input type=\"text\" inputmode=\"numeric\" class=\"fi\" id=\"wiPrice\" placeholder=\"0\" oninput=\"WorthIt.syncDiskon()\"></div>\n\n    <div style=\"display:flex;align-items:center;gap:8px;margin-bottom:8px;cursor:pointer\" data-onclick=\"document.getElementById('wiIsDiskon').click()\">\n      <input type=\"checkbox\" id=\"wiIsDiskon\" onchange=\"WorthIt.toggleDiskon()\" style=\"width:16px;height:16px;accent-color:var(--accent)\">\n      <span style=\"font-size:12px;color:var(--text)\">🏷️ Lagi ada diskon? Bandingkan sama harga normal</span>\n    </div>\n    <div id=\"wiDiskonFields\" class=\"u-dnone\">\n      <div class=\"fg u-mb8\"><label class=\"fl\">Harga Normal (sebelum diskon)</label><input type=\"text\" inputmode=\"numeric\" class=\"fi\" id=\"wiHargaNormal\" placeholder=\"0\" oninput=\"WorthIt.syncDiskon()\"></div>\n      <div id=\"wiDiskonInfo\" style=\"font-size:12px;color:var(--text2);margin-bottom:8px;line-height:1.5\"></div>\n    </div>\n\n    <div class=\"fg u-mb8\"><label class=\"fl\">Kategori</label>\n      <select class=\"fs\" id=\"wiCategory\">\n        <option value=\"kebutuhan\">🛠️ Kebutuhan</option>\n        <option value=\"keinginan\" selected>✨ Keinginan</option>\n      </select>\n    </div>\n    <div class=\"fg u-mb8\"><label class=\"fl\">Metode Bayar</label>\n      <select class=\"fs\" id=\"wiMethod\" onchange=\"WorthIt.onMethodChange()\">\n        <option value=\"tunai\">💵 Tunai</option>\n        <option value=\"cicilan\">💳 Cicilan</option>\n      </select>\n    </div>\n    <div id=\"wiCicilanFields\" class=\"u-dnone\">\n      <div style=\"display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px\">\n        <div><label class=\"fl\">DP (opsional)</label><input type=\"text\" inputmode=\"numeric\" class=\"fi\" id=\"wiDP\" placeholder=\"0\"></div>\n        <div><label class=\"fl\">Tenor (bulan)</label><input type=\"number\" class=\"fi\" id=\"wiTenor\" placeholder=\"12\"></div>\n      </div>\n      <div class=\"fg u-mb8\"><label class=\"fl\">Cicilan / Bulan</label><input type=\"text\" inputmode=\"numeric\" class=\"fi\" id=\"wiCicilanBulan\" placeholder=\"0\"></div>\n    </div>\n\n    <button class=\"btn btn-primary btn-full\" style=\"padding:14px;margin-bottom:12px\" data-action=\"WorthIt.hitung\">🔍 Cek Sekarang</button>\n\n    <div id=\"wiResultBox\" class=\"u-dnone\">\n      <div style=\"height:1px;background:var(--border);margin-bottom:12px\"></div>\n      <div id=\"wiVerdictBox\" style=\"text-align:center;border-radius:12px;padding:14px;margin-bottom:12px\">\n        <div id=\"wiVerdict\" style=\"font-size:17px;font-weight:800\">-</div>\n      </div>\n      <div id=\"wiIssueList\" style=\"margin-bottom:14px\"></div>\n      <button class=\"btn btn-expense btn-full u-mb8\" data-action=\"WorthIt.catatBeli\">✅ Lanjut, Catat Belanja Ini</button>\n      <button class=\"btn btn-ghost btn-full u-mb8\" data-action=\"WorthIt.simpanDulu\">💾 Simpan Dulu (belum tentu beli)</button>\n      <button class=\"btn btn-ghost btn-full btn-sm\" data-action=\"WorthIt.reset\">↺ Cek Barang Lain</button>\n    </div>\n    </div>\n\n    <div id=\"wiTabList\" class=\"u-dnone\">\n      <div class=\"u-hint12\">Punya beberapa barang yang mau dibeli sekaligus (sparepart, aksesoris, baju, dll)? Masukin semua ke sini, sistem bantu urutin mana yang paling prioritas — dari kebutuhan, urgensi, sampai gede-kecilnya diskon.</div>\n\n      <button type=\"button\" class=\"btn btn-ghost btn-full btn-sm u-mb10\" data-action=\"scanWorthItCheckout\" data-args='[\"list\"]'>📷 Scan Screenshot Checkout</button>\n      <div class=\"fg u-mb8\"><label class=\"fl\">Nama Barang</label><input type=\"text\" class=\"fi\" id=\"wlName\" placeholder=\"Kampas rem, baju kerja, dll...\"></div>\n      <div class=\"fg u-mb8\"><label class=\"fl\">Harga (yang akan dibayar)</label><input type=\"text\" inputmode=\"numeric\" class=\"fi\" id=\"wlPrice\" placeholder=\"0\" oninput=\"WorthIt.syncDiskonList()\"></div>\n\n      <div style=\"display:flex;align-items:center;gap:8px;margin-bottom:8px;cursor:pointer\" data-onclick=\"document.getElementById('wlIsDiskon').click()\">\n        <input type=\"checkbox\" id=\"wlIsDiskon\" onchange=\"WorthIt.toggleDiskonList()\" style=\"width:16px;height:16px;accent-color:var(--accent)\">\n        <span style=\"font-size:12px;color:var(--text)\">🏷️ Lagi ada diskon? Bandingkan sama harga normal</span>\n      </div>\n      <div id=\"wlDiskonFields\" class=\"u-dnone\">\n        <div class=\"fg u-mb8\"><label class=\"fl\">Harga Normal (sebelum diskon)</label><input type=\"text\" inputmode=\"numeric\" class=\"fi\" id=\"wlHargaNormal\" placeholder=\"0\" oninput=\"WorthIt.syncDiskonList()\"></div>\n        <div id=\"wlDiskonInfo\" style=\"font-size:12px;color:var(--text2);margin-bottom:8px;line-height:1.5\"></div>\n      </div>\n\n      <div class=\"fg u-mb8\"><label class=\"fl\">Kategori</label>\n        <select class=\"fs\" id=\"wlCategory\">\n          <option value=\"kebutuhan\">🛠️ Kebutuhan</option>\n          <option value=\"keinginan\" selected>✨ Keinginan</option>\n        </select>\n      </div>\n      <div class=\"fg u-mb10\"><label class=\"fl\">Seberapa Mendesak?</label>\n        <select class=\"fs\" id=\"wlUrgensi\">\n          <option value=\"mendesak\">🔥 Mendesak (rusak/habis/dibutuhkan segera)</option>\n          <option value=\"bisa_nunggu\" selected>⏳ Bisa Nunggu</option>\n          <option value=\"nice_to_have\">💭 Nice to Have (belum perlu-perlu amat)</option>\n        </select>\n      </div>\n      <div style=\"margin-bottom:10px;background:var(--surface2);border-radius:10px;padding:10px 12px\">\n        <div style=\"display:flex;align-items:flex-start;gap:8px;cursor:pointer\" data-onclick=\"document.getElementById('wlSudahPunya').click()\">\n          <input type=\"checkbox\" id=\"wlSudahPunya\" onchange=\"WorthIt.toggleSudahPunya()\" style=\"width:16px;height:16px;accent-color:var(--accent);margin-top:1px;flex-shrink:0\">\n          <span style=\"font-size:12px;color:var(--text)\">📦 Barang lama masih ada &amp; masih bisa dipakai — ini cuma mau ganti karena yang baru lebih murah/diskon</span>\n        </div>\n        <div id=\"wlSudahPunyaAlasanBox\" style=\"display:none;margin-top:8px\">\n          <input type=\"text\" class=\"fi\" id=\"wlSudahPunyaAlasan\" placeholder=\"Alasan versi kamu (opsional) — kosongin juga gak papa, dipakai catatan bawaan\">\n        </div>\n      </div>\n      <button class=\"btn btn-primary btn-full\" style=\"padding:14px;margin-bottom:8px\" id=\"wlSubmitBtn\" data-action=\"WorthIt.addToList\">+ Tambah ke List</button>\n      <button class=\"btn btn-ghost btn-full btn-sm\" id=\"wlCancelEditBtn\" style=\"display:none;margin-bottom:14px\" data-action=\"WorthIt.cancelEditList\">✕ Batal Edit</button>\n\n      <div style=\"height:1px;background:var(--border);margin-bottom:12px\"></div>\n      <div style=\"margin-bottom:12px;background:var(--accent-soft);border:1px solid rgba(124,111,239,0.25);border-radius:10px;padding:10px 12px\">\n        <span style=\"font-size:12px;color:var(--accent);cursor:pointer;font-weight:600;line-height:1.5\" data-action=\"WorthIt.openLinkTxModal\">🔗 Barang ini sudah kebeli & tercatat di Keuangan (misal sebelum fitur ini dibuat)? Hubungkan di sini →</span>\n      </div>\n      <button class=\"btn btn-ghost btn-full btn-sm u-mb12\" id=\"wlBoughtToggleBtn\" data-action=\"WorthIt.toggleBoughtView\">✅ Lihat Sudah Dibeli</button>\n\n      <div id=\"wlActiveSection\">\n        <div class=\"card-title\"><span>📊 Urutan Prioritas</span><span id=\"wlCount\" style=\"text-transform:none;letter-spacing:0\"></span></div>\n        <div id=\"wlTotalSummary\" class=\"u-hint10\"></div>\n        <div id=\"wlItems\"></div>\n      </div>\n\n      <div id=\"wlBoughtSection\" class=\"u-dnone\">\n        <div class=\"card-title\"><span>✅ Sudah Dibeli</span><span id=\"wlBoughtCount\" style=\"text-transform:none;letter-spacing:0\"></span></div>\n        <div class=\"u-hint10\">Riwayat barang yang sudah ditandai dibeli. Salah tap atau berubah pikiran? Tap ↺ buat kembalikan ke daftar aktif (transaksi yang sudah tercatat di Keuangan tidak ikut terhapus otomatis).</div>\n        <div id=\"wlBoughtItems\"></div>\n      </div>\n    </div>\n  </div>\n</div>", "<div class=\"overlay\" id=\"kmModal\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"kmModal-title\">\n  <div class=\"modal\">\n    <div class=\"modal-handle\"></div>\n    <div class=\"modal-title\" id=\"kmModal-title\"><span>Update Kilometer</span><button class=\"modal-close\" data-action=\"closeModal\" data-args='[\"kmModal\"]' aria-label=\"Tutup\">✕</button></div>\n    <button class=\"btn btn-ghost btn-full btn-sm u-mb10\" data-action=\"scanKmOdometer\">📷 Scan Foto Odometer</button>\n    <div class=\"fg\"><label class=\"fl\">Kendaraan</label>\n      <select class=\"fs\" id=\"kmVehicle\" onchange=\"onKmVehicleChange()\"></select>\n    </div>\n    <div class=\"fg\"><label class=\"fl\">Tanggal</label><input type=\"date\" class=\"fi\" id=\"kmDate\"></div>\n    <div class=\"fg\"><label class=\"fl\">Odometer / KM Saat Ini</label><input type=\"number\" class=\"fi\" id=\"kmVal\" placeholder=\"12500\" inputmode=\"numeric\"></div>\n    <div class=\"fg\"><label class=\"fl\">Catatan (opsional)</label><input type=\"text\" class=\"fi\" id=\"kmNote\" placeholder=\"Cek rutin, dll\"></div>\n    <button class=\"btn btn-primary btn-full u-p14\" data-action=\"saveKm\">Simpan</button>\n  </div>\n</div>", "<div class=\"overlay\" id=\"sparepartModal\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"sparepartModal-title\">\n  <div class=\"modal\">\n    <div class=\"modal-handle\"></div>\n    <div class=\"modal-title\" id=\"sparepartModal-title\"><span id=\"sparepartModalTitle\">Tambah Kategori Sparepart</span><button class=\"modal-close\" data-action=\"closeModal\" data-args='[\"sparepartModal\"]' aria-label=\"Tutup\">✕</button></div>\n    <div class=\"fg u-rel\"><label class=\"fl\">Nama Part/Servis</label><input type=\"text\" class=\"fi\" id=\"sparepartName\" placeholder=\"Oli Mesin, Kampas Rem, dll\" autocomplete=\"off\" oninput=\"autoFillSparepartCode();simpleAutocompleteInput('sparepartName','sparepartNameBox',acSparepartCatNames)\" onfocus=\"simpleAutocompleteInput('sparepartName','sparepartNameBox',acSparepartCatNames)\" onblur=\"setTimeout(()=>hideSuggestBox('sparepartNameBox'),150)\">\n      <div id=\"sparepartNameBox\" class=\"suggest-box\"></div>\n    </div>\n    <div class=\"fg u-rel\"><label class=\"fl\">Kode Kategori</label><input type=\"text\" class=\"fi\" id=\"sparepartCode\" placeholder=\"Otomatis, bisa diedit\" style=\"text-transform:uppercase\" autocomplete=\"off\" oninput=\"simpleAutocompleteInput('sparepartCode','sparepartCodeBox',acSparepartCatCodes)\" onfocus=\"simpleAutocompleteInput('sparepartCode','sparepartCodeBox',acSparepartCatCodes)\" onblur=\"setTimeout(()=>hideSuggestBox('sparepartCodeBox'),150)\">\n      <div id=\"sparepartCodeBox\" class=\"suggest-box\"></div>\n    </div>\n    <div class=\"fg\"><label class=\"fl\">Rekomendasi Interval Servis (KM)</label><input type=\"number\" class=\"fi\" id=\"sparepartInterval\" placeholder=\"2000\" inputmode=\"numeric\"></div>\n    <button class=\"btn btn-primary btn-full u-p14\" data-action=\"saveSparepart\">Simpan</button>\n    <button class=\"btn btn-danger btn-full\" id=\"sparepartDelBtn\" style=\"display:none;padding:14px;margin-top:8px\" data-action=\"Sparepart.deleteFromModal\" aria-label=\"Hapus\">🗑 Hapus Kategori Sparepart</button>\n  </div>\n</div>", "<div class=\"overlay\" id=\"stockModal\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"stockModal-title\">\n  <div class=\"modal\">\n    <div class=\"modal-handle\"></div>\n    <div class=\"modal-title\" id=\"stockModal-title\"><span id=\"stockModalTitle\">Tambah Stok Sparepart</span><button class=\"modal-close\" data-action=\"closeModal\" data-args='[\"stockModal\"]' aria-label=\"Tutup\">✕</button></div>\n    <div class=\"fg\"><label class=\"fl\">Kategori</label><select class=\"fs\" id=\"stockCatId\" onchange=\"autoFillStockCode()\"></select></div>\n    <div class=\"fg u-rel\"><label class=\"fl\">Nama Sparepart</label><input type=\"text\" class=\"fi\" id=\"stockName\" placeholder=\"Oli Mesin Yamalube 1L, dll\" autocomplete=\"off\" oninput=\"autoFillStockCode();simpleAutocompleteInput('stockName','stockNameBox',acStockNames)\" onfocus=\"simpleAutocompleteInput('stockName','stockNameBox',acStockNames)\" onblur=\"setTimeout(()=>hideSuggestBox('stockNameBox'),150)\">\n      <div id=\"stockNameBox\" class=\"suggest-box\"></div>\n    </div>\n    <div class=\"fg u-rel\"><label class=\"fl\">Kode Sparepart</label><input type=\"text\" class=\"fi\" id=\"stockCode\" placeholder=\"Otomatis, bisa diedit\" style=\"text-transform:uppercase\" autocomplete=\"off\" oninput=\"simpleAutocompleteInput('stockCode','stockCodeBox',acStockCodes)\" onfocus=\"simpleAutocompleteInput('stockCode','stockCodeBox',acStockCodes)\" onblur=\"setTimeout(()=>hideSuggestBox('stockCodeBox'),150)\">\n      <div id=\"stockCodeBox\" class=\"suggest-box\"></div>\n    </div>\n    <div class=\"u-grid2\">\n      <div class=\"fg\"><label class=\"fl\">Jumlah Stok</label><input type=\"number\" class=\"fi\" id=\"stockQty\" placeholder=\"0\" inputmode=\"numeric\"></div>\n      <div class=\"fg\"><label class=\"fl\">Satuan</label><input type=\"text\" class=\"fi\" id=\"stockUnit\" placeholder=\"pcs, liter, set, dll\"></div>\n    </div>\n    <div class=\"u-grid2\">\n      <div class=\"fg\"><label class=\"fl\">Stok Minimum</label><input type=\"number\" class=\"fi\" id=\"stockMin\" placeholder=\"1\" inputmode=\"numeric\"></div>\n      <div class=\"fg\"><label class=\"fl\">Harga Satuan (Rp)</label><input type=\"number\" class=\"fi\" id=\"stockPrice\" placeholder=\"0\" inputmode=\"numeric\"></div>\n    </div>\n    <div class=\"fg u-mb0\"><label class=\"fl\">Catatan</label><input type=\"text\" class=\"fi\" id=\"stockNote\" placeholder=\"Lokasi simpan, supplier, dll\"></div>\n    <button class=\"btn btn-primary btn-full u-p14\" data-action=\"saveStock\">Simpan</button>\n  </div>\n</div>", "<div class=\"overlay\" id=\"backupModal\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"backupModal-title\">\n  <div class=\"modal\">\n    <div class=\"modal-handle\"></div>\n    <div class=\"modal-title\" id=\"backupModal-title\"><span>Backup Data</span><button class=\"modal-close\" data-action=\"closeModal\" data-args='[\"backupModal\"]' aria-label=\"Tutup\">✕</button></div>\n\n    <div class=\"fg\"><label class=\"fl\">Modul yang Dibackup</label>\n      <div class=\"filter-scroll u-mb0\">\n        <button class=\"chip-btn active\" id=\"bModKeuangan\" data-action=\"toggleBackupModule\" data-args='[\"keuangan\", \"$el\"]'>💰 Keuangan</button>\n        <button class=\"chip-btn active\" id=\"bModCarnotes\" data-action=\"toggleBackupModule\" data-args='[\"carnotes\", \"$el\"]'>🏍️ Car Notes</button>\n        <button class=\"chip-btn active\" id=\"bModShop\" data-action=\"toggleBackupModule\" data-args='[\"shop\", \"$el\"]'>🪨 Shop</button>\n        <button class=\"chip-btn active\" id=\"bModAset\" data-action=\"toggleBackupModule\" data-args='[\"aset\", \"$el\"]'>🏦 Aset, Utang &amp; Piutang</button>\n        <button class=\"chip-btn active\" id=\"bModRenov\" data-action=\"toggleBackupModule\" data-args='[\"renov\", \"$el\"]'>🔨 Proyek Renovasi</button>\n        <button class=\"chip-btn active\" id=\"bModPensiunZakat\" data-action=\"toggleBackupModule\" data-args='[\"pensiunZakat\", \"$el\"]'>🏖️ Pensiun, FI &amp; Zakat/Pajak</button>\n        <button class=\"chip-btn active\" id=\"bModHabit\" data-action=\"toggleBackupModule\" data-args='[\"habit\", \"$el\"]'>✅ Belanja Prioritas &amp; Skor Hidup</button>\n        <button class=\"chip-btn active\" id=\"bModLain\" data-action=\"toggleBackupModule\" data-args='[\"lain\", \"$el\"]'>🗂️ Gaji &amp; Lainnya</button>\n      </div>\n      <div style=\"font-size:11px;color:var(--text2);margin-top:6px;line-height:1.5\">💡 Modul di atas mencakup SEMUA data aplikasi (termasuk fitur-fitur baru seperti Buku Aset, Proyek Renovasi, Dana Pensiun, Zakat/Pajak). Kalau ragu, biarkan semua tercentang &amp; pilih periode \"Selamanya\" supaya tidak ada data yang tertinggal.</div>\n    </div>\n\n    <div class=\"fg\"><label class=\"fl\">Periode</label>\n      <select class=\"fs\" id=\"bPeriode\" onchange=\"onBackupPeriodeChange()\">\n        <option value=\"hari\">Hari Ini</option>\n        <option value=\"bulan\">Bulan Ini</option>\n        <option value=\"tahun\">Tahun Ini</option>\n        <option value=\"selamanya\" selected>Selamanya (Semua Data)</option>\n        <option value=\"custom\">Custom Range</option>\n      </select>\n    </div>\n    <div id=\"bCustomRange\" style=\"display:none;margin-bottom:12px\">\n      <div class=\"u-grid2\">\n        <div><label class=\"fl\">Dari</label><input type=\"date\" class=\"fi\" id=\"bFrom\"></div>\n        <div><label class=\"fl\">Sampai</label><input type=\"date\" class=\"fi\" id=\"bTo\"></div>\n      </div>\n    </div>\n\n    <div class=\"fg\"><label class=\"fl\">Tipe Transaksi (khusus modul Keuangan)</label>\n      <select class=\"fs\" id=\"bTipe\">\n        <option value=\"semua\">Pemasukan & Pengeluaran</option>\n        <option value=\"income\">Pemasukan Saja</option>\n        <option value=\"expense\">Pengeluaran Saja</option>\n      </select>\n    </div>\n\n    <div class=\"fg\"><label class=\"fl\">Format File</label>\n      <select class=\"fs\" id=\"bFormat\">\n        <option value=\"json\">JSON (lengkap, untuk restore)</option>\n        <option value=\"csv\">CSV (untuk Excel/Google Sheets)</option>\n      </select>\n    </div>\n    <div class=\"u-hint12\">📊 Untuk Google Sheets: pilih format CSV, lalu buka Google Sheets → File → Import → Upload file CSV-nya. Aplikasi ini offline jadi tidak bisa langsung upload otomatis ke akun Google.</div>\n\n    <button class=\"btn btn-primary btn-full u-p14\" data-action=\"runBackup\">📤 Backup Sekarang</button>\n  </div>\n</div>", "<div class=\"overlay\" id=\"archiveModal\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"archiveModal-title\">\n  <div class=\"modal\">\n    <div class=\"modal-handle\"></div>\n    <div class=\"modal-title\" id=\"archiveModal-title\"><span>🗄️ Arsipkan Data Lama</span><button class=\"modal-close\" data-action=\"closeModal\" data-args='[\"archiveModal\"]' aria-label=\"Tutup\">✕</button></div>\n    <div class=\"u-hint12\">Pilih tahun yang mau diarsip. Sebelum dihapus dari HP, data tahun terpilih <b>wajib di-export dulu</b> jadi file JSON/CSV (download manual) — supaya tidak ada data yang hilang percuma. Berlaku untuk semua modul riwayat: Transaksi Keuangan, Shop, Log BBM, Log Servis, Catatan KM, dan Catatan Perjalanan (lama).</div>\n    <div class=\"fg\">\n      <label class=\"fl\">Pilih Tahun</label>\n      <div id=\"archiveYearList\" style=\"display:flex;flex-direction:column;gap:8px\"></div>\n      <div style=\"font-size:12px;color:var(--text3);margin-top:4px\" id=\"archiveEmptyHint\"></div>\n    </div>\n    <div class=\"fg\">\n      <label class=\"fl\">Format Export</label>\n      <select class=\"fs\" id=\"archiveFormat\">\n        <option value=\"json\">JSON (lengkap, bisa di-restore lagi)</option>\n        <option value=\"csv\">CSV (dibuka di Excel/Sheets)</option>\n      </select>\n    </div>\n    <div id=\"archivePreview\" class=\"u-hint12\"></div>\n    <div id=\"archiveStep1\">\n      <button class=\"btn btn-primary btn-full u-p14\" data-action=\"archiveExportStep\">📤 1. Export Dulu (Wajib)</button>\n    </div>\n    <div id=\"archiveStep2\" style=\"display:none;margin-top:8px\">\n      <div style=\"font-size:12px;color:var(--accent4);margin-bottom:10px;font-weight:600;line-height:1.5\">✅ File sudah di-download. Pastikan file itu sudah benar-benar tersimpan di HP kamu sebelum lanjut hapus — proses hapus TIDAK BISA dibatalkan.</div>\n      <button class=\"btn btn-danger btn-full u-p14\" data-action=\"archiveDeleteStep\" aria-label=\"Hapus\">🗑️ 2. Hapus dari HP Sekarang</button>\n      <button class=\"btn btn-ghost btn-full btn-sm u-mt8\" data-action=\"closeModal\" data-args='[\"archiveModal\"]'>Batal, Belum Yakin</button>\n    </div>\n  </div>\n</div>", "<div class=\"overlay\" id=\"bbmModal\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"bbmModal-title\">\n  <div class=\"modal\">\n    <div class=\"modal-handle\"></div>\n    <div class=\"modal-title\" id=\"bbmModal-title\"><span id=\"bbmModalTitle\">Catat Isi BBM</span><button class=\"modal-close\" data-action=\"closeModal\" data-args='[\"bbmModal\"]' aria-label=\"Tutup\">✕</button></div>\n    <button class=\"btn btn-ghost btn-full btn-sm u-mb10\" data-action=\"scanReceipt\" data-args='[\"bbmCost\", \"bbmDate\", \"bbmNote\"]'>📷 Scan Struk SPBU</button>\n    <div class=\"fg\"><label class=\"fl\">Tanggal</label><input type=\"date\" class=\"fi\" id=\"bbmDate\"></div>\n    <div class=\"fg\"><label class=\"fl\">Odometer / KM Saat Ini</label><input type=\"number\" class=\"fi\" id=\"bbmKm\" placeholder=\"12500\" inputmode=\"numeric\"></div>\n    <div class=\"fg\"><label class=\"fl\">Volume BBM (Liter)</label><input type=\"number\" step=\"0.01\" class=\"fi\" id=\"bbmLiter\" placeholder=\"3.5\" inputmode=\"decimal\" oninput=\"syncBbmCost()\"></div>\n    <div class=\"fg\"><label class=\"fl\">Harga per Liter (Rp)</label><input type=\"number\" class=\"fi\" id=\"bbmHarga\" placeholder=\"10000\" inputmode=\"numeric\" oninput=\"syncBbmHargaChanged()\"></div>\n    <div class=\"fg\"><label class=\"fl\">Total Biaya (Rp)</label><input type=\"number\" class=\"fi\" id=\"bbmCost\" placeholder=\"35000\" inputmode=\"numeric\" oninput=\"syncBbmLiterFromCost();updateAmtPreview('bbmCost','bbmCostPreview')\"><div id=\"bbmCostPreview\" style=\"font-size:12px;color:var(--text3);margin-top:4px\"></div></div>\n    <div class=\"fg u-rel\"><label class=\"fl\">SPBU</label><input type=\"text\" class=\"fi\" id=\"bbmSpbu\" placeholder=\"Pertamina Borobudur, dll\" autocomplete=\"off\" oninput=\"simpleAutocompleteInput('bbmSpbu','bbmSpbuBox',acSpbuNames)\" onfocus=\"simpleAutocompleteInput('bbmSpbu','bbmSpbuBox',acSpbuNames)\" onblur=\"setTimeout(()=>hideSuggestBox('bbmSpbuBox'),150)\">\n      <div id=\"bbmSpbuBox\" class=\"suggest-box\"></div>\n    </div>\n    <div class=\"fg u-flexc8\"><input type=\"checkbox\" id=\"bbmFull\" checked style=\"width:18px;height:18px\"><label class=\"fl\" style=\"margin:0\" for=\"bbmFull\">Isi Penuh (Full Tank)</label></div>\n    <div class=\"fg\"><label class=\"fl\">Catatan</label><input type=\"text\" class=\"fi\" id=\"bbmNote\" placeholder=\"Isi penuh / setengah...\"></div>\n    <div class=\"fg\"><label class=\"fl\">Bayar dari Akun</label><select class=\"fs\" id=\"bbmAcc\"></select></div>\n    <button class=\"btn btn-primary btn-full\" style=\"padding:14px;margin-bottom:8px\" data-action=\"saveBbm\">Simpan</button>\n    <button class=\"btn btn-expense btn-full\" id=\"bbmDelBtn\" style=\"padding:12px;display:none\" data-action=\"deleteBbmFromModal\" aria-label=\"Hapus\">🗑 Hapus Catatan</button>\n  </div>\n</div>", "<div class=\"overlay\" id=\"servisModal\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"servisModal-title\">\n  <div class=\"modal\">\n    <div class=\"modal-handle\"></div>\n    <div class=\"modal-title\" id=\"servisModal-title\"><span id=\"servisModalTitle\">Catat Servis/Sparepart</span><button class=\"modal-close\" data-action=\"closeModal\" data-args='[\"servisModal\"]' aria-label=\"Tutup\">✕</button></div>\n    <button class=\"btn btn-ghost btn-full btn-sm u-mb10\" data-action=\"scanReceipt\" data-args='[\"servisCost\", \"servisDate\", \"servisNote\"]'>📷 Scan Nota Bengkel</button>\n    <div class=\"fg\"><label class=\"fl\">Tanggal</label><input type=\"date\" class=\"fi\" id=\"servisDate\"></div>\n    <div class=\"fg\"><label class=\"fl\">Jenis Servis/Item</label><input type=\"text\" class=\"fi\" id=\"servisItem\" list=\"sparepartDatalist\" placeholder=\"Ganti oli, CVT, ban, dll\" oninput=\"onServisItemAutofillInterval()\">\n      <datalist id=\"sparepartDatalist\"></datalist>\n    </div>\n    <div class=\"fg\"><label class=\"fl\">Odometer / KM</label><input type=\"number\" class=\"fi\" id=\"servisKm\" placeholder=\"12500\" inputmode=\"numeric\"></div>\n    <div class=\"fg\"><label class=\"fl\">Interval Servis Berikutnya (KM) <span style=\"font-weight:400;color:var(--text2);text-transform:none\">— opsional, sinkron ke Pengingat Servis</span></label><input type=\"number\" class=\"fi\" id=\"servisInterval\" placeholder=\"cth. 2000\" inputmode=\"numeric\" oninput=\"this.dataset.manual='1'\"></div>\n    <div class=\"fg\"><label class=\"fl\">Biaya (Rp)</label><input type=\"number\" class=\"fi\" id=\"servisCost\" placeholder=\"50000\" inputmode=\"numeric\" oninput=\"updateAmtPreview('servisCost','servisCostPreview')\"><div id=\"servisCostPreview\" style=\"font-size:12px;color:var(--text3);margin-top:4px\"></div></div>\n    <div class=\"fg\"><label class=\"fl\">Catatan</label><input type=\"text\" class=\"fi\" id=\"servisNote\" placeholder=\"Bengkel mana, keterangan...\"></div>\n    <div class=\"fg\"><label class=\"fl\">Bayar dari Akun</label><select class=\"fs\" id=\"servisAcc\"></select></div>\n    <div class=\"fg\"><label class=\"fl\">Gunakan Stok Sparepart (opsional)</label><select class=\"fs\" id=\"servisPartId\" onchange=\"onServisPartChange()\"><option value=\"\">Tidak pakai stok</option></select></div>\n    <div class=\"fg u-dnone\" id=\"servisPartQtyWrap\"><label class=\"fl\">Jumlah Terpakai</label><input type=\"number\" class=\"fi\" id=\"servisPartQty\" min=\"0\" step=\"any\" value=\"1\"></div>\n    <button class=\"btn btn-primary btn-full\" style=\"padding:14px;margin-bottom:8px\" data-action=\"saveServis\">Simpan</button>\n    <button class=\"btn btn-expense btn-full\" id=\"servisDelBtn\" style=\"padding:12px;display:none\" data-action=\"deleteServisFromModal\" aria-label=\"Hapus\">🗑 Hapus Catatan</button>\n  </div>\n</div>", "<div class=\"overlay\" id=\"torsiModal\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"torsiModal-title\">\n  <div class=\"modal\" style=\"max-width:480px\">\n    <div class=\"modal-handle\"></div>\n    <div class=\"modal-title\" id=\"torsiModal-title\"><span>🔩 Torsi Sparepart <span id=\"trsVehChip\" style=\"font-size:11px;font-weight:700;color:var(--accent);background:var(--accent-soft);border:1px solid var(--accent);border-radius:20px;padding:3px 10px;margin-left:6px\"></span></span><button class=\"modal-close\" data-action=\"closeModal\" data-args='[\"torsiModal\"]' aria-label=\"Tutup\">✕</button></div>\n\n    <div class=\"trs-calc-card\">\n      <div class=\"trs-calc-head\">\n        <div class=\"trs-calc-head-title\">🧮 Kalkulator Kunci Torsi</div>\n      </div>\n      <div class=\"trs-calc-mode-toggle\">\n        <div class=\"trs-calc-mode-btn active\" id=\"trsModeCatalog\" data-action=\"Torsi.setCalcMode\" data-args='[\"catalog\"]'>📖 Dari Katalog</div>\n        <div class=\"trs-calc-mode-btn\" id=\"trsModeManual\" data-action=\"Torsi.setCalcMode\" data-args='[\"manual\"]'>✍️ Input Manual</div>\n      </div>\n      <div id=\"trsManualInputWrap\" style=\"display:none;position:relative;z-index:1;margin-bottom:6px\">\n        <div class=\"fg u-mb8\">\n          <input class=\"fi\" id=\"trsManualTorsiInput\" type=\"number\" inputmode=\"decimal\" placeholder=\"Masukkan nilai torsi...\" oninput=\"Torsi.onManualInput()\">\n        </div>\n      </div>\n      <div class=\"trs-gauge-wrap\">\n        <div id=\"trsGaugePartName\" style=\"font-size:12px;color:var(--text2);font-weight:700;text-align:center\">Pilih sparepart di bawah ⤵️</div>\n        <div class=\"trs-gauge-val\" id=\"trsGaugeVal\">–</div>\n        <div class=\"trs-gauge-unit\">Newton-meter (N·m)</div>\n        <div class=\"trs-gauge-sub\" id=\"trsGaugeSub\"></div>\n        <div id=\"trsWrenchNote\" style=\"margin-top:10px;width:100%\"></div>\n      </div>\n      <div class=\"trs-unit-tabs\">\n        <div class=\"trs-unit-tab active\"><div class=\"trs-unit-tab-val\" id=\"trsVal-nm\">–</div><div class=\"trs-unit-tab-lbl\">N·m</div></div>\n        <div class=\"trs-unit-tab\"><div class=\"trs-unit-tab-val\" id=\"trsVal-kgf\">–</div><div class=\"trs-unit-tab-lbl\">kgf·m</div></div>\n        <div class=\"trs-unit-tab\"><div class=\"trs-unit-tab-val\" id=\"trsVal-lbft\">–</div><div class=\"trs-unit-tab-lbl\">lbf·ft</div></div>\n        <div class=\"trs-unit-tab\"><div class=\"trs-unit-tab-val\" id=\"trsVal-lbin\">–</div><div class=\"trs-unit-tab-lbl\">lbf·in</div></div>\n      </div>\n      <div class=\"trs-ext-toggle\" data-action=\"Torsi.toggleExt\">\n        <div class=\"trs-ext-toggle-label\">🔧 Pakai sambungan/ekstensi kunci?</div>\n        <span class=\"card-collapse-toggle collapsed\" id=\"trsExtChev\">▾</span>\n      </div>\n      <div class=\"card-collapse-body collapsed\" id=\"trsExtBody\">\n        <div style=\"position:relative;z-index:1\">\n          <div style=\"font-size:11px;color:var(--text2);line-height:1.6;margin-bottom:12px\">Kalau pakai batang ekstensi/sambungan, panjang efektif kunci bertambah — nilai yang di-set di skala kunci jadi lebih kecil dari torsi target sebenarnya.</div>\n          <div class=\"trs-ext-grid\">\n            <div class=\"fg u-mb0\"><label class=\"fl\">Panjang Kunci (L) mm</label><input class=\"fi\" id=\"trsExtL\" type=\"number\" inputmode=\"numeric\" placeholder=\"250\" oninput=\"Torsi.calcExt()\"></div>\n            <div class=\"fg u-mb0\"><label class=\"fl\">Tambahan Ekstensi (A) mm</label><input class=\"fi\" id=\"trsExtA\" type=\"number\" inputmode=\"numeric\" placeholder=\"100\" oninput=\"Torsi.calcExt()\"></div>\n          </div>\n          <div class=\"trs-ext-result u-dnone\" id=\"trsExtResult\">\n            <div style=\"font-size:11px;color:var(--accent);font-weight:700;text-transform:uppercase;letter-spacing:.5px\">Angka yang harus di-set di kunci</div>\n            <div style=\"font-family:'Space Grotesk',sans-serif;font-size:22px;font-weight:700;color:var(--text);margin-top:2px\" id=\"trsExtResultVal\">– N·m</div>\n            <div style=\"font-size:11px;color:var(--text2);margin-top:6px;line-height:1.5\" id=\"trsExtResultNote\"></div>\n          </div>\n          <div style=\"font-size:10.5px;color:var(--text3);text-align:center;margin-top:8px;font-family:'Space Grotesk',monospace\">Setting = Torsi Target × L ÷ (L + A)</div>\n        </div>\n      </div>\n    </div>\n\n    <div class=\"trs-top-mode-row\">\n      <div class=\"trs-top-mode-btn active\" id=\"trsTopModeNormal\" data-action=\"Torsi.setPageMode\" data-args='[\"normal\"]'><div style=\"font-size:16px\">📖</div><div class=\"trs-top-mode-btn-lbl\">Mode Normal</div></div>\n      <div class=\"trs-top-mode-btn\" id=\"trsTopModeChecklist\" data-action=\"Torsi.setPageMode\" data-args='[\"checklist\"]'><div style=\"font-size:16px\">✅</div><div class=\"trs-top-mode-btn-lbl\">Mode Checklist Servis</div></div>\n    </div>\n    <div class=\"trs-summary-bar\" id=\"trsSummaryBar\">\n      <div class=\"trs-summary-row\"><div style=\"font-size:11.5px;color:var(--text2);font-weight:600\">✅ Progres checklist</div><div style=\"font-family:'Space Grotesk',sans-serif;font-size:15px;font-weight:700\" id=\"trsSummaryProgress\">0/0</div></div>\n      <div class=\"trs-progress-track\"><div class=\"trs-progress-fill\" id=\"trsSummaryProgressFill\" style=\"width:0%\"></div></div>\n      <div class=\"trs-summary-row\" style=\"margin-top:10px\"><div style=\"font-size:11.5px;color:var(--text2);font-weight:600\">💰 Estimasi total biaya (belum tercatat)</div><div style=\"font-family:'Space Grotesk',sans-serif;font-size:15px;font-weight:700\" id=\"trsSummaryBiaya\">Rp 0</div></div>\n    </div>\n\n    <div class=\"search-wrap u-mb12\">\n      <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" style=\"position:absolute;left:13px;top:50%;transform:translateY(-50%);width:16px;height:16px;color:var(--text3)\"><circle cx=\"11\" cy=\"11\" r=\"8\"/><path d=\"m21 21-4.3-4.3\"/></svg>\n      <input class=\"fi\" id=\"trsSearchInput\" style=\"padding-left:38px\" placeholder=\"Cari nama part... (mis. busi, rem, oli)\" oninput=\"Torsi.renderList()\">\n    </div>\n    <div class=\"trs-chip-row\" id=\"trsChipRow\"></div>\n    <div id=\"trsCatList\"></div>\n    <div id=\"trsSourceNote\" style=\"font-size:11px;color:var(--text2);line-height:1.6;margin:4px 0 12px\"></div>\n    <button class=\"btn btn-ghost btn-full btn-sm\" data-action=\"Torsi.goToStock\">📦 Lihat Stok Sparepart Terkait</button>\n  </div>\n</div>", "<div class=\"overlay\" id=\"filterTxModal\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"filterTxModal-title\">\n  <div class=\"modal\">\n    <div class=\"modal-handle\"></div>\n    <div class=\"modal-title\" id=\"filterTxModal-title\"><span id=\"filterTxTitle\">Transaksi</span><button class=\"modal-close\" data-action=\"closeModal\" data-args='[\"filterTxModal\"]' aria-label=\"Tutup\">✕</button></div>\n    <div id=\"filterTxSummary\" style=\"font-size:12px;color:var(--text2);margin-bottom:10px\"></div>\n    <div id=\"filterTxList\"></div>\n  </div>\n</div>", "<div class=\"overlay\" id=\"dataHealthModal\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"dataHealthModal-title\">\n  <div class=\"modal\">\n    <div class=\"modal-handle\"></div>\n    <div class=\"modal-title\" id=\"dataHealthModal-title\"><span>🩺 Hasil Pemindaian Data</span><button class=\"modal-close\" data-action=\"closeModal\" data-args='[\"dataHealthModal\"]' aria-label=\"Tutup\">✕</button></div>\n    <div id=\"dataHealthSummary\" style=\"font-size:12px;color:var(--text2);margin-bottom:10px\"></div>\n    <div id=\"dataHealthList\"></div>\n  </div>\n</div>", "<div class=\"overlay\" id=\"globalSearchModal\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"globalSearchModal-title\">\n  <div class=\"modal\">\n    <div class=\"modal-handle\"></div>\n    <div class=\"modal-title\" id=\"globalSearchModal-title\"><span>🔎 Cari Semua Data</span><button class=\"modal-close\" data-action=\"closeModal\" data-args='[\"globalSearchModal\"]' aria-label=\"Tutup\">✕</button></div>\n    <input type=\"text\" class=\"fi u-mb12\" id=\"globalSearchInput\" placeholder=\"Cari transaksi, tagihan, produk, servis, target...\" oninput=\"onGlobalSearchInput()\" autocomplete=\"off\">\n    <div id=\"globalSearchResults\"><div style=\"font-size:12px;color:var(--text3);text-align:center;padding:16px 0\">Ketik minimal 2 huruf untuk mulai mencari</div></div>\n  </div>\n</div>", "<div class=\"overlay\" id=\"budgetModal\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"budgetModal-title\">\n  <div class=\"modal\">\n    <div class=\"modal-handle\"></div>\n    <div class=\"modal-title\" id=\"budgetModal-title\"><span id=\"budgetModalTitle\">Tambah Anggaran</span><button class=\"modal-close\" data-action=\"closeModal\" data-args='[\"budgetModal\"]' aria-label=\"Tutup\">✕</button></div>\n    <div class=\"u-mb12\">\n      <label class=\"fl\">Kategori (bisa pilih lebih dari 1)</label>\n      <div id=\"budgetCatList\" class=\"budget-catlist\"></div>\n      <label class=\"fl\">Nama Anggaran</label>\n      <input id=\"budgetName\" class=\"fi u-mb10\" placeholder=\"Contoh: Makan & Minum\" oninput=\"this.dataset.autoFilled='0'\">\n      <label class=\"fl\">Batas Anggaran (Rp)</label>\n      <div class=\"amt-wrap\" style=\"margin-bottom:4px\">\n        <input id=\"budgetLimit\" class=\"input fi-calc-only\" type=\"text\" placeholder=\"500.000 atau 300.000+200.000\" inputmode=\"decimal\" oninput=\"updateAmtPreview('budgetLimit','budgetLimitPreview')\" onblur=\"evalAmtExpr('budgetLimit')\">\n        <button type=\"button\" class=\"calc-trigger\" data-action=\"openCalc\" data-args='[\"budgetLimit\"]' title=\"Buka kalkulator\" aria-label=\"Buka kalkulator\">🧮</button>\n      </div>\n      <div id=\"budgetLimitPreview\" style=\"font-size:12px;color:var(--text3);margin-bottom:10px\"></div>\n      <label class=\"fl\">Periode Anggaran</label>\n      <div style=\"display:flex;gap:8px;margin-bottom:4px;flex-wrap:wrap\" id=\"budgetPeriodPicker\">\n        <button type=\"button\" class=\"chip-btn active\" data-period=\"bulanan\" data-action=\"selectBudgetPeriod\" data-args='[\"bulanan\", \"$el\"]'>📅 Bulanan</button>\n        <button type=\"button\" class=\"chip-btn\" data-period=\"mingguan\" data-action=\"selectBudgetPeriod\" data-args='[\"mingguan\", \"$el\"]'>📆 Mingguan</button>\n        <button type=\"button\" class=\"chip-btn\" data-period=\"tahunan\" data-action=\"selectBudgetPeriod\" data-args='[\"tahunan\", \"$el\"]'>🗓️ Tahunan</button>\n        <button type=\"button\" class=\"chip-btn\" data-period=\"sekali\" data-action=\"selectBudgetPeriod\" data-args='[\"sekali\", \"$el\"]'>🎯 1x Nominal</button>\n      </div>\n      <div id=\"budgetPeriodHint\" style=\"font-size:11px;color:var(--text2);margin-bottom:12px;line-height:1.5\">Direset & dihitung ulang tiap bulan (bulan berjalan).</div>\n      <label class=\"fl\">Ikon / Warna</label>\n      <div style=\"display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap\" id=\"budgetIconPicker\">\n        <button class=\"chip-btn active\" data-action=\"selectBudgetIcon\" data-args='[\"🍚\", \"$el\"]'>🍚 Makan</button>\n        <button class=\"chip-btn\" data-action=\"selectBudgetIcon\" data-args='[\"🏠\", \"$el\"]'>🏠 Rumah</button>\n        <button class=\"chip-btn\" data-action=\"selectBudgetIcon\" data-args='[\"⛽\", \"$el\"]'>⛽ BBM</button>\n        <button class=\"chip-btn\" data-action=\"selectBudgetIcon\" data-args='[\"🎉\", \"$el\"]'>🎉 Hiburan</button>\n        <button class=\"chip-btn\" data-action=\"selectBudgetIcon\" data-args='[\"🛒\", \"$el\"]'>🛒 Belanja</button>\n        <button class=\"chip-btn\" data-action=\"selectBudgetIcon\" data-args='[\"💊\", \"$el\"]'>💊 Kesehatan</button>\n        <button class=\"chip-btn\" data-action=\"selectBudgetIcon\" data-args='[\"📦\", \"$el\"]'>📦 Lainnya</button>\n        <button class=\"chip-btn\" data-action=\"selectBudgetIcon\" data-args='[\"💰\", \"$el\"]'>💰 Umum</button>\n      </div>\n      <label class=\"fl\">Catatan (opsional)</label>\n      <input id=\"budgetNote\" class=\"fi u-mb10\" placeholder=\"Catatan anggaran ini...\">\n      <label id=\"budgetRolloverRow\" style=\"display:flex;align-items:center;gap:8px;font-size:13px;color:var(--text2);margin-bottom:16px;cursor:pointer\">\n        <input type=\"checkbox\" id=\"budgetRollover\" style=\"width:16px;height:16px\"> Rollover sisa bulan lalu (tambahkan sisa ke batas bulan ini)\n      </label>\n    </div>\n    <button class=\"btn btn-primary btn-full u-p14\" data-action=\"saveBudget\">Simpan Anggaran</button>\n  </div>\n</div>", "<div class=\"overlay\" id=\"fiSettingsModal\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"fiSettingsModal-title\">\n  <div class=\"modal\">\n    <div class=\"modal-handle\"></div>\n    <div class=\"modal-title\" id=\"fiSettingsModal-title\">🎯 Atur Asumsi Kebebasan Finansial<button class=\"modal-close\" data-action=\"closeModal\" data-args='[\"fiSettingsModal\"]' aria-label=\"Tutup\">✕</button></div>\n    <div class=\"u-hint12\">Semua angka di bawah adalah <b>asumsi pribadi</b>, bukan saran/jaminan investasi. Sesuaikan sendiri sesuai kondisi & profil risiko Anda — makin konservatif asumsinya, makin realistis estimasinya.</div>\n    <div class=\"fg\"><label class=\"fl\">Tanggal Lahir (utk estimasi usia saat FI tercapai)</label><input type=\"date\" class=\"fi\" id=\"fiTglLahir\" disabled style=\"opacity:.7\"><div style=\"font-size:11px;color:var(--text3);margin-top:4px\">Diatur di Pengaturan → Profil Pribadi (dipakai bareng utk PTKP PPh 21), bukan di sini.</div></div>\n    <div class=\"u-mb12\">\n      <label class=\"fl\">Cakupan Aset untuk Target FI</label>\n      <div style=\"font-size:11px;color:var(--text2);margin-bottom:6px;line-height:1.5\">\"Aset Investasi\" = aset yang ditandai \"Hitung ke Zakat Maal\" di Buku Aset (emas, deposito, saham, reksadana, dst) — bukan rumah tinggal/kendaraan pakai sehari-hari. Ini lebih sesuai metodologi FI (aset yang bisa dicairkan utk membiayai hidup). Pilih \"Semua Aset\" kalau rumah/kendaraanmu memang direncanakan dijual/dicairkan nanti.</div>\n      <div style=\"display:flex;gap:8px;flex-wrap:wrap\" id=\"fiAssetScopePicker\">\n        <button type=\"button\" class=\"chip-btn\" data-action=\"selectFiAssetScope\" data-args='[\"zakatable\", \"$el\"]'>📈 Hanya Aset Investasi</button>\n        <button type=\"button\" class=\"chip-btn\" data-action=\"selectFiAssetScope\" data-args='[\"semua\", \"$el\"]'>📦 Semua Aset</button>\n      </div>\n    </div>\n    <div class=\"u-mb12\">\n      <label class=\"fl\">Kategori Pengeluaran Basis FI</label>\n      <div style=\"font-size:11px;color:var(--text2);margin-bottom:6px;line-height:1.5\">Pilih kategori yang dianggap \"biaya hidup\" (dasar hitung Target FI). Pilih \"Total Pengeluaran\" kalau mau pakai semua kategori (termasuk bisnis dll).</div>\n      <div id=\"fiCatList\" class=\"budget-catlist\"></div>\n    </div>\n    <div class=\"fg\"><label class=\"fl\">Rata-rata Pengeluaran Dari (bulan terakhir)</label>\n      <select class=\"fi\" id=\"fiAvgMonths\">\n        <option value=\"3\">3 bulan terakhir</option>\n        <option value=\"6\" selected>6 bulan terakhir</option>\n        <option value=\"12\">12 bulan terakhir</option>\n      </select>\n    </div>\n    <div class=\"fg\"><label class=\"fl\">Safe Withdrawal Rate (%/tahun)</label><input type=\"text\" inputmode=\"decimal\" class=\"fi\" id=\"fiSwr\" placeholder=\"4\"><div style=\"font-size:11px;color:var(--text3);margin-top:4px\">Umum dipakai 4% (aturan \"25x pengeluaran tahunan\"). Makin kecil %, makin konservatif (target makin besar).</div></div>\n    <div class=\"fg\"><label class=\"fl\">Asumsi Return Investasi (%/tahun, nominal)</label><input type=\"text\" inputmode=\"decimal\" class=\"fi\" id=\"fiReturn\" placeholder=\"8\"></div>\n    <div class=\"fg\"><label class=\"fl\">Asumsi Inflasi (%/tahun)</label><input type=\"text\" inputmode=\"decimal\" class=\"fi\" id=\"fiInflasi\" placeholder=\"5\"><div style=\"font-size:11px;color:var(--text3);margin-top:4px\">Dipakai sbg return riil (return − inflasi) supaya target & estimasi tahun tetap dalam nilai uang hari ini.</div></div>\n    <div class=\"fg\"><label class=\"fl\">Rentang Skenario (± %/tahun dari Asumsi Return)</label><input type=\"text\" inputmode=\"decimal\" class=\"fi\" id=\"fiScenarioRange\" placeholder=\"2\"><div style=\"font-size:11px;color:var(--text3);margin-top:4px\">Dipakai utk tampilkan 3 skenario (Konservatif/Moderat/Optimis) di dashboard, biar kelihatan seberapa sensitif estimasi tahun kalau return sebenarnya meleset dari asumsi. Mis. asumsi 8% & rentang 2% → skenario 6% / 8% / 10%.</div></div>\n    <button class=\"btn btn-primary btn-full u-p14\" data-action=\"saveFiSettings\">Simpan Asumsi</button>\n  </div>\n</div>", "<div class=\"overlay\" id=\"pensiunModal\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"pensiunModal-title\">\n  <div class=\"modal\">\n    <div class=\"modal-handle\"></div>\n    <div class=\"modal-title\" id=\"pensiunModal-title\">🏖️ Atur Dana Pensiun<button class=\"modal-close\" data-action=\"closeModal\" data-args='[\"pensiunModal\"]' aria-label=\"Tutup\">✕</button></div>\n    <div class=\"u-hint12\">Ini fitur perencanaan pensiun terpisah dari kalkulator Kebebasan Finansial (FI) — fokus ke satu target usia & satu akun tabungan pensiun yang bisa langsung diisi lewat transaksi nyata.</div>\n    <div class=\"grid2 u-mb0\">\n      <div class=\"fg\"><label class=\"fl\">Usia Sekarang (tahun)</label><input type=\"text\" inputmode=\"numeric\" class=\"fi\" id=\"pensUsiaSekarang\" placeholder=\"30\"></div>\n      <div class=\"fg\"><label class=\"fl\">Target Usia Pensiun</label><input type=\"text\" inputmode=\"numeric\" class=\"fi\" id=\"pensUsiaPensiun\" placeholder=\"58\"></div>\n    </div>\n    <div class=\"fg\"><label class=\"fl\">Target Dana Pensiun (Rp)</label><input type=\"text\" inputmode=\"numeric\" class=\"fi\" id=\"pensTarget\" placeholder=\"1000000000\"></div>\n    <div class=\"fg\"><label class=\"fl\">Akun Tabungan Dana Pensiun</label>\n      <select class=\"fi\" id=\"pensAcc\"></select>\n      <div style=\"font-size:11px;color:var(--text3);margin-top:4px\">Saldo akun ini otomatis jadi \"Dana Terkumpul\" (sync dari Keuangan). Kalau belum ada, buat dulu akun baru di tab Uang → Kelola Akun.</div>\n    </div>\n    <div class=\"fg\"><label class=\"fl\">Asumsi Return Investasi (%/tahun)</label><input type=\"text\" inputmode=\"decimal\" class=\"fi\" id=\"pensReturn\" placeholder=\"6\"></div>\n    <div class=\"fg\"><label class=\"fl\">Kontribusi Bulanan (Rp)</label><input type=\"text\" inputmode=\"numeric\" class=\"fi\" id=\"pensKontribusi\" placeholder=\"0\">\n      <div style=\"font-size:11px;color:var(--text3);margin-top:4px\">Bisa diisi manual, atau tap \"🔄 Sync Rekomendasi dari Keuangan\" di kartu Dana Pensiun supaya dihitung otomatis dari rata-rata surplus (pemasukan − pengeluaran) transaksi aslimu.</div>\n    </div>\n    <button class=\"btn btn-primary btn-full u-p14\" data-action=\"Pensiun.saveSettings\">Simpan Dana Pensiun</button>\n  </div>\n</div>", "<div class=\"overlay\" id=\"confirmModalOverlay\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"confirmModalTitle\" aria-describedby=\"confirmModalMsg\" style=\"align-items:center;z-index:500\">\n  <div class=\"modal\" style=\"border-radius:20px;max-width:340px;margin:0 16px;padding:22px 20px 20px;animation:none\">\n    <div id=\"confirmModalIcon\" style=\"font-size:32px;text-align:center;margin-bottom:10px\">⚠️</div>\n    <div id=\"confirmModalTitle\" style=\"font-family:'Space Grotesk',sans-serif;font-size:16px;font-weight:700;text-align:center;margin-bottom:6px\">Konfirmasi</div>\n    <div id=\"confirmModalMsg\" style=\"font-size:13px;color:var(--text2);text-align:center;line-height:1.5;margin-bottom:18px;white-space:pre-line\"></div>\n    <div style=\"display:flex;gap:8px\">\n      <button class=\"btn btn-ghost btn-full\" id=\"confirmModalCancel\" data-action=\"_confirmModalAnswer\" data-args='[false]'>Batal</button>\n      <button class=\"btn btn-danger btn-full\" id=\"confirmModalOk\" data-action=\"_confirmModalAnswer\" data-args='[true]'>Ya, Lanjutkan</button>\n    </div>\n  </div>\n</div>", "<div class=\"overlay\" id=\"promptModalOverlay\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"promptModalTitle\" aria-describedby=\"promptModalMsg\" style=\"align-items:center;z-index:500\">\n  <div class=\"modal\" style=\"border-radius:20px;max-width:340px;margin:0 16px;padding:22px 20px 20px;animation:none\">\n    <div id=\"promptModalIcon\" style=\"font-size:32px;text-align:center;margin-bottom:10px\">✏️</div>\n    <div id=\"promptModalTitle\" style=\"font-family:'Space Grotesk',sans-serif;font-size:16px;font-weight:700;text-align:center;margin-bottom:6px\">Isi Data</div>\n    <div id=\"promptModalMsg\" style=\"font-size:13px;color:var(--text2);text-align:center;line-height:1.5;margin-bottom:14px\"></div>\n    <input class=\"fi u-mb8\" id=\"promptModalInput\" autocomplete=\"off\" \n onkeydown=\"if(event.key==='Enter'){event.preventDefault();_promptModalSubmit();}\"\n oninput=\"document.getElementById('promptModalError').textContent=''\">\n    <div id=\"promptModalError\" style=\"font-size:12px;color:var(--accent2);text-align:center;min-height:16px;margin-bottom:4px\"></div>\n    <div style=\"display:flex;gap:8px;margin-top:8px\">\n      <button class=\"btn btn-ghost btn-full\" id=\"promptModalCancelBtn\" data-action=\"_promptModalAnswer\" data-args='[null]'>Batal</button>\n      <button class=\"btn btn-primary btn-full\" id=\"promptModalOkBtn\" data-action=\"_promptModalSubmit\">Simpan</button>\n    </div>\n  </div>\n</div>", "<div class=\"overlay\" id=\"choiceModalOverlay\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"choiceModalTitle\" style=\"align-items:center;z-index:500\">\n  <div class=\"modal\" style=\"border-radius:20px;max-width:360px;margin:0 16px;padding:20px 18px;animation:none\">\n    <div id=\"choiceModalTitle\" style=\"font-family:'Space Grotesk',sans-serif;font-size:16px;font-weight:700;text-align:center;margin-bottom:4px\">Pilih</div>\n    <div id=\"choiceModalMsg\" style=\"font-size:12px;color:var(--text2);text-align:center;line-height:1.5;margin-bottom:12px\"></div>\n    <div id=\"choiceModalList\" style=\"display:flex;flex-direction:column;gap:6px;max-height:50vh;overflow-y:auto\"></div>\n    <button class=\"btn btn-ghost btn-full\" style=\"margin-top:12px\" data-action=\"_choiceModalAnswer\" data-args='[null]'>Batal</button>\n  </div>\n</div>", "<div class=\"overlay\" id=\"infoModalOverlay\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"infoModalTitle\" aria-describedby=\"infoModalMsg\" style=\"align-items:center;z-index:500\">\n  <div class=\"modal\" style=\"border-radius:20px;max-width:340px;margin:0 16px;padding:22px 20px 20px;animation:none\">\n    <div id=\"infoModalIcon\" style=\"font-size:32px;text-align:center;margin-bottom:10px\">⚠️</div>\n    <div id=\"infoModalTitle\" style=\"font-family:'Space Grotesk',sans-serif;font-size:16px;font-weight:700;text-align:center;margin-bottom:6px\">Perhatian</div>\n    <div id=\"infoModalMsg\" style=\"font-size:13px;color:var(--text2);text-align:center;line-height:1.5;margin-bottom:18px;white-space:pre-line\"></div>\n    <button class=\"btn btn-primary btn-full\" id=\"infoModalOk\" data-action=\"_infoModalAnswer\">Mengerti</button>\n  </div>\n</div>", "<div class=\"overlay\" id=\"pinPromptModalOverlay\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"pinPromptModalTitle\" aria-describedby=\"pinPromptModalMsg\" style=\"align-items:center;z-index:500\">\n  <div class=\"modal\" style=\"border-radius:20px;max-width:340px;margin:0 16px;padding:22px 20px 20px;animation:none\">\n    <div style=\"font-size:32px;text-align:center;margin-bottom:10px\">🔒</div>\n    <div id=\"pinPromptModalTitle\" style=\"font-family:'Space Grotesk',sans-serif;font-size:16px;font-weight:700;text-align:center;margin-bottom:6px\">Ganti PIN</div>\n    <div id=\"pinPromptModalMsg\" style=\"font-size:13px;color:var(--text2);text-align:center;line-height:1.5;margin-bottom:14px\">Masukkan PIN baru (4 digit angka)</div>\n    <input class=\"fi\" id=\"pinPromptInput\" type=\"tel\" inputmode=\"numeric\" pattern=\"[0-9]*\" maxlength=\"4\" placeholder=\"••••\" autocomplete=\"off\"\n      style=\"text-align:center;letter-spacing:10px;font-size:20px;margin-bottom:8px\"\n      oninput=\"this.value=this.value.replace(/[^0-9]/g,'').slice(0,4);document.getElementById('pinPromptError').textContent=''\"\n      onkeydown=\"if(event.key==='Enter'){event.preventDefault();_pinPromptSubmit();}\">\n    <div id=\"pinPromptError\" style=\"font-size:12px;color:var(--accent2);text-align:center;min-height:16px;margin-bottom:4px\"></div>\n    <div style=\"display:flex;gap:8px;margin-top:8px\">\n      <button class=\"btn btn-ghost btn-full\" data-action=\"_pinPromptAnswer\" data-args='[null]'>Batal</button>\n      <button class=\"btn btn-primary btn-full\" data-action=\"_pinPromptSubmit\">Simpan</button>\n    </div>\n  </div>\n</div>", "<div class=\"overlay\" id=\"budgetSettingsModal\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"budgetSettingsModal-title\">\n  <div class=\"modal\">\n    <div class=\"modal-handle\"></div>\n    <div class=\"modal-title\" id=\"budgetSettingsModal-title\"><span>⚙️ Pengaturan Anggaran</span><button class=\"modal-close\" data-action=\"closeModal\" data-args='[\"budgetSettingsModal\"]' aria-label=\"Tutup\">✕</button></div>\n    <div class=\"card-title u-mb10\">Tampilan</div>\n    <label style=\"display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;font-size:13px\">\n      <span>Tampilkan peringatan saat &gt;80%</span>\n      <input type=\"checkbox\" id=\"bsWarnAt80\" checked style=\"width:18px;height:18px\">\n    </label>\n    <label style=\"display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;font-size:13px\">\n      <span>Tampilkan badge \"LEWAT\" jika over budget</span>\n      <input type=\"checkbox\" id=\"bsShowOver\" checked style=\"width:18px;height:18px\">\n    </label>\n    <label style=\"display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;font-size:13px\">\n      <span>Sembunyikan anggaran yang belum terpakai</span>\n      <input type=\"checkbox\" id=\"bsHideZero\" style=\"width:18px;height:18px\">\n    </label>\n    <div class=\"card-title\" style=\"margin-bottom:10px;margin-top:4px\">Urutan tampil</div>\n    <select id=\"bsSortOrder\" class=\"fs\" style=\"margin-bottom:16px\">\n      <option value=\"pct_desc\">Paling banyak terpakai (%) dulu</option>\n      <option value=\"pct_asc\">Paling sedikit terpakai (%) dulu</option>\n      <option value=\"sisa_asc\">Sisa paling sedikit dulu</option>\n      <option value=\"name\">Urutan nama (A-Z)</option>\n    </select>\n    <div style=\"height:1px;background:var(--border);margin-bottom:14px\"></div>\n    <button class=\"btn btn-danger btn-full\" data-onclick=\"(async()=>{if(await askConfirm('Reset semua anggaran?')){D.budgets=[];saveBudgetSettings();save();renderBudgets();closeModal('budgetSettingsModal');toast('🗑 Semua anggaran dihapus');}})()\">🗑 Hapus Semua Anggaran</button>\n    <div style=\"margin-top:10px\">\n      <button class=\"btn btn-primary btn-full\" data-onclick=\"saveBudgetSettings();closeModal('budgetSettingsModal');renderBudgets();toast('✅ Pengaturan disimpan')\">Simpan Pengaturan</button>\n    </div>\n  </div>\n</div>", '<div class="overlay" id="refleksiModal" role="dialog" aria-modal="true" aria-labelledby="refleksiModal-title">  <div class="modal">    <div class="modal-handle"></div>    <div class="modal-title" id="refleksiModal-title"><span>🌱 Refleksi &amp; Self-Care</span><button class="modal-close" data-action="closeModal" data-args=\'["refleksiModal"]\' aria-label="Tutup">✕</button></div>    <div style="display:flex;gap:6px;background:var(--surface3);padding:4px;border-radius:12px;margin-bottom:14px">      <button type="button" id="refTabSyukurBtn" data-action="Refleksi.setTab" data-args=\'["syukur"]\' style="flex:1;padding:9px 0;border:none;border-radius:9px;font-weight:700;font-size:12px;cursor:pointer;background:var(--accent);color:#fff">🙏 Syukur</button>      <button type="button" id="refTabSelfcareBtn" data-action="Refleksi.setTab" data-args=\'["selfcare"]\' style="flex:1;padding:9px 0;border:none;border-radius:9px;font-weight:700;font-size:12px;cursor:pointer;background:transparent;color:var(--text2)">✅ Self-Care</button>      <button type="button" id="refTabCatatanBtn" data-action="Refleksi.setTab" data-args=\'["catatan"]\' style="flex:1;padding:9px 0;border:none;border-radius:9px;font-weight:700;font-size:12px;cursor:pointer;background:transparent;color:var(--text2)">🔒 Catatan</button>    </div>    <div id="refWrapSyukur">      <div class="u-hint12">Tulis 1-3 hal yang kamu syukuri hari ini — hal kecil juga boleh. Rutin dicatat bisa bantu lihat progress & momen baik yang gampang kelewat.</div>      <div class="fg"><label class="fl">Hari ini aku bersyukur untuk...</label><textarea class="fi" id="refSyukurText" placeholder="Contoh: Sehat, bisa kumpul sama keluarga, dapat rezeki tak terduga..."></textarea></div>      <button class="btn btn-primary btn-full u-p14" data-action="Refleksi.addGratitude">+ Simpan Rasa Syukur</button>      <div class="div"></div>      <div class="card-title">📖 Riwayat Syukur</div>      <div id="refSyukurList"></div>    </div>    <div id="refWrapSelfcare" class="u-dnone">      <div style="background:var(--surface2);border-radius:12px;padding:14px;margin-bottom:14px;text-align:center">        <div style="font-size:11px;color:var(--text2);text-transform:uppercase;letter-spacing:0.8px;font-weight:700">Konsisten Berturut-turut</div>        <div style="font-family:\'Space Grotesk\',sans-serif;font-size:24px;font-weight:800;color:var(--accent3);margin-top:2px" id="refStreakVal">0 hari</div>      </div>      <div id="refSelfCareRekoBox"></div>      <div class="u-hint12">Centang yang sudah kamu lakukan hari ini. Ringan saja, jangan jadi beban — tujuannya bantu ingat rawat diri sendiri, bukan tekanan baru.</div>      <div id="refSelfCareList" class="u-mb10"></div>      <div class="div"></div>      <div class="card-title">📅 Riwayat 14 Hari Terakhir</div>      <div id="refSelfCareHistory"></div>    </div>    <div id="refWrapCatatan" class="u-dnone">      <div class="u-hint12">🔒 Catatan di sini dienkripsi memakai PIN aplikasimu — hanya bisa dibaca setelah dibuka dengan PIN yang sama. Cocok buat isi hati yang privat, bukan cuma catatan biasa.</div>      <div class="fg"><label class="fl">Judul (opsional)</label><input type="text" class="fi" id="refCatatanJudul" placeholder="Judul singkat..."></div>      <div class="fg"><label class="fl">Isi Catatan</label><textarea class="fi" id="refCatatanText" placeholder="Tulis apa saja yang ingin kamu simpan secara privat..."></textarea></div>      <button class="btn btn-primary btn-full u-p14" data-action="Refleksi.addNote">🔒 Simpan Terenkripsi</button>      <div class="div"></div>      <div class="card-title">🗂️ Catatan Tersimpan</div>      <div id="refCatatanList"></div>    </div>  </div></div>'];


const MODULE_CALC_VERSION='kw81-rename-cobek-to-shop';
const FI={
assetScopeState:'zakatable',
investmentAssetValue(){
const fi=D.finansialFreedom||{};
if((fi.assetScope||'zakatable')==='semua') return totalAssetValue();
return (D.assets||[]).filter(a=>a.zakatable).reduce((s,a)=>s+(a.nilai||0),0);
},
assetFund(){ return totalSaldoAkun()+FI.investmentAssetValue()+totalPiutangValue(); },
totalDebt(){
const utangJT=(D.pajakZakat&&D.pajakZakat.utangJT)||0;
const sisaCicilan=(typeof totalCicilanOutstanding==='function'?totalCicilanOutstanding():0)||0;
const bukuUtang=(typeof totalDebtValue==='function'?totalDebtValue():0)||0;
return utangJT+sisaCicilan+bukuUtang;
},
netAssetFund(){ return FI.assetFund()-FI.totalDebt(); },
getAssumptions(){
const fi=D.finansialFreedom||{};
let swr=Number(fi.swr); if(!isFinite(swr)||swr<0.5||swr>20) swr=4;
let ret=Number(fi.assumsiReturn); if(!isFinite(ret)||ret<-20||ret>30) ret=8;
let inf=Number(fi.assumsiInflasi); if(!isFinite(inf)||inf<0||inf>30) inf=5;
let avgMonths=Number(fi.avgMonths); if(!isFinite(avgMonths)||avgMonths<1||avgMonths>24) avgMonths=6;
return {swr,ret,inf,avgMonths};
},
monthsOfDataAvailable(){
if(!D.transactions||!D.transactions.length) return 0;
let earliest=null;
D.transactions.forEach(t=>{const d=new Date(t.date);if(!earliest||d<earliest)earliest=d;});
if(!earliest) return 0;
const now=new Date();
return Math.max(1,(now.getFullYear()-earliest.getFullYear())*12+(now.getMonth()-earliest.getMonth())+1);
},
effectiveMonths(){
const {avgMonths}=FI.getAssumptions();
return Math.max(1,Math.min(avgMonths,FI.monthsOfDataAvailable()||1));
},
annualExpense(){
const fi=D.finansialFreedom||{};
const months=FI.effectiveMonths();
const now=new Date();
const from=new Date(now.getFullYear(),now.getMonth()-months+1,1);
const catIds=(fi.expenseCatIds&&fi.expenseCatIds.length)?fi.expenseCatIds:['__total__'];
const pseudoBudget={catIds};
const total=D.transactions.filter(t=>{
const d=new Date(t.date);
return d>=from&&d<=now&&budgetMatchesTx(pseudoBudget,t);
}).reduce((s,t)=>s+t.amount,0);
return (total/months)*12;
},
targetNominal(){
const {swr}=FI.getAssumptions();
return FI.annualExpense()/(swr/100);
},
monthlySurplus(){
const months=FI.effectiveMonths();
const now=new Date();
const from=new Date(now.getFullYear(),now.getMonth()-months+1,1);
const txs=D.transactions.filter(t=>{const d=new Date(t.date);return d>=from&&d<=now;});
const inc=txs.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
const exp=txs.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
return (inc-exp)/months;
},
estimateMonthsToTarget(retOverride){
const asset=FI.netAssetFund();
const target=FI.targetNominal();
if(!isFinite(target)||target<=0) return null;
if(asset>=target) return 0;
const monthlySurplus=FI.monthlySurplus();
const {ret:retDefault,inf}=FI.getAssumptions();
const ret=(retOverride!==undefined&&retOverride!==null&&isFinite(retOverride))?retOverride:retDefault;
const realAnnual=(1+ret/100)/(1+inf/100)-1;
const r=realAnnual/12;
let bal=asset;
for(let n=1;n<=1200;n++){
bal=bal*(1+r)+monthlySurplus;
if(bal>=target) return n;
}
return null;
},
formatMonths(monthsToGo){
if(monthsToGo===null)return '>100th';
if(monthsToGo===0)return '🎉 Tercapai';
const years=Math.floor(monthsToGo/12),sisaBulan=monthsToGo%12;
return years>0?(`≈${years}th`+(sisaBulan>0?` ${sisaBulan}bln`:'')):`≈${sisaBulan}bln`;
},
renderScenarios(){
const box=document.getElementById('fiScenarioBox');
if(!box)return;
const target=FI.targetNominal();
if(!isFinite(target)||target<=0){box.style.display='none';return;}
const fi=D.finansialFreedom||{};
let range=Number(fi.scenarioRange); if(!isFinite(range)||range<0.5||range>15)range=2;
const {ret}=FI.getAssumptions();
const retPess=ret-range,retOpt=ret+range;
document.getElementById('fiScenPess').textContent=FI.formatMonths(FI.estimateMonthsToTarget(retPess));
document.getElementById('fiScenMod').textContent=FI.formatMonths(FI.estimateMonthsToTarget(ret));
document.getElementById('fiScenOpt').textContent=FI.formatMonths(FI.estimateMonthsToTarget(retOpt));
let note=`Skenario pakai return ±${range}%/th dari asumsi (${retPess.toFixed(1)}% / ${ret.toFixed(1)}% / ${retOpt.toFixed(1)}%), inflasi tetap ${FI.getAssumptions().inf}%/th.`;
const actual=typeof actualWealthCAGR==='function'?actualWealthCAGR():null;
if(actual&&actual.reason){
note+=' Growth rate AKTUAL belum bisa dibandingkan (Kekayaan Bersih sempat/sedang negatif) — lihat detail di panel Kekayaan Bersih.';
} else if(actual){
const pctActual=actual.cagr*100;
const mActual=FI.estimateMonthsToTarget(pctActual);
note+=` Berdasarkan histori kekayaanmu (📈 growth rate AKTUAL ≈${pctActual.toFixed(1)}%/th), estimasi ${FI.formatMonths(mActual)}.`;
} else {
note+=' Catat snapshot kekayaan di menu Pajak & Zakat supaya bisa dibandingkan dgn growth rate AKTUAL.';
}
document.getElementById('fiScenNote').textContent=note;
box.classList.remove('u-dnone');box.style.display='block';
},
calcAge(iso){
const b=new Date(iso),now=new Date();
let age=now.getFullYear()-b.getFullYear();
const m=now.getMonth()-b.getMonth();
if(m<0||(m===0&&now.getDate()<b.getDate()))age--;
return age;
},
renderFinancialFreedom(){
const card=document.getElementById('dashFiCard');
if(!card)return;
const fi=D.finansialFreedom||(D.finansialFreedom={expenseCatIds:[],avgMonths:6,swr:4,assumsiReturn:8,assumsiInflasi:5,scenarioRange:2});
const setup=document.getElementById('dashFiSetupPrompt');
const body=document.getElementById('dashFiBody');
const monthsData=FI.monthsOfDataAvailable();
if(monthsData<1){
setup.classList.remove('u-dnone');setup.style.display='block';
setup.textContent='Belum ada data transaksi. Catat pemasukan & pengeluaran dulu supaya progress Kebebasan Finansial bisa dihitung.';
body.style.display='none';
const scenBox=document.getElementById('fiScenarioBox'); if(scenBox)scenBox.style.display='none';
return;
}
if(monthsData<3){
setup.classList.remove('u-dnone');setup.style.display='block';
setup.textContent=`⚠️ Baru ada ${monthsData} bulan data transaksi. Estimasi di bawah masih kasar — makin akurat setelah histori transaksi lebih panjang.`;
} else setup.style.display='none';
body.classList.remove('u-dnone');body.style.display='block';
const asetKotor=FI.assetFund();
const utang=FI.totalDebt();
const asetBersih=asetKotor-utang;
const target=FI.targetNominal();
const pct=target>0?Math.max(0,Math.min(100,Math.round(asetBersih/target*100))):0;
document.getElementById('fiPct').textContent=pct+'%';
const bar=document.getElementById('fiBar');
bar.style.width=pct+'%';
bar.className='budget-bar-fill '+(pct>=100?'ok':pct>=50?'warn':'over');
document.getElementById('fiAsetKotorLabel').textContent=((D.finansialFreedom.assetScope||'zakatable')==='semua')?'Aset (Semua)':'Aset Investasi';
document.getElementById('fiAsetKotor').textContent=fmt(asetKotor);
document.getElementById('fiUtang').textContent=fmt(utang);
const netEl=document.getElementById('fiAsetSekarang');
netEl.textContent=(asetBersih<0?'-':'')+fmt(asetBersih);
netEl.className='stat-val '+(asetBersih>=0?'purple':'red');
document.getElementById('fiTargetSekarang').textContent=fmt(target);
const monthsToGo=FI.estimateMonthsToTarget();
const estEl=document.getElementById('fiEstimasi');
const noteEl=document.getElementById('fiCatatan');
const swr=FI.getAssumptions().swr, ret=FI.getAssumptions().ret, inf=FI.getAssumptions().inf;
if(target<=0){
estEl.textContent='-';
noteEl.textContent='Atur kategori pengeluaran & asumsi dulu lewat ⚙️ Atur Asumsi.';
} else if(monthsToGo===0){
estEl.textContent='🎉 Tercapai!';
noteEl.textContent=`Kekayaan bersih (saldo akun + aset + piutang − utang) sudah melewati Target FI berdasarkan asumsi SWR ${swr}%.`;
} else if(monthsToGo===null){
estEl.textContent='Belum tercapai';
noteEl.textContent='Dengan surplus bulanan & asumsi return riil saat ini, target belum tercapai dlm 100 tahun ke depan. Coba naikkan pemasukan/tekan pengeluaran, atau sesuaikan asumsi di ⚙️ Atur Asumsi.';
} else {
const years=Math.floor(monthsToGo/12), sisaBulan=monthsToGo%12;
let txt=years>0?(`≈ ${years} th`+(sisaBulan>0?` ${sisaBulan} bln`:'')):`≈ ${sisaBulan} bln`;
estEl.textContent=txt+' lagi';
let ageNote='';
if(D.profile&&D.profile.tanggalLahir){
const usiaFI=FI.calcAge(D.profile.tanggalLahir)+monthsToGo/12;
ageNote=` · ≈ usia ${Math.floor(usiaFI)} tahun saat tercapai`;
}
noteEl.textContent=`Target = pengeluaran tahunan ÷ SWR ${swr}% (≈${(100/swr).toFixed(1)}x). Asumsi return ${ret}%/th, inflasi ${inf}%/th (return riil ${(ret-inf).toFixed(1)}%/th).${ageNote}`;
}
FI.renderScenarios();
},
selectAssetScope(v,el){
FI.assetScopeState=v;
document.querySelectorAll('#fiAssetScopePicker .chip-btn').forEach(b=>b.classList.remove('active'));
el.classList.add('active');
},
openSettingsModal(){
if(!D.finansialFreedom) D.finansialFreedom={expenseCatIds:[],avgMonths:6,swr:4,assumsiReturn:8,assumsiInflasi:5,assetScope:'zakatable'};
const fi=D.finansialFreedom;
document.getElementById('fiTglLahir').value=(D.profile&&D.profile.tanggalLahir)||'';
FI.assetScopeState=fi.assetScope||'zakatable';
document.querySelectorAll('#fiAssetScopePicker .chip-btn').forEach(b=>{
b.classList.toggle('active',(FI.assetScopeState==='zakatable'&&b.textContent.includes('Hanya'))||(FI.assetScopeState==='semua'&&b.textContent.includes('Semua')));
});
FI.renderCatOptions((fi.expenseCatIds&&fi.expenseCatIds.length)?fi.expenseCatIds:['__total__']);
document.getElementById('fiAvgMonths').value=fi.avgMonths||6;
document.getElementById('fiSwr').value=fi.swr!=null?fi.swr:4;
document.getElementById('fiReturn').value=fi.assumsiReturn!=null?fi.assumsiReturn:8;
document.getElementById('fiInflasi').value=fi.assumsiInflasi!=null?fi.assumsiInflasi:5;
document.getElementById('fiScenarioRange').value=fi.scenarioRange!=null?fi.scenarioRange:2;
openModal('fiSettingsModal');
},
renderCatOptions(selected){
let html=`<label class="budget-cat-opt total"><input type="checkbox" id="fiCatTotal" onchange="onFiCatTotalToggle(this)"> 🎯 Total Pengeluaran (semua kategori)</label>`;
D.categories.expense.forEach(c=>{
html+=`<label class="budget-cat-opt"><input type="checkbox" class="fiCatChk" value="${c.id}"> ${c.icon||''} ${escapeHtml(c.name)}</label>`;
(c.subs||[]).forEach(s=>{
html+=`<label class="budget-cat-opt sub"><input type="checkbox" class="fiCatChk" value="${s.id}"> ↳ ${s.icon||''} ${escapeHtml(s.name)}</label>`;
});
});
document.getElementById('fiCatList').innerHTML=html;
const totalChk=document.getElementById('fiCatTotal');
const isTotal=selected.includes('__total__');
totalChk.checked=isTotal;
document.querySelectorAll('.fiCatChk').forEach(c=>{c.disabled=isTotal;c.checked=!isTotal&&selected.includes(c.value);});
},
onCatTotalToggle(el){
document.querySelectorAll('.fiCatChk').forEach(c=>{c.disabled=el.checked;if(el.checked)c.checked=false;});
},
getSelectedCatIds(){
const totalChk=document.getElementById('fiCatTotal');
if(totalChk&&totalChk.checked) return ['__total__'];
return Array.from(document.querySelectorAll('.fiCatChk:checked')).map(c=>c.value);
},
saveSettings(){
if(!D.finansialFreedom) D.finansialFreedom={};
const fi=D.finansialFreedom;
const swrRaw=document.getElementById('fiSwr').value.trim();
const retRaw=document.getElementById('fiReturn').value.trim();
const infRaw=document.getElementById('fiInflasi').value.trim();
const swr=parseFloat(swrRaw.replace(',','.'));
const ret=parseFloat(retRaw.replace(',','.'));
const inf=parseFloat(infRaw.replace(',','.'));
if(swrRaw===''||isNaN(swr)||swr<0.5||swr>20){
toast('⚠️ Safe Withdrawal Rate harus diisi, antara 0.5% - 20%');
document.getElementById('fiSwr').focus();
return;
}
if(retRaw===''||isNaN(ret)||ret<-20||ret>30){
toast('⚠️ Asumsi Return harus diisi, antara -20% - 30%');
document.getElementById('fiReturn').focus();
return;
}
if(infRaw===''||isNaN(inf)||inf<0||inf>30){
toast('⚠️ Asumsi Inflasi harus diisi, antara 0% - 30%');
document.getElementById('fiInflasi').focus();
return;
}
const rangeRaw=document.getElementById('fiScenarioRange').value.trim();
const range=parseFloat(rangeRaw.replace(',','.'));
if(rangeRaw===''||isNaN(range)||range<0.5||range>15){
toast('⚠️ Rentang Skenario harus diisi, antara 0.5% - 15%');
document.getElementById('fiScenarioRange').focus();
return;
}
fi.expenseCatIds=FI.getSelectedCatIds();
if(fi.expenseCatIds.includes('__total__')) fi.expenseCatIds=[];
fi.assetScope=(FI.assetScopeState==='semua')?'semua':'zakatable';
fi.avgMonths=parseInt(document.getElementById('fiAvgMonths').value)||6;
fi.swr=swr;
fi.assumsiReturn=ret;
fi.assumsiInflasi=inf;
fi.scenarioRange=range;
save();closeModal('fiSettingsModal');renderDashboard();toast('✅ Asumsi Kebebasan Finansial disimpan');
}
};
// Wrapper global tipis ke FI.* — digabung dari backup-restore.js (v90),
// ditaruh persis di sebelah objek FI yang dibungkusnya. Dipakai HTML data-action/oninput & modules-render.js.
function fiInvestmentAssetValue(){return FI.investmentAssetValue();}
function fiAssetFund(){return FI.assetFund();}
function fiTotalDebt(){return FI.totalDebt();}
function fiNetAssetFund(){return FI.netAssetFund();}
function fiGetAssumptions(){return FI.getAssumptions();}
function fiMonthsOfDataAvailable(){return FI.monthsOfDataAvailable();}
function fiEffectiveMonths(){return FI.effectiveMonths();}
function fiAnnualExpense(){return FI.annualExpense();}
function fiTargetNominal(){return FI.targetNominal();}
function fiMonthlySurplus(){return FI.monthlySurplus();}
function fiEstimateMonthsToTarget(retOverride){return FI.estimateMonthsToTarget(retOverride);}
function fiFormatMonths(monthsToGo){return FI.formatMonths(monthsToGo);}
function fiCalcAge(iso){return FI.calcAge(iso);}
function selectFiAssetScope(v,el){return FI.selectAssetScope(v,el);}
function openFiSettingsModal(){return FI.openSettingsModal();}
function onFiCatTotalToggle(el){return FI.onCatTotalToggle(el);}
function getSelectedFiCatIds(){return FI.getSelectedCatIds();}
function saveFiSettings(){return FI.saveSettings();}
const DanaDaruratAI={
computeRecommendation(){
const avgBulanan=(typeof FI!=='undefined')?FI.annualExpense()/12:0;
const hasHarianIncome=(D.workDays||[]).length>0;
const monthsAvail=Math.min(6,(typeof FI!=='undefined'?FI.monthsOfDataAvailable():0)||0);
let cv=null;
if(monthsAvail>=3){
const now=new Date();
const monthlyIncomes=[];
for(let i=0;i<monthsAvail;i++){
const from=new Date(now.getFullYear(),now.getMonth()-i,1);
const to=new Date(now.getFullYear(),now.getMonth()-i+1,0,23,59,59);
const total=D.transactions.filter(t=>t.type==='income'&&new Date(t.date)>=from&&new Date(t.date)<=to).reduce((s,t)=>s+t.amount,0);
monthlyIncomes.push(total);
}
const mean=monthlyIncomes.reduce((a,b)=>a+b,0)/monthlyIncomes.length;
if(mean>0){
const variance=monthlyIncomes.reduce((s,v)=>s+Math.pow(v-mean,2),0)/monthlyIncomes.length;
cv=Math.sqrt(variance)/mean;
}
}
let multiplier=6,reason='pemasukan kamu tergolong stabil tiap bulan';
if(hasHarianIncome||(cv!==null&&cv>0.5)){
multiplier=12;
reason=hasHarianIncome?'pemasukan tercatat harian (Absensi/Payroll), biasanya lebih rentan bolong':'pemasukan bulananmu naik-turun cukup tajam (fluktuasi tinggi)';
} else if(cv!==null&&cv>0.25){
multiplier=9;
reason='pemasukan bulananmu cenderung naik-turun, jadi butuh cadangan lebih dari standar';
}
return{avgBulanan,multiplier,reason,recommended:Math.round((avgBulanan||0)*multiplier),cv,hasHarianIncome};
},
currentDD(){return(D.targets||[]).find(t=>t.isDanaDarurat)||null;},
currentSaved(dd){
dd=dd||DanaDaruratAI.currentDD();
if(!dd)return 0;
return dd.accountId?recalcAccBalance(dd.accountId):(dd.saved||0);
},
renderDash(){
const card=document.getElementById('dashDanaDaruratCard');
if(!card)return;
const rec=DanaDaruratAI.computeRecommendation();
const dd=DanaDaruratAI.currentDD();
card.classList.remove('u-dnone');card.style.display='block';
if(!rec.avgBulanan){
card.innerHTML=`<div class="card-title">🤖 Rekomendasi Dana Darurat</div><div class="u-fs12 u-t2 u-lh15">Belum cukup data transaksi buat hitung rekomendasi otomatis. Catat pemasukan & pengeluaran dulu ya, nanti rekomendasinya muncul di sini.</div>`;
return;
}
const rekomLine=`💡 Rekomendasi: <b class="u-ctext">${fmtFull(rec.recommended)}</b> (${rec.multiplier}× pengeluaran bulanan ≈${fmtFull(rec.avgBulanan)}) — ${rec.reason}.`;
if(!dd){
card.innerHTML=`<div class="card-title">🤖 Rekomendasi Dana Darurat <span class="card-collapse-toggle" id="dashDanaDaruratCard-chev" data-action="toggleCardCollapse" data-args='["dashDanaDaruratCard","$event"]' aria-label="Buka/tutup bagian">▾</span></div>
      <div class="card-collapse-body" id="dashDanaDaruratCard-cbody">
      <div class="u-fs12 u-t2 u-lh15 u-mb10">${rekomLine}</div>
      <div class="u-fs11 u-cacc2 u-mb8">⚠️ Belum ada Target Keuangan yang ditandai 🚨 Dana Darurat.</div>
      <button class="btn btn-primary btn-full btn-sm" data-action="DanaDaruratAI.createTargetFromRecommendation">+ Buat Target Dana Darurat (${fmtFull(rec.recommended)})</button>
      </div>`;
applyOneCardCollapsePref('dashDanaDaruratCard');
return;
}
const saved=DanaDaruratAI.currentSaved(dd);
const pct=rec.recommended>0?Math.min(100,Math.round((saved/rec.recommended)*100)):0;
const gap=Math.max(0,rec.recommended-saved);
const col=pct>=100?'var(--accent3)':pct>=50?'var(--accent4)':'var(--accent2)';
const acc=dd.accountId?D.accounts.find(a=>a.id===dd.accountId):null;
const sourceNote=acc?`🔗 Otomatis dari akun "${escapeHtml(acc.name)}"`:'💵 Saldo manual (mis. bank lokal)';
const editableRow=acc?'':`
      <div class="u-flex u-gap6 u-mt10">
        <input type="text" inputmode="numeric" class="fi" id="ddaSavedInput" placeholder="Nominal saat ini" value="${saved||''}">
        <button class="btn btn-primary btn-sm" data-action="DanaDaruratAI.updateSaved">Simpan</button>
      </div>
      <div class="u-fs10 u-t2 u-mt4 u-lh14">Isi/perbarui saldo Dana Darurat kamu di bank lokal di sini — otomatis sinkron 2 arah dengan Target "${escapeHtml(dd.name)}" di Pengaturan → Target Keuangan (edit di salah satu tempat, ikut berubah di tempat lain).</div>`;
card.innerHTML=`<div class="card-title">🤖 Rekomendasi Dana Darurat <span class="card-collapse-toggle" id="dashDanaDaruratCard-chev" data-action="toggleCardCollapse" data-args='["dashDanaDaruratCard","$event"]' aria-label="Buka/tutup bagian">▾</span></div>
    <div class="card-collapse-body" id="dashDanaDaruratCard-cbody">
    <div class="u-fs12 u-t2 u-lh15 u-mb8">${rekomLine}</div>
    <div class="u-flex u-jcb u-fs12 u-mb4"><span>${sourceNote}</span><span class="u-fw700">${fmtFull(saved)} (${pct}%)</span></div>
    <div class="prog-bar"><div class="prog-fill" style="width:${pct}%;background:${col}"></div></div>
    ${gap>0?`<div class="u-fs11 u-t2 u-mt6">Kurang ${fmtFull(gap)} lagi buat mencapai rekomendasi.</div>`:`<div class="u-fs11 u-cacc3 u-mt6">✅ Sudah mencapai/lebih dari rekomendasi saat ini.</div>`}
    ${editableRow}
    </div>`;
applyOneCardCollapsePref('dashDanaDaruratCard');
},
updateSaved(){
const input=document.getElementById('ddaSavedInput');
if(!input)return;
const dd=DanaDaruratAI.currentDD();
if(!dd){toast('⚠️ Target Dana Darurat tidak ditemukan');return;}
if(dd.accountId){toast('⚠️ Target ini tertaut ke akun, saldo ikut otomatis dari akunnya');return;}
const val=parsePzNum(input.value);
dd.saved=val;
save();
DanaDaruratAI.renderDash();
renderTarget();
if(typeof AlokasiAset!=='undefined')AlokasiAset.renderAll();
if(typeof LifeBalance!=='undefined')LifeBalance.render();
toast('✅ Saldo Dana Darurat diperbarui: '+fmtFull(val));
},
createTargetFromRecommendation(){
const rec=DanaDaruratAI.computeRecommendation();
openTargetModal();
document.getElementById('tDanaDarurat').checked=true;
onTargetDanaDaruratToggle();
if(rec.recommended>0)document.getElementById('tAmt').value=rec.recommended;
}
};
const Pensiun={
monthsOfDataAvailable(){ return (typeof FI!=='undefined')?FI.monthsOfDataAvailable():0; },
avgSurplus(){
const p=D.pensiun||{};
const wantMonths=Math.max(1,Math.min(24,Number(p.rekoBulan)||3));
const months=Math.max(1,Math.min(wantMonths,Pensiun.monthsOfDataAvailable()||1));
const now=new Date();
const from=new Date(now.getFullYear(),now.getMonth()-months+1,1);
const txs=(D.transactions||[]).filter(t=>{const d=new Date(t.date);return d>=from&&d<=now;});
const inc=txs.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
const exp=txs.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
return {surplus:(inc-exp)/months,months};
},
danaTerkumpul(){
const p=D.pensiun||{};
if(p.accId){ const acc=D.accounts.find(a=>a.id===p.accId); if(acc) return recalcAccBalance(acc.id); }
return 0;
},
sisaBulan(){
const p=D.pensiun||{};
const usiaSekarang=Number(p.usiaSekarang), usiaPensiun=Number(p.usiaPensiun);
if(!isFinite(usiaSekarang)||!isFinite(usiaPensiun)||usiaPensiun<=usiaSekarang) return 0;
return Math.round((usiaPensiun-usiaSekarang)*12);
},
proyeksi(){
const p=D.pensiun||{};
const n=Pensiun.sisaBulan();
const pv=Pensiun.danaTerkumpul();
const pmt=Number(p.kontribusiBulanan)||0;
let ret=Number(p.returnTahunan); if(!isFinite(ret)) ret=6;
const r=(ret/100)/12;
if(n<=0) return pv;
if(Math.abs(r)<1e-9) return pv+pmt*n;
const fv=pv*Math.pow(1+r,n)+pmt*((Math.pow(1+r,n)-1)/r);
return fv;
},
rekomendasiKontribusi(){
const p=D.pensiun||{};
const pct=Math.max(0,Math.min(100,Number(p.rekoPersen)||20));
const {surplus,months}=Pensiun.avgSurplus();
const reko=Math.max(0,Math.round((surplus*pct/100)/1000)*1000);
return {reko,surplus,months,pct};
},
render(){
const el=document.getElementById('pensiunBody');
if(!el) return;
const p=D.pensiun||{};
const acc=p.accId?D.accounts.find(a=>a.id===p.accId):null;
if(!p.usiaSekarang||!p.usiaPensiun||!acc){
el.innerHTML=`<div class="empty"><div class="empty-icon">🏖️</div><div class="empty-text">Belum diatur. Tap "⚙️ Atur" utk isi usia, target, & akun tabungan dana pensiun.</div></div>
        <button class="btn btn-primary btn-full btn-sm u-mt8" data-action="Pensiun.openSettings">⚙️ Atur Dana Pensiun Sekarang</button>`;
return;
}
const terkumpul=Pensiun.danaTerkumpul();
const proyeksi=Pensiun.proyeksi();
const target=Number(p.targetDana)||0;
const pct=target>0?Math.max(0,Math.min(100,Math.round(terkumpul/target*100))):0;
const n=Pensiun.sisaBulan();
const years=Math.floor(n/12), sisaBln=n%12;
const {reko,surplus,months,pct:rekoPct}=Pensiun.rekomendasiKontribusi();
let statusHtml;
if(target<=0){
statusHtml=`<div class="u-fs12t2">Isi Target Dana Pensiun di ⚙️ Atur supaya bisa dihitung gap-nya.</div>`;
} else if(proyeksi>=target){
statusHtml=`<div class="u-fs12 u-cacc3">✅ Proyeksi sudah melampaui target sebesar ${fmt(proyeksi-target)}, dgn kontribusi ${fmtFull(p.kontribusiBulanan||0)}/bln.</div>`;
} else {
statusHtml=`<div class="u-fs12 u-cacc2">⚠️ Proyeksi masih kurang ${fmt(target-proyeksi)} dari target dgn kontribusi ${fmtFull(p.kontribusiBulanan||0)}/bln.</div>`;
}
el.innerHTML=`
      <div class="grid3 u-mb10">
        <div class="stat-box"><div class="stat-label">Terkumpul</div><div class="stat-val green">${fmt(terkumpul)}</div></div>
        <div class="stat-box"><div class="stat-label">Proyeksi @Pensiun</div><div class="stat-val purple">${fmt(proyeksi)}</div></div>
        <div class="stat-box"><div class="stat-label">Target</div><div class="stat-val">${fmt(target)}</div></div>
      </div>
      <div class="budget-bar-track u-mb4" style="height:10px">
        <div class="budget-bar-fill" style="width:${pct}%"></div>
      </div>
      <div class="budget-bar-label u-mb10"><span>${pct}% dari target terkumpul</span><span class="u-t2">${years>0?years+' th ':''}${sisaBln} bln lagi (usia ${p.usiaSekarang}→${p.usiaPensiun})</span></div>
      ${statusHtml}
      <div class="u-fs12 u-t2 u-lh15" style="margin:10px 0">🔄 <b>Sync dari Keuangan:</b> rata-rata surplus ${months} bln terakhir = ${fmtFull(surplus)}. Rekomendasi kontribusi (${rekoPct}% dari surplus) = <b>${fmtFull(reko)}/bln</b>${acc?` ke akun ${acc.emoji} ${escapeHtml(acc.name)}`:''}.${Pensiun.monthsOfDataAvailable()<2?' ⚠️ Histori transaksi masih <2 bulan, jadi rata-rata surplus di atas masih kasar — cek lagi setelah datanya lebih panjang.':''}</div>
      <div class="btn-row3 u-mb8">
        <button class="btn btn-ghost" data-action="Pensiun.syncFromKeuangan">🔄 Sync Reko</button>
        <button class="btn btn-primary" data-action="Pensiun.catatKontribusi">💰 Catat Kontribusi</button>
        <button class="btn btn-ghost" data-action="Pensiun.openSettings">⚙️ Atur</button>
      </div>
      ${(p.riwayatKontribusi&&p.riwayatKontribusi.length)?`<div class="u-fs11 u-ctext3 u-mt4">Riwayat kontribusi tercatat: ${p.riwayatKontribusi.length}x, total ${fmtFull(p.riwayatKontribusi.reduce((s,r)=>s+(r.amount||0),0))}.</div>`:''}
    `;
},
openSettings(){
const p=D.pensiun||(D.pensiun={aktif:false,usiaSekarang:null,usiaPensiun:58,targetDana:0,returnTahunan:6,accId:'',kontribusiBulanan:0,rekoPersen:20,rekoBulan:3,riwayatKontribusi:[]});
const accSel=document.getElementById('pensAcc');
accSel.innerHTML='<option value="">— Pilih akun tabungan pensiun —</option>'+D.accounts.map(a=>`<option value="${a.id}">${a.emoji} ${escapeHtml(a.name)}</option>`).join('');
document.getElementById('pensUsiaSekarang').value=p.usiaSekarang||'';
document.getElementById('pensUsiaPensiun').value=p.usiaPensiun||58;
document.getElementById('pensTarget').value=p.targetDana||'';
accSel.value=p.accId||'';
document.getElementById('pensReturn').value=p.returnTahunan!=null?p.returnTahunan:6;
document.getElementById('pensKontribusi').value=p.kontribusiBulanan||'';
openModal('pensiunModal');
},
saveSettings(){
const p=D.pensiun||(D.pensiun={});
const usiaSekarang=parseInt(document.getElementById('pensUsiaSekarang').value);
const usiaPensiun=parseInt(document.getElementById('pensUsiaPensiun').value);
const target=parseFloat((document.getElementById('pensTarget').value||'0').toString().replace(/[^0-9.]/g,''));
const accId=document.getElementById('pensAcc').value;
const ret=parseFloat((document.getElementById('pensReturn').value||'').toString().replace(',','.'));
const kontribusi=parseFloat((document.getElementById('pensKontribusi').value||'0').toString().replace(/[^0-9.]/g,''));
if(!isFinite(usiaSekarang)||usiaSekarang<15||usiaSekarang>90){toast('⚠️ Isi usia sekarang yang valid (15-90)');return;}
if(!isFinite(usiaPensiun)||usiaPensiun<=usiaSekarang||usiaPensiun>90){toast('⚠️ Usia target pensiun harus lebih besar dari usia sekarang');return;}
if(!accId){toast('⚠️ Pilih akun tabungan dana pensiun dulu');return;}
p.usiaSekarang=usiaSekarang;
p.usiaPensiun=usiaPensiun;
p.targetDana=isFinite(target)?target:0;
p.accId=accId;
p.returnTahunan=isFinite(ret)?ret:6;
p.kontribusiBulanan=isFinite(kontribusi)?kontribusi:0;
p.aktif=true;
save();closeModal('pensiunModal');renderKeuangan();toast('✅ Dana Pensiun disimpan, tersambung ke akun (sync otomatis)');
},
syncFromKeuangan(){
const p=D.pensiun;
if(!p||!p.accId){toast('⚠️ Atur Dana Pensiun dulu (usia, target, akun)');return;}
const {reko}=Pensiun.rekomendasiKontribusi();
p.kontribusiBulanan=reko;
save();renderKeuangan();
toast(`🔄 Kontribusi bulanan disetel ke ${fmtFull(reko)} sesuai rata-rata surplus keuanganmu`);
},
async catatKontribusi(){
const p=D.pensiun;
if(!p||!p.accId){toast('⚠️ Atur Dana Pensiun dulu (usia, target, akun)');return;}
const toAcc=D.accounts.find(a=>a.id===p.accId);
if(!toAcc){toast('⚠️ Akun dana pensiun tidak ditemukan, atur ulang di ⚙️ Atur');return;}
const sumberOptions=D.accounts.filter(a=>a.id!==p.accId);
if(!sumberOptions.length){toast('⚠️ Butuh minimal 1 akun sumber selain akun dana pensiun');return;}
const defaultAmt=p.kontribusiBulanan||0;
const amtStr=await showPromptModal({
title:'Catat Kontribusi',
message:`Catat kontribusi ke ${toAcc.emoji} ${escapeHtml(toAcc.name)} — jumlah (Rp):`,
icon:'🏖️',inputType:'number',defaultValue:defaultAmt?Math.round(defaultAmt):''
});
if(amtStr===null) return;
const amt=parseFloat(amtStr.replace(/[^0-9.]/g,''));
if(!amt||amt<=0){toast('⚠️ Jumlah tidak valid');return;}
let fromAcc=sumberOptions[0];
if(sumberOptions.length>1){
const idx=await showChoiceModal({
title:'Ambil dari Akun Mana?',
choices:sumberOptions.map(a=>({label:`${a.emoji} ${a.name}`}))
});
if(idx===null) return;
if(!sumberOptions[idx]){toast('⚠️ Pilihan akun tidak valid');return;}
fromAcc=sumberOptions[idx];
}
const date=new Date().toISOString().split('T')[0];
D.transactions.push({id:uid(),type:'transfer_out',amount:amt,category:'Transfer',note:`Kontribusi Dana Pensiun → ${escapeHtml(toAcc.name)}`,date,accountId:fromAcc.id});
D.transactions.push({id:uid(),type:'transfer_in',amount:amt,category:'Transfer',note:`Kontribusi Dana Pensiun ← ${fromAcc.name}`,date,accountId:toAcc.id});
if(!p.riwayatKontribusi) p.riwayatKontribusi=[];
p.riwayatKontribusi.push({id:uid(),date,amount:amt,fromAcc:fromAcc.id});
save();renderDashboard();renderKeuangan();
toast(`✅ Kontribusi ${fmtFull(amt)} tercatat, saldo akun ter-update`);
},
renderDashMini(){
const el=document.getElementById('dashPensiunBody');
if(!el) return;
const p=D.pensiun||{};
const acc=p.accId?D.accounts.find(a=>a.id===p.accId):null;
if(!p.usiaSekarang||!p.usiaPensiun||!acc){
el.innerHTML=`<div class="u-fs12t2">Belum diatur — buka tab Uang utk mengatur target & akun dana pensiun.</div>`;
return;
}
const terkumpul=Pensiun.danaTerkumpul();
const target=Number(p.targetDana)||0;
const pct=target>0?Math.max(0,Math.min(100,Math.round(terkumpul/target*100))):0;
const proyeksi=Pensiun.proyeksi();
el.innerHTML=`
      <div class="u-flex u-jcb u-aic u-mb6">
        <span class="u-fs12t2">Terkumpul dari target</span>
        <span class="stat-val purple u-fs14">${pct}%</span>
      </div>
      <div class="budget-bar-track u-mb10" style="height:8px"><div class="budget-bar-fill" style="width:${pct}%"></div></div>
      <div class="grid2 u-mb0">
        <div class="stat-box"><div class="stat-label">Terkumpul</div><div class="stat-val green u-fs13">${fmt(terkumpul)}</div></div>
        <div class="stat-box"><div class="stat-label">Proyeksi @Pensiun</div><div class="stat-val u-fs13">${fmt(proyeksi)}</div></div>
      </div>
    `;
}
};
// FinCoach — "🩺 AI Financial Coach": insight PROAKTIF, rule-based & INSTAN (bukan panggilan
// AI/API — jadi TIDAK butuh API key & tidak ada biaya sama sekali), beda dari AIWidget (laporan
// lengkap 1x jalan, harus tap tombol dulu, WAJIB API key) yang sudah ada di
// features-aiwidget-reminder-gdrive-search.js. FinCoach otomatis dihitung ulang & tampil tiap buka
// Dashboard, mengecek beberapa sinyal keuangan/bisnis/hidup sekaligus (defisit bulan berjalan,
// anggaran jebol, tagihan telat/naik aneh, saldo minus, utang jatuh tempo, surplus FI negatif,
// margin bisnis Shop turun, target tabungan hampir tercapai) & menampilkan MAKS 4 yang paling
// mendesak dulu (urutan bahaya>peringatan>info>bagus) — supaya tidak perlu buka satu2 tiap halaman
// buat tahu ada masalah. Polanya sama seperti widget rule-based lain yg sudah ada (badge anomali
// tagihan di renderBillList(), Rekomendasi Servis AI, DanaDaruratAI di atas) — cuma FinCoach
// menggabungkan beberapa sinyal itu jadi SATU widget ringkasan di paling atas Dashboard.
const FinCoach={
DISMISS_LS_KEY:'kw_fincoach_dismissed',
compute(ctx){
const out=[];
// ctx (opsional) dioper dari renderDashboard() di modules-render.js supaya txM/inc/exp/billStats
// tidak dihitung ulang di sini kalau sudah dihitung di sana (1x scan D.transactions/D.bills per
// buka Dashboard, bukan 2x). Kalau dipanggil tanpa ctx (mis. dari FinCoach.dismiss()/showAll()
// yang tidak lewat renderDashboard()), tetap hitung sendiri sebagai fallback — supaya modul ini
// tetap bisa dipanggil independen kapan saja.
const now=(ctx&&ctx.now)||new Date();
const m=(ctx&&ctx.m!=null)?ctx.m:now.getMonth();
const y=(ctx&&ctx.y!=null)?ctx.y:now.getFullYear();
const txM=(ctx&&ctx.txM)||D.transactions.filter(t=>{const d=new Date(t.date);return d.getMonth()===m&&d.getFullYear()===y;});
const inc=(ctx&&ctx.inc!=null)?ctx.inc:txM.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
const exp=(ctx&&ctx.exp!=null)?ctx.exp:txM.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
// 1. Defisit bulan berjalan (pengeluaran > pemasukan bulan ini)
if(inc>0&&exp>inc){
out.push({id:'defisit',level:'danger',icon:'🔴',text:`Bulan ini pengeluaran (${fmtFull(exp)}) sudah melebihi pemasukan (${fmtFull(inc)}) — defisit ${fmtFull(exp-inc)}.`,action:{label:'Cek Laporan',page:'keuangan',navIdx:1}});
}
// 2. Anggaran paling parah (>=80% terpakai), ambil yang paling tinggi persennya
try{
if((D.budgets||[]).length){
const rows=D.budgets.map(b=>{
const used=D.transactions.filter(t=>{const d=new Date(t.date);return d.getMonth()===m&&d.getFullYear()===y&&budgetMatchesTx(b,t);}).reduce((s,t)=>s+t.amount,0);
const pct=b.limit>0?Math.round(used/b.limit*100):0;
return{b,pct};
}).filter(r=>r.pct>=80).sort((a,b)=>b.pct-a.pct);
if(rows.length){
const r=rows[0],over=r.pct>=100;
out.push({id:'budget-'+r.b.id,level:over?'danger':'warning',icon:over?'🔴':'🟠',text:`Anggaran "${escapeHtml(r.b.name)}" sudah ${r.pct}% terpakai${over?' (OVER)':''}${rows.length>1?` (+${rows.length-1} anggaran lain juga ketat)`:''}.`,action:{label:'Lihat Anggaran',page:'keuangan',navIdx:1}});
}
}
}catch(e){console.warn('FinCoach: gagal cek anggaran',e);}
// 3. Tagihan telat/segera jatuh tempo (pakai getBillStats() yg sudah ada, dipakai jg di dashBillCard —
// atau reuse ctx.billStats kalau sudah dihitung sekali oleh renderDashboard(), lihat catatan di atas)
try{
const s=(ctx&&ctx.billStats)||(typeof getBillStats==='function'?getBillStats():null);
if(s){
if(s.overdueCount>0){
out.push({id:'bill-overdue',level:'danger',icon:'🔴',text:`${s.overdueCount} tagihan/cicilan sudah lewat jatuh tempo (estimasi sisa tunggakan ${fmtFull(s.outstanding)}).`,action:{label:'Bayar Sekarang',page:'settings',navIdx:6}});
} else if(s.soonCount>0){
out.push({id:'bill-soon',level:'info',icon:'🔔',text:`${s.soonCount} tagihan jatuh tempo dalam 7 hari ke depan (total tagihan bulan ini ${fmtFull(s.monthTotal)}).`,action:{label:'Lihat Tagihan',page:'settings',navIdx:6}});
}
}
}catch(e){console.warn('FinCoach: gagal cek tagihan',e);}
// 4. Tagihan yang nominalnya naik signifikan dari biasanya (reuse getBillAnomalyInfo di tagihan-kalender.js)
try{
if(typeof getBillAnomalyInfo==='function'){
const anomalies=D.bills.map(b=>({b,info:getBillAnomalyInfo(b.id,b.amount)})).filter(x=>x.info);
if(anomalies.length){
anomalies.sort((a,b)=>b.info.pctChange-a.info.pctChange);
const top=anomalies[0];
out.push({id:'bill-anomaly-'+top.b.id,level:'warning',icon:'🟠',text:`Tagihan "${escapeHtml(top.b.name)}" naik ${top.info.pctChange}% dari rata-rata ${top.info.count}x terakhir (${fmtFull(top.info.avgPrev)}) — cek lagi sebelum bayar.`});
}
}
}catch(e){console.warn('FinCoach: gagal cek anomali tagihan',e);}
// 5. Saldo akun minus
try{
const negAcc=D.accounts.find(a=>recalcAccBalance(a.id)<0);
if(negAcc){
out.push({id:'acc-negative-'+negAcc.id,level:'danger',icon:'🔴',text:`Saldo akun "${escapeHtml(negAcc.name)}" minus (${fmtFull(recalcAccBalance(negAcc.id))}) — cek transaksi yang mungkin belum tercatat.`});
}
}catch(e){console.warn('FinCoach: gagal cek saldo akun',e);}
// 6. Utang belum lunas yang jatuh tempo dekat (<=7 hari, termasuk yang sudah lewat)
try{
const soonDebt=(D.debts||[]).filter(d=>!d.lunas&&d.jatuhTempo).map(d=>({d,diff:Math.ceil((new Date(d.jatuhTempo)-now)/(1000*60*60*24))})).filter(x=>x.diff<=7).sort((a,b)=>a.diff-b.diff);
if(soonDebt.length){
const x=soonDebt[0],late=x.diff<0;
out.push({id:'debt-due-'+x.d.id,level:late?'danger':'warning',icon:late?'🔴':'🟠',text:`Utang "${escapeHtml(x.d.name)}" (${fmtFull(x.d.nilai)}) ${late?'sudah lewat '+Math.abs(x.diff)+' hari dari':x.diff===0?'jatuh tempo hari ini':x.diff+' hari lagi ke'} tanggal jatuh tempo.`});
}
}catch(e){console.warn('FinCoach: gagal cek utang',e);}
// 7. Rata-rata surplus bulanan negatif (dipakai jg di FI) — sinyal dini progres Kebebasan Finansial mundur
try{
if(typeof fiMonthlySurplus==='function'&&D.transactions.length){
const surplus=fiMonthlySurplus();
if(surplus<0){
out.push({id:'fi-surplus-neg',level:'warning',icon:'🟠',text:`Rata-rata surplus bulananmu negatif (${fmtFull(surplus)}) — kalau pola ini terus, progres Kebebasan Finansial bisa mundur.`});
}
}
}catch(e){console.warn('FinCoach: gagal cek surplus FI',e);}
// 8. Bisnis Shop (Shop): margin profit bulan ini turun jauh (<=75%) dari bulan lalu, min. 3 transaksi biar tidak false-positive dari data sedikit
try{
const cobThis=D.cobek.filter(t=>{const d=new Date(t.date);return d.getMonth()===m&&d.getFullYear()===y;});
const prevD=new Date(y,m-1,1);
const cobPrev=D.cobek.filter(t=>{const d=new Date(t.date);return d.getMonth()===prevD.getMonth()&&d.getFullYear()===prevD.getFullYear();});
const marginOf=rows=>{const omzet=rows.reduce((s,t)=>s+(t.total||0),0);const profit=rows.reduce((s,t)=>s+(t.profit||0),0);return omzet>0?profit/omzet:null;};
const mThis=marginOf(cobThis),mPrev=marginOf(cobPrev);
if(mThis!=null&&mPrev!=null&&mPrev>0&&mThis<mPrev*0.75&&cobThis.length>=3){
out.push({id:'shop-margin',level:'warning',icon:'🟠',text:`Margin profit Shop bulan ini turun ke ${Math.round(mThis*100)}% (bulan lalu ${Math.round(mPrev*100)}%) — cek lagi harga modal/jual produk terbaru.`,action:{label:'Lihat Shop',page:'shop',navIdx:2}});
}
}catch(e){console.warn('FinCoach: gagal cek margin Shop',e);}
// 9. Target tabungan yang hampir tercapai (90-99%) — penguat positif, bukan cuma peringatan melulu
try{
const near=(D.targets||[]).filter(t=>t.amount>0).map(t=>({t,pct:Math.round((t.saved/t.amount)*100)})).filter(x=>x.pct>=90&&x.pct<100).sort((a,b)=>b.pct-a.pct)[0];
if(near){
out.push({id:'target-near-'+near.t.id,level:'good',icon:'🟢',text:`Target "${escapeHtml(near.t.name)}" sudah ${near.pct}% — tinggal sedikit lagi tercapai! 🎉`});
}
}catch(e){console.warn('FinCoach: gagal cek target tabungan',e);}
// 10. v179: hari kerja minggu ini jauh di bawah rata-rata minggu² sebelumnya (dari
// D.gajiMingguanHistory, dicatat tiap confirmWeeklyReset()) — sinyal dini kalau ada absen/bolos
// yang mungkin tidak disadari, sebelum kelihatan di gaji minggu depan.
try{
if(typeof getWeekRange==='function'&&(D.gajiMingguanHistory||[]).length>=3){
const hist=D.gajiMingguanHistory.slice(-8);
const avgCount=hist.reduce((s,h)=>s+(h.count||0),0)/hist.length;
const {start:wStart,end:wEnd}=getWeekRange(now);
wEnd.setHours(23,59,59,999);
const thisWeekCount=(D.workDays||[]).filter(w=>{const d=new Date(w.date);return d>=wStart&&d<=wEnd;}).length;
const dayOfWeek=now.getDay();
// hanya tampil kalau sudah pertengahan minggu (Rabu=3) ke atas biar tidak false-alarm di awal minggu
if(dayOfWeek>=3&&avgCount>=2&&thisWeekCount<avgCount*0.5){
out.push({id:'wh-lowdays',level:'info',icon:'🔔',text:`Hari kerja minggu ini baru ${thisWeekCount} hari, jauh di bawah rata-rata ${avgCount.toFixed(1)} hari/minggu dari histori — cek lagi Absensi kalau ada yang belum dicatat.`,action:{label:'Cek Absensi',page:'dashboard'}});
}
}
}catch(e){console.warn('FinCoach: gagal cek hari kerja mingguan',e);}
// Kalau tidak ada satupun sinyal bahaya/peringatan, kasih 1 insight positif biar widget tidak
// kosong & user tetap tahu semua indikator utama aman (bukan cuma diam kalau memang aman).
if(!out.some(o=>o.level==='danger'||o.level==='warning')&&inc>0){
const rasio=Math.round(((inc-exp)/inc)*100);
out.push({id:'all-good',level:'good',icon:'🟢',text:`Semua indikator utama aman bulan ini — surplus ${fmtFull(inc-exp)} (${rasio}% dari pemasukan). Pertahankan! 👍`});
}
const order={danger:0,warning:1,info:2,good:3};
out.sort((a,b)=>order[a.level]-order[b.level]);
return out;
},
dismissedIds(){
try{return JSON.parse(localStorage.getItem(FinCoach.DISMISS_LS_KEY)||'[]');}catch(e){return[];}
},
dismiss(id){
const cur=FinCoach.dismissedIds();
if(!cur.includes(id))cur.push(id);
try{localStorage.setItem(FinCoach.DISMISS_LS_KEY,JSON.stringify(cur.slice(-40)));}catch(e){}
FinCoach.renderDash();
},
renderDash(ctx){
const body=document.getElementById('finCoachBody');
if(!body)return;
let insights;
try{ insights=FinCoach.compute(ctx); }catch(e){ console.warn('FinCoach: gagal hitung insight',e); insights=[]; }
const dismissed=FinCoach.dismissedIds();
insights=insights.filter(x=>!dismissed.includes(x.id));
const tabBtn=document.getElementById('advisorTabBtn-coach');
if(tabBtn)tabBtn.textContent='🩺 Insight Cepat'+(insights.length?` (${insights.length})`:'');
if(!insights.length){
body.innerHTML=`<div class="u-fs12 u-t2 u-lh15">Belum cukup data buat cek insight otomatis, atau semua indikator sudah aman. Catat transaksi rutin dulu ya, insight bakal muncul otomatis di sini.</div>`;
return;
}
const top=insights.slice(0,4);
const colFor={danger:'var(--accent2)',warning:'var(--accent4)',info:'var(--accent)',good:'var(--accent3)'};
body.innerHTML=top.map(x=>`
      <div class="u-flex u-gap8 u-mb8" style="align-items:flex-start;border-left:3px solid ${colFor[x.level]};padding-left:8px">
        <div class="u-flex1 u-fs12 u-lh15">${x.icon} ${x.text}${x.action?` <span class="u-cacc u-pointer u-fw700" data-action="showPage" data-args='["${x.action.page}","$nav:${x.action.navIdx}"]'>${escapeHtml(x.action.label)} →</span>`:''}</div>
        <span class="u-fs11 u-pointer" style="color:var(--text3)" data-stop="1" data-action="FinCoach.dismiss" data-args="${escapeHtml(JSON.stringify([x.id]))}" title="Sembunyikan" aria-label="Sembunyikan">✕</span>
      </div>`).join('')
+(insights.length>top.length?`<div class="u-fs12 u-cacc u-tar u-pointer" data-action="FinCoach.showAll">Lihat semua (${insights.length}) →</div>`:'');
},
showAll(){
const insights=FinCoach.compute().filter(x=>!FinCoach.dismissedIds().includes(x.id));
if(!insights.length){toast('✅ Tidak ada insight tersisa, semua sudah dicek!');return;}
showAlertModal(insights.map(x=>x.icon+' '+x.text).join('\n\n'),{title:'🩺 Semua Insight Financial Coach',icon:'🩺'});
}
};
const Kekayaan={
currentNetWorth(){
return totalSaldoAkun()+totalAssetValue()+totalPiutangValue()-((D.pajakZakat&&D.pajakZakat.utangJT)||0)-totalDebtValue();
},
saveSnapshot(manual){
const today=todayStr();
const nw=Kekayaan.currentNetWorth();
if(!D.wealthSnapshots)D.wealthSnapshots=[];
const existing=D.wealthSnapshots.find(s=>s.date===today);
if(existing){
existing.netWorth=nw;
if(manual)existing.auto=false;
} else {
D.wealthSnapshots.push({id:uid(),date:today,netWorth:nw,auto:!manual});
}
D.wealthSnapshots.sort((a,b)=>a.date.localeCompare(b.date));
save();
Kekayaan.renderSnapshots();
renderFinancialFreedom();
if(manual)toast('✅ Snapshot kekayaan tersimpan: '+fmtFull(nw));
},
autoSnapshotIfNeeded(){
if(!D.wealthSnapshots)D.wealthSnapshots=[];
if(!D.accounts.length&&!(D.assets||[]).length)return;
const ym=todayStr().slice(0,7);
if(D.wealthSnapshots.some(s=>s.date.slice(0,7)===ym))return;
Kekayaan.saveSnapshot(false);
},
async deleteSnapshot(id){
if(!await askConfirm('Hapus snapshot kekayaan ini?',{okText:'Ya, Hapus'}))return;
D.wealthSnapshots=(D.wealthSnapshots||[]).filter(s=>!sameId(s.id,id));
save();
Kekayaan.renderSnapshots();
renderFinancialFreedom();
},
actualCAGR(){
const list=(D.wealthSnapshots||[]).slice().sort((a,b)=>a.date.localeCompare(b.date));
if(list.length<2)return null;
const first=list[0],last=list[list.length-1];
const days=(new Date(last.date)-new Date(first.date))/86400000;
if(days<25)return null;
const years=days/365;
if(first.netWorth<=0)return {cagr:null,first,last,years,reason:'baseline-negative'};
if(last.netWorth<=0)return {cagr:null,first,last,years,reason:'latest-negative'};
const cagr=Math.pow(last.netWorth/first.netWorth,1/years)-1;
return {cagr,first,last,years,reason:null};
},
renderSnapshots(){
const listEl=document.getElementById('wealthSnapshotList');
if(!listEl)return;
const list=(D.wealthSnapshots||[]).slice().sort((a,b)=>b.date.localeCompare(a.date));
if(!list.length){
listEl.innerHTML='<div class="empty"><div class="empty-icon">📸</div><div class="empty-text">Belum ada snapshot kekayaan tercatat</div></div>';
} else {
const WEALTH_SNAPSHOT_SHOW_LIMIT=24;
const visible=list.slice(0,WEALTH_SNAPSHOT_SHOW_LIMIT);
listEl.innerHTML=visible.map((s,i)=>{
const prev=list[i+1];
let deltaHtml='';
if(prev){
const delta=s.netWorth-prev.netWorth;
const pct=prev.netWorth!==0?(delta/Math.abs(prev.netWorth)*100):0;
deltaHtml=`<div class="tx-meta">${delta>=0?'▲':'▼'} ${fmtFull(Math.abs(delta))} (${delta>=0?'+':'-'}${Math.abs(pct).toFixed(1)}%) vs snapshot sebelumnya</div>`;
}
return `<div class="tx-item"><div class="tx-icon u-bgaccsoft">📸</div><div class="tx-info"><div class="tx-name">${s.date}${s.auto?' <span class="u-fs10 u-t2 u-r6 u-ml4" style="border:1px solid var(--border2);padding:1px 5px">Otomatis</span>':''}</div>${deltaHtml}</div><div class="tx-amount">${fmtFull(s.netWorth)}</div><button class="tx-del" data-action="delWealthSnapshot" data-args="${escapeHtml(JSON.stringify([s.id]))}" aria-label="Hapus">🗑</button></div>`;
}).join('')+(list.length>WEALTH_SNAPSHOT_SHOW_LIMIT?`<div class="u-tac u-fs12 u-t2" style="padding:8px 0">+${list.length-WEALTH_SNAPSHOT_SHOW_LIMIT} snapshot lebih lama (tidak ditampilkan, tapi tetap tersimpan & ikut dihitung ke growth rate)</div>`:'');
}
const summaryEl=document.getElementById('wealthGrowthSummary');
if(!summaryEl)return;
const result=Kekayaan.actualCAGR();
if(!result){
summaryEl.style.display='none';
} else if(result.reason){
summaryEl.classList.remove('u-dnone');summaryEl.style.display='block';
const cagrEl=document.getElementById('wealthCAGR');
cagrEl.textContent='—';
cagrEl.className='stat-val red';
const msg=result.reason==='latest-negative'
? `Kekayaan Bersih TERAKHIR (${result.last.date}: ${fmtFullSigned(result.last.netWorth)}) sedang negatif (utang > aset), jadi growth rate % tidak bisa dihitung. Lunasi/kurangi utang dulu supaya bisa dilihat lagi.`
: `Snapshot AWAL (${result.first.date}: ${fmtFullSigned(result.first.netWorth)}) negatif/nol, jadi tidak bisa jadi basis hitungan growth rate %.`;
document.getElementById('wealthCAGRNote').textContent=msg;
} else {
summaryEl.classList.remove('u-dnone');summaryEl.style.display='block';
const pct=result.cagr*100;
const cagrEl=document.getElementById('wealthCAGR');
cagrEl.textContent=(pct>=0?'+':'')+pct.toFixed(1)+'%/tahun';
cagrEl.className='stat-val '+(pct>=0?'purple':'red');
document.getElementById('wealthCAGRNote').textContent=`Dihitung dari snapshot ${result.first.date} (${fmtFull(result.first.netWorth)}) → ${result.last.date} (${fmtFull(result.last.netWorth)}), ≈${result.years.toFixed(1)} tahun. Bandingkan dgn Asumsi Return di ⚙️ Atur Asumsi FI — kalau jauh beda, sesuaikan asumsinya.`;
}
},
renderBersih(){
const saldoAkun=totalSaldoAkun();
const totalAset=totalAssetValue();
const totalPiutang=totalPiutangValue();
const utangManual=D.pajakZakat.utangJT||parsePzNum(document.getElementById('zmUtang')?document.getElementById('zmUtang').value:0);
const utang=utangManual+totalDebtValue()+totalCicilanOutstanding();
const netWorth=saldoAkun+totalAset+totalPiutang-utang;
document.getElementById('kbSaldoAkun').textContent=fmtFull(saldoAkun);
document.getElementById('kbTotalAset').textContent=fmtFull(totalAset);
document.getElementById('kbPiutang').textContent=fmtFull(totalPiutang);
document.getElementById('kbUtang').textContent=fmtFull(utang);
const netEl=document.getElementById('kbNetWorth');
netEl.textContent=fmtFullSigned(netWorth);
netEl.style.color=netWorth<0?'var(--accent2)':'';
Kekayaan.renderSnapshots();
}
};
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
const stokWarn=p.stock<=2?'style="color:var(--accent2)"':'';
const kat=shopKategoriName(p.kategoriId);
const prod=p.produsenId?(D.produsen.find(pr=>pr.id===p.produsenId)||{}).name:'';
const metaTag=[kat?('🏷️ '+escapeHtml(kat)):'',prod?('🏭 '+escapeHtml(prod)):''].filter(Boolean).join(' · ');
return`<div class="tx-item">
        <div class="tx-icon u-bgaccsoft">🪨</div>
        <div class="tx-info"><div class="tx-name">${escapeHtml(p.name)}</div><div class="tx-meta">Stok: <span ${stokWarn}>${p.stock}</span> · Modal ${fmt(p.hargaBeli)} → Jual ${fmt(p.hargaJual)}${p.hargaReseller?' · Reseller '+fmt(p.hargaReseller):''}</div>${metaTag?`<div class="tx-meta u-mt2">${metaTag}</div>`:''}</div>
        <div class="tx-amount green">+${fmt(margin)}</div>
        <button class="tx-del u-bgaccsoft u-cacc" style="margin-right:6px" data-action="openProductModal" data-args="${escapeHtml(JSON.stringify([i]))}" aria-label="Edit/Buka">✏️</button>
        <button class="tx-del" data-action="delProduct" data-args="${escapeHtml(JSON.stringify([i]))}" aria-label="Hapus">🗑</button>
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

// piutang-utang.js — Domain Piutang & Utang: catatan piutang (uang dipinjamkan), utang (uang dipinjam) beserta status lunas/cicilan, dan DebtStrategy (simulasi strategi pelunasan Avalanche/Snowball).
// Juga berisi Bill (helper hubungkan transaksi lama ke riwayat tagihan) — domain tagihan/cicilan, dipindah dari file etalase.
// Dipisah dari: features-etalase-piutang-renovai.js (sesi pemisahan domain Piutang/Utang, lanjutan roadmap PEMISAHAN-FILE-ROADMAP.md).
// DebtStrategy dipindah dari features-edukasi-pajak-utang-sewakios.js (v56) — gabung ke sini krn 1 domain (utang) & sudah dipakai Debt.renderList() di file yang sama.
// PENTING: harus dimuat sesuai urutan build.js (GROUP_A) — Debt.renderList() memanggil DebtStrategy.render() (sekarang di file yang sama, tidak perlu lagi guarded typeof check tapi tetap dipertahankan untuk jaga-jaga).
// PENTING: DebtStrategy.computeDSR() memanggil WorthIt (di worthit.js, guarded typeof check, aman krn runtime call — walau worthit.js sekarang dimuat SETELAH piutang-utang.js di urutan GROUP_A, tetap aman krn guard & dipanggil runtime setelah semua file ter-load, bukan saat load).
// PENTING: Bill.openLinkTxModal() memakai curBillHistoryId (dideklarasikan di tagihan-kalender.js) & LinkTx (di linktx.js) — dipanggil saat runtime (dari klik tombol), bukan saat load, jadi aman walau dideklarasikan di file lain asalkan semua file ikut ter-load (selalu, lewat build.js).

const Piutang={
editId:null,
_lunasState:false,
openModal(id){
Piutang.editId=id||null;
const p=id?D.piutang.find(x=>sameId(x.id,id)):null;
document.getElementById('piutangModalTitle').textContent=p?'Edit Piutang':'Tambah Piutang';
document.getElementById('piutangName').value=p?p.name:'';
document.getElementById('piutangNilai').value=p?p.nilai:'';
document.getElementById('piutangTanggal').value=p?(p.tanggal||''):todayStr();
document.getElementById('piutangJatuhTempo').value=p?(p.jatuhTempo||''):'';
document.getElementById('piutangCatatan').value=p?(p.catatan||''):'';
Piutang._lunasState=p?!!p.lunas:false;
const btn=document.getElementById('piutangLunasBtn');
btn.textContent=Piutang._lunasState?'✓ Lunas':'Belum Lunas';
btn.className='chip-btn'+(Piutang._lunasState?' active':'');
openModal('piutangModal');
},
toggleLunas(){
Piutang._lunasState=!Piutang._lunasState;
const btn=document.getElementById('piutangLunasBtn');
btn.textContent=Piutang._lunasState?'✓ Lunas':'Belum Lunas';
btn.className='chip-btn'+(Piutang._lunasState?' active':'');
},
save(){
const name=document.getElementById('piutangName').value.trim();
if(!name){toast('⚠️ Nama peminjam wajib diisi');return;}
const nilai=parsePzNum(document.getElementById('piutangNilai').value);
const tanggal=document.getElementById('piutangTanggal').value||'';
const jatuhTempo=document.getElementById('piutangJatuhTempo').value||'';
const catatan=document.getElementById('piutangCatatan').value.trim();
if(Piutang.editId){
const p=D.piutang.find(x=>sameId(x.id,Piutang.editId));
if(!p){toast('⚠️ Piutang tidak ditemukan, coba tutup dan buka lagi');return;}
Object.assign(p,{name,nilai,tanggal,jatuhTempo,catatan,lunas:Piutang._lunasState});
} else {
D.piutang.push({id:uid(),name,nilai,tanggal,jatuhTempo,catatan,lunas:Piutang._lunasState});
}
save();
closeModal('piutangModal');
Piutang.renderList();renderKekayaanBersih();hitungZakatMaal();
toast('✅ Piutang tersimpan');
},
async delete(id){
if(!await askConfirm('Hapus catatan piutang ini?',{okText:'Ya, Hapus'}))return;
D.piutang=D.piutang.filter(p=>!sameId(p.id,id));
save();
Piutang.renderList();renderKekayaanBersih();hitungZakatMaal();
},
totalValue(){return(D.piutang||[]).filter(p=>!p.lunas).reduce((s,p)=>s+(p.nilai||0),0);},
overdueDays(p){
if(p.lunas||!p.jatuhTempo)return 0;
const jt=new Date(p.jatuhTempo);
if(isNaN(jt.getTime()))return 0;
const today=new Date();today.setHours(0,0,0,0);jt.setHours(0,0,0,0);
const diff=Math.round((today-jt)/86400000);
return diff>0?diff:0;
},
sortedActive(){
const active=(D.piutang||[]).filter(p=>!p.lunas);
return active.slice().sort((a,b)=>{
const oa=Piutang.overdueDays(a),ob=Piutang.overdueDays(b);
if(oa>0&&ob>0)return(ob*(b.nilai||0))-(oa*(a.nilai||0));
if(oa>0)return -1;
if(ob>0)return 1;
if(a.jatuhTempo&&b.jatuhTempo)return new Date(a.jatuhTempo)-new Date(b.jatuhTempo);
if(a.jatuhTempo)return -1;
if(b.jatuhTempo)return 1;
return(b.nilai||0)-(a.nilai||0);
});
},
renderList(){
const el=document.getElementById('piutangList');
if(!el)return;
const list=D.piutang||[];
if(!list.length){el.innerHTML='<div class="empty"><div class="empty-icon">🤝</div><div class="empty-text">Belum ada piutang tercatat</div></div>';return;}
const today=new Date().toISOString().slice(0,10);
const active=Piutang.sortedActive();
const lunas=list.filter(p=>p.lunas);
const topOverdueDays=active.length?Piutang.overdueDays(active[0]):0;
let summaryHtml='';
if(topOverdueDays>0){
summaryHtml=`<div class="u-fs12 u-cacc2 u-r10 u-mb10 u-lh15" style="padding:9px 11px;background:var(--accent2-soft)">🔥 <b>Prioritas tagih: ${escapeHtml(active[0].name)}</b> — ${fmt(active[0].nilai)}, sudah lewat jatuh tempo ${topOverdueDays} hari. Piutang yang telat lama & nominalnya besar makin berisiko jadi macet, tagih ini duluan.</div>`;
}
const ordered=[...active,...lunas];
el.innerHTML=summaryHtml+ordered.map((p,idx)=>{
const overdue=!p.lunas&&p.jatuhTempo&&p.jatuhTempo<today;
const isPrioritas=idx===0&&topOverdueDays>0&&!p.lunas;
const od=overdue?Piutang.overdueDays(p):0;
const metaParts=[];
if(p.jatuhTempo)metaParts.push(overdue?`⚠️ Telat ${od} hari (jatuh tempo ${p.jatuhTempo})`:'Jatuh tempo '+p.jatuhTempo);
if(p.catatan)metaParts.push(escapeHtml(p.catatan));
const badge=p.lunas?' <span class="u-fs10 u-cacc3 u-r6 u-ml4" style="border:1px solid var(--accent3);padding:1px 5px">Lunas</span>'
:(isPrioritas?' <span class="u-fs10 u-r6 u-ml4" style="color:#fff;background:var(--accent2);padding:1px 5px">🔥 Prioritas</span>'
:(overdue?' <span class="u-fs10 u-cacc2 u-r6 u-ml4" style="border:1px solid var(--accent2);padding:1px 5px">Jatuh Tempo</span>':''));
return `<div class="tx-item u-pointer" data-action="openPiutangModal" data-args="${escapeHtml(JSON.stringify([p.id]))}"><div class="tx-icon u-bgaccsoft">🤝</div><div class="tx-info"><div class="tx-name">${escapeHtml(p.name)}${badge}</div><div class="tx-meta">${metaParts.join(' · ')}</div></div><div class="tx-amount${p.lunas?'':' green'}">${fmt(p.nilai)}</div><button class="tx-del" data-stop="1" data-action="delPiutang" data-args="${escapeHtml(JSON.stringify([p.id]))}" aria-label="Hapus">🗑</button></div>`;
}).join('');
}
};
const Debt={
editId:null,
_lunasState:false,
openModal(id){
Debt.editId=id||null;
const d=id?D.debts.find(x=>sameId(x.id,id)):null;
document.getElementById('debtModalTitle').textContent=d?'Edit Utang':'Tambah Utang';
document.getElementById('debtName').value=d?d.name:'';
document.getElementById('debtNilai').value=d?d.nilai:'';
document.getElementById('debtBunga').value=d?(d.bunga||''):'';
document.getElementById('debtCicilan').value=d?(d.cicilanBulanan||''):'';
document.getElementById('debtTanggal').value=d?(d.tanggal||''):todayStr();
document.getElementById('debtJatuhTempo').value=d?(d.jatuhTempo||''):'';
document.getElementById('debtCatatan').value=d?(d.catatan||''):'';
updateAmtPreview('debtNilai','debtNilaiPreview');
updateAmtPreview('debtCicilan','debtCicilanPreview');
Debt._lunasState=d?!!d.lunas:false;
const btn=document.getElementById('debtLunasBtn');
btn.textContent=Debt._lunasState?'✓ Lunas':'Belum Lunas';
btn.className='chip-btn'+(Debt._lunasState?' active':'');
openModal('debtModal');
},
toggleLunas(){
Debt._lunasState=!Debt._lunasState;
const btn=document.getElementById('debtLunasBtn');
btn.textContent=Debt._lunasState?'✓ Lunas':'Belum Lunas';
btn.className='chip-btn'+(Debt._lunasState?' active':'');
},
save(){
const name=document.getElementById('debtName').value.trim();
if(!name){toast('⚠️ Nama pemberi pinjaman wajib diisi');return;}
const nilai=parsePzNum(document.getElementById('debtNilai').value);
const bunga=parseFloat(document.getElementById('debtBunga').value)||0;
const cicilanBulanan=parsePzNum(document.getElementById('debtCicilan').value);
const tanggal=document.getElementById('debtTanggal').value||'';
const jatuhTempo=document.getElementById('debtJatuhTempo').value||'';
const catatan=document.getElementById('debtCatatan').value.trim();
let d;
if(Debt.editId){
d=D.debts.find(x=>sameId(x.id,Debt.editId));
if(!d){toast('⚠️ Utang tidak ditemukan, coba tutup dan buka lagi');return;}
Object.assign(d,{name,nilai,bunga,cicilanBulanan,tanggal,jatuhTempo,catatan,lunas:Debt._lunasState});
} else {
d={id:uid(),name,nilai,bunga,cicilanBulanan,tanggal,jatuhTempo,catatan,lunas:Debt._lunasState};
D.debts.push(d);
}
Debt.syncBill(d);
save();
closeModal('debtModal');
Debt.renderList();renderKekayaanBersih();hitungZakatMaal();renderBillList();checkBills();
toast('✅ Utang tersimpan');
},
syncBill(d){
const shouldHaveBill=!d.lunas&&(d.cicilanBulanan||0)>0;
let bill=(d.billId?D.bills.find(b=>sameId(b.id,d.billId)):null)||D.bills.find(b=>b.kind==='utang'&&sameId(b.debtId,d.id));
if(!shouldHaveBill){
if(bill){D.bills=D.bills.filter(b=>b!==bill);}
d.billId=null;
return;
}
const today=new Date().toISOString().slice(0,10);
const defaultNextDue=()=>{const dt=new Date();dt.setMonth(dt.getMonth()+1);return dt.toISOString().split('T')[0];};
if(bill){
bill.name='Cicilan: '+d.name;
bill.amount=d.cicilanBulanan;
bill.debtId=d.id;
if(!bill.nextDue||bill.nextDue<today)bill.nextDue=(d.jatuhTempo&&d.jatuhTempo>=today)?d.jatuhTempo:defaultNextDue();
} else {
bill={id:uid(),name:'Cicilan: '+d.name,amount:d.cicilanBulanan,nextDue:(d.jatuhTempo&&d.jatuhTempo>=today)?d.jatuhTempo:defaultNextDue(),freq:'bulanan',category:'Utang',subcategory:'',accountId:(D.accounts[0]&&D.accounts[0].id)||'',note:'Auto tersinkron dari Buku Utang — bayar di sini otomatis mengurangi sisa utang',kind:'utang',debtId:d.id};
D.bills.push(bill);
}
d.billId=bill.id;
},
async delete(id){
if(!await askConfirm('Hapus catatan utang ini?',{okText:'Ya, Hapus'}))return;
const d=D.debts.find(x=>sameId(x.id,id));
if(d&&d.billId){D.bills=D.bills.filter(b=>!sameId(b.id,d.billId));}
D.debts=D.debts.filter(d=>!sameId(d.id,id));
save();
Debt.renderList();renderKekayaanBersih();hitungZakatMaal();renderBillList();checkBills();
},
totalValue(){return(D.debts||[]).filter(d=>!d.lunas).reduce((s,d)=>s+(d.nilai||0),0);},
totalCicilanBulanan(){return(D.debts||[]).filter(d=>!d.lunas).reduce((s,d)=>s+(d.cicilanBulanan||0),0);},
renderList(){
const el=document.getElementById('debtList');
if(!el)return;
const list=D.debts||[];
document.getElementById('debtTotalVal').textContent=fmtFull(Debt.totalValue());
document.getElementById('debtCicilanVal').textContent=fmtFull(Debt.totalCicilanBulanan());
if(!list.length){el.innerHTML='<div class="empty"><div class="empty-icon">📕</div><div class="empty-text">Belum ada utang tercatat</div></div>';return;}
const today=new Date().toISOString().slice(0,10);
el.innerHTML=list.map(d=>{
const overdue=!d.lunas&&d.jatuhTempo&&d.jatuhTempo<today;
const metaParts=[];
if(d.bunga)metaParts.push('Bunga '+d.bunga+'%/th');
if(d.cicilanBulanan)metaParts.push('Cicilan '+fmt(d.cicilanBulanan)+'/bln');
if(d.jatuhTempo)metaParts.push((overdue?'⚠️ Lewat jatuh tempo ':'Jatuh tempo ')+d.jatuhTempo);
if(d.catatan)metaParts.push(escapeHtml(d.catatan));
return `<div class="tx-item u-pointer" data-action="openDebtModal" data-args="${escapeHtml(JSON.stringify([d.id]))}"><div class="tx-icon" style="background:var(--accent2-soft)">📕</div><div class="tx-info"><div class="tx-name">${escapeHtml(d.name)}${d.lunas?' <span style=\\"font-size:10px;color:var(--accent3);border:1px solid var(--accent3);border-radius:6px;padding:1px 5px;margin-left:4px\\">Lunas</span>':(overdue?' <span style=\\"font-size:10px;color:var(--accent2);border:1px solid var(--accent2);border-radius:6px;padding:1px 5px;margin-left:4px\\">Jatuh Tempo</span>':'')}</div><div class="tx-meta">${metaParts.join(' · ')}</div></div><div class="tx-amount${d.lunas?'':' red'}">${fmt(d.nilai)}</div><button class="tx-del" data-stop="1" data-action="delDebt" data-args="${escapeHtml(JSON.stringify([d.id]))}" aria-label="Hapus">🗑</button></div>`;
}).join('');
if(typeof DebtStrategy!=='undefined')DebtStrategy.render();
}
};
const DebtStrategy={
setMethod(method){
D.debtStrategy=D.debtStrategy||{};
D.debtStrategy.method=method;
save();
DebtStrategy.render();
},
onExtraInput(){
const el=document.getElementById('dsExtra');
if(!el)return;
D.debtStrategy=D.debtStrategy||{};
D.debtStrategy.extra=parsePzNum(el.value);
save();
DebtStrategy.render();
},
activeDebts(){
return(D.debts||[]).filter(d=>!d.lunas&&(d.nilai||0)>0);
},
computeOrder(list,method){
const arr=list.slice();
if(method==='snowball')arr.sort((a,b)=>(a.nilai||0)-(b.nilai||0));
else arr.sort((a,b)=>(b.bunga||0)-(a.bunga||0));
return arr;
},
computeDSR(){
const totalCicilanUtang=(typeof Debt!=='undefined')?Debt.totalCicilanBulanan():0;
const totalCicilanLain=(D.bills||[]).filter(b=>b.kind==='cicilan'&&b.sisaTenor!=null).reduce((s,b)=>s+(b.amount||0),0);
const totalCicilan=totalCicilanUtang+totalCicilanLain;
const incAvg=(typeof WorthIt!=='undefined')?WorthIt.incomeAvg():0;
const pct=incAvg>0?(totalCicilan/incAvg)*100:null;
return{totalCicilanUtang,totalCicilanLain,totalCicilan,incAvg,pct};
},
simulate(orderedDebts,extraMonthly){
const simDebts=orderedDebts.filter(d=>(d.cicilanBulanan||0)>0).map(d=>({id:d.id,bunga:d.bunga||0,cicilanBulanan:d.cicilanBulanan,balance:d.nilai||0}));
if(!simDebts.length)return{months:null,totalInterest:0,payoffMonth:{}};
extraMonthly=extraMonthly||0;
const MAX_MONTHS=600;
let month=0,totalInterest=0;
const payoffMonth={};
while(simDebts.some(d=>d.balance>0.5)&&month<MAX_MONTHS){
month++;
simDebts.forEach(d=>{
if(d.balance<=0)return;
const interest=d.balance*(d.bunga/100/12);
totalInterest+=interest;
d.balance+=interest;
});
let pool=extraMonthly;
simDebts.forEach(d=>{if(d.balance<=0)pool+=d.cicilanBulanan;});
simDebts.forEach(d=>{
if(d.balance<=0)return;
d.balance-=Math.min(d.cicilanBulanan,d.balance);
});
for(const d of simDebts){
if(pool<=0)break;
if(d.balance<=0)continue;
const pay=Math.min(pool,d.balance);
d.balance-=pay;
pool-=pay;
}
simDebts.forEach(d=>{if(d.balance<=0.5&&payoffMonth[d.id]==null)payoffMonth[d.id]=month;});
}
return{months:month>=MAX_MONTHS?null:month,totalInterest:Math.round(totalInterest),payoffMonth};
},
render(){
const box=document.getElementById('dsResult');
if(!box)return;
D.debtStrategy=D.debtStrategy||{method:'avalanche',extra:0};
const chips=document.querySelectorAll('#dsMethodChips .chip-btn');
chips.forEach(b=>b.classList.remove('active'));
const method=D.debtStrategy.method==='snowball'?'snowball':'avalanche';
const idx={avalanche:0,snowball:1}[method];
if(chips[idx])chips[idx].classList.add('active');
const extraEl=document.getElementById('dsExtra');
if(extraEl&&!extraEl.matches(':focus'))extraEl.value=D.debtStrategy.extra||'';
const active=DebtStrategy.activeDebts();
if(!active.length){
box.innerHTML='<div class="empty"><div class="empty-icon">🎯</div><div class="empty-text">Belum ada utang aktif buat disusun strategi pelunasannya</div></div>';
return;
}
const dsr=DebtStrategy.computeDSR();
let dsrHtml;
if(dsr.incAvg>0){
const pct=dsr.pct;
const level=pct>35?'red':(pct>30?'orange':'green');
const msg=level==='red'?'⚠️ Sudah lewat batas aman (30–35%) — total cicilan/tagihan bulanan menekan cukup berat. Pertimbangkan percepat pelunasan lewat dana ekstra di bawah, atau tunda dulu kewajiban baru.':
level==='orange'?'Mendekati batas aman 30–35% — masih terkendali, tapi mulai hati-hati sebelum nambah utang baru.':
'✅ Masih di zona aman.';
dsrHtml=`<div style="font-size:12px;line-height:1.5;margin-bottom:12px;padding:10px;border-radius:10px;background:${level==='green'?'var(--accent3-soft)':'var(--accent2-soft)'}">💳 <b>DSR (Rasio Cicilan): ${pct.toFixed(0)}%</b> dari rata-rata income ${fmtFull(dsr.incAvg)}/bln (total cicilan/tagihan ${fmtFull(dsr.totalCicilan)}/bln)<br>${msg}</div>`;
} else {
dsrHtml='<div class="u-fs11 u-t2 u-mb12">Belum cukup data pemasukan buat hitung DSR (rasio cicilan) otomatis.</div>';
}
const order=DebtStrategy.computeOrder(active,method);
const listHtml=order.map((d,i)=>{
const meta=[];
if(d.bunga)meta.push('Bunga '+d.bunga+'%/th');
if(d.cicilanBulanan)meta.push('Cicilan '+fmt(d.cicilanBulanan)+'/bln');
else meta.push('Belum ada cicilan/bulan diisi');
return`<div class="u-flex u-aic u-gap10" style="padding:8px 0;border-bottom:1px solid var(--border)">
        <div class="u-bgaccsoft u-flex u-aic u-jcc u-fs12 u-fw700" style="width:24px;height:24px;border-radius:50%;flex-shrink:0">${i+1}</div>
        <div class="u-flex1"><div class="u-fs13 u-fw600">${escapeHtml(d.name)}</div><div class="u-fs11 u-t2">${meta.join(' · ')}</div></div>
        <div class="u-fw700 u-fs13" style="white-space:nowrap;padding-left:8px">${fmt(d.nilai)}</div>
      </div>`;
}).join('');
const extra=D.debtStrategy.extra||0;
const sim=DebtStrategy.simulate(order,extra);
let simHtml;
if(sim.months==null){
simHtml=order.every(d=>!(d.cicilanBulanan>0))?
'<div class="u-fs11 u-t2 u-mt10">💡 Isi "Cicilan/Bulan" di masing-masing utang (edit dari 📕 Buku Utang di atas) buat bisa lihat simulasi kapan lunasnya.</div>':
'<div class="u-fs11 u-t2 u-mt10">⚠️ Simulasi lebih dari 50 tahun / tidak konvergen — cek lagi cicilan & bunga yang diisi, kemungkinan cicilan terlalu kecil dibanding bunganya.</div>';
} else {
const years=Math.floor(sim.months/12),months=sim.months%12;
const durText=years>0?(years+' thn '+months+' bln'):(months+' bln');
simHtml=`<div class="u-mt12" style="padding-top:10px;border-top:1px dashed var(--border)">
        <div class="u-fs12 u-lh16"><b>⏱️ Estimasi lunas semua: ${durText} lagi</b>${extra>0?' (dgn dana ekstra '+fmtFull(extra)+'/bln)':''}<br>💸 Estimasi total bunga yang masih akan dibayar: <b>${fmtFull(sim.totalInterest)}</b></div>
      </div>`;
const otherMethod=method==='avalanche'?'snowball':'avalanche';
const otherOrder=DebtStrategy.computeOrder(active,otherMethod);
const otherSim=DebtStrategy.simulate(otherOrder,extra);
if(otherSim.months!=null){
const interestDiff=sim.totalInterest-otherSim.totalInterest;
const monthDiff=sim.months-otherSim.months;
if(Math.abs(interestDiff)>=1000||monthDiff!==0){
const label=otherMethod==='avalanche'?'Avalanche':'Snowball';
let cmp=interestDiff>0?('bayar bunga <b>'+fmtFull(interestDiff)+' lebih banyak</b>'):(interestDiff<0?('hemat bunga <b>'+fmtFull(-interestDiff)+'</b>'):'bunga sama');
if(monthDiff>0)cmp+=' & lunas <b>'+monthDiff+' bln lebih lambat</b>';
else if(monthDiff<0)cmp+=' & lunas <b>'+(-monthDiff)+' bln lebih cepat</b>';
simHtml+=`<div class="u-fs11 u-t2 u-mt8">🔎 Dibanding strategi ${label}: pakai metode saat ini kamu ${cmp}.</div>`;
}
}
}
box.innerHTML=dsrHtml+listHtml+simHtml+'<div class="u-fs10 u-ctext3 u-mt10 u-lh15">⚠️ Simulasi berdasarkan asumsi bunga & pembayaran konsisten tiap bulan — perkiraan kasar buat bahan pertimbangan, bukan angka pasti dari bank/lembaga pemberi pinjaman.</div>';
}
};
const Bill={
openLinkTxModal(){
if(curBillHistoryId==null){toast('⚠️ Buka dulu Riwayat Pembayaran tagihan yang mau dihubungkan');return;}
LinkTx.open('bill',curBillHistoryId);
}
};

// pajak-pbb-zakat.js — Kalkulator Pajak Bumi & Bangunan (PBB), Zakat (penghasilan, maal, fitrah), Referensi AI (cek harga emas/nisab via AI), Pajak UMKM, dan PPh 21 (Orang Pribadi)
// Dipisah dari: features-renovasi-pajak-aset-order.js (PBB, Zakat) dan features-edukasi-pajak-utang-sewakios.js (RefAI, PajakUMKM, PPh21) — sesi pemisahan domain Pajak/Zakat, lanjutan roadmap PEMISAHAN-FILE-ROADMAP.md.
// CATATAN: RefAI._parseJSON() juga dipakai EduFund.checkAI() (features-edukasi-pajak-utang-sewakios.js) & PriceReko.checkMarketAI() (cobek.js) lewat variabel global RefAI — aman krn dipanggil saat runtime (klik tombol), bukan saat file di-load.
// PENTING: file ini HARUS dimuat sesuai urutan build.js (GROUP_A/GROUP_B) karena beberapa modul saling referensi. Urutan grup ini: pajak-pbb-zakat.js, features-budget-laporan-carnotes-pelanggan.js, edukasi-dana.js, sewakios.js, hidup-seimbang.js, linktx.js, renovasi.js, aset.js, worthit.js

const PBB={
render(){
const sel=document.getElementById('pbbAssetPick');
if(!sel)return;
const cur=sel.value;
const eligible=(D.assets||[]).filter(a=>a.jenis==='Tanah'||a.jenis==='Rumah/Bangunan');
sel.innerHTML='<option value="">— Pilih aset Tanah/Rumah —</option>'+eligible.map(a=>`<option value="${a.id}">${escapeHtml(a.name)} (${a.jenis}) — ${fmt(a.nilai)}</option>`).join('');
if(eligible.some(a=>a.id===cur))sel.value=cur;
const pbb=D.pajakZakat.pbb;
const elTKP=document.getElementById('pbbNjoptkp'); if(elTKP&&!elTKP.matches(':focus'))elTKP.value=pbb.njoptkp;
const elTarif=document.getElementById('pbbTarif'); if(elTarif&&!elTarif.matches(':focus'))elTarif.value=pbb.tarifPersen;
PBB.hitung();
PBB.renderBillStatus();
},
renderBillStatus(){
const el=document.getElementById('pbbBillStatus');
if(!el)return;
const bill=D.bills.find(b=>b.pbbLink);
el.innerHTML=bill?('🔔 Terikat ke tagihan tahunan: jatuh tempo <b>'+bill.nextDue+'</b>, jumlah '+fmtFull(bill.amount)+'. Update kalkulator lalu tap tombol lagi untuk menyesuaikan.'):'Belum diikat ke tagihan. Isi tanggal jatuh tempo lalu tap tombol di atas supaya PBB muncul sebagai reminder tahunan di menu Tagihan.';
},
pilihAset(){
const id=document.getElementById('pbbAssetPick').value;
if(!id)return;
const a=D.assets.find(x=>sameId(x.id,id));
if(!a)return;
if(a.jenis==='Rumah/Bangunan'){
document.getElementById('pbbNjopBangunan').value=a.nilai;
} else {
document.getElementById('pbbNjopBumi').value=a.nilai;
}
toast('✅ NJOP diisi dari "'+a.name+'" — sesuaikan lagi kalau perlu (nilai aset ≠ NJOP resmi SPPT)');
PBB.hitung();
},
hitung(){
const njopBumi=parsePzNum(document.getElementById('pbbNjopBumi').value);
const njopBangunan=parsePzNum(document.getElementById('pbbNjopBangunan').value);
const njoptkp=parsePzNum(document.getElementById('pbbNjoptkp').value);
const tarif=parseFloat((document.getElementById('pbbTarif').value||'0').replace(',','.'))||0;
D.pajakZakat.pbb.njoptkp=njoptkp;
D.pajakZakat.pbb.tarifPersen=tarif;
save();
const njopTotal=njopBumi+njopBangunan;
const njopKenaPajak=Math.max(0,njopTotal-njoptkp);
const terutang=Math.round(njopKenaPajak*(tarif/100));
document.getElementById('pbbNjopTotal').textContent=fmtFull(njopTotal);
document.getElementById('pbbNjopKenaPajak').textContent=fmtFull(njopKenaPajak);
document.getElementById('pbbTerutang').textContent=fmtFull(terutang);
},
ikatTagihan(){
const jumlah=parsePzNum(document.getElementById('pbbTerutang').textContent);
if(jumlah<=0){toast('⚠️ Belum ada PBB terutang untuk diikat ke tagihan');return;}
const due=document.getElementById('pbbJatuhTempo').value;
if(!due){toast('⚠️ Isi dulu tanggal jatuh tempo PBB');return;}
let bill=D.bills.find(b=>b.pbbLink);
if(bill){
bill.amount=jumlah; bill.nextDue=due; bill.freq='tahunan';
save(); refreshBillEverywhere(); PBB.renderBillStatus();
toast('✅ Tagihan PBB diperbarui: '+fmtFull(jumlah)+' jatuh tempo '+due);
} else {
D.bills.push({id:uid(),name:'PBB (Pajak Bumi & Bangunan)',amount:jumlah,nextDue:due,freq:'tahunan',category:'Tagihan',subcategory:'',accountId:D.accounts[0]?.id||null,note:'Otomatis dari Kalkulator PBB',kind:'tagihan',pbbLink:true});
save(); refreshBillEverywhere(); PBB.renderBillStatus();
toast('✅ Tagihan tahunan PBB dibuat, reminder aktif di menu Tagihan');
}
}
};
const Zakat={
hitungPenghasilan(){
const now=new Date();
const incomeBulan=D.transactions.filter(t=>t.type==='income'&&(()=>{const d=new Date(t.date);return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();})()).reduce((s,t)=>s+(t.amount||0),0);
const nisab=D.pajakZakat.nisabPenghasilanBulan;
document.getElementById('zpIncomeBulan').textContent=fmtFull(incomeBulan);
document.getElementById('zpNisabBulan').textContent=fmtFull(nisab);
const wajib=incomeBulan>=nisab;
const zakat=wajib?Math.round(incomeBulan*0.025):0;
const statusEl=document.getElementById('zpStatus');
statusEl.textContent=wajib?'✅ Wajib Zakat':'⬜ Belum Wajib (di bawah nisab)';
statusEl.style.color=wajib?'var(--accent3)':'var(--text2)';
document.getElementById('zpJumlah').textContent=fmtFull(zakat);
},
hitungMaal(){
const pz=D.pajakZakat;
const saldoAkun=totalSaldoAkun();
const asetZakatable=(D.assets||[]).filter(a=>a.zakatable).reduce((s,a)=>s+(a.nilai||0),0);
const piutangZakatable=totalPiutangValue();
const utangManual=parsePzNum(document.getElementById('zmUtang').value);
pz.utangJT=utangManual; save();
renderKekayaanBersih();
const utang=utangManual+totalDebtValue()+totalCicilanOutstanding();
const totalHarta=Math.max(0,saldoAkun+asetZakatable+piutangZakatable-utang);
const nisab=85*pz.hargaEmasPerGram;
document.getElementById('zmTotalHarta').textContent=fmtFull(totalHarta);
document.getElementById('zmNisab').textContent=fmtFull(nisab);
const cukupNisab=totalHarta>=nisab;
let haulOk=false, haulMsg='';
if(cukupNisab){
if(!pz.haulMaalMulai){
pz.haulMaalMulai=new Date().toISOString().slice(0,10);
haulMsg='📅 Haul mulai dihitung hari ini ('+pz.haulMaalMulai+'). Zakat wajib jika harta masih ≥ nisab 1 tahun lagi.';
} else {
const mulai=new Date(pz.haulMaalMulai);
const hariBerjalan=Math.floor((new Date()-mulai)/86400000);
haulOk=hariBerjalan>=354;
haulMsg=haulOk?'✅ Sudah mencapai haul (≥354 hari) sejak '+pz.haulMaalMulai+'.':'⏳ Haul berjalan '+hariBerjalan+' dari 354 hari sejak '+pz.haulMaalMulai+'.';
}
} else {
pz.haulMaalMulai=null;
haulMsg='Harta belum mencapai nisab, haul belum dihitung.';
}
const statusEl=document.getElementById('zmStatus');
const wajib=cukupNisab&&haulOk;
statusEl.textContent=wajib?'✅ Wajib Zakat':(cukupNisab?'⏳ Sudah nisab, tunggu haul':'⬜ Belum Wajib');
statusEl.style.color=wajib?'var(--accent3)':'var(--text2)';
document.getElementById('zmJumlah').textContent=fmtFull(wajib?Math.round(totalHarta*0.025):0);
document.getElementById('zmHaulInfo').textContent=haulMsg;
},
hitungFitrah(){
const jiwa=Math.max(1,parseInt(document.getElementById('zfJiwa').value)||1);
document.getElementById('zfTotal').textContent=fmtFull(jiwa*D.pajakZakat.zakatFitrahPerJiwa);
},
async catatDibayar(jenis){
const jumlahStr=jenis==='penghasilan'?document.getElementById('zpJumlah').textContent:document.getElementById('zmJumlah').textContent;
const jumlah=parsePzNum(jumlahStr);
if(jumlah<=0){toast('⚠️ Belum ada kewajiban zakat untuk dicatat');return;}
if(!await askConfirm('Catat pembayaran zakat '+(jenis==='penghasilan'?'penghasilan':'maal')+' sebesar '+fmtFull(jumlah)+'? Otomatis tercatat sebagai pengeluaran di Keuangan.',{danger:false,okText:'Ya, Catat',icon:'🕌'}))return;
D.pajakZakat.zakatLog.unshift({id:uid(),jenis,tanggal:new Date().toISOString().slice(0,10),jumlah});
D.transactions.push({id:uid(),type:'expense',amount:jumlah,category:'Tagihan',subcategory:'',accountId:D.accounts[0]?.id||'',payMethod:'tunai',note:'Zakat '+(jenis==='penghasilan'?'Penghasilan':'Maal'),date:new Date().toISOString().slice(0,10)});
if(jenis==='maal')D.pajakZakat.haulMaalMulai=new Date().toISOString().slice(0,10);
save();
Zakat.renderLog();
Zakat.hitungMaal();
renderDashboard();
renderKeuangan();
toast('✅ Tercatat & masuk Keuangan, semoga berkah 🤲');
},
renderLog(){
const el=document.getElementById('zakatLogList');
if(!el)return;
const log=D.pajakZakat.zakatLog||[];
if(!log.length){el.innerHTML='<div class="empty"><div class="empty-icon">🕌</div><div class="empty-text">Belum ada riwayat</div></div>';return;}
el.innerHTML=log.slice(0,20).map(l=>`<div class="tx-item"><div class="tx-icon" style="background:var(--accent3-soft)">🕌</div><div class="tx-info"><div class="tx-name">Zakat ${l.jenis==='penghasilan'?'Penghasilan':'Maal'}</div><div class="tx-meta">${l.tanggal}</div></div><div class="tx-amount green">${fmtFull(l.jumlah)}</div><button class="tx-del" data-action="delZakatLog" data-args="${escapeHtml(JSON.stringify([l.id]))}" aria-label="Hapus">🗑</button></div>`).join('');
},
async delLog(id){
if(!await askConfirm('Hapus catatan zakat ini?',{okText:'Ya, Hapus'}))return;
D.pajakZakat.zakatLog=D.pajakZakat.zakatLog.filter(l=>!sameId(l.id,id));
save();Zakat.renderLog();
},
renderDashMini(incomeBulan){
const card=document.getElementById('dashZakatMiniCard');
if(!card||!D.pajakZakat)return;
const nisab=D.pajakZakat.nisabPenghasilanBulan||0;
const wajib=incomeBulan>=nisab&&incomeBulan>0;
const zakat=wajib?Math.round(incomeBulan*0.025):0;
document.getElementById('dashZakatStatus').textContent=wajib?'✅ Wajib zakat bulan ini':'⬜ Belum wajib (di bawah nisab)';
document.getElementById('dashZakatJumlah').textContent=fmt(zakat);
card.style.display=wajib?'block':'none';
}
};
const RefAI={
_draft:null,
ITEMS:[
{key:'hargaEmasPerGram',label:'Harga Emas / Gram'},
{key:'nisabPenghasilanBulan',label:'Nisab Zakat Penghasilan / Bulan'},
{key:'zakatFitrahPerJiwa',label:'Zakat Fitrah / Jiwa'}
],
systemPrompt(){
return `Kamu asisten riset utk aplikasi keuangan keluarga Indonesia. Tugasmu HANYA mencari 3 angka referensi TERBARU berikut lewat web search, lalu balas HANYA dalam format JSON valid (tanpa teks lain, tanpa markdown code fence, tanpa komentar):
{
  "hargaEmasPerGram": {"value": <angka Rp per gram, harga emas Antam/logam mulia 24 karat terbaru, atau null kalau tidak ketemu>, "source": "<nama situs/lembaga & info singkat>", "tanggal": "<tanggal info ini berlaku>"},
  "nisabPenghasilanBulan": {"value": <angka Rp, nisab zakat penghasilan per bulan dari BAZNAS terbaru, atau null>, "source": "<sumber>", "tanggal": "<tanggal>"},
  "zakatFitrahPerJiwa": {"value": <angka Rp, zakat fitrah per jiwa dari BAZNAS terbaru, atau null>, "source": "<sumber>", "tanggal": "<tanggal>"}
}
Kalau salah satu tidak ketemu/tidak yakin, isi value dengan null dan jelaskan alasannya singkat di source. JANGAN mengarang angka kalau tidak ketemu di hasil pencarian.`;
},
async check(){
const btn=document.getElementById('refAiCheckBtn');
const apiKey=D.profile.apiKey;
const provider=D.profile.apiProvider||'claude';
if(!apiKey){toast('⚠️ Belum ada API Key. Isi dulu di Pengaturan → AI Asisten.');return;}
RefAI._draft=null;
const applyBtn=document.getElementById('refAiApplyBtn'); if(applyBtn)applyBtn.disabled=true;
document.getElementById('refAiBody').innerHTML='<div class="empty"><div class="empty-icon">🔍</div><div class="empty-text">Mencari info terbaru via web search... (bisa 10-30 detik)</div></div>';
openModal('refAiModal');
if(btn){btn.disabled=true;btn.textContent='🔍 Mencari...';}
try{
const r=await callAIProviderRaw(RefAI.systemPrompt(),[{role:'user',content:'Cari & kasih 3 angka referensi zakat/emas terbaru sesuai format JSON yang diminta.'}],{maxTokens:2048,webSearch:true});
if(!r.ok){
const label=provider==='gemini'?'Gemini':'Claude';
document.getElementById('refAiBody').innerHTML=`<div class="empty"><div class="empty-icon">⚠️</div><div class="empty-text">Gagal hubungi ${label}: ${escapeHtml(r.errMsg||'error tidak diketahui')}${aiErrorHint(provider,r.status)}</div></div>`;
return;
}
const textOut=r.text;
const parsed=RefAI._parseJSON(textOut);
if(!parsed){
document.getElementById('refAiBody').innerHTML=`<div class="empty"><div class="empty-icon">⚠️</div><div class="empty-text">Balasan AI tidak bisa dibaca sebagai data referensi. Coba lagi.</div></div>`;
return;
}
RefAI._draft=parsed;
RefAI.renderDraft();
}catch(e){
document.getElementById('refAiBody').innerHTML=`<div class="empty"><div class="empty-icon">⚠️</div><div class="empty-text">Gagal cek: ${escapeHtml(e.message||String(e))}</div></div>`;
}finally{
if(btn){btn.disabled=false;btn.textContent='🔍 Cek Update via AI';}
D.pajakZakat.refCheckedAt=todayStr();
save();
renderRefCheckReminder();
}
},
_parseJSON(text){
if(!text)return null;
let t=text.trim().replace(/^```json\s*/i,'').replace(/^```\s*/,'').replace(/```\s*$/,'').trim();
try{return JSON.parse(t);}catch(e){}
const s=t.indexOf('{'),eIdx=t.lastIndexOf('}');
if(s>=0&&eIdx>s){ try{return JSON.parse(t.slice(s,eIdx+1));}catch(e){} }
return null;
},
renderDraft(){
const body=document.getElementById('refAiBody');
const pz=D.pajakZakat;
const d=RefAI._draft||{};
let anyValid=false;
body.innerHTML=RefAI.ITEMS.map(it=>{
const cur=pz[it.key];
const item=d[it.key];
if(!item||item.value===null||item.value===undefined||!isFinite(Number(item.value))||Number(item.value)<=0){
return `<div class="u-r10 u-mb8" style="padding:10px;background:var(--surface2)">
          <div class="u-fw700 u-fs13 u-mb2">${it.label}</div>
          <div class="u-fs11 u-t2">⚠️ AI tidak menemukan nilai yang cukup yakin${item&&item.source?': '+escapeHtml(item.source):''}. Nilai tersimpan tetap ${fmtFull(cur)}.</div>
        </div>`;
}
anyValid=true;
const changed=Math.round(Number(item.value))!==Math.round(cur);
return `<div class="u-r10 u-mb8" style="padding:10px;background:var(--surface2)">
        <label class="u-flex u-gap8 u-aifs u-pointer">
          <input type="checkbox" data-refkey="${it.key}" ${changed?'checked':''} style="margin-top:3px">
          <div class="u-flex1">
            <div class="u-fw700 u-fs13">${it.label}</div>
            <div class="u-fs12 u-mt2">${changed?`<span class="u-ctext3" style="text-decoration:line-through">${fmtFull(cur)}</span> → <b class="green">${fmtFull(Number(item.value))}</b>`:`<span>${fmtFull(Number(item.value))}</span> <span class="u-ctext3">(sama dgn tersimpan)</span>`}</div>
            <div class="u-fs11 u-t2" style="margin-top:3px">📌 ${escapeHtml(item.source||'Sumber tidak disebutkan')}${item.tanggal?' · '+escapeHtml(String(item.tanggal)):''}</div>
          </div>
        </label>
      </div>`;
}).join('')+`<div class="u-fs11 u-ctext3 u-mt4 u-lh14">⚠️ Verifikasi sendiri ke sumber resmi (logammulia.com / baznas.go.id) sebelum dipakai buat hitungan zakat resmi.</div>`;
const applyBtn=document.getElementById('refAiApplyBtn'); if(applyBtn)applyBtn.disabled=!anyValid;
},
applySelected(){
if(!RefAI._draft){toast('⚠️ Belum ada hasil cek');return;}
const pz=D.pajakZakat;
const checked=[...document.querySelectorAll('#refAiBody input[type=checkbox]:checked')];
if(!checked.length){toast('⚠️ Centang minimal 1 item yang mau diterapkan');return;}
let n=0;
checked.forEach(cb=>{
const key=cb.dataset.refkey;
const item=RefAI._draft[key];
if(!item||item.value===null||item.value===undefined||!isFinite(Number(item.value))||Number(item.value)<=0)return;
pz[key]=Math.round(Number(item.value));
pz.refSources=pz.refSources||{};
pz.refSources[key]={source:item.source||'',tanggal:item.tanggal||''};
n++;
});
pz.nisabPenghasilanTahun=pz.nisabPenghasilanBulan*12;
save();
renderPajakZakat();
renderRefCheckReminder();
closeModal('refAiModal');
toast(`✅ ${n} nilai referensi diperbarui dari hasil cek AI`);
}
};
const PajakUMKM={
render(){
const elO=document.getElementById('umkmOmzet'), elP=document.getElementById('umkmPajak');
if(!elO||!elP)return;
const now=new Date();
const omzetBulan=(D.cobek||[]).filter(t=>{const d=new Date(t.date);return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();}).reduce((s,t)=>s+(t.total||0),0);
elO.textContent=fmtFull(omzetBulan);
elP.textContent=fmtFull(Math.round(omzetBulan*0.005));
}
};
const PPh21={
getPTKP(status){
const dependents={TK0:0,TK1:1,TK2:2,TK3:3,K0:0,K1:1,K2:2,K3:3}[status]||0;
const married=status.startsWith('K');
let ptkp=54000000;
if(married)ptkp+=4500000;
ptkp+=dependents*4500000;
return ptkp;
},
hitungProgresif(pkp){
if(pkp<=0)return{pajak:0,detail:[]};
const brackets=[[60000000,0.05],[190000000,0.15],[250000000,0.25],[4500000000,0.30],[Infinity,0.35]];
let sisa=pkp,pajak=0,detail=[];
for(const[batas,tarif]of brackets){
if(sisa<=0)break;
const kena=Math.min(sisa,batas);
const t=kena*tarif;
if(kena>0)detail.push(`${(tarif*100)}% × ${fmtFull(kena)} = ${fmtFull(t)}`);
pajak+=t;sisa-=kena;
}
return{pajak:Math.round(pajak),detail};
},
isiDariTransaksi(){
const now=new Date();
const y=now.getFullYear();
const incomeYear=D.transactions.filter(t=>t.type==='income'&&new Date(t.date).getFullYear()===y);
if(!incomeYear.length){toast('⚠️ Belum ada data pemasukan tahun ini');return;}
const monthsSet=new Set(incomeYear.map(t=>new Date(t.date).getMonth()));
const totalYear=incomeYear.reduce((s,t)=>s+(t.amount||0),0);
const avgBulan=Math.round(totalYear/Math.max(1,monthsSet.size));
document.getElementById('pphBruto').value=avgBulan;
PPh21.hitung();
toast('✅ Diisi rata-rata pemasukan/bulan tahun '+y);
},
hitung(){
const brutoBulan=parsePzNum(document.getElementById('pphBruto').value);
const status=document.getElementById('pphStatus').value;
const iuranBulan=parsePzNum(document.getElementById('pphIuran').value);
D.pajakZakat.pphBrutoBulan=brutoBulan;
D.pajakZakat.pphIuranBulan=iuranBulan;
save();
const brutoSetahun=brutoBulan*12;
const biayaJabatan=Math.min(brutoSetahun*0.05,6000000);
const iuranSetahun=iuranBulan*12;
const neto=Math.max(0,brutoSetahun-biayaJabatan-iuranSetahun);
const ptkp=PPh21.getPTKP(status);
const pkp=Math.max(0,Math.floor((neto-ptkp)/1000)*1000);
const{pajak,detail}=PPh21.hitungProgresif(pkp);
document.getElementById('pphBrutoSetahun').textContent=fmtFull(brutoSetahun);
document.getElementById('pphBiayaJabatan').textContent=fmtFull(biayaJabatan);
document.getElementById('pphIuranSetahun').textContent=fmtFull(iuranSetahun);
document.getElementById('pphNeto').textContent=fmtFull(neto);
document.getElementById('pphStatusLabel').textContent=(status.startsWith('TK')?'TK/'+status.slice(2):'K/'+status.slice(1));
document.getElementById('pphPTKP').textContent=fmtFull(ptkp);
document.getElementById('pphPKP').textContent=fmtFull(pkp);
document.getElementById('pphBracketDetail').innerHTML=detail.length?detail.join('<br>'):'Penghasilan kena pajak Rp0 — tidak terutang PPh 21.';
document.getElementById('pphSetahun').textContent=fmtFull(pajak);
document.getElementById('pphPerBulan').textContent=fmtFull(Math.round(pajak/12));
}
};

// features-budget-laporan-carnotes-pelanggan.js — Budget & laporan keuangan, Car Notes (BBM/servis/torsi baut), aksi AI chat, data pelanggan
// PENTING: file ini HARUS dimuat sesuai urutan build.js (GROUP_A/GROUP_B) karena beberapa modul saling referensi. Urutan grup ini: pajak-pbb-zakat.js, features-budget-laporan-carnotes-pelanggan.js, edukasi-dana.js, sewakios.js, hidup-seimbang.js, linktx.js, renovasi.js, aset.js, worthit.js
// CATATAN: MODULE_FEATURES_VERSION, VEHTAX_INPUT_IDS, MY_WRENCH, CHAT_ACTION_LABELS DIPINDAH ke sini dari features-etalase-piutang-renovai.js (file itu dihapus, sisa 3 konstanta kecilnya sudah tidak punya file sendiri lagi — semua ditaruh dekat kode yang benar-benar memakainya di domain ini: VEHTAX_INPUT_IDS dekat VEHTAX_ITEMS, MY_WRENCH dekat modul Torsi, CHAT_ACTION_LABELS dekat CHAT_ACTION_HANDLERS/CHAT_ACTION_EDIT_FIELDS).

const MODULE_FEATURES_VERSION='kw81-rename-cobek-to-shop';
const Budget={
editId:null,
curIcon:'🍚',
curPeriod:'bulanan',
PERIOD_HINT:{
bulanan:'Direset & dihitung ulang tiap bulan (bulan berjalan).',
mingguan:'Direset & dihitung ulang tiap minggu (Senin–Minggu, minggu berjalan berdasarkan tanggal hari ini).',
tahunan:'Direset & dihitung ulang tiap tahun (menjumlah semua bulan di tahun berjalan).',
sekali:'Nominal tetap satu kali — menjumlah SEMUA transaksi yang cocok sejak anggaran ini dibuat, tidak pernah reset otomatis (cocok utk target dana renovasi, dana darurat, dll).'
},
SETTINGS_KEY:'budgetSettings',
getSettings(){
try{return JSON.parse(localStorage.getItem(Budget.SETTINGS_KEY))||{};}catch{return{};}
},
saveSettings(){
const s={
warnAt80:document.getElementById('bsWarnAt80').checked,
showOver:document.getElementById('bsShowOver').checked,
hideZero:document.getElementById('bsHideZero').checked,
sortOrder:document.getElementById('bsSortOrder').value
};
safeSetItem(Budget.SETTINGS_KEY,JSON.stringify(s));
},
getCatNameById(catId){
if(catId==='__total__') return '__total__';
const all=[...D.categories.income,...D.categories.expense];
for(const c of all){
if(c.id===catId) return c.name;
for(const s of (c.subs||[])){if(s.id===catId) return s.name;}
}
return catId;
},
getCatInfoById(catId){
if(catId==='__total__') return {catName:'__total__'};
const all=[...D.categories.income,...D.categories.expense];
for(const c of all){
if(c.id===catId) return {catName:c.name};
for(const s of (c.subs||[])){if(s.id===catId) return {catName:c.name,subName:s.name};}
}
return {catName:catId};
},
matchesTx(budget, t){
if(t.type!=='expense') return false;
const ids=budget.catIds||(budget.catId?[budget.catId]:[]);
if(ids.includes('__total__')) return true;
return ids.some(catId=>{
const info=Budget.getCatInfoById(catId);
if(info.subName){
return t.category===info.catName && t.subcategory===info.subName;
}
return t.category===info.catName||t.category===catId||t.categoryId===catId;
});
},
matchesPeriod(budget,t,month,year){
const period=budget.period||'bulanan';
const m=month!=null?month:curMonth, y=year!=null?year:curYear;
const d=new Date(t.date);
if(period==='mingguan'){
const now=new Date();
const dow=(now.getDay()+6)%7;
const monday=new Date(now.getFullYear(),now.getMonth(),now.getDate()-dow);
const sunday=new Date(monday.getFullYear(),monday.getMonth(),monday.getDate()+6,23,59,59,999);
return d>=monday&&d<=sunday;
}
if(period==='tahunan') return d.getFullYear()===y;
if(period==='sekali'){
const startDate=budget.createdAt?budget.createdAt.slice(0,10):null;
return !(startDate&&t.date<startDate);
}
return d.getMonth()===m&&d.getFullYear()===y;
},
getUsed(budget,month,year){
return D.transactions.filter(t=>Budget.matchesPeriod(budget,t,month,year)&&Budget.matchesTx(budget,t)).reduce((s,t)=>s+t.amount,0);
},
getEffectiveLimit(budget,month,year){
const period=budget.period||'bulanan';
if(period!=='bulanan'||!budget.rollover) return budget.limit;
const m=month!=null?month:curMonth, y=year!=null?year:curYear;
const pm=m===0?11:m-1;
const py=m===0?y-1:y;
const prevUsed=D.transactions.filter(t=>{
const d=new Date(t.date);
return d.getMonth()===pm&&d.getFullYear()===py&&Budget.matchesTx(budget,t);
}).reduce((s,t)=>s+t.amount,0);
const sisa=budget.limit-prevUsed;
return budget.limit+(sisa>0?sisa:0);
},
render(){
const bs=Budget.getSettings();
const el=document.getElementById('budgetList');
const sumEl=document.getElementById('budgetSummary');
if(!D.budgets||!D.budgets.length){
el.innerHTML=`<div class="budget-empty"><div class="budget-empty-icon">📊</div><div class="budget-empty-text">Belum ada anggaran. Tap <b>＋ Tambah</b> untuk mulai mengatur pengeluaran.</div></div>`;
sumEl.style.display='none';
return;
}
let items=[...D.budgets];
const sort=bs.sortOrder||'pct_desc';
items=items.map(b=>{const used=Budget.getUsed(b);const lim=Budget.getEffectiveLimit(b);return{...b,_used:used,_limit:lim,_pct:lim>0?used/lim:0,_sisa:lim-used};});
if(sort==='pct_desc') items.sort((a,b)=>b._pct-a._pct);
else if(sort==='pct_asc') items.sort((a,b)=>a._pct-b._pct);
else if(sort==='sisa_asc') items.sort((a,b)=>a._sisa-b._sisa);
else items.sort((a,b)=>a.name.localeCompare(b.name));
if(bs.hideZero) items=items.filter(b=>b._used>0);
const totalLim=items.reduce((s,b)=>s+b._limit,0);
const totalUsed=items.reduce((s,b)=>s+b._used,0);
const totalSisa=totalLim-totalUsed;
const overallPct=totalLim>0?Math.round((totalUsed/totalLim)*100):0;
document.getElementById('bTotalBudget').textContent=fmt(totalLim);
document.getElementById('bTotalUsed').textContent=fmt(totalUsed);
document.getElementById('bTotalSisa').textContent=(totalSisa<0?'-':'')+fmt(Math.abs(totalSisa));
const barFill=document.getElementById('bOverallBar');
barFill.style.width=Math.min(overallPct,100)+'%';
barFill.className='budget-bar-fill '+(overallPct>=100?'over':overallPct>=80?'warn':'ok');
document.getElementById('bOverallPct').textContent=overallPct+'% terpakai';
const now=new Date(),daysInMonth=new Date(curYear,curMonth+1,0).getDate();
const daysLeft=curMonth===now.getMonth()&&curYear===now.getFullYear()?daysInMonth-now.getDate():0;
document.getElementById('bOverallDays').textContent=daysLeft>0?daysLeft+' hari lagi':'';
sumEl.classList.remove('u-dnone');sumEl.style.display='block';
el.innerHTML=items.map(b=>{
const pct=Math.min(Math.round(b._pct*100),999);
const barClass=pct>=100?'over':pct>=80?'warn':'ok';
const isOver=pct>=100;
const rollTag=b.rollover?`<span class="u-fs12 u-r99 u-t2 u-ml4" style="background:var(--surface);border:1px solid var(--border2);padding:2px 7px">🔄 rollover</span>`:'';
const periodTag=b.period==='tahunan'?`<span class="u-fs12 u-r99 u-t2 u-ml4" style="background:var(--surface);border:1px solid var(--border2);padding:2px 7px">🗓️ tahunan</span>`:b.period==='mingguan'?`<span class="u-fs12 u-r99 u-t2 u-ml4" style="background:var(--surface);border:1px solid var(--border2);padding:2px 7px">📆 mingguan</span>`:b.period==='sekali'?`<span class="u-fs12 u-r99 u-t2 u-ml4" style="background:var(--surface);border:1px solid var(--border2);padding:2px 7px">🎯 1x</span>`:'';
const overTag=isOver&&(bs.showOver!==false)?`<span class="u-fs12 u-r99 u-fw700" style="background:var(--accent2);color:#fff;padding:2px 8px">LEWAT!</span>`:'';
const warnTag=(!isOver&&pct>=80&&bs.warnAt80!==false)?`<span class="u-fs12 u-fw700" style="color:var(--accent4)">⚠️ ${pct}%</span>`:'';
const limitLabel=b.rollover&&b._limit!==b.limit?`${fmtFull(b._limit)} (incl. rollover)`:`${fmtFull(b._limit)}`;
return `<div class="budget-item clickable" data-action="Budget.showDrillDown" data-args="${escapeHtml(JSON.stringify([b.id]))}">
        <div class="budget-item-header">
          <div class="budget-cat">${b.icon||'💰'} ${escapeHtml(b.name)} ${periodTag}${rollTag}</div>
          <div class="u-flex u-aic u-gap6">${warnTag}${overTag}</div>
        </div>
        <div class="budget-bar-track"><div class="budget-bar-fill ${barClass}" style="width:${Math.min(pct,100)}%"></div></div>
        <div class="budget-bar-label">
          <span>${fmtFull(b._used)} <span class="u-t2">/ ${limitLabel}</span></span>
          <span class="${isOver?'over-label':''}">${isOver?'Lewat '+fmtFull(Math.abs(b._sisa)):fmtFull(b._sisa)+' sisa'}</span>
        </div>
        <div class="budget-actions u-mt10" data-onclick="event.stopPropagation()">
          <button class="budget-edit-btn" data-action="openBudgetModal" data-args="${escapeHtml(JSON.stringify([b.id]))}" aria-label="Edit/Buka">✏️ Edit</button>
          <button class="budget-del-btn" data-action="deleteBudget" data-args="${escapeHtml(JSON.stringify([b.id]))}" aria-label="Hapus">🗑</button>
          <button class="budget-edit-btn" data-action="showBudgetDrillDown" data-args="${escapeHtml(JSON.stringify([b.id]))}" style="margin-left:auto">📋 Lihat Transaksi</button>
        </div>
      </div>`;
}).join('')||`<div class="budget-empty"><div class="budget-empty-text" style="padding:16px 0">Semua anggaran disembunyikan (filter aktif)</div></div>`;
},
cleanCatOptText(txt){
return txt.replace(/^[\s↳]+/,'').replace(/^[^\w\s]+\s*/,'').trim();
},
renderCatOptions(selected){
let html=`<label class="budget-cat-opt total"><input type="checkbox" id="budgetCatTotal" onchange="onBudgetCatTotalToggle(this)"> 🎯 Total Pengeluaran (semua kategori)</label>`;
D.categories.expense.forEach(c=>{
html+=`<label class="budget-cat-opt"><input type="checkbox" class="budgetCatChk" value="${c.id}" onchange="onBudgetCatChildToggle()"> ${escapeHtml(c.icon||'')} ${escapeHtml(c.name)}</label>`;
(c.subs||[]).forEach(s=>{
html+=`<label class="budget-cat-opt sub"><input type="checkbox" class="budgetCatChk" value="${s.id}" onchange="onBudgetCatChildToggle()"> ↳ ${escapeHtml(s.icon||'')} ${escapeHtml(s.name)}</label>`;
});
});
document.getElementById('budgetCatList').innerHTML=html;
const totalChk=document.getElementById('budgetCatTotal');
const isTotal=selected.includes('__total__');
totalChk.checked=isTotal;
document.querySelectorAll('.budgetCatChk').forEach(c=>{
c.disabled=isTotal;
c.checked=!isTotal&&selected.includes(c.value);
});
},
onCatTotalToggle(el){
document.querySelectorAll('.budgetCatChk').forEach(c=>{c.disabled=el.checked;if(el.checked)c.checked=false;});
Budget.autoName();
},
onCatChildToggle(){
Budget.autoName();
},
getSelectedCatIds(){
const totalChk=document.getElementById('budgetCatTotal');
if(totalChk&&totalChk.checked) return ['__total__'];
return Array.from(document.querySelectorAll('.budgetCatChk:checked')).map(c=>c.value);
},
autoName(){
const nameEl=document.getElementById('budgetName');
if(nameEl.value&&nameEl.dataset.autoFilled!=='1') return;
const ids=Budget.getSelectedCatIds();
let txt='';
if(ids.includes('__total__')){
txt='Total Pengeluaran';
} else if(ids.length===1){
const opt=document.querySelector(`.budgetCatChk[value="${ids[0]}"]`);
txt=opt?Budget.cleanCatOptText(opt.parentElement.textContent):'';
} else if(ids.length>1){
const first=document.querySelector(`.budgetCatChk[value="${ids[0]}"]`);
const firstTxt=first?Budget.cleanCatOptText(first.parentElement.textContent):'';
txt=`${firstTxt} +${ids.length-1} lainnya`;
}
nameEl.value=txt;
nameEl.dataset.autoFilled='1';
},
selectIcon(icon, el){
Budget.curIcon=icon;
document.querySelectorAll('#budgetIconPicker .chip-btn').forEach(b=>b.classList.remove('active'));
el.classList.add('active');
},
selectPeriod(period, el){
Budget.curPeriod=period;
document.querySelectorAll('#budgetPeriodPicker .chip-btn').forEach(b=>b.classList.remove('active'));
el.classList.add('active');
document.getElementById('budgetPeriodHint').textContent=Budget.PERIOD_HINT[period]||'';
const rolloverRow=document.getElementById('budgetRolloverRow');
if(period==='bulanan'){
rolloverRow.style.display='flex';
} else {
rolloverRow.style.display='none';
document.getElementById('budgetRollover').checked=false;
}
},
openModal(id){
Budget.editId=id;
const isEdit=id!==null;
document.getElementById('budgetModalTitle').textContent=isEdit?'Edit Anggaran':'Tambah Anggaran';
const nameEl=document.getElementById('budgetName');
if(isEdit){
const b=D.budgets.find(x=>x.id===id);
if(b){
const ids=b.catIds||(b.catId?[b.catId]:['__total__']);
Budget.renderCatOptions(ids);
nameEl.value=b.name;
nameEl.dataset.autoFilled='0';
document.getElementById('budgetLimit').value=b.limit;
document.getElementById('budgetNote').value=b.note||'';
document.getElementById('budgetRollover').checked=!!b.rollover;
Budget.curIcon=b.icon||'💰';
document.querySelectorAll('#budgetIconPicker .chip-btn').forEach(btn=>{
btn.classList.toggle('active',btn.textContent.startsWith(Budget.curIcon));
});
const period=b.period||'bulanan';
Budget.selectPeriod(period,document.querySelector(`#budgetPeriodPicker .chip-btn[data-period="${period}"]`));
}
} else {
Budget.renderCatOptions(['__total__']);
nameEl.value='';
nameEl.dataset.autoFilled='1';
document.getElementById('budgetLimit').value='';
document.getElementById('budgetNote').value='';
document.getElementById('budgetRollover').checked=false;
Budget.curIcon='🍚';
document.querySelectorAll('#budgetIconPicker .chip-btn').forEach((b,i)=>b.classList.toggle('active',i===0));
Budget.selectPeriod('bulanan',document.querySelector('#budgetPeriodPicker .chip-btn[data-period="bulanan"]'));
Budget.autoName();
}
openModal('budgetModal');
},
save(){return withSaveGuard('budget','budgetModal',Budget._saveInner);},
_saveInner(){
const catIds=Budget.getSelectedCatIds();
if(!catIds.length){toast('⚠️ Pilih minimal 1 kategori');return;}
const name=document.getElementById('budgetName').value.trim()||'Anggaran';
const limit=parseFloat(document.getElementById('budgetLimit').value);
const note=document.getElementById('budgetNote').value.trim();
const period=Budget.curPeriod||'bulanan';
const rollover=period==='bulanan'&&document.getElementById('budgetRollover').checked;
if(!limit||limit<=0){toast('⚠️ Masukkan batas anggaran');return;}
if(!D.budgets) D.budgets=[];
if(Budget.editId){
const i=D.budgets.findIndex(b=>b.id===Budget.editId);
if(i>=0){D.budgets[i]={...D.budgets[i],name,limit,catIds,icon:Budget.curIcon,note,rollover,period};delete D.budgets[i].catId;}
} else {
D.budgets.push({id:'bgt_'+Date.now(),name,limit,catIds,icon:Budget.curIcon,note,rollover,period,createdAt:new Date().toISOString()});
}
save();closeModal('budgetModal');Budget.render();renderDashboard();if(typeof BudgetReko!=='undefined')BudgetReko.render();toast(Budget.editId?'✅ Anggaran diperbarui':'✅ Anggaran ditambahkan');
},
async delete(id){
if(!await askConfirm('Hapus anggaran ini?'))return;
D.budgets=D.budgets.filter(b=>b.id!==id);
save();Budget.render();renderDashboard();if(typeof BudgetReko!=='undefined')BudgetReko.render();toast('🗑 Anggaran dihapus');
},
openSettings(){
const s=Budget.getSettings();
document.getElementById('bsWarnAt80').checked=s.warnAt80!==false;
document.getElementById('bsShowOver').checked=s.showOver!==false;
document.getElementById('bsHideZero').checked=!!s.hideZero;
document.getElementById('bsSortOrder').value=s.sortOrder||'pct_desc';
openModal('budgetSettingsModal');
},
showAllDrillDown(){
if(!D.budgets||!D.budgets.length)return;
const txM=D.transactions.filter(t=>{
return D.budgets.some(b=>Budget.matchesPeriod(b,t,curMonth,curYear)&&Budget.matchesTx(b,t));
}).sort((a,c)=>new Date(c.date)-new Date(a.date));
const total=txM.reduce((s,t)=>s+t.amount,0);
document.getElementById('filterTxTitle').textContent='📊 Semua Transaksi Teranggarkan';
document.getElementById('filterTxSummary').textContent=`${txM.length} transaksi · Total ${fmtFull(total)} (sesuai periode masing-masing anggaran)`;
document.getElementById('filterTxList').innerHTML=txM.length?txM.map(txHTML).join(''):'<div class="empty"><div class="empty-icon">✅</div><div class="empty-text">Belum ada pengeluaran di kategori beranggaran</div></div>';
openModal('filterTxModal');
},
showDrillDown(id){
const b=D.budgets.find(x=>x.id===id);if(!b)return;
const txM=D.transactions.filter(t=>Budget.matchesPeriod(b,t,curMonth,curYear)&&Budget.matchesTx(b,t)).sort((a,c)=>new Date(c.date)-new Date(a.date));
const total=txM.reduce((s,t)=>s+t.amount,0);
document.getElementById('filterTxTitle').textContent=`${b.icon} ${b.name}`;
document.getElementById('filterTxSummary').textContent=`${txM.length} transaksi · Total ${fmtFull(total)} dari anggaran ${fmtFull(Budget.getEffectiveLimit(b))}`;
document.getElementById('filterTxList').innerHTML=txM.length?txM.map(txHTML).join(''):'<div class="empty"><div class="empty-icon">✅</div><div class="empty-text">Belum ada pengeluaran di kategori ini</div></div>';
openModal('filterTxModal');
},
renderDashMini(){
const card=document.getElementById('dashBudgetMiniCard');
if(!card)return;
if(!D.budgets||!D.budgets.length){card.style.display='none';return;}
const now=new Date(),m=now.getMonth(),y=now.getFullYear();
const totalLim=D.budgets.reduce((s,b)=>s+Budget.getEffectiveLimit(b,m,y),0);
const totalUsed=D.budgets.reduce((s,b)=>s+Budget.getUsed(b,m,y),0);
const pct=totalLim>0?Math.round((totalUsed/totalLim)*100):0;
document.getElementById('dashBudgetUsed').textContent=fmt(totalUsed);
document.getElementById('dashBudgetLimit').textContent=fmt(totalLim);
document.getElementById('dashBudgetPct').textContent=pct+'%';
const bar=document.getElementById('dashBudgetBar');
bar.style.width=Math.min(pct,100)+'%';
bar.className='budget-bar-fill '+(pct>=100?'over':pct>=80?'warn':'ok');
card.classList.remove('u-dnone');card.style.display='block';
}
};
// Wrapper global tipis ke Budget.* — digabung dari backup-restore.js (v91),
// ditaruh persis di sebelah objek Budget yang dibungkusnya. Dipakai HTML data-action & modules-render.js.
function getBudgetSettings(){return Budget.getSettings();}
function saveBudgetSettings(){return Budget.saveSettings();}
function getCatNameById(catId){return Budget.getCatNameById(catId);}
function getCatInfoById(catId){return Budget.getCatInfoById(catId);}
function budgetMatchesTx(budget,t){return Budget.matchesTx(budget,t);}
function getBudgetUsed(budget){return Budget.getUsed(budget);}
function getBudgetEffectiveLimit(budget){return Budget.getEffectiveLimit(budget);}
function cleanCatOptText(txt){return Budget.cleanCatOptText(txt);}
function onBudgetCatTotalToggle(el){return Budget.onCatTotalToggle(el);}
function onBudgetCatChildToggle(){return Budget.onCatChildToggle();}
function getSelectedBudgetCatIds(){return Budget.getSelectedCatIds();}
function autoBudgetName(){return Budget.autoName();}
function selectBudgetIcon(icon,el){return Budget.selectIcon(icon,el);}
function selectBudgetPeriod(period,el){return Budget.selectPeriod(period,el);}
function openBudgetModal(id){return Budget.openModal(id);}
function saveBudget(){return Budget.save();}
function deleteBudget(id){return Budget.delete(id);}
function openBudgetSettings(){return Budget.openSettings();}
function showAllBudgetDrillDown(){return Budget.showAllDrillDown();}
function showBudgetDrillDown(id){return Budget.showDrillDown(id);}
const BudgetTabs={
cur:'list',
switchTo(tab){
BudgetTabs.cur=tab;
const paneList=document.getElementById('budgetTabPane-list'),paneReko=document.getElementById('budgetTabPane-reko');
/* BUGFIX: dulu cuma set style.display, tapi kedua pane ini punya class "u-dnone" (display:none
   !important) di HTML awal -- style.display kalah sama !important jadi pane "reko" (Rekomendasi
   Otomatis Anggaran via AI) tidak pernah kelihatan walau tab-nya sudah aktif. Sekarang classList
   "u-dnone" ikut di-toggle, BUKAN cuma style.display. */
paneList.classList.toggle('u-dnone',tab!=='list');
paneList.style.display=tab==='list'?'':'none';
paneReko.classList.toggle('u-dnone',tab!=='reko');
paneReko.style.display=tab==='reko'?'':'none';
document.querySelectorAll('.budget-tab-btn').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
const settingsBtn=document.getElementById('budgetTabSettingsBtn'),addBtn=document.getElementById('budgetTabAddBtn');
if(settingsBtn)settingsBtn.style.display=tab==='list'?'':'none';
if(addBtn)addBtn.style.display=tab==='list'?'':'none';
if(tab==='reko'&&typeof BudgetReko!=='undefined')BudgetReko.render();
}
};
const BudgetReko={
_lastCats:[],
getSettings(){
D.budgetReko=D.budgetReko||{months:3,buffer:10};
let months=Number(D.budgetReko.months); if(![3,6].includes(months))months=3;
let buffer=Number(D.budgetReko.buffer); if(![0,10,20].includes(buffer))buffer=10;
return {months,buffer};
},
setMonths(m){
D.budgetReko=D.budgetReko||{};
D.budgetReko.months=m;
save();
BudgetReko.render();
},
setBuffer(b){
D.budgetReko=D.budgetReko||{};
D.budgetReko.buffer=b;
save();
BudgetReko.render();
},
monthsAvailable(){
if(!D.transactions||!D.transactions.length)return 0;
let earliest=null;
D.transactions.forEach(t=>{const d=new Date(t.date);if(!earliest||d<earliest)earliest=d;});
if(!earliest)return 0;
const now=new Date();
return Math.max(1,(now.getFullYear()-earliest.getFullYear())*12+(now.getMonth()-earliest.getMonth())+1);
},
effectiveMonths(){
const {months}=BudgetReko.getSettings();
return Math.max(1,Math.min(months,BudgetReko.monthsAvailable()||1));
},
rangeFrom(){
const months=BudgetReko.effectiveMonths();
const now=new Date();
return new Date(now.getFullYear(),now.getMonth()-months+1,1);
},
incomeAvgPerMonth(){
const months=BudgetReko.effectiveMonths();
const from=BudgetReko.rangeFrom(),now=new Date();
const total=D.transactions.filter(t=>t.type==='income'&&new Date(t.date)>=from&&new Date(t.date)<=now).reduce((s,t)=>s+t.amount,0);
return total/months;
},
computeCategoryAverages(){
const months=BudgetReko.effectiveMonths();
const from=BudgetReko.rangeFrom(),now=new Date();
const txs=D.transactions.filter(t=>t.type==='expense'&&new Date(t.date)>=from&&new Date(t.date)<=now);
const map={};
txs.forEach(t=>{
const key=t.category||'Lainnya';
if(!map[key])map[key]={total:0,count:0};
map[key].total+=t.amount;
map[key].count++;
});
return Object.entries(map).map(([name,v])=>({name,total:v.total,count:v.count,avgPerMonth:v.total/months})).sort((a,b)=>b.avgPerMonth-a.avgPerMonth);
},
findCatIdByName(name){
const cat=D.categories.expense.find(c=>c.name===name);
return cat?cat.id:null;
},
existingBudgetFor(catId){
return (D.budgets||[]).find(b=>(b.catIds||[]).includes(catId)||b.catId===catId);
},
roundLimit(n){
return Math.ceil(Math.max(0,n)/5000)*5000;
},
applyByIndex(i){
const c=BudgetReko._lastCats[i];
if(!c){toast('⚠️ Data tidak ditemukan, coba refresh halaman');return;}
BudgetReko._applyOne(c);
save();
Budget.render();
BudgetReko.render();
toast('✅ Anggaran "'+c.name+'" ditetapkan: '+fmtFull(BudgetReko.roundLimit(c.avgPerMonth*(1+BudgetReko.getSettings().buffer/100))));
},
_applyOne(c){
const catId=BudgetReko.findCatIdByName(c.name);
if(!catId)return false;
const {buffer}=BudgetReko.getSettings();
const limit=BudgetReko.roundLimit(c.avgPerMonth*(1+buffer/100));
const existing=BudgetReko.existingBudgetFor(catId);
if(existing){
if(existing.limit===limit)return false;
existing.limit=limit;
if(!existing.catIds||!existing.catIds.length)existing.catIds=[catId];
delete existing.catId;
}else{
const catInfo=D.categories.expense.find(x=>x.id===catId);
D.budgets.push({id:'bgt_'+uid(),name:c.name,limit,catIds:[catId],icon:catInfo?catInfo.emoji:'💰',note:'Otomatis dari Rekomendasi Anggaran',rollover:false,period:'bulanan',createdAt:new Date().toISOString()});
}
return true;
},
applyAll(){
if(!BudgetReko._lastCats.length){toast('⚠️ Belum ada rekomendasi untuk diterapkan');return;}
let applied=0;
BudgetReko._lastCats.forEach(c=>{ if(BudgetReko._applyOne(c))applied++; });
save();
Budget.render();
BudgetReko.render();
toast(applied?('✅ '+applied+' anggaran diterapkan/diupdate sekaligus'):'✅ Semua anggaran sudah sesuai rekomendasi, tidak ada yang diubah');
},
render(){
const box=document.getElementById('budgetRekoResult');
if(!box)return;
const {months,buffer}=BudgetReko.getSettings();
document.querySelectorAll('#brMonthChips .chip-btn').forEach(b=>b.classList.toggle('active',parseInt(b.dataset.m)===months));
document.querySelectorAll('#brBufferChips .chip-btn').forEach(b=>b.classList.toggle('active',parseInt(b.dataset.b)===buffer));
const avail=BudgetReko.monthsAvailable();
if(avail<2){
box.innerHTML='<div class="empty"><div class="empty-icon">🎯</div><div class="empty-text">Belum cukup histori transaksi (minimal ~2 bulan) utk kasih rekomendasi yang masuk akal. Catat transaksi terus ya, nanti otomatis muncul di sini.</div></div>';
BudgetReko._lastCats=[];
return;
}
const incomeAvg=BudgetReko.incomeAvgPerMonth();
const cats=BudgetReko.computeCategoryAverages().filter(c=>c.count>=2);
BudgetReko._lastCats=cats;
const totalReko=cats.reduce((s,c)=>s+c.avgPerMonth,0);
const pctOfIncome=incomeAvg>0?Math.round(totalReko/incomeAvg*100):null;
let html='<div class="u-flex u-jcb u-fs12 u-mb6"><span class="u-t2">Rata-rata Pemasukan/bulan ('+months+' bln terakhir)</span><span class="u-fw700">'+fmtFull(incomeAvg)+'</span></div>'+
'<div class="u-flex u-jcb u-fs12 u-mb12" style="padding-bottom:10px;border-bottom:1px solid var(--border)"><span class="u-t2">Total Rata-rata Pengeluaran/bulan</span><span class="u-fw700">'+fmtFull(totalReko)+(pctOfIncome!==null?' <span class="u-t2 u-fw400">('+pctOfIncome+'% dari pemasukan)</span>':'')+'</span></div>';
if(cats.length){
const belumSesuaiCount=cats.filter(c=>{
const catId=BudgetReko.findCatIdByName(c.name);
const existing=catId?BudgetReko.existingBudgetFor(catId):null;
const reko=BudgetReko.roundLimit(c.avgPerMonth*(1+buffer/100));
return !existing||existing.limit!==reko;
}).length;
if(belumSesuaiCount>0){
html+='<button type="button" class="btn btn-primary btn-full btn-sm u-mb12" data-action="BudgetReko.applyAll">⚡ Terapkan Semua Sekaligus ('+belumSesuaiCount+' kategori)</button>';
}
}
if(!cats.length){
html+='<div class="empty"><div class="empty-icon">📋</div><div class="empty-text">Belum ada kategori pengeluaran yang cukup sering muncul (min. 2x) di rentang waktu ini.</div></div>';
}else{
html+=cats.map((c,i)=>{
const catId=BudgetReko.findCatIdByName(c.name);
const catInfo=catId?D.categories.expense.find(x=>x.id===catId):null;
const existing=catId?BudgetReko.existingBudgetFor(catId):null;
const reko=BudgetReko.roundLimit(c.avgPerMonth*(1+buffer/100));
const sudahSesuai=existing&&existing.limit===reko;
return `<div style="padding:10px 0;border-bottom:1px solid var(--border)">
          <div class="u-flex u-jcb u-aic u-mb4">
            <div class="u-fs13 u-fw600">${catInfo?catInfo.emoji:'💰'} ${escapeHtml(c.name)}</div>
            <div class="u-fs11 u-t2">${c.count}x transaksi</div>
          </div>
          <div class="u-flex u-jcb u-aic">
            <div class="u-fs12t2">Rata-rata: ${fmtFull(c.avgPerMonth)}/bln${existing?' · Anggaran saat ini: '+fmtFull(existing.limit):''}</div>
            <button type="button" class="chip-btn${sudahSesuai?' active':''}" style="white-space:nowrap" data-action="BudgetReko.applyByIndex" data-args="${escapeHtml(JSON.stringify([i]))}">${sudahSesuai?'✓ Sudah Sesuai':(existing?'🔄 Update ke '+fmt(reko):'➕ Tetapkan '+fmt(reko))}</button>
          </div>
        </div>`;
}).join('');
}
box.innerHTML=html;
},
init(){ BudgetReko.render(); }
};
const VEHTAX_ITEMS={
tahunan:{label:'🧾 STNK Tahunan',tglKey:'pajakTahunanTgl',biayaKey:'biayaTahunan',advance:d=>d.setFullYear(d.getFullYear()+1)},
limaTahun:{label:'🔄 Ganti Plat (5th)',tglKey:'pajakLimaTahunTgl',biayaKey:'biayaLimaTahun',advance:d=>d.setFullYear(d.getFullYear()+5)},
uji:{label:'🚗 Uji Kelayakan',tglKey:'ujiKelayakanTgl',biayaKey:'biayaUji',advance:d=>d.setMonth(d.getMonth()+6)}
};
const VEHTAX_INPUT_IDS={
tahunan:{date:'vehTaxTahunan',biaya:'vehBiayaTahunan'},
limaTahun:{date:'vehTaxLimaTahun',biaya:'vehBiayaLimaTahun'},
uji:{date:'vehTaxUji',biaya:'vehBiayaUji'}
};
const BBM={
editId:null,
listPage:1,
lastFilterSig:null,
openModal(editId){
BBM.editId=(typeof editId!=='undefined')?editId:null;
const isEdit=BBM.editId!==null;
document.getElementById('bbmModalTitle').textContent=isEdit?'Edit Catatan BBM':'Catat Isi BBM';
document.getElementById('bbmDelBtn').style.display=isEdit?'flex':'none';
const bbmAccEl=document.getElementById('bbmAcc');
if(bbmAccEl) bbmAccEl.innerHTML=D.accounts.map(a=>`<option value="${a.id}">${a.emoji} ${escapeHtml(a.name)}</option>`).join('');
if(isEdit){
const b=D.bbmLogs.find(x=>x.id===BBM.editId);
if(!b)return;
document.getElementById('bbmDate').value=b.date;
document.getElementById('bbmKm').value=b.km;
document.getElementById('bbmLiter').value=b.liter;
document.getElementById('bbmHarga').value=b.harga||'';
document.getElementById('bbmCost').value=b.cost;
document.getElementById('bbmSpbu').value=b.spbu||'';
document.getElementById('bbmFull').checked=!!b.fullTank;
document.getElementById('bbmNote').value=b.note||'';
if(bbmAccEl&&b.accountId)bbmAccEl.value=b.accountId;
} else {
document.getElementById('bbmDate').value=new Date().toISOString().split('T')[0];
['bbmLiter','bbmHarga','bbmCost','bbmSpbu','bbmNote'].forEach(id=>document.getElementById(id).value='');
document.getElementById('bbmKm').value=getVehicleKm(curVehicleId)||'';
document.getElementById('bbmFull').checked=true;
}
openModal('bbmModal');
},
syncCost(){
const liter=parseFloat(document.getElementById('bbmLiter').value);
const harga=parseFloat(document.getElementById('bbmHarga').value);
if(liter&&harga)document.getElementById('bbmCost').value=Math.round(liter*harga);
},
syncLiterFromCost(){
const harga=parseFloat(document.getElementById('bbmHarga').value);
const cost=parseFloat(document.getElementById('bbmCost').value);
if(harga>0&&cost>0){
document.getElementById('bbmLiter').value=(cost/harga).toFixed(2);
}
},
syncHargaChanged(){
const liter=parseFloat(document.getElementById('bbmLiter').value);
const harga=parseFloat(document.getElementById('bbmHarga').value);
const cost=parseFloat(document.getElementById('bbmCost').value);
if(liter>0&&harga>0){
document.getElementById('bbmCost').value=Math.round(liter*harga);
}else if(harga>0&&cost>0){
document.getElementById('bbmLiter').value=(cost/harga).toFixed(2);
}
},
save(){return withSaveGuard('bbm','bbmModal',BBM._saveInner);},
_saveInner(){
const km=parseFloat(document.getElementById('bbmKm').value);
const liter=parseFloat(document.getElementById('bbmLiter').value);
let cost=parseFloat(document.getElementById('bbmCost').value);
let harga=parseFloat(document.getElementById('bbmHarga').value);
if(!km||!liter||!cost){toast('⚠️ Lengkapi KM, liter, dan biaya');return;}
const spbu=document.getElementById('bbmSpbu').value.trim();
const fullTank=document.getElementById('bbmFull').checked;
const date=document.getElementById('bbmDate').value;
const note=document.getElementById('bbmNote').value;
const accId=document.getElementById('bbmAcc')?document.getElementById('bbmAcc').value:D.accounts[0]?.id;
const veh=D.vehicles.find(v=>v.id===curVehicleId);
const noteFull='BBM'+(veh?' '+veh.name:'')+(spbu?' - '+spbu:'')+(note?' - '+note:'');
const isEdit=BBM.editId!==null;
const existing=isEdit?D.bbmLogs.find(x=>x.id===BBM.editId):null;
if(isEdit&&!existing){toast('⚠️ Data tidak ditemukan');return;}
// BUGFIX: catatan BBM "yatim" (existing.txLinkId hilang, mis. transaksi
// terkaitnya kehapus manual) dulu SILENTLY tetap tidak tersinkron kalau
// diedit, krn txId jatuh ke null & cabang "if(txId)" di bawah dilewati.
// Sekarang: kalau ketahuan yatim saat edit, generate txId baru & buat
// ulang transaksinya (sama seperti alur catatan baru), bukan dibiarkan.
const wasOrphan=isEdit&&!existing.txLinkId;
const txId=isEdit?(existing.txLinkId||uid()):uid();
const result=recordBbmLog({
vehicleId:curVehicleId,date,km,liter,harga,cost,spbu,fullTank,note,accountId:accId,
txId,existingBbmId:isEdit?BBM.editId:null
});
if(isEdit){
if(wasOrphan){
D.transactions.push({id:txId,type:'expense',amount:cost,category:resolveVehicleTxCategory(veh),subcategory:'Bensin',accountId:accId,payMethod:'tunai',note:noteFull,date,bbmLinkId:result.bbmId});
const b=D.bbmLogs.find(x=>x.id===result.bbmId);
if(b)b.txLinkId=txId;
toast('✅ Catatan BBM diperbarui & disinkron ulang ke Keuangan');
}else{
const tx=D.transactions.find(t=>t.id===txId);
if(tx)Object.assign(tx,{amount:cost,date,accountId:accId,note:noteFull});
toast('✅ Catatan BBM diperbarui');
}
} else {
D.transactions.push({id:txId,type:'expense',amount:cost,category:resolveVehicleTxCategory(veh),subcategory:'Bensin',accountId:accId,payMethod:'tunai',note:noteFull,date,bbmLinkId:result.bbmId});
toast('✅ Catatan BBM tersimpan & tersinkron ke Keuangan');
}
save();closeModal('bbmModal');renderCnTab();renderDashboard();renderKeuangan();
},
deleteFromModal(){if(BBM.editId===null)return;const id=BBM.editId;closeModal('bbmModal');BBM.del(id);},
async del(id){
if(!await askConfirm('Hapus catatan ini? Catatan keuangan terkait juga akan dihapus.'))return;
const b=D.bbmLogs.find(x=>x.id===id);
if(b&&b.txLinkId)D.transactions=D.transactions.filter(tx=>tx.id!==b.txLinkId);
D.bbmLogs=D.bbmLogs.filter(b=>b.id!==id);
save();renderCnTab();renderDashboard();renderKeuangan();toast('🗑 Catatan BBM dihapus');
},
svgCostBar(months,byMonth){
if(!months.length)return '<div class="u-fs12 u-t2 u-tac" style="padding:14px 0">Belum ada data biaya BBM di periode ini.</div>';
const maxCost=Math.max(...months.map(m=>byMonth[m].cost),1);
const barW=34,gap=18,padL=10,chartH=64;
const w=months.length*(barW+gap)+padL;
let bars='';
months.forEach((m,idx)=>{
const val=byMonth[m].cost;
const h=Math.max(4,Math.round((val/maxCost)*chartH));
const x=padL+idx*(barW+gap);
const y=chartH-h+18;
bars+=`<rect x="${x}" y="${y}" width="${barW}" height="${h}" rx="5" style="fill:var(--accent2)"/>`
+`<text x="${x+barW/2}" y="${y-6}" text-anchor="middle" style="font-size:9px;fill:var(--text2);font-family:'Plus Jakarta Sans',sans-serif">${fmt(val)}</text>`
+`<text x="${x+barW/2}" y="${chartH+32}" text-anchor="middle" style="font-size:9px;fill:var(--text3);font-family:'Plus Jakarta Sans',sans-serif">${byMonth[m].label}</text>`;
});
return `<svg class="u-w100" viewBox="0 0 ${w} ${chartH+40}" style="height:auto;display:block">${bars}</svg>`;
},
svgEffLine(points){
if(points.length<2)return '<div class="u-fs12 u-t2 u-tac" style="padding:14px 0">Butuh minimal 3 isi BBM "penuh" (full tank) berurutan buat menghitung tren efisiensi.</div>';
const vals=points.map(p=>p.kml);
const max=Math.max(...vals),min=Math.min(...vals);
const range=(max-min)||1;
const padT=14,padB=22,padX=10;
const w=Math.max(points.length*54,200),h=64;
const stepX=points.length>1?(w-padX*2)/(points.length-1):0;
const coords=points.map((p,i)=>({x:padX+i*stepX,y:padT+(1-(p.kml-min)/range)*(h-padT-padB),...p}));
const poly=coords.map(c=>`${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
let dots='';
coords.forEach(c=>{
dots+=`<circle cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="3" style="fill:var(--accent3)"/>`
+`<text x="${c.x.toFixed(1)}" y="${(c.y-8).toFixed(1)}" text-anchor="middle" style="font-size:9px;fill:var(--text2);font-family:'Plus Jakarta Sans',sans-serif">${c.kml.toFixed(1)}</text>`
+`<text x="${c.x.toFixed(1)}" y="${h+10}" text-anchor="middle" style="font-size:8px;fill:var(--text3);font-family:'Plus Jakarta Sans',sans-serif">${c.label}</text>`;
});
return `<svg class="u-w100" viewBox="0 0 ${w} ${h+20}" style="height:auto;display:block"><polyline points="${poly}" style="fill:none;stroke:var(--accent3);stroke-width:2"/>${dots}</svg>`;
},
renderTrend(logs){
const box=document.getElementById('bbmTrendCard');
if(!box)return;
const byMonth={};
logs.forEach(b=>{
const d=new Date(b.date);
if(isNaN(d))return;
const key=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
if(!byMonth[key])byMonth[key]={cost:0,label:d.toLocaleDateString('id-ID',{month:'short',year:'2-digit'})};
byMonth[key].cost+=b.cost;
});
const months=Object.keys(byMonth).sort().slice(-6);
const sortedByKm=[...logs].sort((a,b)=>a.km-b.km);
const fullIdx=sortedByKm.map((b,i)=>b.fullTank?i:-1).filter(i=>i>=0);
const effPoints=[];
for(let n=0;n<fullIdx.length-1;n++){
const i=fullIdx[n],j=fullIdx[n+1];
const kmDist=sortedByKm[j].km-sortedByKm[i].km;
const literUsed=sortedByKm.slice(i+1,j+1).reduce((s,x)=>s+x.liter,0);
if(kmDist>0&&literUsed>0)effPoints.push({kml:kmDist/literUsed,label:new Date(sortedByKm[j].date).toLocaleDateString('id-ID',{day:'2-digit',month:'short'})});
}
const lastEff=effPoints.slice(-8);
box.innerHTML=`<div class="card-title">📈 Tren BBM</div>
      <div class="u-fs11 u-t2 u-fw700 u-mb6">💸 Biaya per Bulan (${months.length?'6 bulan terakhir':'-'})</div>
      ${BBM.svgCostBar(months,byMonth)}
      <div style="height:1px;background:var(--border);margin:14px 0"></div>
      <div class="u-fs11 u-t2 u-fw700 u-mb6">⚡ Efisiensi km/liter (per isi penuh, ${lastEff.length||0} data terakhir)</div>
      ${BBM.svgEffLine(lastEff)}`;
},
renderList(){
const {from,to}=getCnRange();
const filterSig=curVehicleId+'|'+(+from)+'|'+(+to);
if(filterSig!==BBM.lastFilterSig){BBM.listPage=1;BBM.lastFilterSig=filterSig;}
const logs=D.bbmLogs.filter(b=>b.vehicleId===curVehicleId&&new Date(b.date)>=from&&new Date(b.date)<=to).sort((a,b)=>a.km-b.km);
const totalL=logs.reduce((s,b)=>s+b.liter,0);
const totalCost=logs.reduce((s,b)=>s+b.cost,0);
let avgKmL=0;
const fullIdx=logs.map((b,i)=>b.fullTank?i:-1).filter(i=>i>=0);
if(fullIdx.length>=2){
let totalKmDist=0,totalLiterUsed=0;
for(let n=0;n<fullIdx.length-1;n++){
const i=fullIdx[n],j=fullIdx[n+1];
const kmDist=logs[j].km-logs[i].km;
const literUsed=logs.slice(i+1,j+1).reduce((s,b)=>s+b.liter,0);
if(kmDist>0&&literUsed>0){totalKmDist+=kmDist;totalLiterUsed+=literUsed;}
}
if(totalLiterUsed>0)avgKmL=totalKmDist/totalLiterUsed;
} else if(logs.length>=2){
const totalJarak=logs[logs.length-1].km-logs[0].km;
const literTanpaAwal=logs.slice(1).reduce((s,b)=>s+b.liter,0);
avgKmL=literTanpaAwal>0?(totalJarak/literTanpaAwal):0;
}
document.getElementById('bbmAvgKmL').textContent=avgKmL?avgKmL.toFixed(1):'-';
document.getElementById('bbmTotalL').textContent=totalL.toFixed(1)+' L';
document.getElementById('bbmTotalCost').textContent=fmt(totalCost);
BBM.renderTrend(logs);
const sorted=[...logs].sort((a,b)=>b.km-a.km);
const el=document.getElementById('bbmList');
if(!sorted.length){el.innerHTML='<div class="empty"><div class="empty-icon">⛽</div><div class="empty-text">Belum ada catatan BBM</div></div>';return;}
const prevMap=new Map(), cumLiterMap=new Map();
{
let prevDistinct=null,cum=0,i=0;
while(i<logs.length){
let j=i,groupLiter=0;
while(j<logs.length&&logs[j].km===logs[i].km){groupLiter+=(logs[j].liter||0);j++;}
cum+=groupLiter;
for(let k=i;k<j;k++){prevMap.set(logs[k].id,prevDistinct);cumLiterMap.set(logs[k].id,cum);}
prevDistinct=logs[j-1];
i=j;
}
}
const visibleCount=Math.min(sorted.length,BBM.listPage*TX_PAGE_SIZE);
const visible=sorted.slice(0,visibleCount);
el.innerHTML=visible.map((b)=>{
const prev=prevMap.get(b.id)||null;
let kmL=null;
if(prev&&b.fullTank){
const jarak=b.km-prev.km;
const literSejak=cumLiterMap.get(b.id)-(prev?cumLiterMap.get(prev.id):0);
kmL=(jarak>0&&literSejak>0)?(jarak/literSejak):null;
}
return`<div class="tx-item u-pointer" data-action="openBbmModal" data-args="${escapeHtml(JSON.stringify([b.id]))}">
        <div class="tx-icon" style="background:var(--accent4-soft)">⛽</div>
        <div class="tx-info"><div class="tx-name">${b.km!=null?b.km.toLocaleString('id-ID')+' km':'(km tidak dicatat)'} · ${b.liter}L${b.harga?' · Rp'+Math.round(b.harga).toLocaleString('id-ID')+'/L':''}</div><div class="tx-meta">${b.date}${b.spbu?' · '+escapeHtml(b.spbu):''}${b.fullTank?' · Full Tank':' · Isi sebagian'}${b.note?' · '+escapeHtml(b.note):''}</div></div>
        <div class="u-flex u-fdcol u-gap4" style="align-items:flex-end">
          <div class="tx-amount red">${fmt(b.cost)}</div>
          ${kmL?`<span class="kmL-badge">${kmL.toFixed(1)} km/L</span>`:''}
        </div>
        <button class="tx-del" data-stop="1" data-action="delBbm" data-args="${escapeHtml(JSON.stringify([b.id]))}" aria-label="Hapus">🗑</button>
      </div>`;
}).join('');
let bbmMoreWrap=document.getElementById('bbmListLoadMoreWrap');
if(!bbmMoreWrap){
bbmMoreWrap=document.createElement('div');
bbmMoreWrap.id='bbmListLoadMoreWrap';
bbmMoreWrap.style.cssText='text-align:center;margin-top:10px';
bbmMoreWrap.innerHTML='<button class="btn btn-ghost btn-sm" data-action="loadMoreBbmList"></button>';
el.insertAdjacentElement('afterend',bbmMoreWrap);
}
if(visibleCount<sorted.length){
bbmMoreWrap.style.display='block';
bbmMoreWrap.querySelector('button').textContent=`⬇️ Tampilkan lebih banyak (${sorted.length-visibleCount} lagi)`;
} else bbmMoreWrap.style.display='none';
},
loadMore(){BBM.listPage++;BBM.renderList();}
};
const Servis={
editId:null,
listPage:1,
lastFilterSig:null,
populatePartSelect(selectedPartId){
const sel=document.getElementById('servisPartId');
if(!sel)return;
const opts=D.partsStock.map(p=>`<option value="${p.id}">${escapeHtml(p.name)} (sisa ${p.qty}${p.unit?' '+p.unit:''})</option>`).join('');
sel.innerHTML='<option value="">Tidak pakai stok</option>'+opts;
sel.value=selectedPartId||'';
Servis.onPartChange();
},
onPartChange(){
const sel=document.getElementById('servisPartId');
const wrap=document.getElementById('servisPartQtyWrap');
if(!sel||!wrap)return;
wrap.style.display=sel.value?'block':'none';
},
onItemAutofillInterval(){
const item=document.getElementById('servisItem').value.trim();
const intervalEl=document.getElementById('servisInterval');
if(!intervalEl||intervalEl.dataset.manual==='1')return;
const matched=item?D.sparepartCats.find(c=>c.name.toLowerCase()===item.toLowerCase()):null;
intervalEl.value=matched?matched.intervalKm:'';
},
openModal(editId,prefillItem){
Sparepart.populateDatalist();
Servis.editId=(typeof editId!=='undefined')?editId:null;
const isEdit=Servis.editId!==null;
document.getElementById('servisModalTitle').textContent=isEdit?'Edit Catatan Servis':'Catat Servis/Sparepart';
document.getElementById('servisDelBtn').style.display=isEdit?'flex':'none';
const servisAccEl=document.getElementById('servisAcc');
if(servisAccEl) servisAccEl.innerHTML=D.accounts.map(a=>`<option value="${a.id}">${a.emoji} ${escapeHtml(a.name)}</option>`).join('');
const intervalEl=document.getElementById('servisInterval');
if(intervalEl)intervalEl.dataset.manual='0';
if(isEdit){
const s=D.servisLogs.find(x=>x.id===Servis.editId);
if(!s)return;
document.getElementById('servisDate').value=s.date;
document.getElementById('servisItem').value=s.item;
document.getElementById('servisKm').value=s.km||'';
document.getElementById('servisCost').value=s.cost;
document.getElementById('servisNote').value=s.note||'';
if(servisAccEl&&s.accountId)servisAccEl.value=s.accountId;
Servis.populatePartSelect(s.usedPartId);
document.getElementById('servisPartQty').value=s.usedPartQty||1;
const linkedCat=(s.categoryId&&D.sparepartCats.find(c=>c.id===s.categoryId))||D.sparepartCats.find(c=>c.name.toLowerCase()===s.item.toLowerCase());
if(intervalEl)intervalEl.value=linkedCat?linkedCat.intervalKm:'';
} else {
document.getElementById('servisDate').value=new Date().toISOString().split('T')[0];
['servisItem','servisCost','servisNote'].forEach(id=>document.getElementById(id).value='');
document.getElementById('servisKm').value=getVehicleKm(curVehicleId)||'';
if(intervalEl)intervalEl.value='';
Servis.populatePartSelect('');
document.getElementById('servisPartQty').value=1;
if(prefillItem){
document.getElementById('servisItem').value=prefillItem;
Servis.onItemAutofillInterval();
const matchStock=D.partsStock.find(p=>p.name.toLowerCase()===prefillItem.toLowerCase()||p.name.toLowerCase().includes(prefillItem.toLowerCase())||prefillItem.toLowerCase().includes(p.name.toLowerCase()));
if(matchStock)Servis.populatePartSelect(matchStock.id);
}
}
openModal('servisModal');
},
revertStockUsage(partId,qty){
if(!partId||!qty)return;
const p=D.partsStock.find(x=>x.id===partId);
if(p)p.qty=(p.qty||0)+qty;
},
async applyStockUsage(partId,qty){
if(!partId||!qty)return true;
const p=D.partsStock.find(x=>x.id===partId);
if(!p)return true;
if(p.qty<qty){
if(!await askConfirm(`⚠️ Stok "${escapeHtml(p.name)}" cuma sisa ${p.qty}${p.unit?' '+p.unit:''}, dipakai ${qty}. Tetap lanjut & stok jadi minus?`,{danger:false,okText:'Ya, Lanjut'}))return false;
}
p.qty=(p.qty||0)-qty;
return true;
},
save(){return withSaveGuardAsync('servis','servisModal',Servis._saveInner);},
async _saveInner(){
const item=document.getElementById('servisItem').value.trim();
const cost=parseFloat(document.getElementById('servisCost').value);
if(!item||!cost){toast('⚠️ Lengkapi jenis servis dan biaya');return;}
let matched=D.sparepartCats.find(c=>c.name.toLowerCase()===item.toLowerCase());
const date=document.getElementById('servisDate').value;
const note=document.getElementById('servisNote').value;
const accId=document.getElementById('servisAcc')?document.getElementById('servisAcc').value:D.accounts[0]?.id;
const km=parseFloat(document.getElementById('servisKm').value)||null;
const intervalRaw=document.getElementById('servisInterval')?document.getElementById('servisInterval').value:'';
const intervalKm=intervalRaw?parseFloat(intervalRaw):null;
const veh=D.vehicles.find(v=>v.id===curVehicleId);
const noteFull=item+(veh?' - '+veh.name:'')+(note?' - '+note:'');
const usedPartId=document.getElementById('servisPartId')?document.getElementById('servisPartId').value:'';
const usedPartQty=usedPartId?(parseFloat(document.getElementById('servisPartQty').value)||0):0;
const itemIsVehicleName=!!matchingVehicleName(item);
let catIdForLog=matched?matched.id:null;
let newCatCreated=false;
if(intervalKm&&intervalKm>0){
if(matched){
matched.intervalKm=intervalKm;
} else if(item&&!itemIsVehicleName){
const newCat={id:'sp_'+Date.now(),name:item,code:codeFromName(item),intervalKm};
D.sparepartCats.push(newCat);
matched=newCat;
catIdForLog=newCat.id;
newCatCreated=true;
}
}
if(Servis.editId!==null){
const s=D.servisLogs.find(x=>x.id===Servis.editId);
if(!s){toast('⚠️ Data tidak ditemukan');return;}
Servis.revertStockUsage(s.usedPartId,s.usedPartQty);
if(usedPartId&&!await Servis.applyStockUsage(usedPartId,usedPartQty)){
await Servis.applyStockUsage(s.usedPartId,s.usedPartQty);
return;
}
if(intervalKm&&intervalKm>0&&!matched&&s.categoryId){
const linkedCat=D.sparepartCats.find(c=>c.id===s.categoryId);
if(linkedCat){linkedCat.intervalKm=intervalKm;catIdForLog=linkedCat.id;}
}
Object.assign(s,{date,item,categoryId:catIdForLog||s.categoryId,km,cost,note,accountId:accId,usedPartId:usedPartId||null,usedPartQty:usedPartId?usedPartQty:0});
if(s.txLinkId){
const tx=D.transactions.find(t=>t.id===s.txLinkId);
if(tx)Object.assign(tx,{amount:cost,date,accountId:accId,note:noteFull});
}
save();closeModal('servisModal');renderCnTab();renderDashboard();renderKeuangan();Sparepart.renderStockList();Sparepart.renderCatList();toast('✅ Catatan servis diperbarui'+(intervalKm?' & interval pengingat disinkron':''));
return;
}
if(usedPartId&&!await Servis.applyStockUsage(usedPartId,usedPartQty))return;
const servisId=uid();
const txId=uid();
D.transactions.push({id:txId,type:'expense',amount:cost,category:resolveVehicleTxCategory(veh),subcategory:'Servis & Oli',accountId:accId,payMethod:'tunai',note:noteFull,date,servisLinkId:servisId});
D.servisLogs.push({id:servisId,vehicleId:curVehicleId,date,item,categoryId:catIdForLog,km,cost,note,accountId:accId,txLinkId:txId,usedPartId:usedPartId||null,usedPartQty:usedPartId?usedPartQty:0});
save();closeModal('servisModal');renderCnTab();renderDashboard();renderKeuangan();Sparepart.renderStockList();Sparepart.renderCatList();
if(newCatCreated){
toast(`✅ Catatan servis tersimpan, "${item}" ditambahkan ke Pengingat Servis (tiap ${intervalKm.toLocaleString('id-ID')} km)`);
} else if(matched&&intervalKm){
toast('✅ Catatan servis tersimpan & interval pengingat disinkron');
} else if(itemIsVehicleName){
toast(`✅ Catatan servis tersimpan. (Catatan: "${item}" adalah nama kendaraan, jadi tidak dibuatkan kategori pengingat — isi jenis servisnya, mis. "Ganti Oli", di kolom Jenis Servis/Item)`,4500);
} else if(!matched&&item){
setTimeout(async()=>{
if(await askConfirm(`"${item}" belum ada di daftar pengingat servis. Tambahkan sebagai kategori pengingat baru sekarang?`,{danger:false,okText:'Ya, Tambahkan',icon:'🔔'})){
const interval=await showPromptModal({title:'Interval Servis',message:'Interval servis untuk "'+item+'" (KM):',icon:'🔧',inputType:'number',defaultValue:3000});
const n=parseFloat(interval);
if(n&&n>0){
const newCat={id:'sp_'+Date.now(),name:item,code:codeFromName(item),intervalKm:n};
D.sparepartCats.push(newCat);
const s2=D.servisLogs.find(x=>x.id===servisId);
if(s2)s2.categoryId=newCat.id;
save();Sparepart.renderCatList();Servis.renderList();toast('✅ Kategori pengingat ditambahkan');
}
}
},150);
} else {
toast('✅ Catatan servis tersimpan & tersinkron ke Keuangan');
}
},
deleteFromModal(){if(Servis.editId===null)return;const id=Servis.editId;closeModal('servisModal');Servis.del(id);},
async del(id){
if(!await askConfirm('Hapus catatan ini? Catatan keuangan terkait juga akan dihapus.'))return;
const s=D.servisLogs.find(x=>x.id===id);
if(s&&s.txLinkId)D.transactions=D.transactions.filter(tx=>tx.id!==s.txLinkId);
if(s&&s.usedPartId)Servis.revertStockUsage(s.usedPartId,s.usedPartQty);
D.servisLogs=D.servisLogs.filter(s=>s.id!==id);
save();renderCnTab();renderDashboard();renderKeuangan();Sparepart.renderStockList();toast('🗑 Catatan servis dihapus');
},
async markServiced(catId){
const cat=D.sparepartCats.find(c=>c.id===catId);
if(!cat)return;
const curKm=getVehicleKm(curVehicleId);
if(!await askConfirm(`Tandai "${cat.name}" sudah diservis hari ini di KM ${curKm.toLocaleString('id-ID')}? Pengingat akan otomatis reset ke KM ini.`,{danger:false,okText:'Ya, Tandai',icon:'✅'}))return;
const costStr=await showPromptModal({title:'Biaya Servis',message:'Biaya servis ini (opsional, boleh dikosongkan/0):',icon:'💵',inputType:'number',defaultValue:0});
const cost=parseFloat(costStr)||0;
const date=new Date().toISOString().split('T')[0];
const accId=D.accounts[0]?.id;
const veh=D.vehicles.find(v=>v.id===curVehicleId);
const servisId=uid();
const entry={id:servisId,vehicleId:curVehicleId,date,item:cat.name,categoryId:cat.id,km:curKm,cost,note:'Ditandai selesai dari Pengingat Servis',accountId:accId,txLinkId:null};
if(cost>0){
const txId=uid();
D.transactions.push({id:txId,type:'expense',amount:cost,category:resolveVehicleTxCategory(veh),subcategory:'Servis & Oli',accountId:accId,payMethod:'tunai',note:cat.name+(veh?' - '+veh.name:'')+' (tandai selesai)',date,servisLinkId:servisId});
entry.txLinkId=txId;
}
D.servisLogs.push(entry);
save();renderCnTab();renderDashboard();renderKeuangan();toast(`✅ ${cat.name} ditandai selesai, pengingat direset ke KM sekarang`);
},
getLastServiceKmForCat(vehicleId,cat){
const logs=D.servisLogs.filter(s=>s.vehicleId===vehicleId&&s.km&&servisLogMatchesCat(s,cat))
.sort((a,b)=>new Date(b.date)-new Date(a.date)||b.km-a.km);
return logs.length?logs[0].km:null;
},
editSparepartFromReminder(catId){
const idx=D.sparepartCats.findIndex(c=>c.id===catId);
if(idx<0){toast('⚠️ Kategori sparepart tidak ditemukan');return;}
Sparepart.openCatModal(idx);
},
renderReminder(){
const card=document.getElementById('servisReminderCard');
if(!card)return;
const curKm=getVehicleKm(curVehicleId);
const kmPerDay=estimateKmPerDay(curVehicleId);
if(!D.sparepartCats.length){card.innerHTML='<div class="card-title">🔔 Pengingat Servis</div><div class="empty"><div class="empty-text">Belum ada kategori sparepart. Atur di Pengaturan.</div></div>';return;}
const rows=D.sparepartCats.map(cat=>{
const lastKm=Servis.getLastServiceKmForCat(curVehicleId,cat);
const intervalKm=getEffectiveIntervalKm(curVehicleId,cat);
const overridden=hasIntervalOverride(curVehicleId,cat);
const jarakTempuh=lastKm===null?curKm:curKm-lastKm;
const sisa=intervalKm-jarakTempuh;
const pct=Math.min(100,Math.max(0,Math.round((jarakTempuh/intervalKm)*100)));
let col='green',msg=`Sisa ${sisa.toLocaleString('id-ID')} km`;
if(sisa<=0){col='red';msg=`⚠️ Lewat ${Math.abs(sisa).toLocaleString('id-ID')} km`;}
else if(sisa<=intervalKm*0.15){col='orange';msg=`🔔 Sisa ${sisa.toLocaleString('id-ID')} km`;}
const estDateISO=estimateServiceDateISO(sisa,kmPerDay);
const estLabel=estDateISO?` · ~${fmtDateID(estDateISO)}`:'';
return{cat,lastKm,intervalKm,overridden,sisa,pct,col,msg,estLabel};
}).sort((a,b)=>a.sisa-b.sisa);
card.innerHTML=`<div class="card-title">🔔 Pengingat Servis per Part <span class="card-collapse-toggle" id="servisReminderCard-chev" data-action="toggleCardCollapse" data-args='["servisReminderCard","$event"]' aria-label="Buka/tutup bagian">▾</span></div><div class="card-collapse-body" id="servisReminderCard-cbody">`+(kmPerDay?`<div class="u-fs11 u-t2 u-mb10">📊 Estimasi tanggal dihitung dari rata-rata pemakaian ~${kmPerDay.toFixed(1)} km/hari (histori Catatan KM & BBM).</div>`:'')+rows.map(r=>`
      <div class="u-mb12">
        <div class="u-flex u-jcb u-aic u-fs12 u-mb4 u-pointer" data-action="editSparepartFromReminder" data-args="${escapeHtml(JSON.stringify([r.cat.id]))}" title="Tap untuk edit kategori (berlaku semua kendaraan)">
          <span class="u-fw700">${escapeHtml(r.cat.name)} <span class="u-fs11 u-t2">✏️</span></span>
          <span class="${r.col} u-fw700">${r.msg}${r.estLabel}</span>
        </div>
        <div class="prog-bar"><div class="prog-fill ${r.col}" style="width:${r.pct}%"></div></div>
        <div class="u-flex u-jcb u-aic" style="margin-top:3px">
          <div class="u-fs12t2">${r.lastKm===null?'Belum pernah dicatat':'Terakhir di '+r.lastKm.toLocaleString('id-ID')+' km'} · <span data-action="editVehicleIntervalOverride" data-args="${escapeHtml(JSON.stringify([r.cat.id]))}" title="Set interval khusus kendaraan ini" class="u-pointer">Interval ${r.intervalKm.toLocaleString('id-ID')} km${r.overridden?' <span class="u-cacc u-fw700">(khusus)</span>':''} 🔧</span></div>
          <button class="btn btn-ghost btn-sm u-fs12" style="padding:3px 10px" data-stop="1" data-action="markSparepartServiced" data-args="${escapeHtml(JSON.stringify([r.cat.id]))}">✅ Sudah Servis</button>
        </div>
      </div>`).join('')+`</div>`;
applyOneCardCollapsePref('servisReminderCard');
},
loadMore(){Servis.listPage++;Servis.renderList();},
renderList(){
Servis.renderReminder();
const {from,to}=getCnRange();
const filterSig=curVehicleId+'|'+(+from)+'|'+(+to);
if(filterSig!==Servis.lastFilterSig){Servis.listPage=1;Servis.lastFilterSig=filterSig;}
const logs=D.servisLogs.filter(s=>s.vehicleId===curVehicleId&&new Date(s.date)>=from&&new Date(s.date)<=to).sort((a,b)=>new Date(b.date)-new Date(a.date));
const totalCost=logs.reduce((s,x)=>s+(x.cost||0),0);
const lastKm=logs.reduce((m,x)=>x.km&&x.km>m?x.km:m,0);
document.getElementById('servisCount').textContent=logs.length;
document.getElementById('servisTotalCost').textContent=fmt(totalCost);
document.getElementById('servisLastKm').textContent=lastKm?lastKm.toLocaleString('id-ID')+' km':'-';
const el=document.getElementById('servisList');
if(!logs.length){el.innerHTML='<div class="empty"><div class="empty-icon">🔧</div><div class="empty-text">Belum ada catatan servis</div></div>';return;}
const visibleCount=Math.min(logs.length,Servis.listPage*TX_PAGE_SIZE);
const visible=logs.slice(0,visibleCount);
el.innerHTML=visible.map(s=>{
const part=s.usedPartId?D.partsStock.find(p=>p.id===s.usedPartId):null;
const partInfo=part?` · 📦 ${s.usedPartQty}${part.unit?' '+escapeHtml(part.unit):''} ${escapeHtml(part.name)}`:'';
return `<div class="tx-item u-pointer" data-action="openServisModal" data-args="${escapeHtml(JSON.stringify([s.id]))}"><div class="tx-icon u-bgaccsoft">🔧</div><div class="tx-info"><div class="tx-name">${escapeHtml(s.item)}</div><div class="tx-meta">${s.date}${s.km?' · '+s.km.toLocaleString('id-ID')+' km':''} ${s.note?'· '+escapeHtml(s.note):''}${partInfo}</div></div><div class="tx-amount red">${fmt(s.cost)}</div><button class="tx-del" data-stop="1" data-action="delServis" data-args="${escapeHtml(JSON.stringify([s.id]))}" aria-label="Hapus">🗑</button></div>`;
}).join('');
let servisMoreWrap=document.getElementById('servisListLoadMoreWrap');
if(!servisMoreWrap){
servisMoreWrap=document.createElement('div');
servisMoreWrap.id='servisListLoadMoreWrap';
servisMoreWrap.style.cssText='text-align:center;margin-top:10px';
servisMoreWrap.innerHTML='<button class="btn btn-ghost btn-sm" data-action="loadMoreServisList"></button>';
el.insertAdjacentElement('afterend',servisMoreWrap);
}
if(visibleCount<logs.length){
servisMoreWrap.style.display='block';
servisMoreWrap.querySelector('button').textContent=`⬇️ Tampilkan lebih banyak (${logs.length-visibleCount} lagi)`;
} else servisMoreWrap.style.display='none';
}
};
const TORSI_STANDARD_CAT={cat:'Standar (Umum)', icon:'🔩', items:[
{name:'Baut hex 5 mm & mur', ulir:'5 mm', nm:5.2, kgf:0.5},
{name:'Baut hex 6 mm & mur (termasuk baut flens SH)', ulir:'6 mm', nm:10, kgf:1.0},
{name:'Baut hex 8 mm & mur', ulir:'8 mm', nm:22, kgf:2.2},
{name:'Baut hex 10 mm & mur', ulir:'10 mm', nm:34, kgf:3.5},
{name:'Baut hex 12 mm & mur', ulir:'12 mm', nm:54, kgf:5.5},
{name:'Sekrup 5 mm', ulir:'5 mm', nm:4.2, kgf:0.4},
{name:'Sekrup 6 mm', ulir:'6 mm', nm:9.0, kgf:0.9},
{name:'Baut flens 6 mm (termasuk NSHF) & mur', ulir:'6 mm', nm:12, kgf:1.2},
{name:'Baut & mur flens 8 mm', ulir:'8 mm', nm:27, kgf:2.8},
{name:'Baut & mur flens 10 mm', ulir:'10 mm', nm:39, kgf:4.0},
]};
const MY_WRENCH={brand:'MOLLAR',sku:'MLR-B11950',minNm:13.56,maxNm:108.48,minLbft:10,maxLbft:80,panjang:280};
const Torsi={
mode:'catalog', selected:null, activeCat:'Semua', extOpen:false,
pageMode:'normal', checked:{}, biaya:{}, cats:[TORSI_STANDARD_CAT], db:null,
itemKey(cat,name){return cat+'|'+name;},
computeCats(){
const veh=D.vehicles.find(v=>v.id===curVehicleId);
this.db=veh?findTorsiDb(veh.name):null;
this.cats=[TORSI_STANDARD_CAT,...(this.db?this.db.cats:[])];
},
renderSourceNote(){
const el=document.getElementById('trsSourceNote');
if(!el)return;
el.textContent='📘 Sumber: '+(this.db?this.db.sourceNote:'Torsi standar umum (baut/mur/sekrup standar Honda). Belum ada data referensi spesifik untuk model kendaraan ini.');
},
fmt(v){if(v===null||v===undefined||isNaN(v))return '–';return (Math.round(v*100)/100).toString();},
findStock(name){
const n=name.toLowerCase();
return D.partsStock.find(p=>p.name.toLowerCase()===n||p.name.toLowerCase().includes(n)||n.includes(p.name.toLowerCase()))||null;
},
loadPersisted(){
if(!D.torsiChecklist)D.torsiChecklist={};
const rec=D.torsiChecklist[curVehicleId];
this.checked=rec&&rec.checked?{...rec.checked}:{};
this.biaya=rec&&rec.biaya?{...rec.biaya}:{};
this.pageMode=(rec&&rec.pageMode)||'normal';
},
persist(){
if(!D.torsiChecklist)D.torsiChecklist={};
D.torsiChecklist[curVehicleId]={checked:this.checked,biaya:this.biaya,pageMode:this.pageMode};
save();
},
open(){
this.mode='catalog';this.selected=null;this.activeCat='Semua';this.extOpen=false;
this.loadPersisted();
this.computeCats();
const veh=D.vehicles.find(v=>v.id===curVehicleId);
const km=getVehicleKm(curVehicleId)||0;
document.getElementById('trsVehChip').textContent=(veh?veh.emoji+' '+veh.name:'')+' · '+km.toLocaleString('id-ID')+' km';
this.renderSourceNote();
document.getElementById('trsSearchInput').value='';
document.getElementById('trsManualTorsiInput').value='';
this.setCalcMode('catalog');
this.setPageMode(this.pageMode||'normal');
this.chips();
this.renderList();
openModal('torsiModal');
},
chips(){
const cats=['Semua',...this.cats.map(d=>d.cat)];
document.getElementById('trsChipRow').innerHTML=cats.map(c=>`<div class="trs-chip ${c===Torsi.activeCat?'active':''}" data-onclick="Torsi.setCat('${c.replace(/'/g,"\\'")}')">${c==='Semua'?'🔍 Semua':escapeHtml(c)}</div>`).join('');
},
setCat(c){this.activeCat=c;this.chips();this.renderList();},
setCalcMode(m){
this.mode=m;
document.getElementById('trsModeCatalog').classList.toggle('active',m==='catalog');
document.getElementById('trsModeManual').classList.toggle('active',m==='manual');
document.getElementById('trsManualInputWrap').style.display=m==='manual'?'block':'none';
if(m==='manual')this.onManualInput();else this.updateGauge();
},
onManualInput(){
const v=parseFloat(document.getElementById('trsManualTorsiInput').value);
document.getElementById('trsGaugePartName').textContent=isNaN(v)?'Masukkan nilai torsi (N·m)':'✍️ Input manual';
this.renderGaugeValues(isNaN(v)?null:v);
},
updateGauge(){
if(this.selected){
document.getElementById('trsGaugePartName').textContent='🔩 '+this.selected.name;
this.renderGaugeValues(this.selected.nm,this.selected.note);
} else {
document.getElementById('trsGaugePartName').textContent='Pilih sparepart di bawah ⤵️';
this.renderGaugeValues(null);
}
},
selectPart(catName,itemName){
let it=null;
const cat=this.cats.find(d=>d.cat===catName);
if(cat)it=cat.items.find(x=>x.name===itemName);
if(!it||it.noTorque)return;
this.selected=it;
this.setCalcMode('catalog');
document.getElementById('trsGaugePartName').textContent='🔩 '+it.name;
this.renderGaugeValues(it.nm,it.note);
toast('✅ Dimuat ke kalkulator: '+it.name);
document.querySelector('#torsiModal .modal').scrollTop=0;
},
renderGaugeValues(nm,note){
const gv=document.getElementById('trsGaugeVal'),sub=document.getElementById('trsGaugeSub');
if(nm===null||nm===undefined||isNaN(nm)){
gv.textContent='–';sub.textContent='';
['nm','kgf','lbft','lbin'].forEach(u=>document.getElementById('trsVal-'+u).textContent='–');
} else {
gv.textContent=nm;
sub.textContent=note==='oli'?'🛢️ Oleskan oli mesin pada ulir & permukaan duduk':(note==='new'?'🔒 Baut ALOC — wajib ganti baru setiap dilepas':'');
document.getElementById('trsVal-nm').textContent=this.fmt(nm);
document.getElementById('trsVal-kgf').textContent=this.fmt(nm/TORSI_NM_PER_KGF);
document.getElementById('trsVal-lbft').textContent=this.fmt(nm/TORSI_NM_PER_LBFT);
document.getElementById('trsVal-lbin').textContent=this.fmt(nm/TORSI_NM_PER_LBIN);
}
this.calcExt();
this.renderWrenchNote(nm);
},
renderWrenchNote(nm){
const el=document.getElementById('trsWrenchNote');
if(!el)return;
if(nm===null||nm===undefined||isNaN(nm)){el.innerHTML='';return;}
const lbft=nm/TORSI_NM_PER_LBFT;
const inRange=nm>=MY_WRENCH.minNm&&nm<=MY_WRENCH.maxNm;
const rangeColor=inRange?'var(--accent3)':'var(--accent2)';
const rangeIcon=inRange?'✅':'⚠️';
const rangeMsg=inRange?'Dalam jangkauan kunci kamu':(nm<MY_WRENCH.minNm?'Di bawah jangkauan minimum — kunci ini tidak akurat/tidak bisa disetel setipis ini':'Melebihi kapasitas maksimum kunci ini — jangan dipaksa, bisa merusak kunci/baut');
el.innerHTML=`<div class="u-r10 u-fs11 u-lh16" style="background:var(--surface3);border:1px solid var(--border2);padding:10px 12px">
      <div class="u-fw700 u-ctext u-mb2">🔧 Kunci kamu: ${MY_WRENCH.brand} ${MY_WRENCH.sku} (${MY_WRENCH.minNm}–${MY_WRENCH.maxNm} Nm / ${MY_WRENCH.minLbft}–${MY_WRENCH.maxLbft} lbf·ft, ${MY_WRENCH.panjang} mm)</div>
      <div style="color:${rangeColor};font-weight:700">${rangeIcon} ${rangeMsg}</div>
      <div class="u-t2 u-mt2">📏 Skala di batang kunci tercetak langsung dalam <b>N·m</b>, tiap kenaikan angka utama = 13,56 Nm. Target kamu: <b>${this.fmt(nm)} Nm</b> (≈ ${this.fmt(lbft)} lbf·ft).</div>
      ${inRange?this.scalePositionHtml(nm):''}
    </div>`;
},
scalePositionHtml(nm){
const marks=MY_WRENCH_SCALE;
const perTurn=marks[0].nm;
const perLine=perTurn/10;
let lowerIdx=0;
for(let i=0;i<marks.length;i++){ if(marks[i].nm<=nm+1e-9) lowerIdx=i; }
let lower=marks[lowerIdx];
let remainder=nm-lower.nm;
let linesRounded=Math.round(remainder/perLine);
const upperMark=marks[lowerIdx+1]||null;
if(linesRounded>=10 && upperMark){ lower=upperMark; linesRounded=0; }
const estimatedNm=lower.nm+linesRounded*perLine;
const overallFrac=(estimatedNm-MY_WRENCH.minNm)/(MY_WRENCH.maxNm-MY_WRENCH.minNm);
let posMsg;
if(linesRounded===0){
posMsg=`🎯 Sejajarkan garis paling atas gagang dengan angka <b>${this.fmt(lower.nm)}</b> di batang, angka <b>0</b> pada gagang tepat di garis vertikal batang. Tidak perlu maju garis sama sekali.`;
} else {
const prevLabel=Math.floor(linesRounded/2)*2;
const overShoot=linesRounded-prevLabel;
const nextLabel=prevLabel+2;
const stepDesc=overShoot===0?`tepat di angka <b>${prevLabel}</b>`:`melewati angka <b>${prevLabel}</b>, lalu berhenti <b>${overShoot} garis</b> setelahnya menuju angka <b>${nextLabel}</b>`;
posMsg=`🎯 Putar gagang sampai sejajar angka <b>${this.fmt(lower.nm)}</b> di batang (posisi gagang di 0). Lalu putar maju <b>${linesRounded} garis kecil</b> (${stepDesc}) di skala gagang.`;
}
return `<div class="u-mt8">
      <div class="u-t2 u-mb8">${posMsg}</div>
      <div class="u-t2 u-mb8">≈ Setelan kamu sekarang <b>${this.fmt(estimatedNm)} Nm</b> (target ${this.fmt(nm)} Nm, selisih ${this.fmt(Math.abs(estimatedNm-nm))} Nm — 1 garis = ${this.fmt(perLine)} Nm).</div>
      ${this.scaleSvgHtml(overallFrac)}
      ${this.thimbleSvgHtml(linesRounded+((remainder/perLine)-Math.round(remainder/perLine)))}
    </div>`;
},
thimbleSvgHtml(lineVal){
lineVal=Math.max(0,Math.min(9,lineVal));
const W=300,H=54,padL=20,padR=20,axisY=30;
const w=W-padL-padR;
let ticks='';
for(let i=0;i<=9;i++){
const x=padL+(i/9)*w;
const major=i%2===0;
ticks+=`<line x1="${x}" y1="${axisY-(major?9:5)}" x2="${x}" y2="${axisY}" stroke="var(--text3)" stroke-width="${major?1.4:1}"/>`;
if(major)ticks+=`<text x="${x}" y="${axisY-12}" font-size="9" font-family="'Space Grotesk',monospace" fill="var(--text2)" text-anchor="middle">${i}</text>`;
}
const px=padL+(lineVal/9)*w;
return `<svg class="u-w100 u-mt2" viewBox="0 0 ${W} ${H}" style="height:auto;display:block" xmlns="http://www.w3.org/2000/svg">
      <line x1="${padL}" y1="${axisY}" x2="${W-padR}" y2="${axisY}" stroke="var(--text3)" stroke-width="1"/>
      ${ticks}
      <polygon points="${px},${axisY+4} ${px-5},${axisY+13} ${px+5},${axisY+13}" fill="var(--accent)"/>
      <text x="${px}" y="${axisY+24}" font-size="9" font-family="'Space Grotesk',monospace" font-weight="700" fill="var(--accent)" text-anchor="middle">gagang</text>
    </svg>`;
},
scaleSvgHtml(frac){
frac=Math.max(0,Math.min(1,frac));
const W=300,H=98,padL=22,padR=22,railY=54,railH=16;
const railW=W-padL-padR;
const marks=MY_WRENCH_SCALE;
const collarCx=padL+frac*railW;
const collarW=34;
let ticks='';
marks.forEach((m,i)=>{
const x=padL+(i/(marks.length-1))*railW;
ticks+=`<line x1="${x}" y1="${railY-2}" x2="${x}" y2="${railY+railH+2}" stroke="var(--text3)" stroke-width="1"/>
        <text x="${x}" y="${railY-8}" font-size="9" font-family="'Space Grotesk',monospace" fill="var(--text2)" text-anchor="middle">${this.fmt(m.nm)}</text>`;
});
let hatch='';
for(let hx=-collarW/2+4;hx<collarW/2;hx+=5){
hatch+=`<line x1="${collarCx+hx}" y1="${railY-6}" x2="${collarCx+hx-6}" y2="${railY+railH+6}" stroke="rgba(0,0,0,0.35)" stroke-width="1.4"/>`;
}
return `<svg class="u-w100" viewBox="0 0 ${W} ${H}" style="height:auto;display:block" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="trsRail" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#d8d8de"/><stop offset="45%" stop-color="#8a8a92"/><stop offset="55%" stop-color="#8a8a92"/><stop offset="100%" stop-color="#c4c4cc"/>
        </linearGradient>
        <linearGradient id="trsCollar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#c9c9d2"/><stop offset="50%" stop-color="#e8e8ee"/><stop offset="100%" stop-color="#9d9da6"/>
        </linearGradient>
      </defs>
      <rect x="${padL}" y="${railY}" width="${railW}" height="${railH}" rx="3" fill="url(#trsRail)"/>
      ${ticks}
      <g>
        <rect x="${collarCx-collarW/2}" y="${railY-6}" width="${collarW}" height="${railH+12}" rx="4" fill="url(#trsCollar)" stroke="rgba(0,0,0,0.25)"/>
        <g style="clip-path:inset(0)">${hatch}</g>
        <line x1="${collarCx-collarW/2}" y1="${railY-10}" x2="${collarCx-collarW/2}" y2="${railY+railH+10}" stroke="var(--accent)" stroke-width="2.5"/>
      </g>
      <text x="${collarCx-collarW/2}" y="${railY+railH+24}" font-size="9.5" font-family="'Space Grotesk',monospace" font-weight="700" fill="var(--accent)" text-anchor="middle">▲ setel di sini</text>
    </svg>`;
},
toggleExt(){
this.extOpen=!this.extOpen;
document.getElementById('trsExtBody').classList.toggle('collapsed');
document.getElementById('trsExtChev').classList.toggle('collapsed');
},
currentTargetNm(){
if(this.mode==='manual'){
const v=parseFloat(document.getElementById('trsManualTorsiInput').value);
return isNaN(v)?null:v;
}
return this.selected?this.selected.nm:null;
},
calcExt(){
const L=parseFloat(document.getElementById('trsExtL').value);
const A=parseFloat(document.getElementById('trsExtA').value);
const target=this.currentTargetNm();
const resWrap=document.getElementById('trsExtResult');
if(!L||!A||target===null){resWrap.style.display='none';return;}
const setting=target*L/(L+A);
resWrap.style.display='block';
document.getElementById('trsExtResultVal').textContent=this.fmt(setting)+' N·m';
document.getElementById('trsExtResultNote').textContent=`Target sebenarnya di baut tetap ${this.fmt(target)} N·m. Karena kunci diperpanjang jadi ${L+A} mm (asli ${L} mm + ekstensi ${A} mm), kunci di-set ke ${this.fmt(setting)} N·m supaya torsi yang sampai ke baut pas ${this.fmt(target)} N·m.`;
},
setPageMode(m){
this.pageMode=m;
document.getElementById('trsTopModeNormal').classList.toggle('active',m==='normal');
document.getElementById('trsTopModeChecklist').classList.toggle('active',m==='checklist');
document.getElementById('trsSummaryBar').classList.toggle('show',m==='checklist');
this.renderList();
this.updateSummary();
this.persist();
},
toggleCheck(key){this.checked[key]=!this.checked[key];this.renderList();this.updateSummary();this.persist();},
updateBiaya(key,val){this.biaya[key]=parseFloat(val)||0;this.updateSummary();this.persist();},
updateSummary(){
let total=0,done=0,count=0;
this.cats.forEach(cat=>cat.items.forEach(it=>{
const key=this.itemKey(cat.cat,it.name);
count++;
if(this.checked[key]){done++;total+=(this.biaya[key]||0);}
}));
document.getElementById('trsSummaryProgress').textContent=done+'/'+count;
document.getElementById('trsSummaryProgressFill').style.width=count?Math.round(done/count*100)+'%':'0%';
document.getElementById('trsSummaryBiaya').textContent='Rp '+total.toLocaleString('id-ID');
},
catatServis(name){
closeModal('torsiModal');
setTimeout(()=>openServisModal(undefined,name),200);
},
goToStock(){
closeModal('torsiModal');
setTimeout(()=>{
const d=document.getElementById('cnStockDetails');
if(d){d.open=true;d.scrollIntoView({behavior:'smooth',block:'start'});}
},250);
},
noteBadge(note){
if(note==='oli')return '<span class="trs-part-badge oil">🛢️ Oleskan oli</span>';
if(note==='new')return '<span class="trs-part-badge new">🔒 Ganti baru</span>';
return '';
},
renderList(){
const q=document.getElementById('trsSearchInput').value.trim().toLowerCase();
let cats=this.cats;
if(this.activeCat!=='Semua')cats=this.cats.filter(d=>d.cat===this.activeCat);
let html='';let totalShown=0;
cats.forEach((cat,ci)=>{
const items=cat.items.filter(it=>!q||it.name.toLowerCase().includes(q));
if(items.length===0)return;
totalShown+=items.length;
html+=`<div class="card" style="padding:8px 12px">
        <div class="trs-part-cat-head" data-onclick="Torsi.toggleCatCard(this)">
          <div class="trs-part-cat-head-left">
            <div class="trs-part-cat-icon">${cat.icon}</div>
            <div><div class="trs-part-cat-title">${escapeHtml(cat.cat)}</div><div class="trs-part-cat-count">${items.length} item</div></div>
          </div>
          <span class="trs-part-cat-chev open">▾</span>
        </div>
        <div class="card-collapse-body" style="padding-bottom:6px">
          ${items.map(it=>this.renderRow(cat.cat,it)).join('')}
        </div>
      </div>`;
});
if(totalShown===0)html=`<div class="empty"><div class="empty-icon">🔍</div><div class="empty-text">Part tidak ditemukan. Coba kata kunci lain.</div></div>`;
document.getElementById('trsCatList').innerHTML=html;
},
toggleCatCard(headEl){
const body=headEl.parentElement.querySelector('.card-collapse-body');
const chev=headEl.querySelector('.trs-part-cat-chev');
body.classList.toggle('collapsed');
chev.classList.toggle('open');
},
renderRow(catName,it){
const key=this.itemKey(catName,it.name);
const checked=!!this.checked[key];
const biayaVal=this.biaya[key]||'';
const stockItem=this.findStock(it.name);
const torsiHtml=it.noTorque
?`<div class="trs-part-torsi"><div class="trs-part-torsi-nm u-fs11 u-ctext3">servis rutin</div></div>`
:`<div class="trs-part-torsi"><div class="trs-part-torsi-nm">${it.nm}</div><div class="trs-part-torsi-kgf">(${it.kgf} kgf·m)</div></div>`;
let extras='';
if(it.interval)extras+=`<div class="trs-tag-btn trs-tag-interval">🔁 ${escapeHtml(it.interval)}</div>`;
if(stockItem)extras+=`<div class="trs-tag-btn ${stockItem.qty>0?'stok-ok':'stok-low'}">📦 ${stockItem.qty>0?('Stok '+stockItem.qty+(stockItem.unit?' '+stockItem.unit:'')):'Stok habis'}</div>`;
extras+=`<div class="trs-tag-btn" data-onclick="event.stopPropagation();Torsi.catatServis('${it.name.replace(/'/g,"\\'")}')">🔧 Catat Servis</div>`;
const checkHtml=`<div class="trs-part-check ${this.pageMode==='checklist'?'show':''} ${checked?'checked':''}" data-onclick="event.stopPropagation();Torsi.toggleCheck('${key.replace(/'/g,"\\'")}')">${checked?'✓':''}</div>`;
let biayaHtml='';
if(it.consumable){
biayaHtml=`<div class="trs-biaya-wrap" data-onclick="event.stopPropagation()"><span>💰 Rp</span><input type="number" inputmode="numeric" placeholder="estimasi" value="${biayaVal}" oninput="Torsi.updateBiaya('${key.replace(/'/g,"\\'")}', this.value)"></div>`;
}
return `<div class="trs-part-row" data-onclick='${it.noTorque?'':"Torsi.selectPart("+JSON.stringify(catName)+","+JSON.stringify(it.name)+")"}'>
      ${checkHtml}
      <div class="trs-part-info">
        <div class="trs-part-name">${escapeHtml(it.name)}</div>
        <div class="trs-part-meta"><span>⌀ ${escapeHtml(it.ulir)}</span>${it.note?('· '+this.noteBadge(it.note)):''}</div>
      </div>
      ${torsiHtml}
      <div class="trs-part-extra-row">${extras}</div>
      ${biayaHtml}
    </div>`;
}
};
const CHAT_ACTION_LABELS={add_transaksi:'💸 Usul: Tambah Transaksi',add_tagihan:'🧾 Usul: Tambah Tagihan/Cicilan',add_servis:'🔧 Usul: Catat Servis Kendaraan',add_target:'🎯 Usul: Tambah Target Tabungan',add_catatan_anak:'👶 Usul: Catat soal Anak',add_wishlist:'📋 Usul: Tambah ke Prioritas Belanja'};
const CHAT_ACTION_HANDLERS={
add_transaksi(data){
const type=(data.type==='income')?'income':'expense';
const amount=Math.round(Number(data.amount));
if(!amount||amount<=0)throw new Error('Nominal tidak valid');
const accountId=(D.accounts.find(a=>data.accountName&&a.name&&a.name.toLowerCase().includes(String(data.accountName).toLowerCase()))||D.accounts[0])?.id;
D.transactions.push({id:uid(),type,amount,category:data.category||'Lainnya',subcategory:data.subcategory||'',accountId,payMethod:'tunai',note:data.note||'',date:(data.date&&!isNaN(new Date(data.date).getTime()))?data.date:new Date().toISOString().split('T')[0]});
save();refreshCurrentPage();
return `Transaksi ${type==='income'?'pemasukan':'pengeluaran'} ${fmtFull(amount)} (${data.category||'Lainnya'}) tersimpan`;
},
add_tagihan(data){
const amount=Math.round(Number(data.amount));
if(!amount||amount<=0)throw new Error('Nominal tidak valid');
if(!data.nextDue||isNaN(new Date(data.nextDue).getTime()))throw new Error('Tanggal jatuh tempo tidak valid, format harus YYYY-MM-DD');
D.bills.push({id:uid(),name:data.name||'Tagihan',amount,nextDue:data.nextDue,freq:data.freq||'bulanan',category:data.category||'Tagihan',subcategory:'',accountId:D.accounts[0]?.id||null,note:data.note||'',kind:data.kind||'tagihan'});
save();refreshCurrentPage();
return `Tagihan "${data.name||'Tagihan'}" ${fmtFull(amount)} (jatuh tempo ${data.nextDue}) tersimpan`;
},
add_servis(data){
const cost=Math.round(Number(data.cost));
if(!cost||cost<=0)throw new Error('Biaya tidak valid');
let veh=D.vehicles.find(v=>v.id===data.vehicleId);
if(!veh&&data.vehicleName)veh=D.vehicles.find(v=>v.name.toLowerCase().includes(String(data.vehicleName).toLowerCase()));
if(!veh&&D.vehicles.length===1)veh=D.vehicles[0];
if(!veh)throw new Error('Kendaraan tidak dikenali, sebutkan namanya lebih jelas ya');
const date=(data.date&&!isNaN(new Date(data.date).getTime()))?data.date:new Date().toISOString().split('T')[0];
const accId=D.accounts[0]?.id||'';
const txId=uid(),servisId=uid();
D.transactions.push({id:txId,type:'expense',amount:cost,category:resolveVehicleTxCategory(veh),subcategory:'Servis & Oli',accountId:accId,payMethod:'tunai',note:(data.item||'Servis')+' - '+veh.name,date,servisLinkId:servisId});
D.servisLogs.push({id:servisId,vehicleId:veh.id,date,item:data.item||'Servis',categoryId:null,km:data.km?Number(data.km):null,cost,note:data.note||'',accountId:accId,txLinkId:txId});
save();refreshCurrentPage();renderDashboardServisReminder();
return `Servis "${data.item||'Servis'}" untuk ${veh.name} ${fmtFull(cost)} tersimpan`;
},
add_target(data){
const amount=Math.round(Number(data.amount));
if(!amount||amount<=0)throw new Error('Target nominal tidak valid');
D.targets.push({id:uid(),name:data.name||'Target',amount,saved:Math.round(Number(data.saved||0)),emoji:data.emoji||'🎯'});
save();refreshCurrentPage();
return `Target tabungan "${data.name||'Target'}" ${fmtFull(amount)} tersimpan`;
},
add_wishlist(data){
const name=(data.name||'').trim();
if(!name)throw new Error('Nama barang tidak boleh kosong');
const price=Math.round(Number(data.price));
if(!price||price<=0)throw new Error('Harga barang tidak valid');
const cat=(data.cat==='kebutuhan')?'kebutuhan':'keinginan';
const urgensi=['mendesak','bisa_nunggu','nice_to_have'].includes(data.urgensi)?data.urgensi:'bisa_nunggu';
const hargaNormalRaw=Math.round(Number(data.hargaNormal||0));
const isDiskon=!!(hargaNormalRaw&&hargaNormalRaw>price);
const dup=(D.wishlist||[]).find(x=>!x.bought&&x.name.trim().toLowerCase()===name.toLowerCase());
D.wishlist.push({id:uid(),name,price,isDiskon,hargaNormal:isDiskon?hargaNormalRaw:0,cat,urgensi,sudahPunya:!!data.sudahPunya,sudahPunyaAlasan:data.sudahPunyaAlasan?String(data.sudahPunyaAlasan).trim():'',createdAt:new Date().toISOString(),bought:false});
save();refreshCurrentPage();
return `Barang "${name}" ${fmtFull(price)} ditambahkan ke Prioritas Belanja`+(dup?` (⚠️ ada barang dgn nama serupa yg sudah ada di list — cek biar gak dobel)`:'');
},
add_catatan_anak(data){
if(!data.text||!String(data.text).trim())throw new Error('Isi catatan kosong');
if(!D.catatan.anak)D.catatan.anak=[];
D.catatan.anak.push({id:uid(),date:(data.date&&!isNaN(new Date(data.date).getTime()))?data.date:new Date().toISOString().split('T')[0],text:String(data.text).trim()});
save();refreshCurrentPage();
return `Catatan anak tersimpan: "${String(data.text).trim()}"`;
}
};
const CHAT_ACTION_EDIT_FIELDS={
add_transaksi:[
{key:'type',label:'Jenis',type:'select',options:[['expense','Pengeluaran'],['income','Pemasukan']]},
{key:'amount',label:'Nominal (Rp)',type:'number'},
{key:'category',label:'Kategori',type:'text'},
{key:'note',label:'Catatan',type:'text'},
{key:'date',label:'Tanggal',type:'date'},
],
add_tagihan:[
{key:'name',label:'Nama Tagihan',type:'text'},
{key:'amount',label:'Nominal (Rp)',type:'number'},
{key:'nextDue',label:'Jatuh Tempo',type:'date'},
{key:'freq',label:'Frekuensi',type:'select',options:[['bulanan','Bulanan'],['tahunan','Tahunan'],['sekali','Sekali']]},
],
add_servis:[
{key:'vehicleName',label:'Kendaraan',type:'select',options:()=>D.vehicles.length?D.vehicles.map(v=>[v.name,v.name]):[['','Belum ada kendaraan']]},
{key:'item',label:'Item Servis',type:'text'},
{key:'cost',label:'Biaya (Rp)',type:'number'},
{key:'date',label:'Tanggal',type:'date'},
{key:'km',label:'KM (opsional)',type:'number'},
],
add_target:[
{key:'name',label:'Nama Target',type:'text'},
{key:'amount',label:'Target Nominal (Rp)',type:'number'},
{key:'saved',label:'Sudah Terkumpul (Rp)',type:'number'},
],
add_catatan_anak:[
{key:'text',label:'Catatan',type:'text'},
{key:'date',label:'Tanggal',type:'date'},
],
add_wishlist:[
{key:'name',label:'Nama Barang',type:'text'},
{key:'price',label:'Harga (Rp)',type:'number'},
{key:'cat',label:'Kategori',type:'select',options:[['kebutuhan','🛠️ Kebutuhan'],['keinginan','✨ Keinginan']]},
{key:'urgensi',label:'Urgensi',type:'select',options:[['mendesak','🔥 Mendesak'],['bisa_nunggu','⏳ Bisa Nunggu'],['nice_to_have','💭 Nice to Have']]},
],
};

// edukasi-dana.js — Dana Pendidikan (EduFund): kalkulator target biaya sekolah/kuliah & nabung/bulan
// CATATAN: modul EduFund dipindah ke file baru ini dari features-edukasi-pajak-utang-sewakios.js (v60). EduFund.checkAI() masih memanggil RefAI._parseJSON() lewat variabel global — aman krn runtime call, bukan saat file di-load (RefAI ada di pajak-pbb-zakat.js).
// PENTING: file ini HARUS dimuat sesuai urutan build.js (GROUP_A/GROUP_B) karena beberapa modul saling referensi. Urutan grup ini: pajak-pbb-zakat.js, features-budget-laporan-carnotes-pelanggan.js, edukasi-dana.js, sewakios.js, hidup-seimbang.js, linktx.js, renovasi.js, aset.js, worthit.js

const EduFund={
calc(f){
const now=new Date();
const n=Math.max(0,(parseInt(f.tahunTarget)||now.getFullYear())-now.getFullYear());
const inflasi=(parseFloat(f.inflasi)||0)/100;
const ret=(parseFloat(f.returnAsumsi)||0)/100;
const biayaHariIni=parseFloat(f.biayaHariIni)||0;
const fv=biayaHariIni*Math.pow(1+inflasi,n);
const acc=f.accountId?D.accounts.find(a=>a.id===f.accountId):null;
const terkumpul=acc?recalcAccBalance(acc.id):(parseFloat(f.terkumpul)||0);
const kekurangan=Math.max(0,fv-terkumpul);
const r=(1+ret)/(1+inflasi)-1;
let pmtBulanan;
if(n<=0){
pmtBulanan=kekurangan;
}else if(Math.abs(r)<0.0005){
pmtBulanan=kekurangan/(n*12);
}else{
const bulan=n*12;
const rBulanan=Math.pow(1+r,1/12)-1;
const anuitas=((Math.pow(1+rBulanan,bulan)-1)/rBulanan)*(1+rBulanan);
pmtBulanan=anuitas>0?kekurangan/anuitas:kekurangan/bulan;
}
return{n,fv:Math.round(fv),terkumpul:Math.round(terkumpul),kekurangan:Math.round(kekurangan),pmtBulanan:Math.round(Math.max(0,pmtBulanan)),returnRiil:r*100};
},
openModal(id){
EduFund.editId=id||null;
const f=id?D.eduFunds.find(x=>sameId(x.id,id)):null;
document.getElementById('eduFundModalTitle').textContent=f?'Edit Dana Pendidikan':'Tambah Dana Pendidikan';
document.getElementById('eduName').value=f?f.name:'';
document.getElementById('eduBiayaHariIni').value=f?f.biayaHariIni:'';
document.getElementById('eduTahunTarget').value=f?f.tahunTarget:(new Date().getFullYear()+5);
document.getElementById('eduInflasi').value=f?f.inflasi:12;
document.getElementById('eduReturn').value=f?f.returnAsumsi:8;
document.getElementById('eduTerkumpul').value=f&&!f.accountId?f.terkumpul:'';
const accSel=document.getElementById('eduAcc');
if(accSel){
accSel.innerHTML='<option value="">— Tidak terkait akun, isi manual —</option>'+D.accounts.map(a=>`<option value="${a.id}">${escapeHtml(a.emoji||'')} ${escapeHtml(a.name)}</option>`).join('');
accSel.value=f&&f.accountId?String(f.accountId):'';
}
EduFund.updatePreview();
openModal('eduFundModal');
},
updatePreview(){
const accSel=document.getElementById('eduAcc');
const savedWrap=document.getElementById('eduSavedWrap');
if(savedWrap)savedWrap.style.display=(accSel&&accSel.value)?'none':'';
const f={
biayaHariIni:document.getElementById('eduBiayaHariIni').value,
tahunTarget:document.getElementById('eduTahunTarget').value,
inflasi:document.getElementById('eduInflasi').value,
returnAsumsi:document.getElementById('eduReturn').value,
accountId:accSel?accSel.value||null:null,
terkumpul:document.getElementById('eduTerkumpul').value
};
const c=EduFund.calc(f);
const box=document.getElementById('eduFundPreview');
if(!box)return;
if(c.n<=0){
box.innerHTML=`⚠️ Tahun target sudah lewat/tahun ini — butuh <b>${fmtFull(c.kekurangan)}</b> sekarang juga.`;
return;
}
box.innerHTML=`Perkiraan biaya di ${document.getElementById('eduTahunTarget').value} (${c.n} th lagi): <b>${fmtFull(c.fv)}</b><br>Sudah terkumpul: ${fmtFull(c.terkumpul)} · Kekurangan: <b>${fmtFull(c.kekurangan)}</b><br>Return riil ${c.returnRiil.toFixed(1)}%/th → nabung ≈ <b class="green">${fmtFull(c.pmtBulanan)}/bulan</b>`;
},
save(){
const name=document.getElementById('eduName').value.trim();
if(!name){toast('⚠️ Nama anak/jenjang wajib diisi');return;}
const biayaHariIni=parsePzNum(document.getElementById('eduBiayaHariIni').value);
if(!biayaHariIni){toast('⚠️ Biaya hari ini wajib diisi');return;}
const tahunTarget=parseInt(document.getElementById('eduTahunTarget').value)||new Date().getFullYear();
const inflasi=parseFloat(document.getElementById('eduInflasi').value)||12;
const returnAsumsi=parseFloat(document.getElementById('eduReturn').value)||8;
const accSel=document.getElementById('eduAcc');
const accountId=accSel&&accSel.value?accSel.value:null;
const terkumpul=accountId?0:parsePzNum(document.getElementById('eduTerkumpul').value);
if(EduFund.editId){
const f=D.eduFunds.find(x=>sameId(x.id,EduFund.editId));
Object.assign(f,{name,biayaHariIni,tahunTarget,inflasi,returnAsumsi,accountId,terkumpul});
}else{
D.eduFunds.push({id:uid(),name,biayaHariIni,tahunTarget,inflasi,returnAsumsi,accountId,terkumpul});
}
save();
EduFund.render();
EduFund.renderDashMini();
closeModal('eduFundModal');
toast('✅ Dana Pendidikan tersimpan');
},
del(id){
D.eduFunds=D.eduFunds.filter(x=>!sameId(x.id,id));
save();
EduFund.render();
EduFund.renderDashMini();
toast('🗑️ Dana Pendidikan dihapus');
},
renderDashMini(){
const card=document.getElementById('dashEduFundMiniCard');
if(!card)return;
if(!D.eduFunds||!D.eduFunds.length){card.style.display='none';return;}
let totalFv=0,totalTerkumpul=0,totalPmt=0;
D.eduFunds.forEach(f=>{
const c=EduFund.calc(f);
totalFv+=c.fv;
totalTerkumpul+=c.terkumpul;
totalPmt+=c.pmtBulanan;
});
const pct=totalFv>0?Math.min(100,Math.round((totalTerkumpul/totalFv)*100)):0;
document.getElementById('dashEduFundTerkumpul').textContent=fmt(totalTerkumpul);
document.getElementById('dashEduFundTarget').textContent=fmt(totalFv);
document.getElementById('dashEduFundPct').textContent=pct+'%';
const bar=document.getElementById('dashEduFundBar');
bar.style.width=Math.min(pct,100)+'%';
bar.className='budget-bar-fill '+(pct>=100?'over':pct>=50?'ok':'warn');
document.getElementById('dashEduFundSub').textContent=`${D.eduFunds.length} rencana · Total nabung ≈ ${fmtFull(totalPmt)}/bulan`;
card.classList.remove('u-dnone');card.style.display='block';
},
render(){
const el=document.getElementById('eduFundList');
if(!el)return;
if(!D.eduFunds.length){el.innerHTML='<div class="empty"><div class="empty-icon">🎓</div><div class="empty-text">Belum ada rencana dana pendidikan</div></div>';return;}
el.innerHTML=D.eduFunds.map(f=>{
const c=EduFund.calc(f);
const pct=c.fv>0?Math.min(100,Math.round((c.terkumpul/c.fv)*100)):0;
const col=pct>=100?'green':pct>=50?'orange':'purple';
const acc=f.accountId?D.accounts.find(a=>sameId(a.id,f.accountId)):null;
const linkTag=acc?`<span class="u-fs11 u-r99 u-cacc u-ml4" style="background:var(--surface);border:1px solid var(--border2);padding:2px 7px">🔗 ${escapeHtml(acc.name)}</span>`:'';
return`<div class="tgt-item">
      <div class="tgt-head"><div class="tgt-name">🎓 ${escapeHtml(f.name)}${linkTag}</div><div class="tgt-pct">${pct}%</div></div>
      <div class="prog-bar"><div class="prog-fill ${col}" style="width:${pct}%"></div></div>
      <div class="tgt-vals"><span>${fmtFull(c.terkumpul)} terkumpul</span><span>Target ${fmtFull(c.fv)} (${f.tahunTarget})</span></div>
      <div class="u-fs11 u-t2 u-mt6" style="padding-top:6px;border-top:1px dashed var(--border)">Nabung ≈ <b>${fmtFull(c.pmtBulanan)}/bulan</b> (inflasi ${f.inflasi}%/th, return ${f.returnAsumsi}%/th)</div>
      <div class="tgt-actions">
        <button class="btn btn-sm btn-ghost u-flex1" data-action="EduFund.openModal" data-args="${escapeHtml(JSON.stringify([f.id]))}">✏️ Edit</button>
        <button class="btn btn-sm btn-danger" data-action="EduFund.del" data-args="${escapeHtml(JSON.stringify([f.id]))}" aria-label="Hapus">🗑</button>
      </div>
    </div>`;
}).join('');
},
async checkAI(){
const apiKey=D.profile.apiKey;
const provider=D.profile.apiProvider||'claude';
if(!apiKey){toast('⚠️ Belum ada API Key. Isi dulu di Pengaturan → AI Asisten.');return;}
const namaSekolah=await showPromptModal({title:'Cek Estimasi Biaya',message:'Nama sekolah/kampus & kota (makin spesifik makin akurat)',icon:'🔍',placeholder:'cth: SDIT Al Azhar Yogyakarta'});
if(!namaSekolah)return;
toast('🔍 Mencari estimasi biaya via AI, mohon tunggu...',8000);
const sysPrompt=`Kamu asisten riset utk aplikasi keuangan keluarga Indonesia. Cari estimasi TOTAL BIAYA MASUK (uang pangkal/pondok + biaya tahun pertama, dalam Rupiah) utk sekolah/kampus berikut lewat web search: "${namaSekolah}". Balas HANYA JSON valid (tanpa teks lain, tanpa markdown fence):
{"biayaEstimasi":{"value": <angka Rp, atau null kalau tidak ketemu>, "source":"<sumber & rincian singkat>", "tanggal":"<kapan info ini berlaku>"}}
Kalau tidak yakin/tidak ketemu, isi value null & jelaskan di source. JANGAN mengarang angka.`;
try{
const r=await callAIProviderRaw(sysPrompt,[{role:'user',content:'Cari & kasih estimasi biaya sesuai format JSON yang diminta.'}],{maxTokens:1024,webSearch:true});
if(!r.ok){
const label=provider==='gemini'?'Gemini':'Claude';
toast('❌ Gagal hubungi '+label+': '+(r.errMsg||'error tidak diketahui'));
return;
}
const textOut=r.text;
const parsed=RefAI._parseJSON(textOut);
const item=parsed&&parsed.biayaEstimasi;
if(!item||item.value===null||item.value===undefined||!isFinite(Number(item.value))||Number(item.value)<=0){
toast('⚠️ AI tidak menemukan angka yang cukup yakin'+(item&&item.source?': '+item.source:''));
return;
}
document.getElementById('eduBiayaHariIni').value=Math.round(Number(item.value));
EduFund.updatePreview();
toast(`✅ Estimasi terisi: ${fmtFull(Math.round(Number(item.value)))} — 📌 ${item.source||'sumber tidak disebutkan'}${item.tanggal?' · '+item.tanggal:''}. Cek ulang ke sumber resmi ya!`,8000);
}catch(e){
toast('❌ Gagal cek: '+(e.message||String(e)));
}
}
};

// sewakios.js — Domain Sewa Kios: catat unit kios yang disewakan, riwayat tagihan sewa, ROI vs modal renovasi, laporan PDF.
// Dipisah dari: features-edukasi-pajak-utang-sewakios.js (lanjutan roadmap PEMISAHAN-FILE-ROADMAP.md, v58).
// PENTING: SewaKios.onLinkedTxDeleted()/onLinkedTxEdited() dipanggil dari backup-restore.js & transaksi.js (GROUP_B) saat transaksi diedit/dihapus — lewat variabel global, aman krn dipanggil runtime (bukan saat file di-load), asal file ini tetap ikut dimuat (selalu, lewat build.js).
// PENTING: harus dimuat sesuai urutan build.js (GROUP_A) — tidak ada modul lain di GROUP_A yang direferensi SewaKios saat load, cuma D global & helper (fmt, fmtFull, sameId, dst) yang sudah tersedia di semua file.

const SewaKios={
editUnitId:null,
pendingUnitId:null,
openUnitModal(editId){
SewaKios.editUnitId=editId!==undefined?editId:null;
const u=SewaKios.editUnitId!=null?D.sewaKios.units.find(x=>sameId(x.id,SewaKios.editUnitId)):null;
document.getElementById('sewaKiosUnitModalTitle').textContent=u?'Edit Unit Kios':'Unit Kios Baru';
document.getElementById('skDelBtn').style.display=u?'flex':'none';
const projSel=document.getElementById('skRenovProject');
projSel.innerHTML='<option value="">— Tidak ditautkan —</option>'+D.renovProjects.map(p=>`<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');
const accSel=document.getElementById('skAccount');
accSel.innerHTML=D.accounts.map(a=>`<option value="${a.id}">${a.emoji} ${escapeHtml(a.name)}</option>`).join('');
document.getElementById('skName').value=u?u.name:'';
projSel.value=u&&u.renovProjectId!=null?String(u.renovProjectId):'';
document.getElementById('skStatus').value=u?u.status:'kosong';
document.getElementById('skPenyewa').value=u?(u.penyewa||''):'';
document.getElementById('skHarga').value=u?u.hargaSewaBulanan:'';
accSel.value=u&&u.accountId?u.accountId:(D.accounts[0]?.id||'');
document.getElementById('skCatatan').value=u?(u.catatan||''):'';
openModal('sewaKiosUnitModal');
},
saveUnit(){
const name=document.getElementById('skName').value.trim();
if(!name){toast('⚠️ Nama unit wajib diisi');return;}
const renovProjIdRaw=document.getElementById('skRenovProject').value;
const harga=parseFloat(document.getElementById('skHarga').value)||0;
const data={
name,
renovProjectId:renovProjIdRaw?renovProjIdRaw:null,
status:document.getElementById('skStatus').value,
penyewa:document.getElementById('skPenyewa').value.trim(),
hargaSewaBulanan:harga,
accountId:document.getElementById('skAccount').value||null,
catatan:document.getElementById('skCatatan').value.trim()
};
if(SewaKios.editUnitId!=null){
const u=D.sewaKios.units.find(x=>sameId(x.id,SewaKios.editUnitId));
if(u){
if(data.status!==u.status){
if(!u.statusLog||!u.statusLog.length)u.statusLog=[{status:u.status,tanggal:u.mulai||todayStr()}];
u.statusLog.push({status:data.status,tanggal:todayStr()});
}
Object.assign(u,data);
}
} else {
D.sewaKios.units.push({id:uid(),...data,mulai:todayStr(),riwayat:[],statusLog:[{status:data.status,tanggal:todayStr()}]});
}
save();closeModal('sewaKiosUnitModal');SewaKios.render();renderDashboardSewaKiosReminder();
toast('✅ Unit "'+name+'" disimpan');
},
async deleteUnitFromModal(){
if(SewaKios.editUnitId==null)return;
if(!await askConfirm('Hapus unit ini? Riwayat sewa yang sudah tercatat sbg transaksi TIDAK ikut terhapus, tapi link-nya ke unit ini akan hilang.'))return;
D.sewaKios.units=D.sewaKios.units.filter(x=>!sameId(x.id,SewaKios.editUnitId));
save();closeModal('sewaKiosUnitModal');SewaKios.render();renderDashboardSewaKiosReminder();
toast('🗑 Unit dihapus');
},
roi(u){
const modal=u.renovProjectId?(()=>{const p=D.renovProjects.find(x=>sameId(x.id,u.renovProjectId));return p?Renov.totals(p).total:0;})():0;
const diterima=(u.riwayat||[]).reduce((s,r)=>s+(r.jumlah||0),0);
const paybackBulan=(modal>0&&u.hargaSewaBulanan>0)?Math.ceil(modal/u.hargaSewaBulanan):null;
return{modal,diterima,sisa:Math.max(0,modal-diterima),paybackBulan,pctBalik:modal>0?Math.min(100,Math.round((diterima/modal)*100)):null};
},
nextTagih(u){
if(!u||u.status!=='disewa'||!u.hargaSewaBulanan)return null;
const riwayat=u.riwayat||[];
const baseStr=riwayat.length?riwayat.reduce((max,r)=>(r.tanggal>max?r.tanggal:max),riwayat[0].tanggal):(u.mulai||todayStr());
const due=new Date(baseStr);
if(isNaN(due.getTime()))return null;
due.setMonth(due.getMonth()+1);
due.setHours(0,0,0,0);
const today=new Date();today.setHours(0,0,0,0);
const diffDays=Math.round((due-today)/(1000*60*60*24));
return{due,diffDays};
},
occupancy(u){
const log=(u.statusLog&&u.statusLog.length)?[...u.statusLog]:[{status:u.status,tanggal:u.mulai||todayStr()}];
log.sort((a,b)=>a.tanggal<b.tanggal?-1:(a.tanggal>b.tanggal?1:0));
const today=new Date();today.setHours(0,0,0,0);
let totalDays=0,disewaDays=0;
for(let i=0;i<log.length;i++){
const start=new Date(log[i].tanggal);start.setHours(0,0,0,0);
let end;
if(i+1<log.length){end=new Date(log[i+1].tanggal);end.setHours(0,0,0,0);}else{end=today;}
const days=Math.max(0,Math.round((end-start)/(1000*60*60*24)));
totalDays+=days;
if(log[i].status==='disewa')disewaDays+=days;
}
return{totalDays,disewaDays,pct:totalDays>0?Math.round((disewaDays/totalDays)*100):null,log};
},
render(){
const el=document.getElementById('sewaKiosList');
if(!el)return;
if(!D.sewaKios.units.length){
el.innerHTML='<div class="empty"><div class="empty-icon">🏠</div><div class="empty-text">Belum ada unit kios</div></div>';
return;
}
el.innerHTML=D.sewaKios.units.map(u=>{
const r=SewaKios.roi(u);
const statusBadge=u.status==='disewa'?`<span style="background:var(--income-soft);color:var(--income)">✅ Disewa${u.penyewa?' — '+escapeHtml(u.penyewa):''}</span>`:`<span style="background:var(--expense-soft);color:var(--expense)">⬜ Kosong</span>`;
const roiLine=r.modal>0
?`Modal renov ${fmt(r.modal)} · diterima ${fmt(r.diterima)} (${r.pctBalik}%)${r.paybackBulan?' · balik modal ±'+r.paybackBulan+' bln':''}`
:`Diterima ${fmt(r.diterima)} (tidak ditautkan ke Proyek Renovasi)`;
const nt=SewaKios.nextTagih(u);
let tagihLine='';
if(nt){
const dueLabel=nt.due.toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'});
if(nt.diffDays<0)tagihLine=`<div class="u-fs11 u-fw700 u-mt4" style="color:var(--expense)">⚠️ Sudah lewat ${Math.abs(nt.diffDays)} hari dari jatuh tempo tagih (${dueLabel})</div>`;
else if(nt.diffDays<=5)tagihLine=`<div class="u-fs11 u-cacc4 u-fw700 u-mt4">🔔 Jatuh tempo tagih ${nt.diffDays===0?'hari ini':'dalam '+nt.diffDays+' hari'} (${dueLabel})</div>`;
else tagihLine=`<div class="u-fs11 u-t2 u-mt4">Tagih berikutnya: ${dueLabel}</div>`;
}
const occ=SewaKios.occupancy(u);
let occLine='';
if(occ.pct!=null&&occ.totalDays>=1){
const occCol=occ.pct>=80?'var(--income)':occ.pct>=50?'var(--accent4)':'var(--expense)';
const histRows=[...occ.log].reverse().map(l=>{
const d=new Date(l.tanggal);
const label=isNaN(d.getTime())?l.tanggal:d.toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'});
return `<div class="u-flex u-jcb u-fs11 u-t2" style="padding:3px 0">
            <span>${l.status==='disewa'?'✅ Mulai disewa':'⬜ Jadi kosong'}</span><span>${label}</span>
          </div>`;
}).join('');
occLine=`<details class="u-mt6">
          <summary style="font-size:11px;color:${occCol};font-weight:700;cursor:pointer;list-style:none">📊 Occupancy rate: ${occ.pct}% (dari ${occ.totalDays} hari tercatat)</summary>
          <div class="u-mt4" style="padding-top:2px;border-top:1px solid var(--border)">${histRows}</div>
        </details>`;
}
return `<div class="card u-mb8" style="padding:12px">
        <div class="u-flex u-jcb u-aifs u-gap8">
          <div><div class="u-fw700">${escapeHtml(u.name)}</div>
          <div class="u-fs11 u-mt2"><span class="u-r12 u-fw700" style="padding:2px 8px">${statusBadge}</span></div></div>
          <div class="u-flex u-gap6">
            <button class="card-setting-btn" data-action="SewaKios.openUnitModal" data-args="${escapeHtml(JSON.stringify([u.id]))}" aria-label="Edit">✏️</button>
          </div>
        </div>
        <div class="u-fs12 u-t2 u-mt8">Sewa: ${fmt(u.hargaSewaBulanan)}/bulan</div>
        <div class="u-fs11 u-t2 u-mt2">${roiLine}</div>
        ${tagihLine}
        ${occLine}
        <button class="btn btn-income btn-full btn-sm u-mt8" data-action="SewaKios.catatSewa" data-args="${escapeHtml(JSON.stringify([u.id]))}">💰 Catat Sewa Diterima</button>
      </div>`;
}).join('');
},
catatSewa(unitId){
const u=D.sewaKios.units.find(x=>sameId(x.id,unitId));
if(!u)return;
openTxModal('income');
SewaKios.pendingUnitId=unitId;
document.getElementById('txNote').value='Sewa '+u.name+(u.penyewa?' — '+u.penyewa:'');
document.getElementById('txAmt').value=String(u.hargaSewaBulanan||'');
const catField=document.getElementById('txCat');
if(catField)selectTxCat('Bisnis');
if(u.accountId){
const accField=document.getElementById('txAcc');
if(accField)accField.value=u.accountId;
}
},
applyPaymentLink(txId){
if(!SewaKios.pendingUnitId)return;
const u=D.sewaKios.units.find(x=>sameId(x.id,SewaKios.pendingUnitId));
const t=D.transactions.find(x=>x.id===txId);
if(u&&t){
if(!u.riwayat)u.riwayat=[];
u.riwayat.push({id:uid(),tanggal:t.date,jumlah:t.amount,txId});
t.sewaKiosLinkId=u.id;
}
SewaKios.pendingUnitId=null;
renderDashboardSewaKiosReminder();
},
onLinkedTxEdited(t){
const u=D.sewaKios.units.find(x=>x.id===t.sewaKiosLinkId);
if(!u||!u.riwayat)return;
const r=u.riwayat.find(x=>x.txId===t.id);
if(r){r.jumlah=t.amount;r.tanggal=t.date;}
SewaKios.render();renderDashboardSewaKiosReminder();
},
onLinkedTxDeleted(t){
const u=D.sewaKios.units.find(x=>x.id===t.sewaKiosLinkId);
if(!u||!u.riwayat)return;
u.riwayat=u.riwayat.filter(r=>r.txId!==t.id);
SewaKios.render();renderDashboardSewaKiosReminder();
},
exportPDF(){
if(typeof window.jspdf==='undefined'){toast('⚠️ Modul PDF masih dimuat, coba lagi 2 detik');return;}
const units=(D.sewaKios&&D.sewaKios.units)||[];
if(!units.length){toast('⚠️ Belum ada unit kios untuk dilaporkan');return;}
const {jsPDF}=window.jspdf;
const doc=new jsPDF({unit:'pt',format:'a4'});
const pageW=doc.internal.pageSize.getWidth();
let y=50;
doc.setFont('helvetica','bold');doc.setFontSize(18);doc.setTextColor(40,40,60);
doc.text('Laporan Sewa Kios - Keluarga '+(D.profile.nama||'W'),40,y);y+=20;
doc.setFont('helvetica','normal');doc.setFontSize(10);doc.setTextColor(110,110,130);
doc.text('Dicetak: '+new Date().toLocaleString('id-ID'),40,y);y+=10;
doc.text('Jumlah unit: '+units.length,40,y);y+=18;
doc.setDrawColor(220,220,230);doc.line(40,y,pageW-40,y);y+=22;
const totalDiterima=units.reduce((s,u)=>s+SewaKios.roi(u).diterima,0);
const totalModal=units.reduce((s,u)=>s+SewaKios.roi(u).modal,0);
doc.setFont('helvetica','bold');doc.setFontSize(12);doc.setTextColor(30,30,40);
doc.text('Ringkasan',40,y);y+=18;
doc.setFont('helvetica','normal');doc.setFontSize(11);
doc.setTextColor(20,140,90);doc.text('Total diterima: '+fmtFull(totalDiterima),40,y);
doc.setTextColor(80,70,200);doc.text('Total modal renov ditautkan: '+fmtFull(totalModal),pageW/2,y);y+=28;
units.forEach((u,idx)=>{
const r=SewaKios.roi(u);
const occ=SewaKios.occupancy(u);
const nt=SewaKios.nextTagih(u);
if(y>680){doc.addPage();y=50;}
doc.setFont('helvetica','bold');doc.setFontSize(13);doc.setTextColor(30,30,40);
doc.text((idx+1)+'. '+u.name,40,y);y+=16;
doc.setFont('helvetica','normal');doc.setFontSize(9.5);doc.setTextColor(60,60,70);
doc.text('Status: '+(u.status==='disewa'?('Disewa'+(u.penyewa?' — '+u.penyewa:'')):'Kosong'),40,y);y+=13;
doc.text('Sewa per bulan: '+fmtFull(u.hargaSewaBulanan||0),40,y);y+=13;
doc.text(r.modal>0
?('Modal renov: '+fmtFull(r.modal)+' · Diterima: '+fmtFull(r.diterima)+' ('+r.pctBalik+'%)'+(r.paybackBulan?' · Balik modal ±'+r.paybackBulan+' bln':''))
:('Diterima: '+fmtFull(r.diterima)+' (tidak ditautkan ke Proyek Renovasi)'),40,y);y+=13;
if(occ.pct!=null&&occ.totalDays>=1){doc.text('Occupancy rate: '+occ.pct+'% (dari '+occ.totalDays+' hari tercatat)',40,y);y+=13;}
if(nt){
const dueLabel=nt.due.toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'});
doc.text(nt.diffDays<0?('Jatuh tempo tagih terlewat '+Math.abs(nt.diffDays)+' hari ('+dueLabel+')'):('Tagih berikutnya: '+dueLabel),40,y);y+=13;
}
const riwayat=(u.riwayat||[]).slice().sort((a,b)=>a.tanggal<b.tanggal?1:-1);
if(riwayat.length){
y+=4;
doc.setFont('helvetica','bold');doc.setFontSize(9.5);doc.text('Riwayat pembayaran:',40,y);y+=12;
doc.setFont('helvetica','normal');
riwayat.forEach(rw=>{
if(y>770){doc.addPage();y=50;}
doc.text(rw.tanggal+'  —  '+fmtFull(rw.jumlah),50,y);y+=12;
});
}
y+=16;
});
doc.save('laporan-sewakios-'+new Date().toISOString().split('T')[0]+'.pdf');
toast('✅ Laporan Sewa Kios (PDF) berhasil dibuat');
}
};

// hidup-seimbang.js — Domain Skor Hidup Seimbang: skor gabungan dari Dana Darurat, DSR cicilan, No-Spend 30 hari, & keseimbangan kerja-istirahat, plus riwayat snapshot bulanan.
// Dipisah dari: features-edukasi-pajak-utang-sewakios.js (lanjutan roadmap PEMISAHAN-FILE-ROADMAP.md, v59).
// PENTING: LifeBalance.compute() memanggil WorthIt.incomeAvg() (di worthit.js, guarded typeof check) & computeNoSpendLast30() (di features-sheets-pwa-selftest.js, GROUP_B, TIDAK di-guard typeof — ini kondisi lama yang sudah ada sebelum dipindah, aman krn dipanggil runtime setelah kedua bundle GROUP_A & GROUP_B ter-load, bukan saat load file).
// PENTING: harus dimuat sesuai urutan build.js (GROUP_A) — LifeBalance.render()/.compute() dipanggil dari modules-render.js & modules-calc.js (GROUP_A juga) lewat variabel global saat runtime (render dashboard), aman di file manapun dalam GROUP_A.

const LifeBalance={
compute(){
const parts=[];
const dd=(D.targets||[]).find(t=>t.isDanaDarurat);
let ddPts,ddNote;
if(!dd||!dd.amount){
ddPts=0; ddNote='Belum ada Target Dana Darurat';
} else {
const pct=Math.min(100,(dd.saved/dd.amount)*100);
ddPts=Math.round((pct/100)*25);
ddNote=Math.round(pct)+'% dari target';
}
parts.push({label:'🚨 Dana Darurat',pts:ddPts,max:25,note:ddNote});
const incAvg=(typeof WorthIt!=='undefined')?WorthIt.incomeAvg():0;
const cicilanAktifBulanan=(D.bills||[]).filter(b=>b.kind==='cicilan'&&b.sisaTenor!=null).reduce((s,b)=>s+b.amount,0);
let dsrPts,dsrNote;
if(incAvg<=0){
dsrPts=13; dsrNote='Data income belum cukup';
} else {
const dsr=(cicilanAktifBulanan/incAvg)*100;
dsrPts=Math.round(Math.max(0,Math.min(25,25*(1-dsr/35))));
dsrNote=dsr.toFixed(0)+'% dari rata-rata income';
}
parts.push({label:'💳 Rasio Cicilan (DSR)',pts:dsrPts,max:25,note:dsrNote,thin:incAvg<=0});
const nsd=computeNoSpendLast30();
let nsdPts,nsdNote;
if(nsd.daysWithData<7){
nsdPts=13; nsdNote='Histori transaksi belum cukup (<7 hari)';
} else {
nsdPts=Math.round((nsd.count/nsd.total)*25);
nsdNote=nsd.count+'/'+nsd.total+' hari (30 hr terakhir)';
}
parts.push({label:'🚫 No Spend Day',pts:nsdPts,max:25,note:nsdNote,thin:nsd.daysWithData<7});
const now=new Date();
let workPts,workNote;
if(!(D.workDays&&D.workDays.length)){
workPts=13; workNote='Belum ada catatan Absensi';
} else {
let restDays=0;
for(let i=0;i<7;i++){
const d=new Date(now); d.setDate(d.getDate()-i);
const iso=dateToISO(d);
const worked=(D.workDays||[]).some(w=>w.date===iso);
if(!worked)restDays++;
}
workPts=Math.round(Math.min(25,(restDays/2)*25));
workNote=restDays+' hari istirahat (7 hr terakhir)';
}
parts.push({label:'⏰ Kerja vs Istirahat',pts:workPts,max:25,note:workNote,thin:!(D.workDays&&D.workDays.length)});
const total=parts.reduce((s,p)=>s+p.pts,0);
let level,color;
if(total>=80){level='🟢 Seimbang';color='var(--accent3)';}
else if(total>=60){level='🟡 Cukup Baik';color='var(--accent4)';}
else if(total>=40){level='🟠 Perlu Perhatian';color='var(--accent2)';}
else {level='🔴 Waspada';color='var(--accent2)';}
return {total,level,color,parts};
},
render(){
const scoreEl=document.getElementById('lbScoreNum');
if(!scoreEl)return;
const {total,level,color,parts}=LifeBalance.compute();
scoreEl.textContent=total;
document.getElementById('lbLevel').textContent=level+' · '+total+'/100';
document.getElementById('lbLevel').style.color=color;
const ring=document.getElementById('lbRing');
const circumference=169.6;
ring.style.stroke=color;
ring.style.strokeDashoffset=Math.round(circumference*(1-total/100));
document.getElementById('lbBars').innerHTML=parts.map(p=>{
const pct=Math.round((p.pts/p.max)*100);
const barColor=pct>=80?'var(--accent3)':pct>=50?'var(--accent4)':'var(--accent2)';
// lint-ok-no-escape: p.label & p.note di sini selalu string tetap dari LifeBalance.compute() (mis. ddNote/dsrNote/nsdNote/workNote) yang ditulis di kode, bukan teks ketikan user
return `<div>
        <div class="u-flex u-jcb u-fs11" style="margin-bottom:3px"><span>${p.label}</span><span class="u-t2">${p.note}</span></div>
        <div class="budget-bar-track" style="height:6px"><div class="budget-bar-fill" style="width:${pct}%;background:${barColor}"></div></div>
      </div>`;
}).join('');
const noteEl=document.getElementById('lbDataNote');
if(noteEl){
const thinParts=parts.filter(p=>p.thin);
if(thinParts.length){
noteEl.classList.remove('u-dnone');noteEl.style.display='block';
noteEl.innerHTML='ℹ️ '+thinParts.map(p=>p.label).join(' & ')+' pakai nilai netral (bukan hasil hitung riil) krn datanya belum cukup — skor total di atas belum sepenuhnya mencerminkan kondisimu.';
} else {
noteEl.style.display='none';
}
}
LifeBalance.renderFocus(parts);
LifeBalance.renderTrendBadge();
},
tips:{
'🚨 Dana Darurat':'Coba tambah setoran ke Target Dana Darurat bulan ini, meski nominal kecil.',
'💳 Rasio Cicilan (DSR)':'Kurangi cicilan baru dulu, atau percepat pelunasan cicilan yang sudah berjalan.',
'🚫 No Spend Day':'Coba jadwalkan 1-2 hari "tanpa belanja" tiap minggu ke depan.',
'⏰ Kerja vs Istirahat':'Jadwalkan hari libur/istirahat — jangan kerja terus tanpa jeda.'
},
getFocusAreas(parts){
return parts.map(p=>({...p,pct:Math.round((p.pts/p.max)*100)}))
.filter(p=>p.pct<70)
.sort((a,b)=>a.pct-b.pct)
.slice(0,2);
},
renderFocus(parts){
const el=document.getElementById('lbFocus');
if(!el)return;
const areas=LifeBalance.getFocusAreas(parts);
if(!areas.length){
el.innerHTML='<div class="u-fs11 u-cacc3 u-r8" style="padding:8px 10px;background:var(--accent3-soft)">🎉 Semua komponen sudah cukup baik (≥70%). Pertahankan!</div>';
return;
}
el.innerHTML='<div class="u-fs11 u-fw700 u-t2" style="margin-bottom:5px">🔍 Fokus Perbaikan (paling narik turun skor)</div>'+
areas.map(p=>`<div class="u-fs11 u-r8 u-lh14" style="padding:7px 9px;background:var(--surface2);margin-bottom:5px"><b>${p.label}</b> <span class="u-cacc2">(${p.pct}%)</span> — ${LifeBalance.tips[p.label]||'Perbaiki komponen ini utk naikkan skor.'}</div>`).join('');
},
saveSnapshot(manual){
const today=todayStr();
const {total:score,parts}=LifeBalance.compute();
const partsSnap=parts.map(p=>({label:p.label,pts:p.pts,max:p.max}));
if(!D.lifeBalanceSnapshots)D.lifeBalanceSnapshots=[];
const existing=D.lifeBalanceSnapshots.find(s=>s.date===today);
if(existing){
existing.score=score;
existing.parts=partsSnap;
if(manual)existing.auto=false;
} else {
D.lifeBalanceSnapshots.push({id:uid(),date:today,score,parts:partsSnap,auto:!manual});
}
D.lifeBalanceSnapshots.sort((a,b)=>a.date.localeCompare(b.date));
save();
LifeBalance.renderHistoryModal();
LifeBalance.renderTrendBadge();
if(manual)toast('✅ Snapshot Skor Hidup Seimbang tersimpan: '+score+'/100');
},
autoSnapshotIfNeeded(){
if(!D.lifeBalanceSnapshots)D.lifeBalanceSnapshots=[];
if(!D.accounts.length&&!(D.targets||[]).length&&!D.transactions.length)return;
const ym=todayStr().slice(0,7);
if(D.lifeBalanceSnapshots.some(s=>s.date.slice(0,7)===ym))return;
LifeBalance.saveSnapshot(false);
},
async deleteSnapshot(id){
if(!await askConfirm('Hapus snapshot Skor Hidup Seimbang ini?',{okText:'Ya, Hapus'}))return;
D.lifeBalanceSnapshots=(D.lifeBalanceSnapshots||[]).filter(s=>!sameId(s.id,id));
save();
LifeBalance.renderHistoryModal();
LifeBalance.renderTrendBadge();
},
renderTrendBadge(){
const el=document.getElementById('lbTrendBadge');
if(!el)return;
const list=(D.lifeBalanceSnapshots||[]).slice().sort((a,b)=>a.date.localeCompare(b.date));
if(list.length<2){el.style.display='none';return;}
const last=list[list.length-1],prev=list[list.length-2];
const delta=last.score-prev.score;
el.classList.remove('u-dnone');el.style.display='inline';
el.textContent=(delta>=0?'▲ +':'▼ ')+delta+' vs bulan lalu';
el.style.color=delta>=0?'var(--accent3)':'var(--accent2)';
},
openHistoryModal(){
LifeBalance.renderHistoryModal();
openModal('lbHistoryModal');
},
renderHistoryModal(){
const listEl=document.getElementById('lbHistoryList');
const chartEl=document.getElementById('lbHistoryChart');
if(!listEl)return;
const list=(D.lifeBalanceSnapshots||[]).slice().sort((a,b)=>b.date.localeCompare(a.date));
if(!list.length){
listEl.innerHTML='<div class="empty"><div class="empty-icon">📈</div><div class="empty-text">Belum ada snapshot skor tercatat</div></div>';
if(chartEl)chartEl.innerHTML='';
return;
}
if(chartEl){
const asc=list.slice().sort((a,b)=>a.date.localeCompare(b.date)).slice(-12);
const W=280,H=70,pad=6;
const pts=asc.map((s,i)=>{
const x=asc.length>1?pad+(i/(asc.length-1))*(W-2*pad):W/2;
const y=H-pad-((s.score/100)*(H-2*pad));
return x+','+y;
});
const dots=asc.map((s,i)=>{
const [x,y]=pts[i].split(',');
return `<circle cx="${x}" cy="${y}" r="2.5" fill="var(--accent3)"><title>${s.date}: ${s.score}</title></circle>`;
}).join('');
chartEl.innerHTML=`<svg class="u-w100" viewBox="0 0 ${W} ${H}" style="height:70px;display:block">
        <polyline points="${pts.join(' ')}" fill="none" stroke="var(--accent3)" stroke-width="2"/>
        ${dots}
      </svg>`;
}
const WBAL_SHOW_LIMIT=24;
const visible=list.slice(0,WBAL_SHOW_LIMIT);
listEl.innerHTML=visible.map((s,i)=>{
const prev=list[i+1];
let deltaHtml='';
if(prev){
const delta=s.score-prev.score;
deltaHtml=`<div class="tx-meta">${delta>=0?'▲':'▼'} ${Math.abs(delta)} poin vs snapshot sebelumnya</div>`;
if(s.parts&&prev.parts){
const moves=s.parts.map(p=>{
const pr=prev.parts.find(x=>x.label===p.label);
return pr?{label:p.label,diff:p.pts-pr.pts}:null;
}).filter(Boolean);
if(moves.length){
const biggest=moves.reduce((a,b)=>Math.abs(b.diff)>Math.abs(a.diff)?b:a);
if(biggest.diff!==0){
deltaHtml+=`<div class="tx-meta" style="color:${biggest.diff<0?'var(--accent2)':'var(--accent3)'}">${biggest.diff<0?'⬇️':'⬆️'} Paling berubah: ${biggest.label} (${biggest.diff>0?'+':''}${biggest.diff})</div>`;
}
}
}
}
return `<div class="tx-item"><div class="tx-icon u-bgaccsoft">📈</div><div class="tx-info"><div class="tx-name">${s.date}${s.auto?' <span class="u-fs10 u-t2 u-r6 u-ml4" style="border:1px solid var(--border2);padding:1px 5px">Otomatis</span>':''}</div>${deltaHtml}</div><div class="tx-amount">${s.score}/100</div><button class="tx-del" data-action="LifeBalance.deleteSnapshot" data-args="${escapeHtml(JSON.stringify([s.id]))}" aria-label="Hapus">🗑</button></div>`;
}).join('');
}
};

// linktx.js — Transaksi tertaut (LinkTx): hubungkan transaksi lama di Keuangan ke Renov/Wishlist/Bill
// CATATAN: modul LinkTx dipindah ke file baru ini dari features-edukasi-pajak-utang-sewakios.js (v61).
// File lama (features-edukasi-pajak-utang-sewakios.js) DIHAPUS setelah ini karena tidak ada isi tersisa.
// LinkTx dipakai sbg utility umum "hubungkan transaksi lama" dari 3 domain beda (bukan "milik" 1 domain
// tunggal): Renov (renovasi.js) & WorthIt (worthit.js) dan Bill (piutang-utang.js).
// Semua pemanggilan LinkTx.xxx() dari file lain lewat variabel global saat runtime (klik tombol modal),
// bukan referensi lokal ke file — jadi aman dipindah ke file sendiri.
// PENTING: file ini HARUS dimuat sesuai urutan build.js (GROUP_A/GROUP_B) karena beberapa modul saling referensi. Urutan grup ini: pajak-pbb-zakat.js, features-budget-laporan-carnotes-pelanggan.js, edukasi-dana.js, sewakios.js, hidup-seimbang.js, linktx.js, renovasi.js, aset.js, worthit.js

const LinkTx={
ctx:null,
targetId:null,
selected:new Set(),
lastBatch:null,
_cfg(){
if(LinkTx.ctx==='renov'){
const p=D.renovProjects.find(x=>sameId(x.id,LinkTx.targetId));
return{
desc:'Pilih transaksi pengeluaran yang sudah tercatat di Keuangan (misal dibuat sebelum fitur Renov ini ada). Tiap transaksi otomatis jadi 1 item renovasi (langsung lunas) di proyek "'+escapeHtml(p?p.name:'-')+'" — <b>TIDAK</b> ada transaksi baru dibuat, jadi tidak dobel.',
confirmLabel:'🔗 Hubungkan Terpilih jadi Item Renovasi',
confirmNote:'Setiap transaksi akan otomatis jadi 1 item renovasi (langsung berstatus lunas).'
};
}
if(LinkTx.ctx==='wishlist'){
return{
desc:'Pilih transaksi pengeluaran yang sudah tercatat di Keuangan (misal barang yg sudah dibeli sebelum dicatat di Prioritas Belanja). Tiap transaksi otomatis jadi 1 barang berstatus "✅ Sudah Beli" — <b>TIDAK</b> ada transaksi baru dibuat.',
confirmLabel:'🔗 Hubungkan Terpilih jadi "Sudah Beli"',
confirmNote:'Setiap transaksi akan otomatis jadi 1 barang berstatus "Sudah Beli" di Prioritas Belanja.'
};
}
if(LinkTx.ctx==='bill'){
const b=D.bills.find(x=>sameId(x.id,LinkTx.targetId))||(D.billsArchive||[]).find(x=>sameId(x.id,LinkTx.targetId));
return{
desc:'Pilih transaksi pengeluaran yang sudah tercatat di Keuangan (misal dibayar manual sebelum tagihan "'+escapeHtml(b?b.name:'-')+'" ini dibuat). Transaksi akan ditandai sbg riwayat pembayaran tagihan ini — <b>TIDAK</b> ada transaksi baru dibuat.',
confirmLabel:'🔗 Hubungkan jadi Riwayat Pembayaran',
confirmNote:'Setiap transaksi akan otomatis masuk sbg riwayat pembayaran tagihan ini.'
};
}
return{desc:'',confirmLabel:'🔗 Hubungkan Terpilih',confirmNote:''};
},
open(ctx,targetId){
LinkTx.ctx=ctx;LinkTx.targetId=targetId;LinkTx.selected=new Set();
document.getElementById('linkTxSuccessBox').style.display='none';
document.getElementById('linkTxFilterBox').style.display='block';
const search=document.getElementById('linkTxSearch');if(search)search.value='';
const dari=document.getElementById('linkTxDari');if(dari)dari.value='';
const sampai=document.getElementById('linkTxSampai');if(sampai)sampai.value='';
const descEl=document.getElementById('linkTxModalDesc');
if(descEl)descEl.innerHTML=LinkTx._cfg().desc;
const kat=document.getElementById('linkTxKat');
if(kat){
kat.innerHTML='<option value="semua">Semua</option>'+getCatsByType('expense').map(c=>`<option value="${escapeHtml(c.name)}">${escapeHtml(c.emoji||'')} ${escapeHtml(c.name)}</option>`).join('');
kat.value='semua';
}
const akun=document.getElementById('linkTxAkun');
if(akun){
akun.innerHTML='<option value="semua">Semua Akun</option>'+(D.accounts||[]).map(a=>`<option value="${a.id}">${a.emoji||''} ${escapeHtml(a.name)}</option>`).join('');
akun.value='semua';
}
LinkTx.onKatChange();
openModal('linkTxModal');
},
onKatChange(){
const kat=document.getElementById('linkTxKat');
const sub=document.getElementById('linkTxSub');
if(!kat||!sub)return;
const cat=getCatsByType('expense').find(c=>c.name===kat.value);
sub.innerHTML='<option value="semua">Semua</option>'+((cat&&cat.subs)||[]).map(s=>`<option value="${escapeHtml(s.name)}">${escapeHtml(s.name)}</option>`).join('');
sub.value='semua';
LinkTx.renderList();
},
_alreadyLinked(t){
return !!(t.renovItemLinkId||t.wishlistLinkId||t.billLinkId);
},
toggleSelect(txId){
txId=String(txId);
if(LinkTx.selected.has(txId))LinkTx.selected.delete(txId);
else LinkTx.selected.add(txId);
},
_getFiltered(q){
q=(q!==undefined?q:(document.getElementById('linkTxSearch')||{}).value||'').toLowerCase().trim();
const katSel=(document.getElementById('linkTxKat')||{}).value||'semua';
const subSel=(document.getElementById('linkTxSub')||{}).value||'semua';
const dari=(document.getElementById('linkTxDari')||{}).value||'';
const sampai=(document.getElementById('linkTxSampai')||{}).value||'';
const akunSel=(document.getElementById('linkTxAkun')||{}).value||'semua';
return (D.transactions||[])
.filter(t=>t.type==='expense'&&!LinkTx._alreadyLinked(t))
.filter(t=>katSel==='semua'||t.category===katSel)
.filter(t=>subSel==='semua'||t.subcategory===subSel)
.filter(t=>!dari||(t.date||'')>=dari)
.filter(t=>!sampai||(t.date||'')<=sampai)
.filter(t=>akunSel==='semua'||String(t.accountId)===String(akunSel))
.filter(t=>{
if(!q)return true;
return (t.note||'').toLowerCase().includes(q)||(t.category||'').toLowerCase().includes(q)||String(t.amount||'').includes(q)||(t.date||'').includes(q);
})
.sort((a,b)=>(b.date||'').localeCompare(a.date||''))
.slice(0,2000);
},
selectAllMatching(){
const list=LinkTx._getFiltered();
list.forEach(t=>LinkTx.selected.add(String(t.id)));
LinkTx.renderList();
toast(`☑️ ${list.length} transaksi dipilih`);
},
clearSelection(){
LinkTx.selected=new Set();
LinkTx.renderList();
},
renderList(q){
const el=document.getElementById('linkTxList');
if(!el)return;
const list=LinkTx._getFiltered(q);
if(!list.length){
el.innerHTML='<div class="empty"><div class="empty-icon">🔍</div><div class="empty-text">Tidak ada transaksi cocok</div></div>';
} else {
el.innerHTML=list.map(t=>{
const acc=D.accounts.find(a=>a.id===t.accountId);
const checked=LinkTx.selected.has(String(t.id))?'checked':'';
return`<div class="tx-item u-pointer" data-action="LinkTx.toggleSelectAndRender" data-args="${escapeHtml(JSON.stringify([t.id]))}">
          <input type="checkbox" ${checked} style="width:18px;height:18px;margin-right:4px" data-onclick="event.stopPropagation();LinkTx.toggleSelectAndRender('${t.id}')">
          <div class="tx-icon" style="background:var(--accent2-soft)">💸</div>
          <div class="tx-info">
            <div class="tx-name">${escapeHtml(t.note||t.category||'Transaksi')}</div>
            <div class="tx-meta">${escapeHtml(t.date||'')} ${acc?'· '+escapeHtml(acc.name):''} ${t.subcategory?'· '+escapeHtml(t.subcategory):''}</div>
          </div>
          <div class="tx-amount red">${fmt(t.amount)}</div>
        </div>`;
}).join('');
}
LinkTx.updatePreview();
},
toggleSelectAndRender(txId){
LinkTx.toggleSelect(txId);
LinkTx.renderList();
},
updatePreview(){
const ids=Array.from(LinkTx.selected);
const total=ids.reduce((s,id)=>{const t=D.transactions.find(x=>sameId(x.id,id));return s+(t?(t.amount||0):0);},0);
const bar=document.getElementById('linkTxPreviewText');
const btn=document.getElementById('linkTxConfirmBtn');
if(bar)bar.textContent=ids.length?`☑️ ${ids.length} transaksi dipilih · Total ${fmtFull(total)}`:'Belum ada transaksi dipilih';
if(btn){
btn.disabled=!ids.length;
btn.style.opacity=ids.length?'1':'0.5';
btn.textContent=LinkTx._cfg().confirmLabel;
}
},
_createFromTx(t){
if(LinkTx.ctx==='renov'){
const p=D.renovProjects.find(x=>sameId(x.id,LinkTx.targetId));
if(!p)return null;
const it={id:uid(),name:t.note||t.category||'Item Renovasi',note:'',paid:true,txId:t.id,paidDate:t.date,harga:t.amount,category:t.category,accountId:t.accountId,tglBayar:t.date};
p.items.push(it);
t.renovProjectLinkId=p.id;t.renovItemLinkId=it.id;
return{kind:'renov',projectId:p.id,itemId:it.id,txId:t.id,amount:t.amount};
}
if(LinkTx.ctx==='wishlist'){
const it={id:uid(),name:t.note||t.category||'Barang',price:t.amount,isDiskon:false,hargaNormal:0,cat:'kebutuhan',urgensi:'mendesak',sudahPunya:false,sudahPunyaAlasan:'',createdAt:t.date?new Date(t.date).toISOString():new Date().toISOString(),bought:true,boughtDate:t.date,txId:t.id};
D.wishlist.push(it);
t.wishlistLinkId=it.id;
return{kind:'wishlist',itemId:it.id,txId:t.id,amount:t.amount};
}
if(LinkTx.ctx==='bill'){
const b=D.bills.find(x=>sameId(x.id,LinkTx.targetId))||(D.billsArchive||[]).find(x=>sameId(x.id,LinkTx.targetId));
if(!b)return null;
t.billLinkId=b.id;
return{kind:'bill',billId:b.id,txId:t.id,amount:t.amount};
}
return null;
},
_undoEntry(e){
const t=D.transactions.find(x=>sameId(x.id,e.txId));
if(e.kind==='renov'){
const p=D.renovProjects.find(x=>sameId(x.id,e.projectId));
if(p)p.items=p.items.filter(i=>!sameId(i.id,e.itemId));
if(t){delete t.renovProjectLinkId;delete t.renovItemLinkId;}
} else if(e.kind==='wishlist'){
D.wishlist=D.wishlist.filter(x=>!sameId(x.id,e.itemId));
if(t)delete t.wishlistLinkId;
} else if(e.kind==='bill'){
if(t)delete t.billLinkId;
}
},
_refreshCtxUI(){
if(LinkTx.ctx==='renov'){
Renov.render();
if(sameId(Renov.curId,LinkTx.targetId))Renov.renderDetail();
renderDashboard();renderKeuangan();
} else if(LinkTx.ctx==='wishlist'){
WorthIt.renderList();
if(typeof WorthIt.renderBoughtList==='function')WorthIt.renderBoughtList();
} else if(LinkTx.ctx==='bill'){
if(typeof refreshBillEverywhere==='function')refreshBillEverywhere();
renderDashboard();renderKeuangan();
}
},
async confirmBulk(){
const ids=Array.from(LinkTx.selected);
if(!ids.length){toast('⚠️ Belum ada transaksi dipilih');return;}
const cfg=LinkTx._cfg();
const total=ids.reduce((s,id)=>{const t=D.transactions.find(x=>sameId(x.id,id));return s+(t?(t.amount||0):0);},0);
if(!await askConfirm(`Hubungkan ${ids.length} transaksi terpilih (total ${fmtFull(total)})? ${cfg.confirmNote} TIDAK ada transaksi baru yang dibuat.`,{okText:'Ya, Hubungkan',icon:'🔗',danger:false}))return;
const entries=[];
ids.forEach(txId=>{
const t=D.transactions.find(x=>sameId(x.id,txId));
if(!t||LinkTx._alreadyLinked(t))return;
const entry=LinkTx._createFromTx(t);
if(entry)entries.push(entry);
});
if(!entries.length){toast('⚠️ Tidak ada transaksi yang berhasil dihubungkan');return;}
save();
LinkTx.lastBatch={ctx:LinkTx.ctx,targetId:LinkTx.targetId,entries,count:entries.length,total:entries.reduce((s,e)=>s+(e.amount||0),0)};
LinkTx.selected=new Set();
LinkTx._refreshCtxUI();
document.getElementById('linkTxFilterBox').style.display='none';
const box=document.getElementById('linkTxSuccessBox');
box.style.display='block';
document.getElementById('linkTxSuccessTitle').textContent=`${entries.length} transaksi berhasil dihubungkan`;
document.getElementById('linkTxSuccessSub').textContent=`Total ${fmtFull(LinkTx.lastBatch.total)}. Salah pilih? Bisa diurungkan — transaksi ASLI di Keuangan tetap aman, tidak ikut terhapus.`;
toast(`🔗 ${entries.length} transaksi dihubungkan`);
},
async undo(){
const batch=LinkTx.lastBatch;
if(!batch){toast('⚠️ Tidak ada link yang bisa diurungkan');return;}
if(!await askConfirm(`Urungkan link ${batch.count} transaksi ini? Transaksi ASLI di Keuangan TIDAK akan dihapus, cuma tautannya yang dilepas.`,{okText:'Ya, Urungkan',icon:'↺',danger:false}))return;
batch.entries.forEach(e=>LinkTx._undoEntry(e));
save();
const savedCtx=LinkTx.ctx,savedTarget=LinkTx.targetId;
LinkTx.ctx=batch.ctx;LinkTx.targetId=batch.targetId;
LinkTx._refreshCtxUI();
LinkTx.ctx=savedCtx;LinkTx.targetId=savedTarget;
LinkTx.lastBatch=null;
document.getElementById('linkTxSuccessBox').style.display='none';
document.getElementById('linkTxFilterBox').style.display='block';
LinkTx.renderList();
toast('↺ Link dibatalkan, transaksi asli di Keuangan tetap ada');
},
finish(){
closeModal('linkTxModal');
LinkTx.lastBatch=null;
}
};

// renovasi.js — Domain Proyek Renovasi: RenovCalc (kalkulator material), Renov (proyek & item biaya), RenovAI (saran AI kebutuhan/ukuran)
// CATATAN: modul-modul ini dipindah ke file baru ini dari features-renovasi-pajak-aset-order.js (v62), yang sebelumnya juga berisi domain Aset/Kekayaan (AlokasiAset/Aset/IDBStore/PORTFOLIO_LABELS/TimelineW, sekarang di aset.js) & Worth It/Prioritas Belanja (WorthIt, sekarang di worthit.js).
// File lama features-renovasi-pajak-aset-order.js DIHAPUS setelah ini karena tidak ada isi tersisa.
// Renov.saveItem() memakai RenovCalc._pendingDetail lewat variabel global (diisi RenovCalc.useMaterial() saat modal Kalkulator Bantu Material dipakai) — aman krn 1 file yang sama sekarang.
// PENTING: file ini HARUS dimuat sesuai urutan build.js (GROUP_A/GROUP_B) karena beberapa modul saling referensi. Urutan grup ini: pajak-pbb-zakat.js, features-budget-laporan-carnotes-pelanggan.js, edukasi-dana.js, sewakios.js, hidup-seimbang.js, linktx.js, renovasi.js, aset.js, worthit.js

const RenovCalc={
_matTotal:0,_matKebutuhan:0,_pendingDetail:null,
open(saved){
if(saved&&saved.type==='material'){
document.getElementById('rcMatNama').value=saved.nama||'';
document.getElementById('rcMatSatuan').value=saved.satuan||'m3';
document.getElementById('rcMatHitungUkuran').checked=!!saved.hitungUkuran;
document.getElementById('rcMatP').value=saved.p||'';
document.getElementById('rcMatL').value=saved.l||'';
document.getElementById('rcMatT').value=saved.t||'';
document.getElementById('rcMatLangsung').value=saved.langsung||'';
document.getElementById('rcMatBuangan').value=saved.buangan||'0';
document.getElementById('rcMatHarga').value=saved.harga||'';
} else {
['rcMatNama','rcMatP','rcMatL','rcMatT','rcMatLangsung','rcMatHarga'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
document.getElementById('rcMatBuangan').value='0';
document.getElementById('rcMatSatuan').value='m3';
document.getElementById('rcMatHitungUkuran').checked=false;
}
RenovCalc.onMatSatuanChange();
RenovCalc.toggleHitungUkuran();
openModal('renovCalcModal');
},
onMatSatuanChange(){
const s=document.getElementById('rcMatSatuan').value;
const labelMap={m3:'m³',m2:'m²',meter:'meter',batang:'batang/pcs'};
const lbl=labelMap[s];
document.getElementById('rcMatHargaLbl').textContent='Harga per '+lbl+' (Rp)';
document.getElementById('rcMatLangsungLbl').textContent='Jumlah Kebutuhan ('+lbl+')';
document.getElementById('rcMatLWrap').style.display=(s==='m3'||s==='m2')?'block':'none';
document.getElementById('rcMatTWrap').style.display=s==='m3'?'block':'none';
document.getElementById('rcMatBuanganWrap').style.display=s==='batang'?'none':'block';
RenovCalc.calcMaterial();
},
toggleHitungUkuran(){
const on=document.getElementById('rcMatHitungUkuran').checked;
const s=document.getElementById('rcMatSatuan').value;
const showUkuran=on&&s!=='batang';
document.getElementById('rcMatUkuranWrap').style.display=showUkuran?'block':'none';
document.getElementById('rcMatLangsungWrap').style.display=showUkuran?'none':'block';
RenovCalc.calcMaterial();
},
calcMaterial(){
const satuan=document.getElementById('rcMatSatuan').value;
const hitungUkuran=document.getElementById('rcMatHitungUkuran').checked&&satuan!=='batang';
const buangan=parseFloat(document.getElementById('rcMatBuangan').value)||0;
const harga=parseFloat(document.getElementById('rcMatHarga').value)||0;
let kebutuhanDasar=0;
if(hitungUkuran){
const p=parseFloat(document.getElementById('rcMatP').value)||0;
const l=parseFloat(document.getElementById('rcMatL').value)||0;
const t=parseFloat(document.getElementById('rcMatT').value)||0;
if(satuan==='m3')kebutuhanDasar=p*l*t;
else if(satuan==='m2')kebutuhanDasar=p*l;
else kebutuhanDasar=p;
} else {
kebutuhanDasar=parseFloat(document.getElementById('rcMatLangsung').value)||0;
}
const kebutuhanFinal=satuan==='batang'?Math.ceil(kebutuhanDasar*(1+buangan/100)):Math.round(kebutuhanDasar*(1+buangan/100)*100)/100;
const total=kebutuhanFinal*harga;
const labelMap={m3:'m³',m2:'m²',meter:'meter',batang:'batang/pcs'};
document.getElementById('rcMatKebutuhan').textContent=kebutuhanFinal.toLocaleString('id-ID')+' '+labelMap[satuan];
document.getElementById('rcMatTotal').textContent=fmtFull(total);
RenovCalc._matTotal=total;
RenovCalc._matKebutuhan=kebutuhanFinal;
},
useMaterial(){
const total=RenovCalc._matTotal||0;
if(total<=0){toast('⚠️ Isi dulu kebutuhan & harga satuannya');return;}
const nama=document.getElementById('rcMatNama').value.trim()||'Material';
const labelMap={m3:'m³',m2:'m²',meter:'meter',batang:'batang/pcs'};
const satuan=document.getElementById('rcMatSatuan').value;
const suggestName=`${nama} (${(RenovCalc._matKebutuhan||0).toLocaleString('id-ID')} ${labelMap[satuan]})`;
const kebutuhanText=document.getElementById('rcMatKebutuhan').textContent||'';
const hargaSatuan=parseFloat(document.getElementById('rcMatHarga').value)||0;
document.getElementById('renovItemHarga').value=Math.round(total);
const nameEl=document.getElementById('renovItemName');
if(nameEl)nameEl.value=suggestName;
RenovCalc._pendingDetail={
type:'material',nama,satuan,
hitungUkuran:document.getElementById('rcMatHitungUkuran').checked,
p:document.getElementById('rcMatP').value,
l:document.getElementById('rcMatL').value,
t:document.getElementById('rcMatT').value,
langsung:document.getElementById('rcMatLangsung').value,
buangan:document.getElementById('rcMatBuangan').value,
harga:document.getElementById('rcMatHarga').value,
total:Math.round(total),
text:'Material — '+kebutuhanText+' × '+fmtFull(hargaSatuan)+'/'+labelMap[satuan]
};
closeModal('renovCalcModal');
toast('✅ Hasil hitung material dipakai ke form item');
}
};
const Renov={
curId:null,
projEditId:null,
editItemId:null,
_currentItemCalcDetail:null,
totals(p){
const items=p.items||[];
const total=items.reduce((s,it)=>s+(it.harga||0),0);
const paid=items.filter(it=>it.paid).reduce((s,it)=>s+(it.harga||0),0);
const count=items.length;
const paidCount=items.filter(it=>it.paid).length;
return{total,paid,sisa:total-paid,count,paidCount};
},
render(){
const el=document.getElementById('renovList');
if(!el)return;
if(!D.renovProjects||!D.renovProjects.length){
el.innerHTML='<div class="empty"><div class="empty-icon">🛠️</div><div class="empty-text">Belum ada proyek renovasi</div></div>';
return;
}
el.innerHTML=D.renovProjects.map(p=>{
const t=Renov.totals(p);
const pct=t.total>0?Math.round((t.paid/t.total)*100):0;
return`<div class="tx-item u-pointer u-fdcol u-gap6" style="align-items:stretch" data-action="Renov.openDetail" data-args="${escapeHtml(JSON.stringify([p.id]))}">
        <div class="u-flex u-aic u-gap10">
          <div class="tx-icon u-bgaccsoft">🛠️</div>
          <div class="tx-info">
            <div class="tx-name">${escapeHtml(p.name)} ${t.count?`<span class="acc-chip">${t.paidCount}/${t.count} item</span>`:''}</div>
            <div class="tx-meta">${fmt(t.paid)} / ${fmt(t.total)} ${t.total>0?'· '+pct+'%':''}</div>
          </div>
          <button class="tx-del" data-stop="1" data-action="Renov.deleteProject" data-args="${escapeHtml(JSON.stringify([p.id]))}" aria-label="Hapus">🗑</button>
        </div>
        <div class="prog-bar" style="height:6px;margin-top:0"><div class="prog-fill purple" style="width:${pct}%"></div></div>
      </div>`;
}).join('');
},
openProjectModal(id){
Renov.projEditId=id||null;
const p=id?D.renovProjects.find(x=>sameId(x.id,id)):null;
document.getElementById('renovProjectModalTitle').textContent=p?'Edit Proyek':'Proyek Renovasi Baru';
document.getElementById('renovProjName').value=p?p.name:'';
document.getElementById('renovProjNote').value=p?(p.catatan||''):'';
openModal('renovProjectModal');
},
saveProject(){
const name=document.getElementById('renovProjName').value.trim();
if(!name){toast('⚠️ Masukkan nama proyek');return;}
const catatan=document.getElementById('renovProjNote').value.trim();
if(Renov.projEditId){
const p=D.renovProjects.find(x=>sameId(x.id,Renov.projEditId));
if(p){p.name=name;p.catatan=catatan;}
} else {
D.renovProjects.push({id:uid(),name,catatan,createdAt:new Date().toISOString().split('T')[0],items:[]});
}
Renov.projEditId=null;
save();closeModal('renovProjectModal');Renov.render();
if(Renov.curId)Renov.renderDetail();
toast('✅ Proyek tersimpan');
},
editCurrentProject(){ if(Renov.curId)Renov.openProjectModal(Renov.curId); },
async deleteProject(id){
const p=D.renovProjects.find(x=>sameId(x.id,id));
if(!p)return;
if(!await askConfirm(`Hapus proyek "${escapeHtml(p.name)}"? Transaksi yang sudah tercatat di Keuangan TIDAK ikut terhapus, cuma dilepas dari daftar proyek ini.`,{title:'Hapus Proyek',okText:'Ya, Hapus'}))return;
(p.items||[]).forEach(it=>{
if(it.txId){
const t=D.transactions.find(x=>sameId(x.id,it.txId));
if(t){delete t.renovProjectLinkId;delete t.renovItemLinkId;}
}
if(it.calcDetail&&it.calcDetail.type==='absensi')Tukang.releaseEntries(it.calcDetail.entryIds);
});
D.renovProjects=D.renovProjects.filter(x=>!sameId(x.id,id));
if(sameId(Renov.curId,id))Renov.curId=null;
save();closeModal('renovDetailModal');Renov.render();
toast('🗑 Proyek dihapus (transaksi terkait tetap ada di Keuangan)');
},
openDetail(id){
Renov.curId=id;
Renov.renderDetail();
openModal('renovDetailModal');
},
renderDetail(){
const p=D.renovProjects.find(x=>sameId(x.id,Renov.curId));
if(!p){closeModal('renovDetailModal');return;}
document.getElementById('renovDetailTitle').textContent=p.name;
document.getElementById('renovDetailNote').textContent=p.catatan||'';
const t=Renov.totals(p);
document.getElementById('renovDetTotal').textContent=fmtFull(t.total);
document.getElementById('renovDetPaid').textContent=fmtFull(t.paid);
document.getElementById('renovDetSisa').textContent=fmtFull(t.sisa);
const pct=t.total>0?Math.round((t.paid/t.total)*100):0;
document.getElementById('renovDetBar').style.width=pct+'%';
document.getElementById('renovDetPct').textContent=pct+'% selesai';
document.getElementById('renovDetCount').textContent=`${t.paidCount}/${t.count} item lunas`;
const listEl=document.getElementById('renovItemList');
if(!t.count){
listEl.innerHTML='<div class="empty"><div class="empty-icon">📋</div><div class="empty-text">Belum ada item biaya</div></div>';
return;
}
const renderRow=(it)=>{
const acc=D.accounts.find(a=>a.id===it.accountId);
return`<div class="tx-item">
        <div class="tx-icon" style="background:${it.paid?'var(--accent3-soft)':'var(--surface3)'};cursor:pointer" data-action="Renov.togglePaid" data-args="${escapeHtml(JSON.stringify([p.id, it.id]))}" title="${it.paid?'Batalkan lunas':'Tandai sudah dibeli'}">${it.paid?'✅':'⬜'}</div>
        <div class="tx-info u-pointer" data-action="Renov.openItemModal" data-args="${escapeHtml(JSON.stringify([p.id, it.id]))}">
          <div class="tx-name" style="${it.paid?'text-decoration:line-through;color:var(--text2)':''}">${escapeHtml(it.name)} ${it.category?`<span class="acc-chip">${escapeHtml(it.category)}</span>`:''}</div>
          <div class="tx-meta">${it.ukuran?('📏 '+escapeHtml(it.ukuran)+' · '):''}${it.paid?'Lunas · ':''}${acc?acc.emoji+' '+escapeHtml(acc.name):'Belum pilih akun'}${it.calcDetail?(' · 🧮'+(Math.round(it.calcDetail.total||0)!==Math.round(it.harga||0)?' ⚠️':'')):''}</div>
        </div>
        <div class="tx-amount ${it.paid?'green':''}">${fmt(it.harga)}</div>
        <button class="tx-del" data-action="Renov.deleteItem" data-args="${escapeHtml(JSON.stringify([p.id, it.id]))}" aria-label="Hapus">🗑</button>
      </div>`;
};
const belum=p.items.filter(it=>!it.paid);
const sudah=p.items.filter(it=>it.paid);
let html='';
if(belum.length)html+=`<div class="u-fs11 u-fw700 u-t2" style="text-transform:uppercase;letter-spacing:0.5px;margin:10px 0 6px">🛒 Perlu Dibeli (${belum.length})</div>`+belum.map(renderRow).join('');
if(sudah.length)html+=`<div class="u-fs11 u-fw700 u-t2" style="text-transform:uppercase;letter-spacing:0.5px;margin:14px 0 6px">✅ Sudah Dibeli (${sudah.length})</div>`+sudah.map(renderRow).join('');
listEl.innerHTML=html;
},
openItemModal(projectId,itemId){
Renov.curId=projectId;
Renov.editItemId=itemId||null;
const p=D.renovProjects.find(x=>sameId(x.id,projectId));
if(!p)return;
const it=itemId?p.items.find(x=>sameId(x.id,itemId)):null;
const cats=getCatsByType('expense');
document.getElementById('renovItemCat').innerHTML='<option value="">Tanpa kategori</option>'+cats.map(c=>`<option value="${escapeHtml(c.name)}">${c.emoji} ${escapeHtml(c.name)}</option>`).join('');
document.getElementById('renovItemAcc').innerHTML=D.accounts.map(a=>`<option value="${a.id}">${a.emoji} ${escapeHtml(a.name)}</option>`).join('');
document.getElementById('renovItemModalTitle').textContent=it?'Edit Item Biaya':'Tambah Item Biaya';
document.getElementById('renovItemName').value=it?it.name:'';
document.getElementById('renovItemUkuran').value=it?(it.ukuran||''):'';
document.getElementById('renovItemHarga').value=it?it.harga:'';
document.getElementById('renovItemCat').value=it?(it.category||''):'';
document.getElementById('renovItemAcc').value=it?(it.accountId||D.accounts[0]?.id||''):(D.accounts[0]?.id||'');
document.getElementById('renovItemTglBayar').value=it?(it.tglBayar||it.paidDate||todayStr()):todayStr();
document.getElementById('renovItemNote').value=it?(it.note||''):'';
document.getElementById('renovItemPaidNotice').style.display=(it&&it.paid)?'block':'none';
RenovCalc._pendingDetail=null;
Renov._currentItemCalcDetail=it?(it.calcDetail||null):null;
const calcNoteEl=document.getElementById('renovItemCalcSaved');
if(calcNoteEl){
if(it&&it.calcDetail){
const mismatch=Math.round(it.calcDetail.total||0)!==Math.round(it.harga||0);
calcNoteEl.style.display='block';
calcNoteEl.innerHTML='🧮 Rincian tersimpan: '+escapeHtml(it.calcDetail.text||'')+(mismatch?' <span class="u-cacc2 u-fw600">(⚠️ sudah tidak sesuai harga terbaru)</span>':'');
} else {
calcNoteEl.style.display='none';
calcNoteEl.innerHTML='';
}
}
document.getElementById('renovItemLinkOldWrap').style.display=(it&&it.paid)?'none':'block';
closeModal('renovDetailModal');
openModal('renovItemModal');
},
saveItem(){
evalAmtExpr('renovItemHarga');
const p=D.renovProjects.find(x=>sameId(x.id,Renov.curId));
if(!p){toast('⚠️ Proyek tidak ditemukan');return;}
const name=document.getElementById('renovItemName').value.trim();
const ukuran=document.getElementById('renovItemUkuran').value.trim();
const harga=parseFloat(document.getElementById('renovItemHarga').value)||0;
if(!name||harga<=0){toast('⚠️ Lengkapi nama & harga item');return;}
const category=document.getElementById('renovItemCat').value;
const accountId=document.getElementById('renovItemAcc').value||D.accounts[0]?.id;
const tglBayar=document.getElementById('renovItemTglBayar').value||todayStr();
const note=document.getElementById('renovItemNote').value.trim();
let calcDetail=null;
if(RenovCalc._pendingDetail&&Math.round(RenovCalc._pendingDetail.total)===Math.round(harga)){
calcDetail=RenovCalc._pendingDetail;
}
if(Renov.editItemId){
const it=p.items.find(x=>sameId(x.id,Renov.editItemId));
if(it){
it.name=name;it.ukuran=ukuran;it.harga=harga;it.category=category;it.accountId=accountId;it.note=note;it.tglBayar=tglBayar;
if(calcDetail){
if(it.calcDetail&&it.calcDetail.type==='absensi'&&it.calcDetail!==calcDetail){
Tukang.releaseEntries(it.calcDetail.entryIds);
}
it.calcDetail=calcDetail;
if(calcDetail.type==='absensi')Tukang.markUsed(calcDetail.entryIds,it.id);
}
if(it.paid&&it.txId){
const t=D.transactions.find(x=>sameId(x.id,it.txId));
if(t){Object.assign(t,{amount:harga,category:category||'Renovasi',accountId,date:tglBayar,note:'Renovasi: '+p.name+' - '+name+(note?' ('+note+')':'')});it.paidDate=tglBayar;}
}
}
} else {
const newId=uid();
p.items.push({id:newId,name,ukuran,harga,category,accountId,note,tglBayar,calcDetail,paid:false,txId:null,paidDate:null});
if(calcDetail&&calcDetail.type==='absensi')Tukang.markUsed(calcDetail.entryIds,newId);
}
RenovCalc._pendingDetail=null;
Renov.editItemId=null;
save();closeModal('renovItemModal');
Renov.render();renderDashboard();renderKeuangan();
Renov.openDetail(p.id);
toast('✅ Item tersimpan');
},
async togglePaid(projectId,itemId){
const p=D.renovProjects.find(x=>sameId(x.id,projectId));
if(!p)return;
const it=p.items.find(x=>sameId(x.id,itemId));
if(!it)return;
if(!it.paid){
const tglBayar=it.tglBayar||todayStr();
if(!await askConfirm(`Tandai "${escapeHtml(it.name)}" lunas sebesar ${fmtFull(it.harga)} pada tanggal ${tglBayar}? Ini akan bikin transaksi pengeluaran NYATA di Keuangan (pengaruh ke saldo akun). Kalau transaksinya sudah ada sebelumnya di Keuangan, batalkan ini dan pakai tombol "🔗 Hubungkan Transaksi Lama" di form edit item supaya tidak dobel.`,{okText:'Ya, Bayar',icon:'💸'}))return;
const txId=uid();
D.transactions.push({id:txId,type:'expense',amount:it.harga,category:it.category||'Renovasi',subcategory:'',accountId:it.accountId||D.accounts[0]?.id||'',payMethod:'tunai',note:'Renovasi: '+p.name+' - '+it.name+(it.note?' ('+it.note+')':''),date:tglBayar,renovProjectLinkId:p.id,renovItemLinkId:it.id});
it.paid=true;it.txId=txId;it.paidDate=tglBayar;
save();renderDashboard();renderKeuangan();Renov.render();Renov.renderDetail();
toast('✅ Item ditandai lunas & transaksi tercatat di Keuangan');
} else {
if(!await askConfirm(`Batalkan status lunas "${escapeHtml(it.name)}"? Transaksi terkait di Keuangan akan ikut dihapus.`,{title:'Batalkan Lunas',okText:'Ya, Batalkan'}))return;
if(it.txId)D.transactions=D.transactions.filter(x=>!sameId(x.id,it.txId));
it.paid=false;it.txId=null;it.paidDate=null;
save();renderDashboard();renderKeuangan();Renov.render();Renov.renderDetail();
toast('↺ Status lunas dibatalkan, transaksi terkait dihapus');
}
},
async deleteItem(projectId,itemId){
const p=D.renovProjects.find(x=>sameId(x.id,projectId));
if(!p)return;
const it=p.items.find(x=>sameId(x.id,itemId));
if(!it)return;
const msg=it.paid?`Hapus item "${escapeHtml(it.name)}"? Transaksi terkait di Keuangan akan ikut dihapus.`:`Hapus item "${escapeHtml(it.name)}"?`;
if(!await askConfirm(msg))return;
if(it.paid&&it.txId)D.transactions=D.transactions.filter(x=>!sameId(x.id,it.txId));
if(it.calcDetail&&it.calcDetail.type==='absensi')Tukang.releaseEntries(it.calcDetail.entryIds);
p.items=p.items.filter(x=>!sameId(x.id,itemId));
save();renderDashboard();renderKeuangan();Renov.render();Renov.renderDetail();
toast('🗑 Item dihapus');
},
onLinkedTxDeleted(t){
const p=D.renovProjects.find(x=>sameId(x.id,t.renovProjectLinkId));
if(!p)return;
const it=p.items.find(x=>sameId(x.id,t.renovItemLinkId));
if(!it)return;
it.paid=false;it.txId=null;it.paidDate=null;
Renov.render();
if(sameId(Renov.curId,p.id))Renov.renderDetail();
},
onLinkedTxEdited(t){
const p=D.renovProjects.find(x=>sameId(x.id,t.renovProjectLinkId));
if(!p)return;
const it=p.items.find(x=>sameId(x.id,t.renovItemLinkId));
if(!it)return;
it.harga=t.amount;it.category=t.category;it.accountId=t.accountId;it.paidDate=t.date;it.tglBayar=t.date;
Renov.render();
if(sameId(Renov.curId,p.id))Renov.renderDetail();
},
openLinkTxModal(){
LinkTx.open('renov',Renov.curId);
},
async confirmLinkTx(txId){
const p=D.renovProjects.find(x=>sameId(x.id,Renov.curId));
if(!p){toast('⚠️ Proyek tidak ditemukan');return;}
const t=D.transactions.find(x=>sameId(x.id,txId));
if(!t){toast('⚠️ Transaksi tidak ditemukan');return;}
if(!await askConfirm(`Hubungkan transaksi "${t.note||t.category||'ini'}" (${fmtFull(t.amount)}, ${t.date}) ke item renovasi ini? Item akan otomatis terisi & langsung berstatus lunas dari transaksi ini — TIDAK ada transaksi baru yang dibuat.`,{okText:'Ya, Hubungkan',icon:'🔗',danger:false}))return;
const nameInput=document.getElementById('renovItemName').value.trim();
const noteInput=document.getElementById('renovItemNote').value.trim();
let it=Renov.editItemId?p.items.find(x=>sameId(x.id,Renov.editItemId)):null;
if(!it){
it={id:uid(),name:nameInput||t.note||t.category||'Item Renovasi',note:noteInput,paid:false,txId:null,paidDate:null};
p.items.push(it);
Renov.editItemId=it.id;
} else if(nameInput){
it.name=nameInput;it.note=noteInput;
}
it.harga=t.amount;it.category=t.category;it.accountId=t.accountId;
it.paid=true;it.txId=t.id;it.paidDate=t.date;it.tglBayar=t.date;
t.renovProjectLinkId=p.id;t.renovItemLinkId=it.id;
Renov.editItemId=null;
save();closeModal('linkTxModal');closeModal('renovItemModal');
Renov.render();renderDashboard();renderKeuangan();
Renov.openDetail(p.id);
toast('✅ Transaksi lama dihubungkan ke item renovasi (tidak dobel)');
}
};
const DEFAULT_CATS = {
income:[
{id:'cat_gi',name:'Gaji toko',emoji:'💼',subs:[]},
{id:'cat_bo',name:'Bonus toko',emoji:'🎁',subs:[]},
{id:'cat_cb',name:'Bisnis',emoji:'🪨',subs:[{id:'sub_cb_cobek',name:'Cobek'}]},
{id:'cat_tb',name:'Tambahan',emoji:'➕',subs:[]},
{id:'cat_ll',name:'Lainnya',emoji:'📦',subs:[]}
],
expense:[
{id:'cat_ki',name:'Kiriman istri',emoji:'👩',subs:[]},
{id:'cat_bp',name:'BPJS',emoji:'💊',subs:[]},
{id:'cat_tg',name:'Tagihan',emoji:'🧾',subs:[{id:'sub_wifi',name:'Wifi'},{id:'sub_pulsa',name:'Pulsa/Kuota'},{id:'sub_listrik',name:'Listrik'}]},
{id:'cat_mk',name:'Makan',emoji:'🍽️',subs:[]},
{id:'cat_an',name:'Anak',emoji:'👶',subs:[{id:'sub_sklh',name:'Sekolah'},{id:'sub_susu',name:'Susu & Gizi'},{id:'sub_mainan',name:'Mainan & Buku'}]},
{id:'cat_rv',name:'Renovasi',emoji:'🔨',subs:[]},
{id:'cat_bl',name:'Belanja',emoji:'🛒',subs:[]},
{id:'cat_cbb',name:'Bisnis',emoji:'🪨',subs:[{id:'sub_cbb_cobek',name:'Cobek'}]},
{id:'cat_lx',name:'Lainnya',emoji:'📦',subs:[]}
]
};
const RenovAI={
systemPrompt(){
return `Kamu asisten renovasi rumah utk keluarga Indonesia. Kamu akan dikasih nama proyek renovasi & daftar item biaya yang sudah dicatat user (nama, ukuran/kebutuhan kalau ada, status sudah/belum dibeli). Tugasmu kasih saran singkat & praktis dalam Bahasa Indonesia, format Markdown ringkas dgn heading kecil pakai **tebal** (bukan JSON):
1. **Kebutuhan yang mungkin terlewat** — barang/jasa lazim utk proyek sejenis yang belum ada di daftar.
2. **Perkiraan ukuran/jumlah** — utk item yang ukurannya belum diisi, kasih perkiraan umum wajar (mis. keramik lantai kamar mandi 2x2m ± perlu berapa m² dgn buangan potong) & sebutkan itu perkiraan kasar yang perlu dicek ulang.
3. **Saran tambahan** — urutan pengerjaan yang wajar, atau hal yang sering bikin biaya membengkak.
Jangan mengarang harga pasti (Rupiah), fokus ke jenis/ukuran/jumlah & saran non-finansial. Jawab ringkas, maksimal sekitar 200-250 kata, jangan pakai kode fence.`;
},
buildUserPrompt(p){
const items=(p.items||[]).map(it=>`- ${escapeHtml(it.name)}${it.ukuran?` (ukuran/kebutuhan: ${it.ukuran})`:' (ukuran belum diisi)'} — ${it.paid?'sudah dibeli':'belum dibeli'}`).join('\n')||'(belum ada item dicatat)';
return `Nama proyek: ${escapeHtml(p.name)}${p.catatan?`\nCatatan: ${p.catatan}`:''}\nDaftar item saat ini:\n${items}\n\nBerikan saran sesuai instruksi.`;
},
async suggest(projectId){
const p=D.renovProjects.find(x=>sameId(x.id,projectId));
if(!p){toast('⚠️ Proyek tidak ditemukan');return;}
const apiKey=D.profile.apiKey;
const provider=D.profile.apiProvider||'claude';
if(!apiKey){toast('⚠️ Belum ada API Key. Isi dulu di Pengaturan → AI Asisten.');return;}
document.getElementById('renovAiBody').innerHTML='<div class="empty"><div class="empty-icon">🤖</div><div class="empty-text">Menyusun saran... (bisa beberapa detik)</div></div>';
openModal('renovAiModal');
try{
const r=await callAIProviderRaw(RenovAI.systemPrompt(),[{role:'user',content:RenovAI.buildUserPrompt(p)}],{maxTokens:1200});
if(!r.ok){
const label=provider==='gemini'?'Gemini':'Claude';
document.getElementById('renovAiBody').innerHTML=`<div class="empty"><div class="empty-icon">⚠️</div><div class="empty-text">Gagal hubungi ${label}: ${escapeHtml(r.errMsg||'error tidak diketahui')}${aiErrorHint(provider,r.status)}</div></div>`;
return;
}
const textOut=r.text;
if(!textOut){
document.getElementById('renovAiBody').innerHTML='<div class="empty"><div class="empty-icon">⚠️</div><div class="empty-text">AI tidak memberi balasan teks. Coba lagi.</div></div>';
return;
}
const htmlOut=escapeHtml(textOut).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/\n/g,'<br>');
document.getElementById('renovAiBody').innerHTML=`<div class="u-fs13 u-lh16">${htmlOut}</div>`;
}catch(e){
document.getElementById('renovAiBody').innerHTML=`<div class="empty"><div class="empty-icon">⚠️</div><div class="empty-text">Gagal ambil saran: ${escapeHtml(e.message||String(e))}</div></div>`;
}
}
};

// aset.js — Domain Aset & Kekayaan: ALOKASI_PRESETS/AlokasiAset (rekomendasi alokasi dana), Aset (Buku Aset & Kekayaan Bersih), IDBStore (helper generik penyimpanan IndexedDB), PORTFOLIO_LABELS, TimelineW (timeline tujuan keuangan)
// CATATAN: modul-modul ini dipindah ke file baru ini dari features-renovasi-pajak-aset-order.js (v62).
// CATATAN: IDBStore sebenarnya helper GENERIK (bukan spesifik domain Aset) yang dipakai save()/migrasi di features-helpers-global-security.js & self-test — ikut co-located di sini krn memang sudah dari dulu 1 file sama Aset, dipindah apa adanya tanpa isi diubah. Kandidat dipindah lagi ke file sendiri di sesi berikutnya kalau mau lebih rapi.
// TimelineW.goals() memanggil Renov.totals() (sekarang di renovasi.js) lewat variabel global — aman krn dipanggil saat runtime (render), bukan saat file di-load, & renovasi.js tetap ikut ter-load lewat build.js.
// PENTING: file ini HARUS dimuat sesuai urutan build.js (GROUP_A/GROUP_B) karena beberapa modul saling referensi. Urutan grup ini: pajak-pbb-zakat.js, features-budget-laporan-carnotes-pelanggan.js, edukasi-dana.js, sewakios.js, hidup-seimbang.js, linktx.js, renovasi.js, aset.js, worthit.js

const ALOKASI_PRESETS={
konservatif:{label:'🛡️ Konservatif',desc:'Prioritas jaga nilai pokok, fluktuasi seminimal mungkin. Cocok kalau dana ini penting/darurat atau horison waktu pendek (<2 tahun).',items:[
{name:'Kas / Dana Darurat',pct:40,icon:'💵'},
{name:'RDPU / Deposito',pct:35,icon:'📈'},
{name:'Obligasi / Sukuk Ritel',pct:15,icon:'📜'},
{name:'Emas',pct:10,icon:'🥇'}
]},
moderat:{label:'⚖️ Moderat',desc:'Seimbang antara peluang pertumbuhan & keamanan. Cocok utk horison menengah (3-5 tahun).',items:[
{name:'Kas / Dana Darurat',pct:20,icon:'💵'},
{name:'RDPU / Deposito',pct:25,icon:'📈'},
{name:'Obligasi / Sukuk Ritel',pct:20,icon:'📜'},
{name:'Reksadana Saham / Saham',pct:20,icon:'📊'},
{name:'Emas',pct:15,icon:'🥇'}
]},
agresif:{label:'🚀 Agresif',desc:'Prioritas pertumbuhan jangka panjang, siap terima fluktuasi nilai yang besar. Cocok horison panjang (>5-7 tahun).',items:[
{name:'Kas / Dana Darurat',pct:10,icon:'💵'},
{name:'Obligasi / Sukuk Ritel',pct:15,icon:'📜'},
{name:'Reksadana Saham / Saham',pct:45,icon:'📊'},
{name:'Emas',pct:10,icon:'🥇'},
{name:'Kripto / Alternatif',pct:20,icon:'🪙'}
]}
};
const AlokasiAset={
SUFFIXES:[''],
setRisk(key){
D.assetAllocation=D.assetAllocation||{};
D.assetAllocation.risk=key;
save();
AlokasiAset.renderAll();
},
onDanaInput(suffix){
suffix=suffix||'';
const danaEl=document.getElementById('aaDana'+suffix);
if(!danaEl)return;
D.assetAllocation=D.assetAllocation||{};
D.assetAllocation.dana=parsePzNum(danaEl.value);
save();
AlokasiAset.renderAll();
},
renderAll(){
AlokasiAset.SUFFIXES.forEach(suf=>AlokasiAset.renderOne(suf));
},
renderOne(suffix){
suffix=suffix||'';
const box=document.getElementById('aaResult'+suffix);
if(!box)return;
const chips=document.querySelectorAll('#aaRiskChips'+suffix+' .chip-btn');
const danaEl=document.getElementById('aaDana'+suffix);
const risk=D.assetAllocation&&D.assetAllocation.risk;
chips.forEach(b=>b.classList.remove('active'));
if(risk){
const idx={konservatif:0,moderat:1,agresif:2}[risk];
if(chips[idx])chips[idx].classList.add('active');
}
if(danaEl){
const savedDana=D.assetAllocation&&D.assetAllocation.dana;
danaEl.value=(savedDana!=null&&savedDana!=='')?savedDana:(totalSaldoAkun()||'');
}
if(!risk){box.innerHTML='<div class="u-fs12t2">Pilih dulu salah satu profil risiko di atas ya.</div>';return;}
const preset=ALOKASI_PRESETS[risk];
if(!preset)return;
const dana=danaEl?parsePzNum(danaEl.value):0;
const dd=(D.targets||[]).find(t=>t.isDanaDarurat);
const ddBanner=dd?'':`<div class="u-fs11 u-cacc2 u-r10 u-mb10 u-lh15" style="background:var(--accent2-soft);padding:8px 10px">🚨 Belum ada target yang ditandai <b>Dana Darurat</b>, jadi baris "Kas / Dana Darurat" di bawah masih ilustrasi murni. <span class="u-pointer u-fw600" style="text-decoration:underline" data-onclick="openTargetModal();document.getElementById('tDanaDarurat').checked=true;onTargetDanaDaruratToggle();">+ Buat targetnya sekarang</span></div>`;
box.innerHTML=ddBanner+'<div class="u-hint10">'+escapeHtml(preset.desc)+'</div>'+
preset.items.map(it=>{
const nominal=Math.round(dana*it.pct/100);
const isDanaDaruratRow=/dana darurat/i.test(it.name);
let ddInfo='';
if(isDanaDaruratRow&&dd){
const ddSaved=dd.accountId?recalcAccBalance(dd.accountId):dd.saved;
const ddPct=Math.min(100,Math.round((ddSaved/dd.amount)*100));
const ddCol=ddPct>=100?'var(--accent3)':ddPct>=50?'var(--accent4)':'var(--accent2)';
ddInfo=`<div style="font-size:11px;color:${ddCol};margin-top:4px;font-weight:600">🎯 "${escapeHtml(dd.name)}": ${fmtFull(ddSaved)} / ${fmtFull(dd.amount)} (${ddPct}%)</div>`;
}
return `<div style="display:flex;justify-content:space-between;align-items:${ddInfo?'flex-start':'center'};padding:8px 0;border-bottom:1px solid var(--border)">
          <div><div class="u-fs13 u-fw600">${it.icon} ${escapeHtml(it.name)}</div><div class="u-fs11 u-t2">${it.pct}%</div>${ddInfo}</div>
          <div class="u-fw700 u-fs13" style="white-space:nowrap;padding-left:8px">${fmtFull(nominal)}</div>
        </div>`;
}).join('')+
'<div class="u-fs11 u-t2 u-mt10 u-lh15">⚠️ Ini cuma ilustrasi persentase umum, bukan saran investasi personal/berlisensi. Nama produk, jangka waktu, dan porsi pastinya perlu disesuaikan sama tujuan & riset kamu sendiri, atau konsultasi ke perencana keuangan berlisensi OJK.</div>';
},
init(suffix){
AlokasiAset.renderOne(suffix||'');
}
};
const Aset={
editId:null,
_zakatableState:false,
ICON:{'Tanah':'🏞️','Rumah/Bangunan':'🏠','Kendaraan':'🏍️','Emas/Logam Mulia':'🥇','Deposito/Investasi':'📈','Saham':'📊','Reksadana':'💹','Kripto':'🪙','Lainnya':'📦'},
openModal(id){
Aset.editId=id||null;
const a=id?D.assets.find(x=>sameId(x.id,id)):null;
document.getElementById('assetModalTitle').textContent=a?'Edit Aset':'Tambah Aset';
document.getElementById('assetName').value=a?a.name:'';
document.getElementById('assetJenis').value=a?a.jenis:'Tanah';
document.getElementById('assetLokasi').value=a?(a.lokasi||''):'';
document.getElementById('assetNilai').value=a?a.nilai:'';
document.getElementById('assetModalInvestasi').value=a&&a.modalInvestasi!=null?a.modalInvestasi:'';
document.getElementById('assetHargaBeli').value=a&&a.hargaBeli!=null?a.hargaBeli:'';
document.getElementById('assetJumlahUnit').value=a&&a.jumlahUnit!=null?a.jumlahUnit:'';
document.getElementById('assetTanggal').value=a?(a.tanggal||''):todayStr();
const accSel=document.getElementById('assetAccId');
if(accSel)accSel.value=a&&a.accountId?String(a.accountId):'';
const scanBox=document.getElementById('assetScanCandidates');
if(scanBox){scanBox.style.display='none';scanBox.innerHTML='';}
Aset._zakatableState=a?!!a.zakatable:false;
const btn=document.getElementById('assetZakatableBtn');
btn.textContent=Aset._zakatableState?'✓ Aktif':'Nonaktif';
btn.className='chip-btn'+(Aset._zakatableState?' active':'');
Aset.updateProfitPreview();
openModal('assetModal');
},
updateProfitPreview(){
const box=document.getElementById('assetProfitInfo');
if(!box)return;
const nilai=calcPreviewValue(document.getElementById('assetNilai').value);
const modal=calcPreviewValue(document.getElementById('assetModalInvestasi').value);
if(!modal){box.innerHTML='';return;}
const untung=nilai-modal;
const pct=modal?(untung/modal*100):0;
const cls=untung>=0?'green':'red';
box.innerHTML='Estimasi untung/rugi: <b class="'+cls+'">'+(untung>=0?'+':'')+fmtFull(untung)+' ('+(pct>=0?'+':'')+pct.toFixed(2)+'%)</b>';
},
toggleZakatable(){
Aset._zakatableState=!Aset._zakatableState;
const btn=document.getElementById('assetZakatableBtn');
btn.textContent=Aset._zakatableState?'✓ Aktif':'Nonaktif';
btn.className='chip-btn'+(Aset._zakatableState?' active':'');
},
save(){
const name=document.getElementById('assetName').value.trim();
if(!name){toast('⚠️ Nama aset wajib diisi');return;}
const jenis=document.getElementById('assetJenis').value;
const lokasi=document.getElementById('assetLokasi').value.trim();
const nilai=parsePzNum(document.getElementById('assetNilai').value);
const modalInvestasi=parsePzNum(document.getElementById('assetModalInvestasi').value)||null;
const hargaBeli=parseDecStr(document.getElementById('assetHargaBeli').value);
const jumlahUnit=parseDecStr(document.getElementById('assetJumlahUnit').value);
const tanggal=document.getElementById('assetTanggal').value||'';
const accountId=document.getElementById('assetAccId').value||null;
const keuntungan=modalInvestasi?(nilai-modalInvestasi):null;
const keuntunganPct=modalInvestasi?((nilai-modalInvestasi)/modalInvestasi*100):null;
const extra={modalInvestasi,hargaBeli,jumlahUnit,keuntungan,keuntunganPct};
if(Aset.editId){
const a=D.assets.find(x=>sameId(x.id,Aset.editId));
if(!a){toast('⚠️ Aset tidak ditemukan, coba tutup dan buka lagi');return;}
Object.assign(a,{name,jenis,lokasi,nilai,tanggal,zakatable:Aset._zakatableState,accountId},extra);
} else {
D.assets.push(Object.assign({id:uid(),name,jenis,lokasi,nilai,tanggal,zakatable:Aset._zakatableState,accountId},extra));
}
save();
closeModal('assetModal');
Aset.renderList();renderKekayaanBersih();hitungZakatMaal();renderAccGrid();renderDashAccList();renderLapAccList();
toast('✅ Aset tersimpan');
},
async delete(id){
if(!await askConfirm('Hapus aset ini dari Buku Aset?',{okText:'Ya, Hapus'}))return;
D.assets=D.assets.filter(a=>!sameId(a.id,id));
save();
Aset.renderList();renderKekayaanBersih();hitungZakatMaal();renderAccGrid();renderDashAccList();renderLapAccList();
},
renderList(){
const el=document.getElementById('assetList');
if(!el)return;
const list=D.assets||[];
if(!list.length){el.innerHTML='<div class="empty"><div class="empty-icon">📋</div><div class="empty-text">Belum ada aset tercatat</div></div>';return;}
el.innerHTML=list.map(a=>{
const hasPct=a.keuntunganPct!=null&&isFinite(a.keuntunganPct);
const pctBadge=hasPct?` <span style="font-size:10px;color:${a.keuntunganPct>=0?'var(--accent3)':'var(--accent2)'}">${a.keuntunganPct>=0?'▲':'▼'} ${a.keuntunganPct>=0?'+':''}${a.keuntunganPct.toFixed(2)}%</span>`:'';
const linkedAcc=a.accountId?D.accounts.find(x=>sameId(x.id,a.accountId)):null;
const linkMeta=linkedAcc?(' · 🔗 '+escapeHtml(linkedAcc.name)):(a.accountId?' · 🔗 (akun terhapus)':'');
return `<div class="tx-item u-pointer" data-action="openAssetModal" data-args="${escapeHtml(JSON.stringify([a.id]))}"><div class="tx-icon u-bgaccsoft">${Aset.ICON[a.jenis]||'📦'}</div><div class="tx-info"><div class="tx-name">${escapeHtml(a.name)}${a.zakatable?' <span class="u-fs10 u-cacc3 u-r6 u-ml4" style="border:1px solid var(--accent3);padding:1px 5px">Zakat</span>':''}</div><div class="tx-meta">${a.jenis}${a.lokasi?' · '+escapeHtml(a.lokasi):''}${linkMeta}${pctBadge}</div></div><div class="tx-amount">${fmt(a.nilai)}</div><button class="tx-del" style="margin-right:2px" title="Update cepat via scan" data-stop="1" data-action="quickScanAsset" data-args="${escapeHtml(JSON.stringify([a.id]))}" aria-label="Update cepat via scan">⚡</button><button class="tx-del" data-stop="1" data-action="delAsset" data-args="${escapeHtml(JSON.stringify([a.id]))}" aria-label="Hapus">🗑</button></div>`;
}).join('');
},
totalValue(){return(D.assets||[]).reduce((s,a)=>s+(a.nilai||0),0);}
};
const IDBStore={
_dbPromise:null,
DB_NAME:'kw_idb_v1',
STORE:'kv',
_open(){
if(IDBStore._dbPromise)return IDBStore._dbPromise;
IDBStore._dbPromise=new Promise((resolve,reject)=>{
if(!window.indexedDB){reject(new Error('IndexedDB tidak didukung browser ini'));return;}
let req;
try{ req=indexedDB.open(IDBStore.DB_NAME,1); }catch(e){reject(e);return;}
req.onupgradeneeded=()=>{ try{ req.result.createObjectStore(IDBStore.STORE); }catch(e){} };
req.onsuccess=()=>{
const db=req.result;
// BUGFIX: kalau koneksi ini ditutup (mis. tab lain upgrade versi DB, atau
// browser menutup koneksi idle) TANPA reset di sini, _dbPromise tetap
// nyimpen janji lama yg resolve ke objek IDBDatabase yg sudah "closing" --
// pemanggilan .transaction() berikutnya lewat cache itu bakal langsung
// lempar InvalidStateError. Makanya begitu koneksi ditutup dgn cara apa
// pun, cache di-null-kan supaya panggilan _open() berikutnya buka koneksi
// baru yang sehat.
db.onversionchange=()=>{ try{db.close();}catch(e){} IDBStore._dbPromise=null; };
db.onclose=()=>{ IDBStore._dbPromise=null; };
resolve(db);
};
req.onerror=()=>{ IDBStore._dbPromise=null; reject(req.error||new Error('Gagal membuka IndexedDB')); };
});
return IDBStore._dbPromise;
},
async get(key){
return IDBStore._withRetry(async()=>{
const db=await IDBStore._open();
return await new Promise((resolve,reject)=>{
const tx=db.transaction(IDBStore.STORE,'readonly');
const req=tx.objectStore(IDBStore.STORE).get(key);
req.onsuccess=()=>resolve(req.result);
req.onerror=()=>reject(req.error||new Error('Gagal membaca dari IndexedDB'));
});
},'get("'+key+'")',undefined);
},
async set(key,value){
return IDBStore._withRetry(async()=>{
const db=await IDBStore._open();
return await new Promise((resolve,reject)=>{
const tx=db.transaction(IDBStore.STORE,'readwrite');
tx.objectStore(IDBStore.STORE).put(value,key);
tx.oncomplete=()=>resolve(true);
tx.onerror=()=>reject(tx.error||new Error('Gagal menulis ke IndexedDB'));
});
},'set("'+key+'")',false);
},
// BUGFIX: pembungkus retry -- kalau kegagalan disebabkan koneksi yg lagi
// closing/invalid (InvalidStateError, atau nama "closing" khas Safari),
// buang cache _dbPromise & coba SEKALI lagi dgn koneksi baru sebelum
// benar-benar menyerah. Menghindari error IndexedDB numpuk terus tiap
// kali koneksi lama jadi basi (mis. abis hot-reload pas dev).
async _withRetry(fn,label,fallback){
try{
return await fn();
}catch(e){
const staleConn=e&&(e.name==='InvalidStateError'||/closing/i.test(e.message||''));
if(staleConn){
IDBStore._dbPromise=null;
try{ return await fn(); }
catch(e2){ console.error('IndexedDB '+label+' gagal (setelah retry):',e2); return fallback; }
}
console.error('IndexedDB '+label+' gagal:',e);
return fallback;
}
}
};
const PORTFOLIO_LABELS={
nilai:/nilai\s*(sekarang|saat\s*ini)/i,
modal:/modal\s*investasi/i,
hargaBeli:/harga\s*(beli|perolehan)/i,
jumlahUnit:/jumlah\s*unit/i
};
const TimelineW={
avgSurplus(){
if(typeof Pensiun!=='undefined')return Pensiun.avgSurplus();
return{surplus:0,months:0};
},
goals(){
const goals=[];
(D.renovProjects||[]).forEach(p=>{
const t=Renov.totals(p);
if(t.sisa>0)goals.push({key:'renov-'+p.id,emoji:'🔨',label:'Renovasi: '+p.name,remaining:t.sisa,kind:'renov'});
});
(D.targets||[]).forEach(t=>{
if(t.isDanaDarurat)return;
const remaining=Math.max(0,(t.amount||0)-(t.saved||0));
if(remaining>0)goals.push({key:'target-'+t.id,emoji:t.emoji||'🎯',label:t.name,remaining,kind:'target'});
});
return goals;
},
waterfall(){
const{surplus,months}=TimelineW.avgSurplus();
const goals=TimelineW.goals();
let cursor=0;
const rows=goals.map(g=>{
const monthsNeeded=surplus>0?Math.ceil(g.remaining/surplus):null;
const startMonth=cursor;
const endMonth=monthsNeeded!=null?cursor+monthsNeeded:null;
if(endMonth!=null)cursor=endMonth;
return{...g,monthsNeeded,startMonth,endMonth};
});
return{rows,surplus,surplusMonths:months};
},
addMonthsToDate(n){
const d=new Date();
d.setDate(1);
d.setMonth(d.getMonth()+n);
return d;
},
render(){
const card=document.getElementById('timelineWCard');
if(!card)return;
const{rows,surplus,surplusMonths}=TimelineW.waterfall();
const pensiunP=D.pensiun||{};
const pensiunAda=pensiunP.usiaSekarang&&pensiunP.usiaPensiun&&pensiunP.accId;
if(!rows.length&&!pensiunAda){card.style.display='none';return;}
card.classList.remove('u-dnone');card.style.display='block';
let body='';
if(surplus<=0){
body+=`<div class="u-fs12 u-cacc2 u-r10 u-mb10 u-lh15" style="background:var(--accent2-soft);padding:8px 10px">⚠️ Rata-rata ${surplusMonths} bulan terakhir belum surplus (pemasukan ≤ pengeluaran), jadi linimasa di bawah belum bisa diproyeksikan realistis. Perbaiki dulu arus kas bulanan atau isi manual di masing-masing modul.</div>`;
} else {
body+=`<div class="u-fs11 u-t2 u-mb10 u-lh15">Diasumsikan seluruh rata-rata surplus ${surplusMonths} bulan terakhir (${fmtFull(surplus)}/bln) dipakai berurutan sesuai urutan di bawah. Ilustrasi, bukan alokasi otomatis.</div>`;
}
body+=rows.map((r,i)=>{
const dateLabel=(r.endMonth!=null)?TimelineW.addMonthsToDate(r.endMonth).toLocaleDateString('id-ID',{month:'long',year:'numeric'}):'—';
const yrs=r.monthsNeeded!=null?Math.floor(r.monthsNeeded/12):null;
const bln=r.monthsNeeded!=null?r.monthsNeeded%12:null;
const durLabel=r.monthsNeeded!=null?`${yrs?yrs+' th ':''}${bln} bln lagi (mulai bulan ke-${r.startMonth+1})`:'—';
return `<div style="display:flex;gap:10px;margin-bottom:${i===rows.length-1&&!pensiunAda?'0':'12px'}">
        <div class="u-flex u-fdcol u-aic">
          <div class="u-bgaccsoft u-flex u-aic u-jcc u-fs13" style="width:26px;height:26px;border-radius:50%">${r.emoji}</div>
          ${(i<rows.length-1||pensiunAda)?'<div class="u-flex1 u-mt2" style="width:2px;background:var(--border)"></div>':''}
        </div>
        <div class="u-flex1" style="padding-bottom:2px">
          <div class="u-fs13 u-fw700">${escapeHtml(r.label)}</div>
          <div class="u-fs11 u-t2 u-mt2">Sisa ${fmt(r.remaining)} · target selesai ~<b>${dateLabel}</b></div>
          <div class="u-fs11 u-t2">${durLabel}</div>
        </div>
      </div>`;
}).join('');
if(pensiunAda){
const n=Pensiun.sisaBulan();
const years=Math.floor(n/12),sisaBln=n%12;
const target=Number(pensiunP.targetDana)||0;
const proyeksi=Pensiun.proyeksi();
const onTrack=target>0&&proyeksi>=target;
body+=`<div class="u-flex u-gap10">
        <div class="u-flex u-fdcol u-aic">
          <div class="u-flex u-aic u-jcc u-fs13" style="width:26px;height:26px;border-radius:50%;background:var(--accent3-soft)">🏖️</div>
        </div>
        <div class="u-flex1">
          <div class="u-fs13 u-fw700">Pensiun (usia ${pensiunP.usiaSekarang}→${pensiunP.usiaPensiun})</div>
          <div class="u-fs11 u-t2 u-mt2">${years>0?years+' th ':''}${sisaBln} bln lagi · proyeksi dana ${fmt(proyeksi)}${target>0?' dari target '+fmt(target):''}</div>
          <div style="margin-top:1px" class="${onTrack?'green':'orange'} u-fs11 u-fw700">${target>0?(onTrack?'✅ Proyeksi on-track':'⚠️ Proyeksi masih kurang '+fmt(target-proyeksi)):'Isi target di modul Pensiun utk cek gap'}</div>
        </div>
      </div>`;
} else if(!rows.length){
card.style.display='none';return;
}
card.innerHTML=`<div class="card-title">🗺️ Linimasa Tujuan Finansial <span class="card-collapse-toggle" id="timelineWCard-chev" data-action="toggleCardCollapse" data-args='["timelineWCard","$event"]' aria-label="Buka/tutup bagian">▾</span></div><div class="card-collapse-body" id="timelineWCard-cbody">`+body+`</div>`;
applyOneCardCollapsePref('timelineWCard');
}
};

// worthit.js — Domain Worth It? & Prioritas Belanja: cek kondisi keuangan sebelum belanja + daftar prioritas barang yang mau dibeli
// CATATAN: modul WorthIt dipindah ke file baru ini dari features-renovasi-pajak-aset-order.js (v62).
// PENTING: file ini HARUS dimuat sesuai urutan build.js (GROUP_A/GROUP_B) karena beberapa modul saling referensi. Urutan grup ini: pajak-pbb-zakat.js, features-budget-laporan-carnotes-pelanggan.js, edukasi-dana.js, sewakios.js, hidup-seimbang.js, linktx.js, renovasi.js, aset.js, worthit.js

const WorthIt={
open(){
['wiName','wiPrice','wiDP','wiTenor','wiCicilanBulan','wiHargaNormal'].forEach(id=>{document.getElementById(id).value='';});
document.getElementById('wiCategory').value='keinginan';
document.getElementById('wiMethod').value='tunai';
document.getElementById('wiIsDiskon').checked=false;
WorthIt.onMethodChange();
WorthIt.toggleDiskon();
document.getElementById('wiResultBox').style.display='none';
WorthIt._last=null;
WorthIt.switchTab('single');
openModal('worthItModal');
},
switchTab(tab){
const isSingle=tab==='single';
document.getElementById('wiTabSingle').style.display=isSingle?'block':'none';
document.getElementById('wiTabList').style.display=isSingle?'none':'block';
document.getElementById('wiTabBtnSingle').classList.toggle('active',isSingle);
document.getElementById('wiTabBtnList').classList.toggle('active',!isSingle);
if(!isSingle){
WorthIt.cancelEditList();
WorthIt.boughtViewOpen=true;WorthIt.toggleBoughtView();
WorthIt.renderList();
}
},
reset(){
document.getElementById('wiResultBox').style.display='none';
document.getElementById('wiName').focus();
},
onMethodChange(){
const m=document.getElementById('wiMethod').value;
document.getElementById('wiCicilanFields').style.display=m==='cicilan'?'block':'none';
},
toggleDiskon(){
const on=document.getElementById('wiIsDiskon').checked;
document.getElementById('wiDiskonFields').style.display=on?'block':'none';
if(!on)document.getElementById('wiDiskonInfo').innerHTML='';
WorthIt.syncDiskon();
},
syncDiskon(){
const infoEl=document.getElementById('wiDiskonInfo');
if(!document.getElementById('wiIsDiskon').checked){if(infoEl)infoEl.innerHTML='';return;}
const price=parsePzNum(document.getElementById('wiPrice').value);
const normal=parsePzNum(document.getElementById('wiHargaNormal').value);
if(!infoEl)return;
if(normal<=0||price<=0){infoEl.innerHTML='Isi Harga & Harga Normal buat lihat perbandingannya.';return;}
if(normal<=price){infoEl.innerHTML='⚠️ Harga normal harus lebih besar dari harga yang dibayar biar kehitung diskonnya.';return;}
const hemat=normal-price;
const persen=(hemat/normal)*100;
infoEl.innerHTML='💰 Hemat <b>'+fmtFull(hemat)+'</b> ('+persen.toFixed(0)+'% dari harga normal '+fmtFull(normal)+')';
},
incomeAvg(){
const months=FI.effectiveMonths();
const now=new Date();
const from=new Date(now.getFullYear(),now.getMonth()-months+1,1);
const txs=D.transactions.filter(t=>{const d=new Date(t.date);return d>=from&&d<=now;});
return txs.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0)/months;
},
hitung(){
const name=document.getElementById('wiName').value.trim()||'Barang ini';
const price=parsePzNum(document.getElementById('wiPrice').value);
const method=document.getElementById('wiMethod').value;
const cat=document.getElementById('wiCategory').value;
if(price<=0){toast('⚠️ Isi dulu harga barangnya');return;}
const dp=method==='cicilan'?parsePzNum(document.getElementById('wiDP').value):0;
const tenor=method==='cicilan'?(parseInt(document.getElementById('wiTenor').value)||0):0;
const cicilanBulan=method==='cicilan'?parsePzNum(document.getElementById('wiCicilanBulan').value):0;
const totalBayarCicilan=dp+(cicilanBulan*tenor);
const selisihBunga=(method==='cicilan'&&tenor>0&&totalBayarCicilan>0)?Math.max(0,totalBayarCicilan-price):0;
const isDiskon=document.getElementById('wiIsDiskon').checked;
const hargaNormal=isDiskon?parsePzNum(document.getElementById('wiHargaNormal').value):0;
const diskonValid=isDiskon&&hargaNormal>price;
const hematRp=diskonValid?(hargaNormal-price):0;
const hematPersen=diskonValid?(hematRp/hargaNormal)*100:0;
const saldo=totalSaldoAkun();
const surplus=FI.monthlySurplus();
const incAvg=WorthIt.incomeAvg();
const dd=(D.targets||[]).find(t=>t.isDanaDarurat);
const ddPct=(dd&&dd.amount>0)?Math.min(999,Math.round((dd.saved/dd.amount)*100)):null;
const cicilanAktifBulanan=(D.bills||[]).filter(b=>b.kind==='cicilan'&&b.sisaTenor!=null).reduce((s,b)=>s+b.amount,0);
const cicilanBaruBulanan=method==='cicilan'?cicilanBulan:0;
const dsrSesudah=incAvg>0?((cicilanAktifBulanan+cicilanBaruBulanan)/incAvg)*100:null;
const uangKeluarSekarang=method==='cicilan'?dp:price;
const pctSaldoTerkuras=(saldo>0&&uangKeluarSekarang>0)?(uangKeluarSekarang/saldo)*100:0;
const issues=[];
if(ddPct===null){
issues.push({level:'orange',text:'Belum ada Target Keuangan yang ditandai 🚨 Dana Darurat, jadi kondisi keamanan finansialmu belum bisa dicek otomatis di sini. Cek juga secara manual sebelum belanja besar.'});
} else if(ddPct<100){
issues.push({level:cat==='keinginan'?'red':'orange',text:'Dana darurat baru <b>'+ddPct+'%</b> dari target. Idealnya dana darurat penuh dulu sebelum belanja "'+(cat==='keinginan'?'Keinginan':'Kebutuhan')+'".'});
} else {
issues.push({level:'green',text:'Dana darurat sudah <b>'+ddPct+'%</b> dari target. Aman dari sisi ini.'});
}
if(incAvg>0){
if(dsrSesudah>35)issues.push({level:'red',text:'Total cicilan bulanan (termasuk ini) akan jadi <b>'+dsrSesudah.toFixed(0)+'%</b> dari rata-rata income — sudah lewat batas aman 30–35%.'});
else if(dsrSesudah>30)issues.push({level:'orange',text:'Total cicilan bulanan akan jadi <b>'+dsrSesudah.toFixed(0)+'%</b> dari rata-rata income, mendekati batas aman 30–35%.'});
else if(cicilanBaruBulanan>0)issues.push({level:'green',text:'Total cicilan bulanan jadi <b>'+dsrSesudah.toFixed(0)+'%</b> dari rata-rata income, masih di zona aman.'});
} else if(method==='cicilan'){
issues.push({level:'orange',text:'Belum cukup data transaksi pemasukan utk hitung rasio cicilan (DSR) otomatis.'});
}
if(pctSaldoTerkuras>0){
const labelDana=method==='cicilan'?'DP':'harga barang';
if(pctSaldoTerkuras>50)issues.push({level:'red',text:(method==='cicilan'?'DP':'Belanja')+' ini bakal menguras <b>'+pctSaldoTerkuras.toFixed(0)+'%</b> saldo kamu sekarang ('+labelDana+').'});
else if(pctSaldoTerkuras>25)issues.push({level:'orange',text:(method==='cicilan'?'DP':'Belanja')+' ini bakal menguras <b>'+pctSaldoTerkuras.toFixed(0)+'%</b> saldo kamu sekarang ('+labelDana+').'});
else issues.push({level:'green',text:(method==='cicilan'?'DP':'Belanja')+' ini cuma <b>'+pctSaldoTerkuras.toFixed(0)+'%</b> dari saldo kamu, likuiditas masih aman.'});
}
if(method==='tunai'&&surplus>0){
const bulanNabung=Math.ceil(price/surplus);
if(bulanNabung>1)issues.push({level:'orange',text:'Kalau nabung dulu dari surplus bulanan ('+fmtFull(surplus)+'/bln), butuh ≈<b>'+bulanNabung+' bulan</b> baru kekumpul tanpa ganggu saldo sekarang.'});
} else if(method==='tunai'&&surplus<=0){
if((typeof FI!=='undefined'?FI.monthsOfDataAvailable():0)<1){
issues.push({level:'orange',text:'Belum ada data transaksi yang cukup, jadi belum bisa dihitung berapa lama nabung dulu sebelum beli ini.'});
} else {
issues.push({level:'red',text:'Rata-rata pengeluaranmu sekarang lebih besar dari pemasukan (surplus negatif), jadi belum ada "dana lebih" utk belanja tambahan ini.'});
}
}
if(selisihBunga>0){
const pctBunga=(selisihBunga/price)*100;
issues.push({level:pctBunga>15?'red':'orange',text:'Kalau cicilan, kamu bayar ekstra <b>'+fmtFull(selisihBunga)+'</b> ('+pctBunga.toFixed(0)+'% lebih mahal) dibanding tunai.'});
}
if(isDiskon){
if(!diskonValid){
issues.push({level:'orange',text:'Harga Normal belum diisi dengan benar (harus lebih besar dari Harga), jadi diskonnya belum bisa dicek worth it atau enggak.'});
} else if(hematPersen>=30){
issues.push({level:'green',text:'Diskonnya lumayan gede: hemat <b>'+fmtFull(hematRp)+'</b> ('+hematPersen.toFixed(0)+'%) dari harga normal '+fmtFull(hargaNormal)+'. Dari sisi harga, ini worth it — asal memang butuh/mau barangnya.'});
} else if(hematPersen>=10){
issues.push({level:'orange',text:'Diskonnya lumayan: hemat <b>'+fmtFull(hematRp)+'</b> ('+hematPersen.toFixed(0)+'%). Lumayan tapi bukan alasan utama buat beli kalau sebenarnya belum butuh.'});
} else {
issues.push({level:'red',text:'Diskonnya tipis: cuma hemat <b>'+fmtFull(hematRp)+'</b> ('+hematPersen.toFixed(0)+'%) dari harga normal. Hati-hati taktik "diskon palsu" — cek dulu histori harga barang ini (mis. di PriceHistory/CamelCamelCamel/riwayat marketplace) sebelum kepancing checkout.'});
}
}
if(cat==='keinginan'){
issues.push({level:'orange',text:'Kategori "Keinginan" — coba terapkan aturan tunggu 3 hari sebelum benar-benar checkout, sering hasratnya turun sendiri kalau ditunda.'});
}
const redCount=issues.filter(i=>i.level==='red').length;
const orangeCount=issues.filter(i=>i.level==='orange').length;
let verdict,verdictBg,verdictCol;
if(redCount>0){verdict='🔴 TUNDA DULU';verdictBg='var(--accent2-soft)';verdictCol='red';}
else if(orangeCount>=2){verdict='🟡 BISA, TAPI HATI-HATI';verdictBg='var(--accent4-soft)';verdictCol='orange';}
else {verdict='🟢 WORTH IT';verdictBg='var(--accent3-soft)';verdictCol='green';}
const vBox=document.getElementById('wiVerdictBox');
vBox.style.background=verdictBg;
const vEl=document.getElementById('wiVerdict');
vEl.textContent=verdict;
vEl.className=verdictCol;
document.getElementById('wiIssueList').innerHTML=issues.map(i=>{
const icon=i.level==='red'?'⚠️':(i.level==='orange'?'🔸':'✅');
return `<div class="u-flex u-gap8 u-aifs u-fs12 u-lh15 u-mb8"><span>${icon}</span><span class="u-ctext">${i.text}</span></div>`;
}).join('');
document.getElementById('wiResultBox').style.display='block';
WorthIt._last={name,price,method,cat,dp,tenor,cicilanBulan,isDiskon,hargaNormal:diskonValid?hargaNormal:0,hematRp,hematPersen};
},
catatBeli(){
const d=WorthIt._last;
if(!d){toast('⚠️ Cek dulu sebelum mencatat belanja');return;}
closeModal('worthItModal');
openTxModal('expense');
document.getElementById('txNote').value=d.name+(d.isDiskon&&d.hargaNormal>0?' (diskon dari '+fmtFull(d.hargaNormal)+', hemat '+d.hematPersen.toFixed(0)+'%)':'');
const catField=document.getElementById('txCat');
let catGuessed=null;
if(catField&&!catField.value.trim()){
const guessedCat=guessCategoryFromReceiptText(d.name);
if(guessedCat){selectTxCat(guessedCat.name);catGuessed=guessedCat.name;}
}
_txCatLearnSource=d.name;
if(d.method==='cicilan'){
setPayMethod('cicilan');
document.getElementById('txCicilanNama').value=d.name;
document.getElementById('txCicilanTotal').value=String(d.price);
if(d.cicilanBulan>0)document.getElementById('txCicilanPerBulan').value=String(d.cicilanBulan);
document.getElementById('txCicilanTenor').value=String(d.tenor||6);
cicilanLastInput='total';
syncCicilanPreview('total');
toast('✏️ Detail cicilan sudah diisi'+(catGuessed?' (kategori tebakan: '+catGuessed+')':'')+', cek lagi lalu Simpan');
} else {
document.getElementById('txAmt').value=String(d.price);
toast('✏️ Nominal sudah diisi'+(catGuessed?', kategori tebakan: '+catGuessed:', pilih kategori')+' lalu Simpan');
}
},
simpanDulu(){
const d=WorthIt._last;
if(!d){toast('⚠️ Cek dulu sebelum disimpan');return;}
D.wishlist.push({id:uid(),name:d.name,price:d.price,isDiskon:!!(d.isDiskon&&d.hargaNormal>0),hargaNormal:d.hargaNormal||0,cat:d.cat,urgensi:'bisa_nunggu',sudahPunya:false,sudahPunyaAlasan:'',createdAt:new Date().toISOString(),bought:false});
save();
toast('💾 "'+d.name+'" disimpan ke Prioritas Belanja — belum dicatat sebagai belanja, bisa dihapus/edit kapan saja di tab itu');
WorthIt.reset();
WorthIt.switchTab('list');
WorthIt.renderList();
},
toggleDiskonList(){
const on=document.getElementById('wlIsDiskon').checked;
document.getElementById('wlDiskonFields').style.display=on?'block':'none';
if(!on)document.getElementById('wlDiskonInfo').innerHTML='';
WorthIt.syncDiskonList();
},
syncDiskonList(){
const infoEl=document.getElementById('wlDiskonInfo');
if(!document.getElementById('wlIsDiskon').checked){if(infoEl)infoEl.innerHTML='';return;}
const price=parsePzNum(document.getElementById('wlPrice').value);
const normal=parsePzNum(document.getElementById('wlHargaNormal').value);
if(!infoEl)return;
if(normal<=0||price<=0){infoEl.innerHTML='Isi Harga & Harga Normal buat lihat perbandingannya.';return;}
if(normal<=price){infoEl.innerHTML='⚠️ Harga normal harus lebih besar dari harga yang dibayar biar kehitung diskonnya.';return;}
const hemat=normal-price;
const persen=(hemat/normal)*100;
infoEl.innerHTML='💰 Hemat <b>'+fmtFull(hemat)+'</b> ('+persen.toFixed(0)+'% dari harga normal '+fmtFull(normal)+')';
},
toggleSudahPunya(){
const on=document.getElementById('wlSudahPunya').checked;
document.getElementById('wlSudahPunyaAlasanBox').style.display=on?'block':'none';
},
editListId:null,
editListItem(id){
const it=D.wishlist.find(x=>sameId(x.id,id));
if(!it)return;
WorthIt.editListId=id;
document.getElementById('wlName').value=it.name;
document.getElementById('wlPrice').value=String(it.price);
document.getElementById('wlIsDiskon').checked=!!it.isDiskon;
document.getElementById('wlHargaNormal').value=it.isDiskon?String(it.hargaNormal):'';
WorthIt.toggleDiskonList();
WorthIt.syncDiskonList();
document.getElementById('wlCategory').value=it.cat;
document.getElementById('wlUrgensi').value=it.urgensi;
document.getElementById('wlSudahPunya').checked=!!it.sudahPunya;
document.getElementById('wlSudahPunyaAlasan').value=it.sudahPunyaAlasan||'';
WorthIt.toggleSudahPunya();
document.getElementById('wlSubmitBtn').textContent='💾 Simpan Perubahan';
document.getElementById('wlCancelEditBtn').style.display='block';
document.getElementById('wlName').scrollIntoView({behavior:'smooth',block:'center'});
},
cancelEditList(){
WorthIt.editListId=null;
['wlName','wlPrice','wlHargaNormal','wlSudahPunyaAlasan'].forEach(id=>{document.getElementById(id).value='';});
document.getElementById('wlIsDiskon').checked=false;
WorthIt.toggleDiskonList();
document.getElementById('wlCategory').value='keinginan';
document.getElementById('wlUrgensi').value='bisa_nunggu';
document.getElementById('wlSudahPunya').checked=false;
WorthIt.toggleSudahPunya();
document.getElementById('wlSubmitBtn').textContent='+ Tambah ke List';
document.getElementById('wlCancelEditBtn').style.display='none';
},
async addToList(){
const name=document.getElementById('wlName').value.trim();
const price=parsePzNum(document.getElementById('wlPrice').value);
if(!name){toast('⚠️ Isi dulu nama barangnya');return;}
if(price<=0){toast('⚠️ Isi dulu harga barangnya');return;}
if(!WorthIt.editListId){
const dup=(D.wishlist||[]).find(x=>!x.bought&&x.name.trim().toLowerCase()===name.toLowerCase());
if(dup){
if(!await askConfirm(`Barang "${escapeHtml(dup.name)}" (${fmtFull(dup.price)}) udah ada di list Prioritas Belanja. Tetap tambahkan sebagai barang terpisah?`,{title:'Kemungkinan Duplikat',okText:'Ya, Tambahkan Juga'}))return;
}
}
const isDiskon=document.getElementById('wlIsDiskon').checked;
const hargaNormalRaw=isDiskon?parsePzNum(document.getElementById('wlHargaNormal').value):0;
const diskonValid=isDiskon&&hargaNormalRaw>price;
const cat=document.getElementById('wlCategory').value;
const urgensi=document.getElementById('wlUrgensi').value;
const sudahPunya=document.getElementById('wlSudahPunya').checked;
const sudahPunyaAlasan=sudahPunya?document.getElementById('wlSudahPunyaAlasan').value.trim():'';
if(WorthIt.editListId){
const it=D.wishlist.find(x=>sameId(x.id,WorthIt.editListId));
if(it){
Object.assign(it,{name,price,isDiskon:diskonValid,hargaNormal:diskonValid?hargaNormalRaw:0,cat,urgensi,sudahPunya,sudahPunyaAlasan});
save();
toast('✅ "'+name+'" diperbarui');
}
} else {
D.wishlist.push({id:uid(),name,price,isDiskon:diskonValid,hargaNormal:diskonValid?hargaNormalRaw:0,cat,urgensi,sudahPunya,sudahPunyaAlasan,createdAt:new Date().toISOString(),bought:false});
save();
toast('✅ "'+name+'" ditambahkan ke list');
}
WorthIt.cancelEditList();
WorthIt.renderList();
},
computeScore(it){
const reasons=[];
let score=0;
if(it.cat==='kebutuhan'){score+=40;reasons.push({level:'green',text:'🛠️ Ini kebutuhan, bukan sekadar keinginan.'});}
else {score+=10;reasons.push({level:'orange',text:'✨ Ini masih kategori keinginan — coba tunda 3 hari, sering hasratnya turun sendiri.'});}
if(it.urgensi==='mendesak'){score+=30;reasons.push({level:'green',text:'🔥 Mendesak — barang lama sudah rusak/habis atau memang diperlukan segera.'});}
else if(it.urgensi==='bisa_nunggu'){score+=15;reasons.push({level:'orange',text:'⏳ Bisa nunggu — belum darurat, aman ditunda ke gajian berikutnya.'});}
else {reasons.push({level:'red',text:'💭 Nice to have — belum perlu-perlu amat sekarang.'});}
if(it.sudahPunya){
score-=25;
const customText=(it.sudahPunyaAlasan||'').trim();
reasons.push({level:'red',text:customText?('📦 '+escapeHtml(customText)):'📦 Barang lama masih ada & masih bisa dipakai — ini lebih ke ganti karena lebih murah, bukan karena beneran butuh. Justru di sini seringnya "hemat" jadi alasan buat belanja yang sebenarnya belum perlu.'});
}
if(it.isDiskon&&it.hargaNormal>it.price){
const hematRp=it.hargaNormal-it.price;
const hematPersen=(hematRp/it.hargaNormal)*100;
const diskonScore=Math.min(50,hematPersen)*(it.sudahPunya?0.2:0.4);
score+=diskonScore;
if(hematPersen>=30)reasons.push({level:it.sudahPunya?'orange':'green',text:'🏷️ Diskon lumayan gede: hemat '+fmtFull(hematRp)+' ('+hematPersen.toFixed(0)+'%)'+(it.sudahPunya?', tapi tetap perlu diingat barang lama masih jalan.':'.')});
else if(hematPersen>=10)reasons.push({level:'orange',text:'🏷️ Diskon lumayan: hemat '+fmtFull(hematRp)+' ('+hematPersen.toFixed(0)+'%), tapi bukan alasan utama kalau belum butuh.'});
else reasons.push({level:'red',text:'🏷️ Diskon tipis, cuma '+hematPersen.toFixed(0)+'% — hati-hati taktik "diskon palsu".'});
}
const saldo=totalSaldoAkun();
const pctSaldo=(saldo>0)?(it.price/saldo)*100:0;
if(pctSaldo>50){score-=15;reasons.push({level:'red',text:'💸 Harganya bakal menguras >50% saldo kamu sekarang.'});}
else if(pctSaldo>25){score-=7;reasons.push({level:'orange',text:'💸 Harganya cukup besar, ~'+pctSaldo.toFixed(0)+'% dari saldo sekarang.'});}
score=Math.max(0,Math.min(100,Math.round(score)));
return{score,reasons};
},
renderList(){
const box=document.getElementById('wlItems');
const countEl=document.getElementById('wlCount');
const totalEl=document.getElementById('wlTotalSummary');
if(!box)return;
const items=(D.wishlist||[]).filter(it=>!it.bought);
if(!items.length){
countEl.textContent='';
if(totalEl)totalEl.innerHTML='';
box.innerHTML='<div class="u-fs12 u-t2 u-tac" style="padding:20px 0">Belum ada barang di list. Tambahin dulu di atas ya.</div>';
return;
}
const scored=items.map(it=>({it,...WorthIt.computeScore(it)})).sort((a,b)=>b.score-a.score);
countEl.textContent=items.length+' barang';
if(totalEl){
const totalHarga=items.reduce((sum,it)=>sum+(Number(it.price)||0),0);
const saldo=totalSaldoAkun();
const pct=saldo>0?(totalHarga/saldo*100):0;
let warnTxt='';
if(saldo>0&&pct>100)warnTxt=' ⚠️ totalnya lebih besar dari saldo kamu sekarang.';
else if(saldo>0&&pct>50)warnTxt=' ⚠️ ini bakal nguras lebih dari separuh saldo kamu.';
totalEl.innerHTML=`💰 Kalau semua ${items.length} barang dibeli sekaligus: <b>${fmtFull(totalHarga)}</b>`+(saldo>0?` (~${pct.toFixed(0)}% dari saldo ${fmtFull(saldo)})`:'')+warnTxt;
}
box.innerHTML=scored.map((s,i)=>{
const{it,score,reasons}=s;
let badge,badgeCol,badgeBg;
if(score>=70){badge='🟢 Prioritas Tinggi';badgeCol='green';badgeBg='var(--accent3-soft)';}
else if(score>=40){badge='🟡 Prioritas Sedang';badgeCol='orange';badgeBg='var(--accent4-soft)';}
else {badge='🔴 Bisa Ditunda';badgeCol='red';badgeBg='var(--accent2-soft)';}
const diskonInfo=(it.isDiskon&&it.hargaNormal>it.price)?' <span class="u-t2" style="text-decoration:line-through">'+fmtFull(it.hargaNormal)+'</span>':'';
const sudahPunyaBadge=it.sudahPunya?' <span class="u-fs10 u-t2 u-r8" style="background:var(--surface3);padding:1px 6px">📦 masih punya yg lama</span>':'';
return `<div class="card u-mb10" style="padding:14px">
        <div class="u-flex u-jcb u-aifs u-gap8 u-mb6">
          <div class="u-flex u-gap8 u-aifs">
            <div class="u-fw800 u-fs14 u-t2" style="min-width:18px">#${i+1}</div>
            <div><div class="u-fw700 u-fs14">${escapeHtml(it.name)}</div>
            <div class="u-fs12 u-t2 u-mt2">${fmtFull(it.price)}${diskonInfo}${sudahPunyaBadge}</div></div>
          </div>
          <div class="u-flex" style="gap:2px;flex-shrink:0">
            <button class="tx-del" data-action="WorthIt.editListItem" data-args="${escapeHtml(JSON.stringify([it.id]))}" aria-label="Edit">✏️</button>
            <button class="tx-del" data-action="WorthIt.deleteListItem" data-args="${escapeHtml(JSON.stringify([it.id]))}" aria-label="Hapus">🗑</button>
          </div>
        </div>
        <div style="display:inline-block;background:${badgeBg};color:${badgeCol};border-radius:20px;padding:3px 10px;font-size:11px;font-weight:700;margin-bottom:8px">${badge} · ${score}</div>
        <div class="u-mb10">${reasons.map(r=>{
const icon=r.level==='red'?'⚠️':(r.level==='orange'?'🔸':'✅');
return `<div class="u-flex u-gap6 u-aifs u-fs11 u-lh15 u-mb4"><span>${icon}</span><span class="u-ctext">${r.text}</span></div>`;
}).join('')}</div>
        <button class="btn btn-expense btn-full btn-sm" data-action="WorthIt.catatBeliList" data-args="${escapeHtml(JSON.stringify([it.id]))}">✅ Sudah Beli, Catat</button>
      </div>`;
}).join('');
},
deleteListItem(id){
D.wishlist=D.wishlist.filter(x=>!sameId(x.id,id));
save();
if(sameId(WorthIt.editListId,id))WorthIt.cancelEditList();
WorthIt.renderList();
toast('🗑 Dihapus dari list');
},
openLinkTxModal(){
LinkTx.open('wishlist',null);
},
pendingBuyId:null,
catatBeliList(id){
const it=D.wishlist.find(x=>sameId(x.id,id));
if(!it)return;
closeModal('worthItModal');
openTxModal('expense');
WorthIt.pendingBuyId=id;
document.getElementById('txNote').value=it.name+(it.isDiskon&&it.hargaNormal>0?' (diskon dari '+fmtFull(it.hargaNormal)+')':'');
document.getElementById('txAmt').value=String(it.price);
const catField=document.getElementById('txCat');
let catGuessed=null;
if(catField&&!catField.value.trim()){
const guessedCat=guessCategoryFromReceiptText(it.name);
if(guessedCat){selectTxCat(guessedCat.name);catGuessed=guessedCat.name;}
}
_txCatLearnSource=it.name;
toast('✏️ Nominal sudah diisi'+(catGuessed?', kategori tebakan: '+catGuessed:', pilih kategori')+' lalu Simpan — barang baru ditandai "Sudah Beli" setelah transaksi ini disimpan.');
},
applyBuyLink(txId){
if(!WorthIt.pendingBuyId)return;
const it=D.wishlist.find(x=>sameId(x.id,WorthIt.pendingBuyId));
const t=D.transactions.find(x=>x.id===txId);
if(it&&t){
it.bought=true;
it.boughtDate=t.date||new Date().toISOString().split('T')[0];
it.txId=txId;
t.wishlistLinkId=it.id;
}
WorthIt.pendingBuyId=null;
},
onLinkedTxEdited(t){
const it=D.wishlist.find(x=>x.id===t.wishlistLinkId);
if(!it)return;
it.price=t.amount;
it.boughtDate=t.date;
WorthIt.renderList();
WorthIt.renderBoughtList();
},
onLinkedTxDeleted(t){
const it=D.wishlist.find(x=>x.id===t.wishlistLinkId);
if(!it)return;
it.bought=false;it.txId=null;it.boughtDate=null;
WorthIt.renderList();
WorthIt.renderBoughtList();
},
async undoBought(id){
const it=D.wishlist.find(x=>sameId(x.id,id));
if(!it)return;
const linkedTx=it.txId?D.transactions.find(x=>x.id===it.txId):null;
const msg=linkedTx
? `Kembalikan "${escapeHtml(it.name)}" ke daftar belum dibeli? Transaksi pengeluaran ${fmtFull(linkedTx.amount)} yang sudah tercatat di Keuangan TETAP ada (uangnya memang sudah keluar) — hapus manual di Keuangan kalau memang salah catat.`
: `Kembalikan "${escapeHtml(it.name)}" ke daftar belum dibeli?`;
if(!await askConfirm(msg,{title:'Kembalikan ke List',okText:'Ya, Kembalikan'}))return;
if(linkedTx)delete linkedTx.wishlistLinkId;
it.bought=false;it.txId=null;it.boughtDate=null;
save();
WorthIt.renderList();
WorthIt.renderBoughtList();
toast('↺ "'+it.name+'" dikembalikan ke daftar Prioritas Belanja');
},
renderBoughtList(){
const box=document.getElementById('wlBoughtItems');
const countEl=document.getElementById('wlBoughtCount');
if(!box)return;
const items=(D.wishlist||[]).filter(it=>it.bought)
.sort((a,b)=>(b.boughtDate||'').localeCompare(a.boughtDate||''));
if(!items.length){
if(countEl)countEl.textContent='';
box.innerHTML='<div class="u-fs12 u-t2 u-tac" style="padding:16px 0">Belum ada barang yang ditandai sudah dibeli.</div>';
return;
}
if(countEl)countEl.textContent=items.length+' barang';
box.innerHTML=items.map(it=>{
const t=it.txId?D.transactions.find(x=>x.id===it.txId):null;
return `<div class="tx-item">
        <div class="tx-icon" style="background:var(--accent3-soft)">✅</div>
        <div class="tx-info">
          <div class="tx-name">${escapeHtml(it.name)}</div>
          <div class="tx-meta">Dibeli ${it.boughtDate||'?'}${t?' · tercatat di Keuangan':' · transaksi tidak ditemukan'}</div>
        </div>
        <div class="tx-amount">${fmt(it.price)}</div>
        <button class="tx-del" data-action="WorthIt.undoBought" data-args="${escapeHtml(JSON.stringify([it.id]))}" title="Kembalikan ke list" aria-label="Kembalikan ke list">↺</button>
      </div>`;
}).join('');
},
boughtViewOpen:false,
toggleBoughtView(){
WorthIt.boughtViewOpen=!WorthIt.boughtViewOpen;
const activeEl=document.getElementById('wlActiveSection');
const boughtEl=document.getElementById('wlBoughtSection');
const btnEl=document.getElementById('wlBoughtToggleBtn');
if(activeEl)activeEl.style.display=WorthIt.boughtViewOpen?'none':'block';
if(boughtEl)boughtEl.style.display=WorthIt.boughtViewOpen?'block':'none';
if(btnEl)btnEl.textContent=WorthIt.boughtViewOpen?'📋 Lihat List Aktif':'✅ Lihat Sudah Dibeli';
if(WorthIt.boughtViewOpen)WorthIt.renderBoughtList();
}
};
