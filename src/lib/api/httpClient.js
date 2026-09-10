import axios from "axios";
import { clearToken, getToken, isTokenValid } from "@/lib/auth/token";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
const API_URL = `${BASE_URL.replace(/\/+$/, "")}/api`;

const httpClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

httpClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    if (typeof window !== "undefined" && !isTokenValid(token)) {
      clearToken();
      window.location.href = "/login";
      return Promise.reject(new Error("Token is invalid, redirecting to login..."));
    }
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

httpClient.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    const responseData = error?.response?.data;

    const validationErrors = Array.isArray(responseData?.errors) ? responseData.errors : null;
    const firstValidationMessage =
      validationErrors?.find((e) => typeof e?.message === "string" && e.message.trim())?.message ||
      (typeof validationErrors?.[0] === "string" ? validationErrors[0] : null);

    const backendError =
      firstValidationMessage ||
      (typeof responseData?.error === "string" ? responseData.error : null) ||
      (typeof responseData?.message === "string" ? responseData.message : null);

    const message = backendError || error.message || "Unknown error";

    if (status === 401 && typeof window !== "undefined") {
      clearToken();
      // avoid loops if already on login
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(message);
  }
);

export default httpClient;

