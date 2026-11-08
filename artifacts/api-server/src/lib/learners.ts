import { pool } from "@workspace/db";
import type { Request } from "express";
import { learnerId } from "./pin-auth";
export const userIdFor = (req: Request): string | null => learnerId(req);
export async function progressFor(userId: string | null) {
  if (!userId) return [];
  const { rows } = await pool.query<{ grade: number; lesson: number; stars: number }>(
    "SELECT grade,lesson,stars FROM math_progress WHERE profile_id=$1", [userId]);
  return rows;
}
export async function profileFor(userId: string | null) {
  if (!userId) return null;
  const { rows } = await pool.query(
    `SELECT p.*, COALESCE(SUM(g.stars),0)::int AS stars, COUNT(g.lesson)::int AS completed
     FROM math_profiles p LEFT JOIN math_progress g ON g.profile_id=p.id
     WHERE p.id=$1 GROUP BY p.id`, [userId]);
  const p = rows[0];
  if (!p) return null;
  const { rows: days } = await pool.query<{ day: string }>(
    `SELECT DISTINCT to_char(created_at AT TIME ZONE 'UTC','YYYY-MM-DD') AS day
     FROM math_sessions WHERE profile_id=$1 AND status='completed' ORDER BY day DESC LIMIT 365`, [userId]);
  const today = new Date(); today.setUTCHours(0, 0, 0, 0);
  let streak = 0;
  for (const { day } of days) {
    const diff = Math.round((today.getTime() - new Date(day + "T00:00:00Z").getTime()) / 86400000);
    if (streak === 0 && diff === 1) today.setUTCDate(today.getUTCDate() - 1);
    const expected = new Date(today); expected.setUTCDate(expected.getUTCDate() - streak);
    if (day !== expected.toISOString().slice(0, 10)) break;
    streak++;
  }
  return { id: p.id, nickname: p.nickname, grade: p.grade, avatar: p.avatar, publicRanking: p.public_ranking,
    firstName: p.first_name, lastName: p.last_name, age: p.age, gender: p.gender, language: p.language,
    hasPin: !!(await pool.query("SELECT 1 FROM math_credentials WHERE profile_id=$1", [userId])).rowCount,
    xp: p.xp, hearts: p.hearts, stars: p.stars, level: 1 + Math.floor(p.hearts / 30),
    completedLessons: p.completed, streak };
}
