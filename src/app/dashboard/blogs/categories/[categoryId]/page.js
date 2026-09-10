"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import BlogCategoryForm from "@/components/blogs/BlogCategoryForm";
import { blogsApi } from "@/lib/api/blogsApi";
import { notifyError, notifySuccess } from "@/components/ui/toast";

export default function EditBlogCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params?.categoryId ? String(params.categoryId) : "";

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [category, setCategory] = useState(null);

  useEffect(() => {
    let alive = true;
    if (!categoryId) return;
    setLoading(true);
    blogsApi
      .getCategoryById(categoryId)
      .then((res) => {
        if (!alive) return;
        setCategory(res?.data?.data || null);
      })
      .catch((e) => {
        if (!alive) return;
        notifyError(e);
        setCategory(null);
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });
    return () => { alive = false; };
  }, [categoryId]);

  const onSubmit = async (payload) => {
    setSubmitting(true);
    try {
      await blogsApi.updateCategory(categoryId, payload);
      notifySuccess("Category updated");
      router.replace("/dashboard/blogs/categories");
    } catch (e) {
      notifyError(e);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-[color:var(--color-light-1)]">
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" className="opacity-25" />
          <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
        </svg>
        Loading category…
      </div>
    );
  }

  if (!category) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-[color:var(--color-light-1)]">Category not found or could not be loaded.</p>
        <Link
          href="/dashboard/blogs/categories"
          className="inline-block rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-[color:var(--color-light-3)]"
        >
          Back to categories
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Edit blog category</h1>
          <p className="mt-1 text-sm text-[color:var(--color-light-1)]">Update category name, slug, and description.</p>
        </div>
        <Link
          href="/dashboard/blogs/categories"
          className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-[color:var(--color-light-3)]"
        >
          Back to categories
        </Link>
      </div>
      <BlogCategoryForm initialCategory={category} submitting={submitting} onSubmit={onSubmit} submitLabel="Update category" />
    </div>
  );
}
