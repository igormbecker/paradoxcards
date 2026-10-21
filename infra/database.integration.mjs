import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
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
// Start from a non-UTC server/session default to verify the adapter overrides it.
const previousPgOptions = process.env.PGOPTIONS;
process.env.PGOPTIONS = "-c timezone=America/Sao_Paulo";
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
  assert.equal((await client.query("SHOW TimeZone")).rows[0].TimeZone, "UTC");
  await runner({ ...options, direction: "up" });
  const timestampColumns = await client.query(`
    SELECT table_name || '.' || column_name AS name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'paradox' AND data_type LIKE 'timestamp%'
    ORDER BY name
  `);
  assert.deepEqual(
    timestampColumns.rows.map((column) => column.name),
    [
      "action_receipts.created_at",
      "login_limits.reset_at",
      "sessions.absolute_expires_at",
      "sessions.created_at",
      "sessions.expires_at",
      "sessions.renewed_at",
      "user_matches.lease_expires_at",
      "users.created_at",
    ],
  );
  assert.ok(
    timestampColumns.rows.every(
      (column) => column.data_type === "timestamp with time zone",
    ),
  );
  await client.query("BEGIN");
  try {
    for (const zone of ["UTC", "America/Sao_Paulo", "America/New_York"]) {
      await client.query("SELECT set_config('TimeZone', $1, true)", [zone]);
      const userId = randomUUID();
      const created = await client.query({
        text: "INSERT INTO paradox.users(id,email,password_hash) VALUES($1,$2,'timezone-test') RETURNING created_at = now() AS correct_instant",
        values: [userId, `${userId}@timezone.test`],
      });
      assert.equal(created.rows[0].correct_instant, true, zone);
      assert.equal(
        (
          await client.query({
            text: "INSERT INTO paradox.user_matches(user_id,state) VALUES($1,'{}') RETURNING lease_expires_at = now() AS correct_instant",
            values: [userId],
          })
        ).rows[0].correct_instant,
        true,
        zone,
      );
      assert.equal(
        (
          await client.query({
            text: "INSERT INTO paradox.action_receipts(user_id,request_id,fingerprint,response) VALUES($1,$2,'timezone-test','{}') RETURNING created_at = now() AS correct_instant",
            values: [userId, randomUUID()],
          })
        ).rows[0].correct_instant,
        true,
        zone,
      );
      const dates = (
        await client.query({
          text: "SELECT $1::timestamptz AS instant, extract(epoch FROM ((now() + interval '24 hours') - now()))::int AS session_seconds, extract(epoch FROM ((now() + interval '60 seconds') - now()))::int AS lease_seconds",
          values: ["2026-10-21T12:00:00-03:00"],
        })
      ).rows[0];
      assert.equal(dates.instant.toISOString(), "2026-10-21T15:00:00.000Z");
      assert.equal(dates.session_seconds, 86400);
      assert.equal(dates.lease_seconds, 60);
    }
  } finally {
    await client.query("ROLLBACK");
  }
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
    "Database integration passed: UTC connections, timestamptz schema, cross-timezone defaults and durations, query, migration up, idempotency, down and reapply.",
  );
} finally {
  if (previousPgOptions === undefined) delete process.env.PGOPTIONS;
  else process.env.PGOPTIONS = previousPgOptions;
  await client.end();
}
