import { expect, test } from "@playwright/test";

test("campfire moves locally while sound remains opt-in and can be stopped", async ({
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
  await expect(page.getByTestId("campfire-canvas")).toHaveAttribute(
    "data-animated",
    "true",
  );
  const canvas = page.getByTestId("campfire-canvas");
  const firstFrame = await canvas.screenshot();
  await expect
    .poll(async () => !(await canvas.screenshot()).equals(firstFrame))
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
  await page
    .getByRole("button", { name: "Pausar animação da fogueira" })
    .click();
  await expect(page.getByTestId("campfire-canvas")).toHaveAttribute(
    "data-animated",
    "false",
  );
});

test("reduced motion starts with a static scene and audio failures leave the control off", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/assets/audio/campfire.wav", (route) => route.abort());
  await page.goto("/");
  await expect(page.getByTestId("campfire-canvas")).toHaveAttribute(
    "data-animated",
    "false",
  );
  await page.getByRole("button", { name: "Ativar som da fogueira" }).click();
  await expect(
    page.getByText("Não foi possível reproduzir o som. Tente novamente."),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Ativar som da fogueira" }),
  ).toHaveAttribute("aria-pressed", "false");
});
