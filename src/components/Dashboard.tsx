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
import { UserRole, MOCK_BETS } from "../types";

// --- Constants & Data ---

const REVENUE_DATA = [
  { name: "Mon", value: 4000 },
  { name: "Tue", value: 3000 },
  { name: "Wed", value: 6000 },
  { name: "Thu", value: 8000 },
  { name: "Fri", value: 7000 },
  { name: "Sat", value: 12000 },
  { name: "Sun", value: 10000 },
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

const CreditDistribution = () => (
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
                  <span className="text-brand">82%</span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden border border-zinc-900">
                  <div className="h-full bg-brand w-[82%] shadow-[0_0_8px_rgba(204,255,0,0.4)]" />
              </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Available</p>
                  <p className="text-xl font-bold text-white tracking-tighter">$180,000</p>
              </div>
              <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Distributed</p>
                  <p className="text-xl font-bold text-white tracking-tighter">$820,000</p>
              </div>
          </div>

          <div className="space-y-3 pt-2">
              {[
                  { name: "Top Agent Alpha", val: "$450k", p: 90 },
                  { name: "Regional Node B", val: "$120k", p: 45 },
                  { name: "Direct Shop X", val: "$25k", p: 12 },
              ].map((sub, i) => (
                  <div key={i} className="flex flex-col gap-1.5 p-3 rounded-lg border border-zinc-800/80 bg-zinc-900/30">
                      <div className="flex justify-between text-xs">
                          <span className="font-medium text-white">{sub.name}</span>
                          <span className="font-bold text-brand">{sub.val}</span>
                      </div>
                      <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-brand/40" style={{ width: `${sub.p}%` }} />
                      </div>
                  </div>
              ))}
          </div>
      </CardContent>
      <CardFooter>
          <Button variant="ghost" className="w-full text-[10px] font-bold uppercase tracking-wider text-brand hover:text-white transition-colors">
              MANAGE LIMITS <TrendingUp className="w-3 h-4 ml-2" />
          </Button>
      </CardFooter>
  </Card>
);

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

const RecentTickets = () => (
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
                      {MOCK_BETS.map((bet) => (
                          <tr key={bet.id} className="hover:bg-zinc-800/20 transition-colors group">
                              <td className="px-6 py-4">
                                  <div className="flex flex-col">
                                      <span className="text-sm font-bold text-white group-hover:text-brand transition-colors uppercase italic font-display">#{bet.id.toUpperCase()}</span>
                                      <span className="text-[10px] text-zinc-600 italic">2 mins ago</span>
                                  </div>
                              </td>
                              <td className="px-6 py-4">
                                 {bet.isOnline ? (
                                     <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[8px] h-4">ONLINE</Badge>
                                 ) : (
                                     <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[8px] h-4">SHOP</Badge>
                                 )}
                              </td>
                              <td className="px-6 py-4 text-sm font-bold text-white tracking-tighter italic font-display">${bet.amount}</td>
                              <td className="px-6 py-4 text-right">
                                  <Badge className={`uppercase text-[10px] font-bold ${
                                      bet.status === 'won' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                                      bet.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                      'bg-zinc-800 text-zinc-400 border-zinc-700'
                                  }`}>
                                      {bet.status}
                                  </Badge>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
           </div>
        </CardContent>
    </Card>
);

// --- Main Page ---

export const DashboardPage = ({ role }: { role: UserRole }) => {
  const isSuper = role === "SUPER_ADMIN";
  const isAgent = role === "AGENT";

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-white uppercase italic">
            Network <span className="text-brand">Overview</span>
          </h1>
          <p className="text-zinc-400 mt-1">
            {isSuper ? "Global command telemetry for the Mezzobet network." : 
             isAgent ? "Portfolio performance and credit allocation metrics." :
             "Shop terminal status and localized betting volume."}
          </p>
        </div>
        <Badge variant="outline" className="bg-brand/10 text-brand border-brand/20 h-8 px-4 font-bold uppercase tracking-widest text-[10px]">
           {role.replace("_", " ")} SESSION
        </Badge>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Gross Volume" value="$1.2M" change="+12.5%" icon={DollarSign} />
        <MetricCard title="Active Users" value="4,852" change="+3.2%" icon={Users} />
        {isSuper || isAgent ? (
          <MetricCard title="Allocated Limit" value="$1.0M" change="+5.4%" icon={Wallet} />
        ) : (
          <MetricCard title="Shop Balance" value="$12,000" change="-1.2%" icon={CreditCard} />
        )}
        <MetricCard title="Commission" value="$42k" change="+8.1%" icon={Receipt} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {(isSuper || isAgent) && <CreditDistribution />}

        <Card className={`${(isSuper || isAgent) ? 'lg:col-span-2' : 'lg:col-span-3'} bg-[#1A1A1A] border-none shadow-2xl`}>
          <BettingChart />
          <CardContent className="h-[400px] w-full pt-4">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={REVENUE_DATA}>
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
          <RecentTickets />
          <SystemStatusMonitor />
      </div>
    </div>
  )
}
