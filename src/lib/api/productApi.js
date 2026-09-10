import httpClient from "./httpClient";

export const productApi = {
  getById: async (productId) => {
    return await httpClient.get(`/products/${encodeURIComponent(productId)}`);
  },
};

