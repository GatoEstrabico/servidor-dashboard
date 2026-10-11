import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig(({ mode }) => {
  const apiTarget = loadEnv(mode, process.cwd(), '').API_PROXY_TARGET || 'http://127.0.0.1:3000';
  return {
    plugins: [vue()],
    server: {
      proxy: { '/api': apiTarget, '/health': apiTarget }
    }
  };
});
