"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import CategoryForm from "@/components/categories/CategoryForm";
import { categoriesApi } from "@/lib/api/categoriesApi";
import { notifyError, notifySuccess } from "@/components/ui/toast";

export default function NewCategoryPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (formData) => {
    setSubmitting(true);
    try {
      const res = await categoriesApi.create(formData);
      notifySuccess(res?.data?.message || "Category created");
      router.replace("/dashboard/categories");
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
          <Link href="/dashboard/categories" className="text-sm text-[color:var(--color-light-1)] hover:text-foreground">
            Tour Categories
          </Link>
          <span className="text-sm text-[color:var(--color-light-1)]">/</span>
          <span className="text-sm text-foreground">New</span>
        </div>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">New Category</h1>
        <p className="mt-1 text-sm text-[color:var(--color-light-1)]">Create a new tour category.</p>
      </div>

      <CategoryForm submitting={submitting} onSubmit={onSubmit} submitLabel="Create category" />
    </div>
  );
}
