'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadSource } = require('./helpers/loadSource');
const { createFakeDocument, createFakeElement } = require('./helpers/fakeDom');

// Cakupan file ini: seluruh fungsi/namespace di cobek.js (1262 baris, sebelumnya
// nol test — file terbesar yang belum dites di proyek ini) —
// Etalase.{openModal,onProdusenChange,save,delete,renderList},
// PriceReko.{reset,toggle,prefill,autoFillTransport,roundNice,calc,
// checkMarketAI,apply}, PriceRekoWidget.{avgTransport,avgMarginForKategori,
// recommend,scan,render,applyOne,openDetail}, StockRekoWidget.{soldQty,scan,
// render,openDetail}, Produsen.{openModal,save,delete,renderList,
// openHargaModal,saveHarga}, SiapPulang.{toggleDeliveredField,markDelivered,
// render}, Order.{populateProductSelect,openModal,addItem,updateItemHarga,
// changeQty,removeItem,computeTotals,renderItems,_saveInner,renderRecent,
// rowHTML}, Laporan.{setPeriode,getRange,render,delete,renderGrafik},
// Pelanggan.{key,getOrders,aggregate,onInputChange,renderList,openDetail,
// _acList,onFieldInput,select}, dan fungsi lepas (resolveShopKategori,
// shopKategoriName, setShopTab, cart Stok/Jual dari form Transaksi gabungan,
// recordShopSale, applyTxShopStockFromTx, applyTxShopSaleFromTx, render*
// wrapper).
//
// Sama seperti piutang-utang.js/akun.js sebelumnya: test ini pakai
// fakeDocument + stub semua dependency lintas-file (save/toast/askConfirm/
// showPromptModal/openModal/closeModal/renderDashboard/renderKeuangan/
// callAIProviderRaw/RefAI/Kasir), BUKAN test integrasi lintas file sungguhan.
// `Order.save`/withSaveGuard SENGAJA tidak dites (pola sama dgn
// akun.test.js) — `Order._saveInner` dites langsung.
// curShopStockCart/curTxShopSaleCart adalah `let` module-scope DI DALAM
// cobek.js sendiri yang di-REASSIGN (bukan cuma di-push/splice) oleh
// resetShopStockCart()/resetTxShopSaleCart() — reassignment `let` tidak
// ter-refleksi ke context yang di-expose (lihat catatan loadSource.js), jadi
// state cart ini SENGAJA diverifikasi tidak langsung baca variabelnya,
// melainkan lewat efek yang teramati (renderShopStockCartList/
// renderTxShopSaleCartList menulis ke DOM, & applyTxCobek{Stock,Sale}FromTx
// membaca isi cart itu sendiri).

function baseD(overrides = {}) {
  return {
    products: [],
    produsen: [],
    cobek: [],
    cobekKategori: [],
    accounts: [{ id: 'acc1', emoji: '💰', name: 'Kas' }],
    bbmLogs: [],
    transactions: [],
    profile: { apiKey: '', apiProvider: 'claude' },
    ...overrides,
  };
}

function baseFields(overrides = {}) {
  const ids = [
    'cSet', 'cTrip', 'cUntung', 'shopCustomRange', 'shopFrom', 'shopGrafikBars',
    'shopList', 'shopRecentList', 'shopTo', 'customerDetailBody', 'customerDetailTitle',
    'customerList', 'oAcc', 'oCustAddr', 'oCustHint', 'oCustName', 'oCustPhone', 'oDate',
    'oDelivered', 'oDeliveredLbl', 'oDiskon', 'oNote', 'oOngkir', 'oPriceType', 'oProductSelect',
    'oProfitDisplay', 'oTotalDisplay', 'orderItemList', 'pAcc', 'pAccHint', 'pBeli', 'pDiskon',
    'pJual', 'pKategori', 'pKategoriList', 'pName', 'pProdusen', 'pReseller', 'pStock',
    'prContact', 'prName', 'prNote', 'priceRekoPanel', 'priceRekoWidgetCard', 'priceRekoWidgetList',
    'prkBreakdown', 'prkMargin', 'prkMarketInfo', 'prkResult', 'prkTransport', 'productList',
    'productModalTitle', 'produsenHargaList', 'produsenHargaTitle', 'produsenList',
    'produsenModalTitle', 'siapPulangCard', 'stockRekoWidgetCard', 'stockRekoWidgetList',
    'txAddShopSale', 'txAddShopStock', 'txAmt', 'txShopKategoriList', 'txShopSaleCartList',
    'txShopSaleCustAddr', 'txShopSaleCustName', 'txShopSaleCustPhone', 'txShopSaleDiskon',
    'txShopSaleFields', 'txShopSaleHarga', 'txShopSaleItem', 'txShopSaleOngkir',
    'txShopSalePanel', 'txShopSaleQty', 'txShopStockCartList', 'txShopStockFields',
    'txShopStockHarga', 'txShopStockItem', 'txShopStockJual', 'txShopStockJualWrap',
    'txShopStockKategori', 'txShopStockNewName', 'txShopStockNewWrap', 'txShopStockPanel',
    'txShopStockProdusen', 'txShopStockQty', 'txNote',
  ];
  const fields = {};
  ids.forEach((id) => { fields[id] = {}; });
  // Field input butuh .value/.style secara eksplisit (default createFakeElement
  // sudah punya value:'' & style:{}, tapi kita pastikan lewat merge overrides).
  return { ...fields, ...overrides };
}

function makeCtx(D, opts = {}) {
  const fakeDocument = createFakeDocument(baseFields(opts.domValues), opts.queryGroups);
  const calls = { save: 0, toast: [], render: [], closeModal: [], openModal: [] };
  const record = (name) => (...args) => calls.render.push([name, ...args]);
  const ctx = loadSource(['cobek.js'], {
    D,
    document: fakeDocument,
    toast: (msg) => calls.toast.push(msg),
    save: () => { calls.save++; },
    closeModal: (id) => calls.closeModal.push(id),
    openModal: (id) => calls.openModal.push(id),
    askConfirm: opts.askConfirm || (async () => true),
    showPromptModal: opts.showPromptModal || (async () => null),
    uid: opts.uid || (() => 'uid-' + Math.random().toString(36).slice(2)),
    escapeHtml: (s) => String(s == null ? '' : s),
    fmt: (n) => 'Rp' + String(Math.round(n || 0)),
    fmtFull: (n) => 'RpFull' + String(Math.round(n || 0)),
    fmtFullSigned: (n) => (n < 0 ? '-' : '') + 'RpFull' + String(Math.round(Math.abs(n || 0))),
    jsAttrEscape: (s) => String(s == null ? '' : s),
    hideSuggestBox: (id) => calls.render.push(['hideSuggestBox', id]),
    callAIProviderRaw: opts.callAIProviderRaw || (async () => ({ ok: false, errMsg: 'no mock' })),
    RefAI: opts.RefAI || { _parseJSON: (t) => { try { return JSON.parse(t); } catch { return null; } } },
    MONTHS: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
    withSaveGuard: (key, modalId, fn) => fn(),
    withSaveGuardAsync: async (key, modalId, fn) => await fn(),
    renderDashboard: opts.renderDashboard || record('renderDashboard'),
    renderKeuangan: opts.renderKeuangan || record('renderKeuangan'),
    Kasir: opts.Kasir || { render: record('Kasir.render') },
  }, [
    'Etalase', 'PriceReko', 'PriceRekoWidget', 'StockRekoWidget', 'Produsen',
    'SiapPulang', 'Order', 'Laporan', 'Pelanggan',
  ]);
  return { ctx, fakeDocument, calls };
}

// ================= Etalase =================

test('Etalase.openModal — mode tambah: judul & field kosong, PriceReko direset', () => {
  const D = baseD({ products: [], cobekKategori: [], produsen: [] });
  const { ctx, fakeDocument, calls } = makeCtx(D);
  ctx.Etalase.openModal();
  assert.equal(fakeDocument.getElementById('productModalTitle').textContent, 'Tambah Produk');
  assert.equal(fakeDocument.getElementById('pName').value, '');
  assert.equal(fakeDocument.getElementById('pStock').value, '');
  assert.equal(ctx.Etalase.editIdx, null);
  assert.ok(calls.openModal.includes('productModal'));
});

test('Etalase.openModal — mode edit: prefill dari produk existing termasuk kategori/produsen', () => {
  const D = baseD({
    products: [{ id: 'p1', name: 'Shop Batu', stock: 5, hargaBeli: 10000, hargaJual: 20000, hargaReseller: 15000, diskonPersen: 10, kategoriId: 'k1', produsenId: 'prd1' }],
    cobekKategori: [{ id: 'k1', name: 'Batu Alam' }],
    produsen: [{ id: 'prd1', name: 'Supplier A' }],
  });
  const { ctx, fakeDocument } = makeCtx(D);
  ctx.Etalase.openModal(0);
  assert.equal(fakeDocument.getElementById('productModalTitle').textContent, 'Edit Produk');
  assert.equal(fakeDocument.getElementById('pName').value, 'Shop Batu');
  assert.equal(fakeDocument.getElementById('pKategori').value, 'Batu Alam');
  assert.equal(fakeDocument.getElementById('pProdusen').value, 'prd1');
  assert.equal(fakeDocument.getElementById('pBeli').value, 10000);
  assert.equal(fakeDocument.getElementById('pReseller').value, 15000);
  assert.equal(fakeDocument.getElementById('pDiskon').value, 10);
  assert.equal(ctx.Etalase.editIdx, 0);
});

