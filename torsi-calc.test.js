'use strict';
// tests/torsi-calc.test.js — pengujian fungsional otomatis untuk modul Torsi
// (kalkulator torsi sparepart & mode checklist servis) di
// features-budget-laporan-carnotes-pelanggan.js.
//
// Item ini sebelumnya tercatat "BELUM DIKERJAKAN" di CATATAN-CEK-CLAUDE.md:
// "Logic Torsi Sparepart (katalog 60+ spesifikasi torsi Honda Vario 125,
// kalibrasi kunci torsi fisik MOLLAR MLR-B11950): belum ada pengujian
// fungsional otomatis terhadap kalkulator ekstensi (Torsi.calcExt) atau
// mode checklist servis."
//
// Cakupan yang dites di sini: Torsi.calcExt() (kalkulator ekstensi/sambungan
// kunci torsi), Torsi.fmt(), Torsi.currentTargetNm() (mode katalog vs
// manual), Torsi.renderGaugeValues() (konversi satuan N·m/kgf·m/lbf·ft/
// lbf·in), Torsi.setCalcMode(), dan mode checklist servis (toggleCheck,
// updateBiaya, updateSummary, persist/loadPersisted).
//
// Torsi.calcExt/fmt/currentTargetNm SENGAJA tidak butuh D/curVehicleId sama
// sekali (murni baca this.mode/this.selected/DOM) — jadi file
// features-budget-laporan-carnotes-pelanggan.js (GROUP_A) bisa di-load
// SENDIRIAN tanpa perlu features-tukang-kendaraan-storage.js (GROUP_B, yang
// baru menyediakan TORSI_DB/findTorsiDb/MY_WRENCH_SCALE — dipakai Torsi utk
// computeCats()/renderWrenchNote() yang TIDAK dites di sini, lihat catatan
// batasan di bawah). TORSI_NM_PER_KGF/LBFT/LBIN & MY_WRENCH_SCALE (yang
// aslinya baru didefinisikan belakangan di bundle B saat runtime asli)
// disuntikkan lewat extraGlobals persis seperti pola cross-bundle lain di
// helper ini (lihat urutan bundle A sebelum B di index.html).
//
// Batasan yang disengaja: computeCats() (butuh findTorsiDb dari GROUP_B) dan
// renderList()/renderRow() (murni string HTML) TIDAK dites di sini — cats
// disuntik manual sbg array kecil buatan sendiri utk fokus ke logika
// kalkulator & checklist, bukan re-test isi katalog (sudah "benar krn
// disalin dari buku manual", bukan logika yg bisa salah).

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { loadSource } = require('./helpers/loadSource.js');
const { createFakeDocument } = require('./helpers/fakeDom.js');

function setup(initialDom = {}) {
  // Sengaja TIDAK menyuntik classList/style custom lewat initial values di
  // sini — createFakeDocument() menerapkan initial values via
  // Object.assign(ensure(id), val), yang akan MENIMPA objek classList
  // bawaan createFakeElement() (yang punya method add/remove/toggle/
  // contains) kalau initial value ikut menyertakan key `classList`. Elemen
  // yang tidak didaftarkan di sini otomatis dibuat via ensure() dengan
  // classList/style bawaan yang benar saat pertama diakses.
  const fakeDocument = createFakeDocument({
    trsExtL: { value: '' },
    trsExtA: { value: '' },
    trsManualTorsiInput: { value: '' },
    ...initialDom,
  }, {
    // Torsi.selectPart() reset scroll modal via querySelector — sediakan
    // elemen dummy supaya tidak crash TypeError (null.scrollTop).
    '#torsiModal .modal': [{ scrollTop: 0 }],
  });
  const savedCalls = [];
  const D = { torsiChecklist: undefined, partsStock: [] };
  const TORSI_NM_PER_LBFT = 1.35582;
  // Bangun ulang MY_WRENCH_SCALE persis rumus aslinya (10-80 lbf·ft,
  // step 10) supaya renderWrenchNote()/scalePositionHtml() (dipanggil tiap
  // renderGaugeValues, termasuk dari alur selectPart) tidak crash saat nm
  // ada di dalam jangkauan kunci MY_WRENCH.
  const MY_WRENCH_SCALE = [];
  for (let l = 10; l <= 80; l += 10) {
    MY_WRENCH_SCALE.push({ lbft: l, nm: Math.round(l * TORSI_NM_PER_LBFT * 100) / 100 });
  }
  const ctx = loadSource(
    ['features-budget-laporan-carnotes-pelanggan.js'],
    {
      D,
      curVehicleId: 'veh1',
      document: fakeDocument,
      escapeHtml: (s) => String(s),
      toast: () => {},
      TORSI_NM_PER_KGF: 9.80665,
      TORSI_NM_PER_LBFT,
      TORSI_NM_PER_LBIN: 0.112985,
      MY_WRENCH_SCALE,
      save: () => { savedCalls.push(1); },
    },
    ['Torsi', 'MY_WRENCH', 'TORSI_STANDARD_CAT'],
  );
  return { Torsi: ctx.Torsi, fakeDocument, D, savedCalls };
}

