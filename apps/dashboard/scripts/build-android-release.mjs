import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';

const dashboardDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const projectRoot = resolve(dashboardDirectory, '../..');
const releaseEnv = loadEnv('production', projectRoot, '');
const apiBaseUrl = releaseEnv.VITE_API_BASE_URL?.trim();

if (!apiBaseUrl) {
  throw new Error('Configure VITE_API_BASE_URL em .env.production.local na raiz antes do build release.');
}

let parsedApiUrl;
try {
  parsedApiUrl = new URL(apiBaseUrl);
} catch {
  throw new Error('VITE_API_BASE_URL deve ser uma URL HTTPS valida.');
}
if (parsedApiUrl.protocol !== 'https:' || apiBaseUrl.includes('seu-dominio.com')) {
  throw new Error('VITE_API_BASE_URL deve apontar para a URL HTTPS publica real da API.');
}

const requiredVariables = [
  'ANDROID_KEYSTORE_PATH',
  'ANDROID_KEYSTORE_PASSWORD',
  'ANDROID_KEY_ALIAS',
  'ANDROID_KEY_PASSWORD'
];
const missingVariables = requiredVariables.filter((name) => !process.env[name]);

if (missingVariables.length) {
  throw new Error(`Variaveis de assinatura ausentes: ${missingVariables.join(', ')}`);
}

if (!existsSync(process.env.ANDROID_KEYSTORE_PATH)) {
  throw new Error('O arquivo indicado por ANDROID_KEYSTORE_PATH nao existe.');
}

const androidDirectory = resolve(dashboardDirectory, 'android');
const apkPath = resolve(androidDirectory, 'app/build/outputs/apk/release/app-release.apk');
const outputDirectory = resolve(androidDirectory, '../../../android');
const outputPath = resolve(outputDirectory, 'app-release.apk');
const gradleCommand = process.platform === 'win32'
  ? 'gradlew.bat assembleRelease'
  : 'bash ./gradlew assembleRelease';
const buildEnvironment = {
  ...process.env,
  VITE_API_BASE_URL: apiBaseUrl,
  CAPACITOR_SERVER_URL: ''
};

execSync('npm run android:sync', { cwd: dashboardDirectory, env: buildEnvironment, stdio: 'inherit' });
execSync(gradleCommand, { cwd: androidDirectory, env: buildEnvironment, stdio: 'inherit' });
await mkdir(outputDirectory, { recursive: true });
await copyFile(apkPath, outputPath);
console.log(`APK copied to ${outputPath}`);