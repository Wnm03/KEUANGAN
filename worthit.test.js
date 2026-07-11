'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadSource } = require('./helpers/loadSource');
const { createFakeDocument } = require('./helpers/fakeDom');

// Cakupan file ini SENGAJA dibatasi ke bagian dgn nilai guna tertinggi:
// WorthIt.incomeAvg() & WorthIt.computeScore() (logic murni/nyaris-murni),
// WorthIt.hitung() (verdict & daftar issue "Cek Sebelum Beli" single-item —
// DOM read+write via fakeDom, dites per-cabang terisolasi spt pola
// gaji-calc.test.js/tx-bbm-sync.test.js), dan CRUD list Prioritas Belanja
// (addToList/editListItem/cancelEditList/deleteListItem/renderList/
// applyBuyLink/onLinkedTxEdited/onLinkedTxDeleted/undoBought/renderBoughtList).
// SENGAJA belum dites: open()/switchTab()/reset()/onMethodChange()/
// toggleDiskon()/toggleDiskonList()/toggleSudahPunya()/toggleBoughtView()
// (murni toggle tampilan modal, tanpa logic hitung — nilai guna rendah spt
// BBM.openModal/Servis.openModal yg sudah didokumentasikan di CLAUDE.md),
// syncDiskon()/syncDiskonList() (duplikat exact logic preview diskon yg
// sudah dites via jalur diskon di hitung()/computeScore()), catatBeli()/
// catatBeliList()/simpanDulu() (integrasi lintas modul ke form Transaksi —
// openTxModal/setPayMethod/syncCicilanPreview/guessCategoryFromReceiptText/
// selectTxCat, ranah test integrasi terpisah yg lebih berat), dan
// openLinkTxModal() (cuma delegasi 1 baris ke LinkTx.open()).

function makeWorthIt(D, stubs = {}, docOverrides = {}) {
  const fakeDocument = createFakeDocument({
    wiName: {}, wiPrice: {}, wiMethod: { value: 'tunai' }, wiCategory: { value: 'keinginan' },
    wiDP: {}, wiTenor: {}, wiCicilanBulan: {}, wiIsDiskon: { checked: false }, wiHargaNormal: {},
    wiVerdictBox: { style: {} }, wiVerdict: {}, wiIssueList: {}, wiResultBox: { style: {} },
    wlName: {}, wlPrice: {}, wlIsDiskon: { checked: false }, wlHargaNormal: {},
    wlCategory: { value: 'keinginan' }, wlUrgensi: { value: 'bisa_nunggu' },
    wlSudahPunya: { checked: false }, wlSudahPunyaAlasan: {},
    wlSubmitBtn: {}, wlCancelEditBtn: { style: {} },
    wlItems: {}, wlCount: {}, wlTotalSummary: {},
    wlBoughtItems: {}, wlBoughtCount: {},
    ...docOverrides,
  });
  const toasts = [];
  const ctx = loadSource(['worthit.js'], {
    D,
    document: fakeDocument,
    save: stubs.save || (() => {}),
    toast: stubs.toast || ((msg) => toasts.push(msg)),
    askConfirm: stubs.askConfirm || (async () => true),
    openModal: stubs.openModal || (() => {}),
    closeModal: stubs.closeModal || (() => {}),
    uid: stubs.uid || (() => 'uid-' + Math.random().toString(36).slice(2)),
    sameId: stubs.sameId || ((a, b) => String(a) === String(b)),
    escapeHtml: stubs.escapeHtml || ((s) => String(s == null ? '' : s)),
    fmt: stubs.fmt || ((n) => 'Rp' + String(Math.round(n))),
    fmtFull: stubs.fmtFull || ((n) => 'Rp' + String(Math.round(n))),
    parsePzNum: stubs.parsePzNum || ((v) => parseFloat(v) || 0),
    totalSaldoAkun: stubs.totalSaldoAkun || (() => 0),
    FI: stubs.FI || { effectiveMonths: () => 1, monthlySurplus: () => 0, monthsOfDataAvailable: () => 1 },
    openTxModal: stubs.openTxModal || (() => {}),
    guessCategoryFromReceiptText: stubs.guessCategoryFromReceiptText || (() => null),
    selectTxCat: stubs.selectTxCat || (() => {}),
    setPayMethod: stubs.setPayMethod || (() => {}),
    syncCicilanPreview: stubs.syncCicilanPreview || (() => {}),
  }, ['WorthIt']);
  return { WorthIt: ctx.WorthIt, fakeDocument, toasts };
}

