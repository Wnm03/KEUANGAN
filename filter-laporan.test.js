'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { loadSource } = require('./helpers/loadSource');
const { createFakeDocument, createFakeElement } = require('./helpers/fakeDom');

// filter-laporan.js (220 baris di v187, 221 di versi sebelum redesign etalase
// -> cobek/#page-cobek/setCobekTab jadi shop/#page-shop/setShopTab): filter
// transaksi/keuangan (panel filter Keuangan & Laporan), pencarian, paginasi
// list transaksi, & navigasi antar-list (goToList/showFilteredTx). Lanjutan
// daftar nol-test ringan->berat (setelah reset-gaji-mingguan.js; masih ada
// item lain sesudah ini, lihat CATATAN-CEK-CLAUDE.md/CLAUDE.md).
//
// Catatan pola yg dipakai di sini:
// - `txListPage`/`lapTxPage`/`_lapLastFilterSig`/`_keuFilterPrefsLoaded`
//   dideklarasikan `let`/`const` top-level DI DALAM file sumber ini sendiri
//   (bukan lewat extraGlobals) -> TIDAK otomatis nempel ke objek context vm,
//   dibaca/ditulis lewat `vm.runInContext()` ke context yg sama, pola identik
//   dgn tests/kalkulator-popup.test.js & tests/keamanan-pin.test.js.
// - `curMonth`/`curYear`/`txListPeriode`/`D`/`populateCatSelect`/
//   `populateSubSelect`/`renderLaporan`/`renderKeuangan`/`toast`/
//   `escapeHtml`/`safeSetItem`/`getRange`/`fmt`/`openModal`/`showPage`/
//   `setShopTab`/`setCnTab`/`txHTML` semuanya didefinisikan di file LAIN ->
//   di-stub lewat extraGlobals (pola sama dgn onboarding.test.js dst).
// - `kfAcc` (select akun) butuh `.options` beneran (bukan cuma `.value`)
//   krn populateKeuFilters() baca `[...kfAcc.options]` -> dipakai
//   `makeSelectElement()` mini yg parse `value="..."` dari innerHTML yg
//   ditulis, bukan `createFakeElement()` biasa.

function makeFakeDate(nowIso) {
  const fixedTime = new Date(nowIso).getTime();
  class FakeDate extends Date {
    constructor(...args) {
      if (args.length === 0) super(fixedTime);
      else super(...args);
    }
  }
  FakeDate.now = () => fixedTime;
  return FakeDate;
}

// Objek plain yg di-return dari dalam sandbox vm (mis. getKeuFilters(),
// scrollIntoView(opts)) punya `[[Prototype]]` beda dari Object literal biasa
// di realm host ini -- assert.deepEqual/deepStrictEqual (strict mode) ikut
// membandingkan prototype itu, jadi selalu gagal walau isinya identik. `plain()`
// buang lintas-realm itu via JSON round-trip sebelum dibandingkan.
function plain(obj) { return JSON.parse(JSON.stringify(obj)); }

function makeSelectElement(initialValue = '') {
  let val = initialValue;
  let html = '';
  let optionValues = [];
  return {
    get value() { return val; },
    set value(v) { val = v; },
    get innerHTML() { return html; },
    set innerHTML(h) {
      html = h;
      optionValues = [...h.matchAll(/value="([^"]*)"/g)].map((m) => m[1]);
    },
    get options() { return optionValues.map((v) => ({ value: v })); },
  };
}

function makeCtx({ D = {}, domInitial = {}, queryGroups = {}, extraGlobals = {}, nowIso = '2026-07-11T10:00:00.000Z', selects = {} } = {}) {
  const baseDoc = createFakeDocument({
    fTipe: {}, fKat: {}, fSub: {}, fAcc: {}, fMethod: {},
    kfTipe: {}, kfKat: {}, kfSub: {}, kfAcc: {}, kfMethod: {}, kfSearch: {},
    ...domInitial,
  }, queryGroups);
  // createFakeDocument() memakai Object.assign(newElement, initial) utk
  // menerapkan `initial` -- ini MERATAKAN accessor getter/setter kustom
  // (spt makeSelectElement()) jadi cuma snapshot nilai statis, bukan
  // accessor beneran. Utk elemen <select> yg butuh `.options` HIDUP
  // (populateKeuFilters baca `[...kfAcc.options]` SETELAH nulis
  // `.innerHTML`), suntikkan lewat `selects` yg override getElementById
  // langsung (bukan lewat merge Object.assign) supaya getter/setternya utuh.
  const mergedSelects = { kfAcc: makeSelectElement('semua'), ...selects };
  const fakeDocument = { ...baseDoc, getElementById: (id) => (mergedSelects[id] !== undefined ? mergedSelects[id] : baseDoc.getElementById(id)) };
  const calls = {
    populateCatSelect: [], populateSubSelect: [], renderLaporan: 0, renderKeuangan: 0,
    toast: [], safeSetItem: [], openModal: [],
  };
  const baseD = { accounts: [], transactions: [], ...D };
  const ctx = loadSource(['filter-laporan.js'], {
    document: fakeDocument,
    Date: makeFakeDate(nowIso),
    D: baseD,
    curMonth: 6, curYear: 2026,
    txListPeriode: 'bulan',
    populateCatSelect: (id) => calls.populateCatSelect.push(id),
    populateSubSelect: (subId, katId) => calls.populateSubSelect.push([subId, katId]),
    renderLaporan: () => { calls.renderLaporan++; },
    renderKeuangan: () => { calls.renderKeuangan++; },
    toast: (msg) => calls.toast.push(msg),
    escapeHtml: (s) => String(s ?? ''),
    safeSetItem: (k, v) => { calls.safeSetItem.push([k, v]); },
    openModal: (id) => calls.openModal.push(id),
    getRange: () => ({ from: new Date(0), to: new Date(8640000000000000) }),
    fmt: (n) => 'RP' + n,
    txHTML: (t) => `<i>${t.id}</i>`,
    showPage: () => {},
    setShopTab: () => {},
    setCnTab: () => {},
    ...extraGlobals,
  });
  function getVar(name) { return vm.runInContext(name, ctx); }
  function setVar(name, value) { vm.runInContext(`${name} = ${JSON.stringify(value)};`, ctx); }
  return { ctx, fakeDocument, calls, D: baseD, getVar, setVar };
}

