import { query } from "../database.mjs";

export async function systemStatus() {
  const updated_at = new Date().toISOString();
  try {
    const result = await query({
      text: `SELECT current_setting('server_version') AS version,
        current_setting('max_connections')::int AS max_connections,
        (SELECT COUNT(*)::int FROM pg_stat_activity
         WHERE datname = current_database()) AS opened_connections`,
      query_timeout: 3000,
    });
    const database = result.rows[0];
    if (
      !database?.version ||
      !Number.isInteger(database.max_connections) ||
      database.max_connections <= 0 ||
      !Number.isInteger(database.opened_connections) ||
      database.opened_connections < 0
    )
      throw new Error("Invalid status result");
    return {
      code: 200,
      body: { updated_at, status: "operational", dependencies: { database } },
    };
  } catch {
    return {
      code: 503,
      body: {
        updated_at,
        status: "unavailable",
        dependencies: { database: null },
      },
    };
  }
}
