"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { usersApi } from "@/lib/api/usersApi";
import { notifyError, notifySuccess } from "@/components/ui/toast";
import ConfirmModal from "@/components/ui/ConfirmModal";

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

export default function UserDetailPage() {
  const { userId } = useParams();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Edit form
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", bio: "", role: "USER", isActive: true });

  // Delete
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    try {
      const res = await usersApi.getById(userId);
      const data = res?.data?.data;
      setUser(data);
      setForm({
        name: data?.name || "",
        phone: data?.phone || "",
        bio: data?.bio || "",
        role: data?.role || "USER",
        isActive: data?.isActive !== false,
      });
    } catch (e) {
      notifyError(e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await usersApi.update(userId, form);
      notifySuccess("User updated");
      setEditing(false);
      fetchUser();
    } catch (e) {
      notifyError(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await usersApi.remove(userId);
      notifySuccess("User deleted");
      router.push("/dashboard/users");
    } catch (e) {
      notifyError(e);
    } finally {
      setDeleting(false);
    }
  };

  const toggleActive = async () => {
    try {
      await usersApi.update(userId, { isActive: !user.isActive });
      notifySuccess(user.isActive ? "User deactivated" : "User activated");
      fetchUser();
    } catch (e) {
      notifyError(e);
    }
  };

  const inp = "w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/20";
  const label = "block text-xs font-semibold text-foreground mb-1";
  const card = "rounded-2xl border border-black/10 bg-white p-5 shadow-sm";

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-40 animate-pulse rounded bg-black/5" />
        <div className="h-48 animate-pulse rounded-2xl bg-black/5" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-[color:var(--color-light-1)]">User not found.</p>
        <Link href="/dashboard/users" className="mt-3 inline-block text-sm font-semibold text-foreground hover:underline">
          &larr; Back to Users
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[color:var(--color-light-1)]">
        <Link href="/dashboard/users" className="hover:text-foreground">&larr; Users</Link>
        <span>/</span>
        <span className="text-foreground font-medium truncate">{user.name || user.email}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Left: Profile card ──────────────────── */}
        <div className={`${card} lg:col-span-1`}>
          <div className="flex flex-col items-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#8B6914]/20 to-[#8B6914]/5 text-2xl font-bold text-[#8B6914]">
              {(user.name || "?")[0].toUpperCase()}
            </div>
            <h2 className="mt-3 text-lg font-bold text-foreground">{user.name || "—"}</h2>
            <p className="text-sm text-[color:var(--color-light-1)]">{user.email}</p>

            <div className="mt-3 flex gap-2">
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                user.role === "ADMIN" ? "bg-purple-50 text-purple-700" : "bg-blue-50 text-blue-700"
              }`}>
                {user.role}
              </span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                user.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
              }`}>
                <span className={`inline-block h-1.5 w-1.5 rounded-full ${user.isActive ? "bg-green-500" : "bg-red-400"}`} />
                {user.isActive ? "Active" : "Inactive"}
              </span>
              {user.isVerified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  Verified
                </span>
              )}
            </div>
          </div>

          {/* Quick info */}
          <div className="mt-5 space-y-3 border-t border-black/5 pt-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[color:var(--color-light-1)]">Phone</span>
              <span className="font-medium text-foreground">{user.phone || "—"}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[color:var(--color-light-1)]">Joined</span>
              <span className="font-medium text-foreground">{formatDate(user.createdAt)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[color:var(--color-light-1)]">Last Login</span>
              <span className="font-medium text-foreground">{user.lastLogin ? formatDate(user.lastLogin) : "Never"}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[color:var(--color-light-1)]">Updated</span>
              <span className="font-medium text-foreground">{formatDate(user.updatedAt)}</span>
            </div>
          </div>

          {user.bio && (
            <div className="mt-4 border-t border-black/5 pt-4">
              <p className="text-xs font-semibold text-[color:var(--color-light-1)]">Bio</p>
              <p className="mt-1 text-sm text-foreground/80">{user.bio}</p>
            </div>
          )}

          {/* Actions */}
          <div className="mt-5 flex flex-col gap-2 border-t border-black/5 pt-4">
            <button
              type="button"
              onClick={toggleActive}
              className={`w-full rounded-xl py-2 text-xs font-bold transition ${
                user.isActive
                  ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                  : "bg-green-50 text-green-700 hover:bg-green-100"
              }`}
            >
              {user.isActive ? "Deactivate User" : "Activate User"}
            </button>
            <button
              type="button"
              onClick={() => setShowDelete(true)}
              className="w-full rounded-xl bg-red-50 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100"
            >
              Delete User
            </button>
          </div>
        </div>

        {/* ── Right: Edit form ────────────────────── */}
        <div className={`${card} lg:col-span-2`}>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground">User Details</h3>
            {!editing ? (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="rounded-xl bg-black px-4 py-2 text-xs font-bold text-white hover:bg-black/80"
              >
                Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setEditing(false); setForm({ name: user.name || "", phone: user.phone || "", bio: user.bio || "", role: user.role || "USER", isActive: user.isActive !== false }); }}
                  disabled={saving}
                  className="rounded-xl border border-black/10 px-4 py-2 text-xs font-bold hover:bg-black/5"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-xl bg-black px-5 py-2 text-xs font-bold text-white disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            )}
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label}>Full Name</label>
              {editing ? (
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={inp} />
              ) : (
                <p className="rounded-xl bg-black/[0.02] px-3 py-2 text-sm text-foreground">{user.name || "—"}</p>
              )}
            </div>
            <div>
              <label className={label}>Email</label>
              <p className="rounded-xl bg-black/[0.02] px-3 py-2 text-sm text-foreground/70">{user.email}</p>
              <p className="mt-0.5 text-[10px] text-[color:var(--color-light-1)]">Email cannot be changed</p>
            </div>
            <div>
              <label className={label}>Phone</label>
              {editing ? (
                <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className={inp} placeholder="+971 5XX XXX XXX" />
              ) : (
                <p className="rounded-xl bg-black/[0.02] px-3 py-2 text-sm text-foreground">{user.phone || "—"}</p>
              )}
            </div>
            <div>
              <label className={label}>Role</label>
              {editing ? (
                <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} className={inp}>
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
              ) : (
                <p className="rounded-xl bg-black/[0.02] px-3 py-2 text-sm text-foreground">{user.role}</p>
              )}
            </div>
            <div className="sm:col-span-2">
              <label className={label}>Bio</label>
              {editing ? (
                <textarea value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} className={`${inp} resize-none`} rows={3} placeholder="Optional bio or notes about this user" />
              ) : (
                <p className="rounded-xl bg-black/[0.02] px-3 py-2 text-sm text-foreground">{user.bio || "—"}</p>
              )}
            </div>
            {editing && (
              <div className="sm:col-span-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="h-4 w-4 rounded" />
                  <span className="font-medium text-foreground">Active</span>
                  <span className="text-xs text-[color:var(--color-light-1)]">(user can log in)</span>
                </label>
              </div>
            )}
          </div>

          {/* Activity timeline */}
          <div className="mt-6 border-t border-black/5 pt-5">
            <h4 className="text-sm font-bold text-foreground">Activity</h4>
            <div className="mt-3 space-y-3">
              <div className="flex items-center gap-3 text-xs">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-50 text-green-600">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" /></svg>
                </span>
                <div>
                  <span className="font-medium text-foreground">Account Created</span>
                  <span className="ml-2 text-[color:var(--color-light-1)]">{formatDate(user.createdAt)}</span>
                </div>
              </div>
              {user.lastLogin && (
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
                  </span>
                  <div>
                    <span className="font-medium text-foreground">Last Login</span>
                    <span className="ml-2 text-[color:var(--color-light-1)]">{formatDate(user.lastLogin)}</span>
                  </div>
                </div>
              )}
              {user.isVerified && (
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  </span>
                  <span className="font-medium text-foreground">Email Verified</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={showDelete}
        title="Delete User"
        message={`Are you sure you want to permanently delete "${user.name || user.email}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => !deleting && setShowDelete(false)}
      />
    </div>
  );
}
