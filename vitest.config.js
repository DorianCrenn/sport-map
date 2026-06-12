import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    testTimeout: 15000,
    exclude: ['**/node_modules/**', '**/e2e/**', '**/dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{js,jsx,ts,tsx}'],
      exclude: [
        'src/test/**',
        'src/data/**',
        'src/demo/**',
        'src/main.jsx',
        'src/assets/**',
        'src/**/*.d.ts',
      ],
      thresholds: {
        branches: 60,
        functions: 60,
        lines: 60,
      },
    },
  },
});
