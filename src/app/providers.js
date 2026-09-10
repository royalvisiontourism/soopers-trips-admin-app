"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { Toaster } from "react-hot-toast";

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <CartProvider>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "var(--color-white)",
              color: "var(--color-dark-1)",
              border: "1px solid var(--color-border)",
            },
            success: {
              iconTheme: { primary: "var(--color-green-2)", secondary: "white" },
            },
            error: {
              iconTheme: { primary: "var(--color-red-2)", secondary: "white" },
            },
          }}
        />
      </CartProvider>
    </AuthProvider>
  );
}

