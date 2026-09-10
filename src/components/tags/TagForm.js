"use client";

import { useState } from "react";
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

function slugifyForInput(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

function slugifyForSave(text) {
  return slugifyForInput(text).replace(/^-+|-+$/g, "");
}

export default function TagForm({ initialValues, submitting, onSubmit, submitLabel = "Save" }) {
  const isEditing = Boolean(initialValues?._id);
  const initial = initialValues || {};

  const [name, setName] = useState(asString(initial.name));
  const [slug, setSlug] = useState(asString(initial.slug));
  const [description, setDescription] = useState(asString(initial.description));
  const [sortOrder, setSortOrder] = useState(asString(initial.sortOrder ?? "0"));
  const [isActive, setIsActive] = useState(asBool(initial.isActive, true));
  const [slugManual, setSlugManual] = useState(isEditing);
  const [errors, setErrors] = useState({});

  const clearError = (field) => setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });

  const onNameChange = (val) => {
    setName(val);
    clearError("name");
    if (!slugManual) {
      setSlug(slugifyForInput(val));
    }
  };

  const onSlugChange = (val) => {
    setSlugManual(true);
    setSlug(slugifyForInput(val));
    clearError("slug");
  };

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = "Tag name is required";
    else if (name.trim().length < 2) errs.name = "Name must be at least 2 characters";
    else if (name.trim().length > 100) errs.name = "Name must be at most 100 characters";

    if (description.length > 300) errs.description = "Description must be at most 300 characters";
    if (sortOrder !== "" && isNaN(Number(sortOrder))) errs.sortOrder = "Must be a valid number";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const data = {
      name: name.trim(),
      slug: slugifyForSave(slug || name),
      description: description.trim(),
      sortOrder: Number(sortOrder || 0),
      isActive,
    };

    await onSubmit(data);
  };

  const inputClass = (field) =>
    `mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:border-black/20 ${errors[field] ? "border-red-400" : "border-black/10"}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-foreground">Tag Details</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-foreground">Name <span className="text-red-500">*</span></label>
            <input value={name} onChange={(e) => onNameChange(e.target.value)} className={inputClass("name")} placeholder="e.g. Family Friendly" maxLength={100} />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-foreground">Slug</label>
            <input value={slug} onChange={(e) => onSlugChange(e.target.value)} className={inputClass("slug")} placeholder="auto-generated-from-name" />
            <p className="mt-1 text-xs text-[color:var(--color-light-1)]">Auto-generated from name. Lowercase with hyphens.</p>
            {errors.slug && <p className="mt-1 text-xs text-red-500">{errors.slug}</p>}
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-foreground">Description</label>
            <textarea value={description} onChange={(e) => { setDescription(e.target.value); clearError("description"); }} rows={3} className={inputClass("description")} placeholder="Brief description for this tag" maxLength={300} />
            <div className="mt-1 flex justify-between">
              {errors.description ? <p className="text-xs text-red-500">{errors.description}</p> : <span />}
              <span className="text-xs text-[color:var(--color-light-1)]">{description.length}/300</span>
            </div>
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-sm font-medium text-foreground">Sort Order</label>
            <input value={sortOrder} onChange={(e) => { setSortOrder(e.target.value); clearError("sortOrder"); }} inputMode="numeric" className={inputClass("sortOrder")} placeholder="0" />
            {errors.sortOrder && <p className="mt-1 text-xs text-red-500">{errors.sortOrder}</p>}
          </div>

          {/* Active */}
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4" />
              Active
            </label>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-3">
        <Link href="/dashboard/tags" className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-foreground hover:bg-[color:var(--color-light-3)]">Cancel</Link>
        <button type="submit" disabled={submitting} className="rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white disabled:opacity-60">
          {submitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
