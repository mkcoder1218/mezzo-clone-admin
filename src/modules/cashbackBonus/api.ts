import { apiRequest } from "../../lib/apiClient";

export type CashbackOfferCode = "ONE_LOSS" | "TWO_LOSSES";
export type CashbackWalletType = "BONUS" | "MAIN";
export type CashbackStatus = "PENDING" | "CREDITED" | "REJECTED" | "FAILED";

export type CashbackConfig = {
  id: string;
  code: CashbackOfferCode;
  name: string;
  isEnabled: boolean;
  lostSelectionCount: number;
  minimumSelectionCount: number;
  minimumStake: string;
  maximumCashbackAmount: string;
  excludeLiveBets: boolean;
  excludeVirtualGames: boolean;
  creditWalletType: CashbackWalletType;
  createdAt: string;
  updatedAt: string;
};

export type CashbackMultiplierRange = {
  id: string;
  cashbackConfigId: string;
  minimumOdds: string;
  maximumOdds: string | null;
  multiplier: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type CashbackTransaction = {
  id: string;
  betSlipId: string;
  userId: string | null;
  offerCode: CashbackOfferCode | null;
  lostSelectionCount: number;
  eligibleSelectionCount: number;
  effectiveOdds: string;
  stake: string;
  multiplier: string | null;
  creditedAmount: string;
  walletType: CashbackWalletType | null;
  status: CashbackStatus;
  rejectionReason: string | null;
  createdAt: string;
};

export const cashbackBonusApi = {
  stats: () => apiRequest<any>("/api/admin/cashback/stats"),
  listConfigs: () => apiRequest<{ configs: CashbackConfig[] }>("/api/admin/cashback/configs"),
  getConfig: (id: string) => apiRequest<{ config: CashbackConfig & { CashbackMultiplierRanges?: CashbackMultiplierRange[] } }>(`/api/admin/cashback/configs/${id}`),
  patchConfig: (id: string, patch: Partial<CashbackConfig>) => apiRequest<{ config: CashbackConfig }>(`/api/admin/cashback/configs/${id}`, { method: "PATCH", body: patch }),
  addRange: (configId: string, payload: { minimumOdds: string; maximumOdds: string | null; multiplier: string }) =>
    apiRequest<{ range: CashbackMultiplierRange }>(`/api/admin/cashback/configs/${configId}/ranges`, { method: "POST", body: payload }),
  patchRange: (rangeId: string, patch: Partial<CashbackMultiplierRange>) => apiRequest<{ range: CashbackMultiplierRange }>(`/api/admin/cashback/ranges/${rangeId}`, { method: "PATCH", body: patch }),
  deleteRange: (rangeId: string) => apiRequest<{ ok: true }>(`/api/admin/cashback/ranges/${rangeId}`, { method: "DELETE" }),
  reorderRanges: (configId: string, orderedRangeIds: string[]) =>
    apiRequest<{ ranges: CashbackMultiplierRange[] }>(`/api/admin/cashback/configs/${configId}/ranges/reorder`, { method: "POST", body: { orderedRangeIds } }),
  listTransactions: (params: Record<string, any>) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v != null && String(v) !== "") as any).toString();
    return apiRequest<any>(`/api/admin/cashback/transactions?${qs}`);
  },
  getTransaction: (id: string) => apiRequest<any>(`/api/admin/cashback/transactions/${id}`),
  retryTransaction: (id: string) => apiRequest<any>(`/api/admin/cashback/transactions/${id}/retry`, { method: "POST" }),
};

