import dotenv from "dotenv";
import { expand } from "dotenv-expand";
export function loadEnvironment(mode = "development") {
  if (!["development", "test"].includes(mode))
    throw new Error("Unsupported local environment.");
  const loaded = dotenv.config({ path: `.env.${mode}`, quiet: true });
  if (loaded.error)
    throw new Error(`Missing .env.${mode}. Run npm run setup:env.`);
  expand(loaded);
}
export function connectionOptions(environment = process.env) {
  const port = Number(environment.POSTGRES_PORT);
  if (
    !environment.POSTGRES_HOST ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535 ||
    !environment.POSTGRES_USER ||
    !environment.POSTGRES_PASSWORD ||
    !environment.POSTGRES_DB
  )
    throw new Error("Incomplete PostgreSQL configuration.");
  return {
    host: environment.POSTGRES_HOST,
    port,
    user: environment.POSTGRES_USER,
    password: environment.POSTGRES_PASSWORD,
    database: environment.POSTGRES_DB,
    connectionTimeoutMillis: 5000,
  };
}
