import { useMemo, useState } from "react";
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
  tickets: number;
  bets: number;
  payouts: number;
  unclaimed: number;
  generated: number;
  commissionPercent?: number | null;
  income?: number;
};

type CashflowFilters = {
  dtFrom: string | null;
  dtTill: string | null;
  userId: string | null;
};

function money(v: any) {
  const n = Number(v || 0);
  return Number.isFinite(n) ? n.toFixed(2) : "0.00";
}

function toYmdUtc(d: Date) {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function CashflowPage({ role }: { role: UserRole }) {
  const isSuperAdmin = role === "SUPER_ADMIN";

  const [datePreset, setDatePreset] = useState<
    "all" | "today" | "yesterday" | "last7" | "last30" | "thisMonth" | "lastMonth" | "custom"
  >("last7");
  const [customFrom, setCustomFrom] = useState<string>("");
  const [customTill, setCustomTill] = useState<string>("");
  const [userId, setUserId] = useState<string>("");

  const { dtFrom, dtTill } = useMemo(() => {
    const now = new Date();
    const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));

    const addDaysUtc = (d: Date, days: number) =>
      new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + days, 0, 0, 0, 0));

    const startOfMonthUtc = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0));
    const startOfPrevMonthUtc = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1, 0, 0, 0, 0));

    if (datePreset === "all") return { dtFrom: "", dtTill: "" };
    if (datePreset === "today") {
      const from = todayUtc;
      const till = todayUtc;
      return { dtFrom: toYmdUtc(from), dtTill: toYmdUtc(till) };
    }
    if (datePreset === "yesterday") {
      const from = addDaysUtc(todayUtc, -1);
      const till = from;
      return { dtFrom: toYmdUtc(from), dtTill: toYmdUtc(till) };
    }
    if (datePreset === "last7") {
      const till = todayUtc;
      const from = addDaysUtc(todayUtc, -6);
      return { dtFrom: toYmdUtc(from), dtTill: toYmdUtc(till) };
    }
    if (datePreset === "last30") {
      const till = todayUtc;
      const from = addDaysUtc(todayUtc, -29);
      return { dtFrom: toYmdUtc(from), dtTill: toYmdUtc(till) };
    }
    if (datePreset === "thisMonth") {
      const from = startOfMonthUtc(todayUtc);
      const till = todayUtc;
      return { dtFrom: toYmdUtc(from), dtTill: toYmdUtc(till) };
    }
    if (datePreset === "lastMonth") {
      const from = startOfPrevMonthUtc(todayUtc);
      const till = addDaysUtc(startOfMonthUtc(todayUtc), -1);
      return { dtFrom: toYmdUtc(from), dtTill: toYmdUtc(till) };
    }

    // custom
    const from = customFrom.trim();
    const till = customTill.trim();
    return { dtFrom: from, dtTill: till };
  }, [datePreset, customFrom, customTill]);

  const endpoint = isSuperAdmin ? "/api/cashflow/agents" : "/api/cashflow/cashiers";
  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (dtFrom) p.set("dtFrom", dtFrom);
    if (dtTill) p.set("dtTill", dtTill);
    if (userId) p.set("userId", userId);
    const s = p.toString();
    return s ? `?${s}` : "";
  }, [dtFrom, dtTill, userId]);

  const q = useQuery({
    queryKey: ["cashflow", isSuperAdmin ? "agents" : "cashiers", dtFrom, dtTill, userId],
    queryFn: () => apiRequest<{ rows: CashflowRow[]; filters?: CashflowFilters }>(`${endpoint}${qs}`),
    staleTime: 10_000,
  });

  const rows = q.data?.rows || [];
  const serverFilters = q.data?.filters;
  const title = isSuperAdmin ? "Agent Cashflow" : "Cashier Cashflow";
  const desc = isSuperAdmin
    ? "Performance per agent."
    : "Performance per cashier under you.";

  const totals = useMemo(() => {
    const totalTickets = rows.reduce((a, r) => a + Number(r.tickets || 0), 0);
    const totalBets = rows.reduce((a, r) => a + Number(r.bets || 0), 0);
    const totalPayouts = rows.reduce((a, r) => a + Number(r.payouts || 0), 0);
    const totalUnclaimed = rows.reduce((a, r) => a + Number(r.unclaimed || 0), 0);
    const totalGenerated = rows.reduce((a, r) => a + Number(r.generated || 0), 0);
    // Income/commission percentage will be handled by the calculator flow.
    // const totalIncome = rows.reduce((a, r) => a + Number(r.income || 0), 0);
    return { totalTickets, totalBets, totalPayouts, totalUnclaimed, totalGenerated };
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

      <Card className="bg-[#1A1A1A] border-zinc-800">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Date range and user{" "}
            <span className="text-zinc-500">
              (client: {dtFrom || "—"} → {dtTill || "—"}
              {serverFilters ? `, server: ${serverFilters.dtFrom || "—"} → ${serverFilters.dtTill || "—"}` : ""})
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Date Range</div>
              <select
                value={datePreset}
                onChange={(e) => setDatePreset(e.target.value as any)}
                className="w-full h-10 rounded-md bg-black/30 border border-zinc-800 px-3 text-zinc-200"
              >
                <option value="last7">Last 7 days</option>
                <option value="last30">Last 30 days</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="thisMonth">This month</option>
                <option value="lastMonth">Last month</option>
                <option value="all">All time</option>
                <option value="custom">Custom</option>
              </select>
            </label>
            <label className="space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">From / To (UTC)</div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  disabled={datePreset !== "custom"}
                  className="w-full h-10 rounded-md bg-black/30 border border-zinc-800 px-3 text-zinc-200 disabled:opacity-50"
                />
                <input
                  type="date"
                  value={customTill}
                  onChange={(e) => setCustomTill(e.target.value)}
                  disabled={datePreset !== "custom"}
                  className="w-full h-10 rounded-md bg-black/30 border border-zinc-800 px-3 text-zinc-200 disabled:opacity-50"
                />
              </div>
            </label>
            <label className="space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">{isSuperAdmin ? "Agent" : "Cashier"}</div>
              <select
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full h-10 rounded-md bg-black/30 border border-zinc-800 px-3 text-zinc-200"
              >
                <option value="">All</option>
                {rows.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.displayName}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-3 flex items-center justify-end">
            <button
              type="button"
              onClick={() => {
                setDatePreset("last7");
                setCustomFrom("");
                setCustomTill("");
                setUserId("");
              }}
              className="h-9 px-4 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 text-[12px] font-bold uppercase tracking-widest"
            >
              Reset
            </button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <Card className="bg-[#1A1A1A] border-zinc-800">
          <CardHeader>
            <CardDescription>Tickets</CardDescription>
            <CardTitle className="text-3xl text-white">{totals.totalTickets.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-[#1A1A1A] border-zinc-800">
          <CardHeader>
            <CardDescription>Bets</CardDescription>
            <CardTitle className="text-3xl text-white">{money(totals.totalBets)}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-[#1A1A1A] border-zinc-800">
          <CardHeader>
            <CardDescription>Payouts</CardDescription>
            <CardTitle className="text-3xl text-white">{money(totals.totalPayouts)}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-[#1A1A1A] border-zinc-800">
          <CardHeader>
            <CardDescription>Unclaimed</CardDescription>
            <CardTitle className="text-3xl text-white">{money(totals.totalUnclaimed)}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-[#1A1A1A] border-zinc-800">
          <CardHeader>
            <CardDescription>Total Generated</CardDescription>
            <CardTitle className="text-3xl text-white">{money(totals.totalGenerated)}</CardTitle>
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
                  <TableHead className="text-zinc-400">Tickets</TableHead>
                  <TableHead className="text-zinc-400">Bets</TableHead>
                  <TableHead className="text-zinc-400">Payouts</TableHead>
                  <TableHead className="text-zinc-400">Unclaimed</TableHead>
                  <TableHead className="text-zinc-400">Generated</TableHead>
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
                    <TableCell>{Number(r.tickets || 0).toLocaleString()}</TableCell>
                    <TableCell>{money(r.bets)}</TableCell>
                    <TableCell>{money(r.payouts)}</TableCell>
                    <TableCell>{money(r.unclaimed)}</TableCell>
                    <TableCell className="text-brand">{money(r.generated)}</TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 ? (
                  <TableRow className="border-zinc-900">
                    <TableCell colSpan={8} className="text-zinc-400 py-8 text-center">
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
