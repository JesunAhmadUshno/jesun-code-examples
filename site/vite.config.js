import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// The site reads ../*.jc, ../expected/*.out and ../README.md at build time, so every number on the page is generated, never typed.
export default defineConfig({
  base: '/jesun-code-examples/',
  plugins: [react()],
  server: { fs: { allow: ['..'] } },
});
