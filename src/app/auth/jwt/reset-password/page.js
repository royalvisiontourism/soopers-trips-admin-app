import { Suspense } from "react";
import ResetPasswordClient from "./reset-password-client";

export default function AgentResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background">
          <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10">
            <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 shadow-sm">
              <div className="text-sm text-[color:var(--color-light-1)]">Loading...</div>
            </div>
          </div>
        </div>
      }
    >
      <ResetPasswordClient />
    </Suspense>
  );
}

