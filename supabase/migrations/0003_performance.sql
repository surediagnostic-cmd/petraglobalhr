-- KPI catalogue + goal setting/reporting + appraisal, with the appraisal
-- pre-checklist gate mirroring Op Manual §12.4.

create type public.hrm_kpi_frequency as enum ('daily', 'weekly', 'monthly', 'quarterly', 'annual');
create type public.hrm_goal_status as enum ('draft', 'active', 'completed', 'missed');
create type public.hrm_review_status as enum ('pending', 'approved', 'changes_requested');
create type public.hrm_appraisal_cycle as enum ('quarterly', 'annual');

create table public.hrm_kpi_definitions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.hrm_companies(id) on delete cascade,
  section_id uuid references public.hrm_manual_sections(id) on delete set null,
  department_id uuid references public.hrm_departments(id) on delete set null,
  designation_id uuid references public.hrm_designations(id) on delete set null,
  name text not null,
  target_description text,
  target_value numeric,
  target_unit text,
  review_frequency public.hrm_kpi_frequency not null default 'monthly',
  owner_role text,
  created_at timestamptz not null default now()
);

create table public.hrm_goals (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.hrm_profiles(id) on delete cascade,
  company_id uuid not null references public.hrm_companies(id) on delete cascade,
  kpi_definition_id uuid references public.hrm_kpi_definitions(id) on delete set null,
  title text not null,
  description text,
  target_value numeric,
  target_unit text,
  period_start date not null,
  period_end date not null,
  status public.hrm_goal_status not null default 'draft',
  created_by uuid references public.hrm_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.hrm_goal_reports (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.hrm_goals(id) on delete cascade,
  profile_id uuid not null references public.hrm_profiles(id) on delete cascade,
  period_label text not null,
  actual_value numeric,
  narrative text,
  submitted_at timestamptz not null default now(),
  reviewer_id uuid references public.hrm_profiles(id) on delete set null,
  review_status public.hrm_review_status not null default 'pending',
  reviewer_comment text,
  reviewed_at timestamptz
);

create table public.hrm_appraisals (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.hrm_profiles(id) on delete cascade,
  company_id uuid not null references public.hrm_companies(id) on delete cascade,
  cycle public.hrm_appraisal_cycle not null,
  period_label text not null,
  score numeric,
  -- booleans keyed by checklist item from Op Manual §12.4, e.g.
  -- { "employment_letter_on_file": true, "manual_acknowledged": true, ... }
  -- an appraisal cannot move to status='completed' until all are true.
  pre_checklist_json jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  conducted_by uuid references public.hrm_profiles(id) on delete set null,
  conducted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (profile_id, cycle, period_label)
);

create index on public.hrm_kpi_definitions (company_id);
create index on public.hrm_goals (profile_id);
create index on public.hrm_goals (company_id);
create index on public.hrm_goal_reports (goal_id);
create index on public.hrm_goal_reports (profile_id);
create index on public.hrm_appraisals (profile_id);
create index on public.hrm_appraisals (company_id);

create trigger set_updated_at before update on public.hrm_goals
  for each row execute function public.hrm_set_updated_at();

alter table public.hrm_kpi_definitions enable row level security;
alter table public.hrm_goals enable row level security;
alter table public.hrm_goal_reports enable row level security;
alter table public.hrm_appraisals enable row level security;

create policy kpi_definitions_select on public.hrm_kpi_definitions
  for select using (company_id = public.hrm_current_company());
create policy kpi_definitions_write on public.hrm_kpi_definitions
  for all using (company_id = public.hrm_current_company() and public.hrm_is_hr_or_md())
  with check (company_id = public.hrm_current_company() and public.hrm_is_hr_or_md());

create policy goals_select on public.hrm_goals
  for select using (
    company_id = public.hrm_current_company()
    and (
      profile_id = auth.uid()
      or public.hrm_is_hr_or_md()
      or exists (select 1 from public.hrm_profiles p where p.id = hrm_goals.profile_id and p.reports_to = auth.uid())
    )
  );
create policy goals_insert on public.hrm_goals
  for insert with check (
    company_id = public.hrm_current_company() and (profile_id = auth.uid() or public.hrm_is_hr_or_md())
  );
create policy goals_update on public.hrm_goals
  for update using (
    company_id = public.hrm_current_company() and (profile_id = auth.uid() or public.hrm_is_hr_or_md())
  ) with check (
    company_id = public.hrm_current_company() and (profile_id = auth.uid() or public.hrm_is_hr_or_md())
  );
create policy goals_delete on public.hrm_goals
  for delete using (
    company_id = public.hrm_current_company() and (profile_id = auth.uid() or public.hrm_is_hr_or_md())
  );

create policy goal_reports_select on public.hrm_goal_reports
  for select using (
    exists (
      select 1 from public.hrm_goals g
      where g.id = hrm_goal_reports.goal_id and g.company_id = public.hrm_current_company()
        and (
          g.profile_id = auth.uid()
          or public.hrm_is_hr_or_md()
          or exists (select 1 from public.hrm_profiles p where p.id = g.profile_id and p.reports_to = auth.uid())
        )
    )
  );
create policy goal_reports_insert on public.hrm_goal_reports
  for insert with check (
    profile_id = auth.uid()
    and exists (
      select 1 from public.hrm_goals g
      where g.id = hrm_goal_reports.goal_id and g.profile_id = auth.uid() and g.company_id = public.hrm_current_company()
    )
  );
create policy goal_reports_review_update on public.hrm_goal_reports
  for update using (
    public.hrm_is_hr_or_md()
    or exists (
      select 1 from public.hrm_goals g join public.hrm_profiles p on p.id = g.profile_id
      where g.id = hrm_goal_reports.goal_id and p.reports_to = auth.uid()
    )
  ) with check (
    public.hrm_is_hr_or_md()
    or exists (
      select 1 from public.hrm_goals g join public.hrm_profiles p on p.id = g.profile_id
      where g.id = hrm_goal_reports.goal_id and p.reports_to = auth.uid()
    )
  );

create policy appraisals_select on public.hrm_appraisals
  for select using (
    company_id = public.hrm_current_company() and (profile_id = auth.uid() or public.hrm_is_hr_or_md())
  );
create policy appraisals_write on public.hrm_appraisals
  for all using (company_id = public.hrm_current_company() and public.hrm_is_hr_or_md())
  with check (company_id = public.hrm_current_company() and public.hrm_is_hr_or_md());