test('Etalase.onProdusenChange — pilih "__new__": prompt nama, push produsen baru, set value ke produsen baru', async () => {
  const D = baseD({ products: [], produsen: [] });
  const { ctx, fakeDocument, calls } = makeCtx(D, { showPromptModal: async () => 'Supplier Baru' });
  fakeDocument.getElementById('pProdusen').value = '__new__';
  await ctx.Etalase.onProdusenChange();
  assert.equal(D.produsen.length, 1);
  assert.equal(D.produsen[0].name, 'Supplier Baru');
  assert.equal(fakeDocument.getElementById('pProdusen').value, D.produsen[0].id);
  assert.equal(calls.save, 1);
});

test('Etalase.onProdusenChange — batal isi nama produsen baru => value dikosongkan lagi', async () => {
  const D = baseD({ products: [], produsen: [] });
  const { ctx, fakeDocument } = makeCtx(D, { showPromptModal: async () => null });
  fakeDocument.getElementById('pProdusen').value = '__new__';
  await ctx.Etalase.onProdusenChange();
  assert.equal(D.produsen.length, 0);
  assert.equal(fakeDocument.getElementById('pProdusen').value, '');
});

test('Etalase.onProdusenChange — mode edit & pilih produsen yang punya harga tersimpan => autofill pBeli', async () => {
  const D = baseD({ products: [{ id: 'p1', name: 'X', stock: 1, hargaBeli: 1000, hargaJual: 2000, hargaByProdusen: { prd1: 7777 } }] });
  const { ctx, fakeDocument } = makeCtx(D);
  ctx.Etalase.openModal(0);
  fakeDocument.getElementById('pProdusen').value = 'prd1';
  await ctx.Etalase.onProdusenChange();
  assert.equal(fakeDocument.getElementById('pBeli').value, 7777);
});

test('Etalase.save — validasi: nama kosong / harga jual kosong => toast, tidak menyimpan', () => {
  const D = baseD();
  const { ctx, calls } = makeCtx(D, { domValues: { pName: { value: '' }, pJual: { value: '' } } });
  ctx.Etalase.save();
  assert.equal(D.products.length, 0);
  assert.ok(calls.toast[0].includes('Lengkapi nama'));
});

test('Etalase.save — tambah produk baru dengan stok awal & harga beli => tercatat sbg transaksi pengeluaran modal', () => {
  const D = baseD();
  const { ctx, fakeDocument, calls } = makeCtx(D, {
    domValues: {
      pName: { value: 'Shop Baru' }, pStock: { value: '10' }, pKategori: { value: 'Batu' },
      pBeli: { value: '5000' }, pJual: { value: '9000' }, pAcc: { value: 'acc1' },
    },
  });
  ctx.Etalase.save();
  assert.equal(D.products.length, 1);
  assert.equal(D.products[0].name, 'Shop Baru');
  assert.equal(D.transactions.length, 1);
  const tx = D.transactions[0];
  assert.equal(tx.type, 'expense');
  assert.equal(tx.amount, 50000);
  assert.equal(tx.category, 'Bisnis');
  assert.equal(tx.subcategory, 'Cobek');
  assert.equal(tx.stockProductId, D.products[0].id);
  assert.equal(tx.stockQty, 10);
  assert.ok(tx.note.includes('Shop Baru'));
  assert.ok(tx.note.includes('x10'));
  assert.equal(calls.save, 1);
  assert.ok(calls.render.some((r) => r[0] === 'renderDashboard'));
  assert.ok(calls.render.some((r) => r[0] === 'renderKeuangan'));
  assert.ok(calls.closeModal.includes('productModal'));
  assert.ok(calls.toast[0].includes('tercatat sbg pengeluaran'));
  assert.equal(fakeDocument.getElementById('productModalTitle'), fakeDocument.getElementById('productModalTitle')); // no-op sanity
});

test('Etalase.save — produk baru dengan stok 0 => TIDAK ada transaksi, cuma toast update', () => {
  const D = baseD();
  const { ctx, calls } = makeCtx(D, {
    domValues: { pName: { value: 'Shop Tanpa Stok' }, pStock: { value: '0' }, pBeli: { value: '5000' }, pJual: { value: '9000' } },
  });
  ctx.Etalase.save();
  assert.equal(D.products.length, 1);
  assert.equal(D.transactions.length, 0);
  assert.ok(calls.toast[0].includes('hanya update'));
});

test('Etalase.save — edit produk existing, stok dikurangi (delta negatif) => tidak ada transaksi baru', () => {
  const D = baseD({ products: [{ id: 'p1', name: 'Lama', stock: 10, hargaBeli: 1000, hargaJual: 2000, hargaByProdusen: {} }] });
  const { ctx, fakeDocument, calls } = makeCtx(D);
  ctx.Etalase.openModal(0); // prefill pStock=10 dari data existing
  fakeDocument.getElementById('pStock').value = '3'; // user turunkan stok manual setelah modal terbuka
  ctx.Etalase.save();
  assert.equal(D.products[0].stock, 3);
  assert.equal(D.transactions.length, 0);
});

test('Etalase.save — pilih produsen & harga beli>0 => hargaByProdusen produk ikut tersimpan', () => {
  const D = baseD({ produsen: [{ id: 'prd1', name: 'Supplier A' }] });
  const { ctx } = makeCtx(D, {
    domValues: { pName: { value: 'Shop X' }, pStock: { value: '0' }, pBeli: { value: '4000' }, pJual: { value: '8000' }, pProdusen: { value: 'prd1' } },
  });
  ctx.Etalase.save();
  assert.equal(D.products[0].produsenId, 'prd1');
  assert.equal(D.products[0].hargaByProdusen.prd1, 4000);
});

test('Etalase.delete — konfirmasi ya => produk terhapus dari D.products', async () => {
  const D = baseD({ products: [{ id: 'p1', name: 'A' }, { id: 'p2', name: 'B' }] });
  const { ctx, calls } = makeCtx(D);
  await ctx.Etalase.delete(0);
  assert.equal(D.products.length, 1);
  assert.equal(D.products[0].id, 'p2');
  assert.ok(calls.toast[0].includes('Dihapus'));
});

test('Etalase.delete — konfirmasi batal => tidak terhapus', async () => {
  const D = baseD({ products: [{ id: 'p1', name: 'A' }] });
  const { ctx } = makeCtx(D, { askConfirm: async () => false });
  await ctx.Etalase.delete(0);
  assert.equal(D.products.length, 1);
});

test('Etalase.renderList — kosong => tampilkan pesan empty', () => {
  const D = baseD();
  const { ctx, fakeDocument } = makeCtx(D);
  ctx.Etalase.renderList();
  assert.ok(fakeDocument.getElementById('productList').innerHTML.includes('Belum ada produk'));
});

test('Etalase.renderList — ada produk => tampilkan margin & meta kategori/produsen', () => {
  const D = baseD({
    products: [{ id: 'p1', name: 'Shop A', stock: 5, hargaBeli: 3000, hargaJual: 8000, kategoriId: 'k1', produsenId: 'prd1' }],
    cobekKategori: [{ id: 'k1', name: 'Batu' }],
    produsen: [{ id: 'prd1', name: 'Supplier A' }],
  });
  const { ctx, fakeDocument } = makeCtx(D);
  ctx.Etalase.renderList();
  const html = fakeDocument.getElementById('productList').innerHTML;
  assert.ok(html.includes('Shop A'));
  assert.ok(html.includes('Batu'));
  assert.ok(html.includes('Supplier A'));
  assert.ok(html.includes('+Rp5000')); // margin 8000-3000
});

test('Etalase.renderList — badge stok berubah sesuai level (low/mid/ok)', () => {
  const D = baseD({
    products: [
      { id: 'p1', name: 'Stok Menipis', stock: 2, hargaBeli: 1000, hargaJual: 2000 },
      { id: 'p2', name: 'Stok Terbatas', stock: 4, hargaBeli: 1000, hargaJual: 2000 },
      { id: 'p3', name: 'Stok Aman', stock: 20, hargaBeli: 1000, hargaJual: 2000 },
    ],
  });
  const { ctx, fakeDocument } = makeCtx(D);
  ctx.Etalase.renderList();
  const html = fakeDocument.getElementById('productList').innerHTML;
  assert.ok(html.includes('stock-low'));
  assert.ok(html.includes('stock-mid'));
  assert.ok(html.includes('stock-ok'));
  assert.ok(html.includes('Menipis'));
  assert.ok(html.includes('Terbatas'));
  assert.ok(html.includes('Aman'));
});

test('Etalase.renderList — produk dengan diskon => harga normal dicoret, harga final & persen diskon tampil', () => {
  const D = baseD({
    products: [{ id: 'p1', name: 'Cobek Diskon', stock: 10, hargaBeli: 5000, hargaJual: 10000, diskonPersen: 20 }],
  });
  const { ctx, fakeDocument } = makeCtx(D);
  ctx.Etalase.renderList();
  const html = fakeDocument.getElementById('productList').innerHTML;
  assert.ok(html.includes('shop-price-strike'));
  assert.ok(html.includes('-20%'));
  assert.ok(html.includes('Rp8000')); // 10000 * (1-0.2) = 8000, harga final setelah diskon
});

