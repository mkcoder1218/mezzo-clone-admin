import { useMemo, useState, type FC } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Receipt, 
  Search, 
  Filter, 
  Calendar,
  CheckCircle2,
  ExternalLink,
  Target,
  ArrowUpRight,
  Clock
} from "lucide-react";
import { 
  Bet, 
  UserRole, 
  MOCK_BETS,
  MOCK_SHOPS
} from "../types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "../lib/apiClient";

// --- Modular Sub-components ---

const BetFilters = ({ q, setQ, statusFilter, setStatusFilter, typeFilter, setTypeFilter }: { 
  q: string,
  setQ: (v: string) => void,
  statusFilter: string, 
  setStatusFilter: (v: string) => void,
  typeFilter: string,
  setTypeFilter: (v: "all" | "online" | "shop") => void
}) => (
  <div className="flex flex-col md:flex-row gap-4 items-center bg-[#1A1A1A] p-4 rounded-2xl border border-zinc-800/50">
    <div className="relative flex-1 w-full font-sans">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
      <Input 
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="pl-12 bg-zinc-900 border-zinc-800 focus-visible:ring-brand h-12 text-sm rounded-xl text-white" 
        placeholder="Search by Ticket ID, User ID or Event..." 
      />
    </div>
    <div className="flex gap-4 w-full md:w-auto font-sans">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="bg-zinc-900 border-zinc-800 h-12 w-[160px] rounded-xl text-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="won">Won</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
            <SelectItem value="void">Void</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" className="border-zinc-800 text-zinc-400 rounded-xl h-12 hover:border-zinc-700 font-bold text-[10px] uppercase">
           <Filter className="w-4 h-4 mr-2" /> MORE FILTERS
        </Button>
    </div>
  </div>
);

const BetCard: FC<{ bet: Bet }> = ({ bet }) => (
  <Card key={bet.id} className="bg-[#1A1A1A] border-none shadow-xl overflow-hidden hover:bg-zinc-800/20 transition-all border border-transparent hover:border-zinc-800">
     <CardContent className="p-0">
         <div className="flex flex-col lg:flex-row">
            {/* Ticket Header (ID/Status) */}
            <div className="lg:w-48 bg-zinc-900/50 p-6 flex lg:flex-col justify-between items-start border-r border-zinc-800 shrink-0">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Ticket ID</p>
                        {bet.isOnline ? (
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[8px] h-4">ONLINE</Badge>
                        ) : (
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[8px] h-4">SHOP</Badge>
                        )}
                    </div>
                    <h3 className="text-lg font-display font-bold text-white mb-4 italic uppercase">#{bet.id.toUpperCase()}</h3>
                </div>
                <Badge className={`uppercase text-[10px] font-bold py-1 px-3 ${
                    bet.status === 'won' ? 'bg-emerald-500 text-black border-emerald-500' : 
                    bet.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                    'bg-zinc-800 text-zinc-400 border-zinc-700'
                }`}>
                    {bet.status}
                </Badge>
            </div>

            {/* Ticket Details */}
            <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-center">
                <div className="space-y-4">
                     <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                             <Target className="text-zinc-500 w-4 h-4" />
                         </div>
                         <div>
                             <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Events</p>
                             <p className="text-sm font-bold text-white leading-none mt-1">{bet.events[0].name}</p>
                         </div>
                     </div>
                     <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                             <CheckCircle2 className="text-zinc-500 w-4 h-4" />
                         </div>
                         <div>
                             <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Selection</p>
                             <p className="text-sm font-bold text-white leading-none mt-1">{bet.events[0].selection}</p>
                         </div>
                     </div>
                </div>

                <div className="flex justify-between md:justify-center items-center gap-12 lg:border-x border-zinc-800 px-8">
                     <div className="text-center">
                         <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 pl-1">Stake</p>
                         <p className="text-xl font-display font-bold text-white italic tracking-tighter">${bet.amount}</p>
                     </div>
                     <div className="text-center">
                         <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 pl-1">Pot. Payout</p>
                         <p className="text-xl font-display font-bold text-brand italic tracking-tighter">${bet.potentialPayout}</p>
                     </div>
                </div>

                <div className="flex justify-end items-center gap-4">
                     <div className="text-right hidden sm:block">
                         <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Placing Node</p>
                         <p className="text-xs text-white mt-1">
                             {bet.isOnline ? "VIRTUAL_GATEWAY" : `Shop#${bet.shopId?.split('_')[1]}`}
                         </p>
                     </div>
                     <Button variant="outline" size="icon" className="rounded-xl h-11 w-11 bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-brand hover:border-brand/40">
                         <ExternalLink className="w-4 h-4" />
                     </Button>
                     <Button className="rounded-xl h-11 px-6 bg-zinc-800 border-zinc-800 text-zinc-500 hover:text-white hover:bg-zinc-700 font-bold text-xs uppercase tracking-wider">
                         Audit
                     </Button>
                </div>
            </div>
         </div>
     </CardContent>
  </Card>
);

const AuditFooter = () => (
  <div className="bg-[#1A1A1A] p-8 rounded-2xl border border-zinc-800/50 flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl">
      <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center">
              <Receipt className="text-brand w-7 h-7" />
          </div>
          <div>
              <h3 className="text-xl font-display font-bold text-white italic uppercase tracking-tight">Audit Mode</h3>
              <p className="text-sm text-zinc-500">Enable advanced logs for deep-packet bet inspection.</p>
          </div>
      </div>
      <Button className="bg-zinc-900 border border-zinc-800 text-white hover:bg-zinc-800 rounded-xl px-10 h-14 font-bold shadow-lg uppercase tracking-widest text-xs">
          INITIALIZE LOG ANALYSIS
      </Button>
  </div>
);

