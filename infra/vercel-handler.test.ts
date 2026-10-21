import { afterEach, expect, it, vi } from "vitest";
import { createServer } from "node:http";
// @ts-expect-error Node-only adapter.
import {
  createDeploymentHandler,
  deploymentClientAddress,
} from "./server/vercel.mjs";

const environment = {
  VERCEL_ENV: "preview",
  VERCEL_URL: "playparadox-preview.vercel.app",
  APP_ORIGINS: "https://preview.playparadox.com.br",
  PASSWORD_PEPPER: "x".repeat(64),
  RESEND_API_KEY: "placeholder",
  EMAIL_FROM: "Paradox Cards <test@example.com>",
  EMAIL_PREVIEW_RECIPIENTS: "tester@example.com",
};
afterEach(() => vi.restoreAllMocks());
it("serves the API through the deployment handler and preserves request validation", async () => {
  const server = createServer(createDeploymentHandler(environment));
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("No server address");
  const base = `http://127.0.0.1:${address.port}`;
  try {
    const health = await fetch(`${base}/api/health`);
    expect(health.status).toBe(200);
    expect(await health.json()).toEqual({ ok: true });
    expect(health.headers.get("cache-control")).toContain("no-store");
    const rejected = await fetch(`${base}/api/v1/session`, {
      method: "POST",
      headers: {
        Origin: "https://untrusted.vercel.app",
        "Content-Type": "application/json",
      },
      body: "{}",
    });
    expect(rejected.status).toBe(403);
    const malformed = await fetch(`${base}/api/v1/session`, {
      method: "POST",
      headers: {
        Origin: "https://playparadox-preview.vercel.app",
        "Content-Type": "application/json",
      },
      body: "{",
    });
    expect(malformed.status).toBe(400);
    const oversized = await fetch(`${base}/api/v1/session`, {
      method: "POST",
      headers: {
        Origin: "https://playparadox-preview.vercel.app",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data: "x".repeat(9000) }),
    });
    expect(oversized.status).toBe(413);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
it("fails closed when deployment configuration is incomplete", () => {
  expect(() =>
    createDeploymentHandler({ ...environment, PASSWORD_PEPPER: "" }),
  ).toThrow();
});

it("trusts the platform IP header only in Vercel, validating the address", () => {
  const request = {
    headers: { "x-forwarded-for": "203.0.113.8" },
    socket: { remoteAddress: "127.0.0.1" },
  };
  expect(deploymentClientAddress(request, { VERCEL: "1" })).toBe("203.0.113.8");
  expect(deploymentClientAddress(request, {})).toBe("127.0.0.1");
  expect(
    deploymentClientAddress(
      { ...request, headers: { "x-forwarded-for": "invalid" } },
      { VERCEL: "1" },
    ),
  ).toBe("127.0.0.1");
});
