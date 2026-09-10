import httpClient from "./httpClient";

export const productsApi = {
  list: async ({ page = 1, limit = 20, search, isActive, badge, category, destination, sort } = {}) => {
    const params = new URLSearchParams();
    params.set("pageNum", String(page));
    params.set("limit", String(limit));
    if (search) params.set("search", search);
    if (typeof isActive === "boolean") params.set("isActive", String(isActive));
    if (badge) params.set("badge", badge);
    if (category) params.set("category", category);
    if (destination) params.set("destination", destination);
    if (sort) params.set("sort", sort);
    return await httpClient.get(`/products?${params.toString()}`);
  },

  getById: async (id) => {
    return await httpClient.get(`/products/${encodeURIComponent(id)}`);
  },

  create: async (formData) => {
    return await httpClient.post("/products", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 60000,
    });
  },

  update: async (id, formData) => {
    return await httpClient.put(`/products/${encodeURIComponent(id)}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 60000,
    });
  },

  remove: async (id) => {
    return await httpClient.delete(`/products/${encodeURIComponent(id)}`);
  },

  duplicate: async (id) => {
    return await httpClient.post(`/products/${encodeURIComponent(id)}/duplicate`);
  },
};
