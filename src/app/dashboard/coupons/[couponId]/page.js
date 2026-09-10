"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import CouponForm from "@/components/coupons/CouponForm";
import { couponsApi } from "@/lib/api/couponsApi";
import { notifyError, notifySuccess } from "@/components/ui/toast";

export default function EditCouponPage() {
  const router = useRouter();
  const params = useParams();
  const couponId = params?.couponId ? String(params.couponId) : "";

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [coupon, setCoupon] = useState(null);

  useEffect(() => {
    let alive = true;
    if (!couponId) return;
    setLoading(true);
    couponsApi
      .getById(couponId)
      .then((res) => {
        if (!alive) return;
        setCoupon(res?.data?.data || null);
      })
      .catch((e) => {
        if (!alive) return;
        notifyError(e);
        setCoupon(null);
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [couponId]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const res = await couponsApi.update(couponId, data);
      notifySuccess(res?.data?.message || "Coupon updated");
      router.replace("/dashboard/coupons");
    } catch (e) {
      notifyError(e);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-[color:var(--color-light-1)]">
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
          <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
        </svg>
        Loading coupon...
      </div>
    );
  }

  if (!coupon) {
    return (
      <div className="space-y-3">
        <div className="text-sm text-[color:var(--color-light-1)]">Coupon not found or could not be loaded.</div>
        <Link
          href="/dashboard/coupons"
          className="inline-block rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-[color:var(--color-light-3)]"
        >
          Back to Coupons
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/coupons" className="text-sm text-[color:var(--color-light-1)] hover:text-foreground">
            Coupons
          </Link>
          <span className="text-sm text-[color:var(--color-light-1)]">/</span>
          <span className="text-sm text-foreground">Edit</span>
        </div>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">Edit Coupon</h1>
        <p className="mt-1 text-sm text-[color:var(--color-light-1)]">
          Update coupon <span className="font-mono font-semibold text-foreground">{coupon.code}</span>
        </p>
      </div>

      <CouponForm
        initialValues={coupon}
        submitting={submitting}
        onSubmit={onSubmit}
        submitLabel="Update coupon"
      />
    </div>
  );
}
