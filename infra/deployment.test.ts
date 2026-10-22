import { afterEach, expect, it, vi } from "vitest";
// @ts-expect-error Node-only adapter.
import { connectionOptions, loadEnvironment } from "./environment.mjs";
// @ts-expect-error Node-only adapter.
import { deploymentOrigins, validateDeployment } from "./deployment.mjs";

const environment = {
  VERCEL_ENV: "preview",
  DATABASE_URL:
    "postgresql://user:secret@ep-preview-pooler.eu.neon.tech/game?sslmode=require",
  DATABASE_URL_UNPOOLED:
    "postgresql://user:secret@ep-preview.eu.neon.tech/game?sslmode=require",
  PASSWORD_PEPPER: "x".repeat(64),
  VERCEL_URL: "playparadox-unique.vercel.app",
  APP_ORIGINS: "https://preview.playparadox.com.br",
  RESEND_API_KEY: "test-placeholder",
  EMAIL_FROM: "Paradox Cards <notificacoes@playparadox.com.br>",
  EMAIL_PREVIEW_RECIPIENTS: "tester@example.com",
};
afterEach(() => vi.unstubAllEnvs());
it("allows preview without APP_ORIGINS only when its deployment hostname is available", () => {
  expect(deploymentOrigins({ ...environment, APP_ORIGINS: undefined })).toEqual(
    ["https://playparadox-unique.vercel.app"],
  );
  expect(() =>
    deploymentOrigins({
      ...environment,
      APP_ORIGINS: undefined,
      VERCEL_URL: undefined,
    }),
  ).toThrow();
  expect(() =>
    deploymentOrigins({
      ...environment,
      VERCEL_ENV: "production",
      APP_ORIGINS: undefined,
    }),
  ).toThrow();
  expect(() =>
    deploymentOrigins({
      ...environment,
      APP_ORIGINS: undefined,
      VERCEL_URL: "attacker.example.com",
    }),
  ).toThrow();
});
it("uses verified TLS for Neon and a direct connection for migrations", () => {
  const options = connectionOptions(environment);
  expect(options.ssl).toEqual({ rejectUnauthorized: true });
  expect(options.connectionString).not.toContain("sslmode");
  expect(connectionOptions(environment, true).connectionString).toContain(
    "ep-preview.eu",
  );
  expect(() =>
    connectionOptions(
      { ...environment, DATABASE_URL_UNPOOLED: environment.DATABASE_URL },
      true,
    ),
  ).toThrow();
  expect(() =>
    connectionOptions({
      ...environment,
      DATABASE_URL: "postgresql://user:secret@localhost/game",
    }),
  ).toThrow();
  expect(() => connectionOptions({ VERCEL_ENV: "production" })).toThrow();
});
it("rejects incomplete deployment secrets and unsafe origins", () => {
  expect(() => validateDeployment(environment)).not.toThrow();
  expect(() =>
    validateDeployment({ ...environment, PASSWORD_PEPPER: "short" }),
  ).toThrow();
  expect(() =>
    validateDeployment({ ...environment, EMAIL_PREVIEW_RECIPIENTS: "" }),
  ).toThrow();
  expect(() =>
    deploymentOrigins({ ...environment, APP_ORIGINS: "http://localhost" }),
  ).toThrow();
  expect(deploymentOrigins(environment)).toEqual([
    "https://preview.playparadox.com.br",
    "https://playparadox-unique.vercel.app",
  ]);
  expect(
    deploymentOrigins({ ...environment, VERCEL_ENV: "production" }),
  ).not.toContain("https://playparadox-unique.vercel.app");
});
it("loads hosted environments without reading local dotenv files", () => {
  for (const [key, value] of Object.entries(environment))
    vi.stubEnv(key, value);
  expect(() => loadEnvironment("preview")).not.toThrow();
});
