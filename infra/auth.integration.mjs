import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createDeploymentHandler } from "./server/vercel.mjs";
import { randomUUID } from "node:crypto";
import { loadEnvironment } from "./environment.mjs";
import { query } from "./database.mjs";
import { createUser } from "./auth/service.mjs";
import { createApplicationServer } from "./server/app.mjs";
loadEnvironment("test");
if (
  process.env.POSTGRES_DB !== "paradoxcards_test" ||
  process.env.POSTGRES_PORT !== "5435"
)
  throw new Error("Test database required.");
const email = `${randomUUID()}@test.local`,
  password = "Test-password-123";
const profile = {
  name: "Test Player",
  username: `player_${randomUUID().slice(0, 8)}`,
};
const user = await createUser(email, password, profile);
const deployment = process.argv.includes("--deployment");
const origin = deployment
  ? "https://playparadox-preview.vercel.app"
  : "http://localhost:5173";
if (deployment) process.env.NODE_ENV = "production";
const server = deployment
  ? createServer(
      createDeploymentHandler({
        VERCEL_ENV: "preview",
        VERCEL_URL: "playparadox-preview.vercel.app",
        APP_ORIGINS: origin,
        PASSWORD_PEPPER: process.env.PASSWORD_PEPPER,
        RESEND_API_KEY: "not-used-in-tests",
        EMAIL_FROM: "test@paradox.test",
        EMAIL_PREVIEW_RECIPIENTS: "test@paradox.test",
      }),
    )
  : createApplicationServer([origin]);
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}/api/v1`;
let cookie = "";
async function request(
  path,
  body,
  method = body ? "POST" : "GET",
  requestOrigin = origin,
) {
  const response = await fetch(base + path, {
    method,
    headers: {
      Origin: requestOrigin,
      Cookie: cookie,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = response.status === 204 ? null : await response.json();
  return { response, data };
}
try {
  const account = (
    await query({
      text: "SELECT name,username,is_admin,email_verification_required FROM paradox.users WHERE id=$1",
      values: [user.id],
    })
  ).rows[0];
  assert.equal(account.name, profile.name);
  assert.equal(account.username, profile.username);
  assert.equal(account.is_admin, false);
  assert.equal(account.email_verification_required, false);
  const admin = await createUser(
    `admin-${email}`,
    password,
    { ...profile, username: `admin_${randomUUID().slice(0, 8)}` },
    { isAdmin: true },
  );
  try {
    const stored = (
      await query({
        text: "SELECT is_admin FROM paradox.users WHERE id=$1",
        values: [admin.id],
      })
    ).rows[0];
    assert.equal(stored.is_admin, true);
  } finally {
    await query({
      text: "DELETE FROM paradox.users WHERE id=$1",
      values: [admin.id],
    });
  }
  assert.equal((await request("/session")).response.status, 401);
  assert.equal(
    (
      await request(
        "/session",
        { email, password },
        "POST",
        "https://evil.invalid",
      )
    ).response.status,
    403,
  );
  assert.equal(
    (await request("/session", { email, password: "wrong" })).response.status,
    401,
  );
  const login = await request("/session", { email, password });
  assert.equal(login.response.status, 201);
  const header = login.response.headers.get("set-cookie");
  assert.match(header, /HttpOnly/);
  assert.match(header, /SameSite=Lax/);
  if (deployment) assert.match(header, /; Secure/);
  assert.ok(!("token" in login.data));
  cookie = header.split(";")[0];
  assert.equal((await request("/session")).data.user.email, email);
  const stored = (
    await query({
      text: "SELECT * FROM paradox.sessions WHERE user_id=$1",
      values: [user.id],
    })
  ).rows[0];
  assert.notEqual(stored.token_hash, cookie.split("=")[1]);
  assert.equal(
    new Date(stored.absolute_expires_at) - new Date(stored.created_at),
    7 * 86400000,
  );
  await query({
    text: "UPDATE paradox.sessions SET renewed_at=now()-interval '16 minutes',expires_at=now()+interval '1 hour' WHERE id=$1",
    values: [stored.id],
  });
  await request("/session/activity", {});
  assert.ok(
    new Date(
      (
        await query({
          text: "SELECT expires_at FROM paradox.sessions WHERE id=$1",
          values: [stored.id],
        })
      ).rows[0].expires_at,
    ) >
      Date.now() + 23 * 3600000,
  );
  const tabA = randomUUID(),
    tabB = randomUUID();
  const claims = await Promise.all([
    request("/match/control", { tabId: tabA }),
    request("/match/control", { tabId: tabB }),
  ]);
  assert.deepEqual(claims.map((c) => c.response.status).sort(), [200, 409]);
  const winner = claims[0].response.status === 200 ? 0 : 1,
    oldTab = winner === 0 ? tabA : tabB,
    newTab = winner === 0 ? tabB : tabA,
    old = claims[winner].data;
  const transfer = await request("/match/control", {
    tabId: newTab,
    takeover: true,
  });
  assert.equal(transfer.response.status, 200);
  assert.equal(
    (
      await request("/match/heartbeat", {
        tabId: oldTab,
        controlVersion: old.controlVersion,
      })
    ).response.status,
    409,
  );
  const control = {
    tabId: newTab,
    controlVersion: transfer.data.controlVersion,
  };
  const action = {
    ...control,
    revision: transfer.data.revision,
    requestId: randomUUID(),
    action: { type: "opening", indices: [] },
  };
  const first = await request("/match/actions", action);
  assert.equal(first.response.status, 200);
  const repeat = await request("/match/actions", action);
  assert.deepEqual(repeat.data, first.data);
  assert.equal(
    (await request("/match/actions", { ...action, action: { type: "pass" } }))
      .response.status,
    409,
  );
  assert.equal(
    (await request("/match/actions", { ...action, requestId: randomUUID() }))
      .response.status,
    409,
  );
  assert.equal(
    (
      await request("/match/actions", {
        ...action,
        tabId: oldTab,
        controlVersion: old.controlVersion,
      })
    ).response.status,
    409,
  );
  await query({
    text: "UPDATE paradox.user_matches SET lease_expires_at=now()-interval '1 second' WHERE user_id=$1",
    values: [user.id],
  });
  assert.equal(
    (await request("/match/heartbeat", control)).response.status,
    409,
  );
  assert.equal(
    (await request("/match/control", { tabId: oldTab })).response.status,
    200,
  );
  await request("/session", undefined, "DELETE");
  assert.equal((await request("/session")).response.status, 401);
  const second = await request("/session", { email, password });
  cookie = second.response.headers.get("set-cookie").split(";")[0];
  await query({
    text: "UPDATE paradox.sessions SET absolute_expires_at=now()-interval '1 second' WHERE user_id=$1",
    values: [user.id],
  });
  assert.equal((await request("/session/activity", {})).response.status, 401);
  console.log(
    "Auth integration passed: cookie, renewal, expiration, logout, concurrent claims, transfer, fencing, lease and idempotency.",
  );
} finally {
  await new Promise((resolve) => server.close(resolve));
  await query({
    text: "DELETE FROM paradox.users WHERE id=$1",
    values: [user.id],
  });
}
