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
  const editorDialog = page.getByTestId("note-editor-dialog");
  await expect(editorDialog).toBeVisible();
  await editorDialog.getByTestId("note-title-input").fill(title);
  await editorDialog.getByTestId("note-content-input").fill(content);
  await editorDialog.getByTestId("note-editor-submit").click();

  const noteCard = page.getByTestId("note-card").filter({ hasText: title });
  await expect(noteCard).toBeVisible();

  await noteCard.getByTestId("note-tag-input").fill(tagName);
  await noteCard.getByTestId("note-tag-input").press("Enter");
  await expect(noteCard.getByTestId("note-tag").filter({ hasText: tagName })).toBeVisible();

  await page.locator('[data-testid="tags-manage"]:visible').click();
  const dialog = page.locator('[data-testid="manage-tags-dialog"]:visible');
  const tagRow = dialog.locator(`[data-testid="tag-row"][data-tag-name="${tagName}"]`);
  await tagRow.locator('[data-testid="tag-rename"]').first().click({ force: true });
  await tagRow.locator('[data-testid="tag-edit-input"]').first().fill(renamedTag);
  await tagRow.locator('[data-testid="tag-rename-confirm"]').first().click();
  await expect(
    dialog.locator(`[data-testid="tag-row"][data-tag-name="${renamedTag}"]`).first(),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "Close" }).click();

  const sidebar = page.getByTestId("tags-sidenav");
  const tagButton = sidebar.getByRole("button", { name: renamedTag, exact: true });
  await expect(tagButton).toBeVisible();
  await tagButton.click();
  await expect(noteCard).toBeVisible();

  await noteCard.getByTestId("note-edit").click();
  const editDialog = page.getByTestId("note-editor-dialog");
  await expect(editDialog).toBeVisible();
  await editDialog.getByTestId("note-title-input").fill(updatedTitle);
  await editDialog.getByTestId("note-editor-submit").click();

  const updatedCard = page.getByTestId("note-card").filter({ hasText: updatedTitle });
  await expect(updatedCard).toBeVisible();

  await updatedCard.getByTestId("note-delete").click();
  await page.getByTestId("note-delete-dialog").getByTestId("note-delete-confirm").click();

  await expect(page.getByText(updatedTitle)).toHaveCount(0);
  await expect(page.getByText(/No notes/)).toBeVisible();
});
