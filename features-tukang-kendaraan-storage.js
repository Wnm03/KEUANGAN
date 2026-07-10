// features-tukang-kendaraan-storage.js — Dana darurat, keuangan/laporan/grafik, budget, cobek grafik, cashflow forecast, target
// CATATAN: Sparepart (kategori & stok sparepart kendaraan) DIPINDAH ke sini dari features-etalase-piutang-renovai.js (sesi pemisahan domain Sparepart/kendaraan), karena helper matchingVehicleName()/codeFromName() yang dipakainya sudah ada di file ini.
// PENTING: file ini HARUS dimuat sesuai urutan build.js (GROUP_A/GROUP_B) karena beberapa modul saling referensi. Urutan grup ini: features-helpers-global-security.js, diagnostik-versi.js, format-tema.js, error-handler.js, helper-teks.js, keamanan-pin.js, modal-navigasi.js, reset-gaji-mingguan.js, debug-console.js, pengaturan-search.js, onboarding.js, kalkulator-input.js, scan-ocr.js, akun.js, gaji-calc.js, transaksi.js, profil-pengaturan.js, kategori.js, tagihan-kalender.js, backup-restore.js, payroll-absensi.js, features-tukang-kendaraan-storage.js, features-aiwidget-reminder-gdrive-search.js, features-sheets-pwa-selftest.js

