# squally-demo

A tiny web shop and its own Playwright suite, run in GitHub Actions, whose only
job is to feed **realistic, messy test data** into
[Squally](https://app.squally.dev): passes, flaky tests, one real failure, a
skipped test, an expected failure and a slow test.

The app is deliberately plain: Vite + TypeScript, no framework, no backend.
All data lives in memory and `localStorage`.

- Product list with search and category filter
- Product detail
- Cart: add, change quantity, remove, total
- Checkout form with validation (required fields, email format, 5-digit
  postcode) and a confirmation page
- Login with a fixed demo user (`demo` / `demo123`) guarding the order history

## The deliberate mess

Everything that misbehaves on purpose is controlled in one file,
[`src/mess.ts`](src/mess.ts).

| What | Where | Effect on the suite |
|---|---|---|
| **Random delays**: today's deal banner, product reviews and the cart's delivery estimate appear after a random 0–3 s (`MAX_RANDOM_DELAY_MS`). | Product list, product detail, cart | Three tests wait only 2.5 s, so each fails on roughly one attempt in six. With a retry they usually pass: **flaky**. |
| **Unreliable feature**: the stock check on the product page fails on ~15% of page loads (`STOCK_FAILURE_RATE`) and logs a `console.error`. | Product detail | One test fails on ~15% of attempts: **flaky**. |
| **Real, permanent bug**: from 3 items on, the 10% multi-buy discount is taken twice, so the cart total is wrong (`MULTI_BUY_BUG`, used in `src/store.ts`). | Cart | "three items get the 10% multi-buy discount once" **fails every run**. |
| **Slow page**: the order history takes ~8 s to load (`SLOW_PAGE_MS`). | Order history | One `test.slow()` test takes ~10 s. |

Also in the suite:

- a `test.fail()` test on the same bug ("four items …"): Playwright expects
  it to fail and reports it as passing. Set `MULTI_BUY_BUG = false` and the
  real failure goes green while this test turns red, because its marker is out
  of date.
- a `test.skip()` test ("pays with PayPal"), for a feature that doesn't exist.

Because both flaky mechanisms are random, a flaky test sometimes fails its
retry too. That is part of the realism, not a broken setup.

## The stable branch is `master`

The default and stable branch of this repo is **`master`, on purpose**: it
checks that Squally never assumes a branch called `main`.

## CI

[`.github/workflows/tests.yml`](.github/workflows/tests.yml) runs on every push
to `master`, on pull requests, four times a day (05:17, 11:17, 17:17, 23:17
UTC) and by hand. Setup:

- a matrix over 3 shards (`--shard=1/3`, `2/3`, `3/3`), with `retries: 1` in
  CI. chromium and firefox are Playwright projects in `playwright.config.ts`,
  and `--shard` splits the tests of both browsers across the three shards.
  Playwright orders the tests by project (all chromium, then all firefox) and
  cuts that list into consecutive pieces, so shard 1 runs chromium, shard 3
  firefox, and only shard 2 mixes both.
- Node 22, because the reporter needs ≥ 22.19
- reporting to Squally with `SQUALLY_REPORT=1` and the ingest key from the
  repo secret `SQUALLY_INGEST_KEY`

Each workflow run is one Squally run made of its three shards: they share
`SQUALLY_CI_RUN_ID` (`<run id>-<run attempt>`). Pull requests from forks don't
get the secret, so they report nothing.

## Run locally

```bash
npm ci
npx playwright install chromium firefox
npx playwright test                       # both browsers, nothing is sent
npx playwright test --project=chromium    # one browser
npx playwright test --retries=1           # see flaky tests as "flaky"
```

`npx playwright test` builds the app and starts `vite preview` on port 4173
itself (the `webServer` block in `playwright.config.ts`). To look at the shop:
`npm run dev`. Local runs use at most 2 workers: on Windows, more parallel
Chromium instances hung their page loads (see the comment in the config).

### Sending a local run to Squally

Reporting is off unless `SQUALLY_REPORT=1` is set. The reporter reads the URL
and the project's **ingest key** from the environment, never from
`playwright.config.ts`:

```bash
SQUALLY_REPORT=1 \
SQUALLY_INGEST_URL=https://app.squally.dev \
SQUALLY_INGEST_KEY=<project ingest key> \
npx playwright test
```

PowerShell:

```powershell
$env:SQUALLY_REPORT = "1"
$env:SQUALLY_INGEST_URL = "https://app.squally.dev"
$env:SQUALLY_INGEST_KEY = "<project ingest key>"
npx playwright test
```

A run outside CI is a **local run**: Squally shows it in the runs list with a
"Local" marker and counts it nowhere else. That is what this is for. Don't set
`CI=true` locally: the reporter would then treat the run as a CI run.

S4 PR comment test
