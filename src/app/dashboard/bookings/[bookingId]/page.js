"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { bookingApi } from "@/lib/api/bookingApi";
import { notifyError } from "@/components/ui/toast";
import { pdf } from "@react-pdf/renderer";
import { TaxInvoicePDF } from "@/components/tax-invoice-pdf";
import { BookingInvoicePDF } from "@/components/booking-invoice-pdf";
import { CustomerVoucherPDF } from "@/components/customer-voucher-pdf";

export default function BookingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params?.bookingId;

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadingBookingInvoice, setDownloadingBookingInvoice] = useState(false);
  const [downloadingVoucher, setDownloadingVoucher] = useState(false);

  const fmtMoney = (amount, currency) => {
    const value = Number(amount || 0);
    const curr = currency || "AED";
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

  const fmtDate = (value) => {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-green-100 text-green-800 border-green-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-200";
      case "COMPLETED":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-800 border-green-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "FAILED":
        return "bg-red-100 text-red-800 border-red-200";
      case "REFUNDED":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  useEffect(() => {
    if (!bookingId) return;

    let isMounted = true;
    const fetchBooking = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await bookingApi.getBookingDetails(bookingId);
        const data = res?.data?.data || res?.data;
        if (!isMounted) return;
        setBooking(data);
      } catch (e) {
        if (!isMounted) return;
        notifyError(e);
        setError("Failed to load booking details");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchBooking();
    return () => {
      isMounted = false;
    };
  }, [bookingId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-lg font-medium text-foreground">Loading booking details...</div>
          <div className="text-sm text-[color:var(--color-light-1)]">Please wait</div>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Booking Details</h1>
            <p className="mt-1 text-sm text-[color:var(--color-light-1)]">View detailed information about a booking</p>
          </div>
          <Link
            href="/dashboard/bookings"
            className="cursor-pointer rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-[color:var(--color-light-3)]"
          >
            Back to Bookings
          </Link>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <div className="mb-2 text-lg font-medium text-red-800">{error || "Booking not found"}</div>
          <div className="text-sm text-red-600">The booking you're looking for doesn't exist or you don't have access to it.</div>
        </div>
      </div>
    );
  }

  const handleDownloadTaxInvoice = async () => {
    if (!booking) return;
    
    setDownloading(true);
    try {
      // Convert logo to base64 for @react-pdf/renderer
      let logoBase64 = null;
      if (typeof window !== 'undefined') {
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
          console.warn('Could not load logo, PDF will be generated without logo:', logoError);
        }
      }
      
      const blob = await pdf(<TaxInvoicePDF booking={booking} logoUrl={logoBase64} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Tax_Invoice_${booking.bookingId || 'INV'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      notifyError('Failed to generate tax invoice');
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadBookingInvoice = async () => {
    if (!booking) return;
    
    setDownloadingBookingInvoice(true);
    try {
      // Convert logo to base64 for @react-pdf/renderer
      let logoBase64 = null;
      if (typeof window !== 'undefined') {
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
          console.warn('Could not load logo, PDF will be generated without logo:', logoError);
        }
      }
      
      const blob = await pdf(<BookingInvoicePDF booking={booking} logoUrl={logoBase64} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Booking_Invoice_${booking.bookingId || 'INV'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      notifyError('Failed to generate booking invoice');
    } finally {
      setDownloadingBookingInvoice(false);
    }
  };

  const handleDownloadCustomerVoucher = async () => {
    if (!booking) return;
    
    setDownloadingVoucher(true);
    try {
      // Convert logo to base64 for @react-pdf/renderer
      let logoBase64 = null;
      if (typeof window !== 'undefined') {
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
          console.warn('Could not load logo, PDF will be generated without logo:', logoError);
        }
      }
      
      const blob = await pdf(<CustomerVoucherPDF booking={booking} logoUrl={logoBase64} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Customer_Voucher_${booking.bookingId || 'VCH'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      notifyError('Failed to generate customer voucher');
    } finally {
      setDownloadingVoucher(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Booking Details</h1>
          <p className="mt-1 text-sm text-[color:var(--color-light-1)]">View detailed information about booking {booking.bookingId}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Booking Invoice Button - Hidden per request */}
          {/* <button
            onClick={handleDownloadBookingInvoice}
            disabled={downloadingBookingInvoice}
            className="cursor-pointer rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-[color:var(--color-light-3)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {downloadingBookingInvoice ? 'Generating...' : 'Booking Invoice'}
          </button> */}
          <button
            onClick={handleDownloadTaxInvoice}
            disabled={downloading}
            className="cursor-pointer rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-[color:var(--color-light-3)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {downloading ? 'Generating...' : 'Tax Invoice'}
          </button>
          <button
            onClick={handleDownloadCustomerVoucher}
            disabled={downloadingVoucher}
            className="cursor-pointer rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-[color:var(--color-light-3)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {downloadingVoucher ? 'Generating...' : 'Customer Voucher'}
          </button>
          <Link
            href="/dashboard/bookings"
            className="cursor-pointer rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-[color:var(--color-light-3)]"
          >
            Back to Bookings
          </Link>
        </div>
      </div>

      {/* Booking Overview */}
      <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-4 border-b border-black/10 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <div>
              <h2 className="text-xl font-semibold text-foreground">{booking.bookingId}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium text-foreground">
                  {booking.bookingType || "N/A"}
                </span>
                <span className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusColor(booking.status)}`}>
                  {booking.status || "N/A"}
                </span>
                {booking.payment?.status && (
                  <span className={`rounded-full border px-3 py-1 text-xs font-medium ${getPaymentStatusColor(booking.payment.status)}`}>
                    Payment: {booking.payment.status}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-semibold text-foreground">{fmtMoney(booking.totalAmount, booking.currency)}</div>
            <div className="mt-1 text-sm text-[color:var(--color-light-1)]">Created: {fmtDateTime(booking.createdAt)}</div>
          </div>
        </div>

        {/* Customer Details */}
        {(booking.guestInfo || booking.user) && (
          <div className="mb-6 border-b border-black/10 pb-6">
            <h3 className="mb-4 text-lg font-semibold text-foreground">Customer Details</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {(() => {
                const name =
                  booking.guestInfo?.customerName ||
                  [booking.guestInfo?.firstName, booking.guestInfo?.lastName].filter(Boolean).join(" ") ||
                  [booking.user?.firstName, booking.user?.lastName].filter(Boolean).join(" ");
                return name ? (
                  <div>
                    <div className="text-xs font-medium text-[color:var(--color-light-1)]">Name</div>
                    <div className="mt-1 text-sm text-foreground">{name}</div>
                  </div>
                ) : null;
              })()}
              {(booking.guestInfo?.email || booking.user?.email) && (
                <div>
                  <div className="text-xs font-medium text-[color:var(--color-light-1)]">Email</div>
                  <div className="mt-1 text-sm text-foreground">{booking.guestInfo?.email || booking.user?.email}</div>
                </div>
              )}
              {(booking.guestInfo?.customerPhone || booking.guestInfo?.phone || booking.user?.phone) && (
                <div>
                  <div className="text-xs font-medium text-[color:var(--color-light-1)]">Phone</div>
                  <div className="mt-1 text-sm text-foreground">{booking.guestInfo?.customerPhone || booking.guestInfo?.phone || booking.user?.phone}</div>
                </div>
              )}
              {booking.guestInfo?.nationality && (
                <div>
                  <div className="text-xs font-medium text-[color:var(--color-light-1)]">Nationality</div>
                  <div className="mt-1 text-sm text-foreground">{booking.guestInfo.nationality}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payment Information */}
        {booking.payment && (
          <div className="mb-6 border-b border-black/10 pb-6">
            <h3 className="mb-4 text-lg font-semibold text-foreground">Payment Information</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <div className="text-xs font-medium text-[color:var(--color-light-1)]">Payment Status</div>
                <div className="mt-1">
                  <span className={`inline-block rounded-full border px-3 py-1 text-xs font-medium ${getPaymentStatusColor(booking.payment.status)}`}>
                    {booking.payment.status || "N/A"}
                  </span>
                </div>
              </div>
              {booking.payment.method && (
                <div>
                  <div className="text-xs font-medium text-[color:var(--color-light-1)]">Payment Method</div>
                  <div className="mt-1 text-sm text-foreground">
                    {booking.payment.method
                      .split("_")
                      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                      .join(" ")}
                  </div>
                </div>
              )}
              {booking.payment.transactionId && (
                <div>
                  <div className="text-xs font-medium text-[color:var(--color-light-1)]">Transaction ID</div>
                  <div className="mt-1 text-sm text-foreground">{booking.payment.transactionId}</div>
                </div>
              )}
              {booking.payment.credits?.amount && (
                <div>
                  <div className="text-xs font-medium text-[color:var(--color-light-1)]">Credits Used</div>
                  <div className="mt-1 text-sm text-foreground">{fmtMoney(booking.payment.credits.amount, booking.currency)}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Package Details */}
        {booking.bookingType === "PACKAGE" && booking.packageItem && (
          <div className="mb-6 border-b border-black/10 pb-6">
            <h3 className="mb-4 text-lg font-semibold text-foreground">Package Details</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {booking.packageItem.startDate && (
                <div>
                  <div className="text-xs font-medium text-[color:var(--color-light-1)]">Start Date</div>
                  <div className="mt-1 text-sm text-foreground">{fmtDate(booking.packageItem.startDate)}</div>
                </div>
              )}
              {booking.packageItem.endDate && (
                <div>
                  <div className="text-xs font-medium text-[color:var(--color-light-1)]">End Date</div>
                  <div className="mt-1 text-sm text-foreground">{fmtDate(booking.packageItem.endDate)}</div>
                </div>
              )}
              {booking.packageItem.person && (
                <div>
                  <div className="text-xs font-medium text-[color:var(--color-light-1)]">Persons</div>
                  <div className="mt-1 text-sm text-foreground">{booking.packageItem.person}</div>
                </div>
              )}
              {booking.packageItem.package?.duration && (
                <div>
                  <div className="text-xs font-medium text-[color:var(--color-light-1)]">Duration</div>
                  <div className="mt-1 text-sm text-foreground">{booking.packageItem.package.duration}</div>
                </div>
              )}
              {booking.packageItem.transportation?.pickupAddress && (
                <div className="sm:col-span-2">
                  <div className="text-xs font-medium text-[color:var(--color-light-1)]">Pickup Address</div>
                  <div className="mt-1 text-sm text-foreground">{booking.packageItem.transportation.pickupAddress}</div>
                  {booking.packageItem.transportation.pickupTime && (
                    <div className="mt-1 text-xs text-[color:var(--color-light-1)]">
                      Pickup Time: {fmtDateTime(booking.packageItem.transportation.pickupTime)}
                    </div>
                  )}
                </div>
              )}
              {booking.packageItem.notes && (
                <div className="sm:col-span-2 lg:col-span-3">
                  <div className="text-xs font-medium text-[color:var(--color-light-1)]">Notes</div>
                  <div className="mt-1 text-sm text-foreground">{booking.packageItem.notes}</div>
                </div>
              )}
            </div>
            {booking.packageItem.addons && booking.packageItem.addons.length > 0 && (
              <div className="mt-4">
                <div className="mb-2 text-sm font-medium text-foreground">Addons ({booking.packageItem.addons.length})</div>
                <div className="space-y-2">
                  {booking.packageItem.addons.map((addon, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-lg border border-black/10 bg-[color:var(--color-light-3)]/30 p-2">
                      <div>
                        <div className="text-sm font-medium text-foreground">{addon.addon?.name || addon.name || "Addon"}</div>
                        <div className="text-xs text-[color:var(--color-light-1)]">
                          Quantity: {addon.quantity || 1} × {fmtMoney(addon.price || 0, booking.currency)}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-foreground">
                        {fmtMoney((addon.price || 0) * (addon.quantity || 1), booking.currency)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Product Items */}
        {booking.bookingType === "PRODUCT" && booking.productItems && booking.productItems.length > 0 && (
          <div className="mb-6 border-b border-black/10 pb-6">
            <h3 className="mb-4 text-lg font-semibold text-foreground">Product Items ({booking.productItems.length})</h3>
            <div className="space-y-4">
              {booking.productItems.map((item, index) => (
                <div key={item._id || index} className="rounded-lg border border-black/10 bg-[color:var(--color-light-3)]/30 p-4">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-foreground">
                        {item.product?.title || item.product?.name || item.title || `Product ${index + 1}`}
                      </div>
                      {item.product?.shortDescription && (
                        <div className="mt-1 text-xs text-[color:var(--color-light-1)]">{item.product.shortDescription}</div>
                      )}
                    </div>
                    <span className="rounded-full border border-black/10 bg-white px-2 py-1 text-xs font-medium text-foreground">
                      Item #{index + 1}
                    </span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {item.selectedDate && (
                      <div>
                        <div className="text-xs font-medium text-[color:var(--color-light-1)]">Activity Date</div>
                        <div className="mt-1 text-sm text-foreground">{fmtDateTime(item.selectedDate)}</div>
                      </div>
                    )}
                    {item.product?.duration && (
                      <div>
                        <div className="text-xs font-medium text-[color:var(--color-light-1)]">Duration</div>
                        <div className="mt-1 text-sm text-foreground">{item.product.duration}</div>
                      </div>
                    )}
                    <div>
                      <div className="text-xs font-medium text-[color:var(--color-light-1)]">Quantity</div>
                      <div className="mt-1 text-sm text-foreground">{item.quantity || 1}</div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-[color:var(--color-light-1)]">Travelers</div>
                      <div className="mt-1 text-xs text-foreground">
                        Adults: {item.adults || 0}, Children: {item.children || 0}, Infants: {item.infants || 0}
                      </div>
                    </div>
                  </div>
                  {item.addons && item.addons.length > 0 && (
                    <div className="mt-3">
                      <div className="mb-2 text-xs font-medium text-foreground">Addons ({item.addons.length})</div>
                      <div className="space-y-1">
                        {item.addons.map((addon, addonIdx) => (
                          <div key={addonIdx} className="flex items-center justify-between rounded border border-black/5 bg-white p-2">
                            <div className="text-xs text-foreground">
                              {addon.addon?.name || addon.name || "Addon"} × {addon.quantity || 1}
                            </div>
                            <div className="text-xs font-medium text-foreground">
                              {fmtMoney((addon.price || 0) * (addon.quantity || 1), booking.currency)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="mt-3 flex items-center justify-between border-t border-black/10 pt-3">
                    <div className="text-xs text-[color:var(--color-light-1)]">Base Price</div>
                    <div className="text-sm font-semibold text-foreground">{fmtMoney(item.basePrice || 0, booking.currency)}</div>
                  </div>
                  {item.addonsPrice > 0 && (
                    <div className="mt-1 flex items-center justify-between">
                      <div className="text-xs text-[color:var(--color-light-1)]">Addons Price</div>
                      <div className="text-sm font-semibold text-foreground">{fmtMoney(item.addonsPrice || 0, booking.currency)}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ticket Items */}
        {booking.bookingType === "TICKET" && booking.ticketItems && booking.ticketItems.length > 0 && (
          <div className="mb-6 border-b border-black/10 pb-6">
            <h3 className="mb-4 text-lg font-semibold text-foreground">Ticket Items ({booking.ticketItems.length})</h3>
            <div className="space-y-4">
              {booking.ticketItems.map((item, index) => (
                <div key={item._id || index} className="rounded-lg border border-black/10 bg-[color:var(--color-light-3)]/30 p-4">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-foreground">
                        {item.ticket?.title || item.title || `Ticket ${index + 1}`}
                      </div>
                    </div>
                    <span className="rounded-full border border-black/10 bg-white px-2 py-1 text-xs font-medium text-foreground">
                      Ticket #{index + 1}
                    </span>
                  </div>
                  {item.selectedDate && (
                    <div className="mb-3">
                      <div className="text-xs font-medium text-[color:var(--color-light-1)]">Activity Date</div>
                      <div className="mt-1 text-sm text-foreground">{fmtDateTime(item.selectedDate)}</div>
                    </div>
                  )}
                  {item.ticketTypes && item.ticketTypes.length > 0 && (
                    <div className="mb-3">
                      <div className="mb-2 text-xs font-medium text-[color:var(--color-light-1)]">Ticket Types</div>
                      <div className="space-y-1">
                        {item.ticketTypes.map((ticketType, typeIdx) => (
                          <div key={typeIdx} className="flex items-center justify-between rounded border border-black/5 bg-white p-2">
                            <div className="text-xs text-foreground">
                              {ticketType.name || `Type ${typeIdx + 1}`} × {ticketType.quantity || 1}
                            </div>
                            <div className="text-xs font-medium text-foreground">{fmtMoney(ticketType.price || 0, booking.currency)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {item.addons && item.addons.length > 0 && (
                    <div className="mb-3">
                      <div className="mb-2 text-xs font-medium text-[color:var(--color-light-1)]">Addons</div>
                      <div className="flex flex-wrap gap-1">
                        {item.addons.map((addon, addonIdx) => (
                          <span
                            key={addonIdx}
                            className="rounded-full border border-black/10 bg-white px-2 py-1 text-xs text-foreground"
                          >
                            {addon.addon?.name || addon.name || "Addon"} × {addon.quantity || 1}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="mt-3 flex items-center justify-between border-t border-black/10 pt-3">
                    <div className="text-xs text-[color:var(--color-light-1)]">Base Price</div>
                    <div className="text-sm font-semibold text-foreground">{fmtMoney(item.basePrice || 0, booking.currency)}</div>
                  </div>
                  {item.addonsPrice > 0 && (
                    <div className="mt-1 flex items-center justify-between">
                      <div className="text-xs text-[color:var(--color-light-1)]">Addons Price</div>
                      <div className="text-sm font-semibold text-foreground">{fmtMoney(item.addonsPrice || 0, booking.currency)}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Price Summary */}
        <div className="rounded-lg border border-black/10 bg-[color:var(--color-light-3)]/30 p-4">
          <h3 className="mb-4 text-lg font-semibold text-foreground">Price Summary</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm text-[color:var(--color-light-1)]">Subtotal</div>
              <div className="text-sm font-medium text-foreground">{fmtMoney(booking.subtotal || booking.totalAmount, booking.currency)}</div>
            </div>
            {booking.coupon && booking.coupon.discountAmount > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-[color:var(--color-light-1)]">Coupon ({booking.coupon.code})</div>
                  <div className="text-sm font-medium text-green-600">-{fmtMoney(booking.coupon.discountAmount, booking.currency)}</div>
                </div>
              </>
            )}
            {booking.taxAmount > 0 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-[color:var(--color-light-1)]">Tax</div>
                <div className="text-sm font-medium text-foreground">{fmtMoney(booking.taxAmount, booking.currency)}</div>
              </div>
            )}
            <div className="border-t border-black/10 pt-2">
              <div className="flex items-center justify-between">
                <div className="text-base font-semibold text-foreground">Total</div>
                <div className="text-base font-semibold text-foreground">{fmtMoney(booking.totalAmount, booking.currency)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
