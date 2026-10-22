import { expect, it } from "vitest";
// @ts-expect-error Node-only adapter.
import { deploymentFailure } from "./deployment-diagnostics.mjs";

it("identifies configuration failures without printing environment values", () => {
  expect(
    deploymentFailure(new Error("PASSWORD_PEPPER required."), "configuration"),
  ).toContain("PASSWORD_PEPPER_REQUIRED");
  expect(
    deploymentFailure(
      new Error("Preview email allowlist required."),
      "configuration",
    ),
  ).toContain("EMAIL_PREVIEW_RECIPIENTS_INVALID");
});
it("reports known database codes and phase without leaking messages, SQL or connection strings", () => {
  const failure = deploymentFailure(
    {
      code: "28P01",
      message: "password secret postgresql://owner:secret@host/database",
      query: "private SQL",
    },
    "database-connection",
  );
  expect(failure).toContain("28P01");
  expect(failure).toContain("database-connection");
  expect(failure).not.toMatch(/secret|postgresql|private SQL/);
  expect(
    deploymentFailure(
      { code: "secret-token", message: "secret" },
      "migrations",
    ),
  ).toContain("UNKNOWN_ERROR");
});
