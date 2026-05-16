import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Bug, Search, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiRequest } from "../lib/apiClient";

export function ResultsDiagnosticsPage() {
  const [fixtureId, setFixtureId] = useState("");
  const [apiFootballMatchId, setApiFootballMatchId] = useState("");
  const [data, setData] = useState<any>(null);
  const [lastAction, setLastAction] = useState<any>(null);
  const [settleOnDiagnose, setSettleOnDiagnose] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      const id = fixtureId.trim();
      if (!id) throw new Error("fixtureId required");
      const qs = new URLSearchParams({ fixtureId: id });
      if (settleOnDiagnose) qs.set("settle", "1");
      return apiRequest(`/api/admin/results/diagnostics?${qs.toString()}`);
    },
    onSuccess: (resp) => setData(resp),
  });

  const mapMutation = useMutation({
    mutationFn: async () => {
      const id = fixtureId.trim();
      const mid = apiFootballMatchId.trim();
      if (!id) throw new Error("fixtureId required");
      if (!mid) throw new Error("apiFootballMatchId required");
      return apiRequest(`/api/admin/fixtures/${encodeURIComponent(id)}/apifootball-match-id`, {
        method: "PATCH",
        body: { apiFootballMatchId: mid },
      });
    },
    onSuccess: async () => {
      setLastAction({ action: "set_match_id", ok: true, at: new Date().toISOString() });
      await mutation.mutateAsync();
    },
  });

  const settleMutation = useMutation({
    mutationFn: async () => {
      const id = fixtureId.trim();
      if (!id) throw new Error("fixtureId required");
      return apiRequest(`/api/admin/results/settle-fixture/${encodeURIComponent(id)}`, { method: "POST" });
    },
    onSuccess: async () => {
      setLastAction({ action: "settle_fixture", ok: true, at: new Date().toISOString() });
      await mutation.mutateAsync();
    },
    onError: (err: any) => {
      setLastAction({ action: "settle_fixture", ok: false, at: new Date().toISOString(), error: String(err?.message || err) });
    },
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-white">
      <header>
        <h1 className="text-3xl font-bold font-display tracking-tight text-white uppercase italic">
          Results <span className="text-brand">Diagnostics</span>
        </h1>
        <p className="text-zinc-400 mt-1">Explain why a selection/fixture is still pending.</p>
      </header>

      <Card className="bg-[#1A1A1A] border-zinc-800/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <Bug className="w-5 h-5 text-zinc-400" />
            </div>
            <div>
              <CardTitle className="text-white">Lookup</CardTitle>
              <CardDescription className="text-zinc-400">Paste the `fixtureId` from the bet selections row.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <Input
              value={fixtureId}
              onChange={(e) => setFixtureId(e.target.value)}
              className="bg-zinc-900 border-zinc-800 text-white"
              placeholder="fixtureId (uuid)"
            />
            <Button
              disabled={mutation.isPending || !fixtureId.trim()}
              onClick={() => mutation.mutate()}
              className="bg-brand text-black hover:bg-brand/90 rounded-xl font-bold text-[10px] uppercase"
            >
              <Search className="w-4 h-4 mr-2" /> Diagnose
            </Button>
          </div>

          <label className="flex items-center gap-2 text-xs text-zinc-400 select-none">
            <input
              type="checkbox"
              checked={settleOnDiagnose}
              onChange={(e) => setSettleOnDiagnose(Boolean(e.target.checked))}
            />
            Run settlement during diagnose (`settle=1`)
          </label>

          {mutation.isError ? <div className="text-rose-400 text-sm">Request failed.</div> : null}

          <div className="pt-2 border-t border-zinc-800/60" />

          <div className="text-xs text-zinc-400">Manual mapping (sets `fixtures.apiFootballMatchId`)</div>
          <div className="flex flex-col md:flex-row gap-3">
            <Input
              value={apiFootballMatchId}
              onChange={(e) => setApiFootballMatchId(e.target.value)}
              className="bg-zinc-900 border-zinc-800 text-white"
              placeholder="apiFootballMatchId (numeric) e.g. 762112"
            />
            <Button
              disabled={mapMutation.isPending || !fixtureId.trim() || !apiFootballMatchId.trim()}
              onClick={() => mapMutation.mutate()}
              variant="outline"
              className="border-zinc-800 text-zinc-300 rounded-xl font-bold text-[10px] uppercase"
            >
              Set Match ID
            </Button>
          </div>
          {mapMutation.isError ? <div className="text-rose-400 text-sm">Mapping failed.</div> : null}

          <div className="pt-2 border-t border-zinc-800/60" />
          <div className="text-xs text-zinc-400">Settlement</div>
          <div className="flex items-center gap-3">
            <Button
              disabled={settleMutation.isPending || !fixtureId.trim()}
              onClick={() => settleMutation.mutate()}
              variant="outline"
              className="border-zinc-800 text-zinc-300 rounded-xl font-bold text-[10px] uppercase"
            >
              <Play className="w-4 h-4 mr-2" /> Settle Fixture Now
            </Button>
            {settleMutation.isError ? <div className="text-rose-400 text-sm">Settle failed.</div> : null}
          </div>

          <pre className="text-xs bg-zinc-950/40 border border-zinc-800/60 rounded-xl p-4 overflow-auto min-h-40">
            {data ? JSON.stringify(data, null, 2) : "No data yet."}
          </pre>
          <pre className="text-xs bg-zinc-950/20 border border-zinc-800/40 rounded-xl p-4 overflow-auto">
            {lastAction ? JSON.stringify(lastAction, null, 2) : "No actions yet."}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
