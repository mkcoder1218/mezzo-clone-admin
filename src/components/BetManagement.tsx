import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, CheckCircle2, ChevronDown, ChevronRight, Receipt, Search } from "lucide-react";
import { UserRole, MOCK_SHOPS } from "../types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "../lib/apiClient";

type AdminBetsResp = { count: number; rows: any[] };

export const BetManagementPage = ({ role }: { role: UserRole }) => {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [resultFilter, setResultFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "online" | "shop">("all");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const CURRENT_USER_ID = "admin-user"; // placeholder for legacy filtering

  const listQuery = useQuery({
    queryKey: ["admin-bets", page, q, resultFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("limit", "25");
      params.set("offset", String((page - 1) * 25));
      if (q.trim()) params.set("q", q.trim());
      if (resultFilter !== "all") params.set("result", resultFilter);
      return apiRequest<AdminBetsResp>(`/api/admin/bets?${params.toString()}`);
    },
    staleTime: 5_000,
  });

  const redeemMutation = useMutation({
    mutationFn: async (betSlipId: string) => apiRequest(`/api/admin/betslips/${betSlipId}/redeem`, { method: "POST" }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin-bets"] });
    },
  });

  const rows = useMemo(() => {
    const raw = Array.isArray(listQuery.data?.rows) ? listQuery.data!.rows : [];
    const mapped = raw.map((slip: any) => {
      const id = String(slip.id || "");
      const stake = Number(slip.stake || 0);
      const potentialPayout = Number(slip.potentialPayout || 0);
      const payout = Number(slip.payout || 0);
      return {
        id,
        userId: slip.userId ? String(slip.userId) : null,
        cashierId: slip.cashierId ? String(slip.cashierId) : null,
        isOnline: !slip.cashierId,
        status: String(slip.status || ""),
        result: String(slip.result || "pending"),
        stake,
        potentialPayout,
        payout,
        paidAt: slip.paidAt ? String(slip.paidAt) : null,
        placedAt: slip.placedAt || slip.createdAt,
        selections: Array.isArray(slip.BetSelections) ? slip.BetSelections : [],
      };
    });

    let result = mapped;
    if (typeFilter === "online") result = result.filter((b) => b.isOnline);
    else if (typeFilter === "shop") result = result.filter((b) => !b.isOnline);

    if (role === "AGENT") {
      const agentShopIds = MOCK_SHOPS.filter((s) => s.agentId === CURRENT_USER_ID).map((s) => s.id);
      result = result.filter((b) => (b.cashierId ? agentShopIds.includes(b.cashierId) : true));
    } else if (role === "SHOP_OWNER") {
      const ownedShopId = MOCK_SHOPS.find((s) => s.ownerId === CURRENT_USER_ID)?.id;
      result = result.filter((b) => (b.cashierId ? b.cashierId === ownedShopId : true));
    }

    return result;
  }, [CURRENT_USER_ID, listQuery.data?.rows, role, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(Number(listQuery.data?.count || 0) / 25));

  const selectedIds = useMemo(() => Object.entries(selected).filter(([, v]) => v).map(([k]) => k), [selected]);
  const bulkRedeem = async () => {
    for (const id of selectedIds) {
      // eslint-disable-next-line no-await-in-loop
      await redeemMutation.mutateAsync(id);
    }
    setSelected({});
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-white">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-white uppercase italic">
            Bet <span className="text-brand">Explorer</span>
          </h1>
          <p className="text-zinc-400 mt-1">Placed bets table with selections and redeem tools.</p>
        </div>
        <div className="flex gap-2">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-1 flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className={`text-[10px] uppercase font-bold px-4 h-9 ${typeFilter === "all" ? "bg-zinc-800 text-white shadow-inner" : "text-zinc-500 hover:text-white"}`}
              onClick={() => setTypeFilter("all")}
            >
              ALL
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`text-[10px] uppercase font-bold px-4 h-9 ${typeFilter === "online" ? "bg-zinc-800 text-white shadow-inner" : "text-zinc-500 hover:text-white"}`}
              onClick={() => setTypeFilter("online")}
            >
              ONLINE
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`text-[10px] uppercase font-bold px-4 h-9 ${typeFilter === "shop" ? "bg-zinc-800 text-white shadow-inner" : "text-zinc-500 hover:text-white"}`}
              onClick={() => setTypeFilter("shop")}
            >
              SHOP
            </Button>
          </div>
          <Button variant="outline" className="border-zinc-800 text-zinc-400 rounded-xl h-11 hover:bg-zinc-800/50 font-bold text-[10px] uppercase">
            <Calendar className="w-4 h-4 mr-2" /> DATE RANGE
          </Button>
          <Button
            disabled={!selectedIds.length || redeemMutation.isPending}
            onClick={bulkRedeem}
            className="bg-brand text-black hover:bg-brand/90 rounded-xl h-11 font-bold text-[10px] uppercase"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" /> REDEEM SELECTED ({selectedIds.length})
          </Button>
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-4 items-center bg-[#1A1A1A] p-4 rounded-2xl border border-zinc-800/50">
        <div className="relative flex-1 w-full font-sans">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
          <Input
            value={q}
            onChange={(e) => {
              setPage(1);
              setQ(e.target.value);
            }}
            className="pl-12 bg-zinc-900 border-zinc-800 focus-visible:ring-brand h-12 text-sm rounded-xl text-white"
            placeholder="Search by Ticket ID, User ID or Cashier ID..."
          />
        </div>
        <div className="flex gap-4 w-full md:w-auto font-sans">
          <Select value={resultFilter} onValueChange={setResultFilter}>
            <SelectTrigger className="bg-zinc-900 border-zinc-800 h-12 w-[160px] rounded-xl text-white">
              <SelectValue placeholder="Result" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
              <SelectItem value="all">All Results</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="won">Won</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
              <SelectItem value="void">Void</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="bg-[#1A1A1A] border-zinc-800/50 overflow-hidden">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-zinc-400" />
            </div>
            <div>
              <CardTitle className="text-white">Bets</CardTitle>
              <CardDescription className="text-zinc-400">Expand rows to view selections.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-900/60 border-b border-zinc-800">
                <tr className="text-left text-[10px] uppercase tracking-widest text-zinc-500">
                  <th className="px-4 py-3 w-10"></th>
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={rows.length > 0 && rows.every((r) => selected[r.id])}
                      onChange={(e) => {
                        const next: Record<string, boolean> = {};
                        for (const r of rows) next[r.id] = Boolean(e.target.checked);
                        setSelected(next);
                      }}
                    />
                  </th>
                  <th className="px-4 py-3">Ticket</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Result</th>
                  <th className="px-4 py-3">Stake</th>
                  <th className="px-4 py-3">Payout</th>
                  <th className="px-4 py-3">Paid</th>
                  <th className="px-4 py-3">Placed</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {listQuery.isLoading ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-6 text-zinc-500">
                      Loading…
                    </td>
                  </tr>
                ) : rows.length ? (
                  rows.map((r) => {
                    const isExpanded = Boolean(expanded[r.id]);
                    const isPaid = Boolean(r.paidAt);
                    const canRedeem = !isPaid && r.result === "won" && (r.status === "settled" || r.status === "placed");
                    return (
                      <>
                        <tr key={r.id} className="border-b border-zinc-800/60 hover:bg-zinc-900/30">
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              className="text-zinc-500 hover:text-white"
                              onClick={() => setExpanded((m) => ({ ...m, [r.id]: !m[r.id] }))}
                            >
                              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <input type="checkbox" checked={Boolean(selected[r.id])} onChange={(e) => setSelected((m) => ({ ...m, [r.id]: Boolean(e.target.checked) }))} />
                          </td>
                          <td className="px-4 py-3 font-bold text-white">#{r.id.toUpperCase()}</td>
                          <td className="px-4 py-3">
                            {r.isOnline ? (
                              <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                                ONLINE
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                                SHOP
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Badge className="bg-zinc-800 text-zinc-300 border-zinc-700">{r.status}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              className={
                                r.result === "won"
                                  ? "bg-emerald-500 text-black"
                                  : r.result === "pending"
                                    ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                    : "bg-zinc-800 text-zinc-300 border-zinc-700"
                              }
                            >
                              {r.result}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-white">{Number(r.stake || 0).toFixed(2)}</td>
                          <td className="px-4 py-3 text-white">{Number(r.payout || r.potentialPayout || 0).toFixed(2)}</td>
                          <td className="px-4 py-3">
                            {isPaid ? <Badge className="bg-emerald-500 text-black">PAID</Badge> : <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">UNPAID</Badge>}
                          </td>
                          <td className="px-4 py-3 text-zinc-400">{r.placedAt ? new Date(r.placedAt).toLocaleString() : "—"}</td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              disabled={!canRedeem || redeemMutation.isPending}
                              onClick={() => redeemMutation.mutate(r.id)}
                              className="bg-brand text-black hover:bg-brand/90 rounded-xl font-bold text-[10px] uppercase"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" /> Redeem
                            </Button>
                          </td>
                        </tr>
                        {isExpanded ? (
                          <tr key={r.id + ":expanded"} className="bg-zinc-900/20 border-b border-zinc-800/60">
                            <td colSpan={11} className="px-6 py-4">
                              <div className="text-xs text-zinc-400 mb-2">Selections</div>
                              <div className="space-y-2">
                                {r.selections.map((s: any) => (
                                  <div key={String(s.id)} className="flex flex-col md:flex-row md:items-center gap-2 justify-between bg-zinc-950/40 border border-zinc-800/60 rounded-xl p-3">
                                    <div className="min-w-0">
                                      <div className="text-white font-bold truncate">{s?.Outcome?.name || "Selection"}</div>
                                      <div className="text-[11px] text-zinc-500 truncate">
                                        market: {s?.Outcome?.Market?.name || "—"} • fixture: {s?.Outcome?.Market?.Fixture?.id || "—"} • result: {s?.result || "pending"}
                                      </div>
                                    </div>
                                    <div className="text-zinc-300 text-xs">odds: {Number(s?.oddsAtPlacement || 0).toFixed(3)}</div>
                                  </div>
                                ))}
                                {!r.selections.length ? <div className="text-zinc-500">No selections.</div> : null}
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={11} className="px-4 py-6 text-zinc-500">
                      No bets found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
          variant="outline"
          className="border-zinc-800 text-zinc-400 rounded-xl h-11 hover:bg-zinc-800/50 font-bold text-[10px] uppercase"
        >
          Prev
        </Button>
        <Button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
          variant="outline"
          className="border-zinc-800 text-zinc-400 rounded-xl h-11 hover:bg-zinc-800/50 font-bold text-[10px] uppercase"
        >
          Next
        </Button>
      </div>
    </div>
  );
};

