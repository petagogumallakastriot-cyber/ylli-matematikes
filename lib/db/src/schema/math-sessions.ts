import { pgTable, text, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
export type StoredExercise = { id: number; a: number; b: number; operator: string; prompt: string; answer: number };
export const mathSessions = pgTable("math_sessions", {
  id: text("id").primaryKey(),
  profileId: text("profile_id"),
  grade: integer("grade").notNull(),
  lesson: integer("lesson").notNull(),
  lives: integer("lives").notNull().default(3),
  correctCount: integer("correct_count").notNull().default(0),
  answeredCount: integer("answered_count").notNull().default(0),
  status: text("status").notNull().default("active"),
  exercises: jsonb("exercises").$type<StoredExercise[]>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const insertMathSessionSchema = createInsertSchema(mathSessions);
export type MathSession = typeof mathSessions.$inferSelect;
