import { expect, test } from "@playwright/test";

test("landing presents the commercial name, restricted access and usable login on desktop and mobile", async ({
  page,
}) => {
  const expectReadableTypography = async () => {
    await expect(page.locator(".landing")).toHaveCSS("font-family", /Spectral/);
    await expect(page.getByLabel("E-mail", { exact: true })).toHaveCSS(
      "font-size",
      "16px",
    );
    await expect(page.locator(".login .sub")).toHaveCSS("font-size", "15.2px");
    await expect(page.locator(".access-notice > p").first()).toHaveCSS(
      "font-size",
      "16px",
    );
    await expect(page.locator(".access-detail")).toHaveCSS(
      "font-size",
      "15.2px",
    );
    await expect(page.locator(".landing-footer")).toHaveCSS(
      "font-size",
      "14.72px",
    );
  };
  await page.goto("/");
  await expect(page.getByTestId("forest-scene")).toBeVisible();
  await expect(page.locator(".t1")).toHaveCSS(
    "font-family",
    /IM Fell English SC/,
  );
  await expect(page).toHaveTitle("Paradox: The Card Game");
  await expect(
    page.getByRole("link", { name: "Conhecer o tabuleiro" }),
  ).toHaveCount(0);
  await expect(
    page.getByText(
      "Desenvolvido por >.Bectec Tecnologia e Desenvolvimento de Softwares",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Paradox: The Card Game", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Para jogar, é necessário solicitar acesso à equipe do Paradox.",
    ),
  ).toBeVisible();
  await page.getByLabel("E-mail", { exact: true }).fill("unknown@paradox.test");
  await page.getByLabel("Senha", { exact: true }).fill("invalid-password");
  await page.getByRole("button", { name: "Mostrar senha" }).click();
  await expect(page.getByLabel("Senha", { exact: true })).toHaveAttribute(
    "type",
    "text",
  );
  await page.getByRole("button", { name: "Ocultar senha" }).click();
  await expect(page.getByLabel("Senha", { exact: true })).toHaveAttribute(
    "type",
    "password",
  );
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByRole("alert")).not.toBeEmpty();
  await expect(
    page.getByRole("button", { name: "Entrar", exact: true }),
  ).toBeEnabled();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Entrar", exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 900 });
  await expectReadableTypography();
  await page.screenshot({
    path: "test-results/landing-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expectReadableTypography();
  await expect(page.getByLabel("E-mail", { exact: true })).toBeVisible();
  await expect(
    page.getByText(
      "Desenvolvido por >.Bectec Tecnologia e Desenvolvimento de Softwares",
      { exact: true },
    ),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/landing-mobile.png",
    fullPage: true,
  });
});

test("reference composition keeps the login over a full-height scene at narrow widths", async ({
  page,
}) => {
  await page.goto("/");
  for (const width of [740, 600, 450, 390, 320]) {
    await page.setViewportSize({ width, height: 850 });
    const panel = await page.locator(".login").boundingBox();
    expect(panel!.y).toBeLessThan(550);
    expect(panel!.width).toBeGreaterThan(width - 100);
    const stage = await page.locator(".stage").boundingBox();
    const scene = await page.getByTestId("forest-scene").boundingBox();
    expect(Math.abs(stage!.height - scene!.height)).toBeLessThan(2);
    await expect(page.locator(".scene")).toHaveAttribute(
      "viewBox",
      "230 0 660 900",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.locator(".scene")).toHaveAttribute(
    "viewBox",
    "0 0 1600 900",
  );
  await page.setViewportSize({ width: 450, height: 850 });
  await page.screenshot({
    path: "test-results/landing-reference-450.png",
    fullPage: true,
  });
});

test("desktop reference framing excludes the footer from the scene proportions", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1090, height: 850 });
  await page.goto("/");
  await expect(page.locator(".scene")).toHaveAttribute(
    "viewBox",
    "0 0 1600 900",
  );
  const stage = await page.locator(".stage").boundingBox();
  const footer = await page.locator(".landing-footer").boundingBox();
  expect(footer!.y).toBeCloseTo(stage!.height, 0);
  expect(stage!.height).toBeLessThan(950);
  await page.screenshot({
    path: "test-results/landing-reference-1090.png",
    fullPage: true,
  });
});
