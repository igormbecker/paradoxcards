export function deploymentOrigins(environment = process.env) {
  const origins = (environment.APP_ORIGINS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (
    origins.some((origin) => {
      try {
        const url = new URL(origin);
        return (
          url.protocol !== "https:" ||
          url.origin !== origin ||
          !!url.username ||
          !!url.password
        );
      } catch {
        return true;
      }
    })
  )
    throw new Error("HTTPS APP_ORIGINS required for deployment.");
  // Only this deployment's generated URL is trusted; never a *.vercel.app wildcard.
  if (environment.VERCEL_ENV === "preview" && environment.VERCEL_URL) {
    const host = environment.VERCEL_URL;
    if (!/^[a-z0-9-]+\.vercel\.app$/.test(host))
      throw new Error("Invalid preview hostname.");
    origins.push(`https://${host}`);
  }
  if (!origins.length)
    throw new Error(
      "HTTPS APP_ORIGINS or preview deployment hostname required.",
    );
  return [...new Set(origins)];
}
export function validateDeployment(environment = process.env) {
  if (!["production", "preview"].includes(environment.VERCEL_ENV))
    throw new Error("Deployment environment required.");
  if ((environment.PASSWORD_PEPPER ?? "").length < 32)
    throw new Error("PASSWORD_PEPPER required.");
  deploymentOrigins(environment);
  // Email is provisioned now; no public email endpoint is introduced.
  if (
    !environment.RESEND_API_KEY ||
    !environment.EMAIL_FROM ||
    /[\r\n]/.test(environment.EMAIL_FROM)
  )
    throw new Error("Resend configuration required.");
  if (
    environment.VERCEL_ENV === "preview" &&
    !(environment.EMAIL_PREVIEW_RECIPIENTS ?? "")
      .split(",")
      .every((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))
  )
    throw new Error("Preview email allowlist required.");
}
