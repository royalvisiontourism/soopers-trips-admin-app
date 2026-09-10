"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import AddonForm from "@/components/addons/AddonForm";
import { addonsApi } from "@/lib/api/addonsApi";
import { notifyError, notifySuccess } from "@/components/ui/toast";

export default function NewAddonPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (formData) => {
    setSubmitting(true);
    try {
      const res = await addonsApi.create(formData);
      notifySuccess(res?.data?.message || "Addon created");
      router.replace("/dashboard/addons");
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
          <Link href="/dashboard/addons" className="text-sm text-[color:var(--color-light-1)] hover:text-foreground">Addons</Link>
          <span className="text-sm text-[color:var(--color-light-1)]">/</span>
          <span className="text-sm text-foreground">New</span>
        </div>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">New Addon</h1>
        <p className="mt-1 text-sm text-[color:var(--color-light-1)]">Add a new addon service or product.</p>
      </div>
      <AddonForm submitting={submitting} onSubmit={onSubmit} submitLabel="Create addon" />
    </div>
  );
}
