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
  return false;
}

function slugifyBase(input) {
  return String(input ?? "")
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");
}
function slugifyForInput(input) {
  return slugifyBase(input).replace(/^-+/, "");
}
function slugifyForSave(input) {
  return slugifyBase(input).replace(/^-+/, "").replace(/-+$/, "");
}

export default function DestinationForm({ initialValues, submitting, onSubmit, submitLabel = "Save" }) {
  const isEditing = Boolean(initialValues?._id);
  const initial = initialValues || {};

  const [name, setName] = useState(asString(initial.name));
  const [slug, setSlug] = useState(slugifyForSave(initial.slug || ""));
  // Keep auto-updating slug from name until the user manually edits the slug field.
  // On edit screens, default to "manual" to avoid changing existing URLs unexpectedly.
  const [slugManual, setSlugManual] = useState(Boolean(initial.slug) || isEditing);
  const [country, setCountry] = useState(asString(initial.country));
  const [region, setRegion] = useState(asString(initial.region));
  const [description, setDescription] = useState(asString(initial.description));
  const [sortOrder, setSortOrder] = useState(asString(initial.sortOrder ?? "0"));
  const [isPopular, setIsPopular] = useState(asBool(initial.isPopular, false));
  const [isActive, setIsActive] = useState(asBool(initial.isActive, true));

  const [file, setFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(asString(initial.coverImage || ""));
  const [fileInputKey, setFileInputKey] = useState(0);
  const [errors, setErrors] = useState({});

  const preview = useMemo(() => {
    if (file) return URL.createObjectURL(file);
    return imageUrl || "";
  }, [file, imageUrl]);

  const clearError = (field) => setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });

  const onPickFile = (e) => {
    const f = e.target.files?.[0] || null;
    if (f) {
      const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      if (!allowed.includes(f.type)) {
        setErrors((prev) => ({ ...prev, file: "Only image files allowed (JPG, PNG, WebP, GIF)" }));
        return;
      }
      if (f.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, file: "Image must be smaller than 5MB" }));
        return;
      }
      clearError("file");
    }
    setFile(f);
  };

  const clearFile = () => { setFile(null); setFileInputKey((k) => k + 1); clearError("file"); };

  const handleNameChange = (value) => {
    setName(value);
    clearError("name");
    if (!slugManual) setSlug(slugifyForInput(value));
  };

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = "Destination name is required";
    else if (name.trim().length < 2) errs.name = "Name must be at least 2 characters";
    else if (name.trim().length > 160) errs.name = "Name must be at most 160 characters";
    if (country.length > 100) errs.country = "Country must be at most 100 characters";
    if (region.length > 100) errs.region = "Region must be at most 100 characters";
    if (description.length > 1000) errs.description = "Description must be at most 1000 characters";
    if (sortOrder !== "" && isNaN(Number(sortOrder))) errs.sortOrder = "Must be a valid number";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const form = new FormData();
    if (file) form.append("file", file);
    form.append("name", name.trim());
    form.append("slug", slugifyForSave(slug) || slugifyForSave(name));
    form.append("country", country.trim());
    form.append("region", region.trim());
    form.append("description", description);
    form.append("sortOrder", String(sortOrder || 0));
    form.append("isPopular", String(isPopular));
    form.append("isActive", String(isActive));
    if (!file && imageUrl) form.append("coverImage", imageUrl);

    await onSubmit(form);
  };

  const inputClass = (field) =>
    `mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:border-black/20 ${errors[field] ? "border-red-400" : "border-black/10"}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-foreground">Destination Details</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-foreground">Name <span className="text-red-500">*</span></label>
            <input value={name} onChange={(e) => handleNameChange(e.target.value)} className={inputClass("name")} placeholder="e.g. Dubai Marina" maxLength={160} />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-foreground">Slug</label>
            <input
              value={slug}
              onChange={(e) => {
                setSlugManual(true);
                setSlug(slugifyForInput(e.target.value));
              }}
              className={inputClass("slug")}
              placeholder="dubai-marina"
            />
            <p className="mt-1 text-xs text-[color:var(--color-light-1)]">Auto-generated from name.</p>
          </div>

          {/* Country */}
          <div>
            <label className="block text-sm font-medium text-foreground">Country</label>
            <input value={country} onChange={(e) => { setCountry(e.target.value); clearError("country"); }} className={inputClass("country")} placeholder="e.g. UAE" maxLength={100} />
            {errors.country && <p className="mt-1 text-xs text-red-500">{errors.country}</p>}
          </div>

          {/* Region */}
          <div>
            <label className="block text-sm font-medium text-foreground">Region</label>
            <input value={region} onChange={(e) => { setRegion(e.target.value); clearError("region"); }} className={inputClass("region")} placeholder="e.g. Middle East" maxLength={100} />
            {errors.region && <p className="mt-1 text-xs text-red-500">{errors.region}</p>}
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-foreground">Description</label>
            <textarea value={description} onChange={(e) => { setDescription(e.target.value); clearError("description"); }} rows={3} className={inputClass("description")} placeholder="Brief description of this destination" maxLength={1000} />
            <div className="mt-1 flex justify-between">
              {errors.description ? <p className="text-xs text-red-500">{errors.description}</p> : <span />}
              <span className="text-xs text-[color:var(--color-light-1)]">{description.length}/1000</span>
            </div>
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-sm font-medium text-foreground">Sort Order</label>
            <input value={sortOrder} onChange={(e) => { setSortOrder(e.target.value); clearError("sortOrder"); }} inputMode="numeric" className={inputClass("sortOrder")} placeholder="0" />
            {errors.sortOrder && <p className="mt-1 text-xs text-red-500">{errors.sortOrder}</p>}
          </div>

          {/* Checkboxes */}
          <div className="flex items-end gap-6 pb-1">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4" />
              Active
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" checked={isPopular} onChange={(e) => setIsPopular(e.target.checked)} className="h-4 w-4" />
              Popular
            </label>
          </div>
        </div>
      </div>

      {/* Cover image */}
      <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-foreground">Cover Image</h2>
        <div className="flex flex-col gap-4 md:flex-row md:items-start">
          <div className="md:w-2/3">
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-foreground hover:bg-[color:var(--color-light-3)]">
                Choose image
                <input key={fileInputKey} type="file" accept="image/*" onChange={onPickFile} className="sr-only" />
              </label>
              {file ? (
                <>
                  <span className="text-xs text-[color:var(--color-light-1)]">
                    Selected: <span className="font-medium text-foreground">{file.name}</span>{" "}
                    <span className="text-[color:var(--color-light-2)]">({(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
                  </span>
                  <button type="button" onClick={clearFile} className="rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-[color:var(--color-red-2)] hover:bg-[color:var(--color-light-3)]">Remove</button>
                </>
              ) : (
                <span className="text-xs text-[color:var(--color-light-1)]">{imageUrl ? "Using existing image" : "No image selected (optional)"}</span>
              )}
            </div>
            <p className="mt-2 text-xs text-[color:var(--color-light-1)]">Allowed: JPG, PNG, WebP, GIF. Max: 5MB.</p>
            {errors.file && <p className="mt-1 text-xs text-red-500">{errors.file}</p>}
            {!file && imageUrl ? (
              <div className="mt-3">
                <label className="block text-xs font-medium text-[color:var(--color-light-1)]">Existing image URL</label>
                <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-xs outline-none focus:border-black/20" />
              </div>
            ) : null}
          </div>
          <div className="md:w-1/3">
            <div className="text-sm font-medium text-foreground">Preview</div>
            <div className="mt-2 aspect-[16/10] w-full max-w-[240px] overflow-hidden rounded-xl border border-black/10 bg-[color:var(--color-light-3)]">
              {preview ? (
                <img src={preview} alt={name || "Destination"} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-[color:var(--color-light-1)]">No image</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-3">
        <Link href="/dashboard/destinations" className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-foreground hover:bg-[color:var(--color-light-3)]">Cancel</Link>
        <button type="submit" disabled={submitting} className="rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white disabled:opacity-60">
          {submitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
