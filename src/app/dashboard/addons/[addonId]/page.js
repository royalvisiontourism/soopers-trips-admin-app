"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AddonForm from "@/components/addons/AddonForm";
import { addonsApi } from "@/lib/api/addonsApi";
import { notifyError, notifySuccess } from "@/components/ui/toast";

export default function EditAddonPage() {
  const router = useRouter();
  const params = useParams();
  const addonId = params?.addonId ? String(params.addonId) : "";

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [addon, setAddon] = useState(null);

  useEffect(() => {
    let alive = true;
    if (!addonId) return;
    setLoading(true);
    addonsApi
      .getById(addonId)
      .then((res) => { if (alive) setAddon(res?.data?.data || null); })
      .catch((e) => { if (alive) { notifyError(e); setAddon(null); } })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [addonId]);

  const onSubmit = async (formData) => {
    setSubmitting(true);
    try {
      const res = await addonsApi.update(addonId, formData);
      notifySuccess(res?.data?.message || "Addon updated");
      router.replace("/dashboard/addons");
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
        Loading addon...
      </div>
    );
  }

  if (!addon) {
    return (
      <div className="space-y-3">
        <div className="text-sm text-[color:var(--color-light-1)]">Addon not found or could not be loaded.</div>
        <Link href="/dashboard/addons" className="inline-block rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-[color:var(--color-light-3)]">Back to Addons</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/addons" className="text-sm text-[color:var(--color-light-1)] hover:text-foreground">Addons</Link>
          <span className="text-sm text-[color:var(--color-light-1)]">/</span>
          <span className="text-sm text-foreground">Edit</span>
        </div>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">Edit Addon</h1>
        <p className="mt-1 text-sm text-[color:var(--color-light-1)]">
          Update <span className="font-semibold text-foreground">{addon.name}</span>
        </p>
      </div>
      <AddonForm initialValues={addon} submitting={submitting} onSubmit={onSubmit} submitLabel="Update addon" />
    </div>
  );
}
