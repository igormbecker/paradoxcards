import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath, pathToFileURL } from "node:url";
import { expect, it } from "vitest";
// @ts-expect-error Build-only JavaScript module.
import { buildServer } from "./scripts/build-server.mjs";

it("boots the emitted API outside the source tree without tsx or TypeScript loading", async () => {
  const directory = await mkdtemp(join(tmpdir(), "paradox-server-bundle-"));
  try {
    await buildServer(directory);
    await symlink(
      fileURLToPath(new URL("../node_modules", import.meta.url)),
      join(directory, "node_modules"),
      "dir",
    );
    const artifact = join(directory, "handler.mjs");
    const output = await readFile(artifact, "utf8");
    expect(output).not.toMatch(/from\s+["'][^"']*\.ts["']/);
    const script = `
      import { createServer } from 'node:http';
      import handler from ${JSON.stringify(pathToFileURL(artifact).href)};
      Object.assign(process.env, {
        VERCEL_ENV: 'preview', VERCEL_URL: 'playparadox-smoke.vercel.app',
        PASSWORD_PEPPER: 'x'.repeat(64), RESEND_API_KEY: 'placeholder',
        EMAIL_FROM: 'Paradox <test@example.com>', EMAIL_PREVIEW_RECIPIENTS: 'test@example.com'
      });
      const server = createServer(handler);
      await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
      try {
        const base = 'http://127.0.0.1:' + server.address().port;
        const health = await fetch(base + '/api/health');
        const session = await fetch(base + '/api/v1/session');
        if (health.status !== 200 || !(await health.json()).ok || session.status !== 401) throw new Error('Bundle smoke failed');
        console.log('BUNDLE_OK');
      } finally { await new Promise(resolve => server.close(resolve)); }
    `;
    const result = await promisify(execFile)(
      process.execPath,
      [
        "--no-experimental-strip-types",
        "--input-type=module",
        "--eval",
        script,
      ],
      { cwd: directory },
    );
    expect(result.stdout).toContain("BUNDLE_OK");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}, 20000);
