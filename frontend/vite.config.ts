// frontend/vite.config.js

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],

  // Sua configuração de proxy que já estava funcionando
  server: {
    proxy: {
      '/news': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/news/, '/news')
      }
    }
  },
  
  // Configuração de alias corrigida
  resolve: {
    alias: {
      // Esta forma de usar path.resolve é mais robusta e evita o erro do '__dirname'
      "@": path.resolve("./src"),
    },
  },
});
