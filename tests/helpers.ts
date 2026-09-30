import { expect, type Page } from "@playwright/test";

/** Adds a product from the product list, once per call. */
export async function addFromList(page: Page, name: string): Promise<void> {
  const card = page.getByTestId("product-card").filter({ has: page.getByRole("link", { name, exact: true }) });
  await card.getByRole("button", { name: "Add to cart" }).click();
}

/** Fills the checkout form with valid data, overridable per field. */
export async function fillCheckout(page: Page, overrides: Record<string, string> = {}): Promise<void> {
  const values: Record<string, string> = {
    "Full name": "Erika Mustermann",
    Email: "erika@example.com",
    Street: "Hauptstraße 1",
    Postcode: "10115",
    City: "Berlin",
    ...overrides,
  };
  for (const [label, value] of Object.entries(values)) {
    await page.getByLabel(label, { exact: true }).fill(value);
  }
}

/** Puts one product in the cart and places an order; returns the order id. */
export async function placeOrder(page: Page): Promise<string> {
  await page.goto("/");
  await addFromList(page, "Filter Blend");
  await page.goto("/#/checkout");
  await fillCheckout(page);
  await page.getByRole("button", { name: "Place order" }).click();
  const orderId = page.getByTestId("order-id");
  await expect(orderId).toBeVisible();
  return (await orderId.textContent())!;
}

export async function logIn(page: Page, password = "demo123"): Promise<void> {
  await page.goto("/#/login");
  await page.getByLabel("Username").fill("demo");
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
}
