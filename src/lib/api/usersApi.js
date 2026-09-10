import httpClient from "./httpClient";

export const usersApi = {
  list: async ({ page = 1, limit = 20, search, role, isActive } = {}) => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (search) params.set("search", search);
    if (role) params.set("role", role);
    if (typeof isActive === "boolean") params.set("isActive", String(isActive));
    return await httpClient.get(`/users?${params.toString()}`);
  },

  getById: async (id) => {
    return await httpClient.get(`/users/${encodeURIComponent(id)}`);
  },

  update: async (id, data) => {
    return await httpClient.put(`/users/${encodeURIComponent(id)}`, data);
  },

  remove: async (id) => {
    return await httpClient.delete(`/users/${encodeURIComponent(id)}`);
  },
};
