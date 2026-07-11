'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadSource } = require('./helpers/loadSource');
const { createFakeDocument } = require('./helpers/fakeDom');

// Cakupan file ini SENGAJA dibatasi ke bagian yang sudah bisa dites tanpa
// jaringan/kripto: EduFund.calc() (logic murni), save()/del()/render()/
// renderDashMini()/updatePreview() (DOM sederhana via fakeDom). EduFund.openModal()
// (murni prefill form dari data existing, sama seperti BBM.openModal/Servis.openModal
// di catatan CLAUDE.md — nilai gunanya lebih rendah drpd yg sudah dites) dan
// EduFund.checkAI() (butuh mock callAIProviderRaw/RefAI._parseJSON, showPromptModal
// async — ranah test terpisah yang lebih berat) SENGAJA belum dites di sini.

function makeEduFund(D, stubs = {}, docOverrides = {}) {
  const fakeDocument = createFakeDocument({
    eduFundModalTitle: {}, eduName: {}, eduBiayaHariIni: {}, eduTahunTarget: {},
    eduInflasi: {}, eduReturn: {}, eduTerkumpul: {}, eduAcc: {},
    eduFundPreview: {}, eduSavedWrap: {}, eduFundList: {},
    dashEduFundMiniCard: {}, dashEduFundTerkumpul: {}, dashEduFundTarget: {},
    dashEduFundPct: {}, dashEduFundBar: {}, dashEduFundSub: {},
    ...docOverrides,
  });
  const toasts = [];
  const ctx = loadSource(['edukasi-dana.js'], {
    D,
    document: fakeDocument,
    save: stubs.save || (() => {}),
    toast: stubs.toast || ((msg) => toasts.push(msg)),
    openModal: stubs.openModal || (() => {}),
    closeModal: stubs.closeModal || (() => {}),
    uid: stubs.uid || (() => 'uid-' + Math.random().toString(36).slice(2)),
    sameId: stubs.sameId || ((a, b) => String(a) === String(b)),
    escapeHtml: stubs.escapeHtml || ((s) => String(s == null ? '' : s)),
    fmt: stubs.fmt || ((n) => String(Math.round(n))),
    fmtFull: stubs.fmtFull || ((n) => 'Rp' + String(Math.round(n))),
    parsePzNum: stubs.parsePzNum || ((v) => parseFloat(v) || 0),
    recalcAccBalance: stubs.recalcAccBalance || (() => 0),
  }, ['EduFund']);
  return { EduFund: ctx.EduFund, fakeDocument, toasts };
}

// ================= EduFund.calc() =================

test('calc — tahun target tahun ini/sudah lewat (n<=0): pmtBulanan = seluruh kekurangan sekaligus', () => {
  const { EduFund } = makeEduFund({ accounts: [] });
  const thisYear = new Date().getFullYear();
  const r = EduFund.calc({ tahunTarget: String(thisYear - 1), biayaHariIni: '10000000', terkumpul: '4000000', inflasi: '10', returnAsumsi: '5' });
  assert.equal(r.n, 0);
  assert.equal(r.fv, 10000000); // n=0 -> tidak ada inflasi yg diterapkan
  assert.equal(r.kekurangan, 6000000);
  assert.equal(r.pmtBulanan, 6000000);
});

test('calc — n>0, inflasi != return: pakai rumus anuitas, pmtBulanan positif & fv > biaya hari ini', () => {
  const { EduFund } = makeEduFund({ accounts: [] });
  const nextYear = new Date().getFullYear() + 5;
  const r = EduFund.calc({ tahunTarget: String(nextYear), biayaHariIni: '20000000', terkumpul: '0', inflasi: '12', returnAsumsi: '8' });
  assert.equal(r.n, 5);
  assert.ok(r.fv > 20000000, 'fv harus lebih besar dari biaya hari ini krn inflasi positif');
  assert.ok(r.pmtBulanan > 0);
  assert.equal(r.kekurangan, r.fv); // terkumpul 0 -> kekurangan = fv penuh
});

test('calc — inflasi == return (r riil ~0): pmtBulanan = kekurangan dibagi rata per bulan', () => {
  const { EduFund } = makeEduFund({ accounts: [] });
  const nextYear = new Date().getFullYear() + 2;
  const r = EduFund.calc({ tahunTarget: String(nextYear), biayaHariIni: '12000000', terkumpul: '0', inflasi: '10', returnAsumsi: '10' });
  assert.equal(r.n, 2);
  // r riil ~0 -> fv dibagi rata 24 bulan
  assert.equal(r.pmtBulanan, Math.round(r.fv / 24));
});

