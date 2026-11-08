# Ylli i Matematikës

Platformë matematike në shqip për klasat 1–9, me 15 mësime për klasë, ushtrime vertikale, yje, zemra dhe renditje.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string; `SESSION_SECRET` — stable secret used to protect learner PIN hashes. Do not rotate it casually: existing PIN verification depends on it.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/ylli-matematikes` — React web application served at `/`.
- `artifacts/api-server/src/lib/curriculum.ts` — grade curriculum and exercise generation.
- `artifacts/api-server/src/routes/math.ts`, `practice.ts` — learner data and server-validated attempts.
- `lib/api-spec/openapi.yaml` — API contract; regenerate clients after changes.
- `lib/db/src/schema/math-*.ts` — profiles, best lesson scores, practice sessions.

## Architecture decisions

- Children register and sign in using a unique pseudonym and a six-digit PIN. A visitor can practice, but saving rewards requires a learner profile.
- Keep legacy Clerk email login available so existing learners can link a PIN without losing progress. Do not create replacement profiles for them.
- PIN hashes and hashed opaque login sessions are server-side; browser cookies are HttpOnly. Account/IP attempt counters live in PostgreSQL.
- Profile deletion requires the current PIN and removes learning data and sessions; a closed legacy identity must not automatically recreate its deleted profile.
- Public ranking is opt-in and shows pseudonyms rather than account information.
- Only improving a lesson's best star score grants more XP and hearts; repeated easy lessons must not inflate the ranking.

## Product

- 135 lessons, each with 12 generated questions, with progressively harder arithmetic.
- Three lives per attempt; three mistakes end the attempt and lose that attempt's stars. The same lesson can be restarted.
- Grade 4 teaches multiplication and division tables before practice.
- Profiles track stars, XP, earned hearts, streaks and levels; learners can join the grade-filtered ranking.
- Registration includes first name, last name, pseudonym, gender (male/female), age, grade and PIN. The dashboard and exercise encouragement address the learner by first name.

## User preferences

- Learners choose SQ (Albanian), EN (English), GR (Greek, locale `el`) or IT (Italian). Translate only interface and teaching texts, never names, pseudonyms or arithmetic values.
- The initial screen offers “Hyr” and “Regjistrohu”. Names, gender and ages stay private; only the chosen pseudonym appears in the ranking. The profile offers logout and confirmed permanent deletion.
- Arithmetic must look like the supplied worksheet: stacked operands, operation sign on the left, answer beneath the line.

## Gotchas

- Development and production Clerk users are separate. Do not seed fake ranking competitors.
- Grade 8–9 answers include decimals; answer inputs must accept both comma and period separators.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details

## Portable hosting preparation

- `deployment/render/README-SQ.md` explains the separate Render Free + Neon Free setup. A new Neon Free database has been initialized; its non-secret target is in `deployment/render/target.json`. Render has not been published, and existing Replit learner data has not been copied or switched over.
- `pnpm run build:render` builds a PIN-only frontend; `pnpm run start:render` runs the same-origin API and static web app on Render's `PORT`.
- `render.yaml` provisions only a free web service. Neon credentials belong in Render's environment, never Git or chat. Development workflows keep their existing Clerk integration.
- External Neon migrations are in `deployment/render/migrations/`; startup is guarded to Neon hosts and refuses unreviewed pre-existing learning tables. This is not a migration path for Replit-managed production.
- The source archive excludes secrets and learner data. Existing accounts/progress require a separately approved migration and the original stable PIN pepper. Do not claim an archive preserves user data.
