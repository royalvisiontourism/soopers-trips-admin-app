"use client";

import { useEffect, useMemo, useState } from "react";
import { bookingApi } from "@/lib/api/bookingApi";
import { notifyError } from "@/components/ui/toast";
import * as XLSX from "xlsx";
import BookingCard from "@/components/bookings/BookingCard";

export default function BookingsPage() {

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [exportingExcel, setExportingExcel] = useState(false);

  const [dateFilterType, setDateFilterType] = useState("booking"); // 'booking' or 'activity'

  const [draft, setDraft] = useState({
    search: "",
    status: "",
    paymentStatus: "",
    startDate: "",
    endDate: "",
    activityStartDate: "",
    activityEndDate: "",
  });

  const [filters, setFilters] = useState(draft);

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
    // Format as dd/mm/yyyy, HH:mm:ss to match admin panel
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
  };

  const statusOptions = useMemo(
    () => ["", "PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"],
    []
  );
  const paymentOptions = useMemo(() => ["", "PENDING", "PAID", "FAILED", "REFUNDED"], []);

  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      setLoading(true);
      try {
        // Build API params based on date filter type
        const apiParams = {
          page,
          limit,
          ...filters,
          dateFilterType,
        };

        // Only include date params based on filter type
        if (dateFilterType === "booking") {
          // Use startDate and endDate for booking date filter
          if (filters.startDate) apiParams.startDate = filters.startDate;
          if (filters.endDate) apiParams.endDate = filters.endDate;
          // Remove activity date params
          delete apiParams.activityStartDate;
          delete apiParams.activityEndDate;
        } else if (dateFilterType === "activity") {
          // Use activityStartDate and activityEndDate for activity date filter
          if (filters.activityStartDate) apiParams.activityStartDate = filters.activityStartDate;
          if (filters.activityEndDate) apiParams.activityEndDate = filters.activityEndDate;
          // Remove booking date params
          delete apiParams.startDate;
          delete apiParams.endDate;
        }

        const res = await bookingApi.listMyBookings(apiParams);
        // Backend paginatedResponse: { success, data: [...], pagination: { page, limit, total, pages } }
        const body = res?.data;
        const list = Array.isArray(body?.data) ? body.data : [];

        if (!isMounted) return;
        setItems(list);
        setTotal(Number(body?.pagination?.total || 0));
        setTotalPages(Number(body?.pagination?.pages || 1));
      } catch (e) {
        if (!isMounted) return;
        notifyError(e);
        setItems([]);
        setTotal(0);
        setTotalPages(1);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    run();
    return () => {
      isMounted = false;
    };
  }, [filters, limit, page, dateFilterType]);

  const applyFilters = () => {
    setPage(1);
    setFilters(draft);
  };

  const clearFilters = () => {
    const next = {
      search: "",
      status: "",
      paymentStatus: "",
      startDate: "",
      endDate: "",
      activityStartDate: "",
      activityEndDate: "",
    };
    setDraft(next);
    setPage(1);
    setFilters(next);
    setDateFilterType("booking");
  };


  const handleExportToExcel = async () => {
    setExportingExcel(true);
    try {
      // Fetch all bookings with current filters
      let allBookings = [];
      let currentPage = 1;
      let hasMore = true;
      const fetchLimit = 100; // Fetch 100 at a time

      while (hasMore) {
        try {
          // Build API params for export with date filter type
          const exportParams = {
            ...filters,
            page: currentPage,
            limit: fetchLimit,
            dateFilterType,
          };

          // Only include date params based on filter type
          if (dateFilterType === "booking") {
            if (filters.startDate) exportParams.startDate = filters.startDate;
            if (filters.endDate) exportParams.endDate = filters.endDate;
            delete exportParams.activityStartDate;
            delete exportParams.activityEndDate;
          } else if (dateFilterType === "activity") {
            if (filters.activityStartDate) exportParams.activityStartDate = filters.activityStartDate;
            if (filters.activityEndDate) exportParams.activityEndDate = filters.activityEndDate;
            delete exportParams.startDate;
            delete exportParams.endDate;
          }

          const res = await bookingApi.listMyBookings(exportParams);
          const body = res?.data;
          const bookings = Array.isArray(body?.data) ? body.data : [];
          
          allBookings = [...allBookings, ...bookings];
          
          // Check if there are more pages
          const exportTotalPages = Number(body?.pagination?.pages || 1);
          hasMore = currentPage < exportTotalPages;
          currentPage++;
        } catch (error) {
          console.error('Error fetching bookings:', error);
          notifyError('Failed to fetch some bookings data');
          break;
        }
      }

      if (allBookings.length === 0) {
        notifyError('No bookings found to export');
        return;
      }

      // Helpers for activity-level export
      const getTransportType = (transport) => {
        if (!transport || !transport.type) return '-';
        const t = String(transport.type).toUpperCase();
        let label = t === 'PRIVATE' ? 'PRIVATE' : t === 'SHARED' ? 'SHARING' : t;
        if (t === 'PRIVATE' && transport.vehicleType) label += ` (${transport.vehicleType})`;
        return label;
      };
      const getAddonNames = (addons) => {
        if (!addons || !Array.isArray(addons) || addons.length === 0) return '-';
        const names = addons.map((a) => a?.addon?.name ?? a?.name).filter(Boolean).map((n) => String(n).trim());
        return names.length ? names.join(', ') : '-';
      };
      const getGuestName = (b) => {
        const g = b?.guestInfo;
        if (g?.customerName && String(g.customerName).trim()) return String(g.customerName).trim();
        if (g) {
          const full = `${g.firstName || ''} ${g.lastName || ''}`.trim();
          if (full) return full;
        }
        return b?.user?.name || 'N/A';
      };
      const fmtDate = (date) => (date ? fmtDateTime(date) : '-');

      // Add booking-level columns (as shown in the bookings list) + activity-level columns
      const HEADERS = [
        'BOOKING DATE',
        'ACTIVITY DATE',
        'BOOKING ID',
        'BOOKING TYPE',
        'BOOKING STATUS',
        'PAYMENT STATUS',
        'TOTAL AMOUNT',
        'CURRENCY',
        'REFERENCE NUMBER',
        'GUEST NAME',
        'GUEST PHONE',
        'TYPE (PRIVATE/SHARING)',
        'QTY (NO OF PAX/CARS)',
        'PICK UP LOCATION',
        'ADDON (SHISHA, QUAD BIKE)',
        'SPECIAL NOTES',
        'Product/Activity',
      ];

      const getGuestPhone = (b) =>
        b?.guestInfo?.customerPhone || b?.guestInfo?.phone || '-';

      const toRow = ({
        booking,
        activityDate,
        guestName,
        transportType,
        qty,
        pickup,
        addon,
        notes,
        productActivity,
      }) => ({
        [HEADERS[0]]: fmtDate(booking?.createdAt),
        [HEADERS[1]]: activityDate ?? '-',
        [HEADERS[2]]: booking?.bookingId || 'N/A',
        [HEADERS[3]]: booking?.bookingType || 'N/A',
        [HEADERS[4]]: booking?.status || 'N/A',
        [HEADERS[5]]: booking?.payment?.status || 'N/A',
        [HEADERS[6]]: Number(booking?.totalAmount || 0),
        [HEADERS[7]]: booking?.currency || 'AED',
        [HEADERS[8]]: booking?.guestInfo?.referenceNumber || '-',
        [HEADERS[9]]: guestName ?? 'N/A',
        [HEADERS[10]]: getGuestPhone(booking),
        [HEADERS[11]]: transportType ?? '-',
        [HEADERS[12]]: qty ?? '-',
        [HEADERS[13]]: pickup ?? '-',
        [HEADERS[14]]: addon ?? '-',
        [HEADERS[15]]: notes ?? '-',
        [HEADERS[16]]: productActivity ?? '-',
      });

      const excelRows = [];
      allBookings.forEach((booking) => {
        const guestName = getGuestName(booking);
        const specialNotesBase = booking.guestInfo?.notes || booking.notes || '';
        const bt = String(booking.bookingType || '').toUpperCase();

        if (bt === 'PRODUCT' && Array.isArray(booking.productItems) && booking.productItems.length > 0) {
          booking.productItems.forEach((item) => {
            const pax = (item.adults || 0) + (item.children || 0) + (item.infants || 0) || item.quantity || 1;
            const transport = item.transportation || {};
            excelRows.push(
              toRow({
                booking,
                activityDate: fmtDate(item.selectedDate),
                guestName,
                transportType: getTransportType(transport),
                qty: pax,
                pickup: transport.pickupAddress || '-',
                addon: getAddonNames(item.addons),
                notes: item.notes || specialNotesBase || '-',
                productActivity: item.product?.title || item.product?.name || 'Product',
              })
            );
          });
        } else if (bt === 'PACKAGE' && booking.packageItem) {
          const pkg = booking.packageItem;
          const transport = pkg.transportation || {};
          excelRows.push(
            toRow({
              booking,
              activityDate: fmtDate(pkg.startDate),
              guestName,
              transportType: '-',
              qty: pkg.person || 1,
              pickup: transport.pickupAddress || '-',
              addon: getAddonNames(pkg.addons),
              notes: pkg.notes || specialNotesBase || '-',
              productActivity: pkg.package?.title || pkg.package?.name || 'Package',
            })
          );
        } else if (bt === 'TICKET' && Array.isArray(booking.ticketItems) && booking.ticketItems.length > 0) {
          booking.ticketItems.forEach((item) => {
            const qty = (item.ticketTypes || []).reduce((sum, tt) => sum + (tt.quantity || 0), 0) || 1;
            excelRows.push(
              toRow({
                booking,
                activityDate: fmtDate(item.selectedDate),
                guestName,
                transportType: '-',
                qty,
                pickup: '-',
                addon: getAddonNames(item.addons),
                notes: item.notes || specialNotesBase || '-',
                productActivity: item.ticket?.title || item.ticket?.name || 'Ticket',
              })
            );
          });
        } else {
          excelRows.push(
            toRow({
              booking,
              activityDate: '-',
              guestName,
              transportType: '-',
              qty: 1,
              pickup: '-',
              addon: '-',
              notes: specialNotesBase || '-',
              productActivity: bt || 'Unknown',
            })
          );
        }
      });

      const ws = excelRows.length > 0
        ? XLSX.utils.json_to_sheet(excelRows, { header: HEADERS })
        : XLSX.utils.aoa_to_sheet([HEADERS]);
      ws['!cols'] = [
        { wch: 20 }, // BOOKING DATE
        { wch: 20 }, // ACTIVITY DATE
        { wch: 18 }, // BOOKING ID
        { wch: 14 }, // BOOKING TYPE
        { wch: 16 }, // BOOKING STATUS
        { wch: 16 }, // PAYMENT STATUS
        { wch: 14 }, // TOTAL AMOUNT
        { wch: 10 }, // CURRENCY
        { wch: 22 }, // REFERENCE NUMBER
        { wch: 25 }, // GUEST NAME
        { wch: 18 }, // GUEST PHONE
        { wch: 22 }, // TYPE
        { wch: 20 }, // QTY
        { wch: 35 }, // PICKUP
        { wch: 30 }, // ADDON
        { wch: 40 }, // NOTES
        { wch: 35 }, // Product/Activity
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Activities');

      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `Bookings_Activities_Export_${dateStr}.xlsx`;

      XLSX.writeFile(wb, filename);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      notifyError('Failed to export bookings to Excel');
    } finally {
      setExportingExcel(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Bookings</h1>
        <p className="mt-1 text-sm text-[color:var(--color-light-1)]">
          View and filter product bookings. Search by booking ID or customer name.
        </p>
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-sm font-medium text-foreground">Filters</div>
              <div className="mt-1 text-xs text-[color:var(--color-light-1)]">
                Search by booking ID or customer name and filter by status/payment.
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={clearFilters}
                className="cursor-pointer rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-[color:var(--color-light-3)]"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={applyFilters}
                className="cursor-pointer rounded-xl bg-black px-4 py-2 text-sm font-medium text-white"
              >
                Apply
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
              <div className="lg:col-span-2">
                <label className="text-xs font-medium text-foreground">Search</label>
                <input
                  value={draft.search}
                  onChange={(e) => setDraft((p) => ({ ...p, search: e.target.value }))}
                  placeholder="Booking ID or customer name..."
                  className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/30"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">Status</label>
                <select
                  value={draft.status}
                  onChange={(e) => setDraft((p) => ({ ...p, status: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/30"
                >
                  {statusOptions.map((v) => (
                    <option key={v || "ALL"} value={v}>
                      {v ? v : "All"}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">Payment</label>
                <select
                  value={draft.paymentStatus}
                  onChange={(e) => setDraft((p) => ({ ...p, paymentStatus: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/30"
                >
                  {paymentOptions.map((v) => (
                    <option key={v || "ALL"} value={v}>
                      {v ? v : "All"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date Filter Type Toggle */}
            <div>
              <label className="text-xs font-medium text-foreground mb-2 block">Date Filter Type</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDateFilterType("booking")}
                  className={`px-4 py-2 text-sm font-medium rounded-xl border transition-colors ${
                    dateFilterType === "booking"
                      ? "bg-black text-white border-black"
                      : "bg-white text-foreground border-black/10 hover:bg-[color:var(--color-light-3)]"
                  }`}
                >
                  Booking Date
                </button>
                <button
                  type="button"
                  onClick={() => setDateFilterType("activity")}
                  className={`px-4 py-2 text-sm font-medium rounded-xl border transition-colors ${
                    dateFilterType === "activity"
                      ? "bg-black text-white border-black"
                      : "bg-white text-foreground border-black/10 hover:bg-[color:var(--color-light-3)]"
                  }`}
                >
                  Activity Date
                </button>
              </div>
            </div>

            {/* Date Fields - Conditional based on filter type */}
            {dateFilterType === "booking" ? (
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-foreground">From</label>
                  <input
                    type="date"
                    value={draft.startDate}
                    onChange={(e) => setDraft((p) => ({ ...p, startDate: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground">To</label>
                  <input
                    type="date"
                    value={draft.endDate}
                    onChange={(e) => setDraft((p) => ({ ...p, endDate: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/30"
                  />
                </div>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-foreground">Activity Start Date</label>
                  <input
                    type="date"
                    value={draft.activityStartDate}
                    onChange={(e) => setDraft((p) => ({ ...p, activityStartDate: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground">Activity End Date</label>
                  <input
                    type="date"
                    value={draft.activityEndDate}
                    onChange={(e) => setDraft((p) => ({ ...p, activityEndDate: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/30"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-black/10 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-black/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-[color:var(--color-light-1)]">
            {loading ? "Loading..." : `${total} booking${total === 1 ? "" : "s"} found`}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportToExcel}
              disabled={exportingExcel || loading || total === 0}
              className="cursor-pointer rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-[color:var(--color-light-3)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {exportingExcel ? 'Exporting...' : 'Export to Excel'}
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[color:var(--color-light-1)]">Rows</span>
              <select
                value={String(limit)}
                onChange={(e) => {
                  const next = Math.max(1, parseInt(e.target.value, 10) || 10);
                  setPage(1);
                  setLimit(next);
                }}
                className="cursor-pointer rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-foreground outline-none focus:border-black/30"
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="cursor-pointer rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-medium text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              Prev
            </button>
            <div className="text-sm text-foreground">
              Page <span className="font-medium">{page}</span> / {totalPages}
            </div>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="cursor-pointer rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-medium text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="py-12 text-center text-[color:var(--color-light-1)]">
              Loading bookings...
            </div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-[color:var(--color-light-1)]">
              No bookings found. Try adjusting filters.
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((booking) => (
                <BookingCard
                  key={booking._id}
                  booking={booking}
                  onViewRow={() => {
                    window.location.href = `/dashboard/bookings/${booking.bookingId}`;
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

