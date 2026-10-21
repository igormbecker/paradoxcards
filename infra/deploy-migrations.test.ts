import { expect, it, vi } from "vitest";
// @ts-expect-error Node-only adapter.
import { runDeploymentMigrations } from "./deploy-migrations.mjs";
const environment = {
  VERCEL: "1",
  VERCEL_ENV: "preview",
  DATABASE_URL_UNPOOLED:
    "postgresql://user:secret@ep-preview.eu.neon.tech/game?sslmode=require",
};
function dependencies() {
  const client = { connect: vi.fn(), query: vi.fn(), end: vi.fn() };
  return {
    client,
    createClient: vi.fn(() => client),
    runner: vi.fn(async () => [{ name: "migration" }]),
  };
}
it("requires a hosted environment and direct Neon URL before connecting", async () => {
  const deps = dependencies();
  await expect(
    runDeploymentMigrations({ ...environment, VERCEL: "0" }, deps),
  ).rejects.toThrow();
  await expect(
    runDeploymentMigrations(
      {
        ...environment,
        DATABASE_URL_UNPOOLED:
          "postgresql://user:secret@ep-preview-pooler.eu.neon.tech/game",
      },
      deps,
    ),
  ).rejects.toThrow();
  expect(deps.createClient).not.toHaveBeenCalled();
});
it("waits for the migration lock, applies forward migrations transactionally and closes the client", async () => {
  const deps = dependencies();
  await expect(
    runDeploymentMigrations(environment, deps),
  ).resolves.toHaveLength(1);
  expect(deps.createClient).toHaveBeenCalledWith(
    expect.objectContaining({ ssl: { rejectUnauthorized: true } }),
  );
  expect(deps.runner).toHaveBeenCalledWith(
    expect.objectContaining({
      direction: "up",
      singleTransaction: true,
      checkOrder: true,
      advisoryLockMode: "wait",
      noLock: false,
    }),
  );
  expect(deps.client.end).toHaveBeenCalledOnce();
  expect(deps.client.query).toHaveBeenCalledWith("SET TIME ZONE 'UTC'");
});
it("closes the connection and propagates migration failure so the build stops", async () => {
  const deps = dependencies();
  deps.runner.mockRejectedValue(new Error("migration failed"));
  await expect(runDeploymentMigrations(environment, deps)).rejects.toThrow(
    "migration failed",
  );
  expect(deps.client.end).toHaveBeenCalledOnce();
});
