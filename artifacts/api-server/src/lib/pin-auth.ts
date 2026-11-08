import { createHash, createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { Request, Response, RequestHandler } from "express";
import { getAuth } from "@clerk/express";
import { pool } from "@workspace/db";

const scrypt = promisify(scryptCallback);
const COOKIE = "math_learner";
type LearnerRequest = Request & { learnerId?: string | null };
export const nicknameKey = (name: string) => name.normalize("NFKC").trim().toLocaleLowerCase("en");
const digest = (value: string) => createHash("sha256").update(value).digest("hex");
function pepper(pin: string): string {
  if (!process.env.SESSION_SECRET) throw new Error("SESSION_SECRET is required for PIN authentication");
  return createHmac("sha256", process.env.SESSION_SECRET).update(pin).digest("hex");
}
export async function hashPin(pin: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const hash = await scrypt(pepper(pin), salt, 64) as Buffer;
  return `${salt}:${hash.toString("hex")}`;
}
export async function verifyPin(pin: string, stored: string): Promise<boolean> {
  const [salt, expected] = stored.split(":");
  const actual = await scrypt(pepper(pin), salt, 64) as Buffer;
  const target = Buffer.from(expected, "hex");
  return target.length === actual.length && timingSafeEqual(target, actual);
}
function cookies(req: Request) {
  return Object.fromEntries((req.headers.cookie ?? "").split(";").map((part) => {
    const i = part.indexOf("=");
    return [part.slice(0, i).trim(), part.slice(i + 1)];
  }));
}
const options = (req: Request) => ({
  httpOnly: true, secure: req.secure || req.get("x-forwarded-proto")?.split(",")[0].trim() === "https",
  sameSite: "lax" as const, path: "/", maxAge: 30 * 86400000,
});
export async function issueSession(req: Request, res: Response, id: string) {
  const token = randomBytes(32).toString("hex");
  await pool.query("DELETE FROM math_auth_sessions WHERE expires_at < now()");
  await pool.query("INSERT INTO math_auth_sessions(token_hash,profile_id,expires_at) VALUES($1,$2,now()+interval '30 days')",
    [digest(token), id]);
  res.cookie(COOKIE, token, options(req));
  res.clearCookie("math_signed_out", { path: "/" });
}
export async function clearSession(req: Request, res: Response) {
  const token = cookies(req)[COOKIE];
  if (token) await pool.query("DELETE FROM math_auth_sessions WHERE token_hash=$1", [digest(token)]);
  const { maxAge: _maxAge, ...clearOptions } = options(req);
  res.clearCookie(COOKIE, clearOptions);
  // Do not let a still-live legacy Clerk cookie silently sign the learner back in.
  res.cookie("math_signed_out", "1", options(req));
}
export async function continueLegacy(req: Request, res: Response) {
  await clearSession(req, res);
  res.clearCookie("math_signed_out", { path: "/" });
}
export const learnerIdentity: RequestHandler = async (req, res, next) => {
  const parsed = cookies(req);
  const token = parsed[COOKIE];
  let id: string | null = null;
  if (token) {
    if (/^[a-f0-9]{64}$/.test(token)) {
      const { rows } = await pool.query("SELECT profile_id FROM math_auth_sessions WHERE token_hash=$1 AND expires_at>now()", [digest(token)]);
      id = rows[0]?.profile_id ?? null;
    }
  } else if (process.env.PIN_ONLY !== "true" && parsed.math_signed_out !== "1") {
    id = getAuth(req).userId ?? null;
    if (id) {
      const { rowCount } = await pool.query("SELECT id FROM math_closed_accounts WHERE id=$1", [id]);
      if (rowCount) id = null;
    }
  }
  (req as LearnerRequest).learnerId = id;
  res.set("Cache-Control", "no-store");
  next();
};
export const learnerId = (req: Request) => (req as LearnerRequest).learnerId ?? null;
export const sameOrigin: RequestHandler = (req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) { next(); return; }
  const origin = req.get("origin");
  const hosts = [req.get("host"), req.get("x-forwarded-host")?.split(",")[0].trim()];
  let valid = true;
  try { if (origin) valid = hosts.includes(new URL(origin).host); } catch { valid = false; }
  if (!valid || req.get("sec-fetch-site") === "cross-site") {
    res.status(403).json({ error: "Kërkesa nuk lejohet.", code: "ORIGIN" }); return;
  }
  next();
};
export async function allowAttempt(req: Request, res: Response, account: string, registration = false): Promise<boolean> {
  const windowSeconds = registration ? 3600 : 900;
  const keys = [
    [`ip:${digest(req.ip ?? "unknown")}:${registration ? "register" : "login"}`, registration ? 20 : 60],
    ...(account ? [[`account:${digest(account)}`, 10]] : []),
  ] as [string, number][];
  // Shared PostgreSQL counters survive workflow restarts and multiple app processes.
  const { rowCount } = await pool.query("DELETE FROM math_auth_limits WHERE expires_at<now()-interval '1 day'");
  void rowCount;
  for (const [key, max] of keys) {
    const { rows } = await pool.query(`INSERT INTO math_auth_limits(key,attempts,expires_at) VALUES($1,1,now()+make_interval(secs=>$2))
      ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN math_auth_limits.expires_at<now() THEN 1 ELSE math_auth_limits.attempts+1 END,
      expires_at=CASE WHEN math_auth_limits.expires_at<now() THEN EXCLUDED.expires_at ELSE math_auth_limits.expires_at END RETURNING attempts`,
      [key, windowSeconds]);
    if (rows[0].attempts > max) {
      res.set("Retry-After", String(windowSeconds));
      res.status(429).json({ error: "Shumë tentativa. Provo përsëri më vonë.", code: "RATE_LIMIT" }); return false;
    }
  }
  return true;
}
