// app-bundle-b.min.js — DIBUAT OTOMATIS oleh build.js dari: data-default.js, features-helpers-global-security.js, diagnostik-versi.js, format-tema.js, error-handler.js, helper-teks.js, keamanan-pin.js, refleksi-selfcare.js, modal-navigasi.js, reset-gaji-mingguan.js, debug-console.js, pengaturan-search.js, onboarding.js, kalkulator-input.js, scan-ocr.js, filter-laporan.js, akun.js, gaji-calc.js, transaksi.js, profil-pengaturan.js, kategori.js, kategorisasi-ai.js, tagihan-kalender.js, backup-restore.js, payroll-absensi.js, features-tukang-kendaraan-storage.js, features-aiwidget-reminder-gdrive-search.js, features-sheets-pwa-selftest.js
// JANGAN diedit manual — edit file source-nya lalu jalankan: node build.js
// data-default.js — Domain Data Default: kategori cobek bawaan (DEFAULT_COBEK_KATEGORI),
// akun keuangan bawaan (DEFAULT_ACCOUNTS), kategori sparepart kendaraan bawaan (DEFAULT_SPAREPARTS).
// PENTING: file ini HARUS dimuat SEBELUM features-helpers-global-security.js (bukan sesudah,
// beda dari file GROUP_B lainnya) — ketiga konstanta di sini dibaca LANGSUNG di dalam deklarasi
// `let D = {...}` pada features-helpers-global-security.js SAAT file itu di-load (bukan di dalam
// function body yang baru jalan belakangan), jadi kalau file ini dimuat SESUDAHNYA, D.cobekKategori/
// D.accounts/D.sparepartCats akan error "not defined" saat app pertama kali dibuka.
// Ditunda sengaja sejak v78 (lihat PEMISAHAN-FILE-ROADMAP.md) karena butuh perubahan urutan load,
// baru dikerjakan di v79 ini.

const DEFAULT_COBEK_KATEGORI = [
{id:'ck_kecil',name:'Cobek Kecil'},
{id:'ck_sedang',name:'Cobek Sedang'},
{id:'ck_besar',name:'Cobek Besar'},
{id:'ck_munthu',name:'Munthu/Ulekan'},
{id:'ck_set',name:'Set Lengkap'},
];
const DEFAULT_ACCOUNTS = [
{id:'acc_cash',name:'Cash',emoji:'💵',balance:0},
{id:'acc_bri',name:'BRI',emoji:'🏦',balance:0},
{id:'acc_gopay',name:'Gopay',emoji:'📱',balance:0},
{id:'acc_seabank',name:'Seabank',emoji:'🏦',balance:0}
];
const DEFAULT_SPAREPARTS = [
{id:'sp_oli_mesin',name:'Oli Mesin',code:'OLI',intervalKm:2000},
{id:'sp_filter_oli',name:'Filter Oli',code:'FOL',intervalKm:8000},
{id:'sp_oli_gardan',name:'Oli Gardan/Transmisi',code:'OGD',intervalKm:8000},
{id:'sp_busi',name:'Busi',code:'BSI',intervalKm:8000},
{id:'sp_filter_udara',name:'Filter Udara',code:'FUD',intervalKm:10000},
{id:'sp_kampas_rem_depan',name:'Kampas Rem Depan',code:'KRD',intervalKm:10000},
{id:'sp_kampas_rem_belakang',name:'Kampas Rem Belakang',code:'KRB',intervalKm:10000},
{id:'sp_vbelt',name:'V-Belt (CVT)',code:'VBL',intervalKm:24000},
{id:'sp_roller_cvt',name:'Roller CVT',code:'RCV',intervalKm:24000},
{id:'sp_aki',name:'Aki (cek/ganti)',code:'AKI',intervalKm:18000}
];

// features-helpers-global-security.js — Helper global (migrasi data, state D, save/load, event dispatcher)
// CATATAN: 3 konstanta default (DEFAULT_COBEK_KATEGORI/DEFAULT_ACCOUNTS/DEFAULT_SPAREPARTS) dipindah ke
// data-default.js (v79) — file itu HARUS dimuat SEBELUM file ini karena dibaca langsung di `let D = {...}`.
// PENTING: file ini HARUS dimuat sesuai urutan build.js (GROUP_A/GROUP_B) karena beberapa modul saling referensi. Urutan grup ini: data-default.js, features-helpers-global-security.js, diagnostik-versi.js, format-tema.js, error-handler.js, helper-teks.js, keamanan-pin.js, modal-navigasi.js, reset-gaji-mingguan.js, debug-console.js, pengaturan-search.js, onboarding.js, kalkulator-input.js, scan-ocr.js, akun.js, gaji-calc.js, transaksi.js, profil-pengaturan.js, kategori.js, tagihan-kalender.js, backup-restore.js, payroll-absensi.js, features-tukang-kendaraan-storage.js, features-aiwidget-reminder-gdrive-search.js, features-sheets-pwa-selftest.js

const SCHEMA_VERSION = 1;
const DATA_MIGRATIONS=[
];
function runDataMigrations(fromVersion){
let v=Number.isFinite(fromVersion)?fromVersion:0;
const pending=DATA_MIGRATIONS.filter(m=>m.toVersion>v).sort((a,b)=>a.toVersion-b.toVersion);
pending.forEach(m=>{
try{ m.migrate(D); v=m.toVersion; }
catch(e){ console.error(`Migrasi data ke versi ${m.toVersion} ("${m.desc}") gagal:`,e); }
});
D.schemaVersion=SCHEMA_VERSION;
}
// isDevMode() — satu sumber kebenaran untuk deteksi mode developer, dipakai di seluruh app
// (Diagnostik di Pengaturan, smoke-test.js, dll). Aktif kalau: ?dev=1 di URL, localStorage
// kw_dev='1', dibuka lewat file:// langsung, atau di localhost/127.0.0.1 (server dev lokal).
// Sengaja DISAMAKAN dengan logika isDevMode() di smoke-test.js supaya konsisten satu app.
function isDevMode(){
try{
if(new URLSearchParams(location.search).get('dev')==='1')return true;
if(localStorage.getItem('kw_dev')==='1')return true;
if(location.protocol==='file:')return true;
if(location.hostname==='localhost'||location.hostname==='127.0.0.1')return true;
}catch(e){ /* anggap bukan dev mode kalau gagal deteksi */ }
return false;
}
const APP_BUILD_VERSION = 'kw80-merge-advisor-card-dashcards-5';
const PRODUCTION_BUILD_SYNCED_VERSION = 'kw80-merge-advisor-card-dashcards-5';
let D = {
schemaVersion:SCHEMA_VERSION,
transactions:[],cobek:[],products:[],produsen:[],cobekKategori:JSON.parse(JSON.stringify(DEFAULT_COBEK_KATEGORI)),targets:[],eduFunds:[],reminders:[],bills:[],billsArchive:[],
catatan:{anak:[]},
milestones:[false,false,false,false,false],
nextPulang:'',lastBackup:null,lastResetPromptDate:null,
profile:{nama:'W',gajiPokok:65000,kiriman:500000,theme:'dark',lemburMultiplier:1.5,tarifMinggu:139000,tanggalLahir:null,statusKawin:false,tanggungan:0,statusPekerjaan:null,targetGajiBulanan:null},
categories:{income:JSON.parse(JSON.stringify(DEFAULT_CATS.income)),expense:JSON.parse(JSON.stringify(DEFAULT_CATS.expense))},
accounts:JSON.parse(JSON.stringify(DEFAULT_ACCOUNTS)),
vehicles:[{id:'veh_1',name:'Vario 125',emoji:'🏍️',serviceIntervalKm:3000}],
simList:[],
bbmLogs:[],servisLogs:[],jalanLogs:[],kmLogs:[],workDays:[],
tukangBorHargaMemory:{},
tukangWorkers:[],
tukangAbsensi:[],
sparepartCats:JSON.parse(JSON.stringify(DEFAULT_SPAREPARTS)),
partsStock:[],
torsiChecklist:{},
chatHistory:[],
aiWidgetReport:null,
budgets:[],
notifSettings:{enabled:false,billDays:3,ldrDays:3},
dashCardPrefs:{},
googleDrive:{clientId:'',fileId:null,lastSync:null,autoSync:false},
googleSheets:{spreadsheetId:'',lastSync:null},
archiveHistory:[],
assets:[],
piutang:[],
debts:[],
renovProjects:[],
wishlist:[],
assetAllocation:{risk:null,dana:null},
debtStrategy:{method:'avalanche',extra:0},
budgetReko:{months:3,buffer:10},
finansialFreedom:{expenseCatIds:[],avgMonths:6,swr:4,assumsiReturn:8,assumsiInflasi:5,assetScope:'zakatable',scenarioRange:2},
pensiun:{aktif:false,usiaSekarang:null,usiaPensiun:58,targetDana:0,returnTahunan:6,accId:'',kontribusiBulanan:0,rekoPersen:20,rekoBulan:3,riwayatKontribusi:[]},
sewaKios:{units:[]},
wealthSnapshots:[],
lifeBalanceSnapshots:[],
refleksi:{gratitude:[],selfCareLog:{},privateNotes:[]},
pajakZakat:{
hargaEmasPerGram:2640000,
nisabPenghasilanBulan:7640144,
nisabPenghasilanTahun:91681728,
zakatFitrahPerJiwa:37500,
haulMaalMulai:null,
asetLain:0, utangJT:0,
pphBrutoBulan:0, pphIuranBulan:0,
pbb:{njoptkp:10000000,tarifPersen:0.5},
zakatLog:[],
refCheckedAt:null,
refSources:{}
}
};
let curVehicleId='veh_1', curCnTab='bbm', cnPeriode='selamanya';
let curPayMethod='tunai';
let curMonth=new Date().getMonth(), curYear=new Date().getFullYear();
let curTxType='income', curCatatan='anak', filterPeriode='bulan';
let cicilanLastInput='total';
let cicilanSharedLastInput='pct';
let cicilanDateLinked=false;
let curCatFilter='semua', curImportType='cashew';
let pinBuffer='', catEditIdx=null, curCatModalType='income';
let curBillType='tagihan', billEditId=null;
let subCatParentId=null, subCatParentType=null, subCatEditId=null;
let txEditId=null, catModalCallback=null, txEditLinkedBillId=null;
let _txSaving=false;
let _txAccManuallySet=false;
let _txCatLearnSource=null;
let _saveGuards={};
function withSaveGuard(key,modalId,fn){
if(_saveGuards[key])return;
const modalEl=modalId?document.getElementById(modalId):null;
if(modalEl && !modalEl.classList.contains('open'))return;
_saveGuards[key]=true;
try{
return fn();
} finally {
_saveGuards[key]=false;
}
}
async function withSaveGuardAsync(key,modalId,fn){
if(_saveGuards[key])return;
const modalEl=modalId?document.getElementById(modalId):null;
if(modalEl && !modalEl.classList.contains('open'))return;
_saveGuards[key]=true;
try{
return await fn();
} finally {
_saveGuards[key]=false;
}
}
let _saveErrorShown=false;
function safeSetItem(key,value){
try{
localStorage.setItem(key,value);
return true;
}catch(e){
console.error('Gagal menyimpan ('+key+'):',e);
const isQuota=e && (e.name==='QuotaExceededError'||e.code===22||e.code===1014);
const msg=isQuota?'⚠️ Penyimpanan HP penuh, gagal menyimpan perubahan ini.':'⚠️ Gagal menyimpan: '+(e&&e.message?e.message:'error tidak diketahui');
if(typeof toast==='function')toast(msg,4000); else showAlertModal(msg);
return false;
}
}
let _bigDataWarnShown=false;
let _saveDebounceTimer=null;
// MIGRASI STORAGE (LEVEL 3): IndexedDB sekarang jadi penyimpanan UTAMA untuk data besar (kw_v4_mirror).
// localStorage['kw_v4'] TIDAK lagi ditulis di tiap save() biasa (dulu ditulis dobel setiap ada
// perubahan data, padahal localStorage kapasitasnya kecil & write-nya blocking). localStorage
// sekarang hanya dipakai untuk: (a) setting/PIN/preferensi kecil yang memang cocok di sana,
// (b) snapshot cadangan sinkron di titik-titik KRITIS lewat _writeLocalSnapshot() -- lihat saveFlush().
// Kenapa masih perlu localStorage sinkron di titik kritis (bukan dihapus total): tulis ke IndexedDB
// itu ASYNC. Kalau tab HP ditutup/di-background (visibilitychange/pagehide) sebelum transaksi
// IndexedDB commit, datanya bisa hilang -- terutama di Safari iOS yang agresif suspend tab.
// localStorage.setItem() sinkron, jadi tetap jadi jaring pengaman di momen itu saja (lihat
// tryBackupOnClose() yang manggil saveFlush()), bukan di setiap keystroke.
function _buildSaveJson(){
D.schemaVersion=SCHEMA_VERSION;
let json;
if(D.profile && Object.prototype.hasOwnProperty.call(D.profile,'apiKey')){
const profileNoKey={...D.profile}; delete profileNoKey.apiKey;
json=JSON.stringify({...D,profile:profileNoKey});
} else {
json=JSON.stringify(D);
}
if(!_bigDataWarnShown && json.length>3.5*1024*1024){
_bigDataWarnShown=true;
if(typeof toast==='function')toast('⚠️ Data sudah cukup besar ('+(D.transactions?D.transactions.length:'?')+' transaksi). Disimpan di penyimpanan IndexedDB (kapasitas jauh lebih besar dari localStorage), tapi tetap disarankan backup manual sesekali lewat Pengaturan → Backup.',6000);
}
return json;
}
// Nulis snapshot ke localStorage['kw_v4'] secara SINKRON. Cuma dipanggil dari saveFlush()
// (titik kritis) atau sebagai fallback kalau IndexedDB gagal/tidak didukung browser.
function _writeLocalSnapshot(json){
try{
localStorage.setItem('kw_v4',json);
_saveErrorShown=false;
return true;
}catch(e){
console.error('Gagal menyimpan data (localStorage):',e);
if(!_saveErrorShown){
_saveErrorShown=true;
const isQuota=e && (e.name==='QuotaExceededError'||e.code===22||e.code===1014);
const msg=isQuota
? '⚠️ Penyimpanan localStorage HP ini penuh, tapi data TETAP tersimpan aman di penyimpanan cadangan (IndexedDB) yang kapasitasnya jauh lebih besar — tidak ada data yang hilang. Backup manual lewat Pengaturan tetap disarankan.'
: '⚠️ Gagal menyimpan data: '+(e&&e.message?e.message:'error tidak diketahui');
if(typeof toast==='function') toast(msg,4000);
else showAlertModal(msg);
}
return false;
}
}
function _saveImmediate(){
try{
const json=_buildSaveJson();
IDBStore.set('kw_v4_mirror',json).catch(e=>{
console.error('Gagal menyimpan ke IndexedDB, fallback ke localStorage:',e);
_writeLocalSnapshot(json);
});
}catch(e){
console.error('Gagal menyimpan data:',e);
}
}
function save(){
if(_saveDebounceTimer)clearTimeout(_saveDebounceTimer);
_saveDebounceTimer=setTimeout(()=>{_saveDebounceTimer=null;_saveImmediate();},400);
}
// saveFlush(): dipakai di titik KRITIS (tutup/background app, sebelum import/reset, sebelum
// upload backup Drive). Beda dari save() biasa: di sini localStorage['kw_v4'] TETAP ditulis
// sinkron sebagai jaring pengaman, karena IndexedDB async-nya belum tentu sempat commit kalau
// tab langsung ditutup/di-suspend setelah ini.
function saveFlush(){
if(_saveDebounceTimer){clearTimeout(_saveDebounceTimer);_saveDebounceTimer=null;}
_saveImmediate();
_writeLocalSnapshot(_buildSaveJson());
}
let _lastUid=0;
function uid(){let n=Date.now();if(n<=_lastUid)n=_lastUid+1;_lastUid=n;return n;}
function sameId(a,b){return String(a)===String(b);}
document.addEventListener('click', function(e){
const el = e.target.closest('[data-action],[data-onclick]');
if(!el) return;
if(el.dataset.stop) e.stopPropagation();
if(el.dataset.action){
const path = el.dataset.action.split('.');
let owner = window, fn = window;
for(const p of path){ owner = fn; fn = fn ? fn[p] : undefined; }
if(typeof fn !== 'function'){
console.error('data-action tidak ditemukan/bukan fungsi:', el.dataset.action);
if(typeof toast==='function') toast('⚠️ Tombol ini belum berfungsi ('+el.dataset.action+'). Tolong laporkan ke pengembang.',5000);
return;
}
let args = [];
if(el.dataset.args){
try{ args = JSON.parse(el.dataset.args); }
catch(err){ console.error('data-args JSON tidak valid:', el.dataset.args, err); return; }
}
args = args.map(a=>{
if(a==='$el')return el;
if(a==='$event')return e;
if(typeof a==='string' && a.indexOf('$nav:')===0){
const navItems=document.querySelectorAll('.nav-item');
return navItems[Number(a.slice(5))]||null;
}
return a;
});
fn.apply(owner, args);
return;
}
const code = el.getAttribute('data-onclick');
if(!code) return;
try{
new Function('event', code).call(el, e);
}catch(err){
console.error('data-onclick error:', code, err);
if(typeof toast==='function') toast('⚠️ Terjadi error saat menjalankan aksi ini. Tolong laporkan ke pengembang.',5000);
}
});
function migrateCobekCategory(){
let incCat=D.categories.income.find(c=>c.id==='cat_cb'||/^bisnis cobek$/i.test(c.name)||/^bisnis$/i.test(c.name));
if(incCat){
const oldName=incCat.name;
incCat.name='Bisnis';
if(!incCat.subs)incCat.subs=[];
if(!incCat.subs.find(s=>/^cobek$/i.test(s.name))) incCat.subs.push({id:'sub_cb_cobek',name:'Cobek'});
if(/^bisnis cobek$/i.test(oldName)){
D.transactions.forEach(t=>{
if(t.type==='income'&&t.category===oldName){t.category='Bisnis';if(!t.subcategory)t.subcategory='Cobek';}
});
}
}
let expCat=D.categories.expense.find(c=>c.id==='cat_cbb'||/^belanja stok cobek$/i.test(c.name)||/^bisnis$/i.test(c.name));
if(expCat){
const oldName=expCat.name;
expCat.name='Bisnis';
if(!expCat.subs)expCat.subs=[];
if(!expCat.subs.find(s=>/^cobek$/i.test(s.name))) expCat.subs.push({id:'sub_cbb_cobek',name:'Cobek'});
if(/^belanja stok cobek$/i.test(oldName)){
D.transactions.forEach(t=>{
if(t.type==='expense'&&t.category===oldName){t.category='Bisnis';if(!t.subcategory)t.subcategory='Cobek';}
});
}
}
}
async function load(){
try{
let s=null, fromIdb=false;
try{
const idbVal=await IDBStore.get('kw_v4_mirror');
if(idbVal){ s=idbVal; fromIdb=true; }
}catch(e){ console.error('Gagal baca IndexedDB, fallback ke localStorage:',e); }
if(!s) s=localStorage.getItem('kw_v4');
if(s){
let p;
try{
p=JSON.parse(s);
}catch(parseErr){
console.error('Data tersimpan corrupt:',parseErr);
showAlertModal('Data tersimpan di HP ini rusak/tidak terbaca (corrupt). Aplikasi akan dibuka dengan data kosong agar tidak error.\n\nKalau punya file backup (.json) dari menu Pengaturan → Backup, silakan import ulang lewat menu tersebut setelah aplikasi terbuka.',{icon:'⚠️',title:'Data Tersimpan Rusak'});
return;
}
D={...D,...p};
if(!fromIdb) IDBStore.set('kw_v4_mirror',s).catch(e=>console.error('Gagal migrasi awal ke IndexedDB:',e));
const _fromSchemaVersion=D.schemaVersion===undefined?0:D.schemaVersion;
runDataMigrations(_fromSchemaVersion);
if(!D.categories) D.categories={income:JSON.parse(JSON.stringify(DEFAULT_CATS.income)),expense:JSON.parse(JSON.stringify(DEFAULT_CATS.expense))};
if(!D.accounts || !D.accounts.length) D.accounts=JSON.parse(JSON.stringify(DEFAULT_ACCOUNTS));
if(!D.pajakZakat) D.pajakZakat={hargaEmasPerGram:2640000,nisabPenghasilanBulan:7640144,nisabPenghasilanTahun:91681728,zakatFitrahPerJiwa:37500,haulMaalMulai:null,zakatLog:[]};
if(!D.pajakZakat.zakatLog) D.pajakZakat.zakatLog=[];
if(!D.pajakZakat.pbb) D.pajakZakat.pbb={njoptkp:10000000,tarifPersen:0.5};
if(D.pajakZakat.pbb.njoptkp===undefined) D.pajakZakat.pbb.njoptkp=10000000;
if(D.pajakZakat.pbb.tarifPersen===undefined) D.pajakZakat.pbb.tarifPersen=0.5;
if(D.pajakZakat.pphBrutoBulan===undefined) D.pajakZakat.pphBrutoBulan=0;
if(D.pajakZakat.pphIuranBulan===undefined) D.pajakZakat.pphIuranBulan=0;
if(D.pajakZakat.refCheckedAt===undefined) D.pajakZakat.refCheckedAt=null;
if(!D.pajakZakat.refSources) D.pajakZakat.refSources={};
if(!D.assets) D.assets=[];
if(!D.piutang) D.piutang=[];
if(!D.debts) D.debts=[];
D.debts.forEach(d=>{try{if(typeof Debt!=='undefined')Debt.syncBill(d);}catch(e){}});
if(!D.renovProjects) D.renovProjects=[];
if(!D.sewaKios) D.sewaKios={units:[]};
if(!D.sewaKios.units) D.sewaKios.units=[];
D.sewaKios.units.forEach(u=>{if(!u.riwayat)u.riwayat=[];if(!u.statusLog||!u.statusLog.length)u.statusLog=[{status:u.status,tanggal:u.mulai||todayStr()}];});
if(!D.wishlist) D.wishlist=[];
if(!D.finansialFreedom) D.finansialFreedom={expenseCatIds:[],avgMonths:6,swr:4,assumsiReturn:8,assumsiInflasi:5};
if(D.finansialFreedom.expenseCatIds===undefined) D.finansialFreedom.expenseCatIds=[];
if(D.finansialFreedom.avgMonths===undefined) D.finansialFreedom.avgMonths=6;
if(D.finansialFreedom.swr===undefined) D.finansialFreedom.swr=4;
if(D.finansialFreedom.assumsiReturn===undefined) D.finansialFreedom.assumsiReturn=8;
if(D.finansialFreedom.assumsiInflasi===undefined) D.finansialFreedom.assumsiInflasi=5;
if(!D.finansialFreedom.assetScope) D.finansialFreedom.assetScope='zakatable';
if(!isFinite(Number(D.finansialFreedom.scenarioRange))||Number(D.finansialFreedom.scenarioRange)<0.5||Number(D.finansialFreedom.scenarioRange)>15) D.finansialFreedom.scenarioRange=2;
if(!D.wealthSnapshots) D.wealthSnapshots=[];
if(!D.refleksi) D.refleksi={gratitude:[],selfCareLog:{},privateNotes:[]};
if(!D.refleksi.gratitude) D.refleksi.gratitude=[];
if(!D.refleksi.selfCareLog) D.refleksi.selfCareLog={};
if(!D.refleksi.privateNotes) D.refleksi.privateNotes=[];
if(!D.pensiun) D.pensiun={aktif:false,usiaSekarang:null,usiaPensiun:58,targetDana:0,returnTahunan:6,accId:'',kontribusiBulanan:0,rekoPersen:20,rekoBulan:3,riwayatKontribusi:[]};
if(D.pensiun.usiaSekarang===undefined) D.pensiun.usiaSekarang=null;
if(D.pensiun.usiaPensiun===undefined) D.pensiun.usiaPensiun=58;
if(D.pensiun.targetDana===undefined) D.pensiun.targetDana=0;
if(D.pensiun.returnTahunan===undefined) D.pensiun.returnTahunan=6;
if(D.pensiun.accId===undefined) D.pensiun.accId='';
if(D.pensiun.kontribusiBulanan===undefined) D.pensiun.kontribusiBulanan=0;
if(D.pensiun.rekoPersen===undefined) D.pensiun.rekoPersen=20;
if(D.pensiun.rekoBulan===undefined) D.pensiun.rekoBulan=3;
if(!D.pensiun.riwayatKontribusi) D.pensiun.riwayatKontribusi=[];
if(D.profile&&D.profile.tanggalLahir===undefined) D.profile.tanggalLahir=null;
if(D.profile&&D.profile.statusKawin===undefined) D.profile.statusKawin=false;
if(D.profile&&D.profile.tanggungan===undefined) D.profile.tanggungan=0;
if(D.profile&&D.profile.statusPekerjaan===undefined) D.profile.statusPekerjaan=null;
if(!D.bills) D.bills=[];
if(!D.billsArchive) D.billsArchive=[];
if(!D.vehicles||!D.vehicles.length) D.vehicles=[{id:'veh_1',name:'Vario 125',emoji:'🏍️',serviceIntervalKm:3000}];
D.vehicles.forEach(v=>{if(!v.serviceIntervalKm)v.serviceIntervalKm=3000;});
if(!D.simList) D.simList=[];
if(!D.bbmLogs) D.bbmLogs=[];
if(!D.servisLogs) D.servisLogs=[];
if(!D.jalanLogs) D.jalanLogs=[];
if(!D.kmLogs) D.kmLogs=[];
if(!D.sparepartCats||!D.sparepartCats.length) D.sparepartCats=JSON.parse(JSON.stringify(DEFAULT_SPAREPARTS));
D.sparepartCats.forEach(c=>{if(!c.code)c.code=codeFromName(c.name);});
if(!D.partsStock) D.partsStock=[];
if(!D.workDays) D.workDays=[];
if(!D.tukangWorkers) D.tukangWorkers=[];
if(!D.tukangAbsensi) D.tukangAbsensi=[];
if(!D.aiWidgetReport) D.aiWidgetReport=null;
if(D.lastResetPromptDate===undefined) D.lastResetPromptDate=null;
if(!D.products) D.products=[];
if(!D.produsen) D.produsen=[];
if(!D.cobekKategori||!D.cobekKategori.length) D.cobekKategori=JSON.parse(JSON.stringify(DEFAULT_COBEK_KATEGORI));
D.products.forEach(p=>{if(!p.hargaByProdusen)p.hargaByProdusen={};if(p.kategoriId===undefined)p.kategoriId='';if(p.produsenId===undefined)p.produsenId='';});
if(!D.categories.expense.some(c=>c.id==='cat_cbb'||/^bisnis$/i.test(c.name))){
D.categories.expense.push({id:'cat_cbb',name:'Bisnis',emoji:'🪨',subs:[{id:'sub_cbb_cobek',name:'Cobek'}]});
}
migrateCobekCategory();
if(!D.cobek) D.cobek=[];
if(!D.targets) D.targets=[];
if(!D.eduFunds) D.eduFunds=[];
if(D.profile&&D.profile.lemburMultiplier==null) D.profile.lemburMultiplier=1.5;
if(D.profile&&D.profile.tarifMinggu==null) D.profile.tarifMinggu=139000;
if(!D.reminders) D.reminders=[];
if(!D.chatHistory) D.chatHistory=[];
if(!D.budgets) D.budgets=[];
D.budgets.forEach(b=>{if(!b.catIds){b.catIds=b.catId?[b.catId]:['__total__'];}});
D.budgets.forEach(b=>{if(!b.period)b.period='bulanan';});
if(D.ldrCycleStart===undefined) D.ldrCycleStart=null;
if(!D.notifSettings) D.notifSettings={enabled:false,billDays:3,ldrDays:3};
if(!D.googleDrive) D.googleDrive={clientId:'',fileId:null,lastSync:null,autoSync:false};
if(!D.archiveHistory) D.archiveHistory=[];
if(!D.lifeBalanceSnapshots) D.lifeBalanceSnapshots=[];
D.cobek.forEach(c=>{if(c.delivered===undefined)c.delivered=true;});
['income','expense'].forEach(t=>{D.categories[t].forEach(c=>{if(!c.subs)c.subs=[];});});
['income','expense'].forEach(type=>{
const seen={};
D.categories[type].forEach(c=>{
const key=c.name.trim().toLowerCase();
if(seen[key]){
(c.subs||[]).forEach(s=>{
if(!seen[key].subs.find(x=>x.name.trim().toLowerCase()===s.name.trim().toLowerCase())){
seen[key].subs.push(s);
}
});
} else {
seen[key]=c;
}
});
D.categories[type]=Object.values(seen);
});
if(D.categories.expense.some(c=>c.id==='cat_kn')){
D.categories.expense=D.categories.expense.filter(c=>c.id!=='cat_kn');
}
(function(){
const vehNames=(D.vehicles||[]).map(v=>v.name.trim().toLowerCase());
D.categories.expense.forEach(c=>{
const nameLc=c.name.trim().toLowerCase();
if(vehNames.includes(nameLc)||/^transport$/i.test(c.name)){
if(!c.subs)c.subs=[];
['Bensin','Servis & Oli','Pajak'].forEach(subName=>{
if(!c.subs.find(s=>s.name.trim().toLowerCase()===subName.toLowerCase())){
c.subs.push({id:'sub_'+subName.toLowerCase().replace(/[^a-z0-9]+/g,'_')+'_'+uid(),name:subName});
}
});
}
});
})();
}
}catch(e){
console.error('Gagal load data:',e);
showAlertModal('Terjadi error saat membuka data tersimpan: '+(e&&e.message?e.message:'unknown'),{icon:'⚠️',title:'Gagal Membuka Data'});
}
}
function todayStr(){const n=new Date();return n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0')+'-'+String(n.getDate()).padStart(2,'0');}
function showMain(){
document.getElementById('onboard').style.display='none';
document.getElementById('pinScreen').style.display='none';
document.getElementById('pinScreen').classList.add('u-dnone');
const mh=document.getElementById('mainHeader');mh.classList.remove('u-dnone');mh.style.display='flex';
const ma=document.getElementById('mainApp');ma.classList.remove('u-dnone');ma.style.display='block';
const mn=document.getElementById('mainNav');mn.classList.remove('u-dnone');mn.style.display='flex';
document.getElementById('hNama').textContent=D.profile.nama||'W';
applyEffectiveTheme();
applyCardCollapsePrefs();
autoSnapshotWealthIfNeeded();
autoSnapshotLifeBalanceIfNeeded();
renderDashboard(); checkBackup(); checkBills(); populateCatFilter(); populateAccFilters();
renderSiapPulang();
checkAndFireReminders();
setTimeout(checkWeeklySalaryReset,600);
refreshCurrentPage();
setTimeout(autoRunSelfTestIfNeeded,800);
setTimeout(gdriveTrySilentReconnectOnLoad,900);
}
async function clearChat(){
if(!await askConfirm('Reset semua riwayat chat AI?'))return;
D.chatHistory=[];save();
chatInited=false;
document.getElementById('chatBox').innerHTML='';
initChat();
toast('🗑 Chat direset');
}

// diagnostik-versi.js — Domain Diagnostik & Sinkronisasi Versi: snapshot HTML utk self-test
// (getHtmlSnapshotForSelfTest), cek status sinkron versi produksi vs master
// (computeProductionSyncStatus), cek status sinkron versi antar file modul
// (computeModuleSyncStatus + IIFE `_checkModuleVersionSync` yang jalan otomatis saat file
// dimuat & kasih toast peringatan kalau ada modul ketinggalan versi), dan cek ukuran file HTML
// terhadap ambang batas mulai-pecah-file (computeFileSizeStatus + FILE_SIZE_WARN_BYTES/
// FILE_SIZE_ACTION_BYTES).
// Dipindah dari features-helpers-global-security.js (v75) — potongan KEDELAPAN stlh
// kalkulator-input.js (v69), keamanan-pin.js (v70), modal-navigasi.js (v71),
// reset-gaji-mingguan.js (v72), debug-console.js/pengaturan-search.js (v73), onboarding.js (v74).
// CATATAN: `APP_BUILD_VERSION` & `PRODUCTION_BUILD_SYNCED_VERSION` SENGAJA TETAP di
// features-helpers-global-security.js (TIDAK ikut dipindah) krn build.js membaca
// `APP_BUILD_VERSION` langsung dari file itu lewat regex (`detectCurrentVersion()`) — memindahkannya
// akan merusak build.js. Fungsi-fungsi di file ini cukup mengaksesnya sbg variabel global saat
// runtime (pola yang sama seperti akses MODULE_CALC_VERSION/MODAL_VERSION/dst dari file lain).
// PENTING soal urutan: IIFE `_checkModuleVersionSync` di bawah jalan OTOMATIS begitu file ini
// dimuat (bukan cuma deklarasi function) & butuh APP_BUILD_VERSION, MODULE_CALC_VERSION (GROUP_A:
// modules-calc.js), MODULE_FEATURES_VERSION (GROUP_A: features-budget-laporan-carnotes-pelanggan.js),
// MODAL_VERSION (GROUP_A: modals.js), MODULE_RENDER_VERSION (GROUP_A: modules-render.js) — semua
// SUDAH tersedia karena app-bundle-a.min.js (GROUP_A) dimuat lebih dulu di index.html/
// app_production.html sebelum app-bundle-b.min.js (GROUP_B). File ini juga HARUS dimuat SETELAH
// features-helpers-global-security.js (butuh APP_BUILD_VERSION/PRODUCTION_BUILD_SYNCED_VERSION/toast()).
// Dipanggil dari: modules-render.js (computeProductionSyncStatus/computeFileSizeStatus, saat render
// halaman Tentang/Pengaturan), features-sheets-pwa-selftest.js (getHtmlSnapshotForSelfTest/
// computeProductionSyncStatus/computeFileSizeStatus/computeModuleSyncStatus, dipakai smoke-test).
function getHtmlSnapshotForSelfTest(){ return document.documentElement.outerHTML; }
function computeProductionSyncStatus(){
const inSync = PRODUCTION_BUILD_SYNCED_VERSION===APP_BUILD_VERSION;
return {
masterVersion:APP_BUILD_VERSION,
syncedVersion:PRODUCTION_BUILD_SYNCED_VERSION,
inSync,
label: inSync
? '✅ Sinkron (v'+PRODUCTION_BUILD_SYNCED_VERSION+')'
: '⚠️ Ketinggalan -- terakhir sinkron di '+PRODUCTION_BUILD_SYNCED_VERSION+', master sudah '+APP_BUILD_VERSION+'. Kalau distribusi ke user pakai file produksi, regenerate dulu.',
};
}
function computeModuleSyncStatus(){
const calcV=(typeof MODULE_CALC_VERSION!=='undefined')?MODULE_CALC_VERSION:null;
const featV=(typeof MODULE_FEATURES_VERSION!=='undefined')?MODULE_FEATURES_VERSION:null;
const modalV=(typeof MODAL_VERSION!=='undefined')?MODAL_VERSION:null;
const renderV=(typeof MODULE_RENDER_VERSION!=='undefined')?MODULE_RENDER_VERSION:null;
const calcOk=calcV===APP_BUILD_VERSION;
const featOk=featV===APP_BUILD_VERSION;
const modalOk=modalV===APP_BUILD_VERSION;
const renderOk=renderV===APP_BUILD_VERSION;
return {
calcVersion:calcV, featVersion:featV, modalVersion:modalV, renderVersion:renderV, masterVersion:APP_BUILD_VERSION,
calcOk, featOk, modalOk, renderOk, allOk: calcOk&&featOk&&modalOk&&renderOk,
};
}
(function _checkModuleVersionSync(){
try{
const s=computeModuleSyncStatus();
if(!s.allOk){
const detail=[];
if(!s.calcOk) detail.push('modules-calc.js (v'+(s.calcVersion||'tidak terbaca')+')');
if(!s.featOk) detail.push('file features-*.js (GROUP_A/B, v'+(s.featVersion||'tidak terbaca')+')');
if(!s.modalOk) detail.push('modals.js (v'+(s.modalVersion||'tidak terbaca')+')');
if(!s.renderOk) detail.push('modules-render.js (v'+(s.renderVersion||'tidak terbaca')+')');
console.warn('⚠️ Versi modul tidak sinkron dengan app_production.html (v'+s.masterVersion+'):',detail.join(', '));
if(typeof toast==='function'){
toast('⚠️ Versi file modul beda dari app_production.html: '+detail.join(', ')+'. Pastikan semua file di-upload dari build yang sama.',6000);
}
}
}catch(e){ console.error('Gagal cek sinkronisasi versi modul:',e); }
})();
const FILE_SIZE_WARN_BYTES = 2.0*1024*1024;
const FILE_SIZE_ACTION_BYTES = 2.5*1024*1024;
function computeFileSizeStatus(){
const size = document.documentElement.outerHTML.length;
let level='aman', label='✅ Aman', color='var(--accent3)';
if(size>=FILE_SIZE_ACTION_BYTES){ level='action'; label='🔴 Sudah lewat ambang — mulai pecah file'; color='var(--accent2)'; }
else if(size>=FILE_SIZE_WARN_BYTES){ level='warn'; label='⚠️ Mendekati ambang — mulai rencanakan pemisahan'; color='#e0a030'; }
return {size,level,label,color,warnAt:FILE_SIZE_WARN_BYTES,actionAt:FILE_SIZE_ACTION_BYTES};
}

// format-tema.js — Domain Format Angka & Tema: format rupiah singkat (fmt, mis. "Rp 1.5 jt"),
// format rupiah penuh (fmtFull/fmtFullSigned), notifikasi toast di bawah layar (toast), dan
// ganti/terapkan tema warna app termasuk mode "auto" ikut jam HP (setTheme/applyEffectiveTheme).
// Dipindah dari features-helpers-global-security.js (v76) — potongan KESEMBILAN stlh
// kalkulator-input.js (v69), keamanan-pin.js (v70), modal-navigasi.js (v71),
// reset-gaji-mingguan.js (v72), debug-console.js/pengaturan-search.js (v73), onboarding.js (v74),
// diagnostik-versi.js (v75). Domain ini DIPILIH TERAKHIR (bukan paling awal seperti biasanya)
// justru krn PALING BANYAK dipakai di seluruh app (`toast()` saja dipanggil 900+ kali dari
// puluhan file lain) — supaya polanya sudah teruji dulu di domain2 kecil sebelum pindahkan
// utilitas inti sepenting ini.
// TIDAK ADA isi yang diubah, cuma dipindah file. Semua pemanggil di file lain mengakses fungsi2
// ini sbg variabel global saat runtime (tombol diklik/render halaman), BUKAN saat file di-load —
// jadi aman terlepas dari urutan pasti file ini di dalam GROUP_B, asalkan tetap di GROUP_B (satu
// bundle yang sama dgn D/save() yg dipakai setTheme, & dimuat sebelum app dipakai user).
// PENTING: file ini HARUS dimuat SETELAH features-helpers-global-security.js (butuh `D`/`save()`).
function fmt(n){n=Math.abs(n||0);if(n>=1000000)return'Rp '+(n/1000000).toFixed(1)+' jt';if(n>=1000)return'Rp '+(n/1000).toFixed(0)+'rb';return'Rp '+n;}
function fmtFull(n){return'Rp '+Number(Math.abs(n||0)).toLocaleString('id-ID');}
function fmtFullSigned(n){n=Number(n||0);return(n<0?'-':'')+'Rp '+Math.abs(n).toLocaleString('id-ID');}
function toast(msg,dur=2200){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),dur);}
function setTheme(t){
D.profile.theme=t; save();
applyEffectiveTheme();
document.querySelectorAll('.theme-card').forEach(c=>c.classList.toggle('active',c.dataset.t===t));
toast(t==='auto'?'Tema otomatis aktif 🌗 (ikut jam HP)':'Tema '+t+' aktif ✨');
}
function applyEffectiveTheme(){
let t=D.profile.theme||'dark';
if(t==='auto'){
const h=new Date().getHours();
t=(h>=6&&h<18)?'light':'dark';
}
document.body.setAttribute('data-theme',t);
}

// error-handler.js — Domain Error Handler Global: tangkap error tak tertangani (uncaught error &
// unhandled promise rejection) di seluruh app, catat ke console utk debugging, dan tampilkan toast
// singkat yang ramah ke pengguna (dibatasi maksimal 1x per 3 detik biar tidak spam kalau error
// beruntun) lewat `_friendlyErrorNotice`.
// Dipindah dari features-helpers-global-security.js (v77) — potongan KESEPULUH stlh
// kalkulator-input.js (v69), keamanan-pin.js (v70), modal-navigasi.js (v71),
// reset-gaji-mingguan.js (v72), debug-console.js/pengaturan-search.js (v73), onboarding.js (v74),
// diagnostik-versi.js (v75), format-tema.js (v76). Domain PALING mandiri sejauh ini: `_lastErrorToastAt`
// & `_friendlyErrorNotice` TIDAK dipakai/direferensi sama sekali dari file lain (dicek `grep -rn`,
// 0 hasil di luar file ini) — cuma dipanggil dari 2 listener `window.addEventListener` di bawah,
// yang juga ikut pindah.
// Satu2nya dependensi luar: `toast()` (format-tema.js), diakses lewat `typeof toast==='function'`
// (fallback ke console.warn kalau belum siap) — pola yang sama seperti sebelum dipindah.
// PENTING: file ini HARUS dimuat SETELAH format-tema.js (biar toast() sudah ada saat error
// pertama mungkin terjadi), walau tetap aman kalau belum krn ada typeof-check.
let _lastErrorToastAt=0;
function _friendlyErrorNotice(msg){
const now=Date.now();
if(now-_lastErrorToastAt<3000)return;
_lastErrorToastAt=now;
try{
const detail=msg?(': '+String(msg).slice(0,120)):'';
if(typeof toast==='function'){
toast('⚠️ Ada error kecil, coba ulangi aksi terakhir'+detail,5000);
}else{
console.warn('App error (toast belum siap):',msg);
}
}catch(_e){ }
}
window.addEventListener('error',function(e){
console.error('Uncaught error:',e.error||e.message,e.filename,e.lineno);
_friendlyErrorNotice(e.message);
});
window.addEventListener('unhandledrejection',function(e){
console.error('Unhandled promise rejection:',e.reason);
_friendlyErrorNotice(e.reason);
});

// helper-teks.js — Domain Helper Teks & Kalender: escape karakter HTML berbahaya biar aman
// dimasukkan ke innerHTML (escapeHtml), daftar nama bulan singkat & lengkap dalam Bahasa Indonesia
// (MONTHS/MONTHS_FULL) utk format tanggal.
// Dipindah dari features-helpers-global-security.js (v78) — potongan KESEBELAS dari pembedahan
// yang sama (lanjutan kalkulator-input.js v69, keamanan-pin.js v70, modal-navigasi.js v71,
// reset-gaji-mingguan.js v72, debug-console.js/pengaturan-search.js v73, onboarding.js v74,
// diagnostik-versi.js v75, format-tema.js v76, error-handler.js v77). Domain kecil & mandiri:
// fungsi/konstanta murni tanpa dependensi ke D atau modul lain — cuma dipakai dari file lain
// (cobek.js, modules-render.js, dst) di DALAM function body yang baru jalan saat runtime
// (klik/render halaman), bukan saat file itu di-load, jadi aman dipindah walau file2 pemanggil
// itu ada di GROUP_A (dimuat lebih dulu dari GROUP_B, sebelum file ini ada).
// TIDAK ADA isi yang diubah, cuma dipindah file.
function escapeHtml(str){
if(str===null||str===undefined)return '';
return String(str)
.replaceAll('&','&amp;')
.replaceAll('<','&lt;')
.replaceAll('>','&gt;')
.replaceAll('"','&quot;')
.replaceAll("'",'&#39;');
}
const MONTHS=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
const MONTHS_FULL=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
function dateToISO(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}

// keamanan-pin.js — Domain Keamanan: layar PIN (showPinScreen/checkPin/pinPress/pinBack/updatePinDots),
// lockout percobaan PIN salah (PIN_MAX_ATTEMPTS/PIN_LOCK_DURATIONS_SEC/updatePinLockUI/dst), ganti PIN
// (gantiPin), dan enkripsi API key AI berbasis PIN (hashPin/encryptApiKeyWithPin/decryptApiKeyWithPin/
// persistApiKeyEncrypted/loadAndMigrateApiKeyOnUnlock).
// Dipindah dari features-helpers-global-security.js (v70) — dipilih sbg potongan kedua stlh
// kalkulator-input.js (v69) krn seluruh blok ini murni domain keamanan PIN & API key, TIDAK saling
// referensi ke domain lain di file asal (debug console, onboarding, format angka, dst) kecuali lewat
// variabel global saat runtime: D.profile (state, tetap di features-helpers-global-security.js), save(),
// safeSetItem(), toast(), showMain() (semua tetap di features-helpers-global-security.js), dan
// showPinPromptModal()/showAlertModal() (modal generik, tetap di features-helpers-global-security.js,
// dipanggil lewat gantiPin() saat tombol "Ganti PIN" diklik — bukan saat file dimuat).
// PENTING: file ini HARUS dimuat SETELAH features-helpers-global-security.js (butuh D, save, safeSetItem,
// toast, showMain, showAlertModal, showPinPromptModal — semua variabel global dari file itu).
// PENTING: file ini HARUS dimuat SEBELUM kalkulator-input.js & sisa file GROUP_B lainnya butuh urutan yg
// sama seperti sebelumnya, lihat komentar "urutan load" di tiap file GROUP_B.
async function hashPin(pin){
const data=new TextEncoder().encode('kwPinSalt_v1:'+String(pin));
const buf=await crypto.subtle.digest('SHA-256',data);
return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}
// PIN MENTAH SESI (perbaikan keamanan 2026-07-10): dulu kunci enkripsi API key diturunkan dari
// localStorage.getItem('kw_pin') -- tapi itu HASH PIN yang tersimpan sebagai teks biasa di
// localStorage yang sama dgn API key terenkripsi. Siapa pun yang bisa baca localStorage (DevTools,
// XSS, ekstensi nakal, backup tidak terenkripsi) otomatis punya "kunci"-nya juga, tanpa perlu tahu
// PIN sama sekali -- enkripsinya jadi percuma. Sekarang kunci diturunkan dari PIN MENTAH yang cuma
// hidup di variabel ini selama sesi (di-set sesaat setelah PIN benar dimasukkan / dibuat), TIDAK
// PERNAH ditulis ke localStorage/IndexedDB. Otomatis hilang kalau tab ditutup/di-reload (PIN harus
// dimasukkan ulang lewat checkPin() lain kali, yang mengisi ulang variabel ini).
let _sessionRawPin=null;
function showPinScreen(){document.getElementById('onboard').style.display='none';const ps=document.getElementById('pinScreen');ps.classList.remove('u-dnone');ps.style.display='flex';pinBuffer='';const t=document.getElementById('pinScreenTitle');if(t)t.textContent='🏠 Keluarga '+(D.profile.nama||'W');updatePinLockUI();}
// LOCKOUT PERCOBAAN PIN (perbaikan keamanan 2026-07-10): sebelumnya tidak ada batas percobaan salah
// sama sekali -- PIN 4 digit bisa dicoba berkali-kali tanpa jeda lewat keypad di layar. Sekarang
// setelah PIN_MAX_ATTEMPTS kali salah BERTURUT-TURUT, keypad dikunci sementara dgn durasi yg makin
// lama tiap kali terulang (PIN_LOCK_DURATIONS_SEC, detik). CATATAN JUJUR soal batasannya: ini cuma
// menghalangi coba-coba lewat UI/keypad di layar -- BUKAN pengaman kripto. Siapa pun yang punya akses
// langsung ke JS console/localStorage tetap bisa hitung hash 10.000 kombinasi PIN dalam hitungan
// milidetik tanpa lewat fungsi ini sama sekali (lihat catatan di hashPin/checkPin). Nilainya di sini
// murni memperlambat orang yang literally mencet-mencet keypad di HP yang lagi dipegang.
const PIN_MAX_ATTEMPTS=5;
const PIN_LOCK_DURATIONS_SEC=[30,60,120,300,600]; // 30d, 1m, 2m, 5m, 10m; stage berikutnya tetap di durasi terakhir (10m)
function _pinLockState(){
return {
fails:parseInt(localStorage.getItem('kw_pin_fails')||'0',10)||0,
until:parseInt(localStorage.getItem('kw_pin_lock_until')||'0',10)||0,
stage:parseInt(localStorage.getItem('kw_pin_lock_stage')||'0',10)||0
};
}
function _pinLockRemainingMs(){
return Math.max(0,_pinLockState().until-Date.now());
}
function _formatLockDuration(ms){
const totalSec=Math.ceil(ms/1000);
const m=Math.floor(totalSec/60), s=totalSec%60;
return m>0?(m+' menit '+s+' detik'):(s+' detik');
}
let _pinLockTimer=null;
function updatePinLockUI(){
const msg=document.getElementById('pinLockMsg');
const pad=document.getElementById('pinPad');
const remaining=_pinLockRemainingMs();
if(_pinLockTimer){clearInterval(_pinLockTimer);_pinLockTimer=null;}
if(remaining<=0){
if(msg)msg.textContent='';
if(pad){pad.style.opacity='';pad.style.pointerEvents='';}
return;
}
if(pad){pad.style.opacity='0.35';pad.style.pointerEvents='none';}
const tick=()=>{
const left=_pinLockRemainingMs();
if(left<=0){
localStorage.removeItem('kw_pin_lock_until');
updatePinLockUI();
return;
}
if(msg)msg.textContent='🔒 Terlalu banyak PIN salah. Coba lagi dalam '+_formatLockDuration(left)+'.';
};
tick();
_pinLockTimer=setInterval(tick,1000);
}
function pinPress(k){
if(_pinLockRemainingMs()>0)return;
if(pinBuffer.length>=4)return;pinBuffer+=k;updatePinDots();if(pinBuffer.length===4)setTimeout(checkPin,120);
}
function pinBack(){if(_pinLockRemainingMs()>0)return;pinBuffer=pinBuffer.slice(0,-1);updatePinDots();}
function updatePinDots(){for(let i=0;i<4;i++)document.getElementById('pd'+i).classList.toggle('filled',i<pinBuffer.length);}
async function checkPin(){
if(_pinLockRemainingMs()>0){pinBuffer='';updatePinDots();return;}
const correct=localStorage.getItem('kw_pin');
const hashedInput=await hashPin(pinBuffer);
if(hashedInput===correct){
localStorage.removeItem('kw_pin_fails');localStorage.removeItem('kw_pin_lock_until');localStorage.removeItem('kw_pin_lock_stage');
_sessionRawPin=pinBuffer;document.getElementById('pinScreen').style.display='none';showMain();loadAndMigrateApiKeyOnUnlock();
}else{
pinBuffer='';updatePinDots();
const st=_pinLockState();
const fails=st.fails+1;
if(fails>=PIN_MAX_ATTEMPTS){
const stage=st.stage+1;
const durSec=PIN_LOCK_DURATIONS_SEC[Math.min(stage-1,PIN_LOCK_DURATIONS_SEC.length-1)];
localStorage.setItem('kw_pin_lock_until',String(Date.now()+durSec*1000));
localStorage.setItem('kw_pin_lock_stage',String(stage));
localStorage.setItem('kw_pin_fails','0');
toast('🔒 5x PIN salah. Coba lagi dalam '+_formatLockDuration(durSec*1000)+'.',4000);
updatePinLockUI();
}else{
localStorage.setItem('kw_pin_fails',String(fails));
toast('❌ PIN salah ('+fails+'/'+PIN_MAX_ATTEMPTS+' sebelum terkunci sementara)');
}
}
}
async function gantiPin(){
const oldPin=_sessionRawPin;
const p=await showPinPromptModal({title:'Ganti PIN',message:'Masukkan PIN baru (4 digit angka)'});
if(p&&p.length===4&&!isNaN(p)){
const newHashed=await hashPin(p);
try{
const rawEnc=localStorage.getItem(API_KEY_ENC_STORAGE_KEY);
if(rawEnc&&oldPin){
let encObj=null; try{encObj=JSON.parse(rawEnc);}catch(e){}
const decrypted=await decryptApiKeyWithPin(oldPin,encObj);
if(decrypted!==null){
const reEnc=await encryptApiKeyWithPin(p,decrypted);
safeSetItem(API_KEY_ENC_STORAGE_KEY,JSON.stringify(reEnc));
}
}
}catch(e){ console.warn('Gagal re-enkripsi API key saat ganti PIN:',e); }
if(safeSetItem('kw_pin',newHashed)){_sessionRawPin=p;toast('✅ PIN diubah');}
}else if(p)showAlertModal('PIN harus 4 digit angka!',{icon:'🔒',title:'PIN Belum Valid'});
}
const API_KEY_ENC_STORAGE_KEY='kw_apikey_enc';
const API_KEY_PBKDF2_ITER=100000;
function _b64FromBuf(buf){return btoa(String.fromCharCode(...new Uint8Array(buf)));}
function _bufFromB64(b64){const bin=atob(b64);const arr=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);return arr;}
async function _deriveApiKeyCryptoKey(pin,saltBuf){
const enc=new TextEncoder();
const baseKey=await crypto.subtle.importKey('raw',enc.encode(String(pin)),'PBKDF2',false,['deriveKey']);
return crypto.subtle.deriveKey(
{name:'PBKDF2',salt:saltBuf,iterations:API_KEY_PBKDF2_ITER,hash:'SHA-256'},
baseKey,
{name:'AES-GCM',length:256},
false,
['encrypt','decrypt']
);
}
async function encryptApiKeyWithPin(pin,plainText){
const salt=crypto.getRandomValues(new Uint8Array(16));
const iv=crypto.getRandomValues(new Uint8Array(12));
const key=await _deriveApiKeyCryptoKey(pin,salt);
const ct=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(plainText));
return {salt:_b64FromBuf(salt),iv:_b64FromBuf(iv),ct:_b64FromBuf(ct)};
}
async function decryptApiKeyWithPin(pin,encObj){
if(!encObj||!encObj.salt||!encObj.iv||!encObj.ct)return null;
try{
const key=await _deriveApiKeyCryptoKey(pin,_bufFromB64(encObj.salt));
const pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:_bufFromB64(encObj.iv)},key,_bufFromB64(encObj.ct));
return new TextDecoder().decode(pt);
}catch(e){ console.warn('Gagal mendekripsi API key (PIN salah atau data rusak):',e); return null; }
}
let _apiKeyEncSaveTimer=null;
function persistApiKeyEncrypted(){
if(_apiKeyEncSaveTimer)clearTimeout(_apiKeyEncSaveTimer);
_apiKeyEncSaveTimer=setTimeout(async()=>{
try{
const pin=_sessionRawPin;
const plain=(D.profile&&D.profile.apiKey)||'';
if(!pin){return;}
if(!plain){ localStorage.removeItem(API_KEY_ENC_STORAGE_KEY); return; }
const enc=await encryptApiKeyWithPin(pin,plain);
safeSetItem(API_KEY_ENC_STORAGE_KEY,JSON.stringify(enc));
}catch(e){ console.warn('Gagal menyimpan API key terenkripsi:',e); }
},500);
}
async function loadAndMigrateApiKeyOnUnlock(){
try{
const pin=_sessionRawPin;
if(!pin||!D.profile)return;
const rawEnc=localStorage.getItem(API_KEY_ENC_STORAGE_KEY);
if(rawEnc){
let encObj=null; try{encObj=JSON.parse(rawEnc);}catch(e){}
let decrypted=await decryptApiKeyWithPin(pin,encObj);
if(decrypted===null){
// Fallback migrasi (perbaikan keamanan 2026-07-10): sebelum perbaikan ini, kunci enkripsi
// diturunkan dari HASH PIN yang tersimpan di localStorage (kw_pin), bukan dari PIN mentah.
// Coba buka pakai skema lama itu -- kalau berhasil, langsung re-enkripsi pakai skema baru
// (PIN mentah) supaya user TIDAK perlu isi ulang API key-nya, dan data lama otomatis
// "naik kelas" ke skema yang lebih aman begitu dibuka sekali.
const legacyPin=localStorage.getItem('kw_pin');
const legacyDecrypted=legacyPin?await decryptApiKeyWithPin(legacyPin,encObj):null;
if(legacyDecrypted!==null){
decrypted=legacyDecrypted;
const reEnc=await encryptApiKeyWithPin(pin,decrypted);
safeSetItem(API_KEY_ENC_STORAGE_KEY,JSON.stringify(reEnc));
}
}
if(decrypted!==null){ D.profile.apiKey=decrypted; }
else{ setTimeout(()=>toast('⚠️ API key AI perlu diisi ulang (PIN berubah / data rusak) — cek Pengaturan → AI Asisten',3600),400); }
} else if(D.profile.apiKey){
const enc=await encryptApiKeyWithPin(pin,D.profile.apiKey);
safeSetItem(API_KEY_ENC_STORAGE_KEY,JSON.stringify(enc));
save();
}
}catch(e){ console.warn('Gagal memuat/migrasi API key terenkripsi:',e); }
}

// refleksi-selfcare.js — Domain Refleksi & Self-Care: Jurnal Syukur, Checklist Self-Care harian
// (dgn hitung konsisten berturut-turut), & Catatan Privat terenkripsi (pakai PIN aplikasi, skema
// kripto sama dgn encryptApiKeyWithPin/decryptApiKeyWithPin di keamanan-pin.js — PBKDF2+AES-GCM,
// kunci diturunkan dari PIN MENTAH sesi (_sessionRawPin), TIDAK PERNAH ditulis ke storage).
// PENTING: file ini HARUS dimuat SETELAH features-helpers-global-security.js (D, save, toast,
// askConfirm, uid, todayStr, dateToISO, escapeHtml, openModal/closeModal) & SETELAH keamanan-pin.js
// (_sessionRawPin, encryptApiKeyWithPin, decryptApiKeyWithPin) — lihat urutan GROUP_B di build.js.
const REFLEKSI_SELFCARE_ITEMS=[
{id:'sc1',label:'💧 Minum air putih cukup'},
{id:'sc2',label:'😴 Tidur cukup (7-8 jam)'},
{id:'sc3',label:'🚶 Gerak / olahraga ringan'},
{id:'sc4',label:'🧘 Waktu tenang utk diri sendiri'},
{id:'sc5',label:'📵 Kurangi screen time berlebih'}
];
// SelfCareReko — widget rekomendasi ringan di tab Self-Care: baca 14 hari terakhir checklist
// self-care (D.refleksi.selfCareLog) + jurnal syukur (D.refleksi.gratitude), lalu kasih SATU
// saran paling relevan. Sengaja dibuat beda dari LifeBalance.getFocusAreas() (hidup-seimbang.js)
// yang fokus ke skor finansial/keseimbangan (Dana Darurat, DSR, No-Spend, Kerja-Istirahat) --
// widget ini fokus ke 5 item checklist self-care harian itu sendiri, yang datanya tidak dipakai
// LifeBalance sama sekali.
// PENTING nada/tone: dibuat suportif & tanpa nge-judge (selaras sama hint bawaan tab ini --
// "Ringan saja, jangan jadi beban"), BUKAN daftar kegagalan/skor per-item yang bisa berasa
// menghakimi. Tidak menyimpulkan/psikoanalisa penyebab, cuma refleksikan pola dari data yang ada.
const SelfCareReko={
compute(){
const log=D.refleksi.selfCareLog||{};
const days=[];
const d=new Date();
for(let i=0;i<14;i++){
days.push(dateToISO(d));
d.setDate(d.getDate()-1);
}
const loggedDays=days.filter(iso=>log[iso]&&log[iso].length);
if(loggedDays.length<5){
return {ready:false,note:'Isi checklist self-care beberapa hari lagi dulu ya, biar saran di sini bisa lebih pas.'};
}
const perItem=REFLEKSI_SELFCARE_ITEMS.map(it=>{
const count=loggedDays.filter(iso=>(log[iso]||[]).includes(it.id)).length;
return {...it,count,pct:Math.round((count/loggedDays.length)*100)};
});
const weakest=perItem.slice().sort((a,b)=>a.pct-b.pct)[0];
const gratitudeCount=(D.refleksi.gratitude||[]).filter(g=>days.includes(g.date)).length;
return {ready:true,loggedDaysCount:loggedDays.length,weakest,gratitudeCount};
},
render(){
const el=document.getElementById('refSelfCareRekoBox');
if(!el)return;
const r=this.compute();
if(!r.ready){
// lint-ok-no-escape: r.note selalu string tetap yg ditulis di compute() di atas, bukan data ketikan user
el.innerHTML=`<div class="u-fs11 u-t2 u-r8 u-lh14" style="padding:8px 10px;background:var(--surface2);margin-bottom:12px">💡 ${r.note}</div>`;
return;
}
const parts=[];
if(r.weakest.pct<60){
parts.push(`<b>${r.weakest.label}</b> kelihatan paling sering kelewat belakangan ini (${r.weakest.count}/${r.loggedDaysCount} hari tercatat). Kalau mau, coba fokus ke ini dulu minggu ini — pelan-pelan aja, gak perlu langsung sempurna.`);
} else {
parts.push('🎉 Semua item checklist udah cukup konsisten belakangan ini. Pertahankan ya!');
}
if(r.gratitudeCount===0){
parts.push('Belum ada catatan syukur 14 hari terakhir — kalau ada waktu sebentar, coba tulis 1 hal kecil aja di tab 🙏 Syukur.');
}
el.innerHTML=`<div class="u-fs11 u-r8 u-lh14" style="padding:9px 10px;background:var(--accent-soft);margin-bottom:12px">💡 ${parts.join(' ')}</div>`;
}
};
const Refleksi={
curTab:'syukur',
_revealed:{},
open(){
this.curTab='syukur';
this._revealed={};
this.render();
openModal('refleksiModal');
},
setTab(tab){
this.curTab=tab;
const tabs={syukur:'refTabSyukurBtn',selfcare:'refTabSelfcareBtn',catatan:'refTabCatatanBtn'};
const wraps={syukur:'refWrapSyukur',selfcare:'refWrapSelfcare',catatan:'refWrapCatatan'};
Object.keys(tabs).forEach(k=>{
const btn=document.getElementById(tabs[k]);
if(btn){btn.style.background=(k===tab)?'var(--accent)':'transparent';btn.style.color=(k===tab)?'#fff':'var(--text2)';}
const wrap=document.getElementById(wraps[k]);
if(wrap)wrap.classList.toggle('u-dnone',k!==tab);
});
this.render();
},
render(){
if(!document.getElementById('refleksiModal'))return;
this.renderGratitude();
this.renderSelfCare();
this.renderNotes();
this.renderDashCard();
},
// ===== JURNAL SYUKUR =====
addGratitude(){
const el=document.getElementById('refSyukurText');
const text=(el.value||'').trim();
if(!text){toast('Tulis dulu rasa syukurmu hari ini.');return;}
if(!D.refleksi.gratitude)D.refleksi.gratitude=[];
D.refleksi.gratitude.push({id:uid(),date:todayStr(),text});
el.value='';
save();
this.renderGratitude();
this.renderDashCard();
toast('🙏 Rasa syukur tersimpan');
},
async deleteGratitude(id){
if(!await askConfirm('Hapus catatan syukur ini?',{okText:'Ya, Hapus'}))return;
D.refleksi.gratitude=(D.refleksi.gratitude||[]).filter(g=>!sameId(g.id,id));
save();
this.renderGratitude();
},
renderGratitude(){
const listEl=document.getElementById('refSyukurList');
if(!listEl)return;
const list=(D.refleksi.gratitude||[]).slice().sort((a,b)=>b.date.localeCompare(a.date)||b.id-a.id);
if(!list.length){
listEl.innerHTML='<div class="empty"><div class="empty-icon">🙏</div><div class="empty-text">Belum ada catatan syukur</div></div>';
return;
}
// lint-ok-no-escape: g.text di-escapeHtml() eksplisit di bawah krn ini teks ketikan user
listEl.innerHTML=list.map(g=>`<div class="tx-item"><div class="tx-icon u-bgaccsoft">🙏</div><div class="tx-info"><div class="tx-name">${g.date}</div><div class="tx-meta u-lh14">${escapeHtml(g.text)}</div></div><button class="tx-del" data-action="Refleksi.deleteGratitude" data-args="${escapeHtml(JSON.stringify([g.id]))}" aria-label="Hapus">🗑</button></div>`).join('');
},
// ===== CHECKLIST SELF-CARE =====
toggleSelfCare(itemId){
if(!D.refleksi.selfCareLog)D.refleksi.selfCareLog={};
const today=todayStr();
if(!D.refleksi.selfCareLog[today])D.refleksi.selfCareLog[today]=[];
const arr=D.refleksi.selfCareLog[today];
const idx=arr.indexOf(itemId);
if(idx>=0)arr.splice(idx,1); else arr.push(itemId);
if(!arr.length)delete D.refleksi.selfCareLog[today];
save();
this.renderSelfCare();
this.renderDashCard();
},
computeStreak(){
const log=D.refleksi.selfCareLog||{};
let streak=0;
const d=new Date();
for(let i=0;i<3650;i++){
const iso=dateToISO(d);
const arr=log[iso];
if(arr&&arr.length){streak++;d.setDate(d.getDate()-1);}
else if(i===0){ d.setDate(d.getDate()-1); continue; } // hari ini belum dicentang, tetap cek kemarin
else break;
}
return streak;
},
renderSelfCare(){
const listEl=document.getElementById('refSelfCareList');
if(!listEl)return;
const today=todayStr();
const todayLog=(D.refleksi.selfCareLog&&D.refleksi.selfCareLog[today])||[];
listEl.innerHTML=REFLEKSI_SELFCARE_ITEMS.map(it=>{
const checked=todayLog.includes(it.id);
return `<div class="setting-item" style="padding:10px 0;cursor:pointer" data-action="Refleksi.toggleSelfCare" data-args='["${it.id}"]'>
      <div style="font-size:13px;${checked?'color:var(--accent3);font-weight:700':''}">${it.label}</div>
      <div style="width:22px;height:22px;border-radius:7px;border:2px solid ${checked?'var(--accent3)':'var(--border2)'};background:${checked?'var(--accent3)':'transparent'};display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#fff;font-size:13px">${checked?'✓':''}</div>
    </div>`;
}).join('');
const streakEl=document.getElementById('refStreakVal');
if(streakEl)streakEl.textContent=this.computeStreak()+' hari';
SelfCareReko.render();
const histEl=document.getElementById('refSelfCareHistory');
if(histEl){
const log=D.refleksi.selfCareLog||{};
const rows=[];
const d=new Date();
for(let i=0;i<14;i++){
const iso=dateToISO(d);
const arr=log[iso]||[];
rows.push(`<div class="u-flex u-jcb u-fs12" style="padding:6px 0;border-bottom:1px solid var(--border)"><span>${iso}</span><span class="u-t2">${arr.length}/${REFLEKSI_SELFCARE_ITEMS.length} item</span></div>`);
d.setDate(d.getDate()-1);
}
histEl.innerHTML=rows.join('');
}
},
// ===== CATATAN PRIVAT (TERENKRIPSI) =====
async addNote(){
const judulEl=document.getElementById('refCatatanJudul');
const textEl=document.getElementById('refCatatanText');
const judul=(judulEl.value||'').trim();
const text=(textEl.value||'').trim();
if(!text){toast('Tulis dulu isi catatannya.');return;}
if(typeof _sessionRawPin==='undefined'||!_sessionRawPin){
toast('⚠️ Sesi PIN tidak aktif — buka ulang aplikasi (kunci lalu buka lagi dgn PIN) sebelum menyimpan catatan privat.',4000);
return;
}
try{
const plain=JSON.stringify({title:judul,text});
const enc=await encryptApiKeyWithPin(_sessionRawPin,plain);
if(!D.refleksi.privateNotes)D.refleksi.privateNotes=[];
D.refleksi.privateNotes.push({id:uid(),date:todayStr(),enc});
judulEl.value='';textEl.value='';
save();
this.renderNotes();
toast('🔒 Catatan privat tersimpan (terenkripsi)');
}catch(e){
console.error('Gagal enkripsi catatan privat:',e);
toast('⚠️ Gagal menyimpan catatan privat.');
}
},
async deleteNote(id){
if(!await askConfirm('Hapus catatan privat ini? Tindakan ini tidak bisa dibatalkan.',{okText:'Ya, Hapus'}))return;
D.refleksi.privateNotes=(D.refleksi.privateNotes||[]).filter(n=>!sameId(n.id,id));
delete this._revealed[id];
save();
this.renderNotes();
},
async toggleNoteView(id){
const bodyEl=document.getElementById('refNoteBody_'+id);
const btnEl=document.getElementById('refNoteEyeBtn_'+id);
if(!bodyEl)return;
if(this._revealed[id]){
delete this._revealed[id];
bodyEl.textContent='•••• (Terenkripsi — tap 👁 utk lihat)';
if(btnEl)btnEl.textContent='👁';
return;
}
if(typeof _sessionRawPin==='undefined'||!_sessionRawPin){
toast('⚠️ Sesi PIN tidak aktif, tidak bisa membuka catatan ini sekarang.');
return;
}
const note=(D.refleksi.privateNotes||[]).find(n=>sameId(n.id,id));
if(!note)return;
const decrypted=await decryptApiKeyWithPin(_sessionRawPin,note.enc);
if(decrypted===null){
toast('❌ Gagal membuka catatan (PIN berubah atau data rusak).');
return;
}
let parsed=null; try{parsed=JSON.parse(decrypted);}catch(e){}
this._revealed[id]=true;
if(btnEl)btnEl.textContent='🙈';
bodyEl.innerHTML=parsed?`${parsed.title?'<b>'+escapeHtml(parsed.title)+'</b><br>':''}${escapeHtml(parsed.text||'')}`:escapeHtml(decrypted);
},
renderNotes(){
const listEl=document.getElementById('refCatatanList');
if(!listEl)return;
const list=(D.refleksi.privateNotes||[]).slice().sort((a,b)=>b.date.localeCompare(a.date)||b.id-a.id);
if(!list.length){
listEl.innerHTML='<div class="empty"><div class="empty-icon">🔒</div><div class="empty-text">Belum ada catatan privat</div></div>';
return;
}
listEl.innerHTML=list.map(n=>`<div class="tx-item"><div class="tx-icon u-bgaccsoft">🔒</div><div class="tx-info"><div class="tx-name">${n.date}</div><div class="tx-meta u-lh14" id="refNoteBody_${n.id}">•••• (Terenkripsi — tap 👁 utk lihat)</div></div><button class="tx-del" id="refNoteEyeBtn_${n.id}" data-action="Refleksi.toggleNoteView" data-args="${escapeHtml(JSON.stringify([n.id]))}" aria-label="Lihat">👁</button><button class="tx-del" data-action="Refleksi.deleteNote" data-args="${escapeHtml(JSON.stringify([n.id]))}" aria-label="Hapus">🗑</button></div>`).join('');
},
// ===== KARTU RINGKASAN DI DASHBOARD =====
renderDashCard(){
const el=document.getElementById('refleksiStreakBadge');
if(!el)return;
const streak=this.computeStreak();
el.textContent=streak>0?('🔥 '+streak+' hari'):'';
}
};

// modal-navigasi.js — Domain Modal Generik & Navigasi Halaman: modal konfirmasi/prompt/pilihan/info/pin
// (askConfirm/showPromptModal/showChoiceModal/showAlertModal/showPinPromptModal & pasangan _xxxAnswer/_xxxSubmit-nya),
// buka/tutup modal & quick-switcher (openModal/closeModal/openQS/closeQS/_syncNavVisibilityForModals),
// swipe-to-dismiss modal (enableSwipeToDismiss), pindah halaman (showPage/refreshCurrentPage), dan
// collapse/expand kartu di halaman (toggleCardCollapse/applyOneCardCollapsePref/applyCardCollapsePrefs).
// Dipindah dari features-helpers-global-security.js (v71) — potongan KETIGA stlh kalkulator-input.js
// (v69) & keamanan-pin.js (v70). Blok ini dipilih krn 1 domain UI generik yang murni, kontigu (tidak
// diselang domain lain seperti 2 potongan sebelumnya), murni DOM + localStorage, TIDAK bergantung ke D
// atau state aplikasi lain sama sekali. Cuma 2 pengecualian aman: `closeModal()` cek
// `typeof WorthIt!=='undefined'` (guarded, pola lama) sebelum akses WorthIt.pendingBuyId, dan
// `showPage()` memanggil `renderPageContent()` (di modules-render.js, GROUP_A) lewat variabel global saat
// tombol nav diklik — bukan saat file dimuat. TIDAK ada kode top-level yang jalan sendiri saat file
// di-load (semua cuma deklarasi function/let).
// Dipanggil dari HAMPIR SEMUA file lain (askConfirm/openModal/closeModal dipakai di ~20 file, dst) —
// semua lewat nama global saat runtime (klik tombol / data-action di HTML / dalam fungsi lain), bukan
// referensi lokal ke file, jadi aman dipindah ke file sendiri.
// PENTING: file ini HARUS dimuat SETELAH features-helpers-global-security.js (butuh escapeHtml(), dipakai
// showChoiceModal utk render tombol pilihan).
let _confirmResolve=null;
function askConfirm(message,opts){
opts=opts||{};
return new Promise((resolve)=>{
_confirmResolve=resolve;
document.getElementById('confirmModalIcon').textContent=opts.icon||'⚠️';
document.getElementById('confirmModalTitle').textContent=opts.title||'Konfirmasi';
document.getElementById('confirmModalMsg').textContent=message;
const okBtn=document.getElementById('confirmModalOk');
okBtn.textContent=opts.okText||'Ya, Lanjutkan';
okBtn.className='btn btn-full '+(opts.danger===false?'btn-primary':'btn-danger');
document.getElementById('confirmModalCancel').textContent=opts.cancelText||'Batal';
document.getElementById('confirmModalOverlay').classList.add('open');
});
}
function _confirmModalAnswer(val){
document.getElementById('confirmModalOverlay').classList.remove('open');
if(_confirmResolve){const r=_confirmResolve;_confirmResolve=null;r(val);}
}
let _promptModalResolve=null;
function showPromptModal(opts){
opts=opts||{};
const overlay=document.getElementById('promptModalOverlay');
if(!overlay){ return Promise.resolve(prompt(opts.message||'',opts.defaultValue!=null?String(opts.defaultValue):'')); }
return new Promise((resolve)=>{
_promptModalResolve=resolve;
overlay._validateFn=opts.validate||null;
document.getElementById('promptModalIcon').textContent=opts.icon||'✏️';
document.getElementById('promptModalTitle').textContent=opts.title||'Isi Data';
const msgEl=document.getElementById('promptModalMsg');
msgEl.textContent=opts.message||'';
msgEl.style.display=opts.message?'':'none';
const input=document.getElementById('promptModalInput');
input.type=opts.inputType||'text';
input.inputMode=opts.inputMode||(opts.inputType==='number'?'decimal':'text');
input.placeholder=opts.placeholder||'';
input.value=opts.defaultValue!=null?String(opts.defaultValue):'';
document.getElementById('promptModalError').textContent='';
document.getElementById('promptModalOkBtn').textContent=opts.okText||'Simpan';
document.getElementById('promptModalCancelBtn').textContent=opts.cancelText||'Batal';
overlay.classList.add('open');
setTimeout(()=>{input.focus();input.select();},50);
});
}
function _promptModalSubmit(){
const overlay=document.getElementById('promptModalOverlay');
const input=document.getElementById('promptModalInput');
const val=input.value;
if(overlay._validateFn){
const err=overlay._validateFn(val);
if(err){ document.getElementById('promptModalError').textContent=err; return; }
}
overlay.classList.remove('open');
if(_promptModalResolve){const r=_promptModalResolve;_promptModalResolve=null;r(val);}
}
function _promptModalAnswer(val){
document.getElementById('promptModalOverlay').classList.remove('open');
if(_promptModalResolve){const r=_promptModalResolve;_promptModalResolve=null;r(val);}
}
let _choiceModalResolve=null;
function showChoiceModal(opts){
opts=opts||{};
const choices=opts.choices||[];
const overlay=document.getElementById('choiceModalOverlay');
if(!overlay){
const pilihan=choices.map((c,i)=>`${i+1}. ${c.label}`).join('\n');
const idxStr=prompt((opts.message||'Pilih:')+'\n'+pilihan+'\n\nKetik nomor:','1');
if(idxStr===null)return Promise.resolve(null);
const idx=parseInt(idxStr)-1;
return Promise.resolve(choices[idx]?idx:null);
}
return new Promise((resolve)=>{
_choiceModalResolve=resolve;
document.getElementById('choiceModalTitle').textContent=opts.title||'Pilih';
const msgEl=document.getElementById('choiceModalMsg');
msgEl.textContent=opts.message||'';
msgEl.style.display=opts.message?'':'none';
const list=document.getElementById('choiceModalList');
list.innerHTML=choices.map((c,i)=>`<button class="btn btn-ghost btn-full" style="justify-content:flex-start;text-align:left" data-action="_choiceModalAnswer" data-args="${escapeHtml(JSON.stringify([i]))}">${escapeHtml(c.label)}</button>`).join('');
document.getElementById('choiceModalOverlay').classList.add('open');
});
}
function _choiceModalAnswer(idx){
document.getElementById('choiceModalOverlay').classList.remove('open');
if(_choiceModalResolve){const r=_choiceModalResolve;_choiceModalResolve=null;r(idx);}
}
let _infoModalResolve=null;
function showAlertModal(message,opts){
opts=opts||{};
const overlay=document.getElementById('infoModalOverlay');
if(!overlay){ alert(message); return Promise.resolve(); }
return new Promise((resolve)=>{
_infoModalResolve=resolve;
document.getElementById('infoModalIcon').textContent=opts.icon||'⚠️';
document.getElementById('infoModalTitle').textContent=opts.title||'Perhatian';
document.getElementById('infoModalMsg').textContent=message;
document.getElementById('infoModalOk').textContent=opts.okText||'Mengerti';
overlay.classList.add('open');
});
}
function _infoModalAnswer(){
document.getElementById('infoModalOverlay').classList.remove('open');
if(_infoModalResolve){const r=_infoModalResolve;_infoModalResolve=null;r(true);}
}
let _pinPromptResolve=null;
function showPinPromptModal(opts){
opts=opts||{};
const overlay=document.getElementById('pinPromptModalOverlay');
if(!overlay){ return Promise.resolve(prompt(opts.message||'PIN baru (4 digit):')); }
return new Promise((resolve)=>{
_pinPromptResolve=resolve;
document.getElementById('pinPromptModalTitle').textContent=opts.title||'Ganti PIN';
document.getElementById('pinPromptModalMsg').textContent=opts.message||'Masukkan PIN baru (4 digit angka)';
const input=document.getElementById('pinPromptInput');
input.value='';
document.getElementById('pinPromptError').textContent='';
overlay.classList.add('open');
setTimeout(()=>input.focus(),50);
});
}
function _pinPromptSubmit(){
const input=document.getElementById('pinPromptInput');
const val=(input.value||'').trim();
if(val.length!==4){ document.getElementById('pinPromptError').textContent='PIN harus 4 digit angka.'; return; }
document.getElementById('pinPromptModalOverlay').classList.remove('open');
if(_pinPromptResolve){const r=_pinPromptResolve;_pinPromptResolve=null;r(val);}
}
function _pinPromptAnswer(val){
document.getElementById('pinPromptModalOverlay').classList.remove('open');
if(_pinPromptResolve){const r=_pinPromptResolve;_pinPromptResolve=null;r(val);}
}
function showPage(name,el){
document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
document.querySelectorAll('.nav-item').forEach(n=>{n.classList.remove('active');n.setAttribute('aria-current','false');});
document.getElementById('page-'+name).classList.add('active');
const activeBtn=el||document.querySelector(`.nav-item[onclick*="'${name}'"]`);
if(activeBtn){activeBtn.classList.add('active');activeBtn.setAttribute('aria-current','page');}
renderPageContent(name);
const sr=document.getElementById('scrollRoot');
if(sr)sr.scrollTop=0;
}
/* moved to modules-render.js: renderPageContent */
function refreshCurrentPage(){
const active=document.querySelector('.page.active');
if(!active)return;
renderPageContent(active.id.replace('page-',''));
}
function _syncNavVisibilityForModals(){
const anyOpen=document.querySelector('.overlay.open,.qs-modal-overlay.open,.calc-overlay.open');
document.body.classList.toggle('has-open-modal',!!anyOpen);
}
function openModal(id){document.getElementById(id).classList.add('open');_syncNavVisibilityForModals();}
function toggleCardCollapse(key,ev){
if(ev)ev.stopPropagation();
const body=document.getElementById(key+'-cbody');
const chev=document.getElementById(key+'-chev');
if(!body)return;
const collapsed=body.classList.toggle('collapsed');
if(chev)chev.classList.toggle('collapsed',collapsed);
try{
const prefs=JSON.parse(localStorage.getItem('cardCollapsePrefs')||'{}');
prefs[key]=collapsed;
localStorage.setItem('cardCollapsePrefs',JSON.stringify(prefs));
}catch(e){ }
}
function applyOneCardCollapsePref(key){
let prefs={};
try{prefs=JSON.parse(localStorage.getItem('cardCollapsePrefs')||'{}');}catch(e){}
if(!prefs[key])return;
const body=document.getElementById(key+'-cbody');
const chev=document.getElementById(key+'-chev');
if(body)body.classList.add('collapsed');
if(chev)chev.classList.add('collapsed');
}
function applyCardCollapsePrefs(){
let prefs={};
try{prefs=JSON.parse(localStorage.getItem('cardCollapsePrefs')||'{}');}catch(e){}
Object.keys(prefs).forEach(key=>{
if(!prefs[key])return;
const body=document.getElementById(key+'-cbody');
const chev=document.getElementById(key+'-chev');
if(body)body.classList.add('collapsed');
if(chev)chev.classList.add('collapsed');
});
}
function closeModal(id){
document.getElementById(id).classList.remove('open');
if(id==='txModal'&&typeof WorthIt!=='undefined'&&WorthIt.pendingBuyId){
WorthIt.pendingBuyId=null;
}
_syncNavVisibilityForModals();
}
function enableSwipeToDismiss(overlayId){
const overlay=document.getElementById(overlayId);
if(!overlay)return;
const sheet=overlay.querySelector('.modal');
const handle=overlay.querySelector('.modal-handle');
if(!sheet||!handle)return;
const THRESHOLD=90;
let startY=0,lastDy=0,dragging=false;
function pointY(e){return e.touches?e.touches[0].clientY:e.clientY;}
function onStart(e){
dragging=true;
startY=pointY(e);
lastDy=0;
sheet.style.transition='none';
}
function onMove(e){
if(!dragging)return;
const dy=pointY(e)-startY;
if(dy<=0)return;
lastDy=dy;
sheet.style.transform=`translateY(${dy}px)`;
}
function onEnd(){
if(!dragging)return;
dragging=false;
sheet.style.transition='transform 0.2s ease';
if(lastDy>THRESHOLD){
sheet.style.transform='translateY(100%)';
setTimeout(()=>{ closeModal(overlayId); sheet.style.transform=''; },160);
} else {
sheet.style.transform='';
}
lastDy=0;
}
handle.addEventListener('touchstart',onStart,{passive:true});
handle.addEventListener('touchmove',onMove,{passive:true});
handle.addEventListener('touchend',onEnd);
handle.addEventListener('touchcancel',onEnd);
handle.addEventListener('mousedown',onStart);
window.addEventListener('mousemove',onMove);
window.addEventListener('mouseup',onEnd);
}
function openQS(id){document.getElementById(id).classList.add('open');_syncNavVisibilityForModals();}
function closeQS(id){document.getElementById(id).classList.remove('open');_syncNavVisibilityForModals();}

// reset-gaji-mingguan.js — Domain Reset Gaji Mingguan: hitung rentang minggu berjalan (getWeekRange),
// deteksi & tawarkan reset absensi tiap Sabtu (checkWeeklySalaryReset), buka modal reset manual
// (openWeeklyResetManual), dan proses konfirmasi reset + catat pemasukan gaji otomatis (confirmWeeklyReset).
// Dipindah dari features-helpers-global-security.js (v72) — potongan KEEMPAT stlh kalkulator-input.js
// (v69), keamanan-pin.js (v70), modal-navigasi.js (v71). Blok ini kontigu di file asal (langsung sebelum
// showMain), 1 domain murni (fitur "gajian mingguan dari Absensi harian" di modul Tukang/Gaji), TIDAK
// direferensi modul lain kecuali lewat variabel global: D.workDays/D.transactions/D.accounts/D.categories/
// D.lastResetPromptDate (state, tetap di features-helpers-global-security.js), uid()/save()/toast()/
// fmtFull() (tetap di file itu juga), openModal()/closeModal() (modal-navigasi.js), populateAccFilters()
// (akun.js), renderWorkDays()/renderDashboard()/renderKeuangan() (modules-render.js), dateToISO()
// (helper-teks.js) — semua diakses saat runtime (klik tombol/modal
// dibuka), bukan saat file dimuat.
// CATATAN: `todayStr()` SENGAJA TIDAK ikut dipindah (tetap di features-helpers-global-security.js)
// walau ada tepat di antara getWeekRange & _wrLastTotal di file lama — krn itu utilitas tanggal generik
// yang dipakai 12+ file lain di luar domain reset gaji mingguan (mirip fmt/escapeHtml), bukan spesifik
// domain ini. Dipanggil dari sini lewat variabel global seperti biasa.
// PENTING: file ini HARUS dimuat SETELAH features-helpers-global-security.js (butuh D, save, toast,
// fmtFull, uid, todayStr) & modal-navigasi.js (butuh openModal/closeModal).
function getWeekRange(d){
const day=d.getDay();
const start=new Date(d); start.setDate(d.getDate()-day); start.setHours(0,0,0,0);
const end=new Date(start); end.setDate(start.getDate()+6); end.setHours(23,59,59,999);
return {start,end};
}
let _wrLastTotal=0,_wrLastCount=0;
function checkWeeklySalaryReset(){
const now=new Date();
if(now.getDay()!==6) return;
const ts=todayStr();
if(D.lastResetPromptDate===ts) return;
const {start,end}=getWeekRange(now);
const weekDays=D.workDays.filter(w=>{const d=new Date(w.date);return d>=start&&d<=end;});
if(!weekDays.length){ D.lastResetPromptDate=ts; save(); return; }
const total=weekDays.reduce((s,w)=>s+w.total,0);
_wrLastTotal=total;_wrLastCount=weekDays.length;
document.getElementById('wrCount').textContent=weekDays.length;
document.getElementById('wrTotal').textContent=fmtFull(total);
const ckEl=document.getElementById('wrAutoIncome'); if(ckEl) ckEl.checked=true;
const accWrapEl=document.getElementById('wrAccWrap'); if(accWrapEl) accWrapEl.style.display=D.accounts.length?'block':'none';
const accEl=document.getElementById('wrAcc'); if(accEl&&D.accounts.length) accEl.value=D.accounts[0].id;
openModal('weeklyResetModal');
}
function openWeeklyResetManual(){
const now=new Date();
const {start,end}=getWeekRange(now);
const weekDays=D.workDays.filter(w=>{const d=new Date(w.date);return d>=start&&d<=end;});
if(!weekDays.length){toast('⚠️ Belum ada absensi minggu ini untuk dicatat');return;}
const total=weekDays.reduce((s,w)=>s+w.total,0);
_wrLastTotal=total;_wrLastCount=weekDays.length;
populateAccFilters();
document.getElementById('wrCount').textContent=weekDays.length;
document.getElementById('wrTotal').textContent=fmtFull(total);
const ckEl=document.getElementById('wrAutoIncome'); if(ckEl) ckEl.checked=true;
const accWrapEl=document.getElementById('wrAccWrap'); if(accWrapEl) accWrapEl.style.display=D.accounts.length?'block':'none';
const accEl=document.getElementById('wrAcc'); if(accEl&&D.accounts.length) accEl.value=D.accounts[0].id;
closeModal('absensiModal');
closeModal('gajiCalcModal');
openModal('weeklyResetModal');
}
function confirmWeeklyReset(yes){
const now=new Date();
const {start,end}=getWeekRange(now);
let incomeSaved=false;
if(yes){
const autoEl=document.getElementById('wrAutoIncome');
const autoIncome=autoEl&&autoEl.checked&&_wrLastTotal>0;
if(autoIncome){
const accEl=document.getElementById('wrAcc');
const accId=(accEl&&accEl.value)||(D.accounts.length?D.accounts[0].id:null);
const gajiCat=D.categories.income.find(c=>/gaji/i.test(c.name));
const catName=gajiCat?gajiCat.name:(D.categories.income[0]?D.categories.income[0].name:'Gaji');
D.transactions.push({id:uid(),type:'income',amount:_wrLastTotal,category:catName,subcategory:'',accountId:accId,payMethod:'tunai',note:`Gaji mingguan dari absensi (${_wrLastCount} hari kerja, ${dateToISO(start)} s/d ${dateToISO(end)})`,date:dateToISO(now)});
incomeSaved=true;
}
D.workDays=D.workDays.filter(w=>{const d=new Date(w.date);return !(d>=start&&d<=end);});
toast(incomeSaved?`✅ Absensi direset & ${fmtFull(_wrLastTotal)} dicatat sebagai Pemasukan! 🎉`:'✅ Absensi minggu ini direset, selamat gajian! 🎉');
} else {
toast('Oke, data absensi minggu ini tetap disimpan');
}
D.lastResetPromptDate=todayStr();
save();
closeModal('weeklyResetModal');
renderWorkDays();
renderDashboard();
if(incomeSaved) renderKeuangan();
}

// debug-console.js — Domain Debug Console: toggle tombol status (updateDebugConsoleBtn) & aktifkan/matikan
// panel debug pihak ketiga "eruda" (toggleDebugConsole), termasuk lazy-load skrip eruda dari CDN kalau
// belum pernah dipakai.
// Dipindah dari features-helpers-global-security.js (v73) — potongan KELIMA stlh kalkulator-input.js
// (v69), keamanan-pin.js (v70), modal-navigasi.js (v71), reset-gaji-mingguan.js (v72). Dipilih krn
// domain kecil & mandiri: cuma pakai localStorage/window.eruda/document (DOM), TIDAK bergantung ke D
// atau modul lain kecuali toast() (tetap di features-helpers-global-security.js, dipanggil saat
// runtime tombol diklik).
// Dipanggil dari: tombol "Aktifkan/Matikan Debug Console" di Pengaturan (data-action="toggleDebugConsole"
// di index.html/app_production.html), dan updateDebugConsoleBtn() dipanggil dari modules-render.js saat
// render halaman Pengaturan.
// PENTING: file ini HARUS dimuat SETELAH features-helpers-global-security.js (butuh toast()).
function updateDebugConsoleBtn(){
const btn=document.getElementById('btnToggleDebugConsole');
if(!btn)return;
const active=localStorage.getItem('kw_debug_console')==='1';
btn.textContent=active?'🐞 Matikan Debug Console':'🐞 Aktifkan Debug Console';
}
function toggleDebugConsole(){
const active=localStorage.getItem('kw_debug_console')==='1';
if(active){
localStorage.removeItem('kw_debug_console');
try{ if(window.eruda) eruda.destroy(); }catch(e){}
toast('🐞 Debug console dimatikan');
updateDebugConsoleBtn();
return;
}
localStorage.setItem('kw_debug_console','1');
if(window.eruda){
try{ eruda.init(); }catch(e){}
toast('🐞 Debug console diaktifkan');
updateDebugConsoleBtn();
return;
}
const s=document.createElement('script');
s.src='https://cdn.jsdelivr.net/npm/eruda';
s.onload=function(){
try{ eruda.init(); toast('🐞 Debug console diaktifkan'); }
catch(e){ toast('⚠️ Gagal menyalakan debug console: '+e.message); }
updateDebugConsoleBtn();
};
s.onerror=function(){
localStorage.removeItem('kw_debug_console');
toast('⚠️ Gagal memuat debug console (butuh internet saat pertama kali aktif)');
updateDebugConsoleBtn();
};
(document.head||document.documentElement).appendChild(s);
}

// pengaturan-search.js — Domain Pencarian Pengaturan: buka/tutup grup pengaturan (toggleStgGroup), cari
// & sorot kartu pengaturan yang cocok teks pencarian (stgSearch), dan dukungan keyboard (Enter/Spasi)
// utk buka grup pengaturan lewat kepala grup yang sedang fokus.
// Dipindah dari features-helpers-global-security.js (v73) — potongan KEENAM stlh kalkulator-input.js
// (v69), keamanan-pin.js (v70), modal-navigasi.js (v71), reset-gaji-mingguan.js (v72),
// debug-console.js (v73, potongan sebelum ini di sesi yang sama). Dipilih krn domain kecil & mandiri:
// cuma pakai document.querySelectorAll/getElementById (DOM murni), TIDAK bergantung ke D atau modul
// lain sama sekali.
// CATATAN: blok ini menyertakan 1 `document.addEventListener('keydown',...)` top-level yang jalan saat
// file dimuat (bukan cuma deklarasi function) — ini AMAN dipindah krn cuma daftarkan event listener
// baru ke window/document, tidak bergantung urutan modul lain siap atau tidak.
// Dipanggil dari: `onclick="toggleStgGroup(...)"` & `oninput="stgSearch(...)"` di halaman Pengaturan
// (index.html/app_production.html).
// PENTING: file ini HARUS dimuat SETELAH features-helpers-global-security.js.
function toggleStgGroup(id){
var g=document.getElementById(id);
if(!g)return;
const isOpen=g.classList.toggle('open');
const head=g.querySelector('.stg-group-head');
if(head)head.setAttribute('aria-expanded',isOpen?'true':'false');
}
// Collapse per-kartu (beda dari toggleStgGroup yg collapse seluruh grup) — dipakai kartu tunggal
// yg isinya panjang, mis. "Kartu di Beranda". `id` = id elemen .card-collapse pembungkusnya.
function toggleCardCollapse(id){
var c=document.getElementById(id);
if(!c)return;
const isOpen=c.classList.toggle('open');
const head=c.querySelector('.card-collapse-head');
if(head)head.setAttribute('aria-expanded',isOpen?'true':'false');
}
let _stgSearchHighlighted=[];
function stgSearch(qRaw){
const q=(qRaw||'').trim().toLowerCase();
const resultEl=document.getElementById('stgSearchResult');
_stgSearchHighlighted.forEach(c=>{c.style.outline='';c.style.outlineOffset='';});
_stgSearchHighlighted=[];
if(!q){ if(resultEl)resultEl.style.display='none'; return; }
const cards=document.querySelectorAll('#page-settings .stg-group-body-inner .card');
let matches=[];
cards.forEach(card=>{
if(card.textContent.toLowerCase().indexOf(q)!==-1) matches.push(card);
});
if(resultEl){
resultEl.classList.remove('u-dnone');resultEl.style.display='block';
resultEl.textContent=matches.length?('✅ '+matches.length+' hasil ditemukan'):'⚠️ Tidak ada pengaturan yang cocok';
}
matches.forEach((card,i)=>{
const grp=card.closest('.stg-group');
if(grp && !grp.classList.contains('open')) toggleStgGroup(grp.id);
if(card.classList.contains('card-collapse') && !card.classList.contains('open')) toggleCardCollapse(card.id);
card.style.outline='2px solid var(--accent)';
card.style.outlineOffset='3px';
_stgSearchHighlighted.push(card);
if(i===0) setTimeout(()=>card.scrollIntoView({behavior:'smooth',block:'center'}),120);
});
}
document.addEventListener('keydown',function(e){
if(e.key!=='Enter'&&e.key!==' ')return;
const head=e.target.closest&&e.target.closest('.stg-group-head,.card-collapse-head');
if(!head)return;
e.preventDefault();
head.click();
});

// onboarding.js — Domain Onboarding: preview perkiraan kasar gaji/kiriman saat setup awal
// (updateOnboardPreview) & proses selesai onboarding — simpan profil awal + PIN (finishOnboard).
// Dipindah dari features-helpers-global-security.js (v74) — potongan KETUJUH stlh
// kalkulator-input.js (v69), keamanan-pin.js (v70), modal-navigasi.js (v71),
// reset-gaji-mingguan.js (v72), debug-console.js & pengaturan-search.js (v73). Dipilih krn
// domain kecil & mandiri: cuma dipakai saat layar onboarding pertama kali dibuka, tidak ada
// modul lain yang gantung ke fungsi ini selain lewat data-action/oninput di HTML.
// Bergantung ke (semua diakses lewat variabel global saat runtime, BUKAN referensi lokal file):
// D/save() (features-helpers-global-security.js), fmtFull/fmtFullSigned/safeSetItem/showMain
// (features-helpers-global-security.js), hashPin/_sessionRawPin (keamanan-pin.js),
// showAlertModal (modals.js).
// Dipanggil dari: `oninput="updateOnboardPreview()"` di input gaji/kiriman onboarding &
// `data-action="finishOnboard"` di tombol "Mulai Sekarang" (index.html/app_production.html),
// juga dipanggil sekali dari features-sheets-pwa-selftest.js saat cek status setup pertama load.
// PENTING: file ini HARUS dimuat SETELAH features-helpers-global-security.js (butuh fmtFull/
// fmtFullSigned/safeSetItem/showMain) & keamanan-pin.js (butuh hashPin/_sessionRawPin).
function updateOnboardPreview(){
const box=document.getElementById('obPreviewBox'); if(!box)return;
const gaji=parseInt(document.getElementById('ob_gaji').value)||0;
const kirim=parseInt(document.getElementById('ob_kirim').value)||0;
const estBulanan=gaji*26;
const estSisaKirim=estBulanan-(kirim*4);
box.innerHTML='📊 <b>Perkiraan kasar</b> (26 hari kerja/bulan):<br>'
+'Gaji sebulan: <b>'+fmtFull(estBulanan)+'</b><br>'
+'Setelah kiriman rutin: <b style="color:'+(estSisaKirim>=0?'#22c55e':'#ef4444')+'">'+fmtFullSigned(estSisaKirim)+'</b><br>'
+'<span class="u-ctext3">Nanti bisa diatur presisi lewat Absensi harian</span>';
}
async function finishOnboard(){
const nama=document.getElementById('ob_nama').value||'W';
const gaji=parseInt(document.getElementById('ob_gaji').value)||65000;
const kirim=parseInt(document.getElementById('ob_kirim').value)||500000;
const pin=document.getElementById('ob_pin').value;
const tema=document.getElementById('ob_tema').value;
if(pin.length!==4){showAlertModal('PIN harus 4 digit!',{icon:'🔒',title:'PIN Belum Valid'});return;}
D.profile={nama,gajiPokok:gaji,kiriman:kirim,theme:tema,tanggalLahir:null,statusKawin:false,tanggungan:0,statusPekerjaan:null};
safeSetItem('kw_pin',await hashPin(pin));
_sessionRawPin=pin;
safeSetItem('kw_setup','1');
save(); document.getElementById('onboard').style.display='none'; showMain();
}

// kalkulator-input.js — Kalkulator ekspresi angka: parser aman (safeCalc), popup kalkulator (openCalc/calcPress/dst),
// dan preview nilai input jumlah (calcPreviewValue/updateAmtPreview/evalAmtExpr).
// Dipindah dari features-helpers-global-security.js (v69) — domain mandiri, cuma pakai document.getElementById
// & openModal/closeModal (variabel global dari features-helpers-global-security.js, diakses saat runtime lewat
// klik tombol, bukan saat file dimuat, jadi aman ada di file terpisah). Dipanggil dari banyak file lain
// (modals.js, renovasi.js, transaksi.js, features-tukang-kendaraan-storage.js, dst) lewat
// nama global (data-action="openCalc" dll di HTML modal, atau evalAmtExpr('id') di onblur).
// PENTING: file ini HARUS dimuat SETELAH features-helpers-global-security.js (butuh fmt(), openModal/closeModal).
function calcPreviewValue(str){
if(!str)return 0;
const r=safeCalc(String(str));
return isNaN(r)?0:r;
}
function updateAmtPreview(inputId,previewId){
const el=document.getElementById(inputId);
const prev=document.getElementById(previewId);
if(!el||!prev)return;
const v=calcPreviewValue(el.value);
prev.textContent=(v&&v>0)?('= '+fmt(v)):'';
}
function normalizeAmtToken(tok){
if(tok.indexOf('.')===-1)return tok;
const parts=tok.split('.');
const last=parts[parts.length-1];
if(last.length>=1&&last.length<=2){
const intPart=parts.slice(0,-1).join('');
return intPart+'.'+last;
}
return parts.join('');
}
function safeCalc(expr){
if(typeof expr!=='string')return NaN;
expr=expr.trim();
if(!expr)return NaN;
if(!/^[0-9+\-*/().\s]+$/.test(expr))return NaN;
expr=expr.replace(/\d+(?:\.\d+)*/g,m=>normalizeAmtToken(m));
let i=0;
function skipWs(){while(expr[i]===' ')i++;}
function parseExpr(){
let v=parseTerm();
while(true){
skipWs();
if(expr[i]==='+'){i++;v+=parseTerm();}
else if(expr[i]==='-'){i++;v-=parseTerm();}
else break;
}
return v;
}
function parseTerm(){
let v=parseFactor();
while(true){
skipWs();
if(expr[i]==='*'){i++;v*=parseFactor();}
else if(expr[i]==='/'){i++;const d=parseFactor();v=d===0?NaN:v/d;}
else break;
}
return v;
}
function parseFactor(){
skipWs();
if(expr[i]==='('){i++;const v=parseExpr();skipWs();if(expr[i]===')')i++;return v;}
if(expr[i]==='-'){i++;return -parseFactor();}
if(expr[i]==='+'){i++;return parseFactor();}
const start=i;
while(i<expr.length&&/[0-9.]/.test(expr[i]))i++;
if(start===i)return NaN;
return parseFloat(expr.slice(start,i));
}
try{
const result=parseExpr();
skipWs();
if(i<expr.length)return NaN;
return result;
}catch(e){return NaN;}
}
function evalAmtExpr(id){
const el=document.getElementById(id);
if(!el)return;
const raw=el.value;
if(!raw||!/[+\-*/.]/.test(raw))return;
const r=safeCalc(raw);
if(!isNaN(r)&&isFinite(r)){
el.value=String(Math.round(r*100)/100);
el.dispatchEvent(new Event('input',{bubbles:true}));
}
}
let calcTargetId=null, calcExpr='';
function openCalc(targetId){
calcTargetId=targetId;
const el=document.getElementById(targetId);
calcExpr=(el&&el.value&&/^[0-9.]+$/.test(el.value))?el.value:'';
calcRenderDisplay();
openModal('calcModal');
}
function closeCalc(){ closeModal('calcModal'); }
function calcRenderDisplay(){
const exprEl=document.getElementById('calcExprEl');
const valEl=document.getElementById('calcValEl');
if(!exprEl||!valEl)return;
if(!calcExpr){ exprEl.textContent=''; valEl.textContent='0'; return; }
if(/[+\-*/]$/.test(calcExpr)||(!/[+\-*/]/.test(calcExpr)&&!/\./.test(calcExpr))){
exprEl.textContent='';
valEl.textContent=calcExpr;
}else{
const r=safeCalc(calcExpr);
exprEl.textContent=calcExpr;
valEl.textContent=isNaN(r)?calcExpr:String(Math.round(r*100)/100);
}
}
function calcPress(ch){
if('+-*/'.includes(ch)){
if(!calcExpr)calcExpr='0';
if(/[+\-*/]$/.test(calcExpr))calcExpr=calcExpr.slice(0,-1);
calcExpr+=ch;
}else{
calcExpr+=ch;
}
calcRenderDisplay();
}
function calcClear(){ calcExpr=''; calcRenderDisplay(); }
function calcBackspace(){ calcExpr=calcExpr.slice(0,-1); calcRenderDisplay(); }
function calcEquals(){
const r=safeCalc(calcExpr);
if(!isNaN(r)&&isFinite(r)) calcExpr=String(Math.round(r*100)/100);
calcRenderDisplay();
}
function calcUseResult(){
if(!calcTargetId){ closeCalc(); return; }
let val=calcExpr;
if(/[+\-*/.]/.test(val)){
const r=safeCalc(val);
val=isNaN(r)?'':String(Math.round(r*100)/100);
}
const el=document.getElementById(calcTargetId);
if(el&&val!==''){
el.value=val;
el.dispatchEvent(new Event('input',{bubbles:true}));
}
closeCalc();
}

// scan-ocr.js — Scan struk belanja (OCR): struk belanja, bukti transfer, tanggal dari foto, odometer, portofolio aset, kategori & sparepart otomatis dari struk
// Domain terakhir hasil pembedahan features-filter-scanstruk-ocr.js (v84-v87 sudah memindahkan Akun, lookup Kategori,
// Filter/Laporan, dan Form Transaksi+Cicilan ke file domain masing2 — lihat PEMISAHAN-FILE-ROADMAP.md). Sisa file lama
// ini murni scan OCR, jadi di v88 filenya di-rename jadi scan-ocr.js (isi tidak berubah, cuma nama file + komentar).
// PENTING: file ini HARUS dimuat sesuai urutan build.js (GROUP_A/GROUP_B) karena beberapa modul saling referensi. Urutan grup ini: data-default.js, features-helpers-global-security.js, diagnostik-versi.js, format-tema.js, error-handler.js, helper-teks.js, keamanan-pin.js, modal-navigasi.js, reset-gaji-mingguan.js, debug-console.js, pengaturan-search.js, onboarding.js, kalkulator-input.js, scan-ocr.js, filter-laporan.js, akun.js, gaji-calc.js, transaksi.js, profil-pengaturan.js, kategori.js, tagihan-kalender.js, backup-restore.js, payroll-absensi.js, features-tukang-kendaraan-storage.js, features-aiwidget-reminder-gdrive-search.js, features-sheets-pwa-selftest.js

let _ocrWorkerPromise=null;
function getOcrWorker(){
if(!_ocrWorkerPromise){
_ocrWorkerPromise=ensureTesseract().then(()=>Tesseract.createWorker('eng')).catch(err=>{
console.error('[OCR] gagal membuat worker Tesseract:',err);
_ocrWorkerPromise=null;
throw err;
});
}
return _ocrWorkerPromise;
}
async function resetOcrWorker(){
const old=_ocrWorkerPromise;
_ocrWorkerPromise=null;
if(old){
try{const w=await old; if(w&&typeof w.terminate==='function')await w.terminate();}catch(e){ }
}
}
function withTimeout(promise,ms,label){
return Promise.race([
promise,
new Promise((_,reject)=>setTimeout(()=>reject(new Error('TIMEOUT:'+label)),ms))
]);
}
function scanErrorMessage(err){
console.error('[OCR] gagal scan:',err);
const raw=(err&&err.message)||(err&&err.error&&err.error.message)||(typeof err==='string'?err:'');
if(raw&&raw.startsWith('TIMEOUT:'))return 'koneksi lambat/putus saat mengunduh modul OCR — cek internet & coba lagi (hindari download lain bareng)';
if(raw&&/fetch|network|load/i.test(raw))return 'gagal mengunduh modul OCR, cek koneksi internet & coba lagi';
if(raw&&/SetImageFile|SetImage|null/i.test(raw))return 'modul OCR sempat gagal muat sempurna, sudah dicoba ulang otomatis tapi masih gagal — coba scan sekali lagi';
if(raw)return raw;
return 'error tidak diketahui — cek koneksi internet, lalu coba lagi (kalau masih gagal, coba tutup & buka lagi aplikasinya)';
}
function downscaleImage(file,maxWidth){
return new Promise((resolve)=>{
try{
const img=new Image();
const url=URL.createObjectURL(file);
img.onload=()=>{
URL.revokeObjectURL(url);
const scale=Math.min(1,maxWidth/img.width);
if(scale>=1){resolve(file);return;}
const canvas=document.createElement('canvas');
canvas.width=Math.round(img.width*scale);
canvas.height=Math.round(img.height*scale);
const ctx=canvas.getContext('2d');
ctx.drawImage(img,0,0,canvas.width,canvas.height);
canvas.toBlob((blob)=>{resolve(blob||file);},'image/jpeg',0.85);
};
img.onerror=()=>{URL.revokeObjectURL(url);resolve(file);};
img.src=url;
}catch(err){resolve(file);}
});
}
async function ocrRecognize(file){
const scaled=await downscaleImage(file,1600);
try{
const worker=await withTimeout(getOcrWorker(),45000,'worker-init');
return await withTimeout(worker.recognize(scaled),30000,'recognize');
}catch(err){
if(err&&err.message&&err.message.startsWith('TIMEOUT:'))throw err;
console.warn('[OCR] worker tampak bermasalah, mencoba bikin ulang & scan sekali lagi:',err);
await resetOcrWorker();
const worker2=await withTimeout(getOcrWorker(),45000,'worker-init-retry');
return withTimeout(worker2.recognize(scaled),30000,'recognize-retry');
}
}
const _bulanIndoMap={jan:1,januari:1,feb:2,februari:2,mar:3,maret:3,apr:4,april:4,mei:5,jun:6,juni:6,jul:7,juli:7,agu:8,agt:8,agustus:8,sep:9,sept:9,september:9,okt:10,oktober:10,nov:11,november:11,des:12,desember:12};
function extractDateFromText(text){
const numMatch=text.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
if(numMatch){
let[,d,m,y]=numMatch;if(y.length===2)y='20'+y;
const iso=`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
if(!isNaN(new Date(iso).getTime()))return iso;
}
const bulanRegex=new RegExp('(\\d{1,2})\\s+([A-Za-z]{3,10})\\s+(\\d{4})','i');
const textMatch=text.match(bulanRegex);
if(textMatch){
const[,d,bulanRaw,y]=textMatch;
const bulan=_bulanIndoMap[bulanRaw.toLowerCase()];
if(bulan){
const iso=`${y}-${String(bulan).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
if(!isNaN(new Date(iso).getTime()))return iso;
}
}
return null;
}
function scanReceipt(amtId,dateId,noteId){
const inp=document.createElement('input');
inp.type='file'; inp.accept='image/*'; inp.capture='environment';
inp.onchange=async(e)=>{
const file=e.target.files[0]; if(!file)return;
toast('🔍 Memindai gambar, mohon tunggu...',6000);
try{
if(typeof Tesseract==='undefined'){toast('⚠️ Modul scan gagal dimuat (cek koneksi internet)');return;}
const result=await ocrRecognize(file);
const text=result&&result.data?result.data.text:'';
const rawNums=text.match(/\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{1,2})?|\d{4,}/g)||[];
const nums=rawNums.map(s=>parseFloat(s.replace(/[.,](?=\d{3}(\D|$))/g,'').replace(',','.'))).filter(n=>n>=500&&n<500000000);
if(nums.length&&amtId){const amt=Math.round(Math.max(...nums));const el=document.getElementById(amtId);if(el){el.value=amt;if(el.oninput)el.oninput();}}
if(dateId){
const iso=extractDateFromText(text);
if(iso){const el=document.getElementById(dateId);if(el)el.value=iso;}
}
const firstLine=text.split('\n').map(l=>l.trim()).find(l=>l.length>3&&!/^\d+$/.test(l));
if(firstLine){const el=document.getElementById(noteId);if(el)el.value=firstLine.slice(0,60);}
toast(nums.length?'✅ Scan selesai, cek & koreksi hasilnya':'⚠️ Nominal tidak terbaca, isi manual ya');
}catch(err){
toast('❌ Gagal scan: '+scanErrorMessage(err));
}
};
inp.click();
}
function guessTransferNameFromText(text){
const lines=text.split('\n').map(l=>l.trim()).filter(Boolean);
const kw=/(kepada|penerima|nama\s*penerima|tujuan|a\.?n\.?|acc(?:ount)?\s*name|beneficiary|received?\s*by)/i;
for(let i=0;i<lines.length;i++){
if(kw.test(lines[i])){
const m=lines[i].match(/(?:kepada|penerima|nama\s*penerima|tujuan|a\.?n\.?|acc(?:ount)?\s*name|beneficiary|received?\s*by)\s*[:\-]?\s*(.+)/i);
if(m&&m[1]&&m[1].trim().length>2&&!/^\d+$/.test(m[1].trim()))return m[1].trim().slice(0,40);
const next=lines[i+1];
if(next&&next.length>2&&!/^\d+$/.test(next))return next.slice(0,40);
}
}
return null;
}
function scanBuktiTransfer(nameId,amtId,dateId){
const inp=document.createElement('input');
inp.type='file'; inp.accept='image/*'; inp.capture='environment';
inp.onchange=async(e)=>{
const file=e.target.files[0]; if(!file)return;
toast('🔍 Memindai bukti transfer, mohon tunggu...',6000);
try{
if(typeof Tesseract==='undefined'){toast('⚠️ Modul scan gagal dimuat (cek koneksi internet)');return;}
const result=await ocrRecognize(file);
const text=result&&result.data?result.data.text:'';
const rawNums=text.match(/\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{1,2})?|\d{4,}/g)||[];
const nums=rawNums.map(s=>parseFloat(s.replace(/[.,](?=\d{3}(\D|$))/g,'').replace(',','.'))).filter(n=>n>=1000&&n<500000000);
if(nums.length&&amtId){const amt=Math.round(Math.max(...nums));const el=document.getElementById(amtId);if(el){el.value=amt;if(el.oninput)el.oninput();}}
if(dateId){
const iso=extractDateFromText(text);
if(iso){const el=document.getElementById(dateId);if(el)el.value=iso;}
}
const name=guessTransferNameFromText(text);
if(name){const el=document.getElementById(nameId);if(el)el.value=name;}
toast(nums.length?'✅ Scan selesai, cek & koreksi hasilnya (nama otomatis kadang meleset, tetap dicek ya)':'⚠️ Nominal tidak terbaca, isi manual ya');
}catch(err){
toast('❌ Gagal scan: '+scanErrorMessage(err));
}
};
inp.click();
}
function scanTanggalDariFoto(dateId){
const inp=document.createElement('input');
inp.type='file'; inp.accept='image/*'; inp.capture='environment';
inp.onchange=async(e)=>{
const file=e.target.files[0]; if(!file)return;
toast('🔍 Memindai foto, mohon tunggu...',6000);
try{
if(typeof Tesseract==='undefined'){toast('⚠️ Modul scan gagal dimuat (cek koneksi internet)');return;}
const result=await ocrRecognize(file);
const text=result&&result.data?result.data.text:'';
const iso=extractDateFromText(text);
if(iso){
const el=document.getElementById(dateId);
if(el){el.value=iso;if(el.oninput)el.oninput();}
toast('✅ Tanggal terbaca: '+iso+' — cek dulu sebelum simpan');
}else{
toast('⚠️ Tanggal tidak terbaca, isi manual ya');
}
}catch(err){
toast('❌ Gagal scan: '+scanErrorMessage(err));
}
};
inp.click();
}
function scanKmOdometer(){
const inp=document.createElement('input');
inp.type='file'; inp.accept='image/*'; inp.capture='environment';
inp.onchange=async(e)=>{
const file=e.target.files[0]; if(!file)return;
toast('🔍 Memindai foto odometer, mohon tunggu...',6000);
try{
if(typeof Tesseract==='undefined'){toast('⚠️ Modul scan gagal dimuat (cek koneksi internet)');return;}
const result=await ocrRecognize(file);
const text=result&&result.data?result.data.text:'';
const km=extractOdometerKm(text);
if(km!=null){
const el=document.getElementById('kmVal');
if(el){el.value=km;if(el.oninput)el.oninput();}
toast('✅ Terbaca '+km.toLocaleString('id-ID')+' km — cek dulu sebelum simpan, angka spidometer digital kadang ke-OCR salah');
} else {
toast('⚠️ Angka odometer tidak terbaca jelas, isi manual ya');
}
}catch(err){
toast('❌ Gagal scan: '+scanErrorMessage(err));
}
};
inp.click();
}
function extractOdometerKm(text){
const lines=String(text).split('\n');
for(let i=0;i<lines.length;i++){
if(!/\bkm\b/i.test(lines[i]))continue;
for(const cl of [lines[i],lines[i-1]||'',lines[i+1]||'']){
const m=cl.match(/\d{2,6}(?:[.,]\d{1,2})?/);
if(m){
const n=Math.round(parseFloat(m[0].replace(',','.')));
if(n>=1&&n<999999)return n;
}
}
}
const allNums=(String(text).match(/\d{3,6}(?:[.,]\d{1,2})?/g)||[]).map(s=>parseFloat(s.replace(',','.')));
if(allNums.length)return Math.round(Math.max(...allNums));
return null;
}
function extractLabeledAmount(text,labelRegex){
const lines=text.split('\n');
for(let i=0;i<lines.length;i++){
if(!labelRegex.test(lines[i]))continue;
for(const cl of [lines[i],lines[i+1]||'']){
const matches=cl.match(/\d[\d.,]*/g);
if(!matches)continue;
for(const raw of matches){
if(raw.replace(/[.,]/g,'').length>=2){
const n=normalizeOcrNumber(raw);
if(!isNaN(n))return n;
}
}
}
}
return null;
}
function extractPortfolioFields(text){
return{
nilai:extractLabeledAmount(text,PORTFOLIO_LABELS.nilai),
modal:extractLabeledAmount(text,PORTFOLIO_LABELS.modal),
hargaBeli:extractLabeledAmount(text,PORTFOLIO_LABELS.hargaBeli),
jumlahUnit:extractLabeledAmount(text,PORTFOLIO_LABELS.jumlahUnit)
};
}
function extractBitgetFields(text){
const nilaiM=text.match(/[≈=]\s*([\d][\d.,]*)\s*idr/i);
const qtyM=text.match(/total\s*aset[\s\S]{0,15}?(\d+\.\d+)/i);
const impasM=text.match(/([\d][\d.,]*)\s*usdt/i);
return{
nilai:nilaiM?normalizeOcrNumber(nilaiM[1]):null,
jumlahUnit:qtyM?normalizeOcrNumber(qtyM[1]):null,
hargaImpasUsdt:impasM?normalizeOcrNumber(impasM[1]):null
};
}
const ASSET_JENIS_KEYWORDS=[
[/bitcoin|ethereum|\bbtc\b|\beth\b|usdt|kripto|crypto|binance|indodax|bitget|tokocrypto|pintu\b/i,'Kripto'],
[/reksa\s*dana|rdpu|rdps|rdpt|reksadana|nab\b|bibit\b|bareksa|pasar\s*uang|reksa\s*dana\s*pasar\s*uang/i,'Reksadana'],
[/\bsaham\b|\blot\b|ihsg|emiten|bursa\s*efek|stockbit|ajaib\b/i,'Saham'],
[/emas|gold\b|logam\s*mulia|antam|pegadaian\s*emas/i,'Emas/Logam Mulia'],
[/deposito|time\s*deposit|obligasi|\bsbn\b|sukuk/i,'Deposito/Investasi'],
[/kendaraan|motor\b|mobil\b|bpkb|plat\s*nomor|stnk/i,'Kendaraan'],
[/rumah|bangunan|kpr\b|ruko\b|apartemen/i,'Rumah/Bangunan'],
[/tanah|kavling|sertifikat|\bshm\b|\bshgb\b/i,'Tanah']
];
function guessAssetJenisFromText(text){
for(const[re,jenis]of ASSET_JENIS_KEYWORDS){
if(re.test(text))return jenis;
}
return null;
}
function guessCryptoSymbolFromText(text){
const m=text.match(/\b([A-Z]{2,10})\s*\/\s*(USDT|USDC|BUSD|IDR|BTC|ETH)\b/);
return m?m[1]:null;
}
const ASSET_NAME_LABEL_RE=/nama\s*(produk|reksa\s*dana|instrumen|aset|saham|koin|barang)?\s*[:\-]?/i;
const ASSET_NAME_EXCLUDE_RE=/^(rp|total|nilai|profit|untung|rugi|modal|harga|jumlah|detail|kembali|beli|jual|topup|top up|edit|invest|portofolio|riwayat|transaksi|saldo|dompet|wallet|home|beranda|profil|pengaturan|cari|search|filter|urutkan|semua|lainnya|pasar uang|reksa dana|saham|deposito|obligasi|kripto|nilai portofolio|nilai sekarang|imbal hasil|keuntungan)$/i;
const STATUS_BAR_LINE_RE=/^\d{1,2}[:.]\d{2}\b/;
function guessAssetNameFromText(text){
const lines=String(text).split('\n').map(l=>l.trim()).filter(Boolean).filter(l=>!STATUS_BAR_LINE_RE.test(l));
for(let i=0;i<lines.length;i++){
if(!ASSET_NAME_LABEL_RE.test(lines[i]))continue;
const afterLabel=lines[i].replace(ASSET_NAME_LABEL_RE,'').trim();
const candidate=(afterLabel.length>2?afterLabel:lines[i+1])||'';
if(candidate.length>2&&/[a-zA-Z]{3,}/.test(candidate))return candidate.slice(0,60);
}
for(const l of lines.slice(0,8)){
if(l.length<=2||l.length>60)continue;
if(!/[a-zA-Z]{3,}/.test(l))continue;
const clean=l.replace(/[^a-zA-Z0-9\s]/g,'').trim();
if(ASSET_NAME_EXCLUDE_RE.test(clean))continue;
if(/rp|total|nilai|profit|untung|rugi|modal|harga|jumlah/i.test(l))continue;
return l.slice(0,60);
}
return null;
}
function scanAssetPortfolio(){
const inp=document.createElement('input');
inp.type='file'; inp.accept='image/*';
inp.onchange=async(e)=>{
const file=e.target.files[0]; if(!file)return;
const box=document.getElementById('assetScanCandidates');
if(box){box.style.display='block';box.innerHTML='🔍 Memindai gambar, mohon tunggu...';}
toast('🔍 Memindai gambar, mohon tunggu...',6000);
try{
if(typeof Tesseract==='undefined'){toast('⚠️ Modul scan gagal dimuat (cek koneksi internet)');if(box){box.style.display='none';box.innerHTML='';}return;}
const result=await ocrRecognize(file);
const text=result&&result.data?result.data.text:'';
const filledMeta=[];
const guessedJenis=guessAssetJenisFromText(text);
const jenisEl=document.getElementById('assetJenis');
if(guessedJenis&&jenisEl){jenisEl.value=guessedJenis;filledMeta.push('Jenis ('+guessedJenis+')');}
const guessedName=(guessedJenis==='Kripto'?guessCryptoSymbolFromText(text):null)||guessAssetNameFromText(text);
const nameEl=document.getElementById('assetName');
if(guessedName&&nameEl&&!nameEl.value.trim()){nameEl.value=guessedName;filledMeta.push('Nama Aset');}
const fields=extractPortfolioFields(text);
const filled=[...filledMeta];
if(fields.modal!=null){document.getElementById('assetModalInvestasi').value=Math.round(fields.modal);filled.push('Modal Investasi');}
if(fields.hargaBeli!=null){document.getElementById('assetHargaBeli').value=fields.hargaBeli;filled.push('Harga Beli');}
if(fields.jumlahUnit!=null){document.getElementById('assetJumlahUnit').value=fields.jumlahUnit;filled.push('Jumlah Unit');}
if(fields.nilai!=null){
document.getElementById('assetNilai').value=Math.round(fields.nilai);
updateAmtPreview('assetNilai','assetNilaiPreview');
filled.unshift('Nilai Saat Ini');
Aset.updateProfitPreview();
if(box){box.style.display='none';box.innerHTML='';}
toast('✅ Scan selesai — '+filled.join(', ')+' terisi otomatis, cek lagi sebelum simpan');
return;
}
const bg=extractBitgetFields(text);
if(bg.nilai!=null){
document.getElementById('assetNilai').value=Math.round(bg.nilai);
updateAmtPreview('assetNilai','assetNilaiPreview');
filled.unshift('Nilai Saat Ini');
if(bg.jumlahUnit!=null){document.getElementById('assetJumlahUnit').value=bg.jumlahUnit;filled.push('Jumlah Unit');}
Aset.updateProfitPreview();
if(box){
box.style.display='block';
box.innerHTML='<div class="u-fs12 u-cacc3 u-mb6">✅ '+filled.join(', ')+' terisi otomatis dari format Bitget.</div>'+
(bg.hargaImpasUsdt!=null?'<div class="u-fs11 u-t2 u-lh15">ℹ️ Terbaca juga "Harga impas" '+Number(bg.hargaImpasUsdt).toLocaleString('id-ID')+' USDT -- ini <b>harga breakeven dalam USDT</b>, bukan Rupiah, jadi TIDAK diisi otomatis ke Harga Beli/Unit (biar tidak salah satuan). Kalau mau dipakai, konversi dulu ke Rupiah lalu isi manual.</div>':'')+
'<div class="u-fs11 u-t2 u-mt6 u-lh15">ℹ️ "PnL hari ini" (kalau ada di screenshot) itu untung/rugi HARI INI saja, bukan total sejak beli, jadi sengaja tidak dipakai untuk Modal Investasi/Keuntungan di sini. Isi Modal Investasi manual kalau kamu tahu total dana yang sudah disetor.</div>';
}
toast('✅ Scan selesai — '+filled.join(', ')+' terisi otomatis, cek lagi sebelum simpan');
return;
}
Aset.updateProfitPreview();
const rawNums=text.match(/\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{1,2})?|\d{4,}/g)||[];
let nums=rawNums.map(s=>parseFloat(s.replace(/[.,](?=\d{3}(\D|$))/g,'').replace(',','.'))).filter(n=>n>=1000&&n<100000000000);
nums=[...new Set(nums.map(n=>Math.round(n)))].sort((a,b)=>b-a).slice(0,6);
if(!box)return;
if(!nums.length){
box.innerHTML='⚠️ Tidak ada nominal yang terbaca. Isi manual ya.';
toast(filled.length?'✅ '+filled.join(', ')+' terisi, tapi Nilai Saat Ini tidak terbaca — isi manual ya':'⚠️ Nominal tidak terbaca, isi manual ya');
return;
}
box.innerHTML='<div class="u-fs12 u-fw600 u-mb6">Pilih angka yang sesuai "Nilai Saat Ini":</div>'+
nums.map(n=>`<button type="button" class="chip-btn" style="margin:0 6px 6px 0" data-action="pickAssetScanCandidate" data-args="${escapeHtml(JSON.stringify([n]))}">${fmtFull(n)}</button>`).join('')+
'<div class="u-fs11 u-t2 u-mt4">Kalau tidak ada yang cocok, isi manual di bawah.</div>';
toast(filled.length?'✅ '+filled.join(', ')+' terisi — pilih juga angka Nilai Saat Ini':'✅ Scan selesai, pilih angka yang benar');
}catch(err){
toast('❌ Gagal scan: '+scanErrorMessage(err));
if(box){box.style.display='none';box.innerHTML='';}
}
};
inp.click();
}
function pickAssetScanCandidate(n){
const el=document.getElementById('assetNilai');
if(el){el.value=n;if(el.oninput)el.oninput();}
const box=document.getElementById('assetScanCandidates');
if(box){box.style.display='none';box.innerHTML='';}
toast('✅ Nilai diisi: '+fmtFull(n));
}
function quickScanAsset(id){
const a=(D.assets||[]).find(x=>sameId(x.id,id));
if(!a){toast('⚠️ Aset tidak ditemukan');return;}
const inp=document.createElement('input');
inp.type='file'; inp.accept='image/*';
inp.onchange=async(e)=>{
const file=e.target.files[0]; if(!file)return;
toast('🔍 Memindai gambar, mohon tunggu...',6000);
try{
if(typeof Tesseract==='undefined'){toast('⚠️ Modul scan gagal dimuat (cek koneksi internet)');return;}
const result=await ocrRecognize(file);
const text=result&&result.data?result.data.text:'';
const rawNums=text.match(/\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{1,2})?|\d{4,}/g)||[];
let nums=rawNums.map(s=>parseFloat(s.replace(/[.,](?=\d{3}(\D|$))/g,'').replace(',','.'))).filter(n=>n>=1000&&n<100000000000);
nums=[...new Set(nums.map(n=>Math.round(n)))].sort((a,b)=>b-a).slice(0,6);
if(!nums.length){toast('⚠️ Nominal tidak terbaca, isi manual lewat Edit Aset ya');return;}
showQuickScanPicker(id,nums);
}catch(err){
toast('❌ Gagal scan: '+scanErrorMessage(err));
}
};
inp.click();
}
function showQuickScanPicker(id,nums){
const a=(D.assets||[]).find(x=>sameId(x.id,id));
if(!a)return;
document.getElementById('quickScanAssetName').textContent=a.name;
const body=document.getElementById('quickScanBody');
body.innerHTML='<div class="u-fs12 u-t2 u-mb6">Nilai lama: '+fmtFull(a.nilai||0)+'</div>'+
'<div class="u-fs12 u-fw600 u-mb8">Pilih angka baru yang sesuai:</div>'+
nums.map(n=>`<button type="button" class="chip-btn" style="margin:0 6px 8px 0" data-action="applyQuickScan" data-args="${escapeHtml(JSON.stringify([id, n]))}">${fmtFull(n)}</button>`).join('')+
'<div class="u-fs11 u-t2 u-mt6">Kalau tidak ada yang cocok, batalkan lalu isi manual lewat Edit Aset.</div>';
openModal('quickScanModal');
}
function applyQuickScan(id,n){
const a=(D.assets||[]).find(x=>sameId(x.id,id));
if(!a)return;
a.nilai=n;
save();
closeModal('quickScanModal');
Aset.renderList();renderKekayaanBersih();hitungZakatMaal();
toast('✅ '+escapeHtml(a.name)+' diupdate ke '+fmtFull(n));
}
function scanReceiptBelanja(){
const inp=document.createElement('input');
inp.type='file'; inp.accept='image/*'; inp.capture='environment';
const insightEl=document.getElementById('txScanInsight');
if(insightEl){insightEl.style.display='none';insightEl.innerHTML='';}
inp.onchange=async(e)=>{
const file=e.target.files[0]; if(!file)return;
toast('🔍 Memindai struk, mohon tunggu...',6000);
try{
if(typeof Tesseract==='undefined'){toast('⚠️ Modul scan gagal dimuat (cek koneksi internet)');return;}
const result=await ocrRecognize(file);
const text=result&&result.data?result.data.text:'';
const rawNums=text.match(/\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{1,2})?|\d{4,}/g)||[];
const nums=rawNums.map(s=>parseFloat(s.replace(/[.,](?=\d{3}(\D|$))/g,'').replace(',','.'))).filter(n=>n>=500&&n<500000000);
let amt=0;
if(nums.length){amt=Math.round(Math.max(...nums));const el=document.getElementById('txAmt');if(el){el.value=amt;if(el.oninput)el.oninput();}}
const dm=text.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
if(dm){let[,d,m,y]=dm;if(y.length===2)y='20'+y;const iso=`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;if(!isNaN(new Date(iso).getTime())){const el=document.getElementById('txDate');if(el)el.value=iso;}}
const firstLine=text.split('\n').map(l=>l.trim()).find(l=>l.length>3&&!/^\d+$/.test(l));
if(firstLine){const el=document.getElementById('txNote');if(el)el.value=firstLine.slice(0,60);}
const guessedCat=guessCategoryFromReceiptText(text);
const catField=document.getElementById('txCat');
if(guessedCat&&catField&&!catField.value.trim()){
selectTxCat(guessedCat.name);
}
_txCatLearnSource=(firstLine||text).slice(0,120);
const catNameForInsight=(catField&&catField.value.trim())||(guessedCat?guessedCat.name:'');
renderReceiptInsight(amt,catNameForInsight,guessedCat);
const stockPanelEl=document.getElementById('txStockPanel');
if(stockPanelEl&&stockPanelEl.style.display!=='none'){
const guessedPart=guessSparepartFromReceiptText(text);
if(guessedPart){
const chk=document.getElementById('txAddStock');
if(chk&&!chk.checked){chk.checked=true;toggleTxStockFields();}
const existing=D.partsStock.find(p=>p.name.toLowerCase().includes(guessedPart.name.toLowerCase())||guessedPart.name.toLowerCase().includes(p.name.toLowerCase()));
const sel=document.getElementById('txStockItem');
if(sel){sel.value=existing?existing.id:'__new__';onTxStockItemChange();}
if(!existing){const nameEl=document.getElementById('txStockNewName');if(nameEl)nameEl.value=guessedPart.name;}
const qtyEl=document.getElementById('txStockQty');if(qtyEl)qtyEl.value=guessedPart.qty;
const unitEl=document.getElementById('txStockUnit');if(unitEl)unitEl.value=guessedPart.unit;
toast('✅ Scan selesai — tebakan sparepart & jumlah otomatis terisi, cek & koreksi kalau meleset');
} else {
toast(nums.length?'✅ Scan selesai, cek & koreksi hasilnya. Nama sparepart tidak terbaca jelas, isi manual ya':'⚠️ Nominal tidak terbaca, isi manual ya');
}
} else {
toast(nums.length?'✅ Scan selesai, cek & koreksi hasilnya':'⚠️ Nominal tidak terbaca, isi manual ya');
}
}catch(err){
toast('❌ Gagal scan: '+scanErrorMessage(err));
}
};
inp.click();
}
function guessCategoryFromReceiptText(text){
const lower=String(text).toLowerCase();
if(D.learnedItemCat){
for(const key in D.learnedItemCat){
if(key&&lower.includes(key)){
const catName=D.learnedItemCat[key];
const cat=D.categories.expense.find(c=>c.name===catName);
if(cat)return cat;
}
}
}
for(const[re]of CAT_EMOJI_GUESS){
if(re.test(lower)){
const cat=D.categories.expense.find(c=>re.test(c.name));
if(cat)return cat;
}
}
if(/indomaret|alfamart|alfamidi|superindo|hypermart|carrefour|hero|lottemart|transmart/i.test(lower)){
const cat=D.categories.expense.find(c=>/belanja|dapur|sabun/i.test(c.name));
if(cat)return cat;
}
return null;
}
function catLearnKey(name){
const words=String(name).toLowerCase().replace(/[^a-z0-9\s]/g,' ').split(/\s+/).filter(w=>w.length>=4&&!/^\d+$/.test(w));
return words[0]||null;
}
function learnCatFromItemName(name,catName){
if(!name||!catName)return;
const key=catLearnKey(name);
if(!key)return;
if(!D.learnedItemCat)D.learnedItemCat={};
D.learnedItemCat[key]=catName;
}
function rememberLastAccForCat(catName,accId){
if(!catName||!accId)return;
if(!D.lastAccByCategory)D.lastAccByCategory={};
D.lastAccByCategory[catName]=accId;
}
function findPossibleDuplicateTx(amt,date,note,type){
const noteNorm=String(note||'').trim().toLowerCase();
return D.transactions.find(t=>{
if(t.id===txEditId)return false;
if(t.type!==type)return false;
if(Math.abs(t.amount-amt)>0.5)return false;
if(t.date!==date)return false;
const tNoteNorm=String(t.note||'').trim().toLowerCase();
if(!noteNorm&&!tNoteNorm)return true;
if(!noteNorm||!tNoteNorm)return false;
return tNoteNorm.includes(noteNorm)||noteNorm.includes(tNoteNorm);
});
}
const SPAREPART_LINE_KEYWORDS=/oli|olie|kampas|rem|busi|aki|accu|ban\b|tubeless|filter|saring|rantai|gear|sprocket|lampu|bohlam|kabel|bearing|klaher|shock\s*breaker|shockbreaker|per\s*shock|radiator|coolant|timing\s*belt|fanbelt|v-?belt|wiper|piston|ring\s*piston|gasket|packing|seal|bearing|karet|roller|cvt|v-?matic|selang|master\s*rem|kanvas|platina|karburator|injektor|throttle|sensor|dinamo|starter|spul|kiprok|cdi|koil/i;
function guessSparepartFromReceiptText(text){
const lines=String(text).split('\n').map(l=>l.trim()).filter(Boolean);
for(const line of lines){
if(!SPAREPART_LINE_KEYWORDS.test(line))continue;
if(/^(jl\.|jalan|telp|npwp|kasir|struk|nota|invoice)/i.test(line))continue;
let qty=1,unit='pcs';
const qtyM=line.match(/\bx\s*(\d{1,3})\b/i)||line.match(/\b(\d{1,3})\s*x\b/i)||line.match(/\b(\d{1,3})\s*(pcs|buah|unit|set|liter|ltr|botol)\b/i);
if(qtyM){
qty=parseInt(qtyM[1],10)||1;
if(qtyM[2]&&/liter|ltr/i.test(qtyM[2]))unit='liter';
else if(qtyM[2]&&/set/i.test(qtyM[2]))unit='set';
else if(qtyM[2]&&/botol/i.test(qtyM[2]))unit='botol';
}
let name=line
.replace(/\bx\s*\d{1,3}\b/gi,'')
.replace(/\b\d{1,3}\s*(pcs|buah|unit|set|liter|ltr|botol)\b/gi,'')
.replace(/rp\.?\s*[\d.,]+/gi,'')
.replace(/[\d.,]{4,}/g,'')
.replace(/\s{2,}/g,' ')
.replace(/[-–—:|]+$/,'')
.trim();
if(name.length<3)name=line.trim();
if(name.length>50)name=name.slice(0,50).trim();
return{name,qty,unit};
}
return null;
}
/* moved to modules-render.js: renderReceiptInsight */

// --- Deteksi item checkout dari screenshot belanja (Worth-It) ---
// Digabung dari backup-restore.js (v89) — domainnya OCR juga,
// cuma dulu kepisah gara-gara ikut nomor batch lama. Dipakai WorthIt.scanCheckout()/scanCheckoutList()
// di worthit.js lewat scanWorthItCheckout(mode). Bergantung ke ocrRecognize()/scanErrorMessage()
// (sudah di file yang sama sekarang) & WorthIt.* (worthit.js, diakses lewat variabel global saat runtime).
const CHECKOUT_UI_EXCLUDE_RE=/checkout|keranjang|alamat|pengiriman|^toko\b|kargo|estimasi|\btiba\b|gratis|pengembalian|proteksi|rusak\s*total|asuransi|kasih\s*catatan|tambah\s*catatan|belanjaanmu|hemat\s*rp|dapat\s*bonus|tagihan|bayar\s*sekarang|^stok|^sisa|^plus\b|pembayaran|voucher|kupon|rincian|subtotal|admin|lihat\s*semua|beli\s*sekalian|rating\s*tinggi|terjadi\s*kesalahan|coba\s*lagi/i;
const CHECKOUT_ADDR_RE=/\bjl\.?\b|\balamat\b|\bkecamatan\b|\bkelurahan\b|\bkabupaten\b/i;
const CHECKOUT_RATING_PREFIX_RE=/^\d{1,2}[.,]\d\s+(?=[A-Za-z])/;
function guessCheckoutItemName(text){
const lines=String(text).split('\n').map(l=>l.trim()).filter(Boolean);
let priceIdx=lines.findIndex(l=>/rp\s?\d/i.test(l));
const searchLines=priceIdx>=0?lines.slice(Math.max(0,priceIdx-5),priceIdx):lines;
let best=null;
for(const raw of searchLines){
const l=raw.replace(CHECKOUT_RATING_PREFIX_RE,'');
if(l.length<8||l.length>110)continue;
if(/^rp\b/i.test(l)||/^\d/.test(l))continue;
if(CHECKOUT_ADDR_RE.test(l)||CHECKOUT_UI_EXCLUDE_RE.test(l))continue;
const letters=(l.match(/[a-zA-Z]/g)||[]).length;
if(letters<8)continue;
best=l;
}
if(best)return best.slice(0,80);
for(const raw of lines){
const l=raw.replace(CHECKOUT_RATING_PREFIX_RE,'');
if(l.length<8||l.length>90)continue;
if(/^rp\b/i.test(l)||/^\d/.test(l))continue;
if(CHECKOUT_ADDR_RE.test(l)||CHECKOUT_UI_EXCLUDE_RE.test(l))continue;
const letters=(l.match(/[a-zA-Z]/g)||[]).length;
if(letters>=8)return l.slice(0,80);
}
return null;
}
const CHECKOUT_PRICE_CUT_RE=/beli\s*sekalian|opsi\s*pengiriman|metode\s*pembayaran|rincian\s*pembayaran|produk\s*lain|rekomendasi\s*untuk/i;
function guessCheckoutPrices(text){
const full=String(text);
const cutIdx=full.search(CHECKOUT_PRICE_CUT_RE);
const scoped=cutIdx>=0?full.slice(0,cutIdx):full;
const rpMatches=[...scoped.matchAll(/rp\s?([\d][\d.,]*)/gi)].map(m=>normalizeOcrNumber(m[1])).filter(n=>!isNaN(n)&&n>=500);
const pctMatch=scoped.match(/(\d{1,2})\s?%/);
const diskonPct=pctMatch?parseInt(pctMatch[1],10):null;
for(let i=0;i<rpMatches.length-1;i++){
const x=rpMatches[i],y=rpMatches[i+1];
const a=Math.max(x,y),b=Math.min(x,y);
if(a!==b && b>=a*0.3 && b<=a*0.97){
return{hargaNormal:Math.round(a),harga:Math.round(b),diskonPct};
}
}
return{hargaNormal:null,harga:rpMatches.length?Math.round(Math.max(...rpMatches)):null,diskonPct:null};
}
const WORTHIT_KEBUTUHAN_KEYWORDS=/\bban\b|kampas|\brem\b|\boli\b|busi|\baki\b|sparepart|onderdil|obat|vitamin|susu|popok|beras|sembako|sekolah|buku\s*pelajaran|seragam|listrik|air\s*pdam|bpjs|\btoken\b|pulsa|paket\s*data|masker|sabun|deterjen/i;
function guessWorthItCategory(text){
return WORTHIT_KEBUTUHAN_KEYWORDS.test(String(text).toLowerCase())?'kebutuhan':'keinginan';
}
// Total FINAL yang bakal kepotong/dibayar (sudah termasuk ongkir, asuransi,
// semua diskon promo, dikurangi bonus cashback) — beda dari harga produk
// doang yang ditangkap guessCheckoutPrices(). Kalau ada, ini yang lebih
// tepat buat field "Harga (yang akan dibayar)".
// Istilah beda-beda tiap marketplace, jadi dicek beberapa varian:
//   - Tokopedia: "Total Tagihan"
//   - Shopee/Lazada/TikTok Shop: "Total Pembayaran"
//   - Blibli & lainnya: "Total Bayar" / "Total yang Harus Dibayar"
// Fallback ke "Grand Total" kalau semua varian di atas nggak ketemu.
// Ambil kemunculan TERAKHIR karena biasanya baris ini muncul 2x (ringkasan
// & footer sebelum tombol Bayar) — yang terakhir paling dekat ke tombol
// bayar, jadi paling representatif.
const CHECKOUT_TOTAL_RE=/total\s*(?:tagihan|pembayaran|bayar|(?:yang\s*)?harus\s*dibayar)\b[^\d\n]{0,25}rp\s?([\d][\d.,]*)/gi;
const CHECKOUT_TOTAL_FALLBACK_RE=/grand\s*total[^\d\n]{0,25}rp\s?([\d][\d.,]*)/gi;
function guessCheckoutTotalTagihan(text){
const full=String(text);
let matches=[...full.matchAll(CHECKOUT_TOTAL_RE)];
if(!matches.length)matches=[...full.matchAll(CHECKOUT_TOTAL_FALLBACK_RE)];
if(!matches.length)return null;
const n=normalizeOcrNumber(matches[matches.length-1][1]);
return isNaN(n)?null:Math.round(n);
}
// Cicilan/tenor: format beda-beda tiap marketplace/metode:
//   - Tokopedia (Tokopedia Card dll): "Cicil 12x Rp308.736"
//   - Shopee/Lazada (kartu kredit): "Cicilan 3 Bulan Rp1.533.000"
//   - Shopee SPayLater / Kredivo / Akulaku: "SPayLater Rp1.150.000 x 4"
//     (urutan kebalik: nominal dulu baru jumlah cicilan)
// Dicoba berurutan, dipakai pola pertama yang cocok. Ambang Rp>=10.000
// buat hindari salah tangkap baris "1 x Rp0" (qty produk/hadiah gratis).
const CICILAN_PATTERNS=[
{re:/cicil(?:an)?\s*(\d{1,2})\s*x\D{0,15}rp\s?([\d][\d.,]*)/i,tenorFirst:true}, // Tokopedia
{re:/cicil(?:an)?\b[^\d\n]{0,25}?(\d{1,2})\s*bulan\D{0,20}rp\s?([\d][\d.,]*)/i,tenorFirst:true}, // Shopee/Lazada (termasuk "Cicilan Kartu Kredit 12 Bulan")
{re:/(?:spaylater|paylater|akulaku|kredivo|indodana)\D{0,15}rp\s?([\d][\d.,]*)\s*x\s*(\d{1,2})\b/i,tenorFirst:false}, // paylater terbalik
{re:/rp\s?([\d][\d.,]*)\s*x\s*(\d{1,2})\s*bulan/i,tenorFirst:false} // generik "RpX x N Bulan"
];
function guessCheckoutCicilan(text){
const full=String(text);
for(const{re,tenorFirst}of CICILAN_PATTERNS){
const m=full.match(re);
if(!m)continue;
const tenor=parseInt(tenorFirst?m[1]:m[2],10);
const perBulan=normalizeOcrNumber(tenorFirst?m[2]:m[1]);
if(tenor&&tenor<=60&&!isNaN(perBulan)&&perBulan>=10000)return{tenor,perBulan:Math.round(perBulan)};
}
return null;
}
function scanWorthItCheckout(mode){
const inp=document.createElement('input');
inp.type='file'; inp.accept='image/*';
inp.onchange=async(e)=>{
const file=e.target.files[0]; if(!file)return;
toast('🔍 Memindai screenshot checkout, mohon tunggu...',6000);
try{
if(typeof Tesseract==='undefined'){toast('⚠️ Modul scan gagal dimuat (cek koneksi internet)');return;}
const result=await ocrRecognize(file);
const text=result&&result.data?result.data.text:'';
const name=guessCheckoutItemName(text);
const{hargaNormal,harga:hargaItem,diskonPct}=guessCheckoutPrices(text);
const totalTagihan=guessCheckoutTotalTagihan(text);
const cicilan=guessCheckoutCicilan(text);
// Kalau "Total Tagihan" ketemu, itu yang dipakai sebagai harga akhir
// (sudah termasuk ongkir/asuransi/diskon/cashback) — lebih akurat
// daripada harga produk doang, sesuai label field "Harga (yang akan
// dibayar)". Kalau tidak ketemu, tetap fallback ke harga produk seperti
// sebelumnya (mis. screenshot cuma halaman produk, bukan checkout).
const harga=totalTagihan||hargaItem;
const cat=guessWorthItCategory(text);
const map={
single:{name:'wiName',price:'wiPrice',chk:'wiIsDiskon',normal:'wiHargaNormal',cat:'wiCategory',toggle:()=>WorthIt.toggleDiskon(),sync:()=>WorthIt.syncDiskon()},
list:{name:'wlName',price:'wlPrice',chk:'wlIsDiskon',normal:'wlHargaNormal',cat:'wlCategory',toggle:()=>WorthIt.toggleDiskonList(),sync:()=>WorthIt.syncDiskonList()}
}[mode];
if(!map)return;
const filled=[];
if(name){document.getElementById(map.name).value=name;filled.push('Nama Barang');}
if(harga){document.getElementById(map.price).value=harga;filled.push(totalTagihan?'Harga (Total Tagihan)':'Harga');}
const catEl=document.getElementById(map.cat); if(catEl){catEl.value=cat;filled.push('Kategori (tebakan, cek lagi)');}
const chkEl=document.getElementById(map.chk);
if(hargaNormal){
if(chkEl)chkEl.checked=true;
map.toggle();
document.getElementById(map.normal).value=hargaNormal;
map.sync();
filled.push('Harga Normal'+(diskonPct?(' (≈'+diskonPct+'% diskon)'):''));
} else if(chkEl){
chkEl.checked=false;
map.toggle();
}
// Cicilan cuma ada di form mode "single" (wiMethod/wiTenor/wiCicilanBulan).
// Mode "list" tidak punya field ini, jadi dilewati kalau mode==='list'.
if(cicilan&&mode==='single'){
const methodEl=document.getElementById('wiMethod');
if(methodEl){
methodEl.value='cicilan';
WorthIt.onMethodChange();
const tenorEl=document.getElementById('wiTenor');
const bulanEl=document.getElementById('wiCicilanBulan');
if(tenorEl)tenorEl.value=cicilan.tenor;
if(bulanEl)bulanEl.value=cicilan.perBulan;
filled.push('Cicilan '+cicilan.tenor+'x '+fmt(cicilan.perBulan)+'/bln');
}
}
toast(filled.length?'✅ Terisi otomatis: '+filled.join(', ')+' — cek lagi sebelum lanjut':'⚠️ Tidak banyak yang terbaca, isi manual ya');
}catch(err){
toast('❌ Gagal scan: '+scanErrorMessage(err));
}
};
inp.click();
}

// filter-laporan.js — Filter transaksi/keuangan (panel filter Keuangan & Laporan), pencarian, paginasi list transaksi, navigasi antar-list (goToList/showFilteredTx)
// PENTING: file ini HARUS dimuat sesuai urutan build.js (GROUP_A/GROUP_B) karena beberapa modul saling referensi. Urutan grup ini: data-default.js, features-helpers-global-security.js, diagnostik-versi.js, format-tema.js, error-handler.js, helper-teks.js, keamanan-pin.js, modal-navigasi.js, reset-gaji-mingguan.js, debug-console.js, pengaturan-search.js, onboarding.js, kalkulator-input.js, scan-ocr.js, filter-laporan.js, akun.js, gaji-calc.js, transaksi.js, profil-pengaturan.js, kategori.js, tagihan-kalender.js, backup-restore.js, payroll-absensi.js, features-tukang-kendaraan-storage.js, features-aiwidget-reminder-gdrive-search.js, features-sheets-pwa-selftest.js

function txMatchesFilters(t,f){
if(f.tipe&&f.tipe!=='semua'){
if(f.tipe==='transfer'){if(t.type!=='transfer_in'&&t.type!=='transfer_out')return false;}
else if(t.type!==f.tipe)return false;
}
if(f.kat&&f.kat!=='semua'&&t.category!==f.kat)return false;
if(f.sub&&f.sub!=='semua'&&(t.subcategory||'')!==f.sub)return false;
if(f.acc&&f.acc!=='semua'&&t.accountId!==f.acc)return false;
if(f.method&&f.method!=='semua'&&(t.payMethod||'tunai')!==f.method)return false;
return true;
}
function populateCatFilter(){
populateCatSelect('fKat');
populateSubSelect('fSub','fKat');
}
function onFKatChange(){
populateSubSelect('fSub','fKat');
renderLaporan();
}
function resetLaporanFilter(){
['fTipe','fKat','fSub','fAcc','fMethod'].forEach(id=>{const el=document.getElementById(id);if(el)el.value=el.id==='fAcc'?'semua':'semua';});
populateSubSelect('fSub','fKat');
renderLaporan();
toast('↺ Filter laporan direset');
}
function getLaporanFilters(){
return{
tipe:document.getElementById('fTipe')?.value||'semua',
kat:document.getElementById('fKat')?.value||'semua',
sub:document.getElementById('fSub')?.value||'semua',
acc:document.getElementById('fAcc')?.value||'semua',
method:document.getElementById('fMethod')?.value||'semua'
};
}
function populateKeuFilters(){
populateCatSelect('kfKat');
populateSubSelect('kfSub','kfKat');
const opts=D.accounts.map(a=>`<option value="${a.id}">${a.emoji} ${escapeHtml(a.name)}</option>`).join('');
const kfAcc=document.getElementById('kfAcc');
if(kfAcc){const cur=kfAcc.value;kfAcc.innerHTML='<option value="semua">Semua Akun</option>'+opts;kfAcc.value=[...kfAcc.options].some(o=>o.value===cur)?cur:'semua';}
}
function onKfKatChange(){
populateSubSelect('kfSub','kfKat');
resetTxPageAndRender();
}
function toggleKeuFilter(){
const panel=document.getElementById('keuFilterPanel');
if(!panel)return;
const show=panel.style.display==='none';
panel.style.display=show?'block':'none';
if(show)populateKeuFilters();
updateKfBadge();
}
function resetKeuFilter(){
['kfTipe','kfKat','kfSub','kfAcc','kfMethod'].forEach(id=>{const el=document.getElementById(id);if(el)el.value=id==='kfAcc'?'semua':'semua';});
const s=document.getElementById('kfSearch');if(s)s.value='';
populateSubSelect('kfSub','kfKat');
saveKeuFilterPrefs();
resetTxPageAndRender();
toast('↺ Filter direset');
}
function getKeuFilters(){
return{
tipe:document.getElementById('kfTipe')?.value||'semua',
kat:document.getElementById('kfKat')?.value||'semua',
sub:document.getElementById('kfSub')?.value||'semua',
acc:document.getElementById('kfAcc')?.value||'semua',
method:document.getElementById('kfMethod')?.value||'semua',
search:(document.getElementById('kfSearch')?.value||'').trim().toLowerCase()
};
}
function txMatchesSearch(t,q){
if(!q)return true;
const acc=D.accounts.find(a=>a.id===t.accountId);
const hay=[t.category,t.subcategory,t.note,acc?acc.name:''].filter(Boolean).join(' ').toLowerCase();
return hay.includes(q);
}
let txListPage=1;
const TX_PAGE_SIZE=50;
let lapTxPage=1;
function loadMoreLapTx(){lapTxPage++;renderLaporan();}
// (v94): _lapLastFilterSig dipindah dari backup-restore.js (skrg
// backup-restore.js) — dipakai renderLaporan() bareng lapTxPage di atas utk dedup filter Laporan.
let _lapLastFilterSig=null;
function resetTxPageAndRender(){
txListPage=1;
saveKeuFilterPrefs();
renderKeuangan();
}
function onKfSearchInput(){
clearTimeout(window._kfSearchDebounce);
window._kfSearchDebounce=setTimeout(resetTxPageAndRender,250);
}
function loadMoreTx(){
txListPage++;
renderKeuangan();
}
function saveKeuFilterPrefs(){
try{
const prefs={
tipe:document.getElementById('kfTipe')?.value||'semua',
kat:document.getElementById('kfKat')?.value||'semua',
sub:document.getElementById('kfSub')?.value||'semua',
acc:document.getElementById('kfAcc')?.value||'semua',
method:document.getElementById('kfMethod')?.value||'semua',
search:document.getElementById('kfSearch')?.value||'',
periode:txListPeriode,
from:document.getElementById('txListFrom')?.value||'',
to:document.getElementById('txListTo')?.value||''
};
safeSetItem('kw_keuFilterPrefs',JSON.stringify(prefs));
}catch(e){console.error('Gagal simpan preferensi filter:',e);}
}
let _keuFilterPrefsLoaded=false;
function loadKeuFilterPrefsIntoDOM(){
if(_keuFilterPrefsLoaded)return;
_keuFilterPrefsLoaded=true;
let prefs;
try{prefs=JSON.parse(localStorage.getItem('kw_keuFilterPrefs')||'null');}catch{prefs=null;}
if(!prefs)return;
if(document.getElementById('kfTipe'))document.getElementById('kfTipe').value=prefs.tipe||'semua';
if(document.getElementById('kfKat'))document.getElementById('kfKat').value=prefs.kat||'semua';
populateSubSelect('kfSub','kfKat');
if(document.getElementById('kfSub'))document.getElementById('kfSub').value=prefs.sub||'semua';
if(document.getElementById('kfAcc'))document.getElementById('kfAcc').value=prefs.acc||'semua';
if(document.getElementById('kfMethod'))document.getElementById('kfMethod').value=prefs.method||'semua';
if(document.getElementById('kfSearch'))document.getElementById('kfSearch').value=prefs.search||'';
if(prefs.periode){
txListPeriode=prefs.periode;
const idxMap={hari:0,minggu:1,bulan:2,tahun:3,selamanya:4,custom:5};
const btns=document.querySelectorAll('#txListPeriodeChips .chip-btn');
btns.forEach(b=>b.classList.remove('active'));
const idx=idxMap[prefs.periode];
if(btns[idx])btns[idx].classList.add('active');
const customRangeEl=document.getElementById('txListCustomRange');
if(customRangeEl)customRangeEl.style.display=prefs.periode==='custom'?'block':'none';
if(prefs.from&&document.getElementById('txListFrom'))document.getElementById('txListFrom').value=prefs.from;
if(prefs.to&&document.getElementById('txListTo'))document.getElementById('txListTo').value=prefs.to;
}
const hasActive=['tipe','kat','sub','acc','method'].some(k=>prefs[k]&&prefs[k]!=='semua')||prefs.search;
if(hasActive){const panel=document.getElementById('keuFilterPanel');if(panel)panel.style.display='block';}
}
function updateKfBadge(){
const btn=document.getElementById('kfToggleBtn');
if(!btn)return;
const f=getKeuFilters();
const n=Object.values(f).filter(v=>v&&v!=='semua').length;
btn.textContent=n?`🔍 Filter (${n})`:'🔍 Filter';
}
function goToList(targetId, pageName, navIdx, cobekTabName, cnTabName){
const jump=()=>{
if(cobekTabName){const tabs=document.querySelectorAll('#page-cobek .cn-tab');setCobekTab(cobekTabName,tabs[cobekTabName==='etalase'?1:cobekTabName==='produsen'?2:cobekTabName==='riwayat'?3:cobekTabName==='pelanggan'?4:0]);}
if(cnTabName){const tabs=document.querySelectorAll('#page-carnotes .cn-tab');setCnTab(cnTabName,tabs[cnTabName==='servis'?1:0]);}
const el=document.getElementById(targetId);
if(!el)return;
setTimeout(()=>{
el.scrollIntoView({behavior:'smooth',block:'start'});
el.classList.remove('flash-highlight');void el.offsetWidth;el.classList.add('flash-highlight');
setTimeout(()=>el.classList.remove('flash-highlight'),1200);
},pageName?150:0);
};
if(pageName){showPage(pageName,document.querySelectorAll('.nav-item')[navIdx]);jump();}
else jump();
}
function showFilteredTx(scope, type, label){
let txs=[];
if(scope==='dashboard'){
const now=new Date(),m=now.getMonth(),y=now.getFullYear();
txs=D.transactions.filter(t=>{const d=new Date(t.date);return d.getMonth()===m&&d.getFullYear()===y;});
} else if(scope==='keuangan'){
const kf=getKeuFilters();
txs=D.transactions.filter(t=>{const d=new Date(t.date);return d.getMonth()===curMonth&&d.getFullYear()===curYear&&txMatchesFilters(t,kf);});
} else if(scope==='laporan'){
const {from,to}=getRange();
const f=getLaporanFilters();
txs=D.transactions.filter(t=>{
const d=new Date(t.date);
if(d<from||d>to)return false;
if(t.type==='transfer_in'||t.type==='transfer_out')return false;
if(!txMatchesFilters(t,f))return false;
return true;
});
}
if(type==='income')txs=txs.filter(t=>t.type==='income');
else if(type==='expense')txs=txs.filter(t=>t.type==='expense');
else if(type==='all')txs=txs.filter(t=>t.type==='income'||t.type==='expense');
const sorted=[...txs].sort((a,b)=>new Date(b.date)-new Date(a.date));
const total=sorted.reduce((s,t)=>s+(t.type==='income'?t.amount:-t.amount),0);
document.getElementById('filterTxTitle').textContent=label||'Transaksi';
document.getElementById('filterTxSummary').textContent=sorted.length+' transaksi · Total '+(total<0?'-':'')+fmt(Math.abs(total));
const FTX_PAGE_SIZE=100;
const visibleCount=Math.min(sorted.length,FTX_PAGE_SIZE);
const visible=sorted.slice(0,visibleCount);
document.getElementById('filterTxList').innerHTML=visible.length?visible.map(txHTML).join(''):'<div class="empty"><div class="empty-icon">💸</div><div class="empty-text">Tidak ada transaksi</div></div>';
let ftxMoreWrap=document.getElementById('filterTxLoadMoreWrap');
if(!ftxMoreWrap){
ftxMoreWrap=document.createElement('div');
ftxMoreWrap.id='filterTxLoadMoreWrap';
ftxMoreWrap.style.cssText='text-align:center;margin-top:10px';
document.getElementById('filterTxList').insertAdjacentElement('afterend',ftxMoreWrap);
}
if(visibleCount<sorted.length){
ftxMoreWrap.style.display='block';
ftxMoreWrap.innerHTML=`<button class="btn btn-ghost btn-sm">⬇️ Tampilkan lebih banyak (${sorted.length-visibleCount} lagi)</button>`;
ftxMoreWrap.dataset.shown=visibleCount;
ftxMoreWrap.querySelector('button').onclick=function(){
const shown=parseInt(ftxMoreWrap.dataset.shown||String(FTX_PAGE_SIZE),10);
const nextCount=Math.min(sorted.length,shown+FTX_PAGE_SIZE);
const nextBatch=sorted.slice(shown,nextCount);
document.getElementById('filterTxList').insertAdjacentHTML('beforeend',nextBatch.map(txHTML).join(''));
ftxMoreWrap.dataset.shown=nextCount;
if(nextCount>=sorted.length){ftxMoreWrap.style.display='none';}
else{this.textContent=`⬇️ Tampilkan lebih banyak (${sorted.length-nextCount} lagi)`;}
};
} else ftxMoreWrap.style.display='none';
openModal('filterTxModal');
}

// akun.js — Kelola Akun (Cash/Bank/Ewallet dll): saldo, filter dropdown akun di seluruh app, CRUD akun
// PENTING: file ini HARUS dimuat sesuai urutan build.js (GROUP_A/GROUP_B) karena beberapa modul saling referensi. Urutan grup ini: data-default.js, features-helpers-global-security.js, diagnostik-versi.js, format-tema.js, error-handler.js, helper-teks.js, keamanan-pin.js, modal-navigasi.js, reset-gaji-mingguan.js, debug-console.js, pengaturan-search.js, onboarding.js, kalkulator-input.js, scan-ocr.js, filter-laporan.js, akun.js, gaji-calc.js, transaksi.js, profil-pengaturan.js, kategori.js, tagihan-kalender.js, backup-restore.js, payroll-absensi.js, features-tukang-kendaraan-storage.js, features-aiwidget-reminder-gdrive-search.js, features-sheets-pwa-selftest.js

function recalcAccBalance(accId){
const acc=D.accounts.find(a=>a.id===accId);
if(!acc)return 0;
let bal=acc.baseBalance!==undefined?acc.baseBalance:(acc.balance||0);
D.transactions.forEach(t=>{
if(t.accountId===accId){
if(t.type==='income')bal+=t.amount;
else if(t.type==='expense')bal-=t.amount;
else if(t.type==='transfer_out')bal-=t.amount;
else if(t.type==='transfer_in')bal+=t.amount;
}
});
return bal;
}
function populateAccFilters(){
const opts=D.accounts.map(a=>`<option value="${a.id}">${a.emoji} ${escapeHtml(a.name)}</option>`).join('');
const fAcc=document.getElementById('fAcc');
if(fAcc) fAcc.innerHTML='<option value="semua">Semua Akun</option>'+opts;
const txAcc=document.getElementById('txAcc');
if(txAcc) txAcc.innerHTML=opts;
const trFrom=document.getElementById('trFrom');
const trTo=document.getElementById('trTo');
if(trFrom) trFrom.innerHTML=opts;
if(trTo) trTo.innerHTML=opts;
const wrAcc=document.getElementById('wrAcc');
if(wrAcc) wrAcc.innerHTML=opts;
const tAcc=document.getElementById('tAcc');
if(tAcc){const cur=tAcc.value;tAcc.innerHTML='<option value="">— Tidak terkait akun, isi manual —</option>'+opts;if(cur)tAcc.value=cur;}
const assetAccId=document.getElementById('assetAccId');
if(assetAccId){const cur=assetAccId.value;assetAccId.innerHTML='<option value="">— Tidak ditautkan —</option>'+opts;if(cur)assetAccId.value=cur;}
populateKeuFilters();
}
/* moved to modules-render.js: renderAccGrid */
function linkedAssetAccountIds(){
return new Set((D.assets||[]).filter(a=>a.accountId).map(a=>String(a.accountId)));
}
function isAccLinkedToAsset(accId){
return linkedAssetAccountIds().has(String(accId));
}
function totalSaldoAkun(){
const linked=linkedAssetAccountIds();
return D.accounts.filter(a=>a.includeInBalance!==false&&!linked.has(String(a.id))).reduce((s,a)=>s+recalcAccBalance(a.id),0);
}
/* moved to modules-render.js: renderDashAccList */
/* moved to modules-render.js: renderLapAccList */
function quickToggleInclude(id){
if(isAccLinkedToAsset(id)&&D.accounts.find(x=>x.id===id)?.includeInBalance!==false){
toast('🔗 Akun ini dikecualikan otomatis karena ditautkan dari 📋 Buku Aset — lepas tautannya dulu di modal Aset kalau mau atur manual di sini');
return;
}
const a=D.accounts.find(x=>x.id===id);
if(!a)return;
a.includeInBalance=a.includeInBalance===false?true:false;
save();renderLapAccList();renderDashAccList();renderAccGrid();
}
let editAccIdx=-1,accIncludeState=true;
function openAccModal(idx){
editAccIdx=(typeof idx==='number')?idx:-1;
const a=editAccIdx>=0?D.accounts[editAccIdx]:null;
document.getElementById('accModalTitle').textContent=a?'Edit Akun':'Tambah Akun';
document.getElementById('accName').value=a?a.name:'';
document.getElementById('accEmoji').value=a?a.emoji:'💰';
document.getElementById('accBalance').value=a?recalcAccBalance(a.id):'';
document.getElementById('accBalanceLabel').textContent=a?'Saldo Sekarang (Rp)':'Saldo Awal (Rp)';
document.getElementById('accBalanceHint').style.display=a?'block':'none';
document.getElementById('accLinkedAssetHint').style.display=(a&&isAccLinkedToAsset(a.id))?'block':'none';
accIncludeState=a?(a.includeInBalance!==false):true;
updateAccIncludeBtn();
openModal('accModal');
}
function toggleAccInclude(){accIncludeState=!accIncludeState;updateAccIncludeBtn();}
function updateAccIncludeBtn(){
const btn=document.getElementById('accIncludeBtn');
if(!btn)return;
btn.classList.toggle('active',accIncludeState);
btn.textContent=accIncludeState?'✓ Aktif':'✕ Nonaktif';
}
function saveAcc(){return withSaveGuard('acc','accModal',_saveAccInner);}
function _saveAccInner(){
const name=document.getElementById('accName').value.trim();
const emoji=document.getElementById('accEmoji').value||'💰';
const nominal=parseFloat(document.getElementById('accBalance').value)||0;
if(!name){toast('⚠️ Isi nama akun');return;}
if(editAccIdx>=0){
const a=D.accounts[editAccIdx];
a.name=name;a.emoji=emoji;a.includeInBalance=accIncludeState;
const txDelta=recalcAccBalance(a.id)-(a.baseBalance!==undefined?a.baseBalance:(a.balance||0));
a.baseBalance=nominal-txDelta;
a.balance=nominal;
save();closeModal('accModal');renderAccGrid();populateAccFilters();renderDashAccList();renderLapAccList();toast('✅ Akun diperbarui');
} else {
D.accounts.push({id:'acc_'+Date.now(),name,emoji,baseBalance:nominal,balance:nominal,includeInBalance:accIncludeState});
save();closeModal('accModal');renderAccGrid();populateAccFilters();renderDashAccList();renderLapAccList();toast('✅ Akun ditambahkan');
}
}
async function delAcc(i){
if(D.accounts.length<=1){toast('⚠️ Minimal 1 akun harus ada');return;}
const acc=D.accounts[i];
if(!await askConfirm(`Hapus akun "${acc.name}"? Transaksi, tagihan, catatan BBM/servis, dan transaksi Shop yang terkait akan dipindahkan ke akun lain.`))return;
D.accounts.splice(i,1);
const fallback=D.accounts[0];
D.transactions.forEach(t=>{if(t.accountId===acc.id)t.accountId=fallback.id;});
(D.bills||[]).forEach(b=>{if(b.accountId===acc.id)b.accountId=fallback.id;});
(D.bbmLogs||[]).forEach(b=>{if(b.accountId===acc.id)b.accountId=fallback.id;});
(D.servisLogs||[]).forEach(s=>{if(s.accountId===acc.id)s.accountId=fallback.id;});
(D.cobek||[]).forEach(c=>{if(c.accountId===acc.id)c.accountId=fallback.id;});
save();renderAccGrid();populateAccFilters();renderDashAccList();renderLapAccList();renderDashboard();renderKeuangan();refreshBillEverywhere();renderCnTab();toast(`🗑 Akun dihapus, semua data terkait dipindah ke "${fallback.name}"`);
}

// gaji-calc.js — Kalkulator gaji harian/borongan (Tukang & karyawan lepas), catat sbg pemasukan
// PENTING: file ini HARUS dimuat sesuai urutan build.js (GROUP_A/GROUP_B) karena beberapa modul saling referensi. Urutan grup ini: data-default.js, features-helpers-global-security.js, diagnostik-versi.js, format-tema.js, error-handler.js, helper-teks.js, keamanan-pin.js, modal-navigasi.js, reset-gaji-mingguan.js, debug-console.js, pengaturan-search.js, onboarding.js, kalkulator-input.js, scan-ocr.js, filter-laporan.js, akun.js, gaji-calc.js, transaksi.js, profil-pengaturan.js, kategori.js, tagihan-kalender.js, backup-restore.js, payroll-absensi.js, features-tukang-kendaraan-storage.js, features-aiwidget-reminder-gdrive-search.js, features-sheets-pwa-selftest.js

let _gcLastTotal=0;
function openGajiCalc(){
const gajiHariDefault=D.profile.gajiPokok||0;
document.getElementById('gcUpahJam').value=gajiHariDefault>0?Math.round(gajiHariDefault/7):'';
document.getElementById('gcJamKerja').value=7;
document.getElementById('gcLemburJam').value='';
document.getElementById('gcLemburRate').value='';
document.getElementById('gcBonus').value='';
document.getElementById('gcPotongan').value='';
openModal('gajiCalcModal');
calcGaji();
}
function calcGaji(){
const upahJam=parseFloat(document.getElementById('gcUpahJam').value)||0;
const jamKerja=parseFloat(document.getElementById('gcJamKerja').value)||0;
const lemburJam=parseFloat(document.getElementById('gcLemburJam').value)||0;
const lemburRate=parseFloat(document.getElementById('gcLemburRate').value)||0;
const bonus=parseFloat(document.getElementById('gcBonus').value)||0;
const potongan=parseFloat(document.getElementById('gcPotongan').value)||0;
const gajiPokokTotal=upahJam*jamKerja;
const lemburTotal=lemburJam*lemburRate;
const total=Math.max(0,gajiPokokTotal+lemburTotal+bonus-potongan);
_gcLastTotal=total;
document.getElementById('gcTotal').textContent=fmtFull(total);
document.getElementById('gcBreakdown').textContent=`Pokok (${jamKerja} jam × ${fmtFull(upahJam)}) ${fmtFull(gajiPokokTotal)} + Lembur (${lemburJam} jam × ${fmtFull(lemburRate)}) ${fmtFull(lemburTotal)} + Bonus ${fmtFull(bonus)} − Potongan ${fmtFull(potongan)}`;
document.getElementById('gcSaveBtn').disabled=total<=0;
}
function saveGajiAsIncome(){
if(_gcLastTotal<=0)return;
const amount=_gcLastTotal;
closeModal('gajiCalcModal');
openTxModal('income');
setTimeout(()=>{
document.getElementById('txAmt').value=amount;
const gajiCat=D.categories.income.find(c=>/gaji/i.test(c.name));
if(gajiCat){ document.getElementById('txCat').value=gajiCat.name; updateSubCatOptions(); }
document.getElementById('txNote').value='Hasil kalkulator gaji';
},60);
}
function openAbsensiModal(){return Payroll.openAbsensiModal();}
function changeAbsensiWeek(dir){return Payroll.changeAbsensiWeek(dir);}

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
if(typeof AutoKat!=='undefined'){AutoKat.hideSuggest();AutoKat._lastNoteQueried='';}
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
if(typeof AutoKat!=='undefined'){AutoKat.hideSuggest();AutoKat._lastNoteQueried='';}
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
if(typeof AutoKat!=='undefined'){AutoKat.hideSuggest();AutoKat._lastNoteQueried='';}
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

// profil-pengaturan.js — Profil pengguna di Pengaturan: auto-save profil, status
// PTKP (kawin/tanggungan/pekerjaan) utk estimasi PPh21, preview usia, hint API key AI
// PENTING: file ini HARUS dimuat sesuai urutan build.js (GROUP_A/GROUP_B) karena beberapa modul saling referensi. Urutan grup ini: data-default.js, features-helpers-global-security.js, diagnostik-versi.js, format-tema.js, error-handler.js, helper-teks.js, keamanan-pin.js, modal-navigasi.js, reset-gaji-mingguan.js, debug-console.js, pengaturan-search.js, onboarding.js, kalkulator-input.js, scan-ocr.js, akun.js, gaji-calc.js, transaksi.js, profil-pengaturan.js, kategori.js, tagihan-kalender.js, backup-restore.js, payroll-absensi.js, features-tukang-kendaraan-storage.js, features-aiwidget-reminder-gdrive-search.js, features-sheets-pwa-selftest.js

function autoSaveProfile(){
D.profile.nama=document.getElementById('sNama').value||'W';
D.profile.gajiPokok=parseInt(document.getElementById('sGaji').value)||65000;
D.profile.kiriman=parseInt(document.getElementById('sKirim').value)||500000;
const sLemburMxEl2=document.getElementById('sLemburMx'); if(sLemburMxEl2) D.profile.lemburMultiplier=parseFloat(sLemburMxEl2.value)||1.5;
const sTarifMingguEl2=document.getElementById('sTarifMinggu'); if(sTarifMingguEl2) D.profile.tarifMinggu=parseInt(sTarifMingguEl2.value)||139000;
const sTglLahirEl=document.getElementById('sTanggalLahir'); if(sTglLahirEl) D.profile.tanggalLahir=sTglLahirEl.value||null;
const apiKeyEl=document.getElementById('sApiKey');
if(apiKeyEl){ D.profile.apiKey=apiKeyEl.value.trim(); persistApiKeyEncrypted(); }
const providerEl=document.getElementById('sApiProvider');
if(providerEl) D.profile.apiProvider=providerEl.value;
document.getElementById('hNama').textContent=D.profile.nama;
updateProfilPTKPPreview();
updateUsiaPreview();
save();
}
function profilePTKPStatus(){
const kawin=!!(D.profile&&D.profile.statusKawin);
let tanggungan=(D.profile&&D.profile.tanggungan)||0;
tanggungan=Math.max(0,Math.min(3,parseInt(tanggungan)||0));
return (kawin?'K':'TK')+tanggungan;
}
function profileJiwaKeluarga(){
const kawin=!!(D.profile&&D.profile.statusKawin);
let tanggungan=(D.profile&&D.profile.tanggungan)||0;
tanggungan=Math.max(0,parseInt(tanggungan)||0);
return 1+(kawin?1:0)+tanggungan;
}
function updateProfilPTKPPreview(){
const el=document.getElementById('sPTKPPreview');
if(!el)return;
const status=profilePTKPStatus();
el.textContent=status.replace('TK','TK/').replace(/^K(\d)/,'K/$1');
}
function updateUsiaPreview(){
const wrap=document.getElementById('sUsiaPreview'),val=document.getElementById('sUsiaVal');
if(!wrap||!val)return;
const tgl=D.profile&&D.profile.tanggalLahir;
if(!tgl){wrap.style.display='none';return;}
wrap.classList.remove('u-dnone');wrap.style.display='block';
val.textContent=fiCalcAge(tgl)+' tahun';
}
function selectStatusKawin(val,el){
D.profile.statusKawin=!!val;
document.querySelectorAll('#sStatusKawinPicker .chip-btn').forEach(b=>b.classList.remove('active'));
el.classList.add('active');
updateProfilPTKPPreview();
save();
}
function selectTanggungan(val,el){
D.profile.tanggungan=Math.max(0,Math.min(3,parseInt(val)||0));
document.querySelectorAll('#sTanggunganPicker .chip-btn').forEach(b=>b.classList.remove('active'));
el.classList.add('active');
updateProfilPTKPPreview();
save();
}
function selectStatusPekerjaan(val,el){
D.profile.statusPekerjaan=val;
document.querySelectorAll('#sPekerjaanPicker .chip-btn').forEach(b=>b.classList.remove('active'));
el.classList.add('active');
save();
renderPajakRekomendasi(true);
}
/* moved to modules-render.js: renderPajakRekomendasi */
function toggleApiKeyHint(){
const provider=document.getElementById('sApiProvider').value;
const hint=document.getElementById('apiKeyHint');
const keyEl=document.getElementById('sApiKey');
if(!hint||!keyEl)return;
if(provider==='gemini'){
keyEl.placeholder='AIza...';
hint.innerHTML='Buat API key gratis di <a class="u-cacc" href="https://aistudio.google.com/apikey" target="_blank">aistudio.google.com/apikey</a>. Key disimpan terenkripsi di HP ini (PIN sebagai kunci), tidak dikirim ke mana pun selain ke Google, & tidak ikut ke file backup.';
} else {
keyEl.placeholder='sk-ant-...';
hint.innerHTML='Buat API key di <a class="u-cacc" href="https://console.anthropic.com" target="_blank">console.anthropic.com</a>. Key disimpan terenkripsi di HP ini (PIN sebagai kunci), tidak dikirim ke mana pun selain ke Anthropic, & tidak ikut ke file backup.';
}
}

// kategori.js — Modal Kategori & Subkategori (tambah/edit/hapus, filter tampilan)
// PENTING: file ini HARUS dimuat sesuai urutan build.js (GROUP_A/GROUP_B) karena beberapa modul saling referensi. Urutan grup ini: data-default.js, features-helpers-global-security.js, diagnostik-versi.js, format-tema.js, error-handler.js, helper-teks.js, keamanan-pin.js, modal-navigasi.js, reset-gaji-mingguan.js, debug-console.js, pengaturan-search.js, onboarding.js, kalkulator-input.js, scan-ocr.js, filter-laporan.js, akun.js, gaji-calc.js, transaksi.js, profil-pengaturan.js, kategori.js, tagihan-kalender.js, backup-restore.js, payroll-absensi.js, features-tukang-kendaraan-storage.js, features-aiwidget-reminder-gdrive-search.js, features-sheets-pwa-selftest.js

function getAllCats(){return[...D.categories.income,...D.categories.expense];}
function getCatsByType(type){return D.categories[type]||[];}
function getCat(name){
const all=getAllCats().filter(c=>c.name===name);
if(!all.length) return {name:'Lainnya',emoji:'📦',subs:[]};
return all.reduce((best,c)=>((c.subs&&c.subs.length||0)>(best.subs&&best.subs.length||0)?c:best),all[0]);
}
function getCatByType(name,type){
const cats=(D.categories[type]||[]).filter(c=>c.name===name);
if(!cats.length) return getCat(name);
return cats.reduce((best,c)=>((c.subs&&c.subs.length||0)>(best.subs&&best.subs.length||0)?c:best),cats[0]);
}
function uniqueCatList(){
const seen=new Map();
getAllCats().forEach(c=>{ if(!seen.has(c.name)) seen.set(c.name,c.emoji||'📦'); });
return[...seen.entries()];
}
function subNamesForCat(katName){
const seen=new Set();
getAllCats().forEach(c=>{
if(katName==='semua'||c.name===katName){(c.subs||[]).forEach(s=>{if(s.name)seen.add(s.name);});}
});
return[...seen].sort((a,b)=>a.localeCompare(b,'id'));
}
function populateCatSelect(id){
const sel=document.getElementById(id);
if(!sel)return;
const cur=sel.value;
sel.innerHTML='<option value="semua">Semua</option>'+uniqueCatList().map(([name,emoji])=>`<option value="${escapeHtml(name)}">${emoji} ${escapeHtml(name)}</option>`).join('');
sel.value=[...sel.options].some(o=>o.value===cur)?cur:'semua';
}
function populateSubSelect(subId,katId){
const sel=document.getElementById(subId);
if(!sel)return;
const katVal=document.getElementById(katId)?.value||'semua';
const cur=sel.value;
const subs=subNamesForCat(katVal);
sel.innerHTML='<option value="semua">Semua</option>'+subs.map(s=>`<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');
sel.value=subs.includes(cur)?cur:'semua';
}
function openCatModal(idx,type,callback){
catEditIdx=idx!==undefined?idx:null;
curCatModalType=type||'income';
catModalCallback=typeof callback==='function'?callback:null;
const isEdit=catEditIdx!==null&&catEditIdx!==undefined;
document.getElementById('catModalTitle').textContent=isEdit?'Edit Kategori':'Tambah Kategori';
setCatModalType(curCatModalType);
if(isEdit){
const cat=D.categories[curCatModalType][catEditIdx];
document.getElementById('catName').value=cat.name;
document.getElementById('catEmoji').value=cat.emoji;
} else {
document.getElementById('catName').value='';
document.getElementById('catEmoji').value='💰';
}
const catDelBtnEl=document.getElementById('catDelBtn'); if(catDelBtnEl) catDelBtnEl.style.display=isEdit?'':'none';
openModal('catModal');
}
async function delCatFromModal(){
if(catEditIdx===null||catEditIdx===undefined)return;
const cat=D.categories[curCatModalType][catEditIdx];
if(!cat)return;
const before=D.categories[curCatModalType].length;
await delCat(cat.id,curCatModalType);
if(D.categories[curCatModalType].length<before){ catModalCallback=null; closeModal('catModal'); }
}
function setCatModalType(t){
curCatModalType=t;
document.getElementById('catBtnI').className='type-btn'+(t==='income'?' ai':'');
document.getElementById('catBtnE').className='type-btn'+(t==='expense'?' ae':'');
}
function refreshTxCatIfOpen(){
const modal=document.getElementById('txModal');
if(!modal||!modal.classList.contains('open'))return;
updateTxVehiclePanels();
}
function saveCat(){
const name=document.getElementById('catName').value.trim();
const emoji=document.getElementById('catEmoji').value||'📦';
const type=curCatModalType;
if(!name){toast('⚠️ Isi nama kategori');return;}
if(catEditIdx!==null&&catEditIdx!==undefined){
const oldName=D.categories[type][catEditIdx].name;
D.categories[type][catEditIdx]={...D.categories[type][catEditIdx],name,emoji};
var catRenameAffected=0;
if(oldName!==name){
D.transactions.forEach(t=>{if(t.category===oldName){t.category=name;catRenameAffected++;}});
(D.bills||[]).forEach(b=>{if(b.category===oldName)b.category=name;});
}
} else {
D.categories[type].push({id:'cat_'+Date.now(),name,emoji,subs:[]});
}
save(); closeModal('catModal'); renderCatList(); populateCatFilter(); populateKeuFilters(); refreshTxCatIfOpen(); renderDashboard(); renderKeuangan();
toast(catRenameAffected?`✅ Kategori disimpan, ${catRenameAffected} transaksi lama ikut disesuaikan`:'✅ Kategori disimpan',catRenameAffected?3200:undefined);
if(catModalCallback){
const cb=catModalCallback; catModalCallback=null;
cb(name);
}
}
async function delCat(id,type){
const defaults=DEFAULT_CATS[type].map(c=>c.id);
const isDefault=defaults.includes(id);
const cat=D.categories[type].find(c=>c.id===id);
const usedCount=cat?D.transactions.filter(t=>t.category===cat.name).length:0;
let warnMsg=usedCount?`Hapus kategori "${cat.name}"? ${usedCount} transaksi yg sudah pakai kategori ini TIDAK akan ikut terhapus, tapi kategorinya tidak akan muncul lagi di pilihan Input Transaksi.`:'Hapus kategori ini beserta subkategorinya?';
if(isDefault)warnMsg=`⚠️ "${cat?cat.name:''}" adalah kategori bawaan (default) aplikasi. `+warnMsg;
if(!await askConfirm(warnMsg))return;
D.categories[type]=D.categories[type].filter(c=>c.id!==id);
save();renderCatList();populateCatFilter();populateKeuFilters();refreshTxCatIfOpen();toast('🗑 Kategori dihapus');
}
function openSubCatModal(catId,type,subId){
subCatParentId=catId; subCatParentType=type; subCatEditId=subId||null;
const cat=D.categories[type].find(c=>c.id===catId);
const isEdit=!!subCatEditId;
document.getElementById('subCatModalTitle').textContent=isEdit?'Edit Subkategori':'Tambah Subkategori';
document.getElementById('subCatParentLabel').textContent=cat.emoji+' '+cat.name;
if(isEdit){
const sub=(cat.subs||[]).find(s=>s.id===subCatEditId);
document.getElementById('subCatName').value=sub?sub.name:'';
}else{
document.getElementById('subCatName').value='';
}
openModal('subCatModal');
}
function saveSubCat(){
const name=document.getElementById('subCatName').value.trim();
if(!name){toast('⚠️ Isi nama subkategori');return;}
const cat=D.categories[subCatParentType].find(c=>c.id===subCatParentId);
if(!cat.subs)cat.subs=[];
if(subCatEditId){
const sub=cat.subs.find(s=>s.id===subCatEditId);
if(!sub){toast('⚠️ Subkategori tidak ditemukan');return;}
const oldName=sub.name;
sub.name=name;
var subRenameAffected=0;
if(oldName!==name){
D.transactions.forEach(t=>{if(t.subcategory===oldName&&t.category===cat.name){t.subcategory=name;subRenameAffected++;}});
(D.bills||[]).forEach(b=>{if(b.subcategory===oldName&&b.category===cat.name)b.subcategory=name;});
}
save();closeModal('subCatModal');renderCatList();populateSubSelect('fSub','fKat');populateSubSelect('kfSub','kfKat');refreshTxCatIfOpen();
toast(subRenameAffected?`✅ Subkategori disimpan, ${subRenameAffected} transaksi lama ikut disesuaikan`:'✅ Subkategori disimpan',subRenameAffected?3200:undefined);
}else{
cat.subs.push({id:'sub_'+Date.now(),name});
save();closeModal('subCatModal');renderCatList();populateSubSelect('fSub','fKat');populateSubSelect('kfSub','kfKat');refreshTxCatIfOpen();toast('✅ Subkategori ditambahkan');
}
}
async function delSubCat(catId,type,subId){
if(!await askConfirm('Hapus subkategori ini?'))return;
const cat=D.categories[type].find(c=>c.id===catId);
cat.subs=cat.subs.filter(s=>s.id!==subId);
save();renderCatList();populateSubSelect('fSub','fKat');populateSubSelect('kfSub','kfKat');refreshTxCatIfOpen();toast('🗑 Subkategori dihapus');
}
function toggleCatGroup(catId){
const el=document.getElementById('subs_'+catId);
const arrow=document.getElementById('arrow_'+catId);
if(el){el.classList.toggle('open');arrow.classList.toggle('open');}
}
function filterCat(f,el){
curCatFilter=f;
document.querySelectorAll('#catFilterChips .chip-btn').forEach(b=>b.classList.remove('active'));
el.classList.add('active');
renderCatList();
}
/* moved to modules-render.js: renderCatList */

// kategorisasi-ai.js — AI Auto-Kategorisasi Transaksi dari Catatan Bebas
// FITUR BARU: saat user mengetik Keterangan transaksi bebas di Input Transaksi (mis. "bayar
// galon+beras warung"), modul ini menebak Kategori & Subkategori yang paling cocok — jauh lebih
// akurat dari sekadar keyword-matching yang sudah ada (CAT_EMOJI_GUESS/guessCategoryFromReceiptText
// di scan-ocr.js), yang cuma bisa menebak kalau NAMA kategori itu sendiri mengandung kata kuncinya
// (mis. kategori "Belanja Dapur" cocok krn ada kata "belanja"), bukan dari ISI belanjaan yang
// sebenarnya ditulis user (galon, beras, dst tidak ada di daftar keyword itu).
//
// ALUR:
//  1) onNoteInput() dipanggil tiap user mengetik. Instan (gratis, tanpa AI) coba tebakan lokal
//     lewat guessCategoryFromReceiptText() yang sudah ada, buat quick feedback kalau kebetulan cocok.
//  2) Debounce 750ms setelah user berhenti mengetik: kalau API key AI sudah diisi di Pengaturan
//     (dipakai bareng fitur AI lain — lihat callAIProviderRaw di
//     features-aiwidget-reminder-gdrive-search.js, SATU-SATUNYA tempat fetch ke Claude/Gemini),
//     kirim catatan + daftar kategori/subkategori MILIK USER SENDIRI ke AI, minta JSON kategori
//     paling cocok. AI cuma boleh pilih dari daftar yang ada (tidak boleh ngarang nama baru) —
//     supaya hasilnya selalu valid & bisa langsung dipakai.
//  3) Hasil ditampilkan sbg kotak saran non-intrusive (id="txCatAiSuggest") di bawah field
//     Keterangan, user tinggal tap "✅ Pakai" atau "✕ Abaikan". Tidak pernah auto-terapkan
//     tanpa persetujuan user.
//  4) Kalau user tap "Pakai", kata-kata kunci dari catatan itu "diajarkan" ke D.learnedItemCat
//     (kamus yang sama dipakai guessCategoryFromReceiptText utk Scan Struk) — jadi transaksi
//     serupa berikutnya bisa langsung ketebak dari heuristik lokal GRATIS, tanpa perlu panggil AI
//     lagi tiap kali.
// PENTING: file ini HARUS dimuat SETELAH kategori.js (getCatsByType) & scan-ocr.js
// (guessCategoryFromReceiptText) tapi urutan pemanggilan fungsi terjadi belakangan (event input
// user), jadi posisi di build.js cukup di GROUP_B setelah kategori.js.

const AutoKat = {
  _timer: null,
  _reqToken: 0,
  _lastNoteQueried: '',

  // Kata umum yang TIDAK dipakai sbg kata kunci belajar (terlalu generik, bisa nyasar ke kategori
  // manapun kalau dijadikan key — mis. "bayar" muncul di hampir semua catatan pengeluaran).
  STOPWORDS: new Set(['bayar','bayarin','beli','belanja','untuk','buat','dari','sama','dengan',
    'yang','ini','itu','hari','tadi','tolong','minta','order','pesan','bulan','biaya','buka',
    'sekalian','juga','lagi','masih','belum','sudah','buat','plus']),

  onNoteInput(){
    const noteEl = document.getElementById('txNote');
    const box = document.getElementById('txCatAiSuggest');
    if(!noteEl || !box) return;
    const text = noteEl.value.trim();
    clearTimeout(this._timer);
    if(text.length < 3){ this.hideSuggest(); return; }

    // 1) Tebakan lokal instan (gratis) — hanya kalau field Kategori masih kosong & tipe expense
    //    (guessCategoryFromReceiptText hanya menebak dari D.categories.expense).
    const catFieldEmpty = !(document.getElementById('txCat')||{}).value?.trim();
    if(curTxType==='expense' && catFieldEmpty && typeof guessCategoryFromReceiptText==='function'){
      const localCat = guessCategoryFromReceiptText(text);
      if(localCat){
        this.renderSuggest({categoryName:localCat.name, subName:null, emoji:localCat.emoji, source:'lokal', reasoning:null});
      } else {
        this.hideSuggest();
      }
    } else {
      this.hideSuggest();
    }

    // 2) Setelah user berhenti mengetik, minta tebakan AI yang lebih akurat (kalau API key ada)
    this._timer = setTimeout(()=>{ this.runAiSuggest(text); }, 750);
  },

  hideSuggest(){
    const box = document.getElementById('txCatAiSuggest');
    if(!box) return;
    box.classList.add('u-dnone');
    box.innerHTML='';
    delete box.dataset.catName;
    delete box.dataset.subName;
    delete box.dataset.note;
  },

  async runAiSuggest(text){
    if(!text || text.length < 4) return;
    if(text === this._lastNoteQueried) return;
    const apiKey = D.profile && D.profile.apiKey;
    if(!apiKey) return; // tanpa API key AI, cukup andalkan tebakan lokal (langkah 1) di atas
    this._lastNoteQueried = text;
    const myToken = ++this._reqToken;

    const type = (curTxType==='income') ? 'income' : 'expense';
    const cats = (typeof getCatsByType==='function') ? getCatsByType(type) : [];
    if(!cats || !cats.length) return;
    const catList = cats.map(c=>({kategori:c.name, subkategori:(c.subs||[]).map(s=>s.name)}));

    const systemPrompt =
      'Kamu asisten kategorisasi transaksi keuangan rumah tangga & bisnis kecil di Indonesia. '+
      'Tugas: dari catatan transaksi '+(type==='income'?'PEMASUKAN':'PENGELUARAN')+' yang ditulis bebas oleh user '+
      '(sering berisi beberapa barang belanjaan sekaligus, mis. "bayar galon+beras warung", atau singkatan/typo umum), '+
      'pilih SATU kategori & (kalau ada yang cocok) SATU subkategori yang PALING SESUAI, HANYA dari daftar kategori '+
      'milik user berikut — JANGAN membuat nama kategori baru di luar daftar ini:\n'+JSON.stringify(catList)+'\n\n'+
      'Balas HANYA dengan JSON valid, tanpa markdown/teks lain, format persis: '+
      '{"category":"<nama kategori PERSIS dari daftar, atau null kalau tidak ada yang cukup cocok>",'+
      '"subcategory":"<nama subkategori PERSIS dari daftar milik kategori itu, atau null>",'+
      '"confidence":"tinggi"|"sedang"|"rendah",'+
      '"alasan":"<alasan singkat 1 kalimat, bahasa Indonesia santai>"}';

    let res;
    try{
      res = await callAIProviderRaw(systemPrompt, [{role:'user', content:`Catatan transaksi: "${text}"`}], {maxTokens:300});
    }catch(e){ return; }
    if(myToken !== this._reqToken) return; // ada request lebih baru menyusul, buang hasil basi ini
    if(!res || !res.ok || !res.text) return; // gagal diam-diam, tidak ganggu user dgn error popup

    let parsed;
    try{
      const cleaned = res.text.replace(/```json|```/g,'').trim();
      parsed = JSON.parse(cleaned);
    }catch(e){ return; }
    if(!parsed || !parsed.category) return;

    const cat = cats.find(c=>c.name===parsed.category);
    if(!cat) return; // AI keluar dari daftar yang diizinkan -> abaikan drpd nyesatkan user
    const sub = parsed.subcategory ? (cat.subs||[]).find(s=>s.name===parsed.subcategory) : null;

    // Kalau field Keterangan sudah berubah lagi sejak request dikirim (user lanjut mengetik/hapus),
    // saran ini sudah basi — jangan ditampilkan supaya tidak membingungkan.
    const curNote = (document.getElementById('txNote')||{}).value?.trim();
    if(curNote !== text) return;

    this.renderSuggest({
      categoryName: cat.name,
      subName: sub ? sub.name : null,
      emoji: cat.emoji,
      source: 'ai',
      reasoning: parsed.alasan || null,
      note: text
    });
  },

  renderSuggest(info){
    const box = document.getElementById('txCatAiSuggest');
    if(!box) return;
    const label = info.source==='ai' ? '🤖 Saran AI' : '💡 Tebakan cepat';
    const subTxt = info.subName ? ` → ${escapeHtml(info.subName)}` : '';
    const reasonTxt = info.reasoning ? `<div style="font-size:11px;color:var(--text2);margin-top:3px">${escapeHtml(info.reasoning)}</div>` : '';
    box.dataset.catName = info.categoryName;
    box.dataset.subName = info.subName || '';
    box.dataset.note = info.note || '';
    box.innerHTML = `<div><b>${label}:</b> ${escapeHtml(info.emoji||'📦')} ${escapeHtml(info.categoryName)}${subTxt}</div>`+
      reasonTxt+
      `<div style="display:flex;gap:8px;margin-top:8px">`+
      `<button type="button" class="btn btn-primary btn-sm" style="flex:1;padding:8px" onclick="AutoKat.apply()">✅ Pakai</button>`+
      `<button type="button" class="btn btn-ghost btn-sm" style="flex:1;padding:8px" onclick="AutoKat.hideSuggest()">✕ Abaikan</button>`+
      `</div>`;
    box.classList.remove('u-dnone');
  },

  apply(){
    const box = document.getElementById('txCatAiSuggest');
    if(!box || !box.dataset.catName) return;
    const catName = box.dataset.catName;
    const subName = box.dataset.subName;
    const note = box.dataset.note;
    if(typeof selectTxCat==='function') selectTxCat(catName);
    else { const el=document.getElementById('txCat'); if(el) el.value=catName; }
    if(subName){
      const subEl=document.getElementById('txSubCat'); if(subEl) subEl.value=subName;
      if(typeof selectTxSubCat==='function') selectTxSubCat(subName);
    }
    this.learnFromNote(note, catName);
    this.hideSuggest();
    toast('✅ Kategori'+(subName?' & subkategori':'')+' terisi dari saran AI');
  },

  // "Ajari" heuristik lokal (D.learnedItemCat, dipakai bareng Scan Struk) dari kata-kata kunci di
  // catatan ini, supaya pola serupa ke depan bisa langsung ketebak GRATIS tanpa panggil AI lagi.
  // Beda dari learnCatFromItemName() bawaan (scan-ocr.js) yang cuma ambil 1 kata pertama —
  // di sini ambil beberapa kata sekaligus & buang kata generik (STOPWORDS), supaya kata kunci yang
  // tersimpan lebih spesifik & tidak gampang salah nebak transaksi lain yg tidak nyambung.
  learnFromNote(note, catName){
    if(!note || !catName) return;
    const words = String(note).toLowerCase()
      .replace(/[^a-z0-9\s]/g,' ')
      .split(/\s+/)
      .filter(w=>w.length>=4 && !this.STOPWORDS.has(w) && !/^\d+$/.test(w));
    if(!words.length) return;
    if(!D.learnedItemCat) D.learnedItemCat={};
    words.slice(0,4).forEach(w=>{ D.learnedItemCat[w]=catName; });
    if(typeof save==='function') save();
  }
};

// tagihan-kalender.js — Modul Tagihan/Bill (CRUD, riwayat, filter, arsip) & Kalender Jatuh Tempo
// PENTING: file ini HARUS dimuat sesuai urutan build.js (GROUP_A/GROUP_B) karena beberapa modul saling referensi. Urutan grup ini: data-default.js, features-helpers-global-security.js, diagnostik-versi.js, format-tema.js, error-handler.js, helper-teks.js, keamanan-pin.js, modal-navigasi.js, reset-gaji-mingguan.js, debug-console.js, pengaturan-search.js, onboarding.js, kalkulator-input.js, scan-ocr.js, filter-laporan.js, akun.js, gaji-calc.js, transaksi.js, profil-pengaturan.js, kategori.js, tagihan-kalender.js, backup-restore.js, payroll-absensi.js, features-tukang-kendaraan-storage.js, features-aiwidget-reminder-gdrive-search.js, features-sheets-pwa-selftest.js

function setBillType(t){
curBillType=t;
document.getElementById('billBtnTagihan').className='type-btn'+(t==='tagihan'?' at':'');
document.getElementById('billBtnLangganan').className='type-btn'+(t==='langganan'?' ai':'');
}
function updateBillSubCatOptions(){
const catName=document.getElementById('billCat').value;
const wrap=document.getElementById('billSubWrap');
const sel=document.getElementById('billSubCat');
if(!wrap||!sel)return;
const cat=catName?getCatByType(catName,'expense'):null;
if(cat&&cat.subs&&cat.subs.length){
wrap.style.display='block';
sel.innerHTML='<option value="">Tanpa subkategori</option>'+cat.subs.map(s=>`<option value="${escapeHtml(s.name)}">${escapeHtml(s.name)}</option>`).join('');
} else {
wrap.style.display='none';
sel.innerHTML='';
}
}
function openBillModal(editId){
billEditId=editId!==undefined?editId:null;
if(billEditId!==null){
const b=D.bills.find(x=>x.id===billEditId);
if(b&&b.kind==='cicilan'){
toast('💳 Cicilan diedit lewat transaksi terkait — buka 📋 Riwayat Pembayaran');
openBillHistory(billEditId);
return;
}
if(b&&b.kind==='utang'&&b.debtId){
toast('📕 Cicilan utang ini disinkron dari Buku Utang — edit di sana');
goToList('debtList',null);
return;
}
}
const cats=getCatsByType('expense');
document.getElementById('billCat').innerHTML='<option value="">Tanpa kategori</option>'+cats.map(c=>`<option value="${escapeHtml(c.name)}">${c.emoji} ${escapeHtml(c.name)}</option>`).join('');
document.getElementById('billAcc').innerHTML=D.accounts.map(a=>`<option value="${a.id}">${a.emoji} ${escapeHtml(a.name)}</option>`).join('');
if(billEditId!==null){
const b=D.bills.find(x=>x.id===billEditId);
document.getElementById('billModalTitle').textContent='Edit Tagihan';
document.getElementById('billName').value=b.name;
document.getElementById('billAmt').value=b.shared?b.totalAmount:b.amount;
document.getElementById('billDue').value=b.nextDue;
document.getElementById('billFreq').value=b.freq;
document.getElementById('billCat').value=b.category||'';
updateBillSubCatOptions();
document.getElementById('billSubCat').value=b.subcategory||'';
document.getElementById('billAcc').value=b.accountId||D.accounts[0]?.id||'';
document.getElementById('billNote').value=b.note||'';
setBillType(b.kind);
document.getElementById('billShared').checked=!!b.shared;
document.getElementById('billSharedPct').value=b.sharedPct||50;
toggleBillSharedFields();
} else {
document.getElementById('billModalTitle').textContent='Tambah Tagihan/Langganan';
document.getElementById('billName').value='';
document.getElementById('billAmt').value='';
document.getElementById('billDue').value=new Date().toISOString().split('T')[0];
document.getElementById('billFreq').value='bulanan';
document.getElementById('billCat').value='';
updateBillSubCatOptions();
document.getElementById('billAcc').value=D.accounts[0]?.id||'';
document.getElementById('billNote').value='';
setBillType('tagihan');
document.getElementById('billShared').checked=false;
document.getElementById('billSharedPct').value=50;
toggleBillSharedFields();
}
openModal('billModal');
}
function toggleBillSharedFields(){
const shared=document.getElementById('billShared').checked;
document.getElementById('billSharedWrap').style.display=shared?'block':'none';
document.getElementById('billAmtLabel').textContent=shared?'Jumlah Total per Periode (Rp)':'Jumlah per Periode (Rp)';
updateBillSharedPreview();
}
function updateBillSharedPreview(){
const previewEl=document.getElementById('billSharedPreview');
if(!previewEl)return;
if(!document.getElementById('billShared').checked){previewEl.textContent='';return;}
const total=parseFloat(document.getElementById('billAmt').value)||0;
const pct=Math.min(99,Math.max(1,parseFloat(document.getElementById('billSharedPct').value)||50));
const porsi=Math.round(total*pct/100);
previewEl.textContent=total>0?`👫 Porsi kamu: ${fmt(porsi)} dari total ${fmt(total)} (sisanya ${fmt(total-porsi)} ditanggung pihak lain)`:'';
}
function saveBill(){return withSaveGuard('bill','billModal',_saveBillInner);}
function _saveBillInner(){
const name=document.getElementById('billName').value.trim();
const rawAmt=parseFloat(document.getElementById('billAmt').value);
const due=document.getElementById('billDue').value;
if(!name||!rawAmt||!due){toast('⚠️ Lengkapi nama, jumlah, dan tanggal');return;}
const shared=document.getElementById('billShared').checked;
const sharedPct=shared?Math.min(99,Math.max(1,parseFloat(document.getElementById('billSharedPct').value)||50)):null;
const amt=shared?Math.round(rawAmt*sharedPct/100):rawAmt;
const data={
name,amount:amt,nextDue:due,
freq:document.getElementById('billFreq').value,
category:document.getElementById('billCat').value,
subcategory:document.getElementById('billSubCat')?document.getElementById('billSubCat').value:'',
accountId:document.getElementById('billAcc').value||D.accounts[0]?.id,
note:document.getElementById('billNote').value,
kind:curBillType,
shared:shared,
sharedPct:shared?sharedPct:null,
totalAmount:shared?rawAmt:null
};
if(billEditId!==null){
const idx=D.bills.findIndex(b=>b.id===billEditId);
D.bills[idx]={...D.bills[idx],...data};
} else {
D.bills.push({id:uid(),...data});
}
save();closeModal('billModal');refreshBillEverywhere();toast('✅ Tagihan tersimpan');
}
async function delBill(id){
const b=D.bills.find(x=>x.id===id);
const msg=(b&&b.kind==='utang')?'Hapus tagihan ini? Utangnya di Buku Utang TETAP ada, cuma pengingat cicilan bulanannya yg hilang (akan dibuat ulang otomatis kalau data utang itu diedit/disimpan lagi).':'Hapus tagihan ini?';
if(!await askConfirm(msg))return;
if(b&&b.kind==='utang'&&b.debtId){
const dbt=D.debts.find(x=>sameId(x.id,b.debtId));
if(dbt&&sameId(dbt.billId,id))dbt.billId=null;
}
D.bills=D.bills.filter(b=>b.id!==id);
save();refreshBillEverywhere();renderDebtList();toast('🗑 Tagihan dihapus');
}
function refreshBillEverywhere(){
renderBillList();
renderSettings();
renderDashboard();
checkBills();
renderBillHistory();
const archModal=document.getElementById('billArchiveModal');
if(archModal&&archModal.classList.contains('open'))renderBillArchive();
}
let curBillHistoryId=null, curBillHistoryEditTxId=null;
function openBillHistory(billId){
curBillHistoryId=billId;
openModal('billHistoryModal');
renderBillHistory();
}
/* moved to modules-render.js: renderBillHistory */
function editBillHistoryTx(txId){
const t=D.transactions.find(x=>x.id===txId);
if(!t)return;
curBillHistoryEditTxId=txId;
document.getElementById('bhTanggal').value=t.date;
document.getElementById('bhJumlah').value=t.amount;
document.getElementById('bhCatatan').value=t.note||'';
openModal('billHistoryEditModal');
}
function saveBillHistoryEdit(){
if(!curBillHistoryEditTxId)return;
const t=D.transactions.find(x=>x.id===curBillHistoryEditTxId);
if(!t){toast('⚠️ Transaksi tidak ditemukan');return;}
const tanggal=document.getElementById('bhTanggal').value;
const jumlah=parseFloat(document.getElementById('bhJumlah').value);
const catatan=document.getElementById('bhCatatan').value;
if(!tanggal){toast('⚠️ Tanggal wajib diisi');return;}
if(!jumlah||jumlah<=0){toast('⚠️ Jumlah harus lebih dari 0');return;}
t.date=tanggal;
t.amount=jumlah;
t.note=catatan;
save();
closeModal('billHistoryEditModal');
renderDashboard();renderKeuangan();renderBillHistory();
toast('✅ Riwayat pembayaran diperbarui');
}
async function deleteBillHistoryTx(){
if(!curBillHistoryEditTxId)return;
const t=D.transactions.find(x=>x.id===curBillHistoryEditTxId);
if(!t)return;
if(!await askConfirm('Hapus riwayat pembayaran ini? Kalau ini cicilan, sisa tenor & jatuh tempo tagihan akan dikembalikan.'))return;
let linkedBill=t.billLinkId?D.bills.find(b=>b.id===t.billLinkId):null;
let restoredFromArchive=false;
if(!linkedBill&&t.billLinkId){
const archIdx=(D.billsArchive||[]).findIndex(b=>b.id===t.billLinkId);
if(archIdx>-1){
linkedBill=D.billsArchive[archIdx];
delete linkedBill.completedAt;
D.billsArchive.splice(archIdx,1);
D.bills.push(linkedBill);
restoredFromArchive=true;
}
}
if(linkedBill&&linkedBill.kind==='cicilan'&&linkedBill.sisaTenor!=null){
linkedBill.sisaTenor+=1;
const d=new Date(linkedBill.nextDue);
d.setMonth(d.getMonth()-1);
linkedBill.nextDue=d.toISOString().split('T')[0];
}
if(linkedBill&&linkedBill.kind==='utang'&&linkedBill.debtId){
const dbt=D.debts.find(x=>sameId(x.id,linkedBill.debtId));
if(dbt){
dbt.nilai=(dbt.nilai||0)+t.amount;
if(dbt.lunas){dbt.lunas=false;dbt.billId=linkedBill.id;}
}
const d=new Date(linkedBill.nextDue);
d.setMonth(d.getMonth()-1);
linkedBill.nextDue=d.toISOString().split('T')[0];
}
D.transactions=D.transactions.filter(x=>x.id!==curBillHistoryEditTxId);
curBillHistoryEditTxId=null;
save();
closeModal('billHistoryEditModal');
renderDashboard();renderKeuangan();renderBillList();renderSettings();checkBills();renderBillHistory();renderBillArchive();
renderDebtList();renderKekayaanBersih();hitungZakatMaal();
const msg=restoredFromArchive?', tagihan diaktifkan lagi (belum lunas)':(linkedBill&&linkedBill.kind==='cicilan'?', sisa tenor dikembalikan':'');
toast('🗑 Riwayat pembayaran dihapus'+msg);
}
async function markBillPaid(id){
const b=D.bills.find(x=>x.id===id);
if(!b)return;
const label=b.kind==='cicilan'&&b.sisaTenor!=null?` (cicilan ke-${(b.tenor||0)-(b.sisaTenor||0)+1} dari ${b.tenor||'?'}x)`:'';
const sharedLabel=b.shared?` (porsi kamu ${b.sharedPct}% dari total ${fmtFull(b.totalAmount)})`:'';
if(!await askConfirm(`Bayar "${escapeHtml(b.name)}"${label}${sharedLabel} sebesar ${fmtFull(b.amount)}?`,{danger:false,okText:'Ya, Bayar',icon:'💸'}))return;
D.transactions.push({id:uid(),type:'expense',amount:b.amount,category:b.category||'Tagihan',subcategory:'',accountId:b.accountId||D.accounts[0]?.id||'',note:'Bayar: '+b.name,date:new Date().toISOString().split('T')[0],payMethod:b.kind,billLinkId:b.id});
if(b.kind==='utang'&&b.debtId){
const dbt=D.debts.find(x=>sameId(x.id,b.debtId));
if(dbt){
dbt.nilai=Math.max(0,(dbt.nilai||0)-b.amount);
if(dbt.nilai<=0){
dbt.lunas=true;dbt.billId=null;
if(!D.billsArchive)D.billsArchive=[];
D.billsArchive.push({...b,completedAt:new Date().toISOString().split('T')[0]});
D.bills=D.bills.filter(x=>x.id!==id);
save();refreshBillEverywhere();renderDebtList();renderKekayaanBersih();hitungZakatMaal();
toast('🎉 Utang '+dbt.name+' LUNAS!');return;
}
}
}
if(b.kind==='cicilan'&&b.sisaTenor!=null){
b.sisaTenor-=1;
if(b.sisaTenor<=0){
if(!D.billsArchive)D.billsArchive=[];
D.billsArchive.push({...b,completedAt:new Date().toISOString().split('T')[0]});
D.bills=D.bills.filter(x=>x.id!==id);
save();refreshBillEverywhere();
toast('🎉 Cicilan '+b.name+' LUNAS!');return;
}
}
const d=new Date(b.nextDue);
if(b.freq==='bulanan')d.setMonth(d.getMonth()+1);
else if(b.freq==='mingguan')d.setDate(d.getDate()+7);
else if(b.freq==='tahunan')d.setFullYear(d.getFullYear()+1);
else{
if(!D.billsArchive)D.billsArchive=[];
D.billsArchive.push({...b,completedAt:new Date().toISOString().split('T')[0]});
D.bills=D.bills.filter(x=>x.id!==id);
save();refreshBillEverywhere();
toast('✅ Tagihan selesai & tercatat');return;
}
b.nextDue=d.toISOString().split('T')[0];
save();refreshBillEverywhere();
if(b.kind==='utang'){renderDebtList();renderKekayaanBersih();hitungZakatMaal();}
const sisaMsg=b.sisaTenor!=null?` Sisa ${b.sisaTenor}x lagi.`:'';
toast('✅ Dibayar & dijadwalkan ulang.'+sisaMsg);
}
function openBillArchive(){
renderBillArchive();
openModal('billArchiveModal');
}
/* moved to modules-render.js: renderBillArchive */
let billFilterStatus='all', billFilterKategori='all', billFilterBulan='all', billFilterTahun='all';
function toggleBillFilterPanel(){
const panel=document.getElementById('billFilterPanel');
if(!panel)return;
const willOpen=panel.style.display==='none';
panel.style.display=willOpen?'block':'none';
const btn=document.getElementById('billFilterToggleBtn');
if(btn)btn.classList.toggle('active',willOpen);
}
function applyBillFilter(){
const elS=document.getElementById('billFilterStatus'), elK=document.getElementById('billFilterKategori'),
elB=document.getElementById('billFilterBulan'), elT=document.getElementById('billFilterTahun');
if(elS)billFilterStatus=elS.value;
if(elK)billFilterKategori=elK.value;
if(elB)billFilterBulan=elB.value;
if(elT)billFilterTahun=elT.value;
renderBillList();
}
function resetBillFilter(){
billFilterStatus='all';billFilterKategori='all';billFilterBulan='all';billFilterTahun='all';
const elS=document.getElementById('billFilterStatus'), elK=document.getElementById('billFilterKategori'),
elB=document.getElementById('billFilterBulan'), elT=document.getElementById('billFilterTahun');
if(elS)elS.value='all';
if(elK)elK.value='all';
if(elB)elB.value='all';
if(elT)elT.value='all';
renderBillList();
}
function populateBillFilterOptions(){
const elK=document.getElementById('billFilterKategori'), elT=document.getElementById('billFilterTahun');
if(!elK||!elT)return;
const all=[...D.bills,...(D.billsArchive||[])];
const kategoris=[...new Set(all.map(b=>b.category).filter(Boolean))].sort();
const prevK=elK.value;
elK.innerHTML='<option value="all">Semua Kategori</option>'+kategoris.map(k=>`<option value="${escapeHtml(k)}">${escapeHtml(k)}</option>`).join('');
elK.value=kategoris.includes(prevK)?prevK:'all';
billFilterKategori=elK.value;
const tahuns=[...new Set(all.map(b=>{const d=new Date(b.kind==='cicilan'&&b.completedAt?b.completedAt:b.nextDue);return isNaN(d)?null:d.getFullYear();}).filter(Boolean))].sort((a,b)=>b-a);
const prevT=elT.value;
elT.innerHTML='<option value="all">Semua Tahun</option>'+tahuns.map(t=>`<option value="${t}">${t}</option>`).join('');
elT.value=tahuns.map(String).includes(prevT)?prevT:'all';
billFilterTahun=elT.value;
}
/* moved to modules-render.js: renderBillList */
function openBillActionsMenu(id){
const b=D.bills.find(x=>x.id===id);
if(!b)return;
document.getElementById('billActionsTitle').textContent=`🔔 ${b.name}`;
document.getElementById('billActionsList').innerHTML=`
    <div class="bill-action-row" data-onclick="closeQS('qsBillActions');shareBillWA(${id})"><span class="bar-icon" style="color:#25D366">💬</span> Kirim ke WhatsApp</div>
    <div class="bill-action-row" data-onclick="closeQS('qsBillActions');openBillHistory(${id})"><span class="bar-icon u-cacc3">📋</span> Riwayat Pembayaran</div>
    <div class="bill-action-row" data-onclick="closeQS('qsBillActions');openBillModal(${id})"><span class="bar-icon u-cacc">✏️</span> Edit</div>
    <div class="bill-action-row danger" data-onclick="closeQS('qsBillActions');delBill(${id})"><span class="bar-icon">🗑</span> Hapus</div>`;
openQS('qsBillActions');
}
let billCalYear=null, billCalMonth=null, billCalSelectedDate=null;
const BILLCAL_MAX_ITER=600;
function getBillOccurrencesInRange(b,rangeStart,rangeEnd){
const occurrences=[];
if(!b.nextDue||isNaN(new Date(b.nextDue).getTime()))return occurrences;
if(b.freq==='sekali'){
const d=new Date(b.nextDue);
if(d>=rangeStart&&d<=rangeEnd)occurrences.push(new Date(d));
return occurrences;
}
const maxOcc=(b.kind==='cicilan'&&b.sisaTenor!=null)?b.sisaTenor:Infinity;
let d=new Date(b.nextDue);
let i=0;
while(i<maxOcc&&i<BILLCAL_MAX_ITER&&d<=rangeEnd){
if(d>=rangeStart&&d<=rangeEnd)occurrences.push(new Date(d));
const nd=new Date(d);
if(b.freq==='bulanan')nd.setMonth(nd.getMonth()+1);
else if(b.freq==='mingguan')nd.setDate(nd.getDate()+7);
else if(b.freq==='tahunan')nd.setFullYear(nd.getFullYear()+1);
else break;
d=nd;i++;
}
return occurrences;
}
function cashflowActionSuggestion(deficitAmount,days){
if(!deficitAmount||deficitAmount<=0)return '';
const d=Math.max(1,Math.round(days||30));
const perDay=deficitAmount/d;
return `💡 Saran: kurangi pengeluaran non-wajib ≈${fmtFull(deficitAmount)} (≈${fmtFull(perDay)}/hari selama ${d} hari ke depan), atau geser/tunda sebagian tagihan/cicilan yang bisa ditunda.`;
}
/* moved to modules-render.js: renderDashCashflowForecast */
function getBillOccurrencesInMonth(b,year,month){
const monthStart=new Date(year,month,1);
const monthEnd=new Date(year,month+1,0,23,59,59);
const occurrences=[];
if(!b.nextDue||isNaN(new Date(b.nextDue).getTime()))return occurrences;
if(b.freq==='sekali'){
const d=new Date(b.nextDue);
if(d>=monthStart&&d<=monthEnd)occurrences.push(new Date(d));
return occurrences;
}
const maxOcc=(b.kind==='cicilan'&&b.sisaTenor!=null)?b.sisaTenor:Infinity;
let d=new Date(b.nextDue);
let i=0;
while(i<maxOcc&&i<BILLCAL_MAX_ITER&&d<=monthEnd){
if(d>=monthStart&&d<=monthEnd)occurrences.push(new Date(d));
const nd=new Date(d);
if(b.freq==='bulanan')nd.setMonth(nd.getMonth()+1);
else if(b.freq==='mingguan')nd.setDate(nd.getDate()+7);
else if(b.freq==='tahunan')nd.setFullYear(nd.getFullYear()+1);
else break;
d=nd;i++;
}
return occurrences;
}
function openBillCalendar(){
const now=new Date();
billCalYear=now.getFullYear();billCalMonth=now.getMonth();
billCalSelectedDate=now.toISOString().split('T')[0];
renderBillCalendar();
openModal('billCalendarModal');
}
function navBillCalendar(dir){
billCalMonth+=dir;
if(billCalMonth<0){billCalMonth=11;billCalYear--;}
else if(billCalMonth>11){billCalMonth=0;billCalYear++;}
billCalSelectedDate=null;
renderBillCalendar();
}
function selectBillCalDay(dateStr){
billCalSelectedDate=dateStr;
renderBillCalendar();
}
/* moved to modules-render.js: renderBillCalendar */
function getBillStats(){
const now=new Date(),m=now.getMonth(),y=now.getFullYear();
const today=new Date();today.setHours(0,0,0,0);
const monthTotal=D.bills.filter(b=>{const d=new Date(b.nextDue);return d.getMonth()===m&&d.getFullYear()===y;}).reduce((s,b)=>s+b.amount,0);
const withDiff=D.bills.map(b=>({b,diff:Math.ceil((new Date(b.nextDue)-today)/(1000*60*60*24))}));
const overdue=withDiff.filter(x=>x.diff<0);
const soon=withDiff.filter(x=>x.diff>=0&&x.diff<=7);
const outstanding=D.bills.filter(b=>b.kind==='cicilan'&&b.sisaTenor!=null).reduce((s,b)=>s+b.amount*b.sisaTenor,0);
const nearest=[...withDiff].sort((a,b)=>a.diff-b.diff).slice(0,3);
return{monthTotal,overdueCount:overdue.length,soonCount:soon.length,outstanding,nearest};
}
function updateBillStatGrid(prefix){
const s=getBillStats();
const mt=document.getElementById(prefix+'MonthTotal'); if(mt)mt.textContent=fmt(s.monthTotal);
const sc=document.getElementById(prefix+'SoonCount'); if(sc)sc.textContent=s.soonCount;
const os=document.getElementById(prefix+'Outstanding'); if(os)os.textContent=fmt(s.outstanding);
}
// getBillAnomalyInfo — dipakai renderBillList() utk kasih badge peringatan "⚠️ Naik X% dari
// biasanya" di tagihan yang nominal terbarunya (b.amount, dipakai sbg preset saat markBillPaid())
// jauh lebih tinggi dari rata-rata histori pembayaran asli (D.transactions dgn billLinkId===b.id).
// Berguna utk tagihan yang nominalnya memang berubah tiap periode (listrik/pulsa/langganan naik
// harga), beda dari cicilan yang biasanya fix — bisa nunjukin salah catat ATAU tarif beneran naik,
// keduanya sama-sama layak dicek user sebelum bayar. Butuh minimal 2 histori pembayaran biar tidak
// false-positive dari kebetulan/variasi normal (baru 1x pembayaran belum ada "biasanya" yg valid).
// Rule-based & gratis (bukan panggilan AI), threshold 25% kenaikan dianggap "signifikan".
const BILL_ANOMALY_THRESHOLD_PCT=25;
function getBillAnomalyInfo(billId,currentAmount){
if(!currentAmount||currentAmount<=0)return null;
const history=D.transactions.filter(t=>t.billLinkId===billId).sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,3);
if(history.length<2)return null;
const avgPrev=history.reduce((s,t)=>s+t.amount,0)/history.length;
if(avgPrev<=0)return null;
const pctChange=Math.round(((currentAmount-avgPrev)/avgPrev)*100);
if(pctChange<BILL_ANOMALY_THRESHOLD_PCT)return null;
return{avgPrev,pctChange,count:history.length};
}
/* moved to modules-render.js: renderDashboardBills */
function checkBills(){
const banner=document.getElementById('billBanner');
if(!banner)return;
const today=new Date();today.setHours(0,0,0,0);
const soon=D.bills.filter(b=>{const d=new Date(b.nextDue);const diff=Math.ceil((d-today)/(1000*60*60*24));return diff<=3;});
if(soon.length){
banner.classList.remove('hidden');
document.getElementById('billBannerTitle').textContent=soon.length+' tagihan akan jatuh tempo';
document.getElementById('billBannerSub').textContent=soon.map(b=>b.name).join(', ');
} else banner.classList.add('hidden');
}
/* moved to modules-render.js: renderLDR */

// backup-restore.js — Export/import/backup data (satu domain penuh: CSV/JSON export laporan, backup
// terjadwal & manual per-modul, restore dari file backup, import dari Cashew/CSV lain, import Car Notes)
// (v89): blok "deteksi item checkout dari screenshot belanja" sudah dipindah ke scan-ocr.js — domainnya OCR.
// (v90): blok wrapper FI (kebebasan finansial) sudah digabung ke modules-calc.js, persis di sebelah objek FI
// yang dibungkusnya.
// (v91): blok wrapper Budget sudah digabung ke features-budget-laporan-carnotes-pelanggan.js, persis di
// sebelah objek Budget yang dibungkusnya. Lihat PEMISAHAN-FILE-ROADMAP.md.
// (v92): blok "list transaksi & cashflow forecast" (txHTML/delTx/computeCashflowForecast/dll) sudah
// dipindah ke transaksi.js — domainnya sama-sama seputar data transaksi.
// (v93): blok Payroll (const Payroll={...}, Absensi & Kalkulator Gaji Mingguan) sudah dipindah ke file
// baru payroll-absensi.js — sudah rapi sbg 1 objek modul, jadi dapat file domain sendiri.
// (v94): file di-rename dari features-fi-checkoutscan-importexport-payroll.js jadi backup-restore.js —
// langkah TERAKHIR dari pembedahan file lama ini. 2 sisa deklarasi nyasar juga dituntaskan lebih dulu:
// _lapLastFilterSig dipindah ke filter-laporan.js (gabung bareng lapTxPage yg memakainya bareng), dan
// toggleMs/showTargetAccountTx/addTarget/delTarget/delReminder dipindah ke transaksi.js (gabung bareng
// saveTarget/saveCatatan/saveReminder/saveLDR yang sudah ada di sana sejak v83). Setelah itu, tidak ada
// lagi kode yang perlu DIPINDAHKAN dari file ini — isinya sudah murni 1 domain (export/import/backup),
// jadi cukup rename + update semua referensi nama file. Lihat PEMISAHAN-FILE-ROADMAP.md.
// PENTING: file ini HARUS dimuat sesuai urutan build.js (GROUP_A/GROUP_B) karena beberapa modul saling referensi. Urutan grup ini: data-default.js, features-helpers-global-security.js, diagnostik-versi.js, format-tema.js, error-handler.js, helper-teks.js, keamanan-pin.js, modal-navigasi.js, reset-gaji-mingguan.js, debug-console.js, pengaturan-search.js, onboarding.js, kalkulator-input.js, scan-ocr.js, filter-laporan.js, akun.js, gaji-calc.js, transaksi.js, profil-pengaturan.js, kategori.js, tagihan-kalender.js, backup-restore.js, payroll-absensi.js, features-tukang-kendaraan-storage.js, features-aiwidget-reminder-gdrive-search.js, features-sheets-pwa-selftest.js

/* moved to modules-render.js: renderLaporan */
/* moved to modules-render.js: renderGrafik */
function exportCSV(){
const {from,to}=getRange();
const f=getLaporanFilters();
const txs=D.transactions.filter(t=>{const d=new Date(t.date);return d>=from&&d<=to&&t.type!=='transfer_in'&&t.type!=='transfer_out'&&txMatchesFilters(t,f);});
const rows=[['Tanggal','Tipe','Kategori','Subkategori','Akun','Metode','Jumlah','Keterangan'],...txs.map(t=>{
const accName=D.accounts.find(a=>a.id===t.accountId)?.name||'';
return[t.date,t.type==='income'?'Pemasukan':'Pengeluaran',t.category,t.subcategory||'',accName,t.payMethod||'tunai',t.amount,t.note||''];
})];
const blob=new Blob([rows.map(r=>r.join(',')).join('\n')],{type:'text/csv'});
const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='laporan-W-'+new Date().toISOString().split('T')[0]+'.csv';a.click();
}
function exportJSON(){
const {from,to}=getRange();
const f=getLaporanFilters();
const txs=D.transactions.filter(t=>{const d=new Date(t.date);return d>=from&&d<=to&&t.type!=='transfer_in'&&t.type!=='transfer_out'&&txMatchesFilters(t,f);});
const blob=new Blob([JSON.stringify(txs,null,2)],{type:'application/json'});
const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='laporan-W-'+new Date().toISOString().split('T')[0]+'.json';a.click();
}
function buildBackupPayload(){
const backupD={...D,chatHistory:[]};
if(backupD.profile){
backupD.profile={...backupD.profile};
delete backupD.profile.apiKey;
}
return backupD;
}
function exportData(){
const backupD=buildBackupPayload();
const blob=new Blob([JSON.stringify(backupD,null,2)],{type:'application/json'});
const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='backup-keluarga-W-'+new Date().toISOString().split('T')[0]+'.json';a.click();
D.lastBackup=new Date().toISOString();save();
document.getElementById('lastBackup').textContent=new Date().toLocaleDateString('id-ID');
document.getElementById('backupBadge').textContent='💾 Backup';
document.getElementById('backupBanner').classList.add('hidden');
toast('✅ Backup berhasil!');
}
async function runFullBackup(){
if(_saveGuards['fullBackup']){toast('⏳ Backup sebelumnya masih berjalan...');return;}
_saveGuards['fullBackup']=true;
const btn=document.getElementById('backupBadge');
const btnOriginal=btn?btn.textContent:null;
if(btn)btn.textContent='⏳ Backup...';
const done=[];
const skipped=[];
const errors=[];
try{
try{
const backupD=buildBackupPayload();
const blob=new Blob([JSON.stringify(backupD,null,2)],{type:'application/json'});
const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='backup-keluarga-W-'+new Date().toISOString().split('T')[0]+'.json';a.click();
D.lastBackup=new Date().toISOString();save();
const lb=document.getElementById('lastBackup'); if(lb)lb.textContent=new Date().toLocaleDateString('id-ID');
const bn=document.getElementById('backupBanner'); if(bn)bn.classList.add('hidden');
done.push('File lokal (JSON)');
}catch(e){
console.error('Backup file lokal gagal:',e);
errors.push('File lokal: '+(e.message||e));
}
if(gdriveAccessToken){
try{
const ok=await _uploadBackupToDriveInner(true);
if(ok)done.push('Google Drive'); else skipped.push('Google Drive (dilewati, lihat notifikasi)');
}catch(e){
console.error('Backup Drive gagal:',e);
errors.push('Google Drive: '+(e.message||e));
}
} else {
skipped.push('Google Drive (belum terhubung)');
}
if(gdriveAccessToken && D.googleSheets){
try{
const ok=await _sheetsSyncInner(true);
if(ok)done.push('Google Sheets'); else skipped.push('Google Sheets (dilewati, lihat notifikasi)');
}catch(e){
console.error('Sync Sheets gagal:',e);
errors.push('Google Sheets: '+(e.message||e));
}
} else {
skipped.push('Google Sheets (belum terhubung)');
}
if(!errors.length){
let msg='✅ Backup semua berhasil: '+done.join(', ')+'.';
if(skipped.length)msg+=' (Dilewati: '+skipped.join(', ')+')';
toast(msg,3200);
}else{
let msg='❌ Backup SEBAGIAN gagal. ';
if(done.length)msg+='Berhasil: '+done.join(', ')+'. ';
msg+='Gagal: '+errors.join(' | ');
toast(msg,6000);
}
} finally {
_saveGuards['fullBackup']=false;
if(btn)btn.textContent=done.includes('File lokal (JSON)')?'💾 Backup':(btnOriginal||'⚠️ Backup');
}
}
let backupModules={keuangan:true,carnotes:true,cobek:true,aset:true,renov:true,pensiunZakat:true,habit:true,lain:true};
function openBackupModal(){
document.getElementById('bPeriode').value='selamanya';
document.getElementById('bCustomRange').style.display='none';
document.getElementById('bTipe').value='semua';
document.getElementById('bFormat').value='json';
backupModules={keuangan:true,carnotes:true,cobek:true,aset:true,renov:true,pensiunZakat:true,habit:true,lain:true};
['bModKeuangan','bModCarnotes','bModCobek','bModAset','bModRenov','bModPensiunZakat','bModHabit','bModLain'].forEach(id=>document.getElementById(id).classList.add('active'));
openModal('backupModal');
}
function toggleBackupModule(mod,el){
backupModules[mod]=!backupModules[mod];
el.classList.toggle('active',backupModules[mod]);
}
function onBackupPeriodeChange(){
document.getElementById('bCustomRange').style.display=document.getElementById('bPeriode').value==='custom'?'block':'none';
}
function getBackupRange(){
const p=document.getElementById('bPeriode').value;
const now=new Date();
if(p==='hari')return{from:new Date(now.getFullYear(),now.getMonth(),now.getDate()),to:now};
if(p==='bulan')return{from:new Date(now.getFullYear(),now.getMonth(),1),to:now};
if(p==='tahun')return{from:new Date(now.getFullYear(),0,1),to:now};
if(p==='custom'){
const f=document.getElementById('bFrom').value,t=document.getElementById('bTo').value;
return{from:f?new Date(f):new Date(0),to:t?new Date(t+'T23:59:59'):now};
}
return{from:new Date(0),to:now};
}
function inRange(dateStr,from,to){const d=new Date(dateStr);return d>=from&&d<=to;}
function runBackup(){
const{from,to}=getBackupRange();
const tipe=document.getElementById('bTipe').value;
const format=document.getElementById('bFormat').value;
const out={schemaVersion:SCHEMA_VERSION,backupCreatedAt:new Date().toISOString()};
if(backupModules.keuangan){
out.transactions=D.transactions.filter(t=>inRange(t.date,from,to)&&(tipe==='semua'||t.type===tipe));
out.accounts=D.accounts;out.categories=D.categories;out.bills=D.bills;out.targets=D.targets;out.eduFunds=D.eduFunds||[];
out.billsArchive=(D.billsArchive||[]).filter(b=>inRange(b.tanggal||b.nextDue||b.createdAt||new Date().toISOString(),from,to)||true);
}
if(backupModules.carnotes){
out.vehicles=D.vehicles;out.sparepartCats=D.sparepartCats;out.partsStock=D.partsStock;
out.bbmLogs=D.bbmLogs.filter(b=>inRange(b.date,from,to));
out.servisLogs=D.servisLogs.filter(s=>inRange(s.date,from,to));
out.jalanLogs=D.jalanLogs.filter(j=>inRange(j.date,from,to));
out.kmLogs=D.kmLogs.filter(k=>inRange(k.date,from,to));
out.simList=D.simList||[];
}
if(backupModules.cobek){
out.products=D.products;
out.produsen=D.produsen;
out.cobekKategori=D.cobekKategori;
out.cobek=D.cobek.filter(c=>inRange(c.date,from,to));
}
if(backupModules.aset){
out.assets=D.assets||[];
out.debts=D.debts||[];
out.piutang=D.piutang||[];
out.wealthSnapshots=(D.wealthSnapshots||[]).filter(s=>inRange(s.date,from,to));
}
if(backupModules.renov){
out.renovProjects=D.renovProjects||[];
out.sewaKios=D.sewaKios||{units:[]};
}
if(backupModules.pensiunZakat){
out.pensiun=D.pensiun||null;
out.finansialFreedom=D.finansialFreedom||null;
out.pajakZakat=D.pajakZakat?{...D.pajakZakat,zakatLog:(D.pajakZakat.zakatLog||[]).filter(z=>inRange(z.tanggal,from,to))}:null;
out.assetAllocation=D.assetAllocation||null;
out.budgetReko=D.budgetReko||null;
}
if(backupModules.habit){
out.wishlist=D.wishlist||[];
out.lifeBalanceSnapshots=(D.lifeBalanceSnapshots||[]).filter(s=>inRange(s.date,from,to));
}
if(backupModules.lain){
out.profile=D.profile;
out.workDays=D.workDays.filter(w=>inRange(w.date,from,to));
out.catatan={
anak:(D.catatan.anak||[]).filter(c=>inRange(c.date,from,to))
};
out.milestones=D.milestones;
out.nextPulang=D.nextPulang;
out.reminders=D.reminders;
out.budgets=D.budgets;
out.notifSettings=D.notifSettings;
out.archiveHistory=D.archiveHistory||[];
}
if(!Object.keys(out).length){toast('⚠️ Pilih minimal 1 modul');return;}
const dateTag=new Date().toISOString().split('T')[0];
if(format==='json'){
const blob=new Blob([JSON.stringify(out,null,2)],{type:'application/json'});
const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='backup-W-'+dateTag+'.json';a.click();
} else {
const csvParts=[];
const toCSVRow=arr=>arr.map(v=>{v=(v===null||v===undefined)?'':String(v);return v.includes(',')||v.includes('"')?'"'+v.replace(/"/g,'""')+'"':v;}).join(',');
if(out.transactions){
csvParts.push('=== KEUANGAN: TRANSAKSI ===');
csvParts.push(toCSVRow(['Tanggal','Tipe','Kategori','Subkategori','Akun','Jumlah','Keterangan']));
out.transactions.forEach(t=>{
const accName=D.accounts.find(a=>a.id===t.accountId)?.name||'';
csvParts.push(toCSVRow([t.date,t.type==='income'?'Pemasukan':'Pengeluaran',t.category,t.subcategory||'',accName,t.amount,t.note||'']));
});
csvParts.push('');
}
if(out.bbmLogs){
csvParts.push('=== CAR NOTES: ISI BBM ===');
csvParts.push(toCSVRow(['Tanggal','Kendaraan','KM','Liter','Harga/Liter','Total Biaya','SPBU','Full Tank','Catatan']));
out.bbmLogs.forEach(b=>{
const vehName=D.vehicles.find(v=>v.id===b.vehicleId)?.name||'';
csvParts.push(toCSVRow([b.date,vehName,b.km,b.liter,b.harga||'',b.cost,b.spbu||'',b.fullTank?'Ya':'Tidak',b.note||'']));
});
csvParts.push('');
csvParts.push('=== CAR NOTES: SERVIS ===');
csvParts.push(toCSVRow(['Tanggal','Kendaraan','Item','KM','Biaya','Catatan']));
out.servisLogs.forEach(s=>{
const vehName=D.vehicles.find(v=>v.id===s.vehicleId)?.name||'';
csvParts.push(toCSVRow([s.date,vehName,s.item,s.km||'',s.cost,s.note||'']));
});
csvParts.push('');
csvParts.push('=== CAR NOTES: PERJALANAN ===');
csvParts.push(toCSVRow(['Tanggal','Kendaraan','Rute','Jarak (KM)','Catatan']));
out.jalanLogs.forEach(j=>{
const vehName=D.vehicles.find(v=>v.id===j.vehicleId)?.name||'';
csvParts.push(toCSVRow([j.date,vehName,j.rute,j.jarak||'',j.note||'']));
});
csvParts.push('');
}
if(out.cobek){
csvParts.push('=== SHOP: TRANSAKSI ===');
csvParts.push(toCSVRow(['Tanggal','Konsumen','No HP','Alamat','Item','Tipe Harga','Subtotal','Diskon','Ongkir','Total','Untung','Catatan']));
out.cobek.forEach(c=>{
if(c.items){
csvParts.push(toCSVRow([c.date,c.customer?.name||'',c.customer?.phone||'',c.customer?.address||'',c.items.map(i=>i.name+' x'+i.qty).join('; '),c.priceType||'',c.subtotal,c.diskon||0,c.ongkir||0,c.total,c.profit,c.note||'']));
} else {
csvParts.push(toCSVRow([c.date,'','','',(c.sets||'')+' set (data lama)','','','','',c.profit,c.profit,c.note||'']));
}
});
csvParts.push('');
csvParts.push('=== SHOP: ETALASE PRODUK ===');
csvParts.push(toCSVRow(['Nama Produk','Stok','Harga Beli','Harga Jual','Harga Reseller','Diskon %']));
(out.products||[]).forEach(p=>csvParts.push(toCSVRow([p.name,p.stock,p.hargaBeli,p.hargaJual,p.hargaReseller||'',p.diskonPersen||0])));
}
if(out.assets){
csvParts.push('=== ASET (BUKU ASET) ===');
csvParts.push(toCSVRow(['Nama','Jenis','Lokasi','Nilai Saat Ini','Modal Investasi','Tanggal Perolehan','Hitung ke Zakat Maal']));
out.assets.forEach(a=>csvParts.push(toCSVRow([a.name,a.jenis||'',a.lokasi||'',a.nilai||0,a.modalInvestasi||'',a.tanggal||'',a.zakatable?'Ya':'Tidak'])));
csvParts.push('');
csvParts.push('=== BUKU UTANG ===');
csvParts.push(toCSVRow(['Pemberi Pinjaman','Sisa Pokok','Bunga %/thn','Cicilan/Bulan','Jatuh Tempo','Lunas','Catatan']));
(out.debts||[]).forEach(d=>csvParts.push(toCSVRow([d.name,d.nilai||0,d.bunga||0,d.cicilanBulanan||'',d.jatuhTempo||'',d.lunas?'Ya':'Tidak',d.catatan||''])));
csvParts.push('');
csvParts.push('=== PIUTANG ===');
csvParts.push(toCSVRow(['Nama Peminjam','Jumlah','Tanggal Pinjam','Jatuh Tempo','Lunas','Catatan']));
(out.piutang||[]).forEach(p=>csvParts.push(toCSVRow([p.name,p.nilai||0,p.tanggal||'',p.jatuhTempo||'',p.lunas?'Ya':'Tidak',p.catatan||''])));
csvParts.push('');
}
if(out.renovProjects){
csvParts.push('=== PROYEK RENOVASI ===');
csvParts.push(toCSVRow(['Nama Proyek','Item','Ukuran/Kebutuhan','Harga','Sudah Dibeli','Tanggal Bayar','Catatan']));
out.renovProjects.forEach(p=>(p.items||[]).forEach(it=>csvParts.push(toCSVRow([p.name,it.name,it.ukuran||'',it.harga||0,it.paid?'Ya':'Belum',it.paidDate||'',it.note||'']))));
csvParts.push('');
}
if(out.pensiun||out.pajakZakat){
csvParts.push('=== DANA PENSIUN & ZAKAT/PAJAK (RINGKASAN) ===');
csvParts.push(toCSVRow(['Target Dana Pensiun','Usia Pensiun','Kontribusi Bulanan','Harga Emas/gram (Zakat)']));
csvParts.push(toCSVRow([out.pensiun?.targetDana||'',out.pensiun?.usiaPensiun||'',out.pensiun?.kontribusiBulanan||'',out.pajakZakat?.hargaEmasPerGram||'']));
csvParts.push('');
if(out.pajakZakat?.zakatLog?.length){
csvParts.push('=== RIWAYAT ZAKAT ===');
csvParts.push(toCSVRow(['Tanggal','Jenis','Jumlah']));
out.pajakZakat.zakatLog.forEach(z=>csvParts.push(toCSVRow([z.tanggal,z.jenis,z.jumlah])));
csvParts.push('');
}
}
if(out.wishlist){
csvParts.push('=== PRIORITAS BELANJA (WISHLIST) ===');
csvParts.push(toCSVRow(['Nama Barang','Harga','Kategori','Urgensi','Sudah Dibeli']));
(out.wishlist||[]).forEach(w=>csvParts.push(toCSVRow([w.name,w.price||0,w.cat||'',w.urgensi||'',w.bought?'Ya':'Belum'])));
csvParts.push('');
}
if(out.workDays){
csvParts.push('');
csvParts.push('=== GAJI / ABSENSI HARIAN ===');
csvParts.push(toCSVRow(['Tanggal','Jenis','Masuk','Pulang','Istirahat(menit)','Total Jam','Jam Lembur','Gaji Pokok/Borongan','Lembur','Total','Catatan Borongan']));
out.workDays.forEach(w=>csvParts.push(toCSVRow([w.date,w.jenis||'',w.masuk||'',w.pulang||'',w.istirahatMin??'',w.totalJam??'',w.jamLembur??'',w.pokok??'',w.lembur??'',w.total??'',w.borNote||''])));
csvParts.push('');
csvParts.push('=== PROFIL & GAJI POKOK ===');
csvParts.push(toCSVRow(['Nama','Gaji Pokok/Hari','Kiriman']));
if(out.profile)csvParts.push(toCSVRow([out.profile.nama||'',out.profile.gajiPokok||'',out.profile.kiriman||'']));
}
if(out.catatan){
csvParts.push('');
csvParts.push('=== CATATAN ANAK ===');
csvParts.push(toCSVRow(['Tanggal','Catatan']));
(out.catatan.anak||[]).forEach(c=>csvParts.push(toCSVRow([c.date,c.text||''])));
}
const blob=new Blob([csvParts.join('\n')],{type:'text/csv'});
const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='backup-W-'+dateTag+'.csv';a.click();
}
D.lastBackup=new Date().toISOString();save();
const lb=document.getElementById('lastBackup');if(lb)lb.textContent=new Date().toLocaleDateString('id-ID');
document.getElementById('backupBadge').textContent='💾 Backup';
document.getElementById('backupBanner').classList.add('hidden');
closeModal('backupModal');
toast('✅ Backup berhasil di-download!');
}
async function applyRestoredData(imp){
if(!imp||typeof imp!=='object'){await showAlertModal('File backup tidak dikenali (bukan format yang valid).',{icon:'❌',title:'Backup Tidak Valid'});return false;}
const knownKeys=['transactions','accounts','categories','bills','vehicles','products','cobek','catatan','workDays','profile','targets','eduFunds','sewaKios'];
if(!knownKeys.some(k=>imp[k]!==undefined)){await showAlertModal('File ini sepertinya bukan file backup aplikasi ini. Restore dibatalkan.',{icon:'❌',title:'Backup Tidak Valid'});return false;}
const backupVersion=imp.schemaVersion||0;
if(backupVersion>SCHEMA_VERSION){
const lanjut=await askConfirm('⚠️ File backup ini dibuat dari versi aplikasi yang LEBIH BARU dari yang sedang dipakai sekarang. Me-restore-nya mungkin membuat sebagian data tidak terbaca dengan benar.\n\nTetap lanjutkan restore?',{title:'Versi Backup Lebih Baru',okText:'Ya, Tetap Restore'});
if(!lanjut)return false;
}
try{
let snapJson;
if(D.profile && Object.prototype.hasOwnProperty.call(D.profile,'apiKey')){
const profileNoKey={...D.profile}; delete profileNoKey.apiKey;
snapJson=JSON.stringify({...D,profile:profileNoKey});
} else {
snapJson=JSON.stringify(D);
}
safeSetItem('kw_v4_prerestore',snapJson);
}catch(e){console.error('Gagal simpan snapshot pengaman:',e);}
const prevD=JSON.parse(JSON.stringify(D));
try{
D={...D,...imp};
applyRestoredDataMigrations();
runDataMigrations(backupVersion);
saveFlush();init();
return true;
}catch(e){
console.error('Restore gagal, mengembalikan data sebelumnya:',e);
D=prevD;
saveFlush();init();
await showAlertModal('Terjadi error saat restore, data dikembalikan ke sebelum restore agar tidak corrupt. Detail error ada di console.',{icon:'❌',title:'Restore Gagal'});
return false;
}
}
function applyRestoredDataMigrations(){
if(!D.categories)D.categories={income:JSON.parse(JSON.stringify(DEFAULT_CATS.income)),expense:JSON.parse(JSON.stringify(DEFAULT_CATS.expense))};
if(!D.accounts||!D.accounts.length)D.accounts=JSON.parse(JSON.stringify(DEFAULT_ACCOUNTS));
if(!D.bills)D.bills=[];
if(!D.billsArchive)D.billsArchive=[];
if(!D.vehicles||!D.vehicles.length)D.vehicles=[{id:'veh_1',name:'Vario 125',emoji:'🏍️',serviceIntervalKm:3000}];
D.vehicles.forEach(v=>{if(!v.serviceIntervalKm)v.serviceIntervalKm=3000;});
if(!D.bbmLogs)D.bbmLogs=[];
if(!D.servisLogs)D.servisLogs=[];
if(!D.jalanLogs)D.jalanLogs=[];
if(!D.kmLogs)D.kmLogs=[];
if(!D.sparepartCats||!D.sparepartCats.length)D.sparepartCats=JSON.parse(JSON.stringify(DEFAULT_SPAREPARTS));
D.sparepartCats.forEach(c=>{if(!c.code)c.code=codeFromName(c.name);});
if(!D.partsStock)D.partsStock=[];
if(!D.workDays)D.workDays=[];
if(!D.catatan)D.catatan={anak:[]};
if(!D.milestones)D.milestones=[false,false,false,false,false];
if(!D.chatHistory)D.chatHistory=[];
if(!D.cobek)D.cobek=[];
if(!D.products)D.products=[];
if(!D.produsen)D.produsen=[];
if(!D.cobekKategori||!D.cobekKategori.length)D.cobekKategori=JSON.parse(JSON.stringify(DEFAULT_COBEK_KATEGORI));
D.products.forEach(p=>{if(!p.hargaByProdusen)p.hargaByProdusen={};if(p.kategoriId===undefined)p.kategoriId='';if(p.produsenId===undefined)p.produsenId='';});
if(!D.categories.expense.some(c=>c.id==='cat_cbb'||/^bisnis$/i.test(c.name))){
D.categories.expense.push({id:'cat_cbb',name:'Bisnis',emoji:'🪨',subs:[{id:'sub_cbb_cobek',name:'Cobek'}]});
}
migrateCobekCategory();
if(!D.targets)D.targets=[];
if(!D.eduFunds)D.eduFunds=[];
if(!D.reminders)D.reminders=[];
if(!D.transactions)D.transactions=[];
if(!D.notifSettings)D.notifSettings={enabled:false,billDays:3,ldrDays:3};
if(!D.googleDrive)D.googleDrive={clientId:'',fileId:null,lastSync:null,autoSync:false};
if(!D.wealthSnapshots)D.wealthSnapshots=[];
if(!D.wishlist)D.wishlist=[];
D.cobek.forEach(c=>{if(c.delivered===undefined)c.delivered=true;});
}
async function importData(e){
const file=e.target.files[0];if(!file)return;
const r=new FileReader();
r.onload=async ev=>{
let imp;
try{
imp=JSON.parse(ev.target.result);
}catch{toast('❌ File tidak valid / rusak (bukan JSON)!');e.target.value='';return;}
const ok=await applyRestoredData(imp);
if(ok)toast('✅ Data di-restore! (semua tab: keuangan, kendaraan, bisnis shop, dll)');
e.target.value='';
};
r.readAsText(file);
}
let _autoBackupTriggered=false;
function _autoBackupIfOverdue(){
if(_autoBackupTriggered)return;
_autoBackupTriggered=true;
setTimeout(()=>{
try{
runFullBackup();
toast('📦 Backup otomatis dijalankan (sudah lewat 7 hari)',4000);
}catch(e){console.error('Auto-backup gagal:',e);}
},900);
}
function checkBackup(){
if(!D.lastBackup){document.getElementById('backupBanner').classList.remove('hidden');document.getElementById('backupBadge').textContent='⚠️ Backup';_autoBackupIfOverdue();return;}
const days=Math.floor((new Date()-new Date(D.lastBackup))/(1000*60*60*24));
if(days>=7){document.getElementById('backupBanner').classList.remove('hidden');document.getElementById('lastBackupDate').textContent=new Date(D.lastBackup).toLocaleDateString('id-ID');document.getElementById('backupBadge').textContent='⚠️ Backup';_autoBackupIfOverdue();}
if(D.lastBackup)document.getElementById('lastBackup').textContent=new Date(D.lastBackup).toLocaleDateString('id-ID');
}
function setImportType(type,el){
curImportType=type;
document.querySelectorAll('#importChips .chip-btn').forEach(b=>b.classList.remove('active'));
if(el)el.classList.add('active');
const guides={
cashew:`<div class="u-fs12 u-fw700 u-mb6">📱 Cara export dari Cashew:</div><div class="u-fs12 u-t2 u-lh16">1. Buka Cashew → Settings<br>2. Export → pilih format CSV<br>3. Kirim file ke HP Anda<br>4. Upload di sini</div>`,
csv:`<div class="u-fs12 u-fw700 u-mb6">📄 Format CSV yang didukung:</div><div class="u-fs12 u-t2 u-lh16">Kolom wajib: tanggal, jumlah, kategori<br>Kolom opsional: keterangan, tipe<br>Format tanggal: YYYY-MM-DD atau DD/MM/YYYY</div>`,
money:`<div class="u-fs12 u-fw700 u-mb6">📱 Cara export dari Money Manager:</div><div class="u-fs12 u-t2 u-lh16">1. Buka Money Manager → More<br>2. Backup/Restore → Export to Excel<br>3. Upload file CSV/XLS di sini</div>`,
spendee:`<div class="u-fs12 u-fw700 u-mb6">📱 Cara export dari Spendee:</div><div class="u-fs12 u-t2 u-lh16">1. Buka Spendee → Settings → Export Data<br>2. Pilih format CSV<br>3. Upload di sini</div>`
};
const g=document.getElementById('importGuide'); if(g) g.innerHTML=guides[type];
}
function handleImport(e){
const file=e.target.files[0];if(!file)return;
const r=new FileReader();
r.onload=async ev=>{
try{
const content=ev.target.result;
let imported=[];
let taxonomySummary=null;
if(file.name.endsWith('.json')){
const parsed=JSON.parse(content);
imported=Array.isArray(parsed)?parsed:(parsed.transactions||[]);
} else {
if(curImportType==='cashew'){
taxonomySummary=ensureCashewTaxonomy(content);
}
imported=parseCSVImport(content,curImportType);
}
if(imported.length===0){document.getElementById('importResult').innerHTML='<div class="u-cacc2 u-fs12" style="padding:8px">⚠️ Tidak ada data valid ditemukan</div>';return;}
let confirmMsg=`Ditemukan ${imported.length} transaksi.`;
if(taxonomySummary){
const {newAccounts,newCats,newSubs}=taxonomySummary;
if(newAccounts.length) confirmMsg+=`\n\n🆕 Akun baru dibuat (${newAccounts.length}): ${newAccounts.join(', ')}`;
if(newCats.length) confirmMsg+=`\n\n🆕 Kategori baru dibuat (${newCats.length}): ${newCats.join(', ')}`;
if(newSubs.length) confirmMsg+=`\n\n🆕 Subkategori baru (${newSubs.length}): ${newSubs.join(', ')}`;
if(!newAccounts.length && !newCats.length && !newSubs.length) confirmMsg+=`\n\n✅ Semua akun & kategori sudah cocok dengan yang ada, tidak ada yang baru dibuat.`;
confirmMsg+=`\n\nSetiap transaksi otomatis dicatat ke akun & kategori aslinya dari Cashew. Akun/kategori yang sudah ada TIDAK ditimpa.\n\nImport sekarang?`;
} else {
const defAccName=D.accounts[0]?.name||'akun pertama';
confirmMsg+=` Akan dicatat ke akun "${defAccName}" (bisa dipindah manual nanti). Import sekarang?`;
}
const confirmed=await askConfirm(confirmMsg,{danger:false,okText:'Ya, Import',icon:'📥'});
if(!confirmed){
if(curImportType==='cashew') await load();
return;
}
D.transactions=[...D.transactions,...imported];
save();renderDashboard();
let resultHTML=`<div class="u-cacc3 u-fs12 u-r8" style="padding:8px;background:var(--accent3-soft)">✅ Berhasil import ${imported.length} transaksi!`;
if(taxonomySummary){
const n=taxonomySummary.newAccounts.length+taxonomySummary.newCats.length+taxonomySummary.newSubs.length;
resultHTML+=n?` (${taxonomySummary.newAccounts.length} akun, ${taxonomySummary.newCats.length} kategori, ${taxonomySummary.newSubs.length} subkategori baru dibuat otomatis)`:' (semua akun & kategori sudah cocok)';
}
resultHTML+=`</div>`;
document.getElementById('importResult').innerHTML=resultHTML;
toast('✅ Import berhasil! '+imported.length+' transaksi');
populateCatFilter();
}catch(err){document.getElementById('importResult').innerHTML='<div class="u-cacc2 u-fs12" style="padding:8px">❌ Gagal baca file: '+err.message+'</div>';}
};
r.readAsText(file);
}
function importCarData(e){
const file=e.target.files[0]; if(!file)return;
const resultEl=document.getElementById('carImportResult');
resultEl.innerHTML='⏳ Memproses file...';
const reader=new FileReader();
reader.onload=function(ev){
try{
const content=ev.target.result;
if(!D.vehicles||!D.vehicles.length) D.vehicles=[{id:'veh_1',name:'Vario 125',emoji:'🏍️',serviceIntervalKm:3000}];
const selectedVehId=document.getElementById('carImportVehicle')?document.getElementById('carImportVehicle').value:'';
const vehId=(selectedVehId&&D.vehicles.find(v=>v.id===selectedVehId))?selectedVehId:D.vehicles[0].id;
let bbmCount=0, servisCount=0, skipCount=0, autoDetectCount=0, vehColDetected=false;
function matchVehicleFromText(text){
if(!text)return null;
const t=text.toString().trim().toLowerCase();
if(!t)return null;
return D.vehicles.find(v=>v.name.toLowerCase()===t)
||D.vehicles.find(v=>t.includes(v.name.toLowerCase())||v.name.toLowerCase().includes(t))
||D.vehicles.find(v=>v.emoji&&t.includes(v.emoji))
||null;
}
if(file.name.toLowerCase().endsWith('.json')){
const parsed=JSON.parse(content);
if(Array.isArray(parsed.bbmLogs)){
parsed.bbmLogs.forEach(b=>{
if(D.bbmLogs.find(x=>x.id===b.id))return;
D.bbmLogs.push({...b,id:uid(),vehicleId:b.vehicleId||vehId});
bbmCount++;
});
}
if(Array.isArray(parsed.servisLogs)){
parsed.servisLogs.forEach(s=>{
if(D.servisLogs.find(x=>x.id===s.id))return;
D.servisLogs.push({...s,id:uid(),vehicleId:s.vehicleId||vehId});
servisCount++;
});
}
if(!Array.isArray(parsed.bbmLogs)&&!Array.isArray(parsed.servisLogs)){
resultEl.innerHTML='⚠️ File JSON ini tidak mengandung data BBM/Servis (bbmLogs/servisLogs).';
return;
}
} else {
const lines=content.split(/\r?\n/).filter(l=>l.trim().length);
if(lines.length<2){resultEl.innerHTML='⚠️ File CSV kosong atau format tidak terbaca.';return;}
const header=splitCSVLine(lines[0]).map(h=>h.trim().toLowerCase());
const idxDate=header.findIndex(h=>/tanggal|date/.test(h));
const idxJenis=header.findIndex(h=>/^jenis$|^tipe$|^type$/.test(h));
const idxKet=header.findIndex(h=>/keterangan|note|kategori|category|deskripsi|^item$/.test(h));
const idxJumlah=header.findIndex(h=>/jumlah|amount|total|biaya|harga|cost/.test(h));
const idxLiter=header.findIndex(h=>/liter|litre/.test(h));
const idxKm=header.findIndex(h=>/^km$|odometer/.test(h));
const idxVeh=header.findIndex(h=>/kendaraan|vehicle|^motor$|^mobil$/.test(h));
vehColDetected=idxVeh>=0;
for(let i=1;i<lines.length;i++){
const cols=splitCSVLine(lines[i]);
if(!cols.length)continue;
const matchedVeh=idxVeh>=0?matchVehicleFromText(cols[idxVeh]):null;
const rowVehId=matchedVeh?matchedVeh.id:vehId;
if(matchedVeh)autoDetectCount++;
let date=idxDate>=0?cols[idxDate].trim():'';
const dm=date.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
if(dm){let[,d,m,y]=dm;if(y.length===2)y='20'+y;date=`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;}
const ket=(idxKet>=0?cols[idxKet]:'').toString();
const ketLower=ket.toLowerCase();
const jenis=(idxJenis>=0?cols[idxJenis]:'').toString().toLowerCase().trim();
const amount=idxJumlah>=0?parseFloat(String(cols[idxJumlah]).replace(/[^\d.-]/g,''))||0:0;
const liter=idxLiter>=0?parseFloat(String(cols[idxLiter]).replace(',','.'))||0:0;
const km=idxKm>=0?parseFloat(String(cols[idxKm]).replace(/[^\d.]/g,''))||0:0;
if(!date||isNaN(new Date(date).getTime())){skipCount++;continue;}
const isBbm=jenis?/bbm/.test(jenis):(liter>0||/bbm|bensin|pertalite|pertamax|solar|spbu|isi.*bensin/.test(ketLower));
const isServis=jenis?/servis/.test(jenis):/servis|oli|ban|sparepart|ganti|tune|cvt|kampas|aki|busi/.test(ketLower);
if(isBbm){
D.bbmLogs.push({id:uid(),vehicleId:rowVehId,date,km:km||null,liter,harga:liter?Math.round(amount/liter):0,cost:amount,spbu:ket,fullTank:true,note:'Import: '+ket,accountId:D.accounts[0]?.id,txLinkId:null});
bbmCount++;
} else if(isServis){
D.servisLogs.push({id:uid(),vehicleId:rowVehId,date,item:ket||'Servis (import)',categoryId:null,km:km||null,cost:amount,note:'Import: '+ket,accountId:D.accounts[0]?.id,txLinkId:null});
servisCount++;
} else {
skipCount++;
}
}
}
save();
if(typeof renderCnTab==='function')renderCnTab();
const vehName=(D.vehicles.find(v=>v.id===vehId)||{}).name||'kendaraan terpilih';
resultEl.innerHTML=`✅ Import selesai untuk <b>${escapeHtml(vehName)}</b> (default): <b>${bbmCount}</b> catatan BBM, <b>${servisCount}</b> catatan servis ditambahkan otomatis (dikelompokkan sesuai tanggal & kata kunci). ${vehColDetected?`<br>🚗 Kolom kendaraan terdeteksi di CSV: <b>${autoDetectCount}</b> baris otomatis dicocokkan ke kendaraannya masing-masing, sisanya masuk ke "${escapeHtml(vehName)}".`:''} ${skipCount?`<br>⚠️ ${skipCount} baris dilewati karena tidak cocok format/kata kunci.`:''}`;
toast('✅ Import Car Notes selesai');
}catch(err){
resultEl.innerHTML='❌ Gagal import: '+(err&&err.message?err.message:'format file tidak dikenali');
}
};
reader.readAsText(file);
}
function splitCSVLine(line){
const out=[];let cur='';let inQ=false;
for(let i=0;i<line.length;i++){
const ch=line[i];
if(ch==='"'){inQ=!inQ;}
else if(ch===','&&!inQ){out.push(cur);cur='';}
else cur+=ch;
}
out.push(cur);
return out.map(v=>v.trim().replace(/^"|"$/g,''));
}
const CAT_EMOJI_GUESS=[
[/gaji|penghasilan|salary/i,'💼'],[/bonus/i,'🎁'],[/bisnis|usaha|jual|dagang|cobek/i,'🪨'],
[/hadiah|donasi|kurban|thr|tahlilan/i,'🎁'],[/investasi|invest/i,'📈'],[/kebun|tani/i,'🌾'],
[/kiriman|istri/i,'👩'],[/kendaraan|motor|vario|beat|grandmax|transport/i,'🏍️'],
[/bpjs|kesehatan|obat|apotik/i,'💊'],[/tagihan|listrik|wifi|pulsa|kuota|telepon|handphone|hp/i,'🧾'],
[/makan|bahan makanan|kopi|lauk/i,'🍽️'],[/anak/i,'👶'],[/renov|rumah|pipa|cat\b/i,'🔨'],
[/belanja|dapur|sabun/i,'🛒'],[/bepergian|wisata|hotel|tiket|toll/i,'✈️'],[/keluarga|orang tua|saudara/i,'👪'],
[/perawatan|salon|potong|olahraga/i,'💇'],[/shopping|baju|outfit|pakaian|aksesoris/i,'👕'],
[/elektronik/i,'🔌'],[/hewan/i,'🐾'],[/kamera/i,'📷'],[/mesin/i,'⚙️'],[/jasa|servis/i,'🔧'],
[/koreksi/i,'⚖️']
];
function guessCatEmoji(name,type){
const hit=CAT_EMOJI_GUESS.find(([re])=>re.test(name));
return hit?hit[1]:(type==='income'?'💰':'📦');
}
function slugify(s){return String(s).toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'')||'x';}
function ensureCashewTaxonomy(content){
const lines=content.split('\n').filter(l=>l.trim());
const summary={newAccounts:[],newCats:[],newSubs:[]};
if(lines.length<2)return summary;
const headers=splitCSVLine(lines[0]).map(h=>h.toLowerCase());
const idxAccount=headers.indexOf('account');
const idxIncome=headers.indexOf('income');
const idxCat=headers.indexOf('category name');
const idxSub=headers.indexOf('subcategory name');
if(idxCat<0)return summary;
const findAccByName=(n)=>D.accounts.find(a=>a.name.trim().toLowerCase()===n.trim().toLowerCase());
const findCatByName=(type,n)=>D.categories[type].find(c=>c.name.trim().toLowerCase()===n.trim().toLowerCase());
const findSubByName=(cat,n)=>(cat.subs||[]).find(s=>s.name.trim().toLowerCase()===n.trim().toLowerCase());
for(let i=1;i<lines.length;i++){
const vals=splitCSVLine(lines[i]);
if(vals.length<headers.length)continue;
const accName=(idxAccount>=0?vals[idxAccount]:'').trim();
if(accName && !findAccByName(accName)){
const newAcc={id:'acc_'+slugify(accName)+'_'+uid(),name:accName,emoji:'💰',balance:0};
D.accounts.push(newAcc);
summary.newAccounts.push(accName);
}
const isIncome=(idxIncome>=0?vals[idxIncome].toLowerCase():'false')==='true';
const type=isIncome?'income':'expense';
const catName=(idxCat>=0?vals[idxCat]:'').trim();
if(!catName)continue;
let cat=findCatByName(type,catName);
if(!cat){
cat={id:'cat_'+slugify(catName)+'_'+uid(),name:catName,emoji:guessCatEmoji(catName,type),subs:[]};
D.categories[type].push(cat);
summary.newCats.push(`${cat.emoji} ${catName} (${type==='income'?'Pemasukan':'Pengeluaran'})`);
}
const subName=(idxSub>=0?vals[idxSub]:'').trim();
if(subName && !findSubByName(cat,subName)){
if(!cat.subs)cat.subs=[];
cat.subs.push({id:'sub_'+slugify(subName)+'_'+uid(),name:subName});
summary.newSubs.push(`${catName} → ${subName}`);
}
}
return summary;
}
function parseCashewDate(raw){
if(!raw)return new Date().toISOString().split('T')[0];
raw=raw.trim();
const isoMatch=raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
if(isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
if(raw.includes('/')){
const p=raw.split(' ')[0].split('/');
if(p.length===3) return `${p[2]}-${p[1].padStart(2,'0')}-${p[0].padStart(2,'0')}`;
}
return new Date().toISOString().split('T')[0];
}
function parseCSVImport(content,type){
const lines=content.split('\n').filter(l=>l.trim());
if(lines.length<2)return[];
const headers=splitCSVLine(lines[0]).map(h=>h.toLowerCase());
const results=[];
if(type==='cashew'){
const idxDate=headers.indexOf('date');
const idxAmt=headers.indexOf('amount');
const idxIncome=headers.indexOf('income');
const idxCat=headers.indexOf('category name');
const idxSub=headers.indexOf('subcategory name');
const idxTitle=headers.indexOf('title');
const idxNote=headers.indexOf('note');
const idxAccount=headers.indexOf('account');
for(let i=1;i<lines.length;i++){
const vals=splitCSVLine(lines[i]);
if(vals.length<headers.length)continue;
const dateRaw=idxDate>=0?vals[idxDate]:'';
const date=parseCashewDate(dateRaw);
const amtRaw=idxAmt>=0?vals[idxAmt]:'0';
const amount=Math.abs(parseFloat(amtRaw)||0);
if(amount<=0)continue;
const incomeRaw=idxIncome>=0?vals[idxIncome].toLowerCase():'false';
const isIncome=incomeRaw==='true'||incomeRaw==='1';
const category=idxCat>=0&&vals[idxCat]?vals[idxCat]:'Lainnya';
const sub=idxSub>=0?vals[idxSub]:'';
const title=idxTitle>=0?vals[idxTitle]:'';
const noteV=idxNote>=0?vals[idxNote]:'';
const acc=idxAccount>=0?vals[idxAccount]:'';
const matchedAcc=acc?D.accounts.find(a=>a.name.toLowerCase()===acc.toLowerCase()):null;
results.push({id:uid(),date,type:isIncome?'income':'expense',amount,category,subcategory:sub,accountId:(matchedAcc?matchedAcc.id:D.accounts[0]?.id),payMethod:'tunai',note:[title,noteV].filter(Boolean).join(' - ')});
}
return results;
}
for(let i=1;i<lines.length;i++){
const vals=splitCSVLine(lines[i]);
const row={};
headers.forEach((h,j)=>row[h]=vals[j]||'');
let tx={id:uid(),note:'',category:'Lainnya'};
const dateKey=headers.find(h=>h.includes('date')||h==='tanggal'||h==='waktu');
tx.date=dateKey?parseCashewDate(row[dateKey]):new Date().toISOString().split('T')[0];
const amtKey=headers.find(h=>h.includes('amount')||h.includes('jumlah')||h==='nilai'||h==='total');
if(amtKey){const raw=row[amtKey].replace(/[^0-9.-]/g,'');tx.amount=Math.abs(parseFloat(raw)||0);}
const typeKey=headers.find(h=>h.includes('type')||h==='tipe'||h==='income'||h==='jenis');
if(typeKey){const tv=row[typeKey].toLowerCase();tx.type=(tv.includes('income')||tv.includes('masuk')||tv.includes('pemasukan')||tv==='true')?'income':'expense';}
else tx.type='expense';
const catKey=headers.find(h=>h.includes('categ')||h==='kategori');
if(catKey&&row[catKey])tx.category=row[catKey];
const noteKey=headers.find(h=>h.includes('note')||h==='keterangan'||h==='deskripsi'||h==='memo'||h==='title');
if(noteKey&&row[noteKey])tx.note=row[noteKey];
tx.accountId=D.accounts[0]?.id;
tx.payMethod='tunai';
if(tx.amount>0)results.push(tx);
}
return results;
}
// (v94): toggleMs/showTargetAccountTx/addTarget/delTarget/delReminder sudah dipindah ke transaksi.js
// (gabung bareng saveTarget/saveCatatan/saveReminder/saveLDR yang sudah ada di sana sejak v83).

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
// estimateKmPerDay/estimateServiceDateISO — dipakai Servis.renderReminder() &
// renderDashboardServisReminder() utk "Rekomendasi Servis AI": selain "sisa X km" (yang sudah ada),
// tambahkan ESTIMASI TANGGAL servis berikutnya dari rata-rata pemakaian km/hari kendaraan itu
// (dihitung dari histori D.kmLogs + D.bbmLogs — keduanya sudah punya {date,km} per kendaraan).
// Rule-based & gratis (bukan panggilan AI/web search) — kalau histori kurang (data <2 titik, atau
// rentang tanggalnya <3 hari, atau km tidak pernah naik), balikin null & UI cukup tampilkan "sisa km"
// spt biasa tanpa estimasi tanggal.
function estimateKmPerDay(vehicleId){
const points=[
...D.kmLogs.filter(k=>k.vehicleId===vehicleId&&k.date&&isFinite(k.km)).map(k=>({date:k.date,km:k.km})),
...D.bbmLogs.filter(b=>b.vehicleId===vehicleId&&b.date&&isFinite(b.km)&&b.km>0).map(b=>({date:b.date,km:b.km}))
].sort((a,b)=>new Date(a.date)-new Date(b.date));
if(points.length<2)return null;
const first=points[0],last=points[points.length-1];
const days=(new Date(last.date)-new Date(first.date))/86400000;
const kmDiff=last.km-first.km;
if(days<3||kmDiff<=0)return null;
return kmDiff/days;
}
function estimateServiceDateISO(sisaKm,kmPerDay){
if(!kmPerDay||kmPerDay<=0||sisaKm===null||sisaKm===undefined||sisaKm<=0)return null;
const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()+Math.ceil(sisaKm/kmPerDay));
return dateToISO(d);
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
const r=await callAIProviderRaw(systemPrompt,D.chatHistory.slice(-10));
if(!r.ok){
const label=provider==='gemini'?'Gemini':'Claude';
loading.remove();
box.innerHTML+=`<div class="chat-bubble ai">⚠️ Gagal hubungi ${label}: ${escapeHtml(r.errMsg||'error tidak diketahui')}${aiErrorHint(provider,r.status)}</div>`;
D.chatHistory.pop();
box.scrollTop=box.scrollHeight;
return;
}
reply=r.text||'Maaf, coba lagi ya W!';
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
// callAIProviderRaw — SATU-SATUNYA tempat yang benar-benar fetch() ke Claude/Gemini di seluruh
// app. Awalnya cuma dipakai AIWidget.generate(), sekarang jadi tempat bersama utk 6 fitur AI yang
// ada (chat asisten, AIWidget laporan, RenovAI, RefAI, PriceReko.checkMarketAI, EduFund.checkAI) —
// sebelumnya tiap fitur itu copy-paste sendiri kode fetch Claude+Gemini (6x kode yang HAMPIR SAMA
// PERSIS, cuma beda systemPrompt/messages/maxTokens/perlu web_search atau tidak). Dirapikan supaya
// nambah provider AI baru, ganti model, atau benerin bug fetch cukup di 1 tempat.
// opts (semua opsional): {maxTokens:number (default 4096), webSearch:boolean (default false, aktifkan
// tool pencarian web server-side — Gemini google_search / Claude web_search_20250305, dipakai
// fitur yang butuh info TERBARU spt harga emas/harga pasar/biaya sekolah, BUKAN utk chat/saran biasa)}
// Return: {ok:true,text} kalau sukses (text = gabungan SEMUA blok teks di balasan, bukan cuma blok
// pertama — penting utk balasan yang pakai web_search, karena balasannya bisa berisi beberapa blok
// teks diselingi hasil pencarian, bukan cuma 1 blok di awal), atau {ok:false,errMsg,status} kalau
// gagal (status = HTTP status code kalau ada, dipakai caller utk kasih hint spesifik spt "cek API key").
async function callAIProviderRaw(systemPrompt,messages,opts){
const apiKey=D.profile.apiKey;
const provider=D.profile.apiProvider||'claude';
if(!apiKey)return{ok:false,errMsg:'no_api_key'};
const maxTokens=(opts&&opts.maxTokens)||4096;
const useWebSearch=!!(opts&&opts.webSearch);
try{
if(provider==='gemini'){
const geminiContents=messages.map(m=>({role:m.role==='assistant'?'model':'user',parts:[{text:m.content}]}));
const body={system_instruction:{parts:[{text:systemPrompt}]},contents:geminiContents,generationConfig:{maxOutputTokens:maxTokens}};
if(useWebSearch)body.tools=[{google_search:{}}];
const url=`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
const data=await res.json();
if(!res.ok)return{ok:false,errMsg:data?.error?.message||`HTTP ${res.status}`,status:res.status};
const text=(data.candidates?.[0]?.content?.parts||[]).filter(p=>p.text).map(p=>p.text).join('\n').trim();
return{ok:true,text};
} else {
const body={model:'claude-sonnet-4-6',max_tokens:maxTokens,system:systemPrompt,messages};
if(useWebSearch)body.tools=[{type:'web_search_20250305',name:'web_search'}];
const res=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':apiKey,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify(body)});
const data=await res.json();
if(!res.ok)return{ok:false,errMsg:data?.error?.message||`HTTP ${res.status}`,status:res.status};
const text=(data.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('\n').trim();
return{ok:true,text};
}
}catch(e){
return{ok:false,errMsg:e.message||'koneksi bermasalah'};
}
}
// authHint — dipakai caller (chat, RefAI, PriceReko, EduFund) utk kasih saran singkat spesifik
// per status HTTP, ngikutin pesan yang dulu ditulis manual & beda2 dikit di tiap fitur (skrg disatukan
// di 1 fungsi supaya konsisten): Claude 401 = API key salah/expired, Gemini 400/403 = cek API key.
function aiErrorHint(provider,status){
if(provider==='gemini')return(status===400||status===403)?' (cek API key di Pengaturan)':'';
return status===401?' (API key salah/expired, cek di Pengaturan)':'';
}
// Advisor — pengatur tab utk card gabungan "🧭 Penasihat" (v124, kw80-merge-advisor-card-dashcards-5):
// dulu FinCoach ("🩺 Insight Cepat", rule-based-gratis-instan) & AIWidget ("🔍 Laporan AI",
// panggil Claude/Gemini, wajib API key) tampil sbg 2 card TERPISAH di Dashboard — sekarang
// digabung jadi SATU card dgn 2 tab, supaya tidak terasa ada "2 penasihat AI" yang mirip2.
// Cuma UI switcher (toggle panel mana yang tampil + simpan preferensi tab terakhir), TIDAK ubah
// logika FinCoach/AIWidget sama sekali — keduanya tetap modul independen spt sebelumnya, cuma
// target render-nya sekarang panel di dalam 1 card yang sama (`#finCoachBody`/`#aiWidgetBody`).
const Advisor={
LS_KEY:'kw_advisor_tab',
current(){ try{return localStorage.getItem(Advisor.LS_KEY)||'coach';}catch(e){return'coach';} },
setTab(tab){
try{localStorage.setItem(Advisor.LS_KEY,tab);}catch(e){}
Advisor.render();
},
render(){
const tab=Advisor.current()==='report'?'report':'coach';
const bC=document.getElementById('advisorTabBtn-coach'),bR=document.getElementById('advisorTabBtn-report');
const pC=document.getElementById('advisorPanel-coach'),pR=document.getElementById('advisorPanel-report');
if(!bC||!bR||!pC||!pR)return;
bC.classList.toggle('active',tab==='coach');
bR.classList.toggle('active',tab==='report');
pC.classList.toggle('u-dnone',tab!=='coach');pC.style.display=tab==='coach'?'block':'none';
pR.classList.toggle('u-dnone',tab!=='report');pR.style.display=tab==='report'?'block':'none';
}
};
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

// features-sheets-pwa-selftest.js — Settings, notifikasi, PWA setup, self-test/smoke-test rendering, pajak/zakat/aset/utang
// PENTING: file ini HARUS dimuat sesuai urutan build.js (GROUP_A/GROUP_B) karena beberapa modul saling referensi. Urutan grup ini: data-default.js, features-helpers-global-security.js, diagnostik-versi.js, format-tema.js, error-handler.js, helper-teks.js, keamanan-pin.js, modal-navigasi.js, reset-gaji-mingguan.js, debug-console.js, pengaturan-search.js, onboarding.js, kalkulator-input.js, scan-ocr.js, filter-laporan.js, akun.js, gaji-calc.js, transaksi.js, profil-pengaturan.js, kategori.js, tagihan-kalender.js, backup-restore.js, payroll-absensi.js, features-tukang-kendaraan-storage.js, features-aiwidget-reminder-gdrive-search.js, features-sheets-pwa-selftest.js

/* moved to modules-render.js: renderSheetsSettings */
let sheetsTokenClient=null;
let sheetsPendingAfterAuth=null;
function sheetsInitTokenClient(){
if(!D.googleDrive.clientId){toast('⚠️ Isi Google OAuth Client ID dulu di kartu "Backup Otomatis ke Google Drive" di atas');return null;}
ensureGoogleGSI().catch(()=>{});
if(location.protocol==='file:'){toast('❌ App ini harus dibuka lewat https:// dulu (bukan file lokal) supaya Google Sign-In bisa jalan.');return null;}
if(typeof google==='undefined'||!google.accounts||!google.accounts.oauth2){toast('⚠️ Modul Google sedang dimuat, coba pencet lagi dalam 1-2 detik. Cek koneksi internet atau matikan Brave Shields untuk situs ini kalau tetap gagal.');return null;}
if(!sheetsTokenClient){
sheetsTokenClient=google.accounts.oauth2.initTokenClient({
client_id:D.googleDrive.clientId,
scope:'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets '+GDRIVE_EMAIL_SCOPE,
callback:(resp)=>{
if(resp.error){toast('❌ Gagal hubungkan Google Sheets: '+resp.error);sheetsPendingAfterAuth=null;return;}
gdriveHandleAuthSuccess(resp,'sheets');
const fn=sheetsPendingAfterAuth;sheetsPendingAfterAuth=null;
if(fn)fn();
},
error_callback:(err)=>{
console.error('GSI error_callback (sheets):',err);
toast('❌ Google Sign-In gagal dibuka: '+(err&&err.type?err.type:'unknown'));
sheetsPendingAfterAuth=null;
}
});
}
return sheetsTokenClient;
}
function sheetsEnsureAuth(afterAuth){
if(gdriveAccessToken && gdriveTokenScope==='sheets'){ if(afterAuth)afterAuth(); return; }
const tc=sheetsInitTokenClient();
if(!tc)return;
sheetsPendingAfterAuth=afterAuth||null;
try{ tc.requestAccessToken(); }
catch(e){ console.error('sheetsEnsureAuth error:',e); toast('❌ Gagal membuka Google Sign-In: '+e.message); sheetsPendingAfterAuth=null; }
}
function sheetsConnectOnly(){
if(gdriveAccessToken && gdriveTokenScope==='sheets'){toast('✅ Sudah terhubung (scope Sheets)');return;}
sheetsEnsureAuth(()=>toast('✅ Terhubung ke Google Sheets'));
}
async function sheetsFetch(url,opts){
const res=await fetch(url,{...opts,headers:{...(opts&&opts.headers),'Authorization':'Bearer '+gdriveAccessToken}});
if(res.status===401){
gdriveResetTokenState();
throw new Error('Token kadaluarsa/tidak valid (401), coba Sync Sekarang lagi untuk re-auth.');
}
if(!res.ok){ const t=await res.text().catch(()=>''); throw new Error('HTTP '+res.status+(t?': '+t.slice(0,200):'')); }
return res.json();
}
async function sheetsGetOrCreateSpreadsheet(){
if(D.googleSheets.spreadsheetId) return D.googleSheets.spreadsheetId;
const body={properties:{title:'Data Keluarga '+(D.profile.nama||'W')}};
const data=await sheetsFetch('https://sheets.googleapis.com/v4/spreadsheets',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
D.googleSheets.spreadsheetId=data.spreadsheetId;
save();
return data.spreadsheetId;
}
const SHEETS_ROW_BUFFER=200;
async function sheetsEnsureTabs(ssId){
const meta=await sheetsFetch(`https://sheets.googleapis.com/v4/spreadsheets/${ssId}?fields=sheets.properties.title,sheets.properties.sheetId,sheets.properties.gridProperties.rowCount`);
const sheetMetaMap={};
(meta.sheets||[]).forEach(s=>{ sheetMetaMap[s.properties.title]={sheetId:s.properties.sheetId,rowCount:(s.properties.gridProperties&&s.properties.gridProperties.rowCount)||1000}; });
const missing=SHEETS_MODULES.filter(m=>!(m in sheetMetaMap));
if(missing.length){
const addRequests=missing.map(m=>{
const needed=(D[m]||[]).length+1+SHEETS_ROW_BUFFER;
return {addSheet:{properties:{title:m,gridProperties:{rowCount:Math.max(1000,needed),columnCount:26}}}};
});
const addRes=await sheetsFetch(`https://sheets.googleapis.com/v4/spreadsheets/${ssId}:batchUpdate`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({requests:addRequests})});
(addRes.replies||[]).forEach(r=>{ if(r.addSheet) sheetMetaMap[r.addSheet.properties.title]={sheetId:r.addSheet.properties.sheetId,rowCount:(r.addSheet.properties.gridProperties&&r.addSheet.properties.gridProperties.rowCount)||1000}; });
}
const headerData=SHEETS_MODULES.map(m=>{
const header=sheetsHeaderFor(m);
const lastCol=sheetsColLetter(header.length);
return {range:`${m}!A1:${lastCol}1`,values:[header]};
});
await sheetsFetch(`https://sheets.googleapis.com/v4/spreadsheets/${ssId}/values:batchUpdate`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({valueInputOption:'RAW',data:headerData})});
return sheetMetaMap;
}
async function sheetsSyncNow(){
if(_saveGuards['sheetsSync'])return;
if(!D.googleSheets.lastSync){
const confirmed=await askConfirm('Sync akan menyalin data dari HP ini ke Google Sheets. Setelah ini, kalau kamu menghapus sesuatu di HP lalu Sync lagi, baris yang sama di Sheets ikut TERHAPUS otomatis (supaya kedua sisi tetap sinkron). Jangan tambah baris manual sembarangan di Sheets. Lanjutkan sync pertama kali?',{title:'📊 Sebelum Sync Pertama Kali',okText:'Ya, Lanjutkan Sync',danger:false,icon:'📊'});
if(!confirmed){toast('Sync dibatalkan.');return;}
}
_saveGuards['sheetsSync']=true;
try{
sheetsEnsureAuth(async ()=>{
try{
await _sheetsSyncInner();
}catch(e){
console.error('sheetsSyncNow error:',e);
toast('❌ Gagal sync ke Sheets: '+e.message);
}finally{
_saveGuards['sheetsSync']=false;
}
});
}catch(e){
_saveGuards['sheetsSync']=false;
toast('❌ Gagal sync ke Sheets: '+e.message);
}
}
const SHEETS_WRITE_CHUNK=400;
async function _sheetsSyncInner(silent){
toast('⏳ Menyiapkan Spreadsheet...');
const ssId=await sheetsGetOrCreateSpreadsheet();
const sheetMetaMap=await sheetsEnsureTabs(ssId);
const ranges=SHEETS_MODULES.map(m=>`ranges=${encodeURIComponent(m+'!A2:'+sheetsLastColFor(m))}`).join('&');
const bg=await sheetsFetch(`https://sheets.googleapis.com/v4/spreadsheets/${ssId}/values:batchGet?${ranges}`);
const sheetsHasExistingRows=(bg.valueRanges||[]).some(vr=>vr.values&&vr.values.length>0);
if(sheetsHasExistingRows && _gdriveLocalDataLooksEmpty()){
if(silent){
console.warn('Sync ke Sheets dilewati: data lokal kosong tapi Spreadsheet sudah ada isi.');
toast('⚠️ Sync ke Sheets dilewati: data di HP ini kosong tapi Spreadsheet sudah ada isi. Buka Pengaturan → Google Sheets → "Tarik dari Sheets" dulu kalau mau ambil data lama itu.');
return false;
}
const confirmed=await askConfirm('Data di HP ini sekarang KOSONG, tapi Spreadsheet Google Sheets kamu sudah ada isi (kemungkinan data asli). Kalau lanjut, SEMUA baris yang ada di Sheets tapi tidak ada di HP akan DIHAPUS PERMANEN dari Sheets. Kalau tujuanmu memang mau mengambil/restore data lama, batalkan ini lalu pakai tombol "Tarik dari Sheets" (bukan Sync). Tetap lanjut & hapus data di Sheets?',{title:'⚠️ Sync akan menghapus data di Sheets',danger:true,okText:'Ya, Lanjut & Hapus',icon:'⚠️'});
if(!confirmed){toast('Sync dibatalkan.');return false;}
}
let totalUpdated=0, totalAdded=0, totalSkipped=0, totalOrphanDeleted=0;
const failedModules=[];
const nowIso=new Date().toISOString();
for(let idx=0;idx<SHEETS_MODULES.length;idx++){
const modKey=SHEETS_MODULES[idx];
try{
const vr=(bg.valueRanges||[])[idx]||{};
const lastCol=sheetsLastColFor(modKey);
const items=D[modKey]||[];
const localIds=new Set(items.map(it=>it.id));
const idMap={};
(vr.values||[]).forEach((row,i)=>{ if(row[0]) idMap[row[0]]={row:i+2, cellsJson:JSON.stringify(row.slice(2))}; });
let nextRow=(vr.values?vr.values.length:0)+2;
const writeData=[];
items.forEach(item=>{
const cells=sheetsItemToCells(modKey,item);
const newCellsJson=JSON.stringify(cells);
const existing=idMap[item.id];
if(existing){
if(existing.cellsJson===newCellsJson){ totalSkipped++; return; }
writeData.push({range:`${modKey}!A${existing.row}:${lastCol}${existing.row}`,values:[[item.id,nowIso,...cells]]});
totalUpdated++;
}else{
const row=nextRow++;
writeData.push({range:`${modKey}!A${row}:${lastCol}${row}`,values:[[item.id,nowIso,...cells]]});
totalAdded++;
}
});
const lastRowNeeded=nextRow-1;
const meta=sheetMetaMap[modKey];
if(meta&&lastRowNeeded>meta.rowCount){
toast(`⏳ Memperbesar tab "${modKey}" (kapasitas baris kurang)...`);
await sheetsFetch(`https://sheets.googleapis.com/v4/spreadsheets/${ssId}:batchUpdate`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({requests:[{updateSheetProperties:{properties:{sheetId:meta.sheetId,gridProperties:{rowCount:lastRowNeeded+SHEETS_ROW_BUFFER}},fields:'gridProperties.rowCount'}}]})});
}
for(let i=0;i<writeData.length;i+=SHEETS_WRITE_CHUNK){
const chunk=writeData.slice(i,i+SHEETS_WRITE_CHUNK);
toast(`⏳ Menulis ${modKey}: baris ${i+1}-${i+chunk.length} dari ${writeData.length}...`);
await sheetsFetch(`https://sheets.googleapis.com/v4/spreadsheets/${ssId}/values:batchUpdate`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({valueInputOption:'RAW',data:chunk})});
}
const orphanRows=Object.entries(idMap).filter(([id])=>!localIds.has(id)).map(([,v])=>v.row);
if(orphanRows.length){
const sheetId=meta?meta.sheetId:undefined;
const deleteRequests=orphanRows.sort((a,b)=>b-a).map(row=>({deleteDimension:{range:{sheetId,dimension:'ROWS',startIndex:row-1,endIndex:row}}}));
toast(`⏳ Menghapus ${deleteRequests.length} baris yatim di "${modKey}" (item yg sudah dihapus di HP)...`);
await sheetsFetch(`https://sheets.googleapis.com/v4/spreadsheets/${ssId}:batchUpdate`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({requests:deleteRequests})});
totalOrphanDeleted+=deleteRequests.length;
}
}catch(e){
console.error(`sheetsSyncNow: modul "${modKey}" gagal ditulis:`,e);
failedModules.push(modKey+': '+e.message);
}
}
D.googleSheets.lastSync=new Date().toISOString();
save();
renderSheetsSettings();
if(failedModules.length){
toast(`⚠️ Sync sebagian gagal (${failedModules.length} modul error, modul lain tetap tersimpan): ${failedModules.join(' | ').slice(0,300)}`);
}else{
const totalWritten=totalUpdated+totalAdded+totalOrphanDeleted;
toast(totalWritten? `✅ Sync ke Sheets selesai (${totalUpdated} ditimpa, ${totalAdded} baru, ${totalOrphanDeleted} dihapus, ${totalSkipped} tidak berubah)` : `✅ Sudah sinkron, tidak ada perubahan (${totalSkipped} item sama persis)`);
}
return true;
}
async function sheetsPullNow(){
if(_saveGuards['sheetsPull'])return;
_saveGuards['sheetsPull']=true;
try{
sheetsEnsureAuth(async ()=>{
try{
if(!_gdriveLocalDataLooksEmpty()){
toast('⏳ Sync perubahan lokal dulu sebelum menarik...');
await _sheetsSyncInner();
}
await _sheetsPullInner();
}
catch(e){ console.error('sheetsPullNow error:',e); toast('❌ Gagal tarik dari Sheets: '+e.message); }
finally{ _saveGuards['sheetsPull']=false; }
});
}catch(e){
_saveGuards['sheetsPull']=false;
toast('❌ Gagal tarik dari Sheets: '+e.message);
}
}
async function _sheetsPullInner(){
const ssId=D.googleSheets.spreadsheetId;
toast('⏳ Mengambil data dari Sheets...');
const ranges=SHEETS_MODULES.map(m=>`ranges=${encodeURIComponent(m+'!A2:'+sheetsLastColFor(m))}`).join('&');
const bg=await sheetsFetch(`https://sheets.googleapis.com/v4/spreadsheets/${ssId}/values:batchGet?${ranges}`);
const pulled={}; let totalItems=0, totalBadRows=0;
(bg.valueRanges||[]).forEach((vr,idx)=>{
const modKey=SHEETS_MODULES[idx];
const arr=[];
(vr.values||[]).forEach(row=>{
if(!row[0])return;
try{
arr.push(sheetsCellsToItem(modKey,row[0],row.slice(2)));
}catch(e){ totalBadRows++; }
});
pulled[modKey]=arr;
totalItems+=arr.length;
});
let msg=`Data di HP untuk ${SHEETS_MODULES.length} modul (transaksi, shop, etalase produk, bbm, servis, km, stok sparepart, tagihan, target tabungan, dana pendidikan, absensi/gaji — total ${totalItems} item dari Sheets) akan DITIMPA TOTAL dengan isi Spreadsheet. Modul lain (perjalanan, budget, produsen, aset, profil, akun, kategori) tidak disentuh.`;
if(totalBadRows) msg+=`\n\n⚠️ ${totalBadRows} baris di Sheets tidak terbaca (format rusak) dan akan dilewati/hilang.`;
const confirmed=await askConfirm(msg,{title:'Tarik dari Google Sheets',danger:true,okText:'Ya, Timpa dari Sheets',icon:'📥'});
if(!confirmed)return;
const ok=await applyRestoredData(pulled);
if(ok){
D.googleSheets.lastSync=new Date().toISOString();
save();
renderSheetsSettings();
toast(`✅ ${totalItems} item berhasil ditarik dari Sheets`);
}
}
function setupPWA(){
try{
const isHosted=location.protocol==='https:'||location.hostname==='localhost';
const link=document.getElementById('pwaManifestLink');
if(!isHosted){
const manifest={
name:'Keluarga '+(D.profile.nama||'W'),
short_name:'Keluarga '+(D.profile.nama||'W'),
start_url:location.href.split('#')[0],
display:'standalone',
background_color:'#0d0d1a',
theme_color:'#7c6fef',
icons:[{src:'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%237c6fef"/><text x="50" y="65" font-size="50" text-anchor="middle" fill="white">W</text></svg>'),sizes:'192x192',type:'image/svg+xml'}]
};
const blob=new Blob([JSON.stringify(manifest)],{type:'application/json'});
if(link) link.href=URL.createObjectURL(blob);
}
if(('serviceWorker' in navigator) && isHosted){
if(link){
}
navigator.serviceWorker.register('sw.js').catch(()=>{
const swCode=`
        const CACHE='kw-cache-v1';
        self.addEventListener('install',e=>{self.skipWaiting();});
        self.addEventListener('activate',e=>{self.clients.claim();});
        self.addEventListener('fetch',e=>{
          if(e.request.method!=='GET')return;
          e.respondWith(
            fetch(e.request).then(res=>{
              const resClone=res.clone();
              caches.open(CACHE).then(c=>c.put(e.request,resClone));
              return res;
            }).catch(()=>caches.match(e.request))
          );
        });
      `;
const swBlob=new Blob([swCode],{type:'application/javascript'});
const swUrl=URL.createObjectURL(swBlob);
navigator.serviceWorker.register(swUrl).catch(e=>console.warn('SW gagal:',e.message));
});
}
}catch(e){console.warn('Setup PWA gagal:',e);}
}
function _selfTestAssert(cond,msg){ if(!cond) throw new Error(msg||'Gagal'); }
// Cek elemen [data-action] yang cuma berisi ikon/emoji tanpa teks & tanpa aria-label/aria-labelledby --
// screen reader tidak bisa menjelaskan fungsi tombol semacam ini ke pengguna tunanetra.
// Diberi parameter `root` (default: seluruh document) supaya bisa dipakai 2 cara:
//   1. Dipanggil dari test case "Tes Otomatis" biasa (root=document) -- cuma nyisir apa yang
//      lagi ke-render di layar saat itu (halaman aktif + elemen persisten seperti nav bar).
//   2. Dipanggil per-halaman dari Tes Navigasi Halaman (root=elemen #page-xxx) setelah tiap
//      showPage(), supaya SEMUA halaman ikut disisir dalam satu klik, bukan cuma yang lagi aktif.
function findMissingAriaLabels(root){
const scope=root||document;
const problems=[];
scope.querySelectorAll('[data-action]').forEach(el=>{
if(el.hasAttribute('aria-label')||el.hasAttribute('aria-labelledby'))return;
const text=(el.textContent||'').replace(/[^a-zA-Z]/g,'');
if(text.length>=3)return; // ada teks yang cukup terbaca oleh screen reader
problems.push('Elemen <'+el.tagName.toLowerCase()+' id="'+(el.id||'-')+'" data-action="'+el.getAttribute('data-action')+'"> cuma berisi ikon/emoji/teks pendek tanpa aria-label -- screen reader tidak akan bisa menjelaskan fungsi tombol ini.');
});
return problems;
}
function getSelfTestCases(){
return [
{name:'fmt() singkat angka jutaan/ribuan dengan benar', fn:()=>{
_selfTestAssert(fmt(1500000)==='Rp 1.5 jt','fmt(1500000) harus "Rp 1.5 jt", dapat "'+fmt(1500000)+'"');
_selfTestAssert(fmt(2500)==='Rp 3rb','fmt(2500) harus "Rp 3rb", dapat "'+fmt(2500)+'"');
_selfTestAssert(fmt(500)==='Rp 500','fmt(500) harus "Rp 500", dapat "'+fmt(500)+'"');
}},
{name:'fmtFull() memakai format ribuan Indonesia', fn:()=>{
const r=fmtFull(1234567);
_selfTestAssert(r.indexOf('Rp')===0,'fmtFull harus diawali "Rp"');
_selfTestAssert(r.indexOf('.')>-1,'fmtFull harus ada pemisah ribuan');
}},
{name:'escapeHtml() menetralkan tag <script>', fn:()=>{
const r=escapeHtml('<script>alert(1)<\/script>');
_selfTestAssert(r.indexOf('<script>')===-1,'escapeHtml gagal menetralkan tag script');
}},
{name:'safeCalc() menghitung ekspresi kalkulator jumlah dengan benar', fn:()=>{
_selfTestAssert(safeCalc('5000+2500')===7500,'safeCalc("5000+2500") harus 7500, dapat '+safeCalc('5000+2500'));
_selfTestAssert(safeCalc('10000-2500')===7500,'safeCalc("10000-2500") harus 7500, dapat '+safeCalc('10000-2500'));
_selfTestAssert(safeCalc('2500*4')===10000,'safeCalc("2500*4") harus 10000, dapat '+safeCalc('2500*4'));
_selfTestAssert(safeCalc('10000/4')===2500,'safeCalc("10000/4") harus 2500, dapat '+safeCalc('10000/4'));
_selfTestAssert(safeCalc('(1000+500)*2')===3000,'safeCalc("(1000+500)*2") harus 3000, dapat '+safeCalc('(1000+500)*2'));
_selfTestAssert(isNaN(safeCalc('1000+abc')),'safeCalc harus menolak input yang bukan ekspresi angka murni');
}},
{name:'safeCalc() titik dianggap pemisah ribuan, kecuali 1-2 digit di akhir', fn:()=>{
_selfTestAssert(safeCalc('1.500.000')===1500000,'safeCalc("1.500.000") harus 1500000 (ribuan), dapat '+safeCalc('1.500.000'));
_selfTestAssert(safeCalc('1.500.000+2.000.000')===3500000,'safeCalc("1.500.000+2.000.000") harus 3500000, dapat '+safeCalc('1.500.000+2.000.000'));
_selfTestAssert(safeCalc('1.500')===1500,'safeCalc("1.500") (3 digit di akhir) harus dianggap ribuan = 1500, dapat '+safeCalc('1.500'));
_selfTestAssert(safeCalc('1500.5')===1500.5,'safeCalc("1500.5") (1 digit di akhir) harus dianggap desimal = 1500.5, dapat '+safeCalc('1500.5'));
_selfTestAssert(safeCalc('1500.50')===1500.5,'safeCalc("1500.50") (2 digit di akhir) harus dianggap desimal = 1500.5, dapat '+safeCalc('1500.50'));
}},
{name:'dateToISO() format YYYY-MM-DD 2 digit', fn:()=>{
const r=dateToISO(new Date(2026,0,5));
_selfTestAssert(r==='2026-01-05','dateToISO(5 Jan 2026) harus "2026-01-05", dapat "'+r+'"');
}},
{name:'todayStr() sama dengan dateToISO(sekarang)', fn:()=>{
_selfTestAssert(todayStr()===dateToISO(new Date()),'todayStr() tidak sinkron dengan dateToISO(new Date())');
}},
{name:'Struktur data utama (D) lengkap', fn:()=>{
_selfTestAssert(Array.isArray(D.transactions),'D.transactions harus array');
_selfTestAssert(Array.isArray(D.bills),'D.bills harus array');
_selfTestAssert(Array.isArray(D.accounts)&&D.accounts.length>0,'D.accounts harus array berisi minimal 1 akun');
_selfTestAssert(D.categories&&Array.isArray(D.categories.income)&&Array.isArray(D.categories.expense),'D.categories harus punya income & expense');
_selfTestAssert(Array.isArray(D.wishlist),'D.wishlist harus array (fitur Prioritas Belanja)');
}},
{name:'totalSaldoAkun() = jumlah manual saldo akun aktif', fn:()=>{
const manual=D.accounts.filter(a=>a.includeInBalance!==false).reduce((s,a)=>s+recalcAccBalance(a.id),0);
_selfTestAssert(totalSaldoAkun()===manual,'totalSaldoAkun() ('+totalSaldoAkun()+') tidak sama dengan hitungan manual ('+manual+')');
}},
{name:'totalSaldoAkun() mengecualikan akun yang ditautkan dari Buku Aset (cegah dobel hitung Kekayaan Bersih)', fn:()=>{
if(!D.accounts.length)return;
const targetAcc=D.accounts[0];
const before=totalSaldoAkun();
const dummyAsset={id:'__selftest_asset_link__',name:'Tes Diagnostik',jenis:'Reksadana',nilai:1000000,accountId:targetAcc.id};
D.assets.push(dummyAsset);
try{
_selfTestAssert(isAccLinkedToAsset(targetAcc.id),'isAccLinkedToAsset() harus true setelah akun ditautkan dari 1 aset');
const after=totalSaldoAkun();
const expected=before-recalcAccBalance(targetAcc.id);
_selfTestAssert(after===expected,'totalSaldoAkun() setelah akun ditautkan ('+after+') harus '+expected+' (saldo akun yg ditautkan dikecualikan)');
} finally {
D.assets=D.assets.filter(a=>a.id!=='__selftest_asset_link__');
}
_selfTestAssert(totalSaldoAkun()===before,'totalSaldoAkun() harus balik ke nilai semula ('+before+') setelah tautan aset tes dihapus, dapat '+totalSaldoAkun());
}},
{name:'Perhitungan jatuh tempo tagihan (objek sementara, tidak disimpan)', fn:()=>{
const dummyBill={id:'__selftest__',name:'Tes Diagnostik',amount:10000,freq:'bulanan',nextDue:todayStr(),acc:D.accounts[0]?D.accounts[0].id:null};
const now=new Date();
const occ=getBillOccurrencesInMonth(dummyBill,now.getFullYear(),now.getMonth());
_selfTestAssert(Array.isArray(occ)&&occ.length>0,'getBillOccurrencesInMonth harus mengembalikan minimal 1 jadwal untuk tagihan bulanan yang jatuh tempo hari ini');
_selfTestAssert(!D.bills.some(b=>b.id==='__selftest__'),'Tes tidak boleh menambahkan tagihan sungguhan ke D.bills');
}},
{name:'Penyimpanan lokal (localStorage) bisa ditulis & dibaca', fn:()=>{
const testKey='kw_selftest_probe';
const testVal=String(Date.now());
const ok=safeSetItem(testKey,testVal);
_selfTestAssert(ok!==false,'safeSetItem gagal menulis ke localStorage');
const read=localStorage.getItem(testKey);
_selfTestAssert(read===testVal,'Nilai yang dibaca kembali dari localStorage tidak sama dengan yang ditulis');
localStorage.removeItem(testKey);
}},
{name:'Data tersimpan (kw_v4) valid JSON setelah saveFlush()', fn:()=>{
saveFlush();
const raw=localStorage.getItem('kw_v4');
_selfTestAssert(!!raw,'kw_v4 tidak ditemukan di localStorage setelah saveFlush()');
let parsed;
try{ parsed=JSON.parse(raw); }catch(e){ throw new Error('kw_v4 bukan JSON valid: '+e.message); }
_selfTestAssert(Array.isArray(parsed.transactions),'kw_v4 tersimpan tidak punya field transactions berupa array');
}},
{name:'MIGRASI STORAGE (LEVEL 3): save() biasa TIDAK menulis kw_v4 ke localStorage (IndexedDB jadi utama)', fn:async()=>{
if(_saveDebounceTimer){clearTimeout(_saveDebounceTimer);_saveDebounceTimer=null;}
localStorage.removeItem('kw_v4');
const original=_saveImmediate;
let called=false;
_saveImmediate=function(){called=true;original();};
try{
save();
const pollStart=Date.now();
while(!called && (Date.now()-pollStart)<3000){ await new Promise(r=>setTimeout(r,25)); }
_selfTestAssert(called,'_saveImmediate() seharusnya terpanggil lewat debounce save()');
await new Promise(r=>setTimeout(r,80));
} finally {
_saveImmediate=original;
}
_selfTestAssert(localStorage.getItem('kw_v4')===null,'save() biasa TIDAK BOLEH menulis kw_v4 ke localStorage -- itu tugas saveFlush() saja di titik kritis');
const mirror=await IDBStore.get('kw_v4_mirror');
_selfTestAssert(!!mirror,'save() biasa tetap harus menulis ke IndexedDB (kw_v4_mirror) sebagai penyimpanan utama');
saveFlush();
}},
{name:'IDBStore (migrasi #4): round-trip tulis/baca IndexedDB', fn:async()=>{
const testKey='kw_selftest_idb_probe';
const testVal=JSON.stringify({probe:Date.now()});
const wrote=await IDBStore.set(testKey,testVal);
_selfTestAssert(wrote===true,'IDBStore.set() harus mengembalikan true kalau berhasil');
const read=await IDBStore.get(testKey);
_selfTestAssert(read===testVal,'Nilai yang dibaca kembali dari IndexedDB tidak sama dengan yang ditulis');
}},
{name:'IDBStore (migrasi #4): mirror kw_v4_mirror sinkron dgn localStorage[kw_v4] setelah save()', fn:async()=>{
saveFlush();
await new Promise(res=>setTimeout(res,80));
const raw=localStorage.getItem('kw_v4');
const mirror=await IDBStore.get('kw_v4_mirror');
_selfTestAssert(!!mirror,'kw_v4_mirror tidak ditemukan di IndexedDB setelah save() -- mirror gagal jalan');
const parsedLocal=JSON.parse(raw), parsedMirror=JSON.parse(mirror);
_selfTestAssert(parsedLocal.transactions.length===parsedMirror.transactions.length,'Jumlah transactions di localStorage vs mirror IndexedDB harus sama persis');
}},
{name:'TimelineW.waterfall(): urutan & rentang bulan tiap tujuan konsisten (LEVEL 2 MAINTENANCE)', fn:()=>{
const{rows,surplus}=TimelineW.waterfall();
rows.forEach((r,i)=>{
if(r.endMonth!=null) _selfTestAssert(r.endMonth>=r.startMonth,'TimelineW baris "'+r.label+'": endMonth harus >= startMonth');
if(i>0 && rows[i-1].endMonth!=null) _selfTestAssert(r.startMonth===rows[i-1].endMonth,'TimelineW baris "'+r.label+'": startMonth harus tepat sama dgn endMonth baris sebelumnya (waterfall)');
});
if(surplus>0) rows.forEach(r=>_selfTestAssert(r.monthsNeeded==null||r.monthsNeeded>=0,'TimelineW baris "'+r.label+'": monthsNeeded tidak boleh negatif'));
}},
{name:'runDataMigrations(): jalur migrasi versi data formal (LEVEL 2 MAINTENANCE)', fn:()=>{
const before=DATA_MIGRATIONS.length;
let ranAgain=false;
const probe={toVersion:SCHEMA_VERSION,desc:'probe tidak boleh jalan',migrate(){ranAgain=true;}};
DATA_MIGRATIONS.push(probe);
try{
runDataMigrations(SCHEMA_VERSION);
_selfTestAssert(!ranAgain,'runDataMigrations() tidak boleh menjalankan migrasi yg toVersion-nya <= versi data saat ini');
_selfTestAssert(D.schemaVersion===SCHEMA_VERSION,'runDataMigrations() harus menyamakan D.schemaVersion ke SCHEMA_VERSION setelah selesai');
} finally { DATA_MIGRATIONS.length=before; }
const order=[];
const fake1={toVersion:9001,desc:'fake migrasi #1',migrate(){order.push(1);}};
const fake2={toVersion:9002,desc:'fake migrasi #2',migrate(){order.push(2);}};
DATA_MIGRATIONS.push(fake2,fake1);
const savedSchemaVersion=D.schemaVersion;
try{
runDataMigrations(0);
_selfTestAssert(order.length===2&&order[0]===1&&order[1]===2,'runDataMigrations() harus menjalankan migrasi terdaftar berurutan sesuai toVersion menaik, dapat urutan "'+order.join(',')+'"');
} finally {
DATA_MIGRATIONS.length=before;
D.schemaVersion=savedSchemaVersion;
}
let secondRan=false;
const willThrow={toVersion:9003,desc:'fake migrasi yg gagal',migrate(){throw new Error('sengaja gagal utk tes');}};
const afterThrow={toVersion:9004,desc:'fake migrasi setelahnya',migrate(){secondRan=true;}};
DATA_MIGRATIONS.push(willThrow,afterThrow);
const savedSchemaVersion2=D.schemaVersion;
try{
runDataMigrations(9002);
_selfTestAssert(secondRan,'runDataMigrations() harus tetap lanjut ke migrasi berikutnya walau ada 1 migrasi yg gagal/throw');
} finally {
DATA_MIGRATIONS.length=before;
D.schemaVersion=savedSchemaVersion2;
}
}},
{name:'Pencarian global tidak error untuk kueri kosong/pendek', fn:()=>{
const q='ab';
D.transactions.filter(t=>(t.note||'').toLowerCase().includes(q)||(t.category||'').toLowerCase().includes(q));
D.bills.filter(b=>(b.name||'').toLowerCase().includes(q));
}},
{name:'Kalkulator cicilan: total harga → cicilan/bulan konsisten', fn:()=>{
const{perBulan}=calcCicilanPerBulanFromTotal(6000000,6,0);
_selfTestAssert(perBulan===1000000,'6.000.000 / 6x tanpa bunga harus jadi cicilan 1.000.000/bulan, dapat '+perBulan);
const{perBulan:perBulanBunga}=calcCicilanPerBulanFromTotal(6000000,6,10);
_selfTestAssert(Math.abs(perBulanBunga-1100000)<=1,'6.000.000 / 6x dengan bunga 10% harus ≈1.100.000/bulan, dapat '+perBulanBunga);
}},
{name:'Transfer antar akun seimbang (transaksi sementara, tidak disimpan)', fn:()=>{
if(D.accounts.length<2){ return; }
const accA=D.accounts[0], accB=D.accounts[1];
const countBefore=D.transactions.length;
const balABefore=recalcAccBalance(accA.id), balBBefore=recalcAccBalance(accB.id);
const amt=1000;
const txOut={id:'__selftest_trout__',type:'transfer_out',amount:amt,category:'Transfer',note:'tes diagnostik',date:todayStr(),accountId:accA.id};
const txIn={id:'__selftest_trin__',type:'transfer_in',amount:amt,category:'Transfer',note:'tes diagnostik',date:todayStr(),accountId:accB.id};
D.transactions.push(txOut,txIn);
let balAAfter,balBAfter,err=null;
try{
balAAfter=recalcAccBalance(accA.id);
balBAfter=recalcAccBalance(accB.id);
}catch(e){ err=e; }
D.transactions=D.transactions.filter(t=>t.id!=='__selftest_trout__'&&t.id!=='__selftest_trin__');
_selfTestAssert(D.transactions.length===countBefore,'Transaksi sementara tes transfer gagal dibersihkan dari D.transactions');
if(err) throw err;
_selfTestAssert(balAAfter===balABefore-amt,'Saldo akun asal harus berkurang sesuai jumlah transfer');
_selfTestAssert(balBAfter===balBBefore+amt,'Saldo akun tujuan harus bertambah sesuai jumlah transfer');
}},
{name:'Payload backup lengkap & tidak membocorkan API key', fn:()=>{
const payload=buildBackupPayload();
_selfTestAssert(Array.isArray(payload.transactions),'Payload backup harus punya transactions berupa array');
_selfTestAssert(payload.transactions.length===D.transactions.length,'Jumlah transaksi di payload backup harus sama dengan data asli');
_selfTestAssert(Array.isArray(payload.accounts)&&payload.accounts.length===D.accounts.length,'Jumlah akun di payload backup harus sama dengan data asli');
_selfTestAssert(!payload.profile||!('apiKey' in payload.profile),'Payload backup tidak boleh menyertakan API key AI');
const parsed=JSON.parse(JSON.stringify(payload));
_selfTestAssert(parsed.schemaVersion===SCHEMA_VERSION,'schemaVersion payload backup harus sama dengan SCHEMA_VERSION saat ini');
}},
{name:'Tombol Hubungkan/Backup/Restore Drive & Sheets tetap lengkap (tidak ke-hapus tak sengaja)', fn:()=>{
['gdriveEnsureAuth','gdriveConnectOnly','gdriveBackupNow','gdriveRestoreNow','uploadBackupToDrive','gdriveDownloadBackup','gdriveDisconnect','gdriveResetTokenState','gdriveHandleAuthSuccess','gdriveConnStatusLabel','gdriveFetchUserInfo','gdriveThrowForFailedRes'].forEach(fnName=>{
_selfTestAssert(typeof window[fnName]==='function','Fungsi '+fnName+'() harus ada (dipakai tombol Drive di Pengaturan)');
});
['sheetsEnsureAuth','sheetsConnectOnly','sheetsSyncNow','sheetsPullNow'].forEach(fnName=>{
_selfTestAssert(typeof window[fnName]==='function','Fungsi '+fnName+'() harus ada (dipakai tombol Sheets di Pengaturan)');
});
['gdriveConnect','gdriveRestoreConnect'].forEach(fnName=>{
_selfTestAssert(typeof window[fnName]==='undefined','Fungsi lama '+fnName+'() seharusnya sudah tidak dipakai lagi (gabungan connect+aksi, sumber bug lama)');
});
}},
{name:'State googleDrive & googleSheets punya bentuk yang benar', fn:()=>{
_selfTestAssert(D.googleDrive&&typeof D.googleDrive==='object','D.googleDrive harus object');
_selfTestAssert('clientId' in D.googleDrive && 'fileId' in D.googleDrive && 'autoSync' in D.googleDrive,'D.googleDrive harus punya clientId, fileId, autoSync');
_selfTestAssert(typeof D.googleDrive.autoSync==='boolean','D.googleDrive.autoSync harus boolean');
_selfTestAssert(D.googleSheets&&typeof D.googleSheets==='object','D.googleSheets harus object');
_selfTestAssert('spreadsheetId' in D.googleSheets,'D.googleSheets harus punya spreadsheetId');
_selfTestAssert(gdrivePendingAfterAuth===null||typeof gdrivePendingAfterAuth==='function','gdrivePendingAfterAuth harus null atau function, bukan tersangkut state lain');
_selfTestAssert(sheetsPendingAfterAuth===null||typeof sheetsPendingAfterAuth==='function','sheetsPendingAfterAuth harus null atau function, bukan tersangkut state lain');
}},
{name:'Konsistensi state token Google (scope, expiry, email) & label status', fn:()=>{
if(!gdriveAccessToken){
_selfTestAssert(gdriveTokenScope===null,'gdriveTokenScope harus null kalau belum ada token');
_selfTestAssert(gdriveTokenExpiresAt===null,'gdriveTokenExpiresAt harus null kalau belum ada token');
_selfTestAssert(gdriveUserEmail===null,'gdriveUserEmail harus null kalau belum ada token');
} else {
_selfTestAssert(gdriveTokenScope==='drive'||gdriveTokenScope==='sheets','gdriveTokenScope harus \'drive\' atau \'sheets\' kalau ada token');
}
_selfTestAssert(typeof gdriveConnStatusLabel()==='string'&&gdriveConnStatusLabel().length>0,'gdriveConnStatusLabel() harus selalu mengembalikan teks status, bukan kosong/undefined');
_selfTestAssert(typeof gdriveConnStatusLabel(true)==='string'&&gdriveConnStatusLabel(true).length>0,'gdriveConnStatusLabel(true) (mode Sheets) harus selalu mengembalikan teks status');
}},
{name:'getPTKP() menghitung PTKP PPh 21 sesuai status kawin & tanggungan', fn:()=>{
_selfTestAssert(getPTKP('TK0')===54000000,'PTKP TK/0 harus 54.000.000, dapat '+getPTKP('TK0'));
_selfTestAssert(getPTKP('TK1')===58500000,'PTKP TK/1 harus 58.500.000, dapat '+getPTKP('TK1'));
_selfTestAssert(getPTKP('K0')===58500000,'PTKP K/0 harus 58.500.000, dapat '+getPTKP('K0'));
_selfTestAssert(getPTKP('K3')===72000000,'PTKP K/3 harus 72.000.000, dapat '+getPTKP('K3'));
}},
{name:'profilePTKPStatus(): status PTKP diturunkan benar dari Profil Pribadi (statusKawin & tanggungan), tidak merusak profil asli', fn:()=>{
if(typeof profilePTKPStatus!=='function')return;
const backup={statusKawin:D.profile.statusKawin,tanggungan:D.profile.tanggungan};
try{
D.profile.statusKawin=false; D.profile.tanggungan=0;
_selfTestAssert(profilePTKPStatus()==='TK0','Belum kawin & 0 tanggungan harus jadi status TK0');
D.profile.statusKawin=true; D.profile.tanggungan=1;
_selfTestAssert(profilePTKPStatus()==='K1','Kawin & 1 tanggungan (mis. 1 anak) harus jadi status K1');
D.profile.statusKawin=true; D.profile.tanggungan=3;
_selfTestAssert(profilePTKPStatus()==='K3','Kawin & 3 tanggungan harus jadi status K3');
D.profile.statusKawin=true; D.profile.tanggungan=9;
_selfTestAssert(profilePTKPStatus()==='K3','Tanggungan di atas 3 harus di-cap ke 3 (maks PTKP resmi), bukan K9 yg tidak valid');
D.profile.statusKawin=false; D.profile.tanggungan=undefined;
_selfTestAssert(profilePTKPStatus()==='TK0','Tanggungan undefined/belum diisi harus dianggap 0, bukan error');
} finally {
D.profile.statusKawin=backup.statusKawin; D.profile.tanggungan=backup.tanggungan;
}
_selfTestAssert(D.profile.statusKawin===backup.statusKawin&&D.profile.tanggungan===backup.tanggungan,'Profil Pribadi asli harus balik seperti semula setelah tes');
}},
{name:'profileJiwaKeluarga(): jumlah jiwa Zakat Fitrah diturunkan benar dari Profil Pribadi, tidak merusak profil asli', fn:()=>{
if(typeof profileJiwaKeluarga!=='function')return;
const backup={statusKawin:D.profile.statusKawin,tanggungan:D.profile.tanggungan};
try{
D.profile.statusKawin=false; D.profile.tanggungan=0;
_selfTestAssert(profileJiwaKeluarga()===1,'Belum kawin & 0 tanggungan harus 1 jiwa (diri sendiri), dapat '+profileJiwaKeluarga());
D.profile.statusKawin=true; D.profile.tanggungan=0;
_selfTestAssert(profileJiwaKeluarga()===2,'Kawin & 0 tanggungan harus 2 jiwa (diri sendiri+pasangan), dapat '+profileJiwaKeluarga());
D.profile.statusKawin=true; D.profile.tanggungan=1;
_selfTestAssert(profileJiwaKeluarga()===3,'Kawin & 1 tanggungan harus 3 jiwa, dapat '+profileJiwaKeluarga());
D.profile.statusKawin=true; D.profile.tanggungan=3;
_selfTestAssert(profileJiwaKeluarga()===5,'Kawin & 3 tanggungan harus 5 jiwa, dapat '+profileJiwaKeluarga());
D.profile.statusKawin=false; D.profile.tanggungan=undefined;
_selfTestAssert(profileJiwaKeluarga()===1,'Tanggungan undefined/belum diisi harus dianggap 0, bukan error');
} finally {
D.profile.statusKawin=backup.statusKawin; D.profile.tanggungan=backup.tanggungan;
}
_selfTestAssert(D.profile.statusKawin===backup.statusKawin&&D.profile.tanggungan===backup.tanggungan,'Profil Pribadi asli harus balik seperti semula setelah tes');
}},
{name:'updateUsiaPreview(): usia di kartu Profil Pribadi ikut Tanggal Lahir & sembunyi kalau kosong', fn:()=>{
if(typeof updateUsiaPreview!=='function'||!document.getElementById('sUsiaPreview'))return;
const backup=D.profile.tanggalLahir;
try{
D.profile.tanggalLahir=null;
updateUsiaPreview();
_selfTestAssert(document.getElementById('sUsiaPreview').style.display==='none','Tanpa Tanggal Lahir, baris usia harus disembunyikan');
const b=new Date(); b.setFullYear(b.getFullYear()-29);
D.profile.tanggalLahir=b.toISOString().split('T')[0];
updateUsiaPreview();
_selfTestAssert(document.getElementById('sUsiaPreview').style.display==='block','Dengan Tanggal Lahir terisi, baris usia harus ditampilkan');
_selfTestAssert(document.getElementById('sUsiaVal').textContent==='29 tahun','Usia harus dihitung benar dari Tanggal Lahir (29 tahun), dapat '+document.getElementById('sUsiaVal').textContent);
} finally {
D.profile.tanggalLahir=backup;
updateUsiaPreview();
}
}},
{name:'renderPajakRekomendasi(): saran kalkulator pajak ikut Status Pekerjaan & sembunyi kalau belum diisi', fn:()=>{
if(typeof renderPajakRekomendasi!=='function'||!document.getElementById('pajakRekomendasiCard'))return;
const backup=D.profile.statusPekerjaan;
try{
D.profile.statusPekerjaan=null;
renderPajakRekomendasi();
_selfTestAssert(document.getElementById('pajakRekomendasiCard').style.display==='none','Belum pilih Status Pekerjaan -> kartu rekomendasi harus disembunyikan');
D.profile.statusPekerjaan='karyawan';
renderPajakRekomendasi();
_selfTestAssert(document.getElementById('pajakRekomendasiCard').style.display==='block','Status Karyawan -> kartu rekomendasi harus tampil');
_selfTestAssert(/PPh 21/.test(document.getElementById('pajakRekomendasiText').innerHTML),'Status Karyawan -> saran harus menyebut PPh 21');
D.profile.statusPekerjaan='freelance';
renderPajakRekomendasi();
_selfTestAssert(/UMKM/.test(document.getElementById('pajakRekomendasiText').innerHTML),'Status Freelance/UMKM -> saran harus menyebut UMKM');
} finally {
D.profile.statusPekerjaan=backup;
renderPajakRekomendasi();
}
}},
{name:'hitungPPh21Progresif() menerapkan tarif berjenjang dengan benar', fn:()=>{
_selfTestAssert(hitungPPh21Progresif(0).pajak===0,'PKP 0 harus menghasilkan pajak 0');
_selfTestAssert(hitungPPh21Progresif(60000000).pajak===3000000,'PKP 60jt (lapisan 5%) harus 3.000.000, dapat '+hitungPPh21Progresif(60000000).pajak);
const r=hitungPPh21Progresif(100000000);
_selfTestAssert(r.pajak===9000000,'PKP 100jt (60jt×5% + 40jt×15%) harus 9.000.000, dapat '+r.pajak);
}},
{name:'daysUntilDate() & dateStatusBadge() mendeteksi status jatuh tempo STNK/SIM dengan benar', fn:()=>{
_selfTestAssert(daysUntilDate(null)===null,'daysUntilDate(null) harus null');
_selfTestAssert(dateStatusBadge(null).label==='Belum diisi','Tanggal kosong harus berstatus "Belum diisi"');
const past=new Date(); past.setDate(past.getDate()-5);
_selfTestAssert(dateStatusBadge(dateToISO(past)).col==='red','Tanggal 5 hari lalu harus berstatus merah (lewat jatuh tempo)');
const soon=new Date(); soon.setDate(soon.getDate()+10);
_selfTestAssert(dateStatusBadge(dateToISO(soon)).col==='orange','Tanggal 10 hari lagi (≤30 hari) harus berstatus oranye (mendekati)');
const far=new Date(); far.setDate(far.getDate()+100);
_selfTestAssert(dateStatusBadge(dateToISO(far)).col==='green','Tanggal 100 hari lagi harus berstatus hijau (masih aktif)');
}},
{name:'sptTahunanDueDate() & sptStatusBadge(): batas lapor SPT Tahunan (31 Maret) dihitung & diberi status yang benar', fn:()=>{
if(typeof sptTahunanDueDate!=='function')return;
const due=new Date(sptTahunanDueDate());
_selfTestAssert(due.getMonth()===2&&due.getDate()===31,'sptTahunanDueDate() harus selalu jatuh di 31 Maret, dapat '+sptTahunanDueDate());
const now=new Date();now.setHours(0,0,0,0);
const diffDays=Math.round((now-due)/86400000);
_selfTestAssert(diffDays<=30,'sptTahunanDueDate() tidak boleh menunjuk tanggal yg sudah lewat >30 hari (harus sudah dimajukan ke tahun depan)');
const st=sptStatusBadge();
_selfTestAssert(typeof st.label==='string'&&st.label.length>0,'sptStatusBadge() harus selalu mengembalikan label, dapat kosong/undefined');
_selfTestAssert(['red','orange','green'].includes(st.col),'sptStatusBadge() harus salah satu warna red/orange/green, dapat '+st.col);
}},
{name:'hitungZakatPenghasilan(): wajib jika pemasukan bulan ini ≥ nisab, zakat = 2.5%', fn:()=>{
if(!document.getElementById('zpJumlah'))return;
hitungZakatPenghasilan();
const incomeBulan=parsePzNum(document.getElementById('zpIncomeBulan').textContent);
const nisab=parsePzNum(document.getElementById('zpNisabBulan').textContent);
const jumlah=parsePzNum(document.getElementById('zpJumlah').textContent);
const expected=(incomeBulan>=nisab)?Math.round(incomeBulan*0.025):0;
_selfTestAssert(jumlah===expected,'Zakat penghasilan seharusnya '+fmtFull(expected)+', dapat '+fmtFull(jumlah));
}},
{name:'Rumus Zakat Maal (85gr emas & 2.5%) konsisten dengan tampilan terakhir', fn:()=>{
if(!_pajakZakatRenderedOnce)return;
const nisabEl=document.getElementById('zmNisab'), hartaEl=document.getElementById('zmTotalHarta');
if(!nisabEl||!hartaEl||!nisabEl.textContent)return;
const pz=D.pajakZakat;
const expectedNisab=85*pz.hargaEmasPerGram;
_selfTestAssert(parsePzNum(nisabEl.textContent)===expectedNisab,'Nisab zakat maal tertampil harus = 85 × harga emas/gram ('+fmtFull(expectedNisab)+')');
const saldoAkun=totalSaldoAkun();
const asetZakatable=(D.assets||[]).filter(a=>a.zakatable).reduce((s,a)=>s+(a.nilai||0),0);
const expectedHarta=Math.max(0,saldoAkun+asetZakatable-(pz.utangJT||0));
_selfTestAssert(parsePzNum(hartaEl.textContent)===expectedHarta,'Total harta zakat maal tertampil harus = saldo akun + aset zakatable − utang');
}},
{name:'hitungZakatFitrah(): total = jumlah jiwa × tarif per jiwa', fn:()=>{
const jiwaEl=document.getElementById('zfJiwa');
if(!jiwaEl)return;
hitungZakatFitrah();
const jiwa=Math.max(1,parseInt(jiwaEl.value)||1);
const expected=jiwa*D.pajakZakat.zakatFitrahPerJiwa;
_selfTestAssert(parsePzNum(document.getElementById('zfTotal').textContent)===expected,'Total zakat fitrah harus '+fmtFull(expected));
}},
{name:'PPh21.hitung(): Penghasilan Bruto & Iuran Pensiun tersimpan ke D.pajakZakat supaya tidak reset tiap buka tab', fn:()=>{
const brutoEl=document.getElementById('pphBruto'),iuranEl=document.getElementById('pphIuran');
if(!brutoEl||!iuranEl)return;
hitungPPh21();
const brutoExpected=parsePzNum(brutoEl.value),iuranExpected=parsePzNum(iuranEl.value);
_selfTestAssert(D.pajakZakat.pphBrutoBulan===brutoExpected,'pphBrutoBulan tersimpan harus ikut nilai field Penghasilan Bruto ('+brutoExpected+'), dapat '+D.pajakZakat.pphBrutoBulan);
_selfTestAssert(D.pajakZakat.pphIuranBulan===iuranExpected,'pphIuranBulan tersimpan harus ikut nilai field Iuran Pensiun ('+iuranExpected+'), dapat '+D.pajakZakat.pphIuranBulan);
}},
{name:'renderUMKMPajak(): PPh Final UMKM = 0.5% dari omzet Cobek bulan ini', fn:()=>{
if(!document.getElementById('umkmOmzet'))return;
renderUMKMPajak();
const omzet=parsePzNum(document.getElementById('umkmOmzet').textContent);
const pajak=parsePzNum(document.getElementById('umkmPajak').textContent);
_selfTestAssert(pajak===Math.round(omzet*0.005),'Pajak UMKM harus 0.5% dari omzet ('+fmtFull(Math.round(omzet*0.005))+'), dapat '+fmtFull(pajak));
}},
{name:'hitungPBB(): NJOP kena pajak & PBB terutang dihitung sesuai NJOPTKP & tarif', fn:()=>{
if(!document.getElementById('pbbNjopTotal'))return;
hitungPBB();
const bumi=parsePzNum(document.getElementById('pbbNjopBumi').value);
const bangunan=parsePzNum(document.getElementById('pbbNjopBangunan').value);
const njoptkp=parsePzNum(document.getElementById('pbbNjoptkp').value);
const tarif=parseFloat((document.getElementById('pbbTarif').value||'0').replace(',','.'))||0;
const expectedTotal=bumi+bangunan;
const expectedKenaPajak=Math.max(0,expectedTotal-njoptkp);
const expectedTerutang=Math.round(expectedKenaPajak*(tarif/100));
_selfTestAssert(parsePzNum(document.getElementById('pbbNjopTotal').textContent)===expectedTotal,'NJOP Total harus = NJOP Bumi + NJOP Bangunan');
_selfTestAssert(parsePzNum(document.getElementById('pbbNjopKenaPajak').textContent)===expectedKenaPajak,'NJOP Kena Pajak harus = NJOP Total − NJOPTKP (minimal 0)');
_selfTestAssert(parsePzNum(document.getElementById('pbbTerutang').textContent)===expectedTerutang,'PBB terutang harus = NJOP Kena Pajak × tarif%');
}},
{name:'Buku Aset: totalAssetValue() & Kekayaan Bersih konsisten (aset sementara, tidak disimpan)', fn:()=>{
const before=totalAssetValue();
const dummy={id:'__selftest_asset__',name:'Tes Diagnostik',jenis:'Lainnya',lokasi:'',nilai:1000,tanggal:'',zakatable:false};
D.assets.push(dummy);
let after;
try{ after=totalAssetValue(); } finally { D.assets=D.assets.filter(a=>a.id!=='__selftest_asset__'); }
_selfTestAssert(after===before+1000,'totalAssetValue() harus bertambah 1.000 setelah aset sementara ditambahkan');
_selfTestAssert(!D.assets.some(a=>a.id==='__selftest_asset__'),'Aset sementara tes gagal dibersihkan dari D.assets');
const netEl=document.getElementById('kbNetWorth');
if(netEl&&netEl.textContent){
renderKekayaanBersih();
const utang=D.pajakZakat.utangJT||parsePzNum(document.getElementById('zmUtang')?document.getElementById('zmUtang').value:0);
const expected=totalSaldoAkun()+totalAssetValue()-utang;
_selfTestAssert(parsePzNum(netEl.textContent)===expected,'Kekayaan Bersih harus = saldo akun + total aset − utang');
}
}},
{name:'Regresi bug ID string vs number: pencarian & hapus di Aset/Piutang/Kekayaan/SIM/Zakat (sementara, tidak disimpan)', fn:()=>{
const numId=uid();
const strId=String(numId);
const dummyAsset={id:numId,name:'__selftest_id__',jenis:'Lainnya',lokasi:'',nilai:1,tanggal:'',zakatable:false};
D.assets.push(dummyAsset);
_selfTestAssert(D.assets.find(x=>sameId(x.id,strId))===dummyAsset,'Aset: pencarian dgn id STRING harus tetap ketemu walau id asli NUMBER');
D.assets=D.assets.filter(a=>!sameId(a.id,strId));
_selfTestAssert(!D.assets.some(a=>a.id===numId),'Aset: hapus dgn id STRING harus tetap menghapus walau id asli NUMBER');
const dummyPiutang={id:numId,name:'__selftest_id__',nilai:1,tanggal:'',jatuhTempo:'',catatan:'',lunas:false};
D.piutang.push(dummyPiutang);
_selfTestAssert(D.piutang.find(x=>sameId(x.id,strId))===dummyPiutang,'Piutang: pencarian dgn id STRING harus tetap ketemu walau id asli NUMBER');
D.piutang=D.piutang.filter(p=>!sameId(p.id,strId));
_selfTestAssert(!D.piutang.some(p=>p.id===numId),'Piutang: hapus dgn id STRING harus tetap menghapus walau id asli NUMBER');
if(!D.wealthSnapshots)D.wealthSnapshots=[];
const dummySnap={id:numId,date:'2000-01-01',netWorth:1,auto:false};
D.wealthSnapshots.push(dummySnap);
_selfTestAssert(D.wealthSnapshots.find(x=>sameId(x.id,strId))===dummySnap,'Kekayaan: pencarian snapshot dgn id STRING harus tetap ketemu walau id asli NUMBER');
D.wealthSnapshots=D.wealthSnapshots.filter(s=>!sameId(s.id,strId));
_selfTestAssert(!D.wealthSnapshots.some(s=>s.id===numId),'Kekayaan: hapus snapshot dgn id STRING harus tetap menghapus walau id asli NUMBER');
const dummySim={id:numId,nama:'__selftest_id__',jenis:'SIM C',tglAkhir:''};
D.simList.push(dummySim);
_selfTestAssert(D.simList.find(x=>sameId(x.id,strId))===dummySim,'SIM: pencarian dgn id STRING harus tetap ketemu walau id asli NUMBER');
D.simList=D.simList.filter(s=>!sameId(s.id,strId));
_selfTestAssert(!D.simList.some(s=>s.id===numId),'SIM: hapus dgn id STRING harus tetap menghapus walau id asli NUMBER');
if(!D.pajakZakat.zakatLog)D.pajakZakat.zakatLog=[];
const dummyZakat={id:numId,jenis:'maal',tanggal:'2000-01-01',jumlah:1};
D.pajakZakat.zakatLog.push(dummyZakat);
_selfTestAssert(D.pajakZakat.zakatLog.find(x=>sameId(x.id,strId))===dummyZakat,'Zakat: pencarian catatan dgn id STRING harus tetap ketemu walau id asli NUMBER');
D.pajakZakat.zakatLog=D.pajakZakat.zakatLog.filter(l=>!sameId(l.id,strId));
_selfTestAssert(!D.pajakZakat.zakatLog.some(l=>l.id===numId),'Zakat: hapus catatan dgn id STRING harus tetap menghapus walau id asli NUMBER');
}},
{name:'Regresi bug ID string vs number: Tagihan/BBM/Servis/Tukang tetap aman lewat pola pemanggilan yang benar (sementara, tidak disimpan)', fn:()=>{
const numId=uid();
const dummyBill={id:numId,name:'__selftest_id__',amount:1,nextDue:'2000-01-01',freq:'sekali',category:'Tagihan',subcategory:'',accountId:null,note:'',kind:'tagihan'};
D.bills.push(dummyBill);
const idFromJsonArgs=JSON.parse(JSON.stringify([numId]))[0];
_selfTestAssert(typeof idFromJsonArgs==='number','Bills: id yang lewat JSON.parse(data-args) harus tetap bertipe number, bukan string');
_selfTestAssert(D.bills.find(x=>x.id===idFromJsonArgs)===dummyBill,'Bills: pencarian id via jalur data-args (number) harus tetap ketemu');
D.bills=D.bills.filter(b=>b.id!==numId);
_selfTestAssert(!D.bills.some(b=>b.id===numId),'Bills: hapus id via jalur yang benar harus tetap berhasil');
const dummyBbm={id:numId,vehicleId:'v1',date:'2000-01-01',km:1,liter:1,harga:1,cost:1,spbu:'',fullTank:true,note:'',accountId:null,txLinkId:null};
D.bbmLogs.push(dummyBbm);
const bbmIdFromArgs=JSON.parse(JSON.stringify([numId]))[0];
_selfTestAssert(D.bbmLogs.find(x=>x.id===bbmIdFromArgs)===dummyBbm,'BBM: pencarian id via jalur data-args (number) harus tetap ketemu');
D.bbmLogs=D.bbmLogs.filter(b=>b.id!==numId);
const dummyServis={id:numId,vehicleId:'v1',date:'2000-01-01',item:'__selftest_id__',categoryId:null,km:1,cost:1,note:'',accountId:null,txLinkId:null};
D.servisLogs.push(dummyServis);
const servisIdFromArgs=JSON.parse(JSON.stringify([numId]))[0];
_selfTestAssert(D.servisLogs.find(x=>x.id===servisIdFromArgs)===dummyServis,'Servis: pencarian id via jalur data-args (number) harus tetap ketemu');
D.servisLogs=D.servisLogs.filter(s=>s.id!==numId);
const strId=String(numId);
const dummyWorker={id:numId,name:'__selftest_id__',upahJam:1,jamKerjaNormal:7,upahLemburJam:1};
D.tukangWorkers.push(dummyWorker);
_selfTestAssert(D.tukangWorkers.find(x=>x.id==strId)===dummyWorker,'Tukang: pencarian pekerja dgn id STRING harus tetap ketemu (loose ==) walau id asli NUMBER');
D.tukangWorkers=D.tukangWorkers.filter(x=>x.id!=strId);
_selfTestAssert(!D.tukangWorkers.some(w=>w.id===numId),'Tukang: hapus pekerja dgn id STRING harus tetap berhasil (loose ==)');
}},
{name:'Sewa Kios: catatSewa->applyPaymentLink (riwayat baru "diterima" HANYA setelah tx tersimpan), sync 2 arah edit/hapus, & ROI (sementara, tidak disimpan)', fn:()=>{
const dummyProj={id:'__selftest_renovproj__',name:'__selftest_renovproj__',catatan:'',createdAt:'2000-01-01',items:[{id:'__selftest_renovitem__',name:'x',harga:1000000,category:'',accountId:null,note:'',paid:true,txId:null,paidDate:null}]};
D.renovProjects.push(dummyProj);
const dummyUnit={id:'__selftest_sk_unit__',name:'__selftest_sk_unit__',renovProjectId:dummyProj.id,accountId:D.accounts[0]?.id||null,status:'disewa',penyewa:'',hargaSewaBulanan:200000,catatan:'',mulai:'2000-01-01',riwayat:[]};
D.sewaKios.units.push(dummyUnit);
try{
SewaKios.pendingUnitId=dummyUnit.id;
_selfTestAssert(dummyUnit.riwayat.length===0,'Sewa Kios: riwayat TIDAK boleh bertambah sebelum applyPaymentLink() dipanggil (tx belum beneran tersimpan)');
const fakeTxId=uid();
D.transactions.push({id:fakeTxId,type:'income',amount:200000,category:'Bisnis',subcategory:'',accountId:D.accounts[0]?.id||'',payMethod:'tunai',note:'__selftest_sk_tx__',date:'2000-02-01'});
SewaKios.applyPaymentLink(fakeTxId);
_selfTestAssert(dummyUnit.riwayat.length===1,'Sewa Kios: riwayat harus bertambah 1 setelah applyPaymentLink() dgn tx yg valid');
_selfTestAssert(dummyUnit.riwayat[0].txId===fakeTxId,'Sewa Kios: entri riwayat harus tersambung ke ID transaksi asli (txId)');
const linkedTx=D.transactions.find(x=>x.id===fakeTxId);
_selfTestAssert(linkedTx.sewaKiosLinkId===dummyUnit.id,'Transaksi harus tersambung balik ke unit (sewaKiosLinkId) — link 2 arah');
_selfTestAssert(SewaKios.pendingUnitId===null,'pendingUnitId harus direset ke null setelah applyPaymentLink() dipakai');
const r1=SewaKios.roi(dummyUnit);
_selfTestAssert(r1.modal===1000000,'ROI: modal harus diambil dari Renov.totals() proyek yg ditautkan');
_selfTestAssert(r1.diterima===200000,'ROI: diterima harus = jumlah semua riwayat sewa unit ini');
_selfTestAssert(r1.pctBalik===20,'ROI: persen balik modal harus 20% (200rb dari 1jt)');
_selfTestAssert(r1.paybackBulan===5,'ROI: estimasi balik modal harus ceil(modal/hargaSewaBulanan) = 5 bulan');
linkedTx.amount=250000;linkedTx.date='2000-03-01';
SewaKios.onLinkedTxEdited(linkedTx);
_selfTestAssert(dummyUnit.riwayat[0].jumlah===250000,'Sewa Kios: onLinkedTxEdited harus sinkronkan nominal riwayat sesuai transaksi yg diedit');
_selfTestAssert(dummyUnit.riwayat[0].tanggal==='2000-03-01','Sewa Kios: onLinkedTxEdited harus sinkronkan tanggal riwayat sesuai transaksi yg diedit');
SewaKios.onLinkedTxDeleted(linkedTx);
_selfTestAssert(dummyUnit.riwayat.length===0,'Sewa Kios: onLinkedTxDeleted harus menghapus entri riwayat terkait tapi TIDAK menghapus unit-nya');
_selfTestAssert(D.sewaKios.units.some(u=>u.id===dummyUnit.id),'Sewa Kios: unit tidak boleh ikut terhapus saat transaksi sewa terkait dihapus');
D.transactions=D.transactions.filter(t=>t.id!==fakeTxId);
} finally {
D.sewaKios.units=D.sewaKios.units.filter(u=>u.id!==dummyUnit.id);
D.renovProjects=D.renovProjects.filter(p=>p.id!==dummyProj.id);
SewaKios.pendingUnitId=null;
}
}},
{name:'Stok Sparepart (Cobek): tambah/hapus item tidak merusak D.partsStock (sementara, tidak disimpan)', fn:()=>{
const before=D.partsStock.length;
const dummy={id:'__selftest_stock__',name:'Tes Diagnostik',catId:null,code:'TEST-000',qty:5,unit:'pcs',minStock:1,price:1000,note:''};
D.partsStock.push(dummy);
_selfTestAssert(D.partsStock.length===before+1,'D.partsStock harus bertambah 1 setelah item sementara ditambahkan');
D.partsStock=D.partsStock.filter(p=>p.id!=='__selftest_stock__');
_selfTestAssert(D.partsStock.length===before,'D.partsStock harus kembali ke jumlah semula setelah item sementara dihapus');
}},
{name:'getBudgetUsed() & getBudgetEffectiveLimit(): agregasi anggaran total sesuai transaksi bulan berjalan', fn:()=>{
const dummyBudget={id:'__selftest_budget__',catIds:['__total__'],limit:1,rollover:false};
const manual=D.transactions.filter(t=>{
const d=new Date(t.date);
return t.type==='expense'&&d.getMonth()===curMonth&&d.getFullYear()===curYear;
}).reduce((s,t)=>s+t.amount,0);
_selfTestAssert(getBudgetUsed(dummyBudget)===manual,'getBudgetUsed() untuk anggaran total harus sama dengan jumlah manual pengeluaran bulan ini');
_selfTestAssert(getBudgetEffectiveLimit(dummyBudget)===1,'getBudgetEffectiveLimit() tanpa rollover harus sama dengan limit anggaran');
_selfTestAssert(!D.budgets.some(b=>b.id==='__selftest_budget__'),'Tes tidak boleh menambahkan anggaran sungguhan ke D.budgets');
}},
{name:'Anggaran periode (bulanan/tahunan/1x nominal): getBudgetUsed() memakai jendela waktu yg tepat per periode', fn:()=>{
const manualBulan=D.transactions.filter(t=>{
const d=new Date(t.date);
return t.type==='expense'&&d.getMonth()===curMonth&&d.getFullYear()===curYear;
}).reduce((s,t)=>s+t.amount,0);
const manualTahun=D.transactions.filter(t=>{
const d=new Date(t.date);
return t.type==='expense'&&d.getFullYear()===curYear;
}).reduce((s,t)=>s+t.amount,0);
const bBulanan={id:'__selftest_budget_bulanan__',catIds:['__total__'],limit:1,rollover:false,period:'bulanan'};
const bTahunan={id:'__selftest_budget_tahunan__',catIds:['__total__'],limit:1,rollover:false,period:'tahunan'};
_selfTestAssert(getBudgetUsed(bBulanan)===manualBulan,'Anggaran period=bulanan harus hanya menjumlah transaksi bulan berjalan');
_selfTestAssert(getBudgetUsed(bTahunan)===manualTahun,'Anggaran period=tahunan harus menjumlah transaksi sepanjang tahun berjalan, bukan cuma bulan ini');
_selfTestAssert(manualTahun>=manualBulan,'Total pengeluaran setahun harus selalu >= total pengeluaran bulan berjalan (sanity check)');
const oldDate=new Date(); oldDate.setFullYear(oldDate.getFullYear()-5);
const oldDateStr=oldDate.toISOString().slice(0,10);
const dummyOldTx={id:'__selftest_tx_old__',type:'expense',amount:12345,category:'__selftest_cat__',subcategory:'',accountId:D.accounts[0]?D.accounts[0].id:'',payMethod:'tunai',note:'',date:oldDateStr};
const dummyNewTx={id:'__selftest_tx_new__',type:'expense',amount:6789,category:'__selftest_cat__',subcategory:'',accountId:D.accounts[0]?D.accounts[0].id:'',payMethod:'tunai',note:'',date:todayStr()};
D.transactions.push(dummyOldTx,dummyNewTx);
try{
const bSekali={id:'__selftest_budget_sekali__',catIds:['__total__'],limit:1,rollover:false,period:'sekali',createdAt:new Date().toISOString()};
const usedSekali=getBudgetUsed(bSekali);
_selfTestAssert(usedSekali>=6789,'Anggaran period=sekali harus ikut menghitung transaksi baru (dibuat setelah createdAt)');
const withoutOld=D.transactions.filter(t=>t.id!=='__selftest_tx_old__');
const D_transactionsBackup=D.transactions;
D.transactions=withoutOld;
const usedWithoutOld=getBudgetUsed(bSekali);
D.transactions=D_transactionsBackup;
_selfTestAssert(usedSekali===usedWithoutOld,'Anggaran period=sekali tidak boleh ikut menghitung transaksi yang tanggalnya sebelum anggaran dibuat (createdAt)');
} finally {
D.transactions=D.transactions.filter(t=>t.id!=='__selftest_tx_old__'&&t.id!=='__selftest_tx_new__');
}
_selfTestAssert(!D.transactions.some(t=>t.id==='__selftest_tx_old__'||t.id==='__selftest_tx_new__'),'Transaksi sementara tes periode anggaran gagal dibersihkan dari D.transactions');
const bTahunanRollover={id:'__selftest_budget_tr__',catIds:['__total__'],limit:5000,rollover:true,period:'tahunan'};
_selfTestAssert(getBudgetEffectiveLimit(bTahunanRollover)===5000,'getBudgetEffectiveLimit() utk period=tahunan harus mengabaikan rollover & tetap sama dgn limit asli');
const bSekaliRollover={id:'__selftest_budget_sr__',catIds:['__total__'],limit:5000,rollover:true,period:'sekali'};
_selfTestAssert(getBudgetEffectiveLimit(bSekaliRollover)===5000,'getBudgetEffectiveLimit() utk period=sekali harus mengabaikan rollover & tetap sama dgn limit asli');
_selfTestAssert(!D.budgets.some(b=>String(b.id).indexOf('__selftest_budget')===0),'Tes tidak boleh menambahkan anggaran sungguhan ke D.budgets');
}},
{name:'getVehicleKm() & getLastServiceKm(): KM tertinggi & KM servis terakhir dihitung benar', fn:()=>{
if(!D.vehicles||!D.vehicles.length)return;
const v=D.vehicles[0];
const kms=[
...D.bbmLogs.filter(b=>b.vehicleId===v.id).map(b=>b.km),
...D.servisLogs.filter(s=>s.vehicleId===v.id&&s.km).map(s=>s.km),
...D.kmLogs.filter(k=>k.vehicleId===v.id).map(k=>k.km)
];
const expectedMax=kms.length?Math.max(...kms):0;
_selfTestAssert(getVehicleKm(v.id)===expectedMax,'getVehicleKm() harus mengembalikan KM tertinggi dari semua log (BBM/servis/KM manual)');
const servisLogs=D.servisLogs.filter(s=>s.vehicleId===v.id&&s.km).sort((a,b)=>new Date(b.date)-new Date(a.date)||b.km-a.km);
const expectedLast=servisLogs.length?servisLogs[0].km:0;
_selfTestAssert(getLastServiceKm(v.id)===expectedLast,'getLastServiceKm() harus mengembalikan KM dari servis paling terbaru');
}},
{name:'Arsip: archiveAvailableYears() & archiveCollectByYears() konsisten dengan data riwayat', fn:()=>{
const years=archiveAvailableYears();
_selfTestAssert(Array.isArray(years),'archiveAvailableYears() harus mengembalikan array');
if(!years.length)return;
const y=years[0];
const collected=archiveCollectByYears(new Set([y]));
const manualCount=ARCHIVE_MODULES.reduce((s,m)=>s+(D[m.key]||[]).filter(it=>archiveGetYear(it.date)===y).length,0);
const collectedCount=Object.values(collected).reduce((s,arr)=>s+arr.length,0);
_selfTestAssert(collectedCount===manualCount,'archiveCollectByYears() jumlah data tidak sama dengan hitungan manual per modul');
}},
{name:'buildLaporanExportData(): total per kategori sama dengan total pemasukan + pengeluaran', fn:()=>{
const {inc,exp,katRows}=buildLaporanExportData();
const sumKat=katRows.reduce((s,[,v])=>s+v.inc+v.exp,0);
_selfTestAssert(sumKat===inc+exp,'Jumlah per kategori pada Laporan harus sama dengan total pemasukan + pengeluaran keseluruhan');
}},
{name:'getProactiveReminders(): tagihan H-3 muncul di reminder, H-30 tidak (item sementara, tidak disimpan)', fn:()=>{
const before=D.bills.length;
const near=new Date();near.setDate(near.getDate()+3);
const far=new Date();far.setDate(far.getDate()+30);
const dummyNear={id:'__selftest_reminder_near__',name:'Tes Reminder Dekat',kind:'tagihan',amount:12345,nextDue:dateToISO(near)};
const dummyFar={id:'__selftest_reminder_far__',name:'Tes Reminder Jauh',kind:'tagihan',amount:99999,nextDue:dateToISO(far)};
D.bills.push(dummyNear,dummyFar);
try{
const reminders=getProactiveReminders();
_selfTestAssert(Array.isArray(reminders),'getProactiveReminders() harus mengembalikan array');
_selfTestAssert(reminders.some(r=>r.includes('Tes Reminder Dekat')),'Tagihan H-3 harus muncul di getProactiveReminders()');
_selfTestAssert(!reminders.some(r=>r.includes('Tes Reminder Jauh')),'Tagihan H-30 TIDAK boleh muncul di getProactiveReminders() (di luar jendela H-7)');
} finally {
D.bills=D.bills.filter(b=>b.id!=='__selftest_reminder_near__'&&b.id!=='__selftest_reminder_far__');
_selfTestAssert(D.bills.length===before,'D.bills harus kembali ke jumlah semula setelah tes reminder');
}
}},
{name:'extractChatAction(): parsing blok [[ACTION]] dari balasan AI (valid, tanpa action, & JSON rusak)', fn:()=>{
const withAction=extractChatAction('Oke dicatat ya!\n\n[[ACTION]]{"type":"add_transaksi","data":{"type":"expense","amount":50000}}[[/ACTION]]');
_selfTestAssert(withAction.text==='Oke dicatat ya!','extractChatAction() harus memisahkan teks bersih dari blok ACTION');
_selfTestAssert(withAction.action&&withAction.action.type==='add_transaksi','extractChatAction() harus mem-parsing tipe aksi dgn benar');
const noAction=extractChatAction('Cuma jawaban teks biasa tanpa usul aksi apa pun');
_selfTestAssert(noAction.action===null,'extractChatAction() harus mengembalikan action:null kalau tidak ada blok ACTION');
const broken=extractChatAction('Teks sebelum [[ACTION]]{ini bukan json valid}[[/ACTION]]');
_selfTestAssert(broken.action===null,'extractChatAction() harus fail-safe (action:null) kalau JSON di dalam blok ACTION rusak, bukan melempar error');
const unknownType=extractChatAction('Teks [[ACTION]]{"type":"hapus_semua_data","data":{}}[[/ACTION]]');
_selfTestAssert(unknownType.action===null,'extractChatAction() harus menolak tipe aksi yang tidak ada di whitelist CHAT_ACTION_HANDLERS');
}},
{name:'RefAI._parseJSON(): parsing balasan AI utk Cek Update Referensi (JSON bersih, dgn code fence, & rusak)', fn:()=>{
const clean=RefAI._parseJSON('{"hargaEmasPerGram":{"value":2700000,"source":"Antam","tanggal":"2026-07-01"}}');
_selfTestAssert(clean&&clean.hargaEmasPerGram&&clean.hargaEmasPerGram.value===2700000,'RefAI._parseJSON() harus bisa parse JSON bersih');
const fenced=RefAI._parseJSON('```json\n{"zakatFitrahPerJiwa":{"value":40000,"source":"BAZNAS","tanggal":"2026"}}\n```');
_selfTestAssert(fenced&&fenced.zakatFitrahPerJiwa&&fenced.zakatFitrahPerJiwa.value===40000,'RefAI._parseJSON() harus bisa lepas markdown code fence ```json ... ```');
const withPreamble=RefAI._parseJSON('Ini hasilnya:\n{"nisabPenghasilanBulan":{"value":8000000,"source":"x","tanggal":"y"}}\nSemoga membantu.');
_selfTestAssert(withPreamble&&withPreamble.nisabPenghasilanBulan&&withPreamble.nisabPenghasilanBulan.value===8000000,'RefAI._parseJSON() harus bisa ambil blok {...} walau ada teks pembuka/penutup di luar JSON');
const broken=RefAI._parseJSON('bukan JSON sama sekali, cuma teks biasa');
_selfTestAssert(broken===null,'RefAI._parseJSON() harus fail-safe (null) kalau teksnya bukan JSON, bukan melempar error');
}},
{name:'renderRefCheckReminder(): banner ⚠️ muncul kalau ≥180 hari sejak terakhir cek, disembunyikan kalau baru', fn:()=>{
const before=D.pajakZakat.refCheckedAt;
try{
const old=new Date(); old.setDate(old.getDate()-200);
D.pajakZakat.refCheckedAt=old.toISOString().split('T')[0];
renderRefCheckReminder();
const el=document.getElementById('refCheckReminder');
if(el)_selfTestAssert(el.style.display==='block','Banner reminder harus tampil kalau sudah ≥180 hari sejak terakhir cek');
D.pajakZakat.refCheckedAt=todayStr();
renderRefCheckReminder();
if(el)_selfTestAssert(el.style.display==='none','Banner reminder harus tersembunyi kalau baru saja dicek');
} finally {
D.pajakZakat.refCheckedAt=before;
renderRefCheckReminder();
}
}},
{name:'extractChatAction(): auto-repair JSON "hampir benar" dari AI (kutip tunggal, key tanpa kutip, trailing comma)', fn:()=>{
const singleQuote=extractChatAction("Oke [[ACTION]]{'type':'add_transaksi','data':{'amount':50000,'category':'bensin'}}[[/ACTION]]");
_selfTestAssert(singleQuote.action&&singleQuote.action.type==='add_transaksi'&&singleQuote.action.data.amount===50000,'extractChatAction() harus bisa perbaiki JSON yg pakai kutip tunggal');
const unquotedKey=extractChatAction('Oke [[ACTION]]{type:"add_transaksi",data:{amount:50000,category:"bensin"}}[[/ACTION]]');
_selfTestAssert(unquotedKey.action&&unquotedKey.action.type==='add_transaksi','extractChatAction() harus bisa perbaiki JSON yg key-nya tanpa kutip');
const trailingComma=extractChatAction('Oke [[ACTION]]{"type":"add_transaksi","data":{"amount":50000,}}[[/ACTION]]');
_selfTestAssert(trailingComma.action&&trailingComma.action.type==='add_transaksi','extractChatAction() harus bisa perbaiki JSON dgn trailing comma');
const stillBroken=extractChatAction('Oke [[ACTION]]{ini bukan json valid}[[/ACTION]]');
_selfTestAssert(stillBroken.action===null&&stillBroken.actionError===true,'extractChatAction() tidak boleh memaksa parse teks yg sama sekali bukan JSON');
}},
{name:'CHAT_ACTION_HANDLERS: menolak input tidak valid sebelum sempat menyimpan apa pun', fn:()=>{
const beforeTx=D.transactions.length,beforeBills=D.bills.length,beforeAnak=(D.catatan.anak||[]).length;
let threw=false;
try{ CHAT_ACTION_HANDLERS.add_transaksi({type:'expense',amount:0}); }catch(e){ threw=true; }
_selfTestAssert(threw,'add_transaksi harus menolak nominal 0/tidak valid');
threw=false;
try{ CHAT_ACTION_HANDLERS.add_tagihan({name:'Tes',amount:10000,nextDue:'tanggal-ngawur'}); }catch(e){ threw=true; }
_selfTestAssert(threw,'add_tagihan harus menolak tanggal jatuh tempo yang tidak valid');
threw=false;
try{ CHAT_ACTION_HANDLERS.add_catatan_anak({text:'   '}); }catch(e){ threw=true; }
_selfTestAssert(threw,'add_catatan_anak harus menolak teks kosong');
_selfTestAssert(D.transactions.length===beforeTx&&D.bills.length===beforeBills&&(D.catatan.anak||[]).length===beforeAnak,'Validasi yang gagal TIDAK boleh menyisipkan data apa pun ke D');
}},
{name:'runDataHealthCheck(): mendeteksi transaksi Cobek dengan produk terhapus & absensi dengan total tidak valid (sementara, dicadangkan & dikembalikan)', fn:()=>{
if(typeof runDataHealthCheck!=='function'||typeof openModal!=='function')return;
const backupCobek=D.cobek,backupWorkDays=D.workDays;
try{
D.cobek=[{id:'__t_cobek__',date:'2026-01-01',items:[{productId:'__nonexistent_product__',name:'Produk Hantu',qty:1}],customer:{name:'Tes'},accountId:'__nonexistent_acc__',txLinkId:'__nonexistent_tx__',total:1000,profit:100}];
D.workDays=[{id:'__t_wd__',date:'tanggal-ngawur',total:NaN}];
runDataHealthCheck();
const listHtml=document.getElementById('dataHealthList')?document.getElementById('dataHealthList').innerHTML:'';
_selfTestAssert(listHtml.includes('produk tidak valid'),'Harus mendeteksi item Cobek yang produknya sudah dihapus');
_selfTestAssert(listHtml.includes('akun tidak valid')&&listHtml.includes('Shop'),'Harus mendeteksi transaksi Shop dengan akun tidak valid');
_selfTestAssert(listHtml.includes('kehilangan transaksi tertaut')&&listHtml.includes('Shop'),'Harus mendeteksi transaksi Shop yang txLinkId-nya hilang');
_selfTestAssert(listHtml.includes('Absensi dengan tanggal tidak valid'),'Harus mendeteksi absensi dengan tanggal rusak');
_selfTestAssert(listHtml.includes('Absensi dengan total gaji tidak valid'),'Harus mendeteksi absensi dengan total gaji NaN/negatif');
} finally {
D.cobek=backupCobek; D.workDays=backupWorkDays;
closeModal('dataHealthModal');
}
}},
{name:'isNoSpendDay() & computeNoSpendLast30() menghitung dari D.transactions dengan benar (sementara, dicadangkan & dikembalikan)', fn:()=>{
if(typeof isNoSpendDay!=='function'||typeof computeNoSpendLast30!=='function')return;
const backupTx=D.transactions;
try{
const today=dateToISO(new Date());
const yest=dateToISO(new Date(Date.now()-86400000));
D.transactions=[{id:'__t_tx1__',type:'expense',amount:5000,category:'Tes',date:yest}];
_selfTestAssert(isNoSpendDay(today)===true,'Hari ini tanpa transaksi expense harus dianggap No Spend Day');
_selfTestAssert(isNoSpendDay(yest)===false,'Hari dengan transaksi expense TIDAK boleh dianggap No Spend Day');
const stats=computeNoSpendLast30();
_selfTestAssert(stats.total===30,'computeNoSpendLast30() harus selalu menghitung jendela 30 hari');
_selfTestAssert(stats.count===29,'Dari 30 hari dgn 1 hari ada expense (kemarin), harus ada 29 No Spend Day, dapat '+stats.count);
} finally {
D.transactions=backupTx;
}
}},
{name:'LifeBalance.compute() menghasilkan skor 0-100 dari 4 komponen 25 poin', fn:()=>{
if(typeof LifeBalance==='undefined')return;
const r=LifeBalance.compute();
_selfTestAssert(Array.isArray(r.parts)&&r.parts.length===4,'LifeBalance.compute() harus punya 4 komponen, dapat '+(r.parts&&r.parts.length));
r.parts.forEach(p=>{
_selfTestAssert(p.max===25,'Setiap komponen Skor Hidup Seimbang harus berbobot maks 25, dapat '+p.max+' utk "'+p.label+'"');
_selfTestAssert(p.pts>=0&&p.pts<=25,'Poin komponen "'+p.label+'" harus antara 0-25, dapat '+p.pts);
});
const sumParts=r.parts.reduce((s,p)=>s+p.pts,0);
_selfTestAssert(r.total===sumParts,'r.total harus sama dgn jumlah semua r.parts[].pts');
_selfTestAssert(r.total>=0&&r.total<=100,'Skor total harus antara 0-100, dapat '+r.total);
}},
{name:'runDataHealthCheck(): mendeteksi ID/tanggal snapshot kekayaan duplikat & nilai tidak valid (sementara, dicadangkan & dikembalikan)', fn:()=>{
if(typeof runDataHealthCheck!=='function')return;
const backup=D.wealthSnapshots;
try{
D.wealthSnapshots=[
{id:'__ws_dup__',date:'2026-01-01',netWorth:1000000,auto:false},
{id:'__ws_dup__',date:'2026-01-01',netWorth:1100000,auto:false},
{id:'__ws_baddate__',date:'tanggal-ngawur',netWorth:500000,auto:false},
{id:'__ws_badval__',date:'2026-02-01',netWorth:NaN,auto:false}
];
runDataHealthCheck();
const listHtml=document.getElementById('dataHealthList')?document.getElementById('dataHealthList').innerHTML:'';
_selfTestAssert(listHtml.includes('ID snapshot kekayaan duplikat'),'Harus mendeteksi ID snapshot kekayaan yang duplikat');
_selfTestAssert(listHtml.includes('Tanggal snapshot kekayaan duplikat'),'Harus mendeteksi tanggal snapshot kekayaan yang duplikat');
_selfTestAssert(listHtml.includes('Snapshot kekayaan dengan tanggal tidak valid'),'Harus mendeteksi snapshot dengan tanggal rusak');
_selfTestAssert(listHtml.includes('Snapshot kekayaan dengan nilai tidak valid'),'Harus mendeteksi snapshot dengan netWorth NaN/rusak');
} finally {
D.wealthSnapshots=backup;
closeModal('dataHealthModal');
}
}},
{name:'runDataHealthCheck(): mendeteksi ID/tanggal snapshot Skor Hidup Seimbang duplikat & nilai tidak valid (sementara, dicadangkan & dikembalikan)', fn:()=>{
if(typeof runDataHealthCheck!=='function')return;
const backup=D.lifeBalanceSnapshots;
try{
D.lifeBalanceSnapshots=[
{id:'__lb_dup__',date:'2026-01-01',score:70,auto:false},
{id:'__lb_dup__',date:'2026-01-01',score:75,auto:false},
{id:'__lb_baddate__',date:'tanggal-ngawur',score:60,auto:false},
{id:'__lb_badval__',date:'2026-02-01',score:150,auto:false}
];
runDataHealthCheck();
const listHtml=document.getElementById('dataHealthList')?document.getElementById('dataHealthList').innerHTML:'';
_selfTestAssert(listHtml.includes('ID snapshot Skor Hidup Seimbang duplikat'),'Harus mendeteksi ID snapshot Skor Hidup Seimbang yang duplikat');
_selfTestAssert(listHtml.includes('Tanggal snapshot Skor Hidup Seimbang duplikat'),'Harus mendeteksi tanggal snapshot Skor Hidup Seimbang yang duplikat');
_selfTestAssert(listHtml.includes('Snapshot Skor Hidup Seimbang dengan tanggal tidak valid'),'Harus mendeteksi snapshot dengan tanggal rusak');
_selfTestAssert(listHtml.includes('Snapshot Skor Hidup Seimbang dengan nilai tidak valid'),'Harus mendeteksi snapshot dengan skor NaN/luar rentang 0-100');
} finally {
D.lifeBalanceSnapshots=backup;
closeModal('dataHealthModal');
}
}},
{name:'LifeBalance.saveSnapshot() mencatat snapshot skor & idempoten di tanggal yang sama (sementara, dicadangkan & dikembalikan)', fn:()=>{
if(typeof LifeBalance==='undefined')return;
const backup=D.lifeBalanceSnapshots;
try{
D.lifeBalanceSnapshots=[];
const today=todayStr();
LifeBalance.saveSnapshot(true);
_selfTestAssert(D.lifeBalanceSnapshots.length===1,'Setelah saveSnapshot() 1x, harus ada 1 snapshot, dapat '+D.lifeBalanceSnapshots.length);
const snap=D.lifeBalanceSnapshots[0];
_selfTestAssert(snap.date===today,'Snapshot harus bertanggal hari ini');
_selfTestAssert(snap.auto===false,'Snapshot manual harus punya auto=false');
_selfTestAssert(snap.score>=0&&snap.score<=100,'Skor snapshot harus 0-100, dapat '+snap.score);
LifeBalance.saveSnapshot(true);
_selfTestAssert(D.lifeBalanceSnapshots.length===1,'saveSnapshot() 2x di tanggal yang sama harus menimpa, bukan menambah baris baru, dapat '+D.lifeBalanceSnapshots.length);
} finally {
D.lifeBalanceSnapshots=backup;
}
}},
{name:'applyRestoredDataMigrations(): D.wealthSnapshots dipulihkan jadi array kosong kalau hilang dari backup lama (sementara, dicadangkan & dikembalikan)', fn:()=>{
if(typeof applyRestoredDataMigrations!=='function')return;
const backup=D.wealthSnapshots;
try{
delete D.wealthSnapshots;
applyRestoredDataMigrations();
_selfTestAssert(Array.isArray(D.wealthSnapshots),'D.wealthSnapshots harus dipulihkan jadi array kosong setelah migrasi restore, meski backup lama tidak punya field ini');
} finally { D.wealthSnapshots=backup; }
}},
{name:'renderBbmList / render Car Notes BBM: log BBM dengan km:null tidak boleh membuat tab Car Notes crash (BUGFIX)', fn:()=>{
if(typeof renderCnTab!=='function'||typeof renderVehicleSelect!=='function')return;
const backupBbm=D.bbmLogs,backupVeh=curVehicleId;
try{
const veh=D.vehicles[0];
if(!veh)return;
curVehicleId=veh.id;
D.bbmLogs=[{id:'__bbm_nullkm__',date:'2026-01-01',vehicleId:veh.id,liter:2,harga:10000,cost:20000,km:null,spbu:'SPBU Tes',fullTank:true}];
let threw=false;
try{ renderVehicleSelect(); renderCnTab(); }catch(e){ threw=true; }
_selfTestAssert(!threw,'Render Car Notes/daftar BBM tidak boleh throw error saat ada log BBM dengan km:null (mis. dari data import lama)');
} finally { D.bbmLogs=backupBbm; curVehicleId=backupVeh; renderVehicleSelect(); renderCnTab(); }
}},
{name:'runDataHealthCheck(): mendeteksi piutang tanpa nama, nilai tidak valid, & jatuh tempo tidak valid (sementara, dicadangkan & dikembalikan)', fn:()=>{
if(typeof runDataHealthCheck!=='function')return;
const backup=D.piutang;
try{
D.piutang=[
{id:'__p_noname__',name:'',nilai:100000,tanggal:'2026-01-01',jatuhTempo:'',lunas:false},
{id:'__p_badval__',name:'Tes Piutang',nilai:NaN,tanggal:'2026-01-01',jatuhTempo:'',lunas:false},
{id:'__p_badjt__',name:'Tes Piutang 2',nilai:50000,tanggal:'2026-01-01',jatuhTempo:'tanggal-ngawur',lunas:false}
];
runDataHealthCheck();
const listHtml=document.getElementById('dataHealthList')?document.getElementById('dataHealthList').innerHTML:'';
_selfTestAssert(listHtml.includes('Piutang tanpa nama peminjam'),'Harus mendeteksi piutang tanpa nama peminjam');
_selfTestAssert(listHtml.includes('Piutang dengan nilai tidak valid'),'Harus mendeteksi piutang dengan nilai NaN/rusak');
_selfTestAssert(listHtml.includes('Piutang dengan tanggal jatuh tempo tidak valid'),'Harus mendeteksi piutang dengan jatuh tempo tidak terbaca sebagai tanggal');
} finally {
D.piutang=backup;
closeModal('dataHealthModal');
}
}},
{name:'CHAT_ACTION_EDIT_FIELDS: setiap tipe aksi chat AI punya konfigurasi form Edit yang lengkap', fn:()=>{
Object.keys(CHAT_ACTION_HANDLERS).forEach(type=>{
const fields=CHAT_ACTION_EDIT_FIELDS[type];
_selfTestAssert(Array.isArray(fields)&&fields.length>0,'CHAT_ACTION_EDIT_FIELDS harus punya daftar field untuk tipe aksi "'+type+'"');
fields.forEach(f=>{
_selfTestAssert(f.key&&f.label&&f.type,'Setiap field edit ("'+type+'") harus punya key, label, dan type');
});
});
}},
{name:'actualWealthCAGR(): kondisi belum cukup data (kurang dari 2 snapshot / rentang <25 hari) → null (sementara, D.wealthSnapshots dicadangkan & dikembalikan)', fn:()=>{
const backup=D.wealthSnapshots;
try{
D.wealthSnapshots=[];
_selfTestAssert(actualWealthCAGR()===null,'0 snapshot harus null');
D.wealthSnapshots=[{id:'__t1__',date:'2026-01-01',netWorth:1000000,auto:false}];
_selfTestAssert(actualWealthCAGR()===null,'1 snapshot harus null');
D.wealthSnapshots=[
{id:'__t1__',date:'2026-01-01',netWorth:1000000,auto:false},
{id:'__t2__',date:'2026-01-05',netWorth:1100000,auto:false}
];
_selfTestAssert(actualWealthCAGR()===null,'Rentang <25 hari antar snapshot harus null (belum absurd dihitung tahunan)');
} finally { D.wealthSnapshots=backup; }
}},
{name:'actualWealthCAGR(): basis awal negatif/nol → cagr:null reason "baseline-negative" (bukan NaN)', fn:()=>{
const backup=D.wealthSnapshots;
try{
D.wealthSnapshots=[
{id:'__t1__',date:'2026-01-01',netWorth:-500000,auto:false},
{id:'__t2__',date:'2026-03-01',netWorth:1000000,auto:false}
];
const r=actualWealthCAGR();
_selfTestAssert(r!==null&&r.cagr===null&&r.reason==='baseline-negative','Basis awal negatif harus mengembalikan {cagr:null, reason:"baseline-negative"}, bukan null/NaN');
} finally { D.wealthSnapshots=backup; }
}},
{name:'actualWealthCAGR(): kekayaan bersih TERAKHIR negatif → cagr:null reason "latest-negative" (BUGFIX, dulu NaN)', fn:()=>{
const backup=D.wealthSnapshots;
try{
D.wealthSnapshots=[
{id:'__t1__',date:'2026-01-01',netWorth:1000000,auto:false},
{id:'__t2__',date:'2026-04-01',netWorth:-250000,auto:false}
];
const r=actualWealthCAGR();
_selfTestAssert(r!==null,'Snapshot cukup (2, rentang ≥25 hari) harus tetap mengembalikan object, bukan null');
_selfTestAssert(r.cagr===null,'cagr harus null saat kekayaan bersih terakhir negatif (bukan NaN — ini bugfix utamanya)');
_selfTestAssert(!Number.isNaN(r.cagr),'cagr TIDAK BOLEH berupa NaN dalam kondisi apa pun');
_selfTestAssert(r.reason==='latest-negative','reason harus "latest-negative" saat basis awal positif tapi snapshot terakhir negatif');
} finally { D.wealthSnapshots=backup; }
}},
{name:'actualWealthCAGR(): kondisi normal (awal & akhir positif, rentang cukup) → cagr angka valid, reason null', fn:()=>{
const backup=D.wealthSnapshots;
try{
D.wealthSnapshots=[
{id:'__t1__',date:'2025-01-01',netWorth:1000000,auto:false},
{id:'__t2__',date:'2026-01-01',netWorth:1200000,auto:false}
];
const r=actualWealthCAGR();
_selfTestAssert(r!==null&&r.reason===null,'Kondisi normal harus mengembalikan reason:null');
_selfTestAssert(typeof r.cagr==='number'&&!Number.isNaN(r.cagr),'cagr harus berupa angka valid pada kondisi normal');
_selfTestAssert(r.cagr>0,'Kekayaan naik dari 1jt ke 1.2jt dlm ~1th harus menghasilkan cagr positif (≈20%)');
} finally { D.wealthSnapshots=backup; }
}},
{name:'renderBillHistory(): catatan transaksi (note) di-escape, tidak boleh membocorkan tag HTML mentah (XSS HARDENING)', fn:()=>{
if(typeof renderBillHistory!=='function'||typeof openBillHistory!=='function')return;
const backupTx=D.transactions,backupBillId=curBillHistoryId;
const payload='<img src=x onerror="1">';
try{
const billId='__xss_bill__';
D.transactions=[{id:'__xss_tx__',billLinkId:billId,date:'2026-01-01',amount:1000,note:payload,category:'Tes'}];
const modal=document.getElementById('billHistoryModal');
const hadOpen=modal&&modal.classList.contains('open');
if(modal)modal.classList.add('open');
curBillHistoryId=billId;
renderBillHistory();
const html=document.getElementById('billHistoryList')?document.getElementById('billHistoryList').innerHTML:'';
_selfTestAssert(!html.includes('<img'),'Catatan pembayaran tagihan harus di-escape (tidak boleh ada tag <img> mentah dari note)');
if(modal&&!hadOpen)modal.classList.remove('open');
} finally { D.transactions=backupTx; curBillHistoryId=backupBillId; }
}},
{name:'renderBbmList()/renderStockList()/renderServisList(): field bebas-teks (note/spbu/nama/kode/item) di-escape (XSS HARDENING)', fn:()=>{
if(typeof renderBbmList!=='function'||typeof renderStockList!=='function'||typeof renderServisList!=='function')return;
const veh=D.vehicles[0];
if(!veh)return;
const payload='<img src=x onerror="1">';
const backupBbm=D.bbmLogs,backupParts=D.partsStock,backupServis=D.servisLogs,backupCurVeh=curVehicleId;
try{
curVehicleId=veh.id;
D.bbmLogs=[{id:'__xss_bbm__',date:'2026-01-01',vehicleId:veh.id,km:100,liter:5,harga:10000,cost:50000,fullTank:true,spbu:payload,note:payload}];
renderBbmList();
const bbmHtml=document.getElementById('bbmList')?document.getElementById('bbmList').innerHTML:'';
_selfTestAssert(!bbmHtml.includes('<img'),'SPBU/catatan di daftar BBM harus di-escape');
D.partsStock=[{id:'__xss_part__',name:payload,code:payload,note:payload,qty:5,unit:'pcs',minStock:1,price:0}];
renderStockList();
const stockHtml=document.getElementById('stockList')?document.getElementById('stockList').innerHTML:'';
_selfTestAssert(!stockHtml.includes('<img'),'Nama/kode/catatan sparepart di daftar stok harus di-escape');
D.servisLogs=[{id:'__xss_servis__',date:'2026-01-01',vehicleId:veh.id,item:payload,note:payload,cost:1000}];
renderServisList();
const servisHtml=document.getElementById('servisList')?document.getElementById('servisList').innerHTML:'';
_selfTestAssert(!servisHtml.includes('<img'),'Item/catatan servis di daftar servis kendaraan harus di-escape');
} finally {
D.bbmLogs=backupBbm; D.partsStock=backupParts; D.servisLogs=backupServis; curVehicleId=backupCurVeh;
renderBbmList(); renderStockList(); renderServisList();
}
}},
{name:'Etalase.renderList(): nama produk/kategori/produsen di-escape (XSS HARDENING)', fn:()=>{
if(typeof Etalase==='undefined'||typeof Etalase.renderList!=='function')return;
const payload='<img src=x onerror="1">';
const backupProducts=D.products,backupProdusen=D.produsen,backupKategori=D.cobekKategori;
try{
D.produsen=[{id:'__xss_prod__',name:payload,contact:'',note:''}];
D.cobekKategori=[{id:'__xss_kat__',name:payload}];
D.products=[{id:'__xss_p__',name:payload,stock:5,kategoriId:'__xss_kat__',produsenId:'__xss_prod__',hargaBeli:1000,hargaJual:2000,hargaReseller:0,diskonPersen:0}];
Etalase.renderList();
const html=document.getElementById('productList')?document.getElementById('productList').innerHTML:'';
_selfTestAssert(!html.includes('<img'),'Nama produk/kategori/produsen di daftar Etalase harus di-escape');
} finally {
D.products=backupProducts; D.produsen=backupProdusen; D.cobekKategori=backupKategori;
Etalase.renderList();
}
}},
{name:'renderReminder(): judul & deskripsi pengingat di-escape (XSS HARDENING)', fn:()=>{
if(typeof renderReminder!=='function')return;
const payload='<img src=x onerror="1">';
const backupReminders=D.reminders;
try{
D.reminders=[{id:'__xss_reminder__',title:payload,desc:payload,color:'#7c6fef'}];
renderReminder();
const html=document.getElementById('reminderList')?document.getElementById('reminderList').innerHTML:'';
_selfTestAssert(!html.includes('<img'),'Judul/deskripsi pengingat harus di-escape');
} finally {
D.reminders=backupReminders;
renderReminder();
}
}},
{name:'Enkripsi API key (Web Crypto, kunci dari PIN): round-trip benar, PIN salah gagal dekripsi, save() tidak pernah simpan polos ke kw_v4 (HARDENING KEAMANAN)', fn:async()=>{
if(typeof encryptApiKeyWithPin!=='function'||typeof decryptApiKeyWithPin!=='function')return;
const backupProfile=JSON.parse(JSON.stringify(D.profile||{}));
const backupPin=localStorage.getItem('kw_pin');
const backupEnc=localStorage.getItem('kw_apikey_enc');
const backupKw4=localStorage.getItem('kw_v4');
const testPin='7391';
const testKey='sk-test-selftest-'+Date.now();
try{
const enc=await encryptApiKeyWithPin(testPin,testKey);
_selfTestAssert(enc&&enc.salt&&enc.iv&&enc.ct,'Hasil enkripsi harus punya salt, iv, & ciphertext');
const decrypted=await decryptApiKeyWithPin(testPin,enc);
_selfTestAssert(decrypted===testKey,'Dekripsi dgn PIN yang benar harus mengembalikan API key asli, dapat "'+decrypted+'"');
const wrongResult=await decryptApiKeyWithPin('0000',enc);
_selfTestAssert(wrongResult===null,'Dekripsi dengan PIN salah harus menghasilkan null (fail-safe), dapat "'+wrongResult+'"');
localStorage.setItem('kw_pin',testPin);
D.profile=D.profile||{};
D.profile.apiKey=testKey;
saveFlush();
const rawKw4=localStorage.getItem('kw_v4');
_selfTestAssert(!rawKw4.includes(testKey),'kw_v4 TIDAK BOLEH mengandung API key dalam bentuk teks polos setelah save()');
const parsedKw4=JSON.parse(rawKw4);
_selfTestAssert(!parsedKw4.profile||!('apiKey' in parsedKw4.profile),'Field "apiKey" TIDAK BOLEH ada sama sekali di objek profile dalam kw_v4');
} finally {
D.profile=backupProfile;
if(backupPin===null)localStorage.removeItem('kw_pin'); else localStorage.setItem('kw_pin',backupPin);
if(backupEnc===null)localStorage.removeItem('kw_apikey_enc'); else localStorage.setItem('kw_apikey_enc',backupEnc);
if(backupKw4===null)localStorage.removeItem('kw_v4'); else localStorage.setItem('kw_v4',backupKw4);
}
}},
{name:'save() di-debounce (PERFORMA): beberapa panggilan berturutan cuma menulis ke disk SATU KALI', fn:async()=>{
if(_saveDebounceTimer){clearTimeout(_saveDebounceTimer);_saveDebounceTimer=null;}
const original=_saveImmediate;
let callCount=0;
_saveImmediate=function(){callCount++;};
try{
save();save();save();save();save();
const pollStart=Date.now();
while(callCount===0 && (Date.now()-pollStart)<3000){ await new Promise(r=>setTimeout(r,25)); }
} finally {
_saveImmediate=original;
}
_selfTestAssert(callCount===1,'_saveImmediate() seharusnya cuma terpanggil 1x dari 5x panggilan save() berturutan (digabung debounce), malah terpanggil '+callCount+'x');
}},
{name:'saveFlush() (PERFORMA): menulis ke disk SEKARANG & membatalkan jeda debounce yang masih tertunda', fn:async()=>{
if(_saveDebounceTimer){clearTimeout(_saveDebounceTimer);_saveDebounceTimer=null;}
const original=_saveImmediate;
let callCount=0;
_saveImmediate=function(){callCount++;};
try{
save();
_selfTestAssert(callCount===0,'Sesaat setelah save(), _saveImmediate() belum boleh terpanggil (masih menunggu jeda debounce)');
saveFlush();
_selfTestAssert(callCount===1,'saveFlush() harus langsung memicu _saveImmediate() sekali, tanpa menunggu jeda debounce');
_selfTestAssert(_saveDebounceTimer===null,'saveFlush() harus membatalkan timer debounce yang masih tertunda (_saveDebounceTimer harus null sesudahnya)');
await new Promise(r=>setTimeout(r,500));
_selfTestAssert(callCount===1,'Tidak boleh ada _saveImmediate() tambahan setelah saveFlush() (timer debounce lama harusnya sudah dibatalkan)');
} finally {
_saveImmediate=original;
if(_saveDebounceTimer){clearTimeout(_saveDebounceTimer);_saveDebounceTimer=null;}
}
}},
{name:'gdriveTrySilentReconnectOnLoad(): TIDAK mencoba apa pun kalau belum diizinkan / sudah tersambung', fn:()=>{
const backupGDrive=D.googleDrive?JSON.parse(JSON.stringify(D.googleDrive)):null;
const backupToken=gdriveAccessToken;
const originalInitTC=gdriveInitTokenClient;
let callCount=0;
gdriveInitTokenClient=function(){callCount++;return null;};
try{
D.googleDrive={clientId:'123-abc.apps.googleusercontent.com',fileId:null,lastSync:null,autoSync:false};
gdriveAccessToken=null;
gdriveTrySilentReconnectOnLoad();
_selfTestAssert(callCount===0,'Tidak boleh mencoba reconnect kalau Sinkron Otomatis belum diaktifkan user');
D.googleDrive={clientId:'',fileId:null,lastSync:null,autoSync:true};
gdriveTrySilentReconnectOnLoad();
_selfTestAssert(callCount===0,'Tidak boleh mencoba reconnect kalau Client ID belum diisi');
D.googleDrive={clientId:'123-abc.apps.googleusercontent.com',fileId:null,lastSync:null,autoSync:true};
gdriveAccessToken='token-palsu-utk-tes';
gdriveTrySilentReconnectOnLoad();
_selfTestAssert(callCount===0,'Tidak perlu reconnect kalau gdriveAccessToken sudah ada (berarti masih tersambung sesi ini)');
} finally {
D.googleDrive=backupGDrive;
gdriveAccessToken=backupToken;
gdriveInitTokenClient=originalInitTC;
}
}},
{name:'WorthIt.computeScore(): kebutuhan+mendesak diberi skor lebih tinggi daripada keinginan+nice-to-have', fn:()=>{
if(typeof WorthIt==='undefined'||typeof WorthIt.computeScore!=='function')return;
const backupAccounts=JSON.parse(JSON.stringify(D.accounts));
try{
D.accounts=[{id:'__selftest_acc__',name:'Tes',emoji:'💰',baseBalance:1000000000,includeInBalance:true}];
const tinggi=WorthIt.computeScore({name:'A',price:10000,cat:'kebutuhan',urgensi:'mendesak',isDiskon:false,hargaNormal:0,sudahPunya:false});
const rendah=WorthIt.computeScore({name:'B',price:10000,cat:'keinginan',urgensi:'nice_to_have',isDiskon:false,hargaNormal:0,sudahPunya:false});
_selfTestAssert(tinggi.score>rendah.score,'Item kebutuhan+mendesak ('+tinggi.score+') harus lebih tinggi dari keinginan+nice-to-have ('+rendah.score+')');
_selfTestAssert(tinggi.score>=70,'Item kebutuhan+mendesak seharusnya masuk badge Prioritas Tinggi (skor>=70), dapat '+tinggi.score);
_selfTestAssert(rendah.score<40,'Item keinginan+nice-to-have seharusnya masuk badge Bisa Ditunda (skor<40), dapat '+rendah.score);
} finally { D.accounts=backupAccounts; }
}},
{name:'WorthIt.computeScore(): "sudah punya barang lama" menurunkan skor & diskon tipis ditandai merah', fn:()=>{
if(typeof WorthIt==='undefined'||typeof WorthIt.computeScore!=='function')return;
const backupAccounts=JSON.parse(JSON.stringify(D.accounts));
try{
D.accounts=[{id:'__selftest_acc__',name:'Tes',emoji:'💰',baseBalance:1000000000,includeInBalance:true}];
const base={name:'A',price:10000,cat:'keinginan',urgensi:'bisa_nunggu',isDiskon:false,hargaNormal:0};
const tanpaSudahPunya=WorthIt.computeScore({...base,sudahPunya:false});
const denganSudahPunya=WorthIt.computeScore({...base,sudahPunya:true,sudahPunyaAlasan:''});
_selfTestAssert(denganSudahPunya.score<tanpaSudahPunya.score,'Menandai "sudah punya barang lama" harus menurunkan skor dibanding tidak ditandai');
const diskonTipis=WorthIt.computeScore({name:'C',price:95000,cat:'keinginan',urgensi:'bisa_nunggu',isDiskon:true,hargaNormal:100000,sudahPunya:false});
const diskonGede=WorthIt.computeScore({name:'D',price:50000,cat:'keinginan',urgensi:'bisa_nunggu',isDiskon:true,hargaNormal:100000,sudahPunya:false});
_selfTestAssert(diskonGede.score>diskonTipis.score,'Diskon 50% harus mendorong skor lebih tinggi daripada diskon 5%');
const alasanText='<img src=x onerror=1> alasan custom';
const withReason=WorthIt.computeScore({...base,sudahPunya:true,sudahPunyaAlasan:alasanText});
const reasonHtml=withReason.reasons.map(r=>r.text).join(' ');
_selfTestAssert(!reasonHtml.includes('<img'),'Alasan custom "sudah punya barang" harus di-escape (XSS HARDENING)');
} finally { D.accounts=backupAccounts; }
}},
{name:'WorthIt.addToList()/editListItem()/deleteListItem(): CRUD D.wishlist tidak merusak data lain (sementara, dicadangkan & dikembalikan)', fn:()=>{
if(typeof WorthIt==='undefined'||typeof WorthIt.addToList!=='function')return;
const requiredIds=['wlName','wlPrice','wlIsDiskon','wlHargaNormal','wlCategory','wlUrgensi','wlSudahPunya','wlSudahPunyaAlasan','wlSubmitBtn','wlCancelEditBtn'];
if(requiredIds.some(id=>!document.getElementById(id)))return;
const backupWishlist=JSON.parse(JSON.stringify(D.wishlist||[]));
const backupEditId=WorthIt.editListId;
try{
WorthIt.cancelEditList();
const countBefore=D.wishlist.length;
document.getElementById('wlName').value='__selftest_item__';
document.getElementById('wlPrice').value='50000';
document.getElementById('wlIsDiskon').checked=false;
WorthIt.toggleDiskonList();
document.getElementById('wlCategory').value='kebutuhan';
document.getElementById('wlUrgensi').value='mendesak';
document.getElementById('wlSudahPunya').checked=false;
WorthIt.toggleSudahPunya();
WorthIt.addToList();
_selfTestAssert(D.wishlist.length===countBefore+1,'addToList() harus menambah tepat 1 item baru ke D.wishlist');
const added=D.wishlist.find(x=>x.name==='__selftest_item__');
_selfTestAssert(!!added,'Item baru harus ditemukan di D.wishlist berdasarkan nama');
_selfTestAssert(added.price===50000&&added.cat==='kebutuhan'&&added.urgensi==='mendesak','Field item baru (harga/kategori/urgensi) harus tersimpan sesuai input form');
WorthIt.editListItem(added.id);
_selfTestAssert(WorthIt.editListId===added.id,'editListItem() harus set WorthIt.editListId ke ID item yang diedit');
_selfTestAssert(document.getElementById('wlName').value==='__selftest_item__','Form harus terisi ulang dgn nama item saat mode edit');
document.getElementById('wlPrice').value='75000';
document.getElementById('wlSudahPunya').checked=true;
WorthIt.toggleSudahPunya();
document.getElementById('wlSudahPunyaAlasan').value='masih oke tapi mau upgrade';
WorthIt.addToList();
_selfTestAssert(D.wishlist.length===countBefore+1,'Simpan perubahan saat mode edit TIDAK boleh menambah item baru (harus update in-place)');
const updated=D.wishlist.find(x=>x.id===added.id);
_selfTestAssert(updated.price===75000,'Harga item harus terupdate setelah edit');
_selfTestAssert(updated.sudahPunya===true&&updated.sudahPunyaAlasan==='masih oke tapi mau upgrade','Status & alasan "sudah punya barang lama" harus tersimpan setelah edit');
_selfTestAssert(WorthIt.editListId===null,'WorthIt.editListId harus direset ke null setelah selesai simpan/edit');
WorthIt.deleteListItem(added.id);
_selfTestAssert(D.wishlist.length===countBefore,'deleteListItem() harus mengembalikan panjang D.wishlist ke semula');
_selfTestAssert(!D.wishlist.some(x=>x.id===added.id),'Item yang dihapus tidak boleh tersisa di D.wishlist');
} finally {
D.wishlist=backupWishlist;
WorthIt.editListId=backupEditId;
save();
}
}},
{name:'WorthIt.catatBeliList()+applyBuyLink(): item BELUM bought sebelum tx disimpan, & baru bought+ke-link setelah tx tersimpan', fn:()=>{
if(typeof WorthIt==='undefined'||typeof WorthIt.catatBeliList!=='function')return;
if(!document.getElementById('txAmt')||!document.getElementById('txNote')||!document.getElementById('txModal')||!document.getElementById('worthItModal'))return;
const backupWishlist=JSON.parse(JSON.stringify(D.wishlist||[]));
const backupTx=JSON.parse(JSON.stringify(D.transactions));
const backupPending=WorthIt.pendingBuyId;
const backupTxEditId=txEditId;
const txWasOpen=document.getElementById('txModal').classList.contains('open');
const wiWasOpen=document.getElementById('worthItModal').classList.contains('open');
try{
D.wishlist.push({id:'__selftest_wl_1__',name:'__selftest_barang_beli__',price:25000,isDiskon:false,hargaNormal:0,cat:'kebutuhan',urgensi:'mendesak',sudahPunya:false,sudahPunyaAlasan:'',createdAt:new Date().toISOString(),bought:false});
WorthIt.catatBeliList('__selftest_wl_1__');
const itAfterOpen=D.wishlist.find(x=>x.id==='__selftest_wl_1__');
_selfTestAssert(itAfterOpen.bought===false,'BUGFIX: item TIDAK BOLEH langsung bought:true cuma karena txModal dibuka (baru dianggap bought setelah tx beneran Simpan)');
_selfTestAssert(WorthIt.pendingBuyId==='__selftest_wl_1__','catatBeliList() harus menyimpan ID barang ke WorthIt.pendingBuyId, menunggu tx disimpan');
_selfTestAssert(document.getElementById('txAmt').value==='25000','Nominal txModal harus otomatis terisi sesuai harga barang wishlist');
closeModal('txModal');
_selfTestAssert(WorthIt.pendingBuyId===null,'BUGFIX: menutup txModal tanpa Simpan harus membatalkan pendingBuyId');
_selfTestAssert(D.wishlist.find(x=>x.id==='__selftest_wl_1__').bought===false,'Item wishlist harus TETAP belum-bought kalau txModal dibatalkan/ditutup');
WorthIt.catatBeliList('__selftest_wl_1__');
const fakeTxId='__selftest_tx_1__';
D.transactions.push({id:fakeTxId,type:'expense',amount:25000,category:'Lainnya',subcategory:'',accountId:D.accounts[0]?.id||'',payMethod:'tunai',note:'__selftest_barang_beli__',date:new Date().toISOString().split('T')[0]});
WorthIt.applyBuyLink(fakeTxId);
const itAfterBuy=D.wishlist.find(x=>x.id==='__selftest_wl_1__');
_selfTestAssert(itAfterBuy.bought===true,'Setelah transaksi beneran tersimpan & applyBuyLink() dipanggil, item baru boleh jadi bought:true');
_selfTestAssert(itAfterBuy.txId===fakeTxId,'Item harus tersambung ke ID transaksi asli (txId) setelah applyBuyLink()');
const linkedTx=D.transactions.find(x=>x.id===fakeTxId);
_selfTestAssert(linkedTx.wishlistLinkId==='__selftest_wl_1__','Transaksi harus tersambung balik ke item wishlist (wishlistLinkId) — link 2 arah');
_selfTestAssert(WorthIt.pendingBuyId===null,'pendingBuyId harus direset ke null setelah applyBuyLink() dipakai');
} finally {
D.wishlist=backupWishlist;
D.transactions=backupTx;
WorthIt.pendingBuyId=backupPending;
txEditId=backupTxEditId;
closeModal('txModal'); // BUGFIX: catatBeliList() dipanggil 2x di tes ini & membuka txModal lagi setelah closeModal() pertama -- tanpa baris ini modal tertinggal 'open' & muncul ke user begitu tes selesai
if(txWasOpen) document.getElementById('txModal').classList.add('open');
if(wiWasOpen) document.getElementById('worthItModal').classList.add('open');
save();
}
}},
{name:'WorthIt.onLinkedTxDeleted()/onLinkedTxEdited(): sync 2 arah saat transaksi terkait wishlist dihapus/diedit di Keuangan', fn:()=>{
if(typeof WorthIt==='undefined'||typeof WorthIt.onLinkedTxDeleted!=='function')return;
const backupWishlist=JSON.parse(JSON.stringify(D.wishlist||[]));
const backupTx=JSON.parse(JSON.stringify(D.transactions));
try{
const txId='__selftest_tx_2__';
D.wishlist.push({id:'__selftest_wl_2__',name:'__selftest_barang_2__',price:40000,isDiskon:false,hargaNormal:0,cat:'keinginan',urgensi:'bisa_nunggu',sudahPunya:false,sudahPunyaAlasan:'',createdAt:new Date().toISOString(),bought:true,boughtDate:'2025-01-01',txId});
D.transactions.push({id:txId,type:'expense',amount:40000,category:'Lainnya',subcategory:'',accountId:D.accounts[0]?.id||'',payMethod:'tunai',note:'__selftest_barang_2__',date:'2025-01-01',wishlistLinkId:'__selftest_wl_2__'});
const t=D.transactions.find(x=>x.id===txId);
t.amount=45000;t.date='2025-01-02';
WorthIt.onLinkedTxEdited(t);
const editedIt=D.wishlist.find(x=>x.id==='__selftest_wl_2__');
_selfTestAssert(editedIt.price===45000,'onLinkedTxEdited() harus menyinkronkan harga item ke nominal transaksi yang diedit');
_selfTestAssert(editedIt.boughtDate==='2025-01-02','onLinkedTxEdited() harus menyinkronkan tanggal beli ke tanggal transaksi yang diedit');
WorthIt.onLinkedTxDeleted(t);
const revertedIt=D.wishlist.find(x=>x.id==='__selftest_wl_2__');
_selfTestAssert(!!revertedIt,'Item wishlist TIDAK BOLEH ikut terhapus saat transaksi terkait dihapus');
_selfTestAssert(revertedIt.bought===false,'BUGFIX (sync 2 arah): item harus kembali bought:false saat transaksi terkait dihapus dari Keuangan');
_selfTestAssert(revertedIt.txId===null,'txId item harus direset ke null setelah transaksi terkait dihapus');
} finally {
D.wishlist=backupWishlist;
D.transactions=backupTx;
save();
}
}},
{name:'WorthIt.undoBought(): mengembalikan barang "sudah dibeli" ke list aktif tanpa menghapus transaksi terkait', fn:async()=>{
if(typeof WorthIt==='undefined'||typeof WorthIt.undoBought!=='function')return;
const backupWishlist=JSON.parse(JSON.stringify(D.wishlist||[]));
const backupTx=JSON.parse(JSON.stringify(D.transactions));
const backupAskConfirm=window.askConfirm;
try{
const txId='__selftest_tx_3__';
D.wishlist.push({id:'__selftest_wl_3__',name:'__selftest_barang_3__',price:15000,isDiskon:false,hargaNormal:0,cat:'kebutuhan',urgensi:'mendesak',sudahPunya:false,sudahPunyaAlasan:'',createdAt:new Date().toISOString(),bought:true,boughtDate:'2025-01-01',txId});
D.transactions.push({id:txId,type:'expense',amount:15000,category:'Lainnya',subcategory:'',accountId:D.accounts[0]?.id||'',payMethod:'tunai',note:'__selftest_barang_3__',date:'2025-01-01',wishlistLinkId:'__selftest_wl_3__'});
window.askConfirm=async()=>true;
await WorthIt.undoBought('__selftest_wl_3__');
const it=D.wishlist.find(x=>x.id==='__selftest_wl_3__');
_selfTestAssert(it.bought===false,'undoBought() harus mengembalikan item ke status belum-dibeli');
_selfTestAssert(it.txId===null,'undoBought() harus melepas link txId dari item');
const t=D.transactions.find(x=>x.id===txId);
_selfTestAssert(!!t,'undoBought() TIDAK BOLEH menghapus transaksi yang sudah tercatat di Keuangan (uangnya memang sudah keluar)');
_selfTestAssert(!t.wishlistLinkId,'undoBought() harus melepas wishlistLinkId dari transaksi supaya tidak lagi tersambung ke item yang sudah di-undo');
} finally {
D.wishlist=backupWishlist;
D.transactions=backupTx;
window.askConfirm=backupAskConfirm;
save();
}
}},
{name:'add_wishlist (Chat AI): validasi input & barang tersimpan ke D.wishlist sebagai rencana (bukan transaksi nyata)', fn:()=>{
if(typeof CHAT_ACTION_HANDLERS==='undefined'||typeof CHAT_ACTION_HANDLERS.add_wishlist!=='function')return;
const backupWishlist=JSON.parse(JSON.stringify(D.wishlist||[]));
const backupTxCount=D.transactions.length;
try{
let threw=false;
try{ CHAT_ACTION_HANDLERS.add_wishlist({name:'',price:10000}); }catch(e){ threw=true; }
_selfTestAssert(threw,'add_wishlist harus menolak nama barang kosong');
threw=false;
try{ CHAT_ACTION_HANDLERS.add_wishlist({name:'Tes',price:0}); }catch(e){ threw=true; }
_selfTestAssert(threw,'add_wishlist harus menolak harga yang tidak valid (0/kosong/negatif)');
CHAT_ACTION_HANDLERS.add_wishlist({name:'__selftest_chat_wl__',price:30000,cat:'kebutuhan',urgensi:'mendesak'});
const added=D.wishlist.find(x=>x.name==='__selftest_chat_wl__');
_selfTestAssert(!!added,'add_wishlist harus menambah item baru ke D.wishlist');
_selfTestAssert(added.bought===false,'Barang dari add_wishlist harus berstatus belum-dibeli (cuma rencana, bukan transaksi nyata)');
_selfTestAssert(D.transactions.length===backupTxCount,'add_wishlist TIDAK BOLEH ikut membuat transaksi nyata di D.transactions');
} finally {
D.wishlist=backupWishlist;
save();
}
}},
{name:'Torsi.scalePositionHtml()/scaleSvgHtml()/thimbleSvgHtml(): tidak crash & hasil valid untuk nilai batas kunci (min/max/tepat kelipatan/tengah garis)', fn:()=>{
const testVals=[
MY_WRENCH.minNm,
MY_WRENCH.maxNm,
MY_WRENCH_SCALE[2].nm,
45,
MY_WRENCH_SCALE[0].nm+MY_WRENCH_SCALE[0].nm/10*9.6
];
testVals.forEach(nm=>{
let html;
try{ html=Torsi.scalePositionHtml(nm); }
catch(e){ _selfTestAssert(false,'Torsi.scalePositionHtml('+nm+') melempar error: '+e.message); return; }
_selfTestAssert(typeof html==='string'&&html.includes('<svg'),'Torsi.scalePositionHtml('+nm+') harus mengembalikan HTML berisi ilustrasi SVG, dapat: '+String(html).slice(0,60));
});
let threwOutOfRange=false;
try{ Torsi.scalePositionHtml(MY_WRENCH.minNm-5); Torsi.scalePositionHtml(MY_WRENCH.maxNm+20); }
catch(e){ threwOutOfRange=true; }
_selfTestAssert(!threwOutOfRange,'Torsi.scalePositionHtml() tidak boleh crash walau dipanggil dengan nilai di luar jangkauan kunci');
let threwRenderNote=false;
try{
Torsi.renderWrenchNote(null);
Torsi.renderWrenchNote(NaN);
Torsi.renderWrenchNote(50);
}catch(e){ threwRenderNote=true; }
_selfTestAssert(!threwRenderNote,'Torsi.renderWrenchNote() tidak boleh crash untuk input null/NaN/nilai normal (elemen trsWrenchNote mungkin belum ada di DOM saat modal tertutup, harus fail-safe)');
}},
{name:'findVehicleSpec()/renderVehicleSpecCard(): tidak crash untuk model dikenal, model tidak dikenal, atau kendaraan kosong', fn:()=>{
const known=findVehicleSpec('Vario 125 KZR (test)');
_selfTestAssert(!!known,'findVehicleSpec() harus mengenali nama yang mengandung "vario 125" (case-insensitive)');
_selfTestAssert(known.ban&&known.ban.depan&&known.ban.belakang,'Data spek ban depan & belakang harus ada untuk Vario 125');
const unknown=findVehicleSpec('Motor Antah Berantah 999');
_selfTestAssert(unknown===null,'findVehicleSpec() harus mengembalikan null utk model yang tidak dikenal, BUKAN melempar error atau data ngawur');
_selfTestAssert(findVehicleSpec('')===null&&findVehicleSpec(undefined)===null,'findVehicleSpec() harus fail-safe (null) untuk input kosong/undefined');
let threw=false;
try{ renderVehicleSpecCard(); }catch(e){ threw=true; }
_selfTestAssert(!threw,'renderVehicleSpecCard() tidak boleh crash walau elemen #vehSpecCard belum ada di DOM (halaman Car Notes belum dibuka)');
}},
{name:'Regresi UI: semua id yang dipanggil getElementById() ada di HTML (deteksi typo id)', fn:()=>{
const snapshot=getHtmlSnapshotForSelfTest();
_selfTestAssert(snapshot.length>1000,'Snapshot HTML untuk tes regresi UI kosong/gagal terekam');
const scriptSrc=Array.from(document.scripts).map(s=>s.textContent||'').join('\n');
const idRe=/getElementById\(\s*['"]([\w-]+)['"]\s*\)/g;
const ids=new Set(['scrollRoot']);
let m;
while((m=idRe.exec(scriptSrc))){ ids.add(m[1]); }
const missing=[];
ids.forEach(id=>{
const attrRe=new RegExp('id=["\']'+id.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'["\']');
if(!attrRe.test(snapshot))missing.push(id);
});
_selfTestAssert(missing.length===0,'id berikut dipakai di getElementById() tapi TIDAK ditemukan di HTML (kemungkinan typo id): '+missing.join(', '));
}},
{name:'renderDashboard() ikut memanggil mini-card Anggaran di Beranda (dashBudgetMiniCard)', fn:()=>{
const card=document.getElementById('dashBudgetMiniCard');
if(!card)return;
const backupBudgets=D.budgets;
try{
D.budgets=[{id:'__selftest_dashbudget__',name:'Tes Diagnostik',icon:'💰',catIds:['__total__'],limit:100000,rollover:false,period:'bulanan'}];
renderDashboard();
_selfTestAssert(card.style.display!=='none','#dashBudgetMiniCard harus tampil (bukan display:none) setelah renderDashboard() saat D.budgets tidak kosong — cek renderDashboard() memanggil renderDashBudgetMini()/Budget.renderDashMini()');
} finally {
D.budgets=backupBudgets;
renderDashboard();
}
}},
{name:'DebtStrategy.computeOrder() urutkan Avalanche (bunga tertinggi) & Snowball (saldo terkecil) dengan benar', fn:()=>{
const dummy=[{id:'a',name:'A',nilai:5000000,bunga:6,cicilanBulanan:500000},{id:'b',name:'B',nilai:1000000,bunga:24,cicilanBulanan:200000},{id:'c',name:'C',nilai:10000000,bunga:12,cicilanBulanan:1000000}];
const avalanche=DebtStrategy.computeOrder(dummy,'avalanche');
_selfTestAssert(avalanche.map(d=>d.id).join(',')==='b,c,a','Avalanche harus urut bunga tertinggi dulu (b,c,a), dapat '+avalanche.map(d=>d.id).join(','));
const snowball=DebtStrategy.computeOrder(dummy,'snowball');
_selfTestAssert(snowball.map(d=>d.id).join(',')==='b,a,c','Snowball harus urut saldo terkecil dulu (b,a,c), dapat '+snowball.map(d=>d.id).join(','));
_selfTestAssert(dummy.map(d=>d.id).join(',')==='a,b,c','computeOrder() tidak boleh mengubah array asli (harus pakai salinan)');
}},
{name:'DebtStrategy.simulate() menghitung lama pelunasan & efek dana ekstra dengan benar', fn:()=>{
const single=[{id:'x',nilai:1200000,bunga:0,cicilanBulanan:100000}];
const simNoExtra=DebtStrategy.simulate(single,0);
_selfTestAssert(simNoExtra.months===12,'Utang 1.2jt tanpa bunga, cicilan 100rb/bln, tanpa dana ekstra, harus lunas dlm 12 bln, dapat '+simNoExtra.months);
const simWithExtra=DebtStrategy.simulate(single,100000);
_selfTestAssert(simWithExtra.months===6,'Utang 1.2jt tanpa bunga, cicilan 100rb + ekstra 100rb/bln, harus lunas dlm 6 bln, dapat '+simWithExtra.months);
const noCicilan=[{id:'y',nilai:1000000,bunga:10,cicilanBulanan:0}];
const simNone=DebtStrategy.simulate(noCicilan,0);
_selfTestAssert(simNone.months===null,'Utang tanpa cicilanBulanan harus dilewati simulasi (months=null), dapat '+simNone.months);
}},
{name:'(kw63) FI.assetFund()/totalDebt()/netAssetFund() konsisten & tidak exception', fn:()=>{
const assetFund=FI.assetFund(), totalDebt=FI.totalDebt(), net=FI.netAssetFund();
_selfTestAssert(typeof assetFund==='number'&&!Number.isNaN(assetFund),'FI.assetFund() harus berupa angka valid, dapat '+assetFund);
_selfTestAssert(typeof totalDebt==='number'&&!Number.isNaN(totalDebt),'FI.totalDebt() harus berupa angka valid, dapat '+totalDebt);
_selfTestAssert(net===assetFund-totalDebt,'FI.netAssetFund() harus sama dengan assetFund()-totalDebt(), dapat net='+net+' vs hitung manual='+(assetFund-totalDebt));
}},
{name:'(kw63) Kekayaan.currentNetWorth() menghasilkan angka valid tanpa exception', fn:()=>{
const nw=Kekayaan.currentNetWorth();
_selfTestAssert(typeof nw==='number'&&!Number.isNaN(nw),'Kekayaan.currentNetWorth() harus berupa angka valid, dapat '+nw);
}},
{name:'(kw63) DanaDaruratAI.computeRecommendation() mengembalikan bentuk & multiplier yang valid', fn:()=>{
const r=DanaDaruratAI.computeRecommendation();
_selfTestAssert([6,9,12].indexOf(r.multiplier)>-1,'multiplier harus salah satu dari 6/9/12, dapat '+r.multiplier);
_selfTestAssert(typeof r.recommended==='number'&&r.recommended>=0,'recommended harus angka >=0, dapat '+r.recommended);
_selfTestAssert(typeof r.reason==='string'&&r.reason.length>0,'reason harus berupa teks penjelasan, tidak boleh kosong');
}},
{name:'(kw63) Pensiun.sisaBulan()/proyeksi()/danaTerkumpul() konsisten dgn data dummy (backup & restore D.pensiun)', fn:()=>{
const backup=D.pensiun;
try{
D.pensiun={usiaSekarang:30,usiaPensiun:35,kontribusiBulanan:1000000,returnTahunan:0,accId:null};
_selfTestAssert(Pensiun.sisaBulan()===60,'sisaBulan() usia 30->35 harus 60 bulan, dapat '+Pensiun.sisaBulan());
_selfTestAssert(Pensiun.danaTerkumpul()===0,'danaTerkumpul() tanpa accId harus 0, dapat '+Pensiun.danaTerkumpul());
const proyeksi=Pensiun.proyeksi();
_selfTestAssert(proyeksi===1000000*60,'proyeksi() tanpa return (0%) & pv=0 harus sama dgn total setoran (60jt), dapat '+proyeksi);
D.pensiun={usiaSekarang:35,usiaPensiun:30,kontribusiBulanan:0,returnTahunan:6,accId:null};
_selfTestAssert(Pensiun.sisaBulan()===0,'sisaBulan() saat usiaPensiun<=usiaSekarang harus 0 (dianggap tidak valid), dapat '+Pensiun.sisaBulan());
} finally {
D.pensiun=backup;
}
}},
{name:'(kw64) computeFileSizeStatus() mengembalikan status ambang batas yang valid', fn:()=>{
const fs=computeFileSizeStatus();
_selfTestAssert(typeof fs.size==='number'&&fs.size>0,'size harus angka positif, dapat '+fs.size);
_selfTestAssert(['aman','warn','action'].indexOf(fs.level)>-1,'level harus salah satu dari aman/warn/action, dapat '+fs.level);
_selfTestAssert(fs.warnAt<fs.actionAt,'ambang warnAt harus lebih kecil dari actionAt');
}},
{name:'(kw66) computeModalSweepCoverageResults() mendeteksi modal yang belum terdaftar', fn:()=>{
const cov=computeModalSweepCoverageResults();
_selfTestAssert(typeof cov.allCount==='number'&&cov.allCount>0,'allCount harus angka positif (ada modal di DOM), dapat '+cov.allCount);
_selfTestAssert(Array.isArray(cov.uncovered),'uncovered harus array');
const fake=document.createElement('div');
fake.className='overlay';
fake.id='__selftest_fake_modal_kw66__';
document.body.appendChild(fake);
try{
const cov2=computeModalSweepCoverageResults();
_selfTestAssert(cov2.uncovered.includes('__selftest_fake_modal_kw66__'),'modal palsu yang sengaja belum didaftarkan harus muncul di uncovered[]');
} finally {
fake.remove();
}
}},
{name:'(kw67) computeProductionSyncStatus() mengembalikan status yang konsisten', fn:()=>{
const ps=computeProductionSyncStatus();
_selfTestAssert(typeof ps.inSync==='boolean','inSync harus boolean');
_selfTestAssert(ps.inSync===(ps.masterVersion===ps.syncedVersion),'inSync harus persis sama dgn (masterVersion===syncedVersion)');
_selfTestAssert(typeof ps.label==='string'&&ps.label.length>0,'label harus string tidak kosong');
}},
{name:'(kw68) PriceReko.roundNice()/calc() menghasilkan rekomendasi harga jual yang konsisten', fn:()=>{
_selfTestAssert(PriceReko.roundNice(0)===0,'roundNice(0) harus 0');
_selfTestAssert(PriceReko.roundNice(-100)===0,'roundNice(negatif) harus 0 (fail-safe)');
_selfTestAssert(PriceReko.roundNice(33200)===33000,'roundNice(33200) di skala 20rb-100rb (step 1000) harus 33000, dapat '+PriceReko.roundNice(33200));
_selfTestAssert(PriceReko.roundNice(1234567)===1250000,'roundNice(1234567) di skala >=1jt (step 50000) harus 1250000, dapat '+PriceReko.roundNice(1234567));
const pBeli=document.getElementById('pBeli'),pJual=document.getElementById('pJual'),pReseller=document.getElementById('pReseller');
const t=document.getElementById('prkTransport'),m=document.getElementById('prkMargin');
if(!pBeli||!pJual||!pReseller||!t||!m)return; // form belum ter-render (mis. modal produk belum pernah dibuka), lewati aman
const backup={pBeli:pBeli.value,pJual:pJual.value,pReseller:pReseller.value,t:t.value,m:m.value};
try{
pBeli.value='20000';t.value='2000';m.value='50';
const result=PriceReko.calc();
_selfTestAssert(result===33000,'calc() modal 20rb+transport 2rb margin 50% harus 33000, dapat '+result);
pReseller.value='';
PriceReko.apply();
_selfTestAssert(pJual.value==='33000','apply() harus isi pJual=33000, dapat '+pJual.value);
_selfTestAssert(pReseller.value!==''&&Number(pReseller.value)<Number(pJual.value),'apply() harus isi pReseller lebih rendah dari pJual kalau masih kosong, dapat '+pReseller.value);
} finally {
pBeli.value=backup.pBeli;pJual.value=backup.pJual;pReseller.value=backup.pReseller;t.value=backup.t;m.value=backup.m;
}
}},
{name:'UI: panel tab benar-benar terlihat (computed display) setelah tab diklik -- cegah bug "u-dnone (!important) menang lawan inline style display:block"', fn:()=>{
const groups=[
{page:'#page-carnotes',fn:(typeof setCnTab==='function')?setCnTab:null,paneId:t=>'cnTab-'+t},
{page:'#page-cobek',fn:(typeof setCobekTab==='function')?setCobekTab:null,paneId:t=>'cobekTab-'+t},
{page:'#page-pajak',fn:(typeof setPajakTab==='function')?setPajakTab:null,paneId:t=>'pajakTab-'+t},
{page:'#page-keuangan',fn:(typeof setKeuanganTab==='function')?setKeuanganTab:null,paneId:t=>'keuanganTab-'+t},
{page:'#page-keuangan',fn:(typeof BudgetTabs!=='undefined')?BudgetTabs.switchTo:null,paneId:t=>'budgetTabPane-'+t,btnClass:'.budget-tab-btn'}
];
groups.forEach(g=>{
if(!g.fn)return;
const btns=[...document.querySelectorAll(g.page+' '+(g.btnClass||'.cn-tab'))];
if(!btns.length)return;
const originalBtn=btns.find(b=>b.classList.contains('active'))||btns[0];
let originalTab=null;
try{ originalTab=JSON.parse(originalBtn.getAttribute('data-args')||'[]')[0]; }catch(e){}
try{
btns.forEach(btn=>{
let tabName=null;
try{ tabName=JSON.parse(btn.getAttribute('data-args')||'[]')[0]; }catch(e){}
if(!tabName)return;
g.fn(tabName,btn);
const pane=document.getElementById(g.paneId(tabName));
if(pane){
const disp=getComputedStyle(pane).display;
_selfTestAssert(disp!=='none','Panel #'+pane.id+' harus terlihat (computed display bukan "none") setelah tab "'+tabName+'" di '+g.page+' diaktifkan -- kalau ini gagal, kemungkinan class u-dnone (display:none !important) tidak dilepas walau JS sudah set display:block');
}
});
} finally {
if(originalTab) g.fn(originalTab,originalBtn);
}
});
}},
{name:'UI: konten daftar panjang tidak kepotong tanpa scrollbar (cegah bug "Riwayat Servis Vario 125 tidak bisa scroll")', fn:()=>{
document.querySelectorAll('.card-collapse-body').forEach(body=>{
if(body.classList.contains('collapsed'))return;
const scrollH=body.scrollHeight, clientH=body.clientHeight;
_selfTestAssert(scrollH<=clientH+2,'Kartu #'+body.id+': konten setinggi '+scrollH+'px tapi area yg kelihatan cuma '+clientH+'px & TIDAK ADA scroll internal -- sisanya kepotong permanen tanpa cara menjangkaunya (mis. karena max-height:2000px + overflow:hidden di .card-collapse-body). Kalau daftar di dalamnya bisa tumbuh panjang, beri elemen listnya sendiri overflow-y:auto + max-height (lihat pola #servisList/#bbmList/#assetList di styles.css).');
});
const knownLongLists=['bbmList','servisList','allTx','lapTx','zakatLogList','wealthSnapshotList','assetList','piutangList','debtList','renovList'];
knownLongLists.forEach(id=>{
const el=document.getElementById(id);
if(!el)return;
const style=getComputedStyle(el);
_selfTestAssert(style.overflowY==='auto'||style.overflowY==='scroll','Daftar #'+id+' harus punya overflow-y:auto/scroll sendiri (bisa tumbuh panjang seiring waktu & hidup di dalam .card-collapse-body yg overflow:hidden) -- kalau aturan CSS-nya kehapus/berubah tanpa sadar, ini akan gagal.');
});
}},
{name:'Kartu pengingat Backup (dashBackupReminderCard): muncul kalau belum pernah sync & data sudah banyak, sembunyi kalau sudah pernah sync/di-dismiss', fn:()=>{
if(typeof renderDashboardBackupReminder!=='function'||typeof dismissBackupReminder!=='function')throw new Error('renderDashboardBackupReminder()/dismissBackupReminder() harus ada');
const card=document.getElementById('dashBackupReminderCard');
if(!card)return; // halaman dashboard belum ke-render sama sekali, skip
const backupGD=D.googleDrive, backupGS=D.googleSheets, backupTx=D.transactions;
const backupDismissFlag=localStorage.getItem('kw_backup_reminder_dismissed');
try{
localStorage.removeItem('kw_backup_reminder_dismissed');
D.googleDrive={clientId:'',fileId:null,lastSync:null,autoSync:false};
D.googleSheets={spreadsheetId:'',lastSync:null};
D.transactions=Array.from({length:35},(_,i)=>({id:'__selftest_backup_tx_'+i,type:'expense',amount:1000,category:'Tes',date:todayStr()}));
renderDashboardBackupReminder();
_selfTestAssert(card.style.display==='block','Kartu Backup harus MUNCUL kalau belum pernah sync & data sudah >= 30 catatan');
D.googleDrive.lastSync=new Date().toISOString();
renderDashboardBackupReminder();
_selfTestAssert(card.style.display==='none','Kartu Backup harus SEMBUNYI kalau sudah pernah sync sekali lewat Drive/Sheets');
D.googleDrive.lastSync=null;
renderDashboardBackupReminder();
_selfTestAssert(card.style.display==='block','Kartu Backup harus muncul lagi kalau lastSync di-reset (memastikan bukan ke-cache)');
dismissBackupReminder();
_selfTestAssert(card.style.display==='none','Kartu Backup harus SEMBUNYI setelah tombol "Sudah Paham" (dismiss) dipencet');
_selfTestAssert(localStorage.getItem('kw_backup_reminder_dismissed')==='1','dismissBackupReminder() harus menyimpan flag dismiss ke localStorage');
} finally {
D.googleDrive=backupGD; D.googleSheets=backupGS; D.transactions=backupTx;
if(backupDismissFlag===null) localStorage.removeItem('kw_backup_reminder_dismissed'); else localStorage.setItem('kw_backup_reminder_dismissed',backupDismissFlag);
renderDashboardBackupReminder();
}
}},
{name:'UI: elemen interaktif (data-action) yang cuma berisi ikon/emoji/tanpa teks wajib punya aria-label (aksesibilitas screen reader)', fn:()=>{
findMissingAriaLabels(document).forEach(msg=>_selfTestAssert(false,msg));
}},
];
}
async function computeSelfTestResults(){
const cases=getSelfTestCases();
const results=[];
for(const c of cases){
try{ await c.fn(); results.push({name:c.name,pass:true}); }
catch(e){ results.push({name:c.name,pass:false,error:e.message}); }
}
const passCount=results.filter(r=>r.pass).length;
return {results,passCount,total:results.length,failCount:results.length-passCount,ranAt:new Date().toISOString()};
}
let _lastSelfTestData=null;
let _lastNavSmokeData=null;
let _lastModalSweepData=null;
/* moved to modules-render.js: renderSelfTestResults */
/* moved to modules-render.js: renderSelfTestLastResult */
function saveSelfTestState(data){
try{
safeSetItem('kw_selftest_last',JSON.stringify(data));
}catch(e){ console.warn('Gagal simpan status tes diagnostik:',e); }
updateSelfTestBadge(data.failCount>0);
}
function updateSelfTestBadge(hasFail){
const badge=document.getElementById('selfTestNavBadge');
if(badge) badge.style.display=hasFail?'block':'none';
}
async function runSelfTest(){
const _scrollRootEl=document.getElementById('scrollRoot');
const _savedScrollTop=_scrollRootEl?_scrollRootEl.scrollTop:0;
const data=await computeSelfTestResults();
renderSelfTestResults(data);
saveSelfTestState(data);
if(_scrollRootEl) _scrollRootEl.scrollTop=_savedScrollTop;
toast(data.failCount===0?'✅ Semua tes berhasil ('+data.passCount+'/'+data.total+')':'⚠️ '+data.failCount+' tes gagal');
return data;
}
window.runHeadlessSelfTest=computeSelfTestResults;
async function copySelfTestResults(){
if(!_lastSelfTestData){toast('⚠️ Jalankan tes dulu sebelum menyalin hasil');return;}
const d=_lastSelfTestData;
const lines=[
'Hasil Tes Otomatis — Keluarga W',
new Date(d.ranAt).toLocaleString('id-ID'),
d.passCount+'/'+d.total+' berhasil'+(d.failCount>0?', '+d.failCount+' gagal':''),
'',
...d.results.map(r=>(r.pass?'✅ ':'❌ ')+r.name+(r.pass?'':'\n   → '+r.error))
];
const text=lines.join('\n');
try{
if(navigator.clipboard&&navigator.clipboard.writeText){
await navigator.clipboard.writeText(text);
} else {
const ta=document.createElement('textarea');
ta.value=text; ta.style.position='fixed'; ta.style.opacity='0';
document.body.appendChild(ta); ta.select();
document.execCommand('copy'); document.body.removeChild(ta);
}
toast('📋 Hasil tes disalin');
}catch(e){
toast('⚠️ Gagal menyalin, coba lagi');
}
}
// Derive daftar halaman langsung dari DOM (.page[id^="page-"]), bukan list statis --
// pola yg sama dgn computeModalSweepFnNames() (nyari otomatis semua fungsi openXModal).
// Kalau nanti nambah <div class="page" id="page-xxx">, halaman itu otomatis ikut kesisir
// tanpa perlu ingat update list manual di sini.
function computeNavSmokePageNames(){
const names=[];
document.querySelectorAll('.page[id^="page-"]').forEach(el=>{
names.push(el.id.replace(/^page-/,''));
});
return names;
}
// Tes Navigasi Halaman: pindah ke tiap halaman satu-satu (showPage), sekaligus jalankan cek
// aria-label (findMissingAriaLabels) di halaman yg baru saja dirender. Kenapa digabung di sini:
// cek aria-label yg berdiri sendiri di "Tes Otomatis" cuma nyisir elemen yg KEBETULAN lagi
// ke-render di layar saat tombol itu ditekan (biasanya cuma 1 halaman) -- halaman lain yg
// belum pernah dikunjungi sejak app dibuka isinya masih kosong (renderPageContent belum
// dipanggil), jadi elemen [data-action] di dalamnya tidak ikut kesisir & pelanggaran aria-label
// di sana bisa lolos tanpa ketahuan. Dengan memasang cek ini di tiap iterasi showPage() di
// bawah, satu klik "Tes Navigasi Halaman" otomatis menyisir aria-label di SEMUA halaman yg
// ADA DI DOM (computeNavSmokePageNames()), bukan cuma halaman yg lagi aktif -- dan otomatis
// ikut halaman baru tanpa perlu update list manual.
async function computeNavSmokeTestResults(){
const originalActive=document.querySelector('.page.active');
const originalName=originalActive?originalActive.id.replace('page-',''):'dashboard';
const _scrollRootEl=document.getElementById('scrollRoot');
const _savedScrollTop=_scrollRootEl?_scrollRootEl.scrollTop:0;
const results=[];
let caughtErr=null;
const onErr=(e)=>{ caughtErr=(e&&e.error&&e.error.message)||(e&&e.message)||String(e); };
window.addEventListener('error',onErr);
const pageNames=computeNavSmokePageNames();
for(const name of pageNames){
caughtErr=null;
let pass=true,error=null;
try{
showPage(name);
await new Promise(r=>setTimeout(r,30));
if(caughtErr){ pass=false; error=caughtErr; }
const pageEl=document.getElementById('page-'+name);
const a11yIssues=findMissingAriaLabels(pageEl||document);
if(a11yIssues.length){
pass=false;
const a11yMsg='🔍 Aksesibilitas: '+a11yIssues.length+' elemen tanpa aria-label -- '+a11yIssues[0]+(a11yIssues.length>1?' (+'+(a11yIssues.length-1)+' pelanggaran lain di halaman ini)':'');
error=error?error+' | '+a11yMsg:a11yMsg;
}
}catch(e){ pass=false; error=e.message; }
results.push({name,pass,error});
}
window.removeEventListener('error',onErr);
try{ showPage(originalName); }catch(e){ }
if(_scrollRootEl) _scrollRootEl.scrollTop=_savedScrollTop;
const passCount=results.filter(r=>r.pass).length;
return {results,passCount,total:results.length,failCount:results.length-passCount,ranAt:new Date().toISOString()};
}
/* moved to modules-render.js: renderNavSmokeResults */
async function runNavSmokeTest(){
const data=await computeNavSmokeTestResults();
renderNavSmokeResults(data);
toast(data.failCount===0?'✅ Navigasi & aksesibilitas semua halaman aman ('+data.passCount+'/'+data.total+')':'⚠️ '+data.failCount+' halaman bermasalah (error JS dan/atau aria-label), cek daftar di bawah');
}
// Sama seperti copySelfTestResults() -- disalin ke clipboard buat ditempel ke
// WA/laporan ke diri sendiri pas lagi debug. `error` di tiap hasil sudah berupa
// gabungan (error JS dan/atau pelanggaran aria-label, dipisah " | " kalau dua-duanya
// ada -- lihat computeNavSmokeTestResults), jadi otomatis ikut tersalin apa adanya.
async function copyNavSmokeResults(){
if(!_lastNavSmokeData){toast('⚠️ Jalankan tes navigasi dulu sebelum menyalin hasil');return;}
const d=_lastNavSmokeData;
const lines=[
'Hasil Tes Navigasi & Aksesibilitas — Keluarga W',
new Date(d.ranAt).toLocaleString('id-ID'),
d.passCount+'/'+d.total+' halaman aman'+(d.failCount>0?', '+d.failCount+' bermasalah':''),
'',
...d.results.map(r=>(r.pass?'✅ ':'❌ ')+r.name+(r.pass?'':'\n   → '+r.error))
];
const text=lines.join('\n');
try{
if(navigator.clipboard&&navigator.clipboard.writeText){
await navigator.clipboard.writeText(text);
} else {
const ta=document.createElement('textarea');
ta.value=text; ta.style.position='fixed'; ta.style.opacity='0';
document.body.appendChild(ta); ta.select();
document.execCommand('copy'); document.body.removeChild(ta);
}
toast('📋 Hasil tes navigasi disalin');
}catch(e){
toast('⚠️ Gagal menyalin, coba lagi');
}
}
function computeModalSweepFnNames(){
const names=[];
for(const k in window){
if(/^open[A-Z]\w*Modal$/.test(k)&&typeof window[k]==='function')names.push(k);
}
return names.sort();
}
const EXTRA_MODAL_SWEEP_SPECS=[
{fn:'openQS',args:['qsKeuangan'],id:'qsKeuangan',close:()=>closeQS('qsKeuangan')},
{fn:'openQS',args:['qsBillActions'],id:'qsBillActions',close:()=>closeQS('qsBillActions')},
{fn:'openQS',args:['qsCobek'],id:'qsCobek',close:()=>closeQS('qsCobek')},
{fn:'openQS',args:['qsCarnotes'],id:'qsCarnotes',close:()=>closeQS('qsCarnotes')},
{fn:'openQS',args:['qsLaporan'],id:'qsLaporan',close:()=>closeQS('qsLaporan')},
{fn:'openQS',args:['qsAI'],id:'qsAI',close:()=>closeQS('qsAI')},
{fn:'openQS',args:['qsDashboard'],id:'qsDashboard',close:()=>closeQS('qsDashboard')},
{fn:'openCalc',args:[undefined],id:'calcModal',close:()=>closeCalc()},
{fn:'openBillArchive',args:[],id:'billArchiveModal'},
{fn:'openBillCalendar',args:[],id:'billCalendarModal'},
{fn:'openBillHistory',args:[undefined],id:'billHistoryModal'},
{fn:'openBudgetSettings',args:[],id:'budgetSettingsModal'},
{fn:'openCatatan',args:['anak'],id:'catatanModal'},
{fn:'openCustomerDetail',args:[undefined],id:'customerDetailModal'},
{fn:'openGajiCalc',args:[],id:'gajiCalcModal'},
{fn:'openGlobalSearch',args:[],id:'globalSearchModal'},
{fn:'openWeeklyResetManual',args:[],id:'weeklyResetModal',close:()=>closeModal('weeklyResetModal')},
{fn:'showFilteredTx',args:['dashboard',undefined,'Tes Sweep'],id:'filterTxModal'},
{fn:'showQuickScanPicker',args:['__sweep_dummy_asset__',[1000,2000]],id:'quickScanModal'},
{fn:'editBillHistoryTx',args:['__sweep_dummy_tx__'],id:'billHistoryEditModal'},
{fn:'runDataHealthCheck',args:[],id:'dataHealthModal'},
];
const RISKY_OPENER_SPECS=[
{label:'LinkTx.open(renov)',id:'linkTxModal',
call:()=>{ LinkTx.open('renov','__sweep_dummy_renov__'); },
close:()=>{ LinkTx.finish(); }},
{label:'LinkTx.open(wishlist)',id:'linkTxModal',
call:()=>{ LinkTx.open('wishlist',null); },
close:()=>{ LinkTx.finish(); }},
{label:'LinkTx.open(bill)',id:'linkTxModal',
call:()=>{ LinkTx.open('bill','__sweep_dummy_bill__'); },
close:()=>{ LinkTx.finish(); }},
{label:'openCicilanHistoryFromTx',id:'billHistoryModal',
before:()=>{ const backup=txEditLinkedBillId; txEditLinkedBillId='__sweep_dummy_bill__'; return backup; },
call:()=>{ openCicilanHistoryFromTx(); },
after:(backup)=>{ txEditLinkedBillId=backup; }},
{label:'openWaShare',
call:()=>{
const origOpen=window.open;
window.open=(url)=>{ window.__waSweepCapturedUrl=url; return null; };
try{ openWaShare('(tes diagnostik, tidak pernah dikirim)','081234567890'); }
finally{ window.open=origOpen; }
},
verify:()=>{
const url=window.__waSweepCapturedUrl;
delete window.__waSweepCapturedUrl;
if(!url) return {pass:false,error:'window.open tidak terpanggil'};
if(!/^https:\/\/wa\.me\//.test(url)) return {pass:false,error:'URL tidak sesuai format wa.me: '+url};
return {pass:true};
}},
{label:'RefAI.check()',id:'refAiModal',
call:()=>{
// BUGFIX: dulu pakai window.__sweepOrigFetch (global) buat simpan fetch asli -- kalau spec lain
// (mis. RenovAI.suggest di bawah) jalan sebelum setTimeout 80ms ini selesai, __sweepOrigFetch
// ketimpa nilai fetch PALSU milik spec itu, lalu ke-restore ke window.fetch sbg fetch palsu/undefined
// SELAMANYA -- bikin semua fitur AI/web-search (Cek Referensi, Cek Harga Pasar, dst) rusak permanen
// dgn error "fetch is not a function" sampai app di-reload. Fix: simpan fetch asli di variabel closure
// LOKAL (origFetch), bukan properti global window, jadi tidak akan pernah ketimpa spec lain.
const origFetch=window.fetch;
window.fetch=()=>Promise.reject(new Error('__sweep_blocked_fetch__'));
try{ RefAI.check(); } finally{ setTimeout(()=>{ window.fetch=origFetch; },80); }
}},
{label:'RenovAI.suggest()',id:'renovAiModal',
before:()=>{ D.renovProjects.push({id:'__sweep_dummy_project__',name:'(tes sweep)',items:[]}); return true; },
call:()=>{
// BUGFIX: sama seperti RefAI.check() di atas -- pakai closure lokal, bukan window.__sweepOrigFetch.
const origFetch=window.fetch;
window.fetch=()=>Promise.reject(new Error('__sweep_blocked_fetch__'));
try{ RenovAI.suggest('__sweep_dummy_project__'); } finally{ setTimeout(()=>{ window.fetch=origFetch; },80); }
},
after:()=>{ D.renovProjects=D.renovProjects.filter(p=>p.id!=='__sweep_dummy_project__'); }},
];
const MODULE_METHOD_MODAL_SPECS=[
{label:'Etalase.openModal()',id:'productModal',
call:()=>{ Etalase.openModal(); }},
{label:'Produsen.openModal()',id:'produsenModal',
call:()=>{ Produsen.openModal(); }},
{label:'Order.openModal()',id:'orderModal',
call:()=>{ Order.openModal(); }},
{label:'Tukang.openModal()',id:'tukangModal',
call:()=>{ Tukang.openModal(); }},
{label:'BBM.openModal()',id:'bbmModal',
call:()=>{ BBM.openModal(); }},
{label:'Servis.openModal()',id:'servisModal',
call:()=>{ Servis.openModal(); }},
{label:'Aset.openModal()',id:'assetModal',
call:()=>{ Aset.openModal(); }},
{label:'Piutang.openModal()',id:'piutangModal',
call:()=>{ Piutang.openModal(); }},
{label:'Debt.openModal()',id:'debtModal',
call:()=>{ Debt.openModal(); }},
{label:'RenovCalc.open()',id:'renovCalcModal',
call:()=>{ RenovCalc.open(); }},
{label:'Pensiun.openSettings()',id:'pensiunModal',
call:()=>{ Pensiun.openSettings(); }},
{label:'SewaKios.openUnitModal()',id:'sewaKiosUnitModal',
call:()=>{ SewaKios.openUnitModal(); }},
{label:'LifeBalance.openHistoryModal()',id:'lbHistoryModal',
call:()=>{ LifeBalance.openHistoryModal(); }},
{label:'WorthIt.open()',id:'worthItModal',
call:()=>{ WorthIt.open(); }},
{label:'Torsi.open()',id:'torsiModal',
call:()=>{ Torsi.open(); }},
{label:'Renov.openProjectModal()',id:'renovProjectModal',
call:()=>{ Renov.openProjectModal(); }},
{label:'Renov.openDetail()',id:'renovDetailModal',
call:()=>{ Renov.openDetail('__sweep_dummy_project__'); },
close:()=>{ closeModal('renovDetailModal'); }},
{label:'Renov.openItemModal()',id:'renovItemModal',
call:()=>{ Renov.openItemModal('__sweep_dummy_project__'); }},
{label:'Tukang.openDayEntry()',id:'tkDayModal',
call:()=>{ Tukang.openDayEntry('__sweep_dummy_worker__', todayStr()); }},
{label:'Tukang.openSharedBorModal()',id:'tkBorSharedModal',
call:()=>{ Tukang.openSharedBorModal(); }},
{label:'Tukang.openBorCalc()',id:'tkBorCalcModal',
call:()=>{ Tukang.openBorCalc('day'); }},
{label:'Tukang.openBorHistory()',id:'tkBorHistModal',
call:()=>{ Tukang.openBorHistory(); }},
{label:'Tukang.openJamHistory()',id:'tkJamHistModal',
call:()=>{ Tukang.openJamHistory(); }},
{label:'EduFund.openModal()',id:'eduFundModal',
call:()=>{ EduFund.openModal(); }},
{label:'Refleksi.open()',id:'refleksiModal',
call:()=>{ Refleksi.open(); }},
];
function computeModalSweepCoverageResults(){
const allIds=Array.from(document.querySelectorAll('.overlay,.qs-modal-overlay,.calc-overlay'))
.map(el=>el.id).filter(Boolean);
const uniqueAllIds=[...new Set(allIds)];
const covered=new Set();
computeModalSweepFnNames().forEach(fn=>{
const guessId=fn.replace(/^open/,'');
covered.add(guessId.charAt(0).toLowerCase()+guessId.slice(1));
});
EXTRA_MODAL_SWEEP_SPECS.forEach(s=>{ if(s.id) covered.add(s.id); });
RISKY_OPENER_SPECS.forEach(s=>{ if(s.id) covered.add(s.id); });
MODULE_METHOD_MODAL_SPECS.forEach(s=>{ if(s.id) covered.add(s.id); });
SHARED_DIALOG_IDS.forEach(id=>covered.add(id));
const uncovered=uniqueAllIds.filter(id=>!covered.has(id));
return {allCount:uniqueAllIds.length,coveredCount:covered.size,uncovered,pass:uncovered.length===0,ranAt:new Date().toISOString()};
}
async function testOneModalOpener(spec){
const backupState = spec.before ? spec.before() : undefined;
let caughtErr=null;
const onErr=(e)=>{ caughtErr=(e&&e.error&&e.error.message)||(e&&e.message)||String(e); };
window.addEventListener('error',onErr);
let pass=true,error=null,needsContext=false;
try{
if(spec.call) spec.call();
else window[spec.fn](...(spec.args||[]));
await new Promise(r=>setTimeout(r,40));
if(caughtErr){ pass=false; error=caughtErr; }
else if(spec.verify){
const v=spec.verify();
pass=v.pass; error=v.error||null; needsContext=!!v.needsContext;
}else{
const el=document.getElementById(spec.id);
if(!el){ pass=false; error='elemen #'+spec.id+' tidak ditemukan (tebakan id salah?)'; }
else if(!el.classList.contains('open')){ pass=false; needsContext=true; error='tidak ke-render — kemungkinan butuh konteks (id parent) atau prasyarat data yang belum ada'; }
}
}catch(e){ pass=false; error=e.message; needsContext=/undefined|null/.test(e.message||'')&&/read propert/i.test(e.message||''); }
window.removeEventListener('error',onErr);
try{
if(spec.close) spec.close();
else if(spec.id && typeof closeModal==='function') closeModal(spec.id);
}catch(e){}
if(spec.after) spec.after(backupState);
return {fn:spec.label||spec.fn,id:spec.id||'-',pass,error,needsContext};
}
async function computeModalSweepResults(){
const originalActive=document.querySelector('.page.active');
const originalName=originalActive?originalActive.id.replace('page-',''):'dashboard';
const _scrollRootEl=document.getElementById('scrollRoot');
const _savedScrollTop=_scrollRootEl?_scrollRootEl.scrollTop:0;
const fnNames=computeModalSweepFnNames();
const results=[];
for(const fn of fnNames){
const guessId=fn.replace(/^open/,'');
const id=guessId.charAt(0).toLowerCase()+guessId.slice(1);
results.push(await testOneModalOpener({fn,args:[],id}));
}
for(const spec of EXTRA_MODAL_SWEEP_SPECS){
results.push(await testOneModalOpener(spec));
}
for(const spec of RISKY_OPENER_SPECS){
results.push(await testOneModalOpener(spec));
}
for(const spec of MODULE_METHOD_MODAL_SPECS){
results.push(await testOneModalOpener(spec));
}
try{ showPage(originalName); }catch(e){}
if(_scrollRootEl) _scrollRootEl.scrollTop=_savedScrollTop;
const passCount=results.filter(r=>r.pass).length;
const contextCount=results.filter(r=>!r.pass&&r.needsContext).length;
return {results,passCount,contextCount,total:results.length,failCount:results.length-passCount-contextCount,ranAt:new Date().toISOString()};
}
/* moved to modules-render.js: renderModalSweepResults */
const SHARED_DIALOG_IDS=['confirmModalOverlay','promptModalOverlay','choiceModalOverlay','infoModalOverlay','pinPromptModalOverlay'];
function computeZIndexStackingResults(){
const results=[];
const sharedZ={};
SHARED_DIALOG_IDS.forEach(id=>{
const el=document.getElementById(id);
sharedZ[id]=el?parseInt(getComputedStyle(el).zIndex)||0:null;
});
const otherModals=Array.from(document.querySelectorAll('.overlay,.qs-modal-overlay,.calc-overlay')).filter(el=>!SHARED_DIALOG_IDS.includes(el.id)&&el.id);
SHARED_DIALOG_IDS.forEach(id=>{
const z=sharedZ[id];
if(z==null){results.push({id,pass:false,error:'elemen tidak ditemukan'});return;}
const blockers=otherModals.filter(el=>(parseInt(getComputedStyle(el).zIndex)||0)>=z).map(el=>el.id);
results.push({id,pass:blockers.length===0,error:blockers.length?'z-index ('+z+') <= modal: '+blockers.join(', ')+' — dialog ini akan tersembunyi kalau dipanggil dari modal tsb':null});
});
return{results,passCount:results.filter(r=>r.pass).length,total:results.length,ranAt:new Date().toISOString()};
}
async function runModalSweep(){
toast('🪟 Mengecek buka/tutup semua modal...');
const data=await computeModalSweepResults();
const zData=computeZIndexStackingResults();
zData.results.forEach(r=>{
data.results.push({fn:'(susunan lapisan) '+r.id,id:r.id,pass:r.pass,error:r.error,needsContext:false});
});
data.total+=zData.total;
data.passCount+=zData.passCount;
data.failCount+=(zData.total-zData.passCount);
const covData=computeModalSweepCoverageResults();
data.total+=1;
if(covData.pass){ data.passCount+=1; }
else{
data.failCount+=1;
data.results.push({fn:'(kelengkapan cakupan) modal belum terdaftar',id:covData.uncovered.join(', '),pass:false,error:covData.uncovered.length+' modal ada di halaman tapi belum masuk sweep manapun -- daftarkan ke EXTRA_MODAL_SWEEP_SPECS/MODULE_METHOD_MODAL_SPECS: '+covData.uncovered.join(', '),needsContext:false});
}
renderModalSweepResults(data);
toast(data.failCount===0?'✅ Semua modal aman ('+data.passCount+'/'+data.total+', '+data.contextCount+' butuh konteks)':'⚠️ '+data.failCount+' modal bermasalah, cek daftar di bawah');
}
// Sama seperti copySelfTestResults()/copyNavSmokeResults() -- disalin ke clipboard
// buat ditempel ke WA/laporan ke diri sendiri pas lagi debug modal.
async function copyModalSweepResults(){
if(!_lastModalSweepData){toast('⚠️ Jalankan tes modal dulu sebelum menyalin hasil');return;}
const d=_lastModalSweepData;
const lines=[
'Hasil Tes Buka/Tutup Modal — Keluarga W',
new Date(d.ranAt).toLocaleString('id-ID'),
d.passCount+'/'+d.total+' modal aman'+(d.contextCount>0?', '+d.contextCount+' butuh konteks':'')+(d.failCount>0?', '+d.failCount+' bermasalah':''),
'',
...d.results.map(r=>(r.pass?(r.needsContext?'ℹ️ ':'✅ '):'❌ ')+r.fn+' (#'+r.id+')'+(r.pass?'':'\n   → '+r.error))
];
const text=lines.join('\n');
try{
if(navigator.clipboard&&navigator.clipboard.writeText){
await navigator.clipboard.writeText(text);
} else {
const ta=document.createElement('textarea');
ta.value=text; ta.style.position='fixed'; ta.style.opacity='0';
document.body.appendChild(ta); ta.select();
document.execCommand('copy'); document.body.removeChild(ta);
}
toast('📋 Hasil tes modal disalin');
}catch(e){
toast('⚠️ Gagal menyalin, coba lagi');
}
}
async function autoRunSelfTestIfNeeded(){
try{
const lastBuild=localStorage.getItem('kw_selftest_build');
if(lastBuild===APP_BUILD_VERSION){
const raw=localStorage.getItem('kw_selftest_last');
if(raw){ const stored=JSON.parse(raw); updateSelfTestBadge(stored.failCount>0); }
return;
}
// Jangan jalankan self-test otomatis kalau user sedang membuka modal apa pun --
// beberapa test case menyentuh DOM modal asli (mis. txModal) dan bisa menimpa/menutup
// input yang sedang diisi user. Tunda & coba lagi nanti (self-test cuma jalan sekali per
// build, jadi ditunda beberapa detik tidak masalah).
if(document.querySelector('.overlay.open')){
setTimeout(autoRunSelfTestIfNeeded,3000);
return;
}
const data=await computeSelfTestResults();
saveSelfTestState(data);
safeSetItem('kw_selftest_build',APP_BUILD_VERSION);
if(data.failCount>0){
toast('⚠️ Tes diagnostik otomatis: '+data.failCount+' dari '+data.total+' gagal setelah update. Cek Pengaturan → Diagnostik.',4500);
}
}catch(e){ console.warn('Auto self-test gagal jalan:',e); }
}
async function init(){
await load();
applyEffectiveTheme();
setupPWA();
enableSwipeToDismiss('txModal');
enableSwipeToDismiss('worthItModal');
if(navigator.storage&&navigator.storage.persist){
navigator.storage.persist().catch(()=>{});
}
const now=new Date();
document.getElementById('headerDate').textContent=now.toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long'});
setInterval(()=>{applyEffectiveTheme();checkAndFireReminders();if(D.googleDrive.autoSync&&gdriveAccessToken)uploadBackupToDrive(true);},5*60*1000);
const tryBackupOnClose=()=>{
saveFlush();
if(D.googleDrive&&D.googleDrive.autoSync&&gdriveAccessToken){
uploadBackupToDrive(true);
}
};
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')tryBackupOnClose();});
window.addEventListener('pagehide',tryBackupOnClose);
const setup=localStorage.getItem('kw_setup');
if(!setup){const ob=document.getElementById('onboard');ob.classList.remove('u-dnone');ob.style.display='flex';updateOnboardPreview();return;}
const pin=localStorage.getItem('kw_pin');
if(pin){showPinScreen();return;}
showMain();
}
function parsePzNum(v){
if(v===null||v===undefined)return 0;
const str=String(v);
const negative=/-/.test(str);
const digits=str.replace(/[^0-9]/g,'');
const n=Number(digits);
if(isNaN(n))return 0;
return negative?-n:n;
}
function parseDecStr(v){
if(v===null||v===undefined||v==='')return null;
let s=String(v).trim().replace(/[^0-9.,\-]/g,'');
if(!s)return null;
if(s.includes(',')&&!s.includes('.')) s=s.replace(',','.');
else s=s.replace(/,/g,'');
const n=parseFloat(s);
return isNaN(n)?null:n;
}
function normalizeOcrNumber(raw){
if(!raw)return NaN;
raw=String(raw).trim();
const lastComma=raw.lastIndexOf(','), lastDot=raw.lastIndexOf('.');
let decSep=null;
if(lastComma>-1&&lastDot>-1){
decSep=lastComma>lastDot?',':'.';
} else if(lastComma>-1){
const parts=raw.split(',');
if(parts[parts.length-1].length!==3)decSep=',';
} else if(lastDot>-1){
const parts=raw.split('.');
if(parts[parts.length-1].length!==3)decSep='.';
}
let intPart=raw,decPart='';
if(decSep){
const idx=raw.lastIndexOf(decSep);
intPart=raw.slice(0,idx);
decPart=raw.slice(idx+1);
}
intPart=intPart.replace(/[.,]/g,'');
const n=parseFloat(intPart+(decPart?'.'+decPart:''));
return n;
}
function setPajakTab(tab,el){
document.querySelectorAll('#page-pajak .cn-tab').forEach(b=>b.classList.remove('active'));
if(el)el.classList.add('active');
document.getElementById('pajakTab-zakat').classList.toggle('u-dnone', tab!=='zakat');
document.getElementById('pajakTab-zakat').style.display='';
document.getElementById('pajakTab-pajak').classList.toggle('u-dnone', tab!=='pajak');
document.getElementById('pajakTab-pajak').style.display='';
}
let _pajakZakatRenderedOnce=false;
/* moved to modules-render.js: renderPajakZakat */
function savePajakSettings(){
const pz=D.pajakZakat;
pz.hargaEmasPerGram=parsePzNum(document.getElementById('pzHargaEmas').value)||pz.hargaEmasPerGram;
pz.nisabPenghasilanBulan=parsePzNum(document.getElementById('pzNisabBulan').value)||pz.nisabPenghasilanBulan;
pz.nisabPenghasilanTahun=pz.nisabPenghasilanBulan*12;
pz.zakatFitrahPerJiwa=parsePzNum(document.getElementById('pzFitrahJiwa').value)||pz.zakatFitrahPerJiwa;
save();
hitungZakatPenghasilan();hitungZakatMaal();hitungZakatFitrah();
}
/* moved to modules-render.js: renderRefCheckReminder */
function hitungZakatPenghasilan(){return Zakat.hitungPenghasilan();}
function hitungZakatMaal(){return Zakat.hitungMaal();}
function hitungZakatFitrah(){return Zakat.hitungFitrah();}
function catatZakatDibayar(jenis){return Zakat.catatDibayar(jenis);}
/* moved to modules-render.js: renderZakatLog */
function delZakatLog(id){return Zakat.delLog(id);}
function getPTKP(status){return PPh21.getPTKP(status);}
function hitungPPh21Progresif(pkp){return PPh21.hitungProgresif(pkp);}
function isiPPhDariTransaksi(){return PPh21.isiDariTransaksi();}
function hitungPPh21(){return PPh21.hitung();}
/* moved to modules-render.js: renderUMKMPajak */
function openAssetModal(id){return Aset.openModal(id);}
function toggleAssetZakatable(){return Aset.toggleZakatable();}
function saveAsset(){return Aset.save();}
async function delAsset(id){return Aset.delete(id);}
/* moved to modules-render.js: renderAssetList */
function totalAssetValue(){return Aset.totalValue();}
function isNoSpendDay(dateStr){
return !D.transactions.some(t=>t.type==='expense'&&t.date===dateStr);
}
function computeNoSpendLast30(){
let count=0;
const now=new Date();
let earliest=null;
(D.transactions||[]).forEach(t=>{const d=new Date(t.date);if(!earliest||d<earliest)earliest=d;});
const daysSinceEarliest=earliest?Math.floor((now-earliest)/86400000)+1:0;
const daysWithData=Math.max(0,Math.min(30,daysSinceEarliest));
for(let i=0;i<30;i++){
const d=new Date(now); d.setDate(d.getDate()-i);
if(isNoSpendDay(dateToISO(d)))count++;
}
return {count,total:30,daysWithData};
}
function autoSnapshotLifeBalanceIfNeeded(){return LifeBalance.autoSnapshotIfNeeded();}
function openPiutangModal(id){return Piutang.openModal(id);}
function togglePiutangLunas(){return Piutang.toggleLunas();}
function savePiutang(){return Piutang.save();}
async function delPiutang(id){return Piutang.delete(id);}
function totalPiutangValue(){return Piutang.totalValue();}
/* moved to modules-render.js: renderPiutangList */
function openDebtModal(id){return Debt.openModal(id);}
function toggleDebtLunas(){return Debt.toggleLunas();}
function saveDebt(){return Debt.save();}
async function delDebt(id){return Debt.delete(id);}
function totalDebtValue(){return Debt.totalValue();}
function totalDebtCicilanBulanan(){return Debt.totalCicilanBulanan();}
/* moved to modules-render.js: renderDebtList */
function setDebtStrategyMethod(m){return DebtStrategy.setMethod(m);}
function onDsExtraInput(){return DebtStrategy.onExtraInput();}
function currentNetWorthValue(){return Kekayaan.currentNetWorth();}
function saveWealthSnapshot(manual){return Kekayaan.saveSnapshot(manual);}
function autoSnapshotWealthIfNeeded(){return Kekayaan.autoSnapshotIfNeeded();}
async function delWealthSnapshot(id){return Kekayaan.deleteSnapshot(id);}
function actualWealthCAGR(){return Kekayaan.actualCAGR();}
/* moved to modules-render.js: renderWealthSnapshots */
/* moved to modules-render.js: renderKekayaanBersih */
/* moved to modules-render.js: renderPBB */
/* moved to modules-render.js: renderPBBBillStatus */
function pilihAsetPBB(){return PBB.pilihAset();}
function hitungPBB(){return PBB.hitung();}
function ikatPBBTagihan(){return PBB.ikatTagihan();}
Object.assign(window,{
Etalase,Produsen,Order,FI,DanaDaruratAI,WorthIt,TimelineW,Pensiun,Budget,BudgetTabs,BudgetReko,
Laporan,Payroll,Tukang,BBM,Sparepart,Servis,Torsi,Pelanggan,SiapPulang,RefAI,Zakat,PPh21,PajakUMKM,
Aset,LifeBalance,Piutang,Debt,DebtStrategy,Renov,RenovAI,SewaKios,RenovCalc,Kekayaan,AlokasiAset,PBB,
IDBStore,LinkTx,Bill,AIWidget,EduFund,PriceReko,Refleksi,Kasir,Advisor
});
init();
