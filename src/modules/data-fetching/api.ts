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

  adminOddsSettingsGet: async () => {
    const raw = await apiRequest<any>("/api/admin/odds/settings");
    return {
      success: true,
      data: {
        value: raw.settings,
        defaults: raw.defaults,
        providers: raw.providers,
        activeProvider: raw.activeProvider,
      },
    } as AdminOddsSettingsResponse & { data: any };
  },
  adminOddsSettingsPatch: (body: OddsConfigValue) =>
    apiRequest("/api/admin/odds/settings", { method: "PUT", body: JSON.stringify(body) }),

  sportsGameOddsStatus: () => apiRequest<any>("/api/admin/odds/sports-game-odds/status"),
  sportsGameOddsUsage: () => apiRequest<any>("/api/admin/odds/sports-game-odds/usage"),
  sportsGameOddsSports: () => apiRequest<any>("/api/admin/odds/sports-game-odds/sports"),
  sportsGameOddsLeagues: (sportID?: string) =>
    apiRequest<any>(`/api/admin/odds/sports-game-odds/leagues${sportID ? `?sportID=${encodeURIComponent(sportID)}` : ""}`),

  adminRepairResultsFixtureMapping: (eventId: number, apply = true) =>
    apiRequest("/api/admin/results/repair-fixture-mapping", { method: "POST", body: JSON.stringify({ eventId, apply }) }),

  oddsFetchNowWithParams: (body: { sportId: number; from?: string; to?: string; autoBackfillMapping?: boolean }) =>
    apiRequest("/api/odds/fetch", { method: "POST", body: JSON.stringify(body) }),

  mezzoFetchNow: (sportId: number) =>
    apiRequest("/api/admin/odds/mezzo/fetch-now", { method: "POST", body: JSON.stringify({ sportId }) }),

  mezzoResetOddsStatus: (options: { signal?: AbortSignal } = {}) =>
    apiRequest<any>("/api/admin/odds/mezzo/reset-odds/status", { signal: options.signal }),
  mezzoResetOddsStart: (sportId: number) =>
    apiRequest<any>("/api/admin/odds/mezzo/reset-odds/start", { method: "POST", body: JSON.stringify({ sportId }) }),
  mezzoResetOddsMapOnly: (body: { from?: string; to?: string; limit?: number } = {}) =>
    apiRequest<any>("/api/admin/odds/mezzo/reset-odds/map-only", { method: "POST", body: JSON.stringify(body) }),
  mezzoResetOddsRematch: (body: { from?: string; to?: string; limit?: number } = {}) =>
    apiRequest<any>("/api/admin/odds/mezzo/reset-odds/rematch", { method: "POST", body: JSON.stringify(body) }),
  mezzoResetOddsStop: () =>
    apiRequest<any>("/api/admin/odds/mezzo/reset-odds/stop", { method: "POST" }),
  mezzoResetOddsForceStop: () =>
    apiRequest<any>("/api/admin/odds/mezzo/reset-odds/force-stop", { method: "POST" }),
  mezzoResetOddsDebugMatch: (body: { fixtureId: string; leagueIdsLimit?: number }) =>
    apiRequest<any>("/api/admin/odds/mezzo/reset-odds/debug-match", { method: "POST", body: JSON.stringify(body) }),

  apifootballSyncFixtures: (body: { from: string; to: string; leagueIds?: string[] }) =>
    apiRequest("/api/admin/odds/apifootball/fixtures/sync-from-events", { method: "POST", body: JSON.stringify(body) }),

  apiFootballLeaguesFetchNow: () =>
    apiRequest<any>("/api/admin/odds/apifootball/leagues/fetch-now", { method: "POST" }),
  apiFootballLeaguesList: (params: { page?: number; limit?: number; search?: string; country?: string; syncEnabled?: boolean | null; active?: boolean | null } = {}) => {
    const qp = new URLSearchParams();
    if (params.page) qp.set("page", String(params.page));
    if (params.limit) qp.set("limit", String(params.limit));
    if (params.search) qp.set("search", params.search);
    if (params.country) qp.set("country", params.country);
    if (params.syncEnabled === true) qp.set("syncEnabled", "true");
    if (params.syncEnabled === false) qp.set("syncEnabled", "false");
    if (params.active === true) qp.set("active", "true");
    if (params.active === false) qp.set("active", "false");
    const qs = qp.toString();
    return apiRequest<any>(`/api/admin/odds/apifootball/leagues${qs ? `?${qs}` : ""}`);
  },
  apiFootballLeaguesPatchBulk: (body: { ids: string[]; patch: { isEnabledForSync?: boolean; isCronEnabled?: boolean; cronIntervalMs?: number; priority?: number; isTop?: boolean } }) =>
    apiRequest<any>("/api/admin/odds/apifootball/leagues/bulk", {
      method: "PATCH",
      body: JSON.stringify({ ids: body.ids, ...(body.patch || {}) }),
    }),
  apiFootballLeaguesEnableAll: () =>
    apiRequest<any>("/api/admin/odds/apifootball/leagues/enable-all", { method: "POST" }),
  apiFootballLeaguesDisableAll: () =>
    apiRequest<any>("/api/admin/odds/apifootball/leagues/disable-all", { method: "POST" }),
};
