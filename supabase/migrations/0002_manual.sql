-- Operation Manual / Staff Handbook: versioned documents, sections scoped by
-- department/designation visibility, and per-staff acknowledgement records.

create type public.hrm_manual_doc_type as enum ('operation_manual', 'staff_handbook');
create type public.hrm_manual_doc_status as enum ('draft', 'active', 'archived');

create table public.hrm_manual_documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.hrm_companies(id) on delete cascade,
  doc_type public.hrm_manual_doc_type not null,
  title text not null,
  version text not null,
  effective_date date,
  status public.hrm_manual_doc_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, doc_type, version)
);

create table public.hrm_manual_sections (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.hrm_manual_documents(id) on delete cascade,
  section_number text not null,
  title text not null,
  subtitle text,
  body text not null default '',
  who_is_responsible text,
  escalation_chain text,
  -- true for sections like Op Manual §14 "CEO Command Centre" that are about
  -- seniority, not department -- visible to HR/MD regardless of any
  -- manual_section_visibility rows, and hidden from everyone else.
  md_only boolean not null default false,
  order_index int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (document_id, section_number)
);

create table public.hrm_manual_section_visibility (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.hrm_manual_sections(id) on delete cascade,
  department_id uuid references public.hrm_departments(id) on delete cascade,
  designation_id uuid references public.hrm_designations(id) on delete cascade
  -- a row with both department_id and designation_id NULL means "company-wide"
);

create table public.hrm_manual_acknowledgements (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.hrm_profiles(id) on delete cascade,
  document_id uuid not null references public.hrm_manual_documents(id) on delete cascade,
  version text not null,
  acknowledged_at timestamptz not null default now(),
  signature_data text,
  unique (profile_id, document_id, version)
);

create index on public.hrm_manual_sections (document_id);
create index on public.hrm_manual_section_visibility (section_id);
create index on public.hrm_manual_section_visibility (department_id);
create index on public.hrm_manual_section_visibility (designation_id);
create index on public.hrm_manual_acknowledgements (profile_id);
create index on public.hrm_manual_acknowledgements (document_id);

create trigger set_updated_at before update on public.hrm_manual_documents
  for each row execute function public.hrm_set_updated_at();
create trigger set_updated_at before update on public.hrm_manual_sections
  for each row execute function public.hrm_set_updated_at();

-- Single place encoding "can this profile see this section" so the rule isn't
-- duplicated across policies. SECURITY DEFINER for the same recursion reason
-- as current_company()/current_role().
create or replace function public.hrm_can_view_section(p_section_id uuid, p_profile_id uuid)
returns boolean
language plpgsql stable security definer set search_path = public as $$
declare
  v_role public.hrm_role_tier;
  v_department_id uuid;
  v_designation_id uuid;
  v_md_only boolean;
begin
  select role, department_id, designation_id
    into v_role, v_department_id, v_designation_id
    from public.hrm_profiles where id = p_profile_id;

  if v_role in ('hr_manager', 'md') then
    return true;
  end if;

  select md_only into v_md_only from public.hrm_manual_sections where id = p_section_id;
  if coalesce(v_md_only, false) then
    return false;
  end if;

  return exists (
    select 1 from public.hrm_manual_section_visibility v
    where v.section_id = p_section_id
      and (
        (v.department_id is null and v.designation_id is null)
        or v.department_id = v_department_id
        or v.designation_id = v_designation_id
      )
  );
end;
$$;

alter table public.hrm_manual_documents enable row level security;
alter table public.hrm_manual_sections enable row level security;
alter table public.hrm_manual_section_visibility enable row level security;
alter table public.hrm_manual_acknowledgements enable row level security;

create policy manual_documents_select on public.hrm_manual_documents
  for select using (company_id = public.hrm_current_company());
create policy manual_documents_write on public.hrm_manual_documents
  for all using (company_id = public.hrm_current_company() and public.hrm_is_hr_or_md())
  with check (company_id = public.hrm_current_company() and public.hrm_is_hr_or_md());

create policy manual_sections_select on public.hrm_manual_sections
  for select using (
    exists (
      select 1 from public.hrm_manual_documents d
      where d.id = hrm_manual_sections.document_id and d.company_id = public.hrm_current_company()
    )
    and public.hrm_can_view_section(id, auth.uid())
  );
create policy manual_sections_write on public.hrm_manual_sections
  for all using (
    exists (
      select 1 from public.hrm_manual_documents d
      where d.id = hrm_manual_sections.document_id and d.company_id = public.hrm_current_company()
    )
    and public.hrm_is_hr_or_md()
  )
  with check (
    exists (
      select 1 from public.hrm_manual_documents d
      where d.id = hrm_manual_sections.document_id and d.company_id = public.hrm_current_company()
    )
    and public.hrm_is_hr_or_md()
  );

create policy manual_section_visibility_select on public.hrm_manual_section_visibility
  for select using (
    exists (
      select 1 from public.hrm_manual_sections s
      join public.hrm_manual_documents d on d.id = s.document_id
      where s.id = hrm_manual_section_visibility.section_id and d.company_id = public.hrm_current_company()
    )
  );
create policy manual_section_visibility_write on public.hrm_manual_section_visibility
  for all using (public.hrm_is_hr_or_md()) with check (public.hrm_is_hr_or_md());

create policy manual_ack_select_self on public.hrm_manual_acknowledgements
  for select using (profile_id = auth.uid());
create policy manual_ack_select_hr_md on public.hrm_manual_acknowledgements
  for select using (
    public.hrm_is_hr_or_md()
    and exists (
      select 1 from public.hrm_profiles p
      where p.id = hrm_manual_acknowledgements.profile_id and p.company_id = public.hrm_current_company()
    )
  );
create policy manual_ack_insert_self on public.hrm_manual_acknowledgements
  for insert with check (profile_id = auth.uid());
