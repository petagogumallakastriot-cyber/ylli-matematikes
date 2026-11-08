import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";
import { mathProfiles } from "./math-profiles";

export const mathCredentials = pgTable("math_credentials", {
  profileId: text("profile_id").primaryKey().references(() => mathProfiles.id, { onDelete: "cascade" }),
  nicknameKey: text("nickname_key").notNull().unique(),
  pinHash: text("pin_hash").notNull(),
});
export const mathAuthSessions = pgTable("math_auth_sessions", {
  tokenHash: text("token_hash").primaryKey(),
  profileId: text("profile_id").notNull().references(() => mathProfiles.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});
export const mathAuthLimits = pgTable("math_auth_limits", {
  key: text("key").primaryKey(),
  attempts: integer("attempts").notNull().default(0),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});
// A deleted legacy identity must never automatically recreate a learner profile.
export const mathClosedAccounts = pgTable("math_closed_accounts", {
  id: text("id").primaryKey(),
});
