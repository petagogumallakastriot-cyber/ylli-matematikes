-- Initial empty-database schema exported from the existing Drizzle definitions.
-- Never edit after application; add a new numbered migration for future changes.
CREATE TABLE "math_profiles" (
  "id" text PRIMARY KEY NOT NULL,
  "nickname" text NOT NULL,
  "first_name" text DEFAULT '' NOT NULL,
  "last_name" text DEFAULT '' NOT NULL,
  "age" integer,
  "gender" text,
  "language" text DEFAULT 'sq' NOT NULL,
  "grade" integer DEFAULT 1 NOT NULL,
  "avatar" text DEFAULT 'fox' NOT NULL,
  "public_ranking" boolean DEFAULT false NOT NULL,
  "xp" integer DEFAULT 0 NOT NULL,
  "hearts" integer DEFAULT 0 NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE "math_progress" (
  "profile_id" text NOT NULL,
  "grade" integer NOT NULL,
  "lesson" integer NOT NULL,
  "stars" integer DEFAULT 0 NOT NULL,
  "completed_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "math_progress_profile_id_grade_lesson_pk" PRIMARY KEY ("profile_id","grade","lesson"),
  FOREIGN KEY ("profile_id") REFERENCES "math_profiles"("id") ON DELETE CASCADE
);
CREATE TABLE "math_sessions" (
  "id" text PRIMARY KEY NOT NULL,
  "profile_id" text,
  "grade" integer NOT NULL,
  "lesson" integer NOT NULL,
  "lives" integer DEFAULT 3 NOT NULL,
  "correct_count" integer DEFAULT 0 NOT NULL,
  "answered_count" integer DEFAULT 0 NOT NULL,
  "status" text DEFAULT 'active' NOT NULL,
  "exercises" jsonb NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE "math_auth_limits" (
  "key" text PRIMARY KEY NOT NULL,
  "attempts" integer DEFAULT 0 NOT NULL,
  "expires_at" timestamptz NOT NULL
);
CREATE TABLE "math_auth_sessions" (
  "token_hash" text PRIMARY KEY NOT NULL,
  "profile_id" text NOT NULL REFERENCES "math_profiles"("id") ON DELETE CASCADE,
  "expires_at" timestamptz NOT NULL
);
CREATE TABLE "math_closed_accounts" ("id" text PRIMARY KEY NOT NULL);
CREATE TABLE "math_credentials" (
  "profile_id" text PRIMARY KEY NOT NULL REFERENCES "math_profiles"("id") ON DELETE CASCADE,
  "nickname_key" text NOT NULL UNIQUE,
  "pin_hash" text NOT NULL
);
