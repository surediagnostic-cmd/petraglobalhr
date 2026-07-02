-- MVP+1 tables, created now so the schema doesn't need reshaping later. Each
-- reuses the nullable department_id/designation_id scoping pattern already
-- established for manual sections, KPIs, and training modules.

create type public.hrm_attendance_status as enum ('present', 'absent', 'late', 'half_day');
create type public.hrm_leave_status as enum ('pending', 'approved', 'rejected', 'cancelled');
create type public.hrm_recognition_type as enum ('staff_of_month', 'sure_inspiration', 'md_award', 'staff_of_year');

create table public.hrm_attendance_records (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.hrm_profiles(id) on delete cascade,
  company_id uuid not null references public.hrm_companies(id) on delete cascade,
  date date not null,
  sign_in_at timestamptz,
  sign_out_at timestamptz,
  status public.hrm_attendance_status not null default 'present',
  lateness_minutes int not null default 0,
  penalty_amount numeric not null default 0,
  created_at timestamptz not null default now(),
  unique (profile_id, date)
);

create table public.hrm_leave_requests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.hrm_profiles(id) on delete cascade,
  company_id uuid not null references public.hrm_companies(id) on delete cascade,
  leave_type text not null,
  start_date date not null,
  end_date date not null,
  reason text,
  status public.hrm_leave_status not null default 'pending',
  approver_id uuid references public.hrm_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create table public.hrm_announcements (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.hrm_companies(id) on delete cascade,
  title text not null,
  body text not null,
  department_id uuid references public.hrm_departments(id) on delete set null,
  designation_id uuid references public.hrm_designations(id) on delete set null,
  published_at timestamptz,
  created_by uuid references public.hrm_profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.hrm_recognitions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.hrm_companies(id) on delete cascade,
  profile_id uuid not null references public.hrm_profiles(id) on delete cascade,
  award_type public.hrm_recognition_type not null,
  period_label text,
  awarded_at timestamptz not null default now(),
  citation text
);

create index on public.hrm_attendance_records (profile_id);
create index on public.hrm_leave_requests (profile_id);
create index on public.hrm_announcements (company_id);
create index on public.hrm_recognitions (profile_id);

alter table public.hrm_attendance_records enable row level security;
alter table public.hrm_leave_requests enable row level security;
alter table public.hrm_announcements enable row level security;
alter table public.hrm_recognitions enable row level security;

create policy attendance_select on public.hrm_attendance_records
  for select using (profile_id = auth.uid() or (company_id = public.hrm_current_company() and public.hrm_is_hr_or_md()));
create policy attendance_insert_self on public.hrm_attendance_records
  for insert with check (profile_id = auth.uid() and company_id = public.hrm_current_company());
create policy attendance_update on public.hrm_attendance_records
  for update using (profile_id = auth.uid() or (company_id = public.hrm_current_company() and public.hrm_is_hr_or_md()))
  with check (profile_id = auth.uid() or (company_id = public.hrm_current_company() and public.hrm_is_hr_or_md()));

create policy leave_select on public.hrm_leave_requests
  for select using (profile_id = auth.uid() or (company_id = public.hrm_current_company() and public.hrm_is_hr_or_md()));
create policy leave_insert on public.hrm_leave_requests
  for insert with check (profile_id = auth.uid() and company_id = public.hrm_current_company());
create policy leave_update on public.hrm_leave_requests
  for update using (company_id = public.hrm_current_company() and public.hrm_is_hr_or_md())
  with check (company_id = public.hrm_current_company() and public.hrm_is_hr_or_md());

create policy announcements_select on public.hrm_announcements
  for select using (
    company_id = public.hrm_current_company()
    and (
      public.hrm_is_hr_or_md()
      or (department_id is null and designation_id is null)
      or department_id = (select p.department_id from public.hrm_profiles p where p.id = auth.uid())
      or designation_id = (select p.designation_id from public.hrm_profiles p where p.id = auth.uid())
    )
  );
create policy announcements_write on public.hrm_announcements
  for all using (company_id = public.hrm_current_company() and public.hrm_is_hr_or_md())
  with check (company_id = public.hrm_current_company() and public.hrm_is_hr_or_md());

create policy recognitions_select on public.hrm_recognitions
  for select using (company_id = public.hrm_current_company());
create policy recognitions_write on public.hrm_recognitions
  for all using (company_id = public.hrm_current_company() and public.hrm_is_hr_or_md())
  with check (company_id = public.hrm_current_company() and public.hrm_is_hr_or_md());
