import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Fragment, useMemo, useState } from "react";
import { apiRequest } from "../lib/apiClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight } from "lucide-react";

type SlipRow = {
  betSlipId: string;
  status: string;
  result: string;
  stake: string | number | null;
  potentialPayout: string | number | null;
  payout: string | number | null;
  walletCreditRef: string | null;
  paidAt: string | null;
  placedAt: string | null;
  settledAt: string | null;
  username: string | null;
  selectionCount: number;
  openSelectionCount: number;
  fixtureProviders: string[] | null;
  oddsProviders: string[] | null;
  sampleMatch: string | null;
};

type ListResp = {
  count: number;
  limit: number;
  offset: number;
  rows: SlipRow[];
};

function money(v: any) {
  const n = Number(v || 0);
  return Number.isFinite(n) ? n.toFixed(2) : "0.00";
}

function shortId(id: string) {
  return id ? `${id.slice(0, 8)}...${id.slice(-4)}` : "-";
}

function finalCredit(ref?: string | null) {
  const s = String(ref || "");
  return s.startsWith("settlement:") || s.startsWith("refund:");
}

function selectionLabel(s: any) {
  return s?.outcome?.name || s?.outcomeName || s?.selectionName || s?.outcome?.key || s?.outcomeKey || "-";
}

function marketLabel(s: any) {
  return s?.market?.name || s?.marketName || s?.market?.key || s?.marketKey || "-";
}

function fixtureLabel(s: any) {
  const fixture = s?.fixture || {};
  const home = fixture.homeTeam || s?.homeTeam || s?.homeTeamName;
  const away = fixture.awayTeam || s?.awayTeam || s?.awayTeamName;
  if (home || away) return `${home || "Home"} v ${away || "Away"}`;
  return s?.fixtureName || s?.matchName || "-";
}

function fixtureMeta(s: any) {
  const fixture = s?.fixture || {};
  const league = fixture.league || s?.leagueName || "";
  const score = fixture.score || s?.score;
  const home = score?.home ?? s?.homeScore;
  const away = score?.away ?? s?.awayScore;
  const scoreText = home != null || away != null ? ` ${home ?? "-"}:${away ?? "-"}` : "";
  return `${league}${scoreText}`.trim();
}

function statsApiLinkMeta(s: any) {
  const link = s?.fixture?.linkedStatsApi;
  if (!link?.statsApiMatchId && !link?.matchId) return "";
  return `StatsAPI match ${link.statsApiMatchId || link.matchId}${link.status ? ` (${link.status})` : ""}`;
}

function fixtureProvider(s: any) {
  return s?.fixture?.externalProvider || s?.fixtureProvider || s?.externalProvider || null;
}

function oddsProvider(s: any) {
  return s?.outcome?.oddsProvider || s?.oddsProvider || null;
}

function StatsApiResultTagEditor({ matchId, onChanged }: { matchId: string; onChanged: () => void }) {
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");

  const tag = useQuery({
    queryKey: ["statsapi-result-tag", matchId],
    enabled: Boolean(matchId),
    queryFn: () => apiRequest<any>(`/api/admin/settlement/statsapi-result-tags/${encodeURIComponent(matchId)}`),
  });

  const save = useMutation({
    mutationFn: () =>
      apiRequest<any>(`/api/admin/settlement/statsapi-result-tags/${encodeURIComponent(matchId)}`, {
        method: "POST",
        body: { homeScore: Number(homeScore), awayScore: Number(awayScore) },
      }),
    onSuccess: async () => {
      await tag.refetch();
      onChanged();
    },
  });

  const clear = useMutation({
    mutationFn: () =>
      apiRequest<any>(`/api/admin/settlement/statsapi-result-tags/${encodeURIComponent(matchId)}`, {
        method: "DELETE",
      }),
    onSuccess: async () => {
      setHomeScore("");
      setAwayScore("");
      await tag.refetch();
      onChanged();
    },
  });

  const current = tag.data?.tag;
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
      {current ? <Badge className="bg-emerald-800">Tagged {current.homeScore}-{current.awayScore}</Badge> : <Badge className="bg-zinc-700">No result tag</Badge>}
      <input
        value={homeScore}
        onChange={(e) => setHomeScore(e.target.value)}
        placeholder="Home"
        className="w-16 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-white"
      />
      <input
        value={awayScore}
        onChange={(e) => setAwayScore(e.target.value)}
        placeholder="Away"
        className="w-16 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-white"
      />
      <Button size="sm" variant="outline" disabled={save.isPending || !homeScore || !awayScore} onClick={() => save.mutate()}>
        Save result tag
      </Button>
      <Button size="sm" variant="outline" disabled={clear.isPending || !current} onClick={() => clear.mutate()}>
        Clear tag
      </Button>
      {save.isError || clear.isError ? <span className="text-rose-400">Tag action failed.</span> : null}
    </div>
  );
}

