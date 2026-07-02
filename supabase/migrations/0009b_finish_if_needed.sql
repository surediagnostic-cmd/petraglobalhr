-- Safe to run regardless of how much of 0009 already succeeded — drops
-- and recreates the trigger/function/policy so it ends in a known-good
-- state either way. Does NOT touch the columns (those already exist).

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

drop trigger if exists guard_profile_self_update on public.hrm_profiles;
create trigger guard_profile_self_update before update on public.hrm_profiles
  for each row execute function public.hrm_guard_profile_self_update();

drop policy if exists profiles_select_super_admin on public.hrm_profiles;
create policy profiles_select_super_admin on public.hrm_profiles
  for select using (public.hrm_is_super_admin());
