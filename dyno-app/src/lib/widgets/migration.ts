import type { Widget, DashboardTab, TabbedLayout } from "@/types/widget";
import { DEFAULT_WIDGETS } from "./default-layout";

function generateTabId(): string {
  return `tab-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createDefaultTabbedLayout(): TabbedLayout {
  const tabId = generateTabId();
  return {
    version: 2,
    activeTabId: tabId,
    tabs: [
      {
        id: tabId,
        label: "Main",
        widgets: [...DEFAULT_WIDGETS],
      },
    ],
  };
}

/**
 * Migrate any stored layout format to TabbedLayout v2.
 *
 * Handles:
 * - v2 TabbedLayout -> pass through
 * - v1 { widgets: Widget[] } -> wrap in single "Main" tab
 * - v0 bare Widget[] -> wrap in single "Main" tab
 * - empty/invalid -> return default layout
 */
export function migrateLayout(raw: unknown): TabbedLayout {
  if (!raw || (typeof raw !== "object" && !Array.isArray(raw))) {
    return createDefaultTabbedLayout();
  }

  // v2 TabbedLayout — pass through
  if (
    typeof raw === "object" &&
    !Array.isArray(raw) &&
    (raw as Record<string, unknown>).version === 2 &&
    Array.isArray((raw as Record<string, unknown>).tabs)
  ) {
    const layout = raw as TabbedLayout;
    if (layout.tabs.length === 0) {
      return createDefaultTabbedLayout();
    }
    // Ensure activeTabId is valid
    const hasActive = layout.tabs.some((t) => t.id === layout.activeTabId);
    if (!hasActive) {
      layout.activeTabId = layout.tabs[0].id;
    }
    return layout;
  }

  // v1 { widgets: Widget[] }
  if (
    typeof raw === "object" &&
    !Array.isArray(raw) &&
    Array.isArray((raw as Record<string, unknown>).widgets)
  ) {
    const widgets = (raw as { widgets: Widget[] }).widgets;
    return wrapWidgetsInTab(widgets);
  }

  // v0 bare Widget[]
  if (Array.isArray(raw)) {
    return wrapWidgetsInTab(raw as Widget[]);
  }

  return createDefaultTabbedLayout();
}

function wrapWidgetsInTab(widgets: Widget[]): TabbedLayout {
  if (widgets.length === 0) {
    return createDefaultTabbedLayout();
  }
  const tabId = generateTabId();
  return {
    version: 2,
    activeTabId: tabId,
    tabs: [
      {
        id: tabId,
        label: "Main",
        widgets,
      },
    ],
  };
}
