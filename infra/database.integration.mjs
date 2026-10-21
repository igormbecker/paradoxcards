import assert from "node:assert/strict";
import { runner } from "node-pg-migrate";
import { loadEnvironment } from "./environment.mjs";
import { getNewClient, query } from "./database.mjs";
loadEnvironment("test");
if (
  process.env.POSTGRES_DB !== "paradoxcards_test" ||
  process.env.POSTGRES_PORT !== "5435" ||
  process.env.POSTGRES_HOST !== "127.0.0.1"
)
  throw new Error(
    "Integration tests require the isolated local test database.",
  );
const client = await getNewClient();
const options = {
  dbClient: client,
  dir: "infra/migrations",
  migrationsTable: "pgmigrations",
  singleTransaction: true,
  checkOrder: true,
  log: () => {},
};
try {
  await runner({ ...options, direction: "up" });
  assert.equal(
    (
      await query(
        "SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'paradox'",
      )
    ).rowCount,
    1,
  );
  assert.equal((await runner({ ...options, direction: "up" })).length, 0);
  assert.equal(
    (await query({ text: "SELECT $1::int AS value", values: [42] })).rows[0]
      .value,
    42,
  );
  await runner({ ...options, direction: "down", count: Infinity });
  assert.equal(
    (
      await query(
        "SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'paradox'",
      )
    ).rowCount,
    0,
  );
  await runner({ ...options, direction: "up" });
  console.log(
    "Database integration passed: query, migration up, idempotency, down and reapply.",
  );
} finally {
  await client.end();
}
