'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadSource } = require('./helpers/loadSource');
const { createFakeDocument } = require('./helpers/fakeDom');

// Cakupan file ini: LifeBalance.compute()/getFocusAreas() (logic murni,
// dgn WorthIt.incomeAvg()/computeNoSpendLast30() di-stub — bukan implementasi
// riil dari worthit.js/features-sheets-pwa-selftest.js, sesuai batasan
// loadSource.js: file ini SENGAJA tidak dimuat berbarengan dgn seluruh app),
// render()/renderFocus()/renderTrendBadge() (DOM sederhana via fakeDom), dan
// saveSnapshot()/autoSnapshotIfNeeded()/deleteSnapshot() (CRUD ke
// D.lifeBalanceSnapshots). renderHistoryModal() (chart SVG + list riwayat,
// murni DOM-write dari data yg sudah dites lewat saveSnapshot) SENGAJA belum
// dites detail di sini — nilai gunanya lebih rendah drpd bagian compute/CRUD.

function isoDaysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function makeLifeBalance(D, stubs = {}, docOverrides = {}) {
  const fakeDocument = createFakeDocument({
    lbScoreNum: {}, lbLevel: {}, lbRing: { style: {} }, lbBars: {}, lbDataNote: {},
    lbFocus: {}, lbTrendBadge: {}, lbHistoryList: {}, lbHistoryChart: {},
    ...docOverrides,
  });
  const toasts = [];
  const ctx = loadSource(['helper-teks.js', 'hidup-seimbang.js'], {
    D,
    document: fakeDocument,
    save: stubs.save || (() => {}),
    toast: stubs.toast || ((msg) => toasts.push(msg)),
    openModal: stubs.openModal || (() => {}),
    uid: stubs.uid || (() => 'uid-' + Math.random().toString(36).slice(2)),
    sameId: stubs.sameId || ((a, b) => String(a) === String(b)),
    todayStr: stubs.todayStr || (() => isoDaysAgo(0)),
    askConfirm: stubs.askConfirm || (async () => true),
    computeNoSpendLast30: stubs.computeNoSpendLast30 || (() => ({ count: 0, total: 30, daysWithData: 0 })),
    WorthIt: stubs.WorthIt, // sengaja bisa undefined -> typeof check di source jadi 0
  }, ['LifeBalance']);
  return { LifeBalance: ctx.LifeBalance, fakeDocument, toasts };
}

// ================= LifeBalance.compute() =================

test('compute — belum ada Target Dana Darurat: ddPts 0 dgn catatan "Belum ada"', () => {
  const { LifeBalance } = makeLifeBalance({ targets: [], bills: [] });
  const { parts } = LifeBalance.compute();
  const dd = parts.find((p) => p.label.includes('Dana Darurat'));
  assert.equal(dd.pts, 0);
  assert.match(dd.note, /Belum ada/);
});

test('compute — Dana Darurat 50% tercapai: ddPts setengah dari max 25', () => {
  const D = { targets: [{ isDanaDarurat: true, amount: 10000000, saved: 5000000 }], bills: [] };
  const { LifeBalance } = makeLifeBalance(D);
  const { parts } = LifeBalance.compute();
  const dd = parts.find((p) => p.label.includes('Dana Darurat'));
  assert.equal(dd.pts, 13); // round(50% * 25)
  assert.match(dd.note, /50%/);
});

test('compute — Dana Darurat melebihi 100%: ddPts diklem ke max 25 (tidak melebihi)', () => {
  const D = { targets: [{ isDanaDarurat: true, amount: 1000000, saved: 5000000 }], bills: [] };
  const { LifeBalance } = makeLifeBalance(D);
  const { parts } = LifeBalance.compute();
  const dd = parts.find((p) => p.label.includes('Dana Darurat'));
  assert.equal(dd.pts, 25);
});

