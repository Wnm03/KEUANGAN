'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadSource } = require('./helpers/loadSource');
const { createFakeDocument } = require('./helpers/fakeDom');

// kalkulator-input.js — parser ekspresi angka aman (safeCalc/normalizeAmtToken),
// preview nilai input (calcPreviewValue/updateAmtPreview), dan auto-eval saat
// blur (evalAmtExpr). Cakupan sesi ini SENGAJA dibatasi ke bagian yang murni
// atau DOM-ringan (tidak ada module-level `let` yang perlu di-reset lewat
// vm.runInContext) -- popup kalkulator interaktif (openCalc/calcPress/
// calcClear/calcBackspace/calcEquals/calcUseResult/calcRenderDisplay) pakai
// `let calcExpr`/`calcTargetId` top-level (pola sama dgn `_sessionRawPin` di
// keamanan-pin.js / `pinBuffer` -- lihat CLAUDE.md bagian ke-15/16), jadi
// disisakan utk sesi lanjutan yang lebih "sedang" beratnya.
//
// Event dipakai literal `new Event('input',{bubbles:true})` di evalAmtExpr()
// -- vm sandbox loadSource() TIDAK menyediakan class Event bawaan (beda dari
// Date/Math/dst yg memang di-whitelist), jadi di-inject minimal di sini.
class FakeEvent {
  constructor(type, opts) { this.type = type; Object.assign(this, opts || {}); }
}

function makeKalkulator(docOverrides = {}, extraGlobals = {}) {
  const fakeDocument = createFakeDocument(docOverrides);
  const ctx = loadSource(['kalkulator-input.js'], {
    document: fakeDocument,
    Event: FakeEvent,
    fmt: extraGlobals.fmt || ((n) => 'Rp ' + n),
    openModal: extraGlobals.openModal || (() => {}),
    closeModal: extraGlobals.closeModal || (() => {}),
    ...extraGlobals,
  });
  return { ctx, fakeDocument };
}

// ================= safeCalc =================

test('safeCalc — penjumlahan & pengurangan sederhana', () => {
  const { ctx } = makeKalkulator();
  assert.equal(ctx.safeCalc('2+3'), 5);
  assert.equal(ctx.safeCalc('10-4'), 6);
});

test('safeCalc — precedence: perkalian/pembagian didahulukan drpd tambah/kurang', () => {
  const { ctx } = makeKalkulator();
  assert.equal(ctx.safeCalc('2+3*4'), 14);
  assert.equal(ctx.safeCalc('20-10/2'), 15);
});

test('safeCalc — tanda kurung mengubah urutan evaluasi', () => {
  const { ctx } = makeKalkulator();
  assert.equal(ctx.safeCalc('(2+3)*4'), 20);
});

test('safeCalc — pembagian dgn 0 => NaN (bukan Infinity)', () => {
  const { ctx } = makeKalkulator();
  assert.ok(Number.isNaN(ctx.safeCalc('10/0')));
});

test('safeCalc — unary minus/plus di depan angka atau kurung', () => {
  const { ctx } = makeKalkulator();
  assert.equal(ctx.safeCalc('-5+10'), 5);
  assert.equal(ctx.safeCalc('-(2+3)'), -5);
});

test('safeCalc — ekspresi tidak lengkap ("2+") => NaN', () => {
  const { ctx } = makeKalkulator();
  assert.ok(Number.isNaN(ctx.safeCalc('2+')));
});

test('safeCalc — karakter di luar whitelist angka/operator (huruf, simbol lain) => NaN', () => {
  const { ctx } = makeKalkulator();
  assert.ok(Number.isNaN(ctx.safeCalc('2+abc')));
  assert.ok(Number.isNaN(ctx.safeCalc('alert(1)')));
  assert.ok(Number.isNaN(ctx.safeCalc('2;3')));
});

test('safeCalc — input bukan string, kosong, atau cuma spasi => NaN', () => {
  const { ctx } = makeKalkulator();
  assert.ok(Number.isNaN(ctx.safeCalc(undefined)));
  assert.ok(Number.isNaN(ctx.safeCalc('')));
  assert.ok(Number.isNaN(ctx.safeCalc('   ')));
});

test('safeCalc — sisa token yg tidak konsisten (mis. dua angka tanpa operator di antaranya) => NaN', () => {
  const { ctx } = makeKalkulator();
  assert.ok(Number.isNaN(ctx.safeCalc('2 3')));
});

test('safeCalc — angka desimal biasa (satu titik, 1-2 digit di belakang) tetap dihitung sbg desimal', () => {
  const { ctx } = makeKalkulator();
  assert.equal(ctx.safeCalc('1.5+1.5'), 3);
  assert.equal(ctx.safeCalc('2.25*2'), 4.5);
});

test('safeCalc — gaya pemisah ribuan ala Indonesia ("1.000") dinormalisasi jadi 1000, BUKAN 1.0', () => {
  const { ctx } = makeKalkulator();
  assert.equal(ctx.safeCalc('1.000+500'), 1500);
  assert.equal(ctx.safeCalc('1.000.000'), 1000000);
});

// ================= normalizeAmtToken =================

