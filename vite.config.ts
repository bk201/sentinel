/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // Base path for GitHub Pages deployment
  // Use repository name as base when deployed to GitHub Pages
  // For custom domain or root deployment, this should be '/'
  base: process.env.GITHUB_PAGES === 'true' ? '/sentinel/' : '/',

  // PWA assets will be served from public directory
  publicDir: 'public',
  
  // Build configuration optimized for Node.js 22
  build: {
    target: 'esnext',
    outDir: 'dist',
    sourcemap: true,
  },
  
  // Modern JavaScript features with Node.js 22
  esbuild: {
    target: 'esnext',
  },

  // Define environment variables
  define: {
    __APP_REVISION__: JSON.stringify(process.env.VITE_APP_REVISION || 'dev'),
  },

  resolve: {
    alias: {
      '@': '/src',
      '@/types': '/src/types',
      '@/services': '/src/services',
      '@/components': '/src/components',
      '@/utils': '/src/utils',
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    exclude: ['tests/integration/**/*', 'tests/performance/**/*'],
    coverage: {
      reporter: ['text', 'json', 'html'],
  exclude: ['node_modules/', 'tests/', '*.config.{js,ts}', 'dist/'],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
})
