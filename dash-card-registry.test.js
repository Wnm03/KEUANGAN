'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Test ini SENGAJA tidak pakai loadSource/vm (modules-render.js terlalu besar &
// bergantung ke banyak modul lain buat runtime), tapi cukup baca teks source-nya
// & regex-parse dua array literal DASH_CARD_DEFS/DASH_RENDER_ORDER. Cukup untuk
// menjaga satu invarian struktural yang penting: kedua daftar itu harus selalu
// berisi key yang PERSIS sama (registry generalisasi di renderDashboard()
// bergantung padanya — lihat catatan di dekat DASH_RENDER_ORDER di source).
const SRC = fs.readFileSync(
  path.join(__dirname, '..', 'modules-render.js'),
  'utf8'
);

function extractKeys(re) {
  const m = SRC.match(re);
  assert.ok(m, `Pola tidak ditemukan di modules-render.js: ${re}`);
  return [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]);
}

test('DASH_CARD_DEFS dan DASH_RENDER_ORDER berisi key yang persis sama (tidak ada yang lupa ditambah/dihapus di salah satu)', () => {
  const defsKeys = [...SRC.matchAll(/key:'([^']+)'/g)].map((m) => m[1]);
  const orderKeys = extractKeys(/const DASH_RENDER_ORDER=\[([^\]]+)\];/);

  assert.equal(new Set(defsKeys).size, defsKeys.length, 'DASH_CARD_DEFS punya key duplikat');
  assert.equal(new Set(orderKeys).size, orderKeys.length, 'DASH_RENDER_ORDER punya key duplikat');

  const missingFromOrder = defsKeys.filter((k) => !orderKeys.includes(k));
  const extraInOrder = orderKeys.filter((k) => !defsKeys.includes(k));
  assert.deepEqual(missingFromOrder, [], 'Ada key di DASH_CARD_DEFS yang belum dimasukkan ke DASH_RENDER_ORDER (card ini TIDAK akan pernah dirender)');
  assert.deepEqual(extraInOrder, [], 'Ada key di DASH_RENDER_ORDER yang tidak ada di DASH_CARD_DEFS (akan error saat renderDashboard() jalan)');
});

test('setiap entry DASH_CARD_DEFS punya key/label/elId/render', () => {
  const blockMatch = SRC.match(/const DASH_CARD_DEFS=\[([\s\S]*?)\n\];/);
  assert.ok(blockMatch, 'Blok DASH_CARD_DEFS tidak ditemukan');
  const entries = blockMatch[1].split('\n').filter((l) => l.trim().startsWith('{key:'));
  assert.ok(entries.length > 0, 'Tidak ada entry ke-parse di DASH_CARD_DEFS');
  for (const entry of entries) {
    assert.match(entry, /key:'[^']+'/, `Entry tanpa "key": ${entry}`);
    assert.match(entry, /label:'[^']+'/, `Entry tanpa "label": ${entry}`);
    assert.match(entry, /elId:'[^']+'/, `Entry tanpa "elId": ${entry}`);
    assert.match(entry, /render:/, `Entry tanpa "render": ${entry}`);
  }
});