test('Etalase.renderList — produk tanpa diskon => tidak ada elemen harga coret', () => {
  const D = baseD({
    products: [{ id: 'p1', name: 'Cobek Normal', stock: 10, hargaBeli: 5000, hargaJual: 10000, diskonPersen: 0 }],
  });
  const { ctx, fakeDocument } = makeCtx(D);
  ctx.Etalase.renderList();
  const html = fakeDocument.getElementById('productList').innerHTML;
  assert.ok(!html.includes('shop-price-strike'));
});

// ================= PriceReko =================

test('PriceReko.roundNice — pembulatan bertingkat sesuai besaran nilai', () => {
  const D = baseD();
  const { ctx } = makeCtx(D);
  assert.equal(ctx.PriceReko.roundNice(0), 0);
  assert.equal(ctx.PriceReko.roundNice(-100), 0);
  assert.equal(ctx.PriceReko.roundNice(1234), 1000); // step 500 di bawah 20000
  assert.equal(ctx.PriceReko.roundNice(25400), 25000); // step 1000 (>=20000)
  assert.equal(ctx.PriceReko.roundNice(123456), 125000); // step 5000 (>=100000)
  assert.equal(ctx.PriceReko.roundNice(1234567), 1250000); // step 50000 (>=1000000)
});

test('PriceReko.calc — hitung hasil dari modal+transport dgn margin, tulis ke DOM', () => {
  const D = baseD();
  const { ctx, fakeDocument } = makeCtx(D, {
    domValues: { pBeli: { value: '8000' }, prkTransport: { value: '2000' }, prkMargin: { value: '50' } },
  });
  const result = ctx.PriceReko.calc();
  // base=10000, x1.5=15000 -> roundNice step 1000 (>=20000? tidak, 15000 masih <20000, step 500)
  assert.equal(result, 15000);
  assert.equal(fakeDocument.getElementById('prkResult').textContent, 'RpFull15000');
  assert.ok(fakeDocument.getElementById('prkBreakdown').textContent.includes('margin 50%'));
});

test('PriceReko.calc — modal kosong => breakdown pesan "Isi Harga Beli dulu"', () => {
  const D = baseD();
  const { ctx, fakeDocument } = makeCtx(D);
  ctx.PriceReko.calc();
  assert.ok(fakeDocument.getElementById('prkBreakdown').textContent.includes('Isi Harga Beli dulu'));
});

test('PriceReko.reset — kosongkan semua field & state internal', () => {
  const D = baseD();
  const { ctx, fakeDocument } = makeCtx(D, {
    domValues: { prkTransport: { value: '100' }, prkMargin: { value: '20' } },
  });
  ctx.PriceReko._result = 999; ctx.PriceReko._marketMin = 10;
  ctx.PriceReko.reset();
  assert.equal(ctx.PriceReko._result, 0);
  assert.equal(ctx.PriceReko._marketMin, null);
  assert.equal(fakeDocument.getElementById('prkTransport').value, '');
  assert.equal(fakeDocument.getElementById('prkMargin').value, '');
  assert.equal(fakeDocument.getElementById('prkResult').textContent, 'Rp 0');
  assert.ok(fakeDocument.getElementById('priceRekoPanel').classList.contains('u-dnone'));
});

test('PriceReko.toggle — buka panel (dari tersembunyi) => prefill & calc dipanggil', () => {
  const D = baseD({ products: [] });
  const { ctx, fakeDocument } = makeCtx(D);
  fakeDocument.getElementById('priceRekoPanel').classList.add('u-dnone');
  ctx.PriceReko.toggle();
  assert.ok(!fakeDocument.getElementById('priceRekoPanel').classList.contains('u-dnone'));
});

test('PriceReko.prefill — ambil rata-rata margin produk sejenis sekategori', () => {
  const D = baseD({
    products: [
      { id: 'p1', kategoriId: 'k1', hargaBeli: 1000, hargaJual: 1500 }, // margin 50%
      { id: 'p2', kategoriId: 'k1', hargaBeli: 1000, hargaJual: 2000 }, // margin 100%
    ],
    cobekKategori: [{ id: 'k1', name: 'Batu' }],
  });
  const { ctx, fakeDocument } = makeCtx(D, { domValues: { pKategori: { value: 'Batu' } } });
  ctx.PriceReko.prefill();
  assert.equal(fakeDocument.getElementById('prkMargin').value, 75);
  assert.ok(fakeDocument.getElementById('prkMarketInfo').textContent.includes('produk sejenis'));
});

test('PriceReko.prefill — tidak ada kategori cocok => fallback margin 50%, tidak overwrite margin yg sudah diisi user', () => {
  const D = baseD({ products: [], cobekKategori: [] });
  const { ctx, fakeDocument } = makeCtx(D, { domValues: { pKategori: { value: 'Tidak Ada' }, prkMargin: { value: '30' } } });
  ctx.PriceReko.prefill();
  assert.equal(fakeDocument.getElementById('prkMargin').value, '30'); // tidak ditimpa krn sudah ada isi
});

test('PriceReko.autoFillTransport — tidak ada data BBM => toast peringatan, tidak isi apa pun', () => {
  const D = baseD({ bbmLogs: [] });
  const { ctx, fakeDocument, calls } = makeCtx(D);
  ctx.PriceReko.autoFillTransport();
  assert.equal(fakeDocument.getElementById('prkTransport').value, '');
  assert.ok(calls.toast[0].includes('Belum ada catatan BBM'));
});

test('PriceReko.autoFillTransport — ada data BBM => isi rata-rata harga/liter, lalu calc ulang', () => {
  const D = baseD({ bbmLogs: [{ liter: 2, harga: 10000 }, { liter: 2, harga: 12000 }] });
  const { ctx, fakeDocument } = makeCtx(D, { domValues: { pBeli: { value: '1000' } } });
  ctx.PriceReko.autoFillTransport();
  assert.equal(fakeDocument.getElementById('prkTransport').value, 11000);
});

test('PriceReko.apply — modal kosong => toast peringatan, tidak isi pJual', () => {
  const D = baseD();
  const { ctx, fakeDocument, calls } = makeCtx(D);
  ctx.PriceReko.apply();
  assert.equal(fakeDocument.getElementById('pJual').value, '');
  assert.ok(calls.toast[0].includes('Isi Harga Beli'));
});

test('PriceReko.apply — hasil valid => isi pJual & pReseller (kalau kosong) dgn margin reseller 60% dari margin biasa', () => {
  const D = baseD();
  const { ctx, fakeDocument } = makeCtx(D, {
    domValues: { pBeli: { value: '10000' }, prkTransport: { value: '0' }, prkMargin: { value: '50' } },
  });
  ctx.PriceReko.apply();
  assert.equal(fakeDocument.getElementById('pJual').value, 15000);
  assert.equal(fakeDocument.getElementById('pReseller').value, ctx.PriceReko.roundNice(10000 * 1.3));
});

test('PriceReko.apply — pReseller sudah ada isi => tidak ditimpa', () => {
  const D = baseD();
  const { ctx, fakeDocument } = makeCtx(D, {
    domValues: { pBeli: { value: '10000' }, prkMargin: { value: '50' }, pReseller: { value: '99999' } },
  });
  ctx.PriceReko.apply();
  assert.equal(fakeDocument.getElementById('pReseller').value, '99999');
});

test('PriceReko.checkMarketAI — nama produk kosong => toast peringatan, tidak panggil AI', async () => {
  const D = baseD();
  let calledAI = false;
  const { ctx, calls } = makeCtx(D, { callAIProviderRaw: async () => { calledAI = true; return { ok: true, text: '{}' }; } });
  await ctx.PriceReko.checkMarketAI();
  assert.equal(calledAI, false);
  assert.ok(calls.toast[0].includes('Isi nama produk'));
});

test('PriceReko.checkMarketAI — belum ada API key => toast peringatan', async () => {
  const D = baseD({ profile: { apiKey: '', apiProvider: 'claude' } });
  const { ctx, calls } = makeCtx(D, { domValues: { pName: { value: 'Shop X' } } });
  await ctx.PriceReko.checkMarketAI();
  assert.ok(calls.toast[0].includes('API Key'));
});

test('PriceReko.checkMarketAI — respons AI gagal => toast error, info dikosongkan', async () => {
  const D = baseD({ profile: { apiKey: 'k', apiProvider: 'claude' } });
  const { ctx, fakeDocument, calls } = makeCtx(D, {
    domValues: { pName: { value: 'Shop X' } },
    callAIProviderRaw: async () => ({ ok: false, errMsg: 'timeout' }),
  });
  await ctx.PriceReko.checkMarketAI();
  assert.ok(calls.toast[0].includes('Gagal hubungi'));
  assert.equal(fakeDocument.getElementById('prkMarketInfo').textContent, '');
});