function tx(overrides) {
  return { id: 'id' + Math.random(), type: 'expense', category: 'Makan', accountId: 'acc1', amount: 10000, date: '2026-07-06', ...overrides };
}

// ---------- txMatchesFilters (pure) ----------

test('txMatchesFilters — tipe kosong/"semua" -> lolos apa pun tipenya', () => {
  const { ctx } = makeCtx();
  assert.equal(ctx.txMatchesFilters(tx({ type: 'income' }), {}), true);
  assert.equal(ctx.txMatchesFilters(tx({ type: 'expense' }), { tipe: 'semua' }), true);
});

test('txMatchesFilters — tipe "transfer" cocok transfer_in DAN transfer_out, bukan tipe lain', () => {
  const { ctx } = makeCtx();
  assert.equal(ctx.txMatchesFilters(tx({ type: 'transfer_in' }), { tipe: 'transfer' }), true);
  assert.equal(ctx.txMatchesFilters(tx({ type: 'transfer_out' }), { tipe: 'transfer' }), true);
  assert.equal(ctx.txMatchesFilters(tx({ type: 'expense' }), { tipe: 'transfer' }), false);
});

test('txMatchesFilters — tipe spesifik (income/expense) harus persis sama', () => {
  const { ctx } = makeCtx();
  assert.equal(ctx.txMatchesFilters(tx({ type: 'income' }), { tipe: 'income' }), true);
  assert.equal(ctx.txMatchesFilters(tx({ type: 'expense' }), { tipe: 'income' }), false);
});

test('txMatchesFilters — filter kategori/subkategori/akun/metode masing2 memblok kalau tidak cocok', () => {
  const { ctx } = makeCtx();
  const t = tx({ category: 'Makan', subcategory: 'Kopi', accountId: 'acc1', payMethod: 'cicilan' });
  assert.equal(ctx.txMatchesFilters(t, { kat: 'Belanja' }), false);
  assert.equal(ctx.txMatchesFilters(t, { kat: 'Makan' }), true);
  assert.equal(ctx.txMatchesFilters(t, { sub: 'Teh' }), false);
  assert.equal(ctx.txMatchesFilters(t, { sub: 'Kopi' }), true);
  assert.equal(ctx.txMatchesFilters(t, { acc: 'acc2' }), false);
  assert.equal(ctx.txMatchesFilters(t, { acc: 'acc1' }), true);
  assert.equal(ctx.txMatchesFilters(t, { method: 'langganan' }), false);
  assert.equal(ctx.txMatchesFilters(t, { method: 'cicilan' }), true);
});

test('txMatchesFilters — subcategory/payMethod kosong dianggap "" / "tunai" (fallback default)', () => {
  const { ctx } = makeCtx();
  const t = tx({ subcategory: undefined, payMethod: undefined });
  assert.equal(ctx.txMatchesFilters(t, { sub: '' }), true);
  assert.equal(ctx.txMatchesFilters(t, { method: 'tunai' }), true);
});

// ---------- txMatchesSearch (pure, pakai D.accounts) ----------

test('txMatchesSearch — query kosong -> selalu lolos', () => {
  const { ctx } = makeCtx();
  assert.equal(ctx.txMatchesSearch(tx(), ''), true);
});

test('txMatchesSearch — cocok di category/subcategory/note/nama akun (haystack di-lowercase; q TIDAK di-lowercase oleh fungsi ini sendiri -- kontrak: pemanggil wajib lowercase duluan, lihat getKeuFilters)', () => {
  const { ctx } = makeCtx({ D: { accounts: [{ id: 'acc1', name: 'Bank BCA' }] } });
  const t = tx({ category: 'Makan', subcategory: 'Kopi', note: 'Ngopi santai', accountId: 'acc1' });
  assert.equal(ctx.txMatchesSearch(t, 'kopi'), true);
  assert.equal(ctx.txMatchesSearch(t, 'makan'), true);
  assert.equal(ctx.txMatchesSearch(t, 'santai'), true);
  assert.equal(ctx.txMatchesSearch(t, 'bca'), true);
  assert.equal(ctx.txMatchesSearch(t, 'tidak-ada'), false);
  assert.equal(ctx.txMatchesSearch(t, 'MAKAN'), false);
});

test('txMatchesSearch — akun tidak ditemukan / field kosong tidak bikin crash', () => {
  const { ctx } = makeCtx({ D: { accounts: [] } });
  const t = tx({ category: 'Makan', subcategory: '', note: '', accountId: 'acc-hilang' });
  assert.equal(ctx.txMatchesSearch(t, 'makan'), true);
  assert.equal(ctx.txMatchesSearch(t, 'zzz'), false);
});

