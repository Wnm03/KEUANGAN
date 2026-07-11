# Pre-Merge Lint Check — eslint.config.js

Sandbox Claude tidak ada akses internet, jadi `npm install` / `npm run lint`
tidak bisa dijalankan di sana. Validasi yang SUDAH dilakukan di sandbox
(tanpa eslint asli):

- `node --check eslint.config.js` — syntax OK
- `node --check scripts/collect-app-globals.js` — syntax OK
- `require('./eslint.config.js')` berhasil, hasilkan 3 config block sesuai
  schema flat config ESLint v9 (ignores / files+languageOptions+rules /
  files+languageOptions)
- `collectAppGlobals()` jalan tanpa error → 852 global app-specific +
  51 global browser = 903 total, semua value & key valid

Yang BELUM tervalidasi (butuh eslint asli): hasil lint sebenarnya
(no-undef, no-unused-vars, dll) di seluruh source.

## Jalankan sebelum merge (Node >= 20):

```bash
npm install
npm run lint
```

Kalau ada yang auto-fixable:
```bash
npm run lint:fix
```

Atau full check (lint + test + build):
```bash
npm run check
```

Aman merge kalau `npm run lint` exit code 0 (no error).
