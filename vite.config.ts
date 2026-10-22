import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
export default defineConfig({
  base: "/pulse-ui/",
  plugins: [react()],
  resolve: { dedupe: ['react', 'react-dom'], alias: { "@": path.resolve(__dirname, "./src") } },
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target: process.env.API_PROXY_TARGET || "http://127.0.0.1:8000",
      },
      "/sanctum": {
        target: process.env.API_PROXY_TARGET || "http://127.0.0.1:8000",
      },
    },
  },
});
