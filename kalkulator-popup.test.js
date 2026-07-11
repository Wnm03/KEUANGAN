'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { loadSource } = require('./helpers/loadSource');
const { createFakeDocument } = require('./helpers/fakeDom');

// kalkulator-input.js bagian POPUP INTERAKTIF: openCalc/closeCalc/calcPress/
// calcClear/calcBackspace/calcEquals/calcUseResult/calcRenderDisplay.
// Lanjutan dari tests/kalkulator-input.test.js (bagian ke-19, yg cuma
// mencakup safeCalc/normalizeAmtToken/calcPreviewValue/updateAmtPreview/
// evalAmtExpr -- fungsi MURNI atau DOM-ringan tanpa state). Bagian ini pakai
// `let calcExpr`/`calcTargetId` top-level yg TIDAK otomatis nempel ke objek
// context vm (beda dari `function`/`var`) -- dibaca/ditulis lewat
// `vm.runInContext()` langsung ke context yg sama, pola identik dgn
// `setSessionPin`/`getSessionPin` di tests/keamanan-pin.test.js.

class FakeEvent {
  constructor(type, opts) { this.type = type; Object.assign(this, opts || {}); }
}

function makeCalcPopup(docOverrides = {}) {
  const fakeDocument = createFakeDocument({
    calcExprEl: {}, calcValEl: {}, ...docOverrides,
  });
  const modalCalls = { open: [], close: [] };
  const ctx = loadSource(['kalkulator-input.js'], {
    document: fakeDocument,
    Event: FakeEvent,
    fmt: (n) => 'Rp ' + n,
    openModal: (id) => modalCalls.open.push(id),
    closeModal: (id) => modalCalls.close.push(id),
  });
  function setCalcExpr(v) { vm.runInContext(`calcExpr = ${JSON.stringify(v)};`, ctx); }
  function getCalcExpr() { return vm.runInContext('calcExpr', ctx); }
  function setCalcTargetId(v) { vm.runInContext(`calcTargetId = ${JSON.stringify(v)};`, ctx); }
  function getCalcTargetId() { return vm.runInContext('calcTargetId', ctx); }
  return {
    openCalc: ctx.openCalc, closeCalc: ctx.closeCalc, calcPress: ctx.calcPress,
    calcClear: ctx.calcClear, calcBackspace: ctx.calcBackspace, calcEquals: ctx.calcEquals,
    calcUseResult: ctx.calcUseResult, calcRenderDisplay: ctx.calcRenderDisplay,
    fakeDocument, modalCalls, setCalcExpr, getCalcExpr, setCalcTargetId, getCalcTargetId,
  };
}

// ================= openCalc / closeCalc =================

test('openCalc — target berisi angka murni (boleh titik, tanpa operator) => calcExpr diisi dari value target itu', () => {
  const p = makeCalcPopup({ amt1: { value: '123.45' } });
  p.openCalc('amt1');
  assert.equal(p.getCalcExpr(), '123.45');
  assert.equal(p.getCalcTargetId(), 'amt1');
});

test('openCalc — target berisi ekspresi (ada operator, mis. "2+3") => calcExpr TIDAK dipakai, mulai dari kosong', () => {
  const p = makeCalcPopup({ amt1: { value: '2+3' } });
  p.openCalc('amt1');
  assert.equal(p.getCalcExpr(), '');
});

test('openCalc — target kosong => calcExpr kosong', () => {
  const p = makeCalcPopup({ amt1: { value: '' } });
  p.openCalc('amt1');
  assert.equal(p.getCalcExpr(), '');
});

test('openCalc — memanggil openModal("calcModal") & calcRenderDisplay (terlihat dari exprEl/valEl ikut ter-render)', () => {
  const p = makeCalcPopup({ amt1: { value: '50' } });
  p.openCalc('amt1');
  assert.deepEqual(p.modalCalls.open, ['calcModal']);
  // '50' murni angka tanpa operator/titik -> valEl langsung nampilin '50'
  assert.equal(p.fakeDocument.getElementById('calcValEl').textContent, '50');
});

