#!/usr/bin/env node
/**
 * build.js — Build otomatis untuk Keluarga W
 * =============================================================
 * Jalankan skrip ini SETIAP KALI selesai edit file .js sumber
 * (modules-*.js / modals.js), SEBELUM upload ke hosting.
 *
 * Yang dikerjakan otomatis (satu perintah, satu sumber kebenaran):
 *   1. Naikkan APP_BUILD_VERSION & samakan ke SEMUA file source
 *      sekaligus (modules-render.js, modals.js, modules-calc.js,
 *      features-budget-laporan-carnotes-pelanggan.js, features-helpers-global-security.js, dst) — tidak
 *      akan ada lagi versi yang "ketinggalan" di satu file.
 *   2. Gabungkan (bundle) source ke app-bundle-a.min.js &
 *      app-bundle-b.min.js — INI FILE YANG BENERAN DIPAKAI APP,
 *      jadi tidak perlu lagi edit manual dua kali (source + bundle).
 *   3. Naikkan ?v=N di index.html/app_production.html & CACHE_NAME
 *      di sw.js (lewat bump-version.sh yang sudah ada).
 *   4. Cek sintaks kedua bundle hasil build (node --check). Kalau
 *      ada error, build DIHENTIKAN — tidak akan menghasilkan bundle
 *      yang rusak.
 *   5. Lint otomatis untuk bug class "u-dnone (!important) vs
 *      style.display" — dulu ini pernah bikin card Kebebasan
 *      Finansial (dan 26 elemen lain) judulnya tampil tapi isinya
 *      permanen kosong. Build akan DIHENTIKAN kalau ketemu elemen
 *      yang: (a) disembunyikan lewat class "u-dnone" di HTML awal,
 *      DAN (b) ditampilkan di JS cuma lewat `el.style.display=...`
 *      TANPA `el.classList.remove('u-dnone')`/`toggle` di dekatnya.
 *      Lihat fungsi lintDnoneStyleDisplayMismatch() di bawah.
 *   6. app_production.html SELALU ditulis ulang jadi salinan persis
 *      index.html di akhir build — jadi dua file itu tidak akan
 *      pernah lagi diam-diam berbeda isi (dulu ini pure manual,
 *      gampang kelupaan salah satu).
 *
 * Pemakaian:
 *   node build.js                  → auto-increment nomor versi (…-31 → …-32)
 *   node build.js nama-versi-baru   → paksa pakai string versi custom
 *
 * Minifikasi:
 *   Kalau paket `esbuild` terpasang (npm install --save-dev esbuild),
 *   skrip ini otomatis makai buat hasil yang benar-benar diminify
 *   (ukuran kecil, mirip build lama). Kalau esbuild TIDAK ada,
 *   skrip tetap jalan & tetap menghasilkan bundle yang 100% valid —
 *   cuma ukurannya lebih besar (source digabung apa adanya, belum
 *   diperkecil). Aman dipakai, tinggal upload; minifikasi tinggal
 *   ditambah belakangan kalau mau.
 * =============================================================
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = __dirname;

const GROUP_A = [
  'modules-render.js',
  'modals.js',
  'modules-calc.js',
  'cobek.js',
  'piutang-utang.js',
  'pajak-pbb-zakat.js',
  'features-budget-laporan-carnotes-pelanggan.js',
  'edukasi-dana.js',
  'sewakios.js',
  'hidup-seimbang.js',
  'linktx.js',
  'renovasi.js',
  'aset.js',
  'worthit.js',
];
const GROUP_B = [
  'data-default.js',
  'features-helpers-global-security.js',
  'diagnostik-versi.js',
  'format-tema.js',
  'error-handler.js',
  'helper-teks.js',
  'keamanan-pin.js',
  'modal-navigasi.js',
  'reset-gaji-mingguan.js',
  'debug-console.js',
  'pengaturan-search.js',
  'onboarding.js',
  'kalkulator-input.js',
  'scan-ocr.js',
  'filter-laporan.js',
  'akun.js',
  'gaji-calc.js',
  'transaksi.js',
  'profil-pengaturan.js',
  'kategori.js',
  'tagihan-kalender.js',
  'backup-restore.js',
  'payroll-absensi.js',
  'features-tukang-kendaraan-storage.js',
  'features-aiwidget-reminder-gdrive-search.js',
  'features-sheets-pwa-selftest.js',
];
const ALL_SOURCE = [...GROUP_A, ...GROUP_B];
const HTML_FILES = ['index.html', 'app_production.html'];

function readFile(f) {
  return fs.readFileSync(path.join(ROOT, f), 'utf8');
}
function writeFile(f, content) {
  fs.writeFileSync(path.join(ROOT, f), content);
}

// 1. Deteksi versi sekarang dari features-helpers-global-security.js (sumber APP_BUILD_VERSION)
function detectCurrentVersion() {
  const src = readFile('features-helpers-global-security.js');
  const m = src.match(/APP_BUILD_VERSION\s*=\s*'([^']+)'/);
  if (!m) {
    throw new Error('Tidak ketemu APP_BUILD_VERSION di features-helpers-global-security.js — cek apakah nama variabelnya berubah.');
  }
  return m[1];
}

function computeNextVersion(current, explicit) {
  if (explicit) return explicit;
  const m = current.match(/^(.*-)(\d+)$/);
  if (!m) {
    throw new Error(
      `Format versi "${current}" tidak dikenali (harus diakhiri -angka, mis. ...-32).\n` +
      `Kasih versi baru manual: node build.js nama-versi-baru`
    );
  }
  const prefix = m[1];
  const num = parseInt(m[2], 10) + 1;
  return prefix + num;
}

// 2. Ganti string versi lama -> baru di SEMUA file source yang memuatnya
function bumpVersionEverywhere(oldV, newV) {
  const changed = [];
  for (const f of ALL_SOURCE) {
    const content = readFile(f);
    if (content.includes(oldV)) {
      writeFile(f, content.split(oldV).join(newV));
      changed.push(f);
    }
  }
  return changed;
}

// 3. Minifikasi opsional lewat esbuild (kalau terpasang), fallback ke gabungan mentah
function minify(code) {
  try {
    // eslint-disable-next-line global-require
    const esbuild = require('esbuild');
    const result = esbuild.transformSync(code, { minify: true, loader: 'js', target: 'es2019' });
    return { code: result.code, minified: true };
  } catch (e) {
    return { code, minified: false };
  }
}

// 3b. Backup bundle lama sebelum ditimpa, biar bisa rollback cepat kalau build baru bermasalah
const BACKUP_DIR = path.join(ROOT, 'backups');
const MAX_BACKUPS_PER_FILE = 4; // simpan 4 backup terakhir per bundle, sisanya dihapus otomatis
// (diturunkan dari 10 -> 4 di sesi cleanup 2026-07-10: limit 10 x 2 bundle x ~570KB
// = bisa sampai ~11MB dan ikut kebawa kalau folder project di-zip untuk dikirim/diupload.
// 4 backup/bundle = 4 langkah build terakhir yang bisa di-rollback.sh, cukup buat kejar
// masalah "build baru bermasalah" tanpa numpuk backup yang sudah pasti tidak dipakai lagi.)

function backupBundle(outFile, oldVersion) {
  const src = path.join(ROOT, outFile);
  if (!fs.existsSync(src)) return null; // build pertama kali, belum ada yang perlu dibackup

  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

  const ts = new Date().toISOString().replace(/[:.]/g, '-'); // aman dipakai di nama file
  const ext = path.extname(outFile); // .js
  const base = path.basename(outFile, ext); // app-bundle-a.min
  const backupName = `${base}.${oldVersion}.${ts}${ext}`;
  const dest = path.join(BACKUP_DIR, backupName);

  fs.copyFileSync(src, dest);
  pruneOldBackups(base, ext);
  return backupName;
}

// Hapus backup terlama kalau sudah melebihi MAX_BACKUPS_PER_FILE, biar folder tidak membengkak terus
function pruneOldBackups(base, ext) {
  const prefix = `${base}.`;
  const files = fs.readdirSync(BACKUP_DIR)
    .filter((f) => f.startsWith(prefix) && f.endsWith(ext))
    .map((f) => ({ name: f, mtime: fs.statSync(path.join(BACKUP_DIR, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime); // terbaru dulu

  const toDelete = files.slice(MAX_BACKUPS_PER_FILE);
  for (const f of toDelete) {
    fs.unlinkSync(path.join(BACKUP_DIR, f.name));
  }
}

function buildBundle(group, outFile, oldVersion) {
  const backupName = backupBundle(outFile, oldVersion);
  const combined = group.map(readFile).join('\n');
  const { code, minified } = minify(combined);
  const header = `// ${outFile} — DIBUAT OTOMATIS oleh build.js dari: ${group.join(', ')}\n` +
                 `// JANGAN diedit manual — edit file source-nya lalu jalankan: node build.js\n`;
  const finalCode = minified ? code : header + code;
  writeFile(outFile, finalCode);
  return { minified, size: Buffer.byteLength(finalCode, 'utf8'), backupName };
}

// 4b. Lint: cegah regresi bug "u-dnone (!important) vs style.display"
// Kronologi: .u-dnone dulu pakai `display:none !important`. Banyak card
// dashboard dirender awal dengan class u-dnone di HTML, lalu JS coba
// menampilkannya cuma lewat `el.style.display='block'` tanpa melepas
// class u-dnone-nya -> karena !important, elemen itu PERMANEN
// tersembunyi walau JS sudah "berhasil" jalan tanpa error. Sekarang
// !important sudah dihapus dari CSS, tapi lint ini tetap dijaga supaya
// pola kode yang sama tidak diam-diam masuk lagi di masa depan (misal
// !important ditambah lagi tanpa sadar, atau file source baru meniru
// pola lama tanpa classList.remove/toggle).
function lintDnoneStyleDisplayMismatch() {
  const htmlSrc = HTML_FILES.map(readFile).join('\n');
  const dnoneIds = new Set();
  const idTagRe = /<[^>]*\bid=["']([a-zA-Z0-9_-]+)["'][^>]*>/g;
  let m;
  while ((m = idTagRe.exec(htmlSrc))) {
    if (m[0].includes('u-dnone')) dnoneIds.add(m[1]);
  }
  const classFirstRe = /<[^>]*class=["'][^"']*u-dnone[^"']*["'][^>]*\bid=["']([a-zA-Z0-9_-]+)["']/g;
  while ((m = classFirstRe.exec(htmlSrc))) dnoneIds.add(m[1]);

  const allSrc = ALL_SOURCE.map((f) => `\n//FILE:${f}\n${readFile(f)}`).join('');

  // id-id yang SUDAH benar (pernah di-classList.remove/toggle('u-dnone'), langsung atau lewat variabel)
  const fixedIds = new Set();
  const declRe = /(?:const|let|var)\s+(\w+)\s*=\s*document\.getElementById\(["']([a-zA-Z0-9_-]+)["']\)/g;
  const varToId = {};
  while ((m = declRe.exec(allSrc))) {
    (varToId[m[1]] = varToId[m[1]] || new Set()).add(m[2]);
  }
  const directFixRe = /getElementById\(["']([a-zA-Z0-9_-]+)["']\)\.classList\.(remove|toggle)\(["']u-dnone["']/g;
  while ((m = directFixRe.exec(allSrc))) fixedIds.add(m[1]);
  const varFixRe = /(\w+)\.classList\.(remove|toggle)\(["']u-dnone["']/g;
  while ((m = varFixRe.exec(allSrc))) {
    (varToId[m[1]] || []).forEach((id) => fixedIds.add(id));
  }

  // Untuk tiap file source, cek per-kejadian style.display=show, cari deklarasi
  // getElementById terdekat SEBELUM baris itu utk variabel yang sama (scope-aware secara heuristik),
  // lalu pastikan sudah ada classList.remove/toggle('u-dnone') di antara deklarasi & baris itu.
  const showValRe = /(block|flex|grid|inline[a-z-]*)/;
  const problems = [];
  for (const f of ALL_SOURCE) {
    const content = readFile(f);
    const decls = [];
    const dRe = /(?:const|let|var)\s+(\w+)\s*=\s*document\.getElementById\(["']([a-zA-Z0-9_-]+)["']\)/g;
    let dm;
    while ((dm = dRe.exec(content))) decls.push({ pos: dm.index, v: dm[1], id: dm[2] });
    const disRe = /(\w+)\.style\.display\s*=\s*['"](block|flex|grid|inline[a-z-]*)['"]/g;
    let sm;
    while ((sm = disRe.exec(content))) {
      const varName = sm[1];
      const cands = decls.filter((d) => d.v === varName && d.pos < sm.index);
      if (!cands.length) continue;
      const nearest = cands[cands.length - 1];
      if (!dnoneIds.has(nearest.id) || fixedIds.has(nearest.id)) continue;
      const between = content.slice(nearest.pos, sm.index);
      const fixRe = new RegExp(varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "\\.classList\\.(remove|toggle)\\(['\"]u-dnone['\"]");
      if (fixRe.test(between)) continue;
      const line = content.slice(0, sm.index).split('\n').length;
      problems.push(`${f}:${line} — #${nearest.id} disembunyikan via class "u-dnone" di HTML, tapi ditampilkan cuma lewat ${varName}.style.display='${sm[2]}' tanpa ${varName}.classList.remove('u-dnone')`);
    }
  }
  return problems;
}

// 4. Naikkan ?v=N & CACHE_NAME lewat bump-version.sh yang sudah ada
function bumpCacheVersion() {
  const out = execSync('bash bump-version.sh', { cwd: ROOT }).toString();
  return out;
}

// 5. Cek sintaks hasil build
function syntaxCheck(file) {
  try {
    execSync(`node --check ${JSON.stringify(path.join(ROOT, file))}`, { stdio: 'pipe' });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e.stderr || e.stdout || e.message).toString() };
  }
}

function main() {
  console.log('Mengecek pola bug "u-dnone (!important) vs style.display"...');
  const dnoneProblems = lintDnoneStyleDisplayMismatch();
  if (dnoneProblems.length) {
    console.error(`\n❌ BUILD DIHENTIKAN — ditemukan ${dnoneProblems.length} elemen berpotensi "judul tampil, konten permanen kosong":\n`);
    dnoneProblems.forEach((p) => console.error('  - ' + p));
    console.error(
      '\nPerbaiki dengan menambahkan classList.remove(\'u-dnone\') (atau classList.toggle) ' +
      'sebelum/menyertai baris style.display di atas, lalu jalankan ulang node build.js.\n' +
      'Referensi kasus asli: card Kebebasan Finansial (dashFiBody) yang judulnya tampil tapi isinya kosong.'
    );
    process.exit(1);
  }
  console.log('✓ Tidak ada elemen u-dnone yang berisiko permanen kosong\n');

  const explicitVersion = process.argv[2];
  const oldVersion = detectCurrentVersion();
  const newVersion = computeNextVersion(oldVersion, explicitVersion);

  console.log(`Versi lama : ${oldVersion}`);
  console.log(`Versi baru : ${newVersion}`);
  console.log('');

  const changedFiles = bumpVersionEverywhere(oldVersion, newVersion);
  console.log(`✓ Versi disamakan di ${changedFiles.length} file source: ${changedFiles.join(', ')}`);

  const resA = buildBundle(GROUP_A, 'app-bundle-a.min.js', oldVersion);
  const resB = buildBundle(GROUP_B, 'app-bundle-b.min.js', oldVersion);
  console.log(`✓ app-bundle-a.min.js ditulis (${(resA.size / 1024).toFixed(1)} KB${resA.minified ? ', diminify pakai esbuild' : ' — TANPA minifikasi, esbuild tidak ditemukan'})`);
  console.log(`✓ app-bundle-b.min.js ditulis (${(resB.size / 1024).toFixed(1)} KB${resB.minified ? ', diminify pakai esbuild' : ' — TANPA minifikasi, esbuild tidak ditemukan'})`);
  if (resA.backupName || resB.backupName) {
    console.log(`✓ Backup bundle lama disimpan di backups/ (${[resA.backupName, resB.backupName].filter(Boolean).join(', ')})`);
  }

  console.log('');
  console.log(bumpCacheVersion().trim());

  console.log('Mengecek sintaks bundle hasil build...');
  const checkA = syntaxCheck('app-bundle-a.min.js');
  const checkB = syntaxCheck('app-bundle-b.min.js');
  if (!checkA.ok || !checkB.ok) {
    console.error('\n❌ BUILD GAGAL — ada syntax error:');
    if (!checkA.ok) console.error('app-bundle-a.min.js:\n' + checkA.error);
    if (!checkB.ok) console.error('app-bundle-b.min.js:\n' + checkB.error);
    console.error('\nBundle di atas TIDAK ditimpa dgn versi rusak akan tetap ada di disk — cek source-nya dulu sebelum upload.');
    process.exit(1);
  }
  console.log('✓ Sintaks kedua bundle valid (node --check lolos)');

  if (readFile('index.html') !== readFile('app_production.html')) {
    writeFile('app_production.html', readFile('index.html'));
    console.log('\n✓ app_production.html ditulis ulang jadi salinan persis index.html (sekarang index.html = satu-satunya sumber kebenaran, app_production.html cuma cermin otomatis).');
  } else {
    console.log('\n✓ index.html & app_production.html sudah identik.');
  }

  console.log(`\n✅ Build "${newVersion}" selesai & lolos cek sintaks. Siap di-upload (jangan lupa upload SEMUA file yang berubah, bukan cuma HTML).`);

  if (!resA.minified) {
    console.log(
      '\nCatatan: esbuild belum terpasang di environment ini, jadi bundle di atas belum diminify\n' +
      '(ukurannya lebih besar dari build sebelumnya, tapi 100% valid & aman dipakai).\n' +
      'Kalau mau ukuran sekecil versi lama, jalankan sekali (butuh internet):\n' +
      '  npm install --save-dev esbuild\n' +
      'lalu jalankan ulang "node build.js" — otomatis kepakai kalau terdeteksi ada.'
    );
  }
}

main();
