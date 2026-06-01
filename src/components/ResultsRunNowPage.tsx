import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Play, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "../lib/apiClient";

type JobResp = { jobId: string; status: string };
type JobStatusResp = { jobId?: string; status?: string; message?: string; error?: string; result?: any; finishedAt?: string };

function unwrapJobStatus(data: any): JobStatusResp {
  if (!data) return {};
  if (data.job && typeof data.job === "object") return { jobId: data.jobId, ...(data.job as any) };
  return data as JobStatusResp;
}

export function ResultsRunNowPage() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<JobStatusResp | null>(null);
  const [statsJobId, setStatsJobId] = useState<string | null>(null);
  const [statsJob, setStatsJob] = useState<JobStatusResp | null>(null);
  const [unsupported, setUnsupported] = useState<any>(null);
  const [unsupportedLoading, setUnsupportedLoading] = useState(false);
  const [unsupportedError, setUnsupportedError] = useState<string | null>(null);
  const [repairJobId, setRepairJobId] = useState<string | null>(null);
  const [repairJob, setRepairJob] = useState<JobStatusResp | null>(null);

  const runMutation = useMutation({
    mutationFn: async () => apiRequest<JobResp>("/api/admin/results/fetch-now", { method: "POST" }),
    onSuccess: (data) => {
      setJobId(data.jobId);
      setJob(null);
    },
  });

  const statsMutation = useMutation({
    mutationFn: async () => apiRequest<JobResp>("/api/admin/results/match-statistics-now", { method: "POST" }),
    onSuccess: (data) => {
      setStatsJobId(data.jobId);
      setStatsJob(null);
    },
  });

  const repairMutation = useMutation({
    mutationFn: async () =>
      apiRequest<JobResp>("/api/admin/results/repair-auto-void", {
        method: "POST",
        body: JSON.stringify({ maxSlips: 100, adjustWallet: true }),
        headers: { "Content-Type": "application/json" },
      } as any),
    onSuccess: (data) => {
      setRepairJobId(data.jobId);
      setRepairJob(null);
    },
  });

  useEffect(() => {
    let timer: any = null;
    async function poll() {
      if (!jobId) return;
      const raw = await apiRequest<any>(`/api/admin/jobs/${jobId}`);
      const data = unwrapJobStatus(raw);
      setJob(data);
      const s = String(data?.status || "");
      if (s && s !== "running") return;
      timer = setTimeout(poll, 1200);
    }
    void poll();
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [jobId]);

  useEffect(() => {
    let timer: any = null;
    async function poll() {
      if (!statsJobId) return;
      const raw = await apiRequest<any>(`/api/admin/jobs/${statsJobId}`);
      const data = unwrapJobStatus(raw);
      setStatsJob(data);
      const s = String(data?.status || "");
      if (s && s !== "running") return;
      timer = setTimeout(poll, 1200);
    }
    void poll();
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [statsJobId]);

  useEffect(() => {
    let timer: any = null;
    async function poll() {
      if (!repairJobId) return;
      const raw = await apiRequest<any>(`/api/admin/jobs/${repairJobId}`);
      const data = unwrapJobStatus(raw);
      setRepairJob(data);
      const s = String(data?.status || "");
      if (s && s !== "running") return;
      timer = setTimeout(poll, 1200);
    }
    void poll();
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [repairJobId]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-white">
      <header>
        <h1 className="text-3xl font-bold font-display tracking-tight text-white uppercase italic">
          Results <span className="text-brand">Run Now</span>
        </h1>
        <p className="text-zinc-400 mt-1">Manually trigger the results worker cycle to update winner selections.</p>
      </header>

      <Card className="bg-[#1A1A1A] border-zinc-800/50">
        <CardHeader>
          <CardTitle className="text-white">Worker</CardTitle>
          <CardDescription className="text-zinc-400">Runs the same job as the cron.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              disabled={runMutation.isPending}
              onClick={() => runMutation.mutate()}
              className="bg-brand text-black hover:bg-brand/90 rounded-xl font-bold text-[10px] uppercase"
            >
              <Play className="w-4 h-4 mr-2" /> Run Now
            </Button>
            {jobId ? (
              <Button
                variant="outline"
                className="border-zinc-800 text-zinc-400 rounded-xl font-bold text-[10px] uppercase"
                onClick={async () => {
                  const raw = await apiRequest<any>(`/api/admin/jobs/${jobId}`);
                  setJob(unwrapJobStatus(raw));
                }}
              >
                <RefreshCw className="w-4 h-4 mr-2" /> Refresh
              </Button>
            ) : null}
          </div>

          <div className="text-xs text-zinc-400">
            jobId: <span className="text-white">{jobId || "—"}</span>
          </div>

          {job ? (
            <pre className="text-xs bg-zinc-950/40 border border-zinc-800/60 rounded-xl p-4 overflow-auto">
              {JSON.stringify(job, null, 2)}
            </pre>
          ) : (
            <div className="text-zinc-500 text-sm">No job started yet.</div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-[#1A1A1A] border-zinc-800/50">
        <CardHeader>
          <CardTitle className="text-white">Statistics Markets</CardTitle>
          <CardDescription className="text-zinc-400">
            Fetches API-Football statistics for finished fixtures and re-runs settlement for stats-based markets.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              disabled={statsMutation.isPending}
              onClick={() => statsMutation.mutate()}
              className="bg-brand text-black hover:bg-brand/90 rounded-xl font-bold text-[10px] uppercase"
            >
              <Play className="w-4 h-4 mr-2" /> Match Statistics
            </Button>
            {statsJobId ? (
              <Button
                variant="outline"
                className="border-zinc-800 text-zinc-400 rounded-xl font-bold text-[10px] uppercase"
                onClick={async () => {
                  const raw = await apiRequest<any>(`/api/admin/jobs/${statsJobId}`);
                  setStatsJob(unwrapJobStatus(raw));
                }}
              >
                <RefreshCw className="w-4 h-4 mr-2" /> Refresh
              </Button>
            ) : null}
          </div>

          <div className="text-xs text-zinc-400">
            jobId: <span className="text-white">{statsJobId || "â€”"}</span>
          </div>

          {statsJob ? (
            <pre className="text-xs bg-zinc-950/40 border border-zinc-800/60 rounded-xl p-4 overflow-auto">
              {JSON.stringify(statsJob, null, 2)}
            </pre>
          ) : (
            <div className="text-zinc-500 text-sm">No job started yet.</div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-[#1A1A1A] border-zinc-800/50">
        <CardHeader>
          <CardTitle className="text-white">Repair Auto-Void (Dev)</CardTitle>
          <CardDescription className="text-zinc-400">
            Re-opens previously auto-voided selections for supported score-based markets, then re-runs settlement (adjusts wallet balance in dev).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              disabled={repairMutation.isPending}
              onClick={() => repairMutation.mutate()}
              className="bg-brand text-black hover:bg-brand/90 rounded-xl font-bold text-[10px] uppercase"
            >
              <Play className="w-4 h-4 mr-2" /> Repair & Settle
            </Button>
            {repairJobId ? (
              <Button
                variant="outline"
                className="border-zinc-800 text-zinc-400 rounded-xl font-bold text-[10px] uppercase"
                onClick={async () => {
                  const raw = await apiRequest<any>(`/api/admin/jobs/${repairJobId}`);
                  setRepairJob(unwrapJobStatus(raw));
                }}
              >
                <RefreshCw className="w-4 h-4 mr-2" /> Refresh
              </Button>
            ) : null}
          </div>

          <div className="text-xs text-zinc-400">
            jobId: <span className="text-white">{repairJobId || "â€”"}</span>
          </div>

          {repairJob ? (
            <pre className="text-xs bg-zinc-950/40 border border-zinc-800/60 rounded-xl p-4 overflow-auto">
              {JSON.stringify(repairJob, null, 2)}
            </pre>
          ) : (
            <div className="text-zinc-500 text-sm">No job started yet.</div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-[#1A1A1A] border-zinc-800/50">
        <CardHeader>
          <CardTitle className="text-white">Unsupported Markets</CardTitle>
          <CardDescription className="text-zinc-400">
            Lists market keys currently being auto-voided or marked unsupported, so we can add statistics matching rules.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              disabled={unsupportedLoading}
              onClick={async () => {
                setUnsupportedLoading(true);
                setUnsupportedError(null);
                try {
                  const data = await apiRequest<any>("/api/admin/results/unsupported-markets?onlyFinished=true&limit=200");
                  setUnsupported(data);
                } catch (e: any) {
                  setUnsupportedError(String(e?.message || e));
                } finally {
                  setUnsupportedLoading(false);
                }
              }}
              className="bg-brand text-black hover:bg-brand/90 rounded-xl font-bold text-[10px] uppercase"
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Fetch Unsupported
            </Button>
            {unsupported ? (
              <Button
                variant="outline"
                className="border-zinc-800 text-zinc-400 rounded-xl font-bold text-[10px] uppercase"
                onClick={() => {
                  setUnsupported(null);
                  setUnsupportedError(null);
                }}
              >
                Clear
              </Button>
            ) : null}
          </div>

          {unsupportedError ? <div className="text-xs text-red-400">{unsupportedError}</div> : null}

          {unsupported ? (
            <pre className="text-xs bg-zinc-950/40 border border-zinc-800/60 rounded-xl p-4 overflow-auto">
              {JSON.stringify(unsupported, null, 2)}
            </pre>
          ) : (
            <div className="text-zinc-500 text-sm">No data fetched yet.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
