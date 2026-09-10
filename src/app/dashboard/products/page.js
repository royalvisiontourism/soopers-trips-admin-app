"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { productsApi } from "@/lib/api/productsApi";
import { notifyError, notifySuccess } from "@/components/ui/toast";
import ConfirmModal from "@/components/ui/ConfirmModal";

function formatPrice(v) {
  const n = Number(v);
  if (isNaN(n)) return "-";
  return `AED ${n.toLocaleString("en-AE", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export default function ProductsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [duplicateTarget, setDuplicateTarget] = useState(null);
  const [duplicating, setDuplicating] = useState(false);

  const fetchProducts = async (p, l) => {
    setLoading(true);
    try {
      const res = await productsApi.list({ page: p, limit: l });
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

  useEffect(() => { fetchProducts(page, limit); }, [page, limit]);

  const totalPages = useMemo(() => Math.max(Math.ceil(total / limit) || 1, 1), [total, limit]);

  const openDelete = (p) => setDeleteTarget({ id: p._id, title: p.title });
  const closeDelete = useCallback(() => { if (!deleting) setDeleteTarget(null); }, [deleting]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await productsApi.remove(deleteTarget.id);
      notifySuccess("Product deleted");
      setDeleteTarget(null);
      const newTotal = total - 1;
      const maxPage = Math.max(Math.ceil(newTotal / limit) || 1, 1);
      const newPage = Math.min(page, maxPage);
      setPage(newPage);
      await fetchProducts(newPage, limit);
    } catch (e) {
      notifyError(e);
    } finally {
      setDeleting(false);
    }
  };

  const openDuplicate = (p) => setDuplicateTarget({ id: p._id, title: p.title });
  const closeDuplicate = useCallback(() => { if (!duplicating) setDuplicateTarget(null); }, [duplicating]);

  const confirmDuplicate = async () => {
    if (!duplicateTarget) return;
    setDuplicating(true);
    try {
      const res = await productsApi.duplicate(duplicateTarget.id);
      const newProduct = res?.data?.data;
      notifySuccess("Product duplicated! Redirecting to edit...");
      setDuplicateTarget(null);
      // Redirect to the new duplicated product's edit page
      if (newProduct?._id) {
        router.push(`/dashboard/products/${encodeURIComponent(newProduct._id)}`);
      } else {
        await fetchProducts(page, limit);
      }
    } catch (e) {
      notifyError(e);
    } finally {
      setDuplicating(false);
    }
  };

  const badgeColor = (b) => {
    switch (b) {
      case "NEW": return "bg-blue-50 text-blue-700";
      case "BEST_SELLER": return "bg-purple-50 text-purple-700";
      case "TOP_RATED": return "bg-amber-50 text-amber-700";
      case "DISCOUNTED": return "bg-orange-50 text-orange-700";
      default: return "bg-gray-100 text-gray-500";
    }
  };

  const badgeLabel = (b) => {
    switch (b) {
      case "NEW": return "New";
      case "BEST_SELLER": return "Best Seller";
      case "TOP_RATED": return "Top Rated";
      case "DISCOUNTED": return "Discounted";
      default: return "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Products</h1>
          <p className="mt-1 text-sm text-[color:var(--color-light-1)]">Manage tour products and experiences.</p>
        </div>
        <Link href="/dashboard/products/new" className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/80">
          New Product
        </Link>
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-[color:var(--color-light-1)]">
            {loading ? "Loading..." : total === 0 ? "No products yet" : `Showing ${items.length} of ${total} products`}
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
                <th className="py-2 pr-4 font-semibold text-foreground">Title</th>
                <th className="py-2 pr-4 font-semibold text-foreground">Price</th>
                <th className="py-2 pr-4 font-semibold text-foreground">Duration</th>
                <th className="py-2 pr-4 font-semibold text-foreground">Badge</th>
                <th className="py-2 pr-4 font-semibold text-foreground">Active</th>
                <th className="py-2 pr-4 font-semibold text-foreground">Progress</th>
                <th className="py-2 pr-0 font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="py-6 text-center text-[color:var(--color-light-1)]">Loading...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={8} className="py-6 text-center text-[color:var(--color-light-1)]">No products found. Click &quot;New Product&quot; to create one.</td></tr>
              ) : (
                items.map((p) => {
                  const cats = Array.isArray(p.categories) ? p.categories.map((c) => c?.name || "").filter(Boolean).join(", ") : "";
                  return (
                    <tr key={p._id} className="border-b border-black/5 hover:bg-black/[0.02]">
                      <td className="py-3 pr-4">
                        <div className="h-10 w-14 overflow-hidden rounded-lg bg-[color:var(--color-light-3)]">
                          {p.coverImage ? (
                            <img src={p.coverImage} alt={p.title} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] text-[color:var(--color-light-1)]">—</div>
                          )}
                        </div>
                      </td>
                      <td className="max-w-[220px] py-3 pr-4">
                        <Link href={`/dashboard/products/${encodeURIComponent(p._id)}`} className="font-medium text-foreground hover:underline">{p.title}</Link>
                        {p.slug && <div className="mt-0.5 truncate font-mono text-[11px] text-[color:var(--color-light-1)]">{p.slug}</div>}
                        {cats && <div className="mt-0.5 truncate text-[11px] text-[color:var(--color-light-1)]">{cats}</div>}
                      </td>
                      <td className="py-3 pr-4 font-medium text-foreground">{formatPrice(p.basePrice)}</td>
                      <td className="py-3 pr-4 text-[color:var(--color-light-1)]">{p.duration || "-"}</td>
                      <td className="py-3 pr-4">
                        {p.badge ? (
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${badgeColor(p.badge)}`}>
                            {badgeLabel(p.badge)}
                          </span>
                        ) : <span className="text-[color:var(--color-light-1)]">—</span>}
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${p.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                          {p.isActive ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-black/10">
                            <div className="h-full rounded-full bg-black" style={{ width: `${Math.round(((p.currentStep || 1) / 15) * 100)}%` }} />
                          </div>
                          <span className="text-[11px] text-[color:var(--color-light-1)]">{p.currentStep || 1}/15</span>
                        </div>
                      </td>
                      <td className="py-3 pr-0">
                        <div className="flex items-center gap-2">
                          <Link href={`/dashboard/products/${encodeURIComponent(p._id)}`} className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-[color:var(--color-light-3)]">Edit</Link>
                          <button type="button" onClick={() => openDuplicate(p)} className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50">Duplicate</button>
                          <button type="button" onClick={() => openDelete(p)} className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-[color:var(--color-red-2)] hover:bg-[color:var(--color-light-3)]">Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })
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
        title="Delete Product"
        message={deleteTarget ? `Are you sure you want to delete "${deleteTarget.title}"? This action cannot be undone.` : ""}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={closeDelete}
      />

      <ConfirmModal
        open={Boolean(duplicateTarget)}
        title="Duplicate Product"
        message={duplicateTarget ? `This will create a copy of "${duplicateTarget.title}" with a unique slug. The copy will be set to inactive so you can review and update it before publishing.` : ""}
        confirmText="Duplicate"
        cancelText="Cancel"
        variant="default"
        loading={duplicating}
        onConfirm={confirmDuplicate}
        onCancel={closeDuplicate}
      />
    </div>
  );
}
