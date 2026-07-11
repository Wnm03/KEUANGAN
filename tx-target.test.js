'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadSource } = require('./helpers/loadSource');
const { createFakeDocument } = require('./helpers/fakeDom');

// Cakupan file ini: seluruh fungsi di tx-target.js —
// openTargetModal/onTargetAccChange/onTargetDanaDaruratToggle/saveTarget/
// showTargetAccountTx/addTarget/delTarget. Sama seperti tx-target.js
// sendiri (dipindah dari transaksi.js, lihat CLAUDE.md "split transaksi.js"
// bagian ke-9), test ini pakai fakeDocument + stub semua dependency
// lintas-file (populateAccFilters/renderSettings/FI/AlokasiAset/txHTML),
// BUKAN test integrasi lintas file sungguhan.

function targetFields(overrides = {}) {
  return {
    tName: { value: '' }, tAmt: { value: '' }, tSaved: { value: '' },
    tEmoji: { value: '' }, tDanaDarurat: { checked: false },
    tDanaDaruratHint: { style: {} }, tAcc: { value: '' }, tSavedWrap: { style: {} },
    filterTxTitle: {}, filterTxSummary: {}, filterTxList: {},
    ...overrides,
  };
}

function makeTarget(D, opts = {}) {
  const fakeDocument = createFakeDocument(targetFields(opts.domValues));
  const calls = { save: 0, toast: [], render: [] };
  const record = (name) => (...args) => calls.render.push([name, ...args]);
  const ctx = loadSource(['tx-target.js'], {
    D,
    document: fakeDocument,
    populateAccFilters: opts.populateAccFilters || record('populateAccFilters'),
    openModal: opts.openModal || record('openModal'),
    closeModal: opts.closeModal || record('closeModal'),
    renderSettings: opts.renderSettings || record('renderSettings'),
    save: () => { calls.save++; },
    toast: (msg) => calls.toast.push(msg),
    uid: opts.uid || (() => 'uid-' + Math.random().toString(36).slice(2)),
    sameId: opts.sameId || ((a, b) => String(a) === String(b)),
    escapeHtml: opts.escapeHtml || ((s) => String(s == null ? '' : s)),
    fmtFull: opts.fmtFull || ((n) => 'Rp' + String(Math.round(n))),
    recalcAccBalance: opts.recalcAccBalance || (() => 0),
    txHTML: opts.txHTML || ((t) => `<div>${t.id}</div>`),
    showPromptModal: opts.showPromptModal || (async () => null),
    askConfirm: opts.askConfirm || (async () => true),
    FI: opts.FI || { annualExpense: () => 0 },
    AlokasiAset: opts.AlokasiAset,
  });
  return { ctx, fakeDocument, calls };
}

// ================= openTargetModal =================

test('openTargetModal — reset semua field ke default & buka modal', () => {
  const D = {};
  const { ctx, fakeDocument, calls } = makeTarget(D, {
    domValues: { tName: { value: 'lama' }, tAmt: { value: '999' }, tSaved: { value: '5' }, tAcc: { value: 'a1' } },
  });
  ctx.openTargetModal();
  assert.equal(fakeDocument.getElementById('tName').value, '');
  assert.equal(fakeDocument.getElementById('tAmt').value, '');
  assert.equal(fakeDocument.getElementById('tSaved').value, '');
  assert.equal(fakeDocument.getElementById('tEmoji').value, '🎯');
  assert.equal(fakeDocument.getElementById('tDanaDarurat').checked, false);
  assert.equal(fakeDocument.getElementById('tDanaDaruratHint').style.display, 'none');
  assert.equal(fakeDocument.getElementById('tAcc').value, '');
  assert.equal(fakeDocument.getElementById('tSavedWrap').style.display, 'block');
  assert.ok(calls.render.some((r) => r[0] === 'populateAccFilters'));
  assert.ok(calls.render.some((r) => r[0] === 'openModal' && r[1] === 'targetModal'));
});

// ================= onTargetAccChange =================

test('onTargetAccChange — akun dipilih -> sembunyikan tSavedWrap (saldo ikut akun)', () => {
  const { ctx, fakeDocument } = makeTarget({}, { domValues: { tAcc: { value: 'a1' } } });
  ctx.onTargetAccChange();
  assert.equal(fakeDocument.getElementById('tSavedWrap').style.display, 'none');
});

