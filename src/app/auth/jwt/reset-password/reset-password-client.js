"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi } from "@/lib/api/authApi";
import { notifyError, notifySuccess } from "@/components/ui/toast";

export default function ResetPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const tokenOk = useMemo(() => Boolean(String(token).trim()), [token]);
  const passwordsMatch = useMemo(
    () => String(password || "") === String(confirmPassword || ""),
    [password, confirmPassword]
  );

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!tokenOk) {
      notifyError("Reset token is missing or invalid.");
      return;
    }
    if (!password || password.length < 6) {
      notifyError("Password must be at least 6 characters.");
      return;
    }
    if (!passwordsMatch) {
      notifyError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await authApi.resetPassword({ token, password });
      notifySuccess(res?.data?.message || "Password reset successfully.");
      router.replace("/login");
    } catch (err) {
      notifyError(String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 shadow-sm">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-foreground">Reset Password</h1>
            <p className="mt-1 text-sm text-[color:var(--color-light-1)]">
              Set a new password for your admin account.
            </p>
          </div>

          {!tokenOk ? (
            <div className="rounded-xl border border-[color:var(--color-red-2)]/30 bg-[color:var(--color-red-3)] p-3 text-sm text-[color:var(--color-red-2)]">
              Reset token is missing or invalid. Please request a new reset link.
            </div>
          ) : null}

          <form onSubmit={onSubmit} className="mt-4 space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">New Password</label>
              <input
                className="mt-1 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm outline-none ring-0 focus:border-primary"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Confirm Password</label>
              <input
                className="mt-1 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm outline-none ring-0 focus:border-primary"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
                required
              />
              {!passwordsMatch && confirmPassword ? (
                <div className="mt-1 text-xs text-[color:var(--color-red-2)]">Passwords do not match</div>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={submitting || !tokenOk}
              className="h-11 w-full rounded-xl bg-primary px-4 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60"
            >
              {submitting ? "Updating..." : "Update Password"}
            </button>
          </form>

          <div className="mt-5 text-center text-sm text-[color:var(--color-light-1)]">
            <Link className="font-semibold text-primary" href="/forgot-password">
              Request a new reset link
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

