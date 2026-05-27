import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/apiClient";
import { Button } from "@/components/ui/button";

type Row = {
  betSelectionId: string;
  selectionResult: string;
  settlementReason: string | null;
  betSlipId: string;
  betSlipStatus: string;
  betSlipResult: string;
  placedAt: string | null;
  fixtureId: string;
  fixtureStatus: string;
  startsAt: string | null;
  externalSyncedAt: string | null;
  homeTeam: string | null;
  awayTeam: string | null;
  marketId: string;
  marketKey: string;
  marketName: string;
  outcomeId: string;
  outcomeKey: string | null;
  outcomeName: string;
};

type Resp = { limit: number; offset: number; count: number; rows: Row[] };

function fmtDt(v: string | null) {
  if (!v) return "-";
  try {
    return new Date(v).toLocaleString();
  } catch {
    return String(v);
  }
}

export function UnsettledMarketsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [qText, setQText] = useState("");
  const [reason, setReason] = useState("");
  const limit = 50;
  const offset = (page - 1) * limit;

  const q = useQuery({
    queryKey: ["results-unsettled-selections", { page, qText, reason }],
    queryFn: () =>
      apiRequest<Resp>(
        `/api/results/unsettled-selections?limit=${limit}&offset=${offset}&q=${encodeURIComponent(qText)}&reason=${encodeURIComponent(reason)}`
      ),
    staleTime: 10_000,
  });

  const settleFixture = useMutation({
    mutationFn: (fixtureId: string) => apiRequest(`/api/admin/results/settle-fixture/${fixtureId}`, { method: "POST" }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["results-unsettled-selections"] });
      await qc.invalidateQueries({ queryKey: ["results-unsettled-betslips"] });
    },
  });

  const settleSlip = useMutation({
    mutationFn: (betSlipId: string) => apiRequest(`/api/admin/betslips/${betSlipId}/settle`, { method: "POST" }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["results-unsettled-selections"] });
      await qc.invalidateQueries({ queryKey: ["results-unsettled-betslips"] });
      await qc.invalidateQueries({ queryKey: ["results-list"] });
    },
  });

  const fetchStats = useMutation({
    mutationFn: (fixtureId: string) => apiRequest(`/api/admin/fixtures/${fixtureId}/fetch-statistics`, { method: "POST" }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["results-unsettled-selections"] });
    },
  });

  const rows = (q.data?.rows || []) as Row[];
  const count = q.data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(count / limit));

  const reasonOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) if (r.settlementReason) set.add(r.settlementReason);
    return Array.from(set).sort();
  }, [rows]);

  const summary = useMemo(() => {
    const byReason: Record<string, number> = {};
    for (const r of rows) {
      const k = r.settlementReason || "NO_REASON";
      byReason[k] = (byReason[k] || 0) + 1;
    }
    const top = Object.entries(byReason)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    return { top };
  }, [rows]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Unsettled <span className="text-lime-400">Markets</span>
          </h1>
          <p className="text-zinc-400 mt-1">
            Pending selections where the fixture is finished. Use the reason column to decide what to fetch/re-run.
          </p>
          <div className="text-xs text-zinc-500 mt-2">
            Page {page} / {totalPages} · Showing {rows.length} · Total: {count}
            {summary.top.length ? (
              <>
                {" "}
                · Top reasons:{" "}
                {summary.top.map(([k, v]) => (
                  <span key={k} className="mr-2">
                    {k}:{v}
                  </span>
                ))}
              </>
            ) : null}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => q.refetch()} className="border-zinc-700 text-zinc-200 hover:bg-zinc-800">
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={qText}
          onChange={(e) => {
            setPage(1);
            setQText(e.target.value);
          }}
          placeholder="Search slip/fixture/team/market/outcome..."
          className="w-full md:w-[420px] h-10 rounded-xl bg-zinc-950 border border-zinc-800 px-3 text-sm text-zinc-200 outline-none focus:border-lime-400/50"
        />
        <select
          value={reason}
          onChange={(e) => {
            setPage(1);
            setReason(e.target.value);
          }}
          className="h-10 rounded-xl bg-zinc-950 border border-zinc-800 px-3 text-sm text-zinc-200 outline-none focus:border-lime-400/50"
        >
          <option value="">All reasons</option>
          {reasonOptions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <Button
          variant="outline"
          onClick={() => {
            setQText("");
            setReason("");
            setPage(1);
          }}
          className="border-zinc-700 text-zinc-200 hover:bg-zinc-800"
        >
          Clear
        </Button>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900/60 text-zinc-400">
              <tr>
                <th className="text-left px-4 py-3">Fixture</th>
                <th className="text-left px-4 py-3">Market</th>
                <th className="text-left px-4 py-3">Outcome</th>
                <th className="text-left px-4 py-3">Reason</th>
                <th className="text-left px-4 py-3">External Sync</th>
                <th className="text-left px-4 py-3">Slip</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {q.isLoading ? (
                <tr>
                  <td className="px-4 py-8 text-zinc-500" colSpan={7}>
                    Loading...
                  </td>
                </tr>
              ) : rows.length ? (
                rows.map((r) => (
                  <tr key={r.betSelectionId} className="hover:bg-white/[0.02] align-top">
                    <td className="px-4 py-3 text-zinc-200">
                      <div className="font-medium">
                        {r.homeTeam || "Home"} v {r.awayTeam || "Away"}
                      </div>
                      <div className="text-xs text-zinc-500 font-mono">{r.fixtureId}</div>
                      <div className="text-xs text-zinc-500">{fmtDt(r.startsAt)}</div>
                    </td>
                    <td className="px-4 py-3 text-zinc-200">
                      <div className="font-medium">{r.marketName}</div>
                      <div className="text-xs text-zinc-500 font-mono">{r.marketKey}</div>
                    </td>
                    <td className="px-4 py-3 text-zinc-200">
                      <div className="font-medium">{r.outcomeName}</div>
                      <div className="text-xs text-zinc-500 font-mono">{r.outcomeKey || "-"}</div>
                    </td>
                    <td className="px-4 py-3 text-zinc-200">{r.settlementReason || "-"}</td>
                    <td className="px-4 py-3 text-zinc-300">{fmtDt(r.externalSyncedAt)}</td>
                    <td className="px-4 py-3 text-zinc-200">
                      <div className="text-xs text-zinc-400">{fmtDt(r.placedAt)}</div>
                      <div className="text-xs text-zinc-500 font-mono">{r.betSlipId}</div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          className="border-zinc-700 text-zinc-200 hover:bg-zinc-800"
                          disabled={fetchStats.isPending}
                          onClick={() => fetchStats.mutate(r.fixtureId)}
                        >
                          Fetch Stats
                        </Button>
                        <Button
                          className="bg-lime-400 text-black hover:bg-lime-300"
                          disabled={settleFixture.isPending}
                          onClick={() => settleFixture.mutate(r.fixtureId)}
                        >
                          Re-settle
                        </Button>
                        <Button
                          variant="outline"
                          className="border-zinc-700 text-zinc-200 hover:bg-zinc-800"
                          disabled={settleSlip.isPending}
                          onClick={() => settleSlip.mutate(r.betSlipId)}
                        >
                          Settle Slip
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-10 text-zinc-500 text-center" colSpan={7}>
                    No unsettled markets found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/40">
          <div className="text-xs text-zinc-500">Total: {count}</div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="border-zinc-700 text-zinc-200 hover:bg-zinc-800"
            >
              Prev
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="border-zinc-700 text-zinc-200 hover:bg-zinc-800"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

