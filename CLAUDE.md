# Instruksi untuk Claude Code — Repo Keluarga W

Repo ini adalah PWA client-side (tanpa backend) untuk manajemen keuangan,
zakat, bisnis, dan kendaraan keluarga. Source dipecah per fitur, lalu
digabung jadi `app-bundle-a.min.js` / `app-bundle-b.min.js` oleh `build.js`.

## Perintah penting
- `npm install` — sekali di awal (untuk eslint/esbuild).
- `npm run lint` — ESLint (`eslint.config.js`).
- `npm test` — `node --test tests/*.test.js`, unit test asli (bukan mock).
- `npm run build` — jalankan `build.js`, hasilkan bundle.
- `npm run check` — lint && test && build, jalankan semua sekaligus.

## Tugas default kalau diminta "perbaiki bug" / "self-test" / "fix sampai hijau"
1. Jalankan `npm run check`.
2. Kalau ada yang gagal:
   - Baca error paling atas dulu (biasanya akar masalah).
   - Untuk error test: baca pesan `_selfTestAssert` di `tests/*.test.js`
     (sudah deskriptif dalam Bahasa Indonesia), lalu cari fungsi terkait
     di **file sumber**, BUKAN di `app-bundle-a.min.js` / `app-bundle-b.min.js`
     — file itu hasil build otomatis dan akan tertimpa lagi tiap build.
   - Untuk error lint: ikuti aturan `eslint.config.js`.
   - Untuk error build: cek `build.js` dan urutan GROUP_A/GROUP_B di komentar
     paling atas tiap file `features-*.js` — banyak modul saling referensi
     jadi urutan load penting, jangan diubah sembarangan.
3. Buat perubahan sekecil mungkin yang menyelesaikan akar masalah.
4. Jalankan lagi `npm run check`, ulangi sampai semua pass, 0 fail, build sukses.
5. Kalau perbaikan yang "benar" butuh keputusan produk (bukan sekadar bug
   teknis, misal aturan pajak/zakat berubah) — STOP dan tanya dulu, jangan menebak.
6. Di akhir, ringkas: apa yang rusak, kenapa, dan file apa saja yang diubah.

## Yang tidak boleh disentuh langsung
- `app-bundle-a.min.js`, `app-bundle-b.min.js` — hasil build, edit di source lalu build ulang.
- Urutan file di `build.js` (GROUP_A/GROUP_B) — hanya diubah kalau memang ada alasan struktural yang jelas.

## Cara resmi bikin zip rilis/patch — WAJIB pakai `npm run release`
JANGAN pernah bikin zip rilis dengan cara select-file-manual/copy folder kerja.
Dua insiden pernah terjadi persis karena itu:
- Sebuah paket patch pernah dikirim tanpa `app-bundle-a.min.js` & belasan file
  source lain (folder kerja ≠ apa yg sudah di-commit).
- Sebuah paket patch lain ("collapse-fixed") ternyata dibuat dari branch/commit
  LAMA yg belum di-rebase ke `main` terbaru → 2 bugfix yg sudah pernah selesai
  (chicken-egg OCR di `scan-ocr.js`, false-positive nama aset Bibit) ke-revert
  tanpa disadari.

Jalankan `npm run release` (= `scripts/release.sh`) setiap kali mau membuat zip
utk dikirim keluar. Script ini otomatis:
1. Menolak jalan kalau branch bukan `main` atau ketinggalan dari `origin/main`
   (mencegah patch dari base basi seperti insiden ke-2 di atas).
2. Menjalankan `npm run check` penuh — build akan berhenti sendiri kalau ada
   regresi ke pola bug yg sudah pernah ada guard-nya (lihat lint-lint di
   `build.js`: u-dnone/style.display, escapeHtml, chicken-egg Tesseract, dst).
3. Meng-commit otomatis perubahan versi/bundle hasil build, lalu bikin zip
   lewat `git archive` dari commit itu — jadi isi zip dijamin = isi commit,
   tidak mungkin ada file kerja lokal yg ketinggalan/nyelip.

Kalau menemukan kelas bug yang sudah pernah terjadi & sempat ke-revert/muncul
lagi (seperti insiden chicken-egg OCR di atas), pertimbangkan menambah lint
guard baru di `build.js` (pola: `lintXxx()` yang dipanggil di `main()` dan
`process.exit(1)` kalau ketemu) supaya build gagal keras kalau bug itu balik
lagi — bukan cuma mengandalkan komentar `// BUGFIX:` yang bisa hilang saat di-diff/revert.

## Upload dari HP (tanpa CLI) — WAJIB kalau tidak pakai `npm run release`

Kalau update dikirim ke GitHub lewat upload manual di HP (GitHub mobile
app/web, tanpa akses terminal/git), `npm run release` tidak bisa dijalankan.
Supaya 2 insiden lama (file source ketinggalan, patch dari base basi) tidak
terulang lewat jalur ini, WAJIB ikuti:

1. **Selalu lewat branch baru + Pull Request, jangan langsung upload ke
   `main`.** Buka PR, biarkan CI (`npm run check` dari `.github/workflows/ci.yml`)
   jalan otomatis — ini pengganti `npm run release` yang tidak bisa jalan di HP.
2. **Jangan merge PR sebelum status check CI hijau.** Jangan tergesa-gesa
   merge dari HP sebelum centang hijau muncul di PR.
3. **Cocokkan jumlah & nama file sebelum upload** dengan isi commit terakhir
   di `kw/` (terutama `*.js` di root, bukan di `backups/`/`archive/`) — supaya
   file yang "ketinggalan" ketahuan sebelum upload, bukan sesudah.
4. **Jangan upload `kw/backups/` atau `kw/archive/` secara manual.** Upload
   lewat GitHub app tidak otomatis skip file yang di-gitignore seperti
   `git add` — file di dua folder ini harus dikeluarkan manual dari daftar
   yang diupload/ditimpa.
5. **Jangan edit `app-bundle-a.min.js` / `app-bundle-b.min.js` langsung** di
   editor GitHub mobile. File ini hasil build otomatis — edit source-nya,
   biarkan CI/`build.js` yang generate ulang bundle.
6. **Tulis di pesan commit: asal upload & versi/build dasar**, misal
   `"upload dari Claude mobile, base build #173"` — supaya kalau ternyata
   base-nya stale, gampang dilacak (persis insiden ke-2 di atas).
7. **Setelah merge, cek `FILE-MAP.md` ikut ter-update otomatis oleh CI** —
   ini bukti build step benar-benar jalan, bukan cuma file mentah ketimpa
   manual.

## CI & branch protection
`.github/workflows/ci.yml` menjalankan `npm run check` (termasuk
`--require-minify`, lihat catatan esbuild di bawah) di setiap push & PR.
Supaya ini benar-benar jadi gerbang wajib (bukan sekadar informatif), aktifkan
di GitHub: Settings → Branches → Branch protection rule utk `main` → centang
"Require status checks to pass before merging" → pilih job `check` dari
workflow ini. Tanpa ini, PR/patch dari branch basi tetap bisa di-merge/dikirim
walau CI merah.

## Catatan esbuild (minifikasi)
`build.js` fallback otomatis ke bundle TANPA minifikasi kalau `esbuild` tidak
terpasang — aman utk dev sehari-hari, tapi BAHAYA kalau kejadian diam-diam di
CI/rilis produksi (`optionalDependencies` esbuild bisa gagal pasang tanpa bikin
`npm install` exit non-zero). Karena itu `ci.yml` & `scripts/release.sh` sama-sama
memanggil build dengan flag `--require-minify` (atau `REQUIRE_MINIFY=1`) —
build akan GAGAL keras kalau esbuild ternyata tidak terpasang, daripada diam-diam
mengirim bundle besar tanpa ada yang sadar.

## Catatan kerja — 2026-07-10/11: review & test dasar Car Notes (BBM/Servis)

Konteks: diminta review kode fitur Car Notes (Catatan BBM & Servis di
`features-budget-laporan-carnotes-pelanggan.js` + helper terkait di
`transaksi.js` / `features-tukang-kendaraan-storage.js`). Semua check
(`npm run check`) sudah hijau sebelum & sesudah kerjaan ini — TIDAK ada bug
yang diperbaiki di sesi ini, murni menambah test yang sebelumnya nol utk
area ini.

**Temuan review (status per 2026-07-11):**
1. ✅ SELESAI (lihat catatan kerja 2026-07-11 di bawah) — Catatan BBM yang
   "yatim" (kehilangan `txLinkId`) sekarang dibuatkan ulang transaksinya
   & di-sambung lagi saat diedit, tidak silently unsynced lagi.
2. ✅ SELESAI (lihat catatan kerja 2026-07-11 bagian ke-2 di bawah) —
   `resolveVehicleTxCategory` sekarang pakai link stabil `linkedVehicleId`
   di kategori, bukan cocok-nama string doang, jadi tidak lagi fragile
   kalau kategorinya di-rename (atau nanti kendaraannya, kalau suatu saat
   ada fitur rename kendaraan — saat ini belum ada UI utk itu).

**Test yang ditambahkan (0 → 48 test khusus Car Notes, total suite 103 → 151):**
- `tests/bbm-log.test.js` — `recordBbmLog()` (transaksi.js): catatan baru,
  auto-init `D.bbmLogs`, harga auto-hitung dari cost/liter vs harga manual,
  edit di tempat (tidak dobel entry), `txLinkId` tidak ikut ketimpa saat
  edit, fallback `vehicleId` lama, `existingBbmId` yang tidak ketemu.
- `tests/bbm-renderlist.test.js` — `BBM.renderList()`: total liter/biaya
  terfilter per kendaraan & rentang tanggal, rata-rata km/L (kasus normal
  ≥2 isi-penuh & fallback <2 isi-penuh), badge km/L per baris, empty state.
- `tests/servis-calc.test.js` — fungsi pengingat servis
  (`servisLogMatchesCat`, `getEffectiveIntervalKm`, `hasIntervalOverride`,
  `getLastServiceKm`, `estimateKmPerDay`, `estimateServiceDateISO`) di
  `features-tukang-kendaraan-storage.js`; `Servis.applyStockUsage` /
  `Servis.revertStockUsage` (pemakaian & pengembalian stok sparepart,
  termasuk jalur konfirmasi saat stok kurang); dan `Servis._saveInner`
  penuh (catatan baru vs edit, kategori pengingat cocok/baru/nama-kendaraan,
  sinkron interval, sinkron transaksi Keuangan, tukar part yg dipakai saat
  edit, pembatalan simpan kalau user batal konfirmasi stok kurang).

Sisa area Car Notes yg masih belum ada test: `BBM.openModal`/`Servis.openModal`
(prefill form saat edit — murni DOM-write, nilai gunanya lebih rendah drpd
yg sudah dites) dan bagian "Jalan"/Torsi baut kalau ada logikanya sendiri
(belum dicek).

Semua test baru pakai `loadSource()`/`extractFunction()` yang sudah ada di
`tests/helpers/` (load file source ASLI, bukan re-implementasi logic) —
lihat catatan lengkap caranya di `tests/helpers/loadSource.js`.

## Catatan kerja — 2026-07-11: fix temuan #1 (BBM "yatim" tidak tersinkron ulang saat diedit)

Konteks: mengerjakan temuan #1 dari review sesi sebelumnya (lihat di atas).
Sebelum fix, `npm run check` (test+build; lint tidak bisa dijalankan di
sandbox ini krn tidak ada akses internet utk `npm install`) sudah hijau —
bug ini murni belum ke-cover test, bukan regresi yang kelihatan dari CI.

**Akar masalah** (`BBM._saveInner` di
`features-budget-laporan-carnotes-pelanggan.js`): saat edit, `txId` diambil
dari `existing.txLinkId||null`. Kalau catatan BBM kehilangan `txLinkId`
(mis. transaksi terkaitnya kehapus manual di luar alur normal, atau data
lama sebelum field ini ada), `txId` jatuh ke `null` → cabang
`if(txId){...update tx...}` dilewati begitu saja → tidak ada transaksi baru
dibuat, catatan tetap "yatim" selamanya walau berkali-kali diedit, tanpa
pesan error apapun ke user.

**Fix**: tambah deteksi `wasOrphan = isEdit && !existing.txLinkId`. Kalau
`wasOrphan`, generate `txId` baru (`uid()`) dan buat transaksi baru persis
seperti alur catatan baru (push ke `D.transactions`, kategori dari
`resolveVehicleTxCategory(veh)`, subcategory `'Bensin'`), lalu sambung lagi
`D.bbmLogs[..].txLinkId` ke `txId` yang baru itu — krn `recordBbmLog()`
(transaksi.js) SENGAJA tidak menyentuh `txLinkId` saat edit (lihat test
`recordBbmLog — edit TIDAK mengubah txLinkId...` di `bbm-log.test.js`),
jadi penyambungan ulang ini harus terjadi di `_saveInner`, bukan di
`recordBbmLog`. Toast dibedakan (`"...& disinkron ulang ke Keuangan"`) biar
user sadar ada transaksi baru yang otomatis dibuat. Alur edit normal
(`txLinkId` sudah ada) tidak berubah sama sekali.

**Test baru**: `tests/bbm-saveinner.test.js` (0 → 5 test, total suite
151 → 156) — sebelumnya `BBM._saveInner` belum ada test sama sekali (beda
dgn `recordBbmLog` yang sudah dites di `bbm-log.test.js`). Cakupan: tolak
simpan kalau KM/liter/biaya kosong, catatan baru (log+transaksi dibuat,
`txLinkId` tersambung), edit normal (update di tempat, tidak dobel
transaksi), **edit catatan yatim (kasus bugfix ini — transaksi baru
dibuat & `txLinkId` tersambung ulang)**, dan `editId` yang tidak ketemu di
`D.bbmLogs`. Pola test: `createFakeDocument` dari `tests/helpers/fakeDom.js`
+ stub `recordBbmLog` lokal di file test (implementasi disalin persis dari
`transaksi.js`, krn fungsi itu di file lain) — sama seperti pola
`Servis._saveInner` di `servis-calc.test.js`.

`npm test` & `npm run build` sudah dicek hijau (156/156 pass, build sukses)
setelah perubahan ini. `npm run lint` TIDAK bisa dijalankan di sesi ini krn
sandbox tanpa akses internet (`npm install` gagal 403) — tolong jalankan
`npm run check` penuh (atau minimal `npm run lint`) sebelum merge/release
utk memastikan tidak ada pelanggaran `eslint.config.js` dari perubahan ini.

Temuan #2 (`resolveVehicleTxCategory` fragile thd rename kendaraan) masih
belum dikerjakan — lihat catatan status di atas.

## Catatan kerja — 2026-07-11 (bagian ke-2): fix temuan #2 (kategori kendaraan fragile thd rename)

**Klarifikasi penting sebelum fix**: dicek dulu apakah "rename kendaraan"
itu nyata bisa terjadi dari UI — ternyata SAAT INI tidak ada fitur rename
nama kendaraan sama sekali (`features-tukang-kendaraan-storage.js` cuma
punya `saveVehicle` (tambah baru), `editVehicleInterval` (cuma interval
servis, bukan nama), dan `delVehicle`). Jadi jalur bug yang BENAR-BENAR
bisa kejadian sekarang bukan "kendaraan di-rename", tapi **kategorinya**
di-rename lewat menu Kategori (`kategori.js:saveCat`) — fitur itu SUDAH ada
dan sengaja menyesuaikan transaksi LAMA ke nama kategori baru
(`D.transactions.forEach(t=>{if(t.category===oldName)t.category=name})`),
tapi tidak tahu-menahu soal `resolveVehicleTxCategory` yang nyari kategori
kendaraan lewat cocok-nama-persis. Akibatnya: user rename kategori
"Vario 125" jadi "Motor Harian" (murni alasan estetika di Keuangan) →
transaksi LAMA ikut ganti nama (benar), tapi catatan BBM/servis
BERIKUTNYA utk kendaraan itu tidak nemu lagi kategori itu → jatuh diam-diam
ke kategori "Transport" umum, tercampur dgn kendaraan lain, TANPA pesan
error apapun ke user. Ini bug teknis konkret (bukan keputusan produk soal
aturan pajak/zakat), jadi dikerjakan langsung tanpa nanya dulu — TAPI kalau
suatu saat mau nambah fitur rename kendaraan, itu tetap bisa dipakai lewat
mekanisme yang sama (lihat di bawah), tidak perlu perubahan lagi.

**Fix** (`resolveVehicleTxCategory` di `transaksi.js`): kategori kendaraan
sekarang disimpan pakai field baru `linkedVehicleId` begitu ketemu/dibuat
pertama kali (lewat cocok nama, sama seperti sebelumnya). Urutan pencarian
kategori jadi: (1) cari dulu via `c.linkedVehicleId===vehicle.id` — stabil,
tidak peduli nama kategori berubah; (2) kalau belum ada link (data lama/
pertama kali), fallback ke cocok-nama-persis seperti sebelumnya, LALU
langsung di-stamp `linkedVehicleId`-nya biar next call pakai jalur (1); (3)
kalau tetap tidak ketemu, fallback ke kategori "Transport" bersama (TIDAK
di-stamp link, krn ini kategori bersama utk semua kendaraan yg belum py
kategori sendiri, bukan punya 1 kendaraan tertentu). `kategori.js:saveCat`
tidak perlu diubah — field `linkedVehicleId` otomatis ikut kepertahankan
krn baris itu sudah pakai spread `{...D.categories[type][catEditIdx],
name,emoji}`.

**Test baru**: `tests/vehicle-tx-category.test.js` (0 → 6 test, total suite
156 → 162) — sebelumnya `resolveVehicleTxCategory` belum ada test sama
sekali. Cakupan: belum ada kategori sama sekali (fallback Transport, TIDAK
di-link), kategori cocok nama & ke-link, **kategori sudah di-link lalu
NAMANYA diubah => tetap ketemu via link (kasus bugfix ini)**, 2 kendaraan
beda tidak saling ke-link, kendaraan tanpa kategori khusus tetap fallback
Transport bersama, dan subs (Bensin/Servis & Oli/Pajak) tidak dobel kalau
dipanggil berkali-kali. (Catatan teknis: `Array.from(...)` dipakai sebelum
`assert.deepEqual` pada array yg berasal dari dalam vm sandbox, krn array
lintas-realm bikin `deepEqual`/`deepStrictEqual` gagal walau isinya sama
persis — pola yg sama dipakai di `fi-calc.test.js`.)

`npm test` & `npm run build` sudah dicek hijau (162/162 pass, build
sukses) setelah perubahan ini. `npm run lint` TIDAK bisa dijalankan di
sesi ini krn sandbox tanpa akses internet (`npm install` gagal 403) —
tolong jalankan `npm run check` penuh sebelum merge/release.

## Catatan kerja — 2026-07-11 (bagian ke-3): fix sinkronisasi BBM ↔ Transaksi ↔ Car Notes

Konteks: mengerjakan item "BELUM DIKERJAKAN" dari `CATATAN-CEK-CLAUDE.md` —
"Sinkronisasi BBM ↔ Transaksi ↔ Car Notes: belum diuji ulang secara
otomatis". Ini arah SEBALIKNYA dari temuan #1 (yang itu: edit dari sisi
Car Notes/`BBM._saveInner` → Keuangan; ini: edit dari sisi Keuangan/form
Transaksi → Car Notes).

**Akar masalah** (`_saveTxInner` di `transaksi.js`): saat edit transaksi
yang sudah tertaut ke catatan BBM (`existingTx.bbmLinkId`), sinkronisasi ke
`D.bbmLogs` HANYA terjadi lewat `applyTxBbmFromTx()`, dan fungsi itu
early-return total kalau checkbox "Sinkron ke Catatan Mobil" (`txSyncBbm`)
tidak tercentang atau panel BBM disembunyikan (mis. krn kategori transaksi
diganti keluar dari BBM saat edit). Akibatnya: user ubah jumlah/tanggal
transaksi, tapi checkbox itu kebetulan mati → `D.bbmLogs` (dipakai Car
Notes) TIDAK ikut ter-update, jadi beda nilai dari `D.transactions`
(dipakai Keuangan) walau `bbmLinkId` masih menghubungkan keduanya —
silent desync, ketauan cuma kalau user buka Car Notes & Keuangan
berdampingan. Ini INKONSISTEN dgn link sejenis: `servisLinkId` (baris
tepat di atasnya) SELALU sinkron field dasar (cost/date/accountId) TANPA
syarat, tidak digantung checkbox apapun — jadi bukan keputusan produk
baru, cuma menyamakan BBM dgn pola yang sudah dipakai utk Servis.

**Fix**: tambah blok sinkron TANPA SYARAT tepat setelah blok `servisLinkId`
yang sudah ada — kalau `existingTx.bbmLinkId` ada, field dasar
(`cost`/`date`/`accountId`) di `D.bbmLogs` yang bersangkutan selalu
di-`Object.assign` mengikuti transaksi, TERLEPAS dari checkbox. Checkbox
`txSyncBbm` tetap seperti semula — cuma ngatur field DETAIL BBM
(km/liter/harga/spbu/fullTank/kendaraan) lewat `applyTxBbmFromTx()` yang
tetap jalan setelahnya (kalau checkbox nyala, field detail ikut sinkron
juga di atas field dasar; kalau mati, field detail dibiarkan apa adanya).

**Test baru**: `tests/tx-bbm-sync.test.js` (0 → 3 test, total suite
162 → 165) — sebelumnya `_saveTxInner`/`saveTx` (fungsi utama form
Transaksi Keuangan) belum ada test otomatis SAMA SEKALI. Cakupan: **edit
transaksi ber-`bbmLinkId` dgn checkbox MATI → field dasar BBM tetap ikut
sinkron, field detail TIDAK disentuh (kasus bugfix ini)**; edit dgn
checkbox NYALA → field dasar & detail dua2nya sinkron (perilaku lama,
tetap jalan); dan edit transaksi tanpa `bbmLinkId` → `D.bbmLogs` sama
sekali tidak disentuh. Cakupan sengaja dibatasi ke jalur "tunai" (bukan
cicilan/langganan/stok/cobek) biar fokus & jelas — banyak dependency
lintas-file (`WorthIt`, `SewaKios`, `Tukang`, `Renov`,
`applyTxCobekStockFromTx`, dst) di-stub sebagai no-op, BUKAN test
integrasi lintas file sungguhan.

Sisa item `CATATAN-CEK-CLAUDE.md` yg masih belum dikerjakan: evaluasi
split `transaksi.js` (butuh keputusan desain besar, sengaja belum
dieksekusi) & Logic Torsi Sparepart (belum ada test otomatis).

`npm test` & `npm run build` sudah dicek hijau (165/165 pass, build
sukses) setelah perubahan ini. `npm run lint` TIDAK bisa dijalankan di
sesi ini krn sandbox tanpa akses internet — tolong jalankan `npm run
check` penuh sebelum merge/release.

## Catatan kerja — 2026-07-11 (bagian ke-4): test otomatis Logic Torsi Sparepart

Konteks: mengerjakan item terakhir yang tersisa "BELUM DIKERJAKAN" di
`CATATAN-CEK-CLAUDE.md` — "Logic Torsi Sparepart (katalog 60+ spesifikasi
torsi Honda Vario 125, kalibrasi kunci torsi fisik MOLLAR MLR-B11950):
belum ada pengujian fungsional otomatis terhadap kalkulator ekstensi
(`Torsi.calcExt`) atau mode checklist servis." Item lain yg masih tersisa
("Evaluasi split `transaksi.js`") sengaja TIDAK dikerjakan di sesi ini krn
itu keputusan desain/refactor besar yang menurut `CLAUDE.md` sendiri
seharusnya dikonfirmasi dulu ke user, bukan ditebak — jadi dibiarkan
sebagai satu-satunya sisa item di `CATATAN-CEK-CLAUDE.md`.

`npm run check` (test+build; lint tidak bisa jalan di sandbox ini krn tidak
ada akses internet) sudah hijau sebelum sesi ini — jadi ini murni menambah
test yang sebelumnya nol utk modul `Torsi` (kalkulator torsi sparepart &
mode checklist servis di `features-budget-laporan-carnotes-pelanggan.js`),
TIDAK ada bug yang ditemukan/diperbaiki di kode aplikasinya.

**Test baru**: `tests/torsi-calc.test.js` (0 → 22 test, total suite
165 → 187). Cakupan:
- `Torsi.calcExt()` — rumus `setting = target × L ÷ (L + A)` (kalkulator
  ekstensi/sambungan batang kunci torsi), termasuk kasus L/A kosong &
  belum ada target (hasil disembunyikan, tidak dihitung), serta jalur mode
  manual (`this.mode==='manual'`) selain mode katalog.
- `Torsi.fmt()` — pembulatan 2 desimal & fallback `–` utk null/NaN.
- `Torsi.currentTargetNm()` — baca `this.selected.nm` di mode katalog vs
  baca input `trsManualTorsiInput` di mode manual.
- `Torsi.renderGaugeValues()` — konversi N·m → kgf·m/lbf·ft/lbf·in (angka
  konversi persis, mis. 98,0665 N·m = 10 kgf·m persis), badge catatan
  `'oli'`/`'new'`, & kasus nm null (semua nilai jadi `–`).
- `Torsi.setCalcMode()` — toggle class aktif tombol katalog/manual & show/
  hide panel input manual, termasuk auto-sync gauge saat pindah ke manual
  dgn input yg sudah terisi.
- `Torsi.itemKey()`, `Torsi.selectPart()` (part `noTorque` sengaja
  diabaikan, tidak ke-load ke kalkulator).
