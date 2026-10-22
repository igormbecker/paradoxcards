import { expect, test } from "@playwright/test";

test("forest clearing moves on desktop and mobile while ambient sound remains opt-in and can be stopped", async ({
  page,
}) => {
  await page.goto("/");
  const audio = page.locator("audio[data-testid='campfire-audio']");
  await expect(audio).toHaveCount(1);
  expect(
    await audio.evaluate((element: HTMLAudioElement) => element.paused),
  ).toBe(true);
  await expect(
    page.getByRole("button", { name: "Ativar som da fogueira" }),
  ).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByTestId("forest-scene")).toHaveAttribute(
    "data-animated",
    "true",
  );
  const scene = page.getByTestId("forest-scene");
  const firstFrame = await scene.screenshot();
  await expect
    .poll(async () => !(await scene.screenshot()).equals(firstFrame))
    .toBe(true);
  await page.getByRole("button", { name: "Ativar som da fogueira" }).click();
  await expect(
    page.getByRole("button", { name: "Desativar som da fogueira" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect
    .poll(() => audio.evaluate((element: HTMLAudioElement) => element.paused))
    .toBe(false);
  await page.getByRole("button", { name: "Desativar som da fogueira" }).click();
  expect(
    await audio.evaluate((element: HTMLAudioElement) => element.paused),
  ).toBe(true);
  await expect(
    page.getByRole("button", { name: /Pausar animação/ }),
  ).toHaveCount(0);
  await expect(scene.locator("svg.scene")).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(scene).toHaveAttribute("data-animated", "true");
  const mobileFrame = await scene.screenshot();
  await expect
    .poll(async () => !(await scene.screenshot()).equals(mobileFrame))
    .toBe(true);
});

test("reduced motion starts with a static scene and audio failures leave the control off", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/assets/audio/campfire.wav", (route) => route.abort());
  await page.goto("/");
  await expect(page.getByTestId("forest-scene")).toHaveAttribute(
    "data-animated",
    "false",
  );
  const scene = page.getByTestId("forest-scene");
  await expect(scene.locator("svg.scene")).toBeVisible();
  await expect
    .poll(() =>
      scene.evaluate((element) => element.getBoundingClientRect().width),
    )
    .toBeGreaterThan(0);
  const staticFrame = await scene.screenshot();
  expect((await scene.screenshot()).equals(staticFrame)).toBe(true);
  await page.getByRole("button", { name: "Ativar som da fogueira" }).click();
  await expect(
    page.getByText("Não foi possível reproduzir o som. Tente novamente."),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Ativar som da fogueira" }),
  ).toHaveAttribute("aria-pressed", "false");
});
