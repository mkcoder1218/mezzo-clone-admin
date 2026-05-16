import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Receipt, Search, CheckCircle2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { apiRequest } from "../lib/apiClient";

type AdminBetsResp = { count: number; rows: any[] };

export function RedeemTicketsPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [showPaid, setShowPaid] = useState(false);

  const listQuery = useQuery({
    queryKey: ["admin-bets-redeem", q],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("limit", "200");
      params.set("offset", "0");
      params.set("result", "won");
      // Include placed as well so operators can see "won" tickets even if not fully settled yet.
      params.set("status", "");
      if (q.trim()) params.set("q", q.trim());
      return apiRequest<AdminBetsResp>(`/api/admin/bets?${params.toString()}`);
    },
    staleTime: 10_000,
  });

  const redeemMutation = useMutation({
    mutationFn: async (betSlipId: string) => apiRequest(`/api/admin/betslips/${betSlipId}/redeem`, { method: "POST" }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin-bets-redeem"] });
      await qc.invalidateQueries({ queryKey: ["admin-bets"] });
    },
  });

  const rows = useMemo(() => {
    const raw = Array.isArray(listQuery.data?.rows) ? listQuery.data!.rows : [];
    const filtered = showPaid ? raw : raw.filter((r) => !r?.paidAt);
    return filtered;
  }, [listQuery.data?.rows, showPaid]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-white">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-white uppercase italic">
            Redeem <span className="text-brand">Tickets</span>
          </h1>
          <p className="text-zinc-400 mt-1">Pay out already-created winning betslips (cashier/shop tickets).</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-zinc-800 text-zinc-400 rounded-xl h-11 hover:bg-zinc-800/50 font-bold text-[10px] uppercase"
            onClick={() => setShowPaid((v) => !v)}
          >
            {showPaid ? "HIDE PAID" : "SHOW PAID"}
          </Button>
          <Button
            variant="outline"
            className="border-zinc-800 text-zinc-400 rounded-xl h-11 hover:bg-zinc-800/50 font-bold text-[10px] uppercase"
            onClick={() => listQuery.refetch()}
          >
            <RefreshCw className="w-4 h-4 mr-2" /> REFRESH
          </Button>
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-4 items-center bg-[#1A1A1A] p-4 rounded-2xl border border-zinc-800/50">
        <div className="relative flex-1 w-full font-sans">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-12 bg-zinc-900 border-zinc-800 focus-visible:ring-brand h-12 text-sm rounded-xl text-white"
            placeholder="Search by slip id / user id / cashier id..."
          />
        </div>
      </div>

      <Card className="bg-[#1A1A1A] border-zinc-800/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-zinc-400" />
            </div>
            <div>
              <CardTitle className="text-white">Winning Tickets</CardTitle>
              <CardDescription className="text-zinc-400">Shows betslips with result = won. Toggle to include paid tickets.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {listQuery.isLoading ? (
            <div className="text-zinc-500">Loading…</div>
          ) : rows.length ? (
            rows.map((slip) => {
              const id = String(slip.id || "");
              const isPaid = Boolean(slip.paidAt);
              const canRedeem = !isPaid && String(slip.result) === "won";
              const payout = Number(slip.payout || slip.potentialPayout || 0);
              return (
                <div key={id} className="flex flex-col md:flex-row md:items-center gap-3 justify-between bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-bold text-white truncate">#{id.toUpperCase()}</div>
                      <Badge className={isPaid ? "bg-emerald-500 text-black" : "bg-amber-500/10 text-amber-500 border-amber-500/20"}>
                        {isPaid ? "PAID" : "UNPAID"}
                      </Badge>
                      {slip.cashierId ? (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">SHOP</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">ONLINE</Badge>
                      )}
                    </div>
                    <div className="text-xs text-zinc-500 mt-1 truncate">
                      userId: {slip.userId || "—"} • cashierId: {slip.cashierId || "—"} • payout: {Number.isFinite(payout) ? payout.toFixed(2) : "0.00"}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      disabled={!canRedeem || redeemMutation.isPending}
                      onClick={() => redeemMutation.mutate(id)}
                      className="bg-brand text-black hover:bg-brand/90 rounded-xl font-bold text-[10px] uppercase"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" /> REDEEM
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-zinc-500">No matching tickets.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

