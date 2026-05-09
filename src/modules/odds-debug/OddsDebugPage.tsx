import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, RefreshCcw, Search, Wrench } from "lucide-react";
import { oddsDebugApi, type OddsCompareResponse, type OddsFreshnessResponse, type OddsRefreshResponse } from "./api";
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

export function OddsDebugPage() {
  const [externalEventId, setExternalEventId] = useState("");
  const trimmed = externalEventId.trim();
  const enabled = /^\d+$/.test(trimmed);

  const freshness = useQuery({
    queryKey: ["odds-debug", "freshness", trimmed],
    queryFn: () => oddsDebugApi.freshnessByExternal(trimmed),
    enabled
  }) as { data?: OddsFreshnessResponse; error?: unknown; isFetching: boolean; refetch: () => any };

  const compare = useQuery({
    queryKey: ["odds-debug", "compare", trimmed],
    queryFn: () => oddsDebugApi.compareByExternal(trimmed),
    enabled
  }) as { data?: OddsCompareResponse; error?: unknown; isFetching: boolean; refetch: () => any };

  const refresh = useMutation({
    mutationFn: () => oddsDebugApi.refreshByExternal(trimmed),
    onSuccess: () => {
      freshness.refetch();
      compare.refetch();
    }
  }) as { data?: OddsRefreshResponse; error?: unknown; isPending: boolean; mutate: () => void };

  const mismatches = compare.data?.data?.mismatches || [];
  const mismatchCount = Array.isArray(mismatches) ? mismatches.length : 0;

  const headline = useMemo(() => {
    const name = compare.data?.data?.eventName;
    if (name) return name;
    const fix = freshness.data?.data?.eventName;
    if (fix) return fix;
    return null;
  }, [compare.data?.data?.eventName, freshness.data?.data?.eventName]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Odds Debug</h1>
          <p className="text-zinc-400 mt-1">Inspect staleness + provider/db mismatch for a single fixture, then force a refresh.</p>
        </div>
      </div>

      <Card className="bg-[#1A1A1A] border-zinc-800">
        <CardHeader>
          <CardTitle>Lookup</CardTitle>
          <CardDescription>Use provider external event id (numbers only).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-[280px] flex-1">
              <Input
                value={externalEventId}
                onChange={(e) => setExternalEventId(e.target.value)}
                placeholder="External event id (e.g. 42122894)"
              />
            </div>
            <Button
              onClick={() => {
                freshness.refetch();
                compare.refetch();
              }}
              disabled={!enabled || freshness.isFetching || compare.isFetching}
              className="bg-zinc-800 hover:bg-zinc-700"
            >
              <Search className="w-4 h-4 mr-2" /> Refresh View
            </Button>
            <Button
              onClick={() => refresh.mutate()}
              disabled={!enabled || refresh.isPending}
              className="bg-brand text-black hover:bg-brand/80"
            >
              <Wrench className="w-4 h-4 mr-2" /> Fix (Refresh Odds)
            </Button>
          </div>

          {headline ? <p className="text-sm text-zinc-300">Fixture: <span className="text-white font-semibold">{headline}</span></p> : null}

          <div className="flex flex-wrap items-center gap-2">
            <Badge className={mismatchCount ? "bg-amber-600" : "bg-emerald-600"}>
              {mismatchCount ? `${mismatchCount} mismatches` : "No mismatches detected"}
            </Badge>
            {refresh.data?.data?.fetchedAt ? (
              <Badge className="bg-zinc-700">
                <RefreshCcw className="w-3 h-3 mr-1" /> last refresh: {refresh.data.data.fetchedAt}
              </Badge>
            ) : null}
          </div>

          {!enabled && trimmed.length ? (
            <p className="text-xs text-amber-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> externalEventId must be numeric.
            </p>
          ) : null}

          {freshness.error ? <p className="text-xs text-red-400">Freshness error: {(freshness.error as Error).message}</p> : null}
          {compare.error ? <p className="text-xs text-red-400">Compare error: {(compare.error as Error).message}</p> : null}
          {refresh.error ? <p className="text-xs text-red-400">Refresh error: {(refresh.error as Error).message}</p> : null}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-[#1A1A1A] border-zinc-800">
          <CardHeader>
            <CardTitle>Odds Freshness</CardTitle>
            <CardDescription>What the homepage would consider selectable vs expired.</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="text-xs text-zinc-200 whitespace-pre-wrap break-words bg-black/30 rounded-lg p-4 border border-zinc-800">
              {freshness.isFetching ? "Loading..." : safeJson(freshness.data?.data ?? null)}
            </pre>
          </CardContent>
        </Card>

        <Card className="bg-[#1A1A1A] border-zinc-800">
          <CardHeader>
            <CardTitle>Provider vs DB</CardTitle>
            <CardDescription>1X2/DC/BTS compare (referenceId matching).</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="text-xs text-zinc-200 whitespace-pre-wrap break-words bg-black/30 rounded-lg p-4 border border-zinc-800">
              {compare.isFetching ? "Loading..." : safeJson(compare.data?.data ?? null)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
