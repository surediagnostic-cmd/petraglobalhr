-- Group-level super-admin: independent of a profile's role in their own
-- company. Lets a small set of Petra Global Group leadership see/create the
-- list of companies, without giving that ability to ordinary company
-- MDs/HR Managers, who must stay scoped to their own company only.

alter table public.hrm_profiles
  add column is_super_admin boolean not null default false;

create or replace function public.hrm_is_super_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select is_super_admin from public.hrm_profiles where id = auth.uid()),
    false
  );
$$;

-- Replaces the "no insert policy at all" stance from 0001: company creation
-- was previously service-role-only. Super admins can now also create
-- companies from the app UI; service-role scripts still work unchanged.
create policy hrm_companies_select_super_admin on public.hrm_companies
  for select using (public.hrm_is_super_admin());
create policy hrm_companies_insert_super_admin on public.hrm_companies
  for insert with check (public.hrm_is_super_admin());

-- Grant matches the scoped pattern from 0006 (table already granted there;
-- this file only adds the new column + policies, no new table).