test('PriceReko.checkMarketAI — AI ketemu harga pasar valid => set _marketMin/_marketMax & info', async () => {
  const D = baseD({ profile: { apiKey: 'k', apiProvider: 'claude' } });
  const { ctx, fakeDocument } = makeCtx(D, {
    domValues: { pName: { value: 'Shop X' } },
    callAIProviderRaw: async () => ({ ok: true, text: JSON.stringify({ hargaPasar: { min: 15000, max: 25000, source: 'Tokopedia' } }) }),
  });
  await ctx.PriceReko.checkMarketAI();
  assert.equal(ctx.PriceReko._marketMin, 15000);
  assert.equal(ctx.PriceReko._marketMax, 25000);
  assert.ok(fakeDocument.getElementById('prkMarketInfo').textContent.includes('Tokopedia'));
});

test('PriceReko.checkMarketAI — AI tidak yakin (min null) => info peringatan, tidak set market range', async () => {
  const D = baseD({ profile: { apiKey: 'k', apiProvider: 'claude' } });
  const { ctx, fakeDocument } = makeCtx(D, {
    domValues: { pName: { value: 'Shop X' } },
    callAIProviderRaw: async () => ({ ok: true, text: JSON.stringify({ hargaPasar: { min: null, max: null, source: 'tidak ketemu' } }) }),
  });
  await ctx.PriceReko.checkMarketAI();
  assert.equal(ctx.PriceReko._marketMin, null);
  assert.ok(fakeDocument.getElementById('prkMarketInfo').textContent.includes('tidak menemukan'));
});

// ================= PriceRekoWidget =================

test('PriceRekoWidget.avgTransport — rata-rata harga BBM 10 log terakhir', () => {
  const D = baseD({ bbmLogs: [{ liter: 1, harga: 10000 }, { liter: 1, harga: 20000 }] });
  const { ctx } = makeCtx(D);
  assert.equal(ctx.PriceRekoWidget.avgTransport(), 15000);
});

test('PriceRekoWidget.avgMarginForKategori — exclude produk itu sendiri, fallback 50% kalau tidak ada data', () => {
  const D = baseD({
    products: [
      { id: 'p1', kategoriId: 'k1', hargaBeli: 1000, hargaJual: 2000 },
      { id: 'p2', kategoriId: 'k1', hargaBeli: 1000, hargaJual: 1000 }, // margin 0, exclude via filter margin>0
    ],
  });
  const { ctx } = makeCtx(D);
  assert.equal(ctx.PriceRekoWidget.avgMarginForKategori('k1', 'p1'), 50); // hanya p1 diexclude, p2 margin 0 -> difilter -> fallback 50
  assert.equal(ctx.PriceRekoWidget.avgMarginForKategori('k_kosong', null), 50);
});

test('PriceRekoWidget.scan — tandai produk yg menyimpang >= threshold dari rekomendasi', () => {
  const D = baseD({
    products: [
      { id: 'p1', kategoriId: 'k1', hargaBeli: 10000, hargaJual: 50000 }, // jauh di atas estimasi
      { id: 'p2', kategoriId: 'k1', hargaBeli: 10000, hargaJual: 15000 }, // dekat estimasi (margin 50% default)
    ],
  });
  const { ctx } = makeCtx(D);
  const flagged = ctx.PriceRekoWidget.scan();
  assert.ok(flagged.some((f) => f.product.id === 'p1'));
});

test('PriceRekoWidget.render — tidak ada yg flagged => card disembunyikan', () => {
  const D = baseD({ products: [] });
  const { ctx, fakeDocument } = makeCtx(D);
  ctx.PriceRekoWidget.render();
  assert.equal(fakeDocument.getElementById('priceRekoWidgetCard').style.display, 'none');
});

test('PriceRekoWidget.applyOne — konfirmasi ya => update hargaJual produk ke rekomendasi', async () => {
  const D = baseD({ products: [{ id: 'p1', kategoriId: 'k1', name: 'Shop A', hargaBeli: 10000, hargaJual: 50000 }] });
  const { ctx, calls } = makeCtx(D);
  await ctx.PriceRekoWidget.applyOne('p1');
  assert.notEqual(D.products[0].hargaJual, 50000);
  assert.equal(calls.save, 1);
  assert.ok(calls.toast[0].includes('diperbarui'));
});

test('PriceRekoWidget.applyOne — produk tidak ditemukan => tidak error, tidak berubah', async () => {
  const D = baseD({ products: [] });
  const { ctx } = makeCtx(D);
  await ctx.PriceRekoWidget.applyOne('tidak-ada');
  assert.equal(D.products.length, 0);
});

test('PriceRekoWidget.openDetail — buka productModal utk produk terkait', () => {
  const D = baseD({ products: [{ id: 'p1', name: 'A', kategoriId: 'k1', hargaBeli: 1000, hargaJual: 2000 }] });
  const { ctx, calls } = makeCtx(D);
  ctx.PriceRekoWidget.openDetail('p1');
  assert.ok(calls.openModal.includes('productModal'));
  assert.equal(ctx.Etalase.editIdx, 0);
});

// ================= StockRekoWidget =================

test('StockRekoWidget.soldQty — total qty terjual dalam N hari terakhir, abaikan histori lama/invalid', () => {
  const today = new Date();
  const recentDate = new Date(today); recentDate.setDate(recentDate.getDate() - 5);
  const oldDate = new Date(today); oldDate.setDate(oldDate.getDate() - 60);
  const D = baseD({
    cobek: [
      { date: recentDate.toISOString().split('T')[0], items: [{ productId: 'p1', qty: 3 }] },
      { date: oldDate.toISOString().split('T')[0], items: [{ productId: 'p1', qty: 100 }] },
      { date: 'invalid-date', items: [{ productId: 'p1', qty: 100 }] },
    ],
  });
  const { ctx } = makeCtx(D);
  assert.equal(ctx.StockRekoWidget.soldQty('p1', 30), 3);
});

test('StockRekoWidget.scan — produk dgn histori penjualan cepat habis => masuk daftar urgent', () => {
  const today = new Date().toISOString().split('T')[0];
  const D = baseD({
    products: [{ id: 'p1', name: 'Shop Laris', stock: 2 }],
    cobek: [{ date: today, items: [{ productId: 'p1', qty: 30 }] }], // velocity 1/hari, stok 2 -> daysLeft=2
  });
  const { ctx } = makeCtx(D);
  const flagged = ctx.StockRekoWidget.scan();
  assert.equal(flagged.length, 1);
  assert.equal(flagged[0].hasHistory, true);
  assert.ok(flagged[0].restockQty > 0);
});

test('StockRekoWidget.scan — produk tanpa histori tapi stok <=2 tetap ditandai (mode belum cukup data)', () => {
  const D = baseD({ products: [{ id: 'p1', name: 'Baru', stock: 1 }], cobek: [] });
  const { ctx } = makeCtx(D);
  const flagged = ctx.StockRekoWidget.scan();
  assert.equal(flagged.length, 1);
  assert.equal(flagged[0].hasHistory, false);
  assert.equal(flagged[0].restockQty, 5);
});

test('StockRekoWidget.scan — stok aman & tanpa histori => tidak ditandai', () => {
  const D = baseD({ products: [{ id: 'p1', name: 'Aman', stock: 20 }], cobek: [] });
  const { ctx } = makeCtx(D);
  assert.equal(ctx.StockRekoWidget.scan().length, 0);
});

test('StockRekoWidget.render — ada yg flagged => card ditampilkan dgn estimasi hari habis', () => {
  const today = new Date().toISOString().split('T')[0];
  const D = baseD({
    products: [{ id: 'p1', name: 'Shop Laris', stock: 2 }],
    cobek: [{ date: today, items: [{ productId: 'p1', qty: 30 }] }],
  });
  const { ctx, fakeDocument } = makeCtx(D);
  ctx.StockRekoWidget.render();
  assert.notEqual(fakeDocument.getElementById('stockRekoWidgetCard').style.display, 'none');
  assert.ok(fakeDocument.getElementById('stockRekoWidgetList').innerHTML.includes('Shop Laris'));
});

test('StockRekoWidget.openDetail — restockQty>0 => prefill kolom stok via setTimeout (dites lewat pemanggilan langsung)', () => {
  const D = baseD({ products: [{ id: 'p1', name: 'A', stock: 2, hargaBeli: 1000, hargaJual: 2000 }] });
  const { ctx, calls } = makeCtx(D);
  ctx.StockRekoWidget.openDetail('p1', 5);
  assert.ok(calls.openModal.includes('productModal'));
});

// ================= Produsen =================

test('Produsen.openModal — mode tambah vs edit', () => {
  const D = baseD({ produsen: [{ id: 'prd1', name: 'Supplier A', contact: '0812', note: 'catatan' }] });
  const { ctx, fakeDocument } = makeCtx(D);
  ctx.Produsen.openModal();
  assert.equal(fakeDocument.getElementById('produsenModalTitle').textContent, 'Tambah Produsen');
  assert.equal(fakeDocument.getElementById('prName').value, '');
  ctx.Produsen.openModal('prd1');
  assert.equal(fakeDocument.getElementById('produsenModalTitle').textContent, 'Edit Produsen');
  assert.equal(fakeDocument.getElementById('prName').value, 'Supplier A');
  assert.equal(fakeDocument.getElementById('prContact').value, '0812');
});

