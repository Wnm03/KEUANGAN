'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadSource } = require('./helpers/loadSource');
const { createFakeDocument } = require('./helpers/fakeDom');

// tx-transfer.js — logic modal "Transfer Antar Akun" (openTransferModal,
// saveTransfer). Beda dari tx-cobek.js (bagian ke-17, murni tanpa DOM), dua
// fungsi di sini BACA/TULIS DOM langsung (getElementById) jadi dites pakai
// fakeDom, pola sama seperti tests/refleksi-selfcare.test.js. Sebelumnya nol
// test sama sekali (lihat daftar modul di CLAUDE.md bagian ke-13/ke-17).
// Dipilih sbg saran RINGAN berikutnya krn file cuma 32 baris, 2 fungsi,
// tidak ada kripto/timer/async rumit -- setara "ringan" dgn tx-cobek.js,
// cuma butuh tambahan fakeDom drpd murni logic.

function makeTransfer(D, stubs = {}, docOverrides = {}) {
  const fakeDocument = createFakeDocument(docOverrides);
  const toasts = [];
  const calls = { populateAccFilters: 0, openModal: [], closeModal: [], renderDashboard: 0, renderKeuangan: 0 };
  const ctx = loadSource(['helper-teks.js', 'tx-transfer.js'], {
    D,
    document: fakeDocument,
    save: stubs.save || (() => {}),
    toast: stubs.toast || ((msg) => toasts.push(msg)),
    uid: stubs.uid || (() => 'uid-' + Math.random().toString(36).slice(2)),
    populateAccFilters: stubs.populateAccFilters || (() => { calls.populateAccFilters++; }),
    openModal: stubs.openModal || ((id) => { calls.openModal.push(id); }),
    closeModal: stubs.closeModal || ((id) => { calls.closeModal.push(id); }),
    renderDashboard: stubs.renderDashboard || (() => { calls.renderDashboard++; }),
    renderKeuangan: stubs.renderKeuangan || (() => { calls.renderKeuangan++; }),
    // evalAmtExpr biasanya mengevaluasi ekspresi matematis di kolom jumlah
    // (mis. "50000+20000") lalu overwrite value elemen itu jadi hasil
    // angkanya -- di sini di-stub no-op supaya nilai .value yg sudah kita isi
    // manual di fakeDom tidak diubah, karena bukan itu yg lagi dites di sini.
    evalAmtExpr: stubs.evalAmtExpr || (() => {}),
  });
  return { openTransferModal: ctx.openTransferModal, saveTransfer: ctx.saveTransfer, fakeDocument, toasts, calls };
}

function baseD(overrides = {}) {
  return {
    accounts: [
      { id: 'a1', name: 'Kas' },
      { id: 'a2', name: 'Bank BCA' },
    ],
    transactions: [],
    ...overrides,
  };
}

// ================= openTransferModal =================

test('openTransferModal — reset trAmt & trNote jadi kosong, trDate jadi tanggal hari ini (ISO, tanpa jam)', () => {
  const D = baseD();
  const { openTransferModal, fakeDocument } = makeTransfer(D, {}, {
    trAmt: { value: '123' },
    trNote: { value: 'catatan lama' },
  });
  openTransferModal();
  assert.equal(fakeDocument.getElementById('trAmt').value, '');
  assert.equal(fakeDocument.getElementById('trNote').value, '');
  const today = new Date().toISOString().split('T')[0];
  assert.equal(fakeDocument.getElementById('trDate').value, today);
});

test('openTransferModal — manggil populateAccFilters() & openModal("transferModal")', () => {
  const D = baseD();
  const { openTransferModal, calls } = makeTransfer(D);
  openTransferModal();
  assert.equal(calls.populateAccFilters, 1);
  assert.deepEqual(calls.openModal, ['transferModal']);
});

test('openTransferModal — akun >1 => trTo.selectedIndex diarahkan ke index 1 (akun kedua, beda dari default akun pertama)', () => {
  const D = baseD();
  const { openTransferModal, fakeDocument } = makeTransfer(D);
  openTransferModal();
  assert.equal(fakeDocument.getElementById('trTo').selectedIndex, 1);
});

test('openTransferModal — akun cuma 1 (atau 0) => trTo.selectedIndex TIDAK disentuh (tidak ada akun tujuan lain)', () => {
  const D = baseD({ accounts: [{ id: 'a1', name: 'Kas' }] });
  const { openTransferModal, fakeDocument } = makeTransfer(D, {}, { trTo: { selectedIndex: -1 } });
  openTransferModal();
  assert.equal(fakeDocument.getElementById('trTo').selectedIndex, -1);
});

