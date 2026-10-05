import { defineConfig, devices, type ReporterDescription } from "@playwright/test";

const isCI = !!process.env.CI;

// Results go to Squally only when asked: CI sets SQUALLY_REPORT=1, locally it
// is opt-in. The key is never a reporter option - squally-reporter reads
// SQUALLY_INGEST_URL and SQUALLY_INGEST_KEY from the environment itself (see
// its README's security note: json/blob reporters write options to disk).
const reporter: ReporterDescription[] = [["list"], ["html", { open: "never" }]];
if (process.env.SQUALLY_REPORT === "1") {
  reporter.push(["squally-reporter"]);
}

export default defineConfig({
  testDir: "./tests",
  // The attempt gate runs only in the matrix scenarios that ask for it
  // (.github/workflows/matrix-scenarios.yml); tests.yml never sees it.
  testIgnore: process.env.ATTEMPT_GATE === "1" ? [] : ["**/attempt-gate.spec.ts"],
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  // Locally at most 2 workers: on the Windows dev machine, parallel Chromium
  // instances hang page loads (requests never answered, while the server
  // answers curl fine) - often at 6 workers, still now and then at 3; the same
  // hang squally-e2e sees there. CI keeps Playwright's default (2 on GitHub's
  // Linux runners).
  workers: isCI ? undefined : 2,
  reporter,
  use: {
    baseURL: "http://localhost:4173",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
  ],
  webServer: {
    command: "npm run build && npm run preview",
    url: "http://localhost:4173",
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
});
