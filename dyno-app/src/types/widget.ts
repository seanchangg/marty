export interface Widget {
  id: string;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  props?: Record<string, unknown>;
  sessionId?: string;
}

export interface WidgetLayout {
  widgets: Widget[];
  version: number;
}

export interface DashboardTab {
  id: string;
  label: string;
  widgets: Widget[];
}

export interface TabbedLayout {
  version: 2;
  activeTabId: string;
  tabs: DashboardTab[];
}

export type UIActionType =
  | "add"
  | "remove"
  | "update"
  | "move"
  | "resize"
  | "clear"
  | "reset"
  | "tab_create"
  | "tab_delete"
  | "tab_rename"
  | "tab_reorder"
  | "tab_switch"
  | "move_to_tab";

export interface UIAction {
  action: UIActionType;
  widgetId: string;
  widgetType?: string;
  position?: { x: number; y: number };
  size?: { w: number; h: number };
  props?: Record<string, unknown>;
  sessionId?: string;
  tabId?: string;
  tabLabel?: string;
  tabIndex?: number;
}
