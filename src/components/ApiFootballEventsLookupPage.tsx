import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiRequest } from "../lib/apiClient";

export function ApiFootballEventsLookupPage() {
  const [from, setFrom] = useState("2026-05-16");
  const [to, setTo] = useState("2026-05-16");
  const [leagueId, setLeagueId] = useState("146");
  const [matchId, setMatchId] = useState("");
  const [data, setData] = useState<any>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const params = new URLSearchParams();
      params.set("from", from.trim());
      params.set("to", to.trim());
      params.set("leagueId", leagueId.trim());
      if (matchId.trim()) params.set("matchId", matchId.trim());
      return apiRequest(`/api/admin/apifootball/events?${params.toString()}`);
    },
    onSuccess: (resp) => setData(resp),
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-white">
      <header>
        <h1 className="text-3xl font-bold font-display tracking-tight text-white uppercase italic">
          APIfootball <span className="text-brand">Events</span>
        </h1>
        <p className="text-zinc-400 mt-1">Lookup events by date + league_id (and optionally match_id).</p>
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

          <Button
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
            className="bg-brand text-black hover:bg-brand/90 rounded-xl font-bold text-[10px] uppercase"
          >
            <Search className="w-4 h-4 mr-2" /> Fetch
          </Button>

          {mutation.isError ? <div className="text-rose-400 text-sm">Request failed.</div> : null}

          <pre className="text-xs bg-zinc-950/40 border border-zinc-800/60 rounded-xl p-4 overflow-auto min-h-40">
            {data ? JSON.stringify(data, null, 2) : "No data yet."}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

