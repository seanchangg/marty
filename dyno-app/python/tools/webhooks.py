"""Webhook tools: register, list, poll, and delete inbound webhook endpoints.

Webhooks let external services push data to the agent (OAuth callbacks,
GitHub push events, form submissions, scheduled pings, etc.).
"""

import json
import os
import secrets
import urllib.request
import urllib.parse
import urllib.error

from ._common import FRONTEND_URL, service_headers

API_BASE = FRONTEND_URL + "/api/webhooks"

_current_user_id: str | None = None


def set_user_id(user_id: str):
    """Called by the server to set the user context for webhook operations."""
    global _current_user_id
    _current_user_id = user_id


def _get_user_id(input_data: dict | None = None) -> str:
    if input_data and input_data.get("userId"):
        return input_data["userId"]
    return _current_user_id or ""


# ── Tool definitions ─────────────────────────────────────────────────────────

TOOL_DEFS = [
    {
        "name": "register_webhook",
        "description": (
            "Register an inbound webhook endpoint. Returns the public URL "
            "that external services can POST to. A shared secret is auto-generated "
            "for HMAC-SHA256 signature verification.\n\n"
            "PROVIDER CONFIGURATION:\n"
            "• Built-in presets — set provider to 'github', 'stripe', 'slack', "
            "or 'generic' and the signature header/algorithm are auto-configured. "
            "No extra fields needed.\n"
            "• Any other service — set provider to the service name (e.g. 'linear', "
            "'twilio', 'pagerduty') and fill in sigHeader, sigPrefix, and "
            "sigPayloadTemplate. To determine the correct values, check the "
            "service's webhook documentation for:\n"
            "  1. Which HTTP header carries the HMAC signature (→ sigHeader)\n"
            "  2. What prefix the header value starts with (→ sigPrefix, e.g. 'sha256=')\n"
            "  3. What the signed payload looks like (→ sigPayloadTemplate using "
            "{body} and optionally {timestamp})\n"
            "  4. If a separate header carries a timestamp (→ timestampHeader)\n\n"
            "EXAMPLES:\n"
            "• Linear: sigHeader='X-Linear-Signature', sigPrefix='', "
            "sigPayloadTemplate='{body}'\n"
            "• Twilio: sigHeader='X-Twilio-Signature', sigPrefix='', "
            "sigPayloadTemplate='{body}'\n"
            "• Most services that send 'sha256=<hex>' over the raw body: "
            "just set sigHeader to the correct header name and leave the rest default.\n\n"
            "If you don't know the service's signing details, register with "
            "provider='generic' and tell the user to configure the external service "
            "to use X-Webhook-Signature: sha256=<HMAC-SHA256 hex of body>.\n\n"
            "Always pass the userId from the system prompt."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "userId": {
                    "type": "string",
                    "description": "The user's ID (provided in the system prompt)",
                },
                "endpoint_name": {
                    "type": "string",
                    "description": (
                        "A unique name for this endpoint (alphanumeric, hyphens, underscores). "
                        "Examples: github_push, oauth_callback, stripe_events"
                    ),
                },
                "provider": {
                    "type": "string",
                    "description": (
                        "Name of the webhook provider. Built-in presets that need "
                        "no extra config: generic, github, stripe, slack. "
                        "For ANY other service, use its name and set the sig* fields."
                    ),
                    "default": "generic",
                },
                "sigHeader": {
                    "type": "string",
                    "description": (
                        "HTTP header name that carries the HMAC signature. "
                        "Find this in the service's webhook docs. "
                        "Examples: 'X-Hub-Signature-256', 'X-Linear-Signature', "
                        "'X-Twilio-Signature'. Defaults to 'X-Webhook-Signature' "
                        "if omitted. Not needed for built-in presets."
                    ),
                },
                "sigPrefix": {
                    "type": "string",
                    "description": (
                        "Prefix to strip from the header value before comparing "
                        "the hex digest. Common values: 'sha256=' (most services), "
                        "'v0=' (Slack-style), '' (no prefix — raw hex). "
                        "Defaults to 'sha256=' if omitted."
                    ),
                },
                "timestampHeader": {
                    "type": "string",
                    "description": (
                        "Header carrying a timestamp if the service binds it into "
                        "the signed payload. Leave empty if the service signs only "
                        "the body. Example: 'X-Slack-Request-Timestamp'."
                    ),
                },
                "sigPayloadTemplate": {
                    "type": "string",
                    "description": (
                        "Template for the data that gets HMAC-signed. "
                        "Use {body} for the raw request body and {timestamp} for "
                        "the value from timestampHeader. "
                        "Common patterns: '{body}' (most services), "
                        "'{timestamp}.{body}' (Stripe-style), "
                        "'v0:{timestamp}:{body}' (Slack-style). "
                        "Defaults to '{body}' if omitted."
                    ),
                },
                "mode": {
                    "type": "string",
                    "enum": ["agent", "direct"],
                    "description": (
                        "agent = bot processes each payload (default). "
                        "direct = stored for widget polling only, no bot tokens spent."
                    ),
                    "default": "agent",
                },
                "prompt": {
                    "type": "string",
                    "description": (
                        "Processing instructions for your future headless self. "
                        "When this webhook fires, you run in headless mode with no user present — "
                        "this prompt tells you what to do with the payload. "
                        "Example: 'Update the github-stars stat card with the new star count. "
                        "Save a memory with the stargazer username.' "
                        "Be specific about which widgets to update, what memories to save, etc."
                    ),
                },
            },
            "required": ["userId", "endpoint_name"],
        },
    },
    {
        "name": "list_webhooks",
        "description": (
            "List all registered webhook endpoints for the user. "
            "Shows endpoint names, URLs, and enabled status. "
            "Always pass the userId from the system prompt."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "userId": {
                    "type": "string",
                    "description": "The user's ID (provided in the system prompt)",
                },
            },
            "required": ["userId"],
        },
    },
    {
        "name": "poll_webhooks",
        "description": (
            "Fetch unprocessed inbound webhook payloads. "
            "Returns up to 50 payloads, marks them as processed. "
            "Optionally filter by endpoint_name. "
            "Always pass the userId from the system prompt."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "userId": {
                    "type": "string",
                    "description": "The user's ID (provided in the system prompt)",
                },
                "endpoint_name": {
                    "type": "string",
                    "description": "Filter to a specific endpoint (optional)",
                },
            },
            "required": ["userId"],
        },
    },
    {
        "name": "get_webhook_config",
        "description": (
            "Get the user's webhook security config (hourly token cap, rate limit). "
            "Always pass the userId from the system prompt."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "userId": {
                    "type": "string",
                    "description": "The user's ID (provided in the system prompt)",
                },
            },
            "required": ["userId"],
        },
    },
    {
        "name": "set_webhook_config",
        "description": (
            "Configure webhook security settings. Set hourly_token_cap to limit "
            "how many tokens headless webhook processing can use per hour (null = unlimited). "
            "Set rate_limit_per_hour to limit inbound webhooks per hour (default 100). "
            "When the token cap is hit, webhooks are queued but the agent is NOT triggered — "
            "they will be processed on the user's next interaction. "
            "Always pass the userId from the system prompt."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "userId": {
                    "type": "string",
                    "description": "The user's ID (provided in the system prompt)",
                },
                "hourly_token_cap": {
                    "type": ["integer", "null"],
                    "description": (
                        "Max total tokens (input + output) per hour for headless webhook processing. "
                        "null = unlimited. Recommended: 50000 for light use, 200000 for heavy use."
                    ),
                },
                "rate_limit_per_hour": {
                    "type": "integer",
                    "description": "Max inbound webhooks accepted per hour (1-10000, default 100)",
                },
            },
            "required": ["userId"],
        },
    },
    {
        "name": "delete_webhook",
        "description": (
            "Delete a webhook endpoint and all its queued payloads. "
            "Always pass the userId from the system prompt."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "userId": {
                    "type": "string",
                    "description": "The user's ID (provided in the system prompt)",
                },
                "endpoint_name": {
                    "type": "string",
                    "description": "The endpoint name to delete",
                },
            },
            "required": ["userId", "endpoint_name"],
        },
    },
]

