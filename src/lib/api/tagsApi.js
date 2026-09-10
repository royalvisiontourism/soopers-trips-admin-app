import httpClient from "./httpClient";

export const tagsApi = {
  list: async ({ page = 1, limit = 20, search, isActive } = {}) => {
    const params = new URLSearchParams();
    params.set("pageNum", String(page));
    params.set("limit", String(limit));
    if (search) params.set("search", String(search));
    if (typeof isActive === "boolean") params.set("isActive", String(isActive));
    return await httpClient.get(`/tags?${params.toString()}`);
  },

  getById: async (id) => {
    return await httpClient.get(`/tags/${encodeURIComponent(id)}`);
  },

  create: async (data) => {
    return await httpClient.post("/tags", data);
  },

  update: async (id, data) => {
    return await httpClient.put(`/tags/${encodeURIComponent(id)}`, data);
  },

  remove: async (id) => {
    return await httpClient.delete(`/tags/${encodeURIComponent(id)}`);
  },
};
