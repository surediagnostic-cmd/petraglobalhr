-- Lets a super admin fully administer another company (same access as that
-- company's own MD) by temporarily switching their own hrm_profiles row's
-- company_id/role, remembering their real ("home") assignment so they can
-- switch back. This deliberately reuses the profile row rather than
-- introducing multi-company membership, which would touch every RLS policy
-- in the schema — the tradeoff is that while "visiting", the super admin
-- shows up in that company's own staff/directory views, and temporarily
-- can't see their home company's data (RLS scopes everything by the
-- profile's current company_id) until they switch back.

alter table public.hrm_profiles
  add column home_company_id uuid references public.hrm_companies(id) on delete set null,
  add column home_role public.hrm_role_tier,
  add column home_department_id uuid references public.hrm_departments(id) on delete set null,
  add column home_designation_id uuid references public.hrm_designations(id) on delete set null;

-- profiles_update_self (0001) only checks `id = auth.uid()` — it never
-- restricted which columns a user can change on their own row, so nothing
-- stopped a plain staff member from self-promoting via a raw update
-- (role, company_id, is_super_admin, department_id, designation_id). RLS
-- policies can't compare OLD vs NEW directly, so this needs a trigger.
-- service_role (our trusted server actions, e.g. the visit-company switch
-- below) and HR/MD (who already have a separate, legitimate policy letting
-- them edit any profile in their company) bypass this guard; everyone else
-- editing their own row cannot change these five fields.
create or replace function public.hrm_guard_profile_self_update()
returns trigger
language plpgsql
security definer set search_path = public as $$
begin
  if auth.role() = 'service_role' or public.hrm_is_hr_or_md() then
    return new;
  end if;

  if new.role is distinct from old.role
    or new.company_id is distinct from old.company_id
    or new.is_super_admin is distinct from old.is_super_admin
    or new.department_id is distinct from old.department_id
    or new.designation_id is distinct from old.designation_id then
    raise exception 'You are not allowed to change this field on your own profile.';
  end if;

  return new;
end;
$$;

create trigger guard_profile_self_update before update on public.hrm_profiles
  for each row execute function public.hrm_guard_profile_self_update();

-- Neither profiles_select_company (own company only) nor profiles_select_self
-- let a super admin read another company's staff — which silently broke the
-- Companies page's staff-count-per-company query for any company they
-- weren't already a member of. Read-only, mirrors the existing
-- hrm_companies_select_super_admin pattern.
create policy profiles_select_super_admin on public.hrm_profiles
  for select using (public.hrm_is_super_admin());