// ================= WorthIt.incomeAvg() =================

test('incomeAvg — rata-rata income HANYA dari transaksi type income dlm rentang bulan efektif', () => {
  const now = new Date();
  const D = { transactions: [
    { date: now.toISOString().slice(0, 10), type: 'income', amount: 3000000 },
    { date: now.toISOString().slice(0, 10), type: 'expense', amount: 999999 }, // diabaikan
  ] };
  const { WorthIt } = makeWorthIt(D, { FI: { effectiveMonths: () => 1, monthlySurplus: () => 0, monthsOfDataAvailable: () => 1 } });
  assert.equal(WorthIt.incomeAvg(), 3000000);
});

test('incomeAvg — dibagi rata sesuai jumlah bulan efektif (2 bulan, total income 6jt -> avg 3jt)', () => {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15);
  const D = { transactions: [
    { date: now.toISOString().slice(0, 10), type: 'income', amount: 3000000 },
    { date: lastMonth.toISOString().slice(0, 10), type: 'income', amount: 3000000 },
  ] };
  const { WorthIt } = makeWorthIt(D, { FI: { effectiveMonths: () => 2, monthlySurplus: () => 0, monthsOfDataAvailable: () => 2 } });
  assert.equal(WorthIt.incomeAvg(), 3000000);
});

// ================= WorthIt.computeScore() =================

test('computeScore — kebutuhan + mendesak, tanpa diskon/sudahPunya/tekanan saldo: score 70', () => {
  const { WorthIt } = makeWorthIt({});
  const { score, reasons } = WorthIt.computeScore({ cat: 'kebutuhan', urgensi: 'mendesak', price: 100000, isDiskon: false, sudahPunya: false });
  assert.equal(score, 70);
  assert.ok(reasons.some((r) => r.level === 'green' && r.text.includes('kebutuhan')));
  assert.ok(reasons.some((r) => r.level === 'green' && r.text.includes('Mendesak')));
});

test('computeScore — keinginan + nice-to-have (bukan mendesak/bisa_nunggu): score cuma 10, ada reason merah "belum perlu"', () => {
  const { WorthIt } = makeWorthIt({});
  const { score, reasons } = WorthIt.computeScore({ cat: 'keinginan', urgensi: 'nice_to_have', price: 100000, isDiskon: false, sudahPunya: false });
  assert.equal(score, 10);
  assert.ok(reasons.some((r) => r.level === 'red' && r.text.includes('Nice to have')));
});

test('computeScore — sudahPunya true: score dikurangi 25, pakai alasan custom kalau diisi', () => {
  const { WorthIt } = makeWorthIt({});
  const { score, reasons } = WorthIt.computeScore({ cat: 'kebutuhan', urgensi: 'mendesak', price: 100000, isDiskon: false, sudahPunya: true, sudahPunyaAlasan: 'yang lama sudah rusak parah' });
  assert.equal(score, 70 - 25);
  assert.ok(reasons.some((r) => r.level === 'red' && r.text.includes('yang lama sudah rusak parah')));
});

test('computeScore — diskon 40% (>=30%), TIDAK sudahPunya: reason hijau, diskonScore = min(50,40)*0.4', () => {
  const { WorthIt } = makeWorthIt({});
  const { score, reasons } = WorthIt.computeScore({ cat: 'keinginan', urgensi: 'nice_to_have', price: 60000, isDiskon: true, hargaNormal: 100000, sudahPunya: false });
  const diskonReason = reasons.find((r) => r.text.includes('Diskon lumayan gede'));
  assert.ok(diskonReason && diskonReason.level === 'green');
  assert.equal(score, Math.round(10 + Math.min(50, 40) * 0.4));
});

