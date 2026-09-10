import httpClient from "./httpClient";

export const authApi = {
  loginAdmin: async ({ email, password }) => {
    return await httpClient.post("/auth/login", { email, password });
  },

  loginAgent: async ({ email, password }) => {
    // Backward-compat alias
    return await authApi.loginAdmin({ email, password });
  },

  registerAgent: async (payload) => {
    // backend expects /agents/register
    return await httpClient.post("/agents/register", payload);
  },

  getProfile: async () => {
    return await httpClient.get("/auth/profile");
  },

  updateProfile: async (payload) => {
    return await httpClient.put("/auth/update-profile", payload);
  },

  updatePassword: async ({ currentPassword, newPassword }) => {
    return await httpClient.put("/auth/update-password", { currentPassword, newPassword });
  },

  verifyEmail: async (token) => {
    return await httpClient.get(`/auth/verify-email?token=${encodeURIComponent(token)}`);
  },

  resendVerificationEmail: async ({ email }) => {
    return await httpClient.post("/auth/resend-verification-email", { email });
  },

  forgotPassword: async ({ email }) => {
    return await httpClient.post("/auth/forgot-password", {
      email,
    });
  },

  resetPassword: async ({ token, password }) => {
    return await httpClient.post("/auth/reset-password", { token, password });
  },
};

