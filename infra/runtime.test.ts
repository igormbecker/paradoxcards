import { expect, it } from "vitest";
// @ts-expect-error Node-only module without declarations.
import { validateRuntime } from "./runtime.mjs";
it("orienta nvm use ao executar com Node incompatível", () => {
  expect(() => validateRuntime("v18.20.8", "24.22.1")).toThrow("nvm use");
});
it("aceita exatamente a versão definida no projeto", () => {
  expect(() => validateRuntime("v24.22.1", "24.22.1")).not.toThrow();
});