test('compute — DSR: income rata2 belum ada (<=0) -> dsrPts netral 13, ditandai thin', () => {
  const D = { targets: [], bills: [] };
  const { LifeBalance } = makeLifeBalance(D); // WorthIt undefined -> incAvg 0
  const { parts } = LifeBalance.compute();
  const dsr = parts.find((p) => p.label.includes('DSR'));
  assert.equal(dsr.pts, 13);
  assert.equal(dsr.thin, true);
});

test('compute — DSR: cicilan aktif 17.5% dari income (setengah dari cap 35%) -> dsrPts setengah dari max', () => {
  const D = { targets: [], bills: [{ kind: 'cicilan', sisaTenor: 5, amount: 875000 }] };
  const { LifeBalance } = makeLifeBalance(D, { WorthIt: { incomeAvg: () => 5000000 } });
  const { parts } = LifeBalance.compute();
  const dsr = parts.find((p) => p.label.includes('DSR'));
  assert.equal(dsr.thin, false);
  assert.equal(dsr.pts, Math.round(25 * (1 - 0.5))); // dsr% = 17.5, cap 35 -> setengah
});

test('compute — DSR: cicilan HANYA yg kind cicilan & punya sisaTenor dihitung (tagihan rutin lain diabaikan)', () => {
  const D = { targets: [], bills: [
    { kind: 'cicilan', sisaTenor: 3, amount: 500000 },
    { kind: 'langganan', amount: 999999 }, // bukan cicilan, harus diabaikan
    { kind: 'cicilan', sisaTenor: null, amount: 999999 }, // sudah lunas, harus diabaikan
  ] };
  const { LifeBalance } = makeLifeBalance(D, { WorthIt: { incomeAvg: () => 5000000 } });
  const { parts } = LifeBalance.compute();
  const dsr = parts.find((p) => p.label.includes('DSR'));
  assert.match(dsr.note, /^10%/); // 500000/5000000 = 10%
});

test('compute — No Spend: histori <7 hari -> nsdPts netral 13, thin true', () => {
  const D = { targets: [], bills: [] };
  const { LifeBalance } = makeLifeBalance(D, { computeNoSpendLast30: () => ({ count: 2, total: 30, daysWithData: 3 }) });
  const { parts } = LifeBalance.compute();
  const nsd = parts.find((p) => p.label.includes('No Spend'));
  assert.equal(nsd.pts, 13);
  assert.equal(nsd.thin, true);
});

test('compute — No Spend: histori cukup, 15/30 hari no-spend -> nsdPts setengah dari max', () => {
  const D = { targets: [], bills: [] };
  const { LifeBalance } = makeLifeBalance(D, { computeNoSpendLast30: () => ({ count: 15, total: 30, daysWithData: 10 }) });
  const { parts } = LifeBalance.compute();
  const nsd = parts.find((p) => p.label.includes('No Spend'));
  assert.equal(nsd.thin, false);
  assert.equal(nsd.pts, Math.round((15 / 30) * 25));
});

test('compute — Kerja vs Istirahat: belum ada catatan Absensi -> workPts netral 13, thin true', () => {
  const D = { targets: [], bills: [], workDays: [] };
  const { LifeBalance } = makeLifeBalance(D);
  const { parts } = LifeBalance.compute();
  const work = parts.find((p) => p.label.includes('Kerja'));
  assert.equal(work.pts, 13);
  assert.equal(work.thin, true);
});

test('compute — Kerja vs Istirahat: kerja penuh 7 hari terakhir (0 hari istirahat) -> workPts 0', () => {
  const workDays = [];
  for (let i = 0; i < 7; i++) workDays.push({ date: isoDaysAgo(i) });
  const D = { targets: [], bills: [], workDays };
  const { LifeBalance } = makeLifeBalance(D);
  const { parts } = LifeBalance.compute();
  const work = parts.find((p) => p.label.includes('Kerja'));
  assert.equal(work.pts, 0);
  assert.equal(work.thin, false);
});

