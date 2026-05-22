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

  const retry = useMutation({
    mutationFn: (slipId: string) => dataFetchingApi.adminRetryBetslip(slipId),
    onSuccess: () => {
      void placing.refetch();
      void failed.refetch();
    },
  });

  const items = [
    { key: "odds", label: "Odds Worker", desc: "Controls odds fetch scheduling and refresh loops." },
    { key: "results", label: "Results Worker", desc: "Settles finished fixtures and updates slips." },
    { key: "betslip_placement", label: "Bet Placement Worker", desc: "Finalizes queued bet placements asynchronously." },
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
                <Button
                  className="w-full"
                  variant={enabled ? "destructive" : "default"}
                  onClick={() => setWorkerEnabled.mutate({ name: w.key, enabled: !enabled })}
                  disabled={setWorkerEnabled.isPending || workersStatus.isLoading}
                >
                  {enabled ? "Pause" : "Resume"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

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
