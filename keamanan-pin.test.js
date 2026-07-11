'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { loadSource } = require('./helpers/loadSource');

// Cakupan file ini: hashPin, gantiPin, loadAndMigrateApiKeyOnUnlock (+
// encryptApiKeyWithPin/decryptApiKeyWithPin sbg fungsi pendukung, sudah
// disentuh tidak langsung di refleksi-catatan-privat.test.js tapi di sini
// dites lebih detail utk kasus gantiPin/migrasi). SENGAJA belum dicakup:
// layar PIN & lockout percobaan salah (pinPress/pinBack/checkPin/
// updatePinLockUI/_pinLockState) -- itu lebih banyak berurusan dgn
// timer/DOM interaktif (keypad), disisakan utk sesi lanjutan.

// localStorage mock in-memory sederhana (getItem/setItem/removeItem) --
// dipakai APA ADANYA (bukan permissive stub) krn gantiPin/
// loadAndMigrateApiKeyOnUnlock beneran baca-tulis localStorage utk
// 'kw_pin' & API_KEY_ENC_STORAGE_KEY (kw_apikey_enc).
function makeFakeLocalStorage(initial = {}) {
  const store = new Map(Object.entries(initial));
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    _dump: () => Object.fromEntries(store),
  };
}

function makeKeamananPin(opts = {}) {
  const toasts = [];
  const alerts = [];
  const setItemCalls = [];
  const fakeLocalStorage = opts.localStorage || makeFakeLocalStorage();
  const D = opts.D || { profile: {} };
  const ctx = loadSource(['keamanan-pin.js'], {
    D,
    crypto: globalThis.crypto,
    TextEncoder,
    TextDecoder,
    atob,
    btoa,
    localStorage: fakeLocalStorage,
    save: opts.save || (() => {}),
    toast: opts.toast || ((msg) => toasts.push(msg)),
    showMain: () => {},
    showAlertModal: (msg) => alerts.push(msg),
    showPinPromptModal: opts.showPinPromptModal || (async () => null),
    // Bungkus safeSetItem ASLI-nya app (bukan cuma spy kosong) supaya tetap
    // beneran nulis ke fakeLocalStorage -- tapi tetap dicatat tiap
    // pemanggilannya biar gampang diverifikasi di assert.
    safeSetItem: (k, v) => { setItemCalls.push([k, v]); fakeLocalStorage.setItem(k, v); return true; },
    // loadAndMigrateApiKeyOnUnlock menjadwalkan toast peringatan lewat
    // setTimeout(...,400) kalau migrasi gagal total -- jalankan SEGERA
    // (bukan nunggu 400ms beneran) biar bisa diverifikasi sinkron di test.
    setTimeout: (fn) => { fn(); return 0; },
    clearTimeout: () => {},
  }, ['API_KEY_ENC_STORAGE_KEY']);
  function setSessionPin(pin) {
    vm.runInContext(`_sessionRawPin = ${JSON.stringify(pin)};`, ctx);
  }
  function getSessionPin() {
    return vm.runInContext('_sessionRawPin', ctx);
  }
  return {
    hashPin: ctx.hashPin,
    gantiPin: ctx.gantiPin,
    loadAndMigrateApiKeyOnUnlock: ctx.loadAndMigrateApiKeyOnUnlock,
    encryptApiKeyWithPin: ctx.encryptApiKeyWithPin,
    decryptApiKeyWithPin: ctx.decryptApiKeyWithPin,
    ENC_KEY: ctx.API_KEY_ENC_STORAGE_KEY,
    D, toasts, alerts, setItemCalls, fakeLocalStorage, setSessionPin, getSessionPin,
  };
}

// ================= hashPin =================

test('hashPin — PIN yg sama menghasilkan hash yg SAMA persis (deterministik)', async () => {
  const { hashPin } = makeKeamananPin();
  const h1 = await hashPin('1234');
  const h2 = await hashPin('1234');
  assert.equal(h1, h2);
});

test('hashPin — PIN yg beda menghasilkan hash yg BEDA', async () => {
  const { hashPin } = makeKeamananPin();
  const h1 = await hashPin('1234');
  const h2 = await hashPin('4321');
  assert.notEqual(h1, h2);
});

