import { defineConfig, devices } from "@playwright/test";
const base = process.env.VITE_BASE_PATH || "/9floor-fc-espresso-menu-v2/";
export default defineConfig({
  testDir: "./tests",
  testMatch: "pages.e2e.ts",
  timeout: 60000,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:4174" + base,
    ...devices["Desktop Chrome"],
  },
  webServer: {
    command: `npx vite preview --host 127.0.0.1 --port 4174 --base=${base}`,
    url: "http://127.0.0.1:4174" + base,
    reuseExistingServer: false,
  },
  projects: [
    {
      name: "pages-chromium",
      use: {
        browserName: "chromium",
        launchOptions: process.env.PLAYWRIGHT_EXECUTABLE_PATH
          ? {
              executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH,
              args: [
                "--no-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
              ],
            }
          : {},
      },
    },
  ],
});
