'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadSource } = require('./helpers/loadSource');

// Fungsi2 pengingat servis (servisLogMatchesCat, getEffectiveIntervalKm,
// hasIntervalOverride, getLastServiceKm, estimateKmPerDay,
// estimateServiceDateISO) ada di features-tukang-kendaraan-storage.js dan
// murni (tidak baca/tulis DOM), tapi top-level file itu langsung mengeksekusi
// beberapa hal yang butuh global dari file LAIN (getWeekRange, MY_WRENCH,
// dateToISO) -- di-stub seperlunya di sini sekadar biar file bisa di-load,
// bukan bagian yg dites.
function loadVehicleHelpers(D) {
  return loadSource(['features-tukang-kendaraan-storage.js'], {
    D,
    dateToISO: (d) => d.toISOString().slice(0, 10),
    getWeekRange: () => ({ start: new Date(), end: new Date() }),
    MY_WRENCH: { minLbft: 10, maxLbft: 80 },
  });
}

// ---------- servisLogMatchesCat ----------

test('servisLogMatchesCat — kalau log punya categoryId, cocok HANYA via id (nama tidak dipakai)', () => {
  const ctx = loadVehicleHelpers({});
  const cat = { id: 'cat1', name: 'Ganti Oli' };
  assert.equal(ctx.servisLogMatchesCat({ categoryId: 'cat1', item: 'apa saja' }, cat), true);
  assert.equal(ctx.servisLogMatchesCat({ categoryId: 'cat-lain', item: 'Ganti Oli' }, cat), false);
});

test('servisLogMatchesCat — tanpa categoryId: cocok kalau item PERSIS sama dgn nama kategori (case-insensitive)', () => {
  const ctx = loadVehicleHelpers({});
  const cat = { id: 'cat1', name: 'Ganti Oli' };
  assert.equal(ctx.servisLogMatchesCat({ item: 'ganti oli' }, cat), true);
  assert.equal(ctx.servisLogMatchesCat({ item: '' }, cat), false);
});

test('servisLogMatchesCat — item mengandung nama kategori (mis. "Ganti Oli Shell") tetap cocok', () => {
  const ctx = loadVehicleHelpers({});
  const cat = { id: 'cat1', name: 'Ganti Oli' };
  assert.equal(ctx.servisLogMatchesCat({ item: 'Ganti Oli Shell 10w40' }, cat), true);
});

test('servisLogMatchesCat — nama kategori mengandung item (kata pendek, TIDAK ambigu) tetap cocok', () => {
  const ctx = loadVehicleHelpers({ sparepartCats: [{ id: 'cat1', name: 'Ganti Oli Mesin' }] });
  const cat = { id: 'cat1', name: 'Ganti Oli Mesin' };
  assert.equal(ctx.servisLogMatchesCat({ item: 'Oli Mesin' }, cat), true);
});

test('servisLogMatchesCat — kalau item pendek itu ambigu (cocok ke >1 kategori lain), TIDAK dianggap match', () => {
  const D = { sparepartCats: [
    { id: 'cat1', name: 'Oli Mesin' },
    { id: 'cat2', name: 'Oli Rem' }, // sama2 mengandung kata "Oli"
  ] };
  const ctx = loadVehicleHelpers(D);
  assert.equal(ctx.servisLogMatchesCat({ item: 'Oli' }, D.sparepartCats[0]), false);
});

// ---------- getEffectiveIntervalKm / hasIntervalOverride ----------

test('getEffectiveIntervalKm — pakai override kendaraan kalau ada & > 0', () => {
  const D = { vehicles: [{ id: 'v1', intervalOverrides: { cat1: 5000 } }] };
  const ctx = loadVehicleHelpers(D);
  assert.equal(ctx.getEffectiveIntervalKm('v1', { id: 'cat1', intervalKm: 3000 }), 5000);
});

