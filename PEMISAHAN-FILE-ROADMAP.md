# Roadmap Pemisahan File — Keluarga W

## Yang sudah dikerjakan di build ini (v42)

12 file `modules-features-1.js` s/d `modules-features-12.js` sudah diganti nama
jadi nama deskriptif sesuai isi sebenarnya (bukan cuma nomor urut lagi):

| Nama lama | Nama baru |
|---|---|
| modules-features-1.js  | features-etalase-piutang-renovai.js |
| modules-features-2.js  | features-renovasi-pajak-aset-order.js |
| modules-features-3.js  | features-budget-laporan-carnotes-pelanggan.js |
| modules-features-4.js  | features-edukasi-pajak-utang-sewakios.js |
| modules-features-5.js  | features-helpers-global-security.js |
| modules-features-6.js  | features-filter-scanstruk-ocr.js |
| modules-features-7.js  | features-gaji-cobek-tagihan.js |
| modules-features-8.js  | features-kategori-modal-tagihan-kalender.js |
| modules-features-9.js  | features-fi-checkoutscan-importexport-payroll.js |
| modules-features-10.js | features-tukang-kendaraan-storage.js |
| modules-features-11.js | features-aiwidget-reminder-gdrive-search.js |
| modules-features-12.js | features-sheets-pwa-selftest.js |

Yang ikut diupdate supaya konsisten:
- `build.js` — array `GROUP_A` / `GROUP_B` dan `detectCurrentVersion()`
- Komentar header di tiap file, komentar "PENTING: urutan load" di tiap file
- 1 pesan toast di `features-helpers-global-security.js` yang dulu nyebut nama file lama
- Komentar penjelas di `modules-render.js`, `bump-version.sh`, `features-filter-scanstruk-ocr.js`

**Tidak berubah:** `index.html` / `app_production.html` HANYA memuat
`app-bundle-a.min.js` dan `app-bundle-b.min.js` (bukan 12 file source itu
langsung) — jadi rename ini **nol risiko** ke aplikasi yang jalan di HP kamu.
Sudah saya buktikan dengan menjalankan `node build.js` sungguhan di sini:
versi naik ke `kw70-fix-syntax-crash-scan-34` / build `42`, kedua bundle
lolos `node --check` (cek sintaks), dan diff `index.html` cuma di angka
`?v=41` → `?v=42` seperti yang memang seharusnya terjadi.

## Kenapa belum saya pecah sungguhan per halaman (keuangan.js, cobek.js, dst)

Saya cek isi asli 12 file itu satu-satu. Kenyataannya, tiap file berisi
BEBERAPA modul halaman yang tidak berhubungan sama sekali, misalnya:

- `features-etalase-piutang-renovai.js` isinya: `Etalase` (toko/produk),
  `Produsen`, `Bill` (tagihan), `Sparepart`, `SiapPulang`, `Piutang`, `Debt`
  (utang), DAN `RenovAI` — 7 modul beda halaman dalam 1 file.
- `features-tukang-kendaraan-storage.js` isinya: `Tukang` (tukang
  borongan/absensi), kendaraan (SIM/pajak/servis/BBM/km), `TORSI_DB`,
  `VEHICLE_SPEC_DB`, storage & arsip.
- Pola yang sama di hampir semua file lain.

Artinya nama file lama (`modules-features-N.js`) itu sendiri sebenarnya
sudah salah kaprah sejak awal — bukan dipisah per fitur, tapi per "batch
nomor" waktu ditulis. Memecah ini jadi benar-benar `keuangan.js`,
`cobek.js`, `carnotes.js` satu-modul-satu-file berarti memindahkan ~90
modul (`const NamaModul = {...}`) satu per satu ke file barunya, lalu
mengecek ulang urutan load (banyak modul saling referensi antar file —
makanya ada komentar "PENTING: harus dimuat sesuai urutan" di tiap file).

Saya sengaja TIDAK melakukan pemindahan kode itu secara buta di sini karena:
1. Environment saya tidak punya browser — saya tidak bisa benar-benar
   membuka app dan mengetes tiap halaman & modal setelah dipindah.
2. `smoke-test.js` yang sudah kamu punya cuma jalan di mode dev DI BROWSER
   (`?dev=1`), bukan di Node — jadi saya tidak bisa memverifikasi hasil
   pemindahan modul dengan alat yang sudah ada.
3. Kalau satu referensi antar-modul kelewat, resikonya app production
   kamu (yang beneran dipakai sehari-hari) bisa error total, bukan cuma
   "kurang rapi".

## Progres pemisahan per-domain (fase berikutnya, sungguhan)

- ✅ **Cobek** (v43): `Etalase`, `Produsen`, `SiapPulang`, `Order`, `Laporan`,
  `Pelanggan`, `PriceReko` → `cobek.js`.
- ✅ **Piutang/Utang** (v44, build 44): `Piutang`, `Debt` → `piutang-utang.js`.
  Dipindah dari `features-etalase-piutang-renovai.js`. Tidak ada modul yang
  dihapus/diubah isinya, cuma dipindah file + `build.js` diupdate
  (`GROUP_A`). Dicek: tidak ada deklarasi ganda, `node --check` lolos di
  source & kedua bundle hasil build.
- ✅ **Sparepart** (v45, build 45): `Sparepart` dipindah dari
  `features-etalase-piutang-renovai.js` ke `features-tukang-kendaraan-storage.js`
  (domain kendaraan), ditaruh dekat `matchingVehicleName()`/`codeFromName()`
  yang memang dipakai modul ini. Wrapper function (`openSparepartModal`,
  `saveSparepart`, dst) sudah ada duluan di file tujuan sejak sesi sebelumnya
  jadi tidak perlu diubah. `GROUP_A`/`GROUP_B` di `build.js` TIDAK berubah
  (kedua file sudah ada di daftar, cuma isinya yang pindah). Dicek: tidak ada
  deklarasi ganda `const Sparepart`, `node --check` lolos di source & kedua
  bundle hasil build.
- ✅ **Bill** (v46, build 42): `Bill` (helper hubungkan transaksi lama ke
  Riwayat Tagihan) dipindah dari `features-etalase-piutang-renovai.js` ke
  `piutang-utang.js` (domain tagihan/cicilan, ikut Piutang/Debt yang juga
  berhubungan erat sama tagihan). Modul ini kecil (1 fungsi) & tidak
  bergantung urutan load — `curBillHistoryId` & `LinkTx` yang dipakainya
  cuma diakses saat tombol diklik (runtime), bukan saat file di-load,
  jadi aman walau di-declare di file lain. Dicek: `Bill` cuma muncul 1x
  di source (piutang-utang.js) & 1x di bundle hasil build, `Bill.openLinkTxModal`
  masih dipanggil di `modals.js`, `node --check` lolos di semua file source
  & kedua bundle.
- ✅ **RenovAI** (v47, build 43): `RenovAI` (saran AI utk proyek renovasi,
  panggil API Claude/Gemini) dipindah dari `features-etalase-piutang-renovai.js`
  ke `features-renovasi-pajak-aset-order.js`, ditaruh tepat setelah modul
  `Renov` yang memanggilnya (`Renov.detailModal` → tombol "🤖 Saran AI").
  Tidak ada isi yang diubah, cuma dipindah file. Dicek: `RenovAI` cuma
  muncul 1x di source & 1x di bundle hasil build, `RenovAI.suggest` masih
  dipanggil dari `modals.js`, `node --check` lolos di semua file source &
  kedua bundle.
- ✅ **Sisa konstanta kecil** (v48, build 44): `features-etalase-piutang-renovai.js`
  (yang sejak v47 cuma berisi `MODULE_FEATURES_VERSION` + 3 konstanta kecil
  `VEHTAX_INPUT_IDS`, `MY_WRENCH`, `CHAT_ACTION_LABELS`, tidak ada modul
  halaman lagi di dalamnya) dipilih sebagai langkah paling ringan berikutnya
  karena isinya tinggal deklarasi data, tanpa modul (`const NamaModul={...}`)
  yang perlu dicek urutan referensinya. Semua 4 dipindah ke
  `features-budget-laporan-carnotes-pelanggan.js`, masing-masing ditaruh
  tepat di sebelah kode yang memakainya:
  - `VEHTAX_INPUT_IDS` → tepat setelah `VEHTAX_ITEMS` (satu pasangan data
    pajak kendaraan, sudah dipakai bareng di file yang sama).
  - `MY_WRENCH` → tepat sebelum modul `Torsi` yang membacanya
    (`renderWrenchNote`, `scalePositionHtml`).
  - `CHAT_ACTION_LABELS` → tepat sebelum `CHAT_ACTION_HANDLERS` &
    `CHAT_ACTION_EDIT_FIELDS` (tiga-tiganya soal usul aksi AI, sudah di file
    yang sama).
  - `MODULE_FEATURES_VERSION` → dekat header file (dipakai
    `features-helpers-global-security.js` utk cek sinkron versi antar file
    — lihat `computeModuleSyncStatus()`).

  File `features-etalase-piutang-renovai.js` DIHAPUS setelah semua isinya
  pindah (tidak ada isi tersisa). `build.js` (`GROUP_A`) & komentar
  "urutan load" di `features-renovasi-pajak-aset-order.js` dan
  `features-edukasi-pajak-utang-sewakios.js` diupdate supaya konsisten
  (nama file dihapus dari daftar urutan). Dicek: tiap konstanta cuma
  muncul 1x di source & 1x di masing-masing bundle hasil build,
  `node --check` lolos di semua file source & kedua bundle,
  `index.html`/`app_production.html` tetap identik.

- ✅ **Pajak PBB & Zakat** (v51, build 45): `PBB`, `Zakat` dipindah dari
  `features-renovasi-pajak-aset-order.js` ke file baru `pajak-pbb-zakat.js`.
  Dipilih sebagai domain berikutnya karena kedua modul ini sudah rapi (semua
  method internal, tidak ada kode top-level yang jalan sendiri saat file
  di-load) dan sudah dicek TIDAK saling referensi ke modul lain di file asal
  (`Renov`, `RenovAI`, `Aset`, `WorthIt`, `IDBStore`, `TimelineW`) — jadi
  paling ringan & rendah-risiko utk dipisah, bukan cuma konstanta data
  seperti langkah sebelumnya tapi tetap "1 domain, tanpa dependensi keluar".
  `build.js` (`GROUP_A`, ditambah setelah `features-renovasi-pajak-aset-order.js`)
  & komentar "urutan load" di `features-renovasi-pajak-aset-order.js`,
  `features-budget-laporan-carnotes-pelanggan.js`,
  `features-edukasi-pajak-utang-sewakios.js` diupdate supaya konsisten.
  Header `features-renovasi-pajak-aset-order.js` diperbarui (nama domain
  yang tersisa: Renovasi, Aset & Kekayaan, storage IndexedDB, Worth-It,
  Timeline Tujuan). Dicek: `PBB`/`Zakat` cuma muncul 1x di source & 1x di
  bundle hasil build, semua fungsi wrapper (`renderPBB`, `hitungZakatMaal`,
  dst di `modules-render.js` & `features-sheets-pwa-selftest.js`) masih
  bisa memanggil modul ini karena keduanya tetap variabel global,
  `node --check` lolos di semua file source & kedua bundle,
  `index.html`/`app_production.html` tetap identik.

- ✅ **PajakUMKM ikut digabung ke domain Pajak** (v52, build 46): modul
  `PajakUMKM` (kalkulator estimasi pajak UMKM dari omzet Shop/Cobek, 10
  baris) dipindah dari `features-edukasi-pajak-utang-sewakios.js` ke
  `pajak-pbb-zakat.js`, gabung bareng `PBB`/`Zakat` di file yang sama —
  dipilih karena juga isinya tinggal 1 modul kecil tanpa dependensi ke
  modul lain di file asalnya (`EduFund`, `RefAI`, `LifeBalance`,
  `DebtStrategy`, `LinkTx`, `SewaKios`, `AlokasiAset`), hanya dipanggil
  dari 1 wrapper (`renderUMKMPajak` di `modules-render.js`). Header kedua
  file diupdate. Dicek: `PajakUMKM` cuma muncul 1x di source & 1x di
  bundle hasil build, `node --check` lolos di semua source & kedua
  bundle, `index.html`/`app_production.html` tetap identik.

- ✅ **PPh21 ikut digabung ke domain Pajak** (v53, build 47): modul `PPh21`
  (kalkulator estimasi PPh 21 Orang Pribadi — PTKP, tarif progresif,
  isi-dari-transaksi) dipindah dari `features-edukasi-pajak-utang-sewakios.js`
  ke `pajak-pbb-zakat.js`, gabung bareng `PBB`/`Zakat`/`PajakUMKM` di file
  yang sama — dipilih karena sama seperti `PajakUMKM`: 1 modul mandiri,
  tanpa referensi ke modul lain di file asalnya (`EduFund`, `RefAI`,
  `LifeBalance`, `DebtStrategy`, `LinkTx`, `SewaKios`, `AlokasiAset`),
  hanya dipanggil lewat wrapper global (`getPTKP`, `hitungPPh21Progresif`,
  `isiPPhDariTransaksi`, `hitungPPh21` — semua tetap di
  `features-sheets-pwa-selftest.js`, tidak perlu diubah karena cuma
  memanggil `PPh21.xxx()` lewat variabel global, bukan lewat referensi
  lokal ke file). Header kedua file diupdate. Dicek: `PPh21` cuma muncul
  1x di source & 1x di bundle hasil build (`app-bundle-a.min.js`,
  sesuai `GROUP_A`), `node --check` lolos di semua source & kedua bundle,
  `index.html`/`app_production.html` tetap identik.

- ✅ **AlokasiAset digabung ke domain Aset & Kekayaan** (v54, build 48): modul
  `AlokasiAset` (alokasi dana ke instrumen investasi berdasar profil risiko)
  dipindah dari `features-edukasi-pajak-utang-sewakios.js` ke
  `features-renovasi-pajak-aset-order.js`, ditaruh tepat setelah
  `ALOKASI_PRESETS` (data preset yang dipakainya) & tepat sebelum modul
  `Aset` (juga domain aset/kekayaan) — dipilih karena modul mandiri,
  cuma bergantung ke `ALOKASI_PRESETS` (variabel global, tetap bisa
  diakses dari file manapun selama sama-sama sudah dimuat) dan tidak
  direferensi modul lain manapun (semua pemanggilnya lewat
  `AlokasiAset.xxx()` di HTML `data-action`/`data-onclick`, atau lewat
  `typeof AlokasiAset!=='undefined'` guard di `features-gaji-cobek-tagihan.js`
  & `modules-calc.js`, atau dipanggil langsung dari dalam fungsi di
  `modules-render.js` — bukan saat file di-load). Header kedua file
  diupdate. Dicek: `AlokasiAset` cuma muncul 1x di source & 1x di bundle
  hasil build (`app-bundle-a.min.js`, sesuai `GROUP_A`), `node --check`
  lolos di semua source & kedua bundle, `index.html`/`app_production.html`
  tetap identik.

- ✅ **RefAI digabung ke domain Pajak/Zakat** (v55, build 49): modul `RefAI`
  (cek harga emas/nisab zakat/zakat fitrah terbaru via AI+web search, lalu
  update `D.pajakZakat`) dipindah dari `features-edukasi-pajak-utang-sewakios.js`
  ke `pajak-pbb-zakat.js`, ditaruh setelah `Zakat` — isinya (`ITEMS`:
  `hargaEmasPerGram`, `nisabPenghasilanBulan`, `zakatFitrahPerJiwa`) memang
  domain Pajak/Zakat, bukan Edukasi. Satu kerumitan tambahan dibanding
  langkah-langkah sebelumnya: `RefAI._parseJSON()` (helper parsing JSON dari
  balasan AI) dipakai ulang oleh 2 tempat lain — `EduFund.checkAI()` (masih
  di `features-edukasi-pajak-utang-sewakios.js`) & `PriceReko.checkMarketAI()`
  (di `cobek.js`). Ini tetap aman dipindah krn kedua pemanggil itu mengakses
  `RefAI._parseJSON` lewat variabel global saat runtime (pas tombol AI-nya
  diklik), bukan saat file di-load — jadi tidak masalah `RefAI` sekarang
  ada di file lain dari pemanggilnya. Header ketiga file (`pajak-pbb-zakat.js`,
  `features-edukasi-pajak-utang-sewakios.js`) diupdate dgn catatan ini;
  komentar di `cobek.js` (yang cuma menyebut pola, bukan path file) tidak
  perlu diubah. Dicek: `RefAI` cuma muncul 1x di source & 1x di bundle hasil
  build (`app-bundle-a.min.js`), `node --check` lolos di semua source &
  kedua bundle, `index.html`/`app_production.html` tetap identik.

- ✅ **DebtStrategy digabung ke domain Piutang/Utang** (v56, build 50): modul
  `DebtStrategy` (simulasi strategi pelunasan Avalanche/Snowball, DSR) dipindah
  dari `features-edukasi-pajak-utang-sewakios.js` ke `piutang-utang.js`,
  ditaruh tepat setelah modul `Debt` (yang sudah memanggilnya lewat
  `Debt.renderList()`) & sebelum `Bill` — dipilih sebagai langkah berikutnya
  karena modul ini mandiri (cuma bergantung ke `Debt.totalCicilanBulanan()`
  & `WorthIt.incomeAvg()`, keduanya lewat guarded `typeof` check yang sudah
  ada sejak awal, jadi tetap aman walau `WorthIt` ada di file lain) dan tidak
  direferensi modul lain kecuali lewat variabel global (`Debt.renderList()`
  di file yang sama, dua wrapper `setDebtStrategyMethod`/`onDsExtraInput` di
  `features-sheets-pwa-selftest.js`, dan test unit `DebtStrategy.computeOrder`/
  `.simulate` di file yang sama juga). Domainnya juga pas — DebtStrategy
  memang strategi pelunasan utang, jadi wajar satu file dengan `Debt`. Header
  kedua file (`piutang-utang.js`, `features-edukasi-pajak-utang-sewakios.js`)
  diupdate. Dicek: `DebtStrategy` cuma muncul 1x di source & 1x di bundle
  hasil build (`app-bundle-a.min.js`, sesuai `GROUP_A`, tidak muncul di
  `app-bundle-b.min.js`), `node --check` lolos di semua source & kedua
  bundle, `index.html`/`app_production.html` tetap identik.

