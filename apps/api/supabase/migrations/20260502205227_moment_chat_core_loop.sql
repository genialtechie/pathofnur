alter table if exists public.moments
  drop constraint if exists moments_first_intervention_id_fkey;

alter table if exists public.moments
  drop constraint if exists moments_latest_intervention_id_fkey;

alter table if exists public.moments
  drop constraint if exists moments_status_check;

alter table if exists public.moments
  drop column if exists first_intervention_id,
  drop column if exists latest_intervention_id;

alter table if exists public.moments
  alter column summary set default '',
  alter column status set default 'open';

update public.moments
set status = 'open'
where status not in ('open', 'resolved');

alter table if exists public.moments
  add constraint moments_status_check check (status in ('open', 'resolved'));

create table if not exists public.moment_messages (
  id text primary key,
  moment_id text not null references public.moments(id) on delete cascade,
  actor_user_id uuid not null,
  role text not null check (role in ('user', 'assistant')),
  text text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists moment_messages_moment_created_at_idx
  on public.moment_messages (moment_id, created_at asc, id asc);

create index if not exists moment_messages_actor_user_id_created_at_idx
  on public.moment_messages (actor_user_id, created_at desc, id desc);

create table if not exists public.moment_artifacts (
  id text primary key,
  moment_id text not null references public.moments(id) on delete cascade,
  actor_user_id uuid not null,
  kind text not null check (kind in ('ayah', 'hadith', 'dua', 'note')),
  title text not null,
  reference text null,
  content text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists moment_artifacts_moment_created_at_idx
  on public.moment_artifacts (moment_id, created_at asc, id asc);

create index if not exists moment_artifacts_actor_user_id_created_at_idx
  on public.moment_artifacts (actor_user_id, created_at desc, id desc);

create or replace function public.create_moment_with_exchange(
  moment_id text,
  actor_user_id uuid,
  moment_title text,
  moment_summary text,
  user_message_id text,
  assistant_message_id text,
  user_text text,
  assistant_text text,
  occurred_at timestamptz,
  artifact_rows jsonb default '[]'::jsonb
)
returns table (
  stored_moment_id text,
  stored_user_message_id text,
  stored_assistant_message_id text
)
language plpgsql
as $$
begin
  insert into public.moments (
    id,
    actor_user_id,
    title,
    summary,
    status,
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
    occurred_at,
    occurred_at,
    null
  );

  insert into public.moment_messages (
    id,
    moment_id,
    actor_user_id,
    role,
    text,
    created_at
  )
  values
    (
      user_message_id,
      moment_id,
      actor_user_id,
      'user',
      user_text,
      occurred_at
    ),
    (
      assistant_message_id,
      moment_id,
      actor_user_id,
      'assistant',
      assistant_text,
      occurred_at + interval '1 millisecond'
    );

  insert into public.moment_artifacts (
    id,
    moment_id,
    actor_user_id,
    kind,
    title,
    reference,
    content,
    created_at
  )
  select
    artifact.id,
    moment_id,
    actor_user_id,
    artifact.kind,
    artifact.title,
    artifact.reference,
    artifact.content,
    occurred_at + interval '2 milliseconds'
  from jsonb_to_recordset(coalesce(artifact_rows, '[]'::jsonb)) as artifact(
    id text,
    kind text,
    title text,
    reference text,
    content text
  );

  return query select moment_id, user_message_id, assistant_message_id;
end;
$$;

create or replace function public.append_moment_exchange(
  target_moment_id text,
  actor_user_id uuid,
  next_title text,
  next_summary text,
  user_message_id text,
  assistant_message_id text,
  user_text text,
  assistant_text text,
  occurred_at timestamptz,
  artifact_rows jsonb default '[]'::jsonb
)
returns table (
  stored_moment_id text,
  stored_user_message_id text,
  stored_assistant_message_id text
)
language plpgsql
as $$
declare
  updated_rows int;
begin
  update public.moments
  set
    title = next_title,
    summary = next_summary,
    status = 'open',
    updated_at = occurred_at,
    resolved_at = null
  where id = target_moment_id
    and moments.actor_user_id = append_moment_exchange.actor_user_id;

  get diagnostics updated_rows = row_count;

  if updated_rows = 0 then
    return;
  end if;

  insert into public.moment_messages (
    id,
    moment_id,
    actor_user_id,
    role,
    text,
    created_at
  )
  values
    (
      user_message_id,
      target_moment_id,
      actor_user_id,
      'user',
      user_text,
      occurred_at
    ),
    (
      assistant_message_id,
      target_moment_id,
      actor_user_id,
      'assistant',
      assistant_text,
      occurred_at + interval '1 millisecond'
    );

  insert into public.moment_artifacts (
    id,
    moment_id,
    actor_user_id,
    kind,
    title,
    reference,
    content,
    created_at
  )
  select
    artifact.id,
    target_moment_id,
    actor_user_id,
    artifact.kind,
    artifact.title,
    artifact.reference,
    artifact.content,
    occurred_at + interval '2 milliseconds'
  from jsonb_to_recordset(coalesce(artifact_rows, '[]'::jsonb)) as artifact(
    id text,
    kind text,
    title text,
    reference text,
    content text
  );

  return query select target_moment_id, user_message_id, assistant_message_id;
end;
$$;
