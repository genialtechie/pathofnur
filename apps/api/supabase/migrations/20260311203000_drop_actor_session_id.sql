drop index if exists public.interventions_actor_session_id_created_at_idx;

drop index if exists public.ledger_entries_actor_session_id_occurred_at_idx;

alter table public.interventions
  drop column if exists actor_session_id;

alter table public.ledger_entries
  drop column if exists actor_session_id;
