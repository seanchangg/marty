"use client";

import AuthGuard from "@/components/auth/AuthGuard";
import Sidebar from "@/components/sidebar/Sidebar";
import { ChatProvider } from "@/hooks/useChat";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <ChatProvider>
        <div className="flex min-h-screen bg-background">
          <Sidebar />
          <main className="ml-[260px] flex-1 overflow-y-auto p-8">
            {children}
          </main>
        </div>
      </ChatProvider>
    </AuthGuard>
  );
}
