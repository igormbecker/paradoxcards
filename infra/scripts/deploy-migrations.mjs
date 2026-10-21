import { runDeploymentMigrations } from "../deploy-migrations.mjs";
import { validateDeployment } from "../deployment.mjs";
import { connectionOptions } from "../environment.mjs";
try {
  validateDeployment();
  connectionOptions();
  const migrations = await runDeploymentMigrations();
  console.log(`Deployment migrations applied: ${migrations.length}.`);
} catch {
  console.error(
    "Deployment migrations failed. Check environment configuration and pending migrations. Build stopped.",
  );
  process.exitCode = 1;
}
