import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "../lib/apiClient";
import type { UserRole } from "../types";

type CashflowRow = {
  id: string;
  displayName: string;
  login: string | null;
  initialLimit: number;
  currentLimit: number;
  generated: number;
  commissionPercent: number | null;
  income: number;
};

function money(v: any) {
  const n = Number(v || 0);
  return Number.isFinite(n) ? n.toFixed(2) : "0.00";
}

export function CashflowPage({ role }: { role: UserRole }) {
  const isSuperAdmin = role === "SUPER_ADMIN";

  const q = useQuery({
    queryKey: ["cashflow", isSuperAdmin ? "agents" : "cashiers"],
    queryFn: () =>
      apiRequest<{ rows: CashflowRow[] }>(isSuperAdmin ? "/api/cashflow/agents" : "/api/cashflow/cashiers"),
    staleTime: 10_000,
  });

  const rows = q.data?.rows || [];
  const title = isSuperAdmin ? "Agent Cashflow" : "Cashier Cashflow";
  const desc = isSuperAdmin
    ? "Income and performance per agent (commission based)."
    : "Income and performance per cashier under you (commission based).";

  const totals = useMemo(() => {
    const totalGenerated = rows.reduce((a, r) => a + Number(r.generated || 0), 0);
    const totalIncome = rows.reduce((a, r) => a + Number(r.income || 0), 0);
    return { totalGenerated, totalIncome };
  }, [rows]);

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white uppercase italic">{title}</h1>
          <p className="text-zinc-400 mt-1">{desc}</p>
        </div>
        <Badge variant="outline" className="bg-brand/10 text-brand border-brand/20 h-8 px-4 font-bold uppercase tracking-widest text-[10px]">
          {role.replace("_", " ")} VIEW
        </Badge>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-[#1A1A1A] border-zinc-800">
          <CardHeader>
            <CardDescription>Total Generated</CardDescription>
            <CardTitle className="text-3xl text-white">{money(totals.totalGenerated)}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-[#1A1A1A] border-zinc-800">
          <CardHeader>
            <CardDescription>Total Income</CardDescription>
            <CardTitle className="text-3xl text-white">{money(totals.totalIncome)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="bg-[#1A1A1A] border-zinc-800">
        <CardHeader>
          <CardTitle>{isSuperAdmin ? "Agents" : "Cashiers"}</CardTitle>
          <CardDescription>
            {q.isFetching ? "Refreshing…" : `${rows.length} rows`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {q.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full bg-zinc-900/40" />
              ))}
            </div>
          ) : q.isError ? (
            <div className="text-sm text-rose-300">Failed to load cashflow.</div>
          ) : (
            <Table className="text-zinc-200">
              <TableHeader>
                <TableRow className="border-zinc-800">
                  <TableHead className="text-zinc-400">{isSuperAdmin ? "Agent" : "Cashier"}</TableHead>
                  <TableHead className="text-zinc-400">Initial Limit</TableHead>
                  <TableHead className="text-zinc-400">Current Limit</TableHead>
                  <TableHead className="text-zinc-400">Generated</TableHead>
                  <TableHead className="text-zinc-400">%</TableHead>
                  <TableHead className="text-zinc-400 text-right">Income</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id} className="border-zinc-900">
                    <TableCell className="text-white">
                      <div className="flex flex-col">
                        <span className="font-bold">{r.displayName}</span>
                        {r.login ? <span className="text-[10px] text-zinc-500">{r.login}</span> : null}
                      </div>
                    </TableCell>
                    <TableCell>{money(r.initialLimit)}</TableCell>
                    <TableCell>{money(r.currentLimit)}</TableCell>
                    <TableCell className="text-brand">{money(r.generated)}</TableCell>
                    <TableCell>{r.commissionPercent === null ? "—" : `${money(r.commissionPercent)}%`}</TableCell>
                    <TableCell className="text-right font-bold">{money(r.income)}</TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 ? (
                  <TableRow className="border-zinc-900">
                    <TableCell colSpan={6} className="text-zinc-400 py-8 text-center">
                      No data.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

