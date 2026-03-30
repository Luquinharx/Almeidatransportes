import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;

          if (id.includes("react") || id.includes("react-dom") || id.includes("scheduler")) {
            return "vendor-react";
          }
          if (id.includes("firebase/auth")) {
            return "vendor-firebase-auth";
          }
          if (id.includes("firebase/firestore")) {
            return "vendor-firebase-firestore";
          }
          if (id.includes("firebase/storage")) {
            return "vendor-firebase-storage";
          }
          if (id.includes("firebase")) {
            return "vendor-firebase-core";
          }
          if (id.includes("recharts") || id.includes("d3-")) {
            return "vendor-charts";
          }
          if (id.includes("@radix-ui")) {
            return "vendor-radix";
          }

          return "vendor";
        },
      },
    },
  },
}));
