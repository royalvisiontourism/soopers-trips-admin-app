import httpClient from "./httpClient";

const base = "/blogs";

export const blogsApi = {
  // Posts
  list: async (params = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "" && v !== null) q.set(k, String(v));
    });
    return await httpClient.get(`${base}?${q.toString()}`);
  },

  getById: async (id) => {
    return await httpClient.get(`${base}/${encodeURIComponent(id)}`);
  },

  create: async (data) => {
    return await httpClient.post(base, data);
  },

  update: async (id, data) => {
    return await httpClient.put(`${base}/${encodeURIComponent(id)}`, data);
  },

  remove: async (id) => {
    return await httpClient.delete(`${base}/${encodeURIComponent(id)}`);
  },

  publish: async (id) => {
    return await httpClient.post(`${base}/${encodeURIComponent(id)}/publish`);
  },

  schedule: async (id, scheduledAt) => {
    return await httpClient.post(`${base}/${encodeURIComponent(id)}/schedule`, { scheduledAt });
  },

  archive: async (id) => {
    return await httpClient.post(`${base}/${encodeURIComponent(id)}/archive`);
  },

  suggestSlug: async (title, locale = "en") => {
    const params = new URLSearchParams({ title: title || "post", locale });
    return await httpClient.get(`${base}/suggest-slug?${params.toString()}`);
  },

  // Categories (list + CRUD)
  listCategories: async (params = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "" && v !== null) q.set(k, String(v));
    });
    return await httpClient.get(`${base}/categories?${q.toString()}`);
  },

  getCategoryById: async (id) => {
    return await httpClient.get(`${base}/categories/${encodeURIComponent(id)}`);
  },

  createCategory: async (data) => {
    return await httpClient.post(`${base}/categories`, data);
  },

  updateCategory: async (id, data) => {
    return await httpClient.put(`${base}/categories/${encodeURIComponent(id)}`, data);
  },

  removeCategory: async (id) => {
    return await httpClient.delete(`${base}/categories/${encodeURIComponent(id)}`);
  },

  listTags: async (params = {}) => {
    const q = new URLSearchParams(params);
    return await httpClient.get(`${base}/tags?${q.toString()}`);
  },

  listAuthors: async (params = {}) => {
    const q = new URLSearchParams(params);
    return await httpClient.get(`${base}/authors?${q.toString()}`);
  },

  getAuthorMe: async () => {
    return await httpClient.get(`${base}/authors/me`);
  },
};