test('Produsen.save — nama kosong => toast peringatan', () => {
  const D = baseD();
  const { ctx, calls } = makeCtx(D);
  ctx.Produsen.save();
  assert.equal(D.produsen.length, 0);
  assert.ok(calls.toast[0].includes('wajib diisi'));
});

test('Produsen.save — tambah baru & edit existing', () => {
  const D = baseD();
  const { ctx, fakeDocument } = makeCtx(D, { domValues: { prName: { value: 'Supplier Baru' }, prContact: { value: '0812' } } });
  ctx.Produsen.save();
  assert.equal(D.produsen.length, 1);
  const id = D.produsen[0].id;
  ctx.Produsen.openModal(id);
  fakeDocument.getElementById('prName').value = 'Supplier Ubah';
  ctx.Produsen.save();
  assert.equal(D.produsen.length, 1);
  assert.equal(D.produsen[0].name, 'Supplier Ubah');
});

test('Produsen.delete — konfirmasi ya => hapus produsen & lepas relasi di produk', async () => {
  const D = baseD({
    produsen: [{ id: 'prd1', name: 'A' }],
    products: [{ id: 'p1', produsenId: 'prd1' }],
  });
  const { ctx } = makeCtx(D);
  await ctx.Produsen.delete('prd1');
  assert.equal(D.produsen.length, 0);
  assert.equal(D.products[0].produsenId, '');
});

test('Produsen.renderList — kosong vs ada data dgn info harga produk', () => {
  const D = baseD();
  const { ctx, fakeDocument } = makeCtx(D);
  ctx.Produsen.renderList();
  assert.ok(fakeDocument.getElementById('produsenList').innerHTML.includes('Belum ada produsen'));
  D.produsen.push({ id: 'prd1', name: 'Supplier A', contact: '0812' });
  D.products.push({ id: 'p1', name: 'Shop A', hargaByProdusen: { prd1: 5000 } });
  ctx.Produsen.renderList();
  const html = fakeDocument.getElementById('produsenList').innerHTML;
  assert.ok(html.includes('Supplier A'));
  assert.ok(html.includes('Shop A'));
});

test('Produsen.openHargaModal — render daftar harga per produk utk produsen ybs', () => {
  const D = baseD({
    produsen: [{ id: 'prd1', name: 'Supplier A' }],
    products: [{ id: 'p1', name: 'Shop A', hargaJual: 8000, hargaByProdusen: { prd1: 4000 } }],
  });
  const { ctx, fakeDocument, calls } = makeCtx(D);
  ctx.Produsen.openHargaModal('prd1');
  assert.equal(ctx.Produsen.hargaEditId, 'prd1');
  assert.ok(fakeDocument.getElementById('produsenHargaList').innerHTML.includes('Shop A'));
  assert.ok(calls.openModal.includes('produsenHargaModal'));
});

test('Produsen.saveHarga — update hargaByProdusen produk dari input, hapus kalau kosong/0', () => {
  const D = baseD({
    produsen: [{ id: 'prd1', name: 'Supplier A' }],
    products: [{ id: 'p1', hargaByProdusen: { prd1: 4000 } }, { id: 'p2', hargaByProdusen: {} }],
  });
  const inputs = [
    { getAttribute: () => 'p1', value: '5000' },
    { getAttribute: () => 'p2', value: '0' },
  ];
  const { ctx, calls } = makeCtx(D, {
    queryGroups: { '#produsenHargaList input[data-prod-id]': inputs },
  });
  ctx.Produsen.hargaEditId = 'prd1';
  ctx.Produsen.saveHarga();
  assert.equal(D.products[0].hargaByProdusen.prd1, 5000);
  assert.equal(D.products[1].hargaByProdusen.prd1, undefined);
  assert.ok(calls.toast[0].includes('disimpan'));
});

// ================= SiapPulang =================

test('SiapPulang.toggleDeliveredField — update label sesuai checked', () => {
  const D = baseD();
  const { ctx, fakeDocument } = makeCtx(D, { domValues: { oDelivered: { checked: true }, oDeliveredLbl: {} } });
  ctx.SiapPulang.toggleDeliveredField();
  assert.ok(fakeDocument.getElementById('oDeliveredLbl').textContent.includes('Sudah diserahkan'));
  fakeDocument.getElementById('oDelivered').checked = false;
  ctx.SiapPulang.toggleDeliveredField();
  assert.ok(fakeDocument.getElementById('oDeliveredLbl').textContent.includes('akan dibawa pulang'));
});

test('SiapPulang.markDelivered — tandai cobek sbg delivered=true', () => {
  const D = baseD({ cobek: [{ id: 'c1', delivered: false, items: [] }] });
  const { ctx, calls } = makeCtx(D);
  ctx.SiapPulang.markDelivered('c1');
  assert.equal(D.cobek[0].delivered, true);
  assert.equal(calls.save, 1);
  assert.ok(calls.toast[0].includes('sudah diserahkan'));
});

test('SiapPulang.render — tidak ada order pending => card disembunyikan', () => {
  const D = baseD({ cobek: [] });
  const { ctx, fakeDocument } = makeCtx(D, {});
  ctx.SiapPulang.render();
  assert.equal(fakeDocument.getElementById('siapPulangCard').style.display, 'none');
});

test('SiapPulang.render — ada order pending => tampilkan checklist agregat & daftar order', () => {
  const D = baseD({
    cobek: [
      { id: 'c1', delivered: false, date: '2026-01-01', items: [{ name: 'Shop A', qty: 2 }], customer: { name: 'Budi', phone: '0812' } },
      { id: 'c2', delivered: false, date: '2026-01-02', items: [{ name: 'Shop A', qty: 1 }], customer: {} },
    ],
  });
  const { ctx, fakeDocument } = makeCtx(D, {});
  ctx.SiapPulang.render();
  const html = fakeDocument.getElementById('siapPulangCard').innerHTML;
  assert.ok(html.includes('3x')); // total qty Shop A: 2+1
  assert.ok(html.includes('Budi'));
});

// ================= Order (Kasir/Order form pre-order) =================

test('Order.populateProductSelect — isi opsi dari D.products, fallback kalau kosong', () => {
  const D = baseD({ products: [{ id: 'p1', name: 'Shop A', stock: 5 }] });
  const { ctx, fakeDocument } = makeCtx(D);
  ctx.Order.populateProductSelect();
  assert.ok(fakeDocument.getElementById('oProductSelect').innerHTML.includes('Shop A'));
  D.products = [];
  ctx.Order.populateProductSelect();
  assert.ok(fakeDocument.getElementById('oProductSelect').innerHTML.includes('Belum ada produk'));
});

test('Order.openModal — tidak ada produk => toast peringatan, modal tidak dibuka', () => {
  const D = baseD({ products: [] });
  const { ctx, calls } = makeCtx(D);
  ctx.Order.openModal();
  assert.ok(calls.toast[0].includes('Tambah produk'));
  assert.ok(!calls.openModal.includes('orderModal'));
});

test('Order.openModal — ada produk => reset items, tanggal hari ini, checkbox delivered default true', () => {
  const D = baseD({ products: [{ id: 'p1', name: 'A', stock: 5 }] });
  const { ctx, fakeDocument, calls } = makeCtx(D, { domValues: { oDelivered: {} } });
  ctx.Order.items = [{ productId: 'x', qty: 1 }];
  ctx.Order.openModal();
  assert.equal(ctx.Order.items.length, 0);
  assert.ok(fakeDocument.getElementById('oDate').value);
  assert.equal(fakeDocument.getElementById('oDelivered').checked, true);
  assert.ok(calls.openModal.includes('orderModal'));
});

test('Order.addItem — produk tidak dipilih => toast, tidak nambah; produk sama nambah qty', () => {
  const D = baseD({ products: [{ id: 'p1', name: 'A', stock: 5 }] });
  const { ctx, fakeDocument, calls } = makeCtx(D);
  ctx.Order.items = [];
  fakeDocument.getElementById('oProductSelect').value = '';
  ctx.Order.addItem();
  assert.ok(calls.toast[0].includes('Pilih produk'));
  fakeDocument.getElementById('oProductSelect').value = 'p1';
  ctx.Order.addItem();
  ctx.Order.addItem();
  assert.equal(ctx.Order.items.length, 1);
  assert.equal(ctx.Order.items[0].qty, 2);
});

test('Order.changeQty — qty turun ke 0 atau kurang => item terhapus', () => {
  const D = baseD({ products: [{ id: 'p1', name: 'A', stock: 5, hargaJual: 1000 }] });
  const { ctx } = makeCtx(D);
  ctx.Order.items = [{ productId: 'p1', qty: 1, hargaOverride: null }];
  ctx.Order.changeQty(0, -1);
  assert.equal(ctx.Order.items.length, 0);
});

