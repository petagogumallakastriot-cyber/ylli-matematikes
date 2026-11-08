import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { initializeDatabase } from "./database.mjs";

process.chdir(fileURLToPath(new URL("../../", import.meta.url)));
if (process.env.PIN_ONLY !== "true" || process.env.SERVE_WEB !== "true") {
  throw new Error("Render requires PIN_ONLY=true and SERVE_WEB=true.");
}
if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
  throw new Error("Set a stable SESSION_SECRET of at least 32 characters in Render Environment.");
}
await initializeDatabase();
const server = spawn(process.execPath, ["--enable-source-maps", "artifacts/api-server/dist/index.mjs"], {
  stdio: "inherit", env: process.env,
});
for (const signal of ["SIGTERM", "SIGINT"]) process.on(signal, () => server.kill(signal));
server.on("error", () => process.exit(1));
server.on("exit", (code) => process.exit(code ?? 1));
