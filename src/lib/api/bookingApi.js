import httpClient from "./httpClient";

export const bookingApi = {
  getMyDashboardStats: async () => {
    return await httpClient.get(`/bookings/agent/stats`);
  },
  listMyBookings: async ({
    page = 1,
    limit = 10,
    search = "",
    status = "",
    paymentStatus = "",
    startDate = "",
    endDate = "",
    dateFilterType = "booking",
    activityStartDate = "",
    activityEndDate = "",
  } = {}) => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    if (paymentStatus) params.set("paymentStatus", paymentStatus);
    if (dateFilterType) params.set("dateFilterType", dateFilterType);
    
    // Add date params based on filter type
    if (dateFilterType === "booking") {
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
    } else if (dateFilterType === "activity") {
      if (activityStartDate) params.set("activityStartDate", activityStartDate);
      if (activityEndDate) params.set("activityEndDate", activityEndDate);
    }

    return await httpClient.get(`/bookings?${params.toString()}`);
  },
  getBookingDetails: async (bookingId) => {
    return await httpClient.get(`/bookings/${bookingId}`);
  },
};

