"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { notifyError, notifySuccess } from "@/components/ui/toast";

const STORAGE_KEY = "agent_cart_items";

const CartContext = createContext(null);

function safeRead() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function safeWrite(items) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    setItems(safeRead());
  }, []);

  useEffect(() => {
    safeWrite(items);
  }, [items]);

  const addToCart = useCallback((productId) => {
    if (!productId) return;
    let action = "noop";
    setItems((prev) => {
      if (prev.includes(productId)) {
        action = "exists";
        return prev;
      }
      action = "added";
      return [...prev, productId];
    });

    // Fire toasts outside the state updater to avoid React "setState-in-render" warnings
    queueMicrotask(() => {
      if (action === "exists") notifyError("This product is already in your cart.");
      if (action === "added") notifySuccess("Added to cart.");
    });
  }, []);

  const removeFromCart = useCallback((productId) => {
    setItems((prev) => prev.filter((id) => id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    notifySuccess("Cart cleared.");
  }, []);

  const value = useMemo(
    () => ({
      cartItems: items,
      cartCount: items.length,
      addToCart,
      removeFromCart,
      clearCart,
      isInCart: (productId) => items.includes(productId),
    }),
    [items, addToCart, removeFromCart, clearCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

