import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("lists all products", async ({ page }) => {
  // intentionally failing: S5 PR scenario
  await expect(page.getByTestId("product-card")).toHaveCount(13);
  await expect(page.getByTestId("result-count")).toHaveText("12 products");
});

test("search filters by name", async ({ page }) => {
  await page.getByPlaceholder("Search products").fill("espresso");
  await expect(page.getByTestId("product-card")).toHaveCount(1);
  await expect(page.getByRole("link", { name: "Espresso Beans" })).toBeVisible();
});

test("search ignores case", async ({ page }) => {
  await page.getByPlaceholder("Search products").fill("TEA");
  await expect(page.getByTestId("product-card")).toHaveCount(3);
});

test("search without a match shows the empty state", async ({ page }) => {
  await page.getByPlaceholder("Search products").fill("matcha");
  await expect(page.getByTestId("product-card")).toHaveCount(0);
  await expect(page.getByTestId("empty-state")).toBeVisible();
});

test("category filter shows only that category", async ({ page }) => {
  await page.getByLabel("Category").selectOption("Accessories");
  await expect(page.getByTestId("product-card")).toHaveCount(4);
  for (const card of await page.getByTestId("product-card").all()) {
    await expect(card).toContainText("Accessories");
  }
});

test("category and search combine", async ({ page }) => {
  await page.getByLabel("Category").selectOption("Tea");
  await page.getByPlaceholder("Search products").fill("tea");
  await expect(page.getByTestId("product-card")).toHaveCount(2);
});

test("clearing the search shows every product again", async ({ page }) => {
  const search = page.getByPlaceholder("Search products");
  await search.fill("mug");
  await expect(page.getByTestId("product-card")).toHaveCount(1);
  await search.fill("");
  await expect(page.getByTestId("product-card")).toHaveCount(12);
});

// DELIBERATE MESS: the banner appears after a random 0–3 s (src/mess.ts), and
// this test waits only 2.5 s - it fails on roughly one load in six.
test("shows today's deal", async ({ page }) => {
  await expect(page.getByTestId("deal-banner")).toBeVisible({ timeout: 2_500 });
});
