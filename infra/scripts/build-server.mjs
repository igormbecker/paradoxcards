import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";

const root = fileURLToPath(new URL("../../", import.meta.url));

export async function buildServer(outDir = resolve(root, ".server-build")) {
  await build({
    configFile: false,
    root,
    logLevel: "warn",
    build: {
      ssr: "infra/server/entry.mjs",
      target: "node24",
      outDir,
      emptyOutDir: true,
      copyPublicDir: false,
      rollupOptions: {
        output: { entryFileNames: "handler.mjs", inlineDynamicImports: true },
      },
    },
  });
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await buildServer();
}
