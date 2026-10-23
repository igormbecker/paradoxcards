import { expect, test, type Page } from "@playwright/test";
test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("E-mail", { exact: true }).fill("player@paradox.test");
  await page.getByLabel("Senha", { exact: true }).fill("Paradox-test-123");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Sair", exact: true }),
  ).toBeVisible();
  await page.waitForTimeout(200);
  const takeover = page.getByRole("button", { name: "Continuar nesta aba" });
  if (await takeover.isVisible()) await takeover.click();
  await expect(
    page.getByRole("button", { name: "Reiniciar mesa" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Reiniciar mesa" }).click();
  await expect(page.getByTestId("turn")).toContainText("Prepare a mão");
});
const cell = (page: Page, name: string) =>
  page.getByRole("button", { name: new RegExp("^" + name + ",") });
async function begin(page: Page) {
  await page.getByRole("button", { name: "Manter mão e confirmar" }).click();
  await expect(page.getByTestId("turn")).toHaveText(
    "Prepare a mão dos Guardiões",
  );
  await page.getByRole("button", { name: "Manter mão e confirmar" }).click();
  await expect(page.getByTestId("turn")).toHaveText("Vez dos Viajantes");
}
const rankOne = (page: Page) => page.locator('.card[data-rank="1"]').first();

test("reference table fits the screen with player names, an active hand and hidden opposing cards", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(
    page.getByRole("main", { name: "Mesa do observatório" }),
  ).toBeVisible();
  await expect(page.locator(".card-inspection")).toHaveCount(0);
  await expect(page.locator(".opponent-card")).toHaveCount(0);
  const session = await (await page.request.get("/api/v1/session")).json();
  await expect(page.locator(".player-identity strong")).toHaveText([
    session.user.username,
    session.user.username,
  ]);
  await begin(page);
  await expect(page.locator(".hand")).toHaveAttribute("data-side", "0");
  const faceRatio = await page
    .locator(".card")
    .first()
    .evaluate(
      (el) =>
        (el as HTMLElement).offsetWidth / (el as HTMLElement).offsetHeight,
    );
  expect(faceRatio).toBeCloseTo(390 / 534, 1);
  const back = (await page.locator(".opponent-card").first().boundingBox())!;
  const active = (await page.locator(".card").first().boundingBox())!;
  expect(back.height / active.height).toBeGreaterThan(0.5);
  await expect(page.locator(".card-art").first()).toHaveCSS(
    "background-image",
    /assets\/cards\/.*\.webp/,
  );
  await expect(page.locator(".opponent-card").first()).toHaveCSS(
    "background-image",
    /card-back/,
  );
  await expect(page.locator(".table")).not.toHaveCSS("transform", "none");
  expect(
    await cell(page, "B1").evaluate(
      (el) =>
        (el as HTMLElement).offsetHeight > (el as HTMLElement).offsetWidth,
    ),
  ).toBe(true);
  const drawn = (await page.locator("canvas").boundingBox())!;
  const surface = (await page.locator(".canvas").boundingBox())!;
  expect(Math.abs(drawn.width - surface.width)).toBeLessThan(2);
  expect(Math.abs(drawn.height - surface.height)).toBeLessThan(2);
  await expect(page.locator(".opponent-card")).toHaveCount(5);
  await expect(
    page.getByRole("heading", { name: "Resultado geral" }),
  ).toHaveCount(0);
  const card = rankOne(page);
  await card.click();
  await expect(card).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".selection-description")).toContainText(
    await card.locator("strong").innerText(),
  );
  await expect(page.locator(".selection-description")).toContainText(
    "3 casas disponíveis",
  );
  await cell(page, "B1").click();
  await expect(page.getByTestId("turn")).toHaveText("Vez dos Guardiões");
  await expect(page.locator(".hand")).toHaveAttribute("data-side", "1");
  const after = await (await page.request.get("/api/v1/match")).json();
  await expect(page.locator(".opponent-card")).toHaveCount(
    after.state.hands[0].length,
  );
  await expect(page.locator(".hand .card")).toHaveCount(6);
  for (const viewport of [
    { width: 1920, height: 1080 },
    { width: 1440, height: 900 },
    { width: 1366, height: 768 },
    { width: 1280, height: 720 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await expect
      .poll(async () =>
        page.locator(".table-stage").getAttribute("data-portrait"),
      )
      .toBe(String(viewport.width < 700));
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <= innerWidth &&
          document.documentElement.scrollHeight <= innerHeight,
      ),
    ).toBe(true);
    const table = (await page.locator(".table").boundingBox())!;
    const opponent = (await page.locator(".opponent-hand").boundingBox())!;
    const hand = (await page.locator(".hand").boundingBox())!;
    const action = (await page
      .getByRole("button", { name: "Passar a vez", exact: true })
      .boundingBox())!;
    expect(opponent.y + opponent.height).toBeLessThanOrEqual(table.y + 2);
    const back = (await page.locator(".opponent-card").first().boundingBox())!;
    expect(back.y).toBeGreaterThanOrEqual(0);
    expect(back.y + back.height).toBeLessThanOrEqual(table.y + 2);
    expect(hand.y).toBeGreaterThan(table.y + table.height - 2);
    expect(action.y).toBeGreaterThan(table.y + table.height);
    // The hand card and board card share the same physical width before perspective.
    const relativeWidth = await page.evaluate(() => {
      const card = document.querySelector<HTMLElement>(".hand .card")!;
      const cell = document.querySelector<HTMLElement>(".board-target")!;
      return card.offsetWidth / cell.offsetWidth;
    });
    expect(relativeWidth).toBeCloseTo(120 / 128, 2);
    for (const card of await page.locator(".hand .card").all()) {
      const box = (await card.boundingBox())!;
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
    }
    await page.screenshot({
      path: `test-results/reference-table-${viewport.width}.png`,
      fullPage: true,
    });
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator('.card[aria-pressed="true"]')).toHaveCSS(
    "transition-duration",
    "0s",
  );
});
test("prepara mãos, compra, pontua, encerra e recomeça", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  await expect(cell(page, "B1")).toBeDisabled();
  await expect(page.locator(".card")).toHaveCount(5);
  const preserved = await rankOne(page).getAttribute("data-card-id");
  const exchange = page.locator(`.card:not([data-card-id="${preserved}"])`);
  await exchange.nth(0).click();
  await exchange.nth(1).click();
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
    String(
      (await (await page.request.get("/api/v1/match")).json()).state.hands[0]
        .length,
    ) + " Viajantes · 6 Guardiões",
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
  await cell(page, "B1").focus();
  await expect(page.locator(".preview-description")).toContainText("B1");
  await expect(page.getByTestId("row-score-0-1")).toHaveText("0");
  await page
    .getByRole("heading", { name: "Paradox: The Card Game", exact: true })
    .click();
  await expect(page.locator(".preview-description")).toBeEmpty();
  await cell(page, "B1").hover();
  await expect(page.locator(".preview-description")).toContainText("B1");
  await page.mouse.move(0, 0);
  await expect(page.locator(".preview-description")).toBeEmpty();
  await cell(page, "B1").click();
  await rankOne(page).click();
  await cell(page, "B5").focus();
  await cell(page, "B5").hover();
  await expect(page.locator(".preview-description")).toContainText("B5");
  await expect(page.locator(".preview-description")).not.toContainText("B1:");
  await page.keyboard.press("Enter");
  await expect(page.locator(".preview-description")).toBeEmpty();
  await expect(page.getByTestId("turn")).toHaveText("Vez dos Viajantes");
});
test("troca cinco de uma vez e permite encerrar empatado", async ({ page }) => {
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