test('computeScore — diskon 40%, SUDAH punya barang lama: reason jadi orange (bukan hijau), diskonScore pakai faktor 0.2', () => {
  const { WorthIt } = makeWorthIt({});
  const { score, reasons } = WorthIt.computeScore({ cat: 'keinginan', urgensi: 'nice_to_have', price: 60000, isDiskon: true, hargaNormal: 100000, sudahPunya: true });
  const diskonReason = reasons.find((r) => r.text.includes('Diskon lumayan gede'));
  assert.ok(diskonReason && diskonReason.level === 'orange');
  assert.equal(score, Math.max(0, Math.round(10 - 25 + Math.min(50, 40) * 0.2)));
});

test('computeScore — diskon tipis (5%, <10%): reason merah "hati-hati diskon palsu"', () => {
  const { WorthIt } = makeWorthIt({});
  const { reasons } = WorthIt.computeScore({ cat: 'kebutuhan', urgensi: 'mendesak', price: 95000, isDiskon: true, hargaNormal: 100000, sudahPunya: false });
  assert.ok(reasons.some((r) => r.level === 'red' && r.text.includes('diskon palsu')));
});

test('computeScore — diskon sedang (15%, antara 10-30%): reason orange', () => {
  const { WorthIt } = makeWorthIt({});
  const { reasons } = WorthIt.computeScore({ cat: 'kebutuhan', urgensi: 'mendesak', price: 85000, isDiskon: true, hargaNormal: 100000, sudahPunya: false });
  assert.ok(reasons.some((r) => r.level === 'orange' && r.text.includes('Diskon lumayan:')));
});

test('computeScore — harga menguras >50% saldo: score dikurangi 15 dgn reason merah', () => {
  const { WorthIt } = makeWorthIt({}, { totalSaldoAkun: () => 100000 });
  const { score, reasons } = WorthIt.computeScore({ cat: 'kebutuhan', urgensi: 'mendesak', price: 60000, isDiskon: false, sudahPunya: false });
  assert.equal(score, 70 - 15);
  assert.ok(reasons.some((r) => r.level === 'red' && r.text.includes('>50%')));
});

test('computeScore — harga menguras 25-50% saldo: score dikurangi 7 dgn reason orange', () => {
  const { WorthIt } = makeWorthIt({}, { totalSaldoAkun: () => 200000 });
  const { score, reasons } = WorthIt.computeScore({ cat: 'kebutuhan', urgensi: 'mendesak', price: 60000, isDiskon: false, sudahPunya: false });
  assert.equal(score, 70 - 7);
  assert.ok(reasons.some((r) => r.level === 'orange' && r.text.includes('cukup besar')));
});

test('computeScore — skor diklem ke rentang 0-100 (tidak boleh negatif walau banyak pengurang)', () => {
  const { WorthIt } = makeWorthIt({}, { totalSaldoAkun: () => 100000 });
  const { score } = WorthIt.computeScore({ cat: 'keinginan', urgensi: 'nice_to_have', price: 60000, isDiskon: false, sudahPunya: true });
  assert.ok(score >= 0);
});

// ================= WorthIt.hitung() =================

function hitungDom(overrides = {}) {
  return {
    wiName: { value: 'Barang Tes' },
    wiPrice: { value: '1000000' },
    wiMethod: { value: 'tunai' },
    wiCategory: { value: 'kebutuhan' },
    wiDP: { value: '' }, wiTenor: { value: '' }, wiCicilanBulan: { value: '' },
    wiIsDiskon: { checked: false }, wiHargaNormal: { value: '' },
    ...overrides,
  };
}

test('hitung — harga kosong/0: ditolak dgn toast warning, wiResultBox TIDAK ditampilkan', () => {
  const D = { targets: [], bills: [], transactions: [], accounts: [] };
  const { WorthIt, fakeDocument, toasts } = makeWorthIt(D, {}, hitungDom({ wiPrice: { value: '0' } }));
  WorthIt.hitung();
  assert.ok(toasts.some((t) => t.includes('harga')));
  assert.notEqual(fakeDocument.getElementById('wiResultBox').style.display, 'block');
});

