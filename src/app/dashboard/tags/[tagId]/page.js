"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import TagForm from "@/components/tags/TagForm";
import { tagsApi } from "@/lib/api/tagsApi";
import { notifyError, notifySuccess } from "@/components/ui/toast";

export default function EditTagPage() {
  const router = useRouter();
  const params = useParams();
  const tagId = params?.tagId ? String(params.tagId) : "";

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tag, setTag] = useState(null);

  useEffect(() => {
    let alive = true;
    if (!tagId) return;
    setLoading(true);
    tagsApi
      .getById(tagId)
      .then((res) => { if (alive) setTag(res?.data?.data || null); })
      .catch((e) => { if (alive) { notifyError(e); setTag(null); } })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [tagId]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const res = await tagsApi.update(tagId, data);
      notifySuccess(res?.data?.message || "Tag updated");
      router.replace("/dashboard/tags");
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
        Loading tag...
      </div>
    );
  }

  if (!tag) {
    return (
      <div className="space-y-3">
        <div className="text-sm text-[color:var(--color-light-1)]">Tag not found or could not be loaded.</div>
        <Link href="/dashboard/tags" className="inline-block rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-[color:var(--color-light-3)]">Back to Tags</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/tags" className="text-sm text-[color:var(--color-light-1)] hover:text-foreground">Product Tags</Link>
          <span className="text-sm text-[color:var(--color-light-1)]">/</span>
          <span className="text-sm text-foreground">Edit</span>
        </div>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">Edit Tag</h1>
        <p className="mt-1 text-sm text-[color:var(--color-light-1)]">
          Update <span className="font-semibold text-foreground">{tag.name}</span>
        </p>
      </div>
      <TagForm initialValues={tag} submitting={submitting} onSubmit={onSubmit} submitLabel="Update tag" />
    </div>
  );
}
