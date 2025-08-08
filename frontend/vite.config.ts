/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      'Content-Security-Policy': "default-src 'self'; connect-src 'self' http://localhost:8000; style-src 'self' 'unsafe-inline';"
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      reporter: ['text', 'html', 'json'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.test.ts',
        '**/*.test.tsx',
        'src/test/setup.ts'
      ],
      thresholds: {
        global: {
          branches: 50,
          functions: 50,
          lines: 50,
          statements: 50
        }
      },
      all: true
    }
  },
})