// ---------- populateCatFilter / onFKatChange (Laporan) ----------

test('populateCatFilter — panggil populateCatSelect("fKat") & populateSubSelect("fSub","fKat")', () => {
  const { ctx, calls } = makeCtx();
  ctx.populateCatFilter();
  assert.deepEqual(calls.populateCatSelect, ['fKat']);
  assert.deepEqual(calls.populateSubSelect, [['fSub', 'fKat']]);
});

test('onFKatChange — populateSubSelect lalu renderLaporan', () => {
  const { ctx, calls } = makeCtx();
  ctx.onFKatChange();
  assert.deepEqual(calls.populateSubSelect, [['fSub', 'fKat']]);
  assert.equal(calls.renderLaporan, 1);
});

// ---------- resetLaporanFilter ----------

test('resetLaporanFilter — semua field fTipe/fKat/fSub/fAcc/fMethod jadi "semua", populateSubSelect, renderLaporan, toast', () => {
  const { ctx, fakeDocument, calls } = makeCtx({
    domInitial: { fTipe: { value: 'income' }, fKat: { value: 'Makan' }, fAcc: { value: 'acc1' } },
  });
  ctx.resetLaporanFilter();
  ['fTipe', 'fKat', 'fSub', 'fAcc', 'fMethod'].forEach((id) => {
    assert.equal(fakeDocument.getElementById(id).value, 'semua');
  });
  assert.deepEqual(calls.populateSubSelect, [['fSub', 'fKat']]);
  assert.equal(calls.renderLaporan, 1);
  assert.deepEqual(calls.toast, ['↺ Filter laporan direset']);
});

// ---------- getLaporanFilters ----------

test('getLaporanFilters — baca value tiap field, fallback "semua" kalau kosong', () => {
  const { ctx, fakeDocument } = makeCtx({
    domInitial: { fTipe: { value: 'expense' }, fKat: { value: 'Belanja' }, fSub: { value: 'Sayur' }, fAcc: { value: 'acc2' }, fMethod: { value: 'langganan' } },
  });
  assert.deepEqual(plain(ctx.getLaporanFilters()), {
    tipe: 'expense', kat: 'Belanja', sub: 'Sayur', acc: 'acc2', method: 'langganan',
  });
  fakeDocument.getElementById('fTipe').value = '';
  assert.equal(ctx.getLaporanFilters().tipe, 'semua');
});

// ---------- populateKeuFilters ----------

test('populateKeuFilters — populateCatSelect/populateSubSelect("kfKat") & isi kfAcc dari D.accounts', () => {
  const { ctx, calls, fakeDocument } = makeCtx({
    D: { accounts: [{ id: 'acc1', emoji: '💰', name: 'Tunai' }, { id: 'acc2', emoji: '🏦', name: 'Bank' }] },
    selects: { kfAcc: makeSelectElement('semua') },
  });
  ctx.populateKeuFilters();
  assert.deepEqual(calls.populateCatSelect, ['kfKat']);
  assert.deepEqual(calls.populateSubSelect, [['kfSub', 'kfKat']]);
  const kfAcc = fakeDocument.getElementById('kfAcc');
  assert.match(kfAcc.innerHTML, /Semua Akun/);
  assert.match(kfAcc.innerHTML, /value="acc1"/);
  assert.match(kfAcc.innerHTML, /💰 Tunai/);
  assert.equal(kfAcc.value, 'semua'); // 'semua' tetap ada di opsi -> dipertahankan
});

test('populateKeuFilters — value lama masih ada di opsi baru -> dipertahankan', () => {
  const { ctx, fakeDocument } = makeCtx({
    D: { accounts: [{ id: 'acc1', emoji: '💰', name: 'Tunai' }] },
    selects: { kfAcc: makeSelectElement('acc1') },
  });
  ctx.populateKeuFilters();
  assert.equal(fakeDocument.getElementById('kfAcc').value, 'acc1');
});

test('populateKeuFilters — value lama sudah tidak ada (akun dihapus) -> fallback "semua"', () => {
  const { ctx, fakeDocument } = makeCtx({
    D: { accounts: [{ id: 'acc2', emoji: '🏦', name: 'Bank' }] },
    selects: { kfAcc: makeSelectElement('acc-hilang') },
  });
  ctx.populateKeuFilters();
  assert.equal(fakeDocument.getElementById('kfAcc').value, 'semua');
});

// ---------- onKfKatChange ----------

test('onKfKatChange — populateSubSelect("kfSub","kfKat") lalu resetTxPageAndRender (txListPage=1, save, renderKeuangan)', () => {
  const { ctx, calls, getVar, setVar } = makeCtx();
  setVar('txListPage', 3);
  ctx.onKfKatChange();
  assert.deepEqual(calls.populateSubSelect, [['kfSub', 'kfKat']]);
  assert.equal(getVar('txListPage'), 1);
  assert.equal(calls.safeSetItem.length, 1);
  assert.equal(calls.renderKeuangan, 1);
});

// ---------- toggleKeuFilter ----------

test('toggleKeuFilter — panel tersembunyi (default) -> ditampilkan, populateKeuFilters dipanggil, badge di-update', () => {
  const { ctx, fakeDocument, calls } = makeCtx({ domInitial: { keuFilterPanel: { style: { display: 'none' } } } });
  ctx.toggleKeuFilter();
  assert.equal(fakeDocument.getElementById('keuFilterPanel').style.display, 'block');
  assert.deepEqual(calls.populateCatSelect, ['kfKat']); // dipanggil lewat populateKeuFilters
});

