import { 
  DollarSign, 
  Users, 
  Activity, 
  Receipt, 
  ChevronDown,
  Wallet,
  TrendingUp,
  ShieldCheck,
  CreditCard
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UserRole } from "../types";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../lib/apiClient";

// --- Constants & Data ---

const FALLBACK_CHART_DATA = [
  { name: "Mon", value: 0 },
  { name: "Tue", value: 0 },
  { name: "Wed", value: 0 },
  { name: "Thu", value: 0 },
  { name: "Fri", value: 0 },
  { name: "Sat", value: 0 },
  { name: "Sun", value: 0 },
];

// --- Modular Sub-components ---

const MetricCard = ({ title, value, change, icon: Icon }: any) => (
  <Card className="bg-[#1A1A1A] border-none overflow-hidden relative group shadow-lg">
    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
      <Icon className="w-12 h-12 text-brand" />
    </div>
    <CardHeader className="pb-2">
      <CardDescription className="text-zinc-500 uppercase text-[10px] font-bold tracking-wider pl-1">{title}</CardDescription>
      <CardTitle className="text-4xl font-display font-bold text-white leading-tight italic uppercase">{value}</CardTitle>
    </CardHeader>
    <CardContent>
      <span className="inline-flex items-center text-[10px] uppercase font-bold text-emerald-500">
        {change} <span className="text-zinc-500 ml-1.5 font-normal lowercase italic tracking-normal">vs last cycle</span>
      </span>
    </CardContent>
  </Card>
);

const MetricCardSkeleton = () => (
  <Card className="bg-[#1A1A1A] border-none overflow-hidden relative shadow-lg">
    <CardHeader className="pb-2">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-10 w-32" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-3 w-28" />
    </CardContent>
  </Card>
);

function formatMoney(value: unknown) {
  return Number(value || 0).toFixed(2);
}

const CreditDistribution = ({ meLimit, rows }: { meLimit: number; rows: any[] }) => {
  const distributed = rows.reduce((sum, row) => sum + Number(row.limit?.totalLimit || 0), 0);
  const total = meLimit + distributed;
  const utilization = total > 0 ? Math.min(100, Math.round((distributed / total) * 100)) : 0;
  const topRows = [...rows].sort((a, b) => Number(b.limit?.totalLimit || 0) - Number(a.limit?.totalLimit || 0)).slice(0, 3);

  return (
  <Card className="bg-[#1A1A1A] border-none shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-6 opacity-5">
          <ShieldCheck className="w-24 h-24 text-brand" />
      </div>
      <CardHeader>
          <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-brand" />
              Credit Distribution
          </CardTitle>
          <CardDescription>Limit status across your subordinates</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
          <div className="space-y-2">
              <div className="flex justify-between text-[10px] uppercase font-bold text-zinc-500">
                  <span>Limit Utilization</span>
                  <span className="text-brand">{utilization}%</span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden border border-zinc-900">
                  <div className="h-full bg-brand shadow-[0_0_8px_rgba(204,255,0,0.4)]" style={{ width: `${utilization}%` }} />
              </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Available</p>
                  <p className="text-xl font-bold text-white tracking-tighter">{formatMoney(meLimit)}</p>
              </div>
              <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Distributed</p>
                  <p className="text-xl font-bold text-white tracking-tighter">{formatMoney(distributed)}</p>
              </div>
          </div>

          <div className="space-y-3 pt-2">
              {topRows.length ? topRows.map((sub) => {
                  const value = Number(sub.limit?.totalLimit || 0);
                  const percent = distributed > 0 ? Math.min(100, Math.round((value / distributed) * 100)) : 0;
                  return (
                  <div key={sub.id} className="flex flex-col gap-1.5 p-3 rounded-lg border border-zinc-800/80 bg-zinc-900/30">
                      <div className="flex justify-between text-xs">
                          <span className="font-medium text-white">{sub.displayName || sub.phoneNumber || sub.id}</span>
                          <span className="font-bold text-brand">{formatMoney(value)}</span>
                      </div>
                      <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-brand/40" style={{ width: `${percent}%` }} />
                      </div>
                  </div>
              )}) : (
                <div className="p-3 rounded-lg border border-zinc-800/80 bg-zinc-900/30 text-sm text-zinc-500">
                  No distributed limits yet.
                </div>
              )}
          </div>
      </CardContent>
      <CardFooter>
          <Button variant="ghost" className="w-full text-[10px] font-bold uppercase tracking-wider text-brand hover:text-white transition-colors">
              MANAGE LIMITS <TrendingUp className="w-3 h-4 ml-2" />
          </Button>
      </CardFooter>
  </Card>
  );
};