- ✅ **SHEETS_SCHEMAS dipindah ke domain Google Sheets/GDrive** (v57, build 51):
  konstanta `SHEETS_SCHEMAS` (skema kolom utk tiap modul data yg disinkron ke
  Google Sheets) dipindah dari `features-edukasi-pajak-utang-sewakios.js` ke
  `features-aiwidget-reminder-gdrive-search.js`, ditaruh tepat sebelum
  `SHEETS_MODULES` yang sudah lebih dulu ada di situ — kedua konstanta ini
  memang sepasang & sama-sama cuma dipakai oleh `sheetsHeaderFor()`/
  `sheetsLastColFor()` di file yang sama. Dipilih sebagai langkah berikutnya
  karena ini murni data (tanpa method, tanpa kode top-level yang jalan
  sendiri) dan HANYA dipakai di 1 file lain (bukan di file asalnya sendiri
  sama sekali) — paling ringan & rendah-risiko dari sisa modul yang ada.
  Sebagai bonus, ini juga memindahkan konstanta dari `GROUP_A` (bundle a) ke
  `GROUP_B` (bundle b) — jadi sekaligus mengurangi 1 kasus "data dipakai
  lintas bundle" (sebelumnya tetap aman krn `app-bundle-a.min.js` selalu
  dimuat sebelum `app-bundle-b.min.js` di HTML, tapi sekarang lebih rapi:
  deklarasi & pemakaian di bundle yang sama). Header kedua file diupdate;
  judul header `features-edukasi-pajak-utang-sewakios.js` juga diperbaiki
  (hapus sebutan "Integrasi Google Sheets" krn sudah tidak ada kode Sheets
  tersisa di file itu). Dicek: `SHEETS_SCHEMAS` cuma muncul 1x di source &
  1x di bundle hasil build (`app-bundle-b.min.js`, sesuai `GROUP_B`, tidak
  muncul di `app-bundle-a.min.js`), `node --check` lolos di semua source &
  kedua bundle, `index.html`/`app_production.html` tetap identik.

- ✅ **SewaKios dipisah jadi file domain sendiri** (v58, build 52): modul
  `SewaKios` (unit kios disewakan, riwayat tagihan sewa, ROI vs modal
  renovasi, laporan PDF) dipindah dari `features-edukasi-pajak-utang-sewakios.js`
  ke file BARU `sewakios.js` — ini langkah pertama di fase "pemisahan
  per-halaman sungguhan" yang disebut roadmap di atas (bukan sekadar
  menggabung ke file domain yang sudah ada, karena SewaKios memang tidak
  ada domain existing yang cocok). Dipilih duluan dari sisa 4 modul
  (`EduFund`, `LifeBalance`, `LinkTx`, `SewaKios`) karena: modul ini paling
  besar & paling mandiri (tidak referensi `EduFund`/`LifeBalance`/`LinkTx`
  sama sekali, dicek langsung di source), dan semua pemanggil dari file lain
  (`SewaKios.onLinkedTxDeleted()`/`.onLinkedTxEdited()`/`.applyPaymentLink()`
  dari `features-fi-checkoutscan-importexport-payroll.js` &
  `features-gaji-cobek-tagihan.js` saat transaksi diedit/dihapus,
  `SewaKios.render()`/`.nextTagih()`/`.catatSewa()` dari `modules-render.js`)
  semuanya lewat variabel global saat runtime (event handler/render call),
  bukan referensi lokal ke file — jadi aman dipindah walau dipanggil dari
  banyak tempat. `sewakios.js` ditambahkan ke `GROUP_A` di `build.js` (paling
  akhir, karena tidak ada modul GROUP_A lain yang bergantung padanya saat
  load). Komentar "urutan load" di 4 file `GROUP_A` yang menyebut daftar
  urutan (`features-edukasi-pajak-utang-sewakios.js`, `pajak-pbb-zakat.js`,
  `features-budget-laporan-carnotes-pelanggan.js`,
  `features-renovasi-pajak-aset-order.js`) diupdate supaya konsisten. Dicek:
  `SewaKios` cuma muncul 1x di source (`sewakios.js`) & 1x di bundle hasil
  build (`app-bundle-a.min.js`, sesuai `GROUP_A`), `node --check` lolos di
  semua source & kedua bundle, `index.html`/`app_production.html` tetap
  identik (index.html cuma memuat kedua file bundle, bukan file source
  satu-satu, jadi menambah file source baru ke `GROUP_A` nol risiko ke HTML).

- ✅ **LifeBalance dipisah jadi file domain sendiri** (v59, build 53): modul
  `LifeBalance` (skor gabungan Dana Darurat, DSR cicilan, No-Spend 30 hari,
  keseimbangan kerja-istirahat, plus riwayat snapshot bulanan) dipindah dari
  `features-edukasi-pajak-utang-sewakios.js` ke file BARU `hidup-seimbang.js`.
  Dipilih sebagai lanjutan (dari sisa `EduFund`, `LifeBalance`, `LinkTx`)
  karena dicek tidak referensi `EduFund`/`LinkTx` sama sekali, dan semua
  pemanggil dari file lain (`modules-render.js`, `modules-calc.js`,
  `features-aiwidget-reminder-gdrive-search.js`) memanggilnya lewat variabel
  global (kebanyakan sudah pakai guarded `typeof` check dari awal). Satu
  catatan yang didokumentasikan di header file baru: `LifeBalance.compute()`
  memanggil `computeNoSpendLast30()` yang letaknya di
  `features-sheets-pwa-selftest.js` (GROUP_B) TANPA guarded `typeof` check —
  ini bukan risiko baru dari pemindahan ini (kondisi yang sama persis sudah
  ada sebelum dipindah, dari saat modul ini masih di GROUP_A file lama),
  aman karena dipanggil saat runtime setelah kedua bundle (GROUP_A & GROUP_B)
  sama-sama sudah ter-load. `hidup-seimbang.js` ditambahkan ke `GROUP_A` di
  `build.js` (paling akhir). Komentar "urutan load" di 4 file `GROUP_A`
  yang menyebut daftar urutan diupdate supaya konsisten. Dicek: `LifeBalance`
  cuma muncul 1x di source (`hidup-seimbang.js`) & 1x di bundle hasil build
  (`app-bundle-a.min.js`), `node --check` lolos di semua source & kedua
  bundle, `index.html`/`app_production.html` tetap identik.

- ✅ **EduFund dipisah jadi file domain sendiri** (v60, build 54): modul
  `EduFund` (kalkulator target Dana Pendidikan — biaya sekolah/kuliah masa
  depan & nabung/bulan) dipindah dari `features-edukasi-pajak-utang-sewakios.js`
  ke file BARU `edukasi-dana.js`. Dipilih duluan dari sisa 2 modul (`EduFund`,
  `LinkTx`) karena paling mandiri: dicek langsung di source, `EduFund` sama
  sekali tidak referensi `LinkTx`, dan satu-satunya pemanggilan lintas-modul
  (`EduFund.checkAI()` → `RefAI._parseJSON()`) sudah lewat variabel global
  saat runtime (RefAI ada di `pajak-pbb-zakat.js`, dimuat lebih dulu di
  `GROUP_A`) — kondisi ini sudah ada sejak sebelum pemindahan, bukan risiko
  baru. Semua pemanggil dari file lain (`features-tukang-kendaraan-storage.js`,
  `modules-render.js`, dan HTML `data-action="EduFund.xxx"` di `modals.js`)
  mengakses lewat variabel global saat runtime, jadi aman dipindah.
  `edukasi-dana.js` ditambahkan ke `GROUP_A` di `build.js` (setelah
  `features-edukasi-pajak-utang-sewakios.js`, sebelum `sewakios.js`).
  Komentar "urutan load" di 4 file `GROUP_A` yang menyebut daftar urutan
  (`features-edukasi-pajak-utang-sewakios.js`, `pajak-pbb-zakat.js`,
  `features-budget-laporan-carnotes-pelanggan.js`,
  `features-renovasi-pajak-aset-order.js`) diupdate supaya konsisten. Judul
  header `features-edukasi-pajak-utang-sewakios.js` juga diperbaiki (jadi
  "Transaksi tertaut (LinkTx)" karena sekarang cuma berisi modul itu). Dicek:
  `EduFund` cuma muncul 1x di source (`edukasi-dana.js`) & 1x di bundle hasil
  build (`app-bundle-a.min.js`, sesuai `GROUP_A`, tidak muncul di
  `app-bundle-b.min.js`), `node --check` lolos di semua source & kedua
  bundle, `index.html`/`app_production.html` tetap identik (index.html cuma
  memuat kedua file bundle, bukan file source satu-satu, jadi menambah file
  source baru nol risiko ke HTML).

- ✅ **LinkTx dipisah jadi file domain sendiri** (v61, build 56): modul
  `LinkTx` (hubungkan transaksi lama di Keuangan ke Renov/Wishlist/Bill)
  dipindah dari `features-edukasi-pajak-utang-sewakios.js` ke file BARU
  `linktx.js`. Ini modul TERAKHIR di file lama tsb, jadi setelah dipindah
  file lama tidak ada isi tersisa — `features-edukasi-pajak-utang-sewakios.js`
  DIHAPUS (sama seperti kasus `features-etalase-piutang-renovai.js` di v48).
  LinkTx sengaja tidak digabung ke domain existing manapun karena memang
  dipakai sbg utility umum lintas domain: dicek langsung di source, semua
  pemanggil dari file lain (`Renov.openLinkTxModal()`/`WorthIt.openLinkTxModal()`
  di `features-renovasi-pajak-aset-order.js`, `Bill.openLinkTxModal()` di
  `piutang-utang.js`, plus 3 panggilan self-test di
  `features-sheets-pwa-selftest.js`) mengakses `LinkTx.xxx()` lewat variabel
  global saat runtime (klik tombol modal), bukan referensi lokal ke file —
  jadi aman dipindah ke file sendiri walau dipanggil dari banyak tempat.
  `linktx.js` ditambahkan ke `GROUP_A` di `build.js` (paling akhir, karena
  tidak ada modul GROUP_A lain yang bergantung padanya saat load). Komentar
  "urutan load" di 4 file `GROUP_A` yang menyebut daftar urutan
  (`pajak-pbb-zakat.js`, `features-budget-laporan-carnotes-pelanggan.js`,
  `features-renovasi-pajak-aset-order.js`, `edukasi-dana.js`) diupdate
  supaya konsisten (nama file lama dihapus dari daftar, `linktx.js`
  ditambahkan di akhir). 1 komentar "PENTING" basi di `piutang-utang.js`
  yang masih menyebut nama file lama sbg lokasi `LinkTx` juga diperbaiki.
  Dicek: `LinkTx` cuma muncul 1x di source (`linktx.js`) & 1x di bundle
  hasil build (`app-bundle-a.min.js`, sesuai `GROUP_A`, tidak muncul di
  `app-bundle-b.min.js`), `node --check` lolos di semua source & kedua
  bundle, `index.html`/`app_production.html` tetap identik (cuma memuat
  kedua file bundle, bukan file source satu-satu).

- ✅ **Renovasi / Aset-Kekayaan / Worth-It dipisah jadi 3 file domain sendiri**
  (v62, build 57): `features-renovasi-pajak-aset-order.js` (1278 baris)
  sebenarnya berisi 3 domain tak berhubungan sekaligus, jadi dipecah:
  - `renovasi.js`: `RenovCalc` (kalkulator material), `Renov` (proyek &
    item biaya renovasi), `RenovAI` (saran AI). `Renov.saveItem()` masih
    pakai `RenovCalc._pendingDetail` tapi sekarang 1 file yang sama.
  - `aset.js`: `ALOKASI_PRESETS`/`AlokasiAset` (rekomendasi alokasi dana),
    `Aset` (Buku Aset & Kekayaan Bersih), `PORTFOLIO_LABELS`, `TimelineW`
    (timeline tujuan keuangan — `TimelineW.goals()` panggil `Renov.totals()`
    lewat variabel global, aman krn runtime call). **Catatan:** `IDBStore`
    (helper generik IndexedDB, dipakai `save()` di
    `features-helpers-global-security.js` & self-test) ikut co-located di
    sini apa adanya krn memang sudah dari dulu 1 file sama Aset — bukan
    benar-benar "milik" domain Aset, kandidat dipindah ke file sendiri di
    sesi lain kalau mau lebih rapi.
  - `worthit.js`: `WorthIt` (cek "Worth It?" + Prioritas Belanja).

  Dicek dulu SEMUA cross-reference antar 10 modul ini (`grep` tiap modul
  ke modul lain dalam file yang sama) sebelum pindah — cuma 2 yang ada:
  `Renov`→`RenovCalc` (sekarang 1 file, `renovasi.js`) & `TimelineW`→`Renov`
  (beda file, tapi runtime call via variabel global, sama seperti pola
  aman yang sudah dipakai di semua migrasi sebelumnya). Dicek juga semua
  pemanggil dari file LAIN (banyak: `modals.js`, `modules-render.js`,
  `modules-calc.js`, `linktx.js`, `piutang-utang.js`, `hidup-seimbang.js`,
  dst) — semua lewat variabel global saat runtime (banyak malah sudah pakai
  guarded `typeof` check dari awal), bukan referensi lokal ke file.

  `features-renovasi-pajak-aset-order.js` DIHAPUS (tidak ada isi tersisa).
  `build.js` (`GROUP_A`) diupdate: 3 file baru ditambahkan di akhir
  (`linktx.js`, lalu `renovasi.js`, `aset.js`, `worthit.js`). Komentar
  "urutan load" di 7 file `GROUP_A` yang menyebut daftar urutan diupdate
  supaya konsisten. 3 komentar "PENTING" (bukan sekadar catatan historis)
  yang masih menyebut nama file lama sbg lokasi `Renov`/`WorthIt` — di
  `linktx.js`, `piutang-utang.js`, `hidup-seimbang.js` — juga diperbaiki.

  Dicek: tiap 1 dari 10 modul (`RenovCalc`, `ALOKASI_PRESETS`,
  `AlokasiAset`, `Aset`, `Renov`, `RenovAI`, `IDBStore`,
  `PORTFOLIO_LABELS`, `WorthIt`, `TimelineW`) cuma muncul 1x di source
  (di file domain barunya masing-masing) & 1x di bundle hasil build
  (`app-bundle-a.min.js`, sesuai `GROUP_A`, 0x di `app-bundle-b.min.js`),
  `node --check` lolos di semua 53 file source & kedua bundle,
  `index.html`/`app_production.html` tetap identik (cuma memuat kedua
  file bundle).

- ⏳ **Belum**: domain-domain lain yang masih berisi beberapa modul halaman
  tidak berhubungan dalam 1 file (`features-helpers-global-security.js`,
  `features-filter-scanstruk-ocr.js`, `features-gaji-cobek-tagihan.js`,
  `features-kategori-modal-tagihan-kalender.js`,
  `features-fi-checkoutscan-importexport-payroll.js`,
  `features-tukang-kendaraan-storage.js`,
  `features-aiwidget-reminder-gdrive-search.js`,
  `features-sheets-pwa-selftest.js`, `features-budget-laporan-carnotes-pelanggan.js`).
  **Beda dari sesi-sesi sebelumnya**: file-file ini didominasi FUNGSI
  lepas (`function namaFungsi(){...}`) yang saling panggil langsung
  antar-fungsi dalam banyak arah, BUKAN objek modul rapi (`const
  NamaModul={...}`) seperti `LinkTx`/`Renov`/`Aset`/dst. Batas domain di
  dalamnya tidak sejelas sebelumnya, jadi pemetaan & pengecekan referensi
  perlu lebih hati-hati per file (baca dulu isi lengkapnya, petakan semua
  pasangan pemanggil↔dipanggil) sebelum aman dipecah — masing-masing perlu
  sesi/permintaan terpisah.

- 🧹 **Cleanup: backup bundle dirapikan** (2026-07-10): folder `backups/`
  sempat numpuk jadi 16 file / 8.8MB (8 backup per bundle, dari batas lama
  `MAX_BACKUPS_PER_FILE=10`) dan ikut kebawa saat project di-zip untuk
  dikirim. Dibersihkan jadi 2 backup terbaru per bundle (yang lama sudah
  pasti tidak akan dipakai rollback lagi — `rollback.sh` cuma pernah dipakai
  buat balik ke build SEBELUMNYA, bukan yang 5-8 build lalu). `MAX_BACKUPS_PER_FILE`
  di `build.js` diturunkan 10 → 4 supaya ke depannya folder ini otomatis
  kejaga kecil (maks ~4 build terakhir per bundle) tanpa perlu dibersihkan
  manual lagi. Tidak ada yang diubah di bundle/source aplikasi itu sendiri —
  murni file backup + 1 angka konstanta di build.js. Dicek: `node build.js`
  & `rollback.sh` masih baca folder `backups/` dengan cara yang sama (cuma
  nama/isi variabel filter, bukan mekanismenya), `node --check` lolos di
  `build.js`.

- 🔒 **Perbaikan keamanan: enkripsi API key AI** (2026-07-10, build kw70-security-fix-apikey-encryption):
  Sebelumnya kunci enkripsi API key (`encryptApiKeyWithPin`/`decryptApiKeyWithPin`) diturunkan dari
  `localStorage.getItem('kw_pin')` — yaitu HASH PIN yang tersimpan sebagai teks biasa di localStorage
  yang sama dengan blob API key terenkripsi (`kw_apikey_enc`). Siapa pun yang bisa baca localStorage
  (DevTools, XSS, ekstensi browser, backup tidak terenkripsi) otomatis punya "kunci"-nya juga tanpa
  perlu tahu PIN — enkripsinya jadi tidak melindungi apa-apa dari ancaman yang sebenarnya (akses ke
  storage perangkat), cuma dari orang lihat sekilas di UI.

  **Perbaikan**: kunci sekarang diturunkan dari PIN MENTAH, yang cuma hidup sebentar di variabel
  memori sesi (`_sessionRawPin`) — diisi sesaat setelah PIN benar dimasukkan (`checkPin()`), dibuat
  (`finishOnboard()`), atau diganti (`gantiPin()`); TIDAK PERNAH ditulis ke localStorage/IndexedDB;
  otomatis hilang saat tab ditutup/reload (PIN harus dimasukkan ulang lain kali). PBKDF2 (100rb
  iterasi) + salt random per-enkripsi yang sudah ada sebelumnya tidak diubah — cuma input "password"
  ke PBKDF2-nya yang diperbaiki dari "hash yang bisa dibaca siapa saja" ke "PIN yang cuma ada di
  memori sesi yang sedang login".

  **Migrasi data existing user**: `loadAndMigrateApiKeyOnUnlock()` sekarang coba buka pakai skema
  BARU dulu; kalau gagal (berarti data lama, dienkripsi skema lama), fallback coba buka pakai skema
  LAMA (hash dari localStorage) — kalau berhasil, langsung re-enkripsi diam-diam pakai skema baru &
  simpan. Jadi user yang sudah pernah isi API key TIDAK perlu isi ulang, data lama otomatis "naik
  kelas" begitu dibuka sekali setelah update.

  Dicek: `node --check` lolos di source & kedua bundle hasil build. Dibuat skrip verifikasi terpisah
  (simulasi pakai Node `crypto.webcrypto`, logika identik dgn `crypto.subtle` di browser) yang
  membuktikan: (1) roundtrip skema baru berhasil, (2) PIN salah gagal decrypt, (3) data skema lama
  BERHASIL dimigrasikan tanpa kehilangan API key, (4) hash PIN (celah lama) TIDAK BISA lagi membuka
  data yang dienkripsi skema baru — 6/6 skenario lolos. **Belum**: tidak bisa dites di browser
  sungguhan (tidak ada environment browser di sini) — tetap wajib coba manual: isi API key di
  Pengaturan → AI Asisten, reload/tutup-buka app, pastikan API key masih ada & AI Asisten masih bisa
  dipanggil; kalau ada API key lama dari sebelum update, pastikan juga tidak minta isi ulang.

