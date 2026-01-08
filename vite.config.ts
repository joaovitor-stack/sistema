import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['icone.ico', 'apple-touch-icon.png', 'maskable-icon.png'],
      manifest: {
        name: 'Escalas Max Tour',
        short_name: 'Max Tour',
        description: 'Sistema de Gestão de Escalas Max Tour',
        theme_color: '#16a34a',
        background_color: '#f0fdf4',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'icone-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icone-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icone-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
    host: true, // Importante para o PWA funcionar via IP na rede local
    proxy: {
      '/api': {
        target: 'http://localhost:3333',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})