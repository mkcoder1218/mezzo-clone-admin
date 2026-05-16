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

export function useAdminApiFootballSyncFixtures() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { from: string; to: string; leagueIds?: string[] }) => dataFetchingApi.apifootballSyncFixtures(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["odds-latest"] });
    }
  });
}
