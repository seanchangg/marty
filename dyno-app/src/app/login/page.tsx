"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LoginForm from "@/components/auth/LoginForm";
import SignupForm from "@/components/auth/SignupForm";
import DynoSprite from "@/components/sprite/DynoSprite";
import LoginParticleCanvas from "@/components/login/LoginParticleCanvas";
import FloatingShapes from "@/components/login/FloatingShapes";
import FloatingWidgets from "@/components/login/FloatingWidgets";
import InteractiveLoginCard from "@/components/login/InteractiveLoginCard";
import { useAuth } from "@/hooks/useAuth";
import { DEMO_ACCOUNT_EMAIL, DEMO_ACCOUNT_PASSWORD, validateDemoCode } from "@/lib/demo";
import { clsx } from "clsx";

type Tab = "login" | "signup";

export default function LoginPage() {
  const [tab, setTab] = useState<Tab>("login");
  const [demoCode, setDemoCode] = useState("");
  const [demoError, setDemoError] = useState<string | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  const handleDemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoCode.trim()) return;
    setDemoError(null);
    setDemoLoading(true);

    const valid = await validateDemoCode(demoCode.trim());
    if (!valid) {
      setDemoError("Invalid demo code");
      setDemoLoading(false);
      return;
    }

    localStorage.setItem("dyno_encryption_key", demoCode.trim());

    const { error } = await signIn(DEMO_ACCOUNT_EMAIL, DEMO_ACCOUNT_PASSWORD);
    if (error) {
      setDemoError(error);
      setDemoLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 overflow-hidden">
      <LoginParticleCanvas />
      <FloatingShapes />
      <FloatingWidgets />

      <div className="relative z-20 flex flex-col items-center gap-6">
        <InteractiveLoginCard>
          <div className="mb-6 flex flex-col items-center gap-3">
            <DynoSprite status="online" size={56} />
            <h1 className="text-2xl font-bold tracking-wide text-highlight">
              MARTY
            </h1>
            <p className="text-sm text-text/50">Personal Agent Dashboard</p>
          </div>

          <div className="mb-6 flex border-b border-primary/20">
            {(["login", "signup"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={clsx(
                  "flex-1 py-2.5 text-sm font-medium transition-colors",
                  tab === t
                    ? "border-b-2 border-highlight text-highlight"
                    : "text-text/50 hover:text-text/70"
                )}
              >
                {t === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          {tab === "login" ? (
            <LoginForm />
          ) : (
            <SignupForm onSwitchToLogin={() => setTab("login")} />
          )}
        </InteractiveLoginCard>

        <div
          className="w-full max-w-sm border border-primary/20 bg-surface/50 p-5"
          style={{ animation: "float-in 0.6s ease-out 1s both" }}
        >
          <p className="mb-3 text-center text-sm font-medium text-text/70">
            Demo Access
          </p>
          <form onSubmit={handleDemoSubmit} className="flex flex-col gap-3">
            <input
              type="text"
              value={demoCode}
              onChange={(e) => setDemoCode(e.target.value)}
              placeholder="Enter demo code"
              className="bg-background border border-primary/30 px-3 py-2 text-sm text-text placeholder:text-text/40 focus:outline-none focus:border-highlight transition-colors"
            />
            {demoError && (
              <p className="text-sm text-danger">{demoError}</p>
            )}
            <button
              type="submit"
              disabled={demoLoading || !demoCode.trim()}
              className="bg-primary/60 px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {demoLoading ? "Entering..." : "Enter Demo"}
            </button>
          </form>
        </div>

        <p
          className="max-w-sm text-center text-xs text-text/30 leading-relaxed"
          style={{ animation: "float-in 0.6s ease-out 1.2s both" }}
        >
          Your personal AI agent that manages files, remembers context,
          runs tasks autonomously, and builds its own dashboard widgets.
        </p>
      </div>
    </div>
  );
}
