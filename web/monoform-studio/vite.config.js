import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [react()],
  server: { host: '127.0.0.1' },
  preview: { host: '127.0.0.1' },
  // Keep the old dist in place and overwrite entries; our sync step replaces assets/index.html anyway,
  // and this avoids out-dir cleanup being blocked on locked or watched directories.
  build: { emptyOutDir: false },
})
