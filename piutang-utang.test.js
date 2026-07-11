'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadSource } = require('./helpers/loadSource');
const { createFakeDocument, createFakeElement } = require('./helpers/fakeDom');

// Cakupan file ini: seluruh fungsi di piutang-utang.js —
// Piutang.{openModal,toggleLunas,save,delete,totalValue,overdueDays,
// sortedActive,renderList}, Debt.{openModal,toggleLunas,save,syncBill,
// delete,totalValue,totalCicilanBulanan,renderList}, DebtStrategy.{
// setMethod,onExtraInput,activeDebts,computeOrder,computeDSR,simulate,
// render}, Bill.openLinkTxModal.
// Sama seperti akun.js/tx-target.js/cicilan.js sebelumnya, test ini pakai
// fakeDocument + stub semua dependency lintas-file (renderKekayaanBersih/
// hitungZakatMaal/renderBillList/checkBills/updateAmtPreview/WorthIt/
// LinkTx), BUKAN test integrasi lintas file sungguhan. Piutang & Debt
// dites terpisah dari DebtStrategy/Bill krn beda tanggung jawab, tapi
// semuanya di-load dari SATU file yang sama (piutang-utang.js) jadi
// otomatis saling terhubung (mis. Debt.save() memanggil DebtStrategy lewat
// Debt.renderList(), DebtStrategy.computeDSR() memanggil Debt langsung)
// tanpa perlu di-stub silang.

function baseFields(overrides = {}) {
  return {
    piutangModalTitle: {}, piutangName: { value: '' }, piutangNilai: { value: '' },
    piutangTanggal: { value: '' }, piutangJatuhTempo: { value: '' }, piutangCatatan: { value: '' },
    piutangLunasBtn: {}, piutangList: {},
    debtModalTitle: {}, debtName: { value: '' }, debtNilai: { value: '' }, debtBunga: { value: '' },
    debtCicilan: { value: '' }, debtTanggal: { value: '' }, debtJatuhTempo: { value: '' },
    debtCatatan: { value: '' }, debtLunasBtn: {}, debtList: {}, debtTotalVal: {}, debtCicilanVal: {},
    dsResult: {}, dsExtra: { value: '' },
    ...overrides,
  };
}

function makePU(D, opts = {}) {
  const fakeDocument = createFakeDocument(baseFields(opts.domValues), opts.queryGroups);
  const calls = { save: 0, toast: [], render: [], closeModal: [], openModal: [] };
  const record = (name) => (...args) => calls.render.push([name, ...args]);
  const ctx = loadSource(['piutang-utang.js'], {
    D,
    document: fakeDocument,
    toast: (msg) => calls.toast.push(msg),
    save: () => { calls.save++; },
    closeModal: (id) => calls.closeModal.push(id),
    openModal: (id) => calls.openModal.push(id),
    askConfirm: opts.askConfirm || (async () => true),
    sameId: (a, b) => String(a) === String(b),
    uid: opts.uid || (() => 'uid-' + Math.random().toString(36).slice(2)),
    todayStr: opts.todayStr || (() => '2026-07-11'),
    parsePzNum: (v) => { const n = parseFloat(String(v).replace(/[^\d.-]/g, '')); return isNaN(n) ? 0 : n; },
    escapeHtml: (s) => String(s == null ? '' : s),
    fmtFull: (n) => 'Rp' + String(Math.round(n)),
    fmt: (n) => 'Rp' + String(Math.round(n)),
    updateAmtPreview: opts.updateAmtPreview || record('updateAmtPreview'),
    renderKekayaanBersih: opts.renderKekayaanBersih || record('renderKekayaanBersih'),
    hitungZakatMaal: opts.hitungZakatMaal || record('hitungZakatMaal'),
    renderBillList: opts.renderBillList || record('renderBillList'),
    checkBills: opts.checkBills || record('checkBills'),
    WorthIt: opts.WorthIt,
    LinkTx: opts.LinkTx || { open: (...args) => calls.render.push(['LinkTx.open', ...args]) },
    curBillHistoryId: opts.curBillHistoryId,
  }, ['Piutang', 'Debt', 'DebtStrategy', 'Bill']);
  return { ctx, fakeDocument, calls };
}

