import { readFileSync } from "node:fs";
export function validateRuntime(current, required) {
  if (current.replace(/^v/, "") !== required.trim())
    throw new Error(
      `Node ${current} incompatível. Este projeto exige ${required.trim()}. Execute nvm install e nvm use nesta pasta.`,
    );
}
export function checkRuntime() {
  validateRuntime(
    process.version,
    readFileSync(new URL("../.nvmrc", import.meta.url), "utf8"),
  );
}
