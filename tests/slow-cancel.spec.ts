import { test } from "@playwright/test";

// SLOW CANCEL - a helper for tests.yml's "slow" input (Run workflow → slow),
// not part of the regular suite: playwright.config.ts ignores this file
// unless SLOW_CANCEL=1, so the scheduled run never sees it.
//
// The suite finishes in about 30 seconds, too fast to press "Cancel workflow"
// while a shard still runs (Tests #87, 27.10.2026: the cancel arrived after
// the last test, the "Mark Squally run cancelled" step was skipped). This test
// holds its shard for about 3 minutes, so a cancel lands mid-run. Chromium
// only: one waiting test is enough.
test("slow cancel: waits about 3 minutes so the run can be cancelled", async ({ browserName }) => {
  test.skip(browserName !== "chromium", "one waiting test is enough");
  test.setTimeout(5 * 60_000);
  await new Promise((resolve) => setTimeout(resolve, 3 * 60_000));
});
