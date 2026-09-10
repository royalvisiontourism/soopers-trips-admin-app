"use client";

import { useState } from "react";
import Link from "next/link";
import { pdf } from "@react-pdf/renderer";
import { TaxInvoicePDF } from "@/components/tax-invoice-pdf";
import { BookingInvoicePDF } from "@/components/booking-invoice-pdf";
import { CustomerVoucherPDF } from "@/components/customer-voucher-pdf";
import { notifyError } from "@/components/ui/toast";

function fDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function fDateTime(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMoney(amount, currency) {
  const value = Number(amount || 0);
  const curr = currency || "AED";
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: curr }).format(value);
  } catch {
    return `${value.toFixed(2)} ${curr}`;
  }
}

function formatPaymentMethod(method) {
  if (!method) return "N/A";
  return method
    .split("_")
    .map((word) => {
      if (word.length <= 3 && word === word.toUpperCase()) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

function formatCreatedBy(createdBy) {
  if (!createdBy) return "N/A";
  if (createdBy === "USER") return "Customer";
  return createdBy.charAt(0) + createdBy.slice(1).toLowerCase();
}

function getStatusColor(status) {
  const colors = {
    CONFIRMED: "bg-green-100 text-green-800 border-green-200",
    PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
    CANCELLED: "bg-red-100 text-red-800 border-red-200",
    COMPLETED: "bg-blue-100 text-blue-800 border-blue-200",
  };
  return colors[status] || "bg-gray-100 text-gray-800 border-gray-200";
}

function getPaymentStatusColor(status) {
  const colors = {
    PAID: "bg-green-100 text-green-800 border-green-200",
    PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
    FAILED: "bg-red-100 text-red-800 border-red-200",
    REFUNDED: "bg-blue-100 text-blue-800 border-blue-200",
  };
  return colors[status] || "bg-gray-100 text-gray-800 border-gray-200";
}

function getBookingTitle(booking) {
  if (booking?.bookingType === "PRODUCT" && booking?.productItems?.[0]) {
    return booking.productItems[0]?.product?.title || booking.productItems[0]?.title || "Product Booking";
  }
  if (booking?.bookingType === "PACKAGE" && booking?.packageItem) {
    return booking.packageItem?.package?.title || booking.packageItem?.package?.name || "Package Booking";
  }
  if (booking?.bookingType === "TICKET" && booking?.ticketItems?.[0]) {
    return booking.ticketItems[0]?.ticket?.title || booking.ticketItems[0]?.title || "Ticket Booking";
  }
  return `${booking?.bookingType || "Booking"} - ${booking?.bookingId || ""}`;
}

function getQuantity(booking) {
  if (booking?.bookingType === "PACKAGE") {
    return `${booking?.packageItem?.person || 0} person(s)`;
  }
  if (booking?.bookingType === "TICKET") {
    return `${booking?.ticketItems?.length || 0} ticket(s)`;
  }
  return `${booking?.productItems?.length || 0} item(s)`;
}

export default function BookingCard({ booking, onViewRow }) {
  const [expanded, setExpanded] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadingBookingInvoice, setDownloadingBookingInvoice] = useState(false);
  const [downloadingVoucher, setDownloadingVoucher] = useState(false);

  const handleDownloadTaxInvoice = async () => {
    if (!booking) return;
    setDownloading(true);
    try {
      let logoBase64 = null;
      if (typeof window !== "undefined") {
        try {
          const logoPath = `${window.location.origin}/img/general/logo.png`;
          const response = await fetch(logoPath);
          if (response.ok) {
            const blob = await response.blob();
            const reader = new FileReader();
            logoBase64 = await new Promise((resolve, reject) => {
              reader.onloadend = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
          }
        } catch (logoError) {
          console.warn("Could not load logo, PDF will be generated without logo:", logoError);
        }
      }
      const blob = await pdf(<TaxInvoicePDF booking={booking} logoUrl={logoBase64} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Tax_Invoice_${booking.bookingId || "INV"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
      notifyError("Failed to generate tax invoice");
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadBookingInvoice = async () => {
    if (!booking) return;
    setDownloadingBookingInvoice(true);
    try {
      let logoBase64 = null;
      if (typeof window !== "undefined") {
        try {
          const logoPath = `${window.location.origin}/img/general/logo.png`;
          const response = await fetch(logoPath);
          if (response.ok) {
            const blob = await response.blob();
            const reader = new FileReader();
            logoBase64 = await new Promise((resolve, reject) => {
              reader.onloadend = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
          }
        } catch (logoError) {
          console.warn("Could not load logo, PDF will be generated without logo:", logoError);
        }
      }
      const blob = await pdf(<BookingInvoicePDF booking={booking} logoUrl={logoBase64} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Booking_Invoice_${booking.bookingId || "INV"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
      notifyError("Failed to generate booking invoice");
    } finally {
      setDownloadingBookingInvoice(false);
    }
  };

  const handleDownloadCustomerVoucher = async () => {
    if (!booking) return;
    setDownloadingVoucher(true);
    try {
      let logoBase64 = null;
      if (typeof window !== "undefined") {
        try {
          const logoPath = `${window.location.origin}/img/general/logo.png`;
          const response = await fetch(logoPath);
          if (response.ok) {
            const blob = await response.blob();
            const reader = new FileReader();
            logoBase64 = await new Promise((resolve, reject) => {
              reader.onloadend = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
          }
        } catch (logoError) {
          console.warn("Could not load logo, PDF will be generated without logo:", logoError);
        }
      }
      const blob = await pdf(<CustomerVoucherPDF booking={booking} logoUrl={logoBase64} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Customer_Voucher_${booking.bookingId || "VCH"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
      notifyError("Failed to generate customer voucher");
    } finally {
      setDownloadingVoucher(false);
    }
  };

  const bookingTitle = getBookingTitle(booking);
  // Support both field name formats: soopers-trips-backend uses firstName/lastName/phone,
  // while the other backend uses customerName/customerPhone
  const customerName =
    booking?.guestInfo?.customerName ||
    [booking?.guestInfo?.firstName, booking?.guestInfo?.lastName].filter(Boolean).join(" ") ||
    booking?.user?.firstName
      ? [booking?.user?.firstName, booking?.user?.lastName].filter(Boolean).join(" ")
      : "N/A";
  const customerEmail = booking?.guestInfo?.email || booking?.user?.email || "";
  const customerPhone =
    booking?.guestInfo?.customerPhone ||
    booking?.guestInfo?.phone ||
    booking?.user?.phone ||
    "N/A";

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      {/* Title and Type */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-foreground mb-1 line-clamp-2">{bookingTitle}</h3>
          <p className="text-xs text-[color:var(--color-light-1)]">{booking?.bookingType || "N/A"}</p>
        </div>
        <Link
          href={`/dashboard/bookings/${booking.bookingId}`}
          className="ml-2 flex-shrink-0 rounded-lg p-1 text-[color:var(--color-light-1)] hover:bg-[color:var(--color-light-3)]"
          title="View details"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="1" />
            <circle cx="12" cy="5" r="1" />
            <circle cx="12" cy="19" r="1" />
          </svg>
        </Link>
      </div>

      {/* Status Badges */}
      <div className="mb-4 flex flex-wrap gap-2">
        <span className={`rounded-full border px-2 py-1 text-xs font-medium ${getStatusColor(booking?.status)}`}>
          Booking: {booking?.status || "N/A"}
        </span>
        <span className={`rounded-full border px-2 py-1 text-xs font-medium ${getPaymentStatusColor(booking?.payment?.status)}`}>
          Payment: {booking?.payment?.status || "N/A"}
        </span>
      </div>

      {/* Core Details */}
      <div className="mb-4 flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5 text-[color:var(--color-light-1)]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          <span>{booking?.bookingId || "N/A"}</span>
        </div>
        {booking?.createdAt && (
          <div className="flex items-center gap-1.5 text-[color:var(--color-light-1)]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>Booked: {fDate(booking.createdAt)}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-[color:var(--color-light-1)]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span>{getQuantity(booking)}</span>
        </div>
        <div className="text-sm font-semibold text-foreground">
          {formatMoney(booking?.totalAmount, booking?.currency)}
        </div>
      </div>

      {/* Footer with Customer Info and Actions */}
      <div className="border-t border-dashed border-black/10 pt-4 mt-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {customerName !== "N/A" && (
              <div className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[color:var(--color-light-1)]">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span className="text-foreground">{customerName}</span>
              </div>
            )}
            {customerEmail && (
              <div className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[color:var(--color-light-1)]">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <span className="text-foreground">{customerEmail}</span>
              </div>
            )}
            {customerPhone !== "N/A" && (
              <div className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[color:var(--color-light-1)]">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <span className="text-foreground">{customerPhone}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Booking Invoice Button - Hidden per request */}
            {/* <button
              type="button"
              onClick={handleDownloadBookingInvoice}
              disabled={downloadingBookingInvoice}
              className="cursor-pointer rounded-xl border border-black/10 bg-white px-3 py-1.5 text-xs font-medium text-foreground hover:bg-[color:var(--color-light-3)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {downloadingBookingInvoice ? "Generating..." : "Booking Invoice"}
            </button> */}
            <button
              type="button"
              onClick={handleDownloadTaxInvoice}
              disabled={downloading}
              className="cursor-pointer rounded-xl border border-black/10 bg-white px-3 py-1.5 text-xs font-medium text-foreground hover:bg-[color:var(--color-light-3)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {downloading ? "Generating..." : "Tax Invoice"}
            </button>
            <button
              type="button"
              onClick={handleDownloadCustomerVoucher}
              disabled={downloadingVoucher}
              className="cursor-pointer rounded-xl border border-black/10 bg-white px-3 py-1.5 text-xs font-medium text-foreground hover:bg-[color:var(--color-light-3)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {downloadingVoucher ? "Generating..." : "Customer Voucher"}
            </button>
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="cursor-pointer rounded-xl border border-black/10 bg-white px-3 py-1.5 text-xs font-medium text-foreground hover:bg-[color:var(--color-light-3)]"
            >
              {expanded ? "Hide details" : "Show details"}
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`ml-1 inline transition-transform ${expanded ? "rotate-180" : ""}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>
        </div>

        {/* Expandable Details Section */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-dashed border-black/10">
            <div className="space-y-4">
              {/* Product Items */}
              {booking?.bookingType === "PRODUCT" && booking?.productItems && booking.productItems.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3">
                    Product Items ({booking.productItems.length})
                  </h4>
                  <div className="space-y-3">
                    {booking.productItems.map((item, index) => {
                      const productTitle = item.product?.title || item.product?.name || item.title || `Product ${index + 1}`;
                      return (
                        <div key={item._id || index} className="rounded-xl border border-black/10 bg-[color:var(--color-light-3)]/30 p-4">
                          <div className="mb-3 flex items-start justify-between">
                            <div className="flex-1">
                              <h5 className="text-sm font-semibold text-foreground">{productTitle}</h5>
                              {item.product?.shortDescription && (
                                <p className="mt-1 text-xs text-[color:var(--color-light-1)]">{item.product.shortDescription}</p>
                              )}
                            </div>
                            <span className="rounded-full border border-black/10 bg-white px-2 py-1 text-xs font-medium text-foreground">
                              Item #{index + 1}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            {item.selectedDate && (
                              <div>
                                <div className="text-xs text-[color:var(--color-light-1)]">Activity Date</div>
                                <div className="text-sm text-foreground">{fDateTime(item.selectedDate)}</div>
                              </div>
                            )}
                            {item.product?.duration && (
                              <div>
                                <div className="text-xs text-[color:var(--color-light-1)]">Duration</div>
                                <div className="text-sm text-foreground">{item.product.duration}</div>
                              </div>
                            )}
                            <div>
                              <div className="text-xs text-[color:var(--color-light-1)]">Quantity</div>
                              <div className="text-sm text-foreground">{item.quantity || 1}</div>
                            </div>
                            <div>
                              <div className="text-xs text-[color:var(--color-light-1)]">Travelers</div>
                              <div className="text-xs text-foreground">
                                Adults: {item.adults || 0}, Children: {item.children || 0}, Infants: {item.infants || 0}
                              </div>
                            </div>
                          </div>
                          {item.transportation?.pickupAddress && (
                            <div className="mt-2 text-xs text-[color:var(--color-light-1)]">
                              Pickup: {item.transportation.pickupAddress}
                            </div>
                          )}
                          {item.addons && item.addons.length > 0 && (
                            <div className="mt-3">
                              <div className="text-xs font-medium text-foreground mb-2">Addons ({item.addons.length})</div>
                              <div className="space-y-1">
                                {item.addons.map((addon, addonIdx) => (
                                  <div key={addonIdx} className="flex items-center justify-between rounded border border-black/5 bg-white p-2">
                                    <div className="text-xs text-foreground">
                                      {addon.addon?.name || addon.name || "Addon"} × {addon.quantity || 1}
                                    </div>
                                    <div className="text-xs font-medium text-foreground">
                                      {formatMoney((addon.price || 0) * (addon.quantity || 1), booking.currency)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="mt-3 flex items-center justify-between border-t border-black/10 pt-3">
                            <div className="text-xs text-[color:var(--color-light-1)]">Base Price</div>
                            <div className="text-sm font-semibold text-foreground">{formatMoney(item.basePrice || 0, booking.currency)}</div>
                          </div>
                          {item.addonsPrice > 0 && (
                            <div className="mt-1 flex items-center justify-between">
                              <div className="text-xs text-[color:var(--color-light-1)]">Addons Price</div>
                              <div className="text-sm font-semibold text-foreground">{formatMoney(item.addonsPrice || 0, booking.currency)}</div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Guest Information */}
              {booking?.guestInfo && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3">Customer Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-lg border border-black/10 bg-[color:var(--color-light-3)]/30 p-4">
                    {customerName !== "N/A" && (
                      <div>
                        <div className="text-xs text-[color:var(--color-light-1)]">Name</div>
                        <div className="text-sm text-foreground">{customerName}</div>
                      </div>
                    )}
                    {customerEmail && (
                      <div>
                        <div className="text-xs text-[color:var(--color-light-1)]">Email</div>
                        <div className="text-sm text-foreground">{customerEmail}</div>
                      </div>
                    )}
                    {customerPhone !== "N/A" && (
                      <div>
                        <div className="text-xs text-[color:var(--color-light-1)]">Phone</div>
                        <div className="text-sm text-foreground">{customerPhone}</div>
                      </div>
                    )}
                    {booking.guestInfo.nationality && (
                      <div>
                        <div className="text-xs text-[color:var(--color-light-1)]">Nationality</div>
                        <div className="text-sm text-foreground">{booking.guestInfo.nationality}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
