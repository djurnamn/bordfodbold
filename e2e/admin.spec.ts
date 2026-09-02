import { expect, test, type Page } from "@playwright/test";

import { enterPin, resetTournament } from "./helpers";

const shots = process.env.E2E_SHOTS;
const shot = async (page: Page, name: string) => {
  if (shots) {
    await page.screenshot({ path: `${shots}/${name}.png`, fullPage: true });
  }
};

test.beforeEach(async ({ page }) => {
  await resetTournament(page);
});

test("a wrong PIN is refused, the right one opens the admin", async ({ page }) => {
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Enter the PIN" })).toBeVisible();
  await shot(page, "pin-gate");

  await enterPin(page, "0000");
  await expect(page.getByText("That is not the PIN.")).toBeVisible();
  await shot(page, "pin-gate-wrong");

  await enterPin(page, "1234");
  await expect(page.getByRole("tab", { name: "Results" })).toBeVisible();
  await shot(page, "admin-results");
});

test("a result entered in the admin shows on the board in another tab", async ({ page, context }) => {
  await page.goto("/admin");
  await enterPin(page, "1234");
  await expect(page.getByRole("tab", { name: "Results" })).toBeVisible();

  const board = await context.newPage();
  await board.goto("/");
  await expect(board.getByRole("heading", { name: "Signifly Autumn Open" })).toBeVisible();

  const cell = page.getByRole("button", { name: /not played yet/ }).first();
  const label = (await cell.getAttribute("aria-label")) ?? "";
  const [home, away] = label.replace(": not played yet", "").split(" versus ");
  await cell.click();

  await expect(page.getByRole("heading", { name: "First to 10" })).toBeVisible();
  await page.getByLabel(`${home} goals`).fill("10");
  await page.getByLabel(`${away} goals`).fill("4");
  await expect(page.getByText(`${home} wins.`)).toBeVisible();
  await shot(page, "score-dialog");
  await page.getByRole("button", { name: "Save result" }).click();

  await expect(page.getByText(`${home} 10–4 ${away}`)).toBeVisible();
  await expect(board.getByText(`${home} 10–4 ${away}`)).toBeVisible();
  await shot(board, "board-after-result");

  // Replacing needs a second confirmation.
  await page.getByRole("button", { name: `${home} versus ${away}: 10 to 4` }).click();
  await page.getByLabel(`${away} goals`).fill("7");
  await page.getByRole("button", { name: "Save result" }).click();
  await expect(page.getByText("This replaces a recorded result")).toBeVisible();
  await page.getByRole("button", { name: "Replace result" }).click();
  await expect(board.getByText(`${home} 10–7 ${away} (was 10–4)`)).toBeVisible();

  // Undo puts it back.
  await page.getByRole("button", { name: "Undo last change" }).click();
  await expect(board.getByText(`${home} 10–4 ${away} (was 10–7)`)).toBeVisible();
});

test("teams and settings", async ({ page }) => {
  await page.goto("/admin");
  await enterPin(page, "1234");
  await page.getByRole("tab", { name: "Teams" }).click();
  await shot(page, "admin-teams");

  await page.getByRole("button", { name: "Add team" }).click();
  await page.getByLabel("Team name").fill("Kitchen Crew");
  await page.getByLabel("Member 1").fill("Anders");
  await page.getByRole("radio", { name: "Aqua" }).click();
  await page.getByRole("radio", { name: "🍕" }).click();
  await shot(page, "team-dialog");
  await page.getByRole("button", { name: "Add team" }).last().click();
  await expect(page.getByText("7 of 8 teams")).toBeVisible();

  await page.getByRole("tab", { name: "Settings" }).click();
  await shot(page, "admin-settings");
  await page.getByLabel("Tournament name").fill("Friday Cup");
  await page.getByRole("button", { name: "Save settings" }).click();
  await expect(page.getByText("Settings saved.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Friday Cup" })).toBeVisible();
});
