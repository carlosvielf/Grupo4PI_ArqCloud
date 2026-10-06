import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 2,
  timeout: 30000,
  reporter: "list",
  use: { headless: true, trace: "retain-on-failure" },
  projects: [
    {
      name: "demo",
      testMatch: "demo.spec.ts",
      use: { baseURL: "http://127.0.0.1:5173" },
    },
    {
      name: "api",
      testMatch: "api.spec.ts",
      use: { baseURL: "http://127.0.0.1:5174" },
    },
  ],
  webServer: [
    {
      command: "npm run dev",
      url: "http://127.0.0.1:5173",
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "npm run dev -- --port 5174",
      url: "http://127.0.0.1:5174",
      reuseExistingServer: !process.env.CI,
      env: {
        VITE_DATA_SOURCE: "api",
        VITE_API_TALHOES_PATH: "/api/talhoes",
        VITE_API_IMAGENS_PATH: "/api/imagens",
        VITE_API_ALERTAS_PATH: "/api/alertas",
        VITE_API_LEITURAS_PATH: "/api/leituras",
        VITE_API_TELEMETRIA_PATH: "/api/telemetria",
      },
    },
  ],
});
