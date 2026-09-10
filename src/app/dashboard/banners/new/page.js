"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import BannerForm from "@/components/banners/BannerForm";
import { bannersApi } from "@/lib/api/bannersApi";
import { notifyError, notifySuccess } from "@/components/ui/toast";

export default function NewBannerPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (formData) => {
    setSubmitting(true);
    try {
      const res = await bannersApi.create(formData);
      notifySuccess(res?.data?.message || "Banner created");
      router.replace("/dashboard/banners");
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
          <Link
            href="/dashboard/banners"
            className="text-sm text-[color:var(--color-light-1)] hover:text-foreground"
          >
            Banners
          </Link>
          <span className="text-sm text-[color:var(--color-light-1)]">/</span>
          <span className="text-sm text-foreground">New</span>
        </div>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">New Banner</h1>
        <p className="mt-1 text-sm text-[color:var(--color-light-1)]">Upload an image/video and add banner text fields.</p>
      </div>

      <BannerForm submitting={submitting} onSubmit={onSubmit} submitLabel="Create banner" />
    </div>
  );
}
