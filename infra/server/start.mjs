import { loadEnvironment } from "../environment.mjs";
import { checkRuntime } from "../runtime.mjs";
import { createApplicationServer } from "./app.mjs";
checkRuntime();
loadEnvironment(process.env.APP_ENV ?? "development");
if (!process.env.PASSWORD_PEPPER) throw new Error("Run npm run setup:env.");
const origins = (
  process.env.APP_ORIGINS ?? "http://localhost:5173,http://127.0.0.1:5173"
).split(",");
if (
  process.env.NODE_ENV === "production" &&
  (!process.env.APP_ORIGINS || origins.some((o) => !o.startsWith("https://")))
)
  throw new Error("HTTPS APP_ORIGINS required in production.");
const server = createApplicationServer(origins);
server.listen(Number(process.env.API_PORT ?? 3002), "127.0.0.1", () =>
  console.log("Paradox Cards API ready."),
);
server.on("error", () => {
  console.error("API failed to start. Check API_PORT.");
  process.exitCode = 1;
});
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => server.close(() => process.exit()));
