import { expect, it } from "vitest";
// @ts-expect-error Node-only adapter.
import { createUser } from "./auth/service.mjs";

it.each([
  { name: "" },
  { name: "x".repeat(256) },
  { username: "has spaces" },
  { username: "x".repeat(31) },
  { is_admin: true },
  { email_verification_required: false },
  null,
  [],
])(
  "rejects invalid profile fields and privilege flags before creating an account: %j",
  async (profile) => {
    await expect(
      createUser("valid@example.com", "Valid-password-123", profile),
    ).rejects.toMatchObject({ code: "INVALID_ACCOUNT" });
  },
);
