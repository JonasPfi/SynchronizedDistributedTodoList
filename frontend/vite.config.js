import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: parseInt(process.env.VITE_FRONTEND_PORT) || 3000, // Use the VITE_ prefix for environment variables
  },
  define: {
    'process.env': {
      VITE_NGINX_URL: process.env.VITE_NGINX_URL,
    },
  },
});
