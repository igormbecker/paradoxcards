import type { IncomingMessage, ServerResponse } from "node:http";
// @ts-expect-error Node-only JavaScript adapter has no declaration file.
import { createDeploymentHandler } from "../infra/server/vercel.mjs";
export default async function handler(
  request: IncomingMessage,
  response: ServerResponse,
) {
  try {
    await createDeploymentHandler()(request, response);
  } catch {
    response.statusCode = 503;
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.end(
      JSON.stringify({
        code: "SERVICE_UNAVAILABLE",
        message: "Serviço indisponível.",
      }),
    );
  }
}
