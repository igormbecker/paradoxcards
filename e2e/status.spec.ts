import { expect, test } from "@playwright/test";

test("public status shows real database metrics and returns to the landing", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Status do sistema" }).click();
  await expect(
    page.getByRole("heading", { name: "Status do sistema" }),
  ).toBeVisible();
  await expect(page.getByTestId("system-status")).toHaveText("Operacional");
  await expect(page.getByTestId("database-version")).not.toHaveText("—");
  await expect(
    page.getByRole("meter", { name: "Uso das conexões do banco" }),
  ).toBeVisible();
  await expect(page.getByTestId("status-payload")).toContainText(
    '"operational"',
  );
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/status-${width}.png`,
      fullPage: true,
    });
  }
  await page.getByRole("link", { name: "Voltar ao início" }).click();
  await expect(page.getByLabel("E-mail", { exact: true })).toBeVisible();
});

test("status handles a connection failure, retries and stops showing stale healthy metrics", async ({
  page,
}) => {
  let failing = true;
  await page.route("**/api/v1/status", async (route) => {
    if (failing) return route.abort();
    return route.continue();
  });
  await page.goto("/status");
  await expect(page.getByTestId("system-status")).toHaveText("Indisponível");
  await expect(page.getByRole("alert")).toContainText("Não foi possível");
  failing = false;
  await page.getByRole("button", { name: "Verificar novamente" }).click();
  await expect(page.getByTestId("system-status")).toHaveText("Operacional");
  failing = true;
  await expect(page.getByTestId("system-status")).toHaveText("Indisponível", {
    timeout: 12000,
  });
  await expect(page.getByTestId("database-version")).toHaveText("—");
});
