import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Get API URL from environment variable
const API_URL = process.env.VITE_API_URL || 'http://localhost:5558';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    port: 3000,
    host: true, // Allow external connections
    proxy: {
      // Proxy API requests to the backend server (useful for development to avoid CORS)
      '/api': {
        target: API_URL,
        changeOrigin: true,
        secure: false, // Set to true if using HTTPS
        rewrite: (path) => path, // Keep the path as-is
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Proxy error:', err);
          });
        },
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react'],
        },
      },
    },
  },
  // Environment variables are automatically available via import.meta.env.VITE_*
  // No need to define them manually
});
