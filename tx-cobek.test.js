'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadSource } = require('./helpers/loadSource');

// isShopStockCatName (tx-cobek.js) adalah fungsi murni (tidak baca/tulis
// DOM, cuma baca D.categories) yang dipakai updateTxVehiclePanels() di
// transaksi.js buat mendeteksi kapan panel Stok/Penjualan Shop/Shop harus
// muncul di form Transaksi. Sebelumnya nol test (lihat daftar modul tanpa
// test di CLAUDE.md bagian ke-13) -- dipilih sbg saran RINGAN berikutnya
// krn file-nya kecil (28 baris) & logic-nya murni, tanpa perlu mock DOM.
function loadFn(D) {
  const ctx = loadSource(['tx-cobek.js'], { D });
  return ctx.isShopStockCatName;
}

function baseD(overrides = {}) {
  return { categories: { income: [], expense: [] }, ...overrides };
}

test('isShopStockCatName — nama kategori mengandung "shop" (case-insensitive) => true, tanpa perlu D.categories', () => {
  const fn = loadFn(baseD());
  assert.equal(fn('Shop', ''), true);
  assert.equal(fn('SHOP BATU', ''), true);
  assert.equal(fn('jual shop', ''), true);
});

test('isShopStockCatName — nama kategori mengandung "shop" (case-insensitive) => true', () => {
  const fn = loadFn(baseD());
  assert.equal(fn('Shop', ''), true);
  assert.equal(fn('My Shop', ''), true);
});

test('isShopStockCatName — nama SUBkategori yang mengandung shop/shop juga => true, walau nama kategori induk tidak cocok', () => {
  const fn = loadFn(baseD());
  assert.equal(fn('Bisnis Lain', 'Stok Shop'), true);
  assert.equal(fn('Bisnis Lain', 'Penjualan Shop'), true);
});

test('isShopStockCatName — nama kategori & sub sama sekali tidak cocok, dan tidak ketemu di D.categories => false', () => {
  const fn = loadFn(baseD());
  assert.equal(fn('Transport', 'Bensin'), false);
});

test('isShopStockCatName — catName/subName undefined/null tidak bikin error (fallback ke string kosong)', () => {
  const fn = loadFn(baseD());
  assert.equal(fn(undefined, undefined), false);
  assert.equal(fn(null, null), false);
  assert.equal(fn(), false);
});

test('isShopStockCatName — BUGFIX-style: kategori/sub sudah di-rename user (mis. "Shop" -> "Toko Batu"), tapi sub.id masih "sub_cb_cobek" => tetap true lewat fallback ID internal', () => {
  const D = baseD({
    categories: {
      income: [],
      expense: [
        { id: 'cat1', name: 'Toko Batu', subs: [
          { id: 'sub_cb_cobek', name: 'Stok Batu' },
        ] },
      ],
    },
  });
  const fn = loadFn(D);
  // Nama kategori & sub SENGAJA tidak mengandung kata "shop"/"shop" sama
  // sekali -- satu-satunya jalan ketemu adalah lewat sub.id yang stabil.
  assert.equal(fn('Toko Batu', 'Stok Batu'), true);
});

test('isShopStockCatName — sub.id "sub_cbb_cobek" (varian penjualan) juga dianggap cocok lewat fallback ID', () => {
  const D = baseD({
    categories: {
      income: [
        { id: 'cat2', name: 'Pemasukan Lain', subs: [
          { id: 'sub_cbb_cobek', name: 'Hasil Jualan' },
        ] },
      ],
      expense: [],
    },
  });
  const fn = loadFn(D);
  assert.equal(fn('Pemasukan Lain', 'Hasil Jualan'), true);
});

test('isShopStockCatName — kategori ketemu by name tapi sub.id BUKAN sub_cb_cobek/sub_cbb_cobek => false', () => {
  const D = baseD({
    categories: {
      income: [],
      expense: [
        { id: 'cat1', name: 'Toko Batu', subs: [
          { id: 'sub_lainnya', name: 'Ongkos Kirim' },
        ] },
      ],
    },
  });
  const fn = loadFn(D);
  assert.equal(fn('Toko Batu', 'Ongkos Kirim'), false);
});

test('isShopStockCatName — catName ketemu tapi subName tidak ada di daftar subs kategori itu => false (tidak error)', () => {
  const D = baseD({
    categories: {
      income: [],
      expense: [
        { id: 'cat1', name: 'Toko Batu', subs: [
          { id: 'sub_cb_cobek', name: 'Stok Batu' },
        ] },
      ],
    },
  });
  const fn = loadFn(D);
  assert.equal(fn('Toko Batu', 'Sub Yang Tidak Ada'), false);
});

test('isShopStockCatName — fallback lewat ID juga jalan utk kategori di D.categories.income (bukan cuma expense)', () => {
  const D = baseD({
    categories: {
      income: [
        { id: 'catI', name: 'Toko Serba Ada', subs: [
          { id: 'sub_cbb_cobek', name: 'Hasil Jualan' },
        ] },
      ],
      expense: [],
    },
  });
  const fn = loadFn(D);
  // Nama kategori & sub SENGAJA tidak mengandung "shop"/"shop" -- satu2nya
  // jalan ketemu adalah lewat pencarian di D.categories.income + fallback ID.
  assert.equal(fn('Toko Serba Ada', 'Hasil Jualan'), true);
});
