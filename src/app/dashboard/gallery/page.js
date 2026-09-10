"use client";

import { useCallback, useEffect, useState } from "react";
import { galleryApi } from "@/lib/api/galleryApi";
import { uploadFile as uploadFileApi } from "@/lib/api/uploadApi";
import { notifyError, notifySuccess } from "@/components/ui/toast";
import ConfirmModal from "@/components/ui/ConfirmModal";

export default function GalleryPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Edit modal
  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState({ title: "", alt: "", caption: "", category: "", sortOrder: 0, isActive: true });
  const [saving, setSaving] = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const limit = 50;

  const fetchImages = useCallback(async (p) => {
    setLoading(true);
    try {
      const res = await galleryApi.list({ page: p, limit });
      const data = res?.data?.data;
      setItems(Array.isArray(data?.items) ? data.items : []);
      setTotal(Number(data?.total || 0));
    } catch (e) {
      notifyError(e);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchImages(page);
  }, [page, fetchImages]);

  /* ── Upload handler ──────────────────────────── */
  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const valid = files.filter((f) => allowed.includes(f.type) && f.size <= 10 * 1024 * 1024);
    if (valid.length === 0) {
      notifyError("Only images (JPG, PNG, WebP, GIF) under 10 MB are allowed");
      return;
    }

    setUploading(true);
    const newImages = [];
    for (const file of valid) {
      try {
        const result = await uploadFileApi(file, "gallery", "gallery");
        if (result?.url) {
          newImages.push({
            url: result.url,
            title: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
            alt: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
          });
        }
      } catch {
        /* skip failed */
      }
    }

    if (newImages.length > 0) {
      try {
        await galleryApi.bulkCreate(newImages);
        notifySuccess(`${newImages.length} image${newImages.length > 1 ? "s" : ""} uploaded`);
        fetchImages(page);
      } catch (e) {
        notifyError(e);
      }
    }

    setUploading(false);
    e.target.value = "";
  };

  /* ── Edit handler ────────────────────────────── */
  const openEdit = (item) => {
    setEditItem(item);
    setEditForm({
      title: item.title || "",
      alt: item.alt || "",
      caption: item.caption || "",
      category: item.category || "",
      sortOrder: item.sortOrder ?? 0,
      isActive: item.isActive !== false,
    });
  };

  const saveEdit = async () => {
    if (!editItem) return;
    setSaving(true);
    try {
      await galleryApi.update(editItem._id, editForm);
      notifySuccess("Image updated");
      setEditItem(null);
      fetchImages(page);
    } catch (e) {
      notifyError(e);
    } finally {
      setSaving(false);
    }
  };

  /* ── Delete handler ──────────────────────────── */
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await galleryApi.remove(deleteTarget._id);
      notifySuccess("Image deleted");
      setDeleteTarget(null);
      fetchImages(page);
    } catch (e) {
      notifyError(e);
    } finally {
      setDeleting(false);
    }
  };

  /* ── Toggle active ───────────────────────────── */
  const toggleActive = async (item) => {
    try {
      await galleryApi.update(item._id, { isActive: !item.isActive });
      notifySuccess(item.isActive ? "Image hidden" : "Image visible");
      fetchImages(page);
    } catch (e) {
      notifyError(e);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  /* ── Styling ─────────────────────────────────── */
  const card = "rounded-2xl border border-black/10 bg-white p-5 shadow-sm";
  const inp = "w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/20";
  const label = "block text-xs font-medium text-foreground mb-1";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Gallery</h1>
          <p className="mt-1 text-sm text-[color:var(--color-light-1)]">
            Manage images for the public gallery. Images with SEO alt text rank better.
          </p>
        </div>
        <label className={`inline-flex cursor-pointer items-center rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/80 ${uploading ? "pointer-events-none opacity-60" : ""}`}>
          {uploading ? "Uploading..." : "+ Upload Images"}
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            disabled={uploading}
            onChange={handleUpload}
          />
        </label>
      </div>

      {/* Info */}
      <div className={card}>
        <div className="flex items-center justify-between">
          <p className="text-sm text-[color:var(--color-light-1)]">
            {loading ? "Loading..." : `${total} image${total !== 1 ? "s" : ""}`}
          </p>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-xl bg-black/5" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="mt-6 text-center text-sm text-[color:var(--color-light-1)]">
            No images yet. Click &quot;Upload Images&quot; to add some.
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {items.map((item) => (
              <div
                key={item._id}
                className={`group relative aspect-square overflow-hidden rounded-xl border bg-black/5 ${item.isActive ? "border-black/10" : "border-red-300 opacity-60"}`}
              >
                <img
                  src={item.url}
                  alt={item.alt || item.title || "Gallery image"}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition group-hover:opacity-100">
                  <div className="p-2">
                    {item.title && (
                      <p className="truncate text-xs font-medium text-white">{item.title}</p>
                    )}
                    {item.category && (
                      <p className="truncate text-[10px] text-white/70">{item.category}</p>
                    )}
                    <div className="mt-1.5 flex gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        className="rounded-lg bg-white/20 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-sm hover:bg-white/30"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleActive(item)}
                        className="rounded-lg bg-white/20 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-sm hover:bg-white/30"
                      >
                        {item.isActive ? "Hide" : "Show"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(item)}
                        className="rounded-lg bg-red-500/80 px-2 py-1 text-[10px] font-semibold text-white hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
                {/* Status badge */}
                {!item.isActive && (
                  <span className="absolute left-1.5 top-1.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                    Hidden
                  </span>
                )}
                {/* Sort order badge */}
                {item.sortOrder > 0 && (
                  <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-[9px] font-bold text-white">
                    {item.sortOrder}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-[color:var(--color-light-1)]">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button type="button" onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page <= 1 || loading} className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium disabled:opacity-50">Prev</button>
              <button type="button" onClick={() => setPage((p) => Math.min(p + 1, totalPages))} disabled={page >= totalPages || loading} className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !saving && setEditItem(null)}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-foreground">Edit Image</h2>
            <div className="mt-4 flex gap-4">
              <div className="h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-black/5">
                <img src={editItem.url} alt={editForm.alt} className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0 flex-1 space-y-3">
                <div>
                  <label className={label}>Title</label>
                  <input value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} className={inp} placeholder="Image title" />
                </div>
                <div>
                  <label className={label}>Alt Text (SEO)</label>
                  <input value={editForm.alt} onChange={(e) => setEditForm((f) => ({ ...f, alt: e.target.value }))} className={inp} placeholder="Descriptive alt text for SEO" />
                </div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className={label}>Caption</label>
                <input value={editForm.caption} onChange={(e) => setEditForm((f) => ({ ...f, caption: e.target.value }))} className={inp} placeholder="Optional caption" />
              </div>
              <div>
                <label className={label}>Category</label>
                <input value={editForm.category} onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))} className={inp} placeholder="e.g. Yacht, Desert Safari" />
              </div>
              <div>
                <label className={label}>Sort Order</label>
                <input type="number" value={editForm.sortOrder} onChange={(e) => setEditForm((f) => ({ ...f, sortOrder: Number(e.target.value) || 0 }))} className={inp} />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={editForm.isActive} onChange={(e) => setEditForm((f) => ({ ...f, isActive: e.target.checked }))} className="h-4 w-4" />
                  Active (visible on website)
                </label>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setEditItem(null)} disabled={saving} className="rounded-xl border border-black/10 px-4 py-2 text-sm font-semibold">Cancel</button>
              <button type="button" onClick={saveEdit} disabled={saving} className="rounded-xl bg-black px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Image"
        message="Are you sure you want to delete this image? This cannot be undone."
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
