import { expect, test } from "@playwright/test";
import { addFromList } from "./helpers";

test("an empty cart says so", async ({ page }) => {
  await page.goto("/#/cart");
  await expect(page.getByTestId("cart-empty")).toHaveText("Your cart is empty.");
});

test("an added product shows in the cart", async ({ page }) => {
  await page.goto("/");
  await addFromList(page, "Espresso Beans");
  await expect(page.getByTestId("cart-count")).toHaveText("1");
  await page.goto("/#/cart");
  await expect(page.getByTestId("cart-line")).toHaveCount(1);
  await expect(page.getByTestId("total")).toHaveText("€12.90");
});

test("changing the quantity updates line total and total", async ({ page }) => {
  await page.goto("/");
  await addFromList(page, "Espresso Beans");
  await page.goto("/#/cart");
  await page.getByLabel("Quantity for Espresso Beans").fill("2");
  await expect(page.getByTestId("line-total")).toHaveText("€25.80");
  await expect(page.getByTestId("total")).toHaveText("€25.80");
  await expect(page.getByTestId("cart-count")).toHaveText("2");
});

test("removing the only item empties the cart", async ({ page }) => {
  await page.goto("/");
  await addFromList(page, "Travel Mug");
  await page.goto("/#/cart");
  await page.getByRole("button", { name: "Remove" }).click();
  await expect(page.getByTestId("cart-empty")).toBeVisible();
  await expect(page.getByTestId("cart-count")).toHaveText("0");
});

test("two items add up without a discount", async ({ page }) => {
  await page.goto("/");
  await addFromList(page, "Espresso Beans");
  await addFromList(page, "Green Tea");
  await page.goto("/#/cart");
  await expect(page.getByTestId("subtotal")).toHaveText("€19.40");
  await expect(page.getByTestId("discount")).toBeHidden();
  await expect(page.getByTestId("total")).toHaveText("€19.40");
});

test("the cart survives a reload", async ({ page }) => {
  await page.goto("/");
  await addFromList(page, "Chai Spice");
  await page.reload();
  await expect(page.getByTestId("cart-count")).toHaveText("1");
});

// THE REAL BUG (src/mess.ts, MULTI_BUY_BUG): from 3 items on, the 10% discount
// is taken twice. This test fails on every run until the bug is fixed.
test("three items get the 10% multi-buy discount once", async ({ page }) => {
  await page.goto("/");
  await addFromList(page, "Espresso Beans");
  await addFromList(page, "Green Tea");
  await addFromList(page, "Tea Infuser");
  await page.goto("/#/cart");
  await expect(page.getByTestId("subtotal")).toHaveText("€28.30");
  await expect(page.getByTestId("discount")).toHaveText("−€2.83");
  await expect(page.getByTestId("total")).toHaveText("€25.47");
});

// The same bug, marked as known: Playwright expects this test to fail and
// reports it as passing. Fix the bug and this test turns red - the marker is
// then out of date and should be removed.
test("four items get the 10% multi-buy discount once", async ({ page }) => {
  test.fail(true, "Known bug: multi-buy discount is taken twice (src/mess.ts)");
  await page.goto("/");
  for (let i = 0; i < 4; i++) await addFromList(page, "Green Tea");
  await page.goto("/#/cart");
  await expect(page.getByTestId("subtotal")).toHaveText("€26.00");
  await expect(page.getByTestId("total")).toHaveText("€23.40", { timeout: 2_000 });
});

// DELIBERATE MESS: the estimate arrives after a random 0–3 s (src/mess.ts), and
// this test waits only 2.5 s.
test("shows a delivery estimate", async ({ page }) => {
  await page.goto("/");
  await addFromList(page, "Earl Grey");
  await page.goto("/#/cart");
  await expect(page.getByTestId("delivery-estimate")).toHaveText("Estimated delivery: 2–3 working days", {
    timeout: 2_500,
  });
});
