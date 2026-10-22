import { randomBytes, randomUUID, createHash, createHmac } from "node:crypto";
import bcrypt from "bcryptjs";
import { query } from "../database.mjs";
import { sessionWindow, renewalNeeded, canRenew } from "./policy.mjs";
export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
export const fail = (status, code, message) => {
  throw new ApiError(status, code, message);
};
export const digest = (value) =>
  createHash("sha256").update(value).digest("hex");
function pepper(password) {
  if (!process.env.PASSWORD_PEPPER || process.env.PASSWORD_PEPPER.length < 32)
    throw new Error("PASSWORD_PEPPER missing.");
  return createHmac("sha384", process.env.PASSWORD_PEPPER)
    .update(password)
    .digest("base64");
}
const emailValue = (value) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";
// Administrative provisioning; public registration is not exposed.
export async function createUser(email, password, profile = {}, options = {}) {
  email = emailValue(email);
  const id = randomUUID();
  const validProfile =
    profile &&
    typeof profile === "object" &&
    !Array.isArray(profile) &&
    Object.keys(profile).every((key) => ["name", "username"].includes(key));
  const name =
    validProfile && profile.name === undefined
      ? "Player"
      : typeof profile?.name === "string"
        ? profile.name.trim()
        : "";
  const username =
    validProfile && profile.username === undefined
      ? `player_${id.replaceAll("-", "").slice(0, 23)}`
      : typeof profile?.username === "string"
        ? profile.username.trim()
        : "";
  if (
    !options ||
    typeof options !== "object" ||
    Array.isArray(options) ||
    Object.keys(options).some((key) => key !== "isAdmin") ||
    (options.isAdmin !== undefined && typeof options.isAdmin !== "boolean") ||
    !validProfile ||
    !name ||
    name.length > 255 ||
    !/^[a-zA-Z0-9_.-]{1,30}$/.test(username) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    email.length > 254 ||
    typeof password !== "string" ||
    password.length < 8 ||
    password.length > 128
  )
    fail(
      400,
      "INVALID_ACCOUNT",
      "Dados de conta inválidos. Confira nome, username, e-mail e senha de 8 a 128 caracteres.",
    );
  const hash = await bcrypt.hash(pepper(password), 12);
  await query({
    text: "INSERT INTO paradox.users(id,email,password_hash,name,username,email_verification_required,is_admin) VALUES($1,$2,$3,$4,$5,false,$6)",
    values: [id, email, hash, name, username, options.isAdmin ?? false],
  });
  return { id, email, name, username };
}
async function limit(key) {
  const row = (
    await query({
      text: `INSERT INTO paradox.login_limits(key,attempts,reset_at) VALUES($1,1,now()+interval '15 minutes') ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN paradox.login_limits.reset_at<=now() THEN 1 ELSE paradox.login_limits.attempts+1 END,reset_at=CASE WHEN paradox.login_limits.reset_at<=now() THEN now()+interval '15 minutes' ELSE paradox.login_limits.reset_at END RETURNING attempts`,
      values: [key],
    })
  ).rows[0];
  if (row.attempts > 20)
    fail(429, "RATE_LIMIT", "Muitas tentativas. Aguarde 15 minutos.");
}
export async function login(email, password, address) {
  email = emailValue(email);
  await limit(digest("ip:" + address));
  await limit(digest("email:" + email));
  const valid =
    typeof password === "string" &&
    password.length <= 128 &&
    email.length <= 254;
  const user = valid
    ? (
        await query({
          text: "SELECT * FROM paradox.users WHERE email=$1",
          values: [email],
        })
      ).rows[0]
    : null;
  // Mesmo trabalho criptográfico para contas inexistentes; não revela qual credencial falhou.
  const hash =
    user?.password_hash ??
    "$2b$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";
  const ok = await bcrypt.compare(pepper(valid ? password : "invalid"), hash);
  if (!user || !ok)
    fail(401, "INVALID_CREDENTIALS", "E-mail ou senha inválidos.");
  const token = randomBytes(48).toString("hex"),
    now = Date.now(),
    window = sessionWindow(now);
  const session = (
    await query({
      text: "INSERT INTO paradox.sessions(id,user_id,token_hash,created_at,renewed_at,expires_at,absolute_expires_at) VALUES($1,$2,$3,$4,$4,$5,$6) RETURNING *",
      values: [
        randomUUID(),
        user.id,
        digest(token),
        new Date(now),
        new Date(window.expiresAt),
        new Date(window.absoluteAt),
      ],
    })
  ).rows[0];
  return { token, session, user: { id: user.id, email: user.email } };
}
export async function authenticate(token, touch = false) {
  if (typeof token !== "string" || !/^[a-f0-9]{96}$/.test(token))
    fail(401, "UNAUTHENTICATED", "Entre na sua conta para continuar.");
  let session = (
    await query({
      text: "SELECT s.*,u.email FROM paradox.sessions s JOIN paradox.users u ON u.id=s.user_id WHERE token_hash=$1 AND expires_at>now() AND absolute_expires_at>now()",
      values: [digest(token)],
    })
  ).rows[0];
  if (
    !session ||
    !canRenew(
      {
        expiresAt: +session.expires_at,
        absoluteAt: +session.absolute_expires_at,
      },
      Date.now(),
    )
  )
    fail(
      401,
      "SESSION_EXPIRED",
      "Sua sessão expirou. Entre novamente para retomar a partida.",
    );
  if (touch && renewalNeeded(+session.renewed_at, Date.now())) {
    const updated = (
      await query({
        text: "UPDATE paradox.sessions SET renewed_at=now(),expires_at=LEAST(now()+interval '24 hours',absolute_expires_at) WHERE id=$1 AND expires_at>now() AND absolute_expires_at>now() RETURNING *",
        values: [session.id],
      })
    ).rows[0];
    if (!updated) fail(401, "SESSION_EXPIRED", "Sua sessão expirou.");
    session = { ...session, ...updated };
  }
  return session;
}
export function sessionCookie(token, session) {
  return `paradox_session=${token}; Path=/api; HttpOnly; SameSite=Lax; Max-Age=${Math.max(0, Math.floor((+session.expires_at - Date.now()) / 1000))}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
}
export function clearCookie() {
  return `paradox_session=; Path=/api; HttpOnly; SameSite=Lax; Max-Age=0${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
}
