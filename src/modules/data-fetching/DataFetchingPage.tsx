import { RefreshCcw, Power, Database, ListChecks, LibraryBig, Percent, Globe, Square } from "lucide-react";
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
  useAdminSportsGameOddsStatus,
  useAdminRepairResultsFixtureMapping,
  useOddsFetchNow,
  useOddsLatest,
  useOddsSetEnabled,
  useOddsStatus,
  useAdminOddsFetchAdvanced,
  useAdminApiFootballSyncFixtures,
  useAdminMezzoFetchNow,
  useAdminMezzoResetOddsStart,
  useAdminMezzoResetOddsMapOnly,
  useAdminMezzoResetOddsRematch,
  useAdminMezzoResetOddsDebugMatch,
  useAdminMezzoResetOddsStatus,
  useAdminMezzoResetOddsStop,
  useAdminMezzoResetOddsForceStop,
  useAdminSportsGameOddsLeagues,
  useAdminSportsGameOddsRawEvents,
  useAdminSportsGameOddsSports,
  useAdminSportsGameOddsUsage,
  useAdminApiFootballLeaguesDisableAll,
  useAdminApiFootballLeaguesEnableAll,
  useAdminApiFootballLeaguesFetchNow,
  useAdminApiFootballLeaguesList,
  useAdminApiFootballLeaguesPatchBulk
} from "./hooks";
import type { ParsedGame } from "./types";
import { apiRequest } from "../../lib/apiClient";
import { useEffect, useMemo, useState } from "react";
import { Calendar, CheckCircle2, AlertTriangle, Info } from "lucide-react";

function ymd(d: Date) {
  return d.toISOString().slice(0, 10);
}

function addDays(ymdStr: string, days: number) {
  const t = new Date(`${ymdStr}T00:00:00.000Z`).getTime();
  if (!Number.isFinite(t)) return ymdStr;
  return ymd(new Date(t + days * 86_400_000));
}

function clampToMaxRange(from: string, to: string, maxDaysInclusive: number) {
  const fromT = new Date(`${from}T00:00:00.000Z`).getTime();
  const toT = new Date(`${to}T00:00:00.000Z`).getTime();
  if (!Number.isFinite(fromT)) return { from, to };
  if (!Number.isFinite(toT) || toT < fromT) {
    return { from, to: addDays(from, maxDaysInclusive - 1) };
  }
  const maxTo = addDays(from, maxDaysInclusive - 1);
  const maxToT = new Date(`${maxTo}T00:00:00.000Z`).getTime();
  if (toT > maxToT) return { from, to: maxTo };
  return { from, to };
}

const SPORTS_GAME_ODDS_PLAN_LEAGUES = [
  { sport: "Basketball", id: "NBA", name: "NBA" },
  { sport: "Basketball", id: "NCAAB", name: "College Basketball" },
  { sport: "Basketball", id: "WNBA", name: "WNBA" },
  { sport: "Football", id: "NFL", name: "NFL" },
  { sport: "Football", id: "NCAAF", name: "College Football" },
  { sport: "Baseball", id: "MLB", name: "MLB" },
  { sport: "Hockey", id: "NHL", name: "NHL" },
  { sport: "Handball", id: "EHF_EURO", name: "EHF European League" },
  { sport: "MMA", id: "UFC", name: "UFC" },
  { sport: "Soccer", id: "BUNDESLIGA", name: "Bundesliga" },
  { sport: "Soccer", id: "EPL", name: "Premier League" },
  { sport: "Soccer", id: "FR_LIGUE_1", name: "Ligue 1" },
  { sport: "Soccer", id: "INTERNATIONAL_SOCCER", name: "International Soccer" },
  { sport: "Soccer", id: "IT_SERIE_A", name: "Serie A" },
  { sport: "Soccer", id: "LA_LIGA", name: "La Liga" },
  { sport: "Soccer", id: "MLS", name: "MLS" },
  { sport: "Soccer", id: "UEFA_CHAMPIONS_LEAGUE", name: "Champions League" },
];