test('toggleKeuFilter — panel tampil -> disembunyikan, populateKeuFilters TIDAK dipanggil', () => {
  const { ctx, fakeDocument, calls } = makeCtx({ domInitial: { keuFilterPanel: { style: { display: 'block' } } } });
  ctx.toggleKeuFilter();
  assert.equal(fakeDocument.getElementById('keuFilterPanel').style.display, 'none');
  assert.equal(calls.populateCatSelect.length, 0);
});

test('toggleKeuFilter — panel tidak ada di DOM -> tidak crash, tidak melakukan apa2', () => {
  const noPanelDoc = {
    getElementById: (id) => (id === 'keuFilterPanel' ? null : createFakeElement()),
    querySelectorAll: () => [],
  };
  const local = loadSource(['filter-laporan.js'], { document: noPanelDoc, D: { accounts: [] } });
  assert.doesNotThrow(() => local.toggleKeuFilter());
});

// ---------- resetKeuFilter ----------

test('resetKeuFilter — reset semua field kf* & kfSearch, populateSubSelect, save 2x (langsung + lewat resetTxPageAndRender), renderKeuangan, toast', () => {
  const { ctx, fakeDocument, calls, getVar } = makeCtx({
    domInitial: {
      kfTipe: { value: 'income' }, kfKat: { value: 'Gaji' },
      kfSearch: { value: 'ngopi' },
    },
    selects: { kfAcc: { value: 'acc1' } },
  });
  ctx.resetKeuFilter();
  ['kfTipe', 'kfKat', 'kfSub', 'kfAcc', 'kfMethod'].forEach((id) => {
    assert.equal(fakeDocument.getElementById(id).value, 'semua');
  });
  assert.equal(fakeDocument.getElementById('kfSearch').value, '');
  assert.deepEqual(calls.populateSubSelect, [['kfSub', 'kfKat']]);
  assert.equal(calls.safeSetItem.length, 2);
  assert.equal(calls.renderKeuangan, 1);
  assert.equal(getVar('txListPage'), 1);
  assert.deepEqual(calls.toast, ['↺ Filter direset']);
});

// ---------- getKeuFilters ----------

test('getKeuFilters — baca semua field kf* + kfSearch di-trim & lowercase', () => {
  const { ctx, fakeDocument } = makeCtx({
    domInitial: {
      kfTipe: { value: 'expense' }, kfKat: { value: 'Belanja' }, kfSub: { value: 'Sayur' },
      kfMethod: { value: 'cicilan' }, kfSearch: { value: '  Kopi Susu  ' },
    },
    selects: { kfAcc: { value: 'acc1' } },
  });
  assert.deepEqual(plain(ctx.getKeuFilters()), {
    tipe: 'expense', kat: 'Belanja', sub: 'Sayur', acc: 'acc1', method: 'cicilan', search: 'kopi susu',
  });
  void fakeDocument;
});

test('getKeuFilters — semua field kosong -> fallback "semua"/"" ', () => {
  const { ctx } = makeCtx();
  assert.deepEqual(plain(ctx.getKeuFilters()), {
    tipe: 'semua', kat: 'semua', sub: 'semua', acc: 'semua', method: 'semua', search: '',
  });
});

// ---------- loadMoreLapTx / loadMoreTx / resetTxPageAndRender ----------

test('loadMoreLapTx — lapTxPage bertambah 1, renderLaporan dipanggil', () => {
  const { ctx, calls, getVar } = makeCtx();
  ctx.loadMoreLapTx();
  assert.equal(getVar('lapTxPage'), 2);
  assert.equal(calls.renderLaporan, 1);
  ctx.loadMoreLapTx();
  assert.equal(getVar('lapTxPage'), 3);
});

test('loadMoreTx — txListPage bertambah 1, renderKeuangan dipanggil', () => {
  const { ctx, calls, getVar } = makeCtx();
  ctx.loadMoreTx();
  assert.equal(getVar('txListPage'), 2);
  assert.equal(calls.renderKeuangan, 1);
});

test('resetTxPageAndRender — txListPage selalu balik ke 1 walau sebelumnya sudah maju, save & renderKeuangan dipanggil', () => {
  const { ctx, calls, getVar, setVar } = makeCtx();
  setVar('txListPage', 4);
  ctx.resetTxPageAndRender();
  assert.equal(getVar('txListPage'), 1);
  assert.equal(calls.safeSetItem.length, 1);
  assert.equal(calls.renderKeuangan, 1);
});

// ---------- onKfSearchInput (debounce 250ms) ----------

function makeTimerGlobals() {
  const calls = { setTimeout: [], cleared: [] };
  return {
    calls,
    setTimeout: (fn, ms) => { const id = calls.setTimeout.length + 1; calls.setTimeout.push({ id, fn, ms }); return id; },
    clearTimeout: (id) => { calls.cleared.push(id); },
  };
}

test('onKfSearchInput — jadwalkan debounce 250ms lewat window._kfSearchDebounce', () => {
  const timer = makeTimerGlobals();
  const window = {};
  const { ctx, calls } = makeCtx({
    extraGlobals: { setTimeout: timer.setTimeout, clearTimeout: timer.clearTimeout, window },
  });
  ctx.onKfSearchInput();
  assert.equal(timer.calls.setTimeout.length, 1);
  assert.equal(timer.calls.setTimeout[0].ms, 250);
  assert.equal(window._kfSearchDebounce, 1);
  // Jalankan callback -> resetTxPageAndRender beneran terpanggil
  timer.calls.setTimeout[0].fn();
  assert.equal(calls.renderKeuangan, 1);
});

