import { test, expect } from "@playwright/test";
import { waitForEmailVerificationToken } from "./utils/db";

function uniqueEmail() {
  const stamp = Date.now();
  return `e2e+${stamp}@example.com`;
}

test.use({ storageState: { cookies: [], origins: [] } });

test("signup, verify, login, create note", async ({ page }) => {
  const email = uniqueEmail();
  const password = "Password123!";
  const title = `E2E Note ${Date.now()}`;
  const content = "Created by Playwright";

  await page.goto("/signup");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign up" }).click();

  await expect(page.getByText("Signup succeeded")).toBeVisible();

  const token = await waitForEmailVerificationToken(email);
  await page.goto(`/verify-email?token=${token}`);
  await expect(page.getByText("Email verified. You can login now.")).toBeVisible();

  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Login" }).click();

  await expect(page.getByRole("button", { name: "Add note" })).toBeVisible();

  await page.getByRole("button", { name: "Add note" }).click();
  await page.getByLabel("Title").fill(title);
  await page.getByLabel("Content").fill(content);
  await page.getByRole("button", { name: "Create" }).click();

  await expect(page.getByText(title)).toBeVisible();
  await expect(page.getByText(content)).toBeVisible();

  await page.getByRole("button", { name: "Account menu" }).click();
  await page.getByRole("menuitem", { name: "Logout" }).click();
  await expect(page.getByRole("button", { name: "Login" })).toBeVisible();
});
