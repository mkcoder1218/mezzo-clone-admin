import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { dataFetchingApi } from "./api";

export function useOddsStatus() {
  return useQuery({ queryKey: ["odds-status"], queryFn: dataFetchingApi.oddsStatus, refetchInterval: 10000 });
}

export function useCatalogStatus() {
  return useQuery({ queryKey: ["catalog-status"], queryFn: dataFetchingApi.catalogStatus, refetchInterval: 10000 });
}

export function useOddsLatest() {
  return useQuery({ queryKey: ["odds-latest"], queryFn: dataFetchingApi.oddsLatest, refetchInterval: 10000 });
}

export function useCatalogLatest() {
  return useQuery({ queryKey: ["catalog-latest"], queryFn: dataFetchingApi.catalogLatest, refetchInterval: 10000 });
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
    mutationFn: dataFetchingApi.oddsFetchNow,
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

