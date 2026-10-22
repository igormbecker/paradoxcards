import { createServer } from "node:http";
import { afterEach, expect, it, vi } from "vitest";

const database = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("./database.mjs", () => ({ ...database, getNewClient: vi.fn() }));
// @ts-expect-error Node-only adapter.
import { createApplicationHandler } from "./server/app.mjs";

afterEach(() => vi.resetAllMocks());

async function requestStatus(method = "GET") {
  const server = createServer(createApplicationHandler([]));
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("No address");
  try {
    const response = await fetch(
      `http://127.0.0.1:${address.port}/api/v1/status`,
      { method },
    );
    return {
      status: response.status,
      cache: response.headers.get("cache-control"),
      body: await response.json(),
    };
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

it("reports live database metrics without requiring a session or exposing connection details", async () => {
  database.query.mockResolvedValue({
    rows: [{ version: "17.6", max_connections: 100, opened_connections: 3 }],
  });
  const response = await requestStatus();
  expect(response.status).toBe(200);
  expect(response.cache).toContain("no-store");
  expect(response.body).toEqual({
    updated_at: expect.any(String),
    status: "operational",
    dependencies: {
      database: {
        version: "17.6",
        max_connections: 100,
        opened_connections: 3,
      },
    },
  });
  expect(Number.isNaN(Date.parse(response.body.updated_at))).toBe(false);
  expect(database.query).toHaveBeenCalledOnce();
  expect(database.query.mock.calls[0][0].text).toContain("current_database()");
});

it("returns unavailable instead of healthy when the database query fails", async () => {
  database.query.mockRejectedValue(
    new Error("password=private database=private"),
  );
  const response = await requestStatus();
  expect(response.status).toBe(503);
  expect(response.body.status).toBe("unavailable");
  expect(response.body.dependencies.database).toBeNull();
  expect(JSON.stringify(response.body)).not.toContain("private");
});

it("does not accept writes on the status endpoint", async () => {
  const response = await requestStatus("POST");
  expect(response.status).toBe(405);
  expect(database.query).not.toHaveBeenCalled();
});
