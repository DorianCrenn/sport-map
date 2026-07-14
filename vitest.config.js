import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    testTimeout: 15000,
    pool: 'forks',
    poolOptions: {
      forks: {
        maxForks: 4,
        minForks: 1,
      },
    },
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
      // Plancher-cliquet : fixé juste sous la couverture réelle actuelle
      // (lignes ~37% / fonctions ~27% / branches ~24%). Empêche toute
      // régression sous ce niveau ; à remonter au fur et à mesure que la
      // couverture progresse. Le 60% initial était aspirationnel et non tenu.
      thresholds: {
        branches: 22,
        functions: 25,
        lines: 35,
      },
    },
  },
});
