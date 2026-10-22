import { isIP } from "node:net";
import { createApplicationHandler } from "./app.mjs";
import { deploymentOrigins, validateDeployment } from "../deployment.mjs";
export function createDeploymentHandler(environment = process.env) {
  validateDeployment(environment);
  return createApplicationHandler(deploymentOrigins(environment), {
    clientAddress: (request) => deploymentClientAddress(request, environment),
  });
}

export function deploymentClientAddress(request, environment = process.env) {
  // Vercel overwrites x-forwarded-for at its edge. Local servers never trust it.
  const forwarded = request.headers["x-forwarded-for"];
  const address =
    typeof forwarded === "string" ? forwarded.split(",")[0].trim() : "";
  return environment.VERCEL === "1" && isIP(address)
    ? address
    : (request.socket.remoteAddress ?? "local");
}
