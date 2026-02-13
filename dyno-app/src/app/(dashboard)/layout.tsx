"use client";

import AuthGuard from "@/components/auth/AuthGuard";
import Sidebar from "@/components/sidebar/Sidebar";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { WidgetLayoutProvider } from "@/hooks/useWidgetLayoutContext";
import { DashboardSessionBridge } from "@/components/DashboardSessionBridge";
import PersistentDashboard from "@/components/PersistentDashboard";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isDashboard = pathname === "/dashboard";

  return (
    <AuthGuard>
      <ToastProvider>
        <WidgetLayoutProvider>
          <DashboardSessionBridge>
            <div className="flex min-h-screen bg-background">
              <Sidebar />
              <main className="ml-[260px] flex-1 overflow-y-auto relative">
                {/* Dashboard canvas is always mounted but hidden on non-dashboard routes */}
                <PersistentDashboard />
                {/* Other pages render on top; hidden when dashboard is active */}
                {!isDashboard && (
                  <div className="p-8">
                    {children}
                  </div>
                )}
              </main>
            </div>
          </DashboardSessionBridge>
        </WidgetLayoutProvider>
      </ToastProvider>
    </AuthGuard>
  );
}
