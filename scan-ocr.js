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
