/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  // Caminho relativo: funciona igual na raiz de um domínio, num subdiretório
  // do GitHub Pages ou aberto direto do disco.
  base: './',

  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: 'Motoon — o caderno da sua moto',
        short_name: 'Motoon',
        description:
          'Histórico, manutenção e custos da sua moto. Funciona sem internet e sem login.',
        lang: 'pt-BR',
        dir: 'ltr',
        theme_color: '#090B0F',
        background_color: '#090B0F',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        scope: './',
        categories: ['productivity', 'utilities'],
        icons: [
          { src: 'icone-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icone-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: 'icone-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // A fonte é a maior parte do peso; sem ela em cache o app abre
        // offline com fallback de sistema e "pula" quando a Inter chega.
        globPatterns: ['**/*.{js,css,html,woff2,png,svg,ico}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        // O chunk do jsPDF sozinho passa de 2 MB antes da compressão.
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
      devOptions: { enabled: false },
    }),
  ],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
