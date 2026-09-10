"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "@/lib/api/authApi";
import { clearToken, getToken, isTokenValid, setToken as persistToken } from "@/lib/auth/token";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState("");
  const [user, setUser] = useState(null);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [loading, setLoading] = useState(false);

  const logout = useCallback(() => {
    clearToken();
    setToken("");
    setUser(null);
  }, []);

  const fetchProfile = useCallback(async () => {
    const t = getToken();
    if (!t || !isTokenValid(t)) {
      logout();
      return null;
    }
    try {
      const res = await authApi.getProfile();
      const profile = res?.data?.data;
      setUser(profile);
      return profile;
    } catch (e) {
      // httpClient will handle 401 redirect; just clear local state
      logout();
      return null;
    }
  }, [logout]);

  const login = useCallback(async ({ email, password }) => {
    setLoading(true);
    try {
      const res = await authApi.loginAdmin({ email, password });
      const apiToken = res?.data?.data?.token;
      const apiUser = res?.data?.data?.user;

      if (!apiToken) throw new Error("Token not returned from server");

      persistToken(apiToken);
      setToken(apiToken);

      // Login often returns a partial user payload; always hydrate from /auth/profile
      if (apiUser) setUser(apiUser);
      await fetchProfile();

      return res;
    } finally {
      setLoading(false);
    }
  }, [fetchProfile]);

  const signup = useCallback(async (payload) => {
    setLoading(true);
    try {
      // Agent signup does NOT auto-login (email verification + approval flow)
      return await authApi.registerAgent(payload);
    } finally {
      setLoading(false);
    }
  }, []);

  // Bootstrap from localStorage token
  useEffect(() => {
    const t = getToken();
    if (t && isTokenValid(t)) {
      setToken(t);
      fetchProfile().finally(() => setBootstrapped(true));
    } else {
      logout();
      setBootstrapped(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      bootstrapped,
      login,
      signup,
      logout,
      refreshProfile: fetchProfile,
      isAuthenticated: Boolean(token && isTokenValid(token) && user),
    }),
    [token, user, loading, bootstrapped, login, signup, logout, fetchProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

