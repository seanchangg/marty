-- Webhook system: inbound webhook endpoints and queued payloads per user

-- ── webhook_endpoints ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint_name text NOT NULL,
  secret text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Each user can have at most one endpoint per name
CREATE UNIQUE INDEX idx_webhook_endpoints_user_name
ON webhook_endpoints (user_id, endpoint_name);

ALTER TABLE webhook_endpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own webhook endpoints"
ON webhook_endpoints FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own webhook endpoints"
ON webhook_endpoints FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own webhook endpoints"
ON webhook_endpoints FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own webhook endpoints"
ON webhook_endpoints FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to webhook endpoints"
ON webhook_endpoints FOR ALL
USING (auth.role() = 'service_role');

-- ── webhook_queue ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS webhook_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint_name text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  headers jsonb DEFAULT '{}',
  received_at timestamptz NOT NULL DEFAULT now(),
  processed boolean NOT NULL DEFAULT false,
  processed_at timestamptz
);

CREATE INDEX idx_webhook_queue_user_unprocessed
ON webhook_queue (user_id, processed, received_at DESC);

CREATE INDEX idx_webhook_queue_user_endpoint
ON webhook_queue (user_id, endpoint_name, processed);

ALTER TABLE webhook_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own webhook queue"
ON webhook_queue FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own webhook queue"
ON webhook_queue FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own webhook queue"
ON webhook_queue FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to webhook queue"
ON webhook_queue FOR ALL
USING (auth.role() = 'service_role');

-- ── Cleanup function ────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION cleanup_old_webhooks()
RETURNS void
LANGUAGE sql
AS $$
  DELETE FROM webhook_queue
  WHERE processed = true
    AND processed_at < now() - interval '7 days';
$$;