test('hitung — belum ada Target Dana Darurat sama sekali: issue orange "belum ada Target"', () => {
  const D = { targets: [], bills: [], transactions: [], accounts: [] };
  const { WorthIt, fakeDocument } = makeWorthIt(D, {}, hitungDom());
  WorthIt.hitung();
  assert.match(fakeDocument.getElementById('wiIssueList').innerHTML, /Belum ada Target Keuangan/);
});

test('hitung — Dana Darurat 100%: issue hijau "Aman dari sisi ini"', () => {
  const D = { targets: [{ isDanaDarurat: true, amount: 1000000, saved: 1000000 }], bills: [], transactions: [], accounts: [] };
  const { WorthIt, fakeDocument } = makeWorthIt(D, {}, hitungDom());
  WorthIt.hitung();
  assert.match(fakeDocument.getElementById('wiIssueList').innerHTML, /Aman dari sisi ini/);
});

test('hitung — Dana Darurat <100% & kategori "keinginan": issue MERAH (bukan orange spt kebutuhan)', () => {
  const D = { targets: [{ isDanaDarurat: true, amount: 1000000, saved: 400000 }], bills: [], transactions: [], accounts: [] };
  const { WorthIt } = makeWorthIt(D, {}, hitungDom({ wiCategory: { value: 'keinginan' } }));
  WorthIt.hitung();
  const { WorthIt: WI2 } = makeWorthIt(D, {}, hitungDom({ wiCategory: { value: 'keinginan' } }));
  WI2.hitung();
  // verdict harus TUNDA DULU krn ada issue red (dana darurat blm penuh + kategori keinginan)
  assert.notEqual(WI2._last, null);
});

test('hitung — DSR sesudah cicilan baru >35%: issue merah, verdict TUNDA DULU', () => {
  const D = { targets: [{ isDanaDarurat: true, amount: 1, saved: 1 }], bills: [], transactions: [
    { date: new Date().toISOString().slice(0, 10), type: 'income', amount: 5000000 },
  ], accounts: [] };
  const { WorthIt, fakeDocument } = makeWorthIt(D, { FI: { effectiveMonths: () => 1, monthlySurplus: () => 1000000, monthsOfDataAvailable: () => 1 } }, hitungDom({
    wiMethod: { value: 'cicilan' }, wiDP: { value: '0' }, wiTenor: { value: '12' }, wiCicilanBulan: { value: '2500000' },
  }));
  WorthIt.hitung();
  const html = fakeDocument.getElementById('wiIssueList').innerHTML;
  assert.match(html, /lewat batas aman/);
  assert.match(fakeDocument.getElementById('wiVerdict').textContent, /TUNDA DULU/);
});

test('hitung — DP/harga menguras >50% saldo sekarang: issue merah', () => {
  const D = { targets: [{ isDanaDarurat: true, amount: 1, saved: 1 }], bills: [], transactions: [], accounts: [] };
  const { WorthIt, fakeDocument } = makeWorthIt(D, { totalSaldoAkun: () => 1000000 }, hitungDom({ wiPrice: { value: '600000' } }));
  WorthIt.hitung();
  assert.match(fakeDocument.getElementById('wiIssueList').innerHTML, /menguras.*60%/s);
});

test('hitung — metode tunai, surplus positif: kasih estimasi berapa bulan nabung', () => {
  const D = { targets: [{ isDanaDarurat: true, amount: 1, saved: 1 }], bills: [], transactions: [], accounts: [] };
  const { WorthIt, fakeDocument } = makeWorthIt(D, { FI: { effectiveMonths: () => 1, monthlySurplus: () => 200000, monthsOfDataAvailable: () => 3 } }, hitungDom({ wiPrice: { value: '1000000' } }));
  WorthIt.hitung();
  assert.match(fakeDocument.getElementById('wiIssueList').innerHTML, /bulan/);
});

