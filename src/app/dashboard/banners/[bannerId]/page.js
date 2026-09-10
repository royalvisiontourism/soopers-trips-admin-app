"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import BannerForm from "@/components/banners/BannerForm";
import { bannersApi } from "@/lib/api/bannersApi";
import { notifyError, notifySuccess } from "@/components/ui/toast";

export default function EditBannerPage() {
  const router = useRouter();
  const params = useParams();
  const bannerId = params?.bannerId ? String(params.bannerId) : "";

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    let alive = true;
    if (!bannerId) return;
    setLoading(true);
    bannersApi
      .getById(bannerId)
      .then((res) => {
        if (!alive) return;
        setBanner(res?.data?.data || null);
      })
      .catch((e) => {
        if (!alive) return;
        notifyError(e);
        setBanner(null);
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [bannerId]);

  const onSubmit = async (formData) => {
    setSubmitting(true);
    try {
      const res = await bannersApi.update(bannerId, formData);
      notifySuccess(res?.data?.message || "Banner updated");
      router.replace("/dashboard/banners");
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
        Loading banner...
      </div>
    );
  }

  if (!banner) {
    return (
      <div className="space-y-3">
        <div className="text-sm text-[color:var(--color-light-1)]">Banner not found or could not be loaded.</div>
        <Link
          href="/dashboard/banners"
          className="inline-block rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-[color:var(--color-light-3)]"
        >
          Back to Banners
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/banners"
              className="text-sm text-[color:var(--color-light-1)] hover:text-foreground"
            >
              Banners
            </Link>
            <span className="text-sm text-[color:var(--color-light-1)]">/</span>
            <span className="text-sm text-foreground">Edit</span>
          </div>
          <h1 className="mt-1 text-2xl font-semibold text-foreground">Edit Banner</h1>
          <p className="mt-1 text-sm text-[color:var(--color-light-1)]">Update text fields or replace the media file.</p>
        </div>
      </div>

      <BannerForm
        initialValues={banner}
        submitting={submitting}
        onSubmit={onSubmit}
        submitLabel="Update banner"
      />
    </div>
  );
}
