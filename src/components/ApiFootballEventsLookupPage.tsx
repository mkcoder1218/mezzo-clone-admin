import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiRequest } from "../lib/apiClient";

export function ApiFootballEventsLookupPage() {
  const [from, setFrom] = useState("2026-05-16");
  const [to, setTo] = useState("2026-05-16");
  const [leagueId, setLeagueId] = useState("146");
  const [matchId, setMatchId] = useState("");
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(false);
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<{ from: string; to: string; leagueId: string; matchId: string } | null>({
    from: "2026-05-16",
    to: "2026-05-16",
    leagueId: "146",
    matchId: "",
  });

  const limit = 10;
  const offset = (page - 1) * limit;

  const query = useQuery({
    queryKey: ["apifootball-events", submitted, page, refresh],
    enabled: Boolean(submitted),
    queryFn: async () => {
      const s = submitted!;
      const params = new URLSearchParams();
      params.set("from", s.from.trim());
      params.set("to", s.to.trim());
      params.set("leagueId", s.leagueId.trim());
      params.set("limit", String(limit));
      params.set("offset", String(offset));
      if (s.matchId.trim()) params.set("matchId", s.matchId.trim());
      if (refresh) params.set("refresh", "1");
      return apiRequest<any>(`/api/admin/apifootball/events?${params.toString()}`);
    },
    staleTime: 60_000,
  });

  const count = Number(query.data?.count ?? 0) || 0;
  const totalPages = Math.max(1, Math.ceil(count / limit));
  const events = Array.isArray(query.data?.events) ? query.data.events : [];
  const canPage = !submitted?.matchId;

  const summary = useMemo(() => {
    const statusCounts = new Map<string, number>();
    for (const e of events) {
      const s = String(e?.match_status || "unknown").toUpperCase();
      statusCounts.set(s, (statusCounts.get(s) || 0) + 1);
    }
    return Array.from(statusCounts.entries()).slice(0, 6);
  }, [events]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-white">
      <header>
        <h1 className="text-3xl font-bold font-display tracking-tight text-white uppercase italic">
          APIfootball <span className="text-brand">Events</span>
        </h1>
        <p className="text-zinc-400 mt-1">Paged view (10 at a time) to stay within rate limits.</p>
      </header>

      <Card className="bg-[#1A1A1A] border-zinc-800/50">
        <CardHeader>
          <CardTitle className="text-white">Query</CardTitle>
          <CardDescription className="text-zinc-400">Uses backend API key; no key is stored in the admin app.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Input value={from} onChange={(e) => setFrom(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white" placeholder="from (YYYY-MM-DD)" />
            <Input value={to} onChange={(e) => setTo(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white" placeholder="to (YYYY-MM-DD)" />
            <Input value={leagueId} onChange={(e) => setLeagueId(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white" placeholder="leagueId" />
            <Input value={matchId} onChange={(e) => setMatchId(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white" placeholder="matchId (optional)" />
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <Button
              disabled={query.isFetching}
              onClick={() => {
                setPage(1);
                setExpandedMatchId(null);
                setSubmitted({ from, to, leagueId, matchId });
                setRefresh(false);
              }}
              className="bg-brand text-black hover:bg-brand/90 rounded-xl font-bold text-[10px] uppercase"
            >
              <Search className="w-4 h-4 mr-2" /> Fetch
            </Button>
            <Button
              variant="outline"
              disabled={query.isFetching || !submitted}
              onClick={() => setRefresh(true)}
              className="border-zinc-700 text-zinc-200 hover:bg-zinc-800 rounded-xl font-bold text-[10px] uppercase"
            >
              Refresh Cache
            </Button>
            {submitted ? (
              <div className="text-xs text-zinc-500">
                Total: {count} · Page {page}/{totalPages} · {summary.map(([k, v]) => `${k}:${v}`).join("  ")}
              </div>
            ) : null}
          </div>

          {query.isError ? <div className="text-rose-400 text-sm">Request failed.</div> : null}

          <div className="rounded-xl border border-zinc-800/60 bg-zinc-950/40 overflow-auto">
            <table className="w-full text-xs">
              <thead className="text-zinc-400 bg-zinc-950/70">
                <tr>
                  <th className="text-left px-4 py-3 w-[36px]"></th>
                  <th className="text-left px-4 py-3">match_id</th>
                  <th className="text-left px-4 py-3">date</th>
                  <th className="text-left px-4 py-3">status</th>
                  <th className="text-left px-4 py-3">home</th>
                  <th className="text-left px-4 py-3">away</th>
                  <th className="text-right px-4 py-3">score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {query.isFetching ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-zinc-500">
                      Loading...
                    </td>
                  </tr>
                ) : events.length ? (
                  events.flatMap((e: any) => {
                    const mid = String(e?.match_id ?? "");
                    const isExpanded = mid && expandedMatchId === mid;
                    const toggle = () => setExpandedMatchId((cur) => (cur === mid ? null : mid));

                    return [
                      <tr key={mid || Math.random()} className="hover:bg-white/[0.02]">
                        <td className="px-4 py-3">
                          {mid ? (
                            <button
                              type="button"
                              onClick={toggle}
                              className="text-zinc-400 hover:text-white"
                              title="Show full event JSON"
                            >
                              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </button>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 font-mono text-zinc-200">{mid}</td>
                        <td className="px-4 py-3 text-zinc-300">
                          {String(e?.match_date ?? "")} {String(e?.match_time ?? "")}
                        </td>
                        <td className="px-4 py-3 text-zinc-200">{String(e?.match_status ?? "")}</td>
                        <td className="px-4 py-3 text-zinc-200">{String(e?.match_hometeam_name ?? e?.match_hometeam ?? "")}</td>
                        <td className="px-4 py-3 text-zinc-200">{String(e?.match_awayteam_name ?? e?.match_awayteam ?? "")}</td>
                        <td className="px-4 py-3 text-right text-zinc-200">
                          {String(e?.match_hometeam_score ?? "-")} - {String(e?.match_awayteam_score ?? "-")}
                        </td>
                      </tr>,
                      ...(isExpanded
                        ? [
                            <tr key={`${mid}__json`} className="bg-zinc-950/10">
                              <td colSpan={7} className="px-4 py-3">
                                <pre className="text-[11px] bg-zinc-950/40 border border-zinc-800/60 rounded-xl p-4 overflow-auto max-h-[360px]">
                                  {JSON.stringify(e, null, 2)}
                                </pre>
                              </td>
                            </tr>,
                          ]
                        : []),
                    ];
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-zinc-500">
                      No data.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {submitted && canPage ? (
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                disabled={query.isFetching || page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="border-zinc-700 text-zinc-200 hover:bg-zinc-800 rounded-xl font-bold text-[10px] uppercase"
              >
                Prev
              </Button>
              <Button
                variant="outline"
                disabled={query.isFetching || page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="border-zinc-700 text-zinc-200 hover:bg-zinc-800 rounded-xl font-bold text-[10px] uppercase"
              >
                Next
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
