// Node-only adapter. Never import this module from src/game or browser code.
import pg from "pg";
import { connectionOptions } from "./environment.mjs";
export async function getNewClient() {
  const client = new pg.Client(connectionOptions());
  try {
    await client.connect();
    return client;
  } catch (error) {
    await client.end().catch(() => {});
    throw error;
  }
}
export async function query(queryObject) {
  const client = await getNewClient();
  try {
    return await client.query(queryObject);
  } finally {
    await client.end();
  }
}
