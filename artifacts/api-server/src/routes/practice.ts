import { Router, type IRouter } from "express";
import { randomUUID } from "node:crypto";
import { pool, type StoredExercise } from "@workspace/db";
import { StartSessionBody, StartSessionResponse, SubmitAnswerParams, SubmitAnswerBody, SubmitAnswerResponse } from "@workspace/api-zod";
import { generateExercises } from "../lib/curriculum";
import { userIdFor, profileFor } from "../lib/learners";
type SessionRow = {
  id: string; profile_id: string | null; grade: number; lesson: number; lives: number;
  correct_count: number; answered_count: number; status: string; exercises: StoredExercise[];
};
const serialize = (s: SessionRow) => ({
  id: s.id, grade: s.grade, lesson: s.lesson, lives: s.lives, stars: s.status === "failed" ? 0 : s.lives,
  correctCount: s.correct_count, answeredCount: s.answered_count, totalQuestions: s.exercises.length,
  status: s.status, guest: !s.profile_id, exercises: s.exercises.map(({ answer: _answer, ...e }) => e),
});
const router: IRouter = Router();
// In-memory rate limiting only controls anonymous practice creation, never identity.
const starts = new Map<string, { count: number; expires: number }>();
router.post("/math/sessions", async (req, res): Promise<void> => {
  const parsed = StartSessionBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Zgjidh një klasë dhe një mësim të vlefshëm." }); return; }
  const now = Date.now();
  if (starts.size > 2000) for (const [key, value] of starts) if (value.expires < now) starts.delete(key);
  const key = req.ip ?? "unknown";
  const bucket = starts.get(key);
  if (bucket && bucket.expires > now && bucket.count >= 120) {
    res.status(429).json({ error: "Ke filluar shumë mësime. Provo përsëri pak më vonë." }); return;
  }
  starts.set(key, bucket && bucket.expires > now ? { ...bucket, count: bucket.count + 1 } : { count: 1, expires: now + 3600000 });
  const userId = userIdFor(req);
  const { grade, lesson } = parsed.data;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    if (userId) {
      await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [userId]);
      if ((await client.query("SELECT 1 FROM math_closed_accounts WHERE id=$1", [userId])).rowCount) {
        await client.query("ROLLBACK"); res.status(401).json({ error: "Profili është fshirë." }); return;
      }
    }
    const { rows: profiles } = await client.query("SELECT id FROM math_profiles WHERE id=$1", [userId]);
    const { rows } = await client.query<SessionRow>(
      `INSERT INTO math_sessions(id,profile_id,grade,lesson,exercises) VALUES($1,$2,$3,$4,$5::jsonb) RETURNING *`,
      [randomUUID(), profiles[0]?.id ?? null, grade, lesson, JSON.stringify(generateExercises(grade, lesson))]);
    await client.query("COMMIT");
    res.json(StartSessionResponse.parse(serialize(rows[0]!)));
  } catch (err) { await client.query("ROLLBACK"); throw err; }
  finally { client.release(); }
});
router.post("/math/sessions/:id/answers", async (req, res): Promise<void> => {
  const params = SubmitAnswerParams.safeParse(req.params);
  const body = SubmitAnswerBody.safeParse(req.body);
  if (!params.success || !body.success || !Number.isInteger(body.data.exerciseId) || !Number.isFinite(body.data.answer)) {
    res.status(400).json({ error: "Shkruaj një përgjigje numerike të vlefshme." }); return;
  }
  const userId = userIdFor(req);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query<SessionRow>("SELECT * FROM math_sessions WHERE id=$1 FOR UPDATE", [params.data.id]);
    const s = rows[0];
    if (!s || (s.profile_id && s.profile_id !== userId)) {
      await client.query("ROLLBACK"); res.status(404).json({ error: "Ushtrimi nuk u gjet." }); return;
    }
    if (s.status !== "active" || body.data.exerciseId !== s.answered_count) {
      await client.query("ROLLBACK"); res.status(409).json({ error: "Kjo përgjigje është kontrolluar tashmë. Fillo një provë të re." }); return;
    }
    const e = s.exercises[s.answered_count]!;
    const correct = Math.abs(body.data.answer - e.answer) < 0.000001;
    s.answered_count++;
    if (correct) s.correct_count++; else s.lives--;
    s.status = s.lives === 0 ? "failed" : s.answered_count === s.exercises.length ? "completed" : "active";
    let earnedXp = 0, earnedHearts = 0;
    if (s.status === "completed" && s.profile_id) {
      // Serialize reward writes for all attempts of this learner, even across tabs.
      await client.query("SELECT id FROM math_profiles WHERE id=$1 FOR UPDATE", [s.profile_id]);
      const { rows: prior } = await client.query<{ stars: number }>(
        "SELECT stars FROM math_progress WHERE profile_id=$1 AND grade=$2 AND lesson=$3", [s.profile_id, s.grade, s.lesson]);
      const improvement = Math.max(0, s.lives - (prior[0]?.stars ?? 0));
      earnedXp = improvement * 40; earnedHearts = improvement * 5;
      if (improvement > 0) {
        await client.query(`INSERT INTO math_progress(profile_id,grade,lesson,stars) VALUES($1,$2,$3,$4)
          ON CONFLICT(profile_id,grade,lesson) DO UPDATE SET stars=EXCLUDED.stars,completed_at=NOW()`,
          [s.profile_id, s.grade, s.lesson, s.lives]);
        await client.query("UPDATE math_profiles SET xp=xp+$2,hearts=hearts+$3 WHERE id=$1", [s.profile_id, earnedXp, earnedHearts]);
      }
    }
    await client.query("UPDATE math_sessions SET lives=$2,correct_count=$3,answered_count=$4,status=$5 WHERE id=$1",
      [s.id, s.lives, s.correct_count, s.answered_count, s.status]);
    await client.query("COMMIT");
    const message = s.status === "failed" ? "Mos u dorëzo! Humbe 3 jetët dhe yjet e kësaj prove. Provoje të njëjtin mësim nga fillimi." :
      s.status === "completed" ? (s.lives === 3 ? "Shkëlqyeshëm! Të gjitha pa gabime. Fitove 3 yje!" : "Mësimi përfundoi! Provoje përsëri pa gabime për të fituar 3 yje.") :
      correct ? "Saktë! Vazhdo kështu!" : `Përgjigjja e saktë është ${e.answer}. Ke edhe ${s.lives} jetë.`;
    res.json(SubmitAnswerResponse.parse({ correct, correctAnswer: e.answer, message, earnedXp, earnedHearts, session: serialize(s) }));
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally { client.release(); }
});
export default router;