test('closeCalc — memanggil closeModal("calcModal")', () => {
  const p = makeCalcPopup();
  p.closeCalc();
  assert.deepEqual(p.modalCalls.close, ['calcModal']);
});

// ================= calcRenderDisplay =================

test('calcRenderDisplay — calcExpr kosong => valEl "0", exprEl kosong', () => {
  const p = makeCalcPopup();
  p.setCalcExpr('');
  p.calcRenderDisplay();
  assert.equal(p.fakeDocument.getElementById('calcExprEl').textContent, '');
  assert.equal(p.fakeDocument.getElementById('calcValEl').textContent, '0');
});

test('calcRenderDisplay — calcExpr berakhiran operator => valEl nampilin apa adanya, exprEl kosong', () => {
  const p = makeCalcPopup();
  p.setCalcExpr('5+');
  p.calcRenderDisplay();
  assert.equal(p.fakeDocument.getElementById('calcExprEl').textContent, '');
  assert.equal(p.fakeDocument.getElementById('calcValEl').textContent, '5+');
});

test('calcRenderDisplay — calcExpr sudah lengkap & valid ("5+3*2") => exprEl nampilin ekspresi, valEl nampilin hasilnya', () => {
  const p = makeCalcPopup();
  p.setCalcExpr('5+3*2');
  p.calcRenderDisplay();
  assert.equal(p.fakeDocument.getElementById('calcExprEl').textContent, '5+3*2');
  assert.equal(p.fakeDocument.getElementById('calcValEl').textContent, '11');
});

test('calcRenderDisplay — calcExpr invalid ("5//3", bukan hasil ketikan wajar tapi tetap harus aman) => valEl fallback ke calcExpr mentah, tidak crash', () => {
  const p = makeCalcPopup();
  p.setCalcExpr('5//3');
  assert.doesNotThrow(() => p.calcRenderDisplay());
  assert.equal(p.fakeDocument.getElementById('calcExprEl').textContent, '5//3');
  assert.equal(p.fakeDocument.getElementById('calcValEl').textContent, '5//3');
});

// ================= calcPress =================

test('calcPress — tekan operator saat calcExpr masih kosong => diberi awalan "0" dulu', () => {
  const p = makeCalcPopup();
  p.setCalcExpr('');
  p.calcPress('+');
  assert.equal(p.getCalcExpr(), '0+');
});

test('calcPress — tekan angka/titik cuma di-append apa adanya', () => {
  const p = makeCalcPopup();
  p.setCalcExpr('5');
  p.calcPress('3');
  assert.equal(p.getCalcExpr(), '53');
  p.calcPress('.');
  assert.equal(p.getCalcExpr(), '53.');
});

test('calcPress — tekan operator saat calcExpr SUDAH berakhiran operator => operator lama diganti (bukan ditumpuk)', () => {
  const p = makeCalcPopup();
  p.setCalcExpr('5+');
  p.calcPress('*');
  assert.equal(p.getCalcExpr(), '5*');
});

test('calcPress — tekan operator normal (calcExpr tidak kosong & tidak berakhiran operator) => operator ditambahkan di akhir', () => {
  const p = makeCalcPopup();
  p.setCalcExpr('5');
  p.calcPress('+');
  assert.equal(p.getCalcExpr(), '5+');
});

test('calcPress — ikut manggil calcRenderDisplay (DOM ikut ter-update stlh tiap tekan)', () => {
  const p = makeCalcPopup();
  p.setCalcExpr('5');
  p.calcPress('+');
  // '5+' berakhiran operator -> valEl nampilin apa adanya
  assert.equal(p.fakeDocument.getElementById('calcValEl').textContent, '5+');
});

// ================= calcClear / calcBackspace =================

