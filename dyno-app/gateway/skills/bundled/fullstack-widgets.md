---
id: fullstack-widgets
name: Full-Stack Widget Authoring
description: Patterns for building widgets with interactive frontends backed by server-side scripts
version: 1.1.0
author: Marty
tags: [widgets, fullstack, execution, html]
---

# Full-Stack Widgets

Build interactive HTML widgets with server-side computation by combining `save_script` (backend) + `write_file` (frontend HTML) + `ui_action` (dashboard placement).

## Plan → Build Workflow

Custom widgets are complex — always use a plan-first approach:

1. **Plan**: Describe what you'll build — the backend script(s), the frontend HTML, how they connect, and what data flows between them. Present this to the user as a short summary before writing any code.
2. **User adjusts**: Let the user approve, modify scope, or simplify before you build. This avoids wasted work on expensive widget builds.
3. **Build with Opus**: Spawn an opus child agent to do the actual implementation. Widget code requires careful HTML/CSS/JS + backend integration — opus handles this significantly better.

```
spawn_agent model=opus, task="Build a full-stack widget: [description]. Follow the fullstack-widgets skill pattern. Save backend script with save_script, write HTML to workspace/widgets/[name].html, then add to dashboard with ui_action. IMPORTANT: You are a child agent — you do NOT have spawn_agent. Build everything yourself directly using save_script, write_file, and ui_action. Do NOT attempt to delegate or spawn sub-agents."
```

Always delegate widget creation to an opus child agent — do NOT attempt to build widgets yourself on sonnet. The quality difference is substantial for frontend code.

**Important:** Include the "you are a child agent" instruction in the spawn prompt. Opus is smart enough to read the fullstack-widgets skill and try to follow the "spawn opus" instruction recursively. It must know it IS the opus child and should build directly.

## How It Works

There are separate Supabase Storage buckets for different data types. You don't interact with buckets directly — the tools and API routes handle this for you:

- **`save_script`** → saves to the **scripts** bucket (for backend execution via `run_script`)
- **`write_file workspace/widgets/foo.html`** → saves to the **workspace** bucket (for widget HTML)
- **`/api/widget-html/foo.html`** → Next.js route that serves widget HTML (checks both workspace and widgets buckets automatically)
- **`/api/widget-exec`** → Next.js route that runs a saved script with JSON input (same-origin, callable from widget iframes)

The iframe is served from the same origin as the app, so `fetch('/api/widget-exec')` just works.

```
write_file workspace/widgets/foo.html → Supabase "workspace" bucket
                                              ↓
               /api/widget-html/foo.html (Next.js serves it as same-origin HTML)
                                              ↓
                          <iframe src="/api/widget-html/foo.html">
                            fetch('/api/widget-exec', {script, input})
                                              ↓
                          /api/widget-exec → Gateway → run_script with stdin_data
                                              ↓
                          Script reads stdin JSON → prints JSON to stdout → response
```

## The 3-Step Pattern

### Step 1: Save the backend script

Use `save_script`. The script reads JSON from **stdin** and prints JSON to **stdout**.

**Python** (recommended):
```python
import sys, json
data = json.load(sys.stdin)
result = {"greeting": f"Hello, {data['name']}!"}
print(json.dumps(result))
```

**JavaScript:**
```javascript
const chunks = [];
process.stdin.on('data', c => chunks.push(c));
process.stdin.on('end', () => {
  const data = JSON.parse(Buffer.concat(chunks).toString());
  console.log(JSON.stringify({ greeting: `Hello, ${data.name}!` }));
});
```

**Bash:**
```bash
INPUT=$(cat)
NAME=$(echo "$INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin)['name'])")
echo "{\"greeting\": \"Hello, $NAME!\"}"
```

**C++:**
```cpp
#include <iostream>
#include <string>
int main() {
    std::string input((std::istreambuf_iterator<char>(std::cin)),
                       std::istreambuf_iterator<char>());
    // Parse and process input...
    std::cout << "{\"result\": 42}" << std::endl;
    return 0;
}
```

Example:
```
save_script name=my-backend, language=python, description="Backend for my widget", code="import sys,json\ndata=json.load(sys.stdin)\nprint(json.dumps({'echo': data}))"
```

### Step 2: Write the widget HTML

Use `write_file` to save HTML to **`workspace/widgets/my-widget.html`**. This is the required path — the widget serving route looks here.

The HTML can call `/api/widget-exec` to run backend scripts. The platform automatically injects `window.__DYNO_USER_ID` into the served HTML — always include it in your fetch calls.

