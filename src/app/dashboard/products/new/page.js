"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import Link from "next/link";
import ProductForm from "@/components/products/ProductForm";
import { productsApi } from "@/lib/api/productsApi";
import { notifyError, notifySuccess } from "@/components/ui/toast";

export default function NewProductPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  // Track the product ID once the first tab save creates it
  const draftIdRef = useRef(null);

  /** Called when user clicks "Next Tab" – creates or updates the product draft */
  const onSaveTab = async (formData) => {
    try {
      if (!draftIdRef.current) {
        // First save – create the product
        const res = await productsApi.create(formData);
        const created = res?.data?.data;
        draftIdRef.current = created?._id || created?.id || null;
        notifySuccess("Progress saved");
      } else {
        // Subsequent saves – update the existing draft
        await productsApi.update(draftIdRef.current, formData);
        notifySuccess("Progress saved");
      }
    } catch (e) {
      notifyError(e);
      throw e; // re-throw so ProductForm stays on current tab
    }
  };

  /** Called when user clicks the final "Create product" button */
  const onSubmit = async (formData) => {
    setSubmitting(true);
    try {
      if (draftIdRef.current) {
        // Product was already created as a draft – do a final update
        const res = await productsApi.update(draftIdRef.current, formData);
        notifySuccess(res?.data?.message || "Product created");
      } else {
        // No draft yet – create directly
        const res = await productsApi.create(formData);
        notifySuccess(res?.data?.message || "Product created");
      }
      router.replace("/dashboard/products");
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
          <Link href="/dashboard/products" className="text-sm text-[color:var(--color-light-1)] hover:text-foreground">Products</Link>
          <span className="text-sm text-[color:var(--color-light-1)]">/</span>
          <span className="text-sm text-foreground">New</span>
        </div>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">New Product</h1>
        <p className="mt-1 text-sm text-[color:var(--color-light-1)]">Create a new tour product. Progress is saved automatically when you move between tabs.</p>
      </div>
      <ProductForm submitting={submitting} onSubmit={onSubmit} onSaveTab={onSaveTab} submitLabel="Create product" />
    </div>
  );
}
