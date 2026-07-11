'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadSource } = require('./helpers/loadSource');
const { createFakeDocument } = require('./helpers/fakeDom');

// Cakupan file ini SENGAJA dibatasi ke bagian yang "ringan": logic murni
// (computeStreak, SelfCareReko.compute) + gratitude/checklist CRUD yang cuma
// baca/tulis D & DOM sederhana (fakeDom, tanpa perlu jsdom). Bagian
// "Catatan Privat" (addNote/toggleNoteView/deleteNote) SENGAJA belum dites
// di sini karena butuh mock encryptApiKeyWithPin/decryptApiKeyWithPin +
// _sessionRawPin (skema kripto sama dgn keamanan-pin.js) -- ranah test
// terpisah yang lebih berat, lihat CLAUDE.md bagian ke-13/ke-14.

// helper-teks.js dimuat NYATA (bukan stub) supaya escapeHtml() & dateToISO()
// yang dipakai refleksi-selfcare.js persis sama dgn yang jalan di app asli.
function makeRefleksi(D, stubs = {}, docOverrides = {}) {
  const fakeDocument = createFakeDocument(docOverrides);
  const toasts = [];
  const ctx = loadSource(['helper-teks.js', 'refleksi-selfcare.js'], {
    D,
    document: fakeDocument,
    save: stubs.save || (() => {}),
    toast: stubs.toast || ((msg) => toasts.push(msg)),
    askConfirm: stubs.askConfirm || (async () => true),
    openModal: stubs.openModal || (() => {}),
    closeModal: stubs.closeModal || (() => {}),
    uid: stubs.uid || (() => 'uid-' + Math.random().toString(36).slice(2)),
    sameId: stubs.sameId || ((a, b) => String(a) === String(b)),
    todayStr: stubs.todayStr || (() => {
      const n = new Date();
      return n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0') + '-' + String(n.getDate()).padStart(2, '0');
    }),
  }, ['Refleksi', 'SelfCareReko', 'REFLEKSI_SELFCARE_ITEMS']);
  return { Refleksi: ctx.Refleksi, SelfCareReko: ctx.SelfCareReko, ITEMS: ctx.REFLEKSI_SELFCARE_ITEMS, fakeDocument, toasts };
}

// isoDaysAgo(n): tanggal n hari yg lalu dlm format YYYY-MM-DD, relatif ke
// "sekarang" (bukan hardcode) -- supaya test tidak basi seiring waktu jalan,
// sama seperti pola di fi-calc.test.js.
function isoDaysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

// ================= Refleksi.computeStreak() =================

test('computeStreak — belum pernah checklist sama sekali -> 0', () => {
  const { Refleksi } = makeRefleksi({ refleksi: {} });
  assert.equal(Refleksi.computeStreak(), 0);
});

test('computeStreak — hari ini & kemarin checklist, 2 hari lalu TIDAK -> streak 2', () => {
  const D = { refleksi: { selfCareLog: {
    [isoDaysAgo(0)]: ['sc1'],
    [isoDaysAgo(1)]: ['sc2'],
  } } };
  const { Refleksi } = makeRefleksi(D);
  assert.equal(Refleksi.computeStreak(), 2);
});

test('computeStreak — hari ini BELUM dicentang tapi kemarin & 2 hari lalu sudah -> tetap dianggap streak 2 (grace utk hari berjalan)', () => {
  const D = { refleksi: { selfCareLog: {
    [isoDaysAgo(1)]: ['sc1'],
    [isoDaysAgo(2)]: ['sc2'],
  } } };
  const { Refleksi } = makeRefleksi(D);
  assert.equal(Refleksi.computeStreak(), 2);
});

test('computeStreak — hari ini & kemarin dua-duanya TIDAK dicentang -> 0 (grace cuma berlaku utk hari ini)', () => {
  const D = { refleksi: { selfCareLog: {
    [isoDaysAgo(2)]: ['sc1'],
  } } };
  const { Refleksi } = makeRefleksi(D);
  assert.equal(Refleksi.computeStreak(), 0);
});

test('computeStreak — 5 hari berturut-turut dari hari ini -> streak 5', () => {
  const log = {};
  for (let i = 0; i < 5; i++) log[isoDaysAgo(i)] = ['sc1'];
  const { Refleksi } = makeRefleksi({ refleksi: { selfCareLog: log } });
  assert.equal(Refleksi.computeStreak(), 5);
});

test('computeStreak — entry ada tapi array KOSONG dihitung sama dgn tidak checklist (arr.length falsy)', () => {
  const D = { refleksi: { selfCareLog: { [isoDaysAgo(0)]: [] } } };
  const { Refleksi } = makeRefleksi(D);
  assert.equal(Refleksi.computeStreak(), 0);
});

// ================= SelfCareReko.compute() =================

test('SelfCareReko.compute — kurang dari 5 hari tercatat -> ready:false dgn note ajakan isi checklist', () => {
  const D = { refleksi: { selfCareLog: {
    [isoDaysAgo(0)]: ['sc1'],
    [isoDaysAgo(1)]: ['sc1'],
  }, gratitude: [] } };
  const { SelfCareReko } = makeRefleksi(D);
  const r = SelfCareReko.compute();
  assert.equal(r.ready, false);
  assert.match(r.note, /checklist self-care/);
});

