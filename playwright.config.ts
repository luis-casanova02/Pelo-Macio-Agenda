import { defineConfig, devices } from "@playwright/test";
import { MOCK_URL } from "./e2e/support/mock-supabase";

// Modos:  npm run test:e2e        → app local + Supabase REAL (precisa do .env)
//         npm run test:mock       → app local + back-end simulado (sem internet/banco)
//         BASE_URL=https://pelo-macio-agenda.vercel.app npm run test:e2e → site publicado (banco real)
const MOCK = !!process.env.MOCK;
const PORT = MOCK ? 5199 : 5173;
const baseURL = process.env.BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "e2e",
  timeout: 30_000,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL, trace: "retain-on-failure", screenshot: "only-on-failure",
    launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH || undefined },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.BASE_URL ? undefined : {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: baseURL, reuseExistingServer: !MOCK, timeout: 60_000,
    env: MOCK ? { VITE_SUPABASE_URL: MOCK_URL, VITE_SUPABASE_ANON_KEY: "mock-key" } : {},
  },
});
