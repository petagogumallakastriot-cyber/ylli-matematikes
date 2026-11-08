import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { validateNeonUrl } from "./database.mjs";
import express from "../../artifacts/api-server/node_modules/express/index.js";

test("accepts only Neon PostgreSQL with TLS and never discloses a rejected URL", () => {
  assert.doesNotThrow(() => validateNeonUrl("postgresql://test:dummy@ep-test.eu-central-1.aws.neon.tech/db?sslmode=require"));
  for (const url of [undefined, "oops", "postgres://test:dummy@localhost/db", "https://ep-test.neon.tech/db?sslmode=require", "postgresql://ep-test.neon.tech/db"]) {
    assert.throws(() => validateNeonUrl(url), (error) => !error.message.includes("dummy"));
  }
});

test("Render blueprint creates only a free service and disables automatic deploys", async () => {
  const blueprint = await readFile(new URL("../../render.yaml", import.meta.url), "utf8");
  assert.equal([...blueprint.matchAll(/^\s+- type: web$/gm)].length, 1);
  assert.match(blueprint, /^\s+plan: free$/m);
  assert.match(blueprint, /^\s+autoDeployTrigger: "off"$/m);
  assert.doesNotMatch(blueprint, /^databases:/m);
});

test("combined server serves deep links and assets, not HTML for unknown API routes", async () => {
  const require = createRequire(new URL("../../artifacts/api-server/package.json", import.meta.url));
  const { transformSync } = require("esbuild");
  const source = await readFile(new URL("../../artifacts/api-server/src/lib/portable-web.ts", import.meta.url), "utf8");
  const { code } = transformSync(source, { loader: "ts", format: "cjs" });
  const mod = { exports: {} };
  new Function("require", "module", "exports", code)(require, mod, mod.exports);
  const before = process.env.SERVE_WEB;
  process.env.SERVE_WEB = "true";
  const app = express();
  mod.exports.servePortableWeb(app);
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  try {
    const origin = `http://127.0.0.1:${server.address().port}`;
    for (const route of ["/", "/profili", "/mesim/1/1"]) {
      const response = await fetch(origin + route);
      assert.equal(response.status, 200);
      assert.match(await response.text(), /<div id="root"><\/div>/);
      assert.equal(response.headers.get("cache-control"), "no-store");
    }
    const missing = await fetch(origin + "/api/missing");
    assert.equal(missing.status, 404);
    assert.match(missing.headers.get("content-type"), /application\/json/);
    assert.equal((await fetch(origin + "/missing.js")).status, 404);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    if (before === undefined) delete process.env.SERVE_WEB;
    else process.env.SERVE_WEB = before;
  }
});

test("initial migration matches the exported Drizzle tables and columns", async () => {
  const sql = await readFile(new URL("./migrations/0001_initial.sql", import.meta.url), "utf8");
  const require = createRequire(new URL("../../lib/db/package.json", import.meta.url));
  const { buildSync } = createRequire(new URL("../../artifacts/api-server/package.json", import.meta.url))("esbuild");
  const { getTableConfig } = require("drizzle-orm/pg-core");
  const { fileURLToPath } = require("node:url");
  const result = buildSync({
    entryPoints: [fileURLToPath(new URL("../../lib/db/src/schema/index.ts", import.meta.url))],
    bundle: true, platform: "node", format: "cjs", packages: "external", write: false,
  });
  const mod = { exports: {} };
  new Function("require", "module", "exports", result.outputFiles[0].text)(require, mod, mod.exports);
  let count = 0;
    for (const [key, value] of Object.entries(mod.exports)) {
      if (!key.startsWith("math")) continue;
      const config = getTableConfig(value);
      const body = sql.split(`CREATE TABLE "${config.name}" (`)[1]?.split("\n);")[0];
      assert.ok(body, config.name);
      for (const column of config.columns) assert.ok(body.includes(`"${column.name}"`), column.name);
      count++;
    }
  assert.equal(count, 7);
});
