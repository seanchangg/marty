-- User credentials: encrypted third-party API keys/tokens per user
create table if not exists public.user_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  credential_name text not null,
  encrypted_value text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Each user can have at most one credential per name
create unique index idx_credentials_user_name on public.user_credentials (user_id, credential_name);

alter table public.user_credentials enable row level security;

create policy "Users can view own credentials"
  on public.user_credentials for select
  using (auth.uid() = user_id);

create policy "Users can insert own credentials"
  on public.user_credentials for insert
  with check (auth.uid() = user_id);

create policy "Users can update own credentials"
  on public.user_credentials for update
  using (auth.uid() = user_id);

create policy "Users can delete own credentials"
  on public.user_credentials for delete
  using (auth.uid() = user_id);
