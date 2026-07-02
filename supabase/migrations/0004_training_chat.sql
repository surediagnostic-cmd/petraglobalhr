-- Training modules/records, and DM chat built on a conversations/participants
-- join table so group channels can be added later (type='channel', >2
-- participants) with zero migration.

create type public.hrm_training_status as enum ('assigned', 'in_progress', 'completed');
create type public.hrm_conversation_type as enum ('direct', 'channel');

create table public.hrm_training_modules (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.hrm_companies(id) on delete cascade,
  title text not null,
  description text,
  delivery_mode text,
  duration_minutes int,
  department_id uuid references public.hrm_departments(id) on delete set null,
  designation_id uuid references public.hrm_designations(id) on delete set null,
  is_mandatory boolean not null default false,
  created_by uuid references public.hrm_profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.hrm_training_records (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.hrm_training_modules(id) on delete cascade,
  profile_id uuid not null references public.hrm_profiles(id) on delete cascade,
  status public.hrm_training_status not null default 'assigned',
  hours_logged numeric not null default 0,
  completed_at timestamptz,
  verified_by uuid references public.hrm_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (module_id, profile_id)
);

create index on public.hrm_training_modules (company_id);
create index on public.hrm_training_records (profile_id);
create index on public.hrm_training_records (module_id);

create trigger set_updated_at before update on public.hrm_training_records
  for each row execute function public.hrm_set_updated_at();

-- Same visibility shape as can_view_section(): company-wide when both
-- department_id/designation_id are NULL, otherwise must match the viewer's
-- own department or designation. HR/MD bypass and see every module.
create or replace function public.hrm_can_view_training_module(p_module_id uuid, p_profile_id uuid)
returns boolean
language plpgsql stable security definer set search_path = public as $$
declare
  v_role public.hrm_role_tier;
  v_department_id uuid;
  v_designation_id uuid;
  v_module_department_id uuid;
  v_module_designation_id uuid;
begin
  select role, department_id, designation_id
    into v_role, v_department_id, v_designation_id
    from public.hrm_profiles where id = p_profile_id;

  if v_role in ('hr_manager', 'md') then
    return true;
  end if;

  select department_id, designation_id
    into v_module_department_id, v_module_designation_id
    from public.hrm_training_modules where id = p_module_id;

  return (v_module_department_id is null and v_module_designation_id is null)
    or v_module_department_id = v_department_id
    or v_module_designation_id = v_designation_id;
end;
$$;

alter table public.hrm_training_modules enable row level security;
alter table public.hrm_training_records enable row level security;

create policy training_modules_select on public.hrm_training_modules
  for select using (
    company_id = public.hrm_current_company() and public.hrm_can_view_training_module(id, auth.uid())
  );
create policy training_modules_write on public.hrm_training_modules
  for all using (company_id = public.hrm_current_company() and public.hrm_is_hr_or_md())
  with check (company_id = public.hrm_current_company() and public.hrm_is_hr_or_md());

create policy training_records_select on public.hrm_training_records
  for select using (
    profile_id = auth.uid()
    or public.hrm_is_hr_or_md()
    or exists (select 1 from public.hrm_profiles p where p.id = hrm_training_records.profile_id and p.reports_to = auth.uid())
  );
create policy training_records_insert_self on public.hrm_training_records
  for insert with check (profile_id = auth.uid());
create policy training_records_update on public.hrm_training_records
  for update using (profile_id = auth.uid() or public.hrm_is_hr_or_md())
  with check (profile_id = auth.uid() or public.hrm_is_hr_or_md());

-- Direct messaging

create table public.hrm_conversations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.hrm_companies(id) on delete cascade,
  type public.hrm_conversation_type not null default 'direct',
  title text,
  created_at timestamptz not null default now()
);

create table public.hrm_conversation_participants (
  conversation_id uuid not null references public.hrm_conversations(id) on delete cascade,
  profile_id uuid not null references public.hrm_profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, profile_id)
);

create table public.hrm_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.hrm_conversations(id) on delete cascade,
  sender_id uuid not null references public.hrm_profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index on public.hrm_conversation_participants (profile_id);
create index on public.hrm_messages (conversation_id);
create index on public.hrm_messages (created_at);

create or replace function public.hrm_is_conversation_participant(p_conversation_id uuid, p_profile_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.hrm_conversation_participants cp
    where cp.conversation_id = p_conversation_id and cp.profile_id = p_profile_id
  );
$$;

alter table public.hrm_conversations enable row level security;
alter table public.hrm_conversation_participants enable row level security;
alter table public.hrm_messages enable row level security;

create policy conversations_select on public.hrm_conversations
  for select using (public.hrm_is_conversation_participant(id, auth.uid()));
-- Row-level visibility for existing conversations is handled above. The
-- product rule "staff may only START a DM with HR Manager/MD, not another
-- staff member" is a creation-time business rule, not a row-visibility rule,
-- so it is enforced in the createConversation Server Action, not here.
create policy conversations_insert on public.hrm_conversations
  for insert with check (company_id = public.hrm_current_company());

create policy conversation_participants_select on public.hrm_conversation_participants
  for select using (public.hrm_is_conversation_participant(conversation_id, auth.uid()));
create policy conversation_participants_insert on public.hrm_conversation_participants
  for insert with check (
    profile_id = auth.uid()
    or public.hrm_is_conversation_participant(conversation_id, auth.uid())
  );

create policy messages_select on public.hrm_messages
  for select using (public.hrm_is_conversation_participant(conversation_id, auth.uid()));
create policy messages_insert on public.hrm_messages
  for insert with check (
    sender_id = auth.uid() and public.hrm_is_conversation_participant(conversation_id, auth.uid())
  );

-- Required for the chat UI's Realtime subscription to receive INSERT events.
-- Supabase projects ship a `supabase_realtime` publication with no tables in
-- it by default, so new tables need to be added explicitly.
alter publication supabase_realtime add table public.hrm_messages;
