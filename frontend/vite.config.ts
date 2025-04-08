import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // These aliases are needed for WalletConnect
      'pino': resolve(__dirname, './pino-mock.js'),
      'pino-pretty': resolve(__dirname, './pino-mock.js'),
      'stream': 'stream-browserify',
      'events': 'events',
      'buffer': 'buffer',
      'process': 'process/browser',
      'util': 'util',
    }
  },
  define: {
    'process.env': {},
    'global': 'window',
  },
  build: {
    rollupOptions: {
      external: ['pino-pretty', 'encoding'],
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  }
});
