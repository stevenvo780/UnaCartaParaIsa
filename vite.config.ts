import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@/assets': resolve(__dirname, 'public/assets'),
      '@/components': resolve(__dirname, 'src/components'),
      '@/config': resolve(__dirname, 'src/config'),
      '@/constants': resolve(__dirname, 'src/constants'),
      '@/utils': resolve(__dirname, 'src/utils'),
      '@/types': resolve(__dirname, 'src/types'),
      '@/scenes': resolve(__dirname, 'src/scenes'),
      '@/entities': resolve(__dirname, 'src/entities'),
      '@/systems': resolve(__dirname, 'src/systems'),
    },
  },
  define: {
    'typeof CANVAS_RENDERER': JSON.stringify(true),
    'typeof WEBGL_RENDERER': JSON.stringify(true),
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    open: false,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser'],
        },
      },
    },
  },
});