test('onKfSearchInput — dipanggil 2x berturut2 -> clearTimeout timer lama dulu sebelum jadwal baru', () => {
  const timer = makeTimerGlobals();
  const window = {};
  const { ctx } = makeCtx({
    extraGlobals: { setTimeout: timer.setTimeout, clearTimeout: timer.clearTimeout, window },
  });
  ctx.onKfSearchInput();
  ctx.onKfSearchInput();
  assert.equal(timer.calls.setTimeout.length, 2);
  // Panggilan PERTAMA juga selalu clearTimeout(window._kfSearchDebounce) walau
  // belum pernah dijadwalkan (nilainya undefined) -- clearTimeout(undefined)
  // aman/no-op di browser asli, jadi ini bukan bug.
  assert.deepEqual(timer.calls.cleared, [undefined, 1]);
  assert.equal(window._kfSearchDebounce, 2);
});

// ---------- saveKeuFilterPrefs ----------

test('saveKeuFilterPrefs — simpan JSON prefs lengkap (filter + periode + custom range) via safeSetItem', () => {
  const { ctx, calls } = makeCtx({
    domInitial: {
      kfTipe: { value: 'income' }, kfKat: { value: 'Gaji' }, kfSub: { value: 'Bulanan' },
      kfMethod: { value: 'tunai' }, kfSearch: { value: 'bonus' },
      txListFrom: { value: '2026-07-01' }, txListTo: { value: '2026-07-31' },
    },
    selects: { kfAcc: { value: 'acc1' } },
    extraGlobals: { txListPeriode: 'custom' },
  });
  ctx.saveKeuFilterPrefs();
  assert.equal(calls.safeSetItem.length, 1);
  const [key, json] = calls.safeSetItem[0];
  assert.equal(key, 'kw_keuFilterPrefs');
  assert.deepEqual(JSON.parse(json), {
    tipe: 'income', kat: 'Gaji', sub: 'Bulanan', acc: 'acc1', method: 'tunai', search: 'bonus',
    periode: 'custom', from: '2026-07-01', to: '2026-07-31',
  });
});

test('saveKeuFilterPrefs — safeSetItem lempar error -> ditangkap diam2, tidak melempar ke pemanggil', () => {
  const { ctx } = makeCtx({ extraGlobals: { safeSetItem: () => { throw new Error('quota penuh'); }, console: { error: () => {}, log: () => {}, warn: () => {} } } });
  assert.doesNotThrow(() => ctx.saveKeuFilterPrefs());
});

// ---------- loadKeuFilterPrefsIntoDOM ----------

function makeLocalStorage(prefsObj) {
  return { getItem: (k) => (k === 'kw_keuFilterPrefs' ? JSON.stringify(prefsObj) : null) };
}

test('loadKeuFilterPrefsIntoDOM — tidak ada prefs tersimpan -> field DOM tidak disentuh', () => {
  const { ctx, fakeDocument } = makeCtx({
    extraGlobals: { localStorage: { getItem: () => null } },
    domInitial: { kfTipe: { value: 'semua' } },
  });
  ctx.loadKeuFilterPrefsIntoDOM();
  assert.equal(fakeDocument.getElementById('kfTipe').value, 'semua');
});

test('loadKeuFilterPrefsIntoDOM — prefs ada -> field kf* & kfSearch terisi, panel filter terbuka krn ada filter aktif', () => {
  const prefs = { tipe: 'income', kat: 'Gaji', sub: 'semua', acc: 'semua', method: 'semua', search: '', periode: 'bulan' };
  const { ctx, fakeDocument } = makeCtx({
    extraGlobals: { localStorage: makeLocalStorage(prefs) },
    domInitial: { keuFilterPanel: { style: {} } },
  });
  ctx.loadKeuFilterPrefsIntoDOM();
  assert.equal(fakeDocument.getElementById('kfTipe').value, 'income');
  assert.equal(fakeDocument.getElementById('kfKat').value, 'Gaji');
  assert.equal(fakeDocument.getElementById('keuFilterPanel').style.display, 'block');
});

test('loadKeuFilterPrefsIntoDOM — periode "custom" -> txListCustomRange ditampilkan & from/to terisi', () => {
  const prefs = { tipe: 'semua', kat: 'semua', sub: 'semua', acc: 'semua', method: 'semua', search: '', periode: 'custom', from: '2026-07-01', to: '2026-07-10' };
  const { ctx, fakeDocument } = makeCtx({
    extraGlobals: { localStorage: makeLocalStorage(prefs) },
    domInitial: { txListCustomRange: { style: {} }, txListFrom: {}, txListTo: {} },
  });
  ctx.loadKeuFilterPrefsIntoDOM();
  assert.equal(fakeDocument.getElementById('txListCustomRange').style.display, 'block');
  assert.equal(fakeDocument.getElementById('txListFrom').value, '2026-07-01');
  assert.equal(fakeDocument.getElementById('txListTo').value, '2026-07-10');
});

test('loadKeuFilterPrefsIntoDOM — periode bukan "custom" -> txListCustomRange disembunyikan', () => {
  const prefs = { tipe: 'semua', kat: 'semua', sub: 'semua', acc: 'semua', method: 'semua', search: '', periode: 'minggu' };
  const { ctx, fakeDocument } = makeCtx({
    extraGlobals: { localStorage: makeLocalStorage(prefs) },
    domInitial: { txListCustomRange: { style: {} } },
  });
  ctx.loadKeuFilterPrefsIntoDOM();
  assert.equal(fakeDocument.getElementById('txListCustomRange').style.display, 'none');
});

