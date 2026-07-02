# Petra Global HRM

HR platform for Petra Global Group companies: staff/HR Manager/MD accounts,
per-department/designation manual & handbook access, goal-setting and
performance reports, training tracking, and direct messaging to HR/MD.

Stack: Next.js (App Router) + Supabase (Postgres, Auth, Storage, Realtime).
See [`/Users/mac/.claude/plans/users-mac-documents-01-sure-diagnostics-breezy-pascal.md`](../../.claude/plans/users-mac-documents-01-sure-diagnostics-breezy-pascal.md)
for the full design rationale.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com), create a new project.
2. In **Project Settings → API**, copy the Project URL, `anon` public key,
   and `service_role` secret key.
3. Copy `.env.local.example` to `.env.local` and fill in those three values
   plus `NEXT_PUBLIC_SITE_URL` (use `http://localhost:3000` for local dev).

```bash
cp .env.local.example .env.local
```

**Never commit `.env.local`** — it holds the service-role key, which
bypasses every RLS policy in the app.

## 2. Apply the database schema

Every table, custom type, and function is prefixed `hrm_` (`hrm_profiles`,
`hrm_companies`, `hrm_current_company()`, etc.) — this schema is designed to
share a Supabase project with other, unrelated apps without name collisions.
If you're pointing this at a project that already has other tables, that's
fine; if any of `0001`-`0005` still errors with "already exists", something
in *this* schema's own names collided with itself (re-check you didn't run a
file twice) — it should never collide with an unrelated app's tables now.

If your project previously hit a collision on unprefixed names (from before
this prefixing was added), run `0000_cleanup_partial_run.sql` first to
remove the empty partial objects that attempt left behind.

Open the Supabase SQL Editor (or use the Supabase CLI's `db push` if you have
it installed) and run the migration files in `supabase/migrations/` **in
order**:

```
0000_cleanup_partial_run.sql  -- only if you hit the collision described above
0001_init_schema.sql      -- hrm_companies/hrm_departments/hrm_designations/hrm_profiles + RLS
0002_manual.sql           -- hrm_manual_documents/sections/visibility/acknowledgements
0003_performance.sql      -- hrm_kpi_definitions/hrm_goals/hrm_goal_reports/hrm_appraisals
0004_training_chat.sql    -- training + direct messaging (also enables Realtime on hrm_messages)
0005_stubs.sql            -- attendance/leave/announcements/recognitions (MVP+1)
0006_grants.sql           -- explicit table grants, scoped only to hrm_ tables
```

Each file is idempotent-safe to review before running, but not safe to
re-run blindly (they `create table`, not `create table if not exists`) —
run each exactly once against a fresh project.

## 3. Enable email invites

In Supabase **Authentication → Email Templates**, the default "Invite user"
template works out of the box. In **Authentication → URL Configuration**,
add `http://localhost:3000/auth/callback` (and your production URL's
equivalent) to the redirect allow-list, or `inviteUserByEmail` calls will be
rejected.

## 4. Seed the first company (Sure Diagnostics)

This imports the 15-section Operation Manual, its KPI catalogue, and the
5 career-track designation ladders from
`scripts/source/sure-diagnostics-operation-manual.txt`:

```bash
npm run seed:sure-diagnostics
```

Re-running it is safe — sections/departments/designations are upserted by
name, not duplicated. It does **not** create any staff logins; use the app's
own `/admin/invites` page (once you have an MD account — see below) or the
bootstrap script below to invite people.

### Bootstrapping the very first MD login

`hrm_companies` has no INSERT policy for regular sessions on purpose — new
companies (and their first MD) are provisioned with the service-role key,
never through the app UI. For Sure Diagnostics specifically, after seeding,
invite yourself as MD directly via the Supabase dashboard
(**Authentication → Users → Invite user**), then run this SQL once in the
SQL Editor to attach an `hrm_profiles` row to that invited user (replace the
email and company id):

```sql
insert into public.hrm_profiles (id, company_id, role, full_name)
select u.id, c.id, 'md', 'Your Name'
from auth.users u, public.hrm_companies c
where u.email = 'you@example.com' and c.slug = 'sure-diagnostics';
```

### Onboarding additional Petra Global companies

```bash
npm run create-company -- "Company Name" md@company.com
```

This creates the company row and emails an MD invite. The MD then uses
`/admin` → Departments/Designations/Invites to build out the rest of their
company — no code changes needed per company.

## 5. Run it

```bash
npm install   # if you haven't already
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 6. Deploy

Push to a GitHub repo and import it into Vercel, setting the same four env
vars from `.env.local` in the Vercel project settings (with
`NEXT_PUBLIC_SITE_URL` set to your production domain). Supabase itself is
already cloud-hosted — no separate backend deploy needed.

## Project structure

```
supabase/migrations/        -- SQL schema + RLS, source of truth for the DB
scripts/                    -- one-time seed & company-bootstrap scripts (run via tsx)
scripts/source/              -- raw extracted text of the Sure Diagnostics manual
src/app/(app)/               -- authenticated pages: manual, goals, training, messages, directory, admin
src/app/login, /invite, /auth/callback  -- unauthenticated auth flow
src/lib/supabase/            -- browser/server/admin Supabase client factories
src/lib/auth/                -- role helpers + getCurrentProfile()/requireProfile()
middleware.ts                -- session refresh + route protection
```

## Known MVP simplifications

- Manual section bodies render as preformatted markdown text, not full
  markdown-to-HTML (no renderer dependency added yet) — tables/headers are
  readable but not styled.
- `Employee Handbook.pdf` (scanned/image-heavy, no OCR tooling available in
  this environment) is seeded as a draft placeholder document only; its real
  content still needs to be entered, either manually or via a future OCR pass.
- Attendance, leave, announcements, and recognitions have tables + RLS
  (`0005_stubs.sql`) but no UI yet — planned for MVP+1 per the design doc.
