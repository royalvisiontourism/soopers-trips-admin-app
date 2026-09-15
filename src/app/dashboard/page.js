"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { bookingApi } from "@/lib/api/bookingApi";
import { productsApi } from "@/lib/api/productsApi";
import { notifyError } from "@/components/ui/toast";

export default function DashboardHome() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBookings: 0,
    thisMonthBookings: 0,
    pendingPaymentCount: 0,
    pendingConfirmationCount: 0,
    paidThisMonthCount: 0,
    paidThisMonthAmount: 0,
    recentBookings: [],
  });

  const [productsLoading, setProductsLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [productsTotal, setProductsTotal] = useState(0);

  const currency = "AED";

  const fmtMoney = (amount, curr = currency) => {
    const value = Number(amount || 0);
    try {
      return new Intl.NumberFormat(undefined, { style: "currency", currency: curr }).format(value);
    } catch {
      return `${value.toFixed(2)} ${curr}`;
    }
  };

  const fmtDateTime = (value) => {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleString();
  };

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      try {
        const res = await bookingApi.getMyDashboardStats();
        const data = res?.data?.data;
        if (!mounted) return;
        setStats({
          totalBookings: Number(data?.totalBookings || 0),
          thisMonthBookings: Number(data?.thisMonthBookings || 0),
          pendingPaymentCount: Number(data?.pendingPaymentCount || 0),
          pendingConfirmationCount: Number(data?.pendingConfirmationCount || 0),
          paidThisMonthCount: Number(data?.paidThisMonthCount || 0),
          paidThisMonthAmount: Number(data?.paidThisMonthAmount || 0),
          recentBookings: Array.isArray(data?.recentBookings) ? data.recentBookings : [],
        });
      } catch (e) {
        if (!mounted) return;
        // Don't show error for 404 - backend may not have bookings API yet; dashboard still shows 0s
        const msg = typeof e === "string" ? e : e?.message || "";
        if (!msg.toLowerCase().includes("not found") && !msg.includes("404")) {
          notifyError(e);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setProductsLoading(true);
      try {
        const res = await productsApi.list({ page: 1, limit: 6 });
        const data = res?.data?.data;
        if (!mounted) return;
        setProducts(Array.isArray(data?.items) ? data.items : []);
        setProductsTotal(Number(data?.total || 0));
      } catch (e) {
        if (!mounted) return;
        setProducts([]);
        setProductsTotal(0);
      } finally {
        if (mounted) setProductsLoading(false);
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="mt-1 text-sm text-[color:var(--color-light-1)]">
            Soopers Trips Tourism L.L.C — Overview of products and bookings.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard/bookings"
            className="cursor-pointer rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-[color:var(--color-light-3)]"
          >
            View Bookings
          </Link>
        </div>
      </div>

      {/* KPI Cards - Bookings only (no credits) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold text-foreground">Total bookings</div>
          <div className="mt-1 text-2xl font-semibold text-primary">{loading ? "—" : stats.totalBookings}</div>
          <div className="text-xs text-[color:var(--color-light-1)]">Lifetime</div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold text-foreground">Bookings this month</div>
          <div className="mt-1 text-2xl font-semibold text-primary">{loading ? "—" : stats.thisMonthBookings}</div>
          <div className="text-xs text-[color:var(--color-light-1)]">Created this month</div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold text-foreground">Pending payment</div>
          <div className="mt-1 text-2xl font-semibold text-primary">{loading ? "—" : stats.pendingPaymentCount}</div>
          <div className="text-xs text-[color:var(--color-light-1)]">Payment status = PENDING</div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold text-foreground">Pending confirmation</div>
          <div className="mt-1 text-2xl font-semibold text-primary">{loading ? "—" : stats.pendingConfirmationCount}</div>
          <div className="text-xs text-[color:var(--color-light-1)]">Booking status = PENDING</div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold text-foreground">Paid this month</div>
          <div className="mt-1 text-2xl font-semibold text-primary">{loading ? "—" : fmtMoney(stats.paidThisMonthAmount)}</div>
          <div className="text-xs text-[color:var(--color-light-1)]">
            {loading ? "—" : `${stats.paidThisMonthCount} paid booking${stats.paidThisMonthCount === 1 ? "" : "s"}`}
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold text-foreground">Products</div>
          <div className="mt-1 text-2xl font-semibold text-primary">{productsLoading ? "—" : productsTotal}</div>
          <div className="text-xs text-[color:var(--color-light-1)]">Total products</div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Latest Bookings */}
        <div className="lg:col-span-2 rounded-2xl border border-black/10 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-black/10 p-4">
            <div>
              <div className="text-sm font-semibold text-foreground">Latest bookings</div>
              <div className="text-xs text-[color:var(--color-light-1)]">Most recent 5</div>
            </div>
            <Link
              href="/dashboard/bookings"
              className="cursor-pointer rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-medium text-foreground hover:bg-[color:var(--color-light-3)]"
            >
              View all
            </Link>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[color:var(--color-light-3)] text-xs uppercase tracking-wide text-[color:var(--color-light-1)]">
                <tr>
                  <th className="px-4 py-3">Booking ID</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-[color:var(--color-light-1)]">
                      Loading...
                    </td>
                  </tr>
                ) : stats.recentBookings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-[color:var(--color-light-1)]">
                      No bookings yet.
                    </td>
                  </tr>
                ) : (
                  stats.recentBookings.map((b) => (
                    <tr key={b.bookingId} className="hover:bg-[color:var(--color-light-3)]/60">
                      <td className="px-4 py-3 font-medium text-foreground">{b.bookingId}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full border border-black/10 bg-white px-2 py-1 text-xs font-medium text-foreground">
                          {b.status || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full border border-black/10 bg-white px-2 py-1 text-xs font-medium text-foreground">
                          {b.payment?.status || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-foreground">{fmtMoney(b.totalAmount, b.currency || currency)}</td>
                      <td className="px-4 py-3 text-[color:var(--color-light-1)]">{fmtDateTime(b.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick links / Products summary */}
        <div className="rounded-2xl border border-black/10 bg-white shadow-sm">
          <div className="border-b border-black/10 p-4">
            <div className="text-sm font-semibold text-foreground">Products</div>
            <div className="text-xs text-[color:var(--color-light-1)]">
              {productsLoading ? "Loading..." : `${productsTotal} total`}
            </div>
          </div>
          <div className="p-4">
            {productsLoading ? (
              <div className="text-sm text-[color:var(--color-light-1)]">Loading...</div>
            ) : products.length === 0 ? (
              <div className="text-sm text-[color:var(--color-light-1)]">No products yet.</div>
            ) : (
              <div className="space-y-3">
                {products.map((p) => (
                  <Link
                    key={p._id}
                    href={`/dashboard/products/${p._id}`}
                    className="block rounded-xl border border-black/10 bg-white p-3 hover:bg-[color:var(--color-light-3)]/60"
                  >
                    <div className="text-sm font-medium text-foreground">{p.title || "Product"}</div>
                    <div className="mt-1 text-xs text-[color:var(--color-light-1)]">{p.duration || "—"}</div>
                    <div className="mt-1 text-sm font-semibold text-foreground">{fmtMoney(p.basePrice)}</div>
                  </Link>
                ))}
              </div>
            )}
            <div className="mt-4">
              <Link
                href="/dashboard/products"
                className="inline-block rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-[color:var(--color-light-3)]"
              >
                View all products
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
