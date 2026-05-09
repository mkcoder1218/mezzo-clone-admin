import { apiRequest } from "../../lib/apiClient";

export type OddsFreshnessResponse = {
  success: boolean;
  data: any;
};

export type OddsCompareResponse = {
  success: boolean;
  data: any;
};

export type OddsRefreshResponse = {
  success: boolean;
  data: {
    fixtureId: string;
    externalEventId: string;
    marketsReturned: number;
    outcomesUpserted: number;
    fetchedAt: string;
  };
};

export const oddsDebugApi = {
  freshnessByExternal: (externalEventId: string) =>
    apiRequest<OddsFreshnessResponse>(`/api/admin/debug/fixtures/by-external/${externalEventId}/odds-freshness`),
  compareByExternal: (externalEventId: string) =>
    apiRequest<OddsCompareResponse>(`/api/admin/debug/fixtures/by-external/${externalEventId}/odds-compare`),
  refreshByExternal: (externalEventId: string) =>
    apiRequest<OddsRefreshResponse>(`/api/admin/debug/fixtures/by-external/${externalEventId}/odds-refresh`, {
      method: "POST"
    })
};
