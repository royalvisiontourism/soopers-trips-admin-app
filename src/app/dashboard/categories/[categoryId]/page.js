"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import CategoryForm from "@/components/categories/CategoryForm";
import { categoriesApi } from "@/lib/api/categoriesApi";
import { notifyError, notifySuccess } from "@/components/ui/toast";

export default function EditCategoryPage() {
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
    categoriesApi
      .getById(categoryId)
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
    return () => {
      alive = false;
    };
  }, [categoryId]);

  const onSubmit = async (formData) => {
    setSubmitting(true);
    try {
      const res = await categoriesApi.update(categoryId, formData);
      notifySuccess(res?.data?.message || "Category updated");
      router.replace("/dashboard/categories");
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
        Loading category...
      </div>
    );
  }

  if (!category) {
    return (
      <div className="space-y-3">
        <div className="text-sm text-[color:var(--color-light-1)]">Category not found or could not be loaded.</div>
        <Link
          href="/dashboard/categories"
          className="inline-block rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-[color:var(--color-light-3)]"
        >
          Back to Categories
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/categories" className="text-sm text-[color:var(--color-light-1)] hover:text-foreground">
            Tour Categories
          </Link>
          <span className="text-sm text-[color:var(--color-light-1)]">/</span>
          <span className="text-sm text-foreground">Edit</span>
        </div>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">Edit Category</h1>
        <p className="mt-1 text-sm text-[color:var(--color-light-1)]">
          Update <span className="font-semibold text-foreground">{category.name}</span>
        </p>
      </div>

      <CategoryForm
        initialValues={category}
        submitting={submitting}
        onSubmit={onSubmit}
        submitLabel="Update category"
      />
    </div>
  );
}
