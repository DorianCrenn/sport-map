import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { createRequire } from 'module'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
const require = createRequire(import.meta.url)
const pkg = require('./package.json')

// Injecte un commentaire de build en tête du SW généré par VitePWA.
// Permet d'identifier en prod quelle version du SW est installée chez un utilisateur
// (visible dans DevTools > Application > Service Workers > Source).
// Doit s'exécuter APRÈS VitePWA (placé après dans le tableau plugins).
function swVersionPlugin() {
  return {
    name: 'sl-sw-version',
    apply: 'build',
    closeBundle: {
      order: 'post',
      handler() {
        const swPath = join('dist', 'sw.js')
        if (!existsSync(swPath)) return
        const buildId = `${pkg.version}+${Date.now()}`
        const header = `/* SportLink SW — build ${buildId} */\n`
        const src = readFileSync(swPath, 'utf8')
        if (!src.startsWith('/* SportLink')) {
          writeFileSync(swPath, header + src)
        }
      },
    },
  }
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // index.html gère déjà l'enregistrement manuel de /sw.js
      injectRegister: null,
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 300 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 31536000 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-static',
              expiration: { maxEntries: 20, maxAgeSeconds: 31536000 },
            },
          },
        ],
      },
    }),
    swVersionPlugin(),
  ],
  build: {
    // 800kB to accommodate the map chunk (Leaflet + layers = ~168kB gzip, loads lazily)
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      input: {
        main:  './index.html',
        club:  './club-page.html',
        event: './event-page.html',
      },
      output: {
        manualChunks(id) {
          // Leaflet + cluster → separate chunk (map lazy-loads only on MapPage)
          if (id.includes('leaflet') || id.includes('react-leaflet')) {
            return 'vendor-leaflet';
          }
          // Framer Motion → separate chunk (not needed on first paint)
          if (id.includes('framer-motion')) {
            return 'vendor-framer';
          }
          // Supabase client → separate chunk
          if (id.includes('@supabase')) {
            return 'vendor-supabase';
          }
          // React core (react, react-dom, react/jsx-runtime, scheduler)
          if (id.includes('node_modules/react') || id.includes('node_modules/scheduler')) {
            return 'vendor-react';
          }
          // Pages rarement visitées sur premier chargement
          if (id.includes('pages/MapPage'))     return 'page-map';
          if (id.includes('pages/FavorisPage')) return 'page-favoris';
          if (id.includes('pages/ClubsPage'))   return 'page-clubs';
          if (id.includes('pages/ProfilPage') || id.includes('pages/AuthPage')) return 'page-profil';
          // DemoApp + tout le dossier demo
          if (id.includes('/demo/'))            return 'demo';
          // Everything else in node_modules → shared vendor chunk
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
})
