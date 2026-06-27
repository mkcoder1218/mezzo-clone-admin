import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, Calculator, Percent, RefreshCw, Save, Table2, Target, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest, ApiClientError } from "../lib/apiClient";

type Paytable = Record<string, Record<string, number>>;

type RtpSummary = {
  byPickCount: Record<string, number>;
  byPickCountPercent: Record<string, number>;
  averagePercent: number;
};

type FastKenoConfig = {
  totalBalls: number;
  drawnBalls: number;
  paytable: Paytable;
  paymentsTable: Paytable;
  targetRtpPercent: number;
  baseCalculatedRtp: RtpSummary;
  effectiveCalculatedRtp: RtpSummary;
  payoutScalePercent: number;
  calculatedRtp: RtpSummary;
  rtpByPickCount: Record<string, number>;
};

type FastKenoTicket = {
  id: string;
  ticketNumber: string;
  selectedNumbers: number[];
  stake: number;
  payout: number;
  rtpGain: number;
  hits?: number | null;
  status: "placed" | "won" | "lost" | "cancelled";
  createdAt: string;
  settledAt?: string | null;
  user?: {
    id: string;
    displayName?: string | null;
    phoneNumber?: string | null;
    email?: string | null;
  } | null;
  round?: {
    id: string;
    roundNumber: string;
    status: string;
    drawNumbers?: number[] | null;
  } | null;
};

const pickCounts = Array.from({ length: 10 }, (_, index) => String(index + 1));
const hitCounts = Array.from({ length: 11 }, (_, index) => index);

function paytableValue(paytable: Paytable | undefined, pickCount: string, hitCount: number) {
  const row = paytable?.[pickCount] || paytable?.[String(Number(pickCount))];
  if (!row) return undefined;
  return row[String(hitCount)] ?? row[String(Number(hitCount))];
}

