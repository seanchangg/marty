# Plan: Dynamic Tools + Live Screenshot Panel

## Feature 1: User Scripts Become Callable Tools

Scripts the bot writes to `~/.dyno/tools/` become tools the bot can invoke in future builds. The "Available Tools" list updates dynamically.

### How it works

Scripts in `~/.dyno/tools/` with extensions `.py`, `.js`, `.sh` are auto-discovered. The bot can call them via a `run_script` tool. The health endpoint returns the combined list (built-in + user scripts) and the frontend polls it every 5s.

### Python changes

**`python/tools.py`:**
- Add `run_script` tool definition + handler
  - Input: `{script: "myscript.py", args: "optional arguments"}`
  - Handler runs the script via subprocess (Python/Node/bash based on extension), captures stdout, returns it
  - Timeout: 30s, confined to `~/.dyno/tools/`
  - Added to `READ_ONLY_TOOLS` (auto-approved, since scripts are user-created)
- Add `get_all_tools()` function:
  - Returns `AGENT_TOOLS` + dynamically discovered user script tool definitions
  - Scans `~/.dyno/tools/` for `.py`, `.js`, `.sh` files
  - Each becomes a tool definition like: `{name: "script:myscript.py", description: "User script: myscript.py", input_schema: {args}}`
- Add `get_tools_summary()` function:
  - Returns `[{name, description, mode}]` for health endpoint consumption

**`python/agent_core.py`:**
- Import `get_all_tools` from tools
- In `run_build()`, call `get_all_tools()` instead of static `AGENT_TOOLS` so Claude sees user scripts

**`python/ws_server.py`:**
- Import `get_tools_summary` from tools
- In `health_check()`, add `"tools": get_tools_summary()` to the JSON response

### Frontend changes

**`src/types/index.ts`:**
- Add `ToolInfo` interface: `{name: string, description: string, mode: "auto" | "manual"}`
- Change `ToolPermissions` from fixed-key interface to `Record<string, PermissionMode>`

**`src/hooks/useServerStatus.ts`:**
- Add `tools: ToolInfo[]` to `ServerStatus`
- Parse `data.tools` from health response (default `[]`)

**`src/components/agent-lab/PermissionSettings.tsx`:**
- Remove hardcoded `TOOL_LABELS`
- Accept `tools: ToolInfo[]` prop, derive labels from tool names (prettify: `write_file` -> `Write File`, `script:foo.py` -> `foo.py`)

**`src/app/(dashboard)/agent-lab/page.tsx`:**
- Remove hardcoded `AVAILABLE_TOOLS` and `DEFAULT_PERMISSIONS`
- Use `server.tools` for the tools display
- Derive default permissions from `tool.mode` field
- Show "No tools — server offline" when empty

---

## Feature 2: Live Screenshot Panel

When the bot takes a screenshot, it pops up in a dedicated panel immediately — not buried in the event stream.

### Changes

**`src/hooks/useBuildSession.ts`:**
- Add `screenshots` state: `{filename: string, timestamp: number}[]`
- In `ws.onmessage`, when `tool_result` has `tool === "take_screenshot"`, parse filename and push to screenshots
- Clear on `reset()`, expose from hook

**`src/components/agent-lab/ScreenshotPanel.tsx`** — NEW:
- Latest screenshot displayed large (max-width container, clickable to open full in new tab)
- Previous screenshots as small thumbnails below
- Fade-in animation on new screenshot
- Only renders when `screenshots.length > 0`

**`src/app/(dashboard)/agent-lab/page.tsx`:**
- Render `ScreenshotPanel` between plan and event stream
- Pass `screenshots` from hook

**`src/components/agent-lab/EventStream.tsx`:**
- Keep screenshot detection but remove inline `<img>` (the panel handles it now)
- Just show text: "Screenshot saved: filename.png" with a link

---

## File Summary

| Action | File |
|--------|------|
| MOD | `python/tools.py` — `run_script` tool, `get_all_tools()`, `get_tools_summary()` |
| MOD | `python/agent_core.py` — use `get_all_tools()` instead of static `AGENT_TOOLS` |
| MOD | `python/ws_server.py` — tools in health check response |
| MOD | `src/types/index.ts` — `ToolInfo`, dynamic `ToolPermissions` |
| MOD | `src/hooks/useServerStatus.ts` — parse tools from health |
| MOD | `src/hooks/useBuildSession.ts` — screenshots state |
| MOD | `src/components/agent-lab/PermissionSettings.tsx` — dynamic tool labels |
| MOD | `src/components/agent-lab/EventStream.tsx` — remove inline img, link only |
| MOD | `src/app/(dashboard)/agent-lab/page.tsx` — dynamic tools, screenshot panel, remove hardcoded arrays |
| NEW | `src/components/agent-lab/ScreenshotPanel.tsx` — live screenshot display |
