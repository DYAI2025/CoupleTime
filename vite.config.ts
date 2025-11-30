import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Use relative asset paths so the app works on GitHub Pages (project subpath)
  // and on the configured custom domain without broken links.
  base: './',
  plugins: [react()],
})
