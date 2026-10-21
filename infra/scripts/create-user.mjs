import { createInterface } from "node:readline/promises";
import { loadEnvironment } from "../environment.mjs";
import { createUser } from "../auth/service.mjs";
loadEnvironment(process.env.APP_ENV ?? "development");
async function hiddenPassword() {
  if (!process.stdin.isTTY) throw new Error("Use an interactive terminal.");
  process.stdout.write("Senha (8 a 128 caracteres): ");
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding("utf8");
  return new Promise((resolve, reject) => {
    let value = "";
    const cleanup = () => {
      process.stdin.removeListener("data", onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write("\n");
    };
    const onData = (chunk) => {
      for (const character of chunk) {
        if (character === "\r" || character === "\n") {
          cleanup();
          resolve(value);
          return;
        }
        if (character === "\u0003") {
          cleanup();
          reject(new Error("Cancelled"));
          return;
        }
        if (character === "\u007f" || character === "\b") {
          value = value.slice(0, -1);
          continue;
        }
        if (character >= " " && character !== "\u001b" && value.length < 128)
          value += character;
      }
    };
    process.stdin.on("data", onData);
  });
}
try {
  const input = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const name = await input.question("Nome: ");
  const username = await input.question("Username (1 a 30 caracteres): ");
  const email = await input.question("E-mail: ");
  input.close();
  const password = await hiddenPassword();
  await createUser(email, password, { name, username });
  console.log("Conta criada.");
} catch {
  console.error(
    "Conta não criada. Confira o banco, nome, username e e-mail únicos e senha de 8 a 128 caracteres.",
  );
  process.exitCode = 1;
}
