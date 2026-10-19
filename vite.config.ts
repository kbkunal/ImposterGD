/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { localApiPlugin } from './src/server/localApiPlugin.ts'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), localApiPlugin()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
