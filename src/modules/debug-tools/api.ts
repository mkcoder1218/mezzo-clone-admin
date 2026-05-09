import { apiRequest } from "../../lib/apiClient";

export const debugToolsApi = {
  fetchersStatus: () => apiRequest("/api/admin/fetchers/status"),
  resultsMappingByExternalEventId: (externalEventId: string) =>
    apiRequest(`/api/admin/debug/results/event/${externalEventId}/mapping`),
  oddsFreshnessByFixtureId: (fixtureId: string) =>
    apiRequest(`/api/admin/debug/fixtures/${fixtureId}/odds-freshness`),
  oddsFreshnessByExternalEventId: (externalEventId: string) =>
    apiRequest(`/api/admin/debug/fixtures/by-external/${externalEventId}/odds-freshness`),
  oddsCompareByExternalEventId: (externalEventId: string) =>
    apiRequest(`/api/admin/debug/fixtures/by-external/${externalEventId}/odds-compare`),
  oddsRefreshByExternalEventId: (externalEventId: string) =>
    apiRequest(`/api/admin/debug/fixtures/by-external/${externalEventId}/odds-refresh`, { method: "POST" }),
};