test('calcClear — mengosongkan calcExpr total, apa pun isinya sebelumnya', () => {
  const p = makeCalcPopup();
  p.setCalcExpr('123+456');
  p.calcClear();
  assert.equal(p.getCalcExpr(), '');
  assert.equal(p.fakeDocument.getElementById('calcValEl').textContent, '0');
});

test('calcBackspace — menghapus 1 karakter terakhir', () => {
  const p = makeCalcPopup();
  p.setCalcExpr('123+4');
  p.calcBackspace();
  assert.equal(p.getCalcExpr(), '123+');
});

test('calcBackspace — dipanggil saat calcExpr sudah kosong => tetap kosong, tidak error', () => {
  const p = makeCalcPopup();
  p.setCalcExpr('');
  assert.doesNotThrow(() => p.calcBackspace());
  assert.equal(p.getCalcExpr(), '');
});

// ================= calcEquals =================

test('calcEquals — ekspresi valid => calcExpr ditimpa hasil akhir (dibulatkan 2 desimal)', () => {
  const p = makeCalcPopup();
  p.setCalcExpr('2+3*4');
  p.calcEquals();
  assert.equal(p.getCalcExpr(), '14');
  assert.equal(p.fakeDocument.getElementById('calcValEl').textContent, '14');
});

test('calcEquals — ekspresi belum lengkap (berakhiran operator) => calcExpr TIDAK berubah (hasil NaN diabaikan)', () => {
  const p = makeCalcPopup();
  p.setCalcExpr('5+');
  p.calcEquals();
  assert.equal(p.getCalcExpr(), '5+');
});

test('calcEquals — hasil pembagian desimal dibulatkan 2 angka di belakang koma', () => {
  const p = makeCalcPopup();
  p.setCalcExpr('10/3');
  p.calcEquals();
  assert.equal(p.getCalcExpr(), '3.33');
});

// ================= calcUseResult =================

test('calcUseResult — calcTargetId belum di-set (null) => cuma nutup modal, tidak nyentuh elemen mana pun', () => {
  const p = makeCalcPopup();
  p.setCalcTargetId(null);
  p.setCalcExpr('123');
  p.calcUseResult();
  assert.deepEqual(p.modalCalls.close, ['calcModal']);
});

test('calcUseResult — calcExpr angka murni (tanpa operator/titik) => dipakai apa adanya ke value target', () => {
  const events = [];
  const p = makeCalcPopup({ amt1: { value: 'lama', dispatchEvent: (e) => events.push(e) } });
  p.setCalcTargetId('amt1');
  p.setCalcExpr('500');
  p.calcUseResult();
  assert.equal(p.fakeDocument.getElementById('amt1').value, '500');
  assert.equal(events.length, 1);
  assert.equal(events[0].type, 'input');
  assert.deepEqual(p.modalCalls.close, ['calcModal']);
});

test('calcUseResult — calcExpr ekspresi valid => dihitung dulu, hasilnya yg dipakai ke target', () => {
  const events = [];
  const p = makeCalcPopup({ amt1: { value: '', dispatchEvent: (e) => events.push(e) } });
  p.setCalcTargetId('amt1');
  p.setCalcExpr('2+3');
  p.calcUseResult();
  assert.equal(p.fakeDocument.getElementById('amt1').value, '5');
  assert.equal(events.length, 1);
});

test('calcUseResult — calcExpr tidak valid (hasil NaN) => value target TIDAK disentuh, tapi modal tetap ditutup', () => {
  const events = [];
  const p = makeCalcPopup({ amt1: { value: 'nilai lama', dispatchEvent: (e) => events.push(e) } });
  p.setCalcTargetId('amt1');
  p.setCalcExpr('5+');
  p.calcUseResult();
  assert.equal(p.fakeDocument.getElementById('amt1').value, 'nilai lama');
  assert.equal(events.length, 0);
  assert.deepEqual(p.modalCalls.close, ['calcModal']);
});
