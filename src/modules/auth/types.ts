export type BackendRole = "super_admin" | "agent" | "shop_owner" | "cashier" | "user";

export type LoginResponse = {
  user: {
    id: string;
    email?: string;
    phoneNumber?: string;
    displayName?: string;
    role?: string;
    Role?: { name: BackendRole };
  };
  tokens: {
    accessToken: string;
    refreshToken?: string;
  };
};

