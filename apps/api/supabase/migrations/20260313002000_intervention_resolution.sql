alter table public.interventions
  add column if not exists resolution_state text null
  check (resolution_state in ('grounded', 'done'));

create or replace function public.resolve_intervention_for_actor(
  target_intervention_id text,
  actor_user_id uuid,
  next_resolution_state text
)
returns table (
  updated_intervention_id text,
  updated_resolution_state text
)
language plpgsql
as $$
declare
  updated_intervention_rows int;
  updated_ledger_rows int;
begin
  update public.interventions
  set resolution_state = next_resolution_state
  where id = target_intervention_id
    and interventions.actor_user_id = resolve_intervention_for_actor.actor_user_id;

  get diagnostics updated_intervention_rows = row_count;

  if updated_intervention_rows = 0 then
    return;
  end if;

  update public.ledger_entries
  set resolution_state = next_resolution_state
  where intervention_id = target_intervention_id
    and ledger_entries.actor_user_id = resolve_intervention_for_actor.actor_user_id;

  get diagnostics updated_ledger_rows = row_count;

  if updated_ledger_rows <> 1 then
    raise exception
      'Intervention resolution integrity failure for intervention % and actor %.',
      target_intervention_id,
      actor_user_id;
  end if;

  return query
  select target_intervention_id, next_resolution_state;
end;
$$;
