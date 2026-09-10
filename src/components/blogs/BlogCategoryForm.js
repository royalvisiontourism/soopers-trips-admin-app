"use client";

import { useState } from "react";

function asString(v, fallback = "") {
  if (v === undefined || v === null) return fallback;
  return String(v);
}

// Same as CategoryForm/DestinationForm: space & underscore → hyphen, only lowercase a-z 0-9 and hyphen
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

export default function BlogCategoryForm({ initialCategory, submitting, onSubmit, submitLabel = "Save" }) {
  const isEdit = Boolean(initialCategory?._id);
  const init = initialCategory || {};

  const [name, setName] = useState(asString(init.name));
  const [slug, setSlug] = useState(slugifyForSave(init.slug || ""));
  const [description, setDescription] = useState(asString(init.description));
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [errors, setErrors] = useState({});

  const handleNameChange = (value) => {
    setName(value);
    setErrors((p) => ({ ...p, name: undefined }));
    if (!slugManuallyEdited) {
      setSlug(slugifyForInput(value));
    }
  };

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = "Category name is required";
    if (name.trim().length > 120) errs.name = "Name must be at most 120 characters";
    if (description.length > 500) errs.description = "Description must be at most 500 characters";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = {
      name: name.trim(),
      slug: slugifyForSave(slug) || slugifyForSave(name) || undefined,
      description: description.trim() || undefined,
    };
    onSubmit(payload);
  };

  const inputClass = (field) =>
    `mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:border-black/20 ${
      errors[field] ? "border-red-400" : "border-black/10"
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-foreground">Category</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-foreground">Name *</label>
            <input
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className={inputClass("name")}
              placeholder="e.g. Travel Tips"
              maxLength={120}
            />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">Slug</label>
            <input
              value={slug}
              onChange={(e) => {
                setSlugManuallyEdited(true);
                setSlug(slugifyForInput(e.target.value));
                setErrors((p) => ({ ...p, slug: undefined }));
              }}
              className={inputClass("slug")}
              placeholder="travel-tips"
            />
            <p className="mt-1 text-xs text-[color:var(--color-light-1)]">Spaces become hyphens; only lowercase letters, numbers, and hyphens. Must be unique.</p>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-foreground">Description</label>
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setErrors((p) => ({ ...p, description: undefined }));
              }}
              rows={3}
              className={inputClass("description")}
              placeholder="Optional description"
              maxLength={500}
            />
            <div className="mt-1 flex justify-between text-xs text-[color:var(--color-light-1)]">
              <span>{errors.description ? <span className="text-red-500">{errors.description}</span> : null}</span>
              <span>{description.length}/500</span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-black/80 disabled:opacity-60"
        >
          {submitting ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
