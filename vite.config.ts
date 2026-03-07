import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8081,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.png", "robots.txt"],
      manifest: {
        name: "Life Switch",
        short_name: "Life Switch",
        description: "Protégez votre héritage numérique.",
        theme_color: "#10B981",
        background_color: "#0a0a0a",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          { src: "/favicon.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
          { src: "/favicon.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            // Cache Firebase Auth + Firestore API calls
            urlPattern: /^https:\/\/.*\.googleapis\.com\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "firebase-api-cache",
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 },
            },
          },
          {
            // Cache Firebase Storage (images/videos)
            urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "firebase-storage-cache",
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
          {
            // App shell — serve from cache, update in background
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          'vendor-ui': ['lucide-react', 'framer-motion', 'clsx', 'tailwind-merge'],
        }
      }
    }
  }
}));
