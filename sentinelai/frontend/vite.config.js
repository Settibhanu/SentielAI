import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'sentinel-icon.svg'],
      manifest: {
        name: 'SentinelAI — Road Safety',
        short_name: 'SentinelAI',
        description: 'AI-powered road damage reporting and risk scoring',
        theme_color: '#1a6e3c',
        background_color: '#030712',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        // Cache map tiles (CacheFirst, max 500 entries)
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/[abc]\.tile\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles',
              expiration: { maxEntries: 500, maxAgeSeconds: 7 * 24 * 60 * 60 },
            },
          },
          // API responses (StaleWhileRevalidate)
          {
            urlPattern: /^http:\/\/localhost:8000\/api\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'api-cache', expiration: { maxEntries: 100 } },
          },
        ],
      },
    }),
  ],
  server: {
    port: 3000,
    proxy: {
      '/api': { target: 'http://localhost:8000', changeOrigin: true },
      '/uploads': { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
})