test('Torsi.fmt — bulatkan 2 desimal & tangani null/NaN', () => {
  const { Torsi } = setup();
  assert.equal(Torsi.fmt(35.714285), '35.71');
  assert.equal(Torsi.fmt(10), '10');
  assert.equal(Torsi.fmt(null), '–');
  assert.equal(Torsi.fmt(undefined), '–');
  assert.equal(Torsi.fmt(NaN), '–');
});

test('Torsi.currentTargetNm — mode catalog pakai this.selected.nm', () => {
  const { Torsi } = setup();
  Torsi.mode = 'catalog';
  Torsi.selected = { name: 'Baut hex 8 mm', nm: 22 };
  assert.equal(Torsi.currentTargetNm(), 22);
});

test('Torsi.currentTargetNm — mode catalog tanpa selected => null', () => {
  const { Torsi } = setup();
  Torsi.mode = 'catalog';
  Torsi.selected = null;
  assert.equal(Torsi.currentTargetNm(), null);
});

test('Torsi.currentTargetNm — mode manual baca input trsManualTorsiInput', () => {
  const { Torsi, fakeDocument } = setup();
  Torsi.mode = 'manual';
  fakeDocument.getElementById('trsManualTorsiInput').value = '45.5';
  assert.equal(Torsi.currentTargetNm(), 45.5);
});

test('Torsi.currentTargetNm — mode manual input kosong/invalid => null', () => {
  const { Torsi, fakeDocument } = setup();
  Torsi.mode = 'manual';
  fakeDocument.getElementById('trsManualTorsiInput').value = '';
  assert.equal(Torsi.currentTargetNm(), null);
});

test('Torsi.calcExt — hitung setting kunci dgn rumus target×L÷(L+A)', () => {
  const { Torsi, fakeDocument } = setup();
  Torsi.mode = 'catalog';
  Torsi.selected = { name: 'Mur as roda belakang', nm: 118 };
  fakeDocument.getElementById('trsExtL').value = '280';
  fakeDocument.getElementById('trsExtA').value = '100';
  Torsi.calcExt();
  // setting = 118 * 280 / 380 = 86.947...
  assert.equal(fakeDocument.getElementById('trsExtResult').style.display, 'block');
  assert.equal(fakeDocument.getElementById('trsExtResultVal').textContent, '86.95 N·m');
  const note = fakeDocument.getElementById('trsExtResultNote').textContent;
  assert.match(note, /118 N·m/);
  assert.match(note, /380 mm/);
  assert.match(note, /86\.95 N·m/);
});