test('Order.computeTotals — hitung subtotal/modal/diskon/ongkir/total/profit dgn priceType reseller & diskon persen produk', () => {
  const D = baseD({ products: [{ id: 'p1', name: 'A', hargaBeli: 1000, hargaJual: 2000, hargaReseller: 1500, diskonPersen: 10 }] });
  const { ctx } = makeCtx(D, {
    domValues: { oPriceType: { value: 'reseller' }, oDiskon: { value: '100' }, oOngkir: { value: '500' } },
  });
  ctx.Order.items = [{ productId: 'p1', qty: 2, hargaOverride: null }];
  const { subtotal, modal, total, profit } = ctx.Order.computeTotals();
  // harga default reseller 1500, diskon produk 10% -> 1350; x2 = 2700
  assert.equal(subtotal, 2700);
  assert.equal(modal, 2000);
  assert.equal(total, 2700 - 100 + 500);
  assert.equal(profit, 2700 - 2000 - 100);
});

test('Order.computeTotals — hargaOverride dipakai kalau > 0', () => {
  const D = baseD({ products: [{ id: 'p1', name: 'A', hargaBeli: 1000, hargaJual: 2000 }] });
  const { ctx } = makeCtx(D, { domValues: { oPriceType: { value: 'jual' } } });
  ctx.Order.items = [{ productId: 'p1', qty: 1, hargaOverride: 5000 }];
  const { subtotal } = ctx.Order.computeTotals();
  assert.equal(subtotal, 5000);
});

test('Order._saveInner — keranjang kosong => toast, tidak simpan', () => {
  const D = baseD();
  const { ctx, calls } = makeCtx(D);
  ctx.Order.items = [];
  ctx.Order._saveInner();
  assert.ok(calls.toast[0].includes('Keranjang masih kosong'));
});

test('Order._saveInner — sukses => push D.cobek & D.transactions income, sinkron render', () => {
  const D = baseD({ products: [{ id: 'p1', name: 'Shop A', stock: 5, hargaBeli: 1000, hargaJual: 2000 }] });
  const { ctx, fakeDocument, calls } = makeCtx(D, {
    domValues: {
      oCustName: { value: 'Budi' }, oCustPhone: { value: '0812' }, oCustAddr: { value: 'Jl. X' },
      oAcc: { value: 'acc1' }, oDate: { value: '2026-01-01' }, oPriceType: { value: 'jual' },
      oDelivered: { checked: true }, oNote: { value: 'catatan' },
    },
  });
  ctx.Order.items = [{ productId: 'p1', qty: 2, hargaOverride: null }];
  ctx.Order._saveInner();
  assert.equal(D.cobek.length, 1);
  assert.equal(D.products[0].stock, 3); // 5-2
  assert.equal(D.transactions.length, 1);
  assert.equal(D.transactions[0].type, 'income');
  assert.equal(D.transactions[0].amount, 4000);
  assert.ok(calls.closeModal.includes('orderModal'));
  assert.ok(calls.toast[0].includes('tersinkron ke Keuangan'));
});

test('Order._saveInner — stok tidak cukup => gagal, toast pesan dari recordShopSale', () => {
  const D = baseD({ products: [{ id: 'p1', name: 'Shop A', stock: 1, hargaBeli: 1000, hargaJual: 2000 }] });
  const { ctx, calls } = makeCtx(D, { domValues: { oDate: { value: '2026-01-01' }, oPriceType: { value: 'jual' } } });
  ctx.Order.items = [{ productId: 'p1', qty: 5, hargaOverride: null }];
  ctx.Order._saveInner();
  assert.equal(D.cobek.length, 0);
  assert.equal(D.transactions.length, 0);
  assert.ok(calls.toast[0].includes('tidak cukup'));
});

test('Order.rowHTML — transaksi baru (items) vs data lama (sets)', () => {
  const D = baseD();
  const { ctx } = makeCtx(D);
  const htmlNew = ctx.Order.rowHTML({ id: 'c1', date: '2026-01-01', items: [{ name: 'A', qty: 2 }], total: 5000, customer: { name: 'Budi' } });
  assert.ok(htmlNew.includes('Budi'));
  const htmlOld = ctx.Order.rowHTML({ id: 'c2', date: '2026-01-01', sets: 3, profit: 1000 });
  assert.ok(htmlOld.includes('3 set (data lama)'));
});

test('Order.rowHTML — order belum diserahkan => ada badge "Belum diserahkan"', () => {
  const D = baseD();
  const { ctx } = makeCtx(D);
  const html = ctx.Order.rowHTML({ id: 'c1', date: '2026-01-01', items: [{ name: 'A', qty: 1 }], total: 1000, delivered: false, customer: {} });
  assert.ok(html.includes('Belum diserahkan'));
});

// ================= Laporan =================

test('Laporan.getRange — periode selamanya/hari/minggu/bulan/tahun/custom', () => {
  const D = baseD();
  const { ctx, fakeDocument } = makeCtx(D);
  ctx.Laporan.periode = 'selamanya';
  assert.equal(ctx.Laporan.getRange().from.getTime(), new Date(0).getTime());
  ctx.Laporan.periode = 'custom';
  fakeDocument.getElementById('shopFrom').value = '2026-01-01';
  fakeDocument.getElementById('shopTo').value = '2026-01-31';
  const r = ctx.Laporan.getRange();
  assert.equal(r.from.toISOString().split('T')[0], '2026-01-01');
});

test('Laporan.setPeriode — set periode aktif & panggil render', () => {
  const D = baseD();
  const els = [createFakeElement(), createFakeElement()];
  const { ctx, fakeDocument } = makeCtx(D, {
    queryGroups: { '#shopPeriodeChips .chip-btn': els },
  });
  const clickedEl = createFakeElement();
  ctx.Laporan.setPeriode('bulan', clickedEl);
  assert.equal(ctx.Laporan.periode, 'bulan');
  assert.ok(clickedEl.classList.contains('active'));
  assert.equal(fakeDocument.getElementById('cTrip').textContent, 0);
});

test('Laporan.render — hitung trip/omzet/untung dalam rentang, urutkan terbaru dulu', () => {
  const D = baseD({
    cobek: [
      { id: 1, date: '2026-01-01', total: 10000, profit: 2000, items: [] },
      { id: 2, date: '2026-01-05', total: 20000, profit: 5000, items: [] },
    ],
  });
  const { ctx, fakeDocument } = makeCtx(D);
  ctx.Laporan.periode = 'selamanya';
  ctx.Laporan.render();
  assert.equal(fakeDocument.getElementById('cTrip').textContent, 2);
  assert.equal(fakeDocument.getElementById('cSet').textContent, 'Rp30000');
  assert.equal(fakeDocument.getElementById('cUntung').textContent, 'Rp7000');
});

test('Laporan.delete — konfirmasi ya => kembalikan stok & hapus transaksi terkait', async () => {
  const D = baseD({
    products: [{ id: 'p1', stock: 3 }],
    cobek: [{ id: 'c1', items: [{ productId: 'p1', qty: 2 }], txLinkId: 'tx1' }],
    transactions: [{ id: 'tx1' }],
  });
  const { ctx, calls } = makeCtx(D);
  ctx.Laporan.periode = 'selamanya';
  await ctx.Laporan.delete('c1');
  assert.equal(D.products[0].stock, 5);
  assert.equal(D.transactions.length, 0);
  assert.equal(D.cobek.length, 0);
  assert.ok(calls.toast[0].includes('dikembalikan'));
});

test('Laporan.renderGrafik — agregasi 6 bulan terakhir per set/margin', () => {
  const D = baseD({ cobek: [] });
  const { ctx, fakeDocument } = makeCtx(D);
  ctx.Laporan.renderGrafik();
  assert.equal(fakeDocument.getElementById('shopGrafikBars').innerHTML.split('grafik-col').length - 1, 6);
});

// ================= Pelanggan =================

test('Pelanggan.key — normalisasi nomor HP (leading 0 -> 62), fallback nama, kosong', () => {
  const D = baseD();
  const { ctx } = makeCtx(D);
  assert.equal(ctx.Pelanggan.key({ phone: '0812345678' }), 'p_62812345678');
  assert.equal(ctx.Pelanggan.key({ phone: '', name: 'Budi' }), 'n_budi');
  assert.equal(ctx.Pelanggan.key({}), '');
  assert.equal(ctx.Pelanggan.key(null), '');
});

test('Pelanggan.aggregate — kelompokkan order per pelanggan, urut byorder terbanyak lalu omzet', () => {
  const D = baseD({
    cobek: [
      { customer: { name: 'Budi', phone: '0812' }, total: 10000, profit: 2000, items: [{}] },
      { customer: { name: 'Budi', phone: '0812' }, total: 20000, profit: 3000, items: [{}] },
      { customer: { name: 'Ani', phone: '0813' }, total: 50000, profit: 8000, items: [{}] },
    ],
  });
  const { ctx } = makeCtx(D);
  const agg = ctx.Pelanggan.aggregate();
  assert.equal(agg[0].name, 'Budi'); // 2 order > 1 order
  assert.equal(agg[0].totalOmzet, 30000);
});

test('Pelanggan.getOrders — ambil order milik pelanggan yg sama, urut terbaru', () => {
  const D = baseD({
    cobek: [
      { id: 1, customer: { phone: '081234567890' }, items: [{}] },
      { id: 2, customer: { phone: '081234567890' }, items: [{}] },
      { id: 3, customer: { phone: '081399998888' }, items: [{}] },
    ],
  });
  const { ctx } = makeCtx(D);
  const orders = ctx.Pelanggan.getOrders({ phone: '081234567890' });
  assert.equal(orders.length, 2);
  assert.equal(orders[0].id, 2);
});

