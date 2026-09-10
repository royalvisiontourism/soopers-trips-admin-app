"use client";

import { useCallback, useEffect, useState } from "react";
import { contactApi } from "@/lib/api/contactApi";
import { notifyError, notifySuccess } from "@/components/ui/toast";
import ConfirmModal from "@/components/ui/ConfirmModal";

function timeAgo(date) {
  const d = new Date(date);
  const now = Date.now();
  const diff = Math.floor((now - d.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function InquiriesPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all | unread | read | archived

  // Detail panel
  const [selected, setSelected] = useState(null);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const limit = 30;

  const fetchItems = useCallback(
    async (p, q, f) => {
      setLoading(true);
      try {
        const opts = { page: p, limit };
        if (q) opts.q = q;
        if (f === "unread") opts.isRead = false;
        else if (f === "read") opts.isRead = true;
        if (f === "archived") opts.isArchived = true;
        else opts.isArchived = false;

        const res = await contactApi.list(opts);
        const data = res?.data?.data;
        setItems(Array.isArray(data?.items) ? data.items : []);
        setTotal(Number(data?.total || 0));
      } catch (e) {
        notifyError(e);
      } finally {
        setLoading(false);
      }
    },
    [limit]
  );

  useEffect(() => {
    fetchItems(page, search, filter);
  }, [page, search, filter, fetchItems]);

  /* ── Debounced search ───────────────────────── */
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  /* ── Actions ────────────────────────────────── */
  const handleToggleRead = async (item) => {
    try {
      await contactApi.markRead(item._id, !item.isRead);
      notifySuccess(item.isRead ? "Marked as unread" : "Marked as read");
      fetchItems(page, search, filter);
      if (selected?._id === item._id) setSelected({ ...selected, isRead: !item.isRead });
    } catch (e) {
      notifyError(e);
    }
  };

  const handleArchive = async (item) => {
    try {
      await contactApi.archive(item._id, !item.isArchived);
      notifySuccess(item.isArchived ? "Unarchived" : "Archived");
      fetchItems(page, search, filter);
      if (selected?._id === item._id) setSelected(null);
    } catch (e) {
      notifyError(e);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await contactApi.remove(deleteTarget._id);
      notifySuccess("Inquiry deleted");
      setDeleteTarget(null);
      if (selected?._id === deleteTarget._id) setSelected(null);
      fetchItems(page, search, filter);
    } catch (e) {
      notifyError(e);
    } finally {
      setDeleting(false);
    }
  };

  const openDetail = async (item) => {
    setSelected(item);
    if (!item.isRead) {
      try {
        await contactApi.markRead(item._id, true);
        fetchItems(page, search, filter);
      } catch {
        /* ignore */
      }
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const inp = "w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/20";
  const filterBtn = (f, label) => (
    <button
      key={f}
      type="button"
      onClick={() => { setFilter(f); setPage(1); }}
      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
        filter === f ? "bg-black text-white" : "bg-black/5 text-foreground hover:bg-black/10"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Contact Inquiries</h1>
        <p className="mt-1 text-sm text-[color:var(--color-light-1)]">
          View and manage queries submitted from the contact page.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {filterBtn("all", "Inbox")}
          {filterBtn("unread", "Unread")}
          {filterBtn("read", "Read")}
          {filterBtn("archived", "Archived")}
        </div>
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search inquiries..."
          className={`${inp} max-w-xs`}
        />
      </div>

      {/* Content */}
      <div className="flex gap-5">
        {/* List */}
        <div className="min-w-0 flex-1">
          <div className="rounded-2xl border border-black/10 bg-white shadow-sm">
            {loading ? (
              <div className="space-y-0 divide-y divide-black/5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <div className="h-8 w-8 animate-pulse rounded-full bg-black/5" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-1/3 animate-pulse rounded bg-black/5" />
                      <div className="h-2.5 w-2/3 animate-pulse rounded bg-black/5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="py-10 text-center text-sm text-[color:var(--color-light-1)]">
                No inquiries found.
              </div>
            ) : (
              <ul className="divide-y divide-black/5">
                {items.map((item) => (
                  <li
                    key={item._id}
                    onClick={() => openDetail(item)}
                    className={`flex cursor-pointer items-start gap-3 px-4 py-3 transition hover:bg-black/[0.02] ${
                      selected?._id === item._id ? "bg-black/[0.03]" : ""
                    }`}
                  >
                    {/* Unread dot */}
                    <div className="mt-1.5 flex-shrink-0">
                      {!item.isRead ? (
                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-500" />
                      ) : (
                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-transparent" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className={`truncate text-sm ${!item.isRead ? "font-bold text-foreground" : "font-medium text-foreground/80"}`}>
                          {item.name}
                        </span>
                        <span className="flex-shrink-0 text-[10px] text-[color:var(--color-light-1)]">
                          {timeAgo(item.createdAt)}
                        </span>
                      </div>
                      {item.subject && (
                        <p className={`truncate text-xs ${!item.isRead ? "font-semibold text-foreground/90" : "text-foreground/60"}`}>
                          {item.subject}
                        </p>
                      )}
                      <p className="mt-0.5 truncate text-xs text-[color:var(--color-light-1)]">
                        {item.message}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-black/5 px-4 py-2.5">
                <span className="text-xs text-[color:var(--color-light-1)]">
                  {total} result{total !== 1 ? "s" : ""} &middot; page {page}/{totalPages}
                </span>
                <div className="flex gap-1.5">
                  <button type="button" onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page <= 1} className="rounded-lg border border-black/10 px-3 py-1 text-xs disabled:opacity-40">Prev</button>
                  <button type="button" onClick={() => setPage((p) => Math.min(p + 1, totalPages))} disabled={page >= totalPages} className="rounded-lg border border-black/10 px-3 py-1 text-xs disabled:opacity-40">Next</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Detail panel (desktop) */}
        {selected && (
          <div className="hidden w-[380px] shrink-0 lg:block">
            <div className="sticky top-24 rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-foreground">{selected.name}</h3>
                  <a href={`mailto:${selected.email}`} className="text-xs text-blue-600 hover:underline">{selected.email}</a>
                  {selected.phone && (
                    <p className="mt-0.5">
                      <a href={`tel:${selected.phone}`} className="text-xs text-[color:var(--color-light-1)] hover:underline">{selected.phone}</a>
                    </p>
                  )}
                </div>
                <button type="button" onClick={() => setSelected(null)} className="rounded-lg p-1 text-[color:var(--color-light-1)] hover:bg-black/5">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>

              {selected.subject && (
                <p className="mt-3 text-sm font-semibold text-foreground">{selected.subject}</p>
              )}

              <div className="mt-3 whitespace-pre-wrap rounded-xl bg-black/[0.02] p-3 text-sm leading-relaxed text-foreground/80">
                {selected.message}
              </div>

              <p className="mt-3 text-[10px] text-[color:var(--color-light-1)]">
                Received {new Date(selected.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={() => handleToggleRead(selected)} className="rounded-lg bg-black/5 px-3 py-1.5 text-xs font-semibold hover:bg-black/10">
                  {selected.isRead ? "Mark Unread" : "Mark Read"}
                </button>
                <button type="button" onClick={() => handleArchive(selected)} className="rounded-lg bg-black/5 px-3 py-1.5 text-xs font-semibold hover:bg-black/10">
                  {selected.isArchived ? "Unarchive" : "Archive"}
                </button>
                <button type="button" onClick={() => setDeleteTarget(selected)} className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100">
                  Delete
                </button>
                <a href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject || "Your inquiry")}`} className="rounded-lg bg-black px-4 py-1.5 text-xs font-semibold text-white hover:bg-black/80">
                  Reply via Email
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 lg:hidden" onClick={() => setSelected(null)}>
          <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-foreground">{selected.name}</h3>
                <a href={`mailto:${selected.email}`} className="text-xs text-blue-600">{selected.email}</a>
                {selected.phone && <p className="text-xs text-[color:var(--color-light-1)]">{selected.phone}</p>}
              </div>
              <button type="button" onClick={() => setSelected(null)} className="rounded-lg p-1 text-[color:var(--color-light-1)] hover:bg-black/5">✕</button>
            </div>
            {selected.subject && <p className="mt-3 text-sm font-semibold">{selected.subject}</p>}
            <div className="mt-3 whitespace-pre-wrap rounded-xl bg-black/[0.02] p-3 text-sm leading-relaxed text-foreground/80">{selected.message}</div>
            <p className="mt-2 text-[10px] text-[color:var(--color-light-1)]">
              {new Date(selected.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => handleToggleRead(selected)} className="rounded-lg bg-black/5 px-3 py-1.5 text-xs font-semibold">{selected.isRead ? "Mark Unread" : "Mark Read"}</button>
              <button type="button" onClick={() => handleArchive(selected)} className="rounded-lg bg-black/5 px-3 py-1.5 text-xs font-semibold">{selected.isArchived ? "Unarchive" : "Archive"}</button>
              <button type="button" onClick={() => setDeleteTarget(selected)} className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600">Delete</button>
              <a href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject || "Your inquiry")}`} className="rounded-lg bg-black px-4 py-1.5 text-xs font-semibold text-white">Reply via Email</a>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Inquiry"
        message="Are you sure you want to permanently delete this inquiry?"
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
