"use client";

import { useCallback, useEffect, useState } from "react";
import { usersApi } from "@/lib/api/usersApi";
import { notifyError, notifySuccess } from "@/components/ui/toast";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Link from "next/link";

function timeAgo(date) {
  if (!date) return "—";
  const d = new Date(date);
  const now = Date.now();
  const diff = Math.floor((now - d.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function UsersPage() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Delete
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const limit = 20;

  const fetchUsers = useCallback(
    async (p, q, role, status) => {
      setLoading(true);
      try {
        const opts = { page: p, limit, role: role || "USER" };
        if (q) opts.search = q;
        if (status === "active") opts.isActive = true;
        else if (status === "inactive") opts.isActive = false;

        const res = await usersApi.list(opts);
        const data = res?.data?.data;
        setItems(Array.isArray(data?.users) ? data.users : []);
        setPagination(data?.pagination || { page: 1, pages: 1, total: 0 });
      } catch (e) {
        notifyError(e);
      } finally {
        setLoading(false);
      }
    },
    [limit]
  );

  useEffect(() => {
    fetchUsers(page, search, roleFilter, statusFilter);
  }, [page, search, roleFilter, statusFilter, fetchUsers]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  /* ── Toggle active status ───────────────────── */
  const toggleActive = async (user) => {
    try {
      await usersApi.update(user._id, { isActive: !user.isActive });
      notifySuccess(user.isActive ? "User deactivated" : "User activated");
      fetchUsers(page, search, roleFilter, statusFilter);
    } catch (e) {
      notifyError(e);
    }
  };

  /* ── Toggle role ────────────────────────────── */
  const toggleRole = async (user) => {
    const newRole = user.role === "ADMIN" ? "USER" : "ADMIN";
    try {
      await usersApi.update(user._id, { role: newRole });
      notifySuccess(`Role changed to ${newRole}`);
      fetchUsers(page, search, roleFilter, statusFilter);
    } catch (e) {
      notifyError(e);
    }
  };

  /* ── Delete ─────────────────────────────────── */
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await usersApi.remove(deleteTarget._id);
      notifySuccess("User deleted");
      setDeleteTarget(null);
      fetchUsers(page, search, roleFilter, statusFilter);
    } catch (e) {
      notifyError(e);
    } finally {
      setDeleting(false);
    }
  };

  const inp = "rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/20";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Users</h1>
        <p className="mt-1 text-sm text-[color:var(--color-light-1)]">
          Manage users who signed up through the frontend.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className={inp}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by name, email, phone..."
          className={`${inp} w-full max-w-xs`}
        />
      </div>

      {/* Stats */}
      <div className="text-xs text-[color:var(--color-light-1)]">
        {loading ? "Loading..." : `${pagination.total} user${pagination.total !== 1 ? "s" : ""} found`}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-black/10 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/5 text-xs font-semibold uppercase tracking-wide text-[color:var(--color-light-1)]">
              <th className="py-3 pl-4 pr-2">User</th>
              <th className="px-2 py-3">Phone</th>
              <th className="px-2 py-3">Status</th>
              <th className="px-2 py-3">Joined</th>
              <th className="px-2 py-3">Last Login</th>
              <th className="py-3 pl-2 pr-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={6} className="px-4 py-3"><div className="h-4 w-full animate-pulse rounded bg-black/5" /></td>
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-[color:var(--color-light-1)]">No users found.</td>
              </tr>
            ) : (
              items.map((user) => (
                <tr key={user._id} className="transition hover:bg-black/[0.02]">
                  {/* User info */}
                  <td className="py-3 pl-4 pr-2">
                    <Link href={`/dashboard/users/${encodeURIComponent(user._id)}`} className="group">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#8B6914]/20 to-[#8B6914]/5 text-sm font-bold text-[#8B6914]">
                          {(user.name || "?")[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground group-hover:underline">{user.name || "—"}</p>
                          <p className="truncate text-xs text-[color:var(--color-light-1)]">{user.email}</p>
                        </div>
                      </div>
                    </Link>
                  </td>
                  {/* Phone */}
                  <td className="px-2 py-3 text-xs text-[color:var(--color-light-1)]">
                    {user.phone || "—"}
                  </td>
                  {/* Status */}
                  <td className="px-2 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      user.isActive
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-600"
                    }`}>
                      <span className={`inline-block h-1.5 w-1.5 rounded-full ${user.isActive ? "bg-green-500" : "bg-red-400"}`} />
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  {/* Joined */}
                  <td className="px-2 py-3 text-xs text-[color:var(--color-light-1)]">
                    {timeAgo(user.createdAt)}
                  </td>
                  {/* Last Login */}
                  <td className="px-2 py-3 text-xs text-[color:var(--color-light-1)]">
                    {user.lastLogin ? timeAgo(user.lastLogin) : "Never"}
                  </td>
                  {/* Actions */}
                  <td className="py-3 pl-2 pr-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/dashboard/users/${encodeURIComponent(user._id)}`}
                        className="rounded-lg px-2 py-1 text-[11px] font-semibold text-foreground hover:bg-black/5"
                      >
                        View
                      </Link>
                      <button
                        type="button"
                        onClick={() => toggleActive(user)}
                        className={`rounded-lg px-2 py-1 text-[11px] font-semibold ${
                          user.isActive
                            ? "text-amber-600 hover:bg-amber-50"
                            : "text-green-600 hover:bg-green-50"
                        }`}
                      >
                        {user.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(user)}
                        className="rounded-lg px-2 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between border-t border-black/5 px-4 py-2.5">
            <span className="text-xs text-[color:var(--color-light-1)]">
              Page {pagination.page} of {pagination.pages}
            </span>
            <div className="flex gap-1.5">
              <button type="button" onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page <= 1} className="rounded-lg border border-black/10 px-3 py-1 text-xs disabled:opacity-40">Prev</button>
              <button type="button" onClick={() => setPage((p) => Math.min(p + 1, pagination.pages))} disabled={page >= pagination.pages} className="rounded-lg border border-black/10 px-3 py-1 text-xs disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete User"
        message={`Are you sure you want to permanently delete "${deleteTarget?.name || deleteTarget?.email}"? This cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => !deleting && setDeleteTarget(null)}
      />
    </div>
  );
}
