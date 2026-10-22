import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
const manifest = JSON.parse(
  readFileSync(new URL("../../package.json", import.meta.url), "utf8"),
);
const major = manifest.engines.node.split(".")[0];
if (
  process.env.VERCEL !== "1" ||
  process.versions.node.split(".")[0] !== major
) {
  console.error(
    `Vercel build requires Node ${major}.x. Local setup must use npm run setup.`,
  );
  process.exitCode = 1;
} else {
  // Vercel manages Node patches. Keep local engines strict and npm pinned.
  const result = spawnSync(
    "npx",
    ["--yes", `npm@${manifest.engines.npm}`, "ci"],
    {
      stdio: "inherit",
      env: { ...process.env, npm_config_engine_strict: "false" },
    },
  );
  process.exitCode = result.status ?? 1;
}
