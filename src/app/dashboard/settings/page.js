"use client";

import { useMemo, useState } from "react";
import ProfileForm from "@/components/settings/ProfileForm";
import PasswordForm from "@/components/settings/PasswordForm";
import { useAuth } from "@/contexts/AuthContext";

export default function SettingsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState("profile");

  const approvalStatus = useMemo(() => {
    const s = user?.agentProfile?.approvalStatus;
    return s || (user?.role === "AGENT" ? "PENDING" : "-");
  }, [user?.agentProfile?.approvalStatus, user?.role]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="mt-2 text-sm text-[color:var(--color-light-1)]">Update your profile info or change your password.</p>
      </div>

      {/* Read-only summary */}
      <div className="rounded-2xl border border-black/10 bg-white p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <div className="text-xs text-[color:var(--color-light-1)]">Email</div>
            <div className="mt-1 text-sm font-medium text-foreground">{user?.email || "-"}</div>
          </div>
          <div>
            <div className="text-xs text-[color:var(--color-light-1)]">Role</div>
            <div className="mt-1 text-sm font-medium text-foreground">{user?.role || "-"}</div>
          </div>
          <div>
            <div className="text-xs text-[color:var(--color-light-1)]">Email Verified</div>
            <div className="mt-1 text-sm font-medium text-foreground">{user?.isVerified ? "Yes" : "No"}</div>
          </div>
          <div>
            <div className="text-xs text-[color:var(--color-light-1)]">Approval Status</div>
            <div className="mt-1 text-sm font-medium text-foreground">{approvalStatus}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab("profile")}
          className={`rounded-xl px-4 py-2 text-sm font-medium ${
            tab === "profile" ? "bg-black text-white" : "border border-black/10 bg-white text-foreground"
          }`}
        >
          Update Profile
        </button>
        <button
          type="button"
          onClick={() => setTab("password")}
          className={`rounded-xl px-4 py-2 text-sm font-medium ${
            tab === "password" ? "bg-black text-white" : "border border-black/10 bg-white text-foreground"
          }`}
        >
          Change Password
        </button>
      </div>

      {/* Content */}
      <div className="rounded-2xl border border-black/10 bg-white p-5">
        {tab === "profile" ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Update Profile</h2>
              <p className="mt-1 text-sm text-[color:var(--color-light-1)]">Change your name, phone, or bio.</p>
            </div>
            <ProfileForm />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Change Password</h2>
              <p className="mt-1 text-sm text-[color:var(--color-light-1)]">Use a strong password you don’t use elsewhere.</p>
            </div>
            <PasswordForm />
          </div>
        )}
      </div>
    </div>
  );
}

