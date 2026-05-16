import { RefreshCcw, Power, Database, ListChecks, LibraryBig, Percent } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useCatalogFetchNow,
  useCatalogLatest,
  useCatalogSetEnabled,
  useCatalogStatus,
  useAdminFetchersStatus,
  useAdminSetFetcherEnabled,
  useAdminOddsSettings,
  useAdminSaveOddsSettings,
  useAdminRepairResultsFixtureMapping,
  useOddsFetchNow,
  useOddsLatest,
  useOddsSetEnabled,
  useOddsStatus,
  useAdminOddsFetchAdvanced,
  useAdminApiFootballSyncFixtures,
  useAdminMezzoFetchNow
} from "./hooks";
import type { ParsedGame } from "./types";
import { apiRequest } from "../../lib/apiClient";
import { useEffect, useMemo, useState } from "react";
import { Calendar, CheckCircle2, AlertTriangle, Info } from "lucide-react";

function parseGames(snapshot: any): ParsedGame[] {
  const responseBody = snapshot?.responseBody;
  if (!responseBody) return [];

  // Handle APIfootball flat array of rows
  if (Array.isArray(responseBody)) {
    // APIfootball odds rows don't always have event names/leagues, 
    // but they often include them in the same row or we have match_id.
    // For the "Latest Snapshot" view, we show what came from the wire.
    return responseBody.slice(0, 100).map((row: any) => {
      const matchId = String(row.match_id || "");
      // We don't always have names in the odds row, but let's try to find common fields
      const home = row.match_hometeam_name || "Match ID: " + matchId;
      const away = row.match_awayteam_name || "";
      const league = row.league_name || row.match_league || "N/A";
      
      // Count non-empty odd_ fields
      const marketsCount = Object.keys(row).filter(k => k.startsWith("odd_") && row[k]).length;

      return {
        eventId: matchId,
        eventName: away ? `${home} V ${away}` : home,
        eventStartTime: row.match_date ? `${row.match_date} ${row.match_time || ""}` : "N/A",
        competitionName: league,
        sportName: "Football",
        marketsCount
      };
    });
  }

  // Fallback to legacy structure (e.g. Mezzo GraphQL)
  const rawMainEventList = responseBody?.[0]?.data?.mainEventList;
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


function parseTopLeagues(snapshot: any): Array<{ competitionName: string; country?: string | null; priority?: number | null; eventsCount?: number | null }> {
  const top = snapshot?.responseBody?.[0]?.data?.topLeagueList;
  if (!Array.isArray(top)) return [];
  return top.map((x: any) => ({
    competitionName: String(x?.competitionName || "Unknown"),
    country: x?.country ? String(x.country) : null,
    priority: x?.priority ?? null,
    eventsCount: x?.eventsCount ?? null
  }));
}

function JobCard(props: {
  title: string;
  enabled: boolean;
  running: boolean;
  intervalLabel?: string;
  lastRunAt?: string | null;
  lastSuccessAt?: string | null;
  lastError?: string | null;
  onToggle: () => void;
  onFetchNow: () => void;
  busy?: boolean;
  warning?: string | null;
}) {
  return (
    <Card className="bg-[#1A1A1A] border-zinc-800">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{props.title}</span>
          <Badge className={props.enabled ? "bg-emerald-600" : "bg-zinc-700"}>{props.enabled ? "ON" : "OFF"}</Badge>
        </CardTitle>
        <CardDescription>
          Status: {props.enabled ? "Running" : "Paused"}
          {props.intervalLabel ? ` • Interval: ${props.intervalLabel}` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-zinc-400">Last run: {props.lastRunAt || "never"}</p>
        <p className="text-xs text-zinc-400">Last success: {props.lastSuccessAt || "never"}</p>
        {props.lastError ? <p className="text-xs text-red-400">Last error: {props.lastError}</p> : null}
        {props.warning ? <p className="text-xs text-amber-400">{props.warning}</p> : null}
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

function pad2(n: number) {
  return String(Math.max(0, Math.floor(n))).padStart(2, "0");
}

function formatHmsFromSeconds(totalSeconds: number) {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "-";
  const s = Math.floor(totalSeconds);
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return `${pad2(hh)}:${pad2(mm)}:${pad2(ss)}`;
}

function formatHmsFromMs(totalMs: number) {
  if (!Number.isFinite(totalMs) || totalMs < 0) return "-";
  return formatHmsFromSeconds(totalMs / 1000);
}

export function DataFetchingPage() {
  const [toast, setToast] = useState<{ kind: "success" | "error"; message: string } | null>(null);
  const [resultsQ, setResultsQ] = useState("");
  const [resultsPage, setResultsPage] = useState(1);
  const [cashboxToken, setCashboxToken] = useState("");
  const [repairEventId, setRepairEventId] = useState("");
  const [dtFrom, setDtFrom] = useState(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });
  const [dtTill, setDtTill] = useState(dtFrom);
  const resultsLimit = 10;
  const resultsOffset = (resultsPage - 1) * resultsLimit;

  const oddsStatus = useOddsStatus();
  const catalogStatus = useCatalogStatus();
  const oddsLatest = useOddsLatest();
  const catalogLatest = useCatalogLatest();
  const fetchersStatus = useAdminFetchersStatus();
  const setFetcherEnabled = useAdminSetFetcherEnabled();
  const oddsSettings = useAdminOddsSettings();
  const saveOddsSettings = useAdminSaveOddsSettings();
  const repairResultsMapping = useAdminRepairResultsFixtureMapping();

  const syncFixtures = useAdminApiFootballSyncFixtures();
  const fetchOddsAdvanced = useAdminOddsFetchAdvanced();

  const [syncFrom, setSyncFrom] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [syncTo, setSyncTo] = useState(() => {
    const d = new Date(Date.now() + 7 * 86400000);
    return d.toISOString().slice(0, 10);
  });

  const [lastSyncResult, setLastSyncResult] = useState<any>(null);
  const [lastFetchResult, setLastFetchResult] = useState<any>(null);

  const defaults = oddsSettings.data?.data?.defaults || null;
  const current = oddsSettings.data?.data?.value || null;
  const [cfgForm, setCfgForm] = useState({
    prematchOddsMaxAgeSeconds: 3600,
    detailOddsMaxAgeSeconds: 7200,
    liveOddsMaxAgeSeconds: 15,
    mainOddsCronIntervalMs: 900000,
    detailOddsCronIntervalMs: 1800000,
    resultsCronIntervalMs: 180000
  });

  useEffect(() => {
    if (!current) return;
    setCfgForm(current);
  }, [current]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const oddsToggle = useOddsSetEnabled();
  const catalogToggle = useCatalogSetEnabled();
  const oddsFetch = useOddsFetchNow();
  const catalogFetch = useCatalogFetchNow();
  const mezzoFetch = useAdminMezzoFetchNow();
  const [mezzoSportId, setMezzoSportId] = useState<string>("501");

  const games = parseGames(oddsLatest.data?.snapshot);
  const topLeagues = parseTopLeagues(catalogLatest.data?.snapshot);
  const fetchers = fetchersStatus.data?.data;

  const qc = useQueryClient();

  const results = useQuery({
    queryKey: ["results", { resultsQ, resultsPage }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("limit", String(resultsLimit));
      params.set("offset", String(resultsOffset));
      params.set("status", "finished");
      if (resultsQ.trim()) params.set("q", resultsQ.trim());
      return apiRequest<{ count: number; rows: any[] }>(`/api/results?${params.toString()}`);
    },
    staleTime: 10_000
  });

  const syncResults = useMutation({
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["results"] });
    }
  });

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

  const runRepairMapping = useMutation({
    mutationFn: async () => {
      const eventId = Number(repairEventId);
      if (!Number.isFinite(eventId) || eventId <= 0) throw new Error("Enter a valid eventId");
      return repairResultsMapping.mutateAsync({ eventId, apply: true });
    },
    onSuccess: () => {
      setToast({ kind: "success", message: "Repair applied. Settlement should run immediately." });
      setRepairEventId("");
    },
    onError: (err: any) => {
      setToast({ kind: "error", message: String(err?.message || "Repair failed") });
    },
  });

  const resultsRows = results.data?.rows || [];
  const resultsCount = results.data?.count || 0;
  const resultsTotalPages = Math.max(1, Math.ceil(resultsCount / resultsLimit));
  const resultsMeta = useMemo(
    () => ({ showing: resultsRows.length, count: resultsCount, page: resultsPage, totalPages: resultsTotalPages }),
    [resultsRows.length, resultsCount, resultsPage, resultsTotalPages]
  );

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-display font-bold text-white uppercase italic">
          External Data <span className="text-brand">Control</span>
        </h1>
        <p className="text-zinc-400 mt-1">Super admin only: toggle ingestion jobs and monitor stored data.</p>
      </header>

      <Card className="bg-[#1A1A1A] border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Mezzo Snapshots</span>
            <Badge className="bg-zinc-700">MANUAL</Badge>
          </CardTitle>
          <CardDescription>Fetch and store Mezzo catalog + top-events for a selected sportId.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-56">
              <Select value={mezzoSportId} onValueChange={setMezzoSportId}>
                <SelectTrigger className="bg-black/30 border-zinc-700 text-white">
                  <SelectValue placeholder="Select sportId" />
                </SelectTrigger>
                <SelectContent className="bg-[#111] border-zinc-800 text-white">
                  <SelectItem value="501">501 — Football</SelectItem>
                  <SelectItem value="504">504 — Basketball</SelectItem>
                  <SelectItem value="502">502 — Ice Hockey</SelectItem>
                  <SelectItem value="508">508 — Baseball</SelectItem>
                  <SelectItem value="503">503 — Tennis</SelectItem>
                  <SelectItem value="505">505 — Volleyball</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={async () => {
                const sportId = Number(mezzoSportId);
                if (!Number.isFinite(sportId) || sportId <= 0) {
                  setToast({ kind: "error", message: "Invalid sportId" });
                  return;
                }
                try {
                  const res = await mezzoFetch.mutateAsync(sportId);
                  setLastFetchResult(res);
                  setToast({ kind: "success", message: `Mezzo fetch started for sportId=${sportId}` });
                } catch (err: any) {
                  setToast({ kind: "error", message: String(err?.message || "Mezzo fetch failed") });
                }
              }}
              disabled={mezzoFetch.isPending}
              className="bg-brand text-black hover:bg-brand/90"
            >
              <RefreshCcw className="w-4 h-4 mr-2" />
              Fetch Now
            </Button>
          </div>
          <p className="text-xs text-zinc-500">Tip: fetch Football (501) + Basketball (504) to populate user sports.</p>
        </CardContent>
      </Card>

      {toast ? (
        <div
          className={
            toast.kind === "success"
              ? "bg-emerald-950/40 border border-emerald-800 text-emerald-200 rounded-lg px-4 py-2 text-sm"
              : "bg-red-950/40 border border-red-800 text-red-200 rounded-lg px-4 py-2 text-sm"
          }
        >
          {toast.message}
        </div>
      ) : null}

      <Tabs defaultValue="odds" className="space-y-6">
        <TabsList className="bg-[#1A1A1A] border border-zinc-800 rounded-xl w-full justify-start px-2 py-2">
          <TabsTrigger value="odds" className="data-[state=active]:bg-zinc-900">
            <Percent className="w-4 h-4" /> Odds
          </TabsTrigger>
          <TabsTrigger value="catalog" className="data-[state=active]:bg-zinc-900">
            <LibraryBig className="w-4 h-4" /> Catalog
          </TabsTrigger>
          <TabsTrigger value="results" className="data-[state=active]:bg-zinc-900">
            <ListChecks className="w-4 h-4" /> Results
          </TabsTrigger>
        </TabsList>

        <TabsContent value="odds" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <JobCard
              title="Odds Fetcher"
              enabled={Boolean(oddsStatus.data?.settings?.enabled)}
              running={Boolean(oddsStatus.data?.scheduler?.running)}
              intervalLabel="(manual / legacy)"
              lastRunAt={oddsStatus.data?.settings?.lastRunAt}
              lastSuccessAt={null}
              lastError={oddsStatus.data?.settings?.lastError}
              onToggle={() => oddsToggle.mutate(!oddsStatus.data?.settings?.enabled)}
              onFetchNow={() => oddsFetch.mutate()}
              busy={oddsToggle.isPending || oddsFetch.isPending}
            />

            <JobCard
              title="Main Odds Cron"
              enabled={Boolean(fetchers?.mainOdds?.enabled)}
              running={Boolean(fetchers?.mainOdds?.running)}
              intervalLabel={fetchers?.mainOdds?.intervalMs ? `${Math.round(fetchers.mainOdds.intervalMs / 1000)} sec` : "45 sec"}
              lastRunAt={fetchers?.mainOdds?.lastRunAt}
              lastSuccessAt={fetchers?.mainOdds?.lastSuccessAt}
              lastError={fetchers?.mainOdds?.lastError}
              onToggle={() => setFetcherEnabled.mutate({ name: "mainOdds", enabled: !fetchers?.mainOdds?.enabled })}
              onFetchNow={() => oddsFetch.mutate()}
              busy={setFetcherEnabled.isPending || fetchersStatus.isLoading}
            />

            <JobCard
              title="Detail Odds Cron"
              enabled={Boolean(fetchers?.detailOdds?.enabled)}
              running={Boolean(fetchers?.detailOdds?.running)}
              intervalLabel={fetchers?.detailOdds?.intervalMs ? `${Math.round(fetchers.detailOdds.intervalMs / 60000)} min` : "2 min"}
              lastRunAt={fetchers?.detailOdds?.lastRunAt}
              lastSuccessAt={fetchers?.detailOdds?.lastSuccessAt}
              lastError={fetchers?.detailOdds?.lastError}
              onToggle={() => setFetcherEnabled.mutate({ name: "detailOdds", enabled: !fetchers?.detailOdds?.enabled })}
              onFetchNow={() => oddsFetch.mutate()}
              busy={setFetcherEnabled.isPending || fetchersStatus.isLoading}
            />

            <JobCard
              title="Live Odds Cron"
              enabled={Boolean(fetchers?.liveOdds?.enabled)}
              running={Boolean(fetchers?.liveOdds?.running)}
              intervalLabel={fetchers?.liveOdds?.intervalMs ? `${Math.round(fetchers.liveOdds.intervalMs / 1000)} sec` : "8 sec"}
              lastRunAt={fetchers?.liveOdds?.lastRunAt}
              lastSuccessAt={fetchers?.liveOdds?.lastSuccessAt}
              lastError={fetchers?.liveOdds?.lastError}
              warning="High frequency worker. Enable only if live betting is active."
              onToggle={() => setFetcherEnabled.mutate({ name: "liveOdds", enabled: !fetchers?.liveOdds?.enabled })}
              onFetchNow={() => oddsFetch.mutate()}
              busy={setFetcherEnabled.isPending || fetchersStatus.isLoading}
            />
          </div>

          <Card className="bg-[#1A1A1A] border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand" /> APIfootball Fixture Mapping
              </CardTitle>
              <CardDescription>
                Odds can only be saved after local fixtures are linked to APIfootball match IDs. Run fixture sync first, then fetch odds.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Sync Range From</label>
                  <Input 
                    type="date" 
                    value={syncFrom} 
                    onChange={(e) => setSyncFrom(e.target.value)} 
                    className="bg-zinc-900 border-zinc-700 w-[180px]" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Sync Range To</label>
                  <Input 
                    type="date" 
                    value={syncTo} 
                    onChange={(e) => setSyncTo(e.target.value)} 
                    className="bg-zinc-900 border-zinc-700 w-[180px]" 
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => {
                      syncFixtures.mutate({ from: syncFrom, to: syncTo }, {
                        onSuccess: (res) => {
                          setLastSyncResult(res);
                          setToast({ kind: "success", message: "Fixture sync complete." });
                        },
                        onError: (err: any) => setToast({ kind: "error", message: String(err?.message || "Sync failed") })
                      });
                    }}
                    disabled={syncFixtures.isPending}
                    className="bg-zinc-800 hover:bg-zinc-700"
                  >
                    {syncFixtures.isPending ? "Syncing..." : "Sync Fixtures From APIfootball Events"}
                  </Button>
                  <Button 
                    onClick={() => {
                      fetchOddsAdvanced.mutate({ from: syncFrom, to: syncTo, autoBackfillMapping: true }, {
                        onSuccess: (res) => {
                          setLastFetchResult(res);
                          setToast({ kind: "success", message: "Odds fetch complete." });
                        },
                        onError: (err: any) => setToast({ kind: "error", message: String(err?.message || "Fetch failed") })
                      });
                    }}
                    disabled={fetchOddsAdvanced.isPending}
                    className="bg-brand text-black hover:bg-brand/80"
                  >
                    {fetchOddsAdvanced.isPending ? "Fetching..." : "Fetch Odds + Auto Map Fixtures"}
                  </Button>
                </div>
              </div>

              {(lastSyncResult || lastFetchResult) && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-zinc-800">
                  {lastSyncResult && (
                    <div className="bg-zinc-950/40 border border-zinc-800 rounded-xl p-4 space-y-2">
                      <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase">
                        <CheckCircle2 className="w-3 h-3" /> Sync Result
                      </div>
                      <div className="grid grid-cols-2 gap-y-1 text-xs">
                        <span className="text-zinc-500">Events Returned:</span>
                        <span className="text-white text-right font-mono">{lastSyncResult.eventsReturned}</span>
                        <span className="text-zinc-500">Fixtures Created:</span>
                        <span className="text-white text-right font-mono">{lastSyncResult.fixturesCreated}</span>
                        <span className="text-zinc-500">Fixtures Updated:</span>
                        <span className="text-white text-right font-mono">{lastSyncResult.fixturesUpdated}</span>
                        <span className="text-zinc-500">Already Mapped:</span>
                        <span className="text-white text-right font-mono">{lastSyncResult.fixturesAlreadyMapped}</span>
                        <span className="text-zinc-500">Teams Created:</span>
                        <span className="text-white text-right font-mono">{lastSyncResult.teamsCreated}</span>
                      </div>
                    </div>
                  )}

                  {lastFetchResult && (
                    <div className="bg-zinc-950/40 border border-zinc-800 rounded-xl p-4 space-y-2 lg:col-span-2">
                      <div className="flex items-center gap-2 text-brand text-xs font-bold uppercase">
                        <Info className="w-3 h-3" /> Fetch & Storage Result
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div className="flex flex-col">
                          <span className="text-zinc-500">Odds Rows:</span>
                          <span className="text-white font-mono">{lastFetchResult.snapshot?.responseBody?.length || 0}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-zinc-500">Fixtures Touched:</span>
                          <span className="text-white font-mono">{lastFetchResult.stats?.fixturesTouched || 0}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-zinc-500">Markets Stored:</span>
                          <span className="text-white font-mono">{lastFetchResult.stats?.marketsReturned || 0}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-zinc-500">Outcomes Upserted:</span>
                          <span className="text-white font-mono">{lastFetchResult.stats?.outcomesUpserted || 0}</span>
                        </div>
                      </div>
                      {lastFetchResult.stats?.unmatchedMatchIds > 0 && (
                        <div className="flex items-center gap-2 text-amber-400 text-[10px] mt-2 bg-amber-950/20 px-2 py-1 rounded">
                          <AlertTriangle className="w-3 h-3" />
                          {lastFetchResult.stats.unmatchedMatchIds} match IDs found in provider odds but not mapped locally.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {oddsLatest.data?.snapshot?.requestPayload?.mappingWarning && (
                <div className="bg-amber-950/30 border border-amber-800/50 rounded-xl p-4 flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                  <div>
                    <div className="text-amber-200 text-sm font-bold">Mapping Warning</div>
                    <p className="text-amber-200/70 text-xs mt-1">
                      {oddsLatest.data.snapshot.requestPayload.mappingWarning}
                    </p>
                    <p className="text-amber-200/50 text-[10px] mt-2">
                      Click "Sync Fixtures From APIfootball Events" first to ensure local fixtures exist and are linked.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-[#1A1A1A] border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Odds &amp; Fetcher Configuration</span>
                <Badge className="bg-zinc-700">Admin</Badge>
              </CardTitle>
              <CardDescription>Persisted settings. Workers apply changes on the next cycle.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-zinc-300">Prematch odds valid seconds</div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Select
                      value={String(cfgForm.prematchOddsMaxAgeSeconds)}
                      onValueChange={(v) => setCfgForm((s) => ({ ...s, prematchOddsMaxAgeSeconds: Number(v) }))}
                    >
                      <SelectTrigger className="bg-zinc-900 border-zinc-700 sm:w-[180px]">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="300">00:05:00</SelectItem>
                        <SelectItem value="600">00:10:00</SelectItem>
                        <SelectItem value="1800">00:30:00</SelectItem>
                        <SelectItem value="3600">01:00:00</SelectItem>
                        <SelectItem value="7200">02:00:00</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      value={cfgForm.prematchOddsMaxAgeSeconds}
                      onChange={(e) => setCfgForm((s) => ({ ...s, prematchOddsMaxAgeSeconds: Number(e.target.value) }))}
                      className="bg-zinc-900 border-zinc-700"
                    />
                  </div>
                  <div className="text-xs text-zinc-500">= {formatHmsFromSeconds(cfgForm.prematchOddsMaxAgeSeconds)}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-zinc-300">Detail odds valid seconds</div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Select
                      value={String(cfgForm.detailOddsMaxAgeSeconds)}
                      onValueChange={(v) => setCfgForm((s) => ({ ...s, detailOddsMaxAgeSeconds: Number(v) }))}
                    >
                      <SelectTrigger className="bg-zinc-900 border-zinc-700 sm:w-[180px]">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="300">00:05:00</SelectItem>
                        <SelectItem value="1800">00:30:00</SelectItem>
                        <SelectItem value="3600">01:00:00</SelectItem>
                        <SelectItem value="7200">02:00:00</SelectItem>
                        <SelectItem value="14400">04:00:00</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      value={cfgForm.detailOddsMaxAgeSeconds}
                      onChange={(e) => setCfgForm((s) => ({ ...s, detailOddsMaxAgeSeconds: Number(e.target.value) }))}
                      className="bg-zinc-900 border-zinc-700"
                    />
                  </div>
                  <div className="text-xs text-zinc-500">= {formatHmsFromSeconds(cfgForm.detailOddsMaxAgeSeconds)}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-zinc-300">Live odds valid seconds</div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Select
                      value={String(cfgForm.liveOddsMaxAgeSeconds)}
                      onValueChange={(v) => setCfgForm((s) => ({ ...s, liveOddsMaxAgeSeconds: Number(v) }))}
                    >
                      <SelectTrigger className="bg-zinc-900 border-zinc-700 sm:w-[180px]">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">00:00:05</SelectItem>
                        <SelectItem value="10">00:00:10</SelectItem>
                        <SelectItem value="15">00:00:15</SelectItem>
                        <SelectItem value="30">00:00:30</SelectItem>
                        <SelectItem value="60">00:01:00</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      value={cfgForm.liveOddsMaxAgeSeconds}
                      onChange={(e) => setCfgForm((s) => ({ ...s, liveOddsMaxAgeSeconds: Number(e.target.value) }))}
                      className="bg-zinc-900 border-zinc-700"
                    />
                  </div>
                  <div className="text-xs text-zinc-500">= {formatHmsFromSeconds(cfgForm.liveOddsMaxAgeSeconds)}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-zinc-300">Main odds cron interval (ms)</div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Select
                      value={String(cfgForm.mainOddsCronIntervalMs)}
                      onValueChange={(v) => setCfgForm((s) => ({ ...s, mainOddsCronIntervalMs: Number(v) }))}
                    >
                      <SelectTrigger className="bg-zinc-900 border-zinc-700 sm:w-[180px]">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="60000">00:01:00</SelectItem>
                        <SelectItem value="300000">00:05:00</SelectItem>
                        <SelectItem value="900000">00:15:00</SelectItem>
                        <SelectItem value="1800000">00:30:00</SelectItem>
                        <SelectItem value="3600000">01:00:00</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      value={cfgForm.mainOddsCronIntervalMs}
                      onChange={(e) => setCfgForm((s) => ({ ...s, mainOddsCronIntervalMs: Number(e.target.value) }))}
                      className="bg-zinc-900 border-zinc-700"
                    />
                  </div>
                  <div className="text-xs text-zinc-500">= {formatHmsFromMs(cfgForm.mainOddsCronIntervalMs)}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-zinc-300">Detail odds cron interval (ms)</div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Select
                      value={String(cfgForm.detailOddsCronIntervalMs)}
                      onValueChange={(v) => setCfgForm((s) => ({ ...s, detailOddsCronIntervalMs: Number(v) }))}
                    >
                      <SelectTrigger className="bg-zinc-900 border-zinc-700 sm:w-[180px]">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="60000">00:01:00</SelectItem>
                        <SelectItem value="300000">00:05:00</SelectItem>
                        <SelectItem value="900000">00:15:00</SelectItem>
                        <SelectItem value="1800000">00:30:00</SelectItem>
                        <SelectItem value="3600000">01:00:00</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      value={cfgForm.detailOddsCronIntervalMs}
                      onChange={(e) => setCfgForm((s) => ({ ...s, detailOddsCronIntervalMs: Number(e.target.value) }))}
                      className="bg-zinc-900 border-zinc-700"
                    />
                  </div>
                  <div className="text-xs text-zinc-500">= {formatHmsFromMs(cfgForm.detailOddsCronIntervalMs)}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-zinc-300">Results cron interval (ms)</div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Select
                      value={String(cfgForm.resultsCronIntervalMs)}
                      onValueChange={(v) => setCfgForm((s) => ({ ...s, resultsCronIntervalMs: Number(v) }))}
                    >
                      <SelectTrigger className="bg-zinc-900 border-zinc-700 sm:w-[180px]">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="60000">00:01:00</SelectItem>
                        <SelectItem value="120000">00:02:00</SelectItem>
                        <SelectItem value="180000">00:03:00</SelectItem>
                        <SelectItem value="300000">00:05:00</SelectItem>
                        <SelectItem value="900000">00:15:00</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      value={cfgForm.resultsCronIntervalMs}
                      onChange={(e) => setCfgForm((s) => ({ ...s, resultsCronIntervalMs: Number(e.target.value) }))}
                      className="bg-zinc-900 border-zinc-700"
                    />
                  </div>
                  <div className="text-xs text-zinc-500">= {formatHmsFromMs(cfgForm.resultsCronIntervalMs)}</div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() =>
                    saveOddsSettings.mutate(cfgForm, {
                      onSuccess: () => setToast({ kind: "success", message: "Saved odds/cron settings." }),
                      onError: (err: any) => setToast({ kind: "error", message: String(err?.message || "Failed to save settings") }),
                    })
                  }
                  disabled={saveOddsSettings.isPending || oddsSettings.isLoading}
                  className="bg-brand text-black hover:bg-brand/80"
                >
                  Save
                </Button>
                <Button
                  onClick={() => {
                    if (!defaults) return;
                    setCfgForm(defaults);
                    setToast({ kind: "success", message: "Reset to defaults (not saved yet)." });
                  }}
                  disabled={!defaults}
                  className="bg-zinc-800 hover:bg-zinc-700"
                >
                  Reset to defaults
                </Button>
              </div>
              {oddsSettings.isError ? <p className="text-xs text-red-400">Failed to load config.</p> : null}
            </CardContent>
          </Card>

          {oddsLatest.data?.storedStats && (
            <Card className="bg-[#1A1A1A] border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-500" /> Database Coverage Summary
                </CardTitle>
                <CardDescription>Aggregate count of outcomes currently active in the system.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-zinc-950/40 border border-zinc-800/60 rounded-xl p-4">
                    <div className="text-zinc-400">Total APIfootball Outcomes</div>
                    <div className="text-white text-xl font-bold mt-1">{oddsLatest.data.storedStats.totalOutcomes}</div>
                  </div>
                  <div className="bg-zinc-950/40 border border-zinc-800/60 rounded-xl p-4">
                    <div className="text-zinc-400">Fixtures with Mapping</div>
                    <div className="text-white text-xl font-bold mt-1">{oddsLatest.data.storedStats.mappedFixtures || 0}</div>
                  </div>
                  <div className="bg-zinc-950/40 border border-zinc-800/60 rounded-xl p-4">
                    <div className="text-zinc-400">Last Database Update</div>
                    <div className="text-white mt-1">
                      {oddsLatest.data.storedStats.lastUpdate ? new Date(oddsLatest.data.storedStats.lastUpdate).toLocaleString() : "Never"}
                    </div>
                  </div>
                </div>
                {oddsLatest.data.storedStats.sampleEvent && (
                  <div className="mt-4 bg-zinc-950/40 border border-zinc-800/60 rounded-xl p-4">
                    <div className="text-zinc-400 text-xs uppercase font-bold tracking-wider">Sample Stored Event</div>
                    <div className="flex justify-between items-center mt-2">
                      <div>
                        <div className="text-white font-bold">{oddsLatest.data.storedStats.sampleEvent.name}</div>
                        <div className="text-zinc-500 text-xs">{oddsLatest.data.storedStats.sampleEvent.league}</div>
                      </div>
                      <div className="text-zinc-400 text-xs">
                        {new Date(oddsLatest.data.storedStats.sampleEvent.startTime).toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="bg-[#1A1A1A] border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-brand" /> Latest Snapshot Content
              </CardTitle>
              <CardDescription>Content from the last successful API fetch: {oddsLatest.data?.snapshot?.fetchedAt || "None"}</CardDescription>
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
                {games.length === 0 ? <p className="text-zinc-400 text-sm py-6">No records in the latest snapshot. This usually means the API fetch didn't return any new odds, but stored data may still be active above.</p> : null}
              </div>
            </CardContent>
          </Card>

        </TabsContent>

        <TabsContent value="catalog" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                <Database className="w-5 h-5 text-brand" /> Latest Catalog Data (Top Leagues)
              </CardTitle>
              <CardDescription>Catalog snapshot: {catalogLatest.data?.snapshot?.fetchedAt || "None"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto max-h-[480px]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-zinc-400 border-b border-zinc-800">
                      <th className="py-2 pr-3">Country</th>
                      <th className="py-2 pr-3">Competition</th>
                      <th className="py-2 pr-3">Priority</th>
                      <th className="py-2 pr-3">Events</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topLeagues.map((l, idx) => (
                      <tr key={`${l.competitionName}-${idx}`} className="border-b border-zinc-900">
                        <td className="py-2 pr-3 text-zinc-200">{l.country || "-"}</td>
                        <td className="py-2 pr-3 text-white">{l.competitionName}</td>
                        <td className="py-2 pr-3 text-zinc-300">{l.priority ?? "-"}</td>
                        <td className="py-2 pr-3 text-zinc-300">{l.eventsCount ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {topLeagues.length === 0 ? <p className="text-zinc-400 text-sm py-6">No stored catalog yet. Use Fetch Now.</p> : null}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <JobCard
              title="Results Settlement Cron"
              enabled={Boolean(fetchers?.results?.enabled)}
              running={Boolean(fetchers?.results?.running)}
              intervalLabel={fetchers?.results?.intervalMs ? `${Math.round(fetchers.results.intervalMs / 60000)} min` : "3 min"}
              lastRunAt={fetchers?.results?.lastRunAt}
              lastSuccessAt={fetchers?.results?.lastSuccessAt}
              lastError={fetchers?.results?.lastError}
              onToggle={() => setFetcherEnabled.mutate({ name: "results", enabled: !fetchers?.results?.enabled })}
              onFetchNow={() => syncResults.mutate()}
              busy={setFetcherEnabled.isPending || fetchersStatus.isLoading || syncResults.isPending}
            />
          </div>

          <Card className="bg-[#1A1A1A] border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Results Sync (Cashbox)</span>
                <Badge className="bg-zinc-700">SPORTS</Badge>
              </CardTitle>
              <CardDescription>Fetches finished results and settles placed tickets.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1 flex-1 min-w-[320px]">
                  <label className="text-xs text-zinc-400">Cashbox Authorization Token</label>
                  <Input
                    value={cashboxToken}
                    onChange={(e) => setCashboxToken(e.target.value)}
                    placeholder="Paste token from cashbox request headers"
                    className="w-full"
                  />
                </div>
                <Button
                  onClick={() => saveToken.mutate()}
                  disabled={saveToken.isPending}
                  className="bg-zinc-800 hover:bg-zinc-700"
                >
                  Save Token
                </Button>
                {saveToken.isError ? <span className="text-xs text-red-400">Save failed.</span> : null}
                {resultsSettings.isError ? <span className="text-xs text-red-400">Settings load failed.</span> : null}
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
              <Button onClick={() => syncResults.mutate()} disabled={syncResults.isPending} className="bg-brand text-black hover:bg-brand/80">
                <RefreshCcw className="w-4 h-4 mr-2" /> {syncResults.isPending ? "Syncing..." : "Sync Now"}
              </Button>
              {syncResults.isError ? <span className="text-xs text-red-400">Sync failed.</span> : null}
              </div>

              <div className="flex flex-wrap items-end gap-3 border-t border-zinc-800 pt-4">
                <div className="space-y-1">
                  <label className="text-xs text-zinc-400">Repair mapping (eventId)</label>
                  <Input
                    value={repairEventId}
                    onChange={(e) => setRepairEventId(e.target.value)}
                    placeholder="e.g. 42122898"
                    className="w-[220px]"
                  />
                </div>
                <Button
                  onClick={() => runRepairMapping.mutate()}
                  disabled={runRepairMapping.isPending}
                  className="bg-zinc-800 hover:bg-zinc-700"
                >
                  {runRepairMapping.isPending ? "Repairing..." : "Apply Repair"}
                </Button>
                {runRepairMapping.isError ? <span className="text-xs text-red-400">Repair failed.</span> : null}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1A1A1A] border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Latest Results</span>
                <div className="flex items-center gap-2">
                  <Input
                    value={resultsQ}
                    onChange={(e) => {
                      setResultsPage(1);
                      setResultsQ(e.target.value);
                    }}
                    placeholder="Search (team, league, country, sport)"
                    className="w-[360px]"
                  />
                  <Badge className="bg-emerald-700">FINISHED</Badge>
                </div>
              </CardTitle>
              <CardDescription>
                Showing {resultsMeta.showing} of {resultsMeta.count}. Page {resultsMeta.page} / {resultsMeta.totalPages}.
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
                    </tr>
                  </thead>
                  <tbody>
                    {results.isLoading ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-zinc-500 text-sm">Loading...</td>
                      </tr>
                    ) : resultsRows.length ? (
                      resultsRows.map((r: any) => (
                        <tr key={r.id} className="border-b border-zinc-900">
                          <td className="py-2 pr-3 text-zinc-200">{r.Sport?.name || "-"}</td>
                          <td className="py-2 pr-3 text-zinc-200">
                            {(r.League?.country ? `${r.League.country} - ` : "") + (r.League?.name || "-")}
                          </td>
                          <td className="py-2 pr-3 text-zinc-300">{r.startsAt ? new Date(r.startsAt).toLocaleString() : "-"}</td>
                          <td className="py-2 pr-3 text-white">{(r.homeTeam?.name || "-") + " V " + (r.awayTeam?.name || "-")}</td>
                          <td className="py-2 pr-3 font-mono text-brand">
                            {r.externalScoreRaw || (r.homeScore != null && r.awayScore != null ? `${r.homeScore}-${r.awayScore}` : "-")}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-zinc-500 text-sm">No results yet. Run Sync Now.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4">
                <Button
                  onClick={() => setResultsPage((p) => Math.max(1, p - 1))}
                  disabled={resultsPage <= 1}
                  className="bg-zinc-800 hover:bg-zinc-700"
                >
                  Prev
                </Button>
                <Button
                  onClick={() => setResultsPage((p) => Math.min(resultsTotalPages, p + 1))}
                  disabled={resultsPage >= resultsTotalPages}
                  className="bg-zinc-800 hover:bg-zinc-700"
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
