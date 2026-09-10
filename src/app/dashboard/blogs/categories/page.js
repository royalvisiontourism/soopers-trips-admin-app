"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { blogsApi } from "@/lib/api/blogsApi";
import { notifyError, notifySuccess } from "@/components/ui/toast";
import ConfirmModal from "@/components/ui/ConfirmModal";

export default function BlogCategoriesPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await blogsApi.listCategories({ page, limit, q: search || undefined });
      const data = res?.data?.data;
      setItems(Array.isArray(data?.items) ? data.items : []);
      setTotal(Number(data?.total ?? 0));
    } catch (e) {
      notifyError(e);
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  const openDeleteModal = (cat) => {
    setDeleteTarget({ id: cat._id, name: cat.name, postCount: cat.postCount ?? 0 });
  };

  const closeDeleteModal = useCallback(() => {
    if (!deleting) setDeleteTarget(null);
  }, [deleting]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await blogsApi.removeCategory(deleteTarget.id);
      notifySuccess("Category deleted");
      setDeleteTarget(null);
      fetchCategories();
    } catch (e) {
      notifyError(e);
    } finally {
      setDeleting(false);
    }
  };

  const canDelete = deleteTarget && (deleteTarget.postCount ?? 0) === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Blog Categories</h1>
          <p className="mt-1 text-sm text-[color:var(--color-light-1)]">
            Manage categories for blog posts. Delete only when not assigned to any post.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name..."
            className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/20 w-48 sm:w-56"
          />
          <Link
            href="/dashboard/blogs/categories/new"
            className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/80"
          >
            New Category
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-[color:var(--color-light-1)]">
            {loading ? "Loading..." : total === 0 ? "No categories" : `Showing ${items.length} of ${total}`}
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
                <th className="py-2 pr-4 font-semibold text-foreground">Name</th>
                <th className="py-2 pr-4 font-semibold text-foreground">Slug</th>
                <th className="py-2 pr-4 font-semibold text-foreground">Posts</th>
                <th className="py-2 pr-0 font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-[color:var(--color-light-1)]">Loading...</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-[color:var(--color-light-1)]">
                    No categories found. Click &quot;New Category&quot; to create one.
                  </td>
                </tr>
              ) : (
                items.map((c) => (
                  <tr key={c._id} className="border-b border-black/5 hover:bg-black/[0.02]">
                    <td className="py-3 pr-4">
                      <Link
                        href={`/dashboard/blogs/categories/${encodeURIComponent(c._id)}`}
                        className="font-medium text-foreground hover:underline"
                      >
                        {c.name}
                      </Link>
                      {c.description ? (
                        <div className="mt-0.5 line-clamp-1 text-xs text-[color:var(--color-light-1)]">{c.description}</div>
                      ) : null}
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs text-[color:var(--color-light-1)]">{c.slug || "—"}</td>
                    <td className="py-3 pr-4 text-[color:var(--color-light-1)]">{c.postCount ?? 0}</td>
                    <td className="py-3 pr-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/blogs/categories/${encodeURIComponent(c._id)}`}
                          className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-[color:var(--color-light-3)]"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => openDeleteModal(c)}
                          disabled={(c.postCount ?? 0) > 0}
                          title={(c.postCount ?? 0) > 0 ? "Unassign from all posts first" : "Delete"}
                          className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-[color:var(--color-red-2)] hover:bg-[color:var(--color-light-3)] disabled:opacity-50 disabled:cursor-not-allowed"
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
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium text-foreground disabled:opacity-60"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium text-foreground disabled:opacity-60"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete category"
        message={
          deleteTarget
            ? canDelete
              ? `Are you sure you want to delete "${deleteTarget.name}"?`
              : `"${deleteTarget.name}" is used by ${deleteTarget.postCount} post(s). Unassign it from all posts before deleting.`
            : ""
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={closeDeleteModal}
        showConfirm={canDelete}
      />
    </div>
  );
}
