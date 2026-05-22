import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/apiClient";
import { Button } from "@/components/ui/button";

type Row = {
  betSlipId: string;
  betSlipStatus: string;
  betSlipResult: string;
  stake: string | number | null;
  potentialPayout: string | number | null;
  payout: string | number | null;
  userId: string | null;
  cashierId: string | null;
  placedAt: string | null;
  settledAt: string | null;
  paidAt: string | null;
  pendingSelections: number;
  finishedFixtures: number;
  notFinishedFixtures: number;
  lastStartsAt: string | null;
};

type Resp = { limit: number; offset: number; count: number; rows: Row[] };

export function ResultsUnsettledPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const limit = 50;
  const offset = (page - 1) * limit;

  const q = useQuery({
    queryKey: ["results-unsettled-betslips", { page }],
    queryFn: () => apiRequest<Resp>(`/api/results/unsettled-betslips?limit=${limit}&offset=${offset}`),
    staleTime: 15_000,
  });

  const runWorker = useMutation({
    mutationFn: () => apiRequest("/api/results/worker-run", { method: "POST" }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["results-unsettled-betslips"] });
      await qc.invalidateQueries({ queryKey: ["results-list"] });
    },
  });

  const rows = (q.data?.rows || []) as Row[];
  const count = q.data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(count / limit));

  const summary = useMemo(() => {
    const pending = rows.filter((r) => r.betSlipResult === "pending").length;
    const unpaid = rows.filter((r) => r.betSlipStatus === "settled" && !r.paidAt).length;
    return { pending, unpaid };
  }, [rows]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Unsettled <span className="text-lime-400">Slips</span>
          </h1>
          <p className="text-zinc-400 mt-1">
            Finished fixtures with pending selections, plus settled slips that are not paid yet.
          </p>
          <div className="text-xs text-zinc-500 mt-2">
            Page {page} / {totalPages} · Showing {rows.length} · Pending: {summary.pending} · Unpaid: {summary.unpaid}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => runWorker.mutate()}
            disabled={runWorker.isPending}
            className="bg-lime-400 text-black hover:bg-lime-300"
          >
            {runWorker.isPending ? "Running..." : "Run Worker Now"}
          </Button>
          <Button
            variant="outline"
            onClick={() => q.refetch()}
            className="border-zinc-700 text-zinc-200 hover:bg-zinc-800"
          >
            Refresh
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900/60 text-zinc-400">
              <tr>
                <th className="text-left px-4 py-3">Slip</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Result</th>
                <th className="text-right px-4 py-3">Stake</th>
                <th className="text-right px-4 py-3">Pending Sel.</th>
                <th className="text-right px-4 py-3">Finished Fx.</th>
                <th className="text-right px-4 py-3">Not Finished</th>
                <th className="text-left px-4 py-3">Last Start</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {q.isLoading ? (
                <tr>
                  <td className="px-4 py-8 text-zinc-500" colSpan={8}>
                    Loading...
                  </td>
                </tr>
              ) : rows.length ? (
                rows.map((r) => (
                  <tr key={r.betSlipId} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-mono text-xs text-zinc-200">{r.betSlipId}</td>
                    <td className="px-4 py-3 text-zinc-200">{r.betSlipStatus}</td>
                    <td className="px-4 py-3 text-zinc-200">{r.betSlipResult}</td>
                    <td className="px-4 py-3 text-right text-zinc-200">{r.stake ?? "-"}</td>
                    <td className="px-4 py-3 text-right text-zinc-200">{r.pendingSelections ?? 0}</td>
                    <td className="px-4 py-3 text-right text-zinc-200">{r.finishedFixtures ?? 0}</td>
                    <td className="px-4 py-3 text-right text-zinc-200">{r.notFinishedFixtures ?? 0}</td>
                    <td className="px-4 py-3 text-zinc-300">{r.lastStartsAt ? new Date(r.lastStartsAt).toLocaleString() : "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-10 text-zinc-500 text-center" colSpan={8}>
                    No unsettled slips found.
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