export function ManualSettlementPage() {
  const qc = useQueryClient();
  const [provider, setProvider] = useState("all");
  const [result, setResult] = useState("pending");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<SlipRow | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [repairLimit, setRepairLimit] = useState(100);
  const [repairIncludeSettled, setRepairIncludeSettled] = useState(true);
  const [repairResettlePending, setRepairResettlePending] = useState(true);
  const limit = 50;

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    p.set("provider", provider);
    p.set("result", result);
    p.set("limit", String(limit));
    p.set("offset", String(page * limit));
    if (q.trim()) p.set("q", q.trim());
    return p.toString();
  }, [provider, result, q, page]);

  const query = useQuery({
    queryKey: ["manual-settlement", qs],
    queryFn: () => apiRequest<ListResp>(`/api/admin/settlement/betslips?${qs}`),
  });

  const detail = useQuery({
    queryKey: ["manual-settlement-detail", selected?.betSlipId],
    enabled: Boolean(selected?.betSlipId),
    queryFn: () => apiRequest<any>(`/api/admin/settlement/betslips/${selected!.betSlipId}`),
  });

  const invalidate = async () => {
    await qc.invalidateQueries({ queryKey: ["manual-settlement"] });
    await qc.invalidateQueries({ queryKey: ["manual-settlement-detail"] });
    await qc.invalidateQueries({ queryKey: ["admin-bets"] });
  };

  const forceSettle = useMutation({
    mutationFn: ({ slipId, forcedResult }: { slipId: string; forcedResult: "won" | "lost" | "void" }) =>
      apiRequest(`/api/admin/settlement/betslips/${slipId}/force-settle`, {
        method: "POST",
        body: { result: forcedResult },
      }),
    onSuccess: invalidate,
  });

  const revert = useMutation({
    mutationFn: (slipId: string) =>
      apiRequest(`/api/admin/settlement/betslips/${slipId}/revert`, {
        method: "POST",
      }),
    onSuccess: invalidate,
  });

  const tryResettle = useMutation({
    mutationFn: (slipId: string) =>
      apiRequest(`/api/admin/betslips/${slipId}/settle`, {
        method: "POST",
      }),
    onSuccess: async (data: any, slipId) => {
      if (data?.selections) {
        qc.setQueryData(["manual-settlement-detail", slipId], data);
        const row = rows.find((r) => r.betSlipId === slipId) || selected;
        if (row) {
          setSelected(row);
          setExpanded((prev) => ({ ...prev, [slipId]: true }));
        }
      }
      await invalidate();
    },
  });

  const bulkAttach = useMutation({
    mutationFn: () =>
      apiRequest<any>("/api/admin/settlement/bulk-attach-statsapi-matches", {
        method: "POST",
        body: {
          includeSettled: repairIncludeSettled,
          resettlePending: repairResettlePending,
          limit: repairLimit,
        },
      }),
    onSuccess: invalidate,
  });

  const rows = query.data?.rows || [];
  const count = query.data?.count || 0;
  const canNext = (page + 1) * limit < count;

  const askForce = (row: SlipRow, forcedResult: "won" | "lost" | "void") => {
    const label = forcedResult.toUpperCase();
    const ok = window.confirm(
      `Manually settle ticket ${row.betSlipId} as ${label}?\n\nThis will update selections and use the normal wallet settlement path. It will not double-credit if already credited.`,
    );
    if (ok) forceSettle.mutate({ slipId: row.betSlipId, forcedResult });
  };

  const askRevert = (row: SlipRow) => {
    const ok = window.confirm(
      `Revert settlement for ticket ${row.betSlipId}?\n\nThis deducts the credited payout/refund from the user balance and reopens the ticket as pending.`,
    );
    if (ok) revert.mutate(row.betSlipId);
  };

  const askTryResettle = (row: SlipRow) => {
    const ok = window.confirm(
      `Try automatic resettlement for ticket ${row.betSlipId}?\n\nThis runs the normal settlement rules and wallet path. It will not double-credit a ticket that already has a final wallet reference.`,
    );
    if (ok) tryResettle.mutate(row.betSlipId);
  };

  const toggleExpanded = (row: SlipRow) => {
    setExpanded((prev) => ({ ...prev, [row.betSlipId]: !prev[row.betSlipId] }));
    setSelected(row);
  };

  const detailSelections = (detail.data?.selections || []) as any[];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Manual Settlement</h1>
        <p className="text-zinc-400 mt-1">
          StatsAPI and Mezzo-related tickets. Manual settle uses the normal wallet credit path; revert deducts prior credit and reopens the ticket.
        </p>
      </div>

      <Card className="bg-zinc-950 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Filters</CardTitle>
          <CardDescription>Find tickets by provider, status, id, team, or league.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <select
            value={provider}
            onChange={(e) => { setProvider(e.target.value); setPage(0); }}
            className="bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-white"
          >
            <option value="all">StatsAPI + Mezzo</option>
            <option value="thestatsapi">StatsAPI</option>
            <option value="mezzo">Mezzo</option>
          </select>
          <select
            value={result}
            onChange={(e) => { setResult(e.target.value); setPage(0); }}
            className="bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-white"
          >
            <option value="all">All results</option>
            <option value="pending">Pending</option>
            <option value="manual_review">Manual review</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
            <option value="void">Void</option>
          </select>
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(0); }}
            placeholder="Search ticket, fixture, team, league"
            className="min-w-[280px] bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-white"
          />
          <Button variant="outline" onClick={() => query.refetch()} disabled={query.isFetching}>
            Refresh
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-zinc-950 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">StatsAPI Match Attach</CardTitle>
          <CardDescription>
            Bulk links old Mezzo tickets to StatsAPI match ids, writes the link into bet selections, then can resettle pending tickets.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={repairIncludeSettled}
              onChange={(e) => setRepairIncludeSettled(e.target.checked)}
            />
            Include already finished/settled tickets for link migration
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={repairResettlePending}
              onChange={(e) => setRepairResettlePending(e.target.checked)}
            />
            Resettle pending tickets after attach
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            Limit
            <input
              type="number"
              min={1}
              max={500}
              value={repairLimit}
              onChange={(e) => setRepairLimit(Number(e.target.value) || 100)}
              className="w-24 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-white"
            />
          </label>
          <Button
            variant="outline"
            disabled={bulkAttach.isPending}
            onClick={() => {
              const ok = window.confirm("Bulk attach StatsAPI match ids to Mezzo bet selections now?");
              if (ok) bulkAttach.mutate();
            }}
          >
            {bulkAttach.isPending ? "Attaching..." : "Bulk attach matches"}
          </Button>
          {bulkAttach.data ? (
            <div className="text-xs text-lime-400">
              Attached {bulkAttach.data.attached || 0}, migrated {bulkAttach.data.migratedSelections || 0} selections, resettled {bulkAttach.data.resettled || 0}.
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="bg-zinc-950 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Tickets</CardTitle>
          <CardDescription>{count} tickets found</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-zinc-500">
              <tr className="border-b border-zinc-800">
                <th className="text-left py-2 pr-3">Ticket</th>
                <th className="text-left py-2 pr-3">User</th>
                <th className="text-left py-2 pr-3">Match</th>
                <th className="text-left py-2 pr-3">Providers</th>
                <th className="text-left py-2 pr-3">Status</th>
                <th className="text-right py-2 pr-3">Stake</th>
                <th className="text-right py-2 pr-3">Payout</th>
                <th className="text-left py-2 pr-3">Wallet</th>
                <th className="text-left py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isExpanded = Boolean(expanded[row.betSlipId]);
                const isSelected = selected?.betSlipId === row.betSlipId;
                const selections = isSelected ? detailSelections : [];
                return (
                  <Fragment key={row.betSlipId}>
                    <tr className="border-b border-zinc-900 align-middle">
                      <td className="py-3 pr-3 text-zinc-200">
                        <button className="inline-flex items-center gap-2 text-lime-400 hover:underline" onClick={() => toggleExpanded(row)}>
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          {shortId(row.betSlipId)}
                        </button>
                        <div className="text-xs text-zinc-500">{row.selectionCount} selections, {row.openSelectionCount} open</div>
                      </td>
                      <td className="py-3 pr-3 text-zinc-300 whitespace-nowrap">{row.username || shortId(String(row.userId || ""))}</td>
                      <td className="py-3 pr-3 text-zinc-300 max-w-[240px] truncate">{row.sampleMatch || "-"}</td>
                      <td className="py-3 pr-3">
                        <div className="flex flex-wrap gap-1 min-w-[92px]">
                          {(row.fixtureProviders || []).map((x) => <Badge key={`f-${x}`} className="bg-blue-900/60">{x}</Badge>)}
                          {(row.oddsProviders || []).map((x) => <Badge key={`o-${x}`} className="bg-purple-900/60">{x}</Badge>)}
                        </div>
                      </td>
                      <td className="py-3 pr-3">
                        <Badge className={row.result === "won" ? "bg-emerald-700" : row.result === "lost" ? "bg-rose-700" : "bg-zinc-700"}>
                          {row.status}/{row.result}
                        </Badge>
                      </td>
                      <td className="py-3 pr-3 text-right text-zinc-200 whitespace-nowrap">{money(row.stake)}</td>
                      <td className="py-3 pr-3 text-right text-zinc-200 whitespace-nowrap">{money(row.payout || row.potentialPayout)}</td>
                      <td className="py-3 pr-3 text-xs text-zinc-400 max-w-[150px] truncate" title={row.walletCreditRef || ""}>{row.walletCreditRef || "-"}</td>
                      <td className="py-3 min-w-[360px]">
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <Button size="sm" variant="outline" disabled={tryResettle.isPending} onClick={() => askTryResettle(row)}>Try resettle</Button>
                          <Button size="sm" variant="outline" disabled={forceSettle.isPending || finalCredit(row.walletCreditRef)} onClick={() => askForce(row, "won")}>Won</Button>
                          <Button size="sm" variant="outline" disabled={forceSettle.isPending || finalCredit(row.walletCreditRef)} onClick={() => askForce(row, "lost")}>Lost</Button>
                          <Button size="sm" variant="outline" disabled={forceSettle.isPending || finalCredit(row.walletCreditRef)} onClick={() => askForce(row, "void")}>Void</Button>
                          <Button size="sm" variant="destructive" disabled={revert.isPending || !finalCredit(row.walletCreditRef)} onClick={() => askRevert(row)}>Revert</Button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded ? (
                    <tr className="border-b border-zinc-900">
                        <td colSpan={9} className="bg-black/30 px-4 py-3">
                          {isSelected && detail.isLoading ? (
                            <div className="text-zinc-500 text-sm">Loading selections...</div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs">
                                <thead className="text-zinc-500">
                                  <tr>
                                    <th className="text-left py-2 pr-3">Selection</th>
                                    <th className="text-left py-2 pr-3">Market</th>
                                    <th className="text-left py-2 pr-3">Fixture</th>
                                    <th className="text-left py-2 pr-3">Provider</th>
                                    <th className="text-right py-2 pr-3">Odds</th>
                                    <th className="text-left py-2 pr-3">Result</th>
                                    <th className="text-left py-2">Reason</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {selections.map((s: any) => (
                                    <tr key={s.id} className="border-t border-zinc-900">
                                      <td className="py-2 pr-3 text-zinc-200">{selectionLabel(s)}</td>
                                      <td className="py-2 pr-3 text-zinc-300">{marketLabel(s)}</td>
                                      <td className="py-2 pr-3 text-zinc-300">
                                        {fixtureLabel(s)}
                                        <div className="text-zinc-600">{fixtureMeta(s)}</div>
                                        {statsApiLinkMeta(s) ? <div className="text-lime-500">{statsApiLinkMeta(s)}</div> : <div className="text-amber-500">No StatsAPI result link</div>}
                                        {s.fixture?.linkedStatsApi?.statsApiMatchId ? (
                                          <StatsApiResultTagEditor
                                            matchId={s.fixture.linkedStatsApi.statsApiMatchId}
                                            onChanged={invalidate}
                                          />
                                        ) : null}
                                      </td>
                                      <td className="py-2 pr-3">
                                        <div className="flex gap-1">
                                          {fixtureProvider(s) ? <Badge className="bg-blue-900/60">{fixtureProvider(s)}</Badge> : null}
                                          {oddsProvider(s) ? <Badge className="bg-purple-900/60">{oddsProvider(s)}</Badge> : null}
                                        </div>
                                      </td>
                                      <td className="py-2 pr-3 text-right text-zinc-200">{money(s.oddsAtPlacement)}</td>
                                      <td className="py-2 pr-3 text-zinc-200">{s.result}</td>
                                      <td className="py-2 text-zinc-400">{s.settlementReason || "-"}</td>
                                    </tr>
                                  ))}
                                  {!selections.length && !detail.isLoading ? (
                                    <tr><td colSpan={7} className="py-4 text-center text-zinc-500">No selections loaded.</td></tr>
                                  ) : null}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
              {!rows.length ? (
                <tr><td colSpan={9} className="py-8 text-center text-zinc-500">{query.isLoading ? "Loading..." : "No tickets found."}</td></tr>
              ) : null}
            </tbody>
          </table>

          <div className="flex items-center justify-between pt-4">
            <div className="text-xs text-zinc-500">Page {page + 1}</div>
            <div className="flex gap-2">
              <Button variant="outline" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>Previous</Button>
              <Button variant="outline" disabled={!canNext} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {forceSettle.isError || revert.isError || tryResettle.isError || bulkAttach.isError ? (
        <div className="text-rose-400 text-sm">
          {(forceSettle.error as any)?.message || (revert.error as any)?.message || (tryResettle.error as any)?.message || (bulkAttach.error as any)?.message || "Action failed"}
        </div>
      ) : null}
    </div>
  );
}
