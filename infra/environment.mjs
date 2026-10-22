import dotenv from "dotenv";
import { expand } from "dotenv-expand";
import { validateDeployment } from "./deployment.mjs";
export function loadEnvironment(mode = "development") {
  if (["production", "preview"].includes(mode)) {
    if (process.env.VERCEL_ENV !== mode)
      throw new Error("Deployment environment mismatch.");
    validateDeployment();
    return;
  }
  if (!["development", "test"].includes(mode))
    throw new Error("Unsupported local environment.");
  const loaded = dotenv.config({ path: `.env.${mode}`, quiet: true });
  if (loaded.error)
    throw new Error(`Missing .env.${mode}. Run npm run setup:env.`);
  expand(loaded);
}
export function connectionOptions(environment = process.env, direct = false) {
  if (["production", "preview"].includes(environment.VERCEL_ENV)) {
    let url;
    try {
      url = new URL(
        direct ? environment.DATABASE_URL_UNPOOLED : environment.DATABASE_URL,
      );
    } catch {
      throw new Error("Missing or invalid Neon connection.");
    }
    if (
      !["postgres:", "postgresql:"].includes(url.protocol) ||
      !url.hostname.endsWith(".neon.tech") ||
      !url.username ||
      !url.password ||
      url.pathname.length < 2 ||
      (direct && url.hostname.includes("-pooler."))
    )
      throw new Error("Invalid Neon connection.");
    for (const key of ["sslmode", "sslcert", "sslkey", "sslrootcert", "ssl"])
      url.searchParams.delete(key);
    return {
      connectionString: url.toString(),
      ssl: { rejectUnauthorized: true },
      connectionTimeoutMillis: 15000,
    };
  }
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
