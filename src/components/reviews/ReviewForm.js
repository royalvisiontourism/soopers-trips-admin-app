"use client";

import { useState, useEffect } from "react";
import { productsApi } from "@/lib/api/productsApi";

function asString(v, fallback = "") {
  if (v === undefined || v === null) return fallback;
  return String(v);
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ReviewForm({ initialValues, submitting, onSubmit, submitLabel = "Save" }) {
  const isEditing = Boolean(initialValues?._id);
  const initial = initialValues || {};

  const [product_id, setProductId] = useState(asString(initial.product_id?._id || initial.product_id));
  const [full_name, setFullName] = useState(asString(initial.full_name));
  const [email, setEmail] = useState(asString(initial.email));
  const [rating, setRating] = useState(
    initial.rating != null ? String(initial.rating) : "5"
  );
  const [review_text, setReviewText] = useState(asString(initial.review_text));
  const [is_verified, setIsVerified] = useState(Boolean(initial.is_verified));

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    let alive = true;
    setProductsLoading(true);
    productsApi
      .list({ page: 1, limit: 500, isActive: true })
      .then((res) => {
        if (!alive) return;
        const data = res?.data?.data;
        setProducts(Array.isArray(data?.items) ? data.items : []);
      })
      .catch(() => {
        if (!alive) return;
        setProducts([]);
      })
      .finally(() => {
        if (!alive) return;
        setProductsLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const clearError = (field) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validate = () => {
    const errs = {};
    if (!product_id?.trim()) {
      errs.product_id = "Product is required";
    }
    if (!email?.trim()) {
      errs.email = "Email is required";
    } else if (!EMAIL_REGEX.test(email.trim())) {
      errs.email = "Please provide a valid email address";
    }
    const r = Number(rating);
    if (Number.isNaN(r) || r < 1 || r > 5) {
      errs.rating = "Rating must be between 1 and 5";
    }
    if (review_text.length > 2000) {
      errs.review_text = "Review text must be at most 2000 characters";
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const payload = {
      product_id: product_id.trim(),
      full_name: full_name.trim(),
      email: email.trim().toLowerCase(),
      rating: Math.min(5, Math.max(1, Number(rating))) || 1,
      review_text: review_text.trim(),
    };
    if (isEditing) {
      payload.is_verified = is_verified;
    }
    await onSubmit(payload);
  };

  const inputClass = (field) =>
    `mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:border-black/20 ${
      errors[field] ? "border-red-400" : "border-black/10"
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-foreground">Review Details</h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Product */}
          <div>
            <label className="block text-sm font-medium text-foreground">
              Product <span className="text-red-500">*</span>
            </label>
            <select
              value={product_id}
              onChange={(e) => {
                setProductId(e.target.value);
                clearError("product_id");
              }}
              className={inputClass("product_id")}
              disabled={productsLoading}
            >
              <option value="">Select product</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.title || p.name || p._id}
                </option>
              ))}
            </select>
            {productsLoading && (
              <p className="mt-1 text-xs text-[color:var(--color-light-1)]">Loading products...</p>
            )}
            {errors.product_id && (
              <p className="mt-1 text-xs text-red-500">{errors.product_id}</p>
            )}
          </div>

          {/* Full name */}
          <div>
            <label className="block text-sm font-medium text-foreground">Full name</label>
            <input
              value={full_name}
              onChange={(e) => {
                setFullName(e.target.value);
                clearError("full_name");
              }}
              className={inputClass("full_name")}
              placeholder="Reviewer name"
              maxLength={200}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-foreground">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearError("email");
              }}
              className={inputClass("email")}
              placeholder="reviewer@example.com"
            />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-foreground">
              Rating <span className="text-red-500">*</span>
            </label>
            <select
              value={rating}
              onChange={(e) => {
                setRating(e.target.value);
                clearError("rating");
              }}
              className={inputClass("rating")}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} star{n !== 1 ? "s" : ""}
                </option>
              ))}
            </select>
            {errors.rating && <p className="mt-1 text-xs text-red-500">{errors.rating}</p>}
          </div>

          {/* Verified (edit only) */}
          {isEditing && (
            <div className="md:col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="is_verified"
                checked={is_verified}
                onChange={(e) => setIsVerified(e.target.checked)}
                className="h-4 w-4 rounded border-black/20"
              />
              <label htmlFor="is_verified" className="text-sm font-medium text-foreground">
                Verified (show on site)
              </label>
            </div>
          )}

          {/* Review text */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-foreground">Review text</label>
            <textarea
              value={review_text}
              onChange={(e) => {
                setReviewText(e.target.value);
                clearError("review_text");
              }}
              rows={4}
              className={inputClass("review_text")}
              placeholder="Review content"
              maxLength={2000}
            />
            <div className="mt-1 flex justify-between">
              {errors.review_text ? (
                <p className="text-xs text-red-500">{errors.review_text}</p>
              ) : (
                <span />
              )}
              <span className="text-xs text-[color:var(--color-light-1)]">
                {review_text.length}/2000
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={submitting || productsLoading}
          className="rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-black/80 disabled:opacity-60"
        >
          {submitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
