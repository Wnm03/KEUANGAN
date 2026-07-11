'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadSource } = require('./helpers/loadSource');
const { createFakeDocument } = require('./helpers/fakeDom');

// Cakupan file ini: seluruh fungsi di akun.js —
// recalcAccBalance/populateAccFilters/linkedAssetAccountIds/
// isAccLinkedToAsset/totalSaldoAkun/quickToggleInclude/openAccModal/
// toggleAccInclude/updateAccIncludeBtn/saveAcc(_saveAccInner)/delAcc.
// Sama seperti akun.js sendiri (CRUD + filter dropdown akun dipakai di
// banyak tempat), test ini pakai fakeDocument + stub semua dependency
// lintas-file (renderAccGrid/renderDashAccList/renderLapAccList/
// renderDashboard/renderKeuangan/refreshBillEverywhere/renderCnTab/
// populateKeuFilters), BUKAN test integrasi lintas file sungguhan.
// `saveAcc` sendiri (pembungkus withSaveGuard) SENGAJA tidak dites —
// _saveAccInner dites langsung (pola sama dgn bbm-saveinner.test.js/
// servis-calc.test.js), withSaveGuard-nya sudah generic & dipakai di
// banyak modul lain.

function accFields(overrides = {}) {
  return {
    accModalTitle: {}, accName: { value: '' }, accEmoji: { value: '' },
    accBalance: { value: '' }, accBalanceLabel: {}, accBalanceHint: { style: {} },
    accLinkedAssetHint: { style: {} }, accIncludeBtn: {},
    fAcc: {}, txAcc: {}, trFrom: {}, trTo: {}, wrAcc: {}, tAcc: { value: '' },
    assetAccId: { value: '' },
    ...overrides,
  };
}

function makeAkun(D, opts = {}) {
  const fakeDocument = createFakeDocument(accFields(opts.domValues));
  const calls = { save: 0, toast: [], render: [] };
  const record = (name) => () => calls.render.push(name);
  const ctx = loadSource(['akun.js'], {
    D,
    document: fakeDocument,
    escapeHtml: (s) => String(s == null ? '' : s),
    populateKeuFilters: opts.populateKeuFilters || record('populateKeuFilters'),
    renderAccGrid: opts.renderAccGrid || record('renderAccGrid'),
    renderDashAccList: opts.renderDashAccList || record('renderDashAccList'),
    renderLapAccList: opts.renderLapAccList || record('renderLapAccList'),
    renderDashboard: opts.renderDashboard || record('renderDashboard'),
    renderKeuangan: opts.renderKeuangan || record('renderKeuangan'),
    refreshBillEverywhere: opts.refreshBillEverywhere || record('refreshBillEverywhere'),
    renderCnTab: opts.renderCnTab || record('renderCnTab'),
    save: () => { calls.save++; },
    toast: (msg) => calls.toast.push(msg),
    openModal: opts.openModal || record('openModal'),
    closeModal: opts.closeModal || record('closeModal'),
    askConfirm: opts.askConfirm || (async () => true),
  });
  return { ctx, fakeDocument, calls };
}

// ================= recalcAccBalance =================

test('recalcAccBalance — akun tidak ditemukan -> 0', () => {
  const D = { accounts: [], transactions: [] };
  const { ctx } = makeAkun(D);
  assert.equal(ctx.recalcAccBalance('nope'), 0);
});

test('recalcAccBalance — baseBalance + income/expense/transfer_in/transfer_out akun terkait saja', () => {
  const D = {
    accounts: [{ id: 'a1', baseBalance: 100000 }],
    transactions: [
      { accountId: 'a1', type: 'income', amount: 50000 },
      { accountId: 'a1', type: 'expense', amount: 20000 },
      { accountId: 'a1', type: 'transfer_in', amount: 10000 },
      { accountId: 'a1', type: 'transfer_out', amount: 5000 },
      { accountId: 'a2', type: 'income', amount: 999999 }, // akun lain, diabaikan
    ],
  };
  const { ctx } = makeAkun(D);
  // 100000 + 50000 - 20000 + 10000 - 5000 = 135000
  assert.equal(ctx.recalcAccBalance('a1'), 135000);
});

