import { Suspense } from "react";
import PaymentClient from "./payment-client";

export const metadata = {
  title: "Payment | Soopers Trips Admin",
  robots: { index: false, follow: false, noindex: true, nofollow: true },
};

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-[color:var(--color-light-1)]">Verifying payment...</div>}>
      <PaymentClient />
    </Suspense>
  );
}

