import { loadEnvironment } from "../environment.mjs";
import { query } from "../database.mjs";
import { createUser } from "../auth/service.mjs";
loadEnvironment("test");
if (
  process.env.POSTGRES_DB !== "paradoxcards_test" ||
  process.env.POSTGRES_PORT !== "5435"
)
  throw new Error("Test database required.");
await query("DELETE FROM paradox.login_limits");
if (
  !(
    await query({
      text: "SELECT id FROM paradox.users WHERE email=$1",
      values: ["player@paradox.test"],
    })
  ).rowCount
)
  await createUser("player@paradox.test", "Paradox-test-123");
