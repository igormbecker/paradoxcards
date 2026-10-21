import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  use: { baseURL: "http://127.0.0.1:5174", headless: true },
  webServer: {
    command:
      "node infra/scripts/prepare-e2e.mjs && node infra/scripts/start-e2e.mjs",
    url: "http://127.0.0.1:5174",
    reuseExistingServer: false,
    timeout: 30000,
  },
});