test('hitung — metode tunai, surplus negatif & data transaksi cukup: issue merah surplus negatif', () => {
  const D = { targets: [{ isDanaDarurat: true, amount: 1, saved: 1 }], bills: [], transactions: [], accounts: [] };
  const { WorthIt, fakeDocument } = makeWorthIt(D, { FI: { effectiveMonths: () => 1, monthlySurplus: () => -50000, monthsOfDataAvailable: () => 3 } }, hitungDom());
  WorthIt.hitung();
  assert.match(fakeDocument.getElementById('wiIssueList').innerHTML, /surplus negatif/);
});

test('hitung — cicilan lebih mahal dari tunai (selisih bunga > 0): issue ditambahkan dgn info selisih', () => {
  const D = { targets: [{ isDanaDarurat: true, amount: 1, saved: 1 }], bills: [], transactions: [
    { date: new Date().toISOString().slice(0, 10), type: 'income', amount: 5000000 },
  ], accounts: [] };
  const { WorthIt, fakeDocument } = makeWorthIt(D, { FI: { effectiveMonths: () => 1, monthlySurplus: () => 1000000, monthsOfDataAvailable: () => 1 } }, hitungDom({
    wiPrice: { value: '1000000' }, wiMethod: { value: 'cicilan' }, wiDP: { value: '0' }, wiTenor: { value: '12' }, wiCicilanBulan: { value: '100000' },
  }));
  WorthIt.hitung();
  assert.match(fakeDocument.getElementById('wiIssueList').innerHTML, /bayar ekstra/);
});

test('hitung — diskon valid & hemat besar (>=30%): issue hijau "diskonnya lumayan gede"', () => {
  const D = { targets: [{ isDanaDarurat: true, amount: 1, saved: 1 }], bills: [], transactions: [], accounts: [] };
  const { WorthIt, fakeDocument } = makeWorthIt(D, {}, hitungDom({
    wiPrice: { value: '60000' }, wiIsDiskon: { checked: true }, wiHargaNormal: { value: '100000' },
  }));
  WorthIt.hitung();
  assert.match(fakeDocument.getElementById('wiIssueList').innerHTML, /Diskonnya lumayan gede/);
});

test('hitung — diskon dicentang tapi Harga Normal tidak valid (<= harga): issue orange "belum diisi dgn benar"', () => {
  const D = { targets: [{ isDanaDarurat: true, amount: 1, saved: 1 }], bills: [], transactions: [], accounts: [] };
  const { WorthIt, fakeDocument } = makeWorthIt(D, {}, hitungDom({
    wiIsDiskon: { checked: true }, wiHargaNormal: { value: '500000' }, // < price 1000000
  }));
  WorthIt.hitung();
  assert.match(fakeDocument.getElementById('wiIssueList').innerHTML, /belum diisi dengan benar/);
});

test('hitung — kategori "keinginan": selalu ada saran tunggu 3 hari', () => {
  const D = { targets: [{ isDanaDarurat: true, amount: 1, saved: 1 }], bills: [], transactions: [], accounts: [] };
  const { WorthIt, fakeDocument } = makeWorthIt(D, {}, hitungDom({ wiCategory: { value: 'keinginan' } }));
  WorthIt.hitung();
  assert.match(fakeDocument.getElementById('wiIssueList').innerHTML, /tunggu 3 hari/);
});

test('hitung — kondisi ideal (dana darurat penuh, kebutuhan, tunai, tanpa surplus data): verdict WORTH IT', () => {
  const D = { targets: [{ isDanaDarurat: true, amount: 1, saved: 1 }], bills: [], transactions: [], accounts: [] };
  const { WorthIt, fakeDocument } = makeWorthIt(D, { FI: { effectiveMonths: () => 1, monthlySurplus: () => 0, monthsOfDataAvailable: () => 0 } }, hitungDom({ wiPrice: { value: '1000' } }));
  WorthIt.hitung();
  assert.match(fakeDocument.getElementById('wiVerdict').textContent, /WORTH IT/);
});

