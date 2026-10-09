import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig(({ mode }) => {
  const apiTarget = loadEnv(mode, process.cwd(), '').API_PROXY_TARGET || 'http://localhost:3000';
  return {
    plugins: [vue()],
    server: {
      proxy: { '/api': apiTarget, '/health': apiTarget }
    }
  };
});
