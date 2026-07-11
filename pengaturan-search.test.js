'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadSource } = require('./helpers/loadSource');
const { createFakeDocument, createFakeElement } = require('./helpers/fakeDom');

// pengaturan-search.js — Domain Pencarian Pengaturan (toggleStgGroup,
// toggleSingleCardCollapse, stgSearch) + 1 listener keydown top-level.
// Sebelumnya nol test (tidak masuk daftar "sesi berikutnya" manapun di
// CLAUDE.md -- kelewat krn dipindah belakangan dari
// features-helpers-global-security.js v73). File TERKECIL yg masih nol test
// (72 baris, lebih kecil dari filter-laporan.js/kasir.js yg 220-an), murni
// DOM (tidak bergantung ke `D`), jadi dipilih duluan mengikuti pola
// ringan->berat yg sudah berjalan.
//
// fakeDocument.getElementById() SELALU auto-vivifikasi (lihat catatan
// profil-pengaturan.test.js bagian ke-31) -- utk nge-tes cabang
// `if(!g)return;`/`if(!c)return;` di toggleStgGroup/toggleSingleCardCollapse,
// getElementById di-override manual biar bisa balik null utk id tertentu.
//
// document.addEventListener (listener keydown top-level) tidak ada di
// fakeDocument bawaan -- disuntik manual (pola sama dgn fakeWindow di
// error-handler.test.js) supaya handler-nya bisa ditangkap & dipanggil
// langsung dari test tanpa event loop asli.

function loadPengaturanSearch(domInitial = {}, queryGroups = {}) {
  const fakeDocument = createFakeDocument(domInitial, queryGroups);
  const listeners = {};
  fakeDocument.addEventListener = (evt, fn) => { listeners[evt] = fn; };
  const timeouts = [];
  const ctx = loadSource(['pengaturan-search.js'], {
    document: fakeDocument,
    setTimeout: (fn, ms) => { timeouts.push({ fn, ms }); return timeouts.length; },
  });
  return { ctx, fakeDocument, listeners, timeouts };
}

// ---------- toggleStgGroup ----------

test('toggleStgGroup — id tidak ditemukan (getElementById balik null) => tidak error, tidak ada efek', () => {
  const { ctx, fakeDocument } = loadPengaturanSearch();
  const original = fakeDocument.getElementById;
  fakeDocument.getElementById = (id) => (id === 'missing' ? null : original(id));
  assert.doesNotThrow(() => ctx.toggleStgGroup('missing'));
});

test('toggleStgGroup — grup tertutup dibuka: kelas "open" bertambah, aria-expanded="true" di head', () => {
  const head = createFakeElement();
  const setAttrCalls = [];
  head.setAttribute = (name, val) => setAttrCalls.push([name, val]);
  const group = createFakeElement({ querySelector: (sel) => (sel === '.stg-group-head' ? head : null) });
  const { ctx, fakeDocument } = loadPengaturanSearch();
  fakeDocument.getElementById = (id) => (id === 'grp1' ? group : createFakeElement());

  ctx.toggleStgGroup('grp1');

  assert.equal(group.classList.contains('open'), true);
  assert.deepEqual(setAttrCalls, [['aria-expanded', 'true']]);
});

test('toggleStgGroup — grup terbuka ditutup: kelas "open" hilang, aria-expanded="false"', () => {
  const head = createFakeElement();
  const setAttrCalls = [];
  head.setAttribute = (name, val) => setAttrCalls.push([name, val]);
  const group = createFakeElement({
    classList: ['open'],
    querySelector: (sel) => (sel === '.stg-group-head' ? head : null),
  });
  const { ctx, fakeDocument } = loadPengaturanSearch();
  fakeDocument.getElementById = () => group;

  ctx.toggleStgGroup('grp1');

  assert.equal(group.classList.contains('open'), false);
  assert.deepEqual(setAttrCalls, [['aria-expanded', 'false']]);
});

