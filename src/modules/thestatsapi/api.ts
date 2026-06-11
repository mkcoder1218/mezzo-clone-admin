import { apiRequest } from "../../lib/apiClient";

export type TheStatsApiRate = {
  windowStartMs: number;
  used: number;
  limit: number;
  remaining: number;
};

export type TheStatsApiSyncFlags = {
  fixtureSyncEnabled: boolean;
  prematchOddsSyncEnabled: boolean;
  liveSyncEnabled: boolean;
  liveOddsSyncEnabled: boolean;
  resultsSyncEnabled: boolean;
  statsSyncEnabled: boolean;
  settlementEnabled: boolean;
};

export type TheStatsApiStatus = {
  provider: string;
  enabled: boolean;
  baseUrl: string;
  apiKeyConfigured: boolean;
  apiKeyPreview: string | null;
  oddsProviderActive: boolean;
  isDefaultProvider: boolean;
  timeoutMs: number;
  retryCount: number;
  rate: TheStatsApiRate;
  syncFlags: TheStatsApiSyncFlags;
};

export type TheStatsApiConnectionTestResult = {
  success: boolean;
  status?: string | null;
  timestamp?: string | null;
  error?: string | null;
  baseUrl?: string;
  apiKeyPreview?: string | null;
};

export const theStatsApiAdminApi = {
  getStatus: (): Promise<TheStatsApiStatus> =>
    apiRequest<TheStatsApiStatus>("/api/admin/odds/thestatsapi/status"),

  testConnection: (): Promise<TheStatsApiConnectionTestResult> =>
    apiRequest<TheStatsApiConnectionTestResult>("/api/admin/odds/thestatsapi/test-connection", {
      method: "POST",
    }),

  saveApiKey: (apiKey: string): Promise<{ success: boolean; apiKeyConfigured: boolean; apiKeyPreview: string | null }> =>
    apiRequest("/api/admin/odds/thestatsapi/api-key", {
      method: "POST",
      body: JSON.stringify({ apiKey }),
    }),

  toggleSyncFlag: (flag: string, enabled: boolean): Promise<{ success: boolean }> =>
    apiRequest("/api/admin/odds/thestatsapi/sync-flags", {
      method: "POST",
      body: JSON.stringify({ flag, enabled }),
    }),

  /** Updates the DB odds provider selection — same endpoint as Odds Management Settings Save */
  activateAsProvider: (): Promise<{ settings: any }> =>
    apiRequest("/api/admin/odds/settings", {
      method: "PUT",
      body: JSON.stringify({ oddsProvider: "thestatsapi" }),
    }),

  /**
   * Manually trigger fixture + odds ingestion from TheStatsAPI.
   */
  syncNow: (params?: { from?: string; to?: string; limit?: number; competitionId?: string; oddsOnly?: boolean }): Promise<{
    success: boolean;
    syncId?: string;
    message?: string;
    status?: string;
    fixtures?: { provider: string; matchesFetched: number; fixturesUpserted: number; errors: number; lastError?: string | null };
    odds?: { provider: string; fixturesProcessed: number; marketsUpserted: number; outcomesUpserted: number; errors: number };
    error?: string;
  }> =>
    apiRequest("/api/admin/odds/thestatsapi/sync", {
      method: "POST",
      body: JSON.stringify(params ?? {}),
    }),

  /**
   * Refresh fixture flags, then ingest odds only for fixtures marked odds-capable.
   */
  matchFixturesToOdds: (params?: { from?: string; to?: string; limit?: number; competitionId?: string }): Promise<{
    success: boolean;
    localOnly?: boolean;
    provider?: string;
    candidateMarkets?: number;
    marketsMatched?: number;
    outcomesMatched?: number;
    skippedConflicts?: number;
    error?: string;
  }> =>
    apiRequest("/api/admin/odds/thestatsapi/match-fixtures-odds", {
      method: "POST",
      body: JSON.stringify(params ?? {}),
    }),
};
