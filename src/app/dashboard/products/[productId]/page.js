"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ProductForm from "@/components/products/ProductForm";
import { productsApi } from "@/lib/api/productsApi";
import { notifyError, notifySuccess } from "@/components/ui/toast";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params?.productId ? String(params.productId) : "";

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [product, setProduct] = useState(null);

  useEffect(() => {
    let alive = true;
    if (!productId) return;
    setLoading(true);
    productsApi
      .getById(productId)
      .then((res) => { if (alive) setProduct(res?.data?.data || null); })
      .catch((e) => { if (alive) { notifyError(e); setProduct(null); } })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [productId]);

  /** Called when user clicks "Next Tab" – auto-saves current data */
  const onSaveTab = async (formData) => {
    try {
      await productsApi.update(productId, formData);
      notifySuccess("Progress saved");
    } catch (e) {
      notifyError(e);
      throw e; // re-throw so ProductForm stays on current tab
    }
  };

  /** Called when user clicks the final "Update product" button */
  const onSubmit = async (formData) => {
    setSubmitting(true);
    try {
      const res = await productsApi.update(productId, formData);
      notifySuccess(res?.data?.message || "Product updated");
      router.replace("/dashboard/products");
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
        Loading product...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="space-y-3">
        <div className="text-sm text-[color:var(--color-light-1)]">Product not found or could not be loaded.</div>
        <Link href="/dashboard/products" className="inline-block rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-[color:var(--color-light-3)]">Back to Products</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/products" className="text-sm text-[color:var(--color-light-1)] hover:text-foreground">Products</Link>
          <span className="text-sm text-[color:var(--color-light-1)]">/</span>
          <span className="text-sm text-foreground">Edit</span>
        </div>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">Edit Product</h1>
        <p className="mt-1 text-sm text-[color:var(--color-light-1)]">
          Update <span className="font-semibold text-foreground">{product.title}</span>. Progress is saved automatically when you move between tabs.
        </p>
      </div>
      <ProductForm initialValues={product} submitting={submitting} onSubmit={onSubmit} onSaveTab={onSaveTab} submitLabel="Update product" />
    </div>
  );
}
