// features-budget-laporan-carnotes-pelanggan.js — Budget & laporan keuangan, Car Notes (BBM/servis/torsi baut), aksi AI chat, data pelanggan
// PENTING: file ini HARUS dimuat sesuai urutan build.js (GROUP_A/GROUP_B) karena beberapa modul saling referensi. Urutan grup ini: pajak-pbb-zakat.js, features-budget-laporan-carnotes-pelanggan.js, edukasi-dana.js, sewakios.js, hidup-seimbang.js, linktx.js, renovasi.js, aset.js, worthit.js
// CATATAN: MODULE_FEATURES_VERSION, VEHTAX_INPUT_IDS, MY_WRENCH, CHAT_ACTION_LABELS DIPINDAH ke sini dari features-etalase-piutang-renovai.js (file itu dihapus, sisa 3 konstanta kecilnya sudah tidak punya file sendiri lagi — semua ditaruh dekat kode yang benar-benar memakainya di domain ini: VEHTAX_INPUT_IDS dekat VEHTAX_ITEMS, MY_WRENCH dekat modul Torsi, CHAT_ACTION_LABELS dekat CHAT_ACTION_HANDLERS/CHAT_ACTION_EDIT_FIELDS).

const MODULE_FEATURES_VERSION='kw70-split-backup-restore-rename';
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
html+=`<label class="budget-cat-opt"><input type="checkbox" class="budgetCatChk" value="${c.id}" onchange="onBudgetCatChildToggle()"> ${c.icon||''} ${c.name}</label>`;
(c.subs||[]).forEach(s=>{
html+=`<label class="budget-cat-opt sub"><input type="checkbox" class="budgetCatChk" value="${s.id}" onchange="onBudgetCatChildToggle()"> ↳ ${s.icon||''} ${s.name}</label>`;
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
document.getElementById('filterTxTitle').textContent=`${b.icon} ${escapeHtml(b.name)}`;
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
document.getElementById('budgetTabPane-list').style.display=tab==='list'?'':'none';
document.getElementById('budgetTabPane-reko').style.display=tab==='reko'?'':'none';
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
const txId=isEdit?(existing.txLinkId||null):uid();
const result=recordBbmLog({
vehicleId:curVehicleId,date,km,liter,harga,cost,spbu,fullTank,note,accountId:accId,
txId,existingBbmId:isEdit?BBM.editId:null
});
if(isEdit){
if(txId){
const tx=D.transactions.find(t=>t.id===txId);
if(tx)Object.assign(tx,{amount:cost,date,accountId:accId,note:noteFull});
}
toast('✅ Catatan BBM diperbarui');
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
return{cat,lastKm,intervalKm,overridden,sisa,pct,col,msg};
}).sort((a,b)=>a.sisa-b.sisa);
card.innerHTML=`<div class="card-title">🔔 Pengingat Servis per Part <span class="card-collapse-toggle" id="servisReminderCard-chev" data-action="toggleCardCollapse" data-args='["servisReminderCard","$event"]' aria-label="Buka/tutup bagian">▾</span></div><div class="card-collapse-body" id="servisReminderCard-cbody">`+rows.map(r=>`
      <div class="u-mb12">
        <div class="u-flex u-jcb u-aic u-fs12 u-mb4 u-pointer" data-action="editSparepartFromReminder" data-args="${escapeHtml(JSON.stringify([r.cat.id]))}" title="Tap untuk edit kategori (berlaku semua kendaraan)">
          <span class="u-fw700">${escapeHtml(r.cat.name)} <span class="u-fs11 u-t2">✏️</span></span>
          <span class="${r.col} u-fw700">${r.msg}</span>
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