// --- Main Page ---

export const BetManagementPage = ({ role }: { role: UserRole }) => {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "online" | "shop">("all");
  const [page, setPage] = useState(1);
  const limit = 25;
  const offset = (page - 1) * limit;

  const CURRENT_USER_ID = role === "SUPER_ADMIN" ? "u1" : role === "AGENT" ? "a1" : "s1";

  const listQuery = useQuery({
    queryKey: ["admin-bets", { q, page, statusFilter }],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("limit", String(limit));
      params.set("offset", String(offset));
      if (q.trim()) params.set("q", q.trim());
      if (statusFilter !== "all") params.set("result", statusFilter);
      return apiRequest<{ count: number; rows: any[] }>(`/api/admin/bets?${params.toString()}`);
    },
    staleTime: 5_000
  });

  const total = listQuery.data?.count || 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const filteredBets = useMemo(() => {
    const rows = listQuery.data?.rows || [];
    const mapped: Bet[] = rows.map((slip: any) => {
      const stake = Number(slip.stake || 0);
      const pot = Number(slip.potentialPayout || 0);
      const odds = stake > 0 ? pot / stake : 0;
      const sels = Array.isArray(slip.BetSelections) ? slip.BetSelections : [];
      const events = sels.slice(0, 3).map((s: any) => {
        const fx = s?.Outcome?.Market?.Fixture;
        const name = fx ? `${fx?.homeTeam?.name || ""} vs ${fx?.awayTeam?.name || ""}`.trim() : (s?.Outcome?.name || "Event");
        return { name, selection: s?.Outcome?.name || "-", odds: Number(s?.oddsAtPlacement || 0) };
      });
      return {
        id: slip.id,
        userId: slip.userId,
        shopId: slip.cashierId || undefined,
        isOnline: !slip.cashierId,
        amount: stake,
        potentialPayout: pot,
        odds,
        status: (slip.result || "pending") as any,
        events: events.length ? events : [{ name: "Ticket", selection: "-", odds }],
        created_at: slip.placedAt || slip.createdAt,
      };
    });

    let result = mapped;
    if (typeFilter === "online") result = result.filter((b) => b.isOnline);
    else if (typeFilter === "shop") result = result.filter((b) => !b.isOnline);

    // Keep legacy mock filtering for AGENT/SHOP_OWNER without breaking layout.
    if (role === "AGENT") {
      const agentShopIds = MOCK_SHOPS.filter((s) => s.agentId === CURRENT_USER_ID).map((s) => s.id);
      result = result.filter((b) => (b.shopId ? agentShopIds.includes(b.shopId) : true));
    } else if (role === "SHOP_OWNER") {
      const ownedShopId = MOCK_SHOPS.find((s) => s.ownerId === CURRENT_USER_ID)?.id;
      result = result.filter((b) => (b.shopId ? b.shopId === ownedShopId : true));
    }

    return result;
  }, [CURRENT_USER_ID, listQuery.data?.rows, role, typeFilter]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-white">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-white uppercase italic">
            Bet <span className="text-brand">Explorer</span>
          </h1>
          <p className="text-zinc-400 mt-1">Audit tickets from both physical shop terminals and online punters.</p>
        </div>
        <div className="flex gap-2">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-1 flex gap-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`text-[10px] uppercase font-bold px-4 h-9 ${typeFilter === 'all' ? 'bg-zinc-800 text-white shadow-inner' : 'text-zinc-500 hover:text-white'}`}
                  onClick={() => setTypeFilter("all")}
                >ALL</Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`text-[10px] uppercase font-bold px-4 h-9 ${typeFilter === 'online' ? 'bg-zinc-800 text-white shadow-inner' : 'text-zinc-500 hover:text-white'}`}
                  onClick={() => setTypeFilter("online")}
                >ONLINE</Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`text-[10px] uppercase font-bold px-4 h-9 ${typeFilter === 'shop' ? 'bg-zinc-800 text-white shadow-inner' : 'text-zinc-500 hover:text-white'}`}
                  onClick={() => setTypeFilter("shop")}
                >SHOP</Button>
            </div>
            <Button variant="outline" className="border-zinc-800 text-zinc-400 rounded-xl h-11 hover:bg-zinc-800/50 font-bold text-[10px] uppercase">
               <Calendar className="w-4 h-4 mr-2" /> DATE RANGE
            </Button>
        </div>
      </header>

      <BetFilters 
        q={q}
        setQ={(v) => {
          setPage(1);
          setQ(v);
        }}
        statusFilter={statusFilter} 
        setStatusFilter={setStatusFilter} 
        typeFilter={typeFilter} 
        setTypeFilter={setTypeFilter} 
      />

      <div className="grid grid-cols-1 gap-6">
        {listQuery.isLoading ? (
          <div className="text-zinc-500">Loading…</div>
        ) : (
          filteredBets.map((bet) => (
          <BetCard key={bet.id} bet={bet} />
          ))
        )}
      </div>

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

      <AuditFooter />
    </div>
  )
}
