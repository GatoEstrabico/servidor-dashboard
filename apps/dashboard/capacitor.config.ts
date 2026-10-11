import type { CapacitorConfig } from '@capacitor/cli';
import { loadEnv } from 'vite';

const projectRoot = `${process.cwd()}/../..`;
const androidEnv = loadEnv('android', projectRoot, '');
const localDashboardUrl = process.env.CAPACITOR_SERVER_URL ?? androidEnv.CAPACITOR_SERVER_URL;

const config: CapacitorConfig = {
  appId: 'com.labmonitoramento.dashboard',
  appName: 'Monitoramento de Laboratorio',
  webDir: 'dist',
  server: localDashboardUrl
    ? { url: localDashboardUrl, cleartext: localDashboardUrl.startsWith('http://'), errorPath: 'offline.html' }
    : { androidScheme: 'https', errorPath: 'offline.html' }
};

export default config;