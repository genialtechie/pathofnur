create table if not exists public.interventions (
  id text primary key,
  actor_session_id text not null,
  input_text text not null,
  locale text null,
  entry_source text null,
  intervention_type text not null check (
    intervention_type in ('contextual_anchor', 'quick_validation', 'concise_ruling')
  ),
  generated_payload jsonb not null,
  citation_ids text[] not null default '{}',
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists interventions_actor_session_id_created_at_idx
  on public.interventions (actor_session_id, created_at desc, id desc);

create table if not exists public.ledger_entries (
  id text primary key,
  actor_session_id text not null,
  intervention_id text not null references public.interventions(id) on delete cascade,
  occurred_at timestamptz not null default timezone('utc', now()),
  summary text not null,
  intervention_type text not null check (
    intervention_type in ('contextual_anchor', 'quick_validation', 'concise_ruling')
  ),
  resolution_state text null check (resolution_state in ('grounded', 'done')),
  followup_status text null check (
    followup_status in ('pending', 'sent', 'completed', 'dismissed', 'expired')
  )
);

create index if not exists ledger_entries_actor_session_id_occurred_at_idx
  on public.ledger_entries (actor_session_id, occurred_at desc, id desc);

create or replace function public.create_intervention_and_ledger(
  intervention_id text,
  ledger_entry_id text,
  actor_session_id text,
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
    actor_session_id,
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
    actor_session_id,
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
    actor_session_id,
    intervention_id,
    occurred_at,
    summary,
    intervention_type,
    resolution_state,
    followup_status
  )
  values (
    ledger_entry_id,
    actor_session_id,
    intervention_id,
    occurred_at,
    summary,
    intervention_type,
    resolution_state,
    followup_status
  );

  return query
  select
    intervention_id,
    ledger_entry_id,
    occurred_at;
end;
$$;

create or replace function public.list_ledger_entries(
  actor_session_id text,
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
  where l.actor_session_id = list_ledger_entries.actor_session_id
    and (
      cursor_occurred_at is null
      or (l.occurred_at, l.id) < (cursor_occurred_at, coalesce(cursor_id, ''))
    )
  order by l.occurred_at desc, l.id desc
  limit greatest(page_size, 1);
$$;
