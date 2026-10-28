import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './',
  optimizeDeps: {
    exclude: ['@imgly/background-removal'],
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Image Shrink — Local Resize & Compress',
        short_name: 'Image Shrink',
        description: 'Resize and compress images in your browser.',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        icons: [{ src: '/favicon.svg', sizes: '192x192', type: 'image/svg+xml' }],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,ico,svg,woff2}'] },
    }),
  ],
  test: { include: ['tests/**/*.test.ts'] },
})