// ================= Piutang.openModal / toggleLunas =================

test('Piutang.openModal — mode tambah: judul & field default kosong, tanggal = todayStr()', () => {
  const D = { piutang: [] };
  const { ctx, fakeDocument, calls } = makePU(D);
  ctx.Piutang.openModal();
  assert.equal(fakeDocument.getElementById('piutangModalTitle').textContent, 'Tambah Piutang');
  assert.equal(fakeDocument.getElementById('piutangName').value, '');
  assert.equal(fakeDocument.getElementById('piutangTanggal').value, '2026-07-11');
  assert.equal(fakeDocument.getElementById('piutangLunasBtn').textContent, 'Belum Lunas');
  assert.ok(calls.openModal.includes('piutangModal'));
});

test('Piutang.openModal — mode edit: prefill dari data, tombol lunas sesuai state', () => {
  const D = { piutang: [{ id: 'p1', name: 'Budi', nilai: 500000, tanggal: '2026-01-01', jatuhTempo: '2026-02-01', catatan: 'catatan', lunas: true }] };
  const { ctx, fakeDocument, calls } = makePU(D);
  ctx.Piutang.openModal('p1');
  assert.equal(fakeDocument.getElementById('piutangModalTitle').textContent, 'Edit Piutang');
  assert.equal(fakeDocument.getElementById('piutangName').value, 'Budi');
  assert.equal(fakeDocument.getElementById('piutangNilai').value, 500000);
  assert.equal(fakeDocument.getElementById('piutangCatatan').value, 'catatan');
  assert.equal(fakeDocument.getElementById('piutangLunasBtn').textContent, '✓ Lunas');
  assert.equal(fakeDocument.getElementById('piutangLunasBtn').className, 'chip-btn active');
  assert.ok(calls.openModal.includes('piutangModal'));
});

test('Piutang.toggleLunas — membalik state & tampilan tombol', () => {
  const D = { piutang: [] };
  const { ctx, fakeDocument } = makePU(D);
  ctx.Piutang.openModal(); // lunasState awal false
  ctx.Piutang.toggleLunas();
  assert.equal(fakeDocument.getElementById('piutangLunasBtn').textContent, '✓ Lunas');
  ctx.Piutang.toggleLunas();
  assert.equal(fakeDocument.getElementById('piutangLunasBtn').textContent, 'Belum Lunas');
});

// ================= Piutang.save =================

test('Piutang.save — nama kosong -> toast peringatan, tidak nambah', () => {
  const D = { piutang: [] };
  const { ctx, calls } = makePU(D, { domValues: { piutangName: { value: '  ' } } });
  ctx.Piutang.save();
  assert.equal(D.piutang.length, 0);
  assert.ok(calls.toast[0].includes('Nama peminjam'));
});

test('Piutang.save — tambah baru: push ke D.piutang, save, render, toast', () => {
  const D = { piutang: [] };
  const { ctx, calls } = makePU(D, {
    domValues: { piutangName: { value: 'Budi' }, piutangNilai: { value: '500000' }, piutangTanggal: { value: '2026-01-01' } },
  });
  ctx.Piutang.save();
  assert.equal(D.piutang.length, 1);
  assert.equal(D.piutang[0].name, 'Budi');
  assert.equal(D.piutang[0].nilai, 500000);
  assert.equal(D.piutang[0].lunas, false);
  assert.equal(calls.save, 1);
  assert.ok(calls.render.some((r) => r[0] === 'renderKekayaanBersih'));
  assert.ok(calls.render.some((r) => r[0] === 'hitungZakatMaal'));
  assert.ok(calls.closeModal.includes('piutangModal'));
  assert.ok(calls.toast[0].includes('tersimpan'));
});