test('toggleStgGroup — head (.stg-group-head) tidak ada => tetap toggle kelas, tidak error krn setAttribute tidak dipanggil', () => {
  const group = createFakeElement({ querySelector: () => null });
  const { ctx, fakeDocument } = loadPengaturanSearch();
  fakeDocument.getElementById = () => group;

  assert.doesNotThrow(() => ctx.toggleStgGroup('grp1'));
  assert.equal(group.classList.contains('open'), true);
});

// ---------- toggleSingleCardCollapse ----------

test('toggleSingleCardCollapse — id tidak ditemukan => tidak error', () => {
  const { ctx, fakeDocument } = loadPengaturanSearch();
  fakeDocument.getElementById = () => null;
  assert.doesNotThrow(() => ctx.toggleSingleCardCollapse('missing'));
});

test('toggleSingleCardCollapse — tertutup dibuka: kelas "open" bertambah, aria-expanded="true" di .card-collapse-head', () => {
  const head = createFakeElement();
  const setAttrCalls = [];
  head.setAttribute = (name, val) => setAttrCalls.push([name, val]);
  const card = createFakeElement({ querySelector: (sel) => (sel === '.card-collapse-head' ? head : null) });
  const { ctx, fakeDocument } = loadPengaturanSearch();
  fakeDocument.getElementById = () => card;

  ctx.toggleSingleCardCollapse('c1');

  assert.equal(card.classList.contains('open'), true);
  assert.deepEqual(setAttrCalls, [['aria-expanded', 'true']]);
});

test('toggleSingleCardCollapse — head tidak ada => tetap toggle kelas, tidak error', () => {
  const card = createFakeElement({ querySelector: () => null });
  const { ctx, fakeDocument } = loadPengaturanSearch();
  fakeDocument.getElementById = () => card;

  assert.doesNotThrow(() => ctx.toggleSingleCardCollapse('c1'));
  assert.equal(card.classList.contains('open'), true);
});

// ---------- stgSearch ----------

const CARD_SELECTOR = '#page-settings .stg-group-body-inner .card';

test('stgSearch — query kosong => resultEl disembunyikan (display none), tidak mencari kartu', () => {
  const resultEl = createFakeElement({ style: { display: 'block' } });
  const { ctx, fakeDocument } = loadPengaturanSearch({ stgSearchResult: resultEl }, { [CARD_SELECTOR]: [] });

  assert.doesNotThrow(() => ctx.stgSearch('   '));
  assert.equal(resultEl.style.display, 'none');
});

test('stgSearch — resultEl tidak ada di DOM (query kosong) => tidak error', () => {
  const { ctx, fakeDocument } = loadPengaturanSearch({}, { [CARD_SELECTOR]: [] });
  fakeDocument.getElementById = (id) => (id === 'stgSearchResult' ? null : createFakeElement());
  assert.doesNotThrow(() => ctx.stgSearch(''));
});

// CATATAN: createFakeDocument({id: elemenBuatan}) melakukan
// Object.assign(elemenBaruAutoVivify, elemenBuatan) di dalam ensure() --
// artinya properti PRIMITIF (textContent/string) di-COPY nilainya ke objek
// LAIN, bukan objek yg sama persis dgn variabel lokal `resultEl` di test.
// Field OBJEK (style/classList) tetap sama by-reference jadi aman diakses
// dari variabel lokal, tapi utk textContent harus diambil ULANG lewat
// `fakeDocument.getElementById(...)` SETELAH stgSearch() dipanggil, baru
// nilai barunya kebaca.

test('stgSearch — tidak ada kartu yang cocok => pesan "Tidak ada pengaturan yang cocok"', () => {
  const cardA = createFakeElement({ textContent: 'Backup & Restore', closest: () => null });
  const { ctx, fakeDocument } = loadPengaturanSearch(
    { stgSearchResult: createFakeElement({ classList: ['u-dnone'] }) },
    { [CARD_SELECTOR]: [cardA] },
  );

  ctx.stgSearch('zzz-tidak-ketemu');
  const resultEl = fakeDocument.getElementById('stgSearchResult');

  assert.equal(resultEl.classList.contains('u-dnone'), false);
  assert.equal(resultEl.style.display, 'block');
  assert.match(resultEl.textContent, /Tidak ada pengaturan yang cocok/);
});

