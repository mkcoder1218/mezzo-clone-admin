import { apiRequest } from "../../lib/apiClient";

export type OddsSettings = {
  oddsProvider?: string | null;
  pissbetSocketUrl?: string | null;
  sportsGameOddsApiKey?: string | null;
  sportsGameOddsBaseUrl?: string | null;
  sportsGameOddsLeagueIds?: string[];
  sportsGameOddsBookmakerPriority?: string[];
  bookmakerPriority: string[];
  prematchOddsMaxAgeSeconds: number;
  detailOddsMaxAgeSeconds: number;
  liveOddsMaxAgeSeconds: number;
  mainOddsCronIntervalMs: number;
  detailOddsCronIntervalMs: number;
  resultsCronIntervalMs: number;
  liveBettingEnabled: boolean;
  marginEnabled: boolean;
  marginPercent: number;
  roundingDecimals: number;
  syncAllLeagues: boolean;
  syncLeagueLimit: number;
  apiFootballRequestDelayMs: number;
  apiFootballMaxRetries: number;
  apiFootballRetryBackoffMs: number;
  apiFootballBatchSize: number;
  apiFootballUseMatchIdFallback: boolean;
  apiFootballMaxRequestsPerRun: number;
};



export type OddsSettingsGetResponse = {
  settings: OddsSettings;
  defaults: OddsSettings;
  providers?: { key: string; label: string; supportsTopEvents: boolean }[];
  activeProvider?: string;
  explanation: Record<string, string>;
};

export type ApiFootballStatus = {
  provider: "apifootball";
  baseUrl: string;
  apiKeyConfigured: boolean;
  oddsProviderActive: boolean;
  rate?: { used: number; remaining: number; limit: number };
};

export type MezzoStatus = {
  provider: "mezzo";
  oddsProviderActive: boolean;
  latest: { catalogFetchedAt: string | null; topEventsFetchedAt: string | null };
};

export type SportsGameOddsStatus = {
  provider: "sports_game_odds";
  baseUrl: string;
  apiKeyConfigured: boolean;
  apiKeyMasked?: string | null;
  oddsProviderActive: boolean;
  leagueIds: string[];
  bookmakerPriority: string[];
};

export type ApiFootballLeagueRow = {
  id: string;
  apiFootballLeagueId: string;
  name: string;
  countryName: string | null;
  isActive: boolean;
  isEnabledForSync: boolean;
  isCronEnabled: boolean;
  cronIntervalMs: number;
  lastFixtureSyncAt: string | null;
  lastOddsSyncAt: string | null;
  lastDetailOddsSyncAt: string | null;
  lastError: string | null;
  priority: number;
  isTop: boolean;
  fixturesCount: number;
  fixturesWithMapping: number;
  fixturesWithOddsCount: number;
  oddsCount: number;
  missingOddsCount: number;
};

export type ApiFootballLeagueListResponse = {
  leagues: ApiFootballLeagueRow[];
  total: number;
  page: number;
  limit: number;
};

export type ApiFootballFixturesListResponse = {
  page: number;
  limit: number;
  count: number;
  fixtures: any[];
};

export type ApiFootballFixtureGetResponse = {
  fixture: any;
};

