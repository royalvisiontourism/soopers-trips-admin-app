"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { productApi } from "@/lib/api/productApi";
import { agentApi } from "@/lib/api/agentApi";
import httpClient from "@/lib/api/httpClient";
import countryCodes from "@/lib/data/country-codes.json";
import { notifyError, notifySuccess } from "@/components/ui/toast";

function formatMoney(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "-";
  return Number(value).toFixed(2);
}

function clamp(n, min, max) {
  const x = Number(n);
  if (Number.isNaN(x)) return min;
  return Math.min(Math.max(x, min), max);
}

function toISODate(date) {
  // date: yyyy-mm-dd
  if (!date) return "";
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
}

function toDateInputValue(date) {
  // returns yyyy-mm-dd
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function needsPickup(type) {
  return String(type || "").toLowerCase() !== "direct";
}

function getAvailableTypes(product) {
  const t = product?.transportation || {};
  const types = [];
  if (t.shared?.isEnabled) types.push("shared");
  if (t.private?.isEnabled) types.push("private");
  if (t.direct?.isEnabled) types.push("direct");
  if (t.fallbackPricing?.useFallback) types.push("fallback");
  return types;
}

function getSeasonsForType(product, type) {
  const t = product?.transportation || {};
  if (type === "fallback") return t.fallbackPricing?.seasons || [];
  return t?.[type]?.seasons || [];
}

function findSeasonForDate(seasons, dateStr) {
  if (!dateStr) return null;
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return (
    seasons.find((s) => {
      const start = s?.startDate ? new Date(s.startDate) : null;
      const end = s?.endDate ? new Date(s.endDate) : null;
      if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return d >= start && d <= end;
    }) || null
  );
}

function getDefaultDateForType(product, type) {
  const seasons = getSeasonsForType(product, type);
  if (!seasons.length) return "";

  const today = toDateInputValue(new Date());
  const todaySeason = findSeasonForDate(seasons, today);
  if (todaySeason) return today;

  // fallback to first season start date
  const firstStart = seasons[0]?.startDate ? toDateInputValue(seasons[0].startDate) : "";
  return firstStart || "";
}

function calculateBaseTotal({ season, type, passengers }) {
  if (!season) return 0;
  const p = passengers || { adult: 1, child: 0, infant: 0 };

  if (type === "shared" || type === "direct" || type === "fallback") {
    const pricing = season?.pricing || {};
    return (pricing.adult || 0) * (p.adult || 0) + (pricing.child || 0) * (p.child || 0) + (pricing.infant || 0) * (p.infant || 0);
  }

  if (type === "private") {
    const pricingMap = season?.selectedVehicle?.pricing || {};
    const adultCount = p.adult || 0;
    const capacities = Object.keys(pricingMap)
      .map(Number)
      .filter((x) => !Number.isNaN(x))
      .sort((a, b) => a - b);
    if (!capacities.length) return 0;

    let total = 0;
    let remaining = adultCount;
    while (remaining > 0) {
      let fit = capacities.find((cap) => cap >= remaining);
      if (!fit) fit = capacities[capacities.length - 1];
      total += pricingMap[String(fit)] || pricingMap[fit] || 0;
      remaining -= fit;
    }
    return total;
  }

  return 0;
}

function applyDiscount(amount, percent) {
  const p = Number(percent || 0);
  if (!p) return amount;
  return amount * (1 - p / 100);
}

function splitFullName(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

function getSelectedAddonsForSummary(product, st) {
  const addons = Array.isArray(product?.addons) ? product.addons : [];
  const selected = addons
    .map((a) => {
      const v = st?.addons?.[a?._id];
      if (!v?.selected) return null;
      const qty = Number(v?.quantity || 0);
      if (!qty) return null;
      const price = Number(a?.price || 0);
      return {
        id: a?._id,
        name: a?.name || "Addon",
        quantity: qty,
        price,
        total: qty * price,
      };
    })
    .filter(Boolean);

  return selected;
}

function AddonRow({ addon, value, onChange }) {
  const selected = Boolean(value?.selected);
  const qty = value?.quantity ?? 1;
  const img = addon?.image;

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-black/10 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
      <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-foreground">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => onChange({ ...value, selected: e.target.checked, quantity: value?.quantity ?? 1 })}
          className="h-4 w-4 rounded border-black/20"
        />
        <div className="h-10 w-10 overflow-hidden rounded-lg bg-[color:var(--color-light-3)]">
          {img ? <img src={img} alt={addon?.name || "Addon"} className="h-full w-full object-cover" loading="lazy" /> : null}
        </div>
        {addon?.name || "Addon"}
        <span className="ml-2 rounded-full bg-[color:var(--color-light-3)] px-2 py-0.5 text-xs text-[color:var(--color-light-1)]">
          AED {formatMoney(addon?.price)}
        </span>
      </label>

      <div className="flex items-center gap-2">
        <span className="text-xs text-[color:var(--color-light-1)]">Qty</span>
        <input
          type="number"
          min={1}
          value={qty}
          disabled={!selected}
          onChange={(e) => onChange({ ...value, selected: true, quantity: clamp(e.target.value, 1, 99) })}
          className="w-20 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none disabled:opacity-60"
        />
      </div>
    </div>
  );
}

export default function NewBookingPage() {
  const router = useRouter();
  const { cartItems, cartCount, clearCart, removeFromCart } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]); // [{id, product, assignment}]
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("CARD"); // CARD | CREDITS
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [modalPaymentMethod, setModalPaymentMethod] = useState("CARD"); // CARD | CREDITS

  // Coupon state (mirrors frontend-app flow)
  const [couponCode, setCouponCode] = useState("");
  const [couponData, setCouponData] = useState(null); // {code, discountType, discountValue, discountAmount, eligibleSubtotal, eligibleProductIds}
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState("");

  const [states, setStates] = useState({}); // keyed by productId
  const creditsBalance = Number(user?.agentProfile?.walletBalance || 0);
  
  // Customer information for agent bookings
  const [customerName, setCustomerName] = useState("");
  const [customerPhoneCountryCode, setCustomerPhoneCountryCode] = useState("+971");
  const [customerPhoneNumber, setCustomerPhoneNumber] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  
  const countryCodeOptions = countryCodes
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((c) => ({ value: c.dial_code, label: `${c.name} ${c.dial_code}`, code: c.code }));

  // Track inputs so we can scroll/focus to first invalid field on submit
  const fieldRefs = useRef({});
  const setFieldRef = (productId, field, el) => {
    if (!productId || !field) return;
    const key = `${productId}:${field}`;
    if (el) fieldRefs.current[key] = el;
    else delete fieldRefs.current[key];
  };

  const focusField = (productId, field) => {
    const key = productId ? `${productId}:${field}` : field;
    const el = fieldRefs.current[key];
    if (!el) return false;
    // Let React paint the error messages first
    requestAnimationFrame(() => {
      try {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        if (typeof el.focus === "function") el.focus();
      } catch {
        // ignore
      }
    });
    return true;
  };

  useEffect(() => {
    let alive = true;
    if (!cartItems.length) {
      setItems([]);
      return;
    }

    setLoading(true);
    Promise.all(
      cartItems.map(async (id) => {
        const [pRes, aRes] = await Promise.all([productApi.getById(id), agentApi.getMyAssignedProduct(id)]);
        return { id, product: pRes?.data?.data || null, assignment: aRes || null };
      })
    )
      .then((list) => {
        if (!alive) return;
        setItems(list);

        // init per-product booking state
        setStates((prev) => {
          const next = { ...prev };
          list.forEach(({ id, product, assignment }) => {
            if (next[id]) return;
            const types = getAvailableTypes(product);
            const initialType = types[0] || "";
            next[id] = {
              selectedType: initialType,
              selectedDate: getDefaultDateForType(product, initialType),
              passengers: { adult: 1, child: 0, infant: 0 },
              pickupAddress: "",
              notes: "",
              addons: {}, // addonId -> {selected, quantity}
              discountPercent: assignment?.discountPercent ?? 0,
              errors: {},
            };
          });
          return next;
        });
      })
      .catch((e) => notifyError(e))
      .finally(() => setLoading(false));

    return () => {
      alive = false;
    };
  }, [cartItems]);

  // If cart changes (add/remove), clear applied coupon to avoid stale eligibleSubtotal/discount.
  useEffect(() => {
    if (!couponData) return;
    setCouponData(null);
    setCouponError("");
    notifySuccess("Cart changed — coupon cleared.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartItems.join("|")]);

  const computed = useMemo(() => {
    const lines = items.map(({ id, product, assignment }) => {
      const st = states[id] || {};
      const types = getAvailableTypes(product);
      const type = st.selectedType;
      const seasons = getSeasonsForType(product, type);
      const season = findSeasonForDate(seasons, st.selectedDate);
      const baseTotal = calculateBaseTotal({ season, type, passengers: st.passengers });
      const discountPercent = assignment?.discountPercent ?? st.discountPercent ?? 0;
      const discountedBase = applyDiscount(baseTotal, discountPercent);

      // addons total (no discount for now)
      const productAddons = Array.isArray(product?.addons) ? product.addons : [];
      const addonsTotal = productAddons.reduce((sum, a) => {
        const v = st.addons?.[a?._id];
        if (!v?.selected) return sum;
        return sum + Number(a?.price || 0) * Number(v?.quantity || 0);
      }, 0);

      const total = discountedBase + addonsTotal;
      return {
        id,
        title: product?.title || id,
        type,
        date: st.selectedDate,
        discountPercent,
        baseTotal,
        discountedBase,
        addonsTotal,
        total,
        season,
      };
    });

    // Keep totals as "tax included" (same pattern as frontend-app):
    // totalAmount is the payable amount; taxAmount is displayed as included, not added on top.
    const subtotal = lines.reduce((s, l) => s + Number(l.total || 0), 0);
    const discountAmount = Number(couponData?.discountAmount || 0);
    const totalAfterDiscount = Math.max(0, subtotal - discountAmount);
    const taxAmount = totalAfterDiscount * 0.05;
    const totalAmount = totalAfterDiscount;
    return { lines, subtotal, discountAmount, taxAmount, totalAmount };
  }, [items, states, couponData]);

  const handleApplyCoupon = async () => {
    const code = String(couponCode || "").trim().toUpperCase();
    if (!code) {
      setCouponError("Please enter a coupon code");
      return;
    }

    setIsApplyingCoupon(true);
    setCouponError("");

    try {
      const orderTotal = Number(computed.subtotal || 0);
      const productIds = items.map((it) => it?.id).filter(Boolean);

      // 1) validate and get eligible IDs
      const first = await httpClient.post("/coupons/validate", {
        code,
        orderTotal,
        ...(productIds.length ? { productIds } : {}),
      });

      const eligibleProductIds = first?.data?.data?.eligibleProductIds || null;

      // eligible subtotal (only for eligible products if returned)
      let eligibleSubtotal = orderTotal;
      if (Array.isArray(eligibleProductIds) && eligibleProductIds.length) {
        const eligibleSet = new Set(eligibleProductIds.map(String));
        eligibleSubtotal = computed.lines.reduce((sum, l) => {
          if (eligibleSet.has(String(l.id))) return sum + Number(l.total || 0);
          return sum;
        }, 0);
      }

      // 2) validate again with eligibleSubtotal to get exact discount amount
      const second = await httpClient.post("/coupons/validate", {
        code,
        orderTotal,
        eligibleSubtotal,
        ...(productIds.length ? { productIds } : {}),
      });

      const payload = second?.data?.data;
      const discountAmount = Number(payload?.discountAmount || 0);

      setCouponData({
        code,
        discountType: payload?.discountType,
        discountValue: payload?.discountValue,
        discountAmount,
        eligibleSubtotal,
        eligibleProductIds,
      });

      notifySuccess("Coupon applied successfully!");
      setCouponCode("");
    } catch (e) {
      const msg = typeof e === "string" ? e : "Failed to apply coupon";
      setCouponError(msg);
      notifyError(msg);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponData(null);
    setCouponError("");
    notifySuccess("Coupon removed");
  };

  const setStateField = (productId, patch) => {
    setStates((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], ...patch, errors: { ...(prev[productId]?.errors || {}), ...(patch.errors || {}) } },
    }));
  };

  const validate = () => {
    let ok = true;
    const nextStates = { ...states };
    let firstInvalid = null; // { productId, field }

    items.forEach(({ id, product }) => {
      const st = nextStates[id] || {};
      const errs = {};
      if (!st.selectedType) errs.selectedType = "Select transportation type";
      if (!st.selectedDate) errs.selectedDate = "Select date";
      if (needsPickup(st.selectedType) && (!st.pickupAddress || st.pickupAddress.trim().length < 5)) {
        errs.pickupAddress = "Pickup address must be at least 5 characters";
      }
      // require at least 1 adult
      if (!st.passengers?.adult || Number(st.passengers.adult) <= 0) errs.passengers = "At least 1 adult is required";

      nextStates[id] = { ...st, errors: errs };
      if (Object.keys(errs).length) ok = false;

      // Capture first invalid field in a consistent order
      if (!firstInvalid) {
        if (errs.selectedDate) firstInvalid = { productId: id, field: "selectedDate" };
        else if (errs.selectedType) firstInvalid = { productId: id, field: "selectedType" };
        else if (errs.pickupAddress) firstInvalid = { productId: id, field: "pickupAddress" };
        else if (errs.passengers) firstInvalid = { productId: id, field: "adult" };
      }
    });

    // Validate customer info (required for agent bookings)
    if (!String(customerName || "").trim()) {
      ok = false;
      firstInvalid = firstInvalid || { productId: null, field: "customerName" };
    }
    if (!String(customerPhoneCountryCode || "").trim()) {
      ok = false;
      firstInvalid = firstInvalid || { productId: null, field: "customerPhoneCountryCode" };
    }
    if (!String(customerPhoneNumber || "").trim()) {
      ok = false;
      firstInvalid = firstInvalid || { productId: null, field: "customerPhoneNumber" };
    }

    // agent profile (used as guestInfo for agent bookings)
    const { firstName } = splitFullName(user?.name);
    if (!firstName) ok = false;
    if (!String(user?.email || "").trim()) ok = false;

    setStates(nextStates);
    if (!ok) notifyError("Please fill required fields.");

    if (!ok && firstInvalid) {
      // Try to focus; if we can't find a ref, at least scroll to top of card via date field attempt
      focusField(firstInvalid.productId, firstInvalid.field);
    }
    return ok;
  };

  const buildPayload = (methodOverride) => {
    const selectedMethod = methodOverride || paymentMethod;
    const { firstName, lastName } = splitFullName(customerName.trim() || user?.name || "");
    const productItems = items.map(({ id, product, assignment }) => {
      const st = states[id];
      const type = st.selectedType;
      const seasons = getSeasonsForType(product, type);
      const season = findSeasonForDate(seasons, st.selectedDate);
      const baseTotal = calculateBaseTotal({ season, type, passengers: st.passengers });
      const discountPercent = assignment?.discountPercent ?? st.discountPercent ?? 0;
      const discountedBase = applyDiscount(baseTotal, discountPercent);

      const addons = (Array.isArray(product?.addons) ? product.addons : [])
        .filter((a) => st.addons?.[a?._id]?.selected)
        .map((a) => ({
          addon: a._id,
          name: a?.name,
          quantity: Number(st.addons?.[a?._id]?.quantity || 0),
          price: Number(a?.price || 0),
        }))
        .filter((a) => a.quantity > 0);

      const addonsPrice = addons.reduce((s, a) => s + a.quantity * a.price, 0);

      return {
        product: product?._id,
        quantity: 1,
        selectedDate: st.selectedDate, // Send as YYYY-MM-DD string to avoid timezone conversion
        adults: Number(st.passengers?.adult || 0),
        children: type === "private" ? 0 : Number(st.passengers?.child || 0),
        infants: type === "private" ? 0 : Number(st.passengers?.infant || 0),
        notes: st.notes || "",
        transportation: {
          type: type ? String(type).toUpperCase() : null,
          pickupAddress: needsPickup(type) ? st.pickupAddress : null,
        },
        basePrice: Number(discountedBase),
        addons,
        addonsPrice,
      };
    });

    const subtotal = Number(computed.subtotal || 0);
    const taxAmount = Number(computed.taxAmount || 0);
    const totalAmount = Number(computed.totalAmount || 0);

    const coupon = couponData
      ? {
          code: couponData.code,
          discountType: couponData.discountType,
          discountValue: couponData.discountValue,
          discountAmount: Number(couponData.discountAmount || 0),
          eligibleSubtotal: Number(couponData.eligibleSubtotal || 0),
        }
      : null;

    const payment =
      selectedMethod === "CREDITS"
        ? { method: "CREDITS", credits: { amount: totalAmount } }
        : { method: "CC_AVENUE" };

    return {
      bookingType: "PRODUCT",
      source: "AGENT_PORTAL",
      createdBy: "AGENT",
      guestInfo: {
        firstName: String(firstName || "").trim(),
        lastName: String(lastName || "").trim(),
        email: String(user?.email || "").trim(),
        phone: String(`${customerPhoneCountryCode || ""}${customerPhoneNumber || ""}`.replace(/\s/g, "")).trim(),
        nationality: null,
        customerName: String(customerName || "").trim(),
        customerPhone: String(`${customerPhoneCountryCode || ""}${customerPhoneNumber || ""}`.replace(/\s/g, "")).trim(),
        customerPhoneCountryCode: String(customerPhoneCountryCode || "").trim(),
        customerPhoneNumber: String(customerPhoneNumber || "").replace(/\s/g, "").trim(),
        ...(String(referenceNumber || "").trim() ? { referenceNumber: String(referenceNumber).trim() } : {}),
      },
      productItems,
      currency: "AED",
      subtotal,
      taxAmount,
      totalAmount,
      payment,
      ...(coupon ? { coupon } : {}),
    };
  };

  const onSubmitBooking = async (methodOverride) => {
    const selectedMethod = methodOverride || paymentMethod;
    if (!validate()) return;
    setSubmitting(true);
    try {
      const needed = Number(computed.totalAmount || 0);
      if (selectedMethod === "CREDITS" && creditsBalance + 0.01 < needed) {
        notifyError(`Your credits balance is low (AED ${formatMoney(creditsBalance)}). Please pay with card.`);
        setPaymentMethod("CARD");
        return;
      }

      // Keep the selection in sync for UI
      setPaymentMethod(selectedMethod);

      const payload = buildPayload(selectedMethod);
      const res = await httpClient.post("/bookings/agent", payload);
      const created = res?.data?.data;
      const bookingMongoId = created?._id;
      const bookingCode = created?.bookingId;

      // For credits bookings, backend may mark as PAID/CONFIRMED immediately.
      if (selectedMethod === "CREDITS") {
        notifySuccess(bookingCode ? `Booking created: ${bookingCode}` : "Booking created successfully.");
        clearCart();
        router.push("/dashboard/bookings");
        return;
      }

      // Card flow (same as frontend-app):
      // Call /payments/ccavenue/initiate and render returned auto-submit HTML.
      if (!bookingMongoId) {
        throw new Error("Booking created but booking _id was not returned.");
      }

      notifySuccess("Redirecting to payment gateway...");
      const paymentRes = await httpClient.post(
        "/payments/ccavenue/initiate",
        { bookingId: bookingMongoId },
        { responseType: "text" }
      );

      // Clear cart after booking is created (same as frontend behavior).
      clearCart();

      const html = paymentRes?.data;
      if (typeof html === "string" && typeof document !== "undefined") {
        document.open();
        document.write(html);
        document.close();
        return;
      }

      throw new Error("Payment gateway response was not valid HTML.");
    } catch (e) {
      notifyError(e);
    } finally {
      setSubmitting(false);
    }
  };

  if (!cartCount) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-foreground">New Booking</h1>
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="text-sm text-[color:var(--color-light-1)]">Your cart is empty. Add products first.</div>
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
          <h1 className="text-2xl font-semibold text-foreground">New Booking</h1>
          <p className="mt-1 text-sm text-[color:var(--color-light-1)]">Build a product booking from your cart.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/cart" className="cursor-pointer rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-[color:var(--color-light-3)]">
            Back to Cart
          </Link>
          <button
            type="button"
            onClick={clearCart}
            className="cursor-pointer rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-[color:var(--color-light-3)]"
          >
            Clear Cart
          </button>
        </div>
      </div>

      {loading ? <div className="text-sm text-[color:var(--color-light-1)]">Loading products...</div> : null}

      {/* Customer Information Section */}
      <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Customer Information</h2>
        <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-foreground">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                ref={(el) => {
                  if (el) fieldRefs.current['customerName'] = el;
                }}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer full name"
                className={`mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none ${
                  !customerName.trim() ? 'border-red-300' : 'border-black/10 focus:border-black/30'
                }`}
              />
            </div>
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground">
                  Country <span className="text-red-500">*</span>
                </label>
                <select
                  ref={(el) => {
                    if (el) fieldRefs.current['customerPhoneCountryCode'] = el;
                  }}
                  value={customerPhoneCountryCode}
                  onChange={(e) => setCustomerPhoneCountryCode(e.target.value)}
                  className={`mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none ${
                    !customerPhoneCountryCode ? 'border-red-300' : 'border-black/10 focus:border-black/30'
                  }`}
                >
                  <option value="">Select country</option>
                  {countryCodeOptions.map((opt) => (
                    <option key={opt.code} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  ref={(el) => {
                    if (el) fieldRefs.current['customerPhoneNumber'] = el;
                  }}
                  value={customerPhoneNumber}
                  onChange={(e) => setCustomerPhoneNumber(e.target.value.replace(/\D/g, ""))}
                  placeholder="e.g. 501234567"
                  className={`mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none ${
                    !customerPhoneNumber.trim() ? 'border-red-300' : 'border-black/10 focus:border-black/30'
                  }`}
                />
                {customerPhoneCountryCode && customerPhoneNumber && (
                  <div className="mt-1 text-xs text-[color:var(--color-light-1)]">
                    {customerPhoneCountryCode}{customerPhoneNumber}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">
                Reference Number
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g. agent ref, order ref (optional)"
                className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/30"
              />
              <div className="mt-1 text-xs text-[color:var(--color-light-1)]">
                Optional — for your internal reference
              </div>
            </div>
        </div>
      </div>

      {/* Products */}
      <div className="space-y-4">
        {items.map(({ id, product }) => {
          const st = states[id] || {};
          const types = getAvailableTypes(product);
          const addons = Array.isArray(product?.addons) ? product.addons : [];
          const line = computed.lines.find((l) => l.id === id);

          return (
            <div key={id} className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-24 overflow-hidden rounded-xl bg-[color:var(--color-light-3)]">
                    {product?.coverImage ? <img src={product.coverImage} alt={product?.title || "Product"} className="h-full w-full object-cover" /> : null}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">{product?.title || id}</div>
                    <div className="mt-1 text-xs text-[color:var(--color-light-1)]">{product?.slug || ""}</div>
                    {st.errors?.passengers ? <div className="mt-1 text-xs text-red-600">{st.errors.passengers}</div> : null}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="rounded-xl bg-[color:var(--color-light-3)] px-4 py-2 text-sm text-foreground">
                    Line Total: <span className="font-semibold">{formatMoney(line?.total)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromCart(id)}
                    className="cursor-pointer rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-medium text-foreground hover:bg-[color:var(--color-light-3)]"
                    title="Remove from cart"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground">Tour Date *</label>
                    <input
                      type="date"
                      ref={(el) => setFieldRef(id, "selectedDate", el)}
                      value={st.selectedDate || ""}
                      onChange={(e) => setStateField(id, { selectedDate: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none"
                    />
                    {st.errors?.selectedDate ? <div className="mt-1 text-xs text-red-600">{st.errors.selectedDate}</div> : null}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground">Transportation Type *</label>
                    <select
                      ref={(el) => setFieldRef(id, "selectedType", el)}
                      value={st.selectedType || ""}
                      onChange={(e) => {
                        const nextType = e.target.value;
                        const nextDate = st.selectedDate || getDefaultDateForType(product, nextType);
                        setStateField(id, { selectedType: nextType, selectedDate: nextDate });
                      }}
                      className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none"
                    >
                      <option value="" disabled>
                        Select type
                      </option>
                      {types.map((t) => (
                        <option key={t} value={t}>
                          {t.toUpperCase()}
                        </option>
                      ))}
                    </select>
                    {st.errors?.selectedType ? <div className="mt-1 text-xs text-red-600">{st.errors.selectedType}</div> : null}
                  </div>

                  {/* Price row (full width) */}
                  <div className="rounded-2xl border border-black/10 bg-[color:var(--color-light-3)] p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-sm font-semibold text-foreground">Price</div>
                      {line?.season ? (
                        <div className="text-xs text-[color:var(--color-light-1)]">
                          Season: {toDateInputValue(line.season.startDate)} → {toDateInputValue(line.season.endDate)}
                        </div>
                      ) : (
                        <div className="text-xs text-amber-700">No season found for selected date</div>
                      )}
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="rounded-xl bg-white p-3">
                        <div className="text-xs text-[color:var(--color-light-1)]">Tour Price</div>
                        <div className="mt-1 text-sm font-semibold text-foreground">{formatMoney(line?.discountedBase)}</div>
                      </div>
                      <div className="rounded-xl bg-white p-3">
                        <div className="text-xs text-[color:var(--color-light-1)]">Addons</div>
                        <div className="mt-1 text-sm font-semibold text-foreground">{formatMoney(line?.addonsTotal)}</div>
                      </div>
                      <div className="rounded-xl bg-white p-3">
                        <div className="text-xs text-[color:var(--color-light-1)]">Total</div>
                        <div className="mt-1 text-sm font-semibold text-foreground">{formatMoney(line?.total)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-foreground">Adults *</label>
                      <input
                        type="number"
                        min={1}
                        ref={(el) => setFieldRef(id, "adult", el)}
                        value={st.passengers?.adult ?? 1}
                        onChange={(e) =>
                          setStateField(id, { passengers: { ...(st.passengers || {}), adult: clamp(e.target.value, 1, 99) } })
                        }
                        className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground">Children</label>
                      <input
                        type="number"
                        min={0}
                        value={st.passengers?.child ?? 0}
                        disabled={st.selectedType === "private"}
                        onChange={(e) =>
                          setStateField(id, { passengers: { ...(st.passengers || {}), child: clamp(e.target.value, 0, 99) } })
                        }
                        className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none disabled:opacity-60"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground">Infants</label>
                      <input
                        type="number"
                        min={0}
                        value={st.passengers?.infant ?? 0}
                        disabled={st.selectedType === "private"}
                        onChange={(e) =>
                          setStateField(id, { passengers: { ...(st.passengers || {}), infant: clamp(e.target.value, 0, 99) } })
                        }
                        className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none disabled:opacity-60"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {needsPickup(st.selectedType) ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-foreground">Pickup Address *</label>
                        <input
                          ref={(el) => setFieldRef(id, "pickupAddress", el)}
                          value={st.pickupAddress || ""}
                          onChange={(e) => setStateField(id, { pickupAddress: e.target.value })}
                          className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none"
                          placeholder="Hotel / location"
                        />
                        {st.errors?.pickupAddress ? <div className="mt-1 text-xs text-red-600">{st.errors.pickupAddress}</div> : null}
                      </div>
                    </>
                  ) : (
                    <div className="rounded-xl border border-black/10 bg-[color:var(--color-light-3)] p-3 text-sm text-[color:var(--color-light-1)]">
                      Pickup not required for <span className="font-medium text-foreground">DIRECT</span> transport.
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-foreground">Notes (optional)</label>
                    <textarea
                      rows={3}
                      value={st.notes || ""}
                      onChange={(e) => setStateField(id, { notes: e.target.value })}
                      className="mt-1 w-full resize-none rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none"
                    />
                  </div>
                </div>
              </div>

              {addons.length ? (
                <div className="mt-4">
                  <div className="text-sm font-semibold text-foreground">Addons</div>
                  <div className="mt-3 grid grid-cols-1 gap-3">
                    {addons.map((a) => (
                      <AddonRow
                        key={a._id}
                        addon={a}
                        value={st.addons?.[a._id] || { selected: false, quantity: 1 }}
                        onChange={(val) => setStateField(id, { addons: { ...(st.addons || {}), [a._id]: val } })}
                      />
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-[color:var(--color-light-1)]">
                    Note: discount is applied to the tour price; addons are currently added at their listed price.
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-foreground">Summary</h2>
          <div className="text-right">
            <div className="rounded-xl bg-[color:var(--color-light-3)] px-4 py-2 text-sm text-foreground">
              Total Amount: <span className="font-semibold">{formatMoney(computed.totalAmount)}</span>
            </div>
            <div className="mt-1 text-xs text-[color:var(--color-light-1)]">Tax (5% included): AED {formatMoney(computed.taxAmount)}</div>
            {couponData ? (
              <div className="mt-1 text-xs text-[color:var(--color-light-1)]">
                Coupon <span className="font-semibold text-foreground">{couponData.code}</span> · Discount: AED {formatMoney(computed.discountAmount)}
              </div>
            ) : null}
          </div>
        </div>

        {/* Coupon */}
        <div className="mt-4 rounded-xl border border-black/10 bg-[color:var(--color-light-3)] p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm font-semibold text-foreground">Apply Coupon</div>
            {couponData ? null : null}
          </div>

          {!couponData ? (
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value.toUpperCase());
                  setCouponError("");
                }}
                placeholder="Enter coupon code"
                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none"
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                disabled={isApplyingCoupon}
                className="cursor-pointer rounded-xl bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {isApplyingCoupon ? "Applying..." : "Apply"}
              </button>
            </div>
          ) : (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-2 text-sm text-foreground">
                <span className="text-xs text-[color:var(--color-light-1)]">Applied</span>
                <span className="font-semibold">{couponData.code}</span>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="ml-1 inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-black/10 bg-[color:var(--color-light-3)] text-xs text-foreground hover:bg-black hover:text-white"
                  aria-label="Remove coupon"
                  title="Remove coupon"
                >
                  ×
                </button>
              </div>
              <div className="text-xs text-[color:var(--color-light-1)]">
                Discount: <span className="font-semibold text-foreground">AED {formatMoney(computed.discountAmount)}</span>
              </div>
            </div>
          )}

          {couponError ? <div className="mt-2 text-xs text-red-600">{couponError}</div> : null}

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="rounded-xl bg-white px-3 py-2">
              <div className="text-[11px] text-[color:var(--color-light-1)]">Subtotal</div>
              <div className="text-sm font-semibold text-foreground">AED {formatMoney(computed.subtotal)}</div>
            </div>
            <div className="rounded-xl bg-white px-3 py-2">
              <div className="text-[11px] text-[color:var(--color-light-1)]">Discount</div>
              <div className="text-sm font-semibold text-foreground">AED {formatMoney(computed.discountAmount)}</div>
            </div>
            <div className="rounded-xl bg-white px-3 py-2">
              <div className="text-[11px] text-[color:var(--color-light-1)]">Total Amount</div>
              <div className="text-sm font-semibold text-foreground">AED {formatMoney(computed.totalAmount)}</div>
            </div>
          </div>

          <div className="mt-2 text-xs text-[color:var(--color-light-1)]">Tax (5% included): AED {formatMoney(computed.taxAmount)}</div>
        </div>

        <div className="mt-4 divide-y divide-black/5 rounded-xl border border-black/10">
          {computed.lines.map((l) => {
            const row = items.find((it) => it.id === l.id);
            const product = row?.product;
            const st = states[l.id] || {};
            const selectedAddons = getSelectedAddonsForSummary(product, st);

            return (
              <div key={l.id} className="px-4 py-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-foreground">{l.title}</div>
                    <div className="mt-1 text-xs text-[color:var(--color-light-1)]">
                      {l.type ? l.type.toUpperCase() : "—"} · {l.date || "Select date"}
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <div className="rounded-xl bg-[color:var(--color-light-3)] px-3 py-2">
                        <div className="text-[11px] text-[color:var(--color-light-1)]">Tour</div>
                        <div className="text-sm font-semibold text-foreground">AED {formatMoney(l.discountedBase)}</div>
                      </div>
                      <div className="rounded-xl bg-[color:var(--color-light-3)] px-3 py-2">
                        <div className="text-[11px] text-[color:var(--color-light-1)]">Addons</div>
                        <div className="text-sm font-semibold text-foreground">AED {formatMoney(l.addonsTotal)}</div>
                      </div>
                      <div className="rounded-xl bg-[color:var(--color-light-3)] px-3 py-2">
                        <div className="text-[11px] text-[color:var(--color-light-1)]">Line Total</div>
                        <div className="text-sm font-semibold text-foreground">AED {formatMoney(l.total)}</div>
                      </div>
                    </div>

                    {selectedAddons.length ? (
                      <div className="mt-3">
                        <div className="text-xs font-semibold text-foreground">Selected Addons</div>
                        <div className="mt-2 space-y-1">
                          {selectedAddons.map((a) => (
                            <div key={a.id} className="flex items-center justify-between text-xs text-foreground">
                              <div className="min-w-0 truncate">
                                {a.name} <span className="text-[color:var(--color-light-1)]">× {a.quantity}</span>
                              </div>
                              <div className="whitespace-nowrap text-[color:var(--color-light-1)]">
                                AED {formatMoney(a.price)} / ea ·{" "}
                                <span className="font-semibold text-foreground">AED {formatMoney(a.total)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="text-sm font-semibold text-foreground sm:pt-1">AED {formatMoney(l.total)}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 space-y-3">
          <button
            type="button"
            onClick={() => {
              setModalPaymentMethod("CARD");
              setPaymentModalOpen(true);
            }}
            disabled={submitting || loading}
            className="cursor-pointer rounded-xl bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Submit Booking"}
          </button>
        </div>
      </div>

      {/* Payment Method Modal */}
      {paymentModalOpen ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Choose payment method"
          onMouseDown={(e) => {
            // Close when clicking the backdrop
            if (e.target === e.currentTarget) setPaymentModalOpen(false);
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-semibold text-foreground">Choose Payment Method</div>
                <div className="mt-1 text-xs text-[color:var(--color-light-1)]">
                  Total Amount: <span className="font-semibold text-foreground">AED {formatMoney(computed.totalAmount)}</span> · Tax (5% included): AED{" "}
                  {formatMoney(computed.taxAmount)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-black/10 bg-white text-foreground hover:bg-[color:var(--color-light-3)]"
                aria-label="Close"
                title="Close"
              >
                ×
              </button>
            </div>

            <div className="mt-4 space-y-2">
              <button
                type="button"
                onClick={() => setModalPaymentMethod("CARD")}
                className={`w-full cursor-pointer rounded-xl border px-4 py-3 text-left text-sm font-medium ${
                  modalPaymentMethod === "CARD"
                    ? "border-black bg-black text-white"
                    : "border-black/10 bg-white text-foreground hover:bg-[color:var(--color-light-3)]"
                }`}
              >
                Pay with Card
                <div className={`mt-1 text-xs ${modalPaymentMethod === "CARD" ? "text-white/80" : "text-[color:var(--color-light-1)]"}`}>
                  Redirects to payment gateway (CCAvenue)
                </div>
              </button>

              <button
                type="button"
                disabled={creditsBalance + 0.01 < Number(computed.totalAmount || 0)}
                onClick={() => setModalPaymentMethod("CREDITS")}
                className={`w-full cursor-pointer rounded-xl border px-4 py-3 text-left text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60 ${
                  modalPaymentMethod === "CREDITS"
                    ? "border-black bg-black text-white"
                    : "border-black/10 bg-white text-foreground hover:bg-[color:var(--color-light-3)]"
                }`}
              >
                Pay with Credits
                <div className={`mt-1 text-xs ${modalPaymentMethod === "CREDITS" ? "text-white/80" : "text-[color:var(--color-light-1)]"}`}>
                  Credits balance: AED {formatMoney(creditsBalance)}
                </div>
              </button>
            </div>

            {creditsBalance + 0.01 < Number(computed.totalAmount || 0) ? (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Your credits balance is low. Please pay with <span className="font-semibold">Card</span>.
              </div>
            ) : null}

            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                className="cursor-pointer rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-[color:var(--color-light-3)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setPaymentModalOpen(false);
                  await onSubmitBooking(modalPaymentMethod);
                }}
                className="cursor-pointer rounded-xl bg-black px-4 py-2 text-sm font-medium text-white"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

