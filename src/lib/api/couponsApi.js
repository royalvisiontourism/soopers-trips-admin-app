import httpClient from "./httpClient";

export const couponsApi = {
  list: async ({ page = 1, limit = 20, code, isActive, discountType } = {}) => {
    const params = new URLSearchParams();
    params.set("pageNum", String(page));
    params.set("limit", String(limit));
    if (code) params.set("code", String(code));
    if (typeof isActive === "boolean") params.set("isActive", String(isActive));
    if (discountType) params.set("discountType", String(discountType));
    return await httpClient.get(`/coupons?${params.toString()}`);
  },

  getById: async (id) => {
    return await httpClient.get(`/coupons/${encodeURIComponent(id)}`);
  },

  create: async (data) => {
    return await httpClient.post("/coupons", data);
  },

  update: async (id, data) => {
    return await httpClient.put(`/coupons/${encodeURIComponent(id)}`, data);
  },

  remove: async (id) => {
    return await httpClient.delete(`/coupons/${encodeURIComponent(id)}`);
  },

  validate: async (code, productId) => {
    return await httpClient.post("/coupons/validate", { code, productId });
  },
};
