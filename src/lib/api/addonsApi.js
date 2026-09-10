import httpClient from "./httpClient";

export const addonsApi = {
  list: async ({ page = 1, limit = 20, search, isActive } = {}) => {
    const params = new URLSearchParams();
    params.set("pageNum", String(page));
    params.set("limit", String(limit));
    if (search) params.set("search", String(search));
    if (typeof isActive === "boolean") params.set("isActive", String(isActive));
    return await httpClient.get(`/addons?${params.toString()}`);
  },

  getById: async (id) => {
    return await httpClient.get(`/addons/${encodeURIComponent(id)}`);
  },

  create: async (formData) => {
    return await httpClient.post("/addons", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 60000,
    });
  },

  update: async (id, formData) => {
    return await httpClient.put(`/addons/${encodeURIComponent(id)}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 60000,
    });
  },

  remove: async (id) => {
    return await httpClient.delete(`/addons/${encodeURIComponent(id)}`);
  },
};
