"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { productApi } from "@/lib/api/productApi";
import { agentApi } from "@/lib/api/agentApi";
import { notifyError } from "@/components/ui/toast";

function formatMoney(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "-";
  return Number(value).toFixed(2);
}

export default function CartPage() {
  const { cartItems, removeFromCart, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    let alive = true;
    if (!cartItems.length) {
      setRows([]);
      return;
    }

    setLoading(true);
    Promise.all(
      cartItems.map(async (id) => {
        try {
          const [pRes, aRes] = await Promise.all([productApi.getById(id), agentApi.getMyAssignedProduct(id)]);
          return {
            id,
            product: pRes?.data?.data || null,
            assignment: aRes || null,
          };
        } catch (e) {
          return { id, product: null, assignment: null, error: e };
        }
      })
    )
      .then((list) => {
        if (!alive) return;
        const errors = list.filter((x) => x.error);
        if (errors.length) notifyError("Some cart items could not be loaded.");
        setRows(list);
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [cartItems]);

  const total = useMemo(() => {
    return rows.reduce((sum, r) => sum + Number(r?.assignment?.discountedBasePrice ?? r?.product?.basePrice ?? 0), 0);
  }, [rows]);

  if (!cartItems.length) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-foreground">Cart</h1>
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="text-sm text-[color:var(--color-light-1)]">Your cart is empty.</div>
          <Link href="/dashboard/products" className="mt-4 inline-flex cursor-pointer rounded-xl bg-black px-4 py-2 text-sm font-medium text-white">
            Browse products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Cart</h1>
          <p className="mt-1 text-sm text-[color:var(--color-light-1)]">Products added for later actions.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/bookings/new"
            className="cursor-pointer rounded-xl bg-black px-4 py-2 text-sm font-medium text-white"
          >
            Proceed to Booking
          </Link>
          <button
            type="button"
            onClick={clearCart}
            className="cursor-pointer rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-[color:var(--color-light-3)]"
          >
            Clear Cart
          </button>
          <div className="rounded-xl bg-[color:var(--color-light-3)] px-4 py-2 text-sm text-foreground">
            Total: <span className="font-semibold">{formatMoney(total)}</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-black/10 bg-white shadow-sm">
        <div className="border-b border-black/5 px-5 py-4 text-sm font-semibold text-foreground">
          Items ({cartItems.length})
        </div>

        <div className="divide-y divide-black/5">
          {rows.map((r) => {
            const p = r.product;
            const price = r.assignment?.discountedBasePrice ?? p?.basePrice ?? null;
            return (
              <div key={r.id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-20 overflow-hidden rounded-xl bg-[color:var(--color-light-3)]">
                    {p?.coverImage ? <img src={p.coverImage} alt={p?.title || "Product"} className="h-full w-full object-cover" /> : null}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">{p?.title || r.id}</div>
                    <div className="mt-1 text-xs text-[color:var(--color-light-1)]">{p?.slug || ""}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-[color:var(--color-light-3)] px-3 py-2 text-sm font-semibold text-foreground">
                    {formatMoney(price)}
                  </div>
                  <Link
                    href={`/dashboard/products/${r.id}`}
                    className="cursor-pointer rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-medium text-foreground hover:bg-[color:var(--color-light-3)]"
                  >
                    View
                  </Link>
                  <button
                    type="button"
                    onClick={() => removeFromCart(r.id)}
                    className="cursor-pointer rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-medium text-foreground hover:bg-[color:var(--color-light-3)]"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {loading ? <div className="text-sm text-[color:var(--color-light-1)]">Loading cart items…</div> : null}
    </div>
  );
}

