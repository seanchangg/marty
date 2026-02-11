-- Single row per user tracking cumulative token usage
create table if not exists public.token_usage (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tokens_in bigint not null default 0,
  tokens_out bigint not null default 0,
  session_count integer not null default 0
);

alter table public.token_usage enable row level security;

create policy "Users can view own token usage"
  on public.token_usage for select
  using (auth.uid() = user_id);

-- Atomic upsert: insert a new row or increment the existing one
create or replace function public.increment_token_usage(
  p_tokens_in int,
  p_tokens_out int
) returns void as $$
begin
  insert into public.token_usage (user_id, tokens_in, tokens_out, session_count)
  values (auth.uid(), p_tokens_in, p_tokens_out, 1)
  on conflict (user_id) do update set
    tokens_in = token_usage.tokens_in + excluded.tokens_in,
    tokens_out = token_usage.tokens_out + excluded.tokens_out,
    session_count = token_usage.session_count + 1;
end;
$$ language plpgsql security definer;