test('Torsi.calcExt — L atau A kosong => hasil disembunyikan (display none), tidak dihitung', () => {
  const { Torsi, fakeDocument } = setup();
  Torsi.mode = 'catalog';
  Torsi.selected = { name: 'Mur as roda belakang', nm: 118 };
  fakeDocument.getElementById('trsExtL').value = '';
  fakeDocument.getElementById('trsExtA').value = '100';
  Torsi.calcExt();
  assert.equal(fakeDocument.getElementById('trsExtResult').style.display, 'none');

  fakeDocument.getElementById('trsExtL').value = '280';
  fakeDocument.getElementById('trsExtA').value = '';
  Torsi.calcExt();
  assert.equal(fakeDocument.getElementById('trsExtResult').style.display, 'none');
});

test('Torsi.calcExt — belum ada target (selected null, mode catalog) => disembunyikan', () => {
  const { Torsi, fakeDocument } = setup();
  Torsi.mode = 'catalog';
  Torsi.selected = null;
  fakeDocument.getElementById('trsExtL').value = '280';
  fakeDocument.getElementById('trsExtA').value = '100';
  Torsi.calcExt();
  assert.equal(fakeDocument.getElementById('trsExtResult').style.display, 'none');
});

test('Torsi.calcExt — bekerja juga di mode manual, ikut input trsManualTorsiInput', () => {
  const { Torsi, fakeDocument } = setup();
  Torsi.mode = 'manual';
  fakeDocument.getElementById('trsManualTorsiInput').value = '60';
  fakeDocument.getElementById('trsExtL').value = '250';
  fakeDocument.getElementById('trsExtA').value = '50';
  Torsi.calcExt();
  // setting = 60 * 250 / 300 = 50
  assert.equal(fakeDocument.getElementById('trsExtResultVal').textContent, '50 N·m');
});

test('Torsi.renderGaugeValues — konversi N·m ke kgf·m/lbf·ft/lbf·in benar', () => {
  const { Torsi, fakeDocument } = setup();
  Torsi.renderGaugeValues(98.0665, null);
  assert.equal(fakeDocument.getElementById('trsVal-nm').textContent, '98.07');
  // 98.0665 / 9.80665 = 10 kgf·m persis
  assert.equal(fakeDocument.getElementById('trsVal-kgf').textContent, '10');
  assert.equal(fakeDocument.getElementById('trsGaugeVal').textContent, 98.0665);
});

test('Torsi.renderGaugeValues — note "oli" & "new" tampilkan pesan yg sesuai', () => {
  const { Torsi, fakeDocument } = setup();
  Torsi.renderGaugeValues(50, 'oli');
  assert.match(fakeDocument.getElementById('trsGaugeSub').textContent, /Oleskan oli/);
  Torsi.renderGaugeValues(50, 'new');
  assert.match(fakeDocument.getElementById('trsGaugeSub').textContent, /wajib ganti baru/);
  Torsi.renderGaugeValues(50, undefined);
  assert.equal(fakeDocument.getElementById('trsGaugeSub').textContent, '');
});

test('Torsi.renderGaugeValues — nm null mengosongkan semua nilai (–)', () => {
  const { Torsi, fakeDocument } = setup();
  Torsi.renderGaugeValues(null);
  assert.equal(fakeDocument.getElementById('trsGaugeVal').textContent, '–');
  assert.equal(fakeDocument.getElementById('trsVal-nm').textContent, '–');
  assert.equal(fakeDocument.getElementById('trsVal-kgf').textContent, '–');
  assert.equal(fakeDocument.getElementById('trsVal-lbft').textContent, '–');
  assert.equal(fakeDocument.getElementById('trsVal-lbin').textContent, '–');
});

test('Torsi.setCalcMode — toggle active class katalog vs manual & tampil/sembunyi input manual', () => {
  const { Torsi, fakeDocument } = setup();
  Torsi.selected = { name: 'x', nm: 10 };
  Torsi.setCalcMode('manual');
  assert.equal(Torsi.mode, 'manual');
  assert.equal(fakeDocument.getElementById('trsModeManual').classList.contains('active'), true);
  assert.equal(fakeDocument.getElementById('trsModeCatalog').classList.contains('active'), false);
  assert.equal(fakeDocument.getElementById('trsManualInputWrap').style.display, 'block');

  Torsi.setCalcMode('catalog');
  assert.equal(Torsi.mode, 'catalog');
  assert.equal(fakeDocument.getElementById('trsModeCatalog').classList.contains('active'), true);
  assert.equal(fakeDocument.getElementById('trsManualInputWrap').style.display, 'none');
});