test('getEffectiveIntervalKm — fallback ke default global kategori kalau tidak ada override', () => {
  const D = { vehicles: [{ id: 'v1' }] };
  const ctx = loadVehicleHelpers(D);
  assert.equal(ctx.getEffectiveIntervalKm('v1', { id: 'cat1', intervalKm: 3000 }), 3000);
});

test('getEffectiveIntervalKm — override 0/negatif diabaikan, tetap pakai default', () => {
  const D = { vehicles: [{ id: 'v1', intervalOverrides: { cat1: 0 } }] };
  const ctx = loadVehicleHelpers(D);
  assert.equal(ctx.getEffectiveIntervalKm('v1', { id: 'cat1', intervalKm: 3000 }), 3000);
});

test('hasIntervalOverride — true hanya kalau override kendaraan itu ada & > 0', () => {
  const D = { vehicles: [
    { id: 'v1', intervalOverrides: { cat1: 5000 } },
    { id: 'v2', intervalOverrides: { cat1: 0 } },
    { id: 'v3' },
  ] };
  const ctx = loadVehicleHelpers(D);
  assert.equal(ctx.hasIntervalOverride('v1', { id: 'cat1' }), true);
  assert.equal(ctx.hasIntervalOverride('v2', { id: 'cat1' }), false);
  assert.equal(ctx.hasIntervalOverride('v3', { id: 'cat1' }), false);
});

// ---------- getLastServiceKm ----------

test('getLastServiceKm — balikin km dari log servis TERAKHIR (tanggal terbaru), bukan km terbesar', () => {
  const D = { servisLogs: [
    { vehicleId: 'v1', date: '2026-01-01', km: 9000 }, // km lebih besar tapi TANGGAL lebih lama
    { vehicleId: 'v1', date: '2026-05-01', km: 8000 }, // tanggal terbaru
  ] };
  const ctx = loadVehicleHelpers(D);
  assert.equal(ctx.getLastServiceKm('v1'), 8000);
});

test('getLastServiceKm — 0 kalau kendaraan belum punya log servis (dgn km) sama sekali', () => {
  const D = { servisLogs: [{ vehicleId: 'v2', date: '2026-01-01', km: 1000 }] };
  const ctx = loadVehicleHelpers(D);
  assert.equal(ctx.getLastServiceKm('v1'), 0);
});

// ---------- estimateKmPerDay / estimateServiceDateISO ----------

test('estimateKmPerDay — null kalau data < 2 titik', () => {
  const D = { kmLogs: [{ vehicleId: 'v1', date: '2026-01-01', km: 1000 }], bbmLogs: [] };
  const ctx = loadVehicleHelpers(D);
  assert.equal(ctx.estimateKmPerDay('v1'), null);
});

test('estimateKmPerDay — null kalau rentang tanggal < 3 hari (data terlalu sedikit utk estimasi wajar)', () => {
  const D = { kmLogs: [
    { vehicleId: 'v1', date: '2026-01-01', km: 1000 },
    { vehicleId: 'v1', date: '2026-01-02', km: 1050 },
  ], bbmLogs: [] };
  const ctx = loadVehicleHelpers(D);
  assert.equal(ctx.estimateKmPerDay('v1'), null);
});

test('estimateKmPerDay — null kalau km tidak pernah naik (kmDiff <= 0)', () => {
  const D = { kmLogs: [
    { vehicleId: 'v1', date: '2026-01-01', km: 1000 },
    { vehicleId: 'v1', date: '2026-01-10', km: 1000 },
  ], bbmLogs: [] };
  const ctx = loadVehicleHelpers(D);
  assert.equal(ctx.estimateKmPerDay('v1'), null);
});

test('estimateKmPerDay — rata2 km/hari dari titik PERTAMA & TERAKHIR (gabungan kmLogs+bbmLogs), terurut tanggal', () => {
  const D = {
    kmLogs: [{ vehicleId: 'v1', date: '2026-01-01', km: 1000 }],
    bbmLogs: [{ vehicleId: 'v1', date: '2026-01-11', km: 1200, harga: 1 }], // 200km / 10hari = 20km/hari
  };
  const ctx = loadVehicleHelpers(D);
  assert.equal(ctx.estimateKmPerDay('v1'), 20);
});

