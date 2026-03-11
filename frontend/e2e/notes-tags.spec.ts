import { test, expect } from "@playwright/test";

test("manage note tags and edit note", async ({ page }) => {
  const title = `E2E Note ${Date.now()}`;
  const updatedTitle = `${title} Updated`;
  const content = "Tag management via Playwright";
  const tagName = `tag-${Date.now()}`;
  const renamedTag = `${tagName}-renamed`;

  await page.goto("/notes");
  await expect(page.getByRole("button", { name: "Add note" })).toBeVisible();

  await page.getByRole("button", { name: "Add note" }).click();
  await page.getByLabel("Title").fill(title);
  await page.getByLabel("Content").fill(content);
  await page.getByRole("button", { name: "Create" }).click();

  await expect(page.getByText(title)).toBeVisible();

  const noteCard = page.getByRole("heading", { name: title }).locator("..").locator("..");
  await noteCard.getByPlaceholder("Add tags...").fill(tagName);
  await noteCard.getByPlaceholder("Add tags...").press("Enter");
  await expect(page.getByText(tagName)).toBeVisible();

  await page.getByRole("button", { name: "Manage tags" }).click();
  const dialog = page.getByRole("dialog", { name: "Manage tags" });
  const tagRow = dialog.locator("li", { hasText: tagName });
  await tagRow.getByRole("button", { name: "Rename tag" }).click();
  await dialog.locator(`input[value="${tagName}"]`).fill(renamedTag);
  await dialog.getByRole("button", { name: "Confirm rename" }).click();
  await expect(dialog.locator("li", { hasText: renamedTag }).first()).toBeVisible();
  await dialog.getByRole("button", { name: "Close" }).click();

  const sidebar = page.getByRole("heading", { name: "Tags" }).locator("..").locator("..");
  const tagButton = sidebar.getByRole("button", { name: renamedTag, exact: true });
  await expect(tagButton).toBeVisible();
  await tagButton.click();
  await expect(page.getByText(title)).toBeVisible();

  await noteCard.getByRole("button", { name: "Edit note" }).click();
  await page.getByLabel("Title").fill(updatedTitle);
  await page.getByRole("button", { name: "Save" }).click();

  await expect(page.getByText(updatedTitle)).toBeVisible();

  const updatedCard = page.getByRole("heading", { name: updatedTitle }).locator("..").locator("..");
  await updatedCard.getByRole("button", { name: "Delete note" }).click();
  await page.getByRole("dialog", { name: "Delete note?" }).getByRole("button", { name: "Delete" }).click();

  await expect(page.getByText(updatedTitle)).toHaveCount(0);
  await expect(page.getByText(/No notes/)).toBeVisible();
});