test('onTargetAccChange — tidak ada akun dipilih -> tampilkan tSavedWrap (input manual)', () => {
  const { ctx, fakeDocument } = makeTarget({}, { domValues: { tAcc: { value: '' } } });
  ctx.onTargetAccChange();
  assert.equal(fakeDocument.getElementById('tSavedWrap').style.display, 'block');
});

// ================= onTargetDanaDaruratToggle =================

test('onTargetDanaDaruratToggle — checkbox tidak dicentang -> sembunyikan hint, tidak hitung apa-apa', () => {
  const { ctx, fakeDocument } = makeTarget({}, { domValues: { tDanaDarurat: { checked: false } } });
  ctx.onTargetDanaDaruratToggle();
  assert.equal(fakeDocument.getElementById('tDanaDaruratHint').style.display, 'none');
});

test('onTargetDanaDaruratToggle — dicentang, ada data pengeluaran -> rekom 6x rata-rata bulanan, isi nama/emoji/amt kosong', () => {
  const D = { targets: [] };
  const { ctx, fakeDocument } = makeTarget(D, {
    domValues: { tDanaDarurat: { checked: true }, tName: { value: '' }, tEmoji: { value: '🎯' }, tAmt: { value: '' } },
    FI: { annualExpense: () => 120000000 }, // 10jt/bulan
  });
  ctx.onTargetDanaDaruratToggle();
  assert.equal(fakeDocument.getElementById('tName').value, 'Dana Darurat');
  assert.equal(fakeDocument.getElementById('tEmoji').value, '🚨');
  assert.equal(fakeDocument.getElementById('tAmt').value, 60000000); // 6 x 10jt
  assert.match(fakeDocument.getElementById('tDanaDaruratHint').innerHTML, /6× rata-rata/);
  assert.equal(fakeDocument.getElementById('tDanaDaruratHint').style.display, 'block');
});

test('onTargetDanaDaruratToggle — tidak ada data pengeluaran (avgBulanan 0) -> pesan generik, tidak isi tAmt otomatis', () => {
  const { ctx, fakeDocument } = makeTarget({ targets: [] }, {
    domValues: { tDanaDarurat: { checked: true }, tAmt: { value: '' } },
    FI: { annualExpense: () => 0 },
  });
  ctx.onTargetDanaDaruratToggle();
  assert.equal(fakeDocument.getElementById('tAmt').value, '');
  assert.match(fakeDocument.getElementById('tDanaDaruratHint').innerHTML, /Belum cukup data/);
});

test('onTargetDanaDaruratToggle — nama/emoji/amt yg sudah diisi user TIDAK ditimpa', () => {
  const { ctx, fakeDocument } = makeTarget({ targets: [] }, {
    domValues: { tDanaDarurat: { checked: true }, tName: { value: 'Custom' }, tEmoji: { value: '💼' }, tAmt: { value: '9999' } },
    FI: { annualExpense: () => 120000000 },
  });
  ctx.onTargetDanaDaruratToggle();
  assert.equal(fakeDocument.getElementById('tName').value, 'Custom');
  assert.equal(fakeDocument.getElementById('tEmoji').value, '💼');
  assert.equal(fakeDocument.getElementById('tAmt').value, '9999');
});

test('onTargetDanaDaruratToggle — sudah ada target Dana Darurat lain -> tambahkan peringatan tandanya akan pindah', () => {
  const D = { targets: [{ name: 'Target Lama', isDanaDarurat: true }] };
  const { ctx, fakeDocument } = makeTarget(D, {
    domValues: { tDanaDarurat: { checked: true } },
    FI: { annualExpense: () => 0 },
  });
  ctx.onTargetDanaDaruratToggle();
  assert.match(fakeDocument.getElementById('tDanaDaruratHint').innerHTML, /Target Lama.*ditandai Dana Darurat/s);
});

// ================= saveTarget =================

test('saveTarget — nama kosong -> toast peringatan, tidak nambah target', () => {
  const D = { targets: [] };
  const { ctx, calls } = makeTarget(D, { domValues: { tName: { value: '' }, tAmt: { value: '100000' } } });
  ctx.saveTarget();
  assert.equal(D.targets.length, 0);
  assert.ok(calls.toast[0].includes('Isi nama dan target'));
});