test('estimateServiceDateISO — null kalau kmPerDay atau sisaKm tidak valid (<=0/null)', () => {
  const ctx = loadVehicleHelpers({});
  assert.equal(ctx.estimateServiceDateISO(1000, 0), null);
  assert.equal(ctx.estimateServiceDateISO(0, 10), null);
  assert.equal(ctx.estimateServiceDateISO(null, 10), null);
  assert.equal(ctx.estimateServiceDateISO(1000, null), null);
});

test('estimateServiceDateISO — hitung tanggal = hari ini + ceil(sisaKm/kmPerDay) hari', () => {
  const ctx = loadVehicleHelpers({});
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const expected = new Date(today); expected.setDate(expected.getDate() + 50); // ceil(1000/20)=50
  const expectedISO = expected.getFullYear() + '-' + String(expected.getMonth() + 1).padStart(2, '0') + '-' + String(expected.getDate()).padStart(2, '0');
  assert.equal(ctx.estimateServiceDateISO(1000, 20), expectedISO);
});

// ---------- Servis.applyStockUsage / revertStockUsage ----------
// Method ini di const Servis (features-budget-laporan-carnotes-pelanggan.js),
// TIDAK menyentuh DOM sama sekali -- cuma baca D.partsStock & (kalau stok
// kurang) tanya konfirmasi lewat askConfirm(), jadi cukup di-stub tanpa fakeDom.

function loadServis(D, askConfirm) {
  const ctx = loadSource(['features-budget-laporan-carnotes-pelanggan.js'], {
    D,
    askConfirm: askConfirm || (async () => true),
    escapeHtml: (s) => String(s === null || s === undefined ? '' : s),
  }, ['Servis']);
  return ctx.Servis;
}

test('Servis.applyStockUsage — stok cukup: langsung dikurangi, TIDAK perlu konfirmasi, return true', async () => {
  let confirmCalled = false;
  const D = { partsStock: [{ id: 'p1', qty: 10 }] };
  const Servis = loadServis(D, async () => { confirmCalled = true; return true; });
  const ok = await Servis.applyStockUsage('p1', 4);
  assert.equal(ok, true);
  assert.equal(confirmCalled, false);
  assert.equal(D.partsStock[0].qty, 6);
});

test('Servis.applyStockUsage — stok kurang & user KONFIRMASI lanjut: tetap dikurangi (boleh minus), return true', async () => {
  const D = { partsStock: [{ id: 'p1', qty: 2 }] };
  const Servis = loadServis(D, async () => true);
  const ok = await Servis.applyStockUsage('p1', 5);
  assert.equal(ok, true);
  assert.equal(D.partsStock[0].qty, -3);
});

test('Servis.applyStockUsage — stok kurang & user BATAL: TIDAK jadi dikurangi, return false', async () => {
  const D = { partsStock: [{ id: 'p1', qty: 2 }] };
  const Servis = loadServis(D, async () => false);
  const ok = await Servis.applyStockUsage('p1', 5);
  assert.equal(ok, false);
  assert.equal(D.partsStock[0].qty, 2); // tidak berubah
});

test('Servis.applyStockUsage — partId/qty kosong => no-op, return true (tidak pakai stok)', async () => {
  const D = { partsStock: [{ id: 'p1', qty: 10 }] };
  const Servis = loadServis(D);
  assert.equal(await Servis.applyStockUsage('', 5), true);
  assert.equal(await Servis.applyStockUsage('p1', 0), true);
  assert.equal(D.partsStock[0].qty, 10);
});

test('Servis.applyStockUsage — partId tidak ketemu di D.partsStock => no-op, return true', async () => {
  const D = { partsStock: [] };
  const Servis = loadServis(D);
  assert.equal(await Servis.applyStockUsage('tidak-ada', 5), true);
});

