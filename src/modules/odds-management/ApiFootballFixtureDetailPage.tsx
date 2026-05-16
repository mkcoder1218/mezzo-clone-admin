import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { oddsManagementApi } from "./api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, RefreshCcw } from "lucide-react";

export function ApiFootballFixtureDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const fixtureId = String(id || "");

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["apifootball-fixture", fixtureId],
    enabled: Boolean(fixtureId),
    queryFn: () => oddsManagementApi.apiFootballFixtureGet(fixtureId),
  });

  const fixture = data?.fixture;
  const markets = fixture?.Markets || [];

  const header = useMemo(() => {
    const name = `${fixture?.homeTeam?.name || "Home"} v ${fixture?.awayTeam?.name || "Away"}`;
    const league = fixture?.League?.name ? ` • ${fixture.League.name}` : "";
    return `${name}${league}`;
  }, [fixture]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="border-zinc-800 text-zinc-300 hover:text-white"
            onClick={() => navigate("/odds-management/apifootball-fixtures")}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-xl font-bold text-white uppercase tracking-tight italic font-display">APIfootball Fixture</h1>
            <p className="text-zinc-500 mt-1">{header}</p>
          </div>
        </div>
        <Button className="bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCcw className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card className="p-4 bg-zinc-900/40 border-zinc-800/60 text-zinc-200 text-sm">
        {isLoading ? (
          <div className="text-zinc-500">Loading…</div>
        ) : !fixture ? (
          <div className="text-zinc-500">Fixture not found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <div className="text-[10px] text-zinc-500 uppercase font-bold">Match ID</div>
              <div className="tabular-nums">{fixture.apiFootballMatchId || "-"}</div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-500 uppercase font-bold">Start</div>
              <div className="tabular-nums">{fixture.startsAt ? new Date(fixture.startsAt).toISOString() : "-"}</div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-500 uppercase font-bold">Markets / Outcomes</div>
              <div className="tabular-nums">
                {markets.length} / {markets.reduce((acc: number, m: any) => acc + (m?.Outcomes?.length || 0), 0)}
              </div>
            </div>
          </div>
        )}
      </Card>

      <Card className="p-0 overflow-hidden bg-zinc-900/40 border-zinc-800/60">
        <div className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-800/50 grid grid-cols-12 gap-2">
          <div className="col-span-5">Market</div>
          <div className="col-span-3">Key</div>
          <div className="col-span-2 text-right">Outcomes</div>
          <div className="col-span-2 text-right">Latest</div>
        </div>
        {isLoading ? (
          <div className="p-6 text-zinc-500">Loading…</div>
        ) : markets.length === 0 ? (
          <div className="p-6 text-zinc-500">No markets stored for this fixture.</div>
        ) : (
          <div className="divide-y divide-zinc-800/50">
            {markets.map((m: any) => {
              const outcomes = m?.Outcomes || [];
              const latest = outcomes.reduce((mx: number, o: any) => {
                const t = o?.lastFetchedAt ? new Date(o.lastFetchedAt).getTime() : 0;
                return Math.max(mx, Number.isFinite(t) ? t : 0);
              }, 0);
              return (
                <details key={m.id} className="group">
                  <summary className="px-4 py-3 grid grid-cols-12 gap-2 text-sm text-zinc-200 cursor-pointer hover:bg-zinc-900/60">
                    <div className="col-span-5 font-semibold truncate">{m.name || "Market"}</div>
                    <div className="col-span-3 text-zinc-400 truncate">{m.key || "-"}</div>
                    <div className="col-span-2 text-right tabular-nums">{outcomes.length}</div>
                    <div className="col-span-2 text-right tabular-nums text-zinc-400">
                      {latest ? new Date(latest).toISOString().slice(0, 16).replace("T", " ") : "-"}
                    </div>
                  </summary>
                  <div className="px-4 pb-4">
                    {outcomes.length === 0 ? (
                      <div className="text-xs text-zinc-500">No outcomes stored.</div>
                    ) : (
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                        {outcomes.map((o: any) => (
                          <div key={o.id} className="flex items-center justify-between rounded-md border border-zinc-800/70 bg-zinc-950/40 px-3 py-2">
                            <div className="min-w-0">
                              <div className="text-xs font-semibold truncate">{o.name || o.key}</div>
                              <div className="text-[11px] text-zinc-500 truncate">{o.key}</div>
                            </div>
                            <div className="text-xs tabular-nums text-lime-300">{o.displayOdds ?? o.odds ?? "-"}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </details>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