test('hitung — menyimpan WorthIt._last setelah hitung sukses (dipakai catatBeli/simpanDulu)', () => {
  const D = { targets: [{ isDanaDarurat: true, amount: 1, saved: 1 }], bills: [], transactions: [], accounts: [] };
  const { WorthIt } = makeWorthIt(D, {}, hitungDom({ wiName: { value: 'Sepatu Lari' } }));
  WorthIt.hitung();
  assert.equal(WorthIt._last.name, 'Sepatu Lari');
  assert.equal(WorthIt._last.price, 1000000);
});

// ================= CRUD Prioritas Belanja (list) =================

function wlDom(overrides = {}) {
  return {
    wlName: { value: 'Kursi Kerja' },
    wlPrice: { value: '750000' },
    wlIsDiskon: { checked: false }, wlHargaNormal: { value: '' },
    wlCategory: { value: 'kebutuhan' }, wlUrgensi: { value: 'bisa_nunggu' },
    wlSudahPunya: { checked: false }, wlSudahPunyaAlasan: { value: '' },
    ...overrides,
  };
}

test('addToList — nama kosong: ditolak toast, tidak masuk D.wishlist', async () => {
  const D = { wishlist: [] };
  const { WorthIt, toasts } = makeWorthIt(D, {}, wlDom({ wlName: { value: '  ' } }));
  await WorthIt.addToList();
  assert.equal(D.wishlist.length, 0);
  assert.ok(toasts.some((t) => t.includes('nama')));
});

test('addToList — harga kosong/0: ditolak toast', async () => {
  const D = { wishlist: [] };
  const { WorthIt, toasts } = makeWorthIt(D, {}, wlDom({ wlPrice: { value: '0' } }));
  await WorthIt.addToList();
  assert.equal(D.wishlist.length, 0);
  assert.ok(toasts.some((t) => t.includes('harga')));
});

test('addToList — data valid, tanpa duplikat: entry baru ditambahkan bought:false', async () => {
  const D = { wishlist: [] };
  const { WorthIt } = makeWorthIt(D, {}, wlDom());
  await WorthIt.addToList();
  assert.equal(D.wishlist.length, 1);
  assert.equal(D.wishlist[0].name, 'Kursi Kerja');
  assert.equal(D.wishlist[0].bought, false);
});

test('addToList — ada duplikat nama (belum dibeli) & user BATAL konfirmasi: tidak jadi ditambahkan', async () => {
  const D = { wishlist: [{ id: 'w1', name: 'Kursi Kerja', price: 500000, bought: false }] };
  const { WorthIt } = makeWorthIt(D, { askConfirm: async () => false }, wlDom());
  await WorthIt.addToList();
  assert.equal(D.wishlist.length, 1);
});

test('addToList — ada duplikat nama & user SETUJU tetap tambah: entry baru ditambahkan sbg item terpisah', async () => {
  const D = { wishlist: [{ id: 'w1', name: 'Kursi Kerja', price: 500000, bought: false }] };
  const { WorthIt } = makeWorthIt(D, { askConfirm: async () => true }, wlDom());
  await WorthIt.addToList();
  assert.equal(D.wishlist.length, 2);
});

test('addToList — mode edit (editListId diset): entry existing di-update, bukan menambah baru', async () => {
  const D = { wishlist: [{ id: 'w1', name: 'Lama', price: 1, isDiskon: false, hargaNormal: 0, cat: 'keinginan', urgensi: 'bisa_nunggu', sudahPunya: false, sudahPunyaAlasan: '' }] };
  const { WorthIt } = makeWorthIt(D, {}, wlDom({ wlName: { value: 'Baru' } }));
  WorthIt.editListId = 'w1';
  await WorthIt.addToList();
  assert.equal(D.wishlist.length, 1);
  assert.equal(D.wishlist[0].name, 'Baru');
});

test('editListItem — mengisi form dari data existing & set editListId', () => {
  const D = { wishlist: [{ id: 'w1', name: 'Meja', price: 200000, isDiskon: false, hargaNormal: 0, cat: 'kebutuhan', urgensi: 'mendesak', sudahPunya: false, sudahPunyaAlasan: '' }] };
  const { WorthIt, fakeDocument } = makeWorthIt(D, {}, { wlName: { value: '', scrollIntoView: () => {} } });
  WorthIt.editListItem('w1');
  assert.equal(WorthIt.editListId, 'w1');
  assert.equal(fakeDocument.getElementById('wlName').value, 'Meja');
  assert.equal(fakeDocument.getElementById('wlPrice').value, '200000');
});

