import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
    plugins: [svelte()],
    server: {
        proxy: {
            // Toda petición a /api se redirige a tu backend de Express
            '/api': 'http://localhost:8082' 
        }
    }
});