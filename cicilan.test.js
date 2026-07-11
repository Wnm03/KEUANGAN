'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadSource } = require('./helpers/loadSource');
const { createFakeDocument } = require('./helpers/fakeDom');

// Cakupan file ini: seluruh fungsi di cicilan.js —
// validateCicilanFields/calcCicilanPerBulanFromTotal/
// calcCicilanTotalFromPerBulan/syncCicilanPreview/getCicilanSharedMine/
// toggleCicilanSharedFields/syncCicilanDate/openCicilanHistoryFromTx.
// Sama seperti akun.js/tx-target.js sebelumnya, test ini pakai fakeDocument
// + stub semua dependency lintas-file (toast/closeModal/openBillHistory),
// BUKAN test integrasi lintas file sungguhan.
//
// cicilanLastInput/cicilanSharedLastInput/cicilanDateLinked/curPayMethod/
// txEditLinkedBillId adalah variabel GLOBAL bebas (dideklarasikan `let` di
// features-helpers-global-security.js, TIDAK di cicilan.js sendiri) yang
// diassign langsung tanpa `let`/`const` di dalam cicilan.js. Karena
// cicilan.js tidak berjalan dalam 'use strict' & tidak dideklarasikan ulang
// di sini, assignment ke variabel itu di dalam sandbox vm otomatis membuat
// property baru di objek context sandbox (perilaku standar non-strict-mode
// JS utk assignment ke identifier yang belum dideklarasikan) — jadi BISA
// diinject awal & dibaca balik lewat extraGlobals seperti biasa, TANPA
// perlu trik `expose` (beda dari kasus editAccIdx/accIncludeState di
// akun.test.js yang memang dideklarasikan `let` DI DALAM akun.js sendiri).

function cicilanFields(overrides = {}) {
  return {
    txCicilanTotal: { value: '' }, txCicilanTenor: { value: '' }, txCicilanBunga: { value: '' },
    txCicilanPerBulan: { value: '' }, txCicilanPreview: { style: {} },
    prevPerBulan: {}, prevTotal: {}, prevSisa: {}, prevPerBulanMine: {},
    prevMineRow: { style: {} }, txCicilanSharedPreview: {},
    txAmt: { value: '' }, txCicilanShared: { checked: false },
    txCicilanSharedNominal: { value: '' }, txCicilanSharedPct: { value: '' },
    txCicilanSharedWrap: { style: {} },
    txDate: { value: '' }, txCicilanDue: { value: '' },
    ...overrides,
  };
}

function makeCicilan(D, opts = {}) {
  const fakeDocument = createFakeDocument(cicilanFields(opts.domValues));
  const calls = { toast: [], closeModal: [], openBillHistory: [] };
  const ctx = loadSource(['cicilan.js'], {
    document: fakeDocument,
    toast: (msg) => calls.toast.push(msg),
    // fmtFull dibuat identity (bukan format Rupiah asli) supaya assertion
    // bisa cek ANGKA HASIL PERSIS -- pola sama dgn tx-target.test.js.
    fmtFull: (n) => 'Rp' + String(Math.round(n)),
    fmt: (n) => 'Rp' + String(Math.round(n)),
    closeModal: (id) => calls.closeModal.push(id),
    openBillHistory: (id) => calls.openBillHistory.push(id),
    cicilanLastInput: opts.cicilanLastInput !== undefined ? opts.cicilanLastInput : 'total',
    cicilanSharedLastInput: opts.cicilanSharedLastInput !== undefined ? opts.cicilanSharedLastInput : 'pct',
    cicilanDateLinked: opts.cicilanDateLinked || false,
    curPayMethod: opts.curPayMethod !== undefined ? opts.curPayMethod : 'cicilan',
    txEditLinkedBillId: opts.txEditLinkedBillId,
  });
  return { ctx, fakeDocument, calls };
}

// ================= validateCicilanFields =================

