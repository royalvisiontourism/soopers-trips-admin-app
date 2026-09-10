"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { tagsApi } from "@/lib/api/tagsApi";
import { notifyError, notifySuccess } from "@/components/ui/toast";
import ConfirmModal from "@/components/ui/ConfirmModal";

export default function TagsPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTags = async (p, l) => {
    setLoading(true);
    try {
      const res = await tagsApi.list({ page: p, limit: l });
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

  useEffect(() => { fetchTags(page, limit); }, [page, limit]);

  const totalPages = useMemo(() => Math.max(Math.ceil(total / limit) || 1, 1), [total, limit]);

  const openDeleteModal = (t) => setDeleteTarget({ id: t._id, name: t.name });
  const closeDeleteModal = useCallback(() => { if (!deleting) setDeleteTarget(null); }, [deleting]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await tagsApi.remove(deleteTarget.id);
      notifySuccess("Tag deleted");
      setDeleteTarget(null);
      const newTotal = total - 1;
      const maxPage = Math.max(Math.ceil(newTotal / limit) || 1, 1);
      const newPage = Math.min(page, maxPage);
      setPage(newPage);
      await fetchTags(newPage, limit);
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
          <h1 className="text-2xl font-semibold text-foreground">Product Tags</h1>
          <p className="mt-1 text-sm text-[color:var(--color-light-1)]">Manage tags used to categorise and filter products.</p>
        </div>
        <Link href="/dashboard/tags/new" className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/80">
          New Tag
        </Link>
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-[color:var(--color-light-1)]">
            {loading ? "Loading..." : total === 0 ? "No tags yet" : `Showing ${items.length} of ${total} tags`}
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-[color:var(--color-light-1)]">Per page</label>
            <select value={limit} onChange={(e) => { setPage(1); setLimit(Number(e.target.value)); }} className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm">
              {[10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/10">
                <th className="py-2 pr-4 font-semibold text-foreground">Name</th>
                <th className="py-2 pr-4 font-semibold text-foreground">Slug</th>
                <th className="py-2 pr-4 font-semibold text-foreground">Active</th>
                <th className="py-2 pr-4 font-semibold text-foreground">Order</th>
                <th className="py-2 pr-0 font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="py-6 text-center text-[color:var(--color-light-1)]">Loading...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={5} className="py-6 text-center text-[color:var(--color-light-1)]">No tags found. Click &quot;New Tag&quot; to create one.</td></tr>
              ) : (
                items.map((tag) => (
                  <tr key={tag._id} className="border-b border-black/5 hover:bg-black/[0.02]">
                    <td className="py-3 pr-4">
                      <Link href={`/dashboard/tags/${encodeURIComponent(tag._id)}`} className="font-medium text-foreground hover:underline">{tag.name}</Link>
                      {tag.description ? <div className="mt-0.5 max-w-[260px] truncate text-[11px] text-[color:var(--color-light-1)]">{tag.description}</div> : null}
                    </td>
                    <td className="py-3 pr-4 font-mono text-[11px] text-[color:var(--color-light-1)]">{tag.slug || "-"}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${tag.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                        {tag.isActive ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-[color:var(--color-light-1)]">{String(tag.sortOrder ?? 0)}</td>
                    <td className="py-3 pr-0">
                      <div className="flex items-center gap-2">
                        <Link href={`/dashboard/tags/${encodeURIComponent(tag._id)}`} className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-[color:var(--color-light-3)]">Edit</Link>
                        <button type="button" onClick={() => openDeleteModal(tag)} className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-[color:var(--color-red-2)] hover:bg-[color:var(--color-light-3)]">Delete</button>
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
            Page <span className="font-medium text-foreground">{page}</span> of <span className="font-medium text-foreground">{totalPages}</span>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page <= 1 || loading} className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium text-foreground disabled:opacity-60">Prev</button>
            <button type="button" onClick={() => setPage((p) => Math.min(p + 1, totalPages))} disabled={page >= totalPages || loading} className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium text-foreground disabled:opacity-60">Next</button>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Tag"
        message={deleteTarget ? `Are you sure you want to delete "${deleteTarget.name}"? Products using this tag will be affected.` : ""}
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
