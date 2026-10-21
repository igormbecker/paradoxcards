import { spawn } from "node:child_process";
const children = [];
let exiting = false;
function stop(code = 0) {
  if (exiting) return;
  exiting = true;
  for (const child of children) child.kill("SIGTERM");
  setTimeout(() => process.exit(code), 500).unref();
}
for (const [script, extra] of [
  [
    "dev:api",
    {
      APP_ENV: "test",
      API_PORT: "3003",
      APP_ORIGINS: "http://127.0.0.1:5174,http://localhost:5174",
    },
  ],
  ["dev:client", { API_TARGET: "http://127.0.0.1:3003" }],
]) {
  const args = [
    "run",
    script,
    ...(script === "dev:client" ? ["--", "--port", "5174"] : []),
  ];
  const child = spawn("npm", args, {
    stdio: "inherit",
    env: { ...process.env, ...extra },
  });
  children.push(child);
  child.on("exit", (code) => stop(code ?? 1));
}
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => stop());
