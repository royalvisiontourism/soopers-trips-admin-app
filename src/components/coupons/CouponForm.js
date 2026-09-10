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
  if (["false", "0", "no", "n", "off"].includes(s)) return false;
  return fallback;
}

function toDateOnly(v) {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

export default function CouponForm({ initialValues, submitting, onSubmit, submitLabel = "Save" }) {
  const isEditing = Boolean(initialValues?._id);
  const initial = initialValues || {};

  const [code, setCode] = useState(asString(initial.code).toUpperCase());
  const [discountType, setDiscountType] = useState(asString(initial.discountType || "PERCENTAGE"));
  const [discountValue, setDiscountValue] = useState(asString(initial.discountValue ?? ""));
  const [validFrom, setValidFrom] = useState(toDateOnly(initial.validFrom));
  const [validUntil, setValidUntil] = useState(toDateOnly(initial.validUntil));
  const [minPurchaseAmount, setMinPurchaseAmount] = useState(asString(initial.minPurchaseAmount ?? ""));
  const [usageLimit, setUsageLimit] = useState(asString(initial.usageLimit ?? ""));
  const [isActive, setIsActive] = useState(asBool(initial.isActive, true));

  const [errors, setErrors] = useState({});

  const clearError = (field) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validate = () => {
    const errs = {};

    if (!code.trim()) {
      errs.code = "Coupon code is required";
    } else if (code.trim().length < 2) {
      errs.code = "Code must be at least 2 characters";
    } else if (code.trim().length > 50) {
      errs.code = "Code must be at most 50 characters";
    }

    if (!discountType) {
      errs.discountType = "Discount type is required";
    }

    const dv = Number(discountValue);
    if (discountValue === "" || isNaN(dv)) {
      errs.discountValue = "Discount value is required";
    } else if (dv < 0) {
      errs.discountValue = "Value must be 0 or more";
    } else if (discountType === "PERCENTAGE" && dv > 100) {
      errs.discountValue = "Percentage cannot exceed 100%";
    }

    if (!validFrom) {
      errs.validFrom = "Start date is required";
    }
    if (!validUntil) {
      errs.validUntil = "End date is required";
    }
    if (validFrom && validUntil && new Date(validUntil) <= new Date(validFrom)) {
      errs.validUntil = "End date must be after start date";
    }

    if (minPurchaseAmount !== "" && (isNaN(Number(minPurchaseAmount)) || Number(minPurchaseAmount) < 0)) {
      errs.minPurchaseAmount = "Must be a valid positive number";
    }

    if (usageLimit !== "" && (isNaN(Number(usageLimit)) || Number(usageLimit) < 1)) {
      errs.usageLimit = "Must be a whole number >= 1";
    }

    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const data = {
      code: code.trim().toUpperCase(),
      discountType,
      discountValue: Number(discountValue),
      validFrom: validFrom, // YYYY-MM-DD
      validUntil: validUntil, // YYYY-MM-DD
      minPurchaseAmount: minPurchaseAmount !== "" ? Number(minPurchaseAmount) : 0,
      usageLimit: usageLimit !== "" ? Number(usageLimit) : null,
      isActive,
      applicableProducts: [], // applicable to all products
    };

    await onSubmit(data);
  };

  const inputClass = (field) =>
    `mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:border-black/20 ${
      errors[field] ? "border-red-400" : "border-black/10"
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-foreground">Coupon Details</h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Code */}
          <div>
            <label className="block text-sm font-medium text-foreground">
              Coupon Code <span className="text-red-500">*</span>
            </label>
            <input
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                clearError("code");
              }}
              className={inputClass("code")}
              placeholder="e.g. SUMMER25"
              maxLength={50}
            />
            {errors.code && <p className="mt-1 text-xs text-red-500">{errors.code}</p>}
          </div>

          {/* Discount Type */}
          <div>
            <label className="block text-sm font-medium text-foreground">
              Discount Type <span className="text-red-500">*</span>
            </label>
            <select
              value={discountType}
              onChange={(e) => {
                setDiscountType(e.target.value);
                clearError("discountType");
              }}
              className={inputClass("discountType")}
            >
              <option value="PERCENTAGE">Percentage (%)</option>
              <option value="FIXED">Fixed Amount (AED)</option>
            </select>
            {errors.discountType && <p className="mt-1 text-xs text-red-500">{errors.discountType}</p>}
          </div>

          {/* Discount Value */}
          <div>
            <label className="block text-sm font-medium text-foreground">
              Discount Value <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                value={discountValue}
                onChange={(e) => {
                  setDiscountValue(e.target.value);
                  clearError("discountValue");
                }}
                inputMode="decimal"
                className={inputClass("discountValue")}
                placeholder={discountType === "PERCENTAGE" ? "e.g. 25" : "e.g. 100"}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[color:var(--color-light-1)]">
                {discountType === "PERCENTAGE" ? "%" : "AED"}
              </span>
            </div>
            {errors.discountValue && <p className="mt-1 text-xs text-red-500">{errors.discountValue}</p>}
          </div>

          {/* Min Purchase */}
          <div>
            <label className="block text-sm font-medium text-foreground">Min Purchase Amount</label>
            <input
              value={minPurchaseAmount}
              onChange={(e) => {
                setMinPurchaseAmount(e.target.value);
                clearError("minPurchaseAmount");
              }}
              inputMode="decimal"
              className={inputClass("minPurchaseAmount")}
              placeholder="0 (no minimum)"
            />
            {errors.minPurchaseAmount && <p className="mt-1 text-xs text-red-500">{errors.minPurchaseAmount}</p>}
          </div>

          {/* Valid From */}
          <div>
            <label className="block text-sm font-medium text-foreground">
              Valid From <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={validFrom}
              onChange={(e) => {
                setValidFrom(e.target.value);
                clearError("validFrom");
              }}
              className={inputClass("validFrom")}
            />
            {errors.validFrom && <p className="mt-1 text-xs text-red-500">{errors.validFrom}</p>}
          </div>

          {/* Valid Until */}
          <div>
            <label className="block text-sm font-medium text-foreground">
              Valid Until <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={validUntil}
              onChange={(e) => {
                setValidUntil(e.target.value);
                clearError("validUntil");
              }}
              className={inputClass("validUntil")}
            />
            {errors.validUntil && <p className="mt-1 text-xs text-red-500">{errors.validUntil}</p>}
          </div>

          {/* Usage Limit */}
          <div>
            <label className="block text-sm font-medium text-foreground">Usage Limit</label>
            <input
              value={usageLimit}
              onChange={(e) => {
                setUsageLimit(e.target.value);
                clearError("usageLimit");
              }}
              inputMode="numeric"
              className={inputClass("usageLimit")}
              placeholder="Unlimited"
            />
            <p className="mt-1 text-xs text-[color:var(--color-light-1)]">Leave empty for unlimited usage.</p>
            {errors.usageLimit && <p className="mt-1 text-xs text-red-500">{errors.usageLimit}</p>}
          </div>

          {/* Used Count (display only in edit mode) */}
          {isEditing && (
            <div>
              <label className="block text-sm font-medium text-foreground">Times Used</label>
              <div className="mt-1 flex h-[38px] items-center rounded-xl border border-black/10 bg-[color:var(--color-light-3)] px-3 text-sm text-foreground">
                {initial.usedCount ?? 0}
              </div>
            </div>
          )}
        </div>

        {/* Active toggle */}
        <div className="mt-4 flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4" />
            Active
          </label>
        </div>

        {/* Applicable Products note */}
        <div className="mt-4 rounded-xl border border-black/5 bg-[color:var(--color-light-3)] p-3">
          <p className="text-xs text-[color:var(--color-light-1)]">
            This coupon applies to <strong className="text-foreground">all products</strong>. Product-specific coupons will be available in a future update.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/dashboard/coupons"
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
