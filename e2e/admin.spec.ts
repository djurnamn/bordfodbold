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

// Whatever a test leaves behind, the shared tournament goes back to the demo.
test.afterAll(async ({ browser }) => {
  const page = await browser.newPage();
  await resetTournament(page);
  await page.close();
});

test("the admin grid is one tab stop and the arrow keys walk it", async ({ page }) => {
  await page.goto("/admin");
  await enterPin(page);
  await expect(page.getByRole("heading", { name: "Signifly Autumn Open" })).toBeFocused();

  const stops = page.locator(".TournamentGrid__button[tabindex='0']");
  await expect(stops).toHaveCount(1);
  await stops.focus();
  const focusedLabel = () => page.evaluate(() => document.activeElement?.getAttribute("aria-label"));
  const first = await focusedLabel();
  await page.keyboard.press("ArrowRight");
  const second = await focusedLabel();
  expect(second).not.toBe(first);
  await page.keyboard.press("ArrowLeft");
  expect(await focusedLabel()).toBe(first);
  await expect(page.locator(".TournamentGrid__cell--highlighted").first()).toBeVisible();

  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "First to 10" })).toBeVisible();
  await expect(page.getByLabel("Vesterbro Vikings goals")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(stops).toBeFocused();
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

  const feedRow = (target: Page, result: string) =>
    target.getByRole("row").filter({ hasText: home }).filter({ hasText: away }).filter({ hasText: result }).first();
  await expect(feedRow(page, "10–4")).toBeVisible();
  await expect(feedRow(board, "10–4")).toBeVisible();
  await shot(board, "board-after-result");

  // Replacing needs a second confirmation.
  await page.getByRole("button", { name: `${home} versus ${away}: 10 to 4` }).click();
  await page.getByLabel(`${away} goals`).fill("7");
  await page.getByRole("button", { name: "Save result" }).click();
  await expect(page.getByText("This replaces a recorded result")).toBeVisible();
  await page.getByRole("button", { name: "Replace result" }).click();
  await expect(feedRow(board, "10–7").filter({ hasText: "was 10–4" })).toBeVisible();

  // Undo puts it back, as an undo entry.
  await page.getByRole("button", { name: "Undo last change" }).click();
  await expect(feedRow(board, "was 10–7").filter({ hasText: "Undo" })).toBeVisible();
});

test("teams and settings", async ({ page }) => {
  await page.goto("/admin");
  await enterPin(page, "1234");
  await page.getByRole("tab", { name: "Teams" }).click();
  await shot(page, "admin-teams");

  await page.getByRole("button", { name: "Add team" }).click();
  await page.getByLabel("Team name").fill("Kitchen Crew");
  await page.getByLabel("Member", { exact: true }).nth(0).fill("Anders");
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

  // Clearing leaves an empty tournament, and the board says so.
  await page.getByRole("button", { name: "Clear the tournament" }).click();
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await page.getByRole("tab", { name: "Teams" }).click();
  await expect(page.getByText("No teams yet. Add the first one below.")).toBeVisible();
  await page.goto("/");
  await expect(page.getByText("No teams yet. Add them in the admin.")).toBeVisible();
  await expect(page.getByText("No results entered yet.")).toBeVisible();
});
