-- Add provider-aware signature verification config to webhook_endpoints.
--
-- provider: freeform label (e.g. "github", "stripe", "slack", "linear", "custom").
--   When it matches a built-in preset the hardcoded verification logic is used.
--   Otherwise the sig_* columns drive a generic HMAC-SHA256 verifier.
--
-- sig_header:            which request header carries the signature
-- sig_prefix:            prefix to strip from the header value before comparing hex
-- timestamp_header:      optional header that carries a timestamp for replay binding
-- sig_payload_template:  template for the signed payload ({body} and {timestamp} are replaced)

ALTER TABLE webhook_endpoints
  ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'generic',
  ADD COLUMN IF NOT EXISTS sig_header text,
  ADD COLUMN IF NOT EXISTS sig_prefix text,
  ADD COLUMN IF NOT EXISTS timestamp_header text,
  ADD COLUMN IF NOT EXISTS sig_payload_template text;
