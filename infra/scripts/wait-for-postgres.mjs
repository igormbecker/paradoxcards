import retry from "async-retry";
import { loadEnvironment } from "../environment.mjs";
import { query } from "../database.mjs";
loadEnvironment(process.argv[2] ?? "development");
try {
  await retry(() => query("SELECT 1"), {
    retries: 30,
    minTimeout: 1000,
    maxTimeout: 1000,
    randomize: false,
  });
  console.log("PostgreSQL ready.");
} catch {
  console.error(
    "PostgreSQL unavailable. Check Docker and local configuration.",
  );
  process.exitCode = 1;
}
