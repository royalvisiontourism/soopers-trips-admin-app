import httpClient from "./httpClient";

export const contactApi = {
  list: async ({ page = 1, limit = 30, isRead, isArchived, q } = {}) => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (typeof isRead === "boolean") params.set("isRead", String(isRead));
    if (typeof isArchived === "boolean") params.set("isArchived", String(isArchived));
    if (q) params.set("q", q);
    return await httpClient.get(`/contact?${params.toString()}`);
  },

  getById: async (id) => {
    return await httpClient.get(`/contact/${encodeURIComponent(id)}`);
  },

  markRead: async (id, isRead = true) => {
    return await httpClient.patch(`/contact/${encodeURIComponent(id)}/read`, { isRead });
  },

  archive: async (id, isArchived = true) => {
    return await httpClient.patch(`/contact/${encodeURIComponent(id)}/archive`, { isArchived });
  },

  remove: async (id) => {
    return await httpClient.delete(`/contact/${encodeURIComponent(id)}`);
  },

  unreadCount: async () => {
    return await httpClient.get("/contact/unread-count");
  },
};