- Mode checklist servis: `Torsi.updateSummary()` (progres `done/count` &
  total biaya HANYA dari item yg tercentang), `Torsi.toggleCheck()` &
  `Torsi.updateBiaya()` (mutasi state + ikut `persist()` ke
  `D.torsiChecklist[curVehicleId]`, termasuk fallback biaya ke 0 kalau
  input invalid), `Torsi.setPageMode()` (toggle normal/checklist),
  `Torsi.loadPersisted()` (baca kembali state per kendaraan — kendaraan
  lain tidak ikut ketukar — & default aman kalau kendaraan belum pernah
  punya record).

Pola test: `loadSource()` me-load file source ASLI
(`features-budget-laporan-carnotes-pelanggan.js`, tempat modul `Torsi`
didefinisikan) ke sandbox vm, PLUS `createFakeDocument()` dari
`tests/helpers/fakeDom.js` (baca/tulis elemen DOM kalkulator yg
dipakai `Torsi.calcExt`/`renderGaugeValues` dst). Modul `Torsi` sengaja
TIDAK butuh `D`/`curVehicleId` sama sekali di method kalkulatornya (murni
`this.mode`/`this.selected`/DOM) — jadi file GROUP_A ini bisa di-load
SENDIRIAN tanpa `features-tukang-kendaraan-storage.js` (GROUP_B, penyedia
asli `TORSI_DB`/`findTorsiDb`/`MY_WRENCH_SCALE` saat runtime). Konstanta
lintas-bundle (`TORSI_NM_PER_KGF/LBFT/LBIN`, `MY_WRENCH_SCALE`) yang
aslinya baru didefinisikan belakangan di bundle B (tapi dipakai method
`Torsi` yg baru jalan setelah kedua bundle ter-load penuh di browser)
disuntikkan lewat `extraGlobals` — `MY_WRENCH_SCALE` dibangun ulang persis
rumus aslinya (bukan di-mock kosong) supaya `renderWrenchNote()` yang
otomatis terpanggil tiap `renderGaugeValues()` tidak crash. Cakupan
`computeCats()` (butuh `findTorsiDb` lintas-bundle) & `renderList()`/
`renderRow()` (murni string HTML) sengaja TIDAK dites di sini — test
checklist di atas menyuntik `Torsi.cats` manual dgn array kecil buatan
sendiri, fokus ke logika kalkulator/state, bukan re-verifikasi isi katalog
torsi (yang sudah "benar krn disalin dari buku manual resmi", bukan logika
yg bisa salah).

`npm test` → 187/187 pass, 0 fail. `node build.js` → sintaks bundle valid,
versi naik ke 147 (`kw80-merge-advisor-card-dashcards-22`). `npm run lint`
TIDAK bisa dijalankan di sesi ini krn sandbox tanpa akses internet —
tolong jalankan `npm run check` penuh (atau minimal `npm run lint`)
sebelum merge/release.

Dengan ini, semua item "BELUM DIKERJAKAN" di `CATATAN-CEK-CLAUDE.md` sudah
selesai KECUALI "Evaluasi split `transaksi.js`" yang memang butuh
konfirmasi desain dulu dari user sebelum dieksekusi.

## Catatan kerja — 2026-07-11 (bagian ke-5): split `transaksi.js` → `cicilan.js`

Konteks: user secara eksplisit meminta item terakhir yang tersisa di
`CATATAN-CEK-CLAUDE.md` ("Evaluasi split `transaksi.js`") dieksekusi —
ini keputusan desain/refactor besar yang sebelumnya sengaja ditahan
(lihat catatan bagian ke-3/ke-4 di atas) sampai ada konfirmasi user.

**Evaluasi:** `transaksi.js` sebelum split ≈1165 baris / 79+ fungsi —
file dengan risiko maintainability tertinggi menurut audit sebelumnya.
Dipilih memisahkan **logika form Cicilan** (paling mandiri & paling
gampang dikenali batasnya) ke `cicilan.js` baru:
`validateCicilanFields`, `calcCicilanPerBulanFromTotal`,
`calcCicilanTotalFromPerBulan`, `syncCicilanPreview`,
`getCicilanSharedMine`, `toggleCicilanSharedFields`, `syncCicilanDate`,
`openCicilanHistoryFromTx`. Bagian lain `transaksi.js` (BBM, stok
sparepart, stok/penjualan Cobek, transfer, target, dll) SENGAJA belum
dipisah di sesi ini — masing-masing area itu punya saling-ketergantungan
berbeda & butuh evaluasi terpisah supaya tidak jadi satu PR raksasa yang
susah di-review; cicilan dipilih duluan karena scope-nya paling jelas
(cuma dipakai lewat panel Cicilan di txModal + dipanggil balik dari
`_saveTxInner`/`editTx`/`setPayMethod`/`openTxModal` di transaksi.js).

**Kenapa aman dipindah (bukan cuma dipindah tanpa dicek):**
- Semua fungsi cicilan murni fungsi global (bukan namespace/module) —
  SAMA PERSIS sebelum & sesudah split, jadi tiap pemanggil (baik dari
  `transaksi.js` sendiri maupun dari atribut `data-action`/`onchange`/
  `oninput` di HTML `modals.js`) tidak perlu diubah sama sekali.
- Variabel state `cicilanLastInput`/`cicilanSharedLastInput`/
  `cicilanDateLinked` TETAP di `features-helpers-global-security.js`
  (tidak ikut dipindah) — file itu sudah dimuat lebih dulu di
  `build.js` sebelum `cicilan.js`/`transaksi.js`, jadi tidak ada
  masalah urutan load/referensi belum terdefinisi.
- `cicilan.js` didaftarkan di `GROUP_B` (`build.js`), tepat sebelum
  `transaksi.js` (posisi lama fungsi-fungsi ini) — build tetap satu
  bundle global, jadi tidak ada perubahan konsep module/namespace baru
  yang bisa bikin file lain (`worthit.js`, `modals.js`, dst) putus.
- Dicek referensi silang tiap fungsi cicilan ke SEMUA file source
  (`grep`) sebelum & sesudah pindah — tidak ada file lain yang
  meng-assume fungsi ini ada di `transaksi.js` secara spesifik (semua
  akses lewat nama fungsi global, bukan lewat isi file).
- `tests/tx-bbm-sync.test.js` (`loadSource(['transaksi.js'], ...)`)
  tetap hijau tanpa diubah — jalur yang dites sengaja "tunai" (bukan
  cicilan), dan pemanggilan `getCicilanSharedMine` di `_saveTxInner`
  ada di dalam cabang `curPayMethod==='cicilan'` yang tidak pernah
  tereksekusi di test itu, jadi tidak butuh `cicilan.js` ikut di-load.

**Hasil:** `transaksi.js` 1165 → 1070 baris, `cicilan.js` baru 112
baris (8 fungsi, semuanya dipindah verbatim — TIDAK ada perubahan
logika/perilaku, murni pengelompokan ulang file).

`npm test` → 187/187 pass, 0 fail (tidak ada test yang perlu diubah).
`node build.js` → sukses, sintaks kedua bundle valid, versi naik ke 148
(`kw80-merge-advisor-card-dashcards-23`). `npm run lint` TIDAK bisa
dijalankan di sesi ini krn sandbox tanpa akses internet (`npm install`/
`npx eslint` gagal 403) — tolong jalankan `npm run check` penuh (atau
minimal `npm run lint`) sebelum merge/release, supaya style file baru
`cicilan.js` ikut divalidasi terhadap `eslint.config.js`.

Sisa area besar `transaksi.js` (BBM, stok sparepart/Cobek, transfer,
target/tabungan, dll) belum dievaluasi untuk split lebih lanjut —
kalau mau dilanjutkan, sebaiknya satu area per sesi (sama seperti
pendekatan cicilan ini) supaya masing-masing tetap gampang di-review &
di-verifikasi lewat `npm run check`.

## Catatan kerja — 2026-07-11 (bagian ke-6): split `transaksi.js` → `tx-bbm.js`

Konteks: lanjutan sesi split `transaksi.js` (bagian ke-5), area kedua yang
dipisah adalah **panel sinkron BBM** pada form Transaksi — dipilih setelah
cicilan karena scope-nya juga jelas & sudah ada test yang mengunci
perilakunya (`tests/bbm-log.test.js`, `tests/tx-bbm-sync.test.js`).

**Fungsi yang dipindah** ke `tx-bbm.js` baru: `populateTxBbmVehicleSelect`,
`toggleTxBbmFields`, `syncTxBbmAmt`, `syncTxAmtToLiter`,
`syncTxAmtToLiterForce`, `recordBbmLog`, `applyTxBbmFromTx`. Semua tetap
fungsi global verbatim (tidak ada perubahan logika), dipanggil sama persis
dari `transaksi.js` (`updateTxVehiclePanels`, `editTx`, `openTxModal`,
`_saveTxInner`), dari HTML (`modals.js`, atribut `oninput`/`onchange`), dan
dari file lintas-bundle `features-budget-laporan-carnotes-pelanggan.js`
(`BBM._saveInner` memanggil `recordBbmLog`).

**Kenapa aman dipindah:**
- `recordBbmLog` dipanggil dari `features-budget-laporan-carnotes-pelanggan.js`
  (GROUP_A) walau kini didefinisikan di `tx-bbm.js` (GROUP_B, dimuat
  setelah GROUP_A) — ini AMAN karena pemanggilannya baru terjadi lazy saat
  user menyimpan form BBM (setelah kedua bundle sudah selesai di-load di
  browser), bukan saat file GROUP_A pertama kali di-parse.
- `tx-bbm.js` didaftarkan di `GROUP_B` (`build.js`) tepat sebelum
  `transaksi.js` (posisi lama fungsi-fungsi ini, setelah `cicilan.js`).
- Dicek referensi silang tiap fungsi ke SEMUA file source sebelum & sesudah
  pindah — tidak ada file lain yang meng-assume fungsi ini ada persis di
  `transaksi.js`.
- **2 file test yang sebelumnya `loadSource(['transaksi.js'])` diupdate**
  supaya ikut memuat `tx-bbm.js`:
  - `tests/bbm-log.test.js` — sekarang `loadSource(['tx-bbm.js'], ...)`
    (recordBbmLog pindah lokasi, tapi test-nya sendiri TIDAK berubah
    assersinya sama sekali, cuma path file sumber).
  - `tests/tx-bbm-sync.test.js` — sekarang
    `loadSource(['tx-bbm.js', 'transaksi.js'], ...)` supaya
    `applyTxBbmFromTx`/`recordBbmLog` yang dipanggil dari dalam
    `_saveTxInner` tetap terdefinisi di sandbox test yang sama.

**Hasil:** `transaksi.js` 1070 → 1000 baris, `tx-bbm.js` baru 92 baris (7
fungsi, dipindah verbatim).

`npm test` → 187/187 pass, 0 fail (2 file test disesuaikan path
`loadSource`, TIDAK ada assersi/skenario test yang diubah). `node build.js`
→ sukses, sintaks kedua bundle valid, versi naik ke 149
(`kw80-merge-advisor-card-dashcards-24`). `npm run lint` TIDAK bisa
dijalankan di sesi ini krn sandbox tanpa akses internet — tolong jalankan
`npm run check` penuh (atau minimal `npm run lint`) sebelum merge/release.

Sisa area `transaksi.js` yang belum dipisah: stok sparepart, stok/penjualan
Cobek, transfer antar akun, target/tabungan. Direkomendasikan tetap satu
area per sesi.

## Catatan kerja — 2026-07-11 (bagian ke-7): split `transaksi.js` → `tx-stok-sparepart.js`

Konteks: lanjutan sesi split `transaksi.js` (bagian ke-5/ke-6), area ketiga
yang dipisah adalah **panel "Tambah ke Stok Sparepart juga?"** pada form
Transaksi.

**Fungsi yang dipindah** ke `tx-stok-sparepart.js` baru:
`populateTxStockSelect`, `onTxStockItemChange`, `toggleTxStockFields`,
`applyTxStockFromTx`. Semua tetap fungsi global verbatim, dipanggil sama
persis dari `transaksi.js` (`updateTxVehiclePanels`, `_saveTxInner` — 3
titik panggil `applyTxStockFromTx` di jalur cicilan/langganan/tunai), dari
HTML (`modals.js`), dan dari `scan-ocr.js` (auto-centang panel stok saat
hasil scan struk terdeteksi sparepart).

**Kenapa aman dipindah:**
- Tidak ada test yang sebelumnya memanggil fungsi-fungsi ini langsung, TAPI
  `applyTxStockFromTx` dipanggil TANPA SYARAT di dalam `_saveTxInner`
  (baru early-return di dalam fungsinya sendiri kalau checkbox mati) —
  jadi `tests/tx-bbm-sync.test.js` (yang menjalankan `_saveTxInner` penuh)
  akan **ReferenceError** kalau `tx-stok-sparepart.js` tidak ikut di-load.
  Diupdate: `loadSource(['tx-bbm.js', 'tx-stok-sparepart.js',
  'transaksi.js'], ...)`. Skenario/assersi test itu sendiri TIDAK berubah
  (checkbox stok tetap `false` di semua kasusnya, jadi
  `applyTxStockFromTx` tetap early-return seperti sebelumnya — cuma
  memastikan fungsinya ADA/terdefinisi di sandbox).
- `tx-stok-sparepart.js` didaftarkan di `GROUP_B` (`build.js`) tepat
  sebelum `transaksi.js` (setelah `cicilan.js`, `tx-bbm.js`).
- `scan-ocr.js` (juga GROUP_B, dimuat lebih dulu di `build.js` daripada
  `tx-stok-sparepart.js`) memanggil `onTxStockItemChange`/
  `toggleTxStockFields` secara lazy (dalam handler hasil scan, bukan saat
  file di-parse) — aman terlepas dari urutan definisi.

**Hasil:** `transaksi.js` 1000 → 943 baris, `tx-stok-sparepart.js` baru 72
baris (4 fungsi, dipindah verbatim).

`npm test` → 187/187 pass, 0 fail (1 file test disesuaikan path
`loadSource`). `node build.js` → sukses, sintaks kedua bundle valid, versi
naik ke 150 (`kw80-merge-advisor-card-dashcards-25`). `npm run lint` TIDAK
bisa dijalankan di sesi ini krn sandbox tanpa akses internet — tolong
jalankan `npm run check` penuh sebelum merge/release.

Sisa area `transaksi.js` yang belum dipisah: stok/penjualan Cobek, transfer
antar akun, target/tabungan. Direkomendasikan tetap satu area per sesi.

## Catatan kerja — 2026-07-11 (bagian ke-8): split `transaksi.js` → `tx-transfer.js`

Konteks: lanjutan sesi split `transaksi.js` (bagian ke-5/6/7), area keempat
yang dipisah adalah **modal "⇄ Transfer Antar Akun"** (`transferModal`) —
dipilih karena scope-nya paling kecil & paling berdiri sendiri dari sisa
area yang belum dipecah (stok/penjualan Cobek, target/tabungan), jadi
risiko regresinya paling rendah.

**Fungsi yang dipindah** ke `tx-transfer.js` baru: `openTransferModal`,
`saveTransfer`. Keduanya tetap fungsi global verbatim (tidak ada perubahan
logika), dipanggil sama persis dari HTML (`modals.js`, atribut
`data-action="openTransferModal"` / `data-action="saveTransfer"`).

**Kenapa aman dipindah:**
- Tidak ada file source lain (`grep` menyeluruh) maupun test yang memanggil
  `openTransferModal`/`saveTransfer` — keduanya hanya dipanggil dari
  `data-action` di HTML, jadi tidak ada referensi langsung ke isi
  `transaksi.js` yang perlu disesuaikan.
- `tx-transfer.js` didaftarkan di `GROUP_B` (`build.js`) tepat setelah
  `tx-stok-sparepart.js` dan sebelum `transaksi.js` (posisi lama fungsi
  ini) — build tetap satu bundle global, urutan load tidak berubah utk
  modul lain.
- Tidak ada test yang perlu diupdate (tidak ada file test yang
  `loadSource(['transaksi.js'])` lalu memanggil salah satu dari 2 fungsi
  ini secara langsung).

**Hasil:** `transaksi.js` 943 → 924 baris, `tx-transfer.js` baru 32 baris (2
fungsi, dipindah verbatim, disisakan komentar penunjuk di lokasi lama).

`npm test` → 187/187 pass, 0 fail (tidak ada file test yang perlu diubah).
`node build.js` → sukses, sintaks kedua bundle valid (`node --check`),
lint bawaan `build.js` (u-dnone vs style.display, escapeHtml, chicken-egg
Tesseract) lolos tanpa temuan, versi naik ke 151
(`kw80-merge-advisor-card-dashcards-26`). Dicek manual: `openTransferModal`
& `saveTransfer` masing-masing cuma muncul 1x di source (`tx-transfer.js`)
& 1x di `app-bundle-b.min.js` (0x di `app-bundle-a.min.js`). `npm run lint`
TIDAK bisa dijalankan di sesi ini krn sandbox tanpa akses internet
(`npm install`/`npx eslint` gagal 403 Forbidden) — tolong jalankan
`npm run check` penuh (atau minimal `npm run lint`) sebelum merge/release.

Sisa area `transaksi.js` yang belum dipisah: stok/penjualan Cobek,
target/tabungan (`openTargetModal`, `onTargetAccChange`,
`onTargetDanaDaruratToggle`, `saveTarget`, `showTargetAccountTx`, dan
helper terkait `changeMonth`/`getTxListRange`/dst kalau mau dipisah jadi
domain "List Transaksi & Cashflow Forecast" tersendiri). Direkomendasikan
tetap satu area per sesi, dan **WAJIB** coba manual di browser (`?dev=1`):
buka form Transaksi → Transfer Antar Akun, isi & simpan transfer antar 2
akun, pastikan saldo kedua akun berubah dengan benar & muncul di riwayat
Keuangan — sandbox ini tidak punya browser jadi belum bisa diverifikasi
visual, hanya lolos cek sintaks & unit test.

## Catatan kerja — 2026-07-11 (bagian ke-9): split `transaksi.js` → `tx-cobek.js` + `tx-target.js`

Konteks: lanjutan sesi split `transaksi.js` (bagian ke-5/6/7/8), diminta
kerjakan dua area sisa sekaligus dalam satu sesi: **stok/penjualan Cobek**
dan **target/tabungan**.

**Temuan penting soal area Cobek:** berbeda dari BBM/Stok Sparepart, fungsi
panel form Cobek (`populateTxCobekStockSelect`, `onTxCobekStockItemChange`,
`toggleTxCobekStockFields`, `resetCobekStockCart`, `applyTxCobekStockFromTx`,
`populateTxCobekSaleSelect`, `onTxCobekSaleItemChange`,
`toggleTxCobekSaleFields`, `resetTxCobekSaleCart`, `applyTxCobekSaleFromTx`,
dst) **SUDAH ada di `cobek.js` sejak awal**, bukan hasil split sesi ini —
`transaksi.js` cuma memanggilnya. Satu-satunya bagian domain Cobek yang
murni tersisa di source `transaksi.js` adalah detektor
`isCobekStockCatName(catName,subName)` (dipakai `updateTxVehiclePanels()`
utk menentukan kapan panel Stok/Penjualan Cobek muncul) — jadi itu satu2nya
yang dipindah.

**Fungsi yang dipindah ke `tx-cobek.js` baru:** `isCobekStockCatName`.

**Fungsi yang dipindah ke `tx-target.js` baru:** `openTargetModal`,
`onTargetAccChange`, `onTargetDanaDaruratToggle`, `saveTarget`,
`showTargetAccountTx`, `addTarget`, `delTarget`. Fungsi domain lain yang
kebetulan tergabung historis di lokasi yang sama (`toggleMs`/milestone,
`delReminder`/pengingat, `saveCatatan`/`saveReminder`/`saveLDR`) **TIDAK**
ikut dipindah — beda domain, sengaja dibiarkan di `transaksi.js`.

**Kenapa aman dipindah:**
- Semua fungsi tetap global verbatim (tidak ada perubahan logika sama
  sekali), dipanggil sama persis dari HTML (`modals.js`, atribut
  `onchange`/`data-action`) dan dari `modules-render.js` (tombol
  `showTargetAccountTx`/`addTarget`/`delTarget` di kartu Target Pengaturan).
- `openTargetModal`/`onTargetDanaDaruratToggle` juga dipanggil lintas-bundle
  dari `modules-calc.js` & `aset.js` (banner "belum ada Dana Darurat") — ini
  AMAN karena panggilannya lazy (event klik), bukan saat file di-parse.
- `grep` menyeluruh: tidak ada file test yang `loadSource` lalu memanggil
  salah satu dari fungsi-fungsi ini secara langsung — **tidak ada file test
  yang perlu diubah** sama sekali di sesi ini.
- `tx-cobek.js` & `tx-target.js` didaftarkan di `GROUP_B` (`build.js`) tepat
  setelah `tx-transfer.js` dan sebelum `transaksi.js` (posisi lama fungsi
  ini) — urutan load modul lain tidak berubah.

**Hasil:** `transaksi.js` 924 → 864 baris, `tx-cobek.js` baru 28 baris (1
fungsi), `tx-target.js` baru 67 baris (7 fungsi), semua dipindah verbatim.

`npm test` → 187/187 pass, 0 fail (tidak ada file test yang perlu diubah
sama sekali). `node build.js` → sukses, sintaks kedua bundle valid (`node
--check`), lint bawaan `build.js` (u-dnone vs style.display, escapeHtml,
chicken-egg Tesseract) lolos tanpa temuan, versi naik ke 152
(`kw80-merge-advisor-card-dashcards-27`). Dicek manual: tiap fungsi yang
dipindah muncul tepat 1x di source & hanya di `app-bundle-b.min.js` (0x di
`app-bundle-a.min.js`). `npm run lint` TIDAK bisa dijalankan di sesi ini krn
sandbox tanpa akses internet (`npm install`/`npx eslint` gagal) — tolong
jalankan `npm run check` penuh (atau minimal `npm run lint`) sebelum
merge/release.

**Sisa area `transaksi.js` yang belum dipisah:** transfer antar akun
sudah selesai (bagian ke-8), stok/Cobek & target/tabungan selesai di sesi
ini — domain besar yang tersisa hanyalah **"List Transaksi & Cashflow
Forecast"** (`changeMonth`, `setTxListPeriode`, `getTxListRange`,
`setPeriode`, `getRange`, `computeCashflowForecast`, `txHTML`, `delTx`,
`setKeuanganTab`) kalau memang mau dipecah jadi file tersendiri — scope-nya
lebih besar & lebih tersebar (dipakai banyak render function), jadi
disarankan direview dulu cross-reference-nya sebelum dieksekusi, sesi
terpisah. **WAJIB** coba manual di browser (`?dev=1`) untuk kedua area yang
baru dipindah sesi ini: (1) buka form Transaksi dengan kategori bernama
"Cobek"/"Shop", pastikan panel Stok/Penjualan Cobek tetap muncul & bisa
disimpan; (2) buka Pengaturan → Target, tambah target baru (dgn & tanpa
centang Dana Darurat, dgn & tanpa akun terkait), edit progres tabungan,
lihat transaksi akun terkait — sandbox ini tidak punya browser jadi belum
bisa diverifikasi visual, hanya lolos cek sintaks & unit test.

## Catatan kerja — 2026-07-11 (bagian ke-10): verifikasi browser split `tx-cobek.js` + `tx-target.js`

Lanjutan langsung bagian ke-9 di atas — sesi itu menutup dengan catatan
"WAJIB coba manual di browser" karena sandbox saat itu tidak punya
Chrome/Playwright. Sesi ini ternyata punya akses Chrome cache Puppeteer
(`/home/claude/.cache/puppeteer/chrome/linux-131.0.6778.204/...`) dan
Playwright terpasang global, jadi kedua skenario itu langsung dijalankan
nyata (bukan mock, bukan cuma baca kode). **Tidak ada perubahan kode di
sesi ini — murni verifikasi.**

- `isCobekStockCatName`: dites pakai kategori Cobek asli di data
  (`Bisnis › Cobek`, id `sub_cb_cobek`) → `true`. Dites nama kategori/sub
  yang tidak nyambung sama sekali → `false`. Dites skenario intinya —
  rename total nama kategori & sub (mis. jadi "Bisnis Kios Renovasi" /
  "Peralatan Rumah Tangga") tanpa ganti id → tetap `true` lewat fallback
  id `sub_cb_cobek`/`sub_cbb_cobek`. Ini membuktikan fallback rename-proof
  yang jadi alasan fungsi ini ditulis memang betul jalan.
- Semua 7 fungsi `tx-target.js` (`openTargetModal`, `onTargetAccChange`,
  `onTargetDanaDaruratToggle`, `saveTarget`, `showTargetAccountTx`,
  `addTarget`, `delTarget`) ke-expose ke `window` (`typeof === 'function'`).
  Alur nyata: buka modal → isi nama & nominal → `saveTarget()` → 1 target
  baru masuk `D.targets` dengan field benar → toggle Dana Darurat memicu
  hint rekomendasi (angka & teks masuk akal) → `delTarget()` menghapus
  bersih dari array tanpa nyisa.
- 0 `pageerror` di console selama semua skenario di atas. Smoke-test
  internal tetap `✅ OK — 992 referensi getElementById() & 55 data-action
  semuanya valid`. `npm test` → 187/187 pass. `node build.js` → sukses,
  versi naik ke 153.

