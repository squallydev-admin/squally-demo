import { test, expect } from "@playwright/test";

// ATTEMPT GATE - a helper for .github/workflows/matrix-scenarios.yml, not part
// of the regular suite: playwright.config.ts ignores this file unless
// ATTEMPT_GATE=1.
//
// It fails on the first attempt of a workflow run and passes on every later
// one, so GitHub's "Re-run failed jobs" turns the job green. Playwright's own
// retry does not help: both tries of attempt 1 see GITHUB_RUN_ATTEMPT=1.
test("attempt gate: fails on the first attempt of a workflow run", () => {
  const attempt = process.env.GITHUB_RUN_ATTEMPT ?? "1";
  expect(attempt, "fails on attempt 1 on purpose - use Re-run failed jobs").not.toBe("1");
});
