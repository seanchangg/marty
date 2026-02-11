-- Agent memories: structured sticky notes stored per-user
create table if not exists public.agent_memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tag text not null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for fast lookups by user + tag
create index idx_memories_user_tag on public.agent_memories (user_id, tag);

-- Full-text search index on content
create index idx_memories_content_search on public.agent_memories using gin (to_tsvector('english', content));

alter table public.agent_memories enable row level security;

create policy "Users can view own memories"
  on public.agent_memories for select
  using (auth.uid() = user_id);

create policy "Users can insert own memories"
  on public.agent_memories for insert
  with check (auth.uid() = user_id);

create policy "Users can update own memories"
  on public.agent_memories for update
  using (auth.uid() = user_id);

create policy "Users can delete own memories"
  on public.agent_memories for delete
  using (auth.uid() = user_id);