test('recalcAccBalance — fallback ke acc.balance kalau baseBalance undefined', () => {
  const D = { accounts: [{ id: 'a1', balance: 70000 }], transactions: [] };
  const { ctx } = makeAkun(D);
  assert.equal(ctx.recalcAccBalance('a1'), 70000);
});

// ================= populateAccFilters =================

test('populateAccFilters — isi opsi ke semua dropdown & panggil populateKeuFilters', () => {
  const D = { accounts: [{ id: 'a1', emoji: '💰', name: 'Cash' }, { id: 'a2', emoji: '🏦', name: 'Bank' }] };
  const { ctx, fakeDocument, calls } = makeAkun(D);
  ctx.populateAccFilters();
  assert.match(fakeDocument.getElementById('fAcc').innerHTML, /Semua Akun/);
  assert.match(fakeDocument.getElementById('fAcc').innerHTML, /Cash/);
  assert.match(fakeDocument.getElementById('txAcc').innerHTML, /Bank/);
  assert.match(fakeDocument.getElementById('trFrom').innerHTML, /Cash/);
  assert.match(fakeDocument.getElementById('trTo').innerHTML, /Bank/);
  assert.match(fakeDocument.getElementById('wrAcc').innerHTML, /Cash/);
  assert.ok(calls.render.includes('populateKeuFilters'));
});

test('populateAccFilters — tAcc & assetAccId pakai placeholder "tidak terkait" & pertahankan value lama', () => {
  const D = { accounts: [{ id: 'a1', emoji: '💰', name: 'Cash' }] };
  const { ctx, fakeDocument } = makeAkun(D, { domValues: { tAcc: { value: 'a1' }, assetAccId: { value: 'a1' } } });
  ctx.populateAccFilters();
  const tAcc = fakeDocument.getElementById('tAcc');
  assert.match(tAcc.innerHTML, /Tidak terkait akun/);
  assert.equal(tAcc.value, 'a1'); // value lama dipertahankan
  const assetAccId = fakeDocument.getElementById('assetAccId');
  assert.match(assetAccId.innerHTML, /Tidak ditautkan/);
  assert.equal(assetAccId.value, 'a1');
});

test('populateAccFilters — aman kalau sebagian elemen dropdown tidak ada (guard "if(el)")', () => {
  // createFakeDocument selalu bikin elemen kosong utk id apa pun yg diakses
  // (lihat fakeDom.js ensure()), jadi "tidak ada" di sini disimulasikan lewat
  // guard di kode itu sendiri tetap harus tidak error walau dipanggil.
  const D = { accounts: [] };
  const { ctx } = makeAkun(D);
  assert.doesNotThrow(() => ctx.populateAccFilters());
});

// ================= linkedAssetAccountIds / isAccLinkedToAsset =================

test('linkedAssetAccountIds — kumpulkan accountId dari D.assets yg ditautkan', () => {
  const D = { assets: [{ accountId: 'a1' }, { accountId: null }, { accountId: 'a2' }] };
  const { ctx } = makeAkun(D);
  const set = ctx.linkedAssetAccountIds();
  assert.ok(set.has('a1'));
  assert.ok(set.has('a2'));
  assert.equal(set.size, 2);
});

test('linkedAssetAccountIds — D.assets kosong/tidak ada -> set kosong', () => {
  const { ctx } = makeAkun({});
  assert.equal(ctx.linkedAssetAccountIds().size, 0);
});

test('isAccLinkedToAsset — true kalau id ada di set tertaut, false kalau tidak', () => {
  const D = { assets: [{ accountId: 'a1' }] };
  const { ctx } = makeAkun(D);
  assert.equal(ctx.isAccLinkedToAsset('a1'), true);
  assert.equal(ctx.isAccLinkedToAsset('a9'), false);
});

// ================= totalSaldoAkun =================

test('totalSaldoAkun — jumlah saldo akun includeInBalance!==false & TIDAK ditautkan aset', () => {
  const D = {
    accounts: [
      { id: 'a1', baseBalance: 100000 },
      { id: 'a2', baseBalance: 200000, includeInBalance: false }, // dikecualikan manual
      { id: 'a3', baseBalance: 300000 }, // ditautkan aset, dikecualikan otomatis
    ],
    assets: [{ accountId: 'a3' }],
    transactions: [],
  };
  const { ctx } = makeAkun(D);
  assert.equal(ctx.totalSaldoAkun(), 100000);
});

