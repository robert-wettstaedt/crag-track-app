import { purgeCss } from 'vite-plugin-tailwind-purgecss'
import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    host: true,
    port: 3000,
  },
  plugins: [sveltekit(), purgeCss()],
})
