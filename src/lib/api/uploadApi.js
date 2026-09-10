import httpClient from "./httpClient";

/**
 * Upload a single file to GCS.
 * @param {File} file - The file to upload
 * @param {string} folder - GCS folder name (e.g. "gallery", "products")
 * @param {string} prefix - Filename prefix (e.g. "img")
 * @returns {Promise<{url, filename, size, mimeType, type}>}
 */
export const uploadFile = async (file, folder = "gallery", prefix = "img") => {
  const fd = new FormData();
  fd.append("file", file);
  const params = new URLSearchParams({ folder, prefix });
  const res = await httpClient.post(`/upload?${params.toString()}`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 60000,
  });
  return res?.data?.data;
};