test('loadKeuFilterPrefsIntoDOM — tidak ada filter aktif & search kosong -> panel filter TIDAK dipaksa terbuka', () => {
  const prefs = { tipe: 'semua', kat: 'semua', sub: 'semua', acc: 'semua', method: 'semua', search: '', periode: 'bulan' };
  const { ctx, fakeDocument } = makeCtx({
    extraGlobals: { localStorage: makeLocalStorage(prefs) },
    domInitial: { keuFilterPanel: { style: { display: 'none' } } },
  });
  ctx.loadKeuFilterPrefsIntoDOM();
  assert.equal(fakeDocument.getElementById('keuFilterPanel').style.display, 'none');
});

test('loadKeuFilterPrefsIntoDOM — hanya jalan SEKALI (guard _keuFilterPrefsLoaded): panggilan ke-2 tidak baca localStorage lagi', () => {
  let getItemCalls = 0;
  const prefs = { tipe: 'income', kat: 'semua', sub: 'semua', acc: 'semua', method: 'semua', search: '', periode: 'bulan' };
  const { ctx, fakeDocument, getVar } = makeCtx({
    extraGlobals: { localStorage: { getItem: () => { getItemCalls++; return JSON.stringify(prefs); } } },
  });
  ctx.loadKeuFilterPrefsIntoDOM();
  assert.equal(getItemCalls, 1);
  assert.equal(getVar('_keuFilterPrefsLoaded'), true);
  fakeDocument.getElementById('kfTipe').value = 'semua'; // ubah manual buat pastikan panggilan ke-2 tidak menimpa lagi
  ctx.loadKeuFilterPrefsIntoDOM();
  assert.equal(getItemCalls, 1); // tidak bertambah
  assert.equal(fakeDocument.getElementById('kfTipe').value, 'semua'); // tidak ditimpa balik ke 'income'
});

// ---------- updateKfBadge ----------

test('updateKfBadge — tidak ada filter aktif -> teks tombol tanpa angka', () => {
  const { ctx, fakeDocument } = makeCtx({ domInitial: { kfToggleBtn: {} } });
  ctx.updateKfBadge();
  assert.equal(fakeDocument.getElementById('kfToggleBtn').textContent, '🔍 Filter');
});

test('updateKfBadge — ada 3 filter aktif (bukan "semua"/kosong) -> tampilkan hitungan', () => {
  const { ctx, fakeDocument } = makeCtx({
    domInitial: {
      kfToggleBtn: {}, kfTipe: { value: 'income' }, kfKat: { value: 'Gaji' },
      kfSearch: { value: 'bonus' },
    },
  });
  ctx.updateKfBadge();
  assert.equal(fakeDocument.getElementById('kfToggleBtn').textContent, '🔍 Filter (3)');
});

test('updateKfBadge — tombol tidak ada di DOM -> tidak crash', () => {
  const noBtnDoc = { getElementById: (id) => (id === 'kfToggleBtn' ? null : createFakeElement()), querySelectorAll: () => [] };
  const local = loadSource(['filter-laporan.js'], { document: noBtnDoc, D: { accounts: [] } });
  assert.doesNotThrow(() => local.updateKfBadge());
});

// ---------- goToList ----------

function makeGoToListCtx(extra = {}, selects = {}) {
  const timer = makeTimerGlobals();
  const scrollCalls = [];
  const targetEl = createFakeElement({
    scrollIntoView: (opts) => scrollCalls.push(opts),
    offsetWidth: 0,
  });
  const navItems = [0, 1, 2, 3].map((i) => createFakeElement({ _navIdx: i }));
  const shopTabs = [0, 1, 2, 3, 4].map((i) => createFakeElement({ _shopIdx: i }));
  const cnTabs = [0, 1].map((i) => createFakeElement({ _cnIdx: i }));
  const pageCalls = [];
  const shopCalls = [];
  const cnCalls = [];
  const { ctx, calls } = makeCtx({
    domInitial: { myTarget: targetEl },
    selects,
    queryGroups: {
      '.nav-item': navItems,
      '#page-shop .cn-tab': shopTabs,
      '#page-carnotes .cn-tab': cnTabs,
    },
    extraGlobals: {
      setTimeout: timer.setTimeout, clearTimeout: timer.clearTimeout,
      showPage: (name, el) => pageCalls.push([name, el]),
      setShopTab: (name, el) => shopCalls.push([name, el]),
      setCnTab: (name, el) => cnCalls.push([name, el]),
      ...extra,
    },
  });
  return { ctx, calls, timer, scrollCalls, targetEl, navItems, shopTabs, cnTabs, pageCalls, shopCalls, cnCalls };
}

test('goToList — tanpa pageName/tab: scroll+flash-highlight dijadwalkan dgn delay 0ms', () => {
  const { ctx, timer, scrollCalls, targetEl } = makeGoToListCtx();
  ctx.goToList('myTarget');
  assert.equal(timer.calls.setTimeout.length, 1);
  assert.equal(timer.calls.setTimeout[0].ms, 0);
  timer.calls.setTimeout[0].fn();
  assert.deepEqual(plain(scrollCalls), [{ behavior: 'smooth', block: 'start' }]);
  assert.equal(targetEl.classList.contains('flash-highlight'), true);
  assert.equal(timer.calls.setTimeout.length, 2);
  assert.equal(timer.calls.setTimeout[1].ms, 1200);
  timer.calls.setTimeout[1].fn();
  assert.equal(targetEl.classList.contains('flash-highlight'), false);
});

