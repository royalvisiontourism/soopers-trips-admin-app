"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { reviewsApi } from "@/lib/api/reviewsApi";
import { notifyError, notifySuccess } from "@/components/ui/toast";
import ConfirmModal from "@/components/ui/ConfirmModal";

export default function ReviewsPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [verifyingId, setVerifyingId] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchReviews = useCallback(async (p, l, q) => {
    setLoading(true);
    try {
      const res = await reviewsApi.list({
        page: p,
        limit: l,
        q: q || undefined,
      });
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
  }, []);

  useEffect(() => {
    fetchReviews(page, limit, searchDebounced);
  }, [page, limit, searchDebounced, fetchReviews]);

  const totalPages = useMemo(
    () => Math.max(Math.ceil(total / limit) || 1, 1),
    [total, limit]
  );

  const openDeleteModal = (review) => {
    setDeleteTarget({
      id: review._id,
      name: review.full_name || review.email || "Review",
    });
  };

  const closeDeleteModal = useCallback(() => {
    if (!deleting) setDeleteTarget(null);
  }, [deleting]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await reviewsApi.remove(deleteTarget.id);
      notifySuccess("Review deleted");
      setDeleteTarget(null);
      const newTotal = total - 1;
      const maxPage = Math.max(Math.ceil(newTotal / limit) || 1, 1);
      const newPage = Math.min(page, maxPage);
      setPage(newPage);
      await fetchReviews(newPage, limit, searchDebounced);
    } catch (e) {
      notifyError(e);
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleVerify = async (id, nextValue) => {
    try {
      setVerifyingId(id);
      await reviewsApi.verify(id, nextValue);
      notifySuccess(`Review ${nextValue ? "verified" : "unverified"}`);
      setItems((prev) =>
        prev.map((r) => (r._id === id ? { ...r, is_verified: nextValue } : r))
      );
    } catch (e) {
      notifyError(e);
    } finally {
      setVerifyingId(null);
    }
  };

  const productName = (r) => {
    const p = r.product_id;
    if (!p) return "—";
    return typeof p === "object" ? p.title || p.name || p._id : "—";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Reviews</h1>
          <p className="mt-1 text-sm text-[color:var(--color-light-1)]">
            Manage product reviews. Create, edit, verify or delete.
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
            placeholder="Search name, email, text..."
            className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/20 w-48 sm:w-56"
          />
          <Link
            href="/dashboard/reviews/new"
            className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/80"
          >
            New Review
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-[color:var(--color-light-1)]">
            {loading
              ? "Loading..."
              : total === 0
                ? "No reviews yet"
                : `Showing ${items.length} of ${total} reviews`}
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
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/10">
                <th className="py-2 pr-4 font-semibold text-foreground">Name</th>
                <th className="py-2 pr-4 font-semibold text-foreground">Email</th>
                <th className="py-2 pr-4 font-semibold text-foreground">Product</th>
                <th className="py-2 pr-4 font-semibold text-foreground">Rating</th>
                <th className="py-2 pr-4 font-semibold text-foreground">Verified</th>
                <th className="py-2 pr-0 font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-[color:var(--color-light-1)]">
                    Loading...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-[color:var(--color-light-1)]">
                    No reviews found. Click &quot;New Review&quot; to create one.
                  </td>
                </tr>
              ) : (
                items.map((r) => (
                  <tr key={r._id} className="border-b border-black/5 hover:bg-black/[0.02]">
                    <td className="py-3 pr-4">
                      <span className="font-medium text-foreground">
                        {r.full_name || "—"}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-[color:var(--color-light-1)]">{r.email}</td>
                    <td className="py-3 pr-4">{productName(r)}</td>
                    <td className="py-3 pr-4">
                      <span className="text-foreground">{r.rating}/5</span>
                    </td>
                    <td className="py-3 pr-4">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={r.is_verified}
                        aria-label={r.is_verified ? "Verified (click to disable)" : "Not verified (click to enable)"}
                        onClick={() => handleToggleVerify(r._id, !r.is_verified)}
                        disabled={verifyingId === r._id}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-black/20 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60 ${
                          r.is_verified ? "bg-amber-700" : "bg-gray-200"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
                            r.is_verified ? "translate-x-6" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    </td>
                    <td className="py-3 pr-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/reviews/${encodeURIComponent(r._id)}`}
                          className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-[color:var(--color-light-3)]"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => openDeleteModal(r)}
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

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Review"
        message={
          deleteTarget
            ? `Are you sure you want to delete this review${deleteTarget.name ? ` by "${deleteTarget.name}"` : ""}?`
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
