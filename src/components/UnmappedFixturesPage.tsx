import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Database, RefreshCw, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiRequest } from "../lib/apiClient";

type UnmappedFixtureRow = {
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

type Candidate = {
  score: number;
  matchId: string | null;
  status: string | null;
  date: string | null;
  time: string | null;
  home: string | null;
  away: string | null;
  homeScore: string | number | null;
  awayScore: string | number | null;
};

type LeagueSuggestion = {
  apiFootballLeagueId: string;
  name: string;
  countryName: string | null;
  isEnabledForSync: boolean;
  isCronEnabled: boolean;
};

function fmtDateTimeUtc(v: any) {
  if (!v) return "—";
  const d = new Date(String(v));
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toISOString().replace("T", " ").slice(0, 16) + "Z";
}

export function UnmappedFixturesPage() {
  const UI_VERSION = "unmapped-fixtures-ui:v2-league-map";
  const [q, setQ] = useState("");
  const [includeNoPending, setIncludeNoPending] = useState(false);
  const [page, setPage] = useState(1);
  const [autoSettleAfterSave, setAutoSettleAfterSave] = useState(true);
  const limit = 50;
  const offset = (page - 1) * limit;

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    p.set("limit", String(limit));
    p.set("offset", String(offset));
    if (q.trim()) p.set("q", q.trim());
    if (includeNoPending) p.set("includeNoPending", "1");
    return `?${p.toString()}`;
  }, [limit, offset, q, includeNoPending]);

  const query = useQuery({
    queryKey: ["unmapped-fixtures", limit, offset, q, includeNoPending],
    queryFn: () => apiRequest<{ limit: number; offset: number; count: number; rows: UnmappedFixtureRow[] }>(`/api/admin/fixtures/unmapped${qs}`),
    staleTime: 10_000,
  });

  const rows = query.data?.rows || [];
  const count = query.data?.count || 0;
  const totalPages = Math.max(1, Math.ceil(count / limit));

  const [matchIdByFixtureId, setMatchIdByFixtureId] = useState<Record<string, string>>({});
  const [candidatesByFixtureId, setCandidatesByFixtureId] = useState<Record<string, Candidate[]>>({});
  const [loadingCandidates, setLoadingCandidates] = useState<Record<string, boolean>>({});
  const [leagueMapByFixtureId, setLeagueMapByFixtureId] = useState<
    Record<
      string,
      { leagueId: string; leagueName: string; country?: string | null; suggestions: LeagueSuggestion[]; selectedApiLeagueId: string }
    >
  >({});

  const setMatchIdMutation = useMutation({
    mutationFn: async (params: { fixtureId: string; apiFootballMatchId: string }) => {
      return apiRequest(`/api/admin/fixtures/${encodeURIComponent(params.fixtureId)}/apifootball-match-id`, {
        method: "PATCH",
        body: { apiFootballMatchId: params.apiFootballMatchId },
      });
    },
    onSuccess: async (_resp, vars) => {
      if (autoSettleAfterSave && vars?.fixtureId) {
        await apiRequest(`/api/admin/results/settle-fixture/${encodeURIComponent(vars.fixtureId)}`, { method: "POST" });
      }
      await query.refetch();
    },
  });

  const setLeagueMutation = useMutation({
    mutationFn: async (params: { leagueId: string; apiFootballLeagueId: string }) => {
      return apiRequest(`/api/admin/leagues/${encodeURIComponent(params.leagueId)}/apifootball-league-id`, {
        method: "PATCH",
        body: { apiFootballLeagueId: params.apiFootballLeagueId },
      });
    },
    onSuccess: async () => {
      await query.refetch();
    },
  });

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white uppercase italic">Unmapped Fixtures</h1>
          <p className="text-zinc-400 mt-1">Fixtures with missing `api_football_match_id` (manual mapping helper).</p>
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
              <CardDescription className="text-zinc-400">League / team / externalEventId</CardDescription>
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
              placeholder="e.g. Real Madrid or 25658935"
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
            <input type="checkbox" checked={autoSettleAfterSave} onChange={(e) => setAutoSettleAfterSave(Boolean(e.target.checked))} />
            auto-settle fixture after Save
          </label>
          <div className="text-xs text-zinc-500">
            {query.isFetching ? "Loading…" : `${rows.length} rows (total ${count})`} • page {page}/{totalPages}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#1A1A1A] border-zinc-800">
        <CardHeader>
          <CardTitle>Fixtures</CardTitle>
          <CardDescription>{query.isFetching ? "Refreshing…" : "Set the API-Football match_id then re-run the results worker."}</CardDescription>
        </CardHeader>
        <CardContent>
          {query.isError ? <div className="text-sm text-rose-300">Failed to load unmapped fixtures.</div> : null}
          <Table className="text-zinc-200">
            <TableHeader>
              <TableRow className="border-zinc-800">
                <TableHead className="text-zinc-400">When (UTC)</TableHead>
                <TableHead className="text-zinc-400">Fixture</TableHead>
                <TableHead className="text-zinc-400">League</TableHead>
                <TableHead className="text-zinc-400">Ext</TableHead>
                <TableHead className="text-zinc-400 text-right">Pending</TableHead>
                <TableHead className="text-zinc-400">API match_id</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => {
                const inputValue = matchIdByFixtureId[r.id] ?? "";
                const cands = candidatesByFixtureId[r.id] || [];
                const isLoadingCand = Boolean(loadingCandidates[r.id]);
                return (
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
                    <TableCell className="min-w-[260px]">
                      <div className="flex items-center gap-2">
                        <Input
                          value={inputValue}
                          onChange={(e) =>
                            setMatchIdByFixtureId((prev) => ({
                              ...prev,
                              [r.id]: e.target.value,
                            }))
                          }
                          className="bg-zinc-900 border-zinc-800 text-white h-9"
                          placeholder="numeric match_id"
                        />
                        <Button
                          disabled={setMatchIdMutation.isPending || !inputValue.trim()}
                          onClick={() => setMatchIdMutation.mutate({ fixtureId: r.id, apiFootballMatchId: inputValue.trim() })}
                          className="bg-brand text-black hover:bg-brand/90 rounded-xl font-bold text-[10px] uppercase h-9"
                        >
                          <Save className="w-4 h-4 mr-2" /> Save
                        </Button>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <Button
                          variant="outline"
                          className="border-zinc-800 text-zinc-200 rounded-xl font-bold text-[10px] uppercase h-8"
                          disabled={isLoadingCand || setMatchIdMutation.isPending}
                          onClick={async () => {
                            setLoadingCandidates((prev) => ({ ...prev, [r.id]: true }));
                            try {
                              try {
                                const resp = await apiRequest<{ candidates: Candidate[] }>(
                                  `/api/admin/fixtures/${encodeURIComponent(r.id)}/apifootball-candidates?days=3&limit=10`
                                );
                                setCandidatesByFixtureId((prev) => ({ ...prev, [r.id]: resp.candidates || [] }));
                              } catch (err: any) {
                                const details = err?.details ?? err?.error?.details;
                                if (details?.code === "LEAGUE_NOT_MAPPED" && details?.leagueId && Array.isArray(details?.suggestions)) {
                                  const suggestions: LeagueSuggestion[] = (details.suggestions || []) as any;
                                  const selectedApiLeagueId = String(suggestions?.[0]?.apiFootballLeagueId || "");
                                  setLeagueMapByFixtureId((prev) => ({
                                    ...prev,
                                    [r.id]: {
                                      leagueId: String(details.leagueId),
                                      leagueName: String(details.leagueName || ""),
                                      country: details.country ?? null,
                                      suggestions,
                                      selectedApiLeagueId,
                                    },
                                  }));
                                  return;
                                }
                                throw err;
                              }
                            } finally {
                              setLoadingCandidates((prev) => ({ ...prev, [r.id]: false }));
                            }
                          }}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" /> Suggest
                        </Button>
                        <span className="text-[10px] text-zinc-500">{isLoadingCand ? "Fetching…" : cands.length ? `${cands.length} suggestions` : ""}</span>
                      </div>

                      {cands.length ? (
                        <div className="mt-2 space-y-1">
                          {cands.map((c) => (
                            <button
                              key={`${r.id}:${c.matchId}:${c.score}`}
                              type="button"
                              className="w-full text-left text-[11px] bg-zinc-900/40 hover:bg-zinc-900/70 border border-zinc-800 rounded-lg px-2 py-1.5 text-zinc-200"
                              onClick={() => setMatchIdByFixtureId((prev) => ({ ...prev, [r.id]: String(c.matchId || "") }))}
                              disabled={!c.matchId}
                            >
                              <span className="font-bold text-zinc-100">{c.matchId || "—"}</span>
                              <span className="text-zinc-500"> • {c.score}% • </span>
                              <span className="text-zinc-300">
                                {c.home || ""} vs {c.away || ""}
                              </span>
                              <span className="text-zinc-500">
                                {" "}
                                • {c.date || ""} {c.time || ""} • {c.status || ""}
                              </span>
                            </button>
                          ))}
                        </div>
                      ) : null}

                      {leagueMapByFixtureId[r.id]?.suggestions?.length ? (
                        <div className="mt-2 p-2 rounded-lg border border-amber-500/20 bg-amber-500/5">
                          <div className="text-[11px] text-amber-300 font-bold">
                            League not mapped: {leagueMapByFixtureId[r.id].leagueName}
                            {leagueMapByFixtureId[r.id].country ? ` (${leagueMapByFixtureId[r.id].country})` : ""}
                          </div>
                          <div className="mt-2 flex flex-col md:flex-row gap-2">
                            <select
                              value={leagueMapByFixtureId[r.id].selectedApiLeagueId}
                              onChange={(e) =>
                                setLeagueMapByFixtureId((prev) => ({
                                  ...prev,
                                  [r.id]: { ...prev[r.id], selectedApiLeagueId: e.target.value },
                                }))
                              }
                              className="w-full md:flex-1 h-9 rounded-md bg-black/30 border border-zinc-800 px-3 text-zinc-200 text-[12px]"
                            >
                              {leagueMapByFixtureId[r.id].suggestions.map((s) => (
                                <option key={s.apiFootballLeagueId} value={s.apiFootballLeagueId}>
                                  {s.apiFootballLeagueId} — {s.name} {s.countryName ? `(${s.countryName})` : ""}
                                </option>
                              ))}
                            </select>
                            <Button
                              className="bg-amber-400 text-black hover:bg-amber-400/90 rounded-xl font-bold text-[10px] uppercase h-9"
                              disabled={setLeagueMutation.isPending || !leagueMapByFixtureId[r.id].selectedApiLeagueId}
                              onClick={async () => {
                                const cfg = leagueMapByFixtureId[r.id];
                                await setLeagueMutation.mutateAsync({
                                  leagueId: cfg.leagueId,
                                  apiFootballLeagueId: cfg.selectedApiLeagueId,
                                });
                                // Clear and re-run suggest.
                                setLeagueMapByFixtureId((prev) => {
                                  const copy = { ...prev };
                                  delete copy[r.id];
                                  return copy;
                                });
                                setLoadingCandidates((prev) => ({ ...prev, [r.id]: true }));
                                try {
                                  const resp2 = await apiRequest<{ candidates: Candidate[] }>(
                                    `/api/admin/fixtures/${encodeURIComponent(r.id)}/apifootball-candidates?days=3&limit=10`
                                  );
                                  setCandidatesByFixtureId((prev) => ({ ...prev, [r.id]: resp2.candidates || [] }));
                                } finally {
                                  setLoadingCandidates((prev) => ({ ...prev, [r.id]: false }));
                                }
                              }}
                            >
                              Map league
                            </Button>
                          </div>
                          <div className="mt-2 text-[10px] text-amber-200/80">
                            This sets `leagues.apiFootballLeagueId`. After mapping, click Suggest again (auto-runs).
                          </div>
                        </div>
                      ) : null}
                      {r.apiFootballMatchId ? (
                        <div className="text-[10px] text-zinc-500 mt-1">Currently: {String(r.apiFootballMatchId)}</div>
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })}
              {rows.length === 0 && !query.isFetching ? (
                <TableRow className="border-zinc-900">
                  <TableCell colSpan={6} className="text-zinc-400 py-8 text-center">
                    No unmapped fixtures found.
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