test('SelfCareReko.compute — >=5 hari tercatat, item yg paling sering kelewat jadi "weakest"', () => {
  const log = {};
  for (let i = 0; i < 6; i++) {
    // sc1/sc3/sc4/sc5 dicentang tiap hari (100%), sc2 cuma dicentang 1x dari
    // 6 hari (~17%) -- item LAIN sengaja ikut dicentang penuh supaya tidak
    // ikut "menang" sbg weakest gara2 sama2 nol (isolasi variabel: cuma sc2
    // yg dibedakan).
    log[isoDaysAgo(i)] = i === 0 ? ['sc1', 'sc2', 'sc3', 'sc4', 'sc5'] : ['sc1', 'sc3', 'sc4', 'sc5'];
  }
  const D = { refleksi: { selfCareLog: log, gratitude: [] } };
  const { SelfCareReko } = makeRefleksi(D);
  const r = SelfCareReko.compute();
  assert.equal(r.ready, true);
  assert.equal(r.loggedDaysCount, 6);
  assert.equal(r.weakest.id, 'sc2');
  assert.equal(r.weakest.count, 1);
});

test('SelfCareReko.compute — gratitudeCount cuma menghitung catatan syukur DALAM 14 hari terakhir', () => {
  const log = {};
  for (let i = 0; i < 5; i++) log[isoDaysAgo(i)] = ['sc1'];
  const D = { refleksi: { selfCareLog: log, gratitude: [
    { id: 1, date: isoDaysAgo(2), text: 'dalam window' },
    { id: 2, date: isoDaysAgo(20), text: 'di luar window 14 hari' },
  ] } };
  const { SelfCareReko } = makeRefleksi(D);
  const r = SelfCareReko.compute();
  assert.equal(r.gratitudeCount, 1);
});

// ================= Jurnal Syukur (addGratitude/deleteGratitude) =================

test('Refleksi.addGratitude — teks kosong (whitespace) ditolak dgn toast, TIDAK menambah entry', () => {
  const D = { refleksi: { gratitude: [] } };
  const { Refleksi, toasts } = makeRefleksi(D, {}, { refSyukurText: { value: '   ' } });
  Refleksi.addGratitude();
  assert.equal(D.refleksi.gratitude.length, 0);
  assert.match(toasts[0], /Tulis dulu/);
});

test('Refleksi.addGratitude — teks valid tersimpan & input dikosongkan lagi', () => {
  const D = { refleksi: { gratitude: [] } };
  // NB: createFakeDocument() bikin elemen fake BARU lalu Object.assign nilai
  // initial ke situ (bukan reuse referensi objek yg dioper) -- jadi baca
  // hasil akhir lewat fakeDocument.getElementById(...), bukan variabel lokal
  // yg dioper sbg initial value.
  const { Refleksi, toasts, fakeDocument } = makeRefleksi(D, {}, { refSyukurText: { value: 'Bersyukur hari ini cerah' } });
  Refleksi.addGratitude();
  assert.equal(D.refleksi.gratitude.length, 1);
  assert.equal(D.refleksi.gratitude[0].text, 'Bersyukur hari ini cerah');
  assert.equal(fakeDocument.getElementById('refSyukurText').value, '');
  assert.match(toasts[0], /tersimpan/);
});

test('Refleksi.deleteGratitude — batal hapus (askConfirm false) -> entry TETAP ada', async () => {
  const D = { refleksi: { gratitude: [{ id: 'g1', date: '2026-01-01', text: 'x' }] } };
  const { Refleksi } = makeRefleksi(D, { askConfirm: async () => false });
  await Refleksi.deleteGratitude('g1');
  assert.equal(D.refleksi.gratitude.length, 1);
});

test('Refleksi.deleteGratitude — konfirmasi hapus -> entry hilang', async () => {
  const D = { refleksi: { gratitude: [{ id: 'g1', date: '2026-01-01', text: 'x' }] } };
  const { Refleksi } = makeRefleksi(D, { askConfirm: async () => true });
  await Refleksi.deleteGratitude('g1');
  assert.equal(D.refleksi.gratitude.length, 0);
});

// ================= Checklist Self-Care (toggleSelfCare) =================

// NB: array yg lahir dari `push()` DI DALAM vm context (mis. hasil
// `D.refleksi.selfCareLog[today]=[]` yg dieksekusi oleh source di dalam
// sandbox) constructor-nya BEDA realm dgn Array host, walau
// `Array.isArray()`/isinya identik -- assert.deepEqual (alias
// deepStrictEqual di 'assert/strict') menganggapnya TIDAK reference-equal.
// Bandingkan lewat Array.from(...) (host array baru) supaya aman, sama
// spirit-nya dgn assertFieldsEqual di fi-calc.test.js.
test('Refleksi.toggleSelfCare — item belum dicentang hari ini -> ditambahkan ke log hari ini', () => {
  const D = { refleksi: {} };
  const { Refleksi } = makeRefleksi(D);
  Refleksi.toggleSelfCare('sc1');
  const today = isoDaysAgo(0);
  assert.deepEqual(Array.from(D.refleksi.selfCareLog[today]), ['sc1']);
});

test('Refleksi.toggleSelfCare — item sudah dicentang -> di-toggle jadi tidak dicentang (dihapus dari array)', () => {
  const today = isoDaysAgo(0);
  const D = { refleksi: { selfCareLog: { [today]: ['sc1', 'sc2'] } } };
  const { Refleksi } = makeRefleksi(D);
  Refleksi.toggleSelfCare('sc1');
  assert.deepEqual(Array.from(D.refleksi.selfCareLog[today]), ['sc2']);
});

test('Refleksi.toggleSelfCare — item terakhir di-uncheck -> key hari itu dihapus total dari selfCareLog (bukan array kosong)', () => {
  const today = isoDaysAgo(0);
  const D = { refleksi: { selfCareLog: { [today]: ['sc1'] } } };
  const { Refleksi } = makeRefleksi(D);
  Refleksi.toggleSelfCare('sc1');
  assert.equal(Object.prototype.hasOwnProperty.call(D.refleksi.selfCareLog, today), false);
});
