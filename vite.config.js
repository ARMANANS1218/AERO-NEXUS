import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Dynamically set base path: production builds served under /UTC/99810035/, local dev at root
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isProd = mode === 'production';
  return {
    plugins: [react()],
    // Use /UTC/99810035/ base path for both production (Vercel) and development
    base: '/UTC/99810035/',
    server: {
      port: 5173,
      // host: '0.0.0.0'
    },
    define: {
      __APP_BUILD_MODE__: JSON.stringify(mode),
      __API_URL__: JSON.stringify(env.VITE_API_URL || 'http://localhost:5000'),
      // Explicitly expose Google Maps key as a build-time constant to avoid undefined in some environments
      __GOOGLE_MAPS_KEY__: JSON.stringify(env.VITE_GOOGLE_MAPS_KEY || '')
    }
  };
});