"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { categoriesApi } from "@/lib/api/categoriesApi";
import { notifyError, notifySuccess } from "@/components/ui/toast";
import ConfirmModal from "@/components/ui/ConfirmModal";

export default function CategoriesPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = async (p, l) => {
    setLoading(true);
    try {
      const res = await categoriesApi.list({ page: p, limit: l });
      const data = res?.data?.data;
      setItems(Array.isArray(data?.items) ? data.items : []);
      setTotal(Number(data?.total || 0));
    } catch (e) {
      notifyError(e);
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories(page, limit);
  }, [page, limit]);

  const totalPages = useMemo(() => Math.max(Math.ceil(total / limit) || 1, 1), [total, limit]);

  const openDeleteModal = (cat) => {
    setDeleteTarget({ id: cat._id, name: cat.name });
  };

  const closeDeleteModal = useCallback(() => {
    if (!deleting) setDeleteTarget(null);
  }, [deleting]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await categoriesApi.remove(deleteTarget.id);
      notifySuccess("Category deleted");
      setDeleteTarget(null);
      const newTotal = total - 1;
      const maxPage = Math.max(Math.ceil(newTotal / limit) || 1, 1);
      const newPage = Math.min(page, maxPage);
      setPage(newPage);
      await fetchCategories(newPage, limit);
    } catch (e) {
      notifyError(e);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Tour Categories</h1>
          <p className="mt-1 text-sm text-[color:var(--color-light-1)]">Manage categories for tours and products.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/categories/new"
            className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/80"
          >
            New Category
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-[color:var(--color-light-1)]">
            {loading ? "Loading..." : total === 0 ? "No categories yet" : `Showing ${items.length} of ${total} categories`}
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-[color:var(--color-light-1)]">Per page</label>
            <select
              value={limit}
              onChange={(e) => {
                setPage(1);
                setLimit(Number(e.target.value));
              }}
              className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
            >
              {[10, 20, 50].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/10">
                <th className="py-2 pr-4 font-semibold text-foreground">Image</th>
                <th className="py-2 pr-4 font-semibold text-foreground">Name</th>
                <th className="py-2 pr-4 font-semibold text-foreground">Slug</th>
                <th className="py-2 pr-4 font-semibold text-foreground">Active</th>
                <th className="py-2 pr-4 font-semibold text-foreground">Order</th>
                <th className="py-2 pr-0 font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-[color:var(--color-light-1)]">Loading...</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-[color:var(--color-light-1)]">
                    No categories found. Click &quot;New Category&quot; to create one.
                  </td>
                </tr>
              ) : (
                items.map((c) => (
                  <tr key={c._id} className="border-b border-black/5 hover:bg-black/[0.02]">
                    <td className="py-3 pr-4">
                      <div className="h-10 w-10 overflow-hidden rounded-lg bg-[color:var(--color-light-3)]">
                        {c.image ? (
                          <img src={c.image} alt={c.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] text-[color:var(--color-light-1)]">
                            —
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <Link
                        href={`/dashboard/categories/${encodeURIComponent(c._id)}`}
                        className="font-medium text-foreground hover:underline"
                      >
                        {c.name}
                      </Link>
                      {c.description ? (
                        <div className="mt-0.5 line-clamp-1 text-xs text-[color:var(--color-light-1)]">{c.description}</div>
                      ) : null}
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs text-[color:var(--color-light-1)]">{c.slug || "-"}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          c.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                        }`}
                      >
                        {c.isActive ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-[color:var(--color-light-1)]">{String(c.sortOrder ?? 0)}</td>
                    <td className="py-3 pr-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/categories/${encodeURIComponent(c._id)}`}
                          className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-[color:var(--color-light-3)]"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => openDeleteModal(c)}
                          className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-[color:var(--color-red-2)] hover:bg-[color:var(--color-light-3)]"
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
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-[color:var(--color-light-1)]">
            Page <span className="font-medium text-foreground">{page}</span> of{" "}
            <span className="font-medium text-foreground">{totalPages}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page <= 1 || loading}
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium text-foreground disabled:opacity-60"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page >= totalPages || loading}
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium text-foreground disabled:opacity-60"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Category"
        message={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.name}"? Products using this category will be affected.`
            : ""
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={closeDeleteModal}
      />
    </div>
  );
}
