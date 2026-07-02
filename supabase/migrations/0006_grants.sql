-- This project's public schema doesn't auto-grant privileges on newly
-- created tables to anon/authenticated/service_role the way a stock fresh
-- Supabase project does (likely customized by whatever set up the existing
-- app here) — Postgres denies access before RLS is even evaluated without
-- these. Scoped explicitly to only the hrm_ tables; deliberately not using
-- "grant ... on all tables in schema public" so this never touches
-- anything belonging to the existing app.

grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on
  public.hrm_companies,
  public.hrm_departments,
  public.hrm_designations,
  public.hrm_profiles,
  public.hrm_invites,
  public.hrm_manual_documents,
  public.hrm_manual_sections,
  public.hrm_manual_section_visibility,
  public.hrm_manual_acknowledgements,
  public.hrm_kpi_definitions,
  public.hrm_goals,
  public.hrm_goal_reports,
  public.hrm_appraisals,
  public.hrm_training_modules,
  public.hrm_training_records,
  public.hrm_conversations,
  public.hrm_conversation_participants,
  public.hrm_messages,
  public.hrm_attendance_records,
  public.hrm_leave_requests,
  public.hrm_announcements,
  public.hrm_recognitions
to authenticated, service_role;

-- RLS still restricts anon (no session) to nothing meaningful, but grant the
-- same baseline so a future anon-key use case (e.g. a public status page)
-- isn't blocked at the privilege layer if it's ever added.
grant select on
  public.hrm_companies,
  public.hrm_departments,
  public.hrm_designations,
  public.hrm_profiles,
  public.hrm_invites,
  public.hrm_manual_documents,
  public.hrm_manual_sections,
  public.hrm_manual_section_visibility,
  public.hrm_manual_acknowledgements,
  public.hrm_kpi_definitions,
  public.hrm_goals,
  public.hrm_goal_reports,
  public.hrm_appraisals,
  public.hrm_training_modules,
  public.hrm_training_records,
  public.hrm_conversations,
  public.hrm_conversation_participants,
  public.hrm_messages,
  public.hrm_attendance_records,
  public.hrm_leave_requests,
  public.hrm_announcements,
  public.hrm_recognitions
to anon;
