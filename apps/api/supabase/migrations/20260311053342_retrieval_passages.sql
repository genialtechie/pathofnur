create extension if not exists vector;

create table if not exists public.retrieval_passages (
  id text primary key,
  source_type text not null check (source_type in ('quran', 'hadith')),
  reference text not null,
  citation_title text not null,
  arabic_text text not null,
  english_translation text not null,
  context_summary text not null,
  emotional_tags text[] not null default '{}',
  retrieval_text text not null,
  embedding vector(768) not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists retrieval_passages_source_type_idx
  on public.retrieval_passages (source_type);

create index if not exists retrieval_passages_embedding_idx
  on public.retrieval_passages
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create or replace function public.match_retrieval_passages(
  query_embedding vector(768),
  match_count int default 5,
  filter_source_types text[] default null
)
returns table (
  id text,
  source_type text,
  reference text,
  citation_title text,
  arabic_text text,
  english_translation text,
  context_summary text,
  emotional_tags text[],
  retrieval_text text,
  similarity float
)
language sql
stable
as $$
  select
    p.id,
    p.source_type,
    p.reference,
    p.citation_title,
    p.arabic_text,
    p.english_translation,
    p.context_summary,
    p.emotional_tags,
    p.retrieval_text,
    1 - (p.embedding <=> query_embedding) as similarity
  from public.retrieval_passages p
  where filter_source_types is null or p.source_type = any(filter_source_types)
  order by p.embedding <=> query_embedding
  limit greatest(match_count, 1);
$$;
