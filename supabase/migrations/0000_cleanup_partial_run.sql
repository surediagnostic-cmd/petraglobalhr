-- Run this ONCE before re-running 0001-0005, only if your project hit the
-- "relation already exists" error on the first attempt. It removes exactly
-- the empty, unprefixed objects that partial run created (companies,
-- departments, designations tables + 4 types) before it collided with a
-- pre-existing unrelated "profiles" table.
--
-- IMPORTANT: this deliberately does NOT touch public.set_updated_at() —
-- that name already existed in this database (used by triggers on vendors,
-- vendor_transactions, repayment_plan, loan_register, partners) before our
-- first migration attempt ran. Postgres's CREATE OR REPLACE FUNCTION
-- silently overwrites on a name collision rather than erroring, so that
-- attempt already replaced it. The corrected migrations below only ever
-- create hrm_-prefixed functions, so this name is never touched again after
-- this cleanup — but we cannot safely drop or otherwise modify it now
-- without risking those five existing triggers.

drop table if exists public.companies cascade;
drop table if exists public.departments cascade;
drop table if exists public.designations cascade;
drop type if exists public.role_tier;
drop type if exists public.career_track;
drop type if exists public.employment_status;
drop type if exists public.invite_status;
