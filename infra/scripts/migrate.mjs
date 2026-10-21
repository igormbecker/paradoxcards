import { runner } from "node-pg-migrate";
import { loadEnvironment } from "../environment.mjs";
import { getNewClient } from "../database.mjs";
const direction = process.argv[2];
if (!["up", "down"].includes(direction))
  throw new Error("Expected up or down.");
loadEnvironment(process.argv[3] ?? "development");
let client;
try {
  client = await getNewClient();
  const migrations = await runner({
    dbClient: client,
    dir: "infra/migrations",
    direction,
    count: direction === "down" ? 1 : Infinity,
    migrationsTable: "pgmigrations",
    singleTransaction: true,
    checkOrder: true,
    log: () => {},
  });
  console.log(`Migrations ${direction}: ${migrations.length}.`);
} catch {
  console.error("Migration failed. Check the database and migration files.");
  process.exitCode = 1;
} finally {
  await client?.end();
}
