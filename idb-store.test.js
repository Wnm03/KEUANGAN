'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadSource } = require('./helpers/loadSource');

// Cakupan file ini: IDBStore (helper generik penyimpanan IndexedDB, co-located
// di aset.js — lihat CATATAN di aset.js baris 3) — _open/get/set/_withRetry,
// termasuk skenario retry saat koneksi basi (InvalidStateError/"closing").
//
// Sandbox ini tidak punya akses internet (npm install ke fake-indexeddb
// gagal), jadi dipakai mock indexedDB MANUAL minimal: cukup untuk simulasikan
// open() sukses/gagal, get/put lewat transaction, dan trigger onversionchange/
// onclose/error sesuai skenario yang mau dites. Ini BUKAN implementasi
// IndexedDB penuh (tidak ada persistensi lintas open() beneran, tidak ada
// keyRange dst) — cukup utk menjamin IDBStore memanggil API-nya dgn benar &
// menangani sukses/gagal/retry sesuai kontraknya sendiri.

function makeReq() {
  const req = { onsuccess: null, onerror: null, result: undefined, error: undefined };
  return req;
}

// db mock: transaction()/objectStore()/get()/put() bekerja di atas Map
// in-memory yang di-passing dari luar (shared antar "koneksi" palsu),
// supaya data yang di-set() bisa dibaca lagi lewat get() dalam skenario
// sukses biasa.
function makeFakeDb(store, opts = {}) {
  const db = {
    _closed: false,
    onversionchange: null,
    onclose: null,
    close() { db._closed = true; },
    transaction(name, mode) {
      if (opts.failMode === 'transaction') {
        throw makeError(opts.errorName || 'InvalidStateError', opts.errorMsg);
      }
      return {
        objectStore() {
          return {
            get(key) {
              const req = makeReq();
              queueMicrotask(() => {
                if (opts.failMode === 'get') { req.error = makeError(opts.errorName, opts.errorMsg); req.onerror && req.onerror(); return; }
                req.result = store.has(key) ? store.get(key) : undefined;
                req.onsuccess && req.onsuccess();
              });
              return req;
            },
            put(value, key) { store.set(key, value); },
          };
        },
        get oncomplete() { return this._oncomplete; },
        set oncomplete(fn) { this._oncomplete = fn; queueMicrotask(() => { if (!opts.failMode) fn && fn(); }); },
        get onerror() { return this._onerror; },
        set onerror(fn) {
          this._onerror = fn;
          if (opts.failMode === 'txError') queueMicrotask(() => fn && fn());
        },
        error: opts.failMode === 'txError' ? makeError(opts.errorName, opts.errorMsg) : undefined,
      };
    },
  };
  return db;
}

function makeError(name, msg) {
  const e = new Error(msg || name || 'Error');
  e.name = name || 'Error';
  return e;
}

// indexedDB.open() mock: setiap panggilan open() bisa dikonfigurasi untuk
// sukses (balikin db dari factory) atau gagal (reject via req.onerror).
function makeIndexedDB(dbFactory, opts = {}) {
  let openCount = 0;
  return {
    openCount: () => openCount,
    open() {
      openCount++;
      const req = makeReq();
      queueMicrotask(() => {
        if (opts.openFails) { req.error = makeError('OpenError', 'Gagal buka'); req.onerror && req.onerror(); return; }
        req.result = dbFactory();
        req.onsuccess && req.onsuccess();
      });
      return req;
    },
  };
}

function loadIdbStore(indexedDBMock) {
  return loadSource(['aset.js'], {
    D: {},
    document: { getElementById: () => null },
    window: indexedDBMock ? { indexedDB: indexedDBMock } : {},
    indexedDB: indexedDBMock,
  }, ['IDBStore']);
}

// ================= _open =================

test('_open — window.indexedDB tidak ada -> reject "tidak didukung"', async () => {
  const ctx = loadIdbStore(undefined);
  await assert.rejects(() => ctx.IDBStore._open(), /tidak didukung/);
});

test('_open — sukses, cache promise supaya open() cuma dipanggil sekali utk pemanggilan berulang', async () => {
  const store = new Map();
  const idb = makeIndexedDB(() => makeFakeDb(store));
  const ctx = loadIdbStore(idb);
  const db1 = await ctx.IDBStore._open();
  const db2 = await ctx.IDBStore._open();
  assert.equal(db1, db2);
  assert.equal(idb.openCount(), 1);
});

test('_open — indexedDB.open() gagal -> reject dgn req.error, cache di-reset (bisa dicoba lagi)', async () => {
  const idb = makeIndexedDB(() => makeFakeDb(new Map()), { openFails: true });
  const ctx = loadIdbStore(idb);
  await assert.rejects(() => ctx.IDBStore._open());
  assert.equal(ctx.IDBStore._dbPromise, null);
});

