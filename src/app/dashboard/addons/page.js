"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { addonsApi } from "@/lib/api/addonsApi";
import { notifyError, notifySuccess } from "@/components/ui/toast";
import ConfirmModal from "@/components/ui/ConfirmModal";

export default function AddonsPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAddons = async (p, l) => {
    setLoading(true);
    try {
      const res = await addonsApi.list({ page: p, limit: l });
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

  useEffect(() => { fetchAddons(page, limit); }, [page, limit]);

  const totalPages = useMemo(() => Math.max(Math.ceil(total / limit) || 1, 1), [total, limit]);

  const openDeleteModal = (d) => setDeleteTarget({ id: d._id, name: d.name });
  const closeDeleteModal = useCallback(() => { if (!deleting) setDeleteTarget(null); }, [deleting]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await addonsApi.remove(deleteTarget.id);
      notifySuccess("Addon deleted");
      setDeleteTarget(null);
      const newTotal = total - 1;
      const maxPage = Math.max(Math.ceil(newTotal / limit) || 1, 1);
      const newPage = Math.min(page, maxPage);
      setPage(newPage);
      await fetchAddons(newPage, limit);
    } catch (e) {
      notifyError(e);
    } finally {
      setDeleting(false);
    }
  };

  const formatPrice = (v) => {
    const n = Number(v);
    if (isNaN(n)) return "-";
    return `AED ${n.toLocaleString("en-AE", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Addons</h1>
          <p className="mt-1 text-sm text-[color:var(--color-light-1)]">Manage additional services and add-on products.</p>
        </div>
        <Link href="/dashboard/addons/new" className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/80">
          New Addon
        </Link>
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-[color:var(--color-light-1)]">
            {loading ? "Loading..." : total === 0 ? "No addons yet" : `Showing ${items.length} of ${total} addons`}
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
                <th className="py-2 pr-4 font-semibold text-foreground">Image</th>
                <th className="py-2 pr-4 font-semibold text-foreground">Name</th>
                <th className="py-2 pr-4 font-semibold text-foreground">Price</th>
                <th className="py-2 pr-4 font-semibold text-foreground">Active</th>
                <th className="py-2 pr-4 font-semibold text-foreground">Order</th>
                <th className="py-2 pr-0 font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-6 text-center text-[color:var(--color-light-1)]">Loading...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={6} className="py-6 text-center text-[color:var(--color-light-1)]">No addons found. Click &quot;New Addon&quot; to create one.</td></tr>
              ) : (
                items.map((addon) => (
                  <tr key={addon._id} className="border-b border-black/5 hover:bg-black/[0.02]">
                    <td className="py-3 pr-4">
                      <div className="h-10 w-10 overflow-hidden rounded-lg bg-[color:var(--color-light-3)]">
                        {addon.image ? (
                          <img src={addon.image} alt={addon.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] text-[color:var(--color-light-1)]">—</div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <Link href={`/dashboard/addons/${encodeURIComponent(addon._id)}`} className="font-medium text-foreground hover:underline">{addon.name}</Link>
                      {addon.description ? <div className="mt-0.5 max-w-[220px] truncate text-[11px] text-[color:var(--color-light-1)]">{addon.description}</div> : null}
                    </td>
                    <td className="py-3 pr-4 font-medium text-foreground">{formatPrice(addon.price)}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${addon.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                        {addon.isActive ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-[color:var(--color-light-1)]">{String(addon.sortOrder ?? 0)}</td>
                    <td className="py-3 pr-0">
                      <div className="flex items-center gap-2">
                        <Link href={`/dashboard/addons/${encodeURIComponent(addon._id)}`} className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-[color:var(--color-light-3)]">Edit</Link>
                        <button type="button" onClick={() => openDeleteModal(addon)} className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-[color:var(--color-red-2)] hover:bg-[color:var(--color-light-3)]">Delete</button>
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
        title="Delete Addon"
        message={deleteTarget ? `Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone.` : ""}
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
