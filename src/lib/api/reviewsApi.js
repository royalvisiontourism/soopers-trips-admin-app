import httpClient from "./httpClient";

export const reviewsApi = {
  list: async ({ page = 1, limit = 20, q, product_id, is_verified, min_rating, max_rating, sort } = {}) => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (q) params.set("q", String(q));
    if (product_id) params.set("product_id", String(product_id));
    if (typeof is_verified === "boolean") params.set("is_verified", String(is_verified));
    if (min_rating != null) params.set("min_rating", String(min_rating));
    if (max_rating != null) params.set("max_rating", String(max_rating));
    if (sort) params.set("sort", String(sort));
    return await httpClient.get(`/reviews?${params.toString()}`);
  },

  getById: async (id) => {
    return await httpClient.get(`/reviews/${encodeURIComponent(id)}`);
  },

  create: async (data) => {
    return await httpClient.post("/reviews", data);
  },

  update: async (id, data) => {
    return await httpClient.put(`/reviews/${encodeURIComponent(id)}`, data);
  },

  remove: async (id) => {
    return await httpClient.delete(`/reviews/${encodeURIComponent(id)}`);
  },

  verify: async (id, is_verified) => {
    return await httpClient.patch(`/reviews/${encodeURIComponent(id)}/verify`, { is_verified });
  },
};
