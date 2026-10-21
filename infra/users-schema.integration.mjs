import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { runner } from "node-pg-migrate";
import { loadEnvironment } from "./environment.mjs";
import { getNewClient } from "./database.mjs";
loadEnvironment("test");
if (
  process.env.POSTGRES_DB !== "paradoxcards_test" ||
  process.env.POSTGRES_PORT !== "5435" ||
  process.env.POSTGRES_HOST !== "127.0.0.1"
)
  throw new Error("Isolated local test database required.");
const client = await getNewClient();
const options = {
  dbClient: client,
  dir: "infra/migrations",
  migrationsTable: "pgmigrations",
  singleTransaction: true,
  checkOrder: true,
  log: () => {},
};
const id = randomUUID();
const email = `${id}@schema.test`;
const hash = "x".repeat(60);
try {
  const columns = (
    await client.query(
      "SELECT column_name, data_type, character_maximum_length FROM information_schema.columns WHERE table_schema='paradox' AND table_name='users'",
    )
  ).rows;
  for (const name of [
    "name",
    "username",
    "updated_at",
    "is_admin",
    "email_verification_required",
    "email_verified_at",
    "email_verification_version",
  ])
    assert.ok(
      columns.some((column) => column.column_name === name),
      name,
    );
  for (const [name, length] of [
    ["name", 255],
    ["username", 30],
    ["email", 254],
    ["password_hash", 60],
  ])
    assert.equal(
      columns.find((column) => column.column_name === name)
        .character_maximum_length,
      length,
    );
  // Downgrade only the new migration, insert a legacy account, then migrate forward.
  await runner({ ...options, direction: "down", count: 1 });
  await client.query({
    text: "INSERT INTO paradox.users(id,email,password_hash,created_at) VALUES($1,$2,$3,'2026-10-20T12:00:00Z')",
    values: [id, email, hash],
  });
  await runner({ ...options, direction: "up" });
  const old = (
    await client.query({
      text: "SELECT * FROM paradox.users WHERE id=$1",
      values: [id],
    })
  ).rows[0];
  assert.equal(old.password_hash, hash);
  assert.equal(old.email, email);
  assert.equal(old.is_admin, false);
  assert.equal(old.email_verification_required, false);
  assert.equal(old.email_verified_at, null);
  assert.equal(old.email_verification_version, 0);
  assert.equal(+old.updated_at, +old.created_at);
  assert.match(old.username, /^[a-zA-Z0-9_.-]{1,30}$/);
  const fresh = (
    await client.query({
      text: "INSERT INTO paradox.users(email,password_hash,name,username,updated_at) VALUES($1,$2,'New Player',$3,now()-interval '1 hour') RETURNING *",
      values: [`new-${email}`, hash, `Test_${id.slice(0, 8)}`],
    })
  ).rows[0];
  assert.ok(fresh.id);
  assert.equal(fresh.is_admin, false);
  assert.equal(fresh.email_verification_required, true);
  await assert.rejects(
    client.query({
      text: "INSERT INTO paradox.users(email,password_hash,username) VALUES($1,$2,$3)",
      values: [`duplicate-${email}`, hash, fresh.username.toLowerCase()],
    }),
    { code: "23505" },
  );
  await client.query({
    text: "UPDATE paradox.users SET email_verified_at=now(),email_verification_required=false WHERE id=$1",
    values: [fresh.id],
  });
  await client.query({
    text: "UPDATE paradox.users SET name='Updated Player' WHERE id=$1",
    values: [fresh.id],
  });
  let updated = (
    await client.query({
      text: "SELECT * FROM paradox.users WHERE id=$1",
      values: [fresh.id],
    })
  ).rows[0];
  assert.ok(+updated.updated_at > +fresh.updated_at);
  assert.ok(updated.email_verified_at);
  await client.query({
    text: "UPDATE paradox.users SET email=$2 WHERE id=$1",
    values: [fresh.id, `changed-${email}`],
  });
  updated = (
    await client.query({
      text: "SELECT * FROM paradox.users WHERE id=$1",
      values: [fresh.id],
    })
  ).rows[0];
  assert.equal(updated.email_verified_at, null);
  assert.equal(updated.email_verification_required, true);
  assert.equal(updated.email_verification_version, 1);
  await client.query({
    text: "DELETE FROM paradox.users WHERE id=$1",
    values: [fresh.id],
  });
  console.log(
    "Users schema integration passed: legacy preservation, profile constraints, UUID defaults, admin defaults, timestamps and email verification reset.",
  );
} finally {
  await client.query({
    text: "DELETE FROM paradox.users WHERE email LIKE $1",
    values: [`%${email}`],
  });
  await client.end();
}
