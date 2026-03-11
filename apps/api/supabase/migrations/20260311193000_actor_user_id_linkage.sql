alter table public.interventions
  alter column actor_session_id drop not null;

alter table public.interventions
  add column if not exists actor_user_id uuid null;

alter table public.ledger_entries
  alter column actor_session_id drop not null;

alter table public.ledger_entries
  add column if not exists actor_user_id uuid null;

create index if not exists interventions_actor_user_id_created_at_idx
  on public.interventions (actor_user_id, created_at desc, id desc);

create index if not exists ledger_entries_actor_user_id_occurred_at_idx
  on public.ledger_entries (actor_user_id, occurred_at desc, id desc);

create or replace function public.create_intervention_and_ledger(
  intervention_id text,
  ledger_entry_id text,
  actor_user_id uuid,
  input_text text,
  locale text,
  entry_source text,
  intervention_type text,
  generated_payload jsonb,
  citation_ids text[],
  occurred_at timestamptz,
  summary text,
  resolution_state text default null,
  followup_status text default null
)
returns table (
  stored_intervention_id text,
  stored_ledger_entry_id text,
  stored_occurred_at timestamptz
)
language plpgsql
as $$
begin
  insert into public.interventions (
    id,
    actor_user_id,
    input_text,
    locale,
    entry_source,
    intervention_type,
    generated_payload,
    citation_ids,
    created_at
  )
  values (
    intervention_id,
    actor_user_id,
    input_text,
    locale,
    entry_source,
    intervention_type,
    generated_payload,
    coalesce(citation_ids, '{}'),
    occurred_at
  );

  insert into public.ledger_entries (
    id,
    actor_user_id,
    intervention_id,
    occurred_at,
    summary,
    intervention_type,
    resolution_state,
    followup_status
  )
  values (
    ledger_entry_id,
    actor_user_id,
    intervention_id,
    occurred_at,
    summary,
    intervention_type,
    resolution_state,
    followup_status
  );

  return query
  select intervention_id, ledger_entry_id, occurred_at;
end;
$$;

create or replace function public.list_ledger_entries(
  actor_user_id uuid,
  page_size int default 20,
  cursor_occurred_at timestamptz default null,
  cursor_id text default null
)
returns table (
  id text,
  intervention_id text,
  occurred_at timestamptz,
  summary text,
  intervention_type text,
  resolution_state text,
  followup_status text
)
language sql
stable
as $$
  select
    l.id,
    l.intervention_id,
    l.occurred_at,
    l.summary,
    l.intervention_type,
    l.resolution_state,
    l.followup_status
  from public.ledger_entries l
  where l.actor_user_id = list_ledger_entries.actor_user_id
    and (
      cursor_occurred_at is null
      or (l.occurred_at, l.id) < (cursor_occurred_at, coalesce(cursor_id, ''))
    )
  order by l.occurred_at desc, l.id desc
  limit greatest(page_size, 1);
$$;
