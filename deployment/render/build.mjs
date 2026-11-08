import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

process.chdir(fileURLToPath(new URL("../../", import.meta.url)));
// Build flags are explicit: inherited Replit/Clerk settings cannot affect this build.
const env = { ...process.env, NODE_ENV: "production", PORT: "10000", BASE_PATH: "/", VITE_PIN_ONLY: "true" };
delete env.VITE_CLERK_PUBLISHABLE_KEY;
delete env.VITE_CLERK_PROXY_URL;
for (const name of ["@workspace/api-server", "@workspace/ylli-matematikes"]) {
  const result = spawnSync("pnpm", ["--filter", name, "run", "build"], { env, stdio: "inherit" });
  if (result.error || result.status !== 0) process.exit(result.status || 1);
}
