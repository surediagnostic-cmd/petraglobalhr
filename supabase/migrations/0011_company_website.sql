-- Optional "more info" link for a company (e.g. a Linktree or website) —
-- self-service, managed by that company's own HR/MD via a new Company
-- Profile page, not dictated by the group super admin.
alter table public.hrm_companies
  add column website_url text;
