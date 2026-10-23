import { createServer } from "node:http";
import { getNewClient } from "../database.mjs";
import {
  ApiError,
  fail,
  login,
  authenticate,
  sessionCookie,
  clearCookie,
} from "../auth/service.mjs";
import { matchOperation } from "./matches.mjs";
import { systemStatus } from "./status.mjs";
function cookie(request) {
  return (request.headers.cookie ?? "")
    .split(";")
    .map((v) => v.trim())
    .find((v) => v.startsWith("paradox_session="))
    ?.slice(16);
}
async function readBody(request) {
  if (!request.headers["content-type"]?.startsWith("application/json"))
    fail(415, "JSON_REQUIRED", "Envie JSON.");
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (Buffer.byteLength(body) > 8192)
      fail(413, "BODY_TOO_LARGE", "Solicitação muito grande.");
  }
  try {
    const parsed = JSON.parse(body || "{}");
    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object")
      throw new Error();
    return parsed;
  } catch {
    fail(400, "INVALID_JSON", "JSON inválido.");
  }
}
export function createApplicationServer(origins) {
  return createServer(createApplicationHandler(origins));
}
export function createApplicationHandler(origins, options = {}) {
  return async (request, response) => {
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.setHeader("Cache-Control", "private, no-store");
    response.setHeader("X-Content-Type-Options", "nosniff");
    const send = (status, data) => {
      response.statusCode = status;
      response.end(status === 204 ? undefined : JSON.stringify(data));
    };
    try {
      const path = new URL(request.url, "http://localhost").pathname,
        method = request.method;
      if (method === "GET" && path === "/api/health") {
        send(200, { ok: true });
        return;
      }
      if (path === "/api/v1/status") {
        if (method !== "GET") {
          response.setHeader("Allow", "GET");
          fail(405, "METHOD_NOT_ALLOWED", "Método não permitido.");
        }
        const status = await systemStatus();
        send(status.code, status.body);
        return;
      }
      if (!["GET", "POST", "DELETE"].includes(method))
        fail(405, "METHOD_NOT_ALLOWED", "Método não permitido.");
      if (method !== "GET" && !origins.includes(request.headers.origin))
        fail(403, "ORIGIN_REJECTED", "Origem não permitida.");
      const body = method === "POST" ? await readBody(request) : {};
      if (path === "/api/v1/session" && method === "POST") {
        const result = await login(
          body.email,
          body.password,
          options.clientAddress
            ? options.clientAddress(request)
            : (request.socket.remoteAddress ?? "local"),
        );
        response.setHeader(
          "Set-Cookie",
          sessionCookie(result.token, result.session),
        );
        send(201, {
          user: result.user,
          expiresAt: result.session.expires_at,
          absoluteExpiresAt: result.session.absolute_expires_at,
        });
        return;
      }
      const token = cookie(request);
      const session = await authenticate(
        token,
        method === "POST" && path !== "/api/v1/match/heartbeat",
      );
      if (method === "POST" && path !== "/api/v1/match/heartbeat")
        response.setHeader("Set-Cookie", sessionCookie(token, session));
      if (path === "/api/v1/session" && method === "DELETE") {
        const client = await getNewClient();
        try {
          await client.query("BEGIN");
          await client.query("DELETE FROM paradox.sessions WHERE id=$1", [
            session.id,
          ]);
          await client.query("COMMIT");
        } catch (e) {
          await client.query("ROLLBACK");
          throw e;
        } finally {
          await client.end();
        }
        response.setHeader("Set-Cookie", clearCookie());
        send(204);
        return;
      }
      if (
        (path === "/api/v1/session" && method === "GET") ||
        (path === "/api/v1/session/activity" && method === "POST")
      ) {
        send(200, {
          user: {
            id: session.user_id,
            email: session.email,
            username: session.username,
          },
          expiresAt: session.expires_at,
          absoluteExpiresAt: session.absolute_expires_at,
        });
        return;
      }
      const operations = {
        "GET /api/v1/match": "read",
        "POST /api/v1/match/control": "claim",
        "POST /api/v1/match/heartbeat": "heartbeat",
        "POST /api/v1/match/actions": "action",
      };
      const operation = operations[`${method} ${path}`];
      if (!operation) fail(404, "NOT_FOUND", "Recurso não encontrado.");
      send(200, await matchOperation(session, operation, body));
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401)
          response.setHeader("Set-Cookie", clearCookie());
        send(error.status, { code: error.code, message: error.message });
      } else {
        console.error(
          "API operation failed:",
          /^[A-Z0-9_]{2,30}$/.test(error.code ?? "")
            ? error.code
            : "INTERNAL_ERROR",
        );
        send(500, {
          code: "INTERNAL_ERROR",
          message: "Não foi possível concluir. Tente novamente.",
        });
      }
    }
  };
}