// ================= quickToggleInclude =================

test('quickToggleInclude — akun ditautkan aset & masih included -> blok, toast peringatan, tidak toggle', () => {
  const D = { accounts: [{ id: 'a1', includeInBalance: true }], assets: [{ accountId: 'a1' }], transactions: [] };
  const { ctx, calls } = makeAkun(D);
  ctx.quickToggleInclude('a1');
  assert.equal(D.accounts[0].includeInBalance, true);
  assert.equal(calls.save, 0);
  assert.ok(calls.toast[0].includes('dikecualikan otomatis'));
});

test('quickToggleInclude — akun ditautkan aset TAPI sudah dikecualikan manual -> boleh toggle balik (jadi included)', () => {
  const D = { accounts: [{ id: 'a1', includeInBalance: false }], assets: [{ accountId: 'a1' }], transactions: [] };
  const { ctx, calls } = makeAkun(D);
  ctx.quickToggleInclude('a1');
  assert.equal(D.accounts[0].includeInBalance, true);
  assert.equal(calls.save, 1);
  assert.ok(calls.render.includes('renderLapAccList'));
  assert.ok(calls.render.includes('renderDashAccList'));
  assert.ok(calls.render.includes('renderAccGrid'));
});

test('quickToggleInclude — akun biasa (tidak ditautkan) -> toggle bebas', () => {
  const D = { accounts: [{ id: 'a1', includeInBalance: true }], transactions: [] };
  const { ctx } = makeAkun(D);
  ctx.quickToggleInclude('a1');
  assert.equal(D.accounts[0].includeInBalance, false);
});

test('quickToggleInclude — id tidak ditemukan -> no-op tanpa error', () => {
  const D = { accounts: [], transactions: [] };
  const { ctx, calls } = makeAkun(D);
  assert.doesNotThrow(() => ctx.quickToggleInclude('nope'));
  assert.equal(calls.save, 0);
});

// ================= openAccModal / toggleAccInclude / updateAccIncludeBtn =================

test('openAccModal — mode tambah (tanpa idx): field kosong/default, editAccIdx=-1, tombol include aktif', () => {
  const D = { accounts: [] };
  const { ctx, fakeDocument } = makeAkun(D);
  ctx.openAccModal();
  assert.equal(fakeDocument.getElementById('accModalTitle').textContent, 'Tambah Akun');
  assert.equal(fakeDocument.getElementById('accName').value, '');
  assert.equal(fakeDocument.getElementById('accEmoji').value, '💰');
  assert.equal(fakeDocument.getElementById('accBalanceLabel').textContent, 'Saldo Awal (Rp)');
  assert.equal(fakeDocument.getElementById('accBalanceHint').style.display, 'none');
  const btn = fakeDocument.getElementById('accIncludeBtn');
  assert.equal(btn.classList.contains('active'), true);
  assert.equal(btn.textContent, '✓ Aktif');
});

test('openAccModal — mode edit: prefill dari akun, label "Saldo Sekarang", hint ditautkan aset kalau relevan, editAccIdx tersimpan (dibuktikan lewat _saveAccInner)', () => {
  const D = {
    accounts: [{ id: 'a1', name: 'Cash', emoji: '💵', baseBalance: 50000, includeInBalance: false }],
    assets: [{ accountId: 'a1' }],
    transactions: [],
  };
  const { ctx, fakeDocument } = makeAkun(D, { domValues: { accName: { value: 'Cash' }, accEmoji: { value: '💵' }, accBalance: { value: '50000' } } });
  ctx.openAccModal(0);
  assert.equal(fakeDocument.getElementById('accModalTitle').textContent, 'Edit Akun');
  assert.equal(fakeDocument.getElementById('accName').value, 'Cash');
  assert.equal(fakeDocument.getElementById('accEmoji').value, '💵');
  assert.equal(fakeDocument.getElementById('accBalance').value, 50000);
  assert.equal(fakeDocument.getElementById('accBalanceLabel').textContent, 'Saldo Sekarang (Rp)');
  assert.equal(fakeDocument.getElementById('accBalanceHint').style.display, 'block');
  assert.equal(fakeDocument.getElementById('accLinkedAssetHint').style.display, 'block');
  assert.equal(fakeDocument.getElementById('accIncludeBtn').textContent, '✕ Nonaktif');
  // Buktikan editAccIdx benar2 tersimpan sbg 0 (bukan -1/tambah-baru): simpan
  // harus UPDATE akun index 0, bukan nambah akun baru.
  ctx._saveAccInner();
  assert.equal(D.accounts.length, 1);
  assert.equal(D.accounts[0].id, 'a1');
});

