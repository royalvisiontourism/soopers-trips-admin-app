"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ReviewForm from "@/components/reviews/ReviewForm";
import { reviewsApi } from "@/lib/api/reviewsApi";
import { notifyError, notifySuccess } from "@/components/ui/toast";

export default function EditReviewPage() {
  const router = useRouter();
  const params = useParams();
  const reviewId = params?.reviewId ? String(params.reviewId) : "";

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [review, setReview] = useState(null);

  useEffect(() => {
    let alive = true;
    if (!reviewId) return;
    setLoading(true);
    reviewsApi
      .getById(reviewId)
      .then((res) => {
        if (!alive) return;
        setReview(res?.data?.data || null);
      })
      .catch((e) => {
        if (!alive) return;
        notifyError(e);
        setReview(null);
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [reviewId]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await reviewsApi.update(reviewId, data);
      notifySuccess("Review updated");
      router.replace("/dashboard/reviews");
    } catch (e) {
      notifyError(e);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-[color:var(--color-light-1)]">
        <svg
          className="h-4 w-4 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
            className="opacity-25"
          />
          <path
            d="M4 12a8 8 0 018-8"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            className="opacity-75"
          />
        </svg>
        Loading review...
      </div>
    );
  }

  if (!review) {
    return (
      <div className="space-y-3">
        <div className="text-sm text-[color:var(--color-light-1)]">
          Review not found or could not be loaded.
        </div>
        <Link
          href="/dashboard/reviews"
          className="inline-block rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-[color:var(--color-light-3)]"
        >
          Back to Reviews
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Edit Review</h1>
          <p className="mt-1 text-sm text-[color:var(--color-light-1)]">
            Update review details and verification.
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
        initialValues={review}
        submitting={submitting}
        onSubmit={onSubmit}
        submitLabel="Update Review"
      />
    </div>
  );
}