test('validateCicilanFields — total kosong/invalid -> toast, focus, false', () => {
  const focusCalls = [];
  const { ctx, fakeDocument } = makeCicilan({}, {
    domValues: { txCicilanTotal: { value: '', focus: () => focusCalls.push('total') }, txCicilanTenor: { value: '6' } },
  });
  const result = ctx.validateCicilanFields();
  assert.equal(result, false);
  assert.ok(focusCalls.includes('total'));
});

test('validateCicilanFields — total <= 0 -> toast, false', () => {
  const { ctx } = makeCicilan({}, { domValues: { txCicilanTotal: { value: '0' }, txCicilanTenor: { value: '6' } } });
  assert.equal(ctx.validateCicilanFields(), false);
});

test('validateCicilanFields — tenor invalid/<=0 -> toast, false', () => {
  const { ctx, calls } = makeCicilan({}, { domValues: { txCicilanTotal: { value: '100000' }, txCicilanTenor: { value: '0' } } });
  assert.equal(ctx.validateCicilanFields(), false);
  assert.ok(calls.toast[0].includes('Tenor'));
});

test('validateCicilanFields — bunga negatif -> toast, focus, false', () => {
  const focusCalls = [];
  const { ctx } = makeCicilan({}, {
    domValues: {
      txCicilanTotal: { value: '100000' }, txCicilanTenor: { value: '6' },
      txCicilanBunga: { value: '-5', focus: () => focusCalls.push('bunga') },
    },
  });
  assert.equal(ctx.validateCicilanFields(), false);
  assert.ok(focusCalls.includes('bunga'));
});

test('validateCicilanFields — bunga kosong dianggap 0 (valid), semua field valid -> true', () => {
  const { ctx } = makeCicilan({}, { domValues: { txCicilanTotal: { value: '100000' }, txCicilanTenor: { value: '6' }, txCicilanBunga: { value: '' } } });
  assert.equal(ctx.validateCicilanFields(), true);
});

// ================= calcCicilanPerBulanFromTotal =================

test('calcCicilanPerBulanFromTotal — tanpa bunga: perBulan = total/tenor (dibulatkan ke atas)', () => {
  const { ctx } = makeCicilan({});
  const r = ctx.calcCicilanPerBulanFromTotal(1000000, 6, 0);
  assert.equal(r.totalBayar, 1000000);
  assert.equal(r.perBulan, Math.ceil(1000000 / 6));
});

test('calcCicilanPerBulanFromTotal — dengan bunga: totalBayar = pokok*(1+bunga%)', () => {
  const { ctx } = makeCicilan({});
  const r = ctx.calcCicilanPerBulanFromTotal(1000000, 10, 10);
  assert.equal(r.totalBayar, 1100000);
  assert.equal(r.perBulan, Math.ceil(1100000 / 10));
});

// ================= calcCicilanTotalFromPerBulan =================

test('calcCicilanTotalFromPerBulan — tanpa bunga: hargaPokok = totalBayar (perBulan*tenor)', () => {
  const { ctx } = makeCicilan({});
  const r = ctx.calcCicilanTotalFromPerBulan(200000, 5, 0);
  assert.equal(r.totalBayar, 1000000);
  assert.equal(r.hargaPokok, 1000000);
});

test('calcCicilanTotalFromPerBulan — dengan bunga: hargaPokok dibagi (1+bunga%)', () => {
  const { ctx } = makeCicilan({});
  const r = ctx.calcCicilanTotalFromPerBulan(110000, 10, 10);
  assert.equal(r.totalBayar, 1100000);
  assert.equal(r.hargaPokok, Math.round(1100000 / 1.1));
});

// ================= getCicilanSharedMine =================

test('getCicilanSharedMine — checkbox shared tidak dicentang -> shared:false, mine=perBulanFull', () => {
  const { ctx } = makeCicilan({}, { domValues: { txCicilanShared: { checked: false } } });
  const r = ctx.getCicilanSharedMine(500000);
  assert.equal(r.shared, false);
  assert.equal(r.pct, null);
  assert.equal(r.mine, 500000);
});