/* moved to modules-render.js: renderWorkDays */
const Tukang={
weekStart:getWeekRange(new Date()).start,
_rangeResult:null,
_dayCtx:null,
_pendingPaymentEntryIds:null,
_pendingPaymentRange:null,
_histOpen:{},
toggleWorkerHistory(workerId){
Tukang._histOpen[workerId]=!Tukang._histOpen[workerId];
Tukang.renderAll();
},
async delAbsensiEntry(id){
const a=D.tukangAbsensi.find(x=>sameId(x.id,id));
if(!a)return;
if(a.paidTxId){toast('⚠️ Absensi ini sudah dibayar (tercatat di Keuangan), tidak bisa dihapus di sini');return;}
if(a.renovItemLinkId){toast('⚠️ Absensi ini sudah dipakai di item Renovasi, tidak bisa dihapus di sini');return;}
if(!await askConfirm('Hapus catatan absensi ini?'))return;
D.tukangAbsensi=D.tukangAbsensi.filter(x=>!sameId(x.id,id));
save();Tukang.renderAll();toast('🗑 Absensi dihapus');
},
renderWorkerHistory(w){
const entries=D.tukangAbsensi.filter(a=>a.workerId==w.id).sort((a,b)=>a.date<b.date?1:(a.date>b.date?-1:0));
const isOpen=!!Tukang._histOpen[w.id];
const listHtml=entries.length?entries.map(a=>{
const locked=!!(a.renovItemLinkId||a.paidTxId);
const paidLock=!!a.paidTxId;
const dateLabel=new Date(a.date+'T00:00:00').toLocaleDateString('id-ID',{weekday:'short',day:'numeric',month:'short'});
const detail=a.mode==='borongan'?`📦 Borongan ${fmtFull(a.borTotal)}÷${a.borJumlah} tukang`:`⏰ ${a.masuk}–${a.pulang} (${a.jamKerja} jam${a.jamLembur>0?', lembur '+a.jamLembur+' jam':''})`;
const lockNote=paidLock?' · 💸 sudah dibayar':(locked?' · 🔒 dipakai di Renovasi':'');
return `<div class="wh-day-item${locked?'':' u-pointer'}" ${locked?'':`data-tk-hist-edit="1" data-tk-hist-worker="${w.id}" data-tk-hist-date="${a.date}"`}>
        <div class="wh-day-info">
          <div class="wh-day-date">${dateLabel}${locked?'':' <span class="u-fs10 u-t2 u-fw400">✏️</span>'}</div>
          <div class="wh-day-time">${detail}${lockNote}</div>
        </div>
        <div class="wh-day-pay">${fmtFull(a.upah)}</div>
        ${locked?'':`<button class="tx-del" data-stop="1" data-tk-hist-del="${a.id}" aria-label="Hapus">🗑</button>`}
      </div>`;
}).join(''):'<div class="empty"><div class="empty-text">Belum ada absensi dicatat untuk pekerja ini</div></div>';
return `<div class="u-flex u-jcb u-aic u-pointer" data-tk-hist-toggle="${w.id}" style="margin-top:6px;padding-top:6px;border-top:1px solid var(--border)">
        <span class="u-fs11 u-fw700 u-t2" style="text-transform:uppercase;letter-spacing:.5px">📋 Riwayat Absensi (${entries.length})</span>
        <span class="u-fs11 u-t2">${isOpen?'▲ Tutup':'▼ Lihat'}</span>
      </div>
      ${isOpen?`<div class="u-fdcol u-gap6">${listHtml}</div>`:''}`;
},
openModal(){
Tukang.weekStart=getWeekRange(new Date()).start;
const today=todayStr();
const fromEl=document.getElementById('tkRangeFrom'), toEl=document.getElementById('tkRangeTo');
if(fromEl&&!fromEl.value)fromEl.value=today;
if(toEl&&!toEl.value)toEl.value=today;
document.getElementById('tkRangeTotal').textContent='Rp 0';
document.getElementById('tkRangeDetail').textContent='';
Tukang._rangeResult=null;
Tukang.renderAll();
openModal('tukangModal');
},
changeWeek(dir){
const d=new Date(Tukang.weekStart);
d.setDate(d.getDate()+7*dir);
Tukang.weekStart=getWeekRange(d).start;
Tukang.renderAll();
},
suggestLembur(){
const upahEl=document.getElementById('tkUpahJamBaru');
const lemburEl=document.getElementById('tkUpahLemburJamBaru');
if(!upahEl||!lemburEl||lemburEl.value)return;
const upahJam=parseFloat(upahEl.value)||0;
if(upahJam>0)lemburEl.placeholder='otomatis '+fmtFull(Math.round(upahJam*1.5))+' (1.5×)';
},
addWorker(){
const name=document.getElementById('tkNamaBaru').value.trim();
evalAmtExpr('tkUpahJamBaru');
evalAmtExpr('tkUpahLemburJamBaru');
const upahJam=parseFloat(document.getElementById('tkUpahJamBaru').value)||0;
const jamKerjaNormal=parseFloat(document.getElementById('tkJamKerjaBaru').value)||7;
const upahLemburInput=parseFloat(document.getElementById('tkUpahLemburJamBaru').value)||0;
const upahLemburJam=upahLemburInput>0?upahLemburInput:Math.round(upahJam*1.5);
if(!name){toast('⚠️ Isi nama pekerja');return;}
if(!upahJam||upahJam<=0){toast('⚠️ Isi upah pokok/jam yang valid');return;}
D.tukangWorkers.push({id:uid(),name,upahJam,jamKerjaNormal,upahLemburJam});
document.getElementById('tkNamaBaru').value='';
document.getElementById('tkUpahJamBaru').value='';
document.getElementById('tkJamKerjaBaru').value='7';
document.getElementById('tkUpahLemburJamBaru').value='';
save();Tukang.renderAll();toast('✅ Pekerja "'+name+'" ditambahkan ('+fmtFull(upahJam)+'/jam)');
},
async delWorker(id){
const w=D.tukangWorkers.find(x=>x.id==id);
if(!w)return;
const hasLocked=D.tukangAbsensi.some(a=>a.workerId==id&&a.renovItemLinkId);
if(hasLocked){toast('⚠️ Tidak bisa hapus — "'+w.name+'" masih punya absensi yang sudah dipakai di item Renovasi. Batalkan/hapus dulu item terkait.');return;}
if(!await askConfirm(`Hapus pekerja "${w.name}"? Absensi yang belum dipakai ikut terhapus.`))return;
D.tukangAbsensi=D.tukangAbsensi.filter(a=>a.workerId!=id);
D.tukangWorkers=D.tukangWorkers.filter(x=>x.id!=id);
save();Tukang.renderAll();toast('🗑 Pekerja dihapus');
},
_computeDay(w,masuk,pulang,istMulai,istSelesai){
let masukMin=timeToMinutes(masuk), pulangMin=timeToMinutes(pulang);
if(pulangMin<masukMin) pulangMin+=24*60;
let totalMinKotor=pulangMin-masukMin;
let istirahatMin=0;
if(istMulai&&istSelesai){
let istMulaiMin=timeToMinutes(istMulai), istSelesaiMin=timeToMinutes(istSelesai);
if(istSelesaiMin<istMulaiMin) istSelesaiMin+=24*60;
const overlapStart=Math.max(masukMin,istMulaiMin);
const overlapEnd=Math.min(pulangMin,istSelesaiMin);
istirahatMin=Math.max(0,overlapEnd-overlapStart);
}
const totalJam=Math.max(0,(totalMinKotor-istirahatMin)/60);
const ambangLembur=w.jamKerjaNormal||7;
const jamKerja=Math.min(totalJam,ambangLembur);
const jamLembur=Math.max(0,totalJam-ambangLembur);
const upah=Math.round(jamKerja*w.upahJam+jamLembur*w.upahLemburJam);
return {istirahatMin,totalJam:Math.round(totalJam*100)/100,jamKerja:Math.round(jamKerja*100)/100,jamLembur:Math.round(jamLembur*100)/100,upah};
},
openDayEntry(workerId,dateIso){
const w=D.tukangWorkers.find(x=>x.id==workerId);
if(!w)return;
const entry=D.tukangAbsensi.find(a=>a.workerId==workerId&&a.date==dateIso);
if(entry&&entry.renovItemLinkId){toast('⚠️ Absensi ini sudah dipakai di item Renovasi, tidak bisa diubah di sini');return;}
if(entry&&entry.paidTxId){toast('⚠️ Absensi ini sudah dibayar (tercatat di Keuangan), tidak bisa diubah di sini');return;}
Tukang._dayCtx={workerId,date:dateIso};
document.getElementById('tkDayWorkerName').textContent=w.name;
document.getElementById('tkDayBorWorkerNameInline').textContent=w.name;
const d=new Date(dateIso+'T00:00:00');
document.getElementById('tkDayDateLabel').textContent=d.toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long'});
document.getElementById('tkDayMasuk').value=entry&&entry.masuk?entry.masuk:'08:00';
document.getElementById('tkDayPulang').value=entry&&entry.pulang?entry.pulang:'16:00';
document.getElementById('tkDayIstMulai').value=entry&&entry.istMulai?entry.istMulai:'12:00';
document.getElementById('tkDayIstSelesai').value=entry&&entry.istSelesai?entry.istSelesai:'13:00';
document.getElementById('tkDayBorTotal').value=entry&&entry.mode==='borongan'?entry.borTotal:'';
document.getElementById('tkDayBorJumlah').value=entry&&entry.mode==='borongan'&&entry.borJumlah?entry.borJumlah:1;
document.getElementById('tkDayDelBtn').style.display=entry?'':'none';
Tukang.setDayMode(entry&&entry.mode==='borongan'?'borongan':'jam');
openModal('tkDayModal');
},
setDayMode(mode){
Tukang._dayMode=mode;
const jamBtn=document.getElementById('tkDayModeJamBtn'), borBtn=document.getElementById('tkDayModeBorBtn');
const jamWrap=document.getElementById('tkDayJamWrap'), borWrap=document.getElementById('tkDayBorWrap');
if(mode==='borongan'){
jamBtn.style.background='transparent';jamBtn.style.color='var(--text2)';
borBtn.style.background='var(--accent)';borBtn.style.color='#fff';
jamWrap.style.display='none';borWrap.style.display='';
} else {
jamBtn.style.background='var(--accent)';jamBtn.style.color='#fff';
borBtn.style.background='transparent';borBtn.style.color='var(--text2)';
jamWrap.style.display='';borWrap.style.display='none';
}
Tukang.calcDayUpah();
},
calcDayUpah(){
const ctx=Tukang._dayCtx; if(!ctx)return 0;
const w=D.tukangWorkers.find(x=>x.id==ctx.workerId); if(!w)return 0;
if(Tukang._dayMode==='borongan'){
const total=parsePzNum(document.getElementById('tkDayBorTotal').value);
const jumlah=Math.max(1,parseInt(document.getElementById('tkDayBorJumlah').value)||1);
const upah=Math.round(total/jumlah);
document.getElementById('tkDayUpah').textContent=fmtFull(upah);
document.getElementById('tkDayBreakdown').textContent=total>0?(fmtFull(total)+' ÷ '+jumlah+' tukang'):'';
return upah;
}
const masuk=document.getElementById('tkDayMasuk').value;
const pulang=document.getElementById('tkDayPulang').value;
const istMulai=document.getElementById('tkDayIstMulai').value;
const istSelesai=document.getElementById('tkDayIstSelesai').value;
if(!masuk||!pulang){document.getElementById('tkDayUpah').textContent='Rp 0';document.getElementById('tkDayBreakdown').textContent='';return 0;}
const r=Tukang._computeDay(w,masuk,pulang,istMulai,istSelesai);
document.getElementById('tkDayUpah').textContent=fmtFull(r.upah);
let bd=r.totalJam+' jam kerja bersih';
if(r.istirahatMin>0)bd+=' (istirahat '+r.istirahatMin+' menit dikurangi)';
bd+=' · Pokok '+r.jamKerja+' jam × '+fmtFull(w.upahJam);
if(r.jamLembur>0)bd+=' + Lembur '+r.jamLembur+' jam × '+fmtFull(w.upahLemburJam);
document.getElementById('tkDayBreakdown').textContent=bd;
return r.upah;
},
saveDayEntry(){
const ctx=Tukang._dayCtx; if(!ctx)return;
const w=D.tukangWorkers.find(x=>x.id==ctx.workerId); if(!w)return;
const idx=D.tukangAbsensi.findIndex(a=>a.workerId==ctx.workerId&&a.date==ctx.date);
let data;
let upahTersimpan;
if(Tukang._dayMode==='borongan'){
const borTotal=parsePzNum(document.getElementById('tkDayBorTotal').value);
const borJumlah=Math.max(1,parseInt(document.getElementById('tkDayBorJumlah').value)||1);
if(borTotal<=0){toast('⚠️ Isi total upah borongan dulu');return;}
const upah=Math.round(borTotal/borJumlah);
data={mode:'borongan',borTotal,borJumlah,masuk:null,pulang:null,istMulai:null,istSelesai:null,istirahatMin:0,totalJam:0,jamKerja:0,jamLembur:0,upah};
upahTersimpan=upah;
} else {
const masuk=document.getElementById('tkDayMasuk').value;
const pulang=document.getElementById('tkDayPulang').value;
const istMulai=document.getElementById('tkDayIstMulai').value;
const istSelesai=document.getElementById('tkDayIstSelesai').value;
if(!masuk||!pulang){toast('⚠️ Isi jam masuk & jam pulang dulu');return;}
const r=Tukang._computeDay(w,masuk,pulang,istMulai,istSelesai);
if(r.totalJam<=0){toast('⚠️ Jam pulang harus setelah jam masuk');return;}
data={mode:'jam',masuk,pulang,istMulai,istSelesai,istirahatMin:r.istirahatMin,totalJam:r.totalJam,jamKerja:r.jamKerja,jamLembur:r.jamLembur,upah:r.upah,borTotal:null,borJumlah:null};
upahTersimpan=r.upah;
}
if(idx===-1){
D.tukangAbsensi.push({id:uid(),workerId:ctx.workerId,date:ctx.date,renovItemLinkId:null,...data});
} else {
Object.assign(D.tukangAbsensi[idx],data);
}
save();closeModal('tkDayModal');Tukang.renderAll();toast('✅ Absen tersimpan: '+fmtFull(upahTersimpan));
},
async deleteDayEntry(){
const ctx=Tukang._dayCtx; if(!ctx)return;
if(!await askConfirm('Hapus catatan absen hari ini?'))return;
D.tukangAbsensi=D.tukangAbsensi.filter(a=>!(a.workerId==ctx.workerId&&a.date==ctx.date));
save();closeModal('tkDayModal');Tukang.renderAll();toast('🗑 Absen dihapus');
},
openSharedBorModal(){
if(!D.tukangWorkers.length){toast('⚠️ Belum ada pekerja. Tambah dulu di atas.');return;}
const dateEl=document.getElementById('tkBorTanggal');
if(!dateEl.value)dateEl.value=dateToISO(new Date());
document.getElementById('tkBorTotalShared').value='';
Tukang.renderSharedBorWorkerList();
Tukang.calcSharedBorongan();
openModal('tkBorSharedModal');
},
renderSharedBorWorkerList(){
const dateIso=document.getElementById('tkBorTanggal').value;
const listEl=document.getElementById('tkBorWorkerList');
listEl.innerHTML=D.tukangWorkers.map(w=>{
const entry=dateIso?D.tukangAbsensi.find(a=>a.workerId==w.id&&a.date==dateIso):null;
const locked=!!(entry&&(entry.renovItemLinkId||entry.paidTxId));
const lockNote=locked?(entry.paidTxId?' — 🔒 sudah dibayar':' — 🔒 sudah dipakai di item Renovasi'):'';
return `
      <label style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border);${locked?'opacity:0.5':''}">
        <input type="checkbox" class="tkBorWorkerChk" value="${w.id}" onchange="Tukang.calcSharedBorongan()" ${locked?'disabled':'checked'}>
        <span class="u-fs13 u-fw600">${escapeHtml(w.name)}${lockNote?'<span class="u-fw600 u-t2">'+lockNote+'</span>':''}</span>
      </label>`;
}).join('');
},
calcSharedBorongan(){
const total=parsePzNum(document.getElementById('tkBorTotalShared').value);
const checked=[...document.querySelectorAll('.tkBorWorkerChk:checked')];
const n=checked.length;
const perOrang=n>0?Math.round(total/n):0;
document.getElementById('tkBorSharedPerOrang').textContent=fmtFull(perOrang);
document.getElementById('tkBorSharedPreview').textContent=n>0?(fmtFull(total)+' ÷ '+n+' tukang dicentang'):'⚠️ Pilih minimal 1 tukang';
return {total,n,perOrang};
},
saveSharedBorongan(){
const dateIso=document.getElementById('tkBorTanggal').value;
if(!dateIso){toast('⚠️ Isi tanggal dulu');return;}
const {total,n,perOrang}=Tukang.calcSharedBorongan();
if(total<=0){toast('⚠️ Isi total upah borongan dulu');return;}
if(n<=0){toast('⚠️ Centang minimal 1 tukang yang ikut');return;}
const checkedIds=[...document.querySelectorAll('.tkBorWorkerChk:checked')].map(c=>c.value);
let saved=0,skipped=[];
checkedIds.forEach(workerId=>{
const idx=D.tukangAbsensi.findIndex(a=>a.workerId==workerId&&a.date==dateIso);
const existing=idx!==-1?D.tukangAbsensi[idx]:null;
if(existing&&(existing.renovItemLinkId||existing.paidTxId)){
const w=D.tukangWorkers.find(x=>x.id==workerId);
skipped.push(w?w.name:'?');
return;
}
const data={mode:'borongan',borTotal:total,borJumlah:n,upah:perOrang,masuk:null,pulang:null,istMulai:null,istSelesai:null,istirahatMin:0,totalJam:0,jamKerja:0,jamLembur:0};
if(idx===-1){
D.tukangAbsensi.push({id:uid(),workerId,date:dateIso,renovItemLinkId:null,paidTxId:null,...data});
} else {
Object.assign(D.tukangAbsensi[idx],data);
}
saved++;
});
save();closeModal('tkBorSharedModal');Tukang.renderAll();
let msg='✅ Borongan tersimpan: '+fmtFull(perOrang)+'/orang × '+saved+' tukang';
if(skipped.length)msg+=' — dilewati: '+skipped.join(', ')+' (absensinya sudah dipakai/dibayar)';
toast(msg);
},
BOR_JENIS_LABEL:{keramik:'Pasang Keramik',plester:'Plester Dinding',acian:'Acian Dinding',cat:'Pengecatan',bata:'Pasang Bata/Batako',bongkar:'Bongkar Bangunan',cor:'Cor Dak/Kolom Beton',listrik:'Instalasi Titik Listrik',kusen:'Pasang Kusen/Pintu/Jendela',pipa:'Pasang Pipa/Saluran'},
BOR_JENIS_UNIT:{keramik:'m2',plester:'m2',acian:'m2',cat:'m2',bata:'m2',bongkar:'m2',cor:'m3',listrik:'buah',kusen:'buah',pipa:'meter'},
BOR_UNIT_LABEL:{m2:'m²',m3:'m³',meter:'meter',buah:'buah/titik'},
_borHargaMemoryKey(){
const jenis=document.getElementById('tkBorCalcJenis').value;
if(jenis!=='custom')return jenis;
const name=(document.getElementById('tkBorCalcCustomName').value||'').trim().toLowerCase();
return name?'custom:'+name:null;
},
openBorCalc(target){
Tukang._borCalcTarget=target;
document.getElementById('tkBorCalcJenis').value='keramik';
document.getElementById('tkBorCalcCustomName').value='';
document.getElementById('tkBorCalcSatuan').value='m2';
document.getElementById('tkBorCalcP').value='';
document.getElementById('tkBorCalcL').value='';
document.getElementById('tkBorCalcT').value='';
document.getElementById('tkBorCalcLuas').value='';
document.getElementById('tkBorCalcHarga').value='';
document.getElementById('tkBorCalcHitungUkuran').checked=false;
Tukang.onBorCalcJenisChange();
Tukang.toggleBorCalcUkuran();
openModal('tkBorCalcModal');
},
_applyBorCalcUnitUI(){
const unit=document.getElementById('tkBorCalcSatuan').value;
const unitLabel=Tukang.BOR_UNIT_LABEL[unit];
document.getElementById('tkBorCalcHargaLbl').textContent='Harga Borongan per '+unitLabel+' (Rp)';
document.getElementById('tkBorCalcLuasLbl').textContent='Jumlah Pekerjaan ('+unitLabel+')';
document.getElementById('tkBorCalcLuasOutLbl').textContent='Jumlah Dipakai';
const isUkuranBisa=unit==='m2'||unit==='m3';
document.getElementById('tkBorCalcUkuranToggleWrap').style.display=isUkuranBisa?'':'none';
document.getElementById('tkBorCalcUkuranSub').textContent=unit==='m3'?'Otomatis hitung volume dari panjang × lebar × tinggi':'Otomatis hitung luas dari panjang × lebar ruangan/bidang';
document.getElementById('tkBorCalcTWrap').style.display=unit==='m3'?'':'none';
if(!isUkuranBisa){
document.getElementById('tkBorCalcHitungUkuran').checked=false;
document.getElementById('tkBorCalcUkuranWrap').style.display='none';
document.getElementById('tkBorCalcLuasWrap').style.display='';
}
const hargaEl=document.getElementById('tkBorCalcHarga');
const memNoteEl=document.getElementById('tkBorCalcHargaMemoryNote');
const key=Tukang._borHargaMemoryKey();
const remembered=key&&D.tukangBorHargaMemory?D.tukangBorHargaMemory[key]:null;
if(remembered&&!parsePzNum(hargaEl.value)){
hargaEl.value=remembered;
memNoteEl.textContent='💡 Otomatis diisi dari harga terakhir dipakai ('+fmtFull(remembered)+'/'+unitLabel+')';
} else {
memNoteEl.textContent='';
}
},
onBorCalcJenisChange(){
const jenis=document.getElementById('tkBorCalcJenis').value;
document.getElementById('tkBorCalcCustomNameWrap').style.display=jenis==='custom'?'':'none';
document.getElementById('tkBorCalcSatuanWrap').style.display=jenis==='custom'?'':'none';
if(jenis!=='custom'){
document.getElementById('tkBorCalcSatuan').value=Tukang.BOR_JENIS_UNIT[jenis]||'m2';
}
document.getElementById('tkBorCalcHarga').value='';
Tukang._applyBorCalcUnitUI();
Tukang.calcBorCalc();
},
onBorCalcSatuanChange(){
document.getElementById('tkBorCalcHarga').value='';
Tukang._applyBorCalcUnitUI();
Tukang.calcBorCalc();
},
onBorCalcCustomNameInput(){
Tukang._applyBorCalcUnitUI();
},
toggleBorCalcUkuran(){
const on=document.getElementById('tkBorCalcHitungUkuran').checked;
document.getElementById('tkBorCalcUkuranWrap').style.display=on?'':'none';
document.getElementById('tkBorCalcLuasWrap').style.display=on?'none':'';
Tukang.calcBorCalc();
},
calcBorCalc(){
const unit=document.getElementById('tkBorCalcSatuan').value;
const hitungUkuran=document.getElementById('tkBorCalcHitungUkuran').checked&&(unit==='m2'||unit==='m3');
let jumlah;
if(hitungUkuran){
const p=parsePzNum(document.getElementById('tkBorCalcP').value);
const l=parsePzNum(document.getElementById('tkBorCalcL').value);
if(unit==='m3'){
const t=parsePzNum(document.getElementById('tkBorCalcT').value);
jumlah=p*l*t;
} else {
jumlah=p*l;
}
document.getElementById('tkBorCalcLuas').value=jumlah?String(Math.round(jumlah*100)/100):'';
} else {
jumlah=parsePzNum(document.getElementById('tkBorCalcLuas').value);
}
const harga=parsePzNum(document.getElementById('tkBorCalcHarga').value);
const total=Math.round(jumlah*harga);
const unitLabel=Tukang.BOR_UNIT_LABEL[unit];
document.getElementById('tkBorCalcLuasOut').textContent=(Math.round(jumlah*100)/100)+' '+unitLabel;
document.getElementById('tkBorCalcTotal').textContent=fmtFull(total);
Tukang._borCalcResult={luas:jumlah,total,harga,unit};
return Tukang._borCalcResult;
},
useBorCalc(){
const r=Tukang._borCalcResult||Tukang.calcBorCalc();
if(!r.total||r.total<=0){toast('⚠️ Isi luas/ukuran & harga borongan dulu');return;}
const key=Tukang._borHargaMemoryKey();
if(key&&r.harga>0){
if(!D.tukangBorHargaMemory)D.tukangBorHargaMemory={};
D.tukangBorHargaMemory[key]=r.harga;
save();
}
const target=Tukang._borCalcTarget;
if(target==='day'){
document.getElementById('tkDayBorTotal').value=r.total;
Tukang.calcDayUpah();
} else if(target==='shared'){
document.getElementById('tkBorTotalShared').value=r.total;
Tukang.calcSharedBorongan();
}
closeModal('tkBorCalcModal');
toast('✅ Hasil kalkulator dipakai: '+fmtFull(r.total));
},
_borHistMonth:null,
openBorHistory(){
const now=new Date();
Tukang._borHistMonth=new Date(now.getFullYear(),now.getMonth(),1);
Tukang.renderBorHistory();
openModal('tkBorHistModal');
},
changeBorHistMonth(delta){
const m=Tukang._borHistMonth||new Date();
Tukang._borHistMonth=new Date(m.getFullYear(),m.getMonth()+delta,1);
Tukang.renderBorHistory();
},
renderBorHistory(){
const m=Tukang._borHistMonth||new Date(new Date().getFullYear(),new Date().getMonth(),1);
document.getElementById('tkBorHistMonthLabel').textContent=m.toLocaleDateString('id-ID',{month:'long',year:'numeric'});
const from=dateToISO(m);
const to=dateToISO(new Date(m.getFullYear(),m.getMonth()+1,0));
const entries=D.tukangAbsensi.filter(a=>a.mode==='borongan'&&a.date>=from&&a.date<=to).sort((a,b)=>a.date<b.date?1:(a.date>b.date?-1:0));
const total=entries.reduce((s,a)=>s+a.upah,0);
const hariSet=new Set(entries.map(a=>a.date));
document.getElementById('tkBorHistTotal').textContent=fmtFull(total);
document.getElementById('tkBorHistSub').textContent=entries.length+' entri · '+hariSet.size+' hari kerja borongan';
const listEl=document.getElementById('tkBorHistList');
if(!entries.length){
listEl.innerHTML='<div class="empty"><div class="empty-icon">📦</div><div class="empty-text">Belum ada absensi borongan di bulan ini.</div></div>';
return;
}
listEl.innerHTML=entries.map(a=>{
const w=D.tukangWorkers.find(x=>x.id==a.workerId);
const name=w?w.name:'(pekerja dihapus)';
const d=new Date(a.date+'T00:00:00');
const dateLabel=d.toLocaleDateString('id-ID',{weekday:'short',day:'numeric',month:'short'});
const lockNote=a.paidTxId?' · 💸 sudah dibayar':(a.renovItemLinkId?' · 🔒 dipakai di item Renovasi':'');
return `<div class="tx-item">
        <div class="u-minw0"><div class="tx-name">${escapeHtml(name)}</div><div class="tx-meta">${dateLabel} · ${fmtFull(a.borTotal)} ÷ ${a.borJumlah} tukang${lockNote}</div></div>
        <div class="tx-amount">${fmtFull(a.upah)}</div>
      </div>`;
}).join('');
},
payBorHistoryAsExpense(){
const m=Tukang._borHistMonth||new Date(new Date().getFullYear(),new Date().getMonth(),1);
const from=dateToISO(m);
const to=dateToISO(new Date(m.getFullYear(),m.getMonth()+1,0));
const entries=D.tukangAbsensi.filter(a=>a.mode==='borongan'&&!a.renovItemLinkId&&!a.paidTxId&&a.date>=from&&a.date<=to);
if(!entries.length){toast('⚠️ Tidak ada absensi borongan yang bisa dibayar di bulan ini (kosong, atau semua sudah dibayar/dipakai di item Renovasi)');return;}
const total=entries.reduce((s,a)=>s+a.upah,0);
const byWorker={};
entries.forEach(a=>{
const w=D.tukangWorkers.find(x=>x.id==a.workerId);
const name=w?w.name:'(pekerja dihapus)';
byWorker[name]=(byWorker[name]||0)+a.upah;
});
const detail=Object.entries(byWorker).map(([name,t])=>name+': '+fmtFull(t)).join(' · ');
const monthLabel=m.toLocaleDateString('id-ID',{month:'long',year:'numeric'});
Tukang._pendingPaymentEntryIds=entries.map(a=>a.id);
Tukang._pendingPaymentRange={from,to};
closeModal('tkBorHistModal');closeModal('tukangModal');
openTxModal('expense');
setTimeout(()=>{
document.getElementById('txAmt').value=Math.round(total);
const upahCat=D.categories.expense.find(c=>/tukang|upah|gaji|renovasi/i.test(c.name));
if(upahCat){ document.getElementById('txCat').value=upahCat.name; updateSubCatOptions(); }
document.getElementById('txNote').value='Upah borongan '+monthLabel+' — '+detail;
},60);
},
_jamHistMonth:null,
openJamHistory(){
const now=new Date();
Tukang._jamHistMonth=new Date(now.getFullYear(),now.getMonth(),1);
Tukang.renderJamHistory();
openModal('tkJamHistModal');
},
changeJamHistMonth(delta){
const m=Tukang._jamHistMonth||new Date();
Tukang._jamHistMonth=new Date(m.getFullYear(),m.getMonth()+delta,1);
Tukang.renderJamHistory();
},
renderJamHistory(){
const m=Tukang._jamHistMonth||new Date(new Date().getFullYear(),new Date().getMonth(),1);
document.getElementById('tkJamHistMonthLabel').textContent=m.toLocaleDateString('id-ID',{month:'long',year:'numeric'});
const from=dateToISO(m);
const to=dateToISO(new Date(m.getFullYear(),m.getMonth()+1,0));
const entries=D.tukangAbsensi.filter(a=>a.mode!=='borongan'&&a.date>=from&&a.date<=to).sort((a,b)=>a.date<b.date?1:(a.date>b.date?-1:0));
const total=entries.reduce((s,a)=>s+a.upah,0);
const totalJamKerja=entries.reduce((s,a)=>s+(a.jamKerja||0),0);
const totalJamLembur=entries.reduce((s,a)=>s+(a.jamLembur||0),0);
document.getElementById('tkJamHistTotal').textContent=fmtFull(total);
document.getElementById('tkJamHistSub').textContent=entries.length+' hari absen · '+(Math.round(totalJamKerja*100)/100)+' jam kerja + '+(Math.round(totalJamLembur*100)/100)+' jam lembur';
const listEl=document.getElementById('tkJamHistList');
if(!entries.length){
listEl.innerHTML='<div class="empty"><div class="empty-icon">⏱</div><div class="empty-text">Belum ada absen per jam di bulan ini.</div></div>';
return;
}
listEl.innerHTML=entries.map(a=>{
const w=D.tukangWorkers.find(x=>x.id==a.workerId);
const name=w?w.name:'(pekerja dihapus)';
const d=new Date(a.date+'T00:00:00');
const dateLabel=d.toLocaleDateString('id-ID',{weekday:'short',day:'numeric',month:'short'});
const jamLabel=a.masuk&&a.pulang?(a.masuk+'–'+a.pulang):'';
let jamDetail=(a.jamKerja||0)+' jam kerja';
if(a.jamLembur>0)jamDetail+=' + '+a.jamLembur+' jam lembur';
const lockNote=a.paidTxId?' · 💸 sudah dibayar':(a.renovItemLinkId?' · 🔒 dipakai di item Renovasi':'');
return `<div class="tx-item">
        <div class="u-minw0"><div class="tx-name">${escapeHtml(name)}</div><div class="tx-meta">${dateLabel} · ${jamLabel} · ${jamDetail}${lockNote}</div></div>
        <div class="tx-amount">${fmtFull(a.upah)}</div>
      </div>`;
}).join('');
},
renderAll(){
const start=new Date(Tukang.weekStart);
const end=new Date(start); end.setDate(start.getDate()+6);
const labelEl=document.getElementById('tkWeekLabel');
if(labelEl){
const now=new Date(); const {start:curStart}=getWeekRange(now);
const isCur=start.getTime()===curStart.getTime();
const fmtShort=d=>d.toLocaleDateString('id-ID',{day:'numeric',month:'short'});
labelEl.textContent=fmtShort(start)+' – '+fmtShort(end)+(isCur?' (Ini)':'');
}
const days=[];for(let i=0;i<7;i++){const d=new Date(start);d.setDate(start.getDate()+i);days.push(d);}
const dowShort=['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
const listEl=document.getElementById('tkWorkerList');
if(!listEl)return;
if(!D.tukangWorkers.length){listEl.innerHTML='<div class="empty"><div class="empty-icon">👷</div><div class="empty-text">Belum ada pekerja. Tambah dulu di atas.</div></div>';return;}
listEl.innerHTML=D.tukangWorkers.map(w=>{
let weekTotal=0;
const chips=days.map(d=>{
const iso=dateToISO(d);
const entry=D.tukangAbsensi.find(a=>a.workerId==w.id&&a.date==iso);
let label='·',bg='var(--surface3)',color='var(--text3)';
if(entry){
weekTotal+=entry.upah;
if(entry.mode==='borongan'){
label='📦';
bg='var(--accent2-soft)';color='var(--accent2)';
} else {
const totalJam=entry.jamKerja+entry.jamLembur;
label=(totalJam%1===0?totalJam:totalJam.toFixed(1))+'j';
bg=entry.jamLembur>0?'var(--accent4-soft)':'var(--accent3-soft)';
color=entry.jamLembur>0?'var(--accent4)':'var(--accent3)';
}
}
const locked=!!(entry&&(entry.renovItemLinkId||entry.paidTxId));
const paidLock=!!(entry&&entry.paidTxId);
const jamLabel=entry&&entry.mode==='borongan'?` borongan ${fmtFull(entry.borTotal)}÷${entry.borJumlah}`:(entry&&entry.masuk&&entry.pulang?` ${entry.masuk}–${entry.pulang}`:'');
const lockNote=paidLock?' (sudah dibayar)':(locked?' (sudah dipakai di item Renovasi)':'');
return `<div ${locked?'':`data-tk-day="1" data-tk-worker="${w.id}" data-tk-date="${iso}"`} class="wh-day-box" style="cursor:${locked?'default':'pointer'}" title="${dowShort[d.getDay()]} ${iso}${jamLabel}${lockNote}">
<div class="wh-day-box-dow">${dowShort[d.getDay()]}</div>
<div class="wh-day-box-date">${d.getDate()}</div>
<div class="wh-day-box-status" style="background:${bg};color:${color}">${label}</div>
${locked?'<span class="u-abs" style="top:2px;right:4px;font-size:8px">'+(paidLock?'💸':'🔒')+'</span>':''}
</div>`;
}).join('');
return `<div class="tx-item u-fdcol u-gap8" style="align-items:stretch">
        <div class="u-flex u-jcb u-aic u-gap8">
          <div class="u-minw0"><div class="tx-name">${escapeHtml(w.name)}</div><div class="tx-meta">${fmtFull(w.upahJam)}/jam · lembur ${fmtFull(w.upahLemburJam)}/jam</div></div>
          <div class="u-tar" style="flex-shrink:0"><div class="tx-amount">${fmtFull(weekTotal)}</div><div class="u-fs11 u-t2">minggu ini</div></div>
          <button class="tx-del" data-tk-del="${w.id}" aria-label="Hapus">🗑</button>
        </div>
        <div class="u-flex u-gap4">${chips}</div>
        ${Tukang.renderWorkerHistory(w)}
      </div>`;
}).join('');
if(!listEl._tkDelegated){
listEl._tkDelegated=true;
const handleTap=(e)=>{
const dayEl=e.target.closest('[data-tk-day]');
if(dayEl){Tukang.openDayEntry(dayEl.getAttribute('data-tk-worker'),dayEl.getAttribute('data-tk-date'));return;}
const delEl=e.target.closest('[data-tk-del]');
if(delEl){Tukang.delWorker(delEl.getAttribute('data-tk-del'));return;}
const histToggleEl=e.target.closest('[data-tk-hist-toggle]');
if(histToggleEl){Tukang.toggleWorkerHistory(histToggleEl.getAttribute('data-tk-hist-toggle'));return;}
const histDelEl=e.target.closest('[data-tk-hist-del]');
if(histDelEl){Tukang.delAbsensiEntry(histDelEl.getAttribute('data-tk-hist-del'));return;}
const histEditEl=e.target.closest('[data-tk-hist-edit]');
if(histEditEl){Tukang.openDayEntry(histEditEl.getAttribute('data-tk-hist-worker'),histEditEl.getAttribute('data-tk-hist-date'));return;}
};
listEl.addEventListener('click',handleTap);
}
},
calcRange(){
const from=document.getElementById('tkRangeFrom').value;
const to=document.getElementById('tkRangeTo').value;
if(!from||!to){toast('⚠️ Isi tanggal dari & sampai dulu');Tukang._rangeResult=null;return;}
const entries=D.tukangAbsensi.filter(a=>!a.renovItemLinkId&&!a.paidTxId&&a.date>=from&&a.date<=to);
const total=entries.reduce((s,a)=>s+a.upah,0);
const byWorker={};
entries.forEach(a=>{
const w=D.tukangWorkers.find(x=>x.id==a.workerId);
const name=w?w.name:'(pekerja dihapus)';
if(!byWorker[name])byWorker[name]={jamKerja:0,jamLembur:0,borHari:0,total:0};
byWorker[name].jamKerja+=a.jamKerja||0;
byWorker[name].jamLembur+=a.jamLembur||0;
if(a.mode==='borongan')byWorker[name].borHari+=1;
byWorker[name].total+=a.upah;
});
const detail=Object.entries(byWorker).map(([name,d])=>{
let parts=[];
if(d.jamKerja||d.jamLembur){
let s=d.jamKerja+' jam kerja';
if(d.jamLembur)s+=' + '+d.jamLembur+' jam lembur';
parts.push(s);
}
if(d.borHari)parts.push(d.borHari+' hari borongan');
return `${name}: ${parts.join(' + ')} = ${fmtFull(d.total)}`;
}).join(' · ');
document.getElementById('tkRangeTotal').textContent=fmtFull(total);
document.getElementById('tkRangeDetail').textContent=detail||'Belum ada absensi yang bisa dipakai pada periode ini';
Tukang._rangeResult={total,entryIds:entries.map(a=>a.id),from,to,detail};
return Tukang._rangeResult;
},
payAsExpense(){
const r=Tukang.calcRange();
if(!r||r.total<=0){toast('⚠️ Tidak ada absensi yang bisa dibayar pada periode ini');return;}
Tukang._pendingPaymentEntryIds=r.entryIds;
Tukang._pendingPaymentRange={from:r.from,to:r.to};
closeModal('tukangModal');
openTxModal('expense');
setTimeout(()=>{
document.getElementById('txAmt').value=Math.round(r.total);
const upahCat=D.categories.expense.find(c=>/tukang|upah|gaji|renovasi/i.test(c.name));
if(upahCat){ document.getElementById('txCat').value=upahCat.name; updateSubCatOptions(); }
document.getElementById('txNote').value='Upah tukang '+r.from+' s/d '+r.to+(r.detail?' — '+r.detail:'');
},60);
},
applyPendingPayment(txId){
const ids=Tukang._pendingPaymentEntryIds;
if(!ids||!ids.length)return;
ids.forEach(id=>{
const a=D.tukangAbsensi.find(x=>sameId(x.id,id));
if(a)a.paidTxId=txId;
});
const t=D.transactions.find(x=>x.id===txId);
if(t)t.tukangPaymentEntryIds=ids;
Tukang._pendingPaymentEntryIds=null;
Tukang._pendingPaymentRange=null;
},
unmarkPaidEntries(entryIds){
(entryIds||[]).forEach(id=>{
const a=D.tukangAbsensi.find(x=>sameId(x.id,id));
if(a)delete a.paidTxId;
});
},
applyToItem(){
const r=Tukang.calcRange();
if(!r||r.total<=0){toast('⚠️ Tidak ada absensi yang bisa dipakai pada periode ini');return;}
const hargaEl=document.getElementById('renovItemHarga');
if(!hargaEl){toast('⚠️ Buka dulu form Tambah/Edit Item Biaya di Proyek Renovasi');return;}
hargaEl.value=Math.round(r.total);
const nameEl=document.getElementById('renovItemName');
if(nameEl&&!nameEl.value.trim())nameEl.value='Upah Tukang (Absensi '+r.from+' s/d '+r.to+')';
RenovCalc._pendingDetail={
type:'absensi',entryIds:r.entryIds,from:r.from,to:r.to,
total:Math.round(r.total),
text:'Absensi tukang '+r.from+' s/d '+r.to+' — '+(r.detail||'-')
};
closeModal('tukangModal');
toast('✅ Total absensi dipakai ke form item — jangan lupa tap Simpan Item');
},
markUsed(entryIds,itemId){
(entryIds||[]).forEach(id=>{
const a=D.tukangAbsensi.find(x=>sameId(x.id,id));
if(a)a.renovItemLinkId=itemId;
});
},
releaseEntries(entryIds){
(entryIds||[]).forEach(id=>{
const a=D.tukangAbsensi.find(x=>sameId(x.id,id));
if(a)a.renovItemLinkId=null;
});
}
};
/* moved to modules-render.js: renderVehicleSelect */
function selectVehicle(id){curVehicleId=id;renderVehicleSelect();renderCnTab();}
/* moved to modules-render.js: renderCarImportVehicleSelect */
function openVehicleModal(){
renderVehicleManageList();
document.getElementById('vehName').value='';
document.getElementById('vehEmoji').value='🏍️';
document.getElementById('vehInterval').value='3000';
openModal('vehicleModal');
}
/* moved to modules-render.js: renderVehicleManageList */
async function editVehicleInterval(i){
const v=D.vehicles[i];
const val=await showPromptModal({title:'Interval Servis',message:'Interval servis untuk '+v.name+' (KM):',icon:'🔧',inputType:'number',defaultValue:v.serviceIntervalKm||3000});
if(val===null)return;
const n=parseFloat(val);
if(!n||n<=0){toast('⚠️ Interval tidak valid');return;}
v.serviceIntervalKm=n;save();renderVehicleManageList();renderServisList();toast('✅ Interval servis diperbarui');
}
function saveVehicle(){
const name=document.getElementById('vehName').value.trim();
const emoji=document.getElementById('vehEmoji').value||'🏍️';
const interval=parseFloat(document.getElementById('vehInterval').value)||3000;
const kmAwalEl=document.getElementById('vehKmAwal');
const kmAwal=kmAwalEl?parseFloat(kmAwalEl.value):NaN;
if(!name){toast('⚠️ Isi nama kendaraan');return;}
const newId='veh_'+Date.now();
D.vehicles.push({id:newId,name,emoji,serviceIntervalKm:interval,intervalOverrides:{}});
if(!isNaN(kmAwal)&&kmAwal>0){
D.kmLogs.push({id:uid(),vehicleId:newId,date:new Date().toISOString().split('T')[0],km:kmAwal,note:'KM awal saat kendaraan ditambahkan'});
}
save();renderVehicleManageList();renderVehicleSelect();renderCarImportVehicleSelect();renderDashboardServisReminder();document.getElementById('vehName').value='';if(kmAwalEl)kmAwalEl.value='';toast('✅ Kendaraan ditambahkan'+(!isNaN(kmAwal)&&kmAwal>0?' (KM awal: '+kmAwal.toLocaleString('id-ID')+' km)':''));
}
function populateKmVehicleSelect(){
const sel=document.getElementById('kmVehicle');
if(!sel||!D.vehicles)return;
sel.innerHTML=D.vehicles.map(v=>`<option value="${v.id}">${v.emoji} ${escapeHtml(v.name)}</option>`).join('');
sel.value=(D.vehicles.find(v=>v.id===curVehicleId))?curVehicleId:(D.vehicles[0]&&D.vehicles[0].id);
}
function onKmVehicleChange(){
const sel=document.getElementById('kmVehicle');
if(!sel)return;
document.getElementById('kmVal').value=getVehicleKm(sel.value)||'';
}
function openKmModal(){
document.getElementById('kmDate').value=new Date().toISOString().split('T')[0];
document.getElementById('kmNote').value='';
populateKmVehicleSelect();
document.getElementById('kmVal').value=getVehicleKm(curVehicleId)||'';
openModal('kmModal');
}
async function saveKm(){
const vehSel=document.getElementById('kmVehicle');
const vehicleId=(vehSel&&vehSel.value&&D.vehicles.find(v=>v.id===vehSel.value))?vehSel.value:curVehicleId;
const km=parseFloat(document.getElementById('kmVal').value);
if(!km){toast('⚠️ Isi nilai KM');return;}
const curKm=getVehicleKm(vehicleId);
if(km<curKm){if(!await askConfirm('KM yang diisi lebih kecil dari catatan terakhir ('+curKm.toLocaleString('id-ID')+' km). Tetap simpan?',{danger:false,okText:'Ya, Simpan'}))return;}
D.kmLogs.push({id:uid(),vehicleId,date:document.getElementById('kmDate').value,km,note:document.getElementById('kmNote').value});
if(vehicleId!==curVehicleId){curVehicleId=vehicleId;renderVehicleSelect();}
save();closeModal('kmModal');renderCnTab();renderDashboardServisReminder();toast('✅ KM diperbarui: '+km.toLocaleString('id-ID')+' km');
}
async function delVehicle(i){
if(D.vehicles.length<=1){toast('⚠️ Minimal 1 kendaraan');return;}
if(!await askConfirm('Hapus kendaraan ini? Catatan BBM/servis terkait tetap ada.'))return;
D.vehicles.splice(i,1);save();renderVehicleManageList();renderVehicleSelect();renderCnTab();renderDashboardServisReminder();toast('🗑 Dihapus');
}
function daysUntilDate(dateStr){
if(!dateStr)return null;
const now=new Date(); now.setHours(0,0,0,0);
const target=new Date(dateStr); target.setHours(0,0,0,0);
return Math.round((target-now)/86400000);
}
function dateStatusBadge(dateStr){
const d=daysUntilDate(dateStr);
if(d===null)return{col:'',label:'Belum diisi'};
if(d<0)return{col:'red',label:`⚠️ Lewat ${Math.abs(d)} hari`};
if(d<=30)return{col:'orange',label:d===0?'🔔 Jatuh tempo hari ini':`🔔 H-${d} hari`};
return{col:'green',label:`✅ Aktif s.d ${fmtDateID(dateStr)}`};
}
function fmtDateID(dateStr){
return new Date(dateStr).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'});
}
function sptTahunanDueDate(){
const now=new Date(); now.setHours(0,0,0,0);
const y=now.getFullYear();
let due=new Date(y,2,31); due.setHours(0,0,0,0);
const diffDays=Math.round((now-due)/86400000);
if(diffDays>30) due=new Date(y+1,2,31);
return dateToISO(due);
}
function sptStatusBadge(){
const dateStr=sptTahunanDueDate();
const d=daysUntilDate(dateStr);
if(d<0)return{col:'red',label:`⚠️ Lewat ${Math.abs(d)} hari, segera lapor!`};
if(d<=30)return{col:'orange',label:d===0?'🔔 Batas lapor HARI INI':`🔔 H-${d} hari (${fmtDateID(dateStr)})`};
return{col:'green',label:`Batas lapor ${fmtDateID(dateStr)}`};
}
function ikatSptTagihan(){
const due=sptTahunanDueDate();
const key='spt';
let bill=D.bills.find(b=>b.taxLink&&b.taxLink.key===key);
if(bill){
bill.nextDue=due;
save();refreshBillEverywhere();renderSptLinkStatus();
toast('✅ Reminder Tagihan SPT Tahunan diperbarui: batas lapor '+fmtDateID(due));
} else {
D.bills.push({id:uid(),name:'Lapor SPT Tahunan Orang Pribadi',amount:0,nextDue:due,freq:'sekali',category:'Tagihan',subcategory:'',accountId:D.accounts[0]?.id||null,note:'Otomatis dari Estimasi PPh 21 — batas lapor, bukan pembayaran',kind:'tagihan',taxLink:{key}});
save();refreshBillEverywhere();renderSptLinkStatus();
toast('✅ Reminder Tagihan SPT Tahunan dibuat, batas lapor '+fmtDateID(due));
}
}
/* moved to modules-render.js: renderSptLinkStatus */
/* moved to modules-render.js: renderVehTaxSim */
function getProactiveReminders(){
const items=[];
const now=new Date();
(D.bills||[]).forEach(b=>{
const d=daysUntilDate(b.nextDue);
if(d===null)return;
if(d<0)items.push(`⚠️ ${b.name} (${b.kind}) sudah LEWAT jatuh tempo ${Math.abs(d)} hari — ${fmtFull(b.amount)}`);
else if(d<=7)items.push(`🔔 ${b.name} (${b.kind}) jatuh tempo ${d===0?'HARI INI':'H-'+d}, siapin dana ${fmtFull(b.amount)} ya`);
});
(D.vehicles||[]).forEach(v=>{
Object.entries(VEHTAX_ITEMS).forEach(([,cfg])=>{
const d=daysUntilDate(v[cfg.tglKey]);
if(d===null)return;
const label=cfg.label.replace(/^\S+\s/,'');
if(d<0)items.push(`⚠️ ${label} ${v.name} sudah LEWAT ${Math.abs(d)} hari`);
else if(d<=7)items.push(`🔔 ${label} ${v.name} jatuh tempo ${d===0?'HARI INI':'H-'+d}${v[cfg.biayaKey]?', estimasi '+fmtFull(v[cfg.biayaKey]):''}`);
});
});
(D.simList||[]).forEach(s=>{
const d=daysUntilDate(s.tglAkhir);
if(d===null)return;
if(d<0)items.push(`⚠️ SIM ${s.jenis} (${s.nama}) sudah LEWAT masa berlaku ${Math.abs(d)} hari`);
else if(d<=7)items.push(`🔔 SIM ${s.jenis} (${s.nama}) mau habis masa berlaku, ${d===0?'HARI INI':'H-'+d}`);
});
(D.eduFunds||[]).forEach(f=>{
const c=EduFund.calc(f);
if(c.kekurangan<=0)return;
const d=daysUntilDate(f.tahunTarget+'-01-01');
if(d===null)return;
if(d<0)items.push(`⚠️ Dana Pendidikan "${f.name}" sudah masuk tahun target (${f.tahunTarget}) & masih kurang ${fmtFull(c.kekurangan)} — cek progress nabungnya`);
else if(d<=90)items.push(`🔔 Dana Pendidikan "${f.name}" H-${d} hari menuju tahun target ${f.tahunTarget}, masih kurang ${fmtFull(c.kekurangan)} (≈${fmtFull(c.pmtBulanan)}/bulan)`);
});
{
const dSpt=daysUntilDate(sptTahunanDueDate());
if(dSpt<0)items.push(`⚠️ Lapor SPT Tahunan sudah LEWAT batas waktu ${Math.abs(dSpt)} hari`);
else if(dSpt<=7)items.push(`🔔 Batas lapor SPT Tahunan ${dSpt===0?'HARI INI':'H-'+dSpt} (31 Maret)`);
}
const m=now.getMonth(),y=now.getFullYear();
const pz=D.pajakZakat;
if(pz){
const incM=(D.transactions||[]).filter(t=>{const dd=new Date(t.date);return dd.getMonth()===m&&dd.getFullYear()===y&&t.type==='income';}).reduce((s,t)=>s+t.amount,0);
if(incM>=pz.nisabPenghasilanBulan){
items.push(`💰 Zakat penghasilan bulan ini sudah WAJIB (≈${fmtFull(Math.round(incM*0.025))}), pemasukan udah lewat nisab`);
}
const asetZakatable=(D.assets||[]).filter(a=>a.zakatable).reduce((s,a)=>s+(a.nilai||0),0);
const totalHartaZakat=Math.max(0,totalSaldoAkun()+asetZakatable-(pz.utangJT||0)-totalDebtValue());
const nisabMaal=85*pz.hargaEmasPerGram;
if(totalHartaZakat>=nisabMaal&&pz.haulMaalMulai){
const hari=Math.floor((now-new Date(pz.haulMaalMulai))/86400000);
if(hari>=354)items.push(`💰 Zakat maal sudah WAJIB (haul genap), ≈${fmtFull(Math.round(totalHartaZakat*0.025))}`);
else if(hari>=354-7)items.push(`🔔 Zakat maal mau haul ${354-hari} hari lagi, siap-siap dananya ya`);
}
}
return items;
}
/* moved to modules-render.js: renderVehTaxList */
function openVehTaxModal(vehicleId){
const v=D.vehicles.find(x=>x.id===vehicleId);
if(!v)return;
document.getElementById('vehTaxVehName').textContent=v.name;
document.getElementById('vehTaxModal').dataset.vehicleId=vehicleId;
document.getElementById('vehTaxTahunan').value=v.pajakTahunanTgl||'';
document.getElementById('vehBiayaTahunan').value=v.biayaTahunan||'';
document.getElementById('vehTaxLimaTahun').value=v.pajakLimaTahunTgl||'';
document.getElementById('vehBiayaLimaTahun').value=v.biayaLimaTahun||'';
document.getElementById('vehTaxUji').value=v.ujiKelayakanTgl||'';
document.getElementById('vehBiayaUji').value=v.biayaUji||'';
renderVehTaxLinkStatus();
openModal('vehTaxModal');
}
function ikatVehTaxTagihan(jenis){
const modalEl=document.getElementById('vehTaxModal');
const vehicleId=modalEl.dataset.vehicleId;
const v=D.vehicles.find(x=>x.id===vehicleId);
const cfg=VEHTAX_ITEMS[jenis],ids=VEHTAX_INPUT_IDS[jenis];
if(!v||!cfg||!ids)return;
const due=document.getElementById(ids.date).value;
const biaya=parsePzNum(document.getElementById(ids.biaya).value);
if(!due){toast('⚠️ Isi dulu tanggal jatuh tempo');return;}
if(biaya<=0){toast('⚠️ Isi dulu estimasi biaya lewat kolom di atas');return;}
const label=cfg.label.replace(/^\S+\s/,'');
const key='vehtax:'+vehicleId+':'+jenis;
let bill=D.bills.find(b=>b.taxLink&&b.taxLink.key===key);
if(bill){
bill.amount=biaya;bill.nextDue=due;bill.name=label+' - '+v.name;
save();refreshBillEverywhere();renderVehTaxLinkStatus();
toast('✅ Reminder Tagihan '+label+' diperbarui: '+fmtFull(biaya)+' jatuh tempo '+due);
} else {
D.bills.push({id:uid(),name:label+' - '+v.name,amount:biaya,nextDue:due,freq:'sekali',category:'Tagihan',subcategory:'',accountId:D.accounts[0]?.id||null,note:'Otomatis dari Pajak Kendaraan',kind:'tagihan',taxLink:{key}});
save();refreshBillEverywhere();renderVehTaxLinkStatus();
toast('✅ Reminder Tagihan '+label+' dibuat, aktif di menu Tagihan');
}
}
/* moved to modules-render.js: renderVehTaxLinkStatus */
function saveVehTax(){
const vehicleId=document.getElementById('vehTaxModal').dataset.vehicleId;
const v=D.vehicles.find(x=>x.id===vehicleId);
if(!v)return;
v.pajakTahunanTgl=document.getElementById('vehTaxTahunan').value||null;
v.biayaTahunan=parsePzNum(document.getElementById('vehBiayaTahunan').value);
v.pajakLimaTahunTgl=document.getElementById('vehTaxLimaTahun').value||null;
v.biayaLimaTahun=parsePzNum(document.getElementById('vehBiayaLimaTahun').value);
v.ujiKelayakanTgl=document.getElementById('vehTaxUji').value||null;
v.biayaUji=parsePzNum(document.getElementById('vehBiayaUji').value);
save();
closeModal('vehTaxModal');
renderVehTaxList();
toast('✅ Pajak & Uji Kelayakan diperbarui');
}
async function bayarPajakKendaraan(vehicleId,jenis){
const v=D.vehicles.find(x=>x.id===vehicleId);
const cfg=VEHTAX_ITEMS[jenis];
if(!v||!cfg)return;
const biaya=v[cfg.biayaKey]||0;
if(biaya<=0){toast('⚠️ Isi dulu estimasi biaya '+cfg.label+' lewat ✏️');return;}
if(!await askConfirm('Bayar '+cfg.label+' untuk '+v.name+' sebesar '+fmtFull(biaya)+'? Otomatis tercatat sebagai pengeluaran di Keuangan & jadwal diperbarui.',{danger:false,okText:'Ya, Bayar',icon:'🚦'}))return;
D.transactions.push({id:uid(),type:'expense',amount:biaya,category:'Tagihan',subcategory:'',accountId:D.accounts[0]?.id||'',payMethod:'tunai',note:cfg.label.replace(/^\S+\s/,'')+' - '+v.name,date:new Date().toISOString().split('T')[0]});
const base=v[cfg.tglKey]?new Date(v[cfg.tglKey]):new Date();
cfg.advance(base);
v[cfg.tglKey]=base.toISOString().split('T')[0];
save();
renderVehTaxList();
renderDashboard();
renderKeuangan();
toast('✅ Tercatat di Keuangan & jadwal diperpanjang ke '+fmtDateID(v[cfg.tglKey]));
}
let editSimId=null;
function openSimModal(id){
editSimId=id||null;
const s=id?D.simList.find(x=>sameId(x.id,id)):null;
document.getElementById('simModalTitle').textContent=s?'Edit SIM':'Tambah SIM';
document.getElementById('simNama').value=s?s.nama:'';
document.getElementById('simJenis').value=s?s.jenis:'SIM C';
document.getElementById('simTglAkhir').value=s?(s.tglAkhir||''):'';
document.getElementById('simBiaya').value=s?(s.biaya||''):'';
renderSimLinkStatus();
openModal('simModal');
}
function ikatSimTagihan(){
if(!editSimId){toast('⚠️ Simpan data SIM ini dulu (tombol Simpan), baru bisa diikat ke Tagihan');return;}
const s=D.simList.find(x=>sameId(x.id,editSimId));
if(!s){toast('⚠️ Data SIM tidak ditemukan');return;}
if(!s.tglAkhir){toast('⚠️ Isi & simpan dulu tanggal Berlaku Sampai');return;}
const biaya=parsePzNum(document.getElementById('simBiaya').value);
s.biaya=biaya;save();
const key='sim:'+s.id;
const name='Perpanjang SIM '+s.jenis+' - '+s.nama;
let bill=D.bills.find(b=>b.taxLink&&b.taxLink.key===key);
if(bill){
bill.amount=biaya;bill.nextDue=s.tglAkhir;bill.name=name;
save();refreshBillEverywhere();renderSimLinkStatus();
toast('✅ Reminder Tagihan SIM diperbarui, jatuh tempo '+s.tglAkhir);
} else {
D.bills.push({id:uid(),name,amount:biaya,nextDue:s.tglAkhir,freq:'sekali',category:'Tagihan',subcategory:'',accountId:D.accounts[0]?.id||null,note:'Otomatis dari data SIM',kind:'tagihan',taxLink:{key}});
save();refreshBillEverywhere();renderSimLinkStatus();
toast('✅ Reminder Tagihan SIM dibuat, aktif di menu Tagihan');
}
}
/* moved to modules-render.js: renderSimLinkStatus */
function saveSim(){
const nama=document.getElementById('simNama').value.trim();
const jenis=document.getElementById('simJenis').value;
const tglAkhir=document.getElementById('simTglAkhir').value;
if(!nama){toast('⚠️ Nama pemilik wajib diisi');return;}
if(!tglAkhir){toast('⚠️ Tanggal berlaku sampai wajib diisi');return;}
if(editSimId){
const s=D.simList.find(x=>sameId(x.id,editSimId));
Object.assign(s,{nama,jenis,tglAkhir});
} else {
D.simList.push({id:uid(),nama,jenis,tglAkhir});
}
save();
closeModal('simModal');
renderSimList();
toast('✅ Data SIM tersimpan');
}
async function delSim(id){
if(!await askConfirm('Hapus data SIM ini?',{okText:'Ya, Hapus'}))return;
D.simList=D.simList.filter(s=>!sameId(s.id,id));
save();
renderSimList();
}
/* moved to modules-render.js: renderSimList */
function setCnTab(t,el){
curCnTab=t;
document.querySelectorAll('#page-carnotes .cn-tab').forEach(b=>b.classList.remove('active'));
el.classList.add('active');
['bbm','servis','jalan'].forEach(x=>{
const elx=document.getElementById('cnTab-'+x);
if(elx){ elx.classList.toggle('u-dnone', x!==t); elx.style.display=''; }
});
renderCnTab();
}
function getVehicleKm(vehicleId){
const kms=[
...D.bbmLogs.filter(b=>b.vehicleId===vehicleId).map(b=>b.km),
...D.servisLogs.filter(s=>s.vehicleId===vehicleId&&s.km).map(s=>s.km),
...D.kmLogs.filter(k=>k.vehicleId===vehicleId).map(k=>k.km)
];
return kms.length?Math.max(...kms):0;
}
function servisLogMatchesCat(s,cat){
if(s.categoryId) return s.categoryId===cat.id;
const cn=cat.name.toLowerCase();
const item=(s.item||'').toLowerCase().trim();
if(!item)return false;
if(item===cn) return true;
if(item.includes(cn)) return true;
if(cn.includes(item)&&item.length>=4){
const ambiguous=D.sparepartCats.some(c=>c.id!==cat.id&&c.name.toLowerCase().includes(item));
if(!ambiguous) return true;
}
return false;
}
function getEffectiveIntervalKm(vehicleId,cat){
const veh=D.vehicles.find(v=>v.id===vehicleId);
const ov=veh&&veh.intervalOverrides&&veh.intervalOverrides[cat.id];
return(ov!=null&&ov>0)?ov:cat.intervalKm;
}
function hasIntervalOverride(vehicleId,cat){
const veh=D.vehicles.find(v=>v.id===vehicleId);
return!!(veh&&veh.intervalOverrides&&veh.intervalOverrides[cat.id]>0);
}
async function editVehicleIntervalOverride(catId){
const cat=D.sparepartCats.find(c=>c.id===catId);
if(!cat){toast('⚠️ Kategori sparepart tidak ditemukan');return;}
const veh=D.vehicles.find(v=>v.id===curVehicleId);
if(!veh){toast('⚠️ Pilih kendaraan dulu');return;}
const current=getEffectiveIntervalKm(curVehicleId,cat);
const val=await showPromptModal({title:'Interval Khusus '+veh.name,message:`Interval "${cat.name}" khusus untuk ${veh.emoji||'🏍️'} ${veh.name} (KM). Kosongkan/0 untuk pakai default global (${cat.intervalKm.toLocaleString('id-ID')} km, dipakai semua kendaraan lain).`,icon:'🔧',inputType:'number',defaultValue:current});
if(val===null)return;
if(!veh.intervalOverrides)veh.intervalOverrides={};
const num=parseFloat(val);
if(val===''||isNaN(num)||num<=0){
delete veh.intervalOverrides[catId];
save();Servis.renderReminder();renderDashboardServisReminder();
toast('✅ Kembali pakai default global ('+cat.intervalKm.toLocaleString('id-ID')+' km)');
} else {
veh.intervalOverrides[catId]=num;
save();Servis.renderReminder();renderDashboardServisReminder();
toast('✅ Interval khusus '+veh.name+' disimpan: '+num.toLocaleString('id-ID')+' km');
}
}
function getLastServiceKm(vehicleId){
const logs=D.servisLogs.filter(s=>s.vehicleId===vehicleId&&s.km).sort((a,b)=>new Date(b.date)-new Date(a.date)||b.km-a.km);
return logs.length?logs[0].km:0;
}
function setCnPeriode(p,el){
cnPeriode=p;
document.querySelectorAll('#cnPeriodeChips .chip-btn').forEach(b=>b.classList.remove('active'));el.classList.add('active');
document.getElementById('cnCustomRange').classList.toggle('u-dnone', p!=='custom');
document.getElementById('cnCustomRange').style.display='';
renderCnTab();
}
function getCnRange(){
if(cnPeriode==='selamanya')return{from:new Date(0),to:new Date(8640000000000000)};
const now=new Date();now.setHours(23,59,59,999);let from;
if(cnPeriode==='hari'){from=new Date();from.setHours(0,0,0,0);}
else if(cnPeriode==='minggu'){from=new Date();from.setDate(from.getDate()-from.getDay());from.setHours(0,0,0,0);}
else if(cnPeriode==='bulan'){from=new Date(now.getFullYear(),now.getMonth(),1);}
else if(cnPeriode==='tahun'){from=new Date(now.getFullYear(),0,1);}
else{const f=document.getElementById('cnFrom').value,t2=document.getElementById('cnTo').value;return{from:f?new Date(f):new Date(0),to:t2?new Date(t2+'T23:59:59'):now};}
return{from,to:now};
}
/* moved to modules-render.js: renderCnTab */
function startEditCurKm(){
const el=document.getElementById('cnCurKm');
if(!el||document.getElementById('cnCurKmInput'))return;
const curKm=getVehicleKm(curVehicleId);
el.innerHTML='<input class="u-fw800 u-ctext u-r8" type="number" inputmode="numeric" id="cnCurKmInput" value="'+curKm+'" style="width:120px;font-size:20px;background:var(--surface3);border:1px solid var(--accent);padding:2px 8px" data-onclick="event.stopPropagation()" onkeydown="if(event.key===\'Enter\'){this.blur();}else if(event.key===\'Escape\'){this.dataset.cancel=\'1\';this.blur();}">';
const inp=document.getElementById('cnCurKmInput');
inp.focus();inp.select();
inp.onblur=()=>commitCurKmEdit(inp);
}
async function commitCurKmEdit(inp){
const cancelled=inp.dataset.cancel==='1';
const raw=inp.value;
renderCnTab();
if(cancelled)return;
const km=parseFloat(raw);
const curKm=getVehicleKm(curVehicleId);
if(!km||km<=0){ if(raw.trim()!=='')toast('⚠️ Nilai KM tidak valid'); return; }
if(km===curKm)return;
if(km<curKm){ if(!await askConfirm('KM yang diisi lebih kecil dari catatan terakhir ('+curKm.toLocaleString('id-ID')+' km). Tetap simpan?',{danger:false,okText:'Ya, Simpan'}))return; }
D.kmLogs.push({id:uid(),vehicleId:curVehicleId,date:todayStr(),km,note:''});
save();renderCnTab();renderDashboardServisReminder();
toast('✅ KM diperbarui: '+km.toLocaleString('id-ID')+' km');
}
function openBbmModal(editId){return BBM.openModal(editId);}
function syncBbmCost(){return BBM.syncCost();}
function syncBbmLiterFromCost(){return BBM.syncLiterFromCost();}
function syncBbmHargaChanged(){return BBM.syncHargaChanged();}
function saveBbm(){return BBM.save();}
function deleteBbmFromModal(){return BBM.deleteFromModal();}
function delBbm(id){return BBM.del(id);}
/* moved to modules-render.js: renderBbmList */
function loadMoreBbmList(){return BBM.loadMore();}
function matchingVehicleName(name){
if(!name)return null;
const n=name.trim().toLowerCase();
return D.vehicles.find(v=>v.name.trim().toLowerCase()===n)||null;
}
function codeFromName(name){
if(!name)return '';
const words=name.replace(/[\/\(\)]/g,' ').trim().split(/\s+/).filter(Boolean);
let code;
if(words.length>1) code=words.map(w=>w[0]).join('').slice(0,4);
else code=words[0].slice(0,3);
return code.toUpperCase();
}
const Sparepart={
catEditIdx:null,
stockEditIdx:null,
autoFillCatCode(){
const codeEl=document.getElementById('sparepartCode');
if(!codeEl||codeEl.dataset.manual==='1')return;
codeEl.value=codeFromName(document.getElementById('sparepartName').value);
},
populateDatalist(){
const dl=document.getElementById('sparepartDatalist');
if(!dl)return;
dl.innerHTML=D.sparepartCats.map(c=>`<option value="${escapeHtml(c.name)}">`).join('');
},
renderCatList(){
const el=document.getElementById('sparepartCatList');
if(!el)return;
if(!D.sparepartCats.length){el.innerHTML='<div class="empty"><div class="empty-text">Belum ada kategori sparepart</div></div>';return;}
el.innerHTML=D.sparepartCats.map((c,i)=>`<div class="tx-item"><div class="tx-icon u-bgaccsoft">🔩</div><div class="tx-info"><div class="tx-name">${escapeHtml(c.name)} <span class="u-fs12 u-fw700 u-cacc u-bgaccsoft u-r6 u-ml4" style="padding:1px 6px">${escapeHtml(c.code||codeFromName(c.name))}</span></div><div class="tx-meta">Setiap ${c.intervalKm.toLocaleString('id-ID')} km</div></div><button class="tx-del u-bgaccsoft u-cacc" style="margin-right:6px" data-action="openSparepartModal" data-args="${escapeHtml(JSON.stringify([i]))}" aria-label="Edit/Buka">✏️</button><button class="tx-del" data-action="delSparepart" data-args="${escapeHtml(JSON.stringify([i]))}" aria-label="Hapus">🗑</button></div>`).join('');
Sparepart.populateDatalist();
Sparepart.populateStockCatSelect();
},
openCatModal(idx){
Sparepart.catEditIdx=(typeof idx==='number')?idx:null;
const isEdit=Sparepart.catEditIdx!==null;
document.getElementById('sparepartModalTitle').textContent=isEdit?'Edit Kategori Sparepart':'Tambah Kategori Sparepart';
document.getElementById('sparepartName').value=isEdit?D.sparepartCats[Sparepart.catEditIdx].name:'';
const codeEl=document.getElementById('sparepartCode');
codeEl.value=isEdit?(D.sparepartCats[Sparepart.catEditIdx].code||codeFromName(D.sparepartCats[Sparepart.catEditIdx].name)):'';
codeEl.dataset.manual=isEdit?'1':'0';
codeEl.oninput=()=>{codeEl.dataset.manual='1';};
document.getElementById('sparepartInterval').value=isEdit?D.sparepartCats[Sparepart.catEditIdx].intervalKm:'';
const sparepartDelBtnEl=document.getElementById('sparepartDelBtn'); if(sparepartDelBtnEl) sparepartDelBtnEl.style.display=isEdit?'':'none';
openModal('sparepartModal');
},
async deleteFromModal(){
if(Sparepart.catEditIdx===null)return;
const before=D.sparepartCats.length;
await Sparepart.delCat(Sparepart.catEditIdx);
if(D.sparepartCats.length<before) closeModal('sparepartModal');
},
saveCat(){
const name=document.getElementById('sparepartName').value.trim();
const interval=parseFloat(document.getElementById('sparepartInterval').value);
let code=document.getElementById('sparepartCode').value.trim().toUpperCase();
if(!name||!interval||interval<=0){toast('⚠️ Lengkapi nama & interval servis');return;}
const clash=matchingVehicleName(name);
if(clash){toast(`⚠️ "${name}" adalah nama kendaraan, bukan nama part/servis. Isi nama part yang mau diingatkan (mis. Oli Mesin, Ganti Ban, dll).`,4000);return;}
if(!code) code=codeFromName(name);
if(Sparepart.catEditIdx!==null){
D.sparepartCats[Sparepart.catEditIdx].name=name;
D.sparepartCats[Sparepart.catEditIdx].code=code;
D.sparepartCats[Sparepart.catEditIdx].intervalKm=interval;
} else {
D.sparepartCats.push({id:'sp_'+Date.now(),name,code,intervalKm:interval});
}
save();closeModal('sparepartModal');Sparepart.renderCatList();renderServisList();renderDashboardServisReminder();toast('✅ Kategori sparepart disimpan');
},
async delCat(i){
const cat=D.sparepartCats[i];
if(!cat)return;
const linkedStock=D.partsStock.filter(p=>p.catId===cat.id);
const linkedVeh=D.vehicles.filter(v=>v.intervalOverrides&&v.intervalOverrides[cat.id]>0);
let msg='Hapus kategori sparepart ini? Riwayat servis terkait tetap ada.';
if(linkedStock.length||linkedVeh.length){
const parts=[];
if(linkedStock.length)parts.push(linkedStock.length+' item Stok Sparepart');
if(linkedVeh.length)parts.push(linkedVeh.length+' interval khusus kendaraan');
msg=`⚠️ Kategori "${cat.name}" masih dipakai oleh ${parts.join(' & ')}. Kalau dihapus: item stok terkait jadi "Tanpa kategori" dan interval khusus itu ikut dihapus (kembali ke default global). Riwayat servis tetap ada. Lanjut hapus?`;
}
if(!await askConfirm(msg,{title:'Hapus Kategori Sparepart',icon:'🗑'}))return;
linkedStock.forEach(p=>{p.catId=null;});
linkedVeh.forEach(v=>{if(v.intervalOverrides)delete v.intervalOverrides[cat.id];});
D.sparepartCats.splice(i,1);save();Sparepart.renderCatList();Sparepart.renderStockList();renderServisList();renderDashboardServisReminder();
toast(linkedStock.length||linkedVeh.length?'🗑 Dihapus, referensi terkait sudah dibersihkan':'🗑 Dihapus');
},
populateStockCatSelect(){
const sel=document.getElementById('stockCatId');
if(!sel)return;
const cur=sel.value;
sel.innerHTML='<option value="">Tanpa kategori</option>'+D.sparepartCats.map(c=>`<option value="${c.id}">${escapeHtml(c.code||codeFromName(c.name))} — ${escapeHtml(c.name)}</option>`).join('');
if(cur) sel.value=cur;
},
autoFillStockCode(){
const codeEl=document.getElementById('stockCode');
if(!codeEl||codeEl.dataset.manual==='1')return;
const catId=document.getElementById('stockCatId').value;
const cat=D.sparepartCats.find(c=>c.id===catId);
const prefix=cat?(cat.code||codeFromName(cat.name)):codeFromName(document.getElementById('stockName').value);
if(!prefix){codeEl.value='';return;}
const seq=D.partsStock.filter(p=>p.code&&p.code.startsWith(prefix+'-')).length+1;
codeEl.value=prefix+'-'+String(seq).padStart(3,'0');
},
renderStockList(){
const el=document.getElementById('stockList');
if(!el)return;
if(!D.partsStock.length){el.innerHTML='<div class="empty"><div class="empty-icon">📦</div><div class="empty-text">Belum ada stok sparepart</div></div>';return;}
el.innerHTML=D.partsStock.map((p,i)=>{
const cat=D.sparepartCats.find(c=>c.id===p.catId);
const low=p.minStock>0&&p.qty<=p.minStock;
const meta=[`${p.qty}${p.unit?' '+p.unit:''}`,cat?cat.name:null,p.price?fmtFull(p.price):null].filter(Boolean).join(' • ');
return `<div class="tx-item"><div class="tx-icon" style="background:${low?'rgba(255,80,80,.15)':'var(--accent-soft)'}">${low?'⚠️':'📦'}</div><div class="tx-info"><div class="tx-name">${escapeHtml(p.name)} <span class="u-fs12 u-fw700 u-cacc u-bgaccsoft u-r6 u-ml4" style="padding:1px 6px">${escapeHtml(p.code||'-')}</span></div><div class="tx-meta" style="${low?'color:#ff5050;font-weight:700':''}">${escapeHtml(meta)}${low?' • Stok menipis!':''}${p.note?' • '+escapeHtml(p.note):''}</div></div><button class="tx-del u-bgaccsoft u-cacc" style="margin-right:6px" data-action="openStockModal" data-args="${escapeHtml(JSON.stringify([i]))}" aria-label="Edit/Buka">✏️</button><button class="tx-del" data-action="delStock" data-args="${escapeHtml(JSON.stringify([i]))}" aria-label="Hapus">🗑</button></div>`;
}).join('');
},
openStockModal(idx){
Sparepart.stockEditIdx=(typeof idx==='number')?idx:null;
const isEdit=Sparepart.stockEditIdx!==null;
Sparepart.populateStockCatSelect();
document.getElementById('stockModalTitle').textContent=isEdit?'Edit Stok Sparepart':'Tambah Stok Sparepart';
const p=isEdit?D.partsStock[Sparepart.stockEditIdx]:null;
document.getElementById('stockCatId').value=isEdit?(p.catId||''):'';
document.getElementById('stockName').value=isEdit?p.name:'';
const codeEl=document.getElementById('stockCode');
codeEl.value=isEdit?(p.code||''):'';
codeEl.dataset.manual=isEdit?'1':'0';
codeEl.oninput=()=>{codeEl.dataset.manual='1';};
document.getElementById('stockQty').value=isEdit?p.qty:'';
document.getElementById('stockUnit').value=isEdit?(p.unit||''):'pcs';
document.getElementById('stockMin').value=isEdit?(p.minStock||''):'1';
document.getElementById('stockPrice').value=isEdit?(p.price||''):'';
document.getElementById('stockNote').value=isEdit?(p.note||''):'';
openModal('stockModal');
},
saveStock(){
const name=document.getElementById('stockName').value.trim();
const catId=document.getElementById('stockCatId').value||null;
let code=document.getElementById('stockCode').value.trim().toUpperCase();
const qty=parseFloat(document.getElementById('stockQty').value)||0;
const unit=document.getElementById('stockUnit').value.trim();
const minStock=parseFloat(document.getElementById('stockMin').value)||0;
const price=parseFloat(document.getElementById('stockPrice').value)||0;
const note=document.getElementById('stockNote').value.trim();
if(!name){toast('⚠️ Isi nama sparepart dulu');return;}
if(!code){
const cat=D.sparepartCats.find(c=>c.id===catId);
const prefix=cat?(cat.code||codeFromName(cat.name)):codeFromName(name);
const seq=D.partsStock.filter(p=>p.code&&p.code.startsWith(prefix+'-')).length+1;
code=prefix+'-'+String(seq).padStart(3,'0');
}
if(Sparepart.stockEditIdx!==null){
Object.assign(D.partsStock[Sparepart.stockEditIdx],{name,catId,code,qty,unit,minStock,price,note});
} else {
D.partsStock.push({id:'st_'+Date.now(),name,catId,code,qty,unit,minStock,price,note});
}
save();closeModal('stockModal');Sparepart.renderStockList();toast('✅ Stok sparepart disimpan');
},
async delStock(i){
if(!await askConfirm('Hapus item stok sparepart ini?'))return;
D.partsStock.splice(i,1);save();Sparepart.renderStockList();toast('🗑 Dihapus');
}
};
function autoFillSparepartCode(){return Sparepart.autoFillCatCode();}
function populateSparepartDatalist(){return Sparepart.populateDatalist();}
/* moved to modules-render.js: renderSparepartCatList */
function openSparepartModal(idx){return Sparepart.openCatModal(idx);}
function saveSparepart(){return Sparepart.saveCat();}
function delSparepart(i){return Sparepart.delCat(i);}
function populateStockCatSelect(){return Sparepart.populateStockCatSelect();}
function autoFillStockCode(){return Sparepart.autoFillStockCode();}
/* moved to modules-render.js: renderStockList */
function openStockModal(idx){return Sparepart.openStockModal(idx);}
function saveStock(){return Sparepart.saveStock();}
function delStock(i){return Sparepart.delStock(i);}
function populateServisPartSelect(selectedPartId){return Servis.populatePartSelect(selectedPartId);}
function onServisPartChange(){return Servis.onPartChange();}
function onServisItemAutofillInterval(){return Servis.onItemAutofillInterval();}
function openServisModal(editId,prefillItem){return Servis.openModal(editId,prefillItem);}
const TORSI_DB=[
{matchNames:['vario 125'],
sourceNote:'Honda Vario 125 (KZR) — Buku Pedoman Reparasi, bagian Spesifikasi & Torsi Pengencangan (hal. 1-4 s/d 1-8) & Perawatan (hal. 3-3).',
cats:[
{cat:'Perawatan Berkala', icon:'🛠️', items:[
{name:'Mur pengunci kabel gas', ulir:'8 mm', nm:8.5, kgf:0.9},
{name:'Sekrup cover rumah saringan udara', ulir:'5 mm', nm:1.1, kgf:0.1},
{name:'Busi', ulir:'10 mm', nm:16, kgf:1.6, interval:'Periksa tiap 4.000 km · Ganti tiap 8.000 km', consumable:true},
{name:'Mur pengunci sekrup penyetel valve', ulir:'5 mm', nm:10, kgf:1.0, note:'oli', interval:'Periksa/setel tiap 4.000 km'},
{name:'Baut pembuangan oli mesin', ulir:'12 mm', nm:24, kgf:2.4, interval:'Ganti oli tiap 4.000 km', consumable:true},
{name:'Tutup saringan kasa oli mesin', ulir:'30 mm', nm:20, kgf:2.0, interval:'Bersihkan tiap 8.000 km'},
{name:'Baut pemeriksaan oli final reduction', ulir:'8 mm', nm:23, kgf:2.3, interval:'Ganti oli transmisi tiap 8.000 km'},
{name:'Baut pembuangan oli final reduction (transmisi)', ulir:'8 mm', nm:23, kgf:2.3, interval:'Ganti oli transmisi tiap 8.000 km'},
{name:'Mur pengunci kabel penghubung equalizer (tipe CBS)', ulir:'8 mm', nm:6.4, kgf:0.7},
{name:'Saringan udara', ulir:'—', nm:null, kgf:null, interval:'Ganti tiap 16.000 km (lebih sering jika area basah/berdebu)', consumable:true, noTorque:true},
{name:'Drive belt (v-belt CVT)', ulir:'—', nm:null, kgf:null, interval:'Periksa tiap 8.000 km · Ganti tiap 32.000 km', consumable:true, noTorque:true},
{name:'Minyak rem', ulir:'—', nm:null, kgf:null, interval:'Periksa tiap 4.000 km · Ganti tiap 2 tahun', consumable:true, noTorque:true},
{name:'Cairan pendingin radiator (coolant)', ulir:'—', nm:null, kgf:null, interval:'Periksa tiap 4.000 km · Ganti tiap 2 tahun', consumable:true, noTorque:true},
]},
{cat:'Mesin — Cylinder Head/Valve', icon:'⚙️', items:[
{name:'Baut stopper camshaft', ulir:'6 mm', nm:10, kgf:1.0},
{name:'Baut stopper shaft rocker arm', ulir:'5 mm', nm:5, kgf:0.5, note:'oli'},
{name:'Baut socket cam sprocket', ulir:'5 mm', nm:8, kgf:0.8, note:'oli'},
{name:'Sekrup cam chain tensioner lifter', ulir:'6 mm', nm:4, kgf:0.4},
{name:'Baut penahan pompa air', ulir:'6 mm', nm:10, kgf:1.0},
{name:'Mur cylinder head', ulir:'8 mm', nm:27, kgf:2.8, note:'oli'},
{name:'Baut stud cylinder', ulir:'8 mm', nm:9, kgf:0.9},
]},
{cat:'Mesin — Kopling/Pulley/Final Drive', icon:'🔗', items:[
{name:'Sekrup plat cover crankcase kiri', ulir:'4 mm', nm:3.2, kgf:0.3},
{name:'Mur drive pulley face', ulir:'14 mm', nm:59, kgf:6.0, note:'oli'},
{name:'Mur kopling/driven pulley', ulir:'28 mm', nm:54, kgf:5.5},
{name:'Mur clutch outer', ulir:'12 mm', nm:49, kgf:5.0},
{name:'Baut final reduction case', ulir:'8 mm', nm:23, kgf:2.3},
{name:'Mur link penggantung mesin (sisi rangka)', ulir:'10 mm', nm:69, kgf:7.0},
{name:'Mur link penggantung mesin (sisi mesin)', ulir:'10 mm', nm:49, kgf:5.0},
]},
{cat:'Sistem PGM-FI & Bahan Bakar', icon:'⛽', items:[
{name:'Sekrup torx katup solenoid peninggi putaran stasioner', ulir:'5 mm', nm:3.4, kgf:0.3},
{name:'Sensor ECT', ulir:'10 mm', nm:12, kgf:1.2},
{name:'Sensor O2', ulir:'12 mm', nm:24.5, kgf:2.5},
{name:'Mur plat pemasangan pompa bahan bakar', ulir:'6 mm', nm:12, kgf:1.2},
{name:'Sekrup dudukan kabel gas', ulir:'5 mm', nm:3.4, kgf:0.3},
{name:'Baut pemasangan joint injector', ulir:'6 mm', nm:12, kgf:1.2},
{name:'Baut pemasangan pompa oli', ulir:'6 mm', nm:10, kgf:1.0},
{name:'Baut pembuangan radiator', ulir:'10 mm', nm:1, kgf:0.1},
]},
{cat:'Roda Depan/Suspensi/Kemudi', icon:'🛞', items:[
{name:'Baut socket cakram rem depan', ulir:'8 mm', nm:42, kgf:4.3, note:'new'},
{name:'Mur as roda depan', ulir:'12 mm', nm:59, kgf:6.0},
{name:'Baut socket fork', ulir:'8 mm', nm:20, kgf:2.0},
{name:'Baut penjepit bottom bridge', ulir:'10 mm', nm:64, kgf:6.5},
{name:'Baut pemasangan caliper rem depan', ulir:'8 mm', nm:30, kgf:3.1, note:'new'},
{name:'Mur batang stang kemudi', ulir:'10 mm', nm:59, kgf:6.0},
{name:'Mur pengunci poros kemudi', ulir:'26 mm', nm:74, kgf:7.5},
]},
{cat:'Roda Belakang/Suspensi', icon:'🛞', items:[
{name:'Mur as roda belakang', ulir:'16 mm', nm:118, kgf:12.0, note:'oli'},
{name:'Baut pemasangan atas shock absorber', ulir:'10 mm', nm:59, kgf:6.0},
{name:'Baut pemasangan bawah shock absorber', ulir:'8 mm', nm:26, kgf:2.7},
]},
{cat:'Sistem Rem', icon:'🛑', items:[
{name:'Baut arm rem belakang', ulir:'6 mm', nm:10, kgf:1.0, note:'new'},
{name:'Katup pembuangan caliper rem', ulir:'8 mm', nm:5.4, kgf:0.6},
{name:'Sekrup tutup reservoir master cylinder rem', ulir:'4 mm', nm:1.5, kgf:0.2},
{name:'Pin brake pad (kampas rem)', ulir:'10 mm', nm:18, kgf:1.8, interval:'Periksa keausan tiap 4.000 km', consumable:true},
{name:'Mur as handel rem depan', ulir:'6 mm', nm:6, kgf:0.6},
{name:'Baut oli selang rem', ulir:'10 mm', nm:34, kgf:3.5},
{name:'Pin dudukan caliper rem', ulir:'8 mm', nm:18, kgf:1.8},
]},
{cat:'Kelistrikan & Panel', icon:'🔌', items:[
{name:'Baut socket pemasangan stator', ulir:'6 mm', nm:10, kgf:1.0},
{name:'Baut spesial pemasangan sensor CKP', ulir:'6 mm', nm:10, kgf:1.0},
{name:'Mur flywheel', ulir:'12 mm', nm:69, kgf:7.0},
{name:'Baut pemasangan kipas pendingin', ulir:'6 mm', nm:8.5, kgf:0.9},
{name:'Baut pemasangan sensor VS', ulir:'6 mm', nm:12, kgf:1.2},
{name:'Sekrup pemasangan kunci kontak', ulir:'6 mm', nm:9, kgf:0.9, note:'new'},
{name:'Baut pemasangan muffler', ulir:'10 mm', nm:59, kgf:6.0},
{name:'Mur joint pipa exhaust', ulir:'7 mm', nm:26.5, kgf:2.7},
{name:'Baut as standar samping', ulir:'10 mm', nm:10, kgf:1.0},
{name:'Mur pengunci as standar samping', ulir:'10 mm', nm:29, kgf:3.0},
]},
]},
{matchNames:['beat fi','beat-fi','beat esp','beat pgm-fi','vario 110','vario110','vario 110 esp'],
sourceNote:'Honda BeAT FI Gen 1 — Buku Pedoman Reparasi, bab Informasi Umum (Spesifikasi & Torsi Pengencangan, hal. 1-4 s/d 1-11) & Perawatan (Jadwal Perawatan Berkala, hal. 3-3). Catatan: mesin 108cc (non-liquid cooled) satu platform dengan Vario 110 (eSP) — torsi mekanis dipakaikan juga untuk Vario 110 di sini, TAPI spek non-mesin (ban/rem/kelistrikan/kapasitas) belum terverifikasi khusus utk Vario 110 — cek ulang ke buku manual Vario 110 kalau ragu, terutama bagian Roda/Rem/Kelistrikan.',
cats:[
{cat:'Perawatan Berkala', icon:'🛠️', items:[
{name:'Mur pengunci kabel gas', ulir:'8 mm', nm:8.5, kgf:0.9},
{name:'Sekrup cover rumah saringan udara', ulir:'5 mm', nm:1.1, kgf:0.1},
{name:'Busi', ulir:'10 mm', nm:16, kgf:1.6, interval:'Periksa tiap 4.000 km · Ganti tiap 8.000 km', consumable:true},
{name:'Mur pengunci sekrup penyetel valve', ulir:'5 mm', nm:10, kgf:1.0, note:'oli', interval:'Periksa/setel tiap 1.000 km, lalu tiap kelipatan 4.000 km'},
{name:'Baut pembuangan oli mesin', ulir:'12 mm', nm:24, kgf:2.4, interval:'Ganti oli tiap 4.000 km (servis pertama di 1.000 km)', consumable:true},
{name:'Tutup saringan kasa oli mesin', ulir:'30 mm', nm:20, kgf:2.0, interval:'Bersihkan tiap 12.000 km (servis pertama di 1.000 km)'},
{name:'Baut pemeriksaan oli final reduction', ulir:'8 mm', nm:13, kgf:1.3, interval:'Ganti oli transmisi tiap 8.000 km'},
{name:'Baut pembuangan oli final reduction (transmisi)', ulir:'8 mm', nm:13, kgf:1.3, interval:'Ganti oli transmisi tiap 8.000 km'},
{name:'Mur pengunci kabel penghubung equalizer (tipe CBS)', ulir:'8 mm', nm:6.4, kgf:0.7},
{name:'Jari-jari (tipe spoke wheel)', ulir:'BC 3,2 mm', nm:3.7, kgf:0.4},
{name:'Baut penyetel arah sinar lampu depan', ulir:'4 mm', nm:2.0, kgf:0.2},
{name:'Saringan udara', ulir:'—', nm:null, kgf:null, interval:'Ganti tiap 16.000 km (lebih sering jika area basah/berdebu)', consumable:true, noTorque:true},
{name:'Drive belt (v-belt CVT)', ulir:'—', nm:null, kgf:null, interval:'Periksa tiap 8.000 km · Ganti tiap 24.000 km', consumable:true, noTorque:true},
{name:'Minyak rem', ulir:'—', nm:null, kgf:null, interval:'Periksa tiap 4.000 km · Ganti tiap 2 tahun', consumable:true, noTorque:true},
]},
{cat:'Mesin — Cylinder Head/Valve', icon:'⚙️', items:[
{name:'Sekrup pemasangan intake shroud', ulir:'5 mm', nm:0.8, kgf:0.1},
{name:'Baut pemasangan exhaust shroud', ulir:'6 mm', nm:7.0, kgf:0.7},
{name:'Mur cylinder head', ulir:'7 mm', nm:18, kgf:1.8, note:'oli'},
{name:'Baut cam sprocket', ulir:'5 mm', nm:8.0, kgf:0.8, note:'oli'},
{name:'Sekrup cam chain tensioner lifter', ulir:'6 mm', nm:4.0, kgf:0.4},
{name:'Baut special cover cylinder head', ulir:'6 mm', nm:10, kgf:1.0},
{name:'Sekrup pemasangan breather plate', ulir:'4 mm', nm:3.0, kgf:0.3},
{name:'Baut pin as cam chain tensioner slider', ulir:'6 mm', nm:10, kgf:1.0},
{name:'Baut stud cylinder', ulir:'7 mm', nm:6.0, kgf:0.6},
]},
{cat:'Mesin — Kopling/Pulley/Final Drive', icon:'🔗', items:[
{name:'Sekrup plat cover crankcase kiri', ulir:'4 mm', nm:3.0, kgf:0.3},
{name:'Mur drive pulley face', ulir:'14 mm', nm:108, kgf:11.0, note:'oli'},
{name:'Mur kopling/driven pulley', ulir:'28 mm', nm:54, kgf:5.5},
{name:'Mur clutch outer', ulir:'12 mm', nm:49, kgf:5.0},
{name:'Mur link penggantung mesin (sisi mesin)', ulir:'10 mm', nm:49, kgf:5.0},
{name:'Mur link penggantung mesin (sisi rangka)', ulir:'10 mm', nm:69, kgf:7.0},
]},
{cat:'Sistem PGM-FI & Bahan Bakar', icon:'⛽', items:[
{name:'Sekrup torx katup solenoid peninggi putaran stasioner', ulir:'5 mm', nm:3.4, kgf:0.3},
{name:'Sensor EOT', ulir:'10 mm', nm:14.5, kgf:1.5},
{name:'Sensor O2', ulir:'12 mm', nm:25, kgf:2.5},
{name:'Mur plat pemasangan pompa bahan bakar', ulir:'6 mm', nm:12, kgf:1.2},
{name:'Sekrup dudukan kabel gas', ulir:'5 mm', nm:3.4, kgf:0.3},
{name:'Baut pemasangan joint injector', ulir:'6 mm', nm:12, kgf:1.2},
{name:'Sekrup plat pompa oli', ulir:'4 mm', nm:3.0, kgf:0.3},
{name:'Baut pemasangan pompa oli', ulir:'6 mm', nm:10, kgf:1.0},
]},
{cat:'Roda Depan/Suspensi/Kemudi', icon:'🛞', items:[
{name:'Mur as roda depan', ulir:'12 mm', nm:59, kgf:6.0},
{name:'Baut socket cakram rem depan', ulir:'8 mm', nm:42, kgf:4.3, note:'new'},
{name:'Baut socket fork', ulir:'8 mm', nm:20, kgf:2.0},
{name:'Baut penjepit bottom bridge', ulir:'10 mm', nm:64, kgf:6.5},
{name:'Baut fork', ulir:'20 mm', nm:22.5, kgf:2.3},
{name:'Baut pemasangan caliper rem depan', ulir:'8 mm', nm:30, kgf:3.0, note:'new'},
{name:'Mur batang stang kemudi', ulir:'10 mm', nm:59, kgf:6.0},
]},
{cat:'Roda Belakang/Suspensi', icon:'🛞', items:[
{name:'Mur as roda belakang', ulir:'16 mm', nm:118, kgf:12.0, note:'oli'},
{name:'Baut pemasangan atas shock absorber belakang', ulir:'10 mm', nm:59, kgf:6.0},
{name:'Baut pemasangan bawah shock absorber belakang', ulir:'8 mm', nm:26.5, kgf:2.7},
]},
{cat:'Sistem Rem', icon:'🛑', items:[
{name:'Baut arm rem belakang', ulir:'6 mm', nm:10, kgf:1.0, note:'new'},
{name:'Katup pembuangan caliper rem', ulir:'8 mm', nm:5.4, kgf:0.6},
{name:'Sekrup tutup reservoir master cylinder rem', ulir:'4 mm', nm:1.5, kgf:0.2},
{name:'Pin brake pad (kampas rem)', ulir:'10 mm', nm:18, kgf:1.8, interval:'Periksa keausan tiap 4.000 km', consumable:true},
{name:'Mur as handel rem depan', ulir:'6 mm', nm:6.0, kgf:0.6},
{name:'Baut oli selang rem', ulir:'10 mm', nm:34, kgf:3.5},
{name:'Pin dudukan caliper rem', ulir:'8 mm', nm:18, kgf:1.8},
]},
{cat:'Kelistrikan & Panel', icon:'🔌', items:[
{name:'Baut pemasangan kipas pendingin', ulir:'6 mm', nm:8.0, kgf:0.8},
{name:'Mur flywheel', ulir:'10 mm', nm:39, kgf:4.0},
{name:'Baut pemasangan sensor CKP', ulir:'5 mm', nm:6.0, kgf:0.6},
{name:'Baut pemasangan muffler', ulir:'10 mm', nm:59, kgf:6.0},
{name:'Baut pelindung muffler', ulir:'6 mm', nm:10, kgf:1.0},
{name:'Baut as standar samping', ulir:'10 mm', nm:10, kgf:1.0},
{name:'Mur pengunci as standar samping', ulir:'10 mm', nm:29, kgf:3.0},
{name:'Baut socket key shutter', ulir:'6 mm', nm:10, kgf:1.0, note:'new'},
]},
]},
];
function findTorsiDb(vehName){
if(!vehName)return null;
const n=vehName.toLowerCase();
return TORSI_DB.find(s=>s.matchNames.some(m=>n.includes(m)))||null;
}
const TORSI_NM_PER_KGF=9.80665, TORSI_NM_PER_LBFT=1.35582, TORSI_NM_PER_LBIN=0.112985;
const VEHICLE_SPEC_DB=[
{matchNames:['vario 125'], sourceNote:'Honda Vario 125 (KZR) — Buku Pedoman Reparasi, bab SPESIFIKASI (hal. 1-4 s/d 1-8) & PERAWATAN (hal. 3-3)',
umum:{
'Kapasitas tangki BBM':'5,5 liter',
'Oli mesin (ganti rutin)':'0,8 liter',
'Oli mesin (setelah bongkar/ganti saringan)':'0,9 liter',
'Jenis oli mesin':'SAE 10W-30 · API SG atau lebih tinggi · JASO T903: MB',
'Oli transmisi/final drive (rutin)':'0,12 liter',
'Oli transmisi/final drive (bongkar)':'0,14 liter',
'Coolant (radiator+mesin)':'0,51 liter',
'Coolant (tangki cadangan)':'0,14 liter',
'Jenis coolant':'Honda PRE-MIX Coolant',
'Busi':'NGK CPR7EA-9 / DENSO U22EPR-9',
'Celah busi':'0,8 – 0,9 mm',
'RPM stasioner':'1.700 ± 100 rpm',
'Waktu pengapian':'12° sebelum TMA (saat stasioner)',
},
ban:{
depan:{ukuran:'80/90-14 M/C 40P', tekanan:'200 kPa · 2,00 kgf/cm² · 29 psi (solo maupun boncengan)'},
belakang:{ukuran:'90/90-14 M/C 46P', tekanan:'225 kPa · 2,25 kgf/cm² · 33 psi (solo maupun boncengan)'},
},
kelistrikan:{
aki:'YTZ6V — 12V, 5 Ah',
sekring:'Utama 25A · Tambahan 10A × 5',
bohlam:[
['Lampu depan','12V 25/25W ×2'],
['Lampu senja','12V 3,4W ×2'],
['Lampu belakang','12V 5W'],
['Lampu rem','12V 10W ×2'],
['Lampu plat nomor','12V 5W'],
['Lampu sein','12V 10W ×4'],
],
},
batasServis:[
['Ketebalan cakram rem depan','3,3–3,7 mm','Min 3,0 mm'],
['Diameter tromol rem belakang','–','Maks 131,0 mm'],
],
},
{matchNames:['beat fi','beat-fi','beat esp','beat pgm-fi'], sourceNote:'Honda BeAT FI Gen 1 — Buku Pedoman Reparasi, bab INFORMASI UMUM (hal. 1-4 s/d 1-11) & PERAWATAN (hal. 3-3). Mesin 108cc satu platform dengan Vario 110 (eSP), tapi verifikasi ulang sebelum dipakai untuk motor lain.',
umum:{
'Kapasitas tangki BBM':'3,7 liter',
'Oli mesin (ganti rutin)':'0,7 liter',
'Oli mesin (setelah bongkar/ganti saringan)':'0,8 liter',
'Jenis oli mesin':'SAE 10W-30 · API SG atau lebih tinggi · JASO T903: MB',
'Oli transmisi/final drive (rutin)':'0,14 liter',
'Oli transmisi/final drive (bongkar)':'0,16 liter',
'Sistem pendinginan':'Udara paksa (tidak pakai radiator/coolant)',
'Busi':'NGK CPR9EA-9 / DENSO U27EPR9',
'Celah busi':'0,80 – 0,90 mm',
'RPM stasioner':'1.700 ± 100 rpm',
'Waktu pengapian':'7° sebelum TMA (saat stasioner)',
},
ban:{
depan:{ukuran:'80/90-14 M/C 40P', tekanan:'200 kPa · 2,00 kgf/cm² · 29 psi (solo maupun boncengan)'},
belakang:{ukuran:'90/90-14 M/C 46P', tekanan:'225 kPa · 2,25 kgf/cm² · 33 psi (solo maupun boncengan)'},
},
kelistrikan:{
aki:'GTZ4V / YTZ4V — 12V, 3 Ah',
sekring:'Utama 15A · Tambahan 10A',
bohlam:[
['Lampu depan','12V 32/32W'],
['Lampu senja','12V 3,4W'],
['Lampu rem/belakang','12V 18/5W'],
['Lampu sein','12V 10W ×4'],
['Lampu instrumen','12V 1,7W ×2'],
['Indikator lampu jauh','12V 1,7W'],
['Indikator sein','12V 3,4W'],
['MIL','12V 1,7W'],
],
},
batasServis:[
['Ketebalan cakram rem depan','3,3–3,7 mm','Min 3,0 mm'],
['Diameter tromol rem belakang','130,0 mm','Maks 131,0 mm'],
],
},
];
function findVehicleSpec(vehName){
if(!vehName)return null;
const n=vehName.toLowerCase();
return VEHICLE_SPEC_DB.find(s=>s.matchNames.some(m=>n.includes(m)))||null;
}
/* moved to modules-render.js: renderVehicleSpecCard */
const MY_WRENCH_SCALE=(()=>{
const marks=[];
for(let l=MY_WRENCH.minLbft;l<=MY_WRENCH.maxLbft;l+=10){
marks.push({lbft:l, nm:Math.round(l*TORSI_NM_PER_LBFT*100)/100});
}
return marks;
})();
function revertStockUsage(partId,qty){return Servis.revertStockUsage(partId,qty);}
function applyStockUsage(partId,qty){return Servis.applyStockUsage(partId,qty);}
function saveServis(){return Servis.save();}
function deleteServisFromModal(){return Servis.deleteFromModal();}
function delServis(id){return Servis.del(id);}
function markSparepartServiced(catId){return Servis.markServiced(catId);}
function getLastServiceKmForCat(vehicleId,cat){return Servis.getLastServiceKmForCat(vehicleId,cat);}
function editSparepartFromReminder(catId){return Servis.editSparepartFromReminder(catId);}
/* moved to modules-render.js: renderServisReminder */
function loadMoreServisList(){return Servis.loadMore();}
/* moved to modules-render.js: renderServisList */
// Filter kendaraan untuk kartu Pengingat Servis di Dashboard (dipindah dari
// features-kategori-modal-tagihan-kalender.js v80 (dipecah jadi kategori.js/
// tagihan-kalender.js), lihat PEMISAHAN-FILE-ROADMAP.md)
let dashServisVehFilter='semua';
(function(){try{dashServisVehFilter=localStorage.getItem('kw_dashServisVehFilter')||'semua';}catch(e){}})();
function setDashServisVehFilter(vehId){
dashServisVehFilter=vehId;
safeSetItem('kw_dashServisVehFilter',vehId);
renderDashboardServisReminder();
}
/* moved to modules-render.js: renderDashServisVehChips */
/* moved to modules-render.js: renderDashboardServisReminder */
function goToServisFromDash(vehicleId){
if(vehicleId&&D.vehicles.find(v=>v.id===vehicleId)){curVehicleId=vehicleId;renderVehicleSelect();}
goToList('servisReminderCard','carnotes',4,null,'servis');
}
const STORAGE_QUOTA_ESTIMATE=5*1024*1024;
const STORAGE_BIG_MODULES=[
{key:'transactions',label:'💰 Transaksi Keuangan'},
{key:'cobek',label:'🪨 Shop (Order)'},
{key:'bbmLogs',label:'⛽ Log BBM'},
{key:'servisLogs',label:'🔧 Log Servis'},
{key:'kmLogs',label:'📍 Catatan KM'},
{key:'jalanLogs',label:'🛣️ Catatan Perjalanan (fitur lama, data lama)'},
{key:'partsStock',label:'📦 Stok Sparepart'},
{key:'products',label:'🛍️ Produk Etalase (Shop)'},
{key:'bills',label:'🧾 Tagihan'},
{key:'targets',label:'🎯 Target Tabungan'},
{key:'eduFunds',label:'🎓 Dana Pendidikan'},
{key:'renovProjects',label:'🛠️ Proyek Renovasi'},
{key:'wishlist',label:'📋 Prioritas Belanja'},
];
function byteSize(v){ try{ return new Blob([JSON.stringify(v)]).size; }catch(e){ return 0; } }
/* moved to modules-render.js: renderStorageUsage */
/* moved to modules-render.js: renderActualStorageQuota */
function fmtBytes(b){
if(b<1024) return b+' B';
if(b<1024*1024) return (b/1024).toFixed(1)+' KB';
return (b/1024/1024).toFixed(2)+' MB';
}
const ARCHIVE_MODULES=[
{key:'transactions',label:'💰 Transaksi Keuangan'},
{key:'cobek',label:'🪨 Shop (Order)'},
{key:'bbmLogs',label:'⛽ Log BBM'},
{key:'servisLogs',label:'🔧 Log Servis'},
{key:'kmLogs',label:'📍 Catatan KM'},
{key:'jalanLogs',label:'🛣️ Catatan Perjalanan (fitur lama)'},
];
let archiveSelectedYears=new Set();
let archiveExportedYears=null;
function archiveGetYear(dateStr){
const d=new Date(dateStr);
return isNaN(d)?null:d.getFullYear();
}
function archiveAvailableYears(){
const years=new Set();
ARCHIVE_MODULES.forEach(m=>{
(D[m.key]||[]).forEach(item=>{
const y=archiveGetYear(item.date);
if(y) years.add(y);
});
});
return Array.from(years).sort((a,b)=>b-a);
}
/* moved to modules-render.js: renderArchiveSuggestHint */
/* moved to modules-render.js: renderArchiveHistory */
function openArchiveModal(){
archiveSelectedYears=new Set();
archiveExportedYears=null;
document.getElementById('archiveStep1').style.display='block';
document.getElementById('archiveStep2').style.display='none';
const years=archiveAvailableYears();
const curYear=new Date().getFullYear();
const listEl=document.getElementById('archiveYearList');
const hintEl=document.getElementById('archiveEmptyHint');
if(!years.length){
listEl.innerHTML='';
hintEl.textContent='Belum ada data riwayat yang bisa diarsip.';
} else {
hintEl.textContent=years.includes(curYear)?'⚠️ Tahun berjalan ('+curYear+') tetap bisa dipilih, tapi hati-hati kalau masih aktif dipakai.':'';
listEl.innerHTML=years.map(y=>{
const counts=ARCHIVE_MODULES.reduce((s,m)=>s+(D[m.key]||[]).filter(it=>archiveGetYear(it.date)===y).length,0);
return `<label class="u-flex u-aic u-gap10 u-r10 u-pointer" style="padding:10px 12px;background:var(--surface2);border:1px solid var(--border2)">
        <input type="checkbox" style="width:18px;height:18px" onchange="toggleArchiveYear(${y},this)">
        <span class="u-flex1">${y}</span>
        <span class="u-fs12t2">${counts.toLocaleString('id-ID')} data</span>
      </label>`;
}).join('');
}
updateArchivePreview();
openModal('archiveModal');
}
function toggleArchiveYear(year,el){
if(el.checked) archiveSelectedYears.add(year); else archiveSelectedYears.delete(year);
updateArchivePreview();
}
function archiveCollectByYears(years){
const out={};
ARCHIVE_MODULES.forEach(m=>{
out[m.key]=(D[m.key]||[]).filter(it=>years.has(archiveGetYear(it.date)));
});
return out;
}
function updateArchivePreview(){
const el=document.getElementById('archivePreview');
if(!el)return;
if(!archiveSelectedYears.size){ el.textContent='Pilih minimal 1 tahun dulu.'; return; }
const data=archiveCollectByYears(archiveSelectedYears);
const total=Object.values(data).reduce((s,arr)=>s+arr.length,0);
const yearsSorted=Array.from(archiveSelectedYears).sort();
el.textContent=`Akan mengarsip ${total.toLocaleString('id-ID')} data dari tahun ${yearsSorted.join(', ')} (semua modul riwayat di atas).`;
}
function archiveExportStep(){
if(!archiveSelectedYears.size){ toast('⚠️ Pilih minimal 1 tahun dulu'); return; }
const years=new Set(archiveSelectedYears);
const data=archiveCollectByYears(years);
const total=Object.values(data).reduce((s,arr)=>s+arr.length,0);
if(!total){ toast('⚠️ Tidak ada data di tahun terpilih'); return; }
const format=document.getElementById('archiveFormat').value;
const yearsTag=Array.from(years).sort().join('-');
const dateTag=new Date().toISOString().split('T')[0];
if(format==='json'){
const out={schemaVersion:SCHEMA_VERSION,archivedAt:new Date().toISOString(),archivedYears:Array.from(years).sort(),...data};
const blob=new Blob([JSON.stringify(out,null,2)],{type:'application/json'});
const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='arsip-W-'+yearsTag+'-'+dateTag+'.json';a.click();
} else {
const csvParts=[];
const toCSVRow=arr=>arr.map(v=>{v=(v===null||v===undefined)?'':String(v);return v.includes(',')||v.includes('"')?'"'+v.replace(/"/g,'""')+'"':v;}).join(',');
ARCHIVE_MODULES.forEach(m=>{
const arr=data[m.key];
if(!arr||!arr.length)return;
csvParts.push('=== '+m.label+' ===');
csvParts.push(toCSVRow(['ID','Tanggal','Data (JSON)']));
arr.forEach(it=>csvParts.push(toCSVRow([it.id,it.date,JSON.stringify(it)])));
csvParts.push('');
});
const blob=new Blob([csvParts.join('\n')],{type:'text/csv'});
const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='arsip-W-'+yearsTag+'-'+dateTag+'.csv';a.click();
}
archiveExportedYears=years;
document.getElementById('archiveStep1').style.display='none';
document.getElementById('archiveStep2').style.display='block';
toast('✅ File arsip sudah di-download ('+total.toLocaleString('id-ID')+' data)');
}
async function archiveDeleteStep(){
if(!archiveExportedYears||!archiveExportedYears.size){ toast('⚠️ Export dulu sebelum hapus'); return; }
const years=archiveExportedYears;
const data=archiveCollectByYears(years);
const total=Object.values(data).reduce((s,arr)=>s+arr.length,0);
const yearsSorted=Array.from(years).sort();
const ok=await askConfirm(`Hapus ${total.toLocaleString('id-ID')} data tahun ${yearsSorted.join(', ')} dari HP? File arsip sudah kamu download — pastikan file itu aman sebelum lanjut. Ini TIDAK BISA dibatalkan.`,{title:'Hapus Data Arsip',danger:true,okText:'Ya, Hapus dari HP',icon:'🗑️'});
if(!ok)return;
ARCHIVE_MODULES.forEach(m=>{
if(!D[m.key])return;
D[m.key]=D[m.key].filter(it=>!years.has(archiveGetYear(it.date)));
});
if(!D.archiveHistory)D.archiveHistory=[];
D.archiveHistory.push({date:new Date().toISOString(),years:yearsSorted,totalItems:total});
save();
renderStorageUsage();
closeModal('archiveModal');
toast(`✅ ${total.toLocaleString('id-ID')} data tahun ${yearsSorted.join(', ')} berhasil diarsip & dihapus dari HP`,4000);
}
/* moved to modules-render.js: renderSettings */
let chatInited=false;
let _pendingChatActions={};
function chatActionSummary(type,data){
switch(type){
case 'add_transaksi':return `${data.type==='income'?'Pemasukan':'Pengeluaran'} ${fmtFull(Number(data.amount)||0)} — ${data.category||'Lainnya'}${data.note?' ('+data.note+')':''}`;
case 'add_tagihan':return `${data.name||'Tagihan'} — ${fmtFull(Number(data.amount)||0)}, jatuh tempo ${data.nextDue||'-'}`;
case 'add_servis':return `${data.item||'Servis'} — ${data.vehicleName||'kendaraan'} — ${fmtFull(Number(data.cost)||0)}`;
case 'add_target':return `${data.name||'Target'} — target ${fmtFull(Number(data.amount)||0)}`;
case 'add_catatan_anak':return `"${data.text||''}"`;
case 'add_wishlist':return `${data.name||'Barang'} — ${fmtFull(Number(data.price)||0)}${data.cat==='kebutuhan'?' · 🛠️ Kebutuhan':' · ✨ Keinginan'}`;
default:return JSON.stringify(data);
}
}
function _repairLooseJson(raw){
let s=raw.trim();
s=s.replace(/[\u2018\u2019]/g,"'").replace(/[\u201C\u201D]/g,'"');
s=s.replace(/,(\s*[}\]])/g,'$1');
s=s.replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)(\s*:)/g,'$1"$2"$3');
s=s.replace(/'([^'"\\]*)'/g,'"$1"');
return s;
}
function extractChatAction(reply){
const m=reply.match(/\[\[ACTION\]\]([\s\S]*?)\[\[\/ACTION\]\]/);
if(!m)return{text:reply,action:null,actionError:false};
const text=(reply.slice(0,m.index)+reply.slice(m.index+m[0].length)).trim();
let parsed=null,actionError=false;
let obj=null;
try{
obj=JSON.parse(m[1]);
}catch(e1){
try{ obj=JSON.parse(_repairLooseJson(m[1])); console.warn('Blok ACTION dari AI awalnya rusak tapi berhasil diperbaiki otomatis:',e1); }
catch(e2){ console.warn('Gagal parsing blok ACTION dari AI:',e2); actionError=true; }
}
if(obj){
if(typeof obj.type==='string'&&CHAT_ACTION_HANDLERS[obj.type]&&obj.data&&typeof obj.data==='object')parsed=obj;
else actionError=true;
}
return{text,action:parsed,actionError};
}
function chatActionInnerHTML(actionId,type,data){
return `<div class="u-fw700 u-mb4">${CHAT_ACTION_LABELS[type]||'Usul Aksi'}</div>
    <div class="u-fs13 u-t2 u-mb8">${escapeHtml(chatActionSummary(type,data))}</div>
    <div class="u-flex u-gap8 u-fwrap">
      <button class="btn btn-primary btn-sm" data-action="confirmChatAction" data-args="${escapeHtml(JSON.stringify([actionId]))}">✅ Konfirmasi</button>
      <button class="btn btn-ghost btn-sm" data-action="editChatAction" data-args="${escapeHtml(JSON.stringify([actionId]))}">✏️ Edit</button>
      <button class="btn btn-ghost btn-sm" data-action="cancelChatAction" data-args="${escapeHtml(JSON.stringify([actionId]))}">❌ Batal</button>
    </div>`;
}