test('Servis.revertStockUsage — mengembalikan qty ke stok (kebalikan applyStockUsage)', () => {
  const D = { partsStock: [{ id: 'p1', qty: 3 }] };
  const Servis = loadServis(D);
  Servis.revertStockUsage('p1', 4);
  assert.equal(D.partsStock[0].qty, 7);
});

test('Servis.revertStockUsage — partId/qty kosong atau part tidak ketemu => no-op, tidak error', () => {
  const D = { partsStock: [{ id: 'p1', qty: 3 }] };
  const Servis = loadServis(D);
  assert.doesNotThrow(() => Servis.revertStockUsage('', 4));
  assert.doesNotThrow(() => Servis.revertStockUsage('p1', 0));
  assert.doesNotThrow(() => Servis.revertStockUsage('tidak-ada', 4));
  assert.equal(D.partsStock[0].qty, 3);
});

// ---------- Servis._saveInner (alur simpan/edit catatan servis penuh) ----------
// Method ini paling kompleks di fitur Car Notes: baca banyak field DOM,
// putuskan kategori pengingat (cocok/baru/nama-kendaraan), sinkron transaksi
// keuangan, & urus stok sparepart. Di-tes lewat fakeDocument + stub semua
// dependency lintas-file (uid, askConfirm, resolveVehicleTxCategory,
// matchingVehicleName, dst) -- BUKAN test integrasi lintas file sungguhan.
const { createFakeDocument } = require('./helpers/fakeDom');

function servisFormFields(overrides = {}) {
  return {
    servisItem: { value: '' }, servisCost: { value: '' }, servisDate: { value: '2026-07-01' },
    servisNote: { value: '' }, servisAcc: { value: 'acc1' }, servisKm: { value: '' },
    servisInterval: { value: '' }, servisPartId: { value: '' }, servisPartQty: { value: '1' },
    ...overrides,
  };
}

function loadServisFull(D, opts = {}) {
  const fakeDocument = createFakeDocument(servisFormFields(opts.domValues));
  const toasts = [];
  const calls = { save: 0, closeModal: null, renderStockList: 0, renderCatList: 0 };
  let n = 0;
  const ctx = loadSource(['features-budget-laporan-carnotes-pelanggan.js'], {
    D,
    document: fakeDocument,
    curVehicleId: opts.curVehicleId !== undefined ? opts.curVehicleId : 'veh1',
    uid: () => 'uid-' + (++n),
    askConfirm: opts.askConfirm || (async () => true),
    showPromptModal: opts.showPromptModal || (async () => null),
    toast: (msg) => toasts.push(msg),
    save: () => { calls.save++; },
    closeModal: (id) => { calls.closeModal = id; },
    renderCnTab: () => {}, renderDashboard: () => {}, renderKeuangan: () => {},
    Sparepart: {
      renderStockList: () => { calls.renderStockList++; },
      renderCatList: () => { calls.renderCatList++; },
    },
    escapeHtml: (s) => String(s === null || s === undefined ? '' : s),
    resolveVehicleTxCategory: opts.resolveVehicleTxCategory || (() => 'Transport'),
    matchingVehicleName: (name) => {
      if (!name) return null;
      const n2 = name.trim().toLowerCase();
      return (D.vehicles || []).find((v) => v.name.trim().toLowerCase() === n2) || null;
    },
    codeFromName: (name) => (name || '').slice(0, 3).toUpperCase(),
  }, ['Servis']);
  return { Servis: ctx.Servis, fakeDocument, toasts, calls };
}

function baseD(overrides = {}) {
  return {
    sparepartCats: [], servisLogs: [], transactions: [], vehicles: [{ id: 'veh1', name: 'Vario' }],
    accounts: [{ id: 'acc1' }], partsStock: [], ...overrides,
  };
}

test('Servis._saveInner — item/biaya kosong => tolak simpan dgn toast, tidak ada log/transaksi baru', async () => {
  const D = baseD();
  const { Servis, toasts } = loadServisFull(D, { domValues: { servisItem: { value: '' }, servisCost: { value: '' } } });
  await Servis._saveInner();
  assert.match(toasts[0], /Lengkapi jenis servis dan biaya/);
  assert.equal(D.servisLogs.length, 0);
  assert.equal(D.transactions.length, 0);
});