- 🔒 **Perbaikan keamanan: lockout percobaan PIN** (2026-07-10, build kw70-security-fix-pin-lockout):
  Sebelumnya tidak ada batas percobaan PIN salah sama sekali — PIN 4 digit bisa dicoba berkali-kali
  tanpa jeda lewat keypad di layar (`pinPress()`/`checkPin()`). Sekarang setelah **5x salah
  berturut-turut**, keypad terkunci sementara dengan pesan hitung-mundur di `#pinLockMsg`, durasinya
  makin lama tiap kali terulang: 30 detik → 1 menit → 2 menit → 5 menit → 10 menit (lalu tetap di 10
  menit untuk pengulangan berikutnya). Status lock disimpan di localStorage (`kw_pin_fails`,
  `kw_pin_lock_until`, `kw_pin_lock_stage`) supaya tetap berlaku walau app di-reload/ditutup-buka
  selagi masih dalam masa lock. Reset otomatis begitu PIN benar dimasukkan.

  Markup baru di `index.html`/`app_production.html` (identik di keduanya): `#pinLockMsg` (pesan
  hitung-mundur, di bawah `.pin-dots`) & `id="pinPad"` di `.pin-pad` (dipakai JS buat kasih efek
  redup + `pointer-events:none` selama lock).

  **Catatan jujur soal batasannya** (biar tidak dikira lebih aman dari yang sebenarnya): ini CUMA
  menghalangi coba-coba lewat keypad di layar. Ini BUKAN pengaman kripto — siapa pun yang punya akses
  ke JS console/localStorage tetap bisa hitung hash 10.000 kombinasi PIN dalam hitungan milidetik
  tanpa lewat `checkPin()` sama sekali (`kw_pin` yang tersimpan cuma SHA-256 dgn salt tetap yang sama
  utk semua instalasi). Nilai fitur ini murni memperlambat orang yang literally mencet-mencet keypad
  di HP yang lagi dipegang orang lain.

  Dicek: `node --check` lolos di source & kedua bundle hasil build. Dibuat skrip verifikasi terpisah
  (simulasi state-machine murni, tanpa DOM) yang membuktikan: 4x salah belum lock, 5x salah memicu
  lock 30 detik, PIN benar sekalipun tetap diblok selama masa lock aktif, lock otomatis lepas &
  counter ke-reset setelah durasinya lewat + PIN benar, dan durasi progresif persis
  30/60/120/300/600/600/600 detik utk pengulangan ke-1 s.d. ke-7 — 6/6 skenario lolos. **Belum**:
  tidak bisa dites tampilan sungguhan di browser (tidak ada environment browser di sini) — tetap
  wajib coba manual: masukkan PIN salah 5x, pastikan keypad keliatan redup/tidak bisa dipencet & ada
  pesan hitung-mundur di bawah titik PIN, tunggu sampai habis, pastikan bisa coba lagi normal.

- ✅ **Kalkulator Angka dipisah jadi file domain sendiri `kalkulator-input.js`**
  (v69, build kw70-split-kalkulator-input): langkah pertama membedah
  `features-helpers-global-security.js` (1285 baris, campuran ~10 domain tak
  berhubungan — error handler, format angka, state `D`+save/load, PIN+
  enkripsi API key, modal generik, navigasi halaman, kalkulator, dll).
  Dipilih sbg potongan pertama karena paling mandiri: `safeCalc` (parser
  ekspresi +−×÷), `normalizeAmtToken`, `evalAmtExpr`, popup kalkulator
  (`openCalc`/`closeCalc`/`calcRenderDisplay`/`calcPress`/`calcClear`/
  `calcBackspace`/`calcEquals`/`calcUseResult`), dan preview jumlah
  (`calcPreviewValue`/`updateAmtPreview`) cuma bergantung ke
  `document.getElementById` + `openModal`/`closeModal`/`fmt()` (tetap di
  file asal, diakses lewat variabel global saat runtime tombol diklik —
  bukan saat file dimuat), TIDAK direferensi modul lain di file asal. Tidak
  bentrok nama dgn `modules-calc.js` (itu domain lain: kalkulator Kebebasan
  Finansial `FI`). Dipanggil dari banyak file lain (`modals.js`,
  `renovasi.js`, `features-gaji-cobek-tagihan.js`,
  `features-tukang-kendaraan-storage.js`, dst) lewat nama global di
  `data-action`/`onblur` HTML — aman krn semua akses saat runtime. `build.js`
  (`GROUP_B`, ditambah tepat setelah `features-helpers-global-security.js`)
  & komentar "urutan load" di ke-8 file `features-*.js` GROUP_B diupdate
  supaya konsisten menyebut `kalkulator-input.js`. Dicek: ke-13 fungsi
  (`safeCalc`, `normalizeAmtToken`, `evalAmtExpr`, `openCalc`, `closeCalc`,
  `calcRenderDisplay`, `calcPress`, `calcClear`, `calcBackspace`,
  `calcEquals`, `calcUseResult`, `calcPreviewValue`, `updateAmtPreview`)
  cuma muncul 1x di source (di `kalkulator-input.js`) & 1x di
  `app-bundle-b.min.js` (sesuai `GROUP_B`, 0x di `app-bundle-a.min.js`),
  `node --check` lolos di semua file source & kedua bundle,
  `index.html`/`app_production.html` tetap identik (cuma memuat kedua file
  bundle, isi tidak berubah selain `?v=69`). **Belum**: tidak bisa dites
  tampilan sungguhan di browser (tidak ada environment browser di sini) —
  tetap wajib coba manual: buka input jumlah manapun (mis. Tambah
  Transaksi), tap ikon 🧮, coba tombol angka/operator/hapus/=/pakai hasil,
  pastikan preview "= Rp ..." di bawah input jumlah masih muncul saat ketik
  ekspresi seperti `1500000+250000`.

  Sisa `features-helpers-global-security.js` (~1140 baris) masih campuran
  banyak domain lain (lihat daftar di atas) — lanjutkan satu potongan lagi
  per sesi berikutnya, ikuti pola yang sama (cari bagian paling mandiri
  dulu).

- ✅ **Keamanan PIN & enkripsi API key dipisah jadi file domain sendiri
  `keamanan-pin.js`** (v70, build kw70-split-keamanan-pin): potongan KEDUA
  dari pembedahan `features-helpers-global-security.js` (lanjutan
  `kalkulator-input.js` di v69). Dipindah: `hashPin`, `_sessionRawPin`,
  `showPinScreen`, lockout percobaan PIN (`PIN_MAX_ATTEMPTS`,
  `PIN_LOCK_DURATIONS_SEC`, `_pinLockState`, `_pinLockRemainingMs`,
  `_formatLockDuration`, `_pinLockTimer`, `updatePinLockUI`, `pinPress`,
  `pinBack`, `updatePinDots`, `checkPin`), `gantiPin`, dan enkripsi API key
  (`API_KEY_ENC_STORAGE_KEY`, `API_KEY_PBKDF2_ITER`, `_b64FromBuf`,
  `_bufFromB64`, `_deriveApiKeyCryptoKey`, `encryptApiKeyWithPin`,
  `decryptApiKeyWithPin`, `persistApiKeyEncrypted`,
  `loadAndMigrateApiKeyOnUnlock`) — total 21 deklarasi top-level.

  Blok ini TIDAK berurutan lurus di file asal (diselang-seling dengan
  `updateDebugConsoleBtn`/`toggleDebugConsole` [domain Debug Console] &
  `finishOnboard` [domain Onboarding] di antaranya), jadi dipindah per
  bagian, bukan satu potongan baris lurus — 3 bagian terpisah:
  hashPin+_sessionRawPin, showPinScreen+lockout+checkPin, lalu
  gantiPin+enkripsi API key. Ketiganya digabung ke 1 file baru karena
  memang 1 domain yang sama (Keamanan PIN), cuma kebetulan tertulis
  berselang dgn domain lain di file lama.

  Dicek dulu semua referensi ke-21 identifier ini lintas file (`grep -rl`
  ke semua `.js`/`.html`): yang ada di luar file asal semuanya lewat
  variabel global saat runtime — `showPinScreen`/`encryptApiKeyWithPin`/
  `decryptApiKeyWithPin` dipanggil dari self-test guard di
  `features-sheets-pwa-selftest.js`, `persistApiKeyEncrypted` dipanggil
  dari `features-gaji-cobek-tagihan.js` saat tombol simpan API key
  diklik, `pinPress`/`pinBack`/`gantiPin` dipanggil dari
  `index.html`/`app_production.html` lewat `data-action` di keypad PIN &
  tombol "Ganti PIN" di Pengaturan — semua aman dipindah krn diakses
  runtime, bukan referensi lokal ke file. Dalam file baru sendiri,
  `gantiPin` tetap memanggil `showPinPromptModal`/`showAlertModal`
  (modal generik, tetap di `features-helpers-global-security.js`, aman
  krn keduanya dipanggil saat runtime tombol diklik, sama-sama di
  GROUP_B).

  `build.js` (`GROUP_B`, `keamanan-pin.js` ditambah tepat setelah
  `features-helpers-global-security.js`, sebelum `kalkulator-input.js`) &
  komentar "urutan load" di ke-8 file `features-*.js`/`kalkulator-input.js`
  GROUP_B yang menyebut daftar urutan diupdate supaya konsisten. Dicek:
  ke-21 identifier cuma muncul 1x di source (di `keamanan-pin.js`) & 1x
  di `app-bundle-b.min.js` (sesuai `GROUP_B`, 0x di `app-bundle-a.min.js`),
  `node --check` lolos di semua file source & kedua bundle,
  `index.html`/`app_production.html` tetap identik (cuma memuat kedua
  file bundle, isi tidak berubah selain `?v=70`). **Belum**: tidak bisa
  dites tampilan sungguhan di browser (tidak ada environment browser di
  sini) — tetap wajib coba manual: masukkan PIN saat buka app (pastikan
  masih bisa login), coba salah 5x (pastikan lockout masih jalan & pesan
  hitung-mundur muncul), coba Pengaturan → Ganti PIN, dan coba isi/ganti
  API key AI di Pengaturan → AI Asisten lalu reload app (pastikan API key
  masih tersimpan & tidak minta isi ulang).

  Sisa `features-helpers-global-security.js` (~964 baris) masih campuran
  domain lain: error handler, format angka & tema, state `D`+save/load,
  onboarding, debug console, migrasi data, modal generik, navigasi
  halaman, dll — lanjutkan satu potongan lagi per sesi berikutnya, ikuti
  pola yang sama (cari bagian paling mandiri dulu).

- ✅ **Modal generik & navigasi halaman dipisah jadi file domain sendiri
  `modal-navigasi.js`** (v71, build kw70-split-modal-navigasi): potongan
  KETIGA dari pembedahan `features-helpers-global-security.js` (lanjutan
  `kalkulator-input.js` v69 & `keamanan-pin.js` v70). Beda dari 2 potongan
  sebelumnya, blok ini KONTIGU (baris 721–956 lurus, tidak diselang domain
  lain) — 22 deklarasi: modal konfirmasi/prompt/pilihan/info/pin
  (`askConfirm`, `showPromptModal`, `showChoiceModal`, `showAlertModal`,
  `showPinPromptModal`, & pasangan `_xxxAnswer`/`_xxxSubmit`-nya masing2),
  buka/tutup modal & quick-switcher (`openModal`, `closeModal`, `openQS`,
  `closeQS`, `_syncNavVisibilityForModals`), swipe-to-dismiss
  (`enableSwipeToDismiss`), pindah halaman (`showPage`,
  `refreshCurrentPage`), collapse/expand kartu (`toggleCardCollapse`,
  `applyOneCardCollapsePref`, `applyCardCollapsePrefs`).

  Dipilih sbg potongan berikutnya krn: murni domain UI generik, TIDAK
  bergantung ke state `D` atau modul halaman manapun (beda dgn kebanyakan
  modul `const NamaModul={...}` yg dipindah di fase sebelumnya) — cuma 2
  pengecualian yg sudah dicek aman: `closeModal()` pakai guarded
  `typeof WorthIt!=='undefined'` sebelum akses `WorthIt.pendingBuyId`
  (pola lama, sudah ada sblm dipindah), dan `showPage()` panggil
  `renderPageContent()` (di `modules-render.js`, GROUP_A) lewat variabel
  global saat tombol nav diklik. Dicek juga TIDAK ada kode top-level yang
  jalan sendiri saat file dimuat di dalam blok ini (beda dgn
  `toggleStgGroup`/`stgSearch` tepat di atasnya di file lama, yang PUNYA
  1 `document.addEventListener('keydown',...)` top-level — makanya
  keduanya sengaja DITINGGAL di `features-helpers-global-security.js`,
  bukan ikut dipindah, biar batas potongan tetap bersih di titik yang
  aman).

  Dipakai dari HAMPIR SEMUA file lain (`askConfirm`/`openModal`/
  `closeModal` dipakai di ~20 file source) — semua dicek lewat `grep -rl`
  ke semua `.js`/`.html`, dan semuanya lewat nama global saat runtime
  (panggilan dalam fungsi, atau `data-action`/`onclick` di HTML), bukan
  referensi lokal ke file, jadi aman dipindah ke file sendiri walau
  dipanggil dari begitu banyak tempat.

  `build.js` (`GROUP_B`, `modal-navigasi.js` ditambah tepat setelah
  `keamanan-pin.js`, sebelum `kalkulator-input.js`) & komentar "urutan
  load" di ke-8 file `features-*.js` GROUP_B yang menyebut daftar urutan
  diupdate supaya konsisten. Dicek: ke-22 identifier (fungsi + variabel
  resolve seperti `_confirmResolve`, `_promptModalResolve`, dst — bukan
  cuma nama fungsi) cuma muncul 1x di source (di `modal-navigasi.js`) &
  1x di `app-bundle-b.min.js` (sesuai `GROUP_B`, 0x di
  `app-bundle-a.min.js`), `node --check` lolos di semua file source &
  kedua bundle, `index.html`/`app_production.html` tetap identik (cuma
  memuat kedua file bundle, isi tidak berubah selain `?v=71`). **Belum**:
  tidak bisa dites tampilan sungguhan di browser (tidak ada environment
  browser di sini) — tetap wajib coba manual: buka modal konfirmasi
  (mis. hapus transaksi), modal prompt (mis. tambah kategori custom),
  modal pilihan, modal info/alert, swipe-to-dismiss modal ke bawah, pindah
  antar halaman lewat nav bawah, dan collapse/expand kartu di dashboard —
  pastikan semua masih jalan normal.

  Sisa `features-helpers-global-security.js` (~728 baris) masih campuran
  domain lain: error handler (`_friendlyErrorNotice`), format angka/tema
  (`fmt`/`fmtFull`/`setTheme`/dll), state `D`+save/load (`save`/`load`/
  `_buildSaveJson`/dll), onboarding (`finishOnboard`/`updateOnboardPreview`),
  debug console (`toggleDebugConsole`), reset gaji mingguan
  (`checkWeeklySalaryReset`/dll), migrasi data (`runDataMigrations`/
  `migrateCobekCategory`), pencarian pengaturan (`stgSearch`/
  `toggleStgGroup`), `showMain` (lifecycle utama app), dll — lanjutkan
  satu potongan lagi per sesi berikutnya, ikuti pola yang sama (cari
  bagian paling mandiri & sebisa mungkin kontigu dulu).

- ✅ **Reset Gaji Mingguan dipisah jadi file domain sendiri
  `reset-gaji-mingguan.js`** (v72, build kw70-split-reset-gaji-mingguan):
  potongan KEEMPAT dari pembedahan `features-helpers-global-security.js`
  (lanjutan `kalkulator-input.js` v69, `keamanan-pin.js` v70,
  `modal-navigasi.js` v71). Dipindah: `getWeekRange` (hitung rentang
  Minggu–Sabtu berjalan), `_wrLastTotal`/`_wrLastCount` (state
  sementara), `checkWeeklySalaryReset` (deteksi & tawarkan reset absensi
  tiap hari Sabtu), `openWeeklyResetManual` (buka modal reset manual dari
  Absensi/Gaji), `confirmWeeklyReset` (proses reset + catat pemasukan
  gaji otomatis ke `D.transactions`) — 1 fitur utuh "gajian mingguan dari
  Absensi harian" di modul Tukang/Gaji.

  Blok ini kontigu di file lama (langsung sebelum `showMain`), TAPI 1
  fungsi generik di tengahnya — `todayStr()` (formatter tanggal
  `YYYY-MM-DD`, dipakai 12+ file lain di luar domain reset gaji, mirip
  `fmt`/`escapeHtml`) — SENGAJA DITINGGAL di
  `features-helpers-global-security.js`, tidak ikut dipindah, supaya
  domain baru murni "reset gaji mingguan" & tidak menyeret utilitas
  umum yang dipakai di mana-mana. Sisanya tidak referensi modul/fungsi
  domain lain kecuali lewat variabel global: `D.workDays`/
  `D.transactions`/`D.accounts`/`D.categories`/`D.lastResetPromptDate`,
  `uid()`/`save()`/`toast()`/`fmtFull()`/`todayStr()` (tetap di
  `features-helpers-global-security.js`), `openModal()`/`closeModal()`
  (`modal-navigasi.js`), `populateAccFilters()`
  (`features-filter-scanstruk-ocr.js`), `renderWorkDays()`/
  `renderDashboard()`/`renderKeuangan()`/`dateToISO()` (`modules-render.js`
  / `features-filter-scanstruk-ocr.js`) — semua dicek lewat `grep -rl`,
  semuanya diakses saat runtime (tombol diklik / modal dibuka), bukan
  referensi lokal ke file.

  `build.js` (`GROUP_B`, `reset-gaji-mingguan.js` ditambah tepat setelah
  `modal-navigasi.js`, sebelum `kalkulator-input.js`) & komentar "urutan
  load" di ke-8 file `features-*.js` GROUP_B diupdate supaya konsisten.
  Dicek: `getWeekRange`/`checkWeeklySalaryReset`/`openWeeklyResetManual`/
  `confirmWeeklyReset` cuma muncul 1x di source (di
  `reset-gaji-mingguan.js`) & 1x di `app-bundle-b.min.js` (sesuai
  `GROUP_B`, 0x di `app-bundle-a.min.js`), `todayStr` tetap cuma 1x di
  `features-helpers-global-security.js` (tidak ikut terhapus/terduplikasi),
  `node --check` lolos di semua file source & kedua bundle,
  `index.html`/`app_production.html` tetap identik (cuma `?v=72`).
  **Belum**: tidak bisa dites tampilan sungguhan di browser (tidak ada
  environment browser di sini) — tetap wajib coba manual: catat absensi
  harian di modul Tukang/Gaji, tunggu/pura-pura hari Sabtu (atau pakai
  tombol reset manual di modal Absensi/Kalkulator Gaji), pastikan modal
  "Reset Mingguan" masih muncul dgn total & jumlah hari yang benar, coba
  centang "catat sbg pemasukan otomatis" & pastikan transaksi baru masuk
  ke Keuangan, dan coba reset tanpa centang (pastikan absensi tetap
  ke-reset tanpa transaksi baru).

  Sisa `features-helpers-global-security.js` (~660 baris) masih campuran
  domain lain: error handler (`_friendlyErrorNotice`), format angka/tema
  (`fmt`/`fmtFull`/`setTheme`/dll), state `D`+save/load (`save`/`load`/
  `_buildSaveJson`/dll), onboarding (`finishOnboard`/`updateOnboardPreview`),
  debug console (`toggleDebugConsole`), migrasi data
  (`runDataMigrations`/`migrateCobekCategory`), pencarian pengaturan
  (`stgSearch`/`toggleStgGroup`), `showMain` (lifecycle utama app), dll —
  lanjutkan satu potongan lagi per sesi berikutnya, ikuti pola yang sama.