const BettingChart = () => (
    <CardHeader>
      <CardTitle>Betting Volume</CardTitle>
      <CardDescription>Weekly betting trends across the network</CardDescription>
    </CardHeader>
);

const SystemStatusMonitor = () => (
  <Card className="bg-[#1A1A1A] border-none shadow-2xl text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-brand" />
          System Nodes
        </CardTitle>
        <CardDescription>Live heartbeat of betting servers</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-4">
         <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold uppercase text-zinc-500 tracking-wider">
                <span>Central Matching Engine</span>
                <span className="text-brand">Safe • 12% Load</span>
            </div>
            <div className="h-2 w-full bg-zinc-800/50 rounded-full overflow-hidden border border-zinc-800">
                <div className="h-full bg-brand w-[12%] shadow-[0_0_10px_rgba(204,255,0,0.5)]" />
            </div>
         </div>

         <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold uppercase text-zinc-500 tracking-wider">
                <span>Virtual API Gateway</span>
                <span className="text-emerald-500">Optimized • 45ms</span>
            </div>
            <div className="h-2 w-full bg-zinc-800/50 rounded-full overflow-hidden border border-zinc-800">
                <div className="h-full bg-emerald-500 w-[45%]" />
            </div>
         </div>

         <div className="pt-4 grid grid-cols-2 gap-4">
            <div className="bg-zinc-900/50 rounded-2xl p-5 border border-zinc-800 hover:border-zinc-700 transition-all group lg:aspect-square flex flex-col justify-center">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 group-hover:text-brand transition-colors">Cluster Uptime</p>
                <p className="text-2xl font-display font-bold text-white tracking-tighter italic">99.99<span className="text-zinc-600">%</span></p>
            </div>
            <div className="bg-zinc-900/50 rounded-2xl p-5 border border-zinc-800 hover:border-zinc-700 transition-all group lg:aspect-square flex flex-col justify-center">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 group-hover:text-brand transition-colors">Network Nodes</p>
                <p className="text-2xl font-display font-bold text-white tracking-tighter italic">1,242</p>
            </div>
         </div>
      </CardContent>
  </Card>
);