test('getCicilanSharedMine — mode pct: hitung mine dari persentase, clamp 1-99', () => {
  const { ctx } = makeCicilan({}, {
    cicilanSharedLastInput: 'pct',
    domValues: { txCicilanShared: { checked: true }, txCicilanSharedPct: { value: '40' } },
  });
  const r = ctx.getCicilanSharedMine(500000);
  assert.equal(r.shared, true);
  assert.equal(r.pct, 40);
  assert.equal(r.mine, 200000);
});

test('getCicilanSharedMine — mode pct: pct di luar 1-99 di-clamp', () => {
  const { ctx } = makeCicilan({}, {
    cicilanSharedLastInput: 'pct',
    domValues: { txCicilanShared: { checked: true }, txCicilanSharedPct: { value: '150' } },
  });
  const r = ctx.getCicilanSharedMine(500000);
  assert.equal(r.pct, 99);
});

test('getCicilanSharedMine — mode nominal: hitung pct dari nominal, clamp nominal 0..perBulanFull', () => {
  const { ctx } = makeCicilan({}, {
    cicilanSharedLastInput: 'nominal',
    domValues: { txCicilanShared: { checked: true }, txCicilanSharedNominal: { value: '300000' } },
  });
  const r = ctx.getCicilanSharedMine(500000);
  assert.equal(r.mine, 300000);
  assert.equal(r.pct, 60);
});

test('getCicilanSharedMine — mode nominal: nominal melebihi perBulanFull -> di-clamp ke perBulanFull', () => {
  const { ctx } = makeCicilan({}, {
    cicilanSharedLastInput: 'nominal',
    domValues: { txCicilanShared: { checked: true }, txCicilanSharedNominal: { value: '999999' } },
  });
  const r = ctx.getCicilanSharedMine(500000);
  assert.equal(r.mine, 500000);
});

// ================= toggleCicilanSharedFields =================

test('toggleCicilanSharedFields — dicentang: tampilkan wrap, set cicilanSharedLastInput=pct, panggil syncCicilanPreview', () => {
  const { ctx, fakeDocument } = makeCicilan({}, {
    domValues: {
      txCicilanShared: { checked: true }, txCicilanTotal: { value: '600000' }, txCicilanTenor: { value: '6' },
    },
  });
  ctx.toggleCicilanSharedFields();
  assert.equal(fakeDocument.getElementById('txCicilanSharedWrap').style.display, 'block');
  // sinkron preview ikut jalan (txCicilanPreview jadi 'block' krn totalEl terisi)
  assert.equal(fakeDocument.getElementById('txCicilanPreview').style.display, 'block');
});

test('toggleCicilanSharedFields — tidak dicentang: sembunyikan wrap', () => {
  const { ctx, fakeDocument } = makeCicilan({}, { domValues: { txCicilanShared: { checked: false } } });
  ctx.toggleCicilanSharedFields();
  assert.equal(fakeDocument.getElementById('txCicilanSharedWrap').style.display, 'none');
});

// ================= syncCicilanPreview =================

test('syncCicilanPreview — sumber total, hargaPokok 0/kosong -> sembunyikan preview, kosongkan txAmt & perBulan', () => {
  const { ctx, fakeDocument } = makeCicilan({}, { domValues: { txCicilanTotal: { value: '0' } } });
  ctx.syncCicilanPreview('total');
  assert.equal(fakeDocument.getElementById('txCicilanPreview').style.display, 'none');
  assert.equal(fakeDocument.getElementById('txAmt').value, '');
  assert.equal(fakeDocument.getElementById('txCicilanPerBulan').value, '');
});

test('syncCicilanPreview — sumber total valid: hitung perBulan, isi preview & txAmt', () => {
  const { ctx, fakeDocument } = makeCicilan({}, {
    domValues: { txCicilanTotal: { value: '1000000' }, txCicilanTenor: { value: '5' }, txCicilanBunga: { value: '0' } },
  });
  ctx.syncCicilanPreview('total');
  const perBulan = Math.ceil(1000000 / 5);
  assert.equal(fakeDocument.getElementById('txCicilanPerBulan').value, perBulan);
  assert.equal(fakeDocument.getElementById('prevPerBulan').textContent, 'Rp' + perBulan);
  assert.equal(fakeDocument.getElementById('prevTotal').textContent, 'Rp1000000');
  assert.equal(fakeDocument.getElementById('txCicilanPreview').style.display, 'block');
  assert.equal(fakeDocument.getElementById('txAmt').value, perBulan);
  assert.match(fakeDocument.getElementById('prevSisa').textContent, /4x lagi/);
});

