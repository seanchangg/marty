-- Add mode column to webhook_endpoints for direct (widget-facing) webhooks
-- mode = 'agent': gateway processes payload (costs tokens) — existing behavior
-- mode = 'direct': stored for widget polling only, no gateway notification

ALTER TABLE webhook_endpoints
  ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT 'agent';

ALTER TABLE webhook_endpoints
  ADD CONSTRAINT webhook_endpoints_mode_check
  CHECK (mode IN ('agent', 'direct'));

COMMENT ON COLUMN webhook_endpoints.mode IS
  'agent = gateway processes payload (costs tokens), direct = stored for widget polling only';