test('normalizeAmtToken — token tanpa titik dikembalikan apa adanya', () => {
  const { ctx } = makeKalkulator();
  assert.equal(ctx.normalizeAmtToken('500'), '500');
});

test('normalizeAmtToken — segmen terakhir 1-2 digit dianggap desimal', () => {
  const { ctx } = makeKalkulator();
  assert.equal(ctx.normalizeAmtToken('12.5'), '12.5');
  assert.equal(ctx.normalizeAmtToken('12.50'), '12.50');
});

test('normalizeAmtToken — segmen terakhir 3+ digit dianggap pemisah ribuan, titik dibuang semua', () => {
  const { ctx } = makeKalkulator();
  assert.equal(ctx.normalizeAmtToken('1.000'), '1000');
  assert.equal(ctx.normalizeAmtToken('1.234.567'), '1234567');
});

test('normalizeAmtToken — kombinasi ribuan + desimal ("1.000.50") => "1000.50"', () => {
  const { ctx } = makeKalkulator();
  assert.equal(ctx.normalizeAmtToken('1.000.50'), '1000.50');
});

// ================= calcPreviewValue =================

test('calcPreviewValue — string kosong/falsy => 0', () => {
  const { ctx } = makeKalkulator();
  assert.equal(ctx.calcPreviewValue(''), 0);
  assert.equal(ctx.calcPreviewValue(null), 0);
  assert.equal(ctx.calcPreviewValue(undefined), 0);
});

test('calcPreviewValue — ekspresi tidak valid => 0 (bukan NaN)', () => {
  const { ctx } = makeKalkulator();
  assert.equal(ctx.calcPreviewValue('abc'), 0);
});

test('calcPreviewValue — ekspresi valid => hasil hitungnya', () => {
  const { ctx } = makeKalkulator();
  assert.equal(ctx.calcPreviewValue('2+3*4'), 14);
});

// ================= updateAmtPreview =================

test('updateAmtPreview — elemen input atau preview tidak ditemukan => no-op, tidak error', () => {
  const { ctx, fakeDocument } = makeKalkulator();
  assert.doesNotThrow(() => ctx.updateAmtPreview('tidakAda', 'jugaTidakAda'));
  assert.equal(fakeDocument.getElementById('jugaTidakAda').textContent, '');
});

test('updateAmtPreview — hasil > 0 => preview terisi "= " + fmt(hasil)', () => {
  const { ctx, fakeDocument } = makeKalkulator({ amtIn: { value: '2+3*4' }, amtPrev: {} });
  ctx.updateAmtPreview('amtIn', 'amtPrev');
  assert.equal(fakeDocument.getElementById('amtPrev').textContent, '= Rp 14');
});

test('updateAmtPreview — hasil 0 atau negatif => preview dikosongkan', () => {
  const { ctx, fakeDocument } = makeKalkulator({ amtIn: { value: '2-5' }, amtPrev: { textContent: 'sisa lama' } });
  ctx.updateAmtPreview('amtIn', 'amtPrev');
  assert.equal(fakeDocument.getElementById('amtPrev').textContent, '');
});

// ================= evalAmtExpr =================

test('evalAmtExpr — elemen tidak ditemukan => no-op, tidak error', () => {
  const { ctx } = makeKalkulator();
  assert.doesNotThrow(() => ctx.evalAmtExpr('tidakAda'));
});

test('evalAmtExpr — value kosong atau tanpa karakter operator/titik => tidak diubah, tidak dispatch event', () => {
  const events = [];
  const { ctx, fakeDocument } = makeKalkulator({
    amt1: { value: '500', dispatchEvent: (e) => events.push(e) },
  });
  ctx.evalAmtExpr('amt1');
  assert.equal(fakeDocument.getElementById('amt1').value, '500');
  assert.equal(events.length, 0);
});

test('evalAmtExpr — ekspresi valid => value ditimpa hasil hitung & dispatch event "input"', () => {
  const events = [];
  const { ctx, fakeDocument } = makeKalkulator({
    amt1: { value: '2+3', dispatchEvent: (e) => events.push(e) },
  });
  ctx.evalAmtExpr('amt1');
  assert.equal(fakeDocument.getElementById('amt1').value, '5');
  assert.equal(events.length, 1);
  assert.equal(events[0].type, 'input');
  assert.equal(events[0].bubbles, true);
});

test('evalAmtExpr — ekspresi tidak valid (hasil NaN) => value TIDAK diubah, tidak dispatch event', () => {
  const events = [];
  const { ctx, fakeDocument } = makeKalkulator({
    amt1: { value: '2+', dispatchEvent: (e) => events.push(e) },
  });
  ctx.evalAmtExpr('amt1');
  assert.equal(fakeDocument.getElementById('amt1').value, '2+');
  assert.equal(events.length, 0);
});

test('evalAmtExpr — hasil dibulatkan 2 desimal', () => {
  const events = [];
  const { ctx, fakeDocument } = makeKalkulator({
    amt1: { value: '10/3', dispatchEvent: (e) => events.push(e) },
  });
  ctx.evalAmtExpr('amt1');
  assert.equal(fakeDocument.getElementById('amt1').value, '3.33');
});
