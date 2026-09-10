import { Suspense } from "react";
import VerifyClient from "./verify-client";

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background">
          <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10">
            <div className="w-full max-w-lg rounded-3xl border border-border bg-surface p-6 shadow-sm">
              <h1 className="text-2xl font-semibold text-foreground">Loading…</h1>
              <p className="mt-3 text-sm text-[color:var(--color-light-1)]">Please wait…</p>
            </div>
          </div>
        </div>
      }
    >
      <VerifyClient />
    </Suspense>
  );
}

