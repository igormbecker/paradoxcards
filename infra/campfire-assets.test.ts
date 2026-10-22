import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { expect, it } from "vitest";

it("preserves the original approved scene and an identical backup", () => {
  const image = readFileSync(
    new URL(
      "../public/assets/backgrounds/forest-camp-portal.png",
      import.meta.url,
    ),
  );
  const backup = readFileSync(
    new URL("../docs/assets/forest-camp-portal-original.png", import.meta.url),
  );
  expect(image.equals(backup)).toBe(true);
  expect(createHash("sha256").update(image).digest("hex")).toBe(
    "ff8e0d05e02a6877dad2928c7b1da60d8864e96928e19b200a4d6a31900bcfba",
  );
});
