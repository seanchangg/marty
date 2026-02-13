-- Agent control tables — activity logging, child session persistence, token usage rollups

-- ── agent_activity ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS agent_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  tool_name text NOT NULL,
  params jsonb DEFAULT '{}',
  success boolean NOT NULL DEFAULT true,
  duration_ms integer,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_agent_activity_user_time
ON agent_activity (user_id, created_at DESC);

CREATE INDEX idx_agent_activity_user_tool_time
ON agent_activity (user_id, tool_name, created_at DESC);

ALTER TABLE agent_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own activity"
ON agent_activity FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to activity"
ON agent_activity FOR ALL
USING (auth.role() = 'service_role');

-- ── child_sessions ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS child_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text NOT NULL UNIQUE,
  model text,
  prompt text,
  status text NOT NULL DEFAULT 'running',
  tokens_in bigint NOT NULL DEFAULT 0,
  tokens_out bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX idx_child_sessions_user_time
ON child_sessions (user_id, created_at DESC);

CREATE INDEX idx_child_sessions_user_status
ON child_sessions (user_id, status);

ALTER TABLE child_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own child sessions"
ON child_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to child sessions"
ON child_sessions FOR ALL
USING (auth.role() = 'service_role');

-- ── token_usage_hourly ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS token_usage_hourly (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hour timestamptz NOT NULL,
  tokens_in bigint NOT NULL DEFAULT 0,
  tokens_out bigint NOT NULL DEFAULT 0,
  request_count integer NOT NULL DEFAULT 0,
  UNIQUE (user_id, hour)
);

CREATE INDEX idx_token_usage_hourly_user_hour
ON token_usage_hourly (user_id, hour DESC);

ALTER TABLE token_usage_hourly ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own token usage hourly"
ON token_usage_hourly FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to token usage hourly"
ON token_usage_hourly FOR ALL
USING (auth.role() = 'service_role');

-- ── Cleanup functions ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION cleanup_old_activity()
RETURNS void
LANGUAGE sql
AS $$
  DELETE FROM agent_activity WHERE created_at < now() - interval '7 days';
$$;

CREATE OR REPLACE FUNCTION cleanup_old_child_sessions()
RETURNS void
LANGUAGE sql
AS $$
  DELETE FROM child_sessions
  WHERE status IN ('completed', 'error', 'terminated')
    AND completed_at < now() - interval '24 hours';
$$;

-- ── Hourly token upsert RPC ────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION increment_hourly_token_usage(
  p_user_id uuid,
  p_tokens_in bigint,
  p_tokens_out bigint
)
RETURNS void
LANGUAGE sql
AS $$
  INSERT INTO token_usage_hourly (user_id, hour, tokens_in, tokens_out, request_count)
  VALUES (p_user_id, date_trunc('hour', now()), p_tokens_in, p_tokens_out, 1)
  ON CONFLICT (user_id, hour)
  DO UPDATE SET
    tokens_in = token_usage_hourly.tokens_in + EXCLUDED.tokens_in,
    tokens_out = token_usage_hourly.tokens_out + EXCLUDED.tokens_out,
    request_count = token_usage_hourly.request_count + 1;
$$;