test('Piutang.save — edit: update entri existing, tidak nambah baru', () => {
  const D = { piutang: [{ id: 'p1', name: 'Lama', nilai: 100 }] };
  const { ctx, fakeDocument } = makePU(D);
  ctx.Piutang.openModal('p1');
  fakeDocument.getElementById('piutangName').value = 'Baru';
  fakeDocument.getElementById('piutangNilai').value = '999';
  ctx.Piutang.save();
  assert.equal(D.piutang.length, 1);
  assert.equal(D.piutang[0].name, 'Baru');
  assert.equal(D.piutang[0].nilai, 999);
});

test('Piutang.save — edit tapi id sudah tidak ada -> toast error, tidak crash', () => {
  const D = { piutang: [{ id: 'p1', name: 'Lama' }] };
  const { ctx, calls } = makePU(D, { domValues: { piutangName: { value: 'X' } } });
  ctx.Piutang.openModal('p1');
  D.piutang = []; // dihapus dari luar sebelum save
  ctx.Piutang.save();
  assert.ok(calls.toast[0].includes('tidak ditemukan'));
});

// ================= Piutang.delete =================

test('Piutang.delete — batal konfirmasi -> tidak hapus', async () => {
  const D = { piutang: [{ id: 'p1' }] };
  const { ctx, calls } = makePU(D, { askConfirm: async () => false });
  await ctx.Piutang.delete('p1');
  assert.equal(D.piutang.length, 1);
  assert.equal(calls.save, 0);
});

test('Piutang.delete — konfirmasi setuju -> hapus, save, render', async () => {
  const D = { piutang: [{ id: 'p1' }, { id: 'p2' }] };
  const { ctx, calls } = makePU(D);
  await ctx.Piutang.delete('p1');
  assert.equal(D.piutang.length, 1);
  assert.equal(D.piutang[0].id, 'p2');
  assert.equal(calls.save, 1);
});

// ================= Piutang.totalValue / overdueDays / sortedActive =================

test('Piutang.totalValue — jumlah nilai yg belum lunas saja', () => {
  const D = { piutang: [{ nilai: 100, lunas: false }, { nilai: 200, lunas: true }, { nilai: 50, lunas: false }] };
  const { ctx } = makePU(D);
  assert.equal(ctx.Piutang.totalValue(), 150);
});

test('Piutang.overdueDays — lunas -> 0', () => {
  const { ctx } = makePU({});
  assert.equal(ctx.Piutang.overdueDays({ lunas: true, jatuhTempo: '2020-01-01' }), 0);
});

test('Piutang.overdueDays — tanpa jatuhTempo -> 0', () => {
  const { ctx } = makePU({});
  assert.equal(ctx.Piutang.overdueDays({ lunas: false, jatuhTempo: '' }), 0);
});

test('Piutang.overdueDays — belum lewat jatuh tempo -> 0', () => {
  const { ctx } = makePU({});
  const future = new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10);
  assert.equal(ctx.Piutang.overdueDays({ lunas: false, jatuhTempo: future }), 0);
});

test('Piutang.overdueDays — sudah lewat -> jumlah hari positif', () => {
  const { ctx } = makePU({});
  const past = new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10);
  const days = ctx.Piutang.overdueDays({ lunas: false, jatuhTempo: past });
  assert.ok(days >= 2 && days <= 4); // toleransi krn boundary jam
});

test('Piutang.sortedActive — hanya yg belum lunas, prioritas overdue (hari*nilai desc) di atas', () => {
  const past1 = new Date(Date.now() - 10 * 86400000).toISOString().slice(0, 10);
  const past2 = new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10);
  const D = {
    piutang: [
      { id: 'a', name: 'A', nilai: 100, lunas: false, jatuhTempo: past2 }, // overdue kecil
      { id: 'b', name: 'B', nilai: 1000000, lunas: false, jatuhTempo: past1 }, // overdue besar+lama -> prioritas
      { id: 'c', name: 'C', nilai: 500, lunas: true }, // lunas, diabaikan
    ],
  };
  const { ctx } = makePU(D);
  const sorted = ctx.Piutang.sortedActive();
  assert.equal(sorted.length, 2);
  assert.equal(sorted[0].id, 'b');
});

