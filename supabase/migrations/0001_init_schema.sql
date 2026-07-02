-- Core tenancy: companies -> departments -> designations -> profiles
-- Plus the SECURITY DEFINER helpers every later migration's RLS policies rely on.

create extension if not exists "pgcrypto";

create type public.hrm_role_tier as enum ('staff', 'hr_manager', 'md');
create type public.hrm_career_track as enum ('lab', 'radiology', 'finance', 'marketing', 'operations', 'other');
create type public.hrm_employment_status as enum ('active', 'on_leave', 'suspended', 'terminated');
create type public.hrm_invite_status as enum ('pending', 'accepted', 'revoked');

create or replace function public.hrm_set_updated_at()
returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.hrm_companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.hrm_departments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.hrm_companies(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (company_id, name)
);

create table public.hrm_designations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.hrm_companies(id) on delete cascade,
  department_id uuid references public.hrm_departments(id) on delete set null,
  title text not null,
  career_track public.hrm_career_track,
  -- structured grade-ladder data lifted from Op Manual §13 (min_qualification, key_responsibilities, base_pay, etc.)
  career_level_data jsonb,
  created_at timestamptz not null default now(),
  unique (company_id, title)
);

create table public.hrm_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid not null references public.hrm_companies(id) on delete restrict,
  department_id uuid references public.hrm_departments(id) on delete set null,
  designation_id uuid references public.hrm_designations(id) on delete set null,
  role public.hrm_role_tier not null default 'staff',
  full_name text not null,
  phone text,
  employment_status public.hrm_employment_status not null default 'active',
  date_joined date,
  reports_to uuid references public.hrm_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.hrm_invites (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.hrm_companies(id) on delete cascade,
  email text not null,
  department_id uuid references public.hrm_departments(id) on delete set null,
  designation_id uuid references public.hrm_designations(id) on delete set null,
  role public.hrm_role_tier not null default 'staff',
  invited_by uuid references public.hrm_profiles(id) on delete set null,
  status public.hrm_invite_status not null default 'pending',
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  unique (company_id, email, status)
);

create index on public.hrm_departments (company_id);
create index on public.hrm_designations (company_id);
create index on public.hrm_designations (department_id);
create index on public.hrm_profiles (company_id);
create index on public.hrm_profiles (department_id);
create index on public.hrm_profiles (designation_id);
create index on public.hrm_profiles (reports_to);
create index on public.hrm_invites (company_id);
create index on public.hrm_invites (email);

create trigger set_updated_at before update on public.hrm_profiles
  for each row execute function public.hrm_set_updated_at();

-- SECURITY DEFINER: reading these inside an RLS policy on `profiles` itself would
-- otherwise recurse (policy -> query profiles -> policy -> ...). Running as the
-- function owner (which has bypassrls) breaks the cycle.
create or replace function public.hrm_current_company()
returns uuid
language sql stable security definer set search_path = public as $$
  select company_id from public.hrm_profiles where id = auth.uid();
$$;

create or replace function public.hrm_current_role()
returns public.hrm_role_tier
language sql stable security definer set search_path = public as $$
  select role from public.hrm_profiles where id = auth.uid();
$$;

create or replace function public.hrm_is_hr_or_md()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.hrm_current_role() in ('hr_manager', 'md'), false);
$$;

alter table public.hrm_companies enable row level security;
alter table public.hrm_departments enable row level security;
alter table public.hrm_designations enable row level security;
alter table public.hrm_profiles enable row level security;
alter table public.hrm_invites enable row level security;

-- companies: no INSERT policy for regular users on purpose. New companies are
-- provisioned via the service-role key (seed scripts / a future super-admin
-- flow), never by an authenticated staff/HR/MD session.
create policy companies_select on public.hrm_companies
  for select using (id = public.hrm_current_company());

create policy departments_select on public.hrm_departments
  for select using (company_id = public.hrm_current_company());
create policy departments_write on public.hrm_departments
  for all using (company_id = public.hrm_current_company() and public.hrm_is_hr_or_md())
  with check (company_id = public.hrm_current_company() and public.hrm_is_hr_or_md());

create policy designations_select on public.hrm_designations
  for select using (company_id = public.hrm_current_company());
create policy designations_write on public.hrm_designations
  for all using (company_id = public.hrm_current_company() and public.hrm_is_hr_or_md())
  with check (company_id = public.hrm_current_company() and public.hrm_is_hr_or_md());

-- Company-wide profile read (not just self/HR-MD/direct-reports): the org
-- directory and "who can I message" pickers need every staff member to be
-- able to see their colleagues' name/department/designation. profiles holds
-- no sensitive HR data (salary lives in hrm_designations.career_level_data,
-- which the Op Manual's own career-path philosophy already treats as
-- transparent to staff) — restricted fields belong on their own tables.
create policy profiles_select_company on public.hrm_profiles
  for select using (company_id = public.hrm_current_company());
create policy profiles_update_self on public.hrm_profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_write_hr_md on public.hrm_profiles
  for all using (company_id = public.hrm_current_company() and public.hrm_is_hr_or_md())
  with check (company_id = public.hrm_current_company() and public.hrm_is_hr_or_md());

create policy invites_select on public.hrm_invites
  for select using (company_id = public.hrm_current_company() and public.hrm_is_hr_or_md());
create policy invites_write on public.hrm_invites
  for all using (company_id = public.hrm_current_company() and public.hrm_is_hr_or_md())
  with check (company_id = public.hrm_current_company() and public.hrm_is_hr_or_md());
