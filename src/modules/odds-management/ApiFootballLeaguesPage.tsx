import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { oddsManagementApi, type ApiFootballLeagueRow } from "./api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  RefreshCcw, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight,
  Info,
  Calendar,
  Layers,
  Database,
  Play,
  Settings2,
  Trash2,
  ExternalLink
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

export function ApiFootballLeaguesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [syncEnabledOnly, setSyncEnabledOnly] = useState(false);
  const [cronEnabledOnly, setCronEnabledOnly] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 50;

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number; message: string } | null>(null);
  const [debugResults, setDebugResults] = useState<any>(null);
  const [previewData, setPreviewData] = useState<any>(null);

  // Sync Config State
  const [fromDate, setFromDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [toDate, setToDate] = useState(format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"));
  const [batchSize, setBatchSize] = useState(10);
  const [requestDelayMs, setRequestDelayMs] = useState(2000);
  const [maxRequestsPerRun, setMaxRequestsPerRun] = useState(10);
  const [onlyMissingOrStale, setOnlyMissingOrStale] = useState(true);
  const [autoFetchFixtures, setAutoFetchFixtures] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [deletingUnmapped, setDeletingUnmapped] = useState(false);
  const [deleteMode, setDeleteMode] = useState<"unmapped" | "missing_odds">("unmapped");

  const { data, isLoading } = useQuery({
    queryKey: ["apifootball-leagues", search, countryFilter, syncEnabledOnly, cronEnabledOnly, page, fromDate, toDate],
    queryFn: () => oddsManagementApi.leaguesList({ 
      search: search || undefined, 
      country: countryFilter || undefined,
      syncEnabled: syncEnabledOnly || undefined,
      cronEnabled: cronEnabledOnly || undefined,
      page, 
      limit,
      from: fromDate,
      to: toDate
    }),
  });

  const leagues = data?.leagues || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const toggleSelectAll = () => {
    if (selectedIds.length === leagues.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(leagues.map(l => l.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleToggleSync = async (league: ApiFootballLeagueRow) => {
    await oddsManagementApi.leaguePatch(league.id, { isEnabledForSync: !league.isEnabledForSync });
    qc.invalidateQueries({ queryKey: ["apifootball-leagues"] });
  };

  const handleToggleCron = async (league: ApiFootballLeagueRow) => {
    await oddsManagementApi.leaguePatch(league.id, { isCronEnabled: !league.isCronEnabled });
    qc.invalidateQueries({ queryKey: ["apifootball-leagues"] });
  };

  const handleFetchAllLeagues = async () => {
    setSyncing(true);
    try {
      await oddsManagementApi.leaguesFetchNow();
      qc.invalidateQueries({ queryKey: ["apifootball-leagues"] });
    } finally {
      setSyncing(false);
    }
  };

  const handleBulkSync = async (type: "fixtures" | "odds" | "both" | "detail" | "preview") => {
    if (!selectedIds.length) return;
    setSyncing(true);
    setProgress({ current: 0, total: selectedIds.length, message: `Processing ${type}...` });
    
    try {
      const params = { 
        leagueIds: selectedIds, 
        from: fromDate, 
        to: toDate,
        batchSize,
        requestDelayMs,
        maxRequestsPerRun,
        onlyMissingOrStale,
        autoFetchFixtures
      };

      if (type === "preview") {
        const res = await oddsManagementApi.syncPreview({ leagueIds: selectedIds, from: fromDate, to: toDate });
        setPreviewData(res);
      } else if (type === "fixtures") {
        await oddsManagementApi.fetchFixtures(params);
      } else if (type === "odds") {
        await oddsManagementApi.fetchOdds(params);
      } else if (type === "both") {
        await oddsManagementApi.fetchFixturesAndOdds(params);
      } else if (type === "detail") {
        await oddsManagementApi.fetchDetailOdds(params);
      }
      qc.invalidateQueries({ queryKey: ["apifootball-leagues"] });
    } finally {
      setSyncing(false);
      setProgress(null);
    }
  };

  const handleBulkUpdate = async (updates: Partial<ApiFootballLeagueRow>) => {
    if (!selectedIds.length) return;
    await oddsManagementApi.leaguesBulk(selectedIds, updates);
    qc.invalidateQueries({ queryKey: ["apifootball-leagues"] });
  };

  const handleDeleteUnmapped = async (dryRun: boolean) => {
    setDeletingUnmapped(true);
    try {
      const res = await oddsManagementApi.deleteUnmappedFixtures({
        from: fromDate,
        to: toDate,
        apiLeagueIds: selectedIds.length ? selectedIds : undefined,
        mode: deleteMode,
        dryRun
      });
      setDebugResults(res);
      qc.invalidateQueries({ queryKey: ["apifootball-leagues"] });
    } finally {
      setDeletingUnmapped(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white uppercase tracking-tight italic font-display">APIfootball Leagues</h1>
          <p className="text-zinc-500 mt-1">Manage football competition sync, manual fetching, and automated cron schedules.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            className="bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700"
            onClick={handleFetchAllLeagues}
            disabled={syncing}
          >
            <RefreshCcw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            Refresh All Leagues
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-zinc-900/40 border-zinc-800/60 space-y-4">
          <div className="text-zinc-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-3 h-3" /> Sync Range
          </div>
          <div className="space-y-3">
             <div className="space-y-1">
                <label className="text-[10px] text-zinc-500 uppercase font-bold">From</label>
                <Input 
                  type="date" 
                  value={fromDate} 
                  onChange={(e) => setFromDate(e.target.value)}
                  className="bg-zinc-950 border-zinc-800 text-white text-xs h-9"
                />
             </div>
             <div className="space-y-1">
                <label className="text-[10px] text-zinc-500 uppercase font-bold">To</label>
                <Input 
                  type="date" 
                  value={toDate} 
                  onChange={(e) => setToDate(e.target.value)}
                  className="bg-zinc-950 border-zinc-800 text-white text-xs h-9"
                />
             </div>
             <div className="grid grid-cols-2 gap-1">
                <Button variant="ghost" size="sm" className="h-7 text-[10px] bg-zinc-950 border border-zinc-800" onClick={() => {
                  setFromDate(format(new Date(), "yyyy-MM-dd"));
                  setToDate(format(new Date(), "yyyy-MM-dd"));
                }}>Today</Button>
                <Button variant="ghost" size="sm" className="h-7 text-[10px] bg-zinc-950 border border-zinc-800" onClick={() => {
                  setFromDate(format(new Date(), "yyyy-MM-dd"));
                  setToDate(format(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"));
                }}>+3 Days</Button>
                <Button variant="ghost" size="sm" className="h-7 text-[10px] bg-zinc-950 border border-zinc-800" onClick={() => {
                  setFromDate(format(new Date(), "yyyy-MM-dd"));
                  setToDate(format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"));
                }}>+7 Days</Button>
                <Button variant="ghost" size="sm" className="h-7 text-[10px] bg-zinc-950 border border-zinc-800" onClick={() => {
                  setFromDate(format(new Date(), "yyyy-MM-dd"));
                  setToDate(format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"));
                }}>+14 Days</Button>
             </div>
          </div>
          
          <div className="pt-2 border-t border-zinc-800/50 space-y-4">
             <div className="text-zinc-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
               <Search className="w-3 h-3" /> Filters
             </div>
             <div className="space-y-2">
               <Input 
                 placeholder="Search leagues..." 
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 h-9"
               />
               <Input 
                 placeholder="Filter by country..." 
                 value={countryFilter}
                 onChange={(e) => setCountryFilter(e.target.value)}
                 className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 h-9"
               />
               <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/50 border border-zinc-800/30">
                 <span className="text-sm text-zinc-300">Sync Enabled</span>
                 <Switch checked={syncEnabledOnly} onCheckedChange={setSyncEnabledOnly} />
               </div>
               <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/50 border border-zinc-800/30">
                 <span className="text-sm text-zinc-300">Cron Enabled</span>
                 <Switch checked={cronEnabledOnly} onCheckedChange={setCronEnabledOnly} />
               </div>
             </div>
          </div>
        </Card>

        <Card className="md:col-span-3 p-4 bg-zinc-900/40 border-zinc-800/60 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="text-zinc-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-3 h-3" /> Bulk Actions ({selectedIds.length} selected)
            </div>
            {progress && (
               <div className="text-brand text-xs font-bold animate-pulse">
                  {progress.message}
               </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              size="sm" 
              className="bg-brand/10 text-brand border-brand/20 hover:bg-brand/20"
              onClick={() => handleBulkSync("fixtures")}
              disabled={!selectedIds.length || syncing}
            >
              <Calendar className="w-4 h-4 mr-2" /> Sync Fixtures
            </Button>
            <Button 
              size="sm" 
              className="bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20"
              onClick={() => handleBulkSync("odds")}
              disabled={!selectedIds.length || syncing}
            >
              <Database className="w-4 h-4 mr-2" /> Sync Odds
            </Button>
            <Button 
              size="sm" 
              className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
              onClick={() => handleBulkSync("both")}
              disabled={!selectedIds.length || syncing}
            >
              <Play className="w-4 h-4 mr-2" /> Sync All
            </Button>

            <div className="flex items-center gap-2 px-2 py-1 rounded-md border border-zinc-800 bg-zinc-950/50">
              <span className="text-[10px] font-bold uppercase text-zinc-500">Cleanup</span>
              <Button
                size="sm"
                variant={deleteMode === "unmapped" ? "default" : "outline"}
                className={
                  deleteMode === "unmapped"
                    ? "h-7 px-2 text-[10px] bg-zinc-800 text-white hover:bg-zinc-700"
                    : "h-7 px-2 text-[10px] border-zinc-800 text-zinc-400 hover:text-white"
                }
                onClick={() => setDeleteMode("unmapped")}
                disabled={syncing || deletingUnmapped}
                title="Delete fixtures with apiFootballMatchId = null (unmapped) and no outcomes."
              >
                Unmapped
              </Button>
              <Button
                size="sm"
                variant={deleteMode === "missing_odds" ? "default" : "outline"}
                className={
                  deleteMode === "missing_odds"
                    ? "h-7 px-2 text-[10px] bg-zinc-800 text-white hover:bg-zinc-700"
                    : "h-7 px-2 text-[10px] border-zinc-800 text-zinc-400 hover:text-white"
                }
                onClick={() => setDeleteMode("missing_odds")}
                disabled={syncing || deletingUnmapped}
                title="Delete fixtures that are mapped (apiFootballMatchId != null) but still have no outcomes."
              >
                Missing Odds
              </Button>
            </div>

            <Button
              size="sm"
              className="bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
              onClick={() => handleDeleteUnmapped(false)}
              disabled={syncing || deletingUnmapped}
              title="Deletes fixtures in the selected date range (and selected leagues, if any) using the selected cleanup mode. Backend only deletes fixtures that have no outcomes (safety guard)."
            >
              <Trash2 className={`w-4 h-4 mr-2 ${deletingUnmapped ? "animate-pulse" : ""}`} /> Delete
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-zinc-800 text-zinc-400 hover:text-white"
              onClick={() => handleDeleteUnmapped(true)}
              disabled={syncing || deletingUnmapped}
              title="Dry run: shows how many fixtures would be deleted."
            >
              <Info className="w-4 h-4 mr-2" /> Preview
            </Button>
            <Button 
              size="sm" 
              className="bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20"
              onClick={() => handleBulkSync("detail")}
              disabled={!selectedIds.length || syncing}
            >
              <Settings2 className="w-4 h-4 mr-2" /> Detail Markets
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="border-zinc-800 text-zinc-400 hover:text-white"
              onClick={() => handleBulkSync("preview")}
              disabled={!selectedIds.length || syncing}
            >
              <Search className="w-4 h-4 mr-2" /> Sync Preview
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className={`border-zinc-800 text-zinc-400 hover:text-white ${showConfig ? 'bg-zinc-800 text-white' : ''}`}
              onClick={() => setShowConfig(!showConfig)}
            >
              <Settings2 className="w-4 h-4 mr-2" /> Config
            </Button>
            <div className="h-8 w-[1px] bg-zinc-800 mx-2" />
            <Button 
              size="sm" 
              variant="outline"
              className="border-zinc-800 text-zinc-400"
              onClick={() => {
                const p = prompt("Enter priority (default 1000, lower is higher rank):");
                if (p !== null) handleBulkUpdate({ priority: Number(p) });
              }}
              disabled={!selectedIds.length}
            >
              Set Priority
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="border-zinc-800 text-zinc-400"
              onClick={() => handleBulkUpdate({ isTop: true })}
              disabled={!selectedIds.length}
            >
              Mark Top
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="border-zinc-800 text-zinc-400"
              onClick={() => handleBulkUpdate({ isTop: false })}
              disabled={!selectedIds.length}
            >
              Unmark Top
            </Button>
          </div>

          {showConfig && (
            <div className="mt-4 pt-4 border-t border-zinc-800/50 grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2">
               <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 uppercase font-bold">Batch Size</label>
                  <Input type="number" value={batchSize} onChange={e => setBatchSize(Number(e.target.value))} className="bg-zinc-950 border-zinc-800 text-xs h-8" />
               </div>
               <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 uppercase font-bold">Delay (ms)</label>
                  <Input type="number" value={requestDelayMs} onChange={e => setRequestDelayMs(Number(e.target.value))} className="bg-zinc-950 border-zinc-800 text-xs h-8" />
               </div>
               <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 uppercase font-bold">Max Requests</label>
                  <Input type="number" value={maxRequestsPerRun} onChange={e => setMaxRequestsPerRun(Number(e.target.value))} className="bg-zinc-950 border-zinc-800 text-xs h-8" />
               </div>
               <div className="flex flex-col gap-2 pt-4">
                  <div className="flex items-center justify-between">
                     <span className="text-[10px] text-zinc-400">Only Missing/Stale</span>
                     <Switch checked={onlyMissingOrStale} onCheckedChange={setOnlyMissingOrStale} className="scale-75" />
                  </div>
                  <div className="flex items-center justify-between">
                     <span className="text-[10px] text-zinc-400">Auto Fetch Fixtures</span>
                     <Switch checked={autoFetchFixtures} onCheckedChange={setAutoFetchFixtures} className="scale-75" />
                  </div>
               </div>
            </div>
          )}
        </Card>
      </div>

      {previewData && (
         <Card className="p-4 bg-emerald-500/5 border-emerald-500/10 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
               <div className="text-emerald-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  <Database className="w-3 h-3" /> Sync Preview: {fromDate} to {toDate}
               </div>
               <Button variant="ghost" size="sm" className="h-6 text-[10px] text-emerald-500/50 hover:text-emerald-500" onClick={() => setPreviewData(null)}>Dismiss</Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
               <div className="p-3 rounded-lg bg-zinc-950/50 border border-zinc-800">
                  <div className="text-[10px] text-zinc-500 uppercase font-bold">Leagues</div>
                  <div className="text-white font-bold">{previewData.selectedLeagues.length}</div>
               </div>
               <div className="p-3 rounded-lg bg-zinc-950/50 border border-zinc-800">
                  <div className="text-[10px] text-zinc-500 uppercase font-bold">Local Fixtures</div>
                  <div className="text-white font-bold">{previewData.localFixturesInRange}</div>
               </div>
               <div className="p-3 rounded-lg bg-zinc-950/50 border border-zinc-800">
                  <div className="text-[10px] text-zinc-500 uppercase font-bold">Mapped Match IDs</div>
                  <div className="text-white font-bold">{previewData.fixturesWithApiFootballMatchId}</div>
               </div>
               <div className="p-3 rounded-lg bg-zinc-950/50 border border-zinc-800">
                  <div className="text-[10px] text-zinc-500 uppercase font-bold">Fresh Odds</div>
                  <div className="text-emerald-400 font-bold">{previewData.fixturesWithFreshOdds}</div>
               </div>
               <div className="p-3 rounded-lg bg-zinc-950/50 border border-zinc-800">
                  <div className="text-[10px] text-rose-500 uppercase font-bold">Missing/Stale</div>
                  <div className="text-rose-400 font-bold">{previewData.fixturesMissingOdds}</div>
               </div>
               <div className="p-3 rounded-lg bg-zinc-950/50 border border-rose-500/30 ring-1 ring-rose-500/20">
                  <div className="text-[10px] text-rose-400 uppercase font-bold italic">Est. Requests</div>
                  <div className="text-white font-black text-lg leading-none mt-1">{previewData.estimatedProviderRequests}</div>
               </div>
            </div>
            {previewData.warnings?.length > 0 && (
               <div className="flex items-center gap-2 text-rose-400 text-[11px] font-bold bg-rose-500/10 p-2 rounded border border-rose-500/20">
                  <AlertCircle className="w-3 h-3" />
                  {previewData.warnings[0]}
               </div>
            )}
         </Card>
      )}

      {debugResults && (
         <Card className="p-4 bg-amber-500/5 border-amber-500/10 space-y-4">
            <div className="flex items-center justify-between">
               <div className="text-amber-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  <Info className="w-3 h-3" /> Diagnostic Results
               </div>
               <Button variant="ghost" size="sm" className="h-6 text-[10px] text-amber-500/50 hover:text-amber-500" onClick={() => setDebugResults(null)}>Dismiss</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {debugResults.selectedLeagues?.map((res: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-lg bg-zinc-950/50 border border-zinc-800 text-[11px] space-y-2">
                     <div className="flex justify-between items-start">
                        <span className="text-white font-bold">{res.apiFootballLeagueTableRow?.name || "Unknown"}</span>
                        {res.issue ? (
                           <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20 py-0 text-[9px]">Issue</Badge>
                        ) : (
                           <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 py-0 text-[9px]">OK</Badge>
                        )}
                     </div>
                     {res.issue && <div className="text-rose-400 font-medium italic">{res.issue}</div>}
                     <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        <span className="text-zinc-500">Local League ID:</span>
                        <span className={res.matchedLocalLeague ? "text-emerald-400" : "text-rose-400"}>
                           {res.matchedLocalLeague ? "Mapped" : "Missing"}
                        </span>
                        <span className="text-zinc-500">Fixtures (Total):</span>
                        <span className="text-zinc-300">{res.localFixtureCounts.totalForLocalLeague}</span>
                        <span className="text-zinc-500">Fixtures (Range):</span>
                        <span className="text-zinc-300">{res.localFixtureCounts.inDateRange}</span>
                        <span className="text-zinc-500">With Match ID:</span>
                        <span className="text-zinc-300">{res.localFixtureCounts.withApiFootballMatchId}</span>
                     </div>
                  </div>
               ))}
            </div>
         </Card>
      )}

      <Card className="bg-zinc-900/40 border-zinc-800/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/30">
                <th className="p-4 w-10">
                  <input 
                    type="checkbox"
                    className="w-4 h-4 rounded border-zinc-800 bg-zinc-950 text-brand"
                    checked={selectedIds.length === leagues.length && leagues.length > 0} 
                    onChange={toggleSelectAll} 
                  />
                </th>
                <th className="p-4 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">League / Country</th>
                <th className="p-4 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">ID</th>
                <th className="p-4 text-zinc-500 text-[10px] font-bold uppercase tracking-widest text-center">Status</th>
                <th className="p-4 text-zinc-500 text-[10px] font-bold uppercase tracking-widest text-center">Sync</th>
                <th className="p-4 text-zinc-500 text-[10px] font-bold uppercase tracking-widest text-center">Cron</th>
                <th className="p-4 text-zinc-500 text-[10px] font-bold uppercase tracking-widest text-center">Top</th>
                <th className="p-4 text-zinc-500 text-[10px] font-bold uppercase tracking-widest text-center">Priority</th>
                <th className="p-4 text-zinc-500 text-[10px] font-bold uppercase tracking-widest text-right">Data (Range)</th>
                <th className="p-4 text-zinc-500 text-[10px] font-bold uppercase tracking-widest text-right">Last Sync</th>
                <th className="p-4 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-zinc-600 animate-pulse">Scanning APIfootball grid...</td>
                </tr>
              ) : leagues.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-zinc-600">No leagues found matching criteria.</td>
                </tr>
              ) : (
                leagues.map((league) => (
                  <tr key={league.id} className="hover:bg-zinc-800/20 group transition-colors">
                    <td className="p-4">
                      <input 
                        type="checkbox"
                        className="w-4 h-4 rounded border-zinc-800 bg-zinc-950 text-brand"
                        checked={selectedIds.includes(league.id)} 
                        onChange={() => toggleSelect(league.id)} 
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-white font-bold text-sm">{league.name}</span>
                        <span className="text-zinc-500 text-[11px] uppercase tracking-tighter">{league.countryName || "Unknown"}</span>
                      </div>
                    </td>
                    <td className="p-4 text-zinc-500 text-xs font-mono">{league.apiFootballLeagueId}</td>
                    <td className="p-4 text-center">
                       {league.lastError ? (
                          <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20">Error</Badge>
                       ) : league.fixturesWithOddsCount > 0 ? (
                          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Ready</Badge>
                       ) : (
                          <Badge className="bg-zinc-500/10 text-zinc-500 border-zinc-800">Pending</Badge>
                       )}
                    </td>
                    <td className="p-4 text-center">
                      <Switch 
                        checked={league.isEnabledForSync} 
                        onCheckedChange={() => handleToggleSync(league)} 
                        className="data-[state=checked]:bg-brand"
                      />
                    </td>
                    <td className="p-4 text-center">
                      <Switch 
                        checked={league.isCronEnabled} 
                        onCheckedChange={() => handleToggleCron(league)} 
                        className="data-[state=checked]:bg-blue-500"
                      />
                    </td>
                    <td className="p-4 text-center">
                      <Switch 
                        checked={league.isTop} 
                        onCheckedChange={async (val) => {
                          await oddsManagementApi.leaguePatch(league.id, { isTop: val });
                          qc.invalidateQueries({ queryKey: ["apifootball-leagues"] });
                        }}
                        className="data-[state=checked]:bg-amber-500"
                      />
                    </td>
                    <td className="p-4 text-center">
                      <Input 
                        type="number"
                        className="w-16 h-8 bg-zinc-950 border-zinc-800 text-center text-xs"
                        defaultValue={league.priority}
                        onBlur={async (e) => {
                          const val = Number(e.target.value);
                          if (val !== league.priority) {
                            await oddsManagementApi.leaguePatch(league.id, { priority: val });
                            qc.invalidateQueries({ queryKey: ["apifootball-leagues"] });
                          }
                        }}
                      />
                    </td>
                    <td className="p-4 text-right">
                       <div className="flex flex-col items-end gap-1">
                          <div className="text-xs text-white">
                             <span className="text-zinc-500">Fixtures:</span> {league.fixturesCount}
                          </div>
                          <div className="text-[10px] text-zinc-400">
                             <span className="text-zinc-600">Mapped:</span> {league.fixturesWithMapping}
                          </div>
                          <div className="text-[10px] text-zinc-400">
                             <span className="text-zinc-600">Odds:</span> {league.oddsCount}
                          </div>
                          {league.missingOddsCount > 0 && (
                             <div className="text-[10px] text-rose-400 font-bold">
                                <span className="text-zinc-600">Missing:</span> {league.missingOddsCount}
                             </div>
                          )}
                       </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex flex-col items-end text-[10px]">
                        <span className="text-zinc-400">
                          {league.lastOddsSyncAt ? formatDistanceToNow(new Date(league.lastOddsSyncAt)) + " ago" : "Never"}
                        </span>
                        <span className="text-zinc-600 uppercase tracking-tighter">Odds Sync</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-zinc-500 hover:text-white"
                          onClick={() => {
                            setSelectedIds([league.id]);
                            handleBulkSync("debug");
                          }}
                        >
                          <Search className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-zinc-800 flex items-center justify-between bg-zinc-950/20">
            <div className="text-xs text-zinc-500">
              Showing page {page} of {totalPages} ({total} total leagues)
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page <= 1} 
                onClick={() => setPage(p => p - 1)}
                className="border-zinc-800 text-zinc-400 h-8 w-8 p-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page >= totalPages} 
                onClick={() => setPage(p => p + 1)}
                className="border-zinc-800 text-zinc-400 h-8 w-8 p-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 flex items-start gap-4">
         <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
         <div className="space-y-1">
            <h4 className="text-sm font-bold text-blue-300">Sync Protocol Guidance</h4>
            <p className="text-xs text-blue-400/80 leading-relaxed">
               The hourly cron only processes leagues where <strong>Cron Enabled</strong> is active. 
               It performs an "onlyMissingOrStale" fetch to optimize API usage and avoid rate limits. 
               Manual sync buttons above will process all matches for the next 7 days for selected leagues.
            </p>
         </div>
      </div>
    </div>
  );
}
