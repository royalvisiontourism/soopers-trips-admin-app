"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/lib/api/authApi";
import { notifyError, notifySuccess } from "@/components/ui/toast";

export default function VerifyClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(Boolean(token));
  const [status, setStatus] = useState(token ? "verifying" : "idle"); // idle | verifying | success | error | resent
  const [message, setMessage] = useState("");

  const [email, setEmail] = useState("");
  const [resending, setResending] = useState(false);

  const title = useMemo(() => {
    if (status === "verifying") return "Verifying your email…";
    if (status === "success") return "Email verified!";
    if (status === "resent") return "Verification email sent";
    if (status === "error") return "Verification failed";
    return "Verify your email";
  }, [status]);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await authApi.verifyEmail(token);
        if (cancelled) return;

        const apiMessage = res?.data?.message || "Email verified successfully.";
        setMessage(apiMessage);
        setStatus("success");
        notifySuccess(apiMessage);
      } catch (err) {
        if (cancelled) return;
        const msg = String(err) || "Invalid or expired token";
        setMessage(msg);
        setStatus("error");
        notifyError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const onResend = async (e) => {
    e.preventDefault();
    setMessage("");
    setResending(true);
    try {
      const res = await authApi.resendVerificationEmail({ email });
      const msg = res?.data?.message || "Verification email resent successfully. Please check your inbox.";
      setMessage(msg);
      setStatus("resent");
      notifySuccess(msg);
    } catch (err) {
      const msg = String(err);
      setMessage(msg);
      setStatus("error");
      notifyError(msg);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg rounded-3xl border border-border bg-surface p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-foreground">{title}</h1>

          {loading && (
            <p className="mt-3 text-sm text-[color:var(--color-light-1)]">
              Please wait…
            </p>
          )}

          {/* Show message box for non-success states (error/resent), avoid duplicating content on success */}
          {!loading && message && status !== "success" && (
            <div
              className={`mt-4 rounded-2xl border p-4 text-sm ${
                status === "success" || status === "resent"
                  ? "border-[color:var(--color-green-2)]/30 bg-[color:var(--color-green-1)] text-[color:var(--color-green-2)]"
                  : "border-[color:var(--color-red-2)]/30 bg-[color:var(--color-red-3)] text-[color:var(--color-red-2)]"
              }`}
            >
              {message}
            </div>
          )}

          {!loading && status === "success" && (
            <div className="mt-4 rounded-2xl bg-primary-soft p-4 text-sm">
              <div className="font-semibold text-foreground">Next steps</div>
              <div className="mt-1 text-[color:var(--color-light-1)]">
                Your email is verified. You can now log in to the admin portal.
              </div>
            </div>
          )}

          {/* Resend form: shown when token is missing or invalid/expired */}
          {!loading && (!token || status === "error") && (
            <form onSubmit={onResend} className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Email</label>
                <input
                  className="mt-1 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm outline-none ring-0 focus:border-primary"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your registration email"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={resending}
                className="h-11 w-full rounded-xl bg-primary px-4 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60"
              >
                {resending ? "Sending…" : "Resend verification email"}
              </button>

              <div className="text-center text-sm text-[color:var(--color-light-1)]">
                Back to{" "}
                <Link className="font-semibold text-primary" href="/login">
                  Login
                </Link>
              </div>
            </form>
          )}

          {!loading && status === "resent" && (
            <div className="mt-6">
              <Link
                href="/login"
                className="block h-11 w-full rounded-xl bg-primary px-4 text-center text-sm font-semibold leading-[44px] text-white hover:opacity-95"
              >
                Go to Login
              </Link>
            </div>
          )}

          {!loading && token && status === "success" && (
            <div className="mt-6 text-center text-sm text-[color:var(--color-light-1)]">
              You can try logging in later from{" "}
              <Link className="font-semibold text-primary" href="/login">
                Login
              </Link>
              .
            </div>
          )}

          {!loading && token && status === "success" && (
            <div className="mt-4">
              <Link
                href="/login"
                className="block h-11 w-full rounded-xl border border-border bg-surface px-4 text-center text-sm font-semibold leading-[44px] text-foreground hover:bg-muted"
              >
                Go to Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

