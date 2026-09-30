import { expect, test } from "@playwright/test";

test("opens a product from the list", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Earl Grey" }).click();
  await expect(page).toHaveURL(/#\/product\/earl-grey$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Earl Grey");
});

test("shows price and description", async ({ page }) => {
  await page.goto("/#/product/milk-frother");
  await expect(page.getByTestId("price")).toHaveText("€32.00");
  await expect(page.getByTestId("description")).toHaveText("Handheld, battery powered.");
});

test("adds the chosen quantity to the cart", async ({ page }) => {
  await page.goto("/#/product/decaf-roast");
  await page.getByLabel("Quantity").fill("2");
  await page.getByRole("button", { name: "Add to cart" }).click();
  await expect(page.getByRole("status")).toHaveText("Added 2 to cart");
  await expect(page.getByTestId("cart-count")).toHaveText("2");
});

test("an unknown product shows not found", async ({ page }) => {
  await page.goto("/#/product/does-not-exist");
  await expect(page.getByRole("heading", { name: "Product not found" })).toBeVisible();
});

// DELIBERATE MESS: the stock check fails on ~15% of page loads (src/mess.ts).
test("stock check reports in stock", async ({ page }) => {
  await page.goto("/#/product/green-tea");
  await expect(page.getByTestId("stock")).toHaveText("In stock");
});

// DELIBERATE MESS: reviews arrive after a random 0–3 s (src/mess.ts), and this
// test waits only 2.5 s.
test("customer reviews load", async ({ page }) => {
  await page.goto("/#/product/espresso-beans");
  await expect(page.getByTestId("review-list")).toBeVisible({ timeout: 2_500 });
});