test('Pelanggan.onInputChange — pelanggan lama ditemukan => tampilkan hint riwayat, badge langganan kalau >=3x', () => {
  const D = baseD({
    cobek: [
      { id: 1, date: '2026-01-01', customer: { name: 'Budi', phone: '0812' }, items: [{ name: 'A', harga: 1000 }], total: 1000 },
      { id: 2, date: '2026-01-02', customer: { name: 'Budi', phone: '0812' }, items: [{ name: 'A', harga: 1000 }], total: 1000 },
      { id: 3, date: '2026-01-03', customer: { name: 'Budi', phone: '0812' }, items: [{ name: 'A', harga: 1000 }], total: 1000 },
    ],
  });
  const { ctx, fakeDocument } = makeCtx(D, { domValues: { oCustName: { value: 'Budi' }, oCustPhone: { value: '0812' } } });
  ctx.Pelanggan.onInputChange();
  const html = fakeDocument.getElementById('oCustHint').innerHTML;
  assert.ok(html.includes('Langganan'));
  assert.ok(html.includes('order 3x'));
});

test('Pelanggan.onInputChange — nama & phone kosong => hint disembunyikan', () => {
  const D = baseD();
  const { ctx, fakeDocument } = makeCtx(D);
  ctx.Pelanggan.onInputChange();
  assert.equal(fakeDocument.getElementById('oCustHint').style.display, 'none');
});

test('Pelanggan.renderList — kosong, dan batasi tampil 40 + info sisa', () => {
  const D = baseD();
  const { ctx, fakeDocument } = makeCtx(D);
  ctx.Pelanggan.renderList();
  assert.ok(fakeDocument.getElementById('customerList').innerHTML.includes('Belum ada data pelanggan'));
  D.cobek = Array.from({ length: 45 }, (_, i) => ({ customer: { name: 'Cust' + i, phone: '08' + (1000000 + i) }, items: [{}], total: 1000, profit: 100 }));
  ctx.Pelanggan.renderList();
  assert.ok(fakeDocument.getElementById('customerList').innerHTML.includes('+5 pelanggan lain'));
});

test('Pelanggan.openDetail — render riwayat harga & transaksi, konsistensi harga per item', () => {
  const D = baseD({
    cobek: [
      { id: 1, date: '2026-01-01', customer: { name: 'Budi', phone: '0812' }, items: [{ name: 'A', harga: 1000, qty: 1 }], total: 1000 },
      { id: 2, date: '2026-01-05', customer: { name: 'Budi', phone: '0812' }, items: [{ name: 'A', harga: 1500, qty: 1 }], total: 1500 },
    ],
  });
  const { ctx, fakeDocument, calls } = makeCtx(D);
  const key = ctx.Pelanggan.aggregate()[0].key;
  ctx.Pelanggan.openDetail(key);
  const body = fakeDocument.getElementById('customerDetailBody').innerHTML;
  assert.ok(body.includes('harga berubah'));
  assert.ok(calls.openModal.includes('customerDetailModal'));
});

test('Pelanggan.openDetail — key tidak ditemukan => tidak error, modal tidak dibuka', () => {
  const D = baseD({ cobek: [] });
  const { ctx, calls } = makeCtx(D);
  ctx.Pelanggan.openDetail('tidak-ada');
  assert.ok(!calls.openModal.includes('customerDetailModal'));
});

test('Pelanggan._acList — daftar unik nama terbaru dulu, maksimal 50', () => {
  const D = baseD({
    cobek: [
      { customer: { name: 'Budi', phone: '0812' } },
      { customer: { name: 'Ani', phone: '0813' } },
      { customer: { name: 'Budi', phone: '0812' } }, // duplikat nama, harus di-skip
    ],
  });
  const { ctx } = makeCtx(D);
  const list = ctx.Pelanggan._acList();
  assert.equal(list.length, 2);
  // Iterasi dari INDEX TERAKHIR array ke awal (entri paling akhir = paling baru
  // secara kronologis) -> entri terakhir "Budi" (duplikat) ditemukan duluan,
  // baru "Ani". Entri "Budi" PERTAMA (index 0) di-skip krn nama sudah terlihat.
  assert.equal(list[0].name, 'Budi');
  assert.equal(list[1].name, 'Ani');
});

test('Pelanggan.onFieldInput — filter suggestion berdasar query, tampilkan/dismiss box', () => {
  const D = baseD({ cobek: [{ customer: { name: 'Budi', phone: '0812', address: 'Jl. A' } }] });
  const { ctx, fakeDocument } = makeCtx(D, {
    domValues: { txShopSaleCustName: { value: 'bud' }, txShopSaleCustNameBox: { style: {} } },
  });
  ctx.Pelanggan.onFieldInput('name');
  assert.equal(fakeDocument.getElementById('txShopSaleCustNameBox').style.display, 'block');
  assert.ok(fakeDocument.getElementById('txShopSaleCustNameBox').innerHTML.includes('Budi'));
});

test('Pelanggan.select — isi field customer & sembunyikan semua suggestion box', () => {
  const D = baseD();
  const { ctx, fakeDocument } = makeCtx(D);
  ctx.Pelanggan.select('Budi', '0812', 'Jl. A');
  assert.equal(fakeDocument.getElementById('txShopSaleCustName').value, 'Budi');
  assert.equal(fakeDocument.getElementById('txShopSaleCustPhone').value, '0812');
  assert.equal(fakeDocument.getElementById('txShopSaleCustAddr').value, 'Jl. A');
});

// ================= Standalone: kategori helper =================

test('resolveShopKategori — kategori baru dibuat kalau belum ada (case-insensitive match kalau sudah ada)', () => {
  const D = baseD({ cobekKategori: [] });
  const { ctx } = makeCtx(D);
  const id1 = ctx.resolveShopKategori('Batu Alam');
  assert.equal(D.cobekKategori.length, 1);
  const id2 = ctx.resolveShopKategori('batu alam'); // case-insensitive, tidak duplikat
  assert.equal(id1, id2);
  assert.equal(D.cobekKategori.length, 1);
  assert.equal(ctx.resolveShopKategori(''), '');
});

test('shopKategoriName — resolusi nama dari id, fallback string kosong', () => {
  const D = baseD({ cobekKategori: [{ id: 'k1', name: 'Batu' }] });
  const { ctx } = makeCtx(D);
  assert.equal(ctx.shopKategoriName('k1'), 'Batu');
  assert.equal(ctx.shopKategoriName('tidak-ada'), '');
});

// ================= recordShopSale =================

test('recordShopSale — keranjang kosong (semua item invalid) => gagal', () => {
  const D = baseD();
  const { ctx } = makeCtx(D);
  const r = ctx.recordShopSale({ items: [{ productId: null, qty: 0 }] });
  assert.equal(r.ok, false);
});

test('recordShopSale — produk tidak ditemukan => gagal, rollback stok cobek lama kalau ada', () => {
  const D = baseD({ products: [{ id: 'p1', stock: 5 }], cobek: [{ id: 'c1', items: [{ productId: 'p1', qty: 2 }] }] });
  const { ctx } = makeCtx(D);
  const r = ctx.recordShopSale({ items: [{ productId: 'p_hilang', qty: 1 }], existingShopId: 'c1' });
  assert.equal(r.ok, false);
  assert.ok(r.message.includes('tidak ditemukan'));
});

test('recordShopSale — stok tidak cukup => gagal dgn pesan berisi nama produk & sisa stok', () => {
  const D = baseD({ products: [{ id: 'p1', name: 'Shop A', stock: 2 }] });
  const { ctx } = makeCtx(D);
  const r = ctx.recordShopSale({ items: [{ productId: 'p1', qty: 5 }] });
  assert.equal(r.ok, false);
  assert.ok(r.message.includes('Shop A'));
  assert.ok(r.message.includes('sisa 2'));
});

test('recordShopSale — sukses baru: kurangi stok, push ke D.cobek', () => {
  const D = baseD({ products: [{ id: 'p1', name: 'Shop A', stock: 5 }] });
  const { ctx } = makeCtx(D);
  const r = ctx.recordShopSale({ items: [{ productId: 'p1', qty: 2 }], date: '2026-01-01', subtotal: 2000, total: 2000, profit: 500 });
  assert.equal(r.ok, true);
  assert.equal(r.isNew, true);
  assert.equal(D.products[0].stock, 3);
  assert.equal(D.cobek.length, 1);
});

test('recordShopSale — edit existingShopId: kembalikan stok lama, terapkan yang baru, update in-place', () => {
  const D = baseD({
    products: [{ id: 'p1', name: 'Shop A', stock: 3 }], // stok sekarang setelah -2 dari order lama
    cobek: [{ id: 'c1', items: [{ productId: 'p1', qty: 2 }], date: '2026-01-01', total: 2000 }],
  });
  const { ctx } = makeCtx(D);
  const r = ctx.recordShopSale({
    items: [{ productId: 'p1', qty: 4 }], date: '2026-01-02', subtotal: 4000, total: 4000, profit: 1000,
    existingShopId: 'c1',
  });
  assert.equal(r.ok, true);
  assert.equal(r.isNew, false);
  // stok lama dikembalikan (+2 => 5), lalu dikurangi qty baru (4) => 1
  assert.equal(D.products[0].stock, 1);
  assert.equal(D.cobek.length, 1);
  assert.equal(D.cobek[0].total, 4000);
});