test('syncCicilanPreview — tenor 1 -> prevSisa "Lunas setelah ini"', () => {
  const { ctx, fakeDocument } = makeCicilan({}, {
    domValues: { txCicilanTotal: { value: '1000000' }, txCicilanTenor: { value: '1' } },
  });
  ctx.syncCicilanPreview('total');
  assert.equal(fakeDocument.getElementById('prevSisa').textContent, 'Lunas setelah ini');
});

test('syncCicilanPreview — sumber perbulan, perBulan 0/kosong -> sembunyikan preview, kosongkan txAmt & total', () => {
  const { ctx, fakeDocument } = makeCicilan({}, { domValues: { txCicilanPerBulan: { value: '' } } });
  ctx.syncCicilanPreview('perbulan');
  assert.equal(fakeDocument.getElementById('txCicilanPreview').style.display, 'none');
  assert.equal(fakeDocument.getElementById('txAmt').value, '');
  assert.equal(fakeDocument.getElementById('txCicilanTotal').value, '');
});

test('syncCicilanPreview — sumber perbulan valid: hitung hargaPokok, isi txCicilanTotal', () => {
  const { ctx, fakeDocument } = makeCicilan({}, {
    domValues: { txCicilanPerBulan: { value: '200000' }, txCicilanTenor: { value: '5' }, txCicilanBunga: { value: '0' } },
  });
  ctx.syncCicilanPreview('perbulan');
  assert.equal(fakeDocument.getElementById('txCicilanTotal').value, 1000000);
});

test('syncCicilanPreview — tanpa shared aktif: prevMineRow disembunyikan, txAmt = perBulan penuh', () => {
  const { ctx, fakeDocument } = makeCicilan({}, {
    domValues: { txCicilanTotal: { value: '600000' }, txCicilanTenor: { value: '6' }, txCicilanShared: { checked: false } },
  });
  ctx.syncCicilanPreview('total');
  assert.equal(fakeDocument.getElementById('prevMineRow').style.display, 'none');
  assert.equal(fakeDocument.getElementById('txCicilanSharedPreview').textContent, '');
  assert.equal(fakeDocument.getElementById('txAmt').value, 100000); // 600000/6
});

test('syncCicilanPreview — shared aktif mode pct: hitung porsi, isi prevPerBulanMine & txAmt=porsi mine', () => {
  const { ctx, fakeDocument } = makeCicilan({}, {
    cicilanSharedLastInput: 'pct',
    domValues: {
      txCicilanTotal: { value: '600000' }, txCicilanTenor: { value: '6' },
      txCicilanShared: { checked: true }, txCicilanSharedPct: { value: '50' },
    },
  });
  ctx.syncCicilanPreview('total');
  // perBulan = 100000, shared 50% -> mine = 50000
  assert.equal(fakeDocument.getElementById('prevPerBulanMine').textContent, 'Rp50000');
  assert.equal(fakeDocument.getElementById('prevMineRow').style.display, 'block');
  assert.equal(fakeDocument.getElementById('txAmt').value, 50000);
  assert.match(fakeDocument.getElementById('txCicilanSharedPreview').textContent, /Porsi kamu/);
});

test('syncCicilanPreview — shared aktif mode nominal: isi txCicilanSharedPct (field yg dihitung ulang, bukan yg diinput user)', () => {
  const { ctx, fakeDocument } = makeCicilan({}, {
    cicilanSharedLastInput: 'nominal',
    domValues: {
      txCicilanTotal: { value: '600000' }, txCicilanTenor: { value: '6' },
      txCicilanShared: { checked: true }, txCicilanSharedNominal: { value: '30000' },
    },
  });
  ctx.syncCicilanPreview('total');
  // mine=30000 dari perBulan 100000 -> pct=30, field Pct (bukan Nominal) yg
  // ditulis ulang karena Nominal adalah input asli milik user.
  assert.equal(fakeDocument.getElementById('txCicilanSharedPct').value, 30);
});