const LiveTicketStatus = ({ metrics }: { metrics: any }) => {
  const slips = Number(metrics.slipsCount || 0);
  const pending = Number(metrics.pendingCount || 0);
  const settled = Number(metrics.settledCount || 0);
  const pendingPct = slips > 0 ? Math.min(100, Math.round((pending / slips) * 100)) : 0;
  const settledPct = slips > 0 ? Math.min(100, Math.round((settled / slips) * 100)) : 0;

  return (
    <Card className="bg-[#1A1A1A] border-none shadow-2xl text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-brand" />
          Ticket Processing
        </CardTitle>
        <CardDescription>Live settlement status from ticket data</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-4">
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-bold uppercase text-zinc-500 tracking-wider">
            <span>Pending Tickets</span>
            <span className="text-brand">{pending} / {slips}</span>
          </div>
          <div className="h-2 w-full bg-zinc-800/50 rounded-full overflow-hidden border border-zinc-800">
            <div className="h-full bg-brand shadow-[0_0_10px_rgba(204,255,0,0.5)]" style={{ width: `${pendingPct}%` }} />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-bold uppercase text-zinc-500 tracking-wider">
            <span>Settled Tickets</span>
            <span className="text-emerald-500">{settled} / {slips}</span>
          </div>
          <div className="h-2 w-full bg-zinc-800/50 rounded-full overflow-hidden border border-zinc-800">
            <div className="h-full bg-emerald-500" style={{ width: `${settledPct}%` }} />
          </div>
        </div>

        <div className="pt-4 grid grid-cols-2 gap-4">
          <div className="bg-zinc-900/50 rounded-2xl p-5 border border-zinc-800 hover:border-zinc-700 transition-all group lg:aspect-square flex flex-col justify-center">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 group-hover:text-brand transition-colors">Total Stake</p>
            <p className="text-2xl font-display font-bold text-white tracking-tighter italic">{formatMoney(metrics.stakeSum)}</p>
          </div>
          <div className="bg-zinc-900/50 rounded-2xl p-5 border border-zinc-800 hover:border-zinc-700 transition-all group lg:aspect-square flex flex-col justify-center">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 group-hover:text-brand transition-colors">Total Payout</p>
            <p className="text-2xl font-display font-bold text-white tracking-tighter italic">{formatMoney(metrics.payoutSum)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const RecentTickets = ({ rows }: { rows: any[] }) => (
  <Card className="bg-[#1A1A1A] border-none shadow-2xl">
        <CardHeader>
          <div className="flex justify-between items-center">
              <div>
                  <CardTitle>Recent Network Tickets</CardTitle>
                  <CardDescription>Latest betting activity stream</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                   <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                   <span className="text-[10px] font-bold text-emerald-500 tracking-widest uppercase">Live Stream</span>
              </div>
          </div>
        </CardHeader>
        <CardContent className="px-0">
           <div className="overflow-x-auto">
              <table className="w-full text-left font-sans">
                  <thead>
                      <tr className="border-b border-zinc-800">
                          <th className="px-6 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Ticket ID</th>
                          <th className="px-6 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Source</th>
                          <th className="px-6 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Amount</th>
                          <th className="px-6 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider text-right">Status</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                      {rows.map((slip: any) => {
                          const isOnline = !slip.cashierId;
                          const amount = Number(slip.stake || 0);
                          const status = String(slip.result || "pending");
                          const placedAt = slip.placedAt ? new Date(slip.placedAt).toLocaleString() : "-";
                          const label = String(slip.id).slice(-8).toUpperCase();
                          return (
                          <tr key={slip.id} className="hover:bg-zinc-800/20 transition-colors group">
                              <td className="px-6 py-4">
                                  <div className="flex flex-col">
                                      <span className="text-sm font-bold text-white group-hover:text-brand transition-colors uppercase italic font-display">#{label}</span>
                                      <span className="text-[10px] text-zinc-600 italic">{placedAt}</span>
                                  </div>
                              </td>
                              <td className="px-6 py-4">
                                 {isOnline ? (
                                     <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[8px] h-4">ONLINE</Badge>
                                 ) : (
                                     <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[8px] h-4">SHOP</Badge>
                                 )}
                              </td>
                              <td className="px-6 py-4 text-sm font-bold text-white tracking-tighter italic font-display">{amount.toFixed(2)}</td>
                              <td className="px-6 py-4 text-right">
                                  <Badge className={`uppercase text-[10px] font-bold ${
                                      status === 'won' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                                      status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                      status === 'lost' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                                      'bg-zinc-800 text-zinc-400 border-zinc-700'
                                  }`}>
                                      {status}
                                  </Badge>
                              </td>
                          </tr>
                          );
                      })}
                  </tbody>
              </table>
           </div>
        </CardContent>
    </Card>
);

// --- Main Page ---

export const DashboardPage = ({ role }: { role: UserRole }) => {
  const isSuper = role === "SUPER_ADMIN";
  const isNetworkManager = role === "SUPER_ADMIN" || role === "SUPER_AGENT" || role === "AGENT";

  const dashboard = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => apiRequest<{ metrics: any }>(`/api/admin/dashboard`),
    staleTime: 10_000
  });

  const recent = useQuery({
    queryKey: ["admin-bets-recent"],
    queryFn: () => apiRequest<{ count: number; rows: any[] }>(`/api/admin/bets?limit=8&offset=0`),
    staleTime: 5_000
  });

  const limits = useQuery({
    queryKey: ["dashboard-limits"],
    queryFn: async () => {
      const [me, tree] = await Promise.all([
        apiRequest<{ limit: { totalLimit: string } }>("/api/limits/me"),
        apiRequest<{ items: any[] }>("/api/limits/tree"),
      ]);
      return { meLimit: Number(me.limit?.totalLimit || 0), rows: tree.items || [] };
    },
    staleTime: 10_000,
    enabled: isNetworkManager,
  });

  const metrics = dashboard.data?.metrics || {};
  const trend = (dashboard.data as any)?.trend?.dailyStake as { label: string; value: number }[] | undefined;
  const chartData = (trend && Array.isArray(trend) ? trend : []).map((d) => ({ name: d.label, value: Number(d.value || 0) }));

  if (dashboard.isLoading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <header className="flex justify-between items-end">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-80" />
          </div>
          <Skeleton className="h-8 w-44 rounded-full" />
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {isNetworkManager && <Skeleton className="h-[520px] w-full bg-zinc-900/30" />}
          <Card className={`${isNetworkManager ? "lg:col-span-2" : "lg:col-span-3"} bg-[#1A1A1A] border-none shadow-2xl`}>
            <CardHeader>
              <Skeleton className="h-5 w-44" />
              <Skeleton className="mt-2 h-3 w-64" />
            </CardHeader>
            <CardContent className="h-[400px] w-full pt-4">
              <Skeleton className="h-full w-full" />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="bg-[#1A1A1A] border-none shadow-2xl">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-3 w-56" />
                </div>
                <Skeleton className="h-4 w-24 rounded-full" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-3">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              ))}
            </CardContent>
          </Card>
          <Skeleton className="h-[420px] w-full bg-zinc-900/30" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {dashboard.isError ? (
        <Card className="bg-rose-500/5 border border-rose-500/20">
          <CardContent className="py-4 text-sm text-rose-200">
            Failed to load analytics. Please refresh or check the server.
          </CardContent>
        </Card>
      ) : null}
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-white uppercase italic">
            Network <span className="text-brand">Overview</span>
          </h1>
          <p className="text-zinc-400 mt-1">
            {isSuper ? "Global command telemetry for the Kings Bet network." : 
             role === "SUPER_AGENT" || role === "AGENT" ? "Portfolio performance and credit allocation metrics." :
             "Shop terminal status and localized betting volume."}
          </p>
        </div>
        <Badge variant="outline" className="bg-brand/10 text-brand border-brand/20 h-8 px-4 font-bold uppercase tracking-widest text-[10px]">
           {role.replace("_", " ")} SESSION
        </Badge>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Gross Volume" value={formatMoney(metrics.stakeSum)} change="-" icon={DollarSign} />
        <MetricCard title="Active Users" value={String(metrics.usersCount ?? "-")} change="-" icon={Users} />
        {isNetworkManager ? (
          <MetricCard title={isSuper ? "Total Payout" : "Credit Limit"} value={formatMoney(isSuper ? metrics.payoutSum : metrics.creditLimit)} change="-" icon={Wallet} />
        ) : (
          <MetricCard title="Shop Balance" value={formatMoney(metrics.balance)} change="-" icon={CreditCard} />
        )}
        <MetricCard title="Tickets" value={String(metrics.slipsCount ?? "-")} change="-" icon={Receipt} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {isNetworkManager && <CreditDistribution meLimit={limits.data?.meLimit || 0} rows={limits.data?.rows || []} />}

        <Card className={`${isNetworkManager ? 'lg:col-span-2' : 'lg:col-span-3'} bg-[#1A1A1A] border-none shadow-2xl`}>
          <BettingChart />
          <CardContent className="h-[400px] w-full pt-4">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData.length ? chartData : FALLBACK_CHART_DATA}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#CCFF00" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#CCFF00" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                  <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #333', color: '#fff', borderRadius: '12px' }}
                    itemStyle={{ color: '#CCFF00' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#CCFF00" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
             </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <RecentTickets rows={recent.data?.rows || []} />
          <LiveTicketStatus metrics={metrics} />
      </div>
    </div>
  )
}