test('goToList — dgn pageName & navIdx: showPage dipanggil dgn elemen nav yg benar, delay scroll 150ms', () => {
  const { ctx, timer, pageCalls, navItems } = makeGoToListCtx();
  ctx.goToList('myTarget', 'keuangan', 2);
  assert.equal(pageCalls.length, 1);
  assert.equal(pageCalls[0][0], 'keuangan');
  assert.equal(pageCalls[0][1], navItems[2]);
  assert.equal(timer.calls.setTimeout[0].ms, 150);
});

test('goToList — shopTabName "etalase" -> setShopTab dgn tab index 1', () => {
  const { ctx, shopCalls, shopTabs } = makeGoToListCtx();
  ctx.goToList('myTarget', null, undefined, 'etalase');
  assert.equal(shopCalls.length, 1);
  assert.equal(shopCalls[0][0], 'etalase');
  assert.equal(shopCalls[0][1], shopTabs[1]);
});

test('goToList — shopTabName tidak dikenal -> fallback index 0', () => {
  const { ctx, shopCalls, shopTabs } = makeGoToListCtx();
  ctx.goToList('myTarget', null, undefined, 'lainnya');
  assert.equal(shopCalls[0][1], shopTabs[0]);
});

test('goToList — cnTabName "servis" -> setCnTab dgn tab index 1, cnTabName lain -> index 0', () => {
  const { ctx, cnCalls, cnTabs } = makeGoToListCtx();
  ctx.goToList('myTarget', null, undefined, undefined, 'servis');
  assert.equal(cnCalls[0][1], cnTabs[1]);
});

test('goToList — target elemen tidak ada -> tidak menjadwalkan setTimeout apa pun (return awal)', () => {
  const { ctx, timer } = makeGoToListCtx({}, { 'elemen-yang-tidak-ada': null });
  ctx.goToList('elemen-yang-tidak-ada');
  assert.equal(timer.calls.setTimeout.length, 0);
});

// ---------- showFilteredTx ----------

function makeFtxButton() {
  return createFakeElement();
}

function makeFtxDocument(prefilled = {}) {
  const els = new Map();
  function ensure(id, init) { if (!els.has(id)) els.set(id, createFakeElement(init)); return els.get(id); }
  ['filterTxTitle', 'filterTxSummary'].forEach((id) => ensure(id));
  ensure('filterTxList', {
    insertAdjacentElement(pos, el) { els.set(el.id, el); },
    insertAdjacentHTML(pos, html) { this.innerHTML += html; },
  });
  Object.entries(prefilled).forEach(([id, val]) => Object.assign(ensure(id), val));
  return {
    getElementById: (id) => (els.has(id) ? els.get(id) : null),
    createElement: () => {
      const btn = makeFtxButton();
      const wrap = createFakeElement({ querySelector: (sel) => (sel === 'button' ? btn : null) });
      wrap.button = btn;
      return wrap;
    },
  };
}

function makeShowFtxCtx({ D = {}, nowIso = '2026-07-11T10:00:00.000Z', extraGlobals = {} } = {}) {
  const fakeDocument = makeFtxDocument();
  const calls = { openModal: [] };
  const ctx = loadSource(['filter-laporan.js'], {
    document: fakeDocument,
    Date: makeFakeDate(nowIso),
    D: { accounts: [], transactions: [], ...D },
    curMonth: 6, curYear: 2026,
    getRange: () => ({ from: new Date('2026-07-01T00:00:00.000Z'), to: new Date('2026-07-31T23:59:59.999Z') }),
    fmt: (n) => 'RP' + n,
    txHTML: (t) => `<i>${t.id}</i>`,
    openModal: (id) => calls.openModal.push(id),
    ...extraGlobals,
  });
  return { ctx, fakeDocument, calls };
}

test('showFilteredTx — tidak ada transaksi -> tampilkan empty state, modal tetap dibuka', () => {
  const { ctx, fakeDocument, calls } = makeShowFtxCtx({ D: { transactions: [] } });
  ctx.showFilteredTx('dashboard', 'all', 'Bulan Ini');
  assert.match(fakeDocument.getElementById('filterTxList').innerHTML, /Tidak ada transaksi/);
  assert.equal(fakeDocument.getElementById('filterTxTitle').textContent, 'Bulan Ini');
  assert.deepEqual(calls.openModal, ['filterTxModal']);
});

test('showFilteredTx — scope "dashboard": hanya transaksi bulan & tahun berjalan (dari Date "sekarang")', () => {
  const { ctx, fakeDocument } = makeShowFtxCtx({
    D: {
      transactions: [
        tx({ id: 'a', type: 'income', amount: 100000, date: '2026-07-05' }),
        tx({ id: 'b', type: 'expense', amount: 30000, date: '2026-07-06' }),
        tx({ id: 'c', type: 'income', amount: 999999, date: '2026-06-01' }), // bulan lalu
      ],
    },
  });
  ctx.showFilteredTx('dashboard', 'all', 'Ringkasan');
  const html = fakeDocument.getElementById('filterTxList').innerHTML;
  assert.match(html, /<i>a<\/i>/);
  assert.match(html, /<i>b<\/i>/);
  assert.doesNotMatch(html, /<i>c<\/i>/);
  assert.equal(fakeDocument.getElementById('filterTxSummary').textContent, '2 transaksi · Total RP70000');
});

