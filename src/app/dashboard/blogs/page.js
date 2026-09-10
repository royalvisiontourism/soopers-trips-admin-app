"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { blogsApi } from "@/lib/api/blogsApi";
import { notifyError, notifySuccess } from "@/components/ui/toast";
import ConfirmModal from "@/components/ui/ConfirmModal";

const TABS = [
  { value: "all", label: "All" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
  { value: "archived", label: "Archived" },
];

function formatDate(d) {
  if (!d) return "—";
  const date = new Date(d);
  return date.toLocaleDateString("en-AE", { dateStyle: "short" });
}

export default function BlogsPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [actioningId, setActioningId] = useState(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await blogsApi.list({
        page,
        limit,
        status: status === "all" ? undefined : status,
        q: search || undefined,
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
  }, [page, limit, status, search]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  const openDeleteModal = (post) => {
    setDeleteTarget({ id: post._id, title: post.title });
  };

  const closeDeleteModal = useCallback(() => {
    if (!deleting) setDeleteTarget(null);
  }, [deleting]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await blogsApi.remove(deleteTarget.id);
      notifySuccess("Blog post deleted");
      setDeleteTarget(null);
      fetchPosts();
    } catch (e) {
      notifyError(e);
    } finally {
      setDeleting(false);
    }
  };

  const handlePublish = async (id) => {
    setActioningId(id);
    try {
      await blogsApi.publish(id);
      notifySuccess("Published");
      fetchPosts();
    } catch (e) {
      notifyError(e);
    } finally {
      setActioningId(null);
    }
  };

  const handleArchive = async (id) => {
    setActioningId(id);
    try {
      await blogsApi.archive(id);
      notifySuccess("Archived");
      fetchPosts();
    } catch (e) {
      notifyError(e);
    } finally {
      setActioningId(null);
    }
  };

  const authorName = (post) => (post.authorId && (post.authorId.name || post.authorId._id)) || "—";
  const categoryName = (post) => (post.primaryCategoryId && (post.primaryCategoryId.name || post.primaryCategoryId._id)) || "—";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Blog</h1>
          <p className="mt-1 text-sm text-[color:var(--color-light-1)]">
            Create and manage blog posts. Use status tabs to filter.
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
            placeholder="Search title or excerpt..."
            className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/20 w-48 sm:w-56"
          />
          <Link
            href="/dashboard/blogs/categories"
            className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-foreground hover:bg-[color:var(--color-light-3)]"
          >
            Categories
          </Link>
          <Link
            href="/dashboard/blogs/new"
            className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/80"
          >
            New post
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-black/10">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => {
              setStatus(tab.value);
              setPage(1);
            }}
            className={`rounded-t-xl px-4 py-2 text-sm font-medium ${
              status === tab.value
                ? "bg-black text-white"
                : "bg-transparent text-foreground hover:bg-black/5"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-[color:var(--color-light-1)]">
            {loading ? "Loading..." : total === 0 ? "No posts" : `Showing ${items.length} of ${total}`}
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
                <th className="py-2 pr-4 font-semibold text-foreground">Title</th>
                <th className="py-2 pr-4 font-semibold text-foreground">Status</th>
                <th className="py-2 pr-4 font-semibold text-foreground">Author</th>
                <th className="py-2 pr-4 font-semibold text-foreground">Category</th>
                <th className="py-2 pr-4 font-semibold text-foreground">Published</th>
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
                    No posts found. Click &quot;New post&quot; to create one.
                  </td>
                </tr>
              ) : (
                items.map((post) => (
                  <tr key={post._id} className="border-b border-black/5 hover:bg-black/[0.02]">
                    <td className="py-3 pr-4">
                      <Link
                        href={`/dashboard/blogs/${encodeURIComponent(post._id)}`}
                        className="font-medium text-foreground hover:underline"
                      >
                        {post.title || "—"}
                      </Link>
                      {post.slug ? (
                        <div className="mt-0.5 text-xs text-[color:var(--color-light-1)]">{post.slug}</div>
                      ) : null}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          post.status === "published"
                            ? "bg-green-100 text-green-800"
                            : post.status === "draft"
                              ? "bg-gray-100 text-gray-600"
                              : post.status === "scheduled"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-red-50 text-red-700"
                        }`}
                      >
                        {post.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-[color:var(--color-light-1)]">{authorName(post)}</td>
                    <td className="py-3 pr-4 text-[color:var(--color-light-1)]">{categoryName(post)}</td>
                    <td className="py-3 pr-4 text-[color:var(--color-light-1)]">{formatDate(post.publishedAt)}</td>
                    <td className="py-3 pr-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/dashboard/blogs/${encodeURIComponent(post._id)}`}
                          className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-[color:var(--color-light-3)]"
                        >
                          Edit
                        </Link>
                        {post.status === "draft" || post.status === "scheduled" ? (
                          <button
                            type="button"
                            onClick={() => handlePublish(post._id)}
                            disabled={actioningId === post._id}
                            className="rounded-lg border border-green-600 bg-white px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50 disabled:opacity-60"
                          >
                            {actioningId === post._id ? "…" : "Publish"}
                          </button>
                        ) : null}
                        {post.status === "published" ? (
                          <button
                            type="button"
                            onClick={() => handleArchive(post._id)}
                            disabled={actioningId === post._id}
                            className="rounded-lg border border-amber-600 bg-white px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50 disabled:opacity-60"
                          >
                            {actioningId === post._id ? "…" : "Archive"}
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => openDeleteModal(post)}
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
        title="Delete post"
        message={deleteTarget ? `Are you sure you want to delete "${deleteTarget.title}"?` : ""}
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