test('Servis._saveInner — catatan baru, item cocok kategori yg SUDAH ada, tanpa interval => tersinkron ke Keuangan, categoryId ikut kategori itu', async () => {
  const D = baseD({ sparepartCats: [{ id: 'cat1', name: 'Ganti Oli', intervalKm: 3000 }] });
  const { Servis, toasts } = loadServisFull(D, {
    domValues: { servisItem: { value: 'Ganti Oli' }, servisCost: { value: '150000' }, servisKm: { value: '5000' } },
  });
  await Servis._saveInner();
  assert.equal(D.servisLogs.length, 1);
  const log = D.servisLogs[0];
  assert.equal(log.categoryId, 'cat1');
  assert.equal(log.cost, 150000);
  assert.equal(log.km, 5000);
  assert.equal(D.transactions.length, 1);
  assert.equal(D.transactions[0].amount, 150000);
  assert.equal(D.transactions[0].subcategory, 'Servis & Oli');
  assert.equal(log.txLinkId, D.transactions[0].id);
  assert.match(toasts[toasts.length - 1], /tersinkron ke Keuangan/);
  // interval kategori TIDAK berubah krn tidak diisi interval baru
  assert.equal(D.sparepartCats[0].intervalKm, 3000);
});

test('Servis._saveInner — item cocok kategori ada & interval BARU diisi => interval kategori disinkron, toast sesuai', async () => {
  const D = baseD({ sparepartCats: [{ id: 'cat1', name: 'Ganti Oli', intervalKm: 3000 }] });
  const { Servis, toasts } = loadServisFull(D, {
    domValues: { servisItem: { value: 'Ganti Oli' }, servisCost: { value: '150000' }, servisInterval: { value: '4000' } },
  });
  await Servis._saveInner();
  assert.equal(D.sparepartCats[0].intervalKm, 4000);
  assert.equal(D.servisLogs[0].categoryId, 'cat1');
  assert.match(toasts[toasts.length - 1], /interval pengingat disinkron/);
});

test('Servis._saveInner — item BARU (belum ada kategori) + interval diisi => bikin kategori pengingat baru otomatis', async () => {
  const D = baseD();
  const { Servis, toasts } = loadServisFull(D, {
    domValues: { servisItem: { value: 'Ganti Kampas Rem' }, servisCost: { value: '80000' }, servisInterval: { value: '10000' } },
  });
  await Servis._saveInner();
  assert.equal(D.sparepartCats.length, 1);
  assert.equal(D.sparepartCats[0].name, 'Ganti Kampas Rem');
  assert.equal(D.sparepartCats[0].intervalKm, 10000);
  assert.equal(D.servisLogs[0].categoryId, D.sparepartCats[0].id);
  assert.match(toasts[toasts.length - 1], /ditambahkan ke Pengingat Servis/);
});

test('Servis._saveInner — item = nama kendaraan itu sendiri => TIDAK bikin kategori pengingat walau interval diisi, dikasih toast penjelasan', async () => {
  const D = baseD(); // vehicle 'Vario'
  const { Servis, toasts } = loadServisFull(D, {
    domValues: { servisItem: { value: 'Vario' }, servisCost: { value: '50000' }, servisInterval: { value: '5000' } },
  });
  await Servis._saveInner();
  assert.equal(D.sparepartCats.length, 0); // tidak ada kategori baru dibuat
  assert.equal(D.servisLogs[0].categoryId, null);
  assert.match(toasts[toasts.length - 1], /adalah nama kendaraan/);
});

