import { expect, test, type Page } from "@playwright/test";

import { enterPin, resetTournament } from "./helpers";

const shots = process.env.E2E_SHOTS;

async function addTeam(page: Page, name: string, emblem: string) {
  await page.getByRole("button", { name: "Add team" }).click();
  await page.getByLabel("Team name").fill(name);
  await page.getByLabel("Member", { exact: true }).nth(0).fill(`${name} one`);
  await page.getByLabel("Member", { exact: true }).nth(1).fill(`${name} two`);
  await page.getByRole("radio", { name: emblem }).click();
  await page.getByRole("button", { name: "Add team" }).last().click();
}

test.use({ viewport: { width: 1920, height: 1080 } });

// The tournament is shared with real screens: put the demo back whatever
// happened, and once for the file rather than per test.
test.afterAll(async ({ browser }) => {
  const page = await browser.newPage();
  await resetTournament(page);
  await page.close();
});

async function growToEightTeams(page: Page) {
  await page.goto("/admin");
  await enterPin(page);
  await page.getByRole("tab", { name: "Teams" }).click();
  await addTeam(page, "Kitchen Crew", "🍕");
  await addTeam(page, "Night Shift", "🦊");
  await expect(page.getByText("8 of 8 teams")).toBeVisible();
  await expect(page.getByRole("button", { name: "Add team" })).toBeDisabled();
}

/** Nothing on the screen may scroll or clip: not the page, not a panel, not a scroll container inside one. */
async function expectNothingClipped(page: Page) {
  const overflow = await page.evaluate(() => {
    const root = document.scrollingElement!;
    const clipped = [...document.querySelectorAll<HTMLElement>(".Screen, .Screen *")]
      .filter((element) => element.scrollHeight > element.clientHeight + 1 || element.scrollWidth > element.clientWidth + 1)
      .filter((element) => getComputedStyle(element).overflow !== "visible" || element.classList.contains("Screen"))
      // A visually hidden element is a one-pixel box clipped on purpose.
      .filter((element) => element.clientWidth > 1 && element.clientHeight > 1)
      .map((element) => `${element.tagName.toLowerCase()}.${[...element.classList].join(".")}`);
    return { page: root.scrollHeight > window.innerHeight, clipped };
  });
  expect(overflow.page, "the page scrolls").toBe(false);
  expect(overflow.clipped, "something clips its content").toEqual([]);
}

test("the info screen fits eight teams on a 1280x720 display too", async ({ page }) => {
  await resetTournament(page);
  await growToEightTeams(page);
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/screen");
  await expect(page.getByRole("heading", { name: "Signifly Autumn Open" })).toBeVisible();
  await expectNothingClipped(page);
  if (shots) {
    await page.screenshot({ path: `${shots}/screen-8-teams-720.png` });
  }
});

test("the info screen fits eight teams on one 1080p screen without scrolling", async ({ page }) => {
  await resetTournament(page);
  await growToEightTeams(page);

  await page.goto("/screen");
  await expect(page.getByRole("heading", { name: "Signifly Autumn Open" })).toBeVisible();
  await expect(page.getByRole("table").first().getByRole("row")).toHaveCount(9);

  await expectNothingClipped(page);

  if (shots) {
    await page.screenshot({ path: `${shots}/screen-8-teams.png` });
  }
});