**Kesimpulan: tidak ada kekurangan (fungsi hilang/nyangkut) maupun
kelebihan (duplikat/sisa deklarasi ganda) di split `tx-cobek.js` +
`tx-target.js`.** File split ini sudah tuntas & terverifikasi penuh
(sintaks, unit test, DAN browser). Area split yang masih tersisa dari
`transaksi.js` tetap sama seperti disebut di bagian ke-9: **"List
Transaksi & Cashflow Forecast"** (`changeMonth`, `setTxListPeriode`,
`getTxListRange`, `setPeriode`, `getRange`, `computeCashflowForecast`,
`txHTML`, `delTx`, `setKeuanganTab`) — scope-nya lebih besar & lebih
tersebar dipakai banyak render function, jadi tetap disarankan sesi
terpisah dengan review cross-reference dulu sebelum eksekusi.

## Catatan kerja — 2026-07-11 (bagian ke-11): split `transaksi.js` → `tx-list-cashflow.js`

Konteks: eksekusi area terakhir yang disebut belum dipisah di bagian ke-9/
ke-10 — **"List Transaksi & Cashflow Forecast"**. Atas permintaan eksplisit
user ("jalankan pisah list transaksi").

**Fungsi yang dipindah ke `tx-list-cashflow.js` baru (9 fungsi + 1
variabel state):** `txHTML`, `delTx`, `changeMonth`, `txListPeriode` (let),
`setTxListPeriode`, `getTxListRange`, `setPeriode`, `getRange`,
`computeCashflowForecast`, `setKeuanganTab`. Semua dipindah verbatim, tidak
ada perubahan logika.

**Yang SENGAJA TIDAK ikut dipindah** (dipakai modul lain sejak sebelum
sesi ini, tetap di tempat asal): `curMonth`/`curYear` (deklarasi asli di
`features-helpers-global-security.js`), `txListPage`
(`filter-laporan.js`), `filterPeriode` (`features-helpers-global-security.js`),
`resetTxPageAndRender` (`filter-laporan.js`). Hanya `txListPeriode` yang
ikut pindah karena murni lokal punya `transaksi.js` & cuma dipakai bareng
`setTxListPeriode`/`getTxListRange`.

**Kenapa aman dipindah:**
- Semua fungsi tetap global verbatim, dipanggil sama persis dari HTML
  (`app_production.html`/`index.html`: `onclick="changeMonth(...)"`,
  `setTxListPeriode`, `setPeriode`, `setKeuanganTab`), dari
  `modules-render.js` (`renderKeuangan`/`renderLaporan`/
  `renderCashflowForecast` masing2 makai `getTxListRange`/`getRange`/
  `computeCashflowForecast`), dari `backup-restore.js` & `cobek.js`
  (`getRange`/`txHTML`/`computeCashflowForecast` utk ekspor & kartu shop),
  dan `features-sheets-pwa-selftest.js` (self-test makai `setKeuanganTab`).
- `deleteTxFromModal()` (tetap di `transaksi.js`) memanggil `delTx(id)` —
  aman karena deklarasi fungsi di-hoist di seluruh scope bundle gabungan,
  tidak tergantung urutan file selama satu bundle (sama seperti pola sesi
  sebelumnya).
- `grep` menyeluruh test suite: tidak ada test yang `loadSource` lalu
  memanggil salah satu dari 9 fungsi ini secara langsung — **tidak ada
  file test yang perlu diubah** sama sekali di sesi ini.
- `tx-list-cashflow.js` didaftarkan di `GROUP_B` (`build.js`) tepat
  setelah `tx-target.js` dan sebelum `transaksi.js` (posisi lama fungsi
  ini) — urutan load modul lain tidak berubah.

**Hasil:** `transaksi.js` 864 → 729 baris, `tx-list-cashflow.js` baru 159
baris (9 fungsi + 1 var). `npm test` → 187/187 pass, 0 fail (tidak ada
file test yang perlu diubah). `node build.js` → sukses, sintaks kedua
bundle valid, versi naik ke 154.

**Diverifikasi lewat browser nyata (Playwright + Chrome headless), bukan
cuma baca kode:**
- Semua 9 fungsi + `txListPeriode` ke-expose ke `window`.
- `changeMonth(-1)` → `curMonth`/`curYear` berubah benar (lintas tahun
  baru dites implisit lewat logic wrap month 0-11).
- `getTxListRange()` & `getRange()` mengembalikan objek `{from,to}` dengan
  `Date` valid.
- `computeCashflowForecast()` jalan tanpa error, field lengkap
  (`incAvg`/`expAvg`/`saldoNow`/`billsDue`/`upcoming`/`projected`).
- `txHTML(t)` dites dgn data transaksi contoh → HTML keluar benar, ada
  `data-action="editTx"` & `data-action="delTx"` dgn `data-args` ter-escape
  rapi.
- `setKeuanganTab('laporan')` → panel Laporan kebuka, `setKeuanganTab('kelola')`
  → balik ke panel Kelola, keduanya tanpa error.
- `delTx()` dites end-to-end: tambah transaksi dummy → hapus →
  `D.transactions` balik ke jumlah semula, tanpa nyisa.
- Smoke-test internal tetap `✅ OK — 992 referensi getElementById() & 55
  data-action semuanya valid`. 0 `pageerror` di seluruh skenario di atas.

**Kesimpulan: split ke-11 (List Transaksi & Cashflow Forecast) bersih,
tidak ada kekurangan (fungsi hilang/nyangkut) maupun kelebihan (duplikat/
sisa deklarasi ganda).** Dengan ini, **seluruh area besar dari roadmap
split `transaksi.js` (bagian ke-5 s/d ke-11) sudah tuntas** — `transaksi.js`
kini isinya murni form Tambah/Edit Transaksi (`setTxType`, autocomplete
kategori/produk, `updateTxVehiclePanels`, `openTxModal`/`editTx`/`saveTx`/
`_saveTxInner`) + beberapa fungsi kecil lintas-domain (`saveCatatan`,
`saveReminder`, `saveLDR`, `toggleMs`, `delReminder`) yang sengaja
dibiarkan gabung karena skalanya kecil & tidak cukup besar utk jadi file
sendiri.

## Catatan kerja — 2026-07-11 (bagian ke-12): housekeeping dokumentasi + `FILE-MAP.md` otomatis

Konteks: user tanya "apa yang belum dikerjakan" & minta saran supaya sesi
AI berikutnya tidak kebingungan cari file. 3 perbaikan, atas persetujuan
eksplisit user:

**1. Beresin `CATATAN-CEK-CLAUDE.md`:** 2 item ("Sinkronisasi BBM ↔
Transaksi ↔ Car Notes", "Logic Torsi Sparepart") sudah ditandai ✅ tapi
kesasar nangkring di bagian "BELUM DIKERJAKAN" (harusnya di "SUDAH
SELESAI" sesuai aturan file itu sendiri). Dipindah ke tempat yang benar,
"BELUM DIKERJAKAN" sekarang kosong (tidak ada item pending).

**2. Arsipkan `PEMISAHAN-FILE-ROADMAP.md` (2170 baris) — sudah basi
total.** Dokumen ini nyebut file (`features-etalase-piutang-renovai.js`,
`features-gaji-cobek-tagihan.js`, `features-renovasi-pajak-aset-order.js`,
dst) sebagai "belum dipecah" padahal file-file itu **sudah tidak ada** —
sudah dipecah jadi `cobek.js`/`aset.js`/`piutang-utang.js`/`renovasi.js`/
`gaji-calc.js`/`tagihan-kalender.js`/`akun.js`/`kategori.js`/dll di
sesi-sesi lain yang tidak balik update dokumen ini. Dipindah ke
`archive/PEMISAHAN-FILE-ROADMAP.md.OBSOLETE-2026-07-11.md` dengan header
peringatan besar di atasnya (bukan dihapus total — riwayat tetap ada,
cuma dikeluarkan dari jalur baca utama). `eslint.config.js` (`ignores`)
diupdate dari nama file spesifik jadi `archive/**` (lebih tahan lama,
otomatis nutupin apapun yang taruh di situ nanti).

**3. `FILE-MAP.md` — peta file & fungsi global auto-generated (perbaikan
utama).** Script baru `scripts/generate-file-map.js`, reuse
`getAllSourceFiles()`/`collectFromFile()` dari `scripts/collect-app-globals.js`
yang sudah ada (jadi cuma 1 implementasi parser top-level declaration,
tidak dobel). Kedua fungsi itu diexport tambahan dari
`collect-app-globals.js` (perubahan aditif, tidak mengubah perilaku
lama). Output `FILE-MAP.md` di root, 2 bagian:
  - Tabel file berurutan sesuai `GROUP_A`+`GROUP_B` (urutan load asli),
    tiap baris: jumlah baris + ringkasan 1-2 kalimat diekstrak otomatis
    dari komentar header file (`// nama-file.js — deskripsi...` yang
    memang sudah konsisten ditulis di kebanyakan file).
  - Index abjad semua identifier top-level (`function`/`const`/`let`/`var`)
    → nama file tempatnya dideklarasikan (852 identifier, 50 file per
    hitungan sesi ini).
  Dipanggil OTOMATIS di akhir `build.js` (setelah pesan "Build ... selesai
  & lolos cek sintaks", dibungkus try/catch supaya kegagalan generate
  peta TIDAK menggagalkan build produksi — cuma warning). Jadi peta ini
  selalu fresh tanpa langkah manual tambahan, sepanjang kebiasaan "jalankan
  `node build.js` tiap habis ubah source" (yang memang sudah jadi pola
  baku tiap sesi) tetap dijalankan.

**Kenapa ini lebih baik dari dokumen prosa manual:** peta yang
di-generate dari source tidak bisa basi seperti
`PEMISAHAN-FILE-ROADMAP.md` — kalau source berubah, generate ulang
otomatis ikut berubah. Sesi Claude berikutnya (atau manusia) tinggal
`grep nama_fungsi FILE-MAP.md` buat tahu ada di file mana, jauh lebih
cepat & akurat daripada `grep -rn` manual ke puluhan file source.

**Diverifikasi:**
- `node --check` lolos di `scripts/generate-file-map.js`, `build.js`,
  `scripts/collect-app-globals.js`.
- `node build.js` → sukses, `FILE-MAP.md` ke-generate ulang otomatis di
  akhir, versi naik ke 155. Isi dicek manual: fungsi hasil split
  bagian ke-9/ke-11 (`isCobekStockCatName`→`tx-cobek.js`,
  `openTargetModal`→`tx-target.js`, `txHTML`/`setKeuanganTab`/
  `computeCashflowForecast`→`tx-list-cashflow.js`) muncul benar.
- `npm test` → 187/187 pass, 0 fail.
- Smoke-test browser (Playwright + Chrome headless): `✅ OK — 992
  referensi getElementById() & 55 data-action semuanya valid`, 0
  `pageerror`. (Perubahan sesi ini murni tooling/dokumentasi + `build.js`,
  tidak menyentuh kode runtime app sama sekali, jadi risiko regresi UI
  nol — smoke-test cuma buat mastiin build.js yang diedit tidak
  merusak proses build/bundling.)
- `npm run lint`/`npx eslint` TIDAK bisa dites di sesi ini (sandbox tanpa
  internet, `npm install`/`npx eslint` gagal 403) — sama seperti
  keterbatasan sesi-sesi sebelumnya, tolong jalankan `npm run lint`
  sebelum merge/release utk mastiin `eslint.config.js` yang diedit
  (`ignores: 'archive/**'`) valid.

**Untuk sesi berikutnya:** kalau nambah/pindah/hapus file source lagi,
TIDAK perlu update dokumen manapun secara manual soal "file ini isinya
apa" — cukup pastikan `node build.js` dijalankan sampai selesai (sudah
kebiasaan baku), `FILE-MAP.md` otomatis ikut sinkron. Kalau perlu cari
sebuah fungsi/variabel global, cek `FILE-MAP.md` bagian 2 dulu sebelum
`grep -rn` manual.

## Catatan kerja — 2026-07-11 (bagian ke-13): validasi `eslint.config.js` manual + audit cakupan test

Konteks: user minta cek apakah `eslint.config.js` yang diedit sesi
sebelumnya valid (tanpa bisa `npm install` di sandbox ini), lalu minta
audit apakah `tests/*.test.js` sudah mencakup semua fitur/modul.

**1. Validasi `eslint.config.js` tanpa eslint asli (sandbox tetap tanpa
internet — `npm install` gagal 403 ke registry.npmjs.org, konsisten
dengan keterbatasan sesi-sesi sebelumnya):**
- `node --check eslint.config.js` & `node --check
  scripts/collect-app-globals.js` — syntax OK.
- `require('./eslint.config.js')` dieksekusi manual → 3 config block,
  struktur key sesuai schema flat config ESLint v9 (`ignores` /
  `files+languageOptions+rules` / `files+languageOptions`).
- `collectAppGlobals()` jalan tanpa error → 852 global app-specific +
  51 global browser = 903 total; semua value (`readonly`/`writable`)
  & semua key (nama identifier JS) valid — 0 invalid.
- **BELUM tervalidasi** (butuh eslint asli, tidak bisa disimulasikan):
  hasil lint SEBENARNYA (`no-undef`, `no-unused-vars`, dll) di seluruh
  source. Wajib jalankan `npm install && npm run lint` di mesin lokal
  (Node ≥20) sebelum merge/release.

**2. Audit cakupan `tests/*.test.js` (dijalankan pakai `node --test`
bawaan Node, tidak butuh `npm install`) → 187/187 pass, 0 fail, tapi
cakupan modul TIDAK lengkap.**

Modul yang SUDAH ada unit test (13 dari ~48 file fitur): `tx-bbm.js`,
`tx-stok-sparepart.js`, `transaksi.js`,
`features-budget-laporan-carnotes-pelanggan.js`,
`features-tukang-kendaraan-storage.js`, `modules-calc.js`,
`format-tema.js`, `gaji-calc.js`, `helper-teks.js`, `data-default.js`,
`features-helpers-global-security.js`, `pajak-pbb-zakat.js`,
`scan-ocr.js`. `modules-render.js` cuma dicek statis (registry check di
`dash-card-registry.test.js`, bukan logic test). `smoke-test.js`
structural check di browser (dev mode) — cek DOM id & window exposure,
bukan logic bisnis.

**Modul TANPA unit test sama sekali (~30+ file), 2 paling prioritas:**
- **`keamanan-pin.js`** — logic enkripsi PIN (PBKDF2+AES-GCM), paling
  security-sensitive di seluruh app, nol test.
- **`refleksi-selfcare.js`** — modul baru yang lagi aktif dikembangkan
  (gratitude journal, streak self-care, catatan PIN-encrypted), nol test.

Sisanya juga tanpa test: `akun.js`, `aset.js`, `cicilan.js`, `cobek.js`,
`piutang-utang.js`, `tx-target.js`, `tx-transfer.js`, `tx-cobek.js`,
`tx-list-cashflow.js`, `backup-restore.js`, `payroll-absensi.js`,
`kasir.js`, `sewakios.js`, `renovasi.js`, `worthit.js`,
`tagihan-kalender.js`, `reset-gaji-mingguan.js`, `modals.js`,
`modal-navigasi.js`, `onboarding.js`, `profil-pengaturan.js`,
`kategori.js`, `kategorisasi-ai.js`, `linktx.js`, `kalkulator-input.js`,
`filter-laporan.js`, `hidup-seimbang.js`, `edukasi-dana.js`,
`diagnostik-versi.js`, `debug-console.js`, `error-handler.js`,
`features-aiwidget-reminder-gdrive-search.js`,
`features-sheets-pwa-selftest.js`.

**Saran untuk sesi berikutnya:** prioritaskan test buat `keamanan-pin.js`
(enkripsi/dekripsi PIN, forgot-PIN flow, edge case PIN salah) dan
`refleksi-selfcare.js` (streak logic, gratitude entry CRUD, PIN-encrypted
notes) dulu sebelum modul lain — keduanya security/data-integrity
sensitive dan `refleksi-selfcare.js` masih aktif berubah. File
`PRE-MERGE-LINT-CHECK.md` (baru, root) dibuat sebagai pengingat cepat
command yang harus dijalankan sebelum merge: `npm install && npm run
lint` (dan opsional `npm run check` buat lint+test+build sekaligus).

**Diverifikasi:**
- `node --check` lolos untuk `eslint.config.js` &
  `scripts/collect-app-globals.js`.
- `require('./eslint.config.js')` + `collectAppGlobals()` dieksekusi
  manual tanpa error, hasil di atas.
- `node --test tests/*.test.js` → 187/187 pass, 0 fail (tidak ada
  perubahan kode dilakukan sesi ini, murni audit + dokumentasi).
- `npm run lint`/`npx eslint` TIDAK bisa dites di sesi ini (sandbox tanpa
  internet) — sama seperti sebelumnya, tolong jalankan di lokal sebelum
  merge.

## Catatan kerja — 2026-07-11 (bagian ke-14): test buat bagian RINGAN `refleksi-selfcare.js`

Konteks: lanjutan bagian ke-13 (audit cakupan test), user minta "kerjakan
saran yg ringan dulu" — dari 2 modul prioritas tanpa test
(`keamanan-pin.js`, `refleksi-selfcare.js`), dipilih mengerjakan bagian
yang PALING RINGAN dulu: logic murni (tanpa kripto) di
`refleksi-selfcare.js`, bukan `keamanan-pin.js` (lebih berat karena butuh
mock Web Crypto/PBKDF2+AES-GCM async).

**File baru: `tests/refleksi-selfcare.test.js` (16 test, semua pass).**
Cakupan SENGAJA dibatasi ke bagian ringan:
- `Refleksi.computeStreak()` — pure logic (6 test): streak 0 hari,
  streak lanjut walau hari ini belum dicentang ("grace" utk hari
  berjalan), streak putus kalau kemarin JUGA belum dicentang, streak 5
  hari berturut-turut, array kosong dihitung sama dgn tidak checklist.
- `SelfCareReko.compute()` — widget rekomendasi (3 test): `ready:false`
  kalau data <5 hari, item "weakest" terdeteksi benar, `gratitudeCount`
  cuma hitung catatan DALAM window 14 hari.
- Jurnal Syukur `addGratitude`/`deleteGratitude` (4 test, pakai fakeDom):
  teks kosong ditolak, teks valid tersimpan & input dikosongkan,
  batal/konfirmasi hapus.
- Checklist `toggleSelfCare` (3 test, pakai fakeDom): toggle
  nyala/mati, key hari itu dihapus total dari `selfCareLog` saat item
  terakhir di-uncheck (bukan disisakan array kosong).

**SENGAJA belum dicakup** (lebih berat, disisakan utk sesi lanjutan):
bagian "Catatan Privat" (`addNote`/`toggleNoteView`/`deleteNote`) —
butuh mock `encryptApiKeyWithPin`/`decryptApiKeyWithPin`/
`_sessionRawPin` (skema kripto sama dgn `keamanan-pin.js`). Test buat
`keamanan-pin.js` sendiri juga masih kosong — itu jadi PR berikutnya yg
lebih berat (async Web Crypto).

**2 jebakan yang ketemu & diperbaiki selama nulis test ini (dicatat biar
sesi berikutnya tidak mengulang):**
1. Array yang lahir dari `push()` DI DALAM vm context (lewat
   `loadSource()`) constructor-nya beda realm dgn `Array` host walau
   `Array.isArray()`/isinya identik — `assert.deepEqual` (alias
   `deepStrictEqual` di mode `'assert/strict'`) gagal walau isi sama
   persis. Solusi: bungkus `Array.from(...)` dulu sebelum
   `assert.deepEqual`.
2. `createFakeDocument(initial)` MEMBUAT elemen fake baru lalu
   `Object.assign` nilai `initial` ke situ — BUKAN reuse referensi objek
   yg dioper. Jadi kalau mau baca nilai akhir suatu field (mis. `value`)
   setelah dipanggil kode yang dites, harus baca lewat
   `fakeDocument.getElementById(id)`, bukan variabel lokal yang tadinya
   dioper sbg initial value (itu tetap objek terpisah, tidak ikut
   berubah).

**Diverifikasi:**
- `node --check tests/refleksi-selfcare.test.js` — syntax OK.
- `node --test tests/*.test.js` → **203/203 pass, 0 fail** (naik dari
  187 sebelum sesi ini, +16 test baru, 0 regresi ke test lama).
- `npm run lint`/`npx eslint` masih TIDAK bisa dites di sesi ini
  (sandbox tanpa internet) — tolong jalankan `npm run lint` di lokal
  sebelum merge, terutama karena ada file baru (`tests/refleksi-selfcare.test.js`).

**Untuk sesi berikutnya:** modul tanpa test yang masih tersisa (lihat
bagian ke-13 utk daftar lengkap). Kalau lanjut ke bagian "berat" dari
`refleksi-selfcare.js` (catatan privat) atau ke `keamanan-pin.js`
langsung, siapkan dulu mock untuk `crypto.subtle`
(`importKey`/`deriveKey`/`encrypt`/`decrypt` — Node punya
`require('node:crypto').webcrypto` yang API-compatible, bisa dipakai
langsung sbg `crypto` global di `loadSource()` tanpa perlu mock manual).

## Catatan kerja — 2026-07-11 (bagian ke-15): test "Catatan Privat" (kripto asli, tanpa mock)

Konteks: lanjutan bagian ke-14, user minta lanjut ke bagian "berat" yang
disisakan — Catatan Privat terenkripsi di `refleksi-selfcare.js`.

**File baru: `tests/refleksi-catatan-privat.test.js` (9 test, semua
pass).** Kunci teknis: Node 22 punya `globalThis.crypto` (Web Crypto
ASLI) + `TextEncoder`/`TextDecoder`/`atob`/`btoa` built-in — jadi
`keamanan-pin.js` (sumber `encryptApiKeyWithPin`/`decryptApiKeyWithPin`)
di-load APA ADANYA tanpa mock kripto sama sekali. Round-trip
enkripsi→dekripsi di test ini BENERAN jalan (PBKDF2 100rb iterasi +
AES-GCM), bukan stub yang pura-pura berhasil. Ini sekaligus jadi test
PERTAMA yang menyentuh `encryptApiKeyWithPin`/`decryptApiKeyWithPin` —
belum ada test khusus buat `keamanan-pin.js` sendiri (PIN screen,
lockout, `gantiPin`, migrasi skema lama→baru — itu jadi PR terpisah,
lihat "untuk sesi berikutnya" di bawah).

Cakupan test:
- `addNote` (3 test): sesi PIN tidak aktif → ditolak; teks kosong →
  ditolak SEBELUM cek sesi PIN; sesi aktif + teks valid → tersimpan
  **terenkripsi** (diverifikasi eksplisit: `JSON.stringify(note.enc)`
  TIDAK mengandung judul/isi asli sama sekali, baik plaintext maupun
  base64-nya — ini yang paling penting, mastiin tidak ada kebocoran data
  mentah ke storage), input judul+teks ikut dikosongkan.
- `toggleNoteView` (4 test): PIN sesi sama → dekripsi sukses, judul+isi
  balik SAMA PERSIS (round-trip nyata); toggle 2x (buka→tutup) → balik
  status tersembunyi; PIN sesi BEDA (simulasi PIN sudah diganti) →
  dekripsi gagal, toast error, isi TIDAK ditampilkan; sesi PIN tidak
  aktif sama sekali → ditolak tanpa mencoba dekripsi.
- `deleteNote` (2 test): batal vs konfirmasi hapus, `_revealed` state
  ikut dibersihkan pas delete.

**Jebakan teknis yang ditemukan & solusinya:** `_sessionRawPin` di
`keamanan-pin.js` dideklarasikan `let` di top-level — vm TIDAK
menempelkannya ke context object (sama seperti catatan soal
const/let di `loadSource.js`), dan parameter `expose` di `loadSource()`
cuma bisa BACA nilai, bukan SET nilai baru dari luar test. Solusinya:
`vm.runInContext('_sessionRawPin = "1234";', ctx)` dijalankan langsung
ke context yang sama (`ctx` yang di-return `loadSource()` adalah
objek yang sudah di-`vm.createContext()`, jadi bisa dipakai lagi lewat
`vm.runInContext()` biasa) — ini dipakai sbg helper `setSessionPin(pin)`
di test buat simulasi "sesi PIN aktif/tidak aktif/berubah".

**Diverifikasi:**
- `node --check tests/refleksi-catatan-privat.test.js` — syntax OK.
- `node --test tests/*.test.js` → **212/212 pass, 0 fail** (naik dari
  203 di bagian ke-14, +9 test baru, 0 regresi).
- `npm run lint`/`npx eslint` masih TIDAK bisa dites di sesi ini
  (sandbox tanpa internet) — tolong jalankan `npm run lint` di lokal
  sebelum merge (ada 2 file test baru dari bagian ke-14 & ke-15).

**Untuk sesi berikutnya — sisa PR test yang belum dikerjakan:**
1. `keamanan-pin.js` sendiri masih tanpa test langsung: `hashPin`
   (deterministik, gampang), lockout PIN salah (`_pinLockState`/
   `_pinLockRemainingMs`/`updatePinLockUI` — perlu stub
   `localStorage`/`setInterval`), `gantiPin` (re-enkripsi API key lama
   ke PIN baru), `loadAndMigrateApiKeyOnUnlock` (migrasi skema lama →
   baru). Pola test kripto real (tanpa mock) yang dipakai di bagian
   ke-15 ini bisa langsung dipakai ulang.
2. Modul lain yang masih tanpa test sama sekali: lihat daftar lengkap di
   bagian ke-13 (masih ~28 file, dikurangi `refleksi-selfcare.js` yang
   sekarang sudah full tercakup — bagian ringan bagian ke-14 + bagian
   berat bagian ke-15 ini).

## Catatan kerja — 2026-07-11 (bagian ke-16): test `keamanan-pin.js` — hashPin, gantiPin, migrasi API key

Konteks: lanjutan saran prioritas #1 dari bagian ke-15 — `keamanan-pin.js`
sendiri masih tanpa test langsung. User setuju lanjut.

