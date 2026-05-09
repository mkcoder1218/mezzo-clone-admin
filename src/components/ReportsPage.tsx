import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiRequest } from "../lib/apiClient";

function todayYmd(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function money(v: any) {
  const n = Number(v || 0);
  return Number.isFinite(n) ? n.toFixed(2) : "0.00";
}

export function ReportsPage() {
  const [dtFrom, setDtFrom] = useState(todayYmd());
  const [dtTill, setDtTill] = useState(todayYmd());

  const summary = useQuery({
    queryKey: ["admin-reports-summary", { dtFrom, dtTill }],
    queryFn: () => apiRequest<{ byResult: Array<{ result: string; count: number; stakeSum: number; payoutSum: number }> }>(`/api/admin/reports/summary?dtFrom=${encodeURIComponent(dtFrom)}&dtTill=${encodeURIComponent(dtTill)}`),
    staleTime: 10_000
  });

  const rows = summary.data?.byResult || [];
  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        acc.count += Number(r.count || 0);
        acc.stakeSum += Number(r.stakeSum || 0);
        acc.payoutSum += Number(r.payoutSum || 0);
        return acc;
      },
      { count: 0, stakeSum: 0, payoutSum: 0 }
    );
  }, [rows]);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-display font-bold text-white uppercase italic">
          Reports <span className="text-brand">Summary</span>
        </h1>
        <p className="text-zinc-400">Aggregated ticket outcomes for the selected date window.</p>
      </header>

      <Card className="bg-[#1A1A1A] border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Date Range</span>
            <Badge className="bg-zinc-700">TICKETS</Badge>
          </CardTitle>
          <CardDescription>Filters apply to `placedAt`.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label className="text-xs text-zinc-400">From</label>
            <Input value={dtFrom} onChange={(e) => setDtFrom(e.target.value)} type="date" className="w-[180px]" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-zinc-400">Till</label>
            <Input value={dtTill} onChange={(e) => setDtTill(e.target.value)} type="date" className="w-[180px]" />
          </div>
          <Button onClick={() => summary.refetch()} disabled={summary.isFetching} className="bg-zinc-800 hover:bg-zinc-700">
            {summary.isFetching ? "Refreshing..." : "Refresh"}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-[#1A1A1A] border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Outcome Breakdown</span>
            <Badge className="bg-brand text-black">TOTAL {totals.count}</Badge>
          </CardTitle>
          <CardDescription>Total stake: {money(totals.stakeSum)} • Total payout: {money(totals.payoutSum)}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-zinc-400 border-b border-zinc-800">
                  <th className="py-2 pr-3">Result</th>
                  <th className="py-2 pr-3">Count</th>
                  <th className="py-2 pr-3">Stake</th>
                  <th className="py-2 pr-3">Payout</th>
                </tr>
              </thead>
              <tbody>
                {summary.isLoading ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-zinc-500 text-sm">
                      Loading...
                    </td>
                  </tr>
                ) : rows.length ? (
                  rows.map((r) => (
                    <tr key={r.result} className="border-b border-zinc-900">
                      <td className="py-2 pr-3 text-white uppercase">{r.result}</td>
                      <td className="py-2 pr-3 text-zinc-200">{r.count}</td>
                      <td className="py-2 pr-3 text-zinc-200">{money(r.stakeSum)}</td>
                      <td className="py-2 pr-3 text-zinc-200">{money(r.payoutSum)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-zinc-500 text-sm">
                      No data for this range.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

