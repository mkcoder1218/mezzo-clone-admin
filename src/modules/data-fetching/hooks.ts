import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { dataFetchingApi } from "./api";

export function useOddsStatus() {
  return useQuery({ queryKey: ["odds-status"], queryFn: dataFetchingApi.oddsStatus, refetchOnWindowFocus: false });
}

export function useCatalogStatus() {
  return useQuery({ queryKey: ["catalog-status"], queryFn: dataFetchingApi.catalogStatus, refetchOnWindowFocus: false });
}

export function useOddsLatest() {
  return useQuery({
    queryKey: ["odds-latest", 501],
    queryFn: () => dataFetchingApi.oddsLatest(501),
    refetchOnWindowFocus: false,
  });
}

export function useCatalogLatest() {
  return useQuery({ queryKey: ["catalog-latest"], queryFn: dataFetchingApi.catalogLatest, refetchOnWindowFocus: false });
}

export function useOddsSetEnabled() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (enabled: boolean) => dataFetchingApi.oddsSetEnabled(enabled),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["odds-status"] })
  });
}

export function useCatalogSetEnabled() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (enabled: boolean) => dataFetchingApi.catalogSetEnabled(enabled),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["catalog-status"] })
  });
}

export function useOddsFetchNow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sportId: number) => dataFetchingApi.oddsFetchNow(sportId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["odds-status"] });
      qc.invalidateQueries({ queryKey: ["odds-latest"] });
    }
  });
}

export function useCatalogFetchNow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: dataFetchingApi.catalogFetchNow,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["catalog-status"] });
      qc.invalidateQueries({ queryKey: ["catalog-latest"] });
    }
  });
}

export function useAdminFetchersStatus() {
  return useQuery({ queryKey: ["admin-fetchers-status"], queryFn: dataFetchingApi.adminFetchersStatus, refetchOnWindowFocus: false, refetchInterval: 10_000 });
}

export function useAdminSetFetcherEnabled() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, enabled }: { name: string; enabled: boolean }) => dataFetchingApi.adminSetFetcherEnabled(name, enabled),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-fetchers-status"] }),
  });
}

export function useAdminWorkersStatus() {
  return useQuery({ queryKey: ["admin-workers-status"], queryFn: dataFetchingApi.adminWorkersStatus, refetchOnWindowFocus: false, refetchInterval: 10_000 });
}

export function useAdminSetWorkerEnabled() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, enabled }: { name: string; enabled: boolean }) => dataFetchingApi.adminSetWorkerEnabled(name, enabled),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-workers-status"] }),
  });
}

export function useAdminOddsSettings() {
  return useQuery({ queryKey: ["admin-odds-settings"], queryFn: dataFetchingApi.adminOddsSettingsGet, refetchOnWindowFocus: false });
}

export function useAdminSaveOddsSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => dataFetchingApi.adminOddsSettingsPatch(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-odds-settings"] });
      qc.invalidateQueries({ queryKey: ["admin-fetchers-status"] });
    },
  });
}

export function useAdminSportsGameOddsStatus() {
  return useQuery({ queryKey: ["admin-sports-game-odds-status"], queryFn: dataFetchingApi.sportsGameOddsStatus, refetchOnWindowFocus: false });
}

export function useAdminSportsGameOddsUsage() {
  return useQuery({ queryKey: ["admin-sports-game-odds-usage"], queryFn: dataFetchingApi.sportsGameOddsUsage, refetchOnWindowFocus: false });
}

export function useAdminSportsGameOddsSports() {
  return useQuery({ queryKey: ["admin-sports-game-odds-sports"], queryFn: dataFetchingApi.sportsGameOddsSports, refetchOnWindowFocus: false });
}

export function useAdminSportsGameOddsLeagues(sportID?: string) {
  return useQuery({
    queryKey: ["admin-sports-game-odds-leagues", sportID || ""],
    queryFn: () => dataFetchingApi.sportsGameOddsLeagues(sportID),
    refetchOnWindowFocus: false,
  });
}

