/**
 * switch-env.cjs  —  Sentra IntiGizi (Supplier Portal)
 * Tool untuk berpindah antara lingkungan LOKAL dan DEPLOY (PRODUKSI) secara otomatis.
 *
 * Penggunaan:
 *   node switch-env.cjs local                        -> Beralih ke konfigurasi lokal
 *   node switch-env.cjs deploy                       -> Beralih ke konfigurasi produksi/deploy default & jalankan build
 *   node switch-env.cjs deploy [custom-api-domain]   -> Beralih ke konfigurasi produksi dengan domain API kustom & jalankan build
 *
 * Contoh:
 *   node switch-env.cjs deploy api-supplier.custom.com
 *
 * File yang dimodifikasi:
 *   1. ../intigizi-supplier-api/.env             -> Konfigurasi backend API Sentra IntiGizi
 *   2. .env.development                          -> URL API untuk mode development Vite
 *   3. .env.production                           -> URL API untuk mode production Vite
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const target = process.argv[2];
let customDomainInput = process.argv[3];

if (target !== 'local' && target !== 'deploy') {
  console.log('\x1b[31m%s\x1b[0m', 'Error: Argumen tidak valid. Gunakan "local" atau "deploy".');
  console.log('Contoh: node switch-env.cjs local');
  process.exit(1);
}

// --- Path Konfigurasi ---
const supplierApiEnvPath  = path.join(__dirname, '../intigizi-supplier-api/.env');
const coreDevEnvPath      = path.join(__dirname, '.env.development');
const coreProdEnvPath     = path.join(__dirname, '.env.production');

// --- Default Deploy Config ---
let deployApiUrl      = 'https://api-supplier.intigizi.ksphan.id';
let deployOriginDomain = 'supplier.intigizi.ksphan.id';

// Jika ada domain kustom dari user, bersihkan lalu pakai
if (target === 'deploy' && customDomainInput) {
  let cleanDomain = customDomainInput.trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '');
  deployApiUrl       = `https://${cleanDomain}`;
  deployOriginDomain = cleanDomain;
  console.log('\x1b[35m%s\x1b[0m', `Menggunakan domain API kustom untuk deploy: ${deployApiUrl}`);
}

console.log('\x1b[36m%s\x1b[0m', `Memulai proses perpindahan konfigurasi ke: ${target.toUpperCase()}...\n`);

try {
  // ================================================================
  // 1. Modifikasi .env pada intigizi-supplier-api
  // ================================================================
  if (fs.existsSync(supplierApiEnvPath)) {
    let apiEnvContent = fs.readFileSync(supplierApiEnvPath, 'utf8');

    if (target === 'local') {
      // Aktifkan lokal
      apiEnvContent = apiEnvContent.replace(/#\s*(APP_ENV="development")/g, '$1');
      apiEnvContent = apiEnvContent.replace(/#\s*(APP_URL=http:\/\/intigizi-supplier-api\.test)/g, '$1');
      apiEnvContent = apiEnvContent.replace(/#\s*(DB_HOST="localhost")/g, '$1');
      apiEnvContent = apiEnvContent.replace(/#\s*(DB_USER="root")/g, '$1');
      apiEnvContent = apiEnvContent.replace(/#\s*(DB_PASS="")/g, '$1');
      apiEnvContent = apiEnvContent.replace(/#\s*(DB_NAME="dbintigizi_marketplace")/g, '$1');
      apiEnvContent = apiEnvContent.replace(/#\s*(ALLOWED_ORIGINS="[^"]*local[^"]*")/g, '$1');
      apiEnvContent = apiEnvContent.replace(/#\s*(ALLOWED_ORIGINS="[^"]*intigizi-supplier[^"]*")/g, '$1');

      // Matikan deploy (hanya baris production, bukan nilai lokal)
      apiEnvContent = apiEnvContent.replace(/^(?!\s*#)\s*(APP_ENV="production")/gm, '# $1');
      apiEnvContent = apiEnvContent.replace(/^(?!\s*#)\s*(APP_URL=https:\/\/[^\s\n#]+)/gm, '# $1');
      // Matikan DB baris deploy: nilai yang BUKAN lokal default
      apiEnvContent = apiEnvContent.replace(/^(?!\s*#)\s*(DB_HOST="(?!localhost")[^\s\n#]+")/gm, '# $1');
      apiEnvContent = apiEnvContent.replace(/^(?!\s*#)\s*(DB_USER="(?!root")[^\s\n#]+")/gm, '# $1');
      apiEnvContent = apiEnvContent.replace(/^(?!\s*#)\s*(DB_PASS="[^"]+[^\s\n#]+")/gm, '# $1');
      apiEnvContent = apiEnvContent.replace(/^(?!\s*#)\s*(DB_NAME="(?!dbintigizi_marketplace")[^\s\n#]+")/gm, '# $1');
      apiEnvContent = apiEnvContent.replace(/^(?!\s*#)\s*(ALLOWED_ORIGINS="https:\/\/[^\s\n#]+)/gm, '# $1');

    } else {
      // Aktifkan deploy — update nilai URL & CORS terlebih dahulu

      // APP_URL
      const appUrlRegex = /#?\s*(APP_URL=)https:\/\/[^\s\n#]+/g;
      if (appUrlRegex.test(apiEnvContent)) {
        apiEnvContent = apiEnvContent.replace(/#?\s*(APP_URL=)https:\/\/[^\s\n#]+/g, `$1${deployApiUrl}`);
      }

      // ALLOWED_ORIGINS
      const allowedRegex = /#?\s*(ALLOWED_ORIGINS=")https:\/\/[^\s\n#]+/g;
      if (allowedRegex.test(apiEnvContent)) {
        apiEnvContent = apiEnvContent.replace(/#?\s*(ALLOWED_ORIGINS=")https:\/\/[^\s\n#]+/g,
          `$1${deployApiUrl},https://www.${deployOriginDomain}, *"`);
      }

      // Aktifkan baris deploy
      apiEnvContent = apiEnvContent.replace(/#\s*(APP_ENV="production")/g, '$1');
      apiEnvContent = apiEnvContent.replace(/#\s*(APP_URL=https:\/\/[^\s\n#]+)/g, '$1');
      apiEnvContent = apiEnvContent.replace(/#\s*(DB_HOST="[^\s\n#]+")/g, '$1');
      apiEnvContent = apiEnvContent.replace(/#\s*(DB_USER="[^\s\n#]+")/g, '$1');
      apiEnvContent = apiEnvContent.replace(/#\s*(DB_PASS="[^\s\n#]*")/g, '$1');
      apiEnvContent = apiEnvContent.replace(/#\s*(DB_NAME="[^\s\n#]+")/g, '$1');
      apiEnvContent = apiEnvContent.replace(/#\s*(ALLOWED_ORIGINS="https:\/\/[^\s\n#]+)/g, '$1');

      // Matikan lokal
      apiEnvContent = apiEnvContent.replace(/^(?!\s*#)\s*(APP_ENV="development")/gm, '# $1');
      apiEnvContent = apiEnvContent.replace(/^(?!\s*#)\s*(APP_URL=http:\/\/intigizi-supplier-api\.test)/gm, '# $1');
      apiEnvContent = apiEnvContent.replace(/^(?!\s*#)\s*(DB_HOST="localhost")/gm, '# $1');
      apiEnvContent = apiEnvContent.replace(/^(?!\s*#)\s*(DB_USER="root")/gm, '# $1');
      apiEnvContent = apiEnvContent.replace(/^(?!\s*#)\s*(DB_PASS="")/gm, '# $1');
      apiEnvContent = apiEnvContent.replace(/^(?!\s*#)\s*(DB_NAME="dbintigizi_marketplace")/gm, '# $1');
      apiEnvContent = apiEnvContent.replace(/^(?!\s*#)\s*(ALLOWED_ORIGINS="http:\/\/localhost:5174[^"]*")/gm, '# $1');
      apiEnvContent = apiEnvContent.replace(/^(?!\s*#)\s*(ALLOWED_ORIGINS="http:\/\/intigizi-supplier[^"]*")/gm, '# $1');
    }

    fs.writeFileSync(supplierApiEnvPath, apiEnvContent, 'utf8');
    console.log('\x1b[32m%s\x1b[0m', '✔ Konfigurasi Supplier API .env berhasil diperbarui.');
  } else {
    console.log('\x1b[33m%s\x1b[0m', '⚠ File .env Supplier API tidak ditemukan. Melewati langkah ini.');
  }

  // ================================================================
  // 2. Modifikasi .env.development pada intigizi-supplier-core
  // ================================================================
  if (fs.existsSync(coreDevEnvPath)) {
    let devEnvContent = fs.readFileSync(coreDevEnvPath, 'utf8');

    if (target === 'local') {
      devEnvContent = devEnvContent.replace(/#\s*(VITE_API_URL=http:\/\/intigizi-supplier-api\.test\/app)/g, '$1');
      devEnvContent = devEnvContent.replace(/^(VITE_API_URL=https:\/\/[^\s\n#]+)/gm, '# $1');
    } else {
      const deployTargetUrl = `${deployApiUrl}/app`;
      devEnvContent = devEnvContent.replace(/#?\s*(VITE_API_URL=https:\/\/[^\s\n#]+)/g, `VITE_API_URL=${deployTargetUrl}`);
      devEnvContent = devEnvContent.replace(/^(VITE_API_URL=http:\/\/intigizi-supplier-api\.test\/app)/gm, '# $1');
    }

    fs.writeFileSync(coreDevEnvPath, devEnvContent, 'utf8');
    console.log('\x1b[32m%s\x1b[0m', '✔ Konfigurasi Frontend .env.development berhasil diperbarui.');
  } else {
    console.log('\x1b[33m%s\x1b[0m', '⚠ File .env.development tidak ditemukan. Melewati langkah ini.');
  }

  // ================================================================
  // 3. Modifikasi .env.production pada intigizi-supplier-core
  // ================================================================
  if (fs.existsSync(coreProdEnvPath)) {
    let prodEnvContent = fs.readFileSync(coreProdEnvPath, 'utf8');

    if (target === 'local') {
      prodEnvContent = prodEnvContent.replace(/#\s*(VITE_API_URL=http:\/\/intigizi-supplier-api\.test\/app)/g, '$1');
      prodEnvContent = prodEnvContent.replace(/^(VITE_API_URL=https:\/\/[^\s\n#]+)/gm, '# $1');
    } else {
      const deployTargetUrl = `${deployApiUrl}/app`;
      prodEnvContent = prodEnvContent.replace(/#?\s*(VITE_API_URL=https:\/\/[^\s\n#]+)/g, `VITE_API_URL=${deployTargetUrl}`);
      prodEnvContent = prodEnvContent.replace(/^(VITE_API_URL=http:\/\/intigizi-supplier-api\.test\/app)/gm, '# $1');
    }

    fs.writeFileSync(coreProdEnvPath, prodEnvContent, 'utf8');
    console.log('\x1b[32m%s\x1b[0m', '✔ Konfigurasi Frontend .env.production berhasil diperbarui.');
  } else {
    console.log('\x1b[33m%s\x1b[0m', '⚠ File .env.production tidak ditemukan. Melewati langkah ini.');
  }

  // ================================================================
  // 4. Jalankan build produksi otomatis
  // ================================================================
  console.log('\n\x1b[33m%s\x1b[0m', `Menjalankan build produksi Sentra IntiGizi (Vite build) untuk target: ${target.toUpperCase()}...`);
  try {
    execSync('npm run build', { stdio: 'inherit', shell: true });
    console.log('\n\x1b[32m%s\x1b[0m', '✔ Build produksi selesai dengan sukses!');
  } catch (buildError) {
    console.log('\x1b[31m%s\x1b[0m', '✘ Gagal menjalankan npm run build. Silakan jalankan secara manual.');
  }

  console.log('\n\x1b[42m%s\x1b[0m', ' PROSES SELESAI DENGAN SUKSES! ');

} catch (err) {
  console.log('\x1b[31m%s\x1b[0m', `Error terjadi selama perpindahan: ${err.message}`);
}