test('calc — terkumpul melebihi target: kekurangan diklem ke 0, pmtBulanan 0 (tidak negatif)', () => {
  const { EduFund } = makeEduFund({ accounts: [] });
  const nextYear = new Date().getFullYear() + 3;
  const r = EduFund.calc({ tahunTarget: String(nextYear), biayaHariIni: '5000000', terkumpul: '999999999', inflasi: '12', returnAsumsi: '8' });
  assert.equal(r.kekurangan, 0);
  assert.equal(r.pmtBulanan, 0);
});

test('calc — accountId terisi: terkumpul diambil dari recalcAccBalance(), BUKAN dari field terkumpul manual', () => {
  const { EduFund } = makeEduFund({ accounts: [{ id: 'a1' }] }, {
    recalcAccBalance: (id) => (id === 'a1' ? 7000000 : 0),
  });
  const nextYear = new Date().getFullYear() + 1;
  const r = EduFund.calc({ tahunTarget: String(nextYear), biayaHariIni: '10000000', terkumpul: '111', accountId: 'a1', inflasi: '0', returnAsumsi: '0' });
  assert.equal(r.terkumpul, 7000000); // bukan 111
});

// ================= EduFund.updatePreview() =================

test('updatePreview — tahun target sudah lewat: preview tampilkan pesan warning kebutuhan sekarang', () => {
  const thisYear = new Date().getFullYear();
  const { EduFund, fakeDocument } = makeEduFund({ accounts: [] }, {}, {
    eduBiayaHariIni: { value: '5000000' },
    eduTahunTarget: { value: String(thisYear - 2) },
    eduInflasi: { value: '12' },
    eduReturn: { value: '8' },
    eduTerkumpul: { value: '1000000' },
  });
  EduFund.updatePreview();
  const html = fakeDocument.getElementById('eduFundPreview').innerHTML;
  assert.match(html, /sudah lewat/);
});

test('updatePreview — kasus normal: preview memuat perkiraan biaya & nabung/bulan', () => {
  const nextYear = new Date().getFullYear() + 4;
  const { EduFund, fakeDocument } = makeEduFund({ accounts: [] }, {}, {
    eduBiayaHariIni: { value: '15000000' },
    eduTahunTarget: { value: String(nextYear) },
    eduInflasi: { value: '12' },
    eduReturn: { value: '8' },
    eduTerkumpul: { value: '0' },
    eduAcc: { value: '' },
  });
  EduFund.updatePreview();
  const html = fakeDocument.getElementById('eduFundPreview').innerHTML;
  assert.match(html, /Perkiraan biaya/);
  assert.match(html, /nabung/);
});

test('updatePreview — akun terkait dipilih: eduSavedWrap disembunyikan, TIDAK dipilih: ditampilkan', () => {
  const nextYear = new Date().getFullYear() + 1;
  const { EduFund, fakeDocument } = makeEduFund({ accounts: [{ id: 'a1' }] }, {}, {
    eduBiayaHariIni: { value: '1000000' },
    eduTahunTarget: { value: String(nextYear) },
    eduInflasi: { value: '0' }, eduReturn: { value: '0' }, eduTerkumpul: { value: '0' },
    eduAcc: { value: 'a1' },
  });
  EduFund.updatePreview();
  assert.equal(fakeDocument.getElementById('eduSavedWrap').style.display, 'none');
  fakeDocument.getElementById('eduAcc').value = '';
  EduFund.updatePreview();
  assert.equal(fakeDocument.getElementById('eduSavedWrap').style.display, '');
});

// ================= EduFund.save() =================

function baseSaveDom(overrides = {}) {
  const nextYear = new Date().getFullYear() + 3;
  return {
    eduName: { value: 'Anak Pertama' },
    eduBiayaHariIni: { value: '20000000' },
    eduTahunTarget: { value: String(nextYear) },
    eduInflasi: { value: '12' },
    eduReturn: { value: '8' },
    eduTerkumpul: { value: '1000000' },
    eduAcc: { value: '' },
    ...overrides,
  };
}

test('save — nama kosong: ditolak dgn toast warning, tidak masuk D.eduFunds', () => {
  const D = { eduFunds: [], accounts: [] };
  const { EduFund, toasts } = makeEduFund(D, {}, baseSaveDom({ eduName: { value: '  ' } }));
  EduFund.save();
  assert.equal(D.eduFunds.length, 0);
  assert.ok(toasts.some((t) => t.includes('Nama')));
});

test('save — biaya hari ini kosong/0: ditolak dgn toast warning', () => {
  const D = { eduFunds: [], accounts: [] };
  const { EduFund, toasts } = makeEduFund(D, {}, baseSaveDom({ eduBiayaHariIni: { value: '' } }));
  EduFund.save();
  assert.equal(D.eduFunds.length, 0);
  assert.ok(toasts.some((t) => t.includes('Biaya hari ini')));
});