test('saveTarget — amt kosong/0 -> toast peringatan, tidak nambah target', () => {
  const D = { targets: [] };
  const { ctx, calls } = makeTarget(D, { domValues: { tName: { value: 'Liburan' }, tAmt: { value: '' } } });
  ctx.saveTarget();
  assert.equal(D.targets.length, 0);
  assert.ok(calls.toast[0].includes('Isi nama dan target'));
});

test('saveTarget — tanpa akun terkait: saved diambil dari tSaved manual', () => {
  const D = { targets: [] };
  const { ctx, calls } = makeTarget(D, {
    domValues: { tName: { value: 'Liburan' }, tAmt: { value: '5000000' }, tSaved: { value: '1000000' }, tAcc: { value: '' }, tEmoji: { value: '🏖️' } },
  });
  ctx.saveTarget();
  assert.equal(D.targets.length, 1);
  assert.equal(D.targets[0].name, 'Liburan');
  assert.equal(D.targets[0].amount, 5000000);
  assert.equal(D.targets[0].saved, 1000000);
  assert.equal(D.targets[0].accountId, null);
  assert.equal(calls.save, 1);
  assert.ok(calls.toast[0].includes('✅ Target tersimpan') && !calls.toast[0].includes('tersambung'));
});

test('saveTarget — dgn akun terkait: saved dipaksa 0 (ikut saldo akun otomatis), pesan toast beda', () => {
  const D = { targets: [] };
  const { ctx, calls } = makeTarget(D, {
    domValues: { tName: { value: 'Dana Darurat' }, tAmt: { value: '10000000' }, tSaved: { value: '1000000' }, tAcc: { value: 'a1' } },
  });
  ctx.saveTarget();
  assert.equal(D.targets[0].saved, 0);
  assert.equal(D.targets[0].accountId, 'a1');
  assert.ok(calls.toast[0].includes('tersambung ke akun'));
});

test('saveTarget — emoji kosong fallback ke 🎯', () => {
  const D = { targets: [] };
  const { ctx } = makeTarget(D, { domValues: { tName: { value: 'X' }, tAmt: { value: '1000' }, tEmoji: { value: '' } } });
  ctx.saveTarget();
  assert.equal(D.targets[0].emoji, '🎯');
});

test('saveTarget — isDanaDarurat true: matikan flag isDanaDarurat di semua target lain', () => {
  const D = { targets: [{ name: 'Lama', isDanaDarurat: true }] };
  const { ctx } = makeTarget(D, { domValues: { tName: { value: 'Baru' }, tAmt: { value: '1000' }, tDanaDarurat: { checked: true } } });
  ctx.saveTarget();
  assert.equal(D.targets[0].isDanaDarurat, false); // yg lama dimatikan
  assert.equal(D.targets[1].isDanaDarurat, true); // yg baru aktif
});

test('saveTarget — panggil AlokasiAset.renderAll() kalau tersedia, aman kalau tidak', () => {
  const D = { targets: [] };
  let rendered = false;
  const { ctx } = makeTarget(D, {
    domValues: { tName: { value: 'X' }, tAmt: { value: '1000' } },
    AlokasiAset: { renderAll: () => { rendered = true; } },
  });
  ctx.saveTarget();
  assert.equal(rendered, true);

  const D2 = { targets: [] };
  const { ctx: ctx2 } = makeTarget(D2, { domValues: { tName: { value: 'X' }, tAmt: { value: '1000' } } });
  assert.doesNotThrow(() => ctx2.saveTarget()); // AlokasiAset undefined -> tidak error
});

// ================= showTargetAccountTx =================

test('showTargetAccountTx — target tidak ditemukan -> tidak error, tidak buka modal', () => {
  const D = { targets: [], accounts: [], transactions: [] };
  const { ctx, calls } = makeTarget(D);
  ctx.showTargetAccountTx('nope');
  assert.equal(calls.render.some((r) => r[0] === 'openModal'), false);
});

test('showTargetAccountTx — target tanpa accountId -> return awal, tidak buka modal', () => {
  const D = { targets: [{ id: 't1', accountId: null }], accounts: [], transactions: [] };
  const { ctx, calls } = makeTarget(D);
  ctx.showTargetAccountTx('t1');
  assert.equal(calls.render.some((r) => r[0] === 'openModal'), false);
});

test('showTargetAccountTx — akun terkait tidak ketemu di D.accounts -> return awal', () => {
  const D = { targets: [{ id: 't1', accountId: 'ghost' }], accounts: [], transactions: [] };
  const { ctx, calls } = makeTarget(D);
  ctx.showTargetAccountTx('t1');
  assert.equal(calls.render.some((r) => r[0] === 'openModal'), false);
});