test('_open — koneksi onversionchange -> db ditutup & cache _dbPromise di-reset', async () => {
  const store = new Map();
  let capturedDb;
  const idb = makeIndexedDB(() => { capturedDb = makeFakeDb(store); return capturedDb; });
  const ctx = loadIdbStore(idb);
  await ctx.IDBStore._open();
  assert.notEqual(ctx.IDBStore._dbPromise, null);
  capturedDb.onversionchange();
  assert.equal(ctx.IDBStore._dbPromise, null);
  assert.equal(capturedDb._closed, true);
});

test('_open — koneksi onclose -> cache _dbPromise di-reset', async () => {
  const store = new Map();
  let capturedDb;
  const idb = makeIndexedDB(() => { capturedDb = makeFakeDb(store); return capturedDb; });
  const ctx = loadIdbStore(idb);
  await ctx.IDBStore._open();
  capturedDb.onclose();
  assert.equal(ctx.IDBStore._dbPromise, null);
});

// ================= get / set (jalur sukses) =================

test('set() lalu get() — nilai tersimpan & terbaca lagi lewat store bersama', async () => {
  const store = new Map();
  const idb = makeIndexedDB(() => makeFakeDb(store));
  const ctx = loadIdbStore(idb);
  const okSet = await ctx.IDBStore.set('foo', { a: 1 });
  assert.equal(okSet, true);
  const val = await ctx.IDBStore.get('foo');
  assert.deepEqual(val, { a: 1 });
});

test('get() — key tidak ada -> resolve undefined', async () => {
  const idb = makeIndexedDB(() => makeFakeDb(new Map()));
  const ctx = loadIdbStore(idb);
  const val = await ctx.IDBStore.get('tidak-ada');
  assert.equal(val, undefined);
});

// ================= _withRetry =================

test('_withRetry — error biasa (bukan stale conn) -> log & balikin fallback, TIDAK retry', async () => {
  const idb = makeIndexedDB(() => makeFakeDb(new Map(), { failMode: 'transaction', errorName: 'QuotaExceededError' }));
  const ctx = loadIdbStore(idb);
  const val = await ctx.IDBStore.get('x'); // get() pakai fallback=undefined
  assert.equal(val, undefined);
  assert.equal(idb.openCount(), 1); // tidak buka koneksi baru krn bukan stale-conn
});

test('_withRetry — InvalidStateError (koneksi stale) -> buang cache & retry SEKALI, sukses di percobaan ke-2', async () => {
  const store = new Map();
  let attempt = 0;
  const idb = {
    openCount: () => idb._n || 0,
    open() {
      idb._n = (idb._n || 0) + 1;
      const req = makeReq();
      queueMicrotask(() => {
        attempt++;
        // percobaan pertama balikin db yg transaction()-nya lempar
        // InvalidStateError; percobaan ke-2 (setelah cache dibuang) sukses.
        req.result = attempt === 1
          ? makeFakeDb(store, { failMode: 'transaction', errorName: 'InvalidStateError' })
          : makeFakeDb(store);
        req.onsuccess && req.onsuccess();
      });
      return req;
    },
  };
  const ctx = loadIdbStore(idb);
  const ok = await ctx.IDBStore.set('k', 'v');
  assert.equal(ok, true);
  assert.equal(idb.openCount(), 2); // open() dipanggil lagi setelah cache dibuang
});

test('_withRetry — pesan error mengandung "closing" (khas Safari) juga dianggap stale conn -> retry', async () => {
  const store = new Map();
  let attempt = 0;
  const idb = {
    openCount: () => idb._n || 0,
    open() {
      idb._n = (idb._n || 0) + 1;
      const req = makeReq();
      queueMicrotask(() => {
        attempt++;
        req.result = attempt === 1
          ? makeFakeDb(store, { failMode: 'transaction', errorName: 'Error', errorMsg: 'connection is closing' })
          : makeFakeDb(store);
        req.onsuccess && req.onsuccess();
      });
      return req;
    },
  };
  const ctx = loadIdbStore(idb);
  const ok = await ctx.IDBStore.set('k2', 'v2');
  assert.equal(ok, true);
});

test('_withRetry — stale conn TAPI percobaan ke-2 juga gagal -> menyerah, balikin fallback', async () => {
  const idb = makeIndexedDB(() => makeFakeDb(new Map(), { failMode: 'transaction', errorName: 'InvalidStateError' }));
  const ctx = loadIdbStore(idb);
  const val = await ctx.IDBStore.get('x');
  assert.equal(val, undefined); // fallback get() = undefined
  assert.equal(idb.openCount(), 2); // percobaan awal + 1x retry, lalu menyerah
});

test('set() gagal permanen -> fallback false (bukan undefined, sesuai fallback yg di-pass IDBStore.set)', async () => {
  const idb = makeIndexedDB(() => makeFakeDb(new Map(), { failMode: 'transaction', errorName: 'QuotaExceededError' }));
  const ctx = loadIdbStore(idb);
  const ok = await ctx.IDBStore.set('k', 'v');
  assert.equal(ok, false);
});
