"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, setAccessToken, getRefreshToken, setRefreshToken } from "./api-client";

interface SessionUser { id: string; name: string; email: string; roleId: string; roleName: string; permissions: string[] }
interface AuthContextValue {
  user: SessionUser | null; loading: boolean; hasPermission: (name: string) => boolean;
  login: (email: string, password: string) => Promise<void>; logout: () => Promise<void>;
}
const AuthContext = createContext < AuthContextValue | null > (null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState < SessionUser | null > (null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadSession = useCallback(async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) { setLoading(false); return; }
    try {
      // "session survives a page refresh" — restored via refresh, never from a stored access token
      const tokens = await apiFetch < { accessToken: string; refreshToken: string } > ("/auth/refresh", { method: "POST", auth: false, body: JSON.stringify({ refreshToken }) });
      setAccessToken(tokens.accessToken);
      setRefreshToken(tokens.refreshToken);
      setUser(await apiFetch < SessionUser > ("/auth/session"));
    } catch {
      setAccessToken(null); setRefreshToken(null); setUser(null);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadSession(); }, [loadSession]);

  const login = useCallback(async (email: string, password: string) => {
    const tokens = await apiFetch < { accessToken: string; refreshToken: string } > ("/auth/login", { method: "POST", auth: false, body: JSON.stringify({ email, password }) });
    setAccessToken(tokens.accessToken);
    setRefreshToken(tokens.refreshToken);
    setUser(await apiFetch < SessionUser > ("/auth/session"));
    router.push("/");
  }, [router]);

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) await apiFetch("/auth/logout", { method: "POST", auth: false, body: JSON.stringify({ refreshToken }) }).catch(() => { });
    setAccessToken(null); setRefreshToken(null); setUser(null);
    router.push("/login");
  }, [router]);

  const hasPermission = useCallback((name: string) => user?.permissions.includes(name) ?? false, [user]);

  return <AuthContext.Provider value={{ user, loading, hasPermission, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