**File baru: `tests/keamanan-pin.test.js` (13 test, semua pass).** Sama
seperti bagian ke-15, pakai Web Crypto ASLI Node (`globalThis.crypto`),
BUKAN mock — round-trip enkripsi/dekripsi beneran jalan.

Cakupan:
- `hashPin` (3 test): deterministik (PIN sama → hash sama), PIN beda →
  hash beda, format hex SHA-256 valid (64 karakter 0-9a-f).
- `gantiPin` (4 test): batal (prompt kosong) → tidak ada perubahan sama
  sekali; PIN baru tidak valid (bukan 4 digit angka) → ditolak dgn
  alert; PIN baru valid tanpa API key lama → hash PIN baru tersimpan +
  sesi diupdate; PIN baru valid DENGAN API key lama → **re-enkripsi
  berhasil** (diverifikasi: hasil enkripsi baru beda dari yg lama krn
  salt/iv baru, TAPI tetap bisa dibuka dgn PIN baru & sudah TIDAK BISA
  dibuka lagi dgn PIN lama).
- `loadAndMigrateApiKeyOnUnlock` (6 test): sesi PIN tidak aktif → no-op;
  belum ada apa-apa tersimpan & belum ada apiKey → no-op; belum ada
  tersimpan tapi `D.profile.apiKey` sudah terisi manual → otomatis
  dienkripsi & disimpan; data tersimpan & PIN sesi cocok → dimuat apa
  adanya; **skema LAMA** (kunci enkripsi = hash PIN via `kw_pin`, bukan
  PIN mentah) → berhasil dimigrasi otomatis ke skema baru (dibaca via
  fallback legacy, lalu di-re-enkripsi ke skema baru, diverifikasi bisa
  dibuka lagi dgn skema baru setelahnya); skema baru MAUPUN lama
  dua-duanya gagal (PIN beneran berubah/data rusak) → `apiKey` TIDAK
  diisi, toast peringatan muncul (di-trigger sinkron di test dgn
  override `setTimeout` jadi langsung panggil, bukan nunggu 400ms
  beneran).

Pola helper baru di file ini: `makeFakeLocalStorage()` — mock in-memory
sederhana (`getItem`/`setItem`/`removeItem`) yang BENERAN dipakai
baca-tulis (bukan permissive no-op stub dari `loadSource.js` default),
karena `gantiPin`/`loadAndMigrateApiKeyOnUnlock` baca-tulis
`localStorage` langsung utk kunci `'kw_pin'` & `kw_apikey_enc`. Juga
`safeSetItem` di-stub supaya TETAP menulis ke `fakeLocalStorage` (bukan
cuma spy kosong) sambil tetap dicatat tiap panggilannya buat verifikasi.

**SENGAJA belum dicakup di sesi ini:** layar PIN interaktif & lockout
percobaan salah (`pinPress`/`pinBack`/`checkPin`/`updatePinLockUI`/
`_pinLockState`/`_pinLockRemainingMs`) — lebih banyak berurusan dgn
DOM keypad + timer interval, beda karakter testing-nya dari 3 fungsi di
atas (yang murni logic + kripto). `persistApiKeyEncrypted` (autosave
debounce 500ms) juga belum, tapi kecil kemungkinan berisiko tinggi
(cuma wrapper tipis di atas `encryptApiKeyWithPin` yg sudah teruji).

**Diverifikasi:**
- `node --check tests/keamanan-pin.test.js` — syntax OK.
- `node --test tests/*.test.js` → **225/225 pass, 0 fail** (naik dari
  212 di bagian ke-15, +13 test baru, 0 regresi).
- `npm run lint`/`npx eslint` masih TIDAK bisa dites di sesi ini
  (sandbox tanpa internet) — tolong jalankan `npm run lint` di lokal
  sebelum merge (sekarang ada 3 file test baru dari bagian ke-14/15/16
  yang menumpuk belum divalidasi lint-nya).

**Untuk sesi berikutnya:** kalau mau lanjut cakupan `keamanan-pin.js`
100%, sisanya lockout PIN (`_pinLockState` dkk, butuh fake
`setInterval`/`Date.now` yg bisa dimaju-mundurkan) & layar PIN
interaktif (`pinPress`/`checkPin`, butuh fakeDom + `pinBuffer` yg
juga `let` top-level, pola `setSessionPin`-nya sama persis dgn yg
dipakai di sini). Modul lain yg masih nol test: lihat daftar di bagian
ke-13 (sekarang berkurang 1 lagi: `keamanan-pin.js` bagian intinya sudah
tercakup, meski belum 100%).

## Catatan kerja — 2026-07-11 (bagian ke-17): test `tx-cobek.js` — `isCobekStockCatName`

Konteks: user minta "kerjakan saran yg ringan dulu" lagi. Dari 2 opsi
sisa di catatan bagian ke-16 (lanjut `keamanan-pin.js` — lockout PIN +
layar PIN interaktif, keduanya lebih berat krn butuh fake
`setInterval`/`Date.now` & fakeDom+`pinBuffer`; ATAU pilih salah satu
modul nol-test lain dari daftar bagian ke-13), dipilih yang PALING
RINGAN dari semuanya: `tx-cobek.js` (28 baris, satu fungsi murni
`isCobekStockCatName`, tidak baca/tulis DOM sama sekali — cuma baca
`D.categories`), bukan lanjut `keamanan-pin.js`.

**File baru: `tests/tx-cobek.test.js` (10 test, semua pass).** Fungsi ini
menentukan kapan panel Stok/Penjualan Cobek/Shop muncul di form
Transaksi (dipanggil dari `updateTxVehiclePanels()` di `transaksi.js`).
Cakupan:
- Cocok langsung by nama kategori/subkategori mengandung "cobek" atau
  "shop" (case-insensitive), termasuk saat `D.categories` kosong sama
  sekali (bagian ini tidak butuh lookup ke `D` sama sekali).
- `catName`/`subName` `undefined`/`null`/tidak diisi → tidak error,
  balik `false` (fallback ke string kosong sebelum di-regex).
- Fallback lewat ID internal (`sub_cb_cobek`/`sub_cbb_cobek`) tetap
  `true` walau nama kategori & subkategori SUDAH di-rename user jadi
  sama sekali tidak mengandung kata "cobek"/"shop" — ini bagian paling
  penting krn fitur rename kategori memang ada di app (beda dari kasus
  kendaraan di `resolveVehicleTxCategory` yg belum ada UI rename-nya).
- Fallback ID diverifikasi jalan baik dari `D.categories.expense`
  maupun `D.categories.income`.
- Kategori ketemu by nama tapi `sub.id` bukan salah satu dari 2 id yg
  dikenali → `false` (tidak asal true krn kategorinya "mirip").
- `subName` yang diberikan tidak ada di daftar `subs` kategori yg
  ketemu → `false`, tidak error/throw.

**Tidak ada bug ditemukan** — `isCobekStockCatName` sudah benar sesuai
komentar di source-nya sendiri; sesi ini murni menambah test yang
sebelumnya nol utk fungsi ini (sama seperti pola "review tanpa bug" di
catatan kerja Car Notes 2026-07-10/11 di atas).

**Diverifikasi:**
- `node --check tests/tx-cobek.test.js` — syntax OK.
- `node --test tests/*.test.js` → **235/235 pass, 0 fail** (naik dari
  225 di bagian ke-16, +10 test baru, 0 regresi).