- ✅ **Debug Console & Pencarian Pengaturan dipisah jadi 2 file domain
  sendiri** (v73, build kw70-split-debug-pengaturan): potongan KELIMA &
  KEENAM dari pembedahan `features-helpers-global-security.js` (lanjutan
  `kalkulator-input.js` v69, `keamanan-pin.js` v70, `modal-navigasi.js`
  v71, `reset-gaji-mingguan.js` v72). Dua domain KECIL & mandiri sekaligus
  dipindah di sesi yang sama krn keduanya cuma puluhan baris, murni DOM/
  localStorage, tidak ada domain existing yang cocok jadi masing2 dapat
  file baru sendiri:
  - `debug-console.js`: `updateDebugConsoleBtn`, `toggleDebugConsole`
    (aktifkan/matikan panel debug pihak-3 "eruda", termasuk lazy-load
    skrip dari CDN). Cuma pakai `localStorage`/`window.eruda`/DOM +
    `toast()` (tetap di `features-helpers-global-security.js`).
  - `pengaturan-search.js`: `toggleStgGroup`, `_stgSearchHighlighted`,
    `stgSearch` (buka/tutup & cari grup pengaturan), plus 1
    `document.addEventListener('keydown',...)` TOP-LEVEL (dukungan
    keyboard Enter/Spasi utk buka grup) — ini SATU-SATUNYA kasus sejauh
    ini dimana kode yang dipindah bukan cuma deklarasi function/const,
    tapi aman krn cuma daftarkan listener baru ke `document`, tidak
    bergantung modul lain siap/belum saat listener dipasang (baru
    dieksekusi belakangan saat user pencet tombol).

  Dicek referensi ke-6 identifier lintas file (`grep -rl`): semua
  pemanggil di luar file asal (`index.html`/`app_production.html` lewat
  `data-action`/`onclick`/`oninput`, `modules-render.js` panggil
  `updateDebugConsoleBtn()` saat render halaman Pengaturan) lewat
  variabel global saat runtime, aman dipindah.

  `build.js` (`GROUP_B`, `debug-console.js` & `pengaturan-search.js`
  ditambah tepat setelah `reset-gaji-mingguan.js`, sebelum
  `kalkulator-input.js`) & komentar "urutan load" di ke-8 file
  `features-*.js` GROUP_B diupdate supaya konsisten. Dicek:
  `updateDebugConsoleBtn`/`toggleDebugConsole`/`toggleStgGroup`/
  `stgSearch` cuma muncul 1x di source (di file domain barunya
  masing-masing) & 1x di `app-bundle-b.min.js` (sesuai `GROUP_B`, 0x di
  `app-bundle-a.min.js`), `node --check` lolos di semua file source &
  kedua bundle, `index.html`/`app_production.html` tetap identik (cuma
  `?v=73`). **Belum**: tidak bisa dites tampilan sungguhan di browser
  (tidak ada environment browser di sini) — tetap wajib coba manual: di
  Pengaturan, coba aktifkan/matikan Debug Console (pastikan panel eruda
  muncul/hilang & teks tombol berubah), lalu coba kotak pencarian
  Pengaturan (ketik sesuatu, pastikan grup terkait otomatis terbuka &
  kartu yang cocok tersorot).

  Sisa `features-helpers-global-security.js` (~500 baris) masih campuran
  domain lain: error handler (`_friendlyErrorNotice`), format angka/tema
  (`fmt`/`fmtFull`/`setTheme`/dll), state `D`+save/load (`save`/`load`/
  `_buildSaveJson`/dll), onboarding (`finishOnboard`/`updateOnboardPreview`),
  migrasi data (`runDataMigrations`/`migrateCobekCategory`), `showMain`
  (lifecycle utama app), dll — lanjutkan satu potongan lagi per sesi
  berikutnya, ikuti pola yang sama.

- ✅ **Onboarding dipisah jadi file domain sendiri `onboarding.js`** (v74,
  build kw70-split-onboarding): potongan KETUJUH dari pembedahan
  `features-helpers-global-security.js` (lanjutan `kalkulator-input.js` v69,
  `keamanan-pin.js` v70, `modal-navigasi.js` v71, `reset-gaji-mingguan.js`
  v72, `debug-console.js`/`pengaturan-search.js` v73). Dipindah:
  `updateOnboardPreview` (preview kasar gaji/kiriman saat isi form
  onboarding) & `finishOnboard` (simpan profil awal + hash PIN + tandai
  `kw_setup` + panggil `showMain()`) — domain kecil & mandiri, cuma dipakai
  sekali di layar onboarding pertama kali buka app.

  Tidak kontigu di file lama (dipisah ~10 baris oleh `todayStr`), TAPI
  `todayStr` SENGAJA DITINGGAL di `features-helpers-global-security.js`
  (bukan bagian domain onboarding, cuma kebetulan bersebelahan — dipakai
  12+ file lain, mirip `fmt`/`escapeHtml`). Sisanya cuma referensi ke
  variabel global saat runtime (diklik tombol/isi form, bukan saat file
  di-load): `D.profile`/`save()`/`fmtFull()`/`fmtFullSigned()`/
  `safeSetItem()` (tetap di `features-helpers-global-security.js`),
  `hashPin()`/`_sessionRawPin` (`keamanan-pin.js`), `showAlertModal()`
  (`modal-navigasi.js`), `showMain()` (tetap di
  `features-helpers-global-security.js`) — semua dicek lewat `grep -rl`.

  `build.js` (`GROUP_B`, `onboarding.js` ditambah tepat setelah
  `pengaturan-search.js`, sebelum `kalkulator-input.js`) & komentar
  "urutan load" di ke-8 file `features-*.js` GROUP_B diupdate supaya
  konsisten. Dicek: `updateOnboardPreview`/`finishOnboard` cuma muncul 1x
  di source (di `onboarding.js`) & 1x di `app-bundle-b.min.js` (sesuai
  `GROUP_B`, 0x di `app-bundle-a.min.js`), `todayStr` tetap cuma 1x di
  `features-helpers-global-security.js` (tidak ikut terhapus/
  terduplikasi), `node --check` lolos di semua file source & kedua
  bundle, `index.html`/`app_production.html` tetap identik (cuma
  `?v=74`). **Belum**: tidak bisa dites tampilan sungguhan di browser
  (tidak ada environment browser di sini) — tetap wajib coba manual:
  hapus data app (atau pakai HP/browser baru) supaya layar onboarding
  muncul, isi gaji/kiriman & pastikan angka preview di bawah form
  berubah otomatis, isi PIN kurang dari 4 digit dulu (pastikan muncul
  peringatan "PIN Belum Valid"), lalu isi PIN 4 digit & tekan "Mulai
  Sekarang" — pastikan masuk ke halaman utama dengan nama & tema yang
  benar, dan PIN tersimpan (coba tutup-buka app lagi, pastikan diminta
  PIN yang sama).

  Sisa `features-helpers-global-security.js` (~460 baris) masih campuran
  domain lain: error handler (`_friendlyErrorNotice`), format angka/tema
  (`fmt`/`fmtFull`/`setTheme`/dll), status diagnostik/versi
  (`computeProductionSyncStatus`/`computeModuleSyncStatus`/
  `computeFileSizeStatus`/`getHtmlSnapshotForSelfTest`), state `D`+
  save/load (`save`/`load`/`_buildSaveJson`/dll), migrasi data
  (`runDataMigrations`/`migrateCobekCategory`), `showMain` (lifecycle
  utama app), dll — lanjutkan satu potongan lagi per sesi berikutnya,
  ikuti pola yang sama.

- ✅ **Diagnostik & Sinkronisasi Versi dipisah jadi file domain sendiri
  `diagnostik-versi.js`** (v75, build kw70-split-diagnostik-versi):
  potongan KEDELAPAN dari pembedahan `features-helpers-global-security.js`
  (lanjutan `kalkulator-input.js` v69, `keamanan-pin.js` v70,
  `modal-navigasi.js` v71, `reset-gaji-mingguan.js` v72,
  `debug-console.js`/`pengaturan-search.js` v73, `onboarding.js` v74).
  Dipindah: `getHtmlSnapshotForSelfTest` (snapshot HTML utk self-test),
  `computeProductionSyncStatus` (cek versi produksi vs master),
  `computeModuleSyncStatus` + IIFE `_checkModuleVersionSync` (cek versi
  antar file modul, kasih toast peringatan otomatis saat file dimuat
  kalau ada yang beda versi), `computeFileSizeStatus` +
  `FILE_SIZE_WARN_BYTES`/`FILE_SIZE_ACTION_BYTES` (cek ukuran HTML vs
  ambang batas mulai-pecah-file).

  **KHUSUS di potongan ini:** `APP_BUILD_VERSION` &
  `PRODUCTION_BUILD_SYNCED_VERSION` SENGAJA TIDAK ikut dipindah, tetap di
  `features-helpers-global-security.js` — karena `build.js` (fungsi
  `detectCurrentVersion()`) membaca `APP_BUILD_VERSION` langsung dari isi
  file itu lewat regex, jadi kalau dipindah, `build.js` akan error
  "Tidak ketemu APP_BUILD_VERSION". Semua fungsi yang dipindah cukup
  mengakses kedua konstanta itu sbg variabel global saat runtime (pola
  yang sama seperti akses `MODULE_CALC_VERSION`/`MODAL_VERSION` dari file
  lain, sudah dipakai sejak awal proyek ini).

  IIFE `_checkModuleVersionSync` jalan OTOMATIS saat file dimuat (bukan
  cuma deklarasi function) & butuh `MODULE_CALC_VERSION`
  (`modules-calc.js`), `MODULE_FEATURES_VERSION`
  (`features-budget-laporan-carnotes-pelanggan.js`), `MODAL_VERSION`
  (`modals.js`), `MODULE_RENDER_VERSION` (`modules-render.js`) — semua
  ada di GROUP_A, yang dimuat lewat `app-bundle-a.min.js` SEBELUM
  `app-bundle-b.min.js` (GROUP_B, tempat file baru ini) di
  index.html/app_production.html — jadi sudah pasti tersedia saat IIFE
  ini jalan, terlepas dari posisi persis file baru di dalam GROUP_B.

  `build.js` (`GROUP_B`, `diagnostik-versi.js` ditambah tepat setelah
  `features-helpers-global-security.js`) & komentar "urutan load" di
  ke-8 file `features-*.js` GROUP_B diupdate supaya konsisten. Dicek:
  `getHtmlSnapshotForSelfTest`/`computeProductionSyncStatus`/
  `computeModuleSyncStatus`/`computeFileSizeStatus` cuma muncul 1x di
  source (di `diagnostik-versi.js`) & 1x di `app-bundle-b.min.js`
  (sesuai `GROUP_B`, 0x di `app-bundle-a.min.js`), `APP_BUILD_VERSION`/
  `PRODUCTION_BUILD_SYNCED_VERSION` tetap cuma di
  `features-helpers-global-security.js` (tidak ikut terpindah/
  terduplikasi, `build.js` masih jalan normal & berhasil deteksi &
  naikkan versi), `node --check` lolos di semua file source & kedua
  bundle, `index.html`/`app_production.html` tetap identik (cuma
  `?v=75`). **Belum**: tidak bisa dites tampilan sungguhan di browser
  (tidak ada environment browser di sini) — tetap wajib coba manual: di
  halaman Tentang/Pengaturan, pastikan status "Sinkron (v...)" & status
  ukuran file masih muncul dengan benar, buka console browser & pastikan
  tidak ada warning "Versi modul tidak sinkron" yang salah muncul
  (kecuali memang lagi ada file yang ketinggalan versi beneran), dan
  coba jalankan smoke-test manual (`?dev=1`) utk cek self-test snapshot
  masih jalan.

  Sisa `features-helpers-global-security.js` (~400 baris) masih
  campuran domain lain: error handler (`_friendlyErrorNotice`), format
  angka/tema (`fmt`/`fmtFull`/`setTheme`/dll), state `D`+save/load
  (`save`/`load`/`_buildSaveJson`/dll), migrasi data
  (`runDataMigrations`/`migrateCobekCategory`), `showMain` (lifecycle
  utama app), dll — lanjutkan satu potongan lagi per sesi berikutnya,
  ikuti pola yang sama.

- ✅ **Format Angka & Tema dipisah jadi file domain sendiri
  `format-tema.js`** (v76, build kw70-split-format-tema): potongan
  KESEMBILAN dari pembedahan `features-helpers-global-security.js`
  (lanjutan `kalkulator-input.js` v69, `keamanan-pin.js` v70,
  `modal-navigasi.js` v71, `reset-gaji-mingguan.js` v72,
  `debug-console.js`/`pengaturan-search.js` v73, `onboarding.js` v74,
  `diagnostik-versi.js` v75). Dipindah: `fmt` (format rupiah singkat,
  mis. "Rp 1.5 jt"), `fmtFull`/`fmtFullSigned` (format rupiah penuh),
  `toast` (notifikasi bawah layar), `setTheme`/`applyEffectiveTheme`
  (ganti & terapkan tema, termasuk mode "auto" ikut jam HP).

  **Beda dari potongan2 sebelumnya:** domain ini yang PALING BANYAK
  dipakai di seluruh app (`toast()` saja dipanggil 900+ kali dari
  puluhan file) — sengaja dipindah BELAKANGAN (bukan salah satu yang
  pertama) supaya pola pemisahan sudah teruji dulu lewat domain2 kecil.
  Tetap AMAN krn semua pemanggil di file lain mengakses fungsi2 ini sbg
  variabel global saat runtime (tombol diklik/render halaman), BUKAN
  saat file di-load — jadi tidak masalah walau dipindah ke file
  terpisah, asal tetap satu bundle (GROUP_B) yang sama dgn
  `D`/`save()` yang dipakai `setTheme`.

  `build.js` (`GROUP_B`, `format-tema.js` ditambah tepat setelah
  `diagnostik-versi.js`, sebelum `keamanan-pin.js`) & komentar "urutan
  load" di ke-8 file `features-*.js` GROUP_B diupdate supaya konsisten.
  Dicek: `fmt`/`fmtFull`/`fmtFullSigned`/`toast`/`setTheme`/
  `applyEffectiveTheme` cuma muncul 1x di source (di `format-tema.js`)
  & 1x di `app-bundle-b.min.js` (sesuai `GROUP_B`, 0x di
  `app-bundle-a.min.js`), `todayStr`/`showMain`/`clearChat` tetap utuh
  di `features-helpers-global-security.js` (tidak ikut
  terhapus/terduplikasi), `node --check` lolos di semua file source &
  kedua bundle, `index.html`/`app_production.html` tetap identik (cuma
  `?v=76`). **Belum**: tidak bisa dites tampilan sungguhan di browser
  (tidak ada environment browser di sini) — tetap wajib coba manual
  MENYELURUH krn domain ini dipakai di mana-mana: buka beberapa halaman
  berbeda & pastikan semua angka rupiah tampil benar (format singkat &
  penuh), coba aksi yang biasanya munculkan toast (simpan transaksi,
  hapus data, dll — pastikan notifikasi tetap muncul di bawah layar),
  dan coba ganti tema (terang/gelap/auto) di Pengaturan — pastikan
  warna app berubah & pilihan tema tersimpan setelah reload.

  Sisa `features-helpers-global-security.js` (~380 baris) masih
  campuran domain lain: error handler (`_friendlyErrorNotice`), state
  `D`+save/load (`save`/`load`/`_buildSaveJson`/dll), migrasi data
  (`runDataMigrations`/`migrateCobekCategory`), event dispatcher global
  (`data-action`/`data-onclick` lewat `document.addEventListener`),
  `showMain` (lifecycle utama app), dll. Sisa ini jauh lebih saling
  terkait erat satu sama lain (deklarasi `D`, `save()`/`load()` yang
  membaca-tulis `D` langsung, `migrateCobekCategory()` dipanggil dari
  dalam `load()`) dibanding domain2 sebelumnya — kalau mau dilanjutkan,
  pertimbangkan lebih hati2 potongan mana yang benar2 bisa berdiri
  sendiri tanpa memecah alur save/load yang jadi jantung app.

