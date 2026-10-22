import { expect, test } from "@playwright/test";

test("preview displays the complete approved artwork without implying a playable match", async ({
  page,
}) => {
  await page.goto("/?preview=board");
  await expect(
    page.getByRole("heading", { name: "O tabuleiro do Paradox" }),
  ).toBeVisible();
  const artwork = page.getByRole("img", {
    name: /Conceito aprovado do tabuleiro/,
  });
  await expect(artwork).toHaveAttribute(
    "src",
    "/assets/concepts/approved-board.png",
  );
  await expect(page.getByText(/Conceito estático/)).toBeVisible();
  await artwork.evaluate((element: HTMLImageElement) => element.decode());
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(artwork).toBeVisible();
    const dimensions = await artwork.evaluate((element: HTMLImageElement) => ({
      width: element.clientWidth,
      height: element.clientHeight,
      ratio: element.naturalWidth / element.naturalHeight,
    }));
    expect(
      Math.abs(dimensions.width / dimensions.height - dimensions.ratio),
    ).toBeLessThan(0.02);
    await page.screenshot({
      path: `test-results/board-preview-${width}.png`,
      fullPage: true,
    });
  }
  await page.getByRole("link", { name: "Voltar à entrada" }).click();
  await expect(page.getByLabel("E-mail", { exact: true })).toBeVisible();
});
