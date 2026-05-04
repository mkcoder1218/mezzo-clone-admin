import { apiRequest } from "../../lib/apiClient";
import type { CatalogLatestResponse, FetchJobStatus, OddsLatestResponse } from "./types";

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
  catalogLatest: () => apiRequest<CatalogLatestResponse>("/api/catalog/latest")
};

