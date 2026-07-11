'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadSource } = require('./helpers/loadSource');
const { createFakeDocument } = require('./helpers/fakeDom');

// _saveTxInner (transaksi.js) adalah fungsi utama form Tambah/Edit Transaksi
// Keuangan -- BELUM ada test otomatis sama sekali sebelumnya (lihat catatan
// "BELUM DIKERJAKAN" di CATATAN-CEK-CLAUDE.md: "Sinkronisasi BBM ↔
// Transaksi ↔ Car Notes: belum diuji ulang secara otomatis"). Di sini
// difokuskan HANYA ke jalur edit transaksi yang sudah tertaut ke catatan
// BBM (`existingTx.bbmLinkId`), krn di situ ditemukan bug nyata: field
// dasar (cost/date/accountId) di D.bbmLogs dulu CUMA ikut ter-update kalau
// checkbox "Sinkron ke Catatan Mobil" (txSyncBbm) masih tercentang saat
// simpan -- padahal utk link SEJENIS (servisLinkId), field dasar SELALU
// disinkron tanpa syarat. Kalau user matikan checkbox itu (atau kategori
// keluar dari BBM) sambil ubah jumlah/tanggal, Car Notes jadi basi
// (nilainya beda dari Keuangan) walau `bbmLinkId` masih menghubungkan
// keduanya. Test ini BUKAN test integrasi penuh (banyak dependency
// lintas-file di-stub), fokus ke jalur "tunai" (bukan cicilan/langganan)
// biar cakupannya jelas & bisa ditambah lagi nanti.

function txFormFields(overrides = {}) {
  return {
    txModal: { classList: { contains: () => true } },
    txAmt: { value: '' }, txSubCat: { value: '' }, txDate: { value: '2026-07-05' },
    txNote: { value: '' }, txCat: { value: 'Vario 125' }, txAcc: { value: 'acc1' },
    // panel/checkbox BBM: default OFF (checkbox tidak dicentang, panel disembunyikan)
    // -- ini SENGAJA mensimulasikan kasus bug: user edit transaksi yang SUDAH
    // tertaut BBM, tapi checkbox sync tidak aktif saat simpan.
    txSyncBbm: { checked: false },
    txBbmPanel: { style: { display: 'none' } },
    txAddStock: { checked: false }, txStockPanel: { style: { display: 'none' } },
    txAddCobekStock: { checked: false }, txCobekStockPanel: { style: { display: 'none' } },
    txAddCobekSale: { checked: false }, txCobekSalePanel: { style: { display: 'none' } },
    ...overrides,
  };
}

function loadSaveTx(D, opts = {}) {
  const fakeDocument = createFakeDocument(txFormFields(opts.domValues));
  const toasts = [];
  const calls = { save: 0, closeModal: null };
  const ctx = loadSource(['tx-bbm.js', 'tx-stok-sparepart.js', 'transaksi.js'], {
    D,
    document: fakeDocument,
    curTxType: opts.curTxType || 'expense',
    curPayMethod: opts.curPayMethod || 'tunai',
    txEditId: opts.txEditId !== undefined ? opts.txEditId : null,
    _txCatLearnSource: null,
    uid: () => 'uid-new',
    toast: (msg) => toasts.push(msg),
    save: () => { calls.save++; },
    closeModal: (id) => { calls.closeModal = id; },
    renderDashboard: () => {}, renderKeuangan: () => {}, renderBillList: () => {},
    checkBills: () => {}, renderCnTab: () => {}, renderProductList: () => {},
    renderCobek: () => {}, renderCobekRecent: () => {},
    evalAmtExpr: () => {},
    findPossibleDuplicateTx: () => null,
    rememberLastAccForCat: () => {},
    learnCatFromItemName: () => {},
    applyTxCobekStockFromTx: () => {},
    applyTxCobekSaleFromTx: () => {},
    askConfirm: async () => true,
    escapeHtml: (s) => String(s === null || s === undefined ? '' : s),
    codeFromName: (name) => (name || '').slice(0, 3).toUpperCase(),
    WorthIt: { applyBuyLink: () => {}, onLinkedTxEdited: () => {} },
    SewaKios: { applyPaymentLink: () => {}, onLinkedTxEdited: () => {} },
    Tukang: { applyPendingPayment: () => {} },
    Renov: { onLinkedTxEdited: () => {} },
  });
  return { saveTxInner: ctx._saveTxInner, D, fakeDocument, toasts, calls };
}

function baseD(overrides = {}) {
  return {
    transactions: [], bbmLogs: [], servisLogs: [], bills: [], products: [], cobek: [],
    sparepartCats: [], partsStock: [], vehicles: [{ id: 'veh1', name: 'Vario 125' }],
    accounts: [{ id: 'acc1' }, { id: 'acc2' }],
    categories: { income: [], expense: [{ id: 'cat1', name: 'Vario 125', subs: [] }] },
    ...overrides,
  };
}