**The `/api/widget-exec` endpoint expects this exact JSON body format:**
```json
{ "script": "my-backend", "input": { ... }, "userId": "..." }
```
The field MUST be called `script` (not `name`, `scriptName`, or `script_name`) — this is the name you used in `save_script`.

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: sans-serif; padding: 16px; color: #E0E6E1; background: #121A14; }
    .error { color: #ff6b6b; }
  </style>
</head>
<body>
  <div id="app">Loading...</div>
  <script>
    async function callBackend(script, input) {
      const res = await fetch('/api/widget-exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script,
          input,
          userId: window.__DYNO_USER_ID || ''
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.stderr || 'Script failed');
      return JSON.parse(data.stdout);
    }

    async function init() {
      try {
        const result = await callBackend('my-backend', { name: 'World' });
        document.getElementById('app').textContent = result.greeting;
      } catch (err) {
        document.getElementById('app').innerHTML =
          '<span class="error">' + err.message + '</span>';
      }
    }

    init();
  </script>
</body>
</html>
```

**Important rules for widget HTML:**
- **Always include `userId: window.__DYNO_USER_ID`** in widget-exec fetch calls — this is injected by the platform and required for cloud mode
- Use **relative URLs** (`/api/widget-exec`, not `http://localhost:3000/api/widget-exec`)
- Do NOT write to Supabase buckets directly — use `write_file` which handles routing
- Do NOT create new buckets — the infrastructure handles this
- The widget iframe is same-origin with the app, so `/api/` calls work

### Step 3: Add the widget to the dashboard

Use `ui_action` with `src` pointing to the **widget-html API route** (not a raw file path or Supabase URL):

```
ui_action action=add, type=html, props={ src: "/api/widget-html/my-widget.html" }, w=4, h=4
```

**Critical:** The `src` must be `/api/widget-html/FILENAME.html` — this is the Next.js route that serves the HTML from storage. The userId is automatically injected by the frontend. Do NOT use:
- Raw Supabase URLs (won't work, wrong origin)
- localhost URLs (won't work in production)
- Direct file paths (not how the serving works)

## Supported Languages

| Language   | stdin pattern | Notes |
|------------|--------------|-------|
| Python     | `json.load(sys.stdin)` | Recommended for data processing |
| JavaScript | `process.stdin` events | Good for JSON-heavy work |
| TypeScript | `process.stdin` events | Same as JS, with types |
| Bash       | `cat` / `read` | Use python3 for JSON parsing |
| C++        | `std::cin` | Compiled with g++ -std=c++17 |

## Execution Environment Constraints

Scripts run in an isolated Docker container with a set of pre-installed packages including:
`requests`, `httpx`, `beautifulsoup4`, `pandas`, `numpy`, `matplotlib`, `Pillow`, `qrcode`,
`gTTS`, `PyPDF2`, `reportlab`, `python-docx`, `openpyxl`, `pyyaml`, `jinja2`, `cryptography`,
and more (see `python/sandbox/requirements-sandbox.txt` for the full list).

Each execution is a fresh container — packages installed at runtime via `pip install` are lost
when execution ends. Do NOT pip install packages and expect them in later calls. Only use the
pre-installed packages.

For HTTP requests in Python scripts, `requests` and `httpx` are available:
```python
import requests, json
r = requests.get(url)
data = r.json()
```

## Live Updates (Polling)

Widgets can auto-refresh by polling the backend with `setInterval`:

```javascript
async function refresh() {
  try {
    const data = await callBackend('my-script', { action: 'latest' });
    render(data);
  } catch (err) {
    console.error('Refresh failed:', err);
  }
}

// Initial load + poll every 10 seconds
refresh();
setInterval(refresh, 10000);
```

Use this for dashboards, live feeds, or any widget that should stay current without user interaction.

## Webhooks → Agent Processing

For webhooks that need the agent to take action (update widgets, save memories, track metrics), use **agent mode** (the default). The gateway wakes the agent headlessly to process each payload.

**You MUST include a `prompt`** when registering agent-mode webhooks. This prompt is injected into the headless session so your future self knows what to do. Without it, the agent has no instructions and won't take meaningful action.

```
register_webhook userId=..., endpoint_name="github-stars", provider="github", prompt="Increment the github-stars metric. Update the repo-stats stat card to show the new total. Save a memory tagged 'github' with the stargazer username."
```

The prompt should be specific: name widgets, metrics, memory tags, and any other actions to take. Think of it as a note from present-you to future-headless-you.

## Webhooks → Widget (Direct Mode)

For widgets that display live data from external services (GitHub events, monitoring pings, RSS updates), use **direct mode** webhooks. This skips bot processing entirely — no tokens spent, no gateway wake-up.

### Setup

1. Register a webhook with `mode: "direct"`:
   ```
   register_webhook userId=..., endpoint_name="github-push", mode="direct"
   ```

2. Widget HTML fetches payloads from `/api/webhook-data`:
   ```javascript
   async function fetchWebhookData() {
     const userId = window.__DYNO_USER_ID || '';
     const res = await fetch(
       `/api/webhook-data?userId=${userId}&endpointName=github-push&limit=20`
     );
     const data = await res.json();
     // Each item: { id (UUID), endpoint_name, payload (parsed JSON object), created_at }
     // The webhook body is in item.payload — NOT item.body
     // payload is already a parsed object, not a string — do NOT JSON.parse() it
     return data.payloads;
   }
   ```

3. Poll with `setInterval` — this IS appropriate for direct mode (no bot tokens spent):
   ```javascript
   let lastTimestamp = null;

   async function refresh() {
     try {
       let url = `/api/webhook-data?userId=${window.__DYNO_USER_ID}&endpointName=github-push&limit=20`;
       if (lastTimestamp) url += `&since=${encodeURIComponent(lastTimestamp)}`;
       const res = await fetch(url);
       const data = await res.json();
       if (data.payloads.length > 0) {
         lastTimestamp = data.payloads[0].received_at;
         render(data.payloads);
       }
     } catch (err) {
       console.error('Webhook data fetch failed:', err);
     }
   }

   refresh();
   setInterval(refresh, 10000); // poll every 10 seconds
   ```

### When to use direct vs agent mode

| | Agent mode (default) | Direct mode |
|---|---|---|
| Bot processes payload | Yes | No |
| Token cost per webhook | Yes | None |
| Gateway notified | Yes | No |
| Widget reads data via | Backend script reading stored results | `/api/webhook-data` endpoint |
| Best for | Complex processing, actions, notifications | Simple data feeds, live displays |

## Common Mistakes

- **Saving JSON state/data files to widget-html**: The `/api/widget-html/` endpoint ONLY serves `.html` files — it returns 400 for everything else. Do NOT write JSON files to `workspace/widgets/`. JSON state files, config files, and other non-HTML data must go in **`workspace/data/`** (e.g. `workspace/data/my-widget-state.json`). Use `write_file` and `read_file` with `workspace/data/` paths for any persistent data your widgets need.
- **pip installing at runtime**: Each execution is a fresh Docker container. `pip install` works but is lost immediately. Only pre-installed packages persist (pandas, numpy, matplotlib, etc. — see requirements-sandbox.txt). Do NOT pip install in execute_code and expect it in a widget backend script.
- **Writing HTML to wrong path**: Must be `workspace/widgets/filename.html`, not just `workspace/filename.html`
- **Using absolute URLs**: Always use relative `/api/` URLs in widget HTML
- **Using srcDoc**: Only `src` mode iframes get `allow-same-origin`, which is required for fetch()
- **Creating Supabase buckets**: Don't — the buckets already exist and are managed by the platform
- **Hardcoding userId in HTML**: The widget-exec proxy handles userId injection automatically
- **Using wrong field name for script**: The fetch body must use `script` (not `name`, `scriptName`, or `script_name`). Copy the `callBackend` helper from the template above exactly.
- **Child agent trying to spawn sub-agents**: Opus child agents do NOT have `spawn_agent`. Always include "you are a child agent, build everything directly" in the spawn prompt.
- **Using `/api/run-script` instead of `/api/widget-exec`**: There is NO `/api/run-script` endpoint. The `run_script` tool is for agent-side execution only. Widget HTML must always fetch `/api/widget-exec` to run saved scripts.
- **Registering agent-mode webhooks without a prompt**: If you register a webhook with `mode: "agent"` but no `prompt`, the headless agent has no instructions and won't update widgets or take useful action. Always include a specific `prompt` describing what to do (update which widget, save what memory, track which metric).
- **Omitting `input` in widget-exec fetch calls**: The `input` field in the `/api/widget-exec` body is what gets piped to the script's stdin as JSON. If you omit it or use a wrong field name (`stdin`, `data`, `body`), the script receives empty stdin and `json.load(sys.stdin)` throws `"Expecting value: line 1 column 1"`. Always pass `input` — even if the script doesn't need data, use `input: {}`.
- **Using `item.body` instead of `item.payload` for webhook data**: The `/api/webhook-data` response shape is `{ payloads: [{ id, endpoint_name, payload, created_at }] }`. The webhook body is in `item.payload`, NOT `item.body`. The field is already a parsed JSON object — do NOT `JSON.parse()` it again.
- **Polling webhooks from widgets**: Do NOT build widgets that poll `/api/webhooks?action=poll` on a timer — that's the agent-facing endpoint and marks payloads as processed. If a widget needs live data from webhooks, use `mode: "direct"` when registering the webhook and poll `/api/webhook-data` instead. See the "Webhooks → Widget (Direct Mode)" section above.
- **Using Supabase/env vars in execute_code**: `execute_code` runs in a fresh Docker container with NO access to server env vars (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, API keys, etc.). Use built-in tools (`db_query`, `db_insert`, `fetch_url`) which run server-side with full access. If a script needs data, fetch it with tools first, then pass it as input.
- **Widgets accessing Supabase storage directly**: Widget iframes have no auth tokens. Direct requests to `supabase.co/storage/v1/object/...` return 401. Use `/api/widget-exec` for backend computation or `/api/storage/preview` for file access — these proxy routes handle auth server-side.
- **Burning tokens on environment errors**: If a tool call fails with an auth/env error, do NOT retry with variations or go on long debugging tangents. Recognize the pattern (missing env var, 401 from Supabase) and use the correct approach above.
