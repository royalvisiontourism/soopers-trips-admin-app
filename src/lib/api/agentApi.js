import httpClient from "./httpClient";

export const agentApi = {
  listMyAssignedProducts: async ({ page = 1, limit = 12, search = "" } = {}) => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (search) params.set("search", search);

    return await httpClient.get(`/agents/me/products?${params.toString()}`);
  },

  getMyAssignedProduct: async (productId) => {
    // Reuse list endpoint with search so we don't need a separate backend route right now
    const res = await httpClient.get(`/agents/me/products?page=1&limit=1&search=${encodeURIComponent(String(productId))}`);
    const data = res?.data?.data;
    return Array.isArray(data?.items) ? data.items[0] : null;
  },
};

