"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import TagForm from "@/components/tags/TagForm";
import { tagsApi } from "@/lib/api/tagsApi";
import { notifyError, notifySuccess } from "@/components/ui/toast";

export default function NewTagPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const res = await tagsApi.create(data);
      notifySuccess(res?.data?.message || "Tag created");
      router.replace("/dashboard/tags");
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
          <Link href="/dashboard/tags" className="text-sm text-[color:var(--color-light-1)] hover:text-foreground">Product Tags</Link>
          <span className="text-sm text-[color:var(--color-light-1)]">/</span>
          <span className="text-sm text-foreground">New</span>
        </div>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">New Tag</h1>
        <p className="mt-1 text-sm text-[color:var(--color-light-1)]">Add a new product tag.</p>
      </div>
      <TagForm submitting={submitting} onSubmit={onSubmit} submitLabel="Create tag" />
    </div>
  );
}
