import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";
import { randomUUID } from "node:crypto";
import {
  GetProfileResponse, UpdateProfileBody, UpdateProfileResponse, GetGradesResponse,
  GetLessonsParams, GetLessonsResponse, GetLessonParams, GetLessonResponse,
  GetLeaderboardQueryParams, GetLeaderboardResponse, GetDashboardResponse,
} from "@workspace/api-zod";
import { gradesFor, lessonFor, lessonDetail } from "../lib/curriculum";
import { userIdFor, profileFor, progressFor } from "../lib/learners";
import { nicknameKey } from "../lib/pin-auth";
const router: IRouter = Router();
router.use("/math", (_req, res, next) => { res.set("Cache-Control", "no-store"); next(); });
router.get("/math/profile", async (req, res): Promise<void> => {
  const id = userIdFor(req);
  res.json(GetProfileResponse.parse({ authenticated: !!id, profile: await profileFor(id) }));
});
router.patch("/math/profile", async (req, res): Promise<void> => {
  const id = userIdFor(req);
  if (!id) { res.status(401).json({ error: "Hyr në llogari për të ruajtur profilin." }); return; }
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success || (parsed.success && (
    parsed.data.nickname.trim().length < 2 ||
    parsed.data.firstName.trim().length < 1 ||
    parsed.data.lastName.trim().length < 1 ||
    !Number.isInteger(parsed.data.age)
  ))) {
    res.status(400).json({ error: "Plotëso emrin, mbiemrin, moshën nga 4 deri në 18 vjeç, pseudonimin dhe klasën." }); return;
  }
  const { nickname, grade, avatar, publicRanking, firstName, lastName, age, gender, language } = parsed.data;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Closing and editing the same legacy profile cannot recreate deleted data.
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [id]);
    if ((await client.query("SELECT 1 FROM math_closed_accounts WHERE id=$1", [id])).rowCount) {
      await client.query("ROLLBACK"); res.status(401).json({ error: "Profili është fshirë." }); return;
    }
    await client.query(`INSERT INTO math_profiles(id,nickname,grade,avatar,public_ranking,first_name,last_name,age,gender,language)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT(id) DO UPDATE SET
      nickname=EXCLUDED.nickname,grade=EXCLUDED.grade,avatar=EXCLUDED.avatar,public_ranking=EXCLUDED.public_ranking,
      first_name=EXCLUDED.first_name,last_name=EXCLUDED.last_name,age=EXCLUDED.age,gender=EXCLUDED.gender,
      language=COALESCE($11,math_profiles.language)`,
      [id, nickname.trim(), grade, avatar, publicRanking, firstName.trim(), lastName.trim(), age, gender, language ?? "sq", language ?? null]);
    await client.query("UPDATE math_credentials SET nickname_key=$2 WHERE profile_id=$1", [id, nicknameKey(nickname)]);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    if ((err as { code?: string }).code === "23505") {
      res.status(409).json({ error: "Ky pseudonim është zënë. Zgjidh një tjetër.", code: "NICKNAME_TAKEN" }); return;
    }
    throw err;
  } finally { client.release(); }
  res.json(UpdateProfileResponse.parse(await profileFor(id)));
});
router.get("/math/grades", async (req, res): Promise<void> => {
  res.json(GetGradesResponse.parse(gradesFor(await progressFor(userIdFor(req)))));
});
router.get("/math/grades/:grade/lessons", async (req, res): Promise<void> => {
  const parsed = GetLessonsParams.safeParse(req.params);
  if (!parsed.success) { res.status(400).json({ error: "Klasa duhet të jetë nga 1 deri në 9." }); return; }
  const progress = await progressFor(userIdFor(req));
  res.json(GetLessonsResponse.parse(Array.from({ length: 15 }, (_, i) => lessonFor(parsed.data.grade, i + 1, progress))));
});
router.get("/math/grades/:grade/lessons/:lesson", async (req, res): Promise<void> => {
  const parsed = GetLessonParams.safeParse(req.params);
  if (!parsed.success) { res.status(400).json({ error: "Mësimi nuk u gjet." }); return; }
  res.json(GetLessonResponse.parse(lessonDetail(parsed.data.grade, parsed.data.lesson, await progressFor(userIdFor(req)))));
});
router.get("/math/leaderboard", async (req, res): Promise<void> => {
  const parsed = GetLeaderboardQueryParams.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: "Klasë e pavlefshme." }); return; }
  const id = userIdFor(req);
  const { rows } = await pool.query(`SELECT id,nickname,avatar,grade,hearts,xp FROM math_profiles
    WHERE public_ranking=true AND ($1::integer IS NULL OR grade=$1)
    ORDER BY hearts DESC,xp DESC,created_at ASC LIMIT 50`, [parsed.data.grade ?? null]);
  res.json(GetLeaderboardResponse.parse(rows.map((p, i) => ({
    rank: i + 1, nickname: p.nickname, avatar: p.avatar, grade: p.grade, hearts: p.hearts, xp: p.xp,
    level: 1 + Math.floor(p.hearts / 30), isMe: p.id === id,
  }))));
});
router.get("/math/dashboard", async (req, res): Promise<void> => {
  const id = userIdFor(req);
  const profile = await profileFor(id);
  const progress = await progressFor(id);
  const grade = profile?.grade ?? 1;
  const { rows: stats } = await pool.query(`SELECT
    COALESCE(SUM(correct_count),0)::int AS correct,COALESCE(SUM(answered_count),0)::int AS answered,
    COALESCE(SUM(correct_count) FILTER(WHERE created_at::date=CURRENT_DATE),0)::int AS daily
    FROM math_sessions WHERE profile_id=$1`, [id ?? randomUUID()]);
  const { rows: recent } = await pool.query(`SELECT grade,lesson,stars,completed_at FROM math_progress
    WHERE profile_id=$1 ORDER BY completed_at DESC LIMIT 5`, [id ?? ""]);
  res.json(GetDashboardResponse.parse({
    dailyGoal: 12, dailyCompleted: stats[0]?.daily ?? 0, totalLessons: 135, completedLessons: progress.length,
    accuracy: stats[0]?.answered ? Math.round(100 * stats[0].correct / stats[0].answered) : 0,
    nextGrade: grade, nextLesson: Array.from({ length: 15 }, (_, i) => i + 1).find(n => !progress.some(p => p.grade === grade && p.lesson === n && p.stars === 3)) ?? 15,
    recentActivity: recent.map(p => ({ title: lessonFor(p.grade, p.lesson).title, grade: p.grade, stars: p.stars, date: new Date(p.completed_at).toISOString() })),
  }));
});
export default router;