test('Torsi.setCalcMode("manual") langsung sync gauge dari input manual yg sudah terisi', () => {
  const { Torsi, fakeDocument } = setup();
  fakeDocument.getElementById('trsManualTorsiInput').value = '33';
  Torsi.setCalcMode('manual');
  assert.equal(fakeDocument.getElementById('trsGaugePartName').textContent, '✍️ Input manual');
  assert.equal(fakeDocument.getElementById('trsVal-nm').textContent, '33');
});

test('Torsi.itemKey — gabungkan kategori & nama part sbg key unik', () => {
  const { Torsi } = setup();
  assert.equal(Torsi.itemKey('Mesin', 'Busi'), 'Mesin|Busi');
});

// ---- Mode checklist servis ----

function fakeCats() {
  return [
    { cat: 'Standar (Umum)', icon: '🔩', items: [
      { name: 'Baut A', ulir: '6 mm', nm: 10, kgf: 1.0 },
      { name: 'Baut B', ulir: '8 mm', nm: 22, kgf: 2.2 },
    ] },
    { cat: 'Sistem Rem', icon: '🛑', items: [
      { name: 'Pin brake pad', ulir: '10 mm', nm: 18, kgf: 1.8, consumable: true },
    ] },
  ];
}

test('Torsi.updateSummary — hitung progres & total biaya HANYA dari item tercentang', () => {
  const { Torsi, fakeDocument } = setup();
  Torsi.cats = fakeCats();
  Torsi.checked = {};
  Torsi.biaya = {};
  Torsi.updateSummary();
  assert.equal(fakeDocument.getElementById('trsSummaryProgress').textContent, '0/3');
  assert.equal(fakeDocument.getElementById('trsSummaryProgressFill').style.width, '0%');
  assert.equal(fakeDocument.getElementById('trsSummaryBiaya').textContent, 'Rp 0');

  Torsi.checked[Torsi.itemKey('Standar (Umum)', 'Baut A')] = true;
  Torsi.checked[Torsi.itemKey('Sistem Rem', 'Pin brake pad')] = true;
  Torsi.biaya[Torsi.itemKey('Sistem Rem', 'Pin brake pad')] = 25000;
  // Baut B TIDAK dicentang, tetap masuk hitungan count tapi bukan done/biaya.
  Torsi.updateSummary();
  assert.equal(fakeDocument.getElementById('trsSummaryProgress').textContent, '2/3');
  assert.equal(fakeDocument.getElementById('trsSummaryProgressFill').style.width, '67%');
  assert.equal(fakeDocument.getElementById('trsSummaryBiaya').textContent, 'Rp 25.000');
});

test('Torsi.toggleCheck — toggle status & ikut update summary + persist ke D.torsiChecklist', () => {
  const { Torsi, D, savedCalls } = setup();
  Torsi.cats = fakeCats();
  Torsi.checked = {};
  Torsi.biaya = {};
  const key = Torsi.itemKey('Standar (Umum)', 'Baut A');
  Torsi.toggleCheck(key);
  assert.equal(Torsi.checked[key], true);
  assert.equal(D.torsiChecklist.veh1.checked[key], true);
  assert.ok(savedCalls.length >= 1, 'save() harus terpanggil saat persist');

  Torsi.toggleCheck(key);
  assert.equal(Torsi.checked[key], false);
  assert.equal(D.torsiChecklist.veh1.checked[key], false);
});

