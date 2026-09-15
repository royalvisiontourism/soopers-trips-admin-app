"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { notifyError, notifySuccess } from "@/components/ui/toast";

export default function LoginPage() {
  const router = useRouter();
  const { login, loading, bootstrapped, isAuthenticated } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (bootstrapped && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [bootstrapped, isAuthenticated, router]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await login({ email, password });
      notifySuccess(res?.data?.message || "Login successful");
      router.replace("/dashboard");
    } catch (err) {
      const msg = String(err);
      setError(msg);
      notifyError(msg);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 shadow-sm">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-foreground">Soopers Trips Admin</h1>
            <p className="mt-1 text-sm text-[color:var(--color-light-1)]">
              Sign in to manage tours and bookings.
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-[color:var(--color-red-2)]/30 bg-[color:var(--color-red-3)] p-3 text-sm text-[color:var(--color-red-2)]">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Email</label>
              <input
                className="mt-1 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm outline-none ring-0 focus:border-primary"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Password</label>
              <input
                className="mt-1 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm outline-none ring-0 focus:border-primary"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <div className="mt-2 text-right text-xs">
                <Link className="font-semibold text-primary" href="/forgot-password">
                  Forgot your password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-xl bg-primary px-4 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-5 text-center text-sm text-[color:var(--color-light-1)]">
            Need access?{" "}
            <a className="font-semibold text-primary" href="mailto:reservation@soopers-trips.com">
              Contact support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