const SPORTS_GAME_ODDS_BOOKMAKERS = [
  { name: "1xBet", id: "1xbet", type: "sportsbook" },
  { name: "888 Sport", id: "888sport", type: "sportsbook" },
  { name: "Bally Bet", id: "ballybet", type: "sportsbook" },
  { name: "Barstool", id: "barstool", type: "sportsbook" },
  { name: "Bet Victor", id: "betvictor", type: "sportsbook" },
  { name: "Bet365", id: "bet365", type: "sportsbook" },
  { name: "BetAnySports", id: "betanysports", type: "sportsbook" },
  { name: "BetClic", id: "betclic", type: "sportsbook" },
  { name: "Betfair Exchange", id: "betfairexchange", type: "exchange" },
  { name: "Betfair Sportsbook", id: "betfairsportsbook", type: "sportsbook" },
  { name: "Betfred", id: "betfred", type: "sportsbook" },
  { name: "BetMGM", id: "betmgm", type: "sportsbook" },
  { name: "BetOnline", id: "betonline", type: "sportsbook" },
  { name: "BetPARX", id: "betparx", type: "sportsbook" },
  { name: "Betr Sportsbook", id: "betrsportsbook", type: "sportsbook" },
  { name: "BetRivers", id: "betrivers", type: "sportsbook" },
  { name: "Betsafe", id: "betsafe", type: "sportsbook" },
  { name: "Betsson", id: "betsson", type: "sportsbook" },
  { name: "BetUS", id: "betus", type: "sportsbook" },
  { name: "Betway", id: "betway", type: "sportsbook" },
  { name: "BlueBet", id: "bluebet", type: "sportsbook" },
  { name: "Bodog", id: "bodog", type: "sportsbook" },
  { name: "Bookmaker.eu", id: "bookmakereu", type: "sportsbook" },
  { name: "BoomBet", id: "boombet", type: "sportsbook" },
  { name: "Bovada", id: "bovada", type: "sportsbook" },
  { name: "BoyleSports", id: "boylesports", type: "sportsbook" },
  { name: "Caesars", id: "caesars", type: "sportsbook" },
  { name: "Casumo", id: "casumo", type: "sportsbook" },
  { name: "Circa", id: "circa", type: "sportsbook" },
  { name: "Coolbet", id: "coolbet", type: "sportsbook" },
  { name: "Coral", id: "coral", type: "sportsbook" },
  { name: "Draft Kings", id: "draftkings", type: "sportsbook" },
  { name: "ESPN BET", id: "espnbet", type: "sportsbook" },
  { name: "Everygame", id: "everygame", type: "sportsbook" },
  { name: "Fanatics", id: "fanatics", type: "sportsbook" },
  { name: "FanDuel", id: "fanduel", type: "sportsbook" },
  { name: "Fliff", id: "fliff", type: "sportsbook" },
  { name: "FourWinds", id: "fourwinds", type: "sportsbook" },
  { name: "FOX Bet", id: "foxbet", type: "sportsbook" },
  { name: "Grosvenor", id: "grosvenor", type: "sportsbook" },
  { name: "GTbets", id: "gtbets", type: "sportsbook" },
  { name: "Hard Rock Bet", id: "hardrockbet", type: "sportsbook" },
  { name: "HotStreak", id: "hotstreak", type: "dfs" },
  { name: "Kalshi", id: "kalshi", type: "exchange" },
  { name: "Ladbrokes", id: "ladbrokes", type: "sportsbook" },
  { name: "LeoVegas", id: "leovegas", type: "sportsbook" },
  { name: "LiveScore Bet", id: "livescorebet", type: "sportsbook" },
  { name: "LowVig", id: "lowvig", type: "sportsbook" },
  { name: "Marathon Bet", id: "marathonbet", type: "sportsbook" },
  { name: "Matchbook", id: "matchbook", type: "exchange" },
  { name: "Mr Green", id: "mrgreen", type: "sportsbook" },
  { name: "MyBookie", id: "mybookie", type: "sportsbook" },
  { name: "Neds", id: "neds", type: "sportsbook" },
  { name: "NordicBet", id: "nordicbet", type: "sportsbook" },
  { name: "NorthStar Bets", id: "northstarbets", type: "sportsbook" },
  { name: "Novig", id: "novig", type: "exchange" },
  { name: "Paddy Power", id: "paddypower", type: "sportsbook" },
  { name: "ParlayPlay", id: "parlayplay", type: "dfs" },
  { name: "Pinnacle", id: "pinnacle", type: "sportsbook" },
  { name: "PlayUp", id: "playup", type: "sportsbook" },
  { name: "PointsBet", id: "pointsbet", type: "sportsbook" },
  { name: "Polymarket", id: "polymarket", type: "exchange" },
  { name: "Prime Sports", id: "primesports", type: "sportsbook" },
  { name: "PrizePicks", id: "prizepicks", type: "dfs" },
  { name: "Prophet Exchange", id: "prophetexchange", type: "sportsbook" },
  { name: "SI Sportsbook", id: "si", type: "sportsbook" },
  { name: "Sky Bet", id: "skybet", type: "sportsbook" },
  { name: "Sleeper", id: "sleeper", type: "dfs" },
  { name: "SportsBet", id: "sportsbet", type: "sportsbook" },
  { name: "SportsBetting.ag", id: "sportsbetting_ag", type: "sportsbook" },
  { name: "Sporttrade", id: "sporttrade", type: "exchange" },
  { name: "Stake", id: "stake", type: "sportsbook" },
  { name: "SugarHouse", id: "sugarhouse", type: "sportsbook" },
  { name: "Superbook", id: "superbook", type: "sportsbook" },
  { name: "Suprabets", id: "suprabets", type: "sportsbook" },
  { name: "TAB", id: "tab", type: "sportsbook" },
  { name: "TABtouch", id: "tabtouch", type: "sportsbook" },
  { name: "theScore Bet", id: "thescorebet", type: "sportsbook" },
  { name: "Tipico", id: "tipico", type: "sportsbook" },
  { name: "TopSport", id: "topsport", type: "sportsbook" },
  { name: "Underdog Fantasy", id: "underdog", type: "dfs" },
  { name: "Unibet", id: "unibet", type: "sportsbook" },
  { name: "Virgin Bet", id: "virginbet", type: "sportsbook" },
  { name: "William Hill", id: "williamhill", type: "sportsbook" },
  { name: "Wind Creek (Betfred PA)", id: "windcreek", type: "sportsbook" },
  { name: "WynnBet", id: "wynnbet", type: "sportsbook" },
  { name: "Unknown", id: "unknown", type: "unknown" },
];

