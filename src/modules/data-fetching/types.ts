export type FetchJobStatus = {
  scheduler: { running: boolean };
  settings: { enabled: boolean; cron: string; lastRunAt?: string | null; lastError?: string | null };
};

export type AdminFetchersStatusResponse = {
  success: true;
  data: Record<"mainOdds" | "detailOdds" | "results" | "liveOdds", {
    enabled: boolean;
    intervalMs: number;
    running?: boolean;
    lastRunAt?: string | null;
    lastSuccessAt?: string | null;
    lastErrorAt?: string | null;
    lastError?: string | null;
    durationMs?: number | null;
    lastUpdatedCount?: number | null;
    lastProviderRequestCount?: number | null;
  }>;
};

export type OddsConfigValue = {
  prematchOddsMaxAgeSeconds: number;
  detailOddsMaxAgeSeconds: number;
  liveOddsMaxAgeSeconds: number;
  mainOddsCronIntervalMs: number;
  detailOddsCronIntervalMs: number;
  resultsCronIntervalMs: number;
};

export type AdminOddsSettingsResponse = {
  success: true;
  data: {
    value: OddsConfigValue;
    defaults: OddsConfigValue;
  };
};

export type OddsLatestResponse = {
  snapshot: {
    id: string;
    fetchedAt: string;
    sportId: number;
    responseBody: any;
  } | null;
};

export type CatalogLatestResponse = {
  snapshot: {
    id: string;
    fetchedAt: string;
    responseBody: any;
  } | null;
};

export type ParsedGame = {
  eventId: string;
  eventName: string;
  eventStartTime: string;
  competitionName: string;
  sportName: string;
  marketsCount: number;
};
