/**
 * switch-env.cjs  —  Sentra IntiGizi (Supplier Portal)
 * Membaca konfigurasi domain dari: ../intigizi.deploy.json
 */

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const target          = process.argv[2];
const customRootInput = process.argv[3];

if (target !== 'local' && target !== 'deploy') {
  console.log('\x1b[31m%s\x1b[0m', 'Error: Gunakan "local" atau "deploy".');
  process.exit(1);
}

// ── Baca konfigurasi terpusat ─────────────────────────────────────
const deployConfigPath = path.join(__dirname, '../intigizi.deploy.json');
let deployConfig = {};
if (fs.existsSync(deployConfigPath)) {
  deployConfig = JSON.parse(fs.readFileSync(deployConfigPath, 'utf8'));
} else {
  console.log('\x1b[33m%s\x1b[0m', '⚠ intigizi.deploy.json tidak ditemukan.');
}

if (target === 'deploy' && customRootInput) {
  const clean = customRootInput.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
  deployConfig.root_domain = clean;
  fs.writeFileSync(deployConfigPath, JSON.stringify(deployConfig, null, 2), 'utf8');
}

const rootDomain           = deployConfig.root_domain || 'intigizi.ksphan.id';
const services             = deployConfig.services    || {};
const deploySupplierApiUrl = `https://${services.supplier_api?.subdomain || 'api-supplier'}.${rootDomain}`;
const localSupplierApiUrl  = services.supplier_api?.local_url || 'http://intigizi-supplier-api.test';

// ── Path file ────────────────────────────────────────────────────
const supplierApiEnvPath  = path.join(__dirname, '../intigizi-supplier-api/.env');
const coreDevEnvPath      = path.join(__dirname, '.env.development');
const coreProdEnvPath     = path.join(__dirname, '.env.production');

console.log('\x1b[36m%s\x1b[0m', `\nMode: ${target.toUpperCase()} | Supplier API: ${target==='local' ? localSupplierApiUrl : deploySupplierApiUrl}\n`);

// Fungsi untuk mengganti nilai env secara flat (selalu mencocokkan key=)
function replaceEnvValue(content, key, value) {
  const lines = content.split('\n');
  let found = false;
  const result = lines.map(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith(key + '=')) {
      found = true;
      return `${key}=${value}`;
    }
    return line;
  });
  if (!found) {
    result.push(`${key}=${value}`);
  }
  return result.join('\n');
}

function updateEnvFile(filePath, label, updates) {
  if (!fs.existsSync(filePath)) {
    console.log('\x1b[33m%s\x1b[0m', `⚠ ${label} tidak ditemukan. Dilewati.`);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  for (const { key, value } of updates) {
    content = replaceEnvValue(content, key, value);
  }
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('\x1b[32m%s\x1b[0m', `✔ ${label} diperbarui.`);
}

const isLocal = target === 'local';

// 1. Update intigizi-supplier-api/.env
updateEnvFile(supplierApiEnvPath, 'intigizi-supplier-api/.env', [
  { key: 'APP_ENV',         value: isLocal ? '"development"' : '"production"' },
  { key: 'APP_URL',         value: isLocal ? localSupplierApiUrl : deploySupplierApiUrl },
  { key: 'ALLOWED_ORIGINS', value: isLocal ? `"http://localhost:5174,http://intigizi-supplier-core.test,http://intigizi-supplier-api.test, *"` : `"${deploySupplierApiUrl},https://www.${services.supplier_frontend?.subdomain || 'supplier'}.${rootDomain}, *"` }
]);

// 2. Update intigizi-supplier-core env files
const envFiles = [
  { path: coreDevEnvPath,  label: 'intigizi-supplier-core .env.development' },
  { path: coreProdEnvPath, label: 'intigizi-supplier-core .env.production'  }
];
for (const f of envFiles) {
  updateEnvFile(f.path, f.label, [
    { key: 'VITE_API_URL', value: isLocal ? `${localSupplierApiUrl}/app` : `${deploySupplierApiUrl}/app` }
  ]);
}

// 3. Build
console.log('\n\x1b[33m%s\x1b[0m', `Membangun Sentra IntiGizi...`);
try {
  execSync('npm run build', { stdio: 'inherit', shell: true });
} catch { console.log('Build Sentra gagal.'); }

console.log('\n\x1b[42m\x1b[30m%s\x1b[0m', ` SELESAI — MODE: ${target.toUpperCase()} `);
