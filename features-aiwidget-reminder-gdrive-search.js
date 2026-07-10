// features-aiwidget-reminder-gdrive-search.js — Reminder, hari kerja, kendaraan (pajak/SIM/servis/BBM/sparepart), storage & arsip, skema Google Sheets (SHEETS_SCHEMAS/SHEETS_MODULES)
// CATATAN: SHEETS_SCHEMAS dipindah dari features-edukasi-pajak-utang-sewakios.js (v57) — ditaruh tepat sebelum SHEETS_MODULES yg sudah lebih dulu di sini & sama-sama dipakai fungsi sheetsHeaderFor()/sheetsLastColFor() di file ini juga. Ini satu2nya file yang memakai SHEETS_SCHEMAS.
// PENTING: file ini HARUS dimuat sesuai urutan build.js (GROUP_A/GROUP_B) karena beberapa modul saling referensi. Urutan grup ini: features-helpers-global-security.js, diagnostik-versi.js, format-tema.js, error-handler.js, helper-teks.js, keamanan-pin.js, modal-navigasi.js, reset-gaji-mingguan.js, debug-console.js, pengaturan-search.js, onboarding.js, kalkulator-input.js, scan-ocr.js, akun.js, gaji-calc.js, transaksi.js, profil-pengaturan.js, kategori.js, tagihan-kalender.js, backup-restore.js, payroll-absensi.js, features-tukang-kendaraan-storage.js, features-aiwidget-reminder-gdrive-search.js, features-sheets-pwa-selftest.js

