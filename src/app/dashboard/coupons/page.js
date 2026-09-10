"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { couponsApi } from "@/lib/api/couponsApi";
import { notifyError, notifySuccess } from "@/components/ui/toast";
import ConfirmModal from "@/components/ui/ConfirmModal";

function fmtDate(v) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function couponStatus(coupon) {
  if (!coupon.isActive) return { label: "Inactive", cls: "bg-gray-100 text-gray-600" };
  const now = new Date();
  if (coupon.validUntil && now > new Date(coupon.validUntil)) return { label: "Expired", cls: "bg-red-50 text-red-700" };
  if (coupon.validFrom && now < new Date(coupon.validFrom)) return { label: "Scheduled", cls: "bg-yellow-50 text-yellow-700" };
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return { label: "Exhausted", cls: "bg-orange-50 text-orange-700" };
  return { label: "Active", cls: "bg-green-50 text-green-700" };
}

export default function CouponsPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCoupons = async (p, l) => {
    setLoading(true);
    try {
      const res = await couponsApi.list({ page: p, limit: l });
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
    fetchCoupons(page, limit);
  }, [page, limit]);

  const totalPages = useMemo(() => Math.max(Math.ceil(total / limit) || 1, 1), [total, limit]);

  const openDeleteModal = (coupon) => {
    setDeleteTarget({ id: coupon._id, code: coupon.code });
  };

  const closeDeleteModal = useCallback(() => {
    if (!deleting) setDeleteTarget(null);
  }, [deleting]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await couponsApi.remove(deleteTarget.id);
      notifySuccess("Coupon deleted");
      setDeleteTarget(null);
      const newTotal = total - 1;
      const maxPage = Math.max(Math.ceil(newTotal / limit) || 1, 1);
      const newPage = Math.min(page, maxPage);
      setPage(newPage);
      await fetchCoupons(newPage, limit);
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
          <h1 className="text-2xl font-semibold text-foreground">Coupons</h1>
          <p className="mt-1 text-sm text-[color:var(--color-light-1)]">Create and manage discount coupons for products.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/coupons/new"
            className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/80"
          >
            New Coupon
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-[color:var(--color-light-1)]">
            {loading ? "Loading..." : total === 0 ? "No coupons yet" : `Showing ${items.length} of ${total} coupons`}
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
                <th className="py-2 pr-4 font-semibold text-foreground">Code</th>
                <th className="py-2 pr-4 font-semibold text-foreground">Discount</th>
                <th className="py-2 pr-4 font-semibold text-foreground">Valid From</th>
                <th className="py-2 pr-4 font-semibold text-foreground">Valid Until</th>
                <th className="py-2 pr-4 font-semibold text-foreground">Usage</th>
                <th className="py-2 pr-4 font-semibold text-foreground">Status</th>
                <th className="py-2 pr-0 font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-[color:var(--color-light-1)]">Loading...</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-[color:var(--color-light-1)]">
                    No coupons found. Click &quot;New Coupon&quot; to create one.
                  </td>
                </tr>
              ) : (
                items.map((c) => {
                  const status = couponStatus(c);
                  return (
                    <tr key={c._id} className="border-b border-black/5 hover:bg-black/[0.02]">
                      <td className="py-3 pr-4">
                        <Link
                          href={`/dashboard/coupons/${encodeURIComponent(c._id)}`}
                          className="font-mono font-semibold text-foreground hover:underline"
                        >
                          {c.code}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 text-[color:var(--color-light-1)]">
                        {c.discountType === "PERCENTAGE"
                          ? `${c.discountValue}%`
                          : `AED ${c.discountValue}`}
                      </td>
                      <td className="py-3 pr-4 text-[color:var(--color-light-1)]">{fmtDate(c.validFrom)}</td>
                      <td className="py-3 pr-4 text-[color:var(--color-light-1)]">{fmtDate(c.validUntil)}</td>
                      <td className="py-3 pr-4 text-[color:var(--color-light-1)]">
                        {c.usedCount ?? 0}{c.usageLimit ? ` / ${c.usageLimit}` : ""}
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${status.cls}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="py-3 pr-0">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/dashboard/coupons/${encodeURIComponent(c._id)}`}
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
                  );
                })
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
        title="Delete Coupon"
        message={
          deleteTarget
            ? `Are you sure you want to delete coupon "${deleteTarget.code}"? This action cannot be undone.`
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
