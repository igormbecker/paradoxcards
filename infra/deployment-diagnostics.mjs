const configurationCodes = new Map([
  ["Deployment environment required.", "VERCEL_ENV_INVALID"],
  ["Vercel production or preview required.", "VERCEL_ENV_INVALID"],
  ["PASSWORD_PEPPER required.", "PASSWORD_PEPPER_REQUIRED"],
  ["HTTPS APP_ORIGINS required for deployment.", "APP_ORIGINS_INVALID"],
  [
    "HTTPS APP_ORIGINS or preview deployment hostname required.",
    "APP_ORIGINS_OR_VERCEL_URL_REQUIRED",
  ],
  ["Invalid preview hostname.", "VERCEL_URL_INVALID"],
  ["Resend configuration required.", "RESEND_CONFIGURATION_INVALID"],
  ["Preview email allowlist required.", "EMAIL_PREVIEW_RECIPIENTS_INVALID"],
  ["Missing or invalid Neon connection.", "NEON_CONNECTION_URL_INVALID"],
  ["Invalid Neon connection.", "NEON_CONNECTION_URL_INVALID"],
]);
const databaseCodes = new Set([
  "28P01",
  "28000",
  "3D000",
  "42501",
  "42P01",
  "42P07",
  "42701",
  "23505",
  "22001",
  "55P03",
  "53300",
  "57P03",
  "57014",
  "ENOTFOUND",
  "EAI_AGAIN",
  "ECONNREFUSED",
  "ECONNRESET",
  "ETIMEDOUT",
  "CERT_HAS_EXPIRED",
  "DEPTH_ZERO_SELF_SIGNED_CERT",
  "SELF_SIGNED_CERT_IN_CHAIN",
  "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
  "ERR_TLS_CERT_ALTNAME_INVALID",
]);
export function deploymentFailure(error, phase) {
  // Never include provider messages, stack traces, SQL, URLs or environment values.
  const code =
    configurationCodes.get(error?.message) ??
    (databaseCodes.has(error?.code) ? error.code : "UNKNOWN_ERROR");
  return `Deployment failed at ${phase} (${code}). Check this environment's configuration and pending migrations. Build stopped.`;
}