export const oddsManagementApi = {
  settingsGet: () => apiRequest<OddsSettingsGetResponse>("/api/admin/odds/settings"),
  settingsPut: (body: Partial<OddsSettings>) => apiRequest("/api/admin/odds/settings", { method: "PUT", body: JSON.stringify(body) }),

  apiFootballStatus: () => apiRequest<ApiFootballStatus>("/api/admin/odds/apifootball/status"),
  apiFootballTest: () => apiRequest("/api/admin/odds/apifootball/test-connection", { method: "POST" }),

  mezzoStatus: () => apiRequest<MezzoStatus>("/api/admin/odds/mezzo/status"),
  mezzoFetchNow: (sportId: number) =>
    apiRequest("/api/admin/odds/mezzo/fetch-now", { method: "POST", body: JSON.stringify({ sportId }) }),

  sportsGameOddsStatus: () => apiRequest<SportsGameOddsStatus>("/api/admin/odds/sports-game-odds/status"),

  leaguesFetchNow: () => apiRequest("/api/admin/odds/apifootball/leagues/fetch-now", { method: "POST" }),
  leaguesList: (q: { 
     search?: string; 
     country?: string; 
     syncEnabled?: boolean; 
     cronEnabled?: boolean; 
     active?: boolean; 
     page?: number; 
     limit?: number;
     from?: string;
     to?: string;
  }) => {
    const params = new URLSearchParams();
    if (q.search) params.set("search", q.search);
    if (q.country) params.set("country", q.country);
    if (q.syncEnabled !== undefined) params.set("syncEnabled", String(q.syncEnabled));
    if (q.cronEnabled !== undefined) params.set("cronEnabled", String(q.cronEnabled));
    if (q.active !== undefined) params.set("active", String(q.active));
    if (q.page) params.set("page", String(q.page));
    if (q.limit) params.set("limit", String(q.limit));
    if (q.from) params.set("from", q.from);
    if (q.to) params.set("to", q.to);
    return apiRequest<ApiFootballLeagueListResponse>(`/api/admin/odds/apifootball/leagues?${params.toString()}`);
  },
  leaguePatch: (id: string, body: Partial<ApiFootballLeagueRow>) =>
    apiRequest(`/api/admin/odds/apifootball/leagues/${id}`, { method: "PATCH", body: JSON.stringify(body) }),

  leaguesBulk: (ids: string[], body: Partial<ApiFootballLeagueRow>) =>
    apiRequest("/api/admin/odds/apifootball/leagues/bulk", { method: "PATCH", body: JSON.stringify({ ids, ...body }) }),
  
  leaguesEnableAllActive: () => apiRequest("/api/admin/odds/apifootball/leagues/enable-all", { method: "POST" }),
  leaguesDisableAll: () => apiRequest("/api/admin/odds/apifootball/leagues/disable-all", { method: "POST" }),

  // New targeted sync
  fetchFixtures: (body: { leagueIds: string[], from: string, to: string }) => 
    apiRequest("/api/admin/odds/apifootball/leagues/fetch-fixtures", { method: "POST", body: JSON.stringify(body) }),
  
  fetchOdds: (body: { 
    leagueIds: string[], 
    from: string, 
    to: string, 
    onlyMissingOrStale?: boolean,
    batchSize?: number,
    requestDelayMs?: number,
    autoFetchFixtures?: boolean
  }) => apiRequest("/api/admin/odds/apifootball/leagues/fetch-odds", { method: "POST", body: JSON.stringify(body) }),

  fetchDetailOdds: (body: { 
    leagueIds: string[], 
    from: string, 
    to: string, 
    markets?: string[],
    batchSize?: number,
    requestDelayMs?: number
  }) => apiRequest("/api/admin/odds/apifootball/leagues/fetch-detail-odds", { method: "POST", body: JSON.stringify(body) }),

  debugFetchOdds: (body: { 
    leagueIds: string[], 
    from: string, 
    to: string 
  }) => apiRequest<any>("/api/admin/odds/apifootball/leagues/debug-fetch-odds", { method: "POST", body: JSON.stringify(body) }),

  syncPreview: (body: { leagueIds: string[], from: string, to: string }) =>
    apiRequest<any>("/api/admin/odds/apifootball/leagues/sync-preview", { method: "POST", body: JSON.stringify(body) }),

  fetchFixturesAndOdds: (body: { 
    leagueIds: string[], 
    from: string, 
    to: string, 
    onlyMissingOrStale?: boolean,
    batchSize?: number,
    requestDelayMs?: number,
    maxRequestsPerRun?: number
  }) => apiRequest<any>("/api/admin/odds/apifootball/leagues/fetch-fixtures-and-odds", { method: "POST", body: JSON.stringify(body) }),

  deleteUnmappedFixtures: (body: {
    from?: string;
    to?: string;
    leagueIds?: string[];
    apiLeagueIds?: string[];
    mode?: "unmapped" | "missing_odds";
    dryRun?: boolean;
  }) =>
    apiRequest<any>("/api/admin/odds/apifootball/fixtures/delete-unmapped", { method: "POST", body: JSON.stringify(body) }),

  apiFootballFixturesList: (q: {
    page?: number;
    limit?: number;
    from?: string;
    to?: string;
    leagueId?: string;
    apiFootballLeagueId?: string;
    onlyMissingOdds?: boolean;
  }) => {
    const params = new URLSearchParams();
    if (q.page) params.set("page", String(q.page));
    if (q.limit) params.set("limit", String(q.limit));
    if (q.from) params.set("from", q.from);
    if (q.to) params.set("to", q.to);
    if (q.leagueId) params.set("leagueId", q.leagueId);
    if (q.apiFootballLeagueId) params.set("apiFootballLeagueId", q.apiFootballLeagueId);
    if (q.onlyMissingOdds !== undefined) params.set("onlyMissingOdds", String(q.onlyMissingOdds));
    return apiRequest<ApiFootballFixturesListResponse>(`/api/admin/odds/apifootball/fixtures?${params.toString()}`);
  },
  apiFootballFixtureGet: (id: string) => apiRequest<ApiFootballFixtureGetResponse>(`/api/admin/odds/apifootball/fixtures/${id}`),

  leagueDebug: (id: string) => apiRequest<any>(`/api/admin/odds/apifootball/leagues/${id}/debug`),

  oddsFetchBatch: (body: any) => apiRequest("/api/admin/odds/apifootball/fetch-odds-batch", { method: "POST", body: JSON.stringify(body) }),
  jobsList: () => apiRequest<any[]>("/api/admin/odds/apifootball/jobs"),
  jobCreate: (body: any) => apiRequest<any>("/api/admin/odds/apifootball/jobs/create", { method: "POST", body: JSON.stringify(body) }),
  jobRunNext: (id: string) => apiRequest<any>(`/api/admin/odds/apifootball/jobs/${id}/run-next`, { method: "POST" }),
  jobPause: (id: string) => apiRequest<any>(`/api/admin/odds/apifootball/jobs/${id}/pause`, { method: "POST" }),
  jobReset: (id: string) => apiRequest<any>(`/api/admin/odds/apifootball/jobs/${id}/reset`, { method: "POST" }),
};
