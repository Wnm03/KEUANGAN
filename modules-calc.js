
const MODULE_CALC_VERSION='kw70-tukang-riwayat-absensi-18';
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
const sisaCicilan=(typeof getBillStats==='function'?getBillStats().outstanding:0)||0;
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
const utang=utangManual+totalDebtValue();
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