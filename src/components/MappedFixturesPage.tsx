import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Database, RefreshCw, Unlink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiRequest } from "../lib/apiClient";

type FixtureRow = {
  id: string;
  startsAt: string;
  status: string;
  externalProvider: string | null;
  externalEventId: string | number | null;
  apiFootballMatchId: string | number | null;
  leagueId: string;
  leagueName: string;
  homeTeamName: string;
  awayTeamName: string;
  pendingSelections: number;
};

function fmtDateTimeUtc(v: any) {
  if (!v) return "—";
  const d = new Date(String(v));
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toISOString().replace("T", " ").slice(0, 16) + "Z";
}

export function MappedFixturesPage() {
  const UI_VERSION = "mapped-fixtures-ui:v1";
  const [q, setQ] = useState("");
  const [includeNoPending, setIncludeNoPending] = useState(false);
  const [page, setPage] = useState(1);
  const [resetOnUnmap, setResetOnUnmap] = useState(false);
  const limit = 50;
  const offset = (page - 1) * limit;

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    p.set("limit", String(limit));
    p.set("offset", String(offset));
    if (q.trim()) p.set("q", q.trim());
    if (includeNoPending) p.set("includeNoPending", "1");
    const s = p.toString();
    return s ? `?${s}` : "";
  }, [limit, offset, q, includeNoPending]);

  const query = useQuery({
    queryKey: ["mapped-fixtures", limit, offset, q, includeNoPending],
    queryFn: () => apiRequest<{ limit: number; offset: number; count: number; rows: FixtureRow[] }>(`/api/admin/fixtures/mapped${qs}`),
    staleTime: 10_000,
  });

  const rows = query.data?.rows || [];
  const count = query.data?.count || 0;
  const totalPages = Math.max(1, Math.ceil(count / limit));

  const unmapMutation = useMutation({
    mutationFn: async (fixtureId: string) => {
      const suffix = resetOnUnmap ? "?reset=1" : "";
      return apiRequest(`/api/admin/fixtures/${encodeURIComponent(fixtureId)}/apifootball-match-id${suffix}`, { method: "DELETE" });
    },
    onSuccess: async () => {
      await query.refetch();
    },
  });

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white uppercase italic">Mapped Fixtures</h1>
          <p className="text-zinc-400 mt-1">Fixtures that already have `api_football_match_id` (unmap helper).</p>
          <p className="text-[10px] text-zinc-600 mt-1">{UI_VERSION}</p>
        </div>
        <Button
          onClick={() => query.refetch()}
          disabled={query.isFetching}
          variant="outline"
          className="border-zinc-800 text-zinc-200 rounded-xl font-bold text-[10px] uppercase"
        >
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </header>

      <Card className="bg-[#1A1A1A] border-zinc-800">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <Database className="w-5 h-5 text-zinc-400" />
            </div>
            <div>
              <CardTitle className="text-white">Search</CardTitle>
              <CardDescription className="text-zinc-400">League / team / externalEventId / match_id</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            <Input
              value={q}
              onChange={(e) => {
                setPage(1);
                setQ(e.target.value);
              }}
              className="bg-zinc-900 border-zinc-800 text-white"
              placeholder="e.g. Real Madrid or 610997"
            />
            <label className="flex items-center gap-2 text-xs text-zinc-400 select-none px-2">
              <input
                type="checkbox"
                checked={includeNoPending}
                onChange={(e) => {
                  setPage(1);
                  setIncludeNoPending(Boolean(e.target.checked));
                }}
              />
              include fixtures with 0 pending selections
            </label>
          </div>
          <label className="flex items-center gap-2 text-xs text-zinc-400 select-none">
            <input type="checkbox" checked={resetOnUnmap} onChange={(e) => setResetOnUnmap(Boolean(e.target.checked))} />
            reset status/scores on unmap
          </label>
          <div className="text-xs text-zinc-500">
            {query.isFetching ? "Loading…" : `${rows.length} rows (total ${count})`} • page {page}/{totalPages}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#1A1A1A] border-zinc-800">
        <CardHeader>
          <CardTitle>Fixtures</CardTitle>
          <CardDescription>{query.isFetching ? "Refreshing…" : "Unmap a fixture if it was mapped to the wrong match_id."}</CardDescription>
        </CardHeader>
        <CardContent>
          {query.isError ? <div className="text-sm text-rose-300">Failed to load mapped fixtures.</div> : null}
          <Table className="text-zinc-200">
            <TableHeader>
              <TableRow className="border-zinc-800">
                <TableHead className="text-zinc-400">When (UTC)</TableHead>
                <TableHead className="text-zinc-400">Fixture</TableHead>
                <TableHead className="text-zinc-400">League</TableHead>
                <TableHead className="text-zinc-400">Ext</TableHead>
                <TableHead className="text-zinc-400 text-right">Pending</TableHead>
                <TableHead className="text-zinc-400">API match_id</TableHead>
                <TableHead className="text-zinc-400 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id} className="border-zinc-900 align-top">
                  <TableCell className="text-zinc-300">{fmtDateTimeUtc(r.startsAt)}</TableCell>
                  <TableCell className="text-white">
                    <div className="flex flex-col">
                      <span className="font-bold">
                        {r.homeTeamName} vs {r.awayTeamName}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        {r.status} • fixtureId: {r.id}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-zinc-300">{r.leagueName}</TableCell>
                  <TableCell className="text-zinc-400 text-xs">
                    {r.externalProvider ? `${r.externalProvider}` : "—"}
                    {r.externalEventId ? <div className="text-[10px] text-zinc-500">{String(r.externalEventId)}</div> : null}
                  </TableCell>
                  <TableCell className="text-right font-bold">{Number(r.pendingSelections || 0)}</TableCell>
                  <TableCell className="font-mono text-xs">{r.apiFootballMatchId ? String(r.apiFootballMatchId) : "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      className="border-rose-500/30 text-rose-200 hover:bg-rose-500/10 rounded-xl font-bold text-[10px] uppercase h-8"
                      disabled={unmapMutation.isPending}
                      onClick={() => unmapMutation.mutate(r.id)}
                    >
                      <Unlink className="w-4 h-4 mr-2" /> Unmap
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && !query.isFetching ? (
                <TableRow className="border-zinc-900">
                  <TableCell colSpan={7} className="text-zinc-400 py-8 text-center">
                    No mapped fixtures found.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>

          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-9 px-4 rounded-xl border border-zinc-700 bg-zinc-900/40 text-zinc-200 text-xs font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-900/70"
            >
              Prev
            </button>
            <div className="text-xs text-zinc-500">
              Page {page} / {totalPages}
            </div>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="h-9 px-4 rounded-xl border border-zinc-700 bg-zinc-900/40 text-zinc-200 text-xs font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-900/70"
            >
              Next
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

