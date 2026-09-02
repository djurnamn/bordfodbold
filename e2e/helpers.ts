import { expect, type Page } from "@playwright/test";

export const pin = "1234";

/** Types the PIN into the pin input: focus the first cell, then the digits. */
export async function enterPin(page: Page, value: string = pin) {
  await page.getByLabel("Character 1 of 4").focus();
  await page.keyboard.type(value);
}

/**
 * Puts the tournament back to the seed through the admin's own reset, so a
 * test starts from the same data whichever store the app runs on: the local
 * store in this browser, or a shared Convex deployment.
 */
export async function resetTournament(page: Page) {
  await page.goto("/admin");
  await page.evaluate(() => {
    window.sessionStorage.clear();
  });
  await page.goto("/admin");
  await enterPin(page);
  await expect(page.getByRole("tab", { name: "Results" })).toBeVisible();
  await page.getByRole("tab", { name: "Settings" }).click();
  await page.getByRole("button", { name: "Reset to demo data" }).click();
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Signifly Autumn Open" })).toBeVisible();
  await page.getByRole("button", { name: "Lock" }).first().click();
  await expect(page.getByRole("heading", { name: "Enter the PIN" })).toBeVisible();
}
