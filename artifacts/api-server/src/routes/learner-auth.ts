import { Router, type IRouter } from "express";
import { randomUUID } from "node:crypto";
import { pool } from "@workspace/db";
import {
  RegisterLearnerBody, RegisterLearnerResponse, LoginLearnerBody, LoginLearnerResponse,
  SetLearnerPinBody, SetLearnerPinResponse, DeleteProfileBody,
} from "@workspace/api-zod";
import { userIdFor, profileFor } from "../lib/learners";
import { allowAttempt, clearSession, continueLegacy, hashPin, issueSession, nicknameKey, verifyPin } from "../lib/pin-auth";

const router: IRouter = Router();
const conflict = (err: unknown) => (err as { code?: string }).code === "23505";
const validNames = (p: { firstName: string; lastName: string; nickname: string; age: number }) =>
  p.firstName.trim().length > 0 && p.lastName.trim().length > 0 && p.nickname.trim().length >= 2 && Number.isInteger(p.age);

router.post("/math/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterLearnerBody.safeParse(req.body);
  if (!parsed.success || !validNames(parsed.data)) {
    res.status(400).json({ error: "Plotëso të gjitha fushat dhe PIN-in me 6 shifra.", code: "VALIDATION" }); return;
  }
  if (userIdFor(req)) {
    res.status(409).json({ error: "Dil nga profili aktual përpara regjistrimit.", code: "ALREADY_SIGNED_IN" }); return;
  }
  if (!await allowAttempt(req, res, "", true)) return;
  const p = parsed.data;
  const pinHash = await hashPin(p.pin);
  const id = `learner_${randomUUID()}`;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`INSERT INTO math_profiles(id,nickname,first_name,last_name,age,grade,avatar,public_ranking,gender,language)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [id, p.nickname.trim(), p.firstName.trim(), p.lastName.trim(), p.age, p.grade, p.avatar, p.publicRanking, p.gender, p.language ?? "sq"]);
    await client.query("INSERT INTO math_credentials(profile_id,nickname_key,pin_hash) VALUES($1,$2,$3)",
      [id, nicknameKey(p.nickname), pinHash]);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    if (conflict(err)) { res.status(409).json({ error: "Ky pseudonim është zënë. Zgjidh një tjetër.", code: "NICKNAME_TAKEN" }); return; }
    throw err;
  } finally { client.release(); }
  await issueSession(req, res, id);
  res.status(201).json(RegisterLearnerResponse.parse({ authenticated: true, profile: await profileFor(id) }));
});

router.post("/math/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginLearnerBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Shkruaj pseudonimin dhe PIN-in me 6 shifra.", code: "VALIDATION" }); return; }
  const key = nicknameKey(parsed.data.nickname);
  if (!await allowAttempt(req, res, key)) return;
  const { rows } = await pool.query("SELECT profile_id,pin_hash FROM math_credentials WHERE nickname_key=$1", [key]);
  // A dummy scrypt also runs for unknown names, avoiding a cheap timing account lookup.
  const credential = rows[0];
  const dummy = `${"0".repeat(32)}:${"0".repeat(128)}`;
  const match = await verifyPin(parsed.data.pin, credential?.pin_hash ?? dummy);
  if (!credential || !match) {
    res.status(401).json({ error: "Pseudonimi ose PIN-i nuk është i saktë.", code: "INVALID_LOGIN" }); return;
  }
  await clearSession(req, res);
  await issueSession(req, res, credential.profile_id);
  res.json(LoginLearnerResponse.parse({ authenticated: true, profile: await profileFor(credential.profile_id) }));
});

router.post("/math/auth/logout", async (req, res): Promise<void> => {
  await clearSession(req, res);
  res.sendStatus(204);
});
router.post("/math/auth/legacy", async (req, res): Promise<void> => {
  await continueLegacy(req, res);
  res.sendStatus(204);
});

router.post("/math/auth/pin", async (req, res): Promise<void> => {
  const id = userIdFor(req);
  if (!id) { res.status(401).json({ error: "Hyr në llogarinë ekzistuese.", code: "UNAUTHENTICATED" }); return; }
  const parsed = SetLearnerPinBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "PIN-i duhet të ketë 6 shifra.", code: "VALIDATION" }); return; }
  const profile = await profileFor(id);
  if (!profile) { res.status(400).json({ error: "Ruaj fillimisht profilin.", code: "PROFILE_REQUIRED" }); return; }
  if (profile.hasPin) { res.status(409).json({ error: "Ky profil e ka tashmë PIN-in.", code: "PIN_EXISTS" }); return; }
  if (!await allowAttempt(req, res, `setup:${id}`)) return;
  const hash = await hashPin(parsed.data.pin);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [id]);
    const { rows } = await client.query("SELECT nickname FROM math_profiles WHERE id=$1 FOR UPDATE", [id]);
    if (!rows[0]) { await client.query("ROLLBACK"); res.status(404).json({ error: "Profili nuk u gjet." }); return; }
    await client.query("INSERT INTO math_credentials(profile_id,nickname_key,pin_hash) VALUES($1,$2,$3)", [id, nicknameKey(rows[0].nickname), hash]);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    if (conflict(err)) { res.status(409).json({ error: "Pseudonimi është zënë ose PIN-i ekziston. Ndrysho pseudonimin te profili.", code: "NICKNAME_TAKEN" }); return; }
    throw err;
  } finally { client.release(); }
  await issueSession(req, res, id);
  res.json(SetLearnerPinResponse.parse(await profileFor(id)));
});

router.delete("/math/profile", async (req, res): Promise<void> => {
  const id = userIdFor(req);
  if (!id) { res.status(401).json({ error: "Hyr në profil.", code: "UNAUTHENTICATED" }); return; }
  const parsed = DeleteProfileBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Konfirmo me PIN-in me 6 shifra.", code: "VALIDATION" }); return; }
  if (!await allowAttempt(req, res, `delete:${id}`)) return;
  const { rows } = await pool.query("SELECT pin_hash FROM math_credentials WHERE profile_id=$1", [id]);
  if (!rows[0] || !await verifyPin(parsed.data.pin, rows[0].pin_hash)) {
    res.status(401).json({ error: "PIN-i nuk është i saktë.", code: "INVALID_PIN" }); return;
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [id]);
    // Match the practice answer locking order: exercise session, then profile.
    await client.query("SELECT id FROM math_sessions WHERE profile_id=$1 FOR UPDATE", [id]);
    await client.query("SELECT id FROM math_profiles WHERE id=$1 FOR UPDATE", [id]);
    await client.query("DELETE FROM math_sessions WHERE profile_id=$1", [id]);
    await client.query("DELETE FROM math_profiles WHERE id=$1", [id]);
    await client.query("INSERT INTO math_closed_accounts(id) VALUES($1) ON CONFLICT DO NOTHING", [id]);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK"); throw err;
  } finally { client.release(); }
  await clearSession(req, res);
  res.sendStatus(204);
});
export default router;
