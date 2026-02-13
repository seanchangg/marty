"use client";

import { type ReactNode } from "react";
import { SessionManagerProvider } from "@/hooks/useSessionManager";
import { useWidgetLayoutContext } from "@/hooks/useWidgetLayoutContext";
import { ScreenshotSelectionProvider } from "@/hooks/useScreenshotSelection";
import { VaultSelectionProvider } from "@/hooks/useVaultSelection";

/**
 * Bridges SessionManagerProvider with WidgetLayoutProvider.
 * Passes the layout's processUIAction as the onUIAction callback
 * so bot-triggered ui_mutation events flow into the widget layout.
 * Also provides ScreenshotSelectionProvider so both ScreenshotWidget
 * and ChatWidget can share selection state.
 */
export function DashboardSessionBridge({ children }: { children: ReactNode }) {
  const { processUIAction } = useWidgetLayoutContext();

  return (
    <SessionManagerProvider onUIAction={processUIAction}>
      <ScreenshotSelectionProvider>
        <VaultSelectionProvider>
          {children}
        </VaultSelectionProvider>
      </ScreenshotSelectionProvider>
    </SessionManagerProvider>
  );
}
