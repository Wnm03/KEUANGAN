// payroll-absensi.js — Payroll: Absensi Harian & Kalkulator Gaji Mingguan (const Payroll={...})
// (v93): dipindah dari backup-restore.js — domain ini sudah rapi
// sbg 1 objek modul (mirip LinkTx/Renov/Aset), jadi dipisah jadi file domain sendiri, bukan digabung
// ke file lain. Lihat PEMISAHAN-FILE-ROADMAP.md.
// PENTING: file ini HARUS dimuat sesuai urutan build.js (GROUP_A/GROUP_B) karena beberapa modul saling referensi. Urutan grup ini: data-default.js, features-helpers-global-security.js, diagnostik-versi.js, format-tema.js, error-handler.js, helper-teks.js, keamanan-pin.js, modal-navigasi.js, reset-gaji-mingguan.js, debug-console.js, pengaturan-search.js, onboarding.js, kalkulator-input.js, scan-ocr.js, filter-laporan.js, akun.js, gaji-calc.js, transaksi.js, profil-pengaturan.js, kategori.js, tagihan-kalender.js, backup-restore.js, payroll-absensi.js, features-tukang-kendaraan-storage.js, features-aiwidget-reminder-gdrive-search.js, features-sheets-pwa-selftest.js

const Payroll={
weekStart:getWeekRange(new Date()).start,
editId:null,
selectedGridDate:null,
timeToMinutes(t){if(!t)return 0;const[h,m]=t.split(':').map(Number);return h*60+m;},
setWhTab(tab){
const isAbsensi=tab==='absensi';
const aBtn=document.getElementById('whTabAbsensiBtn'), kBtn=document.getElementById('whTabKalkulatorBtn');
const aWrap=document.getElementById('whTabAbsensiWrap'), kWrap=document.getElementById('whTabKalkulatorWrap');
if(aBtn){aBtn.style.background=isAbsensi?'var(--accent)':'transparent';aBtn.style.color=isAbsensi?'#fff':'var(--text2)';}
if(kBtn){kBtn.style.background=!isAbsensi?'var(--accent)':'transparent';kBtn.style.color=!isAbsensi?'#fff':'var(--text2)';}
if(aWrap)aWrap.classList.toggle('u-dnone',!isAbsensi);
if(kWrap)kWrap.classList.toggle('u-dnone',isAbsensi);
},
openAbsensiModal(){
Payroll.editId=null;
Payroll.setWhTab('absensi');
const hintEl=document.getElementById('whEditHint');
if(hintEl)hintEl.style.display='none';
const saveBtnEl=document.getElementById('whSaveBtn');
if(saveBtnEl)saveBtnEl.textContent='+ Tambah ke Absensi Minggu Ini';
document.getElementById('whDate').value=new Date().toISOString().split('T')[0];
document.getElementById('whGaji').value=D.profile.gajiPokok||'';
const whIstMulaiEl=document.getElementById('whIstMulai'); if(whIstMulaiEl)whIstMulaiEl.value='12:00';
const whIstSelesaiEl=document.getElementById('whIstSelesai'); if(whIstSelesaiEl)whIstSelesaiEl.value='13:00';
const whBorTotalEl=document.getElementById('whBorTotal'); if(whBorTotalEl)whBorTotalEl.value='';
const whBorNoteEl=document.getElementById('whBorNote'); if(whBorNoteEl)whBorNoteEl.value='';
document.getElementById('whJenisHari').value='biasa';
Payroll.onJenisHariChange();
const targetEl=document.getElementById('pyTargetBulanan');
if(targetEl)targetEl.value=D.profile.targetGajiBulanan||'';
const rekoBoxEl=document.getElementById('pyRateRekoBox');
if(rekoBoxEl){rekoBoxEl.style.display='none';rekoBoxEl.innerHTML='';}
if(D.profile.targetGajiBulanan)Payroll.renderRateRecommendation();
Payroll.weekStart=getWeekRange(new Date()).start;
const mingguOptEl=document.getElementById('whJenisMingguOpt');
if(mingguOptEl)mingguOptEl.textContent='Hari Minggu ('+fmt(D.profile.tarifMinggu||139000)+')';
Payroll.renderWorkDays();
openModal('absensiModal');
},
onJenisHariChange(){
const jenis=document.getElementById('whJenisHari').value;
const isBorongan=jenis==='borongan';
const jamWrap=document.getElementById('whJamFieldsWrap');
const borWrap=document.getElementById('whBorFieldsWrap');
const gajiWrap=document.getElementById('whGajiWrap');
if(jamWrap)jamWrap.classList.toggle('u-dnone',isBorongan);
if(borWrap)borWrap.classList.toggle('u-dnone',!isBorongan);
if(gajiWrap)gajiWrap.classList.toggle('u-dnone',isBorongan);
},
changeAbsensiWeek(dir){
const d=new Date(Payroll.weekStart);
d.setDate(d.getDate()+7*dir);
Payroll.weekStart=getWeekRange(d).start;
const now=new Date();
const {start:curStart}=getWeekRange(now);
const isCurrentWeek=(Payroll.weekStart.getTime()===curStart.getTime());
const whDateEl=document.getElementById('whDate');
if(whDateEl)whDateEl.value=isCurrentWeek?dateToISO(now):dateToISO(Payroll.weekStart);
Payroll.renderWorkDays();
},
addWorkDay(){
const date=document.getElementById('whDate').value;
const jenis=document.getElementById('whJenisHari').value;
if(!date){toast('⚠️ Lengkapi tanggal');return;}
if(jenis==='borongan'){
const borNoteEl=document.getElementById('whBorNote');
const borNote=borNoteEl?borNoteEl.value.trim():'';
const borTotal=parsePzNum(document.getElementById('whBorTotal').value);
if(!borTotal||borTotal<=0){toast('⚠️ Isi total upah borongan/trip');return;}
const total=Math.round(borTotal);
if(Payroll.editId!==null){
D.workDays=D.workDays.filter(w=>w.id!==Payroll.editId&&w.date!==date);
} else {
D.workDays=D.workDays.filter(w=>w.date!==date);
}
D.workDays.push({id:Payroll.editId!==null?Payroll.editId:uid(),date,masuk:'',pulang:'',istMulai:'',istSelesai:'',istirahatMin:0,totalJam:0,jamLembur:0,jenis,pokok:total,lembur:0,total,borNote,gajiHariInput:null});
const wasEdit=Payroll.editId!==null;
Payroll.cancelEditWorkDay();
save();Payroll.renderWorkDays();toast(wasEdit?'✅ Absensi diperbarui: '+fmtFull(total):'✅ Absensi borongan tersimpan: '+fmtFull(total));
return;
}
const masuk=document.getElementById('whMasuk').value;
const pulang=document.getElementById('whPulang').value;
const istMulaiStr=document.getElementById('whIstMulai').value||'12:00';
const istSelesaiStr=document.getElementById('whIstSelesai').value||'13:00';
const gajiHari=parseInt(document.getElementById('whGaji').value)||D.profile.gajiPokok||65000;
if(!masuk||!pulang){toast('⚠️ Lengkapi tanggal & jam kerja');return;}
let totalMinKotor=Payroll.timeToMinutes(pulang)-Payroll.timeToMinutes(masuk);
if(totalMinKotor<0)totalMinKotor+=24*60;
const istMulai=Payroll.timeToMinutes(istMulaiStr);
let istSelesai=Payroll.timeToMinutes(istSelesaiStr);
if(istSelesai<istMulai)istSelesai+=24*60;
const masukMin=Payroll.timeToMinutes(masuk);
let pulangMin=Payroll.timeToMinutes(pulang);
if(pulangMin<masukMin) pulangMin+=24*60;
const overlapStart=Math.max(masukMin,istMulai);
const overlapEnd=Math.min(pulangMin,istSelesai);
const istirahatMin=Math.max(0,overlapEnd-overlapStart);
const totalMinBersih=totalMinKotor-istirahatMin;
const totalJam=totalMinBersih/60;
const lemburMx=D.profile.lemburMultiplier||1.5;
const tarifMinggu=D.profile.tarifMinggu||139000;
const jamLembur=jenis==='minggu'?0:Math.max(0,totalJam-7);
const pokok=jenis==='minggu'?tarifMinggu:gajiHari;
const upahLemburPerJam=gajiHari/7*lemburMx;
const lembur=jenis==='minggu'?0:jamLembur*upahLemburPerJam;
const total=pokok+lembur;
if(Payroll.editId!==null){
D.workDays=D.workDays.filter(w=>w.id!==Payroll.editId&&w.date!==date);
} else {
D.workDays=D.workDays.filter(w=>w.date!==date);
}
D.workDays.push({id:Payroll.editId!==null?Payroll.editId:uid(),date,masuk,pulang,istMulai:istMulaiStr,istSelesai:istSelesaiStr,istirahatMin,totalJam:Math.round(totalJam*100)/100,jamLembur:Math.round(jamLembur*100)/100,jenis,pokok,lembur:Math.round(lembur),total:Math.round(total),gajiHariInput:gajiHari,borNote:''});
const wasEdit=Payroll.editId!==null;
Payroll.cancelEditWorkDay();
save();Payroll.renderWorkDays();toast(wasEdit?'✅ Absensi diperbarui: '+fmtFull(total):'✅ Absensi tersimpan: '+fmtFull(total));
},
editWorkDay(id){
const w=D.workDays.find(x=>x.id===id);
if(!w)return;
Payroll.editId=id;
Payroll.selectedGridDate=w.date;
Payroll.renderWeekGrid();
Payroll.setWhTab('absensi');
document.getElementById('whDate').value=w.date;
document.getElementById('whMasuk').value=w.masuk||'07:00';
document.getElementById('whPulang').value=w.pulang||'15:00';
document.getElementById('whIstMulai').value=w.istMulai||'12:00';
document.getElementById('whIstSelesai').value=w.istSelesai||'13:00';
document.getElementById('whJenisHari').value=w.jenis||'biasa';
document.getElementById('whGaji').value=(w.gajiHariInput!=null?w.gajiHariInput:w.pokok)||D.profile.gajiPokok||'';
const whBorTotalEl=document.getElementById('whBorTotal'); if(whBorTotalEl)whBorTotalEl.value=w.jenis==='borongan'?w.total:'';
const whBorNoteEl=document.getElementById('whBorNote'); if(whBorNoteEl)whBorNoteEl.value=w.borNote||'';
Payroll.onJenisHariChange();
document.getElementById('whEditHint').style.display='block';
document.getElementById('whEditDateLabel').textContent=new Date(w.date).toLocaleDateString('id-ID',{weekday:'short',day:'numeric',month:'short'});
document.getElementById('whSaveBtn').textContent='💾 Update Absensi';
document.getElementById('whDate').scrollIntoView({behavior:'smooth',block:'center'});
},
cancelEditWorkDay(dateOverride){
Payroll.editId=null;
document.getElementById('whEditHint').style.display='none';
document.getElementById('whSaveBtn').textContent='+ Tambah ke Absensi Minggu Ini';
document.getElementById('whGaji').value=D.profile.gajiPokok||'';
document.getElementById('whMasuk').value='07:00';
document.getElementById('whPulang').value='15:00';
document.getElementById('whIstMulai').value='12:00';
document.getElementById('whIstSelesai').value='13:00';
document.getElementById('whJenisHari').value='biasa';
const whBorTotalEl2=document.getElementById('whBorTotal'); if(whBorTotalEl2)whBorTotalEl2.value='';
const whBorNoteEl2=document.getElementById('whBorNote'); if(whBorNoteEl2)whBorNoteEl2.value='';
Payroll.onJenisHariChange();
if(dateOverride){
document.getElementById('whDate').value=dateOverride;
Payroll.selectedGridDate=dateOverride;
Payroll.renderWeekGrid();
return;
}
const now=new Date();
const {start:curStart}=getWeekRange(now);
const isCurrentWeek=(Payroll.weekStart.getTime()===curStart.getTime());
const newDate=isCurrentWeek?dateToISO(now):dateToISO(Payroll.weekStart);
document.getElementById('whDate').value=newDate;
Payroll.selectedGridDate=newDate;
Payroll.renderWeekGrid();
},
async delWorkDay(id){
if(!await askConfirm('Hapus catatan absensi ini?'))return;
D.workDays=D.workDays.filter(w=>w.id!==id);
if(Payroll.editId===id)Payroll.cancelEditWorkDay();
save();Payroll.renderWorkDays();toast('🗑 Absensi dihapus');
},
renderWorkDays(){
const start=new Date(Payroll.weekStart);
const end=new Date(start); end.setDate(start.getDate()+6); end.setHours(23,59,59,999);
const now=new Date();
const {start:curStart}=getWeekRange(now);
const isCurrentWeek=(start.getTime()===curStart.getTime());
const labelEl=document.getElementById('absensiWeekLabel');
if(labelEl){
const fmtShort=d=>d.toLocaleDateString('id-ID',{day:'numeric',month:'short'});
labelEl.textContent=fmtShort(start)+' – '+fmtShort(end)+(isCurrentWeek?' (Ini)':'');
}
const thisWeek=D.workDays.filter(w=>{const d=new Date(w.date);return d>=start&&d<=end;}).sort((a,b)=>new Date(b.date)-new Date(a.date));
const total=thisWeek.reduce((s,w)=>s+w.total,0);
const totalPokok=thisWeek.reduce((s,w)=>s+w.pokok,0);
const totalLembur=thisWeek.reduce((s,w)=>s+w.lembur,0);
const resEl=document.getElementById('gajiResult');
if(thisWeek.length){
resEl.style.display='block';
document.getElementById('whCount').textContent=thisWeek.length;
document.getElementById('gajiTotal').textContent=fmtFull(total);
document.getElementById('gajiDetail').innerHTML=`<div class="gaji-row"><span>Total gaji pokok</span><span>${fmtFull(totalPokok)}</span></div><div class="gaji-row"><span>Total lembur</span><span>${fmtFull(totalLembur)}</span></div>`;
const syncBoxEl=document.getElementById('gajiSyncBox');
if(syncBoxEl){
const isCurW=isCurrentWeek;
syncBoxEl.innerHTML=isCurW?`<button class="btn btn-income btn-full btn-sm" data-action="openWeeklyResetManual">💰 Sudah Gajian? Catat & Reset Minggu Ini</button>`:'';
}
} else resEl.style.display='none';
const listEl=document.getElementById('whList');
if(!listEl)return;
listEl.innerHTML=thisWeek.length?thisWeek.map(w=>`
      <div class="wh-day-item u-pointer" data-action="editWorkDay" data-args="${escapeHtml(JSON.stringify([w.id]))}">
        <div class="wh-day-info">
          <div class="wh-day-date">${new Date(w.date).toLocaleDateString('id-ID',{weekday:'short',day:'numeric',month:'short'})} ${w.jenis==='minggu'?'🔴':''}${w.jenis==='borongan'?'📦':''} <span class="u-fs10 u-t2 u-fw400">✏️</span></div>
          <div class="wh-day-time">${w.jenis==='borongan'?'Borongan/Per-Trip'+(w.borNote?' · '+escapeHtml(w.borNote):''):w.masuk+'–'+w.pulang+' ('+w.totalJam+' jam'+(w.jamLembur>0?', lembur '+w.jamLembur+' jam':'')+')'}</div>
        </div>
        <div class="wh-day-pay">${fmtFull(w.total)}</div>
        <button class="tx-del" data-stop="1" data-action="delWorkDay" data-args="${escapeHtml(JSON.stringify([w.id]))}" aria-label="Hapus">🗑</button>
      </div>`).join(''):'<div class="empty"><div class="empty-text">Belum ada absensi dicatat di minggu ini</div></div>';
Payroll.renderWeekGrid();
},
renderWeekGrid(){
const start=new Date(Payroll.weekStart);
const days=[];for(let i=0;i<7;i++){const d=new Date(start);d.setDate(start.getDate()+i);days.push(d);}
const dowShort=['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
const gridEl=document.getElementById('whWeekGrid');
if(!gridEl)return;
const today=todayStr();
if(!Payroll.selectedGridDate){
const {start:curStart2}=getWeekRange(new Date());
if(Payroll.weekStart.getTime()===curStart2.getTime())Payroll.selectedGridDate=today;
}
gridEl.innerHTML=days.map(d=>{
const iso=dateToISO(d);
const entry=D.workDays.find(w=>w.date===iso);
let label='·',bg='var(--surface3)',color='var(--text3)';
if(entry){
if(entry.jenis==='borongan'){
label='📦';bg='var(--accent2-soft)';color='var(--accent2)';
} else {
const totalJam=entry.totalJam||0;
label=(totalJam%1===0?totalJam:totalJam.toFixed(1))+'j';
bg=entry.jamLembur>0?'var(--accent4-soft)':'var(--accent3-soft)';
color=entry.jamLembur>0?'var(--accent4)':'var(--accent3)';
}
}
const isToday=iso===today;
const isSelected=iso===Payroll.selectedGridDate;
const jamLabel=entry&&entry.jenis==='borongan'?` borongan ${fmtFull(entry.total)}`:(entry&&entry.masuk&&entry.pulang?` ${entry.masuk}–${entry.pulang}`:'');
return `<div data-wh-day="1" data-wh-date="${iso}" class="wh-day-box${isToday?' is-today':''}${isSelected?' selected':''}" title="${dowShort[d.getDay()]} ${iso}${jamLabel}">
<div class="wh-day-box-dow">${dowShort[d.getDay()]}</div>
<div class="wh-day-box-date">${d.getDate()}</div>
<div class="wh-day-box-status" style="background:${bg};color:${color}">${label}</div>
</div>`;
}).join('');
if(!gridEl._whDelegated){
gridEl._whDelegated=true;
gridEl.addEventListener('click',(e)=>{
const dayEl=e.target.closest('[data-wh-day]');
if(!dayEl)return;
Payroll.selectGridDay(dayEl.getAttribute('data-wh-date'));
});
}
},
selectGridDay(iso){
Payroll.selectedGridDate=iso;
Payroll.renderWeekGrid();
const d=new Date(iso+'T00:00:00');
const dLabel=d.toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long'});
const entry=D.workDays.find(w=>w.date===iso);
if(entry){
const ringkas=entry.jenis==='borongan'?`📦 Borongan${entry.borNote?' · '+entry.borNote:''} · ${fmtFull(entry.total)}`:`⏰ ${entry.masuk}–${entry.pulang} (${entry.totalJam} jam${entry.jamLembur>0?', lembur '+entry.jamLembur+' jam':''}) · ${fmtFull(entry.total)}`;
toast(`📅 ${dLabel}: ${ringkas}`);
Payroll.editWorkDay(entry.id);
return;
}
toast(`📅 ${dLabel}: belum ada absensi. Isi form di bawah untuk menambahkan.`);
Payroll.cancelEditWorkDay(iso);
const dateEl=document.getElementById('whDate');
if(dateEl)dateEl.scrollIntoView({behavior:'smooth',block:'center'});
},
recommendRate(targetBulanan){
const recent=(D.workDays||[]).filter(w=>w.jenis!=='borongan').slice(-30);
const avgJam=recent.length?recent.reduce((s,w)=>s+(w.totalJam||0),0)/recent.length:7;
const currentGajiHari=D.profile.gajiPokok||0;
const idealWorkDaysPerWeek=5;
const idealWorkDaysPerMonth=Math.round(idealWorkDaysPerWeek*(30/7));
const requiredPerDay=targetBulanan/idealWorkDaysPerMonth;
const requiredPerJam=requiredPerDay/(avgJam||7);
const daysNeededAtCurrentRate=currentGajiHari>0?Math.ceil(targetBulanan/currentGajiHari):null;
const overworkRisk=daysNeededAtCurrentRate!=null&&daysNeededAtCurrentRate>idealWorkDaysPerMonth;
return{avgJam,currentGajiHari,idealWorkDaysPerMonth,requiredPerDay,requiredPerJam,daysNeededAtCurrentRate,overworkRisk,targetBulanan};
},
saveTargetBulanan(){
const el=document.getElementById('pyTargetBulanan');
if(!el)return;
const val=parsePzNum(el.value);
D.profile.targetGajiBulanan=val>0?val:null;
save();
},
renderRateRecommendation(){
const box=document.getElementById('pyRateRekoBox');
if(!box)return;
Payroll.saveTargetBulanan();
const target=D.profile.targetGajiBulanan;
if(!target||target<=0){
box.style.display='none';box.innerHTML='';
toast('⚠️ Isi target pemasukan bulanan dulu');
return;
}
const r=Payroll.recommendRate(target);
box.style.display='block';
let html=`<div class="u-fs12 u-lh16">`;
html+=`💡 Supaya tetap ada <b>≥2 hari libur/minggu</b> (maks <b>${r.idealWorkDaysPerMonth} hari kerja/bulan</b>), dengan rata-rata <b>${r.avgJam.toFixed(1)} jam kerja/hari</b> dari histori Absensimu, kamu perlu <b>${fmtFull(r.requiredPerDay)}/hari</b> (≈${fmtFull(r.requiredPerJam)}/jam) untuk capai target ${fmtFull(target)}/bulan.`;
if(r.currentGajiHari>0){
const diff=r.requiredPerDay-r.currentGajiHari;
html+=`<br>Gaji pokok/hari kamu sekarang ${fmtFull(r.currentGajiHari)} — `;
html+=diff>0?`perlu naik ≈${fmtFull(diff)}/hari (${Math.round(diff/r.currentGajiHari*100)}%) supaya capai target tanpa nambah hari kerja.`:`sudah cukup buat capai target di atas ✅.`;
} else {
html+=`<br>ℹ️ Isi dulu "Gaji Pokok/Hari" di atas biar bisa dibandingkan sama tarif kamu sekarang.`;
}
if(r.overworkRisk){
html+=`<br>⚠️ Kalau tarifnya tetap seperti sekarang, kamu perlu kerja ≈<b>${r.daysNeededAtCurrentRate} hari/bulan</b> buat capai target itu — lebih dari batas aman di atas & berisiko bikin skor ⏰ Kerja vs Istirahat turun (kurang hari libur). Lebih baik naikkan tarif/jam daripada terus nambah hari kerja.`;
}
html+='</div>';
if(r.requiredPerDay>0){
html+=`<button type="button" class="btn btn-primary btn-full btn-sm u-mt10" data-action="Payroll.applyRecommendedRate" data-args="${escapeHtml(JSON.stringify([Math.round(r.requiredPerDay)]))}">✅ Pakai Tarif Ini (${fmtFull(Math.round(r.requiredPerDay))}/hari)</button>`;
}
box.innerHTML=html;
},
applyRecommendedRate(amount){
const el=document.getElementById('whGaji');
if(el)el.value=amount;
D.profile.gajiPokok=amount;
save();
toast('✅ Gaji Pokok/Hari diisi '+fmtFull(amount)+' (jadi default absensi baru juga)');
},
renderDashMini(){
const labelEl=document.getElementById('dashAbsensiStatusLabel');
const subEl=document.getElementById('dashAbsensiStatusSub');
const hariEl=document.getElementById('dashAbsensiHariCount');
const gajiEl=document.getElementById('dashAbsensiGajiTotal');
if(!labelEl||!hariEl||!gajiEl)return;
const todayIso=dateToISO(new Date());
const todayEntry=(D.workDays||[]).find(w=>w.date===todayIso);
if(todayEntry){
labelEl.textContent='✅ Sudah absen hari ini';
labelEl.style.color='var(--accent3)';
subEl.textContent=(todayEntry.jenis==='borongan'?'📦 Borongan/Per-Trip':todayEntry.masuk+'–'+todayEntry.pulang)+' · '+fmtFull(todayEntry.total);
} else {
labelEl.textContent='⏰ Belum absen hari ini';
labelEl.style.color='var(--accent4)';
subEl.textContent='Ketuk "+ Isi" untuk catat absensi hari ini';
}
const {start,end}=getWeekRange(new Date());
end.setHours(23,59,59,999);
const thisWeek=(D.workDays||[]).filter(w=>{const d=new Date(w.date);return d>=start&&d<=end;});
const totalGaji=thisWeek.reduce((s,w)=>s+w.total,0);
hariEl.textContent=thisWeek.length;
gajiEl.textContent=fmtFull(totalGaji);
}
};
function timeToMinutes(t){return Payroll.timeToMinutes(t);}
function addWorkDay(){return Payroll.addWorkDay();}
function editWorkDay(id){return Payroll.editWorkDay(id);}
function cancelEditWorkDay(){return Payroll.cancelEditWorkDay();}
function delWorkDay(id){return Payroll.delWorkDay(id);}