test('hashPin — hasil berupa hex SHA-256 (64 karakter, semuanya 0-9a-f)', async () => {
  const { hashPin } = makeKeamananPin();
  const h = await hashPin('0000');
  assert.equal(h.length, 64);
  assert.match(h, /^[0-9a-f]{64}$/);
});

// ================= gantiPin =================

test('gantiPin — user batal (prompt balik kosong/null) -> TIDAK ada perubahan apa pun, tidak ada alert', async () => {
  const { gantiPin, alerts, setItemCalls, getSessionPin } = makeKeamananPin({
    showPinPromptModal: async () => null,
  });
  await gantiPin();
  assert.equal(alerts.length, 0);
  assert.equal(setItemCalls.length, 0);
  assert.equal(getSessionPin(), null);
});

test('gantiPin — PIN baru TIDAK valid (bukan 4 digit angka) -> ditolak dgn alert, TIDAK ada yg tersimpan', async () => {
  const { gantiPin, alerts, setItemCalls } = makeKeamananPin({
    showPinPromptModal: async () => 'abcd',
  });
  await gantiPin();
  assert.equal(alerts.length, 1);
  assert.match(alerts[0], /4 digit angka/);
  assert.equal(setItemCalls.length, 0);
});

test('gantiPin — PIN baru valid, BELUM pernah ada API key tersimpan -> hash PIN baru tersimpan, sesi ikut diupdate', async () => {
  const { gantiPin, toasts, fakeLocalStorage, getSessionPin, hashPin } = makeKeamananPin({
    showPinPromptModal: async () => '5678',
  });
  await gantiPin();
  assert.equal(getSessionPin(), '5678');
  assert.equal(fakeLocalStorage.getItem('kw_pin'), await hashPin('5678'));
  assert.match(toasts[0], /PIN diubah/);
});

test('gantiPin — PIN baru valid, SUDAH ada API key terenkripsi dgn PIN lama -> berhasil di re-enkripsi ke PIN baru (round-trip tetap bisa dibuka)', async () => {
  const helper = makeKeamananPin({ showPinPromptModal: async () => '9999' });
  const { gantiPin, encryptApiKeyWithPin, decryptApiKeyWithPin, fakeLocalStorage, ENC_KEY, setSessionPin } = helper;
  setSessionPin('1111'); // PIN lama aktif di sesi
  const encOld = await encryptApiKeyWithPin('1111', 'sk-rahasia-abc123');
  fakeLocalStorage.setItem(ENC_KEY, JSON.stringify(encOld));
  await gantiPin();
  const rawEncNew = fakeLocalStorage.getItem(ENC_KEY);
  const encNew = JSON.parse(rawEncNew);
  // Enkripsi ulang HARUS beda dari yg lama (salt/iv baru tiap enkripsi)...
  assert.notEqual(rawEncNew, JSON.stringify(encOld));
  // ...tapi tetap bisa dibuka pakai PIN BARU, isi (API key) tidak berubah.
  const decrypted = await decryptApiKeyWithPin('9999', encNew);
  assert.equal(decrypted, 'sk-rahasia-abc123');
  // TIDAK BISA lagi dibuka pakai PIN LAMA setelah diganti.
  const decryptedWithOldPin = await decryptApiKeyWithPin('1111', encNew);
  assert.equal(decryptedWithOldPin, null);
});

// ================= loadAndMigrateApiKeyOnUnlock =================

test('loadAndMigrateApiKeyOnUnlock — sesi PIN tidak aktif -> tidak melakukan apa-apa, D.profile.apiKey tetap kosong', async () => {
  const { loadAndMigrateApiKeyOnUnlock, D } = makeKeamananPin({ D: { profile: {} } });
  await loadAndMigrateApiKeyOnUnlock();
  assert.equal(D.profile.apiKey, undefined);
});

test('loadAndMigrateApiKeyOnUnlock — belum ada apapun tersimpan & D.profile.apiKey juga kosong -> tidak melakukan apa-apa', async () => {
  const { loadAndMigrateApiKeyOnUnlock, D, setSessionPin, setItemCalls } = makeKeamananPin({ D: { profile: {} } });
  setSessionPin('1234');
  await loadAndMigrateApiKeyOnUnlock();
  assert.equal(setItemCalls.length, 0);
});