test('compute — Kerja vs Istirahat: 2 hari istirahat dari 7 hari terakhir -> workPts full 25 (cap di 2 hari istirahat)', () => {
  const workDays = [isoDaysAgo(2), isoDaysAgo(3), isoDaysAgo(4), isoDaysAgo(5)].map((date) => ({ date }));
  const D = { targets: [], bills: [], workDays };
  const { LifeBalance } = makeLifeBalance(D);
  const { parts } = LifeBalance.compute();
  const work = parts.find((p) => p.label.includes('Kerja'));
  assert.equal(work.pts, 25); // 3 hari istirahat (0,1,6) -> min(25, (3/2)*25) diklem 25
});

test('compute — total & level: skor >=80 -> Seimbang, >=60 -> Cukup Baik, >=40 -> Perlu Perhatian, <40 -> Waspada', () => {
  // Dana Darurat belum ada (0) + DSR/No-Spend/Kerja netral (13 tiap komponen) = 39 -> Waspada
  const { LifeBalance } = makeLifeBalance({ targets: [], bills: [], workDays: [] });
  const r1 = LifeBalance.compute();
  assert.equal(r1.total, 39);
  assert.match(r1.level, /Waspada/);

  // Dana darurat penuh + semua lain netral -> 25+13+13+13=64 -> Cukup Baik
  const D2 = { targets: [{ isDanaDarurat: true, amount: 1, saved: 1 }], bills: [], workDays: [] };
  const { LifeBalance: LB2 } = makeLifeBalance(D2);
  const r2 = LB2.compute();
  assert.equal(r2.total, 64);
  assert.match(r2.level, /Cukup Baik/);
});

// ================= LifeBalance.getFocusAreas() =================

test('getFocusAreas — hanya ambil komponen dgn pct <70%, urut dari paling rendah, maksimal 2', () => {
  const parts = [
    { label: 'A', pts: 10, max: 25 }, // 40%
    { label: 'B', pts: 20, max: 25 }, // 80% -> dikecualikan
    { label: 'C', pts: 5, max: 25 },  // 20%
    { label: 'D', pts: 15, max: 25 }, // 60%
  ];
  const areas = LifeBalanceHelper().getFocusAreas(parts);
  assert.deepEqual(areas.map((a) => a.label), ['C', 'A']);
});

function LifeBalanceHelper() {
  return makeLifeBalance({ targets: [], bills: [] }).LifeBalance;
}

test('getFocusAreas — semua komponen sudah >=70%: hasil kosong', () => {
  const parts = [{ label: 'A', pts: 22, max: 25 }, { label: 'B', pts: 25, max: 25 }];
  const { LifeBalance } = makeLifeBalance({ targets: [], bills: [] });
  assert.deepEqual(LifeBalance.getFocusAreas(parts), []);
});

// ================= LifeBalance.render() / renderFocus() =================

test('render — menulis skor total & level ke DOM, ring stroke sesuai warna level', () => {
  const D = { targets: [], bills: [], workDays: [] };
  const { LifeBalance, fakeDocument } = makeLifeBalance(D);
  LifeBalance.render();
  assert.equal(fakeDocument.getElementById('lbScoreNum').textContent, 39);
  assert.match(fakeDocument.getElementById('lbLevel').textContent, /39\/100/);
  assert.ok(fakeDocument.getElementById('lbRing').style.stroke);
});

test('render — ada komponen "thin" (data belum cukup): lbDataNote ditampilkan dgn nama komponennya (Dana Darurat TIDAK pernah "thin" — kosongnya sudah tercermin lewat ddPts 0, bukan nilai netral)', () => {
  const D = { targets: [], bills: [], workDays: [] };
  const { LifeBalance, fakeDocument } = makeLifeBalance(D);
  LifeBalance.render();
  const note = fakeDocument.getElementById('lbDataNote');
  assert.equal(note.style.display, 'block');
  assert.match(note.innerHTML, /Rasio Cicilan \(DSR\)/);
  assert.doesNotMatch(note.innerHTML, /Dana Darurat/);
});