test('Piutang.sortedActive — tanpa jatuh tempo diurutkan setelah yg ada jatuh tempo, lalu by nilai desc', () => {
  const D = {
    piutang: [
      { id: 'a', name: 'A', nilai: 100, lunas: false, jatuhTempo: '' },
      { id: 'b', name: 'B', nilai: 500, lunas: false, jatuhTempo: '' },
    ],
  };
  const { ctx } = makePU(D);
  const sorted = ctx.Piutang.sortedActive();
  assert.equal(sorted[0].id, 'b'); // nilai lebih besar duluan
});

// ================= Piutang.renderList =================

test('Piutang.renderList — kosong -> tampilkan empty state', () => {
  const D = { piutang: [] };
  const { ctx, fakeDocument } = makePU(D);
  ctx.Piutang.renderList();
  assert.match(fakeDocument.getElementById('piutangList').innerHTML, /Belum ada piutang/);
});

test('Piutang.renderList — ada prioritas overdue -> tampilkan banner "Prioritas tagih"', () => {
  const past = new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10);
  const D = { piutang: [{ id: 'p1', name: 'Budi', nilai: 100000, lunas: false, jatuhTempo: past }] };
  const { ctx, fakeDocument } = makePU(D);
  ctx.Piutang.renderList();
  assert.match(fakeDocument.getElementById('piutangList').innerHTML, /Prioritas tagih/);
});

// ================= Debt.openModal / toggleLunas =================

test('Debt.openModal — mode tambah: default kosong, panggil updateAmtPreview 2x', () => {
  const D = { debts: [] };
  const { ctx, fakeDocument, calls } = makePU(D);
  ctx.Debt.openModal();
  assert.equal(fakeDocument.getElementById('debtModalTitle').textContent, 'Tambah Utang');
  assert.equal(calls.render.filter((r) => r[0] === 'updateAmtPreview').length, 2);
  assert.ok(calls.openModal.includes('debtModal'));
});

test('Debt.openModal — mode edit: prefill nilai, bunga, cicilan', () => {
  const D = { debts: [{ id: 'd1', name: 'Bank X', nilai: 1000000, bunga: 12, cicilanBulanan: 100000, lunas: false }] };
  const { ctx, fakeDocument } = makePU(D);
  ctx.Debt.openModal('d1');
  assert.equal(fakeDocument.getElementById('debtModalTitle').textContent, 'Edit Utang');
  assert.equal(fakeDocument.getElementById('debtName').value, 'Bank X');
  assert.equal(fakeDocument.getElementById('debtBunga').value, 12);
  assert.equal(fakeDocument.getElementById('debtCicilan').value, 100000);
});

test('Debt.toggleLunas — membalik state & tampilan tombol', () => {
  const D = { debts: [] };
  const { ctx, fakeDocument } = makePU(D);
  ctx.Debt.openModal();
  ctx.Debt.toggleLunas();
  assert.equal(fakeDocument.getElementById('debtLunasBtn').textContent, '✓ Lunas');
});

// ================= Debt.save / syncBill =================

test('Debt.save — nama kosong -> toast peringatan, tidak nambah', () => {
  const D = { debts: [], bills: [] };
  const { ctx, calls } = makePU(D, { domValues: { debtName: { value: '' } } });
  ctx.Debt.save();
  assert.equal(D.debts.length, 0);
  assert.ok(calls.toast[0].includes('pemberi pinjaman'));
});

test('Debt.save — tambah baru tanpa cicilan -> tidak bikin tagihan (Bill) otomatis', () => {
  const D = { debts: [], bills: [], accounts: [{ id: 'acc1' }] };
  const { ctx, calls } = makePU(D, { domValues: { debtName: { value: 'Bank X' }, debtNilai: { value: '1000000' } } });
  ctx.Debt.save();
  assert.equal(D.debts.length, 1);
  assert.equal(D.bills.length, 0);
  assert.equal(D.debts[0].billId, null);
  assert.equal(calls.save, 1);
  assert.ok(calls.render.some((r) => r[0] === 'renderBillList'));
  assert.ok(calls.render.some((r) => r[0] === 'checkBills'));
});

