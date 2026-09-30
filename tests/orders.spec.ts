import { expect, test } from "@playwright/test";
import { logIn, placeOrder } from "./helpers";

// DELIBERATE MESS: the order history page takes ~8 s (src/mess.ts).
test("order history lists a placed order", async ({ page }) => {
  test.slow();
  const orderId = await placeOrder(page);
  await logIn(page);
  await expect(page.getByTestId("orders-loading")).toBeVisible();
  await expect(page.getByTestId("order-row")).toContainText(orderId, { timeout: 15_000 });
});