- ✅ **Error Handler Global dipisah jadi file domain sendiri
  `error-handler.js`** (v77, build kw70-split-error-handler): potongan
  KESEPULUH dari pembedahan `features-helpers-global-security.js`
  (lanjutan `kalkulator-input.js` v69, `keamanan-pin.js` v70,
  `modal-navigasi.js` v71, `reset-gaji-mingguan.js` v72,
  `debug-console.js`/`pengaturan-search.js` v73, `onboarding.js` v74,
  `diagnostik-versi.js` v75, `format-tema.js` v76). Dipindah:
  `_lastErrorToastAt`, `_friendlyErrorNotice` (toast ramah dibatasi
  1x/3 detik saat ada error), dan 2 listener top-level
  `window.addEventListener('error'/'unhandledrejection', ...)` yang
  menangkap error tak tertangani di seluruh app.

  Domain PALING mandiri sejauh ini: `_lastErrorToastAt`/
  `_friendlyErrorNotice` TIDAK direferensi sama sekali dari file lain
  (dicek `grep -rn`, 0 hasil di luar file asalnya) — cuma dipanggil
  dari kedua listener yang juga ikut pindah bareng. Satu2nya dependensi
  luar cuma `toast()` (`format-tema.js`), diakses lewat
  `typeof toast==='function'` (sudah ada fallback `console.warn` kalau
  belum siap, jadi aman terlepas urutan pasti load).

  `build.js` (`GROUP_B`, `error-handler.js` ditambah tepat setelah
  `format-tema.js`, sebelum `keamanan-pin.js`) & komentar "urutan load"
  di ke-8 file `features-*.js` GROUP_B diupdate supaya konsisten.
  Dicek: `_friendlyErrorNotice` cuma muncul 1x di source (di
  `error-handler.js`) & 1x di `app-bundle-b.min.js` (sesuai `GROUP_B`,
  0x di `app-bundle-a.min.js`), `escapeHtml` tetap utuh di
  `features-helpers-global-security.js` (tidak ikut
  terhapus/terduplikasi), `node --check` lolos di semua file source &
  kedua bundle, `index.html`/`app_production.html` tetap identik (cuma
  `?v=77`). **Belum**: tidak bisa dites tampilan sungguhan di browser
  (tidak ada environment browser di sini) — tetap wajib coba manual:
  buka console browser, coba picu error sengaja (mis. panggil fungsi
  yang tidak ada lewat console), pastikan toast "⚠️ Ada error kecil..."
  tetap muncul & tidak spam kalau errornya beruntun cepat (harus
  dibatasi 1x/3 detik).

  Sisa `features-helpers-global-security.js` (~360 baris): `escapeHtml`,
  konstanta default (`MONTHS`/`DEFAULT_ACCOUNTS`/dll), migrasi data
  (`SCHEMA_VERSION`/`runDataMigrations`/`migrateCobekCategory`),
  `APP_BUILD_VERSION`/`PRODUCTION_BUILD_SYNCED_VERSION` (TETAP di sini,
  lihat catatan v75 soal `build.js`), deklarasi state `D` + variabel
  global lain, save/load (`save`/`load`/`_buildSaveJson`/
  `_writeLocalSnapshot`/`saveFlush`/`withSaveGuard`/dll), `uid`/
  `sameId`, event dispatcher global `data-action`/`data-onclick`, dan
  `showMain`/`clearChat`/`todayStr`. Bagian save/load + `D` + event
  dispatcher ini jantung app yang saling berhubungan erat — kalau mau
  dilanjutkan, domain kecil paling mandiri berikutnya yang masih masuk
  akal untuk dipisah sendiri kemungkinan cuma `escapeHtml` (dipakai
  luas tapi fungsi murni tanpa dependensi) atau konstanta default
  (`MONTHS`/`MONTHS_FULL`/`DEFAULT_COBEK_KATEGORI`/`DEFAULT_ACCOUNTS`/
  `DEFAULT_SPAREPARTS`) — selebihnya (D, save/load, migrasi, dispatcher,
  showMain) sebaiknya TETAP jadi satu file "core" krn saling
  bergantung erat & berisiko tinggi kalau dipisah sembarangan tanpa
  bisa dites di browser.

- ✅ **Helper Teks & Kalender dipisah jadi file domain sendiri
  `helper-teks.js`** (v78, build kw70-split-helper-teks): potongan
  KESEBELAS dari pembedahan `features-helpers-global-security.js`
  (lanjutan `kalkulator-input.js` v69, `keamanan-pin.js` v70,
  `modal-navigasi.js` v71, `reset-gaji-mingguan.js` v72,
  `debug-console.js`/`pengaturan-search.js` v73, `onboarding.js` v74,
  `diagnostik-versi.js` v75, `format-tema.js` v76, `error-handler.js`
  v77). Dipindah: `escapeHtml` (escape karakter HTML berbahaya),
  `MONTHS`/`MONTHS_FULL` (nama bulan singkat & lengkap Bahasa
  Indonesia).

  **KHUSUS di potongan ini:** `DEFAULT_COBEK_KATEGORI`/
  `DEFAULT_ACCOUNTS`/`DEFAULT_SPAREPARTS` (konstanta default lain yg
  ditaruh persis di sebelah blok ini) SENGAJA TIDAK ikut dipindah —
  karena ketiganya dibaca langsung di dalam deklarasi `let D = {...}`
  DI FILE YANG SAMA saat file itu di-load (bukan di dalam function
  body yang baru jalan belakangan), jadi kalau dipindah ke file lain,
  file itu HARUS dimuat SEBELUM `features-helpers-global-security.js`
  — beda pola dari semua potongan sebelumnya & lebih berisiko tanpa
  bisa dites di browser, jadi sengaja ditunda dulu. `escapeHtml`/
  `MONTHS`/`MONTHS_FULL` aman dipindah krn cuma dipakai di dalam
  function body file lain (mis. `cobek.js`, `modules-render.js`, yg
  notabene ada di GROUP_A/dimuat lebih dulu dari file baru ini) yang
  baru jalan saat runtime (klik/render halaman), bukan saat file itu
  di-load.

  `build.js` (`GROUP_B`, `helper-teks.js` ditambah tepat setelah
  `error-handler.js`, sebelum `keamanan-pin.js`) & komentar "urutan
  load" di ke-8 file `features-*.js` GROUP_B diupdate supaya konsisten.
  Dicek: `escapeHtml`/`MONTHS`/`MONTHS_FULL` cuma muncul 1x di source
  (di `helper-teks.js`) & 1x di `app-bundle-b.min.js` (sesuai
  `GROUP_B`, 0x di `app-bundle-a.min.js`), `DEFAULT_COBEK_KATEGORI`
  tetap utuh di `features-helpers-global-security.js` (tidak ikut
  terhapus/terduplikasi), `node --check` lolos di semua file source &
  kedua bundle, `index.html`/`app_production.html` tetap identik (cuma
  `?v=78`). **Belum**: tidak bisa dites tampilan sungguhan di browser
  (tidak ada environment browser di sini) — tetap wajib coba manual:
  buka halaman yang menampilkan teks user (nama transaksi/catatan,
  dst) & pastikan karakter spesial (`<`,`>`,`&`,`"`,`'`) tidak merusak
  tampilan/muncul sbg HTML mentah, dan buka grafik/laporan bulanan
  (Keuangan/Cobek) & pastikan label bulan (Jan/Feb/dst) tetap tampil
  benar.

  Sisa `features-helpers-global-security.js` (~340 baris): konstanta
  default (`DEFAULT_COBEK_KATEGORI`/`DEFAULT_ACCOUNTS`/
  `DEFAULT_SPAREPARTS` — sengaja TIDAK dipisah lagi, lihat alasan di
  atas), migrasi data (`SCHEMA_VERSION`/`runDataMigrations`/
  `migrateCobekCategory`), `APP_BUILD_VERSION`/
  `PRODUCTION_BUILD_SYNCED_VERSION` (tetap di sini krn `build.js`),
  deklarasi state `D` + variabel global lain, save/load (`save`/
  `load`/`_buildSaveJson`/`_writeLocalSnapshot`/`saveFlush`/
  `withSaveGuard`/dll), `uid`/`sameId`, event dispatcher global
  `data-action`/`data-onclick`, dan `showMain`/`clearChat`/`todayStr`.

  **Rekomendasi ke depan:** sisa file ini sekarang murni "jantung app"
  yang saling bergantung erat (deklarasi `D` yang dibaca-tulis oleh
  `save()`/`load()`, `migrateCobekCategory()` dipanggil dari dalam
  `load()`, event dispatcher yang jadi tulang punggung SEMUA tombol di
  app). Tidak disarankan dipecah lebih jauh tanpa environment browser
  utk dites — sesi2 sebelumnya sudah mengambil semua "buah yang mudah
  dipetik" (domain kecil, mandiri, aman dipindah). Kalau O tetap mau
  lanjut, disarankan test manual menyeluruh dulu di HP utk versi2
  build.js terakhir (v69-v78) sebelum lanjut membedah bagian inti ini,
  supaya kalau ada bug ketauan dari sesi mana asalnya.

- ✅ **Data Default dipisah jadi file domain sendiri `data-default.js`**
  (v79, build kw70-split-data-default): potongan KEDUA BELAS dari
  pembedahan `features-helpers-global-security.js`, sekaligus penyelesaian
  bagian yang SENGAJA ditunda di v78. Dipindah: `DEFAULT_COBEK_KATEGORI`,
  `DEFAULT_ACCOUNTS`, `DEFAULT_SPAREPARTS`.

  **Beda dari semua potongan sebelumnya:** file ini HARUS dimuat SEBELUM
  `features-helpers-global-security.js`, bukan sesudah — karena ketiga
  konstanta dibaca langsung di dalam deklarasi `let D = {...}` SAAT
  `features-helpers-global-security.js` di-load (bukan di dalam function
  body yang baru jalan belakangan saat runtime). Ini alasan v78 menunda
  bagian ini. Solusinya: `data-default.js` ditaruh di posisi PALING AWAL
  `GROUP_B` di `build.js` (sebelum `features-helpers-global-security.js`),
  jadi tetap satu bundle (`app-bundle-b.min.js`) & urutan gabung
  (`group.map(readFile).join('\n')`) otomatis benar.

  `build.js` (`GROUP_B`, `data-default.js` ditambah di posisi pertama) &
  komentar "urutan load" di ke-6 file `features-*.js` GROUP_B yang punya
  komentar itu diupdate supaya konsisten (`features-helpers-global-security.js`,
  `features-filter-scanstruk-ocr.js`, `features-gaji-cobek-tagihan.js`,
  `features-kategori-modal-tagihan-kalender.js`,
  `features-fi-checkoutscan-importexport-payroll.js`,
  `features-sheets-pwa-selftest.js`). Header
  `features-helpers-global-security.js` juga diupdate (deskripsi "kategori
  masak default" dihapus krn sudah pindah, ditambah catatan ke
  `data-default.js`). Dicek: `DEFAULT_COBEK_KATEGORI`/`DEFAULT_ACCOUNTS`/
  `DEFAULT_SPAREPARTS` cuma muncul 1x di source (di `data-default.js`) &
  1x di `app-bundle-b.min.js` (0x di `app-bundle-a.min.js`), `node --check`
  lolos di semua file source & kedua bundle, `index.html`/
  `app_production.html` tetap identik (cuma `?v=79`). **Belum**: tidak bisa
  dites tampilan sungguhan di browser (tidak ada environment browser di
  sini) — tetap wajib coba manual: buka app dari AWAL (data baru/reset,
  bukan yang sudah ada `localStorage`-nya) & pastikan kategori cobek bawaan,
  4 akun bawaan (Cash/BRI/Gopay/Seabank), dan kategori sparepart bawaan
  tetap muncul seperti biasa — ini yang paling berisiko kalau urutan load
  salah (app akan blank/error di konsol kalau `data-default.js` gagal
  dimuat sebelum `features-helpers-global-security.js`).

  Sisa `features-helpers-global-security.js` (~335 baris): migrasi data
  (`SCHEMA_VERSION`/`runDataMigrations`/`migrateCobekCategory`),
  `APP_BUILD_VERSION`/`PRODUCTION_BUILD_SYNCED_VERSION` (tetap di sini krn
  `build.js`), deklarasi state `D` + variabel global lain, save/load
  (`save`/`load`/`_buildSaveJson`/`_writeLocalSnapshot`/`saveFlush`/
  `withSaveGuard`/dll), `uid`/`sameId`, event dispatcher global
  `data-action`/`data-onclick`, dan `showMain`/`clearChat`/`todayStr`.

  **Rekomendasi ke depan:** dengan ini, SEMUA "buah yang mudah dipetik"
  (domain kecil, mandiri, aman dipindah tanpa browser) sudah habis
  dipetik — termasuk yang tadinya ditunda krn masalah urutan load. Sisa
  file ini sekarang murni "jantung app" (deklarasi `D`, save/load,
  migrasi, event dispatcher) yang saling bergantung sangat erat & TIDAK
  disarankan dipecah lebih jauh tanpa environment browser utk dites
  menyeluruh dulu. Kalau O tetap mau lanjut, sangat disarankan test
  manual menyeluruh dulu di HP utk versi2 build.js terakhir (v69-v79)
  sebelum membedah bagian inti ini, supaya kalau ada bug ketauan dari
  sesi mana asalnya.