test('render — semua komponen sudah punya data cukup: lbDataNote disembunyikan', () => {
  const workDays = [isoDaysAgo(2)].map((date) => ({ date }));
  const D = {
    targets: [{ isDanaDarurat: true, amount: 1, saved: 1 }],
    bills: [],
    workDays,
  };
  const { LifeBalance, fakeDocument } = makeLifeBalance(D, {
    WorthIt: { incomeAvg: () => 5000000 },
    computeNoSpendLast30: () => ({ count: 10, total: 30, daysWithData: 10 }),
  });
  LifeBalance.render();
  assert.equal(fakeDocument.getElementById('lbDataNote').style.display, 'none');
});

test('renderFocus — tidak ada area fokus (semua >=70%): tampilkan pesan "Pertahankan"', () => {
  const D = {
    targets: [{ isDanaDarurat: true, amount: 1, saved: 1 }],
    bills: [],
    workDays: [isoDaysAgo(2), isoDaysAgo(3)].map((date) => ({ date })),
  };
  const { LifeBalance, fakeDocument } = makeLifeBalance(D, {
    WorthIt: { incomeAvg: () => 5000000 },
    computeNoSpendLast30: () => ({ count: 28, total: 30, daysWithData: 10 }),
  });
  LifeBalance.render();
  assert.match(fakeDocument.getElementById('lbFocus').innerHTML, /Pertahankan/);
});

// ================= LifeBalance.saveSnapshot() =================

test('saveSnapshot — belum ada snapshot hari ini: entry baru ditambahkan ke D.lifeBalanceSnapshots', () => {
  const D = { targets: [], bills: [], workDays: [], lifeBalanceSnapshots: [] };
  const { LifeBalance, toasts } = makeLifeBalance(D);
  LifeBalance.saveSnapshot(true);
  assert.equal(D.lifeBalanceSnapshots.length, 1);
  assert.equal(D.lifeBalanceSnapshots[0].auto, false);
  assert.ok(toasts.some((t) => t.includes('tersimpan')));
});

test('saveSnapshot — snapshot hari ini sudah ada: di-update di tempat, bukan ditambah baru', () => {
  const today = isoDaysAgo(0);
  const D = { targets: [], bills: [], workDays: [], lifeBalanceSnapshots: [{ id: 's1', date: today, score: 1, parts: [], auto: true }] };
  const { LifeBalance } = makeLifeBalance(D);
  LifeBalance.saveSnapshot(true);
  assert.equal(D.lifeBalanceSnapshots.length, 1);
  assert.equal(D.lifeBalanceSnapshots[0].auto, false); // manual save menimpa flag auto
  assert.equal(D.lifeBalanceSnapshots[0].score, 39);
});

test('saveSnapshot — dipanggil tanpa manual (auto): tidak toast, flag auto true', () => {
  const D = { targets: [], bills: [], workDays: [], lifeBalanceSnapshots: [] };
  const { LifeBalance, toasts } = makeLifeBalance(D);
  LifeBalance.saveSnapshot(false);
  assert.equal(D.lifeBalanceSnapshots[0].auto, true);
  assert.equal(toasts.length, 0);
});

// ================= LifeBalance.autoSnapshotIfNeeded() =================

test('autoSnapshotIfNeeded — data app masih kosong total: tidak membuat snapshot sama sekali', () => {
  const D = { targets: [], bills: [], workDays: [], accounts: [], transactions: [] };
  const { LifeBalance } = makeLifeBalance(D);
  LifeBalance.autoSnapshotIfNeeded();
  assert.equal(D.lifeBalanceSnapshots.length, 0);
});

