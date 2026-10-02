import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    // En dev, les appels à /api sont transmis à l'API Express (port 3000).
    // Le navigateur croit parler au même serveur : pas de problème de CORS.
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  // Tests (Vitest) : une préparation commune à tous les fichiers de tests
  test: {
    setupFiles: ['./test/setup.js'],
  },
});
