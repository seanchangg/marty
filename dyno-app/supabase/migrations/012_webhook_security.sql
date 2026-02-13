-- Webhook security: per-user config for rate limits and token caps

CREATE TABLE IF NOT EXISTS webhook_config (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  hourly_token_cap bigint,             -- null = unlimited
  rate_limit_per_hour integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE webhook_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own webhook config"
ON webhook_config FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own webhook config"
ON webhook_config FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own webhook config"
ON webhook_config FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to webhook config"
ON webhook_config FOR ALL
USING (auth.role() = 'service_role');
