-- Add a processing prompt to webhook endpoints.
-- The agent sets this when registering a webhook to tell its future
-- headless self what to do when the webhook fires.

ALTER TABLE webhook_endpoints
  ADD COLUMN IF NOT EXISTS prompt text;
