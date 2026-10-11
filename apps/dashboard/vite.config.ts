import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'node:path';
import vue from '@vitejs/plugin-vue';

export default defineConfig(({ mode }) => {
  const projectRoot = resolve(process.cwd(), '../..');
  const apiTarget = loadEnv(mode, projectRoot, '').API_PROXY_TARGET || 'http://127.0.0.1:3000';
  return {
    envDir: projectRoot,
    plugins: [vue()],
    server: {
      proxy: { '/api': apiTarget, '/health': apiTarget }
    }
  };
});
