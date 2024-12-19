import { sveltekit } from '@sveltejs/kit/vite'
import { svelteTesting } from '@testing-library/svelte/vite'
import { purgeCss } from 'vite-plugin-tailwind-purgecss'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  server: {
    host: true,
    port: 3000,
  },
  plugins: [sveltekit(), svelteTesting(), purgeCss()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest-setup.js'],
  },
})