function fmtMoney(value: unknown) {
  const n = Number(value || 0);
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function playerLabel(ticket: FastKenoTicket) {
  return ticket.user?.displayName || ticket.user?.phoneNumber || ticket.user?.email || ticket.user?.id?.slice(0, 8) || "-";
}

export function FastKenoConfigPage() {
  const [draftTargetRtp, setDraftTargetRtp] = useState(95);
  const [activeTab, setActiveTab] = useState<"config" | "tickets">("config");
  const [phoneFilter, setPhoneFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "won" | "lost" | "placed" | "cancelled">("all");
  const [selectedTicket, setSelectedTicket] = useState<FastKenoTicket | null>(null);

  const q = useQuery<{ config: FastKenoConfig }>({
    queryKey: ["fast-keno-config"],
    queryFn: async () => apiRequest<{ config: FastKenoConfig }>("/api/admin/games/fast-keno-config"),
  });

  const mutation = useMutation({
    mutationFn: async (payload: { targetRtpPercent: number }) =>
      apiRequest<{ config: FastKenoConfig }>("/api/admin/games/fast-keno-config", { method: "PUT", body: payload as any }),
    onSuccess: (data) => {
      if (data?.config) setDraftTargetRtp(data.config.targetRtpPercent);
    },
  });

  const ticketsQuery = useQuery<{ tickets: FastKenoTicket[] }>({
    queryKey: ["fast-keno-admin-tickets", phoneFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "300" });
      const phone = phoneFilter.trim();
      if (phone) params.set("phoneNumber", phone);
      if (statusFilter !== "all") params.set("status", statusFilter);
      return apiRequest<{ tickets: FastKenoTicket[] }>(`/api/admin/games/fast-keno-tickets?${params.toString()}`);
    },
  });

  const config = q.data?.config;
  const tickets = ticketsQuery.data?.tickets || [];

  useEffect(() => {
    if (config) setDraftTargetRtp(config.targetRtpPercent);
  }, [config]);

  const ticketSummary = useMemo(() => {
    return tickets.reduce(
      (summary, ticket) => {
        const stake = Number(ticket.stake || 0);
        const payout = Number(ticket.payout || 0);
        summary.stake += stake;
        summary.payout += payout;
        summary.rtpGain += payout - stake;
        if (ticket.status === "won") summary.won += 1;
        else summary.notWon += 1;
        return summary;
      },
      { stake: 0, payout: 0, rtpGain: 0, won: 0, notWon: 0 }
    );
  }, [tickets]);

  const paytableMissing = useMemo(() => {
    if (!config?.paytable) return true;
    return !pickCounts.some((pickCount) => {
      return hitCounts.some((hitCount) => paytableValue(config.paytable, pickCount, hitCount) !== undefined);
    });
  }, [config]);

  const queryError = q.error instanceof ApiClientError ? q.error.message : null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-white">
      <header>
        <h1 className="text-3xl font-bold font-display tracking-tight text-white uppercase italic">
          Fast Keno <span className="text-brand">Config</span>
        </h1>
        <p className="mt-1 text-zinc-400">
          The paytable defines the base multipliers. Target RTP automatically calculates payout scale from that base table.
        </p>
        {config?.baseCalculatedRtp?.averagePercent ? (
          <p className="mt-2 text-sm text-zinc-500">
            Current maximum target allowed by this paytable: {config.baseCalculatedRtp.averagePercent.toFixed(3)}%
          </p>
        ) : null}
      </header>

      {queryError ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">{queryError}</div>
      ) : null}

      <div className="flex flex-wrap gap-2 border-b border-zinc-800">
        {[
          { key: "config", label: "Config", icon: Target },
          { key: "tickets", label: "Tickets", icon: Table2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as "config" | "tickets")}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-black uppercase tracking-widest transition-colors ${
                active
                  ? "border-brand text-brand"
                  : "border-transparent text-zinc-500 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "config" ? (
        <>
      <Card className="bg-[#1A1A1A] border-zinc-800/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900">
              <Target className="h-5 w-5 text-zinc-400" />
            </div>
            <div>
              <CardTitle className="text-white">Target RTP %</CardTitle>
              <CardDescription className="text-zinc-400">
                Desired long-term return to player. Recommended range is 85 to 99, but it cannot exceed the base paytable average RTP.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {q.isLoading ? <div className="text-zinc-500">Loading...</div> : null}

          <div className="max-w-sm">
            <div className="mb-2 text-[10px] uppercase tracking-widest text-zinc-500">Target RTP Percent</div>
            <Input
              type="number"
              min={85}
              max={Math.min(100, config?.baseCalculatedRtp?.averagePercent ?? 100)}
              step={0.01}
              value={draftTargetRtp}
              onChange={(e) => setDraftTargetRtp(Number(e.target.value))}
              className="border-zinc-800 bg-zinc-900 text-white"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              disabled={mutation.isPending}
              onClick={() => mutation.mutate({ targetRtpPercent: draftTargetRtp })}
              className="rounded-xl bg-brand text-[10px] font-bold uppercase text-black hover:bg-brand/90"
            >
              <Save className="mr-2 h-4 w-4" /> Save
            </Button>
            {mutation.isError ? <div className="text-sm text-rose-400">Save failed.</div> : null}
            {mutation.isSuccess ? <div className="text-sm text-emerald-400">Saved.</div> : null}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="bg-[#1A1A1A] border-zinc-800/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900">
                <Calculator className="h-5 w-5 text-zinc-400" />
              </div>
              <div>
                <CardTitle className="text-white">Base Calculated RTP</CardTitle>
                <CardDescription className="text-zinc-400">From the original paytable before scaling.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {paytableMissing ? "N/A" : `${config?.baseCalculatedRtp?.averagePercent?.toFixed(3) ?? "0.000"}%`}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1A1A1A] border-zinc-800/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900">
                <Percent className="h-5 w-5 text-zinc-400" />
              </div>
              <div>
                <CardTitle className="text-white">Effective Calculated RTP</CardTitle>
                <CardDescription className="text-zinc-400">After the auto payout scale is applied.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {paytableMissing ? "N/A" : `${config?.effectiveCalculatedRtp?.averagePercent?.toFixed(3) ?? "0.000"}%`}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1A1A1A] border-zinc-800/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900">
                <Percent className="h-5 w-5 text-zinc-400" />
              </div>
              <div>
                <CardTitle className="text-white">Auto Payout Scale %</CardTitle>
                <CardDescription className="text-zinc-400">Calculated automatically from Target RTP and base RTP.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {paytableMissing ? "N/A" : `${config?.payoutScalePercent?.toFixed(4) ?? "0.0000"}%`}
            </div>
          </CardContent>
        </Card>
      </div>

      {paytableMissing ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>Paytable is missing, RTP cannot be calculated.</p>
          </div>
        </div>
      ) : null}

      <Card className="bg-[#1A1A1A] border-zinc-800/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900">
              <Table2 className="h-5 w-5 text-zinc-400" />
            </div>
            <div>
              <CardTitle className="text-white">Paytable / Payments</CardTitle>
              <CardDescription className="text-zinc-400">
                Top row is pick count 1 to 10. Left column is hit count 0 to 10. Cell value is payout multiplier.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border border-zinc-800 bg-zinc-900 px-3 py-2 text-left text-zinc-400">Hits</th>
                  {pickCounts.map((pickCount) => (
                    <th key={pickCount} className="border border-zinc-800 bg-zinc-900 px-3 py-2 text-center text-white">
                      {pickCount}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {hitCounts.map((hitCount) => (
                  <tr key={hitCount}>
                    <td className="border border-zinc-800 bg-zinc-900/60 px-3 py-2 font-semibold text-zinc-300">{hitCount}</td>
                    {pickCounts.map((pickCount) => {
                      const value = paytableValue(config?.paytable, pickCount, hitCount);
                      return (
                        <td key={`${pickCount}-${hitCount}`} className="border border-zinc-800 px-3 py-2 text-center text-zinc-200">
                          {value !== undefined ? value : "-"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#1A1A1A] border-zinc-800/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900">
              <Calculator className="h-5 w-5 text-zinc-400" />
            </div>
            <div>
              <CardTitle className="text-white">RTP By Pick Count</CardTitle>
              <CardDescription className="text-zinc-400">Base RTP and effective RTP shown side by side for picks 1 to 10.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {pickCounts.map((pickCount) => (
              <div key={pickCount} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                <div className="text-[10px] uppercase tracking-widest text-zinc-500">Pick {pickCount}</div>
                <div className="mt-2 text-lg font-bold text-white">
                  Base {config?.baseCalculatedRtp?.byPickCountPercent?.[pickCount]?.toFixed(3) ?? "0.000"}%
                </div>
                <div className="mt-1 text-sm text-zinc-400">
                  Effective {config?.effectiveCalculatedRtp?.byPickCountPercent?.[pickCount]?.toFixed(3) ?? "0.000"}%
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
        </>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className="bg-[#1A1A1A] border-zinc-800/50">
              <CardContent className="p-5">
                <div className="text-[10px] uppercase tracking-widest text-zinc-500">Tickets</div>
                <div className="mt-2 text-2xl font-bold text-white">{tickets.length}</div>
              </CardContent>
            </Card>
            <Card className="bg-[#1A1A1A] border-zinc-800/50">
              <CardContent className="p-5">
                <div className="text-[10px] uppercase tracking-widest text-zinc-500">Total Bet</div>
                <div className="mt-2 text-2xl font-bold text-white">{fmtMoney(ticketSummary.stake)}</div>
              </CardContent>
            </Card>
            <Card className="bg-[#1A1A1A] border-zinc-800/50">
              <CardContent className="p-5">
                <div className="text-[10px] uppercase tracking-widest text-zinc-500">Total Payout</div>
                <div className="mt-2 text-2xl font-bold text-white">{fmtMoney(ticketSummary.payout)}</div>
              </CardContent>
            </Card>
            <Card className="bg-[#1A1A1A] border-zinc-800/50">
              <CardContent className="p-5">
                <div className="text-[10px] uppercase tracking-widest text-zinc-500">RTP Gain</div>
                <div className={`mt-2 text-2xl font-bold ${ticketSummary.rtpGain >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {ticketSummary.rtpGain > 0 ? "+" : ""}{fmtMoney(ticketSummary.rtpGain)}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-[#1A1A1A] border-zinc-800/50">
            <CardHeader>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900">
                    <Table2 className="h-5 w-5 text-zinc-400" />
                  </div>
                  <div>
                    <CardTitle className="text-white">Fast Keno Tickets</CardTitle>
                    <CardDescription className="text-zinc-400">
                      Recent beted numbers with RTP gain. Won tickets are green; all non-winning tickets are red.
                    </CardDescription>
                  </div>
                </div>
                <Button
                  type="button"
                  disabled={ticketsQuery.isFetching}
                  onClick={() => ticketsQuery.refetch()}
                  className="rounded-xl bg-zinc-900 text-[10px] font-bold uppercase text-zinc-200 hover:bg-zinc-800"
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${ticketsQuery.isFetching ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(220px,320px)_180px_auto] lg:items-end">
                <div>
                  <div className="mb-2 text-[10px] uppercase tracking-widest text-zinc-500">Phone Number</div>
                  <Input
                    value={phoneFilter}
                    onChange={(e) => setPhoneFilter(e.target.value)}
                    placeholder="Search phone"
                    className="border-zinc-800 bg-zinc-900 text-white"
                  />
                </div>
                <div>
                  <div className="mb-2 text-[10px] uppercase tracking-widest text-zinc-500">Win / Lost</div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                    className="h-10 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm text-white outline-none focus:border-brand"
                  >
                    <option value="all">All</option>
                    <option value="won">Win</option>
                    <option value="lost">Lost</option>
                    <option value="placed">Placed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <Button
                  type="button"
                  onClick={() => {
                    setPhoneFilter("");
                    setStatusFilter("all");
                  }}
                  className="rounded-xl bg-zinc-900 text-[10px] font-bold uppercase text-zinc-200 hover:bg-zinc-800"
                >
                  Clear Filters
                </Button>
              </div>

              {ticketsQuery.isLoading ? (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 text-sm text-zinc-400">Loading tickets...</div>
              ) : ticketsQuery.isError ? (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">Tickets failed to load.</div>
              ) : tickets.length === 0 ? (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 text-sm text-zinc-400">No Fast Keno tickets found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-[1120px] w-full border-collapse text-sm">
                    <thead>
                      <tr>
                        <th className="border border-zinc-800 bg-zinc-900 px-3 py-2 text-left text-zinc-400">Ticket</th>
                        <th className="border border-zinc-800 bg-zinc-900 px-3 py-2 text-left text-zinc-400">Player</th>
                        <th className="border border-zinc-800 bg-zinc-900 px-3 py-2 text-left text-zinc-400">Draw</th>
                        <th className="border border-zinc-800 bg-zinc-900 px-3 py-2 text-left text-zinc-400">Beted Numbers</th>
                        <th className="border border-zinc-800 bg-zinc-900 px-3 py-2 text-right text-zinc-400">Bet</th>
                        <th className="border border-zinc-800 bg-zinc-900 px-3 py-2 text-right text-zinc-400">Payout</th>
                        <th className="border border-zinc-800 bg-zinc-900 px-3 py-2 text-right text-zinc-400">RTP Gain</th>
                        <th className="border border-zinc-800 bg-zinc-900 px-3 py-2 text-center text-zinc-400">Hits</th>
                        <th className="border border-zinc-800 bg-zinc-900 px-3 py-2 text-left text-zinc-400">Status</th>
                        <th className="border border-zinc-800 bg-zinc-900 px-3 py-2 text-left text-zinc-400">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tickets.map((ticket) => {
                        const won = ticket.status === "won";
                        const stake = Number(ticket.stake || 0);
                        const payout = Number(ticket.payout || 0);
                        const rtpGain = Number(ticket.rtpGain ?? payout - stake);
                        return (
                          <tr
                            key={ticket.id}
                            onClick={() => setSelectedTicket(ticket)}
                            className={`${won ? "bg-emerald-500/15" : "bg-rose-500/15"} cursor-pointer transition-colors hover:bg-brand/10`}
                            title="Open ticket result"
                          >
                            <td className="border border-zinc-800 px-3 py-2 font-mono text-xs text-zinc-200">{ticket.ticketNumber}</td>
                            <td className="border border-zinc-800 px-3 py-2 text-zinc-200">{playerLabel(ticket)}</td>
                            <td className="border border-zinc-800 px-3 py-2 font-mono text-xs text-zinc-300">
                              {ticket.round?.roundNumber || "-"}
                            </td>
                            <td className="border border-zinc-800 px-3 py-2">
                              <div className="flex flex-wrap gap-1">
                                {(ticket.selectedNumbers || []).map((num) => {
                                  const drawn = ticket.round?.drawNumbers?.includes(num);
                                  return (
                                    <span
                                      key={`${ticket.id}-${num}`}
                                      className={`flex h-6 min-w-6 items-center justify-center rounded-md px-1.5 text-xs font-black ${
                                        drawn ? "bg-brand text-black" : "bg-zinc-900 text-zinc-200"
                                      }`}
                                    >
                                      {num}
                                    </span>
                                  );
                                })}
                              </div>
                            </td>
                            <td className="border border-zinc-800 px-3 py-2 text-right font-semibold text-zinc-100">{fmtMoney(stake)}</td>
                            <td className="border border-zinc-800 px-3 py-2 text-right font-semibold text-zinc-100">{fmtMoney(payout)}</td>
                            <td className={`border border-zinc-800 px-3 py-2 text-right font-black ${rtpGain >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                              {rtpGain > 0 ? "+" : ""}{fmtMoney(rtpGain)}
                            </td>
                            <td className="border border-zinc-800 px-3 py-2 text-center font-bold text-zinc-100">
                              {ticket.hits ?? "-"}
                            </td>
                            <td className="border border-zinc-800 px-3 py-2">
                              <span className={`rounded-md px-2 py-1 text-[10px] font-black uppercase tracking-wider ${
                                won ? "bg-emerald-400 text-black" : "bg-rose-500 text-white"
                              }`}>
                                {ticket.status}
                              </span>
                            </td>
                            <td className="border border-zinc-800 px-3 py-2 text-xs text-zinc-300">{fmtDate(ticket.createdAt)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {selectedTicket ? (
            <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4">
              <div className="w-full max-w-3xl rounded-2xl border border-zinc-800 bg-[#111] shadow-2xl">
                <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-zinc-500">Ticket Result</div>
                    <div className="mt-1 font-mono text-lg font-black text-white">{selectedTicket.ticketNumber}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedTicket(null)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white"
                    title="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-5 p-5">
                  <div className="grid gap-3 md:grid-cols-4">
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
                      <div className="text-[10px] uppercase tracking-widest text-zinc-500">Player</div>
                      <div className="mt-1 truncate text-sm font-bold text-white">{playerLabel(selectedTicket)}</div>
                      <div className="mt-1 text-xs text-zinc-500">{selectedTicket.user?.phoneNumber || "-"}</div>
                    </div>
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
                      <div className="text-[10px] uppercase tracking-widest text-zinc-500">Draw</div>
                      <div className="mt-1 font-mono text-sm font-bold text-white">{selectedTicket.round?.roundNumber || "-"}</div>
                      <div className="mt-1 text-xs text-zinc-500">{selectedTicket.round?.status || "-"}</div>
                    </div>
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
                      <div className="text-[10px] uppercase tracking-widest text-zinc-500">Hits</div>
                      <div className="mt-1 text-sm font-bold text-white">{selectedTicket.hits ?? "-"}</div>
                      <div className="mt-1 text-xs text-zinc-500">of {selectedTicket.selectedNumbers.length}</div>
                    </div>
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
                      <div className="text-[10px] uppercase tracking-widest text-zinc-500">Status</div>
                      <div className={selectedTicket.status === "won" ? "mt-1 text-sm font-black uppercase text-emerald-400" : "mt-1 text-sm font-black uppercase text-rose-400"}>
                        {selectedTicket.status}
                      </div>
                      <div className="mt-1 text-xs text-zinc-500">{fmtDate(selectedTicket.settledAt)}</div>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                      <div className="mb-3 text-[10px] uppercase tracking-widest text-zinc-500">Beted Numbers</div>
                      <div className="flex flex-wrap gap-2">
                        {selectedTicket.selectedNumbers.map((num) => {
                          const matched = selectedTicket.round?.drawNumbers?.includes(num);
                          return (
                            <span
                              key={`picked-${num}`}
                              className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-black ${
                                matched ? "bg-brand text-black" : "bg-zinc-800 text-zinc-200"
                              }`}
                            >
                              {num}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                      <div className="mb-3 text-[10px] uppercase tracking-widest text-zinc-500">Draw Result</div>
                      {selectedTicket.round?.drawNumbers?.length ? (
                        <div className="flex flex-wrap gap-2">
                          {selectedTicket.round.drawNumbers.map((num) => {
                            const matched = selectedTicket.selectedNumbers.includes(num);
                            return (
                              <span
                                key={`drawn-${num}`}
                                className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-black ${
                                  matched ? "bg-brand text-black" : "bg-zinc-800 text-zinc-200"
                                }`}
                              >
                                {num}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-sm text-zinc-500">Result not settled yet.</div>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-4">
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
                      <div className="text-[10px] uppercase tracking-widest text-zinc-500">Bet</div>
                      <div className="mt-1 text-sm font-bold text-white">{fmtMoney(selectedTicket.stake)}</div>
                    </div>
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
                      <div className="text-[10px] uppercase tracking-widest text-zinc-500">Payout</div>
                      <div className="mt-1 text-sm font-bold text-white">{fmtMoney(selectedTicket.payout)}</div>
                    </div>
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
                      <div className="text-[10px] uppercase tracking-widest text-zinc-500">RTP Gain</div>
                      <div className={`mt-1 text-sm font-black ${Number(selectedTicket.rtpGain) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {Number(selectedTicket.rtpGain) > 0 ? "+" : ""}{fmtMoney(selectedTicket.rtpGain)}
                      </div>
                    </div>
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
                      <div className="text-[10px] uppercase tracking-widest text-zinc-500">Created</div>
                      <div className="mt-1 text-xs font-bold text-white">{fmtDate(selectedTicket.createdAt)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