test('loadAndMigrateApiKeyOnUnlock — belum ada yg tersimpan tapi D.profile.apiKey SUDAH terisi (mis. baru diisi manual) -> otomatis dienkripsi & disimpan', async () => {
  const D = { profile: { apiKey: 'sk-baru-diisi' } };
  const { loadAndMigrateApiKeyOnUnlock, setSessionPin, fakeLocalStorage, ENC_KEY, decryptApiKeyWithPin } = makeKeamananPin({ D });
  setSessionPin('2222');
  await loadAndMigrateApiKeyOnUnlock();
  const enc = JSON.parse(fakeLocalStorage.getItem(ENC_KEY));
  assert.equal(await decryptApiKeyWithPin('2222', enc), 'sk-baru-diisi');
});

test('loadAndMigrateApiKeyOnUnlock — sudah ada data terenkripsi & PIN sesi COCOK -> dimuat ke D.profile.apiKey apa adanya', async () => {
  const helper = makeKeamananPin({ D: { profile: {} } });
  const { loadAndMigrateApiKeyOnUnlock, D, encryptApiKeyWithPin, fakeLocalStorage, ENC_KEY, setSessionPin } = helper;
  setSessionPin('3333');
  const enc = await encryptApiKeyWithPin('3333', 'sk-tersimpan-lama');
  fakeLocalStorage.setItem(ENC_KEY, JSON.stringify(enc));
  await loadAndMigrateApiKeyOnUnlock();
  assert.equal(D.profile.apiKey, 'sk-tersimpan-lama');
});

test('loadAndMigrateApiKeyOnUnlock — skema LAMA (kunci = hash PIN via kw_pin, bukan PIN mentah) -> berhasil dimigrasi otomatis ke skema baru', async () => {
  const helper = makeKeamananPin({ D: { profile: {} } });
  const { loadAndMigrateApiKeyOnUnlock, D, hashPin, encryptApiKeyWithPin, decryptApiKeyWithPin, fakeLocalStorage, ENC_KEY, setSessionPin } = helper;
  setSessionPin('4444'); // PIN mentah sesi SEKARANG (skema baru)
  const legacyHash = await hashPin('4444'); // skema LAMA: kunci enkripsi = hash PIN (bukan PIN mentah)
  fakeLocalStorage.setItem('kw_pin', legacyHash);
  const encLegacy = await encryptApiKeyWithPin(legacyHash, 'sk-gaya-lama');
  fakeLocalStorage.setItem(ENC_KEY, JSON.stringify(encLegacy));
  await loadAndMigrateApiKeyOnUnlock();
  // Berhasil dibaca via fallback migrasi:
  assert.equal(D.profile.apiKey, 'sk-gaya-lama');
  // DAN otomatis "naik kelas": data di storage sekarang terenkripsi ulang
  // pakai skema BARU (PIN mentah), bisa dibuka lagi dgn skema baru:
  const rawEncAfter = fakeLocalStorage.getItem(ENC_KEY);
  const encAfter = JSON.parse(rawEncAfter);
  assert.equal(await decryptApiKeyWithPin('4444', encAfter), 'sk-gaya-lama');
});

test('loadAndMigrateApiKeyOnUnlock — data rusak/PIN beneran berubah (skema baru MAUPUN lama dua-duanya gagal) -> D.profile.apiKey TIDAK diisi, toast peringatan', async () => {
  const helper = makeKeamananPin({ D: { profile: {} } });
  const { loadAndMigrateApiKeyOnUnlock, D, encryptApiKeyWithPin, fakeLocalStorage, ENC_KEY, setSessionPin, toasts } = helper;
  setSessionPin('5555');
  const enc = await encryptApiKeyWithPin('9999999-pin-lain-sama-sekali', 'sk-tidak-akan-terbaca');
  fakeLocalStorage.setItem(ENC_KEY, JSON.stringify(enc));
  // Sengaja TIDAK set 'kw_pin' -> fallback legacy juga gagal (legacyPin null)
  await loadAndMigrateApiKeyOnUnlock();
  assert.equal(D.profile.apiKey, undefined);
  assert.match(toasts[0], /perlu diisi ulang/);
});