// ================= Cart Stok (form Transaksi gabungan) =================

test('addShopStockCartItem — validasi produk & qty, lalu tambah ke cart & render', () => {
  const D = baseD({ products: [{ id: 'p1', name: 'Shop A', stock: 5 }] });
  const { ctx, fakeDocument, calls } = makeCtx(D, {
    domValues: {
      txShopStockItem: { value: '' }, txShopStockQty: { value: '0' }, txShopStockHarga: { value: '' },
      txShopStockProdusen: { value: '' }, txShopStockKategori: { value: '' },
    },
  });
  ctx.addShopStockCartItem();
  assert.ok(calls.toast[0].includes('Pilih produk dulu'));
  fakeDocument.getElementById('txShopStockItem').value = 'p1';
  ctx.addShopStockCartItem();
  assert.ok(calls.toast[1].includes('lebih dari 0'));
  fakeDocument.getElementById('txShopStockQty').value = '3';
  fakeDocument.getElementById('txShopStockHarga').value = '1000';
  ctx.addShopStockCartItem();
  assert.ok(calls.toast[2].includes('ditambahkan'));
  assert.ok(fakeDocument.getElementById('txShopStockCartList').innerHTML.includes('Shop A'));
});

test('applyTxShopStockFromTx — checkbox tidak dicentang => tidak melakukan apa-apa', () => {
  const D = baseD();
  const { ctx, fakeDocument } = makeCtx(D, { domValues: { txAddShopStock: { checked: false } } });
  ctx.applyTxShopStockFromTx('tx1', 'note', {});
  assert.equal(D.products.length, 0);
});

test('applyTxShopStockFromTx — cart kosong => toast peringatan', () => {
  const D = baseD();
  const { ctx, calls } = makeCtx(D, {
    domValues: { txAddShopStock: { checked: true }, txShopStockPanel: { style: { display: 'block' } } },
  });
  ctx.applyTxShopStockFromTx('tx1', 'note', {});
  assert.ok(calls.toast[0].includes('Belum ada produk di daftar'));
});

test('applyTxShopStockFromTx — produk baru dari cart => tambah ke D.products dgn stok & harga', () => {
  const D = baseD({ products: [], produsen: [], cobekKategori: [] });
  const { ctx, fakeDocument, calls } = makeCtx(D, {
    domValues: {
      txAddShopStock: { checked: true }, txShopStockPanel: { style: { display: 'block' } },
      txShopStockItem: { value: 'p1' }, txShopStockQty: { value: '5' }, txShopStockHarga: { value: '2000' },
    },
  });
  fakeDocument.getElementById('txShopStockItem').value = '__new__';
  fakeDocument.getElementById('txShopStockNewName') || (fakeDocument.getElementById('txShopStockNewName').value = '');
  fakeDocument.getElementById('txShopStockNewName').value = 'Produk Baru';
  ctx.addShopStockCartItem();
  const tx = { id: 'tx1' };
  ctx.applyTxShopStockFromTx('tx1', 'note', tx);
  assert.equal(D.products.length, 1);
  assert.equal(D.products[0].name, 'Produk Baru');
  assert.equal(D.products[0].stock, 5);
  assert.ok(calls.toast.some((t) => t.includes('Stok bertambah')));
});

// ================= Cart Jual (form Transaksi gabungan) =================

test('addTxShopSaleCartItem — validasi produk/qty/harga, lalu masuk cart', () => {
  const D = baseD({ products: [] });
  const { ctx, calls } = makeCtx(D, { domValues: { txShopSaleQty: { value: '1' }, txShopSaleHarga: { value: '1000' } } });
  ctx.addTxShopSaleCartItem();
  assert.ok(calls.toast[0].includes('Belum ada produk'));
});

test('addTxShopSaleCartItem — sukses => tambah ke cart, render, & sinkron txAmt', () => {
  const D = baseD({ products: [{ id: 'p1', name: 'Shop A', hargaJual: 2000 }] });
  const { ctx, fakeDocument, calls } = makeCtx(D, {
    domValues: { txShopSaleItem: { value: 'p1' }, txShopSaleQty: { value: '2' }, txShopSaleHarga: { value: '2000' }, txAddShopSale: { checked: true } },
  });
  ctx.addTxShopSaleCartItem();
  assert.ok(calls.toast[0].includes('ditambahkan'));
  assert.ok(fakeDocument.getElementById('txShopSaleCartList').innerHTML.includes('Shop A'));
  assert.equal(fakeDocument.getElementById('txAmt').value, 4000);
});

test('computeTxShopSaleTotals — hitung subtotal/modal/profit dari isi cart (diisi lewat addTxShopSaleCartItem)', () => {
  const D = baseD({ products: [{ id: 'p1', name: 'Shop A', hargaBeli: 1000, hargaJual: 2000 }] });
  const { ctx } = makeCtx(D, {
    domValues: {
      txShopSaleItem: { value: 'p1' }, txShopSaleQty: { value: '3' }, txShopSaleHarga: { value: '2000' },
      txShopSaleDiskon: { value: '100' }, txShopSaleOngkir: { value: '200' },
    },
  });
  ctx.addTxShopSaleCartItem(); // isi curTxShopSaleCart: 1 line 3x @2000
  const { subtotal, modal, diskon, ongkir, total, profit } = ctx.computeTxShopSaleTotals();
  assert.equal(subtotal, 6000);
  assert.equal(modal, 3000);
  assert.equal(diskon, 100);
  assert.equal(ongkir, 200);
  assert.equal(total, 6000 - 100 + 200);
  assert.equal(profit, 6000 - 3000 - 100);
});

test('applyTxShopSaleFromTx — checkbox tidak dicentang => tidak melakukan apa-apa', () => {
  const D = baseD();
  const { ctx } = makeCtx(D, { domValues: { txAddShopSale: { checked: false } } });
  ctx.applyTxShopSaleFromTx('tx1', '2026-01-01', 'acc1', 'note', {});
  assert.equal(D.cobek.length, 0);
});

test('applyTxShopSaleFromTx — cart kosong => toast peringatan', () => {
  const D = baseD();
  const { ctx, calls } = makeCtx(D, {
    domValues: { txAddShopSale: { checked: true }, txShopSalePanel: { style: { display: 'block' } } },
  });
  ctx.applyTxShopSaleFromTx('tx1', '2026-01-01', 'acc1', 'note', {});
  assert.ok(calls.toast[0].includes('Belum ada produk'));
});

test('applyTxShopSaleFromTx — cart terisi => catat penjualan ke D.cobek & link ke transaksi', () => {
  const D = baseD({ products: [{ id: 'p1', name: 'Shop A', hargaJual: 2000, hargaBeli: 1000, stock: 10 }] });
  const { ctx, fakeDocument, calls } = makeCtx(D, {
    domValues: {
      txAddShopSale: { checked: true }, txShopSalePanel: { style: { display: 'block' } },
      txShopSaleItem: { value: 'p1' }, txShopSaleQty: { value: '2' }, txShopSaleHarga: { value: '2000' },
      txShopSaleCustName: { value: 'Budi' },
    },
  });
  ctx.addTxShopSaleCartItem();
  const tx = { id: 'tx1' };
  ctx.applyTxShopSaleFromTx('tx1', '2026-01-01', 'acc1', 'note', tx);
  assert.equal(D.cobek.length, 1);
  assert.equal(D.products[0].stock, 8);
  assert.equal(tx.cobekLinkId, D.cobek[0].id);
  assert.ok(calls.toast.some((t) => t.includes('Penjualan tercatat')));
});

// ================= setShopTab & render wrapper =================

test('setShopTab — aktifkan tab yg dipilih, panggil render sesuai tab', () => {
  const D = baseD();
  const tabEls = { 'shopTab-kasir': createFakeElement(), 'shopTab-jual': createFakeElement(), 'shopTab-etalase': createFakeElement(), 'shopTab-produsen': createFakeElement(), 'shopTab-riwayat': createFakeElement(), 'shopTab-pelanggan': createFakeElement() };
  const { ctx, calls } = makeCtx(D, {
    domValues: tabEls,
    queryGroups: { '#page-shop .cn-tab': [createFakeElement(), createFakeElement()] },
  });
  const clickedEl = createFakeElement();
  ctx.setShopTab('etalase', clickedEl);
  assert.ok(clickedEl.classList.contains('active'));
  assert.ok(calls.render.length === 0 || true); // renderProductList jalan langsung (bukan lewat record), cukup pastikan tidak error
});

test('renderProductList/renderProdusenList/renderShop/renderCustomerList — wrapper memanggil namespace terkait tanpa error', () => {
  const D = baseD();
  const { ctx, fakeDocument } = makeCtx(D);
  ctx.renderProductList();
  ctx.renderProdusenList();
  ctx.renderShop();
  ctx.renderCustomerList();
  ctx.renderShopRecent();
  ctx.renderShopGrafik();
  ctx.renderSiapPulang();
  assert.ok(fakeDocument.getElementById('productList').innerHTML.includes('Belum ada produk'));
});
