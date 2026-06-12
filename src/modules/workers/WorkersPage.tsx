import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAdminSetWorkerEnabled, useAdminWorkersStatus } from "../data-fetching/hooks";
import { dataFetchingApi } from "../data-fetching/api";

export function WorkersPage() {
  const workersStatus = useAdminWorkersStatus();
  const setWorkerEnabled = useAdminSetWorkerEnabled();
  const workers = workersStatus.data?.workers || [];
  const manualRuns = workersStatus.data?.manualRuns || {};

  const placing = useQuery({
    queryKey: ["admin-betslips-placing"],
    queryFn: () => dataFetchingApi.adminPlacingBetslips("placing", 50),
    refetchInterval: 5_000,
    refetchOnWindowFocus: false,
  });
  const failed = useQuery({
    queryKey: ["admin-betslips-failed"],
    queryFn: () => dataFetchingApi.adminPlacingBetslips("place_failed", 50),
    refetchInterval: 10_000,
    refetchOnWindowFocus: false,
  });
  const matchLogs = useQuery({
    queryKey: ["admin-provider-match-logs"],
    queryFn: dataFetchingApi.adminProviderMatchLogs,
    refetchInterval: 10_000,
    refetchOnWindowFocus: false,
  });

  const retry = useMutation({
    mutationFn: (slipId: string) => dataFetchingApi.adminRetryBetslip(slipId),
    onSuccess: () => {
      void placing.refetch();
      void failed.refetch();
    },
  });

  const runWorker = useMutation({
    mutationFn: async (key: string) => {
      if (key === "mezzo_football") return dataFetchingApi.adminRunMezzoFootballWorker();
      if (key === "thestatsapi_multisport") return dataFetchingApi.adminRunTheStatsApiMultiSportWorker();
      if (key === "thestatsapi_missing_odds") return dataFetchingApi.adminRunTheStatsApiMissingOddsWorker();
      throw new Error("Manual run is not available for this worker");
    },
    onSuccess: () => {
      void workersStatus.refetch();
      void matchLogs.refetch();
    },
  });

  const items = [
    { key: "odds", label: "Odds Worker", desc: "Controls odds fetch scheduling and refresh loops." },
    { key: "results", label: "Results Worker", desc: "Settles finished fixtures and updates slips." },
    { key: "betslip_placement", label: "Bet Placement Worker", desc: "Finalizes queued bet placements asynchronously." },
    { key: "mezzo_football", label: "Mezzo Football Worker", desc: "Fetches/stores Mezzo football games every 3 hours for StatsAPI detail matching.", manual: true },
    { key: "thestatsapi_multisport", label: "StatsAPI Multi-Sport Worker", desc: "Fetches fixtures and odds for every enabled TheStatsAPI sport.", manual: true },
    { key: "thestatsapi_missing_odds", label: "StatsAPI DB to Mezzo Odds", desc: "Uses stored StatsAPI fixtures missing odds, matches them to Mezzo, and fills from Mezzo every 3 hours.", manual: true },
  ];

  return (
    <div className="p-6 space-y-4">
      <div>
        <div className="text-white text-xl font-bold">Workers</div>
        <div className="text-zinc-500 text-sm mt-1">Pause/resume worker processes. Changes apply within a few seconds.</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {items.map((w) => {
          const enabled = workers.find((x: any) => x.name === w.key)?.enabled ?? true;
          const manualState = (manualRuns as any)[w.key];
          const running = Boolean(manualState?.running);
          return (
            <Card key={w.key} className="bg-[#1A1A1A] border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{w.label}</span>
                  <Badge className={enabled ? "bg-emerald-600" : "bg-zinc-700"}>{enabled ? "ON" : "OFF"}</Badge>
                </CardTitle>
                <CardDescription>{w.desc}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button
                    className="w-full"
                    variant={enabled ? "destructive" : "default"}
                    onClick={() => setWorkerEnabled.mutate({ name: w.key, enabled: !enabled })}
                    disabled={setWorkerEnabled.isPending || workersStatus.isLoading}
                  >
                    {enabled ? "Pause" : "Resume"}
                  </Button>
                  {(w as any).manual ? (
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => runWorker.mutate(w.key)}
                      disabled={runWorker.isPending || running}
                    >
                      {running ? "Running..." : "Run now"}
                    </Button>
                  ) : null}
                  {(w as any).manual && manualState?.finishedAt ? (
                    <div className="text-xs text-zinc-500">
                      Last run: {manualState.error ? "failed" : "finished"} in {Number(manualState.durationMs || 0)}ms
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {runWorker.data ? (
        <Card className="bg-[#101a10] border-emerald-900">
          <CardContent className="pt-6 text-sm text-emerald-200">
            Manual run started in background: <span className="font-mono">{String((runWorker.data as any).worker || "")}</span>
          </CardContent>
        </Card>
      ) : null}
      {runWorker.error ? (
        <Card className="bg-[#1f1111] border-red-900">
          <CardContent className="pt-6 text-sm text-red-200">
            Manual run failed: {String((runWorker.error as any)?.message || runWorker.error)}
          </CardContent>
        </Card>
      ) : null}

      <Card className="bg-[#1A1A1A] border-zinc-800">
        <CardHeader>
          <CardTitle>Worker / Matching Logs</CardTitle>
          <CardDescription>Shows StatsAPI-to-Mezzo matching, detail fallback, and worker fill errors.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-zinc-300 space-y-2 max-h-[420px] overflow-auto">
          {(matchLogs.data as any)?.rows?.length ? (
            (matchLogs.data as any).rows.map((r: any) => (
              <div key={r.id} className="border border-zinc-800 rounded-lg px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-mono text-xs text-zinc-400">{r.source} / {r.action}</div>
                  <Badge className={r.level === "error" ? "bg-red-700" : r.level === "warn" ? "bg-amber-700" : "bg-zinc-700"}>
                    {r.level}
                  </Badge>
                </div>
                <div className="text-white mt-1">{r.message}</div>
                <div className="text-xs text-zinc-500 mt-1">
                  {r.sourceEventId ? `StatsAPI ${r.sourceEventId}` : ""} {r.targetEventId ? `-> Mezzo ${r.targetEventId}` : ""}
                </div>
                {r.meta ? <pre className="text-xs text-zinc-500 mt-2 whitespace-pre-wrap">{JSON.stringify(r.meta, null, 2).slice(0, 1200)}</pre> : null}
              </div>
            ))
          ) : (
            <div className="text-zinc-500">{matchLogs.isLoading ? "Loading logs..." : "No matching logs yet."}</div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-[#1A1A1A] border-zinc-800">
          <CardHeader>
            <CardTitle>Queued Bets</CardTitle>
            <CardDescription>Slips currently in <span className="font-mono">placing</span>.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-zinc-300 space-y-2">
            {(placing.data as any)?.rows?.length ? (
              (placing.data as any).rows.map((r: any) => (
                <div key={r.id} className="flex items-center justify-between gap-2 border border-zinc-800 rounded-lg px-3 py-2">
                  <div className="min-w-0">
                    <div className="text-white font-mono text-xs truncate">{r.id}</div>
                    <div className="text-zinc-500 text-xs">attempts: {r.placementAttempts || 0}</div>
                  </div>
                  <Badge className="bg-zinc-700">{String(r.status)}</Badge>
                </div>
              ))
            ) : (
              <div className="text-zinc-500">No queued slips.</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-[#1A1A1A] border-zinc-800">
          <CardHeader>
            <CardTitle>Failed Bets</CardTitle>
            <CardDescription>Slips in <span className="font-mono">place_failed</span>. You can retry.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-zinc-300 space-y-2">
            {(failed.data as any)?.rows?.length ? (
              (failed.data as any).rows.map((r: any) => (
                <div key={r.id} className="flex items-center justify-between gap-2 border border-zinc-800 rounded-lg px-3 py-2">
                  <div className="min-w-0">
                    <div className="text-white font-mono text-xs truncate">{r.id}</div>
                    <div className="text-zinc-500 text-xs truncate">{r.placementError || "Unknown error"}</div>
                  </div>
                  <Button size="sm" onClick={() => retry.mutate(String(r.id))} disabled={retry.isPending}>
                    Retry
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-zinc-500">No failed slips.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
