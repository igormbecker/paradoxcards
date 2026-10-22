import { expect, it } from "vitest";
// @ts-expect-error Build-only JavaScript module.
import { buildVersion } from "./version.mjs";

it("does not invent a release when the repository has no tags", () => {
  expect(
    buildVersion(() => {
      throw new Error("No tags");
    }),
  ).toBeNull();
});
it("uses the version tag on the current commit", () => {
  expect(buildVersion(() => "v0.0.1-0-gabc1234\n")).toBe("v0.0.1");
});
it("distinguishes development commits from the tagged release", () => {
  expect(buildVersion(() => "v0.0.1-3-gabc1234\n")).toBe("v0.0.1+3.gabc1234");
});
it("ignores tags that do not describe a version", () => {
  expect(buildVersion(() => "something-0-gabc1234")).toBeNull();
});
it("marks uncommitted work instead of presenting it as the exact release", () => {
  expect(buildVersion(() => "v0.0.1-0-gabc1234-dirty")).toBe("v0.0.1+working");
});
