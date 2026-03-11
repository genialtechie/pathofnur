alter table public.interventions
  alter column actor_session_id drop not null;

alter table public.ledger_entries
  alter column actor_session_id drop not null;
