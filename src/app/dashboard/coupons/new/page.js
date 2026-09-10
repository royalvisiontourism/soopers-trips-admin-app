"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import CouponForm from "@/components/coupons/CouponForm";
import { couponsApi } from "@/lib/api/couponsApi";
import { notifyError, notifySuccess } from "@/components/ui/toast";

export default function NewCouponPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const res = await couponsApi.create(data);
      notifySuccess(res?.data?.message || "Coupon created");
      router.replace("/dashboard/coupons");
    } catch (e) {
      notifyError(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/coupons" className="text-sm text-[color:var(--color-light-1)] hover:text-foreground">
            Coupons
          </Link>
          <span className="text-sm text-[color:var(--color-light-1)]">/</span>
          <span className="text-sm text-foreground">New</span>
        </div>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">New Coupon</h1>
        <p className="mt-1 text-sm text-[color:var(--color-light-1)]">Create a new discount coupon for products.</p>
      </div>

      <CouponForm submitting={submitting} onSubmit={onSubmit} submitLabel="Create coupon" />
    </div>
  );
}