READ_ONLY = {"list_webhooks", "poll_webhooks", "get_webhook_config"}

# ── Handlers ─────────────────────────────────────────────────────────────────


async def handle_register_webhook(input_data: dict) -> str:
    user_id = _get_user_id(input_data)
    endpoint_name = input_data.get("endpoint_name", "").strip()

    if not endpoint_name:
        return "Error: endpoint_name is required"

    # Generate a secure shared secret
    secret = secrets.token_hex(32)
    mode = input_data.get("mode", "agent")
    provider = input_data.get("provider", "generic")

    post_body: dict[str, object] = {
        "userId": user_id,
        "endpointName": endpoint_name,
        "secret": secret,
        "mode": mode,
        "provider": provider,
    }
    # Pass custom signature config when provided
    for key in ("sigHeader", "sigPrefix", "timestampHeader", "sigPayloadTemplate"):
        if input_data.get(key):
            post_body[key] = input_data[key]

    # Pass processing prompt
    if input_data.get("prompt"):
        post_body["prompt"] = input_data["prompt"]

    payload = json.dumps(post_body).encode()

    req = urllib.request.Request(
        API_BASE,
        data=payload,
        headers=service_headers({"Content-Type": "application/json"}),
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            result = json.loads(resp.read())
            url = result.get("url", "")
            action = result.get("action", "created")

            mode_note = ""
            if mode == "direct":
                mode_note = (
                    f"\nMode: direct (widget polling only — no bot tokens spent)\n"
                    f"Widget endpoint: /api/webhook-data?userId={user_id}&endpointName={endpoint_name}"
                )
            else:
                mode_note = "\nMode: agent (gateway processes each payload)"

            sig_header = result.get("signatureHeader", "X-Webhook-Signature")
            sig_format = result.get("signedPayloadFormat", "")
            resp_provider = result.get("provider", provider)

            return (
                f"Webhook endpoint '{endpoint_name}' {action}.\n"
                f"URL: {url}\n"
                f"Secret: {secret}\n"
                f"Provider: {resp_provider}\n"
                f"{mode_note}\n\n"
                f"Signature header: {sig_header}\n"
                f"Signature format: {sig_format}\n"
                f"Configure the external service to POST to the URL above "
                f"and use the secret for HMAC signing."
            )
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        return f"Error registering webhook: {body}"
    except Exception as e:
        return f"Error registering webhook: {str(e)}"


async def handle_list_webhooks(input_data: dict) -> str:
    user_id = _get_user_id(input_data)

    params = urllib.parse.urlencode({"userId": user_id, "action": "list"})
    url = f"{API_BASE}?{params}"
    list_req = urllib.request.Request(url, headers=service_headers())

    try:
        with urllib.request.urlopen(list_req, timeout=10) as resp:
            result = json.loads(resp.read())
            endpoints = result.get("endpoints", [])

            if not endpoints:
                return "No webhook endpoints registered."

            lines = []
            for ep in endpoints:
                status = "enabled" if ep.get("enabled") else "disabled"
                mode = ep.get("mode", "agent")
                provider = ep.get("provider", "generic")
                sig_header = ep.get("sig_header") or "(preset)"
                prompt_text = ep.get("prompt") or "(none)"
                entry = (
                    f"  {ep['endpoint_name']} ({status}, mode={mode}, provider={provider})\n"
                    f"    URL: {ep.get('url', 'N/A')}\n"
                    f"    Signature header: {sig_header}\n"
                    f"    Prompt: {prompt_text}"
                )
                lines.append(entry)
            return "Registered webhooks:\n" + "\n".join(lines)
    except Exception as e:
        return f"Error listing webhooks: {str(e)}"


async def handle_poll_webhooks(input_data: dict) -> str:
    user_id = _get_user_id(input_data)
    endpoint_name = input_data.get("endpoint_name")

    params: dict[str, str] = {"userId": user_id, "action": "poll"}
    if endpoint_name:
        params["endpointName"] = endpoint_name

    url = f"{API_BASE}?{urllib.parse.urlencode(params)}"
    poll_req = urllib.request.Request(url, headers=service_headers())

    try:
        with urllib.request.urlopen(poll_req, timeout=10) as resp:
            result = json.loads(resp.read())
            webhooks = result.get("webhooks", [])

            if not webhooks:
                return "No unprocessed webhooks."

            lines = []
            for wh in webhooks:
                lines.append(
                    f"--- [{wh['endpoint_name']}] received at {wh['received_at']} ---\n"
                    f"{json.dumps(wh['payload'], indent=2)}"
                )
            return f"{len(webhooks)} webhook(s) received:\n\n" + "\n\n".join(lines)
    except Exception as e:
        return f"Error polling webhooks: {str(e)}"


async def handle_get_webhook_config(input_data: dict) -> str:
    user_id = _get_user_id(input_data)

    params = urllib.parse.urlencode({"userId": user_id, "action": "config"})
    url = f"{API_BASE}?{params}"
    config_req = urllib.request.Request(url, headers=service_headers())

    try:
        with urllib.request.urlopen(config_req, timeout=10) as resp:
            result = json.loads(resp.read())
            config = result.get("config", {})
            cap = config.get("hourly_token_cap")
            rate = config.get("rate_limit_per_hour", 100)

            cap_str = f"{cap:,} tokens" if cap is not None else "unlimited"
            return (
                f"Webhook config:\n"
                f"  Hourly token cap: {cap_str}\n"
                f"  Rate limit: {rate} webhooks/hour"
            )
    except Exception as e:
        return f"Error getting webhook config: {str(e)}"


async def handle_set_webhook_config(input_data: dict) -> str:
    user_id = _get_user_id(input_data)

    body: dict[str, object] = {"userId": user_id}
    if "hourly_token_cap" in input_data:
        body["hourlyTokenCap"] = input_data["hourly_token_cap"]
    if "rate_limit_per_hour" in input_data:
        body["rateLimitPerHour"] = input_data["rate_limit_per_hour"]

    payload = json.dumps(body).encode()
    req = urllib.request.Request(
        API_BASE,
        data=payload,
        headers=service_headers({"Content-Type": "application/json"}),
        method="PATCH",
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            changes = []
            if "hourly_token_cap" in input_data:
                cap = input_data["hourly_token_cap"]
                changes.append(f"hourly token cap → {f'{cap:,}' if cap is not None else 'unlimited'}")
            if "rate_limit_per_hour" in input_data:
                changes.append(f"rate limit → {input_data['rate_limit_per_hour']}/hour")
            return "Webhook config updated: " + ", ".join(changes)
    except urllib.error.HTTPError as e:
        body_text = e.read().decode()
        return f"Error updating webhook config: {body_text}"
    except Exception as e:
        return f"Error updating webhook config: {str(e)}"


async def handle_delete_webhook(input_data: dict) -> str:
    user_id = _get_user_id(input_data)
    endpoint_name = input_data.get("endpoint_name", "").strip()

    if not endpoint_name:
        return "Error: endpoint_name is required"

    params = urllib.parse.urlencode({"userId": user_id, "endpointName": endpoint_name})
    url = f"{API_BASE}?{params}"

    req = urllib.request.Request(url, method="DELETE", headers=service_headers())

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return f"Webhook endpoint '{endpoint_name}' deleted (including all queued payloads)."
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        return f"Error deleting webhook: {body}"
    except Exception as e:
        return f"Error deleting webhook: {str(e)}"


HANDLERS = {
    "register_webhook": handle_register_webhook,
    "list_webhooks": handle_list_webhooks,
    "poll_webhooks": handle_poll_webhooks,
    "get_webhook_config": handle_get_webhook_config,
    "set_webhook_config": handle_set_webhook_config,
    "delete_webhook": handle_delete_webhook,
}
