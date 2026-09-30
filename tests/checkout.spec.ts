import { expect, test, type Page } from "@playwright/test";
import { addFromList, fillCheckout } from "./helpers";

async function startCheckout(page: Page): Promise<void> {
  await page.goto("/");
  await addFromList(page, "Espresso Beans");
  await page.goto("/#/checkout");
  await expect(page.getByTestId("checkout-total")).toHaveText("€12.90");
}

test("checkout with an empty cart goes back to the cart", async ({ page }) => {
  await page.goto("/#/checkout");
  await expect(page).toHaveURL(/#\/cart$/);
  await expect(page.getByTestId("cart-empty")).toBeVisible();
});

test("every field is required", async ({ page }) => {
  await startCheckout(page);
  await page.getByRole("button", { name: "Place order" }).click();
  await expect(page.getByTestId("error-name")).toHaveText("Full name is required.");
  await expect(page.getByTestId("error-email")).toHaveText("Email is required.");
  await expect(page.getByTestId("error-street")).toHaveText("Street is required.");
  await expect(page.getByTestId("error-postcode")).toHaveText("Postcode is required.");
  await expect(page.getByTestId("error-city")).toHaveText("City is required.");
});

test("an invalid email is rejected", async ({ page }) => {
  await startCheckout(page);
  await fillCheckout(page, { Email: "erika.example.com" });
  await page.getByRole("button", { name: "Place order" }).click();
  await expect(page.getByTestId("error-email")).toHaveText("Enter a valid email address.");
  await expect(page).toHaveURL(/#\/checkout$/);
});

test("a postcode that is not 5 digits is rejected", async ({ page }) => {
  await startCheckout(page);
  await fillCheckout(page, { Postcode: "1011" });
  await page.getByRole("button", { name: "Place order" }).click();
  await expect(page.getByTestId("error-postcode")).toHaveText("Postcode must be 5 digits.");
});

test("placing an order shows the confirmation", async ({ page }) => {
  await startCheckout(page);
  await fillCheckout(page);
  await page.getByRole("button", { name: "Place order" }).click();
  await expect(page.getByRole("heading", { name: "Thank you for your order!" })).toBeVisible();
  await expect(page.getByTestId("order-id")).toHaveText(/^SQ-/);
  await expect(page.getByTestId("order-total")).toHaveText("€12.90");
});

test("the cart is empty after ordering", async ({ page }) => {
  await startCheckout(page);
  await fillCheckout(page);
  await page.getByRole("button", { name: "Place order" }).click();
  await expect(page.getByTestId("order-id")).toBeVisible();
  await expect(page.getByTestId("cart-count")).toHaveText("0");
});

test.skip("pays with PayPal", async ({ page }) => {
  // Not built yet: the shop has no payment step at all.
  await startCheckout(page);
  await page.getByRole("button", { name: "Pay with PayPal" }).click();
});
