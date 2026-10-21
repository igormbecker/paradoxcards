import { expect, test } from "@playwright/test";
test("login, transferência entre abas, ação rejeitada na aba antiga e logout", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await page.getByLabel("E-mail", { exact: true }).fill("player@paradox.test");
  await page.getByLabel("Senha", { exact: true }).fill("Paradox-test-123");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  const takeover = page.getByRole("button", { name: "Continuar nesta aba" });
  if (await takeover.isVisible()) await takeover.click();
  await expect(
    page.getByRole("button", { name: "Reiniciar mesa" }),
  ).toBeEnabled();
  const other = await context.newPage();
  await other.goto("/");
  await expect(
    other.getByRole("button", { name: "Continuar nesta aba" }),
  ).toBeVisible();
  await expect(
    other.getByRole("button", { name: "Reiniciar mesa" }),
  ).toBeDisabled();
  await other.getByRole("button", { name: "Continuar nesta aba" }).click();
  await expect(
    other.getByRole("button", { name: "Reiniciar mesa" }),
  ).toBeEnabled();
  // A primeira aba ainda parece ativa antes do heartbeat, mas a API rejeita sua ação.
  await page.getByRole("button", { name: "Reiniciar mesa" }).click();
  await expect(
    page.getByRole("button", { name: "Continuar nesta aba" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Reiniciar mesa" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Continuar nesta aba" }).click();
  await expect(
    page.getByRole("button", { name: "Reiniciar mesa" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Reiniciar mesa" }).click();
  await expect(page.getByTestId("turn")).toContainText("Prepare a mão");
  await page.screenshot({
    path: "test-results/authenticated-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Entrar", exact: true }),
  ).toBeVisible();
  await other.reload();
  await expect(
    other.getByRole("button", { name: "Entrar", exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => document.cookie)).not.toContain(
    "paradox_session",
  );
});

test("primeira mão exibida corresponde ao estado persistido no servidor", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("E-mail", { exact: true }).fill("player@paradox.test");
  await page.getByLabel("Senha", { exact: true }).fill("Paradox-test-123");
  const claim = page.waitForResponse((response) =>
    response.url().endsWith("/api/v1/match/control"),
  );
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await claim;
  const snapshot = await page.request.get("/api/v1/match");
  const data = await snapshot.json();
  await expect(page.locator(".card")).toHaveCount(
    data.state.hands[data.state.turn].length,
  );
  const shown = await page
    .locator(".card")
    .evaluateAll((elements) =>
      elements.map((e) => e.getAttribute("data-card-id")),
    );
  expect(shown).toEqual(
    data.state.hands[data.state.turn].map((c: { id: string }) => c.id),
  );
});
