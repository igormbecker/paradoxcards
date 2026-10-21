import { fileURLToPath } from "node:url";
import pg from "pg";
import { runner } from "node-pg-migrate";
import { connectionOptions } from "./environment.mjs";
export async function runDeploymentMigrations(
  environment = process.env,
  dependencies = {},
) {
  if (
    environment.VERCEL !== "1" ||
    !["production", "preview"].includes(environment.VERCEL_ENV)
  )
    throw new Error("Vercel production or preview required.");
  const options = connectionOptions(environment, true);
  const client = (
    dependencies.createClient ?? ((config) => new pg.Client(config))
  )(options);
  try {
    await client.connect();
    await client.query("SET TIME ZONE 'UTC'");
    await client.query("SET lock_timeout = '60s'");
    return await (dependencies.runner ?? runner)({
      dbClient: client,
      dir: fileURLToPath(new URL("./migrations", import.meta.url)),
      direction: "up",
      migrationsTable: "pgmigrations",
      singleTransaction: true,
      checkOrder: true,
      noLock: false,
      advisoryLockMode: "wait",
      log: () => {},
    });
  } finally {
    await client.end();
  }
}
