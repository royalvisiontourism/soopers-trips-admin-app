"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function PaymentClient() {
  const searchParams = useSearchParams();
  const status = (searchParams.get("status") || "").toUpperCase();
  const bookingId = searchParams.get("bookingId") || "";
  const ok = status === "PAID" || status === "SUCCESS";

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center px-4 py-10">
      <div className="w-full rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className={`text-2xl font-semibold ${ok ? "text-green-700" : "text-red-700"}`}>
            {ok ? "Payment Successful" : "Payment Failed"}
          </div>
          <div className="text-sm text-[color:var(--color-light-1)]">
            {ok
              ? "Thank you! Your payment was processed successfully."
              : "Something went wrong. If your amount was deducted, please contact support."}
          </div>
          {bookingId ? (
            <div className="mt-2 rounded-xl bg-[color:var(--color-light-3)] px-4 py-2 text-sm text-foreground">
              Booking ID: <span className="font-semibold">{bookingId}</span>
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link
            href="/dashboard/bookings"
            className="cursor-pointer rounded-xl bg-black px-4 py-2 text-sm font-medium text-white"
          >
            Go to Bookings
          </Link>
          <Link
            href="/dashboard"
            className="cursor-pointer rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-[color:var(--color-light-3)]"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

