import { expect, test } from "@playwright/test";

test("landing presents the commercial name, restricted access and usable login on desktop and mobile", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByTestId("forest-scene")).toBeVisible();
  await expect(page.locator("#game-title")).toHaveCSS(
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
  await page.screenshot({
    path: "test-results/landing-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
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