test('Debt.save — tambah baru dgn cicilan aktif & belum lunas -> auto bikin Bill tersinkron', () => {
  const D = { debts: [], bills: [], accounts: [{ id: 'acc1' }] };
  const { ctx } = makePU(D, {
    domValues: { debtName: { value: 'Bank X' }, debtNilai: { value: '1000000' }, debtCicilan: { value: '100000' } },
  });
  ctx.Debt.save();
  assert.equal(D.bills.length, 1);
  assert.equal(D.bills[0].kind, 'utang');
  assert.equal(D.bills[0].amount, 100000);
  assert.equal(D.bills[0].name, 'Cicilan: Bank X');
  assert.equal(D.debts[0].billId, D.bills[0].id);
});

test('Debt.save — utang ditandai lunas -> Bill terkait dihapus otomatis', () => {
  const D = {
    debts: [{ id: 'd1', name: 'Bank X', nilai: 1000000, cicilanBulanan: 100000, billId: 'bill1', lunas: false }],
    bills: [{ id: 'bill1', kind: 'utang', debtId: 'd1' }],
    accounts: [],
  };
  const { ctx } = makePU(D, {
    domValues: { debtName: { value: 'Bank X' }, debtNilai: { value: '1000000' }, debtCicilan: { value: '100000' } },
  });
  ctx.Debt.openModal('d1');
  ctx.Debt.toggleLunas(); // jadi lunas
  ctx.Debt.save();
  assert.equal(D.bills.length, 0);
  assert.equal(D.debts[0].billId, null);
});

test('Debt.save — Bill sudah ada: update field (bukan bikin baru), sinkron nextDue kalau sudah lewat', () => {
  const D = {
    debts: [{ id: 'd1', name: 'Lama', nilai: 500000, cicilanBulanan: 50000, billId: 'bill1', lunas: false }],
    bills: [{ id: 'bill1', kind: 'utang', debtId: 'd1', name: 'Cicilan: Lama', amount: 50000, nextDue: '2020-01-01' }],
    accounts: [],
  };
  const { ctx, fakeDocument } = makePU(D);
  ctx.Debt.openModal('d1');
  fakeDocument.getElementById('debtName').value = 'Baru';
  fakeDocument.getElementById('debtCicilan').value = '75000';
  ctx.Debt.save();
  assert.equal(D.bills.length, 1); // tetap 1 bill, diupdate bukan ditambah
  assert.equal(D.bills[0].name, 'Cicilan: Baru');
  assert.equal(D.bills[0].amount, 75000);
  assert.notEqual(D.bills[0].nextDue, '2020-01-01'); // sudah lewat -> disegarkan
});

// ================= Debt.delete =================

test('Debt.delete — batal konfirmasi -> tidak hapus', async () => {
  const D = { debts: [{ id: 'd1' }], bills: [] };
  const { ctx, calls } = makePU(D, { askConfirm: async () => false });
  await ctx.Debt.delete('d1');
  assert.equal(D.debts.length, 1);
  assert.equal(calls.save, 0);
});

test('Debt.delete — konfirmasi setuju -> hapus utang & bill terkaitnya', async () => {
  const D = {
    debts: [{ id: 'd1', billId: 'bill1' }, { id: 'd2' }],
    bills: [{ id: 'bill1' }],
  };
  const { ctx, calls } = makePU(D);
  await ctx.Debt.delete('d1');
  assert.equal(D.debts.length, 1);
  assert.equal(D.debts[0].id, 'd2');
  assert.equal(D.bills.length, 0);
  assert.equal(calls.save, 1);
});

// ================= Debt.totalValue / totalCicilanBulanan =================

test('Debt.totalValue / totalCicilanBulanan — jumlah dari utang yg belum lunas saja', () => {
  const D = {
    debts: [
      { nilai: 1000000, cicilanBulanan: 100000, lunas: false },
      { nilai: 500000, cicilanBulanan: 50000, lunas: true },
    ],
  };
  const { ctx } = makePU(D);
  assert.equal(ctx.Debt.totalValue(), 1000000);
  assert.equal(ctx.Debt.totalCicilanBulanan(), 100000);
});

