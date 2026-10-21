import { expect, test, type Page } from "@playwright/test";
const cell = (page: Page, name: string) =>
  page.getByRole("button", { name: new RegExp("^" + name + ",") });
async function begin(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Manter mão e confirmar" }).click();
  await page.getByRole("button", { name: "Manter mão e confirmar" }).click();
}
const rankOne = (page: Page) => page.locator('.card[data-rank="1"]').first();
test("prepara mãos, compra, pontua, encerra e recomeça", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(cell(page, "B1")).toBeDisabled();
  await expect(page.locator(".card")).toHaveCount(5);
  await page.locator(".card").nth(0).click();
  await page.locator(".card").nth(2).click();
  await expect(
    page.getByRole("button", { name: "Trocar 2 e confirmar" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Trocar 2 e confirmar" }).click();
  await expect(page.getByTestId("turn")).toHaveText(
    "Prepare a mão dos Guardiões",
  );
  await expect(page.locator('.card[aria-pressed="true"]')).toHaveCount(0);
  await page.getByRole("button", { name: "Manter mão e confirmar" }).click();
  await expect(page.getByTestId("turn")).toHaveText("Vez dos Viajantes");
  await rankOne(page).click();
  const power = Number(await rankOne(page).getAttribute("data-power"));
  await cell(page, "B1").focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("row-score-0-1")).toHaveText(String(power));
  await expect(page.getByTestId("turn")).toHaveText("Vez dos Guardiões");
  await expect(page.getByTestId("hand-counts")).toContainText(
    "4 Viajantes · 6 Guardiões",
  );
  await expect(page.getByTestId("deck-counts")).toContainText(
    "10 Viajantes · 9 Guardiões",
  );
  await page.getByRole("button", { name: "Passar a vez", exact: true }).click();
  await page.getByRole("button", { name: "Passar e encerrar partida" }).click();
  await expect(
    page.getByRole("heading", { name: "Resultado final" }),
  ).toBeVisible();
  await expect(page.getByTestId("turn")).toHaveText("Viajantes venceram");
  await expect(cell(page, "A1")).toBeDisabled();
  await expect(page.locator(".card:enabled")).toHaveCount(0);
  await page.screenshot({
    path: "test-results/result-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Nova partida", exact: true }).click();
  await expect(page.getByTestId("turn")).toContainText("Prepare a mão");
  await expect(page.getByTestId("hand-counts")).toContainText(
    "5 Viajantes · 5 Guardiões",
  );
  await expect(page.getByTestId("row-score-0-1")).toHaveText("0");
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/opening-mobile.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
test("prévia e diagramas seguem o lado sem aplicar a jogada", async ({
  page,
}) => {
  await begin(page);
  await rankOne(page).click();
  await expect(rankOne(page).locator(".pattern i").nth(5)).toHaveClass("reach");
  await cell(page, "B1").focus();
  await expect(page.locator(".preview-description")).toContainText("B2");
  await expect(page.getByTestId("row-score-0-1")).toHaveText("0");
  await page
    .getByRole("heading", { name: "Paradox Cards", exact: true })
    .click();
  await expect(page.locator(".preview-description")).toBeEmpty();
  const canvas = page.locator("canvas"),
    bounds = (await canvas.boundingBox())!;
  await canvas.hover({
    position: { x: (bounds.width * 90) / 756, y: (bounds.height * 225) / 438 },
  });
  await expect(page.locator(".preview-description")).toContainText("B2");
  await page.mouse.move(0, 0);
  await expect(page.locator(".preview-description")).toBeEmpty();
  await canvas.click({
    position: { x: (bounds.width * 90) / 756, y: (bounds.height * 225) / 438 },
  });
  await rankOne(page).click();
  await expect(rankOne(page).locator(".pattern i").nth(3)).toHaveClass("reach");
  await expect(rankOne(page).locator(".pattern i").nth(5)).not.toHaveClass(
    "reach",
  );
  await cell(page, "B5").focus();
  await expect(page.locator(".preview-description")).toContainText("B4");
  await expect(page.locator(".preview-description")).not.toContainText("B2");
  await page.keyboard.press("Enter");
  await expect(page.locator(".preview-description")).toBeEmpty();
  await expect(page.getByTestId("turn")).toHaveText("Vez dos Viajantes");
});
test("troca cinco de uma vez e permite encerrar empatado", async ({ page }) => {
  await page.goto("/");
  for (let i = 0; i < 5; i++) await page.locator(".card").nth(i).click();
  await page.getByRole("button", { name: "Trocar 5 e confirmar" }).click();
  await page.getByRole("button", { name: "Manter mão e confirmar" }).click();
  await expect(
    page.getByRole("button", { name: "Manter mão e confirmar" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Passar a vez", exact: true }).click();
  await page.getByRole("button", { name: "Passar e encerrar partida" }).click();
  await expect(page.getByTestId("turn")).toHaveText("Empate");
  await expect(page.locator(".preview-description")).toBeEmpty();
});
