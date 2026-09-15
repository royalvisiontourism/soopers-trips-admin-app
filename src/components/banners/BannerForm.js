"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

function asString(v, fallback = "") {
  if (v === undefined || v === null) return fallback;
  return String(v);
}

function asBool(v, fallback = false) {
  if (typeof v === "boolean") return v;
  if (v === undefined || v === null) return fallback;
  const s = String(v).toLowerCase().trim();
  if (["true", "1", "yes", "y", "on"].includes(s)) return true;
  if (["false", "0", "no", "n", "off"].includes(s)) return false;
  return fallback;
}

function slugifyBase(input) {
  const raw = String(input ?? "");
  return raw
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");
}

// Used while typing: keep trailing '-' so users can see it
function slugifyForInput(input) {
  return slugifyBase(input).replace(/^-+/, "");
}

// Used for saving: no leading/trailing '-'
function slugifyForSave(input) {
  return slugifyBase(input).replace(/^-+/, "").replace(/-+$/, "");
}

export default function BannerForm({ initialValues, submitting, onSubmit, submitLabel = "Save" }) {
  const isEditing = Boolean(initialValues?._id);
  const initial = initialValues || {};

  const [title, setTitle] = useState(asString(initial.title));
  const [subtitle, setSubtitle] = useState(asString(initial.subtitle));
  const [page, setPage] = useState(asString(initial.page || "home"));
  const [slug, setSlug] = useState(slugifyForSave(initial.slug || ""));
  const [ctaText, setCtaText] = useState(asString(initial.ctaText || ""));
  const [ctaUrl, setCtaUrl] = useState(asString(initial.ctaUrl || ""));
  const [mediaAlt, setMediaAlt] = useState(asString(initial.mediaAlt || ""));
  const [sortOrder, setSortOrder] = useState(asString(initial.sortOrder ?? "0"));
  const [priority, setPriority] = useState(asBool(initial.priority, false));
  const [isActive, setIsActive] = useState(asBool(initial.isActive, true));

  const [file, setFile] = useState(null);
  const [mediaUrl, setMediaUrl] = useState(asString(initial.mediaUrl || ""));
  const [fileInputKey, setFileInputKey] = useState(0);

  // Validation errors
  const [errors, setErrors] = useState({});

  const preview = useMemo(() => {
    if (file) return URL.createObjectURL(file);
    return mediaUrl || "";
  }, [file, mediaUrl]);

  const onPickFile = (e) => {
    const f = e.target.files?.[0] || null;
    if (f) {
      // Validate file type
      const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/quicktime", "video/x-msvideo", "video/webm"];
      if (!allowed.includes(f.type)) {
        setErrors((prev) => ({ ...prev, file: "Invalid file type. Allowed: JPG, PNG, WebP, GIF, MP4, MOV, AVI, WebM" }));
        return;
      }
      // Validate file size (25MB)
      if (f.size > 25 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, file: "File too large. Maximum size is 25MB." }));
        return;
      }
      setErrors((prev) => {
        const next = { ...prev };
        delete next.file;
        return next;
      });
    }
    setFile(f);
  };

  const clearFile = () => {
    setFile(null);
    setFileInputKey((k) => k + 1);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.file;
      return next;
    });
  };

  const validate = () => {
    const errs = {};

    if (title.trim().length > 160) {
      errs.title = "Title must be at most 160 characters";
    }

    // Media file is required on create (no existing URL)
    if (!isEditing && !file && !mediaUrl) {
      errs.file = "Please upload an image or video";
    }

    // Subtitle max length
    if (subtitle && subtitle.length > 400) {
      errs.subtitle = "Subtitle must be at most 400 characters";
    }

    // Page is required
    if (!page.trim()) {
      errs.page = "Page is required (e.g. home, about)";
    }

    // Sort order should be a valid number
    if (sortOrder !== "" && isNaN(Number(sortOrder))) {
      errs.sortOrder = "Must be a valid number";
    }

    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const form = new FormData();
    if (file) form.append("file", file);
    form.append("title", title.trim());
    form.append("subtitle", subtitle);
    form.append("page", page.trim());
    form.append("slug", slugifyForSave(slug));
    form.append("ctaText", ctaText);
    form.append("ctaUrl", ctaUrl);
    form.append("mediaAlt", mediaAlt);
    form.append("sortOrder", String(sortOrder || 0));
    form.append("priority", String(priority));
    form.append("isActive", String(isActive));
    // Allow manual URL (useful when editing without re-upload)
    if (!file && mediaUrl) form.append("mediaUrl", mediaUrl);

    await onSubmit(form);
  };

  const inputClass = (field) =>
    `mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:border-black/20 ${
      errors[field] ? "border-red-400" : "border-black/10"
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Title */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-foreground">
            Title
          </label>
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errors.title) setErrors((prev) => { const n = { ...prev }; delete n.title; return n; });
            }}
            className={inputClass("title")}
            placeholder="e.g. Luxury Yacht Experiences in Dubai"
          />
          {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
        </div>

        {/* Subtitle */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-foreground">Subtitle</label>
          <textarea
            value={subtitle}
            onChange={(e) => {
              setSubtitle(e.target.value);
              if (errors.subtitle) setErrors((prev) => { const n = { ...prev }; delete n.subtitle; return n; });
            }}
            rows={3}
            className={inputClass("subtitle")}
            placeholder="Short supporting copy for the hero banner"
          />
          {errors.subtitle && <p className="mt-1 text-xs text-red-500">{errors.subtitle}</p>}
        </div>

        {/* Page */}
        <div>
          <label className="block text-sm font-medium text-foreground">
            Page <span className="text-red-500">*</span>
          </label>
          <input
            value={page}
            onChange={(e) => {
              setPage(e.target.value);
              if (errors.page) setErrors((prev) => { const n = { ...prev }; delete n.page; return n; });
            }}
            className={inputClass("page")}
            placeholder="home"
          />
          {errors.page && <p className="mt-1 text-xs text-red-500">{errors.page}</p>}
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-medium text-foreground">Slug (optional)</label>
          <input
            value={slug}
            onChange={(e) => setSlug(slugifyForInput(e.target.value))}
            className={inputClass("slug")}
            placeholder="home-hero"
          />
        </div>

        {/* CTA Text */}
        <div>
          <label className="block text-sm font-medium text-foreground">CTA Text</label>
          <input
            value={ctaText}
            onChange={(e) => setCtaText(e.target.value)}
            className={inputClass("ctaText")}
            placeholder="Book Now"
          />
        </div>

        {/* CTA URL */}
        <div>
          <label className="block text-sm font-medium text-foreground">CTA URL</label>
          <input
            value={ctaUrl}
            onChange={(e) => setCtaUrl(e.target.value)}
            className={inputClass("ctaUrl")}
            placeholder="/yachts"
          />
        </div>

        {/* Alt text */}
        <div>
          <label className="block text-sm font-medium text-foreground">Alt text</label>
          <input
            value={mediaAlt}
            onChange={(e) => setMediaAlt(e.target.value)}
            className={inputClass("mediaAlt")}
            placeholder="e.g. Yacht cruising at sunset"
          />
        </div>

        {/* Sort order */}
        <div>
          <label className="block text-sm font-medium text-foreground">Sort order</label>
          <input
            value={sortOrder}
            onChange={(e) => {
              setSortOrder(e.target.value);
              if (errors.sortOrder) setErrors((prev) => { const n = { ...prev }; delete n.sortOrder; return n; });
            }}
            inputMode="numeric"
            className={inputClass("sortOrder")}
            placeholder="0"
          />
          {errors.sortOrder && <p className="mt-1 text-xs text-red-500">{errors.sortOrder}</p>}
        </div>
      </div>

      {/* Checkboxes */}
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" checked={priority} onChange={(e) => setPriority(e.target.checked)} className="h-4 w-4" />
          Priority (LCP hero)
        </label>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4" />
          Active
        </label>
      </div>

      {/* File upload section */}
      <div className="rounded-2xl border border-black/10 bg-white p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-start">
          <div className="md:w-2/3">
            <label className="block text-sm font-medium text-foreground">
              Upload image/video {!isEditing && <span className="text-red-500">*</span>}
            </label>
            <div className="mt-2 flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <label
                  className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-foreground hover:bg-[color:var(--color-light-3)]"
                >
                  Choose file
                  <input
                    key={fileInputKey}
                    type="file"
                    accept="image/*,video/*"
                    onChange={onPickFile}
                    className="sr-only"
                  />
                </label>

                {file ? (
                  <>
                    <span className="text-xs text-[color:var(--color-light-1)]">
                      Selected: <span className="font-medium text-foreground">{file.name}</span>{" "}
                      <span className="text-[color:var(--color-light-2)]">
                        ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={clearFile}
                      className="rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-[color:var(--color-red-2)] hover:bg-[color:var(--color-light-3)]"
                    >
                      Remove
                    </button>
                  </>
                ) : (
                  <span className="text-xs text-[color:var(--color-light-1)]">
                    {mediaUrl ? "Using existing media" : "No file selected"}
                  </span>
                )}
              </div>

              <div className="text-xs text-[color:var(--color-light-1)]">
                Allowed: images (JPG/PNG/WebP/GIF) and videos (MP4/MOV/AVI/WebM). Max size: 25MB.
              </div>

              {errors.file && <p className="text-xs text-red-500">{errors.file}</p>}
            </div>

            {isEditing && !file ? (
              <p className="mt-2 text-xs text-[color:var(--color-light-1)]">
                Leave empty to keep the existing media.
              </p>
            ) : null}

            {!file && mediaUrl ? (
              <div className="mt-3">
                <label className="block text-xs font-medium text-[color:var(--color-light-1)]">Existing media URL</label>
                <input
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-xs outline-none focus:border-black/20"
                />
              </div>
            ) : null}
          </div>

          <div className="md:w-1/3">
            <div className="text-sm font-medium text-foreground">Preview</div>
            <div className="mt-2 aspect-[16/9] w-full overflow-hidden rounded-xl border border-black/10 bg-[color:var(--color-light-3)]">
              {preview ? (
                preview.toLowerCase().includes(".mp4") ||
                preview.toLowerCase().includes(".mov") ||
                preview.toLowerCase().includes(".webm") ||
                (file?.type || "").startsWith("video/") ? (
                  <video src={preview} className="h-full w-full object-cover" controls />
                ) : (
                  <img src={preview} alt={mediaAlt || title || "Banner"} className="h-full w-full object-cover" />
                )
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-[color:var(--color-light-1)]">
                  No media selected
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/dashboard/banners"
          className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-foreground hover:bg-[color:var(--color-light-3)]"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {submitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