const SPORTS_GAME_ODDS_SPORTSBOOK_IDS = SPORTS_GAME_ODDS_BOOKMAKERS
  .filter((b) => b.type === "sportsbook")
  .map((b) => b.id);

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
  const sportsGameOddsStatus = useAdminSportsGameOddsStatus();
  const sportsGameOddsUsage = useAdminSportsGameOddsUsage();
  const sportsGameOddsSports = useAdminSportsGameOddsSports();
  const sportsGameOddsLeagues = useAdminSportsGameOddsLeagues("SOCCER");
  const sportsGameOddsRawEvents = useAdminSportsGameOddsRawEvents();
  const [sgoRawLeagueId, setSgoRawLeagueId] = useState("INTERNATIONAL_SOCCER");
  const [sgoRawEventId, setSgoRawEventId] = useState("");
  const [sgoRawLimit, setSgoRawLimit] = useState("3");
  const [sgoRawBookmakers, setSgoRawBookmakers] = useState("all");
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
    oddsProvider: null as string | null,
    pissbetSocketUrl: "",
    sportsGameOddsApiKey: "",
    sportsGameOddsBaseUrl: "https://api.sportsgameodds.com",
    sportsGameOddsLeagueIds: SPORTS_GAME_ODDS_PLAN_LEAGUES.map((l) => l.id),
    sportsGameOddsBookmakerPriority: ["draftkings", "fanduel", "bet365", "caesars", "betmgm"],
    prematchOddsMaxAgeSeconds: 3600,
    detailOddsMaxAgeSeconds: 7200,
    liveOddsMaxAgeSeconds: 15,
    liveBettingEnabled: true,
    detailPersistToDb: false,
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
  const mezzoResetStart = useAdminMezzoResetOddsStart();
  const mezzoResetMapOnly = useAdminMezzoResetOddsMapOnly();
  const mezzoResetRematch = useAdminMezzoResetOddsRematch();
  const mezzoDebugMatch = useAdminMezzoResetOddsDebugMatch();
  const mezzoResetStatus = useAdminMezzoResetOddsStatus();
  const mezzoResetStop = useAdminMezzoResetOddsStop();
  const mezzoResetForceStop = useAdminMezzoResetOddsForceStop();
  const [mezzoSportId, setMezzoSportId] = useState<string>("501");
  const [debugMatchResult, setDebugMatchResult] = useState<any>(null);
  const [mapWindowPreset, setMapWindowPreset] = useState<"next5" | "worldcup" | "custom">("next5");
  const [mapWindowFrom, setMapWindowFrom] = useState<string>(() => ymd(new Date()));
  const [mapWindowTo, setMapWindowTo] = useState<string>(() => addDays(ymd(new Date()), 4));
  const [mapLimit, setMapLimit] = useState<number>(5000);

  // APIfootball leagues config
  const [apiLSearch, setApiLSearch] = useState("");
  const [apiLPage, setApiLPage] = useState(1);
  const apiLLimit = 50;
  const [apiLSyncEnabled, setApiLSyncEnabled] = useState<boolean | null>(null);
  const [apiLActive, setApiLActive] = useState<boolean | null>(null);
  const apiLeagues = useAdminApiFootballLeaguesList({ page: apiLPage, limit: apiLLimit, search: apiLSearch, syncEnabled: apiLSyncEnabled, active: apiLActive });
  const apiLeaguesFetchNow = useAdminApiFootballLeaguesFetchNow();
  const apiLeaguesBulk = useAdminApiFootballLeaguesPatchBulk();
  const apiLeaguesEnableAll = useAdminApiFootballLeaguesEnableAll();
  const apiLeaguesDisableAll = useAdminApiFootballLeaguesDisableAll();
  const [apiLSelected, setApiLSelected] = useState<Record<string, boolean>>({});

  const games = parseGames(oddsLatest.data?.snapshot);
  const topLeagues = parseTopLeagues(catalogLatest.data?.snapshot);
  const fetchers = fetchersStatus.data?.data;

  const qc = useQueryClient();
  const resetJob = (mezzoResetStatus.data as any) || null;

  // Keep mapping window constrained to 5 days (APIfootball get_events limit).
  useEffect(() => {
    const clamped = clampToMaxRange(mapWindowFrom, mapWindowTo, 5);
    if (clamped.from !== mapWindowFrom) setMapWindowFrom(clamped.from);
    if (clamped.to !== mapWindowTo) setMapWindowTo(clamped.to);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapWindowFrom, mapWindowTo]);

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

            <Button
              onClick={async () => {
                const sportId = Number(mezzoSportId);
                if (!Number.isFinite(sportId) || sportId <= 0) {
                  setToast({ kind: "error", message: "Invalid sportId" });
                  return;
                }
                try {
                  const res = await mezzoResetStart.mutateAsync(sportId);
                  setLastFetchResult(res);
                  setToast({ kind: "success", message: "Mezzo reset odds job started." });
                } catch (err: any) {
                  setToast({ kind: "error", message: String(err?.message || "Reset odds failed to start") });
                }
              }}
              disabled={mezzoResetStart.isPending || Boolean(resetJob?.running)}
              className="bg-zinc-800 hover:bg-zinc-700 text-white"
            >
              Reset Odds
            </Button>

            <div className="flex flex-wrap items-end gap-2 rounded-lg border border-zinc-800 bg-black/20 px-3 py-2">
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400">Preset</label>
                <Select
                  value={mapWindowPreset}
                  onValueChange={(v: any) => {
                    const preset = (v || "custom") as typeof mapWindowPreset;
                    setMapWindowPreset(preset);
                    if (preset === "next5") {
                      const f = ymd(new Date());
                      setMapWindowFrom(f);
                      setMapWindowTo(addDays(f, 4));
                    } else if (preset === "worldcup") {
                      // Based on current Mezzo World Cup fixtures: start around 2026-06-13.
                      const f = "2026-06-13";
                      setMapWindowFrom(f);
                      setMapWindowTo(addDays(f, 4));
                    }
                  }}
                >
                  <SelectTrigger className="w-[160px] h-8 bg-black/30 border-zinc-700 text-zinc-200">
                    <SelectValue placeholder="Select preset" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#101010] border-zinc-800">
                    <SelectItem value="next5">Next 5 days</SelectItem>
                    <SelectItem value="worldcup">World Cup 2026</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400">From</label>
                <Input
                  type="date"
                  value={mapWindowFrom}
                  onChange={(e) => {
                    setMapWindowPreset("custom");
                    const nextFrom = e.target.value;
                    setMapWindowFrom(nextFrom);
                    setMapWindowTo((prev) => clampToMaxRange(nextFrom, prev, 5).to);
                  }}
                  className="w-[150px] h-8"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400">To (max 5 days)</label>
                <Input
                  type="date"
                  value={mapWindowTo}
                  onChange={(e) => {
                    setMapWindowPreset("custom");
                    setMapWindowTo(e.target.value);
                  }}
                  className="w-[150px] h-8"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400">Limit</label>
                <Input
                  type="number"
                  value={String(mapLimit)}
                  onChange={(e) => setMapLimit(Number(e.target.value || 0) || 0)}
                  className="w-[110px] h-8"
                />
              </div>

              <div className="flex items-end gap-2">
                <Button
                  onClick={() => {
                    setMapWindowPreset("custom");
                    const f = addDays(mapWindowFrom, -5);
                    setMapWindowFrom(f);
                    setMapWindowTo(addDays(f, 4));
                  }}
                  className="h-8 bg-zinc-900 border border-zinc-700 text-zinc-200 hover:bg-zinc-800"
                  title="Previous 5-day window"
                >
                  Prev 5d
                </Button>
                <Button
                  onClick={() => {
                    setMapWindowPreset("custom");
                    const f = addDays(mapWindowFrom, 5);
                    setMapWindowFrom(f);
                    setMapWindowTo(addDays(f, 4));
                  }}
                  className="h-8 bg-zinc-900 border border-zinc-700 text-zinc-200 hover:bg-zinc-800"
                  title="Next 5-day window"
                >
                  Next 5d
                </Button>
              </div>
            </div>

            <Button
              onClick={async () => {
                try {
                  const res = await mezzoResetMapOnly.mutateAsync({ from: mapWindowFrom, to: mapWindowTo, limit: mapLimit });
                  setLastFetchResult(res);
                  setToast({ kind: "success", message: "APIfootball mapping started (no reset)." });
                } catch (err: any) {
                  setToast({ kind: "error", message: String(err?.message || "Failed to start mapping") });
                }
              }}
              disabled={mezzoResetMapOnly.isPending || Boolean(resetJob?.running)}
              className="bg-zinc-900 border border-zinc-700 text-zinc-200 hover:bg-zinc-800"
              title="Backfill APIfootball match ids for existing Mezzo fixtures (no delete/refetch/ingest)"
            >
              Match APIfootball
            </Button>

            <Button
              onClick={async () => {
                try {
                  const res = await mezzoResetRematch.mutateAsync({ from: mapWindowFrom, to: mapWindowTo, limit: mapLimit });
                  setLastFetchResult(res);
                  setToast({ kind: "success", message: "Logs cleared. Rematch started." });
                } catch (err: any) {
                  setToast({ kind: "error", message: String(err?.message || "Failed to rematch") });
                }
              }}
              disabled={mezzoResetRematch.isPending || Boolean(resetJob?.running)}
              className="bg-zinc-900 border border-zinc-600 text-zinc-100 hover:bg-zinc-800"
              title="Clear job logs/stats then run APIfootball matching again"
            >
              Clear Logs + Rematch
            </Button>

            <Button
              onClick={async () => {
                try {
                  await mezzoResetStop.mutateAsync();
                  setToast({ kind: "success", message: "Stop requested. The job will halt after the current step." });
                } catch (err: any) {
                  setToast({ kind: "error", message: String(err?.message || "Failed to request stop") });
                }
              }}
              disabled={mezzoResetStop.isPending || !Boolean(resetJob?.running)}
              className="bg-red-950/40 border border-red-800 text-red-200 hover:bg-red-950/60"
              title={!resetJob?.running ? "Job is not running" : "Request job stop"}
            >
              <Square className="w-4 h-4 mr-2" />
              Stop Reset
            </Button>

            <Button
              onClick={async () => {
                try {
                  await mezzoResetForceStop.mutateAsync();
                  setToast({ kind: "success", message: "Force stopped (cleared running state)." });
                } catch (err: any) {
                  setToast({ kind: "error", message: String(err?.message || "Failed to force stop") });
                }
              }}
              disabled={mezzoResetForceStop.isPending}
              className="bg-zinc-900 border border-zinc-700 text-zinc-200 hover:bg-zinc-800"
              title="Force stop (use if the server restarted mid-job)"
            >
              Force Stop
            </Button>
          </div>
          <p className="text-xs text-zinc-500">Tip: fetch Football (501) + Basketball (504) to populate user sports.</p>

          <div className="mt-2 bg-black/20 border border-zinc-800 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div className="text-xs text-zinc-400">Reset Odds Progress</div>
              <div
                className={`text-xs font-bold ${
                  resetJob?.running && resetJob?.cancelRequested
                    ? "text-orange-300"
                    : resetJob?.running
                      ? "text-amber-300"
                      : resetJob?.step === "error"
                        ? "text-red-300"
                        : "text-zinc-300"
                }`}
              >
                {resetJob?.running && resetJob?.cancelRequested ? "STOPPING" : resetJob?.running ? "RUNNING" : resetJob?.step === "error" ? "ERROR" : "IDLE"}
              </div>
            </div>
            <div className="mt-2 h-2 rounded bg-zinc-800 overflow-hidden">
              <div className="h-2 bg-brand" style={{ width: `${Math.max(0, Math.min(100, Number(resetJob?.progress || 0)))}%` }} />
            </div>
            <div className="mt-2 text-[11px] text-zinc-500">
              {resetJob?.message || resetJob?.step || "—"} · {Math.max(0, Math.min(100, Number(resetJob?.progress || 0)))}%
            </div>
            {resetJob?.error?.message ? <div className="mt-2 text-[11px] text-red-200/90 whitespace-pre-wrap break-words">{resetJob.error.message}</div> : null}

            {Array.isArray((resetJob as any)?.logs) && (resetJob as any).logs.length ? (
              <details className="mt-3">
                <summary className="text-[11px] text-zinc-400 cursor-pointer select-none">Job logs</summary>
                <div className="mt-2 max-h-56 overflow-auto rounded-md border border-zinc-800 bg-black/30 p-2 font-mono text-[10px] text-zinc-200 whitespace-pre-wrap">
                  {(resetJob as any).logs.join("\n")}
                </div>
              </details>
            ) : null}

            {Array.isArray((resetJob as any)?.stats?.apiFootballMapping?.unmatchedSamples) &&
            (resetJob as any).stats.apiFootballMapping.unmatchedSamples.length ? (
              <details className="mt-3">
                <summary className="text-[11px] text-zinc-400 cursor-pointer select-none">
                  APIfootball mapping unmatched ({(resetJob as any).stats.apiFootballMapping.unmatchedSamples.length})
                </summary>
                <div className="mt-2 max-h-56 overflow-auto rounded-md border border-zinc-800 bg-black/30 p-2 text-[11px] text-zinc-200">
                  {(resetJob as any).stats.apiFootballMapping.unmatchedSamples.slice(0, 200).map((r: any, idx: number) => (
                    <div key={idx} className="py-1 border-b border-zinc-800 last:border-b-0">
                      <div className="text-zinc-300 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                        <span className="text-zinc-500">reason:</span> {String(r.reason)}{" "}
                        <span className="text-zinc-500">fixtureKey:</span> {String(r.fixtureKey || "")}
                        </div>
                        {r.fixtureId ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-[10px] border-zinc-700 bg-zinc-950/40 hover:bg-zinc-900"
                            onClick={async () => {
                              try {
                                const res = await mezzoDebugMatch.mutateAsync({ fixtureId: String(r.fixtureId), leagueIdsLimit: 30 });
                                setDebugMatchResult(res);
                                setToast({ kind: "success", message: "Debug candidates loaded." });
                              } catch (err: any) {
                                setToast({ kind: "error", message: String(err?.message || "Debug match failed") });
                              }
                            }}
                            disabled={mezzoDebugMatch.isPending}
                            title="Find closest APIfootball candidates for this fixture"
                          >
                            Debug
                          </Button>
                        ) : null}
                      </div>
                      <div className="text-zinc-400">
                        {String(r.league || "")} · {String(r.home || "")} vs {String(r.away || "")} · {String(r.startsAt || "")}
                      </div>
                    </div>
                  ))}
                  {(resetJob as any).stats.apiFootballMapping.unmatchedSamples.length > 200 ? (
                    <div className="pt-2 text-zinc-500">Showing first 200 only.</div>
                  ) : null}
                </div>
              </details>
            ) : null}

            {debugMatchResult ? (
              <details className="mt-3" open>
                <summary className="text-[11px] text-zinc-400 cursor-pointer select-none">Debug match candidates</summary>
                <div className="mt-2 max-h-72 overflow-auto rounded-md border border-zinc-800 bg-black/30 p-2 font-mono text-[10px] text-zinc-200 whitespace-pre-wrap">
                  {JSON.stringify(debugMatchResult, null, 2)}
                </div>
              </details>
            ) : null}
          </div>
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
          <TabsTrigger value="apifootball-leagues" className="data-[state=active]:bg-zinc-900">
            <Globe className="w-4 h-4" /> APIfootball Leagues
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 border-b border-zinc-800 pb-4">
                <div className="space-y-1">
                  <div className="text-sm text-zinc-300">Active odds provider</div>
                  <Select
                    value={String((cfgForm as any).oddsProvider || "mezzo")}
                    onValueChange={(v) => setCfgForm((s: any) => ({ ...s, oddsProvider: v }))}
                  >
                    <SelectTrigger className="bg-zinc-900 border-zinc-700">
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {(oddsSettings.data?.data?.providers || [
                        { key: "mezzo", label: "Mezzo (HTTP)" },
                        { key: "apifootball", label: "APIfootball (HTTP)" },
                        { key: "sports_game_odds", label: "SportsGameOdds (HTTP)" },
                        { key: "pissbet_socket", label: "Pissbet Socket" },
                      ]).map((p: any) => (
                        <SelectItem key={p.key} value={p.key}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="text-xs text-zinc-500">Current: {oddsSettings.data?.data?.activeProvider || "loading"}</div>
                </div>

                <div className="space-y-1">
                  <div className="text-sm text-zinc-300">Pissbet socket URL</div>
                  <Input
                    value={String((cfgForm as any).pissbetSocketUrl || "")}
                    onChange={(e) => setCfgForm((s: any) => ({ ...s, pissbetSocketUrl: e.target.value }))}
                    placeholder="wss://..."
                    className="bg-zinc-900 border-zinc-700"
                  />
                </div>

                <div className="space-y-1">
                  <div className="text-sm text-zinc-300">SportsGameOdds API key</div>
                  <Input
                    type="password"
                    value={String((cfgForm as any).sportsGameOddsApiKey || "")}
                    onChange={(e) => setCfgForm((s: any) => ({ ...s, sportsGameOddsApiKey: e.target.value }))}
                    placeholder={sportsGameOddsStatus.data?.apiKeyMasked || "x-api-key"}
                    className="bg-zinc-900 border-zinc-700"
                  />
                  <div className="text-xs text-zinc-500">
                    {sportsGameOddsStatus.data?.apiKeyConfigured ? "Configured" : "Not configured"}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-sm text-zinc-300">SportsGameOdds base URL</div>
                  <Input
                    value={String((cfgForm as any).sportsGameOddsBaseUrl || "")}
                    onChange={(e) => setCfgForm((s: any) => ({ ...s, sportsGameOddsBaseUrl: e.target.value }))}
                    placeholder="https://api.sportsgameodds.com"
                    className="bg-zinc-900 border-zinc-700"
                  />
                </div>

                <div className="space-y-1">
                  <div className="text-sm text-zinc-300">SportsGameOdds league IDs</div>
                  <Input
                    value={((cfgForm as any).sportsGameOddsLeagueIds || []).join(",")}
                    onChange={(e) =>
                      setCfgForm((s: any) => ({
                        ...s,
                        sportsGameOddsLeagueIds: e.target.value.split(",").map((x) => x.trim()).filter(Boolean),
                      }))
                    }
                    placeholder="NBA,NFL,MLB"
                    className="bg-zinc-900 border-zinc-700"
                  />
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setCfgForm((s: any) => ({ ...s, sportsGameOddsLeagueIds: SPORTS_GAME_ODDS_PLAN_LEAGUES.map((l) => l.id) }))}
                    >
                      Use plan leagues ({SPORTS_GAME_ODDS_PLAN_LEAGUES.length})
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setCfgForm((s: any) => ({ ...s, sportsGameOddsLeagueIds: SPORTS_GAME_ODDS_PLAN_LEAGUES.filter((l) => l.sport === "Soccer").map((l) => l.id) }))}
                    >
                      Soccer only
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setCfgForm((s: any) => ({ ...s, sportsGameOddsLeagueIds: [] }))}
                    >
                      Clear
                    </Button>
                  </div>
                  <div className="max-h-32 overflow-auto rounded border border-zinc-800 bg-zinc-950 p-2 text-[11px] text-zinc-400">
                    {SPORTS_GAME_ODDS_PLAN_LEAGUES.map((league) => (
                      <button
                        key={league.id}
                        type="button"
                        onClick={() =>
                          setCfgForm((s: any) => {
                            const current = Array.isArray(s.sportsGameOddsLeagueIds) ? s.sportsGameOddsLeagueIds : [];
                            return { ...s, sportsGameOddsLeagueIds: Array.from(new Set([...current, league.id])) };
                          })
                        }
                        className="mr-2 mb-1 rounded border border-zinc-800 px-2 py-0.5 hover:border-brand hover:text-white"
                        title={`${league.sport} - ${league.name}`}
                      >
                        {league.id}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-sm text-zinc-300">SportsGameOdds bookmakers</div>
                  <Input
                    value={((cfgForm as any).sportsGameOddsBookmakerPriority || []).join(",")}
                    onChange={(e) =>
                      setCfgForm((s: any) => ({
                        ...s,
                        sportsGameOddsBookmakerPriority: e.target.value.split(",").map((x) => x.trim()).filter(Boolean),
                      }))
                    }
                    placeholder="draftkings,fanduel,bet365"
                    className="bg-zinc-900 border-zinc-700"
                  />
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setCfgForm((s: any) => ({ ...s, sportsGameOddsBookmakerPriority: SPORTS_GAME_ODDS_SPORTSBOOK_IDS }))}
                    >
                      Use all sportsbooks ({SPORTS_GAME_ODDS_SPORTSBOOK_IDS.length})
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setCfgForm((s: any) => ({ ...s, sportsGameOddsBookmakerPriority: SPORTS_GAME_ODDS_BOOKMAKERS.map((b) => b.id) }))}
                    >
                      Use all bookmaker IDs ({SPORTS_GAME_ODDS_BOOKMAKERS.length})
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setCfgForm((s: any) => ({ ...s, sportsGameOddsBookmakerPriority: [] }))}
                    >
                      Clear
                    </Button>
                  </div>
                  <div className="max-h-32 overflow-auto rounded border border-zinc-800 bg-zinc-950 p-2 text-[11px] text-zinc-400">
                    {SPORTS_GAME_ODDS_BOOKMAKERS.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() =>
                          setCfgForm((s: any) => {
                            const current = Array.isArray(s.sportsGameOddsBookmakerPriority) ? s.sportsGameOddsBookmakerPriority : [];
                            return { ...s, sportsGameOddsBookmakerPriority: Array.from(new Set([...current, b.id])) };
                          })
                        }
                        className="mr-2 mb-1 rounded border border-zinc-800 px-2 py-0.5 hover:border-brand hover:text-white"
                        title={b.name}
                      >
                        {b.id}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="bg-zinc-950 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-sm">SportsGameOdds Usage</CardTitle>
                    <CardDescription>Rate limits from /v2/account/usage</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs text-zinc-300">
                    <div>Tier: {sportsGameOddsUsage.data?.data?.tier || "n/a"}</div>
                    <div>Active: {sportsGameOddsUsage.data?.data?.isActive === true ? "yes" : sportsGameOddsUsage.data?.data?.isActive === false ? "no" : "n/a"}</div>
                    {["per-minute", "per-hour", "per-day", "per-month"].map((key) => {
                      const row = sportsGameOddsUsage.data?.data?.rateLimits?.[key];
                      return (
                        <div key={key} className="flex justify-between gap-3 border-t border-zinc-800 pt-2">
                          <span>{key}</span>
                          <span className="text-zinc-400">
                            {String(row?.["current-requests"] ?? row?.["current-entities"] ?? "0")} / {String(row?.["max-requests"] ?? row?.["max-entities"] ?? "n/a")}
                          </span>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                <Card className="bg-zinc-950 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-sm">SportsGameOdds Sports</CardTitle>
                    <CardDescription>Enabled sport IDs from /v2/sports</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs text-zinc-300">
                    {(Array.isArray(sportsGameOddsSports.data?.data) ? sportsGameOddsSports.data.data : []).slice(0, 8).map((sport: any) => (
                      <div key={String(sport?.sportID)} className="flex justify-between gap-3">
                        <span>{String(sport?.name || sport?.sportID)}</span>
                        <Badge className={sport?.enabled ? "bg-emerald-600" : "bg-zinc-700"}>{String(sport?.sportID || "")}</Badge>
                      </div>
                    ))}
                    {sportsGameOddsSports.isError ? <div className="text-red-400">Could not load sports.</div> : null}
                  </CardContent>
                </Card>

                <Card className="bg-zinc-950 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-sm">SOCCER Leagues</CardTitle>
                    <CardDescription>Use these league IDs for football</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs text-zinc-300">
                    {(Array.isArray(sportsGameOddsLeagues.data?.data) ? sportsGameOddsLeagues.data.data : []).slice(0, 10).map((league: any) => (
                      <button
                        key={String(league?.leagueID)}
                        type="button"
                        onClick={() =>
                          setCfgForm((s: any) => {
                            const current = Array.isArray(s.sportsGameOddsLeagueIds) ? s.sportsGameOddsLeagueIds : [];
                            const next = Array.from(new Set([...current, String(league?.leagueID || "").trim()].filter(Boolean)));
                            return { ...s, sportsGameOddsLeagueIds: next };
                          })
                        }
                        className="w-full flex justify-between gap-3 text-left hover:text-white"
                      >
                        <span>{String(league?.name || league?.shortName || league?.leagueID)}</span>
                        <span className="text-brand">{String(league?.leagueID || "")}</span>
                      </button>
                    ))}
                    {sportsGameOddsLeagues.isError ? <div className="text-red-400">Could not load SOCCER leagues.</div> : null}
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-zinc-950 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-sm">SportsGameOdds Raw Events</CardTitle>
                  <CardDescription>Direct provider JSON from /v2/events. Use this to inspect missing markets before our mapper touches them.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_120px_auto] gap-3">
                    <div className="space-y-1">
                      <div className="text-xs text-zinc-400">League ID</div>
                      <Input
                        value={sgoRawLeagueId}
                        onChange={(e) => setSgoRawLeagueId(e.target.value)}
                        placeholder="INTERNATIONAL_SOCCER"
                        className="bg-zinc-900 border-zinc-700"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-zinc-400">Event ID</div>
                      <Input
                        value={sgoRawEventId}
                        onChange={(e) => setSgoRawEventId(e.target.value)}
                        placeholder="Optional exact eventID"
                        className="bg-zinc-900 border-zinc-700"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-zinc-400">Limit</div>
                      <Input
                        type="number"
                        min={1}
                        max={25}
                        value={sgoRawLimit}
                        onChange={(e) => setSgoRawLimit(e.target.value)}
                        className="bg-zinc-900 border-zinc-700"
                      />
                    </div>
                    <div className="flex items-end">
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          disabled={sportsGameOddsRawEvents.isPending}
                          onClick={() =>
                            sportsGameOddsRawEvents.mutate({
                              leagueID: sgoRawLeagueId.trim() || undefined,
                              eventID: sgoRawEventId.trim() || undefined,
                              limit: Number(sgoRawLimit || 3),
                              oddsAvailable: true,
                              bookmakers: sgoRawBookmakers.trim() || undefined,
                            })
                          }
                        >
                          {sportsGameOddsRawEvents.isPending ? "Loading..." : "Fetch Raw"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={!sportsGameOddsRawEvents.data}
                          onClick={() => {
                            const payload = sportsGameOddsRawEvents.data;
                            const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            const stamp = new Date().toISOString().replace(/[:.]/g, "-");
                            a.href = url;
                            a.download = `sportsgameodds-raw-${stamp}.json`;
                            document.body.appendChild(a);
                            a.click();
                            a.remove();
                            URL.revokeObjectURL(url);
                          }}
                        >
                          Export JSON
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs text-zinc-400">Bookmakers to inspect</div>
                    <Input
                      value={sgoRawBookmakers}
                      onChange={(e) => setSgoRawBookmakers(e.target.value)}
                      placeholder="book,fair,draftkings,fanduel,bet365"
                      className="bg-zinc-900 border-zinc-700"
                    />
                    <div className="flex flex-wrap gap-2">
                      {Array.from(new Set(["all", "book", "fair", ...(((cfgForm as any).sportsGameOddsBookmakerPriority || []) as string[]), ...SPORTS_GAME_ODDS_SPORTSBOOK_IDS].filter(Boolean))).slice(0, 30).map((bookmaker) => (
                        <button
                          key={String(bookmaker)}
                          type="button"
                          onClick={() => setSgoRawBookmakers(String(bookmaker))}
                          className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-[11px] text-zinc-300 hover:border-brand hover:text-white"
                        >
                          {String(bookmaker)}
                        </button>
                      ))}
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      Use `all` to inspect every sportsbook returned by your plan. `book` and `fair` are SportsGameOdds fallback prices; named bookmakers come from each odd's `byBookmaker` object.
                    </div>
                  </div>

                  {sportsGameOddsRawEvents.data?.summary?.length ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                      {sportsGameOddsRawEvents.data.summary.map((row: any) => (
                        <div key={String(row.eventID)} className="rounded border border-zinc-800 bg-zinc-900/60 p-3 text-xs text-zinc-300">
                          <div className="flex justify-between gap-3">
                            <span className="font-bold text-white">{row.teams?.home || "Home"} v {row.teams?.away || "Away"}</span>
                            <Badge className="bg-zinc-700">{row.oddsCount} odds</Badge>
                          </div>
                          <div className="mt-1 text-zinc-500">{row.eventID} · {row.leagueID} · {row.startsAt || "no start"}</div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {(row.betTypes || []).map((x: string) => <Badge key={x} className="bg-brand text-black">{x}</Badge>)}
                          </div>
                          <div className="mt-2 text-zinc-400">
                            Bookmakers: {(row.availableBookmakers || []).slice(0, 12).join(", ") || "none"}
                          </div>
                          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1">
                            {(row.bookmakerOdds || []).map((b: any) => (
                              <div key={String(b.bookmaker)} className="rounded border border-zinc-800 bg-black/40 px-2 py-1">
                                <div className="flex justify-between gap-2">
                                  <span className="text-zinc-200">{String(b.bookmaker)}</span>
                                  <span className={Number(b.oddsCount || 0) > 0 ? "text-emerald-400" : "text-zinc-600"}>{Number(b.oddsCount || 0)} odds</span>
                                </div>
                                <div className="mt-1 text-[10px] text-zinc-500 break-all">
                                  {(b.sample || []).slice(0, 3).map((s: any) => `${s.oddID} ${s.odds}`).join(" · ")}
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="mt-2 text-zinc-500 break-all">{(row.oddIDs || []).slice(0, 8).join(", ")}</div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {sportsGameOddsRawEvents.isError ? (
                    <div className="text-xs text-red-400">Could not fetch raw SportsGameOdds response.</div>
                  ) : null}

                  {sportsGameOddsRawEvents.data ? (
                    <pre className="max-h-[520px] overflow-auto rounded border border-zinc-800 bg-black p-3 text-[11px] leading-relaxed text-zinc-300">
                      {JSON.stringify(sportsGameOddsRawEvents.data, null, 2)}
                    </pre>
                  ) : null}
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-zinc-300">Persist detail odds to DB</div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={Boolean((cfgForm as any).detailPersistToDb)}
                      onChange={(e) => setCfgForm((s: any) => ({ ...s, detailPersistToDb: e.target.checked }))}
                    />
                    <span className="text-xs text-zinc-500">Required for placing bets from Match Detail markets</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-zinc-300">Live betting enabled</div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={Boolean((cfgForm as any).liveBettingEnabled)}
                      onChange={(e) => setCfgForm((s: any) => ({ ...s, liveBettingEnabled: e.target.checked }))}
                    />
                    <span className="text-xs text-zinc-500">Controls live odds placement</span>
                  </div>
                </div>
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
                    {
                      const payload: any = { ...cfgForm };
                      if (!String(payload.sportsGameOddsApiKey || "").trim()) delete payload.sportsGameOddsApiKey;
                      saveOddsSettings.mutate(payload, {
                      onSuccess: () => setToast({ kind: "success", message: "Saved odds/cron settings." }),
                      onError: (err: any) => setToast({ kind: "error", message: String(err?.message || "Failed to save settings") }),
                      });
                    }
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

        <TabsContent value="apifootball-leagues" className="space-y-6">
          <Card className="bg-[#1A1A1A] border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>APIfootball League Sync Config</span>
                <div className="flex items-center gap-2">
                  <Button onClick={() => apiLeaguesFetchNow.mutate()} disabled={apiLeaguesFetchNow.isPending} className="bg-zinc-800 hover:bg-zinc-700">
                    {apiLeaguesFetchNow.isPending ? "Fetching..." : "Fetch Leagues Now"}
                  </Button>
                  <Button onClick={() => apiLeaguesEnableAll.mutate()} disabled={apiLeaguesEnableAll.isPending} className="bg-zinc-800 hover:bg-zinc-700">
                    Enable All Active
                  </Button>
                  <Button onClick={() => apiLeaguesDisableAll.mutate()} disabled={apiLeaguesDisableAll.isPending} className="bg-zinc-800 hover:bg-zinc-700">
                    Disable All
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>Select which APIfootball leagues are used by get_events/get_odds (fixture mapping + results settlement).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-zinc-400">Search</label>
                  <Input
                    value={apiLSearch}
                    onChange={(e) => {
                      setApiLPage(1);
                      setApiLSearch(e.target.value);
                    }}
                    placeholder="League / country / id"
                    className="w-[320px]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-zinc-400">Sync Enabled</label>
                  <Select
                    value={apiLSyncEnabled === null ? "all" : apiLSyncEnabled ? "true" : "false"}
                    onValueChange={(v) => {
                      setApiLPage(1);
                      setApiLSyncEnabled(v === "all" ? null : v === "true");
                    }}
                  >
                    <SelectTrigger className="bg-zinc-900 border-zinc-700 w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="true">Enabled</SelectItem>
                      <SelectItem value="false">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-zinc-400">Active</label>
                  <Select
                    value={apiLActive === null ? "all" : apiLActive ? "true" : "false"}
                    onValueChange={(v) => {
                      setApiLPage(1);
                      setApiLActive(v === "all" ? null : v === "true");
                    }}
                  >
                    <SelectTrigger className="bg-zinc-900 border-zinc-700 w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={() => {
                    const ids = Object.keys(apiLSelected).filter((k) => apiLSelected[k]);
                    if (!ids.length) return;
                    apiLeaguesBulk.mutate({ ids, patch: { isEnabledForSync: true } });
                  }}
                  disabled={apiLeaguesBulk.isPending}
                  className="bg-brand text-black hover:bg-brand/80"
                >
                  Enable Selected
                </Button>
                <Button
                  onClick={() => {
                    const ids = Object.keys(apiLSelected).filter((k) => apiLSelected[k]);
                    if (!ids.length) return;
                    apiLeaguesBulk.mutate({ ids, patch: { isEnabledForSync: false } });
                  }}
                  disabled={apiLeaguesBulk.isPending}
                  className="bg-zinc-800 hover:bg-zinc-700"
                >
                  Disable Selected
                </Button>
              </div>

              <div className="overflow-auto max-h-[520px] border border-zinc-800 rounded-xl">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-zinc-400 border-b border-zinc-800">
                      <th className="py-2 px-3">Sel</th>
                      <th className="py-2 pr-3">Country</th>
                      <th className="py-2 pr-3">League</th>
                      <th className="py-2 pr-3">API ID</th>
                      <th className="py-2 pr-3">Sync</th>
                      <th className="py-2 pr-3">Active</th>
                      <th className="py-2 pr-3">Fixtures</th>
                      <th className="py-2 pr-3">Mapped</th>
                      <th className="py-2 pr-3">With Odds</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiLeagues.isLoading ? (
                      <tr>
                        <td colSpan={9} className="py-8 px-3 text-zinc-500">
                          Loading...
                        </td>
                      </tr>
                    ) : (apiLeagues.data?.leagues || []).length ? (
                      (apiLeagues.data.leagues || []).map((l: any) => (
                        <tr key={l.id} className="border-b border-zinc-900">
                          <td className="py-2 px-3">
                            <input
                              type="checkbox"
                              checked={Boolean(apiLSelected[l.id])}
                              onChange={(e) => setApiLSelected((s) => ({ ...s, [l.id]: e.target.checked }))}
                            />
                          </td>
                          <td className="py-2 pr-3 text-zinc-200">{l.countryName || "-"}</td>
                          <td className="py-2 pr-3 text-white">{l.name || "-"}</td>
                          <td className="py-2 pr-3 text-zinc-300 font-mono">{String(l.apiFootballLeagueId || "-")}</td>
                          <td className="py-2 pr-3">
                            {l.isEnabledForSync ? <Badge className="bg-emerald-700">ON</Badge> : <Badge className="bg-zinc-700">OFF</Badge>}
                          </td>
                          <td className="py-2 pr-3">
                            {l.isActive ? <Badge className="bg-emerald-700">YES</Badge> : <Badge className="bg-zinc-700">NO</Badge>}
                          </td>
                          <td className="py-2 pr-3 text-zinc-300">{l.fixturesCount ?? 0}</td>
                          <td className="py-2 pr-3 text-zinc-300">{l.fixturesWithMapping ?? 0}</td>
                          <td className="py-2 pr-3 text-zinc-300">{l.fixturesWithOddsCount ?? 0}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={9} className="py-8 px-3 text-zinc-500">
                          No leagues found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button onClick={() => setApiLPage((p) => Math.max(1, p - 1))} disabled={apiLPage <= 1} className="bg-zinc-800 hover:bg-zinc-700">
                  Prev
                </Button>
                <Button
                  onClick={() => setApiLPage((p) => p + 1)}
                  disabled={!apiLeagues.data || (apiLeagues.data?.leagues || []).length < apiLLimit}
                  className="bg-zinc-800 hover:bg-zinc-700"
                >
                  Next
                </Button>
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
