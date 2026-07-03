-- Recruitment: internal tracker only (no public application form) — HR/MD
-- post openings and manually add candidates they've sourced (referrals,
-- LinkedIn, email, etc.), moving each through a simple pipeline.

create type public.hrm_job_posting_status as enum ('open', 'closed');
create type public.hrm_candidate_stage as enum ('applied', 'screening', 'interview', 'offer', 'hired', 'rejected');

create table public.hrm_job_postings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.hrm_companies(id) on delete cascade,
  branch_id uuid references public.hrm_branches(id) on delete set null,
  department_id uuid references public.hrm_departments(id) on delete set null,
  designation_id uuid references public.hrm_designations(id) on delete set null,
  title text not null,
  description text,
  status public.hrm_job_posting_status not null default 'open',
  created_by uuid references public.hrm_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.hrm_candidates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.hrm_companies(id) on delete cascade,
  job_posting_id uuid not null references public.hrm_job_postings(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  stage public.hrm_candidate_stage not null default 'applied',
  notes text,
  created_by uuid references public.hrm_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on public.hrm_job_postings (company_id);
create index on public.hrm_candidates (company_id);
create index on public.hrm_candidates (job_posting_id);

create trigger set_updated_at before update on public.hrm_job_postings
  for each row execute function public.hrm_set_updated_at();
create trigger set_updated_at before update on public.hrm_candidates
  for each row execute function public.hrm_set_updated_at();

alter table public.hrm_job_postings enable row level security;
alter table public.hrm_candidates enable row level security;

-- HR/MD only — recruitment isn't staff-facing, unlike most of the schema.
create policy job_postings_select on public.hrm_job_postings
  for select using (company_id = public.hrm_current_company() and public.hrm_is_hr_or_md());
create policy job_postings_write on public.hrm_job_postings
  for all using (company_id = public.hrm_current_company() and public.hrm_is_hr_or_md())
  with check (company_id = public.hrm_current_company() and public.hrm_is_hr_or_md());

create policy candidates_select on public.hrm_candidates
  for select using (company_id = public.hrm_current_company() and public.hrm_is_hr_or_md());
create policy candidates_write on public.hrm_candidates
  for all using (company_id = public.hrm_current_company() and public.hrm_is_hr_or_md())
  with check (company_id = public.hrm_current_company() and public.hrm_is_hr_or_md());

-- Matches the explicit, scoped-grant pattern from 0006 — this project's
-- public schema doesn't auto-grant privileges on new tables.
grant select, insert, update, delete on public.hrm_job_postings, public.hrm_candidates to authenticated, service_role;
grant select on public.hrm_job_postings, public.hrm_candidates to anon;
