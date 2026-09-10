import httpClient from "./httpClient";

export const featuredLayoutApi = {
  // Admin: get active layout (page=home by default)
  getActive: async ({ page = "home" } = {}) => {
    const params = new URLSearchParams();
    if (page) params.set("page", String(page));
    const qs = params.toString();
    return await httpClient.get(`/featured-layouts${qs ? `?${qs}` : ""}`);
  },

  create: async (payload) => {
    return await httpClient.post("/featured-layouts", payload);
  },

  update: async (id, payload) => {
    return await httpClient.put(`/featured-layouts/${encodeURIComponent(id)}`, payload);
  },

  remove: async (id) => {
    return await httpClient.delete(`/featured-layouts/${encodeURIComponent(id)}`);
  },
};

