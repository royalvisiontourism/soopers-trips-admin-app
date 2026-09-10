"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BlogCategoryForm from "@/components/blogs/BlogCategoryForm";
import { blogsApi } from "@/lib/api/blogsApi";
import { notifyError, notifySuccess } from "@/components/ui/toast";

export default function NewBlogCategoryPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (payload) => {
    setSubmitting(true);
    try {
      await blogsApi.createCategory(payload);
      notifySuccess("Category created");
      router.replace("/dashboard/blogs/categories");
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
          <h1 className="text-2xl font-semibold text-foreground">New blog category</h1>
          <p className="mt-1 text-sm text-[color:var(--color-light-1)]">Create a category for blog posts.</p>
        </div>
        <Link
          href="/dashboard/blogs/categories"
          className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-[color:var(--color-light-3)]"
        >
          Back to categories
        </Link>
      </div>
      <BlogCategoryForm initialCategory={null} submitting={submitting} onSubmit={onSubmit} submitLabel="Create category" />
    </div>
  );
}
