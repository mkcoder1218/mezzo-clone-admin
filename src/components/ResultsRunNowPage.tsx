import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Play, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "../lib/apiClient";

type JobResp = { jobId: string; status: string };
type JobStatusResp = { jobId?: string; status?: string; message?: string; error?: string; result?: any; finishedAt?: string };

export function ResultsRunNowPage() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<JobStatusResp | null>(null);

  const runMutation = useMutation({
    mutationFn: async () => apiRequest<JobResp>("/api/admin/results/fetch-now", { method: "POST" }),
    onSuccess: (data) => {
      setJobId(data.jobId);
      setJob(null);
    },
  });

  useEffect(() => {
    let timer: any = null;
    async function poll() {
      if (!jobId) return;
      const data = await apiRequest<JobStatusResp>(`/api/admin/jobs/${jobId}`);
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
                  const data = await apiRequest<JobStatusResp>(`/api/admin/jobs/${jobId}`);
                  setJob(data);
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
    </div>
  );
}