- ✅ **Kategori & Tagihan/Kalender dipisah jadi 2 file domain sendiri**
  (v82, build kw70-split-kategori-tagihan): `features-kategori-modal-tagihan-kalender.js`
  (556 baris) ternyata berisi 3 domain tak berhubungan, jadi dipecah:
  - `kategori.js`: modal Kategori & Subkategori — `openCatModal`,
    `setCatModalType`, `refreshTxCatIfOpen`, `saveCat`, hapus kategori,
    `openSubCatModal`, `saveSubCat`, `delSubCat`, `toggleCatGroup`,
    `filterCat`.
  - `tagihan-kalender.js`: modul Tagihan/Bill (CRUD, riwayat, arsip,
    filter) & Kalender jatuh tempo — `setBillType` s/d `checkBills`
    (termasuk state lokal `curBillHistoryId`/`curBillHistoryEditTxId` &
    `billCalYear`/`billCalMonth`/`billCalSelectedDate`/`BILLCAL_MAX_ITER`
    yang ikut pindah bareng fungsi pemakainya).
  - Sisa 13 baris (`dashServisVehFilter`, `setDashServisVehFilter`,
    `goToServisFromDash` — filter kendaraan utk kartu Pengingat Servis di
    Dashboard) BUKAN domain Kategori/Tagihan, jadi digabung ke
    `features-tukang-kendaraan-storage.js` (domain kendaraan/servis yang
    sudah ada), ditaruh tepat setelah `loadMoreServisList` (fungsi Servis
    lain yang sudah ada di situ).

  Dicek dulu semua variabel state lokal (`curCatModalType`, `catEditIdx`,
  `catModalCallback`, `subCatEditId`/`subCatParentType`/`subCatParentId`,
  `curCatFilter`, `curBillType`/`billEditId`) — semua sudah dideklarasikan
  di `features-helpers-global-security.js` (bukan di file yang dipecah),
  jadi tetap aman diakses dari file manapun sbg variabel global. Dicek
  juga semua pemanggil dari file LAIN (`modals.js`, `modules-render.js`,
  `features-tukang-kendaraan-storage.js`, `features-gaji-cobek-tagihan.js`,
  `features-budget-laporan-carnotes-pelanggan.js`,
  `features-sheets-pwa-selftest.js`, `features-filter-scanstruk-ocr.js`,
  `piutang-utang.js`, `pajak-pbb-zakat.js`, `linktx.js`, `modules-calc.js`,
  `index.html`/`app_production.html`) — semua lewat variabel global saat
  runtime (klik tombol/`data-action`), bukan referensi lokal ke file,
  jadi aman dipecah ke 2+1 file.

  `features-kategori-modal-tagihan-kalender.js` DIHAPUS (tidak ada isi
  tersisa). `build.js` (`GROUP_B`, `kategori.js` & `tagihan-kalender.js`
  ditambah persis di posisi lama, sebelum
  `features-fi-checkoutscan-importexport-payroll.js`) & komentar "urutan
  load" di ke-7 file `GROUP_B` yang menyebut daftar urutan diupdate
  supaya konsisten. 1 komentar "PENTING" di `piutang-utang.js` yang
  menyebut lokasi lama `curBillHistoryId` juga diperbaiki (jadi
  `tagihan-kalender.js`).

  Dicek: tiap fungsi/variabel yang dipindah cuma muncul 1x di source (di
  file domain barunya masing-masing) & 1x di `app-bundle-b.min.js`
  (sesuai `GROUP_B`, 0x di `app-bundle-a.min.js`), `node --check` lolos
  di semua file source & kedua bundle, `index.html`/`app_production.html`
  tetap identik (cuma `?v=82`). **Belum**: tidak bisa dites tampilan
  sungguhan di browser (tidak ada environment browser di sini) — tetap
  wajib coba manual: Pengaturan → Kategori (tambah/edit/hapus kategori &
  subkategori, filter income/expense), Tagihan (tambah/edit/hapus
  tagihan & cicilan, tandai lunas, buka Riwayat Tagihan & edit satu
  entri, buka Kalender Tagihan & pilih tanggal, coba filter status/
  kategori/tahun), dan di Dashboard kartu Pengingat Servis (coba ganti
  filter kendaraan, pastikan tersimpan setelah reload & tombol "lihat
  semua" masih membawa ke Car Notes tab Servis).

- ✅ **Gaji Calculator, Form Transaksi & Profil Pengaturan dipisah jadi 3
  file domain sendiri** (v83, build kw70-split-gaji-transaksi-profil):
  `features-gaji-cobek-tagihan.js` (752 baris) namanya sudah salah kaprah
  sejak lama — modul Cobek (`Etalase`/`Produsen`) sudah pindah ke `cobek.js`
  di v43, jadi isi sebenarnya tinggal 3 domain tak berhubungan: kalkulator
  gaji, form Tambah/Edit Transaksi Keuangan, & profil pengguna di
  Pengaturan. Dipecah:
  - `gaji-calc.js`: `openGajiCalc`, `calcGaji`, `saveGajiAsIncome` —
    kalkulator gaji harian/borongan yg bisa langsung dicatat sbg
    pemasukan. Paling mandiri (cuma 3 fungsi, state `_gcLastTotal` sudah
    dideklarasikan di file lain).
  - `transaksi.js`: SISA & INTI file lama — `setTxType` s/d `saveLDR`
    (~600 baris): autocomplete kategori/produk/produsen/tagihan/stok/
    sparepart/SPBU/catatan, deteksi & panel kendaraan (BBM/sparepart/
    stok cobek) di form transaksi, target Dana Darurat, catatan anak,
    reminder, transfer antar akun, `saveTx`/`_saveTxInner` (mesin utama
    simpan transaksi — nge-branch ke semua domain di atas), `setKeuanganTab`,
    & quick-save Target/Catatan/Reminder/LDR. Ini domain TERBESAR &
    PALING SALING TERKAIT dari semua yang pernah dipisah sejauh ini
    (puluhan fungsi saling panggil dalam 1 alur form yang sama) — sengaja
    TIDAK dipecah lebih lanjut krn membelah alur `saveTx` berisiko tinggi
    tanpa bisa dites di browser.
  - `profil-pengaturan.js`: `autoSaveProfile` s/d `toggleApiKeyHint` —
    auto-save profil (nama/gaji/kiriman/tanggal lahir/API key), status
    PTKP (kawin/tanggungan/pekerjaan) utk estimasi PPh21, preview usia,
    hint API key AI. Mandiri, cuma dipanggil dari HTML `data-action`/
    `oninput` & `modules-render.js`.

  Dicek dulu semua fungsi/state yg dipakai lintas ke-3 potongan: `saveTx`
  di `transaksi.js` TIDAK memanggil apa pun dari `gaji-calc.js`/
  `profil-pengaturan.js`; `saveGajiAsIncome` (`gaji-calc.js`) memanggil
  `openTxModal`/`updateSubCatOptions` (`transaksi.js`) lewat variabel
  global saat runtime — aman krn sama-sama GROUP_B. Semua pemanggil dari
  file LAIN (`modals.js`, `modules-render.js`, `features-sheets-pwa-selftest.js`,
  `cobek.js` — via `data-action`/HTML) sudah dicek lewat `grep -rl`, semua
  lewat variabel global saat runtime.

  `features-gaji-cobek-tagihan.js` DIHAPUS (tidak ada isi tersisa).
  `build.js` (`GROUP_B`, `gaji-calc.js`/`transaksi.js`/`profil-pengaturan.js`
  ditambah persis di posisi lama, sebelum `kategori.js`) & komentar "urutan
  load" di ke-8 file `GROUP_B` yang menyebut daftar urutan diupdate supaya
  konsisten. 3 komentar lain yg menyebut nama file lama (`cobek.js`,
  `kalkulator-input.js`, `sewakios.js`) juga diperbaiki jadi menyebut
  `transaksi.js`.

  Dicek: tiap fungsi yang dipindah cuma muncul 1x di source (di file
  domain barunya masing-masing) & 1x di `app-bundle-b.min.js` (sesuai
  `GROUP_B`, 0x di `app-bundle-a.min.js`), `node --check` lolos di semua
  file source & kedua bundle, `index.html`/`app_production.html` tetap
  identik (cuma `?v=83`). **Belum**: tidak bisa dites tampilan sungguhan
  di browser (tidak ada environment browser di sini) — tetap wajib coba
  manual MENYELURUH krn `transaksi.js` adalah mesin utama halaman
  Keuangan: buka kalkulator gaji dari Tukang/Absensi & catat sbg
  pemasukan, tambah transaksi biasa (income/expense) dgn autocomplete
  kategori & produk, tambah transaksi BBM/servis/sparepart kendaraan dari
  form transaksi, isi Target Dana Darurat, Catatan Anak, Reminder,
  Transfer antar akun, dan di Pengaturan → Profil coba ganti nama/gaji/
  kiriman/tanggal lahir/status kawin/tanggungan/status pekerjaan/API key
  (pastikan tersimpan & preview PTKP/usia ikut berubah).

- ✅ **Akun (Cash/Bank/Ewallet) dipisah jadi file domain sendiri `akun.js`**
  (v84, build kw70-split-akun): langkah pertama membedah
  `features-filter-scanstruk-ocr.js` (1223 baris, campuran ~5 domain tak
  berhubungan — lookup kategori, filter/laporan/navigasi list, Akun, form
  edit transaksi + cicilan, dan scan struk OCR). Dipindah: `recalcAccBalance`,
  `populateAccFilters`, `linkedAssetAccountIds`, `isAccLinkedToAsset`,
  `totalSaldoAkun`, `quickToggleInclude`, `editAccIdx`/`accIncludeState`
  (state modal), `openAccModal`, `toggleAccInclude`, `updateAccIncludeBtn`,
  `saveAcc`/`_saveAccInner`, `delAcc` — total 12 deklarasi top-level, semua
  domain "Kelola Akun".

  Dipilih sbg potongan pertama karena paling mandiri & kontigu (baris
  258–365 lurus, tidak diselang domain lain): dicek dulu semua fungsi di
  blok ini TIDAK referensi kategori/filter/cicilan/OCR yang ada di file
  yang sama — cuma bergantung ke `D.accounts`/`D.assets`/`D.transactions`
  (state global), `save()`/`toast()`/`escapeHtml()`/`openModal()`/
  `closeModal()`/`askConfirm()`/`withSaveGuard()` (semua tetap file lain,
  diakses lewat variabel global saat runtime — pola yang sama seperti
  migrasi2 sebelumnya), dan `renderAccGrid()`/`renderDashAccList()`/
  `renderLapAccList()`/`renderDashboard()`/`renderKeuangan()`/
  `refreshBillEverywhere()`/`renderCnTab()`/`populateKeuFilters()` (fungsi
  render/filter lain, semua dipanggil sbg variabel global saat runtime,
  bukan referensi lokal ke file). `populateAccFilters()` masih memanggil
  `populateKeuFilters()` (tetap di `features-filter-scanstruk-ocr.js`) di
  baris terakhirnya — aman krn keduanya tetap di GROUP_B yang sama.

  Dicek juga semua pemanggil dari file LAIN (`modals.js` — dipanggil lewat
  `data-action` di modal Akun/Transaksi/Aset/Target/dll, `modules-render.js`,
  `index.html`/`app_production.html`) — semua lewat variabel global saat
  runtime, aman dipindah ke file sendiri.

  `build.js` (`GROUP_B`, `akun.js` ditambah tepat setelah
  `features-filter-scanstruk-ocr.js`, sebelum `gaji-calc.js`) & komentar
  "urutan load" di ke-11 file `GROUP_B` yang menyebut daftar urutan
  diupdate supaya konsisten. Dicek: ke-12 deklarasi (termasuk
  `editAccIdx`/`accIncludeState`, bukan cuma nama fungsi) cuma muncul 1x di
  source (di `akun.js`) & 1x di `app-bundle-b.min.js` (sesuai `GROUP_B`,
  0x di `app-bundle-a.min.js`), `node --check` lolos di semua file source &
  kedua bundle, `index.html`/`app_production.html` tetap identik (cuma
  `?v=84`). **Belum**: tidak bisa dites tampilan sungguhan di browser
  (tidak ada environment browser di sini) — tetap wajib coba manual: buka
  Pengaturan → Kelola Akun (tambah/edit akun baru, ganti nama/emoji/saldo,
  toggle "Hitung di Total Saldo", hapus akun & pastikan transaksi/tagihan
  terkait pindah ke akun fallback), cek dropdown akun di form Tambah
  Transaksi/Transfer/Target/Aset semua masih terisi benar, dan cek kartu
  Saldo Akun di Dashboard/Laporan masih menjumlahkan dengan benar
  (termasuk akun yang ditautkan ke Buku Aset ikut terkecuali otomatis).

  Sisa `features-filter-scanstruk-ocr.js` (~1115 baris) masih campuran 4
  domain lain: lookup kategori (`getAllCats`/`getCat`/`populateCatSelect`/
  dll), filter/laporan/navigasi list (`txMatchesFilters`/`getKeuFilters`/
  `goToList`/`showFilteredTx`/dll), form edit transaksi + cicilan
  (`setPayMethod`/`syncCicilanPreview`/`openTxModal`/`editTx`/dll — erat
  kaitan dgn `transaksi.js`, kandidat digabung ke sana), dan scan struk OCR
  (`getOcrWorker`/`scanReceipt`/`scanAssetPortfolio`/`scanReceiptBelanja`/
  dll, kandidat jadi file `scan-ocr.js` sendiri) — lanjutkan satu potongan
  lagi per sesi berikutnya, ikuti pola yang sama.

- ✅ **Lookup Kategori digabung ke domain Kategori (`kategori.js`)** (v85,
  build kw70-split-kategori-lookup): potongan KEDUA dari pembedahan
  `features-filter-scanstruk-ocr.js` (lanjutan `akun.js` v84). Dipindah:
  `getAllCats`, `getCatsByType`, `getCat`, `getCatByType`, `uniqueCatList`,
  `subNamesForCat`, `populateCatSelect`, `populateSubSelect` — 8 fungsi
  lookup/query kategori (bukan CRUD modal, tapi "baca" data kategori buat
  dropdown filter/form di seluruh app), digabung ke `kategori.js` yang
  sudah ada (modal Kategori & Subkategori dari v82) karena memang domain
  yang sama, cuma dulu kepisah gara-gara ikut nomor batch lama.

  Blok ini kontigu & paling mandiri di file lama (baris 4–43, sebelum
  `txMatchesFilters` dkk): cuma bergantung ke `D.categories` (state
  global) & `document.getElementById`/`escapeHtml` (tetap di file lain,
  diakses lewat variabel global) — TIDAK direferensi modul
  filter/laporan/cicilan/OCR yang tertinggal di file lama. Ditaruh di
  paling atas `kategori.js` (sebelum `openCatModal` dkk) karena
  `saveCat`/`saveSubCat`/`delSubCat` di file yang sama sudah lebih dulu
  memanggil `populateSubSelect()` — sekarang keduanya di file yang sama,
  malah lebih rapi (tidak perlu lagi lintas file utk pasangan
  read/write kategori ini).

  Dicek juga semua pemanggil dari file LAIN (`transaksi.js` –
  `onTxCatInput`/`selectTxCat`/dll, `modules-render.js`,
  `features-fi-checkoutscan-importexport-payroll.js`,
  `features-tukang-kendaraan-storage.js`, `tagihan-kalender.js`, dst) —
  semua lewat variabel global saat runtime, aman digabung ke file lain.

  `build.js` TIDAK berubah (`kategori.js` sudah ada di `GROUP_B`, cuma
  isinya nambah — beda dari kasus file baru yang perlu didaftarkan).
  Dicek: ke-8 fungsi cuma muncul 1x di source (di `kategori.js`) & 1x di
  `app-bundle-b.min.js` (0x di `app-bundle-a.min.js`), `node --check`
  lolos di semua file source & kedua bundle, `index.html`/
  `app_production.html` tetap identik (cuma `?v=85`). **Belum**: tidak
  bisa dites tampilan sungguhan di browser (tidak ada environment browser
  di sini) — tetap wajib coba manual: buka dropdown filter Kategori di
  Laporan/Keuangan (pastikan daftar kategori+emoji masih muncul benar &
  subkategori ikut ter-filter sesuai kategori terpilih), buka form Tambah
  Transaksi & ketik di kolom Kategori/Subkategori (autocomplete masih
  jalan), dan buka Pengaturan → Kategori (tambah/edit/hapus kategori &
  subkategori masih normal, termasuk toast konfirmasi rename).

  Sisa `features-filter-scanstruk-ocr.js` (~1075 baris) masih campuran 3
  domain lain: filter/laporan/navigasi list (`txMatchesFilters`/
  `getKeuFilters`/`goToList`/`showFilteredTx`/dll), form edit transaksi +
  cicilan (`setPayMethod`/`syncCicilanPreview`/`openTxModal`/`editTx`/dll
  — kandidat digabung ke `transaksi.js`), dan scan struk OCR
  (`getOcrWorker`/`scanReceipt`/`scanAssetPortfolio`/
  `scanReceiptBelanja`/dll — kandidat jadi file `scan-ocr.js` sendiri) —
  lanjutkan satu potongan lagi per sesi berikutnya, ikuti pola yang sama.

- ✅ **Filter/Laporan/Navigasi dipisah jadi file domain sendiri
  `filter-laporan.js`** (v86, build kw70-split-filter-laporan): potongan
  KETIGA dari pembedahan `features-filter-scanstruk-ocr.js` (lanjutan
  `akun.js` v84, lookup kategori→`kategori.js` v85). Dipilih duluan dari
  sisa 3 domain (filter/laporan/navigasi, form transaksi+cicilan, scan
  OCR) karena PALING KECIL (214 baris vs ~310 & ~545 baris sisanya).
  Dipindah: `txMatchesFilters`, `populateCatFilter`, `onFKatChange`,
  `resetLaporanFilter`, `getLaporanFilters`, `populateKeuFilters`,
  `onKfKatChange`, `toggleKeuFilter`, `resetKeuFilter`, `getKeuFilters`,
  `txMatchesSearch`, `txListPage`, `TX_PAGE_SIZE`, `lapTxPage`,
  `loadMoreLapTx`, `resetTxPageAndRender`, `onKfSearchInput`,
  `loadMoreTx`, `saveKeuFilterPrefs`, `_keuFilterPrefsLoaded`,
  `loadKeuFilterPrefsIntoDOM`, `updateKfBadge`, `goToList`,
  `showFilteredTx` — 24 deklarasi top-level, semua domain "filter panel
  Keuangan/Laporan + paginasi list + navigasi antar-list", tidak ada
  domain existing yang cocok jadi dapat file baru sendiri (sama seperti
  `sewakios.js`/`linktx.js`/dll).

  Blok ini kontigu di file lama (baris 4–217, persis di awal file,
  sebelum `setPayMethod` yg mulai domain form transaksi+cicilan). Dicek
  dulu semua identifier di dalam blok pakai penelusuran depth-brace
  (bukan cuma grep `^function`, krn gaya file ini tanpa indentasi jadi
  banyak `const`/`let` di dalam function body ikut ke kolom 0) — hasil:
  24 deklarasi top-level di atas, tidak referensi
  `setPayMethod`/`editTx`/`scanReceipt`/dll (3 domain lain yg masih
  tertinggal) sama sekali. Dependensi keluarnya cuma fungsi/variabel
  global yg tetap di file lain (`escapeHtml`, `fmt`, `getRange`/`txHTML`
  di `features-fi-checkoutscan-importexport-payroll.js`,
  `populateCatSelect`/`populateSubSelect` di `kategori.js`, `openModal`,
  `renderKeuangan`/`renderLaporan`, `safeSetItem`, `setCnTab`/
  `setCobekTab`, `showPage`, `toast`) — semua diakses saat runtime,
  bukan saat file di-load.

  Dicek juga semua pemanggil dari file LAIN (`txMatchesFilters`/
  `getLaporanFilters`/`populateKeuFilters`/`getKeuFilters`/
  `txMatchesSearch`/`txListPage`/`TX_PAGE_SIZE`/`lapTxPage`/
  `loadMoreLapTx`/`loadKeuFilterPrefsIntoDOM`/`updateKfBadge` dipanggil
  dari `modules-render.js`, `features-fi-checkoutscan-importexport-payroll.js`,
  `features-aiwidget-reminder-gdrive-search.js`,
  `features-budget-laporan-carnotes-pelanggan.js`, `kategori.js`,
  `akun.js`, `transaksi.js`; `onFKatChange`/`resetLaporanFilter`/
  `onKfKatChange`/`toggleKeuFilter`/`resetKeuFilter`/`resetTxPageAndRender`/
  `onKfSearchInput`/`loadMoreTx` dari `index.html`/`app_production.html`
  lewat `data-action`/`onclick`/`oninput`; `goToList` dari
  `features-tukang-kendaraan-storage.js` & `tagihan-kalender.js`;
  `showFilteredTx` dari `features-sheets-pwa-selftest.js`) — semua lewat
  variabel global saat runtime, aman dipindah ke file sendiri.

  `build.js` (`GROUP_B`, `filter-laporan.js` ditambah tepat setelah
  `features-filter-scanstruk-ocr.js`, sebelum `akun.js`) & komentar
  "urutan load" di ke-6 file `GROUP_B` yang menyebut daftar urutan
  (`akun.js`, `gaji-calc.js`, `kategori.js`, `tagihan-kalender.js`,
  `features-fi-checkoutscan-importexport-payroll.js`,
  `features-sheets-pwa-selftest.js`) diupdate supaya konsisten.

  Dicek: ke-24 identifier (fungsi + variabel state seperti `txListPage`/
  `TX_PAGE_SIZE`/`lapTxPage`/`_keuFilterPrefsLoaded`, bukan cuma nama
  fungsi) cuma muncul 1x di source (di `filter-laporan.js`) & 1x di
  `app-bundle-b.min.js` (sesuai `GROUP_B`, 0x di `app-bundle-a.min.js`),
  `node --check` lolos di semua file source & kedua bundle,
  `index.html`/`app_production.html` tetap identik (cuma `?v=86`).
  **Belum**: tidak bisa dites tampilan sungguhan di browser (tidak ada
  environment browser di sini) — tetap wajib coba manual: di halaman
  Keuangan, buka panel filter (tombol filter di atas list transaksi),
  coba ganti tipe/kategori/subkategori/akun/metode bayar & cek badge
  jumlah filter aktif, coba kotak pencarian transaksi, scroll list
  transaksi sampai "Tampilkan lebih banyak" muncul & berfungsi; di
  halaman Laporan, coba filter kategori laporan & cek badge; dan coba
  tap kartu ringkasan di Dashboard yang membuka modal "Transaksi
  Terfilter" (mis. tap total pemasukan/pengeluaran bulan ini) — pastikan
  modal muncul dgn list & total yang benar, dan tombol "lihat semua"
  navigasi ke halaman/tab yang tepat.

  Sisa `features-filter-scanstruk-ocr.js` (~861 baris) masih campuran 2
  domain lain: form edit transaksi + cicilan (`setPayMethod`/
  `syncCicilanPreview`/`openTxModal`/`editTx`/dll — kandidat digabung ke
  `transaksi.js`), dan scan struk OCR (`getOcrWorker`/`scanReceipt`/
  `scanAssetPortfolio`/`scanReceiptBelanja`/dll — kandidat jadi file
  `scan-ocr.js` sendiri) — lanjutkan satu potongan lagi per sesi
  berikutnya, ikuti pola yang sama.

- ✅ **Form Edit Transaksi + Cicilan digabung ke domain Transaksi
  (`transaksi.js`)** (v87, build kw70-split-transaksi-cicilan): potongan
  KEEMPAT dari pembedahan `features-filter-scanstruk-ocr.js` (lanjutan
  `akun.js` v84, lookup kategori→`kategori.js` v85, filter/laporan→
  `filter-laporan.js` v86). Dipilih duluan dari sisa 2 domain (form
  transaksi+cicilan, scan OCR) karena lebih kecil (~308 baris vs ~546
  baris OCR). Dipindah 13 fungsi: `setPayMethod`, `validateCicilanFields`,
  `calcCicilanPerBulanFromTotal`, `calcCicilanTotalFromPerBulan`,
  `syncCicilanPreview`, `getCicilanSharedMine`, `toggleCicilanSharedFields`,
  `syncCicilanDate`, `openTxModal`, `resetPayMethodLock`, `editTx`,
  `openCicilanHistoryFromTx`, `deleteTxFromModal` — digabung ke
  `transaksi.js` (bukan file baru) karena memang satu domain yang sama
  dgn isi `transaksi.js` yang sudah ada (form Tambah/Edit Transaksi,
  `saveTx`/`_saveTxInner`) — cuma kepisah gara-gara ikut nomor batch
  lama. Ditaruh tepat SEBELUM `async function saveTx(){`, karena
  `_saveTxInner` memanggil `validateCicilanFields()` — sekarang keduanya
  di file yang sama (sebelumnya lintas file).

  Blok ini kontigu & langsung di awal file lama (baris 4–311). Dicek
  semua state variabel yang dipakai (`curPayMethod`, `txEditId`,
  `catModalCallback`, `txEditLinkedBillId`, `_txSaving`) — semua sudah
  dideklarasikan di `features-helpers-global-security.js` (bukan di
  blok yang dipindah), jadi tetap aman diakses sbg variabel global dari
  file manapun. Dependensi keluar lain (`D.*`, `save()`, `toast()`,
  `openModal()`/`closeModal()`, `getAllCats()`/`populateCatSelect()`
  di `kategori.js`, `openBillHistory()`, `delTx()`, dll) semua diakses
  saat runtime, bukan saat file di-load.

  **Ditemukan 4 deklarasi "nyasar"** yang bukan bagian domain manapun
  di antara blok transaksi+cicilan & blok OCR (baris 312–315 file lama,
  bukan kontigu dgn keduanya) — dipisah & ditaruh ke domain yang benar
  sesuai fungsinya (bukan ikut `transaksi.js`/`scan-ocr.js`):
  - `_gcLastTotal` (state total kalkulator gaji) → `gaji-calc.js`,
    karena cuma dibaca/ditulis di file itu (`calcGaji()`/
    `saveGajiAsIncome()`) — sebelumnya dideklarasikan di file lain dari
    yang memakainya, sekarang co-located.
  - `openAbsensiModal`/`changeAbsensiWeek` (wrapper tipis yg cuma
    delegasi ke `Payroll.openAbsensiModal()`/`Payroll.changeAbsensiWeek()`)
    → `gaji-calc.js` juga, karena domain Absensi/Gaji terkait erat
    (tombol "📅 Buka Absensi" ada di `gajiCalcModal` yang sudah di
    `gaji-calc.js`) & tidak ada domain lain yang lebih cocok.
  - `dateToISO` (formatter tanggal `YYYY-MM-DD`) → `helper-teks.js`,
    gabung bareng `escapeHtml`/`MONTHS`/`MONTHS_FULL` yang sudah ada di
    situ — sama-sama utilitas teks/tanggal murni tanpa dependensi,
    dipakai 12+ file lain (`features-tukang-kendaraan-storage.js`,
    `features-fi-checkoutscan-importexport-payroll.js`,
    `reset-gaji-mingguan.js`, `hidup-seimbang.js`,
    `features-sheets-pwa-selftest.js`, dst).

  `build.js` TIDAK berubah (`transaksi.js`/`gaji-calc.js`/
  `helper-teks.js` semua sudah ada di `GROUP_B`, cuma isinya nambah —
  tidak ada file baru yang perlu didaftarkan, beda dari kasus
  `filter-laporan.js` di v86).

  Dicek: ke-13 fungsi blok utama + `_gcLastTotal`/`openAbsensiModal`/
  `changeAbsensiWeek`/`dateToISO` masing2 cuma muncul 1x di source (di
  file domain barunya masing2) & 1x di `app-bundle-b.min.js` (0x di
  `app-bundle-a.min.js`), `node --check` lolos di semua file source &
  kedua bundle, `index.html`/`app_production.html` tetap identik (cuma
  `?v=87`). **Belum**: tidak bisa dites tampilan sungguhan di browser
  (tidak ada environment browser di sini) — tetap wajib coba manual
  MENYELURUH krn ini form Tambah/Edit Transaksi (dipakai tiap hari):
  buka form Tambah Transaksi & Edit Transaksi (tap transaksi yang
  sudah ada), coba ganti Cara Bayar Tunai/Cicilan/Rutin & pastikan
  panel cicilan/preview cicilan per bulan masih sinkron saat isi Total
  Harga ATAU Cicilan/Bulan, coba toggle "Ditanggung Bersama" & cek
  porsi otomatis, edit transaksi yang tertaut cicilan/tagihan/BBM/stok
  sparepart/stok Shop (pastikan field-nya keisi otomatis saat dibuka),
  coba tombol "🗑 Hapus Transaksi" di modal edit, dan di kartu Absensi
  Dashboard/Tukang coba tombol "📅 Buka Absensi" & panah minggu
  sebelumnya/berikutnya di modal Absensi (pastikan masih ganti minggu
  dgn benar).

  Sisa `features-filter-scanstruk-ocr.js` (~546 baris) sekarang MURNI 1
  domain: scan struk OCR (`getOcrWorker`/`scanReceipt`/
  `scanBuktiTransfer`/`scanTanggalDariFoto`/`scanKmOdometer`/
  `scanAssetPortfolio`/`quickScanAsset`/`scanReceiptBelanja`/dll) —
  kandidat jadi file `scan-ocr.js` sendiri di sesi berikutnya (langkah
  terakhir dari pembedahan file ini).

- ✅ **File OCR di-rename jadi `scan-ocr.js`** (v88, build
  kw70-split-scan-ocr-rename): langkah TERAKHIR dari pembedahan
  `features-filter-scanstruk-ocr.js` (lanjutan `akun.js` v84, lookup
  kategori→`kategori.js` v85, filter/laporan→`filter-laporan.js` v86,
  form transaksi+cicilan→`transaksi.js` v87). Setelah 4 potongan
  sebelumnya, sisa file lama (~546 baris) sudah murni 1 domain: scan
  struk OCR (`getOcrWorker`, `resetOcrWorker`, `withTimeout`,
  `scanErrorMessage`, `downscaleImage`, `ocrRecognize`,
  `extractDateFromText`, `scanReceipt`, `guessTransferNameFromText`,
  `scanBuktiTransfer`, `scanTanggalDariFoto`, `scanKmOdometer`,
  `extractOdometerKm`, `extractLabeledAmount`, `extractPortfolioFields`,
  `extractBitgetFields`, `guessAssetJenisFromText`,
  `guessCryptoSymbolFromText`, `guessAssetNameFromText`,
  `scanAssetPortfolio`, `pickAssetScanCandidate`, `quickScanAsset`,
  `showQuickScanPicker`, `applyQuickScan`, `scanReceiptBelanja`,
  `guessCategoryFromReceiptText`, `catLearnKey`, `learnCatFromItemName`,
  `rememberLastAccForCat`, `findPossibleDuplicateTx`,
  `guessSparepartFromReceiptText`, plus konstanta pendukung
  `_bulanIndoMap`/`ASSET_JENIS_KEYWORDS`/`ASSET_NAME_LABEL_RE`/
  `ASSET_NAME_EXCLUDE_RE`/`STATUS_BAR_LINE_RE`/`SPAREPART_LINE_KEYWORDS`)
  — jadi tidak ada lagi kode yang perlu DIPINDAHKAN, cukup RENAME file +
  update semua referensi nama file.

  4 fungsi kecil (`learnCatFromItemName`/`rememberLastAccForCat`/
  `findPossibleDuplicateTx`/`catLearnKey`) dipanggil dari `transaksi.js`
  (alur `saveTx`) bukan cuma dari dalam file ini sendiri — tapi tetap 1
  domain yang sama (deteksi duplikat & "belajar" kategori/akun dari hasil
  scan struk, `_txCatLearnSource` diisi `scanReceiptBelanja`), dan semua
  akses lintas file sudah lewat variabel global saat runtime (pola yang
  sama seperti semua migrasi sebelumnya), jadi tidak masalah dipanggil
  dari `transaksi.js`.

  `features-filter-scanstruk-ocr.js` DIHAPUS, isinya disalin apa adanya
  ke file BARU `scan-ocr.js` (tidak ada kode yang diubah, cuma nama file
  + komentar header). `build.js` (`GROUP_B`, `scan-ocr.js` menggantikan
  `features-filter-scanstruk-ocr.js` persis di posisi yang sama) &
  komentar "urutan load" di ke-12 file `GROUP_B` yang menyebut daftar
  urutan diupdate supaya konsisten. 1 komentar "PENTING" basi di
  `reset-gaji-mingguan.js` (peninggalan v72) yang masih menyebut lokasi
  lama `populateAccFilters()`/`dateToISO()` sbg `features-filter-scanstruk-ocr.js`
  juga diperbaiki — kedua fungsi itu sebenarnya sudah pindah lebih dulu
  ke `akun.js` (v84) & `helper-teks.js` (v87), cuma komentarnya belum
  ikut diupdate saat itu.

  Dicek: ke-31 identifier utama (fungsi + konstanta data) cuma muncul 1x
  di source (di `scan-ocr.js`) & 1x di `app-bundle-b.min.js` (sesuai
  `GROUP_B`, 0x di `app-bundle-a.min.js`), `node --check` lolos di semua
  file source & kedua bundle, `index.html`/`app_production.html` tetap
  identik (cuma `?v=88`). Dengan ini, pembedahan
  `features-filter-scanstruk-ocr.js` (dulu `modules-features-6.js`) yang
  dimulai dari v84 (Akun) SELESAI — filenya sudah tidak ada lagi, semua
  isinya sudah tersebar rapi ke `akun.js`, `kategori.js`,
  `filter-laporan.js`, `transaksi.js`, dan `scan-ocr.js`. **Belum**:
  tidak bisa dites tampilan sungguhan di browser (tidak ada environment
  browser di sini) — tapi risiko rendah krn ini murni rename file (isi
  kode identik byte-per-byte selain komentar header), tetap disarankan
  coba manual sekali: scan struk belanja dari form Tambah Transaksi,
  scan bukti transfer, scan tanggal dari foto (Servis Kendaraan), scan
  odometer, scan portofolio aset (termasuk format Bitget), dan quick-scan
  update nilai aset dari Buku Aset — pastikan semua masih jalan seperti
  biasa.

- ✅ **Deteksi checkout dari screenshot digabung ke `scan-ocr.js`** (v89, build
  kw70-split-checkout-scan-merge): langkah pertama bedah file besar berikutnya —
  `features-fi-checkoutscan-importexport-payroll.js` (1406 baris, campuran 5 domain tak
  berhubungan: FI wrapper, deteksi checkout dari screenshot, list transaksi & cashflow
  forecast, Budget wrapper, export/import/backup, Payroll/Absensi). Dipilih domain
  "deteksi checkout dari screenshot" (`guessCheckoutItemName`, `guessCheckoutPrices`,
  `guessWorthItCategory`, `guessCheckoutTotalTagihan`, `guessCheckoutCicilan`,
  `scanWorthItCheckout`, plus 8 konstanta regex pendukung) karena domainnya sebenarnya
  OCR juga (dipakai tombol "📷 Scan Screenshot Checkout" di modal Worth-It), cuma dulu
  kepisah gara-gara ikut nomor batch lama — digabung ke `scan-ocr.js` yang sudah ada,
  bukan bikin file baru.

  Blok ini kontigu di file lama (baris 25-181, langsung setelah FI wrapper). Dicek dulu
  semua dependensinya: `ocrRecognize()`/`scanErrorMessage()` (sudah di `scan-ocr.js`
  sendiri sejak v88), `toast()`/`fmt()` (format-tema.js), `WorthIt.*` (worthit.js) — semua
  diakses lewat variabel global saat runtime (tombol scan diklik), aman digabung.
  `scanWorthItCheckout` dipanggil dari `data-action="scanWorthItCheckout"` di 2 tempat
  modal Worth-It (mode single & list) di `modals.js`.

  `build.js` TIDAK berubah (`scan-ocr.js` sudah terdaftar di `GROUP_B` sejak v88, cuma
  isinya nambah). Header `features-fi-checkoutscan-importexport-payroll.js` diupdate
  (menyebut domain yang tersisa: FI wrapper, list transaksi & cashflow forecast, Budget
  wrapper, export/import/backup, Payroll).

  Dicek: ke-6 fungsi utama + 8 konstanta regex cuma muncul 1x di source (di `scan-ocr.js`)
  & 1x di `app-bundle-b.min.js` (0x di `app-bundle-a.min.js`), `node --check` lolos di
  semua 44 file source & kedua bundle, `index.html`/`app_production.html` tetap identik
  (cuma `?v=89`). **Belum**: tidak bisa dites tampilan sungguhan di browser — tetap wajib
  coba manual: buka modal Worth-It (baik tab "Cek 1 Barang" maupun "Prioritas Belanja"),
  tap "📷 Scan Screenshot Checkout", pastikan nama barang/harga/kategori/cicilan (kalau
  ada) masih terisi otomatis dari screenshot checkout Tokopedia/Shopee/dll.

  Sisa `features-fi-checkoutscan-importexport-payroll.js` (~1250 baris) masih campuran 4
  domain: FI wrapper (24 baris, kandidat digabung ke `modules-calc.js` tempat `FI`
  didefinisikan), list transaksi & cashflow forecast (`txHTML`/`delTx`/
  `computeCashflowForecast`/dll, kandidat ke `transaksi.js`), Budget wrapper +
  export/import/backup (`exportCSV`/`runBackup`/`importCarData`/dll, kandidat file baru
  `backup-restore.js`), dan Payroll/Absensi (`const Payroll={...}`, modul cukup besar &
  sudah rapi sbg objek, kandidat file baru `payroll-absensi.js` — domain ini paling besar
  di sisa file, ~360 baris) — lanjutkan satu potongan lagi per sesi berikutnya.

- ✅ **FI (Kebebasan Finansial) wrapper digabung ke `modules-calc.js`** (v90, build
  kw70-split-fi-wrapper-merge): lanjutan bedah `features-fi-checkoutscan-importexport-payroll.js`
  (setelah checkout-scan→`scan-ocr.js` di v89), dipilih domain PALING KECIL & PALING
  MANDIRI dari sisa 4 (FI wrapper, list transaksi & cashflow forecast, Budget wrapper +
  export/import/backup, Payroll/Absensi) — cuma 18 fungsi delegasi 1-baris ke objek `FI`
  (`fiInvestmentAssetValue`, `fiAssetFund`, `fiTotalDebt`, `fiNetAssetFund`,
  `fiGetAssumptions`, `fiMonthsOfDataAvailable`, `fiEffectiveMonths`, `fiAnnualExpense`,
  `fiTargetNominal`, `fiMonthlySurplus`, `fiEstimateMonthsToTarget`, `fiFormatMonths`,
  `fiCalcAge`, `selectFiAssetScope`, `openFiSettingsModal`, `onFiCatTotalToggle`,
  `getSelectedFiCatIds`, `saveFiSettings`), tidak ada logika sendiri sama sekali, tinggal
  `return FI.xxx()`.

  Digabung ke `modules-calc.js` (bukan file baru) — persis di sebelah objek `const FI={...}`
  yang dibungkusnya, karena memang wrapper generik ini "milik" `FI`, cuma dulu ditulis
  terpisah karena ikut nomor batch lama. **Beda dari migrasi2 sebelumnya**: ini pertama
  kalinya kode pindah dari `GROUP_B` ke `GROUP_A` (bukan dalam grup yang sama) — dicek dulu
  tidak ada kode top-level di GROUP_B manapun yang memanggil `fiXxx()` saat file dimuat
  (bukan runtime), aman krn semua pemanggil (`data-action`/`oninput` di HTML, dan
  `modules-render.js` render dashboard/FI) mengakses lewat variabel global saat runtime
  (render halaman/klik tombol), setelah kedua bundle (GROUP_A lalu GROUP_B) sama-sama
  sudah dimuat.

  `build.js` TIDAK berubah (tidak ada file baru; `modules-calc.js` sudah ada di `GROUP_A`).
  Header `features-fi-checkoutscan-importexport-payroll.js` diupdate (domain FI dihapus
  dari daftar).

  Dicek: ke-18 fungsi cuma muncul 1x di source (di `modules-calc.js`) & 1x di
  `app-bundle-a.min.js` (pindah dari `app-bundle-b.min.js` ke `app-bundle-a.min.js`, sesuai
  perpindahan GROUP_B→GROUP_A), `node --check` lolos di semua 44 file source & kedua
  bundle, `index.html`/`app_production.html` tetap identik (cuma `?v=90`). **Belum**: tidak
  bisa dites tampilan sungguhan di browser — tetap wajib coba manual: buka kartu Kebebasan
  Finansial di Dashboard (pastikan skenario Konservatif/Moderat/Optimis & estimasi tahun
  tercapai masih muncul), dan buka Pengaturan Asumsi FI (🎯), ganti cakupan aset/kategori/
  asumsi return-inflasi-SWR, simpan — pastikan tersimpan & dashboard ikut update.

  Sisa `features-fi-checkoutscan-importexport-payroll.js` (~1230 baris) masih campuran 3
  domain: list transaksi & cashflow forecast (`txHTML`/`delTx`/`computeCashflowForecast`/dll,
  kandidat ke `transaksi.js`), Budget wrapper + export/import/backup (`exportCSV`/
  `runBackup`/`importCarData`/dll, kandidat file baru `backup-restore.js`), dan
  Payroll/Absensi (`const Payroll={...}`, ~360 baris, kandidat file baru
  `payroll-absensi.js`) — lanjutkan satu potongan lagi per sesi berikutnya.

- ✅ **Budget wrapper digabung ke `features-budget-laporan-carnotes-pelanggan.js`**
  (v91, build kw70-split-budget-wrapper-merge): lanjutan bedah
  `features-fi-checkoutscan-importexport-payroll.js` (setelah checkout-scan→`scan-ocr.js`
  v89, FI wrapper→`modules-calc.js` v90) — pola yang persis sama, dipilih domain terkecil
  berikutnya: 18 fungsi delegasi 1-baris ke objek `Budget` (`getBudgetSettings`,
  `saveBudgetSettings`, `getCatNameById`, `getCatInfoById`, `budgetMatchesTx`,
  `getBudgetUsed`, `getBudgetEffectiveLimit`, `cleanCatOptText`, `onBudgetCatTotalToggle`,
  `onBudgetCatChildToggle`, `getSelectedBudgetCatIds`, `autoBudgetName`,
  `selectBudgetIcon`, `selectBudgetPeriod`, `openBudgetModal`, `saveBudget`,
  `deleteBudget`, `openBudgetSettings`, `showAllBudgetDrillDown`, `showBudgetDrillDown`),
  tanpa logika sendiri, tinggal `return Budget.xxx()`.

  Digabung ke `features-budget-laporan-carnotes-pelanggan.js` (bukan file baru) — persis
  di sebelah objek `const Budget={...}` yang dibungkusnya (dicari batas objeknya lewat
  penelusuran depth-brace krn file bergaya tanpa indentasi). Sama seperti migrasi FI di
  v90, ini juga pindah `GROUP_B`→`GROUP_A`; dicek tidak ada kode top-level di GROUP_B
  manapun yang memanggil `getBudgetXxx()`/dst saat file dimuat, semua pemanggil
  (`data-action`/`oninput` di HTML, `modules-render.js`) mengakses lewat variabel global
  saat runtime setelah kedua bundle sudah dimuat.

  `build.js` TIDAK berubah (tidak ada file baru). Header
  `features-fi-checkoutscan-importexport-payroll.js` diupdate (domain Budget dihapus dari
  daftar, sisa: list transaksi & cashflow forecast, export/import/backup, Payroll).

  Dicek: ke-18 fungsi cuma muncul 1x di source (di
  `features-budget-laporan-carnotes-pelanggan.js`) & 1x di `app-bundle-a.min.js` (pindah
  dari `app-bundle-b.min.js`), `node --check` lolos di semua 44 file source & kedua
  bundle, `index.html`/`app_production.html` tetap identik (cuma `?v=91`). **Belum**:
  tidak bisa dites tampilan sungguhan di browser — tetap wajib coba manual: buka tab
  Anggaran (Budget) di halaman Keuangan, tambah/edit/hapus anggaran, buka Pengaturan
  Anggaran (⚙️), ganti tampilan/urutan, dan tap kartu anggaran utk lihat drill-down —
  pastikan semua masih jalan normal.

  Sisa `features-fi-checkoutscan-importexport-payroll.js` (~1210 baris) masih campuran 2
  domain: list transaksi & cashflow forecast (`txHTML`/`delTx`/`computeCashflowForecast`/
  dll, kandidat ke `transaksi.js`) dan export/import/backup + Payroll/Absensi
  (`exportCSV`/`runBackup`/`importCarData`/`const Payroll={...}`/dll) — lanjutkan satu
  potongan lagi per sesi berikutnya.

- ✅ **List Transaksi & Cashflow Forecast digabung ke domain Transaksi (`transaksi.js`)**
  (v92, build kw70-split-txlist-cashflow-merge): lanjutan bedah
  `features-fi-checkoutscan-importexport-payroll.js` (setelah checkout-scan→`scan-ocr.js`
  v89, FI wrapper→`modules-calc.js` v90, Budget wrapper→
  `features-budget-laporan-carnotes-pelanggan.js` v91) — dipilih domain terkecil dari 2
  sisa domain (list transaksi & cashflow forecast ~130 baris vs export/import/backup +
  Payroll ~1070 baris). Dipindah 8 deklarasi top-level: `txHTML` (render 1 kartu
  transaksi), `delTx` (hapus transaksi + efek sampingnya ke stok/cicilan/tagihan/servis/
  renovasi/wishlist/sewa kios/absensi tukang terkait), `changeMonth` (navigasi bulan di
  Keuangan), `txListPeriode`+`setTxListPeriode`+`getTxListRange` (filter periode list tx
  Keuangan), `setPeriode`+`getRange` (filter periode Laporan), `computeCashflowForecast`
  (proyeksi saldo 30 hari ke depan) — digabung ke `transaksi.js` yang sudah ada (bukan
  file baru), ditaruh sbg blok baru di AKHIR file, karena domainnya sama-sama seputar
  data transaksi (form Tambah/Edit Transaksi yang sudah ada di `transaksi.js` vs.
  tampilkan & hapus transaksi + filter tanggalnya) — cuma kepisah gara-gara ikut nomor
  batch lama.

  Blok ini kontigu di file lama (baris 9-140, langsung di awal file). Dicek dulu semua
  dependensinya: `getAllCats()`/`escapeHtml()`/`fmt()` (kategori/format-tema, aman lintas
  file), `D.accounts`/`D.transactions`/`D.bbmLogs`/`D.cobek`/`D.servisLogs`/`D.bills`
  (state global `D`), `Renov.onLinkedTxDeleted()`/`WorthIt.onLinkedTxDeleted()`/
  `SewaKios.onLinkedTxDeleted()`/`Tukang.unmarkPaidEntries()` (GROUP_A, dipanggil saat
  `delTx()` jalan di runtime — bukan saat file di-load), `resetTxPageAndRender()`/
  `txListPage` (`filter-laporan.js`), `renderKeuangan()`/`renderLaporan()`
  (`modules-render.js`), `curMonth`/`curYear`/`filterPeriode`
  (`features-helpers-global-security.js`, TIDAK ikut pindah — state global, tetap di
  sana) — semua diakses lewat variabel global saat runtime, aman digabung.

  **Ditemukan 1 deklarasi tersisa yang BUKAN bagian domain ini** tepat setelah blok yang
  dipindah: `_lapLastFilterSig` (state dedup filter Laporan, dipakai `renderLaporan()`
  bareng `lapTxPage` yang sudah lebih dulu ada di `filter-laporan.js`) — SENGAJA TIDAK
  ikut dipindah krn di luar cakupan yang diminta sesi ini (domainnya beda: bukan
  "list transaksi/cashflow", tapi "filter Laporan", lebih cocok gabung ke
  `filter-laporan.js`), dicatat di header `features-fi-checkoutscan-importexport-payroll.js`
  sbg PR kecil berikutnya.

  Dicek juga semua pemanggil dari file LAIN: `txHTML` dari `filter-laporan.js`,
  `features-budget-laporan-carnotes-pelanggan.js`, `modules-render.js`; `delTx` dari
  `transaksi.js` sendiri (`deleteTxFromModal`, sudah lewat variabel global sejak awal);
  `changeMonth`/`setTxListPeriode`/`setPeriode` dari `index.html`/`app_production.html`
  lewat `data-action`; `getTxListRange`/`getRange`/`computeCashflowForecast` dari
  `modules-render.js` — semua lewat variabel global saat runtime, aman dipindah ke file
  lain walau dipanggil dari banyak tempat. (Catatan: `cobek.js` punya
  `Laporan.setPeriode()`/`Laporan.getRange()` sendiri — method di objek `Laporan`, beda
  scope dari fungsi global `setPeriode`/`getRange` yang dipindah di sini, tidak bentrok.)

  `build.js` TIDAK berubah (`transaksi.js` & `features-fi-checkoutscan-importexport-payroll.js`
  sudah sama-sama ada di `GROUP_B`, urutan tidak berubah — tidak ada file baru, tidak ada
  perpindahan antar grup). Header kedua file diupdate.

  Dicek: ke-8 identifier (termasuk `txListPeriode`, bukan cuma nama fungsi) cuma muncul
  1x di source (di `transaksi.js`) & 1x di `app-bundle-b.min.js` (0x di
  `app-bundle-a.min.js`), `node --check` lolos di semua file source & kedua bundle,
  `index.html`/`app_production.html` tetap identik (cuma `?v=92`). **Belum**: tidak bisa
  dites tampilan sungguhan di browser (tidak ada environment browser di sini) — tetap
  wajib coba manual: buka halaman Keuangan (list transaksi tampil dgn ikon/warna benar,
  coba hapus 1 transaksi biasa & 1 transaksi yang tertaut stok/cicilan/BBM/servis/
  renovasi/wishlist/sewa kios/absensi tukang — pastikan efek sampingnya tetap jalan
  benar), ganti bulan/periode filter list Keuangan, di halaman Laporan ganti periode
  filter & pastikan grafik/total ikut update, dan cek kartu "Proyeksi Cashflow" (kalau
  ada) di Dashboard masih menampilkan angka yang masuk akal.

  Sisa `features-fi-checkoutscan-importexport-payroll.js` (~1080 baris) sekarang MURNI 2
  domain: export/import/backup (`exportCSV`/`exportJSON`/`buildBackupPayload`/
  `runFullBackup`/`runBackup`/`applyRestoredData`/`importData`/`importCarData`/
  `handleImport`/dll) & Payroll/Absensi (`const Payroll={...}`, ~360 baris) — keduanya
  masih tak berhubungan sama sekali satu sama lain. Payroll paling besar & sudah rapi
  sbg 1 objek modul (mirip `LinkTx`/`Renov`/`Aset`), jadi kandidat kuat jadi file
  `payroll-absensi.js` sendiri di sesi berikutnya; sisanya (export/import/backup) jadi
  file `backup-restore.js` sendiri — lanjutkan satu potongan lagi per sesi berikutnya.

- ✅ **Payroll (Absensi & Kalkulator Gaji Mingguan) dipisah jadi file domain sendiri
  `payroll-absensi.js`** (v93, build kw70-split-payroll-absensi): lanjutan bedah
  `features-fi-checkoutscan-importexport-payroll.js` (setelah checkout-scan→`scan-ocr.js`
  v89, FI wrapper→`modules-calc.js` v90, Budget wrapper→
  `features-budget-laporan-carnotes-pelanggan.js` v91, list transaksi &
  cashflow→`transaksi.js` v92) — dipilih domain terkecil dari 2 sisa domain (Payroll
  ~360 baris vs export/import/backup ~720 baris). `const Payroll={...}` (state
  `weekStart`/`editId`/`selectedGridDate` + method `timeToMinutes`/`setWhTab`/
  `onJenisHariChange`/`addWorkDay`/`editWorkDay`/`cancelEditWorkDay`/`delWorkDay`/
  `renderWeekGrid`/`selectGridDay`/`recommendRate`/`renderRateRecommendation`/
  `saveTargetBulanan`/`applyRecommendedRate`/`renderDashMini`/`renderWorkDays`/dll)
  beserta 5 wrapper 1-baris (`timeToMinutes`/`addWorkDay`/`editWorkDay`/
  `cancelEditWorkDay`/`delWorkDay`) dipindah ke file BARU `payroll-absensi.js` — bukan
  digabung ke file lain, karena tidak ada domain existing yang cocok & modulnya sudah
  rapi sbg 1 objek (sama seperti `sewakios.js`/`hidup-seimbang.js`/`edukasi-dana.js`/
  `linktx.js` sebelumnya).

  Blok ini kontigu & langsung di baris 728 file lama (setelah `delReminder`, sampai
  akhir file). Dicek dulu semua dependensinya: `getWeekRange()`
  (`reset-gaji-mingguan.js`), `parsePzNum()` (`features-sheets-pwa-selftest.js`, dipanggil
  di dalam function body — deferred, bukan saat file di-load, jadi aman walau
  `features-sheets-pwa-selftest.js` dimuat PALING TERAKHIR di `GROUP_B`),
  `todayStr()`/`dateToISO()` (`helper-teks.js`), `D.profile`/`D.workDays`, `save()`/
  `toast()`/`openModal()`/`closeModal()`/`askConfirm()`/`escapeHtml()`/`fmt()`/
  `fmtFull()` — semua diakses lewat variabel global saat runtime, aman dipindah.
  Dicek juga arah sebaliknya: bagian export/import/backup yang TETAP di
  `features-fi-checkoutscan-importexport-payroll.js` sama sekali TIDAK mereferensi
  `Payroll` (0 hasil `grep`), jadi pemisahannya bersih tanpa dependensi silang.

  Dicek juga semua pemanggil dari file LAIN: `Payroll.renderDashMini()`/
  `Payroll.renderWorkDays()` dari `modules-render.js`; `Payroll.openAbsensiModal()`/
  `Payroll.changeAbsensiWeek()` dari `gaji-calc.js` (wrapper yang sudah ada sejak v87);
  `Payroll.setWhTab`/`Payroll.onJenisHariChange`/`Payroll.renderRateRecommendation`/
  `Payroll.saveTargetBulanan` dari `data-action`/`onchange`/`onblur` di
  `index.html`/`app_production.html` — semua lewat variabel global saat runtime, aman
  dipindah ke file baru walau dipanggil dari banyak tempat.

  **Ditemukan 5 deklarasi nyasar lain** tepat SEBELUM blok Payroll (`toggleMs`,
  `showTargetAccountTx`, `addTarget`, `delTarget`, `delReminder` — domain
  Target/Milestone/Reminder di Pengaturan, pasangan `saveTarget`/`saveCatatan`/
  `saveReminder`/`saveLDR` sudah lebih dulu ada di `transaksi.js` sejak v83) — SENGAJA
  TIDAK ikut dipindah krn di luar cakupan yang diminta sesi ini (bukan domain
  Payroll maupun export/import), dicatat di header
  `features-fi-checkoutscan-importexport-payroll.js` sbg PR kecil berikutnya (kandidat
  paling masuk akal: gabung ke `transaksi.js`, ikut `saveTarget`/`saveReminder` dkk).

  `build.js` (`GROUP_B`, `payroll-absensi.js` ditambah tepat setelah
  `features-fi-checkoutscan-importexport-payroll.js`, sebelum
  `features-tukang-kendaraan-storage.js`) & komentar "urutan load" di ke-13 file
  `GROUP_B` yang menyebut daftar urutan diupdate supaya konsisten. Header
  `features-fi-checkoutscan-importexport-payroll.js` diupdate.

  Dicek: `Payroll` + ke-5 wrapper cuma muncul 1x di source (di `payroll-absensi.js`) &
  1x di `app-bundle-b.min.js` (0x di `app-bundle-a.min.js`; 2 kemunculan lain string
  "const Payroll=" di bundle-b cuma teks komentar header, bukan deklarasi ganda),
  `node --check` lolos di semua file source & kedua bundle, `index.html`/
  `app_production.html` tetap identik (cuma `?v=93`). **Belum**: tidak bisa dites
  tampilan sungguhan di browser (tidak ada environment browser di sini) — tetap wajib
  coba manual MENYELURUH: buka modal Absensi (dari Dashboard kartu mini & dari
  Kalkulator Gaji → "📅 Buka Absensi"), tambah/edit/hapus absensi harian (mode jam &
  mode borongan), ganti minggu (‹ ›), tap kotak hari di grid mingguan, buka tab
  "🧮 Kalkulator Gaji" di modal yang sama & coba hitung Rekomendasi Tarif Ideal, isi
  Target Pemasukan Bulanan & pastikan tersimpan, dan cek kartu mini Absensi di
  Dashboard masih menampilkan status hari ini & total minggu ini dengan benar.

  Sisa `features-fi-checkoutscan-importexport-payroll.js` (~720 baris) sekarang MURNI
  domain export/import/backup (`exportCSV`/`exportJSON`/`buildBackupPayload`/
  `runFullBackup`/`runBackup`/`applyRestoredData`/`importData`/`importCarData`/
  `handleImport`/`ensureCashewTaxonomy`/`parseCSVImport`/dll) plus 5 deklarasi nyasar
  Target/Milestone/Reminder yang disebut di atas — kandidat file `backup-restore.js`
  sendiri (setelah 5 deklarasi nyasarnya dipindah ke `transaksi.js` lebih dulu, atau
  ikut dipindah bareng sekalian) di sesi berikutnya, yang akan menuntaskan pembedahan
  file ini sepenuhnya.



- ✅ **File di-rename jadi `backup-restore.js`** (v94, build kw70-split-backup-restore-rename):
  langkah TERAKHIR dari pembedahan `features-fi-checkoutscan-importexport-payroll.js` (lanjutan
  checkout-scan→`scan-ocr.js` v89, FI wrapper→`modules-calc.js` v90, Budget wrapper→
  `features-budget-laporan-carnotes-pelanggan.js` v91, list transaksi & cashflow→`transaksi.js` v92,
  Payroll→`payroll-absensi.js` v93). Sebelum rename, 2 sisa deklarasi nyasar yang belum dituntaskan
  sesi-sesi sebelumnya dibereskan dulu:
  - `_lapLastFilterSig` (state dedup filter Laporan) dipindah ke `filter-laporan.js`, ditaruh tepat
    setelah `lapTxPage` — keduanya memang dipakai bareng oleh `renderLaporan()`, cuma dulu kepisah file
    gara-gara ikut nomor batch lama (sudah dicatat sbg PR kecil sejak v92).
  - `toggleMs`/`showTargetAccountTx`/`addTarget`/`delTarget`/`delReminder` (domain Target/Milestone/
    Reminder di Pengaturan) dipindah ke `transaksi.js`, digabung tepat setelah `saveTarget`/
    `saveCatatan`/`saveReminder`/`saveLDR` yang sudah ada di sana sejak v83 (sudah dicatat sbg PR kecil
    sejak v93). Dicek dulu semua dependensinya: `showTargetAccountTx` malah jadi makin rapi krn `txHTML`
    (dipakainya) sudah lebih dulu ada di `transaksi.js` sejak v92 — sebelumnya lintas file, sekarang
    co-located. Pemanggil dari file lain (`modules-render.js`: `showTargetAccountTx`/`delTarget`/
    `addTarget`/`delReminder` lewat `data-action` di kartu Target/Milestone/Reminder Pengaturan) semua
    lewat variabel global saat runtime, aman dipindah.

  Setelah kedua bagian itu pindah, sisa `features-fi-checkoutscan-importexport-payroll.js` (~700 baris)
  sudah MURNI 1 domain: export/import/backup (`exportCSV`/`exportJSON`/`buildBackupPayload`/
  `runFullBackup`/`runBackup`/`applyRestoredData`/`importData`/`importCarData`/`handleImport`/
  `ensureCashewTaxonomy`/`parseCSVImport`/dll) — tidak ada lagi kode yang perlu DIPINDAHKAN, cukup
  RENAME file + update semua referensi nama file (pola yang sama seperti kasus `scan-ocr.js` di v88).

  `features-fi-checkoutscan-importexport-payroll.js` DIHAPUS, isinya disalin apa adanya ke file BARU
  `backup-restore.js` (tidak ada kode lain yang diubah selain 2 pemindahan di atas + komentar header).
  `build.js` (`GROUP_B`, `backup-restore.js` menggantikan `features-fi-checkoutscan-importexport-payroll.js`
  persis di posisi yang sama) & komentar "urutan load" di ke-12 file `GROUP_B` yang menyebut daftar
  urutan diupdate supaya konsisten. Komentar lain yang menyebut nama file lama (`sewakios.js`,
  `features-budget-laporan-carnotes-pelanggan.js`, `scan-ocr.js`, `modules-calc.js`, `payroll-absensi.js`,
  `transaksi.js`, `cobek.js`) juga diperbaiki.

  Dengan ini, pembedahan `features-fi-checkoutscan-importexport-payroll.js` (dulu
  `modules-features-9.js`) yang dimulai dari v89 SELESAI — filenya sudah tidak ada lagi, isinya sudah
  tersebar rapi ke `scan-ocr.js`, `modules-calc.js`, `features-budget-laporan-carnotes-pelanggan.js`,
  `transaksi.js`, `payroll-absensi.js`, `filter-laporan.js`, dan `backup-restore.js`.

  Dicek: `toggleMs`/`showTargetAccountTx`/`addTarget`/`delTarget`/`delReminder`/`_lapLastFilterSig`
  masing2 cuma muncul 1x di source (di file domain barunya) & di bundle sesuai grup file itu (semua
  `app-bundle-b.min.js`, konsisten sblm & sesudah pindah krn `transaksi.js`/`filter-laporan.js` sama-sama
  GROUP_B seperti file lama), `node --check` lolos di semua 45 file source & kedua bundle,
  `index.html`/`app_production.html` tetap identik (cuma memuat kedua file bundle, isi tidak berubah
  selain `?v=94`). **Belum**: tidak bisa dites tampilan sungguhan di browser — risiko rendah krn domain
  export/import/backup sendiri cuma dipindah nama file (isi identik), tapi 2 fungsi yang ikut pindah
  (Target/Milestone/Reminder) tetap perlu dicoba manual: di Pengaturan, coba tambah/hapus dana ke Target
  Tabungan, tap "Lihat Transaksi" pada satu target yang tertaut akun, centang/hapus Milestone anak, dan
  hapus 1 Pengingat kustom — pastikan semua masih jalan seperti biasa. Juga coba fitur Backup/Export
  (Backup Data, Export CSV/JSON dari Laporan, Import CSV Cashew, Import Car Notes) sekali lagi utk
  memastikan rename tidak mengganggu apa pun.

**PENTING untuk fase manapun berikutnya:** tetap wajib dites manual di
browser (`?dev=1` + smoke-test + coba tiap halaman/modal terkait) sebelum
lanjut ke domain berikutnya — lihat langkah di bawah.

## Rencana konkret untuk fase berikutnya (per-halaman sungguhan)

Kalau mau dilanjutkan, jalan paling aman:
1. Pilih 1 domain dulu (misal **Cobek**: modul `Etalase`, `Produsen` dari
   `features-etalase-piutang-renovai.js` + bagian cobek di
   `features-gaji-cobek-tagihan.js`) → pindahkan ke `cobek.js` baru.
2. Update `GROUP_A`/`GROUP_B` di `build.js` + jalankan `node build.js` (ada
   cek sintaks otomatis, build akan gagal kalau ada yang rusak).
3. Buka app di browser dengan `?dev=1`, jalankan smoke-test manual, coba
   semua halaman/modal yang berhubungan dengan modul yang dipindah.
4. Kalau lolos, lanjut ke domain berikutnya (Keuangan/Budget, lalu Car
   Notes, dst) satu-satu — bukan sekaligus 12 file dalam 1 kali kerja.

Saya bisa bantu kerjakan tiap domain itu satu per satu di sesi terpisah,
dengan kamu yang mengetes di browser di antara tiap langkah — supaya kalau
ada yang salah, gampang dilacak modul mana penyebabnya.
