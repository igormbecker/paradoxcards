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
