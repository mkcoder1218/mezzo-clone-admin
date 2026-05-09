import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Bug, Database, RefreshCcw, Search, Wrench } from "lucide-react";
import { Link } from "react-router-dom";
import { debugToolsApi } from "./api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

function safeJson(value: any) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function DebugToolsPage() {
  const [externalEventId, setExternalEventId] = useState("");
  const [fixtureId, setFixtureId] = useState("");

  const ext = externalEventId.trim();
  const fx = fixtureId.trim();
  const extOk = /^\d+$/.test(ext);
  const fxOk = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(fx);

  const fetchers = useQuery({
    queryKey: ["debug-tools", "fetchers-status"],
    queryFn: () => debugToolsApi.fetchersStatus(),
    staleTime: 5_000,
  }) as { data?: any; error?: unknown; isFetching: boolean; refetch: () => any };

  const resultsMapping = useQuery({
    queryKey: ["debug-tools", "results-mapping", ext],
    queryFn: () => debugToolsApi.resultsMappingByExternalEventId(ext),
    enabled: extOk,
  }) as { data?: any; error?: unknown; isFetching: boolean; refetch: () => any };

  const oddsFreshByFixture = useQuery({
    queryKey: ["debug-tools", "odds-freshness-fixture", fx],
    queryFn: () => debugToolsApi.oddsFreshnessByFixtureId(fx),
    enabled: fxOk,
  }) as { data?: any; error?: unknown; isFetching: boolean; refetch: () => any };

  const oddsFreshByExternal = useQuery({
    queryKey: ["debug-tools", "odds-freshness-external", ext],
    queryFn: () => debugToolsApi.oddsFreshnessByExternalEventId(ext),
    enabled: extOk,
  }) as { data?: any; error?: unknown; isFetching: boolean; refetch: () => any };

  const oddsCompare = useQuery({
    queryKey: ["debug-tools", "odds-compare", ext],
    queryFn: () => debugToolsApi.oddsCompareByExternalEventId(ext),
    enabled: extOk,
  }) as { data?: any; error?: unknown; isFetching: boolean; refetch: () => any };

  const oddsRefresh = useMutation({
    mutationFn: () => debugToolsApi.oddsRefreshByExternalEventId(ext),
    onSuccess: () => {
      oddsFreshByExternal.refetch();
      oddsCompare.refetch();
    },
  }) as { data?: any; error?: unknown; isPending: boolean; mutate: () => void };

  const headline = useMemo(() => {
    return oddsCompare.data?.data?.eventName || oddsFreshByExternal.data?.data?.eventName || null;
  }, [oddsCompare.data?.data?.eventName, oddsFreshByExternal.data?.data?.eventName]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Debug Tools</h1>
          <p className="text-zinc-400 mt-1">All admin debug utilities in one place.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/data-fetching">
            <Button className="bg-zinc-800 hover:bg-zinc-700">
              <Database className="w-4 h-4 mr-2" /> Data Fetch
            </Button>
          </Link>
          <Link to="/odds-debug">
            <Button className="bg-zinc-800 hover:bg-zinc-700">
              <Bug className="w-4 h-4 mr-2" /> Odds Debug
            </Button>
          </Link>
        </div>
      </div>

      <Card className="bg-[#1A1A1A] border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-3">
            <span>Worker / Fetchers</span>
            <Badge className="bg-zinc-700">/api/admin/fetchers/status</Badge>
          </CardTitle>
          <CardDescription>Quick check if mainOdds/detailOdds are enabled and running.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button onClick={() => fetchers.refetch()} className="bg-zinc-800 hover:bg-zinc-700" disabled={fetchers.isFetching}>
              <RefreshCcw className="w-4 h-4 mr-2" /> Refresh
            </Button>
          </div>
          <pre className="text-xs text-zinc-200 whitespace-pre-wrap break-words bg-black/30 rounded-lg p-4 border border-zinc-800">
            {fetchers.isFetching ? "Loading..." : safeJson(fetchers.data ?? null)}
          </pre>
        </CardContent>
      </Card>

      <Card className="bg-[#1A1A1A] border-zinc-800">
        <CardHeader>
          <CardTitle>Lookup</CardTitle>
          <CardDescription>Use External Event Id (numbers) and/or Fixture Id (uuid).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input value={externalEventId} onChange={(e) => setExternalEventId(e.target.value)} placeholder="externalEventId (e.g. 42122894)" />
            <Input value={fixtureId} onChange={(e) => setFixtureId(e.target.value)} placeholder="fixtureId (uuid)" />
          </div>

          {headline ? <p className="text-sm text-zinc-300">Fixture: <span className="text-white font-semibold">{headline}</span></p> : null}

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => {
                resultsMapping.refetch();
                oddsCompare.refetch();
                oddsFreshByExternal.refetch();
                oddsFreshByFixture.refetch();
              }}
              className="bg-zinc-800 hover:bg-zinc-700"
              disabled={resultsMapping.isFetching || oddsCompare.isFetching || oddsFreshByExternal.isFetching || oddsFreshByFixture.isFetching}
            >
              <Search className="w-4 h-4 mr-2" /> Refresh View
            </Button>

            <Button onClick={() => oddsRefresh.mutate()} className="bg-brand text-black hover:bg-brand/80" disabled={!extOk || oddsRefresh.isPending}>
              <Wrench className="w-4 h-4 mr-2" /> Refresh Odds (by external)
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-[#1A1A1A] border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3">
              <span>Results Mapping</span>
              <Badge className="bg-zinc-700">/api/admin/debug/results/event/:externalEventId/mapping</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs text-zinc-200 whitespace-pre-wrap break-words bg-black/30 rounded-lg p-4 border border-zinc-800">
              {!extOk ? "Enter a numeric externalEventId." : resultsMapping.isFetching ? "Loading..." : safeJson(resultsMapping.data ?? null)}
            </pre>
          </CardContent>
        </Card>

        <Card className="bg-[#1A1A1A] border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3">
              <span>Odds Freshness (by fixture)</span>
              <Badge className="bg-zinc-700">/api/admin/debug/fixtures/:fixtureId/odds-freshness</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs text-zinc-200 whitespace-pre-wrap break-words bg-black/30 rounded-lg p-4 border border-zinc-800">
              {!fxOk ? "Enter a fixtureId uuid." : oddsFreshByFixture.isFetching ? "Loading..." : safeJson(oddsFreshByFixture.data ?? null)}
            </pre>
          </CardContent>
        </Card>

        <Card className="bg-[#1A1A1A] border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3">
              <span>Odds Freshness (by external)</span>
              <Badge className="bg-zinc-700">/api/admin/debug/fixtures/by-external/:externalEventId/odds-freshness</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs text-zinc-200 whitespace-pre-wrap break-words bg-black/30 rounded-lg p-4 border border-zinc-800">
              {!extOk ? "Enter a numeric externalEventId." : oddsFreshByExternal.isFetching ? "Loading..." : safeJson(oddsFreshByExternal.data ?? null)}
            </pre>
          </CardContent>
        </Card>

        <Card className="bg-[#1A1A1A] border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3">
              <span>Odds Compare</span>
              <Badge className="bg-zinc-700">/api/admin/debug/fixtures/by-external/:externalEventId/odds-compare</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {oddsRefresh.error ? <p className="text-xs text-red-400">Refresh error: {(oddsRefresh.error as Error).message}</p> : null}
            <pre className="text-xs text-zinc-200 whitespace-pre-wrap break-words bg-black/30 rounded-lg p-4 border border-zinc-800">
              {!extOk ? "Enter a numeric externalEventId." : oddsCompare.isFetching ? "Loading..." : safeJson(oddsCompare.data ?? null)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
