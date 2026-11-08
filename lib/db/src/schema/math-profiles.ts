import { pgTable, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
export const mathProfiles = pgTable("math_profiles", {
  id: text("id").primaryKey(),
  nickname: text("nickname").notNull(),
  firstName: text("first_name").notNull().default(""),
  lastName: text("last_name").notNull().default(""),
  age: integer("age"),
  gender: text("gender"),
  language: text("language").notNull().default("sq"),
  grade: integer("grade").notNull().default(1),
  avatar: text("avatar").notNull().default("fox"),
  publicRanking: boolean("public_ranking").notNull().default(false),
  xp: integer("xp").notNull().default(0),
  hearts: integer("hearts").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const insertMathProfileSchema = createInsertSchema(mathProfiles);
export type MathProfile = typeof mathProfiles.$inferSelect;
