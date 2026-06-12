// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  worker: {
    format: 'es',
  },
  build: {
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          // Force .mjs assets to .js so Cloudflare serves them correctly
          if (assetInfo.name?.endsWith('.mjs')) {
            return 'assets/[name]-[hash].js'
          }
          return 'assets/[name]-[hash][extname]'
        }
      }
    }
  }
})