- `node build.js` → sukses, 0 error dari 3 lint guard bawaan (u-dnone,
  escapeHtml, chicken-egg OCR), versi naik otomatis ke
  `kw80-merge-advisor-card-dashcards-31` (build #156), kedua bundle
  lolos `node --check` sintaks, `FILE-MAP.md` diregenerasi (50 file,
  852 identifier global).
- `npm run lint`/`npx eslint` masih TIDAK bisa dites di sesi ini
  (sandbox tanpa internet, `npm install` gagal 403 ke registry) —
  tolong jalankan `npm run lint` di lokal sebelum merge/release (ada 1
  file test baru dari bagian ke-17 yg menumpuk dgn bagian ke-14/15/16
  yg juga belum divalidasi lint-nya di mesin lokal).

**Untuk sesi berikutnya — pilihan saran, urut dari paling ringan:**
1. **(RINGAN)** Modul kecil lain yg masih nol test dari daftar bagian
   ke-13, kandidat murni-logic tanpa DOM berat: `tx-transfer.js` (32
   baris, mirip pola `tx-cobek.js`), lalu file "kalkulator" yg
   kemungkinan besar pure-function: `kalkulator-input.js` (140 baris),
   `worthit.js` (467 baris), `edukasi-dana.js` (173 baris),
   `hidup-seimbang.js` (218 baris) — belum dicek detail isinya, perlu
   baca dulu sebelum pilih.
2. **(SEDANG)** Modul transaksi/CRUD sedang (100–350 baris) yg
   kemungkinan butuh fakeDom spt pola `tests/refleksi-selfcare.test.js`:
   `akun.js`, `cicilan.js`, `tx-target.js`, `piutang-utang.js`,
   `aset.js`.
3. **(BERAT)** Lanjut cakupan `keamanan-pin.js` ke 100%: lockout PIN
   (`_pinLockState`/`_pinLockRemainingMs`/`updatePinLockUI`, butuh fake
   `setInterval`/`Date.now` yg bisa dimaju-mundurkan) & layar PIN
   interaktif (`pinPress`/`pinBack`/`checkPin`, butuh fakeDom +
   `pinBuffer` yg jg `let` top-level — pola `setSessionPin` di
   `tests/keamanan-pin.test.js` bisa dipakai ulang).
4. `cobek.js` (1261 baris, file fitur terbesar yg masih nol test) —
   disisakan paling akhir krn ukurannya jauh lebih besar dari yg lain,
   butuh sesi tersendiri utk dipetakan dulu strukturnya sebelum nulis
   test.

Daftar modul nol-test yg TERSISA (dikurangi `tx-cobek.js` yg baru
selesai bagian ke-17 ini) dari bagian ke-13: `akun.js`, `aset.js`,
`cicilan.js`, `cobek.js`, `piutang-utang.js`, `tx-target.js`,
`tx-transfer.js`, `tx-list-cashflow.js`, `backup-restore.js`,
`payroll-absensi.js`, `kasir.js`, `sewakios.js`, `renovasi.js`,
`worthit.js`, `tagihan-kalender.js`, `reset-gaji-mingguan.js`,
`modals.js`, `modal-navigasi.js`, `onboarding.js`,
`profil-pengaturan.js`, `kategori.js`, `kategorisasi-ai.js`,
`linktx.js`, `kalkulator-input.js`, `filter-laporan.js`,
`hidup-seimbang.js`, `edukasi-dana.js`, `diagnostik-versi.js`,
`debug-console.js`, `error-handler.js`,
`features-aiwidget-reminder-gdrive-search.js`,
`features-sheets-pwa-selftest.js`.

## Catatan kerja — 2026-07-11 (bagian ke-18): test `tx-transfer.js` — `openTransferModal` & `saveTransfer`

Konteks: lanjutan bagian ke-17, user minta lanjut saran berikutnya. Dari
daftar prioritas di catatan bagian ke-17 (opsi 1, "RINGAN": `tx-transfer.js`
dulu sebelum kalkulator2 yg belum dicek isinya), dipilih `tx-transfer.js`
(32 baris, 2 fungsi: `openTransferModal` & `saveTransfer`). Beda dari
`tx-cobek.js` (murni tanpa DOM), dua fungsi ini baca/tulis DOM langsung
(`getElementById`) — jadi dites pakai `fakeDom`, pola sama seperti
`tests/refleksi-selfcare.test.js`, tetap tergolong "ringan" krn tidak ada
kripto/timer/async rumit.

**File baru: `tests/tx-transfer.test.js` (12 test, semua pass).**
Cakupan:
- `openTransferModal` (4 test): reset `trAmt`/`trNote` jadi kosong,
  `trDate` di-set ke tanggal hari ini (ISO), manggil
  `populateAccFilters()` & `openModal('transferModal')`, `trTo.selectedIndex`
  diarahkan ke akun kedua HANYA kalau akun >1 (kalau cuma 1 akun,
  `selectedIndex` tidak disentuh sama sekali).
- `saveTransfer` validasi (3 test): jumlah kosong/nol ditolak, jumlah
  negatif ditolak, akun asal===tujuan ditolak — ketiganya via toast,
  tidak menambah transaksi apa pun.
- `saveTransfer` jalur sukses (5 test): tepat 2 transaksi baru
  (`transfer_out` dari akun asal + `transfer_in` ke akun tujuan) dgn
  jumlah/tanggal/kategori sama persis; catatan kosong → default
  `"Transfer"` + nama akun lawan diselipkan (`→`/`←`); catatan custom
  dipertahankan bukan ditimpa; nama akun di catatan di-`escapeHtml()`
  (dicek eksplisit tag `<b>` tidak lolos mentah); efek samping lengkap
  (`save()`, `closeModal('transferModal')`, `renderDashboard()`,
  `renderKeuangan()`, toast sukses) semua terpanggil.

**Tidak ada bug ditemukan** — sama seperti bagian ke-17, sesi ini murni
menambah test yang sebelumnya nol utk `tx-transfer.js`.

**Diverifikasi:**
- `node --check tests/tx-transfer.test.js` — syntax OK.
- `node --test tests/*.test.js` → **247/247 pass, 0 fail** (naik dari
  235 di bagian ke-17, +12 test baru, 0 regresi).
- `node build.js` → sukses, 0 error dari 3 lint guard bawaan, versi naik
  otomatis ke `kw80-merge-advisor-card-dashcards-32` (build #157), kedua
  bundle lolos `node --check` sintaks, `FILE-MAP.md` diregenerasi (50
  file, 852 identifier global).
- `npm run lint`/`npx eslint` masih TIDAK bisa dites di sesi ini
  (sandbox tanpa internet) — tolong jalankan `npm run lint` di lokal
  sebelum merge/release (sekarang ada 2 file test baru menumpuk dari
  bagian ke-17/ke-18 yg belum divalidasi lint-nya, ditambah sisa dari
  bagian ke-14/15/16 sebelumnya).

**Untuk sesi berikutnya — pilihan saran, urut dari paling ringan:**
1. **(RINGAN, belum dicek isinya)** Kandidat kalkulator murni-logic dari
   opsi 1 bagian ke-17 yg tersisa: `kalkulator-input.js` (140 baris),
   `edukasi-dana.js` (173 baris), `hidup-seimbang.js` (218 baris),
   `worthit.js` (467 baris) — perlu dibaca dulu isinya sebelum pilih
   mana yg paling ringan (blm tentu semuanya pure-function spt namanya).
2. **(SEDANG)** Modul transaksi/CRUD sedang (100–350 baris) yg
   kemungkinan butuh fakeDom spt pola bagian ke-18 ini: `akun.js`,
   `cicilan.js`, `tx-target.js`, `piutang-utang.js`, `aset.js`.
3. **(BERAT)** Lanjut cakupan `keamanan-pin.js` ke 100%: lockout PIN
   (`_pinLockState`/`_pinLockRemainingMs`/`updatePinLockUI`, butuh fake
   `setInterval`/`Date.now` yg bisa dimaju-mundurkan) & layar PIN
   interaktif (`pinPress`/`pinBack`/`checkPin`, butuh fakeDom +
   `pinBuffer` yg jg `let` top-level — pola `setSessionPin` di
   `tests/keamanan-pin.test.js` bisa dipakai ulang).
4. `cobek.js` (1261 baris, file fitur terbesar yg masih nol test) —
   disisakan paling akhir, butuh sesi tersendiri utk dipetakan dulu
   strukturnya sebelum nulis test.

Daftar modul nol-test yg TERSISA (dikurangi `tx-cobek.js` bagian ke-17 &
`tx-transfer.js` bagian ke-18 ini): `akun.js`, `aset.js`, `cicilan.js`,
`cobek.js`, `piutang-utang.js`, `tx-target.js`, `tx-list-cashflow.js`,
`backup-restore.js`, `payroll-absensi.js`, `kasir.js`, `sewakios.js`,
`renovasi.js`, `worthit.js`, `tagihan-kalender.js`,
`reset-gaji-mingguan.js`, `modals.js`, `modal-navigasi.js`,
`onboarding.js`, `profil-pengaturan.js`, `kategori.js`,
`kategorisasi-ai.js`, `linktx.js`, `kalkulator-input.js`,
`filter-laporan.js`, `hidup-seimbang.js`, `edukasi-dana.js`,
`diagnostik-versi.js`, `debug-console.js`, `error-handler.js`,
`features-aiwidget-reminder-gdrive-search.js`,
`features-sheets-pwa-selftest.js`.

## Catatan kerja — 2026-07-11 (bagian ke-19): test `kalkulator-input.js` — bagian ringan (`safeCalc`/`normalizeAmtToken`/preview/`evalAmtExpr`)

Konteks: lanjutan bagian ke-18, user minta lanjut lagi. Dari opsi 1 di
catatan bagian ke-18 (4 kandidat kalkulator belum dicek isinya), dibaca
dulu isi ke-4 file: `kalkulator-input.js` (140 baris) ternyata isinya
paling pas dgn "ringan" — parser ekspresi murni (`safeCalc`,
`normalizeAmtToken`) + 2 fungsi DOM-ringan (`updateAmtPreview`,
`evalAmtExpr`) TANPA state top-level `let` — jadi dipilih duluan drpd
`worthit.js`/`edukasi-dana.js`/`hidup-seimbang.js` yg belum tentu
sesederhana itu.

**Cakupan file ini SENGAJA dibatasi**, sama pola-nya dgn split
ringan/berat di `refleksi-selfcare.js` (bagian ke-14/15): popup
kalkulator interaktif (`openCalc`/`calcPress`/`calcClear`/
`calcBackspace`/`calcEquals`/`calcUseResult`/`calcRenderDisplay`) pakai
`let calcExpr`/`calcTargetId` top-level yg perlu di-reset lewat
`vm.runInContext` (pola sama dgn `_sessionRawPin`/`pinBuffer` di
`keamanan-pin.js`) — disisakan utk sesi lanjutan yg lebih "sedang"
beratnya, TIDAK dikerjakan di sesi ini.

**File baru: `tests/kalkulator-input.test.js` (26 test, semua pass).**
Cakupan:
- `safeCalc` (10 test): tambah/kurang, precedence kali/bagi vs
  tambah/kurang, tanda kurung, pembagian dgn 0 → `NaN` (bukan
  `Infinity`), unary minus/plus, ekspresi tidak lengkap (`"2+"`) →
  `NaN`, karakter di luar whitelist (huruf/simbol lain, termasuk upaya
  injeksi kayak `"alert(1)"`/`"2;3"`) → `NaN`, input bukan
  string/kosong/whitespace-only → `NaN`, token tersisa yg tidak
  konsisten (`"2 3"`) → `NaN`, angka desimal biasa dihitung benar.
- `safeCalc` gaya pemisah ribuan ala Indonesia (2 test, ini bagian yg
  paling gampang salah kalau di-refactor tanpa test): `"1.000"` →
  dinormalisasi jadi `1000` (BUKAN `1.0`), `"1.000.000"` → `1000000`.
- `normalizeAmtToken` (4 test, akses fungsi ini langsung terpisah dari
  `safeCalc` krn dia top-level `function` sendiri): tanpa titik apa
  adanya, segmen terakhir 1-2 digit dianggap desimal, segmen terakhir
  3+ digit dianggap ribuan (titik dibuang semua), kombinasi ribuan+desimal
  (`"1.000.50"` → `"1000.50"`).
- `calcPreviewValue` (3 test): falsy/kosong → 0, ekspresi tidak valid →
  0 (bukan `NaN`, penting krn dipakai langsung sbg angka di UI),
  ekspresi valid → hasil hitungnya.
- `updateAmtPreview` (3 test, pakai fakeDom): elemen tidak ketemu →
  no-op tanpa error, hasil >0 → preview terisi `"= " + fmt(hasil)`,
  hasil 0/negatif → preview dikosongkan (termasuk kasus preview
  sebelumnya ada isi lama, harus ke-reset).
- `evalAmtExpr` (5 test, pakai fakeDom + `class FakeEvent` yg di-inject
  manual krn vm sandbox `loadSource()` tidak menyediakan `Event`
  bawaan): elemen tidak ketemu → no-op; value tanpa karakter
  operator/titik (mis. `"500"` polos) → TIDAK diubah & TIDAK dispatch
  event (regex trigger `/[+\-*/.]/ `sengaja butuh minimal satu operator
  atau titik); ekspresi valid → value ditimpa hasil hitung & dispatch
  event `"input"` dgn `bubbles:true`; ekspresi invalid (hasil `NaN`) →
  value TIDAK diubah, tidak dispatch event; hasil dibulatkan 2 desimal
  (`"10/3"` → `"3.33"`).

**Tidak ada bug ditemukan** — sama seperti bagian ke-17/18, sesi ini
murni menambah test yg sebelumnya nol utk bagian ringan file ini.

**Diverifikasi:**
- `node --check tests/kalkulator-input.test.js` — syntax OK.
- `node --test tests/*.test.js` → **273/273 pass, 0 fail** (naik dari
  247 di bagian ke-18, +26 test baru, 0 regresi).
- `node build.js` → sukses, 0 error dari 3 lint guard bawaan, versi naik
  otomatis ke `kw80-merge-advisor-card-dashcards-33` (build #158), kedua
  bundle lolos `node --check` sintaks, `FILE-MAP.md` diregenerasi (50
  file, 852 identifier global).
- `npm run lint`/`npx eslint` masih TIDAK bisa dites di sesi ini
  (sandbox tanpa internet) — tolong jalankan `npm run lint` di lokal
  sebelum merge/release (sekarang ada 3 file test baru menumpuk dari
  bagian ke-17/18/19 yg belum divalidasi lint-nya).

**Untuk sesi berikutnya — pilihan saran, urut dari paling ringan:**
1. **(SEDANG)** Lanjut `kalkulator-input.js` bagian yg disisakan: popup
   kalkulator interaktif (`openCalc`/`calcPress`/`calcClear`/
   `calcBackspace`/`calcEquals`/`calcUseResult`/`calcRenderDisplay`) —
   butuh helper `vm.runInContext('calcExpr = "...";', ctx)` spt pola
   `setSessionPin` di `tests/keamanan-pin.test.js`, tapi TIDAK butuh
   kripto/timer async — jadi masih lebih ringan drpd sisa
   `keamanan-pin.js` (opsi 3 di bawah).
2. **(RINGAN, belum dicek isinya)** 3 kandidat kalkulator lain yg belum
   dicek: `edukasi-dana.js` (173 baris), `hidup-seimbang.js` (218
   baris), `worthit.js` (467 baris, paling besar dari yg "kalkulator").
3. **(SEDANG)** Modul transaksi/CRUD sedang (100–350 baris) yg
   kemungkinan butuh fakeDom spt pola bagian ke-18: `akun.js`,
   `cicilan.js`, `tx-target.js`, `piutang-utang.js`, `aset.js`.
4. **(BERAT)** Lanjut cakupan `keamanan-pin.js` ke 100%: lockout PIN
   (butuh fake `setInterval`/`Date.now` yg bisa dimaju-mundurkan) &
   layar PIN interaktif (`pinPress`/`pinBack`/`checkPin`).
5. `cobek.js` (1261 baris, file fitur terbesar yg masih nol test) —
   disisakan paling akhir, butuh sesi tersendiri utk dipetakan dulu
   strukturnya sebelum nulis test.

Daftar modul nol-test yg TERSISA (dikurangi `tx-cobek.js`/`tx-transfer.js`
bagian ke-17/18; `kalkulator-input.js` bagian ke-19 ini SEBAGIAN sudah
tercakup, popup interaktifnya belum): `akun.js`, `aset.js`, `cicilan.js`,
`cobek.js`, `piutang-utang.js`, `tx-target.js`, `tx-list-cashflow.js`,
`backup-restore.js`, `payroll-absensi.js`, `kasir.js`, `sewakios.js`,
`renovasi.js`, `worthit.js`, `tagihan-kalender.js`,
`reset-gaji-mingguan.js`, `modals.js`, `modal-navigasi.js`,
`onboarding.js`, `profil-pengaturan.js`, `kategori.js`,
`kategorisasi-ai.js`, `linktx.js`, `filter-laporan.js`,
`hidup-seimbang.js`, `edukasi-dana.js`, `diagnostik-versi.js`,
`debug-console.js`, `error-handler.js`,
`features-aiwidget-reminder-gdrive-search.js`,
`features-sheets-pwa-selftest.js`.

## Catatan kerja — 2026-07-11 (bagian ke-20): test `kalkulator-input.js` — popup interaktif (`kalkulator-input.js` 100% tercakup)

Konteks: lanjutan bagian ke-19, user minta lanjut lagi. Sesuai opsi 1 di
catatan bagian ke-19 ("SEDANG": lanjut popup kalkulator interaktif —
lebih ringan drpd sisa `keamanan-pin.js` krn tidak ada kripto/timer
async), dikerjakan sekarang: `openCalc`/`closeCalc`/`calcPress`/
`calcClear`/`calcBackspace`/`calcEquals`/`calcUseResult`/
`calcRenderDisplay` — semuanya baca/tulis 2 variabel top-level `let
calcTargetId, calcExpr`.

**Teknik:** sama persis pola `setSessionPin`/`getSessionPin` di
`tests/keamanan-pin.test.js` (bagian ke-16) — `vm.runInContext('calcExpr
= ...;', ctx)` utk nulis, `vm.runInContext('calcExpr', ctx)` utk baca,
krn `let` top-level TIDAK otomatis nempel ke objek context vm (beda dari
`function`/`var`). Helper `setCalcExpr`/`getCalcExpr`/`setCalcTargetId`/
`getCalcTargetId` dibungkus di `makeCalcPopup()`.

**File baru: `tests/kalkulator-popup.test.js` (24 test, semua pass).**
`kalkulator-input.js` sekarang 100% tercakup (gabungan dgn
`tests/kalkulator-input.test.js` bagian ke-19). Cakupan:
- `openCalc`/`closeCalc` (5 test): target berisi angka murni (boleh
  titik, TANPA operator) → `calcExpr` diisi dari value target itu;
  target berisi ekspresi (ada operator, mis. `"2+3"`) → `calcExpr` mulai
  kosong (regex `/^[0-9.]+$/` sengaja menolak apa pun selain
  digit/titik); target kosong → kosong; `openModal('calcModal')` &
  `calcRenderDisplay()` ikut terpanggil; `closeCalc` → `closeModal('calcModal')`.
- `calcRenderDisplay` (4 test): `calcExpr` kosong → valEl `"0"`;
  berakhiran operator → valEl apa adanya, exprEl kosong; ekspresi
  lengkap & valid → exprEl tampilkan ekspresi, valEl tampilkan hasil;
  ekspresi tidak valid (`"5//3"`, walau tidak mungkin lahir dari
  `calcPress` normal) → tidak crash, fallback tampilkan `calcExpr`
  mentah di kedua elemen.
- `calcPress` (5 test): tekan operator saat kosong → diberi awalan
  `"0"`; tekan angka/titik → cuma di-append; tekan operator saat SUDAH
  berakhiran operator → operator lama diganti (bukan ditumpuk, mis.
  `"5+"` + tekan `"*"` → `"5*"`, bukan `"5+*"`); tekan operator normal →
  ditambahkan di akhir; DOM ikut ter-update tiap tekan (manggil
  `calcRenderDisplay` di dalamnya).
- `calcClear`/`calcBackspace` (3 test): clear total apa pun isinya;
  backspace hapus 1 karakter terakhir; backspace saat sudah kosong →
  tidak error, tetap kosong.
- `calcEquals` (3 test): ekspresi valid → `calcExpr` ditimpa hasil akhir
  (dibulatkan 2 desimal); ekspresi belum lengkap (berakhiran operator,
  hasil `NaN`) → `calcExpr` TIDAK berubah (diabaikan, user masih bisa
  lanjut mengetik); pembagian desimal dibulatkan benar (`"10/3"` →
  `"3.33"`).
- `calcUseResult` (4 test): `calcTargetId` belum di-set (`null`) → cuma
  nutup modal, tidak nyentuh elemen; `calcExpr` angka murni (tanpa
  operator/titik) → dipakai apa adanya (TIDAK dilewatkan `safeCalc` lagi
  — regex trigger butuh minimal 1 operator/titik); `calcExpr` ekspresi
  valid → dihitung dulu, hasilnya yg dipakai; `calcExpr` tidak valid
  (`NaN`) → value target sama sekali TIDAK disentuh (tetap nilai lama),
  tapi modal tetap ditutup (`closeCalc()` selalu jalan di akhir apa pun
  hasilnya).

**Tidak ada bug ditemukan** — sama seperti bagian ke-17/18/19, sesi ini
murni menambah test yg sebelumnya nol utk bagian popup file ini.

**Diverifikasi:**
- `node --check tests/kalkulator-popup.test.js` — syntax OK.
- `node --test tests/*.test.js` → **297/297 pass, 0 fail** (naik dari
  273 di bagian ke-19, +24 test baru, 0 regresi).
- `node build.js` → sukses, 0 error dari 3 lint guard bawaan, versi naik
  otomatis ke `kw80-merge-advisor-card-dashcards-34` (build #159), kedua
  bundle lolos `node --check` sintaks, `FILE-MAP.md` diregenerasi (50
  file, 852 identifier global).
- `npm run lint`/`npx eslint` masih TIDAK bisa dites di sesi ini
  (sandbox tanpa internet) — tolong jalankan `npm run lint` di lokal
  sebelum merge/release (sekarang ada 4 file test baru menumpuk dari
  bagian ke-17/18/19/20 yg belum divalidasi lint-nya).

**Untuk sesi berikutnya — pilihan saran, urut dari paling ringan:**
1. **(RINGAN, belum dicek isinya)** 3 kandidat kalkulator lain yg belum
   dicek: `edukasi-dana.js` (173 baris), `hidup-seimbang.js` (218
   baris), `worthit.js` (467 baris).
2. **(SEDANG)** Modul transaksi/CRUD sedang (100–350 baris) yg
   kemungkinan butuh fakeDom: `akun.js`, `cicilan.js`, `tx-target.js`,
   `piutang-utang.js`, `aset.js`.
3. **(BERAT)** Lanjut cakupan `keamanan-pin.js` ke 100%: lockout PIN
   (butuh fake `setInterval`/`Date.now` yg bisa dimaju-mundurkan) &
   layar PIN interaktif (`pinPress`/`pinBack`/`checkPin`).
4. `cobek.js` (1261 baris, file fitur terbesar yg masih nol test) —
   disisakan paling akhir, butuh sesi tersendiri utk dipetakan dulu
   strukturnya sebelum nulis test.

`kalkulator-input.js` SEKARANG SUDAH tidak lagi masuk daftar nol-test —
dikeluarkan dari daftar di bawah. Daftar modul nol-test yg TERSISA (sebelum
bagian ke-21 di bawah):
`akun.js`, `aset.js`, `cicilan.js`, `cobek.js`, `piutang-utang.js`,
`tx-target.js`, `tx-list-cashflow.js`, `backup-restore.js`,
`payroll-absensi.js`, `kasir.js`, `sewakios.js`, `renovasi.js`,
`worthit.js`, `tagihan-kalender.js`, `reset-gaji-mingguan.js`,
`modals.js`, `modal-navigasi.js`, `onboarding.js`,
`profil-pengaturan.js`, `kategori.js`, `kategorisasi-ai.js`,
`linktx.js`, `filter-laporan.js`, `hidup-seimbang.js`, `edukasi-dana.js`,
`diagnostik-versi.js`, `debug-console.js`, `error-handler.js`,
`features-aiwidget-reminder-gdrive-search.js`,
`features-sheets-pwa-selftest.js`.

## Catatan kerja — 2026-07-11 (bagian ke-21): test `edukasi-dana.js` (EduFund) & `hidup-seimbang.js` (LifeBalance) — 2 kandidat paling ringan dari opsi 1 bagian ke-20

Konteks: user minta "kerjakan saran yg paling ringan" dari 2 file dulu. Dari
opsi 1 di catatan bagian ke-20 ("3 kandidat kalkulator lain yg belum dicek:
`edukasi-dana.js` 173 baris, `hidup-seimbang.js` 218 baris, `worthit.js` 467
baris"), dipilih 2 yg PALING RINGAN (baris paling sedikit): `edukasi-dana.js`
dan `hidup-seimbang.js`. `worthit.js` (467 baris, terbesar dari 3 kandidat)
sengaja belum dikerjakan, disisakan utk sesi berikutnya.

**Tidak ada bug ditemukan** — sama seperti bagian ke-17/18/19/20, sesi ini
murni menambah test yg sebelumnya nol utk kedua modul ini, tidak ada
perubahan di kode aplikasi.

**File baru: `tests/edukasi-dana.test.js` (18 test, `EduFund`).** Cakupan:
`calc()` (5 test: tahun target lewat/tahun ini → `pmtBulanan` = kekurangan
sekaligus; kasus normal pakai rumus anuitas inflasi≠return; kasus
inflasi==return → dibagi rata per bulan; terkumpul melebihi target →
kekurangan diklem 0; `accountId` terisi → terkumpul diambil dari
`recalcAccBalance()` bukan field manual), `updatePreview()` (3 test: pesan
warning kalau tahun target lewat, preview normal, `eduSavedWrap`
tampil/sembunyi sesuai akun dipilih), `save()` (5 test: validasi nama &
biaya kosong, entry baru, mode edit update di tempat, `accountId` terisi
→ `terkumpul` dipaksa 0), `del()` (1 test), `renderDashMini()` (2 test:
card disembunyikan kalau kosong, total/pct dihitung benar), `render()`
(2 test: empty state, linkTag akun ikut dirender). `openModal()` (murni
prefill form dari data existing — pola sama dgn BBM.openModal/
Servis.openModal yg sudah didokumentasikan nilai gunanya lebih rendah) dan
`checkAI()` (butuh mock `callAIProviderRaw`/`RefAI._parseJSON`/
`showPromptModal` async, ranah test terpisah yg lebih berat) SENGAJA belum
dites, konsisten dgn pola pembatasan cakupan di bagian-bagian sebelumnya.

**File baru: `tests/hidup-seimbang.test.js` (29 test, `LifeBalance`).**
Cakupan: `compute()` (11 test: Dana Darurat kosong/50%/>100% diklem;
DSR income belum ada → netral 13 + `thin:true`, DSR normal & filter
cicilan yg `sisaTenor` null/bukan `kind:'cicilan'` diabaikan; No Spend
histori <7 hari → netral+thin, No Spend normal; Kerja-Istirahat tanpa
Absensi → netral+thin, kerja penuh 7 hari → 0 poin, 2+ hari istirahat →
poin penuh diklem; total & level di 4 ambang batas Seimbang/Cukup
Baik/Perlu Perhatian/Waspada — termasuk catatan penting: **field `thin`
HANYA ada di 3 komponen (DSR/No-Spend/Kerja), Dana Darurat TIDAK PERNAH
`thin` krn kosongnya sudah tercermin lewat `ddPts:0`, bukan nilai netral**),
`getFocusAreas()` (2 test: filter pct<70% urut naik maks 2, semua ≥70% →
kosong), `render()`/`renderFocus()` (4 test: skor & ring ter-tulis,
`lbDataNote` tampil/sembunyi sesuai ada-tidaknya komponen `thin`, pesan
"Pertahankan" kalau tidak ada area fokus), `saveSnapshot()` (3 test:
entry baru, update snapshot tanggal yg sama termasuk flag `auto` ketimpa
saat manual, auto-save tidak toast), `autoSnapshotIfNeeded()` (3 test:
skip kalau app masih kosong total, skip kalau sudah ada snapshot bulan
ini, buat baru kalau syarat terpenuhi), `deleteSnapshot()` (2 test:
konfirmasi vs batal), `renderTrendBadge()` (3 test: <2 snapshot
disembunyikan, delta naik/turun). `renderHistoryModal()` (chart SVG +
list riwayat, murni DOM-write dari data yg sudah dites lewat
`saveSnapshot()`) SENGAJA belum dites detail — nilai gunanya lebih rendah.

**Catatan teknis satu kesalahan yg kejadian & diperbaiki SAAT menulis test
(bukan bug di kode aplikasi)**: draft awal test skenario total/level salah
asumsi keempat komponen "netral" bernilai 13 semua (13×4=52). Ternyata
Dana Darurat TIDAK punya jalur netral — kalau belum ada Target Dana
Darurat, `ddPts` langsung 0 (bukan 13), jadi total kondisi "semua data
kosong" yg benar adalah 0+13+13+13=**39** (level Waspada), bukan 52.
Ketahuan sendiri lewat `node --test` gagal (assertion mismatch), lalu
draft test dikoreksi mengikuti perilaku source yg sebenarnya (source TIDAK
diubah).

**Diverifikasi:**
- `node --test tests/*.test.js` → **344/344 pass, 0 fail** (naik dari 297
  di bagian ke-20, +47 test baru dari 2 file test baru ini, 0 regresi).
- `node build.js` → sukses, 0 error dari 3 lint guard bawaan, versi naik
  otomatis ke `kw80-merge-advisor-card-dashcards-35` (build #160), kedua
  bundle lolos `node --check` sintaks, `FILE-MAP.md` diregenerasi (50
  file, 852 identifier global).
- `npm run lint`/`npx eslint` masih TIDAK bisa dites di sesi ini (sandbox
  tanpa internet) — tolong jalankan `npm run lint` di lokal sebelum
  merge/release (sekarang ada 2 file test baru menumpuk dari bagian
  ke-21 ini yg belum divalidasi lint-nya, ditambah tumpukan dari
  bagian ke-17/18/19/20 yg juga belum divalidasi).

**Untuk sesi berikutnya — pilihan saran, urut dari paling ringan:**
1. **(RINGAN)** `worthit.js` (467 baris) — kandidat "kalkulator" terakhir
   yg tersisa dari daftar bagian ke-19/20, belum dicek isinya sama sekali.
2. **(SEDANG)** Modul transaksi/CRUD sedang (100–350 baris) yg
   kemungkinan butuh fakeDom: `akun.js`, `cicilan.js`, `tx-target.js`,
   `piutang-utang.js`, `aset.js`.
3. **(BERAT)** Lanjut cakupan `keamanan-pin.js` ke 100%: lockout PIN
   (butuh fake `setInterval`/`Date.now` yg bisa dimaju-mundurkan) &
   layar PIN interaktif (`pinPress`/`pinBack`/`checkPin`).
4. `cobek.js` (1261 baris, file fitur terbesar yg masih nol test) —
   disisakan paling akhir, butuh sesi tersendiri utk dipetakan dulu
   strukturnya sebelum nulis test.

`edukasi-dana.js` & `hidup-seimbang.js` SEKARANG SUDAH tidak lagi masuk
daftar nol-test. Daftar modul nol-test yg TERSISA (sebelum bagian ke-22
di bawah): `akun.js`, `aset.js`, `cicilan.js`, `cobek.js`,
`piutang-utang.js`, `tx-target.js`, `tx-list-cashflow.js`,
`backup-restore.js`, `payroll-absensi.js`, `kasir.js`, `sewakios.js`,
`renovasi.js`, `worthit.js`, `tagihan-kalender.js`,
`reset-gaji-mingguan.js`, `modals.js`, `modal-navigasi.js`,
`onboarding.js`, `profil-pengaturan.js`, `kategori.js`,
`kategorisasi-ai.js`, `linktx.js`, `filter-laporan.js`,
`diagnostik-versi.js`, `debug-console.js`, `error-handler.js`,
`features-aiwidget-reminder-gdrive-search.js`,
`features-sheets-pwa-selftest.js`.

## Catatan kerja — 2026-07-11 (bagian ke-22): test `worthit.js` (WorthIt) — kandidat terakhir dari daftar "kalkulator" bagian ke-19/20/21

Konteks: user minta "lanjutkan" dari catatan bagian ke-21. Sesuai opsi 1
di catatan bagian ke-21 ("(RINGAN) `worthit.js` 467 baris — kandidat
kalkulator terakhir yg tersisa"), dikerjakan sekarang. Dgn ini, seluruh
daftar "3 kandidat kalkulator" dari bagian ke-19 (`edukasi-dana.js`,
`hidup-seimbang.js`, `worthit.js`) sudah selesai semua.

**Tidak ada bug ditemukan** — sama seperti bagian ke-17/18/19/20/21, sesi
ini murni menambah test yg sebelumnya nol utk modul ini, tidak ada
perubahan di kode aplikasi.

**File baru: `tests/worthit.test.js` (47 test, `WorthIt`).** Cakupan:
- `incomeAvg()` (2 test): filter HANYA transaksi `type:'income'` dlm
  rentang bulan efektif, dibagi rata sesuai `FI.effectiveMonths()`.
- `computeScore()` (10 test, fungsi scoring Prioritas Belanja): poin dasar
  kebutuhan vs keinginan, urgensi mendesak/bisa_nunggu/nice_to_have,
  pengurang `sudahPunya` (poin & teks alasan custom), diskon 3 ambang
  (≥30% hijau naik faktor beda tergantung `sudahPunya` 0.4 vs 0.2, 10-30%
  orange, <10% merah "diskon palsu"), tekanan saldo 2 ambang (>50%/25-50%
  merah/orange), dan skor selalu diklem ke rentang 0-100.
- `hitung()` (14 test, verdict & issue list "Cek Sebelum Beli" single-item):
  validasi harga kosong, Dana Darurat kosong/100%/<100% (beda level merah
  vs orange tergantung kategori keinginan/kebutuhan), DSR sesudah cicilan
  baru >35% → verdict TUNDA DULU, saldo terkuras >50%, metode tunai
  surplus positif (estimasi bulan nabung) & negatif (data cukup vs belum
  cukup → beda pesan), selisih bunga cicilan vs tunai, diskon valid
  (hemat besar) & invalid (Harga Normal ≤ harga), saran "tunggu 3 hari"
  utk kategori keinginan, kondisi ideal → WORTH IT, dan `WorthIt._last`
  tersimpan setelah hitung sukses (dipakai `catatBeli()`/`simpanDulu()`
  yg TIDAK dites di sini, lihat catatan cakupan di atas file test).
- CRUD Prioritas Belanja (12 test): `addToList()` (validasi nama/harga,
  entry baru, deteksi duplikat nama dgn konfirmasi setuju/batal, mode
  edit update di tempat), `editListItem()`/`cancelEditList()` (prefill
  form & reset), `deleteListItem()` (hapus + auto-cancel kalau item yg
  dihapus sedang diedit).
- `renderList()` (4 test): empty state, item `bought:true` tidak ikut
  tampil di list aktif, urutan skor tertinggi→terendah & badge prioritas
  sesuai ambang, ringkasan total harga & warning kalau melebihi saldo.
- `applyBuyLink()`/`onLinkedTxEdited()`/`onLinkedTxDeleted()` (3 test):
  sinkronisasi status/harga/tanggal item wishlist dgn transaksi Keuangan
  yg tertaut (pola sama dgn `bbmLinkId`/`servisLinkId` di `transaksi.js`
  yg sudah dites di bagian ke-3/tx-bbm-sync).
- `undoBought()` (2 test): konfirmasi vs batal, transaksi Keuangan yg
  sudah tercatat SENGAJA tidak ikut terhapus saat undo (uangnya memang
  sudah keluar — dijelaskan di pesan konfirmasi sendiri).
- `renderBoughtList()` (2 test): empty state, urutan tanggal beli
  terbaru dulu.

SENGAJA belum dites (didokumentasikan di komentar atas file test):
`open()`/`switchTab()`/`reset()`/`onMethodChange()`/`toggleDiskon()`/
`toggleDiskonList()`/`toggleSudahPunya()`/`toggleBoughtView()` (murni
toggle tampilan modal tanpa logic hitung, nilai guna rendah spt
BBM.openModal/Servis.openModal), `syncDiskon()`/`syncDiskonList()`
(duplikat exact logic preview diskon yg sudah dites via jalur diskon di
`hitung()`/`computeScore()`), `catatBeli()`/`catatBeliList()`/
`simpanDulu()` (integrasi lintas modul ke form Transaksi — butuh mock
`openTxModal`/`setPayMethod`/`syncCicilanPreview`/
`guessCategoryFromReceiptText`/`selectTxCat` sekaligus, ranah test
integrasi terpisah yg lebih berat), dan `openLinkTxModal()` (cuma
delegasi 1 baris ke `LinkTx.open()`).

**Catatan teknis 1 kegagalan yg kejadian & diperbaiki SAAT menulis test
(bukan bug di kode aplikasi)**: test `editListItem` awalnya gagal dgn
error `scrollIntoView is not a function` — elemen generik dari
`createFakeElement()` di `tests/helpers/fakeDom.js` memang tidak
menyediakan stub utk `scrollIntoView` (cuma `focus()`/`click()`), padahal
`WorthIt.editListItem()` memanggilnya di elemen `wlName` sbg bagian dari
alur UX (auto-scroll ke form saat mulai edit). Diperbaiki dgn override
manual `scrollIntoView:()=>{}` khusus di test itu (bukan mengubah
`fakeDom.js` global, krn baru 1 tempat yg butuh — kalau modul lain nanti
butuh pola sama, pertimbangkan tambah `scrollIntoView` ke default
`createFakeElement()`).

**Diverifikasi:**
- `node --test tests/*.test.js` → **391/391 pass, 0 fail** (naik dari 344
  di bagian ke-21, +47 test baru, 0 regresi).
- `node build.js` → sukses, 0 error dari 3 lint guard bawaan, versi naik
  otomatis ke `kw80-merge-advisor-card-dashcards-36` (build #161), kedua
  bundle lolos `node --check` sintaks, `FILE-MAP.md` diregenerasi (50
  file, 852 identifier global).
- `npm run lint`/`npx eslint` masih TIDAK bisa dites di sesi ini (sandbox
  tanpa internet) — tolong jalankan `npm run lint` di lokal sebelum
  merge/release (sekarang ada 3 file test baru menumpuk dari bagian
  ke-21/22 yg belum divalidasi lint-nya, ditambah tumpukan sebelumnya).

**Untuk sesi berikutnya — pilihan saran, urut dari paling ringan:**
1. **(SEDANG)** Modul transaksi/CRUD sedang (100–350 baris) yg
   kemungkinan butuh fakeDom, pola sama dgn `edukasi-dana.js`/
   `worthit.js` sesi ini: `akun.js`, `cicilan.js`, `tx-target.js`,
   `piutang-utang.js`, `aset.js`.
2. **(BERAT)** Lanjut cakupan `keamanan-pin.js` ke 100%: lockout PIN
   (butuh fake `setInterval`/`Date.now` yg bisa dimaju-mundurkan) &
   layar PIN interaktif (`pinPress`/`pinBack`/`checkPin`).
3. `cobek.js` (1261 baris, file fitur terbesar yg masih nol test) —
   disisakan paling akhir, butuh sesi tersendiri utk dipetakan dulu
   strukturnya sebelum nulis test.

`worthit.js` SEKARANG SUDAH tidak lagi masuk daftar nol-test — dgn ini,
SEMUA kandidat "kalkulator" dari bagian ke-19 SUDAH selesai. Daftar modul
nol-test yg TERSISA: `akun.js`, `aset.js`, `cicilan.js`, `cobek.js`,
`piutang-utang.js`, `tx-target.js`, `tx-list-cashflow.js`,
`backup-restore.js`, `payroll-absensi.js`, `kasir.js`, `sewakios.js`,
`renovasi.js`, `tagihan-kalender.js`, `reset-gaji-mingguan.js`,
`modals.js`, `modal-navigasi.js`, `onboarding.js`,
`profil-pengaturan.js`, `kategori.js`, `kategorisasi-ai.js`,
`linktx.js`, `filter-laporan.js`, `diagnostik-versi.js`,
`debug-console.js`, `error-handler.js`,
`features-aiwidget-reminder-gdrive-search.js`,
`features-sheets-pwa-selftest.js`.

## Catatan kerja — 2026-07-11 (bagian ke-23): test `akun.js` & `tx-target.js` — 2 modul pertama dari opsi 1 (SEDANG) di saran bagian ke-22

Konteks: user minta kerjakan saran di CLAUDE.md, 2 file dulu. Sesuai opsi 1
di catatan bagian ke-22 ("(SEDANG) Modul transaksi/CRUD sedang (100–350
baris) yg kemungkinan butuh fakeDom: `akun.js`, `cicilan.js`, `tx-target.js`,
`piutang-utang.js`, `aset.js`"), dipilih 2 file terkecil di daftar itu:
`akun.js` (111 baris) & `tx-target.js` (67 baris).

**Tidak ada bug ditemukan** — sama seperti sesi-sesi sebelumnya, sesi ini
murni menambah test yg sebelumnya nol utk 2 modul ini, tidak ada perubahan
di kode aplikasi.

**File baru: `tests/akun.test.js` (27 test, seluruh fungsi `akun.js`).**
Cakupan: `recalcAccBalance()` (akun tak ditemukan, baseBalance vs fallback
`balance`, filter income/expense/transfer_in/transfer_out per akun),
`populateAccFilters()` (isi opsi ke `fAcc`/`txAcc`/`trFrom`/`trTo`/`wrAcc`,
placeholder & preservasi value lama di `tAcc`/`assetAccId`, panggil
`populateKeuFilters()`, aman kalau elemen tidak ada), `linkedAssetAccountIds()`/
`isAccLinkedToAsset()`, `totalSaldoAkun()` (exclude akun `includeInBalance:false`
& akun tertaut aset), `quickToggleInclude()` (blok+toast kalau tertaut aset &
masih included, boleh toggle balik kalau sudah dikecualikan manual, toggle
bebas utk akun biasa, id tak ketemu), `openAccModal()` (mode tambah vs edit,
prefill, label saldo, hint tertaut aset, `editAccIdx` tersimpan — dibuktikan
via `_saveAccInner()` sesudahnya krn `editAccIdx`/`accIncludeState` adalah
`let` modul-scope yg TIDAK bisa dibaca langsung dari luar `vm` context, lihat
catatan teknis di bawah), `toggleAccInclude()`/`updateAccIncludeBtn()`,
`_saveAccInner()` (validasi nama kosong, tambah baru + fallback emoji, edit
dgn baseBalance dihitung ulang spy saldo tampil = nominal input meski ada
transaksi berjalan, includeInBalance ikut state toggle), dan `delAcc()`
(guard minimal 1 akun, batal konfirmasi, hapus + pindahkan transaksi/tagihan/
BBM/servis/cobek ke akun fallback, aman kalau list terkait undefined semua).

**File baru: `tests/tx-target.test.js` (25 test, seluruh fungsi
`tx-target.js`).** Cakupan: `openTargetModal()` (reset semua field ke
default), `onTargetAccChange()` (tampil/sembunyi `tSavedWrap` sesuai akun
dipilih/tidak), `onTargetDanaDaruratToggle()` (sembunyi hint saat unchecked;
saat checked — rekomendasi 6× rata-rata pengeluaran bulanan dari `FI`, pesan
generik kalau data kosong, isi nama/emoji/amt HANYA kalau masih kosong/default
(tidak menimpa input user), peringatan kalau ada target Dana Darurat lain yg
tandanya akan pindah), `saveTarget()` (validasi nama/amt kosong, `saved` dari
input manual vs dipaksa 0 kalau tertaut akun, fallback emoji, mematikan
`isDanaDarurat` di target lain, memanggil `AlokasiAset.renderAll()` kalau
tersedia & aman kalau tidak), `showTargetAccountTx()` (return awal kalau
target/akun tak ketemu atau tidak tertaut akun, filter+urut transaksi
terbaru dulu, ringkasan jumlah & saldo, empty state), `addTarget()` (batal
prompt, input tak valid, input valid nambah `saved`), dan `delTarget()`
(batal konfirmasi vs hapus).

**Catatan teknis — kenapa `editAccIdx`/`accIncludeState` tidak dites via
akses langsung `ctx.editAccIdx`:** keduanya dideklarasikan `let` di
top-level `akun.js`. Sesuai catatan di `tests/helpers/loadSource.js`, node
`vm` TIDAK otomatis menempelkan binding `let`/`const` ke objek context (beda
dari `function`/`var`), dan parameter `expose` di `loadSource()` cuma
mengambil SNAPSHOT nilai sekali sesaat sesudah semua file dimuat — jadi
`ctx.editAccIdx` tidak pernah ikut ter-update stelah `openAccModal()`
dipanggil, dan assignment manual `ctx.editAccIdx = 0` dari luar juga TIDAK
memengaruhi variabel `let` asli di dalam sandbox (cuma nambah property baru
di objek `ctx`, terpisah dari binding aslinya). Percobaan pertama nulis test
dgn pola ini gagal 4x dgn cara yg membingungkan (nilai balik ke default,
atau assignment "seperti kepakai" tapi ternyata tidak) — diperbaiki dgn
selalu memverifikasi state itu secara TIDAK LANGSUNG lewat efek sampingnya
yg teramati dari luar (teks tombol `accIncludeBtn`, atau hasil nyata
`_saveAccInner()` sesudahnya: apakah update akun yg sudah ada atau malah
nambah akun baru). Kalau modul lain nanti butuh pola serupa (module-state
`let` yg perlu dites lintas pemanggilan fungsi), pakai pendekatan yg sama:
verifikasi lewat efek yg terlihat dr luar, jangan andalkan baca/tulis
`ctx.<namaVariabelLet>` langsung.

**Diverifikasi:**
- `node --test tests/*.test.js` → **443/443 pass, 0 fail** (naik dari 391
  di bagian ke-22, +52 test baru, 0 regresi).
- `node build.js` → sukses, 0 error dari lint guard bawaan, versi naik
  otomatis ke `kw80-merge-advisor-card-dashcards-37` (build #162), kedua
  bundle lolos `node --check` sintaks, `FILE-MAP.md` diregenerasi.
- `npm run lint`/`npx eslint` masih TIDAK bisa dites di sesi ini (sandbox
  tanpa internet, `npm install` gagal 403) — tolong jalankan `npm run lint`
  di lokal sebelum merge/release (sudah menumpuk beberapa file test baru
  dari bagian ke-21/22/23 yg belum divalidasi lint-nya).

**Untuk sesi berikutnya — pilihan saran, urut dari paling ringan:**
1. **(SEDANG)** Sisa modul dari opsi 1 bagian ke-22 yg belum dikerjakan:
   `cicilan.js` (112 baris), `piutang-utang.js` (351 baris), `aset.js`
   (350 baris) — pola sama dgn `akun.js`/`tx-target.js` sesi ini.
2. **(BERAT)** Lanjut cakupan `keamanan-pin.js` ke 100%: lockout PIN
   (butuh fake `setInterval`/`Date.now` yg bisa dimaju-mundurkan) &
   layar PIN interaktif (`pinPress`/`pinBack`/`checkPin`).
3. `cobek.js` (1261 baris, file fitur terbesar yg masih nol test) —
   disisakan paling akhir, butuh sesi tersendiri utk dipetakan dulu
   strukturnya sebelum nulis test.

`akun.js` & `tx-target.js` SEKARANG SUDAH tidak lagi masuk daftar nol-test.
Daftar modul nol-test yg TERSISA: `aset.js`, `cicilan.js`, `cobek.js`,
`piutang-utang.js`, `tx-list-cashflow.js`, `backup-restore.js`,
`payroll-absensi.js`, `kasir.js`, `sewakios.js`, `renovasi.js`,
`tagihan-kalender.js`, `reset-gaji-mingguan.js`, `modals.js`,
`modal-navigasi.js`, `onboarding.js`, `profil-pengaturan.js`, `kategori.js`,
`kategorisasi-ai.js`, `linktx.js`, `filter-laporan.js`,
`diagnostik-versi.js`, `debug-console.js`, `error-handler.js`,
`features-aiwidget-reminder-gdrive-search.js`,
`features-sheets-pwa-selftest.js`.

## Catatan kerja — 2026-07-11 (bagian ke-24): test `cicilan.js` & `piutang-utang.js` — 2 file dari sisa opsi 1 (SEDANG) di saran bagian ke-23

Konteks: user minta kerjakan saran di CLAUDE.md, 2 file dulu. Dari sisa opsi
1 bagian ke-23 (`cicilan.js` 112 baris, `piutang-utang.js` 351 baris,
`aset.js` 350 baris), dipilih `cicilan.js` (jelas terkecil) & `piutang-utang.js`
— BUKAN `aset.js` walau baris nyaris sama (350 vs 351), karena `aset.js`
juga memuat `IDBStore` (helper generik IndexedDB async, co-located tapi
beda domain) yg butuh mock `indexedDB` terpisah & menambah kompleksitas
signifikan tanpa menambah nilai test yg sepadan — lebih pas disisakan sesi
tersendiri (lihat saran #1 di bawah).

**Tidak ada bug ditemukan** — sesi ini murni menambah test yg sebelumnya
nol utk 2 modul ini, tidak ada perubahan di kode aplikasi.

**File baru: `tests/cicilan.test.js` (32 test, seluruh fungsi `cicilan.js`).**
Cakupan: `validateCicilanFields()` (total kosong/≤0, tenor invalid, bunga
negatif — masing2 toast+focus sesuai field, bunga kosong dianggap 0/valid),
`calcCicilanPerBulanFromTotal()`/`calcCicilanTotalFromPerBulan()` (kalkulasi
murni dgn & tanpa bunga), `syncCicilanPreview()` (sumber 'total' vs
'perbulan', nilai 0/kosong -> sembunyikan preview & kosongkan field lawan,
label "Lunas setelah ini" saat tenor 1, porsi shared mode pct vs nominal —
termasuk field mana yg ditulis-ulang vs dibiarkan sbg input asli user,
efek src='sharedPct'/'sharedNominal' ke `cicilanSharedLastInput`),
`getCicilanSharedMine()` (checkbox off, mode pct & nominal dgn clamp
1-99%/0..perBulanFull), `toggleCicilanSharedFields()`, `syncCicilanDate()`
(guard curPayMethod≠cicilan & cicilanDateLinked, sinkron 2 arah tanggal),
dan `openCicilanHistoryFromTx()` (guard billId kosong, buka riwayat).

**File baru: `tests/piutang-utang.test.js` (45 test, seluruh fungsi
`piutang-utang.js` — Piutang/Debt/DebtStrategy/Bill).** Cakupan:
`Piutang.{openModal,toggleLunas,save,delete,totalValue,overdueDays,
sortedActive,renderList}` (validasi nama, edit vs tambah, urutan prioritas
tagih berdasar overdue×nilai lalu jatuh tempo lalu nilai, banner "Prioritas
tagih"), `Debt.{openModal,toggleLunas,save,syncBill,delete,totalValue,
totalCicilanBulanan,renderList}` — termasuk `syncBill()` yg TIDAK dites
terpisah tapi dibuktikan lewat efeknya di `save()`: auto-bikin `Bill` saat
ada cicilan & belum lunas, auto-hapus `Bill` saat ditandai lunas/cicilan
jadi 0, update (bukan duplikat) `Bill` existing & segarkan `nextDue` kalau
sudah lewat, `DebtStrategy.{setMethod,onExtraInput,activeDebts,
computeOrder,computeDSR,simulate,render}` (avalanche vs snowball order,
DSR dari `Debt.totalCicilanBulanan()`+bill cicilan lain / `WorthIt.incomeAvg()`,
simulasi amortisasi bulanan dgn & tanpa dana ekstra, `Debt.renderList()`
memicu `DebtStrategy.render()` otomatis via `typeof` guard), dan
`Bill.openLinkTxModal()` (guard `curBillHistoryId` kosong, buka `LinkTx`).

**Catatan teknis — `Piutang`/`Debt`/`DebtStrategy`/`Bill` perlu `expose` di
`loadSource()`:** keempatnya dideklarasikan `const` di top-level
`piutang-utang.js`. Beda dari `function` (otomatis nempel ke context vm),
`const` TIDAK otomatis jadi properti context (sudah didokumentasikan di
`loadSource.js`, sama kasusnya dgn `MONTHS_FULL` di catatan lama) — kalau
lupa, `ctx.Piutang` dkk jadi `undefined` & manggil method-nya lempar
`TypeError: Cannot read properties of undefined`. Solusi: tambahkan
`['Piutang','Debt','DebtStrategy','Bill']` sbg parameter `expose` ke-3 di
`loadSource()`. Beda dgn kasus `editAccIdx` (module-scope `let` yg butuh
verifikasi TIDAK LANGSUNG lewat efek samping), di sini `expose` CUKUP krn
`Piutang` dkk adalah objek (referensi) yg method-nya bisa dipanggil
langsung dari luar sesudah di-`expose`, bukan primitif yg di-reassign.

**Catatan teknis lain — hindari `assert.deepEqual`/`deepStrictEqual` utk
objek yg dibuat DI DALAM vm context:** percobaan awal `getCicilanSharedMine()`
ditest dgn `assert.deepEqual(r, {shared:false,pct:null,mine:500000})` GAGAL
walau isinya identik ("same structure but not reference-equal") — sebabnya
objek literal yg dibuat kode di dalam sandbox vm punya `Object.prototype`
dari REALM berbeda (sandbox), sedangkan objek pembanding di test dibuat di
realm Node biasa; `deepStrictEqual` (dipakai `node:assert/strict`) ikut
membandingkan prototype makanya gagal walau isi sama. Diperbaiki dgn
assert per-field (`assert.equal(r.shared,...)` dst) — pola yg sama harus
dipakai kalau modul lain nanti mengembalikan objek literal dari dalam vm.

**Diverifikasi:**
- `node --test tests/*.test.js` → **520/520 pass, 0 fail** (naik dari 443
  di bagian ke-23, +77 test baru [32 cicilan + 45 piutang-utang], 0 regresi).
- `node build.js` → sukses, 0 error dari lint guard bawaan, versi naik
  otomatis ke `kw80-merge-advisor-card-dashcards-38` (build #163), kedua
  bundle lolos `node --check` sintaks, `FILE-MAP.md` diregenerasi.
- `npm run lint`/`npx eslint` masih TIDAK bisa dites di sesi ini (sandbox
  tanpa internet, `npm install` gagal 403) — tolong jalankan `npm run lint`
  di lokal sebelum merge/release (sudah menumpuk beberapa file test baru
  dari bagian ke-21/22/23/24 yg belum divalidasi lint-nya).

**Untuk sesi berikutnya — pilihan saran, urut dari paling ringan:**
1. **(SEDANG-BERAT)** `aset.js` (350 baris, TERSISA dari opsi 1 bagian
   ke-22/23) — pola sama dgn modul lain, TAPI perlu extra effort utk
   `IDBStore` (helper generik IndexedDB async yg co-located di file yg
   sama): perlu mock `indexedDB` (mis. via `fake-indexeddb` package kalau
   tersedia offline, atau stub manual `indexedDB.open()`), sedangkan
   `AlokasiAset`/`Aset`/`TimelineW` bisa pakai pola fakeDocument biasa.
   Pertimbangkan pisah jadi 2 test file (`aset.test.js` utk 3 modul sync,
   `idb-store.test.js` khusus async) biar lebih rapi.
2. **(BERAT)** Lanjut cakupan `keamanan-pin.js` ke 100%: lockout PIN
   (butuh fake `setInterval`/`Date.now` yg bisa dimaju-mundurkan) &
   layar PIN interaktif (`pinPress`/`pinBack`/`checkPin`).
3. `cobek.js` (1261 baris, file fitur terbesar yg masih nol test) —
   disisakan paling akhir, butuh sesi tersendiri utk dipetakan dulu
   strukturnya sebelum nulis test.

`cicilan.js` & `piutang-utang.js` SEKARANG SUDAH tidak lagi masuk daftar
nol-test. Daftar modul nol-test yg TERSISA: `aset.js`, `cobek.js`,
`tx-list-cashflow.js`, `backup-restore.js`, `payroll-absensi.js`,
`kasir.js`, `sewakios.js`, `renovasi.js`, `tagihan-kalender.js`,
`reset-gaji-mingguan.js`, `modals.js`, `modal-navigasi.js`, `onboarding.js`,
`profil-pengaturan.js`, `kategori.js`, `kategorisasi-ai.js`, `linktx.js`,
`filter-laporan.js`, `diagnostik-versi.js`, `debug-console.js`,
`error-handler.js`, `features-aiwidget-reminder-gdrive-search.js`,
`features-sheets-pwa-selftest.js`.

## Catatan kerja — 2026-07-11 (bagian ke-25): test `aset.js` — saran #1 (SEDANG-BERAT) dari bagian ke-24

Konteks: user minta kerjakan saran di CLAUDE.md, 2 file. Dari saran bagian
ke-24, dipilih saran #1: `aset.js` (350 baris, TERSISA terakhir dari opsi 1
bagian ke-22/23/24) — dipecah jadi **2 file test** persis seperti yang
disarankan, karena `IDBStore` (helper generik IndexedDB async, co-located di
file yang sama tapi beda domain) butuh mock `indexedDB` async terpisah dari
3 modul sync lain (`AlokasiAset`/`Aset`/`TimelineW`) yang cukup pakai pola
fakeDocument biasa.

**Tidak ada bug ditemukan** — sesi ini murni menambah test yg sebelumnya nol
utk `aset.js`, tidak ada perubahan di kode aplikasi.

**File baru: `tests/aset.test.js` (47 test, 3 modul sync `aset.js`).**
Cakupan: `ALOKASI_PRESETS` (sanity tiap preset total 100%), `AlokasiAset.{
setRisk,onDanaInput,renderOne,renderAll,init}` (render ulang setelah ganti
risiko/dana, chip aktif sesuai index risk konservatif/moderat/agresif, risk
tidak dikenal -> box TIDAK ditulis ulang, dana fallback ke `totalSaldoAkun()`
kalau belum ada tersimpan, banner ajakan buat target Dana Darurat vs progress
ddInfo kalau sudah ada termasuk jalur `accountId` via `recalcAccBalance`),
`Aset.{openModal,updateProfitPreview,toggleZakatable,save,delete,renderList,
totalValue}` (mode tambah vs edit, hitung untung/rugi & class green/red,
validasi nama kosong, hitung `keuntungan`/`keuntunganPct` dari modalInvestasi
kalau ada, editId yang aset-nya sudah hilang, badge zakat & untung/rugi &
status akun tertaut/terhapus di renderList), `PORTFOLIO_LABELS` (regex label
kolom scan portofolio), dan `TimelineW.{avgSurplus,goals,waterfall,
addMonthsToDate,render}` (delegasi ke `Pensiun.avgSurplus()` kalau modul itu
ada, gabungan goal dari proyek Renov & target non-Dana-Darurat, cursor
akumulatif antar goal di waterfall, blok Pensiun on-track vs kurang di render).

**File baru: `tests/idb-store.test.js` (12 test, `IDBStore`).** Mock
`indexedDB` MANUAL dibuat sendiri di file test (bukan pakai package
`fake-indexeddb` — sandbox ini tidak ada akses internet utk `npm install`,
lihat catatan `npm run lint` di bawah) — cukup minimal utk simulasikan
`open()` sukses/gagal, `get`/`put` lewat `transaction()`, dan trigger
`onversionchange`/`onclose` sesuai kontrak yang dipakai `IDBStore`. Cakupan:
`_open()` (`window.indexedDB` tidak ada, cache promise supaya `open()` cuma
sekali, `open()` gagal -> cache di-reset, `onversionchange`/`onclose` ->
db ditutup & cache di-reset), `get`/`set` jalur sukses biasa, dan
`_withRetry()` — bagian paling penting: error biasa TIDAK retry, tapi
`InvalidStateError` ATAU pesan mengandung "closing" (khas Safari) dianggap
koneksi basi -> buang cache & retry SEKALI, kalau percobaan ke-2 juga gagal
baru menyerah & balikin fallback (`undefined` utk `get`, `false` utk `set` —
beda default sesuai yg di-pass masing2 pemanggil).

**Catatan teknis — expose semua modul `const` di `aset.js`, bukan cuma yang
langsung relevan:** selain `ALOKASI_PRESETS`/`PORTFOLIO_LABELS` yang jelas
dibutuhkan, `AlokasiAset`/`Aset`/`TimelineW`/`IDBStore` SEMUA dideklarasikan
`const` di top-level file ini jadi SEMUA perlu masuk parameter `expose` ke-3
`loadSource()` (bukan cuma yang mau dites langsung di 1 file test) — sempat
lupa expose `AlokasiAset`/`Aset`/`TimelineW` di awal & muncul error
`ctx.AlokasiAset`/`ctx.Aset`/`ctx.TimelineW` adalah `undefined`.

**Catatan teknis lain — `AlokasiAset.renderOne()` TIDAK merender
`preset.label`** (cuma `preset.desc` + item2), jadi assert render ulang di
test `setRisk`/`init`/`renderAll` pakai potongan teks `preset.desc` (mis.
"Seimbang antara peluang pertumbuhan..."), BUKAN nama preset ("⚖️ Moderat")
— sempat salah asumsi di percobaan pertama.

**Catatan teknis lain — urutan `openModal()` vs isi field form saat test edit
`Aset.save()`:** `Aset.openModal(id)` PREFILL semua field dari data aset
lama (termasuk nama/nilai), jadi kalau field form di-set duluan lewat
`domValues` SEBELUM `openModal()` dipanggil, nilainya bakal KETIMPA lagi oleh
data lama. Pola yang benar (sama seperti `_saveAccInner` edit test di
`akun.test.js`): panggil `openModal(id)` dulu, BARU ubah `fakeDocument.
getElementById(...).value` sesudahnya utk simulasikan user mengedit.

**Diverifikasi:**
- `node --test tests/*.test.js` → **579/579 pass, 0 fail** (naik dari 520 di
  bagian ke-24, +59 test baru [47 aset.test.js + 12 idb-store.test.js],
  0 regresi).
- `node build.js` → sukses, 0 error dari lint guard bawaan, versi naik
  otomatis ke `kw80-merge-advisor-card-dashcards-39` (build #164), kedua
  bundle lolos `node --check` sintaks, `FILE-MAP.md` diregenerasi (`aset.js`
  otomatis hilang dari daftar "nol-test" begitu digenerate ulang — cek
  daftar di bawah, bukan di FILE-MAP.md, krn itu bukan yg dilacaknya).
- `npm run lint`/`npx eslint` masih TIDAK bisa dites di sesi ini (sandbox
  tanpa internet, `npm install`/`npx eslint` gagal 403) — tolong jalankan
  `npm run lint` di lokal sebelum merge/release (sudah menumpuk beberapa
  file test baru dari bagian ke-21/22/23/24/25 yg belum divalidasi lint-nya).

**Untuk sesi berikutnya — pilihan saran, urut dari paling ringan:**
1. **(BERAT)** Lanjut cakupan `keamanan-pin.js` ke 100%: lockout PIN (butuh
   fake `setInterval`/`Date.now` yg bisa dimaju-mundurkan) & layar PIN
   interaktif (`pinPress`/`pinBack`/`checkPin`).
2. `cobek.js` (1261 baris, file fitur terbesar yg masih nol test) — disisakan
   paling akhir, butuh sesi tersendiri utk dipetakan dulu strukturnya sebelum
   nulis test.
3. Modul menengah yg masih nol test (350 baris ke bawah, pola serupa modul yg
   sudah dites): `tx-list-cashflow.js`, `backup-restore.js`,
   `payroll-absensi.js`, `kasir.js`, `sewakios.js`, `renovasi.js`,
   `tagihan-kalender.js`.

`aset.js` SEKARANG SUDAH tidak lagi masuk daftar nol-test (baik 3 modul
sync-nya maupun `IDBStore`). Daftar modul nol-test yg TERSISA: `cobek.js`,
`tx-list-cashflow.js`, `backup-restore.js`, `payroll-absensi.js`, `kasir.js`,
`sewakios.js`, `renovasi.js`, `tagihan-kalender.js`, `reset-gaji-mingguan.js`,
`modals.js`, `modal-navigasi.js`, `onboarding.js`, `profil-pengaturan.js`,
`kategori.js`, `kategorisasi-ai.js`, `linktx.js`, `filter-laporan.js`,
`diagnostik-versi.js`, `debug-console.js`, `error-handler.js`,
`features-aiwidget-reminder-gdrive-search.js`, `features-sheets-pwa-selftest.js`.
(`keamanan-pin.js` TIDAK termasuk daftar ini — sudah PARSIAL ada test dari
sesi lebih lama, cek `tests/keamanan-pin.test.js` & catatan kerja terkait utk
lihat fungsi apa saja yg masih kosong.)

## Catatan kerja — 2026-07-11 (bagian ke-26): test `tx-list-cashflow.js` (dipecah jadi 2 file test)

Konteks: user minta kerjakan 2 file "menengah" dari daftar nol-test di
bagian ke-25. Dipilih `tx-list-cashflow.js` (160 baris, 9 fungsi: `txHTML`,
`delTx`, `changeMonth`, `setTxListPeriode`, `getTxListRange`, `setPeriode`,
`getRange`, `computeCashflowForecast`, `setKeuanganTab`) — sebelumnya nol
test sama sekali.

**Tidak ada bug ditemukan** — sesi ini murni menambah test yg sebelumnya nol
utk `tx-list-cashflow.js`, tidak ada perubahan di kode aplikasi.

**Dipecah jadi 2 file test** (bukan 1), pola sama seperti `aset.js` →
`aset.test.js` + `idb-store.test.js` di bagian ke-25 — file ini punya 2
kelompok fungsi dgn kebutuhan mock yg beda jauh:

**File baru: `tests/tx-list-cashflow-render.test.js` (22 test).** Kelompok
render/filter yg cukup di-stub DOM sederhana: `txHTML` (icon/warna sesuai
tipe & kategori, transfer selalu ⇄, fallback icon default kalau kategori tak
ketemu, acc-chip, subcategory/note, badge payMethod), `changeMonth` (wrap
bulan/tahun ke depan & ke belakang), `setTxListPeriode`+`getTxListRange`
(selamanya/bulan/hari/minggu/tahun/custom), `setPeriode`+`getRange` (versi
Laporan, elemen DOM beda dari List Transaksi tapi logic serupa),
`setKeuanganTab` (toggle panel kelola vs laporan, fallback pilih tombol dari
querySelectorAll kalau `el` tidak diberikan).

**File baru: `tests/tx-list-cashflow-deltx.test.js` (24 test).** Kelompok
side-effect berat: `delTx` (18 test mencakup semua cabang: batal konfirmasi,
tanpa link, bbmLinkId, stockItems multi-produk + clamp ke 0, stockProductId
single-produk, cobekLinkId dgn/tanpa items dgn/tanpa entry ketemu,
servisLinkId dgn/tanpa usedPartId dgn/tanpa D.servisLogs, renovItemLinkId/
wishlistLinkId/sewaKiosLinkId/tukangPaymentEntryIds beserta suffix toast
masing2) & `computeCashflowForecast` (6 test: default vs BudgetReko
terdefinisi, incAvg/expAvg dari transaksi dlm rentang, billsDue dari
tagihan ≤30 hari, projected).

**Catatan teknis — 2 edge case toast `delTx` yg gampang salah asumsi kalau
cuma baca sekilas:**
- `stockProductId` set tapi produknya sudah tidak ada di `D.products`:
  TIDAK ADA toast sama sekali (bukan toast generik "🗑 Dihapus") — toast
  stok butuh `p` ketemu, sedangkan toast generik di baris akhir ditekan
  krn kondisinya cuma cek `t.stockProductId` truthy, TIDAK peduli apakah
  produknya ketemu atau tidak.
- `servisLinkId` set tapi `D.servisLogs` tidak ada sama sekali: seluruh
  blok servis (termasuk toast "🔧 Catatan servis...") dilewati krn guard
  `&&D.servisLogs`, TAPI toast generik di akhir JUGA ikut tertekan (kondisi
  akhir cuma cek `t.servisLinkId`, tidak peduli `D.servisLogs` ada atau
  tidak) — hasilnya TIDAK ADA toast sama sekali di kasus ini, sempat salah
  tebak di percobaan pertama (dikira toast generik tetap muncul).

**Catatan teknis lain — variabel global bebas vs module-scoped `let`:**
`curMonth`/`curYear`/`txListPage`/`filterPeriode` dideklarasikan di
`features-helpers-global-security.js` (bukan di `tx-list-cashflow.js`),
diassign langsung tanpa `let` di file ini — sama pola dgn
`cicilanLastInput` dkk di `cicilan.test.js`: bisa diinject & dibaca balik
langsung lewat `extraGlobals` `loadSource()`, TANPA trik `expose`.
`txListPeriode` BEDA — itu `let txListPeriode='bulan'` module-scoped DI
DALAM `tx-list-cashflow.js` sendiri, jadi dites lewat parameter `expose`
`loadSource()` (dibaca via `ctx.txListPeriode` setelah `expose:
['txListPeriode']`) — beda dari pola `editAccIdx` di `akun.test.js` yg
sengaja TIDAK dibaca langsung (di sini dibaca langsung krn tidak perlu
verifikasi lewat pemanggil kedua, cukup baca state akhir).

**Diverifikasi:**
- `node --test tests/*.test.js` → **625/625 pass, 0 fail** (naik dari 579
  di bagian ke-25, +46 test baru [22 render + 24 deltx/forecast], 0 regresi).
- `node build.js` → sukses, versi naik otomatis ke
  `kw80-merge-advisor-card-dashcards-40` (build #165), kedua bundle lolos
  `node --check` sintaks, `FILE-MAP.md` diregenerasi (52 file — 2 file test
  baru ikut kehitung di index fungsi global, `tx-list-cashflow.js` otomatis
  hilang dari daftar nol-test).
- `node --check tx-list-cashflow.js` → sintaks OK (tidak ada kode aplikasi
  yg diubah sesi ini).
- `npm run lint`/`npx eslint` TIDAK bisa dites di sesi ini (sandbox tanpa
  internet, `npm install`/`npx eslint` gagal 403) — sama seperti
  keterbatasan sesi-sesi sebelumnya, tolong jalankan `npm run lint` sebelum
  merge/release.
- Smoke-test browser TIDAK dijalankan ulang sesi ini — perubahan murni
  penambahan file test, tidak menyentuh kode runtime app sama sekali
  (`tx-list-cashflow.js` tidak diubah), jadi risiko regresi UI nol.

**Untuk sesi berikutnya — daftar modul nol-test yg TERSISA (2 sudah
selesai sesi ini):** `cobek.js` (1261 baris, terbesar, disisakan paling
akhir — butuh sesi tersendiri utk dipetakan strukturnya dulu),
`backup-restore.js`, `payroll-absensi.js`, `kasir.js`, `sewakios.js`,
`renovasi.js`, `tagihan-kalender.js`, `reset-gaji-mingguan.js`, `modals.js`,
`modal-navigasi.js`, `onboarding.js`, `profil-pengaturan.js`, `kategori.js`,
`kategorisasi-ai.js`, `linktx.js`, `filter-laporan.js`,
`diagnostik-versi.js`, `debug-console.js`, `error-handler.js`,
`features-aiwidget-reminder-gdrive-search.js`,
`features-sheets-pwa-selftest.js`.

## Catatan kerja — 2026-07-11 (bagian ke-27): test `kategori.js` + `kategorisasi-ai.js`

Konteks: user minta kerjakan 2 file "kecil" dari daftar nol-test di bagian
ke-26. Dipilih `kategori.js` (167 baris, 19 fungsi: CRUD Kategori & Subkategori
+ filter dropdown) dan `kategorisasi-ai.js` (185 baris, objek `AutoKat` dgn
6 method: AI auto-kategorisasi dari catatan bebas Input Transaksi) —
sebelumnya nol test sama sekali utk keduanya.

**Tidak ada bug ditemukan** — sesi ini murni menambah test yg sebelumnya
nol utk kedua file, tidak ada perubahan di kode aplikasi.

**File baru: `tests/kategori.test.js` (56 test).** Cakupan: `getAllCats`/
`getCatsByType`/`getCat`/`getCatByType` (termasuk kasus nama kategori
duplikat di income & expense — dipilih yg subs-nya paling banyak),
`uniqueCatList`/`subNamesForCat`, `populateCatSelect`/`populateSubSelect`
(preserve value lama kalau masih valid, reset ke "semua" kalau tidak),
`openCatModal`/`delCatFromModal`/`setCatModalType`/`refreshTxCatIfOpen`,
`saveCat`/`delCat` (rename kategori ikut menyesuaikan `category` di
transaksi & bills, pesan konfirmasi beda utk kategori bawaan/default vs
kategori yg masih dipakai transaksi), `openSubCatModal`/`saveSubCat`/
`delSubCat` (rename subkategori ikut menyesuaikan `subcategory` di
transaksi & bills — HANYA yg `category`-nya juga cocok), `toggleCatGroup`,
`filterCat`.

**File baru: `tests/kategorisasi-ai.test.js` (34 test).** Cakupan seluruh
method `AutoKat`: `onNoteInput` (debounce 750ms, tebakan lokal instan hanya
utk expense & field kategori kosong), `hideSuggest`, `runAiSuggest`
(guard: catatan <4 char, tanpa API key, catatan sama dgn query terakhir,
tidak ada kategori sama sekali, AI balas kategori di luar daftar yg
diizinkan → diabaikan, respons gagal/error/JSON tidak valid → ditangkap
diam-diam, field Keterangan berubah sejak request dikirim → saran basi
tidak ditampilkan, token check request basi), `renderSuggest`, `apply`
(isi kategori+subkategori via `selectTxCat`/`selectTxSubCat` atau fallback
`txCat.value` langsung, lalu "belajar" ke `D.learnedItemCat`), `learnFromNote`
(filter stopword/angka/kata <4 huruf, maksimal 4 kata kunci per catatan).

**Catatan teknis — dependency lintas-file yg perlu di-stub manual:**
- `kategori.js`: state module-scoped (`catEditIdx`/`curCatModalType`/
  `catModalCallback`/`subCatParentId`/`subCatParentType`/`subCatEditId`/
  `curCatFilter`) TIDAK dideklarasikan `let` di file ini sendiri (dideklarasikan
  di `features-helpers-global-security.js`) — pola sama dgn `curMonth`/
  `curYear` di `tx-list-cashflow.test.js`: diinject & dibaca balik langsung
  lewat `extraGlobals` `loadSource()`, tanpa trik `expose`.
- `kategori.js`: `DEFAULT_CATS` didefinisikan di `renovasi.js` (di luar
  cakupan test ini) — di-stub `{income:[],expense:[]}` per default, sama
  pola dgn `identitas.test.js`.
- `kategori.js`: `populateCatSelect` baca `[...sel.options]` (bukan cuma
  `innerHTML`) buat cek value lama masih valid — `fakeDom.js` TIDAK
  mem-parsing `innerHTML` jadi elemen beneran, jadi ditambah helper lokal
  `withOptionsSupport(el)` (override `innerHTML` jadi accessor yg
  meng-extract `<option value="...">` via regex ke `el.options`) khusus
  test file ini, TIDAK diubah di `helpers/fakeDom.js` bersama (supaya tidak
  mempengaruhi test lain).
- `kategorisasi-ai.js`: `getCatsByType` berasal dari `kategori.js` (tidak
  di-load bareng) — di-stub baca langsung dari `D.categories[type]`.
- `kategorisasi-ai.js`: `setTimeout`/`clearTimeout` bawaan `loadSource()`
  cuma stub no-op (return 0, TIDAK menjalankan callback) — disuntik fake
  timer LOKAL (simpan `{id,fn,ms}`, TIDAK auto-invoke) via `extraGlobals`,
  supaya `onNoteInput` bisa dites bagian debounce-nya (terjadwal/clearTimeout)
  terpisah dari `runAiSuggest` yg dites LANGSUNG (tanpa lewat timer) — pola
  sama semangatnya dgn `_saveAccInner`/`_saveInner` di file lain.

**Catatan teknis — jebakan yg sempat salah di percobaan pertama:**
- Field DOM (`catName`/`catEmoji`) yg di-set lewat `domValues` SEBELUM
  `openCatModal()` dipanggil ketimpa lagi oleh `openCatModal()` (persis
  peringatan yg sudah didokumentasikan di bagian ke-24 soal `openModal()`
  vs `domValues`) — diperbaiki: panggil `openCatModal()` dulu, baru set
  `fakeDocument.getElementById(...).value` sesudahnya.
- Return value function yg lahir di dalam vm context (array/objek dari
  `getCat`/`uniqueCatList`/`subNamesForCat`) TIDAK bisa dibandingkan pakai
  `assert.deepEqual`/`deepStrictEqual` (beda prototype/realm dgn host,
  sudah didokumentasikan di `aset.test.js`/`fi-calc.test.js`) — dipakai
  helper lokal `sameJson()` (`JSON.stringify` kedua sisi) di
  `kategori.test.js`.
- `opts.selectTxCat || defaultFn` di helper `makeAutoKat` awalnya bikin
  test "selectTxCat tidak tersedia (fallback ke txCat.value)" gagal karena
  `undefined || defaultFn` tetap balik `defaultFn` — diperbaiki pakai
  `'selectTxCat' in opts ? opts.selectTxCat : defaultFn` supaya `undefined`
  yg SENGAJA dioper tidak diam-diam ketimpa.

**Diverifikasi:**
- `node --test tests/*.test.js` → **715/715 pass, 0 fail** (naik dari 625
  di bagian ke-26, +90 test baru [56 kategori + 34 kategorisasi-ai], 0 regresi).
- `node build.js` → sukses, versi naik otomatis ke
  `kw80-merge-advisor-card-dashcards-41` (build #166), kedua bundle lolos
  `node --check` sintaks, `FILE-MAP.md` diregenerasi (50 file, 852
  identifier — `kategori.js`/`kategorisasi-ai.js` otomatis hilang dari
  daftar nol-test).
- `npm run lint`/`npx eslint` TIDAK bisa dites di sesi ini (sandbox tanpa
  internet, `npm install`/`npx eslint` gagal 403) — sama seperti
  keterbatasan sesi-sesi sebelumnya, tolong jalankan `npm run lint` sebelum
  merge/release.
- Smoke-test browser TIDAK dijalankan ulang sesi ini — perubahan murni
  penambahan file test, tidak menyentuh kode runtime app sama sekali
  (`kategori.js`/`kategorisasi-ai.js` tidak diubah), jadi risiko regresi
  UI nol.

**Untuk sesi berikutnya — daftar modul nol-test yg TERSISA (2 sudah
selesai sesi ini):** `cobek.js` (1261 baris, terbesar, disisakan paling
akhir — butuh sesi tersendiri utk dipetakan strukturnya dulu),
`backup-restore.js`, `payroll-absensi.js`, `kasir.js`, `sewakios.js`,
`renovasi.js`, `tagihan-kalender.js`, `reset-gaji-mingguan.js`, `modals.js`,
`modal-navigasi.js`, `onboarding.js`, `profil-pengaturan.js`, `linktx.js`,
`filter-laporan.js`, `diagnostik-versi.js`, `debug-console.js`,
`error-handler.js`, `features-aiwidget-reminder-gdrive-search.js`,
`features-sheets-pwa-selftest.js`.

## Catatan kerja — 2026-07-11 (bagian ke-28): test `error-handler.js` + `onboarding.js`

Konteks: lanjutan daftar modul nol-test dari bagian ke-27, dikerjakan dari yang
paling RINGAN dulu (urutan baris): `modals.js` (6 baris, dilewati — murni array
string HTML modal statis, tidak ada logic buat dites) → `error-handler.js` (37
baris) → `onboarding.js` (40 baris). Kedua file ini sebelumnya nol test sama
sekali.

**Tidak ada bug ditemukan** — sesi ini murni menambah test yg sebelumnya nol
utk kedua file, tidak ada perubahan di kode aplikasi.

**File baru: `tests/error-handler.test.js` (11 test).** Cakupan
`_friendlyErrorNotice`: pesan normal (toast dgn detail & durasi 5000ms),
pesan `undefined` (detail dikosongkan, bukan jadi string `": undefined"`),
pesan >120 karakter dipotong, throttle 3 detik (panggilan kedua dlm window
diabaikan, tepat di batas 3000ms jalan lagi), fallback ke `console.warn`
kalau `toast` belum jadi function, error yg dilempar `toast()` sendiri
ditangkap diam-diam (tidak crash). Juga dites 2 listener global
`window.addEventListener('error'/'unhandledrejection', ...)`: format
`console.error` yg benar (`e.error||e.message` utk listener error,
`e.reason` utk unhandledrejection), serta bukti kedua listener berbagi
throttle counter yang sama (`_lastErrorToastAt` global, bukan per-listener).

**File baru: `tests/onboarding.test.js` (7 test).** Cakupan
`updateOnboardPreview`: guard elemen `obPreviewBox` tidak ada (return dini
tanpa error), rumus estimasi (`gaji×26` hari kerja, dikurangi `kirim×4`),
warna hijau/merah sesuai tanda hasil, fallback `||0` utk input
kosong/non-angka. Cakupan `finishOnboard`: PIN bukan 4 digit ditolak (tidak
menyimpan apapun, `showAlertModal` dipanggil dgn pesan yg benar), alur
sukses (profil tersimpan persis sesuai field, PIN di-hash via `hashPin`,
`_sessionRawPin` ke-set, `kw_pin`/`kw_setup` ke-`safeSetItem`, `save()` &
`showMain()` terpanggil, elemen `#onboard` disembunyikan), & default value
nama/gaji/kiriman kalau field dikosongkan.

**Catatan teknis — kenapa `window`/`Date` perlu di-mock manual utk
`error-handler.js`:** stub bawaan `loadSource()` (`makePermissiveStub`)
sengaja permisif tapi TIDAK stateful — `window.addEventListener(...)`
selalu balik stub baru tanpa nyimpen handler-nya, jadi listener yg
didaftarkan tidak bisa dipanggil balik dari test. Begitu juga `Date.now()`
asli tidak bisa dimaju-mundurkan tanpa nunggu beneran (throttle-nya 3
detik). Solusinya: `extraGlobals: { window: fakeWindow, Date: fakeDate }`
dgn `fakeWindow.addEventListener` yg nyimpen handler ke object biasa
(`listeners[evt]=fn`) & `fakeDate={now:()=>t}` (bisa diubah lewat closure
`setTime()`) — cukup krn `error-handler.js` cuma pakai `Date.now()`, tidak
perlu tiruan class `Date` penuh.

**Catatan teknis — jebakan yg sempat salah di percobaan pertama:**
- Beberapa test awal pakai `time: 1000` sbg waktu awal, tapi
  `_lastErrorToastAt` module-scoped mulai dari `0` — jadi `now(1000)-0=1000`
  masih `<3000`, throttle nge-blok toast PERTAMA yang harusnya lolos.
  Diperbaiki: waktu awal test non-throttle dinaikkan ke `>=3000` (dipakai
  `5000`) supaya panggilan pertama tidak keblokir throttle residual dari
  `_lastErrorToastAt=0`.
- `assert.deepEqual(D.profile, {...})` di `onboarding.test.js` gagal
  (`reference-equal` check) krn `D.profile` lahir di dalam vm context, beda
  prototype/realm dgn object literal host — pola yg sama persis sudah
  didokumentasikan di `aset.test.js`/`fi-calc.test.js`/`kategori.test.js`.
  Diperbaiki: bandingkan lewat `JSON.stringify` kedua sisi.
- `modals.js` (6 baris efektif, isinya cuma 1 array `MODAL_HTML` berisi
  string HTML mentah blok modal) SENGAJA dilewati — bukan "belum sempat",
  tapi memang tidak ada logic murni utk dites di sana (beda dari file lain
  di daftar nol-test yang semuanya punya fungsi).

**Diverifikasi:**
- `node --test tests/*.test.js` → **733/733 pass, 0 fail** (naik dari 715
  di bagian ke-27, +18 test baru [11 error-handler + 7 onboarding], 0 regresi).
- `node build.js` → sukses, versi naik otomatis ke
  `kw80-merge-advisor-card-dashcards-42` (build #167), kedua bundle lolos
  `node --check` sintaks, `FILE-MAP.md` diregenerasi (50 file, 852
  identifier — `error-handler.js`/`onboarding.js` otomatis hilang dari
  daftar nol-test).
- `npm run lint`/`npx eslint` TIDAK bisa dites di sesi ini (sandbox tanpa
  internet, `npm install`/`npx eslint` gagal 403) — sama seperti
  keterbatasan sesi-sesi sebelumnya, tolong jalankan `npm run lint` sebelum
  merge/release.
- Smoke-test browser TIDAK dijalankan ulang sesi ini — perubahan murni
  penambahan file test, tidak menyentuh kode runtime app sama sekali
  (`error-handler.js`/`onboarding.js` tidak diubah), jadi risiko regresi
  UI nol.

**Untuk sesi berikutnya — daftar modul nol-test yg TERSISA (2 sudah
selesai sesi ini, `modals.js` dilewati krn murni data statis tanpa
logic):** `debug-console.js` (48 baris), `diagnostik-versi.js` (76 baris),
`profil-pengaturan.js` (81 baris), `reset-gaji-mingguan.js` (86 baris),
`filter-laporan.js` (220 baris), `kasir.js` (221 baris), `sewakios.js` (242
baris), `linktx.js` (244 baris), `modal-navigasi.js` (284 baris),
`payroll-absensi.js` (365 baris), `renovasi.js` (437 baris),
`tagihan-kalender.js` (443 baris), `backup-restore.js` (718 baris),
`cobek.js` (1261 baris, terbesar, disisakan paling akhir — butuh sesi
tersendiri utk dipetakan strukturnya dulu),
`features-aiwidget-reminder-gdrive-search.js` (1586 baris),
`features-sheets-pwa-selftest.js` (2361 baris). Lanjutkan urutan
ringan→berat: `debug-console.js` berikutnya.

## Catatan kerja — 2026-07-11 (bagian ke-29): test `debug-console.js` + perbaikan test basi Kekayaan Bersih

Konteks: lanjutan daftar modul nol-test dari bagian ke-28, urutan ringan→berat:
`debug-console.js` (48 baris) berikutnya. Sesi ini juga memperbaiki 1 test
in-app (`getSelfTestCases()` di `features-sheets-pwa-selftest.js`) yang gagal
karena rumus ekspektasinya basi, ketinggalan dari formula asli `renderBersih()`.

**Perbaikan test basi (bukan bug aplikasi):** test "Buku Aset: totalAssetValue()
& Kekayaan Bersih konsisten" cuma bandingkan `saldoAkun+totalAset-utangManual`,
padahal `Kekayaan.renderBersih()` (modules-calc.js) sudah lama diperluas ikut
memasukkan `totalPiutangValue()` (piutang menambah) dan `totalDebtValue()`
(utang tercatat lain, bukan cuma `utangJT` manual) ke rumus Kekayaan Bersih.
Diperbaiki: rumus ekspektasi di test disamakan dgn `renderBersih()` +
pesan assert ditambah nilai aktual vs ekspektasi biar lebih gampang didiagnosis
kalau gagal lagi nanti.

**File baru: `tests/debug-console.test.js` (14 test).** Cakupan
`updateDebugConsoleBtn` (tombol tidak ada -> return dini, teks sesuai status
aktif/tidak) & `toggleDebugConsole`: alur mematikan (hapus key, `eruda.destroy()`
dipanggil HANYA kalau `window.eruda` ada, error dari `destroy()` ditangkap diam-diam),
alur mengaktifkan saat eruda SUDAH pernah dimuat (`window.eruda` ada -> langsung
`eruda.init()`, tidak bikin `<script>` baru), dan alur lazy-load CDN saat eruda
BELUM pernah dimuat (key `kw_debug_console` di-set OPTIMIS duluan sebelum script
selesai load, `<script>` di-append ke `document.head` kalau ada / fallback ke
`document.documentElement`, `onload` sukses vs `onload` yg `eruda.init()`-nya
error tetap toast+update tombol tapi pesannya beda, `onerror` rollback key +
toast pesan butuh internet).

**Catatan teknis — kenapa `window.eruda` & `eruda` (bare global) perlu disuntik
manual biar konsisten:** di browser asli, `window` ADALAH global object, jadi
`window.eruda` dan bare `eruda` otomatis nunjuk objek yang sama begitu script
CDN eruda selesai load. Stub `loadSource()` yang dipakai di sini `window` cuma
objek biasa terpisah dari context vm top-level, jadi kalau tidak disamakan
manual, `if(window.eruda)` (dipakai `toggleDebugConsole` utk pre-check) & bare
`eruda.init()`/`eruda.destroy()` (dipakai langsung, bukan lewat `window.`) bisa
nunjuk 2 objek beda dan test jadi salah baca. Solusi: helper `setEruda()`/opsi
`erudaPresent` di test set KEDUANYA (`fakeWindow.eruda` dan `ctx.eruda`) ke
objek yang sama.

**Diverifikasi:**
- `node --test tests/*.test.js` → **747/747 pass, 0 fail** (naik dari 733 di
  bagian ke-28, +14 test baru [debug-console], 0 regresi).
- `node build.js` → sukses, versi naik otomatis, kedua bundle lolos
  `node --check` sintaks, `FILE-MAP.md` diregenerasi (`debug-console.js`
  otomatis hilang dari daftar nol-test).
- `npm run lint`/`npx eslint` TIDAK bisa dites di sesi ini (sandbox tanpa
  internet, `npm install` gagal) — tolong jalankan `npm run lint` sebelum
  merge/release.
- Smoke-test browser TIDAK dijalankan ulang sesi ini — perubahan test murni
  tidak menyentuh `debug-console.js`/`modules-calc.js` (logic asli tidak
  diubah, cuma rumus ekspektasi di 1 test in-app), risiko regresi UI nol.

**Untuk sesi berikutnya — daftar modul nol-test yg TERSISA (1 sudah selesai
sesi ini):** `diagnostik-versi.js` (76 baris), `profil-pengaturan.js` (81
baris), `reset-gaji-mingguan.js` (86 baris), `filter-laporan.js` (220 baris),
`kasir.js` (221 baris), `sewakios.js` (242 baris), `linktx.js` (244 baris),
`modal-navigasi.js` (284 baris), `payroll-absensi.js` (365 baris),
`renovasi.js` (437 baris), `tagihan-kalender.js` (443 baris),
`backup-restore.js` (718 baris), `cobek.js` (1261 baris, terbesar, disisakan
paling akhir), `features-aiwidget-reminder-gdrive-search.js` (1586 baris),
`features-sheets-pwa-selftest.js` (2361 baris). Lanjutkan urutan
ringan→berat: `diagnostik-versi.js` berikutnya.

## Catatan kerja — 2026-07-11 (bagian ke-30): test `diagnostik-versi.js`

Konteks: lanjutan daftar modul nol-test dari bagian ke-29, urutan ringan→berat:
`diagnostik-versi.js` (76 baris) berikutnya. Tidak ada bug ditemukan — murni
menambah test yg sebelumnya nol, tidak ada perubahan di kode aplikasi.

**File baru: `tests/diagnostik-versi.test.js` (17 test).** Cakupan
`getHtmlSnapshotForSelfTest` (proxy tipis ke `document.documentElement.outerHTML`),
`computeProductionSyncStatus` (sinkron vs ketinggalan, format label beda antara
2 cabang — cabang sinkron pakai prefix `v` sebelum nomor versi, cabang
ketinggalan TIDAK), `computeModuleSyncStatus` (semua sinkron, 1 modul
ketinggalan, variabel versi modul belum ke-load sama sekali via
`typeof x!=='undefined'`), IIFE `_checkModuleVersionSync` yang **jalan
otomatis saat file di-load** (semua sinkron → tidak ada warn/toast; 1 atau
lebih modul beda versi → console.warn + toast durasi 6000 berisi daftar file
bermasalah; `toast` belum jadi function → tetap warn, tidak crash; error tak
terduga di dalam cek → ditangkap `catch` luar, lapor via `console.error`), dan
`computeFileSizeStatus` (boundary persis di `FILE_SIZE_WARN_BYTES`=2.0MB &
`FILE_SIZE_ACTION_BYTES`=2.5MB, termasuk kasus off-by-one 1 byte di bawah
tiap ambang).

**Catatan teknis — kenapa test file ini beda pola dari file lain:** IIFE
top-level `_checkModuleVersionSync()` di `diagnostik-versi.js` jalan sekali
otomatis PERSIS saat `loadSource()` mengeksekusi file (bukan saat fungsi
dipanggil manual seperti file lain) — jadi tiap skenario kombinasi versi beda
butuh `loadSource()` BARU (tidak bisa reuse 1 `ctx` utk banyak `test()` spt
pola file lain di repo ini), karena side-effect-nya sudah "kejadian" di
load-time, tidak bisa di-reset.

**Catatan teknis — jebakan yg sempat salah di percobaan pertama:** versi test
awal dipakai `'v100'`/`'v50'` dst sbg NILAI variabel (mis.
`MODAL_VERSION='v99'`), padahal source-nya sendiri sudah nambahin prefix `'v'`
di beberapa tempat (`'...v'+modalVersion`) — hasilnya jadi dobel `vv99` di
pesan. Diperbaiki: nilai versi di test pakai angka polos tanpa prefix
(`'100'`, `'99'`, dst), meniru cara `APP_BUILD_VERSION` asli dipakai
(angka/label build, prefix `v` cuma ditambah di template string tempat
dipakai, tidak di value-nya). Juga 1 test awal cuma nge-override
`APP_BUILD_VERSION` sendirian tanpa nyamain versi modul lain ke nilai yg sama
→ salah nangkep `allOk` jadi `false` padahal maksudnya semua-sinkron;
diperbaiki dgn override eksplisit ke-5 variabel versi ke nilai yg sama.

**Diverifikasi:**
- `node --test tests/*.test.js` → **764/764 pass, 0 fail** (naik dari 747 di
  bagian ke-29, +17 test baru [diagnostik-versi], 0 regresi).
- `node build.js` → sukses, versi naik otomatis, kedua bundle lolos
  `node --check` sintaks, `FILE-MAP.md` diregenerasi (`diagnostik-versi.js`
  otomatis hilang dari daftar nol-test).
- `npm run lint`/`npx eslint` TIDAK bisa dites di sesi ini (sandbox tanpa
  internet) — tolong jalankan `npm run lint` sebelum merge/release.
- Smoke-test browser TIDAK dijalankan ulang sesi ini — perubahan test murni,
  `diagnostik-versi.js` tidak diubah sama sekali, risiko regresi UI nol.

**Untuk sesi berikutnya — daftar modul nol-test yg TERSISA (1 sudah selesai
sesi ini):** `profil-pengaturan.js` (81 baris), `reset-gaji-mingguan.js` (86
baris), `filter-laporan.js` (220 baris), `kasir.js` (221 baris), `sewakios.js`
(242 baris), `linktx.js` (244 baris), `modal-navigasi.js` (284 baris),
`payroll-absensi.js` (365 baris), `renovasi.js` (437 baris),
`tagihan-kalender.js` (443 baris), `backup-restore.js` (718 baris),
`cobek.js` (1261 baris, terbesar, disisakan paling akhir),
`features-aiwidget-reminder-gdrive-search.js` (1586 baris),
`features-sheets-pwa-selftest.js` (2361 baris). Lanjutkan urutan
ringan→berat: `profil-pengaturan.js` berikutnya.

## Catatan kerja — 2026-07-11 (bagian ke-31): test `profil-pengaturan.js`

Konteks: lanjutan daftar modul nol-test dari bagian ke-30, urutan
ringan→berat: `profil-pengaturan.js` (81 baris) berikutnya. Tidak ada bug
ditemukan — murni menambah test yg sebelumnya nol, tidak ada perubahan di
kode aplikasi.

**File baru: `tests/profil-pengaturan.test.js` (31 test).** Cakupan
`autoSaveProfile` (baca semua input form profil & tulis ke `D.profile`,
fallback default nama/gaji/kiriman kalau kosong/non-angka, field opsional
lembur/tarif-minggu/tanggal-lahir/API-key/provider yg masing2 dijaga guard
`if(el)` sendiri, `persistApiKeyEncrypted()` cuma jalan kalau elemen
`sApiKey` ada, `save()` tepat 1x), `profilePTKPStatus`/`profileJiwaKeluarga`
(pasangan fungsi murni yg SAMA-SAMA baca `statusKawin`/`tanggungan` tapi beda
aturan clamp — PTKP status di-clamp maksimal 3 tanggungan buat kode `TK0`..`K3`,
sedangkan hitung jiwa keluarga TIDAK di-clamp sama sekali), `updateProfilPTKPPreview`
(format tampilan beda antara cabang `TK`/`K`, mis. `TK0`→`TK/0` vs `K2`→`K/2`),
`updateUsiaPreview` (sembunyi kalau tanggal lahir kosong, tampil + panggil
`fiCalcAge` kalau ada), `selectStatusKawin`/`selectTanggungan`/`selectStatusPekerjaan`
(toggle chip aktif via `querySelectorAll`, update state, panggil `save()`,
`selectStatusPekerjaan` tambahan panggil `renderPajakRekomendasi(true)`), dan
`toggleApiKeyHint` (placeholder & link bantuan beda antara provider `gemini`
vs lainnya).

**Catatan teknis — jebakan yg sempat salah di percobaan pertama:**
`fakeDom.js` punya `getElementById` yg SELALU meng-auto-vivifikasi elemen
kosong (tidak pernah balik `null`/`undefined`), jadi 2 test awal yg
mengasumsikan "elemen opsional tidak didaftarkan di `domInitial` → guard
`if(el)` gagal" ternyata salah — elemen tetap ada (kosong), guard tetap lolos,
cuma fallback ke nilai default krn `value` kosong. Diperbaiki dgn pola yg
sudah ada di file test lain (`akun.test.js`/`aset.test.js`): override
`fakeDocument.getElementById` secara eksplisit supaya balik `null` utk id
tertentu, baru guard-nya beneran teruji. Juga 1 test `classList` awal salah
pakai array literal langsung di `domInitial` (`createFakeDocument` internal
pakai `Object.assign` yg menimpa objek `classList` bawaan jadi array biasa
tanpa `contains()`/`remove()`) — diperbaiki dgn `createFakeElement({classList:[...]})`
eksplisit sebelum di-passing (pola sama spt `fi-calc.test.js`).

**Diverifikasi:**
- `node --test tests/*.test.js` → **795/795 pass, 0 fail** (naik dari 764 di
  bagian ke-30, +31 test baru [profil-pengaturan], 0 regresi).
- `node build.js` → sukses, versi naik ke `kw80-merge-advisor-card-dashcards-47`
  (build #172), kedua bundle lolos `node --check` sintaks, `FILE-MAP.md`
  diregenerasi (`profil-pengaturan.js` otomatis hilang dari daftar nol-test).
- Smoke-test browser (Playwright + Chrome headless,
  `/home/claude/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome`)
  → `✅ [smoke-test] OK — 992 referensi getElementById() & 55 data-action
  semuanya valid`, 0 `pageerror`.
- `npm run lint`/`npx eslint` TIDAK bisa dites di sesi ini (sandbox tanpa
  internet, `npm install` gagal dgn 403) — tolong jalankan `npm run lint`
  sebelum merge/release.

**Untuk sesi berikutnya — daftar modul nol-test yg TERSISA (1 sudah selesai
sesi ini):** `reset-gaji-mingguan.js` (86 baris), `filter-laporan.js` (220
baris), `kasir.js` (221 baris), `sewakios.js` (242 baris), `linktx.js` (244
baris), `modal-navigasi.js` (284 baris), `payroll-absensi.js` (365 baris),
`renovasi.js` (437 baris), `tagihan-kalender.js` (443 baris),
`backup-restore.js` (718 baris), `cobek.js` (1261 baris, terbesar, disisakan
paling akhir), `features-aiwidget-reminder-gdrive-search.js` (1586 baris),
`features-sheets-pwa-selftest.js` (2361 baris). Lanjutkan urutan
ringan→berat: `reset-gaji-mingguan.js` berikutnya.

## Catatan kerja — 2026-07-11 (bagian ke-32): test `reset-gaji-mingguan.js`

Konteks: lanjutan daftar modul nol-test dari bagian ke-31, urutan
ringan→berat: `reset-gaji-mingguan.js` (86 baris) berikutnya. Tidak ada bug
ditemukan — murni menambah test yg sebelumnya nol, tidak ada perubahan di
kode aplikasi.

**File baru: `tests/reset-gaji-mingguan.test.js` (18 test).** Cakupan
`getWeekRange` (rentang Minggu 00:00:00.000 s/d Sabtu 23:59:59.999, sama utk
input hari apa saja dlm minggu itu), `checkWeeklySalaryReset` (guard "bukan
hari Sabtu" & "sudah di-prompt hari ini" sama2 return awal tanpa efek
samping, filter absensi yg BENAR-BENAR jatuh di rentang minggu berjalan
[absensi minggu lalu sengaja diselipkan sbg kontrol negatif], render ringkasan
ke DOM + buka modal, `wrAccWrap`/`wrAcc` kondisional ke `D.accounts.length`),
`openWeeklyResetManual` (toast peringatan kalau kosong vs alur lengkap kalau
ada: `populateAccFilters()`, isi ringkasan, tutup 2 modal sumber lalu buka
modal reset), dan `confirmWeeklyReset` (cabang `yes=false` cuma catat prompt
date + re-render tanpa sentuh `D.workDays`/`renderKeuangan`; cabang
`yes=true` selalu reset `D.workDays` minggu ini terlepas dari status
auto-income, TAPI transaksi Pemasukan & `renderKeuangan()` cuma jalan kalau
checkbox aktif DAN total>0; kategori dicari via regex `/gaji/i` dgn 2 lapis
fallback [kategori income pertama, lalu literal `'Gaji'`]; `accountId`
fallback ke akun pertama atau `null` kalau `D.accounts` kosong).

**Catatan teknis — kenapa test file ini beda pola dari file lain:** file ini
pakai `new Date()` (tanpa argumen) utk deteksi "sekarang" (hari Sabtu?,
rentang minggu berjalan), TAPI juga pakai `new Date(x)` dgn argumen (parsing
tanggal absensi via `new Date(w.date)`, copy-constructor `new Date(start)`)
yg harus tetap berperilaku spt Date asli (`getDay`/`setDate`/`setHours` dst).
Stub `Date.now()` sederhana (pola `error-handler.test.js`) tidak cukup —
dibuat `class FakeDate extends Date` yg cuma meng-override constructor
tanpa-argumen ke waktu tetap, delegasi ke `super(...args)` utk selebihnya.
Sandbox Node ini kebetulan ber-TZ UTC (offset 0, dicek via
`new Date().getTimezoneOffset()`), jadi string ISO `'YYYY-MM-DD'` polos aman
dipakai konsisten tanpa geser hari.

Var modul `_wrLastTotal`/`_wrLastCount` dideklarasikan pakai `let` (bukan
implicit-global spt `_sessionRawPin` di `onboarding.js`), jadi TIDAK
menempel ke objek context vm & tidak bisa di-inject langsung dari test.
Solusinya: test `confirmWeeklyReset` selalu memanggil `openWeeklyResetManual()`
dulu (yg secara alami mengisi kedua var itu lewat closure) sebelum memanggil
`confirmWeeklyReset()` — pola ini juga meniru urutan pemakaian ASLI di app
(tombol buka modal reset selalu dipencet dulu sebelum tombol konfirmasi).

**Diverifikasi:**
- `node --test tests/*.test.js` → **813/813 pass, 0 fail** (naik dari 795 di
  bagian ke-31, +18 test baru [reset-gaji-mingguan], 0 regresi).
- `node build.js` → sukses, versi naik ke build #173, kedua bundle lolos
  `node --check` sintaks, `FILE-MAP.md` diregenerasi
  (`reset-gaji-mingguan.js` otomatis hilang dari daftar nol-test).
- Smoke-test browser (Playwright + Chrome headless) → `✅ [smoke-test] OK —
  992 referensi getElementById() & 55 data-action semuanya valid`, 0
  `pageerror`.
- `npm run lint`/`npx eslint` TIDAK bisa dites di sesi ini (sandbox tanpa
  internet, `npm install` gagal dgn 403) — tolong jalankan `npm run lint`
  sebelum merge/release.

**Untuk sesi berikutnya — daftar modul nol-test yg TERSISA (1 sudah selesai
sesi ini):** `filter-laporan.js` (220 baris), `kasir.js` (221 baris),
`sewakios.js` (242 baris), `linktx.js` (244 baris), `modal-navigasi.js` (284
baris), `payroll-absensi.js` (365 baris), `renovasi.js` (437 baris),
`tagihan-kalender.js` (443 baris), `backup-restore.js` (718 baris),
`cobek.js` (1261 baris, terbesar, disisakan paling akhir),
`features-aiwidget-reminder-gdrive-search.js` (1586 baris),
`features-sheets-pwa-selftest.js` (2361 baris). Lanjutkan urutan
ringan→berat: `filter-laporan.js` berikutnya.

## Catatan kerja — 2026-07-11 (bagian ke-33): test `pengaturan-search.js`

Konteks: diminta jalankan test "dari yg terkecil" mengikuti pola sesi
sebelumnya. Ketemu `pengaturan-search.js` (72 baris) — modul ini KELEWAT
dari daftar "sesi berikutnya" bagian ke-32 (kemungkinan krn dipindah dari
`features-helpers-global-security.js` v73 belakangan, jadi belum sempat
tercatat di daftar itu) — TAPI ternyata masih nol test dan LEBIH KECIL dari
`filter-laporan.js` (220 baris) yg tercatat sbg "berikutnya". Diverifikasi
dgn cek langsung: cari semua file source yg tidak direferensikan
`loadSource([...])` di `tests/*.test.js` manapun. Dipilih `pengaturan-search.js`
krn genuinely terkecil, mengikuti aturan ringan→berat apa adanya (bukan cuma
ikut daftar tercatat). Tidak ada bug ditemukan — murni menambah test yg
sebelumnya nol, tidak ada perubahan di kode aplikasi.

**File baru: `tests/pengaturan-search.test.js` (23 test).** Cakupan
`toggleStgGroup` (toggle kelas `open` + `aria-expanded` di `.stg-group-head`,
guard `id` tidak ketemu, guard head tidak ada), `toggleSingleCardCollapse`
(pola sama tapi utk `.card-collapse-head`), `stgSearch` (query kosong
sembunyikan hasil, resultEl tidak ada, tidak ada kartu cocok vs ada,
case-insensitive + trim, kartu di dalam grup tertutup ikut dibuka tapi TIDAK
di-toggle tertutup lagi kalau grup sudah terbuka, kartu `card-collapse` ikut
dibuka, highlight pencarian sebelumnya dibersihkan tiap pencarian baru,
hasil pertama jadwalkan `scrollIntoView` via `setTimeout`), dan listener
`keydown` top-level (Enter/Spasi di `.stg-group-head,.card-collapse-head` →
`preventDefault()` + `head.click()`, tombol lain/target tidak cocok/
`target.closest` tidak ada → no-op).

**Catatan teknis — 2 jebakan `fakeDom.js` yg bikin salah di percobaan
pertama:**
1. `createFakeDocument({id: objekBuatanSendiri})` melakukan
   `Object.assign(elemenAutoVivify, objekBuatanSendiri)` di dalam `ensure()`
   — properti PRIMITIF (`textContent` string) di-copy NILAI-nya ke objek
   auto-vivify yg BEDA dari variabel lokal test, jadi assert langsung ke
   variabel lokal `resultEl.textContent` setelah manggil `stgSearch()` selalu
   baca nilai lama (`''`). Field OBJEK (`style`/`classList`) tetap aman
   dibaca dari variabel lokal krn Object.assign cuma copy REFERENCE utk
   objek, bukan primitif. Fix: ambil ulang elemen via
   `fakeDocument.getElementById(id)` SETELAH pemanggilan fungsi yg dites,
   baru assert `textContent`-nya.
2. Konfirmasi ulang jebakan `classList` dari catatan bagian ke-31: passing
   literal `{classList:['u-dnone']}` sbg value `initial` ke
   `createFakeDocument` menimpa `classList` jadi array polos tanpa
   `contains()`/`remove()` — harus `createFakeElement({classList:[...]})`
   dulu baru dipassing sbg value `initial`.
3. `assert.deepEqual`/`deepStrictEqual` GAGAL membandingkan object literal
   yg dibuat DI DALAM `vm` sandbox (mis. argumen `scrollIntoView({behavior,
   block})` yg dipanggil dari source app yg jalan di context vm) dgn object
   literal host Node biasa — walau isinya identik, prototype `Object`-nya
   beda REALM jadi dianggap tidak sama. Fix: assert per-field alih-alih
   `deepEqual` utk nilai yg berasal dari dalam sandbox vm.

**Diverifikasi:**
- `node --test tests/*.test.js` → **864/864 pass, 0 fail** (naik dari 841,
  +23 test baru [pengaturan-search], 0 regresi).
- Sanity-check tambahan: sengaja rusak 1 baris logika `stgSearch` (ganti
  pesan hasil jadi string statis) → 3 test relevan langsung merah, lalu
  dikembalikan → hijau lagi. Konfirmasi test baru ini benar-benar menguji
  perilaku, bukan cuma lolos scaffolding kosong.
- `node build.js kw83-test-pengaturan-search-1` → sukses (versi lama
  `kw82-test-tx-stok-sparepart` tidak berakhiran `-angka` jadi auto-increment
  gagal, dikasih nama versi manual sesuai saran error `build.js`), build
  #185, kedua bundle lolos `node --check` sintaks, `FILE-MAP.md` diregenerasi
  (`pengaturan-search.js` otomatis hilang dari daftar nol-test).
- `npm run lint`/`npx eslint` & smoke-test browser (Playwright) TIDAK bisa
  dites di sesi ini (sandbox tanpa internet/`node_modules`/Chrome
  terpasang) — tolong jalankan sebelum merge/release.

**Untuk sesi berikutnya — daftar modul nol-test yg TERSISA:**
`filter-laporan.js` (220 baris), `kasir.js` (221 baris), `sewakios.js` (242
baris), `linktx.js` (244 baris), `modal-navigasi.js` (284 baris),
`payroll-absensi.js` (365 baris), `renovasi.js` (437 baris),
`tagihan-kalender.js` (443 baris), `backup-restore.js` (718 baris),
`cobek.js` (1261 baris, terbesar, disisakan paling akhir),
`features-aiwidget-reminder-gdrive-search.js` (1586 baris),
`features-sheets-pwa-selftest.js` (2361 baris). Lanjutkan urutan
ringan→berat: `filter-laporan.js` berikutnya. **PENTING:** cek ulang daftar
ini dgn cara yg sama spt bagian ke-33 (cari file source yg tidak
direferensikan `loadSource([...])` di test manapun) sebelum mulai, jangan
cuma percaya daftar tercatat — sudah kejadian 1x (`pengaturan-search.js`)
kelewat dari daftar.

## Catatan kerja — 2026-07-11 (bagian ke-34): test `filter-laporan.js` (di-port dari snapshot v174 ke v187 pasca-redesign Etalase)

Konteks: daftar nol-test ringan→berat dari saran akhir bagian ke-33 bilang
`filter-laporan.js` berikutnya, tapi cabang kerja proyek ini sempat belok
duluan ke redesign tampilan kartu produk Etalase (lihat entri
`CATATAN-CEK-CLAUDE.md` [2026-07-11] "Redesign tampilan kartu produk
Etalase") sebelum akhirnya sesi ini balik menuntaskan `filter-laporan.js`.
Testnya sendiri SEBELUMNYA sudah ditulis & diverifikasi penuh di sesi lain
pd snapshot proyek yg lebih lama (sebelum redesign Etalase, versi build
#173→#174) — sesi ini murni **port** file test itu ke snapshot v187/188 ini,
bukan menulis dari nol. Tidak ada bug ditemukan di kode aplikasi baik dulu
maupun sekarang — murni menambah test yg sebelumnya nol.

**Kenapa perlu porting, bukan copy-paste polos:** redesign Etalase mengganti
penamaan `cobek`→`shop` di beberapa tempat yg disentuh `goToList()`:
`#page-cobek`→`#page-shop`, `setCobekTab()`→`setShopTab()`, parameter
`cobekTabName`→`shopTabName`. Selain baris itu, `filter-laporan.js` di v187
ini 100% identik dgn versi lama (`diff` cuma nunjukkan 2 baris beda, isinya
cuma rename itu — dicek eksplisit sebelum mulai port, bukan asumsi). Jadi
proses port-nya: copy `tests/filter-laporan.test.js` apa adanya, lalu
`sed` rename semua `cobek*`/`Cobek*`/`#page-cobek` jadi `shop*`/`Shop*`/
`#page-shop` (termasuk nama variabel test internal spt `cobekTabs`→
`shopTabs`, `cobekCalls`→`shopCalls`), lalu jalankan test-nya — 51/51 pass
tanpa perlu perubahan lain. `tests/helpers/loadSource.js` &
`tests/helpers/fakeDom.js` di v187 ini ternyata BYTE-IDENTICAL dgn versi
lama (dicek pakai `diff`), jadi tidak ada penyesuaian pola test yg
dibutuhkan di luar rename cobek→shop itu.

**Cakupan test (51 test, `tests/filter-laporan.test.js`):** filter panel
Keuangan (`kf*`) & Laporan (`f*`) — `txMatchesFilters`/`txMatchesSearch`
(murni; catatan kontrak — `txMatchesSearch` cuma me-lowercase haystack-nya,
BUKAN query-nya, pemanggil wajib lowercase query duluan spt yg dilakukan
`getKeuFilters()`), `getLaporanFilters`/`getKeuFilters`,
`resetLaporanFilter`/`resetKeuFilter`, `populateCatFilter`/
`populateKeuFilters` (termasuk cabang pertahankan-vs-fallback akun terpilih
lama di `<select>`), `onFKatChange`/`onKfKatChange`, `toggleKeuFilter`
(termasuk kuirk nyata: klik pertama pada panel yg `style.display` awalnya
kosong `''` justru men-set eksplisit ke `'none'`, bukan `'block'` —
dikonfirmasi ini perilaku production asli lewat browser, bukan bug test),
simpan/pulihkan preferensi filter ke `localStorage` (`saveKeuFilterPrefs`/
`loadKeuFilterPrefsIntoDOM`, dgn guard sekali-muat `_keuFilterPrefsLoaded`),
badge jumlah filter aktif (`updateKfBadge`), paginasi list (`loadMoreTx`/
`loadMoreLapTx`/`resetTxPageAndRender`, debounce pencarian 250ms
`onKfSearchInput`), navigasi antar-list dgn scroll+flash-highlight
(`goToList`, termasuk cabang `pageName`+`navIdx`, tab Shop [`etalase`/
`produsen`/`riwayat`/`pelanggan`/fallback index 0], tab Car Notes [`servis`/
lainnya], & elemen target yg tidak ada di DOM), dan modal ringkasan
transaksi terfilter dari 3 scope dashboard/keuangan/laporan dgn paginasi
100 per batch (`showFilteredTx`).

**Catatan teknis (dipindah dari sesi penulisan test aslinya, masih relevan
di sini) — 2 jebakan lintas-realm `vm`:**
1. Variabel `let`/`const` top-level yg dideklarasikan DI DALAM file sumber
   yg di-load (bukan lewat `extraGlobals`) — spt `txListPage`, `lapTxPage`,
   `_keuFilterPrefsLoaded` di `filter-laporan.js` — TIDAK otomatis nempel
   ke objek context vm yg dikembalikan `loadSource()`. Solusi:
   `vm.runInContext('namaVar', ctx)` / `vm.runInContext('namaVar=...', ctx)`
   ke context yg SAMA (`ctx` dari `loadSource()` IS objek context-nya) —
   pola sudah ada di `tests/kalkulator-popup.test.js`.
2. Objek plain yg DIBUAT & DI-RETURN oleh kode yg berjalan di dalam sandbox
   vm (mis. `getKeuFilters()`) py `[[Prototype]]` beda dari realm host test
   file, jadi `assert.deepEqual`/`deepStrictEqual` (mode strict) SELALU
   gagal walau isinya identik ("same structure but are not
   reference-equal"). Solusi: JSON round-trip (helper `plain()` di
   `tests/filter-laporan.test.js`) sebelum dibandingkan.

Juga: `createFakeDocument()` (`tests/helpers/fakeDom.js`) menerapkan
`initial` lewat `Object.assign(newElement, initial)` — MERATAKAN accessor
getter/setter kustom (elemen `<select>` tiruan yg py `.options` "hidup",
dibutuhkan `populateKeuFilters()` yg baca `[...kfAcc.options]` SETELAH
nulis `.innerHTML`) jadi cuma snapshot statis. Elemen yg butuh accessor
beneran harus disuntik lewat override `getElementById` langsung, bukan
lewat parameter `initial`.

**Diverifikasi:**
- `node --test tests/*.test.js` → **1020/1020 pass, 0 fail** (naik dari 969
  sebelum sesi ini, +51 test baru [filter-laporan], 0 regresi).
- `node build.js` → sukses, versi naik dari `kw83-test-pengaturan-search-3`
  ke `kw83-test-pengaturan-search-4`, build #188, kedua bundle lolos
  `node --check` sintaks, `FILE-MAP.md` diregenerasi (`filter-laporan.js`
  otomatis hilang dari daftar nol-test).
- Smoke-test browser (Playwright + Chrome headless) → `✅ [smoke-test] OK —
  999 referensi getElementById() & 56 data-action semuanya valid`, 0
  `pageerror`. Dicoba juga live di browser (bukan cuma smoke-test generik):
  `showPage('keuangan',...)` → `toggleKeuFilter()` → `resetKeuFilter()` →
  `showFilteredTx('dashboard','all','Test Dashboard')` (modal kebuka, judul
  benar) → `goToList('page-etalase',null,undefined,'etalase')` (fungsi
  `setShopTab` pasca-redesign terkonfirmasi ada & jalan) — semua tanpa
  error.
- `npm run lint`/`npx eslint` TIDAK bisa dites di sesi ini (sandbox tanpa
  internet, `npm install`/`npx` gagal 403) — tolong jalankan `npm run lint`
  sebelum merge/release. (Sudah beberapa sesi berturut2 tidak bisa dites
  krn keterbatasan sandbox yg sama.)

**Untuk sesi berikutnya — daftar modul nol-test yg TERSISA** (dicek ulang
sesi ini via pola `loadSource(['nama-file.js']` di seluruh `tests/*.test.js`,
BUKAN cuma percaya catatan lama — sesuai pesan peringatan di saran bagian
ke-33 yg bilang `pengaturan-search.js` pernah kelewat): `kasir.js`,
`sewakios.js`, `linktx.js`, `modal-navigasi.js`, `payroll-absensi.js`,
`renovasi.js`, `tagihan-kalender.js`, `backup-restore.js`,
`features-aiwidget-reminder-gdrive-search.js`. Catatan tambahan: `cobek.js`
SUDAH dapat test (`tests/cobek.test.js`, ditambahkan bareng redesign
Etalase) jadi TIDAK perlu dikerjakan lagi; `features-sheets-pwa-selftest.js`
SEBAGIAN tercakup (`parsePzNum`/`parseDecStr` via `extractFunction` di
`tests/parse-angka.test.js`) tapi belum full coverage kalau mau digarap
menyeluruh. Ukuran file (buat estimasi urutan ringan→berat, belum diverifikasi
ulang barisnya krn tidak semua file dicek `wc -l` sesi ini): `kasir.js` &
`sewakios.js` termasuk yg lebih ringan, `backup-restore.js` &
`features-aiwidget-reminder-gdrive-search.js` termasuk yg terberat di sisa
daftar ini.
