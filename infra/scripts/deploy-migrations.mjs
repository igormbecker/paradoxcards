import { runDeploymentMigrations } from "../deploy-migrations.mjs";
import { validateDeployment } from "../deployment.mjs";
import { connectionOptions } from "../environment.mjs";
import { deploymentFailure } from "../deployment-diagnostics.mjs";
let phase = "configuration";
try {
  validateDeployment();
  phase = "pooled-database-url";
  connectionOptions();
  const migrations = await runDeploymentMigrations(process.env, {
    onPhase: (value) => {
      phase = value;
    },
  });
  console.log(`Deployment migrations applied: ${migrations.length}.`);
} catch (error) {
  console.error(deploymentFailure(error, phase));
  process.exitCode = 1;
}