// ================= Debt.renderList =================

test('Debt.renderList — kosong -> tampilkan empty state, total tetap terisi 0', () => {
  const D = { debts: [] };
  const { ctx, fakeDocument } = makePU(D);
  ctx.Debt.renderList();
  assert.match(fakeDocument.getElementById('debtList').innerHTML, /Belum ada utang/);
  assert.equal(fakeDocument.getElementById('debtTotalVal').textContent, 'Rp0');
});

test('Debt.renderList — render daftar & panggil DebtStrategy.render() otomatis', () => {
  const D = { debts: [{ id: 'd1', name: 'Bank X', nilai: 1000000, cicilanBulanan: 100000, bunga: 10, lunas: false }] };
  const { ctx, fakeDocument } = makePU(D);
  ctx.Debt.renderList();
  assert.match(fakeDocument.getElementById('debtList').innerHTML, /Bank X/);
  assert.equal(fakeDocument.getElementById('debtTotalVal').textContent, 'Rp1000000');
  // DebtStrategy.render ikut jalan (dsResult keisi, bukan tetap kosong)
  assert.notEqual(fakeDocument.getElementById('dsResult').innerHTML, '');
});

// ================= DebtStrategy =================

test('DebtStrategy.activeDebts — hanya utang belum lunas & nilai > 0', () => {
  const D = { debts: [{ nilai: 100, lunas: false }, { nilai: 0, lunas: false }, { nilai: 100, lunas: true }] };
  const { ctx } = makePU(D);
  assert.equal(ctx.DebtStrategy.activeDebts().length, 1);
});

test('DebtStrategy.computeOrder — metode snowball: urut nilai kecil ke besar', () => {
  const { ctx } = makePU({});
  const list = [{ nilai: 500 }, { nilai: 100 }, { nilai: 300 }];
  const order = ctx.DebtStrategy.computeOrder(list, 'snowball');
  assert.deepEqual(order.map((d) => d.nilai), [100, 300, 500]);
});

test('DebtStrategy.computeOrder — metode avalanche (default): urut bunga besar ke kecil', () => {
  const { ctx } = makePU({});
  const list = [{ bunga: 5 }, { bunga: 20 }, { bunga: 10 }];
  const order = ctx.DebtStrategy.computeOrder(list, 'avalanche');
  assert.deepEqual(order.map((d) => d.bunga), [20, 10, 5]);
});

test('DebtStrategy.computeDSR — tanpa data income -> pct null', () => {
  const D = { debts: [{ nilai: 100, cicilanBulanan: 100000, lunas: false }], bills: [] };
  const { ctx } = makePU(D);
  const dsr = ctx.DebtStrategy.computeDSR();
  assert.equal(dsr.pct, null);
  assert.equal(dsr.totalCicilanUtang, 100000);
});

test('DebtStrategy.computeDSR — dgn WorthIt.incomeAvg tersedia -> hitung pct = totalCicilan/income*100', () => {
  const D = {
    debts: [{ nilai: 100, cicilanBulanan: 200000, lunas: false }],
    bills: [{ kind: 'cicilan', sisaTenor: 5, amount: 100000 }, { kind: 'cicilan', sisaTenor: null, amount: 999999 }],
  };
  const { ctx } = makePU(D, { WorthIt: { incomeAvg: () => 1000000 } });
  const dsr = ctx.DebtStrategy.computeDSR();
  assert.equal(dsr.totalCicilanUtang, 200000);
  assert.equal(dsr.totalCicilanLain, 100000); // hanya bill cicilan dgn sisaTenor terisi
  assert.equal(dsr.totalCicilan, 300000);
  assert.equal(dsr.pct, 30);
});

test('DebtStrategy.simulate — tidak ada utang dgn cicilan > 0 -> months null', () => {
  const { ctx } = makePU({});
  const result = ctx.DebtStrategy.simulate([{ id: 'd1', cicilanBulanan: 0, nilai: 100 }], 0);
  assert.equal(result.months, null);
});

