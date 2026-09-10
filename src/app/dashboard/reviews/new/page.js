"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReviewForm from "@/components/reviews/ReviewForm";
import { reviewsApi } from "@/lib/api/reviewsApi";
import { notifyError, notifySuccess } from "@/components/ui/toast";

export default function NewReviewPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await reviewsApi.create(data);
      notifySuccess("Review created");
      router.replace("/dashboard/reviews");
    } catch (e) {
      notifyError(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">New Review</h1>
          <p className="mt-1 text-sm text-[color:var(--color-light-1)]">
            Add a new product review.
          </p>
        </div>
        <Link
          href="/dashboard/reviews"
          className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-[color:var(--color-light-3)]"
        >
          Back to Reviews
        </Link>
      </div>

      <ReviewForm
        initialValues={{}}
        submitting={submitting}
        onSubmit={onSubmit}
        submitLabel="Create Review"
      />
    </div>
  );
}
