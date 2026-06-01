import { apiRequest } from "../../lib/apiClient";
import type { LoginResponse } from "./types";
import type { UserRole } from "../../types";

export const authApi = {
  login: (payload: { email?: string; phoneNumber?: string; password: string }) =>
    apiRequest<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    }),

  me: () =>
    apiRequest<{
      user: {
        id: string;
        displayName?: string;
        email?: string;
        Role?: { name: string; Permissions?: { key: string }[] };
      };
    }>("/api/users/me")
};
