// Everything that makes this shop misbehave ON PURPOSE lives in this file.
// Squally needs messy data to show anything: flaky tests, a real failure,
// a slow page. See "The deliberate mess" in README.md.

/** Elements marked as delayed appear after a random 0–3 s. */
export const MAX_RANDOM_DELAY_MS = 3000;

/** The stock check on the product page fails on about 15% of page loads. */
export const STOCK_FAILURE_RATE = 0.15;

/** The order history page takes this long to "load". */
export const SLOW_PAGE_MS = 8000;

/**
 * The real bug: from 3 items on, the 10% multi-buy discount is taken twice,
 * so the cart total is wrong. Set to false to "fix" it - the failing test
 * then passes and the test.fail() test turns red.
 */
export const MULTI_BUY_BUG = true;

export function randomDelay(): number {
  return Math.floor(Math.random() * (MAX_RANDOM_DELAY_MS + 1));
}

export function stockCheckFails(): boolean {
  return Math.random() < STOCK_FAILURE_RATE;
}
