import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronRight, RefreshCcw } from "lucide-react";
import { apiRequest } from "../lib/apiClient";

type AdminBetsResp = { count: number; rows: any[] };

export function BetQueuePage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const limit = 25;
  const offset = (page - 1) * limit;

  const listPending = useQuery({
    queryKey: ["bet-queue", "pending", page, q],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("limit", String(limit));
      params.set("offset", String(offset));
      params.set("result", "pending");
      if (q.trim()) params.set("q", q.trim());
      return apiRequest<AdminBetsResp>(`/api/admin/bets?${params.toString()}`);
    },
    staleTime: 5_000,
  });

  const listManualReview = useQuery({
    queryKey: ["bet-queue", "manual_review", page, q],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("limit", String(limit));
      params.set("offset", String(offset));
      params.set("result", "manual_review");
      if (q.trim()) params.set("q", q.trim());
      return apiRequest<AdminBetsResp>(`/api/admin/bets?${params.toString()}`);
    },
    staleTime: 5_000,
  });

  const listWonUnpaid = useQuery({
    queryKey: ["bet-queue", "won_unpaid", page, q],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("limit", String(limit));
      params.set("offset", String(offset));
      params.set("result", "won");
      params.set("status", "settled");
      if (q.trim()) params.set("q", q.trim());
      return apiRequest<AdminBetsResp>(`/api/admin/bets?${params.toString()}`);
    },
    staleTime: 5_000,
  });

  const recheckSlip = useMutation({
    mutationFn: async (betSlipId: string) => apiRequest(`/api/admin/betslips/${betSlipId}/recheck`, { method: "POST" }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["bet-queue"] });
      await qc.invalidateQueries({ queryKey: ["admin-bets"] });
    },
  });

  const redeemSlip = useMutation({
    mutationFn: async (betSlipId: string) => apiRequest(`/api/admin/betslips/${betSlipId}/redeem`, { method: "POST" }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["bet-queue"] });
      await qc.invalidateQueries({ queryKey: ["admin-bets"] });
    },
  });

  const rows = useMemo(() => {
    const merged = [
      ...(Array.isArray(listPending.data?.rows) ? listPending.data!.rows : []),
      ...(Array.isArray(listManualReview.data?.rows) ? listManualReview.data!.rows : []),
      ...(Array.isArray(listWonUnpaid.data?.rows) ? listWonUnpaid.data!.rows : []),
    ];

    const seen = new Set<string>();
    const unique = merged.filter((s: any) => {
      const id = String(s?.id || "");
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    return unique.map((slip: any) => ({
        id: String(slip.id || ""),
        status: String(slip.status || ""),
        result: String(slip.result || "pending"),
        stake: Number(slip.stake || 0),
        potentialPayout: Number(slip.potentialPayout || 0),
        payout: Number(slip.payout || 0),
        paidAt: slip.paidAt ? String(slip.paidAt) : null,
        placedAt: slip.placedAt || slip.createdAt,
        user: slip.User || null,
        selections: Array.isArray(slip.BetSelections) ? slip.BetSelections : [],
        raw: slip,
      }));
  }, [listManualReview.data?.rows, listPending.data?.rows, listWonUnpaid.data?.rows]);

  const totalPages = Math.max(
    1,
    Math.max(
      Math.ceil(Number(listPending.data?.count || 0) / limit),
      Math.ceil(Number(listManualReview.data?.count || 0) / limit),
      Math.ceil(Number(listWonUnpaid.data?.count || 0) / limit),
    )
  );

  const isLoading = listPending.isLoading || listManualReview.isLoading || listWonUnpaid.isLoading;
  const isFetching = listPending.isFetching || listManualReview.isFetching || listWonUnpaid.isFetching;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-white">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold font-display tracking-tight text-white uppercase italic">
          Bet <span className="text-brand">Queue</span>
        </h1>
        <p className="text-zinc-400">
          Pending and manual-review tickets in one place. Use Recheck to rerun settlement, and Redeem for winning slips.
        </p>
      </header>

      <Card className="bg-[#1A1A1A] border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-3">
            <span>Tickets</span>
            <div className="flex items-center gap-2">
              <Input
                value={q}
                onChange={(e) => {
                  setPage(1);
                  setQ(e.target.value);
                }}
                placeholder="Search (user/league/team/slip id)"
                className="w-[360px]"
              />
              <Button onClick={() => { listPending.refetch(); listManualReview.refetch(); listWonUnpaid.refetch(); }} className="bg-zinc-800 hover:bg-zinc-700" disabled={isFetching}>
                <RefreshCcw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardTitle>
          <CardDescription>Showing {rows.length} queued slips on this page. Total pages: {totalPages}.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto max-h-[520px]">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-zinc-400 border-b border-zinc-800">
                  <th className="py-2 pr-3">Slip</th>
                  <th className="py-2 pr-3">User</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Result</th>
                  <th className="py-2 pr-3">Stake</th>
                  <th className="py-2 pr-3">Potential</th>
                  <th className="py-2 pr-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-zinc-500 text-sm">
                      Loading...
                    </td>
                  </tr>
                ) : rows.length ? (
                  rows.flatMap((r: any) => {
                    const isExpanded = Boolean(expanded[r.id]);
                    const toggle = () => setExpanded((s) => ({ ...s, [r.id]: !s[r.id] }));
                    const userLabel = r.user?.displayName || r.user?.phoneNumber || (r.user?.id ? String(r.user.id).slice(0, 8) : "-");
                    const canRedeem = r.result === "won" && !r.paidAt;

                    return [
                      <tr key={r.id} className="border-b border-zinc-900">
                        <td className="py-2 pr-3">
                          <button type="button" onClick={toggle} className="inline-flex items-center gap-2 hover:text-white">
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            <span className="font-mono text-xs">{r.id.slice(0, 8)}</span>
                          </button>
                        </td>
                        <td className="py-2 pr-3 text-zinc-200">{userLabel}</td>
                        <td className="py-2 pr-3 text-zinc-200">{r.status}</td>
                        <td className="py-2 pr-3">
                          <Badge className={r.result === "manual_review" ? "bg-amber-700" : "bg-zinc-700"}>{r.result}</Badge>
                        </td>
                        <td className="py-2 pr-3 text-zinc-200">{r.stake.toFixed(2)}</td>
                        <td className="py-2 pr-3 text-zinc-200">{r.potentialPayout ? r.potentialPayout.toFixed(2) : "-"}</td>
                        <td className="py-2 pr-3">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="bg-zinc-800 hover:bg-zinc-700"
                              onClick={() => recheckSlip.mutate(r.id)}
                              disabled={recheckSlip.isPending}
                            >
                              Recheck
                            </Button>
                            <Button
                              size="sm"
                              className="bg-brand text-black hover:bg-brand/90"
                              onClick={() => redeemSlip.mutate(r.id)}
                              disabled={redeemSlip.isPending || !canRedeem}
                              title={!canRedeem ? "Redeem is only allowed for winning, unpaid tickets." : "Redeem winning ticket"}
                            >
                              Redeem
                            </Button>
                          </div>
                        </td>
                      </tr>,
                      ...(isExpanded
                        ? [
                            <tr key={`${r.id}__details`} className="border-b border-zinc-900">
                              <td colSpan={7} className="py-3">
                                <pre className="text-xs bg-zinc-950/40 border border-zinc-800/60 rounded-xl p-4 overflow-auto max-h-[300px]">
                                  {JSON.stringify(r.raw, null, 2)}
                                </pre>
                              </td>
                            </tr>,
                          ]
                        : []),
                    ];
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-zinc-500 text-sm">
                      No pending/manual-review slips on this page.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4">
            <Button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="bg-zinc-800 hover:bg-zinc-700">
              Prev
            </Button>
            <Button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="bg-zinc-800 hover:bg-zinc-700"
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
