import { createDeploymentHandler } from "./vercel.mjs";

export default async function handler(request, response) {
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
