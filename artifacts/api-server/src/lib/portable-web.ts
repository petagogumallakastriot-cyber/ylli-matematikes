import express, { type Express } from "express";
import path from "node:path";
import { existsSync } from "node:fs";

/** Render runs one same-origin server, keeping the existing HttpOnly PIN cookies. */
export function servePortableWeb(app: Express) {
  if (process.env.SERVE_WEB !== "true") return;
  const root = path.resolve("artifacts/ylli-matematikes/dist/public");
  const index = path.join(root, "index.html");
  if (!existsSync(index)) throw new Error("Missing web build. Run pnpm run build:render first.");
  // Missing API routes must never become a successful HTML response.
  app.use("/api", (_req, res) => { res.status(404).json({ error: "Not found" }); });
  app.use(express.static(root, {
    index: false,
    setHeaders(res, file) {
      res.setHeader("Cache-Control", file.includes(`${path.sep}assets${path.sep}`)
        ? "public, max-age=31536000, immutable" : "no-cache");
    },
  }));
  app.get("/{*route}", (req, res, next) => {
    if (path.extname(req.path) || !req.accepts("html")) { next(); return; }
    res.set("Cache-Control", "no-store").sendFile(index);
  });
}