test('Servis._saveInner — pakai stok sparepart yg cukup => qty stok berkurang, log simpan usedPartId/usedPartQty', async () => {
  const D = baseD({ partsStock: [{ id: 'part1', qty: 10, name: 'Oli 1L' }] });
  const { Servis } = loadServisFull(D, {
    domValues: { servisItem: { value: 'Ganti Oli' }, servisCost: { value: '50000' }, servisPartId: { value: 'part1' }, servisPartQty: { value: '2' } },
  });
  await Servis._saveInner();
  assert.equal(D.partsStock[0].qty, 8);
  assert.equal(D.servisLogs[0].usedPartId, 'part1');
  assert.equal(D.servisLogs[0].usedPartQty, 2);
});

test('Servis._saveInner — stok kurang & user BATAL konfirmasi => simpan DIBATALKAN total, tidak ada log/transaksi/stok yg berubah', async () => {
  const D = baseD({ partsStock: [{ id: 'part1', qty: 1, name: 'Oli 1L' }] });
  const { Servis } = loadServisFull(D, {
    askConfirm: async () => false,
    domValues: { servisItem: { value: 'Ganti Oli' }, servisCost: { value: '50000' }, servisPartId: { value: 'part1' }, servisPartQty: { value: '5' } },
  });
  await Servis._saveInner();
  assert.equal(D.servisLogs.length, 0);
  assert.equal(D.transactions.length, 0);
  assert.equal(D.partsStock[0].qty, 1); // tidak berubah
});

test('Servis._saveInner — edit catatan lama: update di tempat (tidak dobel), transaksi terkait ikut ter-update, tidak nambah entry', async () => {
  const D = baseD({
    sparepartCats: [{ id: 'cat1', name: 'Ganti Oli', intervalKm: 3000 }],
    servisLogs: [{ id: 'srv1', vehicleId: 'veh1', date: '2026-06-01', item: 'Ganti Oli', categoryId: 'cat1', km: 4000, cost: 100000, note: '', accountId: 'acc1', txLinkId: 'tx1', usedPartId: null, usedPartQty: 0 }],
    transactions: [{ id: 'tx1', type: 'expense', amount: 100000, date: '2026-06-01', accountId: 'acc1', note: 'lama' }],
  });
  const { Servis, toasts } = loadServisFull(D, {
    domValues: { servisItem: { value: 'Ganti Oli' }, servisCost: { value: '120000' }, servisKm: { value: '4500' }, servisDate: { value: '2026-07-05' } },
  });
  Servis.editId = 'srv1';
  await Servis._saveInner();
  assert.equal(D.servisLogs.length, 1); // tidak nambah entry baru
  assert.equal(D.servisLogs[0].cost, 120000);
  assert.equal(D.servisLogs[0].km, 4500);
  assert.equal(D.transactions.length, 1);
  assert.equal(D.transactions[0].amount, 120000);
  assert.equal(D.transactions[0].date, '2026-07-05');
  assert.match(toasts[toasts.length - 1], /diperbarui/);
});

test('Servis._saveInner — edit: ganti part yg dipakai => stok part LAMA dikembalikan, stok part BARU dikurangi', async () => {
  const D = baseD({
    servisLogs: [{ id: 'srv1', vehicleId: 'veh1', date: '2026-06-01', item: 'Ganti Oli', categoryId: null, km: 4000, cost: 100000, note: '', accountId: 'acc1', txLinkId: null, usedPartId: 'partA', usedPartQty: 1 }],
    partsStock: [{ id: 'partA', qty: 5 }, { id: 'partB', qty: 5 }],
  });
  const { Servis } = loadServisFull(D, {
    domValues: { servisItem: { value: 'Ganti Oli' }, servisCost: { value: '100000' }, servisPartId: { value: 'partB' }, servisPartQty: { value: '2' } },
  });
  Servis.editId = 'srv1';
  await Servis._saveInner();
  assert.equal(D.partsStock.find((p) => p.id === 'partA').qty, 6); // dikembalikan (+1)
  assert.equal(D.partsStock.find((p) => p.id === 'partB').qty, 3); // dikurangi (-2)
  assert.equal(D.servisLogs[0].usedPartId, 'partB');
  assert.equal(D.servisLogs[0].usedPartQty, 2);
});
