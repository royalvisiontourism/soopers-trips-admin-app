"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BlogPostForm from "@/components/blogs/BlogPostForm";
import { blogsApi } from "@/lib/api/blogsApi";
import { notifyError, notifySuccess } from "@/components/ui/toast";

export default function NewBlogPostPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (payload) => {
    setSubmitting(true);
    try {
      await blogsApi.create(payload);
      notifySuccess("Post created as draft");
      router.replace("/dashboard/blogs");
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
          <h1 className="text-2xl font-semibold text-foreground">New post</h1>
          <p className="mt-1 text-sm text-[color:var(--color-light-1)]">Create a new blog post. Save as draft first, then Publish when ready.</p>
        </div>
        <Link href="/dashboard/blogs" className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-[color:var(--color-light-3)]">
          Back to Blog
        </Link>
      </div>
      <BlogPostForm initialPost={null} submitting={submitting} onSubmit={onSubmit} submitLabel="Create post" />
    </div>
  );
}
