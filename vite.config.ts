import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // Set the base path to relative so that assets load correctly on GitHub Pages
  base: './',
  plugins: [
    tailwindcss(),
    react()
  ],
})
