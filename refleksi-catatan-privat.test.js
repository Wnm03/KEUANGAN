'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { loadSource } = require('./helpers/loadSource');
const { createFakeDocument } = require('./helpers/fakeDom');

// Lanjutan tests/refleksi-selfcare.test.js: bagian "berat" yang sengaja
// disisakan di situ -- Catatan Privat (addNote/toggleNoteView/deleteNote),
// yang enkripsinya pakai skema SAMA PERSIS dgn encryptApiKeyWithPin/
// decryptApiKeyWithPin di keamanan-pin.js (PBKDF2 100rb iterasi + AES-GCM).
//
// Node 22 punya globalThis.crypto (Web Crypto asli, bukan polyfill) +
// TextEncoder/TextDecoder/atob/btoa built-in, jadi TIDAK perlu mock crypto
// sama sekali -- keamanan-pin.js di-load APA ADANYA & round-trip
// enkripsi/dekripsi di test ini beneran jalan (bukan stub yg pura-pura
// berhasil). Ini juga sekaligus jadi test pertama utk fungsi
// encryptApiKeyWithPin/decryptApiKeyWithPin itu sendiri (belum ada test
// terpisah utk keamanan-pin.js -- lihat catatan CLAUDE.md bagian ke-13/14
// soal PR lanjutan yg lebih besar utk file itu).
//
// PBKDF2 100rb iterasi bikin tiap test yg enkripsi/dekripsi makan puluhan
// ms (bukan instan) -- WAJAR, itu sebabnya suite ini dipisah dari
// refleksi-selfcare.test.js yg jauh lebih cepat (logic murni, tanpa kripto).

function makeRefleksiWithPin(D, opts = {}) {
  const fakeDocument = createFakeDocument(opts.docOverrides || {});
  const toasts = [];
  const ctx = loadSource(['helper-teks.js', 'keamanan-pin.js', 'refleksi-selfcare.js'], {
    D,
    document: fakeDocument,
    crypto: globalThis.crypto,
    TextEncoder,
    TextDecoder,
    atob,
    btoa,
    save: opts.save || (() => {}),
    toast: opts.toast || ((msg) => toasts.push(msg)),
    askConfirm: opts.askConfirm || (async () => true),
    openModal: () => {},
    closeModal: () => {},
    uid: opts.uid || (() => 'uid-' + Math.random().toString(36).slice(2)),
    sameId: (a, b) => String(a) === String(b),
    todayStr: () => {
      const n = new Date();
      return n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0') + '-' + String(n.getDate()).padStart(2, '0');
    },
  }, ['Refleksi']);
  // _sessionRawPin di keamanan-pin.js dideklarasikan dgn `let` -- vm TIDAK
  // menempelkannya otomatis ke context (lihat catatan di loadSource.js),
  // dan `expose` di loadSource() cuma bisa BACA, bukan SET nilai baru dari
  // luar. Jalankan assignment langsung di context yg SAMA (masih 1 lexical
  // environment krn semua script tadi runInContext ke context yg sama) lewat
  // vm.runInContext -- ini caranya nyalain/matiin "sesi PIN aktif" dari test.
  function setSessionPin(pin) {
    vm.runInContext(`_sessionRawPin = ${JSON.stringify(pin)};`, ctx);
  }
  return { Refleksi: ctx.Refleksi, fakeDocument, toasts, setSessionPin };
}

function inputFields(judul, text) {
  return { refCatatanJudul: { value: judul }, refCatatanText: { value: text } };
}

// ================= addNote =================

test('addNote — sesi PIN TIDAK aktif -> ditolak dgn toast, TIDAK menyimpan apa pun', async () => {
  const D = { refleksi: {} };
  const { Refleksi, toasts } = makeRefleksiWithPin(D, { docOverrides: inputFields('Judul', 'Isi rahasia') });
  // setSessionPin() SENGAJA tidak dipanggil -> _sessionRawPin tetap null (default awal di keamanan-pin.js)
  await Refleksi.addNote();
  assert.equal(D.refleksi.privateNotes, undefined);
  assert.match(toasts[0], /Sesi PIN tidak aktif/);
});

test('addNote — teks kosong (whitespace) ditolak SEBELUM cek sesi PIN, TIDAK menyimpan', async () => {
  const D = { refleksi: {} };
  const { Refleksi, toasts } = makeRefleksiWithPin(D, { docOverrides: inputFields('Judul', '   ') });
  await Refleksi.addNote();
  assert.equal(D.refleksi.privateNotes, undefined);
  assert.match(toasts[0], /Tulis dulu isi catatannya/);
});

test('addNote — sesi PIN aktif & teks valid -> tersimpan TERENKRIPSI (bukan plaintext), input dikosongkan', async () => {
  const D = { refleksi: {} };
  const docOverrides = inputFields('Rahasia Kecil', 'Aku takut gagal tapi tetap coba.');
  const { Refleksi, toasts, fakeDocument, setSessionPin } = makeRefleksiWithPin(D, { docOverrides });
  setSessionPin('1234');
  await Refleksi.addNote();
  assert.equal(D.refleksi.privateNotes.length, 1);
  const note = D.refleksi.privateNotes[0];
  assert.ok(note.id);
  assert.ok(note.date);
  // Bentuk hasil enkripsi harus {salt, iv, ct} base64 (sama dgn skema
  // encryptApiKeyWithPin), dan yg PALING PENTING: ct TIDAK boleh memuat
  // teks asli sama sekali (baik plaintext maupun base64-nya) -- kalau ini
  // gagal berarti ada kebocoran data mentah ke storage.
  assert.ok(note.enc.salt && note.enc.iv && note.enc.ct);
  assert.doesNotMatch(JSON.stringify(note.enc), /Rahasia Kecil/);
  assert.doesNotMatch(JSON.stringify(note.enc), /takut gagal/);
  assert.equal(fakeDocument.getElementById('refCatatanJudul').value, '');
  assert.equal(fakeDocument.getElementById('refCatatanText').value, '');
  assert.match(toasts[0], /tersimpan \(terenkripsi\)/);
});