test('_saveTxInner — BUGFIX: edit transaksi ber-bbmLinkId dgn checkbox "Sinkron BBM" MATI => cost/date/accountId di D.bbmLogs tetap ikut ter-update (tidak basi)', async () => {
  const D = baseD({
    transactions: [{ id: 'tx1', type: 'expense', amount: 40000, category: 'Vario 125', subcategory: 'Bensin', accountId: 'acc1', payMethod: 'tunai', note: 'BBM Vario 125', date: '2026-06-01', bbmLinkId: 'bbm1' }],
    bbmLogs: [{ id: 'bbm1', vehicleId: 'veh1', date: '2026-06-01', km: 5000, liter: 4, harga: 10000, cost: 40000, spbu: 'Shell', fullTank: false, note: '', accountId: 'acc1', txLinkId: 'tx1' }],
  });
  const { saveTxInner, toasts } = loadSaveTx(D, {
    txEditId: 'tx1',
    domValues: { txAmt: { value: '55000' }, txDate: { value: '2026-07-05' }, txAcc: { value: 'acc2' }, txSyncBbm: { checked: false } },
  });
  await saveTxInner();
  // transaksi sendiri ter-update (perilaku lama, tidak berubah)
  assert.equal(D.transactions[0].amount, 55000);
  assert.equal(D.transactions[0].date, '2026-07-05');
  // BUGFIX: catatan BBM terkait HARUS ikut sinkron field dasarnya, walau checkbox mati
  const bbm = D.bbmLogs.find((b) => b.id === 'bbm1');
  assert.equal(bbm.cost, 55000);
  assert.equal(bbm.date, '2026-07-05');
  assert.equal(bbm.accountId, 'acc2');
  // field detail BBM (km/liter/spbu) TIDAK disentuh krn checkbox mati -- tetap nilai lama
  assert.equal(bbm.km, 5000);
  assert.equal(bbm.liter, 4);
  assert.equal(bbm.spbu, 'Shell');
  assert.doesNotMatch(toasts.join('|'), /tersinkron ke Catatan Mobil/); // pesan sync detail TIDAK muncul, krn cuma sync dasar yg jalan
});

test('_saveTxInner — edit transaksi ber-bbmLinkId dgn checkbox "Sinkron BBM" NYALA => field dasar & field detail BBM dua2nya ter-update', async () => {
  const D = baseD({
    transactions: [{ id: 'tx1', type: 'expense', amount: 40000, category: 'Vario 125', subcategory: 'Bensin', accountId: 'acc1', payMethod: 'tunai', note: 'BBM Vario 125', date: '2026-06-01', bbmLinkId: 'bbm1' }],
    bbmLogs: [{ id: 'bbm1', vehicleId: 'veh1', date: '2026-06-01', km: 5000, liter: 4, harga: 10000, cost: 40000, spbu: 'Shell', fullTank: false, note: '', accountId: 'acc1', txLinkId: 'tx1' }],
  });
  const { saveTxInner } = loadSaveTx(D, {
    txEditId: 'tx1',
    domValues: {
      txAmt: { value: '55000' }, txDate: { value: '2026-07-05' }, txAcc: { value: 'acc2' },
      txSyncBbm: { checked: true }, txBbmPanel: { style: { display: 'block' } },
      txBbmKm: { value: '5300' }, txBbmLiter: { value: '5' }, txBbmHargaL: { value: '11000' },
      txBbmSpbu: { value: 'Pertamina' }, txBbmFull: { checked: true }, txBbmVehicle: { value: 'veh1' },
    },
  });
  await saveTxInner();
  const bbm = D.bbmLogs.find((b) => b.id === 'bbm1');
  assert.equal(bbm.cost, 55000);
  assert.equal(bbm.km, 5300); // field detail ikut ter-update krn checkbox nyala
  assert.equal(bbm.liter, 5);
  assert.equal(bbm.spbu, 'Pertamina');
});

test('_saveTxInner — edit transaksi TANPA bbmLinkId => tidak nyentuh D.bbmLogs sama sekali', async () => {
  const D = baseD({
    transactions: [{ id: 'tx1', type: 'expense', amount: 40000, category: 'Vario 125', accountId: 'acc1', payMethod: 'tunai', note: '', date: '2026-06-01' }],
  });
  const { saveTxInner } = loadSaveTx(D, {
    txEditId: 'tx1',
    domValues: { txAmt: { value: '55000' } },
  });
  await saveTxInner();
  assert.equal(D.bbmLogs.length, 0);
});
