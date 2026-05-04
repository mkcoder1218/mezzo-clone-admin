export type FetchJobStatus = {
  scheduler: { running: boolean };
  settings: { enabled: boolean; cron: string; lastRunAt?: string | null; lastError?: string | null };
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

