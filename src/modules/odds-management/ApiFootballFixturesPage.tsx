import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { oddsManagementApi } from "./api";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, RefreshCcw, Search } from "lucide-react";

type ApiFootballFixtureRow = {
  id: string;
  startsAt: string;
  status: string | null;
  pricesCount: number;
  apiFootballMatchId: string | null;
  league: { id: string; name: string; country: string | null; apiFootballLeagueId: string | null } | null;
  homeTeam: { id: string; name: string } | null;
  awayTeam: { id: string; name: string } | null;
  apifootball: { markets: number; outcomes: number; latestFetchedAt: string | null };
};

export function ApiFootballFixturesPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const limit = 50;
  const [fromDate, setFromDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [toDate, setToDate] = useState(format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"));
  const [apiFootballLeagueId, setApiFootballLeagueId] = useState<string>("");
  const [onlyMissingOdds, setOnlyMissingOdds] = useState(false);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["apifootball-fixtures", page, fromDate, toDate, apiFootballLeagueId, onlyMissingOdds],
    queryFn: () =>
      oddsManagementApi.apiFootballFixturesList({
        page,
        limit,
        from: fromDate,
        to: toDate,
        apiFootballLeagueId: apiFootballLeagueId || undefined,
        onlyMissingOdds: onlyMissingOdds || undefined,
      }),
  });

  const fixtures: ApiFootballFixtureRow[] = data?.fixtures || [];
  const count = data?.count || 0;
  const totalPages = Math.max(1, Math.ceil(count / limit));

  const header = useMemo(() => {
    const suffix = apiFootballLeagueId ? `League ${apiFootballLeagueId}` : "All Leagues";
    return `${count} fixtures • ${suffix}`;
  }, [count, apiFootballLeagueId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white uppercase tracking-tight italic font-display">APIfootball Fixtures</h1>
          <p className="text-zinc-500 mt-1">View fixtures and API-Football odds stored in the DB.</p>
        </div>
        <Button className="bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCcw className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card className="p-4 bg-zinc-900/40 border-zinc-800/60">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <div className="space-y-1">
            <label className="text-[10px] text-zinc-500 uppercase font-bold">From</label>
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="bg-zinc-950 border-zinc-800 text-white text-xs h-9" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-zinc-500 uppercase font-bold">To</label>
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="bg-zinc-950 border-zinc-800 text-white text-xs h-9" />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-[10px] text-zinc-500 uppercase font-bold">API League ID</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-600" />
              <Input
                placeholder="e.g. 152"
                value={apiFootballLeagueId}
                onChange={(e) => setApiFootballLeagueId(e.target.value)}
                className="pl-10 bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 h-9"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="onlyMissingOdds"
              type="checkbox"
              checked={onlyMissingOdds}
              onChange={(e) => setOnlyMissingOdds(e.target.checked)}
              className="h-4 w-4 accent-lime-400"
            />
            <label htmlFor="onlyMissingOdds" className="text-xs text-zinc-300">
              Only missing odds
            </label>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-zinc-400">
          <div>{header}</div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="border-zinc-800 text-zinc-400 hover:text-white"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="tabular-nums">
              Page {page} / {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              className="border-zinc-800 text-zinc-400 hover:text-white"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden bg-zinc-900/40 border-zinc-800/60">
        <div className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-800/50 grid grid-cols-12 gap-2">
          <div className="col-span-5">Fixture</div>
          <div className="col-span-3">League</div>
          <div className="col-span-2 text-right">Markets</div>
          <div className="col-span-2 text-right">Outcomes</div>
        </div>
        {isLoading ? (
          <div className="p-6 text-zinc-500">Loading…</div>
        ) : fixtures.length === 0 ? (
          <div className="p-6 text-zinc-500">No fixtures found.</div>
        ) : (
          <div className="divide-y divide-zinc-800/50">
            {fixtures.map((f) => (
              <div
                key={f.id}
                className="px-4 py-3 grid grid-cols-12 gap-2 text-sm text-zinc-200 cursor-pointer hover:bg-zinc-900/60"
                onClick={() => navigate(`/odds-management/apifootball-fixtures/${f.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") navigate(`/odds-management/apifootball-fixtures/${f.id}`);
                }}
              >
                <div className="col-span-5">
                  <div className="font-semibold truncate">{f.homeTeam?.name || "Home"} v {f.awayTeam?.name || "Away"}</div>
                  <div className="text-xs text-zinc-500 tabular-nums">{new Date(f.startsAt).toISOString()}</div>
                  <div className="text-[11px] text-zinc-500">matchId: {f.apiFootballMatchId || "-"}</div>
                </div>
                <div className="col-span-3">
                  <div className="truncate">{f.league?.country ? `${f.league.country} - ` : ""}{f.league?.name || "-"}</div>
                  <div className="text-[11px] text-zinc-500">apiLeagueId: {f.league?.apiFootballLeagueId || "-"}</div>
                </div>
                <div className="col-span-2 text-right tabular-nums">{f.apifootball.markets}</div>
                <div className="col-span-2 text-right tabular-nums">{f.apifootball.outcomes}</div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
