import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  rollupOptions: {
      // This tells Vite: "If you see this path, don't look for it 
      // on the hard drive and don't try to bundle it."
      external: ['./address.js'],
    },
})
