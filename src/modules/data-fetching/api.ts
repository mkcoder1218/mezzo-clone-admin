import { apiRequest } from "../../lib/apiClient";
import type { AdminFetchersStatusResponse, AdminOddsSettingsResponse, CatalogLatestResponse, FetchJobStatus, OddsConfigValue, OddsLatestResponse } from "./types";

export const dataFetchingApi = {
  oddsStatus: () => apiRequest<FetchJobStatus>("/api/odds/status"),
  oddsSetEnabled: (enabled: boolean) =>
    apiRequest("/api/odds/enabled", { method: "POST", body: JSON.stringify({ enabled }) }),
  oddsFetchNow: (sportId: number) => apiRequest("/api/odds/fetch", { method: "POST", body: JSON.stringify({ sportId }) }),
  oddsLatest: (sportId: number) => apiRequest<OddsLatestResponse>(`/api/odds/latest?sportId=${encodeURIComponent(String(sportId))}`),

  catalogStatus: () => apiRequest<FetchJobStatus>("/api/catalog/status"),
  catalogSetEnabled: (enabled: boolean) =>
    apiRequest("/api/catalog/enabled", { method: "POST", body: JSON.stringify({ enabled }) }),
  catalogFetchNow: () => apiRequest("/api/catalog/fetch", { method: "POST" }),
  catalogLatest: () => apiRequest<CatalogLatestResponse>("/api/catalog/latest"),

  adminFetchersStatus: () => apiRequest<AdminFetchersStatusResponse>("/api/admin/fetchers/status"),
  adminSetFetcherEnabled: (name: string, enabled: boolean) =>
    apiRequest(`/api/admin/fetchers/${name}/enabled`, { method: "PATCH", body: JSON.stringify({ enabled }) }),

  adminWorkersStatus: () => apiRequest<{ workers: Array<{ name: string; enabled: boolean }> }>("/api/admin/workers/status"),
  adminSetWorkerEnabled: (name: string, enabled: boolean) =>
    apiRequest(`/api/admin/workers/${name}/enabled`, { method: "PATCH", body: JSON.stringify({ enabled }) }),
  adminPlacingBetslips: (status: "placing" | "place_failed", limit = 50) =>
    apiRequest<{ status: string; rows: any[] }>(`/api/admin/workers/betslips?status=${encodeURIComponent(status)}&limit=${encodeURIComponent(String(limit))}`),
  adminRetryBetslip: (slipId: string) => apiRequest(`/api/admin/workers/betslips/${encodeURIComponent(slipId)}/retry`, { method: "POST" }),

  adminOddsSettingsGet: () => apiRequest<AdminOddsSettingsResponse>("/api/admin/settings/odds"),
  adminOddsSettingsPatch: (body: OddsConfigValue) =>
    apiRequest("/api/admin/settings/odds", { method: "PATCH", body: JSON.stringify(body) }),

  adminRepairResultsFixtureMapping: (eventId: number, apply = true) =>
    apiRequest("/api/admin/results/repair-fixture-mapping", { method: "POST", body: JSON.stringify({ eventId, apply }) }),

  oddsFetchNowWithParams: (body: { sportId: number; from?: string; to?: string; autoBackfillMapping?: boolean }) =>
    apiRequest("/api/odds/fetch", { method: "POST", body: JSON.stringify(body) }),

  mezzoFetchNow: (sportId: number) =>
    apiRequest("/api/admin/odds/mezzo/fetch-now", { method: "POST", body: JSON.stringify({ sportId }) }),

  apifootballSyncFixtures: (body: { from: string; to: string; leagueIds?: string[] }) =>
    apiRequest("/api/admin/odds/apifootball/fixtures/sync-from-events", { method: "POST", body: JSON.stringify(body) }),
};
