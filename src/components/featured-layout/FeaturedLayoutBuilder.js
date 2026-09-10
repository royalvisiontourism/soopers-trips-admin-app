"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { categoriesApi } from "@/lib/api/categoriesApi";
import { productsApi } from "@/lib/api/productsApi";
import { featuredLayoutApi } from "@/lib/api/featuredLayoutApi";
import { notifyError, notifySuccess } from "@/components/ui/toast";
import ConfirmModal from "@/components/ui/ConfirmModal";

const MAX_CATEGORIES = 5;
const MAX_PRODUCTS_PER_CATEGORY = 10;

function SortableRow({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="touch-none">
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="mt-2 cursor-grab rounded-lg border border-black/10 bg-white p-2 text-xs text-[color:var(--color-light-1)] hover:bg-[color:var(--color-light-3)] active:cursor-grabbing"
          title="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          ☰
        </button>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

function Modal({ open, title, onClose, children, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="mx-4 w-full max-w-3xl rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-black/10 px-5 py-4">
          <div className="text-base font-semibold text-foreground">{title}</div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-black/10 bg-white px-2 py-1.5 text-sm text-foreground hover:bg-[color:var(--color-light-3)]"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer ? <div className="border-t border-black/10 px-5 py-4">{footer}</div> : null}
      </div>
    </div>
  );
}

export default function FeaturedLayoutBuilder() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [allCategories, setAllCategories] = useState([]);
  const [selected, setSelected] = useState([]); // [{ categoryId, position, products: [{_id,title,...}] }]
  const [layoutId, setLayoutId] = useState(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalCategoryId, setModalCategoryId] = useState(null);
  const [modalProducts, setModalProducts] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Cache: categoryId -> products list
  const productsCacheRef = useRef(new Map());

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const selectedIds = useMemo(() => selected.map((c) => c.categoryId), [selected]);
  const selectedById = useMemo(() => new Map(selected.map((c) => [c.categoryId, c])), [selected]);

  const init = async () => {
    setLoading(true);
    try {
      const [catsRes, layoutRes] = await Promise.all([
        categoriesApi.list({ page: 1, limit: 200, isActive: true }),
        featuredLayoutApi.getActive({ page: "home" }).catch(() => null),
      ]);

      const catsData = catsRes?.data?.data;
      const cats = Array.isArray(catsData?.items) ? catsData.items : [];
      setAllCategories(cats);

      const layout = layoutRes?.data?.data || null;
      if (layout && layout._id) {
        setLayoutId(layout._id);
        const initialSelected = Array.isArray(layout.categories)
          ? layout.categories
              .slice()
              .sort((a, b) => (a.position || 0) - (b.position || 0))
              .map((c, idx) => ({
                categoryId: String(c.category?._id || c.category),
                position: idx + 1,
                products: Array.isArray(c.products) ? c.products : [],
              }))
          : [];
        setSelected(initialSelected);
      } else {
        setLayoutId(null);
        setSelected([]);
      }
    } catch (e) {
      notifyError(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    init();
  }, []);

  const toggleCategory = (categoryId) => {
    const id = String(categoryId);
    const exists = selected.some((c) => c.categoryId === id);
    if (exists) {
      const next = selected.filter((c) => c.categoryId !== id).map((c, idx) => ({ ...c, position: idx + 1 }));
      setSelected(next);
      return;
    }
    if (selected.length >= MAX_CATEGORIES) {
      notifyError(`You can select up to ${MAX_CATEGORIES} categories`);
      return;
    }
    setSelected((prev) => [...prev, { categoryId: id, position: prev.length + 1, products: [] }]);
  };

  const openManageProducts = async (categoryId) => {
    const id = String(categoryId);
    setModalCategoryId(id);
    setSearch("");
    setModalOpen(true);
    setModalLoading(true);
    try {
      const cached = productsCacheRef.current.get(id);
      if (cached) {
        setModalProducts(cached);
        return;
      }
      const res = await productsApi.list({ page: 1, limit: 200, category: id });
      const data = res?.data?.data;
      const items = Array.isArray(data?.items) ? data.items : [];
      productsCacheRef.current.set(id, items);
      setModalProducts(items);
    } catch (e) {
      notifyError(e);
      setModalProducts([]);
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalCategoryId(null);
    setModalProducts([]);
    setSearch("");
  };

  const filteredModalProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return modalProducts;
    return modalProducts.filter((p) => String(p.title || "").toLowerCase().includes(q) || String(p.slug || "").toLowerCase().includes(q));
  }, [modalProducts, search]);

  const toggleProductInCategory = (product) => {
    if (!modalCategoryId) return;
    setSelected((prev) => {
      const next = prev.map((c) => ({ ...c }));
      const idx = next.findIndex((c) => c.categoryId === modalCategoryId);
      if (idx === -1) return prev;

      const cat = next[idx];
      const existingIdx = (cat.products || []).findIndex((p) => String(p._id) === String(product._id));

      if (existingIdx !== -1) {
        cat.products = cat.products.filter((p) => String(p._id) !== String(product._id));
        return next;
      }

      if ((cat.products || []).length >= MAX_PRODUCTS_PER_CATEGORY) {
        notifyError(`You can select up to ${MAX_PRODUCTS_PER_CATEGORY} products per category`);
        return prev;
      }

      cat.products = [...(cat.products || []), product];
      return next;
    });
  };

  const removeProductFromCategory = (categoryId, productId) => {
    setSelected((prev) =>
      prev.map((c) =>
        c.categoryId !== String(categoryId)
          ? c
          : { ...c, products: (c.products || []).filter((p) => String(p._id) !== String(productId)) }
      )
    );
  };

  const onCategoryDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setSelected((prev) => {
      const oldIndex = prev.findIndex((c) => `cat-${c.categoryId}` === active.id);
      const newIndex = prev.findIndex((c) => `cat-${c.categoryId}` === over.id);
      const moved = arrayMove(prev, oldIndex, newIndex);
      return moved.map((c, idx) => ({ ...c, position: idx + 1 }));
    });
  };

  const onProductsDragEnd = (categoryId, event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setSelected((prev) => {
      const next = prev.map((c) => ({ ...c }));
      const idx = next.findIndex((c) => c.categoryId === String(categoryId));
      if (idx === -1) return prev;
      const cat = next[idx];
      const oldIndex = (cat.products || []).findIndex((p) => `prod-${p._id}` === active.id);
      const newIndex = (cat.products || []).findIndex((p) => `prod-${p._id}` === over.id);
      cat.products = arrayMove(cat.products || [], oldIndex, newIndex);
      return next;
    });
  };

  const validateBeforeSave = () => {
    if (selected.length === 0) {
      notifyError("Select at least 1 category");
      return false;
    }
    for (const c of selected) {
      if (!Array.isArray(c.products) || c.products.length === 0) {
        notifyError("Each selected category must have at least 1 product");
        return false;
      }
      if (c.products.length > MAX_PRODUCTS_PER_CATEGORY) {
        notifyError(`Each category can have up to ${MAX_PRODUCTS_PER_CATEGORY} products`);
        return false;
      }
    }
    return true;
  };

  const save = async () => {
    if (!validateBeforeSave()) return;
    setSaving(true);
    try {
      const payload = {
        name: "Homepage Featured Layout",
        page: "home",
        isActive: true,
        categories: selected.map((c, idx) => ({
          category: c.categoryId,
          position: idx + 1,
          products: (c.products || []).map((p) => p._id),
        })),
      };

      if (layoutId) {
        await featuredLayoutApi.update(layoutId, payload);
        notifySuccess("Featured layout updated");
      } else {
        const res = await featuredLayoutApi.create(payload);
        const created = res?.data?.data;
        if (created?._id) setLayoutId(created._id);
        notifySuccess("Featured layout created");
      }
    } catch (e) {
      notifyError(e);
    } finally {
      setSaving(false);
    }
  };

  const removeLayout = async () => {
    if (!layoutId) return;
    setDeleting(true);
    try {
      await featuredLayoutApi.remove(layoutId);
      notifySuccess("Featured layout deleted");
      setLayoutId(null);
      setSelected([]);
      setDeleteOpen(false);
    } catch (e) {
      notifyError(e);
    } finally {
      setDeleting(false);
    }
  };

  const selectedCategoriesSorted = useMemo(() => {
    return selected
      .slice()
      .sort((a, b) => (a.position || 0) - (b.position || 0))
      .map((c) => ({
        ...c,
        meta: allCategories.find((x) => String(x._id) === String(c.categoryId)) || null,
      }));
  }, [selected, allCategories]);

  if (loading) {
    return <div className="text-sm text-[color:var(--color-light-1)]">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Featured Layout</h1>
          <p className="mt-1 text-sm text-[color:var(--color-light-1)]">
            Select up to {MAX_CATEGORIES} categories and up to {MAX_PRODUCTS_PER_CATEGORY} products in each. Drag to reorder.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {layoutId ? (
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              disabled={saving || deleting}
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[color:var(--color-red-2)] hover:bg-[color:var(--color-light-3)] disabled:opacity-60"
            >
              Delete layout
            </button>
          ) : null}
          <button
            type="button"
            onClick={save}
            disabled={saving || deleting}
            className="rounded-xl bg-black px-5 py-2 text-sm font-semibold text-white hover:bg-black/80 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save layout"}
          </button>
        </div>
      </div>

      {/* Category selection */}
      <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
        <div className="text-sm font-semibold text-foreground">1) Choose Categories</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {allCategories.length === 0 ? (
            <div className="text-sm text-[color:var(--color-light-1)]">No categories found.</div>
          ) : (
            allCategories.map((c) => {
              const active = selectedIds.includes(String(c._id));
              return (
                <button
                  key={c._id}
                  type="button"
                  onClick={() => toggleCategory(c._id)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                    active
                      ? "border-primary bg-primary-soft text-primary"
                      : "border-black/10 bg-white text-foreground hover:bg-[color:var(--color-light-3)]"
                  }`}
                >
                  {c.name}
                </button>
              );
            })
          )}
        </div>
        <div className="mt-2 text-xs text-[color:var(--color-light-1)]">
          Selected: {selected.length}/{MAX_CATEGORIES}
        </div>
      </div>

      {/* Selected categories sortable */}
      {selected.length > 0 ? (
        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold text-foreground">2) Order Categories & Products</div>
          <div className="mt-4 space-y-3">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onCategoryDragEnd}>
              <SortableContext
                items={selectedCategoriesSorted.map((c) => `cat-${c.categoryId}`)}
                strategy={verticalListSortingStrategy}
              >
                {selectedCategoriesSorted.map((c) => (
                  <SortableRow key={c.categoryId} id={`cat-${c.categoryId}`}>
                    <div className="rounded-2xl border border-black/10 bg-[color:var(--color-light-3)]/40 p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-foreground">{c.meta?.name || "Category"}</div>
                          <div className="mt-0.5 text-xs text-[color:var(--color-light-1)]">
                            Position {c.position} • Products {c.products?.length || 0}/{MAX_PRODUCTS_PER_CATEGORY}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openManageProducts(c.categoryId)}
                            className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-foreground hover:bg-[color:var(--color-light-3)]"
                          >
                            Manage products
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleCategory(c.categoryId)}
                            className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-[color:var(--color-red-2)] hover:bg-[color:var(--color-light-3)]"
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      {/* Products sortable list */}
                      {(c.products || []).length > 0 ? (
                        <div className="mt-4">
                          <div className="text-xs font-semibold text-[color:var(--color-light-1)]">Drag products to reorder</div>
                          <div className="mt-2 space-y-2">
                            <DndContext
                              sensors={sensors}
                              collisionDetection={closestCenter}
                              onDragEnd={(e) => onProductsDragEnd(c.categoryId, e)}
                            >
                              <SortableContext
                                items={(c.products || []).map((p) => `prod-${p._id}`)}
                                strategy={verticalListSortingStrategy}
                              >
                                {(c.products || []).map((p) => (
                                  <SortableRow key={p._id} id={`prod-${p._id}`}>
                                    <div className="flex items-center justify-between gap-2 rounded-xl border border-black/10 bg-white px-3 py-2">
                                      <div className="min-w-0">
                                        <div className="truncate text-sm font-medium text-foreground">{p.title || "Product"}</div>
                                        <div className="text-xs text-[color:var(--color-light-1)]">
                                          {p.duration ? `${p.duration} • ` : ""}AED {Number(p.basePrice || 0).toLocaleString()}
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => removeProductFromCategory(c.categoryId, p._id)}
                                        className="rounded-lg border border-black/10 bg-white px-2 py-1 text-xs font-semibold text-[color:var(--color-red-2)] hover:bg-[color:var(--color-light-3)]"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  </SortableRow>
                                ))}
                              </SortableContext>
                            </DndContext>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 text-sm text-[color:var(--color-light-1)]">
                          No products selected yet. Click “Manage products”.
                        </div>
                      )}
                    </div>
                  </SortableRow>
                ))}
              </SortableContext>
            </DndContext>
          </div>
        </div>
      ) : null}

      {/* Manage products modal */}
      <Modal
        open={modalOpen}
        title="Select products (max 10)"
        onClose={closeModal}
        footer={
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-[color:var(--color-light-1)]">
              Selected: {modalCategoryId ? (selectedById.get(modalCategoryId)?.products?.length || 0) : 0}/{MAX_PRODUCTS_PER_CATEGORY}
            </div>
            <button
              type="button"
              onClick={closeModal}
              className="rounded-xl bg-black px-5 py-2 text-sm font-semibold text-white hover:bg-black/80"
            >
              Done
            </button>
          </div>
        }
      >
        {modalCategoryId ? (
          <>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title or slug..."
                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/20"
              />
            </div>

            {modalLoading ? (
              <div className="py-10 text-center text-sm text-[color:var(--color-light-1)]">Loading products...</div>
            ) : filteredModalProducts.length === 0 ? (
              <div className="py-10 text-center text-sm text-[color:var(--color-light-1)]">No products found.</div>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {filteredModalProducts.map((p) => {
                  const cat = selectedById.get(modalCategoryId);
                  const isSelected = (cat?.products || []).some((x) => String(x._id) === String(p._id));
                  const disabled =
                    !isSelected && (cat?.products || []).length >= MAX_PRODUCTS_PER_CATEGORY;
                  return (
                    <button
                      key={p._id}
                      type="button"
                      onClick={() => toggleProductInCategory(p)}
                      disabled={disabled}
                      className={`w-full rounded-2xl border p-4 text-left transition ${
                        isSelected
                          ? "border-primary bg-primary-soft"
                          : "border-black/10 bg-white hover:bg-[color:var(--color-light-3)]"
                      } ${disabled ? "opacity-60" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-foreground">{p.title || "Product"}</div>
                          <div className="mt-0.5 text-xs text-[color:var(--color-light-1)]">
                            {p.slug ? `/${p.slug}` : ""}{p.duration ? ` • ${p.duration}` : ""} • AED {Number(p.basePrice || 0).toLocaleString()}
                          </div>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${
                            isSelected ? "bg-primary text-white" : "border border-black/10 text-foreground"
                          }`}
                        >
                          {isSelected ? "Selected" : "Select"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        ) : null}
      </Modal>

      <ConfirmModal
        open={deleteOpen}
        title="Delete featured layout?"
        message="This will remove the featured layout from the website homepage."
        confirmText="Delete"
        cancelText="Cancel"
        loading={deleting}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={removeLayout}
      />
    </div>
  );
}

