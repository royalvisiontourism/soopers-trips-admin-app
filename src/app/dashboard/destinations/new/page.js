"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import DestinationForm from "@/components/destinations/DestinationForm";
import { destinationsApi } from "@/lib/api/destinationsApi";
import { notifyError, notifySuccess } from "@/components/ui/toast";

export default function NewDestinationPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (formData) => {
    setSubmitting(true);
    try {
      const res = await destinationsApi.create(formData);
      notifySuccess(res?.data?.message || "Destination created");
      router.replace("/dashboard/destinations");
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
          <Link href="/dashboard/destinations" className="text-sm text-[color:var(--color-light-1)] hover:text-foreground">Destinations</Link>
          <span className="text-sm text-[color:var(--color-light-1)]">/</span>
          <span className="text-sm text-foreground">New</span>
        </div>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">New Destination</h1>
        <p className="mt-1 text-sm text-[color:var(--color-light-1)]">Add a new tour destination.</p>
      </div>
      <DestinationForm submitting={submitting} onSubmit={onSubmit} submitLabel="Create destination" />
    </div>
  );
}
