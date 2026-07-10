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
