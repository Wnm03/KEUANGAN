'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadSource } = require('./helpers/loadSource');

// resolveVehicleTxCategory (transaksi.js) adalah fungsi murni (tidak
// baca/tulis DOM) yang menentukan kategori Keuangan mana yang dipakai saat
// BBM._saveInner / Servis._saveInner bikin transaksi. Sebelumnya belum ada
// test sama sekali untuk fungsi ini (temuan #2 di review Car Notes, lihat
// CLAUDE.md) — ditambahkan di sini sekaligus menutup bugnya: kategori
// kendaraan dulu dicari HANYA lewat cocok nama persis, jadi begitu
// kategorinya di-rename (via menu Kategori), catatan BBM/servis
// BERIKUTNYA silently jatuh ke kategori "Transport" umum, tercampur dgn
// kendaraan lain.
function loadResolve(D) {
  let n = 0;
  const ctx = loadSource(['transaksi.js'], {
    D,
    uid: () => 'uid-' + (++n),
    slugify: (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'x',
  });
  return ctx.resolveVehicleTxCategory;
}

function baseD(overrides = {}) {
  return { categories: { income: [], expense: [] }, ...overrides };
}

test('resolveVehicleTxCategory — belum ada kategori sama sekali => bikin & pakai fallback "Transport"', () => {
  const D = baseD();
  const resolve = loadResolve(D);
  const name = resolve({ id: 'veh1', name: 'Vario 125' });
  assert.equal(name, 'Transport');
  assert.equal(D.categories.expense.length, 1);
  assert.equal(D.categories.expense[0].linkedVehicleId, undefined); // fallback bersama, TIDAK di-link ke kendaraan manapun
  const subNames = Array.from(D.categories.expense[0].subs.map((s) => s.name));
  assert.deepEqual(subNames, ['Bensin', 'Servis & Oli', 'Pajak']);
});

test('resolveVehicleTxCategory — ada kategori dgn nama PERSIS sama dgn kendaraan => dipakai & di-link (linkedVehicleId)', () => {
  const D = baseD({ categories: { income: [], expense: [{ id: 'cat1', name: 'Vario 125', emoji: '🏍️', subs: [] }] } });
  const resolve = loadResolve(D);
  const name = resolve({ id: 'veh1', name: 'Vario 125' });
  assert.equal(name, 'Vario 125');
  assert.equal(D.categories.expense[0].linkedVehicleId, 'veh1');
});

test('resolveVehicleTxCategory — BUGFIX: kategori sudah di-link, lalu NAMANYA diubah (mis. lewat menu Kategori) => tetap ketemu via linkedVehicleId, TIDAK jatuh ke Transport', () => {
  const D = baseD({
    categories: { income: [], expense: [{ id: 'cat1', name: 'Motor Baru', emoji: '🏍️', subs: [], linkedVehicleId: 'veh1' }] },
  });
  const resolve = loadResolve(D);
  // vehicle.name TIDAK cocok lagi dgn cat.name ('Vario 125' vs 'Motor Baru') --
  // simulasi kategori sudah di-rename user, tapi link id-nya tetap ada.
  const name = resolve({ id: 'veh1', name: 'Vario 125' });
  assert.equal(name, 'Motor Baru'); // tetap kategori yg sama (via link), bukan Transport
  assert.equal(D.categories.expense.length, 1); // tidak bikin kategori Transport baru
});

test('resolveVehicleTxCategory — dua kendaraan berbeda TIDAK saling ke-link ke kategori yg sama', () => {
  const D = baseD({
    categories: { income: [], expense: [
      { id: 'cat1', name: 'Vario 125', emoji: '🏍️', subs: [] },
      { id: 'cat2', name: 'Beat', emoji: '🏍️', subs: [] },
    ] },
  });
  const resolve = loadResolve(D);
  resolve({ id: 'veh1', name: 'Vario 125' });
  resolve({ id: 'veh2', name: 'Beat' });
  assert.equal(D.categories.expense.find((c) => c.id === 'cat1').linkedVehicleId, 'veh1');
  assert.equal(D.categories.expense.find((c) => c.id === 'cat2').linkedVehicleId, 'veh2');
});

test('resolveVehicleTxCategory — kendaraan tanpa kategori khusus (tidak pernah cocok nama) tetap jatuh ke Transport bersama, TIDAK di-link', () => {
  const D = baseD();
  const resolve = loadResolve(D);
  resolve({ id: 'veh1', name: 'Vario 125' });
  resolve({ id: 'veh2', name: 'Beat' });
  assert.equal(D.categories.expense.length, 1); // sama2 pakai 1 kategori Transport
  assert.equal(D.categories.expense[0].linkedVehicleId, undefined);
});

test('resolveVehicleTxCategory — subs Bensin/Servis & Oli/Pajak tidak diduplikasi kalau dipanggil berkali-kali', () => {
  const D = baseD({ categories: { income: [], expense: [{ id: 'cat1', name: 'Vario 125', emoji: '🏍️', subs: [] }] } });
  const resolve = loadResolve(D);
  resolve({ id: 'veh1', name: 'Vario 125' });
  resolve({ id: 'veh1', name: 'Vario 125' });
  assert.equal(D.categories.expense[0].subs.length, 3);
});
