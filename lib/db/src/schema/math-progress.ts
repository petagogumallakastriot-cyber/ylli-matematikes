import { pgTable, text, integer, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { mathProfiles } from "./math-profiles";
export const mathProgress = pgTable("math_progress", {
  profileId: text("profile_id").notNull().references(() => mathProfiles.id, { onDelete: "cascade" }),
  grade: integer("grade").notNull(),
  lesson: integer("lesson").notNull(),
  stars: integer("stars").notNull().default(0),
  completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [primaryKey({ columns: [table.profileId, table.grade, table.lesson] })]);
export const insertMathProgressSchema = createInsertSchema(mathProgress);
export type MathProgress = typeof mathProgress.$inferSelect;
