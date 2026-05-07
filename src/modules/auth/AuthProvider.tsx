import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { authApi } from "./api";
import type { BackendRole } from "./types";
import type { UserRole } from "../../types";

type AuthUser = {
  id: string;
  name: string;
  backendRole: BackendRole;
  uiRole: UserRole;
};

type AuthContextType = {
  user: AuthUser | null;
  isLoading: boolean;
  login: (payload: { identifier: string; password: string }) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

function mapRole(role: BackendRole): UserRole | null {
  if (role === "super_admin") return "SUPER_ADMIN";
  if (role === "super_agent") return "SUPER_AGENT";
  if (role === "agent") return "AGENT";
  if (role === "shop_owner") return "SHOP_OWNER";
  return null;
}

function parseStoredUser(): AuthUser | null {
  const raw = localStorage.getItem("adminUser");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => parseStoredUser());
  const [isLoading, setIsLoading] = useState(false);

  const login = async (payload: { identifier: string; password: string }) => {
    setIsLoading(true);
    try {
      const identifier = payload.identifier.trim();
      const body = identifier.includes("@") ? { email: identifier, password: payload.password } : { phoneNumber: identifier, password: payload.password };
      const res = await authApi.login(body);
      const backendRole = (res.user?.Role?.name || res.user?.role) as BackendRole;
      const uiRole = mapRole(backendRole);
      if (!uiRole) throw new Error("This account is not allowed in admin panel");

      const authUser: AuthUser = {
        id: res.user.id,
        name: res.user.displayName || (res.user as any).phoneNumber || res.user.email || "Admin",
        backendRole,
        uiRole
      };

      localStorage.setItem("accessToken", res.tokens.accessToken);
      if (res.tokens.refreshToken) localStorage.setItem("refreshToken", res.tokens.refreshToken);
      localStorage.setItem("adminUser", JSON.stringify(authUser));
      setUser(authUser);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("adminUser");
    setUser(null);
  };

  const value = useMemo(() => ({ user, isLoading, login, logout }), [user, isLoading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