test('showFilteredTx — type "income" hanya ambil transaksi income, "expense" hanya expense', () => {
  const { ctx, fakeDocument } = makeShowFtxCtx({
    D: {
      transactions: [
        tx({ id: 'inc', type: 'income', amount: 50000, date: '2026-07-05' }),
        tx({ id: 'exp', type: 'expense', amount: 20000, date: '2026-07-06' }),
      ],
    },
  });
  ctx.showFilteredTx('dashboard', 'income', 'Pemasukan');
  let html = fakeDocument.getElementById('filterTxList').innerHTML;
  assert.match(html, /<i>inc<\/i>/);
  assert.doesNotMatch(html, /<i>exp<\/i>/);

  const { ctx: ctx2, fakeDocument: doc2 } = makeShowFtxCtx({
    D: {
      transactions: [
        tx({ id: 'inc', type: 'income', amount: 50000, date: '2026-07-05' }),
        tx({ id: 'exp', type: 'expense', amount: 20000, date: '2026-07-06' }),
      ],
    },
  });
  ctx2.showFilteredTx('dashboard', 'expense', 'Pengeluaran');
  html = doc2.getElementById('filterTxList').innerHTML;
  assert.doesNotMatch(html, /<i>inc<\/i>/);
  assert.match(html, /<i>exp<\/i>/);
});

test('showFilteredTx — scope "keuangan": pakai getKeuFilters() (DOM), hanya bulan curMonth/curYear', () => {
  const fakeDocument = makeFtxDocument({
    kfTipe: { value: 'semua' }, kfKat: { value: 'semua' }, kfSub: { value: 'semua' },
    kfAcc: { value: 'semua' }, kfMethod: { value: 'semua' },
  });
  const ctx = loadSource(['filter-laporan.js'], {
    document: fakeDocument,
    Date: makeFakeDate('2026-07-11T10:00:00.000Z'),
    D: {
      accounts: [], transactions: [
        tx({ id: 'in-bulan', date: '2026-07-05', amount: 1000 }),
        tx({ id: 'luar-bulan', date: '2026-08-01', amount: 5000 }),
      ],
    },
    curMonth: 6, curYear: 2026,
    fmt: (n) => 'RP' + n,
    txHTML: (t) => `<i>${t.id}</i>`,
    openModal: () => {},
  });
  ctx.showFilteredTx('keuangan', 'all', 'Bulan Berjalan');
  const html = fakeDocument.getElementById('filterTxList').innerHTML;
  assert.match(html, /<i>in-bulan<\/i>/);
  assert.doesNotMatch(html, /<i>luar-bulan<\/i>/);
});

test('showFilteredTx — scope "laporan": pakai getRange() & getLaporanFilters(), transfer selalu dibuang', () => {
  const { ctx, fakeDocument } = makeShowFtxCtx({
    D: {
      transactions: [
        tx({ id: 'dalam', date: '2026-07-15', type: 'expense' }),
        tx({ id: 'transfer', date: '2026-07-15', type: 'transfer_in' }),
        tx({ id: 'luar', date: '2026-08-15', type: 'expense' }),
      ],
    },
  });
  ctx.showFilteredTx('laporan', 'all', 'Laporan Juli');
  const html = fakeDocument.getElementById('filterTxList').innerHTML;
  assert.match(html, /<i>dalam<\/i>/);
  assert.doesNotMatch(html, /<i>transfer<\/i>/);
  assert.doesNotMatch(html, /<i>luar<\/i>/);
});

test('showFilteredTx — hasil diurutkan dari tanggal TERBARU ke TERLAMA', () => {
  const { ctx, fakeDocument } = makeShowFtxCtx({
    D: {
      transactions: [
        tx({ id: 'lama', date: '2026-07-01' }),
        tx({ id: 'baru', date: '2026-07-20' }),
        tx({ id: 'tengah', date: '2026-07-10' }),
      ],
    },
  });
  ctx.showFilteredTx('dashboard', 'all', 'x');
  const html = fakeDocument.getElementById('filterTxList').innerHTML;
  const order = ['baru', 'tengah', 'lama'].map((id) => html.indexOf(`<i>${id}</i>`));
  assert.ok(order[0] < order[1] && order[1] < order[2]);
});

test('showFilteredTx — >100 transaksi: batasi 100 tampil awal & tombol "tampilkan lebih banyak" muncul, klik menampilkan sisanya', () => {
  const txs = [];
  for (let i = 0; i < 130; i++) {
    txs.push(tx({ id: `t${i}`, date: `2026-07-${String((i % 28) + 1).padStart(2, '0')}`, amount: 1000, type: 'income' }));
  }
  const { ctx, fakeDocument } = makeShowFtxCtx({ D: { transactions: txs } });
  ctx.showFilteredTx('dashboard', 'all', 'Semua');
  const wrap = fakeDocument.getElementById('filterTxLoadMoreWrap');
  assert.equal(wrap.style.display, 'block');
  assert.match(wrap.innerHTML, /30 lagi/);
  let html = fakeDocument.getElementById('filterTxList').innerHTML;
  assert.equal((html.match(/<i>/g) || []).length, 100);

  wrap.button.onclick();
  html = fakeDocument.getElementById('filterTxList').innerHTML;
  assert.equal((html.match(/<i>/g) || []).length, 130);
  assert.equal(wrap.style.display, 'none');
});
