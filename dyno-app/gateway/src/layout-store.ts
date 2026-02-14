/**
 * LayoutStore — read-modify-write for widget_layouts in Supabase.
 *
 * Used by OrchestrationHandler.handleUIAction to persist layout mutations
 * directly, so the layout is correct even before the frontend round-trips.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Minimal types mirroring the frontend's TabbedLayout / Widget

interface Widget {
  id: string;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  props?: Record<string, unknown>;
  sessionId?: string;
}

interface DashboardTab {
  id: string;
  label: string;
  widgets: Widget[];
}

interface TabbedLayout {
  version: number;
  activeTabId: string;
  tabs: DashboardTab[];
}

// Default widget sizes per type (mirrors frontend registry defaults)
const DEFAULT_SIZES: Record<string, { w: number; h: number }> = {
  chat: { w: 6, h: 8 },
  markdown: { w: 4, h: 4 },
  "stat-card": { w: 3, h: 2 },
  "memory-table": { w: 6, h: 5 },
  "screenshot-gallery": { w: 6, h: 5 },
  "agent-control": { w: 4, h: 3 },
  html: { w: 6, h: 6 },
};

export class LayoutStore {
  private supabase: SupabaseClient;

  constructor() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error("LayoutStore requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
    }

    this.supabase = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  /**
   * Apply a ui_action mutation to the user's persisted layout in Supabase.
   * Fire-and-forget — errors are logged but don't block the agent.
   */
  async applyMutation(userId: string, mutation: {
    action: string;
    widgetId?: string;
    widgetType?: string;
    position?: { x: number; y: number };
    size?: { w: number; h: number };
    props?: Record<string, unknown>;
    sessionId?: string;
    tabId?: string;
    tabLabel?: string;
    tabIndex?: number;
  }): Promise<void> {
    try {
      // Read current layout
      const { data, error } = await this.supabase
        .from("widget_layouts")
        .select("layout")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.warn("[layout-store] Read error:", error.message);
        return;
      }

      let layout: TabbedLayout = data?.layout ?? {
        version: 2,
        activeTabId: "main",
        tabs: [{ id: "main", label: "Main", widgets: [] }],
      };

      // Ensure valid structure
      if (!layout.tabs || layout.tabs.length === 0) {
        layout = {
          version: 2,
          activeTabId: "main",
          tabs: [{ id: "main", label: "Main", widgets: [] }],
        };
      }

      // Apply mutation
      layout = this.reduce(layout, mutation);

      // Write back
      const { error: writeError } = await this.supabase
        .from("widget_layouts")
        .upsert(
          {
            user_id: userId,
            layout,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

      if (writeError) {
        console.warn("[layout-store] Write error:", writeError.message);
      }
    } catch (err) {
      console.warn("[layout-store] applyMutation error:", err);
    }
  }

  private reduce(state: TabbedLayout, m: {
    action: string;
    widgetId?: string;
    widgetType?: string;
    position?: { x: number; y: number };
    size?: { w: number; h: number };
    props?: Record<string, unknown>;
    sessionId?: string;
    tabId?: string;
    tabLabel?: string;
    tabIndex?: number;
  }): TabbedLayout {
    const targetTabId = m.tabId || state.activeTabId;

    switch (m.action) {
      case "add": {
        if (!m.widgetId) return state;
        const defaults = DEFAULT_SIZES[m.widgetType || "markdown"] ?? { w: 4, h: 4 };
        const tab = state.tabs.find((t) => t.id === targetTabId);
        if (!tab) return state;
        // Skip if already exists
        if (tab.widgets.some((w) => w.id === m.widgetId)) return state;
        const bottomY = tab.widgets.length > 0
          ? Math.max(...tab.widgets.map((w) => w.y + w.h))
          : 0;
        const widget: Widget = {
          id: m.widgetId,
          type: m.widgetType || "markdown",
          x: m.position?.x ?? 0,
          y: m.position?.y ?? bottomY,
          w: m.size?.w ?? defaults.w,
          h: m.size?.h ?? defaults.h,
          ...(m.props ? { props: m.props } : {}),
          ...(m.sessionId ? { sessionId: m.sessionId } : {}),
        };
        return {
          ...state,
          tabs: state.tabs.map((t) =>
            t.id === targetTabId
              ? { ...t, widgets: [...t.widgets, widget] }
              : t
          ),
        };
      }

      case "remove": {
        if (!m.widgetId || m.widgetId === "master-chat") return state;
        return {
          ...state,
          tabs: state.tabs.map((t) =>
            t.id === targetTabId
              ? { ...t, widgets: t.widgets.filter((w) => w.id !== m.widgetId) }
              : t
          ),
        };
      }

      case "update": {
        if (!m.widgetId) return state;
        return {
          ...state,
          tabs: state.tabs.map((t) =>
            t.id === targetTabId
              ? {
                  ...t,
                  widgets: t.widgets.map((w) =>
                    w.id === m.widgetId
                      ? { ...w, props: { ...w.props, ...m.props } }
                      : w
                  ),
                }
              : t
          ),
        };
      }

      case "move": {
        if (!m.widgetId || !m.position) return state;
        return {
          ...state,
          tabs: state.tabs.map((t) =>
            t.id === targetTabId
              ? {
                  ...t,
                  widgets: t.widgets.map((w) =>
                    w.id === m.widgetId
                      ? { ...w, x: m.position!.x, y: m.position!.y }
                      : w
                  ),
                }
              : t
          ),
        };
      }

      case "resize": {
        if (!m.widgetId || !m.size) return state;
        return {
          ...state,
          tabs: state.tabs.map((t) =>
            t.id === targetTabId
              ? {
                  ...t,
                  widgets: t.widgets.map((w) =>
                    w.id === m.widgetId
                      ? { ...w, w: m.size!.w, h: m.size!.h }
                      : w
                  ),
                }
              : t
          ),
        };
      }

      case "clear": {
        return {
          ...state,
          tabs: state.tabs.map((t) =>
            t.id === targetTabId
              ? { ...t, widgets: t.widgets.filter((w) => w.id === "master-chat") }
              : t
          ),
        };
      }

      case "tab_create": {
        const newTabId = m.tabId || `tab-${Date.now()}`;
        return {
          ...state,
          activeTabId: newTabId,
          tabs: [...state.tabs, { id: newTabId, label: m.tabLabel || "New Tab", widgets: [] }],
        };
      }

      case "tab_delete": {
        const delId = m.tabId || state.activeTabId;
        const target = state.tabs.find((t) => t.id === delId);
        if (!target || target.label === "Main" || state.tabs.length <= 1) return state;
        const remaining = state.tabs.filter((t) => t.id !== delId);
        return {
          ...state,
          activeTabId: state.activeTabId === delId ? remaining[0].id : state.activeTabId,
          tabs: remaining,
        };
      }

      case "tab_rename": {
        if (!m.tabLabel) return state;
        const renameId = m.tabId || state.activeTabId;
        return {
          ...state,
          tabs: state.tabs.map((t) =>
            t.id === renameId ? { ...t, label: m.tabLabel! } : t
          ),
        };
      }

      default:
        return state;
    }
  }
}
