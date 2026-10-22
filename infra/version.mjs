import { execFileSync } from "node:child_process";

export function buildVersion(
  readTag = () =>
    execFileSync(
      "git",
      ["describe", "--tags", "--match", "v[0-9]*", "--long", "--dirty"],
      {
        cwd: new URL("../", import.meta.url),
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      },
    ),
) {
  try {
    const match = readTag()
      .trim()
      .match(
        /^(v\d+\.\d+\.\d+(?:-[\da-zA-Z.-]+)?)-(\d+)-g([a-f0-9]+)(-dirty)?$/,
      );
    if (!match) return null;
    const [, tag, distance, hash, dirty] = match;
    if (distance === "0") return dirty ? `${tag}+working` : tag;
    return `${tag}+${distance}.g${hash}${dirty ? ".dirty" : ""}`;
  } catch {
    return null;
  }
}
