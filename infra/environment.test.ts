import { expect, it } from "vitest";
// @ts-expect-error Node-only JavaScript adapter has no declaration file.
import { connectionOptions } from "./environment.mjs";
it("valida configuração sem depender de um banco", () => {
  expect(() => connectionOptions({})).toThrow("Incomplete");
  expect(() =>
    connectionOptions({ POSTGRES_HOST: "localhost", POSTGRES_PORT: "invalid" }),
  ).toThrow();
  expect(
    connectionOptions({
      POSTGRES_HOST: "127.0.0.1",
      POSTGRES_PORT: "5434",
      POSTGRES_USER: "local",
      POSTGRES_PASSWORD: "local",
      POSTGRES_DB: "game",
    }),
  ).toMatchObject({
    port: 5434,
    database: "game",
    connectionTimeoutMillis: 5000,
  });
});