test('showTargetAccountTx — sukses: filter tx per akun, urut terbaru dulu, isi ringkasan, buka modal', () => {
  const D = {
    targets: [{ id: 't1', accountId: 'a1', emoji: '🎯', name: 'Liburan', amount: 5000000 }],
    accounts: [{ id: 'a1', emoji: '💰', name: 'Cash' }],
    transactions: [
      { id: 'tx1', accountId: 'a1', date: '2026-01-01' },
      { id: 'tx2', accountId: 'a1', date: '2026-03-01' },
      { id: 'tx3', accountId: 'a2', date: '2026-02-01' }, // akun lain
    ],
  };
  const { ctx, fakeDocument, calls } = makeTarget(D, { recalcAccBalance: () => 2000000 });
  ctx.showTargetAccountTx('t1');
  assert.equal(fakeDocument.getElementById('filterTxTitle').textContent, '🎯 Liburan (💰 Cash)');
  assert.match(fakeDocument.getElementById('filterTxSummary').textContent, /2 transaksi/);
  // urut terbaru dulu: tx2 (Maret) sebelum tx1 (Januari)
  const idxTx1 = fakeDocument.getElementById('filterTxList').innerHTML.indexOf('tx1');
  const idxTx2 = fakeDocument.getElementById('filterTxList').innerHTML.indexOf('tx2');
  assert.ok(idxTx2 < idxTx1);
  assert.ok(calls.render.some((r) => r[0] === 'openModal' && r[1] === 'filterTxModal'));
});

test('showTargetAccountTx — tidak ada transaksi di akun -> tampilkan empty state', () => {
  const D = {
    targets: [{ id: 't1', accountId: 'a1', emoji: '🎯', name: 'Liburan', amount: 100 }],
    accounts: [{ id: 'a1', emoji: '💰', name: 'Cash' }],
    transactions: [],
  };
  const { ctx, fakeDocument } = makeTarget(D);
  ctx.showTargetAccountTx('t1');
  assert.match(fakeDocument.getElementById('filterTxList').innerHTML, /Belum ada transaksi/);
});

// ================= addTarget =================

test('addTarget — prompt dibatalkan (null) -> tidak ada perubahan', async () => {
  const D = { targets: [{ saved: 1000 }] };
  const { ctx, calls } = makeTarget(D, { showPromptModal: async () => null });
  await ctx.addTarget(0);
  assert.equal(D.targets[0].saved, 1000);
  assert.equal(calls.save, 0);
});

test('addTarget — input tidak valid (0/NaN) -> tidak ada perubahan', async () => {
  const D = { targets: [{ saved: 1000 }] };
  const { ctx, calls } = makeTarget(D, { showPromptModal: async () => '0' });
  await ctx.addTarget(0);
  assert.equal(D.targets[0].saved, 1000);
  assert.equal(calls.save, 0);
});

test('addTarget — input valid -> tambahkan ke saved, save, renderSettings, toast', async () => {
  const D = { targets: [{ saved: 1000000 }] };
  const { ctx, calls } = makeTarget(D, { showPromptModal: async () => '500000' });
  await ctx.addTarget(0);
  assert.equal(D.targets[0].saved, 1500000);
  assert.equal(calls.save, 1);
  assert.ok(calls.render.some((r) => r[0] === 'renderSettings'));
  assert.ok(calls.toast[0].includes('diperbarui'));
});

// ================= delTarget =================

test('delTarget — user batal konfirmasi -> tidak hapus', async () => {
  const D = { targets: [{ id: 't1' }, { id: 't2' }] };
  const { ctx, calls } = makeTarget(D, { askConfirm: async () => false });
  await ctx.delTarget(0);
  assert.equal(D.targets.length, 2);
  assert.equal(calls.save, 0);
});

test('delTarget — konfirmasi setuju -> hapus dari list, save, renderSettings, toast', async () => {
  const D = { targets: [{ id: 't1' }, { id: 't2' }] };
  const { ctx, calls } = makeTarget(D);
  await ctx.delTarget(0);
  assert.equal(D.targets.length, 1);
  assert.equal(D.targets[0].id, 't2');
  assert.equal(calls.save, 1);
  assert.ok(calls.render.some((r) => r[0] === 'renderSettings'));
  assert.ok(calls.toast[0].includes('dihapus'));
});
