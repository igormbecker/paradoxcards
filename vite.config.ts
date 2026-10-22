import { defineConfig } from "vite";
import { buildVersion } from "./infra/version.mjs";
export default defineConfig({
  define: { __BUILD_VERSION__: JSON.stringify(buildVersion()) },
  server: {
    proxy: {
      "/api": {
        target: process.env.API_TARGET ?? "http://127.0.0.1:3002",
        changeOrigin: false,
      },
    },
  },
});
