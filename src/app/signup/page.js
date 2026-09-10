"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { notifyError, notifySuccess } from "@/components/ui/toast";

const fieldClass =
  "mt-1 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm outline-none ring-0 focus:border-primary";

export default function SignupPage() {
  const router = useRouter();
  const { signup, loading, bootstrapped, isAuthenticated } = useAuth();

  const initialForm = useMemo(
    () => ({
    name: "",
    email: "",
    password: "",
    phone: "",
    companyName: "",
    tradeLicenseNumber: "",
    vatNumber: "",
    licenseIssuingAuthority: "",
    officeAddress: "",
    tradeLicenseDocument: "",
    additionalEmails: "",
    bio: "",
    website: "",
    country: "",
    address: "",
    }),
    []
  );

  const [form, setForm] = useState(initialForm);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (bootstrapped && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [bootstrapped, isAuthenticated, router]);

  const payload = useMemo(() => {
    const additionalEmailsArray =
      form.additionalEmails
        ?.split(",")
        .map((e) => e.trim().toLowerCase())
        .filter((e) => e && e.includes("@")) || [];

    return {
      name: form.name,
      email: form.email,
      password: form.password,
      phone: form.phone || null,
      companyName: form.companyName,
      tradeLicenseNumber: form.tradeLicenseNumber,
      vatNumber: form.vatNumber || null,
      licenseIssuingAuthority: form.licenseIssuingAuthority,
      officeAddress: form.officeAddress,
      tradeLicenseDocument: form.tradeLicenseDocument || null,
      additionalEmails: additionalEmailsArray,
      bio: form.bio || null,
      website: form.website || null,
      country: form.country || null,
      address: form.address || null,
    };
  }, [form]);

  const onChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const res = await signup(payload);
      const msg = res?.data?.message || res?.data?.data || "Registration successful. Please verify your email.";
      setSuccess(msg);
      notifySuccess(msg);
      // Agent flow: verify email, then wait for admin approval

      // Clear form and redirect to login
      setForm(initialForm);
      setTimeout(() => {
        router.replace("/login");
      }, 700);
    } catch (err) {
      const msg = String(err);
      setError(msg);
      notifyError(msg);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10">
        <div className="w-full max-w-3xl rounded-3xl border border-border bg-surface p-6 shadow-sm">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-foreground">Admin Registration</h1>
            <p className="mt-1 text-sm text-[color:var(--color-light-1)]">
              Admin accounts are managed by the system. If you need access, contact support.
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-[color:var(--color-red-2)]/30 bg-[color:var(--color-red-3)] p-3 text-sm text-[color:var(--color-red-2)]">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 rounded-xl border border-[color:var(--color-green-2)]/30 bg-[color:var(--color-green-1)] p-3 text-sm text-[color:var(--color-green-2)]">
              {success}{" "}
              <span className="block mt-2 text-[color:var(--color-green-2)]">
                After verifying your email, your account will remain pending until admin approval.
              </span>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-foreground">Full Name *</label>
                <input className={fieldClass} value={form.name} onChange={onChange("name")} required />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Email *</label>
                <input className={fieldClass} type="email" value={form.email} onChange={onChange("email")} required />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Password *</label>
                <input className={fieldClass} type="password" value={form.password} onChange={onChange("password")} required />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Phone</label>
                <input className={fieldClass} value={form.phone} onChange={onChange("phone")} placeholder="+971..." />
              </div>
            </div>

            <div className="rounded-2xl bg-muted p-4">
              <div className="mb-3 text-sm font-semibold text-foreground">Company Information</div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-foreground">Company Name *</label>
                  <input className={fieldClass} value={form.companyName} onChange={onChange("companyName")} required />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Trade License Number *</label>
                  <input className={fieldClass} value={form.tradeLicenseNumber} onChange={onChange("tradeLicenseNumber")} required />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">VAT Number</label>
                  <input className={fieldClass} value={form.vatNumber} onChange={onChange("vatNumber")} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">License Issuing Authority *</label>
                  <input className={fieldClass} value={form.licenseIssuingAuthority} onChange={onChange("licenseIssuingAuthority")} required />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-foreground">Office Address *</label>
                  <input className={fieldClass} value={form.officeAddress} onChange={onChange("officeAddress")} required />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-foreground">Trade License Document URL</label>
                  <input className={fieldClass} value={form.tradeLicenseDocument} onChange={onChange("tradeLicenseDocument")} placeholder="https://..." />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-foreground">Additional Emails (comma separated)</label>
                  <input className={fieldClass} value={form.additionalEmails} onChange={onChange("additionalEmails")} placeholder="a@x.com, b@y.com" />
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-foreground">Website</label>
                <input className={fieldClass} value={form.website} onChange={onChange("website")} placeholder="https://..." />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Country</label>
                <input className={fieldClass} value={form.country} onChange={onChange("country")} />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-foreground">Address</label>
                <input className={fieldClass} value={form.address} onChange={onChange("address")} />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-foreground">About (Bio)</label>
                <textarea
                  className="mt-1 min-h-24 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none ring-0 focus:border-primary"
                  value={form.bio}
                  onChange={onChange("bio")}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-xl bg-primary px-4 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60"
            >
              {loading ? "Creating..." : "Request Admin Access"}
            </button>
          </form>

          <div className="mt-5 text-center text-sm text-[color:var(--color-light-1)]">
            Already registered?{" "}
            <Link className="font-semibold text-primary" href="/login">
              Login
            </Link>
          </div>

          <div className="mt-2 text-center text-sm text-[color:var(--color-light-1)]">
            Need to resend verification?{" "}
            <Link className="font-semibold text-primary" href="/verify">
              Verify Email
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