test('Torsi.updateBiaya — simpan angka biaya (fallback 0 kalau invalid) & persist', () => {
  const { Torsi, D } = setup();
  Torsi.cats = fakeCats();
  Torsi.checked = {};
  Torsi.biaya = {};
  const key = Torsi.itemKey('Sistem Rem', 'Pin brake pad');
  Torsi.updateBiaya(key, '30000');
  assert.equal(Torsi.biaya[key], 30000);
  assert.equal(D.torsiChecklist.veh1.biaya[key], 30000);

  Torsi.updateBiaya(key, 'bukan-angka');
  assert.equal(Torsi.biaya[key], 0);
});

test('Torsi.setPageMode — ganti mode normal/checklist, toggle class & persist', () => {
  const { Torsi, fakeDocument, D } = setup();
  Torsi.cats = fakeCats();
  Torsi.checked = {};
  Torsi.biaya = {};
  Torsi.setPageMode('checklist');
  assert.equal(Torsi.pageMode, 'checklist');
  assert.equal(fakeDocument.getElementById('trsTopModeChecklist').classList.contains('active'), true);
  assert.equal(fakeDocument.getElementById('trsSummaryBar').classList.contains('show'), true);
  assert.equal(D.torsiChecklist.veh1.pageMode, 'checklist');

  Torsi.setPageMode('normal');
  assert.equal(Torsi.pageMode, 'normal');
  assert.equal(fakeDocument.getElementById('trsTopModeNormal').classList.contains('active'), true);
  assert.equal(fakeDocument.getElementById('trsSummaryBar').classList.contains('show'), false);
});

test('Torsi.loadPersisted — baca kembali checked/biaya/pageMode per kendaraan, kendaraan lain tidak ketukar', () => {
  const { Torsi, D } = setup();
  D.torsiChecklist = {
    veh1: { checked: { 'A|B': true }, biaya: { 'A|B': 5000 }, pageMode: 'checklist' },
    veh2: { checked: { 'X|Y': true }, biaya: {}, pageMode: 'normal' },
  };
  Torsi.loadPersisted();
  // Objek dari dalam vm sandbox dibungkus ulang via Object.assign({}, ...)
  // supaya jadi objek plain di realm host — deepEqual/deepStrictEqual bisa
  // gagal membandingkan objek lintas-realm walau isinya sama persis (pola
  // yg sama dipakai di fi-calc.test.js / vehicle-tx-category.test.js).
  assert.deepEqual(Object.assign({}, Torsi.checked), { 'A|B': true });
  assert.deepEqual(Object.assign({}, Torsi.biaya), { 'A|B': 5000 });
  assert.equal(Torsi.pageMode, 'checklist');
});

test('Torsi.loadPersisted — kendaraan belum pernah ada record => default kosong/normal, tidak error', () => {
  const { Torsi, D } = setup();
  D.torsiChecklist = undefined;
  Torsi.loadPersisted();
  assert.deepEqual(Object.assign({}, Torsi.checked), {});
  assert.deepEqual(Object.assign({}, Torsi.biaya), {});
  assert.equal(Torsi.pageMode, 'normal');
  // D.torsiChecklist otomatis di-init jadi objek kosong (bukan undefined lagi)
  assert.deepEqual(Object.assign({}, D.torsiChecklist), {});
});

test('Torsi.selectPart — muat part terpilih ke kalkulator, part noTorque diabaikan', () => {
  const { Torsi, fakeDocument } = setup();
  Torsi.cats = fakeCats();
  Torsi.mode = 'manual';
  Torsi.selectPart('Standar (Umum)', 'Baut B');
  assert.equal(Torsi.mode, 'catalog');
  assert.equal(Torsi.selected.name, 'Baut B');
  assert.equal(fakeDocument.getElementById('trsVal-nm').textContent, '22');

  Torsi.cats = [{ cat: 'X', icon: '', items: [{ name: 'Servis rutin', noTorque: true }] }];
  Torsi.selected = null;
  Torsi.selectPart('X', 'Servis rutin');
  assert.equal(Torsi.selected, null, 'part noTorque tidak boleh ke-load ke kalkulator');
});
