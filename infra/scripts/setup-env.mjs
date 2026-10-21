import { randomBytes } from "node:crypto";
import { readFile, appendFile } from "node:fs/promises";
import { copyFile } from "node:fs/promises";
import { constants } from "node:fs";
for (const [source, target] of [
  [".env.example", ".env.development"],
  [".env.test.example", ".env.test"],
]) {
  try {
    await copyFile(source, target, constants.COPYFILE_EXCL);
    console.log(`Created ${target}.`);
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
  }
}

for (const path of [".env.development", ".env.test"]) {
  let content = await readFile(path, "utf8");
  // Normaliza somente os delimitadores inseridos pela primeira versão deste setup.
  if (content.includes("\\nPASSWORD_PEPPER=")) {
    content = content
      .replace("\\nPASSWORD_PEPPER=", "\nPASSWORD_PEPPER=")
      .replace(/\\n$/, "\n");
    await import("node:fs/promises").then((fs) => fs.writeFile(path, content));
  }
  if (!/^PASSWORD_PEPPER=.+$/m.test(content))
    await appendFile(
      path,
      `\nPASSWORD_PEPPER=${randomBytes(48).toString("hex")}\n`,
    );
}
