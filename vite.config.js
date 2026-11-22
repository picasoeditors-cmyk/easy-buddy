import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' makes every asset path relative, so the build works on
// https://<user>.github.io/<any-repo-name>/ without extra configuration.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1200,
  },
})
