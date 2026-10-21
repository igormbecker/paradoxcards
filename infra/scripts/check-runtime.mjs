import { checkRuntime } from "../runtime.mjs";
try {
  checkRuntime();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
