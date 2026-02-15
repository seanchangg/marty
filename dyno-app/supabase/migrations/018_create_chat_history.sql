-- Chat history: one row per user, messages stored as JSONB array
create table if not exists public.chat_history (
  user_id uuid primary key references auth.users(id) on delete cascade,
  messages jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.chat_history enable row level security;

create policy "Users can view own chat history"
  on public.chat_history for select
  using (auth.uid() = user_id);

create policy "Users can insert own chat history"
  on public.chat_history for insert
  with check (auth.uid() = user_id);

create policy "Users can update own chat history"
  on public.chat_history for update
  using (auth.uid() = user_id);

create policy "Users can delete own chat history"
  on public.chat_history for delete
  using (auth.uid() = user_id);