test('toggleAccInclude/updateAccIncludeBtn — membalik state & update tampilan tombol (dibuktikan lewat _saveAccInner)', () => {
  const D = { accounts: [{ id: 'a1', name: 'Cash', emoji: '💵', includeInBalance: true }], transactions: [] };
  const { ctx, fakeDocument } = makeAkun(D);
  ctx.openAccModal(0);
  assert.equal(fakeDocument.getElementById('accIncludeBtn').textContent, '✓ Aktif');
  ctx.toggleAccInclude();
  assert.equal(fakeDocument.getElementById('accIncludeBtn').textContent, '✕ Nonaktif');
  ctx.toggleAccInclude();
  assert.equal(fakeDocument.getElementById('accIncludeBtn').textContent, '✓ Aktif');
  // Toggle sekali lagi ke nonaktif, lalu simpan -> includeInBalance harus false.
  ctx.toggleAccInclude();
  ctx._saveAccInner();
  assert.equal(D.accounts[0].includeInBalance, false);
});

test('updateAccIncludeBtn — aman no-op kalau tombolnya tidak ada', () => {
  const D = { accounts: [] };
  const { ctx, fakeDocument } = makeAkun(D, { domValues: { accIncludeBtn: undefined } });
  // fakeDom selalu bikin elemen; simulasikan "tidak ada" via getElementById custom.
  fakeDocument.getElementById = () => null;
  assert.doesNotThrow(() => ctx.updateAccIncludeBtn());
});

// ================= _saveAccInner =================

test('_saveAccInner — nama kosong -> toast peringatan, tidak nambah akun', () => {
  const D = { accounts: [] };
  const { ctx, calls } = makeAkun(D, { domValues: { accName: { value: '  ' } } });
  ctx._saveAccInner();
  assert.equal(D.accounts.length, 0);
  assert.ok(calls.toast[0].includes('Isi nama akun'));
});

test('_saveAccInner — tambah akun baru (editAccIdx default -1)', () => {
  const D = { accounts: [], transactions: [] };
  const { ctx, calls } = makeAkun(D, { domValues: { accName: { value: 'Bank BCA' }, accEmoji: { value: '🏦' }, accBalance: { value: '500000' } } });
  ctx._saveAccInner();
  assert.equal(D.accounts.length, 1);
  assert.equal(D.accounts[0].name, 'Bank BCA');
  assert.equal(D.accounts[0].emoji, '🏦');
  assert.equal(D.accounts[0].baseBalance, 500000);
  assert.equal(D.accounts[0].balance, 500000);
  assert.equal(calls.save, 1);
  assert.ok(calls.render.includes('renderAccGrid'));
  assert.ok(calls.render.includes('populateKeuFilters')); // via populateAccFilters
  assert.ok(calls.toast[0].includes('ditambahkan'));
});

test('_saveAccInner — emoji kosong fallback ke 💰 saat tambah baru', () => {
  const D = { accounts: [], transactions: [] };
  const { ctx } = makeAkun(D, { domValues: { accName: { value: 'X' }, accEmoji: { value: '' }, accBalance: { value: '0' } } });
  ctx._saveAccInner();
  assert.equal(D.accounts[0].emoji, '💰');
});