test('syncCicilanPreview — src=sharedPct/sharedNominal update cicilanSharedLastInput (dibuktikan lewat efek getCicilanSharedMine berikutnya)', () => {
  const { ctx, fakeDocument } = makeCicilan({}, {
    domValues: {
      txCicilanTotal: { value: '600000' }, txCicilanTenor: { value: '6' },
      txCicilanShared: { checked: true }, txCicilanSharedPct: { value: '50' }, txCicilanSharedNominal: { value: '999' },
    },
  });
  // src='sharedPct' -> cicilanSharedLastInput jadi 'pct' -> pakai txCicilanSharedPct (50%), BUKAN nominal 999
  ctx.syncCicilanPreview('sharedPct');
  assert.equal(fakeDocument.getElementById('txAmt').value, 50000); // 50% dari 100000
});

// ================= syncCicilanDate =================

test('syncCicilanDate — curPayMethod bukan cicilan -> tidak melakukan apa-apa', () => {
  const { ctx, fakeDocument } = makeCicilan({}, {
    curPayMethod: 'tunai',
    domValues: { txDate: { value: '2026-01-01' }, txCicilanDue: { value: '' } },
  });
  ctx.syncCicilanDate('date');
  assert.equal(fakeDocument.getElementById('txCicilanDue').value, '');
});

test('syncCicilanDate — cicilanDateLinked true -> tidak melakukan apa-apa (sudah ditautkan tagihan)', () => {
  const { ctx, fakeDocument } = makeCicilan({}, {
    cicilanDateLinked: true,
    domValues: { txDate: { value: '2026-01-01' }, txCicilanDue: { value: '' } },
  });
  ctx.syncCicilanDate('date');
  assert.equal(fakeDocument.getElementById('txCicilanDue').value, '');
});

test('syncCicilanDate — kedua field kosong -> tidak melakukan apa-apa', () => {
  const { ctx, fakeDocument } = makeCicilan({}, { domValues: { txDate: { value: '' }, txCicilanDue: { value: '' } } });
  ctx.syncCicilanDate('date');
  assert.equal(fakeDocument.getElementById('txCicilanDue').value, '');
});

test('syncCicilanDate — src=date: salin txDate ke txCicilanDue', () => {
  const { ctx, fakeDocument } = makeCicilan({}, { domValues: { txDate: { value: '2026-05-10' }, txCicilanDue: { value: '' } } });
  ctx.syncCicilanDate('date');
  assert.equal(fakeDocument.getElementById('txCicilanDue').value, '2026-05-10');
});

test('syncCicilanDate — src lain (due): salin txCicilanDue ke txDate', () => {
  const { ctx, fakeDocument } = makeCicilan({}, { domValues: { txDate: { value: '' }, txCicilanDue: { value: '2026-05-10' } } });
  ctx.syncCicilanDate('due');
  assert.equal(fakeDocument.getElementById('txDate').value, '2026-05-10');
});

// ================= openCicilanHistoryFromTx =================

test('openCicilanHistoryFromTx — txEditLinkedBillId kosong -> tidak melakukan apa-apa', () => {
  const { ctx, calls } = makeCicilan({}, { txEditLinkedBillId: null });
  ctx.openCicilanHistoryFromTx();
  assert.equal(calls.closeModal.length, 0);
  assert.equal(calls.openBillHistory.length, 0);
});

test('openCicilanHistoryFromTx — ada txEditLinkedBillId -> tutup txModal, buka riwayat tagihan', () => {
  const { ctx, calls } = makeCicilan({}, { txEditLinkedBillId: 'bill1' });
  ctx.openCicilanHistoryFromTx();
  assert.deepEqual(calls.closeModal, ['txModal']);
  assert.deepEqual(calls.openBillHistory, ['bill1']);
});