// ================= saveTransfer =================

function docForSave(overrides = {}) {
  return {
    trFrom: { value: 'a1' },
    trTo: { value: 'a2' },
    trAmt: { value: '50000' },
    trNote: { value: '' },
    trDate: { value: '2026-07-11' },
    ...overrides,
  };
}

test('saveTransfer — jumlah kosong/nol => ditolak dgn toast, TIDAK menambah transaksi', () => {
  const D = baseD();
  const { saveTransfer, toasts } = makeTransfer(D, {}, docForSave({ trAmt: { value: '' } }));
  saveTransfer();
  assert.equal(D.transactions.length, 0);
  assert.match(toasts[0], /jumlah valid/);
});

test('saveTransfer — jumlah negatif => ditolak dgn toast', () => {
  const D = baseD();
  const { saveTransfer, toasts } = makeTransfer(D, {}, docForSave({ trAmt: { value: '-100' } }));
  saveTransfer();
  assert.equal(D.transactions.length, 0);
  assert.match(toasts[0], /jumlah valid/);
});

test('saveTransfer — akun asal & tujuan sama => ditolak dgn toast, TIDAK menambah transaksi', () => {
  const D = baseD();
  const { saveTransfer, toasts } = makeTransfer(D, {}, docForSave({ trFrom: { value: 'a1' }, trTo: { value: 'a1' } }));
  saveTransfer();
  assert.equal(D.transactions.length, 0);
  assert.match(toasts[0], /harus berbeda/);
});

test('saveTransfer — valid => menambah TEPAT 2 transaksi (transfer_out dari akun asal, transfer_in ke akun tujuan), jumlah & tanggal sama persis', () => {
  const D = baseD();
  const { saveTransfer } = makeTransfer(D, {}, docForSave());
  saveTransfer();
  assert.equal(D.transactions.length, 2);
  const out = D.transactions.find((t) => t.type === 'transfer_out');
  const inn = D.transactions.find((t) => t.type === 'transfer_in');
  assert.ok(out && inn);
  assert.equal(out.accountId, 'a1');
  assert.equal(inn.accountId, 'a2');
  assert.equal(out.amount, 50000);
  assert.equal(inn.amount, 50000);
  assert.equal(out.date, '2026-07-11');
  assert.equal(inn.date, '2026-07-11');
  assert.equal(out.category, 'Transfer');
  assert.equal(inn.category, 'Transfer');
});

test('saveTransfer — catatan kosong => default "Transfer", diselipkan nama akun tujuan/asal di note masing2 sisi', () => {
  const D = baseD();
  const { saveTransfer } = makeTransfer(D, {}, docForSave({ trNote: { value: '' } }));
  saveTransfer();
  const out = D.transactions.find((t) => t.type === 'transfer_out');
  const inn = D.transactions.find((t) => t.type === 'transfer_in');
  assert.equal(out.note, 'Transfer → Bank BCA');
  assert.equal(inn.note, 'Transfer ← Kas');
});

test('saveTransfer — catatan diisi user => dipertahankan, bukan ditimpa default', () => {
  const D = baseD();
  const { saveTransfer } = makeTransfer(D, {}, docForSave({ trNote: { value: 'Bayar utang' } }));
  saveTransfer();
  const out = D.transactions.find((t) => t.type === 'transfer_out');
  assert.equal(out.note, 'Bayar utang → Bank BCA');
});

test('saveTransfer — nama akun di note di-escape (escapeHtml), aman dari karakter HTML di nama akun', () => {
  const D = baseD({ accounts: [
    { id: 'a1', name: 'Kas' },
    { id: 'a2', name: '<b>Bank</b> & Co' },
  ] });
  const { saveTransfer } = makeTransfer(D, {}, docForSave());
  saveTransfer();
  const out = D.transactions.find((t) => t.type === 'transfer_out');
  assert.doesNotMatch(out.note, /<b>/);
  assert.match(out.note, /&lt;b&gt;/);
});

test('saveTransfer — valid => memanggil save(), closeModal("transferModal"), renderDashboard(), renderKeuangan(), dan toast sukses', () => {
  const D = baseD();
  let saveCalled = 0;
  const { saveTransfer, calls, toasts } = makeTransfer(D, { save: () => { saveCalled++; } }, docForSave());
  saveTransfer();
  assert.equal(saveCalled, 1);
  assert.deepEqual(calls.closeModal, ['transferModal']);
  assert.equal(calls.renderDashboard, 1);
  assert.equal(calls.renderKeuangan, 1);
  assert.match(toasts[0], /berhasil/);
});