test('stgSearch — ada kartu cocok => pesan jumlah hasil & outline diberikan ke kartu', () => {
  const cardA = createFakeElement({ textContent: 'Ganti PIN Keamanan', closest: () => null });
  const cardB = createFakeElement({ textContent: 'Profil & Gaji', closest: () => null });
  const { ctx, fakeDocument } = loadPengaturanSearch(
    { stgSearchResult: {} },
    { [CARD_SELECTOR]: [cardA, cardB] },
  );

  ctx.stgSearch('PIN');
  const resultEl = fakeDocument.getElementById('stgSearchResult');

  assert.match(resultEl.textContent, /✅ 1 hasil ditemukan/);
  assert.equal(cardA.style.outline, '2px solid var(--accent)');
  assert.equal(cardA.style.outlineOffset, '3px');
  assert.equal(cardB.style.outline, undefined);
});

test('stgSearch — pencarian case-insensitive & abaikan spasi di awal/akhir', () => {
  const card = createFakeElement({ textContent: 'Ganti PIN Keamanan', closest: () => null });
  const { ctx, fakeDocument } = loadPengaturanSearch({ stgSearchResult: {} }, { [CARD_SELECTOR]: [card] });

  ctx.stgSearch('  pin keamanan  ');
  const resultEl = fakeDocument.getElementById('stgSearchResult');

  assert.match(resultEl.textContent, /✅ 1 hasil ditemukan/);
});

test('stgSearch — kartu cocok di dalam grup TERTUTUP => grup ikut dibuka', () => {
  const groupHead = createFakeElement();
  groupHead.setAttribute = () => {};
  const group = createFakeElement({
    id: 'grpKeamanan',
    querySelector: (sel) => (sel === '.stg-group-head' ? groupHead : null),
  });
  const card = createFakeElement({ textContent: 'Ganti PIN', closest: (sel) => (sel === '.stg-group' ? group : null) });
  const { ctx, fakeDocument } = loadPengaturanSearch({ stgSearchResult: {} }, { [CARD_SELECTOR]: [card] });
  fakeDocument.getElementById = (id) => (id === 'grpKeamanan' ? group : createFakeElement());

  ctx.stgSearch('PIN');

  assert.equal(group.classList.contains('open'), true);
});

test('stgSearch — kartu cocok di dalam grup yang SUDAH terbuka => tidak ikut ke-toggle jadi tertutup', () => {
  const group = createFakeElement({ id: 'grpKeamanan', classList: ['open'], querySelector: () => null });
  const card = createFakeElement({ textContent: 'Ganti PIN', closest: (sel) => (sel === '.stg-group' ? group : null) });
  const { ctx, fakeDocument } = loadPengaturanSearch({ stgSearchResult: {} }, { [CARD_SELECTOR]: [card] });
  fakeDocument.getElementById = (id) => (id === 'grpKeamanan' ? group : createFakeElement());

  ctx.stgSearch('PIN');

  assert.equal(group.classList.contains('open'), true);
});

test('stgSearch — kartu cocok tanpa grup pembungkus (closest balik null) => tidak error', () => {
  const card = createFakeElement({ textContent: 'Kartu Mandiri', closest: () => null });
  const { ctx } = loadPengaturanSearch({ stgSearchResult: {} }, { [CARD_SELECTOR]: [card] });

  assert.doesNotThrow(() => ctx.stgSearch('mandiri'));
});

