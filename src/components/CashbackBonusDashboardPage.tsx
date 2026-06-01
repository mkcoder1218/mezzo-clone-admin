import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cashbackBonusApi } from "../modules/cashbackBonus/api";
import { Button } from "@/components/ui/button";

export function CashbackBonusDashboardPage() {
  const q = useQuery({ queryKey: ["cashback-bonus", "stats"], queryFn: () => cashbackBonusApi.stats() });

  if (q.isLoading) {
    return (
      <div className="space-y-6 text-white">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (q.isError) {
    return <div className="p-8 text-zinc-400">Failed to load cashback stats.</div>;
  }

  const s = q.data;
  const recent = Array.isArray(s.recentTransactions) ? s.recentTransactions : [];

  const statCards = [
    { label: "Total Credited", value: s.totalCredited },
    { label: "Credited Today", value: s.creditedToday },
    { label: "Rewarded Slips", value: String(s.rewardedSlipCount) },
    { label: "Average Amount", value: s.averageCashbackAmount },
    { label: "One-Loss Count", value: String(s.oneLossRewardedSlipCount) },
    { label: "Two-Loss Count", value: String(s.twoLossRewardedSlipCount) },
    { label: "Rejected", value: String(s.rejectedCount) },
    { label: "Failed", value: String(s.failedProcessingCount) },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-white">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-white uppercase italic">
            Cashback <span className="text-brand">Bonus</span>
          </h1>
          <p className="text-zinc-400 mt-1">King5 cashback bonus performance and recent activity.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/cashback/configurations"><Button className="bg-zinc-900 border border-zinc-800 text-white hover:bg-zinc-800 rounded-xl">Configurations</Button></Link>
          <Link to="/cashback/history"><Button className="bg-brand text-black hover:bg-brand/90 rounded-xl font-bold">History</Button></Link>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statCards.map((c) => (
          <Card key={c.label} className="bg-[#1A1A1A] border-zinc-800/50">
            <CardHeader className="pb-2">
              <CardDescription className="text-zinc-400">{c.label}</CardDescription>
              <CardTitle className="text-white text-2xl">{c.value}</CardTitle>
            </CardHeader>
            <CardContent />
          </Card>
        ))}
      </div>

      <Card className="bg-[#1A1A1A] border-zinc-800/50">
        <CardHeader>
          <CardTitle className="text-white">Recent Cashback Transactions</CardTitle>
          <CardDescription className="text-zinc-400">Latest 10 transactions.</CardDescription>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <div className="text-zinc-500">No recent transactions.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Slip</TableHead>
                  <TableHead>Offer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-zinc-300">{new Date(r.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="font-mono text-xs text-zinc-300">{r.betSlipId}</TableCell>
                    <TableCell className="text-zinc-300">{r.offerCode || "-"}</TableCell>
                    <TableCell className="text-zinc-300">{r.status}</TableCell>
                    <TableCell className="text-right text-zinc-300">{r.creditedAmount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

