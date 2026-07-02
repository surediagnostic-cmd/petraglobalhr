-- Branches: physical locations a company operates from (e.g. Lekki, Ikeja
-- centres), independent of department — a staff member has both a branch
-- (where they work) and a department/designation (what they do). Matches
-- the Sure Diagnostics Operation Manual's repeated references to
-- branch-level closing procedures, facility checks, and Branch Manager
-- approvals, none of which the schema had a home for until now.

create table public.hrm_branches (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.hrm_companies(id) on delete cascade,
  name text not null,
  address text,
  created_at timestamptz not null default now(),
  unique (company_id, name)
);

alter table public.hrm_profiles
  add column branch_id uuid references public.hrm_branches(id) on delete set null;

alter table public.hrm_invites
  add column branch_id uuid references public.hrm_branches(id) on delete set null;

create index on public.hrm_branches (company_id);
create index on public.hrm_profiles (branch_id);

alter table public.hrm_branches enable row level security;

create policy branches_select on public.hrm_branches
  for select using (company_id = public.hrm_current_company());
create policy branches_write on public.hrm_branches
  for all using (company_id = public.hrm_current_company() and public.hrm_is_hr_or_md())
  with check (company_id = public.hrm_current_company() and public.hrm_is_hr_or_md());

-- Matches the explicit, scoped-grant pattern from 0006 — this project's
-- public schema doesn't auto-grant privileges on new tables.
grant select, insert, update, delete on public.hrm_branches to authenticated, service_role;
grant select on public.hrm_branches to anon;
