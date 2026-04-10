create table if not exists public.moments (
  id text primary key,
  actor_user_id uuid not null,
  title text not null,
  summary text not null,
  status text not null check (status in ('open', 'revisited', 'resolved')),
  first_intervention_id text not null references public.interventions(id) on delete cascade,
  latest_intervention_id text not null references public.interventions(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  resolved_at timestamptz null
);

create index if not exists moments_actor_user_id_updated_at_idx
  on public.moments (actor_user_id, updated_at desc, id desc);

create index if not exists moments_actor_user_id_created_at_idx
  on public.moments (actor_user_id, created_at desc, id desc);

create or replace function public.create_moment_intervention_and_ledger(
  moment_id text,
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
  moment_title text,
  moment_summary text,
  resolution_state text default null,
  followup_status text default null
)
returns table (
  stored_moment_id text,
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
    moment_summary,
    intervention_type,
    resolution_state,
    followup_status
  );

  insert into public.moments (
    id,
    actor_user_id,
    title,
    summary,
    status,
    first_intervention_id,
    latest_intervention_id,
    created_at,
    updated_at,
    resolved_at
  )
  values (
    moment_id,
    actor_user_id,
    moment_title,
    moment_summary,
    'open',
    intervention_id,
    intervention_id,
    occurred_at,
    occurred_at,
    null
  );

  return query
  select
    moment_id,
    intervention_id,
    ledger_entry_id,
    occurred_at;
end;
$$;

create or replace function public.list_journey_moments(
  actor_user_id uuid,
  window_days int default 180,
  page_size int default 100
)
returns table (
  id text,
  title text,
  summary text,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  resolved_at timestamptz,
  latest_intervention_id text
)
language sql
stable
as $$
  select
    m.id,
    m.title,
    m.summary,
    m.status,
    m.created_at,
    m.updated_at,
    m.resolved_at,
    m.latest_intervention_id
  from public.moments m
  where m.actor_user_id = list_journey_moments.actor_user_id
    and m.created_at >= timezone('utc', now()) - make_interval(days => greatest(window_days, 1))
  order by m.created_at desc, m.id desc
  limit greatest(page_size, 1);
$$;
