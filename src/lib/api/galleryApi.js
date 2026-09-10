import httpClient from "./httpClient";

export const galleryApi = {
  list: async ({ page = 1, limit = 50, category, isActive, q } = {}) => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (category) params.set("category", category);
    if (typeof isActive === "boolean") params.set("isActive", String(isActive));
    if (q) params.set("q", q);
    return await httpClient.get(`/gallery?${params.toString()}`);
  },

  getById: async (id) => {
    return await httpClient.get(`/gallery/${encodeURIComponent(id)}`);
  },

  create: async (data) => {
    return await httpClient.post("/gallery", data);
  },

  bulkCreate: async (images) => {
    return await httpClient.post("/gallery/bulk", { images });
  },

  update: async (id, data) => {
    return await httpClient.put(`/gallery/${encodeURIComponent(id)}`, data);
  },

  remove: async (id) => {
    return await httpClient.delete(`/gallery/${encodeURIComponent(id)}`);
  },
};
