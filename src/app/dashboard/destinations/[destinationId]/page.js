"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import DestinationForm from "@/components/destinations/DestinationForm";
import { destinationsApi } from "@/lib/api/destinationsApi";
import { notifyError, notifySuccess } from "@/components/ui/toast";

export default function EditDestinationPage() {
  const router = useRouter();
  const params = useParams();
  const destinationId = params?.destinationId ? String(params.destinationId) : "";

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [destination, setDestination] = useState(null);

  useEffect(() => {
    let alive = true;
    if (!destinationId) return;
    setLoading(true);
    destinationsApi
      .getById(destinationId)
      .then((res) => { if (alive) setDestination(res?.data?.data || null); })
      .catch((e) => { if (alive) { notifyError(e); setDestination(null); } })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [destinationId]);

  const onSubmit = async (formData) => {
    setSubmitting(true);
    try {
      const res = await destinationsApi.update(destinationId, formData);
      notifySuccess(res?.data?.message || "Destination updated");
      router.replace("/dashboard/destinations");
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
        Loading destination...
      </div>
    );
  }

  if (!destination) {
    return (
      <div className="space-y-3">
        <div className="text-sm text-[color:var(--color-light-1)]">Destination not found or could not be loaded.</div>
        <Link href="/dashboard/destinations" className="inline-block rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-[color:var(--color-light-3)]">Back to Destinations</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/destinations" className="text-sm text-[color:var(--color-light-1)] hover:text-foreground">Destinations</Link>
          <span className="text-sm text-[color:var(--color-light-1)]">/</span>
          <span className="text-sm text-foreground">Edit</span>
        </div>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">Edit Destination</h1>
        <p className="mt-1 text-sm text-[color:var(--color-light-1)]">
          Update <span className="font-semibold text-foreground">{destination.name}</span>
        </p>
      </div>
      <DestinationForm initialValues={destination} submitting={submitting} onSubmit={onSubmit} submitLabel="Update destination" />
    </div>
  );
}