test('save — data valid & bukan edit: entry baru ditambahkan ke D.eduFunds', () => {
  const D = { eduFunds: [], accounts: [] };
  const { EduFund, toasts } = makeEduFund(D, {}, baseSaveDom());
  EduFund.save();
  assert.equal(D.eduFunds.length, 1);
  assert.equal(D.eduFunds[0].name, 'Anak Pertama');
  assert.equal(D.eduFunds[0].biayaHariIni, 20000000);
  assert.ok(toasts.some((t) => t.includes('tersimpan')));
});

test('save — mode edit (EduFund.editId diset): entry existing di-update di tempat, bukan ditambah baru', () => {
  const D = { eduFunds: [{ id: 'e1', name: 'Lama', biayaHariIni: 1, tahunTarget: 2020, inflasi: 1, returnAsumsi: 1, accountId: null, terkumpul: 0 }], accounts: [] };
  const { EduFund } = makeEduFund(D, {}, baseSaveDom({ eduName: { value: 'Nama Baru' } }));
  EduFund.editId = 'e1';
  EduFund.save();
  assert.equal(D.eduFunds.length, 1);
  assert.equal(D.eduFunds[0].name, 'Nama Baru');
});

test('save — accountId terisi: terkumpul manual diabaikan, dipaksa 0 (nilai riil diambil live via recalcAccBalance saat render)', () => {
  const D = { eduFunds: [], accounts: [{ id: 'a1' }] };
  const { EduFund } = makeEduFund(D, {}, baseSaveDom({ eduAcc: { value: 'a1' }, eduTerkumpul: { value: '999999' } }));
  EduFund.save();
  assert.equal(D.eduFunds[0].terkumpul, 0);
  assert.equal(D.eduFunds[0].accountId, 'a1');
});

// ================= EduFund.del() =================

test('del — menghapus entry sesuai id, tidak menyentuh entry lain', () => {
  const D = { eduFunds: [{ id: 'e1', name: 'A' }, { id: 'e2', name: 'B' }], accounts: [] };
  const { EduFund, toasts } = makeEduFund(D);
  EduFund.del('e1');
  assert.deepEqual(D.eduFunds.map((x) => x.id), ['e2']);
  assert.ok(toasts.some((t) => t.includes('dihapus')));
});

// ================= EduFund.renderDashMini() =================

test('renderDashMini — tidak ada eduFunds sama sekali: card disembunyikan', () => {
  const D = { eduFunds: [], accounts: [] };
  const { EduFund, fakeDocument } = makeEduFund(D);
  EduFund.renderDashMini();
  assert.equal(fakeDocument.getElementById('dashEduFundMiniCard').style.display, 'none');
});

test('renderDashMini — ada eduFunds: total terkumpul/target/pct dihitung & card ditampilkan', () => {
  const nextYear = new Date().getFullYear() + 2;
  const D = {
    eduFunds: [
      { id: 'e1', name: 'A', biayaHariIni: 10000000, tahunTarget: nextYear, inflasi: 0, returnAsumsi: 0, accountId: null, terkumpul: 5000000 },
    ],
    accounts: [],
  };
  const { EduFund, fakeDocument } = makeEduFund(D);
  EduFund.renderDashMini();
  assert.equal(fakeDocument.getElementById('dashEduFundMiniCard').style.display, 'block');
  assert.equal(fakeDocument.getElementById('dashEduFundPct').textContent, '50%');
});

// ================= EduFund.render() =================

test('render — daftar kosong: tampilkan empty state', () => {
  const D = { eduFunds: [], accounts: [] };
  const { EduFund, fakeDocument } = makeEduFund(D);
  EduFund.render();
  assert.match(fakeDocument.getElementById('eduFundList').innerHTML, /Belum ada rencana/);
});

test('render — entry dgn accountId terkait: linkTag akun ikut dirender di list', () => {
  const nextYear = new Date().getFullYear() + 1;
  const D = {
    eduFunds: [{ id: 'e1', name: 'Anak', biayaHariIni: 1000000, tahunTarget: nextYear, inflasi: 0, returnAsumsi: 0, accountId: 'a1', terkumpul: 0 }],
    accounts: [{ id: 'a1', name: 'Tabungan Pendidikan', emoji: '🏦' }],
  };
  const { EduFund, fakeDocument } = makeEduFund(D);
  EduFund.render();
  const html = fakeDocument.getElementById('eduFundList').innerHTML;
  assert.match(html, /Tabungan Pendidikan/);
});