test('_saveAccInner — edit akun: baseBalance dihitung ulang supaya saldo tampil = nominal baru, meski ada transaksi', () => {
  const D = {
    accounts: [{ id: 'a1', name: 'Cash', emoji: '💵', baseBalance: 100000, includeInBalance: true }],
    transactions: [{ accountId: 'a1', type: 'income', amount: 50000 }], // saldo berjalan = 150000
  };
  const { ctx, fakeDocument } = makeAkun(D);
  ctx.openAccModal(0); // set editAccIdx=0 (module-scoped let, harus lewat fungsi resminya)
  fakeDocument.getElementById('accName').value = 'Cash Edit';
  fakeDocument.getElementById('accEmoji').value = '💴';
  fakeDocument.getElementById('accBalance').value = '200000';
  ctx._saveAccInner();
  const a = D.accounts[0];
  assert.equal(a.name, 'Cash Edit');
  assert.equal(a.emoji, '💴');
  // txDelta = 150000(recalc lama) - 100000(baseBalance lama) = 50000
  // baseBalance baru = nominal(200000) - txDelta(50000) = 150000
  assert.equal(a.baseBalance, 150000);
  assert.equal(a.balance, 200000);
  // saldo berjalan sesudahnya harus = nominal yg diinput user (200000)
  assert.equal(ctx.recalcAccBalance('a1'), 200000);
});

test('_saveAccInner — edit akun: includeInBalance mengikuti accIncludeState saat ini', () => {
  const D = { accounts: [{ id: 'a1', name: 'Cash', emoji: '💵', baseBalance: 0, includeInBalance: true }], transactions: [] };
  const { ctx, calls } = makeAkun(D, { domValues: { accName: { value: 'Cash' }, accEmoji: { value: '💵' }, accBalance: { value: '0' } } });
  ctx.openAccModal(0); // includeInBalance:true -> accIncludeState awal true
  ctx.toggleAccInclude(); // balik ke false
  ctx._saveAccInner();
  assert.equal(D.accounts[0].includeInBalance, false);
  assert.ok(calls.toast[0].includes('diperbarui'));
});

// ================= delAcc =================

test('delAcc — cuma 1 akun -> ditolak, toast peringatan, tidak hapus', async () => {
  const D = { accounts: [{ id: 'a1' }], transactions: [] };
  const { ctx, calls } = makeAkun(D);
  await ctx.delAcc(0);
  assert.equal(D.accounts.length, 1);
  assert.ok(calls.toast[0].includes('Minimal 1 akun'));
});

test('delAcc — user batal konfirmasi -> tidak jadi hapus', async () => {
  const D = { accounts: [{ id: 'a1' }, { id: 'a2' }], transactions: [] };
  const { ctx, calls } = makeAkun(D, { askConfirm: async () => false });
  await ctx.delAcc(0);
  assert.equal(D.accounts.length, 2);
  assert.equal(calls.save, 0);
});

test('delAcc — hapus & pindahkan semua data terkait (transaksi/tagihan/BBM/servis/shop) ke akun fallback', async () => {
  const D = {
    accounts: [{ id: 'a1', name: 'Cash' }, { id: 'a2', name: 'Bank' }],
    transactions: [{ accountId: 'a1' }, { accountId: 'a2' }],
    bills: [{ accountId: 'a1' }],
    bbmLogs: [{ accountId: 'a1' }],
    servisLogs: [{ accountId: 'a1' }],
    cobek: [{ accountId: 'a1' }],
  };
  const { ctx, calls } = makeAkun(D);
  await ctx.delAcc(0);
  assert.equal(D.accounts.length, 1);
  assert.equal(D.accounts[0].id, 'a2');
  assert.equal(D.transactions[0].accountId, 'a2'); // dipindah
  assert.equal(D.transactions[1].accountId, 'a2'); // tetap
  assert.equal(D.bills[0].accountId, 'a2');
  assert.equal(D.bbmLogs[0].accountId, 'a2');
  assert.equal(D.servisLogs[0].accountId, 'a2');
  assert.equal(D.cobek[0].accountId, 'a2');
  assert.equal(calls.save, 1);
  for (const r of ['renderAccGrid', 'renderDashAccList', 'renderLapAccList', 'renderDashboard', 'renderKeuangan', 'refreshBillEverywhere', 'renderCnTab']) {
    assert.ok(calls.render.includes(r), `expected render call: ${r}`);
  }
  assert.ok(calls.toast[0].includes('dipindah ke "Bank"'));
});

test('delAcc — D.bills/bbmLogs/servisLogs/shop tidak ada sama sekali (undefined) -> tidak error', async () => {
  const D = { accounts: [{ id: 'a1' }, { id: 'a2' }], transactions: [] };
  const { ctx } = makeAkun(D);
  await assert.doesNotReject(() => ctx.delAcc(0));
  assert.equal(D.accounts.length, 1);
});