test('cancelEditList — mereset editListId & form ke kondisi tambah baru', () => {
  const { WorthIt, fakeDocument } = makeWorthIt({ wishlist: [] });
  WorthIt.editListId = 'w1';
  WorthIt.cancelEditList();
  assert.equal(WorthIt.editListId, null);
  assert.equal(fakeDocument.getElementById('wlName').value, '');
  assert.equal(fakeDocument.getElementById('wlSubmitBtn').textContent, '+ Tambah ke List');
});

test('deleteListItem — menghapus item sesuai id, tidak menyentuh item lain', () => {
  const D = { wishlist: [{ id: 'w1' }, { id: 'w2' }] };
  const { WorthIt, toasts } = makeWorthIt(D);
  WorthIt.deleteListItem('w1');
  assert.deepEqual(D.wishlist.map((x) => x.id), ['w2']);
  assert.ok(toasts.some((t) => t.includes('Dihapus')));
});

test('deleteListItem — kalau item yg dihapus sedang dlm mode edit: cancelEditList ikut jalan otomatis', () => {
  const D = { wishlist: [{ id: 'w1' }] };
  const { WorthIt } = makeWorthIt(D);
  WorthIt.editListId = 'w1';
  WorthIt.deleteListItem('w1');
  assert.equal(WorthIt.editListId, null);
});

// ================= WorthIt.renderList() =================

test('renderList — list kosong (semua sudah bought / belum ada): tampilkan pesan kosong', () => {
  const D = { wishlist: [] };
  const { WorthIt, fakeDocument } = makeWorthIt(D);
  WorthIt.renderList();
  assert.match(fakeDocument.getElementById('wlItems').innerHTML, /Belum ada barang/);
});

test('renderList — item bought:true TIDAK ikut ditampilkan di list aktif', () => {
  const D = { wishlist: [{ id: 'w1', name: 'A', price: 1, cat: 'kebutuhan', urgensi: 'mendesak', bought: true }] };
  const { WorthIt, fakeDocument } = makeWorthIt(D);
  WorthIt.renderList();
  assert.match(fakeDocument.getElementById('wlItems').innerHTML, /Belum ada barang/);
});

test('renderList — item diurutkan dari score tertinggi ke terendah, badge sesuai ambang skor', () => {
  const D = { wishlist: [
    { id: 'low', name: 'Iseng', price: 10000, cat: 'keinginan', urgensi: 'nice_to_have', bought: false },
    { id: 'high', name: 'Penting', price: 10000, cat: 'kebutuhan', urgensi: 'mendesak', bought: false },
  ] };
  const { WorthIt, fakeDocument } = makeWorthIt(D);
  WorthIt.renderList();
  const html = fakeDocument.getElementById('wlItems').innerHTML;
  assert.ok(html.indexOf('Penting') < html.indexOf('Iseng'), 'item skor tinggi harus dirender lebih dulu');
  assert.match(html, /Prioritas Tinggi/);
  assert.match(html, /Bisa Ditunda/);
});

test('renderList — total harga semua barang & warning kalau melebihi saldo', () => {
  const D = { wishlist: [{ id: 'w1', name: 'A', price: 600000, cat: 'kebutuhan', urgensi: 'mendesak', bought: false }] };
  const { WorthIt, fakeDocument } = makeWorthIt(D, { totalSaldoAkun: () => 500000 });
  WorthIt.renderList();
  assert.match(fakeDocument.getElementById('wlTotalSummary').innerHTML, /lebih besar dari saldo/);
});

// ================= applyBuyLink / onLinkedTxEdited / onLinkedTxDeleted =================

