import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replace(/\\/g, '/')

          if (!normalizedId.includes('/node_modules/')) return undefined

          if (
            normalizedId.includes('/node_modules/react/') ||
            normalizedId.includes('/node_modules/react-dom/') ||
            normalizedId.includes('/node_modules/react-router/') ||
            normalizedId.includes('/node_modules/react-router-dom/') ||
            normalizedId.includes('/node_modules/@remix-run/router/')
          ) {
            return 'react-vendor'
          }

          if (
            normalizedId.includes('/node_modules/firebase/firestore') ||
            normalizedId.includes('/node_modules/firebase/firebase-firestore') ||
            normalizedId.includes('/node_modules/@firebase/firestore') ||
            normalizedId.includes('/node_modules/@firebase/webchannel-wrapper')
          ) {
            return 'firebase-firestore'
          }

          if (
            normalizedId.includes('/node_modules/firebase/auth') ||
            normalizedId.includes('/node_modules/firebase/firebase-auth') ||
            normalizedId.includes('/node_modules/@firebase/auth')
          ) {
            return 'firebase-auth'
          }

          if (
            normalizedId.includes('/node_modules/firebase/storage') ||
            normalizedId.includes('/node_modules/firebase/firebase-storage') ||
            normalizedId.includes('/node_modules/@firebase/storage')
          ) {
            return 'firebase-storage'
          }

          if (
            normalizedId.includes('/node_modules/firebase/') ||
            normalizedId.includes('/node_modules/@firebase/')
          ) {
            return 'firebase-core'
          }

          return undefined
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png', '404.html'],
      manifest: {
        name: 'Bokklubb',
        short_name: 'Bokklubb',
        description: 'Bokklubbens app för röster, omdömen och statistik',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#121312',
        background_color: '#F4F3F1',
        lang: 'sv',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.hostname.endsWith('googleapis.com') ||
              url.hostname.endsWith('firebaseio.com') ||
              url.hostname.endsWith('firebasestorage.googleapis.com') ||
              url.hostname.endsWith('cloudfunctions.net'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firebase-api',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ request }) =>
              ['style', 'script', 'worker', 'image', 'font'].includes(request.destination),
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-assets',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) => url.hostname === 'fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'node',
  },
})
