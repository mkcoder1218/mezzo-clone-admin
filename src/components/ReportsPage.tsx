import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, CircleDollarSign, Download, Receipt, TrendingUp, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiRequest } from "../lib/apiClient";

type Metrics = { stake: number; payout: number; moneyMade: number; tickets: number };
type MoneyNode = {
  id: string;
  displayName: string;
  phoneNumber?: string | null;
  roleName: string;
  isActive: boolean;
  metrics: Metrics;
  agents?: MoneyNode[];
  cashiers?: MoneyNode[];
};
type MoneyReport = {
  sport: { totals: Metrics; rows: MoneyNode[] };
  virtual: { totals: Metrics; rows: MoneyNode[] };
};

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

function roleLabel(roleName?: string) {
  if (roleName === "super_agent") return "SUPER AGENT";
  if (roleName === "agent") return "AGENT";
  if (roleName === "cashier") return "CASHIER";
  return (roleName || "OWNER").replace("_", " ").toUpperCase();
}

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function safeFilePart(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "report";
}

function flattenMoneyRows(rows: MoneyNode[], product: string, parentName = ""): Array<Record<string, string | number>> {
  return rows.flatMap((node) => {
    const current = {
      product,
      parent: parentName,
      name: node.displayName,
      phone: node.phoneNumber || "",
      role: roleLabel(node.roleName),
      status: node.isActive ? "ACTIVE" : "DISABLED",
      tickets: node.metrics.tickets,
      stake: money(node.metrics.stake),
      payout: money(node.metrics.payout),
      moneyMade: money(node.metrics.moneyMade),
    };
    return [
      current,
      ...flattenMoneyRows(node.agents || [], product, node.displayName),
      ...flattenMoneyRows(node.cashiers || [], product, node.displayName),
    ];
  });
}

