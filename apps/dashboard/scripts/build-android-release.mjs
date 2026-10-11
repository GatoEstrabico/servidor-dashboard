import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

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

const androidDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '../android');
const apkPath = resolve(androidDirectory, 'app/build/outputs/apk/release/app-release.apk');
const outputDirectory = resolve(androidDirectory, '../../../android');
const outputPath = resolve(outputDirectory, 'app-release.apk');
const gradleCommand = process.platform === 'win32'
  ? 'gradlew.bat assembleRelease'
  : 'bash ./gradlew assembleRelease';

execSync(gradleCommand, { cwd: androidDirectory, stdio: 'inherit' });
await mkdir(outputDirectory, { recursive: true });
await copyFile(apkPath, outputPath);
console.log(`APK copied to ${outputPath}`);