"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { authApi } from "@/lib/api/authApi";
import { notifyError, notifySuccess } from "@/components/ui/toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const canSend = useMemo(() => !submitting && cooldown === 0, [submitting, cooldown]);

  const send = async () => {
    const value = String(email || "").trim().toLowerCase();
    if (!value) {
      notifyError("Email is required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await authApi.forgotPassword({ email: value });
      notifySuccess(res?.data?.message || "Reset password link sent to your email.");
      setSent(true);
      // UI cooldown (backend also rate-limits by IP)
      setCooldown(60);
    } catch (e) {
      notifyError(String(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 shadow-sm">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-foreground">Forgot Password</h1>
            <p className="mt-1 text-sm text-[color:var(--color-light-1)]">
              Enter your admin email and we’ll send you a reset link.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Email</label>
              <input
                className="mt-1 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm outline-none ring-0 focus:border-primary"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <button
              type="button"
              onClick={send}
              disabled={!canSend}
              className="h-11 w-full rounded-xl bg-primary px-4 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60"
            >
              {submitting ? "Sending..." : cooldown > 0 ? `Resend in ${cooldown}s` : "Send reset link"}
            </button>

            {sent ? (
              <div className="rounded-xl border border-black/10 bg-[color:var(--color-light-3)] p-3 text-sm text-foreground">
                If the email exists, you’ll receive a reset link shortly.
              </div>
            ) : null}
          </div>

          <div className="mt-5 text-center text-sm text-[color:var(--color-light-1)]">
            Remembered your password?{" "}
            <Link className="font-semibold text-primary" href="/login">
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

