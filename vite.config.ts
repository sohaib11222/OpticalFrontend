import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "");
  const base = process.env.VITE_APP_BASE_PATH || env.VITE_APP_BASE_PATH || "/pulse-ui/";
  if (!/^\/(?:[A-Za-z0-9_-]+\/)*$/.test(base)) {
    throw new Error("VITE_APP_BASE_PATH must be / or an absolute path ending with /, such as /pulse-ui/.");
  }
  // Explicit test-harness targets take priority over the developer's live target.
  const target = process.env.API_PROXY_TARGET || env.API_PROXY_TARGET || env.VITE_API_URL || "http://127.0.0.1:8000";
  const apiProxy = {
    target,
    changeOrigin: true,
    secure: true,
    // The browser talks to localhost; do not set the live domain on its cookie.
    cookieDomainRewrite: "",
  };
  return {
    base,
    plugins: [react()],
    resolve: { dedupe: ['react', 'react-dom'], alias: { "@": path.resolve(__dirname, "./src") } },
    server: {
      host: "127.0.0.1",
      port: 5173,
      strictPort: true,
      proxy: {
        "/api": apiProxy,
        "/sanctum": apiProxy,
      },
    },
  };
});
