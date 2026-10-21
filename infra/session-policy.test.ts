import { expect, it } from "vitest";
// @ts-expect-error Node-only module.
import { sessionWindow, renewalNeeded, canRenew } from "./auth/policy.mjs";
const hour = 3600000;
it("limita inatividade a 24h e duração absoluta a sete dias", () => {
  const window = sessionWindow(1000);
  expect(window.expiresAt).toBe(1000 + 24 * hour);
  expect(window.absoluteAt).toBe(1000 + 7 * 24 * hour);
  expect(sessionWindow(7 * 24 * hour - 10, 7 * 24 * hour).expiresAt).toBe(
    7 * 24 * hour,
  );
});
it("renova no máximo a cada quinze minutos e nunca ressuscita sessão expirada", () => {
  expect(renewalNeeded(1000, 1000 + 899999)).toBe(false);
  expect(renewalNeeded(1000, 1000 + 900000)).toBe(true);
  expect(canRenew({ expiresAt: 2000, absoluteAt: 3000 }, 1999)).toBe(true);
  expect(canRenew({ expiresAt: 2000, absoluteAt: 3000 }, 2000)).toBe(false);
  expect(canRenew({ expiresAt: 4000, absoluteAt: 3000 }, 3000)).toBe(false);
});
