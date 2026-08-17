import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    passWithNoTests: true
  },
  resolve: {
    alias: { '~': fileURLToPath(new URL('./app', import.meta.url)) }
  }
})