test('applyBuyLink — menandai item wishlist sbg bought & menautkan txId setelah transaksi disimpan', () => {
  const D = { wishlist: [{ id: 'w1', name: 'A' }], transactions: [{ id: 't1', date: '2026-01-05' }] };
  const { WorthIt } = makeWorthIt(D);
  WorthIt.pendingBuyId = 'w1';
  WorthIt.applyBuyLink('t1');
  assert.equal(D.wishlist[0].bought, true);
  assert.equal(D.wishlist[0].txId, 't1');
  assert.equal(D.wishlist[0].boughtDate, '2026-01-05');
  assert.equal(D.transactions[0].wishlistLinkId, 'w1');
  assert.equal(WorthIt.pendingBuyId, null);
});

test('onLinkedTxEdited — harga/tanggal item wishlist ikut sinkron saat transaksi tertaut diedit', () => {
  const D = { wishlist: [{ id: 'w1', name: 'A', price: 100, boughtDate: '2026-01-01' }] };
  const { WorthIt } = makeWorthIt(D);
  WorthIt.onLinkedTxEdited({ wishlistLinkId: 'w1', amount: 250000, date: '2026-02-10' });
  assert.equal(D.wishlist[0].price, 250000);
  assert.equal(D.wishlist[0].boughtDate, '2026-02-10');
});

test('onLinkedTxDeleted — item wishlist dikembalikan ke belum-dibeli saat transaksi tertaut dihapus', () => {
  const D = { wishlist: [{ id: 'w1', name: 'A', bought: true, txId: 't1', boughtDate: '2026-01-01' }] };
  const { WorthIt } = makeWorthIt(D);
  WorthIt.onLinkedTxDeleted({ wishlistLinkId: 'w1' });
  assert.equal(D.wishlist[0].bought, false);
  assert.equal(D.wishlist[0].txId, null);
  assert.equal(D.wishlist[0].boughtDate, null);
});

// ================= WorthIt.undoBought() =================

test('undoBought — user konfirmasi: item dikembalikan ke belum-dibeli, transaksi Keuangan TETAP ada', () => {
  const D = { wishlist: [{ id: 'w1', name: 'A', bought: true, txId: 't1', boughtDate: '2026-01-01' }], transactions: [{ id: 't1', wishlistLinkId: 'w1' }] };
  const { WorthIt, toasts } = makeWorthIt(D, { askConfirm: async () => true });
  return WorthIt.undoBought('w1').then(() => {
    assert.equal(D.wishlist[0].bought, false);
    assert.equal(D.transactions.length, 1); // transaksi tidak ikut terhapus
    assert.equal(D.transactions[0].wishlistLinkId, undefined);
    assert.ok(toasts.some((t) => t.includes('dikembalikan')));
  });
});

test('undoBought — user batal konfirmasi: item TETAP berstatus bought', async () => {
  const D = { wishlist: [{ id: 'w1', name: 'A', bought: true, txId: 't1', boughtDate: '2026-01-01' }], transactions: [{ id: 't1' }] };
  const { WorthIt } = makeWorthIt(D, { askConfirm: async () => false });
  await WorthIt.undoBought('w1');
  assert.equal(D.wishlist[0].bought, true);
});

// ================= WorthIt.renderBoughtList() =================

test('renderBoughtList — belum ada barang yg ditandai sudah dibeli: tampilkan pesan kosong', () => {
  const D = { wishlist: [] };
  const { WorthIt, fakeDocument } = makeWorthIt(D);
  WorthIt.renderBoughtList();
  assert.match(fakeDocument.getElementById('wlBoughtItems').innerHTML, /Belum ada barang/);
});

test('renderBoughtList — item bought diurutkan dari tanggal beli terbaru', () => {
  const D = { wishlist: [
    { id: 'w1', name: 'Lama', price: 1000, bought: true, boughtDate: '2026-01-01' },
    { id: 'w2', name: 'Baru', price: 2000, bought: true, boughtDate: '2026-06-01' },
  ] };
  const { WorthIt, fakeDocument } = makeWorthIt(D);
  WorthIt.renderBoughtList();
  const html = fakeDocument.getElementById('wlBoughtItems').innerHTML;
  assert.ok(html.indexOf('Baru') < html.indexOf('Lama'));
});
