import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RefreshCcw } from "lucide-react";
import { apiRequest } from "../lib/apiClient";

type ResultsResponse = { count: number; rows: any[] };

function todayYmd(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function ResultsPage() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [dtFrom, setDtFrom] = useState(todayYmd());
  const [dtTill, setDtTill] = useState(todayYmd());
  const [cashboxToken, setCashboxToken] = useState("");
  const qc = useQueryClient();
  const limit = 10;
  const offset = (page - 1) * limit;

  const resultsSettings = useQuery({
    queryKey: ["results-settings"],
    queryFn: () => apiRequest<{ settings: { token: string | null } }>("/api/results/settings"),
    staleTime: 60_000
  });

  // Initialize token field once settings load
  useEffect(() => {
    const t = resultsSettings.data?.settings?.token;
    if (t && cashboxToken === "") setCashboxToken(t);
  }, [resultsSettings.data?.settings?.token, cashboxToken]);

  const saveToken = useMutation({
    mutationFn: () =>
      apiRequest("/api/results/settings", {
        method: "POST",
        body: JSON.stringify({ token: cashboxToken })
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["results-settings"] });
    }
  });

  const listQuery = useQuery({
    queryKey: ["results-list", { q, page }],
    queryFn: () =>
      apiRequest<ResultsResponse>(
        `/api/results?limit=${limit}&offset=${offset}&status=finished${q ? `&q=${encodeURIComponent(q)}` : ""}`
      ),
    staleTime: 10_000
  });

  const syncMutation = useMutation({
    mutationFn: () =>
      apiRequest("/api/results/sync", {
        method: "POST",
        body: JSON.stringify({
          token: cashboxToken,
          dt_from: dtFrom,
          dt_till: dtTill,
          limit: 500,
          offset: 0,
          type: "sports",
          what: "results"
        })
      }),
    onSuccess: () => listQuery.refetch()
  });

  const rows = listQuery.data?.rows || [];
  const count = listQuery.data?.count || 0;
  const totalPages = Math.max(1, Math.ceil(count / limit));

  const meta = useMemo(() => ({ showing: rows.length, count, page, totalPages }), [rows.length, count, page, totalPages]);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-display font-bold text-white uppercase italic">
          Results <span className="text-brand">Sync</span>
        </h1>
        <p className="text-zinc-400">Fetch sports results from Cashbox, store as fixtures, and settle placed tickets.</p>
      </header>

      <Card className="bg-[#1A1A1A] border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Cashbox Sync</span>
            <Badge className="bg-zinc-700">SPORTS</Badge>
          </CardTitle>
          <CardDescription>Uses `https://cashbox.mezzo.bet/api/other/getStatistics`.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1 flex-1 min-w-[320px]">
              <label className="text-xs text-zinc-400">Cashbox Authorization Token</label>
              <Input
                value={cashboxToken}
                onChange={(e) => setCashboxToken(e.target.value)}
                placeholder="Paste token from cashbox request headers"
              />
            </div>
            <Button
              onClick={() => saveToken.mutate()}
              disabled={saveToken.isPending}
              className="bg-zinc-800 hover:bg-zinc-700"
            >
              {saveToken.isPending ? "Saving..." : "Save Token"}
            </Button>
            {saveToken.isError ? <p className="text-xs text-red-400">Save failed.</p> : null}
            {resultsSettings.isError ? <p className="text-xs text-red-400">Settings load failed.</p> : null}
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <label className="text-xs text-zinc-400">From</label>
              <Input value={dtFrom} onChange={(e) => setDtFrom(e.target.value)} type="date" className="w-[180px]" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-400">Till</label>
              <Input value={dtTill} onChange={(e) => setDtTill(e.target.value)} type="date" className="w-[180px]" />
            </div>
            <Button
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending || !cashboxToken.trim()}
              className="bg-zinc-800 hover:bg-zinc-700"
            >
              <RefreshCcw className="w-4 h-4 mr-2" />
              {syncMutation.isPending ? "Syncing..." : "Sync Now"}
            </Button>
            {syncMutation.isError ? <p className="text-xs text-red-400">Sync failed.</p> : null}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#1A1A1A] border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Stored Results</span>
            <div className="flex items-center gap-2">
              <Input
                value={q}
                onChange={(e) => {
                  setPage(1);
                  setQ(e.target.value);
                }}
                placeholder="Search (team, league, country, sport)"
                className="w-[360px]"
              />
              <Badge className="bg-emerald-700">FINISHED</Badge>
            </div>
          </CardTitle>
          <CardDescription>
            Showing {meta.showing} of {meta.count}. Page {meta.page} / {meta.totalPages}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto max-h-[520px]">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-zinc-400 border-b border-zinc-800">
                  <th className="py-2 pr-3">Sport</th>
                  <th className="py-2 pr-3">Competition</th>
                  <th className="py-2 pr-3">Start</th>
                  <th className="py-2 pr-3">Event</th>
                  <th className="py-2 pr-3">Score</th>
                  <th className="py-2 pr-3">Synced</th>
                </tr>
              </thead>
              <tbody>
                {listQuery.isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-zinc-500 text-sm">
                      Loading...
                    </td>
                  </tr>
                ) : rows.length ? (
                  rows.map((r: any) => (
                    <tr key={r.id} className="border-b border-zinc-900">
                      <td className="py-2 pr-3 text-zinc-200">{r.Sport?.name || "-"}</td>
                      <td className="py-2 pr-3 text-zinc-200">
                        {(r.League?.country ? `${r.League.country} - ` : "") + (r.League?.name || "-")}
                      </td>
                      <td className="py-2 pr-3 text-zinc-300">{r.startsAt ? new Date(r.startsAt).toLocaleString() : "-"}</td>
                      <td className="py-2 pr-3 text-white">
                        {(r.homeTeam?.name || "-") + " V " + (r.awayTeam?.name || "-")}
                      </td>
                      <td className="py-2 pr-3 font-mono text-brand">
                        {r.externalScoreRaw || (r.homeScore != null && r.awayScore != null ? `${r.homeScore}-${r.awayScore}` : "-")}
                      </td>
                      <td className="py-2 pr-3 text-zinc-400">{r.externalSyncedAt ? new Date(r.externalSyncedAt).toLocaleString() : "-"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-zinc-500 text-sm">
                      No results yet. Run Sync Now.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4">
            <Button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="bg-zinc-800 hover:bg-zinc-700"
            >
              Prev
            </Button>
            <Button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="bg-zinc-800 hover:bg-zinc-700"
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