test('autoSnapshotIfNeeded — sudah ada snapshot bulan ini: tidak membuat snapshot baru lagi', () => {
  const thisMonth = isoDaysAgo(0).slice(0, 7);
  const D = { targets: [], bills: [], workDays: [], accounts: [{ id: 'a1' }], transactions: [], lifeBalanceSnapshots: [{ id: 's1', date: thisMonth + '-01', score: 10, parts: [] }] };
  const { LifeBalance } = makeLifeBalance(D);
  LifeBalance.autoSnapshotIfNeeded();
  assert.equal(D.lifeBalanceSnapshots.length, 1);
});

test('autoSnapshotIfNeeded — ada data & belum ada snapshot bulan ini: snapshot baru dibuat otomatis', () => {
  const D = { targets: [], bills: [], workDays: [], accounts: [{ id: 'a1' }], transactions: [] };
  const { LifeBalance } = makeLifeBalance(D);
  LifeBalance.autoSnapshotIfNeeded();
  assert.equal(D.lifeBalanceSnapshots.length, 1);
  assert.equal(D.lifeBalanceSnapshots[0].auto, true);
});

// ================= LifeBalance.deleteSnapshot() =================

test('deleteSnapshot — user konfirmasi hapus: snapshot dihapus dari D.lifeBalanceSnapshots', async () => {
  const D = { targets: [], bills: [], workDays: [], lifeBalanceSnapshots: [{ id: 's1', date: '2026-01-01', score: 50, parts: [] }] };
  const { LifeBalance } = makeLifeBalance(D, { askConfirm: async () => true });
  await LifeBalance.deleteSnapshot('s1');
  assert.equal(D.lifeBalanceSnapshots.length, 0);
});

test('deleteSnapshot — user batal konfirmasi: snapshot TIDAK dihapus', async () => {
  const D = { targets: [], bills: [], workDays: [], lifeBalanceSnapshots: [{ id: 's1', date: '2026-01-01', score: 50, parts: [] }] };
  const { LifeBalance } = makeLifeBalance(D, { askConfirm: async () => false });
  await LifeBalance.deleteSnapshot('s1');
  assert.equal(D.lifeBalanceSnapshots.length, 1);
});

// ================= LifeBalance.renderTrendBadge() =================

test('renderTrendBadge — snapshot kurang dari 2: badge disembunyikan', () => {
  const D = { targets: [], bills: [], workDays: [], lifeBalanceSnapshots: [{ id: 's1', date: '2026-01-01', score: 50, parts: [] }] };
  const { LifeBalance, fakeDocument } = makeLifeBalance(D);
  LifeBalance.renderTrendBadge();
  assert.equal(fakeDocument.getElementById('lbTrendBadge').style.display, 'none');
});

test('renderTrendBadge — skor naik dari snapshot sebelumnya: tampilkan "▲ +delta"', () => {
  const D = { targets: [], bills: [], workDays: [], lifeBalanceSnapshots: [
    { id: 's1', date: '2026-01-01', score: 50, parts: [] },
    { id: 's2', date: '2026-02-01', score: 65, parts: [] },
  ] };
  const { LifeBalance, fakeDocument } = makeLifeBalance(D);
  LifeBalance.renderTrendBadge();
  assert.match(fakeDocument.getElementById('lbTrendBadge').textContent, /▲ \+15/);
});

test('renderTrendBadge — skor turun dari snapshot sebelumnya: tampilkan "▼ delta"', () => {
  const D = { targets: [], bills: [], workDays: [], lifeBalanceSnapshots: [
    { id: 's1', date: '2026-01-01', score: 70, parts: [] },
    { id: 's2', date: '2026-02-01', score: 55, parts: [] },
  ] };
  const { LifeBalance, fakeDocument } = makeLifeBalance(D);
  LifeBalance.renderTrendBadge();
  assert.match(fakeDocument.getElementById('lbTrendBadge').textContent, /▼ -15|▼ 15/);
});