// ================= toggleNoteView (round-trip enkripsi/dekripsi ASLI) =================

test('toggleNoteView — PIN sesi SAMA dgn saat menyimpan -> berhasil didekripsi, judul+isi balik sama persis', async () => {
  const D = { refleksi: {} };
  const { Refleksi, setSessionPin, fakeDocument } = makeRefleksiWithPin(D, {
    docOverrides: { ...inputFields('Mimpi', 'Ingin healing ke pantai bulan depan'), refNoteBody_ID: {}, refNoteEyeBtn_ID: {} },
  });
  setSessionPin('5678');
  await Refleksi.addNote();
  const id = D.refleksi.privateNotes[0].id;
  // Daftarkan elemen body/tombol mata dgn id ASLI (baru diketahui setelah addNote)
  fakeDocument.getElementById('refNoteBody_' + id); // auto-create via ensure()
  fakeDocument.getElementById('refNoteEyeBtn_' + id);
  await Refleksi.toggleNoteView(id);
  const bodyHtml = fakeDocument.getElementById('refNoteBody_' + id).innerHTML;
  assert.match(bodyHtml, /Mimpi/);
  assert.match(bodyHtml, /Ingin healing ke pantai bulan depan/);
  assert.equal(fakeDocument.getElementById('refNoteEyeBtn_' + id).textContent, '🙈');
});

test('toggleNoteView — panggil 2x berturut-turut (buka lalu tutup) -> kembali ke status tersembunyi', async () => {
  const D = { refleksi: {} };
  const { Refleksi, setSessionPin, fakeDocument } = makeRefleksiWithPin(D, {
    docOverrides: inputFields('', 'Catatan singkat'),
  });
  setSessionPin('1111');
  await Refleksi.addNote();
  const id = D.refleksi.privateNotes[0].id;
  await Refleksi.toggleNoteView(id); // buka
  await Refleksi.toggleNoteView(id); // tutup lagi
  const bodyEl = fakeDocument.getElementById('refNoteBody_' + id);
  assert.match(bodyEl.textContent, /Terenkripsi/);
  assert.equal(fakeDocument.getElementById('refNoteEyeBtn_' + id).textContent, '👁');
});

test('toggleNoteView — PIN sesi BEDA dgn saat menyimpan (mis. PIN sudah diganti) -> gagal dekripsi, toast error, TIDAK menampilkan isi', async () => {
  const D = { refleksi: {} };
  const { Refleksi, setSessionPin, fakeDocument, toasts } = makeRefleksiWithPin(D, {
    docOverrides: inputFields('', 'Isi yg tidak boleh bocor'),
  });
  setSessionPin('1234');
  await Refleksi.addNote();
  const id = D.refleksi.privateNotes[0].id;
  setSessionPin('9999'); // simulasikan PIN sudah berubah / sesi beda
  toasts.length = 0;
  await Refleksi.toggleNoteView(id);
  assert.match(toasts[0], /Gagal membuka catatan/);
  const bodyEl = fakeDocument.getElementById('refNoteBody_' + id);
  assert.doesNotMatch(bodyEl.innerHTML || '', /tidak boleh bocor/);
});

test('toggleNoteView — sesi PIN TIDAK aktif sama sekali -> ditolak dgn toast, tidak coba dekripsi', async () => {
  const D = { refleksi: { privateNotes: [{ id: 'n1', date: '2026-01-01', enc: { salt: 'x', iv: 'y', ct: 'z' } }] } };
  const { Refleksi, toasts, fakeDocument } = makeRefleksiWithPin(D, {
    docOverrides: { refNoteBody_n1: {}, refNoteEyeBtn_n1: {} },
  });
  await Refleksi.toggleNoteView('n1');
  assert.match(toasts[0], /Sesi PIN tidak aktif/);
  assert.doesNotMatch(fakeDocument.getElementById('refNoteBody_n1').innerHTML || '', /./);
});

// ================= deleteNote =================

test('deleteNote — batal (askConfirm false) -> catatan TETAP ada', async () => {
  const D = { refleksi: { privateNotes: [{ id: 'n1', date: '2026-01-01', enc: { salt: 'a', iv: 'b', ct: 'c' } }] } };
  const { Refleksi } = makeRefleksiWithPin(D, { askConfirm: async () => false });
  await Refleksi.deleteNote('n1');
  assert.equal(D.refleksi.privateNotes.length, 1);
});

test('deleteNote — konfirmasi hapus -> catatan hilang & status "_revealed" ikut dibersihkan', async () => {
  const D = { refleksi: { privateNotes: [{ id: 'n1', date: '2026-01-01', enc: { salt: 'a', iv: 'b', ct: 'c' } }] } };
  const { Refleksi } = makeRefleksiWithPin(D, { askConfirm: async () => true });
  Refleksi._revealed = { n1: true };
  await Refleksi.deleteNote('n1');
  assert.equal(D.refleksi.privateNotes.length, 0);
  assert.equal(Refleksi._revealed.n1, undefined);
});