test('stgSearch — kartu cocok yg juga card-collapse & belum open => toggleSingleCardCollapse ikut jalan', () => {
  const cardHead = createFakeElement();
  cardHead.setAttribute = () => {};
  const card = createFakeElement({
    id: 'cardBeranda',
    classList: ['card-collapse'],
    textContent: 'Kartu di Beranda',
    closest: () => null,
    querySelector: (sel) => (sel === '.card-collapse-head' ? cardHead : null),
  });
  const { ctx, fakeDocument } = loadPengaturanSearch({ stgSearchResult: {} }, { [CARD_SELECTOR]: [card] });
  fakeDocument.getElementById = (id) => (id === 'cardBeranda' ? card : createFakeElement());

  ctx.stgSearch('beranda');

  assert.equal(card.classList.contains('open'), true);
});

test('stgSearch — highlight pencarian sebelumnya dibersihkan (outline direset) sebelum pencarian baru', () => {
  const card = createFakeElement({ textContent: 'Ganti PIN', closest: () => null });
  const { ctx } = loadPengaturanSearch({ stgSearchResult: {} }, { [CARD_SELECTOR]: [card] });

  ctx.stgSearch('PIN');
  assert.equal(card.style.outline, '2px solid var(--accent)');

  ctx.stgSearch('zzz-tidak-ketemu');
  assert.equal(card.style.outline, '');
  assert.equal(card.style.outlineOffset, '');
});

test('stgSearch — hasil pertama (index 0) menjadwalkan scrollIntoView via setTimeout', () => {
  const scrollCalls = [];
  const card = createFakeElement({
    textContent: 'Ganti PIN',
    closest: () => null,
    scrollIntoView: (opts) => scrollCalls.push(opts),
  });
  const { ctx, timeouts } = loadPengaturanSearch({ stgSearchResult: {} }, { [CARD_SELECTOR]: [card] });

  ctx.stgSearch('PIN');

  assert.equal(timeouts.length, 1);
  assert.equal(timeouts[0].ms, 120);
  timeouts[0].fn();
  assert.equal(scrollCalls.length, 1);
  assert.equal(scrollCalls[0].behavior, 'smooth');
  assert.equal(scrollCalls[0].block, 'center');
});

// ---------- keydown listener top-level ----------

test('keydown listener — Enter di .stg-group-head => preventDefault & head.click() dipanggil', () => {
  const clickCalls = [];
  const preventCalls = [];
  const head = { closest: (sel) => (sel === '.stg-group-head,.card-collapse-head' ? head : null), click: () => clickCalls.push(1) };
  const { listeners } = loadPengaturanSearch();

  listeners.keydown({ key: 'Enter', target: head, preventDefault: () => preventCalls.push(1) });

  assert.equal(clickCalls.length, 1);
  assert.equal(preventCalls.length, 1);
});

test('keydown listener — Spasi (" ") di .card-collapse-head => head.click() dipanggil', () => {
  const clickCalls = [];
  const head = { closest: () => head, click: () => clickCalls.push(1) };
  const { listeners } = loadPengaturanSearch();

  listeners.keydown({ key: ' ', target: head, preventDefault: () => {} });

  assert.equal(clickCalls.length, 1);
});

test('keydown listener — tombol lain (mis. "Tab") => tidak melakukan apa-apa', () => {
  const clickCalls = [];
  const head = { closest: () => head, click: () => clickCalls.push(1) };
  const { listeners } = loadPengaturanSearch();

  listeners.keydown({ key: 'Tab', target: head, preventDefault: () => { throw new Error('tidak boleh dipanggil'); } });

  assert.equal(clickCalls.length, 0);
});

test('keydown listener — target tidak berada di dalam head yang relevan (closest balik null) => tidak melakukan apa-apa', () => {
  const target = { closest: () => null };
  const { listeners } = loadPengaturanSearch();

  assert.doesNotThrow(() => listeners.keydown({ key: 'Enter', target, preventDefault: () => { throw new Error('tidak boleh dipanggil'); } }));
});

test('keydown listener — e.target tanpa method closest (mis. bukan elemen) => tidak error (guard e.target.closest&&...)', () => {
  const { listeners } = loadPengaturanSearch();
  assert.doesNotThrow(() => listeners.keydown({ key: 'Enter', target: {}, preventDefault: () => {} }));
});
