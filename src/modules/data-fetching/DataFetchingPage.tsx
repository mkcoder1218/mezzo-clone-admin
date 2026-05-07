import { RefreshCcw, Power, Database } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useCatalogFetchNow,
  useCatalogLatest,
  useCatalogSetEnabled,
  useCatalogStatus,
  useOddsFetchNow,
  useOddsLatest,
  useOddsSetEnabled,
  useOddsStatus
} from "./hooks";
import type { ParsedGame } from "./types";

function parseGames(snapshot: any): ParsedGame[] {
  const rawMainEventList = snapshot?.responseBody?.[0]?.data?.mainEventList;
  if (!rawMainEventList) return [];

  const mainEventLists = Array.isArray(rawMainEventList) ? rawMainEventList : [rawMainEventList];
  const out: ParsedGame[] = [];

  for (const mainEventList of mainEventLists) {
    const sportName = mainEventList.sportName || "Unknown";
    const competitions = mainEventList.competitions || [];

    for (const competition of competitions) {
      for (const event of competition.events || []) {
        const marketsCount = (event.collections || []).reduce((n: number, c: any) => n + (c.markets?.length || 0), 0);
        out.push({
          eventId: String(event.eventId),
          eventName: event.eventName,
          eventStartTime: event.eventStartTime,
          competitionName: competition.competitionName,
          sportName,
          marketsCount
        });
      }
    }
  }
  return out;
}

function JobCard(props: {
  title: string;
  enabled: boolean;
  running: boolean;
  lastRunAt?: string | null;
  lastError?: string | null;
  onToggle: () => void;
  onFetchNow: () => void;
  busy?: boolean;
}) {
  return (
    <Card className="bg-[#1A1A1A] border-zinc-800">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{props.title}</span>
          <Badge className={props.enabled ? "bg-emerald-600" : "bg-zinc-700"}>{props.enabled ? "ON" : "OFF"}</Badge>
        </CardTitle>
        <CardDescription>Scheduler: {props.running ? "running" : "stopped"}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-zinc-400">Last run: {props.lastRunAt || "never"}</p>
        {props.lastError ? <p className="text-xs text-red-400">Last error: {props.lastError}</p> : null}
        <div className="flex gap-2">
          <Button onClick={props.onToggle} disabled={props.busy} className="bg-zinc-800 hover:bg-zinc-700">
            <Power className="w-4 h-4 mr-2" /> {props.enabled ? "Turn Off" : "Turn On"}
          </Button>
          <Button onClick={props.onFetchNow} disabled={props.busy} className="bg-brand text-black hover:bg-brand/80">
            <RefreshCcw className="w-4 h-4 mr-2" /> Fetch Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function DataFetchingPage() {
  const oddsStatus = useOddsStatus();
  const catalogStatus = useCatalogStatus();
  const oddsLatest = useOddsLatest();
  const catalogLatest = useCatalogLatest();

  const oddsToggle = useOddsSetEnabled();
  const catalogToggle = useCatalogSetEnabled();
  const oddsFetch = useOddsFetchNow();
  const catalogFetch = useCatalogFetchNow();

  const games = parseGames(oddsLatest.data?.snapshot);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-display font-bold text-white uppercase italic">
          External Data <span className="text-brand">Control</span>
        </h1>
        <p className="text-zinc-400 mt-1">Super admin only: toggle ingestion jobs and monitor stored data.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <JobCard
          title="Odds Fetcher"
          enabled={Boolean(oddsStatus.data?.settings?.enabled)}
          running={Boolean(oddsStatus.data?.scheduler?.running)}
          lastRunAt={oddsStatus.data?.settings?.lastRunAt}
          lastError={oddsStatus.data?.settings?.lastError}
          onToggle={() => oddsToggle.mutate(!oddsStatus.data?.settings?.enabled)}
          onFetchNow={() => oddsFetch.mutate()}
          busy={oddsToggle.isPending || oddsFetch.isPending}
        />
        <JobCard
          title="Catalog Fetcher"
          enabled={Boolean(catalogStatus.data?.settings?.enabled)}
          running={Boolean(catalogStatus.data?.scheduler?.running)}
          lastRunAt={catalogStatus.data?.settings?.lastRunAt}
          lastError={catalogStatus.data?.settings?.lastError}
          onToggle={() => catalogToggle.mutate(!catalogStatus.data?.settings?.enabled)}
          onFetchNow={() => catalogFetch.mutate()}
          busy={catalogToggle.isPending || catalogFetch.isPending}
        />
      </div>

      <Card className="bg-[#1A1A1A] border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-brand" /> Stored Games (Latest Odds Snapshot)
          </CardTitle>
          <CardDescription>
            Odds snapshot: {oddsLatest.data?.snapshot?.fetchedAt || "None"} | Catalog snapshot:{" "}
            {catalogLatest.data?.snapshot?.fetchedAt || "None"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto max-h-[480px]">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-zinc-400 border-b border-zinc-800">
                  <th className="py-2 pr-3">Sport</th>
                  <th className="py-2 pr-3">Competition</th>
                  <th className="py-2 pr-3">Event</th>
                  <th className="py-2 pr-3">Start Time</th>
                  <th className="py-2 pr-3">Markets</th>
                </tr>
              </thead>
              <tbody>
                {games.map((g) => (
                  <tr key={g.eventId} className="border-b border-zinc-900">
                    <td className="py-2 pr-3 text-zinc-200">{g.sportName}</td>
                    <td className="py-2 pr-3 text-zinc-200">{g.competitionName}</td>
                    <td className="py-2 pr-3 text-white">{g.eventName}</td>
                    <td className="py-2 pr-3 text-zinc-300">{g.eventStartTime}</td>
                    <td className="py-2 pr-3 text-zinc-300">{g.marketsCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {games.length === 0 ? <p className="text-zinc-400 text-sm py-6">No stored games yet. Use Fetch Now.</p> : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