/* moved to modules-render.js: renderChatActionBubble */
function chatActionEditFormHTML(actionId,type,data){
const fields=CHAT_ACTION_EDIT_FIELDS[type]||[];
const rows=fields.map(f=>{
const val=data[f.key]!=null?data[f.key]:'';
const id=`chatActionEdit_${actionId}_${f.key}`;
if(f.type==='select'){
const opts=typeof f.options==='function'?f.options():f.options;
return `<div class="fg u-mb6"><label class="fl u-fs11">${escapeHtml(f.label)}</label><select class="fi" id="${id}">${opts.map(([v,l])=>`<option value="${escapeHtml(String(v))}" ${sameId(v,val)?'selected':''}>${escapeHtml(l)}</option>`).join('')}</select></div>`;
}
return `<div class="fg u-mb6"><label class="fl u-fs11">${escapeHtml(f.label)}</label><input class="fi" id="${id}" type="${f.type}" value="${escapeHtml(String(val))}"></div>`;
}).join('');
return `<div class="u-fw700 u-mb6">✏️ Edit ${CHAT_ACTION_LABELS[type]||''}</div>
    ${rows}
    <div class="u-flex u-gap8 u-mt4">
      <button class="btn btn-primary btn-sm" data-action="saveChatActionEdit" data-args="${escapeHtml(JSON.stringify([actionId]))}">💾 Simpan Perubahan</button>
      <button class="btn btn-ghost btn-sm" data-action="cancelChatActionEdit" data-args="${escapeHtml(JSON.stringify([actionId]))}">↩️ Batal Edit</button>
    </div>`;
}
function editChatAction(actionId){
const pending=_pendingChatActions[actionId];
const el=document.getElementById('chatAction_'+actionId);
if(!pending||!el)return;
el.innerHTML=chatActionEditFormHTML(actionId,pending.type,pending.data);
}
function saveChatActionEdit(actionId){
const pending=_pendingChatActions[actionId];
const el=document.getElementById('chatAction_'+actionId);
if(!pending||!el)return;
const fields=CHAT_ACTION_EDIT_FIELDS[pending.type]||[];
const newData={...pending.data};
fields.forEach(f=>{
const inputEl=document.getElementById(`chatActionEdit_${actionId}_${f.key}`);
if(!inputEl)return;
let v=inputEl.value;
if(f.type==='number')v=(v===''?undefined:Number(v));
newData[f.key]=v;
});
pending.data=newData;
el.innerHTML=chatActionInnerHTML(actionId,pending.type,newData);
}
function cancelChatActionEdit(actionId){
const pending=_pendingChatActions[actionId];
const el=document.getElementById('chatAction_'+actionId);
if(!pending||!el)return;
el.innerHTML=chatActionInnerHTML(actionId,pending.type,pending.data);
}
function confirmChatAction(actionId){
const pending=_pendingChatActions[actionId];
const el=document.getElementById('chatAction_'+actionId);
if(!pending||!el)return;
try{
const msg=CHAT_ACTION_HANDLERS[pending.type](pending.data);
el.innerHTML=`<div class="u-fw700">✅ Tersimpan</div><div class="u-fs13 u-t2">${escapeHtml(msg)}</div>`;
toast('✅ Tersimpan dari chat AI');
}catch(e){
el.innerHTML=`<div class="u-fw700" style="color:#ff5050">⚠️ Gagal: ${escapeHtml(e.message||'Terjadi kesalahan')}</div>`;
}
delete _pendingChatActions[actionId];
}
function cancelChatAction(actionId){
const el=document.getElementById('chatAction_'+actionId);
if(el)el.innerHTML='<div class="u-t2">❌ Dibatalkan</div>';
delete _pendingChatActions[actionId];
}
function initChat(){
if(chatInited)return;chatInited=true;
let html='<div class="chat-bubble ai">Halo W! 👋 Saya AI asisten pribadi Anda. Saya sudah baca semua data: keuangan, perkembangan anak, kendaraan (KM, BBM, servis), absensi/gaji, dan bisnis shop. Tanya apa saja!</div>';
try{
const reminders=getProactiveReminders();
if(reminders.length){
const list=reminders.map(r=>`• ${escapeHtml(r)}`).join('<br>');
html+=`<div class="chat-bubble ai">📋 <b>Sebelum lanjut, ada yang perlu diperhatikan nih:</b><br>${list}</div>`;
}
}catch(e){console.error('Gagal cek reminder proaktif:',e);}
document.getElementById('chatBox').innerHTML=html;
}
function aiQ(q){document.getElementById('chatInput').value=q;sendChat();}
async function sendChat(){
if(_saveGuards['chat'])return;
const btn=document.getElementById('chatSendBtn');
_saveGuards['chat']=true;
if(btn){btn.disabled=true;btn.style.opacity='0.5';}
try{
await _sendChatInner();
} finally {
_saveGuards['chat']=false;
if(btn){btn.disabled=false;btn.style.opacity='';}
}
}
async function _sendChatInner(){
const input=document.getElementById('chatInput');
const msg=input.value.trim();if(!msg)return;
input.value='';
const box=document.getElementById('chatBox');
box.innerHTML+=`<div class="chat-bubble user">${escapeHtml(msg)}</div>`;
const loading=document.createElement('div');loading.className='chat-bubble ai';loading.textContent='⏳ Menganalisa data Anda...';box.appendChild(loading);box.scrollTop=box.scrollHeight;
const now=new Date(),m=now.getMonth(),y=now.getFullYear();
const txM=D.transactions.filter(t=>{const d=new Date(t.date);return d.getMonth()===m&&d.getFullYear()===y;});
const inc=txM.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
const exp=txM.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
const cobekTotal=D.cobek.reduce((s,t)=>s+t.profit,0);
const targetInfo=D.targets.map(t=>`${escapeHtml(t.name)}: ${Math.round((t.saved/t.amount)*100)}%`).join(', ')||'Belum ada';
const eduFundInfo=(D.eduFunds||[]).map(f=>{const c=EduFund.calc(f);const pct=c.fv>0?Math.round((c.terkumpul/c.fv)*100):0;return `${escapeHtml(f.name)} (target ${f.tahunTarget}): butuh ${fmtFull(c.fv)}, terkumpul ${pct}%, nabung ~${fmtFull(c.pmtBulanan)}/bln`;}).join('; ')||'Belum ada';
const sewaKiosInfo=((D.sewaKios&&D.sewaKios.units)||[]).map(u=>`${escapeHtml(u.name)}: ${u.status==='disewa'?'disewa oleh '+(u.penyewa||'-')+' @'+fmtFull(u.hargaSewaBulanan||0)+'/bln':'kosong'}`).join('; ')||'Belum ada unit';
const renovInfo=(D.renovProjects||[]).map(p=>{const items=p.items||[];const total=items.reduce((s,i)=>s+(i.harga||0),0);const paid=items.filter(i=>i.paid).reduce((s,i)=>s+(i.harga||0),0);return `${escapeHtml(p.name)}: ${fmtFull(paid)}/${fmtFull(total)} terbayar (${items.length} item)`;}).join('; ')||'Belum ada proyek';
const debtInfo=(D.debts||[]).filter(d=>!d.lunas).map(d=>`${escapeHtml(d.name)}: ${fmtFull(d.nilai)}${d.jatuhTempo?', JT '+d.jatuhTempo:''}`).join('; ')||'Tidak ada utang aktif';
const piutangInfo=(D.piutang||[]).filter(p=>!p.lunas).map(p=>`${escapeHtml(p.name)}: ${fmtFull(p.nilai)}`).join('; ')||'Tidak ada piutang aktif';
const pensiunInfo=D.pensiun&&D.pensiun.aktif?`Target ${fmtFull(D.pensiun.targetDana||0)} di usia ${D.pensiun.usiaPensiun}, kontribusi ${fmtFull(D.pensiun.kontribusiBulanan||0)}/bln`:'Belum diatur';
const billInfo=D.bills.map(b=>`${escapeHtml(b.name)} (${b.kind}): ${fmtFull(b.amount)}, jatuh tempo ${b.nextDue}`).join('; ')||'Tidak ada';
const accInfo=D.accounts.map(a=>`${escapeHtml(a.name)}: ${fmtFull(recalcAccBalance(a.id))}`).join(', ');
const katMap={};
D.transactions.filter(t=>new Date(t.date)>=new Date(y,m-2,1)).forEach(t=>{if(!katMap[t.category])katMap[t.category]={inc:0,exp:0};if(t.type==='income')katMap[t.category].inc+=t.amount;else katMap[t.category].exp+=t.amount;});
const anakInfo=D.catatan.anak.slice(-3).map(c=>c.text||c.note||JSON.stringify(c)).join('; ')||'Belum ada catatan';
const msDone=D.milestones.filter(Boolean).length;
const msgLower=msg.toLowerCase();
const mentionsAny=(...kws)=>kws.some(k=>msgLower.includes(k));
const wantVehicleDetail=mentionsAny('motor','mobil','kendaraan','stnk','bbm','bensin','servis','oli','ban','plat','sim ','pajak kendaraan','uji kelayakan','bengkel','km ','kilometer',...D.vehicles.map(v=>v.name.toLowerCase()));
const vehicleInfoFull=D.vehicles.map(v=>{
const curKm=getVehicleKm(v.id);
const bbmV=[...D.bbmLogs.filter(b=>b.vehicleId===v.id)].sort((a,b)=>new Date(a.date)-new Date(b.date));
const totalBbmCost=bbmV.reduce((s,b)=>s+b.cost,0);
const totalLiter=bbmV.reduce((s,b)=>s+(b.liter||0),0);
const fullFills=bbmV.filter(b=>b.fullTank&&b.km);
let avgKmL=null;
if(fullFills.length>=2){
const pairs=[];for(let i=1;i<fullFills.length;i++){const kmDiff=fullFills[i].km-fullFills[i-1].km;const lit=fullFills[i].liter;if(kmDiff>0&&lit>0)pairs.push(kmDiff/lit);}
if(pairs.length)avgKmL=(pairs.reduce((s,v)=>s+v,0)/pairs.length).toFixed(1);
}
const bbmThisMonth=bbmV.filter(b=>{const d=new Date(b.date);return d.getMonth()===m&&d.getFullYear()===y;});
const bbmThisMonthCost=bbmThisMonth.reduce((s,b)=>s+b.cost,0);
const bbmSummary=`BBM: total ${totalLiter.toFixed(1)}L / ${fmtFull(totalBbmCost)} all-time, bulan ini ${fmtFull(bbmThisMonthCost)}, rata² ${avgKmL?avgKmL+' km/L':'belum cukup data'}, KM sekarang ${curKm.toLocaleString('id-ID')}`;
const servisV=D.servisLogs.filter(s=>s.vehicleId===v.id);
const totalServisV=servisV.reduce((s,x)=>s+(x.cost||0),0);
const servisVDetail=[...servisV].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,5).map(s=>`${s.item} ${s.date}${s.km?' @'+s.km.toLocaleString('id-ID')+'km':''} (${fmtFull(s.cost)})`).join('; ')||'belum ada';
const sparepartStatus=D.sparepartCats.map(cat=>{
const lastKm=getLastServiceKmForCat(v.id,cat);
const intervalKm=getEffectiveIntervalKm(v.id,cat);
const sisa=intervalKm-(lastKm===null?curKm:curKm-lastKm);
const status=sisa<=0?`❌ LEWAT ${Math.abs(sisa).toLocaleString('id-ID')}km`:sisa<=500?`⚠️ sisa ${sisa.toLocaleString('id-ID')}km`:`✅ sisa ${sisa.toLocaleString('id-ID')}km`;
return `${cat.name}: ${status}`;
}).join(', ');
const servisSummary=`Servis: total biaya ${fmtFull(totalServisV)}, 5 terakhir: [${servisVDetail}], status interval: ${sparepartStatus||'belum ada kategori servis'}`;
const jalanV=D.jalanLogs.filter(j=>j.vehicleId===v.id);
const totalKmJalan=jalanV.reduce((s,j)=>s+(j.jarak||0),0);
const jalanSummary=jalanV.length?`Perjalanan: ${jalanV.length} tercatat, total ${totalKmJalan.toLocaleString('id-ID')}km, 3 terakhir: ${[...jalanV].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,3).map(j=>`${j.rute}${j.jarak?' ('+j.jarak+'km)':''}`).join(', ')}`:'Perjalanan: belum ada catatan';
return `\n${v.emoji} ${v.name} (${v.type||'kendaraan'}):\n  ${bbmSummary}\n  ${servisSummary}\n  ${jalanSummary}`;
}).join('\n')||'Belum ada kendaraan terdaftar';
const vehicleInfoCompact=D.vehicles.length?D.vehicles.map(v=>{
const curKm=getVehicleKm(v.id);
const bbmThisMonthCost=D.bbmLogs.filter(b=>{if(b.vehicleId!==v.id)return false;const d=new Date(b.date);return d.getMonth()===m&&d.getFullYear()===y;}).reduce((s,b)=>s+b.cost,0);
return `${v.emoji} ${v.name}: KM ${curKm.toLocaleString('id-ID')}, BBM bulan ini ${fmtFull(bbmThisMonthCost)}`;
}).join(' | '):'Belum ada kendaraan terdaftar';
const vehicleInfo=wantVehicleDetail?vehicleInfoFull:vehicleInfoCompact+' (ringkasan — detail BBM/servis/perjalanan per unit tersedia, tanya lebih spesifik kalau perlu)';
const wantSparepartDetail=mentionsAny('sparepart','spare part','gudang','stok part','stok sparepart');
const stockSparepartLow=D.partsStock.filter(p=>p.qty<=(p.minStock||1)).map(p=>`${escapeHtml(p.name)} (sisa ${p.qty}${p.unit?' '+p.unit:''})`).join(', ')||'Aman semua';
const stockSparepartAllFull=D.partsStock.length?D.partsStock.map(p=>`${escapeHtml(p.name)}: ${p.qty}${p.unit?' '+p.unit:''}`).join(', '):'Belum ada stok sparepart';
const stockSparepartAll=wantSparepartDetail?stockSparepartAllFull:(D.partsStock.length?`${D.partsStock.length} item tercatat (ringkasan — tanya lebih spesifik utk detail per item)`:'Belum ada stok sparepart');
const wantCobekDetail=mentionsAny('cobek','produk','stok','etalase','produsen','supplier','batu','harga jual','hpp');
const cobekProdukStokFull=D.products.length?D.products.map(p=>`${escapeHtml(p.name)} — stok ${p.stock}, harga jual ${fmtFull(p.hargaJual)}, HPP ${fmtFull(p.hargaBeli)}${cobekKategoriName(p.kategoriId)?', kategori '+cobekKategoriName(p.kategoriId):''}${p.produsenId?', produsen '+((D.produsen.find(pr=>pr.id===p.produsenId)||{}).name||''):''}`).join('; '):'Belum ada produk di etalase';
const cobekProdukStok=wantCobekDetail?cobekProdukStokFull:(D.products.length?`${D.products.length} produk terdaftar (ringkasan — tanya lebih spesifik utk detail per produk)`:'Belum ada produk di etalase');
const cobekLowStok=D.products.filter(p=>p.stock<=2).map(p=>p.name).join(', ')||'Aman';
const cobekProdusenInfo=wantCobekDetail?(D.produsen.length?D.produsen.map(pr=>pr.name+(pr.contact?' ('+pr.contact+')':'')).join(', '):'Belum ada produsen tercatat'):`${D.produsen.length} produsen tercatat`;
const cobekOmzet=D.cobek.reduce((s,t)=>s+(t.total||0),0);
const cobekThisMonth=D.cobek.filter(t=>{const d=new Date(t.date);return d.getMonth()===m&&d.getFullYear()===y;});
const cobekOmzetThisMonth=cobekThisMonth.reduce((s,t)=>s+(t.total||0),0);
const cobekUntungThisMonth=cobekThisMonth.reduce((s,t)=>s+(t.profit||0),0);
const budgetInfo=D.budgets&&D.budgets.length?D.budgets.map(b=>{
const used=D.transactions.filter(t=>{const d=new Date(t.date);return d.getMonth()===m&&d.getFullYear()===y&&budgetMatchesTx(b,t);}).reduce((s,t)=>s+t.amount,0);
const pct=b.limit>0?Math.round(used/b.limit*100):0;
return `${b.icon} ${escapeHtml(b.name)}: anggaran ${fmtFull(b.limit)}, terpakai ${fmtFull(used)} (${pct}%)${pct>=100?' ❌ OVER BUDGET':pct>=80?' ⚠️ hampir habis':''}`;
}).join('\n'):'Belum ada anggaran yang diatur';
const whThisMonth=D.workDays.filter(w=>{const d=new Date(w.date);return d.getMonth()===m&&d.getFullYear()===y;});
const whAllTime=D.workDays.length;
const gajiThisMonth=whThisMonth.reduce((s,w)=>s+(w.total||0),0);
const gajiAbsensi=whThisMonth.length?`${whThisMonth.length} hari kerja bulan ini, estimasi gaji ${fmtFull(gajiThisMonth)} | Total semua waktu: ${whAllTime} hari tercatat`:'Belum ada absensi bulan ini';
const pz=D.pajakZakat;
const zpWajib=inc>=pz.nisabPenghasilanBulan;
const zpJumlah=zpWajib?Math.round(inc*0.025):0;
const zpInfo=`Zakat Penghasilan bulan ini: pemasukan ${fmtFull(inc)} vs nisab ${fmtFull(pz.nisabPenghasilanBulan)} → ${zpWajib?'✅ WAJIB zakat '+fmtFull(zpJumlah):'⬜ belum wajib (di bawah nisab)'}`;
const asetZakatable=(D.assets||[]).filter(a=>a.zakatable).reduce((s,a)=>s+(a.nilai||0),0);
const totalHartaZakat=Math.max(0,totalSaldoAkun()+asetZakatable-(pz.utangJT||0)-totalDebtValue());
const nisabMaal=85*pz.hargaEmasPerGram;
const cukupNisabMaal=totalHartaZakat>=nisabMaal;
let haulInfo='belum mencapai nisab';
let haulOk=false;
if(cukupNisabMaal){
if(!pz.haulMaalMulai) haulInfo='baru capai nisab, haul belum mulai dihitung';
else{ const hari=Math.floor((new Date()-new Date(pz.haulMaalMulai))/86400000); haulOk=hari>=354; haulInfo=haulOk?`sudah haul (${hari} hari sejak ${pz.haulMaalMulai})`:`haul berjalan ${hari}/354 hari`; }
}
const zmJumlah=(cukupNisabMaal&&haulOk)?Math.round(totalHartaZakat*0.025):0;
const zmInfo=`Zakat Maal: harta bersih ${fmtFull(totalHartaZakat)} vs nisab 85gr emas ${fmtFull(nisabMaal)} → ${(cukupNisabMaal&&haulOk)?'✅ WAJIB zakat '+fmtFull(zmJumlah):'⬜ belum wajib'} (${haulInfo})`;
const zakatLogInfo=(pz.zakatLog||[]).slice(0,3).map(l=>`${l.jenis} ${l.tanggal} ${fmtFull(l.jumlah)}`).join('; ')||'Belum ada riwayat pembayaran';
const vehTaxInfo=D.vehicles.map(v=>{
const items=Object.entries(VEHTAX_ITEMS).map(([,cfg])=>`${cfg.label.replace(/^\S+\s/,'')}: ${dateStatusBadge(v[cfg.tglKey]).label}`).join(', ');
return `${v.name} — ${items}`;
}).join(' | ')||'Belum ada kendaraan';
const simInfo=(D.simList||[]).length?D.simList.map(s=>`${s.nama} (${s.jenis}): ${dateStatusBadge(s.tglAkhir).label}`).join(', '):'Belum ada data SIM';
const pbbBumi=parsePzNum(document.getElementById('pbbNjopBumi')?.value||0);
const pbbBangunan=parsePzNum(document.getElementById('pbbNjopBangunan')?.value||0);
let pbbInfo='Belum diisi kalkulator PBB';
if(pbbBumi+pbbBangunan>0){
const kenaPajak=Math.max(0,(pbbBumi+pbbBangunan)-pz.pbb.njoptkp);
const terutang=Math.round(kenaPajak*(pz.pbb.tarifPersen/100));
pbbInfo=`NJOP total ${fmtFull(pbbBumi+pbbBangunan)} → PBB terutang ${fmtFull(terutang)}/tahun`;
}
const pphBrutoBulan=parsePzNum(document.getElementById('pphBruto')?.value||0);
let pphInfo='Belum diisi kalkulator PPh 21';
if(pphBrutoBulan>0){
const pphStatusVal=document.getElementById('pphStatus')?.value||'TK0';
const pphIuranBulan=parsePzNum(document.getElementById('pphIuran')?.value||0);
const brutoSetahun=pphBrutoBulan*12;
const biayaJabatan=Math.min(brutoSetahun*0.05,6000000);
const neto=Math.max(0,brutoSetahun-biayaJabatan-pphIuranBulan*12);
const pkp=Math.max(0,Math.floor((neto-getPTKP(pphStatusVal))/1000)*1000);
const{pajak}=hitungPPh21Progresif(pkp);
pphInfo=`PPh 21 setahun ${fmtFull(pajak)} (≈${fmtFull(Math.round(pajak/12))}/bulan), status ${pphStatusVal}`;
}
const umkmPajakBulan=Math.round(cobekOmzetThisMonth*0.005);
const wantAsetDetail=mentionsAny('aset','harta','kekayaan','emas','tanah','rumah','investasi','net worth','netword','zakatable','portofolio','portfolio','kripto','crypto','saham','reksadana','untung','rugi','cuan','profit','loss','performa');
const totalAsetNilai=totalAssetValue();
const asetListInfoFull=(D.assets||[]).length?D.assets.map(a=>{
let s=`${escapeHtml(a.name)} (${a.jenis}${a.zakatable?', zakatable':''}): nilai saat ini ${fmtFull(a.nilai)}`;
if(a.modalInvestasi){
const pct=a.keuntunganPct;
s+=`, modal investasi ${fmtFull(a.modalInvestasi)}, untung/rugi ${a.keuntungan>=0?'+':''}${fmtFull(a.keuntungan)} (${pct>=0?'+':''}${pct.toFixed(2)}%)`;
}
if(a.jumlahUnit!=null)s+=`, jumlah unit ${a.jumlahUnit}`;
if(a.hargaBeli!=null)s+=`, harga beli/unit ${a.hargaBeli}`;
return s;
}).join('; '):'Belum ada aset tercatat';
const asetListInfo=wantAsetDetail?asetListInfoFull:((D.assets||[]).length?`${D.assets.length} aset tercatat (ringkasan — tanya lebih spesifik utk detail per aset)`:'Belum ada aset tercatat');
const netWorth=totalSaldoAkun()+totalAsetNilai-(pz.utangJT||0)-totalDebtValue();
let fiInfo='Belum ada data transaksi yang cukup untuk hitung Kebebasan Finansial.';
try{
if(typeof fiGetAssumptions==='function'&&D.transactions&&D.transactions.length){
const{swr,ret,inf}=fiGetAssumptions();
const fiTarget=fiTargetNominal();
const fiAsetBersih=fiNetAssetFund();
const fiUtang=fiTotalDebt();
const fiSurplus=fiMonthlySurplus();
const fiAnnualExp=fiAnnualExpense();
const monthsToGo=fiEstimateMonthsToTarget();
const progPct=fiTarget>0?Math.min(999,Math.round(fiAsetBersih/fiTarget*100)):0;
const scope=(D.finansialFreedom&&D.finansialFreedom.assetScope==='semua')?'semua aset tercatat':'aset investasi/zakatable saja (bukan rumah tinggal/kendaraan pakai sehari-hari)';
fiInfo=`Target FI (${(100/swr).toFixed(1)}x pengeluaran tahunan, SWR ${swr}%): ${fmtFull(fiTarget)} (pengeluaran tahunan acuan ${fmtFull(fiAnnualExp)}). Dana FI saat ini (${scope}, dikurangi utang ${fmtFull(fiUtang)}): ${fmtFull(fiAsetBersih)} → progress ${progPct}%. Surplus/bulan (pemasukan-pengeluaran rata-rata): ${fmtFull(fiSurplus)}. Asumsi Return ${ret}%/th, Asumsi Inflasi ${inf}%/th (return riil ${((( 1+ret/100)/(1+inf/100)-1)*100).toFixed(1)}%/th, dipakai supaya target & estimasi tetap dlm nilai uang hari ini). Estimasi waktu capai FI dgn asumsi ini: ${monthsToGo===0?'🎉 sudah tercapai':monthsToGo===null?'>100 tahun (surplus/return kurang, atau minus)':fiFormatMonths(monthsToGo)}.`;
}
}catch(e){ console.warn('Gagal hitung ringkasan FI utk konteks chat AI:',e); }
const systemPrompt=`Kamu adalah PENASIHAT KEUANGAN PRIBADI sekaligus asisten all-in-one untuk ${D.profile.nama||'W'}, pria Indonesia kerja di toko mebel Borobudur, LDR dengan keluarga di Pekalongan.

PERANMU:
- Penasihat keuangan yang jujur, analitis, dan peduli — kasih saran nyata, bukan basa-basi
- Bantu analisa pengeluaran, tren, efisiensi, dan peluang hemat/cuan
- GAYA NGOBROL: santai & akrab banget, kayak ngobrol sama sahabat sendiri lewat WhatsApp — BUKAN gaya customer service atau laporan formal. Pakai bahasa sehari-hari yang ringan, boleh sesekali pakai emoji secukupnya (jangan berlebihan), hindari kata-kata kaku/baku/korporat kayak "Berdasarkan data yang tersedia..." atau "Dapat disimpulkan bahwa...".
- FORMAT JAWABAN: langsung ke poin-poin penting pakai bullet (• atau -), JANGAN nulis paragraf panjang bertele-tele. Buka dengan 1 kalimat singkat kalau perlu konteks, terus langsung poin-poin utamanya — tiap poin singkat & padat, angka/data penting ditulis jelas. Kalau ujungnya perlu kesimpulan/saran, kasih 1 baris penutup singkat, bukan paragraf.
- Tetap LENGKAP dan TUNTAS — jangan potong di tengah, jangan skip bagian pertanyaan yang belum kejawab — tapi rangkumnya padat, hindari basa-basi yang cuma buang-buang waktu baca.
- Tidak ada batas kata, tapi utamakan singkat, jelas, to the point dibanding panjang & muter-muter.
- CATATAN DATA: beberapa bagian (kendaraan/produk cobek/sparepart/aset) ditampilkan RINGKAS kalau pertanyaan user tidak spesifik menyinggung topik itu — supaya hemat. Kalau user tanya lebih detail soal salah satu topik itu, dia akan otomatis dapat versi lengkap di pertanyaan berikutnya (tidak perlu kamu minta dia ganti prompt, cukup jawab dari ringkasan yang ada, atau bilang "tanya lebih spesifik ya" kalau datanya belum cukup).
- USUL AKSI (opsional): kalau dari obrolan JELAS user mau MENCATAT sesuatu yang konkret (bukan cuma nanya/curhat) — misal "catat aku abis beli bensin 50rb", "tambahin tagihan listrik 200rb jatuh tempo tgl 20", "servis motor kemarin ganti oli 80rb", "target nabung liburan 5jt", "catat anak udah bisa jalan hari ini", "masukin kampas rem 150rb ke wishlist/prioritas belanja" — tutup balasanmu dengan SATU blok persis format ini (di baris baru, setelah teks normal, JANGAN taruh di tengah kalimat):
[[ACTION]]{"type":"<salah satu: add_transaksi|add_tagihan|add_servis|add_target|add_catatan_anak|add_wishlist>","data":{...}}[[/ACTION]]
  Field per tipe:
  • add_transaksi: {type:"income"|"expense", amount:number, category:string, subcategory?:string, note?:string, date?:"YYYY-MM-DD"}
  • add_tagihan: {name:string, amount:number, nextDue:"YYYY-MM-DD", freq?:"bulanan"|"tahunan"|"sekali", category?:string, note?:string}
  • add_servis: {vehicleName:string, item:string, cost:number, date?:"YYYY-MM-DD", km?:number, note?:string}
  • add_target: {name:string, amount:number, saved?:number, emoji?:string}
  • add_catatan_anak: {text:string, date?:"YYYY-MM-DD"}
  • add_wishlist: {name:string, price:number, cat?:"kebutuhan"|"keinginan", urgensi?:"mendesak"|"bisa_nunggu"|"nice_to_have", hargaNormal?:number (isi kalau lagi diskon, harus > price), sudahPunya?:boolean, sudahPunyaAlasan?:string} — INI CUMA nambah rencana belanja ke daftar Prioritas Belanja, BUKAN mencatat transaksi/pengeluaran nyata. Kalau user bilang sudah BELI barangnya (bukan sekadar berencana), pakai add_transaksi biasa, bukan add_wishlist.
  JSON harus valid (pakai tanda kutip ganda, tanpa komentar, TANPA trailing comma). MAKSIMAL 1 blok ACTION per balasan. JANGAN pakai blok ini kalau user cuma nanya/minta saran/analisa — itu murni dijawab teks biasa. Data BELUM tersimpan begitu kamu kirim blok ini — sistem akan tampilkan tombol konfirmasi ke user dulu, jangan bilang "sudah kucatat" seolah-olah sudah pasti tersimpan, cukup bilang "cek & konfirmasi tombol di bawah ya". PENTING: kalimat "cek & konfirmasi tombol di bawah" HANYA boleh kamu tulis kalau blok [[ACTION]]...[[/ACTION]] beneran ada persis di balasanmu (lengkap dgn tag pembuka & penutup, JSON valid) — jangan pernah janji ada tombol kalau blok-nya nggak kamu sertakan, itu bikin user bingung karena tombolnya nggak akan muncul.

DATA KEUANGAN BULAN INI (${new Date().toLocaleString('id-ID',{month:'long',year:'numeric'})}):
Pemasukan: ${fmtFull(inc)} | Pengeluaran: ${fmtFull(exp)} | Bersih: ${fmtFull(inc-exp)} | Jumlah transaksi: ${txM.length}

SALDO AKUN: ${accInfo}
TAGIHAN/CICILAN AKTIF: ${billInfo}
TARGET TABUNGAN: ${targetInfo}
DANA PENDIDIKAN: ${eduFundInfo}
PROYEK RENOVASI: ${renovInfo}
SEWA KIOS: ${sewaKiosInfo}
UTANG (belum lunas): ${debtInfo}
PIUTANG (belum lunas): ${piutangInfo}
DANA PENSIUN: ${pensiunInfo}

PENDAPATAN TETAP:
- Gaji toko mebel Borobudur bulan ini: ${fmtFull(gajiThisMonth)} (dari ${whThisMonth.length} hari kerja tercatat, tarif ${fmtFull(D.profile.gajiPokok||0)}/hari)
- Kiriman istri (sesuai pengaturan): ${fmtFull(D.profile.kiriman||0)}/bulan
- Dana darurat: Rp 10jt (BKK) ✅ | RDPU Bibit: Rp 11jt (aset tetap, belum tercatat di modul Buku Aset)
- Kios Borobudur ±34m² milik sendiri (rencana dikontrakkan)

PAJAK & ZAKAT:
- ${zpInfo}
- ${zmInfo}
- Riwayat zakat dibayar (3 terakhir): ${zakatLogInfo}
- Pajak Kendaraan (STNK/uji kelayakan): ${vehTaxInfo}
- SIM: ${simInfo}
- PBB: ${pbbInfo}
- PPh 21: ${pphInfo}
- Pajak UMKM Shop (0.5% omzet bulan ini): ${fmtFull(umkmPajakBulan)}

ASET & KEKAYAAN BERSIH:
- Total nilai aset tercatat: ${fmtFull(totalAsetNilai)} — ${asetListInfo}
- Kekayaan bersih (saldo akun + aset − utang): ${fmtFull(netWorth)}

KEBEBASAN FINANSIAL (FI) & INFLASI:
${fiInfo}
Kalau user tanya soal "kapan bisa pensiun/FIRE/kebebasan finansial", "cukup gak tabunganku buat FI", atau minta analisa dampak inflasi ke rencana keuangannya, JAWAB pakai angka-angka di atas (jangan bilang tidak tahu / minta dia buka menu lain) — kamu SUDAH punya datanya. Kalau progress masih jauh, kasih saran konkret (naikkan surplus bulanan, kurangi pengeluaran kategori tertentu, atau evaluasi asumsi return/inflasi) — bukan cuma restate angka.

PENGELUARAN 3 BULAN TERAKHIR PER KATEGORI:
${Object.entries(katMap).map(([k,v])=>`  ${k}: pemasukan ${fmtFull(v.inc)}, pengeluaran ${fmtFull(v.exp)}`).join('\n')}

BISNIS SHOP (batu cobek PO system):
- All-time: omzet ${fmtFull(cobekOmzet)}, untung ${fmtFull(cobekTotal)}, ${D.cobek.length} transaksi
- Bulan ini: omzet ${fmtFull(cobekOmzetThisMonth)}, untung ${fmtFull(cobekUntungThisMonth)}, ${cobekThisMonth.length} transaksi
- Produk etalase: ${cobekProdukStok}
- Stok menipis (≤2): ${cobekLowStok}
- Produsen/supplier: ${cobekProdusenInfo}

ABSENSI & GAJI: ${gajiAbsensi}

ANGGARAN BULAN INI:
${budgetInfo}

KELUARGA & ANAK:
- Perkembangan anak: ${msDone}/5 milestone tercapai. Catatan: ${anakInfo}

KENDARAAN (data lengkap per unit):${vehicleInfo}

STOK SPAREPART GUDANG: ${stockSparepartAll}
Sparepart menipis: ${stockSparepartLow}`;
D.chatHistory.push({role:'user',content:msg});
const apiKey=D.profile.apiKey;
const provider=D.profile.apiProvider||'claude';
if(!apiKey){
loading.remove();
box.innerHTML+=`<div class="chat-bubble ai">⚠️ Belum ada API Key. Buka Pengaturan → AI Asisten, pilih provider & masukkan API key dulu ya W.</div>`;
box.scrollTop=box.scrollHeight;
D.chatHistory.pop();
return;
}
try{
let reply;
if(provider==='gemini'){
const geminiContents=D.chatHistory.slice(-10).map(m=>({role:m.role==='assistant'?'model':'user',parts:[{text:m.content}]}));
const url=`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
const res=await fetch(url,{
method:'POST',
headers:{'Content-Type':'application/json'},
body:JSON.stringify({system_instruction:{parts:[{text:systemPrompt}]},contents:geminiContents,generationConfig:{maxOutputTokens:4096}})
});
const data=await res.json();
if(!res.ok){
const errMsg=data?.error?.message||`HTTP ${res.status}`;
loading.remove();
box.innerHTML+=`<div class="chat-bubble ai">⚠️ Gagal hubungi Gemini: ${escapeHtml(errMsg)}${res.status===400||res.status===403?' (cek API key di Pengaturan)':''}</div>`;
D.chatHistory.pop();
box.scrollTop=box.scrollHeight;
return;
}
reply=data.candidates?.[0]?.content?.parts?.map(p=>p.text).join('')||'Maaf, coba lagi ya W!';
} else {
const res=await fetch('https://api.anthropic.com/v1/messages',{
method:'POST',
headers:{
'Content-Type':'application/json',
'x-api-key':apiKey,
'anthropic-version':'2023-06-01',
'anthropic-dangerous-direct-browser-access':'true'
},
body:JSON.stringify({model:'claude-sonnet-4-6',max_tokens:4096,system:systemPrompt,messages:D.chatHistory.slice(-10)})
});
const data=await res.json();
if(!res.ok){
const errMsg=data?.error?.message||`HTTP ${res.status}`;
loading.remove();
box.innerHTML+=`<div class="chat-bubble ai">⚠️ Gagal hubungi Claude: ${escapeHtml(errMsg)}${res.status===401?' (API key salah/expired, cek di Pengaturan)':''}</div>`;
D.chatHistory.pop();
box.scrollTop=box.scrollHeight;
return;
}
reply=data.content?.[0]?.text||'Maaf, coba lagi ya W!';
}
const{text:cleanText,action,actionError}=extractChatAction(reply);
D.chatHistory.push({role:'assistant',content:cleanText||reply});
save();
loading.remove();
if(cleanText)box.innerHTML+=`<div class="chat-bubble ai">${escapeHtml(cleanText).replaceAll('\n','<br>')}</div>`;
if(action){
const actionId='a'+Date.now()+Math.floor(Math.random()*1000);
_pendingChatActions[actionId]={type:action.type,data:action.data};
box.innerHTML+=renderChatActionBubble(actionId,action.type,action.data);
}else if(actionError){
box.innerHTML+=`<div class="chat-bubble ai" style="border:1px solid #ff5050">
        <div class="u-fw700" style="color:#ff5050">⚠️ Tombol konfirmasi gagal dibuat</div>
        <div class="u-fs13 u-t2" style="margin:4px 0 8px">AI mencoba mengusulkan aksi tapi datanya tidak terbaca dengan benar. Coba ulangi pesannya, atau isi manual lewat form.</div>
        <div class="u-flex u-gap8 u-fwrap">
          <button class="btn btn-ghost btn-sm" data-action="openTxModal" data-args='["expense"]' aria-label="Edit/Buka">✏️ Buka Form Transaksi</button>
        </div>
      </div>`;
}else if(/tombol.{0,15}(di ?bawah|konfirmasi)|cek ?&? ?konfirmasi/i.test(cleanText)){
box.innerHTML+=`<div class="chat-bubble ai" style="border:1px solid #ff5050">
        <div class="u-fw700" style="color:#ff5050">⚠️ Tombol konfirmasi tidak muncul</div>
        <div class="u-fs13 u-t2" style="margin:4px 0 8px">AI menyebut ada tombol konfirmasi tapi lupa menyertakannya. Coba minta lagi ("tolong tampilkan tombol konfirmasinya"), atau isi manual.</div>
        <div class="u-flex u-gap8 u-fwrap">
          <button class="btn btn-ghost btn-sm" data-action="openTxModal" data-args='["expense"]' aria-label="Edit/Buka">✏️ Buka Form Transaksi</button>
        </div>
      </div>`;
}
}catch(e){
loading.remove();
box.innerHTML+=`<div class="chat-bubble ai">⚠️ Gagal terhubung: ${escapeHtml(e.message||'koneksi bermasalah')}. Pastikan online & API key valid ya! 🙏</div>`;
D.chatHistory.pop();
}
box.scrollTop=box.scrollHeight;
}
async function callAIProviderRaw(systemPrompt,messages){
const apiKey=D.profile.apiKey;
const provider=D.profile.apiProvider||'claude';
if(!apiKey)return{ok:false,errMsg:'no_api_key'};
try{
if(provider==='gemini'){
const geminiContents=messages.map(m=>({role:m.role==='assistant'?'model':'user',parts:[{text:m.content}]}));
const url=`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({system_instruction:{parts:[{text:systemPrompt}]},contents:geminiContents,generationConfig:{maxOutputTokens:4096}})});
const data=await res.json();
if(!res.ok)return{ok:false,errMsg:data?.error?.message||`HTTP ${res.status}`};
const text=data.candidates?.[0]?.content?.parts?.map(p=>p.text).join('')||'';
return{ok:true,text};
} else {
const res=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':apiKey,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify({model:'claude-sonnet-4-6',max_tokens:4096,system:systemPrompt,messages})});
const data=await res.json();
if(!res.ok)return{ok:false,errMsg:data?.error?.message||`HTTP ${res.status}`};
const text=data.content?.[0]?.text||'';
return{ok:true,text};
}
}catch(e){
return{ok:false,errMsg:e.message||'koneksi bermasalah'};
}
}
const AIWidget={
generating:false,
buildContext(){
const now=new Date(),m=now.getMonth(),y=now.getFullYear();
const txM=D.transactions.filter(t=>{const d=new Date(t.date);return d.getMonth()===m&&d.getFullYear()===y;});
const inc=txM.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
const exp=txM.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
const accInfo=D.accounts.map(a=>`${escapeHtml(a.name)}: ${fmtFull(recalcAccBalance(a.id))}`).join(', ')||'Belum ada akun';
let netWorth=0;
try{ netWorth=totalSaldoAkun()+totalAssetValue()-((D.pajakZakat&&D.pajakZakat.utangJT)||0)-totalDebtValue(); }catch(e){}
const cobekOmzet=D.cobek.reduce((s,t)=>s+(t.total||0),0);
const cobekProfit=D.cobek.reduce((s,t)=>s+(t.profit||0),0);
const cobekThisMonth=D.cobek.filter(t=>{const d=new Date(t.date);return d.getMonth()===m&&d.getFullYear()===y;});
const cobekOmzetBulan=cobekThisMonth.reduce((s,t)=>s+(t.total||0),0);
const cobekProfitBulan=cobekThisMonth.reduce((s,t)=>s+(t.profit||0),0);
const whThisMonth=D.workDays.filter(w=>{const d=new Date(w.date);return d.getMonth()===m&&d.getFullYear()===y;});
const gajiBulan=whThisMonth.reduce((s,w)=>s+(w.total||0),0);
let fiInfo='Belum cukup data transaksi utk hitung Kebebasan Finansial.';
try{
if(typeof fiGetAssumptions==='function'&&D.transactions&&D.transactions.length){
const{swr,ret,inf}=fiGetAssumptions();
const fiTarget=fiTargetNominal(),fiAset=fiNetAssetFund(),fiSurplus=fiMonthlySurplus();
const monthsToGo=fiEstimateMonthsToTarget();
const progPct=fiTarget>0?Math.min(999,Math.round(fiAset/fiTarget*100)):0;
fiInfo=`Target FI ${fmtFull(fiTarget)} (SWR ${swr}%), dana FI saat ini ${fmtFull(fiAset)} (${progPct}% progress), surplus rata² ${fmtFull(fiSurplus)}/bln, asumsi return ${ret}%/th & inflasi ${inf}%/th, estimasi capai: ${monthsToGo===0?'sudah tercapai 🎉':monthsToGo===null?'>100 tahun (surplus/return kurang)':fiFormatMonths(monthsToGo)}.`;
}
}catch(e){console.warn('AIWidget: gagal hitung FI',e);}
const debtInfo=(D.debts||[]).filter(d=>!d.lunas).map(d=>`${escapeHtml(d.name)}: ${fmtFull(d.nilai)}${d.jatuhTempo?', JT '+d.jatuhTempo:''}`).join('; ')||'Tidak ada utang aktif';
const billInfo=D.bills.map(b=>`${escapeHtml(b.name)} (${b.kind}): ${fmtFull(b.amount)}, JT ${b.nextDue}`).join('; ')||'Tidak ada tagihan/cicilan aktif';
let budgetInfo='Belum ada anggaran yang diatur';
try{
if((D.budgets||[]).length){
budgetInfo=D.budgets.map(b=>{
const used=D.transactions.filter(t=>{const d=new Date(t.date);return d.getMonth()===m&&d.getFullYear()===y&&budgetMatchesTx(b,t);}).reduce((s,t)=>s+t.amount,0);
const pct=b.limit>0?Math.round(used/b.limit*100):0;
return `${escapeHtml(b.name)}: ${pct}% terpakai${pct>=100?' (OVER)':pct>=80?' (hampir habis)':''}`;
}).join('; ');
}
}catch(e){}
let lifeBalanceInfo='Belum ada data Skor Hidup Seimbang.';
try{
if(typeof LifeBalance!=='undefined'&&typeof LifeBalance.compute==='function'){
const sc=LifeBalance.compute();
lifeBalanceInfo=`Skor Hidup Seimbang: ${sc.total}/100 (${sc.level}) — rincian: ${sc.parts.map(p=>p.label+' '+p.pts+'/'+p.max+' ('+p.note+')').join(', ')}`;
}
}catch(e){}
const targetInfo=(D.targets||[]).map(t=>`${escapeHtml(t.name)}: ${t.amount>0?Math.round((t.saved/t.amount)*100)+'%':'-'}`).join(', ')||'Belum ada target tabungan';
let asetInfo='Belum ada aset tercatat';
try{
if((D.assets||[]).length){
const totalAset=totalAssetValue();
asetInfo=`Total ${fmtFull(totalAset)} dari ${D.assets.length} aset (${D.assets.map(a=>a.name+' '+fmtFull(a.nilai)).join(', ')})`;
}
}catch(e){}
return{m,y,inc,exp,accInfo,netWorth,cobekOmzet,cobekProfit,cobekOmzetBulan,cobekProfitBulan,gajiBulan,whCount:whThisMonth.length,fiInfo,debtInfo,billInfo,budgetInfo,lifeBalanceInfo,targetInfo,asetInfo};
},
buildSystemPrompt(c){
return `Kamu adalah PENASIHAT KEUANGAN, BISNIS & INVESTASI, sekaligus WORK-LIFE COACH pribadi untuk ${D.profile.nama||'pengguna'} (pakai data aplikasi keuangan keluarga miliknya).
Buatkan SATU laporan analisis komprehensif dari data di bawah. WAJIB pakai format PERSIS 4 bagian dengan heading berikut apa adanya (jangan diubah):

## 💰 Analisis Keuangan
## 🏢 Bisnis & Investasi
## ⚖️ Pola Hidup & Kerja
## ✅ Rekomendasi Prioritas

Aturan:
- Tiap bagian max 4-6 bullet (•), padat & konkret, sebutkan angka jelas — jangan paragraf panjang bertele-tele.
- Bagian "Rekomendasi Prioritas" berisi maks 5 poin actionable, diurutkan dari yang paling penting/mendesak dulu.
- Gaya bahasa: jujur, analitis, dan peduli seperti penasihat pribadi yang akrab — bukan gaya laporan korporat kaku, hindari kalimat pembuka seperti "Berdasarkan data yang tersedia...".
- Kalau ada data yang kosong/kurang (misal belum ada aset atau target), sebutkan itu sebagai catatan singkat, bukan alasan untuk skip bagian.

DATA BULAN ${c.m+1}/${c.y}:
- Pemasukan: ${fmtFull(c.inc)} | Pengeluaran: ${fmtFull(c.exp)} | Bersih: ${fmtFull(c.inc-c.exp)}
- Saldo akun: ${c.accInfo}
- Kekayaan bersih (saldo+aset-utang): ${fmtFull(c.netWorth)}
- Tagihan/cicilan aktif: ${c.billInfo}
- Utang belum lunas: ${c.debtInfo}
- Target tabungan: ${c.targetInfo}
- Anggaran bulan ini: ${c.budgetInfo}
- Kebebasan Finansial (FI): ${c.fiInfo}

BISNIS SHOP (batu cobek PO system):
- All-time: omzet ${fmtFull(c.cobekOmzet)}, untung ${fmtFull(c.cobekProfit)}
- Bulan ini: omzet ${fmtFull(c.cobekOmzetBulan)}, untung ${fmtFull(c.cobekProfitBulan)}

ASET & INVESTASI: ${c.asetInfo}

KERJA & POLA HIDUP:
- Gaji harian/absensi bulan ini: ${fmtFull(c.gajiBulan)} dari ${c.whCount} hari kerja tercatat
- ${c.lifeBalanceInfo}`;
},
async generate(){
if(AIWidget.generating)return;
if(!D.profile.apiKey){
toast('⚠️ Isi dulu API Key AI di Pengaturan → AI Asisten');
showPage('settings',document.querySelectorAll('.nav-item')[6]);
return;
}
AIWidget.generating=true;
AIWidget.render();
try{
const ctx=AIWidget.buildContext();
const systemPrompt=AIWidget.buildSystemPrompt(ctx);
const r=await callAIProviderRaw(systemPrompt,[{role:'user',content:'Buatkan laporan analisis lengkap sesuai instruksi di atas, sekarang.'}]);
if(!r.ok){
toast('⚠️ Gagal buat analisis: '+(r.errMsg||'error tidak diketahui'));
} else if(!r.text){
toast('⚠️ AI tidak memberikan jawaban, coba lagi');
} else {
D.aiWidgetReport={text:r.text,generatedAt:new Date().toISOString()};
save();
toast('✅ Analisis AI diperbarui');
}
}catch(e){
toast('⚠️ Gagal terhubung: '+(e.message||'koneksi bermasalah'));
}
AIWidget.generating=false;
AIWidget.render();
},
mdToHtml(text){
let t=escapeHtml(text);
t=t.replace(/^## (.+)$/gm,'<div style="font-weight:800;margin:12px 0 6px;font-size:12.5px;color:var(--accent)">$1</div>');
t=t.replace(/\*\*(.+?)\*\*/g,'<b>$1</b>');
t=t.replace(/^[•\-] ?(.+)$/gm,'<div style="padding-left:14px;position:relative;margin-bottom:4px">•&nbsp;$1</div>');
t=t.split('\n').map(line=>line.startsWith('<div')?line:(line.trim()?line+'<br>':'')).join('');
return t;
},
render(){
const box=document.getElementById('aiWidgetBody');
if(!box)return;
const btn=document.getElementById('aiWidgetGenBtn');
if(AIWidget.generating){
if(btn){btn.disabled=true;btn.textContent='⏳ Menganalisa...';}
box.innerHTML='<div class="empty"><div class="empty-icon">🧭</div><div class="empty-text">⏳ AI sedang menganalisa semua data kamu, tunggu sebentar...</div></div>';
return;
}
if(btn){btn.disabled=false;btn.textContent='🔍 Buat/Perbarui Analisis';}
const r=D.aiWidgetReport;
if(!r||!r.text){
box.innerHTML='<div class="empty"><div class="empty-icon">🧭</div><div class="empty-text">Belum ada analisis. Tap "Buat/Perbarui Analisis" untuk laporan penasihat keuangan, bisnis &amp; investasi, dan pola hidup-kerja dari semua data kamu.</div></div>';
return;
}
const genDate=new Date(r.generatedAt);
box.innerHTML=`<div class="u-fs11 u-t2 u-mb8">🕒 Dibuat ${genDate.toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'})} ${genDate.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})}</div><div class="u-fs13 u-lh16">${AIWidget.mdToHtml(r.text)}</div>`;
},
openChat(){
showPage('ai',document.querySelectorAll('.nav-item')[3]);
setTimeout(()=>{
const input=document.getElementById('chatInput');
if(input&&!input.value)input.value='Bahas lebih lanjut soal laporan analisis AI yang barusan dibuat di widget rekomendasi, saya mau tanya lebih detail.';
if(input)input.focus();
},150);
}
};
async function resetApp(){if(!await askConfirm('YAKIN? Semua data (transaksi, catatan, pengaturan) akan dihapus permanen.',{title:'Reset Aplikasi',okText:'Ya, Reset'}))return;if(!await askConfirm('Ini tidak bisa dibatalkan setelah dilanjutkan. Yakin mau lanjut?',{title:'Konfirmasi Terakhir',okText:'Ya, Hapus Semua'}))return;localStorage.clear();location.reload();}
function phoneToWaId(phone){
if(!phone) return '';
let p=String(phone).replace(/[^0-9+]/g,'');
if(p.startsWith('+')) p=p.slice(1);
if(p.startsWith('0')) p='62'+p.slice(1);
else if(!p.startsWith('62')) p='62'+p;
return p;
}
function waShareLink(text,phone){
const t=encodeURIComponent(text);
if(phone){const id=phoneToWaId(phone);return `https://wa.me/${id}?text=${t}`;}
return `https://wa.me/?text=${t}`;
}
function openWaShare(text,phone){window.open(waShareLink(text,phone),'_blank');}
async function requestNotifPermission(){
if(!('Notification' in window)){toast('⚠️ Browser ini tidak mendukung notifikasi');renderNotifSettings();return;}
try{
const perm=await Notification.requestPermission();
if(perm==='granted'){
D.notifSettings.enabled=true;save();
toast('✅ Notifikasi diaktifkan!');
fireNotif('🔔 Notifikasi Aktif','Keluarga W akan mengingatkan jadwal pulang & tagihan jatuh tempo selama aplikasi ini dibuka.');
checkAndFireReminders();
} else {
D.notifSettings.enabled=false;save();
toast('❌ Izin notifikasi ditolak / diblokir browser');
}
}catch(e){toast('⚠️ Gagal minta izin notifikasi');}
renderNotifSettings();
}
function fireNotif(title,body,tag){
if(!('Notification' in window)||Notification.permission!=='granted')return;
try{
const n=new Notification(title,{body,tag,renotify:!!tag});
n.onclick=()=>{window.focus();n.close();};
}catch(e){console.warn('Gagal kirim notifikasi:',e);}
}
function toggleNotifEnabled(checked){
if(checked){requestNotifPermission();}
else{D.notifSettings.enabled=false;save();renderNotifSettings();toast('🔕 Notifikasi dimatikan');}
}
function saveNotifDays(){
D.notifSettings.billDays=parseInt(document.getElementById('notifBillDays').value)||3;
D.notifSettings.ldrDays=parseInt(document.getElementById('notifLdrDays').value)||3;
save();toast('✅ Pengaturan reminder disimpan');
}
/* moved to modules-render.js: renderNotifSettings */
function testNotif(){
if(!('Notification' in window)||Notification.permission!=='granted'){toast('⚠️ Aktifkan notifikasi dulu');return;}
fireNotif('🔔 Tes Notifikasi','Kalau ini muncul, notifikasi Keluarga W berhasil aktif! 🎉');
toast('✅ Notifikasi tes dikirim');
}
function checkAndFireReminders(){
if(!D.notifSettings.enabled||!('Notification' in window)||Notification.permission!=='granted')return;
const todayKey=todayStr();
let fired={};
try{fired=JSON.parse(localStorage.getItem('kw_notif_fired')||'{}');}catch(e){fired={};}
if(fired.date!==todayKey) fired={date:todayKey,ids:[]};
const today=new Date();today.setHours(0,0,0,0);
D.bills.forEach(b=>{
const d=new Date(b.nextDue);
const diff=Math.ceil((d-today)/(1000*60*60*24));
const fireKey='bill_'+b.id+'_'+b.nextDue;
if(diff>=0 && diff<=(D.notifSettings.billDays||3) && !fired.ids.includes(fireKey)){
fireNotif('🔔 Tagihan akan jatuh tempo',`${escapeHtml(b.name)} - ${fmtFull(b.amount)} jatuh tempo ${diff===0?'hari ini':diff+' hari lagi'}`,fireKey);
fired.ids.push(fireKey);
}
});
if(D.nextPulang){
const pulang=new Date(D.nextPulang);
const diff=Math.ceil((pulang-today)/(1000*60*60*24));
const fireKey='ldr_'+D.nextPulang;
if(diff>=0 && diff<=(D.notifSettings.ldrDays||3) && !fired.ids.includes(fireKey)){
fireNotif('✈️ Jadwal Pulang ke Pekalongan',diff===0?'Hari ini jadwal pulang! 💙':`Tinggal ${diff} hari lagi pulang ke Pekalongan 💙`,fireKey);
fired.ids.push(fireKey);
}
}
D.vehicles.forEach(v=>{
Object.entries(VEHTAX_ITEMS).forEach(([key,cfg])=>{
const tgl=v[cfg.tglKey];
if(!tgl)return;
const d=new Date(tgl);
const diff=Math.ceil((d-today)/(1000*60*60*24));
const fireKey='vehtax_'+v.id+'_'+key+'_'+tgl;
if(diff>=0 && diff<=(D.notifSettings.billDays||3) && !fired.ids.includes(fireKey)){
fireNotif('🚦 '+cfg.label.replace(/^\S+\s/,'')+' akan jatuh tempo',`${v.name} - ${diff===0?'hari ini':diff+' hari lagi'}`,fireKey);
fired.ids.push(fireKey);
}
});
});
(D.simList||[]).forEach(s=>{
if(!s.tglAkhir)return;
const d=new Date(s.tglAkhir);
const diff=Math.ceil((d-today)/(1000*60*60*24));
const fireKey='sim_'+s.id+'_'+s.tglAkhir;
if(diff>=0 && diff<=(D.notifSettings.billDays||3) && !fired.ids.includes(fireKey)){
fireNotif('🪪 SIM akan habis masa berlaku',`${s.nama} (${s.jenis}) - ${diff===0?'hari ini':diff+' hari lagi'}`,fireKey);
fired.ids.push(fireKey);
}
});
{
const sptDue=sptTahunanDueDate();
const d=new Date(sptDue);
const diff=Math.ceil((d-today)/(1000*60*60*24));
const fireKey='spt_'+sptDue;
if(diff>=0 && diff<=(D.notifSettings.billDays||3) && !fired.ids.includes(fireKey)){
fireNotif('🧾 Batas Lapor SPT Tahunan',`SPT Tahunan Orang Pribadi jatuh tempo ${diff===0?'hari ini':diff+' hari lagi'} (31 Maret)`,fireKey);
fired.ids.push(fireKey);
}
}
try{localStorage.setItem('kw_notif_fired',JSON.stringify(fired));}catch(e){console.error('Gagal simpan status notifikasi:',e);}
}
function shareBillWA(id){
const b=D.bills.find(x=>x.id===id);if(!b)return;
const due=new Date(b.nextDue).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'});
const text=`🔔 Pengingat Tagihan\n${escapeHtml(b.name)}\nJumlah: ${fmtFull(b.amount)}\nJatuh tempo: ${due}`;
openWaShare(text);
}
function shareLDRWA(){
if(!D.nextPulang){toast('⚠️ Atur tanggal pulang dulu');return;}
const pulangD=new Date(D.nextPulang);
const pulangLbl=pulangD.toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'});
const today=new Date();today.setHours(0,0,0,0);
const diff=Math.ceil((pulangD-today)/(1000*60*60*24));
const text=`✈️ Jadwal Pulang ke Pekalongan\nTanggal: ${pulangLbl}\n${diff>0?'Tinggal '+diff+' hari lagi 💙':'Hari ini pulang! 🏠'}`;
openWaShare(text);
}
function buildLaporanExportData(){
const {from,to}=getRange();
const f=getLaporanFilters();
const txs=D.transactions.filter(t=>{
const d=new Date(t.date);
if(d<from||d>to)return false;
if(t.type==='transfer_in'||t.type==='transfer_out')return false;
if(!txMatchesFilters(t,f))return false;
return true;
}).sort((a,b)=>new Date(a.date)-new Date(b.date));
const inc=txs.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
const exp=txs.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
const periodeLabel=document.querySelector('#periodeChips .chip-btn.active')?.textContent||'Custom';
const fromLbl=from.toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'});
const toLbl=to.toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'});
const km={};
txs.forEach(t=>{if(!km[t.category])km[t.category]={inc:0,exp:0,n:0};if(t.type==='income')km[t.category].inc+=t.amount;else km[t.category].exp+=t.amount;km[t.category].n++;});
const katRows=Object.entries(km).sort((a,b)=>(b[1].inc+b[1].exp)-(a[1].inc+a[1].exp));
return {txs,inc,exp,periodeLabel,fromLbl,toLbl,katRows};
}
async function exportLaporanPDF(){
if(typeof window.jspdf==='undefined'){
try{await ensureJsPDF();}catch(e){toast('⚠️ Gagal memuat modul PDF, cek koneksi internet');return;}
}
if(typeof window.jspdf==='undefined'){toast('⚠️ Modul PDF masih dimuat, coba lagi 2 detik');return;}
const {jsPDF}=window.jspdf;
const {txs,inc,exp,periodeLabel,fromLbl,toLbl,katRows}=buildLaporanExportData();
const doc=new jsPDF({unit:'pt',format:'a4'});
const pageW=doc.internal.pageSize.getWidth();
let y=50;
doc.setFont('helvetica','bold');doc.setFontSize(18);doc.setTextColor(40,40,60);
doc.text('Laporan Keuangan - Keluarga '+(D.profile.nama||'W'),40,y);
y+=20;
doc.setFont('helvetica','normal');doc.setFontSize(10);doc.setTextColor(110,110,130);
doc.text(`Periode: ${periodeLabel} (${fromLbl} - ${toLbl})`,40,y);y+=14;
doc.text('Dicetak: '+new Date().toLocaleString('id-ID'),40,y);y+=20;
doc.setDrawColor(220,220,230);doc.line(40,y,pageW-40,y);y+=22;
doc.setFont('helvetica','bold');doc.setFontSize(12);doc.setTextColor(30,30,40);
doc.text('Ringkasan',40,y);y+=18;
doc.setFont('helvetica','normal');doc.setFontSize(11);
doc.setTextColor(20,140,90);doc.text('Pemasukan: '+fmtFull(inc),40,y);
doc.setTextColor(210,60,60);doc.text('Pengeluaran: '+fmtFull(exp),pageW/2,y);y+=16;
doc.setTextColor(80,70,200);doc.text('Saldo Bersih: '+fmtFull(inc-exp),40,y);
doc.setTextColor(60,60,70);doc.text('Jumlah Transaksi: '+txs.length,pageW/2,y);y+=28;
if(katRows.length){
doc.setFont('helvetica','bold');doc.setFontSize(12);doc.setTextColor(30,30,40);
doc.text('Per Kategori',40,y);y+=16;
doc.setFont('helvetica','normal');doc.setFontSize(9.5);
katRows.forEach(([k,v])=>{
if(y>770){doc.addPage();y=50;}
const val=v.inc-v.exp;
doc.setTextColor(60,60,70);
doc.text(`${k} (${v.n}x)`,40,y);
doc.setTextColor(val>=0?20:210,val>=0?140:60,val>=0?90:60);
doc.text((val>=0?'+':'-')+fmtFull(Math.abs(val)),pageW-150,y);
y+=14;
});
y+=14;
}
if(y>740){doc.addPage();y=50;}
doc.setFont('helvetica','bold');doc.setFontSize(12);doc.setTextColor(30,30,40);
doc.text('Daftar Transaksi',40,y);y+=16;
doc.setFontSize(9);
const colX=[40,105,255,355,430];
doc.setFillColor(124,111,239);
doc.rect(40,y-10,pageW-80,16,'F');
doc.setTextColor(255,255,255);
doc.text('Tanggal',colX[0]+2,y);doc.text('Kategori',colX[1]+2,y);doc.text('Akun',colX[2]+2,y);doc.text('Catatan',colX[3]+2,y);doc.text('Jumlah',colX[4]+2,y);
y+=14;
doc.setFont('helvetica','normal');
txs.forEach(t=>{
if(y>780){doc.addPage();y=50;}
const accName=D.accounts.find(a=>a.id===t.accountId)?.name||'';
doc.setTextColor(60,60,70);
doc.text(t.date,colX[0]+2,y);
doc.text(String(t.category||'').slice(0,22),colX[1]+2,y);
doc.text(accName.slice(0,14),colX[2]+2,y);
doc.text(String(t.note||'-').slice(0,16),colX[3]+2,y);
doc.setTextColor(t.type==='income'?20:210,t.type==='income'?140:60,t.type==='income'?90:60);
doc.text((t.type==='income'?'+':'-')+fmtFull(t.amount),colX[4]+2,y);
y+=13;
});
doc.save('laporan-W-'+new Date().toISOString().split('T')[0]+'.pdf');
toast('✅ Laporan PDF berhasil dibuat');
}
async function exportLaporanImage(){
if(typeof html2canvas==='undefined'){
try{await ensureHtml2Canvas();}catch(e){toast('⚠️ Gagal memuat modul gambar, cek koneksi internet');return;}
}
if(typeof html2canvas==='undefined'){toast('⚠️ Modul gambar masih dimuat, coba lagi 2 detik');return;}
const {txs,inc,exp,periodeLabel,fromLbl,toLbl,katRows}=buildLaporanExportData();
const wrap=document.createElement('div');
wrap.style.cssText='position:fixed;left:-9999px;top:0;width:420px;background:#ffffff;color:#1a1a2e;font-family:"Plus Jakarta Sans",sans-serif;padding:24px;';
const katHTML=katRows.map(([k,v])=>{
const val=v.inc-v.exp;
return `<div class="u-flex u-jcb u-fs12" style="padding:6px 0;border-bottom:1px solid #eee"><span>${escapeHtml(k)} <span style="color:#999">(${v.n}x)</span></span><span style="font-weight:700;color:${val>=0?'#16a34a':'#dc2626'}">${val>=0?'+':'-'}${fmtFull(Math.abs(val))}</span></div>`;
}).join('');
const txHTML2=txs.slice(-30).map(t=>{
const accName=D.accounts.find(a=>a.id===t.accountId)?.name||'';
return `<div class="u-flex u-jcb u-fs12" style="padding:5px 0;border-bottom:1px solid #f5f5f5"><span>${t.date} · ${escapeHtml(t.category)}${accName?' · '+escapeHtml(accName):''}</span><span style="font-weight:700;color:${t.type==='income'?'#16a34a':'#dc2626'}">${t.type==='income'?'+':'-'}${fmtFull(t.amount)}</span></div>`;
}).join('');
wrap.innerHTML=`
    <div class="u-fs18 u-fw800 u-mb2">📊 Laporan Keuangan</div>
    <div class="u-fs12" style="color:#888;margin-bottom:16px">Keluarga ${escapeHtml(D.profile.nama||'W')} · ${escapeHtml(periodeLabel)} (${fromLbl} - ${toLbl})</div>
    <div class="u-flex u-gap8 u-mb12">
      <div class="u-flex1 u-r12 u-tac" style="background:#f0fdf4;padding:10px"><div class="u-fs12 u-fw700" style="color:#16a34a">PEMASUKAN</div><div class="u-fs14 u-fw800" style="color:#16a34a">${fmtFull(inc)}</div></div>
      <div class="u-flex1 u-r12 u-tac" style="background:#fef2f2;padding:10px"><div class="u-fs12 u-fw700" style="color:#dc2626">PENGELUARAN</div><div class="u-fs14 u-fw800" style="color:#dc2626">${fmtFull(exp)}</div></div>
    </div>
    <div class="u-r12 u-tac" style="background:#f5f3ff;padding:10px;margin-bottom:18px"><div class="u-fs12 u-fw700" style="color:var(--accent)">SALDO BERSIH</div><div class="u-fs16 u-fw800" style="color:var(--accent)">${fmtFull(inc-exp)}</div></div>
    <div class="u-fs13 u-fw800 u-mb6">Per Kategori</div>
    ${katHTML||'<div class="u-fs12" style="color:#999">Tidak ada data</div>'}
    <div class="u-fs13 u-fw800" style="margin:16px 0 6px">Transaksi ${txs.length>30?'(30 Terbaru)':''}</div>
    ${txHTML2||'<div class="u-fs12" style="color:#999">Tidak ada transaksi</div>'}
    <div class="u-fs12 u-tac" style="margin-top:18px;color:#bbb">Dibuat dengan Keluarga W · ${new Date().toLocaleDateString('id-ID')}</div>
  `;
document.body.appendChild(wrap);
if(typeof html2canvas==='undefined'){
document.body.removeChild(wrap);
toast('⚠️ Modul gambar laporan gagal dimuat (cek koneksi internet), coba lagi nanti',4000);
return;
}
html2canvas(wrap,{scale:2,backgroundColor:'#ffffff'}).then(canvas=>{
document.body.removeChild(wrap);
const a=document.createElement('a');
a.href=canvas.toDataURL('image/png');
a.download='laporan-W-'+new Date().toISOString().split('T')[0]+'.png';
a.click();
toast('✅ Gambar laporan berhasil dibuat');
}).catch(e=>{
if(wrap.parentNode) document.body.removeChild(wrap);
toast('❌ Gagal membuat gambar: '+e.message);
});
}
let gdriveTokenClient=null;
let gdriveAccessToken=null;
let gdrivePendingAfterAuth=null;
let gdriveTokenScope=null;
let gdriveTokenExpiresAt=null;
let gdriveUserEmail=null;
const GDRIVE_EMAIL_SCOPE='https://www.googleapis.com/auth/userinfo.email';
let _gdriveSilentReconnectInProgress=false;
function gdriveTrySilentReconnectOnLoad(){
if(!D.googleDrive||!D.googleDrive.autoSync||!D.googleDrive.clientId)return;
if(gdriveAccessToken)return;
ensureGoogleGSI().catch(()=>{});
let attemptsLeft=15;
const tryNow=()=>{
if(gdriveAccessToken)return;
if(typeof google==='undefined'||!google.accounts||!google.accounts.oauth2){
if(--attemptsLeft>0)setTimeout(tryNow,400);
return;
}
const tc=gdriveInitTokenClient();
if(!tc)return;
_gdriveSilentReconnectInProgress=true;
try{
tc.requestAccessToken({prompt:''});
}catch(e){
_gdriveSilentReconnectInProgress=false;
console.warn('Auto-reconnect Google Drive (diam-diam) gagal dipanggil:',e);
}
};
tryNow();
}
function gdriveHandleAuthSuccess(resp,scopeLevel){
gdriveAccessToken=resp.access_token;
gdriveTokenScope=scopeLevel;
const expiresInSec=Number(resp.expires_in)||3500;
gdriveTokenExpiresAt=Date.now()+expiresInSec*1000;
gdriveFetchUserInfo();
renderGDriveSettings();
renderSheetsSettings();
}
async function gdriveFetchUserInfo(){
if(!gdriveAccessToken)return;
try{
const res=await fetch('https://www.googleapis.com/oauth2/v3/userinfo',{headers:{'Authorization':'Bearer '+gdriveAccessToken}});
if(!res.ok)return;
const info=await res.json();
gdriveUserEmail=info.email||null;
}catch(e){ }
renderGDriveSettings();
renderSheetsSettings();
}
function gdriveResetTokenState(){
gdriveAccessToken=null;
gdriveTokenScope=null;
gdriveTokenExpiresAt=null;
gdriveUserEmail=null;
gdrivePendingAfterAuth=null;
sheetsPendingAfterAuth=null;
renderGDriveSettings();
renderSheetsSettings();
}
function gdriveDisconnect(){
if(!gdriveAccessToken){toast('ℹ️ Belum terhubung ke akun Google manapun');return;}
const tok=gdriveAccessToken;
try{
if(typeof google!=='undefined'&&google.accounts&&google.accounts.oauth2&&google.accounts.oauth2.revoke){
google.accounts.oauth2.revoke(tok,()=>{});
}
}catch(e){ console.error('gdriveDisconnect revoke error:',e); }
gdriveResetTokenState();
toast('✅ Koneksi Google diputuskan');
}
function gdriveConnStatusLabel(requireSheetsScope){
if(!gdriveAccessToken)return '⚪ Belum terhubung sesi ini';
const now=Date.now();
if(gdriveTokenExpiresAt&&now>=gdriveTokenExpiresAt)return '⏰ Token kadaluarsa — pencet Hubungkan lagi';
if(requireSheetsScope&&gdriveTokenScope!=='sheets')return '🟡 Terhubung tapi scope belum cukup untuk Sheets — pencet Hubungkan/Sync lagi utk upgrade';
const who=gdriveUserEmail?(' sebagai '+gdriveUserEmail):'';
let expiryLabel='';
if(gdriveTokenExpiresAt){
const minsLeft=Math.max(0,Math.round((gdriveTokenExpiresAt-now)/60000));
expiryLabel=minsLeft>=1?(' (berlaku ±'+minsLeft+' menit lagi)'):(' (segera kadaluarsa)');
}
return '🔗 Terhubung'+who+expiryLabel;
}
function gdriveSaveClientId(){
D.googleDrive.clientId=document.getElementById('gdClientId').value.trim();
save();toast('✅ Client ID disimpan');
}
function gdriveInitTokenClient(){
if(!D.googleDrive.clientId){toast('⚠️ Isi Google Client ID dulu (lihat petunjuk di bawah)');return null;}
ensureGoogleGSI().catch(()=>{});
if(location.protocol==='file:'){
toast('❌ App ini dibuka langsung dari file HP (file://), Google Sign-In TIDAK BISA jalan di mode ini. App harus di-hosting di alamat https:// (misal GitHub Pages/Netlify/Vercel) baru Google Drive bisa terhubung. Lihat petunjuk di bawah.');
return null;
}
if(!/^[\w-]+\.apps\.googleusercontent\.com$/.test(D.googleDrive.clientId)){
toast('⚠️ Format Client ID sepertinya salah, harus diakhiri ".apps.googleusercontent.com" (jangan copy Client Secret)');
return null;
}
if(typeof google==='undefined'||!google.accounts||!google.accounts.oauth2){toast('⚠️ Modul Google sedang dimuat, coba pencet lagi dalam 1-2 detik. Kalau tetap gagal dan pakai Brave, coba matikan Shields (ikon 🦁 di address bar) untuk situs ini, lalu reload. Bisa juga karena koneksi internet.');return null;}
if(!gdriveTokenClient){
gdriveTokenClient=google.accounts.oauth2.initTokenClient({
client_id:D.googleDrive.clientId,
scope:'https://www.googleapis.com/auth/drive.file '+GDRIVE_EMAIL_SCOPE,
callback:(resp)=>{
const wasSilent=_gdriveSilentReconnectInProgress;_gdriveSilentReconnectInProgress=false;
if(resp.error){
gdrivePendingAfterAuth=null;
if(wasSilent){console.warn('Auto-reconnect Google Drive (diam-diam) tidak berhasil:',resp.error);return;}
toast('❌ Gagal hubungkan Google Drive: '+resp.error+(resp.error==='popup_closed_by_user'?' (jendela pilih akun ditutup sebelum selesai)':resp.error==='popup_failed_to_open'?' (popup diblokir browser, izinkan popup untuk situs ini)':resp.error==='origin_mismatch'?' (alamat situs ini belum ditambahkan sebagai Authorized JavaScript Origin di Google Cloud Console)':''));
return;
}
gdriveHandleAuthSuccess(resp,'drive');
const fn=gdrivePendingAfterAuth;gdrivePendingAfterAuth=null;
if(fn){fn();}
else if(wasSilent){toast('🔄 Google Drive tersambung otomatis');uploadBackupToDrive(true);}
else{toast('✅ Terhubung ke Google Drive');}
},
error_callback:(err)=>{
const wasSilent=_gdriveSilentReconnectInProgress;_gdriveSilentReconnectInProgress=false;
gdrivePendingAfterAuth=null;
if(wasSilent){console.warn('Auto-reconnect Google Drive (diam-diam) gagal dibuka:',err);return;}
console.error('GSI error_callback:',err);
toast('❌ Google Sign-In gagal dibuka: '+(err&&err.type?err.type:'unknown')+(err&&err.type==='popup_failed_to_open'?' — popup diblokir, cek pengaturan popup browser/Brave Shields':''));
}
});
}
return gdriveTokenClient;
}
function gdriveEnsureAuth(afterAuth){
if(gdriveAccessToken){ if(afterAuth)afterAuth(); return; }
const tc=gdriveInitTokenClient();
if(!tc)return;
gdrivePendingAfterAuth=afterAuth||null;
try{
tc.requestAccessToken();
}catch(e){
console.error('gdriveEnsureAuth error:',e);
gdrivePendingAfterAuth=null;
toast('❌ Gagal membuka Google Sign-In: '+e.message);
}
}
function gdriveConnectOnly(){
if(gdriveAccessToken){toast('✅ Sudah terhubung ke Google Drive');return;}
gdriveEnsureAuth(null);
}
function gdriveBackupNow(){
gdriveEnsureAuth(uploadBackupToDrive);
}
function gdriveRestoreNow(){
gdriveEnsureAuth(gdriveDownloadBackup);
}
function gdriveThrowForFailedRes(res){
if(res.status===401){
gdriveResetTokenState();
throw new Error('Sesi Google kadaluarsa/tidak valid (401). Silakan pencet Hubungkan lagi.');
}
throw new Error('HTTP '+res.status);
}
async function uploadBackupToDrive(silent){
if(_saveGuards['driveUpload'])return;
_saveGuards['driveUpload']=true;
try{
await _uploadBackupToDriveInner(silent);
} finally {
_saveGuards['driveUpload']=false;
}
}
function _gdriveLocalDataLooksEmpty(){
return (D.transactions||[]).length===0 && (D.accounts||[]).length===0 &&
(D.products||[]).length===0 && (D.assets||[]).length===0 &&
(D.bbmLogs||[]).length===0 && (D.servisLogs||[]).length===0;
}
async function _gdriveFindExistingBackupFileId(){
const q=encodeURIComponent("name='backup-keluarga-W.json' and trashed=false");
const res=await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,modifiedTime)&orderBy=modifiedTime desc`,{
headers:{'Authorization':'Bearer '+gdriveAccessToken}
});
if(!res.ok) gdriveThrowForFailedRes(res);
const data=await res.json();
return (data.files&&data.files.length)?data.files[0].id:null;
}
async function _uploadBackupToDriveInner(silent){
if(!gdriveAccessToken){ if(silent)throw new Error('Belum terhubung ke Google Drive'); gdriveEnsureAuth(uploadBackupToDrive); return; }
const backupD=buildBackupPayload();
const content=JSON.stringify(backupD,null,2);
const KEEPALIVE_LIMIT=60000;
const contentSizeBytes=new Blob([content]).size;
const useKeepalive=contentSizeBytes<KEEPALIVE_LIMIT;
try{
let fileId=D.googleDrive.fileId;
if(!fileId){
fileId=await _gdriveFindExistingBackupFileId();
}
if(fileId && _gdriveLocalDataLooksEmpty()){
if(silent){
console.warn('Auto-backup dilewati: data lokal kosong tapi ada backup lama di Drive (fileId '+fileId+').');
toast('⚠️ Auto-sync dilewati: data di HP ini kosong tapi ada backup lama di Drive. Buka Pengaturan → Google Drive → "Restore dari Drive" dulu kalau mau ambil data lama itu.');
return false;
}
const confirmed=await askConfirm('Data di HP ini sekarang KOSONG, tapi sudah ada backup lain (kemungkinan berisi data asli kamu) di Google Drive. Kalau lanjut, backup lama itu akan TERTIMPA data kosong ini dan tidak bisa dikembalikan. Disarankan tap "Restore dari Drive" dulu, bukan Backup. Tetap lanjut backup dengan data kosong ini?',{title:'⚠️ Backup akan menimpa data lama',danger:true,okText:'Ya, Timpa dengan Data Kosong',icon:'⚠️'});
if(!confirmed)return false;
}
if(fileId){
const res=await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,{
method:'PATCH',
headers:{'Authorization':'Bearer '+gdriveAccessToken,'Content-Type':'application/json'},
body:content,
keepalive:useKeepalive
});
if(!res.ok) gdriveThrowForFailedRes(res);
D.googleDrive.fileId=fileId;
} else {
const metadata={name:'backup-keluarga-W.json',mimeType:'application/json'};
const boundary='kwboundary'+Date.now();
const body=`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${content}\r\n--${boundary}--`;
const res=await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',{
method:'POST',
headers:{'Authorization':'Bearer '+gdriveAccessToken,'Content-Type':'multipart/related; boundary='+boundary},
body,
keepalive:useKeepalive
});
if(!res.ok) gdriveThrowForFailedRes(res);
const data=await res.json();
D.googleDrive.fileId=data.id;
}
D.googleDrive.lastSync=new Date().toISOString();
save();
renderGDriveSettings();
if(!silent)toast('✅ Backup tersimpan ke Google Drive');
return true;
}catch(e){
if(silent)throw e;
toast('❌ Gagal backup ke Drive: '+e.message);
}
}
function gdriveToggleAutoSync(checked){
D.googleDrive.autoSync=checked;save();
if(checked && !gdriveAccessToken){toast('ℹ️ Hubungkan Google Drive dulu. Auto-sync berjalan tiap beberapa menit selama app terbuka, & sekali lagi pas app ditutup/pindah (bukan saat sudah tertutup total)');}
}
async function gdriveDownloadBackup(){
if(_saveGuards['driveDownload'])return;
_saveGuards['driveDownload']=true;
try{
await _gdriveDownloadBackupInner();
} finally {
_saveGuards['driveDownload']=false;
}
}
async function _gdriveDownloadBackupInner(){
toast('⏳ Mencari file backup di Google Drive...');
try{
let fileId=D.googleDrive.fileId;
if(!fileId){
const q=encodeURIComponent("name='backup-keluarga-W.json' and trashed=false");
const res=await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,modifiedTime)&orderBy=modifiedTime desc`,{
headers:{'Authorization':'Bearer '+gdriveAccessToken}
});
if(!res.ok) gdriveThrowForFailedRes(res);
const data=await res.json();
if(!data.files||!data.files.length){toast('⚠️ Tidak ditemukan file backup di Google Drive akun ini.');return;}
fileId=data.files[0].id;
}
const fileRes=await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,{
headers:{'Authorization':'Bearer '+gdriveAccessToken}
});
if(!fileRes.ok) gdriveThrowForFailedRes(fileRes);
const imp=await fileRes.json();
const confirmed=await askConfirm('Data yang ada di HP ini sekarang akan digabung/ditimpa dengan data dari Drive. Lanjutkan?',{title:'Restore dari Google Drive',danger:false,okText:'Ya, Restore',icon:'☁️'});
if(!confirmed)return;
const ok=await applyRestoredData(imp);
if(ok){D.googleDrive.fileId=fileId;saveFlush();}
if(ok)toast('✅ Data berhasil di-restore dari Google Drive!');
}catch(e){
toast('❌ Gagal restore dari Drive: '+e.message);
}
}
function runDataHealthCheck(){
const issues=[];
const accIds=new Set(D.accounts.map(a=>a.id));
const vehIds=new Set(D.vehicles.map(v=>v.id));
const txIds=new Set();
const dupTxIds=[];
D.transactions.forEach(t=>{
if(txIds.has(t.id))dupTxIds.push(t.id); else txIds.add(t.id);
if(t.accountId && !accIds.has(t.accountId)){
issues.push({level:'error',title:'Transaksi dengan akun tidak valid',detail:`"${t.note||t.category||t.id}" (${t.date||'?'}) menunjuk ke akun yang sudah dihapus.`});
}
if(!t.amount || isNaN(t.amount) || t.amount<=0){
issues.push({level:'error',title:'Transaksi dengan jumlah tidak valid',detail:`"${t.note||t.category||t.id}" (${t.date||'?'}) punya jumlah kosong/0/negatif.`});
}
if(!t.date || isNaN(new Date(t.date).getTime())){
issues.push({level:'error',title:'Transaksi dengan tanggal tidak valid',detail:`"${t.note||t.category||t.id}" punya tanggal kosong/rusak.`});
}
});
if(dupTxIds.length){
issues.push({level:'error',title:'ID transaksi duplikat',detail:`${dupTxIds.length} transaksi punya ID yang sama (bisa bikin data ganda/salah hitung). ID: ${[...new Set(dupTxIds)].slice(0,5).join(', ')}${dupTxIds.length>5?'...':''}`});
}
D.bills.forEach(b=>{
if(b.accountId && !accIds.has(b.accountId)){
issues.push({level:'warn',title:'Tagihan dengan akun tidak valid',detail:`"${escapeHtml(b.name)}" menunjuk ke akun yang sudah dihapus.`});
}
});
(D.assets||[]).forEach(a=>{
if(a.accountId && !accIds.has(a.accountId)){
issues.push({level:'warn',title:'Aset dengan akun tautan tidak valid',detail:`"${escapeHtml(a.name)}" ditautkan ke akun yang sudah dihapus — akun tautan otomatis dianggap kosong, cek/lepas tautannya di modal Aset.`});
}
});
D.bbmLogs.forEach(b=>{
if(b.vehicleId && !vehIds.has(b.vehicleId)){
issues.push({level:'error',title:'Catatan BBM dengan kendaraan tidak valid',detail:`Catatan BBM tgl ${b.date||'?'} menunjuk ke kendaraan yang sudah dihapus.`});
}
if(b.accountId && !accIds.has(b.accountId)){
issues.push({level:'warn',title:'Catatan BBM dengan akun tidak valid',detail:`Catatan BBM tgl ${b.date||'?'} menunjuk ke akun yang sudah dihapus.`});
}
if(b.txLinkId && !txIds.has(b.txLinkId)){
issues.push({level:'warn',title:'Catatan BBM kehilangan transaksi tertaut',detail:`Catatan BBM tgl ${b.date||'?'} seharusnya tertaut ke transaksi keuangan, tapi transaksinya tidak ditemukan.`});
}
});
D.servisLogs.forEach(s=>{
if(s.vehicleId && !vehIds.has(s.vehicleId)){
issues.push({level:'error',title:'Catatan servis dengan kendaraan tidak valid',detail:`Servis "${s.item||'?'}" tgl ${s.date||'?'} menunjuk ke kendaraan yang sudah dihapus.`});
}
if(s.accountId && !accIds.has(s.accountId)){
issues.push({level:'warn',title:'Catatan servis dengan akun tidak valid',detail:`Servis "${s.item||'?'}" tgl ${s.date||'?'} menunjuk ke akun yang sudah dihapus.`});
}
if(s.txLinkId && !txIds.has(s.txLinkId)){
issues.push({level:'warn',title:'Catatan servis kehilangan transaksi tertaut',detail:`Servis "${s.item||'?'}" tgl ${s.date||'?'} seharusnya tertaut ke transaksi keuangan, tapi transaksinya tidak ditemukan.`});
}
});
D.products.forEach(p=>{
if((p.stock||0)<0){
issues.push({level:'error',title:'Stok produk minus',detail:`"${escapeHtml(p.name)}" stoknya ${p.stock} (minus). Cek riwayat transaksi Shop terkait.`});
}
});
const prodIds=new Set(D.products.map(p=>p.id));
(D.cobek||[]).forEach(c=>{
(c.items||[]).forEach(it=>{
if(it.productId && !prodIds.has(it.productId)){
issues.push({level:'error',title:'Transaksi Shop dengan produk tidak valid',detail:`Transaksi Shop tgl ${c.date||'?'} (pelanggan: ${(c.customer&&c.customer.name)||'-'}) berisi item "${it.name||it.productId}" yang produknya sudah dihapus dari etalase.`});
}
});
if(c.accountId && !accIds.has(c.accountId)){
issues.push({level:'warn',title:'Transaksi Shop dengan akun tidak valid',detail:`Transaksi Shop tgl ${c.date||'?'} menunjuk ke akun yang sudah dihapus.`});
}
if(c.txLinkId && !txIds.has(c.txLinkId)){
issues.push({level:'warn',title:'Transaksi Shop kehilangan transaksi tertaut',detail:`Transaksi Shop tgl ${c.date||'?'} seharusnya tertaut ke transaksi keuangan, tapi transaksinya tidak ditemukan.`});
}
});
(D.workDays||[]).forEach(w=>{
if(!w.date || isNaN(new Date(w.date).getTime())){
issues.push({level:'error',title:'Absensi dengan tanggal tidak valid',detail:`Catatan absensi (ID ${w.id}) punya tanggal kosong/rusak.`});
}
if(w.total==null || isNaN(w.total) || w.total<0){
issues.push({level:'error',title:'Absensi dengan total gaji tidak valid',detail:`Absensi tgl ${w.date||'?'} punya total gaji kosong/negatif/rusak.`});
}
});
const wsIds=new Set(),dupWsIds=[],wsDates=new Set(),dupWsDates=[];
(D.wealthSnapshots||[]).forEach(s=>{
if(wsIds.has(s.id))dupWsIds.push(s.id); else wsIds.add(s.id);
if(wsDates.has(s.date))dupWsDates.push(s.date); else wsDates.add(s.date);
if(!s.date || isNaN(new Date(s.date).getTime())){
issues.push({level:'error',title:'Snapshot kekayaan dengan tanggal tidak valid',detail:`Snapshot (ID ${s.id}) punya tanggal kosong/rusak.`});
}
if(s.netWorth==null || isNaN(s.netWorth)){
issues.push({level:'error',title:'Snapshot kekayaan dengan nilai tidak valid',detail:`Snapshot tgl ${s.date||'?'} punya nilai Kekayaan Bersih kosong/rusak (bukan angka). Ini bisa bikin CAGR ikut rusak.`});
}
});
if(dupWsIds.length){
issues.push({level:'error',title:'ID snapshot kekayaan duplikat',detail:`${dupWsIds.length} snapshot punya ID yang sama (kemungkinan dari restore/sync yang tidak bersih). ID: ${[...new Set(dupWsIds)].slice(0,5).join(', ')}${dupWsIds.length>5?'...':''}`});
}
if(dupWsDates.length){
issues.push({level:'warn',title:'Tanggal snapshot kekayaan duplikat',detail:`${dupWsDates.length} tanggal punya lebih dari 1 snapshot (seharusnya cuma 1 snapshot per tanggal). Tanggal: ${[...new Set(dupWsDates)].slice(0,5).join(', ')}${dupWsDates.length>5?'...':''}. Ini bisa bikin CAGR keliru karena tidak jelas snapshot mana yang dipakai sbg titik data.`});
}
const lbIds=new Set(),dupLbIds=[],lbDates=new Set(),dupLbDates=[];
(D.lifeBalanceSnapshots||[]).forEach(s=>{
if(lbIds.has(s.id))dupLbIds.push(s.id); else lbIds.add(s.id);
if(lbDates.has(s.date))dupLbDates.push(s.date); else lbDates.add(s.date);
if(!s.date || isNaN(new Date(s.date).getTime())){
issues.push({level:'error',title:'Snapshot Skor Hidup Seimbang dengan tanggal tidak valid',detail:`Snapshot (ID ${s.id}) punya tanggal kosong/rusak.`});
}
if(s.score==null || isNaN(s.score) || s.score<0 || s.score>100){
issues.push({level:'error',title:'Snapshot Skor Hidup Seimbang dengan nilai tidak valid',detail:`Snapshot tgl ${s.date||'?'} punya skor kosong/rusak/luar rentang 0-100.`});
}
});
if(dupLbIds.length){
issues.push({level:'error',title:'ID snapshot Skor Hidup Seimbang duplikat',detail:`${dupLbIds.length} snapshot punya ID yang sama (kemungkinan dari restore/sync yang tidak bersih). ID: ${[...new Set(dupLbIds)].slice(0,5).join(', ')}${dupLbIds.length>5?'...':''}`});
}
if(dupLbDates.length){
issues.push({level:'warn',title:'Tanggal snapshot Skor Hidup Seimbang duplikat',detail:`${dupLbDates.length} tanggal punya lebih dari 1 snapshot (seharusnya cuma 1 per tanggal). Tanggal: ${[...new Set(dupLbDates)].slice(0,5).join(', ')}${dupLbDates.length>5?'...':''}.`});
}
(D.piutang||[]).forEach(p=>{
if(!p.name || !p.name.trim()){
issues.push({level:'error',title:'Piutang tanpa nama peminjam',detail:`Catatan piutang (ID ${p.id}) tidak punya nama peminjam.`});
}
if(p.nilai==null || isNaN(p.nilai) || p.nilai<0){
issues.push({level:'error',title:'Piutang dengan nilai tidak valid',detail:`Piutang "${p.name||'?'}" punya nilai kosong/negatif/rusak, ikut memengaruhi Kekayaan Bersih & Zakat Maal.`});
}
if(p.jatuhTempo && isNaN(new Date(p.jatuhTempo).getTime())){
issues.push({level:'warn',title:'Piutang dengan tanggal jatuh tempo tidak valid',detail:`Piutang "${p.name||'?'}" punya tanggal jatuh tempo yang tidak terbaca sebagai tanggal.`});
}
});
(D.partsStock||[]).forEach(p=>{
if((p.qty||0)<0){
issues.push({level:'error',title:'Stok sparepart minus',detail:`"${escapeHtml(p.name)}" stoknya ${p.qty} (minus). Cek riwayat pemakaian di catatan servis.`});
}
});
(D.debts||[]).forEach(d=>{
if(!d.name || !d.name.trim()){
issues.push({level:'error',title:'Utang tanpa nama pemberi pinjaman',detail:`Catatan utang (ID ${d.id}) tidak punya nama pemberi pinjaman.`});
}
if(d.nilai==null || isNaN(d.nilai) || d.nilai<0){
issues.push({level:'error',title:'Utang dengan nilai tidak valid',detail:`Utang "${d.name||'?'}" punya nilai kosong/negatif/rusak, ikut memengaruhi Kekayaan Bersih & Zakat Maal.`});
}
if(d.jatuhTempo && isNaN(new Date(d.jatuhTempo).getTime())){
issues.push({level:'warn',title:'Utang dengan tanggal jatuh tempo tidak valid',detail:`Utang "${d.name||'?'}" punya tanggal jatuh tempo yang tidak terbaca sebagai tanggal.`});
}
});
const catNames=new Set([...D.categories.income,...D.categories.expense].flatMap(c=>[c.id,c.name,...(c.subs||[]).map(s=>s.id)]));
(D.budgets||[]).forEach(b=>{
const ids=b.catIds||(b.catId?[b.catId]:[]);
const invalid=ids.filter(id=>id!=='__total__' && !catNames.has(id));
if(invalid.length){
issues.push({level:'warn',title:'Anggaran dengan kategori tidak valid',detail:`Anggaran "${escapeHtml(b.name)}" merujuk ke kategori yang sudah dihapus/diubah. Buka & simpan ulang anggaran ini untuk memperbaiki.`});
}
});
(D.wishlist||[]).forEach(w=>{
if(!w.name || !w.name.trim()){
issues.push({level:'error',title:'Barang Prioritas Belanja tanpa nama',detail:`Item wishlist (ID ${w.id}) tidak punya nama.`});
}
if(w.price==null || isNaN(w.price) || w.price<=0){
issues.push({level:'error',title:'Barang Prioritas Belanja dengan harga tidak valid',detail:`"${w.name||'?'}" punya harga kosong/0/negatif/rusak.`});
}
if(w.isDiskon && (w.hargaNormal==null || isNaN(w.hargaNormal) || w.hargaNormal<=(w.price||0))){
issues.push({level:'warn',title:'Barang Prioritas Belanja dengan info diskon tidak konsisten',detail:`"${w.name||'?'}" ditandai diskon tapi harga normalnya kosong/lebih kecil-sama dgn harga bayar. Skor prioritasnya bisa jadi kurang akurat.`});
}
if(w.bought && w.txId && !txIds.has(w.txId)){
issues.push({level:'warn',title:'Barang "Sudah Beli" kehilangan transaksi tertaut',detail:`"${w.name||'?'}" ditandai sudah dibeli & tertaut ke transaksi keuangan, tapi transaksinya tidak ditemukan (mungkin terhapus di luar jalur normal). Buka Prioritas Belanja → Sudah Dibeli → ↺ buat kembalikan barang ini ke list aktif kalau memang belum jadi dibeli.`});
}
if(w.bought && !w.txId){
issues.push({level:'warn',title:'Barang "Sudah Beli" tanpa transaksi tertaut',detail:`"${w.name||'?'}" berstatus sudah dibeli tapi tidak punya catatan transaksi terkait di Keuangan (kemungkinan data lama dari sebelum fitur sync 2 arah ditambahkan).`});
}
});
const wlDupCheck=new Map();
(D.wishlist||[]).filter(w=>!w.bought).forEach(w=>{
const key=(w.name||'').trim().toLowerCase();
if(!key)return;
wlDupCheck.set(key,(wlDupCheck.get(key)||0)+1);
});
const wlDupNames=[...wlDupCheck.entries()].filter(([,c])=>c>1).map(([n])=>n);
if(wlDupNames.length){
issues.push({level:'warn',title:'Barang Prioritas Belanja kemungkinan duplikat',detail:`Nama barang yang sama muncul lebih dari 1x di list aktif: ${wlDupNames.slice(0,5).join(', ')}${wlDupNames.length>5?'...':''}. Cek apakah memang 2 barang berbeda atau kepencet tambah dobel.`});
}
const errCount=issues.filter(i=>i.level==='error').length;
const warnCount=issues.filter(i=>i.level==='warn').length;
const summaryEl=document.getElementById('dataHealthSummary');
const listEl=document.getElementById('dataHealthList');
if(!issues.length){
summaryEl.innerHTML='✅ Tidak ditemukan masalah. Data terlihat sehat!';
listEl.innerHTML='';
} else {
summaryEl.innerHTML=`Ditemukan <b>${errCount} error</b> & <b>${warnCount} peringatan</b> dari ${D.transactions.length} transaksi, ${D.bbmLogs.length+D.servisLogs.length} catatan kendaraan, ${(D.cobek||[]).length} transaksi Shop, ${(D.workDays||[]).length} catatan absensi, ${(D.wealthSnapshots||[]).length} snapshot kekayaan, ${(D.piutang||[]).length} piutang, ${(D.debts||[]).length} utang, ${(D.budgets||[]).length} anggaran, ${(D.lifeBalanceSnapshots||[]).length} snapshot Skor Hidup Seimbang & ${(D.wishlist||[]).length} barang Prioritas Belanja.`;
listEl.innerHTML=issues.map(i=>`<div style="padding:10px;border-radius:10px;margin-bottom:8px;background:${i.level==='error'?'var(--accent2-soft)':'var(--accent4-soft)'}">
      <div style="font-weight:700;font-size:13px;color:${i.level==='error'?'var(--accent2)':'var(--accent4)'}">${i.level==='error'?'❌':'⚠️'} ${escapeHtml(i.title)}</div>
      <div class="u-fs12 u-t2 u-mt2">${escapeHtml(i.detail)}</div>
    </div>`).join('');
}
openModal('dataHealthModal');
}
let _globalSearchDebounce=null;
function openGlobalSearch(){
document.getElementById('globalSearchInput').value='';
document.getElementById('globalSearchResults').innerHTML='<div class="u-fs12 u-ctext3 u-tac" style="padding:16px 0">Ketik minimal 2 huruf untuk mulai mencari</div>';
openModal('globalSearchModal');
setTimeout(()=>document.getElementById('globalSearchInput').focus(),200);
}
function onGlobalSearchInput(){
clearTimeout(_globalSearchDebounce);
_globalSearchDebounce=setTimeout(runGlobalSearch,200);
}
function goToPageAndClose(page){
closeModal('globalSearchModal');
showPage(page);
}
function runGlobalSearch(){
const q=document.getElementById('globalSearchInput').value.trim().toLowerCase();
const resEl=document.getElementById('globalSearchResults');
if(q.length<2){resEl.innerHTML='<div class="u-fs12 u-ctext3 u-tac" style="padding:16px 0">Ketik minimal 2 huruf untuk mulai mencari</div>';return;}
const groups=[];
const txHits=D.transactions.filter(t=>(t.note||'').toLowerCase().includes(q)||(t.category||'').toLowerCase().includes(q)||(t.subcategory||'').toLowerCase().includes(q)).sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,8);
if(txHits.length)groups.push({title:'💸 Transaksi',page:'keuangan',items:txHits.map(t=>({label:t.note||t.category,sub:`${t.date} · ${t.category}${t.subcategory?' / '+t.subcategory:''}`,amount:(t.type==='income'?'+':'-')+fmt(t.amount)}))});
const billHits=D.bills.filter(b=>(b.name||'').toLowerCase().includes(q)).slice(0,8);
if(billHits.length)groups.push({title:'🧾 Tagihan/Cicilan/Langganan',page:'keuangan',items:billHits.map(b=>({label:b.name,sub:`Jatuh tempo ${b.nextDue} · ${b.freq}`,amount:fmt(b.amount)}))});
const prodHits=D.products.filter(p=>(p.name||'').toLowerCase().includes(q)).slice(0,8);
if(prodHits.length)groups.push({title:'🪨 Produk Shop',page:'cobek',items:prodHits.map(p=>({label:p.name,sub:`Stok ${p.stock}`,amount:fmt(p.hargaJual)}))});
const cobekHits=D.cobek.filter(t=>t.customer&&(t.customer.name||'').toLowerCase().includes(q)).slice(0,8);
if(cobekHits.length)groups.push({title:'🛒 Transaksi Shop',page:'cobek',items:cobekHits.map(t=>({label:t.customer.name,sub:t.date,amount:fmt(t.total)}))});
const servisHits=D.servisLogs.filter(s=>(s.item||'').toLowerCase().includes(q)||(s.note||'').toLowerCase().includes(q)).sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,8);
if(servisHits.length)groups.push({title:'🔧 Catatan Servis',page:'carnotes',items:servisHits.map(s=>({label:s.item,sub:s.date,amount:fmt(s.cost)}))});
const bbmHits=D.bbmLogs.filter(b=>(b.spbu||'').toLowerCase().includes(q)||(b.note||'').toLowerCase().includes(q)).sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,8);
if(bbmHits.length)groups.push({title:'⛽ Catatan BBM',page:'carnotes',items:bbmHits.map(b=>({label:b.spbu||'BBM',sub:b.date,amount:fmt(b.cost)}))});
const targetHits=D.targets.filter(t=>(t.name||'').toLowerCase().includes(q)).slice(0,8);
if(targetHits.length)groups.push({title:'🎯 Target Tabungan',page:'settings',items:targetHits.map(t=>({label:t.name,sub:`${Math.round((t.saved/t.amount)*100)}% tercapai`,amount:fmt(t.amount)}))});
const eduFundHits=(D.eduFunds||[]).filter(f=>(f.name||'').toLowerCase().includes(q)).slice(0,8);
if(eduFundHits.length)groups.push({title:'🎓 Dana Pendidikan',page:'settings',items:eduFundHits.map(f=>{const c=EduFund.calc(f);return{label:f.name,sub:`Target ${f.tahunTarget} · nabung ~${fmt(c.pmtBulanan)}/bln`,amount:fmt(c.fv)};})});
const sewaKiosHits=((D.sewaKios&&D.sewaKios.units)||[]).filter(u=>(u.name||'').toLowerCase().includes(q)||(u.penyewa||'').toLowerCase().includes(q)).slice(0,8);
if(sewaKiosHits.length)groups.push({title:'🏪 Sewa Kios',page:'keuangan',items:sewaKiosHits.map(u=>({label:u.name,sub:u.status==='disewa'?('Disewa: '+(u.penyewa||'-')):'Kosong',amount:fmt(u.hargaSewaBulanan||0)}))});
if(!groups.length){resEl.innerHTML='<div class="empty" style="padding:16px 0"><div class="empty-icon">🔍</div><div class="empty-text">Tidak ada hasil untuk "'+escapeHtml(q)+'"</div></div>';return;}
resEl.innerHTML=groups.map(g=>`
    <div class="u-fs12 u-fw700 u-t2 u-pointer" style="margin:10px 0 6px" data-action="goToPageAndClose" data-args="${escapeHtml(JSON.stringify([g.page]))}">${g.title}</div>
    ${g.items.map(it=>`<div class="tx-item u-pointer" data-action="goToPageAndClose" data-args="${escapeHtml(JSON.stringify([g.page]))}">
      <div class="tx-info"><div class="tx-name">${escapeHtml(it.label)}</div><div class="tx-meta">${escapeHtml(it.sub)}</div></div>
      <div class="tx-amount">${escapeHtml(it.amount)}</div>
    </div>`).join('')}
  `).join('');
}
/* moved to modules-render.js: renderGDriveSettings */
const SHEETS_SCHEMAS={
bbmLogs:[
{key:'vehicleId',type:'string'},
{key:'date',type:'string'},
{key:'km',type:'number'},
{key:'liter',type:'number'},
{key:'harga',type:'number'},
{key:'cost',type:'number'},
{key:'spbu',type:'string'},
{key:'fullTank',type:'boolean'},
{key:'note',type:'string'},
{key:'accountId',type:'string'},
{key:'txLinkId',type:'string'},
],
servisLogs:[
{key:'vehicleId',type:'string'},
{key:'date',type:'string'},
{key:'item',type:'string'},
{key:'categoryId',type:'string'},
{key:'km',type:'number'},
{key:'cost',type:'number'},
{key:'note',type:'string'},
{key:'accountId',type:'string'},
{key:'txLinkId',type:'string'},
{key:'usedPartId',type:'string'},
{key:'usedPartQty',type:'number'},
],
kmLogs:[
{key:'vehicleId',type:'string'},
{key:'date',type:'string'},
{key:'km',type:'number'},
{key:'note',type:'string'},
],
partsStock:[
{key:'name',type:'string'},
{key:'catId',type:'string'},
{key:'code',type:'string'},
{key:'qty',type:'number'},
{key:'unit',type:'string'},
{key:'minStock',type:'number'},
{key:'price',type:'number'},
{key:'note',type:'string'},
],
products:[
{key:'name',type:'string'},
{key:'stock',type:'number'},
{key:'kategoriId',type:'string'},
{key:'produsenId',type:'string'},
{key:'hargaBeli',type:'number'},
{key:'hargaJual',type:'number'},
{key:'hargaReseller',type:'number'},
{key:'diskonPersen',type:'number'},
{key:'hargaByProdusen',type:'json'},
],
cobek:[
{key:'date',type:'string'},
{key:'items',type:'json'},
{key:'priceType',type:'string'},
{key:'customer',type:'json'},
{key:'subtotal',type:'number'},
{key:'diskon',type:'number'},
{key:'ongkir',type:'number'},
{key:'total',type:'number'},
{key:'profit',type:'number'},
{key:'accountId',type:'string'},
{key:'txLinkId',type:'string'},
{key:'delivered',type:'boolean'},
{key:'note',type:'string'},
],
transactions:[
{key:'type',type:'string'},
{key:'amount',type:'number'},
{key:'category',type:'string'},
{key:'subcategory',type:'string'},
{key:'accountId',type:'string'},
{key:'payMethod',type:'string'},
{key:'note',type:'string'},
{key:'date',type:'string'},
{key:'billLinkId',type:'string'},
{key:'stockProductId',type:'string'},
{key:'stockQty',type:'number'},
{key:'stockItems',type:'json'},
{key:'produsenId',type:'string'},
{key:'kategoriId',type:'string'},
{key:'cobekLinkId',type:'string'},
{key:'bbmLinkId',type:'string'},
{key:'servisLinkId',type:'string'},
],
bills:[
{key:'name',type:'string'},
{key:'amount',type:'number'},
{key:'nextDue',type:'string'},
{key:'freq',type:'string'},
{key:'sisaTenor',type:'number'},
{key:'category',type:'string'},
{key:'subcategory',type:'string'},
{key:'accountId',type:'string'},
{key:'note',type:'string'},
{key:'kind',type:'string'},
{key:'totalHarga',type:'number'},
{key:'tenor',type:'number'},
{key:'bunga',type:'number'},
{key:'shared',type:'boolean'},
{key:'sharedPct',type:'number'},
{key:'totalAmount',type:'number'},
{key:'taxLink',type:'json'},
],
targets:[
{key:'name',type:'string'},
{key:'amount',type:'number'},
{key:'saved',type:'number'},
{key:'accountId',type:'string'},
{key:'emoji',type:'string'},
{key:'isDanaDarurat',type:'boolean'},
],
eduFunds:[
{key:'name',type:'string'},
{key:'biayaHariIni',type:'number'},
{key:'tahunTarget',type:'number'},
{key:'inflasi',type:'number'},
{key:'returnAsumsi',type:'number'},
{key:'accountId',type:'string'},
{key:'terkumpul',type:'number'},
],
workDays:[
{key:'date',type:'string'},
{key:'masuk',type:'string'},
{key:'pulang',type:'string'},
{key:'istMulai',type:'string'},
{key:'istSelesai',type:'string'},
{key:'istirahatMin',type:'number'},
{key:'totalJam',type:'number'},
{key:'jamLembur',type:'number'},
{key:'jenis',type:'string'},
{key:'pokok',type:'number'},
{key:'lembur',type:'number'},
{key:'total',type:'number'},
{key:'gajiHariInput',type:'number'},
],
};
const SHEETS_MODULES=['transactions','cobek','bbmLogs','servisLogs','kmLogs','partsStock','products','bills','targets','eduFunds','workDays'];
function sheetsColLetter(n){
let s='';
while(n>0){ const m=(n-1)%26; s=String.fromCharCode(65+m)+s; n=Math.floor((n-1)/26); }
return s;
}
function sheetsHeaderFor(modKey){
const schema=SHEETS_SCHEMAS[modKey];
return schema? ['id','updatedAt',...schema.map(f=>f.key)] : ['id','updatedAt','data'];
}
function sheetsLastColFor(modKey){
const schema=SHEETS_SCHEMAS[modKey];
return sheetsColLetter(2+(schema?schema.length:1));
}
function sheetsItemToCells(modKey,item){
const schema=SHEETS_SCHEMAS[modKey];
const {id,...rest}=item;
if(!schema) return [JSON.stringify(rest)];
return schema.map(f=>{
const v=rest[f.key];
if(v===undefined||v===null||v==='') return '';
if(f.type==='number') return (typeof v==='number')?v:(Number(v)||'');
if(f.type==='boolean') return !!v;
if(f.type==='json') return JSON.stringify(v);
return String(v);
});
}
function sheetsCellsToItem(modKey,id,cells){
const schema=SHEETS_SCHEMAS[modKey];
if(!schema){
const rest=cells[0]?JSON.parse(cells[0]):{};
return {id,...rest};
}
const item={id};
schema.forEach((f,i)=>{
const raw=cells[i];
if(raw===undefined||raw===''||raw===null){ item[f.key]=(f.type==='number')?null:(f.type==='boolean'?false:(f.type==='json'?null:'')); return; }
if(f.type==='number') item[f.key]=(typeof raw==='number')?raw:parseFloat(raw);
else if(f.type==='boolean') item[f.key]=(raw===true||raw==='TRUE'||raw==='true');
else if(f.type==='json'){ try{ item[f.key]=JSON.parse(raw); }catch(e){ item[f.key]=null; } }
else item[f.key]=String(raw);
});
return item;
}
function sheetsSaveSpreadsheetId(){
let v=document.getElementById('gsSpreadsheetId').value.trim();
const m=v.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
if(m) v=m[1];
D.googleSheets.spreadsheetId=v;
save();
}
