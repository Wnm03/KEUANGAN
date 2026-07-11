'use strict';
/**
 * scan-ocr-asset-name.test.js — guard regresi utk bug "nama folder tujuan
 * Bibit ke-pilih jadi Nama Aset" di guessAssetNameFromText() (scan-ocr.js).
 *
 * LATAR BELAKANG: screenshot Bibit "Pasar Uang" (folder tujuan investasi)
 * punya breadcrumb subtitle pendek ("Rumah", "Pendidikan", dst -- nama FOLDER
 * TUJUAN/goal bawaan Bibit, BUKAN nama produk reksa dana) tepat di bawah
 * judul halaman. Karena pendek & lolos semua filter panjang/huruf, breadcrumb
 * itu ke-pilih salah sbg Nama Aset, padahal nama produk asli ada di baris
 * lain. Fix-nya: tambahkan nama2 folder tujuan umum Bibit ke
 * ASSET_NAME_EXCLUDE_RE. Bug ini SEMPAT ke-revert tanpa sengaja lewat patch
 * dari branch lama (lihat riwayat commit) -- makanya butuh test permanen,
 * bukan cuma komentar `// BUGFIX:` yang bisa hilang saat file di-diff/revert.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadSource } = require('./helpers/loadSource');

const ctx = loadSource(['scan-ocr.js']);

function ocrText(lines) {
  return lines.join('\n');
}

test('guessAssetNameFromText — breadcrumb folder tujuan Bibit ("Rumah") TIDAK ke-pilih jadi nama aset', () => {
  const text = ocrText([
    '09:41',
    'Rumah',
    'Rp 15.234.567',
    'Profit +Rp 234.567 (1,56%)',
    'Majoris Pasar Uang Syariah Indonesia',
    'Beli Jual',
  ]);
  assert.equal(ctx.guessAssetNameFromText(text), 'Majoris Pasar Uang Syariah Indonesia');
});

test('guessAssetNameFromText — semua nama folder tujuan umum Bibit ikut ter-exclude', () => {
  const goalFolders = [
    'Rumah', 'Pendidikan', 'Pensiun', 'Dana Darurat', 'Liburan',
    'Kendaraan', 'Nikah', 'Umroh', 'Haji',
  ];
  for (const folder of goalFolders) {
    const text = ocrText([
      '10:15',
      folder,
      'Rp 5.000.000',
      'Nama Produk: Sucorinvest Money Market Fund',
    ]);
    assert.notEqual(
      ctx.guessAssetNameFromText(text),
      folder,
      `folder tujuan "${folder}" seharusnya ter-exclude, bukan ke-pilih jadi nama aset`
    );
  }
});

test('guessAssetNameFromText — exclude case-insensitive (huruf kecil/besar campur)', () => {
  const text = ocrText(['08:00', 'rumah', 'Rp 1.000.000', 'Bareksa Pasar Uang Syariah']);
  assert.notEqual(ctx.guessAssetNameFromText(text), 'rumah');
});

test('guessAssetNameFromText — label eksplisit "Nama:" tetap prioritas #1 (tidak terganggu exclude list)', () => {
  const text = ocrText(['Nama: Reksadana Sucorinvest Sharia Money Market Fund', 'Rp 2.000.000']);
  assert.equal(ctx.guessAssetNameFromText(text), 'Reksadana Sucorinvest Sharia Money Market Fund');
});
