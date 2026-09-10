"use client";

import { useState, useEffect, useCallback } from "react";
import { blogsApi } from "@/lib/api/blogsApi";
import { uploadFile } from "@/lib/api/uploadApi";
import RichTextEditor from "@/components/ui/RichTextEditor";
import { notifyError } from "@/components/ui/toast";

const COVER_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const COVER_MAX_SIZE_MB = 5;
const COVER_MAX_SIZE = COVER_MAX_SIZE_MB * 1024 * 1024;

function asString(v, fallback = "") {
  if (v === undefined || v === null) return fallback;
  return String(v);
}

function slugify(title) {
  return String(title || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const LOCALES = [{ value: "en", label: "English" }, { value: "ar", label: "Arabic" }];
const STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

export default function BlogPostForm({ initialPost, submitting, onSubmit, submitLabel = "Save" }) {
  const isEdit = Boolean(initialPost?._id);
  const init = initialPost || {};

  const [title, setTitle] = useState(asString(init.title));
  const [slug, setSlug] = useState(() => {
    const s = asString(init.slug);
    return s || (init.title ? slugify(init.title) : "") || "post";
  });
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [locale, setLocale] = useState(asString(init.locale, "en"));
  const [status, setStatus] = useState(asString(init.status, "draft"));
  const [excerpt, setExcerpt] = useState(asString(init.excerpt));
  const [content, setContent] = useState(asString(init.content));
  const [coverUrl, setCoverUrl] = useState(asString(init.coverImage?.url));
  const [coverAlt, setCoverAlt] = useState(asString(init.coverImage?.alt));
  const [primaryCategoryId, setPrimaryCategoryId] = useState(asString(init.primaryCategoryId?._id || init.primaryCategoryId));
  const [tagIds, setTagIds] = useState(Array.isArray(init.tagIds) ? init.tagIds.map((t) => (t._id || t)) : []);
  const [authorId, setAuthorId] = useState(asString(init.authorId?._id || init.authorId));
  const [featured, setFeatured] = useState(Boolean(init.featured));
  const [metaTitle, setMetaTitle] = useState(asString(init.seo?.metaTitle));
  const [metaDescription, setMetaDescription] = useState(asString(init.seo?.metaDescription));
  const [metaKeywords, setMetaKeywords] = useState(() => {
    const kw = init.seo?.metaKeywords;
    if (Array.isArray(kw) && kw.length > 0) return kw.map((k) => String(k).trim()).filter(Boolean).join(", ");
    if (Array.isArray(kw)) return "";
    if (kw != null && typeof kw === "string") return kw;
    return "";
  });
  const [canonicalUrl, setCanonicalUrl] = useState(asString(init.canonicalSlug || init.seo?.canonicalUrl));
  const [ogImage, setOgImage] = useState(asString(init.seo?.ogImage));
  const [scheduledAt, setScheduledAt] = useState(
    init.scheduledAt ? new Date(init.scheduledAt).toISOString().slice(0, 16) : ""
  );

  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loadingTaxonomy, setLoadingTaxonomy] = useState(true);
  const [errors, setErrors] = useState({});
  const [coverFile, setCoverFile] = useState(null);
  const [coverFileInputKey, setCoverFileInputKey] = useState(0);
  const [saving, setSaving] = useState(false);

  const [coverPreviewUrl, setCoverPreviewUrl] = useState(coverUrl.trim() || "");

  useEffect(() => {
    if (coverFile) {
      const url = URL.createObjectURL(coverFile);
      setCoverPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setCoverPreviewUrl(coverUrl.trim() || "");
  }, [coverFile, coverUrl]);

  const onCoverFileChange = (e) => {
    const f = e.target.files?.[0] || null;
    setErrors((p) => ({ ...p, cover: undefined }));
    if (!f) {
      setCoverFile(null);
      return;
    }
    if (!COVER_ALLOWED_TYPES.includes(f.type)) {
      setErrors((p) => ({ ...p, cover: "Only JPG, PNG, WebP or GIF allowed." }));
      setCoverFile(null);
      setCoverFileInputKey((k) => k + 1);
      return;
    }
    if (f.size > COVER_MAX_SIZE) {
      setErrors((p) => ({ ...p, cover: `Image must be under ${COVER_MAX_SIZE_MB}MB.` }));
      setCoverFile(null);
      setCoverFileInputKey((k) => k + 1);
      return;
    }
    setCoverFile(f);
  };

  const clearCoverFile = () => {
    setCoverFile(null);
    setCoverFileInputKey((k) => k + 1);
    setErrors((p) => ({ ...p, cover: undefined }));
  };

  useEffect(() => {
    let alive = true;
    setLoadingTaxonomy(true);
    Promise.all([
      blogsApi.listCategories({ limit: 200 }).then((r) => r?.data?.data?.items || []),
      blogsApi.listTags({ limit: 200 }).then((r) => r?.data?.data?.items || []),
      blogsApi.getAuthorMe().then((r) => r?.data?.data || null),
    ])
      .then(([cat, tag, author]) => {
        if (!alive) return;
        setCategories(cat);
        setTags(tag);
        if (author?._id) setAuthorId(author._id);
      })
      .catch(() => {})
      .finally(() => {
        if (!alive) return;
        setLoadingTaxonomy(false);
      });
    return () => { alive = false; };
  }, []);

  const handleTitleChange = (value) => {
    setTitle(value);
    setErrors((p) => ({ ...p, title: undefined }));
    if (!slugManuallyEdited) {
      setSlug(slugify(value) || "post");
    }
  };

  const validate = () => {
    const errs = {};
    if (!title.trim()) errs.title = "Title is required";
    if (!slug.trim()) errs.slug = "Slug is required";
    if (slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) errs.slug = "Slug: lowercase letters, numbers, hyphens only";
    if (coverUrl.trim() && !coverAlt.trim()) errs.coverAlt = "Cover image alt text is required when cover image is set";
    if (excerpt.length > 300) errs.excerpt = "Excerpt max 300 characters";
    if (status === "scheduled" && !scheduledAt) errs.scheduledAt = "Scheduled date is required when status is Scheduled";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      let finalCoverUrl = coverUrl;
      if (coverFile) {
        try {
          const up = await uploadFile(coverFile, "blog", "cover");
          finalCoverUrl = up?.url || coverUrl;
        } catch (_) {
          setErrors((prev) => ({ ...prev, cover: "Cover image upload failed" }));
          setSaving(false);
          return;
        }
      }

      const payload = {
        title: title.trim(),
        slug: (slug.trim() || slugify(title) || "post").replace(/^-+|-+$/g, ""),
        locale,
        status,
        excerpt: excerpt.trim().substring(0, 300),
        content: content.trim(),
        coverImage: { url: finalCoverUrl.trim(), alt: coverAlt.trim().substring(0, 120) },
        authorId: authorId || undefined,
        primaryCategoryId: primaryCategoryId || undefined,
        tagIds,
        featured,
        seo: {
          metaTitle: metaTitle.trim() || undefined,
          metaDescription: metaDescription.trim() || undefined,
          metaKeywords: metaKeywords
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean),
          canonicalUrl: canonicalUrl.trim() || undefined,
          ogImage: ogImage.trim() || undefined,
        },
        canonicalSlug: canonicalUrl.trim() || undefined,
        scheduledAt: status === "scheduled" && scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      };

      await onSubmit(payload);
    } finally {
      setSaving(false);
    }
  };

  const inputClass = (field) =>
    `mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:border-black/20 ${
      errors[field] ? "border-red-400" : "border-black/10"
    }`;

  const toggleTag = (id) => {
    setTagIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-foreground">Post</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-foreground">Title *</label>
            <input
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className={inputClass("title")}
              placeholder="Post title"
              maxLength={140}
            />
            {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">Slug *</label>
            <input
              value={slug}
              onChange={(e) => {
                setSlugManuallyEdited(true);
                setSlug(slugify(e.target.value));
              }}
              className={inputClass("slug")}
              placeholder="url-slug"
            />
            <p className="mt-1 text-xs text-[color:var(--color-light-1)]">Unique per locale. Auto-generated from title.</p>
            {errors.slug && <p className="mt-1 text-xs text-red-500">{errors.slug}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">Locale</label>
            <select value={locale} onChange={(e) => setLocale(e.target.value)} className={inputClass("locale")}>
              {LOCALES.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass("status")}>
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          {status === "scheduled" && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground">Scheduled publish date *</label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className={inputClass("scheduledAt")}
              />
              {errors.scheduledAt && <p className="mt-1 text-xs text-red-500">{errors.scheduledAt}</p>}
            </div>
          )}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-foreground">Excerpt (max 300)</label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={2}
              className={inputClass("excerpt")}
              placeholder="Short summary"
              maxLength={300}
            />
            <div className="mt-1 flex justify-between text-xs text-[color:var(--color-light-1)]">
              <span>{errors.excerpt ? <span className="text-red-500">{errors.excerpt}</span> : null}</span>
              <span>{excerpt.length}/300</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-foreground">Cover image</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-foreground">Cover image URL</label>
            <input
              type="url"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              className={inputClass("coverUrl")}
              placeholder="https://..."
            />
            <p className="mt-1 text-xs text-[color:var(--color-light-1)]">Or upload file below (JPG, PNG, WebP, GIF, max {COVER_MAX_SIZE_MB}MB)</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <label className="cursor-pointer rounded-xl border border-black/20 bg-black/5 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-black/10 focus-within:ring-2 focus-within:ring-black/20">
                <span>Choose image</span>
                <input
                  key={coverFileInputKey}
                  type="file"
                  accept={COVER_ALLOWED_TYPES.join(",")}
                  onChange={onCoverFileChange}
                  className="sr-only"
                />
              </label>
              {coverFile && (
                <>
                  <span className="text-sm text-[color:var(--color-light-1)]">
                    {coverFile.name} ({(coverFile.size / 1024).toFixed(1)} KB)
                  </span>
                  <button
                    type="button"
                    onClick={clearCoverFile}
                    className="text-sm font-medium text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </>
              )}
            </div>
            {errors.cover && <p className="mt-1 text-xs text-red-500">{errors.cover}</p>}
            {coverPreviewUrl ? (
              <div className="mt-3 rounded-xl border border-black/10 overflow-hidden bg-black/5 aspect-video max-h-48">
                <img
                  src={coverPreviewUrl}
                  alt="Cover preview"
                  className="h-full w-full object-contain"
                />
              </div>
            ) : (
              <div className="mt-3 flex aspect-video max-h-48 items-center justify-center rounded-xl border border-dashed border-black/20 bg-black/[0.02]">
                <span className="text-sm text-[color:var(--color-light-1)]">No cover image</span>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">Cover image alt text * (if cover set)</label>
            <input
              value={coverAlt}
              onChange={(e) => setCoverAlt(e.target.value)}
              className={inputClass("coverAlt")}
              placeholder="Describe the image for accessibility"
              maxLength={120}
            />
            {errors.coverAlt && <p className="mt-1 text-xs text-red-500">{errors.coverAlt}</p>}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-foreground">Content</h2>
        <label className="block text-sm font-medium text-foreground">Body *</label>
        <RichTextEditor
          value={content}
          onChange={setContent}
          placeholder="Write your post content here. Use the toolbar for formatting, links, and images."
          error={errors.content}
          onUploadImage={async (file) => {
            try {
              const res = await uploadFile(file, "blog", "content");
              let url = res?.url ?? null;
              if (url && typeof url === "string" && url.startsWith("/")) {
                const base = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000").replace(/\/+$/, "");
                url = base + url;
              }
              return url;
            } catch (e) {
              notifyError(e?.message || "Image upload failed");
              return null;
            }
          }}
          onUploadError={notifyError}
        />
        {errors.content && <p className="mt-1 text-xs text-red-500">{errors.content}</p>}
        <p className="mt-1 text-xs text-[color:var(--color-light-1)]">
          Use the toolbar to format text, add links and images. Click an image to show size, alignment (L, C, R), and <strong>Alt text</strong>. Fill alt text for every image (required for publish).
        </p>
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-foreground">Taxonomy</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-foreground">Category</label>
            <select
              value={primaryCategoryId}
              onChange={(e) => setPrimaryCategoryId(e.target.value)}
              className={inputClass("primaryCategoryId")}
              disabled={loadingTaxonomy}
            >
              <option value="">None</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-foreground">Tags</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map((t) => (
                <button
                  key={t._id}
                  type="button"
                  onClick={() => toggleTag(t._id)}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    tagIds.includes(t._id) ? "bg-black text-white" : "bg-black/10 text-foreground"
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="featured"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="h-4 w-4 rounded border-black/20"
            />
            <label htmlFor="featured" className="text-sm font-medium text-foreground">Featured</label>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-foreground">SEO</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-foreground">Meta title</label>
            <input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} className={inputClass("metaTitle")} maxLength={70} />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">Canonical URL</label>
            <input type="url" value={canonicalUrl} onChange={(e) => setCanonicalUrl(e.target.value)} className={inputClass("canonicalUrl")} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-foreground">Meta description</label>
            <textarea value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} rows={2} className={inputClass("metaDescription")} maxLength={160} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-foreground">Meta keywords</label>
            <input
              type="text"
              value={metaKeywords}
              onChange={(e) => setMetaKeywords(e.target.value)}
              className={inputClass("metaKeywords")}
              placeholder="e.g. desert safari, Dubai, tourism"
            />
            <p className="mt-0.5 text-xs text-[color:var(--color-light-1)]">Comma-separated keywords for SEO</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">Open Graph image URL</label>
            <input type="url" value={ogImage} onChange={(e) => setOgImage(e.target.value)} className={inputClass("ogImage")} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={saving || submitting || loadingTaxonomy}
          className="rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-black/80 disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 min-w-[140px]"
        >
          {(saving || submitting) && (
            <svg className="h-4 w-4 animate-spin shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" className="opacity-25" />
              <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
            </svg>
          )}
          {saving || submitting ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
