import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "real.spec.ts",
  workers: 1,
  timeout: 60_000,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:5175",
    headless: true,
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "npm run dev:api",
      url: "http://127.0.0.1:3001/api/health",
      reuseExistingServer: false,
      timeout: 60_000,
      env: { MQTT_PERSIST_ENABLED: "false" },
    },
    {
      command: "npm run dev:web -- --port 5175",
      url: "http://127.0.0.1:5175",
      reuseExistingServer: false,
      timeout: 60_000,
      env: { VITE_DATA_SOURCE: "api" },
    },
  ],
});
