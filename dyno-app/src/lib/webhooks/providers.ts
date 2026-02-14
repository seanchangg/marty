/**
 * Provider-aware webhook signature verification.
 *
 * Built-in presets handle known providers with battle-tested logic.
 * Any other provider uses the custom path: the endpoint's stored
 * sig_header / sig_prefix / timestamp_header / sig_payload_template
 * columns drive a generic HMAC-SHA256 verifier so agents can hook up
 * arbitrary services without code changes.
 */

import { createHmac, timingSafeEqual } from "crypto";

export interface WebhookProvider {
  signatureHeader: string;
  signedPayloadFormat: string;
  getSignature(headers: Headers): string;
  verify(secret: string, rawBody: string, signature: string, headers: Headers): boolean;
}

/** Per-endpoint config stored in the DB for custom providers. */
export interface CustomProviderConfig {
  sig_header: string | null;
  sig_prefix: string | null;
  timestamp_header: string | null;
  sig_payload_template: string | null;
}

function hmacSha256Hex(secret: string, data: string): string {
  return createHmac("sha256", secret).update(data).digest("hex");
}

function safeCompareHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
  } catch {
    return false;
  }
}

// ── Built-in presets ─────────────────────────────────────────────────────────

const generic: WebhookProvider = {
  signatureHeader: "X-Webhook-Signature",
  signedPayloadFormat: "sha256=HMAC-SHA256(secret, [timestamp.]body)",
  getSignature(headers) {
    return headers.get("x-webhook-signature") || "";
  },
  verify(secret, rawBody, signature, headers) {
    const timestamp = headers.get("x-webhook-timestamp");
    const signedPayload = timestamp ? `${timestamp}.${rawBody}` : rawBody;
    const expected = hmacSha256Hex(secret, signedPayload);
    const provided = signature.replace(/^sha256=/, "");
    return safeCompareHex(expected, provided);
  },
};

const github: WebhookProvider = {
  signatureHeader: "X-Hub-Signature-256",
  signedPayloadFormat: "sha256=HMAC-SHA256(secret, body)",
  getSignature(headers) {
    return headers.get("x-hub-signature-256") || "";
  },
  verify(secret, rawBody, signature) {
    const expected = hmacSha256Hex(secret, rawBody);
    const provided = signature.replace(/^sha256=/, "");
    return safeCompareHex(expected, provided);
  },
};

const stripe: WebhookProvider = {
  signatureHeader: "Stripe-Signature",
  signedPayloadFormat: "t=<timestamp>,v1=HMAC-SHA256(secret, timestamp.body)",
  getSignature(headers) {
    return headers.get("stripe-signature") || "";
  },
  verify(secret, rawBody, signature) {
    const parts: Record<string, string> = {};
    for (const pair of signature.split(",")) {
      const [key, ...rest] = pair.split("=");
      if (key && rest.length) {
        parts[key.trim()] = rest.join("=").trim();
      }
    }
    const timestamp = parts["t"];
    const v1Sig = parts["v1"];
    if (!timestamp || !v1Sig) return false;
    const expected = hmacSha256Hex(secret, `${timestamp}.${rawBody}`);
    return safeCompareHex(expected, v1Sig);
  },
};

const slack: WebhookProvider = {
  signatureHeader: "X-Slack-Signature",
  signedPayloadFormat: "v0=HMAC-SHA256(secret, v0:timestamp:body)",
  getSignature(headers) {
    return headers.get("x-slack-signature") || "";
  },
  verify(secret, rawBody, signature, headers) {
    const timestamp = headers.get("x-slack-request-timestamp");
    if (!timestamp) return false;
    const expected = hmacSha256Hex(secret, `v0:${timestamp}:${rawBody}`);
    const provided = signature.replace(/^v0=/, "");
    return safeCompareHex(expected, provided);
  },
};

/** Map of built-in preset names to their providers. */
export const presets: Record<string, WebhookProvider> = {
  generic,
  github,
  stripe,
  slack,
};

// ── Custom provider builder ──────────────────────────────────────────────────

/**
 * Build a WebhookProvider from user-supplied config columns.
 * Falls back to sensible defaults so partial config still works:
 *   sig_header        → "X-Webhook-Signature"
 *   sig_prefix        → "sha256="
 *   sig_payload_template → "{body}"
 *   timestamp_header  → (none)
 */
export function buildCustomProvider(cfg: CustomProviderConfig): WebhookProvider {
  const headerName = cfg.sig_header || "X-Webhook-Signature";
  const prefix = cfg.sig_prefix ?? "sha256=";
  const template = cfg.sig_payload_template || "{body}";
  const tsHeader = cfg.timestamp_header || null;

  return {
    signatureHeader: headerName,
    signedPayloadFormat: `${prefix}HMAC-SHA256(secret, ${template})`,
    getSignature(headers) {
      return headers.get(headerName.toLowerCase()) || "";
    },
    verify(secret, rawBody, signature, headers) {
      const timestamp = tsHeader ? (headers.get(tsHeader.toLowerCase()) || "") : "";

      const signedPayload = template
        .replace(/\{body\}/g, rawBody)
        .replace(/\{timestamp\}/g, timestamp);

      const expected = hmacSha256Hex(secret, signedPayload);
      const provided = prefix ? signature.replace(prefix, "") : signature;
      return safeCompareHex(expected, provided);
    },
  };
}

/**
 * Resolve a provider for an endpoint row.
 * If the provider name matches a built-in preset, use it.
 * Otherwise build a custom provider from the endpoint's config columns.
 */
export function resolveProvider(
  providerName: string,
  config: CustomProviderConfig
): WebhookProvider {
  if (providerName in presets) {
    return presets[providerName];
  }
  return buildCustomProvider(config);
}
