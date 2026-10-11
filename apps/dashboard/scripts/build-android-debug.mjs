import { execSync } from 'node:child_process';
import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const androidDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '../android');
const apkPath = resolve(androidDirectory, 'app/build/outputs/apk/debug/app-debug.apk');
const outputDirectory = resolve(androidDirectory, '../../../android');
const outputPath = resolve(outputDirectory, 'app-debug.apk');
const gradleCommand = process.platform === 'win32'
  ? 'gradlew.bat assembleDebug'
  : 'bash ./gradlew assembleDebug';

execSync(gradleCommand, { cwd: androidDirectory, stdio: 'inherit' });
await mkdir(outputDirectory, { recursive: true });
await copyFile(apkPath, outputPath);
console.log(`APK copied to ${outputPath}`);