test('DebtStrategy.simulate — utang tunggal tanpa bunga, cicilan cukup -> lunas sesuai perhitungan sederhana', () => {
  const { ctx } = makePU({});
  // nilai 1jt, cicilan 100rb/bln, tanpa bunga -> lunas dlm 10 bulan
  const result = ctx.DebtStrategy.simulate([{ id: 'd1', bunga: 0, cicilanBulanan: 100000, nilai: 1000000 }], 0);
  assert.equal(result.months, 10);
  assert.equal(result.totalInterest, 0);
  assert.equal(result.payoffMonth.d1, 10);
});

test('DebtStrategy.simulate — dana ekstra mempercepat pelunasan', () => {
  const { ctx } = makePU({});
  const base = ctx.DebtStrategy.simulate([{ id: 'd1', bunga: 0, cicilanBulanan: 100000, nilai: 1000000 }], 0);
  const withExtra = ctx.DebtStrategy.simulate([{ id: 'd1', bunga: 0, cicilanBulanan: 100000, nilai: 1000000 }], 100000);
  assert.ok(withExtra.months < base.months);
});

test('DebtStrategy.setMethod — simpan metode & panggil render (dibuktikan lewat state D)', () => {
  const D = { debts: [] };
  const { ctx } = makePU(D);
  ctx.DebtStrategy.setMethod('snowball');
  assert.equal(D.debtStrategy.method, 'snowball');
});

test('DebtStrategy.onExtraInput — simpan nilai extra dari input dsExtra', () => {
  const D = { debts: [] };
  const { ctx } = makePU(D, { domValues: { dsExtra: { value: '250000' } } });
  ctx.DebtStrategy.onExtraInput();
  assert.equal(D.debtStrategy.extra, 250000);
});

test('DebtStrategy.render — tidak ada utang aktif -> tampilkan empty state', () => {
  const D = { debts: [] };
  const { ctx, fakeDocument } = makePU(D, { queryGroups: { '#dsMethodChips .chip-btn': [] } });
  ctx.DebtStrategy.render();
  assert.match(fakeDocument.getElementById('dsResult').innerHTML, /strategi pelunasan/);
});

test('DebtStrategy.render — ada utang aktif, method chip aktif ditandai sesuai D.debtStrategy.method', () => {
  const chipAvalanche = createFakeElement();
  const chipSnowball = createFakeElement();
  const D = { debts: [{ id: 'd1', name: 'Bank X', nilai: 1000000, cicilanBulanan: 100000, bunga: 10, lunas: false }], debtStrategy: { method: 'snowball', extra: 0 } };
  const { ctx, fakeDocument } = makePU(D, { queryGroups: { '#dsMethodChips .chip-btn': [chipAvalanche, chipSnowball] } });
  ctx.DebtStrategy.render();
  assert.equal(chipAvalanche.classList.contains('active'), false);
  assert.equal(chipSnowball.classList.contains('active'), true);
  assert.match(fakeDocument.getElementById('dsResult').innerHTML, /Bank X/);
});

// ================= Bill.openLinkTxModal =================

test('Bill.openLinkTxModal — curBillHistoryId kosong -> toast peringatan, tidak buka LinkTx', () => {
  const { ctx, calls } = makePU({}, { curBillHistoryId: null });
  ctx.Bill.openLinkTxModal();
  assert.ok(calls.toast[0].includes('Riwayat Pembayaran'));
  assert.equal(calls.render.some((r) => r[0] === 'LinkTx.open'), false);
});

test('Bill.openLinkTxModal — ada curBillHistoryId -> buka LinkTx dgn kind "bill"', () => {
  const { ctx, calls } = makePU({}, { curBillHistoryId: 'hist1' });
  ctx.Bill.openLinkTxModal();
  assert.ok(calls.render.some((r) => r[0] === 'LinkTx.open' && r[1] === 'bill' && r[2] === 'hist1'));
});