function downloadCsv(filename: string, rows: Array<Record<string, string | number>>) {
  const headers = ["product", "parent", "name", "phone", "role", "status", "tickets", "stake", "payout", "moneyMade"];
  const csv = [headers.map(csvCell).join(","), ...rows.map((row) => headers.map((h) => csvCell(row[h])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function StatCard({ title, value, caption, icon: Icon }: { title: string; value: string; caption: string; icon: any }) {
  return (
    <Card className="bg-[#1A1A1A] border-zinc-800">
      <CardContent className="p-5 flex items-center gap-4">
        <div className="h-11 w-11 rounded-lg bg-lime-400/10 text-lime-400 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-widest text-zinc-500 font-bold">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          <p className="text-xs text-zinc-500 mt-1">{caption}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function MoneyTable({ rows, loading, label }: { rows: MoneyNode[]; loading: boolean; label: string }) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setOpen((prev) => ({ ...prev, [id]: !prev[id] }));

  const childRows = (owner: MoneyNode) => [
    ...(owner.agents || []).map((agent) => ({ node: agent, depth: 1, kind: "Agent" })),
    ...(owner.cashiers || []).map((cashier) => ({ node: cashier, depth: 1, kind: "Direct cashier" })),
  ];

  return (
    <Table className="text-zinc-200">
      <TableHeader>
        <TableRow className="border-zinc-800">
          <TableHead className="text-zinc-400">Hierarchy</TableHead>
          <TableHead className="text-zinc-400">Status</TableHead>
          <TableHead className="text-zinc-400 text-right">Tickets</TableHead>
          <TableHead className="text-zinc-400 text-right">Stake</TableHead>
          <TableHead className="text-zinc-400 text-right">Payout</TableHead>
          <TableHead className="text-zinc-400 text-right">Money Made</TableHead>
          <TableHead className="text-zinc-400 text-right">Export</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow className="border-zinc-900">
            <TableCell colSpan={7} className="text-zinc-500 py-8 text-center">Loading...</TableCell>
          </TableRow>
        ) : rows.length ? (
          rows.flatMap((owner) => {
            const children = childRows(owner);
            const isOpen = Boolean(open[owner.id]);
            return [
              <TableRow key={owner.id} className="border-zinc-900 hover:bg-zinc-900/60">
                <TableCell>
                  <button type="button" onClick={() => toggle(owner.id)} className="flex items-center gap-3 text-left">
                    {children.length ? (isOpen ? <ChevronDown className="w-4 h-4 text-lime-400" /> : <ChevronRight className="w-4 h-4 text-zinc-500" />) : <span className="w-4" />}
                    <span>
                      <span className="block text-white font-semibold">{owner.displayName}</span>
                      <span className="block text-xs text-zinc-500">{roleLabel(owner.roleName)}{owner.phoneNumber ? ` / ${owner.phoneNumber}` : ""}</span>
                    </span>
                  </button>
                </TableCell>
                <TableCell><Badge className={owner.isActive ? "bg-emerald-600" : "bg-zinc-700"}>{owner.isActive ? "ACTIVE" : "DISABLED"}</Badge></TableCell>
                <TableCell className="text-right">{owner.metrics.tickets}</TableCell>
                <TableCell className="text-right">{money(owner.metrics.stake)}</TableCell>
                <TableCell className="text-right">{money(owner.metrics.payout)}</TableCell>
                <TableCell className={`text-right font-bold ${owner.metrics.moneyMade >= 0 ? "text-lime-400" : "text-rose-400"}`}>{money(owner.metrics.moneyMade)}</TableCell>
                <TableCell className="text-right">
                  <Button
                    type="button"
                    onClick={() => downloadCsv(`${safeFilePart(label)}-${safeFilePart(owner.displayName)}.csv`, flattenMoneyRows([owner], label))}
                    className="bg-zinc-800 hover:bg-zinc-700 px-3"
                    title="Export this user"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>,
              ...(isOpen
                ? children.flatMap(({ node, kind }) => [
                    <TableRow key={`${owner.id}-${node.id}`} className="border-zinc-900 bg-zinc-950/30">
                      <TableCell className="pl-12">
                        <span className="block text-white">{node.displayName}</span>
                        <span className="block text-xs text-zinc-500">{kind}{node.phoneNumber ? ` / ${node.phoneNumber}` : ""}</span>
                      </TableCell>
                      <TableCell><Badge className={node.isActive ? "bg-emerald-700" : "bg-zinc-700"}>{node.isActive ? "ACTIVE" : "DISABLED"}</Badge></TableCell>
                      <TableCell className="text-right">{node.metrics.tickets}</TableCell>
                      <TableCell className="text-right">{money(node.metrics.stake)}</TableCell>
                      <TableCell className="text-right">{money(node.metrics.payout)}</TableCell>
                      <TableCell className={`text-right font-bold ${node.metrics.moneyMade >= 0 ? "text-lime-400" : "text-rose-400"}`}>{money(node.metrics.moneyMade)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          onClick={() => downloadCsv(`${safeFilePart(label)}-${safeFilePart(node.displayName)}.csv`, flattenMoneyRows([node], label, owner.displayName))}
                          className="bg-zinc-800 hover:bg-zinc-700 px-3"
                          title="Export this user"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>,
                    ...((node.cashiers || []).map((cashier) => (
                      <TableRow key={`${node.id}-${cashier.id}`} className="border-zinc-900 bg-zinc-950/60">
                        <TableCell className="pl-20">
                          <span className="block text-zinc-100">{cashier.displayName}</span>
                          <span className="block text-xs text-zinc-500">Cashier{cashier.phoneNumber ? ` / ${cashier.phoneNumber}` : ""}</span>
                        </TableCell>
                        <TableCell><Badge className={cashier.isActive ? "bg-emerald-800" : "bg-zinc-700"}>{cashier.isActive ? "ACTIVE" : "DISABLED"}</Badge></TableCell>
                        <TableCell className="text-right">{cashier.metrics.tickets}</TableCell>
                        <TableCell className="text-right">{money(cashier.metrics.stake)}</TableCell>
                        <TableCell className="text-right">{money(cashier.metrics.payout)}</TableCell>
                        <TableCell className={`text-right font-bold ${cashier.metrics.moneyMade >= 0 ? "text-lime-400" : "text-rose-400"}`}>{money(cashier.metrics.moneyMade)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            onClick={() => downloadCsv(`${safeFilePart(label)}-${safeFilePart(cashier.displayName)}.csv`, flattenMoneyRows([cashier], label, node.displayName))}
                            className="bg-zinc-800 hover:bg-zinc-700 px-3"
                            title="Export this user"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))),
                  ])
                : []),
            ];
          })
        ) : (
          <TableRow className="border-zinc-900">
            <TableCell colSpan={7} className="text-zinc-500 py-8 text-center">No money activity for this range.</TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

function MoneyPanel({ data, loading, label, dtFrom, dtTill }: { data?: { totals: Metrics; rows: MoneyNode[] }; loading: boolean; label: string; dtFrom: string; dtTill: string }) {
  const totals = data?.totals || { stake: 0, payout: 0, moneyMade: 0, tickets: 0 };
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Money Made" value={money(totals.moneyMade)} caption={`${label} net revenue`} icon={TrendingUp} />
        <StatCard title="Stake" value={money(totals.stake)} caption="Total money played" icon={CircleDollarSign} />
        <StatCard title="Payout" value={money(totals.payout)} caption="Total money paid out" icon={Receipt} />
        <StatCard title="Tickets" value={String(totals.tickets)} caption="Activity count" icon={Users} />
      </div>
      <Card className="bg-[#1A1A1A] border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-3">
            <span>{label} Hierarchy</span>
            <Button
              type="button"
              onClick={() => downloadCsv(`${safeFilePart(label)}-money-made-${dtFrom}-to-${dtTill}.csv`, flattenMoneyRows(data?.rows || [], label))}
              disabled={loading || !(data?.rows || []).length}
              className="bg-zinc-800 hover:bg-zinc-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </CardTitle>
          <CardDescription>Click a super agent or direct agent to open agents and cashiers below them.</CardDescription>
        </CardHeader>
        <CardContent>
          <MoneyTable rows={data?.rows || []} loading={loading} label={label} />
        </CardContent>
      </Card>
    </div>
  );
}

export function ReportsPage({ defaultTab = "money" }: { defaultTab?: "money" | "outcomes" }) {
  const [dtFrom, setDtFrom] = useState(todayYmd());
  const [dtTill, setDtTill] = useState(todayYmd());

  const summary = useQuery({
    queryKey: ["admin-reports-summary", { dtFrom, dtTill }],
    queryFn: () => apiRequest<{ byResult: Array<{ result: string; count: number; stakeSum: number; payoutSum: number }> }>(`/api/admin/reports/summary?dtFrom=${encodeURIComponent(dtFrom)}&dtTill=${encodeURIComponent(dtTill)}`),
    staleTime: 10_000,
  });

  const moneyHierarchy = useQuery({
    queryKey: ["admin-reports-money-hierarchy", { dtFrom, dtTill }],
    queryFn: () => apiRequest<MoneyReport>(`/api/admin/reports/money-hierarchy?dtFrom=${encodeURIComponent(dtFrom)}&dtTill=${encodeURIComponent(dtTill)}`),
    staleTime: 10_000,
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

  const refreshAll = () => {
    summary.refetch();
    moneyHierarchy.refetch();
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-display font-bold text-white uppercase italic">
          Reports <span className="text-brand">Summary</span>
        </h1>
        <p className="text-zinc-400">Outcome reports and hierarchy revenue by sport and virtual activity.</p>
      </header>

      <Card className="bg-[#1A1A1A] border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Date Range</span>
            <Badge className="bg-zinc-700">REPORTS</Badge>
          </CardTitle>
          <CardDescription>Sport uses placed time. Virtual uses game transaction time.</CardDescription>
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
          <Button onClick={refreshAll} disabled={summary.isFetching || moneyHierarchy.isFetching} className="bg-zinc-800 hover:bg-zinc-700">
            {summary.isFetching || moneyHierarchy.isFetching ? "Refreshing..." : "Refresh"}
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue={defaultTab} className="space-y-5">
        <TabsList className="bg-zinc-900 border border-zinc-800 h-10">
          <TabsTrigger value="money" className="px-4 data-active:bg-lime-400 data-active:text-black">Money Made</TabsTrigger>
          <TabsTrigger value="outcomes" className="px-4 data-active:bg-lime-400 data-active:text-black">Outcomes</TabsTrigger>
        </TabsList>

        <TabsContent value="money" className="space-y-5">
          <Tabs defaultValue="sport" className="space-y-5">
            <TabsList className="bg-zinc-900 border border-zinc-800 h-10">
              <TabsTrigger value="sport" className="px-4 data-active:bg-lime-400 data-active:text-black">Sport</TabsTrigger>
              <TabsTrigger value="virtual" className="px-4 data-active:bg-lime-400 data-active:text-black">Virtual</TabsTrigger>
            </TabsList>
            <TabsContent value="sport">
              <MoneyPanel data={moneyHierarchy.data?.sport} loading={moneyHierarchy.isLoading} label="Sport" dtFrom={dtFrom} dtTill={dtTill} />
            </TabsContent>
            <TabsContent value="virtual">
              <MoneyPanel data={moneyHierarchy.data?.virtual} loading={moneyHierarchy.isLoading} label="Virtual" dtFrom={dtFrom} dtTill={dtTill} />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="outcomes">
          <Card className="bg-[#1A1A1A] border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Outcome Breakdown</span>
                <Badge className="bg-brand text-black">TOTAL {totals.count}</Badge>
              </CardTitle>
              <CardDescription>Total stake: {money(totals.stakeSum)} / Total payout: {money(totals.payoutSum)}</CardDescription>
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
                      <tr><td colSpan={4} className="py-8 text-zinc-500 text-sm">Loading...</td></tr>
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
                      <tr><td colSpan={4} className="py-8 text-zinc-500 text-sm">No data for this range.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
