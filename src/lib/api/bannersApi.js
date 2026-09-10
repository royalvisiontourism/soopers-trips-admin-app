import httpClient from "./httpClient";

export const bannersApi = {
  list: async ({ page = 1, limit = 20, filterPage, isActive } = {}) => {
    const params = new URLSearchParams();
    params.set("pageNum", String(page));
    params.set("limit", String(limit));
    if (filterPage) params.set("filterPage", String(filterPage));
    if (typeof isActive === "boolean") params.set("isActive", String(isActive));
    return await httpClient.get(`/banners?${params.toString()}`);
  },

  getById: async (id) => {
    return await httpClient.get(`/banners/${encodeURIComponent(id)}`);
  },

  create: async (formData) => {
    return await httpClient.post("/banners", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 60000,
    });
  },

  update: async (id, formData) => {
    return await httpClient.put(`/banners/${encodeURIComponent(id)}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 60000,
    });
  },

  remove: async (id) => {
    return await httpClient.delete(`/banners/${encodeURIComponent(id)}`);
  },
};
