import { apiRequest } from "../../lib/apiClient";
import type { AdminFetchersStatusResponse, AdminOddsSettingsResponse, CatalogLatestResponse, FetchJobStatus, OddsConfigValue, OddsLatestResponse } from "./types";

export const dataFetchingApi = {
  oddsStatus: () => apiRequest<FetchJobStatus>("/api/odds/status"),
  oddsSetEnabled: (enabled: boolean) =>
    apiRequest("/api/odds/enabled", { method: "POST", body: JSON.stringify({ enabled }) }),
  oddsFetchNow: () => apiRequest("/api/odds/fetch", { method: "POST", body: JSON.stringify({ sportId: 501 }) }),
  oddsLatest: () => apiRequest<OddsLatestResponse>("/api/odds/latest?sportId=501"),

  catalogStatus: () => apiRequest<FetchJobStatus>("/api/catalog/status"),
  catalogSetEnabled: (enabled: boolean) =>
    apiRequest("/api/catalog/enabled", { method: "POST", body: JSON.stringify({ enabled }) }),
  catalogFetchNow: () => apiRequest("/api/catalog/fetch", { method: "POST" }),
  catalogLatest: () => apiRequest<CatalogLatestResponse>("/api/catalog/latest"),

  adminFetchersStatus: () => apiRequest<AdminFetchersStatusResponse>("/api/admin/fetchers/status"),
  adminSetFetcherEnabled: (name: string, enabled: boolean) =>
    apiRequest(`/api/admin/fetchers/${name}/enabled`, { method: "PATCH", body: JSON.stringify({ enabled }) }),

  adminOddsSettingsGet: () => apiRequest<AdminOddsSettingsResponse>("/api/admin/settings/odds"),
  adminOddsSettingsPatch: (body: OddsConfigValue) =>
    apiRequest("/api/admin/settings/odds", { method: "PATCH", body: JSON.stringify(body) }),

  adminRepairResultsFixtureMapping: (eventId: number, apply = true) =>
    apiRequest("/api/admin/results/repair-fixture-mapping", { method: "POST", body: JSON.stringify({ eventId, apply }) }),
};
