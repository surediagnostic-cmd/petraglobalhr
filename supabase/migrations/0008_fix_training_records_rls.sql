-- RLS audit fix: three policies let an HR Manager/MD from ONE company
-- read or write rows belonging to ANOTHER company, because their
-- is_hr_or_md() branch had no accompanying company_id check at all. Each
-- fix scopes that branch to the caller's own company via whatever path
-- reaches a company_id column.

-- 1) training_records has no company_id of its own — scope through
--    hrm_training_modules.company_id, which module_id always references.
drop policy training_records_select on public.hrm_training_records;
create policy training_records_select on public.hrm_training_records
  for select using (
    profile_id = auth.uid()
    or exists (
      select 1 from public.hrm_training_modules m
      where m.id = hrm_training_records.module_id
        and m.company_id = public.hrm_current_company()
        and (
          public.hrm_is_hr_or_md()
          or exists (
            select 1 from public.hrm_profiles p
            where p.id = hrm_training_records.profile_id and p.reports_to = auth.uid()
          )
        )
    )
  );

drop policy training_records_update on public.hrm_training_records;
create policy training_records_update on public.hrm_training_records
  for update using (
    profile_id = auth.uid()
    or exists (
      select 1 from public.hrm_training_modules m
      where m.id = hrm_training_records.module_id
        and m.company_id = public.hrm_current_company()
        and public.hrm_is_hr_or_md()
    )
  )
  with check (
    profile_id = auth.uid()
    or exists (
      select 1 from public.hrm_training_modules m
      where m.id = hrm_training_records.module_id
        and m.company_id = public.hrm_current_company()
        and public.hrm_is_hr_or_md()
    )
  );

-- 2) manual_section_visibility has no company_id of its own — scope
--    through hrm_manual_sections -> hrm_manual_documents.company_id.
drop policy manual_section_visibility_write on public.hrm_manual_section_visibility;
create policy manual_section_visibility_write on public.hrm_manual_section_visibility
  for all using (
    public.hrm_is_hr_or_md()
    and exists (
      select 1 from public.hrm_manual_sections s
      join public.hrm_manual_documents d on d.id = s.document_id
      where s.id = hrm_manual_section_visibility.section_id and d.company_id = public.hrm_current_company()
    )
  )
  with check (
    public.hrm_is_hr_or_md()
    and exists (
      select 1 from public.hrm_manual_sections s
      join public.hrm_manual_documents d on d.id = s.document_id
      where s.id = hrm_manual_section_visibility.section_id and d.company_id = public.hrm_current_company()
    )
  );

-- 3) goal_reports_review_update's is_hr_or_md() branch had no company
--    check — scope through hrm_goals.company_id.
drop policy goal_reports_review_update on public.hrm_goal_reports;
create policy goal_reports_review_update on public.hrm_goal_reports
  for update using (
    exists (
      select 1 from public.hrm_goals g
      where g.id = hrm_goal_reports.goal_id
        and g.company_id = public.hrm_current_company()
        and public.hrm_is_hr_or_md()
    )
    or exists (
      select 1 from public.hrm_goals g join public.hrm_profiles p on p.id = g.profile_id
      where g.id = hrm_goal_reports.goal_id and p.reports_to = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.hrm_goals g
      where g.id = hrm_goal_reports.goal_id
        and g.company_id = public.hrm_current_company()
        and public.hrm_is_hr_or_md()
    )
    or exists (
      select 1 from public.hrm_goals g join public.hrm_profiles p on p.id = g.profile_id
      where g.id = hrm_goal_reports.goal_id and p.reports_to = auth.uid()
    )
  );