export function useAdminSportsGameOddsRawEvents() {
  return useMutation({
    mutationFn: (params: { leagueID?: string; eventID?: string; sportID?: string; limit?: number; oddsAvailable?: boolean; bookmakers?: string }) =>
      dataFetchingApi.sportsGameOddsRawEvents(params),
  });
}

export function useAdminRepairResultsFixtureMapping() {
  return useMutation({
    mutationFn: ({ eventId, apply }: { eventId: number; apply?: boolean }) => dataFetchingApi.adminRepairResultsFixtureMapping(eventId, apply !== false),
  });
}

export function useAdminOddsFetchAdvanced() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { sportId: number; from?: string; to?: string; autoBackfillMapping?: boolean }) =>
      dataFetchingApi.oddsFetchNowWithParams(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["odds-status"] });
      qc.invalidateQueries({ queryKey: ["odds-latest"] });
    }
  });
}

export function useAdminMezzoFetchNow() {
  return useMutation({
    mutationFn: (sportId: number) => dataFetchingApi.mezzoFetchNow(sportId),
  });
}

export function useAdminMezzoResetOddsStatus() {
  return useQuery({
    queryKey: ["mezzo-reset-odds-status"],
    // React Query will pass an AbortSignal; apiRequest/fetch will cancel the in-flight request
    // when a new refetch starts, preventing a pile-up of pending requests.
    queryFn: ({ signal }) => (dataFetchingApi.mezzoResetOddsStatus as any)({ signal }),
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
    // Poll only while the job is running; slower interval to reduce load.
    refetchInterval: (q) => ((q as any)?.state?.data?.running ? 3000 : false),
  });
}

export function useAdminMezzoResetOddsStart() {
  return useMutation({
    mutationFn: (sportId: number) => dataFetchingApi.mezzoResetOddsStart(sportId),
  });
}

export function useAdminMezzoResetOddsMapOnly() {
  return useMutation({
    mutationFn: (body: { from?: string; to?: string; limit?: number } = {}) => dataFetchingApi.mezzoResetOddsMapOnly(body),
  });
}

export function useAdminMezzoResetOddsRematch() {
  return useMutation({
    mutationFn: (body: { from?: string; to?: string; limit?: number } = {}) => dataFetchingApi.mezzoResetOddsRematch(body),
  });
}

export function useAdminMezzoResetOddsDebugMatch() {
  return useMutation({
    mutationFn: (body: { fixtureId: string; leagueIdsLimit?: number }) => dataFetchingApi.mezzoResetOddsDebugMatch(body),
  });
}

export function useAdminMezzoResetOddsStop() {
  return useMutation({
    mutationFn: () => dataFetchingApi.mezzoResetOddsStop(),
  });
}

export function useAdminMezzoResetOddsForceStop() {
  return useMutation({
    mutationFn: () => dataFetchingApi.mezzoResetOddsForceStop(),
  });
}

export function useAdminApiFootballSyncFixtures() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { from: string; to: string; leagueIds?: string[] }) => dataFetchingApi.apifootballSyncFixtures(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["odds-latest"] });
    }
  });
}

export function useAdminApiFootballLeaguesList(params: { page: number; limit: number; search: string; syncEnabled: boolean | null; active: boolean | null }) {
  return useQuery({
    queryKey: ["apifootball-leagues", params],
    queryFn: () => dataFetchingApi.apiFootballLeaguesList(params),
    refetchOnWindowFocus: false,
    staleTime: 10_000,
  });
}

export function useAdminApiFootballLeaguesFetchNow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => dataFetchingApi.apiFootballLeaguesFetchNow(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["apifootball-leagues"] }),
  });
}

export function useAdminApiFootballLeaguesPatchBulk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { ids: string[]; patch: { isEnabledForSync?: boolean; isActive?: boolean } }) => dataFetchingApi.apiFootballLeaguesPatchBulk(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["apifootball-leagues"] }),
  });
}

export function useAdminApiFootballLeaguesEnableAll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => dataFetchingApi.apiFootballLeaguesEnableAll(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["apifootball-leagues"] }),
  });
}

export function useAdminApiFootballLeaguesDisableAll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => dataFetchingApi.apiFootballLeaguesDisableAll(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["apifootball-leagues"] }),
  });
}
