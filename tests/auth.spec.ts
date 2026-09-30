import { expect, test } from "@playwright/test";
import { logIn } from "./helpers";

test("the demo user can log in", async ({ page }) => {
  await logIn(page);
  await expect(page.getByRole("heading", { name: "Order history" })).toBeVisible();
  await expect(page.getByTestId("signed-in")).toHaveText("Signed in as demo");
});

test("a wrong password is rejected", async ({ page }) => {
  await logIn(page, "wrong");
  await expect(page.getByRole("alert")).toHaveText("Wrong username or password.");
  await expect(page).toHaveURL(/#\/login$/);
});

test("order history requires login", async ({ page }) => {
  await page.goto("/#/orders");
  await expect(page).toHaveURL(/#\/login$/);
  await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
});

test("logging out signs the user out", async ({ page }) => {
  await logIn(page);
  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page.getByRole("link", { name: "Log in" })).toBeVisible();
  await page.goto("/#/orders");
  await expect(page).toHaveURL(/#\/login$/);
});
